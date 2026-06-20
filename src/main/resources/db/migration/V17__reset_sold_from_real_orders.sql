-- Reset product.sold về đúng số lượng thực tế từ các đơn hàng đã hoàn thành/xác nhận.
-- Xóa bỏ toàn bộ dữ liệu sold ảo từ seed data / import.
UPDATE products p
SET p.sold = (
    SELECT COALESCE(SUM(od.quantity), 0)
    FROM order_details od
    JOIN orders o ON o.id = od.order_id
    WHERE od.product_id = p.id
      AND o.status IN ('COMPLETED', 'CONFIRMED')
);
