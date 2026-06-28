package com.example.electroshop.repository;

import com.example.electroshop.entity.FlashSale;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface FlashSaleRepository
        extends JpaRepository<FlashSale, Long> {

    Optional<FlashSale>
    findFirstByActiveTrueAndStartTimeLessThanEqualAndEndTimeGreaterThanEqualOrderBySortOrderAsc(
            LocalDateTime now1,
            LocalDateTime now2
    );

    List<FlashSale>
    findByActiveTrueAndStartTimeLessThanEqualAndEndTimeGreaterThanEqualOrderBySortOrderAscIdAsc(
            LocalDateTime now1,
            LocalDateTime now2
    );

    List<FlashSale> findByActiveTrueOrderBySortOrderAsc();
    @Query("""
        SELECT f
        FROM FlashSale f
        WHERE f.active = true
          AND f.startTime <= :now
          AND f.endTime >= :now
        ORDER BY COALESCE(f.sortOrder, 999999) ASC, f.id ASC
        """)
List<FlashSale> findActiveFlashSalesForHomePage(
        @Param("now") LocalDateTime now
);
}