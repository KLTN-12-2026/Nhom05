/**
 * Service: chatService.js
 * Quản lý gửi nhận tin nhắn với Linh vật Khoai Nhỏ AI (HALM.AI) và đồng bộ lịch sử hội thoại
 */

import axiosClient from './axiosClient';

export const sendChatMessage = async (message) => {
    try {
        const response = await axiosClient.post('/api/chat', { message });
        return response.data?.reply || response.data?.message || 'Khoai Nhỏ đã nhận được câu hỏi nhưng chưa có phản hồi.';
    } catch (error) {
        console.error('Lỗi gửi tin nhắn AI:', error);
        if (error.response?.status === 429) {
            return 'Khoai Nhỏ hơi mệt một xíu do nhiều bạn đọc hỏi quá cùng lúc. Bạn đọc đợi Khoai Nhỏ khoảng 20-30 giây rồi hỏi lại nhé! 🥔🌱';
        }
        return 'Khoai Nhỏ đang gặp chút trục trặc kết nối đến thư viện sách. Bạn đọc vui lòng thử lại sau giây lát nhé! 🥔';
    }
};

export const getChatHistory = async () => {
    try {
        const response = await axiosClient.get('/api/chat/history');
        return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
        // Khách vãng lai chưa đăng nhập có thể không có lịch sử
        return [];
    }
};
