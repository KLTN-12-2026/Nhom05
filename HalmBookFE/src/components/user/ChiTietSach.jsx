import useBookDetailInteractions from '@/hooks/useBookDetailInteractions';
import { tailwindConfig, externalStylesheets, pageStyles, inlinePageStyle1 } from './styles/ChiTietSach.styles.js';
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import axiosInstance from '@/services/axiosClient';
import { isTokenValid } from '@/services/authToken';
import { openAuthModal } from '@/components/common/AuthModal';
import UserLayout from './layout/UserLayout';
import { openBookReaderTransition } from './bookReaderTransition';
import { checkIsFavorite, toggleFavorite, searchGiftRecipient, giftBookToRecipient } from '@/services/userFeatureService';
import { getCurrentCustomer } from '@/services/customerService';

const STAR_FEEDBACK_TEXTS = ["Rất tệ", "Tệ", "Bình thường", "Rất hay", "Tuyệt tác!"];





function useOriginalDesignAssets() {
    useEffect(() => {
        const addedLinks = externalStylesheets
            .filter((href) => !document.querySelector(`link[href="${href}"]`))
            .map((href) => {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = href;
                document.head.appendChild(link);
                return link;
            });

        if (!document.querySelector('script[data-halm-tailwind]')) {
            window.tailwind = window.tailwind || {};
            window.tailwind.config = tailwindConfig;

            const script = document.createElement('script');
            script.src = 'https://cdn.tailwindcss.com';
            script.dataset.halmTailwind = 'true';
            document.head.appendChild(script);
        }

        return () => {
            addedLinks.forEach((link) => link.remove());
        };
    }, []);
}



