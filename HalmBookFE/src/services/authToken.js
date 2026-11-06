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

export const clearAuthSession = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("role");
    localStorage.removeItem("token");
    localStorage.removeItem("role");
};

export const getAuthToken = () => {
    const rawLocal = localStorage.getItem("token");
    const rawSession = sessionStorage.getItem("token");
    return normalizeJwtToken(rawLocal) ?? normalizeJwtToken(rawSession) ?? (rawLocal?.trim() || rawSession?.trim() || null);
};

export const getAuthRole = () => (
    localStorage.getItem("role") ??
    sessionStorage.getItem("role")
);

export const saveAuthSession = (responseData, { _remember = true } = {}) => {
    const candidate = responseData?.systemToken ?? responseData?.token ?? responseData?.accessToken;
    const token = normalizeJwtToken(candidate) || (typeof candidate === "string" ? candidate.trim() : null);

    if (!token) {
        throw new Error("Máy chủ không trả về JWT token hợp lệ.");
    }

    // Luôn lưu đồng bộ vào CẢ localStorage và sessionStorage để tuyệt đối không bị mất phiên khi mở tab mới hoặc reload
    localStorage.setItem("token", token);
    sessionStorage.setItem("token", token);

    const role = responseData?.role ?? "USER";
    if (typeof role === "string" && role.trim()) {
        localStorage.setItem("role", role.trim());
        sessionStorage.setItem("role", role.trim());
    }

    return token;
};
