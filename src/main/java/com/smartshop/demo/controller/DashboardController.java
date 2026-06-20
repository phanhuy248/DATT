package com.smartshop.demo.controller;

import com.smartshop.demo.dto.ApiResponse;
import com.smartshop.demo.dto.order.OrderDTO;
import com.smartshop.demo.dto.product.ProductDTO;
import com.smartshop.demo.service.OrderService;
import com.smartshop.demo.service.ProductService;
import com.smartshop.demo.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
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
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo,
            @RequestParam(defaultValue = "day") String groupBy,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String brand,
            @RequestParam(defaultValue = "30") int days) {
        LocalDate to = LocalDate.now();
        LocalDate from;
        if (dateFrom != null && !dateFrom.isBlank() && dateTo != null && !dateTo.isBlank()) {
            from = LocalDate.parse(dateFrom);
            to   = LocalDate.parse(dateTo);
        } else {
            from = to.minusDays(Math.max(days, 1) - 1L);
        }
        return ResponseEntity.ok(ApiResponse.ok(
                orderService.getRevenueGrouped(from, to, groupBy, categoryId, brand)));
    }

    @GetMapping("/top-products")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<List<?>>> getTopProducts(
            @RequestParam(defaultValue = "5") int limit,
            @RequestParam(required = false) String brand,
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo,
            @RequestParam(required = false) Long categoryId) {
        LocalDate from = (dateFrom != null && !dateFrom.isBlank()) ? LocalDate.parse(dateFrom) : null;
        LocalDate to   = (dateTo   != null && !dateTo.isBlank())   ? LocalDate.parse(dateTo)   : null;
        return ResponseEntity.ok(ApiResponse.ok(
                productService.getTopSellingProductsFiltered(brand, from, to, categoryId, limit)));
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

    @GetMapping("/category-revenue")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getCategoryRevenue(
            @RequestParam(required = false) String brand,
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo,
            @RequestParam(required = false) Long categoryId) {
        LocalDate from = (dateFrom != null && !dateFrom.isBlank()) ? LocalDate.parse(dateFrom) : null;
        LocalDate to   = (dateTo   != null && !dateTo.isBlank())   ? LocalDate.parse(dateTo)   : null;
        return ResponseEntity.ok(ApiResponse.ok(orderService.getCategoryRevenueFiltered(brand, from, to, categoryId)));
    }

    private Map<String, Object> buildOverview() {
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalOrders", orderService.countOrders());
        stats.put("todayOrders", orderService.countTodayOrders());
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
