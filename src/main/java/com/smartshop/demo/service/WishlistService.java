package com.smartshop.demo.service;

import com.smartshop.demo.domain.Product;
import com.smartshop.demo.domain.User;
import com.smartshop.demo.domain.Wishlist;
import com.smartshop.demo.dto.product.ProductDTO;
import com.smartshop.demo.repository.ProductRepository;
import com.smartshop.demo.repository.UserRepository;
import com.smartshop.demo.repository.WishlistRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
public class WishlistService {

    private final WishlistRepository wishlistRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    public WishlistService(WishlistRepository wishlistRepository,
                           UserRepository userRepository,
                           ProductRepository productRepository) {
        this.wishlistRepository = wishlistRepository;
        this.userRepository = userRepository;
        this.productRepository = productRepository;
    }

    /**
     * Toggle yêu thích: thêm nếu chưa có, xóa nếu đã có.
     *
     * @return true nếu vừa thêm, false nếu vừa xóa
     */
    @Transactional
    public boolean toggle(Long userId, Long productId) {
        Optional<Wishlist> existing = wishlistRepository.findByUserIdAndProductId(userId, productId);
        if (existing.isPresent()) {
            wishlistRepository.delete(existing.get());
            return false;
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy user"));
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy sản phẩm"));
        Wishlist wishlist = new Wishlist();
        wishlist.setUser(user);
        wishlist.setProduct(product);
        wishlistRepository.save(wishlist);
        return true;
    }

    /**
     * Lấy danh sách ProductDTO yêu thích của user (đã set isFavorite = true).
     * Gọi trong @Transactional để tránh LazyInitializationException khi ProductDTO::from truy cập reviews.
     */
    @Transactional(readOnly = true)
    public List<ProductDTO> getWishlistProducts(Long userId) {
        return wishlistRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(Wishlist::getProduct)
                .filter(p -> p != null && !p.isDeleted() && p.isActive())
                .map(p -> {
                    ProductDTO dto = ProductDTO.from(p);
                    dto.setFavorite(true);
                    return dto;
                })
                .toList();
    }

    /**
     * Kiểm tra một sản phẩm có trong wishlist của user không.
     */
    @Transactional(readOnly = true)
    public boolean isProductFavorited(Long userId, Long productId) {
        return wishlistRepository.existsByUserIdAndProductId(userId, productId);
    }

    /**
     * Lấy tập ID sản phẩm yêu thích — dùng để đánh isFavorite nhanh trên danh sách (1 query duy nhất).
     */
    @Transactional(readOnly = true)
    public Set<Long> getFavoriteProductIds(Long userId) {
        return wishlistRepository.findProductIdsByUserId(userId);
    }
}
