package com.smartshop.demo.controller;

import com.smartshop.demo.domain.Supplier;
import com.smartshop.demo.dto.ApiResponse;
import com.smartshop.demo.service.SupplierService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/suppliers")
public class SupplierController {
    private final SupplierService supplierService;

    public SupplierController(SupplierService supplierService) {
        this.supplierService = supplierService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Supplier>>> getAll() {
        return ResponseEntity.ok(ApiResponse.ok(supplierService.getAll()));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Supplier>> create(@Valid @RequestBody Supplier supplier) {
        return ResponseEntity.status(201).body(ApiResponse.ok("Tạo nhà cung cấp thành công", supplierService.save(supplier)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Supplier>> update(@PathVariable long id, @RequestBody Supplier req) {
        Supplier supplier = supplierService.findById(id);
        if (supplier == null) return ResponseEntity.notFound().build();
        supplier.setName(req.getName());
        supplier.setRepresentativeName(req.getRepresentativeName());
        supplier.setEmail(req.getEmail());
        supplier.setPhone(req.getPhone());
        supplier.setAddress(req.getAddress());
        supplier.setActive(req.isActive());
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật nhà cung cấp thành công", supplierService.save(supplier)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable long id) {
        supplierService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok("Xóa nhà cung cấp thành công", null));
    }
}
