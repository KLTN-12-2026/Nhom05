package com.example.demochatbot.repository;

import com.example.demochatbot.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByCustomerIdOrderByCreatedAtDesc(String customerId);

    long countByCustomerIdAndIsReadFalse(String customerId);

    Optional<Notification> findByNotificationIdAndCustomerId(Long notificationId, String customerId);

    List<Notification> findByCustomerIdAndIsReadFalse(String customerId);
}
