package com.example.electroshop.entity;

import com.example.electroshop.entity.enums.OrderStatus;
import com.example.electroshop.entity.enums.PaymentMethod;
import com.example.electroshop.entity.enums.PaymentStatus;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(
    name = "orders",
    indexes = {
        @Index(
            name = "idx_order_code",
            columnList = "order_code"
        ),
        @Index(
            name = "idx_order_user_id",
            columnList = "user_id"
        )
    }
)
public class Order {

    @Id
    @GeneratedValue(
        strategy = GenerationType.IDENTITY
    )
    private Long id;

    @Column(
        name = "order_code",
        nullable = false,
        unique = true,
        length = 50
    )
    private String orderCode;

    /*
     * Tạm thời lưu userId.
     * Sau khi kiểm tra User.java sẽ liên kết
     * bằng @ManyToOne nếu phù hợp.
     */
    @Column(name = "user_id")
    private Long userId;

    @Column(
        name = "customer_name",
        nullable = false,
        length = 150
    )
    private String customerName;

    @Column(length = 150)
    private String email;

    @Column(
        nullable = false,
        length = 20
    )
    private String phone;

    @Column(
        name = "shipping_address",
        nullable = false,
        length = 500
    )
    private String shippingAddress;

    @Column(length = 1000)
    private String note;

    @Column(
        nullable = false,
        precision = 15,
        scale = 2
    )
    private BigDecimal subtotal =
            BigDecimal.ZERO;

    @Column(
        name = "shipping_fee",
        nullable = false,
        precision = 15,
        scale = 2
    )
    private BigDecimal shippingFee =
            BigDecimal.ZERO;

    @Column(
    name = "discount_amount",
    nullable = false,
    precision = 15,
    scale = 2
)
private BigDecimal discountAmount =
        BigDecimal.ZERO;

@Column(length = 100)
private String couponCode;

@Column(
    name = "total_amount",
    nullable = false,
    precision = 15,
    scale = 2
)
private BigDecimal totalAmount =
        BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(
        name = "payment_method",
        nullable = false,
        length = 30
    )
    private PaymentMethod paymentMethod;

    @Enumerated(EnumType.STRING)
    @Column(
        name = "payment_status",
        nullable = false,
        length = 30
    )
    private PaymentStatus paymentStatus =
            PaymentStatus.UNPAID;

    @Enumerated(EnumType.STRING)
    @Column(
        name = "order_status",
        nullable = false,
        length = 40
    )
    private OrderStatus orderStatus =
            OrderStatus.PENDING_CONFIRMATION;

    /*
 * Dùng để tránh hoàn tồn kho nhiều lần.
 */
@Column(
    name = "stock_released",
    nullable = false
)
private Boolean stockReleased = false;

/*
 * Đã tăng soldQuantity và usedCount chưa.
 */
private Boolean benefitsCommitted =
        false;

/*
 * Sau này dùng khi hủy đơn:
 * đã giảm lại soldQuantity và usedCount chưa.
 */
private Boolean benefitsReleased =
        false;

/*
 * Chỉ dùng cho đơn chờ thanh toán.
 */
@Column(name = "expires_at")
private LocalDateTime expiresAt;

    @Column(
        name = "created_at",
        nullable = false,
        updatable = false
    )
    private LocalDateTime createdAt;

    @Column(
        name = "updated_at",
        nullable = false
    )
    private LocalDateTime updatedAt;

    @OneToMany(
        mappedBy = "order",
        cascade = CascadeType.ALL,
        orphanRemoval = true
    )
    private List<OrderItem> items =
            new ArrayList<>();

