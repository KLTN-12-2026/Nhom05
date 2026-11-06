package com.example.demochatbot.service.bookmark;

import com.example.demochatbot.dto.ReadingNoteBookmarkDto;
import com.example.demochatbot.dto.ReadingNoteBookmarkRequest;
import com.example.demochatbot.model.Book;
import com.example.demochatbot.model.Customer;
import com.example.demochatbot.model.ReadingNoteBookmark;
import com.example.demochatbot.repository.BookRepository;
import com.example.demochatbot.repository.CustomerRepository;
import com.example.demochatbot.repository.ReadingNoteBookmarkRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class BookmarkServiceImpl implements BookmarkService {

    @Autowired
    private ReadingNoteBookmarkRepository bookmarkRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private BookRepository bookRepository;

    @Override
    @Transactional(readOnly = true)
    public List<ReadingNoteBookmarkDto> getBookmarksByBook(int accountId, String bookId) {
        Customer customer = customerRepository.findCustomerById(accountId);
        if (customer == null || bookId == null || bookId.isBlank()) {
            return Collections.emptyList();
        }
        List<ReadingNoteBookmark> list = bookmarkRepository.findByCustomerAndBook(customer.getCustomer_id(), bookId);
        return list.stream().map(ReadingNoteBookmarkDto::fromEntity).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ReadingNoteBookmarkDto createBookmark(int accountId, ReadingNoteBookmarkRequest request) {
        Customer customer = customerRepository.findCustomerById(accountId);
        if (customer == null) {
            throw new RuntimeException("Vui lòng đăng nhập để lưu ghi chú sách!");
        }

        if (request == null || request.getBookId() == null || request.getBookId().isBlank()) {
            throw new IllegalArgumentException("Mã sách không hợp lệ!");
        }

        Book book = bookRepository.findById(request.getBookId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy cuốn sách với mã: " + request.getBookId()));

        String highlight = request.getSelectedText() != null ? request.getSelectedText() : request.getHighlightText();
        if ((highlight == null || highlight.trim().isEmpty()) && (request.getPersonalNote() == null || request.getPersonalNote().trim().isEmpty())) {
            throw new IllegalArgumentException("Nội dung trích dẫn hoặc ghi chú không được để trống!");
        }

        ReadingNoteBookmark bookmark = new ReadingNoteBookmark();
        bookmark.setCustomer(customer);
        bookmark.setBook(book);
        bookmark.setPageNumber(Math.max(1, request.getPageNumber()));
        bookmark.setHighlightText(highlight != null ? highlight.trim() : "");
        bookmark.setPersonalNote(request.getPersonalNote() != null ? request.getPersonalNote().trim() : "");
        bookmark.setCreatedAt(LocalDateTime.now());

        ReadingNoteBookmark saved = bookmarkRepository.save(bookmark);
        return ReadingNoteBookmarkDto.fromEntity(saved);
    }

    @Override
    @Transactional
    public boolean deleteBookmark(int accountId, int noteId) {
        Customer customer = customerRepository.findCustomerById(accountId);
        if (customer == null) {
            throw new RuntimeException("Vui lòng đăng nhập!");
        }

        return bookmarkRepository.findById(noteId).map(b -> {
            if (b.getCustomer() != null && b.getCustomer().getCustomer_id().equals(customer.getCustomer_id())) {
                bookmarkRepository.delete(b);
                return true;
            }
            return false;
        }).orElse(false);
    }
}
