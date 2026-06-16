package com.smartshop.demo.event;

import java.math.BigDecimal;

public class OrderConfirmationEvent {
    private final long orderId;
    private final String userEmail;
    private final BigDecimal totalPrice;
    private final String status;

    public OrderConfirmationEvent(long orderId, String userEmail,
                                   BigDecimal totalPrice, String status) {
        this.orderId = orderId;
        this.userEmail = userEmail;
        this.totalPrice = totalPrice;
        this.status = status;
    }

    public long getOrderId() { return orderId; }
    public String getUserEmail() { return userEmail; }
    public BigDecimal getTotalPrice() { return totalPrice; }
    public String getStatus() { return status; }
}
