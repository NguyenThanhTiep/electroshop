package com.example.electroshop.repository;

import com.example.electroshop.entity.Banner;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BannerRepository
        extends JpaRepository<Banner, Long> {

    List<Banner> findAllByOrderBySortOrderAsc();

    List<Banner> findByActiveTrueOrderBySortOrderAsc();

    List<Banner> findByPositionAndActiveTrueOrderBySortOrderAsc(
            String position
    );
}