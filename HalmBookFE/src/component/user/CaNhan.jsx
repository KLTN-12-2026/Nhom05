import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import UserLayout from './layout/UserLayout';
import { useNavigate } from 'react-router-dom';
import * as customerService from '../../service/CustomerService';

const profileTailwindConfig = {
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
    phosphor: 'https://unpkg.com/@phosphor-icons/web',
    tailwind: 'https://cdn.tailwindcss.com',
};

function getBotReply(userInput) {
    const query = userInput.toLowerCase();
    if (query.includes('hạng') || query.includes('thợ cày')) {
        return <>Hạng hiện tại của bạn là <strong>THỢ CÀY 🌱</strong>. Để nâng lên các hạng cao hơn như Học Giả hay Quý Tộc Sách, bạn có thể tham gia các gói hội viên tại <Link to="/hang" className="text-gold underline">Gói Hội Viên</Link>.</>;
    }
    if (query.includes('chỉnh sửa') || query.includes('thay đổi') || query.includes('số điện thoại')) {
        return <>Bạn có thể chỉnh sửa số điện thoại, địa chỉ và thông tin tại trang <Link to="/canhan" className="text-gold underline">Chỉnh Sửa Thông Tin</Link>.</>;
    }
    if (query.includes('khoai')) {
        return <>Số dư ví hiện tại của bạn là <strong>350 Khoai Tây</strong>. Bạn có thể dùng Khoai để đổi quà, thuê sách hoặc tham gia các gói cước tại mục <Link to="/trangchu#trending-section" className="text-gold underline">Ưu Đãi</Link>.</>;
    }
    return 'Tôi có thể hỗ trợ bạn cập nhật thông tin cá nhân, kiểm tra số dư Khoai hoặc hướng dẫn nâng hạng hội viên!';
}

