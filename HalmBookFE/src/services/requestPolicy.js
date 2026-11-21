import { apiPath } from '../config/api.js';

const PUBLIC_AUTH_PATHS = /^\/api\/(?:auth\/(?:login|register|google|facebook)(?:\/|$)|password(?:\/|$))/;

/** Request ownership follows the endpoint, independent of the currently open page. */
export function resolveAuthScope(config) {
  const path = apiPath(config.url);
  if (!path?.startsWith('/api/') || PUBLIC_AUTH_PATHS.test(path)) return 'none';
  if (['user', 'admin', 'none'].includes(config.authScope)) return config.authScope;
  const method = (config.method || 'get').toUpperCase();
  const packageAdmin = /^\/api\/home\/potato\/packages\/(?:all|admin)(?:\/|$)/.test(path)
    || (/^\/api\/home\/potato\/packages(?:\/|$)/.test(path) && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method));
  if (packageAdmin) return 'admin';
  return /^\/api\/(?:admin|promotions)(?:\/|$)/.test(path) ? 'admin' : 'user';
}

export function getApiErrorMessage(error, fallback = 'Không thể kết nối máy chủ. Vui lòng thử lại.') {
  return error?.response?.data?.message || error?.message || fallback;
}
