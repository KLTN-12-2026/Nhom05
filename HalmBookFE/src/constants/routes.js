export const ROUTES = {
  // Public: không yêu cầu đăng nhập
  ROOT: '/',
  LOGIN: '/dangnhap',
  FORGOT_PASSWORD: '/quenmatkhau',
  TIERS: '/hang',
  OFFERS: '/uudai',
  BOOK_DETAIL: '/chitietsach',
  BOOK_DETAIL_BY_ID: '/chitietsach/:id',

  // User protected: bắt buộc đăng nhập
  HOME: '/trangchu',
  PROFILE: '/canhan',
  MY_BOOKSHELF: '/tusachcn',
  READ_BOOK: '/docsach',
  READ_BOOK_DETAIL: '/docsach/:id',
  CART: '/giohang',
  PAYMENT: '/thanhtoan',

  // Admin Protected
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
