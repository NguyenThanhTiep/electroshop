package com.example.electroshop.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;

import jakarta.persistence.*;

@Entity

@Table(name = "product_images")

public class ProductImage {

    @Id

    @GeneratedValue(
        strategy =
        GenerationType.IDENTITY
    )

    private Long id;

    private String imageUrl;

    @ManyToOne

@JoinColumn(name = "product_id")

@JsonBackReference

private Product product;

    public ProductImage() {
    }

    public Long getId() {

        return id;
    }

    public void setId(
        Long id
    ) {

        this.id = id;
    }

    public String getImageUrl() {

        return imageUrl;
    }

    public void setImageUrl(
        String imageUrl
    ) {

        this.imageUrl = imageUrl;
    }

    public Product getProduct() {

        return product;
    }

    public void setProduct(
        Product product
    ) {

        this.product = product;
    }
}