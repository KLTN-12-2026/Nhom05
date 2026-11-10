package com.example.demochatbot.service.support;

import com.example.demochatbot.config.RabbitMQConfig;
import com.example.demochatbot.dto.SupportTicketMessage;
import com.example.demochatbot.model.Customer;
import com.example.demochatbot.model.Notification;
import com.example.demochatbot.model.SupportTicket;
import com.example.demochatbot.repository.CustomerRepository;
import com.example.demochatbot.repository.NotificationRepository;
import com.example.demochatbot.repository.SupportTicketRepository;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

/**
 * ============================================================================
 * CONSUMER / WORKER: SupportTicketConsumer
 * Lắng nghe hàng đợi RabbitMQ, lưu trữ vào Database MySQL, tạo thông báo và gửi mail
 * ============================================================================
 */
@Service
public class SupportTicketConsumer {

    @Autowired
    private SupportTicketRepository supportTicketRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @RabbitListener(queues = RabbitMQConfig.QUEUE_NAME)
    public void processSupportTicket(SupportTicketMessage msg) {
        System.out.println("<<< [RabbitMQ Consumer] Nhận được tin nhắn từ Queue: " + msg.getCode() + " - " + msg.getSubject());

        try {
            // 1. Tìm Customer tương ứng nếu có
            Customer customer = null;
            if (msg.getCustomerId() != null && !msg.getCustomerId().isEmpty()) {
                customer = customerRepository.findById(msg.getCustomerId()).orElse(null);
            } else if (msg.getSenderEmail() != null && !msg.getSenderEmail().isEmpty()) {
                customer = customerRepository.findByEmail(msg.getSenderEmail()).orElse(null);
            }

            // 2. Lưu vào Database MySQL (Bảng support_ticket)
            SupportTicket ticket = SupportTicket.builder()
                    .code(msg.getCode())
                    .customer(customer)
                    .senderName(msg.getSenderName() != null ? msg.getSenderName() : (customer != null ? customer.getCustomerName() : "Khách hàng"))
                    .senderEmail(msg.getSenderEmail() != null ? msg.getSenderEmail() : (customer != null ? customer.getEmail() : ""))
                    .senderPhone(msg.getSenderPhone() != null ? msg.getSenderPhone() : (customer != null ? customer.getPhoneNumber() : ""))
                    .category(msg.getCategory() != null ? msg.getCategory() : "OTHER")
                    .priority(msg.getPriority() != null ? msg.getPriority() : "NORMAL")
                    .subject(msg.getSubject())
                    .message(msg.getMessage())
                    .status("pending")
                    .createdAt(msg.getCreatedAt() != null ? msg.getCreatedAt() : LocalDateTime.now())
                    .build();

            supportTicketRepository.save(ticket);
            System.out.println("<<< [RabbitMQ Consumer] Đã lưu thành công vào MySQL: ID #" + ticket.getTicketId() + " (" + ticket.getCode() + ")");

            // 3. Tạo thông báo (Notification) xác nhận cho độc giả
            if (customer != null) {
                Notification notif = Notification.builder()
                        .customerId(customer.getCustomer_id())
                        .title("Yêu Cầu Hỗ Trợ Đã Được Tiếp Nhận 📬")
                        .message("Yêu cầu #" + ticket.getCode() + " (\"" + ticket.getSubject() + "\") đã được gửi qua hàng đợi xử lý. Ban quản trị sẽ phản hồi trong thời gian sớm nhất!")
                        .type("SYSTEM")
                        .link("/canhan?tab=support")
                        .isRead(false)
                        .createdAt(LocalDateTime.now())
                        .build();
                notificationRepository.save(notif);
            }

            // 4. Gửi email xác nhận bất đồng bộ cho độc giả nếu có cấu hình mail
            sendConfirmationEmail(ticket);

        } catch (Exception e) {
            System.err.println("!!! [RabbitMQ Consumer] Lỗi khi xử lý message từ Queue: " + e.getMessage());
            e.printStackTrace();
            throw e; // Ném lỗi để RabbitMQ kích hoạt cơ chế retry hoặc đẩy sang Dead Letter Queue (DLQ)
        }
    }

    private void sendConfirmationEmail(SupportTicket ticket) {
        if (mailSender == null || ticket.getSenderEmail() == null || ticket.getSenderEmail().isEmpty()) {
            return;
        }
        try {
            SimpleMailMessage email = new SimpleMailMessage();
            email.setTo(ticket.getSenderEmail());
            email.setSubject("[HALM BOOK] Xác nhận tiếp nhận yêu cầu hỗ trợ #" + ticket.getCode());
            email.setText(
                    "Xin chào " + ticket.getSenderName() + ",\n\n" +
                    "Hệ thống HALM BOOK đã tiếp nhận yêu cầu hỗ trợ của bạn:\n" +
                    "- Mã yêu cầu: " + ticket.getCode() + "\n" +
                    "- Tiêu đề: " + ticket.getSubject() + "\n" +
                    "- Phân loại: " + ticket.getCategory() + "\n\n" +
                    "Đội ngũ quản trị viên đang kiểm tra và sẽ phản hồi bạn trong thời gian sớm nhất.\n" +
                    "Bạn có thể theo dõi tiến độ xử lý trực tiếp tại trang Cá Nhân -> Hỗ Trợ & Khiếu Nại.\n\n" +
                    "Trân trọng,\nĐội ngũ Hỗ trợ Độc giả HALM BOOK."
            );
            mailSender.send(email);
            System.out.println("<<< [RabbitMQ Consumer] Đã gửi email xác nhận đến: " + ticket.getSenderEmail());
        } catch (Exception ex) {
            System.err.println("Notice: Gửi email xác nhận không thành công: " + ex.getMessage());
        }
    }
}
