-- ============================================================
-- V12__fix_payment_status_enum_to_varchar.sql
-- DB was created by ddl-auto=update with older Hibernate that
-- mapped @Enumerated(STRING) to MySQL ENUM. The ENUM only had
-- the values that existed at table-creation time, so new values
-- like CANCELLED and FAILED are rejected with "Data truncated".
-- Fix: convert both payment_status columns to VARCHAR(50).
-- Safe to run on both ENUM and VARCHAR columns (idempotent).
-- ============================================================

-- orders.payment_status
ALTER TABLE orders
    MODIFY COLUMN payment_status VARCHAR(50);

-- order_status_history.payment_status (if column exists)
SET @col_exists := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'order_status_history'
      AND COLUMN_NAME  = 'payment_status'
);
SET @sql := IF(@col_exists > 0,
    'ALTER TABLE order_status_history MODIFY COLUMN payment_status VARCHAR(50)',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
