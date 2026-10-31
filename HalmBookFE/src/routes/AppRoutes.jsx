import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '@/components/guards/ProtectedRoute';
import { ROUTES } from '@/constants/routes';

// ==================== EAGER IMPORT ALL PAGES (Đảm bảo 100% CSS và Icons nạp đồng bộ) ====================
// Auth & Public
import DangNhap from '@/components/user/DangNhap';
import QuenMatKhau from '@/components/user/QuenMatKhau';
import HangTv from '@/components/user/HangTv';
import TuSachCn from '@/components/user/TuSachCn';
import DocSach from '@/components/user/DocSach';
import GioHang from '@/components/user/GioHang';
import UuDai from '@/components/user/UuDai';
import ThanhToan from '@/components/user/ThanhToan';
import ChiTietSach from '@/components/user/ChiTietSach';

// User Pages
import TrangChu from '@/components/user/TrangChu';
import CaNhan from '@/components/user/CaNhan';

// Admin Pages
import AdminLayout from '@/components/admin/AdminLayout';
import BaoCaoThongKe from '@/components/admin/BaoCaoThongKe';
import QLSach from '@/components/admin/QLSach';
import GiaoDichThueSach from '@/components/admin/GiaoDichThueSach';
import QLTaiChinh from '@/components/admin/QLTaiChinh';
import QLKhachHang from '@/components/admin/QLKhachHang';
import QLUuDaiVsGoi from '@/components/admin/QLUuDaiVsGoi';
import QLGiaoDien from '@/components/admin/QLGiaoDien';
import HoTroThongBao from '@/components/admin/HoTroThongBao';

export default function AppRoutes() {
  return (
    <Routes>
      {/* 1. KHU VỰC CÔNG KHAI: không yêu cầu đăng nhập */}
      <Route path={ROUTES.ROOT} element={<DangNhap />} />
      <Route path={ROUTES.LOGIN} element={<DangNhap />} />
      <Route path={ROUTES.FORGOT_PASSWORD} element={<QuenMatKhau />} />
      <Route path={ROUTES.TIERS} element={<HangTv />} />
      <Route path={ROUTES.OFFERS} element={<UuDai />} />
      <Route path={ROUTES.BOOK_DETAIL} element={<ChiTietSach />} />
      <Route path={ROUTES.BOOK_DETAIL_BY_ID} element={<ChiTietSach />} />

      {/* 2. KHU VỰC USER: bắt buộc đăng nhập */}
      <Route element={<ProtectedRoute />}>
        <Route path={ROUTES.HOME} element={<TrangChu />} />
        <Route path={ROUTES.PROFILE} element={<CaNhan />} />
        <Route path={ROUTES.MY_BOOKSHELF} element={<TuSachCn />} />
        <Route path={ROUTES.READ_BOOK} element={<DocSach />} />
        <Route path={ROUTES.READ_BOOK_DETAIL} element={<DocSach />} />
        <Route path={ROUTES.CART} element={<GioHang />} />
        <Route path={ROUTES.PAYMENT} element={<ThanhToan />} />
      </Route>

      {/* 3. KHU VỰC ADMIN (Bắt buộc quyền ADMIN) */}
      <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'ROLE_ADMIN']} />}>
        <Route path={ROUTES.ADMIN} element={<AdminLayout />} />
        <Route path={ROUTES.ADMIN_STATISTICS} element={<BaoCaoThongKe />} />
        <Route path={ROUTES.ADMIN_BOOKS} element={<QLSach />} />
        <Route path={ROUTES.ADMIN_RENTAL_TRANSACTIONS} element={<GiaoDichThueSach />} />
        <Route path={ROUTES.ADMIN_FINANCE} element={<QLTaiChinh />} />
        <Route path={ROUTES.ADMIN_CUSTOMERS} element={<QLKhachHang />} />
        <Route path={ROUTES.ADMIN_OFFERS} element={<QLUuDaiVsGoi />} />
        <Route path={ROUTES.ADMIN_UI} element={<QLGiaoDien />} />
        <Route path={ROUTES.ADMIN_SUPPORT} element={<HoTroThongBao />} />
      </Route>

      {/* 4. FALLBACK 404 CATCH-ALL */}
      <Route path="*" element={<Navigate to={ROUTES.ROOT} replace />} />
    </Routes>
  );
}
