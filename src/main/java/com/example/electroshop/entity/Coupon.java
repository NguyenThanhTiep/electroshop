package com.example.electroshop.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "coupons")

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Coupon {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Mã giảm giá người dùng nhập
    // Ví dụ: SALE10, GIAM200, FREESHIP
    @Column(unique = true)
    private String code;

    // Tên mô tả mã giảm giá
    // Ví dụ: Giảm 10% cho đơn hàng từ 10 triệu
    private String name;

    // Loại giảm giá:
    // PERCENT = giảm theo %
    // AMOUNT = giảm số tiền cố định
    private String discountType;

    // Giá trị giảm
    // Nếu PERCENT: 10 nghĩa là 10%
    // Nếu AMOUNT: 200000 nghĩa là giảm 200.000đ
    private Double discountValue;

    // Giá trị đơn hàng tối thiểu để dùng mã
    private Double minOrderValue;

    // Mức giảm tối đa
    // Dùng nhiều cho loại PERCENT
    private Double maxDiscount;

    // Ngày bắt đầu áp dụng mã
    private LocalDate startDate;

    // Ngày kết thúc áp dụng mã
    private LocalDate endDate;

    // Giới hạn số lượt dùng
    private Integer usageLimit;

    // Số lượt đã dùng
    private Integer usedCount;

    // Bật / tắt mã giảm giá
    private Boolean active;
}