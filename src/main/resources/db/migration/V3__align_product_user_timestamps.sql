SET @products_created_at_exists := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'products'
      AND COLUMN_NAME = 'created_at'
);

SET @products_created_at_sql := IF(
    @products_created_at_exists = 0,
    'ALTER TABLE products ADD COLUMN created_at DATETIME(6)',
    'SELECT 1'
);

PREPARE products_created_at_stmt FROM @products_created_at_sql;
EXECUTE products_created_at_stmt;
DEALLOCATE PREPARE products_created_at_stmt;

SET @products_updated_at_exists := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'products'
      AND COLUMN_NAME = 'updated_at'
);

SET @products_updated_at_sql := IF(
    @products_updated_at_exists = 0,
    'ALTER TABLE products ADD COLUMN updated_at DATETIME(6)',
    'SELECT 1'
);

PREPARE products_updated_at_stmt FROM @products_updated_at_sql;
EXECUTE products_updated_at_stmt;
DEALLOCATE PREPARE products_updated_at_stmt;

SET @users_created_at_exists := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'users'
      AND COLUMN_NAME = 'created_at'
);

SET @users_created_at_sql := IF(
    @users_created_at_exists = 0,
    'ALTER TABLE users ADD COLUMN created_at DATETIME(6)',
    'SELECT 1'
);

PREPARE users_created_at_stmt FROM @users_created_at_sql;
EXECUTE users_created_at_stmt;
DEALLOCATE PREPARE users_created_at_stmt;

SET @users_updated_at_exists := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'users'
      AND COLUMN_NAME = 'updated_at'
);

SET @users_updated_at_sql := IF(
    @users_updated_at_exists = 0,
    'ALTER TABLE users ADD COLUMN updated_at DATETIME(6)',
    'SELECT 1'
);

PREPARE users_updated_at_stmt FROM @users_updated_at_sql;
EXECUTE users_updated_at_stmt;
DEALLOCATE PREPARE users_updated_at_stmt;
