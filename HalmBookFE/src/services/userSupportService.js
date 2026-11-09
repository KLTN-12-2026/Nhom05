import axiosInstance from './axiosClient';

/**
 * userSupportService.js
 * Gửi khiếu nại & yêu cầu hỗ trợ qua RabbitMQ từ phía người dùng
 */

export const submitSupportTicket = async (ticketData) => {
  const response = await axiosInstance.post('/api/user/support-tickets', ticketData);
  return response.data;
};

export const getMySupportTickets = async (params = {}) => {
  const response = await axiosInstance.get('/api/user/support-tickets/my-tickets', { params });
  return response.data;
};

export const sendTicketMessage = async (ticketId, message, senderName) => {
  const response = await axiosInstance.post(`/api/user/support-tickets/${ticketId}/message`, {
    message,
    senderName
  });
  return response.data;
};
