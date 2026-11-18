import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * ============================================================================
 * HALM BOOK MOBILE - Centralized API Configuration (IMP-06)
 * ============================================================================
 * Thứ tự ưu tiên giải quyết API Base URL:
 * 1. Biến môi trường EXPO_PUBLIC_API_URL (nếu cấu hình trong .env)
 * 2. IP của máy tính phát triển chạy Expo dev server (Constants.expoConfig.hostUri)
 * 3. Fallback theo nền tảng:
 *    - Android Emulator: http://10.0.2.2:8082
 *    - iOS Simulator / Web: http://localhost:8082
 */
const resolveApiBaseUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_URL && process.env.EXPO_PUBLIC_API_URL.trim().length > 0) {
    return process.env.EXPO_PUBLIC_API_URL.trim().replace(/\/+$/, '');
  }

  const debuggerHost = Constants.expoConfig?.hostUri;
  if (debuggerHost) {
    const host = debuggerHost.split(':')[0];
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return `http://${host}:8082`;
    }
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8082';
  }

  return 'http://localhost:8082';
};

export const API_BASE_URL = resolveApiBaseUrl();

export const CANDIDATE_API_URLS = [
  API_BASE_URL,
  'http://localhost:8082',
  'http://10.0.2.2:8082',
  'http://127.0.0.1:8082',
];

export default API_BASE_URL;
