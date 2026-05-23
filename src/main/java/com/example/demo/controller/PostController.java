package com.example.demo.controller;

import com.example.demo.domain.Post;
import com.example.demo.dto.ApiResponse;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.PostRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.text.Normalizer;
import java.util.List;
import java.util.Locale;

@RestController
@RequestMapping("/api/posts")
public class PostController {
    private final PostRepository postRepository;

    public PostController(PostRepository postRepository) {
        this.postRepository = postRepository;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Post>>> getPublished() {
        return ResponseEntity.ok(ApiResponse.ok(postRepository.findByDeletedFalseAndPublishedTrueOrderByCreatedAtDesc()));
    }

    @GetMapping("/{slug}")
    public ResponseEntity<ApiResponse<Post>> getBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(ApiResponse.ok(postRepository.findBySlugAndDeletedFalseAndPublishedTrue(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tin tức"))));
    }

    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<Post>>> getAll() {
        return ResponseEntity.ok(ApiResponse.ok(postRepository.findByDeletedFalseOrderByIdDesc()));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Post>> create(@RequestBody Post post) {
        post.setSlug(uniqueSlug(post.getSlug() == null || post.getSlug().isBlank() ? post.getTitle() : post.getSlug(), 0));
        return ResponseEntity.status(201).body(ApiResponse.ok("Tạo tin tức thành công", postRepository.save(post)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Post>> update(@PathVariable long id, @RequestBody Post req) {
        Post post = postRepository.findById(id).filter(p -> !p.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tin tức"));
        post.setTitle(req.getTitle());
        post.setSlug(uniqueSlug(req.getSlug() == null || req.getSlug().isBlank() ? req.getTitle() : req.getSlug(), id));
        post.setSummary(req.getSummary());
        post.setContent(req.getContent());
        post.setThumbnail(req.getThumbnail());
        post.setPublished(req.isPublished());
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật tin tức thành công", postRepository.save(post)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable long id) {
        Post post = postRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tin tức"));
        post.setDeleted(true);
        postRepository.save(post);
        return ResponseEntity.ok(ApiResponse.ok("Xóa tin tức thành công", null));
    }

    private String uniqueSlug(String input, long currentId) {
        String base = Normalizer.normalize(input, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-|-$)", "");
        if (base.isBlank()) base = "tin-tuc";
        String slug = base;
        int i = 2;
        while (slugExists(slug, currentId)) {
            slug = base + "-" + i++;
        }
        return slug;
    }

    private boolean slugExists(String slug, long currentId) {
        return postRepository.findAll().stream()
                .anyMatch(p -> !p.isDeleted() && p.getId() != currentId && slug.equals(p.getSlug()));
    }
}
