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

// Never probe arbitrary LAN hosts with account credentials or retry a mutation on another server.
export const CANDIDATE_API_URLS: string[] = [API_BASE_URL];

export const normalizeAssetUrl = (value: string, baseUrl = API_BASE_URL): string => {
  if (!value) return '';
  if (/^(file:|content:|blob:|data:)/i.test(value)) return value;
  const url = new URL(value, baseUrl + '/');
  if (['localhost', '127.0.0.1', '10.0.2.2'].includes(url.hostname)) {
    return baseUrl + url.pathname + url.search + url.hash;
  }
  return url.href;
};

export async function fetchApiWithFallback<T = any>(
  endpoint: string,
  config: AxiosRequestConfig = {}
): Promise<{ data: T; baseUrl: string }> {
  const response = await axios({ ...config, url: API_BASE_URL + endpoint, timeout: config.timeout ?? 10000 });
  return { data: response.data, baseUrl: API_BASE_URL };
}
