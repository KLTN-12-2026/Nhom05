import React from 'react';

const QuanLySach = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 bold-border shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <i className="fa-solid fa-search absolute left-3.5 top-3 text-slate-500 text-sm"></i>
            <input type="text" placeholder="Tìm tên sách, tác giả, mã ISBN..." className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-700 dark:text-white bold-border rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-pink-500 transition" />
          </div>
          <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
            <button className="bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-xs font-bold bold-border shadow-sm transition flex items-center space-x-2">
              <i className="fa-solid fa-cloud-arrow-up text-pink-400"></i>
              <span>Upload Sách Mới Lên Kho</span>
            </button>
          </div>
        </div>

        <div className="bg-pink-50/70 dark:bg-slate-700/50 bold-border rounded-xl p-4 flex flex-wrap items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 gap-4">
          <div className="flex items-center space-x-2">
            <i className="fa-solid fa-database text-pink-600 text-sm"></i>
            <span className="font-extrabold text-slate-900 dark:text-white">Trạng thái kho lưu trữ Admin:</span>
          </div>
          <div>Tổng đầu sách: <span className="text-pink-600 font-extrabold">1,482 cuốn</span></div>
          <div>Sách công khai: <span className="text-emerald-700 dark:text-emerald-400 font-extrabold">1,450 cuốn</span></div>
          <div>Bản nháp hệ thống: <span className="text-amber-700 dark:text-amber-400 font-extrabold">32 cuốn</span></div>
          <div>Dung lượng đã dùng: <span className="text-slate-900 dark:text-white font-extrabold">42.8 GB / 500 GB</span></div>
        </div>

        <div className="space-y-4">
          <div className="book-card bg-white dark:bg-slate-800 rounded-2xl p-5 bold-border shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
            <div className="flex items-start space-x-4">
              <div className="w-14 h-18 bg-pink-100 dark:bg-pink-900/30 bold-border rounded-xl flex flex-col items-center justify-center text-pink-700 dark:text-pink-300 font-extrabold shrink-0 shadow-sm">
                <i className="fa-solid fa-book text-base mb-1"></i>
                <span className="text-[9px] uppercase tracking-wider">PDF</span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">Đợi Ngắn Đừng Ngủ Dài</h4>
                  <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 text-[10px] px-2.5 py-0.5 rounded font-bold bold-border">Đang công khai</span>
                </div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Tác giả: Nguyễn Ngọc Thiện • Thể loại: Phát triển bản thân</p>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">File nguồn: <span className="font-mono text-slate-900 dark:text-white">Doi_ngan_dung_ngu_dai.pdf (14.2 MB)</span> • Lượt đọc: <strong className="text-pink-600">1,240</strong></p>
                <p className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 pt-0.5">Mã ISBN: ISBN-978-604-12-9842-1 • Ngày upload bởi Admin: 10/09/2026</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 self-end md:self-center">
              <button className="px-3.5 py-2 bg-white dark:bg-slate-700 hover:bg-slate-100 text-slate-900 dark:text-white rounded-xl text-xs font-bold bold-border transition shadow-sm">Xem file</button>
              <button className="px-3.5 py-2 bg-amber-100 hover:bg-amber-200 text-slate-900 rounded-xl text-xs font-bold bold-border transition shadow-sm">Sửa thông tin</button>
              <button className="px-3.5 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold bold-border transition shadow-sm">Gỡ sách</button>
            </div>
          </div>

          <div className="book-card bg-white dark:bg-slate-800 rounded-2xl p-5 bold-border shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
            <div className="flex items-start space-x-4">
              <div className="w-14 h-18 bg-amber-100 dark:bg-amber-900/30 bold-border rounded-xl flex flex-col items-center justify-center text-amber-800 dark:text-amber-300 font-extrabold shrink-0 shadow-sm">
                <i className="fa-solid fa-book text-base mb-1"></i>
                <span className="text-[9px] uppercase tracking-wider">EPUB</span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">Nhà Giả Kim</h4>
                  <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 text-[10px] px-2.5 py-0.5 rounded font-bold bold-border">Đang công khai</span>
                </div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Tác giả: Paulo Coelho • Thể loại: Tiểu thuyết kinh điển</p>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">File nguồn: <span className="font-mono text-slate-900 dark:text-white">Nha_gia_kim_full.epub (8.6 MB)</span> • Lượt đọc: <strong className="text-pink-600">3,890</strong></p>
                <p className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 pt-0.5">Mã ISBN: ISBN-978-604-09-1120-4 • Ngày upload bởi Admin: 05/09/2026</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 self-end md:self-center">
              <button className="px-3.5 py-2 bg-white dark:bg-slate-700 hover:bg-slate-100 text-slate-900 dark:text-white rounded-xl text-xs font-bold bold-border transition shadow-sm">Xem file</button>
              <button className="px-3.5 py-2 bg-amber-100 hover:bg-amber-200 text-slate-900 rounded-xl text-xs font-bold bold-border transition shadow-sm">Sửa thông tin</button>
              <button className="px-3.5 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold bold-border transition shadow-sm">Gỡ sách</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuanLySach;