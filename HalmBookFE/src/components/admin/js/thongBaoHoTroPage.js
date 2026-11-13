let allTickets = [];
let pollingInterval = null;
let activeOpenTicketId = null;

// Custom Toast Notification System
function showAdminToast(title, message, type = 'success') {
    let container = document.getElementById('adminToastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'adminToastContainer';
        container.className = 'fixed bottom-5 right-5 z-[99999] flex flex-col gap-2.5 max-w-sm pointer-events-none';
        document.body.appendChild(container);
    }

    const toastId = 'toast_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
    const toastEl = document.createElement('div');
    toastEl.id = toastId;

    let iconHtml = '<i class="fa-solid fa-circle-info text-blue-500 text-base"></i>';
    let borderClass = 'border-blue-500/30';
    if (type === 'success') {
        iconHtml = '<i class="fa-solid fa-circle-check text-emerald-500 text-base"></i>';
        borderClass = 'border-emerald-500/40 bg-emerald-950/20';
    } else if (type === 'warning') {
        iconHtml = '<i class="fa-solid fa-triangle-exclamation text-amber-500 text-base"></i>';
        borderClass = 'border-amber-500/40 bg-amber-950/20';
    } else if (type === 'error') {
        iconHtml = '<i class="fa-solid fa-circle-xmark text-rose-500 text-base"></i>';
        borderClass = 'border-rose-500/40 bg-rose-950/20';
    }

    toastEl.className = `pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl bg-white/95 dark:bg-slate-800/95 text-slate-800 dark:text-white border ${borderClass} shadow-xl backdrop-blur-md transition-all duration-300 transform translate-y-3 opacity-0`;
    toastEl.innerHTML = `
        <div class="shrink-0 mt-0.5">${iconHtml}</div>
        <div class="flex-1 text-xs">
            <div class="font-bold text-slate-900 dark:text-white mb-0.5">${title}</div>
            <div class="text-slate-600 dark:text-slate-300 leading-relaxed">${message}</div>
        </div>
        <button onclick="document.getElementById('${toastId}')?.remove()" class="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 -mr-1 -mt-1 cursor-pointer">
            <i class="fa-solid fa-xmark text-xs"></i>
        </button>
    `;

    container.appendChild(toastEl);
    requestAnimationFrame(() => {
        toastEl.classList.remove('translate-y-3', 'opacity-0');
        toastEl.classList.add('translate-y-0', 'opacity-100');
    });

    setTimeout(() => {
        toastEl.classList.remove('translate-y-0', 'opacity-100');
        toastEl.classList.add('translate-y-3', 'opacity-0');
        setTimeout(() => toastEl.remove(), 300);
    }, 3500);
}

document.addEventListener('DOMContentLoaded', function() {
    loadTickets();
    if (window.DB && typeof window.DB.onUpdate === 'function') {
        window.DB.onUpdate(loadTickets);
    }

    // Tự động đồng bộ thời gian thực mỗi 3.5 giây (Auto-polling)
    if (pollingInterval) clearInterval(pollingInterval);
    pollingInterval = setInterval(function() {
        loadTickets(true);
    }, 3500);
});

// Hủy interval khi trang unmount hoặc chuyển SPA route
window.stopSupportPolling = function() {
    if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
    }
};

window.addEventListener('beforeunload', function() {
    if (typeof window.stopSupportPolling === 'function') {
        window.stopSupportPolling();
    }
});

