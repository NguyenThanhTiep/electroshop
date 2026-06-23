package com.example.electroshop.controller;

import com.example.electroshop.dto.checkout.CheckoutRequest;
import com.example.electroshop.dto.checkout.CheckoutResponse;
import com.example.electroshop.service.CheckoutService;

import jakarta.servlet.http.HttpServletRequest;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/checkout")
@CrossOrigin(origins = "http://localhost:5173")
public class CheckoutController {

    private final CheckoutService checkoutService;

    public CheckoutController(
            CheckoutService checkoutService
    ) {
        this.checkoutService =
                checkoutService;
    }

    @PostMapping
    public ResponseEntity<CheckoutResponse> checkout(
            @RequestBody CheckoutRequest request,
            HttpServletRequest httpRequest
    ) {
        String clientIp =
                getClientIp(httpRequest);

        CheckoutResponse response =
                checkoutService.checkout(
                        request,
                        clientIp
                );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    private String getClientIp(
            HttpServletRequest request
    ) {
        String forwardedFor =
                request.getHeader(
                        "X-Forwarded-For"
                );

        if (
            forwardedFor != null &&
            !forwardedFor.isBlank()
        ) {
            return forwardedFor
                    .split(",")[0]
                    .trim();
        }

        String realIp =
                request.getHeader(
                        "X-Real-IP"
                );

        if (
            realIp != null &&
            !realIp.isBlank()
        ) {
            return realIp.trim();
        }

        return request.getRemoteAddr();
    }
}