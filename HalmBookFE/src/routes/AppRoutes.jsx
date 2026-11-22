import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '@/components/guards/ProtectedRoute';
import { ROUTES, ROUTE_ALIASES } from '@/constants/routes';
import { prefetchUserRoutes } from '@/utils/routePrefetch';

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
const QLHangVaGia = lazy(() => import('@/components/admin/QLHangVaGia'));
const QLNhiemVu = lazy(() => import('@/components/admin/QLNhiemVu'));
const HoTroThongBao = lazy(() => import('@/components/admin/HoTroThongBao'));

const PageLoader = () => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 bg-transparent">
    <div className="w-9 h-9 border-3 border-amber-800 dark:border-amber-400 border-t-transparent dark:border-t-transparent rounded-full animate-spin"></div>
    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 animate-pulse">Đang tải trang...</span>
  </div>
);

export default function AppRoutes() {
  useEffect(() => {
    prefetchUserRoutes();
  }, []);

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* 1. KHU VỰC CÔNG KHAI: Khách vãng lai và Thành viên đều xem được */}
        <Route path={ROUTES.ROOT} element={<TrangChu />} />
        {ROUTE_ALIASES.public.map(({ path, to }) => <Route key={path} path={path} element={<Navigate to={to} replace />} />)}
        
        <Route path={ROUTES.LOGIN} element={<DangNhap />} />
        <Route path="/login" element={<DangNhap />} />
        <Route path={ROUTES.ADMIN_LOGIN || "/admin/login"} element={<DangNhap />} />
        <Route path={ROUTES.FORGOT_PASSWORD} element={<QuenMatKhau />} />
        <Route path={ROUTES.TIERS} element={<HangTv />} />
        <Route path={ROUTES.OFFERS} element={<UuDai />} />
        
        
        
        <Route path={ROUTES.CATEGORY} element={<DanhMucSach />} />
        <Route path={ROUTES.CATEGORY_BY_TOPIC} element={<DanhMucSach />} />
        
        <Route path="/danh-muc/:topic" element={<DanhMucSach />} />
        <Route path={ROUTES.BOOK_DETAIL} element={<ChiTietSach />} />
        <Route path={ROUTES.BOOK_DETAIL_BY_ID} element={<ChiTietSach />} />
        {/* Mở chức năng Đọc Thử cho cả Khách vãng lai và Thành viên (giới hạn trang trong DocSach) */}
        <Route path={ROUTES.READ_BOOK} element={<DocSach />} />
        <Route path={ROUTES.READ_BOOK_DETAIL} element={<DocSach />} />

        {/* 2. KHU VỰC USER: Bắt buộc đăng nhập (Token còn hạn) */}
        <Route element={<ProtectedRoute />}>
          <Route path={ROUTES.PROFILE} element={<CaNhan />} />
          {ROUTE_ALIASES.user.map(({ path, to }) => <Route key={path} path={path} element={<Navigate to={to} replace />} />)}
          
          
          <Route path={ROUTES.MY_BOOKSHELF} element={<TuSachCn />} />
          <Route path={ROUTES.CART} element={<GioHang />} />
          <Route path={ROUTES.PAYMENT} element={<ThanhToan />} />
          
          
          
          
          
          
          
          
          <Route path={ROUTES.MISSIONS} element={<NhiemVu />} />
          
          
          
          
          
          
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
          <Route path={ROUTES.ADMIN_MEMBERSHIP} element={<QLHangVaGia />} />
          <Route path={ROUTES.ADMIN_MEMBERSHIP_PRICING} element={<QLHangVaGia />} />
          <Route path={ROUTES.ADMIN_MISSIONS} element={<QLNhiemVu />} />
          <Route path={ROUTES.ADMIN_SUPPORT} element={<HoTroThongBao />} />

          {/* Đường dẫn alias/legacy từ các file HTML của Admin - tránh rơi vào 404 về User */}
          {ROUTE_ALIASES.admin.map(({ path, to }) => <Route key={path} path={path} element={<Navigate to={to} replace />} />)}
          
          
          
          
          
          
          
          
          
        </Route>

        {/* 4. FALLBACK 404 CATCH-ALL */}
        <Route path="*" element={<Navigate to={ROUTES.ROOT} replace />} />
      </Routes>
    </Suspense>
  );
}
