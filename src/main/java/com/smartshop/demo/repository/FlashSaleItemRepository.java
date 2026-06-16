package com.smartshop.demo.repository;

import com.smartshop.demo.domain.FlashSaleItem;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface FlashSaleItemRepository extends JpaRepository<FlashSaleItem, Long> {

    /** Danh sách item đang hoạt động — dùng cho API public và trang chủ. */
    @EntityGraph(attributePaths = {"product"})
    @Query("""
            SELECT f FROM FlashSaleItem f
            WHERE f.active = true
              AND f.startAt <= :now
              AND f.endAt > :now
              AND (f.quantityLimit IS NULL OR f.soldCount < f.quantityLimit)
            ORDER BY f.sortOrder ASC, f.startAt DESC
            """)
    List<FlashSaleItem> findActiveItems(@Param("now") LocalDateTime now);

    /**
     * Khóa pessimistic trên các hàng flash sale đang hoạt động cho danh sách productIds.
     * Dùng trong OrderService.placeOrder() — phải nằm trong cùng @Transactional.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT f FROM FlashSaleItem f
            WHERE f.product.id IN :productIds
              AND f.active = true
              AND f.startAt <= :now
              AND f.endAt > :now
            """)
    List<FlashSaleItem> findActiveByProductIdsForUpdate(
            @Param("productIds") List<Long> productIds,
            @Param("now") LocalDateTime now);

    /** Toàn bộ danh sách cho admin (có phân trang). */
    @EntityGraph(attributePaths = {"product"})
    Page<FlashSaleItem> findAllByOrderBySortOrderAscCreatedAtDesc(Pageable pageable);

    /** Kiểm tra sản phẩm đã có bản ghi flash sale chưa (UNIQUE constraint). */
    boolean existsByProductId(Long productId);
}
