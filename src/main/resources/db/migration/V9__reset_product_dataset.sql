-- ============================================================
-- V9__reset_product_dataset.sql
-- Dọn sạch sản phẩm không hợp lệ từ V8 (category_id = NULL
-- hoặc chưa có đơn hàng) để DataSeedService tự seed lại đúng.
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- Xoá flash_sale_items liên quan đến sản phẩm sẽ bị xoá
DELETE fsi FROM flash_sale_items fsi
LEFT JOIN order_details od ON od.product_id = fsi.product_id
WHERE od.product_id IS NULL;

-- Xoá tất cả sản phẩm không nằm trong bất kỳ đơn hàng nào
DELETE p FROM products p
LEFT JOIN order_details od ON od.product_id = p.id
WHERE od.product_id IS NULL;

-- Xoá categories rác nếu có (tạo bởi V8 INSERT ... WHERE NOT EXISTS
-- nhưng không được DataSeedService nhận diện)
DELETE c FROM categories c
LEFT JOIN products p ON p.category_id = c.id
WHERE p.id IS NULL
  AND c.name NOT IN ('Điện thoại', 'Laptop', 'Máy tính bảng', 'Phụ kiện');

SET FOREIGN_KEY_CHECKS = 1;
