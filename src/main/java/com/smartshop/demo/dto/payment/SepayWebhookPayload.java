package com.smartshop.demo.dto.payment;

import java.math.BigDecimal;

/**
 * Payload JSON do SePay gửi tới webhook của hệ thống.
 * Tham khảo: https://docs.sepay.vn/tich-hop-webhooks.html
 */
public class SepayWebhookPayload {

    /** ID giao dịch trên SePay — không đổi qua mọi lần retry. Dùng làm khoá idempotency. */
    private Long id;

    /** Tên ngân hàng (vd "Vietcombank", "BIDV"). */
    private String gateway;

    /** Ngày giờ giao dịch, định dạng "YYYY-MM-DD HH:MM:SS" (múi giờ VN). */
    private String transactionDate;

    /** Số tài khoản nhận tiền. */
    private String accountNumber;

    /** Tài khoản ảo khớp với giao dịch (có thể rỗng). */
    private String subAccount;

    /** Mã thanh toán trích xuất từ nội dung theo cấu hình công ty (có thể null). */
    private String code;

    /** Nội dung chuyển khoản gốc — dùng để parse mã đơn hàng. */
    private String content;

    /** "in" = tiền vào, "out" = tiền ra. Chỉ xử lý "in". */
    private String transferType;

    /** Mô tả đầy đủ từ ngân hàng (có thể rỗng nếu ngân hàng không hỗ trợ). */
    private String description;

    /** Số tiền giao dịch (VND, luôn dương). */
    private BigDecimal transferAmount;

    /** Số dư sau giao dịch (0 nếu ngân hàng không hỗ trợ). */
    private Long accumulated;

    /** Mã tham chiếu ngân hàng (có thể rỗng). */
    private String referenceCode;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getGateway() { return gateway; }
    public void setGateway(String gateway) { this.gateway = gateway; }

    public String getTransactionDate() { return transactionDate; }
    public void setTransactionDate(String transactionDate) { this.transactionDate = transactionDate; }

    public String getAccountNumber() { return accountNumber; }
    public void setAccountNumber(String accountNumber) { this.accountNumber = accountNumber; }

    public String getSubAccount() { return subAccount; }
    public void setSubAccount(String subAccount) { this.subAccount = subAccount; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getTransferType() { return transferType; }
    public void setTransferType(String transferType) { this.transferType = transferType; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public BigDecimal getTransferAmount() { return transferAmount; }
    public void setTransferAmount(BigDecimal transferAmount) { this.transferAmount = transferAmount; }

    public Long getAccumulated() { return accumulated; }
    public void setAccumulated(Long accumulated) { this.accumulated = accumulated; }

    public String getReferenceCode() { return referenceCode; }
    public void setReferenceCode(String referenceCode) { this.referenceCode = referenceCode; }
}
