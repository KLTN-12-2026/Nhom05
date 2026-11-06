import React from 'react';
import { useLegacyAdminPage } from './legacy-runtime';

const pageCode = "\n        let allTickets = [];\n\n        document.addEventListener('DOMContentLoaded', function() {\n            loadTickets();\n            DB.onUpdate(loadTickets);\n        });\n\n        function loadTickets() {\n            allTickets = DB.getTickets();\n            renderTicketStats();\n            filterTickets();\n        }\n\n        function renderTicketStats() {\n            const pending = allTickets.filter(t => t.status === 'pending').length;\n            const resolved = allTickets.filter(t => t.status === 'resolved').length;\n\n            document.getElementById('statTotalTickets').innerText = allTickets.length;\n            document.getElementById('statPendingTickets').innerText = pending;\n            document.getElementById('statResolvedTickets').innerText = resolved;\n        }\n\n        \n        let currentDisplayCount = 10;\n        let currentFilteredTickets = [];\n\n        function resetTicketFilters() {\n            document.getElementById('ticketSearchInput').value = '';\n            document.getElementById('ticketStatusFilter').value = '';\n            filterTickets();\n        }\n\n        function filterTickets() {\n            const query = document.getElementById('ticketSearchInput').value.toLowerCase().trim();\n            const status = document.getElementById('ticketStatusFilter').value;\n\n            currentFilteredTickets = allTickets.filter(ticket => {\n                const searchableText = [ticket.code, ticket.userName, ticket.userEmail, ticket.subject, ticket.message]\n                    .filter(Boolean)\n                    .join(' ')\n                    .toLowerCase();\n                return (!query || searchableText.includes(query)) && (!status || ticket.status === status);\n            });\n            currentDisplayCount = 10;\n            renderTicketsTable();\n        }\n\n        function loadMoreTickets() {\n            currentDisplayCount += 10;\n            renderTicketsTable();\n        }\n\n        function renderTicketsTable() {\n            const tbody = document.getElementById('ticketsTableBody');\n            const loadMoreButton = document.getElementById('loadMoreTicketsBtn');\n            const countSummary = document.getElementById('ticketCountSummary');\n            if (countSummary) {\n                countSummary.innerText = `Hiển thị ${Math.min(currentDisplayCount, currentFilteredTickets.length)} / ${currentFilteredTickets.length} yêu cầu`;\n            }\n            if (!tbody) return;\n\n            const visibleTickets = currentFilteredTickets.slice(0, currentDisplayCount);\n            if (loadMoreButton) {\n                loadMoreButton.style.display = currentDisplayCount < currentFilteredTickets.length ? 'flex' : 'none';\n            }\n\n            if (visibleTickets.length === 0) {\n                tbody.innerHTML = '<tr><td colspan=\"7\" class=\"py-12 text-center text-slate-400 font-bold\">Không tìm thấy yêu cầu hỗ trợ nào phù hợp với bộ lọc.</td></tr>';\n                return;\n            }\n\n            const escapeHTML = value => String(value ?? '').replace(/[&<>\"']/g, char => ({\n                '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', \"'\": '&#39;'\n            })[char]);\n\n            tbody.innerHTML = visibleTickets.map(ticket => {\n                const isResolved = ticket.status === 'resolved';\n                const statusMarkup = (window.AdminUI && window.AdminUI.renderBadge)\n                    ? window.AdminUI.renderBadge(ticket.status)\n                    : (isResolved\n                        ? '<span class=\"inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800\"><i class=\"fa-solid fa-circle-check text-[10px]\"></i>Đã giải quyết</span>'\n                        : '<span class=\"inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 dark:border-amber-800\"><i class=\"fa-solid fa-clock text-[10px]\"></i>Chờ xử lý</span>');\n\n                const avatarHtml = (window.AdminUI && window.AdminUI.renderAvatar)\n                    ? window.AdminUI.renderAvatar({ name: ticket.userName, size: 'w-7 h-7', textSize: 'text-[10px]' })\n                    : `<div class=\"w-7 h-7 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 font-black flex items-center justify-center text-[10px] shrink-0\">${(ticket.userName || 'U').charAt(0)}</div>`;\n\n                return `<tr class=\"hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors\">\n                    <td class=\"py-3 px-3 text-center border-r border-slate-200 dark:border-slate-700 w-px whitespace-nowrap\"><span class=\"font-mono font-black text-blue-600 dark:text-blue-400\">${escapeHTML(ticket.code)}</span></td>\n                    <td class=\"py-3 px-4 border-r border-slate-200 dark:border-slate-700 min-w-[200px]\">\n                        <div class=\"flex items-center space-x-2.5\">\n                            ${avatarHtml}\n                            <div>\n                                <div class=\"font-bold text-slate-800 dark:text-white\">${escapeHTML(ticket.userName)}</div>\n                                <div class=\"text-[11px] text-slate-500 font-mono break-all\">${escapeHTML(ticket.userEmail)}</div>\n                            </div>\n                        </div>\n                    </td>\n                    <td class=\"py-3 px-4 border-r border-slate-200 dark:border-slate-700 min-w-[250px] whitespace-normal break-words\">\n                        <div class=\"font-bold text-slate-800 dark:text-white mb-1 break-words\">${escapeHTML(ticket.subject)}</div>\n                        <div class=\"text-[11px] text-slate-500 dark:text-slate-400 whitespace-normal break-words\">${escapeHTML(ticket.message)}</div>\n                    </td>\n                    <td class=\"py-3 px-3 text-center border-r border-slate-200 dark:border-slate-700 w-px whitespace-nowrap text-slate-500 font-mono text-[11px]\">${escapeHTML(ticket.createdAt)}</td>\n                    <td class=\"py-3 px-3 text-center border-r border-slate-200 dark:border-slate-700 w-px whitespace-nowrap\">${statusMarkup}</td>\n                    <td class=\"py-3 px-4 border-r border-slate-200 dark:border-slate-700 min-w-[200px] whitespace-normal break-words\">\n                        ${ticket.reply ? `<div class=\"text-xs text-slate-700 dark:text-slate-300 italic whitespace-normal break-words bg-slate-50 dark:bg-slate-800/80 p-2 rounded-lg border border-slate-200 dark:border-slate-700\">\"${escapeHTML(ticket.reply)}\"</div><div class=\"text-[10px] text-slate-400 font-mono mt-1\"><i class=\"fa-solid fa-check-double text-blue-500 mr-1\"></i>${escapeHTML(ticket.repliedAt || '')} (${escapeHTML(ticket.repliedBy || 'Admin')})</div>` : '<span class=\"text-slate-400 italic text-[11px]\">Chưa phản hồi</span>'}\n                    </td>\n                    <td class=\"py-3 px-3 text-center border-r border-slate-200 dark:border-slate-700 w-px whitespace-nowrap\">\n                        <button onclick=\"openReplyModal('${escapeHTML(ticket.id)}')\" class=\"px-2.5 py-1.5 rounded-lg ${isResolved ? 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-200 hover:bg-slate-200' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-500/20'} text-[11px] font-bold transition flex items-center gap-1 mx-auto\">\n                            <i class=\"fa-solid fa-comments text-xs\"></i>\n                            <span>${isResolved ? 'Xem lại' : 'Xử lý'}</span>\n                        </button>\n                    </td>\n                </tr>`;\n            }).join('');\n        }\n\n        function openReplyModal(ticketId) {\n            const ticket = allTickets.find(t => t.id === ticketId);\n            if (!ticket) return;\n\n            document.getElementById('replyTicketId').value = ticket.id;\n            document.getElementById('replyTicketCode').innerText = ticket.code;\n            document.getElementById('replyTicketSubject').innerText = ticket.subject;\n            document.getElementById('replyTicketUser').innerText = ticket.userName;\n            document.getElementById('replyTicketEmail').innerText = ticket.userEmail;\n            document.getElementById('replyTicketCreatedAt').innerText = ticket.createdAt || '';\n            document.getElementById('replyTicketThreadUserTime').innerText = ticket.createdAt || '';\n            document.getElementById('replyTicketMessage').innerText = ticket.message || '';\n\n            // Avatar\n            const avatarContainer = document.getElementById('replyTicketAvatar');\n            if (avatarContainer && window.AdminUI && window.AdminUI.renderAvatar) {\n                avatarContainer.innerHTML = window.AdminUI.renderAvatar({ name: ticket.userName, size: 'w-10 h-10', textSize: 'text-xs' });\n            }\n\n            // Status badge in modal\n            const statusBadgeContainer = document.getElementById('replyTicketStatusBadge');\n            if (statusBadgeContainer && window.AdminUI && window.AdminUI.renderBadge) {\n                statusBadgeContainer.innerHTML = window.AdminUI.renderBadge(ticket.status);\n            }\n\n            // Admin response thread section\n            const adminSection = document.getElementById('replyThreadAdminSection');\n            const adminText = document.getElementById('replyThreadAdminText');\n            const adminTime = document.getElementById('replyThreadAdminTime');\n            const adminName = document.getElementById('replyThreadAdminName');\n            const statusSelect = document.getElementById('replyTicketStatusSelect');\n\n            if (ticket.reply) {\n                if (adminSection) adminSection.classList.remove('hidden');\n                if (adminText) adminText.innerText = ticket.reply;\n                if (adminTime) adminTime.innerText = ticket.repliedAt || '';\n                if (adminName) adminName.innerText = (ticket.repliedBy || 'Ban Quản Trị HALMBOOK');\n                document.getElementById('replyContentInput').value = ticket.reply;\n            } else {\n                if (adminSection) adminSection.classList.add('hidden');\n                document.getElementById('replyContentInput').value = '';\n            }\n\n            if (statusSelect) {\n                statusSelect.value = ticket.status || 'resolved';\n            }\n\n            document.getElementById('replyTicketModal').classList.remove('hidden');\n        }\n\n        let isSubmittingReply = false;\n        async function submitTicketReply() {\n            if (isSubmittingReply) return;\n            const id = document.getElementById('replyTicketId').value;\n            const reply = document.getElementById('replyContentInput').value.trim();\n\n            if (!reply) {\n                DB.notify('Vui lòng nhập nội dung câu trả lời phản hồi!', 'warning');\n                document.getElementById('replyContentInput')?.focus();\n                return;\n            }\n\n            const btn = document.getElementById('submitTicketReplyBtn');\n            const origHtml = btn ? btn.innerHTML : '';\n            if (btn) {\n                btn.disabled = true;\n                btn.innerHTML = `<i class=\"fa-solid fa-spinner fa-spin\"></i><span>Đang gửi phản hồi...</span>`;\n            }\n            isSubmittingReply = true;\n\n            try {\n                // Tự động lưu phản hồi và chuyển trạng thái sang \"resolved\" (Đã giải quyết)\n                const updated = DB.replyTicket(id, reply, 'Ban Quản Trị HALMBOOK');\n                if (updated) {\n                    closeModal('replyTicketModal');\n                    DB.notify(`Đã gửi phản hồi thành công! Yêu cầu #${updated.code || updated.id} đã tự động chuyển sang trạng thái \"Đã giải quyết\".`, 'success');\n                    // Cập nhật ngay danh sách bảng và số liệu thống kê\n                    loadTickets();\n                } else {\n                    DB.notify('Không tìm thấy khiếu nại để cập nhật phản hồi!', 'error');\n                }\n            } catch (err) {\n                console.error('Lỗi phản hồi ticket:', err);\n                DB.notify('Có lỗi xảy ra trong quá trình lưu phản hồi, vui lòng thử lại!', 'error');\n            } finally {\n                isSubmittingReply = false;\n                if (btn) {\n                    btn.disabled = false;\n                    btn.innerHTML = origHtml;\n                }\n            }\n        }\n\n        function openBroadcastModal() {\n            document.getElementById('broadcastModal').classList.remove('hidden');\n        }\n\n        function submitBroadcast() {\n            const title = document.getElementById('broadcastTitle').value.trim();\n            const content = document.getElementById('broadcastContent').value.trim();\n            if (!title || !content) {\n                DB.notify('Vui lòng nhập đầy đủ tiêu đề và nội dung thông cáo!', 'warning');\n                return;\n            }\n\n            const users = DB.getUsers();\n            users.forEach(u => {\n                if (!u.notifications) u.notifications = [];\n                u.notifications.unshift({\n                    id: 'N_' + Date.now() + '_' + Math.random(),\n                    title: '📢 ' + title,\n                    message: content,\n                    date: new Date().toLocaleString('vi-VN'),\n                    read: false,\n                    type: 'broadcast'\n                });\n            });\n            localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));\n            DB.emitChange();\n\n            closeModal('broadcastModal');\n            DB.notify('Đã phát thông báo toàn hệ thống đến toàn bộ độc giả!', 'success');\n        }\n\n        function closeModal(id) {\n            document.getElementById(id).classList.add('hidden');\n        }\n\n        // Xuất danh sách Ticket ra file CSV/Excel với modal cấu hình nâng cao\n        function exportTicketsExcel() {\n            const query = (document.getElementById('ticketSearchInput')?.value || '').trim();\n            const status = document.getElementById('ticketStatusFilter')?.value || '';\n            const filterParts = [];\n            if (query) filterParts.push(`Từ khóa \"${query}\"`);\n            if (status) filterParts.push(`Trạng thái: ${status === 'resolved' ? 'Đã giải quyết' : 'Chờ xử lý'}`);\n\n            const filterDesc = filterParts.length > 0 ? filterParts.join(' • ') : 'Tất cả dữ liệu (không lọc)';\n\n            const columns = [\n                { key: 'code', label: 'Mã Ticket', isPrimary: true },\n                { key: 'userName', label: 'Họ Tên Độc Giả', isPrimary: true },\n                { key: 'userEmail', label: 'Email Độc Giả', isPrimary: true },\n                { key: 'subject', label: 'Tiêu Đề Yêu Cầu', isPrimary: true },\n                { key: 'createdAt', label: 'Thời Gian Gửi', isPrimary: true },\n                { key: 'status', label: 'Trạng Thái', isPrimary: true },\n                { key: 'message', label: 'Nội Dung Chi Tiết', isPrimary: false },\n                { key: 'reply', label: 'Nội Dung Phản Hồi', isPrimary: false },\n                { key: 'repliedAt', label: 'Thời Gian Phản Hồi', isPrimary: false },\n                { key: 'repliedBy', label: 'Người Phản Hồi', isPrimary: false }\n            ];\n\n            const formatters = {\n                code: t => `\"${t.code || t.id || ''}\"`,\n                userName: t => `\"${(t.userName || '').replace(/\"/g, '\"\"')}\"`,\n                userEmail: t => `\"${(t.userEmail || '').replace(/\"/g, '\"\"')}\"`,\n                subject: t => `\"${(t.subject || '').replace(/\"/g, '\"\"')}\"`,\n                createdAt: t => `\"${t.createdAt || ''}\"`,\n                status: t => t.status === 'resolved' ? '\"Đã giải quyết\"' : '\"Chờ xử lý\"',\n                message: t => `\"${(t.message || '').replace(/\"/g, '\"\"')}\"`,\n                reply: t => `\"${(t.reply || '').replace(/\"/g, '\"\"')}\"`,\n                repliedAt: t => `\"${t.repliedAt || ''}\"`,\n                repliedBy: t => `\"${(t.repliedBy || '').replace(/\"/g, '\"\"')}\"`\n            };\n\n            const executeExport = (scope, selectedColumnKeys = []) => {\n                const targetList = (scope === 'filtered') ? currentFilteredTickets : allTickets;\n                if (!targetList || targetList.length === 0) {\n                    DB.notify('Không có yêu cầu hỗ trợ nào để xuất!', 'warning');\n                    return;\n                }\n\n                const activeKeys = (selectedColumnKeys && selectedColumnKeys.length > 0)\n                    ? selectedColumnKeys\n                    : columns.filter(c => c.isPrimary).map(c => c.key);\n\n                const chosenCols = columns.filter(c => activeKeys.includes(c.key));\n                if (chosenCols.length === 0) {\n                    DB.notify('Vui lòng chọn ít nhất 1 cột để xuất file!', 'warning');\n                    return;\n                }\n\n                const headers = chosenCols.map(c => `\"${c.label}\"`);\n                const rows = targetList.map(t => chosenCols.map(c => (formatters[c.key] ? formatters[c.key](t) : '\"\"')).join(','));\n\n                const csvContent = [headers.join(','), ...rows].join('\\r\\n');\n                const timestamp = new Date().toISOString().slice(0, 10);\n                const filename = `HALMBOOK_KhieuNaiHoTro_${scope}_${timestamp}.csv`;\n\n                if (window.AdminUI && window.AdminUI.downloadCSV) {\n                    window.AdminUI.downloadCSV(filename, csvContent);\n                } else {\n                    const blob = new Blob(['\\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });\n                    const url = URL.createObjectURL(blob);\n                    const link = document.createElement('a');\n                    link.href = url;\n                    link.download = filename;\n                    document.body.appendChild(link);\n                    link.click();\n                    document.body.removeChild(link);\n                }\n\n                DB.notify(`Đã xuất thành công ${targetList.length} yêu cầu hỗ trợ với ${chosenCols.length} cột (${scope === 'filtered' ? 'bộ lọc hiện tại' : 'toàn bộ'})!`, 'success');\n            };\n\n            if (window.AdminUI && window.AdminUI.showExportModal) {\n                window.AdminUI.showExportModal({\n                    title: 'Xác nhận xuất danh sách Yêu cầu Hỗ trợ',\n                    datasetName: 'Khiếu nại & Yêu cầu Hỗ trợ độc giả',\n                    defaultFilename: `HALMBOOK_KhieuNaiHoTro_${new Date().toISOString().slice(0, 10)}.csv`,\n                    currentFilterDesc: filterDesc,\n                    totalCount: allTickets.length,\n                    filteredCount: currentFilteredTickets.length,\n                    columns: columns,\n                    onExport: executeExport\n                });\n            } else {\n                executeExport('all');\n            }\n        }\n    ";

