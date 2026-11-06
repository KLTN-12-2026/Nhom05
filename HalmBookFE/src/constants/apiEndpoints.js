export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8082';

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    GOOGLE: '/api/auth/google',
    FACEBOOK: '/api/auth/facebook',
    ME: '/api/auth/me',
  },
  PASSWORD: {
    SEND_OTP: '/api/password/send-otp',
    VERIFY_OTP: '/api/password/verify-otp',
    RESET_PASSWORD: '/api/password/reset-password',
  },
  CUSTOMER: {
    INFO: '/api/home/customer/info',
    EDIT: '/api/home/customer/edit',
    CHANGE_PASSWORD: '/api/home/customer/change-password',
  },
  BOOK: {
    LIST: '/api/home/books',
    BASIC_LIST: '/api/home/books/basic',
    DETAIL: (id) => `/api/home/books/${id}`,
    BASIC_DETAIL: (id) => `/api/home/books/${id}/basic`,
    READ_URL: (id) => `/api/home/books/${id}/read-url`,
    BOOKMARKS: (id) => `/api/home/books/${id}/bookmarks`,
    DELETE_BOOKMARK: (noteId) => `/api/home/books/bookmarks/${noteId}`,
  },
  CART: {
    ADD: '/api/home/cart/add',
  },
  CHECKOUT: {
    PROCESS: '/api/home/checkout',
  },
  BOOKSHELF: {
    LIST: '/api/home/bookshelf',
    CHECK_ACCESS: (bookId) => `/api/home/bookshelf/check/${bookId}`,
  },
  POTATO: {
    WALLET: '/api/home/potato/wallet',
    PACKAGES: '/api/home/potato/packages',
    TRANSACTIONS: '/api/home/potato/transactions',
    TOPUP: '/api/home/potato/topup',
    TRANSFER: '/api/home/potato/transfer',
  },
  MEMBERSHIP: {
    TIERS: '/api/home/membership/tiers',
    MY_TIER: '/api/home/membership/my-tier',
    CHECKIN_STREAK: '/api/home/membership/checkin-streak',
  },
};
