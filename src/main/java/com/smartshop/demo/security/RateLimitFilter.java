package com.smartshop.demo.security;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RateLimitFilter extends OncePerRequestFilter {
    private static final String RATE_LIMIT_MESSAGE = "Ban thao tac qua nhanh, vui long thu lai sau.";

    private final ObjectMapper objectMapper;
    private final StringRedisTemplate redisTemplate;
    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();
    private final List<Rule> rules = List.of(
            new Rule("/api/auth/login", 5, Duration.ofMinutes(1), KeyMode.IP, "login"),
            new Rule("/api/auth/register", 5, Duration.ofMinutes(10), KeyMode.IP, "register"),
            new Rule("/api/auth/register/request-otp", 3, Duration.ofMinutes(5), KeyMode.EMAIL, "registration-otp"),
            new Rule("/api/auth/send-otp", 3, Duration.ofMinutes(5), KeyMode.EMAIL, "send-otp"),
            new Rule("/api/auth/forgot-password", 3, Duration.ofMinutes(10), KeyMode.EMAIL, "forgot-password"),
            new Rule("/api/chat", 10, Duration.ofMinutes(1), KeyMode.USER_OR_IP, "chat")
    );

    public RateLimitFilter(ObjectMapper objectMapper, StringRedisTemplate redisTemplate) {
        this.objectMapper = objectMapper;
        this.redisTemplate = redisTemplate;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        if (HttpMethod.OPTIONS.matches(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        Rule rule = findRule(request);
        if (rule == null) {
            filterChain.doFilter(request, response);
            return;
        }

        HttpServletRequest requestToUse = request;
        String body = "";
        if (rule.keyMode == KeyMode.EMAIL) {
            CachedBodyHttpServletRequest cachedRequest = new CachedBodyHttpServletRequest(request);
            body = cachedRequest.bodyAsString();
            requestToUse = cachedRequest;
        }

        String key = rule.name + ":" + resolveKey(rule, requestToUse, body);
        if (!tryConsume(key, rule.maxRequests, rule.window)) {
            writeRateLimitResponse(response);
            return;
        }

        filterChain.doFilter(requestToUse, response);
    }

    private Rule findRule(HttpServletRequest request) {
        if (!HttpMethod.POST.matches(request.getMethod())) {
            return null;
        }
        String path = request.getRequestURI().substring(request.getContextPath().length());
        return rules.stream()
                .filter(rule -> rule.path.equals(path))
                .findFirst()
                .orElse(null);
    }

    private String resolveKey(Rule rule, HttpServletRequest request, String body) {
        return switch (rule.keyMode) {
            case IP -> clientIp(request);
            case EMAIL -> emailFromBody(body, clientIp(request));
            case USER_OR_IP -> currentUserOrIp(request);
        };
    }

    private String emailFromBody(String body, String fallback) {
        try {
            JsonNode node = objectMapper.readTree(body);
            JsonNode email = node.get("email");
            if (email != null && !email.asText().isBlank()) {
                return email.asText().trim().toLowerCase(Locale.ROOT);
            }
        } catch (Exception ignored) {
        }
        return fallback;
    }

    private String currentUserOrIp(HttpServletRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()
                && authentication.getName() != null && !"anonymousUser".equals(authentication.getName())) {
            return authentication.getName().toLowerCase(Locale.ROOT);
        }
        return clientIp(request);
    }

    private String clientIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private boolean tryConsume(String key, int maxRequests, Duration window) {
        try {
            String redisKey = "ratelimit:" + key;
            Long currentCount = redisTemplate.opsForValue().increment(redisKey);
            if (currentCount != null && currentCount == 1) {
                redisTemplate.expire(redisKey, window);
            }
            return currentCount != null && currentCount <= maxRequests;
        } catch (Exception e) {
            logger.warn(String.format("Redis rate limiter failed for key %s, falling back to local memory: %s", key, e.getMessage()));
            return tryConsumeLocal(key, maxRequests, window);
        }
    }

    private boolean tryConsumeLocal(String key, int maxRequests, Duration window) {
        long now = System.currentTimeMillis();
        Bucket bucket = buckets.compute(key, (ignored, current) -> {
            if (current == null || current.resetAt <= now) {
                return new Bucket(1, now + window.toMillis());
            }
            current.count++;
            return current;
        });
        return bucket.count <= maxRequests;
    }

    @Scheduled(fixedDelay = 300000) // Chạy mỗi 5 phút
    public void cleanExpiredLocalBuckets() {
        long now = System.currentTimeMillis();
        int beforeSize = buckets.size();
        buckets.entrySet().removeIf(entry -> entry.getValue().resetAt <= now);
        int afterSize = buckets.size();
        if (beforeSize != afterSize && logger.isDebugEnabled()) {
            logger.debug(String.format("Cleaned up %d expired rate limit local buckets. Remaining: %d", beforeSize - afterSize, afterSize));
        }
    }

    private void writeRateLimitResponse(HttpServletResponse response) throws IOException {
        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        objectMapper.writeValue(response.getWriter(), Map.of("message", RATE_LIMIT_MESSAGE));
    }

    private record Rule(String path, int maxRequests, Duration window, KeyMode keyMode, String name) {
    }

    private enum KeyMode {
        IP,
        EMAIL,
        USER_OR_IP
    }

    private static class Bucket {
        private int count;
        private final long resetAt;

        private Bucket(int count, long resetAt) {
            this.count = count;
            this.resetAt = resetAt;
        }
    }
}
