package com.smartshop.demo.domain;

public enum OrderStatus {
    PENDING_PAYMENT, // Chờ thanh toán (VNPAY / SePay)
    PENDING,         // Chờ xử lý (COD hoặc sau khi thanh toán xong)
    CONFIRMED,
    PROCESSING,
    SHIPPING,
    COMPLETED,
    CANCELLED
}
