package com.smartshop.demo.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.math.BigDecimal;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.smartshop.demo.domain.Category;
import com.smartshop.demo.domain.Product;
import com.smartshop.demo.domain.StockImport;
import com.smartshop.demo.dto.product.ProductDTO;
import com.smartshop.demo.dto.product.ProductPriceHistoryDTO;
import com.smartshop.demo.repository.ProductPriceHistoryRepository;
import com.smartshop.demo.repository.ProductRepository;
import com.smartshop.demo.repository.ProductSpecification;
import com.smartshop.demo.repository.StockImportRepository;

@Service
public class ProductService {
    private final ProductRepository productRepository;
    private final StockImportRepository stockImportRepository;
    private final ProductPriceHistoryRepository priceHistoryRepository;

    public ProductService(ProductRepository productRepository,
                          StockImportRepository stockImportRepository,
                          ProductPriceHistoryRepository priceHistoryRepository) {
        this.productRepository = productRepository;
        this.stockImportRepository = stockImportRepository;
        this.priceHistoryRepository = priceHistoryRepository;
    }

    // Map sang DTO bên trong @Transactional để tránh LazyInitializationException khi truy cập reviews
    @Transactional(readOnly = true)
    public Page<ProductDTO> getProductsPageFiltered(String keyword, Long categoryId, String categoryName,
            BigDecimal minPrice, BigDecimal maxPrice, String brand, String ram, String target,
            String sortBy, int page, int size) {
        return getProductsPageFiltered(keyword, categoryId, categoryName, minPrice, maxPrice, brand, ram, target, sortBy, page, size, false);
    }

    @Transactional(readOnly = true)
    public Page<ProductDTO> getProductsPageFiltered(String keyword, Long categoryId, String categoryName,
            BigDecimal minPrice, BigDecimal maxPrice, String brand, String ram, String target,
            String sortBy, int page, int size, boolean includeInactive) {
        Sort sort = switch (sortBy != null ? sortBy : "") {
            case "price_asc" -> Sort.by(Sort.Direction.ASC, "price");
            case "price_desc" -> Sort.by(Sort.Direction.DESC, "price");
            case "newest" -> Sort.by(Sort.Direction.DESC, "id");
            case "bestseller" -> Sort.by(Sort.Direction.DESC, "sold");
            default -> Sort.by(Sort.Direction.ASC, "name");
        };
        Pageable pageable = PageRequest.of(page, size, sort);
        return productRepository.findAll(
                ProductSpecification.filter(keyword, categoryId, categoryName, minPrice, maxPrice, brand, ram, target, includeInactive), pageable)
                .map(ProductDTO::from);
    }

    @Transactional(readOnly = true)
    public ProductDTO findProductDTO(long id) {
        return productRepository.findById(id).map(ProductDTO::from).orElse(null);
    }

    @Transactional(readOnly = true)
    public Product findById(long id) {
        return productRepository.findById(id).orElse(null);
    }

    @Caching(evict = {
        @CacheEvict(value = "topProducts", allEntries = true),
        @CacheEvict(value = "productStats", allEntries = true)
    })
    @Transactional
    public Product save(Product product) {
        return productRepository.save(product);
    }

    // Lưu và reload trong cùng transaction để ProductDTO::from có thể truy cập lazy collections
    @Caching(evict = {
        @CacheEvict(value = "topProducts", allEntries = true),
        @CacheEvict(value = "productStats", allEntries = true)
    })
    @Transactional
    public ProductDTO saveAndConvert(Product product) {
        long savedId = productRepository.save(product).getId();
        return productRepository.findById(savedId).map(ProductDTO::from).orElseThrow();
    }

    @Caching(evict = {
        @CacheEvict(value = "topProducts", allEntries = true),
        @CacheEvict(value = "productStats", allEntries = true)
    })
    @Transactional
    public void deleteById(long id) {
        Product product = productRepository.findById(id).orElse(null);
        if (product != null) {
            product.setDeleted(true);
            productRepository.save(product);
        }
    }

