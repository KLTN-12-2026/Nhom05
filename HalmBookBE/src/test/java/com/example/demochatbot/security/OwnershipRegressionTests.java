package com.example.demochatbot.security;

import com.example.demochatbot.config.*;
import com.example.demochatbot.controller.CartController;
import com.example.demochatbot.controller.UserSupportController;
import com.example.demochatbot.model.*;
import com.example.demochatbot.repository.*;
import com.example.demochatbot.service.customer.CustomerService;
import com.example.demochatbot.service.order.OrderService;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.*;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.HandlerMapping;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.handler.SimpleUrlHandlerMapping;
import org.springframework.web.servlet.resource.ResourceHttpRequestHandler;
import org.springframework.web.context.support.StaticWebApplicationContext;
import java.nio.file.*;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class OwnershipRegressionTests {
    @Test void guestCodeCannotReadAnAccountOwnedTicket() {
        SecurityContextHolder.clearContext();
        UserSupportController controller = new UserSupportController();
        SupportTicketRepository repository = mock(SupportTicketRepository.class);
        ReflectionTestUtils.setField(controller, "supportTicketRepository", repository);
        String code = "TK-" + UUID.randomUUID();
        Customer owner = new Customer(); owner.setCustomer_id("other-account");
        SupportTicket ticket = SupportTicket.builder().ticketId(1L).code(code).customer(owner).message("private").build();
        when(repository.findByCode(code)).thenReturn(Optional.of(ticket));
        assertTrue(((List<?>) controller.getMyTickets(null, code).getBody()).isEmpty());
    }

    @Test void queueFailurePersistsUsingTheAuthenticatedIdentity() {
        CustomerService customers = mock(CustomerService.class);
        Customer owner = new Customer(); owner.setCustomer_id("owner"); owner.setCustomerName("Reader");
        when(customers.getCurrentAccountId()).thenReturn(1);
        when(customers.findCustomerById(1)).thenReturn(owner);
        var producer = mock(com.example.demochatbot.service.support.SupportTicketProducer.class);
        var intake = mock(com.example.demochatbot.service.support.SupportTicketIntakeService.class);
        doThrow(new org.springframework.amqp.AmqpException("offline")).when(producer).sendTicketMessage(any());
        UserSupportController controller = new UserSupportController();
        ReflectionTestUtils.setField(controller, "customerService", customers);
        ReflectionTestUtils.setField(controller, "supportTicketProducer", producer);
        ReflectionTestUtils.setField(controller, "intakeService", intake);
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken("reader", "", List.of()));
        try {
            var result = controller.submitSupportTicket(Map.of("subject", "Fixture", "message", "Help", "customerId", "victim"));
            assertEquals(200, result.getStatusCode().value());
            verify(intake).accept(argThat(message -> "owner".equals(message.getCustomerId()) && message.getCode().length() == 39));
        } finally { SecurityContextHolder.clearContext(); }
    }

    @Test void anonymousCallerCannotReadSupportHistoryByEmail() {
        SecurityContextHolder.clearContext();
        UserSupportController controller = new UserSupportController();
        SupportTicketRepository tickets = mock(SupportTicketRepository.class);
        CustomerRepository customers = mock(CustomerRepository.class);
        SupportTicket ticket = new SupportTicket();
        ticket.setTicketId(1L);
        ticket.setSenderEmail("victim@example.invalid");
        ticket.setMessage("private synthetic fixture");
        when(tickets.findAllByOrderByCreatedAtDesc()).thenReturn(List.of(ticket));
        ReflectionTestUtils.setField(controller, "supportTicketRepository", tickets);
        ReflectionTestUtils.setField(controller, "customerRepository", customers);
        var result = controller.getMyTickets("victim@example.invalid", null);
        assertEquals(200, result.getStatusCode().value());
        List<?> rows = (List<?>) result.getBody();
        assertTrue(rows.isEmpty());
        verify(tickets, never()).findAllByOrderByCreatedAtDesc();
    }

    @Test void cartRejectsAnotherAccountId() {
        CartController controller = new CartController();
        CustomerService customers = mock(CustomerService.class);
        when(customers.getCurrentAccountId()).thenReturn(1);
        ReflectionTestUtils.setField(controller, "customerService", customers);
        assertThrows(org.springframework.security.access.AccessDeniedException.class,
                () -> ReflectionTestUtils.invokeMethod(controller, "resolveCurrentUserId", 2));
    }

    @Test void globalHandlerPreservesServiceUnavailable() {
        var result = new GlobalExceptionHandler().handleResponseStatus(
                new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "MoMo not configured"));
        assertEquals(503, result.getStatusCode().value());
    }

    @Test void protectedResourceCacheMustNotReuseAuthorizedResourceForAnonymousRequest() throws Exception {
        CustomerService customers = mock(CustomerService.class);
        OrderService orders = mock(OrderService.class);
        BookRepository books = mock(BookRepository.class);
        String filename = "audit-" + UUID.randomUUID() + ".pdf";
        Path file = Paths.get("uploads", "pdfs", filename);
        Files.createDirectories(file.getParent());
        Files.writeString(file, "%PDF-1.4 synthetic audit resource");
        MockServletContext servlet = new MockServletContext();
        StaticWebApplicationContext context = new StaticWebApplicationContext();
        context.setServletContext(servlet);
        context.refresh();
        try {
            Book book = new Book(); book.setBook_id("audit-book");
            when(books.findFirstByPdfPublicIdEndingWith("/" + filename)).thenReturn(Optional.of(book));
            when(customers.getCurrentAccountId()).thenReturn(1);
            when(orders.checkBookAccess(1, "audit-book")).thenReturn(true);
            ResourceHandlerRegistry registry = new ResourceHandlerRegistry(context, servlet);
            new WebMvcConfig(customers, orders, books).addResourceHandlers(registry);
            SimpleUrlHandlerMapping mapping = ReflectionTestUtils.invokeMethod(registry, "getHandlerMapping");
            ResourceHttpRequestHandler handler = (ResourceHttpRequestHandler) mapping.getUrlMap().get("/uploads/**");
            handler.setServletContext(servlet);
            handler.setApplicationContext(context);
            handler.afterPropertiesSet();
            SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken("reader", "", List.of()));
            MockHttpServletRequest first = request(filename);
            MockHttpServletResponse allowed = new MockHttpServletResponse();
            handler.handleRequest(first, allowed);
            assertEquals(200, allowed.getStatus());
            SecurityContextHolder.clearContext();
            MockHttpServletResponse anonymous = new MockHttpServletResponse();
            assertThrows(org.springframework.web.servlet.resource.NoResourceFoundException.class,
                    () -> handler.handleRequest(request(filename), anonymous));
        } finally {
            SecurityContextHolder.clearContext();
            Files.deleteIfExists(file);
            context.close();
        }
    }

    private MockHttpServletRequest request(String filename) {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/uploads/pdfs/" + filename);
        request.setAttribute(HandlerMapping.PATH_WITHIN_HANDLER_MAPPING_ATTRIBUTE, "pdfs/" + filename);
        return request;
    }
}
