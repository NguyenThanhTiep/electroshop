package com.example.electroshop.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "banner_products")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BannerProduct {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long bannerId;

    private Long productId;

    @Builder.Default
    private Integer sortOrder = 1;
}
