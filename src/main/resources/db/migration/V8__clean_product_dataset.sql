-- ============================================================
-- V8__clean_product_dataset.sql
-- Xoá sản phẩm seed cũ (DummyJSON), thêm dataset Việt Nam chuẩn
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- Xoá flash_sale_items cho sản phẩm không có trong đơn hàng
DELETE fsi FROM flash_sale_items fsi
LEFT JOIN order_details od ON od.product_id = fsi.product_id
WHERE od.product_id IS NULL;

-- Xoá sản phẩm không có trong đơn hàng
DELETE p FROM products p
LEFT JOIN order_details od ON od.product_id = p.id
WHERE od.product_id IS NULL;

-- Đảm bảo category tồn tại
INSERT INTO categories (name, deleted)
SELECT 'Điện thoại', 0 WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Điện thoại');
INSERT INTO categories (name, deleted)
SELECT 'Laptop', 0 WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Laptop');
INSERT INTO categories (name, deleted)
SELECT 'Máy tính bảng', 0 WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Máy tính bảng');
INSERT INTO categories (name, deleted)
SELECT 'Phụ kiện', 0 WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Phụ kiện');

-- ── ĐIỆN THOẠI ───────────────────────────────────────────────

INSERT INTO products (name, price, factory, image, short_desc, quantity, sold, target, deleted, category_id, created_at, updated_at)
SELECT 'iPhone 16 Pro Max 256GB', 34990000, 'Apple',
  'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400&q=80',
  'Chip A18 Pro, camera 48MP với zoom quang học 5x, màn hình ProMotion 120Hz 6.9 inch.',
  45, 280, 'Nam, Nữ', 0, (SELECT id FROM categories WHERE name='Điện thoại' LIMIT 1), NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name='iPhone 16 Pro Max 256GB');

INSERT INTO products (name, price, factory, image, short_desc, quantity, sold, target, deleted, category_id, created_at, updated_at)
SELECT 'iPhone 16 128GB', 22990000, 'Apple',
  'https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?w=400&q=80',
  'iPhone 16 chip A18, camera chính 48MP, Dynamic Island, pin 22 giờ dùng thực tế.',
  80, 350, 'Nam, Nữ', 0, (SELECT id FROM categories WHERE name='Điện thoại' LIMIT 1), NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name='iPhone 16 128GB');

INSERT INTO products (name, price, factory, image, short_desc, quantity, sold, target, deleted, category_id, created_at, updated_at)
SELECT 'Samsung Galaxy S25 Ultra 12GB/256GB', 33990000, 'Samsung',
  'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400&q=80',
  'Snapdragon 8 Elite, bút S Pen tích hợp AI, camera 200MP, pin 5000 mAh sạc 45W.',
  40, 195, 'Nam, Nữ', 0, (SELECT id FROM categories WHERE name='Điện thoại' LIMIT 1), NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name='Samsung Galaxy S25 Ultra 12GB/256GB');

INSERT INTO products (name, price, factory, image, short_desc, quantity, sold, target, deleted, category_id, created_at, updated_at)
SELECT 'Samsung Galaxy A56 5G 8GB/256GB', 11990000, 'Samsung',
  'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=400&q=80',
  'Exynos 1580, màn hình AMOLED 120Hz, camera 50MP, pin 5000 mAh sạc 45W.',
  120, 420, 'Nam, Nữ', 0, (SELECT id FROM categories WHERE name='Điện thoại' LIMIT 1), NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name='Samsung Galaxy A56 5G 8GB/256GB');

INSERT INTO products (name, price, factory, image, short_desc, quantity, sold, target, deleted, category_id, created_at, updated_at)
SELECT 'Xiaomi 14T Pro 12GB/256GB', 17490000, 'Xiaomi',
  'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400&q=80',
  'Dimensity 9300+, camera Leica 50MP, màn hình AMOLED 144Hz, sạc HyperCharge 100W.',
  60, 210, 'Nam, Nữ', 0, (SELECT id FROM categories WHERE name='Điện thoại' LIMIT 1), NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name='Xiaomi 14T Pro 12GB/256GB');

