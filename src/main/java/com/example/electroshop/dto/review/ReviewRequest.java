package com.example.electroshop.dto.review;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewRequest {

    private Long productId;

    private Long userId;

    private Integer rating;

    private String comment;
}