package com.example.demochatbot.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * ============================================================================
 * DTO: TopupRequest
 * Mô tả: Yêu cầu nạp Khoai Tây từ gói nạp hoặc số tiền cụ thể
 * ============================================================================
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class TopupRequest {
    private Integer packageId;       // ID của gói nạp PotatoPackage (nếu chọn theo gói)
    private Double amountMoney;      // Số tiền VNĐ chuyển khoản
    private String paymentMethod;    // VietQR, MoMo...
    private String note;             // Ghi chú nạp tiền
}
