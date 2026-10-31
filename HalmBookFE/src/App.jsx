import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './component/ProtectedRoute';
import PublicRoute from './component/PublicRoute';

// Admin components
import AdminLayout from './component/admin/AdminLayout';
import BaoCaoThongKe from './component/admin/BaoCaoThongKe';
import QuanLySach from './component/admin/QLSach';
import QuanLyTaiChinh from './component/admin/QLTaiChinh';
import QuanLyKhachHang from './component/admin/QLKhachHang';
import QuanLyUuDai from './component/admin/QLUuDaiVsGoi';
import QuanLyGiaoDien from './component/admin/QLGiaoDien';
import ThongBaoHoTro from './component/admin/HoTroThongBao';

// User & Public components
import TrangChu from './component/user/TrangChu';
import DangNhap from './component/user/DangNhap';
import ForgotPassword from './component/user/QuenMatKhau';
import Profile from './component/user/CaNhan';
import Hang from './component/user/HangTv';
import TSCN from './component/user/TuSachCn';
import LSGiaoDich from './component/user/LSGiaoDich';
import Ptthanhtoan from './component/user/PtThanhToan';
import UpLoad from './component/user/UpLoadFile';
import ThanhToan from './component/user/thanhtoan';
import ChiTietSach from './component/user/ChiTietSach';
import DocSach from './component/user/DocSach';
import GioHang from './component/user/GioHang';
import UuDai from './component/user/UuDai';
import ViKT from './component/user/ViKT';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* ========================================================= */}
          {/* 1. GUEST ONLY ROUTES (Nếu đã login thì tự động vào trang) */}
          {/* ========================================================= */}
          <Route element={<PublicRoute />}>
            <Route path="/" element={<DangNhap />} />
            <Route path="/dangnhap" element={<DangNhap />} />
            <Route path="/quenmatkhau" element={<ForgotPassword />} />
          </Route>

          {/* ========================================================= */}
          {/* 2. PUBLIC CONTENT ROUTES (Xem tự do, không bắt buộc login) */}
          {/* ========================================================= */}
          <Route path="/chitietsach" element={<ChiTietSach />} />
          <Route path="/chitietsach/:id" element={<ChiTietSach />} />
          <Route path="/hang" element={<Hang />} />
          <Route path="/uudai" element={<UuDai />} />

          {/* ========================================================= */}
          {/* 3. USER PROTECTED ROUTES (Bắt buộc phải đăng nhập)        */}
          {/* ========================================================= */}
          <Route element={<ProtectedRoute />}>
            <Route path="/trangchu" element={<TrangChu />} />
            <Route path="/canhan" element={<Profile />} />
            <Route path="/tusachcn" element={<TSCN />} />
            <Route path="/docsach" element={<DocSach />} />
            <Route path="/giohang" element={<GioHang />} />
            <Route path="/thanhtoan" element={<ThanhToan />} />
            <Route path="/ptthanhtoan" element={<Ptthanhtoan />} />
            <Route path="/lsgiaodich" element={<LSGiaoDich />} />
            <Route path="/upload" element={<UpLoad />} />
            <Route path="/vi" element={<ViKT />} />
          </Route>

          {/* ========================================================= */}
          {/* 4. ADMIN PROTECTED ROUTES (Bắt buộc quyền ADMIN)           */}
          {/* ========================================================= */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'ROLE_ADMIN']} />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="thong-ke" replace />} />
              <Route path="thong-ke" element={<BaoCaoThongKe />} />
              <Route path="quan-ly-sach" element={<QuanLySach />} />
              <Route path="quan-ly-tai-chinh" element={<QuanLyTaiChinh />} />
              <Route path="quan-ly-khach-hang" element={<QuanLyKhachHang />} />
              <Route path="quan-ly-uu-dai" element={<QuanLyUuDai />} />
              <Route path="quan-ly-giao-dien" element={<QuanLyGiaoDien />} />
              <Route path="thong-bao-ho-tro" element={<ThongBaoHoTro />} />
            </Route>
          </Route>

          {/* ========================================================= */}
          {/* 5. CATCH-ALL ROUTE (Không tìm thấy -> Chuyển về trang chủ) */}
          {/* ========================================================= */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
