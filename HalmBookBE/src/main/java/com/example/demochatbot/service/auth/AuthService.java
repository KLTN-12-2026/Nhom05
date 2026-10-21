package com.example.demochatbot.service.auth;

import com.example.demochatbot.dto.AuthResponse;

public interface AuthService {
    AuthResponse processGoogleLogin(String accessToken);
    AuthResponse processFacebookLogin(String accessToken);
}
