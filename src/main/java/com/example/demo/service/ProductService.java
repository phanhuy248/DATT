package com.example.demo.service;

import java.util.List;
import java.math.BigDecimal;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.domain.Category;
import com.example.demo.domain.Product;
import com.example.demo.domain.StockImport;
import com.example.demo.dto.product.ProductDTO;
import com.example.demo.dto.product.ProductPriceHistoryDTO;
import com.example.demo.repository.ProductPriceHistoryRepository;
import com.example.demo.repository.ProductRepository;
import com.example.demo.repository.ProductSpecification;
import com.example.demo.repository.StockImportRepository;

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
        Sort sort = switch (sortBy != null ? sortBy : "") {
            case "price_asc" -> Sort.by(Sort.Direction.ASC, "price");
            case "price_desc" -> Sort.by(Sort.Direction.DESC, "price");
            case "newest" -> Sort.by(Sort.Direction.DESC, "id");
            case "bestseller" -> Sort.by(Sort.Direction.DESC, "sold");
            default -> Sort.by(Sort.Direction.ASC, "name");
        };
        Pageable pageable = PageRequest.of(page, size, sort);
        return productRepository.findAll(
                ProductSpecification.filter(keyword, categoryId, categoryName, minPrice, maxPrice, brand, ram, target), pageable)
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
