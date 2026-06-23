package com.example.electroshop.dto.checkout;

import com.example.electroshop.entity.enums.PaymentMethod;

import java.util.List;

public class CheckoutRequest {

    /*
     * Tạm thời lấy từ localStorage.
     * Sau này khi có JWT sẽ lấy từ token,
     * không lấy trực tiếp từ frontend.
     */
    private Long userId;

    private String customerName;

    private String email;

    private String phone;

    private String shippingAddress;

    private String note;

    private PaymentMethod paymentMethod;

    private String couponCode;

    private List<CheckoutItemRequest> items;

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

    public PaymentMethod getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(
            PaymentMethod paymentMethod
    ) {
        this.paymentMethod =
                paymentMethod;
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

    public List<CheckoutItemRequest> getItems() {
        return items;
    }

    public void setItems(
            List<CheckoutItemRequest> items
    ) {
        this.items = items;
    }
}