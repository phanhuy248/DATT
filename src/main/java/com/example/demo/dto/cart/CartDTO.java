package com.example.demo.dto.cart;

import com.example.demo.domain.CartItem;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

public class CartDTO {
    private List<CartItemDTO> items;
    private BigDecimal totalPrice;
    private int totalItems;

    public static CartDTO from(List<CartItem> cartItems) {
        CartDTO dto = new CartDTO();
        dto.items = cartItems.stream().map(CartItemDTO::from).collect(Collectors.toList());
        dto.totalPrice = cartItems.stream()
                .map(ci -> ci.getProduct().getPrice().multiply(BigDecimal.valueOf(ci.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        dto.totalItems = cartItems.stream().mapToInt(CartItem::getQuantity).sum();
        return dto;
    }

    public List<CartItemDTO> getItems() { return items; }
    public BigDecimal getTotalPrice() { return totalPrice; }
    public int getTotalItems() { return totalItems; }

    public static class CartItemDTO {
        private long cartItemId;
        private long productId;
        private String productName;
        private String productImage;
        private BigDecimal productPrice;
        private int quantity;
        private BigDecimal subtotal;

        public static CartItemDTO from(CartItem ci) {
            CartItemDTO d = new CartItemDTO();
            d.cartItemId = ci.getId();
            d.productId = ci.getProduct().getId();
            d.productName = ci.getProduct().getName();
            d.productImage = ci.getProduct().getImage();
            d.productPrice = ci.getProduct().getPrice();
            d.quantity = ci.getQuantity();
            d.subtotal = ci.getProduct().getPrice().multiply(BigDecimal.valueOf(ci.getQuantity()));
            return d;
        }

        public long getCartItemId() { return cartItemId; }
        public long getProductId() { return productId; }
        public String getProductName() { return productName; }
        public String getProductImage() { return productImage; }
        public BigDecimal getProductPrice() { return productPrice; }
        public int getQuantity() { return quantity; }
        public BigDecimal getSubtotal() { return subtotal; }
    }
}
