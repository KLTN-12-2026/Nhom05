import { apiUrl } from '../config/api.js';
import { readStorage, writeStorage } from '../utils/browserStorage.js';

export const normalizeJwtToken = (value) => {
    if (!value || typeof value !== "string") {
        return null;
    }

    let token = value.trim().replace(/^Bearer\s+/i, "");
    // Loại bỏ dấu ngoặc kép thừa nếu token bị JSON.stringify hoặc lưu dạng chuỗi bọc quote
    if ((token.startsWith('"') && token.endsWith('"')) || (token.startsWith("'") && token.endsWith("'"))) {
        token = token.slice(1, -1).trim();
    }

    // Một JWT token hợp lệ bắt buộc gồm đúng 3 phần header.payload.signature phân tách bằng dấu chấm
    const parts = token.split(".");
    if (parts.length === 3 && parts.every((p) => p.length > 0)) {
        return token;
    }

    return null;
};

const tokenPayloadCache = new Map();

export const clearAuthSession = () => {
    tokenPayloadCache.clear();
    writeStorage("token", null, false);
    writeStorage("role", null, false);
    writeStorage("token", null, true);
    writeStorage("role", null, true);
    writeStorage("halm_customer_cache", null, true);
    if (typeof window !== "undefined" && window.dispatchEvent) window.dispatchEvent(new Event("halm-auth-change"));
};

export const clearAdminAuthSession = () => {
    tokenPayloadCache.clear();
    writeStorage("admin_token", null, false);
    writeStorage("admin_role", null, false);
    writeStorage("admin_token", null, true);
    writeStorage("admin_role", null, true);
    writeStorage("admin_user", null, true);
    writeStorage("admin_user", null, false);
};

export const getAuthToken = () => {
    const rawLocal = readStorage("token", true);
    const rawSession = readStorage("token", false);
    return normalizeJwtToken(rawLocal) ?? normalizeJwtToken(rawSession) ?? (rawLocal?.trim() || rawSession?.trim() || null);
};

export const getAdminAuthToken = () => {
    const rawLocal = readStorage("admin_token", true);
    const rawSession = readStorage("admin_token", false);
    const adminToken = normalizeJwtToken(rawLocal) ?? normalizeJwtToken(rawSession) ?? (rawLocal?.trim() || rawSession?.trim() || null);
    if (adminToken) {
        return adminToken;
    }
    // Fallback nếu người dùng đăng nhập tài khoản admin nhưng được lưu ở token chung
    const generalRole = getAuthRole();
    if (generalRole?.replace(/^ROLE_/, '') === 'ADMIN') {
        return getAuthToken();
    }
    return adminToken;
};

export const getAuthRole = () => (
    readStorage("role", true) ??
    readStorage("role", false)
);

export const getAdminAuthRole = () => (
    readStorage("admin_role", true) ??
    readStorage("admin_role", false) ??
    readStorage("role", true) ??
    readStorage("role", false)
);

export const saveAdminAuthSession = (responseData, { remember = true } = {}) => {
    const candidate = responseData?.systemToken ?? responseData?.token ?? responseData?.accessToken;
    const token = normalizeJwtToken(candidate) || (typeof candidate === "string" ? candidate.trim() : null);

    if (!token) {
        throw new Error("Máy chủ không trả về JWT token hợp lệ cho Quản trị viên.");
    }

    writeStorage("admin_token", remember ? token : null, true);
    writeStorage("admin_token", token, false);

    const role = responseData?.role ?? "ADMIN";
    writeStorage("admin_role", remember ? String(role).trim() : null, true);
    writeStorage("admin_role", String(role).trim(), false);

    return token;
};

export const saveAuthSession = (responseData, { remember = true } = {}) => {
    const candidate = responseData?.systemToken ?? responseData?.token ?? responseData?.accessToken;
    const token = normalizeJwtToken(candidate) || (typeof candidate === "string" ? candidate.trim() : null);

    if (!token) {
        throw new Error("Máy chủ không trả về JWT token hợp lệ.");
    }

    const role = responseData?.role ?? "USER";
    const normalizedRole = String(role).replace(/^ROLE_/, '').toUpperCase();

    // Nếu là tài khoản Quản trị viên, lưu vào phiên Admin riêng biệt để không làm hỏng phiên của Độc giả
    if (normalizedRole === 'ADMIN') {
        saveAdminAuthSession(responseData, { remember });
        return token;
    }

    // Tài khoản Độc giả: Lưu đồng bộ vào token chuẩn của Storefront
    writeStorage("token", remember ? token : null, true);
    writeStorage("token", token, false);
    writeStorage("role", remember ? String(role).trim() : null, true);
    writeStorage("role", String(role).trim(), false);

    return token;
};

/**
 * ============================================================================
 * CÁC HÀM XỬ LÝ & KIỂM TRA HẠN SỬ DỤNG TOKEN (JWT EXPIRATION CHECK)
 * ============================================================================
 */

