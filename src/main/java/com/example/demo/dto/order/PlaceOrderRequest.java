package com.example.demo.dto.order;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;

import java.util.List;

public class PlaceOrderRequest {
    @NotBlank(message = "Tên người nhận không được để trống")
    private String receiverName;

    @NotBlank(message = "Địa chỉ không được để trống")
    private String receiverAddress;

    @NotBlank(message = "Số điện thoại không được để trống")
    private String receiverPhone;

    @Pattern(regexp = "COD|BANK_TRANSFER|MOMO|VNPAY", message = "Phương thức thanh toán không hợp lệ")
    private String paymentMethod = "COD";

    private String couponCode;

    @NotEmpty(message = "Giỏ hàng không được rỗng")
    @Valid
    private List<OrderItemRequest> items;

    public String getReceiverName() { return receiverName; }
    public void setReceiverName(String receiverName) { this.receiverName = receiverName; }
    public String getReceiverAddress() { return receiverAddress; }
    public void setReceiverAddress(String receiverAddress) { this.receiverAddress = receiverAddress; }
    public String getReceiverPhone() { return receiverPhone; }
    public void setReceiverPhone(String receiverPhone) { this.receiverPhone = receiverPhone; }
    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
    public String getCouponCode() { return couponCode; }
    public void setCouponCode(String couponCode) { this.couponCode = couponCode; }
    public List<OrderItemRequest> getItems() { return items; }
    public void setItems(List<OrderItemRequest> items) { this.items = items; }
}
