package com.example.demochatbot.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider tokenProvider;
    private final UserDetailsService userDetailsService;

    public JwtAuthenticationFilter(JwtTokenProvider tokenProvider, UserDetailsService userDetailsService) {
        this.tokenProvider = tokenProvider;
        this.userDetailsService = userDetailsService;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        try {
            // 1. Rút trích Token từ Request
            String jwt = getJwtFromRequest(request);

            // 2. Nếu có Token và Token hợp lệ
            if (StringUtils.hasText(jwt) && tokenProvider.validateToken(jwt)) {

                // 3. Lấy email/username từ Token
                String email = tokenProvider.getEmailFromJWT(jwt);

                // 4. Đối chiếu với Database để lấy thông tin chi tiết
                UserDetails userDetails = userDetailsService.loadUserByUsername(email);

                if (userDetails != null) {
                    // 4b. KIỂM TRA TRẠNG THÁI KHÓA TÀI KHOẢN:
                    // Nếu tài khoản đã bị khóa bởi Quản trị viên (status = LOCKED):
                    // Chặn ngay lập tức với HTTP 423 Locked để Frontend phát hiện và kích hoạt logout đếm ngược.
                    if (!userDetails.isAccountNonLocked()) {
                        String origin = request.getHeader("Origin");
                        if (origin != null && !origin.isEmpty()) {
                            response.setHeader("Access-Control-Allow-Origin", origin);
                            response.setHeader("Access-Control-Allow-Credentials", "true");
                            response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
                            response.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type, Accept, X-Requested-With, Origin");
                        }
                        response.setStatus(423); // 423 Locked
                        response.setContentType("application/json;charset=UTF-8");
                        response.getWriter().write("{\"error\":\"ACCOUNT_LOCKED\",\"message\":\"Tài khoản của bạn đã bị khóa bởi Quản trị viên!\"}");
                        response.getWriter().flush();
                        return;
                    }

                    // 5. Đóng dấu chứng nhận hợp lệ
                    UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                            userDetails, null, userDetails.getAuthorities()
                    );
                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                    // 6. Lưu vào ngữ cảnh để Controller có thể truy xuất
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                }
            }
        } catch (Exception ex) {
            logger.error("Không thể thiết lập xác thực người dùng trong security context", ex);
        }

        // 7. Cho phép luồng mạng đi tiếp
        filterChain.doFilter(request, response);
    }

    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
