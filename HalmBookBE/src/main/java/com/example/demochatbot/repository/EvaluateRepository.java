package com.example.demochatbot.repository;

import com.example.demochatbot.model.Book;
import com.example.demochatbot.model.Evaluate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository thao tác bảng đánh giá (evaluate)
 */
@Repository
public interface EvaluateRepository extends JpaRepository<Evaluate, Integer> {

    /**
     * Lấy danh sách các đánh giá gốc (không có parent) theo mã sách, sắp xếp mới nhất lên đầu
     */
    @Query("SELECT e FROM Evaluate e WHERE e.book.book_id = :bookId AND e.parent IS NULL ORDER BY e.created_at DESC")
    List<Evaluate> findRootEvaluatesByBookId(@Param("bookId") String bookId);

    /**
     * Lấy toàn bộ đánh giá của 1 cuốn sách để tính điểm trung bình
     */
    List<Evaluate> findByBook(Book book);
}
