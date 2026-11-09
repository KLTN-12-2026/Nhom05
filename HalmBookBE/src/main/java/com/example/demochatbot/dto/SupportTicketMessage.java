package com.example.demochatbot.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * ============================================================================
 * DTO: SupportTicketMessage
 * Dữ liệu đóng gói gửi qua RabbitMQ Message Broker
 * ============================================================================
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class SupportTicketMessage implements Serializable {

    private String code;
    private String customerId;
    private String senderName;
    private String senderEmail;
    private String senderPhone;
    private String category;
    private String priority;
    private String subject;
    private String message;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
