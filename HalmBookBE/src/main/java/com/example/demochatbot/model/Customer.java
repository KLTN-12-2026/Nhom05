package com.example.demochatbot.model;


import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

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

    @OneToOne(mappedBy = "customer")
    @JsonIgnore
    private Cart  cart;

    @OneToMany(mappedBy = "customer")
    @JsonIgnore
    private List<Chat_Session> chatSession;

    @OneToMany(mappedBy = "customer")
    @JsonIgnore
    private List<Access_Record> accessRecords;

    @OneToMany(mappedBy = "customer")
    @JsonIgnore
    private  List<Orders> orders;

    @OneToMany(mappedBy = "customer")
    @JsonIgnore
    private List<Evaluate> evaluates;

    @OneToOne
    @JoinColumn(name = "account_id" , referencedColumnName = "account_id")
    @JsonBackReference
    private Account account;

}
