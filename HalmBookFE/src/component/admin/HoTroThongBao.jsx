import React from 'react';

const ThongBaoHoTro = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 bold-border shadow-sm space-y-6">
        <div className="flex justify-between items-center border-b-2 border-slate-900 dark:border-slate-700 pb-4">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Hỗ Trợ & Thông Báo Độc Giả HALMBOOK</h3>
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-0.5">Xử lý yêu cầu hỗ trợ trực tuyến và gửi thông báo toàn hệ thống</p>
          </div>
          <button className="bg-slate-900 dark:bg-slate-700 text-white px-4 py-2 rounded-xl text-xs font-bold bold-border hover:bg-slate-800 transition shadow-sm">Gửi Thông Báo</button>
        </div>
        <div className="p-4 bg-white dark:bg-slate-700 bold-border rounded-2xl flex justify-between items-center shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300 bold-border flex items-center justify-center font-bold">
              <i className="fa-solid fa-headset"></i>
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">Yêu cầu hỗ trợ tài khoản VIP #891</h4>
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Khách hàng không truy cập được kho sách độc quyền tháng 9...</p>
            </div>
          </div>
          <button className="bg-slate-900 dark:bg-slate-700 text-white text-xs px-3.5 py-2 rounded-xl font-bold bold-border shadow-sm">Phản hồi</button>
        </div>
      </div>
    </div>
  );
};

export default ThongBaoHoTro;