import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

// Đảm bảo đóng phiên trình duyệt OAuth mượt mà khi redirect trở lại ứng dụng
WebBrowser.maybeCompleteAuthSession();

// ==============================================================
// CẤU HÌNH ENDPOINT BACKEND SPRING BOOT & OAUTH CLIENT IDS
// ==============================================================
const debuggerHost = Constants.expoConfig?.hostUri;
const localhost = debuggerHost ? debuggerHost.split(':')[0] : 'localhost';
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || `http://${localhost}:8082`;

export const CANDIDATE_AUTH_URLS = [
  API_BASE_URL,
  `http://${localhost}:8082`,
  'http://localhost:8082',
  'http://127.0.0.1:8082',
  'http://192.168.1.165:8082',
  'http://10.0.2.2:8082',
];

export const AUTH_ENDPOINTS = {
  LOGIN: '/api/auth/login',
  REGISTER: '/api/auth/register',
  GOOGLE: '/api/auth/google',
  FACEBOOK: '/api/auth/facebook',
  ME: '/api/auth/me',
};

// OAuth Client IDs đồng bộ với cấu hình dự án HALM BOOK (.env)
export const GOOGLE_OAUTH_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ||
  '994619857768-6ipg7lvdn9voai235f4e7gdtheuclds4.apps.googleusercontent.com';

export const FACEBOOK_OAUTH_APP_ID =
  process.env.EXPO_PUBLIC_FACEBOOK_APP_ID || '1559212956245733';

// Scope chuẩn cho Google & Facebook OAuth
export const GOOGLE_OAUTH_SCOPES = ['openid', 'profile', 'email'];
export const FACEBOOK_OAUTH_SCOPES = ['public_profile', 'email'];

export interface AuthUserSession {
  accessToken: string;
  refreshToken: string;
  role: string;
  user: {
    id: number | string;
    customerId?: string;
    username: string;
    email: string;
    fullName: string;
    role: string;
    khoai: number;
    avatar?: string;
  };
}

export interface SocialAuthFlowResult {
  cancelled?: boolean;
  session?: AuthUserSession;
}

/**
 * Bộ điều hợp AuthSession tương thích chuẩn Expo Go (không cần cài thêm package ngoài)
 */
export const AuthSession = {
  makeRedirectUri: (options?: {
    useProxy?: boolean;
    scheme?: string;
    path?: string;
  }): string => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      return window.location.origin;
    }

    const useProxy = options?.useProxy ?? true;
    const owner = Constants.expoConfig?.owner || 'anonymous';
    const slug = Constants.expoConfig?.slug || 'HALMBOOK';

    if (useProxy) {
      return `https://auth.expo.io/@${owner}/${slug}`;
    }

    const scheme = options?.scheme || Constants.expoConfig?.scheme || 'halmbook';
    const path = options?.path || 'oauthredirect';
    return Linking.createURL(path, { scheme: Array.isArray(scheme) ? scheme[0] : scheme });
  },
};

/**
 * Khởi tạo và log Redirect URI chuẩn cho Expo Go ngay khi nạp module
 */
export const EXPO_PROXY_REDIRECT_URI = AuthSession.makeRedirectUri({ useProxy: true });
export const EXPO_NATIVE_REDIRECT_URI = Linking.createURL('oauthredirect');

export function logExpoAuthRedirectUri(): string {
  const redirectUri = AuthSession.makeRedirectUri({ useProxy: true });
  console.warn('EXPO_AUTH_REDIRECT_URI:', redirectUri);
  console.warn('EXPO_NATIVE_REDIRECT_URI:', EXPO_NATIVE_REDIRECT_URI);
  return redirectUri;
}

/**
 * Kích hoạt cờ phiên đăng nhập toàn cục cho App
 */
export const markSessionActive = (active: boolean) => {
  (globalThis as any).__HALM_SESSION_ACTIVE__ = active;
  if (
    Platform.OS === 'web' &&
    typeof window !== 'undefined' &&
    window.sessionStorage
  ) {
    if (active) {
      window.sessionStorage.setItem('halm_session_active', 'true');
    } else {
      window.sessionStorage.removeItem('halm_session_active');
    }
  }
};

