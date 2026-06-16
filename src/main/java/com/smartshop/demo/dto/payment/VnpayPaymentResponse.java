package com.smartshop.demo.dto.payment;

import java.math.BigDecimal;

public class VnpayPaymentResponse {
    private long orderId;
    private BigDecimal amount;
    private String txnRef;
    private String paymentUrl;

    public VnpayPaymentResponse(long orderId, BigDecimal amount, String txnRef, String paymentUrl) {
        this.orderId = orderId;
        this.amount = amount;
        this.txnRef = txnRef;
        this.paymentUrl = paymentUrl;
    }

    public long getOrderId() { return orderId; }
    public BigDecimal getAmount() { return amount; }
    public String getTxnRef() { return txnRef; }
    public String getPaymentUrl() { return paymentUrl; }
}
