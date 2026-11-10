import Constants from 'expo-constants';
import { Platform } from 'react-native';
import axios, { AxiosRequestConfig } from 'axios';

// ============================================================================
// [GIẢI THÍCH CODE]: DỊCH VỤ QUẢN LÝ KẾT NỐI API TRUNG TÂM (CENTRALIZED API SERVICE)
// - Tự động nhận diện môi trường: EXPO_PUBLIC_API_URL -> Expo Debugger Host ->
//   Android Emulator (10.0.2.2) -> Web/iOS Localhost (localhost:8082)
// - Cung cấp hàm fetchApiWithFallback với cơ chế Fast-Path: Ưu tiên gọi API_BASE_URL
//   với timeout tối ưu (3.5s) trước, chỉ khi lỗi mạng mới thử các IP dự phòng
// - Giúp ứng dụng phản hồi ngay lập tức, không bị treo 20-30s như khi lặp tuần tự
// ============================================================================

export const resolveApiBaseUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/+$/, '');
  }
  const debuggerHost = Constants.expoConfig?.hostUri;
  const host = debuggerHost
    ? debuggerHost.split(':')[0]
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
    'http://localhost:8082',
    'http://127.0.0.1:8082',
    'http://10.0.2.2:8082',
    'http://192.168.1.165:8082',
  ])
);

/**
 * Gọi API với cơ chế Fast-Path thông minh:
 * Thử API_BASE_URL trước với timeout nhẹ, nếu lỗi thì thử lần lượt các candidate URLs
 */
export async function fetchApiWithFallback<T = any>(
  endpoint: string,
  config: AxiosRequestConfig = {}
): Promise<{ data: T; baseUrl: string }> {
  // Fast path: Thử API_BASE_URL chính xác trước
  try {
    const res = await axios({
      ...config,
      url: `${API_BASE_URL}${endpoint}`,
      timeout: config.timeout || 3500,
    });
    return { data: res.data, baseUrl: API_BASE_URL };
  } catch (err: any) {
    if (axios.isCancel(err) || err?.name === 'CanceledError') {
      throw err;
    }
    // Nếu là lỗi server trả về (4xx, 5xx) thì trả về luôn không cần thử IP khác
    if (err.response) {
      throw err;
    }
  }

  // Fallback path: Thử các URLs còn lại
  let lastError: any = null;
  const otherUrls = CANDIDATE_API_URLS.filter((u) => u !== API_BASE_URL);
  for (const url of otherUrls) {
    try {
      const res = await axios({
        ...config,
        url: `${url}${endpoint}`,
        timeout: config.timeout || 3000,
      });
      return { data: res.data, baseUrl: url };
    } catch (err: any) {
      lastError = err;
      if (axios.isCancel(err) || err?.name === 'CanceledError' || err.response) {
        throw err;
      }
    }
  }

  throw lastError || new Error('Không thể kết nối đến máy chủ HALM BOOK.');
}

