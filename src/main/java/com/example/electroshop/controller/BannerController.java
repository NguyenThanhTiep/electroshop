package com.example.electroshop.controller;

import com.example.electroshop.entity.Banner;
import com.example.electroshop.service.BannerService;

import lombok.RequiredArgsConstructor;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/banners")

@RequiredArgsConstructor

@CrossOrigin("*")

public class BannerController {

    private final BannerService bannerService;

    @GetMapping
    public List<Banner> getAllBanners() {

        return bannerService.getAllBanners();
    }

    @GetMapping("/active")
    public List<Banner> getActiveBanners() {

        return bannerService.getActiveBanners();
    }

    @GetMapping("/position/{position}")
    public List<Banner> getActiveBannersByPosition(
            @PathVariable String position
    ) {

        return bannerService
                .getActiveBannersByPosition(position);
    }

    @PostMapping
    public Banner createBanner(
            @RequestBody Banner banner
    ) {

        return bannerService.createBanner(banner);
    }

    @PutMapping("/{id}")
    public Banner updateBanner(
            @PathVariable Long id,
            @RequestBody Banner banner
    ) {

        return bannerService.updateBanner(
                id,
                banner
        );
    }

    @DeleteMapping("/{id}")
    public String deleteBanner(
            @PathVariable Long id
    ) {

        bannerService.deleteBanner(id);

        return "Deleted successfully";
    }
}