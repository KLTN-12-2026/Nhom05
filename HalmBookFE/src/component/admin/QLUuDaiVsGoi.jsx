import React from 'react';

const QuanLyUuDai = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 bold-border shadow-sm space-y-6">
        <div className="flex justify-between items-center border-b-2 border-slate-900 dark:border-slate-700 pb-4">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Quản Lý Ưu Đãi & Gói Nạp Khoai Tây</h3>
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-0.5">Tạo mã giảm giá thuê sách và quản lý các gói nạp khoai tây (Thêm, Sửa, Xóa)</p>
          </div>
          <div className="flex space-x-2">
            <button className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl text-xs font-bold bold-border transition shadow-sm">Thêm Gói Khoai Tây 🥔</button>
            <button className="bg-slate-900 dark:bg-slate-700 text-white px-4 py-2 rounded-xl text-xs font-bold bold-border transition shadow-sm">Tạo Mã Giảm Giá</button>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center space-x-2">
            <span>🥔 Danh Sách Gói Nạp Khoai Tây Hiện Hành</span>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="potatoPackagesGrid">
            <div className="p-5 bold-border rounded-2xl bg-white dark:bg-slate-700 space-y-3 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <span className="bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 font-black text-xs px-2.5 py-1 rounded-lg bold-border">🥔 100 Củ Khoai</span>
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Đang bán</span>
                </div>
                <h4 className="font-black text-slate-900 dark:text-white mt-2 text-base">Gói Khởi Động</h4>
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-1">Phù hợp cho độc giả đọc thư giãn cuối tuần. Tặng kèm 10 củ.</p>
                <p className="text-sm font-black text-pink-600 mt-2">Giá: 49,000 đ</p>
              </div>
              <div className="flex space-x-2 pt-2 border-t border-slate-200 dark:border-slate-600">
                <button className="flex-1 py-1.5 bg-amber-100 hover:bg-amber-200 text-slate-900 rounded-lg text-xs font-bold bold-border">Sửa</button>
                <button className="flex-1 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-xs font-bold bold-border">Xóa</button>
              </div>
            </div>

            <div className="p-5 bold-border rounded-2xl bg-white dark:bg-slate-700 space-y-3 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <span className="bg-pink-100 text-pink-800 dark:bg-pink-900/50 dark:text-pink-300 font-black text-xs px-2.5 py-1 rounded-lg bold-border">🥔 500 Củ Khoai</span>
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Bán chạy nhất</span>
                </div>
                <h4 className="font-black text-slate-900 dark:text-white mt-2 text-base">Gói VIP Tháng</h4>
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-1">Đọc trọn vẹn kho sách độc quyền, tặng kèm 80 củ khoai.</p>
                <p className="text-sm font-black text-pink-600 mt-2">Giá: 199,000 đ</p>
              </div>
              <div className="flex space-x-2 pt-2 border-t border-slate-200 dark:border-slate-600">
                <button className="flex-1 py-1.5 bg-amber-100 hover:bg-amber-200 text-slate-900 rounded-lg text-xs font-bold bold-border">Sửa</button>
                <button className="flex-1 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-xs font-bold bold-border">Xóa</button>
              </div>
            </div>

            <div className="p-5 bold-border rounded-2xl bg-white dark:bg-slate-700 space-y-3 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <span className="bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300 font-black text-xs px-2.5 py-1 rounded-lg bold-border">🥔 1500 Củ Khoai</span>
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Siêu ưu đãi</span>
                </div>
                <h4 className="font-black text-slate-900 dark:text-white mt-2 text-base">Gói Đại Gia Khoai Tây</h4>
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-1">Dành cho hội viên nghiên cứu chuyên sâu, tặng kèm 300 củ.</p>
                <p className="text-sm font-black text-pink-600 mt-2">Giá: 499,000 đ</p>
              </div>
              <div className="flex space-x-2 pt-2 border-t border-slate-200 dark:border-slate-600">
                <button className="flex-1 py-1.5 bg-amber-100 hover:bg-amber-200 text-slate-900 rounded-lg text-xs font-bold bold-border">Sửa</button>
                <button className="flex-1 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-xs font-bold bold-border">Xóa</button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t-2 border-slate-900 dark:border-slate-700">
          <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">🎟️ Mã Giảm Giá Đang Hoạt Động</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 bold-border rounded-2xl bg-white dark:bg-slate-700 flex justify-between items-center shadow-sm">
              <div>
                <span className="bg-pink-100 text-pink-800 dark:bg-pink-900/50 dark:text-pink-300 font-mono font-black text-xs px-2.5 py-1 rounded-lg bold-border">HALM20</span>
                <h4 className="font-extrabold text-slate-900 dark:text-white mt-2 text-sm">Giảm 20% cho hội viên mới</h4>
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-1">Áp dụng cho toàn bộ danh mục sách kinh tế & kỹ năng.</p>
              </div>
              <button className="text-pink-600 dark:text-pink-400 font-bold text-xs hover:underline">Sao chép</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuanLyUuDai;