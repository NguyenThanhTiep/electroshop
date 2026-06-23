package com.example.electroshop.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CouponApplyRequest {

    private String code;

    private Double orderTotal;
}