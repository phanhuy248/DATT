package com.example.demo.dto.product;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public class ProductImportItem {
    private String source;
    private String sourceSite;
    private String sourceUrl;
    private String externalId;
    private String name;
    private BigDecimal price;
    private String image;
    private List<String> images;
    private String shortDesc;
    private String description;
    private String detailDesc;
    private Map<String, String> specifications;
    private Long stock;
    private Long quantity;
    private Long soldCount;
    private Long sold;
    private String category;
    private String supplier;
    private String brand;
    private String factory;
    private String target;

    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }
    public String getSourceSite() { return sourceSite; }
    public void setSourceSite(String sourceSite) { this.sourceSite = sourceSite; }
    public String getSourceUrl() { return sourceUrl; }
    public void setSourceUrl(String sourceUrl) { this.sourceUrl = sourceUrl; }
    public String getExternalId() { return externalId; }
    public void setExternalId(String externalId) { this.externalId = externalId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }
    public String getImage() { return image; }
    public void setImage(String image) { this.image = image; }
    public List<String> getImages() { return images; }
    public void setImages(List<String> images) { this.images = images; }
    public String getShortDesc() { return shortDesc; }
    public void setShortDesc(String shortDesc) { this.shortDesc = shortDesc; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getDetailDesc() { return detailDesc; }
    public void setDetailDesc(String detailDesc) { this.detailDesc = detailDesc; }
    public Map<String, String> getSpecifications() { return specifications; }
    public void setSpecifications(Map<String, String> specifications) { this.specifications = specifications; }
    public Long getStock() { return stock; }
    public void setStock(Long stock) { this.stock = stock; }
    public Long getQuantity() { return quantity; }
    public void setQuantity(Long quantity) { this.quantity = quantity; }
    public Long getSoldCount() { return soldCount; }
    public void setSoldCount(Long soldCount) { this.soldCount = soldCount; }
    public Long getSold() { return sold; }
    public void setSold(Long sold) { this.sold = sold; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getSupplier() { return supplier; }
    public void setSupplier(String supplier) { this.supplier = supplier; }
    public String getBrand() { return brand; }
    public void setBrand(String brand) { this.brand = brand; }
    public String getFactory() { return factory; }
    public void setFactory(String factory) { this.factory = factory; }
    public String getTarget() { return target; }
    public void setTarget(String target) { this.target = target; }
}
