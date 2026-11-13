import React, { useState, useEffect } from 'react';
import './css/DangNhap.css';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import Popup from './layout/Popup';
import logo from '@/assets/images/logo.png';
import { useGoogleLogin } from '@react-oauth/google';
import fbLoginModule from 'react-facebook-login/dist/facebook-login-render-props';
import { saveAuthSession, isTokenValid, getAuthRole, getAdminAuthRole } from '@/services/authToken';

const API_BASE_URL = 'http://localhost:8082';
const FacebookLogin = fbLoginModule.default || fbLoginModule;

export default function DangNhap() {
  const navigate = useNavigate();
  const location = useLocation();

  // Xác định đường dẫn đích sau khi đăng nhập (từ ProtectedRoute hoặc query param)
  const searchParams = new URLSearchParams(location.search);
  const fromState = location.state?.from;
  const redirectQuery = searchParams.get('redirect') || searchParams.get('from');
  const fromPath = (typeof fromState === 'string' && fromState.trim())
    ? fromState
    : (typeof redirectQuery === 'string' && redirectQuery.trim() ? redirectQuery : '');

  // Phát hiện nếu đang cố đăng nhập vào khu vực Admin
  const isAdminPortal = fromPath.startsWith('/admin') || location.pathname.startsWith('/admin') || searchParams.get('portal') === 'admin';

  // Tự động điều hướng nếu người dùng đã có phiên đăng nhập hợp lệ (ví dụ: bấm nút Back của trình duyệt)
  useEffect(() => {
    const isLockedParam = searchParams.get('reason') === 'account_locked' || searchParams.get('locked') === 'true';
    if (isLockedParam) {
      setPopup({
        message: 'Tài khoản hiện đang bị khóa, vui lòng gọi hotline để hỗ trợ.',
        type: 'error',
      });
      return;
    }

    if (isTokenValid()) {
      const userRole = (getAuthRole() || '').replace(/^ROLE_/, '').toUpperCase();
      const adminRole = (getAdminAuthRole() || '').replace(/^ROLE_/, '').toUpperCase();
      if (isAdminPortal && (adminRole === 'ADMIN' || userRole === 'ADMIN')) {
        navigate('/admin', { replace: true });
      } else if (!isAdminPortal) {
        const dest = (fromPath && !fromPath.startsWith('/dangnhap') && !fromPath.startsWith('/login')) ? fromPath : '/';
        navigate(dest, { replace: true });
      }
    }
  }, [navigate, fromPath, isAdminPortal, location.search]);

  // --- STATE CHUYỂN ĐỔI FORM ---
  const initialMode = searchParams.get('tab') === 'register' || location.state?.tab === 'register' ? 'register' : 'login';
  const [activeForm, setActiveForm] = useState(initialMode); // 'login' | 'register'

  // --- STATE ĐĂNG NHẬP ---
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- STATE ĐĂNG KÝ ---
  const [newUsername, setNewUsername] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [dieuKhoan, setDieuKhoan] = useState(false);

  // --- STATE POPUP THÔNG BÁO ---
  const [popup, setPopup] = useState({
    message: '',
    type: 'error',
  });

  const handlePopupClose = () => {
    setPopup((prev) => ({ ...prev, message: '' }));
  };

  // Điều hướng thông minh sau khi đăng nhập thành công theo vai trò (Role)
  const redirectByRole = (role) => {
    const normalizedRole = (role || '').replace(/^ROLE_/, '').toUpperCase();

    setTimeout(() => {
      if (normalizedRole === 'ADMIN') {
        // Tài khoản Quản trị viên: Ưu tiên quay lại trang quản trị trước đó, hoặc vào thẳng /admin
        const targetAdminUrl = (fromPath && fromPath.startsWith('/admin')) ? fromPath : '/admin';
        window.location.assign(targetAdminUrl);
      } else {
        // Tài khoản Độc giả / Người dùng bình thường:
        // Nếu trước đó đang cố vào /admin nhưng không phải admin -> chuyển về trang chủ an toàn
        let targetUserUrl = '/';
        if (fromPath && !fromPath.startsWith('/admin') && !fromPath.startsWith('/dangnhap') && !fromPath.startsWith('/login')) {
          targetUserUrl = fromPath;
        }
        window.location.assign(targetUserUrl);
      }
    }, 700);
  };

  // ==========================================
  // 1. XỬ LÝ ĐĂNG NHẬP (USERNAME & PASSWORD)
  // ==========================================
  const handleLogin = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    const u = username.trim();
    const p = password.trim();

    if (!u) {
      return setPopup({ message: 'Vui lòng nhập tên đăng nhập của bạn.', type: 'error' });
    }
    if (!p) {
      return setPopup({ message: 'Vui lòng nhập mật khẩu.', type: 'error' });
    }

    setIsSubmitting(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        username: u,
        password: p,
      });

      const role = response.data?.role;
      saveAuthSession(response.data, { remember: rememberMe });

      const normalizedRole = (role || '').replace(/^ROLE_/, '').toUpperCase();
      if (normalizedRole === 'ADMIN') {
        setPopup({
          message: 'Đăng nhập Quản trị viên thành công! Đang chuyển vào Bảng Điều Hành...',
          type: 'success',
        });
      } else {
        setPopup({
          message: 'Đăng nhập thành công! Chào mừng bạn quay trở lại HALM BOOK.',
          type: 'success',
        });
      }

      redirectByRole(role);
    } catch (error) {
      setIsSubmitting(false);
      console.error('Lỗi đăng nhập:', error);
      let errMsg = 'Tên đăng nhập hoặc mật khẩu không chính xác!';
      if (
        error.response?.status === 403 ||
        error.response?.status === 423 ||
        error.response?.data?.error === 'ACCOUNT_LOCKED'
      ) {
        errMsg = error.response?.data?.message || 'Tài khoản hiện đang bị khóa, vui lòng gọi hotline để hỗ trợ.';
      } else if (error.response?.data) {
        if (typeof error.response.data === 'string') errMsg = error.response.data;
        else if (error.response.data.message) errMsg = error.response.data.message;
      }
      setPopup({ message: errMsg, type: 'error' });
    }
  };

  // ==========================================
  // 2. XỬ LÝ ĐĂNG KÝ TÀI KHOẢN MỚI
  // ==========================================
  const handleRegister = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    const u = newUsername.trim();
    const em = email.trim();
    const p = newPassword.trim();
    const cp = confirmPassword.trim();

    if (!u) {
      return setPopup({ message: 'Vui lòng nhập tên đăng nhập muốn tạo.', type: 'error' });
    }
    if (!em) {
      return setPopup({ message: 'Vui lòng nhập địa chỉ Email của bạn.', type: 'error' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(em)) {
      return setPopup({ message: 'Định dạng email không hợp lệ.', type: 'error' });
    }
    if (!p) {
      return setPopup({ message: 'Vui lòng nhập mật khẩu.', type: 'error' });
    }
    if (p.length < 6) {
      return setPopup({ message: 'Mật khẩu phải có độ dài ít nhất 6 ký tự.', type: 'error' });
    }
    if (p !== cp) {
      return setPopup({ message: 'Mật khẩu xác nhận không khớp.', type: 'error' });
    }
    if (!dieuKhoan) {
      return setPopup({ message: 'Vui lòng đồng ý với Điều khoản và Chính sách bảo mật.', type: 'error' });
    }

    setIsSubmitting(true);

    try {
      await axios.post(`${API_BASE_URL}/api/auth/register`, {
        username: u,
        email: em,
        password: p,
      });

      setIsSubmitting(false);
      setPopup({
        message: 'Đăng ký tài khoản thành công! Bạn có thể đăng nhập ngay.',
        type: 'success',
      });

      // Tự động chuyển qua tab đăng nhập và điền sẵn username
      setUsername(u);
      setPassword('');
      setActiveForm('login');
    } catch (error) {
      setIsSubmitting(false);
      console.error('Lỗi đăng ký:', error);
      let errMsg = 'Đăng ký thất bại. Tên đăng nhập hoặc Email có thể đã tồn tại.';
      if (error.response?.data) {
        if (typeof error.response.data === 'string') errMsg = error.response.data;
        else if (error.response.data.message) errMsg = error.response.data.message;
      }
      setPopup({ message: errMsg, type: 'error' });
    }
  };

  // ==========================================
  // 3. XỬ LÝ GOOGLE OAUTH
  // ==========================================
  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsSubmitting(true);
      try {
        const response = await axios.post(`${API_BASE_URL}/api/auth/google`, {
          token: tokenResponse.access_token,
        });

        const role = response.data?.role;
        saveAuthSession(response.data, { remember: true });

        setPopup({ message: 'Đăng nhập Google thành công!', type: 'success' });
        redirectByRole(role);
      } catch (error) {
        setIsSubmitting(false);
        console.error('Lỗi xác thực Google:', error);
        let errMsg = 'Xác thực Google thất bại ở máy chủ.';
        if (
          error.response?.status === 403 ||
          error.response?.status === 423 ||
          error.response?.data?.error === 'ACCOUNT_LOCKED'
        ) {
          errMsg = error.response?.data?.message || 'Tài khoản hiện đang bị khóa, vui lòng gọi hotline để hỗ trợ.';
        }
        setPopup({ message: errMsg, type: 'error' });
      }
    },
    onError: () => {
      setPopup({ message: 'Đăng nhập Google bị hủy hoặc gặp sự cố mạng.', type: 'error' });
    },
  });

  // ==========================================
  // 4. XỬ LÝ FACEBOOK LOGIN
  // ==========================================
  const loginWithFacebook = async (response) => {
    if (response?.accessToken) {
      setIsSubmitting(true);
      try {
        const res = await axios.post(`${API_BASE_URL}/api/auth/facebook`, {
          token: response.accessToken,
        });

        const role = res.data?.role;
        saveAuthSession(res.data, { remember: true });

        setPopup({ message: 'Đăng nhập Facebook thành công!', type: 'success' });
        redirectByRole(role);
      } catch (error) {
        setIsSubmitting(false);
        console.error('Lỗi Backend FB:', error);
        let errMsg = 'Xác thực Facebook thất bại ở máy chủ.';
        if (
          error.response?.status === 403 ||
          error.response?.status === 423 ||
          error.response?.data?.error === 'ACCOUNT_LOCKED'
        ) {
          errMsg = error.response?.data?.message || 'Tài khoản hiện đang bị khóa, vui lòng gọi hotline để hỗ trợ.';
        }
        setPopup({ message: errMsg, type: 'error' });
      }
    } else {
      setPopup({ message: 'Đăng nhập Facebook bị hủy.', type: 'error' });
    }
  };

  return (
    <div className="auth-page-container">
      <Popup message={popup.message} type={popup.type} onClose={handlePopupClose} />

      {/* Background Shapes */}
      <div className="bg-shape-1"></div>
      <div className="bg-shape-2"></div>

      <div className="auth-wrapper">
        {/* --- CỘT TRÁI: LOGO & THƯ VIỆN SÁCH & QR --- */}
        <div className="auth-left">
          <div className="brand-logo">
            <img src={logo} alt="HALM BOOK Logo" style={{ width: '42px', height: '42px', borderRadius: '10px' }} />
            <span>HALM BOOK</span>
          </div>

          <div className="floating-element flower">🌱</div>
          <div className="floating-element star">📚</div>
          <div className="floating-element music">🥔</div>

          <div className="qr-container">
            <h3>Hệ Sinh Thái HALM BOOK</h3>
            <p>Đọc sách tinh tuyển, tích lũy Khoai Tây và trợ lý AI thông minh.</p>
            <div className="qr-box">
              <img
                src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=https://halmbook.vn&color=1e3c72"
                alt="HALM BOOK QR"
              />
              <div className="qr-logo-overlay">
                <i className="fa-solid fa-book-open"></i>
              </div>
            </div>
            <span className="qr-link">
              <i className="fa-solid fa-mobile-screen-button mr-1.5"></i>
              Quét mã để truy cập nhanh trên thiết bị
            </span>
          </div>
        </div>

        {/* --- CỘT PHẢI: FORM ĐĂNG NHẬP / ĐĂNG KÝ --- */}
        <div className="auth-right">
          {/* Thông báo nếu đây là cổng đăng nhập Quản Trị Viên */}
          {isAdminPortal && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                marginBottom: '18px',
                borderRadius: '12px',
                backgroundColor: 'rgba(30, 60, 114, 0.08)',
                border: '1.5px solid #1e3c72',
                color: '#1e3c72',
                fontSize: '0.82rem',
                fontWeight: '700',
              }}
            >
              <i className="fa-solid fa-shield-halved" style={{ fontSize: '1rem' }}></i>
              <span>Cổng Đăng Nhập Quản Trị Hệ Thống (Admin Portal)</span>
            </div>
          )}

          {/* ================= FORM ĐĂNG NHẬP ================= */}
          <div className={`form-container ${activeForm === 'login' ? 'active' : 'hidden'}`}>
            <h2 className="auth-title">Đăng Nhập</h2>

            <form onSubmit={handleLogin}>
              <div className="input-group">
                <input
                  type="text"
                  placeholder="Tên đăng nhập hoặc Email"
                  autoComplete="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="input-group" style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mật khẩu"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                  style={{ paddingRight: '46px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#636e72',
                    cursor: 'pointer',
                    fontSize: '1rem',
                  }}
                  tabIndex="-1"
                >
                  <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px',
                  fontSize: '0.88rem',
                }}
              >
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  Ghi nhớ đăng nhập
                </label>
                <Link to="/quenmatkhau" className="link-text" style={{ color: '#1976d2', fontWeight: '600' }}>
                  Quên mật khẩu?
                </Link>
              </div>

              <button type="submit" className="btn-submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <span>
                    <i className="fa-solid fa-spinner fa-spin mr-2"></i> Đang xác thực...
                  </span>
                ) : (
                  'Đăng Nhập Ngay'
                )}
              </button>
            </form>

            <div className="divider">Hoặc đăng nhập bằng</div>

            <div className="social-logins">
              <button
                type="button"
                className="social-btn google"
                title="Đăng nhập với Google"
                onClick={() => loginWithGoogle()}
                disabled={isSubmitting}
              >
                <i className="fab fa-brands fa-google"></i>
              </button>

              <FacebookLogin
                appId={import.meta.env.VITE_FACEBOOK_APP_ID || '1559212956245733'}
                autoLoad={false}
                fields="name,email,picture"
                callback={loginWithFacebook}
                render={(renderProps) => (
                  <button
                    type="button"
                    className="social-btn facebook"
                    title="Đăng nhập với Facebook"
                    onClick={renderProps.onClick}
                    disabled={isSubmitting}
                  >
                    <i className="fab fa-brands fa-facebook"></i>
                  </button>
                )}
              />
            </div>

            <div className="switch-form-text">
              <span style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>Chưa có tài khoản? </span>
              <button
                type="button"
                className="link-text"
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: '700' }}
                onClick={() => setActiveForm('register')}
              >
                Đăng ký thành viên
              </button>
            </div>

            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <Link to="/" className="link-text" style={{ fontSize: '0.85rem', color: '#636e72' }}>
                <i className="fa-solid fa-arrow-left mr-1.5"></i> Quay lại Cửa hàng sách
              </Link>
            </div>
          </div>

          {/* ================= FORM ĐĂNG KÝ ================= */}
          <div className={`form-container ${activeForm === 'register' ? 'active' : 'hidden'}`}>
            <h2 className="auth-title">Đăng Ký</h2>

            <form onSubmit={handleRegister}>
              <div className="input-group">
                <input
                  type="text"
                  placeholder="Tên đăng nhập (username)"
                  autoComplete="username"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="input-group">
                <input
                  type="email"
                  placeholder="Địa chỉ Email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="grid-2-cols">
                <div className="input-group" style={{ position: 'relative' }}>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="Mật khẩu"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={isSubmitting}
                    style={{ paddingRight: '40px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#636e72',
                      cursor: 'pointer',
                    }}
                    tabIndex="-1"
                  >
                    <i className={`fa-solid ${showNewPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>

                <div className="input-group" style={{ position: 'relative' }}>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Nhập lại mật khẩu"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isSubmitting}
                    style={{ paddingRight: '40px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#636e72',
                      cursor: 'pointer',
                    }}
                    tabIndex="-1"
                  >
                    <i className={`fa-solid ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: '16px', fontSize: '0.85rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  <input
                    type="checkbox"
                    id="dieuKhoan"
                    checked={dieuKhoan}
                    onChange={(e) => setDieuKhoan(e.target.checked)}
                  />
                  <span>
                    Tôi đồng ý với <span style={{ color: '#1976d2', fontWeight: '600' }}>Điều khoản</span> và{' '}
                    <span style={{ color: '#1976d2', fontWeight: '600' }}>Chính sách bảo mật</span> của HALM BOOK.
                  </span>
                </label>
              </div>

              <button type="submit" className="btn-submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <span>
                    <i className="fa-solid fa-spinner fa-spin mr-2"></i> Đang đăng ký...
                  </span>
                ) : (
                  'Tạo Tài Khoản Ngay'
                )}
              </button>
            </form>

            <div className="switch-form-text">
              <span style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>Đã có tài khoản? </span>
              <button
                type="button"
                className="link-text"
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: '700' }}
                onClick={() => setActiveForm('login')}
              >
                Đăng nhập ngay
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
