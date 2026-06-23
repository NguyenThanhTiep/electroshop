package com.example.electroshop.controller;

import com.example.electroshop.entity.Promotion;
import com.example.electroshop.repository.PromotionRepository;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/promotions")
@CrossOrigin("*")
public class PromotionController {

    private final PromotionRepository promotionRepository;

    public PromotionController(
            PromotionRepository promotionRepository
    ) {
        this.promotionRepository = promotionRepository;
    }

    @GetMapping
    public List<Promotion> getAllPromotions() {
        return promotionRepository.findAll();
    }

    @GetMapping("/active")
    public List<Promotion> getActivePromotions() {
        return promotionRepository.findByActiveTrue();
    }

    @PostMapping
    public Promotion createPromotion(
            @RequestBody Promotion promotion
    ) {
        return promotionRepository.save(promotion);
    }

    @PutMapping("/{id}")
    public Promotion updatePromotion(
            @PathVariable Long id,
            @RequestBody Promotion promotion
    ) {
        Promotion oldPromotion =
                promotionRepository.findById(id)
                        .orElseThrow();

        oldPromotion.setTitle(
                promotion.getTitle()
        );

        oldPromotion.setProductId(
                promotion.getProductId()
        );

        oldPromotion.setDiscountPercent(
                promotion.getDiscountPercent()
        );

        oldPromotion.setStartDate(
                promotion.getStartDate()
        );

        oldPromotion.setEndDate(
                promotion.getEndDate()
        );

        oldPromotion.setActive(
                promotion.getActive()
        );

        return promotionRepository.save(oldPromotion);
    }

    @DeleteMapping("/{id}")
    public void deletePromotion(
            @PathVariable Long id
    ) {
        promotionRepository.deleteById(id);
    }
}