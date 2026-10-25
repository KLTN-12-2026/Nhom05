package com.example.demochatbot.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
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
@Table(name = "evaluate")
public class Evaluate {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "evaluate_id")
    private int evaluate_id;
    private int star;
    private String content;

    @Column(name = "likes_count")
    private Integer likesCount = 0;

    @ManyToOne
    @JoinColumn(name = "parent_id", referencedColumnName = "evaluate_id")
    @JsonIgnore
    private Evaluate parent;

    @OneToMany(mappedBy = "parent", cascade = CascadeType.ALL)
    private List<Evaluate> replies;

    private LocalDateTime created_at = LocalDateTime.now();

    @ManyToOne
    @JoinColumn(name = "customer_id" , referencedColumnName = "customer_id")
    private Customer customer;

    @ManyToOne
    @JoinColumn(name = "book_id" , referencedColumnName = "book_id")
    private Book book;
}
