import React, { useEffect } from 'react';
import { useLegacyAdminPage } from './legacy-runtime';
import reportPageCode from './js/reportPage?raw';
import * as adminAnalyticsService from '@/services/adminAnalyticsService';

if (typeof window !== 'undefined') {
  window.AdminAnalyticsAPI = {
    getOverview: adminAnalyticsService.getAnalyticsOverview,
  };
}

export default function BaoCaoAndThongKe() {
  useEffect(() => {
    window.AdminAnalyticsAPI = {
      getOverview: adminAnalyticsService.getAnalyticsOverview,
    };
    if (typeof window.loadReportData === 'function') {
      window.loadReportData();
    }
  }, []);

  useLegacyAdminPage("BaoCao&ThongKe.html", reportPageCode, true);

  return (
    <div className="admin-page-root">
      {/* Shared Sidebar */}
      <div id="admin-sidebar-container"></div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full bg-white dark:bg-gray-950 overflow-hidden">
        {/* Shared Header */}
        <div
          id="admin-header-container"
          data-title="Báo Cáo & Thống Kê Phân Tích Chuyên Sâu"
          data-subtitle="Biểu đồ trực quan, phân tích tăng trưởng doanh thu và hành vi độc giả toàn diện"
        ></div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          <div className="w-full space-y-6">

            {/* Filter Controls & Export Bar */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-black uppercase text-slate-400">Kỳ báo cáo:</span>
                <div className="flex items-center space-x-1 bg-slate-50 dark:bg-slate-700 p-1 rounded-xl border border-slate-200 dark:border-slate-600">
                  <button
                    onClick={(e) => { window.changeTimeRange('7d', e.currentTarget); }}
                    className="range-btn px-3 py-1 rounded-lg text-xs font-bold text-slate-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 hover:text-slate-800 transition border border-transparent cursor-pointer"
                  >
                    7 Ngày
                  </button>
                  <button
                    onClick={(e) => { window.changeTimeRange('month', e.currentTarget); }}
                    className="range-btn px-3 py-1 rounded-lg text-xs font-black bg-blue-600 text-white shadow-sm transition border border-transparent cursor-pointer"
                  >
                    Tháng Này
                  </button>
                  <button
                    onClick={(e) => { window.changeTimeRange('quarter', e.currentTarget); }}
                    className="range-btn px-3 py-1 rounded-lg text-xs font-bold text-slate-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 hover:text-slate-800 transition border border-transparent cursor-pointer"
                  >
                    Quý 4
                  </button>
                  <button
                    onClick={(e) => { window.changeTimeRange('year', e.currentTarget); }}
                    className="range-btn px-3 py-1 rounded-lg text-xs font-bold text-slate-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 hover:text-slate-800 transition border border-transparent cursor-pointer"
                  >
                    Năm 2026
                  </button>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => { window.exportReport('PDF'); }}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-sm flex items-center space-x-1.5 transition cursor-pointer"
                >
                  <i className="fa-solid fa-file-pdf text-xs"></i>
                  <span>Xuất PDF</span>
                </button>
                <button
                  onClick={() => { window.exportReport('Excel'); }}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm flex items-center space-x-1.5 transition cursor-pointer"
                >
                  <i className="fa-solid fa-file-excel text-xs"></i>
                  <span>Xuất Excel</span>
                </button>
              </div>
            </div>

            {/* 4 Performance Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                <span className="text-xs uppercase font-extrabold text-slate-400">Tăng Trưởng Doanh Thu</span>
                <h4 id="statRevenueGrowth" className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">+24.5%</h4>
                <p id="statRevenueNote" className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-1">
                  <i className="fa-solid fa-arrow-up"></i> Vượt 12% chỉ tiêu kỳ
                </p>
              </div>
              <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                <span className="text-xs uppercase font-extrabold text-slate-400">Thời Gian Đọc Trung Bình</span>
                <h4 id="statAvgReadingTime" className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">42 Phút / Ngày</h4>
                <p id="statAvgReadingTimeNote" className="text-xs text-blue-600 dark:text-blue-400 font-bold mt-1">
                  <i className="fa-solid fa-clock"></i> +8.2 phút so với kỳ trước
                </p>
              </div>
              <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                <span className="text-xs uppercase font-extrabold text-slate-400">Tỷ Lệ Giữ Chân Độc Giả</span>
                <h4 id="statRetentionRate" className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">87.3%</h4>
                <p id="statRetentionRateNote" className="text-xs text-slate-500 dark:text-slate-400 font-bold mt-1">
                  Mức gắn kết độc giả cao
                </p>
              </div>
              <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                <span className="text-xs uppercase font-extrabold text-slate-400">Củ Khoai Lưu Hành</span>
                <h4 id="statCirculatingPotatoes" className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">42,500 🥔</h4>
                <p id="statCirculatingPotatoesNote" className="text-xs text-slate-500 dark:text-slate-400 font-bold mt-1">
                  Tổng điểm nạp trong hệ thống
                </p>
              </div>
            </div>

            {/* 2 Big Visual Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Chart 1: Revenue & Cash Flow Trend */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow space-y-4">
                <div className="border-b border-slate-200 dark:border-slate-700 pb-3 flex justify-between items-center">
                  <div>
                    <h3 className="font-black text-base text-slate-800 dark:text-white flex items-center gap-2">
                      <i className="fa-solid fa-chart-area text-blue-600"></i>
                      <span>Tăng Trưởng Dòng Tiền & Doanh Số Nạp</span>
                    </h3>
                    <p className="text-xs text-slate-400">Đơn vị: Triệu VNĐ theo từng mốc thời gian</p>
                  </div>
                </div>
                <div className="h-64 sm:h-72 w-full">
                  <canvas id="detailedRevenueChart"></canvas>
                </div>
              </div>

              {/* Chart 2: Potato Top-up Packages Breakdown */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow space-y-4">
                <div className="border-b border-slate-200 dark:border-slate-700 pb-3 flex justify-between items-center">
                  <div>
                    <h3 className="font-black text-base text-slate-800 dark:text-white flex items-center gap-2">
                      <i className="fa-solid fa-chart-column text-indigo-500"></i>
                      <span>Số Lượng Gói Khoai Tây Nạp Theo Kỳ</span>
                    </h3>
                    <p className="text-xs text-slate-400">Đơn vị: Lượt nạp (So sánh Gói Khởi Động vs VIP vs Đại Gia)</p>
                  </div>
                </div>
                <div className="h-64 sm:h-72 w-full">
                  <canvas id="potatoPackageBarChart"></canvas>
                </div>
              </div>
            </div>

            {/* 2 Analytical Tables: Top Books & Books Needing Attention */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Books */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-4">
                <div>
                  <div className="border-b border-slate-200 dark:border-slate-700 pb-3 mb-4 flex justify-between items-center">
                    <h3 className="font-black text-sm text-slate-800 dark:text-white flex items-center gap-2">
                      <i className="fa-solid fa-fire text-rose-500"></i>
                      <span>Top Sách Đọc Nhiều Nhất</span>
                    </h3>
                    <a href="/admin/quan-ly-sach" data-admin-route="true" className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">
                      Quản lý kho sách →
                    </a>
                  </div>
                  <div id="topBooksReportList" className="space-y-3 min-h-[220px]">
                    {/* Rendered dynamically */}
                  </div>
                </div>

                {/* Top Books Pagination */}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
                  <div id="topBooksPaginationInfo" className="text-slate-500 dark:text-slate-400 text-[11px] font-medium">
                    {/* Dynamic info */}
                  </div>
                  <div id="topBooksPaginationControls" className="flex items-center space-x-1">
                    {/* Dynamic pagination buttons */}
                  </div>
                </div>
              </div>

              {/* Books Needing Attention */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-4">
                <div>
                  <div className="border-b border-slate-200 dark:border-slate-700 pb-3 mb-4 flex justify-between items-center">
                    <h3 className="font-black text-sm text-slate-800 dark:text-white flex items-center gap-2">
                      <i className="fa-solid fa-star-half-stroke text-amber-500"></i>
                      <span>Sách Cần Lưu Ý & Đánh Giá Thấp</span>
                    </h3>
                    <span className="text-[11px] text-slate-400 font-medium">Ưu tiên cải thiện chất lượng</span>
                  </div>

                  <div id="reviewedBooksList" className="space-y-3 min-h-[220px]">
                    {/* Rendered dynamically */}
                  </div>
                </div>

                {/* Low Rated Books Pagination */}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
                  <div id="lowBooksPaginationInfo" className="text-slate-500 dark:text-slate-400 text-[11px] font-medium">
                    {/* Dynamic info */}
                  </div>
                  <div id="lowBooksPaginationControls" className="flex items-center space-x-1">
                    {/* Dynamic pagination buttons */}
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
