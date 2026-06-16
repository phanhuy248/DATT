package com.smartshop.demo.dto.flashsale;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class FlashSaleCreateRequest {
    private Long productId;
    private BigDecimal salePrice;
    private LocalDateTime startAt;
    private LocalDateTime endAt;
    private Integer quantityLimit;
    private Boolean active = true;
    private Integer sortOrder = 0;

    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }
    public BigDecimal getSalePrice() { return salePrice; }
    public void setSalePrice(BigDecimal salePrice) { this.salePrice = salePrice; }
    public LocalDateTime getStartAt() { return startAt; }
    public void setStartAt(LocalDateTime startAt) { this.startAt = startAt; }
    public LocalDateTime getEndAt() { return endAt; }
    public void setEndAt(LocalDateTime endAt) { this.endAt = endAt; }
    public Integer getQuantityLimit() { return quantityLimit; }
    public void setQuantityLimit(Integer quantityLimit) { this.quantityLimit = quantityLimit; }
    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }
    public Integer getSortOrder() { return sortOrder; }
    public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }
}
