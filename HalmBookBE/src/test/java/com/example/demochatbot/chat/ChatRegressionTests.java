package com.example.demochatbot.chat;

import com.example.demochatbot.controller.*;
import com.example.demochatbot.dto.ChatRequest;
import com.example.demochatbot.model.*;
import com.example.demochatbot.repository.*;
import com.example.demochatbot.service.ai.*;
import com.example.demochatbot.service.customer.CustomerService;
import com.example.demochatbot.service.support.SupportChatHistory;
import org.junit.jupiter.api.*;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.memory.MessageWindowChatMemory;
import org.springframework.ai.chat.messages.*;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import org.mockito.ArgumentCaptor;

class ChatRegressionTests {
    private final Customer customer = new Customer();
    private final CustomerService customers = mock(CustomerService.class);
    private final ChatHistoryStore history = mock(ChatHistoryStore.class);
    private final ChatClient.Builder builder = mock(ChatClient.Builder.class);
    private final ChatClient client = mock(ChatClient.class);
    private final ChatClient.ChatClientRequestSpec prompt = mock(ChatClient.ChatClientRequestSpec.class, RETURNS_SELF);
    private final ChatClient.CallResponseSpec response = mock(ChatClient.CallResponseSpec.class);
    private ChatService ai;

    @BeforeEach void setup() {
        customer.setCustomer_id("reader-1");
        customer.setEmail("reader@example.test");
        when(customers.getCurrentAccountId()).thenReturn(7);
        when(customers.findCustomerById(7)).thenReturn(customer);
        when(builder.build()).thenReturn(client);
        when(client.prompt()).thenReturn(prompt);
        when(prompt.call()).thenReturn(response);
        when(response.content()).thenReturn("Xin chào bạn đọc");
        when(history.read(customer)).thenReturn(List.of());
        ai = new ChatService(builder, mock(BookRepository.class), mock(PotatoPackageRepository.class),
                mock(EvaluateRepository.class), mock(MembershipTierRepository.class), mock(CustomerRepository.class),
                customers, history, MessageWindowChatMemory.builder().maxMessages(20).build());
    }

    @AfterEach void cleanup() { SecurityContextHolder.clearContext(); }

    @Test void aiUsesPersistedHistoryAndSavesOneCompleteTurn() {
        Chat_Message previous = new Chat_Message();
        previous.setSender("USER");
        previous.setContent("Tôi thích truyện trinh thám");
        when(history.read(customer)).thenReturn(List.of(previous));
        assertEquals("Xin chào bạn đọc", ai.chat(new ChatRequest("Gợi ý sách"), "reader@example.test"));
        ArgumentCaptor<List<Message>> context = ArgumentCaptor.captor();
        verify(prompt).messages(context.capture());
        assertEquals("Tôi thích truyện trinh thám", context.getValue().getFirst().getText());
        verify(history).saveTurn(customer, "Gợi ý sách", "Xin chào bạn đọc");
    }

    @Test void failedDatabaseWriteIsNotReportedAsASuccessfulAiReply() {
        doThrow(new IllegalStateException("DB unavailable")).when(history).saveTurn(any(), anyString(), anyString());
        assertThrows(IllegalStateException.class, () -> ai.chat(new ChatRequest("Chào"), "reader@example.test"));
        verify(response, times(1)).content();
    }

    @Test void guestsHaveSeparateContextsAndClearForgetsConversation() {
        String first = UUID.randomUUID().toString(), second = UUID.randomUUID().toString();
        ai.chat(new ChatRequest("Bí mật của A", first), "guest_session");
        ai.chat(new ChatRequest("Chào từ B", second), "guest_session");
        ai.chat(new ChatRequest("Nhớ gì không?", first), "guest_session");
        ai.clearChatHistory("guest_session", first);
        ai.chat(new ChatRequest("Bắt đầu lại", first), "guest_session");
        ArgumentCaptor<List<Message>> context = ArgumentCaptor.captor();
        verify(prompt, times(4)).messages(context.capture());
        assertTrue(context.getAllValues().get(1).isEmpty());
        assertEquals("Bí mật của A", context.getAllValues().get(2).getFirst().getText());
        assertTrue(context.getAllValues().get(3).isEmpty());
        verifyNoInteractions(history);
    }

