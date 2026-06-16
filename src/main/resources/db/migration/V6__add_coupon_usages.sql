-- ============================================================
-- V6__add_coupon_usages.sql
-- Bảng theo dõi lịch sử dùng mã giảm giá theo từng user.
-- Unique constraint (user_id, coupon_id) ngăn 1 user dùng lại
-- cùng 1 mã nhiều lần.
-- ============================================================

CREATE TABLE IF NOT EXISTS coupon_usages (
    id         BIGINT       NOT NULL AUTO_INCREMENT,
    user_id    BIGINT       NOT NULL,
    coupon_id  BIGINT       NOT NULL,
    order_id   BIGINT,
    used_at    DATETIME(6)  NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_coupon_usage_user_coupon (user_id, coupon_id),
    CONSTRAINT fk_cu_user   FOREIGN KEY (user_id)   REFERENCES users(id),
    CONSTRAINT fk_cu_coupon FOREIGN KEY (coupon_id) REFERENCES coupons(id),
    CONSTRAINT fk_cu_order  FOREIGN KEY (order_id)  REFERENCES orders(id)
);
