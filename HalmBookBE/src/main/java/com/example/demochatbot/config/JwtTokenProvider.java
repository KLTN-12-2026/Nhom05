package com.example.demochatbot.config;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;

@Component
public class JwtTokenProvider {
    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration}")
    private int jwtExpirationMs;

    private Key getSigningKey() {
        // Đảm bảo mã hóa chuỗi khóa bí mật bằng UTF-8 nhất quán trên mọi môi trường
        byte[] keyBytes = jwtSecret.getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    /**
     * Sinh JWT Token mang username (hoặc email) và quyền hạn (role)
     * @param subject username hoặc email của tài khoản
     * @param role quyền hạn người dùng (ví dụ: USER, ADMIN)
     * @return chuỗi JWT hoàn chỉnh dạng header.payload.signature
     */
    public String generateToken(String subject, String role) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationMs);

        return Jwts.builder()
                .setSubject(subject) // Dùng Username/Email làm Subject chính
                .claim("role", role) // Nhét thêm role vào claims
                .setIssuedAt(now) // Thời gian tạo
                .setExpiration(expiryDate) // Thời gian hết hạn
                .signWith(getSigningKey(), SignatureAlgorithm.HS512) // Ký bằng HS512
                .compact();
    }

    public boolean validateToken(String authToken) {
        try {
            Jwts.parserBuilder().setSigningKey(getSigningKey()).build().parseClaimsJws(authToken);
            return true;
        } catch (MalformedJwtException ex) {
            System.err.println("Token JWT bị sai định dạng hoặc bị giả mạo.");
        } catch (ExpiredJwtException ex) {
            System.err.println("Token JWT đã hết hạn.");
        } catch (UnsupportedJwtException ex) {
            System.err.println("Token JWT không được hệ thống hỗ trợ.");
        } catch (IllegalArgumentException ex) {
            System.err.println("Chuỗi Token JWT bị trống.");
        }
        return false;
    }

    /**
     * Trích xuất Subject (Username hoặc Email) từ chuỗi JWT đã ký
     */
    public String getEmailFromJWT(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();

        return claims.getSubject();
    }

    public String getUsernameFromJWT(String token) {
        return getEmailFromJWT(token);
    }
}
