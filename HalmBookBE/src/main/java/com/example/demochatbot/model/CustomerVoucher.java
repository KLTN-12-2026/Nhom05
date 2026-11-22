package com.example.demochatbot.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "customer_voucher")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomerVoucher {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", referencedColumnName = "customer_id", nullable = false)
    @JsonIgnore
    private Customer customer;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "promotion_id", referencedColumnName = "promotion_id")
    private Promotion promotion;

    @Column(name = "code", nullable = false, length = 100)
    private String code;

    @Column(name = "title", length = 255)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "discount_percent")
    @Builder.Default
    private Integer discountPercent = 0;

    @Column(name = "discount_amount")
    @Builder.Default
    private Integer discountAmount = 0;

    @Column(name = "min_order_value")
    @Builder.Default
    private Integer minOrderValue = 0;

    @Column(name = "is_used")
    @Builder.Default
    private Boolean isUsed = false;

    @Column(name = "used_at")
    private LocalDateTime usedAt;

    @Column(name = "saved_at")
    @Builder.Default
    private LocalDateTime savedAt = LocalDateTime.now();

    @Column(name = "start_date")
    private LocalDateTime startDate;

    @Column(name = "end_date")
    private LocalDateTime endDate;

    @Column(name = "is_exclusive")
    @Builder.Default
    private Boolean isExclusive = false;

    @Column(name = "exclusive_note", length = 255)
    private String exclusiveNote;
}
