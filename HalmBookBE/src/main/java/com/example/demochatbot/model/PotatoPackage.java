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
@Table(name = "potato_package")
public class PotatoPackage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "package_id")
    private int packageId;

    @Column(name = "package_name", nullable = false)
    private String packageName;

    @Column(name = "potato_amount", nullable = false)
    private int potatoAmount;

    @Column(name = "bonus_potato")
    private int bonusPotato = 0;

    @Column(name = "price_vnd", nullable = false)
    private double priceVnd;

    @Column(name = "badge_tag", length = 50)
    private String badgeTag;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
}