export default function Profile() {
    const [searchParams, setSearchParams] = useSearchParams();
    const location = useLocation();
    const urlTab = searchParams.get('tab') || (location.hash === '#tab-history' ? 'history' : null);
    const [activeTab, setActiveTabState] = useState(() => urlTab || 'profile');
    const [isDark, setIsDark] = useState(() => typeof window !== 'undefined' && window.localStorage.getItem('color-theme') === 'dark');
    const [isScrollTopVisible, setIsScrollTopVisible] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatInput, setChatInput] = useState('');
    const [messages, setMessages] = useState([]);
    const [stars, setStars] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [toast, setToast] = useState({ show: false, title: '', message: '' });

    const showToast = (title, message) => {
        setToast({ show: true, title, message });
        window.setTimeout(() => setToast({ show: false, title: '', message: '' }), 3500);
    };

    const formatDateForInput = (dateVal) => {
        if (!dateVal) return '';
        try {
            const d = new Date(dateVal);
            if (isNaN(d.getTime())) return '';
            return d.toISOString().split('T')[0];
        } catch {
            return '';
        }
    };

    const [profileData, setProfileData] = useState({
        customerName: '',
        phoneNumber: '',
        birthday: '',
        gender: 'Nam',
        email: '',
        address: ''
    });
    const [customer, setCustomer] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const navigate = useNavigate();

   
    const fetchCustomerData = async (silent = false) => {
        if (!silent) setIsLoading(true);
        try {
            const data = await customerService.getCurrentCustomer();
            if (data) {
                setCustomer(data);
                setProfileData({
                    customerName: data.customerName || '',
                    phoneNumber: data.phoneNumber || '',
                    birthday: formatDateForInput(data.birthday),
                    gender: data.gender === false ? 'Nữ' : 'Nam',
                    email: data.email || '',
                    address: data.address || '',
                });
            } else if (!silent) {
                console.error("Không tìm thấy dữ liệu khách hàng !");
                navigate('/dangnhap');
            }
        } catch (error) {
            console.error('Lỗi khi lấy thông tin khách hàng:', error);
            if (!silent) {
                setCustomer(null);
                navigate('/dangnhap');
            }
        } finally {
            if (!silent) {
                setIsLoading(false);
            }
        }
    };

    useEffect(() => {
        fetchCustomerData();
    }, [navigate]);

    const handleCancelEdit = () => {
        setIsEditing(false);
        if (customer) {
            setProfileData({
                customerName: customer.customerName || '',
                phoneNumber: customer.phoneNumber || '',
                birthday: formatDateForInput(customer.birthday),
                gender: customer.gender === false ? 'Nữ' : 'Nam',
                email: customer.email || '',
                address: customer.address || '',
            });
        }
    };

    const handleSaveEdit = async () => {
        setIsSaving(true);
        try {
            const payload = {
                customerName: profileData.customerName,
                phoneNumber: profileData.phoneNumber,
                birthday: profileData.birthday ? new Date(profileData.birthday) : null,
                gender: profileData.gender === 'Nam',
                email: profileData.email,
                address: profileData.address,
            };
            const updated = await customerService.updateCustomer(payload);
            const finalData = updated || { ...customer, ...payload };
            setCustomer((prev) => ({ ...prev, ...finalData }));
            setProfileData({
                customerName: finalData.customerName || '',
                phoneNumber: finalData.phoneNumber || '',
                birthday: formatDateForInput(finalData.birthday),
                gender: finalData.gender === false ? 'Nữ' : 'Nam',
                email: finalData.email || '',
                address: finalData.address || '',
            });
            setIsEditing(false);
            showToast('Cập Nhật Thành Công', 'Thông tin cá nhân của bạn đã được lưu an toàn.');
            // Đồng bộ ngầm với backend mà không gây giật màn hình
            fetchCustomerData(true);
        } catch (error) {
            console.error('Lỗi khi cập nhật:', error);
            showToast('Lỗi Cập Nhật', error.message || 'Không thể lưu thông tin. Vui lòng thử lại.');
        } finally {
            setIsSaving(false);
        }
    };

    const messagesEndRef = useRef(null);
    const nextMessageId = useRef(0);
    const pendingTimers = useRef(new Set());
    const starsInitialized = useRef(false);

    useEffect(() => {
        if (urlTab && urlTab !== activeTab) {
            setActiveTabState(urlTab);
        }
    }, [urlTab]);

    const handleSelectTab = (tab) => {
        setActiveTabState(tab);
        setSearchParams({ tab });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    useEffect(() => {
        document.documentElement.classList.toggle('dark', isDark);
        window.localStorage.setItem('color-theme', isDark ? 'dark' : 'light');
    }, [isDark]);

    useEffect(() => {
        if (!isDark || starsInitialized.current) return;

        starsInitialized.current = true;
        setStars(Array.from({ length: 80 }, (_, id) => ({
            id,
            size: Math.random() * 2.5 + 0.5,
            top: Math.random() * 100,
            left: Math.random() * 100,
            duration: Math.random() * 3 + 2,
            delay: Math.random() * 3,
        })));
    }, [isDark]);

    useEffect(() => {
        document.title = 'HALM BOOK — Thông Tin Cá Nhân';
        let description = document.querySelector('meta[name="description"]');
        if (!description) {
            description = document.createElement('meta');
            description.name = 'description';
            document.head.appendChild(description);
        }
        description.content = 'Quản lý thông tin cá nhân, tài khoản độc giả và điểm tích lũy Khoai trên HALM BOOK.';
    }, []);

    useEffect(() => {
        const updateScrollState = () => {
            const scrollY = window.pageYOffset || document.documentElement.scrollTop;
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
    }, []);

    useEffect(() => {
        if (!document.querySelector('link[data-profile-fonts]')) {
            const fontLink = document.createElement('link');
            fontLink.rel = 'stylesheet';
            fontLink.href = PROFILE_ASSETS.fonts;
            fontLink.dataset.profileFonts = 'true';
            document.head.appendChild(fontLink);
        }
        if (!document.querySelector('script[data-profile-phosphor]')) {
            const iconScript = document.createElement('script');
            iconScript.src = PROFILE_ASSETS.phosphor;
            iconScript.async = true;
            iconScript.dataset.profilePhosphor = 'true';
            document.head.appendChild(iconScript);
        }
        window.tailwind = window.tailwind || {};
        window.tailwind.config = profileTailwindConfig;
        if (!document.querySelector('script[src*="cdn.tailwindcss.com"]')) {
            const tailwindScript = document.createElement('script');
            tailwindScript.src = PROFILE_ASSETS.tailwind;
            tailwindScript.async = true;
            tailwindScript.dataset.profileTailwind = 'true';
            document.head.appendChild(tailwindScript);
        }
    }, []);

    const addMessage = (sender, content) => {
        setMessages((current) => [...current, { id: nextMessageId.current++, sender, content }]);
    };

    const scheduleBotReply = (text) => {
        const timerId = window.setTimeout(() => {
            addMessage('bot', getBotReply(text));
            pendingTimers.current.delete(timerId);
        }, 600);
        pendingTimers.current.add(timerId);
    };

    const openChatbot = (initialMessage) => {
        setIsChatOpen(true);
        if (initialMessage) {
            addMessage('user', initialMessage);
            scheduleBotReply(initialMessage);
        }
    };

    const sendMessage = (text = chatInput) => {
        const message = text.trim();
        if (!message) return;
        addMessage('user', message);
        setChatInput('');
        scheduleBotReply(message);
    };

    const resetChat = () => {
        pendingTimers.current.forEach((timerId) => window.clearTimeout(timerId));
        pendingTimers.current.clear();
        setMessages([]);
    };
    if (isLoading) {
        return (
            <UserLayout className="profile-page" onOpenChatbot={openChatbot} onThemeChange={setIsDark}>
                <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
                    <div className="w-10 h-10 border-4 border-wine border-t-transparent dark:border-gold dark:border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm font-metadata-spec font-bold text-ink-muted dark:text-night-muted">Đang tải thông tin cá nhân...</p>
                </div>
            </UserLayout>
        );
    }

    return (
        <>
            <style>{String.raw`
        /* ========================================================
           TYPOGRAPHY & CSS VARIABLES (ĐỒNG BỘ TRANG CHỦ)
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

        body {
            font-family: var(--font-ui);
            background-color: #F7F4EE;
            color: #1E1F1D;
            overflow-x: hidden;
            -webkit-font-smoothing: antialiased;
            transition: background-color 0.4s ease, color 0.4s ease;
        }

        .dark body {
            background-color: #111210;
            color: #EDE9DF;
        }

        .font-display-hero {
            font-family: var(--font-display);
            font-weight: 900;
            letter-spacing: -0.03em;
        }

        .font-editorial-body {
            font-family: var(--font-editorial);
            line-height: 1.65;
        }

        .font-metadata-spec {
            font-family: var(--font-metadata);
        }

        /* Paper grain texture */
        .paper-grain {
            background-image: radial-gradient(rgba(30, 31, 29, 0.04) 1px, transparent 1px);
            background-size: 28px 28px;
        }
        .dark .paper-grain {
            background-image: radial-gradient(rgba(237, 233, 223, 0.04) 1px, transparent 1px);
            background-size: 28px 28px;
        }

        .profile-page {
            background-color: #F7F4EE;
            color: #1E1F1D;
        }
        .dark .profile-page {
            background-color: #111210;
            color: #EDE9DF;
        }

        [class~="bg-paper"] { background-color: #F7F4EE; }
        [class~="bg-paper-surface"] { background-color: #FFFEFA; }
        [class~="bg-paper-200"] { background-color: #EAE5D9; }
        [class~="bg-paper-200/70"] { background-color: rgb(234 229 217 / 0.7); }
        [class~="bg-wine"] { background-color: #8E3038; }
        [class~="bg-wine/10"] { background-color: rgb(142 48 56 / 0.1); }
        [class~="bg-wine/20"] { background-color: rgb(142 48 56 / 0.2); }
        [class~="bg-gold"] { background-color: #B8860B; }
        [class~="bg-gold/15"] { background-color: rgb(184 134 11 / 0.15); }
        [class~="bg-night-card"] { background-color: #20221E; }
        [class~="bg-night-border"] { background-color: #2C2E29; }

        [class~="text-ink"] { color: #1E1F1D; }
        [class~="text-ink/80"] { color: rgb(30 31 29 / 0.8); }
        [class~="text-ink-muted"] { color: #66645E; }
        [class~="text-ink-muted/60"] { color: rgb(102 100 94 / 0.6); }
        [class~="text-wine"] { color: #8E3038; }
        [class~="text-gold"] { color: #B8860B; }
        [class~="text-night-text"] { color: #EDE9DF; }
        [class~="text-night-muted"] { color: #96938B; }

        [class~="border-paper-border"] { border-color: #E3DDD0; }
        [class~="border-night-border"] { border-color: #2C2E29; }
        [class~="border-wine/25"] { border-color: rgb(142 48 56 / 0.25); }
        [class~="border-wine/30"] { border-color: rgb(142 48 56 / 0.3); }
        [class~="border-wine/40"] { border-color: rgb(142 48 56 / 0.4); }

        [class~="from-wine"][class~="to-wine-light"] {
            background-image: linear-gradient(to top right, #8E3038, #A83B46);
        }

        [class~="hover:bg-paper-200"]:hover { background-color: #EAE5D9; }
        [class~="hover:bg-night-border"]:hover { background-color: #2C2E29; }
        [class~="hover:bg-wine-dark"]:hover { background-color: #6F252C; }
        [class~="hover:text-ink"]:hover { color: #1E1F1D; }
        [class~="hover:text-wine"]:hover { color: #8E3038; }
        [class~="hover:text-gold"]:hover { color: #B8860B; }
        [class~="group-hover:text-wine"]:hover,
        .group:hover [class~="group-hover:text-wine"] { color: #8E3038; }
        [class~="focus:border-wine"]:focus { border-color: #8E3038; }
        [class~="placeholder-ink-muted/80"]::placeholder { color: rgb(102 100 94 / 0.8); }
        [class~="placeholder-night-muted"]::placeholder { color: #96938B; }

        html.dark [class~="dark:bg-gold"] { background-color: #B8860B; }
        html.dark [class~="dark:bg-gold/10"] { background-color: rgb(184 134 11 / 0.1); }
        html.dark [class~="dark:bg-gold/15"] { background-color: rgb(184 134 11 / 0.15); }
        html.dark [class~="dark:bg-night-bg"] { background-color: #111210; }
        html.dark [class~="dark:bg-night-card"] { background-color: #20221E; }
        html.dark [class~="dark:bg-night-surface"] { background-color: #181916; }
        html.dark [class~="dark:text-gold"] { color: #B8860B; }
        html.dark [class~="dark:text-night-bg"] { color: #111210; }
        html.dark [class~="dark:text-night-muted"] { color: #96938B; }
        html.dark [class~="dark:text-night-muted/60"] { color: rgb(150 147 139 / 0.6); }
        html.dark [class~="dark:text-night-text"] { color: #EDE9DF; }
        html.dark [class~="dark:border-night-border"] { border-color: #2C2E29; }
        html.dark [class~="dark:border-night-card"] { border-color: #20221E; }
        html.dark [class~="dark:border-gold/30"] { border-color: rgb(184 134 11 / 0.3); }
        html.dark [class~="dark:border-gold/40"] { border-color: rgb(184 134 11 / 0.4); }
        html.dark [class~="dark:from-gold"][class~="dark:to-gold-light"] {
            background-image: linear-gradient(to top right, #B8860B, #D4AF37);
        }

        html.dark [class~="dark:hover:bg-night-card"]:hover { background-color: #20221E; }
        html.dark [class~="dark:hover:bg-night-surface"]:hover { background-color: #181916; }
        html.dark [class~="dark:hover:text-gold"]:hover { color: #B8860B; }
        html.dark [class~="dark:hover:text-night-text"]:hover { color: #EDE9DF; }
        html.dark [class~="dark:focus:border-gold"]:focus { border-color: #D4AF37; }
        html.dark [class~="dark:group-hover:text-gold"]:hover,
        html.dark .group:hover [class~="dark:group-hover:text-gold"] { color: #D4AF37; }

        /* ========================================================
           DARK MODE FIX FOR FOOTER
           ======================================================== */
        html.dark footer {
            background-color: #111210 !important;
            color: #EDE9DF !important;
            border-color: #2C2E29 !important;
        }
        html.dark footer h2 {
            color: #D4AF37 !important;
            border-color: #2C2E29 !important;
        }
        html.dark footer a {
            color: rgba(237, 233, 223, 0.85);
        }
        html.dark footer a:hover {
            color: #D4AF37 !important;
        }
        html.dark footer button {
            color: rgba(237, 233, 223, 0.85);
        }
        html.dark footer button:hover {
            color: #D4AF37 !important;
        }
        html.dark footer .text-\[\#5A564F\],
        html.dark footer .text-\[\#85817A\] {
            color: #96938B !important;
        }
        html.dark footer .border-\[\#E6E1D8\] {
            border-color: #2C2E29 !important;
        }
        html.dark footer .bg-white {
            background-color: #181916 !important;
            border-color: rgba(229, 169, 60, 0.3) !important;
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
            background-color: #fff;
            border-radius: 50%;
            pointer-events: none;
        }

        @keyframes starTwinkle {
            0%, 100% { opacity: 0.2; transform: scale(0.8); }
            50% { opacity: 0.9; transform: scale(1.3); }
        }

        /* Scrolled Header */
        #navbar {
            transition: transform 0.38s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease, padding 0.3s ease;
            will-change: transform;
        }
        #navbar.scrolled {
            background-color: rgba(247, 244, 238, 0.94);
            backdrop-filter: blur(16px);
            border-color: rgba(227, 221, 208, 0.8);
            box-shadow: 0 4px 20px -4px rgba(0,0,0,0.06);
        }
        .dark #navbar.scrolled {
            background-color: rgba(17, 18, 16, 0.94);
            border-color: rgba(44, 46, 41, 0.8);
            box-shadow: 0 4px 25px -4px rgba(0,0,0,0.5);
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
    `}</style>
            <UserLayout className="profile-page" onOpenChatbot={openChatbot} onThemeChange={setIsDark}>



                <div id="starry-background" aria-hidden="true">
                    {stars.map((star) => (
                        <div
                            key={star.id}
                            className="star"
                            style={{
                                width: `${star.size}px`,
                                height: `${star.size}px`,
                                top: `${star.top}%`,
                                left: `${star.left}%`,
                                animation: `starTwinkle ${star.duration}s infinite ease-in-out ${star.delay}s`,
                            }}
                        />
                    ))}
                </div>


                <main className="w-full max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12 sm:pt-28 sm:pb-16 flex-1">
                    <div className="flex flex-col lg:flex-row gap-6 items-start">


                        {/* LEFT SIDEBAR - FIXED/STICKY CONTAINER */}
                        <aside className="w-full lg:w-80 shrink-0 space-y-5 lg:sticky lg:top-24 lg:self-start">

                            {/* 1. Profile Avatar Card */}
                            <div className="rounded-2xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border p-6 shadow-sm flex flex-col items-center text-center relative overflow-hidden group">
                                <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-36 h-36 bg-wine/10 dark:bg-gold/10 rounded-full blur-2xl pointer-events-none"></div>

                                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-wine to-wine-light dark:from-gold dark:to-gold-light p-1 shadow-md mb-3.5 relative">
                                    <div className="w-full h-full rounded-full bg-paper-surface dark:bg-night-surface flex items-center justify-center font-display font-black text-2xl text-wine dark:text-gold overflow-hidden">
                                        {customer?.avatar ? (
                                            <img src={customer.avatar} alt="Avatar" className="w-full h-full object-cover rounded-full" />
                                        ) : (
                                            customer?.customerName ? customer.customerName.trim().charAt(0).toUpperCase() : 'U'
                                        )}
                                    </div>
                                    <span className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white dark:border-night-card flex items-center justify-center text-[10px] text-white" title="Trực tuyến">
                                        <i className="ph-bold ph-check text-[9px]"></i>
                                    </span>
                                </div>

                                <h2 className="font-display font-black text-lg text-ink dark:text-night-text leading-tight">
                                    {customer?.customerName || 'Độc giả'}
                                </h2>
                                <p className="font-metadata-spec text-xs text-ink-muted dark:text-night-muted mt-0.5">
                                    {customer?.customer_id || ''}
                                </p>

                                <Link to="/hang" className="mt-3.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-wine/10 text-wine dark:bg-gold/15 dark:text-gold border border-wine/25 dark:border-gold/30 text-xs font-metadata-spec font-bold hover:scale-105 transition-transform" title="Xem quyền lợi hội viên">
                                    <i className="ph-bold ph-plant text-emerald-600 dark:text-emerald-400"></i>
                                    <span>THỢ CÀY 🌱</span>
                                </Link>

                                <div className="grid grid-cols-2 gap-2 w-full pt-4 mt-4 border-t border-paper-border dark:border-night-border text-center">
                                    <button type="button" onClick={() => handleSelectTab('wallet')} className="p-2 rounded-xl bg-paper dark:bg-night-surface border border-paper-border dark:border-night-border hover:border-gold transition-colors">
                                        <span className="block font-metadata-spec text-base font-black text-ink dark:text-night-text">350</span>
                                        <span className="font-metadata-spec text-[10px] text-ink-muted dark:text-night-muted">Khoai Tích Lũy</span>
                                    </button>
                                    <Link to="/tusachcn" className="p-2 rounded-xl bg-paper dark:bg-night-surface border border-paper-border dark:border-night-border hover:border-wine dark:hover:border-gold transition-colors">
                                        <span className="block font-metadata-spec text-base font-black text-ink dark:text-night-text">12</span>
                                        <span className="font-metadata-spec text-[10px] text-ink-muted dark:text-night-muted">Sách Trong Tủ</span>
                                    </Link>
                                </div>
                            </div>

                            {/* 2. Navigation Menu Card - STRICT ORDER (1: Profile, 2: Tiers, 3: Wallet, 4: History, Divider, 5: Logout) */}
                            <div className="rounded-2xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border p-3 shadow-sm space-y-1">
                                {/* 1. Thông Tin Cá Nhân */}
                                <button
                                    type="button"
                                    onClick={() => handleSelectTab('profile')}
                                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-metadata-spec font-bold transition-all ${activeTab === 'profile'
                                        ? 'bg-wine text-white dark:bg-gold dark:text-night-bg shadow-sm'
                                        : 'text-ink-muted dark:text-night-muted hover:bg-paper-200 dark:hover:bg-night-surface hover:text-ink dark:hover:text-night-text'
                                        }`}
                                >
                                    <i className="ph-bold ph-user text-base"></i>
                                    <span>Thông Tin Cá Nhân</span>
                                </button>

                                {/* 2. Tủ Sách Cá Nhân */}
                                <Link
                                    to="/tusachcn"
                                    className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-metadata-spec font-bold text-ink-muted dark:text-night-muted hover:bg-paper-200 dark:hover:bg-night-surface hover:text-ink dark:hover:text-night-text transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <i className="ph-bold ph-book-bookmark text-base"></i>
                                        <span>Tủ Sách Cá Nhân</span>
                                    </div>
                                    <span className="potato-badge text-[11px] py-0 px-2">12 cuốn</span>
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
                                    <span className="potato-badge text-[11px] py-0 px-2">🌱 Thợ Cày</span>
                                </Link>

                                {/* 4. Ví Khoai Tây */}
                                <button
                                    type="button"
                                    onClick={() => handleSelectTab('wallet')}
                                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-metadata-spec font-bold transition-all ${activeTab === 'wallet'
                                        ? 'bg-wine text-white dark:bg-gold dark:text-night-bg shadow-sm'
                                        : 'text-ink-muted dark:text-night-muted hover:bg-paper-200 dark:hover:bg-night-surface hover:text-ink dark:hover:text-night-text'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <i className="ph-bold ph-wallet text-base"></i>
                                        <span>Ví Khoai Tây</span>
                                    </div>
                                    <span className={`potato-badge text-[11px] py-0 px-2 ${activeTab === 'wallet' ? 'bg-white/20 text-white border-white/30' : ''}`}>350 🥔</span>
                                </button>

                                {/* 5. Lịch Sử Giao Dịch */}
                                <button
                                    type="button"
                                    onClick={() => handleSelectTab('history')}
                                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-metadata-spec font-bold transition-all ${activeTab === 'history'
                                        ? 'bg-wine text-white dark:bg-gold dark:text-night-bg shadow-sm'
                                        : 'text-ink-muted dark:text-night-muted hover:bg-paper-200 dark:hover:bg-night-surface hover:text-ink dark:hover:text-night-text'
                                        }`}
                                >
                                    <i className="ph-bold ph-clock-counter-clockwise text-base"></i>
                                    <span>Lịch Sử Giao Dịch</span>
                                </button>

                                {/* Divider Line */}
                                <div className="pt-2 border-t border-paper-border dark:border-night-border mt-2">
                                    {/* 6. Đăng Xuất */}
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

                        {/* RIGHT CONTENT AREA - CHANGES SMOOTHLY BY TAB */}
                        <div className="flex-1 min-w-0 w-full space-y-5">

                            {/* Toast Notification */}
                            {toast.show && (
                                <div className="fixed top-24 right-6 z-50 rounded-2xl bg-paper-surface dark:bg-night-card border border-wine/30 dark:border-gold/40 shadow-2xl p-4 flex items-center gap-3 text-ink dark:text-night-text animate-bounce">
                                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                        <i className="ph-bold ph-check text-lg"></i>
                                    </div>
                                    <div>
                                        <div className="font-display font-bold text-xs">{toast.title}</div>
                                        <div className="font-editorial-body text-xs text-ink-muted dark:text-night-muted">{toast.message}</div>
                                    </div>
                                </div>
                            )}

                            {/* TAB 1: THÔNG TIN CÁ NHÂN */}
                            {activeTab === 'profile' && (
                                <>
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-paper-border dark:border-night-border">
                                        <div>
                                            <div className="flex items-center gap-2 text-xs font-metadata-spec text-ink-muted dark:text-night-muted mb-1">
                                                <Link to="/trangchu" className="hover:underline">Trang chủ</Link>
                                                <i className="ph-bold ph-caret-right text-[10px]"></i>
                                                <span>Tài khoản</span>
                                                <i className="ph-bold ph-caret-right text-[10px]"></i>
                                                <span className="text-wine dark:text-gold font-bold">Hồ sơ cá nhân</span>
                                            </div>
                                            <h1 className="font-display font-black text-2xl sm:text-3xl text-ink dark:text-night-text tracking-tight">
                                                Thông Tin Cá Nhân
                                            </h1>
                                        </div>
                                    </div>

                                    <div className="rounded-2xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border p-6 shadow-sm space-y-6">
                                        <div className="flex items-center justify-between pb-3 border-b border-paper-border dark:border-night-border">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-lg bg-wine/10 dark:bg-gold/15 text-wine dark:text-gold flex items-center justify-center text-lg">
                                                    <i className="ph-bold ph-identification-card"></i>
                                                </div>
                                                <div>
                                                    <h3 className="font-display font-bold text-sm text-ink dark:text-night-text">Dữ Liệu Nhận Diện</h3>
                                                    <p className="font-editorial-body text-[11px] text-ink-muted dark:text-night-muted">Thông tin tài khoản đã được xác thực bảo mật.</p>
                                                </div>
                                            </div>
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 text-[10px] font-metadata-spec font-bold">
                                                <i className="ph-bold ph-shield-check"></i> Đã Xác Thực
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                                            <div className="space-y-1.5">
                                                <label className="font-metadata-spec text-xs font-bold text-ink dark:text-night-text flex items-center gap-1.5">
                                                    <i className="ph-bold ph-user text-wine dark:text-gold text-xs"></i> Tên Người Dùng
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        value={profileData.customerName || ''}
                                                        onChange={(e) => setProfileData({ ...profileData, customerName: e.target.value })}
                                                        readOnly={!isEditing}
                                                        className={`w-full px-3.5 py-2.5 rounded-xl bg-paper dark:bg-night-surface border border-paper-border dark:border-night-border text-xs font-metadata-spec font-bold text-ink dark:text-night-text shadow-inner transition-colors ${isEditing ? 'focus:border-wine dark:focus:border-gold' : 'cursor-default'
                                                            }`}
                                                    />
                                                    <i className={`ph-bold ${isEditing ? 'ph-pencil' : 'ph-lock-simple'} absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted/60 dark:text-night-muted/60 text-xs`}></i>
                                                </div>
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="font-metadata-spec text-xs font-bold text-ink dark:text-night-text flex items-center gap-1.5">
                                                    <i className="ph-bold ph-phone text-wine dark:text-gold text-xs"></i> Số Điện Thoại
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        value={profileData.phoneNumber || ''}
                                                        onChange={(e) => setProfileData({ ...profileData, phoneNumber: e.target.value })}
                                                        readOnly={!isEditing}
                                                        className={`w-full px-3.5 py-2.5 rounded-xl bg-paper dark:bg-night-surface border border-paper-border dark:border-night-border text-xs font-metadata-spec font-bold text-ink dark:text-night-text shadow-inner transition-colors ${isEditing ? 'focus:border-wine dark:focus:border-gold' : 'cursor-default'
                                                            }`}
                                                    />
                                                    <i className={`ph-bold ${isEditing ? 'ph-pencil' : 'ph-lock-simple'} absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted/60 dark:text-night-muted/60 text-xs`}></i>
                                                </div>
                                            </div>
                                            <div className=" space-y-1.5">
                                                <label className="font-metadata-spec text-xs font-bold text-ink dark:text-night-text flex items-center gap-1.5">
                                                    <i className="ph-bold ph-cake text-wine dark:text-gold text-xs"></i> Ngày sinh
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type="date"
                                                        value={profileData.birthday || ''}
                                                        onChange={(e) => setProfileData({ ...profileData, birthday: e.target.value })}
                                                        readOnly={!isEditing}
                                                        className={`w-full px-3.5 py-2.5 rounded-xl bg-paper dark:bg-night-surface border border-paper-border dark:border-night-border text-xs font-metadata-spec font-bold text-ink dark:text-night-text shadow-inner resize-none transition-colors ${isEditing ? 'focus:border-wine dark:focus:border-gold' : 'cursor-default'
                                                            }`}
                                                    />
                                                    <i className={`ph-bold ${isEditing ? 'ph-pencil' : 'ph-lock-simple'} absolute right-3 top-3 text-ink-muted/60 dark:text-night-muted/60 text-xs`}></i>
                                                </div>
                                            </div>

                                            <div className="space-y-1.5">
                                                <label htmlFor="select-gender" className="font-metadata-spec text-xs font-bold text-ink dark:text-night-text flex items-center gap-1.5">
                                                    <i className="ph-bold ph-gender-intersex text-wine dark:text-gold text-xs"></i> Giới Tính
                                                </label>
                                                <select id="select-gender"
                                                    className="w-full px-3.5 py-2.5 rounded-xl bg-paper-50 dark:bg-night-surface border border-paper-border dark:border-night-border text-xs font-metadata-spec font-semibold text-ink dark:text-night-text focus:outline-none focus:border-wine dark:focus:border-gold transition-colors shadow-inner"
                                                    value={profileData.gender || 'Nam'}
                                                    onChange={(e) => setProfileData({ ...profileData, gender: e.target.value })}
                                                    disabled={!isEditing}
                                                >
                                                    <option value="Nam">Nam</option>
                                                    <option value="Nữ">Nữ</option>
                                                </select>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="font-metadata-spec text-xs font-bold text-ink dark:text-night-text flex items-center gap-1.5">
                                                    <i className="ph-bold ph-envelope-simple text-wine dark:text-gold text-xs"></i> Địa Chỉ Email
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type="email"
                                                        value={profileData.email || ''}
                                                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                                                        readOnly={!isEditing}
                                                        className={`w-full px-3.5 py-2.5 rounded-xl bg-paper dark:bg-night-surface border border-paper-border dark:border-night-border text-xs font-metadata-spec font-bold text-ink dark:text-night-text shadow-inner transition-colors ${isEditing ? 'focus:border-wine dark:focus:border-gold' : 'cursor-default'
                                                            }`}
                                                    />
                                                    <i className={`ph-bold ${isEditing ? 'ph-pencil' : 'ph-lock-simple'} absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted/60 dark:text-night-muted/60 text-xs`}></i>
                                                </div>
                                            </div>

                                            <div className=" space-y-1.5">
                                                <label className="font-metadata-spec text-xs font-bold text-ink dark:text-night-text flex items-center gap-1.5">
                                                    <i className="ph-bold ph-map-pin text-wine dark:text-gold text-xs"></i> Địa Chỉ Thường Trú
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        value={profileData.address || ''}
                                                        onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                                                        readOnly={!isEditing}
                                                        className={`w-full px-3.5 py-2.5 rounded-xl bg-paper dark:bg-night-surface border border-paper-border dark:border-night-border text-xs font-metadata-spec font-bold text-ink dark:text-night-text shadow-inner resize-none transition-colors ${isEditing ? 'focus:border-wine dark:focus:border-gold' : 'cursor-default'
                                                            }`}
                                                    />
                                                    <i className={`ph-bold ${isEditing ? 'ph-pencil' : 'ph-lock-simple'} absolute right-3 top-3 text-ink-muted/60 dark:text-night-muted/60 text-xs`}></i>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t border-paper-border dark:border-night-border flex flex-col sm:flex-row items-center justify-between gap-4">
                                            <div className="flex items-center gap-2 text-xs font-editorial-body text-ink-muted dark:text-night-muted">
                                                <i className="ph-bold ph-info text-wine dark:text-gold text-sm shrink-0"></i>
                                                <span>Thông tin cá nhân được bảo vệ theo chính sách bảo mật độc giả HALM BOOK.</span>
                                            </div>

                                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                                {isEditing ? (
                                                    <>
                                                        <button
                                                            type="button"
                                                            onClick={handleCancelEdit}
                                                            disabled={isSaving}
                                                            className="flex-1 sm:flex-initial px-4 py-2.5 rounded-full border border-paper-border dark:border-night-border text-xs font-bold text-ink-muted dark:text-night-muted hover:bg-paper-200 dark:hover:bg-night-surface transition-colors disabled:opacity-50"
                                                        >
                                                            Hủy Bỏ
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={handleSaveEdit}
                                                            disabled={isSaving}
                                                            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-metadata-spec text-xs font-bold transition-colors shadow-sm disabled:opacity-50"
                                                        >
                                                            <i className={`ph-bold ${isSaving ? 'ph-spinner animate-spin' : 'ph-check'} text-sm`}></i>
                                                            <span>{isSaving ? 'Đang lưu...' : 'Lưu Thay Đổi'}</span>
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => setIsEditing(true)}
                                                        className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-wine hover:bg-wine-dark text-white font-metadata-spec text-xs font-bold transition-colors shadow-sm"
                                                    >
                                                        <i className="ph-bold ph-pencil-simple text-sm"></i>
                                                        <span>Chỉnh Sửa Thông Tin</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* 3 Metric Cards */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div className="p-4 rounded-2xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border shadow-sm flex items-start gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-wine/10 dark:bg-gold/15 text-wine dark:text-gold flex items-center justify-center text-lg shrink-0">
                                                <i className="ph-bold ph-shield-check"></i>
                                            </div>
                                            <div>
                                                <span className="font-metadata-spec text-[10px] text-ink-muted dark:text-night-muted block">Bảo Mật 2 Lớp</span>
                                                <span className="font-display font-bold text-xs text-ink dark:text-night-text">Đã Kích Hoạt</span>
                                            </div>
                                        </div>

                                        <div className="p-4 rounded-2xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border shadow-sm flex items-start gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-gold/15 text-gold flex items-center justify-center text-lg shrink-0">
                                                <i className="ph-bold ph-coins"></i>
                                            </div>
                                            <div>
                                                <span className="font-metadata-spec text-[10px] text-ink-muted dark:text-night-muted block">Đơn Vị Thưởng</span>
                                                <span className="font-display font-bold text-xs text-ink dark:text-night-text">350 Khoai Tây</span>
                                            </div>
                                        </div>

                                        <div className="p-4 rounded-2xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border shadow-sm flex items-start gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-paper-200 dark:bg-night-surface text-ink-muted dark:text-night-muted flex items-center justify-center text-lg shrink-0">
                                                <i className="ph-bold ph-calendar-check"></i>
                                            </div>
                                            <div>
                                                <span className="font-metadata-spec text-[10px] text-ink-muted dark:text-night-muted block">Ngày Gia Nhập</span>
                                                <span className="font-display font-bold text-xs text-ink dark:text-night-text">15/01/2026</span>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* TAB 2: VÍ KHOAI TÂY */}
                            {activeTab === 'wallet' && (
                                <>
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-paper-border dark:border-night-border">
                                        <div>
                                            <div className="flex items-center gap-2 text-xs font-metadata-spec text-ink-muted dark:text-night-muted mb-1">
                                                <Link to="/trangchu" className="hover:underline">Trang chủ</Link>
                                                <i className="ph-bold ph-caret-right text-[10px]"></i>
                                                <span>Tài khoản</span>
                                                <i className="ph-bold ph-caret-right text-[10px]"></i>
                                                <span className="text-wine dark:text-gold font-bold">Ví khoai tây</span>
                                            </div>
                                            <h1 className="font-display font-black text-2xl sm:text-3xl text-ink dark:text-night-text tracking-tight">
                                                Ví Khoai Tây & Điểm Thưởng
                                            </h1>
                                        </div>
                                    </div>

                                    {/* Potato Balance Hero Card */}
                                    <div className="rounded-3xl bg-gradient-to-br from-[#201F1B] via-[#2A261D] to-[#171815] text-[#F4F2EC] border border-[#D4AF37]/40 p-6 sm:p-8 shadow-xl relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-80 h-80 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none"></div>
                                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                            <div>
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-xs font-bold text-[#F0D77C]">
                                                    <i className="ph-bold ph-wallet"></i> Số Dư Khả Dụng
                                                </span>
                                                <div className="flex items-baseline gap-3 mt-3">
                                                    <span className="font-display font-black text-4xl sm:text-5xl text-[#F4F2EC] tracking-tight">350</span>
                                                    <span className="font-display font-bold text-2xl text-[#D4AF37]">Khoai 🥔</span>
                                                </div>
                                                <p className="text-xs text-[#E9E4D6]/70 mt-2 max-w-md">
                                                    Tương đương <strong>~35.000 VNĐ</strong> giá trị thuê mượn sách bản quyền và mở khóa chương VIP trên HALM BOOK.
                                                </p>
                                            </div>

                                            <div className="flex flex-wrap sm:flex-nowrap gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => showToast('Cổng Nạp Khoai', 'Vui lòng chọn gói nạp khoai bên dưới để quét mã QR.')}
                                                    className="px-5 py-3 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#E5C158] hover:from-[#C59F2E] hover:to-[#D4AF37] text-[#1A1A17] font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-transform hover:scale-105"
                                                >
                                                    <i className="ph-bold ph-plus-circle text-base"></i>
                                                    <span>Nạp Khoai Ngay</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleSelectTab('history')}
                                                    className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-[#F4F2EC] font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                                                >
                                                    <i className="ph-bold ph-clock-counter-clockwise text-base"></i>
                                                    <span>Lịch Sử Giao Dịch</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Recharge Packages Grid */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-display font-black text-lg text-ink dark:text-night-text flex items-center gap-2">
                                                <i className="ph-bold ph-lightning text-wine dark:text-gold"></i>
                                                Gói Nạp Khoai Ưu Đãi
                                            </h3>
                                            <span className="text-xs font-bold text-wine dark:text-gold">Tặng thêm tới 30%</span>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                            {[
                                                { price: '20.000đ', potato: '200', bonus: '', tag: 'Gói Thử Nghiệm' },
                                                { price: '50.000đ', potato: '550', bonus: '+50 Khoai (10%)', tag: 'Gói Đọc Sách' },
                                                { price: '100.000đ', potato: '1.200', bonus: '+200 Khoai (20%)', tag: 'Gói Mọt Sách', hot: true },
                                                { price: '200.000đ', potato: '2.600', bonus: '+600 Khoai (30%)', tag: 'Gói Học Giả VIP' },
                                            ].map((pkg, i) => (
                                                <div key={i} className={`rounded-2xl p-5 border shadow-sm flex flex-col justify-between transition-all hover:shadow-md ${pkg.hot
                                                    ? 'bg-paper-surface dark:bg-night-card border-wine/50 dark:border-gold/60 ring-2 ring-wine/20 dark:ring-gold/30'
                                                    : 'bg-paper-surface dark:bg-night-card border-paper-border dark:border-night-border'
                                                    }`}>
                                                    <div>
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-ink-muted dark:text-night-muted">{pkg.tag}</span>
                                                            {pkg.hot && <span className="potato-badge text-[9px] py-0 px-1.5 bg-wine text-white dark:bg-gold dark:text-night-bg">HOT</span>}
                                                        </div>
                                                        <div className="font-display font-black text-2xl text-ink dark:text-night-text">{pkg.potato} 🥔</div>
                                                        {pkg.bonus && <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{pkg.bonus}</div>}
                                                    </div>
                                                    <div className="mt-5 pt-3 border-t border-paper-border dark:border-night-border flex items-center justify-between">
                                                        <span className="font-display font-black text-sm text-wine dark:text-gold">{pkg.price}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => showToast('Chọn Gói Nạp', `Đã chọn ${pkg.tag} (${pkg.price}) — Chuyển tiếp cổng thanh toán...`)}
                                                            className="px-3 py-1.5 rounded-xl bg-paper-200 dark:bg-night-surface hover:bg-wine hover:text-white dark:hover:bg-gold dark:hover:text-night-bg text-ink dark:text-night-text text-xs font-bold transition-colors"
                                                        >
                                                            Nạp
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Daily Tasks to Earn Potatoes */}
                                    <div className="rounded-2xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border p-6 shadow-sm space-y-4">
                                        <h3 className="font-display font-black text-base text-ink dark:text-night-text flex items-center gap-2">
                                            <i className="ph-bold ph-target text-wine dark:text-gold"></i>
                                            Nhiệm Vụ Nhận Khoai Hằng Ngày
                                        </h3>
                                        <div className="space-y-3">
                                            {[
                                                { title: 'Điểm danh hằng ngày', reward: '+5 Khoai 🥔', progress: '1/1', done: true, desc: 'Đăng nhập vào HALM BOOK mỗi ngày để nhận quà.' },
                                                { title: 'Đọc sách trên 30 phút', reward: '+15 Khoai 🥔', progress: '24/30 phút', done: false, desc: 'Đọc bất kỳ tác phẩm nào trong tủ sách của bạn.' },
                                                { title: 'Chia sẻ hoặc đánh giá tác phẩm', reward: '+10 Khoai 🥔', progress: '0/1', done: false, desc: 'Để lại bình luận cảm nhận chân thực cho bạn đọc khác.' },
                                            ].map((task, i) => (
                                                <div key={i} className="p-3.5 rounded-xl bg-paper dark:bg-night-surface border border-paper-border dark:border-night-border flex items-center justify-between gap-3">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-display font-bold text-xs text-ink dark:text-night-text">{task.title}</span>
                                                            <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400">{task.reward}</span>
                                                        </div>
                                                        <p className="text-[11px] text-ink-muted dark:text-night-muted mt-0.5">{task.desc}</p>
                                                    </div>
                                                    {task.done ? (
                                                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 text-xs font-bold">
                                                            <i className="ph-bold ph-check"></i> Đã Nhận
                                                        </span>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() => showToast('Nhiệm Vụ', `Tiến độ: ${task.progress}. Hãy hoàn thành để nhận ${task.reward}!`)}
                                                            className="px-3 py-1 rounded-xl bg-paper-200 dark:bg-night-card hover:bg-wine hover:text-white dark:hover:bg-gold dark:hover:text-night-bg text-ink dark:text-night-text text-xs font-bold transition-colors whitespace-nowrap"
                                                        >
                                                            {task.progress}
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* TAB 3: LỊCH SỬ GIAO DỊCH */}
                            {activeTab === 'history' && (
                                <>
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-paper-border dark:border-night-border">
                                        <div>
                                            <div className="flex items-center gap-2 text-xs font-metadata-spec text-ink-muted dark:text-night-muted mb-1">
                                                <Link to="/trangchu" className="hover:underline">Trang chủ</Link>
                                                <i className="ph-bold ph-caret-right text-[10px]"></i>
                                                <span>Tài khoản</span>
                                                <i className="ph-bold ph-caret-right text-[10px]"></i>
                                                <span className="text-wine dark:text-gold font-bold">Lịch sử giao dịch</span>
                                            </div>
                                            <h1 className="font-display font-black text-2xl sm:text-3xl text-ink dark:text-night-text tracking-tight">
                                                Lịch Sử Giao Dịch
                                            </h1>
                                        </div>
                                    </div>

                                    {/* Transactions List Card */}
                                    <div className="rounded-2xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border p-6 shadow-sm space-y-4">
                                        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-paper-border dark:border-night-border">
                                            <div className="flex items-center gap-2">
                                                <span className="w-8 h-8 rounded-lg bg-wine/10 dark:bg-gold/15 text-wine dark:text-gold flex items-center justify-center text-lg">
                                                    <i className="ph-bold ph-receipt"></i>
                                                </span>
                                                <div>
                                                    <h3 className="font-display font-bold text-sm text-ink dark:text-night-text">Danh Sách Giao Dịch Gần Đây</h3>
                                                    <p className="text-[11px] text-ink-muted dark:text-night-muted">Tất cả biến động số dư khoai tây và lượt thuê sách.</p>
                                                </div>
                                            </div>
                                            <span className="potato-badge text-xs">Tổng 5 giao dịch</span>
                                        </div>

                                        <div className="overflow-x-auto -mx-2">
                                            <table className="w-full text-left text-xs font-metadata-spec border-collapse min-w-[640px]">
                                                <thead>
                                                    <tr className="border-b border-paper-border dark:border-night-border text-ink-muted dark:text-night-muted font-bold">
                                                        <th className="py-3 px-3">Mã GD</th>
                                                        <th className="py-3 px-3">Loại Giao Dịch & Chi Tiết</th>
                                                        <th className="py-3 px-3">Thời Gian</th>
                                                        <th className="py-3 px-3 text-right">Biến Động</th>
                                                        <th className="py-3 px-3 text-center">Trạng Thái</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-paper-border dark:divide-night-border">
                                                    {[
                                                        { id: 'GD984321', title: 'Thuê sách: Atomic Habits', type: 'Thuê sách', time: '18/10/2026 14:32', amount: '-10 Khoai', isMinus: true, status: 'Thành công' },
                                                        { id: 'GD984210', title: 'Điểm danh hằng ngày', type: 'Thưởng', time: '18/10/2026 08:15', amount: '+5 Khoai', isMinus: false, status: 'Thành công' },
                                                        { id: 'GD982109', title: 'Nạp khoai: Gói Mọt Sách', type: 'Nạp khoai', time: '16/10/2026 19:40', amount: '+1.200 Khoai', isMinus: false, status: 'Thành công' },
                                                        { id: 'GD979924', title: 'Thuê sách: Điện Biên Phủ 56 Ngày Đêm', type: 'Thuê sách', time: '15/10/2026 10:12', amount: '-10 Khoai', isMinus: true, status: 'Thành công' },
                                                        { id: 'GD910022', title: 'Thưởng thăng hạng: Thợ Cày 🌱', type: 'Thưởng VIP', time: '15/01/2026 09:00', amount: '+50 Khoai', isMinus: false, status: 'Thành công' },
                                                    ].map((tx, idx) => (
                                                        <tr key={idx} className="hover:bg-paper dark:hover:bg-night-surface/50 transition-colors">
                                                            <td className="py-3.5 px-3 font-mono font-bold text-ink-muted dark:text-night-muted">{tx.id}</td>
                                                            <td className="py-3.5 px-3">
                                                                <span className="font-bold text-ink dark:text-night-text block">{tx.title}</span>
                                                                <span className="text-[10px] text-ink-muted dark:text-night-muted">{tx.type}</span>
                                                            </td>
                                                            <td className="py-3.5 px-3 text-ink-muted dark:text-night-muted">{tx.time}</td>
                                                            <td className={`py-3.5 px-3 text-right font-black ${tx.isMinus ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                                                                }`}>
                                                                {tx.amount}
                                                            </td>
                                                            <td className="py-3.5 px-3 text-center">
                                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 text-[10px] font-bold">
                                                                    <i className="ph-bold ph-check-circle"></i> {tx.status}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </>
                            )}

                        </div>

                    </div>
                </main>







                <button id="btnScrollToTop" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className={isScrollTopVisible ? 'show' : ''} title="Lên đầu trang" aria-label="Cuộn lên đầu trang">
                    <i className="ph-bold ph-arrow-up text-lg"></i>
                </button>



                <div id="chatbot-container">

                    <div id="chat-window" className={`chat-window ${isChatOpen ? 'show' : ''}`}>

                        <div className="bg-gradient-to-r from-wine to-wine-light text-white px-5 py-3.5 flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-white p-0.5 shrink-0">
                                    <img src="/logo.png" alt="Bot" className="w-full h-full rounded-full object-cover" />
                                </div>
                                <div>
                                    <div className="font-display font-bold text-sm tracking-wide leading-tight">Trợ lý ảo HALM BOOK</div>
                                    <div className="font-metadata-spec text-[10px] text-gold font-medium">Hỗ trợ hồ sơ & tài khoản</div>
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
                                    <img src="/logo.png" alt="Bot" className="w-full h-full rounded-full object-cover" />
                                </div>
                                <h4 className="font-display font-black text-sm text-white">Xin chào Alex Nguyễn!</h4>
                                <p className="font-editorial-body text-xs text-night-muted leading-relaxed">
                                    Tôi là trợ lý AI của HALM BOOK. Bạn có thắc mắc gì về hồ sơ hoặc điểm thưởng Khoai không?
                                </p>


                                <div className="space-y-2 pt-1 text-left font-metadata-spec">
                                    <button onClick={() => sendMessage("Cách nâng hạng hội viên từ Thợ Cày 🌱?")} className="suggestion-btn w-full p-2.5 rounded-xl bg-night-card hover:bg-night-border border border-night-border text-xs text-white flex items-center justify-between transition-colors">
                                        <span>Cách nâng hạng hội viên từ Thợ Cày 🌱?</span>
                                        <i className="ph-bold ph-arrow-right text-gold"></i>
                                    </button>
                                    <button onClick={() => sendMessage("Làm sao để đổi thông tin số điện thoại?")} className="suggestion-btn w-full p-2.5 rounded-xl bg-night-card hover:bg-night-border border border-night-border text-xs text-white flex items-center justify-between transition-colors">
                                        <span>Làm sao để đổi thông tin số điện thoại?</span>
                                        <i className="ph-bold ph-arrow-right text-gold"></i>
                                    </button>
                                    <button onClick={() => sendMessage("Kiểm tra lịch sử chi tiêu Khoai?")} className="suggestion-btn w-full p-2.5 rounded-xl bg-night-card hover:bg-night-border border border-night-border text-xs text-white flex items-center justify-between transition-colors">
                                        <span>Kiểm tra lịch sử chi tiêu Khoai?</span>
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
                                <input type="text" id="chat-input" placeholder="Nhập câu hỏi của bạn..." value={chatInput} onChange={(event) => setChatInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') sendMessage(); }}
                                    className="w-full bg-night-card text-white placeholder-night-muted text-xs rounded-xl pl-3.5 pr-10 py-3 border border-night-border focus:outline-none focus:border-wine transition-colors font-metadata-spec" />
                                <button id="send-btn" onClick={() => sendMessage()} className="absolute right-2 text-gold hover:text-white p-1.5 transition-colors" aria-label="Gửi tin">
                                    <i className="ph-bold ph-paper-plane-tilt text-lg"></i>
                                </button>
                            </div>
                        </div>
                    </div>


                    <button id="chat-toggle-btn" onClick={() => setIsChatOpen((current) => !current)} className="w-14 h-14 rounded-full bg-wine hover:bg-wine-dark text-white p-1 shadow-2xl flex items-center justify-center transition-transform hover:scale-105" aria-label="Mở trợ lý ảo AI">
                        <img src="/logo.png" alt="Chatbot" className="w-full h-full rounded-full object-cover" />
                    </button>
                </div>
            </UserLayout>
        </>
    );
}
