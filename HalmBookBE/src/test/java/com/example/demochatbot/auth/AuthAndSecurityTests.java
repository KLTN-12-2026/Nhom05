package com.example.demochatbot.auth;

import com.example.demochatbot.config.JwtTokenProvider;
import com.example.demochatbot.enums.Role;
import com.example.demochatbot.model.Account;
import com.example.demochatbot.service.account.CustomUserDetails;
import com.example.demochatbot.service.auth.TokenBlacklistService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Xác thực & Phân quyền Test Suite (Auth & Security)")
class AuthAndSecurityTests {

    private JwtTokenProvider jwtTokenProvider;
    private TokenBlacklistService tokenBlacklistService;
    private PasswordEncoder passwordEncoder;

    // Secret key >= 512 bits for HS512
    private static final String TEST_SECRET = "HalmBookSecretKeyForJwtTokenProviderUnitTestingMustBeAtLeast512BitsLongForHS512AlgorithmSecurityCompliance2026";
    private static final int TEST_EXPIRATION_MS = 3600000; // 1 hour

    @BeforeEach
    void setUp() {
        jwtTokenProvider = new JwtTokenProvider();
        ReflectionTestUtils.setField(jwtTokenProvider, "jwtSecret", TEST_SECRET);
        ReflectionTestUtils.setField(jwtTokenProvider, "jwtExpirationMs", TEST_EXPIRATION_MS);

        tokenBlacklistService = new TokenBlacklistService();
        passwordEncoder = new BCryptPasswordEncoder();
    }

    @Test
    @DisplayName("1. Sinh JWT Token hợp lệ và trích xuất đúng Email/Username và Role")
    void testJwtTokenGenerationAndClaimsExtraction() {
        String email = "reader@halmbook.vn";
        String role = "ROLE_USER";

        String token = jwtTokenProvider.generateToken(email, role);

        assertNotNull(token, "JWT token không được null");
        assertFalse(token.isBlank(), "JWT token không được rỗng");
        assertEquals(3, token.split("\\.").length, "JWT token phải có đúng 3 phần: header.payload.signature");

        assertTrue(jwtTokenProvider.validateToken(token), "Token vừa tạo phải hợp lệ khi kiểm tra");
        assertEquals(email, jwtTokenProvider.getEmailFromJWT(token), "Email trích xuất từ JWT phải trùng khớp");
        assertEquals(email, jwtTokenProvider.getUsernameFromJWT(token), "Username trích xuất từ JWT phải trùng khớp");
    }

    @Test
    @DisplayName("2. Kiểm tra tính toàn vẹn của Token (từ chối token giả mạo, rỗng hoặc sai khóa)")
    void testJwtTokenValidationTamperedOrInvalid() {
        String validToken = jwtTokenProvider.generateToken("admin@halmbook.vn", "ROLE_ADMIN");

        // Token giả mạo chữ ký
        String tamperedToken = validToken.substring(0, validToken.length() - 5) + "abcde";
        assertFalse(jwtTokenProvider.validateToken(tamperedToken), "Token bị giả mạo chữ ký phải bị từ chối");

        // Token rỗng hoặc null
        assertFalse(jwtTokenProvider.validateToken(""), "Token rỗng phải bị từ chối");
        assertFalse(jwtTokenProvider.validateToken("   "), "Token chỉ chứa khoảng trắng phải bị từ chối");
        assertFalse(jwtTokenProvider.validateToken("invalid.token.format"), "Token sai định dạng phải bị từ chối");
    }

    @Test
    @DisplayName("3. Thu hồi Token vào Blacklist khi đăng xuất (Token Revocation)")
    void testTokenBlacklistRevocation() {
        String token = jwtTokenProvider.generateToken("user@halmbook.vn", "ROLE_USER");

        // Ban đầu token chưa nằm trong blacklist
        assertFalse(tokenBlacklistService.isBlacklisted(token), "Token mới tạo không được nằm trong blacklist");

        // Đưa token vào blacklist (có tiền tố Bearer hoặc không)
        tokenBlacklistService.blacklistToken("Bearer " + token, System.currentTimeMillis() + 60000);

        // Token phải được xác nhận là đã bị thu hồi
        assertTrue(tokenBlacklistService.isBlacklisted(token), "Token đã đăng xuất phải nằm trong danh sách đen");
        assertTrue(tokenBlacklistService.isBlacklisted("Bearer " + token), "Kiểm tra với tiền tố Bearer cũng phải trả về true");

        // Token khác không bị ảnh hưởng
        String anotherToken = jwtTokenProvider.generateToken("other@halmbook.vn", "ROLE_USER");
        assertFalse(tokenBlacklistService.isBlacklisted(anotherToken), "Token của người dùng khác không được bị thu hồi nhầm");
    }

    @Test
    @DisplayName("4. Mã hóa và xác thực mật khẩu an toàn với BCrypt")
    void testPasswordEncodingAndMatching() {
        String rawPassword = "SecurePassword@2026";

        String encodedPassword = passwordEncoder.encode(rawPassword);

        assertNotNull(encodedPassword);
        assertNotEquals(rawPassword, encodedPassword, "Mật khẩu mã hóa không được trùng mật khẩu gốc");
        assertTrue(passwordEncoder.matches(rawPassword, encodedPassword), "Mật khẩu đúng phải khớp với chuỗi mã hóa BCrypt");
        assertFalse(passwordEncoder.matches("WrongPassword", encodedPassword), "Mật khẩu sai không được khớp");
    }

    @Test
    @DisplayName("5. Ánh xạ quyền người dùng (CustomUserDetails Authorities)")
    void testCustomUserDetailsAuthorities() {
        Account userAccount = new Account();
        userAccount.setAccount_id(1);
        userAccount.setUsername("reader_halm");
        userAccount.setPassword("encoded_pass");
        userAccount.setRole(Role.USER);
        userAccount.setStatus("ACTIVE");

        CustomUserDetails userDetails = new CustomUserDetails(userAccount);
        assertEquals("reader_halm", userDetails.getUsername());
        assertTrue(userDetails.isAccountNonLocked(), "Tài khoản trạng thái ACTIVE phải non-locked");
        assertTrue(userDetails.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_USER")));

        Account lockedAccount = new Account();
        lockedAccount.setRole(Role.USER);
        lockedAccount.setStatus("LOCKED");
        CustomUserDetails lockedDetails = new CustomUserDetails(lockedAccount);
        assertFalse(lockedDetails.isAccountNonLocked(), "Tài khoản trạng thái LOCKED phải trả về false cho isAccountNonLocked");
    }
}
