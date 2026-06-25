package com.example.electroshop.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "home_section_banners")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HomeSectionBanner {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /*
     * ID của khối cha HomeSection
     */
    private Long homeSectionId;

    @Column(length = 1000)
    private String imageUrl;

    private String title;

    @Column(length = 1000)
    private String subtitle;

    /*
     * COLLECTION: click ra trang danh sách sản phẩm của banner
     * PRODUCT: click ra trang chi tiết sản phẩm
     * CUSTOM_LINK: click theo link tự nhập
     */
    @Builder.Default
    private String targetType = "COLLECTION";

    @Column(length = 1000)
    private String targetUrl;

    /*
     * Dùng cho kiểu 3: PRODUCT_BANNER_SLIDER
     */
    private Long targetProductId;

    /*
     * Dùng để gom banner thành từng slide.
     *
     * Kiểu 1:
     * slideGroup = 1, 2, 3...
     *
     * Kiểu 2:
     * slideGroup = 1 gồm LEFT + RIGHT
     * slideGroup = 2 gồm LEFT + RIGHT
     */
    @Builder.Default
    private Integer slideGroup = 1;

    /*
     * Dùng cho kiểu 2:
     * LEFT hoặc RIGHT
     */
    private String position;

    @Builder.Default
    private Integer sortOrder = 1;

    @Builder.Default
    private Boolean active = true;
}