package com.example.demo.controller;

import com.example.demo.domain.Order;
import com.example.demo.domain.User;
import com.example.demo.dto.ApiResponse;
import com.example.demo.dto.order.OrderDTO;
import com.example.demo.dto.payment.BankTransferPaymentInfo;
import com.example.demo.service.AuditLogService;
import com.example.demo.service.BankTransferPaymentService;
import com.example.demo.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/payments/bank-transfer")
public class BankTransferPaymentController {
    private final BankTransferPaymentService bankTransferPaymentService;
    private final UserService userService;
    private final AuditLogService auditLogService;

    public BankTransferPaymentController(BankTransferPaymentService bankTransferPaymentService,
                                         UserService userService,
                                         AuditLogService auditLogService) {
        this.bankTransferPaymentService = bankTransferPaymentService;
        this.userService = userService;
        this.auditLogService = auditLogService;
    }

    @GetMapping("/orders/{orderId}")
    public ResponseEntity<ApiResponse<BankTransferPaymentInfo>> getPaymentInfo(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable long orderId) {
        User user = userService.findByEmail(userDetails.getUsername());
        BankTransferPaymentInfo info = bankTransferPaymentService.getPaymentInfo(orderId, user);
        return ResponseEntity.ok(ApiResponse.ok(info));
    }

    @PostMapping("/orders/{orderId}/customer-confirm")
    public ResponseEntity<ApiResponse<BankTransferPaymentInfo>> customerConfirmTransferred(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable long orderId) {
        User user = userService.findByEmail(userDetails.getUsername());
        BankTransferPaymentInfo info = bankTransferPaymentService.confirmCustomerTransferred(orderId, user);
        return ResponseEntity.ok(ApiResponse.ok("Đã ghi nhận yêu cầu xác nhận chuyển khoản", info));
    }

    @GetMapping("/pending")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<ApiResponse<List<OrderDTO>>> pendingBankTransferOrders() {
        List<OrderDTO> orders = bankTransferPaymentService.getPendingBankTransferOrders()
                .stream()
                .map(OrderDTO::from)
                .toList();
        return ResponseEntity.ok(ApiResponse.ok(orders));
    }

    @PostMapping("/orders/{orderId}/approve")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<ApiResponse<OrderDTO>> approve(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable long orderId,
            HttpServletRequest request) {
        User admin = userService.findByEmail(userDetails.getUsername());
        Order order = bankTransferPaymentService.approve(orderId);
        auditLogService.record(admin, "APPROVE_BANK_TRANSFER", "Order", orderId,
                null, "paymentStatus=PAID", request);
        return ResponseEntity.ok(ApiResponse.ok("Đã xác nhận nhận tiền chuyển khoản", OrderDTO.from(order)));
    }

    @PostMapping("/orders/{orderId}/reject")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<ApiResponse<OrderDTO>> reject(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable long orderId,
            @RequestBody(required = false) Map<String, String> body,
            HttpServletRequest request) {
        User admin = userService.findByEmail(userDetails.getUsername());
        String note = body != null ? body.get("note") : null;
        Order order = bankTransferPaymentService.reject(orderId, admin, note);
        auditLogService.record(admin, "REJECT_BANK_TRANSFER", "Order", orderId,
                null, "status=CANCELLED,paymentStatus=FAILED", request);
        return ResponseEntity.ok(ApiResponse.ok("Đã từ chối chuyển khoản và hủy đơn hàng", OrderDTO.from(order)));
    }
}
