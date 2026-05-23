package com.example.demo.dto.product;

import com.example.demo.domain.Product;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class ProductDTO {
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private long id;
    private String name;
    private BigDecimal price;
    private String image;
    private String shortDesc;
    private String detailDesc;
    private long quantity;
    private long sold;
    private String factory;
    private String target;
    private Long categoryId;
    private String categoryName;
    private Long supplierId;
    private String supplierName;
    private String sourceSite;
    private String sourceUrl;
    private Map<String, String> specifications = new LinkedHashMap<>();
    private List<String> images = new ArrayList<>();
    private double averageRating;
    private int reviewCount;

    public static ProductDTO from(Product p) {
        ProductDTO dto = new ProductDTO();
        dto.id = p.getId();
        dto.name = p.getName();
        dto.price = p.getPrice();
        dto.image = p.getImage();
        dto.shortDesc = p.getShortDesc();
        dto.detailDesc = p.getDetailDesc();
        dto.quantity = p.getQuantity();
        dto.sold = p.getSold();
        dto.factory = p.getFactory();
        dto.target = p.getTarget();
        dto.sourceSite = p.getSourceSite();
        dto.sourceUrl = p.getSourceUrl();
        dto.specifications = parseSpecifications(p.getSpecifications());
        dto.images = parseImages(p.getGalleryImages(), p.getImage());
        if (p.getCategory() != null) {
            dto.categoryId = p.getCategory().getId();
            dto.categoryName = p.getCategory().getName();
        }
        if (p.getSupplier() != null) {
            dto.supplierId = p.getSupplier().getId();
            dto.supplierName = p.getSupplier().getName();
        }
        dto.averageRating = p.getAverageRating();
        dto.reviewCount = p.getReviews() != null ? p.getReviews().size() : 0;
        return dto;
    }

    private static Map<String, String> parseSpecifications(String json) {
        if (json == null || json.isBlank()) return new LinkedHashMap<>();
        try {
            return OBJECT_MAPPER.readValue(json, new TypeReference<LinkedHashMap<String, String>>() {});
        } catch (Exception ignored) {
            return new LinkedHashMap<>();
        }
    }

    private static List<String> parseImages(String json, String primaryImage) {
        List<String> images = new ArrayList<>();
        if (primaryImage != null && !primaryImage.isBlank()) images.add(primaryImage);
        if (json != null && !json.isBlank()) {
            try {
                List<String> parsed = OBJECT_MAPPER.readValue(json, new TypeReference<List<String>>() {});
                for (String image : parsed) {
                    if (image != null && !image.isBlank() && !images.contains(image)) images.add(image);
                }
            } catch (Exception ignored) {
                // Keep the primary image fallback.
            }
        }
        return images;
    }

    public long getId() { return id; }
    public String getName() { return name; }
    public BigDecimal getPrice() { return price; }
    public String getImage() { return image; }
    public String getShortDesc() { return shortDesc; }
    public String getDetailDesc() { return detailDesc; }
    public long getQuantity() { return quantity; }
    public long getSold() { return sold; }
    public String getFactory() { return factory; }
    public String getTarget() { return target; }
    public Long getCategoryId() { return categoryId; }
    public String getCategoryName() { return categoryName; }
    public Long getSupplierId() { return supplierId; }
    public String getSupplierName() { return supplierName; }
    public String getSourceSite() { return sourceSite; }
    public String getSourceUrl() { return sourceUrl; }
    public Map<String, String> getSpecifications() { return specifications; }
    public List<String> getImages() { return images; }
    public double getAverageRating() { return averageRating; }
    public int getReviewCount() { return reviewCount; }
}
