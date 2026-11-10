import React, { useEffect } from 'react';
import { useLegacyAdminPage } from './legacy-runtime';
import dashboardPageCode from './js/dashboardPage?raw';
import * as adminDashboardService from '@/services/adminDashboardService';

if (typeof window !== 'undefined') {
  window.AdminDashboardAPI = {
    getOverview: adminDashboardService.getDashboardOverview,
  };
}

export default function TongQuan() {
  useEffect(() => {
    window.AdminDashboardAPI = {
      getOverview: adminDashboardService.getDashboardOverview,
    };
    if (typeof window.loadDashboardData === 'function') {
      window.loadDashboardData();
    }
  }, []);

  useLegacyAdminPage("TongQuan.html", dashboardPageCode, true);

  return (
    <div className="admin-page-root">
      {/* Sidebar Container (Shared) */}
      <div id="admin-sidebar-container"></div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full bg-white dark:bg-gray-950 overflow-hidden">
        {/* Top Header (Shared) */}
        <div
          id="admin-header-container"
          data-title="Tổng Quan Điều Hành Hệ Thống"
          data-subtitle="Chỉ số kinh doanh, hiệu suất đọc sách và dòng tiền trực tiếp"
        ></div>

        {/* Scrollable Dashboard Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          <div className="w-full space-y-6">

            {/* 0. TIME FILTER ROW & EXPORT BUTTONS */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="inline-flex bg-slate-100 dark:bg-slate-700 p-1 rounded-xl border border-slate-200 dark:border-slate-600 shadow-sm">
                <button
                  onClick={(e) => { window.setActiveFilter(e.currentTarget); }}
                  className="time-filter active-filter px-4 py-1.5 text-xs font-bold rounded-lg bg-blue-600 text-white shadow-sm transition-colors cursor-pointer"
                >
                  1 Ngày
                </button>
                <button
                  onClick={(e) => { window.setActiveFilter(e.currentTarget); }}
                  className="time-filter px-4 py-1.5 text-xs font-bold rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-200 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-600 transition-colors border border-transparent cursor-pointer"
                >
                  7 Ngày
                </button>
                <button
                  onClick={(e) => { window.setActiveFilter(e.currentTarget); }}
                  className="time-filter px-4 py-1.5 text-xs font-bold rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-200 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-600 transition-colors border border-transparent cursor-pointer"
                >
                  1 Tháng
                </button>
                <button
                  onClick={(e) => { window.setActiveFilter(e.currentTarget); }}
                  className="time-filter px-4 py-1.5 text-xs font-bold rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-200 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-600 transition-colors border border-transparent cursor-pointer"
                >
                  1 Quý
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => { window.exportOverview('pdf'); }}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-sm flex items-center space-x-1.5 transition cursor-pointer"
                >
                  <i className="fa-solid fa-file-pdf text-xs"></i>
                  <span>Xuất PDF</span>
                </button>
                <button
                  onClick={() => { window.exportOverview('excel'); }}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm flex items-center space-x-1.5 transition cursor-pointer"
                >
                  <i className="fa-solid fa-file-excel text-xs"></i>
                  <span>Xuất Excel</span>
                </button>
              </div>
            </div>

            {/* 1. CHARTS ROW */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Revenue Chart (2/3) */}
              <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-700">
                  <div>
                    <h3 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
                      <i className="fa-solid fa-chart-line text-blue-600"></i>
                      <span>Biểu đồ tăng trưởng doanh thu</span>
                    </h3>
                    <p id="subRevenueChart" className="text-xs text-slate-400 mt-0.5">
                      Đơn vị: Triệu VNĐ (1 Ngày)
                    </p>
                  </div>
                </div>
                <div className="relative h-64 w-full">
                  <canvas id="revenueTrendChart"></canvas>
                </div>
              </div>

              {/* Category Chart (1/3) */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-700">
                  <div>
                    <h3 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
                      <i className="fa-solid fa-chart-pie text-teal-600"></i>
                      <span>Tỷ lệ đọc theo danh mục</span>
                    </h3>
                    <p id="subCategoryChart" className="text-xs text-slate-400 mt-0.5">
                      Đơn vị: % (1 Ngày)
                    </p>
                  </div>
                </div>
                <div className="relative h-64 w-full flex justify-center items-center">
                  <canvas id="categoryDoughnutChart"></canvas>
                </div>
              </div>
            </div>

            {/* 1.5 CHARTS ROW 2: Package Deposits & Recent Transactions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Package Chart (2/3) */}
              <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-700">
                  <div>
                    <h3 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
                      <i className="fa-solid fa-layer-group text-emerald-600"></i>
                      <span>Số lượng nạp theo từng gói khoai tây</span>
                    </h3>
                    <p id="subPackageChart" className="text-xs text-slate-400 mt-0.5">
                      Đơn vị: Lượt nạp (1 Ngày)
                    </p>
                  </div>
                </div>
                <div className="relative h-64 w-full">
                  <canvas id="packageChart"></canvas>
                </div>
              </div>

              {/* Recent Transactions (1/3) */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center pb-2 mb-3 border-b border-slate-100 dark:border-slate-700">
                    <h3 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
                      <i className="fa-solid fa-clock-rotate-left text-blue-600"></i>
                      <span>Giao dịch gần đây</span>
                    </h3>
                    <a href="/admin/quan-ly-tai-chinh" data-admin-route="true" className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">
                      Xem tất cả →
                    </a>
                  </div>
                  <div className="overflow-y-auto max-h-56">
                    <table className="w-full text-left text-xs">
                      <tbody id="recentTransactionsTable" className="divide-y divide-slate-100 dark:divide-slate-700">
                        {/* Dynamic */}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. STAT CARDS ROW (4 CARDS) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Card 1: Doanh Thu */}
              <div className="group bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 relative cursor-default">
                <div className="flex justify-between items-center text-blue-600 dark:text-blue-400 mb-3">
                  <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400">Tổng doanh thu</span>
                  <i className="fa-solid fa-wallet text-lg bg-blue-50 dark:bg-blue-900/30 p-2 rounded-xl"></i>
                </div>
                <h4 id="statTotalRevenue" className="text-2xl font-black text-slate-800 dark:text-white font-mono">...</h4>

                {/* Hover Details */}
                <div className="absolute top-full left-0 w-full mt-2 bg-slate-900/95 backdrop-blur-md text-white rounded-xl p-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible translate-y-2 group-hover:translate-y-0 transition-all duration-300 flex flex-col justify-center pointer-events-none z-50 shadow-2xl border border-slate-700">
                  <ul className="space-y-1.5 text-xs">
                    <li className="flex justify-between"><span className="text-slate-300">Toàn thời gian:</span> <span id="statHoverTotalRev" className="font-bold">...</span></li>
                    <li className="flex justify-between"><span className="text-slate-300">Năm nay:</span> <span id="statHoverYearRev" className="font-bold text-emerald-400">...</span></li>
                    <li className="flex justify-between"><span className="text-slate-300">Tháng này:</span> <span id="statHoverMonthRev" className="font-bold text-blue-400">...</span></li>
                  </ul>
                </div>
              </div>

              {/* Card 2: Lượt Đọc/Tải */}
              <div className="group bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 relative cursor-default">
                <div className="flex justify-between items-center text-teal-600 dark:text-teal-400 mb-3">
                  <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400">Lượt đọc / thuê sách</span>
                  <i className="fa-solid fa-book-open text-lg bg-teal-50 dark:bg-teal-900/30 p-2 rounded-xl"></i>
                </div>
                <h4 id="statTotalReads" className="text-2xl font-black text-slate-800 dark:text-white font-mono">...</h4>

                {/* Hover Details */}
                <div className="absolute top-full left-0 w-full mt-2 bg-slate-900/95 backdrop-blur-md text-white rounded-xl p-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible translate-y-2 group-hover:translate-y-0 transition-all duration-300 flex flex-col justify-center pointer-events-none z-50 shadow-2xl border border-slate-700">
                  <ul className="space-y-1.5 text-xs">
                    <li className="flex justify-between"><span className="text-slate-300">Đọc trực tuyến:</span> <span id="statHoverOnlineReads" className="font-bold">...</span></li>
                    <li className="flex justify-between"><span className="text-slate-300">Tải offline:</span> <span id="statHoverOfflineReads" className="font-bold">...</span></li>
                    <li className="flex justify-between"><span className="text-slate-300">Trung bình/ngày:</span> <span id="statHoverDailyReads" className="font-bold text-teal-400">...</span></li>
                  </ul>
                </div>
              </div>

              {/* Card 3: Độc Giả */}
              <div className="group bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 relative cursor-default">
                <div className="flex justify-between items-center text-indigo-600 dark:text-indigo-400 mb-3">
                  <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400">Độc giả hoạt động</span>
                  <i className="fa-solid fa-users text-lg bg-indigo-50 dark:bg-indigo-900/30 p-2 rounded-xl"></i>
                </div>
                <h4 id="statTotalUsers" className="text-2xl font-black text-slate-800 dark:text-white font-mono">...</h4>

                {/* Hover Details */}
                <div className="absolute top-full left-0 w-full mt-2 bg-slate-900/95 backdrop-blur-md text-white rounded-xl p-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible translate-y-2 group-hover:translate-y-0 transition-all duration-300 flex flex-col justify-center pointer-events-none z-50 shadow-2xl border border-slate-700">
                  <ul className="space-y-1.5 text-xs">
                    <li className="flex justify-between"><span className="text-slate-300">Hạng VIP:</span> <span id="statVipUsers" className="font-bold text-indigo-400">...</span></li>
                    <li className="flex justify-between"><span className="text-slate-300">Đăng nhập daily:</span> <span id="statDailyLogins" className="font-bold text-indigo-400">...</span></li>
                  </ul>
                </div>
              </div>

              {/* Card 4: Tổng Kho Sách */}
              <div className="group bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 relative cursor-default">
                <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400 mb-3">
                  <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400">Tổng Kho Sách</span>
                  <i className="fa-solid fa-book-bookmark text-lg bg-emerald-50 dark:bg-emerald-900/30 p-2 rounded-xl"></i>
                </div>
                <h4 id="statTotalBooks" className="text-2xl font-black text-slate-800 dark:text-white font-mono">...</h4>

                {/* Hover Details */}
                <div className="absolute top-full left-0 w-full mt-2 bg-slate-900/95 backdrop-blur-md text-white rounded-xl p-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible translate-y-2 group-hover:translate-y-0 transition-all duration-300 flex flex-col justify-center pointer-events-none z-50 shadow-2xl border border-slate-700">
                  <ul className="space-y-1.5 text-xs">
                    <li className="flex justify-between"><span className="text-slate-300">Xuất bản:</span> <span id="statPublicBooks" className="font-bold text-emerald-400">...</span></li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 3. RANKINGS ROW */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 space-y-5">
              {/* Header */}
              <div className="text-center border-b border-slate-100 dark:border-slate-700 pb-3">
                <h3 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center justify-center gap-2">
                  <i className="fa-solid fa-trophy text-amber-500"></i>
                  <span>Bảng Xếp Hạng Hệ Thống</span>
                </h3>
              </div>

              {/* 3 Columns for Rankings */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 divide-y lg:divide-y-0 lg:divide-x divide-slate-100 dark:divide-slate-700">
                {/* Column 1: Top Readers */}
                <div className="pt-4 lg:pt-0 lg:pr-6">
                  <h4 className="text-xs font-black uppercase text-slate-600 dark:text-slate-300 mb-4 flex items-center gap-2">
                    <i className="fa-solid fa-medal text-amber-500"></i>
                    <span>Top Độc Giả Tích Cực</span>
                  </h4>
                  <div id="topReadersContainer" className="space-y-3">
                    {/* Dynamic */}
                  </div>
                </div>

                {/* Column 2: Most Read Books */}
                <div className="pt-4 lg:pt-0 lg:px-6">
                  <h4 className="text-xs font-black uppercase text-slate-600 dark:text-slate-300 mb-4 flex items-center gap-2">
                    <i className="fa-solid fa-fire text-rose-500"></i>
                    <span>Sách Đọc Nhiều Nhất</span>
                  </h4>
                  <div id="topBooksOverviewContainer" className="space-y-3">
                    {/* Dynamic */}
                  </div>
                </div>

                {/* Column 3: Lowest Rated */}
                <div className="pt-4 lg:pt-0 lg:pl-6">
                  <h4 className="text-xs font-black uppercase text-slate-600 dark:text-slate-300 mb-4 flex items-center gap-2">
                    <i className="fa-solid fa-triangle-exclamation text-amber-500"></i>
                    <span>Đánh Giá Cần Cải Thiện</span>
                  </h4>
                  <div id="lowestRatedBooksContainer" className="space-y-3">
                    {/* Dynamic */}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