async function loadTickets(isSilent = false) {
    try {
        if (window.AdminSupportAPI && typeof window.AdminSupportAPI.getTickets === 'function') {
            const res = await window.AdminSupportAPI.getTickets();
            allTickets = res.tickets || (Array.isArray(res) ? res : []);
            if (res.totalTickets != null) {
                const elTot = document.getElementById('statTotalTickets');
                if (elTot) elTot.innerText = res.totalTickets;
                const elPen = document.getElementById('statPendingTickets');
                if (elPen) elPen.innerText = res.pendingTickets;
                const elRes = document.getElementById('statResolvedTickets');
                if (elRes) elRes.innerText = res.resolvedTickets;
            }
        } else if (window.DB && typeof window.DB.getTickets === 'function') {
            allTickets = window.DB.getTickets();
            renderTicketStats();
        }
    } catch (err) {
        if (!isSilent) console.warn('Lỗi API tickets, dùng DB fallback:', err);
        if (window.DB && typeof window.DB.getTickets === 'function') {
            allTickets = window.DB.getTickets();
            renderTicketStats();
        }
    }
    filterTickets(isSilent);

    // Nếu modal chat đang mở, cập nhật cuộc trò chuyện thời gian thực
    if (activeOpenTicketId) {
        updateActiveChatThread(activeOpenTicketId);
    }
}

function renderTicketStats() {
    const pending = allTickets.filter(t => t.status === 'pending').length;
    const resolved = allTickets.filter(t => t.status === 'resolved').length;

    const elTot = document.getElementById('statTotalTickets');
    if (elTot) elTot.innerText = allTickets.length;
    const elPen = document.getElementById('statPendingTickets');
    if (elPen) elPen.innerText = pending;
    const elRes = document.getElementById('statResolvedTickets');
    if (elRes) elRes.innerText = resolved;
}

let currentDisplayCount = 10;
let currentFilteredTickets = [];

function resetTicketFilters() {
    const searchInput = document.getElementById('ticketSearchInput');
    const statusFilter = document.getElementById('ticketStatusFilter');
    if (searchInput) searchInput.value = '';
    if (statusFilter) statusFilter.value = '';
    filterTickets();
}

function filterTickets(isSilent = false) {
    const query = (document.getElementById('ticketSearchInput')?.value || '').toLowerCase().trim();
    const status = document.getElementById('ticketStatusFilter')?.value || '';

    currentFilteredTickets = allTickets.filter(ticket => {
        const searchableText = [ticket.code, ticket.userName, ticket.userEmail, ticket.subject, ticket.message]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
        return (!query || searchableText.includes(query)) && (!status || ticket.status === status);
    });
    renderTicketsTable(isSilent);
}

function loadMoreTickets() {
    currentDisplayCount += 10;
    renderTicketsTable();
}

