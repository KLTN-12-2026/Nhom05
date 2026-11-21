package com.example.demochatbot.service.support;

import com.example.demochatbot.config.RabbitMQConfig;
import com.example.demochatbot.dto.SupportTicketMessage;
import com.example.demochatbot.model.SupportTicket;
import com.example.demochatbot.repository.SupportTicketRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.mail.MailAuthenticationException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.concurrent.atomic.AtomicBoolean;

@Slf4j
@Service
public class SupportTicketConsumer {
    private final SupportTicketIntakeService intake;
    private final SupportTicketRepository tickets;
    private final AtomicBoolean mailAuthenticationFailed = new AtomicBoolean();

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${halm.support.confirmation-email.enabled:true}")
    private boolean confirmationEmailEnabled = true;

    @Value("${spring.mail.username:}")
    private String senderAddress;

    public SupportTicketConsumer(SupportTicketIntakeService intake, SupportTicketRepository tickets) {
        this.intake = intake;
        this.tickets = tickets;
    }

    @RabbitListener(queues = RabbitMQConfig.QUEUE_NAME)
    public void processSupportTicket(SupportTicketMessage message) {
        Optional<SupportTicket> created;
        try {
            created = intake.accept(message);
        } catch (DataIntegrityViolationException collision) {
            // Another consumer can commit the same code after accept's existence check.
            // This catch runs outside the failed transaction, so the lookup is usable.
            if (message == null || message.getCode() == null || !tickets.existsByCode(message.getCode())) throw collision;
            log.info("Bỏ qua message đã xử lý: {}", message.getCode());
            return;
        }
        if (created.isEmpty()) {
            log.info("Bỏ qua message đã xử lý: {}", message.getCode());
            return;
        }
        SupportTicket ticket = created.get();
        log.info("Đã lưu yêu cầu hỗ trợ {} vào MySQL, ID #{}", ticket.getCode(), ticket.getTicketId());
        // The intake transaction has committed. SMTP failure must not requeue a saved ticket.
        sendConfirmationEmail(ticket);
    }

    private void sendConfirmationEmail(SupportTicket ticket) {
        if (!confirmationEmailEnabled || mailAuthenticationFailed.get() || mailSender == null
                || ticket.getSenderEmail() == null || ticket.getSenderEmail().isBlank()) return;
        try {
            SimpleMailMessage email = new SimpleMailMessage();
            if (senderAddress != null && !senderAddress.isBlank()) email.setFrom(senderAddress);
            email.setTo(ticket.getSenderEmail());
            email.setSubject("[HALM BOOK] Xác nhận tiếp nhận yêu cầu hỗ trợ #" + ticket.getCode());
            email.setText("Xin chào " + ticket.getSenderName() + ",\n\n"
                    + "HALM BOOK đã tiếp nhận yêu cầu #" + ticket.getCode() + ": " + ticket.getSubject() + ".\n"
                    + "Bạn có thể theo dõi tại trang Cá Nhân > Hỗ Trợ & Khiếu Nại.\n\n"
                    + "Trân trọng,\nĐội ngũ Hỗ trợ Độc giả HALM BOOK.");
            mailSender.send(email);
            log.info("Đã gửi email xác nhận cho ticket {}", ticket.getCode());
        } catch (Exception failure) {
            if (isAuthenticationFailure(failure)) {
                if (mailAuthenticationFailed.compareAndSet(false, true)) {
                    log.warn("SMTP xác thực thất bại. Đã tạm ngừng email xác nhận hỗ trợ đến khi khởi động lại. "
                            + "Kiểm tra MAIL_USERNAME và MAIL_PASSWORD (mật khẩu ứng dụng SMTP). Ticket vẫn được lưu.");
                }
            } else {
                log.warn("Không gửi được email xác nhận cho ticket {} ({}). Ticket vẫn được lưu.",
                        ticket.getCode(), failure.getClass().getSimpleName());
            }
        }
    }

    private boolean isAuthenticationFailure(Throwable failure) {
        for (Throwable cause = failure; cause != null; cause = cause.getCause()) {
            if (cause instanceof MailAuthenticationException || cause instanceof jakarta.mail.AuthenticationFailedException) return true;
        }
        return false;
    }
}
