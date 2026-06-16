package com.smartshop.demo.dto.seed;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class DummyProductResponse {

    private List<DummyProduct> products;
    private int total;
    private int skip;
    private int limit;

    public List<DummyProduct> getProducts() { return products; }
    public void setProducts(List<DummyProduct> products) { this.products = products; }

    public int getTotal() { return total; }
    public void setTotal(int total) { this.total = total; }

    public int getSkip() { return skip; }
    public void setSkip(int skip) { this.skip = skip; }

    public int getLimit() { return limit; }
    public void setLimit(int limit) { this.limit = limit; }
}
