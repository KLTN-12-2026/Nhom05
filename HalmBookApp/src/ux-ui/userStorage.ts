import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================================================
// [GIẢI THÍCH CODE]: Quản lý phân vùng dữ liệu cá nhân (Bookshelf, Lịch sử, Yêu thích)
// theo từng tài khoản người dùng, tránh rò rỉ dữ liệu giữa tài khoản cũ và tài khoản mới.
// ============================================================================

export const USERNAME_STORAGE_KEY = 'currentUsername';

// Các tiền tố khóa cơ bản
export const KEY_READING_BOOKS = '@halm_reading_books_list_v1';
export const KEY_UPLOADED_BOOKS = '@halm_uploaded_books_v1';
export const KEY_FAVORITES_BOOKS = '@halm_favorites_books_v1';
export const KEY_CURRENT_READING = '@halm_current_reading_book';
export const KEY_FREE_UPLOADS = '@halm_used_free_uploads';
export const KEY_GIFTED_BOOKS = '@halm_gifted_books_v1';
export const KEY_USER_TIER = '@halm_user_tier';
export const KEY_POTATO_BALANCE = '@halm_potato_balance';

// B64 decode an toàn trên mọi thiết bị (Android, iOS, Web)
const B64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
function simpleBase64Decode(input: string): string {
  const str = input.replace(/=+$/, '');
  let output = '';
  if (str.length % 4 === 1) return '';
  for (let bc = 0, bs = 0, buffer = 0, idx = 0; (buffer = str.charCodeAt(idx++)); ) {
    const charIndex = B64_CHARS.indexOf(String.fromCharCode(buffer));
    if (~charIndex) {
      bs = bc % 4 ? bs * 64 + charIndex : charIndex;
      if (bc++ % 4) {
        output += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6)));
      }
    }
  }
  return output;
}

/**
 * [GIẢI THÍCH CODE]: Trích xuất username từ JWT token
 */
export const extractUsernameFromToken = (token?: string | null): string | null => {
  if (!token || typeof token !== 'string') return null;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    let decoded = '';
    if (typeof atob === 'function') {
      decoded = atob(base64);
    } else {
      decoded = simpleBase64Decode(base64);
    }
    const parsed = JSON.parse(decoded);
    return parsed.sub ? String(parsed.sub).trim().toLowerCase() : null;
  } catch {
    return null;
  }
};

/**
 * [GIẢI THÍCH CODE]: Lấy username hiện tại đang đăng nhập. Nếu chưa đăng nhập trả về 'guest'
 */
export const getCurrentUsername = async (): Promise<string> => {
  try {
    const directUser = await AsyncStorage.getItem(USERNAME_STORAGE_KEY);
    if (directUser && directUser.trim()) {
      return directUser.trim().toLowerCase();
    }
    const token = await AsyncStorage.getItem('userToken');
    const tokenSub = extractUsernameFromToken(token);
    if (tokenSub) {
      await AsyncStorage.setItem(USERNAME_STORAGE_KEY, tokenSub);
      return tokenSub;
    }
  } catch {
    // fallback
  }
  return 'guest';
};

/**
 * [GIẢI THÍCH CODE]: Cập nhật username đang đăng nhập
 */
export const setCurrentUsername = async (username: string): Promise<void> => {
  if (!username) {
    await AsyncStorage.removeItem(USERNAME_STORAGE_KEY);
    return;
  }
  await AsyncStorage.setItem(USERNAME_STORAGE_KEY, username.trim().toLowerCase());
};

/**
 * [GIẢI THÍCH CODE]: Tạo khóa AsyncStorage được phân vùng riêng theo từng tài khoản
 * Ví dụ: @halm_uploaded_books_v1_nguyenvana
 */
export const getUserStorageKey = async (baseKey: string): Promise<string> => {
  const username = await getCurrentUsername();
  return `${baseKey}_${username}`;
};

export const getUserItem = async (baseKey: string): Promise<string | null> => {
  const key = await getUserStorageKey(baseKey);
  return AsyncStorage.getItem(key);
};

