package com.smartshop.demo.dto.product;

import java.util.List;

public class ProductImportPayload {
    private List<ProductImportItem> products;

    public List<ProductImportItem> getProducts() { return products; }
    public void setProducts(List<ProductImportItem> products) { this.products = products; }
}
