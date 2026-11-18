package com.example.demochatbot.repository;

import com.example.demochatbot.model.Book;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BookRepository extends JpaRepository<Book, String> {

    @Query(value = "SELECT * FROM book WHERE book_id = :bookId", nativeQuery = true)
    Book findBookById(@Param("bookId") String bookId);

    java.util.Optional<Book> findFirstByPdfPublicIdEndingWith(String suffix);

    List<Book> findByBookNameContainingIgnoreCase(String keyword);

    @Query(value = "select * from book",
            countQuery = "select count(*) from book",
            nativeQuery = true)
    Page<Book> findAllBook(Pageable pageable);

    @Query(value = "select * from book where category_id = :categoryId order by book_id",
            countQuery = "select count(*) from book where category_id = :categoryId",
            nativeQuery = true)
    Page<Book> findBooksByCategoryId(@Param("categoryId") int categoryId, Pageable pageable);
}
