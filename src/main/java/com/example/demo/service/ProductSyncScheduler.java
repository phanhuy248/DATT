package com.example.demo.service;

import com.example.demo.dto.product.ProductImportResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.nio.file.Path;
import java.time.Duration;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Service
public class ProductSyncScheduler {
    private static final Logger log = LoggerFactory.getLogger(ProductSyncScheduler.class);

    private final ProductImportService productImportService;

    @Value("${app.product-sync.enabled:false}")
    private boolean enabled;

    @Value("${app.product-sync.run-on-startup:false}")
    private boolean runOnStartup;

    @Value("${app.product-sync.file:crawler/output/products.json}")
    private String importFile;

    @Value("${app.product-sync.command:}")
    private String syncCommand;

    @Value("${app.product-sync.working-dir:.}")
    private String workingDir;

    @Value("${app.product-sync.command-timeout-minutes:30}")
    private long commandTimeoutMinutes;

    public ProductSyncScheduler(ProductImportService productImportService) {
        this.productImportService = productImportService;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void runOnStartup() {
        if (enabled && runOnStartup) syncProducts();
    }

    @Scheduled(cron = "${app.product-sync.cron:0 0 3 * * *}", zone = "${app.product-sync.zone:Asia/Ho_Chi_Minh}")
    public void scheduledSync() {
        if (enabled) syncProducts();
    }

    public void syncProducts() {
        try {
            runCrawlerCommandIfConfigured();
            ProductImportResult result = productImportService.importFromFile(Path.of(importFile));
            log.info("[ProductSync] Imported products from {}: created={}, updated={}, skipped={}",
                    importFile, result.getCreated(), result.getUpdated(), result.getSkipped());
        } catch (Exception e) {
            log.error("[ProductSync] Sync failed: {}", e.getMessage(), e);
        }
    }

    private void runCrawlerCommandIfConfigured() throws Exception {
        if (syncCommand == null || syncCommand.isBlank()) return;
        ProcessBuilder builder = new ProcessBuilder(shellCommand(syncCommand));
        builder.directory(Path.of(workingDir).toFile());
        builder.redirectOutput(ProcessBuilder.Redirect.DISCARD);
        builder.redirectError(ProcessBuilder.Redirect.DISCARD);
        Process process = builder.start();
        boolean finished = process.waitFor(commandTimeoutMinutes, TimeUnit.MINUTES);
        if (!finished) {
            process.destroyForcibly();
            throw new IllegalStateException("Crawler command timed out after " + Duration.ofMinutes(commandTimeoutMinutes));
        }
        if (process.exitValue() != 0) {
            throw new IllegalStateException("Crawler command failed with code " + process.exitValue());
        }
    }

    private List<String> shellCommand(String command) {
        String os = System.getProperty("os.name", "").toLowerCase();
        if (os.contains("win")) return List.of("cmd", "/c", command);
        return List.of("sh", "-c", command);
    }
}