/**
 * Giải mã phần payload của JWT token mà không cần thư viện ngoài
 * @param {string} [value] - Chuỗi token JWT (mặc định lấy token đang lưu trong bộ nhớ)
 * @returns {object|null} Đối tượng payload chứa exp, sub, role, email... hoặc null nếu lỗi
 */
export const decodeJwtPayload = (value) => {
    try {
        const token = normalizeJwtToken(value || getAuthToken());
        if (!token) return null;
        if (tokenPayloadCache.has(token)) {
            return tokenPayloadCache.get(token);
        }
        const parts = token.split(".");
        if (parts.length !== 3) return null;

        // Chuyển Base64Url sang Base64 chuẩn
        let base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        while (base64.length % 4) {
            base64 += "=";
        }

        const rawBinary = atob(base64);
        let parsed = null;
        try {
            // Giải mã an toàn hỗ trợ ký tự UTF-8 tiếng Việt
            const jsonPayload = decodeURIComponent(
                rawBinary
                    .split("")
                    .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
                    .join("")
            );
            parsed = JSON.parse(jsonPayload);
        } catch {
            // Fallback parse chuỗi raw nhị phân nếu UTF-8 decode không khớp
            try {
                parsed = JSON.parse(rawBinary);
            } catch {
                parsed = null;
            }
        }

        if (parsed && typeof parsed === "object") {
            // Giới hạn kích thước cache để tránh rò rỉ bộ nhớ
            if (tokenPayloadCache.size > 20) {
                tokenPayloadCache.clear();
            }
            tokenPayloadCache.set(token, parsed);
            return parsed;
        }
        return null;
    } catch {
        return null;
    }
};

/**
 * Kiểm tra xem token hiện tại đã hết hạn sử dụng hay chưa
 * @param {string} [value] - JWT token cần kiểm tra (mặc định lấy từ storage)
 * @returns {boolean} true nếu token không tồn tại hoặc đã quá hạn exp rõ ràng
 */
export const isTokenExpired = (value) => {
    const raw = value || getAuthToken();
    if (!raw) return true;

    const token = normalizeJwtToken(raw);
    if (!token) return false; // Có chuỗi token nhưng khác định dạng chuẩn 3 phần, không tự tiện coi là expired

    const payload = decodeJwtPayload(token);
    if (!payload) return false; // Không parse được payload -> không tự ý coi là expired, để server xác thực

    // Nếu token có trường exp (thời điểm hết hạn theo chuẩn Unix timestamp tính bằng giây)
    if (typeof payload.exp === "number") {
        const currentSeconds = Math.floor(Date.now() / 1000);
        // Hết hạn nếu thời gian hiện tại lớn hơn exp
        return payload.exp <= currentSeconds;
    }

    // Trường hợp token không có trường exp (không giới hạn thời gian)
    return false;
};

/**
 * Kiểm tra token hiện tại có còn giá trị và còn hạn sử dụng hay không
 * @param {string} [value] - JWT token cần kiểm tra
 * @returns {boolean} true nếu hợp lệ và chưa hết hạn
 */
export const isTokenValid = (value) => {
    const raw = value || getAuthToken();
    if (!raw) return false;
    const token = normalizeJwtToken(raw);
    if (!token) return false;
    return !isTokenExpired(token);
};

/**
 * Lấy token hợp lệ. Nếu token đã hết hạn, xóa phiên an toàn và phát sự kiện halm-auth-expired
 * @returns {string|null} Chuỗi token nếu còn hạn, null nếu hết hạn hoặc không có
 */
export const getValidAuthToken = () => {
    const token = getAuthToken();
    if (!token) return null;

    if (isTokenExpired(token)) {
        return null;
    }
    return token;
};

/**
 * Lấy thời gian còn lại của token tính bằng giây
 * @param {string} [value]
 * @returns {number} Số giây còn lại (> 0) hoặc 0 nếu đã hết hạn
 */
export const getTokenRemainingSeconds = (value) => {
    const payload = decodeJwtPayload(value || getAuthToken());
    if (!payload || typeof payload.exp !== "number") return 0;
    const remaining = payload.exp - Math.floor(Date.now() / 1000);
    return remaining > 0 ? remaining : 0;
};

/**
 * Kiểm tra nhanh người dùng hiện tại đã đăng nhập hợp lệ hay chưa
 * @returns {boolean} true nếu đã đăng nhập và token còn hạn, false nếu là khách vãng lai
 */
export const isAuthenticated = () => {
    return isTokenValid();
};

/**
 * Đăng xuất người dùng Độc giả an toàn:
 * Gửi yêu cầu thu hồi Token lên Backend (Blacklist) và dọn dẹp Storage ở Client
 */
async function revokeSession(token, clear) {
    try {
        if (token) await fetch(apiUrl('/api/auth/logout'), {
            method: 'POST', headers: { Authorization: 'Bearer ' + token },
            signal: AbortSignal.timeout(10000),
        });
    } catch { /* Local logout must still complete when the server is unreachable. */ }
    finally { clear(); }
}

export const logoutUser = () => revokeSession(getAuthToken(), clearAuthSession);
export const logoutAdmin = () => revokeSession(getAdminAuthToken(), clearAdminAuthSession);
