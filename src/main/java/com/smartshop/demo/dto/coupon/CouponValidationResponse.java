package com.smartshop.demo.dto.coupon;

import java.math.BigDecimal;

public class CouponValidationResponse {
    private String code;
    private BigDecimal discountAmount;
    private BigDecimal finalAmount;

    public CouponValidationResponse(String code, BigDecimal discountAmount, BigDecimal finalAmount) {
        this.code = code;
        this.discountAmount = discountAmount;
        this.finalAmount = finalAmount;
    }

    public String getCode() { return code; }
    public BigDecimal getDiscountAmount() { return discountAmount; }
    public BigDecimal getFinalAmount() { return finalAmount; }
}
