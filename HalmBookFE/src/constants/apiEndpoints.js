export const API_BASE_URL = 'http://localhost:8082';

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
  },
  BOOK: {
    LIST: '/api/home/books',
    BASIC_LIST: '/api/home/books/basic',
    DETAIL: (id) => `/api/home/books/${id}`,
    BASIC_DETAIL: (id) => `/api/home/books/${id}/basic`,
    READ_URL: (id) => `/api/home/books/${id}/read-url`,
  },
  CART: {
    ADD: '/api/home/cart/add',
  },
};
