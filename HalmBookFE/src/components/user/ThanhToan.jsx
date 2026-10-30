import React, { useState, useEffect, useRef } from 'react';
import { isDarkMode, applyTheme } from '@/utils/theme';

export default function Payment({ onNavigate }) {
  // --- 1. PACKAGES CONFIGURATION ---
  const vipPackages = [
    {
      id: 'vip-1m',
      category: 'Cơ Bản',
      title: 'Gói VIP 1 Tháng',
      benefit: 'Đọc sách không giới hạn 30 ngày',
      price: 99000,
      subtext: '/ 30 ngày',
      bonusKhoai: 0,
      isBestSeller: false,
      tag: null
    },
    {
      id: 'vip-6m',
      category: 'Nâng Cao',
      title: 'Gói VIP 6 Tháng',
      benefit: 'Đặc quyền VIP 180 ngày (Tiết kiệm 15%)',
      price: 499000,
      subtext: 'Chỉ 83.000đ/tháng',
      bonusKhoai: 0,
      isBestSeller: true,
      tag: 'BÁN CHẠY'
    },
    {
      id: 'vip-1y',
      category: 'Hoàng Gia',
      title: 'Gói VIP 1 Năm',
      benefit: '365 ngày trọn vẹn + Tặng 200 Khoai',
      price: 899000,
      subtext: '+ 200 Khoai quà tặng',
      bonusKhoai: 200,
      isBestSeller: false,
      tag: 'TIẾT KIỆM 25%'
    }
  ];

  // --- 2. PAYMENT STATE ---
  const [selectedPackage, setSelectedPackage] = useState(vipPackages[0]);
  const [paymentGateway, setPaymentGateway] = useState('vietqr'); // 'vietqr' | 'ewallet' | 'atm'
  const [currentEwallet, setCurrentEwallet] = useState('momo'); // 'momo' | 'zalopay' | 'vnpay'
  const [currentAtmBank, setCurrentAtmBank] = useState('Vietcombank');
  const [atmFormData, setAtmFormData] = useState({
    cardNumber: '',
    cardHolder: '',
    cardDate: ''
  });

  const [walletBalance, setWalletBalance] = useState(1250);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successReceipt, setSuccessReceipt] = useState(null);

  // --- 3. COUNTDOWN TIMER (14:59) ---
  const [timeLeft, setTimeLeft] = useState(899);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev <= 1 ? 900 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (seconds) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const formatCurrency = (num) => {
    return new Intl.NumberFormat('vi-VN').format(num) + 'đ';
  };

  // --- 4. THEME & STARRY SKY ---
  const [isDark, setIsDark] = useState(() => isDarkMode());
  const [stars, setStars] = useState([]);

  useEffect(() => {
    applyTheme(isDark);
    if (isDark) {
      const newStars = Array.from({ length: 65 }, (_, i) => ({
        id: i,
        size: Math.random() * 2 + 0.8,
        top: Math.random() * 100,
        left: Math.random() * 100,
        duration: Math.random() * 3 + 2.5,
        delay: Math.random() * 3
      }));
      setStars(newStars);
    } else {
      setStars([]);
    }
  }, [isDark]);

  useEffect(() => {
    const handleGlobalThemeChange = (e) => {
      if (typeof e.detail?.isDark === 'boolean') {
        setIsDark(e.detail.isDark);
      }
    };
    window.addEventListener('halm-theme-change', handleGlobalThemeChange);
    return () => window.removeEventListener('halm-theme-change', handleGlobalThemeChange);
  }, []);

  // Load Phosphor Icons CDN if not present
  useEffect(() => {
    if (!document.getElementById('phosphor-icons-cdn')) {
      const link = document.createElement('link');
      link.id = 'phosphor-icons-cdn';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/@phosphor-icons/web@2.0.3/src/bold/style.css';
      document.head.appendChild(link);

      const linkFill = document.createElement('link');
      linkFill.rel = 'stylesheet';
      linkFill.href = 'https://unpkg.com/@phosphor-icons/web@2.0.3/src/fill/style.css';
      document.head.appendChild(linkFill);

      const linkRegular = document.createElement('link');
      linkRegular.rel = 'stylesheet';
      linkRegular.href = 'https://unpkg.com/@phosphor-icons/web@2.0.3/src/regular/style.css';
      document.head.appendChild(linkRegular);
    }
  }, []);

  // --- 5. TOAST SYSTEM ---
  const [toast, setToast] = useState({ show: false, title: '', msg: '' });
  const toastTimeoutRef = useRef(null);

  const showToast = (title, msg) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ show: true, title, msg });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text).then(() => {
      showToast('Sao chép thành công', `Đã lưu: ${text}`);
    });
  };

  // --- 6. CANVAS CONFETTI FOR CELEBRATION ---
  const confettiCanvasRef = useRef(null);
  const triggerConfetti = () => {
    const canvas = confettiCanvasRef.current;
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

    let animationFrame;
    const update = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.rotation += p.rotationSpeed;
        p.opacity -= 0.012;

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
        animationFrame = requestAnimationFrame(update);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        cancelAnimationFrame(animationFrame);
      }
    };
    update();
  };

  // --- 7. E-WALLET PROVIDERS DATA ---
  const ewalletConfig = {
    momo: {
      name: 'Ví MoMo Official',
      badgeColor: 'bg-[#A50064]',
      badgeLetter: 'M',
      tag: 'Hoàn 10%',
      btnText: 'Mở Ví MoMo',
      desc: 'Quét mã QR bằng ứng dụng Ví MoMo trên điện thoại hoặc bấm nút mở ví:'
    },
    zalopay: {
      name: 'ZaloPay Official',
      badgeColor: 'bg-[#0068FF]',
      badgeLetter: 'Z',
      tag: 'Quét nhanh',
      btnText: 'Mở Ví ZaloPay',
      desc: 'Mở ứng dụng ZaloPay hoặc Zalo để quét mã xác thực thanh toán:'
    },
    vnpay: {
      name: 'VNPAY-QR Đa Ngân Hàng',
      badgeColor: 'bg-[#005BAA]',
      badgeLetter: 'VN',
      tag: '34+ Bank',
      btnText: 'Mở App Bank Quét VNPAY',
      desc: 'Hỗ trợ quét qua ứng dụng của 34+ ngân hàng (Vietcombank, MB, Techcombank,...):'
    }
  };

  // --- 8. ATM BANKS LIST ---
  const atmBanks = [
    'Vietcombank', 'MB Bank', 'Techcombank', 'ACB',
    'VPBank', 'TPBank', 'BIDV', 'Agribank'
  ];

  // --- 9. PROCESS PAYMENT ENGINE ---
  const handleProcessPayment = () => {
    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      const transId = '#HLM-TOPUP-' + Math.floor(100000 + Math.random() * 900000);
      let gatewayName = 'VietQR (MB Bank 24/7)';
      if (paymentGateway === 'ewallet') {
        gatewayName = `Ví Điện Tử ${currentEwallet.toUpperCase()}`;
      } else if (paymentGateway === 'atm') {
        gatewayName = `Thẻ ATM Nội Địa (${currentAtmBank})`;
      }

      const addedKhoai = selectedPackage.bonusKhoai;
      const newBal = walletBalance + addedKhoai;
      setWalletBalance(newBal);

      setSuccessReceipt({
        transCode: transId,
        gatewayName,
        packName: selectedPackage.title,
        price: selectedPackage.price,
        addedKhoai,
        newBalance: newBal,
        buyerInfo: 'Độc giả HALM BOOK (Tài khoản đang đăng nhập)'
      });

      setIsSuccessModalOpen(true);
      triggerConfetti();
    }, 850);
  };

  const getPayButtonText = () => {
    const formatted = formatCurrency(selectedPackage.price);
    if (paymentGateway === 'vietqr') {
      return `XÁC NHẬN CHUYỂN KHOẢN VIETQR (${formatted})`;
    } else if (paymentGateway === 'ewallet') {
      return `THANH TOÁN QUA VÍ ${currentEwallet.toUpperCase()} (${formatted})`;
    } else if (paymentGateway === 'atm') {
      return `THANH TOÁN THẺ ATM ${currentAtmBank} (${formatted})`;
    }
    return `XÁC NHẬN THANH TOÁN (${formatted})`;
  };

  return (
    <div className="paper-grain halm-container min-h-screen flex flex-col relative text-ink dark:text-night-text bg-paper dark:bg-night-bg transition-colors duration-400">
      
      {/* Confetti Canvas for Celebration */}
      <canvas ref={confettiCanvasRef} className="fixed inset-0 pointer-events-none z-50 w-full h-full"></canvas>

      {/* Starry Sky in Dark Mode */}
      {isDark && (
        <div className="fixed inset-0 pointer-events-none z-0">
          {stars.map(st => (
            <div
              key={st.id}
              className="star-particle"
              style={{
                width: `${st.size}px`,
                height: `${st.size}px`,
                top: `${st.top}%`,
                left: `${st.left}%`,
                animation: `starTwinkle ${st.duration}s infinite ease-in-out ${st.delay}s`
              }}
            />
          ))}
        </div>
      )}

      {/* Toast Notification */}
      <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl bg-paper-surface dark:bg-night-card border border-wine/30 dark:border-gold/40 shadow-2xl transition-all duration-300 ${toast.show ? 'translate-y-0 opacity-100 pointer-events-auto' : 'translate-y-24 opacity-0 pointer-events-none'}`}>
        <div className="w-8 h-8 rounded-full bg-wine/10 dark:bg-gold/20 flex items-center justify-center text-wine dark:text-gold shrink-0">
          <i className="ph-bold ph-check text-base"></i>
        </div>
        <div>
          <div className="font-display font-bold text-xs text-ink dark:text-night-text">{toast.title}</div>
          <div className="font-editorial-body text-xs text-ink-muted dark:text-night-muted">{toast.msg}</div>
        </div>
      </div>

      {/* ========================================================
           NAVBAR: CỔNG THANH TOÁN VIP MEMBERSHIP GATEWAY
           ======================================================== */}
      <header className="sticky top-0 inset-x-0 z-40 py-3.5 border-b border-paper-border/80 dark:border-night-border/80 bg-paper/90 dark:bg-night-bg/90 backdrop-blur-md transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-4">
          
          {/* Logo & Brand */}
          <div
            onClick={() => onNavigate ? onNavigate('home') : window.location.href = 'tc.html'}
            className="flex items-center gap-3 group shrink-0 cursor-pointer"
            aria-label="HALM BOOK Về Trang Chủ"
          >
            <div className="w-10 h-10 rounded-lg bg-wine flex items-center justify-center text-white shadow group-hover:scale-105 transition-transform">
              <img
                src="img/icon-removebg-preview.png"
                alt="Logo"
                className="w-7 h-7 object-contain"
                onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=80&q=80'; }}
              />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-black text-xl tracking-tight text-ink dark:text-night-text leading-tight group-hover:text-wine dark:group-hover:text-gold transition-colors">
                HALM BOOK
              </span>
              <span className="font-metadata-spec text-[8px] uppercase tracking-[0.2em] font-semibold text-ink-muted dark:text-night-muted -mt-0.5">
                VIP Membership Gateway
              </span>
            </div>
          </div>

          {/* Quick Navigation & Current Potato Balance */}
          <div className="flex items-center gap-3 font-metadata-spec text-xs">
            <button
              type="button"
              onClick={() => onNavigate ? onNavigate('wallet') : window.location.href = 'wallet.html'}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold/10 hover:bg-gold/20 border border-gold/40 text-gold-dark dark:text-gold shadow-xs transition-colors cursor-pointer"
              title="Chuyển sang màn Ví Khoai Tây"
            >
              <i className="ph-fill ph-wallet text-sm"></i>
              <span className="font-bold">Ví Khoai Tây: {walletBalance.toLocaleString()}</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate ? onNavigate('cart') : window.location.href = 'cart.html'}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-paper-border dark:border-night-border hover:border-wine dark:hover:border-gold font-bold text-ink dark:text-night-text transition-colors cursor-pointer"
            >
              <i className="ph-bold ph-shopping-bag text-xs"></i>
              <span>Giỏ Hàng</span>
            </button>

            <button
              onClick={() => setIsDark(!isDark)}
              className="p-2 rounded-full text-ink dark:text-night-text hover:bg-paper-200 dark:hover:bg-night-card transition-colors cursor-pointer"
              title="Đổi giao diện Sáng / Tối"
              aria-label="Đổi giao diện Sáng / Tối"
            >
              <i className={`ph-bold ${isDark ? 'ph-sun text-gold' : 'ph-moon'} text-lg`}></i>
            </button>
          </div>

        </div>
      </header>

      {/* ========================================================
           MAIN INTERFACE: NẠP KHOAI / GÓI VIP & PHƯƠNG THỨC THANH TOÁN
           ======================================================== */}
      <main className="flex-grow py-8 sm:py-10 relative z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">

          {/* SEPARATION NOTICE BANNER: VÍ KHOAI TÂY ĐÃ ĐƯỢC TÁCH RIÊNG */}
          <div className="mb-6 p-4 rounded-2xl bg-paper-surface dark:bg-night-surface border-2 border-gold/40 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-metadata-spec transition-all">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gold/15 text-gold flex items-center justify-center text-2xl shrink-0 border border-gold/30">
                🥔
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-gold/20 text-gold-dark dark:text-gold text-[9px] font-black uppercase">PHÂN HỆ RIÊNG BIỆT</span>
                  <strong className="text-xs sm:text-sm text-ink dark:text-night-text font-display font-bold">Bạn muốn nạp điểm Khoai hoặc xem số dư ví?</strong>
                </div>
                <p className="text-[11px] text-ink-muted dark:text-night-muted mt-0.5">
                  Ví Khoai Tây đã được tách thành màn hình quản lý chuyên biệt với chuỗi điểm danh 7 ngày, đổi quà voucher và sổ cái giao dịch minh bạch.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigate ? onNavigate('wallet') : window.location.href = 'wallet.html'}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-wine hover:bg-wine-dark text-white font-bold text-xs shrink-0 shadow transition-all hover:-translate-y-0.5 cursor-pointer"
            >
              <i className="ph-fill ph-wallet"></i>
              <span>Mở Ví Khoai Tây Ngay</span>
              <i className="ph-bold ph-arrow-right text-[10px]"></i>
            </button>
          </div>

          {/* Page Title Bar */}
          <div className="pb-6 border-b border-paper-border dark:border-night-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-metadata-spec font-bold tracking-widest text-wine dark:text-gold uppercase">
                <i className="ph-bold ph-shield-check"></i> CỔNG THANH TOÁN TIỀN MẶT & ĐIỆN TỬ
              </span>
              <h1 className="font-display font-black text-2xl sm:text-3xl text-ink dark:text-night-text">
                Đăng Ký Gói Hội Viên VIP
              </h1>
              <p className="font-editorial-body text-xs text-ink-muted dark:text-night-muted">
                Mở khóa toàn quyền đọc hơn 10.000 tác phẩm số, sách nói và tư liệu lịch sử bản quyền cao cấp.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-paper-surface dark:bg-night-surface border border-paper-border dark:border-night-border text-xs font-metadata-spec font-semibold text-ink-muted dark:text-night-muted shadow-sm self-start sm:self-auto">
              <i className="ph-fill ph-crown text-gold text-base"></i>
              <span>Quyền Lợi VIP Không Giới Hạn</span>
            </div>
          </div>

          {/* ========================================================
               KHUNG THANH TOÁN & TÓM TẮT GIAO DỊCH
               ======================================================== */}
          <div className="max-w-4xl mx-auto pt-6">
            <div className="rounded-3xl bg-paper-surface dark:bg-night-surface border border-paper-border dark:border-night-border shadow-xl overflow-hidden transition-colors">
              
              {/* 1. CHỌN GÓI HỘI VIÊN VIP */}
              <div className="p-6 sm:p-7 border-b border-paper-border dark:border-night-border bg-paper-surface dark:bg-night-surface space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-display font-bold text-base text-ink dark:text-night-text flex items-center gap-2">
                    <i className="ph-fill ph-crown text-gold text-lg"></i>
                    <span>1. Chọn Gói Hội Viên Phù Hợp:</span>
                  </h2>
                  <span className="text-xs font-metadata-spec text-emerald-600 dark:text-emerald-400 font-bold">Kích hoạt tức thì</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-metadata-spec">
                  {vipPackages.map(pkg => {
                    const isSelected = selectedPackage.id === pkg.id;
                    return (
                      <div
                        key={pkg.id}
                        onClick={() => {
                          setSelectedPackage(pkg);
                          showToast('Đã chọn gói', `Bạn đã chọn ${pkg.title}`);
                        }}
                        className={`p-4 rounded-2xl cursor-pointer transition-all flex flex-col justify-between relative shadow-xs ${isSelected ? 'border-2 border-wine dark:border-gold bg-wine/5 dark:bg-gold/10' : 'border border-paper-border dark:border-night-border hover:border-gold'}`}
                      >
                        {pkg.tag && (
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold absolute -top-2.5 right-3 ${pkg.isBestSeller ? 'bg-wine text-white' : 'bg-gold text-ink-pure'}`}>
                            {pkg.tag}
                          </span>
                        )}
                        <div>
                          <span className="text-[10px] text-ink-muted dark:text-night-muted uppercase tracking-wider block font-bold">
                            {pkg.category}
                          </span>
                          <strong className="font-display font-bold text-base text-ink dark:text-night-text">
                            {pkg.title}
                          </strong>
                          <p className="text-[11px] text-ink-muted dark:text-night-muted mt-1 leading-snug">
                            {pkg.benefit}
                          </p>
                        </div>
                        <div className="mt-4 pt-2 border-t border-paper-border/60 dark:border-night-border/60">
                          <span className="font-display font-black text-lg text-wine dark:text-gold">
                            {formatCurrency(pkg.price)}
                          </span>
                          <span className={`text-[10px] block font-bold ${pkg.bonusKhoai > 0 ? 'text-gold' : 'text-emerald-600 dark:text-emerald-400'}`}>
                            {pkg.subtext}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2. DẢI TÓM TẮT GIAO DỊCH VIP */}
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
                        <strong className="font-display font-black text-lg sm:text-xl text-ink dark:text-night-text">
                          {selectedPackage.title}
                        </strong>
                        <span className="px-2.5 py-0.5 rounded-lg bg-wine/10 dark:bg-gold/15 text-wine dark:text-gold font-metadata-spec font-bold text-xs">
                          {selectedPackage.benefit}
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

                  {/* Total Amount Highlight */}
                  <div className="sm:text-right bg-paper-surface sm:bg-transparent dark:bg-night-surface sm:dark:bg-transparent p-3 sm:p-0 rounded-2xl border sm:border-0 border-paper-border dark:border-night-border flex sm:flex-col items-center sm:items-end justify-between sm:justify-center shrink-0">
                    <span className="font-metadata-spec text-[11px] uppercase tracking-wider text-ink-muted dark:text-night-muted font-bold block">Tổng tiền thanh toán</span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="font-display font-black text-2xl sm:text-3xl text-wine dark:text-gold tracking-tight leading-none">
                        {formatCurrency(selectedPackage.price)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. KHỐI KÊNH THANH TOÁN */}
              <div className="p-6 sm:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <i className="ph-bold ph-shield-check text-wine dark:text-gold text-xl"></i>
                    <h2 className="font-display font-bold text-base text-ink dark:text-night-text">
                      Chọn Kênh Thanh Toán An Toàn
                    </h2>
                  </div>
                  <span className="font-metadata-spec text-xs text-ink-muted dark:text-night-muted flex items-center gap-1.5">
                    <i className="ph-fill ph-lock-key text-wine dark:text-gold"></i>
                    Mã hóa SSL 256-bit chuẩn PCI-DSS
                  </span>
                </div>

                {/* 3 Tabs (VietQR, Ví Điện Tử, ATM Nội Địa) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-metadata-spec text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setPaymentGateway('vietqr')}
                    className={`flex items-center sm:flex-col justify-center gap-2 p-3 sm:p-3.5 rounded-2xl transition-all cursor-pointer shadow-xs ${paymentGateway === 'vietqr' ? 'border-2 border-wine bg-wine/10 dark:border-gold dark:bg-gold/15 text-wine dark:text-gold' : 'border border-paper-border dark:border-night-border hover:border-wine/40 dark:hover:border-gold/40 text-ink dark:text-night-text'}`}
                  >
                    <i className="ph-bold ph-qr-code text-2xl shrink-0"></i>
                    <span className="font-bold">VietQR 24/7 (Quét Mã Nhanh)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentGateway('ewallet')}
                    className={`flex items-center sm:flex-col justify-center gap-2 p-3 sm:p-3.5 rounded-2xl transition-all cursor-pointer shadow-xs ${paymentGateway === 'ewallet' ? 'border-2 border-wine bg-wine/10 dark:border-gold dark:bg-gold/15 text-wine dark:text-gold' : 'border border-paper-border dark:border-night-border hover:border-wine/40 dark:hover:border-gold/40 text-ink dark:text-night-text'}`}
                  >
                    <i className="ph-bold ph-wallet text-2xl shrink-0"></i>
                    <span className="font-bold">Ví Điện Tử (MoMo/ZaloPay)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentGateway('atm')}
                    className={`flex items-center sm:flex-col justify-center gap-2 p-3 sm:p-3.5 rounded-2xl transition-all cursor-pointer shadow-xs ${paymentGateway === 'atm' ? 'border-2 border-wine bg-wine/10 dark:border-gold dark:bg-gold/15 text-wine dark:text-gold' : 'border border-paper-border dark:border-night-border hover:border-wine/40 dark:hover:border-gold/40 text-ink dark:text-night-text'}`}
                  >
                    <i className="ph-bold ph-bank text-2xl shrink-0"></i>
                    <span className="font-bold">Thẻ ATM Nội Địa (Napas)</span>
                  </button>
                </div>

                {/* ==================== PANE 1: VIETQR 24/7 ==================== */}
                {paymentGateway === 'vietqr' && (
                  <div className="space-y-4 block animate-in fade-in duration-200">
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center bg-paper-100/70 dark:bg-night-card p-6 rounded-2xl border border-paper-border dark:border-night-border">
                      
                      {/* QR Box with scan line */}
                      <div className="sm:col-span-5 flex flex-col items-center justify-center text-center">
                        <div className="qr-scanner-box shadow-md relative w-44 h-44 flex items-center justify-center bg-white p-2 rounded-xl">
                          <div className="scan-laser-line"></div>
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=2|99|0909090909|MB|${selectedPackage.price}|HALM-TOPUP-98246|HALMBOOK`}
                            alt="VietQR HALM"
                            className="w-full h-full object-contain rounded"
                          />
                        </div>

                        <div className="mt-3.5 mb-1 text-center w-full">
                          <span className="font-metadata-spec text-[10px] uppercase tracking-wider text-ink-muted dark:text-night-muted font-bold block mb-0.5">Số tiền thanh toán</span>
                          <div className="inline-flex items-center justify-center gap-2">
                            <strong className="font-display font-black text-2xl sm:text-3xl text-wine dark:text-gold tracking-tight leading-none">
                              {formatCurrency(selectedPackage.price)}
                            </strong>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(selectedPackage.price.toString(), 'số tiền')}
                              className="p-1 text-wine dark:text-gold hover:opacity-75 transition-opacity cursor-pointer"
                              title="Sao chép số tiền"
                            >
                              <i className="ph-bold ph-copy text-xs"></i>
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-center gap-1.5 mt-1 font-metadata-spec text-[11px] text-ink-muted dark:text-night-muted">
                          <i className="ph-bold ph-clock-countdown text-wine dark:text-gold text-xs"></i>
                          <span>Hiệu lực mã: <strong className="text-wine dark:text-gold font-bold">{formatCountdown(timeLeft)}</strong></span>
                        </div>
                        <div className="mt-2.5">
                          <a
                            href={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=HALM-TOPUP-${selectedPackage.price}`}
                            download="VietQR_HALM_TOPUP.png"
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-paper-border dark:border-night-border hover:bg-paper-200 dark:hover:bg-night-surface text-[11px] font-metadata-spec font-bold text-ink dark:text-night-text transition-colors"
                          >
                            <i className="ph-bold ph-download-simple"></i> Tải ảnh QR
                          </a>
                        </div>
                      </div>

                      {/* Bank Details */}
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
                              <button
                                type="button"
                                onClick={() => copyToClipboard('0909090909', 'Số tài khoản')}
                                className="p-1 text-wine dark:text-gold hover:opacity-75 transition-opacity cursor-pointer"
                                title="Sao chép"
                              >
                                <i className="ph-bold ph-copy text-xs"></i>
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
                              <button
                                type="button"
                                onClick={() => copyToClipboard('HALM-TOPUP-98246', 'Nội dung chuyển khoản')}
                                className="p-1 text-wine dark:text-gold hover:opacity-75 transition-opacity cursor-pointer"
                                title="Sao chép"
                              >
                                <i className="ph-bold ph-copy text-xs"></i>
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-paper-surface dark:bg-night-surface border border-paper-border/70 dark:border-night-border/70 text-[11px] text-ink-muted dark:text-night-muted flex items-start gap-2">
                          <i className="ph-fill ph-info text-wine dark:text-gold text-sm shrink-0 mt-0.5"></i>
                          <span>Hệ thống nhận diện mã QR tự động điền STK & nội dung. Nếu quét thủ công, vui lòng giữ nguyên mã <strong>HALM-TOPUP-98246</strong> để được kích hoạt ngay.</span>
                        </div>

                      </div>

                    </div>
                  </div>
                )}

                {/* ==================== PANE 2: VÍ ĐIỆN TỬ ==================== */}
                {paymentGateway === 'ewallet' && (
                  <div className="space-y-4 block animate-in fade-in duration-200">
                    <div className="grid grid-cols-3 gap-2.5 font-metadata-spec text-xs">
                      {Object.keys(ewalletConfig).map(key => {
                        const conf = ewalletConfig[key];
                        const isSelected = currentEwallet === key;
                        return (
                          <div
                            key={key}
                            onClick={() => setCurrentEwallet(key)}
                            className={`p-3 rounded-xl cursor-pointer flex items-center justify-between transition-all ${isSelected ? 'border-2 border-wine bg-wine/5 dark:bg-gold/10 dark:border-gold' : 'border border-paper-border dark:border-night-border hover:border-wine/50 dark:hover:border-gold/50'}`}
                          >
                            <div className="flex items-center gap-2">
                              <div className={`w-8 h-8 rounded-lg ${conf.badgeColor} text-white flex items-center justify-center font-bold text-xs shadow`}>
                                {conf.badgeLetter}
                              </div>
                              <div>
                                <h4 className="font-bold text-xs text-ink dark:text-night-text">{conf.name.replace(' Official', '')}</h4>
                                <span className={`text-[9px] font-bold ${isSelected ? 'text-wine dark:text-gold' : 'text-ink-muted'}`}>
                                  {conf.tag}
                                </span>
                              </div>
                            </div>
                            <i className={`ph-bold ${isSelected ? 'ph-check-circle text-wine dark:text-gold' : 'ph-circle text-ink-muted'} text-base`}></i>
                          </div>
                        );
                      })}
                    </div>

                    <div className="p-5 rounded-xl bg-paper-100/70 dark:bg-night-card border border-paper-border dark:border-night-border flex flex-col sm:flex-row items-center gap-5">
                      <div className="qr-scanner-box w-36 h-36 shrink-0 relative flex items-center justify-center shadow-sm bg-white rounded-lg">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=2|99|0909090909|${currentEwallet.toUpperCase()}|${selectedPackage.price}|HALMBOOK`}
                          alt="QR Wallet"
                          className="w-full h-full object-contain rounded"
                        />
                      </div>
                      <div className="space-y-2 font-metadata-spec text-xs flex-1 text-left">
                        <span className="px-2 py-0.5 rounded bg-wine/10 dark:bg-gold/15 text-wine dark:text-gold text-[10px] font-bold uppercase tracking-wider inline-block">
                          {ewalletConfig[currentEwallet].name}
                        </span>
                        <p className="font-editorial-body text-xs text-ink dark:text-night-text leading-relaxed">
                          {ewalletConfig[currentEwallet].desc}
                        </p>
                        <div className="flex flex-wrap gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => showToast('Chuyển Hướng', `Đang kết nối đến cổng ứng dụng ${currentEwallet.toUpperCase()}...`)}
                            className="px-3.5 py-2 rounded-xl bg-wine hover:bg-wine-dark text-white font-bold text-xs uppercase tracking-wider transition-colors shadow cursor-pointer"
                          >
                            <i className="ph-bold ph-device-mobile mr-1"></i> {ewalletConfig[currentEwallet].btnText}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ==================== PANE 3: THẺ ATM NỘI ĐỊA ==================== */}
                {paymentGateway === 'atm' && (
                  <div className="space-y-4 block animate-in fade-in duration-200">
                    <span className="font-metadata-spec text-xs font-bold text-ink dark:text-night-text uppercase tracking-wider block">
                      Chọn nhanh ngân hàng phát hành thẻ ATM của bạn:
                    </span>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-metadata-spec">
                      {atmBanks.map(bank => {
                        const isSelected = currentAtmBank === bank;
                        return (
                          <button
                            key={bank}
                            type="button"
                            onClick={() => {
                              setCurrentAtmBank(bank);
                              showToast('Ngân Hàng ATM', `Đã chọn cổng thẻ ${bank}`);
                            }}
                            className={`p-2.5 rounded-xl cursor-pointer flex items-center justify-between text-left font-bold text-ink dark:text-night-text transition-all ${isSelected ? 'border-2 border-wine bg-wine/5 dark:bg-gold/10 dark:border-gold' : 'border border-paper-border dark:border-night-border hover:border-wine'}`}
                          >
                            <span>{bank}</span>
                            <i className={`ph-bold ${isSelected ? 'ph-check-circle text-wine dark:text-gold' : 'ph-circle text-ink-muted'} text-base`}></i>
                          </button>
                        );
                      })}
                    </div>

                    <div className="space-y-3 pt-1">
                      <div>
                        <label className="block font-metadata-spec text-xs font-bold text-ink dark:text-night-text mb-1">Số Thẻ ATM (In trên mặt trước thẻ)</label>
                        <input
                          type="text"
                          maxLength={19}
                          value={atmFormData.cardNumber}
                          onChange={(e) => setAtmFormData({ ...atmFormData, cardNumber: e.target.value })}
                          placeholder="9704 •••• •••• ••••"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-paper-border dark:border-night-border bg-paper-200/50 dark:bg-night-card text-xs font-metadata-spec font-bold tracking-wider text-ink dark:text-night-text focus:outline-none focus:border-wine dark:focus:border-gold"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block font-metadata-spec text-xs font-bold text-ink dark:text-night-text mb-1">Tên In Trên Thẻ</label>
                          <input
                            type="text"
                            value={atmFormData.cardHolder}
                            onChange={(e) => setAtmFormData({ ...atmFormData, cardHolder: e.target.value.toUpperCase() })}
                            placeholder="NGUYEN VAN A"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-paper-border dark:border-night-border bg-paper-200/50 dark:bg-night-card text-xs font-metadata-spec uppercase font-bold text-ink dark:text-night-text focus:outline-none focus:border-wine dark:focus:border-gold"
                          />
                        </div>
                        <div>
                          <label className="block font-metadata-spec text-xs font-bold text-ink dark:text-night-text mb-1">Ngày Phát Hành (MM/YY)</label>
                          <input
                            type="text"
                            maxLength={5}
                            value={atmFormData.cardDate}
                            onChange={(e) => setAtmFormData({ ...atmFormData, cardDate: e.target.value })}
                            placeholder="03/24"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-paper-border dark:border-night-border bg-paper-200/50 dark:bg-night-card text-xs font-metadata-spec font-bold text-center text-ink dark:text-night-text focus:outline-none focus:border-wine dark:focus:border-gold"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. CHÂN KHUNG THANH TOÁN (ACTION BUTTON & TRUST BADGES) */}
                <div className="pt-4 border-t border-paper-border dark:border-night-border space-y-4">
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={handleProcessPayment}
                    className="w-full py-4 rounded-full bg-wine hover:bg-wine-dark text-white font-display font-black text-sm uppercase tracking-widest shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? (
                      <>
                        <i className="ph-bold ph-spinner animate-spin text-base"></i>
                        <span>Đang khớp lệnh thanh toán bảo mật...</span>
                      </>
                    ) : (
                      <>
                        <span>{getPayButtonText()}</span>
                        <i className="ph-bold ph-arrow-right group-hover:translate-x-1 transition-transform"></i>
                      </>
                    )}
                  </button>

                  {/* Trust Badges */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-metadata-spec text-[11px] text-ink-muted dark:text-night-muted">
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-paper-100/60 dark:bg-night-card border border-paper-border/60 dark:border-night-border/60">
                      <i className="ph-fill ph-check-circle text-emerald-600 dark:text-emerald-400 text-base shrink-0"></i>
                      <span>Kích hoạt ngay đặc quyền VIP và cộng điểm sau khi thanh toán.</span>
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

      {/* ========================================================
           POPUP THÔNG BÁO NẠP THÀNH CÔNG (SUCCESS TOPUP MODAL)
           ======================================================== */}
      {isSuccessModalOpen && successReceipt && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-lg bg-paper-surface dark:bg-night-surface rounded-3xl border border-paper-border dark:border-night-border shadow-2xl p-6 sm:p-8 text-center space-y-5 relative z-20 animate-in zoom-in-95 duration-200">
            
            {/* Dismiss "X" Button */}
            <button
              type="button"
              onClick={() => setIsSuccessModalOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full border border-paper-border dark:border-night-border flex items-center justify-center text-ink-muted hover:text-ink dark:hover:text-night-text transition-colors cursor-pointer"
              title="Đóng popup"
            >
              <i className="ph-bold ph-x text-sm"></i>
            </button>

            {/* Success Glowing Icon with celebratory pulse */}
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
              <h3 className="font-display font-black text-2xl sm:text-3xl text-ink dark:text-night-text tracking-tight">
                Kích Hoạt Gói VIP Thành Công!
              </h3>
              <p className="font-editorial-body text-xs text-ink-muted dark:text-night-muted max-w-md mx-auto">
                Chúc mừng bạn! Gói Hội Viên VIP đã được kích hoạt thành công. Toàn bộ kho sách bản quyền và đặc quyền thành viên của HALM BOOK đã sẵn sàng phục vụ bạn.
              </p>
            </div>

            {/* Receipt Breakdown Table */}
            <div className="p-4 sm:p-5 rounded-2xl bg-paper-100/70 dark:bg-night-card border border-paper-border dark:border-night-border font-metadata-spec text-xs space-y-2.5 text-left shadow-xs">
              
              <div className="flex items-center justify-between">
                <span className="text-ink-muted dark:text-night-muted">Mã giao dịch:</span>
                <div className="flex items-center gap-1.5">
                  <strong className="text-wine dark:text-gold font-bold tracking-wider">
                    {successReceipt.transCode}
                  </strong>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(successReceipt.transCode, 'mã đơn')}
                    className="p-1 text-ink-muted hover:text-wine dark:hover:text-gold transition-colors cursor-pointer"
                    title="Sao chép mã đơn"
                  >
                    <i className="ph-bold ph-copy text-xs"></i>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-ink-muted dark:text-night-muted">Kênh thanh toán:</span>
                <strong className="text-ink dark:text-night-text font-bold">
                  {successReceipt.gatewayName}
                </strong>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-ink-muted dark:text-night-muted">Tài khoản nạp:</span>
                <strong className="text-ink dark:text-night-text font-semibold">
                  {successReceipt.buyerInfo}
                </strong>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-ink-muted dark:text-night-muted">Gói đã nạp:</span>
                <strong className="text-ink dark:text-night-text font-bold">
                  {successReceipt.packName}
                </strong>
              </div>

              {successReceipt.addedKhoai > 0 ? (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-gold/10 dark:bg-gold/15 border border-gold/30">
                  <span className="text-ink dark:text-night-text font-bold">Đã cộng vào ví:</span>
                  <strong className="text-gold font-black text-sm flex items-center gap-1">
                    +{successReceipt.addedKhoai} Khoai <i className="ph-fill ph-coins"></i>
                  </strong>
                </div>
              ) : (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800">
                  <span className="text-ink dark:text-night-text font-bold">Đặc quyền kích hoạt:</span>
                  <strong className="text-emerald-600 dark:text-emerald-400 font-black text-xs flex items-center gap-1">
                    Đã kích hoạt Gói VIP <i className="ph-fill ph-crown"></i>
                  </strong>
                </div>
              )}

              <div className="flex items-center justify-between border-t border-paper-border/80 dark:border-night-border/80 pt-2 text-xs">
                <span className="text-ink-muted dark:text-night-muted">Số dư ví mới:</span>
                <strong className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                  {successReceipt.newBalance.toLocaleString()} Khoai
                </strong>
              </div>

              <div className="flex items-center justify-between border-t border-paper-border/80 dark:border-night-border/80 pt-2 text-sm">
                <span className="font-bold text-ink dark:text-night-text">Tổng tiền đã thanh toán:</span>
                <strong className="font-black text-wine dark:text-gold text-base sm:text-lg">
                  {formatCurrency(successReceipt.price)}
                </strong>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-1 flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={() => onNavigate ? onNavigate('cart') : window.location.href = 'cart.html'}
                className="flex-1 py-3 px-4 rounded-full bg-wine hover:bg-wine-dark text-white font-display font-black text-xs uppercase tracking-wider text-center transition-all shadow-md hover:-translate-y-0.5 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <i className="ph-bold ph-shopping-bag text-sm"></i>
                <span>Vào Giỏ Hàng Thuê Sách Ngay</span>
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-3 rounded-full border border-paper-border dark:border-night-border hover:bg-paper-200 dark:hover:bg-night-card text-xs font-metadata-spec font-bold text-ink dark:text-night-text text-center transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <i className="ph-bold ph-printer text-sm"></i>
                <span>In Biên Lai</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate ? onNavigate('home') : window.location.href = 'tc.html'}
                className="px-4 py-3 rounded-full border border-paper-border dark:border-night-border hover:bg-paper-200 dark:hover:bg-night-card text-xs font-metadata-spec font-bold text-ink dark:text-night-text text-center transition-colors cursor-pointer"
              >
                Về Trang Chủ
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================
           FOOTER
           ======================================================== */}
      <footer className="mt-auto border-t border-paper-border dark:border-night-border bg-paper-surface/60 dark:bg-night-surface/60 py-6 text-center font-metadata-spec text-xs text-ink-muted dark:text-night-muted transition-colors relative z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-ink dark:text-night-text">HALM BOOK</span>
            <span>— Cổng nạp Khoai & Thanh toán điện tử Napas 24/7 an toàn</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Hotline: <strong className="text-ink dark:text-night-text">0909.090.909</strong></span>
            <span>•</span>
            <button type="button" onClick={() => onNavigate ? onNavigate('wallet') : window.location.href = 'wallet.html'} className="hover:text-wine dark:hover:text-gold font-bold text-gold cursor-pointer">
              Ví Khoai
            </button>
            <span>•</span>
            <button type="button" onClick={() => onNavigate ? onNavigate('cart') : window.location.href = 'cart.html'} className="hover:text-wine dark:hover:text-gold cursor-pointer">
              Giỏ Hàng
            </button>
            <span>•</span>
            <button type="button" onClick={() => onNavigate ? onNavigate('home') : window.location.href = 'tc.html'} className="hover:text-wine dark:hover:text-gold cursor-pointer">
              Trang Chủ
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
}
