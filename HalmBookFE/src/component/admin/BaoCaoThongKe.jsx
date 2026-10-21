import React from 'react';

const BaoCaoThongKe = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 bold-border shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-2 border-slate-900 dark:border-slate-700 pb-4 gap-4">
          <div>
            <h3 className="font-black text-lg text-slate-900 dark:text-white">Báo Cáo Thống Kê Toàn Diện Hệ Thống HALMBOOK</h3>
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-0.5">Tổng hợp số liệu kinh doanh, doanh thu hội viên khoai tây và hiệu suất đọc sách</p>
          </div>
          <button className="bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold bold-border shadow-sm transition flex items-center space-x-2">
            <i className="fa-solid fa-file-arrow-down text-pink-400"></i>
            <span>Xuất Báo Cáo Thống Kê PDF</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-800 bold-border rounded-2xl p-5 flex flex-col justify-between shadow-sm">
            <div className="flex justify-between items-center text-pink-600 dark:text-pink-400">
              <span className="text-xs uppercase font-extrabold tracking-wider">Tổng Doanh Thu</span>
              <i className="fa-solid fa-wallet text-lg"></i>
            </div>
            <div className="my-3">
              <h4 className="text-2xl font-black text-slate-900 dark:text-white">284.5 Tr đ</h4>
              <p className="text-xs text-emerald-700 dark:text-emerald-400 font-bold mt-1"><i className="fa-solid fa-arrow-up"></i> +16.8% so với tháng trước</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 bold-border rounded-2xl p-5 flex flex-col justify-between shadow-sm">
            <div className="flex justify-between items-center text-indigo-600 dark:text-indigo-400">
              <span className="text-xs uppercase font-extrabold tracking-wider">Lượt Tải/Đọc Sách</span>
              <i className="fa-solid fa-book-reader text-lg"></i>
            </div>
            <div className="my-3">
              <h4 className="text-2xl font-black text-slate-900 dark:text-white">32,490</h4>
              <p className="text-xs text-emerald-700 dark:text-emerald-400 font-bold mt-1"><i className="fa-solid fa-arrow-up"></i> +24.1% tuần này</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 bold-border rounded-2xl p-5 flex flex-col justify-between shadow-sm">
            <div className="flex justify-between items-center text-blue-600 dark:text-blue-400">
              <span className="text-xs uppercase font-extrabold tracking-wider">Độc Giả Hoạt Động</span>
              <i className="fa-solid fa-users text-lg"></i>
            </div>
            <div className="my-3">
              <h4 className="text-2xl font-black text-slate-900 dark:text-white">4,120</h4>
              <p className="text-xs text-emerald-700 dark:text-emerald-400 font-bold mt-1"><i className="fa-solid fa-arrow-up"></i> +412 tài khoản mới</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 bold-border rounded-2xl p-5 flex flex-col justify-between shadow-sm">
            <div className="flex justify-between items-center text-amber-600 dark:text-amber-400">
              <span className="text-xs uppercase font-extrabold tracking-wider">Tỷ Lệ Giữ Chân VIP</span>
              <i className="fa-solid fa-chart-line text-lg"></i>
            </div>
            <div className="my-3">
              <h4 className="text-2xl font-black text-slate-900 dark:text-white">96.2%</h4>
              <p className="text-xs text-emerald-700 dark:text-emerald-400 font-bold mt-1"><i className="fa-solid fa-check"></i> Rất ổn định</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
          <div className="bold-border rounded-2xl p-5 bg-white dark:bg-slate-800 space-y-4 shadow-sm">
            <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center space-x-2">
              <i className="fa-solid fa-layer-group text-pink-600"></i>
              <span>Tỷ Lệ Đọc Sách Theo Danh Mục</span>
            </h4>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span>Kinh tế & Kinh doanh</span>
                  <span className="text-pink-600 font-black">45% (12,400 lượt)</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700 bold-border h-3 rounded-full overflow-hidden">
                  <div className="bg-pink-600 h-full rounded-full" style={{ width: '45%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span>Công nghệ thông tin & AI</span>
                  <span className="text-indigo-600 font-black">30% (8,300 lượt)</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700 bold-border h-3 rounded-full overflow-hidden">
                  <div className="bg-indigo-600 h-full rounded-full" style={{ width: '30%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span>Văn học & Tiểu thuyết</span>
                  <span className="text-blue-600 font-black">15% (4,150 lượt)</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700 bold-border h-3 rounded-full overflow-hidden">
                  <div className="bg-blue-600 h-full rounded-full" style={{ width: '15%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span>Phát triển bản thân</span>
                  <span className="text-amber-600 font-black">10% (2,760 lượt)</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700 bold-border h-3 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: '10%' }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bold-border rounded-2xl p-5 bg-white dark:bg-slate-800 space-y-4 shadow-sm">
            <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center space-x-2">
              <i className="fa-solid fa-trophy text-amber-500"></i>
              <span>Độc Giả Tích Cực Nhất Tháng</span>
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-700 bold-border rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-pink-100 text-pink-800 font-bold bold-border flex items-center justify-center text-xs">NA</div>
                  <div>
                    <h5 className="font-bold text-xs text-slate-900 dark:text-white">Nguyễn Văn An</h5>
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">VIP Member • 52 cuốn đã đọc</span>
                  </div>
                </div>
                <span className="bg-emerald-100 text-emerald-800 text-[11px] px-2.5 py-1 rounded-full font-extrabold bold-border">Hạng #1</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-700 bold-border rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-bold bold-border flex items-center justify-center text-xs">TM</div>
                  <div>
                    <h5 className="font-bold text-xs text-slate-900 dark:text-white">Trần Thị Mai</h5>
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">Standard • 44 cuốn đã đọc</span>
                  </div>
                </div>
                <span className="bg-blue-100 text-blue-800 text-[11px] px-2.5 py-1 rounded-full font-extrabold bold-border">Hạng #2</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-700 bold-border rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 font-bold bold-border flex items-center justify-center text-xs">HN</div>
                  <div>
                    <h5 className="font-bold text-xs text-slate-900 dark:text-white">Lê Hoàng Nam</h5>
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">VIP Member • 39 cuốn đã đọc</span>
                  </div>
                </div>
                <span className="bg-amber-100 text-amber-800 text-[11px] px-2.5 py-1 rounded-full font-extrabold bold-border">Hạng #3</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BaoCaoThongKe;