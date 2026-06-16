-- V14: Thêm giá gốc/giảm giá cho sản phẩm và tạo bảng wishlist

-- 1. Thêm cột giá gốc và phần trăm giảm giá vào bảng products
ALTER TABLE products
    ADD COLUMN original_price DECIMAL(15, 2) NULL COMMENT 'Giá gốc trước khi giảm giá',
    ADD COLUMN discount_percent INT NULL COMMENT 'Phần trăm giảm giá (0-100)';

-- 2. Tạo bảng wishlists (sản phẩm yêu thích của user)
CREATE TABLE wishlists
(
    id         BIGINT      NOT NULL AUTO_INCREMENT,
    user_id    BIGINT      NOT NULL,
    product_id BIGINT      NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_wishlist_user_product (user_id, product_id),
    CONSTRAINT fk_wishlist_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_wishlist_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
);

CREATE INDEX idx_wishlist_user_id ON wishlists (user_id);
