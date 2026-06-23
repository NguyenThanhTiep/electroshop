package com.example.electroshop.service;

import com.example.electroshop.entity.Order;
import com.example.electroshop.entity.OrderItem;
import com.example.electroshop.entity.Payment;
import com.example.electroshop.entity.Product;

import com.example.electroshop.entity.enums.OrderStatus;
import com.example.electroshop.entity.enums.PaymentMethod;
import com.example.electroshop.entity.enums.PaymentStatus;

import com.example.electroshop.repository.OrderRepository;
import com.example.electroshop.repository.PaymentRepository;
import com.example.electroshop.repository.ProductRepository;
import com.example.electroshop.repository.UserRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;

@Service
public class OrderService {

    private final OrderRepository
            orderRepository;

    private final ProductRepository
            productRepository;

    private final PaymentRepository
            paymentRepository;

    private final UserRepository
            userRepository;

    public OrderService(
            OrderRepository orderRepository,
            ProductRepository productRepository,
            PaymentRepository paymentRepository,
            UserRepository userRepository
    ) {
        this.orderRepository =
                orderRepository;

        this.productRepository =
                productRepository;

        this.paymentRepository =
                paymentRepository;

        this.userRepository =
                userRepository;
    }

    /*
     * Admin lấy toàn bộ đơn hàng.
     */
    @Transactional(readOnly = true)
    public List<Order> getAllOrders() {
        return orderRepository
                .findAllWithItems();
    }

    /*
     * BƯỚC 4:
     * Người dùng chỉ xem đơn của mình.
     */
    @Transactional(readOnly = true)
    public List<Order> getOrdersByUser(
            Long userId
    ) {
        validateUserExists(userId);

        return orderRepository
                .findByUserIdOrderByCreatedAtDesc(
                        userId
                );
    }

