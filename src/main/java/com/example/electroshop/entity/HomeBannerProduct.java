package com.example.electroshop.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "home_banner_products")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HomeBannerProduct {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /*
     * ID của banner
     */
    private Long bannerId;

    /*
     * ID sản phẩm được gắn vào banner
     */
    private Long productId;

    @Builder.Default
    private Integer sortOrder = 1;
}