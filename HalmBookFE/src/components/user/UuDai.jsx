import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { isDarkMode, applyTheme } from '@/utils/theme';
import UserLayout from './layout/UserLayout';
import { getCurrentCustomer } from '@/services/customerService';
import { getPotatoPackages } from '@/services/potatoService';
import { isTokenValid } from '@/services/authToken';
import { openAuthModal } from '@/components/common/AuthModal';
import axiosInstance from '@/services/axiosClient';
import { getCombos, getSingleDeals } from '@/services/offerService';

export default function OffersEnd() {
  const navigate = useNavigate();
  const [khoaiBalance, setKhoaiBalance] = useState(0);
  const [isDark, setIsDark] = useState(() => isDarkMode());
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  // Toast State
  const [toast, setToast] = useState({ show: false, title: '', message: '' });
  
  // Form Modal State (Xác nhận đổi ưu đãi)
  const [modalConfig, setModalConfig] = useState(null); // null means closed
  
  // Combo Hover Popup State
  const [popupState, setPopupState] = useState({
    display: 'none', visibility: 'hidden', active: false,
    top: 0, left: 0, arrowLeft: 50, posClass: '',
    book: null
  });

  // =========================================================================
  // DỮ LIỆU ƯU ĐÃI (Đã loại bỏ toàn bộ dữ liệu mẫu tĩnh, sẵn sàng gắn kết nối API)
  // =========================================================================
  // TODO(API): Tải danh sách các gói cước, gói upload, combo sách, sách giảm giá từ database
  const [subscriptionOffers, setSubscriptionOffers] = useState([]);
  const [uploadOffers, setUploadOffers] = useState([]);
  const [comboOffers, setComboOffers] = useState([]);
  const [singleBookDeals, setSingleBookDeals] = useState([]);
  const [challengeOffers, setChallengeOffers] = useState([]);

  const popupHideTimeout = useRef(null);
  const popupCloseTimeout = useRef(null);
  const comboPopupRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    // 1. Lấy số dư Khoai thực tế của người dùng nếu đã đăng nhập
    if (isTokenValid()) {
      getCurrentCustomer()
        .then((data) => {
          if (isMounted && data?.potatoBalance != null) {
            setKhoaiBalance(data.potatoBalance);
          }
        })
        .catch(() => {});
    } else {
      setKhoaiBalance(0);
    }

    const handlePotatoUpdated = (event) => {
      if (event.detail?.potatoBalance != null) {
        setKhoaiBalance(event.detail.potatoBalance);
      }
    };
    window.addEventListener('halm-potato-updated', handlePotatoUpdated);

    // 2. Tự động nạp gói ưu đãi thực tế từ Database MySQL (bảng potato_package)
    getPotatoPackages()
      .then((pkgs) => {
        if (isMounted && Array.isArray(pkgs) && pkgs.length > 0) {
          setSubscriptionOffers(pkgs.map(p => {
            const id = p.packageId || p.package_id || p.id;
            const name = p.packageName || p.package_name || p.name || 'Gói Nạp Khoai';
            const potato = p.potatoAmount !== undefined ? p.potatoAmount : (p.potato_amount !== undefined ? p.potato_amount : (p.potatoes || 0));
            const bonus = p.bonusPotato !== undefined ? p.bonusPotato : (p.bonus_potato !== undefined ? p.bonus_potato : (p.bonus || 0));
            const price = p.priceVnd !== undefined ? p.priceVnd : (p.price_vnd !== undefined ? p.price_vnd : (p.price || 0));
            const tag = p.badgeTag || p.badge_tag || p.tag || '';
            const desc = p.description || p.desc || 'Nạp Khoai Tây để mở khóa và thuê sách trọn đời.';
            return {
              id,
              name,
              potato,
              cost: potato,
              tag,
              category: 'Gói Nạp Khoai',
              duration: 'nạp ngay',
              features: [
                `Nhận ${potato} Khoai vào ví đọc sách`,
                bonus > 0 ? `Tặng thêm +${bonus} Khoai ưu đãi` : 'Sử dụng thuê sách và mở khóa trọn đời',
                `Giá bán: ${Number(price).toLocaleString('vi-VN')} VNĐ`
              ],
              action: 'Nạp Ngay'
            };
          }));
        }
      })
      .catch(() => {});

    // 2.1. Tải danh sách Voucher & Khuyến mãi thực tế từ Database MySQL (bảng promotion qua /api/home/promotions)
    axiosInstance.get('/api/home/promotions')
      .then((res) => {
        const promos = Array.isArray(res.data) ? res.data : [];
        if (isMounted && promos.length > 0) {
          setUploadOffers(promos.map((p) => {
            const code = p.promotion_id || p.promotionId || p.code || p.id;
            const title = p.promotion_name || p.promotionName || p.name || `Voucher ${code}`;
            const pct = p.discount_percent !== undefined ? p.discount_percent : (p.discountPercent || 0);
            const amt = p.discount_amount !== undefined ? p.discount_amount : (p.discountAmount || 0);
            const desc = p.description || p.desc || 'Áp dụng cho mọi độc giả của HALM BOOK';
            return {
              id: code,
              title: title,
              code: code,
              potato: amt > 0 ? Math.max(1, Math.round(amt / 1000)) : 10,
              cost: amt > 0 ? Math.max(1, Math.round(amt / 1000)) : 10,
              tag: pct > 0 ? `GIẢM ${pct}%` : 'VOUCHER',
              category: 'Ưu Đãi Đặc Biệt',
              features: [
                desc,
                `Mã kích hoạt: ${code}`,
                pct > 0 ? `Chiết khấu ${pct}%` : `Giảm ${Math.max(1, Math.round(amt / 1000))} Khoai`
              ],
              action: 'Nhận Mã'
            };
          }));
        }
      })
      .catch(() => {});

    // 2.2. Nạp dữ liệu Combo Sách & Sách Lẻ Giảm Sâu từ Quản Trị Hệ Thống (offerService)
    setComboOffers(getCombos());
    setSingleBookDeals(getSingleDeals());

    const handleOffersUpdated = () => {
      if (isMounted) {
        setComboOffers(getCombos());
        setSingleBookDeals(getSingleDeals());
      }
    };
    window.addEventListener('halm-offers-updated', handleOffersUpdated);

    // 2.3. Thử thách đọc sách: khởi tạo mảng rỗng (sẵn sàng kết nối sự kiện CSDL)
    setChallengeOffers([]);

    // 3. Ghi nhận hoàn thành nhiệm vụ hằng ngày: Khám phá ưu đãi
    const todayKey = new Date().toISOString().slice(0, 10);
    try {
      localStorage.setItem(`halm_daily_action_offers_${todayKey}`, 'true');
    } catch {}
    window.dispatchEvent(new CustomEvent('halm-daily-task-completed', { detail: { task: 'offers' } }));

    // 4. Inject Tailwind script dynamically
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

    // 5. Scroll listener for Scroll To Top
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 320);
    };
    window.addEventListener('scroll', handleScroll);

    // 6. Theme initialization
    applyTheme(isDark);

    const handleThemeChange = (e) => {
      if (typeof e.detail?.isDark === 'boolean') {
        setIsDark(e.detail.isDark);
      }
    };
    window.addEventListener('halm-theme-change', handleThemeChange);

    return () => {
      isMounted = false;
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('halm-theme-change', handleThemeChange);
      window.removeEventListener('halm-potato-updated', handlePotatoUpdated);
      window.removeEventListener('halm-offers-updated', handleOffersUpdated);
    };
  }, []);

  const renderStars = () => {
    if (!isDark) return null;
    const stars = [];
    for (let i = 0; i < 60; i++) {
      const size = Math.random() * 2.5 + 0.5;
      stars.push(
        <div key={i} className="star" style={{
          width: `${size}px`, height: `${size}px`,
          top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%`,
          animation: `starTwinkle ${Math.random() * 3 + 2}s infinite ease-in-out ${Math.random() * 3}s`
        }} />
      );
    }
    return <div id="starry-background">{stars}</div>;
  };

  const triggerToast = (title, message) => {
    setToast({ show: true, title, message });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3800);
  };

  const scrollRow = (rowId, offset) => {
    const container = document.getElementById(rowId);
    if (container) container.scrollBy({ left: offset, behavior: 'smooth' });
  };

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const openRedeemModal = (title, cost, successMsg) => {
    if (!isTokenValid()) {
      openAuthModal({ mode: 'login', message: 'Vui lòng đăng nhập để đổi gói ưu đãi và quà tặng!' });
      return;
    }
    setModalConfig({ title, cost, successMsg });
  };

  const closeRedeemModal = () => setModalConfig(null);

  const handleConfirmRedeem = () => {
    if (modalConfig && khoaiBalance >= modalConfig.cost) {
      setKhoaiBalance(prev => prev - modalConfig.cost);
      triggerToast('Đổi Ưu Đãi Thành Công!', modalConfig.successMsg);
      closeRedeemModal();
    }
  };

  const openChatbot = (initialMsg) => {
    window.dispatchEvent(new CustomEvent('halm-open-chatbot', { detail: { message: initialMsg || 'Xin chào, tôi cần tư vấn về các gói ưu đãi!' } }));
  };

  const clearAllPopupTimers = () => {
    if (popupHideTimeout.current) clearTimeout(popupHideTimeout.current);
    if (popupCloseTimeout.current) clearTimeout(popupCloseTimeout.current);
  };

  const handleBookEnter = (e, bookData) => {
    clearAllPopupTimers();
    const item = e.currentTarget;
    const targetCover = item.querySelector('.book-cover-wrapper') || item;
    const rect = item.getBoundingClientRect();
    const coverRect = targetCover.getBoundingClientRect();
    
    const popupWidth = 320;
    const popupHeight = 210;
    const spaceBelow = window.innerHeight - rect.bottom;
    const isNearBottom = rect.bottom > (window.innerHeight * 0.55) || spaceBelow < (popupHeight + 20);

    let topPos;
    let posClass = '';
    if (isNearBottom) {
      topPos = coverRect.top - popupHeight - 14;
      posClass = 'pos-top';
    } else {
      topPos = rect.bottom + 14;
      posClass = 'pos-bottom';
    }
    topPos = Math.max(14, Math.min(topPos, window.innerHeight - popupHeight - 14));

    const bookCenterX = coverRect.left + (coverRect.width / 2);
    const idealLeft = bookCenterX - (popupWidth / 2);
    const clampedLeft = Math.max(14, Math.min(idealLeft, window.innerWidth - popupWidth - 14));
    
    const arrowLeft = bookCenterX - clampedLeft;
    const clampedArrowLeft = Math.max(20, Math.min(arrowLeft, popupWidth - 20));

    setPopupState({
      display: 'block', visibility: 'visible', active: true,
      top: topPos, left: clampedLeft, arrowLeft: clampedArrowLeft,
      posClass, book: bookData
    });
  };

  const handleBookLeave = () => {
    clearAllPopupTimers();
    popupHideTimeout.current = setTimeout(() => {
      setPopupState(prev => ({ ...prev, active: false }));
      popupCloseTimeout.current = setTimeout(() => {
        setPopupState(prev => prev.active ? prev : { ...prev, display: 'none', visibility: 'hidden', book: null });
      }, 220);
    }, 300);
  };

  // Helper render Empty State Box
  const renderEmptySection = (iconClass, title, subtitle) => (
    <div className="w-full py-10 px-6 rounded-2xl bg-paper-surface/50 dark:bg-night-card/50 border border-dashed border-paper-border dark:border-night-border text-center flex flex-col items-center justify-center">
      <div className="w-12 h-12 rounded-xl bg-wine/10 dark:bg-gold/15 text-wine dark:text-gold flex items-center justify-center text-2xl mb-2.5">
        <i className={`ph-bold ${iconClass}`}></i>
      </div>
      <p className="font-display font-bold text-sm text-ink dark:text-night-text mb-1">{title}</p>
      <p className="font-editorial-body text-xs text-ink-muted dark:text-night-muted max-w-md">{subtitle}</p>
    </div>
  );

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
        #starry-background { position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 1; opacity: 1; }
        .star { position: absolute; background-color: #fff; border-radius: 50%; pointer-events: none; }
        @keyframes starTwinkle { 0%, 100% { opacity: 0.2; transform: scale(0.8); } 50% { opacity: 0.9; transform: scale(1.3); } }
        .cards-scroll-container { display: flex; gap: 1.5rem; overflow-x: auto; scroll-behavior: smooth; -ms-overflow-style: none; scrollbar-width: none; padding: 0.25rem 0.25rem 0.5rem 0.25rem; }
        .cards-scroll-container::-webkit-scrollbar { display: none; }
        .offer-card { flex: 0 0 280px; min-width: 280px; width: 280px; }
        @media (min-width: 640px) { .offer-card { flex: 0 0 300px; min-width: 300px; width: 300px; } }
        @media (min-width: 1024px) { .offer-card { flex: 0 0 calc((100% - 4.5rem) / 4); min-width: calc((100% - 4.5rem) / 4); max-width: calc((100% - 4.5rem) / 4); width: calc((100% - 4.5rem) / 4); } }
        .potato-badge { display: inline-flex; align-items: center; gap: 0.35rem; background: rgba(184, 134, 11, 0.12); color: #B8860B; border: 1px solid rgba(184, 134, 11, 0.25); border-radius: 9999px; padding: 0.25rem 0.65rem; font-size: 0.8rem; font-weight: 700; font-family: var(--font-metadata); }
        .dark .potato-badge { background: rgba(212, 175, 55, 0.15); color: #D4AF37; border-color: rgba(212, 175, 55, 0.3); }
        #btnScrollToTop { position: fixed; bottom: 24px; left: 24px; z-index: 40; width: 44px; height: 44px; border-radius: 50%; background: #FFFEFA; color: #1E1F1D; border: 1px solid #E3DDD0; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(0,0,0,0.08); cursor: pointer; opacity: 0; visibility: hidden; transition: all 0.3s ease; }
        .dark #btnScrollToTop { background: #20221E; color: #EDE9DF; border-color: #2C2E29; box-shadow: 0 4px 14px rgba(0,0,0,0.4); }
        #btnScrollToTop.show { opacity: 1; visibility: visible; }
        #btnScrollToTop:hover { transform: translateY(-3px); background: #8E3038; color: #fff; border-color: #8E3038; }
        .dark #btnScrollToTop:hover { background: #B8860B; color: #111210; border-color: #B8860B; }
        #toast-notification { position: fixed; top: 24px; right: 24px; z-index: 1000; transform: translateX(120%); transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1); }
        #toast-notification.show { transform: translateX(0); }
        .combo-book-item { cursor: pointer; position: relative; z-index: 10; }
        .combo-book-item:hover { z-index: 30; }
        .combo-book-item .book-cover-wrapper { transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease; }
        .combo-book-item:hover .book-cover-wrapper { transform: translateY(-4px) scale(1.05); }
        .combo-book-popup { position: fixed !important; width: 320px; max-width: calc(100vw - 32px); background: rgba(15, 23, 42, 0.96) !important; color: #fff !important; border-radius: 16px; padding: 16px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.12); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); opacity: 0; visibility: hidden; pointer-events: none; transition: opacity 0.25s ease, transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), visibility 0.25s ease; z-index: 99999 !important; }
        .dark .combo-book-popup { background: rgba(24, 25, 22, 0.98) !important; border-color: rgba(212, 175, 55, 0.3); box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(212, 175, 55, 0.2); }
        .combo-book-popup.active { opacity: 1; visibility: visible; pointer-events: auto; }
        .combo-book-popup.pos-top { transform: translateY(6px); }
        .combo-book-popup.pos-top.active { transform: translateY(0); }
        .combo-book-popup.pos-top::after { content: ''; position: absolute; top: 100%; left: var(--arrow-left, 50%); transform: translateX(-50%); border-width: 7px; border-style: solid; border-color: rgba(15, 23, 42, 0.96) transparent transparent transparent; pointer-events: none; }
        .dark .combo-book-popup.pos-top::after { border-color: rgba(24, 25, 22, 0.98) transparent transparent transparent; }
        .combo-book-popup.pos-bottom { transform: translateY(-6px); }
        .combo-book-popup.pos-bottom.active { transform: translateY(0); }
        .combo-book-popup.pos-bottom::after { content: ''; position: absolute; bottom: 100%; left: var(--arrow-left, 50%); transform: translateX(-50%); border-width: 7px; border-style: solid; border-color: transparent transparent rgba(15, 23, 42, 0.96) transparent; pointer-events: none; }
        .dark .combo-book-popup.pos-bottom::after { border-color: transparent transparent rgba(24, 25, 22, 0.98) transparent; }
      `}} />

      {/* External Font Links */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Open+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400;1,600&family=Roboto:wght@300;400;500;700;900&display=swap" rel="stylesheet" />
      <link rel="stylesheet" type="text/css" href="https://unpkg.com/@phosphor-icons/web@2.1.1/src/bold/style.css" />
      <link rel="stylesheet" type="text/css" href="https://unpkg.com/@phosphor-icons/web@2.1.1/src/regular/style.css" />
      <link rel="stylesheet" type="text/css" href="https://unpkg.com/@phosphor-icons/web@2.1.1/src/fill/style.css" />
      <link rel="stylesheet" type="text/css" href="https://unpkg.com/@phosphor-icons/web@2.1.1/src/duotone/style.css" />
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />

      {/* Main Body Layout with HALM Header & Footer */}
      <UserLayout className="offers-page" onOpenChatbot={openChatbot} onThemeChange={setIsDark}>
        
        {/* Background Stars (Dark mode only) */}
        {renderStars()}

        {/* Toast Notification */}
        <div id="toast-notification" className={`flex items-center gap-3 px-5 py-4 rounded-xl bg-paper-surface dark:bg-night-card border border-wine/30 dark:border-gold/40 shadow-2xl text-ink dark:text-night-text ${toast.show ? 'show' : ''}`}>
          <div className="w-8 h-8 rounded-full bg-wine/10 dark:bg-gold/20 flex items-center justify-center text-wine dark:text-gold shrink-0">
            <i className="ph-bold ph-check text-lg"></i>
          </div>
          <div>
            <div className="font-display font-bold text-xs">{toast.title}</div>
            <div className="font-editorial-body text-xs text-ink-muted dark:text-night-muted">{toast.message}</div>
          </div>
        </div>

        {/* Header Hero Section */}
        <section className="pt-24 pb-8 sm:pt-28 sm:pb-10 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none -z-10">
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-r from-wine/10 via-gold/10 to-wine/5 blur-3xl rounded-full"></div>
          </div>
          <div className="w-full max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-paper-surface dark:bg-night-card border border-wine/20 dark:border-gold/30 shadow-sm text-xs font-metadata-spec font-bold text-wine dark:text-gold uppercase tracking-widest mb-3">
              <i className="ph-bold ph-sparkle text-gold"></i>Đặc Quyền Độc Giả HALM BOOK<i className="ph-bold ph-sparkle text-gold"></i>
            </div>
            <h1 className="font-display font-black text-3xl sm:text-5xl lg:text-6xl text-ink dark:text-night-text tracking-tight leading-[1.15] mb-3 max-w-4xl mx-auto">
              Ngập Tràn Ưu Đãi — Tiêu <span className="text-wine dark:text-gold relative inline-block">Khoai Thả Ga</span>
            </h1>
            <p className="font-editorial-body text-base sm:text-lg text-ink-muted dark:text-night-muted max-w-2xl mx-auto leading-relaxed mb-5">
              Mở khóa vô vàn đặc quyền hấp dẫn chỉ dành riêng cho độc giả của HALM BOOK. Nâng cấp trải nghiệm đọc, tích lũy tri thức và tối ưu hóa chi phí cùng khoai thưởng.
            </p>

            {/* Quick Stat Summary Cards (Khung tóm tắt danh mục ưu đãi) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-6">
              <div className="py-2.5 px-3 rounded-xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border shadow-sm flex flex-col items-center text-center">
                <span className="font-metadata-spec text-2xl font-black text-wine dark:text-gold mb-1">
                  {subscriptionOffers.length > 0 ? subscriptionOffers.length : '—'}
                </span>
                <span className="font-metadata-spec text-xs font-semibold text-ink-muted dark:text-night-muted">Gói Cước Ưu Đãi</span>
              </div>
              <div className="py-2.5 px-3 rounded-xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border shadow-sm flex flex-col items-center text-center">
                <span className="font-metadata-spec text-2xl font-black text-wine dark:text-gold mb-1">
                  {uploadOffers.length > 0 ? uploadOffers.length : '—'}
                </span>
                <span className="font-metadata-spec text-xs font-semibold text-ink-muted dark:text-night-muted">Tiện Ích Upload</span>
              </div>
              <div className="py-2.5 px-3 rounded-xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border shadow-sm flex flex-col items-center text-center">
                <span className="font-metadata-spec text-2xl font-black text-wine dark:text-gold mb-1">
                  {comboOffers.length > 0 ? comboOffers.length : '—'}
                </span>
                <span className="font-metadata-spec text-xs font-semibold text-ink-muted dark:text-night-muted">Combo Sách</span>
              </div>
              <div className="py-2.5 px-3 rounded-xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border shadow-sm flex flex-col items-center text-center">
                <span className="font-metadata-spec text-2xl font-black text-wine dark:text-gold mb-1">
                  {challengeOffers.length > 0 ? challengeOffers.length : '—'}
                </span>
                <span className="font-metadata-spec text-xs font-semibold text-ink-muted dark:text-night-muted">Thử Thách Đọc</span>
              </div>
            </div>

            {/* Quick Navigation Filter Pills */}
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <a href="#row-subscription" className="px-4 py-2 rounded-full text-xs font-metadata-spec font-bold bg-paper-surface dark:bg-night-card hover:bg-wine hover:text-white dark:hover:bg-gold dark:hover:text-night-bg border border-paper-border dark:border-night-border text-ink dark:text-night-text transition-colors shadow-sm"><i className="ph-bold ph-crown mr-1"></i> Gói Cước</a>
              <a href="#row-combo" className="px-4 py-2 rounded-full text-xs font-metadata-spec font-bold bg-paper-surface dark:bg-night-card hover:bg-wine hover:text-white dark:hover:bg-gold dark:hover:text-night-bg border border-paper-border dark:border-night-border text-ink dark:text-night-text transition-colors shadow-sm"><i className="ph-bold ph-stack mr-1"></i> Combo Sách Kinh Điển</a>
              <a href="#row-upload" className="px-4 py-2 rounded-full text-xs font-metadata-spec font-bold bg-paper-surface dark:bg-night-card hover:bg-wine hover:text-white dark:hover:bg-gold dark:hover:text-night-bg border border-paper-border dark:border-night-border text-ink dark:text-night-text transition-colors shadow-sm"><i className="ph-bold ph-cloud-arrow-up mr-1"></i> Tiện Ích Upload</a>
              <a href="#row-single-books" className="px-4 py-2 rounded-full text-xs font-metadata-spec font-bold bg-paper-surface dark:bg-night-card hover:bg-wine hover:text-white dark:hover:bg-gold dark:hover:text-night-bg border border-paper-border dark:border-night-border text-ink dark:text-night-text transition-colors shadow-sm"><i className="ph-bold ph-book-open mr-1"></i> Sách Lẻ Giảm Sâu</a>
              <a href="#row-reading-challenge" className="px-4 py-2 rounded-full text-xs font-metadata-spec font-bold bg-paper-surface dark:bg-night-card hover:bg-wine hover:text-white dark:hover:bg-gold dark:hover:text-night-bg border border-paper-border dark:border-night-border text-ink dark:text-night-text transition-colors shadow-sm"><i className="ph-bold ph-medal mr-1"></i> Thử Thách Đọc</a>
            </div>
          </div>
        </section>

        {/* Main Content Area */}
        <main className="w-full max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8 space-y-10 sm:space-y-11 pb-12 sm:pb-14 flex-1">

          {/* Section 1: Gói Cước Đặc Quyền */}
          <section id="row-subscription" className="scroll-mt-28">
            <div className="flex items-center justify-between pb-3 border-b border-paper-border dark:border-night-border mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-wine/10 dark:bg-gold/15 text-wine dark:text-gold flex items-center justify-center text-xl shrink-0">
                  <i className="ph-bold ph-crown"></i>
                </div>
                <div>
                  <h2 className="font-display font-black text-xl sm:text-2xl text-ink dark:text-night-text tracking-tight">Giảm Giá Gói Cước Đặc Quyền</h2>
                  <p className="font-editorial-body text-xs sm:text-sm text-ink-muted dark:text-night-muted">Mở khóa thư viện sách không giới hạn, audiobook AI chất lượng cao và đặc quyền hội viên.</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => scrollRow('cards-row-1', -340)} className="w-9 h-9 rounded-full bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border text-ink dark:text-night-text hover:bg-wine hover:text-white dark:hover:bg-gold dark:hover:text-night-bg flex items-center justify-center transition-colors shadow-sm"><i className="ph-bold ph-caret-left text-sm"></i></button>
                <button type="button" onClick={() => scrollRow('cards-row-1', 340)} className="w-9 h-9 rounded-full bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border text-ink dark:text-night-text hover:bg-wine hover:text-white dark:hover:bg-gold dark:hover:text-night-bg flex items-center justify-center transition-colors shadow-sm"><i className="ph-bold ph-caret-right text-sm"></i></button>
              </div>
            </div>

            {/* TODO(API): Tải danh sách gói cước từ database */}
            <div id="cards-row-1" className="cards-scroll-container">
              {subscriptionOffers.length === 0 ? (
                renderEmptySection('ph-crown', 'Chưa có gói cước ưu đãi nào đang mở', 'Dữ liệu các gói nạp và gói cước hội viên sẽ được cập nhật tự động từ cơ sở dữ liệu.')
              ) : (
                subscriptionOffers.map((item) => (
                  <div key={item.id} className="offer-card rounded-2xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between relative group">
                    <div className="space-y-3.5">
                      <div className="relative h-28 w-full rounded-xl overflow-hidden bg-paper-200 dark:bg-night-surface shadow-inner flex items-center justify-center">
                        {item.img ? (
                          <img src={item.img} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-wine/10 dark:bg-gold/15 text-wine dark:text-gold flex items-center justify-center text-3xl">
                            <i className="ph-bold ph-crown"></i>
                          </div>
                        )}
                        {item.tag && (
                          <span className="absolute top-2.5 right-2.5 font-metadata-spec text-[10px] font-bold px-2 py-0.5 rounded-full bg-wine text-white shadow-sm">
                            {item.tag}
                          </span>
                        )}
                      </div>
                      <div>
                        {item.category && (
                          <span className="font-metadata-spec text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-paper-200 dark:bg-night-border text-ink-muted dark:text-night-muted">
                            {item.category}
                          </span>
                        )}
                        <h3 className="font-display font-black text-lg text-ink dark:text-night-text mt-1.5 leading-tight">
                          {item.name}
                        </h3>
                      </div>
                      {item.features && item.features.length > 0 && (
                        <ul className="space-y-1.5 pt-2 text-xs font-metadata-spec text-ink-muted dark:text-night-muted border-t border-paper-border/60 dark:border-night-border/60">
                          {item.features.map((f, i) => (
                            <li key={i} className="flex items-center gap-2">
                              <i className="ph-bold ph-check-circle text-emerald-600 dark:text-emerald-400 text-sm shrink-0"></i>
                              <span className="truncate">{f}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="pt-3.5 border-t border-paper-border dark:border-night-border mt-3.5">
                      <div className="flex items-baseline justify-between mb-3.5">
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-metadata-spec text-2xl font-black text-ink dark:text-night-text">{item.potato || 0}</span>
                          <span className="potato-badge">Khoai <i className="ph-fill ph-coins text-[10px]"></i></span>
                        </div>
                        {item.duration && (
                          <span className="font-metadata-spec text-xs text-ink-muted dark:text-night-muted">/ {item.duration}</span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => openRedeemModal(item.name, item.potato || 0, `Đổi ${item.name} thành công!`)}
                        className="w-full py-2.5 rounded-full bg-wine hover:bg-wine-dark text-white font-metadata-spec text-xs font-bold text-center transition-colors shadow-sm"
                      >
                        {item.action || 'Đổi Khoai Ngay'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Section 2: Tiện Ích Upload & Voucher Ưu Đãi */}
          <section id="row-upload" className="scroll-mt-28">
            <div className="flex items-center justify-between pb-3 border-b border-paper-border dark:border-night-border mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gold/15 text-gold flex items-center justify-center text-xl shrink-0">
                  <i className="ph-bold ph-ticket"></i>
                </div>
                <div>
                  <h2 className="font-display font-black text-xl sm:text-2xl text-ink dark:text-night-text tracking-tight">Mã Giảm Giá & Tiện Ích Đặc Quyền</h2>
                  <p className="font-editorial-body text-xs sm:text-sm text-ink-muted dark:text-night-muted">Voucher chiết khấu nạp Khoai, mã giảm giá thuê sách và tiện ích tải lên từ hệ thống.</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => scrollRow('cards-row-2', -340)} className="w-9 h-9 rounded-full bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border text-ink dark:text-night-text hover:bg-wine hover:text-white dark:hover:bg-gold dark:hover:text-night-bg flex items-center justify-center transition-colors shadow-sm"><i className="ph-bold ph-caret-left text-sm"></i></button>
                <button type="button" onClick={() => scrollRow('cards-row-2', 340)} className="w-9 h-9 rounded-full bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border text-ink dark:text-night-text hover:bg-wine hover:text-white dark:hover:bg-gold dark:hover:text-night-bg flex items-center justify-center transition-colors shadow-sm"><i className="ph-bold ph-caret-right text-sm"></i></button>
              </div>
            </div>

            <div id="cards-row-2" className="cards-scroll-container">
              {uploadOffers.length === 0 ? (
                renderEmptySection('ph-ticket', 'Chưa có voucher ưu đãi', 'Các mã giảm giá và voucher quà tặng từ hệ thống sẽ hiển thị tại đây khi được kích hoạt.')
              ) : (
                uploadOffers.map((item) => (
                  <div key={item.id} className="offer-card rounded-2xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between relative group">
                    <div className="space-y-3.5">
                      <div className="relative h-28 w-full rounded-xl overflow-hidden bg-paper-200 dark:bg-night-surface shadow-inner flex items-center justify-center">
                        <div className="w-12 h-12 rounded-xl bg-gold/15 text-gold flex items-center justify-center text-3xl">
                          <i className="ph-bold ph-ticket"></i>
                        </div>
                        {item.tag && (
                          <span className="absolute top-2.5 right-2.5 font-metadata-spec text-[10px] font-bold px-2 py-0.5 rounded-full bg-gold text-ink-pure shadow-sm">
                            {item.tag}
                          </span>
                        )}
                      </div>
                      <div>
                        {item.category && (
                          <span className="font-metadata-spec text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-paper-200 dark:bg-night-border text-ink-muted dark:text-night-muted">
                            {item.category}
                          </span>
                        )}
                        <h3 className="font-display font-black text-lg text-ink dark:text-night-text mt-1.5 leading-tight">{item.title}</h3>
                      </div>
                      {item.features && item.features.length > 0 && (
                        <ul className="space-y-1.5 pt-2 text-xs font-metadata-spec text-ink-muted dark:text-night-muted border-t border-paper-border/60 dark:border-night-border/60">
                          {item.features.map((f, i) => (
                            <li key={i} className="flex items-center gap-2">
                              <i className="ph-bold ph-check-circle text-emerald-600 dark:text-emerald-400 text-sm shrink-0"></i>
                              <span className="truncate">{f}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="pt-3.5 border-t border-paper-border dark:border-night-border mt-3.5">
                      <div className="flex items-baseline justify-between mb-3.5">
                        <span className="font-mono text-xs px-2 py-1 rounded bg-paper-200 dark:bg-night-border font-bold text-wine dark:text-gold">
                          {item.code || item.id}
                        </span>
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-metadata-spec text-xl font-black text-ink dark:text-night-text">{item.potato || 0}</span>
                          <span className="potato-badge">Khoai <i className="ph-fill ph-coins text-[10px]"></i></span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => openRedeemModal(item.title, item.cost || 0, `Đổi mã ${item.code || item.title} thành công!`)}
                        className="w-full py-2.5 rounded-full bg-wine hover:bg-wine-dark text-white font-metadata-spec text-xs font-bold text-center transition-colors shadow-sm"
                      >
                        {item.action || 'Sử Dụng Ngay'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Section 3: Bộ Sưu Tập Combo Sách Kinh Điển */}
          <section id="row-combo" className="scroll-mt-28">
            <div className="flex items-center justify-between pb-3 border-b border-paper-border dark:border-night-border mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-wine/10 dark:bg-gold/15 text-wine dark:text-gold flex items-center justify-center text-xl shrink-0"><i className="ph-bold ph-stack"></i></div>
                <div><h2 className="font-display font-black text-xl sm:text-2xl text-ink dark:text-night-text tracking-tight">Bộ Sưu Tập Combo Sách Kinh Điển</h2></div>
              </div>
              <div className="text-xs font-metadata-spec text-ink-muted dark:text-night-muted hidden sm:block">Giá được thanh toán bằng Khoai trong ví của bạn.</div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {comboOffers.length === 0 ? (
                <div className="col-span-1 sm:col-span-2 lg:col-span-3 w-full">
                  {renderEmptySection('ph-stack', 'Chưa có combo sách ưu đãi', 'Các bộ sưu tập sách theo chủ đề đi kèm mức giá ưu đãi đang được cập nhật từ hệ thống.')}
                </div>
              ) : (
                comboOffers.map((item) => (
                  <div key={item.id} className="rounded-2xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border p-4 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between relative group">
                    <div className="space-y-3">
                      <div className="relative h-40 w-full rounded-xl overflow-hidden bg-paper-200 dark:bg-night-surface shadow-inner flex items-center justify-center">
                        {item.img ? (
                          <img src={item.img} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-wine/10 dark:bg-gold/15 text-wine dark:text-gold flex items-center justify-center text-3xl">
                            <i className="ph-bold ph-stack"></i>
                          </div>
                        )}
                        {item.discount && (
                          <span className="absolute top-2.5 right-2.5 font-metadata-spec text-[10px] font-bold px-2 py-0.5 rounded-full bg-wine text-white shadow-sm">
                            {item.discount}
                          </span>
                        )}
                      </div>
                      <div>
                        <h3 className="font-display font-black text-base text-ink dark:text-night-text leading-tight line-clamp-1">{item.name}</h3>
                        <p className="font-editorial-body text-xs text-ink-muted dark:text-night-muted mt-1 line-clamp-2">{item.desc}</p>
                      </div>
                      {item.books && item.books.length > 0 && (
                        <div className="space-y-1 pt-2 border-t border-paper-border/60 dark:border-night-border/60">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-ink-muted dark:text-night-muted">Gồm {item.books.length} tác phẩm:</p>
                          {item.books.slice(0, 3).map((b, i) => (
                            <div key={i} className="flex items-center gap-1.5 text-xs text-ink/80 dark:text-night-text/80 truncate">
                              <i className="ph-bold ph-bookmark-simple text-wine dark:text-gold text-xs shrink-0"></i>
                              <span className="truncate">{b}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="pt-3.5 border-t border-paper-border dark:border-night-border mt-3.5">
                      <div className="flex items-baseline justify-between mb-3">
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-metadata-spec text-xl font-black text-ink dark:text-night-text">{item.potato}</span>
                          <span className="potato-badge">Khoai <i className="ph-fill ph-coins text-[10px]"></i></span>
                        </div>
                        {item.originalPotato && (
                          <span className="text-xs line-through text-ink-muted dark:text-night-muted">{item.originalPotato} Khoai</span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => openRedeemModal(item.name, item.potato || 0, `Mở khóa combo "${item.name}" thành công!`)}
                        className="w-full py-2 rounded-full bg-wine hover:bg-wine-dark text-white font-metadata-spec text-xs font-bold text-center transition-colors shadow-sm"
                      >
                        {item.action || 'Mở Khóa Combo'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Section 4: Sách Lẻ Giảm Sâu */}
          <section id="row-single-books" className="scroll-mt-28">
            <div className="flex items-center justify-between pb-3 border-b border-paper-border dark:border-night-border mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-wine/10 dark:bg-gold/15 text-wine dark:text-gold flex items-center justify-center text-xl shrink-0"><i className="ph-bold ph-book-open"></i></div>
                <div>
                  <h2 className="font-display font-black text-xl sm:text-2xl text-ink dark:text-night-text tracking-tight">Sách Lẻ Giảm Sâu</h2>
                  <p className="font-editorial-body text-xs sm:text-sm text-ink-muted dark:text-night-muted">Các kiệt tác văn học, tư duy và khoa học kinh điển với chi phí mở khóa cực thấp.</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => scrollRow('cards-row-4', -340)} className="w-9 h-9 rounded-full bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border text-ink dark:text-night-text hover:bg-wine hover:text-white dark:hover:bg-gold dark:hover:text-night-bg flex items-center justify-center transition-colors shadow-sm"><i className="ph-bold ph-caret-left text-sm"></i></button>
                <button type="button" onClick={() => scrollRow('cards-row-4', 340)} className="w-9 h-9 rounded-full bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border text-ink dark:text-night-text hover:bg-wine hover:text-white dark:hover:bg-gold dark:hover:text-night-bg flex items-center justify-center transition-colors shadow-sm"><i className="ph-bold ph-caret-right text-sm"></i></button>
              </div>
            </div>

            <div id="cards-row-4" className="cards-scroll-container">
              {singleBookDeals.length === 0 ? (
                renderEmptySection('ph-book-open', 'Chưa có sách lẻ giảm sâu', 'Danh sách tác phẩm có chi phí mở khóa ưu đãi sẽ được hiển thị khi kết nối dữ liệu.')
              ) : (
                singleBookDeals.map((item) => (
                  <div key={item.id} className="offer-card rounded-2xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border p-4 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between relative group">
                    <div className="space-y-3">
                      <div className="relative h-44 w-full rounded-xl overflow-hidden bg-paper-200 dark:bg-night-surface shadow-inner flex items-center justify-center">
                        {item.img ? (
                          <img src={item.img} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-wine/10 dark:bg-gold/15 text-wine dark:text-gold flex items-center justify-center text-3xl">
                            <i className="ph-bold ph-book-open"></i>
                          </div>
                        )}
                        {item.discount && (
                          <span className="absolute top-2.5 right-2.5 font-metadata-spec text-[10px] font-bold px-2 py-0.5 rounded-full bg-wine text-white shadow-sm">
                            {item.discount}
                          </span>
                        )}
                      </div>
                      <div>
                        <span className="font-metadata-spec text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-paper-200 dark:bg-night-border text-ink-muted dark:text-night-muted truncate max-w-full inline-block">
                          {item.author}
                        </span>
                        <h3 className="font-display font-black text-base text-ink dark:text-night-text mt-1.5 leading-tight line-clamp-2">
                          {item.name}
                        </h3>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-paper-border dark:border-night-border mt-3">
                      <div className="flex items-baseline justify-between mb-3">
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-metadata-spec text-xl font-black text-ink dark:text-night-text">{item.potato}</span>
                          <span className="potato-badge">Khoai <i className="ph-fill ph-coins text-[10px]"></i></span>
                        </div>
                        {item.originalPotato && (
                          <span className="text-xs line-through text-ink-muted dark:text-night-muted">{item.originalPotato} Khoai</span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => openRedeemModal(item.name, item.potato || 0, `Thuê sách "${item.name}" thành công!`)}
                        className="w-full py-2 rounded-full bg-wine hover:bg-wine-dark text-white font-metadata-spec text-xs font-bold text-center transition-colors shadow-sm"
                      >
                        {item.action || 'Thuê Ngay'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Section 5: Ưu Đãi Thử Thách Đọc Sách */}
          <section id="row-reading-challenge" className="scroll-mt-28">
            <div className="flex items-center justify-between pb-3 border-b border-paper-border dark:border-night-border mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gold/15 text-gold flex items-center justify-center text-xl shrink-0"><i className="ph-bold ph-medal"></i></div>
                <div>
                  <h2 className="font-display font-black text-xl sm:text-2xl text-ink dark:text-night-text tracking-tight">Ưu Đãi Thử Thách Đọc Sách</h2>
                  <p className="font-editorial-body text-xs sm:text-sm text-ink-muted dark:text-night-muted">Chinh phục chuỗi ngày đọc sách liên tục để nhận voucher giảm giá và thưởng nóng Khoai.</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => scrollRow('cards-row-5', -340)} className="w-9 h-9 rounded-full bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border text-ink dark:text-night-text hover:bg-wine hover:text-white dark:hover:bg-gold dark:hover:text-night-bg flex items-center justify-center transition-colors shadow-sm"><i className="ph-bold ph-caret-left text-sm"></i></button>
                <button type="button" onClick={() => scrollRow('cards-row-5', 340)} className="w-9 h-9 rounded-full bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border text-ink dark:text-night-text hover:bg-wine hover:text-white dark:hover:bg-gold dark:hover:text-night-bg flex items-center justify-center transition-colors shadow-sm"><i className="ph-bold ph-caret-right text-sm"></i></button>
              </div>
            </div>

            <div id="cards-row-5" className="cards-scroll-container">
              {challengeOffers.length === 0 ? (
                renderEmptySection('ph-medal', 'Chưa có thử thách đọc sách mới', 'Các sự kiện đọc sách và thử thách tích lũy điểm Khoai sẽ được cập nhật sớm.')
              ) : (
                challengeOffers.map((item) => (
                  <div key={item.id} className="offer-card rounded-2xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between relative group">
                    <div className="space-y-3.5">
                      <div className="relative h-28 w-full rounded-xl overflow-hidden bg-gold/10 dark:bg-gold/15 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-xl bg-gold/20 text-gold flex items-center justify-center text-3xl">
                          <i className="ph-bold ph-medal"></i>
                        </div>
                        {item.tag && (
                          <span className="absolute top-2.5 right-2.5 font-metadata-spec text-[10px] font-bold px-2 py-0.5 rounded-full bg-gold text-ink-pure shadow-sm">
                            {item.tag}
                          </span>
                        )}
                      </div>
                      <div>
                        {item.category && (
                          <span className="font-metadata-spec text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-paper-200 dark:bg-night-border text-ink-muted dark:text-night-muted">
                            {item.category}
                          </span>
                        )}
                        <h3 className="font-display font-black text-lg text-ink dark:text-night-text mt-1.5 leading-tight">{item.name}</h3>
                        <p className="font-editorial-body text-xs text-ink-muted dark:text-night-muted mt-1 leading-relaxed">{item.desc}</p>
                      </div>
                      {item.features && item.features.length > 0 && (
                        <ul className="space-y-1.5 pt-2 text-xs font-metadata-spec text-ink-muted dark:text-night-muted border-t border-paper-border/60 dark:border-night-border/60">
                          {item.features.map((f, i) => (
                            <li key={i} className="flex items-center gap-2">
                              <i className="ph-bold ph-check-circle text-gold text-sm shrink-0"></i>
                              <span className="truncate">{f}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="pt-3.5 border-t border-paper-border dark:border-night-border mt-3.5">
                      <div className="flex items-baseline justify-between mb-3.5">
                        <span className="text-xs font-metadata-spec text-ink-muted dark:text-night-muted">Phần thưởng:</span>
                        <span className="font-metadata-spec text-base font-black text-emerald-600 dark:text-emerald-400">{item.reward}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => openRedeemModal(item.name, 0, `Đã tham gia thử thách "${item.name}"!`)}
                        className="w-full py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-metadata-spec text-xs font-bold text-center transition-colors shadow-sm"
                      >
                        {item.action || 'Tham Gia Ngay'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </main>

        {/* Form Modal: Xác Nhận Đổi Ưu Đãi (Giữ lại form để người dùng thao tác) */}
        <div id="redeem-modal" className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm items-center justify-center p-4 ${modalConfig ? 'flex' : 'hidden'}`} onClick={(e) => { if (e.target.id === 'redeem-modal') closeRedeemModal(); }}>
          <div className="bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-paper-border dark:border-night-border">
              <div className="flex items-center gap-2 text-wine dark:text-gold font-display font-black text-base">
                <i className="ph-bold ph-ticket text-xl"></i>
                <span>Xác Nhận Đổi Ưu Đãi</span>
              </div>
              <button type="button" onClick={closeRedeemModal} className="text-ink-muted hover:text-ink dark:hover:text-white transition-colors">
                <i className="ph-bold ph-x text-lg"></i>
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-paper dark:bg-night-surface border border-paper-border dark:border-night-border">
                <div className="text-xs font-metadata-spec text-ink-muted dark:text-night-muted">Mục ưu đãi:</div>
                <div className="text-base font-display font-black text-ink dark:text-night-text mt-0.5">{modalConfig?.title}</div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs font-metadata-spec">
                <div className="p-3 rounded-xl bg-paper dark:bg-night-surface border border-paper-border dark:border-night-border">
                  <span className="text-ink-muted dark:text-night-muted">Chi phí:</span>
                  <div className="text-sm font-bold text-wine dark:text-gold mt-1">{modalConfig?.cost > 0 ? `${modalConfig.cost.toLocaleString('vi-VN')} Khoai` : '0 Khoai (Miễn Phí)'}</div>
                </div>
                <div className="p-3 rounded-xl bg-paper dark:bg-night-surface border border-paper-border dark:border-night-border">
                  <span className="text-ink-muted dark:text-night-muted">Số dư hiện tại:</span>
                  <div className="text-sm font-bold text-ink dark:text-night-text mt-1">{khoaiBalance.toLocaleString('vi-VN')} Khoai</div>
                </div>
              </div>
              <p className="font-editorial-body text-xs text-ink-muted dark:text-night-muted">Sau khi xác nhận, ưu đãi sẽ được kích hoạt tức thì vào tài khoản của bạn.</p>
            </div>

            <div className="flex items-center gap-3 pt-3">
              <button type="button" onClick={closeRedeemModal} className="flex-1 py-2.5 rounded-full border border-paper-border dark:border-night-border hover:bg-paper-200 dark:hover:bg-night-surface font-metadata-spec text-xs font-bold text-ink dark:text-night-text transition-colors">Hủy Bỏ</button>
              <button type="button" onClick={handleConfirmRedeem} disabled={modalConfig && khoaiBalance < modalConfig.cost} className={`flex-1 py-2.5 rounded-full font-metadata-spec text-xs font-bold transition-colors shadow-sm ${modalConfig && khoaiBalance < modalConfig.cost ? 'bg-paper-border dark:bg-night-border text-ink-muted cursor-not-allowed' : 'bg-wine hover:bg-wine-dark text-white'}`}>
                {modalConfig && khoaiBalance < modalConfig.cost ? 'Số Dư Khoai Không Đủ' : (modalConfig?.cost > 0 ? 'Xác Nhận Đổi Khoai' : 'Xác Nhận Ngay')}
              </button>
            </div>
          </div>
        </div>

        {/* Combo Book Popup */}
        <div 
          ref={comboPopupRef}
          id="combo-book-popup" 
          className={`combo-book-popup ${popupState.posClass} ${popupState.active ? 'active' : ''}`} 
          style={{ 
            display: popupState.display, 
            visibility: popupState.visibility, 
            top: popupState.top, 
            left: popupState.left, 
            '--arrow-left': `${popupState.arrowLeft}px` 
          }}
          onMouseEnter={clearAllPopupTimers}
          onMouseMove={clearAllPopupTimers}
          onMouseLeave={(e) => {
            const related = e.relatedTarget;
            if (related && related.closest && related.closest('.combo-book-item')) return;
            handleBookLeave();
          }}
        >
          {popupState.book && (
            <>
              <div className="flex items-start gap-3">
                <img src={popupState.book.cover} alt="Cover" className="w-16 h-24 object-cover rounded-md shadow-md border border-white/20 shrink-0" style={{ display: popupState.book.cover ? 'block' : 'none' }} />
                <div className="flex-1 min-w-0 space-y-1">
                  <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-gold/20 text-gold border border-gold/30">{popupState.book.category}</span>
                  <h4 className="font-display font-black text-sm text-white leading-snug line-clamp-2">{popupState.book.title}</h4>
                  <div className="text-[11px] text-slate-300 font-semibold truncate">{popupState.book.author}</div>
                  <div className="flex items-center gap-2 text-[11px] text-amber-400 font-semibold pt-0.5">
                    <span>{popupState.book.rating}</span><span className="text-slate-500">•</span><span className="text-slate-300">{popupState.book.pages}</span>
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-white/10 text-xs text-slate-300 font-editorial-body line-clamp-3 leading-relaxed">
                {popupState.book.summary}
              </div>
              <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-xs">
                <span className="text-slate-400">Giá mua/thuê lẻ:</span>
                <span className="font-bold text-gold">{popupState.book.price}</span>
              </div>
            </>
          )}
        </div>

        {/* Scroll To Top Button */}
        <button id="btnScrollToTop" title="Lên đầu trang" className={showScrollTop ? 'show' : ''} onClick={scrollToTop}>
          <i className="ph-bold ph-arrow-up text-lg"></i>
        </button>

      </UserLayout>
    </>
  );
}
