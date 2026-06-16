package com.smartshop.demo.dto.product;

import java.util.ArrayList;
import java.util.List;

public class ProductImportResult {
    private int total;
    private int created;
    private int updated;
    private int skipped;
    private List<String> errors = new ArrayList<>();

    public void markCreated() { created++; total++; }
    public void markUpdated() { updated++; total++; }
    public void markSkipped(String reason) {
        skipped++;
        total++;
        if (reason != null && !reason.isBlank()) errors.add(reason);
    }

    public int getTotal() { return total; }
    public int getCreated() { return created; }
    public int getUpdated() { return updated; }
    public int getSkipped() { return skipped; }
    public List<String> getErrors() { return errors; }
}
