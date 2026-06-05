package com.example.demo.service;

import com.example.demo.config.BankTransferProperties;
import com.example.demo.domain.Order;
import com.example.demo.domain.OrderStatus;
import com.example.demo.domain.PaymentMethod;
import com.example.demo.domain.PaymentStatus;
import com.example.demo.domain.User;
import com.example.demo.dto.payment.BankTransferPaymentInfo;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.OrderRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.util.UriComponentsBuilder;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.util.List;

@Service
public class BankTransferPaymentService {
    private final BankTransferProperties properties;
    private final OrderRepository orderRepository;
    private final OrderService orderService;

    public BankTransferPaymentService(BankTransferProperties properties,
                                      OrderRepository orderRepository,
                                      OrderService orderService) {
        this.properties = properties;
        this.orderRepository = orderRepository;
        this.orderService = orderService;
    }

    @Transactional(readOnly = true)
    public BankTransferPaymentInfo getPaymentInfo(long orderId, User user) {
        ensureConfigured();
        Order order = findOwnedBankTransferOrder(orderId, user);
        return toPaymentInfo(order);
    }

    @Transactional
    public BankTransferPaymentInfo confirmCustomerTransferred(long orderId, User user) {
        ensureConfigured();
        Order order = findOwnedBankTransferOrder(orderId, user);
        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new IllegalStateException("Đơn hàng đã hủy không thể xác nhận chuyển khoản");
        }
        if (order.getPaymentStatus() == PaymentStatus.PAID) {
            return toPaymentInfo(order);
        }
        order.setPaymentStatus(PaymentStatus.PENDING);
        orderRepository.save(order);
        return toPaymentInfo(order);
    }

    @Transactional(readOnly = true)
    public List<Order> getPendingBankTransferOrders() {
        return orderRepository.findByPaymentMethodAndPaymentStatusOrderByCreatedDateDesc(
                PaymentMethod.BANK_TRANSFER,
                PaymentStatus.PENDING
        );
    }

    @Transactional
    public Order approve(long orderId) {
        Order order = findBankTransferOrder(orderId);
        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new IllegalStateException("Đơn hàng đã hủy không thể xác nhận thanh toán");
        }
        if (order.getPaymentStatus() == PaymentStatus.PAID) {
            return orderRepository.findWithDetailsById(orderId).orElse(order);
        }
        if (order.getPaymentStatus() != PaymentStatus.PENDING) {
            throw new IllegalStateException("Khách hàng chưa xác nhận đã chuyển khoản");
        }
        order.setPaymentStatus(PaymentStatus.PAID);
        order.setTransactionCode(transferContent(order));
        orderRepository.save(order);
        return orderRepository.findWithDetailsById(orderId).orElse(order);
    }

    @Transactional
    public Order reject(long orderId, User changedBy, String note) {
        Order order = findBankTransferOrder(orderId);
        if (order.getPaymentStatus() == PaymentStatus.PAID) {
            throw new IllegalStateException("Đơn hàng đã thanh toán không thể từ chối chuyển khoản");
        }
        order.setPaymentStatus(PaymentStatus.FAILED);
        orderRepository.save(order);
        return orderService.updateStatus(orderId, OrderStatus.CANCELLED.name(), changedBy,
                StringUtils.hasText(note) ? note : "Từ chối xác nhận chuyển khoản ngân hàng");
    }

    private Order findOwnedBankTransferOrder(long orderId, User user) {
        Order order = findBankTransferOrder(orderId);
        if (order.getUser() == null || order.getUser().getId() != user.getId()) {
            throw new IllegalStateException("Bạn không có quyền xem thanh toán đơn hàng này");
        }
        return order;
    }

    private Order findBankTransferOrder(long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng id=" + orderId));
        if (order.getPaymentMethod() != PaymentMethod.BANK_TRANSFER) {
            throw new IllegalStateException("Đơn hàng không sử dụng phương thức chuyển khoản ngân hàng");
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

    private String transferContent(Order order) {
        return "DH" + order.getId();
    }

    private String toQrAmount(BigDecimal amount) {
        if (amount == null) {
            return "0";
        }
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
