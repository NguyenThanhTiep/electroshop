package com.example.electroshop.service;

import com.example.electroshop.entity.Banner;
import com.example.electroshop.repository.BannerRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor

public class BannerService {

    private final BannerRepository bannerRepository;

    public List<Banner> getAllBanners() {

        return bannerRepository.findAllByOrderBySortOrderAsc();
    }

    public List<Banner> getActiveBanners() {

        return bannerRepository.findByActiveTrueOrderBySortOrderAsc();
    }

    public List<Banner> getActiveBannersByPosition(
            String position
    ) {

        return bannerRepository
                .findByPositionAndActiveTrueOrderBySortOrderAsc(
                        position
                );
    }

    public Banner createBanner(
            Banner banner
    ) {

        if (banner.getActive() == null) {
            banner.setActive(true);
        }

        if (banner.getSortOrder() == null) {
            banner.setSortOrder(1);
        }

        if (banner.getPosition() == null ||
                banner.getPosition().isBlank()) {
            banner.setPosition("HOME_TOP");
        }

        return bannerRepository.save(banner);
    }

    public Banner updateBanner(
            Long id,
            Banner banner
    ) {

        Banner existingBanner =
                bannerRepository.findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Banner not found"
                                )
                        );

        existingBanner.setTitle(
                banner.getTitle()
        );

        existingBanner.setSubtitle(
                banner.getSubtitle()
        );

        existingBanner.setImageUrl(
                banner.getImageUrl()
        );

        existingBanner.setLinkUrl(
                banner.getLinkUrl()
        );

        existingBanner.setPosition(
                banner.getPosition()
        );

        existingBanner.setActive(
                banner.getActive()
        );

        existingBanner.setSortOrder(
                banner.getSortOrder()
        );

        return bannerRepository.save(existingBanner);
    }

    public void deleteBanner(
            Long id
    ) {

        bannerRepository.deleteById(id);
    }
}