import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "@/assets/images/logo.png";
import { clearAuthSession, isTokenValid } from "@/services/authToken";
import axiosInstance from "@/services/axiosClient";
import { getCurrentCustomer } from "@/services/customerService";
import { triggerAirplaneBannerAnimation } from "./helicopterAnimation";
import { isDarkMode, applyTheme } from "@/utils/theme";
import AvatarWithFrame from "@/components/common/AvatarWithFrame";
import UploadBookModal from "@/components/common/UploadBookModal";
import AuthModal, { openAuthModal } from "@/components/common/AuthModal";
import { getTierInfo, getTierBadgeClass } from "@/utils/tierUtils";
import { getSiteSettings } from "@/services/bannerService";
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from "@/services/userFeatureService";

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
  const [isDark, setIsDark] = useState(() => isDarkMode());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(() => isTokenValid());
  const [autoScroll, setAutoScroll] = useState(() => (
    localStorage.getItem("halmbook_auto_chapter_scroll") !== "false"
  ));
  const [searchText, setSearchText] = useState("");
  const [cartCount, setCartCount] = useState(0);
  const [customer, setCustomer] = useState(() => {
    try {
      if (!isTokenValid()) return null;
      const cached = localStorage.getItem("halm_customer_cache");
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [notifications, setNotifications] = useState([]);
  const [unreadNotiCount, setUnreadNotiCount] = useState(0);
  const [isNotiOpen, setIsNotiOpen] = useState(false);
  const [searchHistory, setSearchHistory] = useState(() => {
    try {
      const saved = localStorage.getItem("halm_search_history");
      return saved ? JSON.parse(saved) : ["Nguyễn Nhật Ánh", "Kỹ năng sống", "Dế Mèn"];
    } catch {
      return ["Nguyễn Nhật Ánh", "Kỹ năng sống"];
    }
  });
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [liveResults, setLiveResults] = useState([]);
  const [allBooksCache, setAllBooksCache] = useState([]);
  const searchContainerRef = useRef(null);
  const isHomePage = location.pathname === "/" || location.pathname === "/trangchu";
  const sectionHref = (id) => isHomePage ? `#${id}` : `/#${id}`;

  useEffect(() => {
    const domIsDark = document.documentElement.classList.contains("dark");
    if (domIsDark !== isDark) {
      applyTheme(isDark);
    }
    onThemeChange?.(isDark);
    if (isDark) {
      window.initializeStarryBackground?.();
      window.initStars?.();
    }
  }, [isDark, onThemeChange]);

  // Đồng bộ trạng thái phiên đăng nhập và token còn hạn hay không
  useEffect(() => {
    const checkAuthStatus = () => {
      const valid = isTokenValid();
      setIsLoggedIn(valid);
      if (!valid) {
        setCustomer(null);
        setCartCount(0);
        try {
          localStorage.removeItem("halm_customer_cache");
        } catch (_) {}
      } else {
        setCustomer((prev) => {
          if (prev) return prev;
          try {
            const cached = localStorage.getItem("halm_customer_cache");
            return cached ? JSON.parse(cached) : null;
          } catch {
            return null;
          }
        });
      }
    };

    const handleAuthSuccess = (event) => {
      setIsLoggedIn(true);
      if (event?.detail && (event.detail.customerName || event.detail.potatoBalance !== undefined)) {
        setCustomer(event.detail);
        try {
          localStorage.setItem("halm_customer_cache", JSON.stringify(event.detail));
        } catch (_) {}
      }
    };

    window.addEventListener("halm-auth-expired", checkAuthStatus);
    window.addEventListener("halm-auth-success", handleAuthSuccess);
    window.addEventListener("storage", checkAuthStatus);
    window.addEventListener("focus", checkAuthStatus);

    return () => {
      window.removeEventListener("halm-auth-expired", checkAuthStatus);
      window.removeEventListener("halm-auth-success", handleAuthSuccess);
      window.removeEventListener("storage", checkAuthStatus);
      window.removeEventListener("focus", checkAuthStatus);
    };
  }, []);

  useEffect(() => {
    const handleGlobalThemeChange = (e) => {
      if (typeof e.detail?.isDark === "boolean") {
        setIsDark((curr) => (curr !== e.detail.isDark ? e.detail.isDark : curr));
      }
    };
    const handleOpenUpload = () => {
      if (!isTokenValid()) {
        openAuthModal({ mode: 'login', message: 'Vui lòng đăng nhập để tải lên và lưu trữ sách cá nhân!' });
        return;
      }
      setIsUploadModalOpen(true);
    };
    window.addEventListener("halm-theme-change", handleGlobalThemeChange);
    window.addEventListener("halm-open-upload-modal", handleOpenUpload);
    return () => {
      window.removeEventListener("halm-theme-change", handleGlobalThemeChange);
      window.removeEventListener("halm-open-upload-modal", handleOpenUpload);
    };
  }, [location.pathname, location.search, navigate]);

  useEffect(() => {
    if (location.state?.openLoginModal && !isLoggedIn) {
      const message = location.state?.loginMessage || 'Vui lòng đăng nhập để tiếp tục!';
      openAuthModal({ mode: 'login', message });
    }
  }, [location.state, isLoggedIn]);

  useEffect(() => {
    const navbar = document.getElementById("navbar");
    const handleScroll = () => navbar?.classList.toggle("scrolled", window.scrollY > 25);
    const updateNavbarHeight = () => {
      if (navbar) {
        const h = Math.round(navbar.getBoundingClientRect().height || navbar.offsetHeight);
        if (h > 0) {
          document.documentElement.style.setProperty("--navbar-height", `${h}px`);
        }
      }
    };
    updateNavbarHeight();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", updateNavbarHeight);
    let resizeObserver;
    if (navbar && typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(updateNavbarHeight);
      resizeObserver.observe(navbar);
    }
    handleScroll();
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", updateNavbarHeight);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    if (!isLoggedIn) {
      setCartCount(0);
      return;
    }
    const fetchCartCount = () => {
      axiosInstance.get("/api/home/cart/items")
        .then(({ data }) => {
          if (isMounted && Array.isArray(data)) setCartCount(data.length);
        })
        .catch(() => {
          if (isMounted) setCartCount(0);
        });
    };
    fetchCartCount();
    window.addEventListener("halm-cart-updated", fetchCartCount);
    return () => {
      isMounted = false;
      window.removeEventListener("halm-cart-updated", fetchCartCount);
    };
  }, [location.pathname, isLoggedIn]);

  useEffect(() => {
    let isMounted = true;
    if (!isLoggedIn) {
      setCustomer(null);
      return;
    }

    const fetchCustomer = () => {
      getCurrentCustomer()
        .then((data) => {
          if (isMounted && data) {
            setCustomer(data);
            try {
              localStorage.setItem("halm_customer_cache", JSON.stringify(data));
            } catch (_) {}
          }
        })
        .catch((error) => {
          if (isMounted) {
            console.warn("Không thể tải thông tin tài khoản trên header:", error);
            if (!isTokenValid()) {
              setCustomer(null);
            }
          }
        });
    };

    fetchCustomer();

    // Lắng nghe sự kiện cập nhật số dư khoai thời gian thực
    const handlePotatoUpdated = (event) => {
      if (event?.detail) {
        setCustomer((prev) => {
          if (!prev) return prev;
          const updated = {
            ...prev,
            potatoBalance: event.detail.potatoBalance ?? event.detail.balance ?? prev?.potatoBalance,
          };
          try {
            localStorage.setItem("halm_customer_cache", JSON.stringify(updated));
          } catch (_) {}
          return updated;
        });
      } else {
        fetchCustomer();
      }
    };

    window.addEventListener("halm-potato-updated", handlePotatoUpdated);

    return () => {
      isMounted = false;
      window.removeEventListener("halm-potato-updated", handlePotatoUpdated);
    };
  }, [isLoggedIn]);

  useEffect(() => {
    const closeAccountMenu = (event) => {
      if (!event.target.closest("#avatar-menu-wrapper")) {
        setIsAccountMenuOpen(false);
      }
      if (!event.target.closest("#noti-menu-wrapper")) {
        setIsNotiOpen(false);
      }
    };
    document.addEventListener("click", closeAccountMenu);
    return () => document.removeEventListener("click", closeAccountMenu);
  }, []);

  // Tải danh sách thông báo & tự động làm mới
  useEffect(() => {
    if (!isLoggedIn) {
      setNotifications([]);
      setUnreadNotiCount(0);
      return;
    }
    const fetchNotis = () => {
      getNotifications().then((data) => {
        if (data) {
          setNotifications(data.notifications || []);
          setUnreadNotiCount(data.unreadCount || 0);
        }
      }).catch(() => {});
    };
    fetchNotis();
    const interval = setInterval(fetchNotis, 25000);
    window.addEventListener("halm-notification-refresh", fetchNotis);
    return () => {
      clearInterval(interval);
      window.removeEventListener("halm-notification-refresh", fetchNotis);
    };
  }, [isLoggedIn]);

  const handleNotiItemClick = async (noti) => {
    if (!noti.isRead) {
      await markNotificationAsRead(noti.notificationId);
      setNotifications(prev => prev.map(n => n.notificationId === noti.notificationId ? { ...n, isRead: true } : n));
      setUnreadNotiCount(c => Math.max(0, c - 1));
    }
    setIsNotiOpen(false);
    if (noti.link) {
      navigate(noti.link);
    }
  };

  const handleMarkAllNotisRead = async () => {
    await markAllNotificationsAsRead();
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadNotiCount(0);
  };

  const handleLogout = () => {
    clearAuthSession();
    setIsLoggedIn(false);
    setCustomer(null);
    setCartCount(0);
    try {
      localStorage.removeItem("halm_customer_cache");
    } catch (_) {}
    window.location.assign("/");
  };

  useEffect(() => {
    let isMounted = true;
    const fetchBooksForSearch = async () => {
      try {
        const res = await axiosInstance.get("/api/home/books", {
          params: { page: 0, size: 60 }
        });
        const raw = Array.isArray(res.data) ? res.data : (res.data?.content || res.data?.data || []);
        if (isMounted && Array.isArray(raw)) {
          setAllBooksCache(raw.map((b, idx) => ({
            id: b.book_id || b.id || `b-${idx}`,
            title: b.bookName || b.title || "Tác phẩm",
            author: b.author || "HALM BOOK",
            img: b.img_url || b.img || "/logo.png",
            rating: b.rating || "5.0"
          })));
        }
      } catch (err) {
        // fallback
      }
    };
    fetchBooksForSearch();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    const val = searchText.trim().toLowerCase();
    if (!val) {
      setLiveResults([]);
      return;
    }
    const matches = allBooksCache.filter(b =>
      (b.title || "").toLowerCase().includes(val) ||
      (b.author || "").toLowerCase().includes(val)
    ).slice(0, 5);
    setLiveResults(matches);
  }, [searchText, allBooksCache]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const saveSearchTerm = (term) => {
    const trimmed = (term || "").trim();
    if (!trimmed) return;
    setSearchHistory(prev => {
      const filtered = prev.filter(item => item.toLowerCase() !== trimmed.toLowerCase());
      const next = [trimmed, ...filtered].slice(0, 6);
      try {
        localStorage.setItem("halm_search_history", JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  const removeHistoryItem = (term, e) => {
    if (e) e.stopPropagation();
    setSearchHistory(prev => {
      const next = prev.filter(item => item !== term);
      try {
        localStorage.setItem("halm_search_history", JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  const clearAllHistory = (e) => {
    if (e) e.stopPropagation();
    setSearchHistory([]);
    try {
      localStorage.removeItem("halm_search_history");
    } catch (e) {
      console.error(e);
    }
  };

  const executeSearch = (query) => {
    const q = (query !== undefined ? query : searchText).trim();
    if (!q) return;
    saveSearchTerm(q);
    setIsSearchOpen(false);

    // Ghi nhận hoàn thành nhiệm vụ hằng ngày: Tìm kiếm sách
    const todayKey = new Date().toISOString().slice(0, 10);
    try {
      localStorage.setItem(`halm_daily_action_search_${todayKey}`, 'true');
    } catch {}
    window.dispatchEvent(new CustomEvent('halm-daily-task-completed', { detail: { task: 'search' } }));

    if (isHomePage) {
      const input = document.getElementById("header-search-input");
      if (input) {
        input.value = q;
        input.dispatchEvent(new Event("input", { bubbles: true }));
      }
      const trendSec = document.getElementById("trending-section");
      if (trendSec) trendSec.scrollIntoView({ behavior: "smooth" });
      if (typeof window.renderTrendingShelf === "function") {
        window.renderTrendingShelf("all");
      }
    } else {
      navigate(`/?search=${encodeURIComponent(q)}#trending-section`);
    }
  };

  const handleSearch = (event) => {
    if (event && event.preventDefault) event.preventDefault();
    executeSearch(searchText);
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
    const next = !isDark;
    setIsDark(next);
    applyTheme(next);
  };

  const handleNavClick = (e, targetPath, isPrivate = false) => {
    let path = targetPath;
    if (typeof e === "string") {
      path = e;
    }
    setIsAccountMenuOpen(false);
    setIsMobileMenuOpen(false);

    if (isPrivate && !isTokenValid()) {
      openAuthModal({ mode: 'login', message: 'Vui lòng đăng nhập để truy cập tính năng này!' });
      return;
    }

    if (path) {
      navigate(path);
    }
  };

  const handleOpenUploadModal = () => {
    if (!isTokenValid()) {
      openAuthModal({ mode: 'login', message: 'Vui lòng đăng nhập để tải lên và lưu trữ sách cá nhân!' });
      return;
    }
    setIsUploadModalOpen(true);
  };

  const handleCartClick = () => {
    if (!isTokenValid()) {
      openAuthModal({ mode: 'login', message: 'Vui lòng đăng nhập để xem và quản lý giỏ hàng!' });
      return;
    }
    navigate("/giohang");
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
          padding-top: 0.875rem !important;
          padding-bottom: 0.875rem !important;
          min-height: 72px;
          transition: background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
        }
        #navbar.halm-home-header.scrolled {
          padding-top: 0.875rem !important;
          padding-bottom: 0.875rem !important;
          box-shadow: 0 8px 24px -4px rgba(0, 0, 0, 0.75) !important;
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
          border-color: rgba(165, 128, 34, 0.32) !important;
          background: #FAF6ED !important;
          color: #5C430B !important;
          box-shadow: none !important;
        }
        html:not(.dark) #navbar.halm-home-header .home-header-control:hover {
          border-color: rgba(165, 128, 34, 0.6) !important;
          background: #F1E9D7 !important;
          color: #3D2D07 !important;
        }
        html:not(.dark) #navbar.halm-home-header #header-search-input {
          border-color: rgba(165, 128, 34, 0.35) !important;
          background: #FAF6ED !important;
          color: #302a1e !important;
          box-shadow: none !important;
        }
        html:not(.dark) #navbar.halm-home-header #header-search-input::placeholder {
          color: #777163 !important;
        }
        html:not(.dark) #navbar.halm-home-header #category-nav-btn {
          border-color: rgba(165, 128, 34, 0.35) !important;
          background: #FAF6ED !important;
          color: #5C430B !important;
          box-shadow: none !important;
        }
        html:not(.dark) #navbar.halm-home-header #category-nav-btn:hover {
          background: #F1E9D7 !important;
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
        html:not(.dark) #navbar.halm-home-header #search-dropdown {
          border-color: rgba(165, 128, 34, 0.38) !important;
          background: linear-gradient(145deg, #fffefa, #f8f3e8) !important;
          color: #302a1e !important;
          box-shadow: 0 16px 38px rgba(54, 43, 20, 0.18) !important;
        }
        html:not(.dark) #navbar.halm-home-header #search-dropdown a {
          color: #302a1e !important;
        }
        html:not(.dark) #navbar.halm-home-header #search-dropdown a:hover {
          background: rgba(165, 128, 34, 0.1) !important;
        }
        html:not(.dark) #navbar.halm-home-header #search-dropdown a div:first-of-type {
          color: #302a1e !important;
        }
        html:not(.dark) #navbar.halm-home-header #search-dropdown a div:last-of-type,
        html:not(.dark) #navbar.halm-home-header #search-dropdown > div {
          color: #777163 !important;
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
        html:not(.dark) #mobile-drawer {
          background-color: #FAF7EE !important;
          color: #302a1e !important;
          border-color: rgba(165, 128, 34, 0.35) !important;
        }
        html:not(.dark) #mobile-drawer a,
        html:not(.dark) #mobile-drawer button,
        html:not(.dark) #mobile-drawer span {
          color: #302a1e !important;
        }
        html:not(.dark) #mobile-drawer a:hover,
        html:not(.dark) #mobile-drawer button:hover {
          color: #8a6812 !important;
        }
        html:not(.dark) #mobile-drawer div[class*="bg-gradient-to-br"] {
          background: linear-gradient(135deg, #FFFDF8, #F3ECDC) !important;
          border-color: rgba(165, 128, 34, 0.3) !important;
        }
        html:not(.dark) #mobile-drawer h4 {
          color: #302a1e !important;
        }
        html:not(.dark) #mobile-drawer p {
          color: #6d6656 !important;
        }
        @media (max-width: 1023px) {
          #navbar.halm-home-header .header-search-area { max-width: none; }
        }
        @media (max-width: 639px) {
          #navbar.halm-home-header .header-desktop-search { display: none; }
        }

        /* Đảm bảo Footer luôn đồng bộ Dark Mode 100% trên toàn bộ các màn hình */
        html.dark footer {
          background-color: #111210 !important;
          border-color: #2C2E29 !important;
          color: #EDE9DF !important;
        }
        html.dark footer section h2 {
          color: #D4AF37 !important;
          border-color: #2C2E29 !important;
        }
        html.dark footer ul,
        html.dark footer p,
        html.dark footer .space-y-2\.5 {
          color: #96938B !important;
        }
        html.dark footer a:hover,
        html.dark footer button:hover {
          color: #D4AF37 !important;
        }
        html.dark footer .bg-white {
          background-color: #181916 !important;
          border-color: rgba(212, 175, 55, 0.3) !important;
        }
        html.dark footer .border-t {
          border-color: #2C2E29 !important;
        }
      `}</style>
      <nav id="navbar" className="halm-home-header header-transition font-nunito fixed top-0 z-50 w-full border-b py-4">
        <div id="airplane-stage-layer" className="pointer-events-none fixed inset-0 z-[1] overflow-hidden" aria-hidden="true">
          <canvas id="airplane-effects-canvas"></canvas>
        </div>
        <div id="header-content-wrapper" className="relative z-20 mx-auto flex min-h-14 w-full items-center justify-between gap-3 px-4 sm:px-6 lg:px-8 2xl:px-12">
          <Link to="/" className="group flex shrink-0 items-center gap-2.5" aria-label="HALM BOOK Homepage">
            <img src={HEADER_LOGO} alt="Halm Book mascot" className="h-12 w-12 object-contain transition-transform duration-300 group-hover:scale-105 sm:h-[52px] sm:w-[52px]" />
            <span className="font-nunito text-2xl font-black tracking-tight text-[#f4f2ec] transition-colors group-hover:text-[#D4AF37] sm:text-[27px]">HALM BOOK</span>
          </Link>

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

            <div id="search-container" ref={searchContainerRef} className="header-search-area relative w-full min-w-0 flex-1">
              <form id="search-form" onSubmit={handleSearch} className="relative flex w-full items-center">
                <i className="ph-bold ph-magnifying-glass pointer-events-none absolute left-4 text-sm text-[#D4AF37]"></i>
                <input
                  id="header-search-input"
                  type="text"
                  value={searchText}
                  onChange={(event) => {
                    setSearchText(event.target.value);
                    setIsSearchOpen(true);
                  }}
                  onFocus={() => setIsSearchOpen(true)}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                  placeholder="Tìm kiếm tác phẩm, tác giả hoặc chủ đề..."
                  className="header-desktop-search w-full rounded-[20px] border py-1.5 pl-11 pr-10 text-xs outline-none transition sm:h-11 sm:py-2"
                />
                <button
                  id="clear-search-btn"
                  type="button"
                  onClick={() => {
                    setSearchText("");
                    setIsSearchOpen(true);
                  }}
                  className={`absolute right-3 rounded-full text-[#85817A] hover:text-[#D4AF37] ${searchText ? "" : "hidden"}`}
                  aria-label="Xóa nội dung tìm kiếm"
                >
                  <i className="ph-bold ph-x"></i>
                </button>
              </form>

              {/* Dynamic Universal Search Dropdown */}
              {isSearchOpen && (
                <div id="search-dropdown" className="absolute left-0 right-0 top-full z-50 mt-2 max-h-96 overflow-y-auto rounded-xl border border-[#D4AF37]/50 bg-[#1B1B18] p-3 text-[#F4F2EC] shadow-2xl">
                  {!searchText.trim() ? (
                    <div>
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 text-[11px] font-bold text-[#D4AF37] uppercase tracking-wider">
                        <span className="flex items-center gap-1.5">
                          <i className="ph-bold ph-clock-counter-clockwise text-xs"></i>
                          Lịch Sử Tìm Kiếm
                        </span>
                        {searchHistory.length > 0 && (
                          <button
                            type="button"
                            onClick={clearAllHistory}
                            className="text-[10px] text-stone-400 hover:text-rose-400 font-semibold transition-colors"
                          >
                            Xóa tất cả
                          </button>
                        )}
                      </div>

                      {searchHistory.length === 0 ? (
                        <div className="py-3 text-center text-xs text-stone-400 font-medium">
                          Chưa có lịch sử tìm kiếm gần đây.
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {searchHistory.map((term, idx) => (
                            <div
                              key={idx}
                              onClick={() => {
                                setSearchText(term);
                                executeSearch(term);
                              }}
                              className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-white/10 dark:hover:bg-white/5 cursor-pointer text-xs text-stone-200 transition-colors group"
                            >
                              <span className="flex items-center gap-2 truncate">
                                <i className="ph-bold ph-magnifying-glass text-xs text-[#D4AF37]/80 group-hover:text-[#D4AF37]"></i>
                                <span className="truncate">{term}</span>
                              </span>
                              <button
                                type="button"
                                onClick={(e) => removeHistoryItem(term, e)}
                                className="w-5 h-5 flex items-center justify-center rounded-full text-stone-400 hover:text-rose-400 hover:bg-white/10 text-xs shrink-0 transition-colors"
                                title="Xóa từ khóa này"
                              >
                                <i className="ph-bold ph-x"></i>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <div className="pb-2 mb-2 border-b border-white/10 text-[11px] font-bold text-[#D4AF37] uppercase tracking-wider flex items-center justify-between">
                        <span>Gợi Ý Tác Phẩm</span>
                        <span className="text-[10px] text-stone-400 font-normal">Nhấn Enter để tìm tất cả</span>
                      </div>

                      {liveResults.length === 0 ? (
                        <div className="py-4 text-center text-xs text-stone-400">
                          Không tìm thấy tác phẩm phù hợp với "{searchText}".
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          {liveResults.map((book) => (
                            <div
                              key={book.id}
                              onClick={() => {
                                saveSearchTerm(book.title);
                                setIsSearchOpen(false);
                                navigate(`/chitietsach/${book.id}`);
                              }}
                              className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/10 cursor-pointer transition-colors group"
                            >
                              <img
                                src={book.img}
                                alt={book.title}
                                className="w-8 h-12 object-cover rounded shadow-sm shrink-0"
                                onError={(e) => { e.currentTarget.src = "/logo.png"; }}
                              />
                              <div className="min-w-0 flex-1">
                                <h4 className="font-display text-xs font-bold text-stone-100 group-hover:text-[#D4AF37] truncate transition-colors">
                                  {book.title}
                                </h4>
                                <p className="text-[11px] text-stone-400 truncate">
                                  {book.author}
                                </p>
                              </div>
                              <span className="text-[10px] font-bold text-amber-400 flex items-center gap-0.5 shrink-0 px-1.5 py-0.5 rounded bg-black/40">
                                <i className="ph-fill ph-star text-xs"></i>
                                {book.rating}
                              </span>
                            </div>
                          ))}

                          <button
                            type="button"
                            onClick={() => executeSearch(searchText)}
                            className="w-full mt-2 pt-2 border-t border-white/10 py-1.5 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold text-[#D4AF37] text-center transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <i className="ph-bold ph-magnifying-glass"></i>
                            <span>Xem tất cả kết quả cho "{searchText}"</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
            <Link
              to="/uudai"
              className={`home-header-control hidden h-11 items-center gap-2 rounded-[18px] px-4 text-sm font-bold transition-colors lg:inline-flex ${
                location.pathname === "/uudai"
                  ? "bg-[#C28807] text-[#111210] font-black shadow-md"
                  : ""
              }`}
            >
              <i className="ph-bold ph-crown text-base"></i>
              <span>Ưu Đãi</span>
              <span className="rounded bg-[#D4AF37]/20 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide">
                Hot
              </span>
            </Link>
            <button
              type="button"
              onClick={handleOpenUploadModal}
              className="home-header-control hidden h-11 w-14 items-center justify-center rounded-[18px] text-lg transition-all lg:inline-flex cursor-pointer relative z-30"
              title="Tải lên sách cá nhân (PDF, EPUB)"
              aria-label="Tải lên sách cá nhân"
            >
              <i className="ph-bold ph-cloud-arrow-up text-xl text-[#D4AF37]"></i>
            </button>
            <button type="button" onClick={handleCartClick} className="home-header-control relative hidden h-11 w-11 items-center justify-center rounded-full text-xl transition-colors lg:inline-flex" title="Giỏ hàng" aria-label="Giỏ hàng">
              <i className="ph-bold ph-shopping-cart"></i>
              {cartCount > 0 && <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#8B3038] px-1 text-[10px] font-bold leading-none text-white">{cartCount}</span>}
            </button>

            {/* Notification Center */}
            <div id="noti-menu-wrapper" className="relative hidden lg:inline-flex">
              <button
                type="button"
                onClick={() => {
                  if (!isLoggedIn) {
                    openAuthModal({ mode: 'login', message: 'Vui lòng đăng nhập để xem thông báo!' });
                    return;
                  }
                  setIsNotiOpen(prev => !prev);
                }}
                className="home-header-control relative h-11 w-11 items-center justify-center rounded-full text-xl transition-colors inline-flex cursor-pointer"
                title="Thông báo"
                aria-label="Thông báo"
              >
                <i className={`ph-bold ph-bell ${unreadNotiCount > 0 ? 'text-[#D4AF37]' : ''}`}></i>
                {unreadNotiCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold leading-none text-white animate-pulse">
                    {unreadNotiCount > 9 ? '9+' : unreadNotiCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {isNotiOpen && (
                <div className="avatar-dropdown absolute right-0 top-full z-50 mt-3 w-80 sm:w-96 rounded-2xl border p-3 text-xs shadow-2xl backdrop-blur-md">
                  <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-[#D4AF37]/25">
                    <div className="flex items-center gap-2">
                      <i className="ph-bold ph-bell-ringing text-sm text-[#D4AF37]"></i>
                      <span className="font-display font-bold text-sm text-stone-900 dark:text-[#eee9dd]">Thông Báo</span>
                      {unreadNotiCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 text-[10px] font-black">
                          {unreadNotiCount} mới
                        </span>
                      )}
                    </div>
                    {unreadNotiCount > 0 && (
                      <button
                        type="button"
                        onClick={handleMarkAllNotisRead}
                        className="text-[11px] text-[#D4AF37] hover:underline cursor-pointer"
                      >
                        Đã đọc tất cả
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-xs text-stone-400">
                        <i className="ph-bold ph-bell-slash text-2xl block mb-1 opacity-50"></i>
                        <span>Bạn chưa có thông báo mới nào.</span>
                      </div>
                    ) : (
                      notifications.map((noti) => (
                        <div
                          key={noti.notificationId}
                          onClick={() => handleNotiItemClick(noti)}
                          className={`p-2.5 rounded-xl transition-all cursor-pointer flex items-start gap-2.5 ${
                            noti.isRead
                              ? 'bg-transparent hover:bg-white/5 opacity-75'
                              : 'bg-[#D4AF37]/10 hover:bg-[#D4AF37]/15 border border-[#D4AF37]/20'
                          }`}
                        >
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                            noti.type === 'TOPUP' ? 'bg-emerald-500/15 text-emerald-500' :
                            noti.type === 'RENT' ? 'bg-indigo-500/15 text-indigo-400' :
                            noti.type === 'REWARD' ? 'bg-amber-500/15 text-amber-400' :
                            'bg-[#D4AF37]/15 text-[#D4AF37]'
                          }`}>
                            <i className={`ph-bold ${
                              noti.type === 'TOPUP' ? 'ph-wallet' :
                              noti.type === 'RENT' ? 'ph-book-open' :
                              noti.type === 'REWARD' ? 'ph-gift' :
                              'ph-info'
                            } text-sm`}></i>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1">
                              <h5 className="font-display font-bold text-xs text-stone-900 dark:text-[#f4f2ec] line-clamp-1">
                                {noti.title}
                              </h5>
                              {!noti.isRead && (
                                <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
                              )}
                            </div>
                            <p className="font-editorial-body text-[11px] text-stone-600 dark:text-stone-300 mt-0.5 line-clamp-2 leading-relaxed">
                              {noti.message}
                            </p>
                            <span className="text-[10px] text-stone-400 mt-1 block">
                              {noti.createdAt ? new Date(noti.createdAt).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : 'Vừa xong'}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <button id="theme-toggle" type="button" onClick={toggleTheme} className="home-header-control hidden h-11 w-11 items-center justify-center rounded-full text-lg transition-colors lg:inline-flex" title="Đổi chế độ sáng/tối" aria-label="Đổi giao diện sáng/tối">
              <i id="theme-icon" className={`ph-bold ${isDark ? "ph-sun" : "ph-moon"} text-lg`}></i>
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
              {isLoggedIn ? (
                <>
                  <button id="avatar-menu-button" type="button" onClick={() => setIsAccountMenuOpen((current) => !current)} className="home-header-control flex h-11 items-center gap-2 rounded-full px-2 transition-colors" aria-label="Mở menu tài khoản" aria-expanded={isAccountMenuOpen}>
                    <AvatarWithFrame
                      avatarSrc={customer?.avatar || customer?.avatarUrl}
                      name={customer?.customerName || "Độc giả"}
                      tier={customer?.membershipTier}
                      potatoBalance={customer?.potatoBalance ?? 0}
                      size="sm"
                    />
                    <i id="avatar-caret-icon" className="ph-bold ph-caret-down text-xs transition-transform"></i>
                  </button>
                  <div id="avatar-dropdown-menu" className={`avatar-dropdown ${isAccountMenuOpen ? "" : "hidden"} absolute right-0 top-full z-50 mt-3 w-72 rounded-2xl border p-2.5 text-xs`}>
                    <div className="px-3 py-2 border-b border-[#D4AF37]/20 mb-1.5 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-sm text-[#eee9dd] truncate max-w-[150px]">{customer?.customerName || 'Độc Giả HALM'}</div>
                        <div className="text-[11px] text-[#96938B] flex items-center gap-1">
                          <span>{getTierInfo(customer?.membershipTier, customer?.potatoBalance).name}</span>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${getTierBadgeClass(customer?.membershipTier, customer?.potatoBalance)}`}>
                        -{getTierInfo(customer?.membershipTier, customer?.potatoBalance).discount}% Phí
                      </span>
                    </div>
                    <Link to="/canhan?tab=wallet" onClick={() => handleNavClick("/canhan?tab=wallet")} className="avatar-dropdown-item flex items-center justify-between rounded-xl px-3 py-2.5 font-bold text-[#D4AF37] transition-colors"><span className="flex items-center gap-2"><i className="ph-fill ph-wallet text-base"></i>Ví Khoai Tây</span><span className="rounded-full bg-[#D4AF37]/20 px-2 py-0.5 text-[11px] font-black text-[#D4AF37]">{(customer?.potatoBalance ?? 0).toLocaleString()} 🥔</span></Link>
                    <Link to="/canhan?tab=history" onClick={() => handleNavClick("/canhan?tab=history")} className="avatar-dropdown-item flex items-center gap-2 rounded-xl px-3 py-2.5 font-semibold transition-colors"><i className="ph-bold ph-clock-counter-clockwise text-base text-amber-500"></i>Lịch sử giao dịch</Link>
                    <Link to="/nhiemvu" onClick={() => handleNavClick("/nhiemvu")} className="avatar-dropdown-item flex items-center justify-between rounded-xl px-3 py-2.5 font-semibold transition-colors"><span className="flex items-center gap-2"><i className="ph-bold ph-target text-base text-amber-500"></i>Nhiệm vụ & Điểm danh</span><span className="rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">Streak 🔥</span></Link>
                    <Link to="/canhan" onClick={() => handleNavClick("/canhan")} className="avatar-dropdown-item flex items-center gap-2 rounded-xl px-3 py-2.5 font-semibold transition-colors"><i className="ph-bold ph-user-circle text-base"></i>Thông tin cá nhân</Link>
                    <Link to="/tusachcn" onClick={() => handleNavClick("/tusachcn")} className="avatar-dropdown-item flex items-center gap-2 rounded-xl px-3 py-2.5 font-semibold transition-colors"><i className="ph-bold ph-books text-base"></i>Tủ sách của tôi</Link>
                    <Link to="/hang" onClick={() => handleNavClick("/hang")} className="avatar-dropdown-item flex items-center gap-2 rounded-xl px-3 py-2.5 font-semibold transition-colors"><i className="ph-bold ph-trophy text-base"></i>Hạng thành viên</Link>
                    <Link to="/canhan?tab=support" onClick={() => handleNavClick("/canhan?tab=support")} className="avatar-dropdown-item flex items-center gap-2 rounded-xl px-3 py-2.5 font-semibold transition-colors"><i className="ph-bold ph-headset text-base text-amber-500"></i>Khiếu nại & Hỗ trợ</Link>
                    <button type="button" onClick={() => { setIsAccountMenuOpen(false); onOpenChatbot?.("Tôi cần hỗ trợ từ HALM BOOK."); }} className="avatar-dropdown-item flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left font-semibold transition-colors"><i className="ph-bold ph-sparkle text-base"></i>Trợ lý HALM BOOK</button>
                    <button type="button" onClick={handleLogout} className="avatar-dropdown-logout flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left font-semibold transition-colors"><i className="ph-bold ph-sign-out text-base"></i>Đăng xuất</button>
                  </div>
                </>
              ) : (
                <>
                  <button
                    id="guest-avatar-button"
                    type="button"
                    onClick={() => setIsAccountMenuOpen((current) => !current)}
                    className="home-header-control flex h-11 items-center gap-2 rounded-full px-3 transition-all hover:border-[#D4AF37] cursor-pointer"
                    aria-label="Khách vãng lai - Đăng nhập hoặc Đăng ký"
                    aria-expanded={isAccountMenuOpen}
                    title="Khách vãng lai - Bấm để đăng nhập"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/50 shadow-inner">
                      <i className="ph-bold ph-user text-sm"></i>
                    </div>
                    <span className="text-xs font-bold text-[#f4f2ec]">Khách</span>
                    <i id="avatar-caret-icon" className="ph-bold ph-caret-down text-[10px] text-[#D4AF37] transition-transform"></i>
                  </button>
                  <div
                    id="guest-dropdown-menu"
                    className={`avatar-dropdown ${isAccountMenuOpen ? "" : "hidden"} absolute right-0 top-full z-50 mt-3 w-72 rounded-2xl border p-3 text-xs shadow-2xl backdrop-blur-md`}
                  >
                    <div className="border-b border-[#D4AF37]/25 pb-3 mb-2.5">
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                          <i className="ph-bold ph-user-circle text-lg"></i>
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-stone-900 dark:text-[#eee9dd]">Khách Vãng Lai</h4>
                          <p className="text-[11px] text-stone-500 dark:text-[#96938B]">Chưa kích hoạt tài khoản</p>
                        </div>
                      </div>
                      <p className="text-[11px] leading-relaxed text-stone-600 dark:text-[#c7c2b4]">
                        Đăng nhập ngay để thuê sách, đọc hàng ngàn ấn phẩm và nhận khoai tây miễn phí!
                      </p>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setIsAccountMenuOpen(false);
                          openAuthModal({ mode: 'login' });
                        }}
                        className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#b38f28] text-[#111210] font-black text-xs shadow-md hover:brightness-110 transition-all cursor-pointer"
                      >
                        <i className="ph-bold ph-sign-in text-sm"></i>
                        <span>Đăng Nhập Ngay</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsAccountMenuOpen(false);
                          openAuthModal({ mode: 'register' });
                        }}
                        className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-[#D4AF37]/50 text-[#D4AF37] hover:bg-[#D4AF37]/10 font-bold text-xs transition-colors cursor-pointer"
                      >
                        <i className="ph-bold ph-user-plus text-sm"></i>
                        <span>Đăng Ký Tài Khoản</span>
                      </button>
                    </div>

                    <div className="border-t border-[#D4AF37]/20 mt-2.5 pt-2 space-y-1">
                      <Link
                        to="/hang"
                        onClick={() => handleNavClick("/hang")}
                        className="avatar-dropdown-item flex items-center gap-2 rounded-xl px-2.5 py-2 font-semibold transition-colors"
                      >
                        <i className="ph-bold ph-trophy text-sm text-[#D4AF37]"></i>
                        <span>Quyền lợi các hạng thành viên</span>
                      </Link>
                      <Link
                        to="/uudai"
                        onClick={() => handleNavClick("/uudai")}
                        className="avatar-dropdown-item flex items-center gap-2 rounded-xl px-2.5 py-2 font-semibold transition-colors"
                      >
                        <i className="ph-bold ph-crown text-sm text-amber-500"></i>
                        <span>Kho ưu đãi và khuyến mãi</span>
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAccountMenuOpen(false);
                          onOpenChatbot?.("Xin chào! Tôi là khách vãng lai, cần hỗ trợ hướng dẫn sử dụng.");
                        }}
                        className="avatar-dropdown-item flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left font-semibold transition-colors cursor-pointer"
                      >
                        <i className="ph-bold ph-sparkle text-sm text-[#D4AF37]"></i>
                        <span>Trợ lý AI HALM BOOK</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
            <button id="mobile-menu-btn" type="button" onClick={() => setIsMobileMenuOpen((current) => !current)} className="home-header-control flex h-9 w-9 items-center justify-center rounded-full text-[#D6B64C] transition-colors lg:hidden" aria-label="Mở menu di động">
              <i className={`ph-bold ${isMobileMenuOpen ? "ph-x" : "ph-list"} text-xl`}></i>
            </button>
          </div>
        </div>

        <div id="mobile-drawer" className={`${isMobileMenuOpen ? "" : "hidden"} relative z-20 mt-3 space-y-3 border-t border-[#D4AF37]/40 bg-[#191916] px-5 py-4 text-[#F4F2EC] lg:hidden`}>
          {!isLoggedIn && (
            <div className="p-3.5 rounded-2xl border border-[#D4AF37]/40 bg-gradient-to-br from-[#22211c] to-[#151613] shadow-md mb-2">
              <div className="flex items-center gap-2.5 mb-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/50 text-[#D4AF37]">
                  <i className="ph-bold ph-user text-sm"></i>
                </div>
                <div>
                  <h4 className="text-xs font-black text-[#F4F2EC]">Khách Vãng Lai</h4>
                  <p className="text-[10px] text-[#A8A59C]">Đăng nhập để thuê & đọc toàn bộ ấn phẩm</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    openAuthModal({ mode: 'login' });
                  }}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#b38f28] text-[#111210] font-black text-xs hover:brightness-110 shadow-sm transition-all cursor-pointer"
                >
                  <i className="ph-bold ph-sign-in"></i>
                  <span>Đăng Nhập</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    openAuthModal({ mode: 'register' });
                  }}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-[#D4AF37]/60 text-[#D4AF37] font-bold text-xs hover:bg-[#D4AF37]/10 transition-colors cursor-pointer"
                >
                  <i className="ph-bold ph-user-plus"></i>
                  <span>Đăng Ký</span>
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSearch} className="relative">
            <input
              id="mobile-search-input"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              placeholder="Tìm kiếm tác phẩm, tác giả..."
              className="w-full rounded-full border border-[#D4AF37]/70 bg-[#111210] py-2 pl-4 pr-10 text-xs text-[#F4F2EC] outline-none"
            />
            <button type="button" onClick={handleSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#D4AF37]" aria-label="Tìm kiếm"><i className="ph-bold ph-magnifying-glass"></i></button>
          </form>
          <nav className="grid grid-cols-2 gap-2 text-xs font-bold text-[#F4F2EC]" aria-label="Điều hướng di động">
            <button
              type="button"
              onClick={() => handleNavClick("/canhan?tab=wallet", undefined, true)}
              className="col-span-2 rounded-lg px-2 py-2 font-bold text-[#D4AF37] hover:bg-[#D4AF37]/10 flex items-center justify-between border border-[#D4AF37]/40 bg-[#111210] text-left cursor-pointer"
            >
              <span>Ví Khoai Tây</span>
              <span>{isLoggedIn ? `${(customer?.potatoBalance ?? 0).toLocaleString()} 🥔` : 'Đăng nhập để xem'}</span>
            </button>
            <button
              type="button"
              onClick={() => handleNavClick("/canhan?tab=history", undefined, true)}
              className="col-span-2 rounded-lg px-2 py-2 font-bold text-amber-500 hover:bg-amber-500/10 flex items-center justify-between border border-amber-500/30 bg-[#111210] text-left cursor-pointer"
            >
              <span>Lịch Sử Giao Dịch</span>
              <i className="ph-bold ph-clock-counter-clockwise text-sm"></i>
            </button>
            <button
              type="button"
              onClick={() => handleNavClick("/nhiemvu", undefined, true)}
              className="col-span-2 rounded-lg px-2 py-2 font-bold text-amber-500 hover:bg-amber-500/10 flex items-center justify-between border border-amber-500/30 bg-[#111210] text-left cursor-pointer"
            >
              <span>Nhiệm vụ & Điểm danh</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Streak 🔥</span>
            </button>
            <Link to="/uudai" onClick={() => handleNavClick("/uudai")} className={`col-span-2 rounded-lg px-2 py-2 font-bold hover:bg-[#D4AF37]/10 flex items-center justify-between border border-[#D4AF37]/40 ${location.pathname === "/uudai" ? "bg-[#C28807] text-[#111210]" : "text-[#D4AF37] bg-[#111210]"}`}><span className="flex items-center gap-1.5"><i className="ph-bold ph-crown text-sm"></i>Ưu Đãi Đặc Quyền</span><span className="rounded bg-[#D4AF37]/20 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide">Hot 🔥</span></Link>
            <button
              type="button"
              onClick={() => { setIsMobileMenuOpen(false); handleOpenUploadModal(); }}
              className="col-span-2 rounded-lg px-2 py-2 font-bold text-[#D4AF37] hover:bg-[#D4AF37]/10 flex items-center justify-between border border-[#D4AF37]/40 bg-[#111210] text-left cursor-pointer"
            >
              <span className="flex items-center gap-2"><i className="ph-bold ph-cloud-arrow-up text-base"></i>Tải Lên Sách Cá Nhân</span>
              <span className="rounded bg-[#D4AF37]/20 px-1.5 py-0.5 text-[10px] font-bold text-[#D4AF37]">PDF / EPUB</span>
            </button>
            {SECTIONS.map(([id, label]) => <a key={id} href={sectionHref(id)} onClick={() => setIsMobileMenuOpen(false)} className="rounded-lg px-2 py-2 hover:bg-[#D4AF37]/10 hover:text-[#D4AF37]">{label}</a>)}
            <button
              type="button"
              onClick={() => handleNavClick("/canhan", undefined, true)}
              className="rounded-lg px-2 py-2 text-left hover:bg-[#D4AF37]/10 hover:text-[#D4AF37] cursor-pointer"
            >
              Cá nhân
            </button>
            <button
              type="button"
              onClick={() => handleNavClick("/tusachcn", undefined, true)}
              className="rounded-lg px-2 py-2 text-left hover:bg-[#D4AF37]/10 hover:text-[#D4AF37] cursor-pointer"
            >
              Tủ sách
            </button>
            <Link to="/hang" onClick={() => handleNavClick("/hang")} className="rounded-lg px-2 py-2 hover:bg-[#D4AF37]/10 hover:text-[#D4AF37]">Hội viên</Link>
            <Link to="/canhan?tab=support" onClick={() => handleNavClick("/canhan?tab=support")} className="rounded-lg px-2 py-2 text-left hover:bg-[#D4AF37]/10 hover:text-[#D4AF37] flex items-center gap-2"><i className="ph-bold ph-headset text-base"></i>Hỗ trợ & Khiếu nại</Link>
            <button type="button" onClick={() => { setIsMobileMenuOpen(false); handleFlagAnimation(); }} className="flex items-center gap-2 rounded-lg px-2 py-2 text-left hover:bg-[#D4AF37]/10 hover:text-[#D4AF37]"><span className="vietnam-flag-icon flex h-4 w-6 items-center justify-center rounded-[2px]"><span className="vietnam-flag-star text-[11px] leading-none">★</span></span>Hiệu ứng máy bay kéo cờ</button>
            <button type="button" onClick={() => onOpenChatbot?.("Xin chào, tôi cần hỗ trợ.")} className="rounded-lg px-2 py-2 text-left text-[#D6B64C]">Trợ lý AI</button>
          </nav>
          <div className="flex gap-2 border-t border-[#D4AF37]/30 pt-3">
            <button type="button" onClick={toggleTheme} className="home-header-control flex h-10 flex-1 items-center justify-center gap-2 rounded-xl text-xs font-semibold text-[#D6B64C]"><i className={`ph-bold ${isDark ? "ph-sun" : "ph-moon"}`}></i>Giao diện</button>
            {isLoggedIn ? (
              <button type="button" onClick={handleLogout} className="home-header-control flex h-10 flex-1 items-center justify-center gap-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300"><i className="ph-bold ph-sign-out"></i>Đăng xuất</button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  openAuthModal({ mode: 'login' });
                }}
                className="home-header-control flex h-10 flex-1 items-center justify-center gap-2 rounded-xl text-xs font-bold text-[#D4AF37] cursor-pointer"
              >
                <i className="ph-bold ph-sign-in"></i>
                <span>Đăng nhập</span>
              </button>
            )}
          </div>
        </div>
        <UploadBookModal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} />
      </nav>
    </>
  );
}

function UserFooter({ onOpenChatbot }) {
  const [settings, setSettings] = useState(() => getSiteSettings());

  useEffect(() => {
    const handleSettingsUpdated = (e) => {
      setSettings(e.detail?.settings || getSiteSettings());
    };
    window.addEventListener("halm-site-settings-updated", handleSettingsUpdated);
    return () => window.removeEventListener("halm-site-settings-updated", handleSettingsUpdated);
  }, []);

  return (
    <footer className="relative z-10 border-t border-[#E6E1D8] bg-[#FAF8F5] py-12 font-nunito text-[#242321] transition-colors dark:border-[#2C2E29] dark:bg-[#111210] dark:text-[#EDE9DF]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-[#8B4A3C]/40 via-[#D4AF37]/50 to-[#8B4A3C]/40"></div>
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4 lg:gap-10">
          <section className="space-y-4">
            <a href="/" className="flex items-center gap-2.5">
              <img src={logo} alt="Halm Book Logo" className="h-9 w-9 object-contain" />
              <span className="text-2xl font-black tracking-tight text-[#8B4A3C] dark:text-[#EDE9DF]">HALM BOOK</span>
            </a>
            <p className="inline-flex items-center gap-1.5 rounded-full border border-[#D4AF37]/50 bg-[#D4AF37]/15 px-3 py-1 text-xs font-semibold text-[#8B4A3C] dark:border-[#E5A93C]/40 dark:bg-[#E5A93C]/10 dark:text-[#E5A93C]">
              <i className="ph-bold ph-book-open"></i>{settings.slogan || "Không gian Đọc Sách & Tri Thức Độc Bản"}
            </p>
            <div className="space-y-2.5 pt-1 text-sm font-medium text-[#5A564F] dark:text-[#EDE9DF]/90">
              <div className="flex items-center gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#D4AF37] bg-[#D4AF37]/15 text-[#8B4A3C] dark:border-[#E5A93C] dark:bg-[#E5A93C]/10 dark:text-[#E5A93C]"><i className="ph-bold ph-phone"></i></span><a href={`tel:${settings.hotline || "0397409029"}`} className={FOOTER_LINK_CLASS}>{settings.hotline || "0397409029"}</a></div>
              <div className="flex items-center gap-3 break-all"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#D4AF37] bg-[#D4AF37]/15 text-[#8B4A3C] dark:border-[#E5A93C] dark:bg-[#E5A93C]/10 dark:text-[#E5A93C]"><i className="ph-bold ph-envelope-simple"></i></span><a href={`mailto:${settings.email || "support@halmbook.vn"}`} className={FOOTER_LINK_CLASS}>{settings.email || "support@halmbook.vn"}</a></div>
              <div className="flex items-center gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#D4AF37] bg-[#D4AF37]/15 text-[#8B4A3C] dark:border-[#E5A93C] dark:bg-[#E5A93C]/10 dark:text-[#E5A93C]"><i className="ph-bold ph-map-pin"></i></span><span>{settings.address || "03 Quang Trung, TP. Đà Nẵng"}</span></div>
            </div>
            <div className="flex max-w-[260px] items-center gap-2.5 rounded-2xl border border-[#D4AF37]/40 bg-white p-2.5 shadow-sm dark:border-[#E5A93C]/30 dark:bg-[#181916]">
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=HALMBookApp" alt="Mã QR tải ứng dụng" className="h-16 w-16 rounded-xl object-contain" loading="lazy" />
              <div className="text-xs"><div className="font-bold">Ứng dụng HALM BOOK</div><div className="mt-0.5 text-[11px] text-[#85817A] dark:text-[#E5A93C]">Quét tải app iOS & Android</div></div>
            </div>
          </section>
          <section className="lg:pl-4">
            <h2 className="mb-4 border-b border-[#E6E1D8] pb-2 text-sm font-extrabold uppercase tracking-wider text-[#8B4A3C] dark:border-[#2C2E29] dark:text-[#D4AF37]">Thông tin</h2>
            <ul className="space-y-2.5 text-sm font-medium text-[#5A564F] dark:text-[#EDE9DF]/80">
              <li><a href="/#about-section" className={FOOTER_LINK_CLASS}>› Giới thiệu</a></li>
              <li><button type="button" onClick={() => onOpenChatbot?.("Tôi muốn liên hệ hỗ trợ độc giả")} className={FOOTER_LINK_CLASS}>› Liên hệ</button></li>
              <li><a href="#license" className={FOOTER_LINK_CLASS}>› Giấy phép hoạt động</a></li>
              <li><a href="#privacy" className={FOOTER_LINK_CLASS}>› Chính sách bảo mật</a></li>
              <li><a href="#terms" className={FOOTER_LINK_CLASS}>› Điều khoản dịch vụ</a></li>
            </ul>
          </section>
          <section>
            <h2 className="mb-4 border-b border-[#E6E1D8] pb-2 text-sm font-extrabold uppercase tracking-wider text-[#8B4A3C] dark:border-[#2C2E29] dark:text-[#D4AF37]">Hỗ trợ & Độc giả</h2>
            <ul className="space-y-2.5 text-sm font-medium text-[#5A564F] dark:text-[#EDE9DF]/80">
              <li><Link to="/uudai" className={FOOTER_LINK_CLASS}>› Ưu Đãi Đặc Quyền</Link></li>
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
          <p>{settings.copyright || "© 2026 HALM BOOK. Tất cả bản quyền được bảo lưu."}</p>
          <div className="flex items-center gap-6"><a href="#terms" className={FOOTER_LINK_CLASS}>Điều khoản sử dụng</a><a href="#privacy" className={FOOTER_LINK_CLASS}>Chính sách bảo mật</a><a href="#copyright" className={FOOTER_LINK_CLASS}>Bản quyền tác phẩm</a></div>
        </div>
      </div>
    </footer>
  );
}

export default function UserLayout({ children, className = "", onOpenChatbot, onThemeChange }) {
  const handleOpenChat = (msg) => {
    if (typeof onOpenChatbot === 'function') {
      onOpenChatbot(msg);
    } else {
      window.dispatchEvent(new CustomEvent('halm-open-chatbot', { detail: { message: msg } }));
    }
  };

  return (
    <div className={`paper-grain relative flex min-h-screen flex-col ${className}`}>
      <UserHeader onOpenChatbot={handleOpenChat} onThemeChange={onThemeChange} />
      {children}
      <UserFooter onOpenChatbot={handleOpenChat} />
      <AuthModal />
    </div>
  );
}
