-- Convert order_status_history ENUM columns to VARCHAR so new status values can be inserted.
-- The ENUM was defined with only old values (PACKING, DELIVERED, RETURNED) and did not include
-- PROCESSING / COMPLETED, causing this migration to fail when running the UPDATEs below.
ALTER TABLE order_status_history
    MODIFY COLUMN old_status VARCHAR(50),
    MODIFY COLUMN new_status VARCHAR(50) NOT NULL;

UPDATE orders
SET status = 'PROCESSING'
WHERE status = 'PACKING';

UPDATE orders
SET status = 'COMPLETED'
WHERE status = 'DELIVERED';

UPDATE orders
SET status = 'CANCELLED'
WHERE status = 'RETURNED';

UPDATE order_status_history
SET old_status = 'PROCESSING'
WHERE old_status = 'PACKING';

UPDATE order_status_history
SET new_status = 'PROCESSING'
WHERE new_status = 'PACKING';

UPDATE order_status_history
SET old_status = 'COMPLETED'
WHERE old_status = 'DELIVERED';

UPDATE order_status_history
SET new_status = 'COMPLETED'
WHERE new_status = 'DELIVERED';

UPDATE order_status_history
SET old_status = 'CANCELLED'
WHERE old_status = 'RETURNED';

UPDATE order_status_history
SET new_status = 'CANCELLED'
WHERE new_status = 'RETURNED';

UPDATE orders
SET payment_status = 'PENDING'
WHERE payment_method = 'BANK_TRANSFER'
  AND status = 'PENDING'
  AND (payment_status IS NULL OR payment_status = 'UNPAID');

UPDATE orders
SET status = 'CONFIRMED'
WHERE payment_method IN ('VNPAY', 'BANK_TRANSFER')
  AND payment_status = 'PAID'
  AND status = 'PENDING';
