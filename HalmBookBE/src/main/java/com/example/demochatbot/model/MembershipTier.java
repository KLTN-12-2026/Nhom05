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

    private Integer rankOrder;
    private Integer upgradeReward;
    @Column(columnDefinition = "TEXT")
    private String benefitsJson;

    public MembershipTier(int id, String name, Integer books, Integer points, Integer discount, String icon, String description, List<Customer> customers) {
        this.tierId = id; this.tierName = name; this.minBooksRequired = books; this.minPotatoRequired = points;
        this.discountPercent = discount; this.badgeIcon = icon; this.description = description; this.customers = customers;
    }

    @OneToMany(mappedBy = "membershipTier")
    @JsonIgnore
    private List<Customer> customers;
}