function renderTicketsTable(isSilent = false) {
    const tbody = document.getElementById('ticketsTableBody');
    const loadMoreButton = document.getElementById('loadMoreTicketsBtn');
    const countSummary = document.getElementById('ticketCountSummary');
    if (countSummary) {
        countSummary.innerText = `Hiển thị ${Math.min(currentDisplayCount, currentFilteredTickets.length)} / ${currentFilteredTickets.length} yêu cầu`;
    }
    if (!tbody) return;

    const visibleTickets = currentFilteredTickets.slice(0, currentDisplayCount);
    if (loadMoreButton) {
        loadMoreButton.style.display = currentDisplayCount < currentFilteredTickets.length ? 'flex' : 'none';
    }

    if (visibleTickets.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="py-12 text-center text-slate-400 font-bold">Không tìm thấy yêu cầu hỗ trợ nào phù hợp với bộ lọc.</td></tr>';
        return;
    }

    const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, char => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[char]);

    tbody.innerHTML = visibleTickets.map(ticket => {
        const isResolved = ticket.status === 'resolved';
        const isInProgress = ticket.status === 'in_progress';

        let statusBadge = '';
        if (isResolved) {
            statusBadge = '<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"><i class="fa-solid fa-circle-check text-[10px]"></i>Đã giải quyết</span>';
        } else if (isInProgress) {
            statusBadge = '<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-300 dark:border-blue-800"><i class="fa-solid fa-spinner fa-spin text-[10px]"></i>Đang xử lý</span>';
        } else {
            statusBadge = '<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 dark:border-amber-800"><i class="fa-solid fa-clock text-[10px]"></i>Chờ xử lý</span>';
        }

        const initial = (ticket.userName || 'U').charAt(0).toUpperCase();
        const avatarHtml = ticket.userAvatar
            ? `<img src="${escapeHTML(ticket.userAvatar)}" alt="${escapeHTML(ticket.userName)}" class="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700 shadow-xs shrink-0" onerror="this.onerror=null;this.parentElement.innerHTML='<div class=\\'w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0\\'>${initial}</div>';" />`
            : `<div class="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black flex items-center justify-center text-xs shrink-0 shadow-xs">${initial}</div>`;

        return `<tr class="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors">
            <td class="py-3 px-3 text-center border-r border-slate-200 dark:border-slate-700 w-px whitespace-nowrap"><span class="font-mono font-black text-blue-600 dark:text-blue-400">${escapeHTML(ticket.code)}</span></td>
            <td class="py-3 px-4 border-r border-slate-200 dark:border-slate-700 min-w-[200px]">
                <div class="flex items-center space-x-2.5">
                    ${avatarHtml}
                    <div>
                        <div class="font-bold text-slate-800 dark:text-white">${escapeHTML(ticket.userName)}</div>
                        <div class="text-[11px] text-slate-500 font-mono break-all">${escapeHTML(ticket.userEmail)}</div>
                    </div>
                </div>
            </td>
            <td class="py-3 px-4 border-r border-slate-200 dark:border-slate-700 min-w-[250px] whitespace-normal break-words">
                <div class="font-bold text-slate-800 dark:text-white mb-1 break-words">${escapeHTML(ticket.subject)}</div>
                <div class="text-[11px] text-slate-500 dark:text-slate-400 whitespace-normal break-words line-clamp-2">${escapeHTML(ticket.message)}</div>
            </td>
            <td class="py-3 px-3 text-center border-r border-slate-200 dark:border-slate-700 w-px whitespace-nowrap text-slate-500 font-mono text-[11px]">${escapeHTML(ticket.createdAt)}</td>
            <td class="py-3 px-3 text-center border-r border-slate-200 dark:border-slate-700 w-px whitespace-nowrap">${statusBadge}</td>
            <td class="py-3 px-4 border-r border-slate-200 dark:border-slate-700 min-w-[200px] whitespace-normal break-words">
                ${ticket.adminReply || ticket.reply ? `<div class="text-xs text-slate-700 dark:text-slate-300 italic whitespace-normal break-words bg-slate-50 dark:bg-slate-800/80 p-2 rounded-lg border border-slate-200 dark:border-slate-700">"${escapeHTML((ticket.adminReply || ticket.reply).trim())}"</div><div class="text-[10px] text-slate-400 font-mono mt-1"><i class="fa-solid fa-check-double text-blue-500 mr-1"></i>${escapeHTML(ticket.replyAt || ticket.repliedAt || '')} (Ban Quản Trị)</div>` : '<span class="text-slate-400 italic text-[11px]">Chưa phản hồi</span>'}
            </td>
            <td class="py-3 px-3 text-center border-r border-slate-200 dark:border-slate-700 w-px whitespace-nowrap">
                <button onclick="openReplyModal('${escapeHTML(ticket.id)}')" class="px-3 py-1.5 rounded-lg ${isResolved ? 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-200 hover:bg-slate-200' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-500/20'} text-[11px] font-bold transition flex items-center gap-1.5 mx-auto cursor-pointer">
                    <i class="fa-solid fa-comments text-xs"></i>
                    <span>${isResolved ? 'Xem trò chuyện' : 'Nhắn tin & Xử lý'}</span>
                </button>
            </td>
        </tr>`;
    }).join('');
}

