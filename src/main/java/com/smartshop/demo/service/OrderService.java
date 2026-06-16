package com.smartshop.demo.service;

import com.smartshop.demo.domain.FlashSaleItem;
import com.smartshop.demo.domain.InventoryTransaction;
import com.smartshop.demo.domain.InventoryTransactionType;
import com.smartshop.demo.domain.Order;
import com.smartshop.demo.domain.OrderDetail;
import com.smartshop.demo.domain.OrderStatus;
import com.smartshop.demo.domain.OrderStatusHistory;
import com.smartshop.demo.domain.PaymentMethod;
import com.smartshop.demo.domain.PaymentStatus;
import com.smartshop.demo.domain.Product;
import com.smartshop.demo.domain.User;
import com.smartshop.demo.dto.order.OrderDTO;
import com.smartshop.demo.dto.order.OrderItemRequest;
import com.smartshop.demo.dto.order.PlaceOrderRequest;
import com.smartshop.demo.event.OrderConfirmationEvent;
import com.smartshop.demo.exception.ResourceNotFoundException;
import com.smartshop.demo.repository.FlashSaleItemRepository;
import com.smartshop.demo.repository.InventoryTransactionRepository;
import com.smartshop.demo.repository.OrderDetailRepository;
import com.smartshop.demo.repository.OrderRepository;
import com.smartshop.demo.repository.OrderStatusHistoryRepository;
import com.smartshop.demo.repository.ProductRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
public class OrderService {

    private static final Logger log = LoggerFactory.getLogger(OrderService.class);
    private static final String IDEMPOTENCY_KEY_PREFIX = "order:idempotency:";
    private static final long IDEMPOTENCY_TTL_HOURS = 24;

    private final OrderRepository orderRepository;
    private final OrderDetailRepository orderDetailRepository;
    private final ProductRepository productRepository;
    private final OrderStatusHistoryRepository orderStatusHistoryRepository;
    private final InventoryTransactionRepository inventoryTransactionRepository;
    private final CouponService couponService;
    private final StringRedisTemplate redisTemplate;
    private final ApplicationEventPublisher eventPublisher;
    private final FlashSaleItemRepository flashSaleItemRepository;

    @Value("${app.bank-transfer.expire-hours:24}")
    private long bankTransferExpirationHours = 24;

    @Value("${app.vnpay.expire-minutes:30}")
    private long vnpayExpirationMinutes = 30;

    private final CartService cartService;

    public OrderService(OrderRepository orderRepository,
                        OrderDetailRepository orderDetailRepository,
                        ProductRepository productRepository,
                        OrderStatusHistoryRepository orderStatusHistoryRepository,
                        InventoryTransactionRepository inventoryTransactionRepository,
                        CouponService couponService,
                        StringRedisTemplate redisTemplate,
                        ApplicationEventPublisher eventPublisher,
                        FlashSaleItemRepository flashSaleItemRepository,
                        CartService cartService) {
        this.orderRepository = orderRepository;
        this.orderDetailRepository = orderDetailRepository;
        this.productRepository = productRepository;
        this.orderStatusHistoryRepository = orderStatusHistoryRepository;
        this.inventoryTransactionRepository = inventoryTransactionRepository;
        this.couponService = couponService;
        this.redisTemplate = redisTemplate;
        this.eventPublisher = eventPublisher;
        this.flashSaleItemRepository = flashSaleItemRepository;
        this.cartService = cartService;
    }

    @Transactional
    public Order placeOrder(User user, PlaceOrderRequest req) {
        return placeOrder(user, req, null);
    }

