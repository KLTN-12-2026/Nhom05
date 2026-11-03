package com.example.demochatbot.dto;

import lombok.Data;

@Data
public class ResetPasswordRequest {
    private String email;
    private String username;
    private String oldPassword;
    private String newPassword;
}
