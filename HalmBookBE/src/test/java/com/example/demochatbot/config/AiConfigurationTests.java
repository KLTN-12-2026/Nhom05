package com.example.demochatbot.config;

import org.junit.jupiter.api.Test;
import org.springframework.ai.model.openai.autoconfigure.OpenAiChatProperties;
import org.springframework.boot.context.properties.bind.Binder;
import org.springframework.boot.env.YamlPropertySourceLoader;
import org.springframework.core.io.ClassPathResource;
import org.springframework.mock.env.MockEnvironment;
import java.time.Duration;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.model.Generation;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.openai.OpenAiChatOptions;
import org.mockito.ArgumentCaptor;
import java.util.List;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.assertEquals;

class AiConfigurationTests {
    private OpenAiChatOptions actualRequestOptions(MockEnvironment environment) {
        var properties = Binder.get(environment).bind("spring.ai.openai.chat", OpenAiChatProperties.class).get();
        ChatModel model = mock(ChatModel.class);
        when(model.call(any(Prompt.class))).thenReturn(new ChatResponse(List.of(new Generation(new AssistantMessage("fixture")))));
        var builder = ChatClient.builder(model);
        new AiChatConfig().boundedAiRequests(properties).customize(builder);
        builder.build().prompt().user("fixture").call().content();
        ArgumentCaptor<Prompt> request = ArgumentCaptor.forClass(Prompt.class);
        verify(model).call(request.capture());
        return (OpenAiChatOptions) request.getValue().getOptions();
    }

    private MockEnvironment environment() throws Exception {
        MockEnvironment environment = new MockEnvironment();
        environment.getPropertySources().addLast(new YamlPropertySourceLoader()
                .load("application", new ClassPathResource("application.yml")).getFirst());
        return environment;
    }

    @Test void sdkRequestOptionsHaveBoundedRetryAndTimeout() throws Exception {
        var options = actualRequestOptions(environment());
        assertEquals(1, options.getMaxRetries());
        assertEquals(Duration.ofSeconds(20), options.getTimeout());
    }

    @Test void retryAndTimeoutCanBeConfiguredWithoutChangingTheSelectedModel() throws Exception {
        var environment = environment().withProperty("AI_MAX_RETRIES", "0").withProperty("AI_REQUEST_TIMEOUT", "15s");
        var options = actualRequestOptions(environment);
        assertEquals(0, options.getMaxRetries());
        assertEquals(Duration.ofSeconds(15), options.getTimeout());
        assertEquals("gemini-3.6-flash", options.getModel());
    }
}