    @Transactional
    public Order placeOrder(User user, PlaceOrderRequest req, String idempotencyKey) {
        // Idempotency: trả lại đơn cũ nếu key đã tồn tại
        if (idempotencyKey != null && !idempotencyKey.isBlank()) {
            String redisKey = IDEMPOTENCY_KEY_PREFIX + idempotencyKey;
            try {
                String existingOrderId = redisTemplate.opsForValue().get(redisKey);
                if (existingOrderId != null) {
                    long oid = Long.parseLong(existingOrderId);
                    return orderRepository.findWithDetailsById(oid)
                            .orElseThrow(() -> new ResourceNotFoundException("Đơn hàng idempotent không tìm thấy"));
                }
            } catch (Exception e) {
                log.warn("Idempotency Redis check failed, proceeding without: {}", e.getMessage());
            }
        }

        List<Long> productIds = req.getItems().stream()
                .map(OrderItemRequest::getProductId).toList();
        Map<Long, Product> productMap = productRepository.findAllByIdForUpdate(productIds).stream()
                .collect(Collectors.toMap(Product::getId, p -> p));

        // Lock flash sale rows trong cùng transaction với lock sản phẩm
        LocalDateTime now = LocalDateTime.now();
        Map<Long, FlashSaleItem> flashSaleMap = productIds.isEmpty()
                ? Collections.emptyMap()
                : flashSaleItemRepository.findActiveByProductIdsForUpdate(productIds, now)
                        .stream().collect(Collectors.toMap(f -> f.getProduct().getId(), f -> f));

        Order order = new Order();
        order.setUser(user);
        order.setReceiverName(req.getReceiverName());
        order.setReceiverAddress(req.getReceiverAddress());
        order.setReceiverPhone(req.getReceiverPhone());
        PaymentMethod paymentMethod = PaymentMethod.valueOf(req.getPaymentMethod());
        order.setPaymentMethod(paymentMethod);
        order.setPaymentStatus(initialPaymentStatus(paymentMethod));

        // Vòng 1: tính tổng tiền dùng giá sale (nếu có), lưu vào unitPriceMap để dùng lại
        Map<Long, BigDecimal> unitPriceMap = new HashMap<>();
        BigDecimal total = BigDecimal.ZERO;
        for (OrderItemRequest item : req.getItems()) {
            Product product = productMap.get(item.getProductId());
            if (product == null)
                throw new ResourceNotFoundException("Không tìm thấy sản phẩm id=" + item.getProductId());
            if (product.getQuantity() < item.getQuantity())
                throw new IllegalArgumentException("Sản phẩm '" + product.getName() + "' không đủ hàng. Tồn kho: " + product.getQuantity());
            BigDecimal unitPrice = resolveUnitPrice(flashSaleMap.get(item.getProductId()),
                    product.getPrice(), item.getQuantity());
            unitPriceMap.put(item.getProductId(), unitPrice);
            total = total.add(unitPrice.multiply(BigDecimal.valueOf(item.getQuantity())));
        }

        BigDecimal discount = couponService.calculateDiscount(req.getCouponCode(), total, user);
        order.setCouponCode(req.getCouponCode() == null || req.getCouponCode().isBlank()
                ? null : req.getCouponCode().trim().toUpperCase());
        order.setDiscountAmount(discount);
        order.setTotalPrice(total.subtract(discount));
        Order savedOrder = orderRepository.save(order);

        // Vòng 2: tạo OrderDetail với giá đã resolve, cập nhật sold_count flash sale
        for (OrderItemRequest item : req.getItems()) {
            Product product = productMap.get(item.getProductId());
            BigDecimal unitPrice = unitPriceMap.get(item.getProductId());
            OrderDetail detail = new OrderDetail();
            detail.setOrder(savedOrder);
            detail.setProduct(product);
            detail.setQuantity(item.getQuantity());
            detail.setPrice(unitPrice);
            orderDetailRepository.save(detail);

            // Cập nhật sold_count cho flash sale item (atomic trong transaction)
            FlashSaleItem fsi = flashSaleMap.get(item.getProductId());
            if (fsi != null) {
                int saleUnits = calcSaleUnits(fsi, item.getQuantity());
                fsi.setSoldCount(fsi.getSoldCount() + saleUnits);
                flashSaleItemRepository.save(fsi);
            }

            long beforeQuantity = product.getQuantity();
            product.setQuantity(beforeQuantity - item.getQuantity());
            product.setSold(product.getSold() + item.getQuantity());
            productRepository.save(product);
            recordInventoryTransaction(product, InventoryTransactionType.SALE, item.getQuantity(),
                    beforeQuantity, product.getQuantity(), "ORDER", savedOrder.getId(),
                    "Order #" + savedOrder.getId());
        }

        couponService.markUsed(req.getCouponCode(), user, savedOrder.getId());

        // Lưu idempotency key sau khi đơn đã tạo thành công
        if (idempotencyKey != null && !idempotencyKey.isBlank()) {
            try {
                redisTemplate.opsForValue().set(
                        IDEMPOTENCY_KEY_PREFIX + idempotencyKey,
                        String.valueOf(savedOrder.getId()),
                        IDEMPOTENCY_TTL_HOURS, TimeUnit.HOURS);
            } catch (Exception e) {
                log.warn("Idempotency Redis save failed: {}", e.getMessage());
            }
        }

        Order loadedOrder = orderRepository.findWithDetailsById(savedOrder.getId()).orElse(savedOrder);
        eventPublisher.publishEvent(new OrderConfirmationEvent(
                loadedOrder.getId(),
                user.getEmail(),
                loadedOrder.getTotalPrice(),
                loadedOrder.getStatus() != null ? loadedOrder.getStatus().name() : "PENDING"
        ));
        return loadedOrder;
    }

