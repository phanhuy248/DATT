-- ============================================================
-- V5__align_entities_with_schema.sql
-- Aligns DB schema with current entity definitions.
-- Safe for both: fresh install (Flyway V1) and existing DBs
-- (previously managed by ddl-auto=update).
-- Each ALTER uses information_schema checks → idempotent.
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ── 1. order_details: rename table order_detail → order_details (if needed) ─
-- Existing DBs (ddl-auto=update): Hibernate created "order_detail" (no @Table annotation).
-- Fresh install (Flyway V1): table is already "order_details" → no-op.
SET @old_exists := (SELECT COUNT(*) FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'order_detail');
SET @new_exists := (SELECT COUNT(*) FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'order_details');
SET @sql := IF(@old_exists = 1 AND @new_exists = 0,
    'RENAME TABLE order_detail TO order_details',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ── 2. order_status_history: rename changed_by → changed_by_id (if needed) ─
-- Entity now uses @JoinColumn(name = "changed_by_id") to match V1 schema.
SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'order_status_history' AND COLUMN_NAME = 'changed_by');
SET @target_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'order_status_history' AND COLUMN_NAME = 'changed_by_id');
SET @sql := IF(@col_exists = 1 AND @target_exists = 0,
    'ALTER TABLE order_status_history RENAME COLUMN changed_by TO changed_by_id',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ── 3. password_reset_tokens: add user_id FK + used column ─────────────────
SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'password_reset_tokens' AND COLUMN_NAME = 'user_id');
SET @sql := IF(@col_exists = 0,
    'ALTER TABLE password_reset_tokens ADD COLUMN user_id BIGINT',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @fk_exists := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'password_reset_tokens' AND CONSTRAINT_NAME = 'fk_prt_user');
SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'password_reset_tokens' AND COLUMN_NAME = 'user_id');
SET @sql := IF(@fk_exists = 0 AND @col_exists = 1,
    'ALTER TABLE password_reset_tokens ADD CONSTRAINT fk_prt_user FOREIGN KEY (user_id) REFERENCES users(id)',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'password_reset_tokens' AND COLUMN_NAME = 'used');
SET @sql := IF(@col_exists = 0,
    'ALTER TABLE password_reset_tokens ADD COLUMN used TINYINT(1) NOT NULL DEFAULT 0',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ── 4. banners: add subtitle + deleted; rename link → link_url ─────────────
SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'banners' AND COLUMN_NAME = 'subtitle');
SET @sql := IF(@col_exists = 0,
    'ALTER TABLE banners ADD COLUMN subtitle VARCHAR(500)',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'banners' AND COLUMN_NAME = 'deleted');
SET @sql := IF(@col_exists = 0,
    'ALTER TABLE banners ADD COLUMN deleted TINYINT(1) NOT NULL DEFAULT 0',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @link_exists    := (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'banners' AND COLUMN_NAME = 'link');
SET @link_url_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'banners' AND COLUMN_NAME = 'link_url');
SET @sql := IF(@link_exists = 1 AND @link_url_exists = 0,
    'ALTER TABLE banners RENAME COLUMN link TO link_url',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ── 5. posts: add slug (unique), thumbnail, published ──────────────────────
SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'posts' AND COLUMN_NAME = 'slug');
SET @sql := IF(@col_exists = 0,
    'ALTER TABLE posts ADD COLUMN slug VARCHAR(500)',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists := (SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'posts' AND INDEX_NAME = 'idx_post_slug');
SET @sql := IF(@idx_exists = 0,
    'ALTER TABLE posts ADD UNIQUE INDEX idx_post_slug (slug)',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'posts' AND COLUMN_NAME = 'thumbnail');
SET @sql := IF(@col_exists = 0,
    'ALTER TABLE posts ADD COLUMN thumbnail VARCHAR(500)',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'posts' AND COLUMN_NAME = 'published');
SET @sql := IF(@col_exists = 0,
    'ALTER TABLE posts ADD COLUMN published TINYINT(1) NOT NULL DEFAULT 1',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ── 6. google_oauth2_profile_completions: rename token → token_hash; add fields ─
SET @token_exists      := (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'google_oauth2_profile_completions' AND COLUMN_NAME = 'token');
SET @token_hash_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'google_oauth2_profile_completions' AND COLUMN_NAME = 'token_hash');
SET @sql := IF(@token_exists = 1 AND @token_hash_exists = 0,
    'ALTER TABLE google_oauth2_profile_completions RENAME COLUMN token TO token_hash',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'google_oauth2_profile_completions' AND COLUMN_NAME = 'full_name');
SET @sql := IF(@col_exists = 0,
    'ALTER TABLE google_oauth2_profile_completions ADD COLUMN full_name VARCHAR(500)',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'google_oauth2_profile_completions' AND COLUMN_NAME = 'avatar');
SET @sql := IF(@col_exists = 0,
    'ALTER TABLE google_oauth2_profile_completions ADD COLUMN avatar VARCHAR(500)',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'google_oauth2_profile_completions' AND COLUMN_NAME = 'existing_user_id');
SET @sql := IF(@col_exists = 0,
    'ALTER TABLE google_oauth2_profile_completions ADD COLUMN existing_user_id BIGINT',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ── 7. registration_otps: add password_hash, full_name, address, phone ─────
SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'registration_otps' AND COLUMN_NAME = 'password_hash');
SET @sql := IF(@col_exists = 0,
    'ALTER TABLE registration_otps ADD COLUMN password_hash VARCHAR(100)',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'registration_otps' AND COLUMN_NAME = 'full_name');
SET @sql := IF(@col_exists = 0,
    'ALTER TABLE registration_otps ADD COLUMN full_name VARCHAR(255)',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'registration_otps' AND COLUMN_NAME = 'address');
SET @sql := IF(@col_exists = 0,
    'ALTER TABLE registration_otps ADD COLUMN address VARCHAR(500)',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'registration_otps' AND COLUMN_NAME = 'phone');
SET @sql := IF(@col_exists = 0,
    'ALTER TABLE registration_otps ADD COLUMN phone VARCHAR(20)',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ── 8. product_price_history: rename changed_at → recorded_at; add source columns ─
SET @old_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'product_price_history' AND COLUMN_NAME = 'changed_at');
SET @new_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'product_price_history' AND COLUMN_NAME = 'recorded_at');
SET @sql := IF(@old_exists = 1 AND @new_exists = 0,
    'ALTER TABLE product_price_history RENAME COLUMN changed_at TO recorded_at',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'product_price_history' AND COLUMN_NAME = 'source_site');
SET @sql := IF(@col_exists = 0,
    'ALTER TABLE product_price_history ADD COLUMN source_site VARCHAR(128)',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'product_price_history' AND COLUMN_NAME = 'source_url');
SET @sql := IF(@col_exists = 0,
    'ALTER TABLE product_price_history ADD COLUMN source_url VARCHAR(1024)',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ── 9. contact_messages: rename name → full_name; add handled ──────────────
SET @name_exists      := (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'contact_messages' AND COLUMN_NAME = 'name');
SET @full_name_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'contact_messages' AND COLUMN_NAME = 'full_name');
SET @sql := IF(@name_exists = 1 AND @full_name_exists = 0,
    'ALTER TABLE contact_messages RENAME COLUMN name TO full_name',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'contact_messages' AND COLUMN_NAME = 'handled');
SET @sql := IF(@col_exists = 0,
    'ALTER TABLE contact_messages ADD COLUMN handled TINYINT(1) NOT NULL DEFAULT 0',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET FOREIGN_KEY_CHECKS = 1;
