package com.example.demochatbot.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "mission")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Mission {
    @Id @Column(length = 64)
    private String id;
    @Column(nullable = false, length = 150)
    private String title;
    @Column(nullable = false, length = 500)
    private String description;
    @Column(name = "condition_type", nullable = false, length = 40)
    private String condition;
    @Column(nullable = false, length = 20)
    private String period;
    private int targetValue;
    private int rewardPotato;
    private int rewardXp;
    private boolean active;
    private int orderIndex;
}
