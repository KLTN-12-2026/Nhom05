package com.example.demochatbot.repository;

import com.example.demochatbot.model.SupportTicket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SupportTicketRepository extends JpaRepository<SupportTicket, Long> {

    List<SupportTicket> findAllByOrderByCreatedAtDesc();

    Optional<SupportTicket> findByCode(String code);

    boolean existsByCode(String code);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT t FROM SupportTicket t WHERE t.ticketId = :id")
    Optional<SupportTicket> findByIdForUpdate(@Param("id") Long id);

    @Query("SELECT t FROM SupportTicket t WHERE t.customer.customer_id = :customerId ORDER BY t.createdAt DESC")
    List<SupportTicket> findByCustomerId(@Param("customerId") String customerId);

    long countByStatus(String status);
}
