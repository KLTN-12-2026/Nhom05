package com.example.demochatbot.repository;

import com.example.demochatbot.model.FavoriteBook;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FavoriteBookRepository extends JpaRepository<FavoriteBook, Long> {
    List<FavoriteBook> findByCustomerIdOrderByCreatedAtDesc(String customerId);

    @Query("SELECT CASE WHEN COUNT(f) > 0 THEN true ELSE false END FROM FavoriteBook f WHERE f.customerId = :customerId AND f.book.book_id = :bookId")
    boolean existsByCustomerIdAndBookId(@Param("customerId") String customerId, @Param("bookId") String bookId);

    @Query("SELECT f FROM FavoriteBook f WHERE f.customerId = :customerId AND f.book.book_id = :bookId")
    Optional<FavoriteBook> findByCustomerIdAndBookId(@Param("customerId") String customerId, @Param("bookId") String bookId);

    @Modifying
    @Query("DELETE FROM FavoriteBook f WHERE f.customerId = :customerId AND f.book.book_id = :bookId")
    void deleteByCustomerIdAndBookId(@Param("customerId") String customerId, @Param("bookId") String bookId);

    long countByCustomerId(String customerId);
}

