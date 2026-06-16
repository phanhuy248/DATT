package com.smartshop.demo.domain;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "sepay_transactions")
public class SepayTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** ID giao dịch từ SePay — dùng làm khoá idempotency (UNIQUE). */
    @Column(name = "sepay_id", nullable = false, unique = true)
    private Long sepayId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id")
    private Order order;

    @Column(length = 100)
    private String gateway;

    @Column(name = "account_number", length = 100)
    private String accountNumber;

    @Column(name = "transfer_amount", precision = 15, scale = 2, nullable = false)
    private BigDecimal transferAmount;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(name = "reference_code", length = 255)
    private String referenceCode;

    @Column(name = "transaction_date")
    private LocalDateTime transactionDate;

    /** Payload JSON thô từ SePay để tra cứu sau. */
    @Column(name = "raw_payload", columnDefinition = "JSON")
    private String rawPayload;

    /** true nếu đã khớp với đơn hàng và cập nhật PAID thành công. */
    @Column(nullable = false)
    private boolean matched;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }

    public Long getSepayId() { return sepayId; }
    public void setSepayId(Long sepayId) { this.sepayId = sepayId; }

    public Order getOrder() { return order; }
    public void setOrder(Order order) { this.order = order; }

    public String getGateway() { return gateway; }
    public void setGateway(String gateway) { this.gateway = gateway; }

    public String getAccountNumber() { return accountNumber; }
    public void setAccountNumber(String accountNumber) { this.accountNumber = accountNumber; }

    public BigDecimal getTransferAmount() { return transferAmount; }
    public void setTransferAmount(BigDecimal transferAmount) { this.transferAmount = transferAmount; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getReferenceCode() { return referenceCode; }
    public void setReferenceCode(String referenceCode) { this.referenceCode = referenceCode; }

    public LocalDateTime getTransactionDate() { return transactionDate; }
    public void setTransactionDate(LocalDateTime transactionDate) { this.transactionDate = transactionDate; }

    public String getRawPayload() { return rawPayload; }
    public void setRawPayload(String rawPayload) { this.rawPayload = rawPayload; }

    public boolean isMatched() { return matched; }
    public void setMatched(boolean matched) { this.matched = matched; }

    public LocalDateTime getCreatedAt() { return createdAt; }
}
