import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import UserLayout from './layout/UserLayout';
import { isDarkMode, applyTheme } from '@/utils/theme';
import { getCurrentCustomer } from '@/services/customerService';
import { getCustomerBookshelf, checkoutWithPotato } from '@/services/orderService';
import { getTierInfo } from '@/utils/tierUtils';
const myBooksTailwindConfig = {
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
const ASSETS = { fonts: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Open+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400;1,600&family=Roboto:wght@300;400;500;700;900&display=swap', bold: 'https://unpkg.com/@phosphor-icons/web@2.1.1/src/bold/style.css', regular: 'https://unpkg.com/@phosphor-icons/web@2.1.1/src/regular/style.css', fill: 'https://unpkg.com/@phosphor-icons/web@2.1.1/src/fill/style.css', duotone: 'https://unpkg.com/@phosphor-icons/web@2.1.1/src/duotone/style.css', tailwind: 'https://cdn.tailwindcss.com' };
function createStars() { return Array.from({ length: 80 }, (_, id) => ({ id, size: Math.random() * 2.5 + .5, top: Math.random() * 100, left: Math.random() * 100, duration: Math.random() * 3 + 2, delay: Math.random() * 3 })); }
function handleImageError(event, fallback = '/logo.png') { const image = event.currentTarget; if (image.dataset.fallbackAttempted) return; image.dataset.fallbackAttempted = 'true'; image.src = fallback; }

const RENEW_PRICING = {
    '7': 9,
    '14': 15,
    '30': 25
};

function getBotReply(input, bookshelf = [], potatoBalance = 0) {
    const query = input.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (query.includes('khoai')) return `Số dư hiện tại của bạn là ${potatoBalance.toLocaleString()} Khoai Tây 🥔. Bạn có thể dùng Khoai để thuê thêm sách hoặc gia hạn thời gian mượn!`;
    if (query.includes('gia han') || query.includes('het han')) return "Bạn có thể bấm nút Thêm thời gian đọc ngay trên thẻ sách. Các gói gồm: +7 ngày (9 Khoai), +14 ngày (15 Khoai) hoặc +30 ngày (25 Khoai).";
    if (bookshelf && bookshelf.length > 0) {
        const found = bookshelf.find(b => query.includes((b.bookTitle || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')));
        if (found) {
            return `Tác phẩm "${found.bookTitle}" của tác giả ${found.authorName || 'tác giả'}. Hiện bạn còn ${found.remainingDays > 1000 ? 'vĩnh viễn' : found.remainingDays + ' ngày'} đọc. Chúc bạn có những phút giây đọc sách bổ ích!`;
        }
    }
    return "Tôi có thể hỗ trợ bạn tóm tắt nội dung sách đang đọc, kiểm tra thời hạn mượn hoặc gợi ý tác phẩm mới phù hợp!";
}
export default function MyBooks() {
    const navigate = useNavigate();
    const [isDark, setIsDark] = useState(() => isDarkMode());
    const [stars, setStars] = useState([]);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isScrollTopVisible, setIsScrollTopVisible] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [toast, setToast] = useState({ title: "Tủ Sách HALM BOOK", message: "Đã cập nhật trạng thái tủ sách." });
    const [toastVisible, setToastVisible] = useState(false);
    const [activeCategory, setActiveCategory] = useState('reading');
    const [renewBook, setRenewBook] = useState(null);
    const [expiredBook, setExpiredBook] = useState(null);
    const [selectedPlan, setSelectedPlan] = useState('7');
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatInput, setChatInput] = useState('');
    const [messages, setMessages] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

    // Dữ liệu khách hàng & tủ sách từ Backend
    const [customer, setCustomer] = useState(null);
    const [bookshelf, setBookshelf] = useState([]);
    const [isLoadingBooks, setIsLoadingBooks] = useState(true);
    const [isRenewing, setIsRenewing] = useState(false);

    const messagesEndRef = useRef(null);
    const nextMessageId = useRef(0);
    const starsInitialized = useRef(false);
    const toastTimer = useRef(null);
    const pendingTimers = useRef(new Set());

    const fetchCustomer = async () => {
        try {
            const data = await getCurrentCustomer();
            if (data) {
                setCustomer(data);
            }
        } catch (e) {
            console.error("Lỗi khi tải thông tin khách hàng:", e);
        }
    };

    const normalizeBookshelfItem = (b) => {
        const isForever = Boolean(b.isForever || (b.remainingDays && b.remainingDays > 1000));
        const remDays = b.remainingDays !== undefined && b.remainingDays !== null ? Number(b.remainingDays) : 0;
        const isExpired = b.status === 'EXPIRED' || (!isForever && remDays <= 0 && b.endDate && new Date(b.endDate) <= new Date());
        return {
            ...b,
            accessId: b.accessRecordId || b.access_record_id || b.id || b.accessId,
            bookId: b.bookId || b.book_id,
            bookTitle: b.bookName || b.bookTitle || 'Sách HALM BOOK',
            bookName: b.bookName || b.bookTitle || 'Sách HALM BOOK',
            authorName: b.author || b.authorName || 'Tác giả HALM BOOK',
            author: b.author || b.authorName || 'Tác giả HALM BOOK',
            coverImage: b.imgUrl || b.coverImage || '/logo.png',
            imgUrl: b.imgUrl || b.coverImage || '/logo.png',
            remainingDays: remDays,
            isForever,
            expired: isExpired,
            status: isExpired ? 'EXPIRED' : (b.status || 'ACTIVE')
        };
    };

    const fetchBookshelf = async () => {
        try {
            setIsLoadingBooks(true);
            const list = await getCustomerBookshelf();
            if (Array.isArray(list)) {
                setBookshelf(list.map(normalizeBookshelfItem));
            }
        } catch (e) {
            console.error("Lỗi khi tải tủ sách:", e);
        } finally {
            setIsLoadingBooks(false);
        }
    };

    useEffect(() => {
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
        document.body.style.height = '';
        document.documentElement.style.overflow = '';
        document.documentElement.style.height = '';
        window.dispatchEvent(new Event('resize'));

        fetchCustomer();
        fetchBookshelf();

        const handlePageShow = () => {
            fetchCustomer();
            fetchBookshelf();
            window.dispatchEvent(new Event('resize'));
        };
        window.addEventListener('pageshow', handlePageShow);
        window.addEventListener('popstate', handlePageShow);

        return () => {
            window.removeEventListener('pageshow', handlePageShow);
            window.removeEventListener('popstate', handlePageShow);
        };
    }, []);

    useEffect(() => { applyTheme(isDark); }, [isDark]);
    useEffect(() => {
        const handleGlobalThemeChange = (e) => {
            if (typeof e.detail?.isDark === 'boolean') {
                setIsDark(e.detail.isDark);
            }
        };
        const handleBookshelfUpdated = () => {
            fetchBookshelf();
            fetchCustomer();
        };
        const handlePotatoUpdated = (e) => {
            const newBal = e.detail?.potatoBalance;
            if (newBal !== undefined) {
                setCustomer(prev => prev ? { ...prev, potatoBalance: newBal } : prev);
            }
        };

        window.addEventListener('halm-theme-change', handleGlobalThemeChange);
        window.addEventListener('halm-bookshelf-updated', handleBookshelfUpdated);
        window.addEventListener('halm-potato-updated', handlePotatoUpdated);

        return () => {
            window.removeEventListener('halm-theme-change', handleGlobalThemeChange);
            window.removeEventListener('halm-bookshelf-updated', handleBookshelfUpdated);
            window.removeEventListener('halm-potato-updated', handlePotatoUpdated);
        };
    }, []);
    useEffect(() => { if (isDark && !starsInitialized.current) { starsInitialized.current = true; setStars(createStars()); } }, [isDark]);
    useEffect(() => { document.title = "HALM BOOK — Tủ Sách Của Tôi & Không Gian Đọc Cá Nhân"; let d = document.querySelector('meta[name="description"]'); if (!d) { d = document.createElement('meta'); d.name = 'description'; document.head.appendChild(d); } d.content = "Quản lý tủ sách cá nhân HALM BOOK: Sách đang thuê, tiến trình đọc số, gia hạn bằng Khoai và lịch sử đọc sách bản quyền."; }, []);
    useEffect(() => { const f = () => { const y = window.pageYOffset || document.documentElement.scrollTop; setIsScrolled(y > 30); setIsScrollTopVisible(y > 250); }; window.addEventListener('scroll', f, { passive: true }); f(); return () => window.removeEventListener('scroll', f); }, []);
    useEffect(() => { if (messages.length) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [messages]);
    useEffect(() => () => { pendingTimers.current.forEach(id => window.clearTimeout(id)); pendingTimers.current.clear(); if (toastTimer.current) window.clearTimeout(toastTimer.current); }, []);
    useEffect(() => { if (!document.querySelector('link[data-my-books-fonts]')) { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = ASSETS.fonts; l.dataset.myBooksFonts = 'true'; document.head.appendChild(l); } Object.entries({ bold: ASSETS.bold, regular: ASSETS.regular, fill: ASSETS.fill, duotone: ASSETS.duotone }).forEach(([k, href]) => { if (document.querySelector(`link[data-my-books-icons="${k}"]`)) return; const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href; l.dataset.myBooksIcons = k; document.head.appendChild(l); }); window.tailwind = window.tailwind || {}; window.tailwind.config = myBooksTailwindConfig; if (!document.querySelector('script[src*="cdn.tailwindcss.com"]')) { const s = document.createElement('script'); s.src = ASSETS.tailwind; s.async = true; document.head.appendChild(s); } }, []);
    const showToast = (title, message) => { setToast({ title, message }); setToastVisible(true); if (toastTimer.current) window.clearTimeout(toastTimer.current); toastTimer.current = window.setTimeout(() => setToastVisible(false), 3500); };
    const filterBooks = category => { setActiveCategory(category); if (category === 'favorites' || category === 'notes') showToast("Bộ Lọc Tủ Sách", `Đang hiển thị mục: ${{ favorites: "Yêu Thích", notes: "Ghi Chú AI" }[category]}`); };
    const handleBookshelfSearch = () => { const q = searchQuery.trim(); if (q) showToast("Tìm Kiếm Tủ Sách", `Đang lọc các sách phù hợp với: "${q}"`); };
    const openRenewModal = (title, remainingDays, bookId) => { setSelectedPlan('7'); setRenewBook({ title, remainingDays, bookId }); };
    const closeRenewModal = () => setRenewBook(null);
    const closeExpiredModal = () => setExpiredBook(null);
    const handleContinueReading = (title, expired, bookId) => {
        if (expired) {
            setExpiredBook({ title, bookId });
        } else {
            navigate(bookId ? `/docsach/${encodeURIComponent(bookId)}?mode=full` : '/docsach?mode=full');
        }
    };
    const proceedToRenewFromExpired = () => {
        const item = expiredBook;
        closeExpiredModal();
        if (item) openRenewModal(item.title, 0, item.bookId);
    };
    const confirmRenew = async () => {
        if (!renewBook) return;
        try {
            setIsRenewing(true);
            const res = await checkoutWithPotato({
                items: [{
                    bookId: renewBook.bookId,
                    plan: selectedPlan
                }],
                paymentMethod: 'POTATO'
            });
            closeRenewModal();
            showToast("Gia Hạn Thành Công!", `Đã gia hạn thêm +${selectedPlan} ngày cho cuốn "${renewBook.title}". Số dư Khoai: ${res.remainingPotatoBalance} 🥔`);
            await fetchBookshelf();
            if (customer) {
                setCustomer(prev => prev ? { ...prev, potatoBalance: res.remainingPotatoBalance } : prev);
            }
        } catch (error) {
            console.error("Lỗi khi gia hạn sách:", error);
            const msg = error.response?.data?.message || "Không thể gia hạn sách. Vui lòng kiểm tra lại số dư Khoai!";
            showToast("Gia Hạn Thất Bại", msg);
        } finally {
            setIsRenewing(false);
        }
    };
    const copyCitation = async () => { try { await navigator.clipboard.writeText("\"Tình yêu có vị ngọt ngào của tình bạn và vị đắng chát của chia ly... Nhưng ngay cả nỗi buồn cũng đẹp nếu nó xuất phát từ một trái tim chân thành.\" — Có Hai Con Mèo Ngồi Bên Cửa Sổ, trang 42"); showToast("Trích Dẫn", "Đã sao chép trích dẫn vào clipboard!"); } catch { showToast("Không thể sao chép", "Trình duyệt không cho phép truy cập clipboard."); } };
    const scheduleBotReply = text => { const id = window.setTimeout(() => { setMessages(cur => [...cur, { id: nextMessageId.current++, sender: 'bot', content: getBotReply(text, bookshelf, customer?.potatoBalance ?? 0) }]); pendingTimers.current.delete(id); }, 600); pendingTimers.current.add(id); };
    const sendMessage = (text = chatInput) => { const value = text.trim(); if (!value) return; setMessages(cur => [...cur, { id: nextMessageId.current++, sender: 'user', content: value }]); setChatInput(''); scheduleBotReply(value); };
    const openChatbot = text => { setIsChatOpen(true); if (text) sendMessage(text); };
    const resetChat = () => { pendingTimers.current.forEach(id => window.clearTimeout(id)); pendingTimers.current.clear(); setMessages([]); setChatInput(''); };

    // Phân loại danh sách sách
    const activeBooks = bookshelf.filter(b => !b.expired && (b.remainingDays > 0 || b.isForever));
    const historyBooks = bookshelf.filter(b => b.expired || (b.remainingDays <= 0 && !b.isForever));

    const filteredActiveBooks = activeBooks.filter(b => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (b.bookTitle && b.bookTitle.toLowerCase().includes(q)) ||
               (b.authorName && b.authorName.toLowerCase().includes(q)) ||
               (b.categoryName && b.categoryName.toLowerCase().includes(q));
    });

    const filteredHistoryBooks = historyBooks.filter(b => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (b.bookTitle && b.bookTitle.toLowerCase().includes(q)) ||
               (b.authorName && b.authorName.toLowerCase().includes(q)) ||
               (b.categoryName && b.categoryName.toLowerCase().includes(q));
    });



    const customerInitial = (customer?.customerName || customer?.name || 'U').charAt(0).toUpperCase();
    const customerName = customer?.customerName || customer?.name || 'Bạn đọc HALM';
    const customerIdDisplay = customer?.customerId 
        ? `id#C${String(customer.customerId).replace(/^C/i, '').padStart(5, '0')}`
        : (customer?.customer_id 
            ? `id#C${String(customer.customer_id).replace(/^C/i, '').padStart(5, '0')}`
            : 'id#C00007');
    const avatarSrc = customer?.avatar || customer?.avatarUrl;
    const potatoBalance = customer?.potatoBalance ?? 0;
    const tierInfo = getTierInfo(customer?.membershipTier);
    return <><style>{String.raw`
        /* ========================================================
           TYPOGRAPHY & CSS VARIABLES (ĐỒNG BỘ TRANG CHỦ & HỘI VIÊN)
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

        .my-books-page {
            font-family: var(--font-ui);
            background-color: #F7F4EE;
            color: #1E1F1D;
            -webkit-font-smoothing: antialiased;
            transition: background-color 0.4s ease, color 0.4s ease;
        }

        .dark .my-books-page {
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
        .my-books-page #starry-background {
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
        .dark .my-books-page #starry-background {
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
        .my-books-page #navbar.scrolled {
            background: rgba(247, 244, 238, 0.92);
            backdrop-filter: blur(14px);
            -webkit-backdrop-filter: blur(14px);
            border-bottom: 1px solid rgba(227, 221, 208, 0.7);
            box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.05);
        }
        .dark .my-books-page #navbar.scrolled {
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
        .dark .my-books-page .potato-badge {
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
        .my-books-page #btnScrollToTop {
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
        .dark .my-books-page #btnScrollToTop {
            background: #20221E;
            color: #EDE9DF;
            border-color: #2C2E29;
            box-shadow: 0 4px 14px rgba(0,0,0,0.4);
        }
        .my-books-page #btnScrollToTop.show {
            opacity: 1;
            visibility: visible;
        }
        .my-books-page #btnScrollToTop:hover {
            transform: translateY(-3px);
            background: #8E3038;
            color: #fff;
            border-color: #8E3038;
        }
        .dark .my-books-page #btnScrollToTop:hover {
            background: #B8860B;
            color: #111210;
            border-color: #B8860B;
        }

        /* Toast Container */
        .my-books-page #toast-notification {
            position: fixed;
            top: 24px;
            right: 24px;
            z-index: 1000;
            transform: translateX(120%);
            transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .my-books-page #toast-notification.show {
            transform: translateX(0);
        }

        /* Book 3D Spine and Card Elevation */
        .book-cover-elevated {
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.25), 0 8px 10px -6px rgba(0, 0, 0, 0.2);
            transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease;
        }
        .book-cover-elevated:hover {
            transform: translateY(-4px) scale(1.02);
            box-shadow: 0 20px 30px -10px rgba(0, 0, 0, 0.35);
        }

        /* Tab Pill Active Styles */
        .my-books-page .library-tab.active {
            background-color: #8E3038;
            color: #ffffff;
            border-color: #8E3038;
        }
        html.dark .my-books-page .library-tab.active {
            background-color: #B8860B;
            color: #111210;
            border-color: #B8860B;
            font-weight: 800;
        }

        .my-books-page [class~="hover:text-gold"]:hover { color: #B8860B; }
        .my-books-page [class~="hover:border-wine"]:hover { border-color: #8E3038; }
        .my-books-page [class~="after:bg-wine"]::after { background-color: #8E3038; }
        .my-books-page [class~="focus:ring-wine"]:focus { --tw-ring-color: #8E3038; }
        html.dark .my-books-page [class~="dark:after:bg-gold"]::after { background-color: #B8860B; }
        html.dark .my-books-page [class~="dark:hover:bg-gold-light"]:hover { background-color: #D4AF37; }
        html.dark .my-books-page [class~="dark:hover:border-gold"]:hover { border-color: #B8860B; }
        html.dark .my-books-page [class~="dark:hover:text-night-text"]:hover { color: #EDE9DF; }
    
.my-books-page [class~="bg-paper"]{background:#F7F4EE}.my-books-page [class~="bg-paper-surface"]{background:#FFFEFA}.my-books-page [class~="bg-paper-200"]{background:#EAE5D9}.my-books-page [class~="bg-paper-200/70"]{background:rgb(234 229 217/.7)}.my-books-page [class~="bg-wine"]{background:#8E3038}.my-books-page [class~="bg-wine/5"]{background:rgb(142 48 56/.05)}.my-books-page [class~="bg-wine/10"]{background:rgb(142 48 56/.1)}.my-books-page [class~="bg-wine/20"]{background:rgb(142 48 56/.2)}.my-books-page [class~="bg-gold"]{background:#B8860B}.my-books-page [class~="bg-gold/15"]{background:rgb(184 134 11/.15)}.my-books-page [class~="bg-night-card"]{background:#20221E}.my-books-page [class~="bg-night-surface"]{background:#181916}.my-books-page [class~="bg-night-border"]{background:#2C2E29}
.my-books-page [class~="text-ink"]{color:#1E1F1D}.my-books-page [class~="text-ink/80"]{color:rgb(30 31 29/.8)}.my-books-page [class~="text-ink-muted"]{color:#66645E}.my-books-page [class~="text-wine"]{color:#8E3038}.my-books-page [class~="text-gold"]{color:#B8860B}.my-books-page [class~="text-night-bg"]{color:#111210}.my-books-page [class~="text-night-text"]{color:#EDE9DF}.my-books-page [class~="text-night-muted"]{color:#96938B}.my-books-page [class~="border-paper-border"]{border-color:#E3DDD0}.my-books-page [class~="border-wine"]{border-color:#8E3038}.my-books-page [class~="border-wine/30"]{border-color:rgb(142 48 56/.3)}.my-books-page [class~="border-wine/40"]{border-color:rgb(142 48 56/.4)}.my-books-page [class~="border-gold"]{border-color:#B8860B}.my-books-page [class~="border-night-border"]{border-color:#2C2E29}.my-books-page [class~="from-wine"][class~="to-wine-light"]{background-image:linear-gradient(to right,#8E3038,#A83B46)}
.my-books-page [class~="hover:bg-paper-200"]:hover{background:#EAE5D9}.my-books-page [class~="hover:bg-paper-border"]:hover{background:#E3DDD0}.my-books-page [class~="hover:bg-wine"]:hover{background:#8E3038}.my-books-page [class~="hover:bg-wine-dark"]:hover{background:#6F252C}.my-books-page [class~="hover:text-ink"]:hover{color:#1E1F1D}.my-books-page [class~="hover:text-wine"]:hover{color:#8E3038}.my-books-page [class~="focus:border-wine"]:focus{border-color:#8E3038}.my-books-page [class~="placeholder-ink-muted/80"]::placeholder{color:rgb(102 100 94/.8)}.my-books-page [class~="placeholder-night-muted"]::placeholder{color:#96938B}.my-books-page [class~="ring-wine"]{--tw-ring-color:#8E3038}.my-books-page [class~="potato-badge"]{background:rgb(184 134 11/.12);color:#B8860B;border-color:rgb(184 134 11/.25)}.my-books-page .library-tab.active{background:#8E3038;color:#fff;border-color:#8E3038}
html.dark .my-books-page [class~="dark:bg-gold"]{background:#B8860B}html.dark .my-books-page [class~="dark:bg-gold/10"]{background:rgb(184 134 11/.1)}html.dark .my-books-page [class~="dark:bg-gold/15"]{background:rgb(184 134 11/.15)}html.dark .my-books-page [class~="dark:bg-gold/20"]{background:rgb(184 134 11/.2)}html.dark .my-books-page [class~="dark:bg-night-bg"]{background:#111210}html.dark .my-books-page [class~="dark:bg-night-card"]{background:#20221E}html.dark .my-books-page [class~="dark:bg-night-surface"]{background:#181916}html.dark .my-books-page [class~="dark:bg-night-border"]{background:#2C2E29}html.dark .my-books-page [class~="dark:text-gold"]{color:#B8860B}html.dark .my-books-page [class~="dark:text-night-bg"]{color:#111210}html.dark .my-books-page [class~="dark:text-night-muted"]{color:#96938B}html.dark .my-books-page [class~="dark:text-night-text"]{color:#EDE9DF}html.dark .my-books-page [class~="dark:border-gold"]{border-color:#B8860B}html.dark .my-books-page [class~="dark:border-gold/40"]{border-color:rgb(184 134 11/.4)}html.dark .my-books-page [class~="dark:border-night-border"]{border-color:#2C2E29}html.dark .my-books-page [class~="dark:border-night-card"]{border-color:#20221E}html.dark .my-books-page [class~="dark:from-gold"][class~="dark:to-gold-light"]{background-image:linear-gradient(to right,#B8860B,#D4AF37)}html.dark .my-books-page [class~="dark:hover:bg-gold"]:hover{background:#B8860B}html.dark .my-books-page [class~="dark:hover:bg-night-card"]:hover{background:#20221E}html.dark .my-books-page [class~="dark:hover:bg-night-surface"]:hover{background:#181916}html.dark .my-books-page [class~="dark:hover:bg-night-border"]:hover{background:#2C2E29}html.dark .my-books-page [class~="dark:hover:text-gold"]:hover{color:#B8860B}html.dark .my-books-page [class~="dark:hover:text-night-bg"]:hover{color:#111210}html.dark .my-books-page [class~="dark:focus:border-gold"]:focus{border-color:#D4AF37}html.dark .my-books-page [class~="potato-badge"]{background:rgb(212 175 55/.15);color:#D4AF37;border-color:rgb(212 175 55/.3)}html.dark .my-books-page .library-tab.active{background:#B8860B;color:#111210;border-color:#B8860B;font-weight:800}
`}</style>
        <UserLayout className="my-books-page" onOpenChatbot={openChatbot} onThemeChange={setIsDark}>

            {/* Starry background in Dark Mode */}
            <div id="starry-background" aria-hidden="true">
                {stars.map((star) => <div key={star.id} className="star" style={{ width: `${star.size}px`, height: `${star.size}px`, top: `${star.top}%`, left: `${star.left}%`, animation: `starTwinkle ${star.duration}s infinite ease-in-out ${star.delay}s` }} />)}</div>

            {/* Toast Notification */}
            <div id="toast-notification" className={`flex items-center gap-3 px-5 py-4 rounded-xl bg-paper-surface dark:bg-night-card border border-wine/30 dark:border-gold/40 shadow-2xl text-ink dark:text-night-text ${toastVisible ? 'show' : ''}`}>
                <div className="w-8 h-8 rounded-full bg-wine/10 dark:bg-gold/20 flex items-center justify-center text-wine dark:text-gold shrink-0">
                    <i className="ph-bold ph-check text-lg"></i>
                </div>
                <div>
                    <div className="font-display font-bold text-xs" id="toast-title">{toast.title}</div>
                    <div className="font-editorial-body text-xs text-ink-muted dark:text-night-muted" id="toast-message">{toast.message}</div>
                </div>
            </div>


            {/* ========================================================
         MAIN DASHBOARD CONTAINER (ĐỒNG BỘ 100% LAYOUT PROFILE & TIERS)
         ======================================================== */}
            <main className="w-full max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8 sm:pt-28 sm:pb-10 flex-1">
                <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">

                    {/* ====================================================
                 SIDEBAR TRÁI: HỒ SƠ & ĐIỀU HƯỚNG TÀI KHOẢN (ĐỒNG BỘ)
                 ==================================================== */}
                    {/* LEFT SIDEBAR - FIXED/STICKY CONTAINER */}
                    <aside className="w-full lg:w-80 shrink-0 space-y-5 lg:sticky lg:top-24 lg:self-start">

                        {/* 1. Profile Avatar Card */}
                        <div className="rounded-2xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border p-6 shadow-sm flex flex-col items-center text-center relative overflow-hidden group">
                            {/* Ambient aura behind avatar */}
                            <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-36 h-36 bg-wine/10 dark:bg-gold/10 rounded-full blur-2xl pointer-events-none"></div>

                            {/* Avatar */}
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

                            {/* Name & Handle */}
                            <h2 className="font-display font-black text-lg text-ink dark:text-night-text leading-tight">
                                {customerName}
                            </h2>
                            <p className="font-metadata-spec text-xs text-ink-muted dark:text-night-muted mt-0.5">
                                {customerIdDisplay}
                            </p>

                            {/* Membership Badge */}
                            <Link to="/hang" className="mt-3.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25 text-xs font-metadata-spec font-bold hover:scale-105 transition-transform" title="Xem cấp bậc hội viên">
                                <i className={`ph-bold ${tierInfo.icon} text-emerald-600 dark:text-emerald-400`}></i>
                                <span>{tierInfo.name}</span>
                            </Link>

                            {/* Quick Reader Stats */}
                            <div className="grid grid-cols-2 gap-2 w-full pt-4 mt-4 border-t border-paper-border dark:border-night-border text-center">
                                <Link to="/canhan?tab=wallet" className="p-2.5 rounded-xl bg-paper dark:bg-night-surface border border-paper-border dark:border-night-border hover:border-gold transition-colors">
                                    <span className="block font-metadata-spec text-base font-black text-ink dark:text-night-text">{potatoBalance.toLocaleString()}</span>
                                    <span className="font-metadata-spec text-[10px] text-ink-muted dark:text-night-muted">Khoai Tích Lũy</span>
                                </Link>
                                <div className="p-2.5 rounded-xl bg-paper dark:bg-night-surface border border-paper-border dark:border-night-border">
                                    <span className="block font-metadata-spec text-base font-black text-ink dark:text-night-text">{activeBooks.length}</span>
                                    <span className="font-metadata-spec text-[10px] text-ink-muted dark:text-night-muted">Sách Trong Tủ</span>
                                </div>
                            </div>
                        </div>

                        {/* 2. Navigation Menu Card - STRICT ORDER (1: Profile, 2: Bookshelf, 3: Tiers, 4: Wallet, 5: History, Divider, 6: Logout) */}
                        <div className="rounded-2xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border p-3 shadow-sm space-y-1">
                            {/* 1. Thông Tin Cá Nhân */}
                            <Link
                                to="/canhan"
                                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-metadata-spec font-bold text-ink-muted dark:text-night-muted hover:bg-paper-200 dark:hover:bg-night-surface hover:text-ink dark:hover:text-night-text transition-colors"
                            >
                                <i className="ph-bold ph-user text-base"></i>
                                <span>Thông Tin Cá Nhân</span>
                            </Link>

                            {/* 2. Tủ Sách Cá Nhân (ACTIVE) */}
                            <Link
                                to="/tusachcn"
                                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-metadata-spec font-bold bg-wine text-white dark:bg-gold dark:text-night-bg shadow-sm transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <i className="ph-bold ph-book-bookmark text-base"></i>
                                    <span>Tủ Sách Cá Nhân</span>
                                </div>
                                <span className="potato-badge text-[11px] py-0 px-2 bg-white/20 text-white border-white/30">{activeBooks.length} cuốn</span>
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

                            {/* 3.5 Nhiệm Vụ Hằng Ngày */}
                            <Link
                                to="/nhiemvu"
                                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-metadata-spec font-bold text-ink-muted dark:text-night-muted hover:bg-paper-200 dark:hover:bg-night-surface hover:text-ink dark:hover:text-night-text transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <i className="ph-bold ph-target text-base text-amber-500"></i>
                                    <span>Nhiệm Vụ Hằng Ngày</span>
                                </div>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold">Streak 🔥</span>
                            </Link>

                            {/* 4. Ví Khoai Tây */}
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

                            {/* 5. Lịch Sử Giao Dịch */}
                            <Link
                                to="/canhan?tab=history"
                                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-metadata-spec font-bold text-ink-muted dark:text-night-muted hover:bg-paper-200 dark:hover:bg-night-surface hover:text-ink dark:hover:text-night-text transition-colors"
                            >
                                <i className="ph-bold ph-clock-counter-clockwise text-base"></i>
                                <span>Lịch Sử Giao Dịch</span>
                            </Link>

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


                    {/* ====================================================
                 NỘI DUNG CHÍNH: QUẢN LÝ TỦ SÁCH CÁ NHÂN
                 ==================================================== */}
                    <div className="flex-1 min-w-0 w-full space-y-8">

                        {/* Page Title & Header Bar */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-paper-border dark:border-night-border">
                            <div>
                                <div className="flex items-center gap-2 text-xs font-metadata-spec text-ink-muted dark:text-night-muted mb-1">
                                    <Link to="/trangchu" className="hover:underline">Trang chủ</Link>
                                    <i className="ph-bold ph-caret-right text-[10px]"></i>
                                    <span>Tủ Sách</span>
                                    <i className="ph-bold ph-caret-right text-[10px]"></i>
                                    <span className="text-wine dark:text-gold font-bold">Không Gian Cá Nhân</span>
                                </div>
                                <h1 className="font-display font-black text-2xl sm:text-3xl text-ink dark:text-night-text tracking-tight flex items-center gap-2.5">
                                    <span>Tủ Sách Của Tôi</span>
                                    <i className="ph-bold ph-book-bookmark text-wine dark:text-gold text-2xl"></i>
                                </h1>
                            </div>

                            {/* Quick Action Button */}
                            <div className="shrink-0 flex items-center gap-2">
                                <Link to="/trangchu#trending-section" className="px-4 py-2.5 rounded-xl bg-wine text-white dark:bg-gold dark:text-night-bg font-metadata-spec font-bold text-xs hover:opacity-90 transition-opacity flex items-center gap-2 shadow-sm">
                                    <i className="ph-bold ph-plus-circle text-base"></i>
                                    <span>Thuê Thêm Sách Mới</span>
                                </Link>
                            </div>
                        </div>


                        {/* ====================================================
                     METRICS SUMMARY BAR (4 CHỈ SỐ TỦ SÁCH)
                     ==================================================== */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div className="rounded-2xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border p-4 shadow-sm text-center">
                                <span className="font-metadata-spec text-[10px] font-bold uppercase text-ink-muted dark:text-night-muted block">Sách Đang Đọc</span>
                                <div className="flex items-center justify-center gap-1.5 mt-1">
                                    <i className="ph-bold ph-book-open text-wine dark:text-gold text-lg"></i>
                                    <span className="font-display font-black text-xl text-ink dark:text-night-text">{activeBooks.length} <span className="text-xs font-normal text-ink-muted">cuốn</span></span>
                                </div>
                            </div>
                            <div className="rounded-2xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border p-4 shadow-sm text-center">
                                <span className="font-metadata-spec text-[10px] font-bold uppercase text-ink-muted dark:text-night-muted block">Đã Đọc Hoàn Thành</span>
                                <div className="flex items-center justify-center gap-1.5 mt-1">
                                    <i className="ph-bold ph-check-circle text-emerald-600 dark:text-emerald-400 text-lg"></i>
                                    <span className="font-display font-black text-xl text-ink dark:text-night-text">{historyBooks.length} <span className="text-xs font-normal text-ink-muted">cuốn</span></span>
                                </div>
                            </div>
                            <div className="rounded-2xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border p-4 shadow-sm text-center">
                                <span className="font-metadata-spec text-[10px] font-bold uppercase text-ink-muted dark:text-night-muted block">Thời Gian Đọc Tuần Này</span>
                                <div className="flex items-center justify-center gap-1.5 mt-1">
                                    <i className="ph-bold ph-timer text-blue-500 text-lg"></i>
                                    <span className="font-display font-black text-xl text-ink dark:text-night-text">8.5 <span className="text-xs font-normal text-ink-muted">giờ</span></span>
                                </div>
                            </div>
                            <div className="rounded-2xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border p-4 shadow-sm text-center">
                                <span className="font-metadata-spec text-[10px] font-bold uppercase text-ink-muted dark:text-night-muted block">Chuỗi Ngày Đọc</span>
                                <div className="flex items-center justify-center gap-1.5 mt-1">
                                    <i className="ph-fill ph-fire text-amber-500 text-lg"></i>
                                    <span className="font-display font-black text-xl text-amber-500">5 <span className="text-xs font-normal text-ink-muted">ngày streak</span></span>
                                </div>
                            </div>
                        </div>


                        {/* ====================================================
                     CATEGORY FILTER TABS (BỘ LỌC DANH MỤC)
                     ==================================================== */}
                        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-paper-border dark:border-night-border text-xs font-metadata-spec font-bold">
                            <button type="button" onClick={() => filterBooks("all")} className={"library-tab px-4 py-2 rounded-xl border border-paper-border dark:border-night-border text-ink dark:text-night-text hover:border-wine dark:hover:border-gold transition-colors whitespace-nowrap " + (activeCategory === "all" ? "active" : "")}>
                                Tất Cả ({bookshelf.length})
                            </button>
                            <button type="button" onClick={() => filterBooks("reading")} className={"library-tab px-4 py-2 rounded-xl border border-wine dark:border-gold whitespace-nowrap shadow-sm " + (activeCategory === 'reading' ? 'active' : '')}>
                                Đang Thuê / Đang Đọc ({activeBooks.length})
                            </button>
                            <button type="button" onClick={() => filterBooks("completed")} className={"library-tab px-4 py-2 rounded-xl border border-paper-border dark:border-night-border text-ink dark:text-night-text hover:border-wine dark:hover:border-gold transition-colors whitespace-nowrap " + (activeCategory === "completed" ? "active" : "")}>
                                Lịch Sử Đã Thuê ({historyBooks.length})
                            </button>
                            <button type="button" onClick={() => filterBooks("favorites")} className={"library-tab px-4 py-2 rounded-xl border border-paper-border dark:border-night-border text-ink dark:text-night-text hover:border-wine dark:hover:border-gold transition-colors whitespace-nowrap " + (activeCategory === "favorites" ? "active" : "")}>
                                Yêu Thích (0)
                            </button>
                            <button type="button" onClick={() => filterBooks("notes")} className={"library-tab px-4 py-2 rounded-xl border border-paper-border dark:border-night-border text-ink dark:text-night-text hover:border-wine dark:hover:border-gold transition-colors whitespace-nowrap " + (activeCategory === "notes" ? "active" : "")}>
                                Ghi Chú AI (0)
                            </button>
                        </div>


                        {/* ====================================================
                     SECTION 1: SÁCH ĐANG ĐỌC & THUÊ (ACTIVE LOANS)
                     ==================================================== */}
                        <div className={"space-y-4 " + (activeCategory === 'completed' ? 'hidden' : '')} id="section-reading">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <span className="w-8 h-8 rounded-xl bg-wine/10 dark:bg-gold/15 text-wine dark:text-gold flex items-center justify-center text-lg">
                                        <i className="ph-bold ph-book-open"></i>
                                    </span>
                                    <h2 className="font-display font-black text-xl text-ink dark:text-night-text">
                                        Sách Đang Đọc & Thuê
                                    </h2>
                                </div>
                                <span className="text-xs font-metadata-spec font-bold text-ink-muted dark:text-night-muted">
                                    Hiển thị {filteredActiveBooks.length} / {activeBooks.length} tựa sách
                                </span>
                            </div>

                            {/* List of horizontal active loan cards */}
                            <div className="space-y-5">
                                {isLoadingBooks ? (
                                    <div className="p-8 rounded-2xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border text-center space-y-3 animate-pulse">
                                        <div className="w-12 h-12 mx-auto rounded-full bg-paper-200 dark:bg-night-border flex items-center justify-center">
                                            <i className="ph-bold ph-spinner animate-spin text-xl text-wine dark:text-gold"></i>
                                        </div>
                                        <div className="font-metadata-spec text-xs text-ink-muted dark:text-night-muted">
                                            Đang đồng bộ tủ sách cá nhân từ HALM Cloud...
                                        </div>
                                    </div>
                                ) : filteredActiveBooks.length === 0 ? (
                                    <div className="p-10 rounded-2xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border text-center space-y-4 shadow-sm">
                                        <div className="w-16 h-16 mx-auto rounded-full bg-wine/10 dark:bg-gold/15 flex items-center justify-center text-wine dark:text-gold text-3xl">
                                            <i className="ph-bold ph-book-open"></i>
                                        </div>
                                        <div>
                                            <h3 className="font-display font-black text-lg text-ink dark:text-night-text">
                                                Tủ sách chưa có tác phẩm đang đọc
                                            </h3>
                                            <p className="font-editorial-body text-xs text-ink-muted dark:text-night-muted max-w-md mx-auto mt-1 leading-relaxed">
                                                Bạn chưa thuê cuốn sách nào hoặc các sách đã hết hạn thuê. Hãy ghé qua thư viện để khám phá và mượn sách bằng Khoai Tây nhé!
                                            </p>
                                        </div>
                                        <Link to="/trangchu#trending-section" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-wine hover:bg-wine-dark text-white dark:bg-gold dark:hover:bg-gold-light dark:text-night-bg font-metadata-spec font-bold text-xs shadow-sm transition-all">
                                            <i className="ph-bold ph-compass"></i>
                                            <span>Khám Phá Sách Ngay</span>
                                        </Link>
                                    </div>
                                ) : (
                                    filteredActiveBooks.map((book) => {
                                        const isForever = book.remainingDays > 1000;
                                        const isExpiringSoon = !isForever && book.remainingDays <= 2;
                                        const coverUrl = book.coverImage
                                            ? (book.coverImage.startsWith('http') || book.coverImage.startsWith('/') ? book.coverImage : `/${book.coverImage}`)
                                            : '/logo.png';

                                        return (
                                            <div key={book.accessId || book.bookId} className="rounded-2xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border p-5 sm:p-6 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row gap-5 lg:gap-6 items-start md:items-center">
                                                {/* Book Cover */}
                                                <div className="relative shrink-0 mx-auto md:mx-0 w-32 sm:w-36 h-48 sm:h-52 rounded-xl overflow-hidden book-cover-elevated bg-paper-200 dark:bg-night-surface">
                                                    <img src={coverUrl} alt={book.bookTitle}
                                                        className="w-full h-full object-cover p-2"
                                                        onError={(event) => handleImageError(event, "/logo.png")} />
                                                    <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-white text-[9px] font-metadata-spec font-black uppercase tracking-wider backdrop-blur-sm ${
                                                        isForever ? 'bg-indigo-600/90' : isExpiringSoon ? 'bg-rose-600/95 animate-pulse' : 'bg-emerald-600/90'
                                                    }`}>
                                                        {isForever ? 'Vĩnh Viễn' : isExpiringSoon ? `Còn ${book.remainingDays} Ngày` : 'Đang Thuê'}
                                                    </span>
                                                </div>

                                                {/* Book Details & Progress */}
                                                <div className="flex-1 w-full space-y-3.5">
                                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                                        <div>
                                                            <span className="font-metadata-spec text-[10px] uppercase font-bold tracking-wider text-wine dark:text-gold">
                                                                {book.categoryName || 'Sách Bản Quyền'}
                                                            </span>
                                                            <h3 className="font-display font-black text-lg sm:text-xl text-ink dark:text-night-text mt-0.5 hover:text-wine dark:hover:text-gold transition-colors cursor-pointer" onClick={() => navigate(`/chitietsach/${book.bookId}`)}>
                                                                {book.bookTitle}
                                                            </h3>
                                                            <p className="font-editorial-body text-xs text-ink-muted dark:text-night-muted mt-0.5">
                                                                Tác giả: <strong className="text-ink dark:text-night-text font-semibold">{book.authorName || 'Đang cập nhật'}</strong>
                                                            </p>
                                                        </div>

                                                        {/* Time Remaining Badge */}
                                                        <div className={`px-3 py-1.5 rounded-xl border text-xs font-metadata-spec font-bold flex items-center gap-1.5 ${
                                                            isForever ? 'bg-indigo-500/10 border-indigo-500/25 text-indigo-600 dark:text-indigo-400' :
                                                            isExpiringSoon ? 'bg-rose-500/10 border-rose-500/25 text-rose-600 dark:text-rose-400' :
                                                            'bg-paper dark:bg-night-surface border-paper-border dark:border-night-border text-ink dark:text-night-text'
                                                        }`}>
                                                            <i className={`ph-bold ${isForever ? 'ph-infinity' : isExpiringSoon ? 'ph-warning' : 'ph-clock'} ${isExpiringSoon ? 'text-rose-500' : 'text-amber-500'}`}></i>
                                                            <span>{isForever ? 'Đọc Vĩnh Viễn' : <>Còn <strong>{book.remainingDays} Ngày</strong> thuê</>}</span>
                                                        </div>
                                                    </div>

                                                    {/* Access & Duration Info */}
                                                    <div className="space-y-1.5 p-3.5 rounded-xl bg-paper dark:bg-night-surface border border-paper-border dark:border-night-border">
                                                        <div className="flex items-center justify-between text-xs font-metadata-spec font-bold">
                                                            <span className="text-ink dark:text-night-text flex items-center gap-1.5">
                                                                <i className="ph-bold ph-calendar-check text-wine dark:text-gold"></i>
                                                                Thời hạn: <strong>{book.startDate ? book.startDate.substring(0, 10) : ''}</strong> → <strong>{isForever ? 'Không giới hạn' : (book.endDate ? book.endDate.substring(0, 10) : '')}</strong>
                                                            </span>
                                                            <span className="text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center gap-1">
                                                                <i className="ph-bold ph-seal-check"></i> Bản quyền hợp lệ
                                                            </span>
                                                        </div>
                                                        {book.renewCount > 0 && (
                                                            <div className="text-[10px] font-metadata-spec text-ink-muted dark:text-night-muted pt-0.5">
                                                                <span>Đã gia hạn: <strong>{book.renewCount}</strong> lần</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Action Buttons Toolbar */}
                                                    <div className="flex flex-wrap items-center gap-2.5 pt-1">
                                                        <button type="button" onClick={() => handleContinueReading(book.bookTitle, book.expired, book.bookId)} className="px-4 py-2 rounded-xl bg-wine hover:bg-wine-dark text-white dark:bg-gold dark:hover:bg-gold-light dark:text-night-bg text-xs font-metadata-spec font-bold transition-all flex items-center gap-1.5 shadow-sm">
                                                            <span>Đọc Tiếp Ngay</span>
                                                            <i className="ph-bold ph-arrow-right"></i>
                                                        </button>

                                                        <button type="button" onClick={() => openRenewModal(book.bookTitle, book.remainingDays, book.bookId)} className="px-3.5 py-2 rounded-xl bg-paper-200 dark:bg-night-surface hover:bg-paper-border dark:hover:bg-night-border text-ink dark:text-night-text border border-paper-border dark:border-night-border text-xs font-metadata-spec font-bold transition-colors flex items-center gap-1.5">
                                                            <i className="ph-bold ph-arrows-clockwise text-wine dark:text-gold"></i>
                                                            <span>Thêm thời gian đọc</span>
                                                        </button>

                                                        <button type="button" onClick={() => openChatbot(`Tóm tắt ý chính của cuốn sách "${book.bookTitle}"`)} className="px-3.5 py-2 rounded-xl bg-paper-200 dark:bg-night-surface hover:bg-paper-border dark:hover:bg-night-border text-ink dark:text-night-text border border-paper-border dark:border-night-border text-xs font-metadata-spec font-bold transition-colors flex items-center gap-1.5">
                                                            <i className="ph-bold ph-sparkle text-gold"></i>
                                                            <span>Hỏi Đáp AI</span>
                                                        </button>

                                                        <Link to={`/chitietsach/${book.bookId}`} className="px-3.5 py-2 rounded-xl text-ink-muted dark:text-night-muted hover:text-ink dark:hover:text-white text-xs font-metadata-spec font-bold transition-colors ml-auto">
                                                            Chi Tiết Sách
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>


                        {/* ====================================================
                     SECTION 2: SÁCH ĐÃ THUÊ & LỊCH SỬ HOÀN THÀNH (HISTORY GRID)
                     ==================================================== */}
                        <div className={"space-y-4 pt-2 " + (activeCategory === 'reading' ? 'hidden' : '')} id="section-completed">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div className="flex items-center gap-2.5">
                                    <span className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center text-lg">
                                        <i className="ph-bold ph-clock-counter-clockwise"></i>
                                    </span>
                                    <div>
                                        <h2 className="font-display font-black text-xl text-ink dark:text-night-text">
                                            Sách Đã Thuê & Hoàn Thành (Lịch Sử)
                                        </h2>
                                    </div>
                                </div>

                                <span className="text-xs font-metadata-spec font-bold text-wine dark:text-gold flex items-center gap-1">
                                    <i className="ph-bold ph-bookmark-simple"></i> Đã có {historyBooks.length} tựa sách trong lịch sử
                                </span>
                            </div>

                            {/* Books Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                                {filteredHistoryBooks.length === 0 ? (
                                    <div className="col-span-full p-8 rounded-2xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border text-center text-xs font-metadata-spec text-ink-muted dark:text-night-muted">
                                        Chưa có sách nào trong lịch sử thuê.
                                    </div>
                                ) : (
                                    filteredHistoryBooks.map((book) => {
                                        const coverUrl = book.coverImage
                                            ? (book.coverImage.startsWith('http') || book.coverImage.startsWith('/') ? book.coverImage : `/${book.coverImage}`)
                                            : '/logo.png';

                                        return (
                                            <div key={book.accessId || book.bookId} className="rounded-2xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border p-4 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between group">
                                                <div>
                                                    <div className="w-full h-52 rounded-xl overflow-hidden bg-paper-200 dark:bg-night-surface book-cover-elevated relative mb-3">
                                                        <img src={coverUrl} alt={book.bookTitle} className="w-full h-full object-cover p-2" onError={(event) => handleImageError(event, "/logo.png")} />
                                                        <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-slate-700/90 text-white text-[9px] font-metadata-spec font-black backdrop-blur-sm">
                                                            {book.expired ? 'Hết hạn thuê' : 'Đã đọc'}
                                                        </span>
                                                    </div>
                                                    <h4 className="font-display font-bold text-sm text-ink dark:text-night-text line-clamp-1 hover:text-wine dark:hover:text-gold cursor-pointer" onClick={() => navigate(`/chitietsach/${book.bookId}`)}>
                                                        {book.bookTitle}
                                                    </h4>
                                                    <p className="font-metadata-spec text-xs text-ink-muted dark:text-night-muted mt-0.5">{book.authorName || 'Tác giả'}</p>
                                                    <div className="text-[10px] font-metadata-spec text-ink-muted dark:text-night-muted mt-2 pt-2 border-t border-paper-border dark:border-night-border flex justify-between">
                                                        <span>Hết hạn: {book.endDate ? book.endDate.substring(0, 10) : '—'}</span>
                                                        <span className="text-amber-600 font-bold">Cần gia hạn</span>
                                                    </div>
                                                </div>

                                                <button type="button" onClick={() => openRenewModal(book.bookTitle, 0, book.bookId)} className="w-full mt-4 py-2 px-3 rounded-xl bg-paper-200 dark:bg-night-surface hover:bg-wine hover:text-white dark:hover:bg-gold dark:hover:text-night-bg text-ink dark:text-night-text border border-paper-border dark:border-night-border text-xs font-metadata-spec font-bold transition-colors flex items-center justify-center gap-1.5">
                                                    <i className="ph-bold ph-arrows-clockwise"></i>
                                                    <span>Thuê Lại (Gia Hạn)</span>
                                                </button>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>


                        {/* ====================================================
                     SECTION 3: TRÍCH DẪN TÂM ĐẮC & GHI CHÚ TRỢ LÝ AI (SMART HIGHLIGHTS)
                     ==================================================== */}
                        <div className="rounded-2xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border p-6 shadow-sm space-y-4">
                            <div className="flex items-center justify-between pb-3 border-b border-paper-border dark:border-night-border">
                                <div className="flex items-center gap-2.5">
                                    <span className="w-8 h-8 rounded-xl bg-gold/15 text-gold flex items-center justify-center text-lg">
                                        <i className="ph-bold ph-quotes"></i>
                                    </span>
                                    <div>
                                        <h3 className="font-display font-black text-lg text-ink dark:text-night-text">
                                            Trích Dẫn Tâm Đắc & Phân Tích Của Trợ Lý AI
                                        </h3>
                                        <p className="font-editorial-body text-xs text-ink-muted dark:text-night-muted">
                                            Những đoạn trích bạn đã bôi vàng khi đọc cùng góc nhìn phân tích chuyên sâu từ AI.
                                        </p>
                                    </div>
                                </div>

                                <button type="button" onClick={() => showToast("Trích Dẫn", "Đã sao chép trích dẫn vào clipboard!")} className="px-3 py-1.5 rounded-xl bg-paper dark:bg-night-surface border border-paper-border dark:border-night-border text-xs font-metadata-spec font-bold text-ink dark:text-night-text hover:text-wine dark:hover:text-gold transition-colors flex items-center gap-1.5">
                                    <i className="ph-bold ph-export"></i>
                                    <span>Xuất Ghi Chú</span>
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                {/* Highlight 1 */}
                                <div className="p-4 rounded-xl bg-paper dark:bg-night-surface border border-paper-border dark:border-night-border space-y-2.5">
                                    <div className="flex items-center justify-between">
                                        <span className="font-metadata-spec text-[10px] font-bold text-wine dark:text-gold">Có Hai Con Mèo Ngồi Bên Cửa Sổ • Trang 42</span>
                                        <i className="ph-bold ph-bookmark-simple text-wine dark:text-gold text-sm"></i>
                                    </div>
                                    <blockquote className="font-editorial-body text-xs text-ink dark:text-night-text italic border-l-2 border-wine dark:border-gold pl-3 leading-relaxed">
                                        "Tình yêu có vị ngọt ngào của tình bạn và vị đắng chát của chia ly... Nhưng ngay cả nỗi buồn cũng đẹp nếu nó xuất phát từ một trái tim chân thành."
                                    </blockquote>
                                    <div className="pt-2 border-t border-paper-border dark:border-night-border flex items-start gap-2 text-[11px] font-editorial-body text-ink-muted dark:text-night-muted">
                                        <i className="ph-bold ph-sparkle text-gold shrink-0 mt-0.5"></i>
                                        <span><strong>Nhận xét AI:</strong> Đoạn trích phản ánh tư tưởng chủ đạo của tác phẩm về lòng trắc ẩn và sự gắn kết thuần khiết giữa muôn loài.</span>
                                    </div>
                                </div>

                                {/* Highlight 2 */}
                                <div className="p-4 rounded-xl bg-paper dark:bg-night-surface border border-paper-border dark:border-night-border space-y-2.5">
                                    <div className="flex items-center justify-between">
                                        <span className="font-metadata-spec text-[10px] font-bold text-blue-600 dark:text-blue-400">Atomic Habits • Trang 78</span>
                                        <i className="ph-bold ph-bookmark-simple text-blue-500 text-sm"></i>
                                    </div>
                                    <blockquote className="font-editorial-body text-xs text-ink dark:text-night-text italic border-l-2 border-blue-500 pl-3 leading-relaxed">
                                        "Bạn không vươn lên tới tầm của các mục tiêu mà bạn đặt ra. Bạn tụt xuống ngang tầm với các hệ thống mà bạn xây dựng."
                                    </blockquote>
                                    <div className="pt-2 border-t border-paper-border dark:border-night-border flex items-start gap-2 text-[11px] font-editorial-body text-ink-muted dark:text-night-muted">
                                        <i className="ph-bold ph-sparkle text-gold shrink-0 mt-0.5"></i>
                                        <span><strong>Nhận xét AI:</strong> Nguyên lý cốt lõi về việc tập trung xây dựng thói quen vi mô thay vì chỉ kỳ vọng vào kết quả cuối cùng.</span>
                                    </div>
                                </div>

                            </div>
                        </div>

                    </div>
                </div>
            </main>


            {/* ========================================================
         MODAL: GIA HẠN THUÊ SÁCH BẰNG KHOAI TÂY
         ======================================================== */}
            <div id="renewModal" onClick={(event) => { if (event.target === event.currentTarget && !isRenewing) closeRenewModal(); }} className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm ${renewBook ? 'flex' : 'hidden'} items-center justify-center p-4`}>
                <div className="bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border rounded-2xl max-w-md w-full p-6 shadow-2xl relative transform transition-all">
                    <button type="button" onClick={closeRenewModal} disabled={isRenewing} className="absolute top-4 right-4 text-ink-muted hover:text-ink dark:hover:text-white p-1 rounded-full hover:bg-paper-200 dark:hover:bg-night-border transition-colors">
                        <i className="ph-bold ph-x text-lg"></i>
                    </button>

                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-wine/10 dark:bg-gold/20 text-wine dark:text-gold flex items-center justify-center text-xl">
                            <i className="ph-bold ph-arrows-clockwise"></i>
                        </div>
                        <div>
                            <h3 className="font-display font-black text-lg text-ink dark:text-night-text">Gia Hạn Thuê Sách</h3>
                            <p className="font-metadata-spec text-xs text-ink-muted dark:text-night-muted" id="renew-book-name">
                                {renewBook ? `${renewBook.title} (${renewBook.remainingDays <= 0 ? 'Đã hết hạn thuê • Còn 0 ngày' : `Hiện còn ${renewBook.remainingDays} ngày thuê`})` : 'Tác phẩm'}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-3 py-2 font-metadata-spec text-xs">
                        <p className="font-editorial-body text-xs text-ink-muted dark:text-night-muted">
                            Chọn gói thời gian gia hạn thêm cho tựa sách này. Khoai sẽ được trừ trực tiếp từ số dư ví:
                        </p>

                        {/* Plan 1 */}
                        <label className={`flex items-center justify-between p-3.5 rounded-xl cursor-pointer transition-colors ${selectedPlan === '7' ? 'border-2 border-wine dark:border-gold bg-wine/5 dark:bg-gold/10' : 'border border-paper-border dark:border-night-border hover:border-wine dark:hover:border-gold bg-paper dark:bg-night-surface'}`}>
                            <div className="flex items-center gap-3">
                                <input type="radio" name="renew-plan" value="7" checked={selectedPlan === '7'} onChange={(event) => setSelectedPlan(event.target.value)} className="text-wine focus:ring-wine" />
                                <div>
                                    <div className="font-bold text-ink dark:text-night-text">Gia Hạn +7 Ngày</div>
                                    <div className="text-[10px] text-ink-muted dark:text-night-muted">Thêm 1 tuần thảnh thơi đọc tiếp</div>
                                </div>
                            </div>
                            <span className="font-black text-gold text-sm">9 Khoai 🥔</span>
                        </label>

                        {/* Plan 2 */}
                        <label className={`flex items-center justify-between p-3.5 rounded-xl cursor-pointer transition-colors ${selectedPlan === '14' ? 'border-2 border-wine dark:border-gold bg-wine/5 dark:bg-gold/10' : 'border border-paper-border dark:border-night-border hover:border-wine dark:hover:border-gold bg-paper dark:bg-night-surface'}`}>
                            <div className="flex items-center gap-3">
                                <input type="radio" name="renew-plan" value="14" checked={selectedPlan === '14'} onChange={(event) => setSelectedPlan(event.target.value)} className="text-wine focus:ring-wine" />
                                <div>
                                    <div className="font-bold text-ink dark:text-night-text">Gia Hạn +14 Ngày</div>
                                    <div className="text-[10px] text-ink-muted dark:text-night-muted">Tiết kiệm chi phí đọc trung hạn</div>
                                </div>
                            </div>
                            <span className="font-black text-gold text-sm">15 Khoai 🥔</span>
                        </label>

                        {/* Plan 3 */}
                        <label className={`flex items-center justify-between p-3.5 rounded-xl cursor-pointer transition-colors ${selectedPlan === '30' ? 'border-2 border-wine dark:border-gold bg-wine/5 dark:bg-gold/10' : 'border border-paper-border dark:border-night-border hover:border-wine dark:hover:border-gold bg-paper dark:bg-night-surface'}`}>
                            <div className="flex items-center gap-3">
                                <input type="radio" name="renew-plan" value="30" checked={selectedPlan === '30'} onChange={(event) => setSelectedPlan(event.target.value)} className="text-wine focus:ring-wine" />
                                <div>
                                    <div className="font-bold text-ink dark:text-night-text">Gia Hạn +30 Ngày (Trọn Tháng)</div>
                                    <div className="text-[10px] text-ink-muted dark:text-night-muted">Gói đọc chậm rãi trọn vẹn 1 tháng</div>
                                </div>
                            </div>
                            <span className="font-black text-gold text-sm">25 Khoai 🥔</span>
                        </label>

                        <div className="flex justify-between items-center pt-2 text-[11px] text-ink-muted dark:text-night-muted">
                            <span>Số dư hiện tại: <strong className="text-gold font-bold">{potatoBalance.toLocaleString()} Khoai 🥔</strong></span>
                            {potatoBalance >= (RENEW_PRICING[selectedPlan] || 9) ? (
                                <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                                    <i className="ph-bold ph-check-circle"></i> Đủ điều kiện đổi
                                </span>
                            ) : (
                                <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1">
                                    <i className="ph-bold ph-warning-circle"></i> Thiếu Khoai (
                                    <Link to="/canhan?tab=wallet" className="underline hover:text-wine dark:hover:text-gold">Nạp ngay</Link>
                                    )
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-paper-border dark:border-night-border flex items-center justify-end gap-3 font-metadata-spec text-xs">
                        <button type="button" onClick={closeRenewModal} disabled={isRenewing} className="px-4 py-2 rounded-xl bg-paper-200 dark:bg-night-surface text-ink dark:text-night-text hover:bg-paper-border font-bold transition-colors">
                            Hủy Bỏ
                        </button>
                        <button
                            type="button"
                            onClick={confirmRenew}
                            disabled={isRenewing || potatoBalance < (RENEW_PRICING[selectedPlan] || 9)}
                            className={`px-4 py-2 rounded-xl font-black transition-opacity flex items-center gap-2 ${
                                isRenewing || potatoBalance < (RENEW_PRICING[selectedPlan] || 9)
                                    ? 'bg-ink-muted/30 text-ink-muted cursor-not-allowed opacity-60'
                                    : 'bg-wine text-white dark:bg-gold dark:text-night-bg hover:opacity-90 shadow-sm'
                            }`}
                        >
                            {isRenewing && <i className="ph-bold ph-spinner animate-spin text-sm"></i>}
                            <span>{isRenewing ? 'Đang Xử Lý...' : 'Xác Nhận Đổi Khoai'}</span>
                        </button>
                    </div>
                </div>
            </div>


            {/* ========================================================
         MODAL: THÔNG BÁO CẦN GIA HẠN KHI HẾT HẠN THUÊ SÁCH
         ======================================================== */}
            <div id="expiredWarningModal" onClick={(event) => { if (event.target === event.currentTarget) closeExpiredModal(); }} className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm ${expiredBook ? 'flex' : 'hidden'} items-center justify-center p-4`}>
                <div className="bg-paper-surface dark:bg-night-card border border-rose-500/30 dark:border-rose-500/40 rounded-2xl max-w-md w-full p-6 shadow-2xl relative transform transition-all text-center">
                    <button type="button" onClick={closeExpiredModal} className="absolute top-4 right-4 text-ink-muted hover:text-ink dark:hover:text-white p-1 rounded-full hover:bg-paper-200 dark:hover:bg-night-border transition-colors">
                        <i className="ph-bold ph-x text-lg"></i>
                    </button>

                    <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center text-3xl mb-3.5">
                        <i className="ph-bold ph-clock-countdown"></i>
                    </div>

                    <h3 className="font-display font-black text-lg text-ink dark:text-night-text mb-1.5">
                        Cần Gia Hạn Thuê Sách
                    </h3>
                    <p className="font-editorial-body text-xs text-ink-muted dark:text-night-muted leading-relaxed mb-5">
                        Tác phẩm <strong className="text-ink dark:text-night-text" id="expired-book-name">{expiredBook?.title || 'Sách'}</strong> hiện đã hết hạn thuê (còn 0 ngày). Bạn cần gia hạn thêm thời gian trước khi muốn tiếp tục hành trình đọc sách.
                    </p>

                    <div className="flex items-center justify-center gap-3 font-metadata-spec text-xs">
                        <button type="button" onClick={closeExpiredModal} className="w-1/2 py-2.5 rounded-xl bg-paper-200 dark:bg-night-surface text-ink dark:text-night-text hover:bg-paper-border dark:hover:bg-night-border font-bold transition-colors">
                            Để Sau
                        </button>
                        <button type="button" onClick={proceedToRenewFromExpired} className="w-1/2 py-2.5 rounded-xl bg-wine text-white dark:bg-gold dark:text-night-bg font-black hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5 shadow-sm">
                            <i className="ph-bold ph-arrows-clockwise"></i>
                            <span>Gia Hạn Ngay</span>
                        </button>
                    </div>
                </div>
            </div>


            {/* Floating Chatbot AI Widget */}
            <div id="chatbot-container">
                {/* Floating Chat Modal Window */}
                <div id="chat-window" className={isChatOpen ? 'show' : ''}>
                    {/* Modal Header */}
                    <div className="bg-gradient-to-r from-wine to-wine-light text-white px-5 py-3.5 flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-white p-0.5 shrink-0">
                                <img src="/logo.png" alt="Bot" className="w-full h-full rounded-full object-cover" />
                            </div>
                            <div>
                                <div className="font-display font-bold text-sm tracking-wide leading-tight">Trợ lý ảo HALM BOOK</div>
                                <div className="font-metadata-spec text-[10px] text-gold font-medium">Hỗ trợ đọc sách & tóm tắt AI</div>
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

                    {/* Body Message Thread */}
                    <div className="flex-grow overflow-y-auto p-4 flex flex-col relative text-night-text bg-[#181916] text-xs space-y-3" id="chat-body">
                        {/* Welcome View */}
                        <div id="chat-welcome" className={`text-center py-5 space-y-3 ${messages.length ? 'hidden' : ''}`}>
                            <div className="w-12 h-12 mx-auto rounded-full bg-wine/20 border border-wine/40 p-1 flex items-center justify-center">
                                <img src="/logo.png" alt="Bot" className="w-full h-full rounded-full object-cover" />
                            </div>
                            <h4 className="font-display font-black text-sm text-white">Xin chào Alex Nguyễn!</h4>
                            <p className="font-editorial-body text-xs text-night-muted leading-relaxed">
                                Tôi là trợ lý AI của bạn. Bạn muốn tóm tắt ý chính của cuốn sách nào trong tủ sách của mình?
                            </p>

                            {/* Suggestions buttons */}
                            <div className="space-y-2 pt-1 text-left font-metadata-spec">
                                <button type="button" onClick={() => sendMessage('Tóm tắt tiến độ cuốn "Có Hai Con Mèo"?')} className="suggestion-btn w-full p-2.5 rounded-xl bg-night-card hover:bg-night-border border border-night-border text-xs text-white flex items-center justify-between transition-colors">
                                    <span>Tóm tắt tiến độ cuốn "Có Hai Con Mèo"?</span>
                                    <i className="ph-bold ph-arrow-right text-gold"></i>
                                </button>
                                <button type="button" onClick={() => sendMessage('Cách gia hạn sách khi sắp hết hạn?')} className="suggestion-btn w-full p-2.5 rounded-xl bg-night-card hover:bg-night-border border border-night-border text-xs text-white flex items-center justify-between transition-colors">
                                    <span>Cách gia hạn sách khi sắp hết hạn?</span>
                                    <i className="ph-bold ph-arrow-right text-gold"></i>
                                </button>
                                <button type="button" onClick={() => sendMessage('Làm sao để gia hạn thêm thời gian đọc bằng Khoai?')} className="suggestion-btn w-full p-2.5 rounded-xl bg-night-card hover:bg-night-border border border-night-border text-xs text-white flex items-center justify-between transition-colors">
                                    <span>Làm sao để gia hạn thêm thời gian đọc bằng Khoai?</span>
                                    <i className="ph-bold ph-arrow-right text-gold"></i>
                                </button>
                            </div>
                        </div>

                        {/* Message List (Appended dynamically) */}
                        <div id="chat-messages" className={`flex-col gap-3 ${messages.length ? 'flex' : 'hidden'}`}>{messages.map((message) => <div key={message.id} className={message.sender === 'user' ? 'self-end bg-wine text-white max-w-[80%] rounded-2xl rounded-tr-sm px-3.5 py-2 text-xs font-metadata-spec' : 'self-start bg-night-card border border-night-border text-night-text max-w-[85%] rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-xs font-editorial-body'}>{message.content}</div>)}<div ref={messagesEndRef} /></div>
                    </div>

                    {/* Input Box */}
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

                {/* Floating Chat Launch Button */}
                <button id="chat-toggle-btn" onClick={() => setIsChatOpen((open) => !open)} className="w-14 h-14 rounded-full bg-wine hover:bg-wine-dark text-white p-1 shadow-2xl flex items-center justify-center transition-transform hover:scale-105" aria-label="Mở trợ lý ảo AI">
                    <img src="/logo.png" alt="Chatbot" className="w-full h-full rounded-full object-cover" />
                </button>
            </div>

        </UserLayout></>;
}
