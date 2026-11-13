import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, fetchApiWithFallback } from './apiService';
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

export type RentalDurationDays = 7 | 14 | 30 | 90;

export const KEY_RENTED_BOOKS_CACHE = '@halm_rented_books_v1';

export const RENTAL_DURATION_OPTIONS: Array<{
  days: RentalDurationDays;
  label: string;
  labelEn: string;
  multiplier: number;
  subtitle: string;
  subtitleEn: string;
}> = [
  {
    days: 7,
    label: '7 ngày',
    labelEn: '7 days',
    multiplier: 1.0,
    subtitle: '100% giá gốc (Mặc định)',
    subtitleEn: '100% base price (Default)',
  },
  {
    days: 14,
    label: '14 ngày',
    labelEn: '14 days',
    multiplier: 1.8,
    subtitle: 'Tiết kiệm 10% (x1.8)',
    subtitleEn: 'Save 10% (x1.8)',
  },
  {
    days: 30,
    label: '30 ngày',
    labelEn: '30 days',
    multiplier: 3.5,
    subtitle: 'Gói tháng phổ biến (x3.5)',
    subtitleEn: 'Popular monthly (x3.5)',
  },
  {
    days: 90,
    label: '90 ngày',
    labelEn: '90 days',
    multiplier: 9.0,
    subtitle: 'Gói quý siêu tiết kiệm (x9.0)',
    subtitleEn: 'Best value 90 days (x9.0)',
  },
];

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
  if (days === 14 || days === 30 || days === 90 || days === 7) {
    return days;
  }
  if (days && days > 60) return 90;
  if (days && days >= 25) return 30;
  if (days && days >= 12) return 14;
  return 7;
};

export const calculateDynamicKhoai = (baseKhoai: number, days: number): number => {
  switch (days) {
    case 14:
      return Math.round(baseKhoai * 1.8);
    case 30:
      return Math.round(baseKhoai * 3.5);
    case 90:
      return Math.round(baseKhoai * 9.0);
    case 7:
    default:
      return Math.round(baseKhoai * 1.0);
  }
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
  return Boolean(
    book.fileUri ||
      book.pdf_url ||
      book.isPersonal ||
      id.startsWith('upload') ||
      id.startsWith('tmp') ||
      id.startsWith('personal')
  );
};

