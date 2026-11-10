package com.example.demochatbot.repository;

import com.example.demochatbot.model.Chat_Message;
import com.example.demochatbot.model.Chat_Session;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<Chat_Message, Integer> {

    @Query("SELECT m FROM Chat_Message m WHERE m.chat_session = :session ORDER BY m.sent_at ASC")
    List<Chat_Message> findBySessionOrderBySentAtAsc(@Param("session") Chat_Session session);

    @Query("SELECT m FROM Chat_Message m WHERE m.chat_session.customer.customer_id = :customerId ORDER BY m.sent_at ASC")
    List<Chat_Message> findByCustomerIdOrderBySentAtAsc(@Param("customerId") String customerId);
}
