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

    @ManyToOne
    @JoinColumn(name = "orders_id" , referencedColumnName = "orders_id")
    private Orders orders;

    @ManyToOne
    @JoinColumn(name = "book_id" , referencedColumnName = "book_id")
    private Book book;
}
