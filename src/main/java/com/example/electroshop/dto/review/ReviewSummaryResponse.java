package com.example.electroshop.dto.review;

import lombok.*;

import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewSummaryResponse {

    private Double averageRating;

    private Long totalReviews;

    private Map<Integer, Long>
            ratingCounts;
}