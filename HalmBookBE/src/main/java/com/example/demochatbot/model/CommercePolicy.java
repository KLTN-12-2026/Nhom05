package com.example.demochatbot.model;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
@Entity @Table(name = "commerce_policy") @Data @NoArgsConstructor
public class CommercePolicy {
    @Id private Integer id;
    private long revision;
    @Column(nullable = false, columnDefinition = "TEXT") private String rentalPlansJson;
    private Instant updatedAt;
}
