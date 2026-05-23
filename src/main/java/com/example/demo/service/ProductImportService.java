package com.example.demo.service;

import com.example.demo.domain.Category;
import com.example.demo.domain.Product;
import com.example.demo.domain.ProductPriceHistory;
import com.example.demo.domain.Supplier;
import com.example.demo.dto.product.ProductImportItem;
import com.example.demo.dto.product.ProductImportPayload;
import com.example.demo.dto.product.ProductImportResult;
import com.example.demo.repository.CategoryRepository;
import com.example.demo.repository.ProductPriceHistoryRepository;
import com.example.demo.repository.ProductRepository;
import com.example.demo.repository.SupplierRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.CacheManager;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.io.IOException;
import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class ProductImportService {
    private static final Set<String> IMAGE_EXTENSIONS = Set.of("jpg", "jpeg", "png", "webp", "gif");

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final SupplierRepository supplierRepository;
    private final ProductPriceHistoryRepository priceHistoryRepository;
    private final ObjectMapper objectMapper;
    private final CacheManager cacheManager;
    private final HttpClient httpClient;
    private final TransactionTemplate transactionTemplate;
    private final Map<String, String> downloadedImageCache = new ConcurrentHashMap<>();

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @Value("${app.import.download-images:true}")
    private boolean downloadImages;

    public ProductImportService(ProductRepository productRepository,
                                CategoryRepository categoryRepository,
                                SupplierRepository supplierRepository,
                                ProductPriceHistoryRepository priceHistoryRepository,
                                ObjectMapper objectMapper,
                                CacheManager cacheManager,
                                PlatformTransactionManager transactionManager) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.supplierRepository = supplierRepository;
        this.priceHistoryRepository = priceHistoryRepository;
        this.objectMapper = objectMapper;
        this.cacheManager = cacheManager;
        this.transactionTemplate = new TransactionTemplate(transactionManager);
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .followRedirects(HttpClient.Redirect.NORMAL)
                .build();
    }

    public ProductImportResult importProducts(List<ProductImportItem> items) {
        ProductImportResult result = new ProductImportResult();
        if (items == null || items.isEmpty()) return result;

        for (ProductImportItem item : items) {
            try {
                if (!isValid(item)) {
                    result.markSkipped("Skipped invalid product: missing name or price");
                    continue;
                }
                boolean creating = Boolean.TRUE.equals(transactionTemplate.execute(status -> importOne(item)));
                if (creating) result.markCreated();
                else result.markUpdated();
            } catch (Exception e) {
                String name = item != null ? item.getName() : "<null>";
                result.markSkipped("Skipped " + name + ": " + e.getMessage());
            }
        }

        clearProductCaches();
        return result;
    }

    public ProductImportResult importFromFile(Path file) throws IOException {
        if (!Files.exists(file)) return new ProductImportResult();
        JsonNode root = objectMapper.readTree(file.toFile());
        List<ProductImportItem> products;
        if (root.isArray()) {
            products = objectMapper.convertValue(root, new TypeReference<List<ProductImportItem>>() {});
        } else {
            ProductImportPayload payload = objectMapper.treeToValue(root, ProductImportPayload.class);
            products = payload.getProducts();
        }
        return importProducts(products);
    }

    public int softDeleteBySourceSite(String sourceSite) {
        if (sourceSite == null || sourceSite.isBlank()) return 0;
        Integer deleted = transactionTemplate.execute(status -> {
            List<Product> products = productRepository.findBySourceSiteIgnoreCaseAndDeletedFalse(sourceSite);
            for (Product product : products) {
                product.setDeleted(true);
            }
            productRepository.saveAll(products);
            productRepository.flush();
            return products.size();
        });
        clearProductCaches();
        return deleted == null ? 0 : deleted;
    }

    private boolean importOne(ProductImportItem item) {
        Product product = resolveProduct(item);
        boolean creating = product.getId() == 0;
        BigDecimal oldPrice = product.getPrice();

        try {
            applyImportItem(product, item);
        } catch (IOException | InterruptedException e) {
            throw new IllegalStateException(e.getMessage(), e);
        }
        productRepository.saveAndFlush(product);

        if (creating || priceChanged(oldPrice, product.getPrice())) {
            recordPrice(product, oldPrice, product.getPrice());
        }
        return creating;
    }

    private boolean isValid(ProductImportItem item) {
        return item != null
                && item.getName() != null
                && !item.getName().isBlank()
                && item.getPrice() != null
                && item.getPrice().compareTo(BigDecimal.ZERO) > 0;
    }

    private Product resolveProduct(ProductImportItem item) {
        String source = clean(firstNonBlank(item.getSourceSite(), item.getSource(), item.getSupplier()));
        String sourceUrl = clean(item.getSourceUrl());
        if (source != null && sourceUrl != null) {
            Optional<Product> bySource = productRepository.findBySourceSiteIgnoreCaseAndSourceUrl(source, sourceUrl);
            if (bySource.isPresent()) return bySource.get();
        }
        return productRepository.findFirstByNameIgnoreCaseAndDeletedFalse(item.getName()).orElseGet(Product::new);
    }

    private void applyImportItem(Product product, ProductImportItem item) throws IOException, InterruptedException {
        String source = truncate(clean(firstNonBlank(item.getSourceSite(), item.getSource(), item.getSupplier(), "Crawler")), 128);
        String sourceUrl = truncate(clean(item.getSourceUrl()), 1024);
        String categoryName = normalizeCategory(firstNonBlank(item.getCategory(), inferCategory(item)));
        String supplierName = clean(firstNonBlank(item.getSupplier(), source));
        String brand = truncate(clean(firstNonBlank(item.getBrand(), item.getFactory(), inferBrand(item.getName()), supplierName)), 120);
        long stock = firstLong(item.getStock(), item.getQuantity(), product.getId() == 0 ? 10L : product.getQuantity());
        long sold = firstLong(item.getSoldCount(), item.getSold(), product.getId() == 0 ? 0L : product.getSold());

        product.setName(truncate(clean(item.getName()), 240));
        product.setPrice(item.getPrice());
        product.setShortDesc(truncate(firstNonBlank(item.getShortDesc(), item.getDescription(), item.getDetailDesc(), item.getName()), 240));
        product.setDetailDesc(firstNonBlank(item.getDetailDesc(), item.getDescription(), item.getShortDesc(), buildDetailDescription(item)));
        product.setQuantity(Math.max(0, stock));
        product.setSold(Math.max(0, sold));
        product.setFactory(brand);
        product.setTarget(firstNonBlank(item.getTarget(), defaultTarget(categoryName)));
        product.setCategory(getOrCreateCategory(categoryName));
        product.setSupplier(getOrCreateSupplier(supplierName));
        product.setSourceSite(source);
        product.setSourceUrl(sourceUrl);
        product.setExternalId(truncate(firstNonBlank(item.getExternalId(), sourceUrl), 128));
        product.setSpecifications(toJson(buildSpecifications(item, brand, categoryName, supplierName)));
        List<String> images = normalizeImages(item);
        if (images.isEmpty()) throw new IllegalArgumentException("no usable product image");
        product.setImage(images.get(0));
        product.setGalleryImages(toJson(images));
        product.setLastSyncedAt(LocalDateTime.now());
        product.setDeleted(false);
    }

    private Category getOrCreateCategory(String name) {
        String categoryName = firstNonBlank(name, "Khac");
        return categoryRepository.findByNameIgnoreCase(categoryName).orElseGet(() -> {
            Category category = new Category();
            category.setName(categoryName);
            category.setDescription("Imported product category");
            return categoryRepository.save(category);
        });
    }

    private Supplier getOrCreateSupplier(String name) {
        String supplierName = firstNonBlank(name, "Crawler");
        return supplierRepository.findByNameIgnoreCaseAndDeletedFalse(supplierName).orElseGet(() -> {
            Supplier supplier = new Supplier();
            supplier.setName(supplierName);
            supplier.setRepresentativeName(supplierName);
            supplier.setEmail(slugify(supplierName) + "@smartshop.local");
            supplier.setPhone("0000000000");
            supplier.setAddress("Imported from crawler");
            supplier.setActive(true);
            return supplierRepository.save(supplier);
        });
    }

    private Map<String, String> buildSpecifications(ProductImportItem item, String brand, String categoryName, String supplierName) {
        Map<String, String> specs = new LinkedHashMap<>();
        if (item.getSpecifications() != null) {
            item.getSpecifications().forEach((key, value) -> {
                String cleanedKey = clean(key);
                String cleanedValue = clean(value);
                if (cleanedKey != null && cleanedValue != null) specs.put(cleanedKey, cleanedValue);
            });
        }
        specs.putIfAbsent("Thương hiệu", brand);
        specs.putIfAbsent("Danh mục", categoryName);
        specs.putIfAbsent("Nhà cung cấp", supplierName);
        if (item.getSourceUrl() != null && !item.getSourceUrl().isBlank()) specs.putIfAbsent("Nguồn", item.getSourceUrl());
        return specs;
    }

    private List<String> normalizeImages(ProductImportItem item) throws IOException, InterruptedException {
        List<String> images = new ArrayList<>();
        addImage(images, item.getImage());
        if (item.getImages() != null) {
            for (String image : item.getImages()) addImage(images, image);
        }
        if (!downloadImages) return images;

        List<String> localImages = new ArrayList<>();
        for (int i = 0; i < images.size() && i < 6; i++) {
            String image = images.get(i);
            if (isRemoteUrl(image)) {
                String downloaded = downloadImage(image);
                if (downloaded != null) localImages.add(downloaded);
            } else {
                localImages.add(image);
            }
        }
        return localImages;
    }

    private void addImage(List<String> images, String image) {
        String cleaned = clean(image);
        if (cleaned != null && isUsableImageReference(cleaned) && !images.contains(cleaned)) images.add(cleaned);
    }

    private String downloadImage(String imageUrl) throws IOException, InterruptedException {
        String cached = downloadedImageCache.get(imageUrl);
        if (cached != null) return cached;
        try {
            HttpRequest request = HttpRequest.newBuilder(URI.create(imageUrl))
                    .timeout(Duration.ofSeconds(20))
                    .header("User-Agent", "SmartShopCrawler/1.0")
                    .GET()
                    .build();
            HttpResponse<byte[]> response = httpClient.send(request, HttpResponse.BodyHandlers.ofByteArray());
            if (response.statusCode() < 200 || response.statusCode() >= 300) return null;
            if (response.body() == null || response.body().length == 0) return null;
            String contentType = response.headers().firstValue("Content-Type").orElse("").toLowerCase(Locale.ROOT);
            if (contentType.contains("text/html") || contentType.contains("application/json")) return null;
            String extension = extensionFromUrl(imageUrl);
            Path dir = Paths.get(uploadDir, "products").toAbsolutePath().normalize();
            Files.createDirectories(dir);
            String filename = System.currentTimeMillis() + "_" + Math.abs(imageUrl.hashCode()) + "." + extension;
            Path target = dir.resolve(filename);
            Files.write(target, response.body());
            String localPath = "products/" + filename;
            downloadedImageCache.put(imageUrl, localPath);
            return localPath;
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private boolean isUsableImageReference(String value) {
        String lower = value.toLowerCase(Locale.ROOT);
        if (lower.contains("[object") || lower.contains("%5bobject") || lower.contains("object%20object")) return false;
        if (!isRemoteUrl(value)) return true;
        try {
            URI uri = URI.create(value);
            return uri.getHost() != null && !uri.getHost().isBlank();
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    private String extensionFromUrl(String imageUrl) {
        String path = URI.create(imageUrl).getPath();
        int dot = path.lastIndexOf('.');
        if (dot < 0) return "jpg";
        String ext = path.substring(dot + 1).toLowerCase(Locale.ROOT);
        return IMAGE_EXTENSIONS.contains(ext) ? ext : "jpg";
    }

    private void recordPrice(Product product, BigDecimal oldPrice, BigDecimal newPrice) {
        ProductPriceHistory history = new ProductPriceHistory();
        history.setProduct(product);
        history.setOldPrice(oldPrice);
        history.setNewPrice(newPrice);
        history.setSourceSite(product.getSourceSite());
        history.setSourceUrl(product.getSourceUrl());
        priceHistoryRepository.saveAndFlush(history);
    }

    private boolean priceChanged(BigDecimal oldPrice, BigDecimal newPrice) {
        if (oldPrice == null || newPrice == null) return oldPrice != newPrice;
        return oldPrice.compareTo(newPrice) != 0;
    }

    private String normalizeCategory(String raw) {
        String value = firstNonBlank(raw, "Khac");
        String lower = stripVietnamese(value).toLowerCase(Locale.ROOT);
        if (lower.contains("laptop") || lower.contains("macbook") || lower.contains("notebook")) return "Laptop";
        if (lower.contains("dien thoai") || lower.contains("dtdd") || lower.contains("phone") || lower.contains("iphone")) return "Điện thoại";
        if (lower.contains("phu kien") || lower.contains("accessor") || lower.contains("tai nghe")
                || lower.contains("chuot") || lower.contains("ban phim") || lower.contains("sac")) return "Phụ kiện";
        return value;
    }

    private String inferCategory(ProductImportItem item) {
        String haystack = firstNonBlank(item.getSourceUrl(), item.getName(), "");
        return normalizeCategory(haystack);
    }

    private String defaultTarget(String categoryName) {
        String lower = stripVietnamese(categoryName).toLowerCase(Locale.ROOT);
        if (lower.contains("laptop")) return "Sinh viên, văn phòng, gaming";
        if (lower.contains("dien thoai")) return "Cá nhân, công việc, giải trí";
        if (lower.contains("phu kien")) return "Người dùng công nghệ";
        return "Người dùng phổ thông";
    }

    private String inferBrand(String name) {
        if (name == null) return null;
        String lower = name.toLowerCase(Locale.ROOT);
        List<String> brands = List.of("Apple", "Samsung", "Dell", "HP", "Asus", "Lenovo", "Acer", "MSI",
                "LG", "Xiaomi", "OPPO", "Vivo", "Logitech", "Razer", "Sony", "Anker", "Baseus");
        for (String brand : brands) {
            if (lower.contains(brand.toLowerCase(Locale.ROOT))) return brand;
        }
        return null;
    }

    private String buildDetailDescription(ProductImportItem item) {
        return "Imported from " + firstNonBlank(item.getSourceSite(), item.getSource(), "crawler");
    }

    private String toJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception e) {
            return "[]";
        }
    }

    private void clearProductCaches() {
        for (String cacheName : List.of("topProducts", "productStats", "categories")) {
            var cache = cacheManager.getCache(cacheName);
            if (cache != null) cache.clear();
        }
    }

    private boolean isRemoteUrl(String value) {
        return value != null && (value.startsWith("http://") || value.startsWith("https://"));
    }

    private long firstLong(Long... values) {
        for (Long value : values) {
            if (value != null) return value;
        }
        return 0;
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            String cleaned = clean(value);
            if (cleaned != null) return cleaned;
        }
        return null;
    }

    private String clean(String value) {
        if (value == null) return null;
        String cleaned = value.replace('\u00a0', ' ').trim();
        return cleaned.isBlank() ? null : cleaned;
    }

    private String truncate(String value, int maxLength) {
        if (value == null || value.length() <= maxLength) return value;
        return value.substring(0, Math.max(0, maxLength - 3)) + "...";
    }

    private String slugify(String value) {
        return stripVietnamese(value).toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-|-$", "");
    }

    private String stripVietnamese(String value) {
        if (value == null) return "";
        return java.text.Normalizer.normalize(value, java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .replace('đ', 'd')
                .replace('Đ', 'D');
    }
}
