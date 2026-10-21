package com.example.demochatbot.dto;

import com.example.demochatbot.enums.Role;
import com.example.demochatbot.model.Account;
import com.example.demochatbot.model.Customer;
import lombok.Data;

@Data
public class AuthResponse {
    private String systemToken;
    private Account account;
    private Customer customer;
    private String role;

    public AuthResponse(String systemToken, Account account, Customer customer, String role) {
        this.systemToken = systemToken;
        this.account = account;
        this.customer = customer;
        this.role = role;
    }
}
