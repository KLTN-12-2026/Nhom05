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

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT ar FROM Access_Record ar WHERE ar.access_record_id = :id")
    Optional<Access_Record> findByIdForUpdate(@Param("id") int id);

    @Query("SELECT ar FROM Access_Record ar WHERE ar.customer = :customer ORDER BY ar.lastReadAt DESC")
    List<Access_Record> findByCustomerOrderByLastReadAtDesc(@Param("customer") Customer customer);

    @Query("SELECT COUNT(ar) FROM Access_Record ar WHERE ar.customer = :customer")
    long countByCustomer(@Param("customer") Customer customer);

    @Query("SELECT ar FROM Access_Record ar WHERE ar.customer.customer_id = :customerId ORDER BY ar.lastReadAt DESC")
    List<Access_Record> findByCustomerIdOrderByLastReadAtDesc(@Param("customerId") String customerId);

    @Query("SELECT ar FROM Access_Record ar WHERE ar.customer = :customer AND ar.book = :book ORDER BY CASE WHEN UPPER(ar.status) = 'ACTIVE' THEN 0 ELSE 1 END, ar.readingPercentage DESC, ar.lastReadAt DESC, ar.access_record_id DESC")
    List<Access_Record> findAllByCustomerAndBook(@Param("customer") Customer customer, @Param("book") Book book);

    @Query("SELECT ar FROM Access_Record ar WHERE ar.customer.customer_id = :customerId AND ar.book.book_id = :bookId ORDER BY ar.access_record_id DESC")
    List<Access_Record> findAllByCustomerIdAndBookId(@Param("customerId") String customerId, @Param("bookId") String bookId);

 
    default Optional<Access_Record> findByCustomerAndBook(Customer customer, Book book) {
        List<Access_Record> list = findAllByCustomerAndBook(customer, book);
        return list == null || list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }


    default Optional<Access_Record> findByCustomerIdAndBookId(String customerId, String bookId) {
        List<Access_Record> list = findAllByCustomerIdAndBookId(customerId, bookId);
        return list == null || list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }
}
