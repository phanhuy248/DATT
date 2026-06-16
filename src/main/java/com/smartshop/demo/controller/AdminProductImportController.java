package com.smartshop.demo.controller;

import com.smartshop.demo.dto.ApiResponse;
import com.smartshop.demo.dto.product.ProductImportItem;
import com.smartshop.demo.dto.product.ProductImportPayload;
import com.smartshop.demo.dto.product.ProductImportResult;
import com.smartshop.demo.service.ProductImportService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminProductImportController {
    private final ProductImportService productImportService;
    private final ObjectMapper objectMapper;

    public AdminProductImportController(ProductImportService productImportService, ObjectMapper objectMapper) {
        this.productImportService = productImportService;
        this.objectMapper = objectMapper;
    }

    @PostMapping("/import-products")
    public ResponseEntity<ApiResponse<ProductImportResult>> importProducts(@RequestBody JsonNode body) {
        List<ProductImportItem> products = parseProducts(body);
        ProductImportResult result = productImportService.importProducts(products);
        return ResponseEntity.ok(ApiResponse.ok("Import products completed", result));
    }

    @DeleteMapping("/import-products")
    public ResponseEntity<ApiResponse<Integer>> deleteImportedProducts(@RequestParam String sourceSite) {
        int deleted = productImportService.softDeleteBySourceSite(sourceSite);
        return ResponseEntity.ok(ApiResponse.ok("Imported products hidden", deleted));
    }

    private List<ProductImportItem> parseProducts(JsonNode body) {
        if (body == null || body.isNull()) return List.of();
        if (body.isArray()) {
            return objectMapper.convertValue(body, new TypeReference<List<ProductImportItem>>() {});
        }
        ProductImportPayload payload = objectMapper.convertValue(body, ProductImportPayload.class);
        return payload.getProducts() == null ? List.of() : payload.getProducts();
    }
}
