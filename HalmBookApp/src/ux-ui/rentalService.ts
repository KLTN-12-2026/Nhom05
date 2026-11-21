import { fetchCommercePolicy, getCachedCommercePolicy, rentalPlanPrice } from './commercePolicy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, fetchApiWithFallback, normalizeAssetUrl } from './apiService';
import {
  getUserItem,
  KEY_POTATO_BALANCE,
  setUserItem,
} from './userStorage';

// ============================================================================
// [GIẢI THÍCH CODE]: DỊCH VỤ QUẢN LÝ THUÊ SÁCH, QUYỀN ĐỌC & VÍ KHOAI (APP <-> BE)
// - Dùng chung công thức tính giá Khoai & thời hạn thuê chuẩn với HalmBookBE
// - Sử dụng fetchApiWithFallback để tự động dò URL Backend khả dụng
// ============================================================================

export type RentalDurationDays = 1 | 3 | 7 | 14 | 15 | 30 | 90 | 36500;

export const KEY_RENTED_BOOKS_CACHE = '@halm_rented_books_v1';
export const KEY_EXPIRED_RENTED_BOOKS_CACHE = '@halm_expired_rented_books_v1';

const FALLBACK_BASE_PRICE_MAP: Record<string, number> = {
  KD001: 25,
  LS001: 22,
  LS002: 24,
  LS003: 20,
  LS004: 22,
  PS001: 18,
  PS002: 18,
  PS003: 20,
  PS004: 20,
  PS005: 18,
  PS006: 16,
  PS007: 18,
  TT001: 18,
  TT002: 18,
  TT003: 18,
  TT004: 18,
  TT005: 18,
  TT006: 20,
  TT007: 20,
  VH001: 20,
  VH002: 22,
  VH003: 20,
  VH004: 25,
  VH005: 22,
  VH006: 20,
  VH007: 20,
  VH008: 20,
};

export const normalizeRentalDays = (days?: number | null): RentalDurationDays => {
  if (days === 1 || days === 3 || days === 15 || days === 36500 || days === 14 || days === 30 || days === 90 || days === 7) {
    return days;
  }
  if (days && days > 60) return 90;
  if (days && days >= 25) return 30;
  if (days && days >= 12) return 14;
  return 7;
};

export const calculateDynamicKhoai = (baseKhoai: number, days: number): number => {
  const plan = getCachedCommercePolicy()?.plans.find(p => p.durationDays === days && p.active);
  if (!plan) throw new Error('Chưa tải được biểu giá hoặc gói thuê đã tạm ngừng.');
  return rentalPlanPrice(plan, baseKhoai);
};

export const resolveBaseKhoaiForBook = (bookId: string, rawRentPrice?: number | null): number => {
  if (typeof rawRentPrice === 'number' && rawRentPrice > 0) {
    return Math.round(rawRentPrice);
  }
  const upper = (bookId || '').toUpperCase();
  if (FALLBACK_BASE_PRICE_MAP[upper]) {
    return FALLBACK_BASE_PRICE_MAP[upper];
  }
  if (upper.startsWith('KD')) return 25;
  if (upper.startsWith('LS')) return 22;
  if (upper.startsWith('VH')) return 20;
  if (upper.startsWith('TT')) return 18;
  return 15;
};

export const isPersonalOrLocalBook = (book: any): boolean => {
  if (!book) return false;
  const id = String(book.id || book.bookId || book.book_id || '');
  return /^(uploaded|upload|tmp|personal)[_-]/i.test(id)
    && (book.isPersonal === true || /^(file:|content:|blob:|data:)/i.test(String(book.fileUri || '')));
};

export const resolveCoverUrlWithBase = (
  rawUrl?: string | null,
  bookId?: string,
  baseHost: string = API_BASE_URL
): string => {
  if (rawUrl && typeof rawUrl === 'string' && rawUrl.trim().length > 0) {
    const trimmed = rawUrl.trim();
    if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(trimmed)) {
      return normalizeAssetUrl(trimmed, baseHost);
    }
    const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    return `${baseHost}${cleanPath}`;
  }
  if (bookId && !bookId.startsWith('upload') && !bookId.startsWith('tmp')) {
    return `${baseHost}/api/home/covers/${bookId}.jpg`;
  }
  return '';
};

