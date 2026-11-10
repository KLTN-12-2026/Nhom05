import React, { useState, useEffect } from 'react';

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

  const handleClose = (result) => {
    if (resolver) {
      resolver(result);
    }
    setConfig(null);
    setResolver(null);
  };

  // Lắng nghe phím Escape để hủy
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && config) {
        handleClose(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [config, resolver]);

  if (!config) return null;

  const isDanger = config.type === 'danger';
  const isInfo = config.type === 'info';

  let iconClass = 'fa-solid fa-triangle-exclamation text-amber-600 dark:text-amber-400';
  let iconBg = 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60';
  let confirmBtnClass = 'bg-amber-600 hover:bg-amber-700 text-white';

  if (isDanger) {
    iconClass = 'fa-solid fa-user-lock text-rose-600 dark:text-rose-400';
    iconBg = 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60';
    confirmBtnClass = 'bg-rose-600 hover:bg-rose-700 text-white';
  } else if (isInfo) {
    iconClass = 'fa-solid fa-circle-info text-sky-600 dark:text-sky-400';
    iconBg = 'bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800/60';
    confirmBtnClass = 'bg-sky-600 hover:bg-sky-700 text-white';
  }

  if (config.icon) {
    iconClass = config.icon;
  }

  return (
    <div
      className="fixed inset-0 z-[999990] bg-stone-900/50 dark:bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 select-none animate-in fade-in duration-150"
      onClick={() => handleClose(false)}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-md bg-white dark:bg-[#1E201B] border border-stone-200 dark:border-[#33372C] rounded-2xl p-6 shadow-2xl text-stone-800 dark:text-[#FAF7F0] animate-in zoom-in-95 duration-150 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className={`w-12 h-12 rounded-xl border ${iconBg} flex items-center justify-center shrink-0 shadow-xs`}>
            <i className={`${iconClass} text-xl`}></i>
          </div>

          {/* Nội dung */}
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 leading-snug">
              {config.title}
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 mt-1.5 leading-relaxed">
              {config.message}
            </p>
          </div>
        </div>

        {/* Nút hành động */}
        <div className="flex items-center justify-end gap-2.5 mt-6 pt-4 border-t border-stone-100 dark:border-stone-800/80">
          <button
            type="button"
            onClick={() => handleClose(false)}
            className="px-4 py-2 rounded-xl border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 font-semibold text-xs transition cursor-pointer active:scale-95"
          >
            {config.cancelText}
          </button>
          <button
            type="button"
            onClick={() => handleClose(true)}
            className={`px-4 py-2 rounded-xl font-semibold text-xs shadow-xs transition cursor-pointer active:scale-95 flex items-center gap-1.5 ${confirmBtnClass}`}
          >
            <span>{config.confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
