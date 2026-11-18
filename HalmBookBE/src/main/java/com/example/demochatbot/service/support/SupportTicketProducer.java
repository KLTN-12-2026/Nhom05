package com.example.demochatbot.service.support;

import com.example.demochatbot.config.RabbitMQConfig;
import com.example.demochatbot.dto.SupportTicketMessage;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.rabbit.connection.CorrelationData;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

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
        CorrelationData correlation = new CorrelationData("support-" + message.getCode());
        rabbitTemplate.convertAndSend(
                RabbitMQConfig.EXCHANGE_NAME,
                RabbitMQConfig.ROUTING_KEY,
                message,
                correlation
        );
        try {
            CorrelationData.Confirm confirm = correlation.getFuture().get(5, TimeUnit.SECONDS);
            if (!confirm.isAck()) {
                throw new org.springframework.amqp.AmqpException(
                        "RabbitMQ từ chối publish ticket " + message.getCode()
                                + (confirm.getReason() == null ? "" : ": " + confirm.getReason()));
            }
        } catch (TimeoutException timeout) {
            throw new org.springframework.amqp.AmqpException(
                    "RabbitMQ không xác nhận publish ticket " + message.getCode() + " trong 5 giây", timeout);
        } catch (InterruptedException interrupted) {
            Thread.currentThread().interrupt();
            throw new org.springframework.amqp.AmqpException(
                    "Luồng bị gián đoạn khi chờ xác nhận RabbitMQ cho ticket " + message.getCode(), interrupted);
        } catch (java.util.concurrent.ExecutionException failure) {
            Throwable cause = failure.getCause() != null ? failure.getCause() : failure;
            throw new org.springframework.amqp.AmqpException(
                    "Lỗi xác nhận publish RabbitMQ cho ticket " + message.getCode(), cause);
        }
        System.out.println(">>> [RabbitMQ Producer] Đã gửi thành công mã: " + message.getCode());
    }
}