export interface RentedBookItem {
  accessRecordId?: number;
  id: string;
  bookId: string;
  title: string;
  author: string;
  categoryName: string;
  img_url: string;
  coverImage: string;
  remainingDays: number;
  isForever: boolean;
  expired: boolean;
  status: string;
  currentPage: number;
  readingPercentage: number;
  lastReadAt?: string;
  startDate?: unknown;
  endDate?: unknown;
  durationLabel: string;
}

export interface BookshelfFetchResult {
  success: boolean;
  books: RentedBookItem[];
  expiredBooks: RentedBookItem[];
  requireLogin?: boolean;
  networkError?: boolean;
  errorMessage?: string;
}

export interface BookAccessDetail {
  hasAccess: boolean;
  currentPage: number;
  readingPercentage: number;
  remainingDays: number;
  isForever: boolean;
  status: string;
  checkedFromServer: boolean;
}

export interface CheckoutLineItem {
  bookId: string;
  cartItemId?: number | null;
  durationDays: number;
  price: number;
}

export interface RentalActionResult {
  success: boolean;
  message: string;
  requireLogin?: boolean;
  totalKhoaiPaid?: number;
  remainingPotatoBalance?: number;
}

const syncStoredPotatoBalance = async (balance: number): Promise<void> => {
  try {
    await setUserItem(KEY_POTATO_BALANCE, String(balance));
    const rawProfile = await AsyncStorage.getItem('cachedUserProfile');
    if (rawProfile) {
      const parsed = JSON.parse(rawProfile);
      if (parsed && typeof parsed === 'object') {
        parsed.potatoBalance = balance;
        await AsyncStorage.setItem('cachedUserProfile', JSON.stringify(parsed));
      }
    }
  } catch {
    // Bỏ qua lỗi cache phụ
  }
};

const extractServerErrorMessage = (err: any, fallback: string): string => {
  const data = err?.response?.data;
  if (typeof data === 'string' && data.trim()) return data.trim();
  if (data && typeof data.message === 'string' && data.message.trim()) return data.message.trim();
  if (data && typeof data.error === 'string' && data.error.trim()) return data.error.trim();
  if (typeof err?.message === 'string' && err.message.trim()) return err.message.trim();
  return fallback;
};

/**
 * Lấy thông tin chi tiết 1 cuốn sách từ Backend để kiểm tra tồn tại và giá thuê
 */
export const fetchBookDetailFromApi = async (bookId: string): Promise<any | null> => {
  if (!bookId || bookId.startsWith('upload') || bookId.startsWith('tmp')) {
    return null;
  }
  try {
    const res = await fetchApiWithFallback(`/api/home/books/${encodeURIComponent(bookId)}`, {
      method: 'GET',
      timeout: 5000,
    });
    return res.data || null;
  } catch {
    return null;
  }
};

/**
 * Lấy danh sách sách đang thuê trong Tủ Sách Cá Nhân từ Backend (GET /api/home/bookshelf)
 */
