package com.example.demochatbot.dto;

import com.example.demochatbot.model.Evaluate;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * DTO đại diện cho một đánh giá / cảm nhận bạn đọc về cuốn sách
 * Có kèm danh sách câu trả lời phản hồi (replies)
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class EvaluateDto {
    private int evaluateId;
    private int star;
    private String content;
    private Integer likesCount;
    private String createdAt;
    private String customerId;
    private String customerName;
    private String avatarUrl;
    private Integer parentId;
    private List<EvaluateDto> replies = new ArrayList<>();

    public static EvaluateDto fromEntity(Evaluate evaluate) {
        if (evaluate == null) return null;
        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        String createdStr = evaluate.getCreated_at() != null ? evaluate.getCreated_at().format(dtf) : "";

        String customerId = null;
        String customerName = "Độc giả HALM";
        String avatarUrl = null;

        if (evaluate.getCustomer() != null) {
            customerId = evaluate.getCustomer().getCustomer_id();
            if (evaluate.getCustomer().getCustomerName() != null && !evaluate.getCustomer().getCustomerName().isBlank()) {
                customerName = evaluate.getCustomer().getCustomerName();
            }
            avatarUrl = evaluate.getCustomer().getAvatarUrl();
            if (avatarUrl == null || avatarUrl.isBlank()) {
                avatarUrl = evaluate.getCustomer().getAvatar();
            }
        }

        Integer parentId = evaluate.getParent() != null ? evaluate.getParent().getEvaluate_id() : null;

        List<EvaluateDto> replyDtos = new ArrayList<>();
        if (evaluate.getReplies() != null && !evaluate.getReplies().isEmpty()) {
            replyDtos = evaluate.getReplies().stream()
                    .map(EvaluateDto::fromEntity)
                    .collect(Collectors.toList());
        }

        return new EvaluateDto(
                evaluate.getEvaluate_id(),
                evaluate.getStar(),
                evaluate.getContent(),
                evaluate.getLikesCount() != null ? evaluate.getLikesCount() : 0,
                createdStr,
                customerId,
                customerName,
                avatarUrl,
                parentId,
                replyDtos
        );
    }
}
