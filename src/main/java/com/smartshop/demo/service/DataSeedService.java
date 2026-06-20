package com.smartshop.demo.service;

import java.math.BigDecimal;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.CacheManager;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.smartshop.demo.domain.Category;
import com.smartshop.demo.domain.Product;
import com.smartshop.demo.repository.CategoryRepository;
import com.smartshop.demo.repository.ProductRepository;

@Service
public class DataSeedService {

    private static final Logger log = LoggerFactory.getLogger(DataSeedService.class);

    private record ProductSeed(
            String name, long price, String factory, String image,
            String shortDesc, int stock, int sold, String categoryName) {}

    // ──────────────────────────────────────────────────────────────────────────
    // Dataset — ảnh từ dummyjson CDN (ổn định) hoặc Unsplash photo ID đã kiểm chứng
    // ──────────────────────────────────────────────────────────────────────────
    private static final List<ProductSeed> PRODUCTS = List.of(

        // ── Điện thoại ───────────────────────────────────────────────────────
        new ProductSeed("iPhone 16 Pro Max 256GB", 34_990_000, "Apple",
            "https://cdn.dummyjson.com/products/images/smartphones/iPhone%2015%20Pro/1.webp",
            "Chip A18 Pro, camera 48MP zoom quang học 5x, màn hình ProMotion 120Hz 6.9 inch.", 45, 280, "Điện thoại"),
        new ProductSeed("iPhone 16 128GB", 22_990_000, "Apple",
            "https://cdn.dummyjson.com/products/images/smartphones/iPhone%2015%20Pro/2.webp",
            "Chip A18, Dynamic Island, camera chính 48MP, pin 22 giờ thực tế.", 80, 350, "Điện thoại"),
        new ProductSeed("iPhone 15 Plus 128GB", 22_490_000, "Apple",
            "https://cdn.dummyjson.com/products/images/smartphones/iPhone%2015%20Pro/3.webp",
            "Chip A16 Bionic, màn hình Super Retina XDR 6.7 inch, Dynamic Island, MagSafe.", 60, 210, "Điện thoại"),
        new ProductSeed("Samsung Galaxy S25 Ultra 12GB/256GB", 33_990_000, "Samsung",
            "https://cdn.dummyjson.com/products/images/smartphones/Samsung%20Galaxy%20S23%20Ultra/1.webp",
            "Snapdragon 8 Elite, bút S Pen AI, camera 200MP, pin 5000 mAh sạc 45W.", 40, 195, "Điện thoại"),
        new ProductSeed("Samsung Galaxy S25+ 12GB/256GB", 26_990_000, "Samsung",
            "https://cdn.dummyjson.com/products/images/smartphones/Samsung%20Galaxy%20S23%20Ultra/2.webp",
            "Snapdragon 8 Elite, màn hình Dynamic AMOLED 2X 6.7 inch 120Hz, sạc 45W.", 55, 165, "Điện thoại"),
        new ProductSeed("Samsung Galaxy A56 5G 8GB/256GB", 11_990_000, "Samsung",
            "https://cdn.dummyjson.com/products/images/smartphones/Samsung%20Galaxy%20S23%20Ultra/3.webp",
            "Exynos 1580, AMOLED 120Hz, camera 50MP, pin 5000 mAh sạc 45W, IP67.", 120, 420, "Điện thoại"),
        new ProductSeed("Xiaomi 14T Pro 12GB/256GB", 17_490_000, "Xiaomi",
            "https://cdn.dummyjson.com/products/images/smartphones/OnePlus%2012R/1.webp",
            "Dimensity 9300+, camera Leica 50MP, AMOLED 144Hz, sạc HyperCharge 100W.", 60, 210, "Điện thoại"),
        new ProductSeed("Xiaomi Redmi Note 14 Pro 8GB/256GB", 8_490_000, "Xiaomi",
            "https://cdn.dummyjson.com/products/images/smartphones/OnePlus%2012R/2.webp",
            "Dimensity 7300, AMOLED 120Hz 1.5K, camera 200MP, pin 5500 mAh.", 150, 580, "Điện thoại"),
        new ProductSeed("Oppo Reno 13 Pro 5G 12GB/256GB", 13_990_000, "Oppo",
            "https://cdn.dummyjson.com/products/images/smartphones/OPPO%20A57s/1.webp",
            "Dimensity 8350, camera 50MP OIS, SUPERVOOC 80W, IP65, màn hình AMOLED 120Hz.", 70, 175, "Điện thoại"),
        new ProductSeed("Vivo V40 Pro 5G 12GB/256GB", 11_990_000, "Vivo",
            "https://cdn.dummyjson.com/products/images/smartphones/OPPO%20A57s/2.webp",
            "Snapdragon 7 Gen 3, camera Zeiss 50MP, AMOLED 120Hz, FlashCharge 80W.", 55, 140, "Điện thoại"),
        new ProductSeed("Realme GT 7 Pro 12GB/256GB", 12_490_000, "Realme",
            "https://cdn.dummyjson.com/products/images/smartphones/OPPO%20A57s/3.webp",
            "Snapdragon 8 Elite, Sony LYT-818 50MP, UltraDart 120W, pin 6500 mAh.", 50, 130, "Điện thoại"),
        new ProductSeed("Huawei Pura 70 Pro 12GB/256GB", 18_990_000, "Huawei",
            "https://cdn.dummyjson.com/products/images/smartphones/Huawei%20P30/1.webp",
            "Kirin 9010, camera XMAGE 50MP zoom 10x, OLED cong 6.8 inch, vân tay dưới màn.", 35, 90, "Điện thoại"),

        // ── Laptop ───────────────────────────────────────────────────────────
        new ProductSeed("MacBook Air M3 13 inch 8GB/256GB", 28_990_000, "Apple",
            "https://cdn.dummyjson.com/products/images/laptops/Apple%20MacBook%20Pro%2014%20Inch%20Space%20Grey/1.webp",
            "Chip M3, pin 18 giờ, Liquid Retina 13.6 inch, trọng lượng 1.24 kg, fanless.", 30, 220, "Laptop"),
        new ProductSeed("MacBook Pro M4 14 inch 16GB/512GB", 52_990_000, "Apple",
            "https://cdn.dummyjson.com/products/images/laptops/Apple%20MacBook%20Pro%2014%20Inch%20Space%20Grey/2.webp",
            "Chip M4 Pro, Liquid Retina XDR 120Hz, 3 cổng Thunderbolt 5, pin 24 giờ.", 20, 95, "Laptop"),
        new ProductSeed("Dell XPS 15 9540 i7-14700H 16GB/512GB", 36_990_000, "Dell",
            "https://cdn.dummyjson.com/products/images/laptops/Huawei%20MateBook%20X%20Pro/1.webp",
            "Core i7-14700H, RTX 4060 8GB, màn hình OLED 3.5K cảm ứng, 1.86 kg.", 25, 110, "Laptop"),
        new ProductSeed("HP Envy x360 14 i7-13700H 16GB/512GB", 25_990_000, "HP",
            "https://cdn.dummyjson.com/products/images/laptops/Lenovo%20IdeaPad%20Flex%205/1.webp",
            "Core i7-13700H, OLED 2.8K cảm ứng lật 360°, bút HP Tilt Pen tặng kèm.", 40, 150, "Laptop"),
        new ProductSeed("Lenovo ThinkPad X1 Carbon Gen 12 i7 16GB/512GB", 46_990_000, "Lenovo",
            "https://cdn.dummyjson.com/products/images/laptops/Lenovo%20IdeaPad%20Flex%205/2.webp",
            "Core Ultra 7 165U, 1.12 kg, pin 15 giờ, bàn phím chống tràn, Thunderbolt 4.", 15, 70, "Laptop"),
        new ProductSeed("ASUS ZenBook 14 OLED Ryzen 7 16GB/512GB", 23_990_000, "ASUS",
            "https://cdn.dummyjson.com/products/images/laptops/ASUS%20Chromebook%20Flip%20C436/1.webp",
            "Ryzen 7 8845HS, OLED 2.8K 120Hz, 1.2 kg, pin 75Wh, sạc 65W USB-C.", 50, 185, "Laptop"),
        new ProductSeed("Acer Swift Go 14 i5-1335U 16GB/512GB", 16_990_000, "Acer",
            "https://cdn.dummyjson.com/products/images/laptops/ASUS%20Chromebook%20Flip%20C436/2.webp",
            "Core i5-1335U, IPS 2K 100% sRGB, 1.25 kg, HDMI 2.1, giá tốt sinh viên.", 70, 260, "Laptop"),
        new ProductSeed("MSI Stealth 16 Studio i9-13900H RTX4070", 65_990_000, "MSI",
            "https://cdn.dummyjson.com/products/images/laptops/Asus%20Zenbook%20Pro%20Duo/1.webp",
            "Core i9-13900H, RTX 4070 8GB, QHD+ 240Hz, RAM 32GB DDR5, SSD 1TB NVMe.", 12, 45, "Laptop"),
        new ProductSeed("HP Victus 15 Ryzen 5 8GB/512GB RTX3050", 16_490_000, "HP",
            "https://cdn.dummyjson.com/products/images/laptops/Asus%20Zenbook%20Pro%20Duo/2.webp",
            "Ryzen 5 7535HS, RTX 3050 6GB, FHD 144Hz, pin 70.9Wh, lý tưởng cho gaming.", 65, 310, "Laptop"),
        new ProductSeed("Lenovo IdeaPad Slim 5 Gen 9 i5 16GB/512GB", 17_990_000, "Lenovo",
            "https://cdn.dummyjson.com/products/images/laptops/Lenovo%20IdeaPad%20Flex%205/3.webp",
            "Core Ultra 5 125H, OLED 2.8K 120Hz, 1.46 kg, thiết kế mỏng nhẹ văn phòng.", 55, 200, "Laptop"),

        // ── Máy tính bảng ────────────────────────────────────────────────────
        new ProductSeed("iPad Air M3 11 inch 128GB WiFi", 17_990_000, "Apple",
            "https://cdn.dummyjson.com/products/images/tablets/iPad%20Mini%205th%20Generation/1.webp",
            "Chip M3, Liquid Retina 11 inch True Tone, hỗ trợ Apple Pencil Pro và Magic Keyboard.", 35, 160, "Máy tính bảng"),
        new ProductSeed("iPad Pro M4 11 inch 256GB WiFi", 28_990_000, "Apple",
            "https://cdn.dummyjson.com/products/images/tablets/iPad%20Mini%205th%20Generation/2.webp",
            "Chip M4, Ultra Retina XDR OLED tandem 120Hz, mỏng nhất 5.1mm, chip tốc độ máy tính.", 20, 85, "Máy tính bảng"),
        new ProductSeed("Samsung Galaxy Tab S10+ 12GB/256GB WiFi", 22_990_000, "Samsung",
            "https://cdn.dummyjson.com/products/images/tablets/Samsung%20Galaxy%20Tab%20S6%20Lite/1.webp",
            "Snapdragon 8 Gen 3, Dynamic AMOLED 2X 12.4 inch 120Hz, bút S Pen tặng kèm.", 30, 120, "Máy tính bảng"),
        new ProductSeed("Samsung Galaxy Tab A9+ 5G 4GB/64GB", 6_990_000, "Samsung",
            "https://cdn.dummyjson.com/products/images/tablets/Samsung%20Galaxy%20Tab%20S6%20Lite/2.webp",
            "Snapdragon 695, LCD 11 inch 90Hz, 4 loa AKG Dolby Atmos, pin 7040 mAh.", 80, 290, "Máy tính bảng"),
        new ProductSeed("Xiaomi Pad 7 Pro 8GB/256GB WiFi", 10_990_000, "Xiaomi",
            "https://cdn.dummyjson.com/products/images/tablets/Samsung%20Galaxy%20Tab%20S6%20Lite/3.webp",
            "Snapdragon 8s Gen 3, IPS 11.2 inch 144Hz, 4 loa Dolby Atmos, sạc 45W.", 45, 155, "Máy tính bảng"),

        // ── Phụ kiện ─────────────────────────────────────────────────────────
        new ProductSeed("Apple AirPods Pro 2 USB-C", 6_490_000, "Apple",
            "https://cdn.dummyjson.com/products/images/mobile-accessories/Apple%20AirPods/1.webp",
            "ANC thế hệ 2, Transparency Mode, USB-C, pin 6 giờ + 24 giờ từ hộp sạc.", 100, 450, "Phụ kiện"),
        new ProductSeed("Apple Watch Series 10 41mm GPS", 11_490_000, "Apple",
            "https://cdn.dummyjson.com/products/images/mobile-accessories/Apple%20AirPods/2.webp",
            "Màn hình AMOLED lớn nhất, vỏ nhôm 9.7mm siêu mỏng, sạc nhanh 80% trong 30 phút.", 60, 230, "Phụ kiện"),
        new ProductSeed("Samsung Galaxy Buds3 Pro", 4_990_000, "Samsung",
            "https://cdn.dummyjson.com/products/images/mobile-accessories/Apple%20Watch%20Series%209/1.webp",
            "ANC thế hệ mới, thiết kế open-type, driver 11mm, Galaxy AI, Bluetooth 5.4.", 90, 320, "Phụ kiện"),
        new ProductSeed("Sony WH-1000XM5 Wireless Headphones", 8_490_000, "Sony",
            "https://cdn.dummyjson.com/products/images/mobile-accessories/Apple%20Watch%20Series%209/2.webp",
            "Chống ồn hàng đầu, 8 mic xử lý, pin 30 giờ, sạc 3 phút dùng 3 giờ, gập gọn.", 75, 280, "Phụ kiện"),
        new ProductSeed("Sony WF-1000XM5 True Wireless", 6_490_000, "Sony",
            "https://cdn.dummyjson.com/products/images/mobile-accessories/Apple%20Watch%20Series%209/3.webp",
            "Tai nghe nhét tai chống ồn tốt nhất, driver 8.4mm, pin 8 giờ + 16 giờ từ hộp.", 55, 195, "Phụ kiện"),
        new ProductSeed("ASUS ROG Cetra II Core USB-C", 1_990_000, "ASUS",
            "https://cdn.dummyjson.com/products/images/mobile-accessories/Fitbit%20Charge%206/1.webp",
            "Driver 10mm, ANC lai kép, DAC ESS 9280, tương thích PC/Mac/Switch/PS5.", 110, 340, "Phụ kiện"),
        new ProductSeed("Xiaomi SoundPods True Wireless 2", 1_290_000, "Xiaomi",
            "https://cdn.dummyjson.com/products/images/mobile-accessories/Fitbit%20Charge%206/2.webp",
            "Driver 12.4mm, ANC 46dB, pin 8 giờ + 24 giờ từ hộp, IP55, Bluetooth 5.4.", 200, 680, "Phụ kiện")
    );