export const setUserItem = async (baseKey: string, value: string): Promise<void> => {
  const key = await getUserStorageKey(baseKey);
  return AsyncStorage.setItem(key, value);
};

export const removeUserItem = async (baseKey: string): Promise<void> => {
  const key = await getUserStorageKey(baseKey);
  return AsyncStorage.removeItem(key);
};

/**
 * [GIẢI THÍCH CODE]: Dọn dẹp các khóa dùng chung cũ (legacy) để tránh rò rỉ dữ liệu
 */
export const clearLegacyBookshelfKeys = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([
      KEY_READING_BOOKS,
      KEY_UPLOADED_BOOKS,
      KEY_FAVORITES_BOOKS,
      KEY_CURRENT_READING,
      KEY_FREE_UPLOADS,
      KEY_GIFTED_BOOKS,
      KEY_USER_TIER,
      KEY_POTATO_BALANCE,
      '@halm_uploaded_books',
      '@halm_reading_history_v1',
    ]);
  } catch {}
};

/**
 * [GIẢI THÍCH CODE]: Đảm bảo tài khoản mới tạo hoặc tài khoản đăng xuất có dữ liệu hoàn toàn sạch
 */
export const clearUserDataForAccount = async (username: string): Promise<void> => {
  if (!username) return;
  const lower = username.trim().toLowerCase();
  try {
    await AsyncStorage.multiRemove([
      `${KEY_READING_BOOKS}_${lower}`,
      `${KEY_UPLOADED_BOOKS}_${lower}`,
      `${KEY_FAVORITES_BOOKS}_${lower}`,
      `${KEY_CURRENT_READING}_${lower}`,
      `${KEY_FREE_UPLOADS}_${lower}`,
      `${KEY_GIFTED_BOOKS}_${lower}`,
      `${KEY_USER_TIER}_${lower}`,
      `${KEY_POTATO_BALANCE}_${lower}`,
      `${KEY_READING_BOOKS}_guest`,
      `${KEY_UPLOADED_BOOKS}_guest`,
      `${KEY_FAVORITES_BOOKS}_guest`,
      `${KEY_CURRENT_READING}_guest`,
      `${KEY_GIFTED_BOOKS}_guest`,
    ]);
    await clearLegacyBookshelfKeys();
  } catch {}
};

// ============================================================================
// [GIẢI THÍCH CODE]: Danh bạ người dùng toàn cục để tra cứu khi tặng sách theo ID
// ============================================================================
export const KEY_USER_DIRECTORY = '@halm_user_directory_v1';

export interface UserDirectoryEntry {
  id: string;        // Ví dụ: "id#C00001" hoặc "C00007"
  customerId: string;// Ví dụ: "C00007" hoặc "id#C00007"
  name: string;      // Họ và tên người nhận, ví dụ: "Nguyễn Văn A"
  username?: string; // Tên tài khoản, ví dụ: "nguyenvana"
}

// Danh bạ người dùng thực tế từ hệ thống Database (đồng bộ với bảng customer & account)
const DEFAULT_DIRECTORY: Record<string, UserDirectoryEntry> = {
  // 1. Độc giả huy (customer_id: c0001, account: huy123)
  'c0001': { id: 'c0001', customerId: 'c0001', name: 'huy', username: 'huy123' },
  'id#c0001': { id: 'c0001', customerId: 'c0001', name: 'huy', username: 'huy123' },
  'c00001': { id: 'c0001', customerId: 'c0001', name: 'huy', username: 'huy123' },
  'huy123': { id: 'c0001', customerId: 'c0001', name: 'huy', username: 'huy123' },
  'huyen@gmail.com': { id: 'c0001', customerId: 'c0001', name: 'huy', username: 'huy123' },

  // 2. Độc giả bong vu (customer_id: id#C00002, account: chaytheoxerac123456)
  'id#c00002': { id: 'id#C00002', customerId: 'id#C00002', name: 'bong vu', username: 'chaytheoxerac123456' },
  'c00002': { id: 'id#C00002', customerId: 'id#C00002', name: 'bong vu', username: 'chaytheoxerac123456' },
  'chaytheoxerac123456': { id: 'id#C00002', customerId: 'id#C00002', name: 'bong vu', username: 'chaytheoxerac123456' },

  // 3. Độc giả huyen (customer_id: id#C00003, account: huyen)
  'id#c00003': { id: 'id#C00003', customerId: 'id#C00003', name: 'huyen', username: 'huyen' },
  'c00003': { id: 'id#C00003', customerId: 'id#C00003', name: 'huyen', username: 'huyen' },
  'huyen': { id: 'id#C00003', customerId: 'id#C00003', name: 'huyen', username: 'huyen' },
};