export const fetchBookshelfFromApi = async (): Promise<BookshelfFetchResult> => {
  const token = await AsyncStorage.getItem('userToken');
  if (!token) {
    return { success: false, books: [], expiredBooks: [], requireLogin: true };
  }

  try {
    const res = await fetchApiWithFallback<any[]>('/api/home/bookshelf', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
      timeout: 6000,
    });

    const rawList = Array.isArray(res.data) ? res.data : [];
    const mappedAll: RentedBookItem[] = rawList.map((item: any) => {
      const bookId = String(item.bookId || item.book_id || '');
      const remainingDays = Number(item.remainingDays ?? 0);
      // Lombok `@Data` trên `boolean isForever` có thể serialize thành `forever` hoặc `isForever`
      const isForever =
        Boolean(item.isForever ?? item.forever) || remainingDays > 1000;
      const statusStr = String(item.status || 'ACTIVE').toUpperCase();
      const expired =
        statusStr !== 'ACTIVE' || (!isForever && remainingDays <= 0);
      const resolvedCover = resolveCoverUrlWithBase(
        item.imgUrl || item.img_url,
        bookId,
        res.baseUrl
      );

      let durationLabel = `Còn ${Math.max(1, remainingDays)} ngày`;
      if (expired) {
        durationLabel = statusStr === 'REVOKED' ? 'Đã thu hồi quyền đọc' : statusStr === 'REJECTED' ? 'Đã từ chối' : 'Đã hết hạn';
      } else if (isForever) {
        durationLabel = 'Sở hữu vĩnh viễn';
      }

      return {
        accessRecordId: item.accessRecordId,
        id: bookId,
        bookId,
        title: item.bookName || item.title || 'Sách HALM BOOK',
        author: item.author || 'Tác giả',
        categoryName: item.categoryName || 'Chung',
        img_url: resolvedCover,
        coverImage: resolvedCover,
        remainingDays,
        isForever,
        expired,
        status: statusStr === 'ACTIVE' && expired ? 'EXPIRED' : statusStr,
        currentPage: Number(item.currentPage || 1),
        readingPercentage: Number(item.readingPercentage || 0),
        lastReadAt: item.lastReadAt,
        startDate: item.startDate,
        endDate: item.endDate,
        durationLabel,
      };
    });

    const activeBooks = mappedAll.filter((b) => !b.expired);
    const expiredBooks = mappedAll.filter((b) => b.expired);

    await Promise.all([
      setUserItem(KEY_RENTED_BOOKS_CACHE, JSON.stringify(activeBooks)).catch(() => {}),
      setUserItem(KEY_EXPIRED_RENTED_BOOKS_CACHE, JSON.stringify(expiredBooks)).catch(() => {}),
    ]);

    return {
      success: true,
      books: activeBooks,
      expiredBooks,
    };
  } catch (err: any) {
    if ([401, 403, 423].includes(err?.response?.status)) {
      return {
        success: false,
        books: [],
        expiredBooks: [],
        requireLogin: true,
        errorMessage: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
      };
    }

    // Fallback đọc cache gần nhất của user khi mạng chập chờn
    try {
      const [cachedRaw, cachedExpiredRaw] = await Promise.all([
        getUserItem(KEY_RENTED_BOOKS_CACHE),
        getUserItem(KEY_EXPIRED_RENTED_BOOKS_CACHE),
      ]);
      const cached = cachedRaw ? JSON.parse(cachedRaw) : [];
      const cachedExpired = cachedExpiredRaw ? JSON.parse(cachedExpiredRaw) : [];
      if (Array.isArray(cached) || Array.isArray(cachedExpired)) {
        return {
          success: false,
          books: Array.isArray(cached) ? cached : [],
          expiredBooks: Array.isArray(cachedExpired) ? cachedExpired : [],
          networkError: true,
          errorMessage: 'Không thể kết nối máy chủ, đang hiển thị dữ liệu đã lưu.',
        };
      }
    } catch {}

    return {
      success: false,
      books: [],
      expiredBooks: [],
      networkError: true,
      errorMessage: extractServerErrorMessage(err, 'Không thể tải danh sách sách đang thuê.'),
    };
  }
};

/**
 * Kiểm tra quyền đọc sách chi tiết (GET /api/home/bookshelf/check-detail/{bookId})
 */
export const checkBookAccessDetailApi = async (bookId: string, signal?: AbortSignal): Promise<BookAccessDetail> => {
  const denied = (status: string, checkedFromServer = false): BookAccessDetail => ({
    hasAccess: false, currentPage: 1, readingPercentage: 0, remainingDays: 0,
    isForever: false, status, checkedFromServer,
  });
  if (!bookId || bookId.startsWith('upload') || bookId.startsWith('tmp')) return denied('NONE');
  const token = await AsyncStorage.getItem('userToken');
  if (!token) return denied('GUEST', true);
  try {
    const res = await fetchApiWithFallback(
      '/api/home/bookshelf/check-detail/' + encodeURIComponent(bookId),
      { method: 'GET', headers: { Authorization: 'Bearer ' + token }, timeout: 5000, signal }
    );
    const data = res.data;
    if (!data || typeof data.hasAccess !== 'boolean') return denied('NETWORK_ERROR');
    const status = String(data.status || (data.hasAccess ? 'ACTIVE' : 'NONE')).toUpperCase();
    const remainingDays = Number(data.remainingDays || 0);
    return {
      hasAccess: data.hasAccess === true && status === 'ACTIVE',
      currentPage: Number(data.currentPage || 1), readingPercentage: Number(data.readingPercentage || 0),
      remainingDays, isForever: Boolean(data.isForever ?? data.forever) || remainingDays > 1000,
      status, checkedFromServer: true,
    };
  } catch (err: any) {
    if (signal?.aborted) throw err;
    const status = err?.response?.status;
    if (status === 423 || err?.response?.data?.error === 'ACCOUNT_LOCKED') return denied('LOCKED', true);
    if (status === 401) return denied('UNAUTHORIZED', true);
    if (status === 403) return denied('REVOKED', true);
    // Cached bookshelf entries are display data, never a source of permission to read.
    return denied('NETWORK_ERROR');
  }
};

