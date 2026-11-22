import { tiersTailwindConfig, inlinePageStyle1 } from './styles/HangTv.styles.js';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import UserLayout from './layout/UserLayout';
import { isDarkMode, applyTheme } from '@/utils/theme';
import { getMyTierSummary, checkinDailyStreak } from '@/services/tierService';
import { getCurrentCustomer } from '@/services/customerService';
import { getTierInfo, formatCustomerId, getTierBadgeClass, getTierLevel } from '@/utils/tierUtils';
import AvatarWithFrame from '@/components/common/AvatarWithFrame';
import { logoutUser } from '@/services/authToken';
import { prefetchUserRoutes } from '@/utils/routePrefetch';



const PROFILE_ASSETS = {
    fonts: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Open+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400;1,600&family=Roboto:wght@300;400;500;700;900&display=swap',
    phosphorBold: 'https://unpkg.com/@phosphor-icons/web@2.1.1/src/bold/style.css',
    phosphorRegular: 'https://unpkg.com/@phosphor-icons/web@2.1.1/src/regular/style.css',
    phosphorFill: 'https://unpkg.com/@phosphor-icons/web@2.1.1/src/fill/style.css',
    phosphorDuotone: 'https://unpkg.com/@phosphor-icons/web@2.1.1/src/duotone/style.css',
    tailwind: 'https://cdn.tailwindcss.com',
};

const tierData = {
    policy: {
        icon: '🛡️',
        title: 'Chính Sách Bảo Lưu Vĩnh Viễn',
        subtitle: 'Cam kết quyền lợi trọn đời tại HALM BOOK',
    },
    tier2: {
        icon: '🚜',
        title: 'Lộ Trình Thăng Cấp: Cao Thủ Cày',
        subtitle: 'Hạng Bạc • Tri Thức (Yêu cầu: 10 cuốn sách)',
    },
    tier3: {
        icon: '🌾',
        title: 'Lộ Trình Thăng Cấp: Lão Nông',
        subtitle: 'Hạng Vàng • Tinh Hoa (Yêu cầu: 50 cuốn sách)',
    },
    tier4: {
        icon: '🏰',
        title: 'Lộ Trình Thăng Cấp: Đại Điền Chủ',
        subtitle: 'Hạng Hoàng Gia VIP 👑 (Yêu cầu: 150 cuốn sách)',
    }
};

function createStars() {
    return Array.from({ length: 80 }, (_, id) => ({
        id, size: Math.random() * 2.5 + 0.5, top: Math.random() * 100,
        left: Math.random() * 100, duration: Math.random() * 3 + 2, delay: Math.random() * 3,
    }));
}

function handleLogoError(event) {
    const image = event.currentTarget;
    if (image.dataset.fallbackAttempted) return;
    image.dataset.fallbackAttempted = 'true';
    image.src = '/logo.png';
}

function renderTierContent(type, summary) {
    const books = summary?.booksReadCount ?? 0;
    const points = summary?.totalPoints ?? 0;

    if (type === 'policy') {
        return <>
            <p>Khác biệt với các nền tảng thông thường yêu cầu tích lũy lại sau mỗi chu kỳ 12 tháng, HALM BOOK cam kết <strong>BẢO LƯU TRỌN ĐỜI</strong> thứ hạng thành viên của bạn:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-ink/80 dark:text-night-muted">
                <li>Khi đạt bất kỳ thứ hạng nào (Thợ Cày, Cao Thủ Cày, Lão Nông, Đại Điền Chủ), thứ hạng của bạn được bảo lưu vĩnh viễn.</li>
                <li>Không bị giáng cấp kể cả khi không đọc sách hoặc gián đoạn tài khoản trong thời gian dài.</li>
                <li>Mức chiết khấu và huy hiệu danh dự luôn được duy trì liên tục trên toàn bộ hệ thống.</li>
            </ul>
        </>;
    }
    if (type === 'tier2') {
        const remainingBooks = Math.max(0, 10 - books);
        const remainingPts = Math.max(0, 500 - points);
        return <>
            <p>Tiến trình thực tế của bạn: <strong>{books}/10 cuốn sách</strong> (hoặc <strong>{points}/500 điểm XP</strong>):</p>
            {remainingBooks === 0 || remainingPts === 0 ? (
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold my-2 text-xs flex items-center gap-1.5">
                    <i className="ph-bold ph-check-circle text-base"></i>
                    <span>Bạn đã mở khóa cấp bậc Cao Thủ Cày 🚜</span>
                </div>
            ) : (
                <p className="text-xs text-wine dark:text-gold font-bold my-1">
                    Chỉ cần cày thêm {remainingBooks} cuốn sách hoặc tích lũy thêm {remainingPts} XP nữa để thăng hạng!
                </p>
            )}
            <div className="p-3 rounded-xl bg-paper dark:bg-night-surface border border-paper-border dark:border-night-border my-2">
                <div className="font-bold text-ink dark:text-night-text mb-1">Quyền lợi ngay khi thăng cấp:</div>
                <ul className="list-disc pl-4 space-y-1 text-xs">
                    <li>Giảm trực tiếp <strong>5%</strong> trên toàn bộ hóa đơn thuê và mua sách.</li>
                    <li>Huy hiệu Bạc danh dự hiển thị nổi bật cạnh tên tài khoản trên diễn đàn và review.</li>
                    <li>Đọc trước các tác phẩm mới xuất bản trước 3 ngày.</li>
                    <li>Ưu tiên hàng đợi hỗ trợ CSKH trong vòng 2 giờ.</li>
                </ul>
            </div>
            <p className="text-[11px] text-ink-muted dark:text-night-muted">Mẹo: Bạn có thể hoàn thành nhanh các sách ngắn thuộc mục <em>Văn Học & Truyện Ngắn</em> để đẩy nhanh tốc độ lên hạng!</p>
        </>;
    }
    if (type === 'tier3') {
        const remainingBooks = Math.max(0, 50 - books);
        const remainingPts = Math.max(0, 2500 - points);
        return <>
            <p>Hạng Lão Nông là biểu tượng của độc giả kiên trì và thông tuệ trên HALM BOOK:</p>
            <p className="text-xs text-ink-muted dark:text-night-muted mt-1">
                Tiến trình hiện tại: <strong>{books}/50 cuốn</strong> hoặc <strong>{points}/2.500 XP</strong> {remainingBooks > 0 && `(Còn ${remainingBooks} cuốn hoặc ${remainingPts} XP)`}.
            </p>
            <div className="p-3 rounded-xl bg-gold/10 border border-gold/30 my-2">
                <div className="font-bold text-gold mb-1">Đặc quyền cao cấp mở khóa:</div>
                <ul className="list-disc pl-4 space-y-1 text-xs text-ink dark:text-night-text">
                    <li>Chiết khấu <strong>10%</strong> toàn bộ dịch vụ và thuê sách trọn đời.</li>
                    <li><strong>Miễn phí 1 cuốn sách mỗi tháng</strong> do ban tuyển chọn cho phép.</li>
                    <li>Khung avatar Tinh Hoa hào quang vàng kim lấp lánh độc quyền.</li>
                    <li>Đọc trước các tác phẩm mới xuất bản trước 7 ngày.</li>
                    <li>Hotline hỗ trợ riêng 24/7.</li>
                </ul>
            </div>
        </>;
    }
    if (type === 'tier4') {
        const remainingBooks = Math.max(0, 150 - books);
        const remainingPts = Math.max(0, 10000 - points);
        return <>
            <p>Đỉnh cao danh dự dành cho những độc giả xuất sắc nhất:</p>
            <p className="text-xs text-ink-muted dark:text-night-muted mt-1">
                Tiến trình hiện tại: <strong>{books}/150 cuốn</strong> hoặc <strong>{points}/10.000 XP</strong> {remainingBooks > 0 && `(Còn ${remainingBooks} cuốn hoặc ${remainingPts} XP)`}.
            </p>
            <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500/10 to-amber-600/10 border border-amber-500/40 my-2">
                <div className="font-bold text-amber-500 mb-1">Đặc quyền tối thượng:</div>
                <ul className="list-disc pl-4 space-y-1 text-xs text-ink dark:text-night-text">
                    <li>Giảm <strong>20%</strong> toàn bộ dịch vụ HALM BOOK trọn đời.</li>
                    <li>Tặng <strong>hộp quà ấn bản sách bìa cứng mạ vàng độc quyền</strong> tận nhà hàng năm.</li>
                    <li>Miễn cọc sách trọn đời và mượn không giới hạn.</li>
                    <li>Đọc trước các tác phẩm mới xuất bản trước 14 ngày.</li>
                    <li>Chuyên viên chăm sóc khách hàng VIP riêng biệt (1-on-1).</li>
                </ul>
            </div>
        </>;
    }
    return null;
}

