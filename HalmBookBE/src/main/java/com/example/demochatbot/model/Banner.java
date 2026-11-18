package com.example.demochatbot.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * ============================================================================
 * Entity: Banner
 * Quản lý danh sách các Slide Banner động trên Trang chủ và Cổng quản trị
 * ============================================================================
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Entity
@Table(name = "banners")
public class Banner {

    @Id
    @Column(name = "banner_id", length = 64)
    private String id;

    @Column(name = "layout_type", length = 50)
    private String layoutType; // 'showcase' | 'mascot_ai' | 'vip_potato' | 'hot_deal' | 'reader_3d' | 'custom_image'

    @Column(name = "eyebrow", length = 255)
    private String eyebrow;

    @Column(name = "title", length = 255)
    private String title;

    @Column(name = "title_highlight", length = 255)
    private String titleHighlight;

    @Column(name = "description", columnDefinition = "LONGTEXT")
    private String description;

    @Column(name = "action_text", length = 100)
    private String actionText;

    @Column(name = "action_link", columnDefinition = "TEXT")
    private String actionLink;

    @Column(name = "icon", length = 100)
    private String icon;

    @Column(name = "gradient", columnDefinition = "TEXT")
    private String gradient;

    @Column(name = "image_url", columnDefinition = "LONGTEXT")
    private String imageUrl;

    @Column(name = "image_mode", length = 50)
    private String imageMode; // 'overlay' | 'pure'

    @Builder.Default
    @Column(name = "is_active")
    private Boolean isActive = true;

    @Builder.Default
    @Column(name = "order_index")
    private Integer orderIndex = 0;

    @Column(name = "extra_data_json", columnDefinition = "LONGTEXT")
    private String extraDataJson; // Lưu JSON động: books, promptChips, tierHighlights, vouchers, readerFeatures, mascotQuote...

    @Builder.Default
    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Builder.Default
    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();
}
