package com.example.demochatbot.security;

import com.example.demochatbot.config.JwtAuthenticationFilter;
import com.example.demochatbot.config.JwtTokenProvider;
import com.example.demochatbot.controller.*;
import com.example.demochatbot.dto.BookDto;
import com.example.demochatbot.model.*;
import com.example.demochatbot.repository.*;
import com.example.demochatbot.service.account.CustomUserDetails;
import com.example.demochatbot.service.auth.TokenBlacklistService;
import com.example.demochatbot.service.book.BookService;
import com.example.demochatbot.service.customer.CustomerService;
import com.example.demochatbot.service.order.OrderService;
import com.example.demochatbot.service.order.OrderServiceImpl;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.util.ReflectionTestUtils;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.atomic.AtomicBoolean;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AdminAccessLifecycleTests {
    @AfterEach void cleanup() { SecurityContextHolder.clearContext(); }

    @Test void adminLockBlocksTheExistingJwtAndUnlockAllowsANewRequest() throws Exception {
        Account account = new Account(); account.setUsername("reader"); account.setStatus("ACTIVE");
        Customer customer = new Customer(); customer.setAccount(account);
        CustomerRepository customers = mock(CustomerRepository.class);
        when(customers.findById("customer")).thenReturn(Optional.of(customer));
        CustomerAdminController admin = new CustomerAdminController();
        ReflectionTestUtils.setField(admin, "customerRepository", customers);
        ReflectionTestUtils.setField(admin, "accountRepository", mock(AccountRepository.class));
        JwtTokenProvider tokens = mock(JwtTokenProvider.class);
        when(tokens.validateToken("existing")).thenReturn(true);
        when(tokens.getEmailFromJWT("existing")).thenReturn("reader");
        UserDetailsService users = mock(UserDetailsService.class);
        when(users.loadUserByUsername("reader")).thenAnswer(call -> new CustomUserDetails(account));
        JwtAuthenticationFilter filter = new JwtAuthenticationFilter(tokens, users, mock(TokenBlacklistService.class));

        assertEquals(200, admin.toggleLockCustomer("customer").getStatusCode().value());
        assertEquals("LOCKED", account.getStatus());
        MockHttpServletResponse locked = new MockHttpServletResponse();
        AtomicBoolean reached = new AtomicBoolean();
        filter.doFilter(request("existing"), locked, (req, res) -> reached.set(true));
        assertEquals(423, locked.getStatus()); assertTrue(locked.getContentAsString().contains("ACCOUNT_LOCKED"));
        assertFalse(reached.get()); assertNull(SecurityContextHolder.getContext().getAuthentication());

        admin.toggleLockCustomer("customer");
        filter.doFilter(request("existing"), new MockHttpServletResponse(), (req, res) -> reached.set(true));
        assertTrue(reached.get()); assertEquals("ACTIVE", account.getStatus());
    }

    private MockHttpServletRequest request(String token) {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/auth/me");
        request.addHeader("Authorization", "Bearer " + token); return request;
    }

    @Test void revokeStopsDownloadsAndKeepsItsStatusAfterExpiry() {
        Customer owner = new Customer(); owner.setCustomer_id("owner");
        Book book = new Book(); book.setBook_id("book"); book.setBookName("Fixture");
        Access_Record record = new Access_Record(); record.setAccess_record_id(7); record.setCustomer(owner);
        record.setBook(book); record.setStatus("ACTIVE"); record.setEnd_date(LocalDateTime.now().plusDays(7));
        CustomerRepository customers = mock(CustomerRepository.class);
        when(customers.findCustomerById(1)).thenReturn(owner);
        when(customers.findByIdForUpdate("owner")).thenReturn(Optional.of(owner));
        AccessRecordRepository access = mock(AccessRecordRepository.class);
        when(access.findByCustomerIdAndBookId("owner", "book")).thenReturn(Optional.of(record));
        when(access.findByCustomerOrderByLastReadAtDesc(owner)).thenReturn(List.of(record));
        when(access.findByIdForUpdate(7)).thenReturn(Optional.of(record));
        OrderServiceImpl orders = new OrderServiceImpl();
        ReflectionTestUtils.setField(orders, "customerRepository", customers);
        ReflectionTestUtils.setField(orders, "accessRecordRepository", access);
        CustomerService current = mock(CustomerService.class); when(current.getCurrentAccountId()).thenReturn(1);
        HomeController home = new HomeController();
        ReflectionTestUtils.setField(home, "customerService", current);
        ReflectionTestUtils.setField(home, "orderService", orders);
        BookService books = mock(BookService.class); BookDto detail = new BookDto(); detail.setFileFormat("PDF");
        when(books.findBookDetailById("book")).thenReturn(detail);
        ReflectionTestUtils.setField(home, "bookService", books);
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken("reader", "", List.of()));
        var before = home.getBookReadUrl("book");
        assertEquals(200, before.getStatusCode().value());
        assertEquals("/api/home/books/book/content", ((Map<?, ?>) before.getBody()).get("readUrl"));
        assertTrue(before.getHeaders().getCacheControl().contains("no-store"));
        verify(books, never()).getBookReadUrl(anyString());

        BookRentalAdminController admin = new BookRentalAdminController();
        ReflectionTestUtils.setField(admin, "accessRecordRepository", access);
        ReflectionTestUtils.setField(admin, "customerRepository", customers);
        NotificationRepository notifications = mock(NotificationRepository.class);
        ReflectionTestUtils.setField(admin, "notificationRepository", notifications);
        assertEquals(200, admin.revokeRental(7).getStatusCode().value());
        assertEquals("REVOKED", record.getStatus());
        assertEquals(403, home.getBookReadUrl("book").getStatusCode().value());
        assertEquals(403, home.getBookContent("book").getStatusCode().value());
        assertEquals(409, admin.revokeRental(7).getStatusCode().value());
        verify(notifications, times(1)).save(any());
        record.setEnd_date(LocalDateTime.now().minusDays(1));
        assertFalse(orders.checkBookAccess(1, "book"));
        assertEquals("REVOKED", orders.getCustomerBookshelf(1).getFirst().getStatus());
        assertEquals("REVOKED", record.getStatus());
    }

    @Test void accessDetailDoesNotRewriteRevokedRecordsAsExpired() {
        Customer owner = new Customer(); owner.setCustomer_id("owner");
        Access_Record record = new Access_Record(); record.setStatus("REVOKED"); record.setEnd_date(LocalDateTime.now().minusDays(1));
        CustomerService current = mock(CustomerService.class); when(current.getCurrentAccountId()).thenReturn(1);
        CustomerRepository customers = mock(CustomerRepository.class); when(customers.findCustomerById(1)).thenReturn(owner);
        AccessRecordRepository access = mock(AccessRecordRepository.class);
        when(access.findByCustomerIdAndBookId("owner", "book")).thenReturn(Optional.of(record));
        UserFeaturesController controller = new UserFeaturesController(current, mock(OrderService.class), null, customers, access, null, null, null, null, null, null);
        var response = controller.getBookAccessDetail("book");
        Map<?, ?> data = (Map<?, ?>) response.getBody();
        assertEquals(false, data.get("hasAccess")); assertEquals("REVOKED", data.get("status"));
        assertTrue(response.getHeaders().getCacheControl().contains("no-store"));
        verify(access, never()).save(any());
    }
}
