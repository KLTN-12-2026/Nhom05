package com.example.demochatbot.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * ============================================================================
 * DTO: CheckoutResponse
 * Mô tả: Kết quả sau khi thanh toán thuê sách thành công
 * ============================================================================
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CheckoutResponse {
    private boolean success;
    private String message;
    private int orderId;
    private String transactionNo;
    private int totalKhoaiPaid;
    private int remainingPotatoBalance;
    private LocalDateTime orderDate;
    private List<Map<String, Object>> rentedBooks;
}
