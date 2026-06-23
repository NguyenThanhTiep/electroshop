package com.example.electroshop.entity;

import java.math.BigDecimal;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "flash_sale_items")

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FlashSaleItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ID chiến dịch flash sale
    private Long flashSaleId;

    // ID sản phẩm tham gia flash sale
    private Long productId;

@Column(
        name = "sale_price",
        precision = 15,
        scale = 2
)
private BigDecimal salePrice;

    // Phần trăm giảm
    private Integer discountPercent;

    // Số lượng được bán trong flash sale
    private Integer saleQuantity;

    // Số lượng đã bán
    private Integer soldQuantity;

    // Mỗi người được mua tối đa bao nhiêu
    private Integer limitPerUser;

    // Bật / tắt sản phẩm này trong chiến dịch
    private Boolean active;
}