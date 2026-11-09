import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import UserLayout from './layout/UserLayout';
import { isDarkMode, applyTheme } from '@/utils/theme';
import { getMyTierSummary, checkinDailyStreak, getAllTiers } from '@/services/tierService';
import { getCurrentCustomer } from '@/services/customerService';
import { getTierInfo, formatCustomerId, getTierAvatarFrame, getTierBadgeClass } from '@/utils/tierUtils';
import AvatarWithFrame from '@/components/common/AvatarWithFrame';
import { clearAuthSession } from '@/services/authToken';

const tiersTailwindConfig = {
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

function getBotReply(userInput) {
    const query = userInput.toLowerCase();
    if (query.includes('cao thủ') || query.includes('lên hạng') || query.includes('thăng hạng')) {
        return <>Hạng hiện tại của bạn là <strong>THỢ CÀY 🌱</strong> (1/10 cuốn sách). Bạn chỉ cần cày thêm <strong>9 cuốn sách nữa</strong> để mở khóa hạng <strong>Cao Thủ Cày 🚜</strong> với quyền lợi giảm 5% phí thuê sách trọn đời!</>;
    }
    if (query.includes('đại điền chủ') || query.includes('hoàng gia') || query.includes('tối thượng')) {
        return <>Hạng <strong>ĐẠI ĐIỀN CHỦ 👑</strong> yêu cầu hoàn thành 150 cuốn sách hoặc 10.000 Khoai tích lũy. Bạn sẽ được giảm 20% toàn bộ dịch vụ, mượn sách VIP không giới hạn và nhận hộp quà ấn bản bìa cứng độc quyền gửi tận nhà hàng năm!</>;
    }
    if (query.includes('giáng cấp') || query.includes('hạ cấp') || query.includes('hết hạn')) {
        return <>HALM BOOK cam kết <strong>Bảo Lưu Vĩnh Viễn</strong> thứ hạng của bạn! Hạng không bao giờ bị hạ cấp theo thời gian hay chu kỳ năm.</>;
    }
    if (query.includes('khoai') || query.includes('số dư')) {
        return <>Số dư hiện tại của bạn là <strong>350 Khoai Tây 🥔</strong>. Bạn có thể dùng Khoai để thuê sách hoặc tham gia các gói cước ưu đãi tại trang <Link to="/#trending-section" className="text-gold underline font-bold">Ưu Đãi</Link>.</>;
    }
    return 'Tôi có thể hỗ trợ bạn tìm hiểu về 4 cấp bậc thành viên (Thợ Cày 🌱, Cao Thủ Cày 🚜, Lão Nông 🌾, Đại Điền Chủ 🏰), điều kiện thăng hạng hoặc các nhiệm vụ nhận XP!';
}


const getCleanTierName = (tier, balance = 0, books = 0) => getTierInfo(tier, balance, books).name;

export default function Tiers() {
    const navigate = useNavigate();
    const [isDark, setIsDark] = useState(() => isDarkMode());
    const [stars, setStars] = useState([]);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isScrollTopVisible, setIsScrollTopVisible] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [toast, setToast] = useState({ title: "Hạng Thành Viên", message: "Đã ghi nhận tương tác thành công." });
    const [toastVisible, setToastVisible] = useState(false);
    const [activeTier, setActiveTier] = useState(null);
    const [isTiersCollapsed, setIsTiersCollapsed] = useState(false);
    const [isComparisonCollapsed, setIsComparisonCollapsed] = useState(false);
    const [isComparisonPopupOpen, setIsComparisonPopupOpen] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatInput, setChatInput] = useState('');
    const [messages, setMessages] = useState([]);
    const messagesEndRef = useRef(null);
    const nextMessageId = useRef(0);
    const starsInitialized = useRef(false);
    const toastTimer = useRef(null);
    const pendingTimers = useRef(new Set());

    // Dữ liệu thực tế từ API Hạng Thành Viên & Điểm Cày
    const [customer, setCustomer] = useState(null);
    const [tierSummary, setTierSummary] = useState(null);
    const [allTiersList, setAllTiersList] = useState([]);
    const [isLoadingTier, setIsLoadingTier] = useState(true);
    const [isCheckingIn, setIsCheckingIn] = useState(false);

    const loadTierSummary = async () => {
        try {
            setIsLoadingTier(true);
            const [summary, tiers, cust] = await Promise.all([
                getMyTierSummary().catch(() => null),
                getAllTiers().catch(() => []),
                getCurrentCustomer().catch(() => null)
            ]);
            if (summary) setTierSummary(summary);
            if (Array.isArray(tiers) && tiers.length > 0) setAllTiersList(tiers);
            if (cust) setCustomer(cust);
        } catch (error) {
            console.error("Lỗi khi tải dữ liệu hạng thành viên:", error);
        } finally {
            setIsLoadingTier(false);
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
        const updateScrollState = () => {
            const scrollY = window.pageYOffset || document.documentElement.scrollTop;
            setIsScrolled(scrollY > 30);
            setIsScrollTopVisible(scrollY > 250);
        };
        window.addEventListener('scroll', updateScrollState, { passive: true });
        updateScrollState();
        return () => window.removeEventListener('scroll', updateScrollState);
    }, []);

    useEffect(() => {
        if (messages.length) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, [messages]);

    useEffect(() => () => {
        pendingTimers.current.forEach((timerId) => window.clearTimeout(timerId));
        pendingTimers.current.clear();
        if (toastTimer.current) window.clearTimeout(toastTimer.current);
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
    }, []);

    const addMessage = (sender, content) => setMessages((current) => [...current, { id: nextMessageId.current++, sender, content }]);
    const scheduleBotReply = (text) => {
        const timerId = window.setTimeout(() => {
            addMessage('bot', getBotReply(text)); pendingTimers.current.delete(timerId);
        }, 600);
        pendingTimers.current.add(timerId);
    };
    const openChatbot = (initialMessage) => {
        setIsChatOpen(true);
        if (initialMessage) { addMessage('user', initialMessage); scheduleBotReply(initialMessage); }
    };
    const sendMessage = (text = chatInput) => {
        const message = text.trim();
        if (!message) return;
        addMessage('user', message); setChatInput(''); scheduleBotReply(message);
    };
    const resetChat = () => {
        pendingTimers.current.forEach((timerId) => window.clearTimeout(timerId));
        pendingTimers.current.clear(); setMessages([]);
    };
    const showToast = (title, message) => {
        setToast({ title, message }); setToastVisible(true);
        if (toastTimer.current) window.clearTimeout(toastTimer.current);
        toastTimer.current = window.setTimeout(() => setToastVisible(false), 3500);
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
    const handleSearchSubmit = (event) => {
        event.preventDefault(); showToast("Tìm kiếm", "Đang tra cứu quyền lợi hạng thành viên...");
    };

    const customerNameDisplay = customer?.customerName || tierSummary?.customerName || 'Độc Giả HALM';
    const customerIdDisplay = formatCustomerId(customer?.customerId || customer?.customer_id || tierSummary?.customerId || tierSummary?.formattedMemberCode);
    const avatarSrc = customer?.avatar || customer?.avatarUrl || tierSummary?.avatarUrl;
    const potatoBalanceDisplay = customer?.potatoBalance ?? tierSummary?.potatoBalance ?? 0;

    // Xác định chính xác cấp bậc thành viên thực tế của người dùng (1, 2, 3, 4)
    const userTierLevel = (() => {
        // Tự động thăng cấp nếu số dư khoai hoặc điểm cày đạt ngưỡng
        const potato = Math.max(potatoBalanceDisplay, tierSummary?.totalPoints ?? 0);
        if (potato >= 10000) return 4;
        if (potato >= 2500) return 3;
        if (potato >= 500) return 2;

        const current = tierSummary?.currentTier;
        if (current) {
            if (typeof current === 'object' && current.tierId) {
                return Number(current.tierId);
            }
            const name = typeof current === 'object' ? (current.tierName || '') : String(current);
            const upper = name.toUpperCase();
            if (upper.includes('ĐẠI ĐIỀN') || upper.includes('DAI DIEN') || upper.includes('TIER4') || upper.includes('IV') || upper.includes('TOI THUONG') || upper.includes('TỐI THƯỢNG')) return 4;
            if (upper.includes('LÃO NÔNG') || upper.includes('LAO NONG') || upper.includes('TIER3') || upper.includes('III') || upper.includes('TINH HOA')) return 3;
            if (upper.includes('CAO THỦ') || upper.includes('CAO THU') || upper.includes('TIER2') || upper.includes('II') || upper.includes('TRI THUC') || upper.includes('TRI THỨC')) return 2;
            if (upper.includes('THỢ CÀY') || upper.includes('THO CAY') || upper.includes('TIER1') || upper.includes('I') || upper.includes('MAM DOC') || upper.includes('MẦM ĐỌC')) return 1;
        }
        const custTier = customer?.membershipTier;
        if (custTier) {
            if (typeof custTier === 'number') return custTier;
            const upper = String(custTier).toUpperCase();
            if (upper.includes('DAI_DIEN') || upper.includes('ĐẠI ĐIỀN') || upper.includes('DAI DIEN') || upper.includes('4')) return 4;
            if (upper.includes('LAO_NONG') || upper.includes('LÃO NÔNG') || upper.includes('LAO NONG') || upper.includes('3')) return 3;
            if (upper.includes('CAO_THU') || upper.includes('CAO THỦ') || upper.includes('CAO THU') || upper.includes('2')) return 2;
            if (upper.includes('THO_CAY') || upper.includes('THỢ CÀY') || upper.includes('THO CAY') || upper.includes('1')) return 1;
        }
        return 1;
    })();

    // Lấy khung viền và huy hiệu avatar tương ứng với hạng thành viên
    const avatarFrame = getTierAvatarFrame(userTierLevel);

    return (
        <>
            <style>{String.raw`
        /* ========================================================
           TYPOGRAPHY & CSS VARIABLES (ĐỒNG BỘ TRANG CHỦ & ƯU ĐÃI)
           ======================================================== */
        :root {
            --font-display: "Inter", sans-serif;
            --font-ui: "Inter", sans-serif;
            --font-metadata: "Roboto", sans-serif;
            --font-editorial: "Open Sans", sans-serif;
        }

        html {
            scroll-behavior: smooth;
        }

        .tiers-page {
            font-family: var(--font-ui);
            background-color: #F7F4EE;
            color: #1E1F1D;
            -webkit-font-smoothing: antialiased;
        }

        html.dark .tiers-page {
            background-color: #111210 !important;
            color: #EDE9DF !important;
        }

        /* Light Mode Specific Overrides */
        html:not(.dark) .tiers-page [class~="bg-paper"] { background-color: #F7F4EE; }
        html:not(.dark) .tiers-page [class~="bg-paper-surface"] { background-color: #FFFEFA; }
        html:not(.dark) .tiers-page [class~="bg-paper-200"] { background-color: #EAE5D9; }
        html:not(.dark) .tiers-page [class~="bg-paper-200/70"] { background-color: rgb(234 229 217 / 0.7); }
        html:not(.dark) .tiers-page [class~="bg-wine"] { background-color: #8E3038; }
        html:not(.dark) .tiers-page [class~="bg-wine/10"] { background-color: rgb(142 48 56 / 0.1); }
        html:not(.dark) .tiers-page [class~="bg-wine/20"] { background-color: rgb(142 48 56 / 0.2); }
        html:not(.dark) .tiers-page [class~="bg-gold"] { background-color: #B8860B; }
        html:not(.dark) .tiers-page [class~="bg-gold/5"] { background-color: rgb(184 134 11 / 0.05); }
        html:not(.dark) .tiers-page [class~="bg-gold/10"] { background-color: rgb(184 134 11 / 0.1); }
        html:not(.dark) .tiers-page [class~="bg-gold/15"] { background-color: rgb(184 134 11 / 0.15); }

        html:not(.dark) .tiers-page [class~="text-ink"] { color: #1E1F1D; }
        html:not(.dark) .tiers-page [class~="text-ink/80"] { color: rgb(30 31 29 / 0.8); }
        html:not(.dark) .tiers-page [class~="text-ink-muted"] { color: #66645E; }
        html:not(.dark) .tiers-page [class~="border-paper-border"] { border-color: #E3DDD0; }

        /* Dark Mode Specific Overrides - Tuyệt đối không bị hắt sáng khi F5 */
        html.dark .tiers-page [class*="bg-paper-surface"],
        html.dark .tiers-page .user-sidebar-card,
        html.dark .tiers-page .user-sidebar-box {
            background-color: #181916 !important;
            border-color: #2C2E29 !important;
        }
        html.dark .tiers-page [class*="bg-paper"]:not([class*="bg-paper-200"]) {
            background-color: #111210 !important;
        }
        html.dark .tiers-page [class*="text-ink"]:not([class*="text-ink-muted"]) {
            color: #EDE9DF !important;
        }
        html.dark .tiers-page [class*="text-ink-muted"] {
            color: #96938B !important;
        }
        html.dark .tiers-page [class*="border-paper-border"] {
            border-color: #2C2E29 !important;
        }
        .tiers-page [class~="text-wine"] { color: #8E3038; }
        .tiers-page [class~="text-gold"] { color: #B8860B; }
        .tiers-page [class~="text-night-bg"] { color: #111210; }
        .tiers-page [class~="text-night-text"] { color: #EDE9DF; }
        .tiers-page [class~="text-night-muted"] { color: #96938B; }
        .tiers-page [class~="border-paper-border"] { border-color: #E3DDD0; }
        .tiers-page [class~="border-night-border"] { border-color: #2C2E29; }
        .tiers-page [class~="border-wine/30"] { border-color: rgb(142 48 56 / 0.3); }
        .tiers-page [class~="border-wine/40"] { border-color: rgb(142 48 56 / 0.4); }
        .tiers-page [class~="border-gold"] { border-color: #B8860B; }
        .tiers-page [class~="border-gold/30"] { border-color: rgb(184 134 11 / 0.3); }
        .tiers-page [class~="border-gold/40"] { border-color: rgb(184 134 11 / 0.4); }

        .tiers-page [class~="from-wine"][class~="to-wine-light"] {
            background-image: linear-gradient(to top right, #8E3038, #A83B46);
        }
        .tiers-page [class~="bg-gradient-to-br"][class~="from-wine/5"][class~="to-gold/5"] {
            background-image: linear-gradient(to bottom right, rgb(142 48 56 / 0.05), #FFFEFA, rgb(184 134 11 / 0.05));
        }
        .tiers-page [class~="bg-gradient-to-br"][class~="from-night-card"][class~="to-night-surface"] {
            background-image: linear-gradient(to bottom right, #20221E, #1c1813, #181916);
        }

        .tiers-page [class~="hover:bg-paper"]:hover { background-color: #F7F4EE; }
        .tiers-page [class~="hover:bg-paper-200"]:hover { background-color: #EAE5D9; }
        .tiers-page [class~="hover:bg-paper-border"]:hover { background-color: #E3DDD0; }
        .tiers-page [class~="hover:bg-wine"]:hover { background-color: #8E3038; }
        .tiers-page [class~="hover:bg-wine-dark"]:hover { background-color: #6F252C; }
        .tiers-page [class~="hover:bg-gold"]:hover { background-color: #B8860B; }
        .tiers-page [class~="hover:bg-night-border"]:hover { background-color: #2C2E29; }
        .tiers-page [class~="hover:text-ink"]:hover { color: #1E1F1D; }
        .tiers-page [class~="hover:text-wine"]:hover { color: #8E3038; }
        .tiers-page [class~="hover:text-gold"]:hover { color: #B8860B; }
        .tiers-page [class~="group-hover:text-wine"]:hover,
        .tiers-page .group:hover [class~="group-hover:text-wine"] { color: #8E3038; }
        .tiers-page [class~="focus:border-wine"]:focus { border-color: #8E3038; }
        .tiers-page [class~="placeholder-ink-muted/80"]::placeholder { color: rgb(102 100 94 / 0.8); }
        .tiers-page [class~="placeholder-night-muted"]::placeholder { color: #96938B; }
        .tiers-page [class~="after:bg-wine"]::after { background-color: #8E3038; }
        .tiers-page [class~="divide-paper-border"] > :not([hidden]) ~ :not([hidden]) { border-color: #E3DDD0; }

        html.dark .tiers-page [class~="dark:bg-gold"] { background-color: #B8860B; }
        html.dark .tiers-page [class~="dark:bg-gold/10"] { background-color: rgb(184 134 11 / 0.1); }
        html.dark .tiers-page [class~="dark:bg-gold/15"] { background-color: rgb(184 134 11 / 0.15); }
        html.dark .tiers-page [class~="dark:bg-gold/20"] { background-color: rgb(184 134 11 / 0.2); }
        html.dark .tiers-page [class~="dark:bg-night-bg"] { background-color: #111210; }
        html.dark .tiers-page [class~="dark:bg-night-card"] { background-color: #20221E; }
        html.dark .tiers-page [class~="dark:bg-night-surface"] { background-color: #181916; }
        html.dark .tiers-page [class~="dark:bg-night-border"] { background-color: #2C2E29; }
        html.dark .tiers-page [class*="user-sidebar-card"],
        html.dark .tiers-page [class*="dark:bg-night-surface"],
        html.dark .tiers-page [class*="dark:bg-[#181916]"] {
            background-color: #181916 !important;
            border-color: #2C2E29 !important;
        }
        html.dark .tiers-page [class*="user-sidebar-box"] {
            background-color: #181916 !important;
            border-color: #2C2E29 !important;
        }
        html.dark .tiers-page [class*="user-sidebar-card"] h2,
        html.dark .tiers-page [class*="user-sidebar-card"] [class*="font-display"],
        html.dark .tiers-page [class*="user-sidebar-box"] span.text-2xl,
        html.dark .tiers-page [class*="user-sidebar-box"] span:first-child {
            color: #EDE9DF !important;
        }
        html.dark .tiers-page [class*="user-sidebar-box"] span:last-child,
        html.dark .tiers-page [class*="user-sidebar-card"] p {
            color: #9CA3AF !important;
        }
        html.dark .tiers-page [class*="dark:border-night-border"],
        html.dark .tiers-page [class*="dark:border-[#2C2E29]"] {
            border-color: #2C2E29 !important;
        }
        html.dark .tiers-page [class*="dark:bg-[#242116]"] {
            background-color: #242116 !important;
        }
        html.dark .tiers-page [class*="dark:border-[#52441D]"] {
            border-color: #52441D !important;
        }
        html.dark .tiers-page [class~="bg-paper-surface"] {
            background-color: #181916 !important;
        }
        html.dark .tiers-page [class~="bg-paper"] {
            background-color: #181916 !important;
        }
        html.dark .tiers-page [class~="border-paper-border"] {
            border-color: #2C2E29 !important;
        }
        html.dark .tiers-page [class~="text-ink"],
        html.dark .tiers-page .text-ink {
            color: #EDE9DF !important;
        }
        html.dark .tiers-page [class~="text-ink-muted"],
        html.dark .tiers-page .text-ink-muted {
            color: #9CA3AF !important;
        }
        html.dark .tiers-page [class~="dark:text-gold"] { color: #B8860B; }
        html.dark .tiers-page [class~="dark:text-night-bg"] { color: #111210; }
        html.dark .tiers-page [class~="dark:text-night-muted"] { color: #96938B; }
        html.dark .tiers-page [class~="dark:text-night-text"] { color: #EDE9DF; }
        html.dark .tiers-page [class~="dark:border-night-border"] { border-color: #2C2E29; }
        html.dark .tiers-page [class~="dark:border-night-card"] { border-color: #20221E; }
        html.dark .tiers-page [class~="dark:border-gold/40"] { border-color: rgb(184 134 11 / 0.4); }
        html.dark .tiers-page [class~="dark:from-gold"][class~="dark:to-gold-light"] {
            background-image: linear-gradient(to top right, #B8860B, #D4AF37);
        }
        html.dark .tiers-page [class~="dark:from-night-card"][class~="dark:to-night-surface"] {
            background-image: linear-gradient(to bottom right, #20221E, #181916);
        }
        html.dark .tiers-page [class~="dark:after:bg-gold"]::after { background-color: #B8860B; }
        html.dark .tiers-page [class~="dark:divide-night-border"] > :not([hidden]) ~ :not([hidden]) { border-color: #2C2E29; }
        html.dark .tiers-page [class~="dark:hover:bg-gold"]:hover { background-color: #B8860B; }
        html.dark .tiers-page [class~="dark:hover:bg-night-border"]:hover { background-color: #2C2E29; }
        html.dark .tiers-page [class~="dark:hover:bg-night-card"]:hover { background-color: #20221E; }
        html.dark .tiers-page [class~="dark:hover:bg-night-surface"]:hover { background-color: #181916; }
        html.dark .tiers-page [class~="dark:hover:bg-night-surface/50"]:hover { background-color: rgb(24 25 22 / 0.5); }
        html.dark .tiers-page [class~="dark:hover:text-gold"]:hover { color: #B8860B; }
        html.dark .tiers-page [class~="dark:hover:text-night-bg"]:hover { color: #111210; }
        html.dark .tiers-page [class~="dark:hover:text-night-text"]:hover { color: #EDE9DF; }
        html.dark .tiers-page [class~="dark:hover:border-gold"]:hover { border-color: #B8860B; }
        html.dark .tiers-page [class~="dark:focus:border-gold"]:focus { border-color: #D4AF37; }
        html.dark .tiers-page [class~="dark:group-hover:text-gold"]:hover,
        html.dark .tiers-page .group:hover [class~="dark:group-hover:text-gold"] { color: #D4AF37; }

        .font-display-hero {
            font-family: var(--font-display);
            font-weight: 900;
            letter-spacing: -0.03em;
        }

        .font-editorial-body {
            font-family: var(--font-editorial);
            line-height: 1.7;
        }

        .font-metadata-spec {
            font-family: var(--font-metadata);
        }

        /* Subtle paper grain texture overlay */
        .paper-grain {
            background-image: radial-gradient(rgba(30, 31, 29, 0.04) 1px, transparent 1px);
            background-size: 28px 28px;
        }
        .dark .paper-grain {
            background-image: radial-gradient(rgba(237, 233, 223, 0.04) 1px, transparent 1px);
            background-size: 28px 28px;
        }

        /* Starry sky overlay for dark mode */
        #starry-background {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1;
            opacity: 0;
            transition: opacity 0.6s ease;
        }
        .dark #starry-background {
            opacity: 1;
        }
        .star {
            position: absolute;
            background-color: #EDE9DF;
            border-radius: 50%;
            pointer-events: none;
        }
        @keyframes starTwinkle {
            0%, 100% { opacity: 0.2; transform: scale(0.8); }
            50% { opacity: 0.9; transform: scale(1.2); }
        }

        /* Navbar Scrolled Glassmorphism */
        #navbar.scrolled {
            background: rgba(247, 244, 238, 0.92);
            backdrop-filter: blur(14px);
            -webkit-backdrop-filter: blur(14px);
            border-bottom: 1px solid rgba(227, 221, 208, 0.7);
            box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.05);
        }
        .dark #navbar.scrolled {
            background: rgba(17, 18, 16, 0.92);
            border-bottom: 1px solid rgba(44, 46, 41, 0.8);
            box-shadow: 0 4px 24px -2px rgba(0, 0, 0, 0.4);
        }

        /* Potato Badge */
        .potato-badge {
            display: inline-flex;
            align-items: center;
            gap: 0.35rem;
            background: rgba(184, 134, 11, 0.12);
            color: #B8860B;
            border: 1px solid rgba(184, 134, 11, 0.25);
            border-radius: 9999px;
            padding: 0.25rem 0.65rem;
            font-size: 0.8rem;
            font-weight: 700;
            font-family: var(--font-metadata);
        }
        .dark .potato-badge {
            background: rgba(212, 175, 55, 0.15);
            color: #D4AF37;
            border-color: rgba(212, 175, 55, 0.3);
        }

        /* Chatbot Modal Styling */
        #chatbot-container {
            position: fixed;
            bottom: 24px;
            right: 24px;
            z-index: 50;
        }
        #chat-window {
            position: absolute;
            bottom: 70px;
            right: 0;
            width: 360px;
            height: 480px;
            max-width: calc(100vw - 32px);
            background: #181916;
            border: 1px solid #2C2E29;
            border-radius: 16px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.6);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            transform: scale(0.9) translateY(20px);
            opacity: 0;
            pointer-events: none;
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            transform-origin: bottom right;
        }
        #chat-window.show {
            transform: scale(1) translateY(0);
            opacity: 1;
            pointer-events: auto;
        }

        /* Floating Scroll to Top */
        #btnScrollToTop {
            position: fixed;
            bottom: 24px;
            left: 24px;
            z-index: 40;
            width: 44px;
            height: 44px;
            border-radius: 50%;
            background: #FFFEFA;
            color: #1E1F1D;
            border: 1px solid #E3DDD0;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 14px rgba(0,0,0,0.08);
            cursor: pointer;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
        }
        .dark #btnScrollToTop {
            background: #20221E;
            color: #EDE9DF;
            border-color: #2C2E29;
            box-shadow: 0 4px 14px rgba(0,0,0,0.4);
        }
        #btnScrollToTop.show {
            opacity: 1;
            visibility: visible;
        }
        #btnScrollToTop:hover {
            transform: translateY(-3px);
            background: #8E3038;
            color: #fff;
            border-color: #8E3038;
        }
        .dark #btnScrollToTop:hover {
            background: #B8860B;
            color: #111210;
            border-color: #B8860B;
        }

        /* Toast Container */
        #toast-notification {
            position: fixed;
            top: 24px;
            right: 24px;
            z-index: 1000;
            transform: translateX(120%);
            transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }
        #toast-notification.show {
            transform: translateX(0);
        }

        /* Digital Membership Card Holographic Look */
        .member-card-3d {
            background: linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #1e1b4b 100%);
            position: relative;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 20px 35px -10px rgba(15, 23, 42, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.2);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .dark .member-card-3d {
            background: linear-gradient(135deg, #1c1917 0%, #0c0a09 60%, #292524 100%);
            box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.7), inset 0 1px 1px rgba(212, 175, 55, 0.25);
        }
        .member-card-3d:hover {
            transform: translateY(-4px);
            box-shadow: 0 25px 45px -10px rgba(0, 0, 0, 0.5);
        }
        .member-card-3d::after {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(125deg, transparent 30%, rgba(255, 255, 255, 0.08) 45%, rgba(255, 255, 255, 0.15) 50%, rgba(255, 255, 255, 0.08) 55%, transparent 70%);
            pointer-events: none;
        }

        /* Progress Bar Animation */
        @keyframes shineStripe {
            0% { background-position: 0 0; }
            100% { background-position: 40px 0; }
        }
        .progress-striped {
            background-size: 20px 20px;
            background-image: linear-gradient(45deg, rgba(255, 255, 255, 0.15) 25%, transparent 25%, transparent 50%, rgba(255, 255, 255, 0.15) 50%, rgba(255, 255, 255, 0.15) 75%, transparent 75%, transparent);
            animation: shineStripe 2s linear infinite;
        }

        /* Accordion Chevron Transition */
        .faq-item.active .faq-chevron {
            transform: rotate(180deg);
        }
        .faq-content {
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease;
            opacity: 0;
        }
        .faq-item.active .faq-content {
            max-height: 300px;
            opacity: 1;
        }
    `}</style>
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

                <div id="toast-notification" className={`flex items-center gap-3 px-5 py-4 rounded-xl bg-paper-surface dark:bg-night-card border border-wine/30 dark:border-gold/40 shadow-2xl text-ink dark:text-night-text ${toastVisible ? 'show' : ''}`}>
                    <div className="w-8 h-8 rounded-full bg-wine/10 dark:bg-gold/20 flex items-center justify-center text-wine dark:text-gold shrink-0">
                        <i className="ph-bold ph-check text-lg"></i>
                    </div>
                    <div>
                        <div className="font-display font-bold text-xs" id="toast-title">{toast.title}</div>
                        <div className="font-editorial-body text-xs text-ink-muted dark:text-night-muted" id="toast-message">{toast.message}</div>
                    </div>
                </div>

                <main className="w-full max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 sm:pt-28 sm:pb-20 flex-1">
                    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">


                        {/* LEFT SIDEBAR - FIXED/STICKY CONTAINER */}
                        <aside className="w-full lg:w-80 shrink-0 space-y-4 lg:sticky lg:top-24 lg:self-start">

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

                                <div className="grid grid-cols-2 gap-3 w-full text-center">
                                    <Link to="/canhan?tab=wallet" className="py-4 px-3 rounded-2xl user-sidebar-box bg-paper dark:bg-night-surface border border-paper-border dark:border-night-border hover:border-gold transition-colors flex flex-col justify-center">
                                        <span className="block font-metadata-spec text-2xl font-black text-stone-900 dark:!text-[#EDE9DF]" style={{ color: isDark ? '#EDE9DF' : undefined }}>{potatoBalanceDisplay.toLocaleString()}</span>
                                        <span className="font-metadata-spec text-xs text-stone-500 dark:!text-[#9CA3AF] mt-1" style={{ color: isDark ? '#9CA3AF' : undefined }}>Khoai Tích Lũy</span>
                                    </Link>
                                    <Link to="/tusachcn" className="py-4 px-3 rounded-2xl user-sidebar-box bg-paper dark:bg-night-surface border border-paper-border dark:border-night-border hover:border-wine dark:hover:border-gold transition-colors flex flex-col justify-center">
                                        <span className="block font-metadata-spec text-2xl font-black text-stone-900 dark:!text-[#EDE9DF]" style={{ color: isDark ? '#EDE9DF' : undefined }}>
                                            {tierSummary?.booksReadCount ?? 0}
                                        </span>
                                        <span className="font-metadata-spec text-xs text-stone-500 dark:!text-[#9CA3AF] mt-1" style={{ color: isDark ? '#9CA3AF' : undefined }}>Sách Trong Tủ</span>
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
                                    onClick={() => {
                                        clearAuthSession();
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
                                    <p className="font-editorial-body text-xs sm:text-sm text-ink-muted dark:text-night-muted mt-1 max-w-2xl">
                                        Hệ thống vinh danh hành trình tri thức của bạn. Tích lũy số sách đã đọc để nâng cấp bậc, bảo lưu vĩnh viễn và nhận chiết khấu dịch vụ trọn đời.
                                    </p>
                                </div>


                                <div className="shrink-0 flex items-center gap-2">
                                    <button
                                        type="button"
                                        disabled={isCheckingIn || tierSummary?.hasCheckedInToday}
                                        onClick={handleDailyCheckin}
                                        className={`px-3.5 py-2 rounded-xl text-xs font-metadata-spec font-bold transition-all flex items-center gap-1.5 shadow-sm ${
                                            tierSummary?.hasCheckedInToday
                                                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                                                : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-amber-500/20'
                                        }`}
                                    >
                                        <i className={`ph-fill ${tierSummary?.hasCheckedInToday ? 'ph-check-circle' : 'ph-fire'} text-sm`}></i>
                                        <span>{tierSummary?.hasCheckedInToday ? `Đã Điểm Danh (${tierSummary?.streakDays || 1} Ngày 🔥)` : 'Điểm Danh Nhận +5 Khoai & +20 XP 🔥'}</span>
                                    </button>

                                    <button type="button" onClick={() => openTierModal("policy")} className="px-3.5 py-2 rounded-xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border text-xs font-metadata-spec font-bold text-ink dark:text-night-text hover:border-wine dark:hover:border-gold transition-colors flex items-center gap-1.5 shadow-sm">
                                        <i className="ph-bold ph-info text-wine dark:text-gold"></i>
                                        <span>Chính Sách Bảo Lưu Vĩnh Viễn</span>
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



                            <div className="space-y-4 pt-2">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div>
                                        <h2 className="font-display font-black text-xl text-ink dark:text-night-text">
                                            Hệ Thống Cấp Bậc & Lộ Trình Đặc Quyền
                                        </h2>
                                        <p className="font-editorial-body text-xs text-ink-muted dark:text-night-muted">
                                            Khám phá 4 nấc thang tri thức từ Thợ Cày đến Đại Điền Chủ với những quyền lợi độc bản tăng dần.
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2.5">
                                        <span className="hidden sm:inline-flex text-xs font-metadata-spec font-bold text-wine dark:text-gold items-center gap-1">
                                            <i className="ph-bold ph-seal-percent"></i> Chiết khấu tối đa lên tới 20%
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => setIsTiersCollapsed((prev) => !prev)}
                                            className="px-3.5 py-1.5 rounded-xl border border-paper-border dark:border-night-border hover:bg-paper-200 dark:hover:bg-night-surface text-xs font-bold text-ink dark:text-night-text flex items-center gap-1.5 transition-colors shadow-sm"
                                            title={isTiersCollapsed ? "Mở rộng hệ thống cấp bậc" : "Thu gọn hệ thống cấp bậc"}
                                        >
                                            <i className={`ph-bold ${isTiersCollapsed ? 'ph-caret-down' : 'ph-caret-up'}`}></i>
                                            <span>{isTiersCollapsed ? "Mở Rộng" : "Thu Gọn"}</span>
                                        </button>
                                    </div>
                                </div>

                                {!isTiersCollapsed ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 pt-5 transition-all">

                                        {/* ========================================================
                                            CẤP I • THỢ CÀY (MẦM ĐỌC)
                                            ======================================================== */}
                                        <div className={`rounded-2xl bg-paper-surface dark:bg-[#181916] ${
                                            userTierLevel === 1
                                                ? 'border-2 border-[#C28807] dark:border-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.25)] ring-2 ring-amber-400/30'
                                                : 'border border-paper-border dark:border-[#2C2E29] shadow-sm'
                                        } hover:border-[#C28807] dark:hover:border-[#D4AF37] hover:shadow-lg p-6 flex flex-col justify-between relative group transition-all duration-300`}>

                                            {/* Badge định danh */}
                                            {userTierLevel === 1 ? (
                                                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20 px-3.5 py-1 rounded-full bg-[#C28807] text-[#111210] text-[11px] font-metadata-spec font-black uppercase tracking-wider shadow-md border border-amber-300/40 whitespace-nowrap flex items-center gap-1.5">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-[#111210] animate-pulse"></span>
                                                    <span>Hạng Hiện Tại 📍</span>
                                                </div>
                                            ) : (
                                                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20 px-3 py-0.5 rounded-full bg-emerald-500/10 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-metadata-spec font-bold uppercase tracking-wider shadow-sm whitespace-nowrap flex items-center gap-1">
                                                    <i className="ph-bold ph-check text-xs"></i>
                                                    <span>Đã Mở Khóa</span>
                                                </div>
                                            )}

                                            <div>
                                                <div className="flex items-center justify-between mb-4 mt-1">
                                                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-2xl border border-emerald-500/20 shadow-inner">
                                                        🌱
                                                    </div>
                                                    <span className="font-metadata-spec text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                                                        Cấp I • Mầm Đọc
                                                    </span>
                                                </div>

                                                <h3 className="font-display font-black text-xl text-stone-900 dark:text-[#EDE9DF]">Thợ Cày</h3>
                                                <p className="font-metadata-spec text-xs font-bold text-stone-500 dark:text-[#9CA3AF] mt-0.5">
                                                    Yêu cầu: <span className="text-emerald-600 dark:text-emerald-400 font-black">Tạo tài khoản mới</span>
                                                </p>

                                                <div className="my-4 pt-3 border-t border-paper-border dark:border-[#2C2E29] space-y-2.5 text-xs font-editorial-body text-stone-700 dark:text-[#C5C2BA]">
                                                    <div className="flex items-start gap-2">
                                                        <i className="ph-bold ph-check text-emerald-600 dark:text-emerald-400 text-sm shrink-0 mt-0.5"></i>
                                                        <span>Mượn và đọc toàn bộ kho sách mở tiêu chuẩn không giới hạn</span>
                                                    </div>
                                                    <div className="flex items-start gap-2">
                                                        <i className="ph-bold ph-check text-emerald-600 dark:text-emerald-400 text-sm shrink-0 mt-0.5"></i>
                                                        <span>Mở khóa <strong>Ví Khoai Tây</strong> tích lũy điểm thưởng & nhận thưởng đọc sách</span>
                                                    </div>
                                                    <div className="flex items-start gap-2">
                                                        <i className="ph-bold ph-check text-emerald-600 dark:text-emerald-400 text-sm shrink-0 mt-0.5"></i>
                                                        <span>Tặng <strong>3 lượt tải lên (Upload)</strong> tài liệu cá nhân miễn phí khởi điểm</span>
                                                    </div>
                                                    <div className="flex items-start gap-2">
                                                        <i className="ph-bold ph-check text-emerald-600 dark:text-emerald-400 text-sm shrink-0 mt-0.5"></i>
                                                        <span>Cam kết <strong>Bảo lưu vĩnh viễn</strong> cấp bậc, không lo bị giáng hạng</span>
                                                    </div>
                                                    <div className="flex items-start gap-2">
                                                        <i className="ph-bold ph-check text-emerald-600 dark:text-emerald-400 text-sm shrink-0 mt-0.5"></i>
                                                        <span>Tham gia cộng đồng đánh giá & nhận xét sách cùng độc giả HALM</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {userTierLevel === 1 ? (
                                                <button type="button" disabled className="w-full mt-4 py-2.5 px-4 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-metadata-spec font-black cursor-default flex items-center justify-center gap-1.5 shadow-sm">
                                                    <i className="ph-bold ph-check-circle text-sm"></i>
                                                    <span>Đang Sử Dụng</span>
                                                </button>
                                            ) : (
                                                <button type="button" disabled className="w-full mt-4 py-2.5 px-4 rounded-xl bg-paper-200/50 dark:bg-[#1E201B] text-stone-600 dark:text-stone-400 border border-paper-border dark:border-[#2C2E29] text-xs font-metadata-spec font-semibold cursor-default flex items-center justify-center gap-1.5">
                                                    <i className="ph-bold ph-check"></i>
                                                    <span>Đã Đạt Chuẩn</span>
                                                </button>
                                            )}
                                        </div>


                                        {/* ========================================================
                                            CẤP II • CAO THỦ CÀY (TRI THỨC)
                                            ======================================================== */}
                                        <div className={`rounded-2xl bg-paper-surface dark:bg-[#181916] ${
                                            userTierLevel === 2
                                                ? 'border-2 border-[#C28807] dark:border-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.25)] ring-2 ring-amber-400/30'
                                                : userTierLevel > 2
                                                ? 'border border-paper-border dark:border-[#2C2E29] shadow-sm'
                                                : 'border-2 border-stone-400/40 dark:border-stone-600/50 shadow-sm'
                                        } hover:border-[#C28807] dark:hover:border-[#D4AF37] hover:shadow-lg p-6 flex flex-col justify-between relative group transition-all duration-300`}>

                                            {/* Badge định danh */}
                                            {userTierLevel === 2 ? (
                                                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20 px-3.5 py-1 rounded-full bg-[#C28807] text-[#111210] text-[11px] font-metadata-spec font-black uppercase tracking-wider shadow-md border border-amber-300/40 whitespace-nowrap flex items-center gap-1.5">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-[#111210] animate-pulse"></span>
                                                    <span>Hạng Hiện Tại 📍</span>
                                                </div>
                                            ) : userTierLevel > 2 ? (
                                                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20 px-3 py-0.5 rounded-full bg-emerald-500/10 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-metadata-spec font-bold uppercase tracking-wider shadow-sm whitespace-nowrap flex items-center gap-1">
                                                    <i className="ph-bold ph-check text-xs"></i>
                                                    <span>Đã Mở Khóa</span>
                                                </div>
                                            ) : (
                                                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20 px-3.5 py-1 rounded-full bg-stone-900 dark:bg-[#20221E] text-amber-500 dark:text-[#E5B842] text-[10px] font-metadata-spec font-black uppercase tracking-wider shadow-md border border-amber-400/30 whitespace-nowrap flex items-center gap-1">
                                                    <span>🎯 Mục Tiêu Tiếp Theo</span>
                                                </div>
                                            )}

                                            <div>
                                                <div className="flex items-center justify-between mb-4 mt-1">
                                                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center text-2xl border border-blue-400/20 shadow-inner">
                                                        🚜
                                                    </div>
                                                    <span className="font-metadata-spec text-xs font-bold text-blue-700 dark:text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20">
                                                        Cấp II • Tri Thức
                                                    </span>
                                                </div>

                                                <h3 className="font-display font-black text-xl text-stone-900 dark:text-[#EDE9DF]">Cao Thủ Cày</h3>
                                                <p className="font-metadata-spec text-xs font-bold text-stone-500 dark:text-[#9CA3AF] mt-0.5">
                                                    Yêu cầu: <span className="text-blue-600 dark:text-blue-400 font-black">Đọc 10 Cuốn</span> (hoặc 500 Khoai)
                                                </p>

                                                <div className="my-4 pt-3 border-t border-paper-border dark:border-[#2C2E29] space-y-2.5 text-xs font-editorial-body text-stone-700 dark:text-[#C5C2BA]">
                                                    <div className="flex items-start gap-2">
                                                        <i className="ph-bold ph-check text-blue-600 dark:text-blue-400 text-sm shrink-0 mt-0.5"></i>
                                                        <span><strong className="text-stone-900 dark:text-[#EDE9DF] font-bold">Giảm trực tiếp 5%</strong> toàn bộ hóa đơn thuê & mua sách</span>
                                                    </div>
                                                    <div className="flex items-start gap-2">
                                                        <i className="ph-bold ph-check text-blue-600 dark:text-blue-400 text-sm shrink-0 mt-0.5"></i>
                                                        <span><strong>Huy hiệu Cao Thủ Bạc</strong> danh dự hiển thị cạnh tên tài khoản</span>
                                                    </div>
                                                    <div className="flex items-start gap-2">
                                                        <i className="ph-bold ph-check text-blue-600 dark:text-blue-400 text-sm shrink-0 mt-0.5"></i>
                                                        <span><strong>Đọc trước tác phẩm mới</strong> xuất bản sớm hơn cộng đồng 3 ngày</span>
                                                    </div>
                                                    <div className="flex items-start gap-2">
                                                        <i className="ph-bold ph-check text-blue-600 dark:text-blue-400 text-sm shrink-0 mt-0.5"></i>
                                                        <span>Hàng đợi hỗ trợ CSKH ưu tiên giải quyết khiếu nại trong 2 giờ</span>
                                                    </div>
                                                    <div className="flex items-start gap-2">
                                                        <i className="ph-bold ph-check text-blue-600 dark:text-blue-400 text-sm shrink-0 mt-0.5"></i>
                                                        <span>Tăng giới hạn <strong>10 lượt Upload tài liệu</strong> cá nhân mỗi tháng</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {userTierLevel === 2 ? (
                                                <button type="button" disabled className="w-full mt-4 py-2.5 px-4 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-metadata-spec font-black cursor-default flex items-center justify-center gap-1.5 shadow-sm">
                                                    <i className="ph-bold ph-check-circle text-sm"></i>
                                                    <span>Đang Sử Dụng</span>
                                                </button>
                                            ) : userTierLevel > 2 ? (
                                                <button type="button" disabled className="w-full mt-4 py-2.5 px-4 rounded-xl bg-paper-200/50 dark:bg-[#1E201B] text-stone-600 dark:text-stone-400 border border-paper-border dark:border-[#2C2E29] text-xs font-metadata-spec font-semibold cursor-default flex items-center justify-center gap-1.5">
                                                    <i className="ph-bold ph-check"></i>
                                                    <span>Đã Đạt Chuẩn</span>
                                                </button>
                                            ) : (
                                                <button type="button" onClick={() => openTierModal("tier2")} className="w-full mt-4 py-2.5 px-4 rounded-xl bg-paper-200 dark:bg-[#20221E] hover:bg-stone-900 hover:text-white dark:hover:bg-[#C28807] dark:hover:text-[#111210] text-stone-800 dark:text-[#EDE9DF] border border-paper-border dark:border-[#2C2E29] text-xs font-metadata-spec font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95">
                                                    <span>Xem Lộ Trình Thăng Cấp</span>
                                                    <i className="ph-bold ph-arrow-right"></i>
                                                </button>
                                            )}
                                        </div>


                                        {/* ========================================================
                                            CẤP III • LÃO NÔNG (TINH HOA)
                                            ======================================================== */}
                                        <div className={`rounded-2xl bg-paper-surface dark:bg-[#181916] ${
                                            userTierLevel === 3
                                                ? 'border-2 border-[#C28807] dark:border-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.25)] ring-2 ring-amber-400/30'
                                                : userTierLevel > 3
                                                ? 'border border-paper-border dark:border-[#2C2E29] shadow-sm'
                                                : userTierLevel === 2
                                                ? 'border-2 border-stone-400/40 dark:border-stone-600/50 shadow-sm'
                                                : 'border border-paper-border dark:border-[#2C2E29] shadow-sm'
                                        } hover:border-[#C28807] dark:hover:border-[#D4AF37] hover:shadow-lg p-6 flex flex-col justify-between relative group transition-all duration-300`}>

                                            {/* Badge định danh */}
                                            {userTierLevel === 3 ? (
                                                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20 px-3.5 py-1 rounded-full bg-[#C28807] text-[#111210] text-[11px] font-metadata-spec font-black uppercase tracking-wider shadow-md border border-amber-300/40 whitespace-nowrap flex items-center gap-1.5">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-[#111210] animate-pulse"></span>
                                                    <span>Hạng Hiện Tại 📍</span>
                                                </div>
                                            ) : userTierLevel > 3 ? (
                                                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20 px-3 py-0.5 rounded-full bg-emerald-500/10 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-metadata-spec font-bold uppercase tracking-wider shadow-sm whitespace-nowrap flex items-center gap-1">
                                                    <i className="ph-bold ph-check text-xs"></i>
                                                    <span>Đã Mở Khóa</span>
                                                </div>
                                            ) : userTierLevel === 2 ? (
                                                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20 px-3.5 py-1 rounded-full bg-stone-900 dark:bg-[#20221E] text-amber-500 dark:text-[#E5B842] text-[10px] font-metadata-spec font-black uppercase tracking-wider shadow-md border border-amber-400/30 whitespace-nowrap flex items-center gap-1">
                                                    <span>🎯 Mục Tiêu Tiếp Theo</span>
                                                </div>
                                            ) : (
                                                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20 px-3.5 py-1 rounded-full bg-amber-500/10 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-500/25 text-[10px] font-metadata-spec font-bold uppercase tracking-wider shadow-xs whitespace-nowrap flex items-center gap-1">
                                                    <span>Phổ Biến Nhất ★</span>
                                                </div>
                                            )}

                                            <div>
                                                <div className="flex items-center justify-between mb-4 mt-1">
                                                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center text-2xl border border-amber-500/20 shadow-inner">
                                                        🌾
                                                    </div>
                                                    <span className="font-metadata-spec text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                                                        Cấp III • Tinh Hoa
                                                    </span>
                                                </div>

                                                <h3 className="font-display font-black text-xl text-stone-900 dark:text-[#EDE9DF]">Lão Nông</h3>
                                                <p className="font-metadata-spec text-xs font-bold text-stone-500 dark:text-[#9CA3AF] mt-0.5">
                                                    Yêu cầu: <span className="text-amber-600 dark:text-amber-400 font-black">Đọc 50 Cuốn</span> (hoặc 2.500 Khoai)
                                                </p>

                                                <div className="my-4 pt-3 border-t border-paper-border dark:border-[#2C2E29] space-y-2.5 text-xs font-editorial-body text-stone-700 dark:text-[#C5C2BA]">
                                                    <div className="flex items-start gap-2">
                                                        <i className="ph-bold ph-check text-amber-600 dark:text-amber-400 text-sm shrink-0 mt-0.5"></i>
                                                        <span><strong className="text-stone-900 dark:text-[#EDE9DF] font-bold">Giảm 10%</strong> toàn bộ chi phí thuê sách & dịch vụ đọc trọn đời</span>
                                                    </div>
                                                    <div className="flex items-start gap-2">
                                                        <i className="ph-bold ph-check text-amber-600 dark:text-amber-400 text-sm shrink-0 mt-0.5"></i>
                                                        <span><strong className="text-amber-600 dark:text-amber-400 font-bold">Miễn phí 1 cuốn sách mỗi tháng</strong> (trong 5 sách ban tuyển chọn chỉ định)</span>
                                                    </div>
                                                    <div className="flex items-start gap-2">
                                                        <i className="ph-bold ph-check text-amber-600 dark:text-amber-400 text-sm shrink-0 mt-0.5"></i>
                                                        <span><strong>Khung Avatar Tinh Hoa</strong> ánh kim hào quang rực rỡ độc quyền</span>
                                                    </div>
                                                    <div className="flex items-start gap-2">
                                                        <i className="ph-bold ph-check text-amber-600 dark:text-amber-400 text-sm shrink-0 mt-0.5"></i>
                                                        <span><strong>Đọc trước các tác phẩm mới</strong> xuất bản sớm hơn cộng đồng 7 ngày</span>
                                                    </div>
                                                    <div className="flex items-start gap-2">
                                                        <i className="ph-bold ph-check text-amber-600 dark:text-amber-400 text-sm shrink-0 mt-0.5"></i>
                                                        <span>Hotline & Email hỗ trợ độc giả VIP phản hồi nhanh trong 30 phút</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {userTierLevel === 3 ? (
                                                <button type="button" disabled className="w-full mt-4 py-2.5 px-4 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-metadata-spec font-black cursor-default flex items-center justify-center gap-1.5 shadow-sm">
                                                    <i className="ph-bold ph-check-circle text-sm"></i>
                                                    <span>Đang Sử Dụng</span>
                                                </button>
                                            ) : userTierLevel > 3 ? (
                                                <button type="button" disabled className="w-full mt-4 py-2.5 px-4 rounded-xl bg-paper-200/50 dark:bg-[#1E201B] text-stone-600 dark:text-stone-400 border border-paper-border dark:border-[#2C2E29] text-xs font-metadata-spec font-semibold cursor-default flex items-center justify-center gap-1.5">
                                                    <i className="ph-bold ph-check"></i>
                                                    <span>Đã Đạt Chuẩn</span>
                                                </button>
                                            ) : (
                                                <button type="button" onClick={() => openTierModal("tier3")} className="w-full mt-4 py-2.5 px-4 rounded-xl bg-paper-200 dark:bg-[#20221E] hover:bg-stone-900 hover:text-white dark:hover:bg-[#C28807] dark:hover:text-[#111210] text-stone-800 dark:text-[#EDE9DF] border border-paper-border dark:border-[#2C2E29] text-xs font-metadata-spec font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95">
                                                    <span>Xem Lộ Trình Thăng Cấp</span>
                                                    <i className="ph-bold ph-arrow-right"></i>
                                                </button>
                                            )}
                                        </div>


                                        {/* ========================================================
                                            CẤP IV • ĐẠI ĐIỀN CHỦ (TỐI THƯỢNG) - KHUNG VIP HOÀNG GIA
                                            ======================================================== */}
                                        <div className={`rounded-2xl bg-paper-surface dark:bg-gradient-to-b dark:from-[#1E1C16] dark:to-[#181916] ${
                                            userTierLevel === 4
                                                ? 'border-2 border-[#C28807] dark:border-[#F59E0B] shadow-[0_0_25px_rgba(245,158,11,0.3)] ring-2 ring-amber-400/40'
                                                : 'border border-amber-500/35 dark:border-amber-400/30 shadow-md'
                                        } hover:border-[#F59E0B] hover:shadow-xl p-6 flex flex-col justify-between relative group transition-all duration-300`}>

                                            {/* Badge Hoàng Gia VIP */}
                                            {userTierLevel === 4 ? (
                                                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20 px-3.5 py-1 rounded-full bg-[#C28807] text-[#111210] text-[11px] font-metadata-spec font-black uppercase tracking-wider shadow-md border border-amber-300/40 whitespace-nowrap flex items-center gap-1.5">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-[#111210] animate-pulse"></span>
                                                    <span>Hạng Hiện Tại 👑</span>
                                                </div>
                                            ) : userTierLevel === 3 ? (
                                                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20 px-3.5 py-1 rounded-full bg-stone-900 dark:bg-[#20221E] text-amber-500 dark:text-[#E5B842] text-[10px] font-metadata-spec font-black uppercase tracking-wider shadow-md border border-amber-400/30 whitespace-nowrap flex items-center gap-1">
                                                    <span>🎯 Mục Tiêu Tối Thượng</span>
                                                </div>
                                            ) : (
                                                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20 px-3.5 py-1 rounded-full bg-amber-500/15 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-400/35 text-[10px] font-metadata-spec font-black uppercase tracking-wider shadow-sm whitespace-nowrap flex items-center gap-1">
                                                    <span>Hoàng Gia VIP 👑</span>
                                                </div>
                                            )}

                                            <div>
                                                <div className="flex items-center justify-between mb-4 mt-1">
                                                    <div className="w-12 h-12 rounded-2xl bg-amber-400/15 text-amber-500 dark:text-amber-400 flex items-center justify-center text-2xl border border-amber-400/30 shadow-inner">
                                                        🏰
                                                    </div>
                                                    <span className="font-metadata-spec text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-400/10 px-2.5 py-1 rounded-full whitespace-nowrap border border-amber-400/25">
                                                        Cấp IV • Tối Thượng
                                                    </span>
                                                </div>

                                                <h3 className="font-display font-black text-xl text-stone-900 dark:text-[#EDE9DF]">Đại Điền Chủ</h3>
                                                <p className="font-metadata-spec text-xs font-bold text-stone-500 dark:text-[#9CA3AF] mt-0.5">
                                                    Yêu cầu: <span className="text-amber-600 dark:text-amber-400 font-black">Đọc 150 Cuốn</span> (hoặc 10.000 Khoai)
                                                </p>

                                                <div className="my-4 pt-3 border-t border-paper-border dark:border-[#2C2E29] space-y-2.5 text-xs font-editorial-body text-stone-700 dark:text-[#C5C2BA]">
                                                    <div className="flex items-start gap-2">
                                                        <i className="ph-bold ph-crown text-amber-500 dark:text-amber-400 text-sm shrink-0 mt-0.5"></i>
                                                        <span><strong className="text-stone-900 dark:text-[#EDE9DF] font-bold">Giảm 20%</strong> toàn bộ dịch vụ và thuê sách trọn đời</span>
                                                    </div>
                                                    <div className="flex items-start gap-2">
                                                        <i className="ph-bold ph-crown text-amber-500 dark:text-amber-400 text-sm shrink-0 mt-0.5"></i>
                                                        <span><strong className="text-stone-900 dark:text-[#EDE9DF] font-bold">Thuê KHÔNG GIỚI HẠN</strong> toàn bộ kho sách VIP không cần tiền cọc</span>
                                                    </div>
                                                    <div className="flex items-start gap-2">
                                                        <i className="ph-bold ph-crown text-amber-500 dark:text-amber-400 text-sm shrink-0 mt-0.5"></i>
                                                        <span>Tặng <strong>hộp ấn phẩm sách bìa cứng mạ vàng</strong> độc quyền gửi tận nhà hàng năm</span>
                                                    </div>
                                                    <div className="flex items-start gap-2">
                                                        <i className="ph-bold ph-crown text-amber-500 dark:text-amber-400 text-sm shrink-0 mt-0.5"></i>
                                                        <span>Chuyên viên chăm sóc khách hàng VIP riêng biệt <strong>(1-on-1 VIP Concierge)</strong></span>
                                                    </div>
                                                </div>
                                            </div>

                                            {userTierLevel === 4 ? (
                                                <button type="button" disabled className="w-full mt-4 py-2.5 px-4 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-metadata-spec font-black cursor-default flex items-center justify-center gap-1.5 shadow-sm">
                                                    <i className="ph-bold ph-check-circle text-sm"></i>
                                                    <span>Đang Sử Dụng</span>
                                                </button>
                                            ) : (
                                                <button type="button" onClick={() => openTierModal("tier4")} className="w-full mt-4 py-2.5 px-4 rounded-xl bg-amber-500/10 hover:bg-[#C28807] hover:text-[#111210] dark:bg-amber-400/10 dark:hover:bg-[#C28807] text-amber-700 dark:text-amber-300 border border-amber-400/30 text-xs font-metadata-spec font-black transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95">
                                                    <span>Xem Chi Tiết Đặc Quyền</span>
                                                    <i className="ph-bold ph-arrow-right"></i>
                                                </button>
                                            )}
                                        </div>

                                    </div>
                                ) : (
                                    <div className="p-4 rounded-2xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border flex flex-wrap items-center justify-between gap-3 text-xs shadow-sm">
                                        <div className="flex flex-wrap items-center gap-3 font-bold">
                                            <span className="text-emerald-600 dark:text-emerald-400">🌱 Thợ Cày (Cấp I)</span>
                                            <span className="text-ink-muted">•</span>
                                            <span className="text-slate-600 dark:text-slate-300">🚜 Cao Thủ Cày (Cấp II)</span>
                                            <span className="text-ink-muted">•</span>
                                            <span className="text-gold">🌾 Lão Nông (Cấp III)</span>
                                            <span className="text-ink-muted">•</span>
                                            <span className="text-amber-500">🏰 Đại Điền Chủ (VIP)</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setIsTiersCollapsed(false)}
                                            className="text-wine dark:text-gold font-bold hover:underline flex items-center gap-1"
                                        >
                                            <span>Mở rộng chi tiết 4 cấp</span>
                                            <i className="ph-bold ph-arrow-down"></i>
                                        </button>
                                    </div>
                                )}
                            </div>



                            <div className="rounded-2xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border p-6 shadow-sm space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-paper-border dark:border-night-border">
                                    <div>
                                        <h3 className="font-display font-black text-lg text-ink dark:text-night-text flex items-center gap-2">
                                            <i className="ph-bold ph-table text-wine dark:text-gold"></i>
                                            Bảng So Sánh Quyền Lợi Chi Tiết Giữa Các Cấp
                                        </h3>
                                        <p className="font-editorial-body text-xs text-ink-muted dark:text-night-muted">
                                            Tra cứu rõ ràng từng tiêu chí đặc quyền dành cho từng bậc thành viên HALM BOOK.
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setIsComparisonPopupOpen(true)}
                                            className="px-3.5 py-1.5 rounded-xl bg-wine/10 dark:bg-gold/15 hover:bg-wine hover:text-white dark:hover:bg-gold dark:hover:text-night-bg text-wine dark:text-gold text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                                            title="Hiển thị bảng so sánh dưới dạng popup phóng to"
                                        >
                                            <i className="ph-bold ph-arrows-out text-sm"></i>
                                            <span>Xem Dạng Popup</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setIsComparisonCollapsed((prev) => !prev)}
                                            className="px-3.5 py-1.5 rounded-xl border border-paper-border dark:border-night-border hover:bg-paper-200 dark:hover:bg-night-surface text-xs font-bold text-ink dark:text-night-text flex items-center gap-1.5 transition-colors shadow-sm"
                                            title={isComparisonCollapsed ? "Mở rộng bảng so sánh" : "Thu gọn bảng so sánh"}
                                        >
                                            <i className={`ph-bold ${isComparisonCollapsed ? 'ph-caret-down' : 'ph-caret-up'}`}></i>
                                            <span>{isComparisonCollapsed ? "Mở Rộng" : "Thu Gọn"}</span>
                                        </button>
                                    </div>
                                </div>


                                {!isComparisonCollapsed ? (
                                <div className="overflow-x-auto -mx-2">
                                    <table className="w-full text-left text-xs font-metadata-spec border-collapse min-w-[700px]">
                                        <thead>
                                            <tr className="border-b border-paper-border dark:border-night-border text-ink-muted dark:text-night-muted font-bold">
                                                <th className="py-3 px-4 w-1/4">Đặc Quyền Cốt Lõi</th>
                                                <th className="py-3 px-4 text-center text-emerald-600 dark:text-emerald-400">🌱 Thợ Cày</th>
                                                <th className="py-3 px-4 text-center text-slate-700 dark:text-slate-300">🚜 Cao Thủ Cày</th>
                                                <th className="py-3 px-4 text-center text-gold">🌾 Lão Nông</th>
                                                <th className="py-3 px-4 text-center text-amber-500 dark:text-amber-400 bg-gold/5 dark:bg-gold/10 rounded-t-lg">🏰 Đại Điền Chủ</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-paper-border dark:divide-night-border text-ink dark:text-night-text">
                                            <tr className="hover:bg-paper dark:hover:bg-night-surface/50 transition-colors">
                                                <td className="py-3 px-4 font-bold">Mức chiết khấu thuê & mua sách</td>
                                                <td className="py-3 px-4 text-center text-ink-muted">0%</td>
                                                <td className="py-3 px-4 text-center font-bold text-slate-700 dark:text-slate-300">Giảm 5%</td>
                                                <td className="py-3 px-4 text-center font-bold text-gold">Giảm 10%</td>
                                                <td className="py-3 px-4 text-center font-black text-amber-600 dark:text-amber-400 bg-gold/5 dark:bg-gold/10">Giảm 20% trọn đời</td>
                                            </tr>
                                            <tr className="hover:bg-paper dark:hover:bg-night-surface/50 transition-colors">
                                                <td className="py-3 px-4 font-bold">Lượt tải lên (Upload) tài liệu cá nhân</td>
                                                <td className="py-3 px-4 text-center">3 lượt khởi điểm</td>
                                                <td className="py-3 px-4 text-center font-bold text-slate-700 dark:text-slate-300">10 tài liệu/tháng</td>
                                                <td className="py-3 px-4 text-center font-bold text-gold">30 tài liệu/tháng</td>
                                                <td className="py-3 px-4 text-center font-black text-amber-600 dark:text-amber-400 bg-gold/5 dark:bg-gold/10">Không giới hạn</td>
                                            </tr>
                                            <tr className="hover:bg-paper dark:hover:bg-night-surface/50 transition-colors">
                                                <td className="py-3 px-4 font-bold">Miễn phí sách chọn lọc hàng tháng</td>
                                                <td className="py-3 px-4 text-center text-ink-muted">—</td>
                                                <td className="py-3 px-4 text-center text-ink-muted">—</td>
                                                <td className="py-3 px-4 text-center font-bold text-gold">1 cuốn (1 trong 5 sách đề xuất)</td>
                                                <td className="py-3 px-4 text-center font-black text-amber-600 dark:text-amber-400 bg-gold/5 dark:bg-gold/10">3 cuốn tự chọn</td>
                                            </tr>
                                            <tr className="hover:bg-paper dark:hover:bg-night-surface/50 transition-colors">
                                                <td className="py-3 px-4 font-bold">Đọc trước tác phẩm mới xuất bản</td>
                                                <td className="py-3 px-4 text-center text-ink-muted">—</td>
                                                <td className="py-3 px-4 text-center">Trước 3 ngày</td>
                                                <td className="py-3 px-4 text-center font-bold text-gold">Trước 7 ngày</td>
                                                <td className="py-3 px-4 text-center font-bold text-amber-600 dark:text-amber-400 bg-gold/5 dark:bg-gold/10">Trước 14 ngày</td>
                                            </tr>
                                            <tr className="hover:bg-paper dark:hover:bg-night-surface/50 transition-colors">
                                                <td className="py-3 px-4 font-bold">Quà tặng tri ân sinh nhật</td>
                                                <td className="py-3 px-4 text-center text-ink-muted">Voucher 5%</td>
                                                <td className="py-3 px-4 text-center">Voucher 10% + 20 Khoai</td>
                                                <td className="py-3 px-4 text-center font-bold text-gold">1 Ebook tặng + 50 Khoai</td>
                                                <td className="py-3 px-4 text-center font-black text-amber-600 dark:text-amber-400 bg-gold/5 dark:bg-gold/10">Hộp quà ấn bản sách tận nhà</td>
                                            </tr>
                                            <tr className="hover:bg-paper dark:hover:bg-night-surface/50 transition-colors">
                                                <td className="py-3 px-4 font-bold">Khung Avatar & Huy hiệu danh dự</td>
                                                <td className="py-3 px-4 text-center">Mầm xanh 🌱</td>
                                                <td className="py-3 px-4 text-center">Huy hiệu Bạc 🚜</td>
                                                <td className="py-3 px-4 text-center font-bold text-gold">Khung Vàng Tinh Hoa 🌾</td>
                                                <td className="py-3 px-4 text-center font-black text-amber-600 dark:text-amber-400 bg-gold/5 dark:bg-gold/10">Khung 3D Hoàng Gia Ánh Kim 👑</td>
                                            </tr>
                                            <tr className="hover:bg-paper dark:hover:bg-night-surface/50 transition-colors">
                                                <td className="py-3 px-4 font-bold">Chăm sóc & Hỗ trợ độc giả</td>
                                                <td className="py-3 px-4 text-center">Hỗ trợ tiêu chuẩn</td>
                                                <td className="py-3 px-4 text-center">Ưu tiên hàng đợi 2h</td>
                                                <td className="py-3 px-4 text-center font-bold">Hotline VIP riêng 24/7</td>
                                                <td className="py-3 px-4 text-center font-black text-amber-600 dark:text-amber-400 bg-gold/5 dark:bg-gold/10">Chuyên viên VIP riêng (1-on-1)</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                                ) : (
                                    <div className="py-3 px-4 rounded-xl bg-paper dark:bg-night-surface text-xs text-ink-muted dark:text-night-muted flex flex-wrap items-center justify-between gap-3 shadow-inner">
                                        <span>Bảng so sánh quyền lợi chi tiết đã được thu gọn để tối ưu không gian hiển thị.</span>
                                        <div className="flex items-center gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setIsComparisonPopupOpen(true)}
                                                className="text-wine dark:text-gold font-bold hover:underline"
                                            >
                                                Mở dạng Popup
                                            </button>
                                            <span>•</span>
                                            <button
                                                type="button"
                                                onClick={() => setIsComparisonCollapsed(false)}
                                                className="text-wine dark:text-gold font-bold hover:underline"
                                            >
                                                Mở rộng bảng
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>



                            <div className="space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div>
                                        <h3 className="font-display font-black text-lg text-ink dark:text-night-text flex items-center gap-2">
                                            <i className="ph-bold ph-lightning text-amber-500"></i>
                                            Nhiệm Vụ Cày Điểm XP Thăng Cấp Nhanh
                                        </h3>
                                        <p className="font-editorial-body text-xs text-ink-muted dark:text-night-muted">
                                            Hoàn thành các thử thách hàng ngày và nhiệm vụ độc giả để tích lũy XP thăng hạng thần tốc.
                                        </p>
                                    </div>
                                    <Link
                                        to="/nhiemvu"
                                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-wine hover:bg-wine-dark text-white dark:bg-gold dark:hover:bg-gold-light dark:text-night-bg text-xs font-metadata-spec font-bold transition-all shadow-sm shrink-0"
                                    >
                                        <i className="ph-bold ph-target text-sm"></i>
                                        <span>Trung Tâm Nhiệm Vụ & Streak</span>
                                        <i className="ph-bold ph-caret-right text-xs"></i>
                                    </Link>
                                </div>


                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">


                                    <div className="rounded-xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border p-4 shadow-sm flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="w-7 h-7 rounded-lg bg-wine/10 dark:bg-gold/15 text-wine dark:text-gold flex items-center justify-center text-sm">
                                                    <i className="ph-bold ph-timer"></i>
                                                </span>
                                                <span className="font-metadata-spec text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                                                    +20 XP • +5 Khoai
                                                </span>
                                            </div>
                                            <h4 className="font-display font-bold text-xs text-ink dark:text-night-text">Đọc sách 30 phút hôm nay</h4>
                                            <p className="font-editorial-body text-[11px] text-ink-muted dark:text-night-muted mt-1">Duy trì thói quen đọc sách hàng ngày trên trình đọc số.</p>

                                            <div className="mt-3">
                                                <div className="flex justify-between text-[10px] font-metadata-spec font-bold text-ink-muted dark:text-night-muted mb-1">
                                                    <span>Tiến độ: 15 / 30 phút</span>
                                                    <span>50%</span>
                                                </div>
                                                <div className="w-full h-1.5 rounded-full bg-paper-200 dark:bg-night-border overflow-hidden">
                                                    <div className="h-full bg-wine dark:bg-gold rounded-full" style={{ width: '50%' }}></div>
                                                </div>
                                            </div>
                                        </div>

                                        <Link to="/" className="mt-3.5 w-full py-1.5 text-center rounded-lg bg-paper-200 dark:bg-night-surface hover:bg-wine hover:text-white dark:hover:bg-gold dark:hover:text-night-bg text-ink dark:text-night-text text-[11px] font-metadata-spec font-bold transition-colors">
                                            Đọc Sách Ngay
                                        </Link>
                                    </div>


                                    <div className="rounded-xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border p-4 shadow-sm flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center text-sm">
                                                    <i className="ph-bold ph-pencil-line"></i>
                                                </span>
                                                <span className="font-metadata-spec text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                                                    +50 XP • +15 Khoai
                                                </span>
                                            </div>
                                            <h4 className="font-display font-bold text-xs text-ink dark:text-night-text">Đánh giá sách vừa đọc gần nhất 1 cách thành tâm</h4>
                                            <p className="font-editorial-body text-[11px] text-ink-muted dark:text-night-muted mt-1">Gửi nhận xét và cảm nghĩ chân thực về cuốn sách bạn vừa hoàn thành.</p>

                                            <div className="mt-3">
                                                <div className="flex justify-between text-[10px] font-metadata-spec font-bold text-ink-muted dark:text-night-muted mb-1">
                                                    <span>Tiến độ: 0 / 1 bài</span>
                                                    <span>0%</span>
                                                </div>
                                                <div className="w-full h-1.5 rounded-full bg-paper-200 dark:bg-night-border overflow-hidden">
                                                    <div className="h-full bg-blue-500 rounded-full" style={{ width: '0%' }}></div>
                                                </div>
                                            </div>
                                        </div>

                                        <Link to="/" className="mt-3.5 w-full py-1.5 text-center rounded-lg bg-paper-200 dark:bg-night-surface hover:bg-wine hover:text-white dark:hover:bg-gold dark:hover:text-night-bg text-ink dark:text-night-text text-[11px] font-metadata-spec font-bold transition-colors">
                                            Đánh Giá Ngay
                                        </Link>
                                    </div>


                                    <div className="rounded-xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border p-4 shadow-sm flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center text-sm">
                                                    <i className="ph-bold ph-fire"></i>
                                                </span>
                                                <span className="font-metadata-spec text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                                                    +100 XP • +30 Khoai
                                                </span>
                                            </div>
                                            <h4 className="font-display font-bold text-xs text-ink dark:text-night-text">Chuỗi đọc 7 ngày liên tiếp</h4>
                                            <p className="font-editorial-body text-[11px] text-ink-muted dark:text-night-muted mt-1">Đăng nhập và hoàn thành ít nhất 1 chương sách mỗi ngày.</p>

                                            <div className="mt-3">
                                                <div className="flex justify-between text-[10px] font-metadata-spec font-bold text-ink-muted dark:text-night-muted mb-1">
                                                    <span>Tiến độ: 5 / 7 ngày</span>
                                                    <span>71%</span>
                                                </div>
                                                <div className="w-full h-1.5 rounded-full bg-paper-200 dark:bg-night-border overflow-hidden">
                                                    <div className="h-full bg-amber-500 rounded-full" style={{ width: '71%' }}></div>
                                                </div>
                                            </div>
                                        </div>

                                        <button type="button" onClick={() => showToast("Chuỗi Đọc", "Bạn đang duy trì chuỗi 5 ngày. Hãy đọc tiếp hôm nay để đạt mốc 7 ngày!")} className="mt-3.5 w-full py-1.5 text-center rounded-lg bg-paper-200 dark:bg-night-surface hover:bg-wine hover:text-white dark:hover:bg-gold dark:hover:text-night-bg text-ink dark:text-night-text text-[11px] font-metadata-spec font-bold transition-colors">
                                            Tiếp Tục Streak 🔥
                                        </button>
                                    </div>


                                    <div className="rounded-xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border p-4 shadow-sm flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-sm">
                                                    <i className="ph-bold ph-users-three"></i>
                                                </span>
                                                <span className="font-metadata-spec text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                                                    +150 XP • +50 Khoai
                                                </span>
                                            </div>
                                            <h4 className="font-display font-bold text-xs text-ink dark:text-night-text">Mời bạn bè cùng đọc sách</h4>
                                            <p className="font-editorial-body text-[11px] text-ink-muted dark:text-night-muted mt-1">Gửi liên kết giới thiệu để bạn bè tạo tài khoản độc giả.</p>

                                            <div className="mt-3">
                                                <div className="flex justify-between text-[10px] font-metadata-spec font-bold text-ink-muted dark:text-night-muted mb-1">
                                                    <span>Tiến độ: 0 / 1 người</span>
                                                    <span>0%</span>
                                                </div>
                                                <div className="w-full h-1.5 rounded-full bg-paper-200 dark:bg-night-border overflow-hidden">
                                                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: '0%' }}></div>
                                                </div>
                                            </div>
                                        </div>

                                        <button type="button" onClick={copyInviteLink} className="mt-3.5 w-full py-1.5 text-center rounded-lg bg-paper-200 dark:bg-night-surface hover:bg-wine hover:text-white dark:hover:bg-gold dark:hover:text-night-bg text-ink dark:text-night-text text-[11px] font-metadata-spec font-bold transition-colors flex items-center justify-center gap-1">
                                            <i className="ph-bold ph-copy"></i>
                                            <span>Sao Chép Mã Mời</span>
                                        </button>
                                    </div>

                                </div>
                            </div>




                        </div>
                    </div>
                </main>



                {/* POPUP MODAL: BẢNG SO SÁNH QUYỀN LỢI CHI TIẾT */}
                {isComparisonPopupOpen && (
                    <div
                        id="comparisonModal"
                        onClick={(e) => { if (e.target === e.currentTarget) setIsComparisonPopupOpen(false); }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-fade-in"
                    >
                        <div className="relative w-full max-w-5xl max-h-[92vh] bg-paper-surface dark:bg-night-card rounded-3xl border border-paper-border dark:border-night-border shadow-2xl flex flex-col overflow-hidden">
                            {/* Modal Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-paper-border dark:border-night-border bg-paper dark:bg-night-surface shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-wine/10 dark:bg-gold/15 text-wine dark:text-gold flex items-center justify-center text-lg">
                                        <i className="ph-bold ph-table"></i>
                                    </div>
                                    <div>
                                        <h3 className="font-display font-black text-base sm:text-lg text-ink dark:text-night-text">
                                            Bảng So Sánh Quyền Lợi Chi Tiết Giữa Các Cấp
                                        </h3>
                                        <p className="text-xs text-ink-muted dark:text-night-muted">
                                            Quy chuẩn 4 bậc hội viên HALM BOOK: Thợ Cày, Cao Thủ Cày, Lão Nông, Đại Điền Chủ
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsComparisonPopupOpen(false)}
                                    className="w-8 h-8 rounded-full bg-paper-200 dark:bg-night-border hover:bg-rose-500 hover:text-white text-ink dark:text-night-text flex items-center justify-center transition-colors"
                                    aria-label="Đóng popup bảng so sánh"
                                >
                                    <i className="ph-bold ph-x text-base"></i>
                                </button>
                            </div>

                            {/* Modal Body - Scrollable Table */}
                            <div className="p-4 sm:p-6 overflow-auto flex-1 text-xs font-metadata-spec">
                                <table className="w-full text-left border-collapse min-w-[700px]">
                                    <thead>
                                        <tr className="border-b border-paper-border dark:border-night-border text-ink-muted dark:text-night-muted font-bold text-xs">
                                            <th className="py-3 px-4 w-1/4">Đặc Quyền Cốt Lõi</th>
                                            <th className="py-3 px-4 text-center text-emerald-600 dark:text-emerald-400">🌱 Thợ Cày (Cấp I)</th>
                                            <th className="py-3 px-4 text-center text-slate-700 dark:text-slate-300">🚜 Cao Thủ Cày (Cấp II)</th>
                                            <th className="py-3 px-4 text-center text-gold">🌾 Lão Nông (Cấp III)</th>
                                            <th className="py-3 px-4 text-center text-amber-500 dark:text-amber-400 bg-gold/5 dark:bg-gold/10 rounded-t-lg">🏰 Đại Điền Chủ (VIP)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-paper-border dark:divide-night-border">
                                        <tr className="hover:bg-paper dark:hover:bg-night-surface/50 transition-colors">
                                            <td className="py-3.5 px-4 font-bold">Mượn & Thuê sách đồng thời</td>
                                            <td className="py-3.5 px-4 text-center font-bold text-emerald-600 dark:text-emerald-400">2 cuốn / lần</td>
                                            <td className="py-3.5 px-4 text-center font-bold">5 cuốn / lần</td>
                                            <td className="py-3.5 px-4 text-center font-bold text-gold">10 cuốn / lần</td>
                                            <td className="py-3.5 px-4 text-center font-black text-amber-600 dark:text-amber-400 bg-gold/5 dark:bg-gold/10">Không giới hạn</td>
                                        </tr>
                                        <tr className="hover:bg-paper dark:hover:bg-night-surface/50 transition-colors">
                                            <td className="py-3.5 px-4 font-bold">Chiết khấu thuê/mua sách</td>
                                            <td className="py-3.5 px-4 text-center">Giá niêm yết</td>
                                            <td className="py-3.5 px-4 text-center font-bold text-emerald-600 dark:text-emerald-400">Giảm 5% trọn đời</td>
                                            <td className="py-3.5 px-4 text-center font-bold text-gold">Giảm 10% trọn đời</td>
                                            <td className="py-3.5 px-4 text-center font-black text-amber-600 dark:text-amber-400 bg-gold/5 dark:bg-gold/10">Giảm 20% toàn sàn</td>
                                        </tr>
                                        <tr className="hover:bg-paper dark:hover:bg-night-surface/50 transition-colors">
                                            <td className="py-3.5 px-4 font-bold">Thời hạn mượn tối đa</td>
                                            <td className="py-3.5 px-4 text-center">7 ngày</td>
                                            <td className="py-3.5 px-4 text-center">14 ngày</td>
                                            <td className="py-3.5 px-4 text-center font-bold text-gold">30 ngày</td>
                                            <td className="py-3.5 px-4 text-center font-black text-amber-600 dark:text-amber-400 bg-gold/5 dark:bg-gold/10">60 ngày + Miễn phí gia hạn</td>
                                        </tr>
                                        <tr className="hover:bg-paper dark:hover:bg-night-surface/50 transition-colors">
                                            <td className="py-3.5 px-4 font-bold">Khoai thưởng khi hoàn thành sách</td>
                                            <td className="py-3.5 px-4 text-center font-bold">+10 Khoai 🥔</td>
                                            <td className="py-3.5 px-4 text-center font-bold">+20 Khoai 🥔</td>
                                            <td className="py-3.5 px-4 text-center font-bold text-gold">+40 Khoai 🥔</td>
                                            <td className="py-3.5 px-4 text-center font-black text-amber-600 dark:text-amber-400 bg-gold/5 dark:bg-gold/10">+80 Khoai 🥔</td>
                                        </tr>
                                        <tr className="hover:bg-paper dark:hover:bg-night-surface/50 transition-colors">
                                            <td className="py-3.5 px-4 font-bold">Đọc trước tác phẩm mới xuất bản</td>
                                            <td className="py-3.5 px-4 text-center text-ink-muted">—</td>
                                            <td className="py-3.5 px-4 text-center">Trước 3 ngày</td>
                                            <td className="py-3.5 px-4 text-center font-bold text-gold">Trước 7 ngày</td>
                                            <td className="py-3.5 px-4 text-center font-bold text-amber-600 dark:text-amber-400 bg-gold/5 dark:bg-gold/10">Trước 14 ngày</td>
                                        </tr>
                                        <tr className="hover:bg-paper dark:hover:bg-night-surface/50 transition-colors">
                                            <td className="py-3.5 px-4 font-bold">Quà tặng tri ân sinh nhật</td>
                                            <td className="py-3.5 px-4 text-center text-ink-muted">Voucher 5%</td>
                                            <td className="py-3.5 px-4 text-center">Voucher 10% + 20 Khoai</td>
                                            <td className="py-3.5 px-4 text-center font-bold text-gold">1 Ebook tặng + 50 Khoai</td>
                                            <td className="py-3.5 px-4 text-center font-black text-amber-600 dark:text-amber-400 bg-gold/5 dark:bg-gold/10">Hộp quà ấn bản sách tận nhà</td>
                                        </tr>
                                        <tr className="hover:bg-paper dark:hover:bg-night-surface/50 transition-colors">
                                            <td className="py-3.5 px-4 font-bold">Khung Avatar & Huy hiệu danh dự</td>
                                            <td className="py-3.5 px-4 text-center">Mầm xanh 🌱</td>
                                            <td className="py-3.5 px-4 text-center">Huy hiệu Bạc 🚜</td>
                                            <td className="py-3.5 px-4 text-center font-bold text-gold">Khung Vàng Tinh Hoa 🌾</td>
                                            <td className="py-3.5 px-4 text-center font-black text-amber-600 dark:text-amber-400 bg-gold/5 dark:bg-gold/10">Khung 3D Hoàng Gia Ánh Kim 👑</td>
                                        </tr>
                                        <tr className="hover:bg-paper dark:hover:bg-night-surface/50 transition-colors">
                                            <td className="py-3.5 px-4 font-bold">Chăm sóc & Hỗ trợ độc giả</td>
                                            <td className="py-3.5 px-4 text-center">Hỗ trợ tiêu chuẩn</td>
                                            <td className="py-3.5 px-4 text-center">Ưu tiên hàng đợi 2h</td>
                                            <td className="py-3.5 px-4 text-center font-bold">Hotline VIP riêng 24/7</td>
                                            <td className="py-3.5 px-4 text-center font-black text-amber-600 dark:text-amber-400 bg-gold/5 dark:bg-gold/10">Chuyên viên VIP riêng (1-on-1)</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* Modal Footer */}
                            <div className="px-6 py-3.5 border-t border-paper-border dark:border-night-border bg-paper dark:bg-night-surface flex items-center justify-between shrink-0">
                                <span className="text-xs text-ink-muted dark:text-night-muted">
                                    Hạng hiện tại: <strong className="text-emerald-600 dark:text-emerald-400">🌱 Thợ Cày (Cấp I)</strong>
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setIsComparisonPopupOpen(false)}
                                    className="px-5 py-2 rounded-xl bg-wine hover:bg-wine-dark text-white dark:bg-gold dark:hover:bg-gold-light dark:text-night-bg text-xs font-bold transition-all shadow-sm"
                                >
                                    Đóng Bảng So Sánh
                                </button>
                            </div>
                        </div>
                    </div>
                )}

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