/**
 * Lấy số dư Ví Khoai thực tế từ Backend
 */
export const fetchWalletBalanceApi = async (): Promise<number | null> => {
  const token = await AsyncStorage.getItem('userToken');
  if (!token) return null;

  const headers = { Authorization: `Bearer ${token}` };
  try {
    const res = await fetchApiWithFallback('/api/home/potato/wallet', {
      method: 'GET',
      headers,
      timeout: 4500,
    });
    if (typeof res.data?.potatoBalance === 'number') {
      await syncStoredPotatoBalance(res.data.potatoBalance);
      return res.data.potatoBalance;
    }
  } catch {
    // Fallback sang customer/info
  }

  try {
    const infoRes = await fetchApiWithFallback('/api/home/customer/info', {
      method: 'GET',
      headers,
      timeout: 4500,
    });
    if (typeof infoRes.data?.potatoBalance === 'number') {
      await syncStoredPotatoBalance(infoRes.data.potatoBalance);
      return infoRes.data.potatoBalance;
    }
  } catch {}

  return null;
};

/**
 * Thêm sách vào giỏ hàng trên MySQL (POST /api/cart/add -> fallback /api/home/cart/add)
 */
export const addToCartApi = async (
  bookId: string,
  durationDays?: RentalDurationDays,
  rawRentPrice?: number | null
): Promise<RentalActionResult> => {
  const token = await AsyncStorage.getItem('userToken');
  if (!token) {
    return {
      success: false,
      requireLogin: true,
      message: 'Vui lòng đăng nhập để thêm sách vào giỏ hàng.',
    };
  }

  const policy = await fetchCommercePolicy();
  const plan = durationDays == null
    ? policy.plans.find(p => p.durationDays === 7 && p.active) || policy.plans.find(p => p.active)
    : policy.plans.find(p => p.durationDays === durationDays && p.active);
  if (!plan) return { success: false, message: 'Gói thuê đã tạm ngừng. Vui lòng chọn kỳ hạn khác trong giỏ hàng.' };
  const price = rentalPlanPrice(plan, rawRentPrice);
  const headers = { Authorization: `Bearer ${token}` };
  const body = { bookId, planKey: plan.key, price };

  try {
    const res = await fetchApiWithFallback('/api/cart/add', {
      method: 'POST',
      headers,
      data: body,
      timeout: 6000,
    });
    return {
      success: true,
      message: res.data?.message || 'Đã thêm sách vào giỏ hàng!',
    };
  } catch (err: any) {
    if (![404, 405].includes(err?.response?.status)) {
      return {
        success: false,
        message: extractServerErrorMessage(err, 'Không thể thêm sách vào giỏ hàng.'),
      };
    }
    try {
      const fallbackRes = await fetchApiWithFallback('/api/home/cart/add', {
        method: 'POST',
        headers,
        data: body,
        timeout: 6000,
      });
      return {
        success: true,
        message: fallbackRes.data?.message || 'Đã thêm sách vào giỏ hàng!',
      };
    } catch (fallbackErr: any) {
      return {
        success: false,
        message: extractServerErrorMessage(
          fallbackErr,
          'Không thể kết nối máy chủ để thêm vào giỏ hàng.'
        ),
      };
    }
  }
};

/**
 * Thanh toán thuê sách bằng Khoai Tây xuống Backend (tạo Orders, Order_Item & Access_Record)
 */
