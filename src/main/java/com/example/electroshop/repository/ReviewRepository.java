package com.example.electroshop.repository;

import com.example.electroshop.entity.Review;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ReviewRepository
        extends JpaRepository<Review, Long> {

    List<Review>
    findByProductIdOrderByCreatedAtDesc(
            Long productId
    );

    List<Review>
    findByProductIdIn(
            List<Long> productIds
    );

    Optional<Review>
    findByProductIdAndUserId(
            Long productId,
            Long userId
    );

    boolean existsByProductIdAndUserId(
            Long productId,
            Long userId
    );
}