INSERT INTO products (name, price, factory, image, short_desc, quantity, sold, target, deleted, category_id, created_at, updated_at)
SELECT 'Xiaomi Redmi Note 14 Pro 8GB/256GB', 8490000, 'Xiaomi',
  'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&q=80',
  'MediaTek Dimensity 7300, màn hình AMOLED 120Hz, camera 200MP, pin 5500 mAh.',
  150, 580, 'Nam, Nữ', 0, (SELECT id FROM categories WHERE name='Điện thoại' LIMIT 1), NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name='Xiaomi Redmi Note 14 Pro 8GB/256GB');

INSERT INTO products (name, price, factory, image, short_desc, quantity, sold, target, deleted, category_id, created_at, updated_at)
SELECT 'Oppo Reno 13 Pro 5G 12GB/256GB', 13990000, 'Oppo',
  'https://images.unsplash.com/photo-1559825481-12a05cc00344?w=400&q=80',
  'MediaTek Dimensity 8350, camera AI 50MP chống rung OIS, sạc SUPERVOOC 80W, IP65.',
  70, 175, 'Nam, Nữ', 0, (SELECT id FROM categories WHERE name='Điện thoại' LIMIT 1), NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name='Oppo Reno 13 Pro 5G 12GB/256GB');

INSERT INTO products (name, price, factory, image, short_desc, quantity, sold, target, deleted, category_id, created_at, updated_at)
SELECT 'Vivo V40 Pro 5G 12GB/256GB', 11990000, 'Vivo',
  'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&q=80',
  'Snapdragon 7 Gen 3, camera Zeiss 50MP, màn hình AMOLED 120Hz, sạc FlashCharge 80W.',
  55, 140, 'Nam, Nữ', 0, (SELECT id FROM categories WHERE name='Điện thoại' LIMIT 1), NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name='Vivo V40 Pro 5G 12GB/256GB');

INSERT INTO products (name, price, factory, image, short_desc, quantity, sold, target, deleted, category_id, created_at, updated_at)
SELECT 'Realme GT 7 Pro 12GB/256GB', 12490000, 'Realme',
  'https://images.unsplash.com/photo-1567581935884-3349723552ca?w=400&q=80',
  'Snapdragon 8 Elite, camera Sony LYT-818 50MP, sạc UltraDart 120W, pin 6500 mAh.',
  50, 130, 'Nam, Nữ', 0, (SELECT id FROM categories WHERE name='Điện thoại' LIMIT 1), NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name='Realme GT 7 Pro 12GB/256GB');

INSERT INTO products (name, price, factory, image, short_desc, quantity, sold, target, deleted, category_id, created_at, updated_at)
SELECT 'Huawei Pura 70 Pro 12GB/256GB', 18990000, 'Huawei',
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80',
  'Kirin 9010, camera XMAGE 50MP zoom 10x, màn hình OLED cong 6.8 inch, vân tay dưới màn.',
  35, 90, 'Nam, Nữ', 0, (SELECT id FROM categories WHERE name='Điện thoại' LIMIT 1), NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name='Huawei Pura 70 Pro 12GB/256GB');

-- ── LAPTOP ───────────────────────────────────────────────────

INSERT INTO products (name, price, factory, image, short_desc, quantity, sold, target, deleted, category_id, created_at, updated_at)
SELECT 'MacBook Air M3 13 inch 8GB/256GB', 28990000, 'Apple',
  'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&q=80',
  'Chip M3 thế hệ 3, pin 18 giờ, màn hình Liquid Retina 13.6 inch, trọng lượng 1.24 kg.',
  30, 220, 'Dân văn phòng, Sinh viên', 0, (SELECT id FROM categories WHERE name='Laptop' LIMIT 1), NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name='MacBook Air M3 13 inch 8GB/256GB');

INSERT INTO products (name, price, factory, image, short_desc, quantity, sold, target, deleted, category_id, created_at, updated_at)
SELECT 'MacBook Pro M4 14 inch 16GB/512GB', 52990000, 'Apple',
  'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=400&q=80',
  'Chip M4 Pro, màn hình Liquid Retina XDR 120Hz, 3 cổng Thunderbolt 5, pin 24 giờ.',
  20, 95, 'Dân văn phòng, Sinh viên', 0, (SELECT id FROM categories WHERE name='Laptop' LIMIT 1), NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name='MacBook Pro M4 14 inch 16GB/512GB');

