/**
 * customExport.js
 * Dịch vụ điều khiển Custom Export Modal dùng chung cho toàn bộ HALMBOOK
 * Hỗ trợ xuất file Excel (.csv/UTF-8 BOM) và Báo cáo PDF chuyên nghiệp
 */

let exportModalHandler = null;

export const registerExportModalHandler = (handler) => {
  exportModalHandler = handler;
};

export const unregisterExportModalHandler = () => {
  exportModalHandler = null;
};

/**
 * Mở modal xuất file từ bất kỳ đâu (Component React hoặc mã JS cũ)
 * @param {Object} options Cấu hình xuất file
 * @returns {Promise<Object|null>} Trả về config xuất nếu thành công, null nếu hủy
 */
export const openCustomExportModal = (options = {}) => {
  if (typeof exportModalHandler === 'function') {
    return exportModalHandler(options);
  }

  // Fallback nếu modal chưa mount: xuất mặc định
  console.warn('CustomExportModal chưa được mount. Sử dụng fallback trực tiếp.');
  const defaultCols = (options.columns || []).map((c) => c.key);
  if (typeof options.onExport === 'function') {
    options.onExport({
      format: options.defaultFormat || 'excel',
      scope: 'filtered',
      selectedColumns: defaultCols,
      filename: options.defaultFilename || 'HALMBOOK_Export.csv',
    });
  }
  return Promise.resolve({
    format: options.defaultFormat || 'excel',
    scope: 'filtered',
    selectedColumns: defaultCols,
  });
};

// Gắn toàn cục cho cả React và mã Legacy Admin
if (typeof window !== 'undefined') {
  window.halmExportDialog = openCustomExportModal;
  if (!window.AdminUI) window.AdminUI = {};
  window.AdminUI.showExportModal = openCustomExportModal;
}
