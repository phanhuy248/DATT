package com.smartshop.demo.controller;

import com.smartshop.demo.domain.CartItem;
import com.smartshop.demo.domain.User;
import com.smartshop.demo.dto.ApiResponse;
import com.smartshop.demo.dto.cart.CartDTO;
import com.smartshop.demo.dto.cart.CartItemRequest;
import com.smartshop.demo.service.CartService;
import com.smartshop.demo.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cart")
public class CartController {

    private final CartService cartService;
    private final UserService userService;

    public CartController(CartService cartService, UserService userService) {
        this.cartService = cartService;
        this.userService = userService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<CartDTO>> getCart(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.findByEmail(userDetails.getUsername());
        List<CartItem> items = cartService.getCart(user);
        return ResponseEntity.ok(ApiResponse.ok(CartDTO.from(items)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CartDTO>> addToCart(@AuthenticationPrincipal UserDetails userDetails,
                                                           @Valid @RequestBody CartItemRequest req) {
        User user = userService.findByEmail(userDetails.getUsername());
        cartService.addToCart(user, req.getProductId(), req.getQuantity());
        List<CartItem> items = cartService.getCart(user);
        return ResponseEntity.ok(ApiResponse.ok("Đã thêm vào giỏ hàng", CartDTO.from(items)));
    }

    @PutMapping("/{cartItemId}")
    public ResponseEntity<ApiResponse<CartDTO>> updateQuantity(@AuthenticationPrincipal UserDetails userDetails,
                                                                @PathVariable long cartItemId,
                                                                @RequestBody CartItemRequest req) {
        User user = userService.findByEmail(userDetails.getUsername());
        cartService.updateQuantity(user, cartItemId, req.getQuantity());
        List<CartItem> items = cartService.getCart(user);
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật giỏ hàng thành công", CartDTO.from(items)));
    }

    @DeleteMapping("/{cartItemId}")
    public ResponseEntity<ApiResponse<CartDTO>> removeItem(@AuthenticationPrincipal UserDetails userDetails,
                                                            @PathVariable long cartItemId) {
        User user = userService.findByEmail(userDetails.getUsername());
        cartService.removeFromCart(user, cartItemId);
        List<CartItem> items = cartService.getCart(user);
        return ResponseEntity.ok(ApiResponse.ok("Đã xóa sản phẩm khỏi giỏ", CartDTO.from(items)));
    }

    @DeleteMapping
    public ResponseEntity<ApiResponse<Void>> clearCart(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.findByEmail(userDetails.getUsername());
        cartService.clearCart(user);
        return ResponseEntity.ok(ApiResponse.ok("Đã xóa toàn bộ giỏ hàng", null));
    }
}
