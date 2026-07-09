package com.example.electroshop.dto;

import com.example.electroshop.entity.ProductImage;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductResponse {

    private Long id;

    private String name;

    private BigDecimal price;

    private String image;

    private String description;

    private Integer stock;

    private Integer soldQuantity;

    private String category;

    private String brand;

    private String specifications;

    private String highlights;

    private String promotions;

    private String options;

    private List<ProductImage> images;

    private Double averageRating;

    private Long totalReviews;
}
