package com.example.electroshop.repository;

import com.example.electroshop.entity.HomeSectionBanner;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface HomeSectionBannerRepository
        extends JpaRepository<HomeSectionBanner, Long> {

    List<HomeSectionBanner>
    findByHomeSectionIdOrderBySlideGroupAscSortOrderAscIdAsc(
            Long homeSectionId
    );

    List<HomeSectionBanner>
    findByHomeSectionIdAndActiveTrueOrderBySlideGroupAscSortOrderAscIdAsc(
            Long homeSectionId
    );

    Optional<HomeSectionBanner>
    findByIdAndHomeSectionId(
            Long id,
            Long homeSectionId
    );

    void deleteByHomeSectionId(Long homeSectionId);
}