package com.smartshop.demo.service;

import com.smartshop.demo.domain.FlashSaleItem;
import com.smartshop.demo.domain.Product;
import com.smartshop.demo.dto.flashsale.FlashSaleCreateRequest;
import com.smartshop.demo.dto.flashsale.FlashSaleDTO;
import com.smartshop.demo.dto.flashsale.FlashSaleUpdateRequest;
import com.smartshop.demo.exception.ResourceNotFoundException;
import com.smartshop.demo.repository.FlashSaleItemRepository;
import com.smartshop.demo.repository.ProductRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class FlashSaleService {

    private final FlashSaleItemRepository flashSaleItemRepository;
    private final ProductRepository productRepository;

    public FlashSaleService(FlashSaleItemRepository flashSaleItemRepository,
                            ProductRepository productRepository) {
        this.flashSaleItemRepository = flashSaleItemRepository;
        this.productRepository = productRepository;
    }

    @Transactional(readOnly = true)
    public List<FlashSaleDTO> getActiveItems() {
        return flashSaleItemRepository.findActiveItems(LocalDateTime.now())
                .stream()
                // Lọc bỏ flash sale mà salePrice >= giá hiện tại (stale data do admin đổi giá sản phẩm)
                .filter(f -> f.getSalePrice().compareTo(f.getProduct().getPrice()) < 0)
                .map(FlashSaleDTO::from).toList();
    }

    @Transactional(readOnly = true)
    public Page<FlashSaleDTO> getAllAdmin(Pageable pageable) {
        return flashSaleItemRepository.findAllByOrderBySortOrderAscCreatedAtDesc(pageable)
                .map(FlashSaleDTO::from);
    }

    @Transactional
    public FlashSaleDTO create(FlashSaleCreateRequest req) {
        if (req.getProductId() == null)
            throw new IllegalArgumentException("productId là bắt buộc");

        Product product = productRepository.findById(req.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm id=" + req.getProductId()));

        if (flashSaleItemRepository.existsByProductId(req.getProductId()))
            throw new IllegalStateException("Sản phẩm đã có bản ghi flash sale. Sửa hoặc xóa bản ghi hiện có.");

        validate(req.getSalePrice(), product.getPrice(), req.getStartAt(), req.getEndAt());

        FlashSaleItem item = new FlashSaleItem();
        item.setProduct(product);
        item.setSalePrice(req.getSalePrice());
        item.setStartAt(req.getStartAt());
        item.setEndAt(req.getEndAt());
        item.setQuantityLimit(req.getQuantityLimit());
        item.setActive(req.getActive() != null ? req.getActive() : true);
        item.setSortOrder(req.getSortOrder() != null ? req.getSortOrder() : 0);

        return FlashSaleDTO.from(flashSaleItemRepository.save(item));
    }

    @Transactional
    public FlashSaleDTO update(Long id, FlashSaleUpdateRequest req) {
        FlashSaleItem item = flashSaleItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy flash sale id=" + id));

        BigDecimal newSalePrice = req.getSalePrice() != null ? req.getSalePrice() : item.getSalePrice();
        LocalDateTime newStartAt = req.getStartAt() != null ? req.getStartAt() : item.getStartAt();
        LocalDateTime newEndAt   = req.getEndAt()   != null ? req.getEndAt()   : item.getEndAt();

        validate(newSalePrice, item.getProduct().getPrice(), newStartAt, newEndAt);

        item.setSalePrice(newSalePrice);
        item.setStartAt(newStartAt);
        item.setEndAt(newEndAt);
        if (Boolean.TRUE.equals(req.getClearQuantityLimit())) {
            item.setQuantityLimit(null);
        } else if (req.getQuantityLimit() != null) {
            item.setQuantityLimit(req.getQuantityLimit());
        }
        if (req.getActive() != null) item.setActive(req.getActive());
        if (req.getSortOrder()     != null) item.setSortOrder(req.getSortOrder());

        return FlashSaleDTO.from(flashSaleItemRepository.save(item));
    }

    @Transactional
    public void delete(Long id) {
        if (!flashSaleItemRepository.existsById(id))
            throw new ResourceNotFoundException("Không tìm thấy flash sale id=" + id);
        flashSaleItemRepository.deleteById(id);
    }

    private void validate(BigDecimal salePrice, BigDecimal originalPrice,
                          LocalDateTime startAt, LocalDateTime endAt) {
        if (salePrice == null || salePrice.compareTo(BigDecimal.ZERO) <= 0)
            throw new IllegalArgumentException("Giá sale phải lớn hơn 0");
        if (originalPrice != null && salePrice.compareTo(originalPrice) >= 0)
            throw new IllegalArgumentException("Giá sale phải nhỏ hơn giá gốc (" + originalPrice + ")");
        if (startAt == null || endAt == null)
            throw new IllegalArgumentException("Thời gian bắt đầu và kết thúc là bắt buộc");
        if (!endAt.isAfter(startAt))
            throw new IllegalArgumentException("Thời gian kết thúc phải sau thời gian bắt đầu");
    }
}
