package com.example.demochatbot.model;

import com.example.demochatbot.enums.Role;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Date;
import java.util.List;

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
    private LocalDateTime otpExpiration ;

    @OneToOne(mappedBy = "account" ,cascade = CascadeType.ALL)
    private  Customer customer;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;
}
