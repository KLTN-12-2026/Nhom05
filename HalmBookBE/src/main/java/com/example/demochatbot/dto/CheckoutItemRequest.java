package com.example.demochatbot.dto;

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
    private String bookId;           // Mã sách
    private Integer cartItemId;      // ID mục giỏ hàng (nếu có, để xóa sau khi thuê)
    private String planKey;          // Gói thuê: '7', '14', '30', 'forever'
    private Integer durationDays;    // Số ngày thuê tương ứng (7, 14, 30 ngày hoặc 36500 cho vĩnh viễn)
    private Double price;            // Giá thuê tính theo đơn vị Khoai
}
