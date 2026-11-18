package com.example.demochatbot.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record CreateMomoTopupRequest(
        @NotNull @Positive Integer packageId
) {
}
