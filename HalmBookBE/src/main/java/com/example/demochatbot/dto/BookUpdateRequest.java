package com.example.demochatbot.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class BookUpdateRequest {
    private String bookName;
    private String isbn;
    private String author;
    private String publisher;
    private Integer yearOfPublished;
    private Integer totalPages;
    private Double rent_price;
    private String description;
    private Integer category_id;
    private String status;
    private String fileFormat;
}
