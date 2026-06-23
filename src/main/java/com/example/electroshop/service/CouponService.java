package com.example.electroshop.service;

import com.example.electroshop.dto.CouponApplyResponse;
import com.example.electroshop.entity.Coupon;
import com.example.electroshop.repository.CouponRepository;

import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;

@Service
public class CouponService {

    private static final BigDecimal ONE_HUNDRED =
            new BigDecimal("100");

    private final CouponRepository couponRepository;

    public CouponService(
            CouponRepository couponRepository
    ) {
        this.couponRepository =
                couponRepository;
    }

    public CouponApplyResponse calculateCoupon(
            String rawCode,
            BigDecimal rawOrderTotal
    ) {
        BigDecimal orderTotal =
                rawOrderTotal == null
                        ? BigDecimal.ZERO
                        : rawOrderTotal.max(
                                BigDecimal.ZERO
                        );

        if (
                rawCode == null ||
                rawCode.trim().isEmpty()
        ) {
            return invalid(
                    "Vui lòng nhập mã giảm giá",
                    orderTotal
            );
        }

        String code =
                rawCode.trim()
                        .toUpperCase();

        Coupon coupon =
                couponRepository
                        .findByCodeIgnoreCase(code)
                        .orElse(null);

        if (coupon == null) {
            return invalid(
                    "Mã giảm giá không tồn tại",
                    orderTotal
            );
        }

        if (
                coupon.getActive() == null ||
                !coupon.getActive()
        ) {
            return invalid(
                    "Mã giảm giá đang bị tắt",
                    orderTotal
            );
        }

        LocalDate today =
                LocalDate.now();

        if (
                coupon.getStartDate() != null &&
                today.isBefore(
                        coupon.getStartDate()
                )
        ) {
            return invalid(
                    "Mã giảm giá chưa đến thời gian áp dụng",
                    orderTotal
            );
        }

        if (
                coupon.getEndDate() != null &&
                today.isAfter(
                        coupon.getEndDate()
                )
        ) {
            return invalid(
                    "Mã giảm giá đã hết hạn",
                    orderTotal
            );
        }

        BigDecimal minOrderValue =
                toBigDecimal(
                        coupon.getMinOrderValue()
                );

        if (
                orderTotal.compareTo(
                        minOrderValue
                ) < 0
        ) {
            return invalid(
                    "Đơn hàng chưa đạt giá trị tối thiểu",
                    orderTotal
            );
        }

        int usedCount =
                coupon.getUsedCount() == null
                        ? 0
                        : coupon.getUsedCount();

        Integer usageLimit =
                coupon.getUsageLimit();

        if (
                usageLimit != null &&
                usageLimit > 0 &&
                usedCount >= usageLimit
        ) {
            return invalid(
                    "Mã giảm giá đã hết lượt sử dụng",
                    orderTotal
            );
        }

        BigDecimal discountValue =
                toBigDecimal(
                        coupon.getDiscountValue()
                );

        if (
                discountValue.compareTo(
                        BigDecimal.ZERO
                ) <= 0
        ) {
            return invalid(
                    "Giá trị mã giảm giá không hợp lệ",
                    orderTotal
            );
        }

        BigDecimal discountAmount;

        String discountType =
                coupon.getDiscountType() == null
                        ? ""
                        : coupon
                                .getDiscountType()
                                .trim()
                                .toUpperCase();

        if (
                "PERCENT".equals(
                        discountType
                )
        ) {
            discountAmount =
                    orderTotal
                            .multiply(
                                    discountValue
                            )
                            .divide(
                                    ONE_HUNDRED,
                                    2,
                                    RoundingMode.HALF_UP
                            );

            BigDecimal maxDiscount =
                    toBigDecimal(
                            coupon.getMaxDiscount()
                    );

            if (
                    maxDiscount.compareTo(
                            BigDecimal.ZERO
                    ) > 0
            ) {
                discountAmount =
                        discountAmount.min(
                                maxDiscount
                        );
            }

        } else if (
                "AMOUNT".equals(
                        discountType
                )
        ) {
            discountAmount =
                    discountValue;

        } else {
            return invalid(
                    "Loại mã giảm giá không hợp lệ",
                    orderTotal
            );
        }

        discountAmount =
                discountAmount
                        .max(BigDecimal.ZERO)
                        .min(orderTotal)
                        .setScale(
                                2,
                                RoundingMode.HALF_UP
                        );

        BigDecimal finalTotal =
                orderTotal
                        .subtract(
                                discountAmount
                        )
                        .max(BigDecimal.ZERO)
                        .setScale(
                                2,
                                RoundingMode.HALF_UP
                        );

        return CouponApplyResponse
                .builder()
                .valid(true)
                .message(
                        "Áp dụng mã giảm giá thành công"
                )
                .code(coupon.getCode())
                .discountAmount(
                        discountAmount.doubleValue()
                )
                .finalTotal(
                        finalTotal.doubleValue()
                )
                .build();
    }

    private CouponApplyResponse invalid(
            String message,
            BigDecimal orderTotal
    ) {
        return CouponApplyResponse
                .builder()
                .valid(false)
                .message(message)
                .discountAmount(0.0)
                .finalTotal(
                        orderTotal.doubleValue()
                )
                .build();
    }

    private BigDecimal toBigDecimal(
            Double value
    ) {
        if (value == null) {
            return BigDecimal.ZERO;
        }

        return BigDecimal.valueOf(value);
    }
}