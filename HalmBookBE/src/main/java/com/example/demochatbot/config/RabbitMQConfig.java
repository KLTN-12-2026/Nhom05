package com.example.demochatbot.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * ============================================================================
 * CONFIGURATION: RabbitMQConfig
 * Cấu hình Topic Exchange, Queue, Dead Letter Queue (DLQ) cho phân hệ Hỗ Trợ & Khiếu Nại
 * ============================================================================
 */
@Configuration
public class RabbitMQConfig {

    public static final String EXCHANGE_NAME = "halm.support.exchange";
    public static final String QUEUE_NAME = "halm.support.queue";
    public static final String ROUTING_KEY = "ticket.created";

    public static final String DLQ_EXCHANGE = "halm.support.dlx";
    public static final String DLQ_QUEUE_NAME = "halm.support.dlq";
    public static final String DLQ_ROUTING_KEY = "ticket.dead-letter";

    // 1. Dead Letter Exchange & Queue (Xử lý tin nhắn lỗi không mất dữ liệu)
    @Bean
    public DirectExchange deadLetterExchange() {
        return new DirectExchange(DLQ_EXCHANGE);
    }

    @Bean
    public Queue deadLetterQueue() {
        return QueueBuilder.durable(DLQ_QUEUE_NAME).build();
    }

    @Bean
    public Binding deadLetterBinding() {
        return BindingBuilder.bind(deadLetterQueue())
                .to(deadLetterExchange())
                .with(DLQ_ROUTING_KEY);
    }

    // 2. Main Exchange & Main Queue gắn kèm Dead Letter Exchange
    @Bean
    public TopicExchange supportExchange() {
        return new TopicExchange(EXCHANGE_NAME);
    }

    @Bean
    public Queue supportQueue() {
        return QueueBuilder.durable(QUEUE_NAME)
                .withArgument("x-dead-letter-exchange", DLQ_EXCHANGE)
                .withArgument("x-dead-letter-routing-key", DLQ_ROUTING_KEY)
                .build();
    }

    @Bean
    public Binding supportBinding() {
        return BindingBuilder.bind(supportQueue())
                .to(supportExchange())
                .with(ROUTING_KEY);
    }

    // 3. Message Converter: Tự động chuyển đổi Java Object sang JSON và ngược lại
    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(jsonMessageConverter());
        return template;
    }
}
