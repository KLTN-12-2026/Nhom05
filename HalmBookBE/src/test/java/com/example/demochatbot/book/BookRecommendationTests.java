package com.example.demochatbot.book;

import com.example.demochatbot.dto.BookBasicDto;
import com.example.demochatbot.model.Book;
import com.example.demochatbot.model.Category;
import com.example.demochatbot.repository.BookRepository;
import com.example.demochatbot.service.book.BookServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Đề xuất & Gợi ý thuê cùng Test Suite (Book Recommendations & Trending)")
class BookRecommendationTests {

    @Mock
    private BookRepository bookRepository;

    @InjectMocks
    private BookServiceImpl bookService;

    private Book bookA;
    private Book bookB;
    private Book bookC;
    private Category catLit;

    @BeforeEach
    void setUp() {
        catLit = new Category(1, "Văn học", null, null);

        bookA = new Book();
        bookA.setBook_id("B0001");
        bookA.setBookName("Nhà Giả Kim");
        bookA.setAuthor("Paulo Coelho");
        bookA.setRent_price(9.0);
        bookA.setReadCount(500);
        bookA.setCategory(catLit);
        bookA.setStatus("PUBLISHED");

        bookB = new Book();
        bookB.setBook_id("B0002");
        bookB.setBookName("Hoàng Tử Bé");
        bookB.setAuthor("Antoine de Saint-Exupéry");
        bookB.setRent_price(9.0);
        bookB.setReadCount(450);
        bookB.setCategory(catLit);
        bookB.setStatus("PUBLISHED");

        bookC = new Book();
        bookC.setBook_id("B0003");
        bookC.setBookName("Đắc Nhân Tâm");
        bookC.setAuthor("Dale Carnegie");
        bookC.setRent_price(18.0);
        bookC.setReadCount(600);
        bookC.setStatus("PUBLISHED");
    }

    @Test
    @DisplayName("Gợi ý xu hướng: Trả về danh sách sách có lượt đọc nhiều nhất")
    void testFindTrendingBooks() {
        when(bookRepository.findTopTrendingBooks(any(Pageable.class)))
                .thenReturn(Arrays.asList(bookC, bookA, bookB));

        List<BookBasicDto> trending = bookService.findTrendingBooks(3);

        assertNotNull(trending);
        assertEquals(3, trending.size());
        assertEquals("B0003", trending.get(0).getBook_id());
        assertEquals("B0001", trending.get(1).getBook_id());
        assertEquals(600, trending.get(0).getReadCount());
    }

    @Test
    @DisplayName("Gợi ý giỏ hàng trống: Tự động trả về danh sách sách xu hướng")
    void testFindCartRecommendations_EmptyCart() {
        when(bookRepository.findTopTrendingBooks(any(Pageable.class)))
                .thenReturn(Arrays.asList(bookC, bookA));

        List<BookBasicDto> recs = bookService.findCartRecommendations(Collections.emptyList(), 5);

        assertNotNull(recs);
        assertEquals(2, recs.size());
        assertEquals("B0003", recs.get(0).getBook_id());
    }

    @Test
    @DisplayName("Gợi ý thuê cùng: Ưu tiên cùng thể loại và loại trừ sách đã có trong giỏ")
    void testFindCartRecommendations_WithCartBook() {
        // Giả sử giỏ hàng có sách B0001 (thể loại Văn học)
        when(bookRepository.findAllById(Collections.singletonList("B0001")))
                .thenReturn(Collections.singletonList(bookA));

        // Sách cùng thể loại Văn học còn lại là B0002
        when(bookRepository.findRecommendationsByCategories(eq(Collections.singletonList(1)), eq(Collections.singletonList("B0001")), any(Pageable.class)))
                .thenReturn(Collections.singletonList(bookB));

        // Bù thêm sách xu hướng B0003
        when(bookRepository.findTopTrendingExcluding(anyList(), any(Pageable.class)))
                .thenReturn(Collections.singletonList(bookC));

        List<BookBasicDto> recs = bookService.findCartRecommendations(Collections.singletonList("B0001"), 2);

        assertNotNull(recs);
        assertEquals(2, recs.size());
        // Ưu tiên B0002 (cùng thể loại) trước B0003 (xu hướng chung)
        assertEquals("B0002", recs.get(0).getBook_id());
        assertEquals("B0003", recs.get(1).getBook_id());
        // Đảm bảo không chứa sách B0001 đã có trong giỏ
        assertTrue(recs.stream().noneMatch(b -> "B0001".equals(b.getBook_id())));
    }
}
