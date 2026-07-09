package com.example.electroshop.repository;

import com.example.electroshop.entity.BannerProduct;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BannerProductRepository
        extends JpaRepository<BannerProduct, Long> {

    List<BannerProduct> findByBannerIdOrderBySortOrderAscIdAsc(Long bannerId);

    void deleteByBannerId(Long bannerId);
}
