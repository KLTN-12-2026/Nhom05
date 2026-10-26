package com.example.demochatbot.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "access_record")
public class Access_Record {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "access_record_id")
    private int access_record_id;
    private LocalDateTime start_date;
    private LocalDateTime end_date;
    private String status;

    @Column(name = "current_page")
    private Integer currentPage = 1;

    @Column(name = "reading_percentage")
    private Double readingPercentage = 0.0;

    @Column(name = "last_read_at")
    private LocalDateTime lastReadAt = LocalDateTime.now();

    @Column(name = "renew_count")
    private Integer renewCount = 0;

    @ManyToOne
    @JoinColumn(name = "customer_id" , referencedColumnName = "customer_id")
    private Customer customer;

    @ManyToOne
    @JoinColumn(name = "book_id" , referencedColumnName = "book_id")
    private Book book;
}
