import React from 'react';

const QuanLyKhachHang = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 bold-border shadow-sm space-y-6">
        <div className="flex justify-between items-center border-b-2 border-slate-900 dark:border-slate-700 pb-4">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Quản Lý Khách Hàng & Độc Giả HALMBOOK</h3>
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-0.5">Danh sách toàn bộ thành viên sử dụng hệ thống, kèm tính năng khóa/mở tài khoản</p>
          </div>
          <button className="bg-slate-900 dark:bg-slate-700 text-white px-4 py-2 rounded-xl text-xs font-bold bold-border hover:bg-slate-800 transition shadow-sm">Thêm Khách Hàng</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
            <thead className="bg-pink-50 dark:bg-slate-700 text-xs uppercase text-slate-900 dark:text-white font-black border-b-2 border-slate-900 dark:border-slate-600">
              <tr>
                <th className="py-3 px-4 rounded-l-xl">Độc giả</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Số điện thoại</th>
                <th className="py-3 px-4">Hạng tài khoản</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4 rounded-r-xl">Thao tác khóa / mở</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-slate-200 dark:divide-slate-700 font-semibold text-xs">
              <tr className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                <td className="py-3 px-4 text-slate-900 dark:text-white flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-pink-100 text-pink-800 font-bold bold-border flex items-center justify-center text-xs">NA</div>
                  <span>Nguyễn Văn An</span>
                </td>
                <td className="py-3 px-4 text-slate-600 dark:text-slate-400">an.nguyen@gmail.com</td>
                <td className="py-3 px-4 text-slate-600 dark:text-slate-400">0397409029</td>
                <td className="py-3 px-4"><span className="bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 bold-border px-2.5 py-1 rounded-full text-xs font-bold">VIP Khoai Tây</span></td>
                <td className="py-3 px-4"><span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 bold-border px-2 py-0.5 rounded text-[11px] font-bold">Hoạt động</span></td>
                <td className="py-3 px-4">
                  <button className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg font-bold bold-border transition">Khóa tài khoản</button>
                </td>
              </tr>
              <tr className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                <td className="py-3 px-4 text-slate-900 dark:text-white flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-bold bold-border flex items-center justify-center text-xs">TM</div>
                  <span>Trần Thị Mai</span>
                </td>
                <td className="py-3 px-4 text-slate-600 dark:text-slate-400">mai.tran@gmail.com</td>
                <td className="py-3 px-4 text-slate-600 dark:text-slate-400">0793503369</td>
                <td className="py-3 px-4"><span className="bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 bold-border px-2.5 py-1 rounded-full text-xs font-bold">Standard</span></td>
                <td className="py-3 px-4"><span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 bold-border px-2 py-0.5 rounded text-[11px] font-bold">Hoạt động</span></td>
                <td className="py-3 px-4">
                  <button className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg font-bold bold-border transition">Khóa tài khoản</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default QuanLyKhachHang;