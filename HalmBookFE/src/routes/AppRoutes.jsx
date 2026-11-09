import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '@/components/guards/ProtectedRoute';
import { ROUTES } from '@/constants/routes';

// ==================== EAGER IMPORT CRITICAL PAGES (Cho tốc độ tải trang chủ & đăng nhập nhanh nhất) ====================
import TrangChu from '@/components/user/TrangChu';
import DangNhap from '@/components/user/DangNhap';
import ChiTietSach from '@/components/user/ChiTietSach';

// ==================== CODE-SPLITTING / LAZY LOAD CÁC TRANG CÒN LẠI ====================
// User & Auth Pages
const QuenMatKhau = lazy(() => import('@/components/user/QuenMatKhau'));
const HangTv = lazy(() => import('@/components/user/HangTv'));
const TuSachCn = lazy(() => import('@/components/user/TuSachCn'));
const DocSach = lazy(() => import('@/components/user/DocSach'));
const GioHang = lazy(() => import('@/components/user/GioHang'));
const UuDai = lazy(() => import('@/components/user/UuDai'));
const ThanhToan = lazy(() => import('@/components/user/ThanhToan'));
const CaNhan = lazy(() => import('@/components/user/CaNhan'));
const NhiemVu = lazy(() => import('@/components/user/NhiemVu'));
const DanhMucSach = lazy(() => import('@/components/user/DanhMucSach'));

// Admin Pages (Tách riêng biệt hoàn toàn khỏi bundle người dùng)
const AdminLayout = lazy(() => import('@/components/admin/AdminLayout'));
const BaoCaoThongKe = lazy(() => import('@/components/admin/BaoCaoThongKe'));
const QLSach = lazy(() => import('@/components/admin/QLSach'));
const GiaoDichThueSach = lazy(() => import('@/components/admin/GiaoDichThueSach'));
const QLTaiChinh = lazy(() => import('@/components/admin/QLTaiChinh'));
const QLKhachHang = lazy(() => import('@/components/admin/QLKhachHang'));
const QLUuDaiVsGoi = lazy(() => import('@/components/admin/QLUuDaiVsGoi'));
const QLGiaoDien = lazy(() => import('@/components/admin/QLGiaoDien'));
const HoTroThongBao = lazy(() => import('@/components/admin/HoTroThongBao'));

const PageLoader = () => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 bg-transparent">
    <div className="w-9 h-9 border-3 border-amber-800 dark:border-amber-400 border-t-transparent dark:border-t-transparent rounded-full animate-spin"></div>
    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 animate-pulse">Đang tải trang...</span>
  </div>
);

