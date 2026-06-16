package com.smartshop.demo.dto.product;

import com.smartshop.demo.domain.ProductPriceHistory;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class ProductPriceHistoryDTO {
    private long id;
    private BigDecimal oldPrice;
    private BigDecimal newPrice;
    private String sourceSite;
    private String sourceUrl;
    private LocalDateTime recordedAt;

    public static ProductPriceHistoryDTO from(ProductPriceHistory history) {
        ProductPriceHistoryDTO dto = new ProductPriceHistoryDTO();
        dto.id = history.getId();
        dto.oldPrice = history.getOldPrice();
        dto.newPrice = history.getNewPrice();
        dto.sourceSite = history.getSourceSite();
        dto.sourceUrl = history.getSourceUrl();
        dto.recordedAt = history.getRecordedAt();
        return dto;
    }

    public long getId() { return id; }
    public BigDecimal getOldPrice() { return oldPrice; }
    public BigDecimal getNewPrice() { return newPrice; }
    public String getSourceSite() { return sourceSite; }
    public String getSourceUrl() { return sourceUrl; }
    public LocalDateTime getRecordedAt() { return recordedAt; }
}
