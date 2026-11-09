package com.example.demochatbot.controller;

import com.example.demochatbot.dto.SupportTicketMessage;
import com.example.demochatbot.model.Customer;
import com.example.demochatbot.model.SupportTicket;
import com.example.demochatbot.repository.CustomerRepository;
import com.example.demochatbot.repository.SupportTicketRepository;
import com.example.demochatbot.service.support.SupportTicketProducer;
import org.springframework.beans.factory.annotation.Autowired;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * ============================================================================
 * CONTROLLER: UserSupportController
 * API dành cho Độc giả gửi yêu cầu khiếu nại & hỗ trợ thông qua RabbitMQ
 * Đường dẫn: /api/user/support-tickets
 * ============================================================================
 */
@RestController
@RequestMapping("/api/user/support-tickets")
@CrossOrigin(origins = "*", maxAge = 3600)
public class UserSupportController {

    @Autowired
    private SupportTicketProducer supportTicketProducer;

    @Autowired
    private SupportTicketRepository supportTicketRepository;

    @Autowired
    private CustomerRepository customerRepository;

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
     * 1. Gửi yêu cầu khiếu nại mới thông qua hàng đợi RabbitMQ (Bất đồng bộ)
     */
    @PostMapping
    public ResponseEntity<?> submitSupportTicket(@RequestBody Map<String, String> body) {
        try {
            String subject = body.get("subject");
            String message = body.get("message");
            String category = body.getOrDefault("category", "OTHER");
            String priority = body.getOrDefault("priority", "NORMAL");

            if (subject == null || subject.trim().isEmpty() || message == null || message.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Vui lòng nhập đầy đủ tiêu đề và nội dung yêu cầu!"));
            }

            // Xác định Customer từ phiên đăng nhập nếu có
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String currentIdentifier = (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getName()))
                    ? auth.getName()
                    : null;

            Customer currentCustomer = null;
            if (currentIdentifier != null) {
                currentCustomer = customerRepository.findByEmail(currentIdentifier)
                        .orElse(customerRepository.findById(currentIdentifier).orElse(null));
            }

            String senderName = body.get("senderName");
            if (senderName == null || senderName.trim().isEmpty()) {
                senderName = currentCustomer != null ? currentCustomer.getCustomerName() : "Độc giả ẩn danh";
            }

            String senderEmail = body.get("senderEmail");
            if (senderEmail == null || senderEmail.trim().isEmpty()) {
                senderEmail = currentCustomer != null ? currentCustomer.getEmail() : "";
            }

            String senderPhone = body.get("senderPhone");
            if (senderPhone == null || senderPhone.trim().isEmpty()) {
                senderPhone = currentCustomer != null ? currentCustomer.getPhoneNumber() : "";
            }

            // Sinh mã ticket ngẫu nhiên
            String code = "TK-" + (10000 + (System.currentTimeMillis() % 90000));

            // Đóng gói Message gửi vào RabbitMQ
            SupportTicketMessage msg = SupportTicketMessage.builder()
                    .code(code)
                    .customerId(currentCustomer != null ? currentCustomer.getCustomer_id() : null)
                    .senderName(senderName.trim())
                    .senderEmail(senderEmail.trim())
                    .senderPhone(senderPhone.trim())
                    .category(category)
                    .priority(priority)
                    .subject(subject.trim())
                    .message(message.trim())
                    .createdAt(LocalDateTime.now())
                    .build();

            // Đẩy vào RabbitMQ Broker (Producer)
            supportTicketProducer.sendTicketMessage(msg);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Yêu cầu hỗ trợ của bạn đã được đưa vào hàng đợi xử lý qua RabbitMQ!");
            response.put("ticketCode", code);
            response.put("status", "pending");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Lỗi khi gửi yêu cầu hỗ trợ qua RabbitMQ: " + e.getMessage()));
        }
    }

    /**
     * 2. Lấy danh sách các yêu cầu khiếu nại của chính độc giả
     * Hỗ trợ tìm qua phiên đăng nhập, email người gửi hoặc danh sách mã ticket lưu ở Client
     */
    @GetMapping("/my-tickets")
    public ResponseEntity<?> getMyTickets(
            @RequestParam(value = "email", required = false) String emailParam,
            @RequestParam(value = "codes", required = false) String codesParam
    ) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String currentIdentifier = (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getName()))
                    ? auth.getName()
                    : null;

            Set<Long> addedIds = new HashSet<>();
            List<SupportTicket> tickets = new ArrayList<>();

            // 1. Tìm theo Customer đã đăng nhập
            if (currentIdentifier != null) {
                Customer customer = customerRepository.findByEmail(currentIdentifier)
                        .orElse(customerRepository.findById(currentIdentifier).orElse(null));
                if (customer != null) {
                    List<SupportTicket> byCust = supportTicketRepository.findByCustomerId(customer.getCustomer_id());
                    for (SupportTicket t : byCust) {
                        if (addedIds.add(t.getTicketId())) tickets.add(t);
                    }
                    if (customer.getEmail() != null) {
                        List<SupportTicket> byEmail = supportTicketRepository.findAllByOrderByCreatedAtDesc().stream()
                                .filter(t -> customer.getEmail().equalsIgnoreCase(t.getSenderEmail()))
                                .toList();
                        for (SupportTicket t : byEmail) {
                            if (addedIds.add(t.getTicketId())) tickets.add(t);
                        }
                    }
                }
            }

            // 2. Tìm theo emailParam truyền lên từ client
            if (emailParam != null && !emailParam.trim().isEmpty()) {
                String targetEmail = emailParam.trim().toLowerCase();
                List<SupportTicket> byParamEmail = supportTicketRepository.findAllByOrderByCreatedAtDesc().stream()
                        .filter(t -> t.getSenderEmail() != null && t.getSenderEmail().trim().toLowerCase().equals(targetEmail))
                        .toList();
                for (SupportTicket t : byParamEmail) {
                    if (addedIds.add(t.getTicketId())) tickets.add(t);
                }
            }

            // 3. Tìm theo danh sách ticket codes (phân tách bởi dấu phẩy)
            if (codesParam != null && !codesParam.trim().isEmpty()) {
                String[] codeArr = codesParam.split(",");
                for (String c : codeArr) {
                    String cleanCode = c.trim();
                    if (!cleanCode.isEmpty()) {
                        supportTicketRepository.findByCode(cleanCode).ifPresent(t -> {
                            if (addedIds.add(t.getTicketId())) tickets.add(t);
                        });
                    }
                }
            }

            // Sắp xếp theo ngày tạo mới nhất lên đầu
            tickets.sort((a, b) -> {
                if (a.getCreatedAt() == null || b.getCreatedAt() == null) return 0;
                return b.getCreatedAt().compareTo(a.getCreatedAt());
            });

            List<Map<String, Object>> result = new ArrayList<>();
            for (SupportTicket t : tickets) {
                String userAvatar = resolveCustomerAvatar(t);
                Map<String, Object> item = new HashMap<>();
                item.put("id", t.getTicketId());
                item.put("code", t.getCode() != null ? t.getCode() : "TK-" + t.getTicketId());
                item.put("category", t.getCategory() != null ? t.getCategory() : "OTHER");
                item.put("priority", t.getPriority() != null ? t.getPriority() : "NORMAL");
                item.put("subject", t.getSubject() != null ? t.getSubject() : "");
                item.put("message", t.getMessage() != null ? t.getMessage() : "");
                item.put("userAvatar", userAvatar);
                item.put("status", t.getStatus() != null ? t.getStatus() : "pending");
                item.put("adminReply", t.getAdminReply() != null ? t.getAdminReply() : "");
                item.put("chatHistory", parseChatHistory(t, userAvatar));
                item.put("replyAt", t.getReplyAt() != null ? t.getReplyAt().format(DATE_TIME_FORMATTER) : "");
                item.put("createdAt", t.getCreatedAt() != null ? t.getCreatedAt().format(DATE_TIME_FORMATTER) : "");
                result.add(item);
            }

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Lỗi khi lấy danh sách khiếu nại: " + e.getMessage()));
        }
    }

    /**
     * 3. Gửi tin nhắn trò chuyện tiếp nối trong một Ticket (2 chiều giữa User và Admin)
     */
    @PostMapping("/{id}/message")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<?> addUserMessage(
            @PathVariable("id") Long id,
            @RequestBody Map<String, String> body
    ) {
        try {
            Optional<SupportTicket> opt = supportTicketRepository.findById(id);
            if (opt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Không tìm thấy ticket #" + id));
            }
            String content = body != null ? body.get("message") : null;
            if (content == null || content.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Nội dung tin nhắn không được để trống!"));
            }

            SupportTicket ticket = opt.get();
            // Độc giả nhắn tiếp -> cập nhật trạng thái pending để Admin chú ý
            ticket.setStatus("pending");

            List<Map<String, String>> history = parseChatHistory(ticket);
            Map<String, String> newMsg = new HashMap<>();
            newMsg.put("sender", "USER");
            newMsg.put("senderName", body.getOrDefault("senderName", ticket.getSenderName() != null ? ticket.getSenderName() : "Độc giả"));
            newMsg.put("content", content.trim());
            newMsg.put("time", LocalDateTime.now().format(DATE_TIME_FORMATTER));
            history.add(newMsg);

            try {
                ticket.setChatHistory(objectMapper.writeValueAsString(history));
            } catch (Exception ignored) {}

            supportTicketRepository.save(ticket);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Đã gửi tin nhắn thành công!",
                    "chatHistory", history,
                    "ticketId", ticket.getTicketId()
            ));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Lỗi gửi tin nhắn: " + e.getMessage()));
        }
    }

}
