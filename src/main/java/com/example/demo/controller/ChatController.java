package com.example.demo.controller;

import com.example.demo.dto.ApiResponse;
import com.example.demo.dto.chat.ChatRequest;
import com.example.demo.dto.chat.ChatResponse;
import com.example.demo.service.ChatbotService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private static final Logger log = LoggerFactory.getLogger(ChatController.class);

    private final ChatbotService chatbotService;

    public ChatController(ChatbotService chatbotService) {
        this.chatbotService = chatbotService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ChatResponse>> chat(@Valid @RequestBody ChatRequest request) {
        try {
            String reply = chatbotService.chat(request.getMessage());
            return ResponseEntity.ok(ApiResponse.ok(new ChatResponse(reply)));
        } catch (Exception e) {
            log.error("Chatbot error: {}", e.getMessage());
            String fallback = "Xin lỗi, trợ lý AI đang tạm thời không khả dụng. Vui lòng liên hệ hotline 0911 430 000 để được hỗ trợ.";
            return ResponseEntity.ok(ApiResponse.ok(new ChatResponse(fallback)));
        }
    }
}
