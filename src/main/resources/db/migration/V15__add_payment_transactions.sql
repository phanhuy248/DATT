-- V15: Thêm bảng payment_transactions để lưu lịch sử mọi giao dịch thanh toán VNPAY
-- Giải quyết vấn đề: order.transactionCode bị ghi đè khi user thử thanh toán lại,
-- mất audit trail và không thể đối soát với VNPAY.

CREATE TABLE payment_transactions
(
    id                 BIGINT       NOT NULL AUTO_INCREMENT,
    order_id           BIGINT       NOT NULL,
    gateway            VARCHAR(20)  NOT NULL COMMENT 'VNPAY | BANK_TRANSFER | SEPAY',
    -- Thông tin giao dịch từ cổng thanh toán
    gateway_txn_ref    VARCHAR(50)  NULL     COMMENT 'vnp_TxnRef gửi đến VNPAY',
    gateway_txn_no     VARCHAR(50)  NULL     COMMENT 'vnp_TransactionNo do VNPAY sinh',
    -- Kết quả
    response_code      VARCHAR(10)  NULL     COMMENT 'vnp_ResponseCode (00 = thành công)',
    txn_status         VARCHAR(10)  NULL     COMMENT 'vnp_TransactionStatus',
    payment_status     VARCHAR(20)  NOT NULL COMMENT 'PENDING | PAID | FAILED | CANCELLED',
    -- Số tiền (VND)
    amount             DECIMAL(15, 2) NOT NULL,
    -- Siêu dữ liệu
    ip_address         VARCHAR(45)  NULL,
    created_at         DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    CONSTRAINT fk_ptxn_order FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE
);

CREATE INDEX idx_ptxn_order_id    ON payment_transactions (order_id);
CREATE INDEX idx_ptxn_gateway_ref ON payment_transactions (gateway_txn_ref);
CREATE INDEX idx_ptxn_created_at  ON payment_transactions (created_at);
