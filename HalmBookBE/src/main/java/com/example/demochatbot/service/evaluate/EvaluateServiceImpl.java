package com.example.demochatbot.service.evaluate;

import com.example.demochatbot.dto.EvaluateCreateRequest;
import com.example.demochatbot.dto.EvaluateDto;
import com.example.demochatbot.model.Access_Record;
import com.example.demochatbot.model.Book;
import com.example.demochatbot.model.Customer;
import com.example.demochatbot.model.Evaluate;
import com.example.demochatbot.repository.AccessRecordRepository;
import com.example.demochatbot.repository.BookRepository;
import com.example.demochatbot.repository.CustomerRepository;
import com.example.demochatbot.repository.EvaluateRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Cài đặt nghiệp vụ xử lý đánh giá sách và trả lời cảm nhận độc giả
 */
@Service
public class EvaluateServiceImpl implements EvaluateService {

    public static final double REQUIRED_READING_PERCENTAGE = 50.0;

    @Autowired
    private EvaluateRepository evaluateRepository;

    @Autowired
    private BookRepository bookRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private AccessRecordRepository accessRecordRepository;

    public static double resolveReadingPercentage(Book book, Access_Record ar) {
        if (ar == null) {
            return 0.0;
        }
        double storedPct = ar.getReadingPercentage() != null && Double.isFinite(ar.getReadingPercentage())
                ? Math.min(100.0, Math.max(0.0, ar.getReadingPercentage()))
                : 0.0;
        double computedPct = 0.0;
        int currentPage = ar.getCurrentPage() != null ? ar.getCurrentPage() : 0;
        int totalPages = book != null && book.getTotalPages() != null ? book.getTotalPages() : 0;
        if (currentPage >= 1 && totalPages > 0) {
            computedPct = Math.min(100.0, Math.max(0.0, ((double) currentPage / totalPages) * 100.0));
        }
        double effective = Math.max(storedPct, computedPct);
        return Math.round(effective * 10.0) / 10.0;
    }

    @Override
    @Transactional(readOnly = true)
    public EvaluateEligibility checkEvaluateEligibility(String bookId, Integer accountId) {
        if (bookId == null || bookId.isBlank()) {
            throw new IllegalArgumentException("Mã sách không hợp lệ!");
        }
        String trimmed = bookId.trim();
        Book book = bookRepository.findById(trimmed)
                .or(() -> bookRepository.findById(trimmed.toUpperCase()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy sách với mã: " + bookId));
        int totalPages = book.getTotalPages() != null && book.getTotalPages() > 0 ? book.getTotalPages() : 0;
        String bookTitle = book.getBookName() != null && !book.getBookName().isBlank() ? book.getBookName() : book.getBook_id();

        if (accountId == null || accountId <= 0) {
            return new EvaluateEligibility(false, book.getBook_id(), bookTitle, false, 0, totalPages, 0.0, REQUIRED_READING_PERCENTAGE, false);
        }

        Customer customer = customerRepository.findCustomerById(accountId);
        if (customer == null) {
            return new EvaluateEligibility(false, book.getBook_id(), bookTitle, false, 0, totalPages, 0.0, REQUIRED_READING_PERCENTAGE, false);
        }

        Optional<Access_Record> recordOpt = accessRecordRepository.findByCustomerIdAndBookId(customer.getCustomer_id(), book.getBook_id());
        if (recordOpt.isEmpty()) {
            return new EvaluateEligibility(true, book.getBook_id(), bookTitle, false, 0, totalPages, 0.0, REQUIRED_READING_PERCENTAGE, false);
        }

        Access_Record ar = recordOpt.get();
        double readingPercentage = resolveReadingPercentage(book, ar);
        int currentPage = ar.getCurrentPage() != null && ar.getCurrentPage() > 0 ? ar.getCurrentPage() : 1;
        boolean canEvaluate = readingPercentage >= REQUIRED_READING_PERCENTAGE;

        return new EvaluateEligibility(
                true,
                book.getBook_id(),
                bookTitle,
                true,
                currentPage,
                totalPages,
                readingPercentage,
                REQUIRED_READING_PERCENTAGE,
                canEvaluate
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<EvaluateDto> getEvaluatesByBookId(String bookId) {
        if (bookId == null || bookId.isBlank()) {
            return Collections.emptyList();
        }
        List<Evaluate> evaluates = evaluateRepository.findRootEvaluatesByBookId(bookId);
        return evaluates.stream()
                .map(EvaluateDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public EvaluateDto createEvaluate(EvaluateCreateRequest request, Integer accountId) {
        if (request == null || request.getBookId() == null || request.getBookId().isBlank()) {
            throw new IllegalArgumentException("Mã sách không hợp lệ!");
        }

        if (request.getContent() == null || request.getContent().trim().isEmpty()) {
            throw new IllegalArgumentException("Nội dung đánh giá không được để trống!");
        }

        if (accountId == null || accountId <= 0) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Vui lòng đăng nhập để đánh giá sách.");
        }

        Customer customer = customerRepository.findCustomerById(accountId);
        if (customer == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Không tìm thấy tài khoản độc giả. Vui lòng đăng nhập lại.");
        }

        String trimmed = request.getBookId().trim();
        Book book = bookRepository.findById(trimmed)
                .or(() -> bookRepository.findById(trimmed.toUpperCase()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy sách với mã: " + request.getBookId()));

        String bookTitle = book.getBookName() != null && !book.getBookName().isBlank() ? book.getBookName() : book.getBook_id();
        Optional<Access_Record> recordOpt = accessRecordRepository.findByCustomerIdAndBookId(customer.getCustomer_id(), book.getBook_id());
        double readingPercentage = resolveReadingPercentage(book, recordOpt.orElse(null));
        if (readingPercentage < REQUIRED_READING_PERCENTAGE) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Quý khách chưa thể đánh giá sách \"" + bookTitle + "\" vào thời điểm hiện tại."
            );
        }

        Evaluate evaluate = new Evaluate();
        evaluate.setBook(book);
        evaluate.setContent(request.getContent().trim());
        evaluate.setStar(Math.max(1, Math.min(5, request.getStar())));
        evaluate.setLikesCount(0);
        evaluate.setCreated_at(LocalDateTime.now());
        evaluate.setCustomer(customer);

        // Thưởng +5 Khoai cho người đọc khi đánh giá sách
        int currentBalance = customer.getPotatoBalance() != null ? customer.getPotatoBalance() : 0;
        int currentEarned = customer.getTotalPotatoEarned() != null ? customer.getTotalPotatoEarned() : 0;
        customer.setPotatoBalance(currentBalance + 5);
        customer.setTotalPotatoEarned(currentEarned + 5);
        customerRepository.save(customer);

        // Nếu là phản hồi cho 1 đánh giá khác (nested reply)
        if (request.getParentId() != null && request.getParentId() > 0) {
            Evaluate parent = evaluateRepository.findById(request.getParentId()).orElse(null);
            if (parent != null) {
                evaluate.setParent(parent);
            }
        }

        Evaluate saved = evaluateRepository.save(evaluate);
        return EvaluateDto.fromEntity(saved);
    }

    @Override
    @Transactional
    public int likeEvaluate(int evaluateId) {
        Evaluate evaluate = evaluateRepository.findById(evaluateId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đánh giá với mã: " + evaluateId));
        
        int currentLikes = evaluate.getLikesCount() != null ? evaluate.getLikesCount() : 0;
        evaluate.setLikesCount(currentLikes + 1);
        evaluateRepository.save(evaluate);
        return evaluate.getLikesCount();
    }
}
