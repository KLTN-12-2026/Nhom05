import React, { useState, useEffect, useCallback } from 'react';
import { registerToastHandler, unregisterToastHandler } from '@/utils/toast';

export default function GlobalToastNotification() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    setToasts((prev) => [...prev, toast]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    registerToastHandler(addToast);

    const handleCustomEvent = (e) => {
      if (e?.detail) {
        addToast(e.detail);
      }
    };
    window.addEventListener('halm-toast-notify', handleCustomEvent);

    return () => {
      unregisterToastHandler();
      window.removeEventListener('halm-toast-notify', handleCustomEvent);
    };
  }, [addToast]);

  return (
    <div
      aria-live="polite"
      className="fixed top-5 right-5 z-[999999] flex flex-col gap-3 pointer-events-none w-[92%] sm:w-auto max-w-[420px]"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onRemove }) {
  const [isExiting, setIsExiting] = useState(false);

  const handleClose = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      onRemove();
    }, 250);
  }, [onRemove]);

  useEffect(() => {
    const duration = toast.duration || 3500;
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [toast.duration, handleClose]);

  const typeConfig = {
    success: {
      borderAccent: 'border-l-emerald-500',
      iconClass: 'ph-fill ph-check-circle text-emerald-400',
      iconBg: 'bg-emerald-500/15 border border-emerald-500/30',
      defaultTitle: 'Thành công',
    },
    error: {
      borderAccent: 'border-l-rose-500',
      iconClass: 'ph-fill ph-warning-circle text-rose-400',
      iconBg: 'bg-rose-500/15 border border-rose-500/30',
      defaultTitle: 'Đã xảy ra lỗi',
    },
    warning: {
      borderAccent: 'border-l-[#D4AF37]',
      iconClass: 'ph-fill ph-warning text-[#F5D061]',
      iconBg: 'bg-[#D4AF37]/15 border border-[#D4AF37]/35',
      defaultTitle: 'Lưu ý',
    },
    info: {
      borderAccent: 'border-l-sky-500',
      iconClass: 'ph-fill ph-info text-sky-400',
      iconBg: 'bg-sky-500/15 border border-sky-500/30',
      defaultTitle: 'Thông tin',
    },
  }[toast.type || 'info'] || {
    borderAccent: 'border-l-[#D4AF37]',
    iconClass: 'ph-fill ph-sparkle text-[#F5D061]',
    iconBg: 'bg-[#D4AF37]/15 border border-[#D4AF37]/35',
    defaultTitle: 'Thông báo',
  };

  const title = toast.title || typeConfig.defaultTitle;

  return (
    <div
      className={`pointer-events-auto relative overflow-hidden rounded-2xl bg-[#181916]/95 border border-[#2C2E29] border-l-[5px] ${typeConfig.borderAccent} p-4 shadow-[0_16px_40px_rgba(0,0,0,0.7)] backdrop-blur-xl transition-all duration-300 ease-out select-none ${
        isExiting
          ? 'opacity-0 translate-x-8 scale-95'
          : 'opacity-100 translate-x-0 scale-100 animate-in slide-in-from-top-3'
      }`}
      role="alert"
    >
      <div className="flex items-start gap-3.5">
        {/* Icon huy hiệu sang trọng */}
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl shadow-xs ${typeConfig.iconBg}`}
        >
          <i className={typeConfig.iconClass}></i>
        </div>

        {/* Nội dung thông báo */}
        <div className="flex-1 min-w-0 pr-1">
          {title && (
            <h4 className="font-outfit font-black text-sm text-[#FAF7F0] tracking-tight mb-0.5 leading-snug">
              {title}
            </h4>
          )}
          <p className="font-metadata text-xs text-[#C5C2BA] leading-relaxed break-words">
            {toast.message}
          </p>

          {/* Nút hành động bổ sung (nếu có) */}
          {toast.action && (
            <div className="mt-2.5">
              <button
                type="button"
                onClick={() => {
                  if (typeof toast.action.onClick === 'function') {
                    toast.action.onClick();
                  }
                  handleClose();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#252822] hover:bg-[#2F322A] border border-[#3E4237] text-xs font-black text-[#F5D061] transition-all cursor-pointer active:scale-95 shadow-xs"
              >
                <span>{toast.action.label}</span>
                <i className="ph-bold ph-arrow-right text-[11px]"></i>
              </button>
            </div>
          )}
        </div>

        {/* Nút đóng thông báo */}
        <button
          type="button"
          onClick={handleClose}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[#7A7871] hover:text-[#FAF7F0] hover:bg-white/10 transition cursor-pointer"
          aria-label="Đóng thông báo"
        >
          <i className="ph-bold ph-x text-sm"></i>
        </button>
      </div>

      {/* Thanh chạy tiến trình tự biến mất */}
      {toast.duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-white/5 overflow-hidden">
          <div
            className={`h-full ${
              toast.type === 'success'
                ? 'bg-emerald-500'
                : toast.type === 'error'
                ? 'bg-rose-500'
                : toast.type === 'warning'
                ? 'bg-[#D4AF37]'
                : 'bg-sky-500'
            }`}
            style={{
              animation: `toastProgress ${toast.duration}ms linear forwards`,
            }}
          />
        </div>
      )}

      <style>{`
        @keyframes toastProgress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}
