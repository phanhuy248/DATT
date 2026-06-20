package com.smartshop.demo.domain;

public enum PaymentStatus {
    UNPAID,    // COD — chưa thanh toán khi giao hàng
    PENDING,   // Đang chờ xác nhận từ cổng thanh toán
    SUCCESS,   // Thanh toán thành công (trước đây là PAID)
    FAILED,    // Thanh toán thất bại
    CANCELLED, // Người dùng hủy giao dịch VNPay (responseCode=24)
    REFUNDED   // Đã hoàn tiền
}
