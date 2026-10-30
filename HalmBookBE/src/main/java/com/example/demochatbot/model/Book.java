package com.example.demochatbot.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "book")
public class Book {
    @Id
    @Column(name = "book_id")
    private String book_id;

    private String bookName;
    private String isbn;
    private String author;
    private String publisher;
    private Integer yearOfPublished;
    private Integer totalPages;
    private Double rent_price;
    private Integer readCount = 0;

    @Column(columnDefinition = "TEXT")
    private String img_url;

    private String imgPublicId;

    @Column(columnDefinition = "TEXT")
    private String pdf_url;

    private String pdfPublicId;

    @Column(columnDefinition = "TEXT")
    private String audio_url;

    private String fileFormat = "PDF";
    private Double fileSizeMb = 0.0;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String status = "PUBLISHED";

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    @OneToMany(mappedBy = "book")
    private List<Cart_Item> cart_item;

    @OneToMany(mappedBy = "book")
    private List<Access_Record> access_record;

    @OneToMany(mappedBy = "book")
    private List<Evaluate> evaluate;

    @OneToMany(mappedBy = "book")
    private List<Order_Item> order_item;

    @OneToMany(mappedBy = "book")
    private List<ReadingNoteBookmark> bookmarks;

    @ManyToOne
    @JoinColumn(name = "category_id" , referencedColumnName = "category_id")
    private Category category;
}