export default function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* 1. KHU VỰC CÔNG KHAI: Khách vãng lai và Thành viên đều xem được */}
        <Route path={ROUTES.ROOT} element={<TrangChu />} />
        <Route path="/trangchu" element={<Navigate to="/" replace />} />
        <Route path="/trang-chu" element={<Navigate to="/" replace />} />
        <Route path={ROUTES.LOGIN} element={<DangNhap />} />
        <Route path="/login" element={<DangNhap />} />
        <Route path="/admin/login" element={<DangNhap />} />
        <Route path={ROUTES.FORGOT_PASSWORD} element={<QuenMatKhau />} />
        <Route path={ROUTES.TIERS} element={<HangTv />} />
        <Route path={ROUTES.OFFERS} element={<UuDai />} />
        <Route path="/uu-dai" element={<Navigate to="/uudai" replace />} />
        <Route path="/offers" element={<Navigate to="/uudai" replace />} />
        <Route path="/khuyen-mai" element={<Navigate to="/uudai" replace />} />
        <Route path={ROUTES.CATEGORY} element={<DanhMucSach />} />
        <Route path={ROUTES.CATEGORY_BY_TOPIC} element={<DanhMucSach />} />
        <Route path="/danh-muc" element={<Navigate to="/danhmuc" replace />} />
        <Route path="/danh-muc/:topic" element={<DanhMucSach />} />
        <Route path={ROUTES.BOOK_DETAIL} element={<ChiTietSach />} />
        <Route path={ROUTES.BOOK_DETAIL_BY_ID} element={<ChiTietSach />} />
        {/* Mở chức năng Đọc Thử cho cả Khách vãng lai và Thành viên (giới hạn trang trong DocSach) */}
        <Route path={ROUTES.READ_BOOK} element={<DocSach />} />
        <Route path={ROUTES.READ_BOOK_DETAIL} element={<DocSach />} />

        {/* 2. KHU VỰC USER: Bắt buộc đăng nhập (Token còn hạn) */}
        <Route element={<ProtectedRoute />}>
          <Route path={ROUTES.PROFILE} element={<CaNhan />} />
          <Route path="/profile" element={<Navigate to="/canhan" replace />} />
          <Route path="/ca-nhan" element={<Navigate to="/canhan" replace />} />
          <Route path="/thongtincanhan" element={<Navigate to="/canhan" replace />} />
          <Route path={ROUTES.MY_BOOKSHELF} element={<TuSachCn />} />
          <Route path={ROUTES.CART} element={<GioHang />} />
          <Route path={ROUTES.PAYMENT} element={<ThanhToan />} />
          <Route path={ROUTES.WALLET} element={<Navigate to="/canhan?tab=wallet" replace />} />
          <Route path="/wallet" element={<Navigate to="/canhan?tab=wallet" replace />} />
          <Route path="/vi" element={<Navigate to="/canhan?tab=wallet" replace />} />
          <Route path="/vi-khoai" element={<Navigate to="/canhan?tab=wallet" replace />} />
          <Route path="/lich-su" element={<Navigate to="/canhan?tab=history" replace />} />
          <Route path="/lichsu" element={<Navigate to="/canhan?tab=history" replace />} />
          <Route path="/lichsugiaodich" element={<Navigate to="/canhan?tab=history" replace />} />
          <Route path="/history" element={<Navigate to="/canhan?tab=history" replace />} />
          <Route path={ROUTES.MISSIONS} element={<NhiemVu />} />
          <Route path="/nhiemvu" element={<NhiemVu />} />
          <Route path="/hotro" element={<Navigate to="/canhan?tab=support" replace />} />
          <Route path="/ho-tro" element={<Navigate to="/canhan?tab=support" replace />} />
          <Route path="/support" element={<Navigate to="/canhan?tab=support" replace />} />
          <Route path="/khieunai" element={<Navigate to="/canhan?tab=support" replace />} />
          <Route path="/khieu-nai" element={<Navigate to="/canhan?tab=support" replace />} />
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

          {/* Đường dẫn alias/legacy từ các file HTML của Admin - tránh rơi vào 404 về User */}
          <Route path="/TongQuan.html" element={<Navigate to={ROUTES.ADMIN} replace />} />
          <Route path="/BaoCao&ThongKe.html" element={<Navigate to={ROUTES.ADMIN_STATISTICS} replace />} />
          <Route path="/BaoCaoThongKe.html" element={<Navigate to={ROUTES.ADMIN_STATISTICS} replace />} />
          <Route path="/QuanLySach.html" element={<Navigate to={ROUTES.ADMIN_BOOKS} replace />} />
          <Route path="/GiaoDichThueSach.html" element={<Navigate to={ROUTES.ADMIN_RENTAL_TRANSACTIONS} replace />} />
          <Route path="/QuanLyTaiChinh.html" element={<Navigate to={ROUTES.ADMIN_FINANCE} replace />} />
          <Route path="/QuanLyKhachHang.html" element={<Navigate to={ROUTES.ADMIN_CUSTOMERS} replace />} />
          <Route path="/QuanLyUuDai.html" element={<Navigate to={ROUTES.ADMIN_OFFERS} replace />} />
          <Route path="/ThongBaoHoTro.html" element={<Navigate to={ROUTES.ADMIN_SUPPORT} replace />} />
          <Route path="/QuanLyGiaoDien.html" element={<Navigate to={ROUTES.ADMIN_UI} replace />} />
        </Route>

        {/* 4. FALLBACK 404 CATCH-ALL */}
        <Route path="*" element={<Navigate to={ROUTES.ROOT} replace />} />
      </Routes>
    </Suspense>
  );
}
