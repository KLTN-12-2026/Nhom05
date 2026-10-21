package com.example.demochatbot.service.email;

import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {
    @Autowired
    private JavaMailSender mailSender;


    @Value("${spring.mail.username}") //email người gửi
    private String sender;

    /**
     * Hàm gửi email chứa mã OTP
     *
     * @param recipientEmail: Email người nhận
     * @param otpCode:        Mã OTP
     */


    public void sendOtpEmail(String recipientEmail, String otpCode) {
        try {
            SimpleMailMessage mailMessage = new SimpleMailMessage();
            mailMessage.setFrom(sender);
            mailMessage.setTo(recipientEmail);
            mailMessage.setSubject("Mã OTP xác nhận đổi mật khẩu - HALMBook");
            mailMessage.setText("Xin chào,\n\n"
                    + "Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản HALMBook.\n"
                    + "Mã OTP xác thực của bạn là: " + otpCode + "\n\n"
                    + "Mã này sẽ hết hạn trong vòng 5 phút.\n"
                    + "Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.\n\n"
                    + "Trân trọng.\n\n"
                    + "Đội ngũ Admin HALMBook <3 .");
            mailSender.send(mailMessage);
            System.out.println("Đã gửi mail thành công đến " + recipientEmail);

        } catch (Exception e) {
            System.err.println("Lỗi khi gửi mail : " + e.getMessage());
            throw new RuntimeException("Ko thể gửi mail,vui lòng kiểm tra lại cấu hình hoặc kết nối mạng !");
        }
    }
}
