package com.smartshop.demo.controller;

import com.smartshop.demo.dto.ApiResponse;
import com.smartshop.demo.dto.PagedResponse;
import com.smartshop.demo.dto.flashsale.FlashSaleCreateRequest;
import com.smartshop.demo.dto.flashsale.FlashSaleDTO;
import com.smartshop.demo.dto.flashsale.FlashSaleUpdateRequest;
import com.smartshop.demo.service.FlashSaleService;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class FlashSaleController {

    private final FlashSaleService flashSaleService;

    public FlashSaleController(FlashSaleService flashSaleService) {
        this.flashSaleService = flashSaleService;
    }

    /** Public — trang chủ lấy danh sách flash sale đang hoạt động. Đã permitAll qua /api/products/**. */
    @GetMapping("/api/products/flash-sale")
    public ResponseEntity<ApiResponse<List<FlashSaleDTO>>> getActiveFlashSaleItems() {
        return ResponseEntity.ok(ApiResponse.ok(flashSaleService.getActiveItems()));
    }

    // ── Admin ────────────────────────────────────────────────────────────────

    @GetMapping("/api/admin/flash-sales")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<ApiResponse<PagedResponse<FlashSaleDTO>>> getAllAdmin(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.ok(
                PagedResponse.of(flashSaleService.getAllAdmin(
                        PageRequest.of(page, size, Sort.by("sortOrder").ascending()
                                .and(Sort.by("createdAt").descending()))))));
    }

    @PostMapping("/api/admin/flash-sales")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<ApiResponse<FlashSaleDTO>> create(@RequestBody FlashSaleCreateRequest req) {
        return ResponseEntity.status(201).body(ApiResponse.ok("Đã thêm vào flash sale",
                flashSaleService.create(req)));
    }

    @PutMapping("/api/admin/flash-sales/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<ApiResponse<FlashSaleDTO>> update(@PathVariable Long id,
                                                             @RequestBody FlashSaleUpdateRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Đã cập nhật flash sale",
                flashSaleService.update(id, req)));
    }

    @DeleteMapping("/api/admin/flash-sales/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        flashSaleService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok("Đã xóa khỏi flash sale", null));
    }
}
