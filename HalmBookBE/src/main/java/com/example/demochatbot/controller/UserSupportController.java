package com.example.demochatbot.controller;

import com.example.demochatbot.dto.SupportTicketMessage;
import com.example.demochatbot.model.Customer;
import com.example.demochatbot.model.SupportTicket;
import com.example.demochatbot.repository.CustomerRepository;
import com.example.demochatbot.repository.SupportTicketRepository;
import com.example.demochatbot.service.support.SupportTicketProducer;
import com.example.demochatbot.service.customer.CustomerService;
import org.springframework.beans.factory.annotation.Autowired;
import com.example.demochatbot.service.support.SupportChatHistory;
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
    private com.example.demochatbot.service.support.SupportTicketIntakeService intakeService;

    @Autowired
    private SupportTicketRepository supportTicketRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private CustomerService customerService;


    
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
        return SupportChatHistory.read(ticket, userAvatar);
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
                currentCustomer = currentCustomer(currentIdentifier);
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

            // Sinh mã ticket duy nhất, chống xung đột khóa unique khi chịu tải đồng thời
            String code = "TK-" + UUID.randomUUID().toString().toUpperCase();

            // Đóng gói Message gửi vào RabbitMQ
            SupportTicketMessage msg = SupportTicketMessage.builder()
                    .code(code)
                    .customerId(currentCustomer != null ? currentCustomer.getCustomer_id() : null)
                    .senderName(Objects.toString(senderName, "Độc giả").trim())
                    .senderEmail(Objects.toString(senderEmail, "").trim())
                    .senderPhone(Objects.toString(senderPhone, "").trim())
                    .category(category)
                    .priority(priority)
                    .subject(subject.trim())
                    .message(message.trim())
                    .createdAt(LocalDateTime.now())
                    .build();

            // Đẩy vào RabbitMQ Broker (Producer)
            boolean queued = true;
            try {
                supportTicketProducer.sendTicketMessage(msg);
            } catch (org.springframework.amqp.AmqpException queueUnavailable) {
                // Persist with the same validated identity; readers never need an admin API.
                intakeService.accept(msg);
                queued = false;
            }

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Yêu cầu hỗ trợ của bạn đã được tiếp nhận!");
            response.put("queued", queued);
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

            Customer customer = currentIdentifier == null ? null : currentCustomer(currentIdentifier);
            if (customer != null) {
                for (SupportTicket ticket : supportTicketRepository.findByCustomerId(customer.getCustomer_id())) {
                    if (addedIds.add(ticket.getTicketId())) tickets.add(ticket);
                }
            }
            // Email is contact information, never proof of ownership.
            if (codesParam != null && !codesParam.isBlank()) {
                for (String code : Arrays.stream(codesParam.split(",")).limit(50).toList()) {
                    supportTicketRepository.findByCode(code.trim()).ifPresent(ticket -> {
                        if (canAccess(ticket, customer, code.trim()) && addedIds.add(ticket.getTicketId())) tickets.add(ticket);
                    });
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
            Optional<SupportTicket> opt = supportTicketRepository.findByIdForUpdate(id);
            if (opt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Không tìm thấy ticket #" + id));
            }
            String content = body != null ? body.get("message") : null;
            if (content == null || content.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Nội dung tin nhắn không được để trống!"));
            }

            SupportTicket ticket = opt.get();
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String identifier = auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getName()) ? auth.getName() : null;
            Customer current = identifier == null ? null : currentCustomer(identifier);
            if (!canAccess(ticket, current, body.get("code"))) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Bạn không có quyền nhắn vào yêu cầu này."));
            }
            // Độc giả nhắn tiếp -> cập nhật trạng thái pending để Admin chú ý


            List<Map<String, String>> history = parseChatHistory(ticket);
            String requestId = body.get("requestId");
            if (SupportChatHistory.containsRequest(history, "USER", requestId)) {
                return ResponseEntity.ok(Map.of("success", true, "ticketId", ticket.getTicketId(), "chatHistory", history));
            }
            Map<String, String> newMsg = new HashMap<>();
            newMsg.put("id", requestId == null || requestId.isBlank() ? UUID.randomUUID().toString() : requestId);
            newMsg.put("sender", "USER");
            newMsg.put("senderName", body.getOrDefault("senderName", ticket.getSenderName() != null ? ticket.getSenderName() : "Độc giả"));
            newMsg.put("content", content.trim());
            newMsg.put("time", LocalDateTime.now().format(DATE_TIME_FORMATTER));

            ticket.setStatus("pending");
            history.add(newMsg);
            ticket.setChatHistory(SupportChatHistory.write(history));

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

    /** Deletes a ticket only for its authenticated owner (or a guest presenting its ticket code). */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteMyTicket(
            @PathVariable("id") Long id,
            @RequestParam(value = "code", required = false) String ticketCode
    ) {
        Optional<SupportTicket> opt = supportTicketRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        SupportTicket ticket = opt.get();
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String identifier = auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getName())
                ? auth.getName() : null;
        Customer current = identifier == null ? null : currentCustomer(identifier);
        boolean isOwner = canAccess(ticket, current, ticketCode);

        if (!isOwner) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Bạn không có quyền xóa yêu cầu hỗ trợ này."));
        }

        supportTicketRepository.delete(ticket);
        return ResponseEntity.ok(Map.of("success", true, "ticketId", id));
    }

    private boolean canAccess(SupportTicket ticket, Customer current, String code) {
        if (ticket.getCustomer() != null) {
            return current != null && Objects.equals(ticket.getCustomer().getCustomer_id(), current.getCustomer_id());
        }
        // Guest tickets use an unguessable bearer code. Short legacy codes must not expose private history.
        return code != null && code.matches("TK-[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}")
                && code.equals(ticket.getCode());
    }

    private Customer currentCustomer(String identifier) {
        try {
            return customerService.findCustomerById(customerService.getCurrentAccountId());
        } catch (RuntimeException e) {
            return customerRepository.findByEmail(identifier).orElse(null);
        }
    }

}
