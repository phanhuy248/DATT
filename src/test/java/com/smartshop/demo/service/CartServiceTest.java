package com.smartshop.demo.service;

import com.smartshop.demo.domain.Product;
import com.smartshop.demo.domain.User;
import com.smartshop.demo.repository.CartItemRepository;
import com.smartshop.demo.repository.ProductRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CartServiceTest {
    @Mock
    CartItemRepository cartItemRepository;
    @Mock
    ProductRepository productRepository;
    @InjectMocks
    CartService cartService;

    @Test
    void addToCartRejectsQuantityGreaterThanStock() {
        Product product = new Product();
        product.setId(1L);
        product.setName("Laptop test");
        product.setPrice(BigDecimal.valueOf(1000));
        product.setQuantity(2);
        when(productRepository.findById(1L)).thenReturn(Optional.of(product));

        assertThrows(IllegalArgumentException.class,
                () -> cartService.addToCart(new User(), 1L, 3));
    }
}
