package com.example.electroshop.controller;

import com.example.electroshop.dto.review.ReviewRequest;
import com.example.electroshop.dto.review.ReviewResponse;
import com.example.electroshop.dto.review.ReviewSummaryResponse;

import com.example.electroshop.service.ReviewService;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/reviews")
@CrossOrigin(
        origins = "http://localhost:5173"
)
public class ReviewController {

    private final ReviewService
            reviewService;

    public ReviewController(
            ReviewService reviewService
    ) {
        this.reviewService =
                reviewService;
    }

    @GetMapping("/product/{productId}")
    public List<ReviewResponse>
    getReviewsByProduct(
            @PathVariable Long productId
    ) {
        return reviewService
                .getReviewsByProduct(
                        productId
                );
    }

    @GetMapping(
            "/product/{productId}/summary"
    )
    public ReviewSummaryResponse getSummary(
            @PathVariable Long productId
    ) {
        return reviewService
                .getSummary(productId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ReviewResponse createReview(
            @RequestBody
            ReviewRequest request,
            Authentication authentication
    ) {
        return reviewService
                .createReview(
                        request,
                        getAuthenticatedEmail(authentication)
                );
    }

    @PutMapping("/{reviewId}")
    public ReviewResponse updateReview(
            @PathVariable Long reviewId,
            @RequestBody
            ReviewRequest request,
            Authentication authentication
    ) {
        return reviewService
                .updateReview(
                        reviewId,
                        request,
                        getAuthenticatedEmail(authentication)
                );
    }

    @DeleteMapping("/{reviewId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteReview(
            @PathVariable Long reviewId,
            Authentication authentication
    ) {
        reviewService.deleteReview(
                reviewId,
                getAuthenticatedEmail(authentication)
        );
    }

    private String getAuthenticatedEmail(
            Authentication authentication
    ) {
        if (
                authentication == null ||
                authentication.getName() == null
        ) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Bạn chưa đăng nhập"
            );
        }

        return authentication.getName();
    }
}
