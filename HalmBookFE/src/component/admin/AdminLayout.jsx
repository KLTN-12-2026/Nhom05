import React, { useState } from 'react';
import { Outlet, NavLink, useLocation, Link, useNavigate } from 'react-router-dom';
import { clearAuthSession } from '../../service/AuthToken';

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAuthSession();
    navigate('/dangnhap', { replace: true });
  };

  // Hàm phụ trợ để đổi tiêu đề Header dựa trên URL hiện tại
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('thong-ke')) return 'Báo Cáo Thống Kê Toàn Diện Hệ Thống';
    if (path.includes('quan-ly-sach')) return 'Quản Lý Kho Sách Điện Tử (Admin)';
    if (path.includes('quan-ly-tai-chinh')) return 'Quản Lý Tài Chính & Giao Dịch';
    if (path.includes('quan-ly-khach-hang')) return 'Quản Lý Khách Hàng & Độc Giả';
    if (path.includes('quan-ly-uu-dai')) return 'Quản Lý Ưu Đãi & Gói Nạp Khoai Tây';
    if (path.includes('quan-ly-giao-dien')) return 'Quản Lý Giao Diện Ứng Dụng (UI/UX)';
    if (path.includes('thong-bao-ho-tro')) return 'Hỗ Trợ & Thông Báo Độc Giả';
    return 'HALMBOOK Admin Workspace';
  };

  // Các hàm quản lý Modal tạm thời giữ lại ở đây (Bạn có thể chuyển State vào từng file con sau này nếu muốn)
  const [activeModal, setActiveModal] = useState(null);
  const openModal = (modalId) => setActiveModal(modalId);
  const closeModal = () => setActiveModal(null);

  return (
    <div className="bg-slate-100 dark:bg-slate-900 font-sans antialiased text-slate-900 dark:text-slate-100 h-screen w-screen overflow-hidden flex flex-col md:flex-row transition-colors duration-200">
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-full md:w-72 bg-white dark:bg-slate-800 bold-border-lg flex flex-col justify-between shrink-0 z-20 h-full shadow-lg m-0">
        <div>
          {/* Logo Section */}
          <div className="p-4 border-b-2 border-slate-900 dark:border-slate-700 flex items-center space-x-3 bg-pink-50/50 dark:bg-slate-800">
            <div className="bg-amber-100 text-amber-800 p-2.5 rounded-xl bold-border shadow-md flex items-center justify-center text-lg">
              🥔
            </div>
            <div>
              <h1 className="font-black text-sm tracking-wide text-slate-900 dark:text-white">HALMBOOK</h1>
              <p className="text-[10px] tracking-widest text-pink-600 dark:text-pink-400 font-extrabold uppercase">ADMIN PORTAL</p>
            </div>
          </div>

          {/* Menu Items với NavLink */}
          <nav className="p-3 space-y-2 mt-2 overflow-y-auto max-h-[calc(100vh-140px)]">
            <NavLink to="/admin/thong-ke" className={({ isActive }) => `w-full flex items-center space-x-3.5 px-4 py-3 rounded-xl transition-all duration-200 text-left font-bold text-sm bold-border ${isActive ? 'bg-pink-100 dark:bg-pink-900/40 text-slate-900 dark:text-white shadow-sm' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
              <i className="fa-solid fa-chart-pie text-base w-5 text-center text-indigo-600 dark:text-indigo-400"></i>
              <span>Báo cáo thống kê</span>
            </NavLink>
            
            <NavLink to="/admin/quan-ly-sach" className={({ isActive }) => `w-full flex items-center space-x-3.5 px-4 py-3 rounded-xl transition-all duration-200 text-left font-bold text-sm bold-border ${isActive ? 'bg-pink-100 dark:bg-pink-900/40 text-slate-900 dark:text-white shadow-sm' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
              <i className="fa-solid fa-book text-base w-5 text-center text-pink-600"></i>
              <span>Quản lý kho sách</span>
            </NavLink>
            
            <NavLink to="/admin/quan-ly-tai-chinh" className={({ isActive }) => `w-full flex items-center space-x-3.5 px-4 py-3 rounded-xl transition-all duration-200 text-left font-bold text-sm bold-border ${isActive ? 'bg-pink-100 dark:bg-pink-900/40 text-slate-900 dark:text-white shadow-sm' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
              <i className="fa-solid fa-wallet text-base w-5 text-center text-emerald-600"></i>
              <span>Quản lý tài chính</span>
            </NavLink>
            
            <NavLink to="/admin/quan-ly-khach-hang" className={({ isActive }) => `w-full flex items-center space-x-3.5 px-4 py-3 rounded-xl transition-all duration-200 text-left font-bold text-sm bold-border ${isActive ? 'bg-pink-100 dark:bg-pink-900/40 text-slate-900 dark:text-white shadow-sm' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
              <i className="fa-solid fa-users text-base w-5 text-center text-blue-600"></i>
              <span>Quản lý khách hàng</span>
            </NavLink>
            
            <NavLink to="/admin/quan-ly-uu-dai" className={({ isActive }) => `w-full flex items-center space-x-3.5 px-4 py-3 rounded-xl transition-all duration-200 text-left font-bold text-sm bold-border ${isActive ? 'bg-pink-100 dark:bg-pink-900/40 text-slate-900 dark:text-white shadow-sm' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
              <i className="fa-solid fa-tags text-base w-5 text-center text-amber-600"></i>
              <span>Quản lý ưu đãi & Gói</span>
            </NavLink>
            
            <NavLink to="/admin/quan-ly-giao-dien" className={({ isActive }) => `w-full flex items-center space-x-3.5 px-4 py-3 rounded-xl transition-all duration-200 text-left font-bold text-sm bold-border ${isActive ? 'bg-pink-100 dark:bg-pink-900/40 text-slate-900 dark:text-white shadow-sm' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
              <i className="fa-solid fa-palette text-base w-5 text-center text-teal-600"></i>
              <span>Quản lý giao diện</span>
            </NavLink>
            
            <NavLink to="/admin/thong-bao-ho-tro" className={({ isActive }) => `w-full flex items-center space-x-3.5 px-4 py-3 rounded-xl transition-all duration-200 text-left font-bold text-sm bold-border ${isActive ? 'bg-pink-100 dark:bg-pink-900/40 text-slate-900 dark:text-white shadow-sm' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
              <i className="fa-solid fa-envelope text-base w-5 text-center text-purple-600"></i>
              <span>Hỗ trợ & Thông báo</span>
            </NavLink>
          </nav>
        </div>

        {/* Sidebar System Status */}
        <div className="p-3 m-3 bg-white dark:bg-slate-700 rounded-xl bold-border text-xs text-slate-700 dark:text-slate-200 shadow-sm shrink-0">
          <div className="flex items-center space-x-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse border border-slate-900"></span>
            <span className="font-bold text-slate-900 dark:text-white">HALMBOOK Online</span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-300">Hotline: <strong className="text-slate-900 dark:text-white">0397409029</strong></p>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col h-full bg-white dark:bg-slate-900 overflow-hidden">
        
        {/* Top Header */}
        <header className="h-16 bg-white dark:bg-slate-800 border-b-2 border-slate-900 dark:border-slate-700 px-6 md:px-8 flex items-center justify-between shrink-0 shadow-sm z-10">
          <div className="flex items-center space-x-4">
            {/* Sử dụng hàm getPageTitle() để render tiêu đề động */}
            <h2 className="font-extrabold text-base md:text-lg text-slate-900 dark:text-white">
              {getPageTitle()}
            </h2>
          </div>
          <div className="flex items-center space-x-3">
            <div className="hidden sm:flex items-center space-x-2 text-slate-800 dark:text-slate-200 bg-pink-50 dark:bg-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold bold-border">
              <i className="fa-solid fa-phone text-pink-600 dark:text-pink-400"></i>
              <span>0397409029</span>
            </div>
            
            <button className="w-9 h-9 bg-white dark:bg-slate-700 bold-border rounded-xl flex items-center justify-center text-slate-800 dark:text-amber-300 hover:bg-slate-100 dark:hover:bg-slate-600 transition shadow-sm" title="Chuyển đổi Dark Mode">
              <i className="fa-solid fa-moon text-sm"></i>
            </button>

            {/* Admin Profile Dropdown */}
            <div className="relative group">
              <button className="flex items-center space-x-2 bg-white dark:bg-slate-700 bold-border py-1.5 px-3 rounded-xl shadow-sm hover:bg-slate-50 dark:hover:bg-slate-600 transition cursor-pointer">
                <div className="w-7 h-7 rounded-full bg-slate-900 dark:bg-slate-900 text-white flex items-center justify-center font-bold text-xs">AD</div>
                <span className="text-xs font-bold text-slate-900 dark:text-white">Admin Tổng</span>
                <i className="fa-solid fa-chevron-down text-[10px] text-slate-700 dark:text-slate-300 group-hover:rotate-180 transition-transform"></i>
              </button>

              {/* Tạm dùng CSS group-hover thay cho State để hiện Dropdown mượt mà */}
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 bold-border rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 p-2 space-y-1">
                <div className="px-3 py-2 border-b-2 border-slate-900 dark:border-slate-700 mb-1">
                  <p className="text-xs font-black text-slate-900 dark:text-white">Admin Tổng Hệ Thống</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">admin@halmbook.vn</p>
                </div>
                <button onClick={() => openModal('profileModal')} className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-pink-50 dark:hover:bg-slate-700 transition flex items-center space-x-2">
                  <i className="fa-solid fa-user-gear text-pink-600"></i>
                  <span>Thông tin cá nhân</span>
                </button>
                <button onClick={() => openModal('forgotPasswordModal')} className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-pink-50 dark:hover:bg-slate-700 transition flex items-center space-x-2">
                  <i className="fa-solid fa-key text-amber-600"></i>
                  <span>Lấy lại mật khẩu</span>
                </button>
                <button type="button" onClick={handleLogout} className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-rose-50 dark:hover:bg-slate-700 transition flex items-center space-x-2 border-t border-slate-200 dark:border-slate-700 pt-2 text-rose-600">
                  <i className="fa-solid fa-right-from-bracket"></i>
                  <span>Đăng xuất</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* CỘT PHẢI - NỘI DUNG CUỘN */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col justify-between relative">
          <div className="max-w-7xl mx-auto w-full space-y-6 flex-1">

            {/* 🔥 QUAN TRỌNG: Đây là nơi React Router sẽ render các giao diện con (Báo cáo, Quản lý sách...) */}
            <Outlet />

          </div>

          {/* Fixed System Footer */}
          <footer className="bg-white dark:bg-slate-800 bold-border py-4 px-6 md:px-8 mt-6 rounded-2xl shadow-sm shrink-0">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-bold text-slate-700 dark:text-slate-300">
              <div>
                <p className="font-black text-slate-900 dark:text-white">Hệ Thống Quản Trị HALMBOOK Admin</p>
                <p className="text-slate-600 dark:text-slate-400 mt-0.5">Bản quyền thuộc về HALMBOOK Team • Hotline hỗ trợ: 0397409029</p>
              </div>
              <div className="flex flex-wrap gap-4">
                <Link to="/admin/thong-ke" className="hover:text-pink-600 transition">Thống kê</Link>
                <Link to="/admin/quan-ly-sach" className="hover:text-pink-600 transition">Kho sách</Link>
                <Link to="/admin/quan-ly-tai-chinh" className="hover:text-pink-600 transition">Tài chính</Link>
                <Link to="/admin/quan-ly-giao-dien" className="hover:text-pink-600 transition">Giao diện</Link>
              </div>
            </div>
          </footer>
        </div>
      </main>

      {/* Floating Support Bubble */}
      <div className="fixed bottom-6 right-6 z-40">
        <button onClick={() => openModal('devSupportModal')} className="w-14 h-14 bg-pink-600 hover:bg-pink-700 text-white rounded-full bold-border shadow-2xl flex items-center justify-center text-xl transition transform hover:scale-105" title="Liên hệ Dev hỗ trợ hệ thống lỗi">
          <i className="fa-solid fa-headset"></i>
        </button>
      </div>

      {/* ================= MODALS (Popup Giao Diện) ================= */}

      {/* Modal: Admin Personal Info */}
      {activeModal === 'profileModal' && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl bold-border-lg">
            <div className="flex justify-between items-center border-b-2 border-slate-900 dark:border-slate-700 pb-3">
              <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center space-x-2">
                <i className="fa-solid fa-user-gear text-pink-600"></i>
                <span>Thông Tin Cá Nhân Admin</span>
              </h3>
              <button onClick={closeModal} className="text-slate-700 dark:text-slate-300 font-bold"><i className="fa-solid fa-xmark text-lg"></i></button>
            </div>
            <div className="space-y-4 mt-4 text-xs font-semibold">
              <div>
                <label className="block text-extrabold uppercase mb-1 text-slate-600 dark:text-slate-400">Họ và tên</label>
                <input type="text" defaultValue="Nguyễn Văn Admin" className="w-full px-4 py-2.5 bg-white dark:bg-slate-700 dark:text-white bold-border rounded-xl font-bold" />
              </div>
              <div>
                <label className="block text-extrabold uppercase mb-1 text-slate-600 dark:text-slate-400">Email quản trị</label>
                <input type="email" defaultValue="admin@halmbook.vn" className="w-full px-4 py-2.5 bg-white dark:bg-slate-700 dark:text-white bold-border rounded-xl font-bold" />
              </div>
              <div>
                <label className="block text-extrabold uppercase mb-1 text-slate-600 dark:text-slate-400">Số điện thoại liên hệ</label>
                <input type="text" defaultValue="0397409029" className="w-full px-4 py-2.5 bg-white dark:bg-slate-700 dark:text-white bold-border rounded-xl font-bold" />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6 pt-3 border-t-2 border-slate-900 dark:border-slate-700">
              <button onClick={closeModal} className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl text-xs font-bold bold-border">Đóng</button>
              <button onClick={closeModal} className="px-4 py-2 bg-slate-900 dark:bg-slate-700 text-white rounded-xl text-xs font-bold bold-border">Lưu Thay Đổi</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Password Recovery */}
      {activeModal === 'forgotPasswordModal' && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl bold-border-lg">
            <div className="flex justify-between items-center border-b-2 border-slate-900 dark:border-slate-700 pb-3">
              <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center space-x-2">
                <i className="fa-solid fa-key text-amber-600"></i>
                <span>Khôi Phục Mật Khẩu Quản Trị Viên</span>
              </h3>
              <button onClick={closeModal} className="text-slate-700 dark:text-slate-300 font-bold"><i className="fa-solid fa-xmark text-lg"></i></button>
            </div>
            <div className="space-y-4 mt-4">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Nhập email hoặc số điện thoại đã đăng ký để nhận mã OTP lấy lại mật khẩu:</p>
              <div>
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase mb-1">Email / Số điện thoại</label>
                <input type="text" placeholder="admin@halmbook.vn hoặc 0397409029..." className="w-full px-4 py-2.5 bg-white dark:bg-slate-700 dark:text-white bold-border rounded-xl text-sm font-semibold" />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6 pt-3 border-t-2 border-slate-900 dark:border-slate-700">
              <button onClick={closeModal} className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl text-xs font-bold bold-border">Hủy</button>
              <button onClick={closeModal} className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold bold-border">Gửi Mã OTP</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Dev Support */}
      {activeModal === 'devSupportModal' && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl bold-border-lg space-y-4">
            <div className="flex justify-between items-center border-b-2 border-slate-900 dark:border-slate-700 pb-3">
              <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center space-x-2">
                <i className="fa-solid fa-headset text-pink-600"></i>
                <span>Yêu Cầu Hỗ Trợ Kỹ Thuật (Dev Team HALMBOOK)</span>
              </h3>
              <button onClick={closeModal} className="text-slate-700 dark:text-slate-300 font-bold"><i className="fa-solid fa-xmark text-lg"></i></button>
            </div>
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Gặp sự cố hệ thống, lỗi tải file PDF hoặc lỗi thanh toán? Gửi yêu cầu ngay đến đội ngũ lập trình viên trực tuyến 24/7:</p>
            <div>
              <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase mb-1">Mô tả lỗi hệ thống / Nội dung cần hỗ trợ</label>
              <textarea rows="4" placeholder="Nhập chi tiết lỗi gặp phải..." className="w-full px-4 py-2.5 bg-white dark:bg-slate-700 dark:text-white bold-border rounded-xl text-sm font-semibold"></textarea>
            </div>
            <div className="flex justify-end space-x-3 pt-3 border-t-2 border-slate-900 dark:border-slate-700">
              <button onClick={closeModal} className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl text-xs font-bold bold-border">Hủy</button>
              <button onClick={closeModal} className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-bold bold-border">Gửi Đến Dev Team</button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
};

export default AdminLayout;