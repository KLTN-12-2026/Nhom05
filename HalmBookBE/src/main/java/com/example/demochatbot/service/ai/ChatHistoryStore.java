package com.example.demochatbot.service.ai;

import com.example.demochatbot.model.*;
import com.example.demochatbot.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class ChatHistoryStore {
    private final ChatSessionRepository sessions;
    private final ChatMessageRepository messages;

    public ChatHistoryStore(ChatSessionRepository sessions, ChatMessageRepository messages) {
        this.sessions = sessions;
        this.messages = messages;
    }

    @Transactional(readOnly = true)
    public List<Chat_Message> read(Customer customer) {
        return messages.findByCustomerIdOrderBySentAtAsc(customer.getCustomer_id());
    }

    /** Commit the complete turn together; a failed write must reach the caller. */
    @Transactional
    public void saveTurn(Customer customer, String question, String reply) {
        Chat_Session session = sessions.findLatestSessionByCustomer(customer).orElseGet(() -> {
            Chat_Session created = new Chat_Session();
            created.setCustomer(customer);
            created.setStart_at(LocalDateTime.now());
            return created;
        });
        session.setLast_interaction(LocalDateTime.now());
        session = sessions.save(session);
        messages.save(message(session, "USER", question));
        messages.save(message(session, "BOT", reply));
    }

    @Transactional
    public void clear(Customer customer) {
        messages.deleteByCustomerId(customer.getCustomer_id());
        sessions.deleteByCustomerId(customer.getCustomer_id());
    }

    private Chat_Message message(Chat_Session session, String sender, String content) {
        Chat_Message message = new Chat_Message();
        message.setChat_session(session);
        message.setSender(sender);
        message.setContent(content.trim());
        message.setSent_at(LocalDateTime.now());
        return message;
    }
}
