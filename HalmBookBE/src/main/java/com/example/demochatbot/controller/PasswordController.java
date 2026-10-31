package com.example.demochatbot.controller;

import com.example.demochatbot.dto.EmailRequest;
import com.example.demochatbot.dto.ResetPasswordRequest;
import com.example.demochatbot.dto.VerifyOtpRequest;
import com.example.demochatbot.model.Account;
import com.example.demochatbot.model.Customer;
import com.example.demochatbot.repository.AccountRepository;
import com.example.demochatbot.repository.CustomerRepository;
import com.example.demochatbot.service.email.EmailService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Random;

@RestController
@CrossOrigin(originPatterns = "*", allowedHeaders = "*")
@RequestMapping("/api/password")
public class PasswordController {

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // 1. Gửi mã otp
    @PostMapping("/send-otp")
    public ResponseEntity<String> sendOtp(@RequestBody EmailRequest emailRequest) {

        String email = emailRequest.getEmail();
        // Tìm mail trong hệ thống
        Optional<Customer> customerOtp = customerRepository.findByEmail(email);

        if (customerOtp.isEmpty()) {
            System.out.println("Ko tìm thấy email này !");
            return new ResponseEntity<>("Email không tồn tại trong hệ thống !", HttpStatus.NOT_FOUND);
        }
        // Tạo mã otp ngẫu nhiên
        String otp = String.format("%06d", new Random().nextInt(999999));

        // Lưu otp vào bảng account
        Customer customer = customerOtp.get();
        Account account = customer.getAccount();

        account.setOtpCode(otp);
        account.setOtpExpiration(LocalDateTime.now().plusMinutes(5));
        accountRepository.save(account);

        try {
            emailService.sendOtpEmail(email, otp);
            return new ResponseEntity<>("Mã otp đã được gửi tới email :" + email, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>("Lỗi khi gửi otp tới mail :" + email, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<String> verifyOtp(@RequestBody VerifyOtpRequest request) {
        Optional<Customer> customerOpt = customerRepository.findByEmail(request.getEmail());

        if (customerOpt.isEmpty()) {
            return new ResponseEntity<>("Email không tồn tại trong hệ thống.", HttpStatus.BAD_REQUEST);
        }

        Account account = customerOpt.get().getAccount();

        if (account.getOtpCode() == null || !account.getOtpCode().equals(request.getOtp())) {
            return new ResponseEntity<>("Mã OTP không chính xác.", HttpStatus.BAD_REQUEST);
        }

        if (account.getOtpExpiration().isBefore(LocalDateTime.now())) {
            return new ResponseEntity<>("Mã OTP đã hết hạn.", HttpStatus.BAD_REQUEST);
        }

        return new ResponseEntity<>("Xác thực thành công.", HttpStatus.OK);
    }

    @PostMapping("/reset-password")
    public ResponseEntity<String> resetPassword(@RequestBody ResetPasswordRequest request) {
        if (request.getNewPassword() == null || request.getNewPassword().trim().isEmpty()) {
            return new ResponseEntity<>("Mật khẩu mới không được để trống.", HttpStatus.BAD_REQUEST);
        }

        Account account = null;

        // 1. Tìm Account qua email của Customer
        if (request.getEmail() != null && !request.getEmail().trim().isEmpty()) {
            Optional<Customer> customerOpt = customerRepository.findByEmail(request.getEmail().trim());
            if (customerOpt.isPresent()) {
                account = customerOpt.get().getAccount();
            }
        }

        // 2. Fallback: Tìm Account qua username nếu được cung cấp hoặc nếu email truyền vào chính là username
        if (account == null && request.getUsername() != null && !request.getUsername().trim().isEmpty()) {
            account = accountRepository.findByUsername(request.getUsername().trim()).orElse(null);
        }
        if (account == null && request.getEmail() != null && !request.getEmail().trim().isEmpty()) {
            account = accountRepository.findByUsername(request.getEmail().trim()).orElse(null);
        }

        if (account == null) {
            return new ResponseEntity<>("Không tìm thấy tài khoản tương ứng với email/username này.", HttpStatus.BAD_REQUEST);
        }

        // Cập nhật mật khẩu mới vào Account
        if (passwordEncoder != null) {
            account.setPassword(passwordEncoder.encode(request.getNewPassword().trim()));
        } else {
            account.setPassword(request.getNewPassword().trim());
        }

        // Xóa OTP sau khi dùng xong để bảo mật
        account.setOtpCode(null);
        account.setOtpExpiration(null);

        accountRepository.save(account);
        System.out.println("Đổi mật khẩu thành công cho tài khoản: " + account.getUsername());
        return new ResponseEntity<>("Đổi mật khẩu thành công.", HttpStatus.OK);
    }
}