/**
 * [GIẢI THÍCH CODE]: Ghi nhận một người dùng vào danh bạ toàn cục
 */
export const recordUserInDirectory = async (entry: UserDirectoryEntry): Promise<void> => {
  if (!entry || (!entry.id && !entry.customerId && !entry.username)) return;
  try {
    const raw = await AsyncStorage.getItem(KEY_USER_DIRECTORY);
    let dict: Record<string, UserDirectoryEntry> = raw ? JSON.parse(raw) : { ...DEFAULT_DIRECTORY };
    if (typeof dict !== 'object' || dict === null) dict = { ...DEFAULT_DIRECTORY };

    const keysToRegister: string[] = [];
    if (entry.id) {
      keysToRegister.push(entry.id.trim().toLowerCase());
      keysToRegister.push(entry.id.trim().toLowerCase().replace(/^(id#|#|id)/i, ''));
    }
    if (entry.customerId) {
      keysToRegister.push(entry.customerId.trim().toLowerCase());
      keysToRegister.push(entry.customerId.trim().toLowerCase().replace(/^(id#|#|id)/i, ''));
    }
    if (entry.username) {
      keysToRegister.push(entry.username.trim().toLowerCase());
    }

    for (const k of keysToRegister) {
      if (k) dict[k] = entry;
    }

    await AsyncStorage.setItem(KEY_USER_DIRECTORY, JSON.stringify(dict));
  } catch {}
};

/**
 * [GIẢI THÍCH CODE]: Tra cứu người dùng theo ID nhập vào
 * Trả về thông tin người dùng nếu tồn tại trong hệ thống, ngược lại trả về null
 */
export const lookupUserInDirectory = async (searchId: string): Promise<UserDirectoryEntry | null> => {
  if (!searchId || !searchId.trim()) return null;
  const rawQuery = searchId.trim();
  const lowerQuery = rawQuery.toLowerCase();
  const stripped = lowerQuery.replace(/^(id#|#|id)/i, '');

  try {
    const raw = await AsyncStorage.getItem(KEY_USER_DIRECTORY);
    const dict: Record<string, UserDirectoryEntry> = raw ? JSON.parse(raw) : { ...DEFAULT_DIRECTORY };

    // 1. Kiểm tra trực tiếp các biến thể khóa
    if (dict[lowerQuery]) return dict[lowerQuery];
    if (dict[stripped]) return dict[stripped];
    if (dict[`id#${stripped}`]) return dict[`id#${stripped}`];
    if (dict[`c${stripped}`]) return dict[`c${stripped}`];

    // 2. Thử trường hợp nhập số thứ tự: 1, 2, 3... -> c0001, c00002, id#c00002
    if (/^\d+$/.test(stripped)) {
      const padded4 = `c${stripped.padStart(4, '0')}`;
      if (dict[padded4]) return dict[padded4];
      const padded5 = `c${stripped.padStart(5, '0')}`;
      if (dict[padded5]) return dict[padded5];
      if (dict[`id#${padded5}`]) return dict[`id#${padded5}`];
    }
  } catch {}

  // Nếu không có trong danh bạ thực tế của hệ thống -> trả về null để báo người dùng không tồn tại
  return null;
};

