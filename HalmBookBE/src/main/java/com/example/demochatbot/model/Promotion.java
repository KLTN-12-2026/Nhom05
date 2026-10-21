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
@Table(name = "promotion")
public class Promotion {
    @Id
    private String promotion_id;
    private String promotion_name;
    private String description;
    private int discount_percent;
    private int discount_amount;
    private LocalDateTime start_date;
    private LocalDateTime end_date;
    private String status;

    @ManyToOne
    @JoinColumn(name = "category_id" , referencedColumnName = "category_id")
    private Category category;

    @OneToMany(mappedBy = "promotion")
    private List<Orders> orders;

}
