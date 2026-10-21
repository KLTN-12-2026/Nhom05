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
@Table(name = "category")
public class Category {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "category_Id")
    private int category_id;
    private String category_name;

    @OneToMany(mappedBy = "category")
    private List<Book> books;

    @OneToMany(mappedBy = "category")
    private List<Promotion> promotions;
}

