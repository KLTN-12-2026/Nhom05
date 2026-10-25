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
@Table(name = "membership_tier")
public class MembershipTier {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "tier_id")
    private int tierId;

    @Column(name = "tier_name", nullable = false, length = 100)
    private String tierName;

    @Column(name = "min_books_required")
    private Integer minBooksRequired = 0;

    @Column(name = "min_potato_required")
    private Integer minPotatoRequired = 0;

    @Column(name = "discount_percent")
    private Integer discountPercent = 0;

    @Column(name = "badge_icon", length = 100)
    private String badgeIcon;

    @Column(name = "description", length = 255)
    private String description;

    @OneToMany(mappedBy = "membershipTier")
    private List<Customer> customers;
}
