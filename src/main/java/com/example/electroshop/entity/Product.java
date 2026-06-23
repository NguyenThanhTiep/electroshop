package com.example.electroshop.entity;

import java.math.BigDecimal;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonManagedReference;

import jakarta.persistence.*;

import lombok.*;

@Entity
@Table(name = "products")

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder

public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)

    private Long id;

    private String name;

    @Column(
    nullable = false,
    precision = 15,
    scale = 2
)
private BigDecimal price;

    private String image;

    @Column(length = 2000)
    private String description;

    private Integer stock;

    private String category;
    private String brand;

    @Column(columnDefinition = "LONGTEXT")
    private String specifications;

    @Column(columnDefinition = "LONGTEXT")
    private String highlights;

    @Column(columnDefinition = "LONGTEXT")
    private String promotions;

    @Column(columnDefinition = "LONGTEXT")
    private String options;
    
    @OneToMany(
        mappedBy = "product",
        cascade = CascadeType.ALL,
        orphanRemoval = true
    )
    @JsonManagedReference
    private List<ProductImage> images;

    public String getCategory() {

        return category;
    }

    public void setCategory(
        String category
    ) {

        this.category = category;
    }
}