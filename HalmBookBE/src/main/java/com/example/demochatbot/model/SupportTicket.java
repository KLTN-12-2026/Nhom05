package com.example.demochatbot.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * ============================================================================
 * ENTITY: SupportTicket
 * Quản lý yêu cầu hỗ trợ, khiếu nại và phản hồi từ độc giả
 * ============================================================================
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Entity
@Table(name = "support_ticket")
public class SupportTicket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ticket_id")
    private Long ticketId;

    @Column(name = "ticket_code", length = 50, unique = true)
    private String code;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", referencedColumnName = "customer_id")
    @JsonIgnore
    private Customer customer;

    @Column(name = "sender_name", length = 150)
    private String senderName;

    @Column(name = "sender_email", length = 150)
    private String senderEmail;

    @Column(name = "sender_phone", length = 50)
    private String senderPhone;

    @Column(name = "category", length = 50)
    @Builder.Default
    private String category = "OTHER"; // PAYMENT, READING, ACCOUNT, COPYRIGHT, OTHER

    @Column(name = "priority", length = 20)
    @Builder.Default
    private String priority = "NORMAL"; // LOW, NORMAL, HIGH, URGENT

    @Column(name = "subject", length = 255)
    private String subject;

    @Column(name = "message", columnDefinition = "TEXT")
    private String message;

    @Column(name = "status", length = 30)
    @Builder.Default
    private String status = "pending"; // pending, in_progress, resolved, closed

    @Column(name = "admin_reply", columnDefinition = "TEXT")
    private String adminReply;

    @Column(name = "chat_history", columnDefinition = "LONGTEXT")
    private String chatHistory;

    @Column(name = "reply_at")
    private LocalDateTime replyAt;

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PrePersist
    public void prePersist() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        if (this.updatedAt == null) {
            this.updatedAt = LocalDateTime.now();
        }
        if (this.status == null) {
            this.status = "pending";
        }
        if (this.code == null || this.code.isEmpty()) {
            this.code = "TK-" + System.currentTimeMillis() % 1000000;
        }
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
