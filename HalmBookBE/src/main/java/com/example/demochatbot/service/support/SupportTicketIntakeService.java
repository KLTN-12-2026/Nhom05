package com.example.demochatbot.service.support;

import com.example.demochatbot.dto.SupportTicketMessage;
import com.example.demochatbot.model.*;
import com.example.demochatbot.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class SupportTicketIntakeService {
    private final SupportTicketRepository tickets;
    private final CustomerRepository customers;
    private final NotificationRepository notifications;

    public SupportTicketIntakeService(SupportTicketRepository tickets, CustomerRepository customers,
                                      NotificationRepository notifications) {
        this.tickets = tickets;
        this.customers = customers;
        this.notifications = notifications;
    }

    /** The ticket code is the delivery identity. Ticket and notification commit together. */
    @Transactional
    public Optional<SupportTicket> accept(SupportTicketMessage message) {
        if (message == null || message.getCode() == null || message.getCode().isBlank()) {
            throw new IllegalArgumentException("Support message requires a ticket code");
        }
        if (tickets.existsByCode(message.getCode())) return Optional.empty();

        Customer customer = null;
        if (message.getCustomerId() != null && !message.getCustomerId().isBlank()) {
            customer = customers.findById(message.getCustomerId()).orElse(null);

        }
        SupportTicket ticket = SupportTicket.builder()
                .code(message.getCode()).customer(customer)
                .senderName(message.getSenderName() != null ? message.getSenderName() : customer != null ? customer.getCustomerName() : "Khách hàng")
                .senderEmail(message.getSenderEmail() != null ? message.getSenderEmail() : customer != null ? customer.getEmail() : "")
                .senderPhone(message.getSenderPhone() != null ? message.getSenderPhone() : customer != null ? customer.getPhoneNumber() : "")
                .category(message.getCategory() != null ? message.getCategory() : "OTHER")
                .priority(message.getPriority() != null ? message.getPriority() : "NORMAL")
                .subject(message.getSubject()).message(message.getMessage()).status("pending")
                .createdAt(message.getCreatedAt() != null ? message.getCreatedAt() : LocalDateTime.now())
                .build();
        tickets.saveAndFlush(ticket);
        if (customer != null) {
            notifications.save(Notification.builder()
                    .customerId(customer.getCustomer_id())
                    .title("Yêu Cầu Hỗ Trợ Đã Được Tiếp Nhận 📬")
                    .message("Yêu cầu #" + ticket.getCode() + " (\"" + ticket.getSubject() + "\") đã được tiếp nhận. Ban quản trị sẽ phản hồi trong thời gian sớm nhất!")
                    .type("SYSTEM").link("/canhan?tab=support").isRead(false)
                    .createdAt(LocalDateTime.now()).build());
        }
        return Optional.of(ticket);
    }
}
