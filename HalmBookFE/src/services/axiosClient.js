import axios from 'axios';
import { API_BASE_URL, normalizeAssetLinks } from '../config/api.js';
import { getAuthToken, getValidAuthToken, getAdminAuthToken, isTokenExpired, clearAuthSession, clearAdminAuthSession } from './authToken.js';
import { resolveAuthScope } from './requestPolicy.js';

const axiosClient = axios.create({ baseURL: API_BASE_URL, timeout: 30000 });

axiosClient.interceptors.request.use(config => {
  const scope = resolveAuthScope(config);
  const rawToken = scope === 'admin' ? getAdminAuthToken() : scope === 'user' ? getAuthToken() : null;
  const token = scope === 'admin' ? (rawToken && !isTokenExpired(rawToken) ? rawToken : null)
    : scope === 'user' ? getValidAuthToken() : null;
  config.sessionScope = scope;
  config.hadSession = Boolean(rawToken);
  if (token) config.headers.Authorization = 'Bearer ' + token;
  else delete config.headers.Authorization;
  return config;
});

axiosClient.interceptors.response.use(response => {
  response.data = normalizeAssetLinks(response.data);
  return response;
}, error => {
  if (typeof window !== 'undefined') {
    const { sessionScope: scope, hadSession } = error.config || {};
    const { status, data } = error.response || {};
    if (scope === 'user' && (status === 423 || data?.error === 'ACCOUNT_LOCKED')) {
      window.dispatchEvent(new CustomEvent('halm:account_locked', {
        detail: { message: data?.message || 'Tài khoản của bạn đã bị khóa bởi Quản trị viên!' },
      }));
    }
    if (status === 401 && hadSession) {
      if (scope === 'admin' && getAdminAuthToken()) {
        clearAdminAuthSession();
        if (window.location.pathname.startsWith('/admin') && window.location.pathname !== '/admin/login') {
          window.location.assign('/admin/login?reason=session_expired');
        }
      } else if (scope === 'user' && getAuthToken()) {
        clearAuthSession();
        window.dispatchEvent(new CustomEvent('halm-open-auth-modal', {
          detail: { mode: 'login', message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!' },
        }));
      }
    }
  }
  return Promise.reject(error);
});

export default axiosClient;
