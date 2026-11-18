export const ROUTES = {
  // Public: không yêu cầu đăng nhập (Khách vãng lai và thành viên đều truy cập được)
  ROOT: '/',
  HOME: '/',
  LOGIN: '/dangnhap',
  FORGOT_PASSWORD: '/quenmatkhau',
  TIERS: '/hang',
  OFFERS: '/uudai',
  CATEGORY: '/danhmuc',
  CATEGORY_BY_TOPIC: '/danhmuc/:topic',
  BOOK_DETAIL: '/chitietsach',
  BOOK_DETAIL_BY_ID: '/chitietsach/:id',

  // User protected: bắt buộc đăng nhập (Khách vãng lai bị chuyển hướng sang màn Đăng Nhập)
  PROFILE: '/canhan',
  MY_BOOKSHELF: '/tusachcn',
  READ_BOOK: '/docsach',
  READ_BOOK_DETAIL: '/docsach/:id',
  CART: '/giohang',
  PAYMENT: '/thanhtoan',
  WALLET: '/vi-khoai',
  MISSIONS: '/nhiemvu',

  // Admin Protected: bắt buộc quyền Quản trị viên
  ADMIN: '/admin',
  ADMIN_LOGIN: '/admin/login',
  ADMIN_STATISTICS: '/admin/thong-ke',
  ADMIN_BOOKS: '/admin/quan-ly-sach',
  ADMIN_RENTAL_TRANSACTIONS: '/admin/giao-dich-thue-sach',
  ADMIN_FINANCE: '/admin/quan-ly-tai-chinh',
  ADMIN_CUSTOMERS: '/admin/quan-ly-khach-hang',
  ADMIN_OFFERS: '/admin/quan-ly-uu-dai',
  ADMIN_UI: '/admin/quan-ly-giao-dien',
  ADMIN_SUPPORT: '/admin/thong-bao-ho-tro',
};

export const ROUTE_ALIASES = {
  public: [
    { path: "/trangchu", to: "/" },
    { path: "/trang-chu", to: "/" },
    { path: "/uu-dai", to: "/uudai" },
    { path: "/offers", to: "/uudai" },
    { path: "/khuyen-mai", to: "/uudai" },
    { path: "/danh-muc", to: "/danhmuc" }
  ],
  user: [
    { path: "/profile", to: "/canhan" },
    { path: "/ca-nhan", to: "/canhan" },
    { path: "/thongtincanhan", to: "/canhan" },
    { path: ROUTES.WALLET, to: "/canhan?tab=wallet" },
    { path: "/wallet", to: "/canhan?tab=wallet" },
    { path: "/vi", to: "/canhan?tab=wallet" },
    { path: "/lich-su", to: "/canhan?tab=history" },
    { path: "/lichsu", to: "/canhan?tab=history" },
    { path: "/lichsugiaodich", to: "/canhan?tab=history" },
    { path: "/history", to: "/canhan?tab=history" },
    { path: "/hotro", to: "/canhan?tab=support" },
    { path: "/ho-tro", to: "/canhan?tab=support" },
    { path: "/support", to: "/canhan?tab=support" },
    { path: "/khieunai", to: "/canhan?tab=support" },
    { path: "/khieu-nai", to: "/canhan?tab=support" }
  ],
  admin: [
    { path: "/TongQuan.html", to: ROUTES.ADMIN },
    { path: "/BaoCao&ThongKe.html", to: ROUTES.ADMIN_STATISTICS },
    { path: "/BaoCaoThongKe.html", to: ROUTES.ADMIN_STATISTICS },
    { path: "/QuanLySach.html", to: ROUTES.ADMIN_BOOKS },
    { path: "/GiaoDichThueSach.html", to: ROUTES.ADMIN_RENTAL_TRANSACTIONS },
    { path: "/QuanLyTaiChinh.html", to: ROUTES.ADMIN_FINANCE },
    { path: "/QuanLyKhachHang.html", to: ROUTES.ADMIN_CUSTOMERS },
    { path: "/QuanLyUuDai.html", to: ROUTES.ADMIN_OFFERS },
    { path: "/ThongBaoHoTro.html", to: ROUTES.ADMIN_SUPPORT },
    { path: "/QuanLyGiaoDien.html", to: ROUTES.ADMIN_UI }
  ]
};
