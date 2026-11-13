import React, { useState, useEffect, useCallback, useRef } from 'react';
import { submitSupportTicket, getMySupportTickets, sendTicketMessage } from '@/services/userSupportService';

const CATEGORIES = [
  { id: 'PAYMENT', label: 'Nạp Khoai / Thanh Toán', icon: 'ph-currency-circle-dollar', color: 'text-amber-600 dark:text-amber-400' },
  { id: 'READING', label: 'Lỗi Đọc Sách / Bản Quyền', icon: 'ph-book-open', color: 'text-blue-600 dark:text-blue-400' },
  { id: 'ACCOUNT', label: 'Tài Khoản / Bảo Mật', icon: 'ph-shield-check', color: 'text-emerald-600 dark:text-emerald-400' },
  { id: 'OTHER', label: 'Góp Ý & Hỗ Trợ Khác', icon: 'ph-chat-circle-dots', color: 'text-purple-600 dark:text-purple-400' }
];

const PRIORITIES = [
  { id: 'NORMAL', label: 'Bình thường' },
  { id: 'HIGH', label: 'Ưu tiên cao' },
  { id: 'URGENT', label: 'Khẩn cấp' }
];

export default function SupportTicketSection({ customer, showToast }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Chat Modal State
  const [selectedChatTicket, setSelectedChatTicket] = useState(null);
  const [chatReplyInput, setChatReplyInput] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const chatBottomRef = useRef(null);

  // Form State
  const [category, setCategory] = useState('PAYMENT');
  const [priority, setPriority] = useState('NORMAL');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [senderName, setSenderName] = useState(customer?.customerName || '');
  const [senderEmail, setSenderEmail] = useState(customer?.email || '');
  const [senderPhone, setSenderPhone] = useState(customer?.phoneNumber || '');

  // Cập nhật thông tin khi customer thay đổi
  useEffect(() => {
    if (customer) {
      if (!senderName) setSenderName(customer.customerName || '');
      if (!senderEmail) setSenderEmail(customer.email || '');
      if (!senderPhone) setSenderPhone(customer.phoneNumber || '');
    }
  }, [customer]);

  // Lấy danh sách mã vé đã lưu trong localStorage
  const getSavedTicketCodes = () => {
    try {
      const raw = localStorage.getItem('halm_my_ticket_codes');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };

  const saveTicketCode = (code) => {
    if (!code) return;
    try {
      const codes = getSavedTicketCodes();
      if (!codes.includes(code)) {
        codes.unshift(code);
        localStorage.setItem('halm_my_ticket_codes', JSON.stringify(codes.slice(0, 50)));
      }
    } catch (e) {
      console.warn('Lỗi lưu ticket code:', e);
    }
  };

  const loadTickets = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      const savedCodes = getSavedTicketCodes();
      const currentEmail = senderEmail || customer?.email || '';
      
      const data = await getMySupportTickets({
        email: currentEmail,
        codes: savedCodes.join(',')
      });
      const list = Array.isArray(data) ? data : [];
      setTickets(list);

      // Tự động đồng bộ nội dung chat của Ticket đang mở (Auto-sync 2 chiều)
      setSelectedChatTicket(prevSelected => {
        if (!prevSelected) return null;
        const fresh = list.find(t => String(t.id) === String(prevSelected.id) || String(t.code) === String(prevSelected.code));
        return fresh || prevSelected;
      });

    } catch (err) {
      if (!isSilent) console.warn('Lỗi khi tải lịch sử ticket:', err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [senderEmail, customer]);

  // Tải lần đầu và thiết lập Polling thời gian thực mỗi 3 giây
  useEffect(() => {
    loadTickets();
    const interval = setInterval(() => {
      loadTickets(true);
    }, 3000);
    return () => clearInterval(interval);
  }, [loadTickets]);

  // Cuộn xuống tin nhắn cuối cùng khi mở modal hoặc có tin mới
  useEffect(() => {
    if (selectedChatTicket && chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedChatTicket, selectedChatTicket?.chatHistory]);

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (!subject.trim()) {
      if (showToast) showToast('Thiếu Thông Tin', 'Vui lòng nhập tiêu đề yêu cầu khiếu nại!');
      return;
    }
    if (!message.trim()) {
      if (showToast) showToast('Thiếu Thông Tin', 'Vui lòng nhập nội dung chi tiết cần hỗ trợ!');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        senderName: (senderName || customer?.customerName || 'Độc giả').trim(),
        senderEmail: (senderEmail || customer?.email || 'reader@halmbook.com').trim(),
        senderPhone: (senderPhone || customer?.phoneNumber || '').trim(),
        category,
        priority,
        subject: subject.trim(),
        message: message.trim()
      };

      const res = await submitSupportTicket(payload);

      if (res && res.ticketCode) {
        saveTicketCode(res.ticketCode);
      }

      if (showToast) {
        showToast('Gửi Thành Công! 🚀', res.message || 'Yêu cầu của bạn đã được tiếp nhận qua hàng đợi RabbitMQ!');
      }

      // Optimistic update
      const newTicketItem = {
        id: Date.now(),
        code: res.ticketCode || ('TK-' + Math.floor(10000 + Math.random() * 90000)),
        subject: payload.subject,
        message: payload.message,
        category: payload.category,
        priority: payload.priority,
        status: 'pending',
        adminReply: '',
        chatHistory: [{
          sender: 'USER',
          senderName: payload.senderName,
          content: payload.message,
          time: 'Vừa xong'
        }],
        createdAt: 'Vừa xong'
      };
      setTickets(prev => [newTicketItem, ...prev.filter(t => t.code !== newTicketItem.code)]);

      // Reset form
      setSubject('');
      setMessage('');

      // Reload lại từ MySQL sau 1.5s
      setTimeout(() => {
        loadTickets(true);
      }, 1500);

    } catch (err) {
      console.error('Lỗi khi gửi yêu cầu:', err);
      if (showToast) {
        showToast('Lỗi Gửi Yêu Cầu', err.response?.data?.message || err.message || 'Không thể gửi qua RabbitMQ');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Gửi tin nhắn trả lời tiếp trong cuộc trò chuyện 2 chiều
  const handleSendMessage = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!selectedChatTicket || !chatReplyInput.trim() || sendingMessage) return;

    const messageContent = chatReplyInput.trim();
    const ticketId = selectedChatTicket.id;
    const currentSenderName = senderName || customer?.customerName || 'Độc giả';

    try {
      setSendingMessage(true);

      // Optimistic update tin nhắn vào UI ngay lập tức
      const optimisticMsg = {
        sender: 'USER',
        senderName: currentSenderName,
        content: messageContent,
        time: 'Vừa xong'
      };

      setSelectedChatTicket(prev => {
        if (!prev) return null;
        const currentHist = Array.isArray(prev.chatHistory) ? prev.chatHistory : [];
        return {
          ...prev,
          status: 'pending',
          chatHistory: [...currentHist, optimisticMsg]
        };
      });

      setChatReplyInput('');

      // Gọi API Backend
      await sendTicketMessage(ticketId, messageContent, currentSenderName);

      // Nạp lại ngầm từ DB
      loadTickets(true);

    } catch (err) {
      console.error('Lỗi khi gửi tin nhắn trao đổi:', err);
      if (showToast) {
        showToast('Lỗi Gửi Tin Nhắn', 'Không thể gửi tin nhắn, vui lòng thử lại sau.');
      }
    } finally {
      setSendingMessage(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-paper-border dark:border-night-border">
        <div>
          <div className="flex items-center gap-2 text-xs font-metadata-spec text-ink-muted dark:text-night-muted mb-1">
            <span>Tài khoản</span>
            <i className="ph-bold ph-caret-right text-[10px]"></i>
            <span className="text-[#C28807] font-bold">Hỗ Trợ & Khiếu Nại</span>
          </div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-ink dark:text-night-text tracking-tight flex items-center gap-2.5">
            <span>Trung Tâm Hỗ Trợ Độc Giả</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20 text-[10px] font-black uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Auto-Sync RabbitMQ
            </span>
          </h1>
        </div>
      </div>

      {/* Grid: Form Gửi & Danh Sách Ticket */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* CỘT TRÁI (7 CỘT): FORM GỬI YÊU CẦU */}
        <div className="lg:col-span-7 rounded-3xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border p-5 sm:p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-paper-border dark:border-night-border">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-[#C28807] flex items-center justify-center text-xl shrink-0">
              <i className="ph-bold ph-paper-plane-tilt"></i>
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-ink dark:text-night-text">Gửi Yêu Cầu Hoặc Khiếu Nại Mới</h3>
              <p className="font-editorial-body text-xs text-ink-muted dark:text-night-muted">Tin nhắn được gửi vào hàng đợi RabbitMQ và chuyển tới Quản trị viên xử lý ngay.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Thông tin liên hệ độc giả */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-paper dark:bg-night-surface border border-paper-border dark:border-night-border text-xs">
              <div>
                <label className="block text-[11px] font-bold text-ink-muted dark:text-night-muted mb-1">Họ và tên</label>
                <input
                  type="text"
                  value={senderName}
                  onChange={e => setSenderName(e.target.value)}
                  placeholder="Họ tên của bạn"
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-night-card border border-paper-border dark:border-night-border font-semibold text-ink dark:text-night-text focus:outline-none focus:border-[#C28807]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-ink-muted dark:text-night-muted mb-1">Email nhận tin</label>
                <input
                  type="email"
                  value={senderEmail}
                  onChange={e => setSenderEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-night-card border border-paper-border dark:border-night-border font-semibold text-ink dark:text-night-text focus:outline-none focus:border-[#C28807]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-ink-muted dark:text-night-muted mb-1">Số điện thoại</label>
                <input
                  type="text"
                  value={senderPhone}
                  onChange={e => setSenderPhone(e.target.value)}
                  placeholder="09xx xxx xxx"
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-night-card border border-paper-border dark:border-night-border font-semibold text-ink dark:text-night-text focus:outline-none focus:border-[#C28807]"
                />
              </div>
            </div>

            {/* 1. Chọn phân loại */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold font-metadata-spec text-ink dark:text-night-text">Phân loại vấn đề *</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {CATEGORIES.map(cat => {
                  const isSelected = category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl text-center transition-all border cursor-pointer ${
                        isSelected
                          ? 'bg-amber-100/70 dark:bg-amber-950/40 border-[#C28807] text-stone-900 dark:text-amber-200 font-black'
                          : 'bg-white dark:bg-night-surface border-paper-border dark:border-night-border text-ink-muted dark:text-stone-300 hover:border-stone-400 font-bold'
                      }`}
                    >
                      <i className={`ph-bold ${cat.icon} text-lg ${cat.color}`}></i>
                      <span className="text-[11px] leading-tight line-clamp-1">{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Tiêu đề */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold font-metadata-spec text-ink dark:text-night-text">Tiêu đề yêu cầu *</label>
              <input
                type="text"
                placeholder="Ví dụ: Đã chuyển khoản nạp khoai qua MoMo nhưng chưa nhận được..."
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-night-surface border border-paper-border dark:border-night-border text-xs font-bold text-ink dark:text-night-text placeholder:text-stone-400 focus:outline-none focus:border-[#C28807]"
              />
            </div>

            {/* 3. Mức độ ưu tiên */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold font-metadata-spec text-ink dark:text-night-text">Mức độ ưu tiên</label>
              <div className="flex flex-wrap gap-2">
                {PRIORITIES.map(p => {
                  const isSelected = priority === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPriority(p.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                        isSelected
                          ? 'bg-[#1E1F1D] text-white dark:bg-amber-600 dark:text-white border-transparent'
                          : 'bg-white dark:bg-night-surface text-stone-600 dark:text-stone-300 border-paper-border dark:border-night-border hover:bg-paper-200 dark:hover:bg-night-card'
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Nội dung chi tiết */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold font-metadata-spec text-ink dark:text-night-text">Nội dung chi tiết *</label>
              <textarea
                rows={4}
                placeholder="Vui lòng mô tả chi tiết vấn đề bạn đang gặp phải (mã giao dịch, tên sách, thời điểm bị lỗi...)"
                value={message}
                onChange={e => setMessage(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-night-surface border border-paper-border dark:border-night-border text-xs font-medium text-ink dark:text-night-text placeholder:text-stone-400 focus:outline-none focus:border-[#C28807]"
              ></textarea>
            </div>

            {/* 5. Nút gửi */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-5 rounded-2xl bg-[#1E1F1D] hover:bg-[#C28807] hover:text-[#111210] dark:bg-[#C28807] dark:text-[#111210] dark:hover:bg-[#d89808] text-white text-xs font-black flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer border border-transparent shadow-xs"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  <span>Đang đẩy tin nhắn vào hàng đợi RabbitMQ...</span>
                </>
              ) : (
                <>
                  <i className="ph-bold ph-paper-plane-right text-base"></i>
                  <span>Gửi Yêu Cầu Hỗ Trợ Qua Hàng Đợi</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* CỘT PHẢI (5 CỘT): DANH SÁCH TICKET CỦA TÔI */}
        <div className="lg:col-span-5 rounded-3xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border p-5 sm:p-6 shadow-xs space-y-4 flex flex-col h-full">
          <div className="flex items-center justify-between pb-3 border-b border-paper-border dark:border-night-border">
            <div className="flex items-center gap-2.5">
              <i className="ph-bold ph-chats-circle text-xl text-[#C28807]"></i>
              <h3 className="font-display font-bold text-base text-ink dark:text-night-text">Lịch Sử Yêu Cầu ({tickets.length})</h3>
            </div>
            <button
              type="button"
              onClick={() => loadTickets(false)}
              title="Làm mới danh sách"
              className="w-8 h-8 rounded-xl bg-white dark:bg-night-surface border border-paper-border dark:border-night-border text-stone-500 hover:text-[#C28807] flex items-center justify-center transition-colors cursor-pointer"
            >
              <i className={`ph-bold ph-arrows-clockwise text-sm ${loading ? 'animate-spin' : ''}`}></i>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[550px]">
            {loading && tickets.length === 0 ? (
              <div className="py-12 text-center text-stone-400 space-y-2">
                <div className="w-6 h-6 border-2 border-[#C28807] border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-xs">Đang tải lịch sử ticket từ máy chủ...</p>
              </div>
            ) : tickets.length === 0 ? (
              <div className="py-12 text-center text-stone-400 space-y-2">
                <i className="ph-bold ph-tray text-3xl opacity-50"></i>
                <p className="text-xs font-semibold">Bạn chưa gửi yêu cầu khiếu nại nào.</p>
                <p className="text-[11px] text-stone-400">Khi gặp sự cố, hãy gửi yêu cầu qua form bên cạnh để được hỗ trợ nhanh nhất.</p>
              </div>
            ) : (
              tickets.map(t => {
                const isResolved = t.status === 'resolved';
                const isInProgress = t.status === 'in_progress';

                let statusBadge = (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                    Chờ tiếp nhận
                  </span>
                );
                if (isResolved) {
                  statusBadge = (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                      Đã giải quyết
                    </span>
                  );
                } else if (isInProgress) {
                  statusBadge = (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                      Đang xử lý
                    </span>
                  );
                }

                const chatCount = Array.isArray(t.chatHistory) ? t.chatHistory.length : (t.adminReply ? 2 : 1);

                return (
                  <div
                    key={t.code || t.id}
                    className="p-3.5 rounded-2xl bg-white dark:bg-night-surface border border-paper-border dark:border-night-border space-y-2.5 hover:border-[#C28807]/50 transition-colors shadow-2xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">#{t.code}</span>
                      <div className="flex items-center gap-1.5">
                        {statusBadge}
                        <span className="text-[10px] text-stone-400 font-mono">{t.createdAt}</span>
                      </div>
                    </div>

                    <h4 className="font-display font-bold text-xs text-ink dark:text-night-text line-clamp-1">{t.subject}</h4>
                    <p className="text-[11px] text-ink-muted dark:text-night-muted line-clamp-2 leading-relaxed">{t.message}</p>

                    {/* KHUNG PHẢN HỒI GẦN NHẤT HOẶC TRẠNG THÁI */}
                    {t.adminReply ? (
                      <div className="p-2.5 rounded-xl bg-amber-50/70 dark:bg-stone-800/60 border border-amber-200/70 dark:border-amber-800/40 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1">
                            <i className="ph-fill ph-shield-check text-amber-600"></i>
                            Phản hồi từ Admin:
                          </span>
                          {t.replyAt && <span className="text-[9px] text-stone-400 font-mono">{t.replyAt}</span>}
                        </div>
                        <p className="text-ink dark:text-stone-200 line-clamp-2 italic text-[11px]">
                          "{t.adminReply}"
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-[10px] text-stone-400 italic">
                        <i className="ph-bold ph-hourglass-medium"></i>
                        <span>Đang chờ Admin xem xét và phản hồi...</span>
                      </div>
                    )}

                    {/* NÚT MỞ PHÒNG CHAT TRỰC TIẾP 2 CHIỀU VỚI ADMIN */}
                    <button
                      type="button"
                      onClick={() => setSelectedChatTicket(t)}
                      className="w-full py-2 px-3 rounded-xl bg-paper hover:bg-[#C28807] hover:text-[#111210] dark:bg-night-card dark:hover:bg-[#C28807] dark:hover:text-[#111210] border border-paper-border dark:border-night-border text-ink dark:text-night-text text-xs font-bold flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-1.5">
                        <i className="ph-bold ph-chat-centered-text text-amber-600"></i>
                        <span>Mở Cuộc Trò Chuyện Trực Tiếp</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-white dark:bg-night-surface font-mono font-bold">
                        {chatCount} tin
                      </span>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* MODAL TRÒ CHUYỆN 2 CHIỀU TRỰC TIẾP (USER & ADMIN CHAT THREAD) */}
      {selectedChatTicket && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-paper-surface dark:bg-night-card rounded-3xl max-w-2xl w-full border border-paper-border dark:border-night-border shadow-2xl flex flex-col h-[85vh] max-h-[720px] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header Modal Chat */}
            <div className="flex justify-between items-center px-5 py-3.5 border-b border-paper-border dark:border-night-border bg-paper dark:bg-night-surface">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-[#C28807] flex items-center justify-center text-xl shrink-0">
                  <i className="ph-bold ph-chats-circle"></i>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-black text-sm text-ink dark:text-night-text">Trò Chuyện Hỗ Trợ 2 Chiều</h3>
                    <span className="font-mono font-bold text-xs px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                      #{selectedChatTicket.code}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Auto-Sync
                    </span>
                  </div>
                  <p className="text-[11px] text-ink-muted dark:text-night-muted line-clamp-1 mt-0.5 font-medium">
                    {selectedChatTicket.subject}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedChatTicket(null)}
                className="w-8 h-8 rounded-xl bg-white dark:bg-night-card border border-paper-border dark:border-night-border text-stone-400 hover:text-stone-700 dark:hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <i className="ph-bold ph-x text-base"></i>
              </button>
            </div>

            {/* Sub-header: Trạng thái & thông tin */}
            <div className="px-5 py-2 bg-paper-200/50 dark:bg-night-surface/50 border-b border-paper-border dark:border-night-border flex items-center justify-between text-xs font-metadata-spec">
              <div className="flex items-center gap-2">
                <span className="text-ink-muted dark:text-night-muted">Trạng thái:</span>
                {selectedChatTicket.status === 'resolved' ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    Đã giải quyết
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                    Chờ xử lý
                  </span>
                )}
              </div>
              <span className="text-[11px] text-ink-muted dark:text-night-muted font-mono">
                {selectedChatTicket.createdAt}
              </span>
            </div>

            {/* Conversation Messages Thread */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 bg-paper/30 dark:bg-night-surface/30">
              {(() => {
                let msgs = [];
                if (Array.isArray(selectedChatTicket.chatHistory) && selectedChatTicket.chatHistory.length > 0) {
                  msgs = selectedChatTicket.chatHistory;
                } else {
                  if (selectedChatTicket.message) {
                    msgs.push({
                      sender: 'USER',
                      senderName: selectedChatTicket.senderName || customer?.customerName || 'Độc giả',
                      content: selectedChatTicket.message,
                      time: selectedChatTicket.createdAt || ''
                    });
                  }
                  if (selectedChatTicket.adminReply) {
                    msgs.push({
                      sender: 'ADMIN',
                      senderName: 'Ban Quản Trị HALMBOOK',
                      content: selectedChatTicket.adminReply,
                      time: selectedChatTicket.replyAt || ''
                    });
                  }
                }

                if (msgs.length === 0) {
                  return (
                    <div className="py-12 text-center text-stone-400 text-xs italic">
                      Chưa có nội dung tin nhắn nào.
                    </div>
                  );
                }

                const currentCustAvatar = customer?.avatarUrl || customer?.avatar || selectedChatTicket.userAvatar || '';

                return msgs.map((m, idx) => {
                  const isAdmin = m.sender === 'ADMIN';
                  const sName = m.senderName || (isAdmin ? 'Ban Quản Trị HALMBOOK' : (customer?.customerName || 'Bạn'));
                  const initial = (sName || 'U').charAt(0).toUpperCase();

                  if (isAdmin) {
                    return (
                      <div key={idx} className="flex items-start justify-start gap-2.5 my-2">
                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-black shrink-0 mt-1 shadow-xs">
                          <i className="ph-fill ph-shield-check"></i>
                        </div>
                        <div className="max-w-[80%] text-left">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
                              {sName}
                            </span>
                            <span className="text-[10px] text-stone-400 font-mono">{m.time}</span>
                          </div>
                          <div className="bg-white dark:bg-night-surface text-ink dark:text-night-text p-3.5 rounded-2xl rounded-tl-xs text-xs border border-paper-border dark:border-night-border shadow-xs whitespace-pre-line break-words leading-relaxed inline-block max-w-full">{(m.content || '').trim()}</div>
                        </div>
                      </div>
                    );
                  } else {
                    return (
                      <div key={idx} className="flex items-start justify-end gap-2.5 my-2">
                        <div className="max-w-[80%] text-right">
                          <div className="flex items-center justify-end gap-1.5 mb-1">
                            <span className="text-[10px] text-stone-400 font-mono">{m.time}</span>
                            <span className="text-[11px] font-bold text-stone-700 dark:text-stone-300">
                              {sName}
                            </span>
                          </div>
                          <div className="bg-[#1E1F1D] dark:bg-[#C28807] text-white dark:text-[#111210] p-3.5 rounded-2xl rounded-tr-xs text-xs text-left shadow-xs whitespace-pre-line break-words leading-relaxed inline-block max-w-full">{(m.content || '').trim()}</div>
                        </div>
                        {currentCustAvatar ? (
                          <img
                            src={currentCustAvatar}
                            alt={sName}
                            className="w-8 h-8 rounded-full object-cover border border-amber-500/30 shrink-0 mt-1 shadow-xs"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-amber-600 text-white flex items-center justify-center text-xs font-black shrink-0 mt-1 shadow-xs">
                            {initial}
                          </div>
                        )}
                      </div>
                    );
                  }
                });
              })()}
              <div ref={chatBottomRef} />
            </div>

            {/* Composer Footer: Nhập tin nhắn phản hồi */}
            <form onSubmit={handleSendMessage} className="p-3.5 sm:p-4 border-t border-paper-border dark:border-night-border bg-paper-surface dark:bg-night-card flex items-center gap-2">
              <input
                type="text"
                value={chatReplyInput}
                onChange={e => setChatReplyInput(e.target.value)}
                placeholder="Nhập tin nhắn phản hồi gửi Quản trị viên..."
                className="flex-1 px-3.5 py-2.5 bg-paper dark:bg-night-surface border border-paper-border dark:border-night-border rounded-xl text-xs font-semibold text-ink dark:text-night-text placeholder:text-stone-400 focus:outline-none focus:border-[#C28807]"
              />
              <button
                type="submit"
                disabled={sendingMessage || !chatReplyInput.trim()}
                className="px-4 py-2.5 bg-[#1E1F1D] hover:bg-[#C28807] hover:text-[#111210] dark:bg-[#C28807] dark:text-[#111210] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shrink-0"
              >
                {sendingMessage ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <i className="ph-bold ph-paper-plane-right text-sm"></i>
                    <span>Gửi</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
