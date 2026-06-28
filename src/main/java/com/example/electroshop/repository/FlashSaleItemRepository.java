package com.example.electroshop.repository;

import com.example.electroshop.entity.FlashSaleItem;

import jakarta.persistence.LockModeType;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface FlashSaleItemRepository
        extends JpaRepository<FlashSaleItem, Long> {

    List<FlashSaleItem>
    findByFlashSaleIdAndActiveTrueOrderByIdDesc(
            Long flashSaleId
    );

    List<FlashSaleItem>
    findByFlashSaleIdOrderByIdDesc(
            Long flashSaleId
    );

    Optional<FlashSaleItem>
    findFirstByFlashSaleIdAndProductIdAndActiveTrueOrderByIdDesc(
            Long flashSaleId,
            Long productId
    );

    boolean existsByProductId(Long productId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        SELECT f
        FROM FlashSaleItem f
        WHERE f.id = :id
    """)
    Optional<FlashSaleItem> findByIdForUpdate(
            @Param("id") Long id
    );
}