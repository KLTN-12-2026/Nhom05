import axiosClient from "./axiosClient";
import { API_ENDPOINTS } from "@/constants/apiEndpoints";

/**
 * ============================================================================
 * Service: tierService
 * Mô tả: Cung cấp các API liên quan đến Hạng Thành Viên & Điểm cày (XP) độc giả
 *        - Lấy danh sách 4 cấp bậc thành viên kèm quyền lợi chi tiết
 *        - Lấy lộ trình thăng hạng, điểm XP, chuỗi ngày streak thực tế của user
 *        - Điểm danh hằng ngày tích lũy chuỗi streak và cộng điểm cày
 * ============================================================================
 */

/**
 * Lấy danh sách toàn bộ các hạng thành viên
 */
export const getAllTiers = async () => {
    try {
        const response = await axiosClient.get(API_ENDPOINTS.MEMBERSHIP.TIERS);
        return response.data;
    } catch (error) {
        console.error("Lỗi khi tải danh sách hạng thành viên:", error);
        throw error;
    }
};

/**
 * Lấy thông tin cấp bậc, điểm cày (XP) và lộ trình thăng hạng của người dùng đăng nhập
 */
export const getMyTierSummary = async () => {
    try {
        const response = await axiosClient.get(API_ENDPOINTS.MEMBERSHIP.MY_TIER);
        return response.data;
    } catch (error) {
        console.error("Lỗi khi lấy thông tin hạng thành viên của tôi:", error);
        throw error;
    }
};

/**
 * Điểm danh hằng ngày: duy trì chuỗi ngày đọc sách, nhận Khoai & điểm XP
 */
export const checkinDailyStreak = async () => {
    try {
        const response = await axiosClient.post(API_ENDPOINTS.MEMBERSHIP.CHECKIN_STREAK);
        return response.data;
    } catch (error) {
        console.error("Lỗi khi thực hiện điểm danh:", error);
        throw error;
    }
};
