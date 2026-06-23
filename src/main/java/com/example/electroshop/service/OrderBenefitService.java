package com.example.electroshop.service;

import com.example.electroshop.entity.Coupon;
import com.example.electroshop.entity.FlashSaleItem;
import com.example.electroshop.entity.Order;
import com.example.electroshop.entity.OrderItem;
import com.example.electroshop.repository.CouponRepository;
import com.example.electroshop.repository.FlashSaleItemRepository;
import com.example.electroshop.repository.OrderRepository;

import jakarta.transaction.Transactional;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class OrderBenefitService {

    private final OrderRepository
            orderRepository;

    private final FlashSaleItemRepository
            flashSaleItemRepository;

    private final CouponRepository
            couponRepository;

    public OrderBenefitService(
            OrderRepository orderRepository,
            FlashSaleItemRepository
                    flashSaleItemRepository,
            CouponRepository couponRepository
    ) {
        this.orderRepository =
                orderRepository;

        this.flashSaleItemRepository =
                flashSaleItemRepository;

        this.couponRepository =
                couponRepository;
    }

    /*
     * Tăng:
     * - soldQuantity của Flash Sale
     * - usedCount của Coupon
     *
     * Chỉ thực hiện một lần cho mỗi đơn.
     */
    @Transactional
    public void commitBenefits(
            Long orderId
    ) {
        Order order =
                orderRepository
                        .findByIdForUpdate(orderId)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Không tìm thấy đơn hàng"
                                )
                        );

        /*
         * Callback VNPAY có thể gọi nhiều lần.
         * Nếu đã cập nhật thì dừng ngay.
         */
        if (
                Boolean.TRUE.equals(
                        order.getBenefitsCommitted()
                )
        ) {
            return;
        }

        /*
         * BƯỚC 2:
         * Tăng soldQuantity Flash Sale.
         */
        if (order.getItems() != null) {
            for (
                OrderItem orderItem
                : order.getItems()
            ) {
                Long flashSaleItemId =
                        orderItem
                                .getFlashSaleItemId();

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

                int currentSold =
                        flashSaleItem
                                .getSoldQuantity() == null
                                ? 0
                                : flashSaleItem
                                        .getSoldQuantity();

                int orderQuantity =
                        orderItem.getQuantity() == null
                                ? 0
                                : orderItem.getQuantity();

                int newSold =
                        currentSold +
                        orderQuantity;

                Integer saleQuantity =
                        flashSaleItem
                                .getSaleQuantity();

                if (
                        saleQuantity != null &&
                        saleQuantity > 0 &&
                        newSold > saleQuantity
                ) {
                    throw new ResponseStatusException(
                            HttpStatus.CONFLICT,
                            "Số lượng Flash Sale không còn đủ"
                    );
                }

                flashSaleItem.setSoldQuantity(
                        newSold
                );

                flashSaleItemRepository.save(
                        flashSaleItem
                );
            }
        }

        /*
         * BƯỚC 3:
         * Tăng usedCount Coupon.
         */
        String couponCode =
                order.getCouponCode();

        if (
                couponCode != null &&
                !couponCode.isBlank()
        ) {
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

            /*
             * Coupon đã được xác minh tại Checkout.
             * Ở đây chỉ ghi nhận lượt sử dụng.
             */
            coupon.setUsedCount(
                    currentUsed + 1
            );

            couponRepository.save(coupon);
        }

        order.setBenefitsCommitted(
                true
        );

        order.setBenefitsReleased(
                false
        );

        orderRepository.save(order);
    }
}