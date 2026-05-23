package com.example.demo.service;

import com.example.demo.domain.Category;
import com.example.demo.repository.CategoryRepository;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CategoryService {
    private final CategoryRepository categoryRepository;

    public CategoryService(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    @Cacheable("categories")
    public List<Category> getAllCategories() {
        return categoryRepository.findByDeletedFalse();
    }

    public Category findById(long id) {
        return categoryRepository.findById(id).orElse(null);
    }

    @CacheEvict(value = "categories", allEntries = true)
    public Category save(Category category) {
        return categoryRepository.save(category);
    }

    @CacheEvict(value = "categories", allEntries = true)
    public void deleteById(long id) {
        Category category = categoryRepository.findById(id).orElse(null);
        if (category != null) {
            category.setDeleted(true);
            categoryRepository.save(category);
        }
    }

    public long countCategories() {
        return categoryRepository.count();
    }
}
