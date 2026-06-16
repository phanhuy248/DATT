package com.smartshop.demo.service;

import com.smartshop.demo.domain.*;
import com.smartshop.demo.dto.order.OrderItemRequest;
import com.smartshop.demo.dto.order.PlaceOrderRequest;
import com.smartshop.demo.exception.ResourceNotFoundException;
import com.smartshop.demo.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    OrderRepository orderRepository;
    @Mock
    OrderDetailRepository orderDetailRepository;
    @Mock
    ProductRepository productRepository;
    @Mock
    OrderStatusHistoryRepository orderStatusHistoryRepository;
    @Mock
    InventoryTransactionRepository inventoryTransactionRepository;
    @Mock CouponService couponService;
    @Mock MailService mailService;

    @InjectMocks OrderService orderService;

    private User user;
    private Product product;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(1L);
        user.setEmail("test@gmail.com");
        user.setFullName("Test User");

        product = new Product();
        product.setId(10L);
        product.setName("Laptop Test");
        product.setPrice(BigDecimal.valueOf(15_000_000));
        product.setQuantity(5);
        product.setSold(0);
    }

    // ── placeOrder ────────────────────────────────────────────

    @Test
    void placeOrder_happyPath_savesOrderAndReducesStock() {
        PlaceOrderRequest req = buildRequest(10L, 2, "COD", null);

        when(productRepository.findAllByIdForUpdate(List.of(10L))).thenReturn(List.of(product));
        when(couponService.calculateDiscount(null, BigDecimal.valueOf(30_000_000))).thenReturn(BigDecimal.ZERO);

        Order savedOrder = new Order();
        savedOrder.setId(99L);
        when(orderRepository.save(any())).thenReturn(savedOrder);
        when(orderDetailRepository.save(any())).thenReturn(new OrderDetail());
        when(productRepository.save(any())).thenReturn(product);
        when(inventoryTransactionRepository.save(any())).thenReturn(new InventoryTransaction());
        when(orderRepository.findWithDetailsById(99L)).thenReturn(Optional.of(savedOrder));
        doNothing().when(mailService).sendOrderConfirmation(any());

        Order result = orderService.placeOrder(user, req);

        assertThat(result).isNotNull();
        assertThat(product.getQuantity()).isEqualTo(3); // 5 - 2
        assertThat(product.getSold()).isEqualTo(2);
        verify(orderRepository).save(any(Order.class));
        verify(orderDetailRepository).save(any(OrderDetail.class));
        verify(mailService).sendOrderConfirmation(savedOrder);
    }

    @Test
    void placeOrder_insufficientStock_throwsIllegalArgument() {
        PlaceOrderRequest req = buildRequest(10L, 10, "COD", null); // yêu cầu 10, chỉ có 5

        when(productRepository.findAllByIdForUpdate(List.of(10L))).thenReturn(List.of(product));

        assertThatThrownBy(() -> orderService.placeOrder(user, req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("không đủ hàng");
    }

    @Test
    void placeOrder_productNotFound_throwsResourceNotFoundException() {
        PlaceOrderRequest req = buildRequest(999L, 1, "COD", null);

        when(productRepository.findAllByIdForUpdate(List.of(999L))).thenReturn(List.of());

        assertThatThrownBy(() -> orderService.placeOrder(user, req))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void placeOrder_withVnpay_setsPaymentStatusPending() {
        PlaceOrderRequest req = buildRequest(10L, 1, "VNPAY", null);

        when(productRepository.findAllByIdForUpdate(List.of(10L))).thenReturn(List.of(product));
        when(couponService.calculateDiscount(any(), any())).thenReturn(BigDecimal.ZERO);

        Order savedOrder = new Order();
        savedOrder.setId(5L);
        when(orderRepository.save(any())).thenAnswer(inv -> {
            Order o = inv.getArgument(0);
            o.setId(5L);
            // kiểm tra payment status được set đúng TRƯỚC khi save
            assertThat(o.getPaymentStatus()).isEqualTo(PaymentStatus.PENDING);
            return savedOrder;
        });
        when(orderDetailRepository.save(any())).thenReturn(new OrderDetail());
        when(productRepository.save(any())).thenReturn(product);
        when(inventoryTransactionRepository.save(any())).thenReturn(new InventoryTransaction());
        when(orderRepository.findWithDetailsById(5L)).thenReturn(Optional.of(savedOrder));
        doNothing().when(mailService).sendOrderConfirmation(any());

        orderService.placeOrder(user, req);
        // Assertion đã nằm trong answer lambda ở trên
    }

    // ── updateStatus ──────────────────────────────────────────

    @Test
    void updateStatus_cancelledOrder_cannotBeReopened() {
        Order order = new Order();
        order.setId(1L);
        order.setStatus(OrderStatus.CANCELLED);

        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));

        assertThatThrownBy(() -> orderService.updateStatus(1L, "CONFIRMED", null, null))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("đã hủy không thể mở lại");
    }

    @Test
    void updateStatus_completedWithCod_setsPaymentStatusPaid() {
        Order order = new Order();
        order.setId(2L);
        order.setStatus(OrderStatus.SHIPPING);
        order.setPaymentMethod(PaymentMethod.COD);
        order.setPaymentStatus(PaymentStatus.UNPAID);

        Order savedOrder = new Order();
        savedOrder.setId(2L);
        savedOrder.setStatus(OrderStatus.COMPLETED);
        savedOrder.setPaymentStatus(PaymentStatus.PAID);

        when(orderRepository.findById(2L)).thenReturn(Optional.of(order));
        when(orderRepository.save(any())).thenReturn(savedOrder);
        when(orderStatusHistoryRepository.save(any())).thenReturn(new OrderStatusHistory());
        when(orderRepository.findWithDetailsById(2L)).thenReturn(Optional.of(savedOrder));

        Order result = orderService.updateStatus(2L, "COMPLETED", user, null);

        assertThat(order.getPaymentStatus()).isEqualTo(PaymentStatus.PAID);
    }

    @Test
    void placeOrder_withBankTransfer_setsPaymentStatusPending() {
        PlaceOrderRequest req = buildRequest(10L, 1, "BANK_TRANSFER", null);

        when(productRepository.findAllByIdForUpdate(List.of(10L))).thenReturn(List.of(product));
        when(couponService.calculateDiscount(any(), any())).thenReturn(BigDecimal.ZERO);

        Order savedOrder = new Order();
        savedOrder.setId(6L);
        when(orderRepository.save(any())).thenAnswer(inv -> {
            Order o = inv.getArgument(0);
            o.setId(6L);
            assertThat(o.getPaymentStatus()).isEqualTo(PaymentStatus.PENDING);
            return savedOrder;
        });
        when(orderDetailRepository.save(any())).thenReturn(new OrderDetail());
        when(productRepository.save(any())).thenReturn(product);
        when(inventoryTransactionRepository.save(any())).thenReturn(new InventoryTransaction());
        when(orderRepository.findWithDetailsById(6L)).thenReturn(Optional.of(savedOrder));
        doNothing().when(mailService).sendOrderConfirmation(any());

        orderService.placeOrder(user, req);
    }

    @Test
    void updateStatus_unpaidPrepaidOrder_cannotBeProcessed() {
        Order order = new Order();
        order.setId(7L);
        order.setStatus(OrderStatus.PENDING);
        order.setPaymentMethod(PaymentMethod.VNPAY);
        order.setPaymentStatus(PaymentStatus.PENDING);

        when(orderRepository.findById(7L)).thenReturn(Optional.of(order));

        assertThatThrownBy(() -> orderService.updateStatus(7L, "CONFIRMED", user, null))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("thanh toan thanh cong");
    }

    @Test
    void updateStatus_cancelOrder_restoresStock() {
        OrderDetail detail = new OrderDetail();
        detail.setProduct(product);
        detail.setQuantity(3);

        Order order = new Order();
        order.setId(3L);
        order.setStatus(OrderStatus.CONFIRMED);
        order.setPaymentMethod(PaymentMethod.COD);
        order.setPaymentStatus(PaymentStatus.UNPAID);

        Order orderWithDetails = new Order();
        orderWithDetails.setId(3L);
        orderWithDetails.setStatus(OrderStatus.CONFIRMED);
        orderWithDetails.setPaymentMethod(PaymentMethod.COD);
        orderWithDetails.setPaymentStatus(PaymentStatus.UNPAID);
        orderWithDetails.setOrderDetails(List.of(detail));

        when(orderRepository.findById(3L)).thenReturn(Optional.of(order));
        when(orderRepository.save(any())).thenReturn(order);
        when(orderRepository.findWithDetailsById(3L)).thenReturn(Optional.of(orderWithDetails));
        when(productRepository.save(any())).thenReturn(product);
        when(inventoryTransactionRepository.save(any())).thenReturn(new InventoryTransaction());
        when(orderStatusHistoryRepository.save(any())).thenReturn(new OrderStatusHistory());

        orderService.updateStatus(3L, "CANCELLED", user, "hết hàng");

        // Tồn kho phải được hoàn lại: 5 + 3 = 8
        assertThat(product.getQuantity()).isEqualTo(8);
    }

    @Test
    void updateStatus_orderNotFound_throwsResourceNotFoundException() {
        when(orderRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> orderService.updateStatus(999L, "CONFIRMED", null, null))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void updateStatus_invalidStatus_throwsIllegalArgument() {
        Order order = new Order();
        order.setId(1L);
        order.setStatus(OrderStatus.PENDING);

        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));

        assertThatThrownBy(() -> orderService.updateStatus(1L, "INVALID_STATUS", null, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("không hợp lệ");
    }

    // ── helpers ───────────────────────────────────────────────

    private PlaceOrderRequest buildRequest(long productId, int qty, String paymentMethod, String coupon) {
        OrderItemRequest item = new OrderItemRequest();
        item.setProductId(productId);
        item.setQuantity((long) qty);

        PlaceOrderRequest req = new PlaceOrderRequest();
        req.setItems(List.of(item));
        req.setPaymentMethod(paymentMethod);
        req.setReceiverName("Nguyen Van A");
        req.setReceiverAddress("123 Đường ABC, TP.HCM");
        req.setReceiverPhone("0912345678");
        req.setCouponCode(coupon);
        return req;
    }
}