INSERT INTO products (name, price, factory, image, short_desc, quantity, sold, target, deleted, category_id, created_at, updated_at)
SELECT 'Dell XPS 15 9540 i7-14700H 16GB/512GB', 36990000, 'Dell',
  'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=400&q=80',
  'Core i7-14700H, RTX 4060 8GB, màn hình OLED 3.5K cảm ứng, trọng lượng 1.86 kg.',
  25, 110, 'Dân văn phòng, Sinh viên', 0, (SELECT id FROM categories WHERE name='Laptop' LIMIT 1), NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name='Dell XPS 15 9540 i7-14700H 16GB/512GB');

INSERT INTO products (name, price, factory, image, short_desc, quantity, sold, target, deleted, category_id, created_at, updated_at)
SELECT 'HP Envy x360 14 i7-13700H 16GB/512GB', 25990000, 'HP',
  'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&q=80',
  'Core i7-13700H, màn hình OLED 2.8K cảm ứng lật 360°, bút HP Tilt Pen tặng kèm.',
  40, 150, 'Dân văn phòng, Sinh viên', 0, (SELECT id FROM categories WHERE name='Laptop' LIMIT 1), NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name='HP Envy x360 14 i7-13700H 16GB/512GB');

INSERT INTO products (name, price, factory, image, short_desc, quantity, sold, target, deleted, category_id, created_at, updated_at)
SELECT 'Lenovo ThinkPad X1 Carbon Gen 12 i7 16GB/512GB', 46990000, 'Lenovo',
  'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=400&q=80',
  'Core Ultra 7 165U, trọng lượng 1.12 kg, pin 15 giờ, bàn phím chống tràn, cổng Thunderbolt 4.',
  15, 70, 'Dân văn phòng, Sinh viên', 0, (SELECT id FROM categories WHERE name='Laptop' LIMIT 1), NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name='Lenovo ThinkPad X1 Carbon Gen 12 i7 16GB/512GB');

INSERT INTO products (name, price, factory, image, short_desc, quantity, sold, target, deleted, category_id, created_at, updated_at)
SELECT 'ASUS ZenBook 14 OLED Ryzen 7 16GB/512GB', 23990000, 'ASUS',
  'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=400&q=80',
  'AMD Ryzen 7 8845HS, màn hình OLED 2.8K 120Hz, trọng lượng 1.2 kg, pin 75Wh.',
  50, 185, 'Dân văn phòng, Sinh viên', 0, (SELECT id FROM categories WHERE name='Laptop' LIMIT 1), NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name='ASUS ZenBook 14 OLED Ryzen 7 16GB/512GB');

INSERT INTO products (name, price, factory, image, short_desc, quantity, sold, target, deleted, category_id, created_at, updated_at)
SELECT 'Acer Swift Go 14 i5-1335U 16GB/512GB', 16990000, 'Acer',
  'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=400&q=80',
  'Core i5-1335U, màn hình IPS 2K 100% sRGB, trọng lượng 1.25 kg, có cổng HDMI 2.1.',
  70, 260, 'Dân văn phòng, Sinh viên', 0, (SELECT id FROM categories WHERE name='Laptop' LIMIT 1), NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name='Acer Swift Go 14 i5-1335U 16GB/512GB');

INSERT INTO products (name, price, factory, image, short_desc, quantity, sold, target, deleted, category_id, created_at, updated_at)
SELECT 'MSI Stealth 16 Studio i9-13900H RTX4070', 65990000, 'MSI',
  'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=400&q=80',
  'Core i9-13900H, RTX 4070 8GB, màn hình QHD+ 240Hz, RAM 32GB DDR5, SSD 1TB NVMe.',
  12, 45, 'Dân văn phòng, Sinh viên', 0, (SELECT id FROM categories WHERE name='Laptop' LIMIT 1), NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name='MSI Stealth 16 Studio i9-13900H RTX4070');

INSERT INTO products (name, price, factory, image, short_desc, quantity, sold, target, deleted, category_id, created_at, updated_at)
SELECT 'HP Victus 15 Ryzen 5 8GB/512GB RTX3050', 16490000, 'HP',
  'https://images.unsplash.com/photo-1484788984921-03950022c9ef?w=400&q=80',
  'Ryzen 5 7535HS, RTX 3050 6GB, màn hình FHD 144Hz, pin 70.9Wh, giá tốt cho gaming.',
  65, 310, 'Dân văn phòng, Sinh viên', 0, (SELECT id FROM categories WHERE name='Laptop' LIMIT 1), NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name='HP Victus 15 Ryzen 5 8GB/512GB RTX3050');

