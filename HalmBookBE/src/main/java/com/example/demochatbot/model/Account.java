package com.example.demochatbot.model;

import com.example.demochatbot.enums.Role;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "account")
public class Account {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "account_id")
    private int account_id;
    private String username;
    private String password;
    private String otpCode;
    private String provider;
    private LocalDateTime otpExpiration;

    @Column(name = "status")
    private String status = "ACTIVE";

    @OneToOne(mappedBy = "account" ,cascade = CascadeType.ALL)
    @JsonIgnore
    private Customer customer;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;
}
