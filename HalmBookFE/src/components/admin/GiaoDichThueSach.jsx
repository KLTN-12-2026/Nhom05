import React, { useEffect } from 'react';
import rentalPageCode from './js/rentalPage?raw';
import { useLegacyAdminPage } from './legacy-runtime';
import {
  getRentalSummary,
  getRentalList,
  approveRental,
  rejectRental,
  revokeRental
} from '@/services/adminRentalService';

export default function GiaoDichThueSach() {
  useEffect(() => {
    window.AdminRentalAPI = {
      getSummary: getRentalSummary,
      getList: getRentalList,
      approve: approveRental,
      reject: rejectRental,
      revoke: revokeRental
    };
    if (typeof window.loadRentals === 'function') {
      window.loadRentals();
    }
  }, []);

  useLegacyAdminPage("GiaoDichThueSach.html", rentalPageCode, true);

  return (
    <div className="admin-page-root">
{/* Shared Sidebar */}
    <div id="admin-sidebar-container"></div>

    {/* Main Content Area (No Footer) */}
    <main className="flex-1 flex flex-col h-full bg-white dark:bg-gray-950 overflow-hidden">
        {/* Shared Header */}
        <div id="admin-header-container" data-title="Quản Lý Giao Dịch Thuê & Mượn Sách" data-subtitle="Thống kê giao dịch thuê sách tự động, kiểm soát thời hạn bản quyền và thu hồi quyền đọc"></div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
            <div className="w-full space-y-4">

                {/* 4 Summary Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-extrabold uppercase text-slate-400">Tổng Lượt Thuê Sách</p>
                            <h4 id="statTotalRentals" className="text-xl font-black text-slate-800 dark:text-white mt-1">0</h4>
                            <p className="text-[11px] text-slate-400 mt-0.5">Tất cả giao dịch ghi nhận</p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center border border-blue-200 dark:border-blue-800">
                            <i className="fa-solid fa-book-bookmark text-lg"></i>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-extrabold uppercase text-slate-400">Đang Đọc (Hiệu Lực)</p>
                            <h4 id="statActiveRentals" className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">0</h4>
                            <p className="text-[11px] text-emerald-500 font-bold mt-0.5">Tự động kích hoạt ngay</p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
                            <i className="fa-solid fa-circle-check text-lg"></i>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-extrabold uppercase text-slate-400">Đã Thu Hồi Quyền Đọc</p>
                            <h4 id="statRevokedRentals" className="text-xl font-black text-rose-500 mt-1">0</h4>
                            <p className="text-[11px] text-slate-400 mt-0.5">Bị thu hồi quyền truy cập</p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center border border-rose-200 dark:border-rose-800">
                            <i className="fa-solid fa-ban text-lg"></i>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-extrabold uppercase text-slate-400">Tổng Doanh Thu Khoai</p>
                            <h4 id="statTotalPotatoesSpent" className="text-xl font-black text-purple-600 dark:text-purple-400 mt-1">0 🥔</h4>
                            <p className="text-[11px] text-slate-400 mt-0.5">Chi tiêu thuê sách</p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 flex items-center justify-center border border-purple-200 dark:border-purple-800">
                            <i className="fa-solid fa-coins text-lg"></i>
                        </div>
                    </div>
                </div>

                {/* Chart Area */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4 mb-6">
                    <div className="border-b border-slate-200 dark:border-slate-700 pb-3 flex justify-between items-center">
                        <div>
                            <h3 className="font-bold text-base text-slate-800 dark:text-white flex items-center gap-2">
                                <i className="fa-solid fa-chart-line text-blue-600"></i>
                                <span>Biểu Đồ Lượt Thuê Sách</span>
                            </h3>
                            <p className="text-xs text-slate-400 mt-0.5">Đơn vị: Lượt thuê (7 ngày gần nhất)</p>
                        </div>
                    </div>
                    <div className="h-64 w-full">
                        <canvas id="rentalLineChart"></canvas>
                    </div>
                </div>

                {/* Rentals Table */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col">
                    {/* Integrated Search & Filter (TOP) */}
                    <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-slate-50 dark:bg-slate-800/50">
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="relative w-full sm:w-80">
                                <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-3 text-slate-400 text-xs"></i>
                                <input type="text" id="rentalSearchInput" onKeyUp={() => { window.filterRentalsTable() }} placeholder="Tìm theo mã thuê (#RT), tên độc giả, email, tên sách..." className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <select id="rentalStatusFilter" onChange={() => { window.filterRentalsTable() }} className="px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold dark:text-white cursor-pointer">
                                <option value="">Tất cả trạng thái</option>
                                <option value="active">Đang hiệu lực (Đang đọc)</option>
                                <option value="revoked">Đã thu hồi</option>
                                <option value="expired">Đã hết hạn</option>
                            </select>
                            <button onClick={() => { window.resetRentalFilters() }} title="Đặt lại bộ lọc" className="px-3 py-2 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-600 flex items-center space-x-1.5 transition cursor-pointer">
                                <i className="fa-solid fa-rotate-left"></i>
                                <span>Đặt lại</span>
                            </button>
                        </div>
                        <div className="text-xs font-bold text-slate-500 dark:text-slate-400 self-center">
                            <span id="rentalCountDisplay">Hiển thị 0 đơn thuê</span>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead className="bg-slate-50 dark:bg-slate-800 border-b-2 border-slate-300 dark:border-slate-600 uppercase font-black text-[11px] text-slate-700 dark:text-gray-200">
                                <tr>
                                    <th className="py-3 px-3 text-center border-r border-slate-200 dark:border-slate-700 w-px whitespace-nowrap">Mã Thuê</th>
                                    <th className="py-3 px-4 border-r border-slate-200 dark:border-slate-700 min-w-[200px]">Tên Sách & Bìa</th>
                                    <th className="py-3 px-4 border-r border-slate-200 dark:border-slate-700 min-w-[220px]">Độc Giả</th>
                                    <th className="py-3 px-3 text-center border-r border-slate-200 dark:border-slate-700 w-px whitespace-nowrap">Thời Hạn</th>
                                    <th className="py-3 px-3 text-center border-r border-slate-200 dark:border-slate-700 w-px whitespace-nowrap">Chi Phí</th>
                                    <th className="py-3 px-3 text-center border-r border-slate-200 dark:border-slate-700 w-px whitespace-nowrap">Hiệu Lực</th>
                                    <th className="py-3 px-3 text-center border-r border-slate-200 dark:border-slate-700 w-px whitespace-nowrap">Trạng Thái</th>
                                    <th className="py-3 px-4 text-center border-r border-slate-200 dark:border-slate-700 w-px whitespace-nowrap">Thao Tác Quản Lý</th>
                                </tr>
                            </thead>
                            <tbody id="rentalsTableBody" className="divide-y-2 divide-gray-100 dark:divide-gray-800 font-semibold">
                                {/* Rendered dynamically */}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Bar & Export Button (BOTTOM) */}
                    <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-700/80 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/90 dark:bg-slate-800/60">
                        <div className="text-xs font-bold text-slate-500 dark:text-slate-400" id="rentalPaginationInfo">
                            Hiển thị <span className="text-blue-600 dark:text-blue-400 font-black">0</span> đơn thuê
                        </div>
                        <div className="flex items-center space-x-1" id="rentalPaginationControls">
                            {/* Rendered dynamically */}
                        </div>
                        <button onClick={() => { window.exportRentalsExcel() }} className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm flex items-center space-x-1.5 transition cursor-pointer">
                            <i className="fa-solid fa-file-excel text-xs"></i>
                            <span>Xuất File Excel</span>
                        </button>
                    </div>
                </div>

            </div>
        </div>
    </main>

    {/* Core Scripts */}
    </div>
  );
}
