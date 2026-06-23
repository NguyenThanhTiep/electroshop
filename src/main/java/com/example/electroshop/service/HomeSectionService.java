package com.example.electroshop.service;

import com.example.electroshop.entity.HomeSection;
import com.example.electroshop.repository.HomeSectionRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class HomeSectionService {

    private final HomeSectionRepository homeSectionRepository;

    public List<HomeSection> getAllSections() {

        return homeSectionRepository.findAllByOrderBySortOrderAsc();
    }

    public List<HomeSection> getActiveSections() {

        return homeSectionRepository.findByActiveTrueOrderBySortOrderAsc();
    }

    public HomeSection createSection(
            HomeSection section
    ) {

        if (section.getActive() == null) {
            section.setActive(true);
        }

        if (section.getSortOrder() == null) {
            section.setSortOrder(1);
        }

        if (section.getLimitProduct() == null) {
            section.setLimitProduct(8);
        }

        if (section.getProductRows() == null) {
            section.setProductRows(1);
        }

        if (section.getTabOrder() == null) {
            section.setTabOrder(1);
        }

        if (
                section.getSectionType() == null ||
                section.getSectionType().isBlank()
        ) {
            section.setSectionType("PRODUCT_SECTION");
        }

        return homeSectionRepository.save(section);
    }

    public HomeSection updateSection(
            Long id,
            HomeSection section
    ) {

        HomeSection existingSection =
                homeSectionRepository.findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Home section not found"
                                )
                        );

        existingSection.setTitle(
                section.getTitle()
        );

        existingSection.setSectionType(
                section.getSectionType()
        );

        existingSection.setCategory(
                section.getCategory()
        );

        existingSection.setBrand(
                section.getBrand()
        );

        existingSection.setProductId(
                section.getProductId()
        );

        existingSection.setBadgeText(
                section.getBadgeText()
        );

        existingSection.setShortDescription(
                section.getShortDescription()
        );

        existingSection.setBannerImage(
                section.getBannerImage()
        );

        existingSection.setBannerLink(
                section.getBannerLink()
        );

        existingSection.setLeftBannerImage(
                section.getLeftBannerImage()
        );

        existingSection.setLeftBannerLink(
                section.getLeftBannerLink()
        );

        existingSection.setProductRows(
                section.getProductRows()
        );

        existingSection.setLimitProduct(
                section.getLimitProduct()
        );

        existingSection.setSortOrder(
                section.getSortOrder()
        );

        existingSection.setActive(
                section.getActive()
        );

        existingSection.setDealEndTime(
                section.getDealEndTime()
        );

        existingSection.setDealSubtitle(
                section.getDealSubtitle()
        );

        existingSection.setDealTheme(
                section.getDealTheme()
        );

        existingSection.setGroupCode(
                section.getGroupCode()
        );

        existingSection.setTabTitle(
                section.getTabTitle()
        );

        existingSection.setTabOrder(
                section.getTabOrder()
        );

        return homeSectionRepository.save(existingSection);
    }

    public void deleteSection(
            Long id
    ) {

        homeSectionRepository.deleteById(id);
    }
}