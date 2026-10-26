package com.example.demochatbot.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "orders")
public class Orders {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int orders_id;
    private double total_amount;

    @Column(name = "payment_currency")
    private String paymentCurrency = "VND"; // 'VND' hoặc 'POTATO'

    @Column(name = "order_type")
    private String orderType = "RENT_BOOK"; // 'RENT_BOOK', 'TOPUP_POTATO', 'BUY_BOOK'

    private LocalDateTime order_date = LocalDateTime.now();
    private String payment_status;
    private String payment_method;
    private String transaction_no;
    private double discount_amount;

    @ManyToOne
    @JoinColumn(name = "promotion_id" , referencedColumnName = "promotion_id")
    private Promotion promotion;

    @ManyToOne
    @JoinColumn(name = "customer_id" , referencedColumnName = "customer_id")
    private Customer customer;

    @OneToMany(mappedBy = "orders")
    private List<Order_Item> order_items;
}
