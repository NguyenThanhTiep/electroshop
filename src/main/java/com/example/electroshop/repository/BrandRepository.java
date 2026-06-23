package com.example.electroshop.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.electroshop.entity.Brand;

public interface BrandRepository
        extends JpaRepository<Brand, Long> {
}