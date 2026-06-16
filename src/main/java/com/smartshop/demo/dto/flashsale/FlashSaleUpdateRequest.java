package com.smartshop.demo.dto.flashsale;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/** PUT /api/admin/flash-sales/{id} — không cho đổi product_id sau khi tạo.
 *  Để reset quantityLimit về không giới hạn, gửi clearQuantityLimit=true. */
public class FlashSaleUpdateRequest {
    private BigDecimal salePrice;
    private LocalDateTime startAt;
    private LocalDateTime endAt;
    private Integer quantityLimit;
    /** true = xóa giới hạn số lượng về null (không giới hạn). */
    private Boolean clearQuantityLimit;
    private Boolean active;
    private Integer sortOrder;

    public BigDecimal getSalePrice() { return salePrice; }
    public void setSalePrice(BigDecimal salePrice) { this.salePrice = salePrice; }
    public LocalDateTime getStartAt() { return startAt; }
    public void setStartAt(LocalDateTime startAt) { this.startAt = startAt; }
    public LocalDateTime getEndAt() { return endAt; }
    public void setEndAt(LocalDateTime endAt) { this.endAt = endAt; }
    public Integer getQuantityLimit() { return quantityLimit; }
    public void setQuantityLimit(Integer quantityLimit) { this.quantityLimit = quantityLimit; }
    public Boolean getClearQuantityLimit() { return clearQuantityLimit; }
    public void setClearQuantityLimit(Boolean clearQuantityLimit) { this.clearQuantityLimit = clearQuantityLimit; }
    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }
    public Integer getSortOrder() { return sortOrder; }
    public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }
}
