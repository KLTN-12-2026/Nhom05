package com.example.demochatbot.dto;

public record MomoTopupResponse(
        String orderId,
        String status,
        String packageName,
        long amountVnd,
        int potatoAmount,
        String payUrl,
        String deeplink,
        String redirectUrl
) {
}
