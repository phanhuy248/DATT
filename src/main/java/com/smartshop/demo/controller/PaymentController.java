package com.smartshop.demo.controller;

import com.smartshop.demo.domain.User;
import com.smartshop.demo.dto.ApiResponse;
import com.smartshop.demo.dto.payment.VnpayPaymentResponse;
import com.smartshop.demo.dto.payment.VnpayReturnResult;
import com.smartshop.demo.service.UserService;
import com.smartshop.demo.service.VnpayPaymentService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/payments/vnpay")
public class PaymentController {
    private final VnpayPaymentService vnpayPaymentService;
    private final UserService userService;
    private final String frontendUrl;

    public PaymentController(VnpayPaymentService vnpayPaymentService,
                             UserService userService,
                             @Value("${app.frontend.url}") String frontendUrl) {
        this.vnpayPaymentService = vnpayPaymentService;
        this.userService = userService;
        this.frontendUrl = frontendUrl;
    }

    @PostMapping("/orders/{orderId}")
    public ResponseEntity<ApiResponse<VnpayPaymentResponse>> createPaymentUrl(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable long orderId,
            HttpServletRequest request) {
        User user = userService.findByEmail(userDetails.getUsername());
        VnpayPaymentResponse response = vnpayPaymentService.createPaymentUrl(orderId, user, request);
        return ResponseEntity.ok(ApiResponse.ok("Tạo link thanh toán VNPAY thành công", response));
    }

    @GetMapping("/ipn")
    public Map<String, String> ipn(@RequestParam Map<String, String> params) {
        return vnpayPaymentService.processIpn(params);
    }

    @GetMapping("/return")
    public void paymentReturn(@RequestParam Map<String, String> params,
                              HttpServletResponse response) throws IOException {
        String redirectUrl;
        try {
            VnpayReturnResult result = vnpayPaymentService.verifyReturn(params);
            UriComponentsBuilder redirect = UriComponentsBuilder.fromUriString(frontendUrl)
                    .path("/payment/vnpay-return")
                    .queryParam("success", result.isSuccess())
                    .queryParam("validSignature", result.isValidSignature())
                    .queryParam("message", result.getMessage());
            addQueryParam(redirect, "orderId", result.getOrderId());
            addQueryParam(redirect, "responseCode", result.getResponseCode());
            addQueryParam(redirect, "transactionStatus", result.getTransactionStatus());
            addQueryParam(redirect, "transactionNo", result.getTransactionNo());
            addQueryParam(redirect, "txnRef", result.getTxnRef());
            redirectUrl = redirect.build().encode().toUriString();
        } catch (Exception e) {
            redirectUrl = UriComponentsBuilder.fromUriString(frontendUrl)
                    .path("/payment/vnpay-return")
                    .queryParam("success", false)
                    .queryParam("validSignature", false)
                    .queryParam("message", "Lỗi xử lý kết quả thanh toán")
                    .queryParam("responseCode", params.getOrDefault("vnp_ResponseCode", "99"))
                    .build().encode().toUriString();
        }
        response.sendRedirect(redirectUrl);
    }

    private void addQueryParam(UriComponentsBuilder builder, String name, Object value) {
        if (value != null) {
            builder.queryParam(name, value);
        }
    }
}
