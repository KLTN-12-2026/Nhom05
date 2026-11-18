package com.example.demochatbot.chat;

import com.openai.errors.InternalServerException;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.Test;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.ai.openai.OpenAiChatOptions;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.concurrent.atomic.AtomicInteger;
import static org.junit.jupiter.api.Assertions.*;

/** Actual SDK calls to a local synthetic provider only; never sends content to Google. */
class AiSdkRetryTests {
    @Test void sdkRetriesOneOverloadThenReturnsTheRealSuccessfulAnswer() throws Exception {
        AtomicInteger requests = new AtomicInteger();
        HttpServer server = provider(requests, true);
        try {
            var options = OpenAiChatOptions.builder().apiKey("synthetic-test-key")
                    .baseUrl("http://127.0.0.1:" + server.getAddress().getPort() + "/v1").model("synthetic-model")
                    .maxRetries(1).timeout(Duration.ofSeconds(2)).build();
            var model = OpenAiChatModel.builder().options(options).build();
            assertEquals("synthetic reply", model.call(new Prompt("fixture", options)).getResult().getOutput().getText());
            assertEquals(2, requests.get());
        } finally { server.stop(0); }
    }

    @Test void sdkStopsAfterTheConfiguredRetryWhenProviderRemainsOverloaded() throws Exception {
        AtomicInteger requests = new AtomicInteger();
        HttpServer server = provider(requests, false);
        try {
            var options = OpenAiChatOptions.builder().apiKey("synthetic-test-key")
                    .baseUrl("http://127.0.0.1:" + server.getAddress().getPort() + "/v1").model("synthetic-model")
                    .maxRetries(1).timeout(Duration.ofSeconds(2)).build();
            var model = OpenAiChatModel.builder().options(options).build();
            InternalServerException failure = assertThrows(InternalServerException.class,
                    () -> model.call(new Prompt("fixture", options)));
            assertEquals(503, failure.statusCode());
            assertEquals(2, requests.get());
        } finally { server.stop(0); }
    }

    private HttpServer provider(AtomicInteger requests, boolean recover) throws Exception {
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/", exchange -> {
            exchange.getRequestBody().readAllBytes();
            boolean success = requests.incrementAndGet() > 1 && recover;
            String response = success
                    ? "{\"id\":\"fixture\",\"object\":\"chat.completion\",\"created\":1,\"model\":\"synthetic-model\",\"choices\":[{\"index\":0,\"message\":{\"role\":\"assistant\",\"content\":\"synthetic reply\"},\"finish_reason\":\"stop\"}]}"
                    : "{\"error\":{\"code\":503,\"message\":\"Temporary synthetic overload\",\"status\":\"UNAVAILABLE\"}}";
            byte[] bytes = response.getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().set("Content-Type", "application/json");
            exchange.sendResponseHeaders(success ? 200 : 503, bytes.length);
            try (var output = exchange.getResponseBody()) { output.write(bytes); }
        });
        server.start();
        return server;
    }
}