    @Caching(evict = {
        @CacheEvict(value = "topProducts", allEntries = true),
        @CacheEvict(value = "productStats", allEntries = true)
    })
    @Transactional
    public ProductDTO toggleActive(long id) {
        Product product = productRepository.findById(id).orElse(null);
        if (product == null || product.isDeleted()) return null;
        product.setActive(!product.isActive());
        long savedId = productRepository.save(product).getId();
        return productRepository.findById(savedId).map(ProductDTO::from).orElseThrow();
    }

    @Caching(evict = {
        @CacheEvict(value = "topProducts", allEntries = true),
        @CacheEvict(value = "productStats", allEntries = true)
    })
    @Transactional
    public ProductDTO restoreById(long id) {
        Product product = productRepository.findById(id).orElse(null);
        if (product == null) {
            return null;
        }
        product.setDeleted(false);
        long savedId = productRepository.save(product).getId();
        return productRepository.findById(savedId).map(ProductDTO::from).orElseThrow();
    }

    // --- Dashboard statistics ---
    @Cacheable(value = "productStats", key = "'count'")
    public long countProducts() {
        return productRepository.countByDeletedFalse();
    }

    @Cacheable(value = "productStats", key = "'lowStock'")
    public long countLowStockProducts() {
        return productRepository.countLowStockProducts();
    }

    public long countProductsDirect() {
        return productRepository.countByDeletedFalse();
    }

    public long countLowStockProductsDirect() {
        return productRepository.countLowStockProducts();
    }

    @Cacheable(value = "topProducts", key = "#limit")
    @Transactional(readOnly = true)
    public List<ProductDTO> getTopSellingProducts(int limit) {
        return productRepository.findTopSellingProducts(PageRequest.of(0, limit))
                .stream().map(ProductDTO::from).toList();
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getTopSellingProductsFiltered(
            String brand, LocalDate dateFrom, LocalDate dateTo, Long categoryId, int limit) {
        LocalDateTime from = dateFrom != null ? dateFrom.atStartOfDay()       : null;
        LocalDateTime to   = dateTo   != null ? dateTo.atTime(23, 59, 59) : null;
        String brandParam  = (brand != null && !brand.isBlank()) ? brand : null;
        List<Object[]> rows = productRepository.findTopSellingProductsFiltered(
                brandParam, from, to, categoryId);
        return rows.stream().limit(limit).map(r -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id",           r[0]);
            m.put("name",         r[1]);
            m.put("price",        r[2]);
            m.put("image",        r[3]);
            m.put("factory",      r[4]);
            m.put("categoryName", r[5]);
            m.put("sold",         r[6]);
            return m;
        }).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ProductDTO> getLowStockProducts(long threshold, int limit) {
        return productRepository.findLowStockProducts(threshold, PageRequest.of(0, limit))
                .stream().map(ProductDTO::from).toList();
    }

    public List<Product> getProductsByCategory(Category category) {
        return productRepository.findByCategoryAndDeletedFalse(category);
    }

    @Transactional
    public ProductDTO importStock(long productId, long quantity, String note) {
        Product product = productRepository.findById(productId).orElse(null);
        if (product == null || product.isDeleted()) {
            throw new IllegalArgumentException("Không tìm thấy sản phẩm");
        }
        product.setQuantity(product.getQuantity() + quantity);
        productRepository.save(product);

        StockImport stockImport = new StockImport();
        stockImport.setProduct(product);
        stockImport.setQuantity(quantity);
        stockImport.setNote(note);
        stockImportRepository.save(stockImport);
        return productRepository.findById(productId).map(ProductDTO::from).orElseThrow();
    }

    public List<StockImport> getStockImports(long productId) {
        return stockImportRepository.findByProductIdOrderByCreatedAtDesc(productId);
    }

    @Transactional(readOnly = true)
    public List<ProductPriceHistoryDTO> getPriceHistory(long productId) {
        return priceHistoryRepository.findByProductIdOrderByRecordedAtDesc(productId)
                .stream().map(ProductPriceHistoryDTO::from).toList();
    }
}
