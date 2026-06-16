package com.smartshop.demo.controller;

import com.smartshop.demo.domain.Order;
import com.smartshop.demo.domain.PaymentMethod;
import com.smartshop.demo.domain.User;
import com.smartshop.demo.dto.ApiResponse;
import com.smartshop.demo.dto.PagedResponse;
import com.smartshop.demo.dto.order.OrderDTO;
import com.smartshop.demo.dto.order.PlaceOrderRequest;
import com.smartshop.demo.service.AuditLogService;
import com.smartshop.demo.service.CartService;
import com.smartshop.demo.service.OrderService;
import com.smartshop.demo.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
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
    private final AuditLogService auditLogService;

    public OrderController(OrderService orderService,
                           UserService userService,
                           CartService cartService,
                           AuditLogService auditLogService) {
        this.orderService = orderService;
        this.userService = userService;
        this.cartService = cartService;
        this.auditLogService = auditLogService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<OrderDTO>> placeOrder(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody PlaceOrderRequest req,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey) {
        User user = userService.findByEmail(userDetails.getUsername());
        Order order = orderService.placeOrder(user, req, idempotencyKey);
        // COD: xóa giỏ ngay vì không cần bước thanh toán online.
        // VNPay/BANK_TRANSFER: giỏ được xóa khi payment xác nhận thành công.
        if (order.getPaymentMethod() == PaymentMethod.COD) {
            cartService.clearCart(user);
        }
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

    @PostMapping("/my/{id}/cancel")
    public ResponseEntity<ApiResponse<OrderDTO>> cancelMyOrder(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable long id) {
        User user = userService.findByEmail(userDetails.getUsername());
        Order order = orderService.cancelMyOrder(user, id);
        return ResponseEntity.ok(ApiResponse.ok("Đơn hàng đã được hủy thành công", OrderDTO.from(order)));
    }

    @PutMapping("/my/{id}/payment-method")
    public ResponseEntity<ApiResponse<OrderDTO>> changePaymentMethod(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable long id,
            @RequestBody Map<String, String> body) {
        User user = userService.findByEmail(userDetails.getUsername());
        Order order = orderService.changePaymentMethod(user, id, body.get("method"));
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật phương thức thanh toán thành công", OrderDTO.from(order)));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<ApiResponse<PagedResponse<OrderDTO>>> getAllOrders(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false)    String status,
            @RequestParam(required = false)    String search,
            @RequestParam(required = false)    String dateFrom,
            @RequestParam(required = false)    String dateTo) {
        Page<OrderDTO> dtoPage = orderService.getAllOrders(
                status, search, dateFrom, dateTo,
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdDate")));
        return ResponseEntity.ok(ApiResponse.ok(PagedResponse.of(dtoPage)));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<ApiResponse<OrderDTO>> updateStatus(@PathVariable long id,
                                                               @RequestBody Map<String, String> body,
                                                               @AuthenticationPrincipal UserDetails userDetails,
                                                               HttpServletRequest request) {
        String status = body.get("status");
        String note = body.get("note");
        User changedBy = userService.findByEmail(userDetails.getUsername());
        Order order = orderService.updateStatus(id, status, changedBy, note);
        auditLogService.record(changedBy, "UPDATE_ORDER_STATUS", "Order", id,
                null, "status=" + order.getStatus(), request);
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật trạng thái thành công", OrderDTO.from(order)));
    }

    @GetMapping("/statuses")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<ApiResponse<List<String>>> getStatuses() {
        return ResponseEntity.ok(ApiResponse.ok(orderService.getAllStatuses()));
    }
}
