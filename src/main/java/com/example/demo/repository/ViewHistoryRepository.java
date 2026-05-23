package com.example.demo.repository;

import com.example.demo.domain.ViewHistory;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ViewHistoryRepository extends JpaRepository<ViewHistory, Long> {

    Optional<ViewHistory> findByUserIdAndProductId(long userId, long productId);

    // Top category IDs từ lịch sử xem của user (30 ngày gần nhất)
    @Query("""
            SELECT p.category.id FROM ViewHistory vh
            JOIN vh.product p
            WHERE vh.user.id = :userId
              AND vh.viewedAt >= CURRENT_TIMESTAMP - 30 DAY
              AND p.category IS NOT NULL
            GROUP BY p.category.id
            ORDER BY COUNT(vh.id) DESC
            """)
    List<Long> findTopCategoryIdsByUserId(long userId);

    boolean existsByUserIdAndProductId(long userId, long productId);

    @Query("SELECT vh.product.id FROM ViewHistory vh WHERE vh.user.id = :userId ORDER BY vh.viewedAt DESC")
    List<Long> findRecentlyViewedProductIds(long userId, Pageable pageable);

    @Modifying
    @Query("DELETE FROM ViewHistory vh WHERE vh.user.id = :userId AND vh.product.id = :productId")
    void deleteByUserIdAndProductId(long userId, long productId);
}
