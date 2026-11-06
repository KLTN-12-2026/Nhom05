package com.example.demochatbot.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * ============================================================================
 * DTO: TransferRequest
 * Mô tả: Yêu cầu chuyển/tặng Khoai Tây cho độc giả khác
 * ============================================================================
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class TransferRequest {
    private String receiver; // Số điện thoại, Email hoặc CustomerId của người nhận
    private int amount;      // Số lượng khoai muốn tặng
    private String note;     // Lời nhắn gửi kèm
}
