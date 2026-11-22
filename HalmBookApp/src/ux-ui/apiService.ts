import Constants from 'expo-constants';
import { Platform } from 'react-native';
import axios, { AxiosRequestConfig } from 'axios';

// Use the configured server or the Expo development host.
export const resolveApiBaseUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_URL?.trim()) {
    return process.env.EXPO_PUBLIC_API_URL.trim().replace(/\/+$/, '');
  }
  const debuggerHost = Constants.expoConfig?.hostUri;
  const host = debuggerHost
    ? (Platform.OS === 'android' && /^(localhost|127\.0\.0\.1)(:|$)/.test(debuggerHost) ? '10.0.2.2' : debuggerHost.split(':')[0])
    : Platform.OS === 'android'
      ? '10.0.2.2'
      : 'localhost';
  return `http://${host}:8082`;
};

export const API_BASE_URL = resolveApiBaseUrl();

export const CANDIDATE_API_URLS: string[] = Array.from(
  new Set([
    API_BASE_URL,
    ...(process.env.EXPO_PUBLIC_API_URL ? [process.env.EXPO_PUBLIC_API_URL.replace(/\/+$/, '')] : []),
    'http://172.26.41.174:8082',
    'http://192.168.1.7:8082',
    'http://192.168.1.126:8082',
    'http://192.168.1.165:8082',
    'http://localhost:8082',
    'http://127.0.0.1:8082',
    'http://10.0.2.2:8082',
  ])
);

export const normalizeAssetUrl = (value: string, baseUrl = API_BASE_URL): string => {
  if (!value) return '';
  if (/^(file:|content:|blob:|data:)/i.test(value)) return value;
  const url = new URL(value, baseUrl + '/');
  if (['localhost', '127.0.0.1', '10.0.2.2'].includes(url.hostname)) {
    return baseUrl + url.pathname + url.search + url.hash;
  }
  return url.href;
};

/**
 * Gọi API với cơ chế Fast-Path thông minh:
 * Thử API_BASE_URL trước với timeout nhẹ, nếu lỗi thì thử lần lượt các candidate URLs
 */
export async function fetchApiWithFallback<T = any>(
  endpoint: string,
  config: AxiosRequestConfig = {}
): Promise<{ data: T; baseUrl: string }> {
  const method = (config.method ?? 'GET').toUpperCase();
  const isMutation = method !== 'GET' && method !== 'HEAD';
  const urlsToTry = isMutation ? [API_BASE_URL] : CANDIDATE_API_URLS;

  let lastError: any = null;
  for (const baseUrl of urlsToTry) {
    try {
      const response = await axios({
        ...config,
        url: baseUrl + endpoint,
        timeout: config.timeout ?? 6000,
      });
      return { data: response.data, baseUrl };
    } catch (err: any) {
      lastError = err;
      const status = err?.response?.status;
      if (status === 401 || status === 403 || status === 400 || isMutation) {
        throw err;
      }
    }
  }
  throw lastError ?? new Error(`Không thể kết nối đến máy chủ tại endpoint ${endpoint}`);
}
