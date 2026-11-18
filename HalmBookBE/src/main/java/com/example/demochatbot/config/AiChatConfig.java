package com.example.demochatbot.config;

import org.springframework.ai.chat.client.ChatClientBuilderCustomizer;
import org.springframework.ai.model.openai.autoconfigure.OpenAiChatProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AiChatConfig {
    @Bean
    ChatClientBuilderCustomizer boundedAiRequests(OpenAiChatProperties properties) {
        // Spring AI 2.0.1 toOptions() does not copy connection retry/timeout into request options.
        // Apply both explicitly, preserving the configured Gemini model and other chat options.
        var options = properties.toOptions().mutate()
                .timeout(properties.getTimeout())
                .maxRetries(properties.getMaxRetries())
                .build();
        return builder -> builder.defaultOptions(options.mutate());
    }
}
