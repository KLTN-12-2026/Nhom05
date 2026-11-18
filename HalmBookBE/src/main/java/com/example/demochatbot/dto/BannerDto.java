package com.example.demochatbot.dto;

import com.fasterxml.jackson.annotation.JsonAnyGetter;
import com.fasterxml.jackson.annotation.JsonAnySetter;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.HashMap;
import java.util.Map;

/**
 * ============================================================================
 * DTO: BannerDto
 * Chứa thông tin Banner gửi và nhận giữa Frontend & Backend.
 * Dùng @JsonAnyGetter & @JsonAnySetter để hỗ trợ linh hoạt các mảng/thuộc tính động
 * như books, mascotQuote, promptChips, tierHighlights, vouchers, v.v.
 * ============================================================================
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class BannerDto {
    private String id;
    private String layoutType;
    private String eyebrow;
    private String title;
    private String titleHighlight;
    private String description;
    private String actionText;
    private String actionLink;
    private String icon;
    private String gradient;
    private String imageUrl;
    private String imageMode;
    private Boolean isActive;
    private Integer order;

    @JsonIgnore
    @Builder.Default
    private Map<String, Object> extraProperties = new HashMap<>();

    @JsonAnyGetter
    public Map<String, Object> getExtraProperties() {
        if (extraProperties == null) {
            extraProperties = new HashMap<>();
        }
        return extraProperties;
    }

    @JsonAnySetter
    public void setExtraProperty(String key, Object value) {
        if (extraProperties == null) {
            extraProperties = new HashMap<>();
        }
        if ("extraProperties".equals(key)) {
            if (value instanceof Map<?, ?> map) {
                for (Map.Entry<?, ?> entry : map.entrySet()) {
                    if (entry.getKey() != null) {
                        extraProperties.put(entry.getKey().toString(), entry.getValue());
                    }
                }
            }
            return;
        }
        extraProperties.put(key, value);
    }
}
