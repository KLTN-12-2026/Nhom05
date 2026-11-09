import axiosInstance from './axiosClient';

/**
 * adminRentalService.js
 * Quản trị Giao dịch Thuê Sách & Phân Quyền Đọc cho Admin Portal
 */

export const getRentalSummary = async () => {
  const response = await axiosInstance.get('/api/admin/rentals/summary');
  return response.data;
};

export const getRentalList = async (params = {}) => {
  const response = await axiosInstance.get('/api/admin/rentals', {
    params
  });
  return response.data;
};

export const approveRental = async (id) => {
  const response = await axiosInstance.post(`/api/admin/rentals/${id}/approve`);
  return response.data;
};

export const rejectRental = async (id, reason) => {
  const response = await axiosInstance.post(`/api/admin/rentals/${id}/reject`, {
    reason
  });
  return response.data;
};

export const revokeRental = async (id) => {
  const response = await axiosInstance.post(`/api/admin/rentals/${id}/revoke`);
  return response.data;
};
