package com.example.demochatbot.chat;

import com.example.demochatbot.dto.SupportTicketMessage;
import com.example.demochatbot.model.*;
import com.example.demochatbot.repository.*;
import com.example.demochatbot.service.support.*;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.mail.MailAuthenticationException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class SupportConsumerTests {
    private final SupportTicketRepository tickets = mock(SupportTicketRepository.class);
    private final CustomerRepository customers = mock(CustomerRepository.class);
    private final NotificationRepository notifications = mock(NotificationRepository.class);
    private final SupportTicketIntakeService intake = mock(SupportTicketIntakeService.class);
    private final JavaMailSender mail = mock(JavaMailSender.class);

    private SupportTicketMessage message(String code) {
        return SupportTicketMessage.builder().code(code).subject("Kiểm tra tiếng Việt")
                .message("Nhờ hỗ trợ").senderEmail("test@example.invalid").build();
    }

    private SupportTicketConsumer consumer() {
        SupportTicketConsumer consumer = new SupportTicketConsumer(intake, tickets);
        ReflectionTestUtils.setField(consumer, "mailSender", mail);
        ReflectionTestUtils.setField(consumer, "senderAddress", "sender@example.invalid");
        return consumer;
    }

    @Test void previouslySavedDeliveryDoesNotInsertOrNotifyAgain() {
        when(tickets.existsByCode("TK-30939")).thenReturn(true);
        SupportTicketIntakeService store = new SupportTicketIntakeService(tickets, customers, notifications);
        assertTrue(store.accept(message("TK-30939")).isEmpty());
        verify(tickets, never()).saveAndFlush(any());
        verifyNoInteractions(customers, notifications);
    }

    @Test void duplicateDeliveryDoesNotSendEmailAgain() {
        when(intake.accept(any())).thenReturn(Optional.empty());
        assertDoesNotThrow(() -> consumer().processSupportTicket(message("duplicate")));
        verifyNoInteractions(mail);
    }

    @Test void concurrentUniqueCodeCollisionIsAcknowledgedAfterAnotherConsumerCommits() {
        when(intake.accept(any())).thenThrow(new DataIntegrityViolationException("unique code"));
        when(tickets.existsByCode("race")).thenReturn(true);
        assertDoesNotThrow(() -> consumer().processSupportTicket(message("race")));
        verifyNoInteractions(mail);
    }

    @Test void unrelatedDatabaseFailureStillReachesTheListenerRetryPolicy() {
        when(intake.accept(any())).thenThrow(new DataIntegrityViolationException("invalid column"));
        assertThrows(DataIntegrityViolationException.class, () -> consumer().processSupportTicket(message("not-saved")));
    }

    @Test void smtpAuthenticationFailureStopsRepeatedLoginsButTicketProcessingContinues() {
        SupportTicket saved = SupportTicket.builder().code("saved").senderEmail("test@example.invalid").build();
        when(intake.accept(any())).thenReturn(Optional.of(saved));
        doThrow(new MailAuthenticationException("bad credentials")).when(mail).send(any(SimpleMailMessage.class));
        SupportTicketConsumer consumer = consumer();
        assertDoesNotThrow(() -> consumer.processSupportTicket(message("one")));
        assertDoesNotThrow(() -> consumer.processSupportTicket(message("two")));
        verify(intake, times(2)).accept(any());
        verify(mail, times(1)).send(any(SimpleMailMessage.class));
    }

    @Test void demoCanDisableConfirmationEmailWithoutDisablingPersistence() {
        when(intake.accept(any())).thenReturn(Optional.of(SupportTicket.builder().code("saved").senderEmail("test@example.invalid").build()));
        SupportTicketConsumer consumer = consumer();
        ReflectionTestUtils.setField(consumer, "confirmationEmailEnabled", false);
        consumer.processSupportTicket(message("saved"));
        verify(intake).accept(any());
        verifyNoInteractions(mail);
    }

    @Test void newTicketAndReaderNotificationAreWrittenByTheIntakeTransaction() {
        Customer reader = new Customer();
        reader.setCustomer_id("reader");
        when(customers.findByEmail("test@example.invalid")).thenReturn(Optional.of(reader));
        SupportTicketIntakeService store = new SupportTicketIntakeService(tickets, customers, notifications);
        SupportTicket saved = store.accept(message("new")).orElseThrow();
        assertEquals("Nhờ hỗ trợ", saved.getMessage());
        verify(tickets).saveAndFlush(saved);
        verify(notifications).save(any(Notification.class));
    }
}
