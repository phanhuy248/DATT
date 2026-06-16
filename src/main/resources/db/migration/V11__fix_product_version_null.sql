-- ============================================================
-- V11__fix_product_version_null.sql
-- Fix: products inserted by V8 SQL migration have version=NULL.
-- Hibernate optimistic lock uses WHERE version=? which never
-- matches NULL in SQL, causing StaleObjectStateException (500)
-- when restoreStock() saves a product during order cancellation.
-- ============================================================

UPDATE products SET version = 0 WHERE version IS NULL;

-- Prevent future NULL versions by enforcing a default
ALTER TABLE products MODIFY version BIGINT NOT NULL DEFAULT 0;
