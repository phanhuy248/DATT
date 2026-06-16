package com.smartshop.demo.dto.coupon;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class CouponRequest {
    @NotBlank(message = "Mã giảm giá không được để trống")
    private String code;
    private String description;
    @NotBlank(message = "Loại giảm giá không được để trống")
    private String discountType;
    @NotNull(message = "Giá trị giảm không được để trống")
    @PositiveOrZero(message = "Giá trị giảm phải không âm")
    private BigDecimal discountValue;
    private BigDecimal minOrderAmount = BigDecimal.ZERO;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private int usageLimit;
    private boolean active = true;

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getDiscountType() { return discountType; }
    public void setDiscountType(String discountType) { this.discountType = discountType; }
    public BigDecimal getDiscountValue() { return discountValue; }
    public void setDiscountValue(BigDecimal discountValue) { this.discountValue = discountValue; }
    public BigDecimal getMinOrderAmount() { return minOrderAmount; }
    public void setMinOrderAmount(BigDecimal minOrderAmount) { this.minOrderAmount = minOrderAmount; }
    public LocalDateTime getStartDate() { return startDate; }
    public void setStartDate(LocalDateTime startDate) { this.startDate = startDate; }
    public LocalDateTime getEndDate() { return endDate; }
    public void setEndDate(LocalDateTime endDate) { this.endDate = endDate; }
    public int getUsageLimit() { return usageLimit; }
    public void setUsageLimit(int usageLimit) { this.usageLimit = usageLimit; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
}
