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

    @Query("SELECT b FROM Book b LEFT JOIN b.category c WHERE (b.status IS NULL OR b.status = 'PUBLISHED') AND "
            + "(LOWER(b.bookName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR "
            + "LOWER(b.author) LIKE LOWER(CONCAT('%', :keyword, '%')) OR "
            + "LOWER(c.category_name) LIKE LOWER(CONCAT('%', :keyword, '%'))) ORDER BY b.bookName, b.book_id")
    List<Book> searchBooksForChat(@Param("keyword") String keyword, Pageable pageable);

    @Query(value = "select * from book",
            countQuery = "select count(*) from book",
            nativeQuery = true)
    Page<Book> findAllBook(Pageable pageable);

    @Query("SELECT b FROM Book b WHERE (b.status IS NULL OR b.status = 'PUBLISHED') ORDER BY COALESCE(b.readCount, 0) DESC, b.rent_price ASC")
    List<Book> findTopTrendingBooks(Pageable pageable);

    @Query("SELECT b FROM Book b WHERE (b.status IS NULL OR b.status = 'PUBLISHED') AND b.category.category_id IN :categoryIds AND b.book_id NOT IN :excludeBookIds ORDER BY COALESCE(b.readCount, 0) DESC, b.rent_price ASC")
    List<Book> findRecommendationsByCategories(
            @Param("categoryIds") List<Integer> categoryIds,
            @Param("excludeBookIds") List<String> excludeBookIds,
            Pageable pageable);

    @Query("SELECT b FROM Book b WHERE (b.status IS NULL OR b.status = 'PUBLISHED') AND b.book_id NOT IN :excludeBookIds ORDER BY COALESCE(b.readCount, 0) DESC, b.rent_price ASC")
    List<Book> findTopTrendingExcluding(
            @Param("excludeBookIds") List<String> excludeBookIds,
            Pageable pageable);

    @Query("SELECT b FROM Book b WHERE (b.status IS NULL OR b.status = 'PUBLISHED') AND LOWER(b.author) = LOWER(:author) AND b.book_id <> :excludeBookId ORDER BY COALESCE(b.readCount, 0) DESC")
    List<Book> findByAuthorExcluding(
            @Param("author") String author,
            @Param("excludeBookId") String excludeBookId,
            Pageable pageable);

    @Query("SELECT b FROM Book b WHERE (b.status IS NULL OR b.status = 'PUBLISHED') AND b.category.category_id = :categoryId AND b.book_id <> :excludeBookId ORDER BY COALESCE(b.readCount, 0) DESC")
    List<Book> findByCategoryExcluding(
            @Param("categoryId") Integer categoryId,
            @Param("excludeBookId") String excludeBookId,
            Pageable pageable);
    @Query(value = "select * from book where category_id = :categoryId order by book_id",
            countQuery = "select count(*) from book where category_id = :categoryId",
            nativeQuery = true)
    Page<Book> findBooksByCategoryId(@Param("categoryId") int categoryId, Pageable pageable);
}
