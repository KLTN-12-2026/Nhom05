package com.example.demochatbot.service.notification;

import com.example.demochatbot.dto.BroadcastRequest;
import com.example.demochatbot.enums.Role;
import com.example.demochatbot.model.*;
import com.example.demochatbot.repository.*;
import com.example.demochatbot.service.order.CheckoutCoordinator;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class NotificationBroadcastService {
    private final NotificationBroadcastRepository broadcasts;
    private final NotificationRepository notifications;
    private final CustomerRepository customers;
    private final CheckoutCoordinator transactions;
    private final ObjectMapper mapper;
    private static final Map<String, String> DESTINATIONS = Map.of(
            "inbox", "", "home", "/", "offers", "/uudai", "bookshelf", "/tusachcn",
            "profile", "/canhan", "wallet", "/canhan?tab=wallet", "categories", "/danhmuc");

    public Map<String, Object> broadcast(BroadcastRequest request, String admin) {
        if (request == null || request.getRequestId() == null || !request.getRequestId().matches("[a-fA-F0-9-]{36}")) {
            throw new IllegalArgumentException("Mã đợt thông báo không hợp lệ.");
        }
        // A transaction holds the key until the entire fan-out commits, including its receipt.
        try {
            return transactions.execute("broadcast:" + request.getRequestId(), () -> deliver(request, admin));
        } catch (DataIntegrityViolationException conflict) {
            // A different server may have committed the same request ID. Read it in a fresh transaction.
            return transactions.execute("broadcast:" + request.getRequestId(), () -> {
                if (!broadcasts.existsById(request.getRequestId())) throw conflict;
                return deliver(request, admin);
            });
        }
    }

    private Map<String, Object> deliver(BroadcastRequest request, String admin) {
        String title = Objects.toString(request.getTitle(), "").trim();
        String message = Objects.toString(request.getMessage(), "").trim();
        String target = request.getTarget();
        String link = DESTINATIONS.get(Objects.toString(request.getDestination(), ""));
        if (admin == null || admin.isBlank() || request.getRequestId() == null || title.isBlank() || title.length() > 150
                || message.isBlank() || message.length() > 4000 || !Set.of("all", "vip", "standard").contains(Objects.toString(target, "")) || link == null) {
            throw new IllegalArgumentException("Thông tin đợt thông báo không hợp lệ.");
        }
        String fingerprint = fingerprint(title, message, target, link);
        NotificationBroadcast receipt = broadcasts.findById(request.getRequestId()).orElse(null);
        if (receipt != null) {
            if (!admin.equals(receipt.getAdminUsername()) || !fingerprint.equals(receipt.getFingerprint())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Mã đợt gửi đã được dùng cho nội dung hoặc tài khoản khác.");
            }
            return result(receipt, true);
        }
        receipt = new NotificationBroadcast();
        receipt.setRequestId(request.getRequestId()); receipt.setAdminUsername(admin); receipt.setFingerprint(fingerprint);
        receipt.setTitle(title); receipt.setMessage(message); receipt.setTarget(target); receipt.setLink(link);
        receipt.setCreatedAt(LocalDateTime.now());
        // Reserve the unique ID before creating notifications. Any failure rolls back everything.
        broadcasts.saveAndFlush(receipt);
        List<Notification> batch = new ArrayList<>();
        Set<String> recipients = new HashSet<>();
        for (Customer customer : customers.findAll()) {
            if (customer.getAccount() == null || customer.getAccount().getRole() != Role.USER
                    || customer.getCustomer_id() == null || !recipients.add(customer.getCustomer_id())) continue;
            MembershipTier tier = customer.getMembershipTier();
            boolean vip = tier != null && tier.getDiscountPercent() != null && tier.getDiscountPercent() > 0;
            if (("vip".equals(target) && !vip) || ("standard".equals(target) && vip)) continue;
            batch.add(Notification.builder().customerId(customer.getCustomer_id()).broadcastId(receipt.getRequestId())
                    .title(title).message(message).type("SYSTEM").link(link).isRead(false).createdAt(receipt.getCreatedAt()).build());
        }
        notifications.saveAll(batch);
        receipt.setSentCount(batch.size());
        broadcasts.save(receipt);
        return result(receipt, false);
    }

    private Map<String, Object> result(NotificationBroadcast receipt, boolean replayed) {
        return Map.of("success", true, "broadcastId", receipt.getRequestId(), "sentCount", receipt.getSentCount(),
                "replayed", replayed, "message", "Đã ghi thông báo vào hộp thư của " + receipt.getSentCount() + " độc giả.");
    }

    private String fingerprint(String... parts) {
        try {
            byte[] bytes = mapper.writeValueAsString(parts).getBytes(StandardCharsets.UTF_8);
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes));
        } catch (Exception exception) { throw new IllegalStateException("Không thể xác thực nội dung đợt gửi.", exception); }
    }
}