function openReplyModal(ticketId) {
    const ticket = allTickets.find(t => String(t.id) === String(ticketId) || String(t.code) === String(ticketId));
    if (!ticket) {
        console.warn('Không tìm thấy ticket với ID/Code:', ticketId);
        return;
    }

    activeOpenTicketId = ticket.id;

    const modal = document.getElementById('replyTicketModal');
    if (!modal) return;

    document.getElementById('replyTicketId').value = ticket.id;
    document.getElementById('replyTicketCode').innerText = ticket.code || ('#TK-' + ticket.id);
    document.getElementById('replyTicketSubject').innerText = ticket.subject || 'Yêu cầu hỗ trợ';
    document.getElementById('replyTicketUser').innerText = ticket.userName || 'Độc giả';
    document.getElementById('replyTicketEmail').innerText = ticket.userEmail || '';
    document.getElementById('replyTicketCreatedAt').innerText = ticket.createdAt || '';

    // Load Avatar User trong Header modal
    const avatarContainer = document.getElementById('replyTicketAvatar');
    if (avatarContainer) {
        const uInitial = (ticket.userName || 'U').charAt(0).toUpperCase();
        if (ticket.userAvatar) {
            avatarContainer.innerHTML = `<img src="${ticket.userAvatar}" alt="${ticket.userName}" class="w-10 h-10 rounded-full object-cover border border-slate-300 dark:border-slate-600 shadow-xs" onerror="this.onerror=null;this.parentElement.innerHTML='<div class=\\'w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-xs\\'>${uInitial}</div>';" />`;
        } else {
            avatarContainer.innerHTML = `<div class="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">${uInitial}</div>`;
        }
    }

    // Đồng bộ trạng thái vào Select
    const statusSelect = document.getElementById('replyTicketStatusSelect');
    if (statusSelect) {
        statusSelect.value = ticket.status || 'pending';
    }

    // Render toàn bộ lịch sử tin nhắn 2 chiều (Chat Thread)
    renderChatHistoryThread(ticket);

    // Reset ô input trả lời
    const replyInput = document.getElementById('replyContentInput');
    if (replyInput) {
        replyInput.value = '';
        setTimeout(() => replyInput.focus(), 150);
    }

    modal.classList.remove('hidden');
}

// Cập nhật trạng thái trực tiếp khi đổi dropdown
async function handleTicketStatusChange(newStatus) {
    const ticketId = document.getElementById('replyTicketId')?.value;
    if (!ticketId) return;

    const statusNames = {
        'pending': 'Chờ xử lý',
        'in_progress': 'Đang xử lý',
        'resolved': 'Đã giải quyết'
    };

    try {
        // 1. Cập nhật vào đối tượng ticket trong bộ nhớ
        const ticket = allTickets.find(t => String(t.id) === String(ticketId) || String(t.code) === String(ticketId));
        if (ticket) {
            ticket.status = newStatus;
        }

        // 2. Gọi API Backend thật
        if (window.AdminSupportAPI && typeof window.AdminSupportAPI.updateStatus === 'function') {
            await window.AdminSupportAPI.updateStatus(ticketId, newStatus);
        }

        showAdminToast('Cập Nhật Trạng Thái', `Đã chuyển yêu cầu sang trạng thái "${statusNames[newStatus] || newStatus}"`, 'success');

        // 3. Cập nhật UI bảng ngoài và stats
        renderTicketStats();
        filterTickets(true);

    } catch (err) {
        console.error('Lỗi khi cập nhật trạng thái:', err);
        showAdminToast('Lỗi Cập Nhật', 'Không thể lưu trạng thái mới, vui lòng thử lại!', 'error');
    }
}

function updateActiveChatThread(ticketId) {
    const ticket = allTickets.find(t => String(t.id) === String(ticketId) || String(t.code) === String(ticketId));
    if (!ticket) return;
    const modal = document.getElementById('replyTicketModal');
    if (modal && !modal.classList.contains('hidden')) {
        renderChatHistoryThread(ticket, true);
    }
}

