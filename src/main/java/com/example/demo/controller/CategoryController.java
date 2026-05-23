package com.example.demo.controller;

import com.example.demo.domain.Category;
import com.example.demo.dto.ApiResponse;
import com.example.demo.service.CategoryService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    private final CategoryService categoryService;

    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Category>>> getAll() {
        return ResponseEntity.ok(ApiResponse.ok(categoryService.getAllCategories()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Category>> getById(@PathVariable long id) {
        Category category = categoryService.findById(id);
        if (category == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(ApiResponse.ok(category));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Category>> create(@Valid @RequestBody Category category) {
        return ResponseEntity.status(201).body(ApiResponse.ok("Tạo danh mục thành công",
                categoryService.save(category)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Category>> update(@PathVariable long id,
                                                         @Valid @RequestBody Category req) {
        Category category = categoryService.findById(id);
        if (category == null) return ResponseEntity.notFound().build();
        category.setName(req.getName());
        category.setDescription(req.getDescription());
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật danh mục thành công",
                categoryService.save(category)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable long id) {
        categoryService.deleteById(id);
        return ResponseEntity.ok(ApiResponse.ok("Xóa danh mục thành công", null));
    }
}
