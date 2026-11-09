import pageCode from './js/thongBaoHoTroPage.js?raw';
import React from 'react';
import { useLegacyAdminPage } from './legacy-runtime';
import * as adminSupportService from '@/services/adminSupportService';

// Cung cấp API backend thực tế cho giao diện quản trị Admin
if (typeof window !== 'undefined') {
    window.AdminSupportAPI = {
        getTickets: async (params) => {
            try {
                const data = await adminSupportService.getAdminTickets(params);
                const tickets = (data.tickets || []).map(t => ({
                    ...t,
                    reply: t.adminReply || t.reply || '',
                    repliedAt: t.replyAt || t.repliedAt || '',
                    repliedBy: 'Ban Quản Trị HALMBOOK'
                }));
                return {
                    ...data,
                    tickets
                };
            } catch (err) {
                console.error('Lỗi khi fetch Admin tickets từ server:', err);
                throw err;
            }
        },
        replyTicket: async (ticketId, reply, status = 'resolved') => {
            return await adminSupportService.replyAdminTicket(ticketId, reply, status);
        },
        updateStatus: async (ticketId, status) => {
            return await adminSupportService.updateAdminTicketStatus(ticketId, status);
        }
    };
}


export default function ThongBaoHoTro() {
  React.useEffect(() => {
    return () => {
      if (typeof window.stopSupportPolling === 'function') {
        window.stopSupportPolling();
      }
    };
  }, []);

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

                            {/* CUSTOM DROPDOWN: Lọc trạng thái */}
                            <div className="relative">
                                <select id="ticketStatusFilter" onChange={() => { window.filterTickets() }} className="appearance-none pl-3.5 pr-8 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 rounded-xl text-xs font-bold text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs">
                                    <option value="">Tất cả trạng thái</option>
                                    <option value="pending">🟡 Chờ xử lý</option>
                                    <option value="in_progress">🔵 Đang xử lý</option>
                                    <option value="resolved">🟢 Đã giải quyết</option>
                                </select>
                                <i className="fa-solid fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[10px]"></i>
                            </div>

                            <button onClick={() => { window.resetTicketFilters() }} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-gray-200 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-600 flex items-center space-x-1.5 transition cursor-pointer" title="Đặt lại tất cả bộ lọc">
                                <i className="fa-solid fa-rotate-left"></i>
                                <span>Đặt lại</span>
                            </button>

                            <span id="ticketCountSummary" className="text-xs font-bold text-slate-500 dark:text-slate-400 px-2.5 py-1.5 bg-slate-100 dark:bg-slate-700/60 rounded-xl border border-slate-200 dark:border-slate-700">Hiển thị: 0</span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                            <button onClick={() => { window.exportTicketsExcel() }} className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center space-x-1.5 transition cursor-pointer" title="Xuất danh sách khiếu nại & hỗ trợ ra Excel/CSV">
                                <i className="fa-solid fa-file-excel"></i>
                                <span>Xuất Excel</span>
                            </button>
                            <button onClick={() => { window.openBroadcastModal() }} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-blue-500/30 flex items-center space-x-2 transition cursor-pointer">
                                <i className="fa-solid fa-bullhorn"></i>
                                <span>Gửi Thông Báo Hệ Thống</span>
                            </button>
                        </div>
                    </div>

                    <div className="p-4 border-b-2 border-slate-300 dark:border-slate-600">
                        <h3 className="font-black text-sm text-slate-800 dark:text-white flex items-center gap-2">
                            <i className="fa-solid fa-list-check text-blue-600 dark:text-blue-400"></i>
                            <span>Danh Sách Chi Tiết Yêu Cầu Hỗ Trợ Độc Giả</span>
                        </h3>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead className="bg-slate-50 dark:bg-slate-700 border-b-2 border-slate-300 dark:border-slate-600 uppercase font-black text-[11px] text-slate-700 dark:text-gray-200">
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
                        <button id="loadMoreTicketsBtn" onClick={() => { window.loadMoreTickets() }} className="px-3.5 py-1.5 bg-white dark:bg-slate-700 hover:bg-blue-50 dark:hover:bg-slate-600 text-slate-600 dark:text-white rounded-lg text-xs font-bold border border-slate-300 dark:border-slate-600 flex items-center space-x-1.5 transition cursor-pointer" style={{display: "none"}}>
                            <i className="fa-solid fa-chevron-down text-xs"></i>
                            <span>Xem thêm</span>
                        </button>
                    </div>
                </div>

            </div>
        </div>
    </main>

    {/* Modal Phản Hồi Ticket / Chat Trực Tiếp 2 Chiều Giữa Admin & Độc Giả */}
    <div id="replyTicketModal" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 hidden flex items-center justify-center p-3 sm:p-4">
        <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-3xl w-full border border-slate-200 dark:border-slate-700 shadow-2xl flex flex-col h-[85vh] max-h-[750px] overflow-hidden">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-5 py-3.5 border-b border-slate-200 dark:border-slate-700 bg-slate-50/90 dark:bg-slate-800/90">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 flex items-center justify-center text-base shadow-xs">
                        <i className="fa-solid fa-headset"></i>
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-black text-sm text-slate-800 dark:text-white">Trung Tâm Hội Thoại Trực Tiếp</h3>
                            <span id="replyTicketCode" className="font-mono font-bold text-xs px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">#TK-0000</span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                Auto-Sync
                            </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium line-clamp-1 mt-0.5" id="replyTicketSubject">Chủ đề hỗ trợ</p>
                    </div>
                </div>
                <button onClick={() => { window.closeModal('replyTicketModal') }} className="text-slate-400 hover:text-slate-700 dark:hover:text-white font-bold p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer">
                    <i className="fa-solid fa-xmark text-lg"></i>
                </button>
            </div>

            {/* Thông tin độc giả nhỏ gọn ở đầu - Tải Avatar Độc Giả Thật */}
            <div className="px-5 py-2.5 bg-slate-100/70 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2.5">
                    <div id="replyTicketAvatar" className="shrink-0">
                        {/* Avatar User Rendered Dynamically */}
                    </div>
                    <div>
                        <span id="replyTicketUser" className="font-bold text-slate-800 dark:text-white mr-2">Khách hàng</span>
                        <span id="replyTicketEmail" className="text-slate-500 font-mono text-[11px]">email@example.com</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Khởi tạo:</span>
                    <span id="replyTicketCreatedAt" className="font-mono font-semibold text-slate-600 dark:text-slate-300 text-[11px]">--:--</span>
                </div>
            </div>

            {/* Modal Body: Khung chat 2 chiều cuộn mượt mà (ĐÃ FIX: Dư khoảng trắng text) */}
            <div id="replyTicketChatContainer" className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 bg-slate-50/50 dark:bg-slate-900/30">
                {/* Tin nhắn được nạp động từ javascript */}
            </div>

            {/* Sticky Composer: Soạn tin nhắn phản hồi */}
            <div className="p-3.5 sm:p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-2.5">
                <input type="hidden" id="replyTicketId" />
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <label className="text-[11px] font-extrabold uppercase text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                            <i className="fa-solid fa-reply text-blue-600"></i>
                            <span>Phản hồi độc giả</span>
                        </label>
                    </div>

                    {/* CUSTOM DROPDOWN: Đổi trạng thái trực tiếp */}
                    <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-slate-500">Trạng thái:</span>
                        <div className="relative">
                            <select
                                id="replyTicketStatusSelect"
                                onChange={(e) => { window.handleTicketStatusChange(e.target.value); }}
                                className="appearance-none pl-3 pr-8 py-1.5 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs transition-all hover:border-slate-400"
                            >
                                <option value="pending">🟡 Chờ xử lý</option>
                                <option value="in_progress">🔵 Đang xử lý</option>
                                <option value="resolved">🟢 Đã giải quyết</option>
                            </select>
                            <i className="fa-solid fa-chevron-down absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[10px]"></i>
                        </div>
                    </div>
                </div>

                <div className="flex items-end gap-2">
                    <textarea
                        id="replyContentInput"
                        rows="2"
                        placeholder="Nhập nội dung phản hồi cho độc giả... (Nhấn Enter để gửi)"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                window.submitTicketReply();
                            }
                        }}
                        className="flex-1 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-2xl text-xs font-medium dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    ></textarea>
                    <button
                        id="submitTicketReplyBtn"
                        onClick={() => { window.submitTicketReply() }}
                        className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-2 transition cursor-pointer shrink-0"
                    >
                        <i className="fa-solid fa-paper-plane"></i>
                        <span>Gửi</span>
                    </button>
                </div>
            </div>
        </div>
    </div>

    {/* Modal Thông Báo Toàn Hệ Thống */}
    <div id="broadcastModal" className="fixed inset-0 bg-slate-800/60 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-700 rounded-2xl max-w-md w-full p-6 border border-slate-300 dark:border-slate-600 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b-2 border-slate-300 dark:border-slate-600 pb-3">
                <h3 className="font-black text-base text-slate-800 dark:text-white flex items-center space-x-2">
                    <i className="fa-solid fa-bullhorn text-blue-600"></i>
                    <span>Thông Báo Toàn Hệ Thống</span>
                </h3>
                <button onClick={() => { window.closeModal('broadcastModal') }} className="text-slate-400 hover:text-slate-800 dark:hover:text-white font-bold cursor-pointer"><i className="fa-solid fa-xmark text-lg"></i></button>
            </div>
            <div className="space-y-3">
                <div>
                    <label className="block text-xs font-extrabold text-slate-600 dark:text-gray-300 uppercase mb-1">Tiêu đề thông báo</label>
                    <input type="text" id="broadcastTitle" placeholder="Bảo trì hệ thống / Cập nhật tính năng mới..." className="w-full px-3.5 py-2 bg-white dark:bg-gray-700 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold dark:text-white" />
                </div>
                <div>
                    <label className="block text-xs font-extrabold text-slate-600 dark:text-gray-300 uppercase mb-1">Nội dung thông cáo</label>
                    <textarea id="broadcastContent" rows="4" placeholder="Nội dung sẽ được gửi đến tất cả người dùng trong hệ thống..." className="w-full px-3.5 py-2 bg-white dark:bg-gray-700 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold dark:text-white"></textarea>
                </div>
            </div>
            <div className="flex justify-end space-x-2 pt-3 border-t-2 border-slate-300 dark:border-slate-600">
                <button onClick={() => { window.closeModal('broadcastModal') }} className="px-4 py-2 bg-slate-50 dark:bg-gray-700 text-slate-700 dark:text-gray-200 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-600 cursor-pointer">Hủy</button>
                <button onClick={() => { window.submitBroadcast() }} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-600 cursor-pointer">Phát Thông Báo</button>
            </div>
        </div>
    </div>

    </div>
  );
}
