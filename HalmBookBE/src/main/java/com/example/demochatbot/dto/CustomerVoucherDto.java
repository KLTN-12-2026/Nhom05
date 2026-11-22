package com.example.demochatbot.dto;

import com.example.demochatbot.model.CustomerVoucher;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomerVoucherDto {
    private Long id;
    private String code;
    private String title;
    private String description;
    private Integer discountPercent;
    private Integer discountAmount;
    private Integer minOrderValue;
    private Boolean isUsed;
    private LocalDateTime usedAt;
    private LocalDateTime savedAt;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private Boolean isExclusive;
    private String exclusiveNote;
    private String status; // "AVAILABLE", "USED", "EXPIRED"
    private Long remainingDays;

    public static CustomerVoucherDto fromEntity(CustomerVoucher cv) {
        if (cv == null) return null;

        LocalDateTime now = LocalDateTime.now();
        String status = "AVAILABLE";
        if (Boolean.TRUE.equals(cv.getIsUsed())) {
            status = "USED";
        } else if (cv.getEndDate() != null && cv.getEndDate().isBefore(now)) {
            status = "EXPIRED";
        }

        Long remainingDays = null;
        if (cv.getEndDate() != null && cv.getEndDate().isAfter(now)) {
            long hours = java.time.Duration.between(now, cv.getEndDate()).toHours();
            remainingDays = (long) Math.ceil(hours / 24.0);
            if (remainingDays <= 0) remainingDays = 1L;
        } else if (cv.getEndDate() != null && cv.getEndDate().isBefore(now)) {
            remainingDays = 0L;
        }

        return CustomerVoucherDto.builder()
                .id(cv.getId())
                .code(cv.getCode())
                .title(cv.getTitle() != null ? cv.getTitle() : "Voucher " + cv.getCode())
                .description(cv.getDescription())
                .discountPercent(cv.getDiscountPercent() != null ? cv.getDiscountPercent() : 0)
                .discountAmount(cv.getDiscountAmount() != null ? cv.getDiscountAmount() : 0)
                .minOrderValue(cv.getMinOrderValue() != null ? cv.getMinOrderValue() : 0)
                .isUsed(cv.getIsUsed())
                .usedAt(cv.getUsedAt())
                .savedAt(cv.getSavedAt())
                .startDate(cv.getStartDate())
                .endDate(cv.getEndDate())
                .isExclusive(cv.getIsExclusive())
                .exclusiveNote(cv.getExclusiveNote())
                .status(status)
                .remainingDays(remainingDays)
                .build();
    }
}
