package com.example.electroshop.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "banners")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Banner {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    private String subtitle;

    @Column(length = 1000)
    private String imageUrl;

    @Column(length = 10000)
    private String linkUrl;

    private String position;

    private Boolean active;

    private Integer sortOrder;

    @Builder.Default
    private Boolean showTitle = false;

    @Builder.Default
    private Boolean showSubtitle = false;

    /*
     * COLLECTION: click ra danh sách sản phẩm
     * PRODUCT: click ra chi tiết sản phẩm
     * CUSTOM_LINK: click theo link tự nhập
     */
    @Builder.Default
    private String targetType = "COLLECTION";

    @Column(length = 10000)
    private String targetUrl;

    private Long targetProductId;
}
