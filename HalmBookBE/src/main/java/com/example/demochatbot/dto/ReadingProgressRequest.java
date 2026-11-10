package com.example.demochatbot.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ReadingProgressRequest {
    private Integer currentPage;
    private Double readingPercentage;
    private Integer totalPages;
}
