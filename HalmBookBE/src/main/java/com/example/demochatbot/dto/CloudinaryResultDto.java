package com.example.demochatbot.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
public class CloudinaryResultDto {
    private String secureUrl;
    private String publicId;
    private String resourceType;

}
