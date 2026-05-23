package com.example.demo.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.math.BigDecimal;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.CacheManager;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import com.example.demo.domain.Category;
import com.example.demo.domain.Product;
import com.example.demo.dto.seed.DummyProduct;
import com.example.demo.dto.seed.DummyProductResponse;
import com.example.demo.repository.CategoryRepository;
import com.example.demo.repository.ProductRepository;

@Service
public class DataSeedService {

    private static final Logger log = LoggerFactory.getLogger(DataSeedService.class);

    // slug → [categoryName, target]
    private record CategoryConfig(String slug, String name, String target, String description) {}

    private static final List<CategoryConfig> CATEGORIES = List.of(
        new CategoryConfig("smartphones",        "Điện thoại",     "Nam, Nữ",                    "Điện thoại thông minh các thương hiệu hàng đầu"),
        new CategoryConfig("laptops",            "Laptop",         "Dân văn phòng, Sinh viên",   "Laptop phục vụ học tập, làm việc và giải trí"),
        new CategoryConfig("tablets",            "Máy tính bảng",  "Nam, Nữ",                    "Máy tính bảng cao cấp, mỏng nhẹ, hiệu suất mạnh"),
        new CategoryConfig("mobile-accessories", "Phụ kiện",       "Nam, Nữ",                    "Phụ kiện chính hãng cho điện thoại và máy tính bảng")
    );

    private final RestTemplate restTemplate;
    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final CacheManager cacheManager;
    private final Random random = new Random(42); // fixed seed → reproducible demo data

    @Value("${app.seed.dummyjson.base-url:https://dummyjson.com}")
    private String baseUrl;

    @Value("${app.seed.price-multiplier:25000}")
    private double priceMultiplier;

    public DataSeedService(RestTemplate restTemplate,
                           ProductRepository productRepository,
                           CategoryRepository categoryRepository,
                           CacheManager cacheManager) {
        this.restTemplate = restTemplate;
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.cacheManager = cacheManager;
    }

    /**
     * Seeds products from DummyJSON if the products table is empty.
     * Each category is fetched independently; a network failure for one
     * category is logged and skipped without rolling back the others.
     */
    @Transactional
    public void seedProducts() {
        if (productRepository.count() > 0) {
            log.info("[Seed] Products table is not empty — skipping seed.");
            return;
        }

        log.info("[Seed] Starting product seed from DummyJSON ({})...", baseUrl);
        int totalSeeded = 0;

        for (CategoryConfig cfg : CATEGORIES) {
            try {
                Category category = getOrCreateCategory(cfg);
                List<DummyProduct> fetched = fetchProducts(cfg.slug());
                if (fetched.isEmpty()) {
                    log.warn("[Seed] No products returned for slug '{}', skipping.", cfg.slug());
                    continue;
                }
                List<Product> products = new ArrayList<>(fetched.stream()
                    .map(dp -> mapToProduct(dp, category, cfg))
                    .toList());
                productRepository.saveAll(products);
                totalSeeded += products.size();
                log.info("[Seed] ✓ {} — {} products seeded.", cfg.name(), products.size());
            } catch (RestClientException e) {
                log.warn("[Seed] Network error for '{}': {}. Skipping category.", cfg.name(), e.getMessage());
            } catch (Exception e) {
                log.error("[Seed] Unexpected error for '{}': {}", cfg.name(), e.getMessage(), e);
            }
        }

        log.info("[Seed] Complete. Total products seeded: {}.", totalSeeded);
        if (totalSeeded > 0) {
            try {
                var c = cacheManager.getCache("productStats");
                if (c != null) c.clear();
                var t = cacheManager.getCache("topProducts");
                if (t != null) t.clear();
            } catch (Exception e) {
                log.warn("[Seed] Could not evict caches after seed: {}", e.getMessage());
            }
        }
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    private Category getOrCreateCategory(CategoryConfig cfg) {
        return categoryRepository.findByName(cfg.name()).orElseGet(() -> {
            Category c = new Category();
            c.setName(cfg.name());
            c.setDescription(cfg.description());
            return categoryRepository.save(c);
        });
    }

    private List<DummyProduct> fetchProducts(String slug) {
        String url = baseUrl + "/products/category/" + slug + "?limit=30";
        DummyProductResponse response = restTemplate.getForObject(url, DummyProductResponse.class);
        if (response == null || response.getProducts() == null) return List.of();
        return response.getProducts();
    }

    private Product mapToProduct(DummyProduct dp, Category category, CategoryConfig cfg) {
        Product p = new Product();
        p.setName(dp.getTitle());
        p.setPrice(BigDecimal.valueOf(roundToThousand(dp.getPrice() * priceMultiplier)));
        p.setImage(dp.getThumbnail());
        p.setShortDesc(truncate(dp.getDescription(), 200));
        p.setDetailDesc(buildDetailDesc(dp));
        p.setQuantity(dp.getStock() > 0 ? dp.getStock() : random.nextInt(41) + 10L);
        p.setSold(random.nextInt(501));
        p.setFactory(dp.getBrand() != null && !dp.getBrand().isBlank() ? dp.getBrand() : "Unknown");
        p.setTarget(cfg.target());
        p.setCategory(category);
        return p;
    }

    private String buildDetailDesc(DummyProduct dp) {
        return "<h3>Mô tả sản phẩm</h3>" +
               "<p>" + escapeHtml(dp.getDescription()) + "</p>" +
               "<ul>" +
               "<li><strong>Thương hiệu:</strong> " + escapeHtml(dp.getBrand()) + "</li>" +
               "<li><strong>Danh mục:</strong> " + escapeHtml(dp.getCategory()) + "</li>" +
               "<li><strong>Tồn kho:</strong> " + dp.getStock() + " sản phẩm</li>" +
               "</ul>";
    }

    private double roundToThousand(double value) {
        return Math.round(value / 1000.0) * 1000.0;
    }

    private String truncate(String text, int maxLength) {
        if (text == null) return "";
        return text.length() <= maxLength ? text : text.substring(0, maxLength - 3) + "...";
    }

    private String escapeHtml(String text) {
        if (text == null) return "";
        return text.replace("&", "&amp;")
                   .replace("<", "&lt;")
                   .replace(">", "&gt;")
                   .replace("\"", "&quot;");
    }
}
