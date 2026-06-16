-- ============================================================
-- V10__add_sepay_transactions.sql
-- Bảng ghi nhận giao dịch từ SePay webhook.
-- sepay_id UNIQUE dùng để chống xử lý trùng (idempotency).
-- ============================================================

CREATE TABLE sepay_transactions (
    id               BIGINT          NOT NULL AUTO_INCREMENT,
    sepay_id         BIGINT          NOT NULL,
    order_id         BIGINT          NULL,
    gateway          VARCHAR(100)    NULL,
    account_number   VARCHAR(100)    NULL,
    transfer_amount  DECIMAL(15, 2)  NOT NULL,
    content          TEXT            NULL,
    reference_code   VARCHAR(255)    NULL,
    transaction_date DATETIME        NULL,
    raw_payload      JSON            NULL,
    matched          BIT(1)          NOT NULL DEFAULT 0,
    created_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uk_sepay_id (sepay_id),
    INDEX idx_sepay_order_id (order_id),
    CONSTRAINT fk_sepay_order
        FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE SET NULL
);