const executeCheckout = async (
  items: CheckoutLineItem[],
  cartItemIds?: number[]
): Promise<RentalActionResult> => {
  const token = await AsyncStorage.getItem('userToken');
  if (!token) {
    return {
      success: false,
      requireLogin: true,
      message: 'Vui lòng đăng nhập để thuê sách bằng Khoai.',
    };
  }

  if (!items || items.length === 0) {
    return { success: false, message: 'Chưa có cuốn sách nào được chọn.' };
  }

  const headers = { Authorization: `Bearer ${token}` };

  try {
    const payload = {
      paymentMethod: 'POTATO_WALLET',
      discountAmount: 0,
      items: items.map((item, index) => ({
        bookId: item.bookId,
        cartItemId: item.cartItemId ?? cartItemIds?.[index] ?? null,
        planKey: String(item.durationDays),
        durationDays: item.durationDays,
      })).sort((a, b) => a.bookId.localeCompare(b.bookId)),
    };

    const identity = JSON.stringify(payload);
    const pendingKey = 'checkout_pending_' + (await AsyncStorage.getItem('currentUsername') || 'unknown');
    const saved = await AsyncStorage.getItem(pendingKey);
    const previous = saved ? JSON.parse(saved) as { identity: string; key: string } : null;
    const idempotencyKey = previous?.identity === identity ? previous.key : 'APP-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
    await AsyncStorage.setItem(pendingKey, JSON.stringify({ identity, key: idempotencyKey }));
    const res = await fetchApiWithFallback('/api/home/checkout', {
      method: 'POST',
      headers,
      data: { ...payload, idempotencyKey },
      timeout: 15000,
    });
    const remaining = res.data?.remainingPotatoBalance;
    if (typeof remaining === 'number') {
      await syncStoredPotatoBalance(remaining);
    }
    await AsyncStorage.removeItem(pendingKey);
    return {
      success: true,
      message: res.data?.message || 'Thuê sách thành công! Sách đã được thêm vào Tủ Sách.',
      totalKhoaiPaid: res.data?.totalKhoaiPaid,
      remainingPotatoBalance: remaining,
    };
  } catch (err: any) {
    if (err?.response?.status === 401) {
      return {
        success: false,
        requireLogin: true,
        message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
      };
    }
    return {
      success: false,
      message: extractServerErrorMessage(
        err,
        'Không thể thực hiện giao dịch thuê sách. Vui lòng kiểm tra số dư Khoai.'
      ),
    };
  }
};

/**
 * Đồng bộ tiến độ đọc lên Access_Record trong Backend (chạy nền, không chặn UI)
 */
export const syncReadingProgressApi = async (
  bookId: string,
  currentPage: number,
  totalPages?: number
): Promise<void> => {
  if (!bookId || bookId.startsWith('upload') || bookId.startsWith('tmp')) return;
  const token = await AsyncStorage.getItem('userToken');
  if (!token) return;

  try {
    const percentage =
      totalPages && totalPages > 0
        ? Math.min(100, Math.round((currentPage / totalPages) * 1000) / 10)
        : undefined;

    await fetchApiWithFallback(
      `/api/home/books/${encodeURIComponent(bookId)}/reading-progress`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        data: {
          currentPage: Math.max(1, currentPage),
          totalPages: totalPages && totalPages > 0 ? totalPages : undefined,
          readingPercentage: percentage,
        },
        timeout: 4000,
      }
    );
  } catch {
    // Bỏ qua nếu sách đang đọc thử (chưa có access_record) hoặc thiết bị offline
  }
};


const activeCheckouts = new Map<string, { identity: string; promise: Promise<RentalActionResult> }>();
export const checkoutBooksApi = async (items: CheckoutLineItem[], cartItemIds?: number[]): Promise<RentalActionResult> => {
  const owner = await AsyncStorage.getItem('currentUsername') || 'guest';
  const identity = JSON.stringify({ items, cartItemIds });
  const active = activeCheckouts.get(owner);
  if (active) return active.identity === identity ? active.promise : { success: false, message: 'Một giao dịch khác đang được xử lý. Vui lòng chờ.' };
  const promise = executeCheckout(items, cartItemIds);
  activeCheckouts.set(owner, { identity, promise });
  try { return await promise; } finally { if (activeCheckouts.get(owner)?.promise === promise) activeCheckouts.delete(owner); }
};
