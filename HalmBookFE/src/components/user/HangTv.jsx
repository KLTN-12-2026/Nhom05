import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import UserLayout from './layout/UserLayout';
import { isDarkMode, applyTheme } from '@/utils/theme';

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

function renderTierContent(type) {
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
        return <>
            <p>Bạn hiện đã đọc <strong>1/10 cuốn sách</strong> (còn 9 cuốn nữa để đạt hạng):</p>
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
        return <>
            <p>Hạng Lão Nông là biểu tượng của độc giả kiên trì và thông tuệ trên HALM BOOK:</p>
            <div className="p-3 rounded-xl bg-gold/10 border border-gold/30 my-2">
                <div className="font-bold text-gold mb-1">Đặc quyền cao cấp mở khóa:</div>
                <ul className="list-disc pl-4 space-y-1 text-xs text-ink dark:text-night-text">
                    <li>Chiết khấu <strong>10%</strong> toàn bộ dịch vụ và thuê sách trọn đời.</li>
                    <li><strong>Miễn phí 1 cuốn sách mỗi tháng</strong> (1 trong 5 sách do web cho phép).</li>
                    <li>Khung avatar Tinh Hoa hào quang vàng kim lấp lánh độc quyền.</li>
                    <li>Đọc trước các tác phẩm mới xuất bản trước 7 ngày.</li>
                    <li>Hotline hỗ trợ riêng 24/7.</li>
                </ul>
            </div>
        </>;
    }
    if (type === 'tier4') {
        return <>
            <p>Đỉnh cao danh dự dành cho những độc giả xuất sắc nhất:</p>
            <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500/10 to-amber-600/10 border border-amber-500/40 my-2">
                <div className="font-bold text-amber-500 mb-1">Đặc quyền tối thượng:</div>
                <ul className="list-disc pl-4 space-y-1 text-xs text-ink dark:text-night-text">
                    <li>Giảm <strong>20%</strong> toàn bộ dịch vụ HALM BOOK trọn đời.</li>
                    <li>Tặng <strong>hộp quà ấn bản sách bìa cứng mạ vàng độc quyền</strong> tận nhà hàng năm.</li>
                    <li>Đọc trước các tác phẩm mới xuất bản trước 14 ngày.</li>
                    <li>Chuyên viên chăm sóc khách hàng VIP riêng biệt (1-on-1).</li>
                    <li>Khung 3D Hoàng Gia Ánh Kim lấp lánh biểu tượng vương giả.</li>
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
        return <>Số dư hiện tại của bạn là <strong>350 Khoai Tây 🥔</strong>. Bạn có thể dùng Khoai để thuê sách hoặc tham gia các gói cước ưu đãi tại trang <Link to="/trangchu#trending-section" className="text-gold underline font-bold">Ưu Đãi</Link>.</>;
    }
    return 'Tôi có thể hỗ trợ bạn tìm hiểu về 4 cấp bậc thành viên (Thợ Cày 🌱, Cao Thủ Cày 🚜, Lão Nông 🌾, Đại Điền Chủ 🏰), điều kiện thăng hạng hoặc các nhiệm vụ nhận XP!';
}


