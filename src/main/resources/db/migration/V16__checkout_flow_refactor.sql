-- V16: Refactor checkout flow
-- 1. Thêm OrderStatus PENDING_PAYMENT (chờ thanh toán VNPAY/SePay)
-- 2. Đổi PaymentStatus PAID → SUCCESS
-- 3. Thêm các cột: cancel_reason, cancelled_at, paid_at
-- 4. Migration dữ liệu: đơn PENDING + VNPAY/BANK_TRANSFER + paymentStatus=PENDING → PENDING_PAYMENT

-- ── Thêm cột mới vào bảng orders ──────────────────────────────
ALTER TABLE orders
    ADD COLUMN cancel_reason VARCHAR(500) NULL COMMENT 'Lý do hủy đơn'           AFTER transaction_code,
    ADD COLUMN cancelled_at  DATETIME(6)  NULL COMMENT 'Thời điểm hủy đơn'      AFTER cancel_reason,
    ADD COLUMN paid_at       DATETIME(6)  NULL COMMENT 'Thời điểm thanh toán xong' AFTER cancelled_at;

-- ── Rename PAID → SUCCESS trong payment_status ────────────────
UPDATE orders SET payment_status = 'SUCCESS' WHERE payment_status = 'PAID';

-- ── Migration: đơn VNPAY/BANK_TRANSFER đang PENDING chờ TT → PENDING_PAYMENT ──
-- Những đơn này tồn tại trước khi có PENDING_PAYMENT; chuyển trạng thái để UI hiển thị đúng.
UPDATE orders
SET status = 'PENDING_PAYMENT'
WHERE status = 'PENDING'
  AND payment_method IN ('VNPAY', 'BANK_TRANSFER')
  AND payment_status = 'PENDING';

-- ── Index hỗ trợ scheduler tìm đơn hết hạn nhanh ─────────────
CREATE INDEX idx_orders_status_created ON orders (status, created_date);
