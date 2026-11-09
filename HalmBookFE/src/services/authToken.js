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
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("role");
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("halm_customer_cache");
};

export const clearAdminAuthSession = () => {
    tokenPayloadCache.clear();
    sessionStorage.removeItem("admin_token");
    sessionStorage.removeItem("admin_role");
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_role");
};

export const getAuthToken = () => {
    const rawLocal = localStorage.getItem("token");
    const rawSession = sessionStorage.getItem("token");
    return normalizeJwtToken(rawLocal) ?? normalizeJwtToken(rawSession) ?? (rawLocal?.trim() || rawSession?.trim() || null);
};

export const getAdminAuthToken = () => {
    const rawLocal = localStorage.getItem("admin_token");
    const rawSession = sessionStorage.getItem("admin_token");
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
    localStorage.getItem("role") ??
    sessionStorage.getItem("role")
);

export const getAdminAuthRole = () => (
    localStorage.getItem("admin_role") ??
    sessionStorage.getItem("admin_role") ??
    localStorage.getItem("role") ??
    sessionStorage.getItem("role")
);

export const saveAdminAuthSession = (responseData) => {
    const candidate = responseData?.systemToken ?? responseData?.token ?? responseData?.accessToken;
    const token = normalizeJwtToken(candidate) || (typeof candidate === "string" ? candidate.trim() : null);

    if (!token) {
        throw new Error("Máy chủ không trả về JWT token hợp lệ cho Quản trị viên.");
    }

    localStorage.setItem("admin_token", token);
    sessionStorage.setItem("admin_token", token);

    const role = responseData?.role ?? "ADMIN";
    localStorage.setItem("admin_role", String(role).trim());
    sessionStorage.setItem("admin_role", String(role).trim());

    return token;
};

export const saveAuthSession = (responseData, { _remember = true } = {}) => {
    const candidate = responseData?.systemToken ?? responseData?.token ?? responseData?.accessToken;
    const token = normalizeJwtToken(candidate) || (typeof candidate === "string" ? candidate.trim() : null);

    if (!token) {
        throw new Error("Máy chủ không trả về JWT token hợp lệ.");
    }

    const role = responseData?.role ?? "USER";
    const normalizedRole = String(role).replace(/^ROLE_/, '').toUpperCase();

    // Nếu là tài khoản Quản trị viên, lưu vào phiên Admin riêng biệt để không làm hỏng phiên của Độc giả
    if (normalizedRole === 'ADMIN') {
        saveAdminAuthSession(responseData);
        return token;
    }

    // Tài khoản Độc giả: Lưu đồng bộ vào token chuẩn của Storefront
    localStorage.setItem("token", token);
    sessionStorage.setItem("token", token);
    localStorage.setItem("role", String(role).trim());
    sessionStorage.setItem("role", String(role).trim());

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

    // Không tự động clear session ở đây để tránh làm người dùng bị văng đột ngột
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
