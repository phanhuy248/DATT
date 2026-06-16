package com.smartshop.demo.repository;

import com.smartshop.demo.domain.Wishlist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface WishlistRepository extends JpaRepository<Wishlist, Long> {

    Optional<Wishlist> findByUserIdAndProductId(Long userId, Long productId);

    List<Wishlist> findByUserIdOrderByCreatedAtDesc(Long userId);

    boolean existsByUserIdAndProductId(Long userId, Long productId);

    // Lấy tập ID sản phẩm yêu thích của user — dùng để đánh dấu isFavorite trên danh sách sản phẩm
    @Query("SELECT w.product.id FROM Wishlist w WHERE w.user.id = :userId")
    Set<Long> findProductIdsByUserId(@Param("userId") Long userId);

    void deleteByUserIdAndProductId(Long userId, Long productId);
}