export default function ThongBaoHoTro() {
  useLegacyAdminPage("ThongBaoHoTro.html", pageCode, false);

  return (
    <div className="admin-page-root">
{/* Shared Sidebar */}
    <div id="admin-sidebar-container"></div>

    {/* Main Content Area (No Footer) */}
    <main className="flex-1 flex flex-col h-full bg-white dark:bg-gray-950 overflow-hidden">
        {/* Shared Header */}
        <div id="admin-header-container" data-title="Trung Tâm Hỗ Trợ & Khiếu Nại" data-subtitle="Danh sách yêu cầu trợ giúp từ độc giả, thông tin đầy đủ kèm luồng phản hồi trực tiếp 2 chiều"></div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
            <div className="w-full space-y-4">

                {/* 3 Ticket Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-extrabold uppercase text-slate-500 dark:text-slate-400">Tổng Số Ticket</p>
                            <h4 id="statTotalTickets" className="text-xl font-black text-slate-800 dark:text-white mt-1">0</h4>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200 dark:border-blue-800">
                            <i className="fa-solid fa-ticket"></i>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-extrabold uppercase text-amber-600 dark:text-amber-400">Chờ Quản Trị Viên Phản Hồi</p>
                            <h4 id="statPendingTickets" className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1">0</h4>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-800">
                            <i className="fa-solid fa-clock"></i>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-extrabold uppercase text-emerald-600 dark:text-emerald-400">Đã Phản Hồi & Xử Lý</p>
                            <h4 id="statResolvedTickets" className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">0</h4>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
                            <i className="fa-solid fa-circle-check"></i>
                        </div>
                    </div>
                </div>

                {/* Tickets Detailed List Table */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col">
                    {/* Integrated Search & Filter (TOP) */}
                    <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-slate-50 dark:bg-slate-800/50">
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="relative w-full sm:w-72">
                                <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-3 text-slate-400 text-xs"></i>
                                <input type="text" id="ticketSearchInput" onKeyUp={() => { window.filterTickets() }} placeholder="Tìm theo mã, tên khách, nội dung, ngày gửi..." className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <select id="ticketStatusFilter" onChange={() => { window.filterTickets() }} className="px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold dark:text-white">
                                <option value="">Tất cả trạng thái</option>
                                <option value="pending">Chờ xử lý</option>
                                <option value="resolved">Đã giải quyết</option>
                            </select>

                            <button onClick={() => { window.resetTicketFilters() }} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-gray-200 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-600 flex items-center space-x-1.5 transition" title="Đặt lại tất cả bộ lọc">
                                <i className="fa-solid fa-rotate-left"></i>
                                <span>Đặt lại</span>
                            </button>

                            <span id="ticketCountSummary" className="text-xs font-bold text-slate-500 dark:text-slate-400 px-2 py-1 bg-slate-100 dark:bg-slate-700/60 rounded-lg border border-slate-200 dark:border-slate-700">Hiển thị: 0</span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                            <button onClick={() => { window.exportTicketsExcel() }} className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center space-x-1.5 transition" title="Xuất danh sách khiếu nại & hỗ trợ ra Excel/CSV">
                                <i className="fa-solid fa-file-excel"></i>
                                <span>Xuất Excel</span>
                            </button>
                            <button onClick={() => { window.openBroadcastModal() }} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-blue-500/30 flex items-center space-x-2 transition">
                                <i className="fa-solid fa-bullhorn"></i>
                                <span>Gửi Thông Báo Hệ Thống</span>
                            </button>
                        </div>
                    </div>
                    <div className="p-4 border-b-2 border-slate-300 dark:border-slate-600 dark:border-slate-600">
                        <h3 className="font-black text-sm text-slate-800 dark:text-white flex items-center gap-2">
                            <i className="fa-solid fa-list-check text-blue-600 dark:text-blue-400"></i>
                            <span>Danh Sách Chi Tiết Yêu Cầu Hỗ Trợ Độc Giả</span>
                        </h3>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead className="bg-slate-50 dark:bg-slate-700 border-b-2 border-slate-300 dark:border-slate-600 dark:border-slate-600 uppercase font-black text-[11px] text-slate-700 dark:text-gray-200">
                                <tr>
                                    <th className="py-3 px-3 text-center border-r border-slate-200 dark:border-slate-700 w-px whitespace-nowrap">Mã Ticket</th>
                                    <th className="py-3 px-4 border-r border-slate-200 dark:border-slate-700 min-w-[200px]">Khách Hàng</th>
                                    <th className="py-3 px-4 border-r border-slate-200 dark:border-slate-700 min-w-[200px]">Tiêu Đề & Nội Dung Yêu Cầu</th>
                                    <th className="py-3 px-3 text-center border-r border-slate-200 dark:border-slate-700 w-px whitespace-nowrap">Thời Gian Gửi</th>
                                    <th className="py-3 px-3 text-center border-r border-slate-200 dark:border-slate-700 w-px whitespace-nowrap">Trạng Thái</th>
                                    <th className="py-3 px-4 border-r border-slate-200 dark:border-slate-700 min-w-[200px]">Nội Dung Phản Hồi Từ Admin</th>
                                    <th className="py-3 px-3 text-center border-r border-slate-200 dark:border-slate-700 w-px whitespace-nowrap text-center">Thao Tác</th>
                                </tr>
                            </thead>
                            <tbody id="ticketsTableBody" className="divide-y-2 divide-gray-100 dark:divide-gray-800 font-semibold">
                                {/* Rendered dynamically */}
                            </tbody>
                        </table>
                    </div>
                    {/* Table Bottom Bar: Load More */}
                    <div className="relative py-2 px-4 flex justify-end items-center gap-2 bg-slate-50/80 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-700/50">
                        <button id="loadMoreTicketsBtn" onClick={() => { window.loadMoreTickets() }} className="px-3.5 py-1.5 bg-white dark:bg-slate-700 hover:bg-blue-50 dark:hover:bg-slate-600 text-slate-600 dark:text-white rounded-lg text-xs font-bold border border-slate-300 dark:border-slate-600 flex items-center space-x-1.5 transition" style={{display: "none"}}>
                            <i className="fa-solid fa-chevron-down text-xs"></i>
                            <span>Xem thêm</span>
                        </button>
                    </div>
                </div>

            </div>
        </div>
    </main>

    {/* Modal Phản Hồi Ticket / Quản Lý Yêu Cầu Hỗ Trợ (Structured Thread View) */}
    <div id="replyTicketModal" className="fixed inset-0 bg-slate-800/60 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full border border-slate-300 dark:border-slate-700 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            {/* Modal Header (Sticky) */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70">
                <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 flex items-center justify-center text-sm">
                        <i className="fa-solid fa-comments"></i>
                    </div>
                    <div>
                        <h3 className="font-black text-sm text-slate-800 dark:text-white flex items-center gap-2">
                            <span>Chi Tiết & Phản Hồi Yêu Cầu</span>
                            <span id="replyTicketCode" className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">#TK-0000</span>
                        </h3>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400" id="replyTicketSubject">Chủ đề hỗ trợ</p>
                    </div>
                </div>
                <button onClick={() => { window.closeModal('replyTicketModal') }} className="text-slate-400 hover:text-slate-700 dark:hover:text-white font-bold p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition">
                    <i className="fa-solid fa-xmark text-lg"></i>
                </button>
            </div>

            {/* Modal Body (Scrollable Conversation Thread) */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {/* Customer Info Banner */}
                <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div id="replyTicketAvatar" className="shrink-0">
                            {/* Avatar inserted dynamically */}
                        </div>
                        <div>
                            <div className="font-black text-xs text-slate-800 dark:text-white flex items-center gap-1.5">
                                <span id="replyTicketUser">Khách hàng</span>
                                <span id="replyTicketStatusBadge"></span>
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono" id="replyTicketEmail">email@example.com</div>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Thời gian tạo</span>
                        <span className="text-xs font-mono font-semibold text-slate-600 dark:text-slate-300" id="replyTicketCreatedAt">--:--</span>
                    </div>
                </div>

                {/* Conversation Thread Timeline */}
                <div className="space-y-3">
                    <p className="text-[11px] font-extrabold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Tiến trình trao đổi</p>

                    {/* Message 1: Độc giả gửi */}
                    <div className="flex items-start space-x-3">
                        <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                            <i className="fa-solid fa-user"></i>
                        </div>
                        <div className="flex-1 bg-white dark:bg-slate-700/60 p-3.5 rounded-2xl rounded-tl-sm border border-slate-200 dark:border-slate-600 shadow-xs">
                            <div className="flex justify-between items-center mb-1">
                                <span className="font-extrabold text-xs text-slate-800 dark:text-white">Ý kiến / Câu hỏi từ độc giả</span>
                                <span className="text-[10px] text-slate-400 font-mono" id="replyTicketThreadUserTime">--:--</span>
                            </div>
                            <p id="replyTicketMessage" className="text-xs text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">...</p>
                        </div>
                    </div>

                    {/* Message 2: Admin trả lời (nếu đã có phản hồi trước) */}
                    <div id="replyThreadAdminSection" className="flex items-start space-x-3">
                        <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                            <i className="fa-solid fa-shield-halved"></i>
                        </div>
                        <div className="flex-1 bg-emerald-50/60 dark:bg-emerald-950/20 p-3.5 rounded-2xl rounded-tl-sm border border-emerald-200 dark:border-emerald-800 shadow-xs">
                            <div className="flex justify-between items-center mb-1">
                                <span className="font-extrabold text-xs text-emerald-800 dark:text-emerald-300" id="replyThreadAdminName">Ban Quản Trị HALMBOOK</span>
                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono" id="replyThreadAdminTime">--:--</span>
                            </div>
                            <p id="replyThreadAdminText" className="text-xs text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed italic">Chưa có phản hồi</p>
                        </div>
                    </div>
                </div>

                {/* Input Response Composer */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-3">
                    <input type="hidden" id="replyTicketId" />
                    <div className="flex items-center justify-between">
                        <label className="block text-xs font-extrabold text-slate-700 dark:text-gray-200 uppercase">
                            <i className="fa-solid fa-pen-to-square text-blue-600 mr-1"></i> Soạn phản hồi từ Quản Trị Viên *
                        </label>
                        <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded-lg text-xs font-bold">
                            <i className="fa-solid fa-bolt text-emerald-500"></i>
                            <span>Tự động chuyển: <b>Đã giải quyết</b></span>
                        </div>
                        <input type="hidden" id="replyTicketStatusSelect" value="resolved" />
                    </div>
                    <textarea id="replyContentInput" rows="4" placeholder="Nhập câu trả lời rõ ràng, chi tiết và hướng giải quyết vấn đề cho độc giả..." className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-medium dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
                </div>
            </div>

            {/* Modal Footer (Sticky) */}
            <div className="flex justify-end space-x-2 px-6 py-3.5 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70">
                <button onClick={() => { window.closeModal('replyTicketModal') }} className="px-4 py-2 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-gray-200 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-600 transition">Hủy bỏ</button>
                <button id="submitTicketReplyBtn" onClick={() => { window.submitTicketReply() }} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-blue-500/20 flex items-center space-x-1.5 transition">
                    <i className="fa-solid fa-paper-plane"></i>
                    <span>Lưu & Gửi Phản Hồi</span>
                </button>
            </div>
        </div>
    </div>

    {/* Modal Thông Báo Toàn Hệ Thống */}
    <div id="broadcastModal" className="fixed inset-0 bg-slate-800/60 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-700 rounded-2xl max-w-md w-full p-6 border border-slate-300 dark:border-slate-600 dark:border-slate-600 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b-2 border-slate-300 dark:border-slate-600 dark:border-slate-600 pb-3">
                <h3 className="font-black text-base text-slate-800 dark:text-white flex items-center space-x-2">
                    <i className="fa-solid fa-bullhorn text-blue-600"></i>
                    <span>Thông Báo Toàn Hệ Thống</span>
                </h3>
                <button onClick={() => { window.closeModal('broadcastModal') }} className="text-slate-400 hover:text-slate-800 dark:hover:text-white font-bold"><i className="fa-solid fa-xmark text-lg"></i></button>
            </div>
            <div className="space-y-3">
                <div>
                    <label className="block text-xs font-extrabold text-slate-600 dark:text-gray-300 uppercase mb-1">Tiêu đề thông báo</label>
                    <input type="text" id="broadcastTitle" placeholder="Bảo trì hệ thống / Cập nhật tính năng mới..." className="w-full px-3.5 py-2 bg-white dark:bg-gray-700 border border-slate-300 dark:border-slate-600 dark:border-gray-600 rounded-xl text-xs font-bold dark:text-white" />
                </div>
                <div>
                    <label className="block text-xs font-extrabold text-slate-600 dark:text-gray-300 uppercase mb-1">Nội dung thông cáo</label>
                    <textarea id="broadcastContent" rows="4" placeholder="Nội dung sẽ được gửi đến tất cả người dùng trong hệ thống..." className="w-full px-3.5 py-2 bg-white dark:bg-gray-700 border border-slate-300 dark:border-slate-600 dark:border-gray-600 rounded-xl text-xs font-bold dark:text-white"></textarea>
                </div>
            </div>
            <div className="flex justify-end space-x-2 pt-3 border-t-2 border-slate-300 dark:border-slate-600 dark:border-slate-600">
                <button onClick={() => { window.closeModal('broadcastModal') }} className="px-4 py-2 bg-slate-50 dark:bg-gray-700 text-slate-700 dark:text-gray-200 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-600">Hủy</button>
                <button onClick={() => { window.submitBroadcast() }} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-600">Phát Thông Báo</button>
            </div>
        </div>
    </div>

    {/* Core Scripts */}
    </div>
  );
}
