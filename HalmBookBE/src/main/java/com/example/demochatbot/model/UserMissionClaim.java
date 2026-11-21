package com.example.demochatbot.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Entity
@Table(name = "user_mission_claim", uniqueConstraints = @UniqueConstraint(name = "uk_mission_claim_key", columnNames = "claim_key"))
public class UserMissionClaim {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "customer_id", nullable = false)
    private String customerId;

    @Column(name = "mission_id", nullable = false)
    private String missionId;

    @Column(name = "claim_date", nullable = false)
    private LocalDate claimDate;

    @Column(name = "reward_potato")
    private Integer rewardPotato;

    @Column(name = "claim_key", length = 64)
    private String claimKey;
    private Integer rewardXp;
    @Column(length = 150)
    private String missionTitle;
    @Column(length = 20)
    private String missionPeriod;
    private Integer balanceAfter;

    @Builder.Default
    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
}
