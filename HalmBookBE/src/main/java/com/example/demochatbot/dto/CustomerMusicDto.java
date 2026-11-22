package com.example.demochatbot.dto;

import com.example.demochatbot.model.CustomerMusic;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomerMusicDto {
    private Integer id;
    private String title;
    private String originalFilename;
    private String fileUrl;
    private Long fileSize;
    private LocalDateTime createdAt;

    public static CustomerMusicDto fromEntity(CustomerMusic entity) {
        if (entity == null) return null;
        return CustomerMusicDto.builder()
                .id(entity.getId())
                .title(entity.getTitle())
                .originalFilename(entity.getOriginalFilename())
                .fileUrl(entity.getFileUrl())
                .fileSize(entity.getFileSize())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
