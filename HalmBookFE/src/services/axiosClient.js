import axios from "axios";
import { getValidAuthToken, getAdminAuthToken } from "./authToken";
import { API_BASE_URL } from "@/constants/apiEndpoints";

const axiosClient = axios.create({
    baseURL: API_BASE_URL || "http://localhost:8082"
});

axiosClient.interceptors.request.use((config) => {
    const url = config.url || "";
    const isAdminEndpoint = url.startsWith("/api/promotions") ||
                            url.startsWith("/api/admin") ||
                            (typeof window !== "undefined" && window.location.pathname.startsWith("/admin"));

    // Tách biệt Token: Request của Quản trị ưu tiên admin_token, request của Độc giả dùng token thường
    const token = isAdminEndpoint ? (getAdminAuthToken() || getValidAuthToken()) : getValidAuthToken();

    if (token) {
        config.headers.Authorization = "Bearer " + token;
    } else {
        delete config.headers.Authorization;
    }

    return config;
});

// Hàm hỗ trợ dispatch sự kiện tài khoản bị khóa (chỉ dành riêng cho phiên người dùng Độc giả)
const triggerAccountLockedEvent = (error) => {
    if (typeof window === "undefined") return;

    // Tuyệt đối không kích hoạt sự kiện khóa tài khoản nếu lỗi phát sinh từ thao tác quản trị của Admin
    const url = error?.config?.url || "";
    const isAdminEndpoint = url.startsWith("/api/promotions") ||
                            url.startsWith("/api/admin") ||
                            window.location.pathname.startsWith("/admin");
    if (isAdminEndpoint) return;

    const status = error.response?.status;
    const errCode = error.response?.data?.error;
    const errMsg = error.response?.data?.message;

    if (status === 423 || errCode === "ACCOUNT_LOCKED") {
        window.dispatchEvent(new CustomEvent("halm:account_locked", {
            detail: {
                message: errMsg || "Tài khoản của bạn đã bị khóa bởi Quản trị viên!"
            }
        }));
    }
};

axiosClient.interceptors.response.use(
    (response) => response,
    (error) => {
        triggerAccountLockedEvent(error);

        if (error.response?.status === 401) {
            const url = error.config?.url || "";
            const isAdminEndpoint = url.startsWith("/api/promotions") ||
                                    url.startsWith("/api/admin") ||
                                    (typeof window !== "undefined" && window.location.pathname.startsWith("/admin"));

            console.warn(`[Axios Interceptor] 401 Unauthorized (${isAdminEndpoint ? 'Admin' : 'User'}) tại:`, url);
        }
        return Promise.reject(error);
    }
);

// Gắn thêm vào axios gốc để phòng ngừa những nơi gọi trực tiếp axios.get / axios.post
axios.interceptors.response.use(
    (response) => response,
    (error) => {
        triggerAccountLockedEvent(error);
        return Promise.reject(error);
    }
);

export default axiosClient;
