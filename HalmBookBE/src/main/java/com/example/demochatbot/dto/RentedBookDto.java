package com.example.demochatbot.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * ============================================================================
 * DTO: RentedBookDto
 * Mô tả: Thông tin cuốn sách đang sở hữu/thuê trong Tủ Sách Cá Nhân
 * ============================================================================
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class RentedBookDto {
    private int accessRecordId;
    private String bookId;
    private String bookName;
    private String author;
    private String imgUrl;
    private String categoryName;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private long remainingDays;       // Số ngày thuê còn lại (9999 nếu mua vĩnh viễn)
    private boolean isForever;        // Thuê vĩnh viễn
    private String status;            // ACTIVE, EXPIRED
    private int currentPage;          // Trang đang đọc
    private double readingPercentage; // Tiến độ đọc (%)
    private LocalDateTime lastReadAt; // Lần đọc gần nhất
}
