import { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import useFloatingBubble from '@/hooks/useFloatingBubble';
import { useLocation } from 'react-router-dom';
import { sendChatMessage, getChatHistory } from '@/services/chatService';

// =========================================================================
// GỢI Ý CÂU HỎI THÔNG MINH THEO TỪNG MÀN HÌNH (CONTEXT-AWARE CHIPS)
// =========================================================================
const getContextSuggestions = (pathname, search) => {
    if (pathname.includes('/chitietsach')) {
        return [
            { text: "Cuốn sách này được đánh giá mấy sao?", icon: "ph-star" },
            { text: "Tóm tắt nội dung chính tác phẩm này?", icon: "ph-book-open" },
            { text: "Nên thuê bao nhiêu ngày là tiết kiệm nhất?", icon: "ph-tag" },
            { text: "Gợi ý thêm sách cùng chủ đề?", icon: "ph-sparkle" }
        ];
    }
    if (pathname.includes('/canhan')) {
        if (search.includes('tab=wallet')) {
            return [
                { text: "Tôi hiện có bao nhiêu Khoai trong ví?", icon: "ph-wallet" },
                { text: "Các gói nạp Khoai hiện có ưu đãi gì?", icon: "ph-coins" },
                { text: "Hướng dẫn nạp Khoai qua VietQR?", icon: "ph-qr-code" },
                { text: "Cách tặng Khoai cho độc giả khác?", icon: "ph-gift" }
            ];
        }
        return [
            { text: "Tôi đang ở hạng thành viên nào?", icon: "ph-trophy" },
            { text: "Làm sao để đổi mật khẩu tài khoản?", icon: "ph-key" },
            { text: "Số dư Khoai hiện tại của tôi?", icon: "ph-wallet" },
            { text: "Quyền lợi khi lên hạng Cao Thủ Cày?", icon: "ph-medal" }
        ];
    }
    if (pathname.includes('/hang')) {
        return [
            { text: "Tôi cần đọc thêm bao nhiêu cuốn để thăng hạng?", icon: "ph-trophy" },
            { text: "Đặc quyền của Lão Nông và Đại Điền Chủ?", icon: "ph-crown" },
            { text: "Chính sách bảo lưu trọn đời thứ hạng ra sao?", icon: "ph-shield-check" },
            { text: "Cách nhận thêm điểm cày (XP) mỗi ngày?", icon: "ph-lightning" }
        ];
    }
    if (pathname.includes('/nhiemvu')) {
        return [
            { text: "Chuỗi Streak của tôi hiện được bao nhiêu ngày?", icon: "ph-flame" },
            { text: "Hôm nay có những nhiệm vụ nhận Khoai nào?", icon: "ph-check-square-offset" },
            { text: "Phần thưởng chuỗi điểm danh 7 ngày là gì?", icon: "ph-gift" },
            { text: "Mẹo duy trì Streak không bị đứt?", icon: "ph-calendar-check" }
        ];
    }
    if (pathname.includes('/tusachcn')) {
        return [
            { text: "Kiểm tra thời hạn sách tôi đang thuê?", icon: "ph-clock" },
            { text: "Ghi chú và trích dẫn đọc được lưu ở đâu?", icon: "ph-bookmark-simple" },
            { text: "Làm sao để gia hạn thêm ngày đọc sách?", icon: "ph-arrows-clockwise" },
            { text: "Sách nào của tôi sắp hết hạn?", icon: "ph-warning-circle" }
        ];
    }
    if (pathname.includes('/giohang')) {
        return [
            { text: "Hạng của tôi được giảm bao nhiêu % thuê sách?", icon: "ph-percent" },
            { text: "Cách thanh toán giỏ hàng bằng Khoai Tây?", icon: "ph-credit-card" },
            { text: "Nếu thiếu Khoai thì nạp thêm thế nào?", icon: "ph-plus-circle" }
        ];
    }
    if (pathname.includes('/uudai')) {
        return [
            { text: "Gói nạp Khoai nào đang tặng thêm bonus cao nhất?", icon: "ph-sparkle" },
            { text: "Cách đổi mã giảm giá thuê sách bằng Khoai?", icon: "ph-ticket" },
            { text: "Gói nạp nào phù hợp nhất cho người mới?", icon: "ph-trend-up" }
        ];
    }

    return [
        { text: "Gợi ý những cuốn sách kinh điển nên đọc?", icon: "ph-sparkle" },
        { text: "Tìm sách của tác giả Paulo Coelho?", icon: "ph-magnifying-glass" },
        { text: "Các tác phẩm có phí thuê dưới 30 Khoai?", icon: "ph-tag" },
        { text: "Giới thiệu về nền tảng HALM BOOK?", icon: "ph-info" }
    ];
};

const BUBBLE_GREETINGS = [
    "Hí bạn đọc! Cần tìm sách cứ hỏi tớ nhé! 🥔✨",
    "Hôm nay bạn muốn đọc thể loại gì nào? 📚",
    "Tớ có thể tra cứu số dư Khoai và tóm tắt sách đấy! 🌱",
    "Khoai Nhỏ luôn sẵn sàng hỗ trợ 24/7! 👋"
];

export default function PotatoChatbot() {
    const location = useLocation();
    const { position, isDragging, edge, buttonProps } = useFloatingBubble();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [hasLoadedHistory, setHasLoadedHistory] = useState(false);
    const [showBubble, setShowBubble] = useState(true);
    const [greetingIndex, setGreetingIndex] = useState(0);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const suggestions = useMemo(() => {
        return getContextSuggestions(location.pathname, location.search);
    }, [location.pathname, location.search]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Tự động xoay tua lời chào của bong bóng thoại lơ lửng
    useEffect(() => {
        if (!isOpen && showBubble) {
            const timer = setInterval(() => {
                setGreetingIndex((prev) => (prev + 1) % BUBBLE_GREETINGS.length);
            }, 6000);
            return () => clearInterval(timer);
        }
    }, [isOpen, showBubble]);

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
            setTimeout(() => inputRef.current?.focus(), 180);
            if (!hasLoadedHistory) {
                loadHistory();
            }
        }
    }, [isOpen]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    // Lắng nghe sự kiện mở chatbot từ các trang khác (Banner, Header, Footer, UuDai, NhiemVu...)
    useEffect(() => {
        const handleOpenEvent = (event) => {
            setIsOpen(true);
            setShowBubble(false);
            if (event?.detail?.message) {
                setTimeout(() => {
                    handleSend(event.detail.message);
                }, 200);
            }
        };
        window.addEventListener('halm-open-chatbot', handleOpenEvent);
        return () => window.removeEventListener('halm-open-chatbot', handleOpenEvent);
    }, []);

    const loadHistory = async () => {
        try {
            const history = await getChatHistory();
            if (Array.isArray(history) && history.length > 0) {
                const formatted = history.map((item) => ({
                    id: item.messageId || item.id || Math.random(),
                    sender: item.sender === 'user' ? 'user' : 'bot',
                    content: item.content,
                    sentAt: item.sentAt || new Date().toISOString()
                }));
                setMessages(formatted);
            }
        } catch (e) {
            console.error("Lỗi khi tải lịch sử chat:", e);
        } finally {
            setHasLoadedHistory(true);
        }
    };

    const handleClearHistory = () => {
        setMessages([]);
    };

    const handleSend = async (customText = null) => {
        const text = (customText || inputValue).trim();
        if (!text || isLoading) return;

        // Ghi nhận hoàn thành nhiệm vụ hằng ngày: Tương tác cùng AI
        const todayKey = new Date().toISOString().slice(0, 10);
        try {
            localStorage.setItem(`halm_daily_action_chat_${todayKey}`, 'true');
        } catch {}
        window.dispatchEvent(new CustomEvent('halm-daily-task-completed', { detail: { task: 'chat' } }));

        const now = new Date();
        const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

        const userMsg = {
            id: Date.now(),
            sender: 'user',
            content: text,
            sentAt: timeString
        };

        setMessages((prev) => [...prev, userMsg]);
        if (!customText) setInputValue('');
        setIsLoading(true);

        try {
            const reply = await sendChatMessage(text);
            const botMsg = {
                id: Date.now() + 1,
                sender: 'bot',
                content: reply,
                sentAt: timeString
            };
            setMessages((prev) => [...prev, botMsg]);
        } catch (error) {
            console.error("Lỗi gửi tin nhắn AI:", error);
            const errorMsg = {
                id: Date.now() + 1,
                sender: 'bot',
                content: 'Khoai Nhỏ gặp chút sự cố kết nối. Bạn đọc thử lại câu hỏi nhé! 🥔',
                sentAt: timeString
            };
            setMessages((prev) => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return createPortal(
        <aside aria-label="Trợ lý ảo Khoai Nhỏ" className="potato-widget fixed z-[10000] font-sans"
            style={{ left: position.x, top: position.y, width: 60, height: 60, transition: isDragging ? 'none' : 'left 280ms cubic-bezier(0.22, 1, 0.36, 1), top 280ms cubic-bezier(0.22, 1, 0.36, 1)' }}>
            {/* CSS TÙY BIẾN CHO CÁC HIỆU ỨNG SỐNG ĐỘNG */}
            <style>{`
                @media (prefers-reduced-motion: reduce) {
                    .potato-widget, .potato-widget * { animation: none !important; transition: none !important; }
                }
                @keyframes potato-float {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-7px) rotate(2.5deg); }
                }
                @keyframes potato-pulse-ring {
                    0% { transform: scale(0.95); opacity: 0.8; }
                    50% { transform: scale(1.15); opacity: 0.3; }
                    100% { transform: scale(0.95); opacity: 0.8; }
                }
                @keyframes radar-wave {
                    0% { transform: scale(0.9); opacity: 1; }
                    100% { transform: scale(2.4); opacity: 0; }
                }
                @keyframes typing-bounce {
                    0%, 80%, 100% { transform: translateY(0); }
                    40% { transform: translateY(-6px); }
                }
                .potato-floating {
                    animation: potato-float 3.6s ease-in-out infinite;
                }
                .potato-pulse-aura {
                    animation: potato-pulse-ring 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
                .radar-pulse-dot {
                    animation: radar-wave 2s cubic-bezier(0, 0.2, 0.8, 1) infinite;
                }
                .typing-dot-1 { animation: typing-bounce 1.4s infinite ease-in-out; animation-delay: 0s; }
                .typing-dot-2 { animation: typing-bounce 1.4s infinite ease-in-out; animation-delay: 0.2s; }
                .typing-dot-3 { animation: typing-bounce 1.4s infinite ease-in-out; animation-delay: 0.4s; }
            `}</style>

            {/* =========================================================
                HỘP THOẠI CHAT (GLASSMORPHISM SIÊU SỐNG ĐỘNG & SANG TRỌNG)
                ========================================================= */}
            {isOpen && (
                <div
                    id="potato-chatbot-panel"
                    style={{ position: 'fixed', right: 12, bottom: 84, width: 'min(410px, calc(100vw - 24px))', maxHeight: 'calc(100dvh - 108px)' }}
                    className="mb-4 w-[95vw] sm:w-[410px] h-[590px] max-h-[86vh] rounded-3xl bg-[#FFFDF9]/95 dark:bg-[#161714]/95 backdrop-blur-2xl border border-[#D4AF37]/50 shadow-[0_25px_70px_-15px_rgba(212,175,55,0.3)] dark:shadow-[0_25px_80px_-15px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 transition-all z-50"
                >
                    {/* Header Hoàng Gia Rực Rỡ */}
                    <div className="relative px-4 py-3.5 bg-gradient-to-r from-[#7B1E26] via-[#8E3038] to-[#5C151C] dark:from-[#1D1E1A] dark:via-[#262822] dark:to-[#181915] text-white border-b border-[#D4AF37]/40 shrink-0 flex items-center justify-between shadow-md">
                        {/* Hào quang nền mờ nhẹ */}
                        <div className="absolute inset-0 bg-radial from-amber-400/10 via-transparent to-transparent pointer-events-none"></div>

                        <div className="relative z-10 flex items-center gap-3">
                            {/* Mascot Avatar với hiệu ứng đèn Online Radar */}
                            <div className="relative w-11 h-11 rounded-full p-0.5 bg-gradient-to-tr from-[#D4AF37] to-[#F5E096] shadow-lg shrink-0 group">
                                <div className="w-full h-full rounded-full bg-amber-50 dark:bg-[#1F201C] overflow-hidden flex items-center justify-center">
                                    <img
                                        src="/mascot.png"
                                        alt="Khoai Nhỏ"
                                        className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-300"
                                        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/logo.png'; }}
                                    />
                                </div>
                                {/* Đèn LED xanh ngọc sóng radar */}
                                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#1F201C] flex items-center justify-center shadow-sm">
                                    <span className="radar-pulse-dot absolute inset-0 rounded-full bg-emerald-400"></span>
                                    <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                                </span>
                            </div>

                            <div>
                                <div className="flex items-center gap-1.5">
                                    <h3 className="font-extrabold text-sm tracking-wide text-white dark:text-[#EDE9DF]">
                                        Khoai Nhỏ AI
                                    </h3>
                                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-emerald-500/25 text-emerald-200 dark:text-emerald-400 border border-emerald-400/40 flex items-center gap-0.5">
                                        <span>🌱</span> ONLINE
                                    </span>
                                </div>
                                <p className="text-[10px] text-white/80 dark:text-[#B4B1A7] flex items-center gap-1 mt-0.5">
                                    <span>Trợ lý tri thức HALM</span>
                                    <span className="inline-block w-1 h-1 rounded-full bg-[#D4AF37]"></span>
                                    <span className="text-[#F5E096] dark:text-[#D4AF37] font-semibold">24/7 Companion</span>
                                </p>
                            </div>
                        </div>

                        {/* Nút hành động */}
                        <div className="relative z-10 flex items-center gap-1.5">
                            {messages.length > 0 && (
                                <button
                                    type="button"
                                    onClick={handleClearHistory}
                                    title="Xóa lịch sử trò chuyện"
                                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 dark:bg-white/5 dark:hover:bg-white/15 text-white/80 hover:text-white flex items-center justify-center transition-all cursor-pointer hover:rotate-180 duration-300 text-xs shadow-xs"
                                >
                                    <i className="ph-bold ph-arrows-clockwise text-sm"></i>
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 dark:bg-white/5 dark:hover:bg-white/15 text-white/80 hover:text-white flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95 text-sm shadow-xs"
                                aria-label="Đóng chat"
                                title="Thu nhỏ chatbot"
                            >
                                <i className="ph-bold ph-x"></i>
                            </button>
                        </div>
                    </div>

                    {/* VÙNG THÂN TIN NHẮN (MESSAGE THREAD) */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-gradient-to-b from-[#FAF8F5] via-[#FFFDF9] to-[#FAF8F5] dark:from-[#111210] dark:via-[#151613] dark:to-[#111210]">
                        {/* Lời chào Mừng Hoạt Họa (Empty State) */}
                        {messages.length === 0 && (
                            <div className="p-4 rounded-2xl bg-white/90 dark:bg-[#1C1E19]/90 border border-[#D4AF37]/35 text-center space-y-3 shadow-sm relative overflow-hidden">
                                <div className="w-20 h-20 mx-auto rounded-full p-1 bg-gradient-to-tr from-[#D4AF37] to-[#F5E096] shadow-md relative group">
                                    <div className="w-full h-full rounded-full bg-white dark:bg-[#20221D] overflow-hidden flex items-center justify-center">
                                        <img
                                            src="/mascot-reading.png"
                                            alt="Khoai Nhỏ Đọc Sách"
                                            className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                                            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/mascot.png'; }}
                                        />
                                    </div>
                                    <span className="absolute -bottom-1 -right-1 text-base animate-bounce">
                                        📖
                                    </span>
                                </div>

                                <div>
                                    <h4 className="font-extrabold text-sm text-[#1E1F1D] dark:text-[#EDE9DF] flex items-center justify-center gap-1.5">
                                        <span>Chào bạn, tớ là Khoai Nhỏ!</span>
                                        <span>🥔🌱</span>
                                    </h4>
                                    <p className="text-xs text-[#66645E] dark:text-[#96938B] mt-1 leading-relaxed max-w-xs mx-auto">
                                        Linh vật củ khoai tây có chồi lá non của thư viện HALM BOOK. Tớ sẵn sàng tóm tắt sách, tra cứu số dư Khoai, gợi ý sách đúng gu và gói nạp ưu đãi cho bạn!
                                    </p>
                                </div>

                                {/* Gợi ý câu hỏi thông minh dạng Chip Cards */}
                                <div className="pt-2 text-left space-y-2 border-t border-[#F0EBE1] dark:border-[#262822]">
                                    <div className="text-[10px] font-extrabold text-[#8E3038] dark:text-[#D4AF37] uppercase tracking-wider flex items-center gap-1.5">
                                        <i className="ph-fill ph-sparkle text-amber-500"></i>
                                        <span>Gợi ý câu hỏi nhanh:</span>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        {suggestions.map((s, idx) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => handleSend(s.text)}
                                                className="w-full text-left px-3 py-2 rounded-xl bg-[#F7F4EE]/90 hover:bg-[#8E3038] hover:text-white dark:bg-[#20221E] dark:hover:bg-[#D4AF37] dark:hover:text-[#111210] border border-[#E3DDD0] dark:border-[#2C2E29] hover:border-transparent text-xs text-[#1E1F1D] dark:text-[#EDE9DF] flex items-center justify-between transition-all duration-200 group cursor-pointer shadow-2xs hover:shadow-md hover:scale-[1.01]"
                                            >
                                                <span className="flex items-center gap-2.5 truncate">
                                                    <i className={`ph-bold ${s.icon} text-[#B8860B] dark:text-[#D4AF37] group-hover:text-white dark:group-hover:text-[#111210] text-sm shrink-0 transition-colors`}></i>
                                                    <span className="truncate font-medium">{s.text}</span>
                                                </span>
                                                <i className="ph-bold ph-arrow-up-right text-xs opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0"></i>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Danh sách Tin nhắn */}
                        {messages.map((m) => {
                            const isUser = m.sender === 'user';
                            return (
                                <div
                                    key={m.id}
                                    className={`flex gap-2.5 items-end ${isUser ? 'justify-end' : 'justify-start'}`}
                                >
                                    {/* Avatar bot mini */}
                                    {!isUser && (
                                        <div className="w-7 h-7 rounded-full p-0.5 bg-gradient-to-tr from-[#D4AF37] to-[#F5E096] shrink-0 shadow-xs mb-0.5">
                                            <div className="w-full h-full rounded-full bg-white dark:bg-[#1F201C] overflow-hidden flex items-center justify-center">
                                                <img
                                                    src="/mascot.png"
                                                    alt="Khoai Nhỏ"
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/logo.png'; }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Bong bóng tin nhắn */}
                                    <div className="flex flex-col max-w-[82%]">
                                        <div
                                            className={`rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-sm ${
                                                isUser
                                                    ? 'bg-gradient-to-r from-[#8E3038] to-[#AA3B47] text-white rounded-br-xs font-medium'
                                                    : 'bg-white/95 text-[#1E1F1D] dark:bg-[#1E201B] dark:text-[#EDE9DF] border border-[#D4AF37]/30 rounded-bl-xs shadow-2xs whitespace-pre-line'
                                            }`}
                                        >
                                            {m.content}
                                        </div>
                                        <span className={`text-[9px] text-[#96938B] dark:text-[#7A7870] mt-1 px-1 ${isUser ? 'self-end' : 'self-start'}`}>
                                            {m.sentAt}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}

                        {/* TRẠNG THÁI AI ĐANG SUY NGHĨ (LIVELY THINKING INDICATOR) */}
                        {isLoading && (
                            <div className="flex gap-2.5 items-end">
                                <div className="w-7 h-7 rounded-full p-0.5 bg-gradient-to-tr from-[#D4AF37] to-[#F5E096] shrink-0 shadow-xs animate-bounce mb-0.5">
                                    <div className="w-full h-full rounded-full bg-white dark:bg-[#1F201C] overflow-hidden flex items-center justify-center">
                                        <img src="/mascot.png" alt="Khoai Nhỏ" className="w-full h-full object-cover" />
                                    </div>
                                </div>
                                <div className="px-4 py-2.5 rounded-2xl rounded-bl-xs bg-white/90 dark:bg-[#1E201B]/90 border border-[#D4AF37]/40 text-xs text-[#66645E] dark:text-[#EDE9DF] flex items-center gap-2 shadow-xs">
                                    <span className="font-medium text-[11px] text-[#8E3038] dark:text-[#D4AF37]">
                                        Khoai Nhỏ đang lục tìm tri thức
                                    </span>
                                    <div className="flex items-center gap-1">
                                        <span className="typing-dot-1 w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></span>
                                        <span className="typing-dot-2 w-1.5 h-1.5 rounded-full bg-[#B8860B]"></span>
                                        <span className="typing-dot-3 w-1.5 h-1.5 rounded-full bg-[#8E3038] dark:bg-[#D4AF37]"></span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* VÙNG NHẬP LIỆU DẠNG VIÊN CON NHỘNG (CAPSULE INPUT) */}
                    <div className="p-3 bg-white/95 dark:bg-[#181916]/95 border-t border-[#D4AF37]/30 shrink-0">
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleSend();
                            }}
                            className="relative flex items-center"
                        >
                            <input
                                ref={inputRef}
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Hỏi Khoai Nhỏ về sách, gói nạp, hạng..."
                                disabled={isLoading}
                                className="w-full bg-[#FAF8F5] dark:bg-[#111210] text-[#1E1F1D] dark:text-[#EDE9DF] placeholder-[#96938B] text-xs rounded-full pl-4 pr-11 py-3 border border-[#E3DDD0] dark:border-[#2C2E29] focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/25 transition-all shadow-inner"
                            />
                            <button
                                type="submit"
                                disabled={!inputValue.trim() || isLoading}
                                className="absolute right-1.5 w-8 h-8 rounded-full bg-gradient-to-tr from-[#D4AF37] to-[#B8860B] hover:brightness-110 disabled:opacity-40 text-[#111210] flex items-center justify-center transition-all cursor-pointer shadow-md hover:scale-105 active:scale-95"
                                aria-label="Gửi câu hỏi"
                                title="Gửi câu hỏi"
                            >
                                <i className="ph-bold ph-paper-plane-tilt text-sm transform -rotate-12"></i>
                            </button>
                        </form>
                        <p className="text-[10px] text-center text-[#96938B] dark:text-[#7A7870] mt-1.5">
                            Nhấn <kbd className="font-mono bg-paper-200 dark:bg-night-card px-1 py-0.5 rounded text-[9px]">Enter ↵</kbd> để gửi nhanh câu hỏi
                        </p>
                    </div>
                </div>
            )}

            {/* =========================================================
                BONG BÓNG GỢI Ý MỞ CHAT LƠ LỬNG (FLOATING SPEECH BUBBLE)
                ========================================================= */}
            {!isOpen && showBubble && !isDragging && (
                <div
                    onClick={() => {
                        setShowBubble(false);
                        setIsOpen(true);
                    }}
                    style={{ position: 'absolute', bottom: 76, [edge === 'left' ? 'left' : 'right']: 0, width: 'min(280px, calc(100vw - 24px))', display: position.y < 100 ? 'none' : undefined }}
                    className="mb-2.5 px-3.5 py-2 rounded-2xl bg-white/95 dark:bg-[#1E201B]/95 backdrop-blur-md border border-[#D4AF37]/60 shadow-[0_10px_25px_-5px_rgba(212,175,55,0.3)] text-xs font-bold text-[#8E3038] dark:text-[#D4AF37] flex items-center gap-2 cursor-pointer hover:scale-105 transition-all select-none group"
                >
                    <span className="text-base animate-bounce">🥔</span>
                    <span className="text-xs font-medium text-[#1E1F1D] dark:text-[#EDE9DF]">
                        {BUBBLE_GREETINGS[greetingIndex]}
                    </span>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowBubble(false);
                        }}
                        className="text-[#96938B] hover:text-[#1E1F1D] dark:hover:text-white ml-1 text-xs p-1 transition-colors"
                        title="Tắt gợi ý"
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* =========================================================
                NÚT LINH VẬT NỔI (LIVELY FLOATING POTATO MASCOT BUTTON)
                ========================================================= */}
            <div className="relative">
                {/* Vòng hào quang năng lượng đập nhịp khi đang đóng */}
                {!isOpen && (
                    <div className="potato-pulse-aura absolute -inset-1 rounded-full bg-gradient-to-r from-amber-400/30 to-[#D4AF37]/30 blur-xs pointer-events-none"></div>
                )}

                <button
                    {...buttonProps}
                    style={{ touchAction: 'none', userSelect: 'none', cursor: isDragging ? 'grabbing' : 'grab' }}
                    aria-expanded={isOpen}
                    aria-controls="potato-chatbot-panel"
                    type="button"
                    onClick={() => {
                        setShowBubble(false);
                        setIsOpen((prev) => !prev);
                    }}
                    className={`relative w-15 h-15 rounded-full p-0.5 shadow-[0_12px_35px_rgba(212,175,55,0.35)] flex items-center justify-center transition-colors duration-300 ${
                        isOpen
                            ? 'bg-gradient-to-tr from-[#7B1E26] to-[#8E3038] ring-2 ring-[#D4AF37]/50'
                            : 'bg-gradient-to-tr from-[#B8860B] via-[#D4AF37] to-[#F5E096] ring-2 ring-[#D4AF37]/60'
                    }`}
                    title={isOpen ? "Thu nhỏ trợ lý ảo" : "Trò chuyện cùng Khoai Nhỏ AI"}
                    aria-label={isOpen ? "Thu nhỏ trợ lý ảo Khoai Nhỏ" : "Mở trợ lý ảo Khoai Nhỏ (kéo để di chuyển)"}
                >
                    {isOpen ? (
                        <div className="w-full h-full rounded-full flex items-center justify-center text-white text-lg">
                            <i className="ph-bold ph-x"></i>
                        </div>
                    ) : (
                        <div className="w-full h-full rounded-full bg-amber-50 dark:bg-[#181916] flex items-center justify-center overflow-hidden relative">
                            <img
                                src="/mascot.png"
                                alt="Khoai Nhỏ Mascot"
                                className="w-full h-full object-cover rounded-full transform hover:rotate-6 transition-transform duration-300"
                                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/logo.png'; }}
                            />
                        </div>
                    )}

                    {/* Chồi lá non nhấp nhô trên đỉnh đầu */}
                    {!isOpen && (
                        <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded-full bg-emerald-600 text-white text-[9px] font-black border-2 border-white dark:border-[#111210] shadow-md flex items-center gap-0.5 animate-pulse">
                            🌱
                        </span>
                    )}
                </button>
            </div>
        </aside>,
        document.body
    );
}
