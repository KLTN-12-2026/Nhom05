package com.example.demochatbot.dto;

public record MomoTopupStatusResponse(
        String orderId,
        String status,
        String packageName,
        long amountVnd,
        int potatoAmount,
        String gatewayTransactionId
) {
}