/**
 * Gửi POST request tới Backend kèm cơ chế tự động dò URL khả dụng trong mạng LAN
 */
export async function postToAuthBackend<T = any>(
  endpointPath: string,
  payload: Record<string, any>
): Promise<T> {
  let lastError: any = null;

  for (const baseUrl of CANDIDATE_AUTH_URLS) {
    try {
      const response = await axios.post<T>(`${baseUrl}${endpointPath}`, payload, {
        timeout: 8000,
      });
      return response.data;
    } catch (err: any) {
      lastError = err;
      // Nếu máy chủ đã phản hồi HTTP status (400, 401, 500...), dừng dò URL và ném lỗi ngay
      if (err?.response?.status) {
        throw err;
      }
    }
  }

  throw lastError || new Error('Không thể kết nối tới máy chủ xác thực.');
}

/**
 * Chuẩn hóa và lưu trữ Token + Thông tin User vào AsyncStorage sau khi Backend xác thực thành công
 */
export async function saveMobileAuthSession(
  rawResponse: any,
  fallbackUsername?: string
): Promise<AuthUserSession> {
  const rawToken =
    rawResponse?.systemToken ||
    rawResponse?.accessToken ||
    rawResponse?.token ||
    '';

  const accessToken =
    typeof rawToken === 'string'
      ? rawToken.trim().replace(/^Bearer\s+/i, '')
      : '';

  if (!accessToken) {
    throw new Error('Phản hồi xác thực không chứa JWT Token hợp lệ.');
  }

  const refreshToken =
    typeof rawResponse?.refreshToken === 'string' && rawResponse.refreshToken.trim()
      ? rawResponse.refreshToken.trim()
      : accessToken;

  const account = rawResponse?.account || rawResponse?.user || {};
  const customer = rawResponse?.customer || {};
  const role = String(
    rawResponse?.role || account?.role || 'USER'
  ).replace(/^ROLE_/i, '');

  const username = String(
    account?.username ||
      fallbackUsername ||
      (customer?.email ? String(customer.email).split('@')[0] : 'Reader')
  );
  const email = String(customer?.email || account?.email || '');
  const fullName = String(
    customer?.customerName || account?.fullName || username
  );
  const khoai =
    typeof customer?.potatoBalance === 'number'
      ? customer.potatoBalance
      : typeof account?.khoai === 'number'
      ? account.khoai
      : 0;
  const avatar = String(
    customer?.avatar || customer?.avatarUrl || account?.avatar || ''
  );

  const session: AuthUserSession = {
    accessToken,
    refreshToken,
    role,
    user: {
      id: account?.account_id || customer?.customer_id || username,
      customerId: customer?.customer_id,
      username,
      email,
      fullName,
      role,
      khoai,
      avatar,
    },
  };

  await AsyncStorage.multiSet([
    ['userToken', accessToken],
    ['accessToken', accessToken],
    ['refreshToken', refreshToken],
    ['userRole', role],
    ['username', username],
    ['userProfile', JSON.stringify(session.user)],
  ]);

  markSessionActive(true);
  return session;
}

/**
 * Trích xuất tham số token (access_token hoặc id_token) từ URL callback của OAuth
 */
function extractOAuthParamFromUrl(url: string, paramName: string): string | null {
  if (!url) return null;
  const regex = new RegExp(`[#?&]${paramName}=([^&]+)`, 'i');
  const match = url.match(regex);
  return match && match[1] ? decodeURIComponent(match[1]) : null;
}

/**
 * Luồng 1: Đăng nhập Google OAuth
 * - Redirect URI: AuthSession.makeRedirectUri({ useProxy: true })
 * - Scope: ['openid', 'profile', 'email']
 * - Response Type: token id_token (hỗ trợ cả idToken và accessToken)
 * - Gửi POST /api/auth/google
 */
