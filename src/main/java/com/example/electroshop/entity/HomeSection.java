package com.example.electroshop.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "home_sections")

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder

public class HomeSection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    private String sectionType;

    private String category;

    private String brand;

    private Long productId;

    private String badgeText;

    @Column(length = 1000)
    private String shortDescription;

    @Column(length = 1000)
    private String bannerImage;

    private String bannerLink;

    @Column(length = 1000)
    private String leftBannerImage;

    @Column(length = 1000)
    private String leftBannerLink;

    private Integer productRows;

    private Integer limitProduct;

    private Integer sortOrder;

    private Boolean active;

    private String dealEndTime;

    private String dealSubtitle;

    private String dealTheme;

    // Dùng cho khối sản phẩm dạng tab
    private String groupCode;

    private String tabTitle;

    private Integer tabOrder;
}