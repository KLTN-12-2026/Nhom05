package com.example.demochatbot.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "reading_note_bookmark")
public class ReadingNoteBookmark {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "note_id")
    private int noteId;

    @ManyToOne
    @JoinColumn(name = "customer_id", referencedColumnName = "customer_id", nullable = false)
    @JsonIgnore
    private Customer customer;

    @ManyToOne
    @JoinColumn(name = "book_id", referencedColumnName = "book_id", nullable = false)
    private Book book;

    @Column(name = "page_number", nullable = false)
    private int pageNumber;

    @Column(name = "highlight_text", columnDefinition = "TEXT")
    private String highlightText;

    @Column(name = "personal_note", columnDefinition = "TEXT")
    private String personalNote;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
}
