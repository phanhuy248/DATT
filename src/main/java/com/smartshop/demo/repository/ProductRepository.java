package com.smartshop.demo.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import jakarta.persistence.LockModeType;

import com.smartshop.demo.domain.Category;
import com.smartshop.demo.domain.Product;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {
    long countByDeletedFalse();

    Page<Product> findByNameContainingIgnoreCaseOrFactoryContainingIgnoreCase(
            String name, String factory, Pageable pageable);

    @Query("SELECT p FROM Product p WHERE (p.deleted = false OR p.deleted IS NULL) ORDER BY p.sold DESC")
    List<Product> findTopSellingProducts(Pageable pageable);

    @Query("""
            SELECT p FROM Product p
            LEFT JOIN p.category c
            WHERE (p.deleted = false OR p.deleted IS NULL)
              AND (
                LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(COALESCE(p.factory, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(COALESCE(p.shortDesc, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(COALESCE(c.name, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))
              )
            ORDER BY p.sold DESC, p.id DESC
            """)
    List<Product> searchForChat(String keyword, Pageable pageable);

    @Query("SELECT COUNT(p) FROM Product p WHERE (p.deleted = false OR p.deleted IS NULL) AND p.quantity > 0 AND p.quantity <= 10")
    long countLowStockProducts();

    @Query("SELECT p FROM Product p WHERE (p.deleted = false OR p.deleted IS NULL) AND p.quantity <= :threshold ORDER BY p.quantity ASC")
    List<Product> findLowStockProducts(long threshold, Pageable pageable);

    // Related products: cùng category, loại trừ sản phẩm hiện tại, sort theo sold
    @Query("SELECT p FROM Product p WHERE (p.deleted = false OR p.deleted IS NULL) AND p.category.id = :categoryId AND p.id <> :excludeId ORDER BY p.sold DESC")
    List<Product> findRelatedProducts(long categoryId, long excludeId, Pageable pageable);

    // Personalized: sản phẩm thuộc các category user hay xem nhất
    @Query("SELECT p FROM Product p WHERE (p.deleted = false OR p.deleted IS NULL) AND p.category.id IN :categoryIds AND p.id NOT IN :excludeIds ORDER BY p.sold DESC")
    List<Product> findRecommendedProducts(List<Long> categoryIds, List<Long> excludeIds, Pageable pageable);

    List<Product> findByCategoryAndDeletedFalse(Category category);

    Optional<Product> findBySourceSiteIgnoreCaseAndSourceUrl(String sourceSite, String sourceUrl);

    Optional<Product> findFirstByNameIgnoreCaseAndDeletedFalse(String name);

    List<Product> findBySourceSiteIgnoreCaseAndDeletedFalse(String sourceSite);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Product p WHERE p.id IN :ids AND (p.deleted = false OR p.deleted IS NULL)")
    List<Product> findAllByIdForUpdate(List<Long> ids);

    /**
     * Cập nhật tồn kho trực tiếp bằng native SQL, an toàn kể cả khi version = NULL.
     * COALESCE(version, 0) + 1 đảm bảo version luôn tăng đúng sau update.
     */
    @org.springframework.data.jpa.repository.Modifying(clearAutomatically = true)
    @Query(value = "UPDATE products SET quantity = :qty, sold = :sold, version = COALESCE(version, 0) + 1 WHERE id = :id",
           nativeQuery = true)
    void updateStockById(@org.springframework.data.repository.query.Param("id")  Long id,
                         @org.springframework.data.repository.query.Param("qty") long qty,
                         @org.springframework.data.repository.query.Param("sold") long sold);

    @Query(nativeQuery = true, value = """
            SELECT p.id,
                   p.name,
                   p.price,
                   p.image,
                   p.factory,
                   c.name AS category_name,
                   COALESCE(SUM(od.quantity), 0) AS sold_count
            FROM products p
            LEFT JOIN categories c ON c.id = p.category_id
            LEFT JOIN order_details od ON od.product_id = p.id
            LEFT JOIN orders o ON o.id = od.order_id
                AND o.status = 'COMPLETED'
                AND (:dateFrom IS NULL OR o.created_date >= :dateFrom)
                AND (:dateTo   IS NULL OR o.created_date <= :dateTo)
            WHERE (p.deleted = false OR p.deleted IS NULL)
              AND (:categoryId IS NULL OR p.category_id = :categoryId)
              AND (:brand IS NULL OR LOWER(p.factory) LIKE LOWER(CONCAT('%', :brand, '%')))
              AND (od.id IS NULL OR o.id IS NOT NULL)
            GROUP BY p.id, p.name, p.price, p.image, p.factory, c.name
            ORDER BY sold_count DESC
            LIMIT 20
            """)
    List<Object[]> findTopSellingProductsFiltered(
            @Param("brand")      String brand,
            @Param("dateFrom")   LocalDateTime dateFrom,
            @Param("dateTo")     LocalDateTime dateTo,
            @Param("categoryId") Long categoryId);
}
