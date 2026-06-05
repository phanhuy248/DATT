package com.example.demo.controller;

import com.example.demo.dto.ApiResponse;
import com.example.demo.dto.order.OrderDTO;
import com.example.demo.dto.product.ProductDTO;
import com.example.demo.service.OrderService;
import com.example.demo.service.ProductService;
import com.example.demo.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/dashboard")
@PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
public class DashboardController {

    private final OrderService orderService;
    private final ProductService productService;
    private final UserService userService;

    public DashboardController(OrderService orderService,
                               ProductService productService,
                               UserService userService) {
        this.orderService = orderService;
        this.productService = productService;
        this.userService = userService;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDashboard() {
        return ResponseEntity.ok(ApiResponse.ok(buildOverview()));
    }

    @GetMapping("/overview")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<Map<String, Object>>> getOverview() {
        return ResponseEntity.ok(ApiResponse.ok(buildOverview()));
    }

    @GetMapping("/revenue-by-day")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getRevenueByDay(
            @RequestParam(defaultValue = "30") int days) {
        return ResponseEntity.ok(ApiResponse.ok(orderService.getRevenueByDay(days)));
    }

    @GetMapping("/top-products")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<List<ProductDTO>>> getTopProducts(
            @RequestParam(defaultValue = "5") int limit) {
        return ResponseEntity.ok(ApiResponse.ok(productService.getTopSellingProducts(limit)));
    }

    @GetMapping("/order-status-statistics")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getOrderStatusStatistics() {
        return ResponseEntity.ok(ApiResponse.ok(orderService.countOrdersByStatus()));
    }

    @GetMapping("/low-stock-products")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<List<ProductDTO>>> getLowStockProducts(
            @RequestParam(defaultValue = "5") long threshold,
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(ApiResponse.ok(productService.getLowStockProducts(threshold, limit)));
    }

    @GetMapping("/top-customers")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getTopCustomers(
            @RequestParam(defaultValue = "5") int limit) {
        return ResponseEntity.ok(ApiResponse.ok(orderService.getTopCustomers(limit)));
    }

    private Map<String, Object> buildOverview() {
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalOrders", orderService.countOrders());
        stats.put("totalRevenue", orderService.getTotalRevenue());
        stats.put("deliveredRevenue", orderService.getDeliveredRevenue());
        stats.put("totalProducts", productService.countProductsDirect());
        stats.put("lowStockProducts", productService.countLowStockProductsDirect());
        stats.put("totalUsers", userService.countUsers());
        stats.put("ordersByStatus", orderService.countOrdersByStatus());
        stats.put("recentOrders", orderService.getRecentOrders(5).stream()
                .map(OrderDTO::from).collect(Collectors.toList()));
        stats.put("topSellingProducts", productService.getTopSellingProducts(5));
        return stats;
    }
}
