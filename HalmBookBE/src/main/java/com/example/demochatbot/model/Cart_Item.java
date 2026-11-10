package com.example.demochatbot.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(
        name = "cart_item",
        uniqueConstraints = @UniqueConstraint(name = "uk_cart_book", columnNames = {"cart_id", "book_id"})
)
public class Cart_Item {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int cart_item_id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cart_id", referencedColumnName = "cart_id", nullable = false)
    private Cart cart;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "book_id", referencedColumnName = "book_id", nullable = false)
    private Book book;

    @Column(name = "plan_key")
    private String planKey = "7";

    @Column(name = "rental_days", nullable = false)
    private Integer rentalDays = 7;

    @Column(name = "selected_price")
    private Double selectedPrice = 0.0;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PrePersist
    protected void onCreate() {
        if (this.rentalDays == null || this.rentalDays <= 0) {
            this.rentalDays = 7;
        }
        if (this.planKey == null || this.planKey.trim().isEmpty()) {
            this.planKey = String.valueOf(this.rentalDays);
        }
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
