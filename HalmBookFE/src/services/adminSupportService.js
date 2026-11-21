import axiosInstance from './axiosClient.js';
import { decodeJwtPayload, getAdminAuthToken } from './authToken.js';

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

// Keep an uncertain operation ID across retries/reloads, scoped to the signed-in admin.
const pendingBroadcasts = new Map();
export const broadcastNotification = async (payload) => {
  const token = getAdminAuthToken();
  const admin = token ? decodeJwtPayload(token)?.sub : null;
  if (!admin) throw new Error('Vui lòng đăng nhập lại tài khoản quản trị.');
  const body = { title: payload.title.trim(), message: payload.message.trim(), target: payload.target || 'all', destination: payload.destination || 'inbox' };
  const identity = JSON.stringify(body);
  const key = 'halm_pending_broadcast_' + encodeURIComponent(admin);
  let pending = pendingBroadcasts.get(key);
  try { pending = pending || JSON.parse(sessionStorage.getItem(key) || 'null'); } catch { /* Memory is sufficient for retries in this page. */ }
  if (!pending || pending.identity !== identity) pending = { identity, requestId: crypto.randomUUID() };
  pendingBroadcasts.set(key, pending);
  try { sessionStorage.setItem(key, JSON.stringify(pending)); } catch { /* Browser storage may be unavailable. */ }
  const response = await axiosInstance.post('/api/admin/support-tickets/broadcast', { ...body, requestId: pending.requestId }, { timeout: 60000 });
  const data = response.data;
  if (data?.success !== true || data.broadcastId !== pending.requestId || !Number.isSafeInteger(data.sentCount) || data.sentCount < 0) {
    throw new Error('Chưa xác nhận được kết quả gửi. Thử lại cùng nội dung để kiểm tra đợt gửi này.');
  }
  if (pendingBroadcasts.get(key)?.requestId === pending.requestId) {
    pendingBroadcasts.delete(key);
    try { sessionStorage.removeItem(key); } catch { /* Confirmed on the server. */ }
  }
  return data;
};
