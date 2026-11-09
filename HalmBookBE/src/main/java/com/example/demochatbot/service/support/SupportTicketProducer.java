package com.example.demochatbot.service.support;

import com.example.demochatbot.config.RabbitMQConfig;
import com.example.demochatbot.dto.SupportTicketMessage;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 * ============================================================================
 * PRODUCER: SupportTicketProducer
 * Đẩy tin nhắn khiếu nại & hỗ trợ vào RabbitMQ Exchange
 * ============================================================================
 */
@Service
public class SupportTicketProducer {

    @Autowired
    private RabbitTemplate rabbitTemplate;

    public void sendTicketMessage(SupportTicketMessage message) {
        System.out.println(">>> [RabbitMQ Producer] Đang gửi tin nhắn khiếu nại vào hàng đợi: " + message.getCode());
        rabbitTemplate.convertAndSend(
                RabbitMQConfig.EXCHANGE_NAME,
                RabbitMQConfig.ROUTING_KEY,
                message
        );
        System.out.println(">>> [RabbitMQ Producer] Đã gửi thành công mã: " + message.getCode());
    }
}
