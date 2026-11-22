import { useMissionVisit } from '@/hooks/useMissionTracking';
import { myBooksTailwindConfig, inlinePageStyle1 } from './styles/TuSachCn.styles.js';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import UserLayout from './layout/UserLayout';
import { isDarkMode, applyTheme } from '@/utils/theme';
import { getCurrentCustomer } from '@/services/customerService';
import { getCustomerBookshelf, checkoutWithPotato } from '@/services/orderService';
import { formatCustomerId, getTierInfo, getTierBadgeClass } from '@/utils/tierUtils';
import AvatarWithFrame from '@/components/common/AvatarWithFrame';
import { getPersonalBooksMetadata, deletePersonalBook } from '@/services/personalBookService';
import { getFavoriteBooks, removeFavorite, returnRentedBook, getGiftsSent, getGiftsReceived } from '@/services/userFeatureService';
import { logoutUser } from '@/services/authToken';
import { confirmDialog } from '@/components/common/CustomConfirmModal';
import { prefetchUserRoutes } from '@/utils/routePrefetch';

const ASSETS = { fonts: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Open+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400;1,600&family=Roboto:wght@300;400;500;700;900&display=swap', bold: 'https://unpkg.com/@phosphor-icons/web@2.1.1/src/bold/style.css', regular: 'https://unpkg.com/@phosphor-icons/web@2.1.1/src/regular/style.css', fill: 'https://unpkg.com/@phosphor-icons/web@2.1.1/src/fill/style.css', duotone: 'https://unpkg.com/@phosphor-icons/web@2.1.1/src/duotone/style.css', tailwind: 'https://cdn.tailwindcss.com' };
function createStars() { return Array.from({ length: 25 }, (_, id) => ({ id, size: Math.random() * 2.5 + .5, top: Math.random() * 100, left: Math.random() * 100, duration: Math.random() * 3 + 2, delay: Math.random() * 3 })); }
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
const CURATED_AI_QUOTES = [
    {
        book: "Có Hai Con Mèo Ngồi Bên Cửa Sổ",
        page: "Trang 42",
        quote: "Tình yêu có vị ngọt ngào của tình bạn và vị đắng chát của chia ly... Nhưng ngay cả nỗi buồn cũng đẹp nếu nó xuất phát từ một trái tim chân thành.",
        insight: "Đoạn trích phản ánh tư tưởng chủ đạo của tác phẩm về lòng trắc ẩn và sự gắn kết thuần khiết giữa muôn loài.",
        color: "text-wine dark:text-gold",
        borderColor: "border-wine dark:border-gold",
        iconColor: "text-wine dark:text-gold"
    },
    {
        book: "Atomic Habits",
        page: "Trang 78",
        quote: "Bạn không vươn lên tới tầm của các mục tiêu mà bạn đặt ra. Bạn tụt xuống ngang tầm với các hệ thống mà bạn xây dựng.",
        insight: "Nguyên lý cốt lõi về việc tập trung xây dựng thói quen vi mô thay vì chỉ kỳ vọng vào kết quả cuối cùng.",
        color: "text-blue-600 dark:text-blue-400",
        borderColor: "border-blue-500",
        iconColor: "text-blue-500"
    },
    {
        book: "Nhà Giả Kim",
        page: "Trang 104",
        quote: "Khi bạn khao khát một điều gì đó, cả vũ trụ sẽ hợp lực giúp bạn đạt được điều đó.",
        insight: "Sức mạnh của trực giác và đức tin vào vận mệnh cá nhân khi con người dám dấn thân theo đuổi ước mơ.",
        color: "text-amber-600 dark:text-amber-400",
        borderColor: "border-amber-500",
        iconColor: "text-amber-500"
    },
    {
        book: "Hoàng Tử Bé",
        page: "Trang 65",
        quote: "Người ta chỉ nhìn thấy thật rõ ràng bằng trái tim. Những điều cốt yếu thì mắt trần không thể thấy được.",
        insight: "Bài học triết học về tình yêu thương, sự gắn kết trách nhiệm và những giá trị vô hình nuôi dưỡng tâm hồn con người.",
        color: "text-emerald-600 dark:text-emerald-400",
        borderColor: "border-emerald-500",
        iconColor: "text-emerald-500"
    },
    {
        book: "Muôn Kiếp Nhân Sinh",
        page: "Trang 156",
        quote: "Nhân quả đừng đợi kiếp sau mới thấy, nó đang vận hành trong từng suy nghĩ, lời nói và hành động của bạn mỗi ngày.",
        insight: "Quy luật bảo toàn năng lượng tâm linh và trách nhiệm của mỗi cá nhân trước mọi rung động ý thức của chính mình.",
        color: "text-purple-600 dark:text-purple-400",
        borderColor: "border-purple-500",
        iconColor: "text-purple-500"
    },
    {
        book: "Tư Duy Nhanh Và Chậm",
        page: "Trang 112",
        quote: "Ảo tưởng rằng ta hiểu được quá khứ nuôi dưỡng sự tự tin thái quá vào khả năng tiên đoán tương lai của chúng ta.",
        insight: "Cảnh báo sâu sắc của Daniel Kahneman về thiên kiến nhận thức và sự cần thiết của tư duy phản biện cởi mở.",
        color: "text-rose-600 dark:text-rose-400",
        borderColor: "border-rose-500",
        iconColor: "text-rose-500"
    },
    {
        book: "Cây Cam Ngọt Của Tôi",
        page: "Trang 89",
        quote: "Tại sao người ta lại phải giải thích mọi chuyện cho lũ trẻ con biết cơ chứ? Sự thật là người ta thích làm cho mọi thứ trở nên phức tạp.",
        insight: "Tâm hồn trong trẻo, dễ tổn thương của tuổi thơ và nỗi khao khát được lắng nghe, thấu cảm bằng sự chân thành nguyên sơ.",
        color: "text-orange-600 dark:text-orange-400",
        borderColor: "border-orange-500",
        iconColor: "text-orange-500"
    },
    {
        book: "Đắc Nhân Tâm",
        page: "Trang 54",
        quote: "Hãy khen ngợi sự tiến bộ dù là nhỏ nhất của người khác. Sự chân thành trong lời khen sẽ chắp cánh cho tiềm năng nở rộ.",
        insight: "Nghệ thuật thấu hiểu và khích lệ tâm lý con người: tôn trọng giá trị tự thân của đối phương để kiến tạo sự tin cậy lâu dài.",
        color: "text-teal-600 dark:text-teal-400",
        borderColor: "border-teal-500",
        iconColor: "text-teal-500"
    }
];

export default function MyBooks() {
    useMissionVisit('BOOKSHELF');
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const tabParam = searchParams.get('tab');
    const initialCategory = ['personal', 'gifts', 'favorites', 'completed', 'all'].includes(tabParam) ? tabParam : 'reading';
    const [isDark, setIsDark] = useState(() => isDarkMode());
    const [stars, setStars] = useState([]);
    const [toast, setToast] = useState({ title: "Tủ Sách HALM BOOK", message: "Đã cập nhật trạng thái tủ sách." });
    const [toastVisible, setToastVisible] = useState(false);
    const [activeCategory, setActiveCategory] = useState(initialCategory);
    const [renewBook, setRenewBook] = useState(null);
    const [expiredBook, setExpiredBook] = useState(null);
    const [returnModalBook, setReturnModalBook] = useState(null);
    const [isReturningBook, setIsReturningBook] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState('7');
    const [searchQuery, setSearchQuery] = useState('');

    // Dữ liệu khách hàng & tủ sách từ Backend
    const [customer, setCustomer] = useState(null);
    const [bookshelf, setBookshelf] = useState([]);
    const [personalBooks, setPersonalBooks] = useState(() => getPersonalBooksMetadata());
    const [favoriteBooks, setFavoriteBooks] = useState([]);
    const [giftsSent, setGiftsSent] = useState([]);
    const [giftsReceived, setGiftsReceived] = useState([]);
    const [giftSubTab, setGiftSubTab] = useState('received'); // 'received' | 'sent'
    const [isLoadingBooks, setIsLoadingBooks] = useState(true);
    const [isRenewing, setIsRenewing] = useState(false);

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
        const isExpired = b.status === 'EXPIRED' || b.status === 'RETURNED' || b.status === 'REVOKED' || (!isForever && remDays <= 0 && b.endDate && new Date(b.endDate) <= new Date());
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
            status: b.status || (isExpired ? 'EXPIRED' : 'ACTIVE')
        };
    };

    const fetchBookshelf = async () => {
        try {
            // Ghi nhận hoàn thành nhiệm vụ hằng ngày: Kiểm tra tủ sách
            const todayKey = new Date().toISOString().slice(0, 10);
            try {
                localStorage.setItem(`halm_daily_action_bookshelf_${todayKey}`, 'true');
            } catch {}
            window.dispatchEvent(new CustomEvent('halm-daily-task-completed', { detail: { task: 'bookshelf' } }));

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

    const fetchFavorites = async () => {
        try {
            const favs = await getFavoriteBooks();
            setFavoriteBooks(favs);
        } catch (e) {
            console.error("Lỗi khi tải sách yêu thích:", e);
        }
    };

    const fetchGifts = async () => {
        try {
            const [sent, recv] = await Promise.allSettled([getGiftsSent(), getGiftsReceived()]);
            if (sent.status === 'fulfilled' && Array.isArray(sent.value)) setGiftsSent(sent.value);
            if (recv.status === 'fulfilled' && Array.isArray(recv.value)) setGiftsReceived(recv.value);
        } catch (e) {
            console.error("Lỗi khi tải quà tặng sách:", e);
        }
    };

    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab && ['personal', 'gifts', 'favorites', 'completed', 'all', 'reading'].includes(tab)) {
            setActiveCategory(tab);
        }
    }, [searchParams]);

    const handleRemoveFavorite = async (bookId, title) => {
        try {
            await removeFavorite(bookId);
            setFavoriteBooks(prev => prev.filter(f => f.bookId !== bookId));
            window.dispatchEvent(new CustomEvent('halm-favorites-updated', { detail: { bookId, isFavorite: false } }));
            showToast("Tủ Sách Yêu Thích", `Đã xóa "${title}" khỏi danh sách yêu thích.`);
        } catch {
            showToast("Lỗi", "Không thể xóa sách khỏi danh sách yêu thích!");
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

        prefetchUserRoutes();
        fetchCustomer();
        fetchBookshelf();
        fetchFavorites();
        fetchGifts();

        const handlePageShow = () => {
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.width = '';
            document.body.style.height = '';
            document.documentElement.style.overflow = '';
            document.documentElement.style.height = '';
            fetchCustomer();
            fetchBookshelf();
            fetchFavorites();
            fetchGifts();
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
            fetchGifts();
            setPersonalBooks(getPersonalBooksMetadata());
        };
        const handlePotatoUpdated = (e) => {
            const newBal = e.detail?.potatoBalance;
            if (newBal !== undefined) {
                setCustomer(prev => prev ? { ...prev, potatoBalance: newBal } : prev);
            }
        };

        const handleFavoritesUpdated = () => {
            fetchFavorites();
        };

        window.addEventListener('halm-theme-change', handleGlobalThemeChange);
        window.addEventListener('halm-bookshelf-updated', handleBookshelfUpdated);
        window.addEventListener('halm-personal-book-added', handleBookshelfUpdated);
        window.addEventListener('halm-potato-updated', handlePotatoUpdated);
        window.addEventListener('halm-favorites-updated', handleFavoritesUpdated);

        return () => {
            window.removeEventListener('halm-theme-change', handleGlobalThemeChange);
            window.removeEventListener('halm-bookshelf-updated', handleBookshelfUpdated);
            window.removeEventListener('halm-personal-book-added', handleBookshelfUpdated);
            window.removeEventListener('halm-potato-updated', handlePotatoUpdated);
            window.removeEventListener('halm-favorites-updated', handleFavoritesUpdated);
        };
    }, []);
    useEffect(() => { if (isDark && !starsInitialized.current) { starsInitialized.current = true; setStars(createStars()); } }, [isDark]);
    useEffect(() => { document.title = "HALM BOOK — Tủ Sách Của Tôi & Không Gian Đọc Cá Nhân"; let d = document.querySelector('meta[name="description"]'); if (!d) { d = document.createElement('meta'); d.name = 'description'; document.head.appendChild(d); } d.content = "Quản lý tủ sách cá nhân HALM BOOK: Sách đang thuê, tiến trình đọc số, gia hạn bằng Khoai và lịch sử đọc sách bản quyền."; }, []);
    useEffect(() => () => { if (toastTimer.current) window.clearTimeout(toastTimer.current); }, []);
    useEffect(() => { if (!document.querySelector('link[data-my-books-fonts]')) { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = ASSETS.fonts; l.dataset.myBooksFonts = 'true'; document.head.appendChild(l); } Object.entries({ bold: ASSETS.bold, regular: ASSETS.regular, fill: ASSETS.fill, duotone: ASSETS.duotone }).forEach(([k, href]) => { if (document.querySelector(`link[data-my-books-icons="${k}"]`)) return; const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href; l.dataset.myBooksIcons = k; document.head.appendChild(l); }); window.tailwind = window.tailwind || {}; window.tailwind.config = myBooksTailwindConfig; if (!document.querySelector('script[src*="cdn.tailwindcss.com"]')) { const s = document.createElement('script'); s.src = ASSETS.tailwind; s.async = true; document.head.appendChild(s); } }, []);
    // Xoay vòng trích dẫn AI theo ngày (Daily Rotation) + Đổi gợi ý
    const [quoteOffset, setQuoteOffset] = useState(() => {
        const today = new Date();
        const dayNumber = Math.floor(today.getTime() / (1000 * 60 * 60 * 24));
        return (dayNumber * 2) % CURATED_AI_QUOTES.length;
    });

    const currentQuotes = useMemo(() => {
        const q1 = CURATED_AI_QUOTES[quoteOffset % CURATED_AI_QUOTES.length];
        const q2 = CURATED_AI_QUOTES[(quoteOffset + 1) % CURATED_AI_QUOTES.length];
        return [q1, q2];
    }, [quoteOffset]);

    const handleRefreshQuotes = () => {
        setQuoteOffset(prev => (prev + 2) % CURATED_AI_QUOTES.length);
        if (window.halmToast) window.halmToast.info("Gợi Ý AI", "Đã cập nhật góc nhìn & trích dẫn mới!");
    };

    const handleExportNotes = () => {
        const textToCopy = currentQuotes.map(q => 
            `📖 [${q.book} • ${q.page}]\n"${q.quote}"\n✨ Nhận xét AI: ${q.insight}`
        ).join("\n\n---\n\n");
        
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(textToCopy).then(() => {
                if (window.halmToast) window.halmToast.success("Xuất Ghi Chú", "Đã sao chép các trích dẫn & phân tích AI vào bộ nhớ tạm!");
            }).catch(() => {
                if (window.halmToast) window.halmToast.info("Xuất Ghi Chú", "Đã sao chép ghi chú vào clipboard!");
            });
        } else {
            if (window.halmToast) window.halmToast.info("Xuất Ghi Chú", "Đã sao chép ghi chú vào clipboard!");
        }
    };

    const showToast = (title, message, type = 'info') => {
        if (window.halmToast) {
            const lower = (title || '').toLowerCase();
            if (type === 'success' || lower.includes('thành công') || lower.includes('đã xóa') || lower.includes('sao chép')) {
                window.halmToast.success(title, message);
            } else if (type === 'error' || lower.includes('thất bại') || lower.includes('lỗi')) {
                window.halmToast.error(title, message);
            } else {
                window.halmToast.info(title, message);
            }
        }
    };
    const filterBooks = category => {
        setActiveCategory(category);
        setCurrentPage(1);
        setCurrentHistoryPage(1);
        if (category === 'favorites' || category === 'notes' || category === 'gifts') {
            const mapName = { favorites: 'Yeu Thich', notes: 'Ghi Chu AI', gifts: 'Qua Tang Sach' };
            showToast('Bộ Lọc Tủ Sách', `Đang hiển thị mục: ${mapName[category] || category}`);
            return;
        }
    };
    const openRenewModal = (title, remainingDays, bookId) => { setSelectedPlan('7'); setRenewBook({ title, remainingDays, bookId }); };
    const closeRenewModal = () => setRenewBook(null);
    const closeExpiredModal = () => setExpiredBook(null);
    const handleDeletePersonalBook = async (id, title) => {
        const confirmed = await confirmDialog({
            title: 'Xóa Sách Cá Nhân',
            message: `Bạn có chắc chắn muốn xóa cuốn sách "${title}" khỏi tủ sách cá nhân không?`,
            confirmText: 'Xóa sách',
            cancelText: 'Hủy bỏ',
            type: 'danger',
        });
        if (confirmed) {
            const success = await deletePersonalBook(id);
            if (success) {
                setPersonalBooks(getPersonalBooksMetadata());
                showToast("Tủ Sách Cá Nhân", `Đã xóa "${title}" thành công.`);
            }
        }
    };

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
            const renewPrice = RENEW_PRICING[selectedPlan] || 9;
            const res = await checkoutWithPotato({
                items: [{
                    bookId: renewBook.bookId,
                    planKey: String(selectedPlan),
                    durationDays: Number(selectedPlan),
                    price: renewPrice
                }],
                paymentMethod: 'POTATO_WALLET'
            });
            closeRenewModal();
            showToast("Gia Hạn Thành Công!", `Đã gia hạn thêm +${selectedPlan} ngày cho cuốn "${renewBook.title}". Số dư Khoai: ${res.remainingPotatoBalance} 🥔`);
            await fetchBookshelf();
            if (customer) {
                setCustomer(prev => prev ? { ...prev, potatoBalance: res.remainingPotatoBalance } : prev);
            }
            window.dispatchEvent(new CustomEvent('halm-potato-updated', {
                detail: { potatoBalance: res.remainingPotatoBalance }
            }));
            window.dispatchEvent(new CustomEvent('halm-bookshelf-updated'));
        } catch (error) {
            console.error("Lỗi khi gia hạn sách:", error);
            const msg = error.response?.data?.message || "Không thể gia hạn sách. Vui lòng kiểm tra lại số dư Khoai!";
            showToast("Gia Hạn Thất Bại", msg);
        } finally {
            setIsRenewing(false);
        }
    };
    const openChatbot = text => {
        window.dispatchEvent(new CustomEvent('halm-open-chatbot', { detail: { message: text || 'Xin chào, tôi cần tư vấn về tủ sách!' } }));
    };

    const handleConfirmReturnBook = async () => {
        if (!returnModalBook || isReturningBook) return;
        const targetId = returnModalBook.bookId || returnModalBook.accessId;
        if (!targetId) {
            showToast("Lỗi", "Không xác định được mã sách cần trả!", "error");
            return;
        }
        try {
            setIsReturningBook(true);
            const res = await returnRentedBook(targetId);
            showToast("Trả Sách Thành Công", res?.message || `Đã hoàn trả tác phẩm "${returnModalBook.bookTitle}" về thư viện.`, "success");

            // Cập nhật ngay tại chỗ trên state bookshelf để UI phản hồi tức thì
            const returnedBookId = returnModalBook.bookId;
            const returnedAccessId = returnModalBook.accessId;
            setBookshelf(prev => prev.map(b => {
                const matchBook = returnedBookId && b.bookId === returnedBookId;
                const matchAccess = returnedAccessId && b.accessId === returnedAccessId;
                if (matchBook || matchAccess) {
                    return { ...b, status: 'RETURNED', expired: true, remainingDays: 0 };
                }
                return b;
            }));

            setReturnModalBook(null);

            // Bắn event toàn cục để Header và các trang khác cập nhật
            window.dispatchEvent(new CustomEvent('halm-bookshelf-updated'));

            // Tải lại toàn bộ dữ liệu mới nhất từ server
            await fetchBookshelf();
        } catch (err) {
            console.error("Lỗi khi trả sách:", err);
            const msg = err.response?.data?.message || err.message || "Không thể trả sách vào lúc này. Vui lòng thử lại sau.";
            showToast("Lỗi Trả Sách", msg, "error");
        } finally {
            setIsReturningBook(false);
        }
    };

    // Phân loại danh sách sách
    const activeBooks = bookshelf.filter(b => !b.expired && b.status !== 'RETURNED' && b.status !== 'REVOKED' && (b.remainingDays > 0 || b.isForever));
    const historyBooks = bookshelf.filter(b => b.expired || b.status === 'RETURNED' || b.status === 'REVOKED' || (b.remainingDays <= 0 && !b.isForever));

    const normalizeSearchStr = (str) => String(str || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

    const matchesSearch = (b, query) => {
        if (!query) return true;
        const normQ = normalizeSearchStr(query);
        const titleNorm = normalizeSearchStr(b.bookTitle || b.bookName || '');
        const authorNorm = normalizeSearchStr(b.authorName || b.author || '');
        const catNorm = normalizeSearchStr(b.categoryName || b.category || '');
        return titleNorm.includes(normQ) || authorNorm.includes(normQ) || catNorm.includes(normQ);
    };

    const filteredActiveBooks = activeBooks.filter(b => matchesSearch(b, searchQuery));
    const filteredHistoryBooks = historyBooks.filter(b => matchesSearch(b, searchQuery));
    const filteredPersonalBooks = personalBooks.filter(b => {
        if (!searchQuery) return true;
        const normQ = normalizeSearchStr(searchQuery);
        const titleNorm = normalizeSearchStr(b.title || '');
        const authorNorm = normalizeSearchStr(b.author || '');
        const catNorm = normalizeSearchStr(b.category || '');
        return titleNorm.includes(normQ) || authorNorm.includes(normQ) || catNorm.includes(normQ);
    });

    const filteredGiftsReceived = giftsReceived.filter(g => {
        if (!searchQuery) return true;
        const normQ = normalizeSearchStr(searchQuery);
        const titleNorm = normalizeSearchStr(g.bookTitle || '');
        const senderNorm = normalizeSearchStr(g.senderName || '');
        const authorNorm = normalizeSearchStr(g.bookAuthor || '');
        const msgNorm = normalizeSearchStr(g.message || '');
        return titleNorm.includes(normQ) || senderNorm.includes(normQ) || authorNorm.includes(normQ) || msgNorm.includes(normQ);
    });

    const filteredGiftsSent = giftsSent.filter(g => {
        if (!searchQuery) return true;
        const normQ = normalizeSearchStr(searchQuery);
        const titleNorm = normalizeSearchStr(g.bookTitle || '');
        const receiverNorm = normalizeSearchStr(g.receiverName || '');
        const authorNorm = normalizeSearchStr(g.bookAuthor || '');
        const msgNorm = normalizeSearchStr(g.message || '');
        return titleNorm.includes(normQ) || receiverNorm.includes(normQ) || authorNorm.includes(normQ) || msgNorm.includes(normQ);
    });

    // Phân trang 3 sách / trang theo yêu cầu
    const BOOKS_PER_PAGE = 3;
    const [currentPage, setCurrentPage] = useState(1);
    const [currentHistoryPage, setCurrentHistoryPage] = useState(1);
    const totalActivePages = Math.max(1, Math.ceil(filteredActiveBooks.length / BOOKS_PER_PAGE));
    const paginatedActiveBooks = filteredActiveBooks.slice((currentPage - 1) * BOOKS_PER_PAGE, currentPage * BOOKS_PER_PAGE);

    const totalHistoryPages = Math.max(1, Math.ceil(filteredHistoryBooks.length / BOOKS_PER_PAGE));
    const paginatedHistoryBooks = filteredHistoryBooks.slice((currentHistoryPage - 1) * BOOKS_PER_PAGE, currentHistoryPage * BOOKS_PER_PAGE);



    const customerName = customer?.customerName || customer?.name || 'Bạn đọc HALM';
    const customerIdDisplay = formatCustomerId(customer?.customerId || customer?.customer_id);
    const avatarSrc = customer?.avatar || customer?.avatarUrl;
    const potatoBalance = customer?.potatoBalance ?? 0;
    return <><style>{inlinePageStyle1}</style>
        <UserLayout className="my-books-page" onOpenChatbot={openChatbot} onThemeChange={setIsDark}>

            {/* Starry background in Dark Mode */}
            <div id="starry-background" aria-hidden="true">
                {stars.map((star) => <div key={star.id} className="star" style={{ width: `${star.size}px`, height: `${star.size}px`, top: `${star.top}%`, left: `${star.left}%`, animation: `starTwinkle ${star.duration}s infinite ease-in-out ${star.delay}s` }} />)}</div>




            {/* ========================================================
         MAIN DASHBOARD CONTAINER (ĐỒNG BỘ 100% LAYOUT PROFILE & TIERS)
         ======================================================== */}
            <main className="w-full max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8 sm:pt-28 sm:pb-10 flex-1">
                <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">

                    {/* ====================================================
                 SIDEBAR TRÁI: HỒ SƠ & ĐIỀU HƯỚNG TÀI KHOẢN (ĐỒNG BỘ)
                 ==================================================== */}
                    {/* LEFT SIDEBAR - FIXED/STICKY CONTAINER */}
                    <aside onMouseEnter={prefetchUserRoutes} onFocus={prefetchUserRoutes} className="w-full lg:w-80 shrink-0 space-y-4 lg:sticky lg:top-24 lg:self-start">

                        {/* 1. Profile Avatar Card */}
                        <div className="rounded-3xl user-sidebar-card bg-paper-surface dark:bg-night-surface border border-paper-border dark:border-night-border p-6 shadow-sm flex flex-col items-center text-center relative overflow-hidden group">
                            {/* Ambient aura behind avatar */}
                            <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>

                            {/* Dynamic Avatar Frame with Tier Prestige - Bo theo viền tròn */}
                            <AvatarWithFrame
                                avatarSrc={avatarSrc}
                                name={customerName}
                                tier={customer?.membershipTier}
                                potatoBalance={potatoBalance}
                                booksCount={bookshelf?.length ?? 0}
                                size="lg"
                            />

                            {/* Name & Handle */}
                            <h2 className="font-display font-black text-2xl text-[#FAF7F0] leading-tight">
                                {customerName}
                            </h2>
                            <p className="font-metadata-spec text-xs text-[#96938B] mt-1">
                                {customerIdDisplay}
                            </p>

                            {/* Membership Badge */}
                            <Link to="/hang" className={`mt-3.5 inline-flex items-center gap-1.5 px-4 py-1 rounded-full text-xs font-metadata-spec font-bold hover:scale-105 transition-transform ${getTierBadgeClass(customer?.membershipTier, potatoBalance, bookshelf?.length ?? 0)}`} title="Xem cấp bậc hội viên">
                                <i className={`ph-bold ${getTierInfo(customer?.membershipTier, potatoBalance, bookshelf?.length ?? 0).icon}`}></i>
                                <span>{getTierInfo(customer?.membershipTier, potatoBalance, bookshelf?.length ?? 0).name}</span>
                            </Link>

                            {/* Divider */}
                            <div className="w-full h-px bg-paper-border dark:bg-night-border my-5"></div>

                            {/* Quick Reader Stats */}
                            <div className="grid grid-cols-3 gap-2 w-full text-center">
                                <Link to="/canhan?tab=wallet" className="py-3 px-2 rounded-2xl user-sidebar-box bg-paper dark:bg-night-surface border border-paper-border dark:border-night-border hover:border-gold transition-colors flex flex-col justify-center">
                                    <span className="block font-metadata-spec text-base sm:text-lg font-black text-[#EDE9DF]">{potatoBalance.toLocaleString()}</span>
                                    <span className="font-metadata-spec text-[10px] text-[#96938B] mt-0.5 font-bold">Khoai</span>
                                </Link>
                                <div className="py-3 px-2 rounded-2xl user-sidebar-box bg-paper dark:bg-night-surface border border-paper-border dark:border-night-border flex flex-col justify-center">
                                    <span className="block font-metadata-spec text-base sm:text-lg font-black text-[#EDE9DF]">{activeBooks.length}</span>
                                    <span className="font-metadata-spec text-[10px] text-[#96938B] mt-0.5 font-bold">Tủ Sách</span>
                                </div>
                                <Link to="/canhan?tab=vouchers" className="py-3 px-2 rounded-2xl user-sidebar-box bg-paper dark:bg-night-surface border border-paper-border dark:border-night-border hover:border-gold transition-colors flex flex-col justify-center items-center">
                                    <i className="ph-bold ph-ticket text-lg text-amber-500 dark:text-gold mb-0.5"></i>
                                    <span className="font-metadata-spec text-[10px] text-[#96938B] font-bold">Voucher</span>
                                </Link>
                            </div>
                        </div>

                        {/* 2. Navigation Menu Card - STRICT ORDER (1: Profile, 2: Bookshelf, 3: Tiers, 4: Missions, 5: Wallet, 6: History, Divider, 7: Logout) */}
                        <div className="rounded-3xl user-sidebar-card bg-paper-surface dark:bg-night-surface border border-paper-border dark:border-night-border p-3.5 shadow-sm space-y-1.5">
                            {/* 1. Thông Tin Cá Nhân */}
                            <Link
                                to="/canhan"
                                className="w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs font-metadata-spec font-bold text-ink-muted dark:text-stone-300 hover:bg-paper-200 dark:hover:bg-stone-800/40 hover:text-ink dark:hover:text-white transition-colors"
                            >
                                <i className="ph-bold ph-user text-lg text-stone-400"></i>
                                <span>Thông Tin Cá Nhân</span>
                            </Link>

                            {/* 2. Tủ Sách Cá Nhân (ACTIVE TRÊN TRANG NÀY) */}
                            <div
                                className="w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-metadata-spec font-black bg-[#C28807] text-[#111210] shadow-md transition-colors cursor-default"
                            >
                                <div className="flex items-center gap-3.5">
                                    <i className="ph-bold ph-book-bookmark text-lg text-[#111210]"></i>
                                    <span>Tủ Sách Cá Nhân</span>
                                </div>
                                <span className="px-3 py-1 rounded-full bg-black/25 text-black text-xs font-black">{activeBooks.length} cuốn</span>
                            </div>

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

                            {/* 3.5 Nhiệm Vụ Hằng Ngày */}
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
                                <span className="px-3 py-1 rounded-full bg-paper-200 dark:bg-[#242116] border border-paper-border dark:border-[#52441D] text-amber-600 dark:text-[#D8B44A] text-xs font-bold font-metadata-spec">{potatoBalance.toLocaleString()} 🥔</span>
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

                            {/* Divider Line */}
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


                    {/* ====================================================
                 NỘI DUNG CHÍNH: QUẢN LÝ TỦ SÁCH CÁ NHÂN
                 ==================================================== */}
                    <div className="flex-1 min-w-0 w-full space-y-8">

                        {/* Page Title & Header Bar */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-paper-border dark:border-night-border">
                            <div>
                                <div className="flex items-center gap-2 text-xs font-metadata-spec text-ink-muted dark:text-night-muted mb-1">
                                    <Link to="/" className="hover:underline">Trang chủ</Link>
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
                                <button
                                    type="button"
                                    onClick={() => window.dispatchEvent(new CustomEvent('halm-open-upload-modal'))}
                                    className="px-4 py-2.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-600 dark:text-amber-400 font-metadata-spec font-bold text-xs hover:bg-amber-500/25 transition-colors flex items-center gap-2 shadow-sm"
                                    title="Tải lên file sách PDF hoặc EPUB cá nhân"
                                >
                                    <i className="ph-bold ph-cloud-arrow-up text-base"></i>
                                    <span>Tải Lên Sách Cá Nhân</span>
                                </button>
                                <Link to="/#trending-section" className="px-4 py-2.5 rounded-xl bg-wine text-white dark:bg-gold dark:text-night-bg font-metadata-spec font-bold text-xs hover:opacity-90 transition-opacity flex items-center gap-2 shadow-sm">
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
                            <div className="rounded-2xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border p-4 shadow-sm text-center cursor-pointer hover:border-rose-500/40 transition-colors" onClick={() => filterBooks("gifts")} title="Bấm để xem danh sách sách được tặng & đã gửi">
                                <span className="font-metadata-spec text-[10px] font-bold uppercase text-ink-muted dark:text-night-muted block">Quà Tặng Sách</span>
                                <div className="flex items-center justify-center gap-1.5 mt-1">
                                    <i className="ph-bold ph-gift text-rose-500 text-lg"></i>
                                    <span className="font-display font-black text-xl text-ink dark:text-night-text">{giftsReceived.length} <span className="text-xs font-normal text-ink-muted">món quà</span></span>
                                </div>
                            </div>
                            <div className="rounded-2xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border p-4 shadow-sm text-center">
                                <span className="font-metadata-spec text-[10px] font-bold uppercase text-ink-muted dark:text-night-muted block">Chuỗi Ngày Đọc</span>
                                <div className="flex items-center justify-center gap-1.5 mt-1">
                                    <i className="ph-fill ph-fire text-amber-500 text-lg"></i>
                                    <span className="font-display font-black text-xl text-amber-500">{customer?.streakDays ?? 0} <span className="text-xs font-normal text-ink-muted">ngày streak</span></span>
                                </div>
                            </div>
                        </div>


                        {/* ====================================================
                            CATEGORY FILTER TABS & SEARCH BAR
                            ==================================================== */}
                        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between pb-3 border-b border-paper-border dark:border-night-border">
                            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs font-metadata-spec font-bold">
                                <button type="button" onClick={() => filterBooks("all")} className={"library-tab px-3.5 py-2 rounded-xl border border-paper-border dark:border-night-border text-ink dark:text-night-text hover:border-wine dark:hover:border-gold transition-colors whitespace-nowrap " + (activeCategory === "all" ? "active" : "")}>
                                    Tất Cả ({bookshelf.length + personalBooks.length})
                                </button>
                                <button type="button" onClick={() => filterBooks("reading")} className={"library-tab px-3.5 py-2 rounded-xl border border-wine dark:border-gold whitespace-nowrap shadow-sm " + (activeCategory === 'reading' ? 'active' : '')}>
                                    Đang Thuê ({activeBooks.length})
                                </button>
                                <button type="button" onClick={() => filterBooks("personal")} className={"library-tab px-3.5 py-2 rounded-xl border border-amber-500/40 text-amber-700 dark:text-amber-400 whitespace-nowrap shadow-sm flex items-center gap-1.5 " + (activeCategory === 'personal' ? 'active' : '')}>
                                    <i className="ph-bold ph-cloud-arrow-up text-amber-500"></i>
                                    <span>Sách Cá Nhân ({personalBooks.length})</span>
                                </button>
                                <button type="button" onClick={() => filterBooks("favorites")} className={"library-tab px-3.5 py-2 rounded-xl border border-paper-border dark:border-night-border text-ink dark:text-night-text hover:border-wine dark:hover:border-gold transition-colors whitespace-nowrap flex items-center gap-1.5 " + (activeCategory === "favorites" ? "active" : "")}>
                                    <i className="ph-fill ph-heart text-rose-500"></i>
                                    <span>Yêu Thích ({favoriteBooks.length})</span>
                                </button>
                                <button type="button" onClick={() => filterBooks("completed")} className={"library-tab px-3.5 py-2 rounded-xl border border-paper-border dark:border-night-border text-ink dark:text-night-text hover:border-wine dark:hover:border-gold transition-colors whitespace-nowrap " + (activeCategory === "completed" ? "active" : "")}>
                                    Lịch Sử ({historyBooks.length})
                                </button>
                                <button type="button" onClick={() => filterBooks("gifts")} className={"library-tab px-3.5 py-2 rounded-xl border border-paper-border dark:border-night-border text-ink dark:text-night-text hover:border-rose-500 dark:hover:border-rose-400 transition-colors whitespace-nowrap flex items-center gap-1.5 " + (activeCategory === "gifts" ? "active text-rose-500 border-rose-500" : "")}>
                                    <i className="ph-fill ph-gift text-rose-500"></i>
                                    <span>Quà Tặng ({giftsReceived.length + giftsSent.length})</span>
                                </button>
                            </div>

                            {/* Search Box */}
                            <div className="relative w-full sm:w-72 shrink-0">
                                <i className="ph-bold ph-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#8E3038] dark:text-[#D4AF37]"></i>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setCurrentPage(1);
                                        setCurrentHistoryPage(1);
                                    }}
                                    placeholder="Tìm sách trong tủ..."
                                    className="w-full pl-8 pr-7 py-2 rounded-xl text-xs bg-paper dark:bg-night-surface border border-paper-border dark:border-night-border focus:outline-none focus:border-wine dark:focus:border-gold text-ink dark:text-night-text placeholder-ink-muted/70 transition-colors shadow-2xs font-metadata-spec"
                                    autoComplete="off"
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSearchQuery('');
                                            setCurrentPage(1);
                                            setCurrentHistoryPage(1);
                                        }}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink dark:hover:text-white text-xs cursor-pointer"
                                        title="Xóa tìm kiếm"
                                    >
                                        <i className="ph-bold ph-x"></i>
                                    </button>
                                )}
                            </div>
                        </div>


                        {/* ====================================================
                     SECTION 1: SÁCH ĐANG ĐỌC & THUÊ (ACTIVE LOANS)
                     ==================================================== */}
                        <div className={"space-y-4 " + (activeCategory === 'completed' || activeCategory === 'personal' || activeCategory === 'favorites' || activeCategory === 'gifts' ? 'hidden' : '')} id="section-reading">
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
                                        <Link to="/#trending-section" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-wine hover:bg-wine-dark text-white dark:bg-gold dark:hover:bg-gold-light dark:text-night-bg font-metadata-spec font-bold text-xs shadow-sm transition-all">
                                            <i className="ph-bold ph-compass"></i>
                                            <span>Khám Phá Sách Ngay</span>
                                        </Link>
                                    </div>
                                ) : (
                                    paginatedActiveBooks.map((book) => {
                                        const isForever = book.remainingDays > 1000;
                                        const isExpiringSoon = !isForever && book.remainingDays <= 2;
                                        const coverUrl = book.coverImage
                                            ? (book.coverImage.startsWith('http') || book.coverImage.startsWith('/') ? book.coverImage : `/${book.coverImage}`)
                                            : '/logo.png';

                                        return (
                                            <div key={book.accessId || book.bookId} className="rounded-2xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border p-5 sm:p-6 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row gap-5 lg:gap-6 items-start md:items-center">
                                                {/* Book Cover */}
                                                <div className="relative shrink-0 mx-auto md:mx-0 w-32 sm:w-36 h-48 sm:h-52 rounded-xl overflow-hidden book-cover-elevated bg-paper-200 dark:bg-night-surface cursor-pointer group" onClick={() => handleContinueReading(book.bookTitle, book.expired, book.bookId)} title="Bấm để đọc sách ngay">
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

                                                    {/* Reading Progress Bar & Resume cue */}
                                                    <div className="space-y-1.5 px-3 py-2.5 rounded-xl bg-paper-50 dark:bg-night-surface/60 border border-paper-border/70 dark:border-night-border/70">
                                                        <div className="flex items-center justify-between text-xs font-metadata-spec">
                                                            <span className="text-ink-muted dark:text-night-muted flex items-center gap-1.5 font-medium">
                                                                <i className="ph-bold ph-book-open text-wine dark:text-gold"></i>
                                                                <span>{book.currentPage && book.currentPage > 1 ? <>Đang dừng tại trang <strong className="text-ink dark:text-night-text">{book.currentPage}</strong></> : 'Chưa bắt đầu đọc'}</span>
                                                            </span>
                                                            <span className="font-bold text-wine dark:text-gold text-xs">
                                                                {book.readingPercentage && book.readingPercentage > 0 ? `${Math.round(book.readingPercentage)}%` : '0%'}
                                                            </span>
                                                        </div>
                                                        <div className="w-full h-1.5 rounded-full bg-paper-200 dark:bg-night-border overflow-hidden">
                                                            <div
                                                                className="h-full bg-gradient-to-r from-amber-600 to-amber-400 dark:from-gold dark:to-yellow-300 rounded-full transition-all duration-500"
                                                                style={{ width: `${Math.max(book.readingPercentage || 0, (book.currentPage > 1 ? 6 : 0))}%` }}
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Action Buttons Toolbar */}
                                                    <div className="flex flex-wrap items-center gap-2.5 pt-1">
                                                        <button type="button" onClick={() => handleContinueReading(book.bookTitle, book.expired, book.bookId)} className="px-4 py-2 rounded-xl bg-wine hover:bg-wine-dark text-white dark:bg-gold dark:hover:bg-gold-light dark:text-night-bg text-xs font-metadata-spec font-bold transition-all flex items-center gap-1.5 shadow-sm">
                                                            <span>Đọc Tiếp Ngay</span>
                                                            <i className="ph-bold ph-arrow-right"></i>
                                                        </button>

                                                        {!isForever && (
                                                            <button type="button" onClick={() => openRenewModal(book.bookTitle, book.remainingDays, book.bookId)} className="px-3.5 py-2 rounded-xl bg-paper-200 dark:bg-night-surface hover:bg-paper-border dark:hover:bg-night-border text-ink dark:text-night-text border border-paper-border dark:border-night-border text-xs font-metadata-spec font-bold transition-colors flex items-center gap-1.5">
                                                                <i className="ph-bold ph-arrows-clockwise text-wine dark:text-gold"></i>
                                                                <span>Thêm thời gian đọc</span>
                                                            </button>
                                                        )}

                                                        <button type="button" onClick={() => openChatbot(`Tóm tắt ý chính của cuốn sách "${book.bookTitle}"`)} className="px-3.5 py-2 rounded-xl bg-paper-200 dark:bg-night-surface hover:bg-paper-border dark:hover:bg-night-border text-ink dark:text-night-text border border-paper-border dark:border-night-border text-xs font-metadata-spec font-bold transition-colors flex items-center gap-1.5">
                                                            <i className="ph-bold ph-sparkle text-gold"></i>
                                                            <span>Hỏi Đáp AI</span>
                                                        </button>

                                                        {!isForever && (
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setReturnModalBook(book);
                                                                }}
                                                                className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-xs font-metadata-spec font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                                                                title="Trả lại cuốn sách trước hạn thuê"
                                                            >
                                                                <i className="ph-bold ph-arrow-u-up-left text-sm"></i>
                                                                <span>Trả Sách</span>
                                                            </button>
                                                        )}

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

                            {/* Phân trang cho sách đang đọc / đang thuê (4-5 cuốn / trang) */}
                            {totalActivePages > 1 && (
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-5 border-t border-paper-border dark:border-night-border font-metadata-spec">
                                    <div className="text-xs text-ink-muted dark:text-night-muted">
                                        Hiển thị <span className="font-bold text-ink dark:text-night-text">{(currentPage - 1) * BOOKS_PER_PAGE + 1} - {Math.min(currentPage * BOOKS_PER_PAGE, filteredActiveBooks.length)}</span> trên <span className="font-bold text-ink dark:text-night-text">{filteredActiveBooks.length}</span> cuốn sách
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            type="button"
                                            disabled={currentPage <= 1}
                                            onClick={() => {
                                                setCurrentPage(prev => Math.max(1, prev - 1));
                                                window.scrollTo({ top: 380, behavior: 'smooth' });
                                            }}
                                            className="px-3 py-1.5 rounded-xl border border-paper-border dark:border-night-border bg-paper-surface dark:bg-night-card text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-paper-200 dark:hover:bg-night-surface transition-colors flex items-center gap-1"
                                        >
                                            <i className="ph-bold ph-caret-left text-xs"></i>
                                            <span>Trước</span>
                                        </button>
                                        {Array.from({ length: totalActivePages }, (_, i) => i + 1).map(num => (
                                            <button
                                                key={num}
                                                type="button"
                                                onClick={() => {
                                                    setCurrentPage(num);
                                                    window.scrollTo({ top: 380, behavior: 'smooth' });
                                                }}
                                                className={`w-8 h-8 rounded-xl text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${
                                                    currentPage === num
                                                        ? 'bg-wine text-white dark:bg-gold dark:text-night-bg shadow-sm'
                                                        : 'border border-paper-border dark:border-night-border bg-paper-surface dark:bg-night-card text-ink dark:text-night-text hover:bg-paper-200 dark:hover:bg-night-surface'
                                                }`}
                                            >
                                                {num}
                                            </button>
                                        ))}
                                        <button
                                            type="button"
                                            disabled={currentPage >= totalActivePages}
                                            onClick={() => {
                                                setCurrentPage(prev => Math.min(totalActivePages, prev + 1));
                                                window.scrollTo({ top: 380, behavior: 'smooth' });
                                            }}
                                            className="px-3 py-1.5 rounded-xl border border-paper-border dark:border-night-border bg-paper-surface dark:bg-night-card text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-paper-200 dark:hover:bg-night-surface transition-colors flex items-center gap-1"
                                        >
                                            <span>Sau</span>
                                            <i className="ph-bold ph-caret-right text-xs"></i>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ====================================================
                            SECTION: SÁCH TẢI LÊN CÁ NHÂN (PERSONAL UPLOADED BOOKS)
                            ==================================================== */}
                        <div className={"space-y-4 pt-2 " + (activeCategory !== 'personal' && activeCategory !== 'all' ? 'hidden' : '')} id="section-personal">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div className="flex items-center gap-2.5">
                                    <span className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center text-lg">
                                        <i className="ph-bold ph-cloud-arrow-up"></i>
                                    </span>
                                    <div>
                                        <h2 className="font-display font-black text-xl text-ink dark:text-night-text">
                                            Sách Tải Lên Cá Nhân
                                        </h2>
                                        <p className="text-xs font-metadata-spec text-ink-muted dark:text-night-muted">
                                            Lưu trữ an toàn trên trình duyệt (IndexedDB) • Không giới hạn thời gian đọc
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-metadata-spec font-bold text-amber-600 dark:text-amber-400">
                                        {personalBooks.length} cuốn sách
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => window.dispatchEvent(new CustomEvent('halm-open-upload-modal'))}
                                        className="px-3.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-600 dark:text-amber-400 text-xs font-bold font-metadata-spec transition-colors flex items-center gap-1.5 cursor-pointer"
                                    >
                                        <i className="ph-bold ph-plus-circle"></i>
                                        <span>Tải Thêm Sách</span>
                                    </button>
                                </div>
                            </div>

                            {/* Danh sách thẻ sách cá nhân */}
                            {filteredPersonalBooks.length === 0 ? (
                                <div className="p-10 rounded-2xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border text-center space-y-4 shadow-sm">
                                    <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center text-3xl">
                                        <i className="ph-bold ph-cloud-arrow-up"></i>
                                    </div>
                                    <div>
                                        <h3 className="font-display font-black text-lg text-ink dark:text-night-text">
                                            Chưa có sách cá nhân nào được tải lên
                                        </h3>
                                        <p className="font-editorial-body text-xs text-ink-muted dark:text-night-muted max-w-md mx-auto mt-1 leading-relaxed">
                                            Bạn có thể tải lên các file PDF hoặc EPUB cá nhân (lên tới 100MB) để đọc mọi lúc mọi nơi trên trình đọc sách HALM BOOK.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => window.dispatchEvent(new CustomEvent('halm-open-upload-modal'))}
                                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-900 font-metadata-spec font-black text-xs shadow-sm transition-all cursor-pointer"
                                    >
                                        <i className="ph-bold ph-cloud-arrow-up"></i>
                                        <span>Tải Lên File Sách Ngay</span>
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {filteredPersonalBooks.map((book) => {
                                        const formatBadge = (book.format || 'pdf').toUpperCase();
                                        const isEpub = formatBadge === 'EPUB';
                                        return (
                                            <div
                                                key={book.id}
                                                className="rounded-2xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border p-4 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between group"
                                            >
                                                <div>
                                                    <div className="w-full h-52 rounded-xl overflow-hidden bg-paper-200 dark:bg-night-surface book-cover-elevated relative mb-3 cursor-pointer" onClick={() => navigate(`/docsach/${encodeURIComponent(book.id)}?mode=full`)}>
                                                        <img
                                                            src={book.coverUrl || '/logo.png'}
                                                            alt={book.title}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                e.currentTarget.onerror = null;
                                                                e.currentTarget.src = '/logo.png';
                                                            }}
                                                        />
                                                        <span
                                                            className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-white text-[9px] font-metadata-spec font-black uppercase tracking-wider backdrop-blur-sm ${
                                                                isEpub ? 'bg-amber-600/90' : 'bg-red-600/90'
                                                            }`}
                                                        >
                                                            {formatBadge}
                                                        </span>
                                                        <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-emerald-600/90 text-white text-[9px] font-metadata-spec font-bold backdrop-blur-sm">
                                                            Cá Nhân
                                                        </span>
                                                    </div>
                                                    <h4
                                                        className="font-display font-bold text-sm text-ink dark:text-night-text line-clamp-1 hover:text-wine dark:hover:text-gold cursor-pointer"
                                                        onClick={() => navigate(`/docsach/${encodeURIComponent(book.id)}?mode=full`)}
                                                        title={book.title}
                                                    >
                                                        {book.title}
                                                    </h4>
                                                    <p className="font-metadata-spec text-xs text-ink-muted dark:text-night-muted mt-0.5 line-clamp-1">
                                                        {book.author || 'Tác giả cá nhân'}
                                                    </p>
                                                    <div className="text-[10px] font-metadata-spec text-ink-muted dark:text-night-muted mt-2 pt-2 border-t border-paper-border dark:border-night-border flex justify-between items-center">
                                                        <span>{book.fileSize || (book.fileBytes ? (book.fileBytes / (1024 * 1024)).toFixed(1) + ' MB' : 'Tài liệu')}</span>
                                                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">Toàn quyền đọc</span>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-4 gap-2 mt-4">
                                                    <button
                                                        type="button"
                                                        onClick={() => navigate(`/docsach/${encodeURIComponent(book.id)}?mode=full`)}
                                                        className="col-span-3 py-2 px-3 rounded-xl bg-wine hover:bg-wine-dark text-white dark:bg-gold dark:hover:bg-gold-light dark:text-night-bg text-xs font-metadata-spec font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                                                    >
                                                        <i className="ph-bold ph-book-open"></i>
                                                        <span>Đọc Sách</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeletePersonalBook(book.id, book.title)}
                                                        className="col-span-1 py-2 px-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-xs transition-colors flex items-center justify-center cursor-pointer"
                                                        title="Xóa sách khỏi tủ cá nhân"
                                                    >
                                                        <i className="ph-bold ph-trash text-sm"></i>
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* ====================================================
                            SECTION: SÁCH YÊU THÍCH (WISHLIST)
                            ==================================================== */}
                        <div className={"space-y-4 pt-2 " + (activeCategory !== 'favorites' ? 'hidden' : '')} id="section-favorites">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div>
                                    <h2 className="font-display font-black text-xl text-ink dark:text-night-text flex items-center gap-2">
                                        <i className="ph-fill ph-heart text-rose-500"></i>
                                        <span>Danh Sách Tác Phẩm Yêu Thích</span>
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 font-metadata-spec font-bold">
                                            {favoriteBooks.length} tác phẩm
                                        </span>
                                    </h2>
                                    <p className="font-editorial-body text-xs text-ink-muted dark:text-night-muted mt-0.5">
                                        Những tác phẩm bạn đã lưu để dành thưởng thức hoặc thuê đọc khi có thời gian.
                                    </p>
                                </div>
                            </div>

                            {favoriteBooks.length === 0 ? (
                                <div className="rounded-2xl p-8 text-center bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border space-y-3">
                                    <div className="w-14 h-14 mx-auto rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center text-2xl">
                                        <i className="ph-bold ph-heart-break"></i>
                                    </div>
                                    <h3 className="font-display font-bold text-base text-ink dark:text-night-text">Chưa có tác phẩm yêu thích nào</h3>
                                    <p className="font-editorial-body text-xs text-ink-muted dark:text-night-muted max-w-sm mx-auto">
                                        Khi khám phá kho sách, bấm biểu tượng trái tim để lưu lại những cuốn sách bạn yêu thích vào đây nhé!
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => navigate('/')}
                                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-wine hover:bg-wine-dark text-white dark:bg-gold dark:hover:bg-gold-light dark:text-night-bg text-xs font-metadata-spec font-bold transition-all shadow-sm cursor-pointer"
                                    >
                                        <i className="ph-bold ph-compass"></i>
                                        <span>Khám Phá Sách Ngay</span>
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {favoriteBooks.map((fav) => (
                                        <div key={fav.favoriteId || fav.bookId} className="rounded-2xl p-4 bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border hover:border-rose-400 dark:hover:border-rose-400/60 transition-all flex flex-col justify-between group shadow-sm hover:shadow-md">
                                            <div className="space-y-3">
                                                <div className="relative aspect-[3/4] rounded-xl overflow-hidden shadow-md group-hover:scale-[1.02] transition-transform">
                                                    <img
                                                        src={fav.img || fav.imgUrl || '/logo.png'}
                                                        alt={fav.title || fav.bookName}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => { e.currentTarget.src = '/logo.png'; }}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveFavorite(fav.bookId, fav.title || fav.bookName)}
                                                        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 hover:bg-rose-600 text-white flex items-center justify-center transition-colors cursor-pointer"
                                                        title="Bỏ khỏi yêu thích"
                                                    >
                                                        <i className="ph-fill ph-heart text-sm text-rose-400 hover:text-white"></i>
                                                    </button>
                                                    <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-black/60 text-[#D4AF37] text-[10px] font-black backdrop-blur-sm flex items-center gap-1">
                                                        <i className="ph-fill ph-star"></i>
                                                        {fav.rating || '5.0'}
                                                    </span>
                                                </div>

                                                <div>
                                                    <span className="text-[10px] font-metadata-spec font-bold uppercase tracking-wider text-wine dark:text-gold">
                                                        {fav.categoryName || 'Sách'}
                                                    </span>
                                                    <h4 className="font-display font-bold text-sm text-ink dark:text-night-text line-clamp-1 group-hover:text-wine dark:group-hover:text-gold transition-colors mt-0.5">
                                                        {fav.title || fav.bookName}
                                                    </h4>
                                                    <p className="font-metadata-spec text-xs text-ink-muted dark:text-night-muted line-clamp-1 mt-0.5">
                                                        {fav.author || 'HALM BOOK'}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-paper-border dark:border-night-border">
                                                <button
                                                    type="button"
                                                    onClick={() => navigate(`/docsach/${fav.bookId}?mode=trial`)}
                                                    className="py-2 px-3 rounded-xl bg-paper-200 dark:bg-night-surface hover:bg-paper-border dark:hover:bg-night-border text-ink dark:text-night-text text-xs font-metadata-spec font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                                                >
                                                    <i className="ph-bold ph-eye"></i>
                                                    <span>Đọc thử</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => navigate(`/chitietsach/${fav.bookId}`)}
                                                    className="py-2 px-3 rounded-xl bg-wine hover:bg-wine-dark text-white dark:bg-gold dark:hover:bg-gold-light dark:text-night-bg text-xs font-metadata-spec font-bold transition-colors flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                                                >
                                                    <i className="ph-bold ph-shopping-bag"></i>
                                                    <span>Thuê ngay</span>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* ====================================================
                     SECTION 2: SÁCH ĐÃ THUÊ & LỊCH SỬ HOÀN THÀNH (HISTORY GRID)
                     ==================================================== */}
                        <div className={"space-y-4 pt-2 " + (activeCategory === 'reading' || activeCategory === 'personal' || activeCategory === 'favorites' || activeCategory === 'gifts' ? 'hidden' : '')} id="section-completed">
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
                                    paginatedHistoryBooks.map((book) => {
                                        const coverUrl = book.coverImage
                                            ? (book.coverImage.startsWith('http') || book.coverImage.startsWith('/') ? book.coverImage : `/${book.coverImage}`)
                                            : '/logo.png';

                                        return (
                                            <div key={book.accessId || book.bookId} className="rounded-2xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border p-4 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between group">
                                                <div>
                                                    <div className="w-full h-52 rounded-xl overflow-hidden bg-paper-200 dark:bg-night-surface book-cover-elevated relative mb-3">
                                                        <img src={coverUrl} alt={book.bookTitle} className="w-full h-full object-cover p-2" onError={(event) => handleImageError(event, "/logo.png")} />
                                                        <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-slate-700/90 text-white text-[9px] font-metadata-spec font-black backdrop-blur-sm">
                                                            {book.status === 'RETURNED' ? 'Đã trả sách' : (book.expired ? 'Hết hạn thuê' : 'Đã đọc')}
                                                        </span>
                                                    </div>
                                                    <h4 className="font-display font-bold text-sm text-ink dark:text-night-text line-clamp-1 hover:text-wine dark:hover:text-gold cursor-pointer" onClick={() => navigate(`/chitietsach/${book.bookId}`)}>
                                                        {book.bookTitle}
                                                    </h4>
                                                    <p className="font-metadata-spec text-xs text-ink-muted dark:text-night-muted mt-0.5">{book.authorName || 'Tác giả'}</p>
                                                    <div className="text-[10px] font-metadata-spec text-ink-muted dark:text-night-muted mt-2 pt-2 border-t border-paper-border dark:border-night-border flex justify-between">
                                                        <span>{book.status === 'RETURNED' ? 'Ngày trả: ' : 'Hết hạn: '}{book.endDate ? book.endDate.substring(0, 10) : '—'}</span>
                                                        <span className={book.status === 'RETURNED' ? 'text-rose-500 font-bold' : 'text-amber-600 font-bold'}>
                                                            {book.status === 'RETURNED' ? 'Đã hoàn trả' : 'Cần gia hạn'}
                                                        </span>
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

                            {/* Phân trang cho sách lịch sử hoàn thành */}
                            {totalHistoryPages > 1 && (
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-5 border-t border-paper-border dark:border-night-border font-metadata-spec">
                                    <div className="text-xs text-ink-muted dark:text-night-muted">
                                        Hiển thị <span className="font-bold text-ink dark:text-night-text">{(currentHistoryPage - 1) * BOOKS_PER_PAGE + 1} - {Math.min(currentHistoryPage * BOOKS_PER_PAGE, filteredHistoryBooks.length)}</span> trên <span className="font-bold text-ink dark:text-night-text">{filteredHistoryBooks.length}</span> cuốn sách
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            type="button"
                                            disabled={currentHistoryPage <= 1}
                                            onClick={() => {
                                                setCurrentHistoryPage(prev => Math.max(1, prev - 1));
                                                window.scrollTo({ top: 380, behavior: 'smooth' });
                                            }}
                                            className="px-3 py-1.5 rounded-xl border border-paper-border dark:border-night-border bg-paper-surface dark:bg-night-card text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-paper-200 dark:hover:bg-night-surface transition-colors flex items-center gap-1"
                                        >
                                            <i className="ph-bold ph-caret-left text-xs"></i>
                                            <span>Trước</span>
                                        </button>
                                        {Array.from({ length: totalHistoryPages }, (_, i) => i + 1).map(num => (
                                            <button
                                                key={num}
                                                type="button"
                                                onClick={() => {
                                                    setCurrentHistoryPage(num);
                                                    window.scrollTo({ top: 380, behavior: 'smooth' });
                                                }}
                                                className={`w-8 h-8 rounded-xl text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${
                                                    currentHistoryPage === num
                                                        ? 'bg-wine text-white dark:bg-gold dark:text-night-bg shadow-sm'
                                                        : 'border border-paper-border dark:border-night-border bg-paper-surface dark:bg-night-card text-ink dark:text-night-text hover:bg-paper-200 dark:hover:bg-night-surface'
                                                }`}
                                            >
                                                {num}
                                            </button>
                                        ))}
                                        <button
                                            type="button"
                                            disabled={currentHistoryPage >= totalHistoryPages}
                                            onClick={() => {
                                                setCurrentHistoryPage(prev => Math.min(totalHistoryPages, prev + 1));
                                                window.scrollTo({ top: 380, behavior: 'smooth' });
                                            }}
                                            className="px-3 py-1.5 rounded-xl border border-paper-border dark:border-night-border bg-paper-surface dark:bg-night-card text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-paper-200 dark:hover:bg-night-surface transition-colors flex items-center gap-1"
                                        >
                                            <span>Sau</span>
                                            <i className="ph-bold ph-caret-right text-xs"></i>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ====================================================
                            SECTION: QUÀ TẶNG SÁCH (BOOK GIFTS - RECEIVED & SENT)
                            ==================================================== */}
                        <div className={"space-y-4 pt-2 " + (activeCategory !== 'gifts' && activeCategory !== 'all' ? 'hidden' : '')} id="section-gifts">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-paper-border/70 dark:border-night-border/70">
                                <div className="flex items-center gap-2.5">
                                    <span className="w-8 h-8 rounded-xl bg-rose-500/15 text-rose-500 flex items-center justify-center text-lg shadow-2xs">
                                        <i className="ph-bold ph-gift"></i>
                                    </span>
                                    <div>
                                        <h2 className="font-display font-black text-xl text-ink dark:text-night-text">
                                            Quà Tặng Sách
                                        </h2>
                                        <p className="font-editorial-body text-xs text-ink-muted dark:text-night-muted">
                                            Tác phẩm bạn bè đã gửi tặng hoặc bạn đã gửi trao tri thức đến độc giả khác
                                        </p>
                                    </div>
                                </div>

                                {/* Subtabs: Đã Nhận & Đã Gửi */}
                                <div className="flex items-center gap-1.5 bg-paper-100 dark:bg-night-surface p-1 rounded-xl border border-paper-border dark:border-night-border self-start sm:self-auto shadow-2xs">
                                    <button
                                        type="button"
                                        onClick={() => setGiftSubTab('received')}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold font-metadata-spec transition-all flex items-center gap-1.5 cursor-pointer ${
                                            giftSubTab === 'received'
                                                ? 'bg-wine text-white dark:bg-gold dark:text-night-bg shadow-sm'
                                                : 'text-ink-muted dark:text-stone-400 hover:text-ink dark:hover:text-white'
                                        }`}
                                    >
                                        <i className="ph-bold ph-envelope-open"></i>
                                        <span>Sách Được Tặng ({giftsReceived.length})</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setGiftSubTab('sent')}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold font-metadata-spec transition-all flex items-center gap-1.5 cursor-pointer ${
                                            giftSubTab === 'sent'
                                                ? 'bg-wine text-white dark:bg-gold dark:text-night-bg shadow-sm'
                                                : 'text-ink-muted dark:text-stone-400 hover:text-ink dark:hover:text-white'
                                        }`}
                                    >
                                        <i className="ph-bold ph-paper-plane-tilt"></i>
                                        <span>Sách Đã Gửi Đi ({giftsSent.length})</span>
                                    </button>
                                </div>
                            </div>

                            {/* Danh sách hiển thị theo Subtab */}
                            {giftSubTab === 'received' ? (
                                filteredGiftsReceived.length === 0 ? (
                                    <div className="py-14 text-center rounded-2xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border p-6 shadow-sm">
                                        <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center text-3xl">
                                            <i className="ph-bold ph-gift"></i>
                                        </div>
                                        <h3 className="font-display font-bold text-base text-ink dark:text-night-text mb-1">
                                            {searchQuery ? 'Không tìm thấy quà tặng phù hợp' : 'Chưa có món quà sách nào'}
                                        </h3>
                                        <p className="font-editorial-body text-xs text-ink-muted dark:text-stone-400 max-w-sm mx-auto">
                                            {searchQuery ? 'Hãy thử tìm kiếm với từ khóa khác.' : 'Khi bạn bè hoặc độc giả khác gửi tặng bạn tác phẩm, thông tin quà tặng và lời chúc sẽ hiển thị đầy đủ tại đây.'}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {filteredGiftsReceived.map((g) => (
                                            <div
                                                key={g.giftId}
                                                className="p-5 rounded-2xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border hover:border-gold/50 shadow-sm transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                                            >
                                                <div className="flex items-start gap-4 flex-1 min-w-0">
                                                    <img
                                                        src={g.bookCover || '/logo.png'}
                                                        alt={g.bookTitle}
                                                        onError={(e) => handleImageError(e, '/logo.png')}
                                                        className="w-20 h-28 object-cover rounded-xl shadow-md border border-paper-border dark:border-night-border shrink-0"
                                                    />
                                                    <div className="space-y-2 flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-500 border border-rose-500/30 flex items-center gap-1">
                                                                <i className="ph-fill ph-gift text-xs"></i> Quà Tặng
                                                            </span>
                                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-gold border border-amber-500/30">
                                                                {g.rentalDays > 1000 ? 'Vĩnh viễn' : `Thuê ${g.rentalDays} ngày`}
                                                            </span>
                                                            <span className="text-[11px] text-ink-muted dark:text-stone-400">
                                                                {new Date(g.createdAt).toLocaleDateString('vi-VN')}
                                                            </span>
                                                        </div>
                                                        <h4 className="font-display font-black text-base text-ink dark:text-night-text truncate">
                                                            {g.bookTitle}
                                                        </h4>
                                                        <p className="text-xs text-ink-muted dark:text-stone-400">
                                                            Tác giả: <strong className="font-semibold text-ink dark:text-night-text">{g.bookAuthor || 'HALM BOOK'}</strong>
                                                        </p>
                                                        <div className="p-3 rounded-xl bg-paper-100 dark:bg-night-surface border border-paper-border/60 dark:border-night-border/60 text-xs italic text-ink-muted dark:text-stone-300 flex items-start gap-2">
                                                            <i className="ph-fill ph-quotes text-amber-500 text-sm shrink-0 mt-0.5"></i>
                                                            <span className="flex-1">"{g.message || 'Chúc bạn đọc sách vui vẻ và nhiều cảm hứng!'}"</span>
                                                            <span className="not-italic font-bold text-wine dark:text-gold shrink-0">
                                                                — {g.senderName}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex sm:flex-col items-center gap-2 w-full sm:w-auto shrink-0">
                                                    <Link
                                                        to={`/docsach/${g.bookId}?mode=full`}
                                                        className="flex-1 sm:flex-none w-full px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-metadata-spec font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
                                                    >
                                                        <i className="ph-bold ph-book-open"></i>
                                                        <span>Đọc Sách Ngay</span>
                                                    </Link>
                                                    <Link
                                                        to={`/chitietsach/${g.bookId}`}
                                                        className="flex-1 sm:flex-none w-full px-4 py-2 rounded-xl border border-paper-border dark:border-night-border hover:border-gold text-ink dark:text-night-text font-metadata-spec font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                                                    >
                                                        <i className="ph-bold ph-info"></i>
                                                        <span>Chi Tiết</span>
                                                    </Link>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )
                            ) : (
                                filteredGiftsSent.length === 0 ? (
                                    <div className="py-14 text-center rounded-2xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border p-6 shadow-sm">
                                        <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center text-3xl">
                                            <i className="ph-bold ph-paper-plane-tilt"></i>
                                        </div>
                                        <h3 className="font-display font-bold text-base text-ink dark:text-night-text mb-1">
                                            {searchQuery ? 'Không tìm thấy quà tặng đã gửi phù hợp' : 'Bạn chưa gửi tặng cuốn sách nào'}
                                        </h3>
                                        <p className="font-editorial-body text-xs text-ink-muted dark:text-stone-400 max-w-sm mx-auto mb-4">
                                            {searchQuery ? 'Hãy thử tìm kiếm với từ khóa khác.' : 'Tặng sách là cách tuyệt vời để lan tỏa tri thức đến những người bạn yêu quý.'}
                                        </p>
                                        <Link
                                            to="/#trending-section"
                                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-wine hover:bg-wine-dark text-white dark:bg-gold dark:hover:bg-gold-light dark:text-night-bg text-xs font-bold font-metadata-spec shadow-sm transition-all"
                                        >
                                            <i className="ph-bold ph-magnifying-glass"></i>
                                            <span>Tìm Sách Để Tặng Ngay</span>
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {filteredGiftsSent.map((g) => (
                                            <div
                                                key={g.giftId}
                                                className="p-5 rounded-2xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border hover:border-gold/50 shadow-sm transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                                            >
                                                <div className="flex items-start gap-4 flex-1 min-w-0">
                                                    <img
                                                        src={g.bookCover || '/logo.png'}
                                                        alt={g.bookTitle}
                                                        onError={(e) => handleImageError(e, '/logo.png')}
                                                        className="w-20 h-28 object-cover rounded-xl shadow-md border border-paper-border dark:border-night-border shrink-0"
                                                    />
                                                    <div className="space-y-2 flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-gold border border-amber-500/30 flex items-center gap-1">
                                                                <i className="ph-bold ph-arrow-up-right text-xs"></i> Đã tặng cho {g.receiverName}
                                                            </span>
                                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-paper-200 dark:bg-night-surface text-ink-muted dark:text-stone-400">
                                                                {g.rentalDays > 1000 ? 'Vĩnh viễn' : `Kỳ hạn ${g.rentalDays} ngày`}
                                                            </span>
                                                            <span className="text-[11px] text-ink-muted dark:text-stone-400">
                                                                {new Date(g.createdAt).toLocaleDateString('vi-VN')}
                                                            </span>
                                                        </div>
                                                        <h4 className="font-display font-black text-base text-ink dark:text-night-text truncate">
                                                            {g.bookTitle}
                                                        </h4>
                                                        <p className="text-xs text-ink-muted dark:text-stone-400">
                                                            Chi phí quà tặng: <span className="font-black text-amber-600 dark:text-gold">-{g.potatoPrice} Khoai 🥔</span>
                                                        </p>
                                                        <div className="p-3 rounded-xl bg-paper-100 dark:bg-night-surface border border-paper-border/60 dark:border-night-border/60 text-xs italic text-ink-muted dark:text-stone-300 flex items-start gap-2">
                                                            <i className="ph-fill ph-quotes text-amber-500 text-sm shrink-0 mt-0.5"></i>
                                                            <span className="flex-1">"{g.message || 'Chúc bạn đọc sách vui vẻ!'}"</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <Link
                                                    to={`/chitietsach/${g.bookId}`}
                                                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-paper-border dark:border-night-border hover:border-gold text-ink dark:text-night-text font-metadata-spec font-bold text-xs flex items-center justify-center gap-2 transition-colors shrink-0"
                                                >
                                                    <i className="ph-bold ph-info"></i>
                                                    <span>Xem Tác Phẩm</span>
                                                </Link>
                                            </div>
                                        ))}
                                    </div>
                                )
                            )}
                        </div>

                        {/* ====================================================
                     SECTION 3: TRÍCH DẪN TÂM ĐẮC & GHI CHÚ TRỢ LÝ AI (SMART HIGHLIGHTS)
                     ==================================================== */}
                        <div className={"rounded-2xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border p-6 shadow-sm space-y-4 " + (activeCategory === 'gifts' ? 'hidden' : '')}>
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

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={handleRefreshQuotes}
                                        className="px-3 py-1.5 rounded-xl bg-paper dark:bg-night-surface border border-paper-border dark:border-night-border text-xs font-metadata-spec font-bold text-ink dark:text-night-text hover:text-wine dark:hover:text-gold transition-colors flex items-center gap-1.5"
                                        title="Khám phá góc nhìn và trích dẫn mới từ AI"
                                    >
                                        <i className="ph-bold ph-arrows-clockwise text-xs"></i>
                                        <span>Đổi Gợi Ý</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleExportNotes}
                                        className="px-3 py-1.5 rounded-xl bg-paper dark:bg-night-surface border border-paper-border dark:border-night-border text-xs font-metadata-spec font-bold text-ink dark:text-night-text hover:text-wine dark:hover:text-gold transition-colors flex items-center gap-1.5"
                                        title="Sao chép toàn bộ trích dẫn và phân tích vào bộ nhớ tạm"
                                    >
                                        <i className="ph-bold ph-export text-xs"></i>
                                        <span>Xuất Ghi Chú</span>
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {currentQuotes.map((q, idx) => (
                                    <div key={idx} className="p-4 rounded-xl bg-paper dark:bg-night-surface border border-paper-border dark:border-night-border space-y-2.5 transition-all hover:border-wine/40 dark:hover:border-gold/40">
                                        <div className="flex items-center justify-between">
                                            <span className={`font-metadata-spec text-[10px] font-bold ${q.color}`}>
                                                {q.book} • {q.page}
                                            </span>
                                            <i className={`ph-bold ph-bookmark-simple ${q.iconColor} text-sm`}></i>
                                        </div>
                                        <blockquote className={`font-editorial-body text-xs text-ink dark:text-night-text italic border-l-2 ${q.borderColor} pl-3 leading-relaxed`}>
                                            "{q.quote}"
                                        </blockquote>
                                        <div className="pt-2 border-t border-paper-border dark:border-night-border flex items-start gap-2 text-[11px] font-editorial-body text-ink-muted dark:text-night-muted">
                                            <i className="ph-bold ph-sparkle text-gold shrink-0 mt-0.5"></i>
                                            <span><strong>Nhận xét AI:</strong> {q.insight}</span>
                                        </div>
                                    </div>
                                ))}
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

            {/* ========================================================
             MODAL: XÁC NHẬN TRẢ SÁCH CÓ HẠN THUÊ
             ======================================================== */}
            {returnModalBook && (
                <div
                    id="returnBookModal"
                    onClick={(event) => { if (event.target === event.currentTarget && !isReturningBook) setReturnModalBook(null); }}
                    className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
                >
                    <div className="bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border rounded-2xl max-w-md w-full p-6 shadow-2xl relative my-auto transform transition-all text-center">
                        <button
                            type="button"
                            disabled={isReturningBook}
                            onClick={() => setReturnModalBook(null)}
                            className="absolute top-4 right-4 text-ink-muted hover:text-ink dark:hover:text-white p-1 rounded-full hover:bg-paper-200 dark:hover:bg-night-border transition-colors disabled:opacity-50"
                        >
                            <i className="ph-bold ph-x text-lg"></i>
                        </button>

                        <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center text-3xl mb-3.5">
                            <i className="ph-bold ph-arrow-u-up-left"></i>
                        </div>

                        <h3 className="font-display font-black text-lg text-ink dark:text-night-text mb-1.5">
                            Xác Nhận Trả Sách
                        </h3>
                        <p className="font-editorial-body text-xs text-ink-muted dark:text-night-muted leading-relaxed mb-4">
                            Bạn có chắc chắn muốn trả lại cuốn sách <strong className="text-ink dark:text-night-text">"{returnModalBook.bookTitle}"</strong> trước thời hạn không?
                        </p>

                        <div className="p-3 mb-5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-[11px] text-left flex items-start gap-2">
                            <i className="ph-bold ph-info text-base shrink-0 mt-0.5"></i>
                            <span>Sau khi hoàn trả, tác phẩm sẽ được chuyển sang mục <strong>Lịch Sử Thuê</strong> và quyền đọc sách sẽ kết thúc.</span>
                        </div>

                        <div className="flex items-center justify-center gap-3 font-metadata-spec text-xs">
                            <button
                                type="button"
                                disabled={isReturningBook}
                                onClick={() => setReturnModalBook(null)}
                                className="w-1/2 py-2.5 rounded-xl bg-paper-200 dark:bg-night-surface text-ink dark:text-night-text hover:bg-paper-border dark:hover:bg-night-border font-bold transition-colors disabled:opacity-50"
                            >
                                Giữ Lại Đọc
                            </button>
                            <button
                                type="button"
                                disabled={isReturningBook}
                                onClick={handleConfirmReturnBook}
                                className="w-1/2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black transition-all flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-60"
                            >
                                {isReturningBook ? (
                                    <>
                                        <i className="ph-bold ph-spinner animate-spin text-sm"></i>
                                        <span>Đang Trả Sách...</span>
                                    </>
                                ) : (
                                    <>
                                        <i className="ph-bold ph-check"></i>
                                        <span>Xác Nhận Trả</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}


        </UserLayout></>;
}
