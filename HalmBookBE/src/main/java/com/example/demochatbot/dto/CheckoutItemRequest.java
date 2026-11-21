package com.example.demochatbot.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * ============================================================================
 * DTO: CheckoutItemRequest
 * Mô tả: Thông tin cuốn sách được chọn thanh toán / thuê trong giỏ hàng
 * ============================================================================
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class CheckoutItemRequest {
    @NotBlank(message = "Mã sách (bookId) không được để trống!")
    private String bookId;           // Mã sách
    private String offerId;

    private Integer cartItemId;      // ID mục giỏ hàng (nếu có, để xóa sau khi thuê)
    private String planKey;          // Gói thuê: '7', '14', '30', 'forever'
    private String plan;             // Alias dự phòng tương thích ngược với FE
    private Integer durationDays;    // Số ngày thuê tương ứng (7, 14, 30 ngày hoặc 36500 cho vĩnh viễn)
    private Double price;            // Giá thuê tính theo đơn vị Khoai

    public String getPlanKey() {
        if (planKey != null && !planKey.trim().isEmpty()) {
            return planKey;
        }
        return plan;
    }
}
