package com.example.electroshop.service;

import com.example.electroshop.entity.Promotion;
import com.example.electroshop.repository.ProductRepository;
import com.example.electroshop.repository.PromotionRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PromotionService {

    private static final LocalDate MIN_DATE =
            LocalDate.of(1900, 1, 1);

    private static final LocalDate MAX_DATE =
            LocalDate.of(9999, 12, 31);

    private final PromotionRepository promotionRepository;
    private final ProductRepository productRepository;

    public List<Promotion> getAllPromotions() {
        return promotionRepository.findAll();
    }

    public List<Promotion> getActivePromotions() {
        return promotionRepository.findByActiveTrue();
    }

    public Promotion createPromotion(Promotion promotion) {
        validateAndNormalizePromotion(promotion, null);

        promotion.setId(null);

        return promotionRepository.save(promotion);
    }

    public Promotion updatePromotion(
            Long id,
            Promotion promotion
    ) {
        Promotion existingPromotion =
                promotionRepository
                        .findById(id)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Không tìm thấy khuyến mãi"
                                )
                        );

        validateAndNormalizePromotion(promotion, id);

        existingPromotion.setTitle(promotion.getTitle());
        existingPromotion.setProductId(promotion.getProductId());
        existingPromotion.setDiscountPercent(
                promotion.getDiscountPercent()
        );
        existingPromotion.setStartDate(promotion.getStartDate());
        existingPromotion.setEndDate(promotion.getEndDate());
        existingPromotion.setActive(promotion.getActive());

        return promotionRepository.save(existingPromotion);
    }

    public void deletePromotion(Long id) {
        Promotion promotion =
                promotionRepository
                        .findById(id)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Không tìm thấy khuyến mãi"
                                )
                        );

        promotionRepository.delete(promotion);
    }

    private void validateAndNormalizePromotion(
            Promotion promotion,
            Long currentId
    ) {
        if (promotion == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Dữ liệu khuyến mãi không hợp lệ"
            );
        }

        String title =
                requireText(
                        promotion.getTitle(),
                        "Tên khuyến mãi không được để trống"
                );

        Long productId = promotion.getProductId();

        if (productId == null || productId <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Vui lòng chọn sản phẩm áp dụng khuyến mãi"
            );
        }

        if (!productRepository.existsById(productId)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Sản phẩm áp dụng khuyến mãi không tồn tại"
            );
        }

        Integer discountPercent = promotion.getDiscountPercent();

        if (discountPercent == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Vui lòng nhập phần trăm giảm giá"
            );
        }

        if (discountPercent <= 0 || discountPercent > 100) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Phần trăm giảm giá phải từ 1 đến 100"
            );
        }

        LocalDate startDate = promotion.getStartDate();
        LocalDate endDate = promotion.getEndDate();

        if (
                startDate != null
                        &&
                endDate != null
                        &&
                startDate.isAfter(endDate)
        ) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Ngày bắt đầu không được sau ngày kết thúc"
            );
        }

        Boolean active =
                promotion.getActive() == null
                        ? true
                        : promotion.getActive();

        if (active) {
            LocalDate effectiveStartDate =
                    startDate == null ? MIN_DATE : startDate;

            LocalDate effectiveEndDate =
                    endDate == null ? MAX_DATE : endDate;

            Long excludedId =
                    currentId == null ? 0L : currentId;

            long overlappingCount =
                    promotionRepository.countActiveOverlappingPromotions(
                            productId,
                            effectiveStartDate,
                            effectiveEndDate,
                            excludedId
                    );

            if (overlappingCount > 0) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Sản phẩm này đã có khuyến mãi đang hoạt động trong khoảng thời gian này"
                );
            }
        }

        promotion.setTitle(title);
        promotion.setProductId(productId);
        promotion.setDiscountPercent(discountPercent);
        promotion.setActive(active);
    }

    private String requireText(
            String value,
            String message
    ) {
        if (value == null || value.trim().isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    message
            );
        }

        return value.trim();
    }
}