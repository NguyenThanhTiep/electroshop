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

    private String linkUrl;

    private String position;

    private Boolean active;

    private Integer sortOrder;
}