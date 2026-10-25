import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './component/admin/AdminLayout';

import BaoCaoThongKe from './component/admin/BaoCaoThongKe';
import QuanLySach from './component/admin/QLSach';
import QuanLyTaiChinh from './component/admin/QLTaiChinh';
import QuanLyKhachHang from './component/admin/QLKhachHang';
import QuanLyUuDai from './component/admin/QLUuDaiVsGoi';
import QuanLyGiaoDien from './component/admin/QLGiaoDien';
import ThongBaoHoTro from './component/admin/HoTroThongBao';
import TrangChu from './component/user/TrangChu';
import DangNhap from './component/user/DangNhap';
import ForgotPassword from './component/user/QuenMatKhau';
import Profile from './component/user/CaNhan';
import ProtectedRoute from './component/ProtectedRoute';
import Hang from './component/user/HangTv';
import TSCN from './component/user/TuSachCn';
import LSGiaoDich from './component/user/LSGiaoDich';
import UuDai from './component/user/UuDai';
import UpLoad from './component/user/UpLoadFile';
import ThanhToan from './component/user/thanhtoan';
import ChiTietSach from './component/user/ChiTietSach';
import DocSach from './component/user/DocSach';
import GioHang from './component/user/GioHang';
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 1. KHU VỰC CÔNG KHAI (Ai cũng vào được) */}
        <Route path="/" element={<DangNhap />} />
        <Route path="/dangnhap" element={<DangNhap />} />
        <Route path="/quenmatkhau" element={<ForgotPassword />} />
        <Route path="/hang" element={<Hang />} />
        <Route path="/tusachcn" element={<TSCN />} />
        <Route path="/docsach" element={<DocSach />} />
        <Route path="/giohang" element={<GioHang />} />
        
        {/* <Route path="/lsgiaodich" element={<LSGiaoDich />} /> */}
        {/* <Route path="/uudai" element={<UuDai />} /> */}
        {/* <Route path="/upload" element={<UpLoad />} /> */}
        <Route path="/thanhtoan" element={<ThanhToan/>}/>
        <Route path="/chitietsach" element={<ChiTietSach />} />
        <Route path="/chitietsach/:id" element={<ChiTietSach />} />



        {/* 2. KHU VỰC NGƯỜI DÙNG CƠ BẢN (Bắt buộc phải có Token) */}
        <Route element={<ProtectedRoute />}>
          <Route path="/trangchu" element={<TrangChu />} />
          <Route path="/canhan" element={<Profile />} />
          <Route path="/chitietsach" element={<ChiTietSach />} />
          <Route path="/chitietsach/:id" element={<ChiTietSach />} />
        </Route>

        {/* 3. KHU VỰC ADMIN (Bắt buộc phải có Token VÀ có quyền ADMIN) */}
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

      </Routes>
    </BrowserRouter>
  );
}

export default App;