package com.example.electroshop.controller;

import com.example.electroshop.entity.Promotion;
import com.example.electroshop.service.PromotionService;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/promotions")
@CrossOrigin("*")
public class PromotionController {

    private final PromotionService promotionService;

    public PromotionController(
            PromotionService promotionService
    ) {
        this.promotionService = promotionService;
    }

    @GetMapping
    public List<Promotion> getAllPromotions() {
        return promotionService.getAllPromotions();
    }

    @GetMapping("/active")
    public List<Promotion> getActivePromotions() {
        return promotionService.getActivePromotions();
    }

    @PostMapping
    public Promotion createPromotion(
            @RequestBody Promotion promotion
    ) {
        return promotionService.createPromotion(promotion);
    }

    @PutMapping("/{id}")
    public Promotion updatePromotion(
            @PathVariable Long id,
            @RequestBody Promotion promotion
    ) {
        return promotionService.updatePromotion(id, promotion);
    }

    @DeleteMapping("/{id}")
    public void deletePromotion(
            @PathVariable Long id
    ) {
        promotionService.deletePromotion(id);
    }
}