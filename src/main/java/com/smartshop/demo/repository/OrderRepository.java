package com.smartshop.demo.repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.smartshop.demo.domain.Order;
import com.smartshop.demo.domain.OrderStatus;
import com.smartshop.demo.domain.PaymentMethod;
import com.smartshop.demo.domain.PaymentStatus;
import com.smartshop.demo.domain.User;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    /**
     * Tải kèm orderDetails, product, và user trong một query để tránh LazyInitializationException.
     * Dùng khi open-in-view=false (như trong application.properties).
     * EntityGraph FETCH type làm cho user (không khai báo) trở thành LAZY,
     * nên phải khai báo rõ ràng để tránh lỗi khi OrderDTO.from() truy cập user ngoài transaction.
     */
    @EntityGraph(attributePaths = {"orderDetails", "orderDetails.product", "user"})
    Optional<Order> findWithDetailsById(Long id);

    @EntityGraph(attributePaths = {"orderDetails", "orderDetails.product"})
    List<Order> findByUser(User user);

    /** Tóm tắt đơn hàng (không JOIN orderDetails) — nhẹ hơn cho danh sách phía client. */
    @Query("SELECT o FROM Order o WHERE o.user = :user ORDER BY o.createdDate DESC")
    List<Order> findSummariesByUser(@Param("user") User user);

    /**
     * Batch-load details cho một tập Order IDs vào 1st-level cache.
     * Gọi trước khi map sang DTO để tránh N+1 trên trang phân trang admin.
     */
    @EntityGraph(attributePaths = {"orderDetails", "orderDetails.product", "user"})
    @Query("SELECT DISTINCT o FROM Order o WHERE o.id IN :ids")
    List<Order> findWithDetailsByIds(@Param("ids") List<Long> ids);

    @EntityGraph(attributePaths = {"orderDetails", "orderDetails.product", "user"})
    @Query("SELECT o FROM Order o ORDER BY o.createdDate DESC")
    List<Order> findAllByOrderByCreatedDateDesc();

    @Query("""
            SELECT o FROM Order o
            WHERE (:status IS NULL OR o.status = :status)
            AND (:userId IS NULL OR o.user.id = :userId)
            AND (:search IS NULL
                 OR LOWER(o.receiverName) LIKE LOWER(CONCAT('%', :search, '%'))
                 OR o.receiverPhone LIKE CONCAT('%', :search, '%'))
            AND (:dateFrom IS NULL OR o.createdDate >= :dateFrom)
            AND (:dateTo   IS NULL OR o.createdDate <= :dateTo)
            """)
    Page<Order> findWithFilters(
            @Param("status")   OrderStatus status,
            @Param("userId")   Long userId,
            @Param("search")   String search,
            @Param("dateFrom") java.time.LocalDateTime dateFrom,
            @Param("dateTo")   java.time.LocalDateTime dateTo,
            Pageable pageable);

    @EntityGraph(attributePaths = {"orderDetails", "orderDetails.product"})
    List<Order> findByPaymentMethodAndPaymentStatusOrderByCreatedDateDesc(PaymentMethod paymentMethod, PaymentStatus paymentStatus);

    /** Đơn PENDING_PAYMENT (VNPAY hoặc BANK_TRANSFER) quá hạn 5 phút — dùng cho auto-cancel scheduler. */
    @EntityGraph(attributePaths = {"orderDetails", "orderDetails.product"})
    @Query("""
            SELECT o FROM Order o
            WHERE o.status = com.smartshop.demo.domain.OrderStatus.PENDING_PAYMENT
              AND o.paymentMethod IN :methods
              AND o.createdDate < :cutoff
            """)
    List<Order> findExpiredPendingPaymentOrders(
            @Param("methods") List<PaymentMethod> methods,
            @Param("cutoff") LocalDateTime cutoff);

    /** Kiểm tra user đã có đơn PENDING_PAYMENT chưa — tránh tạo duplicate. */
    @Query("""
            SELECT COUNT(o) > 0 FROM Order o
            WHERE o.user = :user
              AND o.status = com.smartshop.demo.domain.OrderStatus.PENDING_PAYMENT
            """)
    boolean existsPendingPaymentByUser(@Param("user") User user);

    /** Legacy: giữ lại để tương thích với code cũ nếu còn tham chiếu. */
    @EntityGraph(attributePaths = {"orderDetails", "orderDetails.product"})
    @Query("""
            SELECT o FROM Order o
            WHERE o.status = com.smartshop.demo.domain.OrderStatus.PENDING
              AND o.paymentMethod = :paymentMethod
              AND o.paymentStatus = :paymentStatus
              AND o.createdDate < :cutoff
            """)
    List<Order> findExpiredPendingPaymentOrdersLegacy(
            @Param("paymentMethod") PaymentMethod paymentMethod,
            @Param("paymentStatus") PaymentStatus paymentStatus,
            @Param("cutoff") LocalDateTime cutoff);

    @EntityGraph(attributePaths = {"orderDetails", "orderDetails.product"})
    @Query("""
            SELECT o FROM Order o
            WHERE o.status = com.smartshop.demo.domain.OrderStatus.PENDING
              AND o.paymentMethod = :paymentMethod
              AND o.paymentStatus IN :paymentStatuses
              AND o.createdDate < :cutoff
            """)
    List<Order> findExpiredUnpaidOrders(
            @Param("paymentMethod") PaymentMethod paymentMethod,
            @Param("paymentStatuses") List<PaymentStatus> paymentStatuses,
            @Param("cutoff") LocalDateTime cutoff);

    long countByStatus(OrderStatus status);

    // Dùng od.price * od.quantity (giá sản phẩm) để đồng nhất với findCategoryRevenue()
    @Query("""
            SELECT COALESCE(SUM(od.price * od.quantity), 0)
            FROM OrderDetail od
            WHERE od.order.status <> com.smartshop.demo.domain.OrderStatus.CANCELLED
            """)
    BigDecimal getTotalRevenue();

    @Query("""
            SELECT COALESCE(SUM(od.price * od.quantity), 0)
            FROM OrderDetail od
            WHERE od.order.status = com.smartshop.demo.domain.OrderStatus.COMPLETED
            """)
    BigDecimal getDeliveredRevenue();

    @EntityGraph(attributePaths = {"orderDetails", "orderDetails.product", "user"})
    @Query("SELECT o FROM Order o ORDER BY o.createdDate DESC")
    List<Order> findRecentOrders(Pageable pageable);

    @Query("""
            SELECT COUNT(od) > 0
            FROM OrderDetail od
            WHERE od.order.user = :user
              AND od.product.id = :productId
              AND od.order.status = com.smartshop.demo.domain.OrderStatus.COMPLETED
            """)
    boolean existsDeliveredOrderContainingProduct(User user, long productId);

    @Query("SELECT COUNT(o) FROM Order o WHERE o.createdDate >= :from AND o.createdDate <= :to")
    long countCreatedBetween(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    // ── Aggregate queries cho Dashboard (thay thế findAll() + in-memory stream) ──

    @Query("""
            SELECT CAST(od.order.createdDate AS localdate), COALESCE(SUM(od.price * od.quantity), 0)
            FROM OrderDetail od
            WHERE od.order.status = com.smartshop.demo.domain.OrderStatus.COMPLETED
              AND od.order.createdDate >= :since
            GROUP BY CAST(od.order.createdDate AS localdate)
            ORDER BY CAST(od.order.createdDate AS localdate)
            """)
    List<Object[]> findDailyRevenueSince(@Param("since") java.time.LocalDateTime since);

    // ── Dashboard chart queries với filter category + brand ──────────────────

    @Query(nativeQuery = true, value = """
            SELECT DATE(o.created_date) AS period,
                   COALESCE(SUM(od.price * od.quantity), 0) AS revenue,
                   COUNT(DISTINCT o.id) AS orders_count
            FROM orders o
            JOIN order_details od ON od.order_id = o.id
            LEFT JOIN products p ON p.id = od.product_id
            LEFT JOIN categories c ON c.id = p.category_id
            WHERE o.status = 'COMPLETED'
              AND o.created_date BETWEEN :dateFrom AND :dateTo
              AND (:categoryId IS NULL OR c.id = :categoryId)
              AND (:brand IS NULL OR LOWER(p.factory) LIKE LOWER(CONCAT('%', :brand, '%')))
            GROUP BY DATE(o.created_date)
            ORDER BY DATE(o.created_date)
            """)
    List<Object[]> findRevenueGroupedByDay(
            @Param("dateFrom") java.time.LocalDateTime dateFrom,
            @Param("dateTo")   java.time.LocalDateTime dateTo,
            @Param("categoryId") Long categoryId,
            @Param("brand") String brand);

    @Query(nativeQuery = true, value = """
            SELECT DATE_FORMAT(MIN(o.created_date), '%Y-W%v') AS period,
                   COALESCE(SUM(od.price * od.quantity), 0) AS revenue,
                   COUNT(DISTINCT o.id) AS orders_count
            FROM orders o
            JOIN order_details od ON od.order_id = o.id
            LEFT JOIN products p ON p.id = od.product_id
            LEFT JOIN categories c ON c.id = p.category_id
            WHERE o.status = 'COMPLETED'
              AND o.created_date BETWEEN :dateFrom AND :dateTo
              AND (:categoryId IS NULL OR c.id = :categoryId)
              AND (:brand IS NULL OR LOWER(p.factory) LIKE LOWER(CONCAT('%', :brand, '%')))
            GROUP BY YEARWEEK(o.created_date, 1)
            ORDER BY MIN(o.created_date)
            """)
    List<Object[]> findRevenueGroupedByWeek(
            @Param("dateFrom") java.time.LocalDateTime dateFrom,
            @Param("dateTo")   java.time.LocalDateTime dateTo,
            @Param("categoryId") Long categoryId,
            @Param("brand") String brand);

    @Query(nativeQuery = true, value = """
            SELECT DATE_FORMAT(o.created_date, '%Y-%m') AS period,
                   COALESCE(SUM(od.price * od.quantity), 0) AS revenue,
                   COUNT(DISTINCT o.id) AS orders_count
            FROM orders o
            JOIN order_details od ON od.order_id = o.id
            LEFT JOIN products p ON p.id = od.product_id
            LEFT JOIN categories c ON c.id = p.category_id
            WHERE o.status = 'COMPLETED'
              AND o.created_date BETWEEN :dateFrom AND :dateTo
              AND (:categoryId IS NULL OR c.id = :categoryId)
              AND (:brand IS NULL OR LOWER(p.factory) LIKE LOWER(CONCAT('%', :brand, '%')))
            GROUP BY DATE_FORMAT(o.created_date, '%Y-%m')
            ORDER BY DATE_FORMAT(o.created_date, '%Y-%m')
            """)
    List<Object[]> findRevenueGroupedByMonth(
            @Param("dateFrom") java.time.LocalDateTime dateFrom,
            @Param("dateTo")   java.time.LocalDateTime dateTo,
            @Param("categoryId") Long categoryId,
            @Param("brand") String brand);

    @Query(nativeQuery = true, value = """
            SELECT c.name AS category,
                   COALESCE(SUM(od.price * od.quantity), 0) AS revenue
            FROM categories c
            LEFT JOIN products p ON p.category_id = c.id
                AND (p.deleted = false OR p.deleted IS NULL)
                AND LOWER(p.factory) LIKE LOWER(CONCAT('%', :brand, '%'))
            LEFT JOIN order_details od ON od.product_id = p.id
            LEFT JOIN orders o ON o.id = od.order_id AND o.status = 'COMPLETED'
            WHERE c.deleted = false
              AND (od.id IS NULL OR o.id IS NOT NULL)
            GROUP BY c.id, c.name
            ORDER BY revenue DESC
            """)
    List<Object[]> findCategoryRevenueByBrand(@Param("brand") String brand);

    @Query(nativeQuery = true, value = """
            SELECT c.name AS category,
                   COALESCE(SUM(od.price * od.quantity), 0) AS revenue
            FROM categories c
            LEFT JOIN products p ON p.category_id = c.id
                AND (p.deleted = false OR p.deleted IS NULL)
                AND (:brand IS NULL OR LOWER(p.factory) LIKE LOWER(CONCAT('%', :brand, '%')))
            LEFT JOIN order_details od ON od.product_id = p.id
            LEFT JOIN orders o ON o.id = od.order_id
                AND o.status = 'COMPLETED'
                AND (:dateFrom IS NULL OR o.created_date >= :dateFrom)
                AND (:dateTo   IS NULL OR o.created_date <= :dateTo)
            WHERE c.deleted = false
              AND (:categoryId IS NULL OR c.id = :categoryId)
              AND (od.id IS NULL OR o.id IS NOT NULL)
            GROUP BY c.id, c.name
            ORDER BY revenue DESC
            """)
    List<Object[]> findCategoryRevenueFiltered(
            @Param("brand")       String brand,
            @Param("dateFrom")    LocalDateTime dateFrom,
            @Param("dateTo")      LocalDateTime dateTo,
            @Param("categoryId")  Long categoryId);

    @Query("""
            SELECT o.user.id, o.user.email, o.user.fullName, COALESCE(SUM(o.totalPrice), 0), COUNT(o.id)
            FROM Order o
            WHERE o.user IS NOT NULL
              AND o.status = com.smartshop.demo.domain.OrderStatus.COMPLETED
            GROUP BY o.user.id, o.user.email, o.user.fullName
            ORDER BY SUM(o.totalPrice) DESC
            """)
    List<Object[]> findTopCustomers(Pageable pageable);

    @Query(nativeQuery = true, value = """
            SELECT c.name AS category,
                   COALESCE(SUM(od.price * od.quantity), 0) AS revenue
            FROM categories c
            LEFT JOIN products p ON p.category_id = c.id
                AND (p.deleted = false OR p.deleted IS NULL)
            LEFT JOIN order_details od ON od.product_id = p.id
            LEFT JOIN orders o ON o.id = od.order_id AND o.status = 'COMPLETED'
            WHERE c.deleted = false
              AND (od.id IS NULL OR o.id IS NOT NULL)
            GROUP BY c.id, c.name
            ORDER BY revenue DESC
            """)
    List<Object[]> findCategoryRevenue();
}