function renderChatHistoryThread(ticket, preserveScroll = false) {
    const container = document.getElementById('replyTicketChatContainer');
    if (!container) return;

    const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, char => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[char]);

    let messages = [];
    if (Array.isArray(ticket.chatHistory) && ticket.chatHistory.length > 0) {
        messages = ticket.chatHistory;
    } else {
        if (ticket.message) {
            messages.push({
                sender: 'USER',
                senderName: ticket.userName || 'Độc giả',
                avatar: ticket.userAvatar || '',
                content: ticket.message,
                time: ticket.createdAt || ''
            });
        }
        if (ticket.adminReply || ticket.reply) {
            messages.push({
                sender: 'ADMIN',
                senderName: 'Ban Quản Trị HALMBOOK',
                content: ticket.adminReply || ticket.reply,
                time: ticket.replyAt || ticket.repliedAt || ''
            });
        }
    }

    if (messages.length === 0) {
        container.innerHTML = '<div class="py-12 text-center text-slate-400 text-xs italic">Chưa có nội dung trao đổi nào.</div>';
        return;
    }

    const currentScrollHeight = container.scrollHeight;
    const currentScrollTop = container.scrollTop;

    container.innerHTML = messages.map(msg => {
        const isAdmin = msg.sender === 'ADMIN';
        const senderName = msg.senderName || (isAdmin ? 'Ban Quản Trị HALMBOOK' : (ticket.userName || 'Độc giả'));
        const avatar = msg.avatar || (isAdmin ? '' : (ticket.userAvatar || ''));
        const initial = (senderName || 'U').charAt(0).toUpperCase();
        const rawContent = (msg.content || '')
            .split('\n')
            .map(line => line.trim())
            .filter(Boolean)
            .join('\n');
        const contentTrimmed = escapeHTML(rawContent || (msg.content || '').trim());

        if (isAdmin) {
            return `
                <div class="flex items-start justify-end space-x-2.5 my-2">
                    <div class="max-w-[80%] text-right">
                        <div class="flex items-center justify-end gap-1.5 mb-1">
                            <span class="text-[10px] text-slate-400 font-mono">${escapeHTML(msg.time || '')}</span>
                            <span class="text-[11px] font-bold text-blue-600 dark:text-blue-400">${escapeHTML(senderName)}</span>
                            <i class="fa-solid fa-shield-halved text-blue-500 text-[10px]"></i>
                        </div>
                        <div class="bg-blue-600 text-white p-3.5 rounded-2xl rounded-tr-xs text-xs text-left shadow-xs whitespace-pre-line break-words inline-block leading-relaxed max-w-full">${contentTrimmed}</div>
                    </div>
                    <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-blue-700 text-white flex items-center justify-center text-xs font-black shrink-0 mt-1 shadow-xs">
                        <i class="fa-solid fa-headset text-xs"></i>
                    </div>
                </div>
            `;
        } else {
            const avatarMarkup = avatar
                ? `<img src="${escapeHTML(avatar)}" alt="${escapeHTML(senderName)}" class="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700 shadow-xs shrink-0 mt-1" onerror="this.onerror=null;this.parentElement.innerHTML='<div class=\\'w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0 mt-1 shadow-xs\\'>${initial}</div>';" />`
                : `<div class="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0 mt-1 shadow-xs">${initial}</div>`;

            return `
                <div class="flex items-start justify-start space-x-2.5 my-2">
                    ${avatarMarkup}
                    <div class="max-w-[80%] text-left">
                        <div class="flex items-center gap-1.5 mb-1">
                            <span class="text-[11px] font-bold text-slate-800 dark:text-white">${escapeHTML(senderName)}</span>
                            <span class="text-[10px] text-slate-400 font-mono">${escapeHTML(msg.time || '')}</span>
                        </div>
                        <div class="bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 p-3.5 rounded-2xl rounded-tl-xs text-xs border border-slate-200 dark:border-slate-600 shadow-xs whitespace-pre-line break-words text-left inline-block leading-relaxed max-w-full">${contentTrimmed}</div>
                    </div>
                </div>
            `;
        }
    }).join('');

    // Cuộn xuống tin nhắn mới nhất
    if (!preserveScroll || (currentScrollHeight - currentScrollTop - container.clientHeight < 50)) {
        container.scrollTop = container.scrollHeight;
    }
}

