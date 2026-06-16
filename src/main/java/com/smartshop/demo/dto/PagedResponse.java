package com.smartshop.demo.dto;

import org.springframework.data.domain.Page;

import java.util.List;

public class PagedResponse<T> {
    private List<T> content;
    private int page;
    private int size;
    private long totalElements;
    private int totalPages;
    private boolean last;

    public static <T> PagedResponse<T> of(Page<T> pageData) {
        PagedResponse<T> res = new PagedResponse<>();
        res.content = pageData.getContent();
        res.page = pageData.getNumber();
        res.size = pageData.getSize();
        res.totalElements = pageData.getTotalElements();
        res.totalPages = pageData.getTotalPages();
        res.last = pageData.isLast();
        return res;
    }

    public List<T> getContent() { return content; }
    public int getPage() { return page; }
    public int getSize() { return size; }
    public long getTotalElements() { return totalElements; }
    public int getTotalPages() { return totalPages; }
    public boolean isLast() { return last; }
}
