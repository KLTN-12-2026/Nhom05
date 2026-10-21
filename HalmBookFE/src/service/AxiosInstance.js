import axios from "axios";
import { clearAuthSession, getAuthToken, normalizeJwtToken } from "./AuthToken";

const API_BASE_URL = "http://localhost:8082"; 
const PUBLIC_ENDPOINTS = new Set([
    "/api/auth/login",
    "/api/auth/register",
    "/api/auth/google",
    "/api/auth/facebook",
    "/api/password/send-otp",
    "/api/password/verify-otp",
    "/api/password/reset-password",
]);

const axiosInstance = axios.create({
    baseURL: API_BASE_URL
});

axiosInstance.interceptors.request.use((config) => {
    const sessionToken = sessionStorage.getItem("token");
    const localToken = localStorage.getItem("token");
    const token = getAuthToken();

    if (token) {
        config.headers.Authorization = "Bearer " + token;
    } else {
        if (sessionToken || localToken) {
            clearAuthSession();
            console.warn("Đã xóa token JWT không hợp lệ khỏi phiên đăng nhập.");
        }
        delete config.headers.Authorization;
    }

    return config;
});

axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        const requestUrl = (error.config?.url ?? "").split("?")[0].replace(/\/$/, "");
        const requestToken = normalizeJwtToken(error.config?.headers?.Authorization);
        const currentToken = getAuthToken();

        if (
            error.response?.status === 401 &&
            !PUBLIC_ENDPOINTS.has(requestUrl) &&
            requestToken &&
            requestToken === currentToken
        ) {
            clearAuthSession();
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;