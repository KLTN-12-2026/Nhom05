package com.example.demochatbot.live;

import com.example.demochatbot.controller.*;
import com.example.demochatbot.dto.SupportTicketMessage;
import com.example.demochatbot.enums.Role;
import com.example.demochatbot.model.*;
import com.example.demochatbot.repository.*;
import com.example.demochatbot.service.ai.ChatHistoryStore;
import com.example.demochatbot.service.support.*;
import org.junit.jupiter.api.Test;
import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.config.SimpleRabbitListenerContainerFactory;
import org.springframework.amqp.rabbit.config.SimpleRabbitListenerEndpoint;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.rabbit.listener.SimpleMessageListenerContainer;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.net.http.*;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicReference;
import java.util.concurrent.atomic.AtomicInteger;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = {
        "spring.jpa.hibernate.ddl-auto=validate", "spring.rabbitmq.listener.simple.auto-startup=false",
        "halm.support.confirmation-email.enabled=false"
})
class LiveDemoTests {
    @LocalServerPort int port;
    @Autowired ChatHistoryStore history;
    @Autowired CustomerRepository customers;
    @Autowired AccountRepository accounts;
    @Autowired SupportTicketRepository tickets;
    @Autowired UserSupportController userChat;
    @Autowired SupportTicketAdminController adminChat;
    @Autowired SupportTicketConsumer consumer;
    @Autowired RabbitTemplate rabbit;
    @Autowired AmqpAdmin queues;
    @Autowired ConnectionFactory connections;
    @Autowired MessageConverter converter;
    @Autowired SimpleRabbitListenerContainerFactory rabbitListenerContainerFactory;

    @Test void applicationStartsWithRealDatabaseAndServesChatEndpoints() throws Exception {
        HttpClient client = HttpClient.newHttpClient();
        String base = "http://127.0.0.1:" + port;
        var response = client.send(HttpRequest.newBuilder(URI.create(base + "/api/chat/history")).GET().build(), HttpResponse.BodyHandlers.ofString());
        assertEquals(200, response.statusCode());
        assertEquals("[]", response.body());
        var empty = client.send(HttpRequest.newBuilder(URI.create(base + "/api/chat"))
                .header("Content-Type", "application/json").POST(HttpRequest.BodyPublishers.ofString("{\"message\":\" \"}"))
                .build(), HttpResponse.BodyHandlers.ofString());
        assertEquals(400, empty.statusCode());
    }

    @Test @Transactional void aiHistoryPersistsVietnameseAndClearsInRealMysql() {
        Account account = new Account();
        account.setUsername("test-" + UUID.randomUUID());
        account.setPassword("unused-test-password");
        account.setRole(Role.USER);
        accounts.saveAndFlush(account);
        Customer reader = new Customer();
        reader.setCustomer_id("TEST-" + UUID.randomUUID().toString().substring(0, 8));
        reader.setCustomerName("Kiểm thử tự động");
        reader.setEmail(UUID.randomUUID() + "@example.invalid");
        reader.setAccount(account);
        customers.saveAndFlush(reader);
        history.saveTurn(reader, "Tôi muốn đọc sách tiếng Việt 🥔", "Khoai Nhỏ chào bạn 🌱");
        history.saveTurn(reader, "Tôi muốn đọc sách tiếng Việt 🥔", "Khoai Nhỏ chào bạn 🌱");
        var stored = history.read(reader);
        assertEquals(4, stored.size());
        assertEquals("Tôi muốn đọc sách tiếng Việt 🥔", stored.getFirst().getContent());
        history.clear(reader);
        assertTrue(history.read(reader).isEmpty());
        // The test transaction rolls back the fixture and all chat writes.
    }