    // ──────────────────────────────────────────────────────────────────────────

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final CacheManager cacheManager;

    public DataSeedService(ProductRepository productRepository,
                           CategoryRepository categoryRepository,
                           CacheManager cacheManager) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.cacheManager = cacheManager;
    }

    @Transactional
    public void seedProducts() {
        if (productRepository.count() > 0) {
            log.info("[Seed] Products table is not empty — skipping seed.");
            return;
        }

        log.info("[Seed] Seeding {} Vietnamese tech products...", PRODUCTS.size());

        // Ensure categories exist
        ensureCategory("Điện thoại",    "Điện thoại thông minh các thương hiệu hàng đầu");
        ensureCategory("Laptop",        "Laptop phục vụ học tập, làm việc và giải trí");
        ensureCategory("Máy tính bảng", "Máy tính bảng cao cấp, mỏng nhẹ, hiệu suất mạnh");
        ensureCategory("Phụ kiện",      "Phụ kiện công nghệ chính hãng");

        int count = 0;
        for (ProductSeed s : PRODUCTS) {
            Category cat = categoryRepository.findByName(s.categoryName())
                    .orElseThrow(() -> new IllegalStateException("Category not found: " + s.categoryName()));
            Product p = new Product();
            p.setName(s.name());
            p.setPrice(BigDecimal.valueOf(s.price()));
            p.setFactory(s.factory());
            p.setImage(s.image());
            p.setShortDesc(s.shortDesc());
            p.setDetailDesc(buildDetailDesc(s));
            p.setQuantity(s.stock());
            p.setSold(0);
            p.setTarget("Nam, Nữ");
            p.setCategory(cat);
            productRepository.save(p);
            count++;
        }

        log.info("[Seed] ✓ Seeded {} products.", count);
        evictCaches();
    }

    private void ensureCategory(String name, String description) {
        categoryRepository.findByName(name).orElseGet(() -> {
            Category c = new Category();
            c.setName(name);
            c.setDescription(description);
            return categoryRepository.save(c);
        });
    }

    private String buildDetailDesc(ProductSeed s) {
        return "<h3>Mô tả sản phẩm</h3><p>" + escapeHtml(s.shortDesc()) + "</p>"
             + "<ul><li><strong>Thương hiệu:</strong> " + escapeHtml(s.factory()) + "</li>"
             + "<li><strong>Danh mục:</strong> " + escapeHtml(s.categoryName()) + "</li>"
             + "<li><strong>Tồn kho:</strong> " + s.stock() + " sản phẩm</li></ul>";
    }

    private String escapeHtml(String text) {
        if (text == null) return "";
        return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }

    private void evictCaches() {
        try {
            var c = cacheManager.getCache("productStats");  if (c != null) c.clear();
            var t = cacheManager.getCache("topProducts");   if (t != null) t.clear();
        } catch (Exception e) {
            log.warn("[Seed] Could not evict caches: {}", e.getMessage());
        }
    }
}
