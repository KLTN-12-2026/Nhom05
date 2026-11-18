const configuredBase = import.meta.env?.VITE_API_BASE_URL
  || (typeof window !== 'undefined' && window.__HALM_API_BASE_URL__)
  || 'http://localhost:8082';

export const API_BASE_URL = configuredBase.replace(/\/+$/, '');

export function apiUrl(path) {
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE_URL}/${String(path).replace(/^\/+/, '')}`;
}

export function apiPath(url = '') {
  try {
    const base = new URL(API_BASE_URL || '/', globalThis.location?.origin || 'http://localhost');
    const target = new URL(url, base);
    return target.origin === base.origin ? target.pathname : null;
  } catch { return null; }
}