export async function loginWithGoogleOAuth(
  directToken?: string
): Promise<SocialAuthFlowResult> {
  const redirectUri = AuthSession.makeRedirectUri({ useProxy: true });
  console.warn('EXPO_AUTH_REDIRECT_URI:', redirectUri);

  let googleToken = directToken || null;
  let googleIdToken: string | null = null;

  if (!googleToken) {
    try {
      const state = Math.random().toString(36).substring(2, 12);
      const nonce = Math.random().toString(36).substring(2, 12);
      const scopeStr = GOOGLE_OAUTH_SCOPES.join(' ');
      const returnUrl =
        Platform.OS === 'web' ? redirectUri : EXPO_NATIVE_REDIRECT_URI;

      const authUrl =
        `https://accounts.google.com/o/oauth2/v2/auth` +
        `?client_id=${encodeURIComponent(GOOGLE_OAUTH_CLIENT_ID)}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&response_type=${encodeURIComponent('token id_token')}` +
        `&scope=${encodeURIComponent(scopeStr)}` +
        `&prompt=select_account` +
        `&nonce=${encodeURIComponent(nonce)}` +
        `&state=${encodeURIComponent(state)}`;

      const response = await WebBrowser.openAuthSessionAsync(authUrl, returnUrl);

      // Nếu người dùng hủy hoặc đóng cửa sổ -> reset loading mượt mà, không throw Exception
      if (response.type === 'cancel' || response.type === 'dismiss') {
        return { cancelled: true };
      }

      if (response.type !== 'success' || !response.url) {
        return { cancelled: true };
      }

      const oauthError = extractOAuthParamFromUrl(response.url, 'error');
      if (oauthError) {
        return { cancelled: true };
      }

      const accessToken = extractOAuthParamFromUrl(response.url, 'access_token');
      googleIdToken = extractOAuthParamFromUrl(response.url, 'id_token');
      googleToken = accessToken || googleIdToken;

      if (!googleToken) {
        return { cancelled: true };
      }
    } catch {
      return { cancelled: true };
    }
  }

  // Gửi Token về Backend: POST /api/auth/google
  const backendData = await postToAuthBackend(AUTH_ENDPOINTS.GOOGLE, {
    token: googleToken,
    idToken: googleIdToken || googleToken,
  });

  const session = await saveMobileAuthSession(backendData);
  return { session };
}

/**
 * Luồng 2: Đăng nhập Facebook OAuth
 * - Redirect URI: AuthSession.makeRedirectUri({ useProxy: true })
 * - Scope: ['public_profile', 'email']
 * - Response Type: response_type=token (lấy access_token)
 * - Gửi POST /api/auth/facebook
 */
export async function loginWithFacebookOAuth(
  directToken?: string
): Promise<SocialAuthFlowResult> {
  const redirectUri = AuthSession.makeRedirectUri({ useProxy: true });
  console.warn('EXPO_AUTH_REDIRECT_URI:', redirectUri);

  let facebookAccessToken = directToken || null;

  if (!facebookAccessToken) {
    try {
      const state = Math.random().toString(36).substring(2, 12);
      const scopeStr = FACEBOOK_OAUTH_SCOPES.join(',');
      const returnUrl =
        Platform.OS === 'web' ? redirectUri : EXPO_NATIVE_REDIRECT_URI;

      const authUrl =
        `https://www.facebook.com/v19.0/dialog/oauth` +
        `?client_id=${encodeURIComponent(FACEBOOK_OAUTH_APP_ID)}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&response_type=token` +
        `&scope=${encodeURIComponent(scopeStr)}` +
        `&state=${encodeURIComponent(state)}`;

      const response = await WebBrowser.openAuthSessionAsync(authUrl, returnUrl);

      // Nếu người dùng hủy hoặc đóng cửa sổ -> reset loading mượt mà, không throw Exception
      if (response.type === 'cancel' || response.type === 'dismiss') {
        return { cancelled: true };
      }

      if (response.type !== 'success' || !response.url) {
        return { cancelled: true };
      }

      const oauthError = extractOAuthParamFromUrl(response.url, 'error');
      if (oauthError) {
        return { cancelled: true };
      }

      facebookAccessToken = extractOAuthParamFromUrl(response.url, 'access_token');

      if (!facebookAccessToken) {
        return { cancelled: true };
      }
    } catch {
      return { cancelled: true };
    }
  }

  // Gửi accessToken về Backend: POST /api/auth/facebook
  const backendData = await postToAuthBackend(AUTH_ENDPOINTS.FACEBOOK, {
    token: facebookAccessToken,
    accessToken: facebookAccessToken,
  });

  const session = await saveMobileAuthSession(backendData);
  return { session };
}
