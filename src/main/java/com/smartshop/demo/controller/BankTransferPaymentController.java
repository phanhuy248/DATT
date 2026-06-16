package com.smartshop.demo.controller;

import com.smartshop.demo.domain.User;
import com.smartshop.demo.dto.ApiResponse;
import com.smartshop.demo.dto.payment.BankTransferPaymentInfo;
import com.smartshop.demo.service.BankTransferPaymentService;
import com.smartshop.demo.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/payments/bank-transfer")
public class BankTransferPaymentController {
    private final BankTransferPaymentService bankTransferPaymentService;
    private final UserService userService;

    public BankTransferPaymentController(BankTransferPaymentService bankTransferPaymentService,
                                         UserService userService) {
        this.bankTransferPaymentService = bankTransferPaymentService;
        this.userService = userService;
    }

    @GetMapping("/orders/{orderId}")
    public ResponseEntity<ApiResponse<BankTransferPaymentInfo>> getPaymentInfo(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable long orderId) {
        User user = userService.findByEmail(userDetails.getUsername());
        BankTransferPaymentInfo info = bankTransferPaymentService.getPaymentInfo(orderId, user);
        return ResponseEntity.ok(ApiResponse.ok(info));
    }
}
