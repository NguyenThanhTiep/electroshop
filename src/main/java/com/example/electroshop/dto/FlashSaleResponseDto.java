package com.example.electroshop.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FlashSaleResponseDto {

    private Long id;

    private String title;

    private String subtitle;

    private String bannerImage;

    private LocalDateTime startTime;

    private LocalDateTime endTime;

    private Boolean active;

    private Integer sortOrder;

    private List<FlashSaleProductDto> items;
}