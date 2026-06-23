package com.example.electroshop.dto.checkout;

import com.example.electroshop.entity.enums.OrderStatus;
import com.example.electroshop.entity.enums.PaymentMethod;
import com.example.electroshop.entity.enums.PaymentStatus;

import java.math.BigDecimal;

public class CheckoutResponse {

    private Long orderId;

    private String orderCode;

    private BigDecimal subtotal;

    private BigDecimal shippingFee;

    private BigDecimal discountAmount;

    private BigDecimal totalAmount;

    private PaymentMethod paymentMethod;

    private PaymentStatus paymentStatus;

    private OrderStatus orderStatus;

    /*
     * COD: null
     * VNPAY: URL chuyển sang cổng thanh toán
     */
    private String paymentUrl;

    public CheckoutResponse() {
    }

    public CheckoutResponse(
            Long orderId,
            String orderCode,
            BigDecimal subtotal,
            BigDecimal shippingFee,
            BigDecimal discountAmount,
            BigDecimal totalAmount,
            PaymentMethod paymentMethod,
            PaymentStatus paymentStatus,
            OrderStatus orderStatus,
            String paymentUrl
    ) {
        this.orderId = orderId;
        this.orderCode = orderCode;
        this.subtotal = subtotal;
        this.shippingFee = shippingFee;
        this.discountAmount = discountAmount;
        this.totalAmount = totalAmount;
        this.paymentMethod = paymentMethod;
        this.paymentStatus = paymentStatus;
        this.orderStatus = orderStatus;
        this.paymentUrl = paymentUrl;
    }

    public Long getOrderId() {
        return orderId;
    }

    public String getOrderCode() {
        return orderCode;
    }

    public BigDecimal getSubtotal() {
        return subtotal;
    }

    public BigDecimal getShippingFee() {
        return shippingFee;
    }

    public BigDecimal getDiscountAmount() {
        return discountAmount;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public PaymentMethod getPaymentMethod() {
        return paymentMethod;
    }

    public PaymentStatus getPaymentStatus() {
        return paymentStatus;
    }

    public OrderStatus getOrderStatus() {
        return orderStatus;
    }

    public String getPaymentUrl() {
        return paymentUrl;
    }

    public void setPaymentUrl(
            String paymentUrl
    ) {
        this.paymentUrl = paymentUrl;
    }
}