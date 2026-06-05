package com.example.demo.service;

import com.example.demo.domain.Category;
import com.example.demo.domain.Product;
import com.example.demo.repository.CategoryRepository;
import com.example.demo.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.text.Normalizer;
import java.text.NumberFormat;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class ChatbotService {
    private static final Locale VI_LOCALE = new Locale("vi", "VN");
    private static final Pattern MILLION_BUDGET_PATTERN = Pattern.compile("(\\d{1,3})\\s*(trieu|triệu|tr|m)\\b");
    private static final Pattern RAW_NUMBER_PATTERN = Pattern.compile("\\b(\\d{7,10})\\b");

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
            return buildLocalReply(userMessage);
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

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restClient.post()
                    .uri(url, model, apiKey)
                    .header("Content-Type", "application/json")
                    .body(body)
                    .retrieve()
                    .body(Map.class);

            String reply = extractText(response);
            return reply == null || reply.isBlank() ? buildLocalReply(userMessage) : reply;
        } catch (Exception ex) {
            return buildLocalReply(userMessage);
        }
    }

    @SuppressWarnings("unchecked")
    private String extractText(Map<String, Object> response) {
        List<Map<String, Object>> candidates = (List<Map<String, Object>>) response.get("candidates");
        if (candidates == null || candidates.isEmpty()) return "Xin lỗi, tôi không hiểu câu hỏi của bạn.";
        Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
        List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
        return (String) parts.get(0).get("text");
    }

    private String buildLocalReply(String userMessage) {
        String normalized = normalize(userMessage);
        if (isGreeting(normalized)) {
            return """
                    Chào bạn, tôi là trợ lý SmartShop. Bạn có thể hỏi tôi về laptop, điện thoại, phụ kiện, giá bán, tồn kho, bảo hành hoặc cách đặt hàng.
                    Ví dụ: "Tư vấn laptop dưới 20 triệu" hoặc "Có điện thoại Samsung nào không?"
                    """;
        }

        if (containsAny(normalized, "bao hanh", "doi tra", "hoan tien")) {
            return "SmartShop hỗ trợ bảo hành theo chính sách của hãng và cửa hàng. Khi cần bảo hành/đổi trả, bạn nên giữ hóa đơn hoặc mã đơn hàng. Với sản phẩm lỗi kỹ thuật, admin sẽ kiểm tra tình trạng đơn và hỗ trợ xử lý.";
        }
        if (containsAny(normalized, "giao hang", "van chuyen", "ship", "shipping")) {
            return "SmartShop hỗ trợ giao hàng toàn quốc. Phí vận chuyển đang được hiển thị là miễn phí ở bước checkout demo. Sau khi đặt hàng, bạn có thể theo dõi trạng thái trong mục Lịch sử đơn hàng.";
        }
        if (containsAny(normalized, "thanh toan", "momo", "chuyen khoan", "cod", "tra tien")) {
            return "Hiện website hỗ trợ COD, chuyển khoản ngân hàng và MoMo ở mức mô phỏng cơ bản. Với COD, đơn sẽ được đánh dấu đã thanh toán khi giao thành công.";
        }
        if (containsAny(normalized, "lien he", "hotline", "tu van vien", "support")) {
            return "Bạn có thể liên hệ SmartShop qua hotline 0911 430 000 hoặc gửi yêu cầu ở trang Liên hệ. Admin sẽ xem và đánh dấu xử lý trong khu vực quản trị.";
        }

        List<Product> products = findProductsForMessage(userMessage, normalized);
        BigDecimal maxBudget = extractBudget(normalized);
        if (maxBudget != null) {
            products = products.stream()
                    .filter(product -> product.getPrice() != null && product.getPrice().compareTo(maxBudget) <= 0)
                    .toList();
        }

        if (products.isEmpty()) {
            return """
                    Tôi chưa tìm thấy sản phẩm thật sự khớp với yêu cầu này trong dữ liệu hiện có.
                    Bạn có thể thử hỏi cụ thể hơn như "laptop gaming", "điện thoại Samsung", "phụ kiện dưới 1 triệu" hoặc vào trang Sản phẩm để lọc theo danh mục và giá.
                    """;
        }

        NumberFormat vnd = NumberFormat.getCurrencyInstance(VI_LOCALE);
        StringBuilder reply = new StringBuilder("Tôi gợi ý cho bạn một số sản phẩm đang có tại SmartShop:\n");
        products.stream().limit(4).forEach(product -> {
            reply.append("- ").append(product.getName())
                    .append(" | ").append(vnd.format(product.getPrice()))
                    .append(" | ").append(product.getQuantity() > 0 ? "Còn hàng" : "Hết hàng");
            if (product.getCategory() != null) reply.append(" | ").append(product.getCategory().getName());
            if (product.getFactory() != null && !product.getFactory().isBlank()) reply.append(" | ").append(product.getFactory());
            reply.append("\n");
        });
        reply.append("Bạn có thể mở trang Sản phẩm để xem chi tiết, thêm vào giỏ và đặt hàng.");
        return reply.toString();
    }

    private List<Product> findProductsForMessage(String originalMessage, String normalizedMessage) {
        List<String> keywords = new ArrayList<>();
        if (containsAny(normalizedMessage, "laptop", "may tinh xach tay", "notebook")) keywords.add("laptop");
        if (containsAny(normalizedMessage, "dien thoai", "phone", "smartphone", "iphone")) keywords.add("điện thoại");
        if (containsAny(normalizedMessage, "phu kien", "tai nghe", "chuot", "ban phim", "sac", "cap")) keywords.add("phụ kiện");
        if (containsAny(normalizedMessage, "gaming", "game")) keywords.add("gaming");
        if (containsAny(normalizedMessage, "apple", "iphone", "macbook")) keywords.add("Apple");
        if (containsAny(normalizedMessage, "samsung")) keywords.add("Samsung");
        if (containsAny(normalizedMessage, "asus")) keywords.add("ASUS");
        if (containsAny(normalizedMessage, "dell")) keywords.add("Dell");
        if (containsAny(normalizedMessage, "hp")) keywords.add("HP");
        if (containsAny(normalizedMessage, "xiaomi")) keywords.add("Xiaomi");

        for (String keyword : keywords) {
            List<Product> found = productRepository.searchForChat(keyword, PageRequest.of(0, 8));
            if (!found.isEmpty()) return found;
        }

        String cleaned = originalMessage == null ? "" : originalMessage.trim();
        if (cleaned.length() >= 3 && cleaned.length() <= 80) {
            List<Product> found = productRepository.searchForChat(cleaned, PageRequest.of(0, 8));
            if (!found.isEmpty()) return found;
        }
        return productRepository.findTopSellingProducts(PageRequest.of(0, 8));
    }

    private BigDecimal extractBudget(String normalizedMessage) {
        Matcher millionMatcher = MILLION_BUDGET_PATTERN.matcher(normalizedMessage);
        if (millionMatcher.find()) {
            return BigDecimal.valueOf(Long.parseLong(millionMatcher.group(1))).multiply(BigDecimal.valueOf(1_000_000));
        }
        Matcher rawNumberMatcher = RAW_NUMBER_PATTERN.matcher(normalizedMessage.replace(".", "").replace(",", ""));
        if (rawNumberMatcher.find()) {
            return new BigDecimal(rawNumberMatcher.group(1));
        }
        return null;
    }

    private boolean containsAny(String text, String... tokens) {
        for (String token : tokens) {
            if (text.contains(token)) return true;
        }
        return false;
    }

    private boolean isGreeting(String text) {
        return text.isBlank()
                || text.equals("hi")
                || text.equals("hello")
                || text.equals("hey")
                || text.equals("chao")
                || text.equals("xin chao")
                || text.startsWith("chao ban")
                || text.startsWith("xin chao ");
    }

    private String normalize(String text) {
        if (text == null) return "";
        String noAccent = Normalizer.normalize(text, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .replace('đ', 'd')
                .replace('Đ', 'D');
        return noAccent.toLowerCase(Locale.ROOT).trim();
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
