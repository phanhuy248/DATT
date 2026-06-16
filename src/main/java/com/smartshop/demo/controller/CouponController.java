package com.smartshop.demo.controller;

import com.smartshop.demo.domain.Coupon;
import com.smartshop.demo.dto.ApiResponse;
import com.smartshop.demo.dto.coupon.CouponRequest;
import com.smartshop.demo.dto.coupon.CouponValidationResponse;
import com.smartshop.demo.service.CouponService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/coupons")
public class CouponController {
    private final CouponService couponService;

    public CouponController(CouponService couponService) {
        this.couponService = couponService;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<Coupon>>> getAll() {
        return ResponseEntity.ok(ApiResponse.ok(couponService.getAll()));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Coupon>> create(@Valid @RequestBody CouponRequest req) {
        return ResponseEntity.status(201).body(ApiResponse.ok("Tạo mã giảm giá thành công", couponService.create(req)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Coupon>> update(@PathVariable long id, @Valid @RequestBody CouponRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật mã giảm giá thành công", couponService.update(id, req)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable long id) {
        couponService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok("Xóa mã giảm giá thành công", null));
    }

    @PostMapping("/validate")
    public ResponseEntity<ApiResponse<CouponValidationResponse>> validate(@RequestBody Map<String, Object> body) {
        String code = String.valueOf(body.getOrDefault("code", ""));
        BigDecimal amount = new BigDecimal(String.valueOf(body.getOrDefault("orderAmount", "0")));
        BigDecimal discount = couponService.calculateDiscount(code, amount);
        return ResponseEntity.ok(ApiResponse.ok(new CouponValidationResponse(code.trim().toUpperCase(), discount, amount.subtract(discount))));
    }
}
