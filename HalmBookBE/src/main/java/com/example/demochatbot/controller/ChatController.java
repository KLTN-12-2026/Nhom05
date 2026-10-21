package com.example.demochatbot.controller;

import com.example.demochatbot.dto.ChatRequest;
import com.example.demochatbot.service.ai.ChatService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

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

        if (authentication == null
                || !authentication.isAuthenticated()
                || authentication.getName() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String accountId = authentication.getName();

        String aiResponse = chatService.chat(chatRequest, accountId);

        Map<String, String> response = new HashMap<>();
        response.put("reply", aiResponse);

        return ResponseEntity.ok(response);
    }
}
