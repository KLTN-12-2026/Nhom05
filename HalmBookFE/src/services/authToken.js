const JWT_PATTERN = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;

export const normalizeJwtToken = (value) => {
    if (typeof value !== "string") {
        return null;
    }

    const token = value.trim().replace(/^Bearer\s+/i, "");
    return JWT_PATTERN.test(token) ? token : null;
};

export const clearAuthSession = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("role");
    localStorage.removeItem("token");
    localStorage.removeItem("role");
};

export const getAuthToken = () => (
    normalizeJwtToken(sessionStorage.getItem("token")) ??
    normalizeJwtToken(localStorage.getItem("token"))
);

export const getAuthRole = () => (
    sessionStorage.getItem("role") ??
    localStorage.getItem("role")
);

export const saveAuthSession = (responseData, { remember = false } = {}) => {
    const candidate = responseData?.systemToken ?? responseData?.token ?? responseData?.accessToken;
    const token = normalizeJwtToken(candidate);

    if (!token) {
        clearAuthSession();
        throw new Error("Máy chủ không trả về JWT hợp lệ.");
    }

    clearAuthSession();
    const storage = remember ? localStorage : sessionStorage;
    storage.setItem("token", token);
    if (typeof responseData.role === "string" && responseData.role.trim()) {
        storage.setItem("role", responseData.role);
    }

    return token;
};
