package com.smartshop.demo.controller;

import com.smartshop.demo.config.SepayProperties;
import com.smartshop.demo.dto.payment.SepayWebhookPayload;
import com.smartshop.demo.service.SepayWebhookService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Nhận webhook tự động từ SePay khi có giao dịch chuyển khoản.
 * Endpoint này được gọi bởi SePay (không có JWT), cần được khai báo permitAll trong SecurityConfig.
 */
@RestController
@RequestMapping("/api/payments/sepay")
public class SepayPaymentController {

    private static final Logger log = LoggerFactory.getLogger(SepayPaymentController.class);
    private static final Map<String, Boolean> SUCCESS_RESPONSE = Map.of("success", true);

    private final SepayProperties sepayProperties;
    private final SepayWebhookService sepayWebhookService;

    public SepayPaymentController(SepayProperties sepayProperties,
                                  SepayWebhookService sepayWebhookService) {
        this.sepayProperties = sepayProperties;
        this.sepayWebhookService = sepayWebhookService;
    }

    /**
     * POST /api/payments/sepay/webhook
     *
     * SePay gửi HTTP POST JSON, header: Authorization: Apikey <SEPAY_API_KEY>.
     * Phải trả HTTP 200 + {"success": true} trong vòng 30 giây.
     * Retry theo Fibonacci tối đa 7 lần / 5 giờ nếu không nhận được 200.
     */
    @PostMapping("/webhook")
    public ResponseEntity<Map<String, Boolean>> webhook(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody(required = false) SepayWebhookPayload payload) {

        // Xác thực API Key
        if (!isAuthorized(authHeader)) {
            log.warn("SePay webhook: header Authorization không hợp lệ");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        if (payload == null) {
            log.warn("SePay webhook: payload rỗng");
            return ResponseEntity.ok(SUCCESS_RESPONSE);
        }

        try {
            sepayWebhookService.processWebhook(payload);
        } catch (Exception e) {
            // Log lỗi nhưng vẫn trả 200 để SePay không retry vô ích;
            // admin có thể duyệt tay làm phương án dự phòng.
            log.error("SePay webhook id={}: lỗi xử lý", payload.getId(), e);
        }

        return ResponseEntity.ok(SUCCESS_RESPONSE);
    }

    private boolean isAuthorized(String authHeader) {
        String apiKey = sepayProperties.getApiKey();
        if (!StringUtils.hasText(apiKey)) {
            // API key chưa cấu hình → từ chối mọi request để tránh rủi ro bảo mật
            return false;
        }
        return ("Apikey " + apiKey).equals(authHeader);
    }
}
