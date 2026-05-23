package com.example.demo.service;

import com.example.demo.domain.Category;
import com.example.demo.domain.Product;
import com.example.demo.repository.CategoryRepository;
import com.example.demo.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.text.NumberFormat;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class ChatbotService {

    @Value("${app.gemini.api-key}")
    private String apiKey;

    @Value("${app.gemini.model:gemini-1.5-flash}")
    private String model;

    private final RestClient restClient;
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    public ChatbotService(CategoryRepository categoryRepository,
                          ProductRepository productRepository) {
        this.restClient = RestClient.builder()
                .baseUrl("https://generativelanguage.googleapis.com")
                .build();
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
    }

    public String chat(String userMessage) {
        if (apiKey == null || apiKey.isBlank()) {
            return "Chatbot chưa được cấu hình API key. Vui lòng liên hệ quản trị viên để được hỗ trợ.";
        }
        String url = "/v1beta/models/{model}:generateContent?key={key}";

        Map<String, Object> body = Map.of(
            "system_instruction", Map.of(
                "parts", List.of(Map.of("text", buildSystemPrompt()))
            ),
            "contents", List.of(
                Map.of("role", "user", "parts", List.of(Map.of("text", userMessage)))
            ),
            "generationConfig", Map.of("temperature", 0.7)
        );

        @SuppressWarnings("unchecked")
        Map<String, Object> response = restClient.post()
                .uri(url, model, apiKey)
                .header("Content-Type", "application/json")
                .body(body)
                .retrieve()
                .body(Map.class);

        return extractText(response);
    }

    @SuppressWarnings("unchecked")
    private String extractText(Map<String, Object> response) {
        List<Map<String, Object>> candidates = (List<Map<String, Object>>) response.get("candidates");
        if (candidates == null || candidates.isEmpty()) return "Xin lỗi, tôi không hiểu câu hỏi của bạn.";
        Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
        List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
        return (String) parts.get(0).get("text");
    }

    private String buildSystemPrompt() {
        List<Category> categories = categoryRepository.findAll();
        List<Product> topProducts = productRepository.findTopSellingProducts(PageRequest.of(0, 15));
        NumberFormat vnd = NumberFormat.getInstance(new Locale("vi", "VN"));

        StringBuilder sb = new StringBuilder();
        sb.append("""
                Bạn là trợ lý tư vấn bán hàng thông minh của SmartShop — cửa hàng bán thiết bị công nghệ uy tín.
                Nhiệm vụ của bạn là tư vấn sản phẩm, so sánh cấu hình, giải đáp thắc mắc về các thiết bị công nghệ.
                Hãy trả lời bằng tiếng Việt, thân thiện, ngắn gọn và chính xác.
                Chỉ tư vấn về các sản phẩm SmartShop đang có. Nếu khách hỏi ngoài phạm vi, hãy lịch sự từ chối.

                === DANH MỤC SẢN PHẨM HIỆN CÓ ===
                """);

        for (Category cat : categories) {
            sb.append("- ").append(cat.getName());
            if (cat.getDescription() != null && !cat.getDescription().isBlank())
                sb.append(": ").append(cat.getDescription());
            sb.append("\n");
        }

        sb.append("\n=== SẢN PHẨM NỔI BẬT ===\n");
        for (Product p : topProducts) {
            sb.append("- ").append(p.getName())
              .append(" | Giá: ").append(vnd.format(p.getPrice())).append(" VNĐ");
            if (p.getCategory() != null) sb.append(" | Danh mục: ").append(p.getCategory().getName());
            if (p.getFactory() != null && !p.getFactory().isBlank()) sb.append(" | Hãng: ").append(p.getFactory());
            sb.append(p.getQuantity() > 0 ? " | Còn hàng" : " | Hết hàng").append("\n");
        }

        sb.append("""

                Lưu ý:
                - Dựa vào danh sách trên để tư vấn, không bịa đặt thông tin.
                - Có thể gợi ý khách xem thêm tại website SmartShop.
                - Luôn kết thúc bằng lời mời khách hỏi thêm.
                """);
        return sb.toString();
    }
}
