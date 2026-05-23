package com.example.demo.repository;

import java.util.List;
import java.util.Optional;
import java.math.BigDecimal;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.example.demo.domain.Order;
import com.example.demo.domain.OrderStatus;
import com.example.demo.domain.User;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    /**
     * Tải kèm orderDetails và product trong một query để tránh LazyInitializationException.
     * Dùng khi open-in-view=false (như trong application.properties).
     */
    @EntityGraph(attributePaths = {"orderDetails", "orderDetails.product"})
    Optional<Order> findWithDetailsById(Long id);

    @EntityGraph(attributePaths = {"orderDetails", "orderDetails.product"})
    List<Order> findByUser(User user);

    @EntityGraph(attributePaths = {"orderDetails", "orderDetails.product"})
    @Query("SELECT o FROM Order o ORDER BY o.createdDate DESC")
    List<Order> findAllByOrderByCreatedDateDesc();

    long countByStatus(OrderStatus status);

    @Query("SELECT COALESCE(SUM(o.totalPrice), 0) FROM Order o WHERE o.status <> com.example.demo.domain.OrderStatus.CANCELLED")
    BigDecimal getTotalRevenue();

    @Query("SELECT COALESCE(SUM(o.totalPrice), 0) FROM Order o WHERE o.status = com.example.demo.domain.OrderStatus.DELIVERED")
    BigDecimal getDeliveredRevenue();

    @EntityGraph(attributePaths = {"orderDetails", "orderDetails.product"})
    @Query("SELECT o FROM Order o ORDER BY o.createdDate DESC")
    List<Order> findRecentOrders(Pageable pageable);

    @Query("""
            SELECT COUNT(od) > 0
            FROM OrderDetail od
            WHERE od.order.user = :user
              AND od.product.id = :productId
              AND od.order.status = com.example.demo.domain.OrderStatus.DELIVERED
            """)
    boolean existsDeliveredOrderContainingProduct(User user, long productId);
}
