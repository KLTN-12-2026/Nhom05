package com.example.demochatbot.controller;

import com.example.demochatbot.dto.ChatRequest;
import com.example.demochatbot.service.ai.ChatService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * Controller xử lý hội thoại với Trợ lý AI (HALM.AI)
 * Hỗ trợ cả người dùng đăng nhập lẫn khách vãng lai
 */
@RestController
@RequestMapping("/api")
public class ChatController {
    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    @PostMapping("/chat")
    public ResponseEntity<Map<String, String>> chat(
            @RequestBody ChatRequest chatRequest,
            Authentication authentication) {

        System.out.println("Đã truy cập vào chat!");
        System.out.println(chatRequest);

        if (chatRequest == null || chatRequest.message() == null || chatRequest.message().trim().isEmpty()) {
            Map<String, String> err = new HashMap<>();
            err.put("reply", "Vui lòng nhập nội dung câu hỏi!");
            return ResponseEntity.badRequest().body(err);
        }

        // Hỗ trợ cả người dùng đã đăng nhập lẫn độc giả vãng lai (guest)
        String accountId = (authentication != null && authentication.isAuthenticated() && authentication.getName() != null && !authentication.getName().equals("anonymousUser"))
                ? authentication.getName()
                : "guest_session";

        String aiResponse = chatService.chat(chatRequest, accountId);

        Map<String, String> response = new HashMap<>();
        response.put("reply", aiResponse);

        return ResponseEntity.ok(response);
    }
}
