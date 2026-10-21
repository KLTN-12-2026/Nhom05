import { useState } from "react";
import { ToastContainer, toast, Zoom } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./css/QuenMatKhau.css";
import logo from '../../img/logo.png';

export default function ForgotPassword() {
    // --- STATE QUẢN LÝ CÁC BƯỚC ---
    const [step, setStep] = useState("forgot");
    
    // --- STATE DỮ LIỆU ---
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // --- XỬ LÝ SỰ KIỆN DUY NHẤT ---   
    const handleSubmit = async (event) => {
        event.preventDefault();

        // ==========================================
        // 1. XỬ LÝ BƯỚC NHẬP EMAIL -> GỬI OTP
        // ==========================================
        if (step === "forgot") {
            if (!email.trim()) {
                toast.warning("Vui lòng nhập email của bạn!", { position: "top-right" });
                return;
            }

            const id = toast.loading("Đang gửi mã OTP, vui lòng chờ...", {
                style: { backgroundColor: "#90caf9", color: "#ffffff", fontWeight: "bold" }
            });

            try {
                const response = await fetch("http://localhost:8082/api/password/send-otp", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: email })
                });

                const text = await response.text();

                if (response.ok) {
                    toast.update(id, {
                        render: `Đã gửi mã OTP tới ${email}`,
                        type: "success",
                        isLoading: false,
                        autoClose: 4000,
                        style: {} // Trả lại màu xanh lá
                    });
                    setStep("otp");
                } else {
                    toast.update(id, {
                        render: text || "Lỗi gửi OTP.",
                        type: "error",
                        isLoading: false,
                        autoClose: 3000,
                        style: {} // Trả lại màu đỏ
                    });
                }
            } catch (error) {
                toast.update(id, {
                    render: "Không thể kết nối đến máy chủ Backend.",
                    type: "error",
                    isLoading: false,
                    autoClose: 3000,
                    style: {}
                });
            }
        }

        // ==========================================
        // 2. XỬ LÝ BƯỚC NHẬP OTP -> XÁC THỰC
        // ==========================================
        else if (step === "otp") {
            if (otp.trim().length !== 6) {
                toast.warning("Vui lòng nhập đủ 6 chữ số OTP.", { position: "top-right" });
                return;
            }

            const id = toast.loading("Đang xác thực OTP...", {
                style: { backgroundColor: "#90caf9", color: "#ffffff", fontWeight: "bold" }
            });

            try {
                const response = await fetch("http://localhost:8082/api/password/verify-otp", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: email, otp: otp })
                });

                const text = await response.text();

                if (response.ok) {
                    toast.update(id, { 
                        render: "OTP chính xác!", 
                        type: "success", 
                        isLoading: false, 
                        autoClose: 2000, 
                        style: {} 
                    });
                    setStep("reset"); 
                } else {
                    toast.update(id, { 
                        render: text || "Mã OTP không đúng hoặc đã hết hạn.", 
                        type: "error", 
                        isLoading: false, 
                        autoClose: 3000, 
                        style: {} 
                    });
                }
            } catch (error) {
                toast.update(id, { 
                    render: "Lỗi kết nối đến máy chủ.", 
                    type: "error", 
                    isLoading: false, 
                    autoClose: 3000, 
                    style: {} 
                });
            }
        }

        // ==========================================
        // 3. XỬ LÝ BƯỚC ĐỔI MẬT KHẨU MỚI
        // ==========================================
        else if (step === "reset") {
            if (password.length < 6) {
                toast.warning("Mật khẩu cần có ít nhất 6 ký tự.", { position: "top-right" });
                return;
            }
            if (password !== confirmPassword) {
                toast.error("Mật khẩu xác nhận không khớp!", { position: "top-right" });
                return;
            }

            const id = toast.loading("Đang cập nhật mật khẩu...", {
                style: { backgroundColor: "#90caf9", color: "#ffffff", fontWeight: "bold" }
            });

            try {
                const response = await fetch("http://localhost:8082/api/password/reset-password", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: email, newPassword: password })
                });

                const text = await response.text();

                if (response.ok) {
                    toast.update(id, { 
                        render: "Đổi mật khẩu thành công! Đang chuyển hướng...", 
                        type: "success", 
                        isLoading: false, 
                        autoClose: 2000, 
                        style: {} 
                    });
                    
                    // Chuyển về trang đăng nhập sau 2 giây
                    setTimeout(() => {
                        window.location.href = "/";
                    }, 2100);
                } else {
                    toast.update(id, { 
                        render: text || "Đổi mật khẩu thất bại.", 
                        type: "error", 
                        isLoading: false, 
                        autoClose: 3000, 
                        style: {} 
                    });
                }
            } catch (error) {
                toast.update(id, { 
                    render: "Lỗi kết nối đến máy chủ.", 
                    type: "error", 
                    isLoading: false, 
                    autoClose: 3000, 
                    style: {} 
                });
            }
        }
    };

    return (
        <main className="forgot-page">
            {/* NHÚNG BỘ CHỨA TOAST (Đã căn giữa và thêm hiệu ứng Zoom) */}
            <ToastContainer
                position="top-center"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={true}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="colored"
                transition={Zoom}
                style={{
                    width: "450px",
                    fontSize: "1.1rem",
                    fontWeight: "500",
                    textAlign: "center",
                    marginTop: "20px"
                }}
            />

            <div className="bg-shape-1" />
            <div className="bg-shape-2" />

            <svg className="bg-graphic" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path fill="#fff0f5" d="M38.8,-63.9C52.7,-58.3,68,-52.1,76.5,-41.2C84.9,-30.2,86.5,-15.1,84.1,-1.4C81.8,12.3,75.4,24.6,67.7,35.8C59.9,47.1,50.7,57.2,39.3,64.3C27.9,71.4,13.9,75.4,-0.5,76.2C-14.8,77,-29.6,74.5,-40.8,67.4C-52.1,60.2,-59.8,48.4,-67.2,36.4C-74.5,24.4,-81.4,12.2,-83.4,-1.2C-85.4,-14.5,-82.4,-29,-74,-40.1C-65.6,-51.2,-51.8,-58.9,-38.7,-64.7C-25.5,-70.5,-12.8,-74.5,-0.1,-74.3C12.5,-74.2,25,-69.5,38.8,-63.9Z" transform="translate(200 200) scale(1.2)" />
                <path fill="#e3f2fd" d="M47.5,-69C58.4,-58.6,62,-40.5,64.8,-24.4C67.6,-8.3,69.5,5.8,64.9,17.4C60.3,29,49.2,38,37.3,44.7C25.4,51.4,12.7,55.9,0.3,55.3C-12.1,54.8,-24.2,49.2,-37.2,42.7C-50.2,36.2,-64,28.8,-70.6,17.4C-77.2,5.9,-76.5,-9.7,-71.1,-24.1C-65.7,-38.5,-55.6,-51.7,-43.1,-61.7C-30.6,-71.8,-15.3,-78.7,1.2,-80.4C17.7,-82.1,35.5,-78.6,47.5,-69Z" transform="translate(180 220) scale(0.9)" />
                <g transform="translate(130 150) rotate(-15) scale(0.8)">
                    <path fill="#ffffff" stroke="#ff7eb3" strokeWidth="4" strokeLinejoin="round" d="M20,20 Q60,10 100,20 L100,90 Q60,80 20,90 Z" />
                    <path fill="#fce4ec" stroke="#ff7eb3" strokeWidth="4" strokeLinejoin="round" d="M100,20 Q140,10 180,20 L180,90 Q140,80 100,90 Z" />
                    <path fill="#ff7eb3" d="M100,20 L100,90" stroke="#ff7eb3" strokeWidth="4" />
                </g>
            </svg>

            <div className="auth-wrapper">
                <section className="auth-left">
                    <div className="floating-element flower">🌸</div>
                    <div className="floating-element star">✨</div>
                    <div className="floating-element music">🎵</div>
                    <div className="brand-logo">
                        <img src={logo} alt="HALM BOOK" style={{ height: 60, width: "auto", objectFit: "contain" }} />
                        HALM BOOK
                    </div>
                    <div className="qr-container">
                        <h3>Đăng nhập bằng mã QR</h3>
                        <p>Sử dụng ứng dụng HALM BOOK để quét mã</p>
                        <div className="qr-box">
                            <img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=HALMBOOK_LOGIN_TOKEN" alt="QR Code" />
                            <div className="qr-logo-overlay"><i className="fas fa-book-open" aria-hidden="true" /></div>
                        </div>
                        <a href="#" className="qr-link" onClick={(e) => e.preventDefault()}>Tải ứng dụng ngay</a>
                    </div>
                </section>

                <section className="auth-right">
                    
                    {/* BƯỚC 1: NHẬP EMAIL */}
                    {step === "forgot" && (
                        <form className="form-container active" onSubmit={handleSubmit}>
                            <h2 className="auth-title">Quên mật khẩu</h2>
                            <p className="auth-desc">Vui lòng nhập email để nhận mã xác thực.</p>
                            <div className="input-group">
                                <input type="text" value={email} onChange={(e) => setEmail(e.target.value)} placeholder=" Gmail" required />
                            </div>
                            <button className="btn-submit" type="submit">Nhận mã</button>
                            <div className="switch-form-text" style={{ marginTop: 35 }}>
                                <a href="/" className="link-text"><i className="fas fa-arrow-left" aria-hidden="true" /> Quay lại Đăng nhập</a>
                            </div>
                        </form>
                    )}

                    {/* BƯỚC 2: NHẬP OTP */}
                    {step === "otp" && (
                        <form className="form-container active" onSubmit={handleSubmit}>
                            <h2 className="auth-title">Nhập mã OTP</h2>
                            <p className="auth-desc">Mã xác nhận gồm 6 chữ số đã được gửi đến bạn.</p>
                            <div className="input-group">
                                <input type="text" inputMode="numeric" pattern="[0-9]{6}" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="Nhập mã OTP" required style={{ textAlign: "center", letterSpacing: 5, fontWeight: 700, fontSize: "1.2rem" }} maxLength={6} />
                            </div>
                            <button className="btn-submit" type="submit">Xác nhận</button>
                            <div className="switch-form-text">
                                <span style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>Chưa nhận được mã? </span>
                                <button type="button" className="link-text resend-link" onClick={() => toast.info("Tính năng gửi lại đang phát triển.")}>Gửi lại</button>
                            </div>
                            <div className="switch-form-text" style={{ marginTop: 15 }}>
                                <button type="button" className="link-text" onClick={() => setStep("forgot")}><i className="fas fa-arrow-left" aria-hidden="true" /> Quay lại</button>
                            </div>
                        </form>
                    )}

                    {/* BƯỚC 3: ĐẶT LẠI MẬT KHẨU */}
                    {step === "reset" && (
                        <form className="form-container active" onSubmit={handleSubmit}>
                            <h2 className="auth-title">Đặt lại mật khẩu</h2>
                            <p className="auth-desc">Vui lòng nhập mật khẩu mới cho tài khoản của bạn.</p>
                            <div className="input-group">
                                <input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mật khẩu mới" required />
                            </div>
                            <div className="input-group">
                                <input type="password" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Nhập lại mật khẩu mới" required />
                            </div>
                            <button className="btn-submit" type="submit">Xác nhận đổi</button>
                            <div className="switch-form-text" style={{ marginTop: 35 }}>
                                <a href="/" className="link-text"><i className="fas fa-times" aria-hidden="true" /> Hủy bỏ</a>
                            </div>
                        </form>
                    )}
                </section>
            </div>
        </main>
    );
}