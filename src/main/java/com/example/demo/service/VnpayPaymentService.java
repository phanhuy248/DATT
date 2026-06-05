package com.example.demo.service;

import com.example.demo.config.VnpayProperties;
import com.example.demo.domain.Order;
import com.example.demo.domain.OrderStatus;
import com.example.demo.domain.PaymentMethod;
import com.example.demo.domain.PaymentStatus;
import com.example.demo.domain.User;
import com.example.demo.dto.payment.VnpayPaymentResponse;
import com.example.demo.dto.payment.VnpayReturnResult;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.OrderRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

@Service
public class VnpayPaymentService {
    private static final DateTimeFormatter VNPAY_DATE_FORMAT = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
    private static final BigDecimal VNP_AMOUNT_MULTIPLIER = BigDecimal.valueOf(100);

    private final VnpayProperties properties;
    private final OrderRepository orderRepository;

    public VnpayPaymentService(VnpayProperties properties, OrderRepository orderRepository) {
        this.properties = properties;
        this.orderRepository = orderRepository;
    }

    @Transactional(readOnly = true)
    public VnpayPaymentResponse createPaymentUrl(long orderId, User user, HttpServletRequest request) {
        ensureConfigured();
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng id=" + orderId));
        if (order.getUser() == null || order.getUser().getId() != user.getId()) {
            throw new IllegalStateException("Bạn không có quyền thanh toán đơn hàng này");
        }
        if (order.getPaymentMethod() != PaymentMethod.VNPAY) {
            throw new IllegalStateException("Đơn hàng không sử dụng phương thức VNPAY");
        }
        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new IllegalStateException("Đơn hàng đã hủy không thể thanh toán");
        }
        if (order.getPaymentStatus() == PaymentStatus.PAID) {
            throw new IllegalStateException("Đơn hàng đã được thanh toán");
        }
        if (order.getTotalPrice() == null || order.getTotalPrice().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalStateException("Số tiền thanh toán không hợp lệ");
        }

        String txnRef = String.valueOf(order.getId());
        LocalDateTime now = LocalDateTime.now();
        Map<String, String> params = new LinkedHashMap<>();
        params.put("vnp_Version", properties.getVersion());
        params.put("vnp_Command", properties.getCommand());
        params.put("vnp_TmnCode", properties.getTmnCode());
        params.put("vnp_Amount", toVnpAmount(order.getTotalPrice()));
        params.put("vnp_CurrCode", properties.getCurrCode());
        params.put("vnp_TxnRef", txnRef);
        params.put("vnp_OrderInfo", "Thanh toan don hang SmartShop " + order.getId());
        params.put("vnp_OrderType", properties.getOrderType());
        params.put("vnp_Locale", properties.getLocale());
        params.put("vnp_ReturnUrl", properties.getReturnUrl());
        params.put("vnp_IpAddr", clientIp(request));
        params.put("vnp_CreateDate", now.format(VNPAY_DATE_FORMAT));
        params.put("vnp_ExpireDate", now.plusMinutes(Math.max(properties.getExpireMinutes(), 1)).format(VNPAY_DATE_FORMAT));

