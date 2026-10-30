/**
 * Định dạng số tiền sang định dạng VNĐ (ví dụ: 120.000 đ)
 */
export const formatCurrency = (amount) => {
  if (amount == null || isNaN(amount)) return '0 đ';
  return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
};

/**
 * Định dạng số Khoai (ví dụ: 1,500 Khoai)
 */
export const formatPotato = (amount) => {
  if (amount == null || isNaN(amount)) return '0 Khoai';
  return new Intl.NumberFormat('vi-VN').format(amount) + ' Khoai';
};

/**
 * Định dạng ngày theo chuẩn Việt Nam (DD/MM/YYYY)
 */
export const formatDateVN = (dateInput) => {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

/**
 * Định dạng ngày cho ô input HTML type="date" (YYYY-MM-DD)
 */
export const formatDateForInput = (dateVal) => {
  if (!dateVal) return '';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
  } catch {
    return '';
  }
};
