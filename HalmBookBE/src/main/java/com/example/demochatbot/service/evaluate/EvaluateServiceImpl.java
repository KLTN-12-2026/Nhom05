package com.example.demochatbot.service.evaluate;

import com.example.demochatbot.dto.EvaluateCreateRequest;
import com.example.demochatbot.dto.EvaluateDto;
import com.example.demochatbot.model.Book;
import com.example.demochatbot.model.Customer;
import com.example.demochatbot.model.Evaluate;
import com.example.demochatbot.repository.BookRepository;
import com.example.demochatbot.repository.CustomerRepository;
import com.example.demochatbot.repository.EvaluateRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Cài đặt nghiệp vụ xử lý đánh giá sách và trả lời cảm nhận độc giả
 */
@Service
public class EvaluateServiceImpl implements EvaluateService {

    @Autowired
    private EvaluateRepository evaluateRepository;

    @Autowired
    private BookRepository bookRepository;

    @Autowired
    private CustomerRepository customerRepository;

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

        Book book = bookRepository.findById(request.getBookId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sách với mã: " + request.getBookId()));

        Evaluate evaluate = new Evaluate();
        evaluate.setBook(book);
        evaluate.setContent(request.getContent().trim());
        evaluate.setStar(Math.max(1, Math.min(5, request.getStar())));
        evaluate.setLikesCount(0);
        evaluate.setCreated_at(LocalDateTime.now());

        // Nếu có tài khoản đăng nhập, liên kết với Customer tương ứng
        if (accountId != null) {
            Customer customer = customerRepository.findCustomerById(accountId);
            if (customer != null) {
                evaluate.setCustomer(customer);

                // Thưởng +5 Khoai cho người đọc khi đánh giá sách
                int currentBalance = customer.getPotatoBalance() != null ? customer.getPotatoBalance() : 0;
                int currentEarned = customer.getTotalPotatoEarned() != null ? customer.getTotalPotatoEarned() : 0;
                customer.setPotatoBalance(currentBalance + 5);
                customer.setTotalPotatoEarned(currentEarned + 5);
                customerRepository.save(customer);
            }
        }

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
