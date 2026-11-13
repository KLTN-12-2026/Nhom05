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
  ADMIN_STATISTICS: '/admin/thong-ke',
  ADMIN_BOOKS: '/admin/quan-ly-sach',
  ADMIN_RENTAL_TRANSACTIONS: '/admin/giao-dich-thue-sach',
  ADMIN_FINANCE: '/admin/quan-ly-tai-chinh',
  ADMIN_CUSTOMERS: '/admin/quan-ly-khach-hang',
  ADMIN_OFFERS: '/admin/quan-ly-uu-dai',
  ADMIN_UI: '/admin/quan-ly-giao-dien',
  ADMIN_SUPPORT: '/admin/thong-bao-ho-tro',
};
