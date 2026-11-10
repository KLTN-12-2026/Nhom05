package com.example.demochatbot.dto;

import lombok.Data;

@Data
public class RegisterRequest {
    private String username;
    private String email;
    private String password;
    private String customerName;
    private String phoneNumber;
    private String address;
}
