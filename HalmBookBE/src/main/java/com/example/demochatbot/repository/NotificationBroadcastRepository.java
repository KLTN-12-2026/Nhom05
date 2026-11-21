package com.example.demochatbot.repository;

import com.example.demochatbot.model.NotificationBroadcast;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationBroadcastRepository extends JpaRepository<NotificationBroadcast, String> {}
