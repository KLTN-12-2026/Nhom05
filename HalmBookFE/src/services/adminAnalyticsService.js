import axiosInstance from './axiosClient';

/**
 * adminAnalyticsService.js
 * Cung cấp dữ liệu Báo Cáo & Thống Kê Phân Tích Chuyên Sâu cho Admin Portal
 */

export const getAnalyticsOverview = async (period = 'month') => {
  const response = await axiosInstance.get('/api/admin/analytics/overview', {
    params: { period }
  });
  return response.data;
};