        String query = buildEncodedQuery(params);
        String secureHash = hmacSha512(properties.getHashSecret(), buildHashData(params));
        String paymentUrl = properties.getPayUrl() + "?" + query + "&vnp_SecureHash=" + secureHash;
        return new VnpayPaymentResponse(order.getId(), order.getTotalPrice(), txnRef, paymentUrl);
    }

    @Transactional
    public VnpayReturnResult verifyReturn(Map<String, String> params) {
        ensureConfigured();
        boolean valid = verifySignature(params);
        String txnRef = params.get("vnp_TxnRef");
        Long orderId = parseOrderId(txnRef);
        String responseCode = params.get("vnp_ResponseCode");
        String transactionStatus = params.get("vnp_TransactionStatus");
        String transactionNo = params.get("vnp_TransactionNo");
        boolean gatewaySuccess = valid && "00".equals(responseCode) && "00".equals(transactionStatus);
        PaymentUpdateResult updateResult = valid
                ? updateOrderPayment(params, gatewaySuccess)
                : new PaymentUpdateResult(false, "Sai chữ ký VNPAY");
        boolean success = gatewaySuccess && updateResult.success();

        return new VnpayReturnResult(
                valid,
                success,
                orderId,
                txnRef,
                responseCode,
                transactionStatus,
                transactionNo,
                updateResult.message()
        );
    }

    @Transactional
    public Map<String, String> processIpn(Map<String, String> params) {
        try {
            ensureConfigured();
            if (!verifySignature(params)) {
                return ipnResponse("97", "Invalid checksum");
            }

            Long orderId = parseOrderId(params.get("vnp_TxnRef"));
            if (orderId == null) {
                return ipnResponse("01", "Order not found");
            }

            Order order = orderRepository.findById(orderId).orElse(null);
            if (order == null) {
                return ipnResponse("01", "Order not found");
            }
            if (!amountMatches(order, params)) {
                return ipnResponse("04", "Invalid amount");
            }
            if (order.getPaymentStatus() == PaymentStatus.PAID) {
                return ipnResponse("02", "Order already confirmed");
            }

            String responseCode = params.get("vnp_ResponseCode");
            String transactionStatus = params.get("vnp_TransactionStatus");
            String transactionNo = params.get("vnp_TransactionNo");
            order.setTransactionCode(transactionNo);
            if ("00".equals(responseCode) && "00".equals(transactionStatus)) {
                order.setPaymentStatus(PaymentStatus.PAID);
            } else {
                order.setPaymentStatus(PaymentStatus.FAILED);
            }
            orderRepository.save(order);
            return ipnResponse("00", "Confirm Success");
        } catch (Exception ex) {
            return ipnResponse("99", "Unknown error");
        }
    }

    private PaymentUpdateResult updateOrderPayment(Map<String, String> params, boolean gatewaySuccess) {
        Long orderId = parseOrderId(params.get("vnp_TxnRef"));
        if (orderId == null) {
            return new PaymentUpdateResult(false, "Không tìm thấy đơn hàng");
        }

        Order order = orderRepository.findById(orderId).orElse(null);
        if (order == null) {
            return new PaymentUpdateResult(false, "Không tìm thấy đơn hàng");
        }
        if (!amountMatches(order, params)) {
            return new PaymentUpdateResult(false, "Số tiền thanh toán không khớp với đơn hàng");
        }

        String transactionNo = params.get("vnp_TransactionNo");
        if (StringUtils.hasText(transactionNo)) {
            order.setTransactionCode(transactionNo);
        }

        if (gatewaySuccess) {
            order.setPaymentStatus(PaymentStatus.PAID);
            orderRepository.save(order);
            return new PaymentUpdateResult(true, "Thanh toán thành công");
        }

        if (order.getPaymentStatus() != PaymentStatus.PAID) {
            order.setPaymentStatus(PaymentStatus.FAILED);
            orderRepository.save(order);
        }
        return new PaymentUpdateResult(false, "Thanh toán không thành công");
    }

    private void ensureConfigured() {
        if (!StringUtils.hasText(properties.getPayUrl())
                || !StringUtils.hasText(properties.getTmnCode())
                || !StringUtils.hasText(properties.getHashSecret())
                || !StringUtils.hasText(properties.getReturnUrl())) {
            throw new IllegalStateException("Chưa cấu hình VNPAY. Vui lòng thiết lập VNPAY_TMN_CODE, VNPAY_HASH_SECRET và VNPAY_RETURN_URL.");
        }
    }

    private boolean verifySignature(Map<String, String> params) {
        String secureHash = params.get("vnp_SecureHash");
        if (!StringUtils.hasText(secureHash)) {
            return false;
        }
        String signed = hmacSha512(properties.getHashSecret(), buildHashData(params));
        return signed.equalsIgnoreCase(secureHash);
    }

    private String buildHashData(Map<String, String> params) {
        return new TreeMap<>(params).entrySet().stream()
                .filter(entry -> StringUtils.hasText(entry.getValue()))
                .filter(entry -> !"vnp_SecureHash".equals(entry.getKey()))
                .filter(entry -> !"vnp_SecureHashType".equals(entry.getKey()))
                .map(entry -> entry.getKey() + "=" + encode(entry.getValue()))
                .collect(Collectors.joining("&"));
    }

    private String buildEncodedQuery(Map<String, String> params) {
        return new TreeMap<>(params).entrySet().stream()
                .filter(entry -> StringUtils.hasText(entry.getValue()))
                .map(entry -> encode(entry.getKey()) + "=" + encode(entry.getValue()))
                .collect(Collectors.joining("&"));
    }

    private String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.US_ASCII);
    }

    private String hmacSha512(String key, String data) {
        try {
            Mac hmac512 = Mac.getInstance("HmacSHA512");
            SecretKeySpec secretKey = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA512");
            hmac512.init(secretKey);
            byte[] bytes = hmac512.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder hash = new StringBuilder(bytes.length * 2);
            for (byte b : bytes) {
                hash.append(String.format(Locale.ROOT, "%02x", b));
            }
            return hash.toString();
        } catch (Exception ex) {
            throw new IllegalStateException("Không thể tạo chữ ký VNPAY", ex);
        }
    }

    private String toVnpAmount(BigDecimal amount) {
        return amount.setScale(0, RoundingMode.HALF_UP)
                .multiply(VNP_AMOUNT_MULTIPLIER)
                .setScale(0, RoundingMode.UNNECESSARY)
                .toPlainString();
    }

    private boolean amountMatches(Order order, Map<String, String> params) {
        return order.getTotalPrice() != null
                && StringUtils.hasText(params.get("vnp_Amount"))
                && toVnpAmount(order.getTotalPrice()).equals(params.get("vnp_Amount"));
    }

    private Long parseOrderId(String txnRef) {
        if (!StringUtils.hasText(txnRef)) return null;
        String rawId = txnRef.split("-", 2)[0];
        try {
            return Long.parseLong(rawId);
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private String clientIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (StringUtils.hasText(forwardedFor)) {
            return normalizeLocalhostIp(forwardedFor.split(",")[0].trim());
        }
        String realIp = request.getHeader("X-Real-IP");
        if (StringUtils.hasText(realIp)) {
            return normalizeLocalhostIp(realIp);
        }
        return normalizeLocalhostIp(request.getRemoteAddr());
    }

    private String normalizeLocalhostIp(String ip) {
        if ("0:0:0:0:0:0:0:1".equals(ip) || "::1".equals(ip)) {
            return "127.0.0.1";
        }
        return ip;
    }

    private Map<String, String> ipnResponse(String code, String message) {
        return Map.of("RspCode", code, "Message", message);
    }

    private record PaymentUpdateResult(boolean success, String message) {
    }
}
