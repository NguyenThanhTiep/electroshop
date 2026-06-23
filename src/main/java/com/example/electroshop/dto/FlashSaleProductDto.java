package com.example.electroshop.dto;

import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FlashSaleProductDto {

    private Long itemId;

    private Long productId;

    private String productName;

    private String image;

    private String brand;

    private String category;

    private String description;

    private BigDecimal originalPrice;

    private BigDecimal salePrice;

    private Integer discountPercent;

    private Integer saleQuantity;

    private Integer soldQuantity;

    private Integer soldPercent;

    private Integer limitPerUser;
}