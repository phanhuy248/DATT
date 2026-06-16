package com.smartshop.demo.service;

import com.smartshop.demo.domain.Product;
import com.smartshop.demo.domain.User;
import com.smartshop.demo.domain.ViewHistory;
import com.smartshop.demo.dto.product.ProductDTO;
import com.smartshop.demo.repository.ProductRepository;
import com.smartshop.demo.repository.UserRepository;
import com.smartshop.demo.repository.ViewHistoryRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class RecommendationService {

    private final ProductRepository productRepository;
    private final ViewHistoryRepository viewHistoryRepository;
    private final UserRepository userRepository;

    public RecommendationService(ProductRepository productRepository,
                                 ViewHistoryRepository viewHistoryRepository,
                                 UserRepository userRepository) {
        this.productRepository = productRepository;
        this.viewHistoryRepository = viewHistoryRepository;
        this.userRepository = userRepository;
    }

    // Related products: cùng category, sort theo bestseller
    @Transactional(readOnly = true)
    public List<ProductDTO> getRelatedProducts(long productId, int limit) {
        Product product = productRepository.findById(productId).orElse(null);
        if (product == null || product.getCategory() == null) return List.of();

        return productRepository
                .findRelatedProducts(product.getCategory().getId(), productId, PageRequest.of(0, limit))
                .stream().map(ProductDTO::from).toList();
    }

    // Ghi lại lịch sử xem (upsert: xóa record cũ rồi insert mới để cập nhật viewedAt)
    @Transactional
    public void recordView(long userId, long productId) {
        if (viewHistoryRepository.existsByUserIdAndProductId(userId, productId)) {
            viewHistoryRepository.deleteByUserIdAndProductId(userId, productId);
        }
        User user = userRepository.findById(userId).orElse(null);
        Product product = productRepository.findById(productId).orElse(null);
        if (user == null || product == null) return;

        ViewHistory history = new ViewHistory();
        history.setUser(user);
        history.setProduct(product);
        viewHistoryRepository.save(history);
    }

    // Personalized recommendation: dựa trên category user hay xem, loại trừ sản phẩm đã xem gần đây
    @Transactional(readOnly = true)
    public List<ProductDTO> getPersonalizedRecommendations(long userId, int limit) {
        List<Long> topCategoryIds = viewHistoryRepository.findTopCategoryIdsByUserId(userId);

        if (topCategoryIds.isEmpty()) {
            // Fallback: trả về bestsellers khi chưa có lịch sử
            return productRepository.findTopSellingProducts(PageRequest.of(0, limit))
                    .stream().map(ProductDTO::from).toList();
        }

        // Loại trừ 20 sản phẩm user đã xem gần nhất
        List<Long> recentlyViewedIds = viewHistoryRepository
                .findRecentlyViewedProductIds(userId, PageRequest.of(0, 20));
        List<Long> excludeIds = recentlyViewedIds.isEmpty() ? List.of(-1L) : recentlyViewedIds;

        return productRepository
                .findRecommendedProducts(topCategoryIds, excludeIds, PageRequest.of(0, limit))
                .stream().map(ProductDTO::from).toList();
    }
}
