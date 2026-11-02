import axiosClient from "./axiosClient";
import { API_ENDPOINTS } from "@/constants/apiEndpoints";

/**
 * ============================================================================
 * Service: potatoService
 * Mô tả: Cung cấp các hàm gọi API liên quan đến Ví Khoai Tây cho Frontend
 *        - Lấy thông tin ví và số dư Khoai thực tế
 *        - Lấy danh sách các gói nạp khả dụng
 *        - Lấy sổ cái lịch sử giao dịch biến động số dư
 *        - Nạp Khoai siêu tốc qua VietQR
 *        - Tặng Khoai cho bạn bè độc giả
 * ============================================================================
 */

/**
 * Lấy thông tin ví & số dư Khoai thực tế của người dùng hiện tại
 */
export const getWalletInfo = async () => {
    try {
        const response = await axiosClient.get(API_ENDPOINTS.POTATO.WALLET);
        return response.data;
    } catch (error) {
        console.error("Lỗi khi lấy thông tin ví khoai:", error);
        throw error;
    }
};

/**
 * Lấy danh sách gói nạp Khoai Tây
 */
export const getPotatoPackages = async () => {
    try {
        const response = await axiosClient.get(API_ENDPOINTS.POTATO.PACKAGES);
        return response.data;
    } catch (error) {
        console.error("Lỗi khi tải gói nạp khoai:", error);
        throw error;
    }
};

/**
 * Lấy danh sách lịch sử giao dịch biến động số dư Khoai
 */
export const getPotatoTransactions = async () => {
    try {
        const response = await axiosClient.get(API_ENDPOINTS.POTATO.TRANSACTIONS);
        return response.data;
    } catch (error) {
        console.error("Lỗi khi lấy lịch sử giao dịch khoai:", error);
        throw error;
    }
};

/**
 * Nạp Khoai siêu tốc (VietQR 24/7)
 * @param {Object} data - { packageId, amountMoney, note }
 */
export const topupPotato = async (data) => {
    try {
        const response = await axiosClient.post(API_ENDPOINTS.POTATO.TOPUP, data);
        // Phát sự kiện toàn cục để cập nhật số dư trên toàn bộ website (Header, Chi tiết sách, Giỏ hàng...)
        window.dispatchEvent(new CustomEvent("halm-potato-updated", { detail: response.data.wallet }));
        return response.data;
    } catch (error) {
        console.error("Lỗi khi thực hiện nạp khoai:", error);
        throw error;
    }
};

/**
 * Chuyển tặng Khoai cho độc giả khác
 * @param {Object} data - { receiver, amount, note }
 */
export const transferPotato = async (data) => {
    try {
        const response = await axiosClient.post(API_ENDPOINTS.POTATO.TRANSFER, data);
        // Phát sự kiện toàn cục để cập nhật số dư
        window.dispatchEvent(new CustomEvent("halm-potato-updated", { detail: response.data.wallet }));
        return response.data;
    } catch (error) {
        console.error("Lỗi khi tặng khoai:", error);
        throw error;
    }
};
