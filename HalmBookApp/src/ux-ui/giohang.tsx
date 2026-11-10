import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Modal,
  ScrollView,
  Alert,
  Platform,
  StatusBar,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Constants from 'expo-constants';
import { BookData, useAppNavigation } from './navigation';
import { getBookChapterLabel } from './bookContentService';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// ==============================================================
// CẤU HÌNH KẾT NỐI BACKEND SPRING BOOT + MYSQL (PORT 8082)
// ==============================================================
const debuggerHost = Constants.expoConfig?.hostUri;
const localhost = debuggerHost ? debuggerHost.split(':')[0] : 'localhost';
const API_BASE_URL = `http://${localhost}:8082`;
const CANDIDATE_URLS = [
  API_BASE_URL,
  'http://localhost:8082',
  'http://127.0.0.1:8082',
  'http://192.168.1.165:8082',
  'http://10.0.2.2:8082',
];

const CART_DB_SEEDED_KEY = '@halm_cart_db_seeded_v2';

export type RentalDurationDays = 7 | 14 | 30 | 90;

export interface CartItemModel {
  cartItemId: number;
  bookId: string;
  title: string;
  author: string;
  coverUrl: string | null;
  description: string;
  baseKhoai: number;
  rentalDays: RentalDurationDays;
  priceKhoai: number;
  bookData: BookData;
}

export const RENTAL_DURATION_OPTIONS: Array<{
  days: RentalDurationDays;
  label: string;
  multiplier: number;
  subtitle: string;
}> = [
  { days: 7, label: '7 ngày', multiplier: 1.0, subtitle: '100% giá gốc (Mặc định)' },
  { days: 14, label: '14 ngày', multiplier: 1.8, subtitle: 'Tiết kiệm 10% (x1.8)' },
  { days: 30, label: '30 ngày', multiplier: 3.5, subtitle: 'Gói tháng phổ biến (x3.5)' },
  { days: 90, label: '90 ngày', multiplier: 9.0, subtitle: 'Gói quý siêu tiết kiệm (x9.0)' },
];

/**
 * Công thức tính giá Khoai động chuẩn Backend:
 * - 7 ngày:  100% baseKhoai
 * - 14 ngày: làm tròn(baseKhoai * 1.8)
 * - 30 ngày: làm tròn(baseKhoai * 3.5)
 * - 90 ngày: làm tròn(baseKhoai * 9.0)
 */
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

export const normalizeRentalDays = (days?: number | null): RentalDurationDays => {
  if (days === 14 || days === 30 || days === 90 || days === 7) {
    return days;
  }
  if (days && days > 60) return 90;
  if (days && days >= 25) return 30;
  if (days && days >= 12) return 14;
  return 7;
};

/**
 * Chuẩn hóa giá gốc (baseKhoai) và tóm tắt sách từ dữ liệu thật trong DB
 */
const BOOK_SUMMARY_MAP: Record<string, { baseKhoai: number; summary: string }> = {
  KD001: {
    baseKhoai: 25,
    summary:
      'Kiệt tác châm biếm của Lỗ Tấn khắc họa hình tượng AQ với "phép thắng lợi tinh thần" đặc trưng trong bối cảnh xã hội Trung Hoa giao thời.',
  },
  LS001: {
    baseKhoai: 22,
    summary:
      'Bài diễn thuyết tâm huyết của nhà chí sĩ Phan Châu Trinh so sánh nền tảng đạo đức và luân lý phương Đông với phương Tây.',
  },
  LS002: {
    baseKhoai: 24,
    summary:
      'Tác phẩm lý luận cách mạng quan trọng của Nguyễn Ái Quốc tập hợp các bài giảng đào tạo cán bộ tại Quảng Châu (1925–1927).',
  },
  LS003: {
    baseKhoai: 20,
    summary:
      'Hồi ký cảm động viết trong ngục Quảng Đông của cụ Phan Bội Châu ghi lại chặng đường hoạt động cứu nước đầy gian truân.',
  },
  LS004: {
    baseKhoai: 22,
    summary:
      'Công trình biên khảo văn hóa kinh điển của Phan Kế Bính về phong tục tập quán trong gia đình, làng xã và xã hội Việt Nam.',
  },
  PS001: {
    baseKhoai: 18,
    summary:
      'Phóng sự sắc sảo của Vũ Trọng Phụng vạch trần những mánh khóe gian lận tinh vi trong giới cờ bạc bịp đầu thế kỷ XX.',
  },
  PS002: {
    baseKhoai: 18,
    summary:
      'Thiên phóng sự chân thực của Vũ Trọng Phụng về thân phận những người đi ở và giới môi giới người làm tại Hà Nội xưa.',
  },
  PS003: {
    baseKhoai: 20,
    summary:
      'Tập tùy bút trữ tình nổi tiếng của Thạch Lam tôn vinh vẻ đẹp văn hóa, ẩm thực và tâm hồn người Hà Nội ba mươi sáu phố phường.',
  },
  PS004: {
    baseKhoai: 20,
    summary:
      'Phóng sự nổi tiếng của Vũ Trọng Phụng phản ánh hiện thực bi hài của những cuộc hôn nhân thực dụng thời Pháp thuộc.',
  },
  PS005: {
    baseKhoai: 18,
    summary:
      'Phóng sự điều tra xã hội của Vũ Trọng Phụng ghi lại góc khuất đầy bi kịch nơi nhà lục xì Hà Nội.',
  },
  PS006: {
    baseKhoai: 16,
    summary:
      'Phóng sự nông thôn sắc bén của Ngô Tất Tố phơi bày những hủ tục nặng nề xoay quanh ngôi đình làng cổ truyền.',
  },
  PS007: {
    baseKhoai: 18,
    summary:
      'Tác phẩm phóng sự xuất sắc của Ngô Tất Tố khắc họa bức tranh sinh động nhưng đầy trăn trở về hủ tục làng xã Việt Nam.',
  },
  TT001: {
    baseKhoai: 18,
    summary:
      'Tiểu thuyết giàu tính nhân văn của Hồ Biểu Chánh ca ngợi tình phụ tử thiêng liêng và đạo lý nghĩa tình Nam Bộ.',
  },
  TT002: {
    baseKhoai: 18,
    summary:
      'Tiểu thuyết hiện thực Nam Bộ tiêu biểu của Hồ Biểu Chánh kể về nghị lực vươn lên và lòng tự trọng của những phận đời nghèo khó.',
  },
  TT003: {
    baseKhoai: 18,
    summary:
      'Tiểu thuyết tâm lý xã hội của Vũ Trọng Phụng xoay quanh bi kịch tình yêu và xung đột lễ giáo gia đình.',
  },
  TT004: {
    baseKhoai: 18,
    summary:
      'Tiểu thuyết hiện thực của Vũ Trọng Phụng phân tích sâu sắc nguyên nhân xã hội đẩy người phụ nữ vào cảnh ngộ éo le.',
  },
  TT005: {
    baseKhoai: 18,
    summary:
      'Tiểu thuyết của Vũ Trọng Phụng đặt ra câu hỏi lớn về tình yêu lãng mạn khi đối diện với thực tế hôn nhân và đồng tiền.',
  },
  TT006: {
    baseKhoai: 20,
    summary:
      'Tiểu thuyết lãng mạn nổi tiếng của Khái Hưng kể về mối tình thanh cao nhưng đầy trắc trở giữa Mai và Lộc.',
  },
  TT007: {
    baseKhoai: 20,
    summary:
      'Tiểu thuyết tâm lý mở đầu văn xuôi hiện đại Việt Nam của Hoàng Ngọc Phách về mối tình bi thương giữa Đạm Thủy và Tố Tâm.',
  },
  VH001: {
    baseKhoai: 20,
    summary:
      'Tuyệt tác văn học hiện thực phê phán của Nam Cao về bi kịch bị tha hóa và khát vọng lương thiện của người nông dân Chí Phèo.',
  },
  VH002: {
    baseKhoai: 22,
    summary:
      'Tiểu thuyết đồ sộ của Vũ Trọng Phụng dựng lại bức tranh xã hội đầy biến động xoay quanh nhân vật Nghị Hách.',
  },
  VH003: {
    baseKhoai: 20,
    summary:
      'Tiểu thuyết phóng sự của Ngô Tất Tố tái hiện sinh động cảnh thi cử khoa bảng cuối thời phong kiến.',
  },
  VH004: {
    baseKhoai: 25,
    summary:
      'Kiệt tác trào phúng bất hủ của Vũ Trọng Phụng xoay quanh cuộc đời Xuân Tóc Đỏ và sự lố lăng của xã hội "âu hóa" nửa mùa.',
  },
  VH005: {
    baseKhoai: 22,
    summary:
      'Tiểu thuyết tâm lý đặc sắc của Nam Cao khắc họa bi kịch tinh thần mòn mỏi của người trí thức nghèo Thứ.',
  },
  VH006: {
    baseKhoai: 20,
    summary:
      'Tiểu thuyết hiện thực xuất sắc của Ngô Tất Tố về nỗi thống khổ của gia đình chị Dậu trong mùa sưu thuế.',
  },
  VH007: {
    baseKhoai: 20,
    summary:
      'Tiểu thuyết trào phúng của Vũ Trọng Phụng về sự đổi đời đột ngột và những hệ lụy dở khóc dở cười của tấm vé số độc đắc.',
  },
  VH008: {
    baseKhoai: 20,
    summary:
      'Tiểu thuyết hiện thực của Vũ Trọng Phụng phản ánh cuộc sống cơ cực của người dân lao động trước thiên tai và bất công xã hội.',
  },
};

