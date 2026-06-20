package com.smartshop.demo.controller;

import com.smartshop.demo.domain.CartItem;
import com.smartshop.demo.domain.User;
import com.smartshop.demo.dto.ApiResponse;
import com.smartshop.demo.dto.cart.CartDTO;
import com.smartshop.demo.dto.cart.CartItemRequest;
import com.smartshop.demo.dto.flashsale.FlashSaleDTO;
import com.smartshop.demo.service.CartService;
import com.smartshop.demo.service.FlashSaleService;
import com.smartshop.demo.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/cart")
public class CartController {

    private final CartService cartService;
    private final UserService userService;
    private final FlashSaleService flashSaleService;

    public CartController(CartService cartService, UserService userService,
                          FlashSaleService flashSaleService) {
        this.cartService = cartService;
        this.userService = userService;
        this.flashSaleService = flashSaleService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<CartDTO>> getCart(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.findByEmail(userDetails.getUsername());
        List<CartItem> items = cartService.getCart(user);
        return ResponseEntity.ok(ApiResponse.ok(CartDTO.from(items, flashPriceMap(items))));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CartDTO>> addToCart(@AuthenticationPrincipal UserDetails userDetails,
                                                           @Valid @RequestBody CartItemRequest req) {
        User user = userService.findByEmail(userDetails.getUsername());
        cartService.addToCart(user, req.getProductId(), req.getQuantity());
        List<CartItem> items = cartService.getCart(user);
        return ResponseEntity.ok(ApiResponse.ok("Đã thêm vào giỏ hàng", CartDTO.from(items, flashPriceMap(items))));
    }

    @PutMapping("/{cartItemId}")
    public ResponseEntity<ApiResponse<CartDTO>> updateQuantity(@AuthenticationPrincipal UserDetails userDetails,
                                                                @PathVariable long cartItemId,
                                                                @RequestBody CartItemRequest req) {
        User user = userService.findByEmail(userDetails.getUsername());
        cartService.updateQuantity(user, cartItemId, req.getQuantity());
        List<CartItem> items = cartService.getCart(user);
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật giỏ hàng thành công", CartDTO.from(items, flashPriceMap(items))));
    }

    @DeleteMapping("/{cartItemId}")
    public ResponseEntity<ApiResponse<CartDTO>> removeItem(@AuthenticationPrincipal UserDetails userDetails,
                                                            @PathVariable long cartItemId) {
        User user = userService.findByEmail(userDetails.getUsername());
        cartService.removeFromCart(user, cartItemId);
        List<CartItem> items = cartService.getCart(user);
        return ResponseEntity.ok(ApiResponse.ok("Đã xóa sản phẩm khỏi giỏ", CartDTO.from(items, flashPriceMap(items))));
    }

    @DeleteMapping
    public ResponseEntity<ApiResponse<Void>> clearCart(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.findByEmail(userDetails.getUsername());
        cartService.clearCart(user);
        return ResponseEntity.ok(ApiResponse.ok("Đã xóa toàn bộ giỏ hàng", null));
    }

    private Map<Long, BigDecimal> flashPriceMap(List<CartItem> items) {
        if (items.isEmpty()) return Collections.emptyMap();
        Set<Long> productIds = items.stream()
                .map(ci -> ci.getProduct().getId())
                .collect(Collectors.toSet());
        return flashSaleService.getActiveItems().stream()
                .filter(fs -> productIds.contains(fs.getProductId()))
                .collect(Collectors.toMap(FlashSaleDTO::getProductId, FlashSaleDTO::getSalePrice,
                        (a, b) -> a));
    }
}
