package com.example.demochatbot.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class BroadcastRequest {
    @NotBlank @Pattern(regexp = "[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}")
    private String requestId;
    @NotBlank @Size(max = 150)
    private String title;
    @NotBlank @Size(max = 4000)
    private String message;
    @NotBlank @Pattern(regexp = "all|vip|standard")
    private String target = "all";
    @NotBlank @Pattern(regexp = "inbox|home|offers|bookshelf|profile|wallet|categories")
    private String destination = "inbox";
}
