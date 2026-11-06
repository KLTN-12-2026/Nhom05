import axiosClient from "./axiosClient";
import { API_ENDPOINTS } from "@/constants/apiEndpoints";

/**
 * ============================================================================
 * Service: orderService
 * Mô tả: Xử lý các yêu cầu liên quan đến Đơn hàng, Thanh toán thuê sách bằng Khoai
 *        và Tủ Sách Cá Nhân cho Frontend.
 * ============================================================================
 */

/**
 * Thanh toán thuê sách bằng Khoai Tây
 * @param {Object} checkoutData - { items, paymentMethod, couponCode, discountAmount }
 */
export const checkoutWithPotato = async (checkoutData) => {
    try {
        const response = await axiosClient.post(API_ENDPOINTS.CHECKOUT.PROCESS, checkoutData);
        const data = response.data;

        // Phát sự kiện toàn cục để Header, Giỏ hàng và Tủ sách cập nhật dữ liệu tự động
        window.dispatchEvent(new CustomEvent("halm-potato-updated", {
            detail: { potatoBalance: data.remainingPotatoBalance }
        }));
        window.dispatchEvent(new CustomEvent("halm-cart-updated"));
        window.dispatchEvent(new CustomEvent("halm-bookshelf-updated"));

        return data;
    } catch (error) {
        console.error("Lỗi khi thanh toán đơn thuê sách:", error);
        throw error;
    }
};

/**
 * Lấy danh sách các cuốn sách trong Tủ Sách Cá Nhân
 */
export const getCustomerBookshelf = async () => {
    try {
        const response = await axiosClient.get(API_ENDPOINTS.BOOKSHELF.LIST);
        return response.data;
    } catch (error) {
        console.error("Lỗi khi tải tủ sách cá nhân:", error);
        throw error;
    }
};

/**
 * Kiểm tra xem người dùng hiện tại có quyền đọc toàn bộ cuốn sách hay không
 * @param {string} bookId
 */
export const checkBookAccess = async (bookId) => {
    try {
        const response = await axiosClient.get(API_ENDPOINTS.BOOKSHELF.CHECK_ACCESS(bookId));
        return response.data?.hasAccess || false;
    } catch (error) {
        console.error("Lỗi khi kiểm tra quyền đọc sách:", error);
        return false;
    }
};