let isSubmittingReply = false;
async function submitTicketReply() {
    if (isSubmittingReply) return;
    const id = document.getElementById('replyTicketId').value;
    const replyInput = document.getElementById('replyContentInput');
    const reply = (replyInput?.value || '').trim();
    const chosenStatus = document.getElementById('replyTicketStatusSelect')?.value || 'resolved';

    if (!reply) {
        showAdminToast('Thiếu Thông Tin', 'Vui lòng nhập nội dung câu trả lời phản hồi!', 'warning');
        replyInput?.focus();
        return;
    }

    const btn = document.getElementById('submitTicketReplyBtn');
    const origHtml = btn ? btn.innerHTML : '';
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i><span>Đang gửi...</span>';
    }
    isSubmittingReply = true;

    try {
        // 1. Gọi Backend API thật
        if (window.AdminSupportAPI && typeof window.AdminSupportAPI.replyTicket === 'function') {
            await window.AdminSupportAPI.replyTicket(id, reply, chosenStatus);
        }

        // 2. Cập nhật trạng thái trong allTickets
        const t = allTickets.find(ticket => String(ticket.id) === String(id) || String(ticket.code) === String(id));
        if (t) {
            t.status = chosenStatus;
            t.adminReply = reply;
        }

        showAdminToast('Thành Công', 'Đã lưu phản hồi và cập nhật trạng thái yêu cầu!', 'success');

        // Xóa nội dung vừa gõ
        if (replyInput) replyInput.value = '';

        // Nạp lại dữ liệu ngay lập tức để chat thread hiển thị tin nhắn mới
        await loadTickets(true);

    } catch (err) {
        console.error('Lỗi phản hồi ticket:', err);
        showAdminToast('Lỗi Gửi Phản Hồi', 'Có lỗi xảy ra trong quá trình lưu phản hồi, vui lòng thử lại!', 'error');
    } finally {
        isSubmittingReply = false;
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = origHtml;
        }
    }
}

function openBroadcastModal() {
    document.getElementById('broadcastModal').classList.remove('hidden');
}

function submitBroadcast() {
    const title = document.getElementById('broadcastTitle').value.trim();
    const content = document.getElementById('broadcastContent').value.trim();
    if (!title || !content) {
        showAdminToast('Thiếu Thông Tin', 'Vui lòng nhập đầy đủ tiêu đề và nội dung thông cáo!', 'warning');
        return;
    }

    if (window.DB && typeof window.DB.getUsers === 'function') {
        const users = window.DB.getUsers();
        users.forEach(u => {
            if (!u.notifications) u.notifications = [];
            u.notifications.unshift({
                id: 'N_' + Date.now() + '_' + Math.random(),
                title: '📢 ' + title,
                message: content,
                date: new Date().toLocaleString('vi-VN'),
                read: false,
                type: 'broadcast'
            });
        });
        localStorage.setItem('halm_db_users', JSON.stringify(users));
        if (typeof window.DB.emitChange === 'function') window.DB.emitChange();
    }

    closeModal('broadcastModal');
    showAdminToast('Phát Thông Báo Thành Công', 'Đã gửi thông báo hệ thống tới toàn bộ độc giả!', 'success');
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.add('hidden');
    if (id === 'replyTicketModal') {
        activeOpenTicketId = null;
    }
}

