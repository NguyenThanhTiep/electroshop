package com.example.electroshop.repository;

import com.example.electroshop.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderItemRepository
        extends JpaRepository<OrderItem, Long> {

    boolean existsByProductId(Long productId);
}