package com.smartshop.demo.dto.payment;

import java.math.BigDecimal;

public class BankTransferPaymentInfo {
    private final long orderId;
    private final BigDecimal amount;
    private final String transferContent;
    private final String bankId;
    private final String bankName;
    private final String accountNumber;
    private final String accountName;
    private final String branch;
    private final String qrImageUrl;
    /** URL ảnh QR động từ SePay (qr.sepay.vn) — ưu tiên hiển thị hơn qrImageUrl. */
    private final String qrUrl;
    private final String paymentStatus;

    public BankTransferPaymentInfo(long orderId,
                                   BigDecimal amount,
                                   String transferContent,
                                   String bankId,
                                   String bankName,
                                   String accountNumber,
                                   String accountName,
                                   String branch,
                                   String qrImageUrl,
                                   String qrUrl,
                                   String paymentStatus) {
        this.orderId = orderId;
        this.amount = amount;
        this.transferContent = transferContent;
        this.bankId = bankId;
        this.bankName = bankName;
        this.accountNumber = accountNumber;
        this.accountName = accountName;
        this.branch = branch;
        this.qrImageUrl = qrImageUrl;
        this.qrUrl = qrUrl;
        this.paymentStatus = paymentStatus;
    }

    public long getOrderId() { return orderId; }
    public BigDecimal getAmount() { return amount; }
    public String getTransferContent() { return transferContent; }
    public String getBankId() { return bankId; }
    public String getBankName() { return bankName; }
    public String getAccountNumber() { return accountNumber; }
    public String getAccountName() { return accountName; }
    public String getBranch() { return branch; }
    public String getQrImageUrl() { return qrImageUrl; }
    public String getQrUrl() { return qrUrl; }
    public String getPaymentStatus() { return paymentStatus; }
}
