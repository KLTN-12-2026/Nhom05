package com.example.demochatbot.controller;

import com.example.demochatbot.model.Customer;
import com.example.demochatbot.model.Notification;
import com.example.demochatbot.model.SupportTicket;
import com.example.demochatbot.repository.CustomerRepository;
import com.example.demochatbot.repository.NotificationRepository;
import com.example.demochatbot.repository.SupportTicketRepository;
import org.springframework.beans.factory.annotation.Autowired;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * ============================================================================
 * CONTROLLER: SupportTicketAdminController
 * Quản trị Yêu Cầu Hỗ Trợ, Khiếu Nại & Phát Thông Báo Hệ Thống cho Admin Portal
 * Đường dẫn: /api/admin/support-tickets
 * ============================================================================
 */
@RestController
@RequestMapping("/api/admin/support-tickets")
@CrossOrigin(origins = "*", maxAge = 3600)
public class SupportTicketAdminController {

    @Autowired
    private SupportTicketRepository supportTicketRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    
    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    private String resolveCustomerAvatar(SupportTicket t) {
        Customer c = t.getCustomer();
        if (c == null && t.getSenderEmail() != null && !t.getSenderEmail().trim().isEmpty()) {
            c = customerRepository.findByEmail(t.getSenderEmail().trim()).orElse(null);
        }
        if (c == null && t.getSenderName() != null && !t.getSenderName().trim().isEmpty()) {
            String nameLower = t.getSenderName().trim().toLowerCase();
            c = customerRepository.findAll().stream()
                    .filter(cust -> cust.getCustomerName() != null && cust.getCustomerName().trim().toLowerCase().equals(nameLower))
                    .findFirst().orElse(null);
        }
        if (c != null) {
            String av1 = c.getAvatar() != null ? c.getAvatar().trim() : "";
            String av2 = c.getAvatarUrl() != null ? c.getAvatarUrl().trim() : "";
            if (!av1.isEmpty() && !av1.contains("dicebear.com")) return av1;
            if (!av2.isEmpty() && !av2.contains("dicebear.com")) return av2;
            if (!av1.isEmpty()) return av1;
            if (!av2.isEmpty()) return av2;
        }
        return "";
    }

    private List<Map<String, String>> parseChatHistory(SupportTicket ticket) {
        return parseChatHistory(ticket, resolveCustomerAvatar(ticket));
    }

    private List<Map<String, String>> parseChatHistory(SupportTicket ticket, String userAvatar) {
        List<Map<String, String>> list = new ArrayList<>();
        if (ticket.getChatHistory() != null && !ticket.getChatHistory().trim().isEmpty()) {
            try {
                list = objectMapper.readValue(ticket.getChatHistory(), new TypeReference<List<Map<String, String>>>() {});
                if (userAvatar != null && !userAvatar.isEmpty()) {
                    for (Map<String, String> m : list) {
                        if ("USER".equalsIgnoreCase(m.get("sender")) && (m.get("avatar") == null || m.get("avatar").isEmpty())) {
                            m.put("avatar", userAvatar);
                        }
                    }
                }
                return list;
            } catch (Exception ignored) {}
        }
        if (ticket.getMessage() != null && !ticket.getMessage().trim().isEmpty()) {
            Map<String, String> m1 = new HashMap<>();
            m1.put("sender", "USER");
            m1.put("senderName", ticket.getSenderName() != null ? ticket.getSenderName() : "Độc giả");
            m1.put("content", ticket.getMessage());
            m1.put("avatar", userAvatar != null ? userAvatar : "");
            m1.put("time", ticket.getCreatedAt() != null ? ticket.getCreatedAt().format(DATE_TIME_FORMATTER) : LocalDateTime.now().format(DATE_TIME_FORMATTER));
            list.add(m1);
        }
        if (ticket.getAdminReply() != null && !ticket.getAdminReply().trim().isEmpty()) {
            Map<String, String> m2 = new HashMap<>();
            m2.put("sender", "ADMIN");
            m2.put("senderName", "Ban Quản Trị HALMBOOK");
            m2.put("content", ticket.getAdminReply());
            m2.put("avatar", "");
            m2.put("time", ticket.getReplyAt() != null ? ticket.getReplyAt().format(DATE_TIME_FORMATTER) : LocalDateTime.now().format(DATE_TIME_FORMATTER));
            list.add(m2);
        }
        return list;
    }

