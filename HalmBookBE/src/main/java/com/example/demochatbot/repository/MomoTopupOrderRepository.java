package com.example.demochatbot.repository;

import com.example.demochatbot.model.Customer;
import com.example.demochatbot.model.MomoTopupOrder;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MomoTopupOrderRepository extends JpaRepository<MomoTopupOrder, Long> {

    Optional<MomoTopupOrder> findByOrderIdAndCustomer(String orderId, Customer customer);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT payment FROM MomoTopupOrder payment WHERE payment.orderId = :orderId")
    Optional<MomoTopupOrder> findByOrderIdForUpdate(@Param("orderId") String orderId);
}
