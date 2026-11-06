package com.example.demochatbot.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
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

    @JsonIgnore
    @OneToMany(mappedBy = "category")
    private List<Book> books;

    @JsonIgnore
    @OneToMany(mappedBy = "category")
    private List<Promotion> promotions;
}
