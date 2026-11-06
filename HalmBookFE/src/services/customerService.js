import axiosClient from "./axiosClient";
import { API_ENDPOINTS } from "@/constants/apiEndpoints";

const handleError = (error) => {
    if (error.response) {
        console.warn("Lỗi API Khách Hàng:", error.response.status, error.response.data);
        throw new Error(error.response.data?.message || `Lỗi HTTP : ${error.response.status}`);
    } else if (error.request) {
        console.error("No response received:", error.request);
        throw new Error("Không nhận được phản hồi từ Server.");
    } else {
        console.error("Error:", error.message);
        throw new Error("Lỗi trong quá trình thiết lập yêu cầu.");
    }
};

export const getCurrentCustomer = async () => {
    try {
        const response = await axiosClient.get(API_ENDPOINTS.CUSTOMER.INFO);
        return response.data;
    } catch (error) {
        handleError(error);
        return null; 
    }
};

export const updateCustomer = async (customerDetails) => {
    try {
        const response = await axiosClient.put(API_ENDPOINTS.CUSTOMER.EDIT, customerDetails);
        return response.data;
    } catch (error) {
        handleError(error);
        throw error;
    }
};

export const changePassword = async ({ oldPassword, newPassword, confirmPassword }) => {
    try {
        const response = await axiosClient.post(API_ENDPOINTS.CUSTOMER.CHANGE_PASSWORD, {
            oldPassword,
            newPassword,
            confirmPassword
        });
        return response.data;
    } catch (error) {
        handleError(error);
        throw error;
    }
};