    @Test @Transactional void userAndAdminAppendAndRetryAgainstRealMysql() {
        SecurityContextHolder.clearContext();
        SupportTicket ticket = tickets.saveAndFlush(SupportTicket.builder().code("TEST-" + UUID.randomUUID())
                .senderName("Kiểm thử").senderEmail("test@example.invalid").subject("Live test")
                .message("Tin ban đầu").build());
        Map<String, String> one = Map.of("message", "Nhờ hỗ trợ", "requestId", "one", "code", ticket.getCode());
        Map<String, String> two = Map.of("message", "Nhờ hỗ trợ", "requestId", "two", "code", ticket.getCode());
        assertEquals(200, userChat.addUserMessage(ticket.getTicketId(), one).getStatusCode().value());
        assertEquals(200, userChat.addUserMessage(ticket.getTicketId(), two).getStatusCode().value());
        assertEquals(200, userChat.addUserMessage(ticket.getTicketId(), two).getStatusCode().value());
        assertEquals(200, adminChat.replyTicket(ticket.getTicketId(), Map.of("reply", "Đã nhận 🥔", "requestId", "reply")).getStatusCode().value());
        tickets.flush();
        assertEquals(4, SupportChatHistory.read(tickets.findById(ticket.getTicketId()).orElseThrow(), "").size());
    }

    @Test void duplicateRabbitDeliveryCreatesExactlyOneTicket() throws Exception {
        String code = "TEST-" + UUID.randomUUID();
        org.springframework.amqp.core.Queue queue = new AnonymousQueue();
        queues.declareQueue(queue);
        CountDownLatch handled = new CountDownLatch(2);
        AtomicReference<Throwable> error = new AtomicReference<>();
        SimpleMessageListenerContainer listener = new SimpleMessageListenerContainer(connections);
        listener.setQueueNames(queue.getName());
        listener.setDefaultRequeueRejected(false);
        listener.setMessageListener((MessageListener) raw -> {
            try { consumer.processSupportTicket((SupportTicketMessage) converter.fromMessage(raw)); }
            catch (Throwable failure) { error.compareAndSet(null, failure); }
            finally { handled.countDown(); }
        });
        try {
            listener.start();
            SupportTicketMessage payload = SupportTicketMessage.builder().code(code).senderEmail("")
                    .senderName("Kiểm thử RabbitMQ").subject("Hàng đợi thử nghiệm riêng")
                    .message("Tiếng Việt 🥔").build();
            rabbit.convertAndSend("", queue.getName(), payload);
            rabbit.convertAndSend("", queue.getName(), payload);
            assertTrue(handled.await(20, TimeUnit.SECONDS), "Both deliveries must finish");
            assertNull(error.get(), () -> "Consumer failure: " + error.get());
            SupportTicket stored = tickets.findByCode(code).orElseThrow();
            assertEquals("Tiếng Việt 🥔", stored.getMessage());
            // Unique ticket_code plus two successful deliveries proves redelivery was acknowledged.
        } finally {
            listener.stop();
            queues.deleteQueue(queue.getName());
            tickets.findByCode(code).ifPresent(tickets::delete);
        }
    }

    @Test void failingDeliveryRetriesTwiceThenGoesToAnIsolatedDeadLetterQueue() {
        String suffix = UUID.randomUUID().toString();
        String queueName = "halm.test.retry." + suffix, deadLetterName = "halm.test.dead." + suffix;
        queues.declareQueue(new org.springframework.amqp.core.Queue(deadLetterName, false));
        queues.declareQueue(new org.springframework.amqp.core.Queue(queueName, false, false, false,
                Map.of("x-dead-letter-exchange", "", "x-dead-letter-routing-key", deadLetterName)));
        AtomicInteger attempts = new AtomicInteger();
        SimpleRabbitListenerEndpoint endpoint = new SimpleRabbitListenerEndpoint();
        endpoint.setId("test-retry-" + suffix);
        endpoint.setQueueNames(queueName);
        endpoint.setMessageListener(raw -> {
            attempts.incrementAndGet();
            throw new IllegalStateException("Intentional isolated retry test");
        });
        SimpleMessageListenerContainer listener = rabbitListenerContainerFactory.createListenerContainer(endpoint);
        try {
            listener.start();
            rabbit.convertAndSend("", queueName, "retry-test");
            Message rejected = rabbit.receive(deadLetterName, 10000);
            assertNotNull(rejected, "Exhausted delivery must reach the DLQ instead of looping forever");
            assertEquals(3, attempts.get(), "One initial attempt plus two retries");
        } finally {
            listener.stop();
            queues.deleteQueue(queueName);
            queues.deleteQueue(deadLetterName);
        }
    }
}
