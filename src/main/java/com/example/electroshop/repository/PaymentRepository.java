package com.example.electroshop.repository;

import com.example.electroshop.entity.Payment;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PaymentRepository
        extends JpaRepository<Payment, Long> {

    Optional<Payment> findByTxnRef(
        String txnRef
    );

    List<Payment> findByOrderIdOrderByCreatedAtDesc(
        Long orderId
    );

    boolean existsByTxnRef(
        String txnRef
    );
}