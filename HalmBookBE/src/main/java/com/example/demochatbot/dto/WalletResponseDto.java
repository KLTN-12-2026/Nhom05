package com.example.demochatbot.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * ============================================================================
 * DTO: WalletResponseDto
 * Mô tả: Chứa thông tin số dư Khoai Tây thực tế và thống kê ví của người dùng
 * ============================================================================
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class WalletResponseDto {
    private String customerId;
    private String customerName;
    private String email;
    private String phoneNumber;
    private int potatoBalance;        // Số khoai khả dụng thực tế
    private int totalPotatoEarned;    // Tổng số khoai đã tích lũy
    private int streakDays;           // Chuỗi ngày đăng nhập đọc sách
    private String tierName;          // Tên hạng thành viên (e.g., Thợ Cày, Học Giả...)
    private double equivalentVnd;     // Giá trị quy đổi VNĐ tương đương (1 Khoai = 1.000 VNĐ)
}
