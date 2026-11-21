package com.example.demochatbot.book;

import com.example.demochatbot.controller.PromotionController;
import com.example.demochatbot.model.Book;
import com.example.demochatbot.model.Promotion;
import com.example.demochatbot.repository.BookRepository;
import com.example.demochatbot.repository.PromotionRepository;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import java.util.Map;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class PromotionBookTests {
    private PromotionController controller(PromotionRepository promotions, BookRepository books) {
        PromotionController controller = new PromotionController();
        ReflectionTestUtils.setField(controller, "promotionRepository", promotions);
        ReflectionTestUtils.setField(controller, "bookRepository", books);
        return controller;
    }

    @Test void createAcceptsAnExistingBookAndReturnsItsId() {
        PromotionRepository promotions = mock(PromotionRepository.class);
        BookRepository books = mock(BookRepository.class);
        Book book = new Book(); book.setBook_id("BOOK-1");
        when(books.findById("BOOK-1")).thenReturn(Optional.of(book));
        when(promotions.save(any())).thenAnswer(call -> call.getArgument(0));
        var response = controller(promotions, books).createPromotion(Map.of("promotion_id", "SALE", "book_id", "BOOK-1"));
        assertEquals(201, response.getStatusCode().value());
        Promotion saved = (Promotion) response.getBody();
        assertSame(book, saved.getBook()); assertEquals("BOOK-1", saved.getBook_id());
    }

    @Test void invalidBookDoesNotCreateAPromotion() {
        PromotionRepository promotions = mock(PromotionRepository.class);
        BookRepository books = mock(BookRepository.class);
        when(books.findById("missing")).thenReturn(Optional.empty());
        var response = controller(promotions, books).createPromotion(Map.of("promotion_id", "SALE", "book_id", "missing"));
        assertEquals(400, response.getStatusCode().value());
        verify(promotions, never()).save(any());
    }

    @Test void clearingBookIdKeepsThePromotionAsAGlobalPromotion() {
        PromotionRepository promotions = mock(PromotionRepository.class);
        BookRepository books = mock(BookRepository.class);
        Promotion promotion = new Promotion(); promotion.setPromotion_id("SALE"); promotion.setPromotion_name("Sale"); promotion.setStatus("ACTIVE"); promotion.setDiscount_percent(10); promotion.setBook(new Book());
        when(promotions.findById("SALE")).thenReturn(Optional.of(promotion));
        when(promotions.save(any())).thenAnswer(call -> call.getArgument(0));
        var response = controller(promotions, books).updatePromotion("SALE", Map.of("book_id", ""));
        assertEquals(200, response.getStatusCode().value());
        assertNull(((Promotion) response.getBody()).getBook()); assertNull(((Promotion) response.getBody()).getBook_id());
        verifyNoInteractions(books);
    }
    @Test void createHonorsAdminDatesCategoryScopeAndFixedKhoaiAmount() {
        PromotionRepository promotions = mock(PromotionRepository.class); BookRepository books = mock(BookRepository.class);
        var categories = mock(com.example.demochatbot.repository.CategoryRepository.class); var category = new com.example.demochatbot.model.Category(); category.setCategory_id(1000);
        when(categories.findById(1000)).thenReturn(Optional.of(category)); when(promotions.save(any())).thenAnswer(call -> call.getArgument(0));
        var controller = controller(promotions, books); ReflectionTestUtils.setField(controller, "categoryRepository", categories);
        var response = controller.createPromotion(Map.of("promotion_id", "DATE", "category_id", 1000, "discount_amount", "5", "start_date", "2027-01-01", "end_date", "2027-01-02"));
        assertEquals(201, response.getStatusCode().value()); Promotion saved = (Promotion) response.getBody();
        assertEquals(0, saved.getDiscount_percent()); assertEquals(5, saved.getDiscount_amount()); assertSame(category, saved.getCategory());
        assertEquals(java.time.LocalDateTime.parse("2027-01-01T00:00"), saved.getStart_date()); assertEquals(java.time.LocalDate.of(2027, 1, 2), saved.getEnd_date().toLocalDate());
    }
    @Test void invalidVoucherEditsNeverMutateOrSaveThePreviouslyValidConfiguration() {
        PromotionRepository promotions = mock(PromotionRepository.class); BookRepository books = mock(BookRepository.class);
        Promotion old = new Promotion(); old.setPromotion_id("SALE"); old.setPromotion_name("Valid"); old.setStatus("ACTIVE"); old.setDiscount_percent(10);
        when(promotions.findById("SALE")).thenReturn(Optional.of(old));
        var response = controller(promotions, books).updatePromotion("SALE", Map.of("promotion_name", "Invalid edit", "discount_amount", 5));
        assertEquals(400, response.getStatusCode().value()); assertEquals("Valid", old.getPromotion_name()); assertEquals(0, old.getDiscount_amount()); verify(promotions, never()).save(any());
    }
}
