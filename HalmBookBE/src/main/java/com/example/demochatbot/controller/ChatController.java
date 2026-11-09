package com.example.demochatbot.controller;

import com.example.demochatbot.dto.ChatRequest;
import com.example.demochatbot.service.ai.ChatService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Controller xử lý hội thoại với Linh vật Khoai Nhỏ HALM (Mascot AI)
 * Hỗ trợ lưu trữ lịch sử chat vào MySQL và truy vấn dữ liệu đa bảng (Sách, Gói Khoai, Đánh giá, Hạng thành viên)
 */
@RestController
@RequestMapping("/api/chat")
@CrossOrigin(origins = "*")
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    /**
     * API 1: Gửi tin nhắn và nhận câu trả lời thông minh từ Khoai Nhỏ AI
     * Endpoint: POST /api/chat
     */
    @PostMapping
    public ResponseEntity<Map<String, String>> chat(
            @RequestBody ChatRequest chatRequest,
            Authentication authentication) {

        if (chatRequest == null || chatRequest.message() == null || chatRequest.message().trim().isEmpty()) {
            Map<String, String> err = new HashMap<>();
            err.put("reply", "Vui lòng nhập nội dung câu hỏi!");
            return ResponseEntity.badRequest().body(err);
        }

        String accountId = (authentication != null && authentication.isAuthenticated() && authentication.getName() != null && !authentication.getName().equals("anonymousUser"))
                ? authentication.getName()
                : "guest_session";

        String aiResponse = chatService.chat(chatRequest, accountId);

        Map<String, String> response = new HashMap<>();
        response.put("reply", aiResponse);

        return ResponseEntity.ok(response);
    }

    /**
     * API 2: Lấy lịch sử hội thoại đã lưu trong Database của độc giả
     * Endpoint: GET /api/chat/history
     */
    @GetMapping("/history")
    public ResponseEntity<List<Map<String, Object>>> getChatHistory(Authentication authentication) {
        String accountId = (authentication != null && authentication.isAuthenticated() && authentication.getName() != null && !authentication.getName().equals("anonymousUser"))
                ? authentication.getName()
                : null;

        if (accountId == null) {
            return ResponseEntity.ok(List.of());
        }

        List<Map<String, Object>> history = chatService.getChatHistory(accountId);
        return ResponseEntity.ok(history);
    }
}