    /*
     * Người dùng chỉ xem chi tiết đơn
     * thuộc chính tài khoản đó.
     */
    @Transactional(readOnly = true)
    public Order getOrderByUser(
            Long orderId,
            Long userId
    ) {
        validateUserExists(userId);

        return orderRepository
                .findByIdAndUserIdWithItems(
                        orderId,
                        userId
                )
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Không tìm thấy đơn hàng của tài khoản này"
                        )
                );
    }

    /*
     * Admin xem chi tiết bất kỳ đơn nào.
     */
    @Transactional(readOnly = true)
    public Order getOrderById(
            Long orderId
    ) {
        return orderRepository
                .findByIdWithItems(
                        orderId
                )
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Không tìm thấy đơn hàng"
                        )
                );
    }

    /*
     * BƯỚC 5:
     * Admin cập nhật trạng thái đơn.
     */
    @Transactional
    public Order updateOrderStatus(
            Long orderId,
            OrderStatus newStatus
    ) {
        if (newStatus == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Trạng thái mới không hợp lệ"
            );
        }

        Order order =
                findOrderForUpdate(
                        orderId
                );

        OrderStatus currentStatus =
                order.getOrderStatus();

        /*
         * Gửi cùng trạng thái thì
         * không cần cập nhật.
         */
        if (currentStatus == newStatus) {
            return order;
        }

        /*
         * Admin hủy đơn cũng phải
         * đi qua logic hoàn tồn kho.
         */
        if (
                newStatus ==
                OrderStatus.CANCELLED
        ) {
            return cancelLockedOrder(
                    order
            );
        }

        if (
                !isValidTransition(
                        currentStatus,
                        newStatus
                )
        ) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Không thể chuyển trạng thái từ "
                            + currentStatus
                            + " sang "
                            + newStatus
            );
        }

        /*
         * Không cho hoàn thành đơn VNPAY
         * khi chưa thanh toán thành công.
         */
        if (
                newStatus ==
                        OrderStatus.COMPLETED &&
                order.getPaymentMethod()
                        == PaymentMethod.VNPAY &&
                order.getPaymentStatus()
                        != PaymentStatus.PAID
        ) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Đơn VNPAY chưa thanh toán thành công"
            );
        }

        order.setOrderStatus(
                newStatus
        );

        /*
         * COD chỉ được xem là đã thanh toán
         * khi giao thành công.
         */
        if (
                newStatus ==
                        OrderStatus.COMPLETED &&
                order.getPaymentMethod()
                        == PaymentMethod.COD
        ) {
            order.setPaymentStatus(
                    PaymentStatus.PAID
            );
        }

        return orderRepository.save(
                order
        );
    }

    /*
     * BƯỚC 6:
     * Khách hàng hủy đơn của chính mình.
     */
    @Transactional
    public Order cancelOrderByUser(
            Long orderId,
            Long userId
    ) {
        validateUserExists(userId);

        Order order =
                findOrderForUpdate(
                        orderId
                );

        if (
                !Objects.equals(
                        order.getUserId(),
                        userId
                )
        ) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Bạn không có quyền hủy đơn hàng này"
            );
        }

        return cancelLockedOrder(
                order
        );
    }

    /*
     * Hàm hủy dùng chung cho:
     * - khách hàng;
     * - admin.
     */
    private Order cancelLockedOrder(
            Order order
    ) {
        if (
                order.getOrderStatus()
                        == OrderStatus.CANCELLED
        ) {
            /*
             * Đã hủy rồi thì không
             * hoàn kho lần thứ hai.
             */
            return order;
        }

        if (
                !canCancel(
                        order.getOrderStatus()
                )
        ) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Đơn hàng ở trạng thái "
                            + order.getOrderStatus()
                            + " không thể hủy"
            );
        }

        /*
         * Không cho hủy trực tiếp đơn VNPAY
         * đã thanh toán vì chưa làm hoàn tiền.
         */
        if (
                order.getPaymentMethod()
                        == PaymentMethod.VNPAY &&
                order.getPaymentStatus()
                        == PaymentStatus.PAID
        ) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Đơn hàng đã thanh toán qua VNPAY. "
                            + "Vui lòng liên hệ cửa hàng để được hỗ trợ."
            );
        }

        releaseStock(order);

        order.setOrderStatus(
                OrderStatus.CANCELLED
        );

        order.setExpiresAt(null);

        /*
         * VNPAY chưa thanh toán
         * chuyển thành FAILED.
         */
        if (
                order.getPaymentMethod()
                        == PaymentMethod.VNPAY &&
                order.getPaymentStatus()
                        != PaymentStatus.PAID
        ) {
            order.setPaymentStatus(
                    PaymentStatus.FAILED
            );

            markPaymentsFailed(
                    order
            );
        }

        return orderRepository.save(
                order
        );
    }

    /*
     * Cộng lại tồn kho đúng một lần.
     */
    private void releaseStock(
            Order order
    ) {
        if (
                Boolean.TRUE.equals(
                        order.getStockReleased()
                )
        ) {
            return;
        }

        List<OrderItem> items =
                new ArrayList<>(
                        order.getItems()
                );

        /*
         * Khóa sản phẩm theo thứ tự ID
         * để giảm nguy cơ deadlock.
         */
        items.sort(
                Comparator.comparing(
                        OrderItem::getProductId
                )
        );

        for (OrderItem item : items) {

            Product product =
                    productRepository
                            .findByIdForUpdate(
                                    item.getProductId()
                            )
                            .orElseThrow(() ->
                                    new ResponseStatusException(
                                            HttpStatus.CONFLICT,
                                            "Không tìm thấy sản phẩm ID: "
                                                    + item.getProductId()
                                    )
                            );

            int currentStock =
                    product.getStock() == null
                            ? 0
                            : product.getStock();

            int quantity =
                    item.getQuantity() == null
                            ? 0
                            : item.getQuantity();

            product.setStock(
                    currentStock + quantity
            );

            productRepository.save(
                    product
            );
        }

        order.setStockReleased(
                true
        );
    }

    /*
     * Khi hủy đơn VNPAY chưa thanh toán,
     * chuyển Payment sang FAILED.
     */
    private void markPaymentsFailed(
            Order order
    ) {
        List<Payment> payments =
                paymentRepository
                        .findByOrderIdOrderByCreatedAtDesc(
                                order.getId()
                        );

        for (Payment payment : payments) {

            if (
                    payment.getStatus()
                            == PaymentStatus.UNPAID ||
                    payment.getStatus()
                            == PaymentStatus.PROCESSING
            ) {
                payment.setStatus(
                        PaymentStatus.FAILED
                );

                payment.setFailureReason(
                        "Đơn hàng đã bị hủy"
                );
            }
        }

        paymentRepository.saveAll(
                payments
        );
    }

    /*
     * Khách/Admin chỉ được hủy
     * trước khi cửa hàng xác nhận.
     */
    private boolean canCancel(
            OrderStatus status
    ) {
        return status ==
                    OrderStatus.WAITING_PAYMENT ||
                status ==
                    OrderStatus.PENDING_CONFIRMATION;
    }

    /*
     * Quy trình trạng thái hợp lệ.
     */
    private boolean isValidTransition(
            OrderStatus currentStatus,
            OrderStatus newStatus
    ) {
        return switch (currentStatus) {

            case PENDING_CONFIRMATION ->
                    newStatus ==
                            OrderStatus.CONFIRMED;

            case CONFIRMED ->
                    newStatus ==
                            OrderStatus.PREPARING ||
                    newStatus ==
                            OrderStatus.SHIPPING;

            case PREPARING ->
                    newStatus ==
                            OrderStatus.SHIPPING;

            case SHIPPING ->
                    newStatus ==
                            OrderStatus.COMPLETED;

            default -> false;
        };
    }

    private Order findOrderForUpdate(
            Long orderId
    ) {
        return orderRepository
                .findByIdForUpdate(
                        orderId
                )
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Không tìm thấy đơn hàng"
                        )
                );
    }

    private void validateUserExists(
            Long userId
    ) {
        if (
                userId == null ||
                !userRepository.existsById(
                        userId
                )
        ) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Tài khoản không tồn tại"
            );
        }
    }
}