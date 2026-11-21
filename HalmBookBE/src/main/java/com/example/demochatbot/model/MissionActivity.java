package com.example.demochatbot.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.*;

@Entity @Table(name = "mission_activity")
@Data @NoArgsConstructor
public class MissionActivity {
    @Id @Column(length = 64)
    private String id;
    @Column(nullable = false)
    private String customerId;
    private LocalDate activityDate;
    @Column(length = 40)
    private String kind;
    private int progressValue;
    private Instant lastEventAt;
    @Column(length = 64)
    private String sessionId;
    private String bookId;
}
