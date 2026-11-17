package com.example.demochatbot.service.potato;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

public class MomoPaymentException extends ResponseStatusException {
    public MomoPaymentException(String message) {
        super(HttpStatus.BAD_GATEWAY, message);
    }

    public MomoPaymentException(String message, Throwable cause) {
        super(HttpStatus.BAD_GATEWAY, message, cause);
    }
}