export default function Tiers() {
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
            transition: background-color 0.4s ease, color 0.4s ease;
        }

        .dark .tiers-page {
            background-color: #111210;
            color: #EDE9DF;
        }

        .tiers-page [class~="bg-paper"] { background-color: #F7F4EE; }
        .tiers-page [class~="bg-paper-surface"] { background-color: #FFFEFA; }
        .tiers-page [class~="bg-paper-200"] { background-color: #EAE5D9; }
        .tiers-page [class~="bg-paper-200/70"] { background-color: rgb(234 229 217 / 0.7); }
        .tiers-page [class~="bg-wine"] { background-color: #8E3038; }
        .tiers-page [class~="bg-wine/10"] { background-color: rgb(142 48 56 / 0.1); }
        .tiers-page [class~="bg-wine/20"] { background-color: rgb(142 48 56 / 0.2); }
        .tiers-page [class~="bg-gold"] { background-color: #B8860B; }
        .tiers-page [class~="bg-gold/5"] { background-color: rgb(184 134 11 / 0.05); }
        .tiers-page [class~="bg-gold/10"] { background-color: rgb(184 134 11 / 0.1); }
        .tiers-page [class~="bg-gold/15"] { background-color: rgb(184 134 11 / 0.15); }
        .tiers-page [class~="bg-night-card"] { background-color: #20221E; }
        .tiers-page [class~="bg-night-border"] { background-color: #2C2E29; }

        .tiers-page [class~="text-ink"] { color: #1E1F1D; }
        .tiers-page [class~="text-ink/80"] { color: rgb(30 31 29 / 0.8); }
        .tiers-page [class~="text-ink-muted"] { color: #66645E; }
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
                        <aside className="w-full lg:w-80 shrink-0 space-y-5 lg:sticky lg:top-24 lg:self-start">

                            {/* 1. Profile Avatar Card */}
                            <div className="rounded-2xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border p-6 shadow-sm flex flex-col items-center text-center relative overflow-hidden group">

                                <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-36 h-36 bg-wine/10 dark:bg-gold/10 rounded-full blur-2xl pointer-events-none"></div>

                                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-wine to-wine-light dark:from-gold dark:to-gold-light p-1 shadow-md mb-3.5 relative">
                                    <div className="w-full h-full rounded-full bg-paper-surface dark:bg-night-surface flex items-center justify-center font-display font-black text-2xl text-wine dark:text-gold">
                                        A
                                    </div>
                                    <span className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white dark:border-night-card flex items-center justify-center text-[10px] text-white" title="Trực tuyến">
                                        <i className="ph-bold ph-check text-[9px]"></i>
                                    </span>
                                </div>

                                <h2 className="font-display font-black text-lg text-ink dark:text-night-text leading-tight">
                                    Alex Nguyễn
                                </h2>
                                <p className="font-metadata-spec text-xs text-ink-muted dark:text-night-muted mt-0.5">
                                    @alex.ng99
                                </p>

                                <div className="mt-3.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25 text-xs font-metadata-spec font-bold" title="Hạng hiện tại">
                                    <i className="ph-bold ph-plant text-emerald-600 dark:text-emerald-400"></i>
                                    <span>THỢ CÀY 🌱</span>
                                </div>

                                <div className="grid grid-cols-2 gap-2 w-full pt-4 mt-4 border-t border-paper-border dark:border-night-border text-center">
                                    <Link to="/canhan?tab=wallet" className="p-2.5 rounded-xl bg-paper dark:bg-night-surface border border-paper-border dark:border-night-border hover:border-gold transition-colors">
                                        <span className="block font-metadata-spec text-base font-black text-ink dark:text-night-text">350</span>
                                        <span className="font-metadata-spec text-[10px] text-ink-muted dark:text-night-muted">Khoai Tích Lũy</span>
                                    </Link>
                                    <div className="p-2.5 rounded-xl bg-paper dark:bg-night-surface border border-paper-border dark:border-night-border">
                                        <span className="block font-metadata-spec text-base font-black text-ink dark:text-night-text">1 / 10</span>
                                        <span className="font-metadata-spec text-[10px] text-ink-muted dark:text-night-muted">Sách Thăng Hạng</span>
                                    </div>
                                </div>
                            </div>

                            {/* 2. Navigation Menu Card - STRICT ORDER (1: Profile, 2: Bookshelf, 3: Tiers, 4: Wallet, 5: History, Divider, 6: Logout) */}
                            <div className="rounded-2xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border p-3 shadow-sm space-y-1">
                                {/* 1. Thông Tin Cá Nhân */}
                                <Link
                                    to="/canhan"
                                    className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-metadata-spec font-bold text-ink-muted dark:text-night-muted hover:bg-paper-200 dark:hover:bg-night-surface hover:text-ink dark:hover:text-night-text transition-colors"
                                >
                                    <i className="ph-bold ph-user text-base text-ink-muted dark:text-night-muted"></i>
                                    <span>Thông Tin Cá Nhân</span>
                                </Link>

                                {/* 2. Tủ Sách Cá Nhân */}
                                <Link
                                    to="/tusachcn"
                                    className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-metadata-spec font-bold text-ink-muted dark:text-night-muted hover:bg-paper-200 dark:hover:bg-night-surface hover:text-ink dark:hover:text-night-text transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <i className="ph-bold ph-book-bookmark text-base text-ink-muted dark:text-night-muted"></i>
                                        <span>Tủ Sách Cá Nhân</span>
                                    </div>
                                    <span className="potato-badge text-[11px] py-0 px-2">12 cuốn</span>
                                </Link>

                                {/* 3. Hạng Thành Viên (ACTIVE) */}
                                <Link
                                    to="/hang"
                                    className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-metadata-spec font-bold bg-wine text-white dark:bg-gold dark:text-night-bg shadow-sm transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <i className="ph-bold ph-trophy text-base"></i>
                                        <span>Hạng Thành Viên</span>
                                    </div>
                                    <span className="text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full bg-white/20 dark:bg-black/20">Active</span>
                                </Link>

                                {/* 4. Ví Khoai Tây */}
                                <Link
                                    to="/canhan?tab=wallet"
                                    className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-metadata-spec font-bold text-ink-muted dark:text-night-muted hover:bg-paper-200 dark:hover:bg-night-surface hover:text-ink dark:hover:text-night-text transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <i className="ph-bold ph-wallet text-base text-ink-muted dark:text-night-muted"></i>
                                        <span>Ví Khoai Tây</span>
                                    </div>
                                    <span className="potato-badge text-[11px] py-0 px-2">350 🥔</span>
                                </Link>

                                {/* 5. Lịch Sử Giao Dịch */}
                                <Link
                                    to="/canhan?tab=history"
                                    className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-metadata-spec font-bold text-ink-muted dark:text-night-muted hover:bg-paper-200 dark:hover:bg-night-surface hover:text-ink dark:hover:text-night-text transition-colors"
                                >
                                    <i className="ph-bold ph-clock-counter-clockwise text-base text-ink-muted dark:text-night-muted"></i>
                                    <span>Lịch Sử Giao Dịch</span>
                                </Link>

                                {/* Divider Line */}
                                <div className="pt-2 border-t border-paper-border dark:border-night-border mt-2">
                                    {/* 6. Đăng Xuất */}
                                    <Link
                                        to="/dangnhap"
                                        className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-metadata-spec font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                                    >
                                        <i className="ph-bold ph-sign-out text-base"></i>
                                        <span>Đăng Xuất</span>
                                    </Link>
                                </div>
                            </div>

                        </aside>



                        <div className="flex-1 min-w-0 w-full space-y-8">


                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-paper-border dark:border-night-border">
                                <div>
                                    <div className="flex items-center gap-2 text-xs font-metadata-spec text-ink-muted dark:text-night-muted mb-1">
                                        <Link to="/trangchu" className="hover:underline">Trang chủ</Link>
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
                                                    THỢ CÀY <span className="text-xl">🌱</span>
                                                </h3>
                                                <span className="font-metadata-spec text-xs font-bold text-slate-400">TIER I</span>
                                            </div>
                                        </div>


                                        <div className="flex items-end justify-between relative z-10 pt-3 border-t border-white/15">
                                            <div>
                                                <span className="font-metadata-spec text-[9px] uppercase tracking-wider text-slate-400 block font-semibold">Chủ thẻ thành viên</span>
                                                <span className="font-display font-black text-sm tracking-wide text-white uppercase">Alex Nguyễn</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="font-metadata-spec text-[9px] uppercase tracking-wider text-slate-400 block font-semibold">Mã thành viên</span>
                                                <span className="font-metadata-spec text-xs font-mono font-bold text-amber-300 tracking-wider">HALM-9924-VN</span>
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
                                                    Mục tiêu kế tiếp: <span className="text-wine dark:text-gold">Cao Thủ Cày 🚜</span>
                                                </h3>
                                            </div>
                                            <span className="potato-badge text-xs font-bold">
                                                <i className="ph-bold ph-shield-check text-emerald-600 dark:text-emerald-400"></i>
                                                <span>Hạng Vĩnh Viễn</span>
                                            </span>
                                        </div>


                                        <div className="mt-5 space-y-2">
                                            <div className="flex items-center justify-between text-xs font-metadata-spec font-bold">
                                                <span className="text-ink dark:text-night-text flex items-center gap-1.5">
                                                    <i className="ph-bold ph-book-open text-wine dark:text-gold"></i>
                                                    Tiến trình đọc: <strong>1 / 10 Cuốn sách</strong>
                                                </span>
                                                <span className="text-wine dark:text-gold font-extrabold text-sm">10% Hoàn Thành</span>
                                            </div>


                                            <div className="w-full h-4 rounded-full bg-paper-200 dark:bg-night-border p-0.5 overflow-hidden shadow-inner">
                                                <div className="h-full rounded-full bg-gradient-to-r from-wine to-wine-light dark:from-gold dark:to-gold-light progress-striped transition-all duration-700" style={{ width: '10%' }}></div>
                                            </div>

                                            <div className="flex items-center justify-between text-[11px] font-metadata-spec text-ink-muted dark:text-night-muted pt-1">
                                                <span>🌱 Thợ Cày (0 sách)</span>
                                                <span className="font-bold text-wine dark:text-gold">Chỉ còn 9 cuốn sách nữa</span>
                                                <span>🚜 Cao Thủ Cày (10 sách)</span>
                                            </div>
                                        </div>
                                    </div>


                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5 mt-5 border-t border-paper-border dark:border-night-border">
                                        <div className="p-3 rounded-xl bg-paper dark:bg-night-surface border border-paper-border dark:border-night-border text-center">
                                            <span className="font-metadata-spec text-[10px] font-bold uppercase text-ink-muted dark:text-night-muted block">Sách đã cày</span>
                                            <span className="font-display font-black text-lg text-ink dark:text-night-text mt-0.5 block">1 <span className="text-xs font-normal text-ink-muted dark:text-night-muted">cuốn</span></span>
                                        </div>
                                        <div className="p-3 rounded-xl bg-paper dark:bg-night-surface border border-paper-border dark:border-night-border text-center">
                                            <span className="font-metadata-spec text-[10px] font-bold uppercase text-ink-muted dark:text-night-muted block">Điểm cày (XP)</span>
                                            <span className="font-display font-black text-lg text-ink dark:text-night-text mt-0.5 block">120 <span className="text-xs font-normal text-gold">XP</span></span>
                                        </div>
                                        <div className="p-3 rounded-xl bg-paper dark:bg-night-surface border border-paper-border dark:border-night-border text-center">
                                            <span className="font-metadata-spec text-[10px] font-bold uppercase text-ink-muted dark:text-night-muted block">Chuỗi đọc</span>
                                            <span className="font-display font-black text-lg text-amber-500 mt-0.5 block flex items-center justify-center gap-0.5">5 <i className="ph-fill ph-fire text-base"></i></span>
                                        </div>
                                        <div className="p-3 rounded-xl bg-paper dark:bg-night-surface border border-paper-border dark:border-night-border text-center">
                                            <span className="font-metadata-spec text-[10px] font-bold uppercase text-ink-muted dark:text-night-muted block">Chiết khấu</span>
                                            <span className="font-display font-black text-lg text-emerald-600 dark:text-emerald-400 mt-0.5 block">Cơ bản</span>
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
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 transition-all">


                                    <div className="rounded-2xl bg-paper-surface dark:bg-night-card border-2 border-emerald-500/50 shadow-md p-6 flex flex-col justify-between relative group hover:shadow-xl transition-all">

                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-metadata-spec font-black uppercase tracking-wider shadow whitespace-nowrap">
                                            Hạng Hiện Tại
                                        </div>

                                        <div>

                                            <div className="flex items-center justify-between mb-4 mt-1">
                                                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-2xl border border-emerald-500/20">
                                                    🌱
                                                </div>
                                                <span className="font-metadata-spec text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                                                    Cấp I • Mầm Đọc
                                                </span>
                                            </div>

                                            <h3 className="font-display font-black text-xl text-ink dark:text-night-text">Thợ Cày</h3>
                                            <p className="font-metadata-spec text-xs font-bold text-ink-muted dark:text-night-muted mt-0.5">
                                                Yêu cầu: <span className="text-ink dark:text-night-text font-black">Tạo tài khoản mới</span>
                                            </p>

                                            <div className="my-4 pt-3 border-t border-paper-border dark:border-night-border space-y-2.5 text-xs font-editorial-body text-ink/80 dark:text-night-muted">
                                                <div className="flex items-start gap-2">
                                                    <i className="ph-bold ph-check text-emerald-600 dark:text-emerald-400 text-sm shrink-0 mt-0.5"></i>
                                                    <span>Thuê và đọc toàn bộ kho sách mở tiêu chuẩn</span>
                                                </div>
                                                <div className="flex items-start gap-2">
                                                    <i className="ph-bold ph-check text-emerald-600 dark:text-emerald-400 text-sm shrink-0 mt-0.5"></i>
                                                    <span>Mở khóa Ví Khoai Tây tích lũy điểm thưởng</span>
                                                </div>
                                                <div className="flex items-start gap-2">
                                                    <i className="ph-bold ph-check text-emerald-600 dark:text-emerald-400 text-sm shrink-0 mt-0.5"></i>
                                                    <span>Có thể khám phá và trải nghiệm toàn bộ hệ sinh thái của HALM BOOK</span>
                                                </div>
                                                <div className="flex items-start gap-2">
                                                    <i className="ph-bold ph-check text-emerald-600 dark:text-emerald-400 text-sm shrink-0 mt-0.5"></i>
                                                    <span>3 lượt Upload file free cho người mới</span>
                                                </div>
                                            </div>
                                        </div>

                                        <button type="button" disabled className="w-full mt-4 py-2.5 px-4 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-xs font-metadata-spec font-bold cursor-default flex items-center justify-center gap-1.5">
                                            <i className="ph-bold ph-check-circle"></i>
                                            <span>Đang Sử Dụng</span>
                                        </button>
                                    </div>


                                    <div className="rounded-2xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border hover:border-slate-400 dark:hover:border-slate-500 shadow-sm hover:shadow-xl p-6 flex flex-col justify-between relative group transition-all">

                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-slate-700 text-white text-[10px] font-metadata-spec font-black uppercase tracking-wider shadow whitespace-nowrap">
                                            Mục Tiêu Tiếp Theo
                                        </div>

                                        <div>

                                            <div className="flex items-center justify-between mb-4 mt-1">
                                                <div className="w-12 h-12 rounded-2xl bg-slate-500/10 text-slate-700 dark:text-slate-300 flex items-center justify-center text-2xl border border-slate-400/30">
                                                    🚜
                                                </div>
                                                <span className="font-metadata-spec text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-500/10 px-2.5 py-1 rounded-full">
                                                    Cấp II • Tri Thức
                                                </span>
                                            </div>

                                            <h3 className="font-display font-black text-xl text-ink dark:text-night-text">Cao Thủ Cày</h3>
                                            <p className="font-metadata-spec text-xs font-bold text-ink-muted dark:text-night-muted mt-0.5">
                                                Yêu cầu: <span className="text-wine dark:text-gold font-black">Đọc 10 Cuốn</span> (hoặc 500 Khoai)
                                            </p>

                                            <div className="my-4 pt-3 border-t border-paper-border dark:border-night-border space-y-2.5 text-xs font-editorial-body text-ink/80 dark:text-night-muted">
                                                <div className="flex items-start gap-2">
                                                    <i className="ph-bold ph-check text-slate-600 dark:text-slate-300 text-sm shrink-0 mt-0.5"></i>
                                                    <span><strong className="text-ink dark:text-night-text font-bold">Giảm 5%</strong> phí thuê & mua mọi đầu sách</span>
                                                </div>
                                                <div className="flex items-start gap-2">
                                                    <i className="ph-bold ph-check text-slate-600 dark:text-slate-300 text-sm shrink-0 mt-0.5"></i>
                                                    <span>Huy hiệu Cao Thủ Bạc danh dự bên cạnh tên</span>
                                                </div>
                                                <div className="flex items-start gap-2">
                                                    <i className="ph-bold ph-check text-slate-600 dark:text-slate-300 text-sm shrink-0 mt-0.5"></i>
                                                    <span>Đọc trước các tác phẩm mới xuất bản trước 3 ngày</span>
                                                </div>
                                                <div className="flex items-start gap-2">
                                                    <i className="ph-bold ph-check text-slate-600 dark:text-slate-300 text-sm shrink-0 mt-0.5"></i>
                                                    <span>Ưu tiên hàng đợi hỗ trợ CSKH trong vòng 2 giờ</span>
                                                </div>
                                            </div>
                                        </div>

                                        <button type="button" onClick={() => openTierModal("tier2")} className="w-full mt-4 py-2.5 px-4 rounded-xl bg-paper-200 dark:bg-night-surface hover:bg-slate-800 hover:text-white dark:hover:bg-slate-700 text-ink dark:text-night-text border border-paper-border dark:border-night-border text-xs font-metadata-spec font-bold transition-colors flex items-center justify-center gap-1.5">
                                            <span>Xem Lộ Trình Thăng Cấp</span>
                                            <i className="ph-bold ph-arrow-right"></i>
                                        </button>
                                    </div>


                                    <div className="rounded-2xl bg-paper-surface dark:bg-night-card border-2 border-gold/40 shadow-sm hover:shadow-xl p-6 flex flex-col justify-between relative group transition-all">

                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gold text-white dark:text-night-bg text-[10px] font-metadata-spec font-black uppercase tracking-wider shadow whitespace-nowrap">
                                            Phổ Biến Nhất ★
                                        </div>

                                        <div>

                                            <div className="flex items-center justify-between mb-4 mt-1">
                                                <div className="w-12 h-12 rounded-2xl bg-gold/15 text-gold flex items-center justify-center text-2xl border border-gold/30">
                                                    🌾
                                                </div>
                                                <span className="font-metadata-spec text-xs font-bold text-gold bg-gold/10 px-2.5 py-1 rounded-full">
                                                    Cấp III • Tinh Hoa
                                                </span>
                                            </div>

                                            <h3 className="font-display font-black text-xl text-ink dark:text-night-text">Lão Nông</h3>
                                            <p className="font-metadata-spec text-xs font-bold text-ink-muted dark:text-night-muted mt-0.5">
                                                Yêu cầu: <span className="text-wine dark:text-gold font-black">Đọc 50 Cuốn</span> (hoặc 2.500 Khoai)
                                            </p>

                                            <div className="my-4 pt-3 border-t border-paper-border dark:border-night-border space-y-2.5 text-xs font-editorial-body text-ink/80 dark:text-night-muted">
                                                <div className="flex items-start gap-2">
                                                    <i className="ph-bold ph-check text-gold text-sm shrink-0 mt-0.5"></i>
                                                    <span><strong className="text-ink dark:text-night-text font-bold">Giảm 10%</strong> toàn bộ chi phí thuê sách</span>
                                                </div>
                                                <div className="flex items-start gap-2">
                                                    <i className="ph-bold ph-check text-gold text-sm shrink-0 mt-0.5"></i>
                                                    <span><strong className="text-gold font-bold">Miễn phí 1 cuốn sách mỗi tháng</strong> (1 trong 5 sách do web cho phép)</span>
                                                </div>
                                                <div className="flex items-start gap-2">
                                                    <i className="ph-bold ph-check text-gold text-sm shrink-0 mt-0.5"></i>
                                                    <span>Khung Avatar Tinh Hoa hào quang vàng kim</span>
                                                </div>
                                                <div className="flex items-start gap-2">
                                                    <i className="ph-bold ph-check text-gold text-sm shrink-0 mt-0.5"></i>
                                                    <span>Đọc trước các tác phẩm mới xuất bản trước 7 ngày</span>
                                                </div>
                                            </div>
                                        </div>

                                        <button type="button" onClick={() => openTierModal("tier3")} className="w-full mt-4 py-2.5 px-4 rounded-xl bg-gold/10 hover:bg-gold hover:text-white dark:hover:text-night-bg text-gold border border-gold/30 text-xs font-metadata-spec font-bold transition-colors flex items-center justify-center gap-1.5">
                                            <span>Xem Chi Tiết Đặc Quyền</span>
                                            <i className="ph-bold ph-arrow-right"></i>
                                        </button>
                                    </div>


                                    <div className="rounded-2xl bg-gradient-to-br from-night-card via-[#1c1813] to-night-surface border-2 border-gold text-night-text shadow-lg hover:shadow-2xl p-6 flex flex-col justify-between relative group transition-all">

                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 text-night-bg text-[10px] font-metadata-spec font-black uppercase tracking-wider shadow whitespace-nowrap">
                                            Hoàng Gia VIP 👑
                                        </div>

                                        <div>

                                            <div className="flex items-center justify-between mb-4 mt-1">
                                                <div className="w-12 h-12 rounded-2xl bg-amber-400/20 text-amber-300 flex items-center justify-center text-2xl border border-amber-400/40">
                                                    🏰
                                                </div>
                                                <span className="font-metadata-spec text-[11px] font-bold text-amber-300 bg-amber-400/10 px-2.5 py-1 rounded-full whitespace-nowrap">
                                                    Cấp IV • Tối Thượng
                                                </span>
                                            </div>

                                            <h3 className="font-display font-black text-xl text-white">Đại Điền Chủ</h3>
                                            <p className="font-metadata-spec text-xs font-bold text-amber-200/70 mt-0.5">
                                                Yêu cầu: <span className="text-amber-300 font-black">Đọc 150 Cuốn</span> (hoặc 10.000 Khoai)
                                            </p>

                                            <div className="my-4 pt-3 border-t border-white/10 space-y-2.5 text-xs font-editorial-body text-slate-300">
                                                <div className="flex items-start gap-2">
                                                    <i className="ph-bold ph-crown text-amber-400 text-sm shrink-0 mt-0.5"></i>
                                                    <span><strong className="text-amber-300 font-bold">Giảm 20%</strong> toàn bộ dịch vụ và thuê sách trọn đời</span>
                                                </div>
                                                <div className="flex items-start gap-2">
                                                    <i className="ph-bold ph-crown text-amber-400 text-sm shrink-0 mt-0.5"></i>
                                                    <span><strong className="text-white font-bold">Thuê KHÔNG GIỚI HẠN</strong> toàn bộ kho sách VIP</span>
                                                </div>
                                                <div className="flex items-start gap-2">
                                                    <i className="ph-bold ph-crown text-amber-400 text-sm shrink-0 mt-0.5"></i>
                                                    <span>Tặng ấn phẩm sách bìa cứng độc quyền tận nhà hàng năm</span>
                                                </div>
                                                <div className="flex items-start gap-2">
                                                    <i className="ph-bold ph-crown text-amber-400 text-sm shrink-0 mt-0.5"></i>
                                                    <span>Chuyên viên chăm sóc khách hàng VIP riêng biệt (1-on-1)</span>
                                                </div>
                                            </div>
                                        </div>

                                        <button type="button" onClick={() => openTierModal("tier4")} className="w-full mt-4 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-night-bg text-xs font-metadata-spec font-black transition-all flex items-center justify-center gap-1.5 shadow-md">
                                            <i className="ph-bold ph-sparkle"></i>
                                            <span>Gia Nhập Giới Tinh Hoa</span>
                                        </button>
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
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <div>
                                        <h3 className="font-display font-black text-lg text-ink dark:text-night-text flex items-center gap-2">
                                            <i className="ph-bold ph-lightning text-amber-500"></i>
                                            Nhiệm Vụ Cày Điểm XP Thăng Cấp Nhanh
                                        </h3>
                                        <p className="font-editorial-body text-xs text-ink-muted dark:text-night-muted">
                                            Hoàn thành các thử thách hàng ngày và nhiệm vụ độc giả để tích lũy XP thăng hạng thần tốc.
                                        </p>
                                    </div>
                                    <span className="potato-badge text-xs font-bold">
                                        Cập nhật mỗi 24 giờ
                                    </span>
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

                                        <Link to="/trangchu" className="mt-3.5 w-full py-1.5 text-center rounded-lg bg-paper-200 dark:bg-night-surface hover:bg-wine hover:text-white dark:hover:bg-gold dark:hover:text-night-bg text-ink dark:text-night-text text-[11px] font-metadata-spec font-bold transition-colors">
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

                                        <Link to="/trangchu" className="mt-3.5 w-full py-1.5 text-center rounded-lg bg-paper-200 dark:bg-night-surface hover:bg-wine hover:text-white dark:hover:bg-gold dark:hover:text-night-bg text-ink dark:text-night-text text-[11px] font-metadata-spec font-bold transition-colors">
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

                        <div className="font-editorial-body text-xs text-ink/80 dark:text-night-muted leading-relaxed space-y-3 py-2" id="modal-content">{renderTierContent(activeTier)}</div>

                        <div className="mt-6 pt-4 border-t border-paper-border dark:border-night-border flex items-center justify-end gap-3 font-metadata-spec text-xs">
                            <button type="button" onClick={closeTierModal} className="px-4 py-2 rounded-xl bg-paper-200 dark:bg-night-surface text-ink dark:text-night-text hover:bg-paper-border font-bold transition-colors">
                                Đóng
                            </button>
                            <Link to="/trangchu" className="px-4 py-2 rounded-xl bg-wine text-white dark:bg-gold dark:text-night-bg font-black hover:opacity-90 transition-opacity">
                                Khám Phá Sách Cày Cấp
                            </Link>
                        </div>
                    </div>
                </div>

                <div id="chatbot-container">
                    <div id="chat-window" className={`chat-window ${isChatOpen ? 'show' : ''}`}>
                        <div className="bg-gradient-to-r from-wine to-wine-light text-white px-5 py-3.5 flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-white p-0.5 shrink-0">
                                    <img src="/logo.png" alt="Bot" className="w-full h-full rounded-full object-cover" onError={handleLogoError} />
                                </div>
                                <div>
                                    <div className="font-display font-bold text-sm tracking-wide leading-tight">Trợ lý ảo HALM BOOK</div>
                                    <div className="font-metadata-spec text-[10px] text-gold font-medium">Tư vấn hạng thành viên & khoai</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2.5">
                                <button id="refresh-chat" onClick={resetChat} className="hover:text-gold transition-colors" title="Làm mới hội thoại" aria-label="Làm mới hội thoại">
                                    <i className="ph-bold ph-arrows-clockwise text-lg"></i>
                                </button>
                                <button id="close-chat" onClick={() => setIsChatOpen(false)} className="hover:text-gold transition-colors" title="Thu nhỏ" aria-label="Thu nhỏ cửa sổ chat">
                                    <i className="ph-bold ph-x text-lg"></i>
                                </button>
                            </div>
                        </div>

                        <div className="flex-grow overflow-y-auto p-4 flex flex-col relative text-night-text bg-[#181916] text-xs space-y-3" id="chat-body">
                            <div id="chat-welcome" className={`text-center py-5 space-y-3 ${messages.length ? 'hidden' : ''}`}>
                                <div className="w-12 h-12 mx-auto rounded-full bg-wine/20 border border-wine/40 p-1 flex items-center justify-center">
                                    <img src="/logo.png" alt="Bot" className="w-full h-full rounded-full object-cover" onError={handleLogoError} />
                                </div>
                                <h4 className="font-display font-black text-sm text-white">Xin chào Alex Nguyễn!</h4>
                                <p className="font-editorial-body text-xs text-night-muted leading-relaxed">
                                    Tôi là trợ lý ảo HALM BOOK. Bạn muốn tìm hiểu quyền lợi của hạng nào hoặc cách thăng hạng nhanh nhất?
                                </p>
                                <div className="space-y-2 pt-1 text-left font-metadata-spec">
                                    <button onClick={() => sendMessage("Làm sao để lên hạng Cao Thủ Cày 🚜?")} className="suggestion-btn w-full p-2.5 rounded-xl bg-night-card hover:bg-night-border border border-night-border text-xs text-white flex items-center justify-between transition-colors">
                                        <span>Làm sao để lên hạng Cao Thủ Cày 🚜?</span>
                                        <i className="ph-bold ph-arrow-right text-gold"></i>
                                    </button>
                                    <button onClick={() => sendMessage("Đặc quyền của Đại Điền Chủ 👑 là gì?")} className="suggestion-btn w-full p-2.5 rounded-xl bg-night-card hover:bg-night-border border border-night-border text-xs text-white flex items-center justify-between transition-colors">
                                        <span>Đặc quyền của Đại Điền Chủ 👑 là gì?</span>
                                        <i className="ph-bold ph-arrow-right text-gold"></i>
                                    </button>
                                    <button onClick={() => sendMessage("Hạng có bị giáng cấp theo năm không?")} className="suggestion-btn w-full p-2.5 rounded-xl bg-night-card hover:bg-night-border border border-night-border text-xs text-white flex items-center justify-between transition-colors">
                                        <span>Hạng có bị giáng cấp theo năm không?</span>
                                        <i className="ph-bold ph-arrow-right text-gold"></i>
                                    </button>
                                </div>
                            </div>
                            <div id="chat-messages" ref={messagesEndRef} className={`flex-col gap-3 ${messages.length ? '' : 'hidden'}`}>
                                {messages.map((message) => (
                                    <div key={message.id} className={message.sender === 'user' ? 'self-end bg-wine text-white max-w-[80%] rounded-2xl rounded-tr-sm px-3.5 py-2 text-xs font-metadata-spec' : 'self-start bg-night-card border border-night-border text-night-text max-w-[85%] rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-xs font-editorial-body'}>
                                        {message.content}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="p-3 bg-[#141512] border-t border-night-border shrink-0">
                            <div className="relative flex items-center">
                                <input type="text" id="chat-input" value={chatInput} onChange={(event) => setChatInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') sendMessage(); }} placeholder="Nhập câu hỏi của bạn..."
                                    className="w-full bg-night-card text-white placeholder-night-muted text-xs rounded-xl pl-3.5 pr-10 py-3 border border-night-border focus:outline-none focus:border-wine transition-colors font-metadata-spec" />
                                <button id="send-btn" onClick={() => sendMessage()} className="absolute right-2 text-gold hover:text-white p-1.5 transition-colors" aria-label="Gửi tin">
                                    <i className="ph-bold ph-paper-plane-tilt text-lg"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                    <button id="chat-toggle-btn" onClick={() => setIsChatOpen((current) => !current)} className="w-14 h-14 rounded-full bg-wine hover:bg-wine-dark text-white p-1 shadow-2xl flex items-center justify-center transition-transform hover:scale-105" aria-label="Mở trợ lý ảo AI">
                        <img src="/logo.png" alt="Chatbot" className="w-full h-full rounded-full object-cover" onError={handleLogoError} />
                    </button>
                </div>
            </UserLayout>
        </>
    );
}
