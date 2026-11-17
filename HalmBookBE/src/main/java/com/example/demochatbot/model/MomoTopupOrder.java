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
        name = "momo_topup_order",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_momo_topup_order_id", columnNames = "order_id"),
                @UniqueConstraint(name = "uk_momo_topup_request_id", columnNames = "request_id")
        },
        indexes = @Index(name = "idx_momo_topup_customer", columnList = "customer_id")
)
public class MomoTopupOrder {

    public enum Status {
        PENDING,
        PAID,
        FAILED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_id", nullable = false, length = 50)
    private String orderId;

    @Column(name = "request_id", nullable = false, length = 50)
    private String requestId;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", referencedColumnName = "customer_id", nullable = false)
    private Customer customer;

    @Column(name = "package_id", nullable = false)
    private Integer packageId;

    @Column(name = "package_name", nullable = false, length = 120)
    private String packageName;

    @Column(name = "amount_vnd", nullable = false)
    private long amountVnd;

    @Column(name = "potato_amount", nullable = false)
    private int potatoAmount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status;

    @Column(name = "gateway_transaction_id", unique = true, length = 80)
    private String gatewayTransactionId;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;
}
