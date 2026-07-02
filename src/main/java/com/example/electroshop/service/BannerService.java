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

    public List<Banner> getActiveBannersByPosition(String position) {
        return bannerRepository.findByPositionAndActiveTrueOrderBySortOrderAsc(position);
    }

    public Banner createBanner(Banner banner) {
        applyDefaultValues(banner);

        return bannerRepository.save(banner);
    }

    public Banner updateBanner(Long id, Banner banner) {
        Banner existingBanner = bannerRepository
                .findById(id)
                .orElseThrow(() -> new RuntimeException("Banner not found"));

        existingBanner.setTitle(banner.getTitle());
        existingBanner.setSubtitle(banner.getSubtitle());
        existingBanner.setImageUrl(banner.getImageUrl());
        existingBanner.setLinkUrl(banner.getLinkUrl());
        existingBanner.setPosition(banner.getPosition());
        existingBanner.setActive(banner.getActive());
        existingBanner.setSortOrder(banner.getSortOrder());

        existingBanner.setShowTitle(banner.getShowTitle());
        existingBanner.setShowSubtitle(banner.getShowSubtitle());
        existingBanner.setTargetType(banner.getTargetType());
        existingBanner.setTargetUrl(banner.getTargetUrl());
        existingBanner.setTargetProductId(banner.getTargetProductId());

        applyDefaultValues(existingBanner);

        return bannerRepository.save(existingBanner);
    }

    public void deleteBanner(Long id) {
        bannerRepository.deleteById(id);
    }

    private void applyDefaultValues(Banner banner) {
        if (banner.getActive() == null) {
            banner.setActive(true);
        }

        if (banner.getSortOrder() == null || banner.getSortOrder() <= 0) {
            banner.setSortOrder(1);
        }

        /*
         * Theo yêu cầu mới:
         * chỉ giữ banner ngang đầu trang.
         */
        banner.setPosition("HOME_TOP");

        if (banner.getShowTitle() == null) {
            banner.setShowTitle(false);
        }

        if (banner.getShowSubtitle() == null) {
            banner.setShowSubtitle(false);
        }

        if (banner.getTargetType() == null || banner.getTargetType().isBlank()) {
            banner.setTargetType("COLLECTION");
        }

        banner.setTargetType(
                banner.getTargetType().trim().toUpperCase()
        );

        if ("PRODUCT".equals(banner.getTargetType())) {
            if (banner.getTargetProductId() != null) {
                banner.setTargetUrl("/product/" + banner.getTargetProductId());
                banner.setLinkUrl("/product/" + banner.getTargetProductId());
            }

            return;
        }

        if ("CUSTOM_LINK".equals(banner.getTargetType())) {
            String customUrl = banner.getTargetUrl();

            if ((customUrl == null || customUrl.isBlank()) && banner.getLinkUrl() != null) {
                customUrl = banner.getLinkUrl();
            }

            banner.setTargetUrl(customUrl);
            banner.setLinkUrl(customUrl);

            return;
        }

        banner.setTargetType("COLLECTION");

String collectionUrl = banner.getTargetUrl();

if ((collectionUrl == null || collectionUrl.isBlank()) && banner.getLinkUrl() != null) {
    collectionUrl = banner.getLinkUrl();
}

if (collectionUrl == null || collectionUrl.isBlank()) {
    collectionUrl = "/search";
}

banner.setTargetUrl(collectionUrl);
banner.setLinkUrl(collectionUrl);
banner.setTargetProductId(null);
    }
}