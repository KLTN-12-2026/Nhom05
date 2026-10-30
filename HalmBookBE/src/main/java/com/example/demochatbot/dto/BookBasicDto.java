package com.example.demochatbot.dto;

import com.example.demochatbot.model.Book;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class BookBasicDto {
    private String book_id;
    private String bookName;
    private String isbn;
    private String author;
    private String publisher;
    private Integer yearOfPublished;
    private Integer totalPages;
    private Double rent_price;
    private Integer readCount;
    private String img_url;
    private String description;
    private Integer category_id;
    private String category_name;
    private String status;

    public static BookBasicDto fromEntity(Book book) {
        if (book == null) return null;
        Integer categoryId = book.getCategory() == null ? null : book.getCategory().getCategory_id();
        String categoryName = book.getCategory() == null ? null : book.getCategory().getCategory_name();

        return new BookBasicDto(
                book.getBook_id(),
                book.getBookName(),
                book.getIsbn(),
                book.getAuthor(),
                book.getPublisher(),
                book.getYearOfPublished(),
                book.getTotalPages(),
                book.getRent_price(),
                book.getReadCount(),
                book.getImg_url(),
                book.getDescription(),
                categoryId,
                categoryName,
                book.getStatus()
        );
    }
}
