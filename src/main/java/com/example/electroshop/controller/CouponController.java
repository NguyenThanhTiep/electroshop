package com.example.electroshop.controller;

import com.example.electroshop.dto.CouponApplyRequest;
import com.example.electroshop.dto.CouponApplyResponse;
import com.example.electroshop.entity.Coupon;
import com.example.electroshop.service.CouponService;

import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/coupons")
@CrossOrigin("*")
public class CouponController {

    private final CouponService couponService;

    public CouponController(CouponService couponService) {
        this.couponService = couponService;
    }

    @GetMapping
    public List<Coupon> getAllCoupons() {
        return couponService.getAllCoupons();
    }

    @PostMapping
    public Coupon createCoupon(
            @RequestBody Coupon coupon
    ) {
        return couponService.createCoupon(coupon);
    }

    @PutMapping("/{id}")
    public Coupon updateCoupon(
            @PathVariable Long id,
            @RequestBody Coupon coupon
    ) {
        return couponService.updateCoupon(id, coupon);
    }

    @DeleteMapping("/{id}")
    public void deleteCoupon(
            @PathVariable Long id
    ) {
        couponService.deleteCoupon(id);
    }

    @PostMapping("/apply")
    public CouponApplyResponse applyCoupon(
            @RequestBody CouponApplyRequest request
    ) {
        BigDecimal orderTotal =
                request.getOrderTotal() == null
                        ? BigDecimal.ZERO
                        : BigDecimal.valueOf(
                                request.getOrderTotal()
                        );

        return couponService.calculateCoupon(
                request.getCode(),
                orderTotal
        );
    }
}