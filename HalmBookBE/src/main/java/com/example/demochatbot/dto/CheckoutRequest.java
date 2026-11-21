package com.example.demochatbot.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
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
    @NotEmpty(message = "Giỏ hàng thanh toán trống! Vui lòng chọn ít nhất 1 tác phẩm.")
    private List<@Valid CheckoutItemRequest> items; // Danh sách các ấn phẩm thanh toán

    private List<Integer> cartItemIds; // Legacy endpoint: resolved under the wallet lock.

    private String paymentMethod = "POTATO_WALLET"; // Mặc định trừ Ví Khoai Tây
    private String couponCode;              // Mã voucher giảm giá (nếu áp dụng)
    private Double discountAmount = 0.0;     // Số Khoai được giảm giá từ coupon
    private String idempotencyKey;           // Khóa giao dịch duy nhất chống thanh toán lặp (IMP-04)
    private Long policyRevision;
    private Integer expectedTotal;
    private String quoteFingerprint;
}
