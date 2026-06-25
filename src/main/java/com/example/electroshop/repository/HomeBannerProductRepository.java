package com.example.electroshop.repository;

import com.example.electroshop.entity.HomeBannerProduct;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HomeBannerProductRepository
        extends JpaRepository<HomeBannerProduct, Long> {

    List<HomeBannerProduct>
    findByBannerIdOrderBySortOrderAscIdAsc(Long bannerId);

    List<HomeBannerProduct>
    findByBannerIdInOrderByBannerIdAscSortOrderAscIdAsc(
            List<Long> bannerIds
    );

    void deleteByBannerId(Long bannerId);

    void deleteByBannerIdIn(List<Long> bannerIds);
}