    @Test void missingGuestIdsNeverShareContext() {
        ai.chat(new ChatRequest("A"), "guest_session");
        ai.chat(new ChatRequest("B"), "guest_session");
        ArgumentCaptor<List<Message>> context = ArgumentCaptor.captor();
        verify(prompt, times(2)).messages(context.capture());
        assertTrue(context.getAllValues().stream().allMatch(List::isEmpty));
    }

    @Test void sameContentIsPreservedButRetryOfSameSupportRequestIsIdempotent() {
        SupportTicketRepository repository = mock(SupportTicketRepository.class);
        UserSupportController controller = new UserSupportController();
        ReflectionTestUtils.setField(controller, "supportTicketRepository", repository);
        ReflectionTestUtils.setField(controller, "customerService", customers);
        SupportTicket ticket = new SupportTicket();
        ticket.setTicketId(1L);
        ticket.setCustomer(customer);
        ticket.setSenderName("Reader");
        ticket.setMessage("Xin hỗ trợ");
        ticket.setCreatedAt(LocalDateTime.now());
        when(repository.findByIdForUpdate(1L)).thenReturn(Optional.of(ticket));
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                "reader@example.test", "", List.of()));
        assertEquals(200, controller.addUserMessage(1L, Map.of("message", "Xin hỗ trợ", "requestId", "one")).getStatusCode().value());
        assertEquals(200, controller.addUserMessage(1L, Map.of("message", "Xin hỗ trợ", "requestId", "two")).getStatusCode().value());
        assertEquals(200, controller.addUserMessage(1L, Map.of("message", "Xin hỗ trợ", "requestId", "two")).getStatusCode().value());
        assertEquals(3, SupportChatHistory.read(ticket, "").size());
        verify(repository, times(2)).save(ticket);
    }

    @Test void corruptSupportTranscriptCannotBeSilentlyOverwritten() {
        SupportTicket ticket = new SupportTicket();
        ticket.setMessage("legacy message");
        ticket.setChatHistory("{broken");
        assertThrows(IllegalStateException.class, () -> SupportChatHistory.read(ticket, ""));
        assertEquals("{broken", ticket.getChatHistory());
    }

    @Test void adminReplyRetryDoesNotDuplicateMessageOrNotification() {
        SupportTicketRepository repository = mock(SupportTicketRepository.class);
        NotificationRepository notifications = mock(NotificationRepository.class);
        SupportTicketAdminController controller = new SupportTicketAdminController();
        ReflectionTestUtils.setField(controller, "supportTicketRepository", repository);
        ReflectionTestUtils.setField(controller, "notificationRepository", notifications);
        SupportTicket ticket = new SupportTicket();
        ticket.setTicketId(2L);
        ticket.setCustomer(customer);
        ticket.setMessage("Cần giúp");
        when(repository.findByIdForUpdate(2L)).thenReturn(Optional.of(ticket));
        Map<String, String> body = Map.of("reply", "Đã kiểm tra", "requestId", "admin-one");
        assertEquals(200, controller.replyTicket(2L, body).getStatusCode().value());
        assertEquals(200, controller.replyTicket(2L, body).getStatusCode().value());
        assertEquals(2, SupportChatHistory.read(ticket, "").size());
        verify(repository, times(1)).save(ticket);
        verify(notifications, times(1)).save(any());
    }

    @Test void storedAiMessagesAreNotDeduplicatedByContent() {
        ChatSessionRepository sessions = mock(ChatSessionRepository.class);
        ChatMessageRepository messages = mock(ChatMessageRepository.class);
        when(sessions.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        ChatHistoryStore store = new ChatHistoryStore(sessions, messages);
        store.saveTurn(customer, "Chào", "Chào");
        store.saveTurn(customer, "Chào", "Chào");
        ArgumentCaptor<Chat_Message> saved = ArgumentCaptor.forClass(Chat_Message.class);
        verify(messages, times(4)).save(saved.capture());
        assertEquals(List.of("USER", "BOT", "USER", "BOT"), saved.getAllValues().stream().map(Chat_Message::getSender).toList());
    }
}
