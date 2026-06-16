package com.smartshop.demo.service;

import com.smartshop.demo.config.BankTransferProperties;

import com.smartshop.demo.domain.Order;
import com.smartshop.demo.domain.PaymentMethod;
import com.smartshop.demo.domain.User;
import com.smartshop.demo.dto.payment.BankTransferPaymentInfo;
import com.smartshop.demo.exception.ResourceNotFoundException;
import com.smartshop.demo.repository.OrderRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.util.UriComponentsBuilder;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;

@Service
public class BankTransferPaymentService {
    private static final String SEPAY_QR_BASE_URL = "https://qr.sepay.vn/img";

    private final BankTransferProperties properties;
    private final OrderRepository orderRepository;

    public BankTransferPaymentService(BankTransferProperties properties,
                                      OrderRepository orderRepository) {
        this.properties = properties;
        this.orderRepository = orderRepository;
    }

    @Transactional(readOnly = true)
    public BankTransferPaymentInfo getPaymentInfo(long orderId, User user) {
        ensureConfigured();
        Order order = findOwnedBankTransferOrder(orderId, user);
        return toPaymentInfo(order);
    }

    private Order findOwnedBankTransferOrder(long orderId, User user) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng id=" + orderId));
        if (order.getPaymentMethod() != PaymentMethod.BANK_TRANSFER) {
            throw new IllegalStateException("Đơn hàng không sử dụng phương thức chuyển khoản ngân hàng");
        }
        if (order.getUser() == null || order.getUser().getId() != user.getId()) {
            throw new IllegalStateException("Bạn không có quyền xem thanh toán đơn hàng này");
        }
        return order;
    }

    private BankTransferPaymentInfo toPaymentInfo(Order order) {
        return new BankTransferPaymentInfo(
                order.getId(),
                order.getTotalPrice(),
                transferContent(order),
                properties.getBankId(),
                properties.getBankName(),
                properties.getAccountNumber(),
                properties.getAccountName(),
                properties.getBranch(),
                qrImageUrl(order),
                sepayQrUrl(order),
                order.getPaymentStatus() != null ? order.getPaymentStatus().name() : null
        );
    }

    private String qrImageUrl(Order order) {
        String baseUrl = properties.getQrImageBaseUrl();
        if (baseUrl.endsWith("/")) {
            baseUrl = baseUrl.substring(0, baseUrl.length() - 1);
        }
        String path = properties.getBankId() + "-" + properties.getAccountNumber() + "-" + properties.getTemplate() + ".png";
        return UriComponentsBuilder.fromHttpUrl(baseUrl + "/" + path)
                .queryParam("amount", toQrAmount(order.getTotalPrice()))
                .queryParam("addInfo", transferContent(order))
                .queryParam("accountName", properties.getAccountName())
                .build()
                .encode(StandardCharsets.UTF_8)
                .toUriString();
    }

    private String sepayQrUrl(Order order) {
        if (!StringUtils.hasText(properties.getAccountNumber())
                || !StringUtils.hasText(properties.getBankId())) {
            return null;
        }
        return UriComponentsBuilder.fromHttpUrl(SEPAY_QR_BASE_URL)
                .queryParam("acc", properties.getAccountNumber())
                .queryParam("bank", properties.getBankId())
                .queryParam("amount", toQrAmount(order.getTotalPrice()))
                .queryParam("des", transferContent(order))
                .queryParam("template", "compact")
                .build()
                .encode(StandardCharsets.UTF_8)
                .toUriString();
    }

    private String transferContent(Order order) {
        return "DH" + order.getId();
    }

    private String toQrAmount(BigDecimal amount) {
        if (amount == null) return "0";
        return amount.setScale(0, RoundingMode.HALF_UP).toPlainString();
    }

    private void ensureConfigured() {
        if (!StringUtils.hasText(properties.getQrImageBaseUrl())
                || !StringUtils.hasText(properties.getBankId())
                || !StringUtils.hasText(properties.getAccountNumber())
                || !StringUtils.hasText(properties.getAccountName())) {
            throw new IllegalStateException("Chưa cấu hình QR chuyển khoản. Vui lòng thiết lập BANK_TRANSFER_BANK_ID, BANK_TRANSFER_ACCOUNT_NUMBER và BANK_TRANSFER_ACCOUNT_NAME.");
        }
    }
}
