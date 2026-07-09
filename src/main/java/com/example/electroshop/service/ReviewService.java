package com.example.electroshop.service;

import com.example.electroshop.dto.review.ReviewRequest;
import com.example.electroshop.dto.review.ReviewResponse;
import com.example.electroshop.dto.review.ReviewSummaryResponse;

import com.example.electroshop.entity.Review;
import com.example.electroshop.entity.User;
import com.example.electroshop.entity.enums.OrderStatus;

import com.example.electroshop.repository.OrderRepository;
import com.example.electroshop.repository.ProductRepository;
import com.example.electroshop.repository.ReviewRepository;
import com.example.electroshop.repository.UserRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class ReviewService {

    private final ReviewRepository
            reviewRepository;

    private final ProductRepository
            productRepository;

    private final UserRepository
            userRepository;

    private final OrderRepository
            orderRepository;

    public ReviewService(
            ReviewRepository reviewRepository,
            ProductRepository productRepository,
            UserRepository userRepository,
            OrderRepository orderRepository
    ) {
        this.reviewRepository =
                reviewRepository;

        this.productRepository =
                productRepository;

        this.userRepository =
                userRepository;

        this.orderRepository =
                orderRepository;
    }

    @Transactional(readOnly = true)
    public List<ReviewResponse>
    getReviewsByProduct(
            Long productId
    ) {
        validateProduct(productId);

        return reviewRepository
                .findByProductIdOrderByCreatedAtDesc(
                        productId
                )
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ReviewSummaryResponse getSummary(
            Long productId
    ) {
        validateProduct(productId);

        List<Review> reviews =
                reviewRepository
                        .findByProductIdOrderByCreatedAtDesc(
                                productId
                        );

        Map<Integer, Long> ratingCounts =
                new LinkedHashMap<>();

        for (int star = 5; star >= 1; star--) {
            int currentStar = star;

            long count =
                    reviews.stream()
                            .filter(review ->
                                    review.getRating()
                                            == currentStar
                            )
                            .count();

            ratingCounts.put(
                    currentStar,
                    count
            );
        }

        double average =
                reviews.stream()
                        .mapToInt(
                                Review::getRating
                        )
                        .average()
                        .orElse(0);

        average =
                Math.round(average * 10.0)
                        / 10.0;

        return ReviewSummaryResponse
                .builder()
                .averageRating(average)
                .totalReviews(
                        (long) reviews.size()
                )
                .ratingCounts(ratingCounts)
                .build();
    }

    @Transactional
    public ReviewResponse createReview(
            ReviewRequest request,
            String authenticatedEmail
    ) {
        validateRequest(request);

        validateProduct(
                request.getProductId()
        );

        User user =
                getAuthenticatedUser(authenticatedEmail);

        Long userId =
                user.getId();

        boolean hasCompletedOrder =
                orderRepository
                        .existsOrderContainingProduct(
                                userId,
                                request.getProductId(),
                                OrderStatus.COMPLETED
                        );

        if (!hasCompletedOrder) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Bạn chỉ có thể đánh giá sản phẩm sau khi đơn hàng đã hoàn thành"
            );
        }

        if (
                reviewRepository
                        .existsByProductIdAndUserId(
                                request.getProductId(),
                                userId
                        )
        ) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Bạn đã đánh giá sản phẩm này"
            );
        }

        String userName =
                user.getFullName();

        if (
                userName == null ||
                userName.isBlank()
        ) {
            userName = user.getEmail();
        }

        Review review =
                Review.builder()
                        .productId(
                                request.getProductId()
                        )
                        .userId(
                                userId
                        )
                        .userName(userName)
                        .rating(
                                request.getRating()
                        )
                        .comment(
                                request.getComment()
                                        .trim()
                        )
                        .verifiedPurchase(true)
                        .build();

        return toResponse(
                reviewRepository.save(review)
        );
    }

    @Transactional
    public ReviewResponse updateReview(
            Long reviewId,
            ReviewRequest request,
            String authenticatedEmail
    ) {
        validateRequest(request);

        User user =
                getAuthenticatedUser(authenticatedEmail);

        Review review =
                reviewRepository
                        .findById(reviewId)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Không tìm thấy đánh giá"
                                )
                        );

        if (
                !review.getUserId()
                        .equals(
                                user.getId()
                        )
        ) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Bạn không có quyền sửa đánh giá này"
            );
        }

        review.setRating(
                request.getRating()
        );

        review.setComment(
                request.getComment().trim()
        );

        return toResponse(
                reviewRepository.save(review)
        );
    }

    @Transactional
    public void deleteReview(
            Long reviewId,
            String authenticatedEmail
    ) {
        User user =
                getAuthenticatedUser(authenticatedEmail);

        Review review =
                reviewRepository
                        .findById(reviewId)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Không tìm thấy đánh giá"
                                )
                        );

        if (
                !review.getUserId()
                        .equals(user.getId())
        ) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Bạn không có quyền xóa đánh giá này"
            );
        }

        reviewRepository.delete(review);
    }

    private User getAuthenticatedUser(
            String authenticatedEmail
    ) {
        if (
                authenticatedEmail == null ||
                authenticatedEmail.isBlank()
        ) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Bạn chưa đăng nhập"
            );
        }

        return userRepository
                .findByEmail(authenticatedEmail)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.UNAUTHORIZED,
                                "Tài khoản JWT không tồn tại"
                        )
                );
    }

    private void validateRequest(
            ReviewRequest request
    ) {
        if (
                request == null ||
                request.getProductId() == null
        ) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Thiếu thông tin đánh giá"
            );
        }

        if (
                request.getRating() == null ||
                request.getRating() < 1 ||
                request.getRating() > 5
        ) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Số sao phải nằm trong khoảng 1–5"
            );
        }

        if (
                request.getComment() == null ||
                request.getComment()
                        .trim()
                        .isEmpty()
        ) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Vui lòng nhập nội dung bình luận"
            );
        }

        if (
                request.getComment()
                        .trim()
                        .length() > 2000
        ) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Bình luận không được vượt quá 2000 ký tự"
            );
        }
    }

    private void validateProduct(
            Long productId
    ) {
        if (
                productId == null ||
                !productRepository
                        .existsById(productId)
        ) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Không tìm thấy sản phẩm"
            );
        }
    }

    private ReviewResponse toResponse(
            Review review
    ) {
        return ReviewResponse
                .builder()
                .id(review.getId())
                .productId(
                        review.getProductId()
                )
                .userId(
                        review.getUserId()
                )
                .userName(
                        review.getUserName()
                )
                .rating(
                        review.getRating()
                )
                .comment(
                        review.getComment()
                )
                .verifiedPurchase(
                        review.getVerifiedPurchase()
                )
                .createdAt(
                        review.getCreatedAt()
                )
                .updatedAt(
                        review.getUpdatedAt()
                )
                .build();
    }
}
