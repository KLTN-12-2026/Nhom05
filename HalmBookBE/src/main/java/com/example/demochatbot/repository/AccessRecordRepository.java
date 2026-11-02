package com.example.demochatbot.repository;

import com.example.demochatbot.model.Access_Record;
import com.example.demochatbot.model.Book;
import com.example.demochatbot.model.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * ============================================================================
 * Repository: AccessRecordRepository
 * Mô tả: Quản lý quyền đọc sách, thời hạn thuê và tiến độ đọc của độc giả
 * ============================================================================
 */
@Repository
public interface AccessRecordRepository extends JpaRepository<Access_Record, Integer> {

    @Query("SELECT ar FROM Access_Record ar WHERE ar.customer = :customer ORDER BY ar.lastReadAt DESC")
    List<Access_Record> findByCustomerOrderByLastReadAtDesc(@Param("customer") Customer customer);

    @Query("SELECT COUNT(ar) FROM Access_Record ar WHERE ar.customer = :customer")
    long countByCustomer(@Param("customer") Customer customer);

    @Query("SELECT ar FROM Access_Record ar WHERE ar.customer.customer_id = :customerId ORDER BY ar.lastReadAt DESC")
    List<Access_Record> findByCustomerIdOrderByLastReadAtDesc(@Param("customerId") String customerId);

    @Query("SELECT ar FROM Access_Record ar WHERE ar.customer = :customer AND ar.book = :book")
    Optional<Access_Record> findByCustomerAndBook(@Param("customer") Customer customer, @Param("book") Book book);

    @Query("SELECT ar FROM Access_Record ar WHERE ar.customer.customer_id = :customerId AND ar.book.book_id = :bookId")
    Optional<Access_Record> findByCustomerIdAndBookId(@Param("customerId") String customerId, @Param("bookId") String bookId);
}
