package com.smartshop.demo.dto.order;

import com.smartshop.demo.domain.Order;
import com.smartshop.demo.domain.OrderDetail;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

public class OrderDTO {
    private long id;
    private BigDecimal totalPrice;
    private BigDecimal discountAmount;
    private String receiverName;
    private String receiverAddress;
    private String receiverPhone;
    private String status;
    private String paymentMethod;
    private String paymentStatus;
    private String transactionCode;
    private String couponCode;
    private LocalDateTime createdDate;
    private List<OrderDetailDTO> items;

    public static OrderDTO from(Order o) {
        OrderDTO dto = new OrderDTO();
        dto.id = o.getId();
        dto.totalPrice = o.getTotalPrice();
        dto.discountAmount = o.getDiscountAmount();
        dto.receiverName = o.getReceiverName();
        dto.receiverAddress = o.getReceiverAddress();
        dto.receiverPhone = o.getReceiverPhone();
        dto.status = o.getStatus() != null ? o.getStatus().name() : null;
        dto.paymentMethod = o.getPaymentMethod() != null ? o.getPaymentMethod().name() : null;
        dto.paymentStatus = o.getPaymentStatus() != null ? o.getPaymentStatus().name() : null;
        dto.transactionCode = o.getTransactionCode();
        dto.couponCode = o.getCouponCode();
        dto.createdDate = o.getCreatedDate();
        if (o.getOrderDetails() != null) {
            dto.items = o.getOrderDetails().stream().map(OrderDetailDTO::from).collect(Collectors.toList());
        }
        return dto;
    }

    /** Tóm tắt đơn hàng — không access orderDetails, dùng cho endpoint danh sách nhẹ. */
    public static OrderDTO fromSummary(Order o) {
        OrderDTO dto = new OrderDTO();
        dto.id = o.getId();
        dto.totalPrice = o.getTotalPrice();
        dto.discountAmount = o.getDiscountAmount();
        dto.receiverName = o.getReceiverName();
        dto.receiverAddress = o.getReceiverAddress();
        dto.receiverPhone = o.getReceiverPhone();
        dto.status = o.getStatus() != null ? o.getStatus().name() : null;
        dto.paymentMethod = o.getPaymentMethod() != null ? o.getPaymentMethod().name() : null;
        dto.paymentStatus = o.getPaymentStatus() != null ? o.getPaymentStatus().name() : null;
        dto.transactionCode = o.getTransactionCode();
        dto.couponCode = o.getCouponCode();
        dto.createdDate = o.getCreatedDate();
        return dto;
    }

    public long getId() { return id; }
    public BigDecimal getTotalPrice() { return totalPrice; }
    public BigDecimal getDiscountAmount() { return discountAmount; }
    public String getReceiverName() { return receiverName; }
    public String getReceiverAddress() { return receiverAddress; }
    public String getReceiverPhone() { return receiverPhone; }
    public String getStatus() { return status; }
    public String getPaymentMethod() { return paymentMethod; }
    public String getPaymentStatus() { return paymentStatus; }
    public String getTransactionCode() { return transactionCode; }
    public String getCouponCode() { return couponCode; }
    public LocalDateTime getCreatedDate() { return createdDate; }
    public List<OrderDetailDTO> getItems() { return items; }

    public static class OrderDetailDTO {
        private long productId;
        private String productName;
        private String productImage;
        private long quantity;
        private BigDecimal price;

        public static OrderDetailDTO from(OrderDetail od) {
            OrderDetailDTO d = new OrderDetailDTO();
            d.productId = od.getProduct().getId();
            d.productName = od.getProduct().getName();
            d.productImage = od.getProduct().getImage();
            d.quantity = od.getQuantity();
            d.price = od.getPrice();
            return d;
        }

        public long getProductId() { return productId; }
        public String getProductName() { return productName; }
        public String getProductImage() { return productImage; }
        public long getQuantity() { return quantity; }
        public BigDecimal getPrice() { return price; }
    }
}
