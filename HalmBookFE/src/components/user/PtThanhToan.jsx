import React, { useState, useEffect, useRef } from 'react';
import { isDarkMode, applyTheme } from '@/utils/theme';

export default function Payment() {
  const [isDark, setIsDark] = useState(() => isDarkMode());
  
  // Payment states
  const [currentPackPrice, setCurrentPackPrice] = useState(99000);
  const [currentPackTitle, setCurrentPackTitle] = useState('Gói VIP 1 Tháng');
  const [currentPackBenefit, setCurrentPackBenefit] = useState('Đọc sách không giới hạn 30 ngày');
  const [currentAddedKhoai, setCurrentAddedKhoai] = useState(0);
  const [currentGateway, setCurrentGateway] = useState('vietqr'); // 'vietqr' | 'ewallet' | 'atm'
  const [currentEwallet, setCurrentEwallet] = useState('momo');
  const [currentAtmBank, setCurrentAtmBank] = useState('Vietcombank');
  
  // User state
  const [userWalletBalance, setUserWalletBalance] = useState(1250);
  
  // UI states
  const [timeLeft, setTimeLeft] = useState(899);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [toast, setToast] = useState({ show: false, title: '', message: '' });
  const [copiedId, setCopiedId] = useState(null);
  const [transCode, setTransCode] = useState('');

  const canvasRef = useRef(null);
  let animationFrameRef = useRef(null);

  const ewalletConfig = {
    momo: {
      name: 'Ví MoMo Official',
      qrData: '2|99|0909090909|MOMO|',
      btnText: 'Mở Ví MoMo',
      desc: 'Quét mã QR bằng ứng dụng <strong>Ví MoMo</strong> trên điện thoại hoặc bấm nút mở ví:'
    },
    zalopay: {
      name: 'ZaloPay Official',
      qrData: 'https://zalopay.vn/pay?acc=0909090909&amount=',
      btnText: 'Mở Ví ZaloPay',
      desc: 'Mở ứng dụng <strong>ZaloPay</strong> hoặc Zalo để quét mã xác thực thanh toán:'
    },
    vnpay: {
      name: 'VNPAY-QR Đa Ngân Hàng',
      qrData: 'https://vnpay.vn/pay?merchant=HALMBOOK&amount=',
      btnText: 'Mở App Bank Quét VNPAY',
      desc: 'Hỗ trợ quét qua ứng dụng của <strong>34+ ngân hàng</strong> (Vietcombank, MB, Techcombank,...):'
    }
  };

  useEffect(() => {
    // Inject Tailwind Script
    const tailwindScript = document.createElement('script');
    tailwindScript.src = "https://cdn.tailwindcss.com";
    tailwindScript.onload = () => {
      window.tailwind.config = {
        darkMode: 'class',
        theme: {
          extend: {
            fontFamily: {
              sans: ['var(--font-ui)', 'sans-serif'],
              display: ['var(--font-display)', 'sans-serif'],
              metadata: ['var(--font-metadata)', 'sans-serif'],
              'metadata-spec': ['var(--font-metadata)', 'sans-serif'],
              editorial: ['var(--font-editorial)', 'sans-serif'],
            },
            colors: {
              paper: { 50: '#FAF8F5', 100: '#F5F2EB', 200: '#EAE5D9', DEFAULT: '#F7F4EE', surface: '#FFFEFA', border: '#E3DDD0' },
              ink: { 50: '#F5F5F4', 300: '#A8A6A1', muted: '#66645E', DEFAULT: '#1E1F1D', pure: '#111210' },
              wine: { DEFAULT: '#8E3038', light: '#A83B46', dark: '#6F252C' },
              gold: { DEFAULT: '#B8860B', light: '#D4AF37' },
              night: { bg: '#111210', surface: '#181916', card: '#20221E', border: '#2C2E29', text: '#EDE9DF', muted: '#96938B' }
            }
          }
        }
      };
    };
    document.head.appendChild(tailwindScript);

    // Inject Phosphor Icons script
    const phosphorScript = document.createElement('script');
    phosphorScript.src = "https://unpkg.com/@phosphor-icons/web";
    document.head.appendChild(phosphorScript);

    applyTheme(isDark);

    const handleThemeChange = (e) => {
      if (typeof e.detail?.isDark === 'boolean') {
        setIsDark(e.detail.isDark);
      }
    };
    window.addEventListener('halm-theme-change', handleThemeChange);

    return () => {
      window.removeEventListener('halm-theme-change', handleThemeChange);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => prev <= 0 ? 900 : prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    applyTheme(newTheme);
  };

  const showToast = (title, message) => {
    setToast({ show: true, title, message });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  const copyText = (text, id) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
      showToast('Sao chép thành công', `Đã lưu: ${text}`);
    });
  };

  const formatCurrency = (num) => {
    return new Intl.NumberFormat('vi-VN').format(num) + 'đ';
  };

  const selectVipPackage = (price, title, benefit, addedKhoai = 0) => {
    setCurrentPackPrice(price);
    setCurrentPackTitle(title);
    setCurrentPackBenefit(benefit);
    setCurrentAddedKhoai(addedKhoai);
  };

  const downloadQrCode = () => {
    const link = document.createElement('a');
    link.href = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=2|99|0909090909|MB|${currentPackPrice}|HALM-TOPUP-98246|HALMBOOK`;
    link.download = `VietQR_HALM_TOPUP_98246.png`;
    link.target = '_blank';
    link.click();
    showToast('Tải mã QR', 'Đã lưu ảnh QR nạp tiền vào máy.');
  };

  const processPayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setTransCode('#HLM-TOPUP-' + Math.floor(100000 + Math.random() * 900000));
      if (currentAddedKhoai > 0) {
        setUserWalletBalance(prev => prev + currentAddedKhoai);
      }
      setIsSuccessModalOpen(true);
      setTimeout(triggerCelebrationConfetti, 50);
    }, 850);
  };

  const triggerCelebrationConfetti = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const colors = ['#8E3038', '#B8860B', '#D4AF37', '#10B981', '#3B82F6', '#EC4899'];
    for (let i = 0; i < 90; i++) {
      particles.push({
        x: canvas.width / 2,
        y: canvas.height / 2 - 50,
        r: Math.random() * 5 + 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 14,
        vy: (Math.random() - 0.8) * 15,
        gravity: 0.28,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        opacity: 1
      });
    }

    function update() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.rotation += p.rotationSpeed;
        p.opacity -= 0.01;

        if (p.opacity > 0) {
          alive = true;
          ctx.save();
          ctx.globalAlpha = p.opacity;
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.r, -p.r, p.r * 2, p.r * 1.4);
          ctx.restore();
        }
      });

      if (alive) {
        animationFrameRef.current = requestAnimationFrame(update);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
    update();
  };

  const renderStars = () => {
    if (!isDark) return null;
    const stars = [];
    const count = window.innerWidth > 768 ? 90 : 40;
    for (let i = 0; i < count; i++) {
      const size = Math.random() * 1.5 + 0.8;
      stars.push(
        <div key={i} className="star" style={{
          width: `${size}px`, height: `${size}px`,
          top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%`,
          animation: `starTwinkle ${Math.random() * 3.5 + 2.5}s infinite ease-in-out ${Math.random() * 4}s`
        }} />
      );
    }
    return <div id="starry-background">{stars}</div>;
  };

  const getPayButtonText = () => {
    if (isProcessing) return <><i className="ph-bold ph-spinner animate-spin text-base mr-2"></i> Đang khớp lệnh thanh toán bảo mật...</>;
    const formatted = formatCurrency(currentPackPrice);
    if (currentGateway === 'vietqr') return `XÁC NHẬN CHUYỂN KHOẢN VIETQR (${formatted})`;
    if (currentGateway === 'ewallet') return `THANH TOÁN QUA VÍ ${currentEwallet.toUpperCase()} (${formatted})`;
    if (currentGateway === 'atm') return `THANH TOÁN THẺ ATM ${currentAtmBank} (${formatted})`;
    return `XÁC NHẬN THANH TOÁN (${formatted})`;
  };

  const getGatewayNameForModal = () => {
    if (currentGateway === 'vietqr') return 'VietQR (MB Bank 24/7)';
    if (currentGateway === 'ewallet') return `Ví Điện Tử ${currentEwallet.toUpperCase()}`;
    if (currentGateway === 'atm') return `Thẻ ATM Nội Địa (${currentAtmBank})`;
    return 'VietQR';
  };

  const mins = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const secs = (timeLeft % 60).toString().padStart(2, '0');
  const activeEwalletConf = ewalletConfig[currentEwallet] || ewalletConfig.momo;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        :root { --font-display: "Inter", sans-serif; --font-ui: "Inter", sans-serif; --font-metadata: "Roboto", sans-serif; --font-editorial: "Open Sans", sans-serif; }
        html { scroll-behavior: smooth; }
        body { font-family: var(--font-ui); background-color: #F7F4EE; color: #1E1F1D; overflow-x: hidden; -webkit-font-smoothing: antialiased; transition: background-color 0.4s ease, color 0.4s ease; }
        .dark body { background-color: #111210; color: #EDE9DF; }
        .font-display-hero { font-family: var(--font-display); font-weight: 900; letter-spacing: -0.03em; }
        .font-editorial-body { font-family: var(--font-editorial); line-height: 1.7; }
        .font-metadata-spec { font-family: var(--font-metadata); }
        .paper-grain { background-image: radial-gradient(rgba(30, 31, 29, 0.04) 1px, transparent 1px); background-size: 28px 28px; }
        .dark .paper-grain { background-image: radial-gradient(rgba(237, 233, 223, 0.04) 1px, transparent 1px); background-size: 28px 28px; }
        #starry-background { position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 1; opacity: 1; transition: opacity 0.6s ease; }
        .star { position: absolute; background-color: #fff; border-radius: 50%; pointer-events: none; }
        @keyframes starTwinkle { 0%, 100% { opacity: 0.2; transform: scale(0.8); } 50% { opacity: 0.9; transform: scale(1.3); } }
        .qr-scanner-box { position: relative; border-radius: 16px; border: 2px dashed rgba(142, 48, 56, 0.4); padding: 14px; background: #FFFFFF; }
        .dark .qr-scanner-box { border-color: rgba(212, 175, 55, 0.4); background: #181916; }
        .scan-laser-line { position: absolute; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, transparent, #8E3038, transparent); box-shadow: 0 0 10px #8E3038; animation: scanLaser 2.4s ease-in-out infinite; pointer-events: none; }
        .dark .scan-laser-line { background: linear-gradient(90deg, transparent, #D4AF37, transparent); box-shadow: 0 0 12px #D4AF37; }
        @keyframes scanLaser { 0%, 100% { top: 6%; opacity: 0.2; } 50% { top: 92%; opacity: 1; } }
        #toast-notification { position: fixed; bottom: 24px; right: 24px; z-index: 100; transform: translateY(120%); opacity: 0; transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1); pointer-events: none; }
        #toast-notification.show { transform: translateY(0); opacity: 1; pointer-events: auto; }
      `}} />

      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Open+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400;1,600&family=Roboto:wght@300;400;500;700;900&display=swap" rel="stylesheet" />
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />

      <div className="paper-grain min-h-screen flex flex-col relative selection:bg-wine selection:text-white">
        {renderStars()}

        {}
        <div id="toast-notification" className={`flex items-center gap-3 px-5 py-3.5 rounded-xl bg-paper-surface dark:bg-night-card border border-wine/30 dark:border-gold/40 shadow-2xl text-ink dark:text-night-text ${toast.show ? 'show' : ''}`}>
          <div className="w-8 h-8 rounded-full bg-wine/10 dark:bg-gold/20 flex items-center justify-center text-wine dark:text-gold shrink-0">
            <i className="ph-bold ph-check text-base"></i>
          </div>
          <div>
            <div className="font-display font-bold text-xs">{toast.title}</div>
            <div className="font-editorial text-xs text-ink-muted dark:text-night-muted">{toast.message}</div>
          </div>
        </div>

        {}
        <header className="sticky top-0 inset-x-0 z-40 py-3.5 border-b border-paper-border/80 dark:border-night-border/80 bg-paper/90 dark:bg-night-bg/90 backdrop-blur-md transition-colors">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-4">
            <a href="tc.html" className="flex items-center gap-3 group shrink-0" aria-label="HALM BOOK Về Trang Chủ">
              <div className="w-10 h-10 rounded-lg bg-wine flex items-center justify-center text-white shadow group-hover:scale-105 transition-transform">
                <img src="img/icon-removebg-preview.png" alt="Logo" className="w-7 h-7 object-contain" onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=80&q=80'; }} />
              </div>
              <div className="flex flex-col">
                <span className="font-display font-black text-xl tracking-tight text-ink dark:text-night-text leading-tight group-hover:text-wine dark:group-hover:text-gold transition-colors">
                  HALM BOOK
                </span>
                <span className="font-metadata-spec text-[8px] uppercase tracking-[0.2em] font-semibold text-ink-muted dark:text-night-muted -mt-0.5">
                  VIP Membership Gateway
                </span>
              </div>
            </a>
            <div className="flex items-center gap-3 font-metadata-spec text-xs">
              <a href="wallet.html" className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold/10 hover:bg-gold/20 border border-gold/40 text-gold-dark dark:text-gold shadow-xs transition-colors" title="Chuyển sang màn Ví Khoai Tây">
                <i className="ph-fill ph-wallet text-sm"></i>
                <span className="font-bold">Ví Khoai Tây: {userWalletBalance.toLocaleString('vi-VN')}</span>
              </a>
              <a href="cart.html" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-paper-border dark:border-night-border hover:border-wine dark:hover:border-gold font-bold text-ink dark:text-night-text transition-colors">
                <i className="ph-bold ph-shopping-bag text-xs"></i>
                <span>Giỏ Hàng</span>
              </a>
              <button onClick={toggleTheme} className="p-2 rounded-full text-ink dark:text-night-text hover:bg-paper-200 dark:hover:bg-night-card transition-colors" title="Đổi giao diện Sáng / Tối" aria-label="Đổi giao diện Sáng / Tối">
                <i className={`ph-bold ${isDark ? 'ph-sun' : 'ph-moon'} text-lg`}></i>
              </button>
            </div>
          </div>
        </header>

        {}
        <main className="flex-grow py-8 sm:py-10 relative z-10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            
            <div className="mb-6 p-4 rounded-2xl bg-paper-surface dark:bg-night-surface border-2 border-gold/40 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-metadata-spec transition-all">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gold/15 text-gold flex items-center justify-center text-2xl shrink-0 border border-gold/30">🥔</div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-gold/20 text-gold-dark dark:text-gold text-[9px] font-black uppercase">PHÂN HỆ RIÊNG BIỆT</span>
                    <strong className="text-xs sm:text-sm text-ink dark:text-night-text font-display font-bold">Bạn muốn nạp điểm Khoai hoặc xem số dư ví?</strong>
                  </div>
                  <p className="text-[11px] text-ink-muted dark:text-night-muted mt-0.5">
                    Ví Khoai Tây đã được tách thành màn hình quản lý chuyên biệt với chuỗi điểm danh 7 ngày, đổi quà voucher và nhiệm vụ Read-to-Earn.
                  </p>
                </div>
              </div>
              <a href="wallet.html" className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-wine hover:bg-wine-dark text-white font-bold text-xs shrink-0 shadow transition-all hover:-translate-y-0.5">
                <i className="ph-fill ph-wallet"></i>
                <span>Mở Ví Khoai Tây Ngay</span>
                <i className="ph-bold ph-arrow-right text-[10px]"></i>
              </a>
            </div>

            <div className="pb-6 border-b border-paper-border dark:border-night-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-metadata-spec font-bold tracking-widest text-wine dark:text-gold uppercase">
                  <i className="ph-bold ph-shield-check"></i> CỔNG THANH TOÁN TIỀN MẶT & ĐIỆN TỬ
                </span>
                <h1 className="font-display font-black text-2xl sm:text-3xl text-ink dark:text-night-text">Đăng Ký Gói Hội Viên VIP</h1>
                <p className="font-editorial-body text-xs text-ink-muted dark:text-night-muted">
                  Mở khóa toàn quyền đọc hơn 10.000 tác phẩm số, sách nói và tư liệu lịch sử bản quyền cao cấp.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-paper-surface dark:bg-night-surface border border-paper-border dark:border-night-border text-xs font-metadata-spec font-semibold text-ink-muted dark:text-night-muted shadow-sm self-start sm:self-auto">
                <i className="ph-fill ph-crown text-gold text-base"></i>
                <span>Quyền Lợi VIP Không Giới Hạn</span>
              </div>
            </div>

            {}
            <div className="max-w-4xl mx-auto pt-6">
              <div className="rounded-3xl bg-paper-surface dark:bg-night-surface border border-paper-border dark:border-night-border shadow-xl overflow-hidden transition-colors">
                
                <div className="p-6 sm:p-7 border-b border-paper-border dark:border-night-border bg-paper-surface dark:bg-night-surface space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="font-display font-bold text-base text-ink dark:text-night-text flex items-center gap-2">
                      <i className="ph-fill ph-crown text-gold text-lg"></i>
                      <span>1. Chọn Gói Hội Viên Phù Hợp:</span>
                    </h2>
                    <span className="text-xs font-metadata-spec text-emerald-600 dark:text-emerald-400 font-bold">Kích hoạt tức thì</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-metadata-spec">
                    <div onClick={() => selectVipPackage(99000, 'Gói VIP 1 Tháng', 'Đọc sách không giới hạn 30 ngày', 0)} className={`p-4 rounded-2xl cursor-pointer transition-all flex flex-col justify-between ${currentPackTitle === 'Gói VIP 1 Tháng' ? 'is-active border-2 border-wine bg-wine/5 dark:border-gold dark:bg-gold/10 shadow-xs' : 'border border-paper-border dark:border-night-border hover:border-gold relative'}`}>
                      <div>
                        <span className="text-[10px] text-ink-muted dark:text-night-muted uppercase tracking-wider block font-bold">Cơ Bản</span>
                        <strong className="font-display font-bold text-base text-ink dark:text-night-text">Gói VIP 1 Tháng</strong>
                        <p className="text-[11px] text-ink-muted dark:text-night-muted mt-1 leading-snug">Đọc sách không giới hạn 30 ngày</p>
                      </div>
                      <div className="mt-4 pt-2 border-t border-paper-border/60 dark:border-night-border/60">
                        <span className="font-display font-black text-lg text-wine dark:text-gold">99.000đ</span>
                        <span className="text-[10px] text-ink-muted block">/ 30 ngày</span>
                      </div>
                    </div>

                    <div onClick={() => selectVipPackage(499000, 'Gói VIP 6 Tháng', 'Đặc quyền VIP 180 ngày (Tiết kiệm 15%)', 0)} className={`p-4 rounded-2xl cursor-pointer transition-all flex flex-col justify-between relative ${currentPackTitle === 'Gói VIP 6 Tháng' ? 'is-active border-2 border-wine bg-wine/5 dark:border-gold dark:bg-gold/10 shadow-xs' : 'border border-paper-border dark:border-night-border hover:border-gold relative'}`}>
                      <span className="px-2 py-0.5 rounded-full bg-wine text-white text-[9px] font-bold absolute -top-2.5 right-3">BÁN CHẠY</span>
                      <div>
                        <span className="text-[10px] text-ink-muted dark:text-night-muted uppercase tracking-wider block font-bold">Nâng Cao</span>
                        <strong className="font-display font-bold text-base text-ink dark:text-night-text">Gói VIP 6 Tháng</strong>
                        <p className="text-[11px] text-ink-muted dark:text-night-muted mt-1 leading-snug">Đặc quyền VIP 180 ngày (Tiết kiệm 15%)</p>
                      </div>
                      <div className="mt-4 pt-2 border-t border-paper-border/60 dark:border-night-border/60">
                        <span className="font-display font-black text-lg text-wine dark:text-gold">499.000đ</span>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block">Chỉ 83.000đ/tháng</span>
                      </div>
                    </div>

                    <div onClick={() => selectVipPackage(899000, 'Gói VIP 1 Năm', '365 ngày trọn vẹn + Tặng 200 Khoai', 200)} className={`p-4 rounded-2xl cursor-pointer transition-all flex flex-col justify-between relative ${currentPackTitle === 'Gói VIP 1 Năm' ? 'is-active border-2 border-wine bg-wine/5 dark:border-gold dark:bg-gold/10 shadow-xs' : 'border border-paper-border dark:border-night-border hover:border-gold relative'}`}>
                      <span className="px-2 py-0.5 rounded-full bg-gold text-ink-pure text-[9px] font-bold absolute -top-2.5 right-3">TIẾT KIỆM 25%</span>
                      <div>
                        <span className="text-[10px] text-ink-muted dark:text-night-muted uppercase tracking-wider block font-bold">Hoàng Gia</span>
                        <strong className="font-display font-bold text-base text-ink dark:text-night-text">Gói VIP 1 Năm</strong>
                        <p className="text-[11px] text-ink-muted dark:text-night-muted mt-1 leading-snug">365 ngày trọn vẹn + Tặng 200 Khoai</p>
                      </div>
                      <div className="mt-4 pt-2 border-t border-paper-border/60 dark:border-night-border/60">
                        <span className="font-display font-black text-lg text-wine dark:text-gold">899.000đ</span>
                        <span className="text-[10px] text-gold font-bold block">+ 200 Khoai quà tặng</span>
                      </div>
                    </div>
                  </div>
                </div>

                {}
                <div className="p-6 sm:p-7 bg-paper-100/80 dark:bg-night-card border-b border-paper-border dark:border-night-border">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-gold/15 text-gold flex items-center justify-center text-2xl shrink-0 shadow-sm border border-gold/30">
                        <i className="ph-fill ph-crown"></i>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase font-metadata-spec font-bold tracking-widest text-ink-muted dark:text-night-muted">Gói Hội Viên Đã Chọn</span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-[10px] font-metadata-spec font-bold uppercase tracking-wider">
                            <i className="ph-bold ph-shield-check"></i> An Toàn 100%
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2.5">
                          <strong className="font-display font-black text-lg sm:text-xl text-ink dark:text-night-text">{currentPackTitle}</strong>
                          <span className="px-2.5 py-0.5 rounded-lg bg-wine/10 dark:bg-gold/15 text-wine dark:text-gold font-metadata-spec font-bold text-xs">
                            {currentPackBenefit}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs font-metadata-spec text-ink-muted dark:text-night-muted pt-0.5">
                          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                            <i className="ph-bold ph-lightning"></i> Kích hoạt ngay sau thanh toán
                          </span>
                          <span>•</span>
                          <span>Phí giao dịch: <strong className="text-emerald-600 dark:text-emerald-400 font-bold">0đ (Miễn phí)</strong></span>
                        </div>
                      </div>
                    </div>
                    <div className="sm:text-right bg-paper-surface sm:bg-transparent dark:bg-night-surface sm:dark:bg-transparent p-3 sm:p-0 rounded-2xl border sm:border-0 border-paper-border dark:border-night-border flex sm:flex-col items-center sm:items-end justify-between sm:justify-center shrink-0">
                      <span className="font-metadata-spec text-[11px] uppercase tracking-wider text-ink-muted dark:text-night-muted font-bold block">Tổng tiền thanh toán</span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="font-display font-black text-2xl sm:text-3xl text-wine dark:text-gold tracking-tight leading-none">
                          {formatCurrency(currentPackPrice)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {}
                <div className="p-6 sm:p-8 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <i className="ph-bold ph-shield-check text-wine dark:text-gold text-xl"></i>
                      <h2 className="font-display font-bold text-base text-ink dark:text-night-text">Chọn Kênh Thanh Toán An Toàn</h2>
                    </div>
                    <span className="font-metadata-spec text-xs text-ink-muted dark:text-night-muted flex items-center gap-1.5">
                      <i className="ph-fill ph-lock-key text-wine dark:text-gold"></i> Mã hóa SSL 256-bit chuẩn PCI-DSS
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-metadata-spec text-xs font-semibold">
                    <button type="button" onClick={() => setCurrentGateway('vietqr')} className={`flex items-center sm:flex-col justify-center gap-2 p-3 sm:p-3.5 rounded-2xl transition-all cursor-pointer ${currentGateway === 'vietqr' ? 'is-active border-2 border-wine bg-wine/10 dark:border-gold dark:bg-gold/15 text-wine dark:text-gold shadow-xs' : 'border border-paper-border dark:border-night-border hover:border-wine/40 dark:hover:border-gold/40 text-ink dark:text-night-text'}`}>
                      <i className="ph-bold ph-qr-code text-2xl shrink-0"></i>
                      <span className="font-bold">VietQR 24/7 (Quét Mã Nhanh)</span>
                    </button>
                    <button type="button" onClick={() => setCurrentGateway('ewallet')} className={`flex items-center sm:flex-col justify-center gap-2 p-3 sm:p-3.5 rounded-2xl transition-all cursor-pointer ${currentGateway === 'ewallet' ? 'is-active border-2 border-wine bg-wine/10 dark:border-gold dark:bg-gold/15 text-wine dark:text-gold shadow-xs' : 'border border-paper-border dark:border-night-border hover:border-wine/40 dark:hover:border-gold/40 text-ink dark:text-night-text'}`}>
                      <i className="ph-bold ph-wallet text-2xl shrink-0"></i>
                      <span className="font-bold">Ví Điện Tử (MoMo/ZaloPay)</span>
                    </button>
                    <button type="button" onClick={() => setCurrentGateway('atm')} className={`flex items-center sm:flex-col justify-center gap-2 p-3 sm:p-3.5 rounded-2xl transition-all cursor-pointer ${currentGateway === 'atm' ? 'is-active border-2 border-wine bg-wine/10 dark:border-gold dark:bg-gold/15 text-wine dark:text-gold shadow-xs' : 'border border-paper-border dark:border-night-border hover:border-wine/40 dark:hover:border-gold/40 text-ink dark:text-night-text'}`}>
                      <i className="ph-bold ph-bank text-2xl shrink-0"></i>
                      <span className="font-bold">Thẻ ATM Nội Địa (Napas)</span>
                    </button>
                  </div>

                  {/* VietQR Pane */}
                  <div className={`gateway-pane space-y-4 ${currentGateway === 'vietqr' ? 'block' : 'hidden'}`}>
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center bg-paper-100/70 dark:bg-night-card p-6 rounded-2xl border border-paper-border dark:border-night-border">
                      <div className="sm:col-span-5 flex flex-col items-center justify-center text-center">
                        <div className="qr-scanner-box shadow-md relative w-44 h-44 flex items-center justify-center bg-white p-2 rounded-xl">
                          <div className="scan-laser-line"></div>
                          <img src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=2|99|0909090909|MB|${currentPackPrice}|HALM-TOPUP-98246|HALMBOOK`} alt="VietQR HALM" className="w-full h-full object-contain rounded" />
                        </div>
                        <div className="mt-3.5 mb-1 text-center w-full">
                          <span className="font-metadata-spec text-[10px] uppercase tracking-wider text-ink-muted dark:text-night-muted font-bold block mb-0.5">Số tiền thanh toán</span>
                          <div className="inline-flex items-center justify-center gap-2">
                            <strong className="font-display font-black text-2xl sm:text-3xl text-wine dark:text-gold tracking-tight leading-none">{formatCurrency(currentPackPrice)}</strong>
                            <button type="button" onClick={() => copyText(currentPackPrice.toString(), 'amt-btn')} className="p-1 text-wine dark:text-gold hover:opacity-75 transition-opacity" title="Sao chép số tiền">
                              {copiedId === 'amt-btn' ? <i className="ph-bold ph-check text-emerald-500 text-xs"></i> : <i className="ph-bold ph-copy text-xs"></i>}
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center justify-center gap-1.5 mt-1 font-metadata-spec text-[11px] text-ink-muted dark:text-night-muted">
                          <i className="ph-bold ph-clock-countdown text-wine dark:text-gold text-xs"></i>
                          <span>Hiệu lực mã: <strong className="text-wine dark:text-gold font-bold">{mins}:{secs}</strong></span>
                        </div>
                        <div className="mt-2.5">
                          <button type="button" onClick={downloadQrCode} className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-paper-border dark:border-night-border hover:bg-paper-200 dark:hover:bg-night-surface text-[11px] font-metadata-spec font-bold text-ink dark:text-night-text transition-colors">
                            <i className="ph-bold ph-download-simple"></i> Tải ảnh QR
                          </button>
                        </div>
                      </div>
                      <div className="sm:col-span-7 space-y-3 font-metadata-spec text-xs">
                        <div className="flex items-center justify-between pb-1">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-wine/10 dark:bg-gold/15 text-wine dark:text-gold text-[10px] font-bold uppercase tracking-wider">
                            <i className="ph-bold ph-lightning"></i> Tự Khớp Lệnh Sau 15s
                          </span>
                          <span className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                            <span>Đang chờ chuyển khoản</span>
                          </span>
                        </div>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between py-1.5 border-b border-paper-border/60 dark:border-night-border/60">
                            <span className="text-ink-muted dark:text-night-muted">Ngân hàng:</span>
                            <strong className="text-ink dark:text-night-text font-bold">MB Bank (Quân Đội)</strong>
                          </div>
                          <div className="flex justify-between py-1.5 border-b border-paper-border/60 dark:border-night-border/60 items-center">
                            <span className="text-ink-muted dark:text-night-muted">Số tài khoản:</span>
                            <div className="flex items-center gap-1.5">
                              <strong className="text-ink dark:text-night-text font-bold text-sm tracking-wider">0909090909</strong>
                              <button type="button" onClick={() => copyText('0909090909', 'acc-btn')} className="p-1 text-wine dark:text-gold hover:opacity-75 transition-opacity" title="Sao chép">
                                {copiedId === 'acc-btn' ? <i className="ph-bold ph-check text-emerald-500 text-xs"></i> : <i className="ph-bold ph-copy text-xs"></i>}
                              </button>
                            </div>
                          </div>
                          <div className="flex justify-between py-1.5 border-b border-paper-border/60 dark:border-night-border/60">
                            <span className="text-ink-muted dark:text-night-muted">Chủ tài khoản:</span>
                            <strong className="text-ink dark:text-night-text font-bold uppercase">HALM BOOK CORP</strong>
                          </div>
                          <div className="flex justify-between py-1.5 border-b border-paper-border/60 dark:border-night-border/60 items-center">
                            <span className="text-ink-muted dark:text-night-muted">Nội dung CK:</span>
                            <div className="flex items-center gap-1.5">
                              <strong className="text-wine dark:text-gold font-bold tracking-wider">HALM-TOPUP-98246</strong>
                              <button type="button" onClick={() => copyText('HALM-TOPUP-98246', 'memo-btn')} className="p-1 text-wine dark:text-gold hover:opacity-75 transition-opacity" title="Sao chép">
                                {copiedId === 'memo-btn' ? <i className="ph-bold ph-check text-emerald-500 text-xs"></i> : <i className="ph-bold ph-copy text-xs"></i>}
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="p-3 rounded-xl bg-paper-surface dark:bg-night-surface border border-paper-border/70 dark:border-night-border/70 text-[11px] text-ink-muted dark:text-night-muted flex items-start gap-2">
                          <i className="ph-fill ph-info text-wine dark:text-gold text-sm shrink-0 mt-0.5"></i>
                          <span>Hệ thống nhận diện mã QR tự động điền STK & nội dung. Nếu quét thủ công, vui lòng giữ nguyên mã <strong>HALM-TOPUP-98246</strong> để được cộng Khoai ngay.</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* E-Wallet Pane */}
                  <div className={`gateway-pane space-y-4 ${currentGateway === 'ewallet' ? 'block' : 'hidden'}`}>
                    <div className="grid grid-cols-3 gap-2.5 font-metadata-spec text-xs">
                      <div onClick={() => setCurrentEwallet('momo')} className={`p-3 rounded-xl cursor-pointer flex items-center justify-between transition-all ${currentEwallet === 'momo' ? 'is-active border-2 border-wine bg-wine/5 dark:bg-gold/10 dark:border-gold' : 'border border-paper-border dark:border-night-border hover:border-wine/50 dark:hover:border-gold/50'}`}>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-[#A50064] text-white flex items-center justify-center font-bold text-xs shadow">M</div>
                          <div>
                            <h4 className="font-bold text-xs text-ink dark:text-night-text">Ví MoMo</h4>
                            <span className="text-[9px] text-wine dark:text-gold font-bold">Hoàn 10%</span>
                          </div>
                        </div>
                        <i className={`ph-bold ${currentEwallet === 'momo' ? 'ph-check-circle text-wine dark:text-gold' : 'ph-circle text-ink-muted'} text-base`}></i>
                      </div>
                      <div onClick={() => setCurrentEwallet('zalopay')} className={`p-3 rounded-xl cursor-pointer flex items-center justify-between transition-all ${currentEwallet === 'zalopay' ? 'is-active border-2 border-wine bg-wine/5 dark:bg-gold/10 dark:border-gold' : 'border border-paper-border dark:border-night-border hover:border-wine/50 dark:hover:border-gold/50'}`}>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-[#0068FF] text-white flex items-center justify-center font-bold text-xs shadow">Z</div>
                          <div>
                            <h4 className="font-bold text-xs text-ink dark:text-night-text">ZaloPay</h4>
                            <span className="text-[9px] text-ink-muted">Quét nhanh</span>
                          </div>
                        </div>
                        <i className={`ph-bold ${currentEwallet === 'zalopay' ? 'ph-check-circle text-wine dark:text-gold' : 'ph-circle text-ink-muted'} text-base`}></i>
                      </div>
                      <div onClick={() => setCurrentEwallet('vnpay')} className={`p-3 rounded-xl cursor-pointer flex items-center justify-between transition-all ${currentEwallet === 'vnpay' ? 'is-active border-2 border-wine bg-wine/5 dark:bg-gold/10 dark:border-gold' : 'border border-paper-border dark:border-night-border hover:border-wine/50 dark:hover:border-gold/50'}`}>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-[#005BAA] text-white flex items-center justify-center font-bold text-xs shadow">VN</div>
                          <div>
                            <h4 className="font-bold text-xs text-ink dark:text-night-text">VNPAY-QR</h4>
                            <span className="text-[9px] text-ink-muted">34+ Bank</span>
                          </div>
                        </div>
                        <i className={`ph-bold ${currentEwallet === 'vnpay' ? 'ph-check-circle text-wine dark:text-gold' : 'ph-circle text-ink-muted'} text-base`}></i>
                      </div>
                    </div>
                    <div className="p-5 rounded-xl bg-paper-100/70 dark:bg-night-card border border-paper-border dark:border-night-border flex flex-col sm:flex-row items-center gap-5">
                      <div className="qr-scanner-box w-36 h-36 shrink-0 relative flex items-center justify-center shadow-sm bg-white rounded-lg">
                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(activeEwalletConf.qrData + currentPackPrice + '|HALM')}`} alt="QR Wallet" className="w-full h-full object-contain rounded" />
                      </div>
                      <div className="space-y-2 font-metadata-spec text-xs flex-1 text-left">
                        <span className="px-2 py-0.5 rounded bg-wine/10 dark:bg-gold/15 text-wine dark:text-gold text-[10px] font-bold uppercase tracking-wider inline-block">
                          {activeEwalletConf.name}
                        </span>
                        <p className="font-editorial-body text-xs text-ink dark:text-night-text leading-relaxed" dangerouslySetInnerHTML={{ __html: activeEwalletConf.desc }}></p>
                        <div className="flex flex-wrap gap-2 pt-1">
                          <button type="button" onClick={() => showToast('Chuyển Hướng', `Đang kết nối đến cổng ứng dụng ${currentEwallet.toUpperCase()}...`)} className="px-3.5 py-2 rounded-xl bg-wine hover:bg-wine-dark text-white font-bold text-xs uppercase tracking-wider transition-colors shadow cursor-pointer">
                            <i className="ph-bold ph-device-mobile mr-1"></i> <span>{activeEwalletConf.btnText}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ATM Pane */}
                  <div className={`gateway-pane space-y-4 ${currentGateway === 'atm' ? 'block' : 'hidden'}`}>
                    <span className="font-metadata-spec text-xs font-bold text-ink dark:text-night-text uppercase tracking-wider block">
                      Chọn nhanh ngân hàng phát hành thẻ ATM của bạn:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-metadata-spec">
                      {['Vietcombank', 'MB Bank', 'Techcombank', 'ACB', 'VPBank', 'TPBank', 'BIDV', 'Agribank'].map((bank) => (
                        <button key={bank} type="button" onClick={() => setCurrentAtmBank(bank)} className={`p-2.5 rounded-xl cursor-pointer flex items-center justify-between text-left font-bold text-ink dark:text-night-text transition-all ${currentAtmBank === bank ? 'is-active border-2 border-wine bg-wine/5 dark:border-gold dark:bg-gold/10' : 'border border-paper-border dark:border-night-border hover:border-wine'}`}>
                          <span>{bank}</span>
                          <i className={`ph-bold ${currentAtmBank === bank ? 'ph-check-circle text-wine dark:text-gold' : 'ph-circle text-ink-muted'} text-base`}></i>
                        </button>
                      ))}
                    </div>
                    <div className="space-y-3 pt-1">
                      <div>
                        <label className="block font-metadata-spec text-xs font-bold text-ink dark:text-night-text mb-1">Số Thẻ ATM (In trên mặt trước thẻ)</label>
                        <input type="text" maxLength="19" placeholder="9704 •••• •••• ••••" className="w-full px-3.5 py-2.5 rounded-xl border border-paper-border dark:border-night-border bg-paper-200/50 dark:bg-night-card text-xs font-metadata-spec font-bold tracking-wider text-ink dark:text-night-text focus:outline-none focus:border-wine dark:focus:border-gold" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block font-metadata-spec text-xs font-bold text-ink dark:text-night-text mb-1">Tên In Trên Thẻ</label>
                          <input type="text" placeholder="NGUYEN VAN A" className="w-full px-3.5 py-2.5 rounded-xl border border-paper-border dark:border-night-border bg-paper-200/50 dark:bg-night-card text-xs font-metadata-spec uppercase font-bold text-ink dark:text-night-text focus:outline-none focus:border-wine dark:focus:border-gold" />
                        </div>
                        <div>
                          <label className="block font-metadata-spec text-xs font-bold text-ink dark:text-night-text mb-1">Ngày Phát Hành (MM/YY)</label>
                          <input type="text" maxLength="5" placeholder="03/24" className="w-full px-3.5 py-2.5 rounded-xl border border-paper-border dark:border-night-border bg-paper-200/50 dark:bg-night-card text-xs font-metadata-spec font-bold text-center text-ink dark:text-night-text focus:outline-none focus:border-wine dark:focus:border-gold" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-paper-border dark:border-night-border space-y-4">
                    <button type="button" disabled={isProcessing} onClick={processPayment} className="w-full py-4 rounded-full bg-wine hover:bg-wine-dark text-white font-display font-black text-sm uppercase tracking-widest shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed">
                      <span>{getPayButtonText()}</span>
                      {!isProcessing && <i className="ph-bold ph-arrow-right group-hover:translate-x-1 transition-transform"></i>}
                    </button>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-metadata-spec text-[11px] text-ink-muted dark:text-night-muted">
                      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-paper-100/60 dark:bg-night-card border border-paper-border/60 dark:border-night-border/60">
                        <i className="ph-fill ph-check-circle text-emerald-600 dark:text-emerald-400 text-base shrink-0"></i>
                        <span>Khoai được cộng ngay vào tài khoản sau khi chuyển khoản.</span>
                      </div>
                      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-paper-100/60 dark:bg-night-card border border-paper-border/60 dark:border-night-border/60">
                        <i className="ph-fill ph-shield-check text-wine dark:text-gold text-base shrink-0"></i>
                        <span>Bảo mật giao dịch tiêu chuẩn quốc tế PCI-DSS & VietQR 24/7.</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {}
        <div className={`fixed inset-0 z-50 bg-black/65 backdrop-blur-md items-center justify-center p-4 ${isSuccessModalOpen ? 'flex' : 'hidden'}`}>
          <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-10 w-full h-full"></canvas>
          <div className="w-full max-w-lg bg-paper-surface dark:bg-night-surface rounded-3xl border border-paper-border dark:border-night-border shadow-2xl p-6 sm:p-8 text-center space-y-5 animate-in fade-in zoom-in duration-300 relative z-20">
            <button type="button" onClick={() => setIsSuccessModalOpen(false)} className="absolute top-4 right-4 w-8 h-8 rounded-full border border-paper-border dark:border-night-border flex items-center justify-center text-ink-muted hover:text-ink dark:hover:text-night-text transition-colors" title="Đóng popup">
              <i className="ph-bold ph-x text-sm"></i>
            </button>

            <div className="relative w-18 h-18 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping"></div>
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-3xl shadow-inner relative z-10">
                <i className="ph-bold ph-check"></i>
              </div>
            </div>

            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-metadata-spec text-[10px] font-bold uppercase tracking-[0.2em] border border-emerald-200 dark:border-emerald-800">
                <i className="ph-fill ph-seal-check"></i> GIAO DỊCH THÀNH CÔNG
              </span>
              <h3 className="font-display font-black text-2xl sm:text-3xl text-ink dark:text-night-text tracking-tight">Kích Hoạt Gói VIP Thành Công!</h3>
              <p className="font-editorial-body text-xs text-ink-muted dark:text-night-muted max-w-md mx-auto">
                Chúc mừng bạn! Gói Hội Viên VIP đã được kích hoạt thành công. Toàn bộ kho sách bản quyền và đặc quyền thành viên của HALM BOOK đã sẵn sàng phục vụ bạn.
              </p>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-paper-100/70 dark:bg-night-card border border-paper-border dark:border-night-border font-metadata-spec text-xs space-y-2.5 text-left shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-ink-muted dark:text-night-muted">Mã giao dịch nạp:</span>
                <div className="flex items-center gap-1.5">
                  <strong className="text-wine dark:text-gold font-bold tracking-wider">{transCode}</strong>
                  <button type="button" onClick={() => copyText(transCode, 'btn-copy-trans')} className="p-1 text-ink-muted hover:text-wine dark:hover:text-gold transition-colors" title="Sao chép mã đơn">
                    {copiedId === 'btn-copy-trans' ? <i className="ph-bold ph-check text-emerald-500 text-xs"></i> : <i className="ph-bold ph-copy text-xs"></i>}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-muted dark:text-night-muted">Kênh thanh toán:</span>
                <strong className="text-ink dark:text-night-text font-bold">{getGatewayNameForModal()}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-muted dark:text-night-muted">Tài khoản nạp:</span>
                <strong className="text-ink dark:text-night-text font-semibold">Nguyễn Văn A (docgia@halmbook.vn)</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-muted dark:text-night-muted">Gói đã nạp:</span>
                <strong className="text-ink dark:text-night-text font-bold">{currentPackTitle}</strong>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-gold/10 dark:bg-gold/15 border border-gold/30">
                <span className="text-ink dark:text-night-text font-bold">Đã cộng vào ví:</span>
                <strong className="text-gold font-black text-sm flex items-center gap-1">
                  {currentAddedKhoai > 0 ? `+${currentAddedKhoai} Khoai` : 'Đã kích hoạt Gói VIP'} {currentAddedKhoai > 0 && <i className="ph-fill ph-coins"></i>}
                </strong>
              </div>
              <div className="flex items-center justify-between border-t border-paper-border/80 dark:border-night-border/80 pt-2 text-xs">
                <span className="text-ink-muted dark:text-night-muted">Số dư ví mới:</span>
                <strong className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                  {currentAddedKhoai > 0 ? `${userWalletBalance.toLocaleString('vi-VN')} Khoai` : 'Hội Viên VIP'}
                </strong>
              </div>
              <div className="flex items-center justify-between border-t border-paper-border/80 dark:border-night-border/80 pt-2 text-sm">
                <span className="font-bold text-ink dark:text-night-text">Tổng tiền đã thanh toán:</span>
                <strong className="font-black text-wine dark:text-gold text-base sm:text-lg">{formatCurrency(currentPackPrice)}</strong>
              </div>
            </div>

            <div className="pt-1 flex flex-col sm:flex-row gap-2.5">
              <a href="cart.html" className="flex-1 py-3 px-4 rounded-full bg-wine hover:bg-wine-dark text-white font-display font-black text-xs uppercase tracking-wider text-center transition-all shadow-md hover:-translate-y-0.5 flex items-center justify-center gap-1.5">
                <i className="ph-bold ph-shopping-bag text-sm"></i>
                <span>Vào Giỏ Hàng Thuê Sách Ngay</span>
              </a>
              <button type="button" onClick={() => window.print()} className="px-4 py-3 rounded-full border border-paper-border dark:border-night-border hover:bg-paper-200 dark:hover:bg-night-card text-xs font-metadata-spec font-bold text-ink dark:text-night-text text-center transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer">
                <i className="ph-bold ph-printer text-sm"></i>
                <span>In Biên Lai</span>
              </button>
              <a href="tc.html" className="px-4 py-3 rounded-full border border-paper-border dark:border-night-border hover:bg-paper-200 dark:hover:bg-night-card text-xs font-metadata-spec font-bold text-ink dark:text-night-text text-center transition-colors">
                Về Trang Chủ
              </a>
            </div>
          </div>
        </div>

        {}
        <footer className="mt-auto border-t border-paper-border dark:border-night-border bg-paper-surface/60 dark:bg-night-surface/60 py-6 text-center font-metadata-spec text-xs text-ink-muted dark:text-night-muted transition-colors">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-ink dark:text-night-text">HALM BOOK</span>
              <span>— Cổng nạp Khoai & Thanh toán điện tử Napas 24/7 an toàn</span>
            </div>
            <div className="flex items-center gap-4">
              <span>Hotline: <strong className="text-ink dark:text-night-text">0909.090.909</strong></span>
              <span>•</span>
              <a href="wallet.html" className="hover:text-wine dark:hover:text-gold font-bold text-gold">Ví Khoai</a>
              <span>•</span>
              <a href="cart.html" className="hover:text-wine dark:hover:text-gold">Giỏ Hàng</a>
              <span>•</span>
              <a href="tc.html" className="hover:text-wine dark:hover:text-gold">Trang Chủ</a>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}