    // Map sang DTO bên trong @Transactional để tránh LazyInitializationException khi truy cập orderDetails
    @Transactional(readOnly = true)
    public Page<OrderDTO> getAllOrders(Pageable pageable) {
        return getAllOrders(null, null, null, null, pageable);
    }

    @Transactional(readOnly = true)
    public Page<OrderDTO> getAllOrders(String statusStr, String search,
                                       String dateFromStr, String dateToStr,
                                       Pageable pageable) {
        OrderStatus status = (statusStr != null && !statusStr.isBlank())
                ? OrderStatus.valueOf(statusStr) : null;
        String searchTrim = (search != null && !search.isBlank()) ? search.trim() : null;
        java.time.LocalDateTime dateFrom = parseDate(dateFromStr, false);
        java.time.LocalDateTime dateTo   = parseDate(dateToStr, true);
        Page<Order> page = orderRepository.findWithFilters(status, searchTrim, dateFrom, dateTo, pageable);
        // Batch-load details vào 1st-level cache để tránh N+1 khi map sang DTO
        if (!page.isEmpty()) {
            List<Long> ids = page.stream().map(Order::getId).toList();
            orderRepository.findWithDetailsByIds(ids);
        }
        return page.map(OrderDTO::from);
    }

    private java.time.LocalDateTime parseDate(String dateStr, boolean endOfDay) {
        if (dateStr == null || dateStr.isBlank()) return null;
        try {
            java.time.LocalDate d = java.time.LocalDate.parse(dateStr);
            return endOfDay ? d.atTime(23, 59, 59) : d.atStartOfDay();
        } catch (Exception e) {
            return null;
        }
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

    /** Trả về danh sách tóm tắt (không có items) — nhẹ hơn cho UI chỉ cần metadata. */
    @Transactional(readOnly = true)
    public List<OrderDTO> getOrderSummariesByUser(User user) {
        return orderRepository.findSummariesByUser(user).stream()
                .map(OrderDTO::fromSummary).toList();
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
        ensurePaymentAllowsStatusChange(order, nextStatus);
        if (nextStatus == OrderStatus.CANCELLED && currentStatus != OrderStatus.CANCELLED) {
            restoreStock(order);
            couponService.restoreCoupon(order.getCouponCode(), order.getUser());
            if (order.getPaymentStatus() == PaymentStatus.PAID) {
                order.setPaymentStatus(PaymentStatus.REFUNDED);
            } else if (order.getPaymentStatus() == PaymentStatus.PENDING || order.getPaymentStatus() == PaymentStatus.UNPAID) {
                order.setPaymentStatus(order.getPaymentMethod() == PaymentMethod.COD
                        ? PaymentStatus.UNPAID
                        : PaymentStatus.CANCELLED);
            }
        }
        if (nextStatus == OrderStatus.COMPLETED && order.getPaymentMethod() == PaymentMethod.COD) {
            order.setPaymentStatus(PaymentStatus.PAID);
        }
        order.setStatus(nextStatus);
        orderRepository.save(order);
        if (currentStatus != nextStatus) {
            recordStatusHistory(order, currentStatus, nextStatus, changedBy, note);
        }
        return orderRepository.findWithDetailsById(id).orElse(order);
    }

    /**
     * Cho phép khách tự hủy đơn ở trạng thái PENDING chưa thanh toán.
     */
    @Transactional
    public Order cancelMyOrder(User user, long orderId) {
        Order order = orderRepository.findWithDetailsById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng"));
        if (order.getUser().getId() != user.getId()) {
            throw new ResourceNotFoundException("Không tìm thấy đơn hàng");
        }
        if (order.getStatus() != OrderStatus.PENDING) {
            throw new IllegalStateException("Chỉ có thể hủy đơn hàng ở trạng thái chờ xử lý");
        }
        if (order.getPaymentStatus() == PaymentStatus.PAID) {
            throw new IllegalStateException("Đơn hàng đã thanh toán, vui lòng liên hệ admin để được hỗ trợ hoàn tiền");
        }
        restoreStock(order);
        couponService.restoreCoupon(order.getCouponCode(), user);
        order.setStatus(OrderStatus.CANCELLED);
        order.setPaymentStatus(order.getPaymentMethod() == PaymentMethod.COD
                ? PaymentStatus.UNPAID : PaymentStatus.CANCELLED);
        orderRepository.save(order);
        recordStatusHistory(order, OrderStatus.PENDING, OrderStatus.CANCELLED, user, "Khách hàng tự hủy đơn");
        return orderRepository.findWithDetailsById(orderId).orElse(order);
    }

    @Scheduled(cron = "${app.bank-transfer.expire-cron:0 0 * * * *}", zone = "${app.bank-transfer.expire-zone:Asia/Ho_Chi_Minh}")
    @Transactional
    public void cancelExpiredBankTransferOrders() {
        if (bankTransferExpirationHours <= 0) {
            return;
        }
        LocalDateTime cutoff = LocalDateTime.now().minusHours(bankTransferExpirationHours);
        List<Order> expiredOrders = orderRepository.findExpiredPendingPaymentOrders(
                PaymentMethod.BANK_TRANSFER,
                PaymentStatus.PENDING,
                cutoff
        );
        for (Order order : expiredOrders) {
            updateStatus(order.getId(), OrderStatus.CANCELLED.name(), null,
                    "Auto-cancelled after " + bankTransferExpirationHours + " hours without bank transfer confirmation");
        }
    }

    @Scheduled(cron = "${app.vnpay.expire-cron:0 */15 * * * *}", zone = "${app.vnpay.expire-zone:Asia/Ho_Chi_Minh}")
    @Transactional
    public void cancelExpiredVnpayOrders() {
        if (vnpayExpirationMinutes <= 0) {
            return;
        }
        LocalDateTime cutoff = LocalDateTime.now().minusMinutes(vnpayExpirationMinutes);
        List<Order> expiredOrders = orderRepository.findExpiredUnpaidOrders(
                PaymentMethod.VNPAY,
                List.of(PaymentStatus.PENDING, PaymentStatus.CANCELLED, PaymentStatus.FAILED),
                cutoff
        );
        for (Order order : expiredOrders) {
            log.info("[VNPay expire] Auto-cancelling order {} (paymentStatus={})", order.getId(), order.getPaymentStatus());
            updateStatus(order.getId(), OrderStatus.CANCELLED.name(), null,
                    "Auto-cancelled after " + vnpayExpirationMinutes + " minutes without VNPay payment");
        }
    }

    /**
     * Đổi phương thức thanh toán cho đơn chưa thanh toán.
     * Nếu đổi sang COD: xóa giỏ hàng ngay (không cần thanh toán online).
     */
    @Transactional
    public Order changePaymentMethod(User user, long orderId, String methodStr) {
        Order order = orderRepository.findWithDetailsById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng"));
        if (order.getUser().getId() != user.getId()) {
            throw new ResourceNotFoundException("Không tìm thấy đơn hàng");
        }
        if (order.getPaymentStatus() == PaymentStatus.PAID) {
            throw new IllegalStateException("Đơn hàng đã thanh toán không thể đổi phương thức");
        }
        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new IllegalStateException("Đơn hàng đã hủy không thể đổi phương thức");
        }
        PaymentMethod newMethod;
        try {
            newMethod = PaymentMethod.valueOf(methodStr);
        } catch (Exception e) {
            throw new IllegalArgumentException("Phương thức thanh toán không hợp lệ: " + methodStr);
        }
        order.setPaymentMethod(newMethod);
        order.setPaymentStatus(initialPaymentStatus(newMethod));
        order.setTransactionCode(null);
        orderRepository.save(order);
        if (newMethod == PaymentMethod.COD) {
            cartService.clearCart(user);
        }
        return orderRepository.findWithDetailsById(orderId).orElse(order);
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
        return orderRepository.findDailyRevenueSince(startDate.atStartOfDay()).stream()
                .map(row -> {
                    Map<String, Object> entry = new LinkedHashMap<>();
                    entry.put("date", row[0].toString());
                    entry.put("revenue", row[1]);
                    return entry;
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getRevenueGrouped(
            LocalDate dateFrom, LocalDate dateTo, String groupBy,
            Long categoryId, String brand) {
        LocalDateTime from = dateFrom.atStartOfDay();
        LocalDateTime to   = dateTo.atTime(23, 59, 59);
        String brandParam  = (brand == null || brand.isBlank()) ? null : brand;
        List<Object[]> rows = switch (groupBy == null ? "day" : groupBy) {
            case "week"  -> orderRepository.findRevenueGroupedByWeek(from, to, categoryId, brandParam);
            case "month" -> orderRepository.findRevenueGroupedByMonth(from, to, categoryId, brandParam);
            default      -> orderRepository.findRevenueGroupedByDay(from, to, categoryId, brandParam);
        };
        return rows.stream().map(row -> {
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("period", row[0] != null ? row[0].toString() : "");
            entry.put("revenue", row[1]);
            entry.put("ordersCount", row[2]);
            return entry;
        }).toList();
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getCategoryRevenueFiltered(String brand) {
        String brandParam = (brand == null || brand.isBlank()) ? null : brand;
        List<Object[]> rows = brandParam == null
                ? orderRepository.findCategoryRevenue()
                : orderRepository.findCategoryRevenueByBrand(brandParam);
        return rows.stream().map(row -> {
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("category", row[0]);
            entry.put("revenue", row[1]);
            return entry;
        }).toList();
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getTopCustomers(int limit) {
        return orderRepository.findTopCustomers(PageRequest.of(0, limit)).stream()
                .map(row -> {
                    Map<String, Object> entry = new LinkedHashMap<>();
                    entry.put("userId", row[0]);
                    entry.put("email", row[1]);
                    entry.put("fullName", row[2]);
                    entry.put("totalSpent", row[3]);
                    entry.put("orderCount", row[4]);
                    return entry;
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getCategoryRevenue() {
        return orderRepository.findCategoryRevenue().stream()
                .map(row -> {
                    Map<String, Object> entry = new LinkedHashMap<>();
                    entry.put("category", row[0]);
                    entry.put("revenue", row[1]);
                    return entry;
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

    private PaymentStatus initialPaymentStatus(PaymentMethod paymentMethod) {
        return paymentMethod == PaymentMethod.COD ? PaymentStatus.UNPAID : PaymentStatus.PENDING;
    }

    private void ensurePaymentAllowsStatusChange(Order order, OrderStatus nextStatus) {
        if (nextStatus == OrderStatus.PENDING || nextStatus == OrderStatus.CANCELLED) {
            return;
        }
        if (order.getPaymentMethod() != null
                && order.getPaymentMethod() != PaymentMethod.COD
                && order.getPaymentStatus() != PaymentStatus.PAID) {
            throw new IllegalStateException("Don hang thanh toan truoc phai duoc thanh toan thanh cong truoc khi xu ly");
        }
    }

    private void restoreStock(Order order) {
        Order loaded = orderRepository.findWithDetailsById(order.getId()).orElse(order);
        if (loaded.getOrderDetails() == null || loaded.getOrderDetails().isEmpty()) return;

        List<Long> productIds = loaded.getOrderDetails().stream()
                .filter(d -> d.getProduct() != null)
                .map(d -> d.getProduct().getId())
                .distinct()
                .toList();
        if (productIds.isEmpty()) return;

        // Dùng pessimistic lock giống placeOrder để tránh xung đột concurrent
        Map<Long, Product> locked = productRepository.findAllByIdForUpdate(productIds)
                .stream().collect(Collectors.toMap(Product::getId, p -> p));

        for (OrderDetail detail : loaded.getOrderDetails()) {
            if (detail.getProduct() == null) {
                log.warn("restoreStock: order #{} detail has null product, skipping", loaded.getId());
                continue;
            }
            Product product = locked.get(detail.getProduct().getId());
            if (product == null) {
                log.warn("restoreStock: product {} not found (deleted?), skipping stock restore for order #{}",
                        detail.getProduct().getId(), loaded.getId());
                continue;
            }
            long beforeQuantity = product.getQuantity();
            long newQuantity   = beforeQuantity + detail.getQuantity();
            long newSold       = Math.max(0, product.getSold() - detail.getQuantity());
            // Dùng native SQL update để tránh Hibernate optimistic-lock khi version = NULL (V8 seed data)
            productRepository.updateStockById(product.getId(), newQuantity, newSold);
            recordInventoryTransaction(product, InventoryTransactionType.CANCEL_ORDER, detail.getQuantity(),
                    beforeQuantity, newQuantity, "ORDER", loaded.getId(),
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

    /**
     * Tính giá đơn vị hiệu lực khi có flash sale.
     * Chiến lược: phần nằm trong quantity_limit → salePrice; phần vượt → originalPrice.
     * Kết quả là weighted-average để chỉ cần 1 bản ghi OrderDetail/sản phẩm.
     */
    private BigDecimal resolveUnitPrice(FlashSaleItem fsi, BigDecimal originalPrice, long requestedQty) {
        if (fsi == null) return originalPrice;
        long remaining = fsi.getQuantityLimit() != null
                ? Math.max(0L, fsi.getQuantityLimit() - fsi.getSoldCount())
                : requestedQty;
        long saleQty   = Math.min(requestedQty, remaining);
        long normalQty = requestedQty - saleQty;
        if (saleQty == 0)          return originalPrice;
        if (normalQty == 0)        return fsi.getSalePrice();
        // Split: tính giá trung bình có trọng số
        return fsi.getSalePrice().multiply(BigDecimal.valueOf(saleQty))
                .add(originalPrice.multiply(BigDecimal.valueOf(normalQty)))
                .divide(BigDecimal.valueOf(requestedQty), 2, RoundingMode.HALF_UP);
    }

    /** Số lượng đơn vị được hưởng giá sale (dùng để tăng sold_count). */
    private int calcSaleUnits(FlashSaleItem fsi, long requestedQty) {
        if (fsi.getQuantityLimit() == null) return (int) requestedQty;
        return (int) Math.min(requestedQty, Math.max(0L, fsi.getQuantityLimit() - fsi.getSoldCount()));
    }
}
