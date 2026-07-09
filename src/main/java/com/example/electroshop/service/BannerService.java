package com.example.electroshop.service;

import com.example.electroshop.dto.BannerDetailResponse;
import com.example.electroshop.dto.HomeBannerProductRequest;
import com.example.electroshop.entity.Banner;
import com.example.electroshop.entity.BannerProduct;
import com.example.electroshop.entity.Product;
import com.example.electroshop.repository.BannerProductRepository;
import com.example.electroshop.repository.BannerRepository;
import com.example.electroshop.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BannerService {

    private final BannerRepository bannerRepository;

    private final BannerProductRepository bannerProductRepository;

    private final ProductRepository productRepository;

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

        Banner savedBanner = bannerRepository.save(banner);

        return ensureCollectionUrl(savedBanner);
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

        Banner savedBanner = bannerRepository.save(existingBanner);

        return ensureCollectionUrl(savedBanner);
    }

    @Transactional
    public void deleteBanner(Long id) {
        bannerProductRepository.deleteByBannerId(id);
        bannerRepository.deleteById(id);
    }

    public BannerDetailResponse getBannerDetail(Long id) {
        Banner banner = bannerRepository
                .findById(id)
                .orElseThrow(() -> new RuntimeException("Banner not found"));

        return new BannerDetailResponse(
                banner,
                getBannerProducts(id)
        );
    }

    @Transactional
    public BannerDetailResponse setBannerProducts(
            Long id,
            HomeBannerProductRequest request
    ) {
        Banner banner = bannerRepository
                .findById(id)
                .orElseThrow(() -> new RuntimeException("Banner not found"));

        bannerProductRepository.deleteByBannerId(id);

        List<Long> productIds = request == null || request.getProductIds() == null
                ? List.of()
                : request
                        .getProductIds()
                        .stream()
                        .filter(productId -> productId != null && productId > 0)
                        .distinct()
                        .toList();

        for (int i = 0; i < productIds.size(); i++) {
            BannerProduct bannerProduct = BannerProduct
                    .builder()
                    .bannerId(id)
                    .productId(productIds.get(i))
                    .sortOrder(i + 1)
                    .build();

            bannerProductRepository.save(bannerProduct);
        }

        banner.setTargetType("COLLECTION");
        banner.setTargetUrl("/search?homeBannerId=" + id);
        banner.setLinkUrl("/search?homeBannerId=" + id);
        banner.setTargetProductId(null);

        bannerRepository.save(banner);

        return new BannerDetailResponse(
                banner,
                getBannerProducts(id)
        );
    }

    public List<Product> getBannerProducts(Long id) {
        List<BannerProduct> bannerProducts = bannerProductRepository
                .findByBannerIdOrderBySortOrderAscIdAsc(id);

        List<Long> productIds = bannerProducts
                .stream()
                .map(BannerProduct::getProductId)
                .toList();

        if (productIds.isEmpty()) {
            return List.of();
        }

        Map<Long, Product> productMap = productRepository
                .findAllById(productIds)
                .stream()
                .collect(
                        Collectors.toMap(
                                Product::getId,
                                product -> product,
                                (first, second) -> first,
                                LinkedHashMap::new
                        )
                );

        return productIds
                .stream()
                .map(productMap::get)
                .filter(product -> product != null)
                .toList();
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

        if (
                (collectionUrl == null || collectionUrl.isBlank()) &&
                        banner.getLinkUrl() != null
        ) {
            collectionUrl = banner.getLinkUrl();
        }

        if (collectionUrl == null || collectionUrl.isBlank()) {
            collectionUrl = "/search";
        }

        banner.setTargetUrl(collectionUrl);
        banner.setLinkUrl(collectionUrl);
        banner.setTargetProductId(null);
    }

    private Banner ensureCollectionUrl(Banner banner) {
        if (!"COLLECTION".equals(banner.getTargetType()) || banner.getId() == null) {
            return banner;
        }

        String collectionUrl = banner.getTargetUrl();

        if (
                collectionUrl == null ||
                        collectionUrl.isBlank() ||
                        collectionUrl.equals("/search") ||
                        collectionUrl.contains("productIds=")
        ) {
            banner.setTargetUrl("/search?homeBannerId=" + banner.getId());
            banner.setLinkUrl("/search?homeBannerId=" + banner.getId());

            return bannerRepository.save(banner);
        }

        return banner;
    }
}
