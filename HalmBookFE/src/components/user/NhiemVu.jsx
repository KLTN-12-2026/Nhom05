import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import UserLayout from './layout/UserLayout';
import StreakDiemDanh from './StreakDiemDanh';
import { getCurrentCustomer } from '@/services/customerService';
import { getCustomerBookshelf } from '@/services/orderService';
import { isDarkMode, applyTheme } from '@/utils/theme';
import { getTierInfo } from '@/utils/tierUtils';

const halmTailwindConfig = {
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
                paper: {
                    50: '#FAF8F5',
                    100: '#F5F2EB',
                    200: '#EAE5D9',
                    DEFAULT: '#F7F4EE',
                    surface: '#FFFEFA',
                    border: '#E3DDD0',
                },
                ink: {
                    50: '#F5F5F4',
                    300: '#A8A6A1',
                    muted: '#66645E',
                    DEFAULT: '#1E1F1D',
                    pure: '#111210',
                },
                wine: {
                    DEFAULT: '#8E3038',
                    light: '#A83B46',
                    dark: '#6F252C',
                },
                gold: {
                    DEFAULT: '#B8860B',
                    light: '#D4AF37',
                },
                night: {
                    bg: '#111210',
                    surface: '#181916',
                    card: '#20221E',
                    border: '#2C2E29',
                    text: '#EDE9DF',
                    muted: '#96938B',
                }
            }
        }
    }
};

const ASSETS = {
    fonts: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Open+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400;1,600&family=Roboto:wght@300;400;500;700;900&display=swap',
    bold: 'https://unpkg.com/@phosphor-icons/web@2.1.1/src/bold/style.css',
    regular: 'https://unpkg.com/@phosphor-icons/web@2.1.1/src/regular/style.css',
    fill: 'https://unpkg.com/@phosphor-icons/web@2.1.1/src/fill/style.css',
    duotone: 'https://unpkg.com/@phosphor-icons/web@2.1.1/src/duotone/style.css',
    tailwind: 'https://cdn.tailwindcss.com'
};



