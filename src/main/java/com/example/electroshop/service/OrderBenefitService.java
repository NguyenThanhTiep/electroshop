package com.example.electroshop.service;

import com.example.electroshop.entity.Coupon;
import com.example.electroshop.entity.FlashSaleItem;
import com.example.electroshop.entity.Order;
import com.example.electroshop.entity.OrderItem;
import com.example.electroshop.entity.Product;
import com.example.electroshop.repository.CouponRepository;
import com.example.electroshop.repository.FlashSaleItemRepository;
import com.example.electroshop.repository.OrderRepository;
import com.example.electroshop.repository.ProductRepository;

import jakarta.transaction.Transactional;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
public class OrderBenefitService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final FlashSaleItemRepository flashSaleItemRepository;
    private final CouponRepository couponRepository;

    public OrderBenefitService(
            OrderRepository orderRepository,
            ProductRepository productRepository,
            FlashSaleItemRepository flashSaleItemRepository,
            CouponRepository couponRepository
    ) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
        this.flashSaleItemRepository = flashSaleItemRepository;
        this.couponRepository = couponRepository;
    }

    /*
     * Tăng:
     * - soldQuantity tổng của Product
     * - soldQuantity riêng của Flash Sale nếu có
     * - usedCount của Coupon nếu có
     *
     * Chỉ thực hiện một lần cho mỗi đơn.
     */
    @Transactional
    public void commitBenefits(Long orderId) {

        Order order =
                orderRepository
                        .findByIdForUpdate(orderId)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Không tìm thấy đơn hàng"
                                )
                        );

        if (Boolean.TRUE.equals(order.getBenefitsCommitted())) {
            return;
        }

        if (order.getItems() != null) {

            List<OrderItem> items =
                    new ArrayList<>(order.getItems());

            items.sort(
                    Comparator.comparing(OrderItem::getProductId)
            );

            for (OrderItem orderItem : items) {

                int orderQuantity =
                        orderItem.getQuantity() == null
                                ? 0
                                : orderItem.getQuantity();

                if (orderQuantity <= 0) {
                    continue;
                }

                /*
                 * 1. Tăng soldQuantity tổng của Product
                 * Áp dụng cho mọi sản phẩm:
                 * - sản phẩm thường
                 * - sản phẩm promotion
                 * - sản phẩm flash sale
                 */
                Product product =
                        productRepository
                                .findByIdForUpdate(
                                        orderItem.getProductId()
                                )
                                .orElseThrow(() ->
                                        new ResponseStatusException(
                                                HttpStatus.CONFLICT,
                                                "Không tìm thấy sản phẩm ID: "
                                                        + orderItem.getProductId()
                                        )
                                );

                int currentProductSold =
                        product.getSoldQuantity() == null
                                ? 0
                                : product.getSoldQuantity();

                product.setSoldQuantity(
                        currentProductSold + orderQuantity
                );

                productRepository.save(product);

                /*
                 * 2. Nếu sản phẩm thuộc Flash Sale
                 * thì tăng thêm soldQuantity riêng của Flash Sale.
                 */
                Long flashSaleItemId =
                        orderItem.getFlashSaleItemId();

                if (flashSaleItemId == null) {
                    continue;
                }

                FlashSaleItem flashSaleItem =
                        flashSaleItemRepository
                                .findByIdForUpdate(
                                        flashSaleItemId
                                )
                                .orElseThrow(() ->
                                        new ResponseStatusException(
                                                HttpStatus.CONFLICT,
                                                "Không tìm thấy sản phẩm Flash Sale"
                                        )
                                );

                int currentFlashSaleSold =
                        flashSaleItem.getSoldQuantity() == null
                                ? 0
                                : flashSaleItem.getSoldQuantity();

                int newFlashSaleSold =
                        currentFlashSaleSold + orderQuantity;

                Integer saleQuantity =
                        flashSaleItem.getSaleQuantity();

                if (
                        saleQuantity != null
                                && saleQuantity > 0
                                && newFlashSaleSold > saleQuantity
                ) {
                    throw new ResponseStatusException(
                            HttpStatus.CONFLICT,
                            "Số lượng Flash Sale không còn đủ"
                    );
                }

                flashSaleItem.setSoldQuantity(
                        newFlashSaleSold
                );

                flashSaleItemRepository.save(
                        flashSaleItem
                );
            }
        }

        /*
         * 3. Tăng usedCount Coupon nếu đơn có dùng mã.
         */
        String couponCode = order.getCouponCode();

        if (couponCode != null && !couponCode.isBlank()) {

            Coupon coupon =
                    couponRepository
                            .findByCodeIgnoreCaseForUpdate(
                                    couponCode
                            )
                            .orElseThrow(() ->
                                    new ResponseStatusException(
                                            HttpStatus.CONFLICT,
                                            "Không tìm thấy mã giảm giá của đơn hàng"
                                    )
                            );

            int currentUsed =
                    coupon.getUsedCount() == null
                            ? 0
                            : coupon.getUsedCount();

            coupon.setUsedCount(
                    currentUsed + 1
            );

            couponRepository.save(coupon);
        }

        order.setBenefitsCommitted(true);
        order.setBenefitsReleased(false);

        orderRepository.save(order);
    }

    /*
     * Hoàn lại soldQuantity / usedCount khi đơn bị hủy.
     */
    @Transactional
    public void releaseBenefits(Long orderId) {

        Order order =
                orderRepository
                        .findByIdForUpdate(orderId)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Không tìm thấy đơn hàng"
                                )
                        );

        if (!Boolean.TRUE.equals(order.getBenefitsCommitted())) {
            return;
        }

        if (Boolean.TRUE.equals(order.getBenefitsReleased())) {
            return;
        }

        if (order.getItems() != null) {

            List<OrderItem> items =
                    new ArrayList<>(order.getItems());

            items.sort(
                    Comparator.comparing(OrderItem::getProductId)
            );

            for (OrderItem orderItem : items) {

                int orderQuantity =
                        orderItem.getQuantity() == null
                                ? 0
                                : orderItem.getQuantity();

                if (orderQuantity <= 0) {
                    continue;
                }

                Product product =
                        productRepository
                                .findByIdForUpdate(
                                        orderItem.getProductId()
                                )
                                .orElseThrow(() ->
                                        new ResponseStatusException(
                                                HttpStatus.CONFLICT,
                                                "Không tìm thấy sản phẩm ID: "
                                                        + orderItem.getProductId()
                                        )
                                );

                int currentProductSold =
                        product.getSoldQuantity() == null
                                ? 0
                                : product.getSoldQuantity();

                product.setSoldQuantity(
                        Math.max(
                                0,
                                currentProductSold - orderQuantity
                        )
                );

                productRepository.save(product);

                Long flashSaleItemId =
                        orderItem.getFlashSaleItemId();

                if (flashSaleItemId != null) {

                    FlashSaleItem flashSaleItem =
                            flashSaleItemRepository
                                    .findByIdForUpdate(
                                            flashSaleItemId
                                    )
                                    .orElseThrow(() ->
                                            new ResponseStatusException(
                                                    HttpStatus.CONFLICT,
                                                    "Không tìm thấy sản phẩm Flash Sale"
                                            )
                                    );

                    int currentFlashSaleSold =
                            flashSaleItem.getSoldQuantity() == null
                                    ? 0
                                    : flashSaleItem.getSoldQuantity();

                    flashSaleItem.setSoldQuantity(
                            Math.max(
                                    0,
                                    currentFlashSaleSold - orderQuantity
                            )
                    );

                    flashSaleItemRepository.save(
                            flashSaleItem
                    );
                }
            }
        }

        String couponCode = order.getCouponCode();

        if (couponCode != null && !couponCode.isBlank()) {

            Coupon coupon =
                    couponRepository
                            .findByCodeIgnoreCaseForUpdate(
                                    couponCode
                            )
                            .orElseThrow(() ->
                                    new ResponseStatusException(
                                            HttpStatus.CONFLICT,
                                            "Không tìm thấy mã giảm giá của đơn hàng"
                                    )
                            );

            int currentUsed =
                    coupon.getUsedCount() == null
                            ? 0
                            : coupon.getUsedCount();

            coupon.setUsedCount(
                    Math.max(0, currentUsed - 1)
            );

            couponRepository.save(coupon);
        }

        order.setBenefitsReleased(true);

        orderRepository.save(order);
    }
}