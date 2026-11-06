package com.example.demochatbot.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * ============================================================================
 * DTO: CheckoutRequest
 * Mô tả: Yêu cầu thanh toán đơn thuê/mua sách bằng Khoai Tây
 * ============================================================================
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class CheckoutRequest {
    private List<CheckoutItemRequest> items; // Danh sách các ấn phẩm thanh toán
    private String paymentMethod = "POTATO_WALLET"; // Mặc định trừ Ví Khoai Tây
    private String couponCode;              // Mã voucher giảm giá (nếu áp dụng)
    private Double discountAmount = 0.0;     // Số Khoai được giảm giá từ coupon
}
