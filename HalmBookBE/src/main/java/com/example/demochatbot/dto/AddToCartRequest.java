package com.example.demochatbot.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AddToCartRequest {
    private String bookId;
    private String planKey;    // Ví dụ: '1', '3', '7', 'forever' (nếu FE gửi kèm)
    private Double price;      // Giá gói hoặc giá thuê
}
