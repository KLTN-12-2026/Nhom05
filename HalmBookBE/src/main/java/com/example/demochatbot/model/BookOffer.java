package com.example.demochatbot.model;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
@Entity @Table(name = "book_offer") @Data @NoArgsConstructor
public class BookOffer {
    @Id @Column(length = 64) private String id;
    @Version private Long version;
    @Column(nullable = false, length = 16) private String kind;
    @Column(nullable = false, length = 150) private String name;
    @Column(name = "description", length = 500) private String description;
    @Column(length = 2048) private String imageUrl;
    @Column(nullable = false, length = 16) private String planKey;
    private int priceKhoai;
    @Column(nullable = false, length = 16) private String status;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private int orderIndex;
    @ElementCollection @CollectionTable(name = "book_offer_book", joinColumns = @JoinColumn(name = "offer_id"))
    @OrderColumn(name = "position_index") @Column(name = "book_id", nullable = false)
    private List<String> bookIds = new ArrayList<>();
}
