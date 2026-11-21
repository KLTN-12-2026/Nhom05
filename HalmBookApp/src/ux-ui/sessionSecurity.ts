import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosRequestConfig, CanceledError } from 'axios';

export type SessionFailure = { reason: 'locked' | 'expired'; token: string; message: string };

/** Covers both shared API helpers and screens still using axios directly. */
export function installSessionSecurity(baseUrl: string, onInvalid: (failure: SessionFailure) => Promise<void>) {
  const blockedTokens = new Set<string>();
  let disposed = false;
  const requestToken = (config?: AxiosRequestConfig): string | null => {
    if (!config) return null;
    try {
      const base = new URL(baseUrl);
      const url = new URL(config.url || '', config.baseURL || baseUrl + '/');
      if (url.origin !== base.origin || !url.pathname.startsWith('/api/')) return null;
      if (/^\/api\/(password(?:\/|$)|auth\/(login|register|google|facebook|logout)(?:\/|$))/.test(url.pathname)) return null;
      const headers = config.headers;
      const authorization = typeof headers?.get === 'function' ? headers.get('Authorization') : headers?.Authorization || headers?.authorization;
      return typeof authorization === 'string' && authorization.startsWith('Bearer ') ? authorization.slice(7) : null;
    } catch { return null; }
  };
  const interceptor = axios.interceptors.response.use(async response => {
    const token = requestToken(response.config);
    if (token && (blockedTokens.has(token) || token !== await AsyncStorage.getItem('userToken'))) {
      throw new CanceledError('Phản hồi của phiên đăng nhập cũ đã bị hủy.');
    }
    return response;
  }, async error => {
    const token = requestToken(error.config);
    const status = error.response?.status;
    const locked = status === 423 || error.response?.data?.error === 'ACCOUNT_LOCKED';
    if (!disposed && token && (locked || status === 401) && !blockedTokens.has(token)
        && token === await AsyncStorage.getItem('userToken')) {
      // Check again after the asynchronous storage read: concurrent failures notify only once.
      if (!disposed && !blockedTokens.has(token)) {
        blockedTokens.add(token);
        await onInvalid({ token, reason: locked ? 'locked' : 'expired', message: locked
          ? 'Tài khoản của bạn đã bị quản trị viên khóa. Vui lòng liên hệ hỗ trợ.'
          : 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' });
      }
    }
    return Promise.reject(error);
  });
  return () => { disposed = true; axios.interceptors.response.eject(interceptor); };
}