// Legacy interactions retained as module-scoped functions so existing JSX handlers keep working.
// ----------------------------------------------------
            // 1. THEME TOGGLE & DARK MODE STARS
            // ----------------------------------------------------
            export default function ChiTietSach() {
    useOriginalDesignAssets();
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const bookId = id || searchParams.get('id');

    const [book, setBook] = useState(null);
    const { createStars, openRentalModal, closeRentalModal, selectRentalModalPlan, confirmRentalModalAddToCart, scrollAuthorBooks, toggleCartDrawer, handleCheckoutCart, switchTab, showToast } = useBookDetailInteractions(book, bookId);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [rentStatus, setRentStatus] = useState({
        hasAccess: false,
        remainingDays: 0,
        isForever: false,
        status: ''
    });

    // ==========================================
    // 1. STATE QUẢN LÝ ĐÁNH GIÁ & CẢM NHẬN ĐỘC GIẢ
    // ==========================================
    const [reviews, setReviews] = useState([]);
    const [isLoadingReviews, setIsLoadingReviews] = useState(false);
    const [selectedStar, setSelectedStar] = useState(5);
    const [hoverStar, setHoverStar] = useState(0);
    const [commentInput, setCommentInput] = useState("");
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);
    const [activeReplyId, setActiveReplyId] = useState(null);
    const [replyInputText, setReplyInputText] = useState("");
    const [isSubmittingReply, setIsSubmittingReply] = useState(false);

    // ==========================================
    // STATE QUẢN LÝ SÁCH YÊU THÍCH (WISHLIST)
    // ==========================================
    const [isFavorite, setIsFavorite] = useState(false);
    const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);

    useEffect(() => {
        if (!bookId || !isTokenValid()) return;
        checkIsFavorite(bookId).then(setIsFavorite).catch(() => {});
    }, [bookId]);

    const handleToggleFavorite = async () => {
        if (!isTokenValid()) {
            openAuthModal({ mode: 'login', message: 'Vui lòng đăng nhập để lưu tác phẩm vào danh sách Yêu Thích!' });
            return;
        }
        try {
            setIsFavoriteLoading(true);
            const res = await toggleFavorite(bookId);
            setIsFavorite(res.isFavorite);
            window.dispatchEvent(new CustomEvent('halm-favorites-updated', {
                detail: { bookId, isFavorite: res.isFavorite }
            }));
            const toastFn = window.showToast || alert;
            toastFn(res.message || (res.isFavorite ? 'Đã thêm tác phẩm vào danh sách Yêu Thích!' : 'Đã xóa khỏi danh sách Yêu Thích!'));
        } catch (err) {
            console.error('Lỗi khi thao tác yêu thích:', err);
        } finally {
            setIsFavoriteLoading(false);
        }
    };

    // ==========================================
    // STATE & LOGIC QUẢN LÝ TẶNG SÁCH CHO BẠN BÈ
    // ==========================================
    const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);
    const [giftRecipientQuery, setGiftRecipientQuery] = useState('');
    const [giftCandidates, setGiftCandidates] = useState([]);
    const [selectedRecipient, setSelectedRecipient] = useState(null);
    const [giftPlanKey, setGiftPlanKey] = useState('7');
    const [giftMessage, setGiftMessage] = useState('Chúc bạn đọc sách thật nhiều cảm hứng và niềm vui!');
    const [isSearchingRecipient, setIsSearchingRecipient] = useState(false);
    const [isGiftingBook, setIsGiftingBook] = useState(false);
    const [currentUserPotato, setCurrentUserPotato] = useState(0);
    const [giftSuccessModal, setGiftSuccessModal] = useState(null);

    const giftPlanPrice = React.useMemo(() => {
        switch (giftPlanKey) {
            case '1': return 2;
            case '3': return 5;
            case '7': return 9;
            case '14': return 15;
            case '30': return 25;
            case 'forever': return book?.rent_price && book.rent_price > 0 ? Math.round(book.rent_price) : 39;
            default: return 9;
        }
    }, [giftPlanKey, book]);

    const openGiftModal = async () => {
        if (!isTokenValid()) {
            openAuthModal({ mode: 'login', message: 'Vui lòng đăng nhập để tặng sách cho bạn bè!' });
            return;
        }
        try {
            const cust = await getCurrentCustomer();
            if (cust?.potatoBalance != null) {
                setCurrentUserPotato(cust.potatoBalance);
            }
        } catch {}
        setIsGiftModalOpen(true);
    };

    const closeGiftModal = () => {
        setIsGiftModalOpen(false);
        setGiftRecipientQuery('');
        setGiftCandidates([]);
        setSelectedRecipient(null);
    };

    const handleSearchRecipient = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        const q = giftRecipientQuery.trim();
        if (q.length < 2) {
            showToast('Vui lòng nhập ít nhất 2 ký tự (email, username, SĐT)!');
            return;
        }
        setIsSearchingRecipient(true);
        try {
            const list = await searchGiftRecipient(q);
            setGiftCandidates(list);
            if (list.length === 1) {
                setSelectedRecipient(list[0]);
            } else if (list.length === 0) {
                showToast('Không tìm thấy độc giả nào phù hợp với từ khóa này!');
            }
        } catch {
            showToast('Lỗi khi tìm kiếm người nhận. Vui lòng thử lại!');
        } finally {
            setIsSearchingRecipient(false);
        }
    };

    const handleConfirmGiftBook = async () => {
        if (!selectedRecipient) {
            showToast('Vui lòng chọn người nhận quà tặng!');
            return;
        }
        if (currentUserPotato < giftPlanPrice) {
            showToast(`Số dư Khoai của bạn (${currentUserPotato} 🥔) không đủ ${giftPlanPrice} 🥔 để tặng sách!`);
            return;
        }

        setIsGiftingBook(true);
        try {
            const res = await giftBookToRecipient(bookId, {
                recipientIdentifier: selectedRecipient.customerId || selectedRecipient.username || selectedRecipient.emailMasked,
                planKey: giftPlanKey,
                message: giftMessage
            });
            window.dispatchEvent(new CustomEvent('halm-potato-updated', {
                detail: { potatoBalance: res.remainingPotato }
            }));
            try {
                const cached = JSON.parse(localStorage.getItem('halm_customer_cache') || '{}');
                cached.potatoBalance = res.remainingPotato;
                localStorage.setItem('halm_customer_cache', JSON.stringify(cached));
            } catch (_) {}
            setCurrentUserPotato(res.remainingPotato);
            setIsGiftModalOpen(false);
            setGiftSuccessModal({
                recipientName: selectedRecipient.customerName,
                bookTitle: book?.bookName || 'Tác phẩm',
                planText: giftPlanKey === 'forever' ? 'Vĩnh viễn (Trọn đời)' : `${giftPlanKey} ngày`,
                potatoSpent: giftPlanPrice,
                message: giftMessage
            });
            showToast('Tặng Sách Thành Công!', `Đã gửi tặng sách cho ${selectedRecipient.customerName}.`);
        } catch (err) {
            const msg = err.response?.data?.message || 'Không thể tặng sách. Vui lòng thử lại!';
            showToast(msg);
        } finally {
            setIsGiftingBook(false);
        }
    };

    // ==========================================
    // STATE QUẢN LÝ SÁCH CÙNG TÁC GIẢ
    // ==========================================
    const [authorBooks, setAuthorBooks] = useState([]);
    const [isAuthorBooksLoading, setIsAuthorBooksLoading] = useState(false);

    const fetchAuthorBooks = async (targetId, currentAuthor, categoryId, signal) => {
        if (!targetId) return;
        setIsAuthorBooksLoading(true);
        try {
            const res = await axiosInstance.get(`/api/home/books/${encodeURIComponent(targetId)}/author-books?limit=8`, { signal });
            const list = Array.isArray(res.data) ? res.data : (res.data?.content || []);
            if (list.length > 0) {
                setAuthorBooks(list);
                setIsAuthorBooksLoading(false);
                return;
            }
        } catch {
            // Tiếp tục fallback nếu endpoint chuyên biệt chưa sẵn sàng
        }

        try {
            let fallbackUrl = `/api/home/books?size=10`;
            if (currentAuthor) {
                fallbackUrl += `&search=${encodeURIComponent(currentAuthor)}`;
            }
            const fbRes = await axiosInstance.get(fallbackUrl, { signal });
            const items = Array.isArray(fbRes.data?.content) ? fbRes.data.content : (Array.isArray(fbRes.data) ? fbRes.data : []);
            let filtered = items.filter(b => String(b.book_id || b.id) !== String(targetId));
            if (filtered.length === 0) {
                const genRes = await axiosInstance.get(`/api/home/books?page=0&size=8`, { signal });
                const genItems = Array.isArray(genRes.data?.content) ? genRes.data.content : (Array.isArray(genRes.data) ? genRes.data : []);
                filtered = genItems.filter(b => String(b.book_id || b.id) !== String(targetId));
            }
            setAuthorBooks(filtered.slice(0, 8));
        } catch {
            setAuthorBooks([]);
        } finally {
            setIsAuthorBooksLoading(false);
        }
    };

    // ==========================================
    // 2. STATE QUẢN LÝ CHATBOT TRỢ LÝ AI
    // ==========================================
    const [isChatbotOpen, setIsChatbotOpen] = useState(false);
    const [chatMessages, setChatMessages] = useState([]);
    const [chatInputText, setChatInputText] = useState("");
    const [isChatbotLoading, setIsChatbotLoading] = useState(false);
    const chatBodyRef = useRef(null);

    // Tải danh sách đánh giá từ Backend
    const fetchEvaluates = async (targetBookId) => {
        if (!targetBookId) return;
        try {
            setIsLoadingReviews(true);
            const res = await axiosInstance.get(`/api/home/books/${encodeURIComponent(targetBookId)}/evaluates`);
            if (Array.isArray(res.data)) {
                setReviews(res.data);
            }
        } catch (err) {
            console.warn("Không thể tải danh sách đánh giá từ máy chủ:", err);
        } finally {
            setIsLoadingReviews(false);
        }
    };

    // Gửi đánh giá mới kèm số sao lên Backend
    const handlePostReview = async () => {
        // CHẶN KHÁCH VÃNG LAI: Yêu cầu đăng nhập trước khi đánh giá
        if (!isTokenValid()) {
            showToast('Vui lòng đăng nhập để gửi cảm nhận và đánh giá sách!', 'error');
            openAuthModal({ mode: 'login', message: 'Vui lòng đăng nhập để gửi đánh giá cho tác phẩm này!' });
            return;
        }

        const text = commentInput.trim();
        if (!text) {
            showToast('Vui lòng nhập nội dung cảm nhận của bạn!', 'error');
            return;
        }

        const targetBookId = book?.book_id || book?.id || bookId;
        if (!targetBookId) {
            showToast('Không xác định được mã sách!', 'error');
            return;
        }

        try {
            setIsSubmittingReview(true);
            const currentToken = sessionStorage.getItem("token") || localStorage.getItem("token");
            const config = currentToken ? { headers: { Authorization: `Bearer ${currentToken}` } } : {};

            const res = await axiosInstance.post(
                `/api/home/books/${encodeURIComponent(targetBookId)}/evaluates`,
                {
                    bookId: targetBookId,
                    star: selectedStar,
                    content: text
                },
                config
            );

            if (res.data) {
                setReviews(prev => [res.data, ...prev]);
                setCommentInput("");
                setSelectedStar(5);
                setHoverStar(0);
                showToast('🎉 Đã đăng cảm nhận thành công! (+5 Khoai)', 'success');
            }
        } catch (err) {
            console.error("Lỗi khi gửi đánh giá:", err);
            const msg = err.response?.data?.message || 'Không thể lưu đánh giá. Vui lòng thử lại sau!';
            showToast(msg, 'error');
        } finally {
            setIsSubmittingReview(false);
        }
    };

    // Tăng lượt thích cho 1 đánh giá
    const handleLikeReview = async (evaluateId) => {
        if (!isTokenValid()) {
            showToast('Vui lòng đăng nhập để tương tác thích đánh giá!', 'error');
            openAuthModal({ mode: 'login', message: 'Vui lòng đăng nhập để tương tác cùng bạn đọc!' });
            return;
        }
        try {
            const res = await axiosInstance.post(`/api/home/evaluates/${evaluateId}/like`);
            const newCount = res.data?.likesCount;
            setReviews(prev => prev.map(r => r.evaluateId === evaluateId ? { ...r, likesCount: newCount } : r));
        } catch (err) {
            console.warn("Lỗi khi thích đánh giá:", err);
        }
    };

    // Gửi phản hồi (reply) cho 1 đánh giá
    const handleSubmitReply = async (parentId) => {
        if (!isTokenValid()) {
            showToast('Vui lòng đăng nhập để gửi phản hồi đánh giá!', 'error');
            openAuthModal({ mode: 'login', message: 'Vui lòng đăng nhập để tham gia thảo luận!' });
            return;
        }
        const text = replyInputText.trim();
        if (!text) {
            showToast('Vui lòng nhập nội dung phản hồi!', 'error');
            return;
        }
        const targetBookId = book?.book_id || book?.id || bookId;
        try {
            setIsSubmittingReply(true);
            const currentToken = sessionStorage.getItem("token") || localStorage.getItem("token");
            const config = currentToken ? { headers: { Authorization: `Bearer ${currentToken}` } } : {};

            const res = await axiosInstance.post(
                `/api/home/books/${encodeURIComponent(targetBookId)}/evaluates`,
                {
                    bookId: targetBookId,
                    content: text,
                    parentId: parentId
                },
                config
            );

            if (res.data) {
                setReviews(prev => prev.map(r => {
                    if (r.evaluateId === parentId) {
                        return { ...r, replies: [...(r.replies || []), res.data] };
                    }
                    return r;
                }));
                setReplyInputText("");
                setActiveReplyId(null);
                showToast('Đã gửi phản hồi thành công! (+2 Khoai)', 'success');
            }
        } catch (err) {
            showToast('Không thể gửi phản hồi lúc này.', 'error');
        } finally {
            setIsSubmittingReply(false);
        }
    };

    // Gửi câu hỏi đến Trợ lý Sách AI
    const handleSendChatMessage = async (textToSend) => {
        const msg = (typeof textToSend === 'string' ? textToSend : chatInputText).trim();
        if (!msg || isChatbotLoading) return;

        setChatMessages(prev => [...prev, { sender: 'user', text: msg }]);
        setChatInputText("");
        setIsChatbotLoading(true);

        setTimeout(() => {
            if (chatBodyRef.current) {
                chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
            }
        }, 50);

        try {
            const currentToken = sessionStorage.getItem("token") || localStorage.getItem("token");
            const config = currentToken ? { headers: { Authorization: `Bearer ${currentToken}` } } : {};

            const res = await axiosInstance.post(
                "/api/chat",
                { message: msg },
                config
            );

            const reply = res.data?.reply;
            if (reply) {
                setChatMessages(prev => [...prev, { sender: 'bot', text: reply }]);
            } else {
                setChatMessages(prev => [...prev, { sender: 'bot', text: "Hiện tại trợ lý chưa nhận được thông tin phù hợp, bạn thử hỏi lại câu khác nhé." }]);
            }
        } catch (err) {
            console.error("Lỗi AI Chatbot:", err);
            const errMsg = err.response?.data?.reply || err.response?.data?.message || "Hệ thống AI đang quá tải hoặc bảo trì. Vui lòng thử lại sau giây lát.";
            setChatMessages(prev => [...prev, { sender: 'bot', text: errMsg }]);
        } finally {
            setIsChatbotLoading(false);
            setTimeout(() => {
                if (chatBodyRef.current) {
                    chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
                }
            }, 100);
        }
    };

    const handleReadBook = () => {
        if (!book) {
            showToast('Đang tải thông tin sách, vui lòng thử lại sau.', 'info');
            return;
        }

        // Mở chức năng đọc thử: Khách vãng lai và người chưa thuê đều được đọc thử miễn phí với mode=trial
        const hasFullAccess = isTokenValid() && rentStatus.hasAccess;
        const readModeParam = hasFullAccess ? 'full' : 'trial';

        const bookCard = document.getElementById('book-card');
        const coverUrl = book.img_url || book.img || '/logo.png';
        const targetBookId = book.book_id || book.id || bookId;

        // Lưu thông tin sách đầy đủ vào sessionStorage trước khi mở reader
        try {
            sessionStorage.setItem('halm-reader-book', JSON.stringify({
                ...book,
                book_id: targetBookId,
                id: targetBookId,
                title: book.bookName || book.title,
                bookName: book.bookName || book.title,
                author: book.author || book.authorName,
                authorName: book.author || book.authorName,
                img_url: coverUrl,
                coverImage: coverUrl
            }));
        } catch (_) {}

        openBookReaderTransition({
            bookCard,
            coverUrl,
            book,
            onComplete: () => {
                if (targetBookId) {
                    navigate('/docsach/' + encodeURIComponent(targetBookId) + `?mode=${readModeParam}`);
                } else {
                    navigate(`/docsach?mode=${readModeParam}`);
                }
            },
        });
    };

    useEffect(() => {
        const controller = new AbortController();

        const fetchBookDetail = async () => {
            try {
                setIsLoading(true);
                setError("");

                let targetId = bookId;

                // Nếu không có ID trên URL, tự động truy vấn lấy cuốn sách đầu tiên làm mặc định
                if (!targetId) {
                    const listRes = await axiosInstance.get('/api/home/books', {
                        params: { page: 0, size: 1 },
                        signal: controller.signal
                    });
                    const payload = listRes.data;
                    const items = Array.isArray(payload)
                        ? payload
                        : Array.isArray(payload?.content)
                            ? payload.content
                            : Array.isArray(payload?.data)
                                ? payload.data
                                : [];
                    if (items.length > 0) {
                        targetId = items[0].book_id || items[0].id;
                    }
                }

                if (!targetId) {
                    setError("Không tìm thấy mã sách hợp lệ.");
                    setIsLoading(false);
                    return;
                }

                const response = await axiosInstance.get(`/api/home/books/${encodeURIComponent(targetId)}`, {
                    signal: controller.signal
                });

                if (response.data) {
                    setBook(response.data);
                    window.__CURRENT_BOOK_PDF__ = response.data.pdf_url;
                    window.__CURRENT_BOOK__ = response.data;
                    fetchEvaluates(targetId);
                    fetchAuthorBooks(
                        targetId,
                        response.data.author,
                        response.data.category_id || response.data.category?.category_id,
                        controller.signal
                    );
                    setChatMessages([
                        {
                            sender: 'bot',
                            text: `Chào bạn! Mình là Trợ lý Sách HALM. Bạn muốn tìm hiểu thêm về cuốn sách "${response.data.bookName || 'này'}" của tác giả ${response.data.author || 'này'} hay nhận gợi ý tác phẩm tương tự?`
                        }
                    ]);

                    // Kiểm tra trạng thái đã sở hữu / thuê của người dùng
                    try {
                        const checkRes = await axiosInstance.get(`/api/home/bookshelf/check/${encodeURIComponent(targetId)}`, {
                            signal: controller.signal
                        });
                        if (checkRes.data?.hasAccess) {
                            let daysLeft = 0;
                            let isForeverOwned = false;
                            let statusText = 'ACTIVE';
                            try {
                                const shelfRes = await axiosInstance.get('/api/home/bookshelf', { signal: controller.signal });
                                if (Array.isArray(shelfRes.data)) {
                                    const match = shelfRes.data.find(b => String(b.bookId) === String(targetId) || String(b.id) === String(targetId));
                                    if (match) {
                                        daysLeft = match.remainingDays ?? 0;
                                        isForeverOwned = Boolean(match.isForever || match.remainingDays > 1000);
                                        statusText = match.status || 'ACTIVE';
                                    }
                                }
                            } catch (_) {}
                            setRentStatus({
                                hasAccess: true,
                                remainingDays: daysLeft,
                                isForever: isForeverOwned,
                                status: statusText
                            });
                        } else {
                            setRentStatus({ hasAccess: false, remainingDays: 0, isForever: false, status: '' });
                        }
                    } catch (_) {
                        setRentStatus({ hasAccess: false, remainingDays: 0, isForever: false, status: '' });
                    }
                } else {
                    setError("Không nhận được dữ liệu sách từ máy chủ.");
                }
            } catch (err) {
                if (controller.signal.aborted) return;
                console.error("Lỗi khi tải chi tiết sách:", err);
                setError(err.response?.data?.message || err.message || "Không thể tải thông tin sách.");
            } finally {
                if (!controller.signal.aborted) {
                    setIsLoading(false);
                }
            }
        };

        fetchBookDetail();

        return () => controller.abort();
    }, [bookId]);

    // Lắng nghe cập nhật Tủ Sách từ Giỏ Hàng hoặc Mua Sách
    useEffect(() => {
        const handleBookshelfUpdated = () => {
            const targetId = bookId || (book ? (book.book_id || book.id) : '');
            if (targetId) {
                axiosInstance.get(`/api/home/bookshelf/check/${encodeURIComponent(targetId)}`)
                    .then(res => {
                        if (res.data?.hasAccess) {
                            axiosInstance.get('/api/home/bookshelf').then(shelfRes => {
                                if (Array.isArray(shelfRes.data)) {
                                    const match = shelfRes.data.find(b => String(b.bookId) === String(targetId) || String(b.id) === String(targetId));
                                    if (match) {
                                        setRentStatus({
                                            hasAccess: true,
                                            remainingDays: match.remainingDays ?? 0,
                                            isForever: Boolean(match.isForever || match.remainingDays > 1000),
                                            status: match.status || 'ACTIVE'
                                        });
                                    }
                                }
                            }).catch(() => {});
                        } else {
                            setRentStatus({ hasAccess: false, remainingDays: 0, isForever: false, status: '' });
                        }
                    }).catch(() => {});
            }
        };
        window.addEventListener('halm-bookshelf-updated', handleBookshelfUpdated);
        return () => window.removeEventListener('halm-bookshelf-updated', handleBookshelfUpdated);
    }, [bookId, book]);

    // Quản lý số dư Khoai thực tế của người dùng
    const [userKhoai, setUserKhoai] = useState(0);

    useEffect(() => {
        let isMounted = true;
        const fetchUserKhoai = async () => {
            try {
                const res = await axiosInstance.get('/api/home/customer/info');
                if (isMounted && res.data && res.data.potatoBalance !== undefined) {
                    const balance = res.data.potatoBalance;
                    setUserKhoai(balance);
                    const el = document.getElementById('user-khoai-val');
                    if (el) el.textContent = balance.toLocaleString();
                    const modalEl = document.getElementById('rentalModalUserKhoai');
                    if (modalEl) modalEl.textContent = balance.toLocaleString();
                    const drawerEl = document.getElementById('cartDrawerUserKhoai');
                    if (drawerEl) drawerEl.textContent = balance.toLocaleString();
                }
            } catch (e) {
                // Khách vãng lai chưa đăng nhập
            }
        };
        fetchUserKhoai();

        const handlePotatoUpdated = (event) => {
            if (event?.detail) {
                const val = event.detail.potatoBalance ?? event.detail.balance ?? 0;
                setUserKhoai(val);
                const el = document.getElementById('user-khoai-val');
                if (el) el.textContent = val.toLocaleString();
                const modalEl = document.getElementById('rentalModalUserKhoai');
                if (modalEl) modalEl.textContent = val.toLocaleString();
                const drawerEl = document.getElementById('cartDrawerUserKhoai');
                if (drawerEl) drawerEl.textContent = val.toLocaleString();
            } else {
                fetchUserKhoai();
            }
        };
        window.addEventListener('halm-potato-updated', handlePotatoUpdated);
        return () => {
            isMounted = false;
            window.removeEventListener('halm-potato-updated', handlePotatoUpdated);
        };
    }, []);

    useEffect(() => {
        if (document.documentElement.classList.contains('dark')) {
            createStars();
        }
    }, [createStars]);

    // Tính toán số sao trung bình và số lượng đánh giá thực tế từ state reviews
    const calculatedAvgRating = reviews.length > 0
        ? (reviews.reduce((sum, r) => sum + (r.star || 5), 0) / reviews.length).toFixed(1)
        : (book?.rating ? Number(book.rating).toFixed(1) : '5.0');
    const totalReviewCount = reviews.length;
    const reviewStatusText = totalReviewCount === 0 ? "Chưa có đánh giá" : `${totalReviewCount} đánh giá độc giả`;

    return (
        <>
            <style>{pageStyles}</style>
            <style>{inlinePageStyle1}</style>
            <UserLayout 
                className="selection:bg-wine-100 selection:text-wine dark:selection:bg-wine-dark dark:selection:text-gold-light"
                onOpenChatbot={(prompt) => {
                    setIsChatbotOpen(true);
                    if (prompt) handleSendChatMessage(prompt);
                }}
            >
            <div className="antialiased flex flex-col min-h-screen relative pt-24">
{/* Màn chắn chống nháy giao diện khi quay lại từ trang đọc */}
    

    {/* Starry background for Dark Mode */}
    <div id="starry-background"></div>

    {/* ========================================================
         HEADER / NAVBAR (MATCHING HALM BOOK DESIGN SYSTEM)
         ======================================================== */}
    

    {/* ========================================================
         MAIN CONTENT: BOOK DETAILS HERO
         ======================================================== */}
    <main className="flex-grow py-8 md:py-12 relative z-10">
        {isLoading && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
                <div className="p-4 rounded-2xl bg-wine/5 dark:bg-gold/10 border border-wine/20 dark:border-gold/30 text-xs font-bold text-wine dark:text-gold flex items-center gap-2 animate-pulse">
                    <i className="ph-bold ph-spinner-gap animate-spin text-base"></i> Đang tải thông tin chi tiết sách từ máy chủ...
                </div>
            </div>
        )}
        {error && !book && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
                <div className="p-5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs font-bold text-rose-700 dark:text-rose-300 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <i className="ph-bold ph-warning-circle text-base"></i>
                        <span>{error}</span>
                    </div>
                    <button type="button" onClick={() => navigate('/')} className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs hover:bg-rose-700 transition">
                        Về Trang Chủ
                    </button>
                </div>
            </div>
        )}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            

            {/* Book Hero Grid (2 Columns: Showcase & Specifications) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
                
                {/* ================= LEFT COLUMN: BOOK 3D SHOWCASE ================= */}
                <div className="lg:col-span-5 flex flex-col items-center">
                    
                    <div className="sticky top-28 w-full max-w-sm flex flex-col items-center">
                        
                        {/* 3D Interactive Book Stage */}
                        <div className="book-stage w-full flex justify-center py-4">
                            <div id="book-card" onClick={handleReadBook} role="button" tabIndex={0} onKeyDown={(event) => {
                                if (event.key === 'Enter' || event.key === ' ') handleReadBook();
                            }} className="book-3d w-[270px] sm:w-[310px] aspect-[2/3] rounded-r-2xl rounded-l-sm relative cursor-pointer select-none shadow-book-real" aria-label="Mở sách để đọc">
                                
                                {/* Spine gradient & crease */}
                                <div className="absolute left-0 top-0 bottom-0 w-5 bg-gradient-to-r from-black/50 via-black/10 to-transparent z-20 rounded-l-sm pointer-events-none"></div>

                                {/* Book Cover Image */}
                                <img src={book?.img_url || book?.img || "/logo.png"} onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src='/logo.png'; }} alt={book?.bookName || book?.title || "Bìa sách"} className="w-full h-full object-cover rounded-r-2xl rounded-l-sm relative z-10" />

                                {/* Realistic dynamic light glare */}
                                <div id="bookGlare" className="book-glare z-20"></div>

                                {/* Top-Right Online Rental Badge */}
                                <div className="absolute top-4 right-4 z-30 flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#8E3038] text-white text-[11px] font-outfit font-black uppercase tracking-wider shadow-md">
                                    <i className="ph-fill ph-book-open-text text-amber-300"></i> Thuê Đọc Online
                                </div>

                                {/* Bottom Metadata Ribbon on Cover */}
                                <div className="absolute bottom-3 left-3 right-3 z-30 bg-black/60 backdrop-blur-md text-white/90 px-3.5 py-2 rounded-xl flex items-center justify-between text-xs font-semibold border border-white/10 shadow-lg">
                                    <span className="flex items-center gap-1.5 text-[11px]">
                                        <i className="ph-fill ph-shield-check text-emerald-400"></i> Bản Quyền Đọc Online
                                    </span>
                                    <span className="font-outfit font-bold text-[11px] text-amber-300">
                                        {book?.totalPages ? `${book.totalPages} Trang Ebook` : 'Bản Đọc Ebook'}
                                    </span>
                                </div>
                            </div>
                        </div>


                    </div>
                </div>

                {/* ================= RIGHT COLUMN: BOOK INFORMATION & ACTIONS ================= */}
                <div className="lg:col-span-7 flex flex-col">
                    
                    {/* Top Category & Reward Badges */}
                    <div className="flex flex-wrap items-center justify-between gap-2.5 mb-2.5">
                        <div className="flex items-center gap-2">
                            <span className="px-3 py-1 rounded-full bg-wine/10 dark:bg-gold/15 text-wine dark:text-gold text-[11px] font-bold font-outfit uppercase tracking-wider">
                                {book?.category_name || (book?.category_id === 1 ? 'Tiểu Thuyết Văn Học' : book?.category_id === 2 ? 'Sách Thiếu Nhi' : book?.category_id === 3 ? 'Kỹ Năng & Phát Triển' : 'Sách Tuyển Chọn')}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="px-3 py-1 rounded-full bg-[#FEF6DF] dark:bg-night-surface text-[#966E12] dark:text-gold text-xs font-bold border border-[#F5E2B0] dark:border-gold/30 flex items-center gap-1.5 shadow-2xs">
                                <i className="ph-fill ph-coins text-gold"></i> +10 Khoai khi đọc xong
                            </span>
                        </div>
                    </div>

                    {/* Book Title (Refined Literary Serif Typography with Lora) */}
                    <h1
                        className="text-3xl sm:text-4xl lg:text-[44px] font-serif font-bold text-ink dark:text-night-text tracking-normal leading-[1.25] mb-4"
                        style={{ fontFamily: "'Lora', 'Merriweather', 'Playfair Display', serif", textRendering: 'optimizeLegibility' }}
                    >
                        {(book?.bookName ? book.bookName.normalize('NFC') : (isLoading ? "Đang tải dữ liệu sách..." : "Chi tiết sách"))}
                    </h1>

                    {/* Ratings & Stats Bar */}
                    <div className="flex flex-wrap items-center gap-2.5 sm:gap-4 pb-5 border-b border-paper-border dark:border-night-border mb-6">
                        <div className="flex items-center gap-1 text-amber-400 text-sm">
                            <i className="ph-fill ph-star"></i>
                            <i className="ph-fill ph-star"></i>
                            <i className="ph-fill ph-star"></i>
                            <i className="ph-fill ph-star"></i>
                            <i className="ph-fill ph-star"></i>
                        </div>
                        <span className="font-outfit font-black text-sm sm:text-base text-ink dark:text-night-text">{calculatedAvgRating}</span>
                        <span className="text-gray-300 dark:text-gray-600">•</span>
                        <a href="#danh-gia" id="topReviewCount" className="text-xs text-ink-muted dark:text-night-muted hover:text-wine dark:hover:text-gold underline underline-offset-4 font-medium">
                            {reviewStatusText}
                        </a>
                        <span className="text-gray-300 dark:text-gray-600">•</span>
                        <span className="text-xs text-ink-muted dark:text-night-muted font-medium flex items-center gap-1.5">
                            <i className="ph-bold ph-book-open text-wine dark:text-gold"></i> {book?.readCount ? `${book.readCount.toLocaleString()} lượt đọc` : '0 lượt đọc'}
                        </span>
                    </div>

                    {/* ================= BOOK ACTION SECTION ================= */}
                    <div id="tuy-chon-thue" className="bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border rounded-3xl p-6 mb-6 shadow-sm">
                        
                        {/* Status notification when book is owned/rented */}
                        {rentStatus.hasAccess && (
                            <div className="mb-5 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs font-outfit">
                                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold">
                                    <i className="ph-fill ph-check-circle text-lg"></i>
                                    <span>Tác phẩm đã mở khóa toàn bộ trong Tủ Sách Cá Nhân</span>
                                </div>
                                <span className="font-black px-3 py-1 rounded-full bg-emerald-600 text-white text-[11px] shadow-xs">
                                    {rentStatus.isForever ? 'Sở Hữu Trọn Đời' : `Còn lại ${rentStatus.remainingDays} ngày`}
                                </span>
                            </div>
                        )}

                        {/* Top Pricing & Ebook Badge */}
                        <div className="flex items-center justify-between flex-wrap gap-3 mb-5 pb-4 border-b border-paper-border/60 dark:border-night-border/60">
                            <div>
                                <span className="text-[11px] font-bold text-ink-muted dark:text-night-muted uppercase tracking-wider block mb-0.5">Quyền Đọc Ebook Bản Quyền</span>
                                <div className="flex items-center gap-2">
                                    <span className="font-outfit font-black text-2xl sm:text-3xl text-wine dark:text-gold flex items-center gap-1.5 leading-none">
                                        {book?.rent_price ? (Number(book.rent_price).toLocaleString('vi-VN') + ' đ') : '2'} {!book?.rent_price && <img src="img/icon-removebg-preview.png" alt="Khoai" className="w-7 h-7 sm:w-8 sm:h-8 object-contain inline-block -mt-1 hover:rotate-6 transition-transform" title="Khoai" />}
                                    </span>
                                    <span className="text-xs text-ink-muted dark:text-night-muted font-medium">/ ngày thuê</span>
                                </div>
                            </div>

                            <div className="text-right">
                                <span className="text-[11px] font-medium text-ink-muted dark:text-night-muted block mb-0.5">Sở hữu trọn đời:</span>
                                <span className="font-outfit font-black text-base text-amber-600 dark:text-gold flex items-center justify-end gap-1">
                                    <i className="ph-fill ph-seal-check text-xs"></i> 39 <img src="img/icon-removebg-preview.png" alt="Khoai" className="w-4 h-4 object-contain inline-block -mt-0.5" title="Khoai" />
                                </span>
                            </div>
                        </div>

                        {/* Primary Action Buttons: Đọc Sách / Đọc Thử & Thuê / Gia Hạn & Tặng Sách trên CÙNG 1 LINE */}
                        {rentStatus.hasAccess ? (
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 mb-4">
                                {/* 1. Đọc Sách Ngay */}
                                <button 
                                    id="btn-read-now" 
                                    type="button" 
                                    onClick={handleReadBook} 
                                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-outfit font-extrabold py-3.5 px-3 rounded-2xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-1.5 text-xs sm:text-sm group cursor-pointer whitespace-nowrap" 
                                    title="Đọc toàn bộ cuốn sách"
                                >
                                    <i className="ph-bold ph-book-open text-base text-emerald-200 group-hover:scale-110 transition-transform"></i>
                                    <span>Đọc Ngay</span>
                                </button>

                                {/* 2. Gia Hạn Thuê Thêm hoặc Đã Sở Hữu */}
                                {rentStatus.isForever ? (
                                    <div className="flex-1 bg-amber-500/10 dark:bg-gold/15 border-2 border-amber-500/40 dark:border-gold/40 text-amber-700 dark:text-gold font-outfit font-extrabold py-3.5 px-3 rounded-2xl flex items-center justify-center gap-1.5 text-xs sm:text-sm whitespace-nowrap">
                                        <i className="ph-fill ph-seal-check text-base"></i>
                                        <span>Trọn Đời</span>
                                    </div>
                                ) : (
                                    <button 
                                        id="btn-rent-book" 
                                        type="button" 
                                        onClick={() => openRentalModal()} 
                                        className="flex-1 bg-wine hover:bg-wine-dark text-white font-outfit font-extrabold py-3.5 px-3 rounded-2xl transition-colors flex items-center justify-center gap-1.5 text-xs sm:text-sm cursor-pointer group shadow-sm whitespace-nowrap" 
                                        title="Gia hạn thời hạn thuê cuốn sách"
                                    >
                                        <i className="ph-bold ph-calendar-plus text-base text-amber-300 group-hover:scale-110 transition-transform"></i>
                                        <span>Gia Hạn Thuê Thêm</span>
                                    </button>
                                )}

                                {/* 3. Tặng Sách Cho Bạn Bè */}
                                <button
                                    id="btn-gift-book"
                                    type="button"
                                    onClick={openGiftModal}
                                    className="flex-1 bg-gradient-to-r from-amber-500/10 via-amber-500/15 to-amber-500/10 hover:from-amber-500/20 hover:to-amber-500/20 dark:from-gold/15 dark:to-gold/20 dark:hover:from-gold/25 dark:hover:to-gold/25 text-amber-700 dark:text-gold border-2 border-amber-500/40 dark:border-gold/50 font-outfit font-extrabold py-3.5 px-3 rounded-2xl transition-all shadow-xs hover:shadow-md flex items-center justify-center gap-1.5 text-xs sm:text-sm group cursor-pointer whitespace-nowrap"
                                    title="Tặng sách này cho bạn bè hoặc người thân"
                                >
                                    <i className="ph-bold ph-gift text-base text-amber-600 dark:text-gold group-hover:scale-125 transition-transform duration-300"></i>
                                    <span>Tặng Sách</span>
                                </button>

                                {/* 4. Yêu Thích */}
                                <button
                                    type="button"
                                    onClick={handleToggleFavorite}
                                    disabled={isFavoriteLoading}
                                    className={`h-[48px] w-[48px] rounded-2xl border flex items-center justify-center text-xl transition-all cursor-pointer shrink-0 shadow-xs ${
                                        isFavorite
                                            ? 'bg-rose-500/15 border-rose-500/40 text-rose-500 shadow-sm'
                                            : 'bg-paper-surface hover:bg-paper-100 dark:bg-night-surface dark:hover:bg-night-card border-paper-border dark:border-night-border text-stone-400 hover:text-rose-500'
                                    }`}
                                    title={isFavorite ? "Bỏ khỏi danh sách Yêu Thích" : "Lưu vào danh sách Yêu Thích"}
                                    aria-label="Yêu thích tác phẩm"
                                >
                                    <i className={`ph-fill ph-heart ${isFavorite ? 'text-rose-500 animate-pulse' : 'text-stone-400 group-hover:text-rose-500'}`}></i>
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 mb-4">
                                {/* 1. Đọc Thử Miễn Phí */}
                                <button 
                                    id="btn-read-now" 
                                    type="button" 
                                    onClick={handleReadBook} 
                                    className="flex-1 bg-paper-surface hover:bg-paper-100 dark:bg-night-surface dark:hover:bg-night-border text-ink dark:text-night-text border-2 border-paper-border dark:border-night-border hover:border-wine/70 dark:hover:border-gold/70 font-outfit font-extrabold py-3.5 px-3 rounded-2xl transition-all shadow-xs hover:shadow-md flex items-center justify-center gap-1.5 text-xs sm:text-sm group cursor-pointer whitespace-nowrap" 
                                    title="Đọc thử cuốn sách"
                                >
                                    <i className="ph-bold ph-book-open text-base text-wine dark:text-gold group-hover:scale-110 transition-transform"></i>
                                    <span className="group-hover:text-wine dark:group-hover:text-gold transition-colors">Đọc Thử {book?.pdf_url ? '(PDF)' : ''}</span>
                                </button>

                                {/* 2. Thuê Sách (Thêm Vào Giỏ) */}
                                <button
                                    id="btn-rent-book"
                                    type="button"
                                    onClick={() => { openRentalModal() }}
                                    className="flex-1 bg-wine hover:bg-wine-dark text-white font-outfit font-extrabold py-3.5 px-3 rounded-2xl transition-colors flex items-center justify-center gap-1.5 text-xs sm:text-sm cursor-pointer group shadow-sm whitespace-nowrap"
                                    title="Chọn gói thuê hoặc mua sách"
                                >
                                    <i className="ph-bold ph-shopping-cart-simple text-base text-amber-300 group-hover:scale-110 transition-transform"></i>
                                    <span>Thuê Sách</span>
                                </button>

                                {/* 3. Tặng Sách */}
                                <button
                                    id="btn-gift-book"
                                    type="button"
                                    onClick={openGiftModal}
                                    className="flex-1 bg-gradient-to-r from-amber-500/10 via-amber-500/15 to-amber-500/10 hover:from-amber-500/20 hover:to-amber-500/20 dark:from-gold/15 dark:to-gold/20 dark:hover:from-gold/25 dark:hover:to-gold/25 text-amber-700 dark:text-gold border-2 border-amber-500/40 dark:border-gold/50 font-outfit font-extrabold py-3.5 px-3 rounded-2xl transition-all shadow-xs hover:shadow-md flex items-center justify-center gap-1.5 text-xs sm:text-sm group cursor-pointer whitespace-nowrap"
                                    title="Tặng sách này cho bạn bè hoặc người thân"
                                >
                                    <i className="ph-bold ph-gift text-base text-amber-600 dark:text-gold group-hover:scale-125 transition-transform duration-300"></i>
                                    <span>Tặng Sách</span>
                                </button>

                                {/* 4. Yêu Thích */}
                                <button
                                    type="button"
                                    onClick={handleToggleFavorite}
                                    disabled={isFavoriteLoading}
                                    className={`h-[48px] w-[48px] rounded-2xl border flex items-center justify-center text-xl transition-all cursor-pointer shrink-0 shadow-xs ${
                                        isFavorite
                                            ? 'bg-rose-500/15 border-rose-500/40 text-rose-500 shadow-sm'
                                            : 'bg-paper-surface hover:bg-paper-100 dark:bg-night-surface dark:hover:bg-night-card border-paper-border dark:border-night-border text-stone-400 hover:text-rose-500'
                                    }`}
                                    title={isFavorite ? "Bỏ khỏi danh sách Yêu Thích" : "Lưu vào danh sách Yêu Thích"}
                                    aria-label="Yêu thích tác phẩm"
                                >
                                    <i className={`ph-fill ph-heart ${isFavorite ? 'text-rose-500 animate-pulse' : 'text-stone-400 group-hover:text-rose-500'}`}></i>
                                </button>
                            </div>
                        )}

                        {/* Micro Feature Assurance List */}
                        <div className="pt-3.5 border-t border-paper-border/60 dark:border-night-border/60 flex flex-wrap items-center justify-between text-[11px] text-ink-muted dark:text-night-muted gap-2">
                            <span className="flex items-center gap-1.5">
                                <i className="ph-bold ph-lightning text-amber-500"></i> Mở khóa đọc tức thì
                            </span>
                            <span className="flex items-center gap-1.5">
                                <i className="ph-bold ph-devices text-wine dark:text-gold"></i> Đọc trên Điện thoại, Tablet, PC
                            </span>
                            <span className="flex items-center gap-1.5">
                                <i className="ph-bold ph-bookmark-simple text-emerald-500"></i> Tự động lưu trang đang đọc
                            </span>
                        </div>

                    </div>

                    {/* ================= THÔNG TIN TÁC PHẨM ================= */}
                    <div className="bg-gradient-to-br from-paper-surface to-paper-50/70 dark:from-night-card dark:to-night-surface/60 border border-paper-border dark:border-night-border rounded-3xl p-5 sm:p-6 shadow-sm">
                        
                        {/* Header with subtle badge */}
                        <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-paper-border/60 dark:border-night-border/60">
                            <h3 className="font-outfit font-black text-xs uppercase tracking-wider text-ink dark:text-night-text">
                                Thông Tin Tác Phẩm
                            </h3>
                            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                <i className="ph-fill ph-check-circle text-xs"></i> Ebook Bản Quyền
                            </span>
                        </div>

                        {/* 3 Streamlined Specs Columns: Tác Giả, Nhà Xuất Bản, Phát Hành (Có icon) */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            
                            {/* 1. Tác giả */}
                            <div className="p-3.5 rounded-2xl bg-paper-50 dark:bg-night-surface border border-paper-border/60 dark:border-night-border/60 flex items-center gap-3 group hover:border-wine/30 dark:hover:border-gold/30 transition-all">
                                <div className="w-9 h-9 rounded-xl bg-wine/10 dark:bg-gold/15 text-wine dark:text-gold flex items-center justify-center text-lg shrink-0 group-hover:scale-105 transition-transform">
                                    <i className="ph-bold ph-user-circle"></i>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted dark:text-night-muted block leading-none mb-1">Tác Giả</span>
                                    <span className="font-outfit font-black text-xs sm:text-sm text-wine dark:text-gold block leading-tight truncate" title={book?.author || "Tác giả"}>
                                        {book?.author || "Đang cập nhật"}
                                    </span>
                                </div>
                            </div>

                            {/* 2. Nhà xuất bản */}
                            <div className="p-3.5 rounded-2xl bg-paper-50 dark:bg-night-surface border border-paper-border/60 dark:border-night-border/60 flex items-center gap-3 group hover:border-wine/30 dark:hover:border-gold/30 transition-all">
                                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-lg shrink-0 group-hover:scale-105 transition-transform">
                                    <i className="ph-bold ph-buildings"></i>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted dark:text-night-muted block leading-none mb-1">Nhà Xuất Bản</span>
                                    <span className="font-outfit font-black text-xs sm:text-sm text-ink dark:text-night-text block leading-tight truncate">
                                        {book?.publisher || "Đang cập nhật"}
                                    </span>
                                </div>
                            </div>

                            {/* 3. Phát hành */}
                            <div className="p-3.5 rounded-2xl bg-paper-50 dark:bg-night-surface border border-paper-border/60 dark:border-night-border/60 flex items-center gap-3 group hover:border-amber-500/40 dark:hover:border-gold/40 transition-all">
                                <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center text-lg shrink-0 group-hover:scale-105 transition-transform">
                                    <i className="ph-bold ph-calendar-blank"></i>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted dark:text-night-muted block leading-none mb-1">Phát Hành</span>
                                    <span className="font-outfit font-black text-xs sm:text-sm text-ink dark:text-night-text block leading-tight truncate">
                                        {book?.yearOfPublished || "2024"}
                                    </span>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>


            {/* ========================================================
                 INTERACTIVE TABS: TÓM TẮT, TRÍCH ĐOẠN, TÁC GIẢ, MỤC LỤC
                 ======================================================== */}
            <section className="mb-16 mt-10 sm:mt-12 lg:mt-14">
                {/* Tab Headers */}
                <div className="flex items-center gap-2 sm:gap-6 border-b border-paper-border dark:border-night-border overflow-x-auto pb-px mb-8 font-outfit text-sm font-bold">
                    <button onClick={() => { switchTab('tab-summary') }} id="btn-tab-summary" className="tab-btn pb-3 px-1 text-wine dark:text-gold border-b-2 border-wine dark:border-gold whitespace-nowrap transition-colors">
                        Tóm Tắt Nội Dung
                    </button>
                    <button onClick={() => { switchTab('tab-excerpts') }} id="btn-tab-excerpts" className="tab-btn pb-3 px-1 text-ink-muted dark:text-night-muted hover:text-ink dark:hover:text-night-text border-b-2 border-transparent whitespace-nowrap transition-colors">
                        Trích Đoạn Cảm Xúc
                    </button>
                    <button onClick={() => { switchTab('tab-author') }} id="btn-tab-author" className="tab-btn pb-3 px-1 text-ink-muted dark:text-night-muted hover:text-ink dark:hover:text-night-text border-b-2 border-transparent whitespace-nowrap transition-colors">
                        Giới Thiệu Tác Giả
                    </button>
                    <button onClick={() => { switchTab('tab-toc') }} id="btn-tab-toc" className="tab-btn pb-3 px-1 text-ink-muted dark:text-night-muted hover:text-ink dark:hover:text-night-text border-b-2 border-transparent whitespace-nowrap transition-colors">
                        Mục Lục
                    </button>
                </div>

                {/* Tab 1: Summary */}
                <div id="tab-summary" className="tab-pane bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border rounded-3xl p-6 sm:p-8 shadow-sm">
                    <h3 className="text-xl font-serif font-bold text-ink dark:text-night-text mb-4">
                        Giới Thiệu Tác Phẩm
                    </h3>
                    <div className="text-sm sm:text-base leading-relaxed text-ink/80 dark:text-night-muted space-y-4 font-normal">
                        {book?.description ? (
                            <p className="whitespace-pre-line leading-relaxed">
                                {book.description}
                            </p>
                        ) : (
                            <p className="italic text-ink-muted">
                                Cuốn sách chưa có phần mô tả tóm tắt chi tiết từ nhà xuất bản.
                            </p>
                        )}
                    </div>
                </div>

                {/* Tab 2: Excerpts */}
                <div id="tab-excerpts" className="tab-pane hidden space-y-4">
                    <div className="bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border rounded-3xl p-6 sm:p-8 shadow-sm">
                        <span className="text-xs font-bold text-wine dark:text-gold uppercase tracking-wider mb-2 block">Lời tựa & Thông điệp</span>
                        <blockquote className="font-serif italic text-base sm:text-lg text-ink dark:text-night-text leading-relaxed">
                            {book?.description ? (
                                `"${book.description.length > 240 ? book.description.slice(0, 240) + '...' : book.description}"`
                            ) : (
                                `"Mỗi cuốn sách là một hải đăng tri thức, soi sáng tâm hồn và mở ra những chân trời mới cho độc giả."`
                            )}
                        </blockquote>
                    </div>
                </div>

                {/* Tab 3: Author */}
                <div id="tab-author" className="tab-pane hidden bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border rounded-3xl p-6 sm:p-8 shadow-sm">
                    <div className="flex flex-col md:flex-row gap-6 items-start">
                        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-br from-wine to-[#681921] text-gold dark:text-gold-light flex flex-col items-center justify-center shrink-0 border-2 border-wine/20 dark:border-gold/30 shadow-md">
                            <i className="ph-duotone ph-feather text-3xl sm:text-4xl mb-1"></i>
                            <span className="font-serif font-bold text-xs tracking-wider uppercase">
                                {book?.author ? book.author.split(' ').map(n => n[0]).join('').slice(0, 3) : 'HALM'}
                            </span>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-xl sm:text-2xl font-serif font-bold text-ink dark:text-night-text mb-2">
                                {book?.author || 'Tác giả đang cập nhật'}
                            </h3>
                            <p className="text-xs sm:text-sm text-wine dark:text-gold font-semibold uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                <i className="ph-bold ph-pen-nib"></i>
                                <span>{book?.category_name || (typeof book?.category === 'object' ? book.category?.category_name : book?.category) || 'Tác phẩm văn học & tri thức'}</span>
                            </p>
                            <p className="text-sm text-ink/80 dark:text-night-muted leading-relaxed mb-4">
                                {book?.author ? (
                                    <>
                                        <strong>{book.author}</strong> là tác giả của tác phẩm <em>"{book.bookName}"</em>. Hiện tại ban biên tập HALM BOOK đang cập nhật hồ sơ chi tiết, tiểu sử và toàn bộ danh mục trước tác của tác giả để bạn đọc tiện tra cứu và tìm hiểu thêm.
                                    </>
                                ) : (
                                    "Thông tin chi tiết về tác giả đang được ban biên tập hoàn thiện và đồng bộ."
                                )}
                            </p>
                            <div className="flex flex-wrap gap-2 text-xs font-semibold">
                                <span className="px-3 py-1.5 rounded-full bg-paper-50 dark:bg-night-surface border border-paper-border dark:border-night-border text-ink dark:text-night-text flex items-center gap-1.5">
                                    <i className="ph-bold ph-book-bookmark text-wine dark:text-gold"></i> Tác phẩm: {book?.bookName || 'Sách'}
                                </span>
                                <span className="px-3 py-1.5 rounded-full bg-paper-50 dark:bg-night-surface border border-paper-border dark:border-night-border text-ink dark:text-night-text flex items-center gap-1.5">
                                    <i className="ph-bold ph-shield-check text-emerald-600 dark:text-emerald-400"></i> Bản quyền phát hành HALM BOOK
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tab 4: Table of Contents */}
                <div id="tab-toc" className="tab-pane hidden bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border rounded-3xl p-6 sm:p-8 shadow-sm">
                    <h3 className="text-lg font-outfit font-black text-ink dark:text-night-text mb-4">Mục Lục Tác Phẩm</h3>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-paper-50 dark:bg-night-surface border border-paper-border dark:border-night-border">
                            <span className="text-sm font-semibold text-ink dark:text-night-text flex items-center gap-2">
                                <i className="ph-bold ph-book-open text-wine dark:text-gold"></i> Chương 1: Miền của tuổi thơ
                            </span>
                            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full">Đọc miễn phí</span>
                        </div>
                        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-paper-50 dark:bg-night-surface border border-paper-border dark:border-night-border">
                            <span className="text-sm font-semibold text-ink dark:text-night-text flex items-center gap-2">
                                <i className="ph-bold ph-book-open text-wine dark:text-gold"></i> Chương 2: Tiếng chim mùa hè
                            </span>
                            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full">Đọc miễn phí</span>
                        </div>
                        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-paper-50 dark:bg-night-surface border border-paper-border dark:border-night-border">
                            <span className="text-sm font-semibold text-ink dark:text-night-text flex items-center gap-2">
                                <i className="ph-bold ph-book-open text-wine dark:text-gold"></i> Chương 3: Những ngã rẽ cuộc đời
                            </span>
                            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full">Đọc miễn phí</span>
                        </div>
                        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-paper-50/50 dark:bg-night-surface/50 border border-dashed border-paper-border dark:border-night-border opacity-70">
                            <span className="text-sm font-medium text-ink-muted dark:text-night-muted flex items-center gap-2">
                                <i className="ph-bold ph-lock-key"></i> Chương 4 đến Kết thúc (28 Chương)
                            </span>
                            <span className="text-xs text-ink-muted dark:text-night-muted">Yêu cầu mở khóa</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* ========================================================
                 RELATED BOOKS: CÙNG TÁC GIẢ
                 ======================================================== */}
            <section className="mb-16">
                {/* Section Header with Left/Right Scroll Controls */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-serif font-bold text-ink dark:text-night-text">
                            Sách Cùng Tác Giả {book?.author ? `(${book.author})` : ''}
                        </h2>
                        <p className="text-xs text-ink-muted dark:text-night-muted mt-0.5">
                            Vuốt hoặc bấm nút mũi tên để xem thêm tác phẩm
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button type="button" onClick={() => { scrollAuthorBooks(-1) }} className="w-8 h-8 rounded-full border border-paper-border dark:border-night-border bg-paper-surface dark:bg-night-card hover:bg-wine hover:text-white dark:hover:bg-gold dark:hover:text-night text-ink dark:text-night-text flex items-center justify-center transition-colors cursor-pointer shadow-xs" title="Lướt sang trái">
                            <i className="ph-bold ph-caret-left"></i>
                        </button>
                        <button type="button" onClick={() => { scrollAuthorBooks(1) }} className="w-8 h-8 rounded-full border border-paper-border dark:border-night-border bg-paper-surface dark:bg-night-card hover:bg-wine hover:text-white dark:hover:bg-gold dark:hover:text-night text-ink dark:text-night-text flex items-center justify-center transition-colors cursor-pointer shadow-xs" title="Lướt sang phải">
                            <i className="ph-bold ph-caret-right"></i>
                        </button>
                        <Link to={`/danhmuc?q=${encodeURIComponent(book?.author || '')}`} className="ml-2 text-xs font-bold text-wine dark:text-gold hover:underline hidden sm:inline-flex items-center gap-1">
                            Tất cả <i className="ph-bold ph-arrow-right text-[10px]"></i>
                        </Link>
                    </div>
                </div>

                {/* Horizontal Scrollable Rail (Khung card sách cùng tác giả chuẩn tỉ lệ HALM) */}
                <div id="authorBooksSlider" className="flex min-h-24 items-stretch gap-4 sm:gap-5 overflow-x-auto scroll-smooth py-2 px-1 snap-x snap-mandatory" style={{scrollbarWidth: "none", MsOverflowStyle: "none"}}>
                    {isAuthorBooksLoading ? (
                        <div className="w-full py-8 flex items-center justify-center gap-3 text-ink-muted dark:text-night-muted">
                            <div className="w-5 h-5 rounded-full border-2 border-wine dark:border-gold border-t-transparent animate-spin"></div>
                            <span className="text-xs font-metadata">Đang tải danh sách tác phẩm cùng tác giả...</span>
                        </div>
                    ) : authorBooks.length === 0 ? (
                        <div className="w-full rounded-2xl border border-dashed border-paper-border dark:border-night-border px-5 py-7 text-center text-xs text-ink-muted dark:text-night-muted">
                            Tác giả hiện chưa có thêm tác phẩm nào khác trong thư viện HALM.
                        </div>
                    ) : (
                        authorBooks.map((item) => {
                            const itemId = item.book_id || item.id;
                            const itemTitle = (item.bookName || item.title || '').normalize('NFC');
                            const itemAuthor = item.author || 'HALM BOOK';
                            const itemCover = item.img_url || item.cover || '/logo.png';
                            const itemCategory = item.category_name || item.category?.category_name || 'Văn học';
                            const itemRating = item.rating || '5.0';
                            const itemPrice = (item.rent_price !== undefined && item.rent_price !== null) ? item.rent_price : 9;

                            return (
                                <div 
                                    key={itemId}
                                    className="w-[170px] sm:w-[195px] shrink-0 snap-start p-3 rounded-2xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border hover:-translate-y-1.5 hover:shadow-xl hover:border-wine/40 dark:hover:border-gold/40 transition-all duration-300 group flex flex-col justify-between"
                                >
                                    <div>
                                        <Link 
                                            to={`/chitietsach/${itemId}`}
                                            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                                            className="block relative w-full aspect-[2/3] rounded-xl overflow-hidden bg-night-surface shadow-md mb-2.5 cursor-pointer"
                                        >
                                            <img 
                                                src={itemCover} 
                                                alt={itemTitle} 
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                loading="lazy"
                                                onError={(e) => { e.currentTarget.src = '/logo.png'; }}
                                            />
                                            <div className="font-metadata absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-full bg-black/75 backdrop-blur-sm text-[9px] text-amber-300 font-bold flex items-center gap-0.5 shadow">
                                                <i className="ph-fill ph-star text-amber-400"></i> {itemRating}
                                            </div>
                                            <div className="font-metadata absolute bottom-1.5 inset-x-1.5 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-sm text-[8px] text-stone-200 font-medium truncate uppercase">
                                                {itemCategory}
                                            </div>
                                        </Link>

                                        <div className="space-y-1">
                                            <Link
                                                to={`/chitietsach/${itemId}`}
                                                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                                                className="block"
                                            >
                                                <h4 
                                                    className="font-display font-bold text-xs sm:text-[13px] text-ink dark:text-night-text line-clamp-1 group-hover:text-wine dark:group-hover:text-gold transition-colors cursor-pointer"
                                                    title={itemTitle}
                                                >
                                                    {itemTitle}
                                                </h4>
                                            </Link>
                                            <p className="font-metadata text-[11px] text-ink-muted dark:text-night-muted line-clamp-1">
                                                {itemAuthor}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="pt-2.5 mt-2.5 border-t border-paper-border/70 dark:border-night-border/70 flex items-center justify-between">
                                        <div>
                                            <span className="font-display font-black text-xs sm:text-[13px] text-wine dark:text-gold flex items-center gap-1">
                                                <span>🥔</span> {itemPrice} Khoai
                                            </span>
                                            <span className="text-[9px] font-metadata text-ink-muted dark:text-night-muted block leading-none">
                                                Gói 7 ngày
                                            </span>
                                        </div>
                                        <Link 
                                            to={`/chitietsach/${itemId}`}
                                            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                                            className="px-2.5 py-1.5 rounded-xl bg-wine hover:bg-wine-light text-white dark:bg-gold dark:hover:bg-gold-light dark:text-night-bg font-metadata font-bold text-[10px] flex items-center gap-1 shadow-xs hover:shadow transition-all active:scale-95 cursor-pointer"
                                        >
                                            <i className="ph-bold ph-eye text-xs"></i> <span>Xem</span>
                                        </Link>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </section>

            {/* ========================================================
                 REVIEWS & RATINGS SECTION (CẢM NHẬN BẠN ĐỌC)
                 ======================================================== */}
            <section id="danh-gia" className="bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border rounded-3xl p-6 sm:p-10 shadow-sm mb-16">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-ink dark:text-night-text">
                            Cảm Nhận Bạn Đọc
                        </h2>
                        <p className="text-xs sm:text-sm text-ink-muted dark:text-night-muted mt-1">
                            Chia sẻ suy nghĩ và đánh giá của bạn về cuốn sách này
                        </p>
                    </div>

                    {/* Rating Score Highlight */}
                    <div className="flex items-center gap-3 bg-paper-50 dark:bg-night-surface px-4 py-2.5 rounded-2xl border border-paper-border dark:border-night-border self-start sm:self-auto">
                        <span id="avgRatingScore" className="text-3xl font-outfit font-black text-wine dark:text-gold">{calculatedAvgRating}</span>
                        <div className="flex flex-col">
                            <div className="flex text-amber-400 text-xs">
                                {[1, 2, 3, 4, 5].map(s => (
                                    <i key={s} className={Math.round(Number(calculatedAvgRating)) >= s ? "ph-fill ph-star" : "ph-bold ph-star text-gray-300 dark:text-gray-600"}></i>
                                ))}
                            </div>
                            <span id="totalReviewsCountText" className="text-[11px] font-bold text-ink-muted dark:text-night-muted">
                                {totalReviewCount === 0 ? "Chưa có đánh giá" : `${totalReviewCount} đánh giá`}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Input Review Box */}
                <div className="bg-paper-50 dark:bg-night-surface p-5 sm:p-6 rounded-2xl border border-paper-border dark:border-night-border mb-8 shadow-inner">
                    <div className="flex gap-4 items-start">
                        <div className="w-11 h-11 rounded-full bg-wine text-white font-serif font-bold text-base flex items-center justify-center shrink-0 shadow-sm">
                            H
                        </div>
                        <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                                <span className="text-xs font-semibold text-ink-muted dark:text-night-muted uppercase tracking-wider">Đánh giá của bạn:</span>
                                <div id="ratingStars" className="flex text-amber-400 text-lg gap-1.5 cursor-pointer">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <i
                                            key={star}
                                            onMouseEnter={() => setHoverStar(star)}
                                            onMouseLeave={() => setHoverStar(0)}
                                            onClick={() => setSelectedStar(star)}
                                            className={`transition-colors cursor-pointer ${
                                                (hoverStar || selectedStar) >= star
                                                    ? "ph-fill ph-star text-amber-400"
                                                    : "ph-bold ph-star text-gray-300 dark:text-gray-600 hover:text-amber-400"
                                            }`}
                                            title={`${star} sao`}
                                        ></i>
                                    ))}
                                </div>
                                <span id="ratingFeedback" className="text-xs text-wine dark:text-gold font-bold ml-2">
                                    {hoverStar || selectedStar}/5 sao — {STAR_FEEDBACK_TEXTS[(hoverStar || selectedStar) - 1] || "Tuyệt tác!"}
                                </span>
                            </div>

                            <textarea
                                id="commentInput"
                                rows="3"
                                value={commentInput}
                                disabled={isSubmittingReview}
                                onChange={(e) => setCommentInput(e.target.value)}
                                placeholder="Bạn cảm nhận thế nào về câu chuyện này? Hãy chia sẻ nhé..."
                                className="w-full bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border p-3.5 rounded-xl text-sm text-ink dark:text-night-text placeholder-ink-muted focus:outline-none focus:border-wine dark:focus:border-gold transition resize-none disabled:opacity-60"
                            ></textarea>
                            
                            <div className="flex items-center justify-end gap-3 mt-3">
                                <button
                                    type="button"
                                    disabled={isSubmittingReview}
                                    onClick={() => { setCommentInput(''); setSelectedStar(5); setHoverStar(0); }}
                                    className="px-4 py-2 text-xs font-semibold text-ink-muted dark:text-night-muted hover:bg-paper-200 dark:hover:bg-night-card rounded-xl transition cursor-pointer disabled:opacity-50"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="button"
                                    id="btnPostComment"
                                    disabled={isSubmittingReview || !commentInput.trim()}
                                    onClick={handlePostReview}
                                    className="bg-wine hover:bg-wine-dark disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2"
                                >
                                    {isSubmittingReview ? (
                                        <>
                                            <i className="ph-bold ph-spinner animate-spin text-sm"></i>
                                            <span>Đang gửi cảm nhận...</span>
                                        </>
                                    ) : (
                                        <>
                                            <i className="ph-bold ph-paper-plane-tilt"></i>
                                            <span>Đăng Bình Luận</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Review Feed List */}
                <div id="reviewList" className="space-y-4">
                    {isLoadingReviews ? (
                        <div className="py-10 text-center text-ink-muted dark:text-night-muted">
                            <i className="ph-bold ph-spinner animate-spin text-2xl mb-2 text-wine dark:text-gold block mx-auto"></i>
                            <span className="text-xs font-semibold">Đang tải cảm nhận bạn đọc...</span>
                        </div>
                    ) : reviews.length === 0 ? (
                        <div id="emptyReviewNotice" className="text-center py-12 px-4 bg-paper-50/70 dark:bg-night-surface/60 rounded-2xl border border-dashed border-paper-border dark:border-night-border text-ink-muted dark:text-night-muted">
                            <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-paper-100 dark:bg-night-surface flex items-center justify-center text-wine dark:text-gold shadow-sm">
                                <i className="ph-duotone ph-chat-centered-text text-2xl"></i>
                            </div>
                            <h4 className="text-sm font-bold text-ink dark:text-night-text mb-1">Chưa có cảm nhận nào từ bạn đọc</h4>
                            <p className="text-xs text-ink-muted dark:text-night-muted max-w-sm mx-auto leading-relaxed">
                                Hãy là người đầu tiên chia sẻ suy nghĩ và cảm nhận của bạn về cuốn sách này!
                            </p>
                        </div>
                    ) : (
                        reviews.map((rev) => (
                            <div key={rev.evaluateId} className="review-item p-5 rounded-2xl bg-paper-50 dark:bg-night-surface border border-paper-border dark:border-night-border animate-fade-in">
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        {rev.avatarUrl ? (
                                            <img src={rev.avatarUrl} alt={rev.customerName} className="w-10 h-10 rounded-full object-cover shrink-0 border border-paper-border" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-wine/10 dark:bg-wine/30 text-wine dark:text-gold font-bold font-serif flex items-center justify-center shrink-0">
                                                {rev.customerName ? rev.customerName.charAt(0).toUpperCase() : 'Đ'}
                                            </div>
                                        )}
                                        <div>
                                            <h4 className="font-bold text-sm text-ink dark:text-night-text flex items-center gap-1.5">
                                                {rev.customerName || "Độc giả HALM"}
                                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full font-sans flex items-center gap-1">
                                                    <i className="ph-bold ph-book-open"></i> Độc giả HALM
                                                </span>
                                            </h4>
                                            <span className="text-[11px] text-ink-muted dark:text-night-muted">{rev.createdAt || "Vừa xong"}</span>
                                        </div>
                                    </div>
                                    <div className="flex text-amber-400 text-xs">
                                        {[1, 2, 3, 4, 5].map((s) => (
                                            <i key={s} className={rev.star >= s ? "ph-fill ph-star" : "ph-bold ph-star text-gray-300 dark:text-gray-600"}></i>
                                        ))}
                                    </div>
                                </div>
                                <p className="text-sm text-ink/80 dark:text-night-muted leading-relaxed pl-0 sm:pl-13 mb-3 whitespace-pre-wrap">
                                    "{rev.content}"
                                </p>
                                <div className="flex items-center gap-4 text-xs text-ink-muted dark:text-night-muted pl-0 sm:pl-13">
                                    <button
                                        type="button"
                                        onClick={() => handleLikeReview(rev.evaluateId)}
                                        className="flex items-center gap-1 hover:text-wine dark:hover:text-gold transition font-bold cursor-pointer"
                                    >
                                        <i className="ph-bold ph-thumbs-up"></i> <span>{rev.likesCount || 0}</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setActiveReplyId(activeReplyId === rev.evaluateId ? null : rev.evaluateId);
                                            setReplyInputText("");
                                        }}
                                        className="flex items-center gap-1 hover:text-wine dark:hover:text-gold transition font-bold cursor-pointer"
                                    >
                                        <i className="ph-bold ph-chat-teardrop-dots"></i> Phản hồi
                                    </button>
                                </div>

                                {/* Form phản hồi mở rộng */}
                                {activeReplyId === rev.evaluateId && (
                                    <div className="mt-3 pl-0 sm:pl-13 pt-3 border-t border-paper-border/60 dark:border-night-border/60 animate-fade-in">
                                        <div className="flex items-start gap-2.5 sm:gap-3 bg-paper-100/70 dark:bg-night-surface/90 p-3 sm:p-3.5 rounded-2xl border border-paper-border/70 dark:border-night-border/70">
                                            <div className="w-8 h-8 rounded-full bg-wine text-white font-bold flex items-center justify-center shrink-0 text-xs shadow-2xs">
                                                B
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <textarea
                                                    rows="2"
                                                    value={replyInputText}
                                                    disabled={isSubmittingReply}
                                                    onChange={(e) => setReplyInputText(e.target.value)}
                                                    placeholder={`Nhập phản hồi của bạn cho ${rev.customerName || "độc giả"}...`}
                                                    className="w-full bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border p-2.5 rounded-xl text-xs sm:text-sm text-ink dark:text-night-text placeholder-ink-muted focus:outline-none focus:border-wine dark:focus:border-gold transition resize-none disabled:opacity-60"
                                                ></textarea>
                                                <div className="flex items-center justify-end gap-2 mt-2">
                                                    <button
                                                        type="button"
                                                        disabled={isSubmittingReply}
                                                        onClick={() => { setActiveReplyId(null); setReplyInputText(""); }}
                                                        className="px-3 py-1.5 text-xs font-semibold text-ink-muted dark:text-night-muted hover:bg-paper-200 dark:hover:bg-night-card rounded-lg transition cursor-pointer"
                                                    >
                                                        Hủy
                                                    </button>
                                                    <button
                                                        type="button"
                                                        disabled={isSubmittingReply || !replyInputText.trim()}
                                                        onClick={() => handleSubmitReply(rev.evaluateId)}
                                                        className="bg-wine hover:bg-wine-dark disabled:opacity-50 text-white px-4 py-1.5 text-xs font-bold rounded-lg shadow-sm transition cursor-pointer flex items-center gap-1"
                                                    >
                                                        {isSubmittingReply ? (
                                                            <>
                                                                <i className="ph-bold ph-spinner animate-spin"></i>
                                                                <span>Đang gửi...</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <i className="ph-bold ph-paper-plane-tilt"></i>
                                                                <span>Gửi phản hồi</span>
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Danh sách phản hồi con (Replies) */}
                                {rev.replies && rev.replies.length > 0 && (
                                    <div className="space-y-2 mt-3 pl-0 sm:pl-13 border-t border-paper-border/40 dark:border-night-border/40 pt-2.5">
                                        {rev.replies.map((reply) => (
                                            <div key={reply.evaluateId} className="flex items-start gap-2.5 bg-paper-100/60 dark:bg-night-surface/60 p-3 rounded-xl border border-paper-border/50 dark:border-night-border/50 text-xs">
                                                <div className="w-7 h-7 rounded-full bg-wine text-white font-bold flex items-center justify-center shrink-0 text-[11px] shadow-2xs">
                                                    {reply.customerName ? reply.customerName.charAt(0).toUpperCase() : 'B'}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-0.5">
                                                        <span className="font-bold text-ink dark:text-night-text">{reply.customerName || "Độc giả"}</span>
                                                        <span className="text-[10px] text-ink-muted dark:text-night-muted">{reply.createdAt || "Vừa xong"}</span>
                                                    </div>
                                                    <p className="text-ink/90 dark:text-night-muted leading-relaxed text-xs">
                                                        {reply.content}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </section>

        </div>
    </main>

    {/* ========================================================
         FOOTER
         ======================================================== */}
    

    {/* ========================================================
         FLOATING AI CHATBOT MASCOT BUTTON (TÍCH HỢP TRỰC TIẾP API)
         ======================================================== */}
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end">
        
        {/* Chatbot Popup Window */}
        {isChatbotOpen && (
            <div id="chatbotPopup" className="w-80 sm:w-96 bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border rounded-3xl shadow-2xl overflow-hidden mb-3 transition-all duration-300 animate-fade-in flex flex-col">
                {/* Header */}
                <div className="bg-wine dark:bg-wine-dark p-4 text-white flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-2.5">
                        <img src="img/icon-removebg-preview.png" alt="HALM AI" className="w-8 h-8 object-contain" />
                        <div>
                            <h4 className="font-outfit font-black text-sm">Trợ Lý Sách HALM AI</h4>
                            <span className="text-[10px] text-emerald-300 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Sẵn sàng giải đáp
                            </span>
                        </div>
                    </div>
                    <button type="button" onClick={() => setIsChatbotOpen(false)} className="text-white/80 hover:text-white text-lg p-1 transition-colors cursor-pointer" title="Đóng chat">
                        <i className="ph-bold ph-x"></i>
                    </button>
                </div>

                {/* Chat messages body */}
                <div ref={chatBodyRef} id="chatMessages" className="p-4 h-64 overflow-y-auto space-y-3 text-xs bg-paper-50/50 dark:bg-night-surface/50">
                    {chatMessages.length === 0 ? (
                        <div className="text-center py-6 text-ink-muted dark:text-night-muted">
                            <i className="ph-bold ph-sparkle text-2xl text-wine dark:text-gold mb-1 block"></i>
                            <p>Xin chào! Mình có thể hỗ trợ gì về cuốn sách này?</p>
                        </div>
                    ) : (
                        chatMessages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start items-start gap-2'} animate-fade-in`}>
                                {msg.sender === 'bot' && (
                                    <img src="img/icon-removebg-preview.png" className="w-6 h-6 object-contain shrink-0 mt-0.5" alt="AI" />
                                )}
                                <div className={`p-3 rounded-2xl text-xs leading-relaxed max-w-[85%] whitespace-pre-wrap ${
                                    msg.sender === 'user'
                                        ? 'bg-wine text-white rounded-tr-xs shadow-xs'
                                        : 'bg-paper-100 dark:bg-night-surface text-ink dark:text-night-text rounded-tl-xs border border-paper-border/70 dark:border-night-border/70 shadow-xs'
                                }`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))
                    )}
                    {isChatbotLoading && (
                        <div className="flex items-center gap-2 text-ink-muted dark:text-night-muted text-xs animate-fade-in pl-8">
                            <span className="w-2 h-2 rounded-full bg-wine dark:text-gold animate-bounce"></span>
                            <span className="w-2 h-2 rounded-full bg-wine dark:text-gold animate-bounce [animation-delay:0.2s]"></span>
                            <span className="w-2 h-2 rounded-full bg-wine dark:text-gold animate-bounce [animation-delay:0.4s]"></span>
                            <span className="text-[11px] ml-1">HALM AI đang soạn phản hồi...</span>
                        </div>
                    )}
                </div>

                {/* Quick Suggestion Chips */}
                <div className="px-3 pb-2 pt-1 flex gap-1.5 overflow-x-auto text-[11px] font-bold bg-paper-surface dark:bg-night-card border-t border-paper-border/40 dark:border-night-border/40" style={{scrollbarWidth: 'none'}}>
                    <button
                        type="button"
                        onClick={() => handleSendChatMessage(`Tóm tắt ý nghĩa và bài học của cuốn sách ${book?.bookName || ''}`)}
                        className="px-2.5 py-1 rounded-full bg-paper-100 dark:bg-night-surface text-wine dark:text-gold shrink-0 border border-paper-border dark:border-night-border hover:bg-wine/10 dark:hover:bg-gold/15 transition-colors cursor-pointer"
                    >
                        💡 Ý nghĩa tác phẩm
                    </button>
                    <button
                        type="button"
                        onClick={() => handleSendChatMessage(`Giới thiệu về phong cách sáng tác của tác giả ${book?.author || ''}`)}
                        className="px-2.5 py-1 rounded-full bg-paper-100 dark:bg-night-surface text-wine dark:text-gold shrink-0 border border-paper-border dark:border-night-border hover:bg-wine/10 dark:hover:bg-gold/15 transition-colors cursor-pointer"
                    >
                        🌿 Về tác giả
                    </button>
                </div>

                {/* Input bar */}
                <div className="p-3 border-t border-paper-border dark:border-night-border flex items-center gap-2 bg-paper-surface dark:bg-night-card">
                    <input
                        type="text"
                        id="chatInput"
                        value={chatInputText}
                        disabled={isChatbotLoading}
                        onChange={(e) => setChatInputText(e.target.value)}
                        placeholder="Hỏi bất kỳ điều gì..."
                        className="flex-1 bg-paper-50 dark:bg-night-surface px-3 py-2 rounded-xl text-xs text-ink dark:text-night-text focus:outline-none focus:border-wine dark:focus:border-gold border border-paper-border dark:border-night-border disabled:opacity-60"
                        onKeyDown={(event) => { if (event.key === 'Enter') handleSendChatMessage(); }}
                    />
                    <button
                        type="button"
                        disabled={isChatbotLoading || !chatInputText.trim()}
                        onClick={() => handleSendChatMessage()}
                        className="p-2 rounded-xl bg-wine hover:bg-wine-dark disabled:opacity-50 text-white text-sm transition-colors cursor-pointer shadow-xs"
                    >
                        <i className="ph-bold ph-paper-plane-tilt"></i>
                    </button>
                </div>
            </div>
        )}

        {/* Floating Mascot Trigger Button */}
        <button
            id="chatbotTriggerBtn"
            type="button"
            onClick={() => setIsChatbotOpen(prev => !prev)}
            className="w-14 h-14 rounded-full bg-gradient-to-tr from-wine via-wine-light to-amber-600 text-white p-2 flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer group relative"
            title="Mở Trợ lý Sách HALM AI"
        >
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 border-2 border-white dark:border-night-card rounded-full"></span>
            <img src="img/icon-removebg-preview.png" alt="Chatbot" className="w-full h-full object-contain group-hover:rotate-12 transition-transform" />
        </button>
    </div>

    {/* ================= RENTAL SELECTION MODAL ================= */}
    <div id="rentalModalBackdrop" onClick={() => { closeRentalModal() }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] opacity-0 pointer-events-none transition-opacity duration-300"></div>
    <div id="rentalModal" className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[92%] sm:w-full max-w-lg bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border rounded-3xl z-[10000] opacity-0 pointer-events-none scale-95 transition-all duration-300 ease-out shadow-2xl p-6 sm:p-7 max-h-[90vh] overflow-y-auto">
        
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-paper-border dark:border-night-border mb-5">
            <div className="flex items-center gap-3">
                <img src={book?.img_url || book?.img || '/logo.png'} alt={book?.bookName || "Bìa sách"} className="w-12 h-16 object-cover rounded-xl shadow-md shrink-0 border border-paper-border/60 dark:border-night-border/60" />
                <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-wine dark:text-gold bg-wine/10 dark:bg-gold/15 px-2 py-0.5 rounded-md inline-block mb-1">Thuê Hoặc Mua Ebook</span>
                    <h3 className="font-outfit font-black text-base text-ink dark:text-night-text leading-tight">{book?.bookName || 'Chi tiết ấn phẩm'}</h3>
                    <p className="text-xs text-ink-muted dark:text-night-muted mt-0.5">{book?.author || 'Tác giả đang cập nhật'} • HALM BOOK</p>
                </div>
            </div>
            <button type="button" onClick={() => { closeRentalModal() }} className="w-8 h-8 rounded-full bg-paper-100 dark:bg-night-surface hover:bg-paper-200 dark:hover:bg-night-border text-ink-muted hover:text-ink dark:hover:text-night-text flex items-center justify-center transition-colors cursor-pointer shrink-0" title="Đóng">
                <i className="ph-bold ph-x text-base"></i>
            </button>
        </div>

        {/* Modal Body: Select Plan */}
        <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-bold uppercase tracking-wider text-ink-muted dark:text-night-muted font-outfit">
                    Chọn Gói Thuê Hoặc Mua Đứt:
                </label>
                <span className="text-[11px] text-wine dark:text-gold font-medium">1 chạm chọn gói</span>
            </div>

            <div className="space-y-3" id="rentalPlansContainer">
                
                {/* Plan 1: 1 Ngày */}
                <div onClick={() => { selectRentalModalPlan('1') }} id="planCard_1" className="rental-modal-card p-3.5 rounded-2xl border-2 border-paper-border/80 dark:border-night-border/80 hover:border-wine/50 dark:hover:border-gold/50 bg-paper-50 dark:bg-night-surface flex items-center justify-between cursor-pointer transition-all group">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center text-xl shrink-0 group-hover:scale-110 transition-transform">
                            <i className="ph-bold ph-lightning"></i>
                        </div>
                        <div>
                            <div className="font-outfit font-black text-sm text-ink dark:text-night-text flex items-center gap-1.5">
                                1 Ngày <span className="text-[11px] font-normal text-ink-muted dark:text-night-muted">(24 Giờ)</span>
                            </div>
                            <div className="text-[11px] text-ink-muted dark:text-night-muted">Phù hợp trải nghiệm đọc nhanh trong ngày</div>
                        </div>
                    </div>
                    <div className="text-right flex items-center gap-2.5">
                        <span className="font-outfit font-black text-base text-ink dark:text-night-text flex items-center gap-1">2 <img src="img/icon-removebg-preview.png" alt="Khoai" className="w-4 h-4 object-contain inline-block -mt-0.5" title="Khoai" /></span>
                        <div id="checkIcon_1" className="w-5 h-5 rounded-full border border-gray-300 dark:border-night-border flex items-center justify-center text-xs text-transparent transition-all">
                            <i className="ph-bold ph-check"></i>
                        </div>
                    </div>
                </div>

                {/* Plan 2: 3 Ngày */}
                <div onClick={() => { selectRentalModalPlan('3') }} id="planCard_3" className="rental-modal-card p-3.5 rounded-2xl border-2 border-paper-border/80 dark:border-night-border/80 hover:border-wine/50 dark:hover:border-gold/50 bg-paper-50 dark:bg-night-surface flex items-center justify-between cursor-pointer transition-all group">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center text-xl shrink-0 group-hover:scale-110 transition-transform">
                            <i className="ph-bold ph-calendar"></i>
                        </div>
                        <div>
                            <div className="font-outfit font-black text-sm text-ink dark:text-night-text flex items-center gap-1.5">
                                3 Ngày <span className="text-[11px] font-normal text-ink-muted dark:text-night-muted">(Cuối Tuần)</span>
                            </div>
                            <div className="text-[11px] text-ink-muted dark:text-night-muted">Thời gian thong thả thư giãn cuối tuần</div>
                        </div>
                    </div>
                    <div className="text-right flex items-center gap-2.5">
                        <span className="font-outfit font-black text-base text-ink dark:text-night-text flex items-center gap-1">5 <img src="img/icon-removebg-preview.png" alt="Khoai" className="w-4 h-4 object-contain inline-block -mt-0.5" title="Khoai" /></span>
                        <div id="checkIcon_3" className="w-5 h-5 rounded-full border border-gray-300 dark:border-night-border flex items-center justify-center text-xs text-transparent transition-all">
                            <i className="ph-bold ph-check"></i>
                        </div>
                    </div>
                </div>

                {/* Plan 3: 7 Ngày (Default Selected) */}
                <div onClick={() => { selectRentalModalPlan('7') }} id="planCard_7" className="rental-modal-card p-3.5 rounded-2xl border-2 border-wine dark:border-gold bg-wine/5 dark:bg-gold/10 flex items-center justify-between cursor-pointer transition-all group shadow-sm ring-1 ring-wine/20 dark:ring-gold/30">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-wine text-white dark:bg-gold dark:text-night flex items-center justify-center text-xl shrink-0 group-hover:scale-110 transition-transform shadow-xs">
                            <i className="ph-bold ph-star"></i>
                        </div>
                        <div>
                            <div className="font-outfit font-black text-sm text-wine dark:text-gold flex items-center gap-2">
                                7 Ngày (1 Tuần)
                                <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-wine text-white dark:bg-gold dark:text-night shadow-2xs">Khuyên Dùng</span>
                            </div>
                            <div className="text-[11px] text-ink-muted dark:text-night-muted">Đọc thoải mái, tiết kiệm nhất (~35%)</div>
                        </div>
                    </div>
                    <div className="text-right flex items-center gap-2.5">
                        <span className="font-outfit font-black text-base text-wine dark:text-gold flex items-center gap-1">9 <img src="img/icon-removebg-preview.png" alt="Khoai" className="w-4 h-4 object-contain inline-block -mt-0.5" title="Khoai" /></span>
                        <div id="checkIcon_7" className="w-5 h-5 rounded-full bg-wine text-white dark:bg-gold dark:text-night flex items-center justify-center text-xs shadow-2xs">
                            <i className="ph-bold ph-check"></i>
                        </div>
                    </div>
                </div>

                {/* Plan 4: Mua Đứt Vĩnh Viễn */}
                <div onClick={() => { selectRentalModalPlan('forever') }} id="planCard_forever" className="rental-modal-card p-3.5 rounded-2xl border-2 border-paper-border/80 dark:border-night-border/80 hover:border-amber-500/50 dark:hover:border-gold/50 bg-paper-50 dark:bg-night-surface flex items-center justify-between cursor-pointer transition-all group">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-gold flex items-center justify-center text-xl shrink-0 group-hover:scale-110 transition-transform shadow-xs">
                            <i className="ph-fill ph-seal-check"></i>
                        </div>
                        <div>
                            <div className="font-outfit font-black text-sm text-ink dark:text-night-text flex items-center gap-2">
                                Mua Đứt Vĩnh Viễn
                                <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-gold border border-amber-500/30">Sở Hữu Trọn Đời</span>
                            </div>
                            <div className="text-[11px] text-ink-muted dark:text-night-muted">Đọc không giới hạn thời gian, vĩnh viễn trong Tủ Sách</div>
                        </div>
                    </div>
                    <div className="text-right flex items-center gap-2.5">
                        <span className="font-outfit font-black text-base text-ink dark:text-night-text flex items-center gap-1">39 <img src="img/icon-removebg-preview.png" alt="Khoai" className="w-4 h-4 object-contain inline-block -mt-0.5" title="Khoai" /></span>
                        <div id="checkIcon_forever" className="w-5 h-5 rounded-full border border-gray-300 dark:border-night-border flex items-center justify-center text-xs text-transparent transition-all">
                            <i className="ph-bold ph-check"></i>
                        </div>
                    </div>
                </div>

            </div>
        </div>

        {/* Modal Footer: Potato balance & Add to cart button */}
        <div className="pt-4 border-t border-paper-border dark:border-night-border space-y-3.5">
            <div className="flex items-center justify-between text-xs">
                <span className="text-ink-muted dark:text-night-muted">Số dư Khoai của bạn:</span>
                <span className="font-outfit font-bold text-ink dark:text-night-text flex items-center gap-1">
                    <span id="rentalModalUserKhoai">{userKhoai.toLocaleString()}</span> <i className="ph-fill ph-coins text-gold"></i>
                </span>
            </div>

            <button type="button" id="btnConfirmAddToCart" onClick={() => { confirmRentalModalAddToCart() }} className="w-full bg-wine hover:bg-wine-dark text-white font-outfit font-black py-4 px-6 rounded-2xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2.5 text-sm cursor-pointer group">
                <i className="ph-bold ph-shopping-cart-simple text-lg group-hover:scale-110 transition-transform text-amber-300"></i>
                <span id="confirmAddToCartBtnText">Thêm Vào Giỏ Hàng (Thuê 7 Ngày - 9 Khoai)</span>
            </button>
        </div>

    </div>

    {/* ================= SLIDE-OVER CART DRAWER ================= */}
    <div id="cartDrawerBackdrop" onClick={() => { toggleCartDrawer(false) }} className="fixed inset-0 bg-black/50 backdrop-blur-xs z-[9999] opacity-0 pointer-events-none transition-opacity duration-300"></div>
    <div id="cartDrawer" className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-paper-surface dark:bg-night-card border-l border-paper-border dark:border-night-border z-[10000] translate-x-full transition-transform duration-300 ease-in-out flex flex-col shadow-2xl">
        {/* Drawer Header */}
        <div className="p-5 border-b border-paper-border dark:border-night-border flex items-center justify-between">
            <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-wine/10 dark:bg-gold/15 text-wine dark:text-gold flex items-center justify-center text-lg">
                    <i className="ph-bold ph-shopping-cart-simple"></i>
                </div>
                <div>
                    <h3 className="font-outfit font-black text-base text-ink dark:text-night-text">Giỏ Hàng Thuê & Mua Sách</h3>
                    <p className="text-xs text-ink-muted dark:text-night-muted"><span id="cartDrawerItemCount">0</span> ấn phẩm trong giỏ</p>
                </div>
            </div>
            <button type="button" onClick={() => { toggleCartDrawer(false) }} className="p-2 rounded-xl text-ink-muted hover:text-ink dark:hover:text-night-text hover:bg-paper-100 dark:hover:bg-night-surface transition-colors cursor-pointer" title="Đóng giỏ hàng">
                <i className="ph-bold ph-x text-lg"></i>
            </button>
        </div>

        {/* Cart Items List (Dynamic) */}
        <div id="cartItemsList" className="flex-1 overflow-y-auto p-5 space-y-3">
            {/* Items rendered via updateCartUI() */}
        </div>

        {/* Drawer Footer & Checkout */}
        <div className="p-5 border-t border-paper-border dark:border-night-border bg-paper-50/70 dark:bg-night-surface/70 space-y-3.5">
            <div className="flex items-center justify-between text-xs text-ink-muted dark:text-night-muted">
                <span>Số dư Khoai của bạn:</span>
                <span className="font-outfit font-bold text-ink dark:text-night-text flex items-center gap-1">
                    <span id="cartDrawerUserKhoai">{userKhoai.toLocaleString()}</span> <i className="ph-fill ph-coins text-gold"></i>
                </span>
            </div>
            <div className="flex items-center justify-between">
                <span className="font-outfit font-bold text-sm text-ink dark:text-night-text">Tổng thanh toán:</span>
                <div className="flex items-baseline gap-1 text-2xl font-outfit font-black text-wine dark:text-gold">
                    <span id="cartDrawerTotal">0</span>
                    <span className="text-xs font-bold text-gold">Khoai</span>
                    <i className="ph-fill ph-coins text-gold text-base"></i>
                </div>
            </div>
            <button id="btnCheckoutCart" onClick={() => { handleCheckoutCart() }} className="w-full bg-wine hover:bg-wine-dark text-white font-outfit font-extrabold py-3.5 px-4 rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer text-sm group disabled:opacity-50 disabled:cursor-not-allowed">
                <i className="ph-fill ph-check-circle text-lg text-amber-300 group-hover:scale-110 transition-transform"></i>
                <span>Xác Nhận Thuê & Mua Bằng Khoai</span>
            </button>
            <p className="text-[11px] text-center text-ink-muted dark:text-night-muted">
                Sau khi thanh toán, sách sẽ chuyển ngay vào <strong className="text-wine dark:text-gold">Tủ Sách</strong> để đọc online.
            </p>
        </div>
    </div>

    {/* ========================================================
        MODAL TẶNG SÁCH CHO BẠN BÈ / ĐỘC GIẢ KHÁC
        ======================================================== */}
    {isGiftModalOpen && (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <div
                onClick={closeGiftModal}
                className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity duration-300"
            ></div>
            <div className="relative w-full max-w-lg bg-paper-surface dark:bg-[#1A1B18] border border-paper-border dark:border-[#383A34] rounded-3xl z-10 shadow-2xl p-6 sm:p-7 max-h-[90vh] overflow-y-auto my-auto">
                {/* Modal Header */}
                <div className="flex items-start justify-between pb-4 border-b border-paper-border dark:border-[#2C2E29] mb-5">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-amber-500/15 dark:bg-gold/20 text-amber-600 dark:text-gold flex items-center justify-center text-2xl shrink-0">
                            <i className="ph-bold ph-gift"></i>
                        </div>
                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-gold bg-amber-500/10 dark:bg-gold/15 px-2 py-0.5 rounded-md inline-block mb-1">
                                Món Quà Tri Thức
                            </span>
                            <h3 className="font-outfit font-black text-base text-ink dark:text-white leading-tight">
                                Tặng Tác Phẩm Cho Bạn Bè
                            </h3>
                            <p className="text-xs text-ink-muted dark:text-stone-400 mt-0.5">
                                {book?.bookName || 'Tác phẩm'} • {book?.author || 'HALM BOOK'}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={closeGiftModal}
                        className="w-8 h-8 rounded-full bg-paper-100 dark:bg-stone-800 hover:bg-paper-200 dark:hover:bg-stone-700 text-ink-muted dark:text-stone-300 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                        title="Đóng"
                    >
                        <i className="ph-bold ph-x text-base"></i>
                    </button>
                </div>

                {/* Bước 1: Tìm người nhận */}
                <div className="mb-5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted dark:text-stone-400 font-outfit mb-2">
                        1. Người Nhận Quà (Email / Tên Đăng Nhập / SĐT):
                    </label>
                    <form onSubmit={handleSearchRecipient} className="flex gap-2">
                        <div className="relative flex-1">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                                <i className="ph-bold ph-magnifying-glass text-sm"></i>
                            </div>
                            <input
                                type="text"
                                value={giftRecipientQuery}
                                onChange={(e) => setGiftRecipientQuery(e.target.value)}
                                placeholder="Nhập email, username hoặc số điện thoại..."
                                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-paper-border dark:border-[#383A34] bg-paper-50 dark:bg-[#111210] text-ink dark:text-white text-xs font-medium focus:outline-none focus:border-gold transition-colors"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isSearchingRecipient || !giftRecipientQuery.trim()}
                            className="px-4 py-2.5 rounded-xl bg-gold/15 hover:bg-gold/25 text-gold border border-gold/40 text-xs font-bold font-metadata-spec transition-colors disabled:opacity-50 shrink-0"
                        >
                            {isSearchingRecipient ? <i className="ph-bold ph-spinner animate-spin text-sm"></i> : 'Tìm Bạn'}
                        </button>
                    </form>

                    {/* Candidate list / Selected recipient */}
                    {selectedRecipient ? (
                        <div className="mt-3 p-3 rounded-2xl bg-emerald-500/10 dark:bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <img
                                    src={selectedRecipient.avatar || '/logo.png'}
                                    alt="Avatar"
                                    className="w-10 h-10 rounded-full object-cover border border-emerald-500/40"
                                />
                                <div>
                                    <div className="font-bold text-xs text-ink dark:text-white flex items-center gap-1.5">
                                        <span>{selectedRecipient.customerName}</span>
                                        <i className="ph-fill ph-check-circle text-emerald-500"></i>
                                    </div>
                                    <div className="text-[11px] text-ink-muted dark:text-stone-400">
                                        {selectedRecipient.emailMasked} {selectedRecipient.username ? `(@${selectedRecipient.username})` : ''}
                                    </div>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedRecipient(null)}
                                className="text-xs text-stone-400 hover:text-rose-500 px-2 py-1"
                            >
                                Đổi người
                            </button>
                        </div>
                    ) : giftCandidates.length > 0 && (
                        <div className="mt-3 space-y-2 max-h-40 overflow-y-auto pr-1">
                            {giftCandidates.map((c) => (
                                <div
                                    key={c.customerId}
                                    onClick={() => setSelectedRecipient(c)}
                                    className="p-2.5 rounded-xl border border-paper-border dark:border-[#383A34] hover:border-gold bg-paper-50 dark:bg-[#111210] flex items-center justify-between cursor-pointer transition-colors"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <img src={c.avatar || '/logo.png'} alt="Avatar" className="w-8 h-8 rounded-full object-cover" />
                                        <div>
                                            <div className="font-bold text-xs text-ink dark:text-white">{c.customerName}</div>
                                            <div className="text-[10px] text-ink-muted dark:text-stone-400">{c.emailMasked}</div>
                                        </div>
                                    </div>
                                    <span className="text-xs font-bold text-gold hover:underline">Chọn</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Bước 2: Chọn gói tặng */}
                <div className="mb-5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted dark:text-stone-400 font-outfit mb-2">
                        2. Chọn Kỳ Hạn Tặng:
                    </label>
                    <div className="grid grid-cols-2 gap-2.5">
                        {[
                            { key: '7', name: '7 Ngày', price: 9, note: 'Thuê 1 tuần' },
                            { key: '14', name: '14 Ngày', price: 15, note: 'Thuê 2 tuần' },
                            { key: '30', name: '30 Ngày', price: 25, note: 'Thuê 1 tháng' },
                            { key: 'forever', name: 'Vĩnh Viễn', price: book?.rent_price && book.rent_price > 0 ? Math.round(book.rent_price) : 39, note: 'Trọn đời' }
                        ].map((plan) => {
                            const isSelected = giftPlanKey === plan.key;
                            return (
                                <div
                                    key={plan.key}
                                    onClick={() => setGiftPlanKey(plan.key)}
                                    className={`p-3 rounded-2xl border-2 cursor-pointer transition-all ${
                                        isSelected
                                            ? 'border-gold bg-gold/10 dark:bg-gold/15'
                                            : 'border-paper-border dark:border-[#383A34] bg-paper-50 dark:bg-[#111210] hover:border-gold/40'
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-bold text-xs text-ink dark:text-white">{plan.name}</span>
                                        <span className="font-bold text-xs text-amber-600 dark:text-gold flex items-center gap-0.5">
                                            {plan.price} 🥔
                                        </span>
                                    </div>
                                    <div className="text-[10px] text-ink-muted dark:text-stone-400">{plan.note}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Bước 3: Lời chúc tặng sách */}
                <div className="mb-5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted dark:text-stone-400 font-outfit mb-2">
                        3. Lời Nhắn Gửi Tặng:
                    </label>
                    <textarea
                        rows={2}
                        value={giftMessage}
                        onChange={(e) => setGiftMessage(e.target.value)}
                        placeholder="Nhập lời chúc tốt đẹp gửi kèm món quà..."
                        className="w-full p-3 rounded-xl border border-paper-border dark:border-[#383A34] bg-paper-50 dark:bg-[#111210] text-ink dark:text-white text-xs font-medium focus:outline-none focus:border-gold transition-colors resize-none"
                    ></textarea>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                        {[
                            'Chúc bạn đọc sách vui vẻ! 📖',
                            'Món quà nhỏ gửi tặng bạn tri thức! ✨',
                            'Hy vọng cuốn sách mang lại cảm hứng cho bạn! 💡'
                        ].map((chip, idx) => (
                            <button
                                key={idx}
                                type="button"
                                onClick={() => setGiftMessage(chip)}
                                className="text-[11px] px-2.5 py-1 rounded-full bg-paper-200 dark:bg-stone-800 hover:bg-gold/15 text-ink-muted dark:text-stone-300 hover:text-gold transition-colors"
                            >
                                {chip}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Bảng so sánh số dư khoai */}
                <div className="p-3.5 rounded-2xl bg-paper-100 dark:bg-[#111210] border border-paper-border dark:border-[#2C2E29] mb-5 space-y-2 text-xs font-metadata-spec">
                    <div className="flex items-center justify-between">
                        <span className="text-ink-muted dark:text-stone-400">Số dư Khoai hiện tại:</span>
                        <span className="font-bold text-ink dark:text-white">{currentUserPotato.toLocaleString()} 🥔</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-ink-muted dark:text-stone-400">Chi phí tặng sách:</span>
                        <span className="font-bold text-amber-600 dark:text-gold">-{giftPlanPrice} 🥔</span>
                    </div>
                    <div className="pt-2 border-t border-paper-border/60 dark:border-stone-800 flex items-center justify-between font-bold">
                        <span>Số dư sau khi tặng:</span>
                        <span className={currentUserPotato >= giftPlanPrice ? 'text-emerald-500' : 'text-rose-500'}>
                            {(currentUserPotato - giftPlanPrice).toLocaleString()} 🥔
                        </span>
                    </div>
                    {currentUserPotato < giftPlanPrice && (
                        <div className="text-[11px] text-rose-500 pt-1 flex items-center justify-between">
                            <span>Số dư Khoai không đủ để thực hiện!</span>
                            <Link to="/canhan?tab=wallet" className="underline font-bold text-gold">Nạp thêm Khoai</Link>
                        </div>
                    )}
                </div>

                {/* Modal Actions */}
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={closeGiftModal}
                        className="flex-1 py-3 rounded-2xl border border-paper-border dark:border-stone-700 hover:bg-paper-200 dark:hover:bg-stone-800 text-ink dark:text-stone-300 font-bold text-xs transition-colors"
                    >
                        Hủy Bỏ
                    </button>
                    <button
                        type="button"
                        disabled={isGiftingBook || !selectedRecipient || currentUserPotato < giftPlanPrice}
                        onClick={handleConfirmGiftBook}
                        className="flex-2 py-3 rounded-2xl bg-wine hover:bg-wine-dark dark:bg-gold dark:hover:bg-amber-400 text-white dark:text-[#111210] font-bold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                    >
                        {isGiftingBook ? (
                            <>
                                <i className="ph-bold ph-spinner animate-spin text-sm"></i>
                                <span>Đang Gửi Quà...</span>
                            </>
                        ) : (
                            <>
                                <i className="ph-bold ph-gift text-base"></i>
                                <span>Xác Nhận Tặng ({giftPlanPrice} 🥔)</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )}

    {/* MODAL THIỆP CHÚC MỪNG TẶNG SÁCH THÀNH CÔNG */}
    {giftSuccessModal && (
        <div className="fixed inset-0 z-[10003] flex items-center justify-center p-4 overflow-y-auto">
            <div
                onClick={() => setGiftSuccessModal(null)}
                className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity"
            ></div>
            <div className="relative w-full max-w-md bg-paper-surface dark:bg-[#1A1B18] border-2 border-gold/50 rounded-3xl z-10 shadow-2xl p-6 sm:p-7 text-center my-auto">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 text-white flex items-center justify-center text-3xl shadow-lg animate-bounce">
                    <i className="ph-bold ph-gift"></i>
                </div>
                <h3 className="font-display font-black text-xl text-ink dark:text-white mb-1">
                    Tặng Sách Thành Công! 🎉
                </h3>
                <p className="font-editorial-body text-xs text-ink-muted dark:text-stone-300 mb-4">
                    Bạn đã gửi tặng tác phẩm <strong className="text-ink dark:text-gold">"{giftSuccessModal.bookTitle}"</strong> ({giftSuccessModal.planText}) cho độc giả <strong className="text-ink dark:text-gold">{giftSuccessModal.recipientName}</strong>.
                </p>
                <div className="p-3 rounded-2xl bg-paper-100 dark:bg-[#111210] border border-paper-border dark:border-[#2C2E29] text-xs italic text-stone-400 mb-5">
                    "{giftSuccessModal.message}"
                </div>
                <p className="text-[11px] text-ink-muted dark:text-stone-400 mb-5">
                    Sách đã được thêm ngay vào Tủ Sách của người nhận và hệ thống đã gửi thông báo đến họ.
                </p>
                <button
                    type="button"
                    onClick={() => setGiftSuccessModal(null)}
                    className="w-full py-3 rounded-2xl bg-wine hover:bg-wine-dark dark:bg-gold dark:hover:bg-amber-400 text-white dark:text-[#111210] font-bold text-xs transition-colors"
                >
                    Tuyệt Vời, Cảm Ơn!
                </button>
            </div>
        </div>
    )}

    {/* Toast Notification Container */}
    <div id="toastContainer" className="fixed top-24 right-5 z-50 flex flex-col gap-2 pointer-events-none"></div>

    {/* ========================================================
         SCRIPTS: 3D BOOK TILT, SIGNATURE 3D BOOK FLY & OPEN TRANSITION,
         AUDIO PREVIEW, THEME TOGGLE, AND TOASTS
         ======================================================== */}
            </div>
            </UserLayout>
        </>
    );
}
