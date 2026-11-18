import axiosInstance from './axiosClient.js';

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

export const sendTicketMessage = async (ticketId, message, senderName, requestId = crypto.randomUUID(), code) => {
  const response = await axiosInstance.post(`/api/user/support-tickets/${ticketId}/message`, {
    message,
    senderName, requestId, code
  });
  return response.data;
};

export const deleteSupportTicket = async (ticketId, code) => {
  const response = await axiosInstance.delete(`/api/user/support-tickets/${ticketId}`, {
    params: { code }
  });
  return response.data;
};
