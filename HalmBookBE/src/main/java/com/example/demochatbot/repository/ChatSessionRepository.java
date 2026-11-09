package com.example.demochatbot.repository;

import com.example.demochatbot.model.Chat_Session;
import com.example.demochatbot.model.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ChatSessionRepository extends JpaRepository<Chat_Session, Integer> {

    @Query("SELECT s FROM Chat_Session s WHERE s.customer = :customer ORDER BY s.chat_session_id DESC LIMIT 1")
    Optional<Chat_Session> findLatestSessionByCustomer(@Param("customer") Customer customer);
}
