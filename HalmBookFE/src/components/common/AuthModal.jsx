import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useGoogleLogin } from '@react-oauth/google';
import fbLoginModule from 'react-facebook-login/dist/facebook-login-render-props';
import { saveAuthSession } from '@/services/authToken';
import { getCurrentCustomer } from '@/services/customerService';
import AvatarWithFrame from '@/components/common/AvatarWithFrame';
import { getTierInfo } from '@/utils/tierUtils';
import logo from '@/assets/images/logo.png';
import mascotReading from '@/assets/images/mascot-reading.png';

const API_BASE_URL = "http://localhost:8082";
const FacebookLogin = fbLoginModule.default || fbLoginModule;

/**
 * Hàm tiện ích toàn cục mở AuthModal từ bất kỳ component nào:
 * openAuthModal({ mode: 'login' | 'register' | 'qr', message: '...' })
 */
export const openAuthModal = (options = {}) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('halm-open-auth-modal', { detail: options }));
  }
};

export default function AuthModal({
  isOpen: propIsOpen,
  onClose: propOnClose,
  initialTab = 'login',
  promptMessage = '',
  onSuccess: propOnSuccess,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Nhận biết Theme Dark / Light thời gian thực, chống hắt sáng 100%
  const [isDarkTheme, setIsDarkTheme] = useState(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register' | 'qr'
  const [customMessage, setCustomMessage] = useState('');
  const [successCallback, setSuccessCallback] = useState(null);

  // Form Đăng nhập
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Form Đăng ký
  const [newUsername, setNewUsername] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Trạng thái xử lý & Toast
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, type: 'info', message: '' });

  // Popup Điều khoản & Bảo mật
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsActiveTab, setTermsActiveTab] = useState('terms'); // 'terms' | 'privacy'

  // Popup Chào mừng hoành tráng khi đăng nhập thành công
  const [welcomeData, setWelcomeData] = useState(null);

  const modalRef = useRef(null);
  const toastTimeoutRef = useRef(null);

  // Theo dõi sự thay đổi Dark/Light mode thời gian thực
  useEffect(() => {
    const checkTheme = () => {
      setIsDarkTheme(document.documentElement.classList.contains('dark'));
    };

    window.addEventListener('halm-theme-change', checkTheme);
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => {
      window.removeEventListener('halm-theme-change', checkTheme);
      observer.disconnect();
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  // Quản lý Toast thông báo đẹp, nổi bật và có độ tương phản cao
  const triggerToast = (type, message) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ show: true, type, message });
    toastTimeoutRef.current = setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 3800);
  };

  // Đồng bộ với prop hoặc Global Event
  useEffect(() => {
    if (propIsOpen !== undefined) {
      setIsOpen(propIsOpen);
      if (initialTab) setActiveTab(initialTab);
      if (promptMessage) setCustomMessage(promptMessage);
    }
  }, [propIsOpen, initialTab, promptMessage]);

  useEffect(() => {
    const handleGlobalOpen = (event) => {
      const detail = event.detail || {};
      setActiveTab(detail.mode === 'register' ? 'register' : (detail.mode === 'qr' ? 'qr' : 'login'));
      setCustomMessage(detail.message || '');
      if (typeof detail.onSuccess === 'function') {
        setSuccessCallback(() => detail.onSuccess);
      } else {
        setSuccessCallback(null);
      }
      setToast({ show: false, type: 'info', message: '' });
      setWelcomeData(null);
      setShowTermsModal(false);
      setIsOpen(true);
    };

    window.addEventListener('halm-open-auth-modal', handleGlobalOpen);
    return () => window.removeEventListener('halm-open-auth-modal', handleGlobalOpen);
  }, []);

  // Xử lý hiệu ứng ẩn hiện mượt mà (Fade in/out + Scale + Slide)
  useEffect(() => {
    if (isOpen) {
      setIsMounted(true);
      const timer = setTimeout(() => setIsVisible(true), 20);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => {
        setIsMounted(false);
        setWelcomeData(null);
        setShowTermsModal(false);
      }, 260);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Đóng modal bằng phím ESC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        if (showTermsModal) {
          setShowTermsModal(false);
        } else if (!welcomeData) {
          handleClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, showTermsModal, welcomeData]);

  const handleClose = () => {
    setIsOpen(false);
    setIsLoading(false);
    propOnClose?.();
  };

  // Xử lý sau khi đăng nhập thành công
  const notifyAuthSuccess = async (responseData) => {
    saveAuthSession(responseData, { remember: true });

    // NẾU TÀI KHOẢN ĐĂNG NHẬP LÀ ADMIN: Chuyển hướng ngay tới /admin, bỏ qua flow chào mừng độc giả
    const normalizedRole = (responseData?.role || '').replace(/^ROLE_/, '').toUpperCase();
    if (normalizedRole === 'ADMIN') {
      setIsLoading(false);
      handleClose();
      window.location.assign('/admin');
      return;
    }

    let initialPotato = Number(responseData?.potatoBalance ?? responseData?.balance ?? 0);
    let initialAvatar = responseData?.avatar || responseData?.avatarUrl || null;
    let initialName = responseData?.customerName || responseData?.username || username || 'Độc giả thân mến';
    let initialTier = responseData?.membershipTier || responseData?.tier;
    let initialTierInfo = getTierInfo(initialTier, initialPotato);

    // Thiết lập dữ liệu khởi tạo trước (không bao giờ dùng fallback 100 khoai giả)
    setWelcomeData({
      customerName: initialName,
      avatar: initialAvatar,
      role: responseData?.role || 'USER',
      potatoBalance: initialPotato,
      tier: initialTier,
      tierName: initialTierInfo?.name || 'Thợ Cày 🌱',
      tierLevel: initialTierInfo?.level || 1,
    });
    setIsLoading(false);

    // Phát sự kiện toàn cục ban đầu
    window.dispatchEvent(new CustomEvent('halm-auth-success', { detail: responseData }));

    // Truy vấn ngay thông tin Customer thực tế từ Database để lấy chính xác Avatar, Số dư Khoai và Khung Hạng
    try {
      const customer = await getCurrentCustomer();
      if (customer) {
        try {
          localStorage.setItem("halm_customer_cache", JSON.stringify(customer));
        } catch (_) {}
        const realPotato = Number(customer.potatoBalance ?? 0);
        const realTier = customer.membershipTier || initialTier;
        const realTierInfo = getTierInfo(realTier, realPotato);
        const realAvatar = customer.avatar || customer.avatarUrl || initialAvatar;
        const realName = customer.customerName || initialName;

        setWelcomeData({
          customerName: realName,
          avatar: realAvatar,
          role: responseData?.role || customer?.role || 'USER',
          potatoBalance: realPotato,
          tier: realTier,
          tierName: realTierInfo?.name || 'Thợ Cày 🌱',
          tierLevel: realTierInfo?.level || 1,
        });

        // Phát sự kiện toàn cục cập nhật đồng bộ số dư khoai và customer thực tế
        window.dispatchEvent(new CustomEvent('halm-auth-success', { detail: { ...responseData, ...customer } }));
        window.dispatchEvent(new CustomEvent('halm-potato-updated', { detail: { potatoBalance: realPotato } }));
      }
    } catch (err) {
      console.warn("Không thể tải thông tin customer chi tiết ngay sau login:", err);
    }

    window.dispatchEvent(new Event('halm-cart-updated'));
  };

  const handleWelcomeComplete = () => {
    const role = welcomeData?.role;
    handleClose();

    if (successCallback) {
      successCallback(welcomeData);
    } else if (propOnSuccess) {
      propOnSuccess(welcomeData);
    }

    if (role === 'ADMIN' || role === 'ROLE_ADMIN') {
      window.location.assign('/admin');
    }
  };

  // ==========================================
  // 1. XỬ LÝ ĐĂNG NHẬP
  // ==========================================
  const handleLoginSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    const u = username.trim();
    const p = password.trim();

    if (!u) {
      return triggerToast('error', 'Vui lòng nhập tên đăng nhập của bạn.');
    }
    if (!p) {
      return triggerToast('error', 'Vui lòng nhập mật khẩu.');
    }

    setIsLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        username: u,
        password: p,
      });

      notifyAuthSuccess(response.data);
    } catch (err) {
      setIsLoading(false);
      let msg = 'Tên đăng nhập hoặc mật khẩu không chính xác.';
      if (
        err.response?.status === 403 ||
        err.response?.status === 423 ||
        err.response?.data?.error === 'ACCOUNT_LOCKED'
      ) {
        msg = err.response?.data?.message || 'Tài khoản hiện đang bị khóa, vui lòng gọi hotline để hỗ trợ.';
      } else if (err.response?.data?.message) {
        msg = err.response.data.message;
      } else if (typeof err.response?.data === 'string') {
        msg = err.response.data;
      }
      triggerToast('error', typeof msg === 'string' ? msg : 'Đăng nhập thất bại. Vui lòng kiểm tra lại!');
    }
  };

  // ==========================================
  // 2. XỬ LÝ ĐĂNG KÝ
  // ==========================================
  const handleRegisterSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    const u = newUsername.trim();
    const em = email.trim();

    if (!u) {
      return triggerToast('error', 'Vui lòng nhập tên đăng nhập.');
    }
    if (u.length < 4 || u.length > 20) {
      return triggerToast('error', 'Tên đăng nhập phải từ 4 đến 20 ký tự.');
    }
    if (!/^[a-zA-Z0-9_]+$/.test(u)) {
      return triggerToast('error', 'Tên đăng nhập không được chứa khoảng trắng hoặc ký tự đặc biệt.');
    }
    if (!em) {
      return triggerToast('error', 'Vui lòng nhập địa chỉ email.');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
      return triggerToast('error', 'Định dạng email không hợp lệ (ví dụ: yourname@gmail.com).');
    }
    if (!newPassword) {
      return triggerToast('error', 'Vui lòng nhập mật khẩu.');
    }
    if (newPassword.length < 6) {
      return triggerToast('error', 'Mật khẩu phải có ít nhất 6 ký tự để đảm bảo an toàn.');
    }
    if (newPassword !== confirmPassword) {
      return triggerToast('error', 'Mật khẩu xác nhận không khớp.');
    }
    if (!agreeTerms) {
      return triggerToast('warning', 'Bạn cần đọc và đồng ý với Điều khoản và Chính sách bảo mật.');
    }

    setIsLoading(true);

    try {
      await axios.post(`${API_BASE_URL}/api/auth/register`, {
        username: u,
        email: em,
        password: newPassword,
      });

      triggerToast('success', 'Đăng ký tài khoản thành công! Đang chuyển sang Đăng nhập...');
      setUsername(u);
      setPassword(newPassword);

      setTimeout(() => {
        setIsLoading(false);
        setActiveTab('login');
      }, 1200);
    } catch (err) {
      setIsLoading(false);
      const msg = err.response?.data?.message || err.response?.data || 'Đăng ký thất bại. Vui lòng thử lại.';
      triggerToast('error', typeof msg === 'string' ? msg : 'Lỗi hệ thống khi đăng ký.');
    }
  };

  // ==========================================
  // 3. ĐĂNG NHẬP GOOGLE & FACEBOOK
  // ==========================================
  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setIsLoading(true);
        const res = await axios.post(`${API_BASE_URL}/api/auth/google`, {
          token: tokenResponse.access_token,
        });
        notifyAuthSuccess(res.data);
      } catch (err) {
        setIsLoading(false);
        const msg = (err.response?.status === 403 || err.response?.status === 423 || err.response?.data?.error === 'ACCOUNT_LOCKED')
          ? (err.response?.data?.message || 'Tài khoản hiện đang bị khóa, vui lòng gọi hotline để hỗ trợ.')
          : 'Xác thực Google thất bại ở máy chủ.';
        triggerToast('error', msg);
      }
    },
    onError: () => {
      triggerToast('info', 'Đăng nhập Google đã bị hủy.');
    },
  });

  const loginWithFacebook = async (response) => {
    if (response?.accessToken) {
      try {
        setIsLoading(true);
        const res = await axios.post(`${API_BASE_URL}/api/auth/facebook`, {
          token: response.accessToken,
        });
        notifyAuthSuccess(res.data);
      } catch (err) {
        setIsLoading(false);
        const msg = (err.response?.status === 403 || err.response?.status === 423 || err.response?.data?.error === 'ACCOUNT_LOCKED')
          ? (err.response?.data?.message || 'Tài khoản hiện đang bị khóa, vui lòng gọi hotline để hỗ trợ.')
          : 'Xác thực Facebook thất bại ở máy chủ.';
        triggerToast('error', msg);
      }
    }
  };

  if (!isMounted) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 font-nunito transition-opacity duration-300 ${
        isVisible
          ? isDarkTheme
            ? 'bg-black/80 backdrop-blur-md opacity-100'
            : 'bg-stone-900/45 backdrop-blur-md opacity-100'
          : 'bg-transparent backdrop-blur-none opacity-0 pointer-events-none'
      }`}
      onClick={(e) => {
        if (e.target === e.currentTarget && !welcomeData && !showTermsModal) {
          handleClose();
        }
      }}
      role="dialog"
      aria-modal="true"
    >
      {/* ========================================================
          TOAST THÔNG BÁO TINH TẾ, ĐẸP MẮT & ĐỘ TƯƠNG PHẢN CAO
         ======================================================== */}
      {toast.show && (
        <div
          className={`fixed top-5 left-1/2 -translate-x-1/2 z-[130] w-[92%] max-w-md px-4 py-3 rounded-2xl border shadow-2xl flex items-center gap-3 backdrop-blur-xl transition-all duration-300 ${
            isDarkTheme
              ? toast.type === 'error'
                ? 'bg-[#1D1416]/95 border-rose-500/40 text-rose-100 shadow-[0_12px_32px_rgba(244,63,94,0.25)]'
                : toast.type === 'success'
                ? 'bg-[#121D17]/95 border-emerald-500/40 text-emerald-100 shadow-[0_12px_32px_rgba(16,185,129,0.25)]'
                : 'bg-[#1C1A14]/95 border-[#D4AF37]/50 text-[#FBF7EE] shadow-[0_12px_32px_rgba(212,175,55,0.25)]'
              : toast.type === 'error'
              ? 'bg-rose-50/98 border-rose-300 text-rose-900 shadow-[0_12px_28px_rgba(225,29,72,0.15)]'
              : toast.type === 'success'
              ? 'bg-emerald-50/98 border-emerald-300 text-emerald-900 shadow-[0_12px_28px_rgba(5,150,105,0.15)]'
              : 'bg-[#FFFDF9]/98 border-[#D4AF37]/50 text-[#2B2313] shadow-[0_12px_28px_rgba(212,175,55,0.15)]'
          }`}
        >
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg ${
              toast.type === 'error'
                ? isDarkTheme
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : 'bg-rose-100 text-rose-600'
                : toast.type === 'success'
                ? isDarkTheme
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-emerald-100 text-emerald-600'
                : isDarkTheme
                ? 'bg-[#D4AF37]/20 text-[#F5D061] border border-[#D4AF37]/40'
                : 'bg-amber-100 text-amber-700'
            }`}
          >
            {toast.type === 'error' ? (
              <i className="ph-fill ph-warning-circle"></i>
            ) : toast.type === 'success' ? (
              <i className="ph-fill ph-check-circle"></i>
            ) : (
              <i className="ph-fill ph-sparkle"></i>
            )}
          </div>
          <div className="text-xs sm:text-[13px] font-bold leading-snug flex-1">
            {toast.message}
          </div>
          <button
            type="button"
            onClick={() => setToast((prev) => ({ ...prev, show: false }))}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isDarkTheme
                ? 'text-stone-400 hover:text-white hover:bg-white/10'
                : 'text-stone-400 hover:text-stone-700 hover:bg-stone-200/50'
            }`}
            aria-label="Đóng thông báo"
          >
            <i className="ph-bold ph-x text-sm"></i>
          </button>
        </div>
      )}

      {/* ========================================================
          POPUP 1: CELEBRATION CHÀO MỪNG ĐĂNG NHẬP THÀNH CÔNG
          "Chào mừng tới với HALMBOOK - Nền tảng đọc sách tương lai !"
         ======================================================== */}
      {welcomeData ? (
        <div
          className={`relative w-full max-w-[460px] overflow-hidden rounded-3xl border border-[#D4AF37]/60 bg-[#FFFDF9]/95 dark:bg-[#161714]/98 backdrop-blur-2xl text-[#1E1F1D] dark:text-[#EDE9DF] shadow-[0_25px_70px_rgba(212,175,55,0.2)] dark:shadow-[0_25px_80px_rgba(0,0,0,0.9)] transition-all duration-300 ease-out transform ${
            isVisible ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'
          }`}
        >
          {/* Viền sáng hoàng gia trên cùng */}
          <div className="h-1.5 w-full bg-gradient-to-r from-[#8B3038] via-[#D4AF37] to-[#8B3038]" />

          <div className="relative p-7 sm:p-9 text-center">
            {/* Avatar người dùng với khung hạng chuẩn xác (AvatarWithFrame) */}
            <div className="relative mx-auto mb-5 flex items-center justify-center">
              <AvatarWithFrame
                avatarSrc={welcomeData.avatar}
                name={welcomeData.customerName}
                tier={welcomeData.tier}
                potatoBalance={welcomeData.potatoBalance}
                size="lg"
                showCrown={true}
                showTierBadge={true}
              />
            </div>

            {/* Tiêu đề & Phụ đề chính thức - Rực rỡ, rõ ràng, không bị chìm màu */}
            <h2 className="font-nunito text-xl sm:text-2xl font-black tracking-tight mb-2 text-[#1E1F1D] dark:text-[#FAF7F0]">
              Chào mừng tới với <span className="text-[#B8860B] dark:text-[#F5D061] drop-shadow-[0_2px_12px_rgba(245,208,97,0.3)]">HALMBOOK</span>
            </h2>
            <div className="inline-flex items-center gap-1.5 rounded-full px-4 py-1 text-xs font-black uppercase tracking-wider mb-6 bg-amber-500/15 text-amber-900 border border-amber-500/35 dark:bg-[#D4AF37]/15 dark:text-[#FBE596] dark:border-[#D4AF37]/40 shadow-xs">
              <span>🚀</span>
              <span>NỀN TẢNG ĐỌC SÁCH TƯƠNG LAI !</span>
            </div>

            {/* Thẻ người dùng vừa đăng nhập - Đồng bộ chuẩn Dark/Light Mode */}
            <div className="mb-6 rounded-2xl border border-stone-200/90 dark:border-[#2C2E29] bg-stone-50/90 dark:bg-[#1E201B] p-4 text-left shadow-xs">
              <div className="flex items-center justify-between mb-2.5 pb-2.5 border-b border-stone-200/70 dark:border-[#2C2E29]">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-tr from-[#D4AF37] to-[#F5D061] text-[#161713] font-black text-base shadow-sm shrink-0 overflow-hidden">
                    {welcomeData.avatar ? (
                      <img
                        src={welcomeData.avatar}
                        alt={welcomeData.customerName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      welcomeData.customerName.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold text-stone-500 dark:text-[#96938B]">
                      Tài khoản độc giả
                    </div>
                    <div className="text-sm font-black text-stone-900 dark:text-[#FAF7F0] truncate max-w-[170px]">
                      {welcomeData.customerName}
                    </div>
                  </div>
                </div>
                <span className="rounded-full bg-amber-500/15 dark:bg-[#D4AF37]/20 px-3 py-1 text-xs font-bold text-amber-800 dark:text-[#FBE596] border border-amber-500/30 dark:border-[#D4AF37]/40 shrink-0">
                  {welcomeData.tierName}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-bold text-stone-600 dark:text-[#B5B2AA]">
                  <i className="ph-fill ph-wallet text-[#D4AF37] text-base"></i> Số dư ví khoai:
                </span>
                <span className="font-black text-[#B8860B] dark:text-[#F5D061] text-base">
                  {welcomeData.potatoBalance.toLocaleString()} 🥔
                </span>
              </div>
            </div>

            {/* Nút hành động Bắt đầu khám phá - Tương phản cao, rực rỡ */}
            <button
              type="button"
              onClick={handleWelcomeComplete}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#D4AF37] via-[#F3D374] to-[#C99C28] hover:from-[#F0CE5E] hover:to-[#D4AF37] text-[#161713] font-black text-sm uppercase tracking-wider shadow-[0_10px_25px_rgba(212,175,55,0.35)] hover:shadow-[0_12px_30px_rgba(212,175,55,0.45)] hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Bắt Đầu Khám Phá Ngay</span>
              <i className="ph-bold ph-arrow-right text-base"></i>
            </button>
          </div>
        </div>
      ) : showTermsModal ? (
        /* ========================================================
            POPUP 2: POPUP ĐIỀU KHOẢN & CHÍNH SÁCH BẢO MẬT
           ======================================================== */
        <div
          className={`relative w-full max-w-[560px] max-h-[85vh] flex flex-col overflow-hidden rounded-3xl border border-[#D4AF37]/50 bg-[#FFFDF9]/98 dark:bg-[#161714]/98 backdrop-blur-2xl text-[#1E1F1D] dark:text-[#EDE9DF] shadow-[0_25px_70px_rgba(0,0,0,0.5)] transition-all duration-300 ease-out transform ${
            isVisible ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'
          }`}
        >
          <div className="h-1.5 w-full bg-gradient-to-r from-[#8B3038] via-[#D4AF37] to-[#8B3038]" />

          {/* Header Modal Điều khoản */}
          <div className="p-5 sm:p-6 border-b border-stone-200 dark:border-[#2C2E29] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40">
                <i className="ph-bold ph-shield-check text-lg"></i>
              </div>
              <div>
                <h3 className="font-nunito font-black text-base text-stone-900 dark:text-[#FAF7F0]">
                  Điều Khoản & Chính Sách HALM BOOK
                </h3>
                <p className="text-[11px] text-stone-500 dark:text-[#96938B]">
                  Cập nhật lần cuối: Tháng 11/2026
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowTermsModal(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-200/60 dark:bg-[#252822] text-stone-500 hover:text-stone-900 dark:text-stone-300 dark:hover:text-white transition cursor-pointer"
            >
              <i className="ph-bold ph-x text-sm"></i>
            </button>
          </div>

          {/* Tab chọn Điều khoản hoặc Bảo mật */}
          <div className="flex border-b border-stone-200 dark:border-[#2C2E29] px-6 pt-3 bg-stone-100/50 dark:bg-[#1B1D18]">
            <button
              type="button"
              onClick={() => setTermsActiveTab('terms')}
              className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
                termsActiveTab === 'terms'
                  ? 'border-[#D4AF37] text-amber-800 dark:text-[#F5D061] font-black'
                  : 'border-transparent text-stone-500 hover:text-stone-800 dark:text-[#96938B] dark:hover:text-[#EDE9DF]'
              }`}
            >
              <i className="ph-bold ph-file-text"></i>
              <span>Điều khoản dịch vụ</span>
            </button>
            <button
              type="button"
              onClick={() => setTermsActiveTab('privacy')}
              className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
                termsActiveTab === 'privacy'
                  ? 'border-[#D4AF37] text-amber-800 dark:text-[#F5D061] font-black'
                  : 'border-transparent text-stone-500 hover:text-stone-800 dark:text-[#96938B] dark:hover:text-[#EDE9DF]'
              }`}
            >
              <i className="ph-bold ph-lock-key"></i>
              <span>Chính sách bảo mật</span>
            </button>
          </div>

          {/* Nội dung chi tiết có thanh cuộn mượt */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 text-xs leading-relaxed space-y-4 text-stone-700 dark:text-[#C5C2BA]">
            {termsActiveTab === 'terms' ? (
              <>
                <section>
                  <h4 className="font-bold text-sm text-stone-900 dark:text-[#FAF7F0] mb-1">
                    1. Chấp thuận các điều khoản
                  </h4>
                  <p>
                    Bằng việc tạo tài khoản hoặc sử dụng nền tảng đọc sách HALM BOOK, bạn đồng ý tuân thủ toàn bộ các điều khoản dịch vụ và chính sách của chúng tôi. Nếu không đồng ý, vui lòng ngừng sử dụng dịch vụ.
                  </p>
                </section>
                <section>
                  <h4 className="font-bold text-sm text-stone-900 dark:text-[#FAF7F0] mb-1">
                    2. Quyền sở hữu trí tuệ & Bản quyền tác phẩm
                  </h4>
                  <p>
                    Mọi tác phẩm, sách điện tử (eBook, audio, tài liệu) trên HALM BOOK đều được bảo hộ bản quyền theo luật pháp Việt Nam và các công ước quốc tế. Độc giả chỉ được cấp quyền thuê hoặc đọc phục vụ mục đích nghiên cứu cá nhân; nghiêm cấm sao chép, trích xuất, phát tán trái phép.
                  </p>
                </section>
                <section>
                  <h4 className="font-bold text-sm text-stone-900 dark:text-[#FAF7F0] mb-1">
                    3. Cơ chế Khoai Tây & Thuê sách
                  </h4>
                  <p>
                    Khoai Tây (🥔) là đơn vị trao đổi nội bộ của hệ thống dùng để thuê sách theo ngày/tuần hoặc mở khóa vĩnh viễn. Khoai Tây không có giá trị quy đổi ngược thành tiền mặt. Độc giả có thể tích lũy thêm qua việc điểm danh chuỗi Streak hằng ngày và nhiệm vụ đọc sách.
                  </p>
                </section>
                <section>
                  <h4 className="font-bold text-sm text-stone-900 dark:text-[#FAF7F0] mb-1">
                    4. Tủ sách cá nhân & Trách nhiệm độc giả
                  </h4>
                  <p>
                    Độc giả chịu trách nhiệm về tính hợp pháp của các tệp sách (PDF, EPUB) do mình tải lên tủ sách cá nhân. Không được tải lên các tài liệu có nội dung độc hại, vi phạm thuần phong mỹ tục hoặc pháp luật.
                  </p>
                </section>
              </>
            ) : (
              <>
                <section>
                  <h4 className="font-bold text-sm text-stone-900 dark:text-[#FAF7F0] mb-1">
                    1. Thu thập thông tin cá nhân
                  </h4>
                  <p>
                    Chúng tôi thu thập các thông tin tối thiểu gồm: Tên đăng nhập, Địa chỉ Email, và Mật khẩu (đã được băm mã hóa một chiều qua thuật toán BCrypt an toàn). Chúng tôi không lưu trữ mật khẩu gốc của bạn dưới dạng văn bản thô.
                  </p>
                </section>
                <section>
                  <h4 className="font-bold text-sm text-stone-900 dark:text-[#FAF7F0] mb-1">
                    2. Mục đích sử dụng dữ liệu
                  </h4>
                  <p>
                    Thông tin tài khoản được sử dụng nhằm: xác thực danh tính độc giả, đồng bộ tiến trình đọc sách dở dang giữa các thiết bị (Web & App), quản lý số dư Khoai Tây và gợi ý sách cá nhân hóa thông qua Trợ lý AI Khoai Nhỏ.
                  </p>
                </section>
                <section>
                  <h4 className="font-bold text-sm text-stone-900 dark:text-[#FAF7F0] mb-1">
                    3. Cam kết không chia sẻ dữ liệu
                  </h4>
                  <p>
                    HALM BOOK cam kết tuyệt đối không bán, chia sẻ hoặc tiết lộ thông tin cá nhân của bạn cho bất kỳ bên thứ ba nào, trừ trường hợp có yêu cầu chính thức từ cơ quan pháp luật có thẩm quyền.
                  </p>
                </section>
                <section>
                  <h4 className="font-bold text-sm text-stone-900 dark:text-[#FAF7F0] mb-1">
                    4. Quyền của độc giả
                  </h4>
                  <p>
                    Bạn có toàn quyền chỉnh sửa thông tin cá nhân, thay đổi mật khẩu hoặc yêu cầu xóa dữ liệu tài khoản bất kỳ lúc nào tại mục Quản lý tài khoản.
                  </p>
                </section>
              </>
            )}
          </div>

          {/* Footer Modal Điều khoản */}
          <div className="p-4 sm:p-5 border-t border-stone-200 dark:border-[#2C2E29] bg-stone-50/70 dark:bg-[#1B1D18] flex items-center justify-between gap-3">
            <span className="text-[11px] text-stone-500 dark:text-[#96938B]">
              Nhấn Đồng ý để hoàn tất đăng ký
            </span>
            <button
              type="button"
              onClick={() => {
                setAgreeTerms(true);
                setShowTermsModal(false);
                triggerToast('success', 'Đã ghi nhận bạn đồng ý với Điều khoản & Bảo mật.');
              }}
              className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#F3D374] to-[#C99C28] hover:from-[#F0CE5E] hover:to-[#D4AF37] text-[#161713] font-black text-xs uppercase tracking-wide shadow-md transition cursor-pointer"
            >
              Tôi Đã Hiểu & Đồng Ý
            </button>
          </div>
        </div>
      ) : (
        /* ========================================================
            POPUP CHÍNH: MODAL ĐĂNG NHẬP / ĐĂNG KÝ (SANG TRỌNG, CHỐNG HẮT SÁNG)
           ======================================================== */
        <div
          ref={modalRef}
          className={`relative w-full max-w-[460px] overflow-hidden rounded-3xl border border-[#D4AF37]/45 bg-[#FFFDF9]/95 dark:bg-[#161714]/98 backdrop-blur-2xl text-[#1E1F1D] dark:text-[#EDE9DF] shadow-[0_25px_60px_rgba(212,175,55,0.18)] dark:shadow-[0_25px_80px_rgba(0,0,0,0.9)] transition-all duration-300 ease-out transform ${
            isVisible ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'
          }`}
        >
          {/* Dải hiệu ứng viền sáng hoàng gia trên cùng */}
          <div className="h-1.5 w-full bg-gradient-to-r from-[#8B3038] via-[#D4AF37] to-[#8B3038]" />

          {/* Nút đóng X góc phải */}
          <button
            type="button"
            onClick={handleClose}
            className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-stone-200/60 dark:bg-[#252822] text-stone-500 hover:text-stone-900 dark:text-stone-300 dark:hover:text-white transition-colors cursor-pointer"
            aria-label="Đóng cửa sổ"
            title="Đóng (Esc)"
          >
            <i className="ph-bold ph-x text-lg"></i>
          </button>

          <div className="p-6 sm:p-7">
            {/* Header Modal: Logo & Lời chào */}
            <div className="text-center mb-5">
              <div className="inline-flex items-center justify-center gap-2 mb-2">
                <img src={logo} alt="HALM BOOK" className="h-10 w-10 object-contain drop-shadow-sm" />
                <span className="font-nunito text-xl font-black tracking-tight text-[#1E1F1D] dark:text-[#FAF7F0]">
                  HALM <span className="text-[#B8860B] dark:text-[#F5D061]">BOOK</span>
                </span>
              </div>

              {customMessage ? (
                <div className="mx-auto mt-1 max-w-sm rounded-xl bg-amber-500/10 dark:bg-[#D4AF37]/15 border border-amber-500/30 dark:border-[#D4AF37]/35 px-3 py-1.5 text-xs font-semibold text-amber-900 dark:text-[#FBE596] flex items-center justify-center gap-1.5">
                  <i className="ph-bold ph-info text-sm shrink-0"></i>
                  <span>{customMessage}</span>
                </div>
              ) : (
                <p className="text-xs text-stone-500 dark:text-[#96938B]">
                  Thế giới tri thức chọn lọc & Trợ lý đọc sách thông minh
                </p>
              )}
            </div>

            {/* Thanh chuyển đổi Tab (Đăng Nhập / Đăng Ký / Mã QR) */}
            <div className="flex rounded-2xl bg-stone-200/70 dark:bg-[#1E201B] border border-transparent dark:border-[#2C2E29] p-1 mb-5">
              <button
                type="button"
                onClick={() => setActiveTab('login')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'login'
                    ? isDarkTheme
                      ? 'bg-[#2A2C26] text-[#F5D061] border border-[#D4AF37]/35 shadow-md font-black'
                      : 'bg-white text-[#8B3038] shadow-sm font-black'
                    : 'text-stone-500 hover:text-stone-800 dark:text-[#96938B] dark:hover:text-[#FAF7F0]'
                }`}
              >
                <i className="ph-bold ph-sign-in"></i>
                <span>Đăng Nhập</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('register')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'register'
                    ? isDarkTheme
                      ? 'bg-[#2A2C26] text-[#F5D061] border border-[#D4AF37]/35 shadow-md font-black'
                      : 'bg-white text-[#8B3038] shadow-sm font-black'
                    : 'text-stone-500 hover:text-stone-800 dark:text-[#96938B] dark:hover:text-[#FAF7F0]'
                }`}
              >
                <i className="ph-bold ph-user-plus"></i>
                <span>Đăng Ký</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('qr')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  activeTab === 'qr'
                    ? isDarkTheme
                      ? 'bg-[#2A2C26] text-[#F5D061] border border-[#D4AF37]/35 shadow-md font-black'
                      : 'bg-white text-[#8B3038] shadow-sm font-black'
                    : 'text-stone-500 hover:text-stone-800 dark:text-[#96938B] dark:hover:text-[#FAF7F0]'
                }`}
                title="Đăng nhập bằng mã QR trên app di động"
              >
                <i className="ph-bold ph-qr-code text-sm"></i>
                <span className="hidden sm:inline">Mã QR</span>
              </button>
            </div>

            {/* ========================================================
                TAB 1: FORM ĐĂNG NHẬP
               ======================================================== */}
            {activeTab === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-[#D1CEC7] mb-1">
                    Tên đăng nhập
                  </label>
                  <div className="relative flex items-center">
                    {/* Icon căn chuẩn tâm dọc tuyệt đối */}
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-stone-400 dark:text-[#A89354]">
                      <i className="ph-bold ph-user text-base"></i>
                    </div>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Nhập tên đăng nhập của bạn"
                      required
                      autoComplete="username"
                      className="h-11 w-full rounded-xl border border-stone-300 dark:border-[#32352E] bg-white dark:bg-[#1E201B] py-2 pl-10 pr-3.5 text-xs sm:text-sm text-stone-900 dark:text-[#FAF7F0] placeholder:text-stone-400 dark:placeholder:text-[#6C6963] outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/25 transition"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-stone-700 dark:text-[#D1CEC7]">
                      Mật khẩu
                    </label>
                    <a
                      href="/quenmatkhau"
                      className="text-[11px] font-bold text-amber-700 dark:text-[#F5D061] hover:underline"
                      onClick={() => handleClose()}
                    >
                      Quên mật khẩu?
                    </a>
                  </div>
                  <div className="relative flex items-center">
                    {/* Icon ổ khóa căn tâm tuyệt đối */}
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-stone-400 dark:text-[#A89354]">
                      <i className="ph-bold ph-lock-key text-base"></i>
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Nhập mật khẩu"
                      required
                      autoComplete="current-password"
                      className="h-11 w-full rounded-xl border border-stone-300 dark:border-[#32352E] bg-white dark:bg-[#1E201B] py-2 pl-10 pr-10 text-xs sm:text-sm text-stone-900 dark:text-[#FAF7F0] placeholder:text-stone-400 dark:placeholder:text-[#6C6963] outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/25 transition"
                    />
                    {/* Nút ẩn/hiện mật khẩu căn tâm tuyệt đối */}
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 hover:text-stone-700 dark:text-[#A89354] dark:hover:text-[#F5D061] transition cursor-pointer"
                        aria-label="Ẩn hiện mật khẩu"
                      >
                        <i className={`ph-bold ${showPassword ? 'ph-eye-slash' : 'ph-eye'} text-base`}></i>
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#F3D374] to-[#C99C28] hover:from-[#F0CE5E] hover:to-[#D4AF37] text-[#161713] font-black text-xs uppercase tracking-wider shadow-[0_6px_20px_rgba(212,175,55,0.3)] hover:shadow-[0_8px_25px_rgba(212,175,55,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <i className="ph-bold ph-spinner animate-spin text-sm"></i>
                      <span>Đang xác thực...</span>
                    </>
                  ) : (
                    <>
                      <i className="ph-bold ph-sign-in text-sm"></i>
                      <span>Đăng Nhập Ngay</span>
                    </>
                  )}
                </button>

                <div className="relative my-4 text-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-stone-200 dark:border-[#2C2E29]"></div>
                  </div>
                  <span className="relative bg-[#FFFDF9] dark:bg-[#161714] px-3 text-[11px] font-semibold text-stone-500 dark:text-[#96938B] uppercase tracking-wider">
                    Hoặc đăng nhập nhanh bằng
                  </span>
                </div>

                {/* Nút mạng xã hội */}
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => loginWithGoogle()}
                    className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-stone-300 dark:border-[#32352E] bg-white dark:bg-[#1E201B] hover:bg-stone-50 dark:hover:bg-[#252822] text-xs font-bold text-stone-800 dark:text-[#FAF7F0] transition shadow-xs cursor-pointer"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span>Google</span>
                  </button>

                  <FacebookLogin
                    appId={import.meta.env.VITE_FACEBOOK_APP_ID || "1559212956245733"}
                    autoLoad={false}
                    fields="name,email,picture"
                    callback={loginWithFacebook}
                    render={(renderProps) => (
                      <button
                        type="button"
                        onClick={renderProps.onClick}
                        className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-stone-300 dark:border-[#32352E] bg-white dark:bg-[#1E201B] hover:bg-stone-50 dark:hover:bg-[#252822] text-xs font-bold text-[#1877F2] dark:text-[#5B9DF8] transition shadow-xs cursor-pointer"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                        </svg>
                        <span>Facebook</span>
                      </button>
                    )}
                  />
                </div>
              </form>
            )}

            {/* ========================================================
                TAB 2: FORM ĐĂNG KÝ TÀI KHOẢN
               ======================================================== */}
            {activeTab === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-[#D1CEC7] mb-1">
                    Tên đăng nhập
                  </label>
                  <div className="relative flex items-center">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-stone-400 dark:text-[#A89354]">
                      <i className="ph-bold ph-user text-base"></i>
                    </div>
                    <input
                      type="text"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      placeholder="4 - 20 ký tự (chữ, số, _)"
                      required
                      className="h-11 w-full rounded-xl border border-stone-300 dark:border-[#32352E] bg-white dark:bg-[#1E201B] py-2 pl-10 pr-3.5 text-xs sm:text-sm text-stone-900 dark:text-[#FAF7F0] placeholder:text-stone-400 dark:placeholder:text-[#6C6963] outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/25 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-[#D1CEC7] mb-1">
                    Địa chỉ Email
                  </label>
                  <div className="relative flex items-center">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-stone-400 dark:text-[#A89354]">
                      <i className="ph-bold ph-envelope text-base"></i>
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@example.com"
                      required
                      className="h-11 w-full rounded-xl border border-stone-300 dark:border-[#32352E] bg-white dark:bg-[#1E201B] py-2 pl-10 pr-3.5 text-xs sm:text-sm text-stone-900 dark:text-[#FAF7F0] placeholder:text-stone-400 dark:placeholder:text-[#6C6963] outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/25 transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 dark:text-[#D1CEC7] mb-1">
                      Mật khẩu
                    </label>
                    <div className="relative flex items-center">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-stone-400 dark:text-[#A89354]">
                        <i className="ph-bold ph-lock-key text-base"></i>
                      </div>
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder=">= 6 ký tự"
                        required
                        className="h-11 w-full rounded-xl border border-stone-300 dark:border-[#32352E] bg-white dark:bg-[#1E201B] py-2 pl-9 pr-8 text-xs sm:text-sm text-stone-900 dark:text-[#FAF7F0] placeholder:text-stone-400 dark:placeholder:text-[#6C6963] outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-2 text-stone-400 hover:text-stone-600 dark:text-[#A89354] dark:hover:text-[#F5D061] cursor-pointer"
                        aria-label="Ẩn hiện mật khẩu"
                      >
                        <i className={`ph-bold ${showNewPassword ? 'ph-eye-slash' : 'ph-eye'} text-xs`}></i>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 dark:text-[#D1CEC7] mb-1">
                      Xác nhận
                    </label>
                    <div className="relative flex items-center">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-stone-400 dark:text-[#A89354]">
                        <i className="ph-bold ph-check text-base"></i>
                      </div>
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Nhập lại mật khẩu"
                        required
                        className="h-11 w-full rounded-xl border border-stone-300 dark:border-[#32352E] bg-white dark:bg-[#1E201B] py-2 pl-9 pr-8 text-xs sm:text-sm text-stone-900 dark:text-[#FAF7F0] placeholder:text-stone-400 dark:placeholder:text-[#6C6963] outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-2 text-stone-400 hover:text-stone-600 dark:text-[#A89354] dark:hover:text-[#F5D061] cursor-pointer"
                        aria-label="Ẩn hiện xác nhận mật khẩu"
                      >
                        <i className={`ph-bold ${showConfirmPassword ? 'ph-eye-slash' : 'ph-eye'} text-xs`}></i>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Checkbox mở Popup Điều khoản & Bảo mật */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="modal-agree-terms"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="h-4 w-4 rounded border-stone-300 dark:border-[#32352E] text-amber-600 focus:ring-amber-500 cursor-pointer accent-[#D4AF37]"
                  />
                  <label htmlFor="modal-agree-terms" className="text-[11px] text-stone-600 dark:text-[#96938B] cursor-pointer select-none">
                    Tôi đồng ý với{' '}
                    <button
                      type="button"
                      onClick={() => { setTermsActiveTab('terms'); setShowTermsModal(true); }}
                      className="text-amber-700 dark:text-[#F5D061] font-bold hover:underline cursor-pointer"
                    >
                      Điều khoản
                    </button>{' '}
                    &{' '}
                    <button
                      type="button"
                      onClick={() => { setTermsActiveTab('privacy'); setShowTermsModal(true); }}
                      className="text-amber-700 dark:text-[#F5D061] font-bold hover:underline cursor-pointer"
                    >
                      Chính sách bảo mật
                    </button>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#F3D374] to-[#C99C28] hover:from-[#F0CE5E] hover:to-[#D4AF37] text-[#161713] font-black text-xs uppercase tracking-wider shadow-[0_6px_20px_rgba(212,175,55,0.3)] hover:shadow-[0_8px_25px_rgba(212,175,55,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <i className="ph-bold ph-spinner animate-spin text-sm"></i>
                      <span>Đang tạo tài khoản...</span>
                    </>
                  ) : (
                    <>
                      <i className="ph-bold ph-user-plus text-sm"></i>
                      <span>Tạo Tài Khoản Mới</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* ========================================================
                TAB 3: ĐĂNG NHẬP MÃ QR (ĐỒNG BỘ ỨNG DỤNG DI ĐỘNG)
               ======================================================== */}
            {activeTab === 'qr' && (
              <div className="text-center py-3 animate-fade-in">
                <div className="mx-auto mb-3 flex h-44 w-44 items-center justify-center rounded-2xl border-2 border-dashed border-[#D4AF37]/60 bg-white p-2.5 shadow-sm">
                  <img
                    src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=HALMBOOK_AUTH_PORTAL_TOKEN"
                    alt="QR Login"
                    className="h-full w-full object-contain"
                  />
                </div>
                <h4 className="text-sm font-bold text-stone-900 dark:text-[#FAF7F0] mb-1">
                  Quét mã QR bằng App HALM BOOK
                </h4>
                <p className="text-xs text-stone-500 dark:text-[#96938B] max-w-xs mx-auto mb-3">
                  Mở ứng dụng trên điện thoại, vào mục Quét mã để đăng nhập vào tài khoản tức thì mà không cần nhập mật khẩu.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('login')}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-[#F5D061] hover:underline cursor-pointer"
                >
                  <i className="ph-bold ph-arrow-left"></i>
                  <span>Quay lại đăng nhập thường</span>
                </button>
              </div>
            )}

            {/* Chân Modal: Chuyển đổi nhanh qua lại giữa Đăng nhập & Đăng ký */}
            <div className="mt-5 pt-3 border-t border-stone-200 dark:border-[#2C2E29] text-center text-xs text-stone-500 dark:text-[#96938B]">
              {activeTab === 'login' ? (
                <span>
                  Chưa có tài khoản độc giả?{' '}
                  <button
                    type="button"
                    onClick={() => setActiveTab('register')}
                    className="font-bold text-amber-700 dark:text-[#F5D061] hover:underline cursor-pointer"
                  >
                    Đăng ký ngay miễn phí
                  </button>
                </span>
              ) : activeTab === 'register' ? (
                <span>
                  Đã có tài khoản?{' '}
                  <button
                    type="button"
                    onClick={() => setActiveTab('login')}
                    className="font-bold text-amber-700 dark:text-[#F5D061] hover:underline cursor-pointer"
                  >
                    Đăng nhập tại đây
                  </button>
                </span>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
