package com.example.electroshop.repository;

import com.example.electroshop.entity.HomeSection;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HomeSectionRepository
        extends JpaRepository<HomeSection, Long> {

    List<HomeSection> findAllByOrderBySortOrderAsc();

    List<HomeSection> findByActiveTrueOrderBySortOrderAsc();
}