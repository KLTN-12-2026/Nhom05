package com.example.demochatbot.dto;

import com.example.demochatbot.model.Book;
import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

import java.time.format.DateTimeFormatter;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class BookDto {
    private String book_id;
    private String bookName;
    private String author;
    private String publisher;
    private Integer yearOfPublished;
    private Double rent_price;
    private String img_url;
    private String imgPublicId;
    private String pdf_url;
    private String pdfPublicId;
    private String description;
    private Integer category_id;
    private String category_name;
    private String isbn;
    private Integer totalPages;
    private String status;
    private String fileFormat;
    private Double fileSizeMb;
    private Integer readCount;
    private String createdAt;
    private String updatedAt;

    public BookDto(String book_id, String bookName, String author, String publisher,
                   Integer yearOfPublished, Double rent_price, String img_url,
                   String imgPublicId, String pdf_url, String pdfPublicId,
                   String description, Integer category_id) {
        this(book_id, bookName, author, publisher, yearOfPublished, rent_price,
                img_url, imgPublicId, pdf_url, pdfPublicId, description, category_id, null,
                null, null, null, null, null, null, null, null);
    }

    public static BookDto fromEntity(Book book) {
        if (book == null) return null;
        Integer categoryId = book.getCategory() == null
                ? null
                : book.getCategory().getCategory_id();
        String categoryName = book.getCategory() == null
                ? null
                : book.getCategory().getCategory_name();

        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        String createdStr = book.getCreatedAt() != null ? book.getCreatedAt().format(dtf) : null;
        String updatedStr = book.getUpdatedAt() != null ? book.getUpdatedAt().format(dtf) : null;

        return new BookDto(
                book.getBook_id(),
                book.getBookName(),
                book.getAuthor(),
                book.getPublisher(),
                book.getYearOfPublished(),
                book.getRent_price(),
                book.getImg_url(),
                book.getImgPublicId(),
                book.getPdf_url(),
                book.getPdfPublicId(),
                book.getDescription(),
                categoryId,
                categoryName,
                book.getIsbn(),
                book.getTotalPages(),
                book.getStatus(),
                book.getFileFormat(),
                book.getFileSizeMb(),
                book.getReadCount(),
                createdStr,
                updatedStr
        );
    }
}
