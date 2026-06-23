package com.example.electroshop.entity.enums;

public enum OrderStatus {

    WAITING_PAYMENT,       // Đang chờ thanh toán VNPAY

    PENDING_CONFIRMATION,  // Chờ cửa hàng xác nhận

    CONFIRMED,             // Đã xác nhận

    PREPARING,             // Đang chuẩn bị hàng

    SHIPPING,              // Đang giao hàng

    COMPLETED,             // Đã giao thành công

    CANCELLED              // Đã hủy
}