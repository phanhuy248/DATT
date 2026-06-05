package com.example.demo.service;

import com.example.demo.config.VnpayProperties;
import com.example.demo.domain.Order;
import com.example.demo.domain.OrderStatus;
import com.example.demo.domain.PaymentMethod;
import com.example.demo.domain.PaymentStatus;
import com.example.demo.domain.User;
import com.example.demo.dto.payment.VnpayPaymentResponse;
import com.example.demo.dto.payment.VnpayReturnResult;
import com.example.demo.repository.OrderRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.TreeMap;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class VnpayPaymentServiceTest {
    @Mock
    OrderRepository orderRepository;

    @Test
    void createPaymentUrlUsesVnpaySafeOrderInfo() {
        VnpayProperties properties = new VnpayProperties();
        properties.setPayUrl("https://sandbox.vnpayment.vn/paymentv2/vpcpay.html");
        properties.setTmnCode("TESTCODE");
        properties.setHashSecret("0123456789abcdef0123456789abcdef");
        properties.setReturnUrl("http://localhost:8080/api/payments/vnpay/return");

        User user = new User();
        user.setId(7L);

        Order order = new Order();
        order.setId(123L);
        order.setUser(user);
        order.setStatus(OrderStatus.PENDING);
        order.setPaymentMethod(PaymentMethod.VNPAY);
        order.setPaymentStatus(PaymentStatus.PENDING);
        order.setTotalPrice(BigDecimal.valueOf(100000));

        when(orderRepository.findById(123L)).thenReturn(Optional.of(order));

        VnpayPaymentService service = new VnpayPaymentService(properties, orderRepository);
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("::1");

        VnpayPaymentResponse response = service.createPaymentUrl(123L, user, request);

        assertThat(response.getPaymentUrl())
                .contains("vnp_OrderInfo=Thanh+toan+don+hang+SmartShop+123")
                .contains("vnp_IpAddr=127.0.0.1")
                .doesNotContain("%23");
    }

    @Test
    void verifyReturnUpdatesOrderAsPaidWhenVnpayPaymentSucceeds() {
        VnpayProperties properties = new VnpayProperties();
        properties.setPayUrl("https://sandbox.vnpayment.vn/paymentv2/vpcpay.html");
        properties.setTmnCode("TESTCODE");
        properties.setHashSecret("0123456789abcdef0123456789abcdef");
        properties.setReturnUrl("http://localhost:8080/api/payments/vnpay/return");

        Order order = new Order();
        order.setId(123L);
        order.setStatus(OrderStatus.PENDING);
        order.setPaymentMethod(PaymentMethod.VNPAY);
        order.setPaymentStatus(PaymentStatus.PENDING);
        order.setTotalPrice(BigDecimal.valueOf(100000));

        Map<String, String> params = new LinkedHashMap<>();
        params.put("vnp_Amount", "10000000");
        params.put("vnp_BankCode", "NCB");
        params.put("vnp_OrderInfo", "Thanh toan don hang SmartShop 123");
        params.put("vnp_ResponseCode", "00");
        params.put("vnp_TmnCode", "TESTCODE");
        params.put("vnp_TransactionNo", "15568692");
        params.put("vnp_TransactionStatus", "00");
        params.put("vnp_TxnRef", "123");
        params.put("vnp_SecureHash", hmacSha512(properties.getHashSecret(), hashData(params)));

        when(orderRepository.findById(123L)).thenReturn(Optional.of(order));

        VnpayPaymentService service = new VnpayPaymentService(properties, orderRepository);
        VnpayReturnResult result = service.verifyReturn(params);

        assertThat(result.isSuccess()).isTrue();
        assertThat(result.isValidSignature()).isTrue();
        assertThat(order.getPaymentStatus()).isEqualTo(PaymentStatus.PAID);
        assertThat(order.getTransactionCode()).isEqualTo("15568692");
        verify(orderRepository).save(order);
    }

    private String hashData(Map<String, String> params) {
        return new TreeMap<>(params).entrySet().stream()
                .filter(entry -> entry.getValue() != null && !entry.getValue().isBlank())
                .filter(entry -> !"vnp_SecureHash".equals(entry.getKey()))
                .filter(entry -> !"vnp_SecureHashType".equals(entry.getKey()))
                .map(entry -> entry.getKey() + "=" + URLEncoder.encode(entry.getValue(), StandardCharsets.US_ASCII))
                .collect(Collectors.joining("&"));
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
            throw new IllegalStateException(ex);
        }
    }
}
