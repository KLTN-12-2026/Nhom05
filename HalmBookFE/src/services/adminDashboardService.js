import axiosInstance from './axiosClient';

/**
 * adminDashboardService.js
 * Cung cấp dữ liệu Tổng Quan Điều Hành Hệ Thống (Dashboard) cho Admin Portal
 */

export const getDashboardOverview = async (period = '1d') => {
  const response = await axiosInstance.get('/api/admin/analytics/dashboard', {
    params: { period }
  });
  return response.data;
};
