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
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/dashboard")
@PreAuthorize("hasRole('ADMIN')")
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
        return ResponseEntity.ok(ApiResponse.ok(stats));
    }
}
