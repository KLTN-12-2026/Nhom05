package com.example.demochatbot.config; // Hoặc package chứa cấu hình bảo mật của bạn

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

    // Tiêm "cỗ máy quét mã" của bạn vào đây
    private final JwtTokenProvider tokenProvider;
    // Cần UserDetailsService để tải thông tin user từ Database (hoặc bộ nhớ) dựa trên email
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

            // 2. Nếu có Token và Token hợp lệ (sử dụng hàm bạn đã viết)
            if (StringUtils.hasText(jwt) && tokenProvider.validateToken(jwt)) {

                // 3. Lấy email từ Token
                String email = tokenProvider.getEmailFromJWT(jwt);

                // 4. Đối chiếu với Database để lấy thông tin chi tiết (quyền hạn, trạng thái khóa...)
                UserDetails userDetails = userDetailsService.loadUserByUsername(email);

                // 5. Đóng dấu chứng nhận hợp lệ
                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                        userDetails, null, userDetails.getAuthorities()
                );
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                // 6. Lưu vào ngữ cảnh để các Controller (như ChatController) có thể gọi authentication.getName()
                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        } catch (Exception ex) {
            // Bắt lỗi không mong muốn để không làm sập luồng mạng
            logger.error("Không thể thiết lập xác thực người dùng trong security context", ex);
        }

        // 7. Cho phép luồng mạng đi tiếp
        filterChain.doFilter(request, response);
    }

    // Hàm phụ trợ để cắt bỏ chữ "Bearer " dư thừa
    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}