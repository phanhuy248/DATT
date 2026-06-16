-- V7: Thêm bảng flash_sale_items cho tính năng Flash Sale thật
CREATE TABLE IF NOT EXISTS flash_sale_items (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    product_id  BIGINT       NOT NULL,
    sale_price  DECIMAL(15,2) NOT NULL,
    start_at    DATETIME(6)  NOT NULL,
    end_at      DATETIME(6)  NOT NULL,
    quantity_limit INT        NULL COMMENT 'NULL = không giới hạn',
    sold_count  INT          NOT NULL DEFAULT 0,
    active      BIT(1)       NOT NULL DEFAULT 1,
    sort_order  INT          NOT NULL DEFAULT 0,
    created_at  DATETIME(6),
    updated_at  DATETIME(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_flash_sale_product (product_id),
    CONSTRAINT fk_flash_sale_product
        FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
    INDEX idx_flash_sale_active_time (active, start_at, end_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
