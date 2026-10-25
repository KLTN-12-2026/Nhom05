package com.example.demochatbot.service.book;

import com.example.demochatbot.dto.BookDto;
import com.example.demochatbot.dto.CloudinaryResultDto;
import com.example.demochatbot.model.Book;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
public interface BookService {
    Book findBookById(String bookId);

    BookDto findBookDetailById(String bookId);

    Boolean saveCloudinaryInfo(String bookId, CloudinaryResultDto dto);

    Page<Book> findAllBook(Pageable pageable);
}
