import React, { useEffect } from 'react';
import { useLegacyAdminPage } from './legacy-runtime';
import financePageCode from './js/financePage?raw';
import {
  getFinanceSummary,
  getFinanceTransactions,
  approveFinanceTransaction,
  rejectFinanceTransaction
} from '@/services/adminFinanceService';

export default function QuanLyTaiChinh() {
  useEffect(() => {
    window.AdminFinanceAPI = {
      getSummary: getFinanceSummary,
      getTransactions: getFinanceTransactions,
      approve: approveFinanceTransaction,
      reject: rejectFinanceTransaction
    };
    if (typeof window.loadFinanceData === 'function') {
      window.loadFinanceData();
    }
  }, []);

  useLegacyAdminPage("QuanLyTaiChinh.html", financePageCode, true);

  return (
    <div className="admin-page-root">
      {/* Shared Sidebar */}
      <div id="admin-sidebar-container"></div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full bg-white dark:bg-gray-950 overflow-hidden">
        {/* Shared Header */}
        <div
          id="admin-header-container"
          data-title="Quản Lý Tài Chính & Dòng Tiền"
          data-subtitle="Theo dõi doanh thu, dòng tiền nạp Củ Khoai Tây và xét duyệt giao dịch thanh toán"
        ></div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          <div className="w-full space-y-4">

            {/* 0. Time Filter Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-xs font-black uppercase text-slate-400 flex items-center gap-1.5">
                  <i className="fa-solid fa-calendar-days text-blue-600"></i>
                  <span>Khoảng thời gian:</span>
                </span>
                <div className="inline-flex bg-slate-100 dark:bg-slate-700/60 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                  <button
                    onClick={(e) => { window.setTimeFilter('1d', e.currentTarget); }}
                    className="time-filter px-4 py-1.5 text-xs font-bold rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-200 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-700 transition-colors border border-transparent cursor-pointer"
                  >
                    1 ngày
                  </button>
                  <button
                    onClick={(e) => { window.setTimeFilter('7d', e.currentTarget); }}
                    className="time-filter active-filter px-4 py-1.5 text-xs font-bold rounded-lg bg-blue-600 text-white shadow-sm transition-colors border border-transparent cursor-pointer"
                  >
                    7 ngày
                  </button>
                  <button
                    onClick={(e) => { window.setTimeFilter('30d', e.currentTarget); }}
                    className="time-filter px-4 py-1.5 text-xs font-bold rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-200 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-700 transition-colors border border-transparent cursor-pointer"
                  >
                    30 ngày
                  </button>
                  <button
                    onClick={(e) => { window.setTimeFilter('all', e.currentTarget); }}
                    className="time-filter px-4 py-1.5 text-xs font-bold rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-200 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-700 transition-colors border border-transparent cursor-pointer"
                  >
                    Tất cả
                  </button>
                </div>
              </div>
              <div
                id="periodDisplayTag"
                className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2 bg-slate-50 dark:bg-slate-700/50 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700"
              >
                <i className="fa-solid fa-clock-rotate-left text-blue-600"></i>
                <span id="periodDisplayText">Giai đoạn: 7 ngày gần nhất</span>
              </div>
            </div>

            {/* 0.1 Summary Financial Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-extrabold uppercase text-slate-400">Doanh Thu Đã Duyệt</p>
                  <h4 id="statApprovedRevenue" className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">0 đ</h4>
                  <p id="statApprovedCount" className="text-[11px] text-slate-400 mt-0.5">0 giao dịch thành công</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
                  <i className="fa-solid fa-circle-check text-lg"></i>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-extrabold uppercase text-slate-400">Dòng Tiền Chờ Duyệt</p>
                  <h4 id="statPendingRevenue" className="text-xl font-black text-amber-500 mt-1">0 đ</h4>
                  <p id="statPendingTxCount" className="text-[11px] text-slate-400 mt-0.5">0 giao dịch chờ kiểm tra</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center border border-amber-200 dark:border-amber-800">
                  <i className="fa-solid fa-hourglass-half text-lg"></i>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-extrabold uppercase text-slate-400">Tổng Điểm Khoai Nạp</p>
                  <h4 id="statTotalPotatoes" className="text-xl font-black text-blue-600 dark:text-blue-400 mt-1">0 🥔</h4>
                  <p id="statTotalTxsCount" className="text-[11px] text-slate-400 mt-0.5">0 lượt giao dịch</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center border border-blue-200 dark:border-blue-800">
                  <i className="fa-solid fa-coins text-lg"></i>
                </div>
              </div>
            </div>

            {/* 3 Financial Charts (Đã điều chỉnh tên chuẩn theo hình thức giao dịch) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              {/* Chart 1: Doanh Thu Nạp Tiền & Điểm Khoai */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
                <div className="mb-3">
                  <h3 className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2">
                    <i className="fa-solid fa-chart-line text-blue-600"></i>
                    <span>Doanh Thu Nạp Tiền & Điểm Khoai</span>
                  </h3>
                  <p id="subFinChart1" className="text-xs text-slate-400 mt-0.5">Đơn vị: Triệu VNĐ (7 ngày gần nhất)</p>
                </div>
                <div className="h-48 w-full"><canvas id="finChart1"></canvas></div>
              </div>

              {/* Chart 2: Tỉ Lệ Phương Thức Thanh Toán (MoMo, ZaloPay, VietQR / Ngân Hàng) */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
                <div className="mb-3">
                  <h3 className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2">
                    <i className="fa-solid fa-chart-pie text-teal-600"></i>
                    <span>Tỉ Lệ Phương Thức Thanh Toán</span>
                  </h3>
                  <p id="subFinChart2" className="text-xs text-slate-400 mt-0.5">Đơn vị: Tỷ lệ phần trăm (%) - MoMo, ZaloPay, VietQR</p>
                </div>
                <div className="h-48 w-full"><canvas id="finChart2"></canvas></div>
              </div>

              {/* Chart 3: Lượt Giao Dịch Nạp Khoai */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
                <div className="mb-3">
                  <h3 className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2">
                    <i className="fa-solid fa-chart-bar text-indigo-600"></i>
                    <span>Lượt Giao Dịch Nạp Khoai</span>
                  </h3>
                  <p id="subFinChart3" className="text-xs text-slate-400 mt-0.5">Đơn vị: Số lượt nạp (7 ngày gần nhất)</p>
                </div>
                <div className="h-48 w-full"><canvas id="finChart3"></canvas></div>
              </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col">
              {/* Integrated Search & Filter (TOP) */}
              <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-slate-50 dark:bg-slate-800/50">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative w-full sm:w-72">
                    <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-3 text-slate-400 text-xs"></i>
                    <input
                      type="text"
                      id="txSearchInput"
                      onKeyUp={() => { window.filterTransactions(); }}
                      placeholder="Tìm theo mã GD (#TX), tên khách, gói nạp..."
                      className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <select
                    id="txStatusFilter"
                    onChange={() => { window.filterTransactions(); }}
                    className="px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold dark:text-white"
                  >
                    <option value="">Tất cả trạng thái</option>
                    <option value="pending">Chờ xác nhận</option>
                    <option value="approved">Đã duyệt</option>
                    <option value="rejected">Từ chối</option>
                  </select>
                  <button
                    onClick={() => { window.resetTxFilters(); }}
                    title="Đặt lại bộ lọc"
                    className="px-3 py-2 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-600 flex items-center space-x-1.5 transition cursor-pointer"
                  >
                    <i className="fa-solid fa-rotate-left"></i>
                    <span>Đặt lại</span>
                  </button>
                </div>
                <div className="text-xs font-bold text-slate-500 dark:text-slate-400 self-center">
                  <span id="txCountDisplay">Hiển thị 0 giao dịch</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-800 border-b-2 border-slate-300 dark:border-slate-600 uppercase font-black text-[11px] text-slate-700 dark:text-gray-200">
                    <tr>
                      <th className="py-3 px-3 text-center border-r border-slate-200 dark:border-slate-700 w-px whitespace-nowrap">Mã Giao Dịch</th>
                      <th className="py-3 px-4 border-r border-slate-200 dark:border-slate-700 min-w-[200px] w-full">Khách Hàng</th>
                      <th className="py-3 px-4 border-r border-slate-200 dark:border-slate-700 min-w-[160px] whitespace-nowrap">Gói Nạp / Dịch Vụ</th>
                      <th className="py-3 px-3 text-center border-r border-slate-200 dark:border-slate-700 w-px whitespace-nowrap">Phương Thức</th>
                      <th className="py-3 px-3 text-center border-r border-slate-200 dark:border-slate-700 w-px whitespace-nowrap">Số Tiền (VNĐ)</th>
                      <th className="py-3 px-3 text-center border-r border-slate-200 dark:border-slate-700 w-px whitespace-nowrap">Khoai Nhận</th>
                      <th className="py-3 px-3 text-center border-r border-slate-200 dark:border-slate-700 w-px whitespace-nowrap">Thời Gian</th>
                      <th className="py-3 px-3 text-center border-r border-slate-200 dark:border-slate-700 w-px whitespace-nowrap text-center">Trạng Thái</th>
                      <th className="py-3 px-2 text-center border-r border-slate-200 dark:border-slate-700 w-px whitespace-nowrap">Hành Động</th>
                    </tr>
                  </thead>
                  <tbody id="transactionsTableBody" className="divide-y-2 divide-gray-100 dark:divide-gray-800 font-semibold">
                    {/* Rendered dynamically */}
                  </tbody>
                </table>
              </div>

              {/* Pagination Bar & Export (BOTTOM) */}
              <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-700/80 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/90 dark:bg-slate-800/60">
                <div className="text-xs font-bold text-slate-500 dark:text-slate-400" id="txPaginationInfo">
                  Hiển thị <span className="text-blue-600 dark:text-blue-400 font-black">0</span> giao dịch
                </div>
                <div className="flex items-center space-x-1" id="txPaginationControls">
                  {/* Rendered dynamically */}
                </div>
                <button
                  onClick={() => { window.exportFinanceExcel(); }}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm flex items-center space-x-1.5 transition cursor-pointer"
                >
                  <i className="fa-solid fa-file-excel text-xs"></i>
                  <span>Xuất Excel</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
