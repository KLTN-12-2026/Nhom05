import axios from "axios";
import { getAuthToken } from "./authToken";
import { API_BASE_URL } from "@/constants/apiEndpoints";

const axiosClient = axios.create({
    baseURL: API_BASE_URL || "http://localhost:8082"
});

axiosClient.interceptors.request.use((config) => {
    const token = getAuthToken();

    if (token) {
        config.headers.Authorization = "Bearer " + token;
    } else {
        delete config.headers.Authorization;
    }

    return config;
});

axiosClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            console.warn("Yêu cầu 401 Unauthorized tại:", error.config?.url);
        }
        return Promise.reject(error);
    }
);

export default axiosClient;
