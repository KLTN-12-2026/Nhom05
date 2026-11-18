package com.example.demochatbot.service.support;

import com.example.demochatbot.model.SupportTicket;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

/** The JSON transcript is authoritative; message/adminReply are legacy summaries. */
public final class SupportChatHistory {
    private static final ObjectMapper JSON = new ObjectMapper();
    private static final DateTimeFormatter TIME = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private SupportChatHistory() {}

    public static List<Map<String, String>> read(SupportTicket ticket, String avatar) {
        List<Map<String, String>> history;
        if (ticket.getChatHistory() != null && !ticket.getChatHistory().isBlank()) {
            try {
                history = JSON.readValue(ticket.getChatHistory(), new TypeReference<List<Map<String, String>>>() {});
                if (history == null) throw new IllegalStateException("Empty chat history JSON");
            } catch (Exception e) {
                // Never overwrite a damaged transcript with just the two legacy summary fields.
                throw new IllegalStateException("Không thể đọc lịch sử trò chuyện của ticket", e);
            }
        } else {
            history = new ArrayList<>();
            if (ticket.getMessage() != null && !ticket.getMessage().isBlank()) {
                history.add(message("USER", ticket.getSenderName(), ticket.getMessage(), ticket.getCreatedAt(), null));
            }
            if (ticket.getAdminReply() != null && !ticket.getAdminReply().isBlank()) {
                history.add(message("ADMIN", "Ban Quản Trị HALMBOOK", ticket.getAdminReply(), ticket.getReplyAt(), null));
            }
        }
        for (Map<String, String> entry : history) {
            if ("USER".equalsIgnoreCase(entry.get("sender")) && avatar != null && !avatar.isBlank()
                    && (entry.get("avatar") == null || entry.get("avatar").isBlank())) entry.put("avatar", avatar);
        }
        return history;
    }

    public static boolean containsRequest(List<Map<String, String>> history, String sender, String requestId) {
        return requestId != null && !requestId.isBlank() && history.stream().anyMatch(m ->
                sender.equals(m.get("sender")) && requestId.equals(m.get("id")));
    }

    public static Map<String, String> message(String sender, String name, String content, LocalDateTime time, String id) {
        Map<String, String> entry = new HashMap<>();
        entry.put("id", id == null || id.isBlank() ? UUID.randomUUID().toString() : id);
        entry.put("sender", sender);
        entry.put("senderName", name == null ? "Độc giả" : name);
        entry.put("content", content.trim());
        entry.put("time", time == null ? "" : time.format(TIME));
        return entry;
    }

    public static String write(List<Map<String, String>> history) {
        try { return JSON.writeValueAsString(history); }
        catch (Exception e) { throw new IllegalStateException("Không thể lưu lịch sử trò chuyện", e); }
    }
}
