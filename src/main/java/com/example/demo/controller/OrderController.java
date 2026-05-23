package com.example.demo.controller;

import com.example.demo.domain.Order;
import com.example.demo.domain.User;
import com.example.demo.dto.ApiResponse;
import com.example.demo.dto.PagedResponse;
import com.example.demo.dto.order.OrderDTO;
import com.example.demo.dto.order.PlaceOrderRequest;
import com.example.demo.service.CartService;
import com.example.demo.service.OrderService;
import com.example.demo.service.UserService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;
    private final UserService userService;
    private final CartService cartService;

    public OrderController(OrderService orderService,
                           UserService userService,
                           CartService cartService) {
        this.orderService = orderService;
        this.userService = userService;
        this.cartService = cartService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<OrderDTO>> placeOrder(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody PlaceOrderRequest req) {
        User user = userService.findByEmail(userDetails.getUsername());
        Order order = orderService.placeOrder(user, req);
        cartService.clearCart(user);
        return ResponseEntity.status(201).body(ApiResponse.ok("Đặt hàng thành công", OrderDTO.from(order)));
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<OrderDTO>>> myOrders(
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.findByEmail(userDetails.getUsername());
        List<OrderDTO> orders = orderService.getOrdersByUser(user)
                .stream().map(OrderDTO::from).toList();
        return ResponseEntity.ok(ApiResponse.ok(orders));
    }

    @GetMapping("/my/{id}")
    public ResponseEntity<ApiResponse<OrderDTO>> myOrderDetail(
            @AuthenticationPrincipal UserDetails userDetails, @PathVariable long id) {
        User user = userService.findByEmail(userDetails.getUsername());
        Order order = orderService.getOrderById(id);
        if (order == null || order.getUser().getId() != user.getId())
            return ResponseEntity.notFound().build();
        return ResponseEntity.ok(ApiResponse.ok(OrderDTO.from(order)));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PagedResponse<OrderDTO>>> getAllOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<OrderDTO> dtoPage = orderService.getAllOrders(
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdDate")));
        return ResponseEntity.ok(ApiResponse.ok(PagedResponse.of(dtoPage)));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<OrderDTO>> updateStatus(@PathVariable long id,
                                                               @RequestBody Map<String, String> body) {
        String status = body.get("status");
        Order order = orderService.updateStatus(id, status);
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật trạng thái thành công", OrderDTO.from(order)));
    }

    @GetMapping("/statuses")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<String>>> getStatuses() {
        return ResponseEntity.ok(ApiResponse.ok(orderService.getAllStatuses()));
    }
}
