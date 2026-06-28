package com.example.electroshop.repository;

import com.example.electroshop.entity.Promotion;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface PromotionRepository
        extends JpaRepository<Promotion, Long> {

    List<Promotion> findByActiveTrue();

    boolean existsByProductId(Long productId);
    @Query("""
        SELECT p
        FROM Promotion p
        WHERE p.productId = :productId
          AND p.active = true
          AND (
              p.startDate IS NULL
              OR p.startDate <= :today
          )
          AND (
              p.endDate IS NULL
              OR p.endDate >= :today
          )
        ORDER BY p.id DESC
    """)
    List<Promotion>
    findActivePromotionsForProduct(
            @Param("productId")
            Long productId,

            @Param("today")
            LocalDate today
    );
}