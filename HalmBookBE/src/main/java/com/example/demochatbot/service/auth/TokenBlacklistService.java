package com.example.demochatbot.service.auth;

import org.springframework.stereotype.Service;

import java.util.concurrent.ConcurrentHashMap;

/**
 * ============================================================================
 * Service: TokenBlacklistService
 * Mô tả: Lưu trữ danh sách các JWT Token bị thu hồi (Blacklist) khi người dùng
 *        đăng xuất chủ động (Logout) (IMP-07).
 *
 * Lưu ý về kiến trúc:
 * - Hiện tại sử dụng cấu trúc ConcurrentHashMap in-memory (bộ nhớ cục bộ JVM)
 *   với cơ chế tự động dọn dẹp các token đã quá hạn tự nhiên (TTL cleanup).
 * - Phục vụ chuẩn mực cho môi trường single-instance. Khi mở rộng hệ thống
 *   sang multi-instance (load balanced), danh sách blacklist này có thể được
 *   chuyển tiếp sang Redis/Hazelcast với TTL tương ứng.
 * ============================================================================
 */
@Service
public class TokenBlacklistService {

    // Map lưu token -> thời điểm hết hạn (timestamp ms)
    private final ConcurrentHashMap<String, Long> blacklist = new ConcurrentHashMap<>();

    /**
     * Đưa token vào danh sách đen khi người dùng đăng xuất
     * @param token chuỗi JWT token
     * @param expirationTimeMs thời điểm hết hạn của token (ms). Nếu null, mặc định 24h từ hiện tại.
     */
    public void blacklistToken(String token, Long expirationTimeMs) {
        if (token != null && !token.isBlank()) {
            String cleanToken = token.trim().replaceFirst("^(?i)Bearer\\s+", "");
            long exp = (expirationTimeMs != null && expirationTimeMs > 0)
                    ? expirationTimeMs
                    : (System.currentTimeMillis() + 86400000L);
            blacklist.put(cleanToken, exp);
            cleanUpExpired();
        }
    }

    /**
     * Kiểm tra xem token có nằm trong danh sách đen hay không
     */
    public boolean isBlacklisted(String token) {
        if (token == null || token.isBlank()) return false;
        String cleanToken = token.trim().replaceFirst("^(?i)Bearer\\s+", "");
        Long exp = blacklist.get(cleanToken);
        if (exp == null) return false;
        if (System.currentTimeMillis() > exp) {
            blacklist.remove(cleanToken);
            return false;
        }
        return true;
    }

    /**
     * Dọn dẹp định kỳ các token đã quá hạn tự nhiên trong blacklist
     */
    private void cleanUpExpired() {
        long now = System.currentTimeMillis();
        blacklist.entrySet().removeIf(entry -> entry.getValue() < now);
    }
}
