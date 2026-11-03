package com.example.demochatbot.repository;

import com.example.demochatbot.model.ReadingNoteBookmark;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReadingNoteBookmarkRepository extends JpaRepository<ReadingNoteBookmark, Integer> {

    @Query("SELECT r FROM ReadingNoteBookmark r WHERE r.customer.customer_id = :customerId AND r.book.book_id = :bookId ORDER BY r.createdAt DESC")
    List<ReadingNoteBookmark> findByCustomerAndBook(
            @Param("customerId") String customerId,
            @Param("bookId") String bookId
    );

    @Query("SELECT r FROM ReadingNoteBookmark r WHERE r.customer.customer_id = :customerId ORDER BY r.createdAt DESC")
    List<ReadingNoteBookmark> findByCustomer(@Param("customerId") String customerId);
}
