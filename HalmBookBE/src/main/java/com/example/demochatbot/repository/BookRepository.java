package com.example.demochatbot.repository;

import com.example.demochatbot.model.Book;
import org.springframework.data.domain.Limit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BookRepository extends JpaRepository<Book, String> {
    @Query(value = "select * from book " ,  nativeQuery = true)
    List<Book> findAllBoooks();

    List<Book> findByBookNameContainingIgnoreCase(String keyword);
}