    /**
     * 1. Lấy danh sách ticket hỗ trợ & thống kê tổng quan
     */
    @GetMapping
    public ResponseEntity<?> getAllTickets(
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "category", required = false) String category
    ) {
        try {
            List<SupportTicket> all = supportTicketRepository.findAllByOrderByCreatedAtDesc();

            long total = all.size();
            long pending = 0;
            long resolved = 0;
            long inProgress = 0;

            List<Map<String, Object>> list = new ArrayList<>();

            for (SupportTicket t : all) {
                String st = t.getStatus() != null ? t.getStatus().toLowerCase() : "pending";
                if ("pending".equals(st)) pending++;
                else if ("resolved".equals(st)) resolved++;
                else if ("in_progress".equals(st)) inProgress++;

                // Lọc trạng thái
                if (status != null && !status.isEmpty() && !st.equalsIgnoreCase(status)) {
                    continue;
                }

                // Lọc phân loại
                if (category != null && !category.isEmpty() && !category.equalsIgnoreCase(t.getCategory())) {
                    continue;
                }

                String code = t.getCode() != null ? t.getCode() : "TK-" + t.getTicketId();
                String senderName = t.getSenderName() != null ? t.getSenderName() : "Khách hàng";
                String senderEmail = t.getSenderEmail() != null ? t.getSenderEmail() : "";
                String subject = t.getSubject() != null ? t.getSubject() : "";
                String message = t.getMessage() != null ? t.getMessage() : "";

                // Lọc tìm kiếm
                if (search != null && !search.trim().isEmpty()) {
                    String q = search.trim().toLowerCase();
                    boolean match = code.toLowerCase().contains(q) ||
                            senderName.toLowerCase().contains(q) ||
                            senderEmail.toLowerCase().contains(q) ||
                            subject.toLowerCase().contains(q) ||
                            message.toLowerCase().contains(q);
                    if (!match) continue;
                }

                String userAvatar = resolveCustomerAvatar(t);

                Map<String, Object> item = new HashMap<>();
                item.put("id", t.getTicketId());
                item.put("code", code);
                item.put("userName", senderName);
                item.put("userEmail", senderEmail);
                item.put("userPhone", t.getSenderPhone() != null ? t.getSenderPhone() : "");
                item.put("userAvatar", userAvatar);
                item.put("category", t.getCategory() != null ? t.getCategory() : "Hỗ trợ chung");
                item.put("priority", t.getPriority() != null ? t.getPriority() : "NORMAL");
                item.put("subject", subject);
                item.put("message", message);
                item.put("status", st);
                item.put("adminReply", t.getAdminReply() != null ? t.getAdminReply() : "");
                item.put("chatHistory", parseChatHistory(t, userAvatar));
                item.put("createdAt", t.getCreatedAt() != null ? t.getCreatedAt().format(DATE_TIME_FORMATTER) : "");
                item.put("replyAt", t.getReplyAt() != null ? t.getReplyAt().format(DATE_TIME_FORMATTER) : "");

                list.add(item);
            }

            Map<String, Object> response = new HashMap<>();
            response.put("totalTickets", total);
            response.put("pendingTickets", pending);
            response.put("resolvedTickets", resolved);
            response.put("inProgressTickets", inProgress);
            response.put("tickets", list);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Lỗi khi lấy danh sách khiếu nại: " + e.getMessage()));
        }
    }

    /**
     * 2. Phản hồi yêu cầu khiếu nại
     */
    @PostMapping("/{id}/reply")
    @Transactional
    public ResponseEntity<?> replyTicket(
            @PathVariable("id") Long id,
            @RequestBody Map<String, String> body
    ) {
        try {
            Optional<SupportTicket> opt = supportTicketRepository.findById(id);
            if (opt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "Không tìm thấy yêu cầu hỗ trợ với mã #" + id));
            }

            String replyText = body != null ? body.get("reply") : null;
            if (replyText == null || replyText.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Nội dung phản hồi không được để trống!"));
            }

            SupportTicket ticket = opt.get();
            String chosenStatus = body.getOrDefault("status", "resolved");
            ticket.setStatus(chosenStatus);
            ticket.setAdminReply(replyText.trim());
            ticket.setReplyAt(LocalDateTime.now());

            List<Map<String, String>> history = parseChatHistory(ticket, resolveCustomerAvatar(ticket));
            Map<String, String> newMsg = new HashMap<>();
            newMsg.put("sender", "ADMIN");
            newMsg.put("senderName", "Ban Quản Trị HALMBOOK");
            newMsg.put("content", replyText.trim());
            newMsg.put("avatar", "");
            newMsg.put("time", LocalDateTime.now().format(DATE_TIME_FORMATTER));
            history.add(newMsg);
            try {
                ticket.setChatHistory(objectMapper.writeValueAsString(history));
            } catch (Exception ignored) {}

            supportTicketRepository.save(ticket);

            // Gửi thông báo đến tài khoản khách hàng nếu có liên kết
            Customer c = ticket.getCustomer();
            if (c == null && ticket.getSenderEmail() != null) {
                // Thử tìm theo email
                Optional<Customer> found = customerRepository.findByEmail(ticket.getSenderEmail());
                if (found.isPresent()) {
                    c = found.get();
                }
            }

            if (c != null) {
                Notification notif = Notification.builder()
                        .customerId(c.getCustomer_id())
                        .title("Yêu Cầu Hỗ Trợ Đã Được Phản Hồi: " + ticket.getCode())
                        .message("Quản trị viên đã phản hồi yêu cầu \"" + ticket.getSubject() + "\":\n" + replyText)
                        .type("SYSTEM")
                        .link("/hotro")
                        .isRead(false)
                        .createdAt(LocalDateTime.now())
                        .build();
                notificationRepository.save(notif);
            }

            Map<String, Object> res = new HashMap<>();
            res.put("success", true);
            res.put("message", "Đã gửi phản hồi thành công!");
            res.put("ticketId", ticket.getTicketId());
            res.put("code", ticket.getCode());
            res.put("status", ticket.getStatus());
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Lỗi khi gửi phản hồi: " + e.getMessage()));
        }
    }

    /**
     * 3. Cập nhật trạng thái ticket
     */
    @PutMapping("/{id}/status")
    @Transactional
    public ResponseEntity<?> updateTicketStatus(
            @PathVariable("id") Long id,
            @RequestBody Map<String, String> body
    ) {
        try {
            Optional<SupportTicket> opt = supportTicketRepository.findById(id);
            if (opt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "Không tìm thấy yêu cầu hỗ trợ #" + id));
            }

            String newStatus = body != null ? body.get("status") : "in_progress";
            SupportTicket ticket = opt.get();
            ticket.setStatus(newStatus.toLowerCase());
            supportTicketRepository.save(ticket);

            return ResponseEntity.ok(Map.of("success", true, "message", "Đã cập nhật trạng thái thành công!"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Lỗi khi cập nhật trạng thái: " + e.getMessage()));
        }
    }

    /**
     * 4. Phát thông báo hệ thống (Broadcast Notification)
     */
    @PostMapping("/broadcast")
    @Transactional
    public ResponseEntity<?> broadcastNotification(@RequestBody Map<String, String> payload) {
        try {
            String title = payload.get("title");
            String message = payload.get("message");
            String target = payload.getOrDefault("target", "all"); // all, vip, standard

            if (title == null || title.trim().isEmpty() || message == null || message.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Tiêu đề và nội dung thông báo không được để trống!"));
            }

            List<Customer> customers = customerRepository.findAll();
            int count = 0;

            for (Customer c : customers) {
                if ("vip".equalsIgnoreCase(target)) {
                    // Chỉ gửi cho khách hàng VIP
                    int potato = c.getPotatoBalance() != null ? c.getPotatoBalance() : 0;
                    if (potato < 500) continue;
                }

                Notification notif = Notification.builder()
                        .customerId(c.getCustomer_id())
                        .title(title.trim())
                        .message(message.trim())
                        .type("SYSTEM")
                        .link("/thong-bao")
                        .isRead(false)
                        .createdAt(LocalDateTime.now())
                        .build();
                notificationRepository.save(notif);
                count++;
            }

            Map<String, Object> res = new HashMap<>();
            res.put("success", true);
            res.put("message", "Đã phát thông báo hệ thống thành công đến " + count + " độc giả!");
            res.put("sentCount", count);
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Lỗi khi phát thông báo: " + e.getMessage()));
        }
    }

    /**
     * 5. Tạo yêu cầu hỗ trợ (dành cho độc giả gửi từ web hoặc admin tạo test)
     */
    @PostMapping("/create")
    @Transactional
    public ResponseEntity<?> createTicket(@RequestBody Map<String, String> body) {
        try {
            String senderName = body.getOrDefault("senderName", "Độc giả");
            String senderEmail = body.getOrDefault("senderEmail", "user@example.com");
            String senderPhone = body.getOrDefault("senderPhone", "");
            String category = body.getOrDefault("category", "OTHER");
            String priority = body.getOrDefault("priority", "NORMAL");
            String subject = body.getOrDefault("subject", "Cần hỗ trợ về tài khoản");
            String message = body.getOrDefault("message", "Nội dung yêu cầu chi tiết...");
            String customerId = body.get("customerId");

            Customer customer = null;
            if (customerId != null) {
                customer = customerRepository.findById(customerId).orElse(null);
            } else if (senderEmail != null) {
                customer = customerRepository.findByEmail(senderEmail).orElse(null);
            }

            SupportTicket ticket = SupportTicket.builder()
                    .code("TK-" + String.format("%05d", (int) (System.currentTimeMillis() % 100000)))
                    .customer(customer)
                    .senderName(senderName)
                    .senderEmail(senderEmail)
                    .senderPhone(senderPhone)
                    .category(category)
                    .priority(priority)
                    .subject(subject)
                    .message(message)
                    .status("pending")
                    .createdAt(LocalDateTime.now())
                    .build();

            supportTicketRepository.save(ticket);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Đã gửi yêu cầu hỗ trợ thành công! Mã yêu cầu: " + ticket.getCode(),
                    "ticketId", ticket.getTicketId(),
                    "code", ticket.getCode()
            ));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Lỗi khi tạo yêu cầu hỗ trợ: " + e.getMessage()));
        }
    }
}
