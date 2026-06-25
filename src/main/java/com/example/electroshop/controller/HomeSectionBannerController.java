package com.example.electroshop.controller;

import com.example.electroshop.dto.HomeBannerProductRequest;
import com.example.electroshop.dto.HomeSectionBannerResponse;
import com.example.electroshop.entity.HomeSectionBanner;
import com.example.electroshop.entity.Product;
import com.example.electroshop.service.HomeSectionBannerService;

import lombok.RequiredArgsConstructor;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/home-section-banners")
@RequiredArgsConstructor
@CrossOrigin("*")
public class HomeSectionBannerController {

    private final HomeSectionBannerService homeSectionBannerService;

    /*
     * Admin lấy tất cả banner của 1 khối
     */
    @GetMapping("/section/{sectionId}")
    public List<HomeSectionBanner> getBannersBySection(
            @PathVariable Long sectionId
    ) {

        return homeSectionBannerService
                .getBannersBySection(sectionId);
    }

    /*
     * Trang Home lấy banner đang active của 1 khối
     */
    @GetMapping("/section/{sectionId}/active")
    public List<HomeSectionBanner> getActiveBannersBySection(
            @PathVariable Long sectionId
    ) {

        return homeSectionBannerService
                .getActiveBannersBySection(sectionId);
    }

    /*
     * Lấy chi tiết 1 banner + sản phẩm đã gắn
     */
    @GetMapping("/{bannerId}/detail")
    public HomeSectionBannerResponse getBannerDetail(
            @PathVariable Long bannerId
    ) {

        return homeSectionBannerService
                .getBannerDetail(bannerId);
    }

    /*
     * Tạo banner mới cho 1 khối
     */
    @PostMapping("/section/{sectionId}")
    public HomeSectionBanner createBanner(
            @PathVariable Long sectionId,
            @RequestBody HomeSectionBanner banner
    ) {

        return homeSectionBannerService
                .createBanner(
                        sectionId,
                        banner
                );
    }

    /*
     * Sửa banner
     */
    @PutMapping("/{bannerId}")
    public HomeSectionBanner updateBanner(
            @PathVariable Long bannerId,
            @RequestBody HomeSectionBanner banner
    ) {

        return homeSectionBannerService
                .updateBanner(
                        bannerId,
                        banner
                );
    }

    /*
     * Xóa banner
     */
    @DeleteMapping("/{bannerId}")
    public String deleteBanner(
            @PathVariable Long bannerId
    ) {

        homeSectionBannerService
                .deleteBanner(bannerId);

        return "Deleted successfully";
    }

    /*
     * Gắn danh sách sản phẩm vào banner
     */
    @PostMapping("/{bannerId}/products")
    public HomeSectionBannerResponse setBannerProducts(
            @PathVariable Long bannerId,
            @RequestBody HomeBannerProductRequest request
    ) {

        return homeSectionBannerService
                .setBannerProducts(
                        bannerId,
                        request
                );
    }

    /*
     * Lấy danh sách sản phẩm của banner
     * Dùng cho trang Collection sau này
     */
    @GetMapping("/{bannerId}/products")
    public List<Product> getBannerProducts(
            @PathVariable Long bannerId
    ) {

        return homeSectionBannerService
                .getBannerProducts(bannerId);
    }
}