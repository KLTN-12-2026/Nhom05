import axiosInstance from './axiosClient';

/**
 * adminFinanceService.js
 * Quản trị Tài chính & Dòng tiền cho Admin Portal
 */

export const getFinanceSummary = async (period = '7d') => {
  const response = await axiosInstance.get('/api/admin/finance/summary', {
    params: { period }
  });
  return response.data;
};

export const getFinanceTransactions = async (params = {}) => {
  const response = await axiosInstance.get('/api/admin/finance/transactions', {
    params
  });
  return response.data;
};

export const approveFinanceTransaction = async (id) => {
  const response = await axiosInstance.post(`/api/admin/finance/transactions/${id}/approve`);
  return response.data;
};

export const rejectFinanceTransaction = async (id, reason) => {
  const response = await axiosInstance.post(`/api/admin/finance/transactions/${id}/reject`, {
    reason
  });
  return response.data;
};