INSERT INTO products (name, price, factory, image, short_desc, quantity, sold, target, deleted, category_id, created_at, updated_at)
SELECT 'Lenovo IdeaPad Slim 5 Gen 9 i5 16GB/512GB', 17990000, 'Lenovo',
  'https://images.unsplash.com/photo-1547082299-de196ea013d6?w=400&q=80',
  'Core Ultra 5 125H, màn hình IPS 2.8K OLED 120Hz, trọng lượng 1.46 kg, thiết kế mỏng nhẹ.',
  55, 200, 'Dân văn phòng, Sinh viên', 0, (SELECT id FROM categories WHERE name='Laptop' LIMIT 1), NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name='Lenovo IdeaPad Slim 5 Gen 9 i5 16GB/512GB');

-- ── MÁY TÍNH BẢNG ────────────────────────────────────────────

INSERT INTO products (name, price, factory, image, short_desc, quantity, sold, target, deleted, category_id, created_at, updated_at)
SELECT 'iPad Air M3 11 inch 128GB WiFi', 17990000, 'Apple',
  'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&q=80',
  'Chip M3 siêu nhanh, màn hình Liquid Retina 11 inch True Tone, hỗ trợ Apple Pencil Pro.',
  35, 160, 'Nam, Nữ', 0, (SELECT id FROM categories WHERE name='Máy tính bảng' LIMIT 1), NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name='iPad Air M3 11 inch 128GB WiFi');

INSERT INTO products (name, price, factory, image, short_desc, quantity, sold, target, deleted, category_id, created_at, updated_at)
SELECT 'iPad Pro M4 11 inch 256GB WiFi', 28990000, 'Apple',
  'https://images.unsplash.com/photo-1589739900243-4b52cd9b104e?w=400&q=80',
  'Chip M4, màn hình Ultra Retina XDR OLED tandem 120Hz, mỏng nhất từ trước đến nay 5.1mm.',
  20, 85, 'Nam, Nữ', 0, (SELECT id FROM categories WHERE name='Máy tính bảng' LIMIT 1), NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name='iPad Pro M4 11 inch 256GB WiFi');

INSERT INTO products (name, price, factory, image, short_desc, quantity, sold, target, deleted, category_id, created_at, updated_at)
SELECT 'Samsung Galaxy Tab S10+ 12GB/256GB WiFi', 22990000, 'Samsung',
  'https://images.unsplash.com/photo-1603532648955-039310d9ed75?w=400&q=80',
  'Snapdragon 8 Gen 3, màn hình Dynamic AMOLED 2X 12.4 inch 120Hz, bút S Pen tặng kèm.',
  30, 120, 'Nam, Nữ', 0, (SELECT id FROM categories WHERE name='Máy tính bảng' LIMIT 1), NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name='Samsung Galaxy Tab S10+ 12GB/256GB WiFi');

INSERT INTO products (name, price, factory, image, short_desc, quantity, sold, target, deleted, category_id, created_at, updated_at)
SELECT 'Samsung Galaxy Tab A9+ 5G 4GB/64GB', 6990000, 'Samsung',
  'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=400&q=80',
  'Snapdragon 695, màn hình LCD 11 inch 90Hz, 4 loa AKG Dolby Atmos, pin 7040 mAh.',
  80, 290, 'Nam, Nữ', 0, (SELECT id FROM categories WHERE name='Máy tính bảng' LIMIT 1), NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name='Samsung Galaxy Tab A9+ 5G 4GB/64GB');

INSERT INTO products (name, price, factory, image, short_desc, quantity, sold, target, deleted, category_id, created_at, updated_at)
SELECT 'Xiaomi Pad 7 Pro 8GB/256GB WiFi', 10990000, 'Xiaomi',
  'https://images.unsplash.com/photo-1568751345700-16c42f6e13eb?w=400&q=80',
  'Snapdragon 8s Gen 3, màn hình IPS LCD 11.2 inch 144Hz, 4 loa Dolby Atmos, sạc 45W.',
  45, 155, 'Nam, Nữ', 0, (SELECT id FROM categories WHERE name='Máy tính bảng' LIMIT 1), NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name='Xiaomi Pad 7 Pro 8GB/256GB WiFi');

-- ── PHỤ KIỆN ─────────────────────────────────────────────────

