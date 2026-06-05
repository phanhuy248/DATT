package com.example.demo.dto.payment;

public class VnpayReturnResult {
    private final boolean validSignature;
    private final boolean success;
    private final Long orderId;
    private final String txnRef;
    private final String responseCode;
    private final String transactionStatus;
    private final String transactionNo;
    private final String message;

    public VnpayReturnResult(boolean validSignature,
                             boolean success,
                             Long orderId,
                             String txnRef,
                             String responseCode,
                             String transactionStatus,
                             String transactionNo,
                             String message) {
        this.validSignature = validSignature;
        this.success = success;
        this.orderId = orderId;
        this.txnRef = txnRef;
        this.responseCode = responseCode;
        this.transactionStatus = transactionStatus;
        this.transactionNo = transactionNo;
        this.message = message;
    }

    public boolean isValidSignature() { return validSignature; }
    public boolean isSuccess() { return success; }
    public Long getOrderId() { return orderId; }
    public String getTxnRef() { return txnRef; }
    public String getResponseCode() { return responseCode; }
    public String getTransactionStatus() { return transactionStatus; }
    public String getTransactionNo() { return transactionNo; }
    public String getMessage() { return message; }
}
