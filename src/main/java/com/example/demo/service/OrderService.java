package com.example.demo.service;

import com.example.demo.domain.InventoryTransaction;
import com.example.demo.domain.InventoryTransactionType;
import com.example.demo.domain.Order;
import com.example.demo.domain.OrderDetail;
import com.example.demo.domain.OrderStatus;
import com.example.demo.domain.OrderStatusHistory;
import com.example.demo.domain.PaymentMethod;
import com.example.demo.domain.PaymentStatus;
import com.example.demo.domain.Product;
import com.example.demo.domain.User;
import com.example.demo.dto.order.OrderDTO;
import com.example.demo.dto.order.OrderItemRequest;
import com.example.demo.dto.order.PlaceOrderRequest;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.InventoryTransactionRepository;
import com.example.demo.repository.OrderDetailRepository;
import com.example.demo.repository.OrderRepository;
import com.example.demo.repository.OrderStatusHistoryRepository;
import com.example.demo.repository.ProductRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderDetailRepository orderDetailRepository;
    private final ProductRepository productRepository;
    private final OrderStatusHistoryRepository orderStatusHistoryRepository;
    private final InventoryTransactionRepository inventoryTransactionRepository;
    private final CouponService couponService;
    private final MailService mailService;

    public OrderService(OrderRepository orderRepository,
                        OrderDetailRepository orderDetailRepository,
                        ProductRepository productRepository,
                        OrderStatusHistoryRepository orderStatusHistoryRepository,
                        InventoryTransactionRepository inventoryTransactionRepository,
                        CouponService couponService,
                        MailService mailService) {
        this.orderRepository = orderRepository;
        this.orderDetailRepository = orderDetailRepository;
        this.productRepository = productRepository;
        this.orderStatusHistoryRepository = orderStatusHistoryRepository;
        this.inventoryTransactionRepository = inventoryTransactionRepository;
        this.couponService = couponService;
        this.mailService = mailService;
    }

    @Transactional
    public Order placeOrder(User user, PlaceOrderRequest req) {
        List<Long> productIds = req.getItems().stream()
                .map(OrderItemRequest::getProductId).toList();
        Map<Long, Product> productMap = productRepository.findAllByIdForUpdate(productIds).stream()
                .collect(Collectors.toMap(Product::getId, p -> p));

        Order order = new Order();
        order.setUser(user);
        order.setReceiverName(req.getReceiverName());
        order.setReceiverAddress(req.getReceiverAddress());
        order.setReceiverPhone(req.getReceiverPhone());
        PaymentMethod paymentMethod = PaymentMethod.valueOf(req.getPaymentMethod());
        order.setPaymentMethod(paymentMethod);
        order.setPaymentStatus(paymentMethod == PaymentMethod.VNPAY ? PaymentStatus.PENDING : PaymentStatus.UNPAID);

        BigDecimal total = BigDecimal.ZERO;
        for (OrderItemRequest item : req.getItems()) {
            Product product = productMap.get(item.getProductId());
            if (product == null)
                throw new ResourceNotFoundException("Không tìm thấy sản phẩm id=" + item.getProductId());
            if (product.getQuantity() < item.getQuantity())
                throw new IllegalArgumentException("Sản phẩm '" + product.getName() + "' không đủ hàng. Tồn kho: " + product.getQuantity());
            total = total.add(product.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())));
        }
        BigDecimal discount = couponService.calculateDiscount(req.getCouponCode(), total);
        order.setCouponCode(req.getCouponCode() == null || req.getCouponCode().isBlank() ? null : req.getCouponCode().trim().toUpperCase());
        order.setDiscountAmount(discount);
        order.setTotalPrice(total.subtract(discount));
        Order savedOrder = orderRepository.save(order);

        for (OrderItemRequest item : req.getItems()) {
            Product product = productMap.get(item.getProductId());
            OrderDetail detail = new OrderDetail();
            detail.setOrder(savedOrder);
            detail.setProduct(product);
            detail.setQuantity(item.getQuantity());
            detail.setPrice(product.getPrice());
            orderDetailRepository.save(detail);

            long beforeQuantity = product.getQuantity();
            product.setQuantity(beforeQuantity - item.getQuantity());
            product.setSold(product.getSold() + item.getQuantity());
            productRepository.save(product);
            recordInventoryTransaction(product, InventoryTransactionType.SALE, item.getQuantity(),
                    beforeQuantity, product.getQuantity(), "ORDER", savedOrder.getId(),
                    "Order #" + savedOrder.getId());
        }
        couponService.markUsed(req.getCouponCode());
        Order loadedOrder = orderRepository.findWithDetailsById(savedOrder.getId()).orElse(savedOrder);
        mailService.sendOrderConfirmation(loadedOrder);
        return loadedOrder;
    }

    // Map sang DTO bên trong @Transactional để tránh LazyInitializationException khi truy cập orderDetails
    @Transactional(readOnly = true)
    public Page<OrderDTO> getAllOrders(Pageable pageable) {
        return orderRepository.findAll(pageable).map(OrderDTO::from);
    }

    public List<Order> getAllOrders() {
        return orderRepository.findAllByOrderByCreatedDateDesc();
    }

    @Transactional(readOnly = true)
    public Order getOrderById(long id) {
        return orderRepository.findWithDetailsById(id).orElse(null);
    }

    @Transactional(readOnly = true)
    public List<Order> getOrdersByUser(User user) {
        return orderRepository.findByUser(user);
    }

    @Transactional
    public Order updateStatus(long id, String status) {
        return updateStatus(id, status, null, null);
    }

    @Transactional
    public Order updateStatus(long id, String status, User changedBy, String note) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng id=" + id));
        OrderStatus nextStatus = parseStatus(status);
        OrderStatus currentStatus = order.getStatus();
        if (currentStatus == OrderStatus.CANCELLED && nextStatus != OrderStatus.CANCELLED) {
            throw new IllegalStateException("Đơn hàng đã hủy không thể mở lại trạng thái xử lý");
        }
        if (nextStatus == OrderStatus.CANCELLED && currentStatus != OrderStatus.CANCELLED) {
            restoreStock(order);
            if (order.getPaymentStatus() == PaymentStatus.PAID) {
                order.setPaymentStatus(PaymentStatus.REFUNDED);
            }
        }
        if (nextStatus == OrderStatus.DELIVERED && order.getPaymentMethod() == PaymentMethod.COD) {
            order.setPaymentStatus(PaymentStatus.PAID);
        }
        order.setStatus(nextStatus);
        orderRepository.save(order);
        if (currentStatus != nextStatus) {
            recordStatusHistory(order, currentStatus, nextStatus, changedBy, note);
        }
        // Reload với EntityGraph để lấy orderDetails đầy đủ trong cùng transaction
        return orderRepository.findWithDetailsById(id).orElse(order);
    }

    public long countOrders() {
        return orderRepository.count();
    }

    public BigDecimal getTotalRevenue() {
        BigDecimal revenue = orderRepository.getTotalRevenue();
        return revenue != null ? revenue : BigDecimal.ZERO;
    }

    public BigDecimal getDeliveredRevenue() {
        BigDecimal revenue = orderRepository.getDeliveredRevenue();
        return revenue != null ? revenue : BigDecimal.ZERO;
    }

    public List<Order> getRecentOrders(int limit) {
        return orderRepository.findRecentOrders(PageRequest.of(0, limit));
    }

    public Map<String, Long> countOrdersByStatus() {
        Map<String, Long> map = new LinkedHashMap<>();
        for (OrderStatus status : OrderStatus.values()) {
            map.put(status.name(), orderRepository.countByStatus(status));
        }
        return map;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getRevenueByDay(int days) {
        LocalDate startDate = LocalDate.now().minusDays(Math.max(days, 1) - 1L);
        Map<LocalDate, BigDecimal> revenueByDay = orderRepository.findAll().stream()
                .filter(order -> order.getCreatedDate() != null)
                .filter(order -> order.getStatus() == OrderStatus.DELIVERED)
                .filter(order -> !order.getCreatedDate().toLocalDate().isBefore(startDate))
                .collect(Collectors.groupingBy(
                        order -> order.getCreatedDate().toLocalDate(),
                        LinkedHashMap::new,
                        Collectors.reducing(BigDecimal.ZERO, Order::getTotalPrice, BigDecimal::add)));

        return revenueByDay.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(entry -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("date", entry.getKey().toString());
                    row.put("revenue", entry.getValue());
                    return row;
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getTopCustomers(int limit) {
        Map<User, BigDecimal> totals = orderRepository.findAll().stream()
                .filter(order -> order.getUser() != null)
                .filter(order -> order.getStatus() != OrderStatus.CANCELLED)
                .collect(Collectors.groupingBy(
                        Order::getUser,
                        Collectors.reducing(BigDecimal.ZERO, Order::getTotalPrice, BigDecimal::add)));

        return totals.entrySet().stream()
                .sorted((left, right) -> right.getValue().compareTo(left.getValue()))
                .limit(limit)
                .map(entry -> {
                    User user = entry.getKey();
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("userId", user.getId());
                    row.put("email", user.getEmail());
                    row.put("fullName", user.getFullName());
                    row.put("totalSpent", entry.getValue());
                    return row;
                })
                .toList();
    }

    public List<String> getAllStatuses() {
        return List.of(OrderStatus.values()).stream().map(OrderStatus::name).toList();
    }

    public boolean hasDeliveredProduct(User user, long productId) {
        return orderRepository.existsDeliveredOrderContainingProduct(user, productId);
    }

    private OrderStatus parseStatus(String status) {
        try {
            return OrderStatus.valueOf(status);
        } catch (Exception e) {
            throw new IllegalArgumentException("Trạng thái đơn hàng không hợp lệ");
        }
    }

    private void restoreStock(Order order) {
        Order loaded = orderRepository.findWithDetailsById(order.getId()).orElse(order);
        if (loaded.getOrderDetails() == null) return;
        for (OrderDetail detail : loaded.getOrderDetails()) {
            Product product = detail.getProduct();
            long beforeQuantity = product.getQuantity();
            product.setQuantity(beforeQuantity + detail.getQuantity());
            product.setSold(Math.max(0, product.getSold() - detail.getQuantity()));
            productRepository.save(product);
            recordInventoryTransaction(product, InventoryTransactionType.CANCEL_ORDER, detail.getQuantity(),
                    beforeQuantity, product.getQuantity(), "ORDER", loaded.getId(),
                    "Cancel order #" + loaded.getId());
        }
    }

    private void recordStatusHistory(Order order, OrderStatus oldStatus, OrderStatus newStatus, User changedBy, String note) {
        OrderStatusHistory history = new OrderStatusHistory();
        history.setOrder(order);
        history.setOldStatus(oldStatus);
        history.setNewStatus(newStatus);
        history.setChangedBy(changedBy);
        history.setNote(note);
        orderStatusHistoryRepository.save(history);
    }

    private void recordInventoryTransaction(Product product,
                                            InventoryTransactionType type,
                                            long quantity,
                                            long beforeQuantity,
                                            long afterQuantity,
                                            String referenceType,
                                            Long referenceId,
                                            String note) {
        InventoryTransaction transaction = new InventoryTransaction();
        transaction.setProduct(product);
        transaction.setType(type);
        transaction.setQuantity(quantity);
        transaction.setBeforeQuantity(beforeQuantity);
        transaction.setAfterQuantity(afterQuantity);
        transaction.setReferenceType(referenceType);
        transaction.setReferenceId(referenceId);
        transaction.setNote(note);
        inventoryTransactionRepository.save(transaction);
    }
}
