package com.example.demochatbot.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Date;
import java.util.List;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "customer")
public class Customer {
    @Id
    @Column(name = "customer_id")
    private String customer_id;
    private String customerName;
    private String email;
    private String phoneNumber;
    private String address;
    @Column(columnDefinition = "TEXT")
    private String avatar;
    private boolean gender;
    private Date birthday;

    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;

    @Column(name = "potato_balance")
    private Integer potatoBalance = 0;

    @Column(name = "total_potato_earned")
    private Integer totalPotatoEarned = 0;

    @Column(name = "streak_days")
    private Integer streakDays = 0;

    @Column(name = "last_streak_date")
    private LocalDate lastStreakDate;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @ManyToOne
    @JoinColumn(name = "tier_id", referencedColumnName = "tier_id")
    private MembershipTier membershipTier;

    @OneToMany(mappedBy = "customer")
    @JsonIgnore
    private List<PotatoTransaction> potatoTransactions;

    @OneToMany(mappedBy = "customer")
    @JsonIgnore
    private List<ReadingNoteBookmark> readingNotes;

    @OneToOne(mappedBy = "customer")
    @JsonIgnore
    private Cart cart;

    @OneToMany(mappedBy = "customer")
    @JsonIgnore
    private List<Chat_Session> chatSession;

    @OneToMany(mappedBy = "customer")
    @JsonIgnore
    private List<Access_Record> accessRecords;

    @OneToMany(mappedBy = "customer")
    @JsonIgnore
    private List<Orders> orders;

    @OneToMany(mappedBy = "customer")
    @JsonIgnore
    private List<Evaluate> evaluates;

    @OneToOne
    @JoinColumn(name = "account_id" , referencedColumnName = "account_id")
    @JsonBackReference
    private Account account;
}
