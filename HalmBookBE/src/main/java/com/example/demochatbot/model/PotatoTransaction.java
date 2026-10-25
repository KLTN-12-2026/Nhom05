package com.example.demochatbot.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "potato_transaction")
public class PotatoTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "trans_id")
    private int transId;

    @ManyToOne
    @JoinColumn(name = "customer_id", referencedColumnName = "customer_id", nullable = false)
    @JsonIgnore
    private Customer customer;

    @Column(name = "amount", nullable = false)
    private int amount; // Số khoai (+10, -9, +500...)

    @Column(name = "balance_after", nullable = false)
    private int balanceAfter;

    @Column(name = "type", nullable = false, length = 50)
    private String type; // TOPUP, RENT_BOOK, RENEW_BOOK, REWARD

    @Column(name = "description", length = 255)
    private String description;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
}
