import React from 'react';

const QuanLyTaiChinh = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 bold-border shadow-sm space-y-6">
        <div className="flex justify-between items-center border-b-2 border-slate-900 dark:border-slate-700 pb-4">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Quản Lý Tài Chính & Giao Dịch Thuê Sách</h3>
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-0.5">Thống kê doanh thu, gói khoai tây VIP và xác nhận giao dịch chờ duyệt</p>
          </div>
          <button className="bg-slate-900 dark:bg-slate-700 text-white px-4 py-2 rounded-xl text-xs font-bold bold-border hover:bg-slate-800 transition shadow-sm">Xuất Excel</button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 bold-border shadow-sm">
            <p className="text-xs uppercase font-extrabold text-slate-600 dark:text-slate-400">Doanh thu tháng này</p>
            <h4 className="text-2xl font-black text-slate-900 dark:text-white mt-2">142,850,000 đ</h4>
            <span className="text-xs text-emerald-700 dark:text-emerald-400 font-bold mt-1 inline-block"><i className="fa-solid fa-arrow-up"></i> +19.4% so với tháng trước</span>
          </div>
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 bold-border shadow-sm">
            <p className="text-xs uppercase font-extrabold text-slate-600 dark:text-slate-400">Gói hội viên khoai tây active</p>
            <h4 className="text-2xl font-black text-slate-900 dark:text-white mt-2">1,490 tài khoản</h4>
            <span className="text-xs text-emerald-700 dark:text-emerald-400 font-bold mt-1 inline-block"><i className="fa-solid fa-arrow-up"></i> +9.1% tuần này</span>
          </div>
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 bold-border shadow-sm">
            <p className="text-xs uppercase font-extrabold text-slate-600 dark:text-slate-400">Giao dịch chờ duyệt</p>
            <h4 className="text-2xl font-black text-amber-600 mt-2">3 giao dịch</h4>
            <span className="text-xs text-amber-700 dark:text-amber-400 font-bold mt-1 inline-block"><i className="fa-solid fa-clock"></i> Cần xác nhận ngay</span>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center space-x-2">
            <i className="fa-solid fa-triangle-exclamation text-amber-500"></i>
            <span>Danh Sách Giao Dịch Nạp Tiền / Thuê Sách Chờ Xác Nhận</span>
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
              <thead className="bg-pink-50 dark:bg-slate-700 text-xs uppercase text-slate-900 dark:text-white font-black border-b-2 border-slate-900 dark:border-slate-600">
                <tr>
                  <th className="py-3 px-4 rounded-l-xl">Mã GD</th>
                  <th className="py-3 px-4">Độc giả</th>
                  <th className="py-3 px-4">Nội dung giao dịch</th>
                  <th className="py-3 px-4">Số tiền</th>
                  <th className="py-3 px-4">Phương thức</th>
                  <th className="py-3 px-4 rounded-r-xl">Thao tác duyệt</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-slate-200 dark:divide-slate-700 font-semibold text-xs">
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <td className="py-3 px-4 font-mono font-bold">#TX-99821</td>
                  <td className="py-3 px-4 text-slate-900 dark:text-white">Nguyễn Văn An</td>
                  <td className="py-3 px-4">Nạp gói khoai tây VIP Thượng Đỉnh</td>
                  <td className="py-3 px-4 font-bold text-pink-600">199,000 đ</td>
                  <td className="py-3 px-4">Momo QR</td>
                  <td className="py-3 px-4 flex items-center space-x-2">
                    <button className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-bold bold-border">Xác nhận</button>
                    <button className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg font-bold bold-border">Từ chối</button>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <td className="py-3 px-4 font-mono font-bold">#TX-99822</td>
                  <td className="py-3 px-4 text-slate-900 dark:text-white">Trần Thị Mai</td>
                  <td className="py-3 px-4">Thuê sách độc quyền bản đặc biệt</td>
                  <td className="py-3 px-4 font-bold text-pink-600">45,000 đ</td>
                  <td className="py-3 px-4">Chuyển khoản Ngân hàng</td>
                  <td className="py-3 px-4 flex items-center space-x-2">
                    <button className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-bold bold-border">Xác nhận</button>
                    <button className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg font-bold bold-border">Từ chối</button>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <td className="py-3 px-4 font-mono font-bold">#TX-99825</td>
                  <td className="py-3 px-4 text-slate-900 dark:text-white">Lê Hoàng Nam</td>
                  <td className="py-3 px-4">Nạp khoai tây 500 củ (Gói tháng)</td>
                  <td className="py-3 px-4 font-bold text-pink-600">99,000 đ</td>
                  <td className="py-3 px-4">VNPay</td>
                  <td className="py-3 px-4 flex items-center space-x-2">
                    <button className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-bold bold-border">Xác nhận</button>
                    <button className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg font-bold bold-border">Từ chối</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuanLyTaiChinh;