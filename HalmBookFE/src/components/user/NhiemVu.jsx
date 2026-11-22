import { halmTailwindConfig, inlinePageStyle1 } from './styles/NhiemVu.styles.js';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import UserLayout from './layout/UserLayout';
import StreakDiemDanh from './StreakDiemDanh';
import { getCurrentCustomer } from '@/services/customerService';
import { getCustomerBookshelf } from '@/services/orderService';
import { checkinDailyStreak } from '@/services/tierService';
import { isDarkMode } from '@/utils/theme';
import { formatCustomerId, getTierInfo, getTierBadgeClass } from '@/utils/tierUtils';
import AvatarWithFrame from '@/components/common/AvatarWithFrame';
import { getMissions, claimMission } from '@/services/missionService';
import { missionCards } from './missionPresentation';
import { logoutUser } from '@/services/authToken';
import { prefetchUserRoutes } from '@/utils/routePrefetch';



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

    const showToast = (title, message, type = 'info') => {
        if (window.halmToast) {
            const lower = (title || '').toLowerCase();
            if (type === 'success' || lower.includes('thành công')) {
                window.halmToast.success(title, message);
            } else if (type === 'error' || lower.includes('thất bại') || lower.includes('lỗi')) {
                window.halmToast.error(title, message);
            } else {
                window.halmToast.info(title, message);
            }
        }
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
        } catch {
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
        void Promise.resolve().then(() => { void fetchCustomer(); void fetchBookshelfCount(); });

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

    const potatoBalance = customer?.potatoBalance ?? 0;
    const streakDays = customer?.streakDays ?? 0;
    const customerName = customer?.customerName || customer?.name || 'Bạn đọc HALM';
    const avatarSrc = customer?.avatar || customer?.avatarUrl;
    const customerIdDisplay = formatCustomerId(customer?.customerId || customer?.customer_id);

    const navigate = useNavigate();
    const [missionData, setMissionData] = useState(null);
    const missionPending = useRef(false);
    const missionAlive = useRef(true);
    const missionSequence = useRef(0);
    const lastMissionError = useRef('');
    const refreshMissions = useCallback(async (force = false) => {
        if (missionPending.current && !force) return;
        const request = ++missionSequence.current;
        try {
            const result = await getMissions();
            if (!missionAlive.current || request !== missionSequence.current) return;
            setMissionData(result); lastMissionError.current = '';
            setCustomer(previous => ({ ...previous, potatoBalance: result.potatoBalance }));
        } catch (error) {
            if (!missionAlive.current || request !== missionSequence.current) return;
            const message = error?.response?.data?.message || 'Không tải được nhiệm vụ. Vui lòng mở lại trang.';
            if (lastMissionError.current !== message) {
                lastMissionError.current = message;
                setToast({ title: 'Nhiệm Vụ', message }); setToastVisible(true);
                if (toastTimer.current) clearTimeout(toastTimer.current);
                toastTimer.current = setTimeout(() => setToastVisible(false), 3500);
            }
        }
    }, []);
    useEffect(() => {
        prefetchUserRoutes();
        missionAlive.current = true;
        void Promise.resolve().then(() => refreshMissions());
        const visible = () => { if (!document.hidden) void refreshMissions(); };
        const timer = setInterval(visible, 30000);
        document.addEventListener('visibilitychange', visible);
        window.addEventListener('halm-potato-updated', visible);
        window.addEventListener('halm-daily-task-completed', visible);
        return () => {
            missionAlive.current = false; missionSequence.current++; clearInterval(timer);
            if (toastTimer.current) clearTimeout(toastTimer.current);
            document.removeEventListener('visibilitychange', visible);
            window.removeEventListener('halm-potato-updated', visible);
            window.removeEventListener('halm-daily-task-completed', visible);
        };
    }, [refreshMissions]);

    const handleExecuteMission = async mission => {
        if (missionPending.current) return;
        if (mission.taskKey === 'checkin') {
            missionPending.current = true; missionSequence.current++;
            try {
                const result = await checkinDailyStreak();
                showToast('Điểm Danh Hằng Ngày', result.message);
                window.dispatchEvent(new CustomEvent('halm-potato-updated', { detail: { potatoBalance: result.potatoBalance } }));
                await Promise.all([refreshMissions(true), fetchCustomer()]);
            } catch (error) { showToast('Điểm Danh Thất Bại', error?.response?.data?.message || 'Vui lòng thử lại.'); }
            finally { missionPending.current = false; }
            return;
        }
        if (mission.taskKey === 'chat') {
            window.dispatchEvent(new CustomEvent('halm-open-chatbot', { detail: { message: 'Gợi ý giúp tôi một cuốn sách hay nhé!' } }));
            return;
        }
        const destinations = { read: '/tusachcn', search: '/danhmuc', offers: '/uudai', bookshelf: '/tusachcn' };
        if (destinations[mission.taskKey]) navigate(destinations[mission.taskKey]);
    };
    const handleClaimMission = async mission => {
        if (missionPending.current || mission.isCompleted || !mission.canClaim) return;
        missionPending.current = true; missionSequence.current++;
        try {
            const result = await claimMission(mission.id);
            if (missionAlive.current) showToast('Nhận Thưởng Thành Công!', result.message || 'Đã nhận thưởng.');
            window.dispatchEvent(new CustomEvent('halm-potato-updated', { detail: { potatoBalance: result.newBalance } }));
            window.dispatchEvent(new Event('halm-notification-refresh'));
            await refreshMissions(true);
        } catch (error) {
            await refreshMissions(true);
            if (missionAlive.current) showToast('Thông Báo', error?.response?.data?.message || 'Không thể nhận thưởng lúc này.');
        } finally { missionPending.current = false; }
    };
    const handleClaimMilestone = handleClaimMission;
    const DAILY_MISSIONS = missionCards(missionData?.missions, 'DAILY');
    const READER_MILESTONES = missionCards(missionData?.missions, 'MILESTONE');

    return (
        <>
            <style>{inlinePageStyle1}</style>

            <UserLayout className="nhiem-vu-page" onThemeChange={setIsDark}>

                {/* MAIN 2-COLUMN DASHBOARD (ĐỒNG BỘ 100% VỚI TỦ SÁCH, CÁ NHÂN & HỘI VIÊN) */}
                <main className="w-full max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12 sm:pt-28 sm:pb-16 flex-1">
                    <div className="flex flex-col lg:flex-row gap-6 items-start">

                        {/* ====================================================
                            SIDEBAR TRÁI: HỒ SƠ & ĐIỀU HƯỚNG TÀI KHOẢN (ĐỒNG BỘ 100%)
                            ==================================================== */}
                        <aside onMouseEnter={prefetchUserRoutes} onFocus={prefetchUserRoutes} className="w-full lg:w-80 shrink-0 space-y-4 lg:sticky lg:top-24 lg:self-start">
                            {/* 1. Profile Avatar Card */}
                            <div className="rounded-3xl user-sidebar-card bg-paper-surface dark:bg-night-surface border border-paper-border dark:border-night-border p-6 shadow-sm flex flex-col items-center text-center relative overflow-hidden group">
                                <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>

                                {/* Dynamic Avatar Frame with Tier Prestige - Bo theo viền tròn Tu Tiên */}
                                <AvatarWithFrame
                                    avatarSrc={avatarSrc}
                                    name={customerName}
                                    tier={customer?.membershipTier}
                                    potatoBalance={potatoBalance}
                                    booksCount={bookshelfCount}
                                    size="lg"
                                />

                                <h2 className="font-display font-black text-2xl text-[#FAF7F0] leading-tight">
                                    {customerName}
                                </h2>
                                <p className="font-metadata-spec text-xs text-[#96938B] mt-1">
                                    {customerIdDisplay}
                                </p>

                                {/* Tier Pill */}
                                <Link to="/hang" className={`mt-3.5 inline-flex items-center gap-1.5 px-4 py-1 rounded-full text-xs font-metadata-spec font-bold hover:scale-105 transition-transform ${getTierBadgeClass(customer?.membershipTier, potatoBalance)}`} title="Xem cấp bậc hội viên">
                                    <i className={`ph-bold ${getTierInfo(customer?.membershipTier, potatoBalance).icon}`}></i>
                                    <span>{getTierInfo(customer?.membershipTier, potatoBalance).name}</span>
                                </Link>

                                {/* Divider */}
                                <div className="w-full h-px bg-paper-border dark:bg-night-border my-5"></div>

                                {/* Stat Boxes */}
                                <div className="grid grid-cols-3 gap-2 w-full text-center">
                                    <Link to="/canhan?tab=wallet" className="py-3 px-2 rounded-2xl user-sidebar-box bg-paper dark:bg-night-surface border border-paper-border dark:border-night-border hover:border-gold transition-colors flex flex-col justify-center">
                                        <span className="block font-metadata-spec text-base sm:text-lg font-black text-[#EDE9DF]">{potatoBalance.toLocaleString()}</span>
                                        <span className="font-metadata-spec text-[10px] text-[#96938B] mt-0.5 font-bold">Khoai</span>
                                    </Link>
                                    <Link to="/tusachcn" className="py-3 px-2 rounded-2xl user-sidebar-box bg-paper dark:bg-night-surface border border-paper-border dark:border-night-border hover:border-wine dark:hover:border-gold transition-colors flex flex-col justify-center">
                                        <span className="block font-metadata-spec text-base sm:text-lg font-black text-[#EDE9DF]">{bookshelfCount}</span>
                                        <span className="font-metadata-spec text-[10px] text-[#96938B] mt-0.5 font-bold">Tủ Sách</span>
                                    </Link>
                                    <Link to="/canhan?tab=vouchers" className="py-3 px-2 rounded-2xl user-sidebar-box bg-paper dark:bg-night-surface border border-paper-border dark:border-night-border hover:border-gold transition-colors flex flex-col justify-center items-center">
                                        <i className="ph-bold ph-ticket text-lg text-amber-500 dark:text-gold mb-0.5"></i>
                                        <span className="font-metadata-spec text-[10px] text-[#96938B] font-bold">Voucher</span>
                                    </Link>
                                </div>
                            </div>

                            {/* 2. Navigation Menu Card */}
                            <div className="rounded-3xl user-sidebar-card bg-paper-surface dark:bg-night-surface border border-paper-border dark:border-night-border p-3.5 shadow-sm space-y-1.5">
                                {/* 1. Thông Tin Cá Nhân */}
                                <Link
                                    to="/canhan"
                                    className="w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs font-metadata-spec font-bold text-ink-muted dark:text-stone-300 hover:bg-paper-200 dark:hover:bg-stone-800/40 hover:text-ink dark:hover:text-white transition-colors"
                                >
                                    <i className="ph-bold ph-user text-lg text-stone-400"></i>
                                    <span>Thông Tin Cá Nhân</span>
                                </Link>

                                {/* 2. Tủ Sách Cá Nhân */}
                                <Link
                                    to="/tusachcn"
                                    className="w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-metadata-spec font-bold text-ink-muted dark:text-stone-300 hover:bg-paper-200 dark:hover:bg-stone-800/40 hover:text-ink dark:hover:text-white transition-colors"
                                >
                                    <div className="flex items-center gap-3.5">
                                        <i className="ph-bold ph-book-bookmark text-lg text-stone-400"></i>
                                        <span>Tủ Sách Cá Nhân</span>
                                    </div>
                                    <span className="px-3 py-1 rounded-full bg-paper-200 dark:bg-[#242116] border border-paper-border dark:border-[#52441D] text-amber-600 dark:text-[#D8B44A] text-xs font-bold font-metadata-spec">{bookshelfCount} cuốn</span>
                                </Link>

                                {/* 3. Hạng Thành Viên */}
                                <Link
                                    to="/hang"
                                    className="w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-metadata-spec font-bold text-ink-muted dark:text-stone-300 hover:bg-paper-200 dark:hover:bg-stone-800/40 hover:text-ink dark:hover:text-white transition-colors"
                                >
                                    <div className="flex items-center gap-3.5">
                                        <i className="ph-bold ph-trophy text-lg text-stone-400"></i>
                                        <span>Hạng Thành Viên</span>
                                    </div>
                                    <i className="ph-bold ph-caret-right text-xs text-stone-400"></i>
                                </Link>

                                {/* 4. Nhiệm Vụ Hằng Ngày (ACTIVE TAB TRÊN TRANG NÀY) */}
                                <div
                                    className="w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-metadata-spec font-black bg-[#C28807] text-[#111210] shadow-md transition-colors cursor-default"
                                >
                                    <div className="flex items-center gap-3.5">
                                        <i className="ph-bold ph-target text-lg text-[#111210]"></i>
                                        <span>Nhiệm Vụ Hằng Ngày</span>
                                    </div>
                                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-black/25 text-black text-xs font-black">Streak 🔥</span>
                                </div>

                                {/* 5. Ví Khoai Tây */}
                                <Link
                                    to="/canhan?tab=wallet"
                                    className="w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-metadata-spec font-bold text-ink-muted dark:text-stone-300 hover:bg-paper-200 dark:hover:bg-stone-800/40 hover:text-ink dark:hover:text-white transition-colors"
                                >
                                    <div className="flex items-center gap-3.5">
                                        <i className="ph-bold ph-wallet text-lg text-stone-400"></i>
                                        <span>Ví Khoai Tây</span>
                                    </div>
                                    <span className="px-3 py-1 rounded-full bg-paper-200 dark:bg-[#242116] border border-paper-border dark:border-[#52441D] text-amber-600 dark:text-[#D8B44A] text-xs font-bold font-metadata-spec">{potatoBalance.toLocaleString()} 🥔</span>
                                </Link>

                                {/* 5.5. Kho Voucher Của Tôi */}
                                <Link
                                    to="/canhan?tab=vouchers"
                                    className="w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs font-metadata-spec font-bold text-ink-muted dark:text-stone-300 hover:bg-paper-200 dark:hover:bg-stone-800/40 hover:text-ink dark:hover:text-white transition-colors"
                                >
                                    <i className="ph-bold ph-ticket text-lg text-stone-400"></i>
                                    <span>Kho Voucher Của Tôi</span>
                                </Link>

                                {/* 6. Lịch Sử Giao Dịch */}
                                <Link
                                    to="/canhan?tab=history"
                                    className="w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs font-metadata-spec font-bold text-ink-muted dark:text-stone-300 hover:bg-paper-200 dark:hover:bg-stone-800/40 hover:text-ink dark:hover:text-white transition-colors"
                                >
                                    <i className="ph-bold ph-clock-counter-clockwise text-lg text-stone-400"></i>
                                    <span>Lịch Sử Giao Dịch</span>
                                </Link>

                                {/* 7. Khiếu Nại & Hỗ Trợ */}
                                <Link
                                    to="/canhan?tab=support"
                                    className="w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs font-metadata-spec font-bold text-ink-muted dark:text-stone-300 hover:bg-paper-200 dark:hover:bg-stone-800/40 hover:text-ink dark:hover:text-white transition-colors"
                                >
                                    <i className="ph-bold ph-headset text-lg text-stone-400"></i>
                                    <span>Khiếu Nại & Hỗ Trợ</span>
                                </Link>

                                {/* Divider Line */}
                                <div className="pt-2 border-t border-paper-border dark:border-[#2C2E29] mt-2">
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            await logoutUser();
                                            window.location.assign('/');
                                        }}
                                        className="w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs font-metadata-spec font-bold text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                    >
                                        <i className="ph-bold ph-sign-out text-lg text-rose-500"></i>
                                        <span>Đăng Xuất</span>
                                    </button>
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
                                        <Link to="/" className="hover:underline">Trang chủ</Link>
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
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-metadata-spec font-bold text-xs">
                                                                <i className="ph-bold ph-check text-xs"></i>
                                                                <span>Đã Nhận</span>
                                                            </span>
                                                        ) : m.canClaim ? (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleClaimMission(m)}
                                                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-stone-900 font-metadata-spec font-black text-xs shadow-md animate-pulse cursor-pointer hover:scale-105 transition-all"
                                                            >
                                                                <i className="ph-bold ph-gift text-sm"></i>
                                                                <span>Nhận Thưởng +{m.rewardPotato} 🥔</span>
                                                            </button>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleExecuteMission(m)}
                                                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-paper-100 hover:bg-wine hover:text-white dark:bg-night-surface dark:hover:bg-gold dark:hover:text-night-bg text-ink dark:text-night-text font-metadata-spec font-bold text-xs transition-all shadow-sm cursor-pointer hover:scale-105"
                                                            >
                                                                <i className={`ph-bold ${m.actionIcon || 'ph-caret-right'} text-xs`}></i>
                                                                <span>{m.actionLabel}</span>
                                                            </button>
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
                                                            {ms.isCompleted ? 'Đã hoàn thành' : (percent >= 100 ? 'Sẵn sàng nhận thưởng' : `Còn ${ms.maxProgress - ms.currentProgress} bước`)}
                                                        </span>
                                                        {ms.isCompleted ? (
                                                            <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                                                                <i className="ph-bold ph-seal-check text-sm"></i> Đã Nhận
                                                            </span>
                                                        ) : ms.canClaim ? (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleClaimMilestone(ms)}
                                                                className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md animate-pulse cursor-pointer hover:scale-105 transition-all"
                                                            >
                                                                <i className="ph-bold ph-gift"></i>
                                                                <span>Nhận +{ms.rewardPotato} 🥔</span>
                                                            </button>
                                                        ) : (
                                                            <Link to="/" className="font-bold text-wine dark:text-gold hover:underline flex items-center gap-1">
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
