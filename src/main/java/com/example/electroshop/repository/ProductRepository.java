package com.example.electroshop.repository;

import com.example.electroshop.entity.Product;

import jakarta.persistence.LockModeType;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ProductRepository
        extends JpaRepository<Product, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT p
            FROM Product p
            WHERE p.id = :productId
            """)
    Optional<Product> findByIdForUpdate(
            @Param("productId") Long productId
    );

    boolean existsByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCaseAndIdNot(
            String name,
            Long id
    );

    boolean existsByCategoryIgnoreCase(String category);

    boolean existsByBrandIgnoreCaseAndCategoryIgnoreCase(
            String brand,
            String category
    );
}