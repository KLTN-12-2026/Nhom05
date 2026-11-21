/**
 * HALM BOOK - Global Toast Notification Dispatcher
 * Hệ thống thông báo tùy chỉnh phong cách Dark Luxury (Obsidian & Gold/Wine)
 * Thay thế hoàn toàn các thông báo mặc định của trình duyệt (window.alert).
 */

let toastListener = null;

export const registerToastHandler = (handler) => {
  toastListener = handler;
};

export const unregisterToastHandler = () => {
  toastListener = null;
};

export const halmToast = {
  show: (options) => {
    if (typeof options === 'string') {
      options = { message: options, type: 'info' };
    }
    const payload = {
      id: options.id || `toast-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      title: options.title || '',
      message: options.message || '',
      type: options.type || 'info', // 'success' | 'error' | 'warning' | 'info'
      duration: options.duration !== undefined ? options.duration : 3500,
      action: options.action || null, // { label: 'Xem ngay', onClick: () => {} }
    };

    if (typeof toastListener === 'function') {
      toastListener(payload);
    } else if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('halm-toast-notify', { detail: payload }));
    }
  },

  success: (titleOrMessage, message = '', options = {}) => {
    const title = message ? titleOrMessage : 'Thành công';
    const msg = message || titleOrMessage;
    halmToast.show({ ...options, title, message: msg, type: 'success' });
  },

  error: (titleOrMessage, message = '', options = {}) => {
    const title = message ? titleOrMessage : 'Thông báo lỗi';
    const msg = message || titleOrMessage;
    halmToast.show({ ...options, title, message: msg, type: 'error' });
  },

  warning: (titleOrMessage, message = '', options = {}) => {
    const title = message ? titleOrMessage : 'Cảnh báo';
    const msg = message || titleOrMessage;
    halmToast.show({ ...options, title, message: msg, type: 'warning' });
  },

  info: (titleOrMessage, message = '', options = {}) => {
    const title = message ? titleOrMessage : 'Thông tin';
    const msg = message || titleOrMessage;
    halmToast.show({ ...options, title, message: msg, type: 'info' });
  },
};

// Đăng ký toàn cục để các script thuần hoặc modal không dùng hook cũng có thể gọi
if (typeof window !== 'undefined') {
  window.halmToast = halmToast;
  // Hỗ trợ hàm showToast tương thích ngược: showToast(title, message, type) hoặc showToast(message, type)
  window.showToast = (a, b, c) => {
    if (c) {
      // 3 tham số: title, message, type
      halmToast.show({ title: a, message: b, type: c });
    } else if (b && (b === 'success' || b === 'error' || b === 'warning' || b === 'info')) {
      // 2 tham số: message, type
      halmToast.show({ title: '', message: a, type: b });
    } else if (b) {
      // 2 tham số: title, message (mặc định info hoặc success)
      halmToast.show({ title: a, message: b, type: 'info' });
    } else {
      // 1 tham số: message
      halmToast.show({ title: '', message: a, type: 'info' });
    }
  };
}

export default halmToast;
