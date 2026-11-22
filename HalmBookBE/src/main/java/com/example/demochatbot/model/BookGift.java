package com.example.demochatbot.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "book_gift")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookGift {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "gift_id")
    private Long giftId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_customer_id", referencedColumnName = "customer_id", nullable = false)
    @JsonIgnore
    private Customer sender;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "receiver_customer_id", referencedColumnName = "customer_id", nullable = false)
    @JsonIgnore
    private Customer receiver;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "book_id", referencedColumnName = "book_id", nullable = false)
    private Book book;

    @Column(name = "plan_key", length = 50)
    private String planKey;

    @Column(name = "rental_days")
    private Integer rentalDays;

    @Column(name = "potato_price", nullable = false)
    private Integer potatoPrice;

    @Column(name = "message", columnDefinition = "TEXT")
    private String message;

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
