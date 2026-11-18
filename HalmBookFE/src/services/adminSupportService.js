import axiosInstance from './axiosClient.js';

/**
 * adminSupportService.js
 * Quản trị Support Ticket & Phản hồi khiếu nại phía Admin
 */

export const getAdminTickets = async (params = {}) => {
  const response = await axiosInstance.get('/api/admin/support-tickets', { params });
  return response.data;
};

export const replyAdminTicket = async (ticketId, reply, status = 'resolved', requestId = crypto.randomUUID()) => {
  const response = await axiosInstance.post(`/api/admin/support-tickets/${ticketId}/reply`, {
    reply,
    status, requestId
  });
  return response.data;
};

export const updateAdminTicketStatus = async (ticketId, status) => {
  const response = await axiosInstance.put(`/api/admin/support-tickets/${ticketId}/status`, {
    status
  });
  return response.data;
};
