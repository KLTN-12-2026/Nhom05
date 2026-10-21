import { useState } from 'react';
import './css/DangNhap.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Popup from "./layout/Popup";
import logo from '../../img/logo.png';
import { useGoogleLogin } from '@react-oauth/google';
import fbLoginModule from 'react-facebook-login/dist/facebook-login-render-props';
import { saveAuthSession } from '../../service/AuthToken';

const API_BASE_URL = "http://localhost:8082";

const FacebookLogin = fbLoginModule.default || fbLoginModule;

const DangNhap = () => {
    const navigate = useNavigate();

    // --- STATE CHUYỂN ĐỔI FORM ---
    const [loginClass, setLoginClass] = useState('active');
    const [registerClass, setRegisterClass] = useState('hidden');

    // --- STATE ĐĂNG NHẬP ---
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // --- STATE ĐĂNG KÝ ---
    const [newUsername, setNewUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [xacNhanMatKhau, setXacNhanMatKhau] = useState('');
    const [email, setEmail] = useState('');
    const [dieuKhoan, setDieuKhoan] = useState(false);

    // --- STATE POPUP THÔNG BÁO ---
    const [popup, setPopup] = useState({
        message: '',
        type: 'error',
    });

    const handlePopupClose = () => {
        setPopup(prev => ({ ...prev, message: "" }));
    };

    const redirectAfterLogin = (role) => {
        setTimeout(() => {
            if (role === "ADMIN") {
                navigate("/admin");
            } else {
                // Recreate the page runtime so TrangChu's DOM-bound scripts initialize against fresh elements.
                window.location.assign("/trangchu");
            }
        }, 3000);
    };

    // --- XỬ LÝ FACEBOOK LOGIN ---
    const loginWithFacebook = async (response) => {
        if (response.accessToken) {
            try {
                const res = await axios.post(`${API_BASE_URL}/api/auth/facebook`, {
                    token: response.accessToken
                });

                const role = res.data.role;
                saveAuthSession(res.data, { remember: true });

                setPopup({ message: "Đăng nhập Facebook thành công!", type: "success" });
                redirectAfterLogin(role);

            } catch (error) {
                console.error("Lỗi Backend FB:", error);
                setPopup({ message: "Xác thực Facebook thất bại ở máy chủ.", type: "error" });
            }
        } else {
            setPopup({ message: "Đăng nhập Facebook bị hủy.", type: "error" });
        }
    };

    // --- XỬ LÝ GOOGLE LOGIN ---
    const loginWithGoogle = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            try {
                const response = await axios.post(`${API_BASE_URL}/api/auth/google`, {
                    token: tokenResponse.access_token
                });

                const role = response.data.role;
                saveAuthSession(response.data, { remember: true });

                setPopup({ message: "Đăng nhập Google thành công!", type: "success" });
                redirectAfterLogin(role);

            } catch (error) {
                setPopup({ message: "Xác thực Google thất bại ở máy chủ.", type: "error" });
                console.error("Lỗi Backend:", error);
            }
        },
        onError: () => {
            setPopup({ message: "Đăng nhập Google bị hủy hoặc lỗi mạng.", type: "error" });
        }
    });

    // ==========================================
    // 1. XỬ LÝ VALIDATE ĐĂNG NHẬP (ĐÃ SỬA LỖI ĐÁNH RƠI TOKEN)
    // ==========================================
    const handleLogin = async (e) => {
        e.preventDefault();

        const userVal = username.trim();
        const passVal = password.trim();

        if (!userVal) {
            return setPopup({ message: "Vui lòng nhập tên đăng nhập.", type: "error" });
        }
        if (!passVal) {
            return setPopup({ message: "Vui lòng nhập mật khẩu.", type: "error" });
        }

        try {
            const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
                username: userVal,
                password: passVal
            });

            const role = response.data.role;

            try {
                saveAuthSession(response.data);
            } catch (error) {
                return setPopup({ 
                    message: error.message,
                    type: "error" 
                });
            }

            setPopup({ message: "Đăng nhập thành công!", type: "success" });
            redirectAfterLogin(role);

        } catch (error) {
            setPopup({
                message: "Đăng nhập thất bại. Vui lòng kiểm tra lại tài khoản và mật khẩu.",
                type: "error"
            });
            console.error("Lỗi đăng nhập:", error);
        }
    };

    // ==========================================
    // 2. XỬ LÝ VALIDATE ĐĂNG KÝ
    // ==========================================
    const handleSubmit = async (e) => {
        e.preventDefault();

        const usernameVal = newUsername.trim();
        const emailVal = email.trim();

        if (!usernameVal) {
            return setPopup({ message: "Vui lòng nhập tên đăng nhập.", type: "error" });
        }
        if (usernameVal.length < 4 || usernameVal.length > 20) {
            return setPopup({ message: "Tên đăng nhập phải từ 4 đến 20 ký tự.", type: "error" });
        }
        const usernameRegex = /^[a-zA-Z0-9_]+$/;
        if (!usernameRegex.test(usernameVal)) {
            return setPopup({ message: "Tên đăng nhập không được chứa khoảng trắng hoặc ký tự đặc biệt.", type: "error" });
        }
        if (!emailVal) {
            return setPopup({ message: "Vui lòng nhập địa chỉ email.", type: "error" });
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailVal)) {
            return setPopup({ message: "Định dạng email không hợp lệ.", type: "error" });
        }
        if (!newPassword) {
            return setPopup({ message: "Vui lòng nhập mật khẩu.", type: "error" });
        }
        if (newPassword.length < 6) {
            return setPopup({ message: "Mật khẩu phải có ít nhất 6 ký tự.", type: "error" });
        }
        if (!xacNhanMatKhau) {
            return setPopup({ message: "Vui lòng nhập lại mật khẩu xác nhận.", type: "error" });
        }
        if (newPassword !== xacNhanMatKhau) {
            return setPopup({ message: "Mật khẩu xác nhận không khớp.", type: "error" });
        }
        if (!dieuKhoan) {
            return setPopup({ message: "Bạn phải đồng ý với điều khoản và chính sách bảo mật.", type: "error" });
        }

        const formData = {
            username: usernameVal,
            email: emailVal,
            password: newPassword,
        };

        try {
            await axios.post(`${API_BASE_URL}/api/auth/register`, formData);
            setPopup({
                message: "Đăng ký thành công! Vui lòng đăng nhập.",
                type: "success"
            });

            setNewUsername('');
            setEmail('');
            setNewPassword('');
            setXacNhanMatKhau('');
            setDieuKhoan(false);

            setTimeout(() => {
                switchForm('login');
            }, 3000);

        } catch (error) {
            let errorMessage = "Đăng ký thất bại. Vui lòng thử lại.";
            if (error.response && error.response.data) {
                errorMessage = typeof error.response.data === 'string'
                    ? error.response.data
                    : "Lỗi dữ liệu từ hệ thống.";
            }
            setPopup({ message: errorMessage, type: "error" });
            console.error("Lỗi đăng ký:", error);
        }
    };

    // ==========================================
    // 3. XỬ LÝ HIỆU ỨNG CHUYỂN FORM
    // ==========================================
    const switchForm = (type) => {
        if (type === 'register') {
            setLoginClass('');
            setTimeout(() => {
                setLoginClass('hidden');
                setRegisterClass('');
                setTimeout(() => setRegisterClass('active'), 20);
            }, 300);
        } else {
            setRegisterClass('');
            setTimeout(() => {
                setRegisterClass('hidden');
                setLoginClass('');
                setTimeout(() => setLoginClass('active'), 20);
            }, 300);
        }
    };

    return (
        <div className="auth-page-container">
            <div className="bg-shape-1"></div>
            <div className="bg-shape-2"></div>

            <Popup message={popup.message} type={popup.type} onClose={handlePopupClose}></Popup>

            <svg className="bg-graphic" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
                <path fill="#fff0f5" d="M38.8,-63.9C52.7,-58.3,68,-52.1,76.5,-41.2C84.9,-30.2,86.5,-15.1,84.1,-1.4C81.8,12.3,75.4,24.6,67.7,35.8C59.9,47.1,50.7,57.2,39.3,64.3C27.9,71.4,13.9,75.4,-0.5,76.2C-14.8,77,-29.6,74.5,-40.8,67.4C-52.1,60.2,-59.8,48.4,-67.2,36.4C-74.5,24.4,-81.4,12.2,-83.4,-1.2C-85.4,-14.5,-82.4,-29,-74,-40.1C-65.6,-51.2,-51.8,-58.9,-38.7,-64.7C-25.5,-70.5,-12.8,-74.5,-0.1,-74.3C12.5,-74.2,25,-69.5,38.8,-63.9Z" transform="translate(200 200) scale(1.2)" />
                <path fill="#e3f2fd" d="M47.5,-69C58.4,-58.6,62,-40.5,64.8,-24.4C67.6,-8.3,69.5,5.8,64.9,17.4C60.3,29,49.2,38,37.3,44.7C25.4,51.4,12.7,55.9,0.3,55.3C-12.1,54.8,-24.2,49.2,-37.2,42.7C-50.2,36.2,-64,28.8,-70.6,17.4C-77.2,5.9,-76.5,-9.7,-71.1,-24.1C-65.7,-38.5,-55.6,-51.7,-43.1,-61.7C-30.6,-71.8,-15.3,-78.7,1.2,-80.4C17.7,-82.1,35.5,-78.6,47.5,-69Z" transform="translate(180 220) scale(0.9)" />
                <g transform="translate(130 150) rotate(-15) scale(0.8)">
                    <path fill="#ffffff" stroke="#ff7eb3" strokeWidth="4" strokeLinejoin="round" d="M20,20 Q60,10 100,20 L100,90 Q60,80 20,90 Z" />
                    <path fill="#fce4ec" stroke="#ff7eb3" strokeWidth="4" strokeLinejoin="round" d="M100,20 Q140,10 180,20 L180,90 Q140,80 100,90 Z" />
                    <path fill="#ff7eb3" d="M100,20 L100,90" stroke="#ff7eb3" strokeWidth="4" />
                </g>
            </svg>

            <div className="auth-wrapper">
                {/* --- MẶT TRÁI (QR Code & Logo) --- */}
                <div className="auth-left">
                    <div className="floating-element flower">🌸</div>
                    <div className="floating-element star">✨</div>
                    <div className="floating-element music">🎵</div>

                    <div className="brand-logo">
                        <img
                            src={logo}
                            alt="HALM BOOK"
                            style={{ height: '60px', width: 'auto', objectFit: 'contain' }}
                        />
                        <div>
                            <span style={{ color: '#16325c' }}>HALM</span>
                            <span style={{ color: '#9b51e0' }}> BOOK</span>
                        </div>
                    </div>

                    <div className="qr-container">
                        <h3>Đăng nhập bằng mã QR</h3>
                        <p>Sử dụng ứng dụng HALM BOOK để quét mã</p>
                        <div className="qr-box">
                            <img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=HALMBOOK_LOGIN_TOKEN" alt="QR Code" />
                            <div className="qr-logo-overlay">
                                <i className="fas fa-book-open"></i>
                            </div>
                        </div>
                        <a href="#" className="qr-link">Tải ứng dụng ngay</a>
                    </div>
                </div>

                {/* --- MẶT PHẢI (Form Đăng nhập/Đăng ký) --- */}
                <div className="auth-right">

                    {/* Form Đăng nhập */}
                    <div className={`form-container ${loginClass}`}>
                        <h2 className="auth-title">Đăng nhập</h2>
                        <div className="input-group">
                            <input
                                type="text"
                                placeholder="Tên đăng nhập"
                                required
                                id="username"
                                value={username} // Thêm value để đồng bộ state
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>
                        <div className="input-group">
                            <input
                                type="password"
                                placeholder="Mật khẩu"
                                required
                                id="password"
                                value={password} // Thêm value để đồng bộ state
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                        <div className="form-actions">
                            <a href="/quenmatkhau" className="link-text">Quên mật khẩu?</a>
                        </div>
                        <button className="btn-submit" onClick={handleLogin}>
                            Here We Go
                        </button>
                        <div className="divider">Hoặc đăng nhập bằng</div>
                        <div className="social-logins">
                            <button className="social-btn google" onClick={loginWithGoogle}>
                                <i className="fab fa-google"></i>
                            </button>
                            <FacebookLogin
                                appId="1559212956245733" // Lấy từ https://developers.facebook.com/
                                autoLoad={false}
                                fields="name,email,picture"
                                callback={loginWithFacebook}
                                render={renderProps => (
                                    <button className="social-btn facebook" onClick={renderProps.onClick}>
                                        <i className="fab fa-facebook"></i>
                                    </button>
                                )}
                            />
                            <button className="social-btn apple"><i className="fab fa-apple"></i></button>
                        </div>

                        <div className="switch-form-text">
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Chưa có tài khoản? </span>
                            <button type="button" className="link-text border-0 bg-transparent cursor-pointer" onClick={() => switchForm('register')}>Đăng ký ngay</button>
                        </div>
                    </div>

                    {/* Form Đăng ký */}
                    <div className={`form-container ${registerClass}`}>
                        <h2 className="auth-title">Đăng ký</h2>
                        <div className="input-group">
                            <input
                                type="text"
                                placeholder="Tên đăng nhập"
                                required
                                value={newUsername} // Thêm value để đồng bộ state
                                onChange={(e) => setNewUsername(e.target.value)}
                            />
                        </div>

                        <div className="grid-1-cols">
                            <div className="input-group">
                                <input
                                    type="email"
                                    placeholder="Gmail"
                                    required
                                    value={email} // Thêm value để đồng bộ state
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="grid-2-cols">
                            <div className="input-group">
                                <input
                                    type="password"
                                    placeholder="Mật khẩu"
                                    required
                                    value={newPassword} // Thêm value để đồng bộ state
                                    onChange={(e) => setNewPassword(e.target.value)}
                                />
                            </div>
                            <div className="input-group">
                                <input
                                    type="password"
                                    placeholder="Nhập lại mật khẩu"
                                    required
                                    value={xacNhanMatKhau} // Thêm value để đồng bộ state
                                    onChange={(e) => setXacNhanMatKhau(e.target.value)}
                                />
                            </div>
                        </div>
                        <div>
                            <input
                                type="checkbox"
                                id="dieuKhoan"
                                checked={dieuKhoan}
                                onChange={(e) => setDieuKhoan(e.target.checked)}
                            />
                            <label htmlFor="dieuKhoan">Tôi đồng ý với <a href="/terms" className="link-text">Điều khoản</a> và <a href="/privacy" className="link-text">Chính sách bảo mật</a></label>
                        </div>

                        <div className="form-actions">
                            <button type="button" className="link-text border-0 bg-transparent cursor-pointer" onClick={() => switchForm('login')}>Đã có tài khoản?</button>
                        </div>

                        <button className="btn-submit" onClick={handleSubmit}>
                            Here We Go
                        </button>

                        <div className="divider">Hoặc đăng ký bằng</div>

                        <div className="social-logins">
                            <button className="social-btn google"><i className="fab fa-google"></i></button>
                            <button className="social-btn facebook"><i className="fab fa-facebook"></i></button>
                            <button className="social-btn apple"><i className="fab fa-apple"></i></button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default DangNhap;