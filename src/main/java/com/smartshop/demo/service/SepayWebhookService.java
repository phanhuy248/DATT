package com.smartshop.demo.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartshop.demo.domain.Order;
import com.smartshop.demo.domain.OrderStatus;
import com.smartshop.demo.domain.PaymentMethod;
import com.smartshop.demo.domain.PaymentStatus;
import com.smartshop.demo.domain.SepayTransaction;
import com.smartshop.demo.dto.payment.SepayWebhookPayload;
import com.smartshop.demo.repository.OrderRepository;
import com.smartshop.demo.repository.SepayTransactionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class SepayWebhookService {

    private static final Logger log = LoggerFactory.getLogger(SepayWebhookService.class);
    private static final Pattern ORDER_ID_PATTERN = Pattern.compile("DH(\\d+)", Pattern.CASE_INSENSITIVE);
    private static final DateTimeFormatter SEPAY_DATE_FORMAT =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final SepayTransactionRepository sepayTransactionRepository;
    private final OrderRepository orderRepository;
    private final OrderService orderService;
    private final CartService cartService;
    private final ObjectMapper objectMapper;

    public SepayWebhookService(SepayTransactionRepository sepayTransactionRepository,
                               OrderRepository orderRepository,
                               OrderService orderService,
                               CartService cartService,
                               ObjectMapper objectMapper) {
        this.sepayTransactionRepository = sepayTransactionRepository;
        this.orderRepository = orderRepository;
        this.orderService = orderService;
        this.cartService = cartService;
        this.objectMapper = objectMapper;
    }

    /**
     * Xử lý webhook từ SePay. Thiết kế idempotent: gọi nhiều lần cùng sepayId không gây hiệu ứng phụ.
     *
     * @return true nếu đã khớp đơn và đánh dấu PAID, false nếu không khớp (nhưng không phải lỗi).
     */
    @Transactional
    public boolean processWebhook(SepayWebhookPayload payload) {
        if (payload.getId() == null) {
            log.warn("SePay webhook thiếu trường id, bỏ qua");
            return false;
        }

        // Chỉ xử lý giao dịch tiền vào
        if (!"in".equalsIgnoreCase(payload.getTransferType())) {
            log.debug("SePay webhook id={} transferType={}, bỏ qua", payload.getId(), payload.getTransferType());
            return false;
        }

        // Idempotency: nếu đã xử lý sepayId này rồi thì trả về sớm
        if (sepayTransactionRepository.existsBySepayId(payload.getId())) {
            log.info("SePay webhook id={} đã được xử lý trước đó, bỏ qua", payload.getId());
            return false;
        }

        boolean matched = false;
        Order matchedOrder = null;

        Long orderId = parseOrderId(payload.getContent());
        if (orderId != null) {
            Order order = orderRepository.findById(orderId).orElse(null);
            if (order != null
                    && order.getPaymentMethod() == PaymentMethod.BANK_TRANSFER
                    && order.getStatus() != OrderStatus.CANCELLED) {

                if (order.getPaymentStatus() == PaymentStatus.PAID) {
                    // Đơn đã PAID (ví dụ admin duyệt tay trước) — ghi nhận nhưng không thay đổi
                    log.info("SePay webhook id={}: đơn {} đã PAID sẵn, bỏ qua cập nhật", payload.getId(), orderId);
                    matched = true;
                    matchedOrder = order;
                } else if (amountSufficient(payload.getTransferAmount(), order.getTotalPrice())) {
                    // Số tiền đủ → đánh dấu PAID và chuyển sang CONFIRMED
                    String txCode = StringUtils.hasText(payload.getReferenceCode())
                            ? payload.getReferenceCode()
                            : "SEPAY-" + payload.getId();
                    order.setPaymentStatus(PaymentStatus.PAID);
                    order.setTransactionCode(txCode);
                    orderRepository.save(order);
                    if (order.getUser() != null) {
                        cartService.clearCart(order.getUser());
                    }

                    if (order.getStatus() == OrderStatus.PENDING) {
                        orderService.updateStatus(orderId, OrderStatus.CONFIRMED.name(), null,
                                "Tự động xác nhận qua SePay webhook id=" + payload.getId());
                    }

                    matched = true;
                    matchedOrder = order;
                    log.info("SePay webhook id={}: đơn {} -> PAID+CONFIRMED, txCode={}", payload.getId(), orderId, txCode);
                } else {
                    log.warn("SePay webhook id={}: số tiền {} < yêu cầu {} cho đơn {}, không đánh dấu PAID",
                            payload.getId(), payload.getTransferAmount(), order.getTotalPrice(), orderId);
                    matchedOrder = order;
                }
            } else {
                log.warn("SePay webhook id={}: không tìm thấy đơn BANK_TRANSFER id={}", payload.getId(), orderId);
            }
        } else {
            log.warn("SePay webhook id={}: không parse được mã đơn từ content='{}'", payload.getId(), payload.getContent());
        }

        // Luôn lưu bản ghi giao dịch (kể cả khi không khớp) để admin tra cứu
        saveSepayTransaction(payload, matchedOrder, matched);
        return matched;
    }

    private void saveSepayTransaction(SepayWebhookPayload payload, Order order, boolean matched) {
        SepayTransaction tx = new SepayTransaction();
        tx.setSepayId(payload.getId());
        tx.setOrder(order);
        tx.setGateway(payload.getGateway());
        tx.setAccountNumber(payload.getAccountNumber());
        tx.setTransferAmount(payload.getTransferAmount() != null ? payload.getTransferAmount() : BigDecimal.ZERO);
        tx.setContent(payload.getContent());
        tx.setReferenceCode(payload.getReferenceCode());
        tx.setTransactionDate(parseTransactionDate(payload.getTransactionDate()));
        tx.setRawPayload(toJson(payload));
        tx.setMatched(matched);
        try {
            sepayTransactionRepository.save(tx);
        } catch (DataIntegrityViolationException e) {
            // Trường hợp hiếm gặp: hai request đồng thời vượt qua existsBySepayId
            // UNIQUE constraint ngăn trùng — bỏ qua an toàn
            log.info("SePay webhook id={} bị trùng lặp đồng thời, bỏ qua", payload.getId());
        }
    }

    /** Parse mã đơn hàng từ nội dung chuyển khoản, ví dụ "DH123" hoặc "Thanh toan DH123". */
    private Long parseOrderId(String content) {
        if (!StringUtils.hasText(content)) return null;
        Matcher m = ORDER_ID_PATTERN.matcher(content);
        if (m.find()) {
            try {
                return Long.parseLong(m.group(1));
            } catch (NumberFormatException ignored) {
            }
        }
        return null;
    }

    private boolean amountSufficient(BigDecimal transferred, BigDecimal required) {
        if (transferred == null || required == null) return false;
        return transferred.compareTo(required) >= 0;
    }

    private LocalDateTime parseTransactionDate(String raw) {
        if (!StringUtils.hasText(raw)) return null;
        try {
            return LocalDateTime.parse(raw, SEPAY_DATE_FORMAT);
        } catch (DateTimeParseException e) {
            log.debug("Không parse được transactionDate: {}", raw);
            return null;
        }
    }

    private String toJson(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (JsonProcessingException e) {
            return "{}";
        }
    }
}
