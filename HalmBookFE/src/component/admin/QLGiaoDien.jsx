import React from 'react';

const QuanLyGiaoDien = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 bold-border shadow-sm space-y-6">
        <div className="flex justify-between items-center border-b-2 border-slate-900 dark:border-slate-700 pb-4">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Quản Lý Giao Diện Trang Chủ & Chân Trang</h3>
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-0.5">Tùy chỉnh Banner quảng cáo, thay đổi thông tin liên hệ ở Footer</p>
          </div>
          <button className="bg-slate-900 dark:bg-slate-700 text-white px-4 py-2 rounded-xl text-xs font-bold bold-border hover:bg-slate-800 transition shadow-sm">Lưu Thay Đổi</button>
        </div>

        <div className="space-y-4">
          <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center space-x-2">
            <i className="fa-solid fa-images text-teal-600"></i>
            <span>Quản Lý Banner Sự Kiện Trang Chủ</span>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border-2 border-dashed border-slate-900 dark:border-slate-600 rounded-xl p-5 text-center bg-teal-50/50 dark:bg-slate-700/50 cursor-pointer hover:bg-teal-50 transition flex flex-col justify-center items-center min-h-[160px]">
              <i className="fa-solid fa-cloud-arrow-up text-teal-600 dark:text-teal-400 text-3xl mb-2"></i>
              <p className="text-xs font-bold text-slate-900 dark:text-white">Tải Banner Mới Lên</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Kích thước chuẩn: 1200x400px (JPG, PNG)</p>
            </div>
            <div className="bold-border rounded-xl bg-white dark:bg-slate-700 overflow-hidden shadow-sm relative group flex flex-col">
              <div className="flex-1 bg-slate-200 dark:bg-slate-600 flex items-center justify-center relative min-h-[100px]">
                <span className="font-black text-slate-400 opacity-50 text-xl tracking-widest">SALE 50%</span>
                <div className="absolute top-2 left-2 bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded bold-border">Đang hiển thị</div>
              </div>
              <div className="p-3 flex justify-between items-center bg-white dark:bg-slate-800 border-t-2 border-slate-900 dark:border-slate-700">
                <div>
                  <p className="font-bold text-xs text-slate-900 dark:text-white">Banner_KhuyenMai_T9.jpg</p>
                  <p className="text-[10px] text-slate-500">Liên kết: /khuyen-mai-thang-9</p>
                </div>
                <button className="text-rose-500 hover:text-rose-700 bg-rose-50 p-1.5 rounded-lg bold-border"><i className="fa-solid fa-trash"></i></button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-6 border-t-2 border-slate-900 dark:border-slate-700">
          <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center space-x-2">
            <i className="fa-solid fa-layer-group text-indigo-600"></i>
            <span>Tùy Chỉnh Chân Trang (Footer)</span>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase mb-1">Số Hotline liên hệ</label>
              <input type="text" defaultValue="0397409029" className="w-full px-4 py-2.5 bg-white dark:bg-slate-700 dark:text-white bold-border rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-pink-500 transition" />
            </div>
            <div>
              <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase mb-1">Email hỗ trợ</label>
              <input type="text" defaultValue="hello@halmbook.vn" className="w-full px-4 py-2.5 bg-white dark:bg-slate-700 dark:text-white bold-border rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-pink-500 transition" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase mb-1">Thông báo chân trang (Copyright / Slogan)</label>
              <input type="text" defaultValue="Bản quyền thuộc về HALMBOOK Team. Đọc sách mọi lúc, mọi nơi." className="w-full px-4 py-2.5 bg-white dark:bg-slate-700 dark:text-white bold-border rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-pink-500 transition" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuanLyGiaoDien;