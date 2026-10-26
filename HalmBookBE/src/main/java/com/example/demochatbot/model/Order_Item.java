package com.example.demochatbot.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "order_item")
public class Order_Item {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int order_item_id;

    @Column(name = "duration_days")
    private Integer durationDays = 30;

    @Column(name = "rental_type")
    private String rentalType = "RENT"; // 'RENT' hoặc 'BUY'

    @Column(name = "price")
    private Double price = 0.0;

    @ManyToOne
    @JoinColumn(name = "orders_id" , referencedColumnName = "orders_id")
    private Orders orders;

    @ManyToOne
    @JoinColumn(name = "book_id" , referencedColumnName = "book_id")
    private Book book;
}
