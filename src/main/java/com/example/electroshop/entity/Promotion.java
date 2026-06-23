package com.example.electroshop.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "promotions")

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Promotion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Tên chương trình khuyến mãi
    // Ví dụ: Sale laptop gaming 10%
    private String title;

    // ID sản phẩm được áp dụng khuyến mãi
    private Long productId;

    // Phần trăm giảm giá
    // Ví dụ: 10 nghĩa là giảm 10%
    private Integer discountPercent;

    // Ngày bắt đầu khuyến mãi
    private LocalDate startDate;

    // Ngày kết thúc khuyến mãi
    private LocalDate endDate;

    // Bật / tắt khuyến mãi
    private Boolean active;
}