const getCleanTierName = (tier, balance = 0, books = 0) => getTierInfo(tier, balance, books).name;

export default function Tiers() {
    const [isDark, setIsDark] = useState(() => isDarkMode());
    const [stars, setStars] = useState([]);
    const [toast, setToast] = useState({ title: "Hạng Thành Viên", message: "Đã ghi nhận tương tác thành công." });
    const [toastVisible, setToastVisible] = useState(false);
    const [activeTier, setActiveTier] = useState(null);
    const starsInitialized = useRef(false);
    const toastTimer = useRef(null);

    // Dữ liệu thực tế từ API Hạng Thành Viên & Điểm Cày
    const [customer, setCustomer] = useState(null);
    const [tierSummary, setTierSummary] = useState(null);
    const [isCheckingIn, setIsCheckingIn] = useState(false);

    const loadTierSummary = async () => {
        try {
            const [summary, cust] = await Promise.all([
                getMyTierSummary().catch(() => null),
                getCurrentCustomer().catch(() => null)
            ]);
            if (summary) setTierSummary(summary);
            if (cust) setCustomer(cust);
        } catch (error) {
            console.error("Lỗi khi tải dữ liệu hạng thành viên:", error);
        }
    };

    const handleDailyCheckin = async () => {
        setIsCheckingIn(true);
        try {
            const res = await checkinDailyStreak();
            if (res.success) {
                showToast("Điểm Danh Thành Công!", res.message);
                loadTierSummary();
                window.dispatchEvent(new CustomEvent('halm-potato-updated', {
                    detail: { potatoBalance: res.potatoBalance }
                }));
            } else {
                showToast("Điểm Danh Đọc Sách", res.message);
            }
        } catch (err) {
            showToast("Lỗi Điểm Danh", err?.response?.data?.message || err?.message || "Không thể điểm danh.");
        } finally {
            setIsCheckingIn(false);
        }
    };

    useEffect(() => {
        prefetchUserRoutes();
        loadTierSummary();
        const handlePotatoUpdated = () => {
            loadTierSummary();
        };
        window.addEventListener('halm-potato-updated', handlePotatoUpdated);
        return () => window.removeEventListener('halm-potato-updated', handlePotatoUpdated);
    }, []);

    useEffect(() => {
        applyTheme(isDark);
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

    useEffect(() => {
        if (!isDark || starsInitialized.current) return;
        starsInitialized.current = true;
        setStars(createStars());
    }, [isDark]);

    useEffect(() => {
        document.title = "HALM BOOK — Hệ Thống Hạng Thành Viên & Đặc Quyền Độc Giả";
        let description = document.querySelector('meta[name="description"]');
        if (!description) {
            description = document.createElement('meta');
            description.name = 'description';
            document.head.appendChild(description);
        }
        description.content = "Hệ thống cấp bậc thành viên HALM BOOK: Thợ Cày, Cao Thủ Cày, Lão Nông, Đại Điền Chủ. Tôn vinh hành trình đọc sách, mở khóa chiết khấu trọn đời và đặc quyền hỗ trợ VIP.";
    }, []);

    useEffect(() => {
        if (!document.querySelector('link[data-tiers-fonts]')) {
            const fontLink = document.createElement('link');
            fontLink.rel = 'stylesheet'; fontLink.href = PROFILE_ASSETS.fonts;
            fontLink.dataset.tiersFonts = 'true'; document.head.appendChild(fontLink);
        }
        Object.entries({ phosphorBold: PROFILE_ASSETS.phosphorBold, phosphorRegular: PROFILE_ASSETS.phosphorRegular, phosphorFill: PROFILE_ASSETS.phosphorFill, phosphorDuotone: PROFILE_ASSETS.phosphorDuotone }).forEach(([key, href]) => {
            if (document.querySelector(`link[data-tiers-icons="${key}"]`)) return;
            const iconLink = document.createElement('link');
            iconLink.rel = 'stylesheet'; iconLink.href = href; iconLink.dataset.tiersIcons = key;
            document.head.appendChild(iconLink);
        });
        window.tailwind = window.tailwind || {};
        window.tailwind.config = tiersTailwindConfig;
        if (!document.querySelector('script[src*="cdn.tailwindcss.com"]')) {
            const tailwindScript = document.createElement('script');
            tailwindScript.src = PROFILE_ASSETS.tailwind; tailwindScript.async = true;
            document.head.appendChild(tailwindScript);
        }

        return () => {
            if (toastTimer.current) window.clearTimeout(toastTimer.current);
        };
    }, []);

    const openChatbot = (initialMessage) => {
        window.dispatchEvent(new CustomEvent('halm-open-chatbot', { detail: { message: initialMessage || 'Xin chào, tôi cần tư vấn về các hạng thành viên!' } }));
    };

    const showToast = (title, message, type = 'info') => {
        if (window.halmToast) {
            const lower = (title || '').toLowerCase();
            if (type === 'success' || lower.includes('thành công') || lower.includes('sao chép')) {
                window.halmToast.success(title, message);
            } else if (type === 'error' || lower.includes('thất bại') || lower.includes('lỗi')) {
                window.halmToast.error(title, message);
            } else {
                window.halmToast.info(title, message);
            }
        }
    };
    const copyInviteLink = async () => {
        try {
            await navigator.clipboard.writeText('https://halmbook.vn/invite?ref=alex99');
            showToast("Sao Chép Thành Công", "Liên kết mời bạn bè đã được lưu vào clipboard!");
        } catch {
            showToast("Mã Mời Bạn Bè", "Mã giới thiệu của bạn: ALEX99");
        }
    };
    const openTierModal = (type) => { if (tierData[type]) setActiveTier(type); };
    const closeTierModal = () => setActiveTier(null);

    const customerNameDisplay = customer?.customerName || tierSummary?.customerName || 'Độc Giả HALM';
    const customerIdDisplay = formatCustomerId(customer?.customerId || customer?.customer_id || tierSummary?.customerId || tierSummary?.formattedMemberCode);
    const avatarSrc = customer?.avatar || customer?.avatarUrl || tierSummary?.avatarUrl;
    const potatoBalanceDisplay = customer?.potatoBalance ?? tierSummary?.potatoBalance ?? 0;

    // Xác định chính xác cấp bậc thành viên thực tế của người dùng (1, 2, 3, 4)
    const userTierLevel = getTierLevel(tierSummary?.currentTier || customer?.membershipTier);

    return (
        <>
            <style>{inlinePageStyle1}</style>
            <UserLayout className="tiers-page" onOpenChatbot={openChatbot} onThemeChange={setIsDark}>
                <div id="starry-background" aria-hidden="true">
                    {stars.map((star) => (
                        <div key={star.id} className="star" style={{
                            width: `${star.size}px`, height: `${star.size}px`,
                            top: `${star.top}%`, left: `${star.left}%`,
                            animation: `starTwinkle ${star.duration}s infinite ease-in-out ${star.delay}s`,
                        }} />
                    ))}
                </div>



                <main className="w-full max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 sm:pt-28 sm:pb-20 flex-1">
                    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">


                        {/* LEFT SIDEBAR - FIXED/STICKY CONTAINER */}
                        <aside onMouseEnter={prefetchUserRoutes} onFocus={prefetchUserRoutes} className="w-full lg:w-80 shrink-0 space-y-4 lg:sticky lg:top-24 lg:self-start">

                            {/* 1. Profile Avatar Card */}
                            <div className="rounded-3xl user-sidebar-card bg-paper-surface dark:bg-night-surface border border-paper-border dark:border-night-border p-6 shadow-sm flex flex-col items-center text-center relative overflow-hidden group">
                                <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>

                                {/* Avatar with Dynamic Tier Frame - Bo sát theo vòng cung tròn */}
                                <AvatarWithFrame
                                    avatarSrc={avatarSrc}
                                    name={customerNameDisplay}
                                    tier={tierSummary?.currentTier || customer?.membershipTier}
                                    potatoBalance={potatoBalanceDisplay}
                                    booksCount={tierSummary?.booksReadCount ?? 0}
                                    size="lg"
                                />

                                <h2 className="font-display font-black text-2xl text-stone-900 dark:!text-[#EDE9DF] leading-tight">
                                    {customerNameDisplay}
                                </h2>
                                <p className="font-metadata-spec text-xs text-stone-500 dark:!text-[#9CA3AF] mt-1">
                                    {customerIdDisplay}
                                </p>

                                <div className={`mt-3.5 inline-flex items-center gap-1.5 px-4 py-1 rounded-full text-xs font-metadata-spec font-bold ${getTierBadgeClass(tierSummary?.currentTier || customer?.membershipTier, potatoBalanceDisplay, tierSummary?.booksReadCount ?? 0)}`} title="Hạng hiện tại">
                                    <i className={`ph-bold ${getTierInfo(tierSummary?.currentTier || customer?.membershipTier, potatoBalanceDisplay, tierSummary?.booksReadCount ?? 0).icon}`}></i>
                                    <span>{getTierInfo(tierSummary?.currentTier || customer?.membershipTier, potatoBalanceDisplay, tierSummary?.booksReadCount ?? 0).name}</span>
                                </div>

                                {/* Divider */}
                                <div className="w-full h-px bg-paper-border dark:bg-night-border my-5"></div>

                                <div className="grid grid-cols-3 gap-2 w-full text-center">
                                    <Link to="/canhan?tab=wallet" className="py-3 px-2 rounded-2xl user-sidebar-box bg-paper dark:bg-night-surface border border-paper-border dark:border-night-border hover:border-gold transition-colors flex flex-col justify-center">
                                        <span className="block font-metadata-spec text-base sm:text-lg font-black text-stone-900 dark:!text-[#EDE9DF]" style={{ color: isDark ? '#EDE9DF' : undefined }}>{potatoBalanceDisplay.toLocaleString()}</span>
                                        <span className="font-metadata-spec text-[10px] text-stone-500 dark:!text-[#9CA3AF] mt-0.5 font-bold" style={{ color: isDark ? '#9CA3AF' : undefined }}>Khoai</span>
                                    </Link>
                                    <Link to="/tusachcn" className="py-3 px-2 rounded-2xl user-sidebar-box bg-paper dark:bg-night-surface border border-paper-border dark:border-night-border hover:border-wine dark:hover:border-gold transition-colors flex flex-col justify-center">
                                        <span className="block font-metadata-spec text-base sm:text-lg font-black text-stone-900 dark:!text-[#EDE9DF]" style={{ color: isDark ? '#EDE9DF' : undefined }}>
                                            {tierSummary?.booksReadCount ?? 0}
                                        </span>
                                        <span className="font-metadata-spec text-[10px] text-stone-500 dark:!text-[#9CA3AF] mt-0.5 font-bold" style={{ color: isDark ? '#9CA3AF' : undefined }}>Tủ Sách</span>
                                    </Link>
                                    <Link to="/canhan?tab=vouchers" className="py-3 px-2 rounded-2xl user-sidebar-box bg-paper dark:bg-night-surface border border-paper-border dark:border-night-border hover:border-gold transition-colors flex flex-col justify-center items-center">
                                        <i className="ph-bold ph-ticket text-lg text-amber-500 dark:text-gold mb-0.5"></i>
                                        <span className="font-metadata-spec text-[10px] text-stone-500 dark:!text-[#9CA3AF] font-bold" style={{ color: isDark ? '#9CA3AF' : undefined }}>Voucher</span>
                                    </Link>
                                </div>
                            </div>

                            {/* 2. Navigation Menu Card - STRICT ORDER */}
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
                                    <span className="px-3 py-1 rounded-full bg-paper-200 dark:bg-[#242116] border border-paper-border dark:border-[#52441D] text-amber-600 dark:text-[#D8B44A] text-xs font-bold font-metadata-spec">{tierSummary?.booksReadCount ?? 0} cuốn</span>
                                </Link>

                                {/* 3. Hạng Thành Viên (ACTIVE TRÊN TRANG NÀY) - BỎ PILL ĐỂ TRÁNH CHẬT CHỘI */}
                                <div
                                    className="w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-metadata-spec font-black bg-[#C28807] text-[#111210] shadow-md transition-colors cursor-default"
                                >
                                    <div className="flex items-center gap-3.5">
                                        <i className="ph-bold ph-trophy text-lg text-[#111210]"></i>
                                        <span className="font-bold text-sm">Hạng Thành Viên</span>
                                    </div>
                                    <i className="ph-bold ph-caret-right text-xs text-[#111210]"></i>
                                </div>

                                {/* 3.5. Nhiệm Vụ Hằng Ngày */}
                                <Link
                                    to="/nhiemvu"
                                    className="w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-metadata-spec font-bold text-ink-muted dark:text-stone-300 hover:bg-paper-200 dark:hover:bg-stone-800/40 hover:text-ink dark:hover:text-white transition-colors"
                                >
                                    <div className="flex items-center gap-3.5">
                                        <i className="ph-bold ph-target text-lg text-stone-400"></i>
                                        <span>Nhiệm Vụ Hằng Ngày</span>
                                    </div>
                                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-paper-200 dark:bg-[#242116] border border-paper-border dark:border-[#52441D] text-amber-600 dark:text-[#D8B44A] text-xs font-bold">Streak 🔥</span>
                                </Link>

                                {/* 4. Ví Khoai Tây */}
                                <Link
                                    to="/canhan?tab=wallet"
                                    className="w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-metadata-spec font-bold text-ink-muted dark:text-stone-300 hover:bg-paper-200 dark:hover:bg-stone-800/40 hover:text-ink dark:hover:text-white transition-colors"
                                >
                                    <div className="flex items-center gap-3.5">
                                        <i className="ph-bold ph-wallet text-lg text-stone-400"></i>
                                        <span>Ví Khoai Tây</span>
                                    </div>
                                    <span className="px-3 py-1 rounded-full bg-paper-200 dark:bg-[#242116] border border-paper-border dark:border-[#52441D] text-amber-600 dark:text-[#D8B44A] text-xs font-bold font-metadata-spec">{potatoBalanceDisplay.toLocaleString()} 🥔</span>
                                </Link>

                                {/* 4.5. Kho Voucher Của Tôi */}
                                <Link
                                    to="/canhan?tab=vouchers"
                                    className="w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs font-metadata-spec font-bold text-ink-muted dark:text-stone-300 hover:bg-paper-200 dark:hover:bg-stone-800/40 hover:text-ink dark:hover:text-white transition-colors"
                                >
                                    <i className="ph-bold ph-ticket text-lg text-stone-400"></i>
                                    <span>Kho Voucher Của Tôi</span>
                                </Link>

                                {/* 5. Lịch Sử Giao Dịch */}
                                <Link
                                    to="/canhan?tab=history"
                                    className="w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs font-metadata-spec font-bold text-ink-muted dark:text-stone-300 hover:bg-paper-200 dark:hover:bg-stone-800/40 hover:text-ink dark:hover:text-white transition-colors"
                                >
                                    <i className="ph-bold ph-clock-counter-clockwise text-lg text-stone-400"></i>
                                    <span>Lịch Sử Giao Dịch</span>
                                </Link>

                                {/* 6. Khiếu Nại & Hỗ Trợ */}
                                <Link
                                    to="/canhan?tab=support"
                                    className="w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs font-metadata-spec font-bold text-ink-muted dark:text-stone-300 hover:bg-paper-200 dark:hover:bg-stone-800/40 hover:text-ink dark:hover:text-white transition-colors"
                                >
                                    <i className="ph-bold ph-headset text-lg text-stone-400"></i>
                                    <span>Khiếu Nại & Hỗ Trợ</span>
                                </Link>

                                <div className="my-2 border-t border-paper-border dark:border-[#2C2E29]"></div>

                                {/* 6. Đăng Xuất */}
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

                        </aside>



                        <div className="flex-1 min-w-0 w-full space-y-8">


                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-paper-border dark:border-night-border">
                                <div>
                                    <div className="flex items-center gap-2 text-xs font-metadata-spec text-ink-muted dark:text-night-muted mb-1">
                                        <Link to="/" className="hover:underline">Trang chủ</Link>
                                        <i className="ph-bold ph-caret-right text-[10px]"></i>
                                        <span>Hội viên</span>
                                        <i className="ph-bold ph-caret-right text-[10px]"></i>
                                        <span className="text-wine dark:text-gold font-bold">Hệ Thống Cấp Bậc</span>
                                    </div>
                                    <h1 className="font-display font-black text-2xl sm:text-3xl text-ink dark:text-night-text tracking-tight flex items-center gap-2.5">
                                        Hạng Thành Viên & Đặc Quyền Độc Giả 🏆
                                    </h1>
                                </div>


                                <div className="shrink-0 flex items-center gap-2">
                                    <button
                                        type="button"
                                        disabled={isCheckingIn || tierSummary?.hasCheckedInToday}
                                        onClick={handleDailyCheckin}
                                        className={`px-4 py-2.5 rounded-xl text-xs font-metadata-spec font-bold transition-all flex items-center gap-1.5 shadow-sm ${
                                            tierSummary?.hasCheckedInToday
                                                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                                                : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-amber-500/20'
                                        }`}
                                    >
                                        <i className={`ph-fill ${tierSummary?.hasCheckedInToday ? 'ph-check-circle' : 'ph-fire'} text-sm`}></i>
                                        <span>{tierSummary?.hasCheckedInToday ? `Đã Điểm Danh (${tierSummary?.streakDays || 1} Ngày 🔥)` : 'Điểm Danh Nhận +5 Khoai & +20 XP 🔥'}</span>
                                    </button>
                                </div>
                            </div>



                            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">


                                <div className="xl:col-span-5 flex flex-col">
                                    <div className="member-card-3d p-6 sm:p-7 text-white flex-1 flex flex-col justify-between relative overflow-hidden min-h-[250px]">

                                        <div className="absolute -right-10 -bottom-10 w-44 h-44 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none"></div>


                                        <div className="flex items-center justify-between relative z-10">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center p-1">
                                                    <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" onError={handleLogoError} />
                                                </div>
                                                <div>
                                                    <span className="font-display font-black text-sm tracking-wide block leading-none">HALM BOOK</span>
                                                    <span className="font-metadata-spec text-[8px] uppercase tracking-widest text-emerald-400 font-bold">Reader Pass</span>
                                                </div>
                                            </div>


                                            <div className="w-10 h-7 rounded bg-gradient-to-tr from-amber-300 via-amber-200 to-amber-400 border border-amber-500/40 shadow-inner flex items-center justify-center relative overflow-hidden">
                                                <div className="w-full h-[1px] bg-amber-600/40 absolute top-2"></div>
                                                <div className="w-full h-[1px] bg-amber-600/40 absolute bottom-2"></div>
                                                <div className="h-full w-[1px] bg-amber-600/40 absolute left-3"></div>
                                                <div className="h-full w-[1px] bg-amber-600/40 absolute right-3"></div>
                                            </div>
                                        </div>


                                        <div className="my-5 relative z-10">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                                                <span className="font-metadata-spec text-[10px] uppercase tracking-[0.25em] text-emerald-300 font-bold">Cấp Bậc Hiện Tại</span>
                                            </div>
                                            <div className="flex items-baseline gap-3">
                                                <h3 className="font-display font-black text-2xl sm:text-3xl tracking-tight text-white flex items-center gap-2">
                                                    {getCleanTierName(tierSummary?.currentTier, potatoBalanceDisplay, tierSummary?.booksReadCount).toUpperCase()}
                                                </h3>
                                                <span className="font-metadata-spec text-xs font-bold text-slate-400">TIER {userTierLevel}</span>
                                            </div>
                                        </div>


                                        <div className="flex items-end justify-between relative z-10 pt-3 border-t border-white/15">
                                            <div>
                                                <span className="font-metadata-spec text-[9px] uppercase tracking-wider text-slate-400 block font-semibold">Chủ thẻ thành viên</span>
                                                <span className="font-display font-black text-sm tracking-wide text-white uppercase">{tierSummary?.customerName || customerNameDisplay}</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="font-metadata-spec text-[9px] uppercase tracking-wider text-slate-400 block font-semibold">Mã thành viên</span>
                                                <span className="font-metadata-spec text-xs font-mono font-bold text-amber-300 tracking-wider">{tierSummary?.formattedMemberCode || 'HALM-VIP-VN'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>


                                <div className="xl:col-span-7 rounded-2xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border p-6 sm:p-7 shadow-sm flex flex-col justify-between">
                                    <div>

                                        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-paper-border dark:border-night-border">
                                            <div>
                                                <span className="font-metadata-spec text-xs font-bold uppercase tracking-wider text-ink-muted dark:text-night-muted">Hành trình thăng hạng</span>
                                                <h3 className="font-display font-black text-xl text-ink dark:text-night-text mt-0.5 flex items-center gap-2">
                                                    Mục tiêu kế tiếp: <span className="text-wine dark:text-gold">{userTierLevel >= 4 ? 'Cấp Bậc Tối Thượng' : getCleanTierName(tierSummary?.nextTier || (userTierLevel === 3 ? 'Đại Điền Chủ' : (userTierLevel === 2 ? 'Lão Nông' : 'Cao Thủ Cày')))}</span>
                                                </h3>
                                            </div>
                                            <span className="potato-badge text-xs font-bold">
                                                <i className="ph-bold ph-shield-check text-emerald-600 dark:text-emerald-400"></i>
                                                <span>Bảo Lưu Vĩnh Viễn</span>
                                            </span>
                                        </div>


                                        <div className="mt-5 space-y-2">
                                            <div className="flex items-center justify-between text-xs font-metadata-spec font-bold">
                                                <span className="text-ink dark:text-night-text flex items-center gap-1.5">
                                                    <i className="ph-bold ph-book-open text-wine dark:text-gold"></i>
                                                    Tiến trình đọc: <strong>{tierSummary?.booksReadCount ?? 0} / {tierSummary?.booksRequiredForNext ?? 10} Cuốn sách ({tierSummary?.totalPoints ?? 0} XP)</strong>
                                                </span>
                                                <span className="text-wine dark:text-gold font-extrabold text-sm">{tierSummary?.overallProgressPercent ?? 0}% Hoàn Thành</span>
                                            </div>


                                            <div className="w-full h-4 rounded-full bg-paper-200 dark:bg-night-border p-0.5 overflow-hidden shadow-inner">
                                                <div className="h-full rounded-full bg-gradient-to-r from-wine to-wine-light dark:from-gold dark:to-gold-light progress-striped transition-all duration-700" style={{ width: `${Math.max(5, tierSummary?.overallProgressPercent ?? 0)}%` }}></div>
                                            </div>

                                            <div className="flex items-center justify-between text-[11px] font-metadata-spec text-ink-muted dark:text-night-muted pt-1">
                                                <span>{getCleanTierName(tierSummary?.currentTier, potatoBalanceDisplay, tierSummary?.booksReadCount)}</span>
                                                <span className="font-bold text-wine dark:text-gold">
                                                    {userTierLevel >= 4 ? 'Đạt đỉnh cao danh dự!' : `Chỉ còn ${tierSummary?.booksRemainingForNext ?? 0} cuốn sách (hoặc ${tierSummary?.pointsRemainingForNext ?? 0} XP)`}
                                                </span>
                                                <span>{userTierLevel >= 4 ? 'Đại Điền Chủ 👑' : getCleanTierName(tierSummary?.nextTier || (userTierLevel === 3 ? 'Đại Điền Chủ' : (userTierLevel === 2 ? 'Lão Nông' : 'Cao Thủ Cày')))}</span>
                                            </div>
                                        </div>
                                    </div>


                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5 mt-5 border-t border-paper-border dark:border-night-border">
                                        <div className="p-3 rounded-xl bg-paper dark:bg-night-surface border border-paper-border dark:border-night-border text-center">
                                            <span className="font-metadata-spec text-[10px] font-bold uppercase text-ink-muted dark:text-night-muted block">Sách đã cày</span>
                                            <span className="font-display font-black text-lg text-ink dark:text-night-text mt-0.5 block">{tierSummary?.booksReadCount ?? 0} <span className="text-xs font-normal text-ink-muted dark:text-night-muted">cuốn</span></span>
                                        </div>
                                        <div className="p-3 rounded-xl bg-paper dark:bg-night-surface border border-paper-border dark:border-night-border text-center">
                                            <span className="font-metadata-spec text-[10px] font-bold uppercase text-ink-muted dark:text-night-muted block">Điểm cày (XP)</span>
                                            <span className="font-display font-black text-lg text-ink dark:text-night-text mt-0.5 block">{tierSummary?.totalPoints ?? 0} <span className="text-xs font-normal text-gold">XP</span></span>
                                        </div>
                                        <div className="p-3 rounded-xl bg-paper dark:bg-night-surface border border-paper-border dark:border-night-border text-center">
                                            <span className="font-metadata-spec text-[10px] font-bold uppercase text-ink-muted dark:text-night-muted block">Chuỗi đọc</span>
                                            <span className="font-display font-black text-lg text-amber-500 mt-0.5 block flex items-center justify-center gap-0.5">{tierSummary?.streakDays ?? 0} <i className="ph-fill ph-fire text-base"></i></span>
                                        </div>
                                        <div className="p-3 rounded-xl bg-paper dark:bg-night-surface border border-paper-border dark:border-night-border text-center">
                                            <span className="font-metadata-spec text-[10px] font-bold uppercase text-ink-muted dark:text-night-muted block">Chiết khấu</span>
                                            <span className="font-display font-black text-lg text-emerald-600 dark:text-emerald-400 mt-0.5 block">{(tierSummary?.discountPercent ?? 0) > 0 ? `Giảm ${tierSummary.discountPercent}%` : 'Cơ bản (0%)'}</span>
                                        </div>
                                    </div>
                                </div>

                            </div>



                            {/* ==================== 1. HỆ THỐNG 4 CẤP BẬC ĐỘC GIẢ (COMPACT VIP TIERS) ==================== */}
                            <div className="space-y-4 pt-2">
                                <div className="flex items-center justify-between gap-3">
                                    <h2 className="font-display font-black text-xl text-ink dark:text-night-text">
                                        Hệ Thống 4 Cấp Bậc Độc Giả
                                    </h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 pt-2">
                                    {/* CẤP I: THỢ CÀY */}
                                    <div
                                        onClick={() => openTierModal("tier2")}
                                        className={`rounded-2xl bg-paper-surface dark:bg-[#181916] p-5 flex flex-col justify-between relative cursor-pointer group transition-all duration-300 hover:shadow-lg ${
                                            userTierLevel === 1
                                                ? 'border-2 border-[#C28807] dark:border-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.2)]'
                                                : 'border border-paper-border dark:border-[#2C2E29]'
                                        }`}
                                    >
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 px-3 py-0.5 rounded-full text-[10px] font-metadata-spec font-bold uppercase tracking-wider whitespace-nowrap shadow-sm border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                            {userTierLevel === 1 ? 'Hạng Hiện Tại 📍' : 'Đã Đạt Chuẩn ✓'}
                                        </div>
                                        <div>
                                            <div className="flex items-center justify-between mb-3 mt-1">
                                                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl border border-emerald-500/20">
                                                    🌱
                                                </div>
                                                <span className="font-metadata-spec text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                                    Cấp I • Mầm Đọc
                                                </span>
                                            </div>
                                            <h3 className="font-display font-black text-lg text-ink dark:text-night-text">Thợ Cày</h3>
                                            <p className="font-metadata-spec text-[11px] font-bold text-ink-muted dark:text-stone-400 mt-0.5">
                                                Yêu cầu: <span className="text-emerald-600 dark:text-emerald-400 font-black">Tạo tài khoản mới</span>
                                            </p>
                                            <div className="my-3 pt-2.5 border-t border-paper-border dark:border-[#2C2E29] space-y-2 text-xs font-editorial-body text-ink/80 dark:text-stone-300">
                                                <div className="flex items-start gap-1.5">
                                                    <i className="ph-bold ph-check text-emerald-600 dark:text-emerald-400 text-xs shrink-0 mt-0.5"></i>
                                                    <span>Mượn đồng thời <strong>2 cuốn/lần</strong></span>
                                                </div>
                                                <div className="flex items-start gap-1.5">
                                                    <i className="ph-bold ph-check text-emerald-600 dark:text-emerald-400 text-xs shrink-0 mt-0.5"></i>
                                                    <span>Mở khóa <strong>Ví Khoai</strong> tích lũy thưởng</span>
                                                </div>
                                                <div className="flex items-start gap-1.5">
                                                    <i className="ph-bold ph-check text-emerald-600 dark:text-emerald-400 text-xs shrink-0 mt-0.5"></i>
                                                    <span>Thưởng <strong>+10 Khoai 🥔</strong>/sách đọc xong</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="pt-2 text-center border-t border-paper-border dark:border-[#2C2E29]/50">
                                            <span className="text-[11px] font-metadata-spec font-bold text-wine dark:text-gold group-hover:underline flex items-center justify-center gap-1">
                                                <span>Xem chi tiết lộ trình</span>
                                                <i className="ph-bold ph-caret-right text-xs"></i>
                                            </span>
                                        </div>
                                    </div>

                                    {/* CẤP II: CAO THỦ CÀY */}
                                    <div
                                        onClick={() => openTierModal("tier2")}
                                        className={`rounded-2xl bg-paper-surface dark:bg-[#181916] p-5 flex flex-col justify-between relative cursor-pointer group transition-all duration-300 hover:shadow-lg ${
                                            userTierLevel === 2
                                                ? 'border-2 border-[#C28807] dark:border-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.2)]'
                                                : 'border border-paper-border dark:border-[#2C2E29]'
                                        }`}
                                    >
                                        <div className={`absolute -top-3 left-1/2 -translate-x-1/2 z-10 px-3 py-0.5 rounded-full text-[10px] font-metadata-spec font-bold uppercase tracking-wider whitespace-nowrap shadow-sm border ${
                                            userTierLevel === 2
                                                ? 'bg-[#C28807] text-[#111210] border-amber-300/40'
                                                : userTierLevel > 2
                                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                                    : 'bg-paper-200 dark:bg-night-surface text-ink-muted dark:text-stone-400 border-paper-border dark:border-night-border'
                                        }`}>
                                            {userTierLevel === 2 ? 'Hạng Hiện Tại 📍' : userTierLevel > 2 ? 'Đã Đạt Chuẩn ✓' : `Còn ${Math.max(0, 10 - (tierSummary?.booksReadCount ?? 0))} cuốn`}
                                        </div>
                                        <div>
                                            <div className="flex items-center justify-between mb-3 mt-1">
                                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center text-xl border border-blue-500/20">
                                                    🚜
                                                </div>
                                                <span className="font-metadata-spec text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">
                                                    Cấp II • Tri Thức
                                                </span>
                                            </div>
                                            <h3 className="font-display font-black text-lg text-ink dark:text-night-text">Cao Thủ Cày</h3>
                                            <p className="font-metadata-spec text-[11px] font-bold text-ink-muted dark:text-stone-400 mt-0.5">
                                                Yêu cầu: <span className="text-blue-600 dark:text-blue-400 font-black">10 cuốn</span> (hoặc 1.000 XP)
                                            </p>
                                            <div className="my-3 pt-2.5 border-t border-paper-border dark:border-[#2C2E29] space-y-2 text-xs font-editorial-body text-ink/80 dark:text-stone-300">
                                                <div className="flex items-start gap-1.5">
                                                    <i className="ph-bold ph-check text-blue-500 text-xs shrink-0 mt-0.5"></i>
                                                    <span>Chiết khấu <strong>giảm 5% trọn đời</strong></span>
                                                </div>
                                                <div className="flex items-start gap-1.5">
                                                    <i className="ph-bold ph-check text-blue-500 text-xs shrink-0 mt-0.5"></i>
                                                    <span>Mượn tối đa <strong>5 cuốn/lần (14 ngày)</strong></span>
                                                </div>
                                                <div className="flex items-start gap-1.5">
                                                    <i className="ph-bold ph-check text-blue-500 text-xs shrink-0 mt-0.5"></i>
                                                    <span>Đọc trước sách mới <strong>trước 3 ngày</strong></span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="pt-2 text-center border-t border-paper-border dark:border-[#2C2E29]/50">
                                            <span className="text-[11px] font-metadata-spec font-bold text-wine dark:text-gold group-hover:underline flex items-center justify-center gap-1">
                                                <span>Xem chi tiết lộ trình</span>
                                                <i className="ph-bold ph-caret-right text-xs"></i>
                                            </span>
                                        </div>
                                    </div>

                                    {/* CẤP III: LÃO NÔNG */}
                                    <div
                                        onClick={() => openTierModal("tier3")}
                                        className={`rounded-2xl bg-paper-surface dark:bg-[#181916] p-5 flex flex-col justify-between relative cursor-pointer group transition-all duration-300 hover:shadow-lg ${
                                            userTierLevel === 3
                                                ? 'border-2 border-[#C28807] dark:border-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.2)]'
                                                : 'border border-paper-border dark:border-[#2C2E29]'
                                        }`}
                                    >
                                        <div className={`absolute -top-3 left-1/2 -translate-x-1/2 z-10 px-3 py-0.5 rounded-full text-[10px] font-metadata-spec font-bold uppercase tracking-wider whitespace-nowrap shadow-sm border ${
                                            userTierLevel === 3
                                                ? 'bg-[#C28807] text-[#111210] border-amber-300/40'
                                                : userTierLevel > 3
                                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                                    : 'bg-paper-200 dark:bg-night-surface text-ink-muted dark:text-stone-400 border-paper-border dark:border-night-border'
                                        }`}>
                                            {userTierLevel === 3 ? 'Hạng Hiện Tại 📍' : userTierLevel > 3 ? 'Đã Đạt Chuẩn ✓' : `Còn ${Math.max(0, 30 - (tierSummary?.booksReadCount ?? 0))} cuốn`}
                                        </div>
                                        <div>
                                            <div className="flex items-center justify-between mb-3 mt-1">
                                                <div className="w-10 h-10 rounded-xl bg-gold/15 text-gold flex items-center justify-center text-xl border border-gold/30">
                                                    🌾
                                                </div>
                                                <span className="font-metadata-spec text-[11px] font-bold text-gold bg-gold/15 px-2 py-0.5 rounded-full">
                                                    Cấp III • Tinh Hoa
                                                </span>
                                            </div>
                                            <h3 className="font-display font-black text-lg text-ink dark:text-night-text">Lão Nông</h3>
                                            <p className="font-metadata-spec text-[11px] font-bold text-ink-muted dark:text-stone-400 mt-0.5">
                                                Yêu cầu: <span className="text-gold font-black">30 cuốn</span> (hoặc 3.000 XP)
                                            </p>
                                            <div className="my-3 pt-2.5 border-t border-paper-border dark:border-[#2C2E29] space-y-2 text-xs font-editorial-body text-ink/80 dark:text-stone-300">
                                                <div className="flex items-start gap-1.5">
                                                    <i className="ph-bold ph-check text-gold text-xs shrink-0 mt-0.5"></i>
                                                    <span>Chiết khấu <strong>giảm 10% trọn đời</strong></span>
                                                </div>
                                                <div className="flex items-start gap-1.5">
                                                    <i className="ph-bold ph-check text-gold text-xs shrink-0 mt-0.5"></i>
                                                    <span>Mượn tối đa <strong>10 cuốn/lần (30 ngày)</strong></span>
                                                </div>
                                                <div className="flex items-start gap-1.5">
                                                    <i className="ph-bold ph-check text-gold text-xs shrink-0 mt-0.5"></i>
                                                    <span>Khung avatar Tinh Hoa & <strong>Hotline VIP 24/7</strong></span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="pt-2 text-center border-t border-paper-border dark:border-[#2C2E29]/50">
                                            <span className="text-[11px] font-metadata-spec font-bold text-wine dark:text-gold group-hover:underline flex items-center justify-center gap-1">
                                                <span>Xem chi tiết lộ trình</span>
                                                <i className="ph-bold ph-caret-right text-xs"></i>
                                            </span>
                                        </div>
                                    </div>

                                    {/* CẤP IV: ĐẠI ĐIỀN CHỦ */}
                                    <div
                                        onClick={() => openTierModal("tier4")}
                                        className={`rounded-2xl bg-paper-surface dark:bg-[#181916] p-5 flex flex-col justify-between relative cursor-pointer group transition-all duration-300 hover:shadow-lg ${
                                            userTierLevel >= 4
                                                ? 'border-2 border-[#C28807] dark:border-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.3)]'
                                                : 'border border-paper-border dark:border-[#2C2E29]'
                                        }`}
                                    >
                                        <div className={`absolute -top-3 left-1/2 -translate-x-1/2 z-10 px-3 py-0.5 rounded-full text-[10px] font-metadata-spec font-bold uppercase tracking-wider whitespace-nowrap shadow-sm border ${
                                            userTierLevel >= 4
                                                ? 'bg-[#C28807] text-[#111210] border-amber-300/40'
                                                : 'bg-paper-200 dark:bg-night-surface text-ink-muted dark:text-stone-400 border-paper-border dark:border-night-border'
                                        }`}>
                                            {userTierLevel >= 4 ? 'Hạng Hiện Tại 📍' : `Còn ${Math.max(0, 80 - (tierSummary?.booksReadCount ?? 0))} cuốn`}
                                        </div>
                                        <div>
                                            <div className="flex items-center justify-between mb-3 mt-1">
                                                <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center text-xl border border-amber-500/30">
                                                    👑
                                                </div>
                                                <span className="font-metadata-spec text-[11px] font-bold text-amber-500 bg-amber-500/15 px-2 py-0.5 rounded-full">
                                                    Cấp IV • VIP Tối Thượng
                                                </span>
                                            </div>
                                            <h3 className="font-display font-black text-lg text-ink dark:text-night-text">Đại Điền Chủ</h3>
                                            <p className="font-metadata-spec text-[11px] font-bold text-ink-muted dark:text-stone-400 mt-0.5">
                                                Yêu cầu: <span className="text-amber-500 font-black">80 cuốn</span> (hoặc 8.000 XP)
                                            </p>
                                            <div className="my-3 pt-2.5 border-t border-paper-border dark:border-[#2C2E29] space-y-2 text-xs font-editorial-body text-ink/80 dark:text-stone-300">
                                                <div className="flex items-start gap-1.5">
                                                    <i className="ph-bold ph-check text-amber-500 text-xs shrink-0 mt-0.5"></i>
                                                    <span>Chiết khấu <strong>giảm 20% toàn sàn</strong></span>
                                                </div>
                                                <div className="flex items-start gap-1.5">
                                                    <i className="ph-bold ph-check text-amber-500 text-xs shrink-0 mt-0.5"></i>
                                                    <span>Mượn <strong>không giới hạn (60 ngày)</strong></span>
                                                </div>
                                                <div className="flex items-start gap-1.5">
                                                    <i className="ph-bold ph-check text-amber-500 text-xs shrink-0 mt-0.5"></i>
                                                    <span>Chuyên viên VIP 1-on-1 & Quà tận nhà</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="pt-2 text-center border-t border-paper-border dark:border-[#2C2E29]/50">
                                            <span className="text-[11px] font-metadata-spec font-bold text-wine dark:text-gold group-hover:underline flex items-center justify-center gap-1">
                                                <span>Xem chi tiết lộ trình</span>
                                                <i className="ph-bold ph-caret-right text-xs"></i>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ==================== 2. BẢNG SO SÁNH QUYỀN LỢI CHI TIẾT ==================== */}
                            <div className="rounded-3xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border p-6 shadow-sm space-y-4">
                                <h3 className="font-display font-black text-lg text-ink dark:text-night-text flex items-center gap-2">
                                    <i className="ph-bold ph-table text-wine dark:text-gold"></i>
                                    Bảng So Sánh Quyền Lợi Chi Tiết Giữa Các Cấp
                                </h3>

                                <div className="overflow-x-auto text-xs font-metadata-spec">
                                    <table className="w-full text-left border-collapse min-w-[650px]">
                                        <thead>
                                            <tr className="border-b border-paper-border dark:border-night-border text-ink-muted dark:text-night-muted font-bold text-xs">
                                                <th className="py-3 px-4 w-1/4">Đặc Quyền Cốt Lõi</th>
                                                <th className="py-3 px-4 text-center text-emerald-600 dark:text-emerald-400">🌱 Thợ Cày</th>
                                                <th className="py-3 px-4 text-center text-blue-500">🚜 Cao Thủ Cày</th>
                                                <th className="py-3 px-4 text-center text-gold">🌾 Lão Nông</th>
                                                <th className="py-3 px-4 text-center text-amber-500 dark:text-amber-400 bg-gold/5 dark:bg-gold/10 rounded-t-lg">👑 Đại Điền Chủ</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-paper-border dark:divide-night-border">
                                            <tr className="hover:bg-paper dark:hover:bg-night-surface/50 transition-colors">
                                                <td className="py-3 px-4 font-bold">Mượn sách đồng thời</td>
                                                <td className="py-3 px-4 text-center font-bold text-emerald-600 dark:text-emerald-400">2 cuốn / lần</td>
                                                <td className="py-3 px-4 text-center font-bold">5 cuốn / lần</td>
                                                <td className="py-3 px-4 text-center font-bold text-gold">10 cuốn / lần</td>
                                                <td className="py-3 px-4 text-center font-black text-amber-600 dark:text-amber-400 bg-gold/5 dark:bg-gold/10">Không giới hạn</td>
                                            </tr>
                                            <tr className="hover:bg-paper dark:hover:bg-night-surface/50 transition-colors">
                                                <td className="py-3 px-4 font-bold">Chiết khấu thuê & mua sách</td>
                                                <td className="py-3 px-4 text-center">Giá niêm yết</td>
                                                <td className="py-3 px-4 text-center font-bold text-blue-500">Giảm 5% trọn đời</td>
                                                <td className="py-3 px-4 text-center font-bold text-gold">Giảm 10% trọn đời</td>
                                                <td className="py-3 px-4 text-center font-black text-amber-600 dark:text-amber-400 bg-gold/5 dark:bg-gold/10">Giảm 20% toàn sàn</td>
                                            </tr>
                                            <tr className="hover:bg-paper dark:hover:bg-night-surface/50 transition-colors">
                                                <td className="py-3 px-4 font-bold">Thời hạn mượn tối đa</td>
                                                <td className="py-3 px-4 text-center">7 ngày</td>
                                                <td className="py-3 px-4 text-center">14 ngày</td>
                                                <td className="py-3 px-4 text-center font-bold text-gold">30 ngày</td>
                                                <td className="py-3 px-4 text-center font-black text-amber-600 dark:text-amber-400 bg-gold/5 dark:bg-gold/10">60 ngày + Gia hạn free</td>
                                            </tr>
                                            <tr className="hover:bg-paper dark:hover:bg-night-surface/50 transition-colors">
                                                <td className="py-3 px-4 font-bold">Khoai thưởng khi xong sách</td>
                                                <td className="py-3 px-4 text-center font-bold">+10 Khoai 🥔</td>
                                                <td className="py-3 px-4 text-center font-bold">+20 Khoai 🥔</td>
                                                <td className="py-3 px-4 text-center font-bold text-gold">+40 Khoai 🥔</td>
                                                <td className="py-3 px-4 text-center font-black text-amber-600 dark:text-amber-400 bg-gold/5 dark:bg-gold/10">+80 Khoai 🥔</td>
                                            </tr>
                                            <tr className="hover:bg-paper dark:hover:bg-night-surface/50 transition-colors">
                                                <td className="py-3 px-4 font-bold">Đọc trước tác phẩm mới</td>
                                                <td className="py-3 px-4 text-center text-ink-muted">—</td>
                                                <td className="py-3 px-4 text-center">Trước 3 ngày</td>
                                                <td className="py-3 px-4 text-center font-bold text-gold">Trước 7 ngày</td>
                                                <td className="py-3 px-4 text-center font-bold text-amber-600 dark:text-amber-400 bg-gold/5 dark:bg-gold/10">Trước 14 ngày</td>
                                            </tr>
                                            <tr className="hover:bg-paper dark:hover:bg-night-surface/50 transition-colors">
                                                <td className="py-3 px-4 font-bold">Quà tri ân sinh nhật</td>
                                                <td className="py-3 px-4 text-center text-ink-muted">Voucher 5%</td>
                                                <td className="py-3 px-4 text-center">Voucher 10% + 20 Khoai</td>
                                                <td className="py-3 px-4 text-center font-bold text-gold">1 Ebook + 50 Khoai</td>
                                                <td className="py-3 px-4 text-center font-black text-amber-600 dark:text-amber-400 bg-gold/5 dark:bg-gold/10">Hộp quà ấn bản tận nhà</td>
                                            </tr>
                                            <tr className="hover:bg-paper dark:hover:bg-night-surface/50 transition-colors">
                                                <td className="py-3 px-4 font-bold">Khung Avatar & Huy hiệu danh dự</td>
                                                <td className="py-3 px-4 text-center">Mầm xanh 🌱</td>
                                                <td className="py-3 px-4 text-center">Huy hiệu Bạc 🚜</td>
                                                <td className="py-3 px-4 text-center font-bold text-gold">Khung Vàng Tinh Hoa 🌾</td>
                                                <td className="py-3 px-4 text-center font-black text-amber-600 dark:text-amber-400 bg-gold/5 dark:bg-gold/10">Khung 3D Hoàng Gia 👑</td>
                                            </tr>
                                            <tr className="hover:bg-paper dark:hover:bg-night-surface/50 transition-colors">
                                                <td className="py-3 px-4 font-bold">Chăm sóc & Hỗ trợ độc giả</td>
                                                <td className="py-3 px-4 text-center">Tiêu chuẩn</td>
                                                <td className="py-3 px-4 text-center">Ưu tiên hàng đợi 2h</td>
                                                <td className="py-3 px-4 text-center font-bold">Hotline VIP 24/7</td>
                                                <td className="py-3 px-4 text-center font-black text-amber-600 dark:text-amber-400 bg-gold/5 dark:bg-gold/10">Chuyên viên VIP 1-on-1</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* ==================== 3. BANNER TĂNG TỐC THĂNG HẠNG ==================== */}
                            <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-500/15 via-gold/10 to-transparent border border-amber-500/30 dark:border-gold/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 shadow-sm">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-[#C28807] text-[#111210] flex items-center justify-center text-2xl font-black shrink-0 shadow-md">
                                        <i className="ph-bold ph-lightning"></i>
                                    </div>
                                    <h3 className="font-display font-black text-lg text-ink dark:text-night-text">
                                        Tăng Tốc Thăng Hạng Cùng Nhiệm Vụ Hằng Ngày
                                    </h3>
                                </div>
                                <Link
                                    to="/nhiemvu"
                                    className="px-5 py-3 rounded-2xl bg-[#C28807] hover:bg-amber-500 text-[#111210] font-metadata-spec font-black text-xs flex items-center gap-2 transition-all shadow-md shrink-0 whitespace-nowrap"
                                >
                                    <i className="ph-bold ph-target text-base"></i>
                                    <span>Đến Trung Tâm Nhiệm Vụ</span>
                                    <i className="ph-bold ph-arrow-up-right text-xs"></i>
                                </Link>
                            </div>

                        </div>
                    </div>
                </main>

                <div id="tierModal" onClick={(event) => { if (event.target === event.currentTarget) closeTierModal(); }} className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm ${activeTier ? 'flex' : 'hidden'} items-center justify-center p-4`}>
                    <div className="bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border rounded-2xl max-w-lg w-full p-6 shadow-2xl relative transform transition-all">
                        <button type="button" onClick={closeTierModal} className="absolute top-4 right-4 text-ink-muted hover:text-ink dark:hover:text-white p-1 rounded-full hover:bg-paper-200 dark:hover:bg-night-border transition-colors">
                            <i className="ph-bold ph-x text-lg"></i>
                        </button>

                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-wine/10 dark:bg-gold/20 text-wine dark:text-gold flex items-center justify-center text-xl" id="modal-icon">
                                🏆
                            </div>
                            <div>
                                <h3 className="font-display font-black text-lg text-ink dark:text-night-text" id="modal-title">Thông Tin Cấp Bậc</h3>
                                <p className="font-metadata-spec text-xs text-ink-muted dark:text-night-muted" id="modal-subtitle">Quy chế & đặc quyền thành viên HALM BOOK</p>
                            </div>
                        </div>

                        <div className="font-editorial-body text-xs text-ink/80 dark:text-night-muted leading-relaxed space-y-3 py-2" id="modal-content">{renderTierContent(activeTier, tierSummary)}</div>

                        <div className="mt-6 pt-4 border-t border-paper-border dark:border-night-border flex items-center justify-end gap-3 font-metadata-spec text-xs">
                            <button type="button" onClick={closeTierModal} className="px-4 py-2 rounded-xl bg-paper-200 dark:bg-night-surface text-ink dark:text-night-text hover:bg-paper-border font-bold transition-colors">
                                Đóng
                            </button>
                            <Link to="/" className="px-4 py-2 rounded-xl bg-wine text-white dark:bg-gold dark:text-night-bg font-black hover:opacity-90 transition-opacity">
                                Khám Phá Sách Cày Cấp
                            </Link>
                        </div>
                    </div>
                </div>
            </UserLayout>
        </>
    );
}
