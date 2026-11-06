package com.example.demochatbot.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request gửi đánh giá hoặc phản hồi cảm nhận sách
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class EvaluateCreateRequest {
    private String bookId;
    private int star = 5;
    private String content;
    private Integer parentId;
}