export const resolveCoverUrlWithBase = (
  rawUrl?: string | null,
  bookId?: string,
  baseHost: string = API_BASE_URL
): string => {
  if (rawUrl && typeof rawUrl === 'string' && rawUrl.trim().length > 0) {
    const trimmed = rawUrl.trim();
    if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(trimmed)) {
      return trimmed;
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
        statusStr === 'EXPIRED' || (!isForever && remainingDays <= 0);
      const resolvedCover = resolveCoverUrlWithBase(
        item.imgUrl || item.img_url,
        bookId,
        res.baseUrl
      );

      let durationLabel = `Còn ${Math.max(1, remainingDays)} ngày`;
      if (expired) {
        durationLabel = 'Đã hết hạn';
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
        status: expired ? 'EXPIRED' : statusStr,
        currentPage: Number(item.currentPage || 1),
        readingPercentage: Number(item.readingPercentage || 0),
        lastReadAt: item.lastReadAt,
        durationLabel,
      };
    });

    const activeBooks = mappedAll.filter((b) => !b.expired);
    const expiredBooks = mappedAll.filter((b) => b.expired);

    await setUserItem(KEY_RENTED_BOOKS_CACHE, JSON.stringify(activeBooks)).catch(() => {});

    return {
      success: true,
      books: activeBooks,
      expiredBooks,
    };
  } catch (err: any) {
    if (err?.response?.status === 401) {
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
      const cachedRaw = await getUserItem(KEY_RENTED_BOOKS_CACHE);
      if (cachedRaw) {
        const cached = JSON.parse(cachedRaw);
        if (Array.isArray(cached)) {
          return {
            success: false,
            books: cached,
            expiredBooks: [],
            networkError: true,
            errorMessage: 'Không thể kết nối máy chủ, đang hiển thị dữ liệu đã lưu.',
          };
        }
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
export const checkBookAccessDetailApi = async (bookId: string): Promise<BookAccessDetail> => {
  const defaultDenied: BookAccessDetail = {
    hasAccess: false,
    currentPage: 1,
    readingPercentage: 0,
    remainingDays: 0,
    isForever: false,
    status: 'NONE',
    checkedFromServer: false,
  };

  if (!bookId || bookId.startsWith('upload') || bookId.startsWith('tmp')) {
    return defaultDenied;
  }

  const token = await AsyncStorage.getItem('userToken');
  if (!token) {
    return { ...defaultDenied, status: 'GUEST', checkedFromServer: true };
  }

  const headers = { Authorization: `Bearer ${token}` };
  try {
    const res = await fetchApiWithFallback(
      `/api/home/bookshelf/check-detail/${encodeURIComponent(bookId)}`,
      { method: 'GET', headers, timeout: 4500 }
    );
    const data = res.data || {};
    const remainingDays = Number(data.remainingDays || 0);
    const isForever =
      Boolean(data.isForever ?? data.forever) || remainingDays > 1000;
    return {
      hasAccess: Boolean(data.hasAccess),
      currentPage: Number(data.currentPage || 1),
      readingPercentage: Number(data.readingPercentage || 0),
      remainingDays,
      isForever,
      status: String(data.status || (data.hasAccess ? 'ACTIVE' : 'NONE')),
      checkedFromServer: true,
    };
  } catch (err: any) {
    // Fallback endpoint đơn giản nếu endpoint chi tiết chưa phản hồi
    try {
      const checkRes = await fetchApiWithFallback(
        `/api/home/bookshelf/check/${encodeURIComponent(bookId)}`,
        { method: 'GET', headers, timeout: 4000 }
      );
      return {
        ...defaultDenied,
        hasAccess: Boolean(checkRes.data?.hasAccess),
        status: checkRes.data?.hasAccess ? 'ACTIVE' : 'NONE',
        checkedFromServer: true,
      };
    } catch {
      // Nếu mất mạng, kiểm tra cache sách đang thuê để không chặn nhầm người đã thuê
      try {
        const cachedRaw = await getUserItem(KEY_RENTED_BOOKS_CACHE);
        if (cachedRaw) {
          const cached = JSON.parse(cachedRaw);
          if (Array.isArray(cached)) {
            const matched = cached.find(
              (b: any) => String(b.bookId || b.id) === String(bookId) && !b.expired
            );
            if (matched) {
              return {
                hasAccess: true,
                currentPage: Number(matched.currentPage || 1),
                readingPercentage: Number(matched.readingPercentage || 0),
                remainingDays: Number(matched.remainingDays || 1),
                isForever: Boolean(matched.isForever),
                status: 'ACTIVE',
                checkedFromServer: false,
              };
            }
          }
        }
      } catch {}

      if (err?.response?.status === 401) {
        return { ...defaultDenied, status: 'UNAUTHORIZED', checkedFromServer: true };
      }
      return defaultDenied;
    }
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
  durationDays: RentalDurationDays = 7,
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

  const baseKhoai = resolveBaseKhoaiForBook(bookId, rawRentPrice);
  const price = calculateDynamicKhoai(baseKhoai, durationDays);
  const headers = { Authorization: `Bearer ${token}` };
  const body = { bookId, planKey: String(durationDays), price };

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
    if (err?.response?.status === 400) {
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
export const checkoutBooksApi = async (
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

  // Nếu thanh toán theo danh sách cartItemIds từ Giỏ hàng -> ưu tiên /api/cart/checkout
  if (cartItemIds && cartItemIds.length > 0) {
    try {
      const res = await fetchApiWithFallback('/api/cart/checkout', {
        method: 'POST',
        headers,
        data: { cartItemIds },
        timeout: 8000,
      });
      const remaining = res.data?.remainingPotatoBalance;
      if (typeof remaining === 'number') {
        await syncStoredPotatoBalance(remaining);
      }
      return {
        success: true,
        message: res.data?.message || 'Thuê sách thành công!',
        totalKhoaiPaid: res.data?.totalKhoaiPaid,
        remainingPotatoBalance: remaining,
      };
    } catch (primaryErr: any) {
      const status = primaryErr?.response?.status;
      if (status === 400 && primaryErr?.response?.data?.message) {
        return {
          success: false,
          message: primaryErr.response.data.message,
        };
      }
      // Tiếp tục fallback sang /api/home/checkout bên dưới
    }
  }

  // Thanh toán trực tiếp hoặc fallback qua POST /api/home/checkout
  try {
    const payload = {
      paymentMethod: 'POTATO_WALLET',
      discountAmount: 0,
      items: items.map((item) => ({
        bookId: item.bookId,
        cartItemId: item.cartItemId ?? null,
        planKey: String(item.durationDays),
        durationDays: item.durationDays,
        price: item.price,
      })),
    };

    const res = await fetchApiWithFallback('/api/home/checkout', {
      method: 'POST',
      headers,
      data: payload,
      timeout: 8000,
    });
    const remaining = res.data?.remainingPotatoBalance;
    if (typeof remaining === 'number') {
      await syncStoredPotatoBalance(remaining);
    }
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