    @PrePersist
    public void beforeCreate() {

        LocalDateTime now =
                LocalDateTime.now();

        createdAt = now;
        updatedAt = now;

        if (subtotal == null) {
            subtotal = BigDecimal.ZERO;
        }

        if (shippingFee == null) {
            shippingFee = BigDecimal.ZERO;
        }

        if (discountAmount == null) {
            discountAmount = BigDecimal.ZERO;
        }

        if (totalAmount == null) {
            totalAmount = BigDecimal.ZERO;
        }

        if (paymentStatus == null) {
            paymentStatus =
                    PaymentStatus.UNPAID;
        }

        if (stockReleased == null) {
            stockReleased = false;
        }

        if (benefitsCommitted == null) {
    benefitsCommitted = false;
}

if (benefitsReleased == null) {
    benefitsReleased = false;
}
    }

    @PreUpdate
    public void beforeUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public void addItem(
        OrderItem item
    ) {

        items.add(item);

        item.setOrder(this);
    }

    public void removeItem(
        OrderItem item
    ) {

        items.remove(item);

        item.setOrder(null);
    }

    public Long getId() {
        return id;
    }

    public void setId(
        Long id
    ) {
        this.id = id;
    }

    public String getOrderCode() {
        return orderCode;
    }

    public void setOrderCode(
        String orderCode
    ) {
        this.orderCode = orderCode;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(
        Long userId
    ) {
        this.userId = userId;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(
        String customerName
    ) {
        this.customerName =
                customerName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(
        String email
    ) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(
        String phone
    ) {
        this.phone = phone;
    }

    public String getShippingAddress() {
        return shippingAddress;
    }

    public void setShippingAddress(
        String shippingAddress
    ) {
        this.shippingAddress =
                shippingAddress;
    }

    public String getNote() {
        return note;
    }

    public void setNote(
        String note
    ) {
        this.note = note;
    }

    public BigDecimal getSubtotal() {
        return subtotal;
    }

    public void setSubtotal(
        BigDecimal subtotal
    ) {
        this.subtotal = subtotal;
    }

    public BigDecimal getShippingFee() {
        return shippingFee;
    }

    public void setShippingFee(
        BigDecimal shippingFee
    ) {
        this.shippingFee =
                shippingFee;
    }

public BigDecimal getDiscountAmount() {
    return discountAmount;
}

public void setDiscountAmount(
    BigDecimal discountAmount
) {
    this.discountAmount =
            discountAmount;
}

public String getCouponCode() {
    return couponCode;
}

public void setCouponCode(
    String couponCode
) {
    this.couponCode =
            couponCode;
}

public BigDecimal getTotalAmount() {
    return totalAmount;
}

    public void setTotalAmount(
        BigDecimal totalAmount
    ) {
        this.totalAmount =
                totalAmount;
    }

    public PaymentMethod getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(
        PaymentMethod paymentMethod
    ) {
        this.paymentMethod =
                paymentMethod;
    }

    public PaymentStatus getPaymentStatus() {
        return paymentStatus;
    }

    public void setPaymentStatus(
        PaymentStatus paymentStatus
    ) {
        this.paymentStatus =
                paymentStatus;
    }

    public OrderStatus getOrderStatus() {
        return orderStatus;
    }

    public void setOrderStatus(
        OrderStatus orderStatus
    ) {
        this.orderStatus =
                orderStatus;
    }

    public Boolean getStockReleased() {
    return stockReleased;
}

public void setStockReleased(
    Boolean stockReleased
) {
    this.stockReleased =
            stockReleased;
}

public Boolean getBenefitsCommitted() {
    return benefitsCommitted;
}

public void setBenefitsCommitted(
    Boolean benefitsCommitted
) {
    this.benefitsCommitted =
            benefitsCommitted;
}

public Boolean getBenefitsReleased() {
    return benefitsReleased;
}

public void setBenefitsReleased(
    Boolean benefitsReleased
) {
    this.benefitsReleased =
            benefitsReleased;
}

public LocalDateTime getExpiresAt() {
    return expiresAt;
}

    public void setExpiresAt(
        LocalDateTime expiresAt
    ) {
        this.expiresAt = expiresAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public List<OrderItem> getItems() {
        return items;
    }

    public void setItems(
        List<OrderItem> items
    ) {

        this.items.clear();

        if (items != null) {

            for (OrderItem item : items) {
                addItem(item);
            }
        }
    }
}