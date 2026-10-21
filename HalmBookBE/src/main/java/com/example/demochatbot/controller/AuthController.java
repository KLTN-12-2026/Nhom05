package com.example.demochatbot.controller;

import com.example.demochatbot.config.JwtTokenProvider;
import com.example.demochatbot.dto.*;
import com.example.demochatbot.model.Account;
import com.example.demochatbot.repository.AccountRepository;
import com.example.demochatbot.service.account.CustomUserDetails;
import com.example.demochatbot.service.auth.AuthServiceImpl;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.http.ResponseEntity;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    @Autowired
    @Lazy
    private AuthenticationManager authenticationManager;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private AuthServiceImpl authService;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @GetMapping("/me")
    public ResponseEntity<?> getMyInfo() throws NullPointerException {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            return new ResponseEntity<>("user not authenticated", HttpStatus.UNAUTHORIZED);
        }
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();

        assert userDetails != null;
        String role = userDetails.getAuthorities().
                stream().findFirst().
                map(GrantedAuthority::getAuthority).
                orElse("USER");
        if (role.startsWith("ROLE_")) {
            role = role.substring(5);
        }
        Map<String, Object> userInfo = new HashMap<>();
        userInfo.put("username", userDetails.getUsername());
        userInfo.put("role", role);
        userInfo.put("account_id", userDetails.getAccount().getAccount_id());
        return ResponseEntity.ok(userInfo);
    }

    @GetMapping("/encode")
    public String encodePassword(@RequestParam String rawPassword) {
        return new BCryptPasswordEncoder().encode(rawPassword);
    }

    /**
     * FIX: Đăng nhập bằng username/password:
     * - Xác thực qua AuthenticationManager
     * - Sinh JWT token thật (3 phần tách bởi dấu chấm) bằng JwtTokenProvider
     * - Trả về token và role cho Frontend lưu vào localStorage
     * - Loại bỏ việc lưu Session thủ công vì hệ thống chạy Stateless
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword())
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);

            Account account = accountRepository.findByUsername(loginRequest.getUsername())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản: " + loginRequest.getUsername()));

            // Sinh JWT Token thật thay cho chuỗi giả "fake-jwt-token"
            String jwtToken = jwtTokenProvider.generateToken(account.getUsername(), account.getRole().name());

            return ResponseEntity.ok().body(
                    new LoginResponse(jwtToken, account.getRole().name())
            );
        } catch (org.springframework.security.core.AuthenticationException e) {
            System.out.println("❌ Lỗi đăng nhập: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Sai username hoặc password!");
        }
    }


    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest registerRequest) {
        try {
            authService.register(registerRequest);
            return new ResponseEntity<>("Dang ki thanh cong", HttpStatus.CREATED);

        }catch (RuntimeException e){
            return new ResponseEntity<>( e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }



    @PostMapping("/facebook")
    public ResponseEntity<?> authenticateFacebook(@RequestBody SocialLoginRequest request) {
        System.out.println("===== ĐÃ LỌT VÀO CONTROLLER FACEBOOK =====");
        System.out.println("Token nhận được: " + request.getToken());
        try {
            AuthResponse response = authService.processFacebookLogin(request.getToken());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(401).body("Xác thực Facebook thất bại: " + e.getMessage());
        }
    }
    @PostMapping("/google")
    public ResponseEntity<?> authenticateGoogle(@RequestBody SocialLoginRequest request) {
        System.out.println("===== ĐÃ LỌT VÀO CONTROLLER GOOGLE =====");
        System.out.println("Token nhận được: " + request.getToken());
        if(request.getToken() == null || request.getToken().isEmpty()) {
            return ResponseEntity.badRequest().body("Token không được để trống");
        }

        try {
            AuthResponse response = authService.processGoogleLogin(request.getToken());
            return ResponseEntity.ok(response);
        } catch (Exception e) {

            return ResponseEntity.status(401).body("Xác thực Google thất bại: " + e.getMessage());
        }
    }
}
