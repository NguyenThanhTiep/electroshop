package com.example.electroshop.repository;

import com.example.electroshop.entity.Brand;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BrandRepository
        extends JpaRepository<Brand, Long> {

    boolean existsByNameIgnoreCaseAndCategoryIgnoreCase(
            String name,
            String category
    );

    boolean existsByNameIgnoreCaseAndCategoryIgnoreCaseAndIdNot(
            String name,
            String category,
            Long id
    );

    boolean existsByCategoryIgnoreCase(String category);
}