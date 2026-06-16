-- ============================================================
-- V13__add_product_active.sql
-- Thêm cột active để hỗ trợ trạng thái "Tạm dừng bán":
--   active = 1 → đang bán (hiện trên client)
--   active = 0 → tạm dừng (ẩn khỏi client, vẫn hiện trong admin)
-- Dùng information_schema check để tương thích MySQL 5.7+
-- ============================================================

SET @col_exists := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'products'
      AND COLUMN_NAME  = 'active'
);
SET @sql := IF(@col_exists = 0,
    'ALTER TABLE products ADD COLUMN active TINYINT(1) NOT NULL DEFAULT 1',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

UPDATE products SET active = 1 WHERE active IS NULL;
