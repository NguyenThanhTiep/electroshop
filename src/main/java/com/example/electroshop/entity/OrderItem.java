package com.example.electroshop.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.*;

import java.math.BigDecimal;

@Entity
@Table(name = "order_items")
public class OrderItem {

    @Id
    @GeneratedValue(
        strategy = GenerationType.IDENTITY
    )
    private Long id;

    @Column(
        name = "product_id",
        nullable = false
    )
    private Long productId;

    /*
     * Lưu snapshot tên sản phẩm
     * tại thời điểm khách đặt hàng.
     */
    @Column(
        name = "product_name",
        nullable = false,
        length = 255
    )
    private String productName;

    /*
     * Lưu snapshot ảnh sản phẩm.
     */
    @Column(
        name = "product_image",
        length = 1000
    )
    private String productImage;

    /*
     * Có thể lưu JSON lựa chọn:
     * màu sắc, RAM, SSD...
     */
    @Column(
        name = "selected_options",
        columnDefinition = "TEXT"
    )
    private String selectedOptions;

    @Column(
        name = "unit_price",
        nullable = false,
        precision = 15,
        scale = 2
    )
    private BigDecimal unitPrice;

    @Column(nullable = false)
    private Integer quantity;

    @Column(
    name = "line_total",
    nullable = false,
    precision = 15,
    scale = 2
)
private BigDecimal lineTotal;

/*
 * ID của flash_sale_items được áp dụng
 * cho sản phẩm này.
 *
 * Null nếu sản phẩm không dùng Flash Sale.
 */
private Long flashSaleItemId;

/*
 * REGULAR
 * PROMOTION
 * FLASH_SALE
 */
@Column(length = 30)
private String priceSource;

@ManyToOne(
    fetch = FetchType.LAZY,
    optional = false
)
    @JsonIgnore
    private Order order;

    public Long getId() {
        return id;
    }

    public void setId(
        Long id
    ) {
        this.id = id;
    }

    public Long getProductId() {
        return productId;
    }

    public void setProductId(
        Long productId
    ) {
        this.productId = productId;
    }

    public String getProductName() {
        return productName;
    }

    public void setProductName(
        String productName
    ) {
        this.productName =
                productName;
    }

    public String getProductImage() {
        return productImage;
    }

    public void setProductImage(
        String productImage
    ) {
        this.productImage =
                productImage;
    }

    public String getSelectedOptions() {
        return selectedOptions;
    }

    public void setSelectedOptions(
        String selectedOptions
    ) {
        this.selectedOptions =
                selectedOptions;
    }

    public BigDecimal getUnitPrice() {
        return unitPrice;
    }

    public void setUnitPrice(
        BigDecimal unitPrice
    ) {
        this.unitPrice = unitPrice;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(
        Integer quantity
    ) {
        this.quantity = quantity;
    }

    public BigDecimal getLineTotal() {
    return lineTotal;
}

public void setLineTotal(
    BigDecimal lineTotal
) {
    this.lineTotal = lineTotal;
}

public Long getFlashSaleItemId() {
    return flashSaleItemId;
}

public void setFlashSaleItemId(
    Long flashSaleItemId
) {
    this.flashSaleItemId =
            flashSaleItemId;
}

public String getPriceSource() {
    return priceSource;
}

public void setPriceSource(
    String priceSource
) {
    this.priceSource =
            priceSource;
}

public Order getOrder() {
    return order;
}

    public void setOrder(
        Order order
    ) {
        this.order = order;
    }
}