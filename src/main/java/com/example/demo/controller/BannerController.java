package com.example.demo.controller;

import com.example.demo.domain.Banner;
import com.example.demo.dto.ApiResponse;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.BannerRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/banners")
public class BannerController {
    private final BannerRepository bannerRepository;

    public BannerController(BannerRepository bannerRepository) {
        this.bannerRepository = bannerRepository;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Banner>>> getActive() {
        return ResponseEntity.ok(ApiResponse.ok(bannerRepository.findByDeletedFalseAndActiveTrueOrderBySortOrderAscIdDesc()));
    }

    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<Banner>>> getAll() {
        return ResponseEntity.ok(ApiResponse.ok(bannerRepository.findByDeletedFalseOrderBySortOrderAscIdDesc()));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Banner>> create(@RequestBody Banner banner) {
        return ResponseEntity.status(201).body(ApiResponse.ok("Tạo banner thành công", bannerRepository.save(banner)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Banner>> update(@PathVariable long id, @RequestBody Banner req) {
        Banner banner = bannerRepository.findById(id).filter(b -> !b.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy banner"));
        banner.setTitle(req.getTitle());
        banner.setSubtitle(req.getSubtitle());
        banner.setImage(req.getImage());
        banner.setLinkUrl(req.getLinkUrl());
        banner.setSortOrder(req.getSortOrder());
        banner.setActive(req.isActive());
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật banner thành công", bannerRepository.save(banner)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable long id) {
        Banner banner = bannerRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy banner"));
        banner.setDeleted(true);
        bannerRepository.save(banner);
        return ResponseEntity.ok(ApiResponse.ok("Xóa banner thành công", null));
    }
}