export default function NhiemVu() {
    const [customer, setCustomer] = useState(null);
    const [bookshelfCount, setBookshelfCount] = useState(0);
    const [isDark, setIsDark] = useState(() => isDarkMode());
    const [activeTab, setActiveTab] = useState('daily');
    const [toast, setToast] = useState({ title: '', message: '' });
    const [toastVisible, setToastVisible] = useState(false);
    const toastTimer = useRef(null);

    const showToast = (title, message) => {
        setToast({ title, message });
        setToastVisible(true);
        if (toastTimer.current) clearTimeout(toastTimer.current);
        toastTimer.current = setTimeout(() => setToastVisible(false), 3500);
    };

    const fetchCustomer = async () => {
        try {
            const data = await getCurrentCustomer();
            if (data) {
                setCustomer(data);
            }
        } catch (e) {
            console.error("Lỗi khi tải thông tin tài khoản:", e);
        }
    };

    const fetchBookshelfCount = async () => {
        try {
            const list = await getCustomerBookshelf();
            if (Array.isArray(list)) {
                setBookshelfCount(list.length);
            }
        } catch (e) {
            // silent fallback
        }
    };

    // Đảm bảo Font, Icon & Tailwind CDN luôn được nạp đầy đủ khi reload trực tiếp màn hình
    useEffect(() => {
        if (!document.querySelector('link[data-halm-fonts]')) {
            const l = document.createElement('link');
            l.rel = 'stylesheet';
            l.href = ASSETS.fonts;
            l.dataset.halmFonts = 'true';
            document.head.appendChild(l);
        }
        Object.entries({ bold: ASSETS.bold, regular: ASSETS.regular, fill: ASSETS.fill, duotone: ASSETS.duotone }).forEach(([k, href]) => {
            if (document.querySelector(`link[data-halm-icons="${k}"]`)) return;
            const l = document.createElement('link');
            l.rel = 'stylesheet';
            l.href = href;
            l.dataset.halmIcons = k;
            document.head.appendChild(l);
        });
        window.tailwind = window.tailwind || {};
        window.tailwind.config = halmTailwindConfig;
        if (!document.querySelector('script[src*="cdn.tailwindcss.com"]')) {
            const s = document.createElement('script');
            s.src = ASSETS.tailwind;
            s.async = true;
            document.head.appendChild(s);
        }
    }, []);

    useEffect(() => {
        window.scrollTo(0, 0);
        document.title = "HALM BOOK — Nhiệm Vụ Hằng Ngày & Điểm Danh Độc Giả";
        fetchCustomer();
        fetchBookshelfCount();

        const handlePotatoUpdated = (e) => {
            const newBal = e.detail?.potatoBalance;
            if (newBal !== undefined) {
                setCustomer(prev => prev ? { ...prev, potatoBalance: newBal } : prev);
            }
        };

        const handleGlobalThemeChange = (e) => {
            if (typeof e.detail?.isDark === 'boolean') {
                setIsDark(e.detail.isDark);
            }
        };

        window.addEventListener('halm-potato-updated', handlePotatoUpdated);
        window.addEventListener('halm-theme-change', handleGlobalThemeChange);

        return () => {
            window.removeEventListener('halm-potato-updated', handlePotatoUpdated);
            window.removeEventListener('halm-theme-change', handleGlobalThemeChange);
        };
    }, []);

    const tierInfo = getTierInfo(customer?.membershipTier);
    const potatoBalance = customer?.potatoBalance ?? 0;
    const streakDays = customer?.streakDays ?? 0;
    const customerName = customer?.customerName || customer?.name || 'Bạn đọc HALM';
    const customerInitial = customerName.charAt(0).toUpperCase();
    const avatarSrc = customer?.avatar || customer?.avatarUrl;
    const customerIdDisplay = customer?.customerId 
        ? `id#C${String(customer.customerId).replace(/^C/i, '').padStart(5, '0')}`
        : (customer?.customer_id 
            ? `id#C${String(customer.customer_id).replace(/^C/i, '').padStart(5, '0')}`
            : 'id#C00007');

    const DAILY_MISSIONS = [
        {
            id: 'm1',
            title: 'Điểm danh đọc sách hằng ngày',
            description: 'Đăng nhập vào HALM BOOK mỗi ngày để thắp lửa chuỗi đọc.',
            rewardPotato: 5,
            rewardXp: 20,
            icon: 'ph-calendar-check',
            iconColor: 'text-amber-500 bg-amber-500/10',
            currentProgress: 1,
            maxProgress: 1,
            isCompleted: true,
            actionLabel: 'Đã Điểm Danh',
            actionLink: null,
        },
        {
            id: 'm2',
            title: 'Đọc sách 30 phút trên trình đọc số',
            description: 'Duy trì thói quen đọc sách hàng ngày trên trình đọc số của HALM BOOK.',
            rewardPotato: 15,
            rewardXp: 50,
            icon: 'ph-book-open',
            iconColor: 'text-wine bg-wine/10 dark:text-gold dark:bg-gold/15',
            currentProgress: 15,
            maxProgress: 30,
            isCompleted: false,
            actionLabel: 'Đến Tủ Sách',
            actionLink: '/tusachcn',
        },
        {
            id: 'm3',
            title: 'Để lại cảm nhận hoặc đánh giá sách',
            description: 'Viết nhận xét chân thực cho cuốn sách bạn vừa đọc để chia sẻ cùng cộng đồng.',
            rewardPotato: 10,
            rewardXp: 30,
            icon: 'ph-chat-circle-dots',
            iconColor: 'text-blue-500 bg-blue-500/10',
            currentProgress: 0,
            maxProgress: 1,
            isCompleted: false,
            actionLabel: 'Khám Phá Sách',
            actionLink: '/trangchu#trending-section',
        },
        {
            id: 'm4',
            title: 'Thuê hoặc gia hạn 1 cuốn sách',
            description: 'Mượn thêm tác phẩm mới vào tủ sách cá nhân bằng Khoai Tây.',
            rewardPotato: 20,
            rewardXp: 60,
            icon: 'ph-shopping-bag',
            iconColor: 'text-emerald-600 bg-emerald-500/10',
            currentProgress: 0,
            maxProgress: 1,
            isCompleted: false,
            actionLabel: 'Thuê Sách Ngay',
            actionLink: '/trangchu#trending-section',
        },
        {
            id: 'm5',
            title: 'Tặng Khoai sẻ chia tri thức',
            description: 'Chuyển tặng Khoai Tây cho bạn bè cùng đọc sách.',
            rewardPotato: 5,
            rewardXp: 20,
            icon: 'ph-gift',
            iconColor: 'text-purple-500 bg-purple-500/10',
            currentProgress: 0,
            maxProgress: 1,
            isCompleted: false,
            actionLabel: 'Tặng Khoai',
            actionLink: '/canhan?tab=wallet',
        },
    ];

    const READER_MILESTONES = [
        {
            id: 'ms1',
            title: 'Thành tựu: Độc Giả Chăm Chỉ (Chuỗi 7 Ngày)',
            description: 'Hoàn thành chuỗi 7 ngày liên tiếp điểm danh đọc sách.',
            rewardPotato: 50,
            rewardXp: 150,
            currentProgress: Math.min(streakDays, 7),
            maxProgress: 7,
            icon: 'ph-fire',
            badge: 'Cột Mốc',
        },
        {
            id: 'ms2',
            title: 'Thành tựu: Tủ Sách Khởi Đầu (3 Cuốn)',
            description: 'Sở hữu ít nhất 3 tác phẩm trong Tủ Sách Cá Nhân.',
            rewardPotato: 30,
            rewardXp: 100,
            currentProgress: Math.min(bookshelfCount, 3),
            maxProgress: 3,
            icon: 'ph-books',
            badge: 'Tủ Sách',
        },
        {
            id: 'ms3',
            title: 'Thành tựu: Nhà Nghiên Cứu Sách (10 Ghi Chú)',
            description: 'Lưu lại 10 đoạn trích dẫn và ghi chú khi thưởng thức sách.',
            rewardPotato: 40,
            rewardXp: 120,
            currentProgress: 2,
            maxProgress: 10,
            icon: 'ph-note-pencil',
            badge: 'Tri Thức',
        },
        {
            id: 'ms4',
            title: 'Thành tựu: Đại Sứ HALM BOOK',
            description: 'Tích lũy tổng cộng 500 Khoai Tây từ nhiệm vụ và nạp.',
            rewardPotato: 100,
            rewardXp: 300,
            currentProgress: Math.min(potatoBalance, 500),
            maxProgress: 500,
            icon: 'ph-crown',
            badge: 'Huy Hiệu Vàng',
        },
    ];

    return (
        <>
            <style>{String.raw`
                :root {
                    --font-display: "Inter", sans-serif;
                    --font-ui: "Inter", sans-serif;
                    --font-metadata: "Roboto", sans-serif;
                    --font-editorial: "Open Sans", sans-serif;
                }
                .nhiem-vu-page {
                    font-family: var(--font-ui);
                    background-color: #F7F4EE;
                    color: #1E1F1D;
                    -webkit-font-smoothing: antialiased;
                }
                .dark .nhiem-vu-page {
                    background-color: #111210;
                    color: #EDE9DF;
                }
                .nhiem-vu-page [class~="bg-paper"] { background: #F7F4EE; }
                .nhiem-vu-page [class~="bg-paper-surface"] { background: #FFFEFA; }
                .nhiem-vu-page [class~="bg-paper-50"] { background: #FAF8F5; }
                .nhiem-vu-page [class~="bg-paper-100"] { background: #F5F2EB; }
                .nhiem-vu-page [class~="bg-paper-200"] { background: #EAE5D9; }
                .nhiem-vu-page [class~="bg-wine"] { background: #8E3038; }
                .nhiem-vu-page [class~="bg-gold"] { background: #B8860B; }
                .nhiem-vu-page [class~="bg-night-card"] { background: #20221E; }
                .nhiem-vu-page [class~="bg-night-surface"] { background: #181916; }
                .nhiem-vu-page [class~="text-ink"] { color: #1E1F1D; }
                .nhiem-vu-page [class~="text-ink-muted"] { color: #66645E; }
                .nhiem-vu-page [class~="text-wine"] { color: #8E3038; }
                .nhiem-vu-page [class~="text-gold"] { color: #B8860B; }
                .nhiem-vu-page [class~="border-paper-border"] { border-color: #E3DDD0; }
                .nhiem-vu-page [class~="border-night-border"] { border-color: #2C2E29; }
                .nhiem-vu-page [class~="potato-badge"] { background: rgb(184 134 11/.12); color: #B8860B; border: 1px solid rgb(184 134 11/.25); }

                html.dark .nhiem-vu-page [class~="dark:bg-night-card"] { background: #20221E; }
                html.dark .nhiem-vu-page [class~="dark:bg-night-surface"] { background: #181916; }
                html.dark .nhiem-vu-page [class~="dark:bg-gold"] { background: #B8860B; }
                html.dark .nhiem-vu-page [class~="dark:text-gold"] { color: #B8860B; }
                html.dark .nhiem-vu-page [class~="dark:text-night-text"] { color: #EDE9DF; }
                html.dark .nhiem-vu-page [class~="dark:text-night-muted"] { color: #96938B; }
                html.dark .nhiem-vu-page [class~="potato-badge"] { background: rgb(212 175 55/.15); color: #D4AF37; border-color: rgb(212 175 55/.3); }
            `}</style>

            <UserLayout className="nhiem-vu-page" onThemeChange={setIsDark}>
                {/* Toast Notification */}
                <div
                    id="toast-notification"
                    className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl bg-paper-surface dark:bg-night-card border border-wine/30 dark:border-gold/40 shadow-2xl text-ink dark:text-night-text transition-all duration-300 ${
                        toastVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
                    }`}
                >
                    <div className="w-8 h-8 rounded-full bg-wine/10 dark:bg-gold/20 flex items-center justify-center text-wine dark:text-gold shrink-0">
                        <i className="ph-bold ph-check text-lg"></i>
                    </div>
                    <div>
                        <div className="font-display font-bold text-xs">{toast.title}</div>
                        <div className="font-editorial-body text-xs text-ink-muted dark:text-night-muted">{toast.message}</div>
                    </div>
                </div>

                {/* MAIN 2-COLUMN DASHBOARD (ĐỒNG BỘ 100% VỚI TỦ SÁCH, CÁ NHÂN & HỘI VIÊN) */}
                <main className="w-full max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12 sm:pt-28 sm:pb-16 flex-1">
                    <div className="flex flex-col lg:flex-row gap-6 items-start">

                        {/* ====================================================
                            SIDEBAR TRÁI: HỒ SƠ & ĐIỀU HƯỚNG TÀI KHOẢN (ĐỒNG BỘ)
                            ==================================================== */}
                        <aside className="w-full lg:w-80 shrink-0 space-y-5 lg:sticky lg:top-24 lg:self-start">
                            {/* 1. Profile Avatar Card */}
                            <div className="rounded-2xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border p-6 shadow-sm flex flex-col items-center text-center relative overflow-hidden group">
                                <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-36 h-36 bg-wine/10 dark:bg-gold/10 rounded-full blur-2xl pointer-events-none"></div>

                                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-wine to-wine-light dark:from-gold dark:to-gold-light p-1 shadow-md mb-3.5 relative">
                                    <div className="w-full h-full rounded-full bg-paper-surface dark:bg-night-surface flex items-center justify-center font-display font-black text-2xl text-wine dark:text-gold overflow-hidden">
                                        {avatarSrc ? (
                                            <img src={avatarSrc} alt="Avatar" className="w-full h-full object-cover rounded-full" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/logo.png'; }} />
                                        ) : (
                                            customerInitial
                                        )}
                                    </div>
                                    <span className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white dark:border-night-card flex items-center justify-center text-[10px] text-white" title="Trực tuyến">
                                        <i className="ph-bold ph-check text-[9px]"></i>
                                    </span>
                                </div>

                                <h2 className="font-display font-black text-lg text-ink dark:text-night-text leading-tight">
                                    {customerName}
                                </h2>
                                <p className="font-metadata-spec text-xs text-ink-muted dark:text-night-muted mt-0.5">
                                    {customerIdDisplay}
                                </p>

                                <Link to="/hang" className="mt-3.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25 text-xs font-metadata-spec font-bold hover:scale-105 transition-transform" title="Xem cấp bậc hội viên">
                                    <i className={`ph-bold ${tierInfo.icon} text-emerald-600 dark:text-emerald-400`}></i>
                                    <span>{tierInfo.name}</span>
                                </Link>

                                <div className="grid grid-cols-2 gap-2 w-full pt-4 mt-4 border-t border-paper-border dark:border-night-border text-center">
                                    <Link to="/canhan?tab=wallet" className="p-2.5 rounded-xl bg-paper dark:bg-night-surface border border-paper-border dark:border-night-border hover:border-gold transition-colors">
                                        <span className="block font-metadata-spec text-base font-black text-ink dark:text-night-text">{potatoBalance.toLocaleString()}</span>
                                        <span className="font-metadata-spec text-[10px] text-ink-muted dark:text-night-muted">Khoai Tích Lũy</span>
                                    </Link>
                                    <Link to="/tusachcn" className="p-2.5 rounded-xl bg-paper dark:bg-night-surface border border-paper-border dark:border-night-border hover:border-wine dark:hover:border-gold transition-colors">
                                        <span className="block font-metadata-spec text-base font-black text-ink dark:text-night-text">{bookshelfCount}</span>
                                        <span className="font-metadata-spec text-[10px] text-ink-muted dark:text-night-muted">Sách Trong Tủ</span>
                                    </Link>
                                </div>
                            </div>

                            {/* 2. Navigation Menu Card - STRICT ORDER (1: Profile, 2: Bookshelf, 3: Tiers, 4: Missions, 5: Wallet, 6: History, Divider, 7: Logout) */}
                            <div className="rounded-2xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border p-3 shadow-sm space-y-1">
                                {/* 1. Thông Tin Cá Nhân */}
                                <Link
                                    to="/canhan"
                                    className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-metadata-spec font-bold text-ink-muted dark:text-night-muted hover:bg-paper-200 dark:hover:bg-night-surface hover:text-ink dark:hover:text-night-text transition-colors"
                                >
                                    <i className="ph-bold ph-user text-base"></i>
                                    <span>Thông Tin Cá Nhân</span>
                                </Link>

                                {/* 2. Tủ Sách Cá Nhân */}
                                <Link
                                    to="/tusachcn"
                                    className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-metadata-spec font-bold text-ink-muted dark:text-night-muted hover:bg-paper-200 dark:hover:bg-night-surface hover:text-ink dark:hover:text-night-text transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <i className="ph-bold ph-book-bookmark text-base"></i>
                                        <span>Tủ Sách Cá Nhân</span>
                                    </div>
                                    <span className="potato-badge text-[11px] py-0 px-2">{bookshelfCount} cuốn</span>
                                </Link>

                                {/* 3. Hạng Thành Viên */}
                                <Link
                                    to="/hang"
                                    className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-metadata-spec font-bold text-ink-muted dark:text-night-muted hover:bg-paper-200 dark:hover:bg-night-surface hover:text-ink dark:hover:text-night-text transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <i className="ph-bold ph-trophy text-base"></i>
                                        <span>Hạng Thành Viên</span>
                                    </div>
                                    <span className="potato-badge text-[11px] py-0.5 px-2 inline-flex items-center gap-1.5 whitespace-nowrap font-bold">
                                        <i className={`ph-bold ${tierInfo.icon} text-[12px] text-amber-600 dark:text-amber-400 shrink-0`}></i>
                                        <span>{tierInfo.name}</span>
                                    </span>
                                </Link>

                                {/* 4. Nhiệm Vụ Hằng Ngày (ACTIVE TAB TRÊN TRANG NÀY) */}
                                <div
                                    className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-metadata-spec font-bold bg-wine text-white dark:bg-gold dark:text-night-bg shadow-sm transition-colors cursor-default"
                                >
                                    <div className="flex items-center gap-3">
                                        <i className="ph-bold ph-target text-base"></i>
                                        <span>Nhiệm Vụ Hằng Ngày</span>
                                    </div>
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 text-white dark:bg-black/20 dark:text-night-bg text-[10px] font-bold">Streak 🔥</span>
                                </div>

                                {/* 5. Ví Khoai Tây */}
                                <Link
                                    to="/canhan?tab=wallet"
                                    className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-metadata-spec font-bold text-ink-muted dark:text-night-muted hover:bg-paper-200 dark:hover:bg-night-surface hover:text-ink dark:hover:text-night-text transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <i className="ph-bold ph-wallet text-base"></i>
                                        <span>Ví Khoai Tây</span>
                                    </div>
                                    <span className="potato-badge text-[11px] py-0 px-2">{potatoBalance.toLocaleString()} 🥔</span>
                                </Link>

                                {/* 6. Lịch Sử Giao Dịch */}
                                <Link
                                    to="/canhan?tab=history"
                                    className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-metadata-spec font-bold text-ink-muted dark:text-night-muted hover:bg-paper-200 dark:hover:bg-night-surface hover:text-ink dark:hover:text-night-text transition-colors"
                                >
                                    <i className="ph-bold ph-clock-counter-clockwise text-base"></i>
                                    <span>Lịch Sử Giao Dịch</span>
                                </Link>

                                {/* Divider Line */}
                                <div className="pt-2 border-t border-paper-border dark:border-night-border mt-2">
                                    <Link
                                        to="/dangnhap"
                                        className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-metadata-spec font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                                    >
                                        <i className="ph-bold ph-sign-out text-base"></i>
                                        <span>Đăng Xuất</span>
                                    </Link>
                                </div>
                            </div>
                        </aside>

                        {/* ====================================================
                            CỘT PHẢI: NỘI DUNG CHÍNH (THU GỌN, TINH TẾ, KHÔNG RỐI MẮT)
                            ==================================================== */}
                        <div className="flex-1 min-w-0 w-full space-y-6">

                            {/* Page Header (Gọn gàng, loại bỏ các đường kẻ cắt ngang dày đặc) */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                    <div className="flex items-center gap-2 text-xs font-metadata-spec text-ink-muted dark:text-night-muted mb-1">
                                        <Link to="/trangchu" className="hover:underline">Trang chủ</Link>
                                        <i className="ph-bold ph-caret-right text-[10px]"></i>
                                        <span>Tài khoản</span>
                                        <i className="ph-bold ph-caret-right text-[10px]"></i>
                                        <span className="text-wine dark:text-gold font-bold">Nhiệm vụ & Điểm danh</span>
                                    </div>
                                    <h1 className="font-display font-black text-2xl sm:text-3xl text-ink dark:text-night-text tracking-tight flex items-center gap-2.5">
                                        <span>Nhiệm Vụ & Điểm Danh</span>
                                        <span className="text-2xl">🎯</span>
                                    </h1>
                                </div>

                                <div className="flex items-center gap-2">
                                    <div className="px-3 py-1.5 rounded-xl bg-paper-surface dark:bg-night-card border border-paper-border/80 dark:border-night-border/80 flex items-center gap-2 text-xs font-metadata-spec font-bold text-ink dark:text-night-text shadow-sm">
                                        <span>🥔</span>
                                        <span>{potatoBalance.toLocaleString()} Khoai</span>
                                    </div>
                                    <div className="px-3 py-1.5 rounded-xl bg-paper-surface dark:bg-night-card border border-paper-border/80 dark:border-night-border/80 flex items-center gap-2 text-xs font-metadata-spec font-bold text-amber-600 dark:text-gold shadow-sm">
                                        <span>🔥</span>
                                        <span>{streakDays} Ngày Streak</span>
                                    </div>
                                </div>
                            </div>

                            {/* 1. GIAO DIỆN STREAK ĐIỂM DANH 7 NGÀY (THIẾT KẾ THU GỌN) */}
                            <StreakDiemDanh onShowToast={showToast} onCheckinSuccess={fetchCustomer} />

                            {/* 2. CAPSULE TABS (Không dùng viền kẻ ngang cắt ngang màn hình) */}
                            <div className="flex items-center gap-2 pt-1">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('daily')}
                                    className={`px-4 py-2 rounded-xl font-metadata-spec font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
                                        activeTab === 'daily'
                                            ? 'bg-wine text-white dark:bg-gold dark:text-night-bg shadow-sm'
                                            : 'bg-paper-surface dark:bg-night-card text-ink-muted dark:text-night-muted hover:text-ink dark:hover:text-night-text border border-paper-border/70 dark:border-night-border/70'
                                    }`}
                                >
                                    <i className="ph-bold ph-lightning text-sm"></i>
                                    <span>Nhiệm Vụ Hằng Ngày ({DAILY_MISSIONS.length})</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setActiveTab('milestones')}
                                    className={`px-4 py-2 rounded-xl font-metadata-spec font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
                                        activeTab === 'milestones'
                                            ? 'bg-wine text-white dark:bg-gold dark:text-night-bg shadow-sm'
                                            : 'bg-paper-surface dark:bg-night-card text-ink-muted dark:text-night-muted hover:text-ink dark:hover:text-night-text border border-paper-border/70 dark:border-night-border/70'
                                    }`}
                                >
                                    <i className="ph-bold ph-medal text-sm"></i>
                                    <span>Thành Tựu Cột Mốc ({READER_MILESTONES.length})</span>
                                </button>
                            </div>

                            {/* 3. DANH SÁCH NHIỆM VỤ HẰNG NGÀY (Card thoáng, loại bỏ các gạch ngang bên trong gây rối) */}
                            {activeTab === 'daily' && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-xs font-metadata-spec text-ink-muted dark:text-night-muted px-1">
                                        <span>Làm mới mỗi ngày lúc 00:00</span>
                                        <span className="font-bold text-wine dark:text-gold">Hoàn thành tất cả để nhận tối đa +55 Khoai</span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                        {DAILY_MISSIONS.map((m) => {
                                            const percent = Math.min(100, Math.round((m.currentProgress / m.maxProgress) * 100));

                                            return (
                                                <div
                                                    key={m.id}
                                                    className="rounded-2xl bg-paper-surface dark:bg-night-card border border-paper-border/80 dark:border-night-border/80 p-4 sm:p-4.5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-3.5"
                                                >
                                                    <div>
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div className="flex items-center gap-3">
                                                                <span className={`w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0 ${m.iconColor}`}>
                                                                    <i className={`ph-bold ${m.icon}`}></i>
                                                                </span>
                                                                <div>
                                                                    <h4 className="font-display font-black text-xs sm:text-sm text-ink dark:text-night-text leading-snug">
                                                                        {m.title}
                                                                    </h4>
                                                                    <p className="font-editorial-body text-[11px] text-ink-muted dark:text-night-muted mt-0.5 leading-relaxed">
                                                                        {m.description}
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            <div className="shrink-0 flex flex-col items-end">
                                                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-display font-black text-xs">
                                                                    +{m.rewardPotato} 🥔
                                                                </span>
                                                                <span className="text-[10px] font-metadata-spec text-ink-muted dark:text-night-muted">
                                                                    +{m.rewardXp} XP
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Thanh tiến độ gọn (không cần gạch ngang phân tách) */}
                                                        <div className="mt-3">
                                                            <div className="flex justify-between text-[10px] font-metadata-spec font-bold text-ink-muted dark:text-night-muted mb-1">
                                                                <span>Tiến độ: {m.currentProgress} / {m.maxProgress}</span>
                                                                <span>{percent}%</span>
                                                            </div>
                                                            <div className="w-full h-1.5 rounded-full bg-paper-100 dark:bg-night-surface overflow-hidden">
                                                                <div
                                                                    className={`h-full rounded-full transition-all duration-500 ${
                                                                        percent >= 100 ? 'bg-emerald-500' : 'bg-wine dark:bg-gold'
                                                                    }`}
                                                                    style={{ width: `${percent}%` }}
                                                                ></div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Khu vực nút hành động (sắp xếp liền mạch, không gạch ngang) */}
                                                    <div className="flex items-center justify-end">
                                                        {m.isCompleted ? (
                                                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-metadata-spec font-bold text-xs">
                                                                <i className="ph-bold ph-check text-xs"></i>
                                                                <span>Đã Nhận</span>
                                                            </span>
                                                        ) : m.actionLink ? (
                                                            <Link
                                                                to={m.actionLink}
                                                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-paper-100 hover:bg-wine hover:text-white dark:bg-night-surface dark:hover:bg-gold dark:hover:text-night-bg text-ink dark:text-night-text font-metadata-spec font-bold text-xs transition-all shadow-sm"
                                                            >
                                                                <span>{m.actionLabel}</span>
                                                                <i className="ph-bold ph-caret-right text-xs"></i>
                                                            </Link>
                                                        ) : (
                                                            <span className="text-xs text-ink-muted dark:text-night-muted italic">
                                                                Đang diễn ra
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* 4. DANH SÁCH THÀNH TỰU CỘT MỐC */}
                            {activeTab === 'milestones' && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-xs font-metadata-spec text-ink-muted dark:text-night-muted px-1">
                                        <span>Phần thưởng cột mốc dài hạn</span>
                                        <span className="font-bold text-amber-600 dark:text-gold">Tự động nhận thưởng ngay khi hoàn thành</span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                        {READER_MILESTONES.map((ms) => {
                                            const percent = Math.min(100, Math.round((ms.currentProgress / ms.maxProgress) * 100));

                                            return (
                                                <div
                                                    key={ms.id}
                                                    className="rounded-2xl bg-paper-surface dark:bg-night-card border border-paper-border/80 dark:border-night-border/80 p-4 sm:p-4.5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-3.5"
                                                >
                                                    <div>
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div className="flex items-center gap-3">
                                                                <span className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center text-base shrink-0">
                                                                    <i className={`ph-bold ${ms.icon}`}></i>
                                                                </span>
                                                                <div>
                                                                    <div className="flex items-center gap-1.5">
                                                                        <h4 className="font-display font-black text-xs sm:text-sm text-ink dark:text-night-text leading-snug">
                                                                            {ms.title}
                                                                        </h4>
                                                                    </div>
                                                                    <p className="font-editorial-body text-[11px] text-ink-muted dark:text-night-muted mt-0.5 leading-relaxed">
                                                                        {ms.description}
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            <div className="shrink-0 flex flex-col items-end">
                                                                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 font-display font-black text-xs">
                                                                    +{ms.rewardPotato} 🥔
                                                                </span>
                                                                <span className="text-[10px] font-metadata-spec text-ink-muted dark:text-night-muted">
                                                                    +{ms.rewardXp} XP
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="mt-3">
                                                            <div className="flex justify-between text-[10px] font-metadata-spec font-bold text-ink-muted dark:text-night-muted mb-1">
                                                                <span>Tiến trình: {ms.currentProgress} / {ms.maxProgress}</span>
                                                                <span>{percent}%</span>
                                                            </div>
                                                            <div className="w-full h-1.5 rounded-full bg-paper-100 dark:bg-night-surface overflow-hidden">
                                                                <div
                                                                    className={`h-full rounded-full transition-all duration-500 ${
                                                                        percent >= 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-amber-500 to-rose-500'
                                                                    }`}
                                                                    style={{ width: `${percent}%` }}
                                                                ></div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="text-[11px] font-metadata-spec text-ink-muted dark:text-night-muted">
                                                            {percent >= 100 ? 'Đã đạt mốc' : `Còn ${ms.maxProgress - ms.currentProgress} bước`}
                                                        </span>
                                                        {percent >= 100 ? (
                                                            <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                                                                <i className="ph-bold ph-seal-check text-sm"></i> Đã Mở Khóa
                                                            </span>
                                                        ) : (
                                                            <Link to="/trangchu" className="font-bold text-wine dark:text-gold hover:underline flex items-center gap-1">
                                                                <span>Tiếp tục</span>
                                                                <i className="ph-bold ph-arrow-right text-xs"></i>
                                                            </Link>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                </main>
            </UserLayout>
        </>
    );
}