const resolveBaseKhoaiForBook = (bookId: string, rawRentPrice?: number | null): number => {
  if (typeof rawRentPrice === 'number' && rawRentPrice > 0) {
    return Math.round(rawRentPrice);
  }
  const upper = (bookId || '').toUpperCase();
  if (BOOK_SUMMARY_MAP[upper]) {
    return BOOK_SUMMARY_MAP[upper].baseKhoai;
  }
  if (upper.startsWith('KD')) return 25;
  if (upper.startsWith('LS')) return 22;
  if (upper.startsWith('VH')) return 20;
  if (upper.startsWith('TT')) return 18;
  return 15;
};

const resolveSummaryForBook = (
  bookId: string,
  title: string,
  author: string,
  rawDesc?: string | null
): string => {
  if (rawDesc && typeof rawDesc === 'string' && rawDesc.trim().length > 0) {
    return rawDesc.trim();
  }
  const upper = (bookId || '').toUpperCase();
  if (BOOK_SUMMARY_MAP[upper]) {
    return BOOK_SUMMARY_MAP[upper].summary;
  }
  return `"${title}" là tác phẩm tiêu biểu của tác giả ${author} trên hệ thống thư viện số HALM BOOK, mang giá trị nhân văn sâu sắc và góc nhìn đặc sắc về con người, thời đại.`;
};

