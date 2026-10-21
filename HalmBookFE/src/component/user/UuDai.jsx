import React, { useState, useEffect, useRef } from 'react';

export default function OffersEnd() {
  const [khoaiBalance, setKhoaiBalance] = useState(1250);
  const [isDark, setIsDark] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Toast State
  const [toast, setToast] = useState({ show: false, title: '', message: '' });
  
  // Modal State
  const [modalConfig, setModalConfig] = useState(null); // null means closed
  
  // Chatbot State
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [showChatWelcome, setShowChatWelcome] = useState(true);
  
  // Combo Popup State
  const [popupState, setPopupState] = useState({
    display: 'none', visibility: 'hidden', active: false,
    top: 0, left: 0, arrowLeft: 50, posClass: '',
    book: null
  });

  const chatMessagesRef = useRef(null);
  const popupHideTimeout = useRef(null);
  const popupCloseTimeout = useRef(null);
  const comboPopupRef = useRef(null);

  useEffect(() => {
    // 1. Inject Tailwind script dynamically for React environment
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

    // 2. Scroll listener for Navbar & Scroll To Top
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
      setShowScrollTop(window.scrollY > 320);
    };
    window.addEventListener('scroll', handleScroll);

    // 3. Theme initialization
    const savedTheme = localStorage.getItem('color-theme') || 'light';
    if (savedTheme === 'dark') {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    localStorage.setItem('color-theme', newTheme ? 'dark' : 'light');
    if (newTheme) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const renderStars = () => {
    if (!isDark) return null;
    const stars = [];
    for (let i = 0; i < 80; i++) {
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

  const handleOfferSearch = (e) => {
    e.preventDefault();
    const input = document.getElementById('header-search-input');
    const query = input?.value.toLowerCase().trim();
    if (!query) return;

    const allCards = document.querySelectorAll('.cards-scroll-container > div');
    let matched = false;
    allCards.forEach(card => {
      const title = card.querySelector('h3')?.textContent.toLowerCase() || '';
      const desc = card.querySelector('p')?.textContent.toLowerCase() || '';
      if (title.includes(query) || desc.includes(query)) {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        card.classList.add('ring-2', 'ring-wine', 'dark:ring-gold');
        setTimeout(() => card.classList.remove('ring-2', 'ring-wine', 'dark:ring-gold'), 3000);
        matched = true;
      }
    });
    if (!matched) triggerToast('Tìm Kiếm', `Không tìm thấy ưu đãi phù hợp với "${query}".`);
  };

  const openChatbot = (initialMsg) => {
    setChatOpen(true);
    if (initialMsg) {
      sendChatMessage(initialMsg);
    }
  };

  const sendChatMessage = (text) => {
    if (!text.trim()) return;
    setShowChatWelcome(false);
    setChatMessages(prev => [...prev, { type: 'user', text }]);
    setChatInput('');
    
    // Scroll chat to bottom
    setTimeout(() => {
      if (chatMessagesRef.current) chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }, 50);

    setTimeout(() => {
      const q = text.toLowerCase();
      let reply = "Cảm ơn bạn đã hỏi. HALM BOOK đang có các chương trình giảm 50% Gói VIP 1 Năm, 3 lần upload AI miễn phí và nhiều combo sách cực tiết kiệm. Bạn muốn tìm hiểu gói nào?";
      if (q.includes('sinh viên') || q.includes('hssv')) {
        reply = "Gói Sinh Viên hiện đang có giá chỉ <strong>50 Khoai / tháng</strong>! Bạn chỉ cần tải ảnh thẻ HSSV hợp lệ để kích hoạt ngay đặc quyền đọc toàn bộ kho sách.";
      } else if (q.includes('khoai') || q.includes('thưởng')) {
        reply = "Bạn có thể tích lũy Khoai bằng cách: Duy trì chuỗi đọc 7 ngày (+10 Khoai), hoàn thành thử thách đọc sách hoặc nạp điểm Khoai tại mục Tài Khoản.";
      } else if (q.includes('upload') || q.includes('tài liệu')) {
        reply = "Thành viên mới được <strong>Free 3 lượt upload đầu tiên</strong>! Sau đó bạn có thể chọn gói ngày 10 Khoai hoặc gói không giới hạn 30 Khoai/tháng.";
      } else if (q.includes('combo')) {
        reply = "Hiện có 3 combo hot: Combo Kỹ Năng Sống (120 Khoai), Combo Trinh Thám (200 Khoai) và Combo Ngôn Tình (247 Khoai, giảm 45%).";
      }
      setChatMessages(prev => [...prev, { type: 'bot', text: reply }]);
      setTimeout(() => {
        if (chatMessagesRef.current) chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
      }, 50);
    }, 600);
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
    
    // measure dimensions
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
        #navbar { transition: transform 0.38s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease, padding 0.3s ease; will-change: transform; }
        #navbar.scrolled { background-color: rgba(247, 244, 238, 0.94); backdrop-filter: blur(16px); border-color: rgba(227, 221, 208, 0.8); box-shadow: 0 4px 20px -4px rgba(0,0,0,0.06); }
        .dark #navbar.scrolled { background-color: rgba(17, 18, 16, 0.94); border-color: rgba(44, 46, 41, 0.8); box-shadow: 0 4px 25px -4px rgba(0,0,0,0.5); }
        .cards-scroll-container { display: flex; gap: 1.5rem; overflow-x: auto; scroll-behavior: smooth; -ms-overflow-style: none; scrollbar-width: none; padding: 0.25rem 0.25rem 0.5rem 0.25rem; }
        .cards-scroll-container::-webkit-scrollbar { display: none; }
        .offer-card { flex: 0 0 280px; min-width: 280px; width: 280px; }
        @media (min-width: 640px) { .offer-card { flex: 0 0 300px; min-width: 300px; width: 300px; } }
        @media (min-width: 1024px) { .offer-card { flex: 0 0 calc((100% - 4.5rem) / 4); min-width: calc((100% - 4.5rem) / 4); max-width: calc((100% - 4.5rem) / 4); width: calc((100% - 4.5rem) / 4); } }
        .potato-badge { display: inline-flex; align-items: center; gap: 0.35rem; background: rgba(184, 134, 11, 0.12); color: #B8860B; border: 1px solid rgba(184, 134, 11, 0.25); border-radius: 9999px; padding: 0.25rem 0.65rem; font-size: 0.8rem; font-weight: 700; font-family: var(--font-metadata); }
        .dark .potato-badge { background: rgba(212, 175, 55, 0.15); color: #D4AF37; border-color: rgba(212, 175, 55, 0.3); }
        #chatbot-container { position: fixed; bottom: 24px; right: 24px; z-index: 50; }
        #chat-window { position: absolute; bottom: 70px; right: 0; width: 360px; height: 480px; max-width: calc(100vw - 32px); background: #181916; border: 1px solid #2C2E29; border-radius: 16px; box-shadow: 0 20px 40px rgba(0,0,0,0.6); display: flex; flex-direction: column; overflow: hidden; transform: scale(0.9) translateY(20px); opacity: 0; pointer-events: none; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); transform-origin: bottom right; }
        #chat-window.show { transform: scale(1) translateY(0); opacity: 1; pointer-events: auto; }
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

      {/* Main Body Wrapper */}
      <div className="paper-grain relative min-h-screen flex flex-col font-sans bg-paper dark:bg-night-bg text-ink dark:text-night-text transition-colors duration-400">
        
        {/* Background Stars (Dark mode only) */}
        {renderStars()}

        {}
        <div id="toast-notification" className={`flex items-center gap-3 px-5 py-4 rounded-xl bg-paper-surface dark:bg-night-card border border-wine/30 dark:border-gold/40 shadow-2xl text-ink dark:text-night-text ${toast.show ? 'show' : ''}`}>
          <div className="w-8 h-8 rounded-full bg-wine/10 dark:bg-gold/20 flex items-center justify-center text-wine dark:text-gold shrink-0">
            <i className="ph-bold ph-check text-lg"></i>
          </div>
          <div>
            <div className="font-display font-bold text-xs">{toast.title}</div>
            <div className="font-editorial-body text-xs text-ink-muted dark:text-night-muted">{toast.message}</div>
          </div>
        </div>

        {}
        <header id="navbar" className={`fixed top-0 inset-x-0 z-40 transition-all duration-300 py-4 border-b border-transparent ${isScrolled ? 'scrolled' : ''}`}>
          <div className="w-full max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
            
            {/* Logo */}
            <a href="testhome/tc.html" className="flex items-center gap-3 group shrink-0" aria-label="HALM BOOK Homepage">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-wine flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
                <img src="testhome/img/icon-removebg-preview.png" alt="Logo" className="w-8 h-8 object-contain" onError={(e) => { e.currentTarget.src = './image/LOGO HALM BOOK/logo.png'; }} />
              </div>
              <div className="flex flex-col">
                <span className="font-display font-black text-xl sm:text-2xl tracking-tight text-ink dark:text-night-text leading-tight group-hover:text-wine dark:group-hover:text-gold transition-colors">HALM BOOK</span>
                <span className="font-metadata-spec text-[9px] uppercase tracking-[0.22em] font-semibold text-ink-muted dark:text-night-muted -mt-0.5">Special Offers & Privileges</span>
              </div>
            </a>

            {/* Navigation Links */}
            <nav className="hidden lg:flex items-center gap-7 text-xs font-bold tracking-wider uppercase text-ink/80 dark:text-night-muted">
              <a href="testhome/tc.html" className="hover:text-wine dark:hover:text-gold transition-colors">Trang Chủ</a>
              <a href="offers.html" className="text-wine dark:text-gold font-black transition-colors relative after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-full after:h-0.5 after:bg-wine dark:after:bg-gold">Ưu Đãi</a>
              <a href="tiers.html" className="hover:text-wine dark:hover:text-gold transition-colors">Gói Hội Viên</a>
              <a href="my-books.html" className="hover:text-wine dark:hover:text-gold transition-colors">Tủ Sách</a>
              <a href="news.html" className="hover:text-wine dark:hover:text-gold transition-colors">Tin Tức</a>
              <button type="button" onClick={() => openChatbot('Xin chào, tôi cần tư vấn về các gói ưu đãi!')} className="text-wine dark:text-gold flex items-center gap-1 font-black cursor-pointer hover:opacity-80 transition-opacity">
                <i className="ph-bold ph-sparkle text-sm"></i> Trợ Lý AI
              </button>
            </nav>

            {/* Search Bar */}
            <div className="hidden md:flex flex-1 max-w-xs lg:max-w-sm relative">
              <form id="search-form" className="w-full relative flex items-center" onSubmit={handleOfferSearch}>
                <i className="ph ph-magnifying-glass absolute left-3.5 text-ink-muted text-sm"></i>
                <input type="text" id="header-search-input" placeholder="Tìm ưu đãi, gói cước, sách..." className="w-full pl-9 pr-8 py-2 rounded-full text-xs font-medium bg-paper-200/70 dark:bg-night-card border border-paper-border dark:border-night-border focus:outline-none focus:border-wine dark:focus:border-gold text-ink dark:text-night-text placeholder-ink-muted/80 transition-all shadow-inner" autoComplete="off" />
              </form>
            </div>

            {/* Utilities */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border shadow-sm text-xs font-metadata-spec font-bold text-ink dark:text-night-text" title="Số dư Khoai thưởng hiện có">
                <span className="w-2 h-2 rounded-full bg-gold animate-pulse"></span>
                <span>{khoaiBalance.toLocaleString('vi-VN')}</span>
                <span className="text-gold font-extrabold flex items-center gap-0.5">Khoai <i className="ph-fill ph-coins text-[11px]"></i></span>
              </div>
              <a href="cart.html" className="p-2.5 rounded-full text-ink dark:text-night-text hover:bg-paper-200 dark:hover:bg-night-card transition-colors relative" title="Giỏ hàng">
                <i className="ph ph-shopping-bag text-xl"></i>
                <span className="font-metadata-spec absolute top-1 right-1 w-4 h-4 bg-wine text-white text-[10px] font-bold rounded-full flex items-center justify-center">1</span>
              </a>
              <a href="login.html" className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold text-ink dark:text-night-text hover:bg-paper-200 dark:hover:bg-night-card border border-paper-border dark:border-night-border transition-colors">
                <i className="ph-bold ph-user text-xs"></i><span>Tài Khoản</span>
              </a>
              <button onClick={toggleTheme} className="p-2.5 rounded-full text-ink dark:text-night-text hover:bg-paper-200 dark:hover:bg-night-card transition-colors" title="Đổi chế độ sáng/tối">
                <i className={`ph-bold ${isDark ? 'ph-sun' : 'ph-moon'} text-xl`}></i>
              </button>
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="lg:hidden p-2.5 rounded-full text-ink dark:text-night-text hover:bg-paper-200 dark:hover:bg-night-card">
                <i className="ph-bold ph-list text-2xl"></i>
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          <div className={`${isMobileMenuOpen ? 'block' : 'hidden'} lg:hidden px-6 py-5 bg-paper-surface dark:bg-night-surface border-b border-paper-border dark:border-night-border space-y-3`}>
            <div className="flex items-center justify-between pb-3 border-b border-paper-border dark:border-night-border">
              <span className="text-xs font-metadata-spec text-ink-muted dark:text-night-muted">Số dư khoai:</span>
              <span className="text-xs font-metadata-spec font-bold text-gold flex items-center gap-1">{khoaiBalance.toLocaleString('vi-VN')} Khoai <i className="ph-fill ph-coins"></i></span>
            </div>
            <nav className="flex flex-col gap-2 font-bold text-xs uppercase tracking-wider">
              <a href="testhome/tc.html" className="py-1.5 text-ink dark:text-night-text hover:text-wine">Trang Chủ</a>
              <a href="offers.html" className="py-1.5 text-wine dark:text-gold">Ưu Đãi Đặc Quyền</a>
              <a href="tiers.html" className="py-1.5 text-ink dark:text-night-text hover:text-wine">Gói Hội Viên</a>
              <a href="my-books.html" className="py-1.5 text-ink dark:text-night-text hover:text-wine">Tủ Sách</a>
              <a href="news.html" className="py-1.5 text-ink dark:text-night-text hover:text-wine">Tin Tức</a>
              <a href="login.html" className="py-1.5 text-ink dark:text-night-text hover:text-wine">Đăng Nhập / Đăng Ký</a>
            </nav>
          </div>
        </header>

        {}
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-6">
              <div className="py-2.5 px-3 rounded-xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border shadow-sm flex flex-col items-center text-center">
                <span className="font-metadata-spec text-2xl font-black text-wine dark:text-gold mb-1">-50%</span><span className="font-metadata-spec text-xs font-semibold text-ink-muted dark:text-night-muted">Gói Cước VIP 1 Năm</span>
              </div>
              <div className="py-2.5 px-3 rounded-xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border shadow-sm flex flex-col items-center text-center">
                <span className="font-metadata-spec text-2xl font-black text-wine dark:text-gold mb-1">FREE</span><span className="font-metadata-spec text-xs font-semibold text-ink-muted dark:text-night-muted">3 Lần Upload Đầu Tiên</span>
              </div>
              <div className="py-2.5 px-3 rounded-xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border shadow-sm flex flex-col items-center text-center">
                <span className="font-metadata-spec text-2xl font-black text-wine dark:text-gold mb-1">-45%</span><span className="font-metadata-spec text-xs font-semibold text-ink-muted dark:text-night-muted">Combo Kinh Điển</span>
              </div>
              <div className="py-2.5 px-3 rounded-xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border shadow-sm flex flex-col items-center text-center">
                <span className="font-metadata-spec text-2xl font-black text-wine dark:text-gold mb-1">+10 Khoai</span><span className="font-metadata-spec text-xs font-semibold text-ink-muted dark:text-night-muted">Thưởng Nóng Đọc Sách</span>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <a href="#row-subscription" className="px-4 py-2 rounded-full text-xs font-metadata-spec font-bold bg-paper-surface dark:bg-night-card hover:bg-wine hover:text-white dark:hover:bg-gold dark:hover:text-night-bg border border-paper-border dark:border-night-border text-ink dark:text-night-text transition-colors shadow-sm"><i className="ph-bold ph-crown mr-1"></i> Gói Cước</a>
              <a href="#row-combo" className="px-4 py-2 rounded-full text-xs font-metadata-spec font-bold bg-paper-surface dark:bg-night-card hover:bg-wine hover:text-white dark:hover:bg-gold dark:hover:text-night-bg border border-paper-border dark:border-night-border text-ink dark:text-night-text transition-colors shadow-sm"><i className="ph-bold ph-stack mr-1"></i> Combo Sách Kinh Điển</a>
              <a href="#row-upload" className="px-4 py-2 rounded-full text-xs font-metadata-spec font-bold bg-paper-surface dark:bg-night-card hover:bg-wine hover:text-white dark:hover:bg-gold dark:hover:text-night-bg border border-paper-border dark:border-night-border text-ink dark:text-night-text transition-colors shadow-sm"><i className="ph-bold ph-cloud-arrow-up mr-1"></i> Tiện Ích Upload</a>
              <a href="#row-single-books" className="px-4 py-2 rounded-full text-xs font-metadata-spec font-bold bg-paper-surface dark:bg-night-card hover:bg-wine hover:text-white dark:hover:bg-gold dark:hover:text-night-bg border border-paper-border dark:border-night-border text-ink dark:text-night-text transition-colors shadow-sm"><i className="ph-bold ph-book-open mr-1"></i> Sách Lẻ Giảm Sâu</a>
              <a href="#row-reading-challenge" className="px-4 py-2 rounded-full text-xs font-metadata-spec font-bold bg-paper-surface dark:bg-night-card hover:bg-wine hover:text-white dark:hover:bg-gold dark:hover:text-night-bg border border-paper-border dark:border-night-border text-ink dark:text-night-text transition-colors shadow-sm"><i className="ph-bold ph-medal mr-1"></i> Thử Thách Đọc</a>
            </div>
          </div>
        </section>

        {}
        <main className="w-full max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8 space-y-10 sm:space-y-11 pb-12 sm:pb-14 flex-1">
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

            <div id="cards-row-1" className="cards-scroll-container">
              {/* Card 1.1 */}
              <div className="offer-card rounded-2xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between relative group">
                <div className="space-y-3.5">
                  <div className="relative h-28 w-full rounded-xl overflow-hidden bg-paper-200 dark:bg-night-surface shadow-inner">
                    <img src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=400&auto=format&fit=crop" alt="Gói Sinh Viên" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
                    <span className="absolute top-2.5 right-2.5 font-metadata-spec text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white shadow-sm">CAMPUS PASS</span>
                    <div className="absolute bottom-2.5 left-2.5 w-9 h-9 rounded-lg bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white text-xl shadow-md">
                      <i className="ph-bold ph-graduation-cap"></i>
                    </div>
                  </div>
                  <div>
                    <span className="font-metadata-spec text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-paper-200 dark:bg-night-border text-ink-muted dark:text-night-muted">Học Đường</span>
                    <h3 className="font-display font-black text-lg text-ink dark:text-night-text mt-1.5 leading-tight">Gói Sinh Viên</h3>
                  </div>
                  <ul className="space-y-1.5 pt-2 text-xs font-metadata-spec text-ink-muted dark:text-night-muted border-t border-paper-border/60 dark:border-night-border/60">
                    <li className="flex items-center gap-2"><i className="ph-bold ph-check-circle text-emerald-600 dark:text-emerald-400 text-sm shrink-0"></i><span className="truncate">Mở toàn bộ giáo trình & tài liệu</span></li>
                    <li className="flex items-center gap-2"><i className="ph-bold ph-check-circle text-emerald-600 dark:text-emerald-400 text-sm shrink-0"></i><span className="truncate">Tặng 5 lượt tóm tắt AI mỗi tháng</span></li>
                    <li className="flex items-center gap-2"><i className="ph-bold ph-check-circle text-emerald-600 dark:text-emerald-400 text-sm shrink-0"></i><span className="truncate">Giảm 10% khi thuê sách giấy</span></li>
                  </ul>
                </div>
                <div className="pt-3.5 border-t border-paper-border dark:border-night-border mt-3.5">
                  <div className="flex items-baseline justify-between mb-3.5">
                    <div className="flex items-baseline gap-1.5"><span className="font-metadata-spec text-2xl font-black text-ink dark:text-night-text">50</span><span className="potato-badge">Khoai <i className="ph-fill ph-coins text-[10px]"></i></span></div>
                    <span className="font-metadata-spec text-xs text-ink-muted dark:text-night-muted">/ tháng</span>
                  </div>
                  <button type="button" onClick={() => openRedeemModal('Gói Sinh Viên', 50, 'Xác thực thẻ HSSV thành công. Gói sinh viên đã được kích hoạt cho tài khoản!')} className="w-full py-2.5 rounded-full bg-paper-200 hover:bg-wine hover:text-white dark:bg-night-surface dark:hover:bg-gold dark:hover:text-night-bg font-metadata-spec text-xs font-bold text-ink dark:text-night-text text-center transition-colors shadow-sm">Xác Thực Ngay</button>
                </div>
              </div>

              {/* Card 1.2 */}
              <div className="offer-card rounded-2xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between relative group">
                <div className="space-y-3.5">
                  <div className="relative h-28 w-full rounded-xl overflow-hidden bg-paper-200 dark:bg-night-surface shadow-inner">
                    <img src="https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=400&auto=format&fit=crop" alt="Gói Premium 1 Tháng" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
                    <span className="absolute top-2.5 right-2.5 font-metadata-spec text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-wine text-white shadow-sm">-30%</span>
                    <div className="absolute bottom-2.5 left-2.5 w-9 h-9 rounded-lg bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white text-xl shadow-md">
                      <i className="ph-bold ph-sketch-logo"></i>
                    </div>
                  </div>
                  <div>
                    <span className="font-metadata-spec text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-paper-200 dark:bg-night-border text-wine dark:text-gold">Ưu Đãi Tháng</span>
                    <h3 className="font-display font-black text-lg text-ink dark:text-night-text mt-1.5 leading-tight">Gói Premium 1 Tháng</h3>
                  </div>
                  <ul className="space-y-1.5 pt-2 text-xs font-metadata-spec text-ink-muted dark:text-night-muted border-t border-paper-border/60 dark:border-night-border/60">
                    <li className="flex items-center gap-2"><i className="ph-bold ph-check-circle text-emerald-600 dark:text-emerald-400 text-sm shrink-0"></i><span className="truncate">Mở khóa 10.000+ tựa sách bản quyền</span></li>
                    <li className="flex items-center gap-2"><i className="ph-bold ph-check-circle text-emerald-600 dark:text-emerald-400 text-sm shrink-0"></i><span className="truncate">Nghe Audiobook AI giọng đọc tự nhiên</span></li>
                    <li className="flex items-center gap-2"><i className="ph-bold ph-check-circle text-emerald-600 dark:text-emerald-400 text-sm shrink-0"></i><span className="truncate">Tải sách đọc Offline trên mọi thiết bị</span></li>
                  </ul>
                </div>
                <div className="pt-3.5 border-t border-paper-border dark:border-night-border mt-3.5">
                  <div className="flex items-baseline justify-between mb-3.5">
                    <div className="flex items-baseline gap-2"><span className="font-metadata-spec text-xs line-through text-ink-muted dark:text-night-muted">150</span><span className="font-metadata-spec text-2xl font-black text-wine dark:text-gold">105</span><span className="potato-badge">Khoai <i className="ph-fill ph-coins text-[10px]"></i></span></div>
                    <span className="font-metadata-spec text-xs text-ink-muted dark:text-night-muted">/ tháng</span>
                  </div>
                  <button type="button" onClick={() => openRedeemModal('Gói Premium 1 Tháng', 105, 'Kích hoạt Gói Premium 1 Tháng thành công!')} className="w-full py-2.5 rounded-full bg-wine hover:bg-wine-dark text-white font-metadata-spec text-xs font-bold text-center transition-colors shadow-sm">Đổi Khoai Ngay</button>
                </div>
              </div>

              {/* Card 1.3 */}
              <div className="offer-card rounded-2xl bg-paper-surface dark:bg-night-card border-2 border-gold/60 dark:border-gold/60 p-5 shadow-md hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between relative group">
                <div className="space-y-3.5">
                  <div className="relative h-28 w-full rounded-xl overflow-hidden bg-paper-200 dark:bg-night-surface shadow-inner">
                    <img src="https://images.unsplash.com/photo-1457369804613-52c61a468e7d?q=80&w=400&auto=format&fit=crop" alt="Gói Premium 3 Tháng" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
                    <span className="absolute top-2.5 right-2.5 font-metadata-spec text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-gold text-night-bg shadow-sm">-40% POPULAR</span>
                    <div className="absolute bottom-2.5 left-2.5 w-9 h-9 rounded-lg bg-gold/30 backdrop-blur-md border border-gold/50 flex items-center justify-center text-gold text-xl shadow-md">
                      <i className="ph-bold ph-diamond"></i>
                    </div>
                  </div>
                  <div>
                    <span className="font-metadata-spec text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-gold/20 text-gold">Tiết Kiệm Nhất</span>
                    <h3 className="font-display font-black text-lg text-ink dark:text-night-text mt-1.5 leading-tight">Gói Premium 3 Tháng</h3>
                  </div>
                  <ul className="space-y-1.5 pt-2 text-xs font-metadata-spec text-ink-muted dark:text-night-muted border-t border-paper-border/60 dark:border-night-border/60">
                    <li className="flex items-center gap-2"><i className="ph-bold ph-check-circle text-emerald-600 dark:text-emerald-400 text-sm shrink-0"></i><span className="truncate">Bao gồm toàn bộ quyền lợi Premium</span></li>
                    <li className="flex items-center gap-2"><i className="ph-bold ph-check-circle text-emerald-600 dark:text-emerald-400 text-sm shrink-0"></i><span className="truncate">Tặng 30 Khoai thưởng vào ví</span></li>
                    <li className="flex items-center gap-2"><i className="ph-bold ph-check-circle text-emerald-600 dark:text-emerald-400 text-sm shrink-0"></i><span className="truncate">Tiết kiệm 40% so với gia hạn tháng</span></li>
                  </ul>
                </div>
                <div className="pt-3.5 border-t border-paper-border dark:border-night-border mt-3.5">
                  <div className="flex items-baseline justify-between mb-3.5">
                    <div className="flex items-baseline gap-2"><span className="font-metadata-spec text-xs line-through text-ink-muted dark:text-night-muted">400</span><span className="font-metadata-spec text-2xl font-black text-wine dark:text-gold">240</span><span className="potato-badge">Khoai <i className="ph-fill ph-coins text-[10px]"></i></span></div>
                    <span className="font-metadata-spec text-xs text-ink-muted dark:text-night-muted">/ 3 tháng</span>
                  </div>
                  <button type="button" onClick={() => openRedeemModal('Gói Premium 3 Tháng', 240, 'Kích hoạt Gói Premium 3 Tháng thành công!')} className="w-full py-2.5 rounded-full bg-wine hover:bg-wine-dark text-white font-metadata-spec text-xs font-bold text-center transition-colors shadow-sm">Đổi Khoai Ngay</button>
                </div>
              </div>

              {/* Card 1.4 */}
              <div className="offer-card rounded-2xl bg-paper-surface dark:bg-night-card border-2 border-wine/50 dark:border-gold/50 p-5 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between relative group">
                <div className="space-y-3.5">
                  <div className="relative h-28 w-full rounded-xl overflow-hidden bg-paper-200 dark:bg-night-surface shadow-inner">
                    <img src="https://images.unsplash.com/photo-1521587760476-6c12a4b040da?q=80&w=400&auto=format&fit=crop" alt="Gói VIP 1 Năm" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
                    <span className="absolute top-2.5 right-2.5 font-metadata-spec text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-wine text-white shadow-sm">-50% VIP</span>
                    <div className="absolute bottom-2.5 left-2.5 w-9 h-9 rounded-lg bg-wine/30 backdrop-blur-md border border-wine/50 flex items-center justify-center text-gold text-xl shadow-md">
                      <i className="ph-bold ph-crown-simple"></i>
                    </div>
                  </div>
                  <div>
                    <span className="font-metadata-spec text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-paper-200 dark:bg-night-border text-wine dark:text-gold">Đặc Quyền Vàng</span>
                    <h3 className="font-display font-black text-lg text-ink dark:text-night-text mt-1.5 leading-tight">Gói VIP 1 Năm</h3>
                  </div>
                  <ul className="space-y-1.5 pt-2 text-xs font-metadata-spec text-ink-muted dark:text-night-muted border-t border-paper-border/60 dark:border-night-border/60">
                    <li className="flex items-center gap-2"><i className="ph-bold ph-check-circle text-emerald-600 dark:text-emerald-400 text-sm shrink-0"></i><span className="truncate">Đọc & nghe sách không giới hạn 365 ngày</span></li>
                    <li className="flex items-center gap-2"><i className="ph-bold ph-check-circle text-emerald-600 dark:text-emerald-400 text-sm shrink-0"></i><span className="truncate">Huy hiệu VIP Hoàng Gia trên trang cá nhân</span></li>
                    <li className="flex items-center gap-2"><i className="ph-bold ph-check-circle text-emerald-600 dark:text-emerald-400 text-sm shrink-0"></i><span className="truncate">Đọc trước tác phẩm mới trước 14 ngày</span></li>
                  </ul>
                </div>
                <div className="pt-3.5 border-t border-paper-border dark:border-night-border mt-3.5">
                  <div className="flex items-baseline justify-between mb-3.5">
                    <div className="flex items-baseline gap-2"><span className="font-metadata-spec text-xs line-through text-ink-muted dark:text-night-muted">1500</span><span className="font-metadata-spec text-2xl font-black text-wine dark:text-gold">750</span><span className="potato-badge">Khoai <i className="ph-fill ph-coins text-[10px]"></i></span></div>
                    <span className="font-metadata-spec text-xs text-ink-muted dark:text-night-muted">/ 12 tháng</span>
                  </div>
                  <button type="button" onClick={() => openRedeemModal('Gói VIP 1 Năm', 750, 'Kích hoạt Gói VIP 1 Năm & Huy hiệu VIP Hoàng Gia thành công!')} className="w-full py-2.5 rounded-full bg-wine hover:bg-wine-dark text-white font-metadata-spec text-xs font-bold text-center transition-colors shadow-sm">Đổi Khoai Ngay</button>
                </div>
              </div>
            </div>
          </section>

          {}
          <section id="row-upload" className="scroll-mt-28">
            <div className="flex items-center justify-between pb-3 border-b border-paper-border dark:border-night-border mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gold/15 text-gold flex items-center justify-center text-xl shrink-0"><i className="ph-bold ph-cloud-arrow-up"></i></div>
                <div>
                  <h2 className="font-display font-black text-xl sm:text-2xl text-ink dark:text-night-text tracking-tight">Tiện Ích Upload Dữ Liệu</h2>
                  <p className="font-editorial-body text-xs sm:text-sm text-ink-muted dark:text-night-muted">Đưa tài liệu, PDF cá nhân lên không gian đọc số và ứng dụng tóm tắt AI chuyên sâu.</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => scrollRow('cards-row-2', -340)} className="w-9 h-9 rounded-full bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border text-ink dark:text-night-text hover:bg-wine hover:text-white dark:hover:bg-gold dark:hover:text-night-bg flex items-center justify-center transition-colors shadow-sm"><i className="ph-bold ph-caret-left text-sm"></i></button>
                <button type="button" onClick={() => scrollRow('cards-row-2', 340)} className="w-9 h-9 rounded-full bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border text-ink dark:text-night-text hover:bg-wine hover:text-white dark:hover:bg-gold dark:hover:text-night-bg flex items-center justify-center transition-colors shadow-sm"><i className="ph-bold ph-caret-right text-sm"></i></button>
              </div>
            </div>

            <div id="cards-row-2" className="cards-scroll-container">
              {/* Card 2.1 */}
              <div className="offer-card rounded-2xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between relative group">
                <div className="space-y-3.5">
                  <div className="relative h-28 w-full rounded-xl overflow-hidden bg-paper-200 dark:bg-night-surface shadow-inner">
                    <img src="https://images.unsplash.com/photo-1586281380349-632531db7ed4?q=80&w=400&auto=format&fit=crop" alt="Free 3 Lần Upload" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
                    <span className="absolute top-2.5 right-2.5 font-metadata-spec text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white shadow-sm">NEW USER</span>
                    <div className="absolute bottom-2.5 left-2.5 w-9 h-9 rounded-lg bg-emerald-600/30 backdrop-blur-md border border-emerald-400/50 flex items-center justify-center text-emerald-300 text-xl shadow-md"><i className="ph-bold ph-file-pdf"></i></div>
                  </div>
                  <div>
                    <span className="font-metadata-spec text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-paper-200 dark:bg-night-border text-ink-muted dark:text-night-muted">Người Mới</span>
                    <h3 className="font-display font-black text-lg text-ink dark:text-night-text mt-1.5 leading-tight">Free 3 Lần Upload Đầu</h3>
                  </div>
                  <ul className="space-y-1.5 pt-2 text-xs font-metadata-spec text-ink-muted dark:text-night-muted border-t border-paper-border/60 dark:border-night-border/60">
                    <li className="flex items-center gap-2"><i className="ph-bold ph-check-circle text-emerald-600 dark:text-emerald-400 text-sm shrink-0"></i><span className="truncate">Tải lên 3 file PDF/EPUB tài liệu cá nhân</span></li>
                    <li className="flex items-center gap-2"><i className="ph-bold ph-check-circle text-emerald-600 dark:text-emerald-400 text-sm shrink-0"></i><span className="truncate">Tóm tắt & trích xuất ý chính bằng AI</span></li>
                    <li className="flex items-center gap-2"><i className="ph-bold ph-check-circle text-emerald-600 dark:text-emerald-400 text-sm shrink-0"></i><span className="truncate">Hỗ trợ dung lượng file tối đa 25MB</span></li>
                  </ul>
                </div>
                <div className="pt-3.5 border-t border-paper-border dark:border-night-border mt-3.5">
                  <div className="flex items-baseline justify-between mb-3.5">
                    <div className="flex items-baseline gap-2"><span className="font-metadata-spec text-xs line-through text-ink-muted dark:text-night-muted">15</span><span className="font-metadata-spec text-2xl font-black text-emerald-600 dark:text-emerald-400">0</span><span className="potato-badge">Khoai <i className="ph-fill ph-coins text-[10px]"></i></span></div>
                    <span className="font-metadata-spec text-xs font-bold text-emerald-600 dark:text-emerald-400">Miễn Phí</span>
                  </div>
                  <button type="button" onClick={() => openRedeemModal('Free 3 Lần Upload Đầu', 0, 'Đã kích hoạt 3 lượt upload tài liệu miễn phí!')} className="w-full py-2.5 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-metadata-spec text-xs font-bold text-center transition-colors shadow-sm">Sử Dụng Ngay</button>
                </div>
              </div>

              {/* Card 2.2 */}
              <div className="offer-card rounded-2xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between relative group">
                <div className="space-y-3.5">
                  <div className="relative h-28 w-full rounded-xl overflow-hidden bg-paper-200 dark:bg-night-surface shadow-inner">
                    <img src="https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=400&auto=format&fit=crop" alt="Upload 2 lần/ngày" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
                    <span className="absolute top-2.5 right-2.5 font-metadata-spec text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-wine text-white shadow-sm">HOT DEAL</span>
                    <div className="absolute bottom-2.5 left-2.5 w-9 h-9 rounded-lg bg-wine/30 backdrop-blur-md border border-wine/50 flex items-center justify-center text-white text-xl shadow-md"><i className="ph-bold ph-lightning"></i></div>
                  </div>
                  <div>
                    <span className="font-metadata-spec text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-paper-200 dark:bg-night-border text-ink-muted dark:text-night-muted">Gói Ngày</span>
                    <h3 className="font-display font-black text-lg text-ink dark:text-night-text mt-1.5 leading-tight">Upload 2 Lần / Ngày</h3>
                  </div>
                  <ul className="space-y-1.5 pt-2 text-xs font-metadata-spec text-ink-muted dark:text-night-muted border-t border-paper-border/60 dark:border-night-border/60">
                    <li className="flex items-center gap-2"><i className="ph-bold ph-check-circle text-emerald-600 dark:text-emerald-400 text-sm shrink-0"></i><span className="truncate">Linh hoạt theo nhu cầu tra cứu bài vở</span></li>
                    <li className="flex items-center gap-2"><i className="ph-bold ph-check-circle text-emerald-600 dark:text-emerald-400 text-sm shrink-0"></i><span className="truncate">Trích xuất bảng biểu & đồ thị thông minh</span></li>
                    <li className="flex items-center gap-2"><i className="ph-bold ph-check-circle text-emerald-600 dark:text-emerald-400 text-sm shrink-0"></i><span className="truncate">Lưu trữ tài liệu cá nhân trong 30 ngày</span></li>
                  </ul>
                </div>
                <div className="pt-3.5 border-t border-paper-border dark:border-night-border mt-3.5">
                  <div className="flex items-baseline justify-between mb-3.5">
                    <div className="flex items-baseline gap-1.5"><span className="font-metadata-spec text-2xl font-black text-ink dark:text-night-text">10</span><span className="potato-badge">Khoai <i className="ph-fill ph-coins text-[10px]"></i></span></div>
                    <span className="font-metadata-spec text-xs text-ink-muted dark:text-night-muted">/ lần</span>
                  </div>
                  <button type="button" onClick={() => openRedeemModal('Upload 2 lần/ngày', 10, 'Đã đăng ký quyền lợi upload ưu đãi theo ngày!')} className="w-full py-2.5 rounded-full bg-paper-200 hover:bg-wine hover:text-white dark:bg-night-surface dark:hover:bg-gold dark:hover:text-night-bg font-metadata-spec text-xs font-bold text-ink dark:text-night-text text-center transition-colors shadow-sm">Đăng Ký Theo Ngày</button>
                </div>
              </div>

              {/* Card 2.3 */}
              <div className="offer-card rounded-2xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between relative group">
                <div className="space-y-3.5">
                  <div className="relative h-28 w-full rounded-xl overflow-hidden bg-paper-200 dark:bg-night-surface shadow-inner">
                    <img src="https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=400&auto=format&fit=crop" alt="Gói Upload Không Giới Hạn" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
                    <span className="absolute top-2.5 right-2.5 font-metadata-spec text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-gold text-night-bg shadow-sm">UNLIMITED</span>
                    <div className="absolute bottom-2.5 left-2.5 w-9 h-9 rounded-lg bg-gold/30 backdrop-blur-md border border-gold/50 flex items-center justify-center text-gold text-xl shadow-md"><i className="ph-bold ph-cloud-arrow-up"></i></div>
                  </div>
                  <div>
                    <span className="font-metadata-spec text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-gold/20 text-gold">Lưu Trữ Không Giới Hạn</span>
                    <h3 className="font-display font-black text-lg text-ink dark:text-night-text mt-1.5 leading-tight">Gói Upload Không Giới Hạn</h3>
                  </div>
                  <ul className="space-y-1.5 pt-2 text-xs font-metadata-spec text-ink-muted dark:text-night-muted border-t border-paper-border/60 dark:border-night-border/60">
                    <li className="flex items-center gap-2"><i className="ph-bold ph-check-circle text-emerald-600 dark:text-emerald-400 text-sm shrink-0"></i><span className="truncate">Upload không giới hạn số lượng tài liệu</span></li>
                    <li className="flex items-center gap-2"><i className="ph-bold ph-check-circle text-emerald-600 dark:text-emerald-400 text-sm shrink-0"></i><span className="truncate">Dung lượng tới 100MB cho mỗi file</span></li>
                    <li className="flex items-center gap-2"><i className="ph-bold ph-check-circle text-emerald-600 dark:text-emerald-400 text-sm shrink-0"></i><span className="truncate">Hỏi đáp AI theo ngữ cảnh tài liệu</span></li>
                  </ul>
                </div>
                <div className="pt-3.5 border-t border-paper-border dark:border-night-border mt-3.5">
                  <div className="flex items-baseline justify-between mb-3.5">
                    <div className="flex items-baseline gap-1.5"><span className="font-metadata-spec text-2xl font-black text-wine dark:text-gold">30</span><span className="potato-badge">Khoai <i className="ph-fill ph-coins text-[10px]"></i></span></div>
                    <span className="font-metadata-spec text-xs text-ink-muted dark:text-night-muted">/ tháng</span>
                  </div>
                  <button type="button" onClick={() => openRedeemModal('Gói Upload Không Giới Hạn', 30, 'Kích hoạt Gói Upload Không Giới Hạn thành công!')} className="w-full py-2.5 rounded-full bg-wine hover:bg-wine-dark text-white font-metadata-spec text-xs font-bold text-center transition-colors shadow-sm">Nâng Cấp Gói</button>
                </div>
              </div>

              {/* Card 2.4 */}
              <div className="offer-card rounded-2xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between relative group">
                <div className="space-y-3.5">
                  <div className="relative h-28 w-full rounded-xl overflow-hidden bg-paper-200 dark:bg-night-surface shadow-inner">
                    <img src="https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=400&auto=format&fit=crop" alt="Gói AI Scholar Chuyên Sâu" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
                    <span className="absolute top-2.5 right-2.5 font-metadata-spec text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-600 text-white shadow-sm">-35% PRO</span>
                    <div className="absolute bottom-2.5 left-2.5 w-9 h-9 rounded-lg bg-purple-600/30 backdrop-blur-md border border-purple-400/50 flex items-center justify-center text-purple-300 text-xl shadow-md"><i className="ph-bold ph-brain"></i></div>
                  </div>
                  <div>
                    <span className="font-metadata-spec text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-paper-200 dark:bg-night-border text-wine dark:text-gold">Nghiên Cứu & Đồ Án</span>
                    <h3 className="font-display font-black text-lg text-ink dark:text-night-text mt-1.5 leading-tight">Gói AI Scholar Chuyên Sâu</h3>
                  </div>
                  <ul className="space-y-1.5 pt-2 text-xs font-metadata-spec text-ink-muted dark:text-night-muted border-t border-paper-border/60 dark:border-night-border/60">
                    <li className="flex items-center gap-2"><i className="ph-bold ph-check-circle text-emerald-600 dark:text-emerald-400 text-sm shrink-0"></i><span className="truncate">Phân tích luận văn chuẩn học thuật APA</span></li>
                    <li className="flex items-center gap-2"><i className="ph-bold ph-check-circle text-emerald-600 dark:text-emerald-400 text-sm shrink-0"></i><span className="truncate">Dịch thuật học thuật song ngữ Anh - Việt</span></li>
                    <li className="flex items-center gap-2"><i className="ph-bold ph-check-circle text-emerald-600 dark:text-emerald-400 text-sm shrink-0"></i><span className="truncate">Xuất ghi chú & sơ đồ tư duy PDF</span></li>
                  </ul>
                </div>
                <div className="pt-3.5 border-t border-paper-border dark:border-night-border mt-3.5">
                  <div className="flex items-baseline justify-between mb-3.5">
                    <div className="flex items-baseline gap-2"><span className="font-metadata-spec text-xs line-through text-ink-muted dark:text-night-muted">85</span><span className="font-metadata-spec text-2xl font-black text-wine dark:text-gold">55</span><span className="potato-badge">Khoai <i className="ph-fill ph-coins text-[10px]"></i></span></div>
                    <span className="font-metadata-spec text-xs text-ink-muted dark:text-night-muted">/ gói</span>
                  </div>
                  <button type="button" onClick={() => openRedeemModal('Gói AI Scholar Chuyên Sâu', 55, 'Kích hoạt Gói AI Scholar Chuyên Sâu thành công!')} className="w-full py-2.5 rounded-full bg-wine hover:bg-wine-dark text-white font-metadata-spec text-xs font-bold text-center transition-colors shadow-sm">Đổi Gói Scholar</button>
                </div>
              </div>
            </div>
          </section>

          {}
          <section id="row-combo" className="scroll-mt-28">
            <div className="flex items-center justify-between pb-3 border-b border-paper-border dark:border-night-border mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-wine/10 dark:bg-gold/15 text-wine dark:text-gold flex items-center justify-center text-xl shrink-0"><i className="ph-bold ph-stack"></i></div>
                <div><h2 className="font-display font-black text-xl sm:text-2xl text-ink dark:text-night-text tracking-tight">Bộ Sưu Tập Combo Sách Kinh Điển</h2></div>
              </div>
              <div className="text-xs font-metadata-spec text-ink-muted dark:text-night-muted hidden sm:block">Giá được thanh toán bằng Khoai trong ví của bạn.</div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Combo Card 1 */}
              <div className="rounded-2xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border p-4 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between relative group">
                <span className="absolute top-3 left-3 z-20 font-metadata-spec text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-600 text-white shadow-sm">-40% GIẢM</span>
                <div>
                  <div className="w-full bg-[#fbf8f2] dark:bg-night-surface/70 rounded-xl p-3 pt-6 pb-2.5 mb-3 flex items-end justify-center gap-3 sm:gap-3.5 min-h-[145px] border border-paper-border/60 dark:border-night-border/60 relative">
                    <div className="combo-book-item flex flex-col items-center group/book cursor-pointer"
                         onMouseEnter={(e) => handleBookEnter(e, {title: 'Điện Biên Phủ — Lịch Sử & Ký Ức', author: 'Đại tướng Võ Nguyên Giáp', category: 'Lịch Sử Quân Sự', rating: '★ 5.0', pages: '368 trang', price: '130 Khoai', summary: 'Tái hiện toàn cảnh chiến dịch Điện Biên Phủ lừng lẫy năm châu, chấn động địa cầu...', cover: 'testhome/img/dbp.jfif'})}
                         onMouseLeave={handleBookLeave}
                         onMouseMove={(e) => handleBookEnter(e, {title: 'Điện Biên Phủ — Lịch Sử & Ký Ức', author: 'Đại tướng Võ Nguyên Giáp', category: 'Lịch Sử Quân Sự', rating: '★ 5.0', pages: '368 trang', price: '130 Khoai', summary: 'Tái hiện toàn cảnh chiến dịch Điện Biên Phủ lừng lẫy năm châu, chấn động địa cầu...', cover: 'testhome/img/dbp.jfif'})}>
                      <div className="book-cover-wrapper w-16 sm:w-20 aspect-[2/3] rounded shadow-md overflow-hidden bg-paper-200 border border-black/10 group-hover/book:shadow-xl transition-shadow">
                        <img src="testhome/img/dbp.jfif" alt="Điện Biên Phủ" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=400&q=80'; }} />
                      </div>
                      <span className="text-[10px] font-bold text-ink dark:text-night-text mt-1.5 truncate max-w-[70px] sm:max-w-[80px] text-center">Điện Biên Phủ</span>
                    </div>

                    <div className="combo-book-item flex flex-col items-center group/book -translate-y-1 cursor-pointer"
                         onMouseEnter={(e) => handleBookEnter(e, {title: 'Nhân Chứng Lịch Sử: Thành Cổ Quảng Trị', author: 'Nhiều Tác Giả', category: 'Lịch Sử & Ký Ức', rating: '★ 4.9', pages: '280 trang', price: '135 Khoai', summary: 'Khúc tráng ca bất tử về 81 ngày đêm máu lửa bảo vệ Thành Cổ...', cover: 'testhome/img/thanhco.jfif'})}
                         onMouseLeave={handleBookLeave}>
                      <div className="book-cover-wrapper w-20 sm:w-24 aspect-[2/3] rounded shadow-lg overflow-hidden bg-paper-200 border border-black/10 group-hover/book:shadow-2xl transition-shadow">
                        <img src="testhome/img/thanhco.jfif" alt="Thành Cổ Quảng Trị" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=400&q=80'; }} />
                      </div>
                      <span className="text-[10px] font-bold text-ink dark:text-night-text mt-1.5 truncate max-w-[70px] sm:max-w-[85px] text-center">Thành Cổ</span>
                    </div>

                    <div className="combo-book-item flex flex-col items-center group/book cursor-pointer"
                         onMouseEnter={(e) => handleBookEnter(e, {title: 'Khúc Ca Tiến Công', author: 'Nguyễn Đình Thi', category: 'Văn Học Cách Mạng', rating: '★ 4.8', pages: '310 trang', price: '120 Khoai', summary: 'Tuyển tập những bài thơ, trường ca và khúc tráng ca hào hùng rực lửa...', cover: 'testhome/img/tiencong.jfif'})}
                         onMouseLeave={handleBookLeave}>
                      <div className="book-cover-wrapper w-16 sm:w-20 aspect-[2/3] rounded shadow-md overflow-hidden bg-paper-200 border border-black/10 group-hover/book:shadow-xl transition-shadow">
                        <img src="testhome/img/tiencong.jfif" alt="Khúc Ca Tiến Công" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=400&q=80'; }} />
                      </div>
                      <span className="text-[10px] font-bold text-ink dark:text-night-text mt-1.5 truncate max-w-[70px] sm:max-w-[80px] text-center">Tiến Công</span>
                    </div>
                  </div>
                  <span className="font-metadata-spec text-[10px] font-bold uppercase tracking-wider text-wine dark:text-gold">Tuyển Tập Lịch Sử</span>
                  <h3 className="font-display font-black text-base text-ink dark:text-night-text mt-1 leading-snug">Combo Ký Ức & Hào Khí Dân Tộc</h3>
                  <p className="font-editorial-body text-xs text-ink-muted dark:text-night-muted mt-1 leading-snug line-clamp-2">Gồm: Điện Biên Phủ, Thành Cổ Quảng Trị và Khúc Ca Tiến Công.</p>
                </div>
                <div className="pt-3 border-t border-paper-border dark:border-night-border mt-3 flex items-center justify-between gap-2">
                  <div>
                    <div className="font-metadata-spec text-[11px] line-through text-ink-muted dark:text-night-muted">385 Khoai (~385k)</div>
                    <div className="flex items-baseline gap-1">
                      <span className="font-metadata-spec text-xl font-black text-ink dark:text-night-text">229</span>
                      <span className="potato-badge text-[10px] py-0.5 px-2">Khoai <i className="ph-fill ph-coins text-[9px]"></i></span>
                    </div>
                  </div>
                  <button type="button" onClick={() => openRedeemModal('Combo Ký Ức & Hào Khí Dân Tộc', 229, 'Đổi Combo Ký Ức & Hào Khí Dân Tộc thành công! Trọn bộ 3 sách đã được đưa vào Tủ Sách của bạn.')} className="px-4 py-2 rounded-full bg-wine hover:bg-wine-dark text-white font-metadata-spec text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 shrink-0"><i className="ph-bold ph-book-bookmark"></i> Đổi Bằng Khoai</button>
                </div>
              </div>

              {/* Combo Card 2 */}
              <div className="rounded-2xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border p-4 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between relative group">
                <span className="absolute top-3 left-3 z-20 font-metadata-spec text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-600 text-white shadow-sm">-35% GIẢM</span>
                <div>
                  <div className="w-full bg-[#fbf8f2] dark:bg-night-surface/70 rounded-xl p-3 pt-6 pb-2.5 mb-3 flex items-end justify-center gap-3 sm:gap-3.5 min-h-[145px] border border-paper-border/60 dark:border-night-border/60 relative">
                    <div className="combo-book-item flex flex-col items-center group/book cursor-pointer"
                         onMouseEnter={(e) => handleBookEnter(e, {title: 'Ngày Xưa Có Một Chuyện Tình', author: 'Nguyễn Nhật Ánh', category: 'Văn Học Tuổi Trẻ', rating: '★ 4.9', pages: '340 trang', price: '105 Khoai', summary: 'Bản tình ca thanh xuân day dứt về tình bạn, tình yêu và sự bao dung...', cover: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80'})}
                         onMouseLeave={handleBookLeave}>
                      <div className="book-cover-wrapper w-16 sm:w-20 aspect-[2/3] rounded shadow-md overflow-hidden bg-paper-200 border border-black/10 group-hover/book:shadow-xl transition-shadow">
                        <img src="https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80" alt="Ngày Xưa Có Một Chuyện Tình" className="w-full h-full object-cover" />
                      </div>
                      <span className="text-[10px] font-bold text-ink dark:text-night-text mt-1.5 truncate max-w-[70px] sm:max-w-[80px] text-center">Chuyện Tình</span>
                    </div>

                    <div className="combo-book-item flex flex-col items-center group/book -translate-y-1 cursor-pointer"
                         onMouseEnter={(e) => handleBookEnter(e, {title: 'Hoàng Tử Bé', author: 'Antoine de Saint-Exupéry', category: 'Văn Học Kinh Điển', rating: '★ 5.0', pages: '120 trang', price: '95 Khoai', summary: 'Kiệt tác văn chương của nhân loại về tình yêu, sự thuần khiết của tâm hồn...', cover: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=400&q=80'})}
                         onMouseLeave={handleBookLeave}>
                      <div className="book-cover-wrapper w-20 sm:w-24 aspect-[2/3] rounded shadow-lg overflow-hidden bg-paper-200 border border-black/10 group-hover/book:shadow-2xl transition-shadow">
                        <img src="https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=400&q=80" alt="Hoàng Tử Bé" className="w-full h-full object-cover" />
                      </div>
                      <span className="text-[10px] font-bold text-ink dark:text-night-text mt-1.5 truncate max-w-[70px] sm:max-w-[85px] text-center">Hoàng Tử Bé</span>
                    </div>

                    <div className="combo-book-item flex flex-col items-center group/book cursor-pointer"
                         onMouseEnter={(e) => handleBookEnter(e, {title: 'Dế Mèn Phiêu Lưu Ký', author: 'Tô Hoài', category: 'Văn Học Thiếu Nhi', rating: '★ 4.9', pages: '195 trang', price: '110 Khoai', summary: 'Hành trình chu du thế giới muôn loài của chú Dế Mèn dũng cảm...', cover: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=400&q=80'})}
                         onMouseLeave={handleBookLeave}>
                      <div className="book-cover-wrapper w-16 sm:w-20 aspect-[2/3] rounded shadow-md overflow-hidden bg-paper-200 border border-black/10 group-hover/book:shadow-xl transition-shadow">
                        <img src="https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=400&q=80" alt="Dế Mèn Phiêu Lưu Ký" className="w-full h-full object-cover" />
                      </div>
                      <span className="text-[10px] font-bold text-ink dark:text-night-text mt-1.5 truncate max-w-[70px] sm:max-w-[80px] text-center">Dế Mèn</span>
                    </div>
                  </div>
                  <span className="font-metadata-spec text-[10px] font-bold uppercase tracking-wider text-wine dark:text-gold">Văn Học & Tuổi Thơ</span>
                  <h3 className="font-display font-black text-base text-ink dark:text-night-text mt-1 leading-snug">Combo Suối Nguồn Cảm Xúc</h3>
                  <p className="font-editorial-body text-xs text-ink-muted dark:text-night-muted mt-1 leading-snug line-clamp-2">Gồm: Ngày Xưa Có Một Chuyện Tình, Hoàng Tử Bé và Dế Mèn Phiêu Lưu Ký.</p>
                </div>
                <div className="pt-3 border-t border-paper-border dark:border-night-border mt-3 flex items-center justify-between gap-2">
                  <div>
                    <div className="font-metadata-spec text-[11px] line-through text-ink-muted dark:text-night-muted">310 Khoai (~310k)</div>
                    <div className="flex items-baseline gap-1">
                      <span className="font-metadata-spec text-xl font-black text-ink dark:text-night-text">199</span>
                      <span className="potato-badge text-[10px] py-0.5 px-2">Khoai <i className="ph-fill ph-coins text-[9px]"></i></span>
                    </div>
                  </div>
                  <button type="button" onClick={() => openRedeemModal('Combo Suối Nguồn Cảm Xúc', 199, 'Đổi Combo Suối Nguồn Cảm Xúc thành công!')} className="px-4 py-2 rounded-full bg-wine hover:bg-wine-dark text-white font-metadata-spec text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 shrink-0"><i className="ph-bold ph-book-bookmark"></i> Đổi Bằng Khoai</button>
                </div>
              </div>

              {/* Combo Card 3 */}
              <div className="rounded-2xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border p-4 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between relative group">
                <span className="absolute top-3 left-3 z-20 font-metadata-spec text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-600 text-white shadow-sm">-45% GIẢM</span>
                <div>
                  <div className="w-full bg-[#fbf8f2] dark:bg-night-surface/70 rounded-xl p-3 pt-6 pb-2.5 mb-3 flex items-end justify-center gap-3 sm:gap-3.5 min-h-[145px] border border-paper-border/60 dark:border-night-border/60 relative">
                    <div className="combo-book-item flex flex-col items-center group/book cursor-pointer"
                         onMouseEnter={(e) => handleBookEnter(e, {title: 'Sapiens', author: 'Yuval Noah Harari', category: 'Lịch Sử & Tri Thức', rating: '★ 5.0', pages: '512 trang', price: '160 Khoai', summary: 'Hành trình tiến hóa phi thường từ vượn cổ đến bá chủ thế giới...', cover: 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&w=400&q=80'})}
                         onMouseLeave={handleBookLeave}>
                      <div className="book-cover-wrapper w-16 sm:w-20 aspect-[2/3] rounded shadow-md overflow-hidden bg-paper-200 border border-black/10 group-hover/book:shadow-xl transition-shadow">
                        <img src="https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&w=400&q=80" alt="Sapiens" className="w-full h-full object-cover" />
                      </div>
                      <span className="text-[10px] font-bold text-ink dark:text-night-text mt-1.5 truncate max-w-[70px] sm:max-w-[80px] text-center">Sapiens</span>
                    </div>

                    <div className="combo-book-item flex flex-col items-center group/book -translate-y-1 cursor-pointer"
                         onMouseEnter={(e) => handleBookEnter(e, {title: 'Từ Tốt Đến Vĩ Đại', author: 'Jim Collins', category: 'Kinh Doanh & Lãnh Đạo', rating: '★ 4.9', pages: '400 trang', price: '150 Khoai', summary: 'Công trình nghiên cứu mẫu mực về cách thức các công ty bình thường bứt phá...', cover: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=400&auto=format&fit=crop'})}
                         onMouseLeave={handleBookLeave}>
                      <div className="book-cover-wrapper w-20 sm:w-24 aspect-[2/3] rounded shadow-lg overflow-hidden bg-paper-200 border border-black/10 group-hover/book:shadow-2xl transition-shadow">
                        <img src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=400&auto=format&fit=crop" alt="Từ Tốt Đến Vĩ Đại" className="w-full h-full object-cover" />
                      </div>
                      <span className="text-[10px] font-bold text-ink dark:text-night-text mt-1.5 truncate max-w-[70px] sm:max-w-[85px] text-center">Tốt Đến Vĩ Đại</span>
                    </div>

                    <div className="combo-book-item flex flex-col items-center group/book cursor-pointer"
                         onMouseEnter={(e) => handleBookEnter(e, {title: 'Đắc Nhân Tâm', author: 'Dale Carnegie', category: 'Kỹ Năng Sống', rating: '★ 5.0', pages: '320 trang', price: '140 Khoai', summary: 'Nghệ thuật giao tiếp, thấu cảm và thu phục lòng người bất biến...', cover: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=400&q=80'})}
                         onMouseLeave={handleBookLeave}>
                      <div className="book-cover-wrapper w-16 sm:w-20 aspect-[2/3] rounded shadow-md overflow-hidden bg-paper-200 border border-black/10 group-hover/book:shadow-xl transition-shadow">
                        <img src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=400&q=80" alt="Đắc Nhân Tâm" className="w-full h-full object-cover" />
                      </div>
                      <span className="text-[10px] font-bold text-ink dark:text-night-text mt-1.5 truncate max-w-[70px] sm:max-w-[80px] text-center">Đắc Nhân Tâm</span>
                    </div>
                  </div>
                  <span className="font-metadata-spec text-[10px] font-bold uppercase tracking-wider text-wine dark:text-gold">Kỹ Năng & Lãnh Đạo</span>
                  <h3 className="font-display font-black text-base text-ink dark:text-night-text mt-1 leading-snug">Combo Khai Phá Tiềm Năng Bản Thân</h3>
                  <p className="font-editorial-body text-xs text-ink-muted dark:text-night-muted mt-1 leading-snug line-clamp-2">Gồm: Sapiens, Từ Tốt Đến Vĩ Đại và Đắc Nhân Tâm.</p>
                </div>
                <div className="pt-3 border-t border-paper-border dark:border-night-border mt-3 flex items-center justify-between gap-2">
                  <div>
                    <div className="font-metadata-spec text-[11px] line-through text-ink-muted dark:text-night-muted">450 Khoai (~450k)</div>
                    <div className="flex items-baseline gap-1">
                      <span className="font-metadata-spec text-xl font-black text-ink dark:text-night-text">249</span>
                      <span className="potato-badge text-[10px] py-0.5 px-2">Khoai <i className="ph-fill ph-coins text-[9px]"></i></span>
                    </div>
                  </div>
                  <button type="button" onClick={() => openRedeemModal('Combo Khai Phá Tiềm Năng Bản Thân', 249, 'Đổi Combo Khai Phá Tiềm Năng Bản Thân thành công!')} className="px-4 py-2 rounded-full bg-wine hover:bg-wine-dark text-white font-metadata-spec text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 shrink-0"><i className="ph-bold ph-book-bookmark"></i> Đổi Bằng Khoai</button>
                </div>
              </div>

              {/* Combo Card 4 */}
              <div className="rounded-2xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border p-4 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between relative group">
                <span className="absolute top-3 left-3 z-20 font-metadata-spec text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-600 text-white shadow-sm">-40% GIẢM</span>
                <div>
                  <div className="w-full bg-[#fbf8f2] dark:bg-night-surface/70 rounded-xl p-3 pt-6 pb-2.5 mb-3 flex items-end justify-center gap-3 sm:gap-3.5 min-h-[145px] border border-paper-border/60 dark:border-night-border/60 relative">
                    <div className="combo-book-item flex flex-col items-center group/book cursor-pointer"
                         onMouseEnter={(e) => handleBookEnter(e, {title: 'Atomic Habits', author: 'James Clear', category: 'Tâm Lý & Phát Triển', rating: '★ 5.0', pages: '384 trang', price: '135 Khoai', summary: 'Phương pháp xây dựng thói quen tốt và loại bỏ thói quen xấu...', cover: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80'})}
                         onMouseLeave={handleBookLeave}>
                      <div className="book-cover-wrapper w-16 sm:w-20 aspect-[2/3] rounded shadow-md overflow-hidden bg-paper-200 border border-black/10 group-hover/book:shadow-xl transition-shadow">
                        <img src="https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80" alt="Atomic Habits" className="w-full h-full object-cover" />
                      </div>
                      <span className="text-[10px] font-bold text-ink dark:text-night-text mt-1.5 truncate max-w-[70px] sm:max-w-[80px] text-center">Atomic Habits</span>
                    </div>

                    <div className="combo-book-item flex flex-col items-center group/book -translate-y-1 cursor-pointer"
                         onMouseEnter={(e) => handleBookEnter(e, {title: 'Nhà Lãnh Đạo Không Chức Danh', author: 'Robin Sharma', category: 'Lãnh Đạo & Thành Công', rating: '★ 4.9', pages: '275 trang', price: '125 Khoai', summary: 'Đánh thức phẩm chất lãnh đạo tiềm ẩn trong mỗi con người...', cover: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=400&auto=format&fit=crop'})}
                         onMouseLeave={handleBookLeave}>
                      <div className="book-cover-wrapper w-20 sm:w-24 aspect-[2/3] rounded shadow-lg overflow-hidden bg-paper-200 border border-black/10 group-hover/book:shadow-2xl transition-shadow">
                        <img src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=400&auto=format&fit=crop" alt="Nhà Lãnh Đạo Không Chức Danh" className="w-full h-full object-cover" />
                      </div>
                      <span className="text-[10px] font-bold text-ink dark:text-night-text mt-1.5 truncate max-w-[70px] sm:max-w-[85px] text-center">Lãnh Đạo KCD</span>
                    </div>

                    <div className="combo-book-item flex flex-col items-center group/book cursor-pointer"
                         onMouseEnter={(e) => handleBookEnter(e, {title: 'Khởi Nghiệp Tinh Gọn', author: 'Eric Ries', category: 'Kinh Doanh & Đổi Mới', rating: '★ 4.8', pages: '350 trang', price: '130 Khoai', summary: 'Mô hình phát triển sản phẩm và doanh nghiệp đột phá giúp kiểm chứng ý tưởng...', cover: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=400&q=80'})}
                         onMouseLeave={handleBookLeave}>
                      <div className="book-cover-wrapper w-16 sm:w-20 aspect-[2/3] rounded shadow-md overflow-hidden bg-paper-200 border border-black/10 group-hover/book:shadow-xl transition-shadow">
                        <img src="https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=400&q=80" alt="Khởi Nghiệp Tinh Gọn" className="w-full h-full object-cover" />
                      </div>
                      <span className="text-[10px] font-bold text-ink dark:text-night-text mt-1.5 truncate max-w-[70px] sm:max-w-[80px] text-center">Khởi Nghiệp</span>
                    </div>
                  </div>
                  <span className="font-metadata-spec text-[10px] font-bold uppercase tracking-wider text-wine dark:text-gold">Tư Duy & Khởi Nghiệp</span>
                  <h3 className="font-display font-black text-base text-ink dark:text-night-text mt-1 leading-snug">Combo Bứt Phá & Tư Duy Tinh Gọn</h3>
                  <p className="font-editorial-body text-xs text-ink-muted dark:text-night-muted mt-1 leading-snug line-clamp-2">Gồm: Atomic Habits, Lãnh Đạo Không Chức Danh và Khởi Nghiệp Tinh Gọn.</p>
                </div>
                <div className="pt-3 border-t border-paper-border dark:border-night-border mt-3 flex items-center justify-between gap-2">
                  <div>
                    <div className="font-metadata-spec text-[11px] line-through text-ink-muted dark:text-night-muted">390 Khoai (~390k)</div>
                    <div className="flex items-baseline gap-1">
                      <span className="font-metadata-spec text-xl font-black text-ink dark:text-night-text">239</span>
                      <span className="potato-badge text-[10px] py-0.5 px-2">Khoai <i className="ph-fill ph-coins text-[9px]"></i></span>
                    </div>
                  </div>
                  <button type="button" onClick={() => openRedeemModal('Combo Bứt Phá & Tư Duy Tinh Gọn', 239, 'Đổi Combo Bứt Phá & Tư Duy Tinh Gọn thành công!')} className="px-4 py-2 rounded-full bg-wine hover:bg-wine-dark text-white font-metadata-spec text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 shrink-0"><i className="ph-bold ph-book-bookmark"></i> Đổi Bằng Khoai</button>
                </div>
              </div>
            </div>
          </section>

          {}
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
              {/* Card 4.1 */}
              <div className="offer-card rounded-2xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between relative group">
                <span className="absolute top-4 right-4 font-metadata-spec text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-wine text-white shadow-sm z-10">-50%</span>
                <div className="combo-book-item space-y-4 cursor-pointer"
                     onMouseEnter={(e) => handleBookEnter(e, {title: 'Nhà Lãnh Đạo Không Chức Danh', author: 'Robin Sharma', category: 'Lãnh Đạo & Phát Triển', rating: '★ 4.9', pages: '280 trang', price: '25 Khoai', summary: 'Bí quyết đánh thức tiềm năng lãnh đạo nội tại từ mọi vị trí...', cover: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=400&auto=format&fit=crop'})}
                     onMouseLeave={handleBookLeave}>
                  <div className="book-cover-wrapper w-20 aspect-[2/3] rounded-lg overflow-hidden shadow-md bg-paper-200 dark:bg-night-surface shrink-0">
                    <img src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=400&auto=format&fit=crop" alt="Nhà Lãnh Đạo Không Chức Danh" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <span className="font-metadata-spec text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-wine/10 text-wine dark:bg-gold/15 dark:text-gold">Robin Sharma</span>
                    <h3 className="font-display font-black text-lg text-ink dark:text-night-text mt-2 leading-tight">Nhà Lãnh Đạo Không Chức Danh</h3>
                  </div>
                </div>
                <div className="pt-4 border-t border-paper-border dark:border-night-border mt-4">
                  <div className="flex items-baseline justify-between mb-4">
                    <div className="flex items-baseline gap-2"><span className="font-metadata-spec text-xs line-through text-ink-muted dark:text-night-muted">50</span><span className="font-metadata-spec text-2xl font-black text-wine dark:text-gold">25</span><span className="potato-badge">Khoai <i className="ph-fill ph-coins text-[10px]"></i></span></div>
                  </div>
                  <button type="button" onClick={() => openRedeemModal('Nhà Lãnh Đạo Không Chức Danh', 25, 'Mua sách thành công! Đã thêm vào danh sách đọc cá nhân.')} className="w-full py-2.5 rounded-full bg-wine hover:bg-wine-dark text-white font-metadata-spec text-xs font-bold text-center transition-colors shadow-sm">Mua Sách</button>
                </div>
              </div>

              {/* Card 4.2 */}
              <div className="offer-card rounded-2xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between relative group">
                <span className="absolute top-4 right-4 font-metadata-spec text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-wine text-white shadow-sm z-10">-20%</span>
                <div className="combo-book-item space-y-4 cursor-pointer"
                     onMouseEnter={(e) => handleBookEnter(e, {title: 'Dune - Xứ Cát', author: 'Frank Herbert', category: 'Khoa Học Viễn Tưởng', rating: '★ 5.0', pages: '680 trang', price: '48 Khoai', summary: 'Kiệt tác khoa học viễn tưởng vĩ đại nhất mọi thời đại...', cover: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=400&auto=format&fit=crop'})}
                     onMouseLeave={handleBookLeave}>
                  <div className="book-cover-wrapper w-20 aspect-[2/3] rounded-lg overflow-hidden shadow-md bg-paper-200 dark:bg-night-surface shrink-0">
                    <img src="https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=400&auto=format&fit=crop" alt="Dune - Xứ Cát" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <span className="font-metadata-spec text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-wine/10 text-wine dark:bg-gold/15 dark:text-gold">Frank Herbert</span>
                    <h3 className="font-display font-black text-lg text-ink dark:text-night-text mt-2 leading-tight">Dune - Xứ Cát</h3>
                  </div>
                </div>
                <div className="pt-4 border-t border-paper-border dark:border-night-border mt-4">
                  <div className="flex items-baseline justify-between mb-4">
                    <div className="flex items-baseline gap-2"><span className="font-metadata-spec text-xs line-through text-ink-muted dark:text-night-muted">60</span><span className="font-metadata-spec text-2xl font-black text-wine dark:text-gold">48</span><span className="potato-badge">Khoai <i className="ph-fill ph-coins text-[10px]"></i></span></div>
                  </div>
                  <button type="button" onClick={() => openRedeemModal('Dune - Xứ Cát', 48, 'Mua sách thành công! Đã thêm vào danh sách đọc cá nhân.')} className="w-full py-2.5 rounded-full bg-wine hover:bg-wine-dark text-white font-metadata-spec text-xs font-bold text-center transition-colors shadow-sm">Mua Sách</button>
                </div>
              </div>

              {/* Card 4.3 */}
              <div className="offer-card rounded-2xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between relative group">
                <span className="absolute top-4 right-4 font-metadata-spec text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-wine text-white shadow-sm z-10">-30%</span>
                <div className="combo-book-item space-y-4 cursor-pointer"
                     onMouseEnter={(e) => handleBookEnter(e, {title: 'Atomic Habits', author: 'James Clear', category: 'Kỹ Năng & Thói Quen', rating: '★ 5.0', pages: '350 trang', price: '52 Khoai', summary: 'Thay đổi tí hon, hiệu quả bất ngờ. Hướng dẫn thực hành từng bước...', cover: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=400&auto=format&fit=crop'})}
                     onMouseLeave={handleBookLeave}>
                  <div className="book-cover-wrapper w-20 aspect-[2/3] rounded-lg overflow-hidden shadow-md bg-paper-200 dark:bg-night-surface shrink-0">
                    <img src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=400&auto=format&fit=crop" alt="Atomic Habits" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <span className="font-metadata-spec text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-wine/10 text-wine dark:bg-gold/15 dark:text-gold">James Clear</span>
                    <h3 className="font-display font-black text-lg text-ink dark:text-night-text mt-2 leading-tight">Atomic Habits</h3>
                  </div>
                </div>
                <div className="pt-4 border-t border-paper-border dark:border-night-border mt-4">
                  <div className="flex items-baseline justify-between mb-4">
                    <div className="flex items-baseline gap-2"><span className="font-metadata-spec text-xs line-through text-ink-muted dark:text-night-muted">75</span><span className="font-metadata-spec text-2xl font-black text-wine dark:text-gold">52</span><span className="potato-badge">Khoai <i className="ph-fill ph-coins text-[10px]"></i></span></div>
                  </div>
                  <button type="button" onClick={() => openRedeemModal('Atomic Habits', 52, 'Mua sách thành công! Đã thêm vào danh sách đọc cá nhân.')} className="w-full py-2.5 rounded-full bg-wine hover:bg-wine-dark text-white font-metadata-spec text-xs font-bold text-center transition-colors shadow-sm">Mua Sách</button>
                </div>
              </div>

              {/* Card 4.4 */}
              <div className="offer-card rounded-2xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between relative group">
                <span className="absolute top-4 right-4 font-metadata-spec text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-wine text-white shadow-sm z-10">-15%</span>
                <div className="combo-book-item space-y-4 cursor-pointer"
                     onMouseEnter={(e) => handleBookEnter(e, {title: 'Sapiens — Lược Sử Loài Người', author: 'Yuval Noah Harari', category: 'Lịch Sử & Nhân Loại', rating: '★ 5.0', pages: '512 trang', price: '68 Khoai', summary: 'Bức tranh toàn cảnh về hành trình tiến hóa và phát triển của loài người...', cover: 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?q=80&w=400&auto=format&fit=crop'})}
                     onMouseLeave={handleBookLeave}>
                  <div className="book-cover-wrapper w-20 aspect-[2/3] rounded-lg overflow-hidden shadow-md bg-paper-200 dark:bg-night-surface shrink-0">
                    <img src="https://images.unsplash.com/photo-1461360370896-922624d12aa1?q=80&w=400&auto=format&fit=crop" alt="Sapiens" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <span className="font-metadata-spec text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-wine/10 text-wine dark:bg-gold/15 dark:text-gold">Yuval Noah Harari</span>
                    <h3 className="font-display font-black text-lg text-ink dark:text-night-text mt-2 leading-tight">Sapiens — Lược Sử Loài Người</h3>
                  </div>
                </div>
                <div className="pt-4 border-t border-paper-border dark:border-night-border mt-4">
                  <div className="flex items-baseline justify-between mb-4">
                    <div className="flex items-baseline gap-2"><span className="font-metadata-spec text-xs line-through text-ink-muted dark:text-night-muted">80</span><span className="font-metadata-spec text-2xl font-black text-wine dark:text-gold">68</span><span className="potato-badge">Khoai <i className="ph-fill ph-coins text-[10px]"></i></span></div>
                  </div>
                  <button type="button" onClick={() => openRedeemModal('Sapiens', 68, 'Mua sách thành công! Đã thêm vào danh sách đọc cá nhân.')} className="w-full py-2.5 rounded-full bg-wine hover:bg-wine-dark text-white font-metadata-spec text-xs font-bold text-center transition-colors shadow-sm">Mua Sách</button>
                </div>
              </div>
            </div>
          </section>

          {}
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
              {/* Card 5.1 */}
              <div className="offer-card rounded-2xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between relative group">
                <div className="space-y-3.5">
                  <div className="relative h-28 w-full rounded-xl overflow-hidden bg-paper-200 dark:bg-night-surface shadow-inner">
                    <img src="https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=400&auto=format&fit=crop" alt="Chiến Thần Tốc Độ" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
                    <span className="absolute top-2.5 right-2.5 font-metadata-spec text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-wine text-white shadow-sm">HOT CHALLENGE</span>
                    <div className="absolute bottom-2.5 left-2.5 w-9 h-9 rounded-lg bg-wine/30 backdrop-blur-md border border-wine/50 flex items-center justify-center text-gold text-xl shadow-md"><i className="ph-bold ph-lightning"></i></div>
                  </div>
                  <div>
                    <span className="font-metadata-spec text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-paper-200 dark:bg-night-border text-wine dark:text-gold">3 Ngày 1 Sách</span>
                    <h3 className="font-display font-black text-lg text-ink dark:text-night-text mt-1.5 leading-tight">Chiến Thần Tốc Độ</h3>
                  </div>
                  <ul className="space-y-1.5 pt-2 text-xs font-metadata-spec text-ink-muted dark:text-night-muted border-t border-paper-border/60 dark:border-night-border/60">
                    <li className="flex items-center gap-2"><i className="ph-bold ph-target text-wine dark:text-gold text-sm shrink-0"></i><span className="truncate">Mục tiêu: Đọc xong 1 cuốn trong 3 ngày</span></li>
                    <li className="flex items-center gap-2"><i className="ph-bold ph-gift text-gold text-sm shrink-0"></i><span className="truncate">Thưởng: Voucher giảm 5% mua sách tiếp</span></li>
                    <li className="flex items-center gap-2"><i className="ph-bold ph-medal text-gold text-sm shrink-0"></i><span className="truncate">Huy hiệu Tia Sớp Nhanh trên hồ sơ</span></li>
                  </ul>
                </div>
                <div className="pt-3.5 border-t border-paper-border dark:border-night-border mt-3.5">
                  <div className="flex items-baseline justify-between mb-3.5">
                    <span className="font-metadata-spec text-xs font-semibold text-ink-muted dark:text-night-muted">Phần thưởng:</span>
                    <span className="font-metadata-spec text-2xl font-black text-wine dark:text-gold">-5% Voucher</span>
                  </div>
                  <button type="button" onClick={() => openRedeemModal('Thử thách Chiến Thần Tốc Độ', 0, 'Đã ghi danh thử thách Chiến Thần Tốc Độ! Hãy hoàn thành cuốn sách đầu tiên trong 3 ngày.')} className="w-full py-2.5 rounded-full bg-wine hover:bg-wine-dark text-white font-metadata-spec text-xs font-bold text-center transition-colors shadow-sm">Tham Gia Ngay</button>
                </div>
              </div>

              {/* Card 5.2 */}
              <div className="offer-card rounded-2xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between relative group">
                <div className="space-y-3.5">
                  <div className="relative h-28 w-full rounded-xl overflow-hidden bg-paper-200 dark:bg-night-surface shadow-inner">
                    <img src="https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=400&auto=format&fit=crop" alt="Mọt Sách Chăm Chỉ" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
                    <span className="absolute top-2.5 right-2.5 font-metadata-spec text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-gold text-night-bg shadow-sm">7-DAY STREAK</span>
                    <div className="absolute bottom-2.5 left-2.5 w-9 h-9 rounded-lg bg-gold/30 backdrop-blur-md border border-gold/50 flex items-center justify-center text-gold text-xl shadow-md"><i className="ph-bold ph-fire"></i></div>
                  </div>
                  <div>
                    <span className="font-metadata-spec text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-gold/20 text-gold">Chuỗi Đọc 7 Ngày</span>
                    <h3 className="font-display font-black text-lg text-ink dark:text-night-text mt-1.5 leading-tight">Mọt Sách Chăm Chỉ</h3>
                  </div>
                  <ul className="space-y-1.5 pt-2 text-xs font-metadata-spec text-ink-muted dark:text-night-muted border-t border-paper-border/60 dark:border-night-border/60">
                    <li className="flex items-center gap-2"><i className="ph-bold ph-target text-wine dark:text-gold text-sm shrink-0"></i><span className="truncate">Duy trì thói quen đọc 7 ngày liên tiếp</span></li>
                    <li className="flex items-center gap-2"><i className="ph-bold ph-gift text-gold text-sm shrink-0"></i><span className="truncate">Thưởng nóng: +10 Khoai tươi vào ví</span></li>
                    <li className="flex items-center gap-2"><i className="ph-bold ph-medal text-gold text-sm shrink-0"></i><span className="truncate">Mở khóa thành tựu Ngọn Lửa Bền Bỉ</span></li>
                  </ul>
                </div>
                <div className="pt-3.5 border-t border-paper-border dark:border-night-border mt-3.5">
                  <div className="flex items-baseline justify-between mb-3.5">
                    <span className="font-metadata-spec text-xs font-semibold text-ink-muted dark:text-night-muted">Phần thưởng:</span>
                    <div className="flex items-baseline gap-1.5"><span className="font-metadata-spec text-2xl font-black text-emerald-600 dark:text-emerald-400">+10</span><span className="potato-badge">Khoai <i className="ph-fill ph-coins text-[10px]"></i></span></div>
                  </div>
                  <button type="button" onClick={() => openRedeemModal('Thử thách Mọt Sách Chăm Chỉ', 0, 'Đã kích hoạt chuỗi đọc sách Mọt Sách Chăm Chỉ! Hãy duy trì 7 ngày để nhận thưởng 10 Khoai.')} className="w-full py-2.5 rounded-full bg-wine hover:bg-wine-dark text-white font-metadata-spec text-xs font-bold text-center transition-colors shadow-sm">Tham Gia Ngay</button>
                </div>
              </div>

              {/* Card 5.3 */}
              <div className="offer-card rounded-2xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between relative group">
                <div className="space-y-3.5">
                  <div className="relative h-28 w-full rounded-xl overflow-hidden bg-paper-200 dark:bg-night-surface shadow-inner">
                    <img src="https://images.unsplash.com/photo-1481627834876-b7833e8f5570?q=80&w=400&auto=format&fit=crop" alt="Thợ Săn Tri Thức" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
                    <span className="absolute top-2.5 right-2.5 font-metadata-spec text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-600 text-white shadow-sm">MONTHLY MASTER</span>
                    <div className="absolute bottom-2.5 left-2.5 w-9 h-9 rounded-lg bg-blue-600/30 backdrop-blur-md border border-blue-400/50 flex items-center justify-center text-blue-300 text-xl shadow-md"><i className="ph-bold ph-compass"></i></div>
                  </div>
                  <div>
                    <span className="font-metadata-spec text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-paper-200 dark:bg-night-border text-wine dark:text-gold">Mục Tiêu Tháng</span>
                    <h3 className="font-display font-black text-lg text-ink dark:text-night-text mt-1.5 leading-tight">Thợ Săn Tri Thức</h3>
                  </div>
                  <ul className="space-y-1.5 pt-2 text-xs font-metadata-spec text-ink-muted dark:text-night-muted border-t border-paper-border/60 dark:border-night-border/60">
                    <li className="flex items-center gap-2"><i className="ph-bold ph-target text-wine dark:text-gold text-sm shrink-0"></i><span className="truncate">Đọc hoàn thành 10 cuốn sách trong tháng</span></li>
                    <li className="flex items-center gap-2"><i className="ph-bold ph-gift text-gold text-sm shrink-0"></i><span className="truncate">Thưởng lớn: +25 Khoai & Voucher -15%</span></li>
                    <li className="flex items-center gap-2"><i className="ph-bold ph-trophy text-gold text-sm shrink-0"></i><span className="truncate">Vinh danh Top Độc Giả trên Bảng Vàng</span></li>
                  </ul>
                </div>
                <div className="pt-3.5 border-t border-paper-border dark:border-night-border mt-3.5">
                  <div className="flex items-baseline justify-between mb-3.5">
                    <span className="font-metadata-spec text-xs font-semibold text-ink-muted dark:text-night-muted">Phần thưởng:</span>
                    <div className="flex items-baseline gap-1.5"><span className="font-metadata-spec text-2xl font-black text-emerald-600 dark:text-emerald-400">+25</span><span className="potato-badge">Khoai <i className="ph-fill ph-coins text-[10px]"></i></span></div>
                  </div>
                  <button type="button" onClick={() => openRedeemModal('Thử thách Thợ Săn Tri Thức', 0, 'Đã ghi danh thử thách Thợ Săn Tri Thức! Chúc bạn chinh phục 10 cuốn sách trong tháng.')} className="w-full py-2.5 rounded-full bg-wine hover:bg-wine-dark text-white font-metadata-spec text-xs font-bold text-center transition-colors shadow-sm">Tham Gia Ngay</button>
                </div>
              </div>

              {/* Card 5.4 */}
              <div className="offer-card rounded-2xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between relative group">
                <div className="space-y-3.5">
                  <div className="relative h-28 w-full rounded-xl overflow-hidden bg-paper-200 dark:bg-night-surface shadow-inner">
                    <img src="https://images.unsplash.com/photo-1471107340929-a87cd0f5b5f3?q=80&w=400&auto=format&fit=crop" alt="Reviewer Cừ Khôi" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
                    <span className="absolute top-2.5 right-2.5 font-metadata-spec text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-600 text-white shadow-sm">COMMUNITY STAR</span>
                    <div className="absolute bottom-2.5 left-2.5 w-9 h-9 rounded-lg bg-amber-600/30 backdrop-blur-md border border-amber-400/50 flex items-center justify-center text-amber-300 text-xl shadow-md"><i className="ph-bold ph-pen-nib"></i></div>
                  </div>
                  <div>
                    <span className="font-metadata-spec text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-paper-200 dark:bg-night-border text-wine dark:text-gold">Cộng Đồng Đọc</span>
                    <h3 className="font-display font-black text-lg text-ink dark:text-night-text mt-1.5 leading-tight">Reviewer Cừ Khôi</h3>
                  </div>
                  <ul className="space-y-1.5 pt-2 text-xs font-metadata-spec text-ink-muted dark:text-night-muted border-t border-paper-border/60 dark:border-night-border/60">
                    <li className="flex items-center gap-2"><i className="ph-bold ph-target text-wine dark:text-gold text-sm shrink-0"></i><span className="truncate">Viết 5 bài review sách được phê duyệt</span></li>
                    <li className="flex items-center gap-2"><i className="ph-bold ph-gift text-gold text-sm shrink-0"></i><span className="truncate">Thưởng nóng: +15 Khoai tươi vào ví</span></li>
                    <li className="flex items-center gap-2"><i className="ph-bold ph-star text-gold text-sm shrink-0"></i><span className="truncate">Danh hiệu Bút Vàng Độc Giả xuất sắc</span></li>
                  </ul>
                </div>
                <div className="pt-3.5 border-t border-paper-border dark:border-night-border mt-3.5">
                  <div className="flex items-baseline justify-between mb-3.5">
                    <span className="font-metadata-spec text-xs font-semibold text-ink-muted dark:text-night-muted">Phần thưởng:</span>
                    <div className="flex items-baseline gap-1.5"><span className="font-metadata-spec text-2xl font-black text-emerald-600 dark:text-emerald-400">+15</span><span className="potato-badge">Khoai <i className="ph-fill ph-coins text-[10px]"></i></span></div>
                  </div>
                  <button type="button" onClick={() => openRedeemModal('Thử thách Reviewer Cừ Khôi', 0, 'Đã ghi danh thử thách Reviewer Cừ Khôi! Hãy chia sẻ cảm nhận về cuốn sách bạn tâm đắc nhất.')} className="w-full py-2.5 rounded-full bg-wine hover:bg-wine-dark text-white font-metadata-spec text-xs font-bold text-center transition-colors shadow-sm">Tham Gia Ngay</button>
                </div>
              </div>
            </div>
          </section>
        </main>

        {}
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

        {}
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

        {}
        <footer className="border-t border-paper-border dark:border-night-border bg-paper dark:bg-night-bg text-ink dark:text-night-text py-10 sm:py-12 transition-colors">
          <div className="w-full max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-wine flex items-center justify-center text-white shadow-md">
                    <img src="testhome/img/icon-removebg-preview.png" alt="Logo" className="w-7 h-7 object-contain" onError={(e) => { e.currentTarget.src = './image/LOGO HALM BOOK/logo.png'; }} />
                  </div>
                  <span className="font-display font-black text-2xl tracking-tight text-ink dark:text-night-text">HALM BOOK</span>
                </div>
                <p className="font-editorial-body text-sm text-ink-muted dark:text-night-muted leading-relaxed max-w-sm">
                  HALM BOOK - Không gian đọc sách trực tuyến dành cho những tâm trí ham khám phá. Nền tảng kết nối độc giả với tri thức và trợ lý AI thông minh.
                </p>
                <div className="space-y-2 text-xs font-metadata-spec text-ink dark:text-night-muted pt-2">
                  <div className="flex items-center gap-2"><i className="ph-bold ph-phone text-wine dark:text-gold text-sm"></i><span>Hotline: <strong className="text-ink dark:text-night-text">0793503369 / 0909.090.909</strong></span></div>
                  <div className="flex items-center gap-2"><i className="ph-bold ph-envelope-simple text-wine dark:text-gold text-sm"></i><a href="mailto:halm@book.vn" className="hover:underline">halm@book.vn</a></div>
                  <div className="flex items-center gap-2"><i className="ph-bold ph-map-pin text-wine dark:text-gold text-sm"></i><span>03 Quang Trung, Quận Hải Châu, TP. Đà Nẵng</span></div>
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="font-display font-black text-xs uppercase tracking-wider text-ink dark:text-night-text">Khám Phá</h4>
                <ul className="space-y-2 text-xs font-semibold text-ink-muted dark:text-night-muted font-metadata-spec">
                  <li><a href="testhome/tc.html#trending-section" className="hover:text-wine dark:hover:text-gold transition-colors">Sách Thịnh Hành</a></li>
                  <li><a href="testhome/tc.html#children-section" className="hover:text-wine dark:hover:text-gold transition-colors">Sách Thiếu Nhi</a></li>
                  <li><a href="testhome/tc.html#literature-section" className="hover:text-wine dark:hover:text-gold transition-colors">Văn Học & Truyện Dài</a></li>
                  <li><a href="testhome/tc.html#selfgrowth-section" className="hover:text-wine dark:hover:text-gold transition-colors">Phát Triển Bản Thân</a></li>
                  <li><a href="testhome/tc.html#topic-section" className="hover:text-wine dark:hover:text-gold transition-colors">Chủ Đề Cảm Hứng</a></li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-display font-black text-xs uppercase tracking-wider text-ink dark:text-night-text">Dịch Vụ & Hỗ Trợ</h4>
                <ul className="space-y-2 text-xs font-semibold text-ink-muted dark:text-night-muted font-metadata-spec">
                  <li><a href="tiers.html" className="hover:text-wine dark:hover:text-gold transition-colors">Gói Hội Viên Đọc Sách</a></li>
                  <li><a href="book-detail.html" className="hover:text-wine dark:hover:text-gold transition-colors">Trải Nghiệm Đọc Thử</a></li>
                  <li><a href="cart.html" className="hover:text-wine dark:hover:text-gold transition-colors">Giỏ Hàng & Thuê Sách</a></li>
                  <li><a href="login.html" className="hover:text-wine dark:hover:text-gold transition-colors">Quản Lý Tài Khoản</a></li>
                  <li><button onClick={() => openChatbot('Hỗ trợ ưu đãi')} className="hover:text-wine dark:hover:text-gold transition-colors text-left w-full">Trợ Giúp AI Trực Tuyến</button></li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-display font-black text-xs uppercase tracking-wider text-ink dark:text-night-text">Ứng Dụng Di Động</h4>
                <p className="font-editorial-body text-xs text-ink-muted dark:text-night-muted">Quét mã QR để tải ứng dụng HALM BOOK trên iOS và Android:</p>
                <div className="p-2 rounded-xl bg-white border border-paper-border inline-block shadow-sm">
                  <img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=HALMBookApp" alt="QR Code" className="w-20 h-20 object-contain" />
                </div>
              </div>
            </div>
            <div className="border-t border-paper-border dark:border-night-border mt-8 pt-5 flex flex-col sm:flex-row justify-between items-center text-xs font-metadata-spec text-ink-muted dark:text-night-muted gap-4">
              <p>© 2026 HALM BOOK. Tất cả bản quyền được bảo lưu.</p>
              <div className="flex items-center gap-6">
                <a href="#!" className="hover:underline">Điều khoản sử dụng</a>
                <a href="#!" className="hover:underline">Chính sách bảo mật</a>
                <a href="#!" className="hover:underline">Bản quyền tác phẩm</a>
              </div>
            </div>
          </div>
        </footer>

        {}
        <button id="btnScrollToTop" title="Lên đầu trang" className={showScrollTop ? 'show' : ''} onClick={scrollToTop}>
          <i className="ph-bold ph-arrow-up text-lg"></i>
        </button>

        <div id="chatbot-container">
          <div id="chat-window" className={chatOpen ? 'show' : ''}>
            <div className="bg-gradient-to-r from-wine to-wine-light text-white px-5 py-3.5 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-white p-0.5 shrink-0">
                  <img src="testhome/img/icon_chatbot.png" alt="Bot" className="w-full h-full rounded-full object-cover" onError={(e) => { e.currentTarget.src = './image/LOGO HALM BOOK/logo.png'; }} />
                </div>
                <div>
                  <div className="font-display font-bold text-sm tracking-wide leading-tight">Trợ lý ảo HALM BOOK</div>
                  <div className="font-metadata-spec text-[10px] text-gold font-medium">Tư vấn ưu đãi & gói đọc</div>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <button onClick={() => { setChatMessages([]); setShowChatWelcome(true); }} className="hover:text-gold transition-colors" title="Làm mới hội thoại">
                  <i className="ph-bold ph-arrows-clockwise text-lg"></i>
                </button>
                <button onClick={() => setChatOpen(false)} className="hover:text-gold transition-colors" title="Thu nhỏ">
                  <i className="ph-bold ph-x text-lg"></i>
                </button>
              </div>
            </div>

            <div className="flex-grow overflow-y-auto p-4 flex flex-col relative text-night-text bg-[#181916] text-xs space-y-3" ref={chatMessagesRef}>
              {showChatWelcome && (
                <div id="chat-welcome" className="text-center py-6 space-y-3">
                  <div className="w-14 h-14 mx-auto rounded-full bg-wine/20 border border-wine/40 p-1 flex items-center justify-center">
                    <img src="testhome/img/icon_chatbot.png" alt="Bot" className="w-full h-full rounded-full object-cover" onError={(e) => { e.currentTarget.src = './image/LOGO HALM BOOK/logo.png'; }} />
                  </div>
                  <h4 className="font-display font-black text-base text-white">Xin chào độc giả!</h4>
                  <p className="font-editorial-body text-xs text-night-muted leading-relaxed">Tôi là trợ lý AI của HALM BOOK. Bạn muốn tư vấn gói đọc sách nào phù hợp nhất hôm nay?</p>
                  <div className="space-y-2 pt-2 text-left font-metadata-spec">
                    <button onClick={() => sendChatMessage("Gói cước nào tiết kiệm nhất cho sinh viên?")} className="suggestion-btn w-full p-2.5 rounded-xl bg-night-card hover:bg-night-border border border-night-border text-xs text-white flex items-center justify-between transition-colors">
                      <span>Gói cước nào tiết kiệm nhất cho sinh viên?</span><i className="ph-bold ph-arrow-right text-gold"></i>
                    </button>
                    <button onClick={() => sendChatMessage("Cách tích lũy thêm Khoai thưởng đọc sách?")} className="suggestion-btn w-full p-2.5 rounded-xl bg-night-card hover:bg-night-border border border-night-border text-xs text-white flex items-center justify-between transition-colors">
                      <span>Cách tích lũy thêm Khoai thưởng đọc sách?</span><i className="ph-bold ph-arrow-right text-gold"></i>
                    </button>
                    <button onClick={() => sendChatMessage("Tiện ích upload tài liệu AI hoạt động ra sao?")} className="suggestion-btn w-full p-2.5 rounded-xl bg-night-card hover:bg-night-border border border-night-border text-xs text-white flex items-center justify-between transition-colors">
                      <span>Tiện ích upload tài liệu AI hoạt động ra sao?</span><i className="ph-bold ph-arrow-right text-gold"></i>
                    </button>
                  </div>
                </div>
              )}
              
              {!showChatWelcome && (
                <div className="flex flex-col gap-3">
                  {chatMessages.map((msg, idx) => (
                    <div key={idx} className={msg.type === 'user' ? 'self-end bg-wine text-white max-w-[80%] rounded-2xl rounded-tr-sm px-3.5 py-2 text-xs font-metadata-spec' : 'self-start bg-night-card border border-night-border text-night-text max-w-[85%] rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-xs font-editorial-body'} dangerouslySetInnerHTML={msg.type === 'bot' ? {__html: msg.text} : undefined}>
                      {msg.type === 'user' ? msg.text : null}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-3 bg-[#141512] border-t border-night-border shrink-0">
              <div className="relative flex items-center">
                <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendChatMessage(chatInput)} placeholder="Nhập câu hỏi của bạn..." className="w-full bg-night-card text-white placeholder-night-muted text-xs rounded-xl pl-3.5 pr-10 py-3 border border-night-border focus:outline-none focus:border-wine transition-colors font-metadata-spec" />
                <button onClick={() => sendChatMessage(chatInput)} className="absolute right-2 text-gold hover:text-white p-1.5 transition-colors" aria-label="Gửi tin">
                  <i className="ph-bold ph-paper-plane-tilt text-lg"></i>
                </button>
              </div>
            </div>
          </div>

          <button onClick={() => setChatOpen(!chatOpen)} className="w-14 h-14 rounded-full bg-wine hover:bg-wine-dark text-white p-1 shadow-2xl flex items-center justify-center transition-transform hover:scale-105" aria-label="Mở trợ lý ảo AI">
            <img src="testhome/img/icon_chatbot.png" alt="Chatbot" className="w-full h-full rounded-full object-cover" onError={(e) => { e.currentTarget.src = './image/LOGO HALM BOOK/logo.png'; }} />
          </button>
        </div>

      </div>
    </>
  );
}