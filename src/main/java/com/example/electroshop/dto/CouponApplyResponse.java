package com.example.electroshop.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CouponApplyResponse {

    private Boolean valid;

    private String message;

    private String code;

    private Double discountAmount;

    private Double finalTotal;
}