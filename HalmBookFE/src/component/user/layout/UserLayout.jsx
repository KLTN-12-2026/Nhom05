import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "../../../img/logo.png";
import { clearAuthSession } from "../../../service/AuthToken";
import axiosInstance from "../../../service/AxiosInstance";
import { triggerAirplaneBannerAnimation } from "./helicopterAnimation";

const SECTIONS = [
  ["chapter-0-broadcast", "Trang chủ"],
  ["about-section", "Giới thiệu"],
  ["trending-section", "Sách thịnh hành"],
  ["children-section", "Sách thiếu nhi"],
  ["literature-section", "Văn học"],
  ["selfgrowth-section", "Phát triển bản thân"],
];

const FOOTER_LINK_CLASS = "transition-colors hover:text-[#8B4A3C] dark:hover:text-[#D4AF37]";
const HEADER_LOGO = "/logo.png";

function UserHeader({ onOpenChatbot, onThemeChange }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(() => localStorage.getItem("color-theme") === "dark");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [autoScroll, setAutoScroll] = useState(() => (
    localStorage.getItem("halmbook_auto_chapter_scroll") !== "false"
  ));
  const [searchText, setSearchText] = useState("");
  const [cartCount, setCartCount] = useState(0);
  const isHomePage = location.pathname === "/trangchu";
  const sectionHref = (id) => isHomePage ? `#${id}` : `/trangchu#${id}`;

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("color-theme", isDark ? "dark" : "light");
    onThemeChange?.(isDark);
    if (isDark) {
      window.initializeStarryBackground?.();
    }
  }, [isDark, onThemeChange]);

  useEffect(() => {
    const navbar = document.getElementById("navbar");
    const handleScroll = () => navbar?.classList.toggle("scrolled", window.scrollY > 25);
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    let isMounted = true;
    axiosInstance.get("/api/home/cart/items")
      .then(({ data }) => {
        if (isMounted && Array.isArray(data)) setCartCount(data.length);
      })
      .catch(() => {
        if (isMounted) setCartCount(0);
      });
    return () => {
      isMounted = false;
    };
  }, [location.pathname]);

  useEffect(() => {
    const closeAccountMenu = (event) => {
      if (!event.target.closest("#avatar-menu-wrapper")) {
        setIsAccountMenuOpen(false);
      }
    };
    document.addEventListener("click", closeAccountMenu);
    return () => document.removeEventListener("click", closeAccountMenu);
  }, []);

  const handleLogout = () => {
    clearAuthSession();
    navigate("/dangnhap", { replace: true });
  };

  const handleSearch = (event) => {
    event.preventDefault();
    if (!searchText.trim()) return;

    if (isHomePage && typeof window.handleSearch === "function") {
      const homeInput = document.getElementById("header-search-input");
      if (homeInput) homeInput.value = searchText;
      window.handleSearch();
      return;
    }
    navigate("/trangchu#trending-section");
  };

  const handleAutoScrollChange = (event) => {
    const isEnabled = event.currentTarget.checked;
    setAutoScroll(isEnabled);
    localStorage.setItem("halmbook_auto_chapter_scroll", String(isEnabled));
    window.handleHeaderAutoScrollSwitch?.(isEnabled);
  };

  const handleFlagAnimation = (event) => {
    if (typeof window.triggerAirplaneBannerAnimation === "function") {
      window.triggerAirplaneBannerAnimation(event);
      return;
    }
    triggerAirplaneBannerAnimation(event);
  };

  const toggleTheme = () => {
    setIsDark((current) => !current);
  };

  return (
    <>
      <style>{`
        #navbar.halm-home-header {
          background: linear-gradient(105deg, #171815 0%, #191916 67%, #21190f 100%) !important;
          backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(212, 175, 55, 0.55) !important;
          box-shadow: 0 5px 20px -5px rgba(0, 0, 0, 0.65) !important;
          color: #f5f2e8 !important;
          transition: transform 0.38s cubic-bezier(0.16, 1, 0.3, 1), padding 0.3s ease, background 0.4s ease, border-color 0.3s ease, box-shadow 0.3s ease;
        }
        #airplane-effects-canvas {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }
        #header-content-wrapper {
          will-change: transform;
          transform-origin: left center;
          position: relative;
          z-index: 20;
        }
        .airplane-entity {
          position: absolute;
          top: 48px;
          transform: translateY(-50%);
          display: flex;
          align-items: center;
          pointer-events: none;
          user-select: none;
          z-index: 1;
          filter: drop-shadow(0 8px 20px rgba(0, 0, 0, 0.28));
          will-change: transform;
        }
        .airplane-flag-canvas {
          position: relative;
          transform-origin: right center;
          will-change: transform;
          overflow: visible;
        }
        .airplane-propeller {
          transform-box: fill-box;
          transform-origin: center;
          animation: aeroPropSpin 0.05s linear infinite;
        }
        @keyframes aeroPropSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          .airplane-flag-canvas {
            animation: none !important;
          }
          .airplane-propeller {
            animation: none !important;
          }
        }
        #navbar.halm-home-header::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: radial-gradient(ellipse 520px 100% at 100% 50%, rgba(126, 72, 22, 0.24), transparent 75%);
        }
        #navbar.halm-home-header::after {
          content: "";
          position: absolute;
          bottom: -1px;
          inset-inline: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(212,175,55,.45) 16%, rgba(212,175,55,.7) 52%, rgba(212,175,55,.45) 90%, transparent);
          pointer-events: none;
        }
        #navbar.halm-home-header .home-header-control {
          border: 1px solid rgba(212, 175, 55, 0.62) !important;
          background: rgba(15, 16, 14, 0.42) !important;
          color: #d6b64c !important;
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.025) !important;
        }
        #navbar.halm-home-header .home-header-control:hover {
          background: rgba(212, 175, 55, 0.13) !important;
          border-color: #d4af37 !important;
        }
        #navbar.halm-home-header #header-search-input {
          border-color: rgba(212, 175, 55, 0.72) !important;
          background: rgba(16, 17, 15, 0.72) !important;
          color: #f2efe7 !important;
          box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.14), inset 0 1px 4px rgba(0, 0, 0, 0.28) !important;
        }
        #navbar.halm-home-header #header-search-input::placeholder {
          color: #aaa89f !important;
        }
        #navbar.halm-home-header #category-nav-btn {
          border-color: rgba(212, 175, 55, 0.68) !important;
          background: rgba(20, 21, 18, 0.58) !important;
          color: #d6b64c !important;
        }
        #navbar.halm-home-header #category-nav-btn:hover {
          background: rgba(212, 175, 55, 0.13) !important;
        }
        #navbar.halm-home-header .category-dropdown {
          border-color: rgba(212, 175, 55, 0.42);
          background: linear-gradient(145deg, #201f1b, #171815);
          color: #f4f2ec;
          box-shadow: 0 16px 38px rgba(0, 0, 0, 0.3);
        }
        #navbar.halm-home-header .category-dropdown-item {
          color: #e9e4d6;
        }
        #navbar.halm-home-header #header-content-wrapper .category-dropdown-item:hover,
        #navbar.halm-home-header #header-content-wrapper .category-dropdown-item:focus-visible {
          background: rgba(212, 175, 55, 0.13) !important;
          color: #f0d77c !important;
        }
        #navbar.halm-home-header .category-dropdown-item i {
          color: #d6b64c !important;
        }
        #navbar.halm-home-header .avatar-dropdown {
          border-color: rgba(212, 175, 55, 0.3);
          background: #201f1b;
          color: #eee9dd;
          box-shadow: 0 18px 42px rgba(0, 0, 0, 0.32);
        }
        #navbar.halm-home-header .avatar-dropdown-item {
          color: #eee9dd;
        }
        #navbar.halm-home-header #header-content-wrapper .avatar-dropdown-item:hover,
        #navbar.halm-home-header #header-content-wrapper .avatar-dropdown-item:focus-visible {
          background: rgba(212, 175, 55, 0.12) !important;
          color: #f0d77c !important;
        }
        #navbar.halm-home-header #header-content-wrapper .avatar-dropdown-logout {
          color: #fb7185 !important;
        }
        #navbar.halm-home-header #header-content-wrapper .avatar-dropdown-logout:hover {
          background: rgba(244, 63, 94, 0.1) !important;
          color: #fda4af !important;
        }
        #navbar.halm-home-header .vietnam-flag-icon {
          background: #da251d !important;
          color: #ffde00 !important;
        }
        #navbar.halm-home-header .vietnam-flag-star {
          color: #ffde00 !important;
        }
        #navbar.halm-home-header .home-header-control,
        #navbar.halm-home-header #header-content-wrapper,
        #navbar.halm-home-header #header-content-wrapper a,
        #navbar.halm-home-header #header-content-wrapper button,
        #navbar.halm-home-header #header-content-wrapper i,
        #navbar.halm-home-header #header-content-wrapper span {
          color: #f5f2e8;
        }
        #navbar.halm-home-header #header-content-wrapper .home-header-control,
        #navbar.halm-home-header #header-content-wrapper #category-nav-btn {
          color: #d6b64c !important;
        }
        #navbar.halm-home-header #header-content-wrapper .home-header-control:hover {
          color: #f0d77c !important;
        }
        html:not(.dark) #navbar.halm-home-header {
          background: linear-gradient(105deg, #fffdf8 0%, #faf7ef 67%, #f3ecdc 100%) !important;
          border-bottom-color: rgba(165, 128, 34, 0.35) !important;
          box-shadow: 0 5px 20px -5px rgba(54, 43, 20, 0.16) !important;
          color: #302a1e !important;
        }
        html:not(.dark) #navbar.halm-home-header::before {
          background: radial-gradient(ellipse 520px 100% at 100% 50%, rgba(212, 175, 55, 0.1), transparent 75%);
        }
        html:not(.dark) #navbar.halm-home-header::after {
          background: linear-gradient(90deg, transparent, rgba(165, 128, 34, 0.22) 16%, rgba(165, 128, 34, 0.48) 52%, rgba(165, 128, 34, 0.22) 90%, transparent);
        }
        html:not(.dark) #navbar.halm-home-header #header-content-wrapper,
        html:not(.dark) #navbar.halm-home-header #header-content-wrapper a,
        html:not(.dark) #navbar.halm-home-header #header-content-wrapper button,
        html:not(.dark) #navbar.halm-home-header #header-content-wrapper i,
        html:not(.dark) #navbar.halm-home-header #header-content-wrapper span {
          color: #302a1e !important;
        }
        html:not(.dark) #navbar.halm-home-header #header-content-wrapper a:hover,
        html:not(.dark) #navbar.halm-home-header #header-content-wrapper a:hover span {
          color: #8a6812 !important;
        }
        html:not(.dark) #navbar.halm-home-header .home-header-control {
          border-color: rgba(165, 128, 34, 0.42) !important;
          background: rgba(255, 255, 255, 0.72) !important;
          color: #765a10 !important;
          box-shadow: 0 2px 7px rgba(54, 43, 20, 0.06) !important;
        }
        html:not(.dark) #navbar.halm-home-header .home-header-control:hover {
          border-color: rgba(165, 128, 34, 0.7) !important;
          background: #f8f0d9 !important;
          color: #60470a !important;
        }
        html:not(.dark) #navbar.halm-home-header #header-search-input {
          border-color: rgba(165, 128, 34, 0.45) !important;
          background: rgba(255, 255, 255, 0.88) !important;
          color: #302a1e !important;
          box-shadow: inset 0 1px 3px rgba(54, 43, 20, 0.06) !important;
        }
        html:not(.dark) #navbar.halm-home-header #header-search-input::placeholder {
          color: #777163 !important;
        }
        html:not(.dark) #navbar.halm-home-header #category-nav-btn {
          border-color: rgba(165, 128, 34, 0.48) !important;
          background: rgba(255, 255, 255, 0.72) !important;
          color: #765a10 !important;
        }
        html:not(.dark) #navbar.halm-home-header #category-nav-btn:hover {
          background: #f8f0d9 !important;
        }
        html:not(.dark) #navbar.halm-home-header .category-dropdown {
          border-color: rgba(165, 128, 34, 0.32);
          background: linear-gradient(145deg, #fffefa, #f8f3e8);
          color: #302a1e;
          box-shadow: 0 16px 38px rgba(54, 43, 20, 0.18);
        }
        html:not(.dark) #navbar.halm-home-header .category-dropdown-heading {
          border-color: rgba(165, 128, 34, 0.2);
          color: #8a6812;
        }
        html:not(.dark) #navbar.halm-home-header .category-dropdown-item {
          color: #383326;
        }
        html:not(.dark) #navbar.halm-home-header #header-content-wrapper .category-dropdown-item:hover,
        html:not(.dark) #navbar.halm-home-header #header-content-wrapper .category-dropdown-item:focus-visible {
          background: rgba(165, 128, 34, 0.1) !important;
          color: #765a10 !important;
        }
        html:not(.dark) #navbar.halm-home-header #header-content-wrapper .category-dropdown-item i {
          color: #8a6812 !important;
        }
        html:not(.dark) #navbar.halm-home-header .avatar-dropdown {
          border-color: rgba(165, 128, 34, 0.28);
          background: linear-gradient(145deg, #fffefa, #f8f3e8);
          color: #302a1e;
          box-shadow: 0 16px 38px rgba(54, 43, 20, 0.16);
        }
        html:not(.dark) #navbar.halm-home-header #header-content-wrapper .avatar-dropdown-item {
          color: #383326 !important;
        }
        html:not(.dark) #navbar.halm-home-header #header-content-wrapper .avatar-dropdown-item:hover,
        html:not(.dark) #navbar.halm-home-header #header-content-wrapper .avatar-dropdown-item:focus-visible {
          background: rgba(165, 128, 34, 0.1) !important;
          color: #765a10 !important;
        }
        html:not(.dark) #navbar.halm-home-header #header-content-wrapper .avatar-dropdown-logout {
          color: #be123c !important;
        }
        html:not(.dark) #navbar.halm-home-header #header-content-wrapper .avatar-dropdown-logout:hover {
          background: rgba(225, 29, 72, 0.08) !important;
          color: #9f1239 !important;
        }
        html:not(.dark) #navbar.halm-home-header #header-content-wrapper .vietnam-flag-icon {
          background: #da251d !important;
          color: #ffde00 !important;
        }
        html:not(.dark) #navbar.halm-home-header #header-content-wrapper .vietnam-flag-star {
          color: #ffde00 !important;
        }
        @media (max-width: 1023px) {
          #navbar.halm-home-header .header-search-area { max-width: none; }
        }
        @media (max-width: 639px) {
          #navbar.halm-home-header .header-desktop-search { display: none; }
        }
      `}</style>
      <nav id="navbar" className="halm-home-header header-transition font-nunito fixed top-0 z-50 w-full border-b py-4">
        <div id="airplane-stage-layer" className="pointer-events-none fixed inset-0 z-[1] overflow-hidden" aria-hidden="true">
          <canvas id="airplane-effects-canvas"></canvas>
        </div>
        <div id="header-content-wrapper" className="relative z-20 mx-auto flex min-h-14 w-full items-center justify-between gap-3 px-4 sm:px-6 lg:px-8 2xl:px-12">
          <a href="/trangchu" className="group flex shrink-0 items-center gap-2.5" aria-label="HALM BOOK Homepage">
            <img src={HEADER_LOGO} alt="Halm Book mascot" className="h-12 w-12 object-contain transition-transform duration-300 group-hover:scale-105 sm:h-[52px] sm:w-[52px]" />
            <span className="font-nunito text-2xl font-black tracking-tight text-[#f4f2ec] transition-colors group-hover:text-[#D4AF37] sm:text-[27px]">HALM BOOK</span>
          </a>

          <div className="hidden min-w-0 flex-1 items-center gap-4 px-3 lg:flex lg:px-6 2xl:px-8">
            <div className="group/cat relative shrink-0">
              <button id="category-nav-btn" type="button" className="flex h-12 items-center justify-center gap-2 rounded-[18px] border px-4 text-[#D6B64C] transition-all" aria-label="Danh mục sách" title="Danh mục sách">
                <i className="ph-bold ph-squares-four text-base"></i>
                <span className="hidden text-sm font-bold md:inline">Danh Mục</span>
                <i className="ph-bold ph-caret-down text-[10px]"></i>
              </button>
              <div className="category-dropdown absolute left-0 top-full z-50 mt-2 hidden w-72 rounded-2xl border p-2.5 text-xs shadow-xl group-hover/cat:block group-focus-within/cat:block">
                <div className="category-dropdown-heading mb-1 border-b px-3 py-2 text-[10px] font-extrabold uppercase tracking-[0.16em]">Tuyển Tập Tri Thức</div>
                {[
                  ["trending-section", "Sách Thịnh Hành", "ph-trend-up"],
                  ["children-section", "Thế Giới Tuổi Thơ", "ph-sparkle"],
                  ["literature-section", "Văn Học & Nghệ Thuật", "ph-book-open"],
                  ["selfgrowth-section", "Phát Triển Bản Thân", "ph-compass"],
                  ["science-section", "Khoa Học & Công Nghệ", "ph-atom"],
                  ["business-section", "Kinh Tế & Quản Trị", "ph-chart-line"],
                ].map(([id, label, icon]) => (
                  <a key={id} href={sectionHref(id)} className="category-dropdown-item flex items-center gap-3 rounded-xl px-3 py-2.5 font-semibold transition-colors">
                    <i className={`ph-bold ${icon} text-sm text-[#85817A]`}></i>{label}
                  </a>
                ))}
              </div>
            </div>

            <div id="search-container" className="header-search-area relative w-full min-w-0 flex-1">
              <form id="search-form" onSubmit={handleSearch} className="relative flex w-full items-center">
                <i className="ph-bold ph-magnifying-glass pointer-events-none absolute left-4 text-sm text-[#D4AF37]"></i>
                <input id="header-search-input" type="text" value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Tìm kiếm tác phẩm, tác giả hoặc chủ đề..." className="header-desktop-search w-full rounded-[20px] border py-1.5 pl-11 pr-10 text-xs outline-none transition sm:h-11 sm:py-2" />
                <button id="clear-search-btn" type="button" onClick={() => setSearchText("")} className={`absolute right-3 rounded-full text-[#85817A] hover:text-[#D4AF37] ${searchText ? "" : "hidden"}`} aria-label="Xóa nội dung tìm kiếm"><i className="ph-bold ph-x"></i></button>
              </form>
              <div id="search-dropdown" className="absolute left-0 right-0 top-full z-50 mt-2 hidden max-h-80 overflow-y-auto rounded-xl border border-[#D4AF37]/50 bg-[#1B1B18] p-2 text-[#F4F2EC] shadow-xl"></div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
            <a href={sectionHref("trending-section")} className="home-header-control hidden h-11 items-center gap-2 rounded-[18px] px-4 text-sm font-bold transition-colors lg:inline-flex">
              <i className="ph-bold ph-crown text-base"></i><span>Ưu Đãi</span><span className="rounded bg-[#D4AF37]/20 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide">Hot</span>
            </a>
            <button type="button" onClick={() => onOpenChatbot?.("Tôi muốn chia sẻ hoặc tải sách lên HALM BOOK.")} className="home-header-control hidden h-11 w-14 items-center justify-center rounded-[18px] text-lg transition-all lg:inline-flex" title="Chia sẻ sách" aria-label="Chia sẻ sách">
              <i className="ph-bold ph-cloud-arrow-up"></i>
            </button>
            <button type="button" onClick={() => navigate("/giohang")} className="home-header-control relative hidden h-11 w-11 items-center justify-center rounded-full text-xl transition-colors lg:inline-flex" title="Giỏ hàng" aria-label="Giỏ hàng">
              <i className="ph-bold ph-shopping-cart"></i>
              {cartCount > 0 && <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#8B3038] px-1 text-[10px] font-bold leading-none text-white">{cartCount}</span>}
            </button>
            <button id="theme-toggle" type="button" onClick={isHomePage ? undefined : toggleTheme} className="home-header-control hidden h-11 w-11 items-center justify-center rounded-full text-lg transition-colors lg:inline-flex" title="Đổi chế độ sáng/tối" aria-label="Đổi giao diện sáng/tối">
              <i id="theme-icon" className={`ph-bold ${isDark ? "ph-sun" : "ph-sun"} text-lg`}></i>
            </button>
            <button
              type="button"
              id="airplane-animation-btn"
              onClick={handleFlagAnimation}
              className="home-header-control hidden h-11 w-11 items-center justify-center rounded-full text-lg transition-colors lg:inline-flex"
              title="Hiệu ứng máy bay kéo cờ Việt Nam"
              aria-label="Hiệu ứng máy bay kéo cờ Việt Nam"
            >
              <span className="vietnam-flag-icon flex h-[22px] w-[30px] items-center justify-center rounded-[2px] text-[15px] leading-none"><span className="vietnam-flag-star">★</span></span>
            </button>
            <div id="avatar-menu-wrapper" className="relative hidden items-center lg:flex">
              <button id="avatar-menu-button" type="button" onClick={() => setIsAccountMenuOpen((current) => !current)} className="home-header-control flex h-11 items-center gap-2 rounded-full px-2.5 transition-colors" aria-label="Mở menu tài khoản" aria-expanded={isAccountMenuOpen}>
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[#D6B64C] bg-gradient-to-br from-[#F2DCA0] to-[#DBB867] text-[#654321] shadow-inner"><i className="ph-fill ph-user text-xl"></i></span>
                <i id="avatar-caret-icon" className="ph-bold ph-caret-down text-xs transition-transform"></i>
              </button>
              <div id="avatar-dropdown-menu" className={`avatar-dropdown ${isAccountMenuOpen ? "" : "hidden"} absolute right-0 top-full z-50 mt-3 w-72 rounded-2xl border p-2.5 text-xs`}>
                <Link to="/canhan" onClick={() => setIsAccountMenuOpen(false)} className="avatar-dropdown-item flex items-center gap-2 rounded-xl px-3 py-2.5 font-semibold transition-colors"><i className="ph-bold ph-user-circle text-base"></i>Thông tin cá nhân</Link>
                <Link to="/tusachcn" onClick={() => setIsAccountMenuOpen(false)} className="avatar-dropdown-item flex items-center gap-2 rounded-xl px-3 py-2.5 font-semibold transition-colors"><i className="ph-bold ph-books text-base"></i>Tủ sách của tôi</Link>
                <Link to="/hang" onClick={() => setIsAccountMenuOpen(false)} className="avatar-dropdown-item flex items-center gap-2 rounded-xl px-3 py-2.5 font-semibold transition-colors"><i className="ph-bold ph-trophy text-base"></i>Hạng thành viên</Link>
                <label className="avatar-dropdown-item flex cursor-pointer items-center justify-between rounded-xl px-3 py-2.5 font-semibold transition-colors">
                  <span className="flex items-center gap-2"><i className="ph-bold ph-arrows-out-line-vertical text-base"></i>Hiệu ứng lướt</span>
                  <input id="header-autoscroll-switch" type="checkbox" checked={autoScroll} onChange={handleAutoScrollChange} className="accent-[#8B4A3C]" />
                </label>
                <button type="button" onClick={() => { setIsAccountMenuOpen(false); onOpenChatbot?.("Tôi cần hỗ trợ từ HALM BOOK."); }} className="avatar-dropdown-item flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left font-semibold transition-colors"><i className="ph-bold ph-sparkle text-base"></i>Trợ lý HALM BOOK</button>
                <button type="button" onClick={handleLogout} className="avatar-dropdown-logout flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left font-semibold transition-colors"><i className="ph-bold ph-sign-out text-base"></i>Đăng xuất</button>
              </div>
            </div>
            <button id="mobile-menu-btn" type="button" onClick={() => setIsMobileMenuOpen((current) => !current)} className="home-header-control flex h-9 w-9 items-center justify-center rounded-full text-[#D6B64C] transition-colors lg:hidden" aria-label="Mở menu di động">
              <i className={`ph-bold ${isMobileMenuOpen ? "ph-x" : "ph-list"} text-xl`}></i>
            </button>
          </div>
        </div>

        <div id="mobile-drawer" className={`${isMobileMenuOpen ? "" : "hidden"} relative z-20 mt-3 space-y-3 border-t border-[#D4AF37]/40 bg-[#191916] px-5 py-4 text-[#F4F2EC] lg:hidden`}>
          <form onSubmit={handleSearch} className="relative">
            <input id="mobile-search-input" value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Tìm kiếm tác phẩm, tác giả..." className="w-full rounded-full border border-[#D4AF37]/70 bg-[#111210] py-2 pl-4 pr-10 text-xs text-[#F4F2EC] outline-none" />
            <button type="button" onClick={handleSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#D4AF37]" aria-label="Tìm kiếm"><i className="ph-bold ph-magnifying-glass"></i></button>
          </form>
          <nav className="grid grid-cols-2 gap-2 text-xs font-bold text-[#F4F2EC]" aria-label="Điều hướng di động">
            {SECTIONS.map(([id, label]) => <a key={id} href={sectionHref(id)} onClick={() => setIsMobileMenuOpen(false)} className="rounded-lg px-2 py-2 hover:bg-[#D4AF37]/10 hover:text-[#D4AF37]">{label}</a>)}
            <Link to="/canhan" onClick={() => setIsMobileMenuOpen(false)} className="rounded-lg px-2 py-2 hover:bg-[#D4AF37]/10 hover:text-[#D4AF37]">Cá nhân</Link>
            <Link to="/tusachcn" onClick={() => setIsMobileMenuOpen(false)} className="rounded-lg px-2 py-2 hover:bg-[#D4AF37]/10 hover:text-[#D4AF37]">Tủ sách</Link>
            <Link to="/hang" onClick={() => setIsMobileMenuOpen(false)} className="rounded-lg px-2 py-2 hover:bg-[#D4AF37]/10 hover:text-[#D4AF37]">Hội viên</Link>
            <button type="button" onClick={() => { setIsMobileMenuOpen(false); handleFlagAnimation(); }} className="flex items-center gap-2 rounded-lg px-2 py-2 text-left hover:bg-[#D4AF37]/10 hover:text-[#D4AF37]"><span className="vietnam-flag-icon flex h-4 w-6 items-center justify-center rounded-[2px]"><span className="vietnam-flag-star text-[11px] leading-none">★</span></span>Hiệu ứng máy bay kéo cờ</button>
            <button type="button" onClick={() => onOpenChatbot?.("Xin chào, tôi cần hỗ trợ.")} className="rounded-lg px-2 py-2 text-left text-[#D6B64C]">Trợ lý AI</button>
          </nav>
          <div className="flex gap-2 border-t border-[#D4AF37]/30 pt-3">
            <button type="button" onClick={toggleTheme} className="home-header-control flex h-10 flex-1 items-center justify-center gap-2 rounded-xl text-xs font-semibold text-[#D6B64C]"><i className="ph-bold ph-sun"></i>Giao diện</button>
            <button type="button" onClick={handleLogout} className="home-header-control flex h-10 flex-1 items-center justify-center gap-2 rounded-xl text-xs font-semibold text-[#D6B64C]"><i className="ph-bold ph-sign-out"></i>Đăng xuất</button>
          </div>
          <label className="flex items-center justify-between border-t border-[#D4AF37]/30 pt-3 text-xs font-semibold text-[#F4F2EC]">
            Hiệu ứng lướt
            <input id="mobile-autoscroll-switch" type="checkbox" checked={autoScroll} onChange={handleAutoScrollChange} className="accent-[#D4AF37]" />
          </label>
        </div>
      </nav>
    </>
  );
}

function UserFooter({ onOpenChatbot }) {
  return (
    <footer className="relative z-10 border-t border-[#E6E1D8] bg-[#FAF8F5] py-12 font-nunito text-[#242321] transition-colors dark:border-[#2C2E29] dark:bg-[#111210] dark:text-[#EDE9DF]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-[#8B4A3C]/40 via-[#D4AF37]/50 to-[#8B4A3C]/40"></div>
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4 lg:gap-10">
          <section className="space-y-4">
            <a href="/trangchu" className="flex items-center gap-2.5">
              <img src={logo} alt="Halm Book Logo" className="h-9 w-9 object-contain" />
              <span className="text-2xl font-black tracking-tight text-[#8B4A3C] dark:text-[#EDE9DF]">HALM BOOK</span>
            </a>
            <p className="inline-flex items-center gap-1.5 rounded-full border border-[#D4AF37]/50 bg-[#D4AF37]/15 px-3 py-1 text-xs font-semibold text-[#8B4A3C] dark:border-[#E5A93C]/40 dark:bg-[#E5A93C]/10 dark:text-[#E5A93C]">
              <i className="ph-bold ph-book-open"></i>Không gian Đọc Sách & Tri Thức Độc Bản
            </p>
            <div className="space-y-2.5 pt-1 text-sm font-medium text-[#5A564F] dark:text-[#EDE9DF]/90">
              <div className="flex items-center gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#D4AF37] bg-[#D4AF37]/15 text-[#8B4A3C] dark:border-[#E5A93C] dark:bg-[#E5A93C]/10 dark:text-[#E5A93C]"><i className="ph-bold ph-phone"></i></span><a href="tel:0909090909" className={FOOTER_LINK_CLASS}>0909.090.909</a></div>
              <div className="flex items-center gap-3 break-all"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#D4AF37] bg-[#D4AF37]/15 text-[#8B4A3C] dark:border-[#E5A93C] dark:bg-[#E5A93C]/10 dark:text-[#E5A93C]"><i className="ph-bold ph-envelope-simple"></i></span><a href="mailto:HalmBook@gmail.com" className={FOOTER_LINK_CLASS}>HalmBook@gmail.com</a></div>
              <div className="flex items-center gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#D4AF37] bg-[#D4AF37]/15 text-[#8B4A3C] dark:border-[#E5A93C] dark:bg-[#E5A93C]/10 dark:text-[#E5A93C]"><i className="ph-bold ph-map-pin"></i></span><span>03 Quang Trung, TP. Đà Nẵng</span></div>
            </div>
            <div className="flex max-w-[260px] items-center gap-2.5 rounded-2xl border border-[#D4AF37]/40 bg-white p-2.5 shadow-sm dark:border-[#E5A93C]/30 dark:bg-[#181916]">
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=HALMBookApp" alt="Mã QR tải ứng dụng" className="h-16 w-16 rounded-xl object-contain" loading="lazy" />
              <div className="text-xs"><div className="font-bold">Ứng dụng HALM BOOK</div><div className="mt-0.5 text-[11px] text-[#85817A] dark:text-[#E5A93C]">Quét tải app iOS & Android</div></div>
            </div>
          </section>
          <section className="lg:pl-4">
            <h2 className="mb-4 border-b border-[#E6E1D8] pb-2 text-sm font-extrabold uppercase tracking-wider text-[#8B4A3C] dark:border-[#2C2E29] dark:text-[#D4AF37]">Thông tin</h2>
            <ul className="space-y-2.5 text-sm font-medium text-[#5A564F] dark:text-[#EDE9DF]/80">
              <li><a href="/trangchu#about-section" className={FOOTER_LINK_CLASS}>› Giới thiệu</a></li>
              <li><button type="button" onClick={() => onOpenChatbot?.("Tôi muốn liên hệ hỗ trợ độc giả")} className={FOOTER_LINK_CLASS}>› Liên hệ</button></li>
              <li><a href="#license" className={FOOTER_LINK_CLASS}>› Giấy phép hoạt động</a></li>
              <li><a href="#privacy" className={FOOTER_LINK_CLASS}>› Chính sách bảo mật</a></li>
              <li><a href="#terms" className={FOOTER_LINK_CLASS}>› Điều khoản dịch vụ</a></li>
            </ul>
          </section>
          <section>
            <h2 className="mb-4 border-b border-[#E6E1D8] pb-2 text-sm font-extrabold uppercase tracking-wider text-[#8B4A3C] dark:border-[#2C2E29] dark:text-[#D4AF37]">Hỗ trợ & Độc giả</h2>
            <ul className="space-y-2.5 text-sm font-medium text-[#5A564F] dark:text-[#EDE9DF]/80">
              <li><Link to="/tusachcn" className={FOOTER_LINK_CLASS}>› Tủ Sách Cá Nhân</Link></li>
              <li><Link to="/hang" className={FOOTER_LINK_CLASS}>› Gói & Hạng Thành Viên</Link></li>
              <li><Link to="/canhan" className={FOOTER_LINK_CLASS}>› Quản Lý Tài Khoản</Link></li>
              <li><button type="button" onClick={() => onOpenChatbot?.("Hỗ trợ tài khoản")} className={FOOTER_LINK_CLASS}>› Trợ Giúp AI Trực Tuyến</button></li>
            </ul>
          </section>
          <section>
            <h2 className="mb-4 border-b border-[#E6E1D8] pb-2 text-sm font-extrabold uppercase tracking-wider text-[#8B4A3C] dark:border-[#2C2E29] dark:text-[#D4AF37]">Đối tác xuất bản</h2>
            <div className="flex min-h-24 flex-wrap items-center justify-start gap-4">
              <img src="/logo.png" alt="HALM Publishing" className="max-h-12 max-w-28 object-contain opacity-85 dark:brightness-125" />
              <img src="/logo.png" alt="NXB Kim Đồng" className="max-h-12 max-w-28 object-contain opacity-85 dark:brightness-125" />
              <img src="/logo.png" alt="Nhà Xuất Bản Trẻ" className="max-h-12 max-w-28 object-contain opacity-85 dark:brightness-125" />
            </div>
          </section>
        </div>
        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-[#E6E1D8] pt-5 text-xs text-[#85817A] dark:border-[#2C2E29] dark:text-[#96938B] sm:flex-row">
          <p>© 2026 HALM BOOK. Tất cả bản quyền được bảo lưu.</p>
          <div className="flex items-center gap-6"><a href="#terms" className={FOOTER_LINK_CLASS}>Điều khoản sử dụng</a><a href="#privacy" className={FOOTER_LINK_CLASS}>Chính sách bảo mật</a><a href="#copyright" className={FOOTER_LINK_CLASS}>Bản quyền tác phẩm</a></div>
        </div>
      </div>
    </footer>
  );
}

export default function UserLayout({ children, className = "", onOpenChatbot, onThemeChange }) {
  return (
    <div className={`paper-grain relative flex min-h-screen flex-col ${className}`}>
      <UserHeader onOpenChatbot={onOpenChatbot} onThemeChange={onThemeChange} />
      {children}
      <UserFooter onOpenChatbot={onOpenChatbot} />
    </div>
  );
}
