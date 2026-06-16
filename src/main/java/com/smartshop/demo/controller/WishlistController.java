package com.smartshop.demo.controller;

import com.smartshop.demo.domain.User;
import com.smartshop.demo.dto.ApiResponse;
import com.smartshop.demo.dto.product.ProductDTO;
import com.smartshop.demo.repository.UserRepository;
import com.smartshop.demo.service.WishlistService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/wishlist")
public class WishlistController {

    private final WishlistService wishlistService;
    private final UserRepository userRepository;

    public WishlistController(WishlistService wishlistService, UserRepository userRepository) {
        this.wishlistService = wishlistService;
        this.userRepository = userRepository;
    }

    /**
     * Toggle yêu thích: thêm hoặc xóa sản phẩm khỏi wishlist.
     * POST /api/wishlist/toggle/{productId}  — yêu cầu JWT
     */
    @PostMapping("/toggle/{productId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> toggle(
            @PathVariable Long productId,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = resolveUser(userDetails);
        if (user == null) return ResponseEntity.status(401).body(ApiResponse.error("Bạn chưa đăng nhập"));

        boolean added = wishlistService.toggle(user.getId(), productId);
        String message = added ? "Đã thêm vào danh sách yêu thích" : "Đã xóa khỏi danh sách yêu thích";
        return ResponseEntity.ok(ApiResponse.ok(message, Map.of("isFavorite", added)));
    }

    /**
     * Lấy danh sách sản phẩm yêu thích của user hiện tại.
     * GET /api/wishlist  — yêu cầu JWT
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<ProductDTO>>> getWishlist(
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = resolveUser(userDetails);
        if (user == null) return ResponseEntity.status(401).body(ApiResponse.error("Bạn chưa đăng nhập"));

        List<ProductDTO> products = wishlistService.getWishlistProducts(user.getId());
        return ResponseEntity.ok(ApiResponse.ok(products));
    }

    private User resolveUser(UserDetails userDetails) {
        if (userDetails == null) return null;
        return userRepository.findByEmail(userDetails.getUsername());
    }
}
