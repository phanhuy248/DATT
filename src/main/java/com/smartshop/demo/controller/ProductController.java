package com.smartshop.demo.controller;

import com.smartshop.demo.domain.Category;
import com.smartshop.demo.domain.Product;
import com.smartshop.demo.dto.ApiResponse;
import com.smartshop.demo.dto.PagedResponse;
import com.smartshop.demo.domain.User;
import com.smartshop.demo.dto.product.ProductDTO;
import com.smartshop.demo.dto.product.ProductRequest;
import com.smartshop.demo.dto.product.StockImportRequest;
import com.smartshop.demo.repository.UserRepository;
import com.smartshop.demo.service.AuditLogService;
import com.smartshop.demo.service.CategoryService;
import com.smartshop.demo.service.ProductService;
import com.smartshop.demo.service.RecommendationService;
import com.smartshop.demo.service.SupplierService;
import com.smartshop.demo.service.UploadService;
import com.smartshop.demo.service.WishlistService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Set;
import java.math.BigDecimal;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;
    private final CategoryService categoryService;
    private final UploadService uploadService;
    private final RecommendationService recommendationService;
    private final UserRepository userRepository;
    private final SupplierService supplierService;
    private final AuditLogService auditLogService;
    private final WishlistService wishlistService;

    public ProductController(ProductService productService,
                             CategoryService categoryService,
                             UploadService uploadService,
                             RecommendationService recommendationService,
                             UserRepository userRepository,
                             SupplierService supplierService,
                             AuditLogService auditLogService,
                             WishlistService wishlistService) {
        this.productService = productService;
        this.categoryService = categoryService;
        this.uploadService = uploadService;
        this.recommendationService = recommendationService;
        this.userRepository = userRepository;
        this.supplierService = supplierService;
        this.auditLogService = auditLogService;
        this.wishlistService = wishlistService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<ProductDTO>>> getProducts(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String categoryName,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) String brand,
            @RequestParam(required = false) String ram,
            @RequestParam(required = false) String target,
            @RequestParam(defaultValue = "newest") String sortBy,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @AuthenticationPrincipal UserDetails userDetails) {
        boolean isAdmin = userDetails != null && userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_STAFF"));
        Page<ProductDTO> dtoPage = productService.getProductsPageFiltered(
                keyword, categoryId, categoryName, minPrice, maxPrice, brand, ram, target, sortBy, page, size, isAdmin);

        if (userDetails != null) {
            User user = currentUser(userDetails);
            if (user != null) {
                Set<Long> favoriteIds = wishlistService.getFavoriteProductIds(user.getId());
                dtoPage.getContent().forEach(dto -> dto.setFavorite(favoriteIds.contains(dto.getId())));
            }
        }

        return ResponseEntity.ok(ApiResponse.ok(PagedResponse.of(dtoPage)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductDTO>> getProduct(
            @PathVariable long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        ProductDTO dto = productService.findProductDTO(id);
        if (dto == null) return ResponseEntity.notFound().build();

        if (userDetails != null) {
            User user = userRepository.findByEmail(userDetails.getUsername());
            if (user != null) {
                recommendationService.recordView(user.getId(), id);
                dto.setFavorite(wishlistService.isProductFavorited(user.getId(), id));
            }
        }

        return ResponseEntity.ok(ApiResponse.ok(dto));
    }

    // Sản phẩm liên quan (cùng category, public)
    @GetMapping("/{id}/related")
    public ResponseEntity<ApiResponse<List<ProductDTO>>> getRelatedProducts(
            @PathVariable long id,
            @RequestParam(defaultValue = "8") int limit) {
        List<ProductDTO> related = recommendationService.getRelatedProducts(id, limit);
        return ResponseEntity.ok(ApiResponse.ok(related));
    }

    @GetMapping("/{id}/price-history")
    public ResponseEntity<ApiResponse<?>> getPriceHistory(@PathVariable long id) {
        return ResponseEntity.ok(ApiResponse.ok(productService.getPriceHistory(id)));
    }

    // Sản phẩm gợi ý cá nhân hóa (cần đăng nhập)
    @GetMapping("/recommended")
    public ResponseEntity<ApiResponse<List<ProductDTO>>> getRecommendedProducts(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "8") int limit) {
        User user = userRepository.findByEmail(userDetails.getUsername());
        if (user == null) return ResponseEntity.ok(ApiResponse.ok(List.of()));
        List<ProductDTO> recs = recommendationService.getPersonalizedRecommendations(user.getId(), limit);
        return ResponseEntity.ok(ApiResponse.ok(recs));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ProductDTO>> createProduct(
            @Valid @RequestPart("data") ProductRequest req,
            @RequestPart(value = "image", required = false) MultipartFile image,
            @AuthenticationPrincipal UserDetails userDetails,
            HttpServletRequest request) {
        Product product = buildProduct(new Product(), req, image);
        product.setSold(0);
        // saveAndConvert() lưu rồi reload trong cùng @Transactional để DTO map đúng
        ProductDTO saved = productService.saveAndConvert(product);
        auditLogService.record(currentUser(userDetails), "CREATE_PRODUCT", "Product", saved.getId(),
                null, productSummary(saved), request);
        return ResponseEntity.status(201).body(ApiResponse.ok("Tạo sản phẩm thành công", saved));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductDTO>> updateProduct(
            @PathVariable long id,
            @Valid @RequestPart("data") ProductRequest req,
            @RequestPart(value = "image", required = false) MultipartFile image,
            @AuthenticationPrincipal UserDetails userDetails,
            HttpServletRequest request) {
        Product product = productService.findById(id);
        if (product == null) return ResponseEntity.notFound().build();
        String oldValue = productSummary(product);
        buildProduct(product, req, image);
        ProductDTO saved = productService.saveAndConvert(product);
        auditLogService.record(currentUser(userDetails), "UPDATE_PRODUCT", "Product", saved.getId(),
                oldValue, productSummary(saved), request);
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật thành công", saved));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteProduct(@PathVariable long id,
                                                           @AuthenticationPrincipal UserDetails userDetails,
                                                           HttpServletRequest request) {
        Product product = productService.findById(id);
        if (product == null) return ResponseEntity.notFound().build();
        String oldValue = productSummary(product);
        productService.deleteById(id);
        auditLogService.record(currentUser(userDetails), "DELETE_PRODUCT", "Product", id,
                oldValue, null, request);
        return ResponseEntity.ok(ApiResponse.ok("Xóa sản phẩm thành công", null));
    }

    @PatchMapping("/{id}/toggle-active")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<ApiResponse<ProductDTO>> toggleActive(@PathVariable long id,
                                                                @AuthenticationPrincipal UserDetails userDetails,
                                                                HttpServletRequest request) {
        ProductDTO dto = productService.toggleActive(id);
        if (dto == null) return ResponseEntity.notFound().build();
        String action = dto.isActive() ? "ACTIVATE_PRODUCT" : "PAUSE_PRODUCT";
        String msg    = dto.isActive() ? "Sản phẩm đã được kích hoạt" : "Sản phẩm đã tạm dừng bán";
        auditLogService.record(currentUser(userDetails), action, "Product", id, null, productSummary(dto), request);
        return ResponseEntity.ok(ApiResponse.ok(msg, dto));
    }

    @PatchMapping("/{id}/restore")
    public ResponseEntity<ApiResponse<ProductDTO>> restoreProduct(@PathVariable long id,
                                                                  @AuthenticationPrincipal UserDetails userDetails,
                                                                  HttpServletRequest request) {
        ProductDTO restored = productService.restoreById(id);
        if (restored == null) return ResponseEntity.notFound().build();
        auditLogService.record(currentUser(userDetails), "RESTORE_PRODUCT", "Product", id,
                null, productSummary(restored), request);
        return ResponseEntity.ok(ApiResponse.ok("Khôi phục sản phẩm thành công", restored));
    }

    @PostMapping("/{id}/stock-import")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<ApiResponse<ProductDTO>> importStock(@PathVariable long id,
                                                               @Valid @RequestBody StockImportRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Nhập hàng thành công",
                productService.importStock(id, req.getQuantity(), req.getNote())));
    }

    @GetMapping("/{id}/stock-imports")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<ApiResponse<?>> getStockImports(@PathVariable long id) {
        return ResponseEntity.ok(ApiResponse.ok(productService.getStockImports(id)));
    }

    private Product buildProduct(Product product, ProductRequest req, MultipartFile image) {
        product.setName(req.getName());
        product.setPrice(req.getPrice());
        product.setOriginalPrice(req.getOriginalPrice());
        product.setDiscountPercent(req.getDiscountPercent());
        product.setShortDesc(req.getShortDesc());
        product.setDetailDesc(req.getDetailDesc());
        product.setQuantity(req.getQuantity());
        product.setFactory(req.getFactory());
        product.setTarget(req.getTarget());
        if (req.getCategoryId() != null) {
            Category category = categoryService.findById(req.getCategoryId());
            product.setCategory(category);
        }
        product.setSupplier(supplierService.findById(req.getSupplierId()));
        if (image != null && !image.isEmpty()) {
            String imagePath = uploadService.saveFile(image, "products");
            product.setImage(imagePath);
        }
        return product;
    }

    private User currentUser(UserDetails userDetails) {
        return userDetails == null ? null : userRepository.findByEmail(userDetails.getUsername());
    }

    private String productSummary(Product product) {
        return "id=" + product.getId()
                + ", name=" + product.getName()
                + ", price=" + product.getPrice()
                + ", quantity=" + product.getQuantity();
    }

    private String productSummary(ProductDTO product) {
        return "id=" + product.getId()
                + ", name=" + product.getName()
                + ", price=" + product.getPrice()
                + ", quantity=" + product.getQuantity();
    }
}
