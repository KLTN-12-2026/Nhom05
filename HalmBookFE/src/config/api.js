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

// Rebase server-local assets onto the configured backend, including older localhost URLs.
export function normalizeAssetUrl(value) {
  if (typeof value !== 'string') return value;
  if (/^\/?uploads\//.test(value)) return apiUrl(value);
  try {
    const url = new URL(value);
    if (['localhost', '127.0.0.1', '10.0.2.2'].includes(url.hostname) && url.pathname.startsWith('/uploads/')) {
      return apiUrl(url.pathname + url.search + url.hash);
    }
  } catch { /* Non-URL metadata stays unchanged. */ }
  return value;
}

const assetFields = new Set(['img_url', 'imgUrl', 'pdf_url', 'imageUrl', 'image_url', 'coverUrl', 'coverImage',
  'cover_image', 'userAvatar', 'avatar', 'avatarUrl', 'avatar_url', 'readUrl', 'url', 'secureUrl']);
export function normalizeAssetLinks(data) {
  if (Array.isArray(data)) data.forEach(normalizeAssetLinks);
  else if (data && Object.getPrototypeOf(data) === Object.prototype) {
    for (const key of Object.keys(data)) {
      if (assetFields.has(key)) data[key] = normalizeAssetUrl(data[key]);
      if (data[key] && typeof data[key] === 'object') normalizeAssetLinks(data[key]);
    }
  }
  return data;
}
