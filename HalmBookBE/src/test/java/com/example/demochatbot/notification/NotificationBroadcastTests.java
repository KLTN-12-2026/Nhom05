package com.example.demochatbot.notification;

import com.example.demochatbot.controller.SupportTicketAdminController;
import com.example.demochatbot.dto.BroadcastRequest;
import com.example.demochatbot.enums.Role;
import com.example.demochatbot.model.*;
import com.example.demochatbot.repository.*;
import com.example.demochatbot.service.notification.NotificationBroadcastService;
import com.example.demochatbot.service.order.CheckoutCoordinator;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.SimpleTransactionStatus;
import org.springframework.web.server.ResponseStatusException;
import java.util.*;
import java.util.concurrent.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class NotificationBroadcastTests {
    static class Fixture {
        final NotificationBroadcastRepository broadcasts = mock(NotificationBroadcastRepository.class);
        final NotificationRepository inbox = mock(NotificationRepository.class);
        final CustomerRepository customers = mock(CustomerRepository.class);
        final PlatformTransactionManager manager = mock(PlatformTransactionManager.class);
        final Map<String, NotificationBroadcast> receipts = new ConcurrentHashMap<>();
        final List<Notification> saved = new ArrayList<>();
        final NotificationBroadcastService service;
        Fixture(List<Customer> readers) {
            when(manager.getTransaction(any())).thenAnswer(call -> new SimpleTransactionStatus());
            when(broadcasts.findById(anyString())).thenAnswer(call -> Optional.ofNullable(receipts.get(call.getArgument(0))));
            when(broadcasts.saveAndFlush(any())).thenAnswer(call -> { NotificationBroadcast receipt = call.getArgument(0); receipts.put(receipt.getRequestId(), receipt); return receipt; });
            when(broadcasts.save(any())).thenAnswer(call -> call.getArgument(0));
            when(customers.findAll()).thenReturn(readers);
            when(inbox.saveAll(anyIterable())).thenAnswer(call -> {
                Iterable<Notification> rows = call.getArgument(0); rows.forEach(saved::add); return saved;
            });
            service = new NotificationBroadcastService(broadcasts, inbox, customers, new CheckoutCoordinator(manager), new ObjectMapper());
        }
    }
    private Customer reader(String id, boolean vip, int balance, Role role) {
        Customer customer = new Customer(); customer.setCustomer_id(id); customer.setPotatoBalance(balance);
        Account account = new Account(); account.setRole(role); account.setStatus("ACTIVE"); customer.setAccount(account);
        MembershipTier tier = new MembershipTier(); tier.setDiscountPercent(vip ? 5 : 0); customer.setMembershipTier(tier);
        return customer;
    }
    private BroadcastRequest request() {
        BroadcastRequest request = new BroadcastRequest(); request.setRequestId(UUID.randomUUID().toString());
        request.setTitle(" Fixture title "); request.setMessage(" First line\nSecond line "); return request;
    }

    @Test void createsRealUnreadInboxEntriesForEveryReaderOnceAndReplaysTheReceipt() {
        Customer alice = reader("alice", false, 0, Role.USER), bob = reader("bob", true, 0, Role.USER);
        Fixture f = new Fixture(List.of(alice, bob, alice, reader("admin", false, 0, Role.ADMIN)));
        BroadcastRequest request = request(); request.setDestination("offers");
        var result = f.service.broadcast(request, "admin");
        assertEquals(2, result.get("sentCount")); assertEquals(false, result.get("replayed"));
        assertEquals(Set.of("alice", "bob"), new HashSet<>(f.saved.stream().map(Notification::getCustomerId).toList()));
        for (Notification notification : f.saved) {
            assertEquals(request.getRequestId(), notification.getBroadcastId()); assertEquals(false, notification.getIsRead());
            assertEquals("SYSTEM", notification.getType()); assertEquals("/uudai", notification.getLink());
            assertEquals("Fixture title", notification.getTitle()); assertEquals("First line\nSecond line", notification.getMessage());
        }
        var replay = f.service.broadcast(request, "admin");
        assertEquals(2, replay.get("sentCount")); assertEquals(true, replay.get("replayed"));
        verify(f.inbox, times(1)).saveAll(anyIterable());
    }

    @Test void targetGroupsUseMembershipBenefitsInsteadOfCurrentWalletBalance() {
        Fixture f = new Fixture(List.of(reader("rich-basic", false, 9999, Role.USER), reader("vip-empty-wallet", true, 0, Role.USER)));
        BroadcastRequest vip = request(); vip.setTarget("vip"); f.service.broadcast(vip, "admin");
        assertEquals("vip-empty-wallet", f.saved.getFirst().getCustomerId());
        BroadcastRequest standard = request(); standard.setTarget("standard"); f.service.broadcast(standard, "admin");
        assertEquals("rich-basic", f.saved.get(1).getCustomerId());
    }

    @Test void aKeyCannotBeReusedForDifferentContentOrAnotherAdmin() {
        Fixture f = new Fixture(List.of()); BroadcastRequest request = request(); f.service.broadcast(request, "admin");
        assertThrows(ResponseStatusException.class, () -> f.service.broadcast(request, "other-admin"));
        request.setMessage("Different content");
        assertThrows(ResponseStatusException.class, () -> f.service.broadcast(request, "admin"));
        verify(f.inbox, times(1)).saveAll(anyIterable());
    }

    @Test void invalidMessagesOrDestinationsCannotCreateAPartialCampaign() {
        Fixture f = new Fixture(List.of()); BroadcastRequest request = request(); request.setMessage(" ");
        assertThrows(IllegalArgumentException.class, () -> f.service.broadcast(request, "admin"));
        request.setMessage("Body"); request.setDestination("javascript:alert(1)");
        assertThrows(IllegalArgumentException.class, () -> f.service.broadcast(request, "admin"));
        request.setDestination("home"); request.setTarget("unknown");
        assertThrows(IllegalArgumentException.class, () -> f.service.broadcast(request, "admin"));
        verify(f.broadcasts, never()).saveAndFlush(any()); verifyNoInteractions(f.inbox);
    }

    @Test void fanOutFailureRollsBackTheWholeTransaction() {
        Fixture f = new Fixture(List.of(reader("alice", false, 0, Role.USER)));
        when(f.inbox.saveAll(anyIterable())).thenThrow(new IllegalStateException("database unavailable"));
        assertThrows(IllegalStateException.class, () -> f.service.broadcast(request(), "admin"));
        verify(f.manager).rollback(any()); verify(f.manager, never()).commit(any());
    }

    @Test void simultaneousRetriesCreateOnlyOneSetOfNotifications() throws Exception {
        Fixture f = new Fixture(List.of(reader("alice", false, 0, Role.USER))); BroadcastRequest request = request();
        ExecutorService executor = Executors.newFixedThreadPool(2);
        try {
            var first = executor.submit(() -> f.service.broadcast(request, "admin"));
            var second = executor.submit(() -> f.service.broadcast(request, "admin"));
            assertEquals(1, first.get(5, TimeUnit.SECONDS).get("sentCount"));
            assertEquals(1, second.get(5, TimeUnit.SECONDS).get("sentCount"));
            verify(f.inbox, times(1)).saveAll(anyIterable());
        } finally { executor.shutdownNow(); }
    }

    @Test void directControllerInvocationStillRequiresAnAdminIdentity() {
        SupportTicketAdminController controller = new SupportTicketAdminController();
        NotificationBroadcastService service = mock(NotificationBroadcastService.class);
        ReflectionTestUtils.setField(controller, "broadcastService", service);
        try {
            SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken("reader", "", List.of(new SimpleGrantedAuthority("ROLE_USER"))));
            assertEquals(403, controller.broadcastNotification(request()).getStatusCode().value()); verifyNoInteractions(service);
            SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken("admin", "", List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))));
            BroadcastRequest request = request(); when(service.broadcast(request, "admin")).thenReturn(Map.of("success", true, "sentCount", 0));
            assertEquals(200, controller.broadcastNotification(request).getStatusCode().value()); verify(service).broadcast(request, "admin");
        } finally { SecurityContextHolder.clearContext(); }
    }
}