// Xuất danh sách Ticket ra file CSV/Excel
function exportTicketsExcel() {
    const query = (document.getElementById('ticketSearchInput')?.value || '').trim();
    const status = document.getElementById('ticketStatusFilter')?.value || '';
    const filterParts = [];
    if (query) filterParts.push(`Từ khóa "${query}"`);
    if (status) filterParts.push(`Trạng thái: ${status === 'resolved' ? 'Đã giải quyết' : (status === 'in_progress' ? 'Đang xử lý' : 'Chờ xử lý')}`);

    const filterDesc = filterParts.length > 0 ? filterParts.join(' • ') : 'Tất cả dữ liệu (không lọc)';

    const columns = [
        { key: 'code', label: 'Mã Ticket', isPrimary: true },
        { key: 'userName', label: 'Họ Tên Độc Giả', isPrimary: true },
        { key: 'userEmail', label: 'Email Độc Giả', isPrimary: true },
        { key: 'subject', label: 'Tiêu Đề Yêu Cầu', isPrimary: true },
        { key: 'createdAt', label: 'Thời Gian Gửi', isPrimary: true },
        { key: 'status', label: 'Trạng Thái', isPrimary: true },
        { key: 'message', label: 'Nội Dung Chi Tiết', isPrimary: false },
        { key: 'adminReply', label: 'Nội Dung Phản Hồi', isPrimary: false },
        { key: 'replyAt', label: 'Thời Gian Phản Hồi', isPrimary: false }
    ];

    const formatters = {
        code: t => `"${t.code || t.id || ''}"`,
        userName: t => `"${(t.userName || '').replace(/"/g, '""')}"`,
        userEmail: t => `"${(t.userEmail || '').replace(/"/g, '""')}"`,
        subject: t => `"${(t.subject || '').replace(/"/g, '""')}"`,
        createdAt: t => `"${t.createdAt || ''}"`,
        status: t => t.status === 'resolved' ? '"Đã giải quyết"' : (t.status === 'in_progress' ? '"Đang xử lý"' : '"Chờ xử lý"'),
        message: t => `"${(t.message || '').replace(/"/g, '""')}"`,
        adminReply: t => `"${(t.adminReply || t.reply || '').replace(/"/g, '""')}"`,
        replyAt: t => `"${t.replyAt || t.repliedAt || ''}"`
    };

    const executeExport = (scope, selectedColumnKeys = []) => {
        const targetList = (scope === 'filtered') ? currentFilteredTickets : allTickets;
        if (!targetList || targetList.length === 0) {
            showAdminToast('Thông Báo', 'Không có yêu cầu hỗ trợ nào để xuất!', 'warning');
            return;
        }

        const activeKeys = (selectedColumnKeys && selectedColumnKeys.length > 0)
            ? selectedColumnKeys
            : columns.filter(c => c.isPrimary).map(c => c.key);

        const chosenCols = columns.filter(c => activeKeys.includes(c.key));
        if (chosenCols.length === 0) {
            showAdminToast('Thiếu Cột Xuất', 'Vui lòng chọn ít nhất 1 cột để xuất file!', 'warning');
            return;
        }

        const headers = chosenCols.map(c => `"${c.label}"`);
        const rows = targetList.map(t => chosenCols.map(c => (formatters[c.key] ? formatters[c.key](t) : '""')).join(','));

        const csvContent = [headers.join(','), ...rows].join('\r\n');
        const timestamp = new Date().toISOString().slice(0, 10);
        const filename = `HALMBOOK_KhieuNaiHoTro_${scope}_${timestamp}.csv`;

        if (window.AdminUI && window.AdminUI.downloadCSV) {
            window.AdminUI.downloadCSV(filename, csvContent);
        } else {
            const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }

        showAdminToast('Xuất Thành Công', `Đã xuất thành công ${targetList.length} yêu cầu hỗ trợ!`, 'success');
    };

    if (window.AdminUI && window.AdminUI.showExportModal) {
        window.AdminUI.showExportModal({
            title: 'Xác nhận xuất danh sách Yêu cầu Hỗ trợ',
            datasetName: 'Khiếu nại & Yêu cầu Hỗ trợ độc giả',
            defaultFilename: `HALMBOOK_KhieuNaiHoTro_${new Date().toISOString().slice(0, 10)}.csv`,
            currentFilterDesc: filterDesc,
            totalCount: allTickets.length,
            filteredCount: currentFilteredTickets.length,
            columns: columns,
            onExport: executeExport
        });
    } else {
        executeExport('all');
    }
}

window.filterTickets = filterTickets;
window.resetTicketFilters = resetTicketFilters;
window.exportTicketsExcel = exportTicketsExcel;
window.openBroadcastModal = openBroadcastModal;
window.submitBroadcast = submitBroadcast;
window.closeModal = closeModal;
window.submitTicketReply = submitTicketReply;
window.openReplyModal = openReplyModal;
window.loadMoreTickets = loadMoreTickets;
window.handleTicketStatusChange = handleTicketStatusChange;
window.showAdminToast = showAdminToast;
