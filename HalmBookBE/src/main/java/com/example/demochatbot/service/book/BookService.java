package com.example.demochatbot.service.book;

import com.example.demochatbot.dto.BookBasicDto;
import com.example.demochatbot.dto.BookCreateRequest;
import com.example.demochatbot.dto.BookDto;
import com.example.demochatbot.dto.BookUpdateRequest;
import com.example.demochatbot.dto.CloudinaryResultDto;
import com.example.demochatbot.model.Book;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@Service
public interface BookService {
    Book findBookById(String bookId);

    BookDto findBookDetailById(String bookId);

    BookBasicDto findBookBasicById(String bookId);

    Page<BookBasicDto> findAllBasicBooks(Pageable pageable);

    String getBookReadUrl(String bookId);

    Boolean saveCloudinaryInfo(String bookId, CloudinaryResultDto dto);

    Boolean saveCloudinaryInfo(String bookId, CloudinaryResultDto dto, MultipartFile file);

    Book createBook(BookCreateRequest request, MultipartFile imageFile, MultipartFile pdfFile) throws IOException;

    Book updateBook(String bookId, BookUpdateRequest request, MultipartFile imageFile, MultipartFile pdfFile) throws IOException;

    Boolean deleteBook(String bookId);

    Page<Book> findAllBook(Pageable pageable);
}
