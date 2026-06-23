package com.example.electroshop.dto.review;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewResponse {

    private Long id;

    private Long productId;

    private Long userId;

    private String userName;

    private Integer rating;

    private String comment;

    private Boolean verifiedPurchase;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}