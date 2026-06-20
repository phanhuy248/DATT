package com.smartshop.demo.service;

import com.smartshop.demo.domain.CartItem;
import com.smartshop.demo.domain.FlashSaleItem;
import com.smartshop.demo.domain.Product;
import com.smartshop.demo.domain.User;
import com.smartshop.demo.exception.ResourceNotFoundException;
import com.smartshop.demo.repository.CartItemRepository;
import com.smartshop.demo.repository.FlashSaleItemRepository;
import com.smartshop.demo.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class CartService {

    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final FlashSaleItemRepository flashSaleItemRepository;

    public CartService(CartItemRepository cartItemRepository, ProductRepository productRepository,
                       FlashSaleItemRepository flashSaleItemRepository) {
        this.cartItemRepository = cartItemRepository;
        this.productRepository = productRepository;
        this.flashSaleItemRepository = flashSaleItemRepository;
    }

    public List<CartItem> getCart(User user) {
        return cartItemRepository.findByUser(user);
    }

    @Transactional
    public CartItem addToCart(User user, long productId, int quantity) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm id=" + productId));
        if (product.isDeleted()) {
            throw new ResourceNotFoundException("Sản phẩm không còn kinh doanh");
        }

        Optional<CartItem> existing = cartItemRepository.findByUserAndProductId(user, productId);
        if (existing.isPresent()) {
            CartItem item = existing.get();
            int newQuantity = item.getQuantity() + quantity;
            validateStock(product, newQuantity);
            validateFlashSaleLimit(productId, newQuantity);
            item.setQuantity(newQuantity);
            return cartItemRepository.save(item);
        }

        validateStock(product, quantity);
        validateFlashSaleLimit(productId, quantity);
        CartItem item = new CartItem();
        item.setUser(user);
        item.setProduct(product);
        item.setQuantity(quantity);
        return cartItemRepository.save(item);
    }

    @Transactional
    public CartItem updateQuantity(User user, long cartItemId, int quantity) {
        CartItem item = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy item trong giỏ hàng"));
        if (item.getUser().getId() != user.getId()) {
            throw new IllegalArgumentException("Không có quyền chỉnh sửa item này");
        }
        validateStock(item.getProduct(), quantity);
        validateFlashSaleLimit(item.getProduct().getId(), quantity);
        item.setQuantity(quantity);
        return cartItemRepository.save(item);
    }

    @Transactional
    public void removeFromCart(User user, long cartItemId) {
        CartItem item = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy item trong giỏ hàng"));
        if (item.getUser().getId() != user.getId()) {
            throw new IllegalArgumentException("Không có quyền xóa item này");
        }
        cartItemRepository.delete(item);
    }

    @Transactional
    public void clearCart(User user) {
        cartItemRepository.deleteByUser(user);
    }

    private void validateStock(Product product, int quantity) {
        if (quantity <= 0) {
            throw new IllegalArgumentException("Số lượng phải lớn hơn 0");
        }
        if (product.getQuantity() < quantity) {
            throw new IllegalArgumentException("Sản phẩm '" + product.getName() + "' chỉ còn " + product.getQuantity() + " sản phẩm");
        }
    }

    private void validateFlashSaleLimit(long productId, int requestedQty) {
        Optional<FlashSaleItem> fsiOpt = flashSaleItemRepository.findActiveByProductId(productId, LocalDateTime.now());
        if (fsiOpt.isEmpty()) return;
        FlashSaleItem fsi = fsiOpt.get();
        if (fsi.getQuantityLimit() == null) return;
        long remaining = Math.max(0L, fsi.getQuantityLimit() - fsi.getSoldCount());
        if (requestedQty > remaining) {
            throw new IllegalArgumentException(
                    "Flash sale chỉ còn " + remaining + " suất. Số lượng tối đa có thể mua là " + remaining + " sản phẩm.");
        }
    }
}
