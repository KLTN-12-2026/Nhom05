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
import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

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

    /**
     * Endpoint kiểm tra nhanh trạng thái tài khoản đang đăng nhập
     * Dùng cho Heartbeat polling từ phía Frontend để phát hiện lập tức khi tài khoản bị khóa
     */
    @GetMapping("/check-status")
    public ResponseEntity<?> checkStatus() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            return ResponseEntity.ok(Map.of("authenticated", false));
        }

        try {
            String username = authentication.getName();
            Account account = accountRepository.findByUsername(username).orElse(null);
            if (account == null) {
                return ResponseEntity.ok(Map.of("authenticated", false));
            }

            boolean isLocked = "LOCKED".equalsIgnoreCase(account.getStatus());
            return ResponseEntity.ok(Map.of(
                    "authenticated", true,
                    "username", account.getUsername(),
                    "status", account.getStatus() != null ? account.getStatus() : "ACTIVE",
                    "isLocked", isLocked
            ));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of("authenticated", false));
        }
    }

    /**
     * Đăng nhập bằng username/password:
     * - Kiểm tra trạng thái khóa (LOCKED): Nếu bị khóa, chặn ngay với thông báo hotline
     * - Xác thực qua AuthenticationManager
     * - Sinh JWT token thật bằng JwtTokenProvider
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        try {
            String username = loginRequest.getUsername() != null ? loginRequest.getUsername().trim() : "";

            // 1. Kiểm tra trạng thái tài khoản TRƯỚC khi xác thực
            Optional<Account> accOpt = accountRepository.findByUsername(username);
            if (accOpt.isPresent() && "LOCKED".equalsIgnoreCase(accOpt.get().getStatus())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                        "error", "ACCOUNT_LOCKED",
                        "message", "Tài khoản hiện đang bị khóa, vui lòng gọi hotline để hỗ trợ."
                ));
            }

            // 2. Xác thực credentials
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(username, loginRequest.getPassword())
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);

            Account account = accOpt.orElseGet(() -> accountRepository.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản: " + username)));

            // 3. Kiểm tra lại lần nữa sau khi authenticate (phòng trường hợp DB vừa cập nhật)
            if ("LOCKED".equalsIgnoreCase(account.getStatus())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                        "error", "ACCOUNT_LOCKED",
                        "message", "Tài khoản hiện đang bị khóa, vui lòng gọi hotline để hỗ trợ."
                ));
            }

            // Sinh JWT Token thật
            String jwtToken = jwtTokenProvider.generateToken(account.getUsername(), account.getRole().name());

            return ResponseEntity.ok().body(
                    new LoginResponse(jwtToken, account.getRole().name())
            );
        } catch (org.springframework.security.authentication.LockedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                    "error", "ACCOUNT_LOCKED",
                    "message", "Tài khoản hiện đang bị khóa, vui lòng gọi hotline để hỗ trợ."
            ));
        } catch (org.springframework.security.core.AuthenticationException e) {
            System.out.println("❌ Lỗi đăng nhập: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                    "error", "BAD_CREDENTIALS",
                    "message", "Sai username hoặc password!"
            ));
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest registerRequest) {
        try {
            authService.register(registerRequest);
            return new ResponseEntity<>("Dang ki thanh cong", HttpStatus.CREATED);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }

    @PostMapping("/facebook")
    public ResponseEntity<?> authenticateFacebook(@RequestBody SocialLoginRequest request) {
        try {
            AuthResponse response = authService.processFacebookLogin(request.getToken());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                    "error", "ACCOUNT_LOCKED",
                    "message", e.getMessage()
            ));
        }
    }

    @PostMapping("/google")
    public ResponseEntity<?> authenticateGoogle(@RequestBody SocialLoginRequest request) {
        if (request.getToken() == null || request.getToken().isEmpty()) {
            return ResponseEntity.badRequest().body("Token không được để trống");
        }

        try {
            AuthResponse response = authService.processGoogleLogin(request.getToken());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                    "error", "ACCOUNT_LOCKED",
                    "message", e.getMessage()
            ));
        }
    }
}
