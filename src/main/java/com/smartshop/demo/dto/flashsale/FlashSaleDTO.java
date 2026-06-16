package com.smartshop.demo.dto.flashsale;

import com.smartshop.demo.domain.FlashSaleItem;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;

/** DTO dùng chung cho cả API public và admin. */
public class FlashSaleDTO {
    private Long id;
    private Long productId;
    private String productName;
    private String productImage;
    private BigDecimal originalPrice;
    private BigDecimal salePrice;
    private int discountPercent;
    private LocalDateTime startAt;
    private LocalDateTime endAt;
    private Integer quantityLimit;
    private int soldCount;
    private Integer remaining;
    private boolean active;
    private int sortOrder;

    public static FlashSaleDTO from(FlashSaleItem item) {
        FlashSaleDTO dto = new FlashSaleDTO();
        dto.id = item.getId();
        dto.productId = item.getProduct().getId();
        dto.productName = item.getProduct().getName();
        dto.productImage = item.getProduct().getImage();
        dto.originalPrice = item.getProduct().getPrice();
        dto.salePrice = item.getSalePrice();
        dto.discountPercent = calcDiscountPercent(dto.originalPrice, dto.salePrice);
        dto.startAt = item.getStartAt();
        dto.endAt = item.getEndAt();
        dto.quantityLimit = item.getQuantityLimit();
        dto.soldCount = item.getSoldCount();
        dto.remaining = item.getQuantityLimit() != null
                ? Math.max(0, item.getQuantityLimit() - item.getSoldCount()) : null;
        dto.active = item.isActive();
        dto.sortOrder = item.getSortOrder();
        return dto;
    }

    private static int calcDiscountPercent(BigDecimal original, BigDecimal sale) {
        if (original == null || original.compareTo(BigDecimal.ZERO) <= 0) return 0;
        return Math.min(99, Math.max(1,
                original.subtract(sale)
                        .multiply(BigDecimal.valueOf(100))
                        .divide(original, 0, RoundingMode.HALF_UP)
                        .intValue()));
    }

    public Long getId() { return id; }
    public Long getProductId() { return productId; }
    public String getProductName() { return productName; }
    public String getProductImage() { return productImage; }
    public BigDecimal getOriginalPrice() { return originalPrice; }
    public BigDecimal getSalePrice() { return salePrice; }
    public int getDiscountPercent() { return discountPercent; }
    public LocalDateTime getStartAt() { return startAt; }
    public LocalDateTime getEndAt() { return endAt; }
    public Integer getQuantityLimit() { return quantityLimit; }
    public int getSoldCount() { return soldCount; }
    public Integer getRemaining() { return remaining; }
    public boolean isActive() { return active; }
    public int getSortOrder() { return sortOrder; }
}
