package com.example.demochatbot.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * ============================================================================
 * DTO: TierDto
 * Đại diện cho thông tin một cấp bậc hội viên và các quyền lợi đi kèm
 * ============================================================================
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TierDto {
    private int tierId;
    private String tierName;           // 'Thợ Cày', 'Cao Thủ Cày', 'Lão Nông', 'Đại Điền Chủ'
    private Integer minBooksRequired;  // 0, 10, 50, 150
    private Integer minPotatoRequired; // 0, 500, 2500, 10000
    private Integer discountPercent;   // 0%, 5%, 10%, 20%
    private String badgeIcon;          // '🌱', '🚜', '🌾', '👑'
    private String description;
    private List<String> benefits;     // Danh sách quyền lợi chi tiết hiển thị modal
}
