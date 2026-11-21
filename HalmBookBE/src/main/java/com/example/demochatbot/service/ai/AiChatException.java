package com.example.demochatbot.service.ai;

import com.openai.errors.OpenAIServiceException;
import org.springframework.http.HttpStatus;
import org.springframework.web.client.RestClientResponseException;

import java.net.SocketTimeoutException;
import java.net.http.HttpTimeoutException;
import java.util.Collections;
import java.util.IdentityHashMap;
import java.util.Set;

/** Safe API failure, separate from a generated assistant message or a user's login failure. */
public final class AiChatException extends RuntimeException {
    private final HttpStatus status;
    private final String errorCode;
    private final int upstreamStatus;
    private final int retryAfterSeconds;

    private AiChatException(HttpStatus status, String code, String message, int upstreamStatus, int retryAfterSeconds, Throwable cause) {
        super(message, cause);
        this.status = status;
        this.errorCode = code;
        this.upstreamStatus = upstreamStatus;
        this.retryAfterSeconds = retryAfterSeconds;
    }

    public HttpStatus status() { return status; }
    public String errorCode() { return errorCode; }
    public int upstreamStatus() { return upstreamStatus; }
    public int retryAfterSeconds() { return retryAfterSeconds; }

    public static AiChatException from(Exception error) {
        if (error instanceof AiChatException known) return known;
        Set<Throwable> seen = Collections.newSetFromMap(new IdentityHashMap<>());
        int code = 0;
        boolean timeout = false;
        for (Throwable current = error; current != null && seen.add(current); current = current.getCause()) {
            if (current instanceof OpenAIServiceException service) code = service.statusCode();
            else if (current instanceof RestClientResponseException http) code = http.getStatusCode().value();
            if (current instanceof SocketTimeoutException || current instanceof HttpTimeoutException) timeout = true;
        }
        if (code == 429) return new AiChatException(HttpStatus.TOO_MANY_REQUESTS, "AI_RATE_LIMITED",
                "Dịch vụ AI đang giới hạn yêu cầu. Bạn đọc đợi một chút rồi thử lại nhé! 🥔", code, 30, error);
        if (code >= 500) return new AiChatException(HttpStatus.SERVICE_UNAVAILABLE, "AI_UNAVAILABLE",
                "Gemini đang quá tải hoặc tạm thời không sẵn sàng. Bạn đọc đợi khoảng 20–30 giây rồi gửi lại nhé! 🥔", code, 20, error);
        if (code == 401 || code == 403 || code == 404) return new AiChatException(HttpStatus.SERVICE_UNAVAILABLE, "AI_CONFIGURATION_ERROR",
                "Dịch vụ AI chưa sẵn sàng do cấu hình phía máy chủ. Bạn đọc vui lòng thử lại sau hoặc báo quản trị viên.", code, 0, error);
        if (timeout) return new AiChatException(HttpStatus.GATEWAY_TIMEOUT, "AI_TIMEOUT",
                "AI phản hồi quá lâu. Bạn đọc vui lòng thử gửi lại sau nhé! 🥔", code, 10, error);
        return new AiChatException(HttpStatus.BAD_GATEWAY, "AI_REQUEST_FAILED",
                "Chưa nhận được câu trả lời từ AI. Bạn đọc vui lòng thử lại sau nhé! 🥔", code, 0, error);
    }
}
