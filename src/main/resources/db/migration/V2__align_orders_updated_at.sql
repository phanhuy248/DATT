SET @orders_updated_at_exists := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'orders'
      AND COLUMN_NAME = 'updated_at'
);

SET @orders_updated_at_sql := IF(
    @orders_updated_at_exists = 0,
    'ALTER TABLE orders ADD COLUMN updated_at DATETIME(6)',
    'SELECT 1'
);

PREPARE orders_updated_at_stmt FROM @orders_updated_at_sql;
EXECUTE orders_updated_at_stmt;
DEALLOCATE PREPARE orders_updated_at_stmt;
