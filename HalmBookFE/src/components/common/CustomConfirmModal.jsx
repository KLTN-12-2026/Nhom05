import React, { useState, useEffect, useCallback } from 'react';

let openConfirmFn = null;

/**
 * Hàm mở Custom Confirm Modal từ bất kỳ đâu (Component React hoặc Hàm JS thuần):
 * const confirmed = await confirmDialog({
 *   title: 'Khóa tài khoản',
 *   message: 'Bạn có chắc chắn muốn khóa tài khoản của độc giả này?',
 *   confirmText: 'Khóa tài khoản',
 *   cancelText: 'Hủy',
 *   type: 'danger' | 'warning' | 'info'
 * });
 */
export const confirmDialog = (options = {}) => {
  if (typeof openConfirmFn === 'function') {
    return openConfirmFn(options);
  }
  // Fallback an toàn nếu modal chưa mount
  return Promise.resolve(window.confirm(options.message || options.title || 'Bạn có chắc chắn muốn thực hiện?'));
};

if (typeof window !== 'undefined') {
  window.halmConfirm = confirmDialog;
}

export default function CustomConfirmModal() {
  const [config, setConfig] = useState(null);
  const [resolver, setResolver] = useState(null);

  useEffect(() => {
    openConfirmFn = (options) => {
      return new Promise((resolve) => {
        setConfig({
          title: options.title || 'Xác nhận hành động',
          message: options.message || 'Bạn có chắc chắn muốn thực hiện hành động này?',
          confirmText: options.confirmText || 'Xác nhận',
          cancelText: options.cancelText || 'Hủy bỏ',
          type: options.type || 'warning', // 'danger' | 'warning' | 'info'
          icon: options.icon || null,
        });
        setResolver(() => resolve);
      });
    };

    return () => {
      openConfirmFn = null;
    };
  }, []);

  const handleClose = useCallback((result) => {
    if (resolver) {
      resolver(result);
    }
    setConfig(null);
    setResolver(null);
  }, [resolver]);

  // Lắng nghe phím Escape để hủy
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && config) {
        handleClose(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [config, handleClose]);

  if (!config) return null;

  const isDanger = config.type === 'danger';
  const isInfo = config.type === 'info';

  let iconClass = 'fa-solid fa-triangle-exclamation text-[#F5D061]';
  let iconBg = 'bg-[#D4AF37]/15 border-[#D4AF37]/35 text-[#F5D061]';
  let confirmBtnClass = 'bg-[#D4AF37] hover:bg-[#C59B27] text-[#141412] font-black border border-[#D4AF37]/50 shadow-md';

  if (isDanger) {
    iconClass = 'fa-solid fa-triangle-exclamation text-rose-400';
    iconBg = 'bg-rose-500/15 border-rose-500/35 text-rose-400';
    confirmBtnClass = 'bg-rose-600 hover:bg-rose-700 text-white font-bold border border-rose-500/40 shadow-md';
  } else if (isInfo) {
    iconClass = 'fa-solid fa-circle-info text-sky-400';
    iconBg = 'bg-sky-500/15 border-sky-500/35 text-sky-400';
    confirmBtnClass = 'bg-sky-600 hover:bg-sky-700 text-white font-bold border border-sky-500/40 shadow-md';
  }

  if (config.icon) {
    iconClass = config.icon;
  }

  return (
    <div
      className="fixed inset-0 z-[999990] bg-black/75 backdrop-blur-md flex items-center justify-center p-4 select-none animate-in fade-in duration-150"
      onClick={() => handleClose(false)}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-md bg-[#181916] border border-[#2C2E29] rounded-3xl p-6 sm:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.85)] text-[#FAF7F0] animate-in zoom-in-95 duration-150 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className={`w-12 h-12 rounded-2xl border ${iconBg} flex items-center justify-center shrink-0 text-xl shadow-xs`}>
            <i className={iconClass}></i>
          </div>

          {/* Nội dung */}
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-[#FAF7F0] leading-snug">
              {config.title}
            </h3>
            <p className="text-xs sm:text-sm text-[#C5C2BA] mt-1.5 leading-relaxed">
              {config.message}
            </p>
          </div>
        </div>

        {/* Nút hành động */}
        <div className="flex items-center justify-end gap-2.5 mt-6 pt-4 border-t border-[#2C2E29]">
          <button
            type="button"
            onClick={() => handleClose(false)}
            className="px-4 py-2 rounded-xl border border-[#3E4237] bg-[#222420] hover:bg-[#2A2C26] text-[#D1CEC7] hover:text-[#FAF7F0] font-semibold text-xs transition cursor-pointer active:scale-95"
          >
            {config.cancelText}
          </button>
          <button
            type="button"
            onClick={() => handleClose(true)}
            className={`px-4 py-2 rounded-xl text-xs transition cursor-pointer active:scale-95 flex items-center gap-1.5 ${confirmBtnClass}`}
          >
            <span>{config.confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
