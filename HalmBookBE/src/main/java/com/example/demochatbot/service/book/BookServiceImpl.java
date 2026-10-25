package com.example.demochatbot.service.book;

import com.example.demochatbot.dto.BookDto;
import com.example.demochatbot.dto.CloudinaryResultDto;
import com.example.demochatbot.model.Book;
import com.example.demochatbot.repository.BookRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import java.util.Optional;

@Service
public class BookServiceImpl implements BookService {
    @Autowired
    private BookRepository bookRepository;

    @Override
    public Book findBookById(String bookId) {
        if (bookId == null || bookId.trim().isEmpty()) {
            return null;
        }
        Book book = bookRepository.findById(bookId).orElse(null);
        if (book == null) {
            book = bookRepository.findBookById(bookId);
        }
        return book;
    }

    @Override
    public BookDto findBookDetailById(String bookId) {
        Book book = findBookById(bookId);
        return book != null ? BookDto.fromEntity(book) : null;
    }

    @Override
    public Boolean saveCloudinaryInfo(String bookId, CloudinaryResultDto dto) {
        Optional<Book> opt = bookRepository.findById(bookId);
        if (opt.isEmpty()) {
            return false;
        }
        Book book = opt.get();
        if (dto.getSecureUrl() != null) {
            if ("raw".equalsIgnoreCase(dto.getResourceType())) {
                book.setPdf_url(dto.getSecureUrl());
                book.setPdfPublicId(dto.getPublicId());
            } else {
                book.setImg_url(dto.getSecureUrl());
                book.setImgPublicId(dto.getPublicId());
            }
        }
        bookRepository.save(book);
        return true;
    }

    @Override
    public Page<Book> findAllBook(Pageable pageable) {
        return bookRepository.findAllBook(pageable);
    }
}
