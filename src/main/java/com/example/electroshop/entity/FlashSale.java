package com.example.electroshop.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "flash_sales")

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FlashSale {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Tiêu đề chiến dịch
    // Ví dụ: GIỜ VÀNG DEAL SỐC
    private String title;

    // Mô tả phụ
    // Ví dụ: Săn ưu đãi giới hạn trong khung giờ vàng
    @Column(length = 1000)
    private String subtitle;

    // Ảnh banner header
    // Ví dụ: /images/golden-hour-header.png
    @Column(length = 1000)
    private String bannerImage;

    // Thời gian bắt đầu
    private LocalDateTime startTime;

    // Thời gian kết thúc
    private LocalDateTime endTime;

    // Bật / tắt chiến dịch
    private Boolean active;

    // Thứ tự hiển thị
    private Integer sortOrder;
}