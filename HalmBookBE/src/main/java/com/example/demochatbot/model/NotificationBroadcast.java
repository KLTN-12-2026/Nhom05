package com.example.demochatbot.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@Entity
@Table(name = "notification_broadcast")
public class NotificationBroadcast {
    @Id @Column(name = "request_id", length = 36)
    private String requestId;
    @Column(name = "admin_username", nullable = false)
    private String adminUsername;
    @Column(nullable = false, length = 64)
    private String fingerprint;
    @Column(nullable = false, length = 150)
    private String title;
    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;
    @Column(nullable = false, length = 16)
    private String target;
    @Column(nullable = false)
    private String link;
    @Column(name = "sent_count", nullable = false)
    private int sentCount;
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}
