package com.example.electroshop.repository;

import com.example.electroshop.entity.FlashSale;
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
    findByActiveTrueOrderBySortOrderAsc();
}