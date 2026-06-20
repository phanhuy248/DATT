package com.smartshop.demo.dto.cart;

import com.smartshop.demo.domain.CartItem;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public class CartDTO {
    private List<CartItemDTO> items;
    private BigDecimal totalPrice;
    private int totalItems;

    public static CartDTO from(List<CartItem> cartItems) {
        return from(cartItems, Collections.emptyMap());
    }

    public static CartDTO from(List<CartItem> cartItems, Map<Long, BigDecimal> flashSalePrices) {
        CartDTO dto = new CartDTO();
        dto.items = cartItems.stream()
                .map(ci -> CartItemDTO.from(ci, flashSalePrices.get(ci.getProduct().getId())))
                .collect(Collectors.toList());
        dto.totalPrice = dto.items.stream()
                .map(CartItemDTO::getSubtotal)
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
        private BigDecimal salePrice;
        private int quantity;
        private BigDecimal subtotal;

        public static CartItemDTO from(CartItem ci, BigDecimal flashPrice) {
            CartItemDTO d = new CartItemDTO();
            d.cartItemId = ci.getId();
            d.productId = ci.getProduct().getId();
            d.productName = ci.getProduct().getName();
            d.productImage = ci.getProduct().getImage();
            d.productPrice = ci.getProduct().getPrice();
            d.salePrice = flashPrice;
            d.quantity = ci.getQuantity();
            BigDecimal effectivePrice = flashPrice != null ? flashPrice : ci.getProduct().getPrice();
            d.subtotal = effectivePrice.multiply(BigDecimal.valueOf(ci.getQuantity()));
            return d;
        }

        public long getCartItemId() { return cartItemId; }
        public long getProductId() { return productId; }
        public String getProductName() { return productName; }
        public String getProductImage() { return productImage; }
        public BigDecimal getProductPrice() { return productPrice; }
        public BigDecimal getSalePrice() { return salePrice; }
        public int getQuantity() { return quantity; }
        public BigDecimal getSubtotal() { return subtotal; }
    }
}
