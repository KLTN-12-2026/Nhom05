package com.example.demochatbot.dto;

public record ChatRequest(String message, String conversationId) {
    public ChatRequest(String message) { this(message, null); }
}
