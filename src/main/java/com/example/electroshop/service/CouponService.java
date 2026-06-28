package com.example.electroshop.service;

import com.example.electroshop.dto.CouponApplyResponse;
import com.example.electroshop.entity.Coupon;
import com.example.electroshop.repository.CouponRepository;
import com.example.electroshop.repository.OrderRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.Locale;

@Service
public class CouponService {

    private static final BigDecimal ONE_HUNDRED = new BigDecimal("100");

    private final CouponRepository couponRepository;
    private final OrderRepository orderRepository;

    public CouponService(
            CouponRepository couponRepository,
            OrderRepository orderRepository
    ) {
        this.couponRepository = couponRepository;
        this.orderRepository = orderRepository;
    }

    public List<Coupon> getAllCoupons() {
        return couponRepository.findAll();
    }

    public Coupon createCoupon(Coupon coupon) {
        validateAndNormalizeCoupon(coupon, null);

        coupon.setId(null);
        coupon.setUsedCount(0);

        return couponRepository.save(coupon);
    }

    public Coupon updateCoupon(
            Long id,
            Coupon coupon
    ) {
        Coupon existingCoupon =
                couponRepository
                        .findById(id)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Không tìm thấy mã giảm giá"
                                )
                        );

        validateAndNormalizeCoupon(coupon, id);

        existingCoupon.setCode(coupon.getCode());
        existingCoupon.setName(coupon.getName());
        existingCoupon.setDiscountType(coupon.getDiscountType());
        existingCoupon.setDiscountValue(coupon.getDiscountValue());
        existingCoupon.setMinOrderValue(coupon.getMinOrderValue());
        existingCoupon.setMaxDiscount(coupon.getMaxDiscount());
        existingCoupon.setStartDate(coupon.getStartDate());
        existingCoupon.setEndDate(coupon.getEndDate());
        existingCoupon.setUsageLimit(coupon.getUsageLimit());
        existingCoupon.setActive(coupon.getActive());

        if (existingCoupon.getUsedCount() == null) {
            existingCoupon.setUsedCount(0);
        }

        return couponRepository.save(existingCoupon);
    }

    public void deleteCoupon(Long id) {
        Coupon coupon =
                couponRepository
                        .findById(id)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Không tìm thấy mã giảm giá"
                                )
                        );

        int usedCount =
                coupon.getUsedCount() == null
                        ? 0
                        : coupon.getUsedCount();

        if (usedCount > 0) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Không thể xóa mã giảm giá vì đã có lượt sử dụng. Bạn nên tắt mã thay vì xóa."
            );
        }

        String code = coupon.getCode();

        if (
                code != null
                        &&
                !code.isBlank()
                        &&
                orderRepository.existsByCouponCodeIgnoreCase(code)
        ) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Không thể xóa mã giảm giá vì đã phát sinh đơn hàng. Bạn nên tắt mã thay vì xóa."
            );
        }

        couponRepository.delete(coupon);
    }

    public CouponApplyResponse calculateCoupon(
            String rawCode,
            BigDecimal rawOrderTotal
    ) {
        BigDecimal orderTotal =
                rawOrderTotal == null
                        ? BigDecimal.ZERO
                        : rawOrderTotal.max(BigDecimal.ZERO);

        if (rawCode == null || rawCode.trim().isEmpty()) {
            return invalid(
                    "Vui lòng nhập mã giảm giá",
                    orderTotal
            );
        }

        String code =
                rawCode
                        .trim()
                        .toUpperCase(Locale.ROOT);

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

        if (coupon.getActive() == null || !coupon.getActive()) {
            return invalid(
                    "Mã giảm giá đang bị tắt",
                    orderTotal
            );
        }

        LocalDate today = LocalDate.now();

        if (
                coupon.getStartDate() != null
                        &&
                today.isBefore(coupon.getStartDate())
        ) {
            return invalid(
                    "Mã giảm giá chưa đến thời gian áp dụng",
                    orderTotal
            );
        }

        if (
                coupon.getEndDate() != null
                        &&
                today.isAfter(coupon.getEndDate())
        ) {
            return invalid(
                    "Mã giảm giá đã hết hạn",
                    orderTotal
            );
        }

        BigDecimal minOrderValue =
                toBigDecimal(coupon.getMinOrderValue());

        if (orderTotal.compareTo(minOrderValue) < 0) {
            return invalid(
                    "Đơn hàng chưa đạt giá trị tối thiểu",
                    orderTotal
            );
        }

        int usedCount =
                coupon.getUsedCount() == null
                        ? 0
                        : coupon.getUsedCount();

        Integer usageLimit = coupon.getUsageLimit();

        if (
                usageLimit != null
                        &&
                usageLimit > 0
                        &&
                usedCount >= usageLimit
        ) {
            return invalid(
                    "Mã giảm giá đã hết lượt sử dụng",
                    orderTotal
            );
        }

        BigDecimal discountValue =
                toBigDecimal(coupon.getDiscountValue());

        if (discountValue.compareTo(BigDecimal.ZERO) <= 0) {
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
                                .toUpperCase(Locale.ROOT);

        if ("PERCENT".equals(discountType)) {
            discountAmount =
                    orderTotal
                            .multiply(discountValue)
                            .divide(
                                    ONE_HUNDRED,
                                    2,
                                    RoundingMode.HALF_UP
                            );

            BigDecimal maxDiscount =
                    toBigDecimal(coupon.getMaxDiscount());

            if (maxDiscount.compareTo(BigDecimal.ZERO) > 0) {
                discountAmount = discountAmount.min(maxDiscount);
            }
        } else if ("AMOUNT".equals(discountType)) {
            discountAmount = discountValue;
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
                        .subtract(discountAmount)
                        .max(BigDecimal.ZERO)
                        .setScale(
                                2,
                                RoundingMode.HALF_UP
                        );

        return CouponApplyResponse
                .builder()
                .valid(true)
                .message("Áp dụng mã giảm giá thành công")
                .code(coupon.getCode())
                .discountAmount(discountAmount.doubleValue())
                .finalTotal(finalTotal.doubleValue())
                .build();
    }

    private void validateAndNormalizeCoupon(
            Coupon coupon,
            Long currentId
    ) {
        if (coupon == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Dữ liệu mã giảm giá không hợp lệ"
            );
        }

        String code =
                requireText(
                        coupon.getCode(),
                        "Mã giảm giá không được để trống"
                )
                        .toUpperCase(Locale.ROOT);

        if (!code.matches("^[A-Z0-9_-]{3,30}$")) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Mã giảm giá chỉ được gồm chữ, số, dấu gạch ngang hoặc gạch dưới, từ 3 đến 30 ký tự"
            );
        }

        if (
                currentId == null
                        &&
                couponRepository.existsByCodeIgnoreCase(code)
        ) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Mã giảm giá đã tồn tại"
            );
        }

        if (
                currentId != null
                        &&
                couponRepository.existsByCodeIgnoreCaseAndIdNot(
                        code,
                        currentId
                )
        ) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Mã giảm giá đã tồn tại"
            );
        }

        String name =
                requireText(
                        coupon.getName(),
                        "Tên mã giảm giá không được để trống"
                );

        String discountType =
                requireText(
                        coupon.getDiscountType(),
                        "Loại giảm giá không được để trống"
                )
                        .toUpperCase(Locale.ROOT);

        if (
                !"PERCENT".equals(discountType)
                        &&
                !"AMOUNT".equals(discountType)
        ) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Loại giảm giá chỉ được là PERCENT hoặc AMOUNT"
            );
        }

        Double discountValue =
                coupon.getDiscountValue();

        if (
                discountValue == null
                        ||
                discountValue <= 0
        ) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Giá trị giảm phải lớn hơn 0"
            );
        }

        if (
                "PERCENT".equals(discountType)
                        &&
                discountValue > 100
        ) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Giá trị giảm theo phần trăm không được vượt quá 100"
            );
        }

        Double minOrderValue =
                defaultZero(coupon.getMinOrderValue());

        if (minOrderValue < 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Giá trị đơn hàng tối thiểu không được nhỏ hơn 0"
            );
        }

        Double maxDiscount =
                defaultZero(coupon.getMaxDiscount());

        if (maxDiscount < 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Mức giảm tối đa không được nhỏ hơn 0"
            );
        }

        Integer usageLimit =
                coupon.getUsageLimit() == null
                        ? 0
                        : coupon.getUsageLimit();

        if (usageLimit < 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Giới hạn lượt dùng không được nhỏ hơn 0"
            );
        }

        if (
                coupon.getStartDate() != null
                        &&
                coupon.getEndDate() != null
                        &&
                coupon.getStartDate().isAfter(coupon.getEndDate())
        ) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Ngày bắt đầu không được sau ngày kết thúc"
            );
        }

        coupon.setCode(code);
        coupon.setName(name);
        coupon.setDiscountType(discountType);
        coupon.setMinOrderValue(minOrderValue);
        coupon.setMaxDiscount(maxDiscount);
        coupon.setUsageLimit(usageLimit);
        coupon.setActive(
                coupon.getActive() == null
                        ? true
                        : coupon.getActive()
        );
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
                .finalTotal(orderTotal.doubleValue())
                .build();
    }

    private BigDecimal toBigDecimal(Double value) {
        if (value == null) {
            return BigDecimal.ZERO;
        }

        return BigDecimal.valueOf(value);
    }

    private Double defaultZero(Double value) {
        return value == null ? 0.0 : value;
    }

    private String requireText(
            String value,
            String message
    ) {
        if (value == null || value.trim().isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    message
            );
        }

        return value.trim();
    }
}