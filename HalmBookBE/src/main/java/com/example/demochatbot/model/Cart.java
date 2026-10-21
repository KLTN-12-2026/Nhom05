package com.example.demochatbot.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "cart")
public class Cart {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int cart_id;

    @OneToOne
    @JoinColumn(name = "customer_id" , referencedColumnName = "customer_id")
    private Customer customer;

    @OneToMany(mappedBy = "cart")
    private List<Cart_Item> cart_items;
}
