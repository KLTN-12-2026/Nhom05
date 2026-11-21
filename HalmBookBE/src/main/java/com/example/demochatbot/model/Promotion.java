package com.example.demochatbot.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.ToString;

import java.time.LocalDateTime;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "promotion")
public class Promotion {
    @Transient @JsonProperty("book_details")
    private java.util.Map<String, Object> bookDetails;
    @Transient @JsonProperty("eligible_books")
    private List<java.util.Map<String, Object>> eligibleBooks;
    @Id
    private String promotion_id;
    private String promotion_name;
    private String description;
    private int discount_percent;
    private int discount_amount;
    private LocalDateTime start_date;
    private LocalDateTime end_date;
    private String status;
    @JsonIgnore
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "book_id", referencedColumnName = "book_id",
            foreignKey = @ForeignKey(name = "fk_promotion_book"))
    private Book book;

    @Transient
    @JsonProperty(value = "book_id", access = JsonProperty.Access.READ_ONLY)
    public String getBook_id() {
        return book == null ? null : book.getBook_id();
    }
    @ManyToOne
    @JoinColumn(name = "category_id" , referencedColumnName = "category_id")
    private Category category;

    @JsonIgnore
    @OneToMany(mappedBy = "promotion")
    private List<Orders> orders;

}