export default function GioHang() {
  const { navigate, navigateTab, goBack, isDarkMode, isLoggedIn, showLoginAlert } =
    useAppNavigation();

  // ==============================================================
  // STATE QUẢN LÝ GIỎ HÀNG THẬT & TƯƠNG TÁC
  // ==============================================================
  const [cartItems, setCartItems] = useState<CartItemModel[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submittingCheckout, setSubmittingCheckout] = useState<boolean>(false);
  const [updatingItemId, setUpdatingItemId] = useState<number | null>(null);
  const [potatoBalance, setPotatoBalance] = useState<number | null>(null);
  const [activeBaseUrl, setActiveBaseUrl] = useState<string>(API_BASE_URL);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  // State cho Bottom Sheet chọn mốc ngày thuê (7, 14, 30, 90 ngày)
  const [durationPickerItem, setDurationPickerItem] = useState<CartItemModel | null>(null);

  // State cho Popup Xem Nhanh Sách (Quick View Modal ~65% màn hình)
  const [quickViewItem, setQuickViewItem] = useState<CartItemModel | null>(null);

  // ==============================================================
  // BẢNG MÀU DUAL-THEME (HALMBOOK TOKEN)
  // ==============================================================
  const isDark = isDarkMode;
  const colors = {
    screenBg: isDark ? '#181716' : '#F7F5F0',
    cardBg: isDark ? '#242321' : '#FFFFFF',
    cardBorder: isDark ? '#383633' : '#E6E1D8',
    textPrimary: isDark ? '#F7F5F0' : '#242321',
    textSecondary: isDark ? '#A39F99' : '#85817A',
    accent: isDark ? '#E5A93C' : '#8B4A3C',
    accentText: isDark ? '#181716' : '#FFFFFF',
    chipBg: isDark ? '#2D2B28' : '#EFECE6',
    placeholderBg: isDark ? '#2D2B28' : '#EFECE6',
    disabledBg: isDark ? '#33312E' : '#D9D4CA',
    disabledText: isDark ? '#78746E' : '#9E9A92',
    modalOverlay: 'rgba(15, 14, 13, 0.62)',
    dangerSoft: isDark ? 'rgba(229, 169, 60, 0.14)' : 'rgba(139, 74, 60, 0.1)',
  };

  // ==============================================================
  // HÀM TRợ GIÚP LẤY HEADER XÁC THỰC JWT
  // ==============================================================
  const getAuthHeaders = useCallback(async (): Promise<Record<string, string>> => {
    const token = await AsyncStorage.getItem('userToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const resolveCoverUrl = useCallback(
    (rawUrl: string | null | undefined, bookId: string, baseHost: string): string | null => {
      if (rawUrl && typeof rawUrl === 'string' && rawUrl.trim().length > 0) {
        if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(rawUrl)) {
          return rawUrl;
        }
        const cleanPath = rawUrl.startsWith('/') ? rawUrl : `/${rawUrl}`;
        return `${baseHost}${cleanPath}`;
      }
      if (bookId) {
        return `${baseHost}/api/home/covers/${bookId}.jpg`;
      }
      return null;
    },
    []
  );

  // ==============================================================
  // CHUYỂN ĐỔI DỮ LIỆU TỪ API SANG CART ITEM MODEL
  // ==============================================================
  const mapRawCartDtoToModel = useCallback(
    (raw: any, index: number, baseHost: string, catalogMap?: Record<string, any>): CartItemModel => {
      const bookId = String(raw.bookId || raw.book_id || raw.id || `B${index + 1}`);
      const catalogBook = catalogMap?.[bookId] || {};
      const title = String(
        raw.title || raw.bookName || catalogBook.bookName || catalogBook.title || 'Tác phẩm văn học'
      );
      const author = String(raw.author || catalogBook.author || 'HALM BOOK');
      const rawRentPrice =
        typeof raw.rentPrice === 'number' && raw.rentPrice > 0
          ? raw.rentPrice
          : typeof catalogBook.rent_price === 'number' && catalogBook.rent_price > 0
          ? catalogBook.rent_price
          : null;

      const baseKhoai = resolveBaseKhoaiForBook(bookId, rawRentPrice);
      const rentalDays = normalizeRentalDays(raw.rentalDays ?? Number(raw.planKey));
      const priceKhoai =
        typeof raw.priceKhoai === 'number' && raw.priceKhoai > 0
          ? raw.priceKhoai
          : calculateDynamicKhoai(baseKhoai, rentalDays);

      const coverUrl = resolveCoverUrl(
        raw.coverUrl || raw.imgUrl || raw.img_url || catalogBook.img_url,
        bookId,
        baseHost
      );
      const description = resolveSummaryForBook(
        bookId,
        title,
        author,
        raw.description || catalogBook.description
      );

      const chapter = getBookChapterLabel({
        ...catalogBook,
        id: bookId,
        book_id: bookId,
        title,
        author,
      });

      const bookData: BookData = {
        id: bookId,
        title,
        author,
        chapter,
        tag: catalogBook.category_name || 'Văn học kinh điển',
        rating: '5.0',
        reads: catalogBook.readCount ? String(catalogBook.readCount) : '1.5K',
      };

      return {
        cartItemId: Number(raw.cartItemId || raw.cart_item_id || raw.id || index + 1),
        bookId,
        title,
        author,
        coverUrl,
        description,
        baseKhoai,
        rentalDays,
        priceKhoai,
        bookData,
      };
    },
    [resolveCoverUrl]
  );

  // ==============================================================
  // TẢI SỐ DƯ KHOAI TỪ DATABASE
  // ==============================================================
  const fetchWalletBalance = useCallback(
    async (baseHost: string, headers: Record<string, string>) => {
      try {
        const res = await axios.get(`${baseHost}/api/home/potato/wallet`, {
          headers,
          timeout: 5000,
        });
        if (res.data && typeof res.data.potatoBalance === 'number') {
          setPotatoBalance(res.data.potatoBalance);
          return;
        }
      } catch {
        // Fallback sang /api/home/customer/info
      }
      try {
        const infoRes = await axios.get(`${baseHost}/api/home/customer/info`, {
          headers,
          timeout: 5000,
        });
        if (infoRes.data && typeof infoRes.data.potatoBalance === 'number') {
          setPotatoBalance(infoRes.data.potatoBalance);
        }
      } catch {
        // Khách vãng lai hoặc chưa có token
      }
    },
    []
  );

  // ==============================================================
  // 1. KẾT NỐI DỮ LIỆU THẬT TỪ DATABASE (GET /api/cart)
  // ==============================================================
  const fetchCartFromDatabase = useCallback(
    async (preserveSelection = true) => {
      setLoading(true);
      const headers = await getAuthHeaders();
      let workingBaseUrl = activeBaseUrl;
      let catalogMap: Record<string, any> = {};

      // 1. Tải danh mục sách thật từ DB để đồng bộ metadata (ảnh bìa, mô tả, tác giả)
      for (const candidate of CANDIDATE_URLS) {
        try {
          const booksRes = await axios.get(`${candidate}/api/home/books`, {
            params: { page: 0, size: 50 },
            timeout: 6000,
          });
          if (booksRes.data) {
            workingBaseUrl = candidate;
            setActiveBaseUrl(candidate);
            const list = Array.isArray(booksRes.data)
              ? booksRes.data
              : Array.isArray(booksRes.data.content)
              ? booksRes.data.content
              : [];
            list.forEach((b: any) => {
              if (b && b.book_id) {
                catalogMap[String(b.book_id)] = b;
              }
            });
            break;
          }
        } catch {
          // Thử URL tiếp theo
        }
      }

      // Đồng bộ số dư Ví Khoai của User
      fetchWalletBalance(workingBaseUrl, headers);

      // 2. Gọi GET /api/cart (chuẩn Controller mới) hoặc fallback GET /api/home/cart/items
      let rawCartItems: any[] | null = null;
      try {
        const cartRes = await axios.get(`${workingBaseUrl}/api/cart`, {
          headers,
          timeout: 6000,
        });
        if (Array.isArray(cartRes.data)) {
          rawCartItems = cartRes.data;
        }
      } catch {
        try {
          const fallbackRes = await axios.get(`${workingBaseUrl}/api/home/cart/items`, {
            headers,
            timeout: 6000,
          });
          if (Array.isArray(fallbackRes.data)) {
            rawCartItems = fallbackRes.data;
          }
        } catch {
          rawCartItems = null;
        }
      }

      // 3. Nếu user đã đăng nhập và giỏ hàng trong DB chưa từng được seed mẫu lần đầu tiên,
      //    tự động khởi tạo 4 cuốn sách thật từ bảng `book` vào bảng `cart_item` trong MySQL
      const alreadySeeded = await AsyncStorage.getItem(CART_DB_SEEDED_KEY);
      const realBooksList = Object.values(catalogMap).filter(
        (b: any) => b && b.status !== 'DELETED'
      );

      if (
        rawCartItems !== null &&
        rawCartItems.length === 0 &&
        !alreadySeeded &&
        realBooksList.length > 0 &&
        headers.Authorization
      ) {
        const sampleBooks = realBooksList.slice(0, 4);
        const sampleDays: RentalDurationDays[] = [7, 14, 30, 7];
        for (let i = 0; i < sampleBooks.length; i++) {
          const b: any = sampleBooks[i];
          const days = sampleDays[i % sampleDays.length];
          const baseKhoai = resolveBaseKhoaiForBook(b.book_id, b.rent_price);
          const price = calculateDynamicKhoai(baseKhoai, days);
          try {
            await axios.post(
              `${workingBaseUrl}/api/cart/add`,
              { bookId: b.book_id, planKey: String(days), price },
              { headers, timeout: 5000 }
            );
          } catch {
            try {
              await axios.post(
                `${workingBaseUrl}/api/home/cart/add`,
                { bookId: b.book_id, planKey: String(days), price },
                { headers, timeout: 5000 }
              );
            } catch {
              // Bỏ qua nếu không thể thêm
            }
          }
        }
        await AsyncStorage.setItem(CART_DB_SEEDED_KEY, 'true');

        // Đọc lại danh sách từ MySQL sau khi seed
        try {
          const reloadRes = await axios.get(`${workingBaseUrl}/api/cart`, {
            headers,
            timeout: 6000,
          });
          if (Array.isArray(reloadRes.data)) {
            rawCartItems = reloadRes.data;
          }
        } catch {
          try {
            const reloadFallback = await axios.get(`${workingBaseUrl}/api/home/cart/items`, {
              headers,
              timeout: 6000,
            });
            if (Array.isArray(reloadFallback.data)) {
              rawCartItems = reloadFallback.data;
            }
          } catch {
            // Giữ nguyên
          }
        }
      }

      // 4. Nếu tài khoản đã có dữ liệu thật trong bảng cart_item MySQL
      if (rawCartItems !== null) {
        if (rawCartItems.length > 0) {
          await AsyncStorage.setItem(CART_DB_SEEDED_KEY, 'true');
        }
        const mapped = rawCartItems.map((item, idx) =>
          mapRawCartDtoToModel(item, idx, workingBaseUrl, catalogMap)
        );
        setCartItems(mapped);
        if (preserveSelection) {
          const validIds = new Set(mapped.map((m) => m.cartItemId));
          setSelectedIds((prev) => prev.filter((id) => validIds.has(id)));
        } else {
          setSelectedIds([]);
        }
        setLoading(false);
        return;
      }

      // 5. Trường hợp người dùng chưa đăng nhập JWT (khách xem giỏ hàng):
      //    Hiển thị các sách thật lấy trực tiếp từ bảng `book` trong MySQL
      if (realBooksList.length > 0 && !alreadySeeded) {
        const guestItems = realBooksList.slice(0, 5).map((b: any, idx: number) =>
          mapRawCartDtoToModel(
            {
              cartItemId: idx + 1,
              bookId: b.book_id,
              title: b.bookName,
              author: b.author,
              coverUrl: b.img_url,
              description: b.description,
              rentPrice: b.rent_price,
              rentalDays: 7,
            },
            idx,
            workingBaseUrl,
            catalogMap
          )
        );
        setCartItems(guestItems);
      } else {
        setCartItems([]);
      }
      setLoading(false);
    },
    [activeBaseUrl, fetchWalletBalance, getAuthHeaders, mapRawCartDtoToModel]
  );

  useEffect(() => {
    fetchCartFromDatabase(false);
  }, [fetchCartFromDatabase]);

  // ==============================================================
  // 2. QUẢN LÝ CHECKBOX CHỌN SÁCH (GIỮ NGUYÊN 100% KHI MỞ QUICK VIEW)
  // ==============================================================
  const isItemSelected = (cartItemId: number) => selectedIds.includes(cartItemId);

  const toggleSelectItem = (cartItemId: number) => {
    setSelectedIds((prev) =>
      prev.includes(cartItemId) ? prev.filter((id) => id !== cartItemId) : [...prev, cartItemId]
    );
  };

  const isAllSelected =
    cartItems.length > 0 && cartItems.every((item) => selectedIds.includes(item.cartItemId));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(cartItems.map((item) => item.cartItemId));
    }
  };

  // ==============================================================
  // 3. CẬP NHẬT SỐ NGÀY THUÊ (PUT /api/cart/{cartItemId}/duration)
  // ==============================================================
  const handleSelectDuration = async (item: CartItemModel, newDays: RentalDurationDays) => {
    setDurationPickerItem(null);
    if (item.rentalDays === newDays) return;

    const newPriceKhoai = calculateDynamicKhoai(item.baseKhoai, newDays);

    // Cập nhật ngay trên UI để phản hồi tức thì
    setCartItems((prev) =>
      prev.map((ci) =>
        ci.cartItemId === item.cartItemId
          ? { ...ci, rentalDays: newDays, priceKhoai: newPriceKhoai }
          : ci
      )
    );
    // Nếu đang mở Quick View của chính sách đó thì đồng bộ luôn
    setQuickViewItem((prev) =>
      prev && prev.cartItemId === item.cartItemId
        ? { ...prev, rentalDays: newDays, priceKhoai: newPriceKhoai }
        : prev
    );

    setUpdatingItemId(item.cartItemId);
    try {
      const headers = await getAuthHeaders();
      try {
        // Gọi endpoint chuẩn PUT /api/cart/{cartItemId}/duration
        const res = await axios.put(
          `${activeBaseUrl}/api/cart/${item.cartItemId}/duration`,
          { days: newDays },
          { headers, timeout: 6000 }
        );
        if (res.data && typeof res.data.priceKhoai === 'number') {
          setCartItems((prev) =>
            prev.map((ci) =>
              ci.cartItemId === item.cartItemId
                ? {
                    ...ci,
                    rentalDays: normalizeRentalDays(res.data.rentalDays),
                    priceKhoai: res.data.priceKhoai,
                  }
                : ci
            )
          );
        }
      } catch {
        // Fallback đồng bộ vào bảng cart_item MySQL qua POST /api/home/cart/add
        await axios.post(
          `${activeBaseUrl}/api/home/cart/add`,
          {
            bookId: item.bookId,
            planKey: String(newDays),
            price: newPriceKhoai,
          },
          { headers, timeout: 6000 }
        );
      }
    } catch {
      // Giữ giá trị đã tính chuẩn trên state nếu người dùng chưa đăng nhập
    } finally {
      setUpdatingItemId(null);
    }
  };

  // ==============================================================
  // 4. XÓA TỪNG CUỐN KHỎI GIỎ HÀNG (DELETE /api/cart/{cartItemId})
  // ==============================================================
  const handleRemoveItem = async (item: CartItemModel) => {
    // Cập nhật danh sách và selectedIds ngay lập tức
    setCartItems((prev) => prev.filter((ci) => ci.cartItemId !== item.cartItemId));
    setSelectedIds((prev) => prev.filter((id) => id !== item.cartItemId));

    try {
      const headers = await getAuthHeaders();
      try {
        await axios.delete(`${activeBaseUrl}/api/cart/${item.cartItemId}`, {
          headers,
          timeout: 6000,
        });
      } catch {
        await axios.delete(`${activeBaseUrl}/api/home/cart/items/${item.cartItemId}`, {
          headers,
          timeout: 6000,
        });
      }
    } catch {
      // Đã xóa trên giao diện
    }
  };

  // ==============================================================
  // 5. TÍNH TỔNG SỐ LƯỢNG & TỔNG KHOAI THANH TOÁN
  // ==============================================================
  const selectedItems = cartItems.filter((item) => selectedIds.includes(item.cartItemId));
  const selectedCount = selectedItems.length;
  const totalPriceKhoai = selectedItems.reduce((sum, item) => sum + item.priceKhoai, 0);

  // ==============================================================
  // 6. XỬ LÝ NÚT "ĐỌC THỬ" & "THUÊ NGAY" (POST /api/cart/checkout)
  // ==============================================================
  const handleReadTrial = () => {
    if (selectedCount === 1) {
      navigate('reader', selectedItems[0].bookData);
    }
  };

  const handleCheckout = async () => {
    if (selectedCount === 0 || submittingCheckout) return;

    const token = await AsyncStorage.getItem('userToken');
    if (!isLoggedIn && !token) {
      showLoginAlert('Vui lòng đăng nhập tài khoản để thực hiện thuê sách bằng Khoai.');
      return;
    }

    setSubmittingCheckout(true);
    try {
      const headers = await getAuthHeaders();
      let checkoutResult: any = null;

      try {
        // 1. Gọi API chuẩn POST /api/cart/checkout với danh sách cartItemIds đã chọn
        const res = await axios.post(
          `${activeBaseUrl}/api/cart/checkout`,
          { cartItemIds: selectedIds },
          { headers, timeout: 8000 }
        );
        checkoutResult = res.data;
      } catch (primaryErr: any) {
        const status = primaryErr?.response?.status;
        // Nếu lỗi nghiệp vụ từ CartController (ví dụ: không đủ Khoai -> 400), ném lỗi ngay
        if (status === 400 && primaryErr?.response?.data?.message) {
          throw primaryErr;
        }

        // 2. Fallback sang POST /api/home/checkout (xử lý @Transactional trên OrderServiceImpl)
        const fallbackPayload = {
          paymentMethod: 'POTATO_WALLET',
          discountAmount: 0,
          items: selectedItems.map((si) => ({
            bookId: si.bookId,
            cartItemId: si.cartItemId,
            planKey: String(si.rentalDays),
            durationDays: si.rentalDays,
            price: si.priceKhoai,
          })),
        };
        const fallbackRes = await axios.post(
          `${activeBaseUrl}/api/home/checkout`,
          fallbackPayload,
          { headers, timeout: 8000 }
        );
        checkoutResult = fallbackRes.data;
      }

      const paidKhoai =
        checkoutResult?.totalKhoaiPaid !== undefined
          ? checkoutResult.totalKhoaiPaid
          : totalPriceKhoai;
      const remainingKhoai =
        checkoutResult?.remainingPotatoBalance !== undefined
          ? checkoutResult.remainingPotatoBalance
          : potatoBalance !== null
          ? Math.max(0, potatoBalance - totalPriceKhoai)
          : null;

      if (typeof remainingKhoai === 'number') {
        setPotatoBalance(remainingKhoai);
      }

      // Loại bỏ các mục đã thanh toán khỏi state và tải lại giỏ hàng từ DB
      setSelectedIds([]);
      await fetchCartFromDatabase(false);

      Alert.alert(
        'Thuê sách thành công!',
        `${
          checkoutResult?.message ||
          `Đã thanh toán thuê ${selectedCount} cuốn sách và thêm vào Tủ Sách Cá Nhân.`
        }\n\n• Đã thanh toán: -${paidKhoai} Khoai${
          typeof remainingKhoai === 'number' ? `\n• Số dư Ví Khoai còn lại: ${remainingKhoai} Khoai` : ''
        }`,
        [
          {
            text: 'Xem Tủ sách',
            onPress: () => navigateTab('bookshelf'),
          },
          {
            text: 'Tiếp tục ở Giỏ hàng',
            style: 'cancel',
          },
        ]
      );
    } catch (err: any) {
      const serverMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        (typeof err?.response?.data === 'string' ? err.response.data : null) ||
        'Không thể thực hiện giao dịch thuê sách. Vui lòng kiểm tra số dư Khoai hoặc thử lại.';

      Alert.alert('Thanh toán chưa hoàn tất', serverMsg, [
        {
          text: 'Nạp thêm Khoai',
          onPress: () => navigateTab('offers'),
        },
        {
          text: 'Đóng',
          style: 'cancel',
        },
      ]);
    } finally {
      setSubmittingCheckout(false);
    }
  };

  // ==============================================================
  // RENDER TỪNG THẺ SÁCH TRONG GIỎ (CART ITEM CARD)
  // ==============================================================
  const renderCartItem = ({ item }: { item: CartItemModel }) => {
    const isSelected = isItemSelected(item.cartItemId);
    const hasValidCover = Boolean(item.coverUrl && !failedImages[item.bookId]);
    const isUpdatingThis = updatingItemId === item.cartItemId;

    return (
      <View
        style={[
          styles.itemCard,
          {
            backgroundColor: colors.cardBg,
            borderColor: isSelected ? colors.accent : colors.cardBorder,
          },
        ]}
      >
        {/* Nút xóa từng cuốn (Icon thùng rác nhỏ góc phải trên) */}
        <TouchableOpacity
          style={styles.deleteIconBtn}
          onPress={() => handleRemoveItem(item)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.7}
        >
          <Ionicons name="trash-outline" size={18} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* Checkbox chọn sách */}
        <TouchableOpacity
          style={styles.itemCheckArea}
          onPress={() => toggleSelectItem(item.cartItemId)}
          activeOpacity={0.75}
        >
          <View
            style={[
              styles.checkbox,
              {
                borderColor: isSelected ? colors.accent : colors.textSecondary,
                backgroundColor: isSelected ? colors.accent : 'transparent',
              },
            ]}
          >
            {isSelected && <Ionicons name="checkmark" size={14} color={colors.accentText} />}
          </View>
        </TouchableOpacity>

        {/* Ảnh bìa sách thật (Tỷ lệ 3:4, bo góc 6px) - Bấm vào mở Quick View Popup */}
        <TouchableOpacity
          style={[
            styles.bookCoverWrapper,
            {
              backgroundColor: colors.placeholderBg,
              borderColor: colors.cardBorder,
            },
          ]}
          activeOpacity={0.85}
          onPress={() => setQuickViewItem(item)}
        >
          {hasValidCover ? (
            <Image
              source={{ uri: item.coverUrl! }}
              style={styles.bookCoverImage}
              resizeMode="cover"
              onError={() =>
                setFailedImages((prev) => ({
                  ...prev,
                  [item.bookId]: true,
                }))
              }
            />
          ) : (
            <View style={styles.coverFallback}>
              <Ionicons name="book-outline" size={24} color={colors.textSecondary} />
              <Text style={[styles.coverFallbackText, { color: colors.textSecondary }]}>
                HALM
              </Text>
            </View>
          )}
          <View style={[styles.coverQuickBadge, { backgroundColor: 'rgba(24, 23, 22, 0.72)' }]}>
            <Ionicons name="eye-outline" size={11} color="#F7F5F0" />
          </View>
        </TouchableOpacity>

        {/* Thông tin sách + Nút Chi tiết + Dropdown chọn ngày + Giá Khoai */}
        <View style={styles.itemContent}>
          {/* Hàng Tiêu đề + Nút "Chi tiết" cạnh tên sách */}
          <View style={styles.titleRow}>
            <Text
              style={[styles.bookTitle, { color: colors.textPrimary }]}
              numberOfLines={2}
            >
              {item.title}
            </Text>
          </View>

          <View style={styles.authorAndDetailRow}>
            <Text
              style={[styles.bookAuthor, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {item.author}
            </Text>
            <TouchableOpacity
              style={[
                styles.quickDetailBtn,
                {
                  borderColor: colors.cardBorder,
                  backgroundColor: colors.chipBg,
                },
              ]}
              onPress={() => setQuickViewItem(item)}
              activeOpacity={0.75}
            >
              <Ionicons name="information-circle-outline" size={13} color={colors.accent} />
              <Text style={[styles.quickDetailBtnText, { color: colors.accent }]}>
                Chi tiết
              </Text>
            </TouchableOpacity>
          </View>

          {/* Hàng dưới: Pill Dropdown chọn mốc ngày thuê [ X ngày ▾ ] + Giá Khoai */}
          <View style={styles.bottomItemRow}>
            <TouchableOpacity
              style={[
                styles.durationPillBtn,
                {
                  backgroundColor: colors.chipBg,
                  borderColor: colors.accent,
                },
              ]}
              onPress={() => setDurationPickerItem(item)}
              activeOpacity={0.8}
            >
              <Ionicons name="calendar-outline" size={13} color={colors.accent} />
              <Text style={[styles.durationPillText, { color: colors.textPrimary }]}>
                {item.rentalDays} ngày
              </Text>
              <Ionicons name="chevron-down" size={13} color={colors.accent} />
            </TouchableOpacity>

            <View style={styles.priceRow}>
              {isUpdatingThis ? (
                <ActivityIndicator size="small" color={colors.accent} />
              ) : (
                <>
                  <Text style={[styles.priceValue, { color: colors.accent }]}>
                    {item.priceKhoai}
                  </Text>
                  <Text style={[styles.priceUnit, { color: colors.accent }]}> Khoai 🥔</Text>
                </>
              )}
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.screenBg }]}>
      <ExpoStatusBar style={isDark ? 'light' : 'dark'} />

      {/* ============================================================== */}
      {/* HEADER GIỎ HÀNG KÈM SỐ DƯ KHOAI THỰC TẾ                        */}
      {/* ============================================================== */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.cardBg,
            borderBottomColor: colors.cardBorder,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.headerBackBtn,
            {
              backgroundColor: colors.screenBg,
              borderColor: colors.cardBorder,
            },
          ]}
          onPress={goBack}
          activeOpacity={0.75}
        >
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Giỏ hàng</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            {cartItems.length > 0 ? `${cartItems.length} tác phẩm trong giỏ` : 'Chưa có sách'}
          </Text>
        </View>

        {potatoBalance !== null ? (
          <TouchableOpacity
            style={[
              styles.walletBadge,
              {
                backgroundColor: colors.chipBg,
                borderColor: colors.cardBorder,
              },
            ]}
            onPress={() => navigateTab('offers')}
            activeOpacity={0.8}
          >
            <Text style={[styles.walletBadgeText, { color: colors.accent }]}>
              🥔 {potatoBalance}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.headerRightSpacer} />
        )}
      </View>

      {/* ============================================================== */}
      {/* DANH SÁCH SÁCH TRONG GIỎ HOẶC EMPTY STATE                       */}
      {/* ============================================================== */}
      {loading ? (
        <View style={styles.emptyStateContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Đang đồng bộ giỏ hàng từ cơ sở dữ liệu...
          </Text>
        </View>
      ) : cartItems.length === 0 ? (
        <View style={styles.emptyStateContainer}>
          <View
            style={[
              styles.emptyIconCircle,
              {
                backgroundColor: colors.cardBg,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            <Ionicons
              name="cart-outline"
              size={56}
              color={colors.textSecondary}
              style={{ opacity: 0.55 }}
            />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
            Giỏ hàng của bạn đang trống
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Hãy thêm những cuốn sách yêu thích vào giỏ để lựa chọn kỳ hạn thuê phù hợp.
          </Text>
          <TouchableOpacity
            style={[styles.exploreBtn, { backgroundColor: colors.accent }]}
            activeOpacity={0.85}
            onPress={() => navigateTab('home')}
          >
            <Ionicons name="compass-outline" size={18} color={colors.accentText} />
            <Text style={[styles.exploreBtnText, { color: colors.accentText }]}>
              Khám phá sách
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={cartItems}
          keyExtractor={(item) => String(item.cartItemId)}
          renderItem={renderCartItem}
          contentContainerStyle={styles.listContentContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* ============================================================== */}
      {/* BOTTOM STICKY CHECKOUT BAR (GHIM CỐ ĐỊNH TRÊN BOTTOM TAB BAR)  */}
      {/* ============================================================== */}
      {cartItems.length > 0 && (
        <View
          style={[
            styles.stickyBottomBar,
            {
              backgroundColor: colors.cardBg,
              borderTopColor: colors.cardBorder,
            },
          ]}
        >
          {/* Cột trái: Checkbox "Tất cả" + Đếm số lượng (Đã chọn: X cuốn) */}
          <TouchableOpacity
            style={styles.checkoutLeftCol}
            onPress={toggleSelectAll}
            activeOpacity={0.75}
          >
            <View style={styles.selectAllRow}>
              <View
                style={[
                  styles.checkbox,
                  {
                    borderColor: isAllSelected ? colors.accent : colors.textSecondary,
                    backgroundColor: isAllSelected ? colors.accent : 'transparent',
                  },
                ]}
              >
                {isAllSelected && (
                  <Ionicons name="checkmark" size={14} color={colors.accentText} />
                )}
              </View>
              <Text style={[styles.selectAllLabel, { color: colors.textPrimary }]}>
                Tất cả
              </Text>
            </View>
            <Text style={[styles.selectedCountCaption, { color: colors.textSecondary }]}>
              Đã chọn: {selectedCount} cuốn
            </Text>
          </TouchableOpacity>

          {/* Cột giữa: Nhãn "Tổng thanh toán" + Số Khoai (Font to đậm, màu Accent) */}
          <View style={styles.checkoutMiddleCol}>
            <Text style={[styles.totalPaymentLabel, { color: colors.textSecondary }]}>
              Tổng thanh toán
            </Text>
            <Text
              style={[styles.totalPaymentAmount, { color: colors.accent }]}
              numberOfLines={1}
            >
              {totalPriceKhoai} Khoai
            </Text>
          </View>

          {/* Cột phải: Xử lý nút hành động theo đúng số lượng sách đang chọn */}
          <View style={styles.checkoutRightCol}>
            {/* Khi chọn ĐÚNG 1 CUỐN: Hiện nút phụ "Đọc thử" */}
            {selectedCount === 1 && (
              <TouchableOpacity
                style={[
                  styles.trialActionBtn,
                  {
                    borderColor: colors.accent,
                    backgroundColor: 'transparent',
                  },
                ]}
                onPress={handleReadTrial}
                activeOpacity={0.8}
              >
                <Text style={[styles.trialActionBtnText, { color: colors.accent }]}>
                  Đọc thử
                </Text>
              </TouchableOpacity>
            )}

            {/* Nút chính:
                - Chọn 1 cuốn: "Thuê ngay"
                - Chọn >= 2 cuốn: "Thuê [N] sách" (Ẩn nút Đọc thử)
                - Chọn 0 cuốn: Disabled
            */}
            <TouchableOpacity
              disabled={selectedCount === 0 || submittingCheckout}
              style={[
                styles.primaryCheckoutBtn,
                {
                  backgroundColor:
                    selectedCount === 0 ? colors.disabledBg : colors.accent,
                },
              ]}
              onPress={handleCheckout}
              activeOpacity={0.85}
            >
              {submittingCheckout ? (
                <ActivityIndicator size="small" color={colors.accentText} />
              ) : (
                <Text
                  style={[
                    styles.primaryCheckoutBtnText,
                    {
                      color:
                        selectedCount === 0 ? colors.disabledText : colors.accentText,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {selectedCount >= 2
                    ? `Thuê ${selectedCount} sách`
                    : 'Thuê ngay'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ============================================================== */}
      {/* MODAL 1: BOTTOM SHEET CHỌN MỐC NGÀY THUÊ (7, 14, 30, 90 NGÀY) */}
      {/* ============================================================== */}
      <Modal
        visible={durationPickerItem !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setDurationPickerItem(null)}
      >
        <TouchableOpacity
          style={[styles.modalBackdrop, { backgroundColor: colors.modalOverlay }]}
          activeOpacity={1}
          onPress={() => setDurationPickerItem(null)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[
              styles.durationSheetContainer,
              {
                backgroundColor: colors.cardBg,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            <View style={[styles.sheetHandle, { backgroundColor: colors.cardBorder }]} />
            <View style={styles.sheetHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>
                  Chọn thời hạn thuê sách
                </Text>
                {durationPickerItem && (
                  <Text
                    style={[styles.sheetSubtitle, { color: colors.textSecondary }]}
                    numberOfLines={1}
                  >
                    {durationPickerItem.title}
                  </Text>
                )}
              </View>
              <TouchableOpacity
                onPress={() => setDurationPickerItem(null)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.durationOptionsList}>
              {durationPickerItem &&
                RENTAL_DURATION_OPTIONS.map((opt) => {
                  const isActive = durationPickerItem.rentalDays === opt.days;
                  const optionPrice = calculateDynamicKhoai(
                    durationPickerItem.baseKhoai,
                    opt.days
                  );
                  return (
                    <TouchableOpacity
                      key={opt.days}
                      style={[
                        styles.durationOptionItem,
                        {
                          backgroundColor: isActive ? colors.chipBg : colors.screenBg,
                          borderColor: isActive ? colors.accent : colors.cardBorder,
                        },
                      ]}
                      activeOpacity={0.8}
                      onPress={() => handleSelectDuration(durationPickerItem, opt.days)}
                    >
                      <View style={styles.durationOptionLeft}>
                        <View
                          style={[
                            styles.radioOuter,
                            {
                              borderColor: isActive ? colors.accent : colors.textSecondary,
                            },
                          ]}
                        >
                          {isActive && (
                            <View
                              style={[
                                styles.radioInner,
                                { backgroundColor: colors.accent },
                              ]}
                            />
                          )}
                        </View>
                        <View>
                          <Text
                            style={[
                              styles.durationOptionLabel,
                              {
                                color: isActive ? colors.accent : colors.textPrimary,
                              },
                            ]}
                          >
                            {opt.label}
                          </Text>
                          <Text
                            style={[
                              styles.durationOptionSub,
                              { color: colors.textSecondary },
                            ]}
                          >
                            {opt.subtitle}
                          </Text>
                        </View>
                      </View>

                      <Text style={[styles.durationOptionPrice, { color: colors.accent }]}>
                        {optionPrice} Khoai 🥔
                      </Text>
                    </TouchableOpacity>
                  );
                })}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ============================================================== */}
      {/* MODAL 2: QUICK VIEW POPUP XEM NHANH SÁCH (~65% MÀN HÌNH)       */}
      {/* Đóng Popup giữ nguyên 100% trạng thái checkbox đang tích chọn  */}
      {/* ============================================================== */}
      <Modal
        visible={quickViewItem !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setQuickViewItem(null)}
      >
        <View style={[styles.modalBackdrop, { backgroundColor: colors.modalOverlay }]}>
          <View
            style={[
              styles.quickViewModalCard,
              {
                backgroundColor: colors.cardBg,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            {/* Header Quick View */}
            <View
              style={[
                styles.quickViewHeader,
                { borderBottomColor: colors.cardBorder },
              ]}
            >
              <Text style={[styles.quickViewHeaderTitle, { color: colors.textPrimary }]}>
                Thông tin tác phẩm
              </Text>
              <TouchableOpacity
                onPress={() => setQuickViewItem(null)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close-circle" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Nội dung chi tiết sách */}
            {quickViewItem && (
              <ScrollView
                style={styles.quickViewScroll}
                contentContainerStyle={styles.quickViewScrollContent}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.quickViewHeroRow}>
                  <View
                    style={[
                      styles.quickViewCoverBox,
                      {
                        backgroundColor: colors.placeholderBg,
                        borderColor: colors.cardBorder,
                      },
                    ]}
                  >
                    {quickViewItem.coverUrl && !failedImages[quickViewItem.bookId] ? (
                      <Image
                        source={{ uri: quickViewItem.coverUrl }}
                        style={styles.bookCoverImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.coverFallback}>
                        <Ionicons
                          name="book-outline"
                          size={34}
                          color={colors.textSecondary}
                        />
                        <Text
                          style={[
                            styles.coverFallbackText,
                            { color: colors.textSecondary },
                          ]}
                        >
                          HALM BOOK
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.quickViewMetaCol}>
                    <Text
                      style={[styles.quickViewBookTitle, { color: colors.textPrimary }]}
                    >
                      {quickViewItem.title}
                    </Text>
                    <Text
                      style={[styles.quickViewAuthor, { color: colors.textSecondary }]}
                    >
                      Tác giả: {quickViewItem.author}
                    </Text>

                    <View
                      style={[
                        styles.quickViewPriceBadge,
                        {
                          backgroundColor: colors.chipBg,
                          borderColor: colors.accent,
                        },
                      ]}
                    >
                      <Text style={[styles.quickViewPriceLabel, { color: colors.textSecondary }]}>
                        Gói {quickViewItem.rentalDays} ngày:
                      </Text>
                      <Text style={[styles.quickViewPriceValue, { color: colors.accent }]}>
                        {' '}
                        {quickViewItem.priceKhoai} Khoai 🥔
                      </Text>
                    </View>

                    <Text style={[styles.quickViewBaseHint, { color: colors.textSecondary }]}>
                      Giá gốc 7 ngày: {quickViewItem.baseKhoai} Khoai
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.quickViewSummaryBox,
                    {
                      backgroundColor: colors.screenBg,
                      borderColor: colors.cardBorder,
                    },
                  ]}
                >
                  <Text style={[styles.quickViewSummaryTitle, { color: colors.textPrimary }]}>
                    Tóm tắt nội dung
                  </Text>
                  <Text style={[styles.quickViewSummaryText, { color: colors.textSecondary }]}>
                    {quickViewItem.description}
                  </Text>
                </View>
              </ScrollView>
            )}

            {/* Đáy Popup: Nút "Đóng / Quay lại giỏ hàng" */}
            <View
              style={[
                styles.quickViewFooter,
                { borderTopColor: colors.cardBorder },
              ]}
            >
              <TouchableOpacity
                style={[styles.quickViewCloseBtn, { backgroundColor: colors.accent }]}
                activeOpacity={0.85}
                onPress={() => setQuickViewItem(null)}
              >
                <Ionicons
                  name="return-up-back-outline"
                  size={18}
                  color={colors.accentText}
                />
                <Text style={[styles.quickViewCloseBtnText, { color: colors.accentText }]}>
                   Quay lại giỏ hàng
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 12 : 52,
    paddingBottom: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  headerBackBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  headerSubtitle: {
    fontSize: 11,
    marginTop: 2,
    fontFamily: 'Inter_400Regular',
  },
  walletBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  walletBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Roboto_700Bold',
  },
  headerRightSpacer: {
    width: 38,
  },

  // Checkbox
  checkbox: {
    width: 21,
    height: 21,
    borderRadius: 6,
    borderWidth: 1.8,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Danh sách thẻ sách
  listContentContainer: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 180,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
    position: 'relative',
  },
  deleteIconBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 2,
    padding: 4,
  },
  itemCheckArea: {
    paddingRight: 10,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Ảnh bìa tỷ lệ 3:4
  bookCoverWrapper: {
    width: 72,
    height: 96,
    borderRadius: 6,
    borderWidth: 1,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  bookCoverImage: {
    width: '100%',
    height: '100%',
  },
  coverFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  coverFallbackText: {
    fontSize: 9,
    fontWeight: '700',
    marginTop: 3,
    textAlign: 'center',
  },
  coverQuickBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Nội dung thẻ sách
  itemContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
    minHeight: 96,
  },
  titleRow: {
    paddingRight: 26,
  },
  bookTitle: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  authorAndDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    gap: 8,
  },
  bookAuthor: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  quickDetailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  quickDetailBtnText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },

  // Hàng dưới: Pill Dropdown chọn ngày + Giá Khoai
  bottomItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  durationPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
  },
  durationPillText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '800',
    fontFamily: 'Roboto_700Bold',
  },
  priceUnit: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Roboto_700Bold',
  },

  // Empty State & Loading
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 90,
  },
  emptyIconCircle: {
    width: 108,
    height: 108,
    borderRadius: 54,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  emptySubtitle: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 22,
    fontFamily: 'Inter_400Regular',
  },
  exploreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 10,
  },
  exploreBtnText: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },

  // Bottom Sticky Checkout Bar (3 cột rõ ràng)
  stickyBottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 78,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderTopWidth: 1,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  checkoutLeftCol: {
    justifyContent: 'center',
    paddingRight: 6,
  },
  selectAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  selectAllLabel: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  selectedCountCaption: {
    fontSize: 11,
    marginTop: 3,
    fontFamily: 'Inter_400Regular',
  },
  checkoutMiddleCol: {
    flex: 1,
    alignItems: 'flex-end',
    paddingHorizontal: 8,
  },
  totalPaymentLabel: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },
  totalPaymentAmount: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 1,
    fontFamily: 'Roboto_700Bold',
  },
  checkoutRightCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trialActionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trialActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  primaryCheckoutBtn: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 96,
  },
  primaryCheckoutBtnText: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'PlusJakartaSans_700Bold',
  },

  // Modal Backdrop
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },

  // Modal 1: Duration Picker Sheet
  durationSheetContainer: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 20,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  sheetHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  sheetSubtitle: {
    fontSize: 12,
    marginTop: 2,
    fontFamily: 'Inter_400Regular',
  },
  durationOptionsList: {
    gap: 10,
  },
  durationOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.2,
  },
  durationOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
  },
  durationOptionLabel: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  durationOptionSub: {
    fontSize: 11,
    marginTop: 2,
    fontFamily: 'Inter_400Regular',
  },
  durationOptionPrice: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Roboto_700Bold',
  },

  // Modal 2: Quick View Popup (~65% màn hình)
  quickViewModalCard: {
    width: '100%',
    maxWidth: 440,
    maxHeight: SCREEN_HEIGHT * 0.66,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  quickViewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
  },
  quickViewHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  quickViewScroll: {
    flexGrow: 0,
  },
  quickViewScrollContent: {
    padding: 16,
  },
  quickViewHeroRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 16,
  },
  quickViewCoverBox: {
    width: 96,
    height: 128,
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  quickViewMetaCol: {
    flex: 1,
    justifyContent: 'center',
  },
  quickViewBookTitle: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  quickViewAuthor: {
    fontSize: 13,
    marginTop: 4,
    fontFamily: 'Inter_400Regular',
  },
  quickViewPriceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 10,
  },
  quickViewPriceLabel: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  quickViewPriceValue: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'Roboto_700Bold',
  },
  quickViewBaseHint: {
    fontSize: 11,
    marginTop: 6,
    fontFamily: 'Inter_400Regular',
  },
  quickViewSummaryBox: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  quickViewSummaryTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  quickViewSummaryText: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: 'Inter_400Regular',
  },
  quickViewFooter: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  quickViewCloseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
  },
  quickViewCloseBtnText: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
});
