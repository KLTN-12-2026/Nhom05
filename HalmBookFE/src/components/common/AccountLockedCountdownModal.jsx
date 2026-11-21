import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { isTokenValid, getValidAuthToken, clearAuthSession } from '@/services/authToken';
import { API_BASE_URL } from '@/constants/apiEndpoints';

const CHECK_INTERVAL_MS = 4000; // Kiểm tra định kỳ mỗi 4 giây
const COUNTDOWN_SECONDS = 10;   // Đếm ngược 10 giây trước khi về trang chủ

export default function AccountLockedCountdownModal() {
  const [isLocked, setIsLocked] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [lockMessage, setLockMessage] = useState('Tài khoản của bạn đã bị tạm khóa bởi ban quản trị.');
  const [lockedNoticeToast, setLockedNoticeToast] = useState(false);
  const countdownIntervalRef = useRef(null);
  const isLockedRef = useRef(false);

  // Kiểm tra nếu đang ở khu vực quản trị Admin thì tuyệt đối không kích hoạt
  const isCurrentlyInAdmin = () => {
    if (typeof window === 'undefined') return true;
    return window.location.pathname.startsWith('/admin');
  };

  // 1. Kiểm tra URL query param khi người dùng vừa bị điều hướng về trang chủ do bị khóa
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('account_locked') === '1' || searchParams.get('reason') === 'account_locked') {
      setLockedNoticeToast(true);
      // Xóa query param để thanh địa chỉ URL luôn sạch đẹp
      const url = new URL(window.location.href);
      url.searchParams.delete('account_locked');
      url.searchParams.delete('reason');
      window.history.replaceState({}, document.title, url.pathname + (url.search ? url.search : ''));
      
      const timer = setTimeout(() => {
        setLockedNoticeToast(false);
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, []);

  // 2. Hàm xử lý đăng xuất an toàn và điều hướng về TRANG CHỦ KHÁCH (/)
  const handleReturnHome = useCallback(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
    // Xóa toàn bộ dữ liệu phiên của user độc giả
    clearAuthSession();
    try {
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      localStorage.removeItem('role');
      sessionStorage.removeItem('role');
      localStorage.removeItem('halm_auth_user');
      localStorage.removeItem('halm_customer_cache');
    } catch (_) {}

    // Điều hướng về Trang Chủ Khách (/) kèm cờ báo khóa
    window.location.assign('/?account_locked=1');
  }, []);

  // 3. Hàm kích hoạt Modal khóa tài khoản & bắt đầu đếm ngược 10s
  const triggerLock = useCallback((customMsg) => {
    // Không bao giờ kích hoạt trên giao diện Admin
    if (isCurrentlyInAdmin()) return;
    if (isLockedRef.current) return;

    isLockedRef.current = true;
    setIsLocked(true);
    setCountdown(COUNTDOWN_SECONDS);
    if (customMsg && typeof customMsg === 'string') {
      setLockMessage(customMsg);
    }

    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownIntervalRef.current);
          handleReturnHome();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [handleReturnHome]);

  // 4. Lắng nghe CustomEvent từ Axios Interceptor (chỉ phía User)
  useEffect(() => {
    const handleAccountLockedEvent = (e) => {
      if (isCurrentlyInAdmin()) return;
      const msg = e?.detail?.message;
      triggerLock(msg);
    };

    window.addEventListener('halm:account_locked', handleAccountLockedEvent);
    return () => {
      window.removeEventListener('halm:account_locked', handleAccountLockedEvent);
    };
  }, [triggerLock]);

  // 5. Heartbeat Polling định kỳ kiểm tra trạng thái tài khoản (chỉ chạy ở phía User)
  useEffect(() => {
    if (isCurrentlyInAdmin()) return;

    const checkStatus = async () => {
      if (isCurrentlyInAdmin()) return;
      if (isLockedRef.current) return;
      if (!isTokenValid()) return;

      const token = getValidAuthToken();
      if (!token) return;

      try {
        const res = await axios.get(`${API_BASE_URL}/api/auth/check-status`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Cache-Control': 'no-cache',
          },
        });

        if (res.data?.isLocked) {
          triggerLock('Tài khoản của bạn đã bị tạm khóa bởi ban quản trị.');
        }
      } catch (err) {
        if (isCurrentlyInAdmin()) return;
        const status = err.response?.status;
        const errCode = err.response?.data?.error;
        const errMsg = err.response?.data?.message;

        if (status === 423 || errCode === 'ACCOUNT_LOCKED') {
          triggerLock(errMsg || 'Tài khoản của bạn đã bị tạm khóa bởi ban quản trị.');
        }
      }
    };

    const timeoutId = setTimeout(checkStatus, 1000);
    const intervalId = setInterval(checkStatus, CHECK_INTERVAL_MS);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [triggerLock]);

  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);

  const progressPercent = Math.max(0, Math.min(100, (countdown / COUNTDOWN_SECONDS) * 100));

  return (
    <>
      {/* Toast thông báo nổi thanh lịch khi về lại Trang chủ khách */}
      {lockedNoticeToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[999999] max-w-lg w-[92%] sm:w-auto bg-[#181916] border border-[#D4AF37]/40 shadow-2xl rounded-2xl p-4 flex items-center gap-3.5 animate-in slide-in-from-top-4 duration-300 text-[#FAF7F0]">
          <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/35 flex items-center justify-center text-[#F5D061] shrink-0">
            <i className="fa-solid fa-user-lock text-base"></i>
          </div>
          <div className="flex-1 min-w-0 pr-1">
            <div className="text-xs font-bold text-[#FAF7F0] uppercase tracking-wide">
              Thông Báo Khóa Tài Khoản
            </div>
            <div className="text-xs text-[#C5C2BA] mt-0.5 leading-relaxed">
              Tài khoản hiện đang bị khóa, vui lòng gọi hotline <span className="font-bold text-[#F5D061]">1900 6868</span> để được hỗ trợ.
            </div>
          </div>
          <button
            type="button"
            onClick={() => setLockedNoticeToast(false)}
            className="w-7 h-7 rounded-lg hover:bg-[#20221E] text-[#96938B] hover:text-[#EDE9DF] flex items-center justify-center text-xs transition cursor-pointer shrink-0 border border-transparent hover:border-[#2C2E29]"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
      )}

      {/* Modal Đếm ngược 10s (chỉ hiển thị phía User khi bị Admin khóa) */}
      {!isCurrentlyInAdmin() && isLocked && (
        <div
          className="fixed inset-0 z-[999999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-md bg-[#181916] border border-[#2C2E29] rounded-3xl p-6 sm:p-7 text-center shadow-[0_20px_50px_rgba(0,0,0,0.85)] text-[#FAF7F0] overflow-hidden">
            
            {/* Biểu tượng ổ khóa màu hổ phách nhã nhặn */}
            <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/35 flex items-center justify-center shadow-xs">
              <i className="fa-solid fa-user-lock text-[#F5D061] text-2xl"></i>
            </div>

            {/* Tiêu đề thông báo */}
            <h2 className="text-xl font-bold text-[#FAF7F0] mb-1.5">
              Tài Khoản Tạm Thời Bị Khóa
            </h2>

            {/* Lời nhắn nhã nhặn */}
            <p className="text-xs sm:text-sm text-[#C5C2BA] leading-relaxed mb-4">
              {lockMessage} Phiên làm việc của bạn sẽ tự động kết thúc để đảm bảo an toàn thông tin.
            </p>

            {/* Khung đếm ngược thanh lịch */}
            <div className="bg-[#20221E] border border-[#2C2E29] rounded-2xl p-4 mb-4">
              <span className="text-[11px] font-semibold text-[#96938B] uppercase tracking-wider block mb-1">
                Tự động chuyển về Trang Chủ sau
              </span>
              <div className="flex items-baseline justify-center gap-1.5">
                <span className="text-4xl font-extrabold text-[#F5D061] tracking-tight tabular-nums">
                  {countdown}
                </span>
                <span className="text-sm font-semibold text-[#96938B]">giây</span>
              </div>

              {/* Thanh tiến trình màu vàng hổ phách */}
              <div className="w-full bg-[#181916] h-1.5 rounded-full mt-3 overflow-hidden border border-[#2C2E29]">
                <div
                  className="h-full bg-[#D4AF37] rounded-full transition-all duration-1000 ease-linear"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </div>

            {/* Khung hướng dẫn Hotline hỗ trợ */}
            <div className="bg-[#20221E] border border-[#2C2E29] rounded-xl p-3 mb-5 text-xs text-[#C5C2BA] text-left flex items-start gap-2.5">
              <i className="fa-solid fa-headset text-[#F5D061] text-base mt-0.5 shrink-0"></i>
              <div>
                <div className="font-semibold text-[#FAF7F0]">Bạn cần hỗ trợ mở lại tài khoản?</div>
                <div className="text-[11px] text-[#96938B] mt-0.5">
                  Vui lòng liên hệ Hotline: <span className="font-bold text-[#F5D061]">1900 6868</span> (miễn phí) để được hỗ trợ.
                </div>
              </div>
            </div>

            {/* Nút Về Trang Chủ ngay */}
            <button
              type="button"
              onClick={handleReturnHome}
              style={{
                background: 'linear-gradient(135deg, #D4AF37 0%, #E6C65C 50%, #C59B27 100%)',
                color: '#141412',
                boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
              }}
              className="btn-gold w-full py-2.5 px-4 rounded-xl font-bold text-sm border border-[#D4AF37]/40 shadow-sm active:scale-95 transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer"
            >
              <i className="fa-solid fa-house text-xs"></i>
              <span>Về trang chủ ngay</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