INSERT INTO products (name, price, factory, image, short_desc, quantity, sold, target, deleted, category_id, created_at, updated_at)
SELECT 'Apple AirPods Pro 2 USB-C', 6490000, 'Apple',
  'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=400&q=80',
  'Chống ồn ANC thế hệ 2, chế độ Transparency, sạc USB-C, pin 6 giờ + 24 giờ từ hộp.',
  100, 450, 'Nam, Nữ', 0, (SELECT id FROM categories WHERE name='Phụ kiện' LIMIT 1), NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name='Apple AirPods Pro 2 USB-C');

INSERT INTO products (name, price, factory, image, short_desc, quantity, sold, target, deleted, category_id, created_at, updated_at)
SELECT 'Apple Watch Series 10 41mm GPS', 11490000, 'Apple',
  'https://images.unsplash.com/photo-1551816230-ef5deaed4a26?w=400&q=80',
  'Màn hình AMOLED lớn nhất từ trước, vỏ nhôm siêu mỏng 9.7mm, sạc nhanh 80% trong 30 phút.',
  60, 230, 'Nam, Nữ', 0, (SELECT id FROM categories WHERE name='Phụ kiện' LIMIT 1), NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name='Apple Watch Series 10 41mm GPS');

INSERT INTO products (name, price, factory, image, short_desc, quantity, sold, target, deleted, category_id, created_at, updated_at)
SELECT 'Samsung Galaxy Buds3 Pro', 4990000, 'Samsung',
  'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&q=80',
  'ANC thế hệ mới, thiết kế open-type, driver 11mm, kết nối Galaxy AI, Bluetooth 5.4.',
  90, 320, 'Nam, Nữ', 0, (SELECT id FROM categories WHERE name='Phụ kiện' LIMIT 1), NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name='Samsung Galaxy Buds3 Pro');

INSERT INTO products (name, price, factory, image, short_desc, quantity, sold, target, deleted, category_id, created_at, updated_at)
SELECT 'Sony WH-1000XM5 Wireless Headphones', 8490000, 'Sony',
  'https://images.unsplash.com/photo-1545127398-14699f92334b?w=400&q=80',
  'Chống ồn hàng đầu thế giới, 8 mic, pin 30 giờ, sạc nhanh 3 phút dùng 3 giờ, gập gọn.',
  75, 280, 'Nam, Nữ', 0, (SELECT id FROM categories WHERE name='Phụ kiện' LIMIT 1), NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name='Sony WH-1000XM5 Wireless Headphones');

INSERT INTO products (name, price, factory, image, short_desc, quantity, sold, target, deleted, category_id, created_at, updated_at)
SELECT 'Sony WF-1000XM5 True Wireless', 6490000, 'Sony',
  'https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?w=400&q=80',
  'Tai nghe nhét tai chống ồn tốt nhất, driver 8.4mm, pin 8 giờ + 16 giờ từ hộp sạc.',
  55, 195, 'Nam, Nữ', 0, (SELECT id FROM categories WHERE name='Phụ kiện' LIMIT 1), NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name='Sony WF-1000XM5 True Wireless');

INSERT INTO products (name, price, factory, image, short_desc, quantity, sold, target, deleted, category_id, created_at, updated_at)
SELECT 'ASUS ROG Cetra II Core USB-C', 1990000, 'ASUS',
  'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&q=80',
  'Driver 10mm, ANC lai kép, màng lọc ESS DAC 9280, tương thích PC/Mac/Nintendo Switch.',
  110, 340, 'Nam, Nữ', 0, (SELECT id FROM categories WHERE name='Phụ kiện' LIMIT 1), NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name='ASUS ROG Cetra II Core USB-C');

INSERT INTO products (name, price, factory, image, short_desc, quantity, sold, target, deleted, category_id, created_at, updated_at)
SELECT 'Xiaomi SoundPods True Wireless', 1290000, 'Xiaomi',
  'https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?w=400&q=80',
  'Driver 12.4mm, ANC 46dB, pin 8 giờ + 24 giờ từ hộp, IP55, Bluetooth 5.4.',
  200, 680, 'Nam, Nữ', 0, (SELECT id FROM categories WHERE name='Phụ kiện' LIMIT 1), NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name='Xiaomi SoundPods True Wireless');

SET FOREIGN_KEY_CHECKS = 1;
