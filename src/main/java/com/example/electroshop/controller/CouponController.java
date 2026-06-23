package com.example.electroshop.controller;

import com.example.electroshop.dto.CouponApplyRequest;
import com.example.electroshop.dto.CouponApplyResponse;
import com.example.electroshop.entity.Coupon;
import com.example.electroshop.repository.CouponRepository;
import com.example.electroshop.service.CouponService;

import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/coupons")
@CrossOrigin("*")
public class CouponController {

    private final CouponRepository couponRepository;

    private final CouponService couponService;

    public CouponController(
            CouponRepository couponRepository,
            CouponService couponService
    ) {
        this.couponRepository =
                couponRepository;

        this.couponService =
                couponService;
    }

    @GetMapping
    public List<Coupon> getAllCoupons() {
        return couponRepository.findAll();
    }

    @PostMapping
    public Coupon createCoupon(
            @RequestBody Coupon coupon
    ) {
        if (coupon.getUsedCount() == null) {
            coupon.setUsedCount(0);
        }

        return couponRepository.save(coupon);
    }

    @PutMapping("/{id}")
    public Coupon updateCoupon(
            @PathVariable Long id,
            @RequestBody Coupon coupon
    ) {
        Coupon oldCoupon =
                couponRepository.findById(id)
                        .orElseThrow();

        oldCoupon.setCode(
                coupon.getCode()
        );

        oldCoupon.setName(
                coupon.getName()
        );

        oldCoupon.setDiscountType(
                coupon.getDiscountType()
        );

        oldCoupon.setDiscountValue(
                coupon.getDiscountValue()
        );

        oldCoupon.setMinOrderValue(
                coupon.getMinOrderValue()
        );

        oldCoupon.setMaxDiscount(
                coupon.getMaxDiscount()
        );

        oldCoupon.setStartDate(
                coupon.getStartDate()
        );

        oldCoupon.setEndDate(
                coupon.getEndDate()
        );

        oldCoupon.setUsageLimit(
                coupon.getUsageLimit()
        );

        oldCoupon.setUsedCount(
                coupon.getUsedCount()
        );

        oldCoupon.setActive(
                coupon.getActive()
        );

        return couponRepository.save(oldCoupon);
    }

    @DeleteMapping("/{id}")
    public void deleteCoupon(
            @PathVariable Long id
    ) {
        couponRepository.deleteById(id);
    }

    @PostMapping("/apply")
    public CouponApplyResponse applyCoupon(
            @RequestBody
            CouponApplyRequest request
    ) {
        BigDecimal orderTotal =
                request.getOrderTotal() == null
                        ? BigDecimal.ZERO
                        : BigDecimal.valueOf(
                                request.getOrderTotal()
                        );

        return couponService
                .calculateCoupon(
                        request.getCode(),
                        orderTotal
                );
    }
}