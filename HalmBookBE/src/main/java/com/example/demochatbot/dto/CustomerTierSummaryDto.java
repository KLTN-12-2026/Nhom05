package com.example.demochatbot.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * ============================================================================
 * DTO: CustomerTierSummaryDto
 * Chứa toàn bộ thông tin tiến trình thăng hạng, điểm cày (XP), chuỗi streak
 * và các quyền lợi thực tế của độc giả đang đăng nhập
 * ============================================================================
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerTierSummaryDto {
    private String customerId;
    private String formattedMemberCode;     // Ví dụ: HALM-C00007-VN
    private String customerName;
    private String avatarUrl;

    // Hạng hiện tại
    private TierDto currentTier;

    // Hạng kế tiếp cần đạt
    private TierDto nextTier;
    private boolean isMaxTier;

    // Tiến trình sách đã đọc/thuê
    private int booksReadCount;
    private int booksRequiredForNext;
    private int booksRemainingForNext;
    private double progressPercentBooks;

    // Tiến trình Điểm cày (XP)
    private int totalPoints;                // Điểm kinh nghiệm (XP)
    private int pointsRequiredForNext;
    private int pointsRemainingForNext;
    private double progressPercentPoints;

    // Tiến trình tổng quát (% hiển thị trên thanh progress bar)
    private double overallProgressPercent;

    // Chuỗi đọc sách hằng ngày
    private int streakDays;
    private boolean hasCheckedInToday;

    // Quyền lợi thực tế
    private int discountPercent;            // % chiết khấu dịch vụ trọn đời
    private int potatoBalance;              // Số khoai khả dụng
    private boolean isPermanentProtected;   // Luôn luôn là true: Bảo lưu vĩnh viễn

    // Lộ trình 4 cấp bậc
    private List<TierDto> allTiers;
}
