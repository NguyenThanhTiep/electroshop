package com.example.electroshop.service;

import com.example.electroshop.dto.HomeBannerProductRequest;
import com.example.electroshop.dto.HomeSectionBannerResponse;
import com.example.electroshop.entity.HomeBannerProduct;
import com.example.electroshop.entity.HomeSectionBanner;
import com.example.electroshop.entity.Product;
import com.example.electroshop.repository.HomeBannerProductRepository;
import com.example.electroshop.repository.HomeSectionBannerRepository;
import com.example.electroshop.repository.HomeSectionRepository;
import com.example.electroshop.repository.ProductRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class HomeSectionBannerService {

    private final HomeSectionRepository homeSectionRepository;

    private final HomeSectionBannerRepository homeSectionBannerRepository;

    private final HomeBannerProductRepository homeBannerProductRepository;

    private final ProductRepository productRepository;

    public List<HomeSectionBanner> getBannersBySection(Long sectionId) {

        ensureSectionExists(sectionId);

        return homeSectionBannerRepository
                .findByHomeSectionIdOrderBySlideGroupAscSortOrderAscIdAsc(
                        sectionId
                );
    }

    public List<HomeSectionBanner> getActiveBannersBySection(Long sectionId) {

        ensureSectionExists(sectionId);

        return homeSectionBannerRepository
                .findByHomeSectionIdAndActiveTrueOrderBySlideGroupAscSortOrderAscIdAsc(
                        sectionId
                );
    }

    public HomeSectionBanner getBanner(Long bannerId) {

        return homeSectionBannerRepository
                .findById(bannerId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Không tìm thấy banner"
                        )
                );
    }

    public HomeSectionBannerResponse getBannerDetail(Long bannerId) {

        HomeSectionBanner banner =
                getBanner(bannerId);

        List<Product> products =
                getBannerProducts(bannerId);

        return new HomeSectionBannerResponse(
                banner,
                products
        );
    }

    public HomeSectionBanner createBanner(
            Long sectionId,
            HomeSectionBanner banner
    ) {

        ensureSectionExists(sectionId);

        banner.setHomeSectionId(sectionId);

        applyDefaultValues(banner);

        return homeSectionBannerRepository.save(banner);
    }

    public HomeSectionBanner updateBanner(
            Long bannerId,
            HomeSectionBanner banner
    ) {

        HomeSectionBanner existingBanner =
                getBanner(bannerId);

        existingBanner.setImageUrl(
                banner.getImageUrl()
        );

        existingBanner.setTitle(
                banner.getTitle()
        );

        existingBanner.setSubtitle(
                banner.getSubtitle()
        );

        existingBanner.setTargetType(
                banner.getTargetType()
        );

        existingBanner.setTargetUrl(
                banner.getTargetUrl()
        );

        existingBanner.setTargetProductId(
                banner.getTargetProductId()
        );

        existingBanner.setSlideGroup(
                banner.getSlideGroup()
        );

        existingBanner.setPosition(
                banner.getPosition()
        );

        existingBanner.setSortOrder(
                banner.getSortOrder()
        );

        existingBanner.setActive(
                banner.getActive()
        );

        applyDefaultValues(existingBanner);

        return homeSectionBannerRepository.save(existingBanner);
    }

    @Transactional
    public void deleteBanner(Long bannerId) {

        getBanner(bannerId);

        homeBannerProductRepository
                .deleteByBannerId(bannerId);

        homeSectionBannerRepository
                .deleteById(bannerId);
    }

    @Transactional
    public HomeSectionBannerResponse setBannerProducts(
            Long bannerId,
            HomeBannerProductRequest request
    ) {

        HomeSectionBanner banner =
                getBanner(bannerId);

        homeBannerProductRepository
                .deleteByBannerId(bannerId);

        List<Long> productIds =
                request == null ||
                        request.getProductIds() == null
                        ? List.of()
                        : request
                                .getProductIds()
                                .stream()
                                .filter(Objects::nonNull)
                                .distinct()
                                .toList();

        for (int i = 0; i < productIds.size(); i++) {

            HomeBannerProduct bannerProduct =
                    HomeBannerProduct
                            .builder()
                            .bannerId(bannerId)
                            .productId(productIds.get(i))
                            .sortOrder(i + 1)
                            .build();

            homeBannerProductRepository
                    .save(bannerProduct);
        }

        return new HomeSectionBannerResponse(
                banner,
                getBannerProducts(bannerId)
        );
    }

    public List<Product> getBannerProducts(Long bannerId) {

        getBanner(bannerId);

        List<HomeBannerProduct> bannerProducts =
                homeBannerProductRepository
                        .findByBannerIdOrderBySortOrderAscIdAsc(
                                bannerId
                        );

        List<Long> productIds =
                bannerProducts
                        .stream()
                        .filter(Objects::nonNull)
                        .map(HomeBannerProduct::getProductId)
                        .filter(Objects::nonNull)
                        .toList();

        if (productIds.isEmpty()) {
            return List.of();
        }

        List<Product> products =
                productRepository.findAllById(productIds);

        Map<Long, Product> productMap =
                products
                        .stream()
                        .filter(Objects::nonNull)
                        .filter(product -> product.getId() != null)
                        .collect(
                                Collectors.toMap(
                                        Product::getId,
                                        product -> product
                                )
                        );

        return productIds
                .stream()
                .map(productMap::get)
                .filter(Objects::nonNull)
                .toList();
    }

    private void ensureSectionExists(Long sectionId) {

        boolean exists =
                homeSectionRepository.existsById(sectionId);

        if (!exists) {
            throw new RuntimeException(
                    "Không tìm thấy khối trang chủ"
            );
        }
    }

    private void applyDefaultValues(
            HomeSectionBanner banner
    ) {

        if (
                banner.getTargetType() == null ||
                        banner.getTargetType().isBlank()
        ) {
            banner.setTargetType("COLLECTION");
        }

        if (banner.getSlideGroup() == null) {
            banner.setSlideGroup(1);
        }

        if (banner.getSortOrder() == null) {
            banner.setSortOrder(1);
        }

        if (banner.getActive() == null) {
            banner.setActive(true);
        }

        if (
                "PRODUCT".equalsIgnoreCase(
                        banner.getTargetType()
                ) &&
                        banner.getTargetProductId() != null
        ) {
            banner.setTargetUrl(
                    "/product/" + banner.getTargetProductId()
            );
        }

        if (banner.getPosition() != null) {
            banner.setPosition(
                    banner.getPosition()
                            .trim()
                            .toUpperCase()
            );
        }

        banner.setTargetType(
                banner.getTargetType()
                        .trim()
                        .toUpperCase()
        );
    }
}
