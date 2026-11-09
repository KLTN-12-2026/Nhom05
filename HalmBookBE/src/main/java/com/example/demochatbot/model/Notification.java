package com.example.demochatbot.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Entity
@Table(name = "notification")
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "notification_id")
    private Long notificationId;

    @Column(name = "customer_id", nullable = false)
    private String customerId;

    private String title;

    @Column(columnDefinition = "TEXT")
    private String message;

    private String type; // "TOPUP", "RENT", "EXPIRING", "REWARD", "SYSTEM"
    private String link; // Ví dụ: "/canhan?tab=wallet", "/tusachcn"

    @Builder.Default
    private Boolean isRead = false;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
