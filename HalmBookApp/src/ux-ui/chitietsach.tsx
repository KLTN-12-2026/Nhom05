import { CANDIDATE_API_URLS } from './apiService';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ArrowLeft,
  BookOpen,
  ChevronRight,
  Clock,
  Eye,
  Gift,
  Heart,
  Play,
  Quote,
  RefreshCw,
  Star as StarIcon,
} from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';
import { ComponentRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  AppState,
  Dimensions,
  Easing,
  Image,
  ImageStyle,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import axios from 'axios';
import { getBookCoverSource } from './bookCovers';
import { useAppNavigation } from './navigation';
import { getBookRealChapters, getBookChapterLabel } from './bookContentService';
import { useBookFavorite } from './useBookFavorite';
import {
  BookAccessDetail,
  checkBookAccessDetailApi,
  checkEvaluateEligibilityApi,
  fetchBookshelfFromApi,
  isPersonalOrLocalBook,
} from './rentalService';
import RentBookModal, { RentSuccessPayload } from './RentBookModal';
import SupportTicketModal from './SupportTicketModal';

const { width, height } = Dimensions.get('window');
const reviewerAvatarStyle: ImageStyle = { width: 34, height: 34, borderRadius: 17 };

// CẤU HÌNH KẾT NỐI BACKEND SPRING BOOT + MYSQL






// MÀU SẮC THƯƠNG HIỆU ĐỒNG BỘ TRANG CHỦ APP
const BRAND = {
  primary: '#9A8BC2',
  secondary: '#D8B36A',
};

// --- COMPONENT HIỆU ỨNG SAO VÀ VŨ TRỤ (TỪ TRANG CHỦ APP) ---

// Hào quang tinh vân (Nebula) chớp nở chậm rãi
const Nebula = () => {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 5000, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 5000, useNativeDriver: true }),
      ])
    ).start();
  }, [anim]);

  return (
    <>
      {/* Góc trên trái (Ánh tím) */}
      <Animated.View
        style={{
          position: 'absolute',
          top: -100,
          left: -100,
          width: 350,
          height: 350,
          borderRadius: 175,
          backgroundColor: BRAND.primary,
          opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.03, 0.12] }),
          transform: [
            {
              scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.2] }),
            },
          ],
        }}
      />
      {/* Góc dưới phải (Ánh vàng) */}
      <Animated.View
        style={{
          position: 'absolute',
          bottom: -100,
          right: -100,
          width: 400,
          height: 400,
          borderRadius: 200,
          backgroundColor: BRAND.secondary,
          opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.05] }),
          transform: [
            {
              scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1.2, 0.8] }),
            },
          ],
        }}
      />
    </>
  );
};

// Sao băng rơi chéo màn hình
const ShootingStar = ({ delay, top, left }: any) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    ).start();
  }, [anim, delay]);

  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [0, width] });
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, height * 0.8] });
  const opacity = anim.interpolate({ inputRange: [0, 0.1, 0.8, 1], outputRange: [0, 1, 1, 0] });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top,
        left,
        width: 80,
        height: 2,
        backgroundColor: '#fff',
        transform: [{ rotate: '45deg' }, { translateX }, { translateY }],
        opacity,
        shadowColor: BRAND.secondary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 10,
      }}
    />
  );
};

// Ngôi sao lấp lánh (Tốc độ và độ trễ ngẫu nhiên)
const TwinkleStar = ({ duration, top, left, size, color }: any) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.1, duration, useNativeDriver: true }),
      ])
    ).start();
  }, [anim, duration]);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top,
        left,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        opacity: anim,
        shadowColor: color,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 6,
      }}
    />
  );
};

// Quản lý tổng thể Background Dark Mode Bầu Trời Sao của Trang Chủ App
const DarkModeBackgroundEffects = ({ visible }: { visible: boolean }) => {
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacityAnim, {
      toValue: visible ? 1 : 0,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [opacityAnim, visible]);

  const { stars, shootingStars } = useMemo(() => {
    const starsList = Array.from({ length: 110 }).map((_, i) => ({
      id: i,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      duration: Math.random() * 500 + 300,
      size: Math.random() * 3 + 1,
      color:
        Math.random() > 0.7
          ? BRAND.secondary
          : Math.random() > 0.5
          ? '#48dbfb'
          : BRAND.primary,
    }));

    const shootingList = Array.from({ length: 3 }).map((_, i) => ({
      id: `shoot_${i}`,
      top: `${Math.random() * -20}%`,
      left: `${Math.random() * 60}%`,
      delay: Math.random() * 8000 + 2000,
    }));

    return { stars: starsList, shootingStars: shootingList };
  }, []);

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        { opacity: opacityAnim, zIndex: 0, overflow: 'hidden' },
      ]}
      pointerEvents="none"
    >
      <Nebula />
      {stars.map((s) => (
        <TwinkleStar
          key={s.id}
          top={s.top}
          left={s.left}
          duration={s.duration}
          size={s.size}
          color={s.color}
        />
      ))}
      {shootingStars.map((s) => (
        <ShootingStar key={s.id} top={s.top} left={s.left} delay={s.delay} />
      ))}
    </Animated.View>
  );
};

// -------------------------------------------------------------

interface BookDetailProps {
  book: {
    id: string;
    title: string;
    img_url?: string;
    coverImage?: string | null;
    author?: string;
    chapter?: string;
    tag?: string;
    pages?: number;
    total_pages?: number;
    total_chapters?: number;
    chapters?: any[];
    reads?: string;
    rating?: string;
    summary?: string;
    desc?: string;
    description?: string;
    price?: number;
    rent_price?: number;
    category_name?: string;
    isPersonal?: boolean;
    fileUri?: string;
  };
  onBack: () => void;
  onStartReading: (
    initialChapterIndex?: number,
    options?: { startFromBeginning?: boolean; isTrialMode?: boolean }
  ) => void;
}

interface ChapterItem {
  id: number;
  chapterNum: string;
  title: string;
  readTime: string;
}

interface ReviewItem {
  evaluateId: number;
  star: number;
  content: string;
  likesCount?: number;
  createdAt?: string;
  customerName?: string;
  avatarUrl?: string;
  replies?: ReviewItem[];
}

const normalizeVietnamese = (str: string): string =>
  str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();

const formatDisplayName = (value: string): string => value
  .toLocaleLowerCase('vi-VN')
  .replace(/(^|\s)\S/g, (letter) => letter.toLocaleUpperCase('vi-VN'));

const formatDisplayLabel = (value: string): string => {
  const normalized = value.toLocaleLowerCase('vi-VN').trim();
  return normalized ? normalized.charAt(0).toLocaleUpperCase('vi-VN') + normalized.slice(1) : normalized;
};

/**
 * Hàm tìm kiếm và xác định chính xác mã sách thật trong cơ sở dữ liệu MySQL
 */
const resolveDatabaseBookId = async (
  rawId?: string,
  title?: string
): Promise<{ bookId: string; rentPrice?: number }> => {
  const safeId = (rawId || '').trim();
  const safeTitle = (title || '').trim();

  // 1. Kiểm tra mã trực tiếp với endpoint /api/home/books/{bookId}
  if (safeId) {
    for (const baseUrl of CANDIDATE_API_URLS) {
      try {
        const res = await axios.get(`${baseUrl}/api/home/books/${safeId}`, { timeout: 3000 });
        const b = res.data;
        if (b && (b.book_id || b.id)) {
          return {
            bookId: String(b.book_id || b.id),
            rentPrice: b.rent_price,
          };
        }
      } catch {
        // Tiếp tục kiểm tra candidate khác
      }
    }
  }

  // 2. Tìm kiếm trong danh mục sách thật từ MySQL qua GET /api/home/books
  for (const baseUrl of CANDIDATE_API_URLS) {
    try {
      const res = await axios.get(`${baseUrl}/api/home/books`, {
        params: { page: 0, size: 50 },
        timeout: 4000,
      });
      const raw = res.data;
      const list = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.content)
        ? raw.content
        : Array.isArray(raw?.data)
        ? raw.data
        : [];

      if (list.length > 0) {
        if (safeTitle) {
          const normTitle = normalizeVietnamese(safeTitle);
          const matched = list.find((b: any) => {
            const bTitle = String(b.bookName || b.title || '');
            return (
              bTitle.toLowerCase() === safeTitle.toLowerCase() ||
              normalizeVietnamese(bTitle) === normTitle ||
              bTitle.toLowerCase().includes(safeTitle.toLowerCase()) ||
              safeTitle.toLowerCase().includes(bTitle.toLowerCase())
            );
          });
          if (matched && (matched.book_id || matched.id)) {
            return {
              bookId: String(matched.book_id || matched.id),
              rentPrice: matched.rent_price,
            };
          }
        }

        // Nếu safeId khớp với 1 cuốn trong list
        if (safeId) {
          const matchedById = list.find(
            (b: any) => String(b.book_id || b.id).toUpperCase() === safeId.toUpperCase()
          );
          if (matchedById) {
            return {
              bookId: String(matchedById.book_id || matchedById.id),
              rentPrice: matchedById.rent_price,
            };
          }
        }

        // Fallback: Sách đầu tiên có thật trong DB
        const first = list[0];
        if (first && (first.book_id || first.id)) {
          return {
            bookId: String(first.book_id || first.id),
            rentPrice: first.rent_price,
          };
        }
      }
    } catch {
      // Tiếp tục candidate khác
    }
  }

  // Fallback an toàn tới cuốn sách kinh điển có sẵn trong MySQL: KD001 (AQ chính truyện)
  return { bookId: 'KD001', rentPrice: 25 };
};

// Xác định giá Khoai cơ bản
const resolveBaseKhoaiForBook = (bookId: string, rawRentPrice?: number | null): number => {
  if (typeof rawRentPrice === 'number' && rawRentPrice > 0) {
    return Math.round(rawRentPrice);
  }
  const upper = (bookId || '').toUpperCase();
  if (upper.startsWith('KD')) return 25;
  if (upper.startsWith('LS')) return 22;
  if (upper.startsWith('VH')) return 20;
  if (upper.startsWith('TT')) return 18;
  return 15;
};

// Lấy thể loại thật của sách (không dùng dữ liệu ảo)
const getStandardCategory = (book: any, dbBook?: any): string => {
  return dbBook?.category_name || book?.category_name || book?.tag || 'Chưa phân loại';
};

// Lấy tác giả thật của sách (không dùng dữ liệu ảo)
const getBookAuthor = (book: any, dbBook?: any): string => {
  return dbBook?.author || book?.author || 'Chưa cập nhật';
};

// Giới thiệu sách thật từ Database (không dùng dữ liệu ảo)
const getBookShortIntro = (book: any, dbBook?: any): string => {
  return dbBook?.description || book?.summary || book?.desc || book?.description || '';
};

// Trích dẫn sách (chỉ hiển thị nếu DB có dữ liệu thật)
const getFeaturedQuote = (book: any): { quote: string; source: string } | null => {
  if (book?.quote && typeof book.quote === 'string' && book.quote.trim().length > 0) {
    return {
      quote: book.quote,
      source: book?.quote_source || '— Trích dẫn tác phẩm',
    };
  }
  return null;
};

// Hiển thị số chương chính xác theo từng cuốn sách
const getBookChapterDisplay = (book: any, chaptersList: ChapterItem[]): string => {
  return getBookChapterLabel(book);
};

// Danh sách chương thật từ Database / Tác phẩm số hoá
const getBookChapters = (book: any): ChapterItem[] => {
  const realList = getBookRealChapters(book);
  if (realList && realList.length > 0) {
    return realList.map((c: any, index: number) => {
      const wordCount = (c.content?.join(' ') || '').split(/\s+/).length;
      const minutes = Math.max(3, Math.round(wordCount / 180));
      return {
        id: c.id || index + 1,
        chapterNum: String(index + 1).padStart(2, '0'),
        title: c.title || `Chương ${index + 1}`,
        readTime: `${minutes} phút`,
      };
    });
  }
  return [];
};

export default function BookDetailScreen({ book, onBack, onStartReading }: BookDetailProps) {
  const { navigate, navigateTab, isDarkMode, setFooterVisible, isLoggedIn, showLoginAlert, lang } = useAppNavigation();
  const themeStyles = useMemo(() => getThemedStyles(isDarkMode), [isDarkMode]);
  const isPersonalBook = useMemo(() => isPersonalOrLocalBook(book), [book]);

  const [rentalStatus, setRentalStatus] = useState<'checking' | 'rented' | 'unrented' | 'unknown'>(() =>
    isPersonalOrLocalBook(book) ? 'rented' : 'checking'
  );
  const [accessDetail, setAccessDetail] = useState<BookAccessDetail | null>(null);
  const [showRentModal, setShowRentModal] = useState(false);
  const [showTrialChoiceModal, setShowTrialChoiceModal] = useState(false);
  const [rentSuccessBanner, setRentSuccessBanner] = useState<string | null>(null);
  const [showInsufficientProgressModal, setShowInsufficientProgressModal] = useState(false);
  const [reviewSystemErrorModal, setReviewSystemErrorModal] = useState<string | null>(null);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [isWritingReview, setIsWritingReview] = useState(false);
  const [showSupportChatModal, setShowSupportChatModal] = useState(false);
  const [supportUserInfo, setSupportUserInfo] = useState({
    customerId: '',
    name: '',
    email: '',
    phone: '',
    avatarUrl: '',
  });
  const detailScrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const [isInCart, setIsInCart] = useState(false);
  const [cartItemId, setCartItemId] = useState<number | null>(null);
  const [showAlreadyInCartModal, setShowAlreadyInCartModal] = useState(false);
  const [isRemovingFromCart, setIsRemovingFromCart] = useState(false);
  const [removeCartError, setRemoveCartError] = useState<string | null>(null);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [realBookId, setRealBookId] = useState<string>(book.id || 'KD001');
  const [dbBookDetails, setDbBookDetails] = useState<any>(null);
  // Use the selected book ID, never the cart resolver's fallback to a different book.
  const favoriteBook = useMemo(() => ({
    id: String(book.id),
    title: book.title,
    author: book.author,
    chapter: book.chapter,
    category_name: book.category_name,
    img_url: book.img_url,
    coverImage: book.coverImage || undefined,
  }), [book.id, book.title, book.author, book.chapter, book.category_name, book.img_url, book.coverImage]);
  const { isLiked, isBusy: isFavoriteBusy, message: favoriteMessage, toggle: toggleFavorite } = useBookFavorite(favoriteBook, isLoggedIn);
  const [savedChapter, setSavedChapter] = useState<{ chapterNum: number; title: string } | null>(null);
  const [chapterRowHeight, setChapterRowHeight] = useState(0);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState<string | null>(null);
  const [reviewLoadAttempt, setReviewLoadAttempt] = useState(0);
  const [reviewStar, setReviewStar] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const scrollOffset = useRef(0);

  // Unified Top-Right Toast Notification System with 3s running progress bar & close button
  const [topToast, setTopToast] = useState<{
    id: number;
    message: string;
    type?: 'success' | 'favorite' | 'info' | 'error';
  } | null>(null);
  const toastProgressAnim = useRef(new Animated.Value(1)).current;
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hideTopToast = useCallback(() => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    toastProgressAnim.stopAnimation();
    setTopToast(null);
  }, [toastProgressAnim]);

  const showTopToast = useCallback(
    (message: string, type: 'success' | 'favorite' | 'info' | 'error' = 'success') => {
      if (!message) return;
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
        toastTimerRef.current = null;
      }
      toastProgressAnim.stopAnimation();
      toastProgressAnim.setValue(1);
      setTopToast({ id: Date.now(), message, type });

      Animated.timing(toastProgressAnim, {
        toValue: 0,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: false,
      }).start();

      toastTimerRef.current = setTimeout(() => {
        hideTopToast();
      }, 3000);
    },
    [hideTopToast, toastProgressAnim]
  );

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
        toastTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (favoriteMessage) {
      showTopToast(favoriteMessage, isLiked ? 'favorite' : 'info');
    }
  }, [favoriteMessage, isLiked, showTopToast]);

  // Đảm bảo footer luôn hiển thị khi vừa mở màn hình chi tiết sách
  useEffect(() => {
    setFooterVisible?.(true);
    return () => {
      setFooterVisible?.(true);
    };
  }, [setFooterVisible]);

  // Lướt xuống dưới thì ẩn footer, lướt lên trên thì hiện lại
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentY = event.nativeEvent.contentOffset.y;
    const diff = currentY - scrollOffset.current;
    if (Math.abs(diff) > 8) {
      if (diff > 0 && currentY > 60) {
        setFooterVisible?.(false);
      } else if (diff < 0) {
        setFooterVisible?.(true);
      }
    }
    scrollOffset.current = currentY;
  };

  // Kiểm tra trạng thái thuê/quyền đọc thực tế từ Backend (GET /api/home/bookshelf/check-detail/{bookId})
  const verifyRentalAccess = useCallback(
    async (targetBookId: string, signal?: AbortSignal): Promise<BookAccessDetail | null> => {
      if (isPersonalBook) {
        setRentalStatus('rented');
        setAccessDetail(null);
        return null;
      }
      setRentalStatus('checking');
      try {
        const detail = await checkBookAccessDetailApi(targetBookId, signal);
        if (signal?.aborted) return null;
        setAccessDetail(detail);
        if (!detail.checkedFromServer) {
          setRentalStatus('unknown');
        } else if (detail.hasAccess && detail.status === 'ACTIVE') {
          setRentalStatus('rented');
        } else {
          setRentalStatus('unrented');
        }
        return detail;
      } catch {
        if (!signal?.aborted) {
          setRentalStatus('unknown');
        }
        return null;
      }
    },
    [isPersonalBook]
  );

  // Đồng bộ trạng thái sách có trong giỏ hàng hay chưa (GET /api/cart)
  const refreshCartMembership = useCallback(
    async (targetBookId: string) => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (!token) {
          setIsInCart(false);
          setCartItemId(null);
          return;
        }
        for (const baseUrl of CANDIDATE_API_URLS) {
          try {
            const cartRes = await axios.get(`${baseUrl}/api/cart`, {
              headers: { Authorization: `Bearer ${token}` },
              timeout: 3000,
            });
            const items = Array.isArray(cartRes.data) ? cartRes.data : [];
            const matchedItem = items.find(
              (item: any) =>
                String(item.bookId || item.book_id || '').toUpperCase() === targetBookId.toUpperCase() ||
                (item.title && item.title.toLowerCase() === book.title.toLowerCase())
            );
            if (matchedItem) {
              setIsInCart(true);
              setCartItemId(matchedItem.cartItemId ?? matchedItem.id ?? null);
            } else {
              setIsInCart(false);
              setCartItemId(null);
            }
            break;
          } catch {
            // Thử tiếp
          }
        }
      } catch {
        // Bỏ qua lỗi ngầm
      }
    },
    [book.title]
  );

  // Xác định chính xác mã sách thật trong DB MySQL, kiểm tra quyền thuê thật & trạng thái giỏ hàng
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    setRentSuccessBanner(null);

    const initializeRealBookAndCart = async () => {
      try {
        if (!isPersonalBook) {
          setRentalStatus('checking');
        }
        const resolved = await resolveDatabaseBookId(book.id, book.title);
        const resolvedId = resolved.bookId;
        if (!isMounted || controller.signal.aborted) return;
        setRealBookId(resolvedId);

        // Chạy song song: kiểm tra quyền thuê thật từ BE, tải chi tiết sách thật và trạng thái giỏ hàng
        const fetchDetailPromise = (async () => {
          for (const baseUrl of CANDIDATE_API_URLS) {
            try {
              const detailRes = await axios.get(`${baseUrl}/api/home/books/${resolvedId}`, {
                timeout: 3000,
                signal: controller.signal,
              });
              if (detailRes.data && isMounted) {
                setDbBookDetails(detailRes.data);
                break;
              }
            } catch {
              // Thử tiếp
            }
          }
        })();

        await Promise.all([
          verifyRentalAccess(resolvedId, controller.signal),
          fetchDetailPromise,
          refreshCartMembership(resolvedId),
        ]);
      } catch {
        if (isMounted && !isPersonalBook && !controller.signal.aborted) {
          setRentalStatus('unknown');
        }
      }
    };

    void initializeRealBookAndCart();
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [book.id, book.title, isLoggedIn, isPersonalBook, verifyRentalAccess, refreshCartMembership]);

  // Kiểm tra lại quyền thuê khi ứng dụng quay lại foreground
  useEffect(() => {
    if (isPersonalBook) return;
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void verifyRentalAccess(realBookId || book.id);
      }
    });
    return () => subscription.remove();
  }, [book.id, isPersonalBook, realBookId, verifyRentalAccess]);

  // Đọc tiến độ đọc thật từ AsyncStorage (chỉ dùng cho luồng đọc tiếp / đọc từ đầu, KHÔNG dùng để xác định trạng thái thuê)
  useEffect(() => {
    let isMounted = true;
    const loadReadingProgress = async () => {
      try {
        let stored = await AsyncStorage.getItem(`@halm_reading_progress_${book.id}`);
        if (!stored && realBookId && realBookId !== book.id) {
          stored = await AsyncStorage.getItem(`@halm_reading_progress_${realBookId}`);
        }
        if (stored) {
          const parsed = JSON.parse(stored);
          if (isMounted) setSavedChapter(parsed);
        } else {
          if (isMounted) setSavedChapter(null);
        }
      } catch {
        if (isMounted) setSavedChapter(null);
      }
    };
    void loadReadingProgress();
    return () => {
      isMounted = false;
    };
  }, [book.id, realBookId]);

  useEffect(() => {
    setChapterRowHeight(0);
  }, [book.id]);

  const categoryName = useMemo(() => getStandardCategory(book, dbBookDetails), [book, dbBookDetails]);
  const authorName = useMemo(() => getBookAuthor(book, dbBookDetails), [book, dbBookDetails]);
  const shortIntro = useMemo(() => getBookShortIntro(book, dbBookDetails), [book, dbBookDetails]);
  const featuredQuote = useMemo(() => getFeaturedQuote(book), [book]);
  const chapters = useMemo(() => getBookChapters(book), [book]);
  const chapterDisplay = useMemo(() => getBookChapterDisplay(book, chapters), [book, chapters]);
  useEffect(() => {
    let cancelled = false;
    const loadReviews = async () => {
      setReviewsLoading(true);
      setReviewsError(null);
      for (const baseUrl of CANDIDATE_API_URLS) {
        try {
          const response = await axios.get<ReviewItem[]>(`${baseUrl}/api/home/books/${encodeURIComponent(realBookId || book.id)}/evaluates`, { timeout: 4000 });
          if (cancelled) return;
          setReviews(Array.isArray(response.data) ? response.data : []);
          setReviewsLoading(false);
          return;
        } catch {
          // Thử địa chỉ API kế tiếp đã được cấu hình.
        }
      }
      if (!cancelled) {
        setReviewsError('Không thể tải đánh giá. Vui lòng thử lại sau.');
        setReviewsLoading(false);
      }
    };
    void loadReviews();
    return () => { cancelled = true; };
  }, [book.id, realBookId, reviewLoadAttempt]);

  const averageReview = reviews.length > 0
    ? (reviews.reduce((sum, review) => sum + (Number(review.star) || 0), 0) / reviews.length).toFixed(1)
    : '0.0';
  const displayRating = reviews.length > 0
    ? averageReview
    : (book.rating ? Number(book.rating).toFixed(1) : '5.0');
  const averageReviewValue = Math.max(0, Math.min(5, Number(averageReview)));
  const averageReviewStarCount = Math.ceil(averageReviewValue);
  const averageReviewFraction = averageReviewValue % 1;
  const renderRatingStars = (size: number) => Array.from({ length: averageReviewStarCount }, (_, index) => {
    const color = isDarkMode ? '#FBBF24' : '#B45309';
    const isFractionalStar = index === Math.floor(averageReviewValue) && averageReviewFraction > 0;
    return isFractionalStar ? (
      <View key={index} style={[themeStyles.fractionalStar, { width: size, height: size }]}>
        <StarIcon size={size} color={color} fill="none" />
        <View style={[themeStyles.fractionalStarFill, { width: size * averageReviewFraction, height: size }]}>
          <StarIcon size={size} color={color} fill={color} />
        </View>
      </View>
    ) : (
      <StarIcon key={index} size={size} color={color} fill={color} />
    );
  });

  const handleSelectReviewStar = async (star: number) => {
    if (isSubmittingReview) return;

    const token = await AsyncStorage.getItem('userToken');
    if (!isLoggedIn && !token) {
      showLoginAlert('Bạn cần đăng nhập tài khoản HALMBOOK để có thể đánh giá sách.');
      return;
    }

    setReviewStar(star);
  };

  const handleStartWritingReview = async () => {
    const token = await AsyncStorage.getItem('userToken');
    if (!isLoggedIn && !token) {
      showLoginAlert('Bạn cần đăng nhập tài khoản HALMBOOK để có thể đánh giá sách.');
      return;
    }

    if (reviewStar < 1) {
      setReviewStar(5);
    }
    setIsWritingReview(true);
  };

  const handleSubmitReview = async () => {
    if (isSubmittingReview) return;

    const token = await AsyncStorage.getItem('userToken');
    if (!isLoggedIn && !token) {
      showLoginAlert('Bạn cần đăng nhập tài khoản HALMBOOK để có thể đánh giá sách.');
      return;
    }

    if (reviewStar < 1) {
      Alert.alert('Đánh giá sách', 'Vui lòng chọn số sao đánh giá.');
      return;
    }

    if (!reviewText.trim()) {
      Alert.alert('Đánh giá sách', 'Vui lòng nhập nội dung đánh giá.');
      return;
    }

    setIsSubmittingReview(true);
    try {
      const targetBookId = realBookId || book.id;
      const eligibility = await checkEvaluateEligibilityApi(targetBookId);

      if (eligibility.status === 'AUTH_REQUIRED') {
        showLoginAlert(eligibility.message || 'Bạn cần đăng nhập tài khoản HALMBOOK để có thể đánh giá sách.');
        return;
      }

      if (eligibility.status === 'NETWORK_ERROR' || !eligibility.checkedFromServer) {
        setReviewSystemErrorModal(
          eligibility.message ||
            'Không thể kết nối máy chủ để xác minh tiến độ đọc. Vui lòng kiểm tra kết nối mạng và thử lại.'
        );
        return;
      }

      if (eligibility.status === 'INSUFFICIENT_PROGRESS' || !eligibility.canEvaluate || eligibility.readingPercentage < 50) {
        setShowInsufficientProgressModal(true);
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };
      let submittedReview: ReviewItem | null = null;
      let lastErr: any = null;

      for (const baseUrl of CANDIDATE_API_URLS) {
        try {
          const res = await axios.post<ReviewItem>(
            `${baseUrl}/api/home/books/${encodeURIComponent(targetBookId)}/evaluates`,
            {
              bookId: targetBookId,
              star: reviewStar,
              content: reviewText.trim(),
            },
            {
              headers,
              timeout: 6000,
            }
          );
          if (res.status === 201 || res.status === 200) {
            submittedReview = res.data || null;
            break;
          }
        } catch (err: any) {
          lastErr = err;
          const status = err?.response?.status;
          if (status === 401 || status === 403 || status === 400) {
            break;
          }
        }
      }

      if (submittedReview) {
        setReviewStar(0);
        setReviewText('');
        setIsWritingReview(false);
        setReviews((prev) => {
          if (submittedReview?.evaluateId && !prev.some((r) => r.evaluateId === submittedReview?.evaluateId)) {
            return [submittedReview, ...prev];
          }
          return prev;
        });
        setReviewLoadAttempt((v) => v + 1);
        showTopToast('Cảm ơn bạn đã gửi đánh giá cho cuốn sách này (+5 Khoai)!', 'success');
        Alert.alert('Thành công', 'Cảm ơn bạn đã gửi đánh giá cho cuốn sách này (+5 Khoai)!');
        return;
      }

      const errStatus = lastErr?.response?.status;
      const errCode = lastErr?.response?.data?.code;
      const errMessage = lastErr?.response?.data?.message;

      if (errStatus === 401 || errCode === 'AUTH_REQUIRED') {
        showLoginAlert(errMessage || 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để đánh giá sách.');
        return;
      }

      if (errStatus === 403 || errCode === 'INSUFFICIENT_READING_PROGRESS') {
        setShowInsufficientProgressModal(true);
        return;
      }

      setReviewSystemErrorModal(
        errMessage || 'Không thể gửi đánh giá do lỗi kết nối máy chủ. Vui lòng thử lại sau.'
      );
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleContinueReadingFromReviewModal = () => {
    setShowInsufficientProgressModal(false);
    scrollOffset.current = 0;
    setFooterVisible?.(true);
    detailScrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const handleOpenAdminFeedbackChat = async () => {
    setShowInsufficientProgressModal(false);
    try {
      const [rawCached, rawProfile, token] = await Promise.all([
        AsyncStorage.getItem('cachedUserProfile'),
        AsyncStorage.getItem('userProfile'),
        AsyncStorage.getItem('userToken'),
      ]);
      const parsed = rawCached ? JSON.parse(rawCached) : rawProfile ? JSON.parse(rawProfile) : null;
      if (parsed && typeof parsed === 'object') {
        setSupportUserInfo({
          customerId: String(parsed.customerId || parsed.customer_id || ''),
          name: String(parsed.customerName || parsed.fullName || parsed.name || ''),
          email: String(parsed.email || ''),
          phone: String(parsed.phone || parsed.phoneNumber || ''),
          avatarUrl: String(parsed.avatarUrl || parsed.avatar || ''),
        });
      }
      if (token) {
        for (const baseUrl of CANDIDATE_API_URLS) {
          try {
            const infoRes = await axios.get(`${baseUrl}/api/home/customer/info`, {
              headers: { Authorization: `Bearer ${token}` },
              timeout: 3500,
            });
            const info = infoRes.data;
            if (info && typeof info === 'object') {
              setSupportUserInfo({
                customerId: String(info.customerId || info.customer_id || ''),
                name: String(info.customerName || info.fullName || info.name || ''),
                email: String(info.email || ''),
                phone: String(info.phone || info.phoneNumber || ''),
                avatarUrl: String(info.avatarUrl || info.avatar || ''),
              });
              break;
            }
          } catch {
            // Thử tiếp
          }
        }
      }
    } catch {
      // Giữ thông tin mặc định nếu cache lỗi
    }
    setShowSupportChatModal(true);
  };

  const displayPrice = useMemo(() => {
    return resolveBaseKhoaiForBook(
      realBookId || book.id,
      dbBookDetails?.rent_price || book.rent_price || book.price
    );
  }, [realBookId, book.id, dbBookDetails, book.rent_price, book.price]);

  const handleRentedContinueReading = () => {
    const resumePage =
      accessDetail?.currentPage && accessDetail.currentPage > 0
        ? accessDetail.currentPage
        : savedChapter?.chapterNum || 1;
    onStartReading(Math.max(0, resumePage - 1), {
      startFromBeginning: false,
      isTrialMode: false,
    });
  };

  const handleRentedReadFromStart = () => {
    onStartReading(0, {
      startFromBeginning: true,
      isTrialMode: false,
    });
  };

  const handleOpenRentModal = async () => {
    if (rentalStatus === 'rented') return;
    const token = await AsyncStorage.getItem('userToken');
    if (!isLoggedIn && !token) {
      showLoginAlert('Đăng nhập để thuê sách bằng Khoai.', () => {
        void (async () => {
          const targetId = realBookId || book.id;
          const latest = await verifyRentalAccess(targetId);
          if (latest && latest.checkedFromServer && !latest.hasAccess) {
            setShowRentModal(true);
          }
        })();
      });
      return;
    }
    setShowRentModal(true);
  };

  const handleRentSuccess = async (result: RentSuccessPayload) => {
    setShowRentModal(false);
    const targetId = realBookId || book.id;
    // Chỉ cập nhật trạng thái đã thuê sau khi xác nhận lại từ Backend
    await Promise.all([
      verifyRentalAccess(targetId),
      refreshCartMembership(targetId),
      fetchBookshelfFromApi().catch(() => {}),
    ]);
    const summary =
      result.totalKhoaiPaid !== undefined
        ? `Thuê thành công ${result.rentedCount} cuốn (-${result.totalKhoaiPaid} Khoai${
            typeof result.remainingPotatoBalance === 'number'
              ? `, ví còn ${result.remainingPotatoBalance} Khoai`
              : ''
          }).`
        : result.message;
    setRentSuccessBanner(summary);
    showTopToast(summary, 'success');
  };

  const handleTrialReadPress = () => {
    if (savedChapter && savedChapter.chapterNum > 0) {
      setShowTrialChoiceModal(true);
      return;
    }
    onStartReading(0, { startFromBeginning: false, isTrialMode: true });
  };

  const handleTrialContinue = () => {
    setShowTrialChoiceModal(false);
    const resumeIdx = savedChapter
      ? Math.min(2, Math.max(0, savedChapter.chapterNum - 1))
      : 0;
    onStartReading(resumeIdx, { startFromBeginning: false, isTrialMode: true });
  };

  const handleTrialFromStart = () => {
    setShowTrialChoiceModal(false);
    onStartReading(0, { startFromBeginning: true, isTrialMode: true });
  };

  /**
   * XỬ LÝ THÊM SÁCH THẬT VÀO GIỎ HÀNG (DATABASE MYSQL QUA API)
   */
  const handleAddToCart = async () => {
    const token = await AsyncStorage.getItem('userToken');
    if (!isLoggedIn && !token) {
      showLoginAlert('Đăng nhập để thêm sách vào giỏ hàng.', () => handleAddToCart());
      return;
    }

    if (isInCart) {
      setRemoveCartError(null);
      setShowAlreadyInCartModal(true);
      return;
    }

    setIsAddingToCart(true);
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // Đảm bảo lấy đúng mã sách có sẵn trong Database
      const resolved = await resolveDatabaseBookId(realBookId || book.id, book.title);
      const targetBookId = resolved.bookId;

      let success = false;
      let lastErrorMessage = '';

      for (const baseUrl of CANDIDATE_API_URLS) {
        try {
          const res = await axios.post(
            `${baseUrl}/api/cart/add`,
            {
              bookId: targetBookId,
            },
            {
              headers,
              timeout: 6000,
            }
          );
          if (res.status === 200 || res.data?.success) {
            success = true;
            break;
          }
        } catch (err: any) {
          lastErrorMessage =
            err?.response?.data?.message || err?.message || 'Lỗi thêm vào giỏ hàng';
        }
      }

      if (success) {
        setIsInCart(true);
        showTopToast(`Đã thêm sách "${book.title}" vào giỏ hàng`, 'success');
        try {
          const freshToken = await AsyncStorage.getItem('userToken');
          if (freshToken) {
            for (const baseUrl of CANDIDATE_API_URLS) {
              try {
                const freshCartRes = await axios.get(`${baseUrl}/api/cart`, {
                  headers: { Authorization: `Bearer ${freshToken}` },
                  timeout: 3000,
                });
                const freshItems = Array.isArray(freshCartRes.data) ? freshCartRes.data : [];
                const matched = freshItems.find(
                  (item: any) =>
                    String(item.bookId || item.book_id || '').toUpperCase() === targetBookId.toUpperCase() ||
                    (item.title && item.title.toLowerCase() === book.title.toLowerCase())
                );
                if (matched) {
                  setCartItemId(matched.cartItemId ?? matched.id ?? null);
                }
                break;
              } catch {
                // Thử tiếp
              }
            }
          }
        } catch {
          // Bỏ qua lỗi ngầm
        }
      } else {
        Alert.alert(
          'Thông báo',
          lastErrorMessage || 'Không thể thêm sách vào giỏ hàng. Vui lòng thử lại sau.'
        );
      }
    } catch {
      Alert.alert('Lỗi', 'Đã xảy ra sự cố khi thêm sách vào giỏ hàng.');
    } finally {
      setIsAddingToCart(false);
    }
  };

  /**
   * XỬ LÝ XÓA SÁCH KHỎI GIỎ HÀNG (DELETE /api/cart/{cartItemId})
   */
  const handleRemoveFromCart = async () => {
    setIsRemovingFromCart(true);
    setRemoveCartError(null);
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        setIsInCart(false);
        setCartItemId(null);
        setShowAlreadyInCartModal(false);
        return;
      }

      let targetItemId = cartItemId;
      const targetBookId = (realBookId || book.id || '').toUpperCase();

      if (!targetItemId) {
        for (const baseUrl of CANDIDATE_API_URLS) {
          try {
            const cartRes = await axios.get(`${baseUrl}/api/cart`, {
              headers: { Authorization: `Bearer ${token}` },
              timeout: 3000,
            });
            const items = Array.isArray(cartRes.data) ? cartRes.data : [];
            const matched = items.find(
              (item: any) =>
                String(item.bookId || item.book_id || '').toUpperCase() === targetBookId ||
                (item.title && item.title.toLowerCase() === book.title.toLowerCase())
            );
            if (matched) {
              targetItemId = matched.cartItemId ?? matched.id ?? null;
              break;
            }
          } catch {
            // Thử baseUrl tiếp theo
          }
        }
      }

      if (!targetItemId) {
        setIsInCart(false);
        setCartItemId(null);
        setShowAlreadyInCartModal(false);
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };
      let deleteSuccess = false;

      for (const baseUrl of CANDIDATE_API_URLS) {
        try {
          const res = await axios.delete(`${baseUrl}/api/cart/${targetItemId}`, {
            headers,
            timeout: 6000,
          });
          if (res.status === 200 || res.data?.success) {
            deleteSuccess = true;
            break;
          }
        } catch {
          try {
            const fallbackRes = await axios.delete(`${baseUrl}/api/home/cart/items/${targetItemId}`, {
              headers,
              timeout: 6000,
            });
            if (fallbackRes.status === 200 || fallbackRes.data?.success) {
              deleteSuccess = true;
              break;
            }
          } catch {
            // Thử baseUrl tiếp theo
          }
        }
      }

      if (deleteSuccess) {
        setIsInCart(false);
        setCartItemId(null);
        setShowAlreadyInCartModal(false);
        showTopToast(`Đã bỏ sách "${book.title}" khỏi giỏ hàng`, 'info');
      } else {
        setRemoveCartError('Không thể xóa sách khỏi giỏ hàng. Vui lòng thử lại sau.');
      }
    } catch (err: any) {
      console.error('Lỗi khi xóa sách khỏi giỏ hàng:', err);
      setRemoveCartError('Đã xảy ra sự cố khi xóa sách khỏi giỏ hàng.');
    } finally {
      setIsRemovingFromCart(false);
    }
  };

  /**
   * ĐI ĐẾN GIỎ HÀNG
   */
  const handleGoToCart = () => {
    setShowAlreadyInCartModal(false);
    setRemoveCartError(null);
    navigate('cart');
  };

  return (
    <SafeAreaView style={themeStyles.safeArea}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        {...({ backgroundColor: isDarkMode ? '#111210' : '#ffffff' } as any)}
      />

      {/* HIỆU ỨNG BẦU TRỜI SAO VÀ SAO BĂNG ĐỒNG BỘ TRANG CHỦ APP */}
      <DarkModeBackgroundEffects visible={isDarkMode} />

      {/* Header Điều Hướng */}
      <View style={themeStyles.header}>
        <TouchableOpacity style={themeStyles.iconButton} onPress={onBack} activeOpacity={0.8}>
          <ArrowLeft size={20} color={isDarkMode ? '#EDE9DF' : '#1e293b'} />
        </TouchableOpacity>
        <Text style={themeStyles.headerTitle} numberOfLines={1}>
          {book.title}
        </Text>
        <View style={themeStyles.headerActions}>
          <TouchableOpacity
            style={themeStyles.giftIconButton}
            activeOpacity={0.8}
            onPress={() => {}}
            accessibilityRole="button"
            accessibilityLabel="Tặng quà"
          >
            <Gift size={19} color={isDarkMode ? '#F3DA7A' : '#D97706'} />
          </TouchableOpacity>
          <TouchableOpacity
            style={themeStyles.iconButton}
            onPress={() => {
              if (!isLoggedIn) {
                showLoginAlert('Vui lòng đăng nhập để lưu sách vào mục Yêu thích.');
                return;
              }
              void toggleFavorite();
            }}
            disabled={isFavoriteBusy}
            accessibilityRole="button"
            accessibilityLabel={isLiked ? 'Bỏ yêu thích sách' : 'Thêm sách vào yêu thích'}
            accessibilityState={{ selected: isLiked, disabled: isFavoriteBusy, busy: isFavoriteBusy }}
            activeOpacity={0.8}
          >
            {isFavoriteBusy ? <ActivityIndicator size="small" color="#e11d48" /> : <Heart
              size={20}
              color={isDarkMode ? '#E8656F' : '#e11d48'}
              fill={isLiked ? (isDarkMode ? '#E8656F' : '#e11d48') : 'none'}
            />}
          </TouchableOpacity>
        </View>
      </View>

      {/* THÔNG BÁO GÓC PHẢI TRÊN CÙNG (RUNNING TIMER BAR 3S & CLOSE X BUTTON) */}
      {topToast && (
        <View style={themeStyles.topToastWrapper} pointerEvents="box-none">
          <View
            style={[
              themeStyles.topToastCard,
              topToast.type === 'favorite'
                ? themeStyles.topToastCardFavorite
                : topToast.type === 'info'
                ? themeStyles.topToastCardInfo
                : topToast.type === 'error'
                ? themeStyles.topToastCardError
                : themeStyles.topToastCardSuccess,
            ]}
          >
            <View style={themeStyles.topToastBody}>
              <View
                style={[
                  themeStyles.topToastIconWrap,
                  topToast.type === 'favorite'
                    ? themeStyles.topToastIconWrapFavorite
                    : topToast.type === 'info'
                    ? themeStyles.topToastIconWrapInfo
                    : topToast.type === 'error'
                    ? themeStyles.topToastIconWrapError
                    : themeStyles.topToastIconWrapSuccess,
                ]}
              >
                {topToast.type === 'favorite' ? (
                  <Heart
                    size={15}
                    color={isLiked ? (isDarkMode ? '#F87171' : '#E11D48') : (isDarkMode ? '#94A3B8' : '#64748B')}
                    fill={isLiked ? (isDarkMode ? '#F87171' : '#E11D48') : 'none'}
                  />
                ) : topToast.type === 'info' ? (
                  <Ionicons name="information-circle" size={17} color={isDarkMode ? '#38BDF8' : '#0284C7'} />
                ) : topToast.type === 'error' ? (
                  <Ionicons name="alert-circle" size={17} color={isDarkMode ? '#F87171' : '#DC2626'} />
                ) : (
                  <Ionicons name="checkmark-circle" size={17} color={isDarkMode ? '#34D399' : '#059669'} />
                )}
              </View>
              <Text style={themeStyles.topToastText} numberOfLines={2}>
                {topToast.message}
              </Text>
              <TouchableOpacity
                style={themeStyles.topToastCloseBtn}
                onPress={hideTopToast}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityRole="button"
                accessibilityLabel="Đóng thông báo"
              >
                <Ionicons name="close" size={16} color={isDarkMode ? '#A6A29A' : '#64748B'} />
              </TouchableOpacity>
            </View>
            <View style={themeStyles.topToastProgressTrack}>
              <Animated.View
                style={[
                  themeStyles.topToastProgressBar,
                  {
                    width: toastProgressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                    backgroundColor:
                      topToast.type === 'favorite'
                        ? (isDarkMode ? '#F87171' : '#E11D48')
                        : topToast.type === 'info'
                        ? (isDarkMode ? '#38BDF8' : '#0284C7')
                        : topToast.type === 'error'
                        ? (isDarkMode ? '#F87171' : '#DC2626')
                        : (isDarkMode ? '#34D399' : '#059669'),
                  },
                ]}
              />
            </View>
          </View>
        </View>
      )}
      <ScrollView
        ref={detailScrollRef}
        style={themeStyles.scrollView}
        contentContainerStyle={{ paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Ô THỨ NHẤT: THÔNG TIN SÁCH CHÍNH (HERO SECTION) */}
        <View style={themeStyles.heroSection}>
          <View style={themeStyles.bookCoverLarge} accessibilityLabel="Ảnh bìa sách">
            {(() => {
              const coverSource = getBookCoverSource(
                realBookId || book.id,
                dbBookDetails?.img_url || (book as any).img_url
              );
              return coverSource ? (
                <Image source={coverSource} style={StyleSheet.absoluteFill} resizeMode="cover" />
              ) : (
                <View style={themeStyles.coverFallback}>
                  <BookOpen size={36} color="#ffffff" />
                  <Text style={themeStyles.coverText}>{"HALM\nBOOK"}</Text>
                </View>
              );
            })()}
          </View>

          <View style={themeStyles.heroInfo}>
            <View style={themeStyles.heroTopContent}>
              {/* Tên sách lớn, rõ nét */}
              <Text style={themeStyles.bookTitleLarge} numberOfLines={2}>
                {book.title}
              </Text>

              {/* Tác giả và Thể loại nằm sát nhau, hiển thị rõ ràng */}
              <View style={themeStyles.metaGroup}>
                <Text style={themeStyles.authorValue} numberOfLines={2}>
                  <Text style={themeStyles.authorLabel}>Tác Giả: </Text>
                  <Text style={themeStyles.authorName}>{formatDisplayName(authorName)}</Text>
                </Text>
                <View style={themeStyles.categoryBadge}>
                  <Text style={themeStyles.categoryText} numberOfLines={1}>
                    {formatDisplayLabel(categoryName)}
                  </Text>
                </View>
              </View>

              {/* Lượt đọc và số sao tách thoáng */}
              <View style={themeStyles.statsRow} accessibilityLabel="Lượt đọc và điểm đánh giá">
                <View style={themeStyles.statItem}>
                  <Eye size={15} color={isDarkMode ? '#38BDF8' : '#0284c7'} />
                  <Text style={themeStyles.statText} numberOfLines={1}>{book.reads || '1.2K'}</Text>
                </View>
                <View style={themeStyles.statItem}>
                  <StarIcon size={15} color={isDarkMode ? '#FBBF24' : '#B45309'} fill={isDarkMode ? '#FBBF24' : '#B45309'} />
                  <Text style={themeStyles.statText} numberOfLines={1}>{averageReview}</Text>
                </View>
              </View>
            </View>

            {rentalStatus === 'unrented' && (
              <Text style={themeStyles.priceText} numberOfLines={1} accessibilityLabel={`${displayPrice} Khoai`}>{displayPrice} Khoai 🥔</Text>
            )}
          </View>
        </View>

        {shortIntro.trim().length > 0 && (
          <View style={themeStyles.shortIntroContainer}>
            <Text style={themeStyles.shortIntroText} numberOfLines={3}>{shortIntro}</Text>
          </View>
        )}


        {/* Ô THỨ HAI: CÁC NÚT HÀNH ĐỘNG THEO TRẠNG THÁI THUÊ SÁCH THỰC TẾ */}
        <View style={themeStyles.actionRow}>
          {rentalStatus === 'checking' ? (
            <View style={themeStyles.actionStatusRow}>
              <ActivityIndicator size="small" color={isDarkMode ? '#D4AF37' : '#387367'} />
              <Text style={themeStyles.actionStatusText}>Đang xác minh trạng thái thuê sách...</Text>
            </View>
          ) : rentalStatus === 'unknown' ? (
            <View style={themeStyles.actionUnknownBox}>
              <Text style={themeStyles.actionUnknownText} numberOfLines={2}>
                Chưa xác minh được trạng thái thuê sách từ máy chủ.
              </Text>
              <TouchableOpacity
                style={themeStyles.actionRetryBtn}
                onPress={() => void verifyRentalAccess(realBookId || book.id)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Kiểm tra lại trạng thái thuê sách"
              >
                <RefreshCw size={14} color={isDarkMode ? '#111210' : '#ffffff'} />
                <Text style={themeStyles.actionRetryBtnText}>Kiểm tra lại</Text>
              </TouchableOpacity>
            </View>
          ) : rentalStatus === 'rented' ? (
            <>
              {/* Sách đã thuê còn hiệu lực: Chỉ hiển thị 2 nút Tiếp tục đọc & Đọc từ đầu */}
              <TouchableOpacity
                style={[themeStyles.btnContinueReading, { flex: 1 }]}
                onPress={handleRentedContinueReading}
                activeOpacity={0.88}
                accessibilityRole="button"
                accessibilityLabel="Tiếp tục đọc"
              >
                <Play
                  size={16}
                  color={isDarkMode ? '#111210' : '#ffffff'}
                  fill={isDarkMode ? '#111210' : '#ffffff'}
                />
                <Text style={themeStyles.btnContinueReadingText} numberOfLines={1}>
                  Tiếp tục đọc
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[themeStyles.btnReadPrimary, { flex: 1 }]}
                onPress={handleRentedReadFromStart}
                activeOpacity={0.88}
                accessibilityRole="button"
                accessibilityLabel="Đọc từ đầu"
              >
                <BookOpen size={16} color="#ffffff" />
                <Text style={themeStyles.btnReadPrimaryText} numberOfLines={1}>
                  Đọc từ đầu
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {/* Sách chưa thuê: Hiển thị 3 nút 1. Thuê sách | 2. Đọc thử | 3. Thêm giỏ */}
              <TouchableOpacity
                style={themeStyles.btnRentPrimary}
                onPress={handleOpenRentModal}
                activeOpacity={0.88}
                accessibilityRole="button"
                accessibilityLabel="Thuê sách"
              >
                <Ionicons
                  name="bag-handle-outline"
                  size={16}
                  color={isDarkMode ? '#111210' : '#ffffff'}
                />
                <Text style={themeStyles.btnRentPrimaryText} numberOfLines={1}>
                  Thuê sách
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={themeStyles.btnTrialRead}
                onPress={handleTrialReadPress}
                activeOpacity={0.88}
                accessibilityRole="button"
                accessibilityLabel="Đọc thử"
              >
                <BookOpen size={15} color={isDarkMode ? '#EDE9DF' : '#255B50'} />
                <Text style={themeStyles.btnTrialReadText} numberOfLines={1}>
                  Đọc thử
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  themeStyles.btnAddToCart,
                  isInCart && themeStyles.btnAddToCartActive,
                ]}
                onPress={handleAddToCart}
                activeOpacity={0.88}
                disabled={isAddingToCart}
                accessibilityRole="button"
                accessibilityLabel={isInCart ? 'Sách đã có trong giỏ hàng' : 'Thêm sách vào giỏ'}
              >
                {isAddingToCart ? (
                  <ActivityIndicator
                    size="small"
                    color={isInCart ? '#ffffff' : isDarkMode ? '#EDE9DF' : '#334155'}
                  />
                ) : (
                  <Ionicons
                    name={isInCart ? 'checkmark-circle' : 'cart-outline'}
                    size={16}
                    color={isInCart ? '#ffffff' : isDarkMode ? '#EDE9DF' : '#334155'}
                  />
                )}
                <Text
                  style={[
                    themeStyles.btnAddToCartText,
                    isInCart && themeStyles.btnAddToCartActiveText,
                  ]}
                  numberOfLines={1}
                >
                  {isAddingToCart ? 'Đang thêm' : isInCart ? 'Đã thêm' : 'Thêm giỏ'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Ô THỨ BA: TRÍCH ĐOẠN NỔI BẬT (CHỈ HIỂN THỊ KHI CÓ DỮ LIỆU TỪ DB) */}
        {featuredQuote && (
          <View style={themeStyles.sectionContainer}>
            <Text style={themeStyles.sectionTitle}>Trích Đoạn Tiêu Biểu</Text>
            <View style={themeStyles.quoteBox}>
              <View style={themeStyles.quoteHeaderRow}>
                <Quote size={18} color={isDarkMode ? '#D4AF37' : '#d97706'} />
                <Text style={themeStyles.quoteHeaderTitle}>Lời vàng tác phẩm</Text>
              </View>
              <Text style={themeStyles.quoteContentText}>{featuredQuote.quote}</Text>
              <Text style={themeStyles.quoteSourceText}>{featuredQuote.source}</Text>
            </View>
          </View>
        )}

        {/* Ô THỨ TƯ: DANH SÁCH CHƯƠNG */}
        <View style={themeStyles.sectionContainer}>
          <View style={themeStyles.sectionHeaderRow}>
            <Text style={themeStyles.sectionTitle}>Danh Sách Chương</Text>
          </View>

          {chapters.length > 0 ? (
            <ScrollView
              nestedScrollEnabled
              showsVerticalScrollIndicator
              style={[themeStyles.chapterListViewport, { height: Math.min(chapters.length, 5) * (chapterRowHeight || 64) + 2 }]}
              accessibilityLabel="Cuộn dọc để xem các chương"
            >
              <View style={themeStyles.chaptersCardBox}>
              {chapters.map((chap, index) => {
                const isCurrentChapter = savedChapter?.chapterNum === chap.id;
                return (
                  <TouchableOpacity
                    key={chap.id}
                    accessibilityRole="button"
                    accessibilityLabel={chap.title}
                    onLayout={index === 0 ? ({ nativeEvent }) => {
                      const measuredHeight = nativeEvent.layout.height;
                      setChapterRowHeight((current) => Math.abs(current - measuredHeight) > 0.5 ? measuredHeight : current);
                    } : undefined}
                    style={[
                      themeStyles.chapterRowItem,
                      isCurrentChapter && themeStyles.chapterRowActive,
                    ]}
                    activeOpacity={0.7}
                    onPress={() =>
                      onStartReading(
                        chap.id - 1,
                        rentalStatus === 'unrented' ? { isTrialMode: true } : undefined
                      )
                    }
                  >
                    <View style={themeStyles.chapterLeftCol}>
                      {/* Badge số thứ tự chương */}
                      <View
                        style={[
                          themeStyles.chapterNumBadge,
                          isCurrentChapter && themeStyles.chapterNumBadgeActive,
                        ]}
                      >
                        <Text
                          style={[
                            themeStyles.chapterNumText,
                            isCurrentChapter && themeStyles.chapterNumTextActive,
                          ]}
                        >
                          {chap.chapterNum}
                        </Text>
                      </View>

                      {/* Tiêu đề chương & thời lượng đọc */}
                      <View style={themeStyles.chapterInfoCol}>
                        <Text
                          style={[
                            themeStyles.chapterItemText,
                            isCurrentChapter && themeStyles.chapterItemTextActive,
                          ]}
                          numberOfLines={1}
                        >
                          {chap.title}
                        </Text>

                        <View style={themeStyles.chapterMetaRow}>
                          <Clock size={11} color={isDarkMode ? '#8A8780' : '#94a3b8'} />
                          <Text style={themeStyles.chapterReadTimeText}>
                            {chap.readTime}
                          </Text>
                          {isCurrentChapter && (
                            <View style={themeStyles.currentReadingPill}>
                              <Text style={themeStyles.currentReadingPillText}>Đang đọc</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>

                    <ChevronRight size={16} color={isDarkMode ? '#8A8780' : '#94a3b8'} />
                  </TouchableOpacity>
                );
              })}
              </View>
            </ScrollView>
          ) : (
            <View style={themeStyles.emptyBox}>
              <Text style={themeStyles.emptyText}>Chưa có danh sách chương cho cuốn sách này.</Text>
            </View>
          )}
        </View>

        <View style={themeStyles.sectionContainer}>
          <View style={themeStyles.reviewHeader}>
            <View>
              <Text style={themeStyles.sectionTitle}>
                Mức độ hài lòng của độc giả{' '}
                <Text style={themeStyles.reviewCountBadge}>
                  {`(${reviews.length} lượt đánh giá)`}
                </Text>
              </Text>
              <View
                style={themeStyles.reviewRatingRow}
                accessibilityLabel={`${displayRating} trên 5 sao`}
              >
                <Text style={themeStyles.reviewSummaryScoreText}>
                  {`${displayRating}/5`}
                </Text>
                <StarIcon
                  size={14}
                  color={isDarkMode ? '#FBBF24' : '#D99A25'}
                  fill={isDarkMode ? '#FBBF24' : '#D99A25'}
                  style={{ marginLeft: 4 }}
                />
              </View>
            </View>
          </View>

          {reviewsLoading ? (
            <View style={themeStyles.reviewStatus} accessibilityLiveRegion="polite">
              <ActivityIndicator size="small" color={isDarkMode ? '#D8B36A' : '#8B4A3C'} />
              <Text style={themeStyles.reviewStatusText}>Đang tải đánh giá...</Text>
            </View>
          ) : reviewsError ? (
            <View style={themeStyles.reviewStatus}>
              <Text style={themeStyles.reviewErrorText}>{reviewsError}</Text>
              <TouchableOpacity onPress={() => setReviewLoadAttempt((value) => value + 1)} accessibilityRole="button" style={themeStyles.reviewRetry}>
                <Text style={themeStyles.reviewRetryText}>Thử lại</Text>
              </TouchableOpacity>
            </View>
          ) : reviews.length === 0 ? (
            <View style={themeStyles.reviewEmpty}>
              <Text style={themeStyles.reviewEmptyTitle}>Chưa có đánh giá</Text>
              <Text style={themeStyles.reviewStatusText}>Hãy là người đầu tiên chia sẻ cảm nhận về cuốn sách này.</Text>
            </View>
          ) : (
            <View style={themeStyles.reviewList}>
              {reviews.map((review) => (
                <View key={review.evaluateId} style={themeStyles.reviewItem}>
                  <View style={themeStyles.reviewItemHeader}>
                    <View style={themeStyles.reviewerIdentity}>
                      {review.avatarUrl ? <Image source={{ uri: review.avatarUrl }} style={reviewerAvatarStyle} /> : (
                        <View style={themeStyles.reviewerAvatarFallback}>
                          <Text style={themeStyles.reviewerInitial}>{(review.customerName || 'Đ').trim().charAt(0).toUpperCase()}</Text>
                        </View>
                      )}
                      <View style={themeStyles.reviewerMeta}>
                        <Text style={themeStyles.reviewerName} numberOfLines={1}>{review.customerName || 'Độc giả HALM'}</Text>
                        <Text style={themeStyles.reviewDate}>{review.createdAt || ''}</Text>
                      </View>
                    </View>
                    <View style={themeStyles.reviewStars}>
                      {Array.from({ length: Math.max(0, Math.min(5, Number(review.star) || 0)) }, (_, index) => (
                        <StarIcon key={index} size={13} color="#D99A25" fill="#D99A25" />
                      ))}
                    </View>
                  </View>
                  <Text style={themeStyles.reviewContent}>{review.content}</Text>
                  <View style={themeStyles.reviewLike}>
                    <Ionicons name="thumbs-up-outline" size={15} color={isDarkMode ? '#D8B36A' : '#8B4A3C'} />
                    <Text style={themeStyles.reviewLikeText}>{review.likesCount || 0}</Text>
                  </View>
                  {review.replies?.map((reply) => (
                    <View key={reply.evaluateId} style={themeStyles.reviewReply}>
                      <Text style={themeStyles.reviewerName}>{reply.customerName || 'Độc giả HALM'}</Text>
                      <Text style={themeStyles.reviewDate}>{reply.createdAt || ''}</Text>
                      <Text style={themeStyles.reviewContent}>{reply.content}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          )}
          <View style={themeStyles.reviewComposer}>
            <View style={themeStyles.reviewStarPicker} accessibilityLabel="Chọn số sao đánh giá">
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => void handleSelectReviewStar(star)}
                  disabled={isSubmittingReview}
                  accessibilityRole="button"
                  accessibilityLabel={`${star} sao`}
                  accessibilityState={{ selected: reviewStar === star, disabled: isSubmittingReview }}
                >
                  <StarIcon
                    size={24}
                    color={star <= reviewStar ? '#D99A25' : (isDarkMode ? '#55534F' : '#C9C5BD')}
                    fill={star <= reviewStar ? '#D99A25' : 'none'}
                  />
                </TouchableOpacity>
              ))}
            </View>

            {/* Nút "Nhập đánh giá": hiển thị khi người dùng chưa mở khu vực nhập nội dung */}
            {!isWritingReview && !reviewText.trim() && (
              <TouchableOpacity
                style={themeStyles.requestReviewButton}
                onPress={handleStartWritingReview}
                disabled={isSubmittingReview}
                accessibilityRole="button"
                accessibilityLabel="Nhập đánh giá"
              >
                <Text style={themeStyles.requestReviewText}>Nhập đánh giá</Text>
              </TouchableOpacity>
            )}

            {/* Khu vực nhập nội dung đánh giá và nút Gửi đánh giá */}
            {(isWritingReview || reviewText.trim().length > 0) && (
              <>
                <TextInput
                  value={reviewText}
                  onChangeText={setReviewText}
                  editable={!isSubmittingReview}
                  multiline
                  maxLength={2000}
                  placeholder="Viết nội dung đánh giá..."
                  placeholderTextColor={isDarkMode ? '#8A8780' : '#85817A'}
                  style={themeStyles.reviewInput}
                  accessibilityLabel="Nội dung đánh giá"
                />
                <TouchableOpacity
                  onPress={() => void handleSubmitReview()}
                  disabled={!reviewText.trim() || isSubmittingReview}
                  accessibilityRole="button"
                  accessibilityLabel="Gửi đánh giá"
                  style={[
                    themeStyles.reviewSubmit,
                    (!reviewText.trim() || isSubmittingReview) && themeStyles.reviewSubmitDisabled,
                  ]}
                >
                  {isSubmittingReview ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <ActivityIndicator size="small" color={isDarkMode ? '#111210' : '#FFFFFF'} />
                      <Text style={themeStyles.reviewSubmitText}>Đang gửi...</Text>
                    </View>
                  ) : (
                    <Text style={themeStyles.reviewSubmitText}>Gửi đánh giá</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* Khoảng cách đáy */}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* MODAL THÔNG BÁO SÁCH ĐÃ CÓ TRONG GIỎ HÀNG */}
      <Modal
        visible={showAlreadyInCartModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!isRemovingFromCart) {
            setShowAlreadyInCartModal(false);
            setRemoveCartError(null);
          }
        }}
      >
        <View style={themeStyles.cartModalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => {
              if (!isRemovingFromCart) {
                setShowAlreadyInCartModal(false);
                setRemoveCartError(null);
              }
            }}
          />
          <View style={themeStyles.cartModalCard}>
            {/* Nút X đóng popup ở góc trên bên phải */}
            <TouchableOpacity
              style={themeStyles.cartModalCloseBtn}
              onPress={() => {
                if (!isRemovingFromCart) {
                  setShowAlreadyInCartModal(false);
                  setRemoveCartError(null);
                }
              }}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Đóng thông báo"
            >
              <Ionicons
                name="close"
                size={18}
                color={isDarkMode ? '#A39F99' : '#64748B'}
              />
            </TouchableOpacity>

            {/* Biểu tượng giỏ hàng */}
            <View style={themeStyles.cartModalIconWrap}>
              <Ionicons
                name="cart"
                size={26}
                color={isDarkMode ? '#D4AF37' : '#387367'}
              />
            </View>

            {/* Tiêu đề */}
            <Text style={themeStyles.cartModalTitle}>Sách đã có trong giỏ hàng</Text>

            {/* Nội dung thông báo */}
            <Text style={themeStyles.cartModalMessage}>
              Cuốn sách <Text style={themeStyles.cartModalBookTitle}>"{book.title}"</Text> hiện đã có trong giỏ hàng của bạn.
            </Text>

            {/* Thông báo lỗi nếu có */}
            {removeCartError ? (
              <Text style={themeStyles.cartModalError}>{removeCartError}</Text>
            ) : null}

            {/* Hai nút hành động nằm ngang */}
            <View style={themeStyles.cartModalButtonRow}>
              {/* Nút bên trái: Bỏ khỏi giỏ */}
              <TouchableOpacity
                style={[
                  themeStyles.cartModalBtnRemove,
                  isRemovingFromCart && themeStyles.cartModalBtnDisabled,
                ]}
                onPress={handleRemoveFromCart}
                disabled={isRemovingFromCart}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel="Bỏ sách khỏi giỏ hàng"
              >
                {isRemovingFromCart ? (
                  <ActivityIndicator
                    size="small"
                    color={isDarkMode ? '#F87171' : '#E11D48'}
                  />
                ) : (
                  <Text style={themeStyles.cartModalBtnRemoveText}>Bỏ khỏi giỏ</Text>
                )}
              </TouchableOpacity>

              {/* Nút bên phải: Đi đến giỏ */}
              <TouchableOpacity
                style={[
                  themeStyles.cartModalBtnGoCart,
                  isRemovingFromCart && themeStyles.cartModalBtnDisabled,
                ]}
                onPress={handleGoToCart}
                disabled={isRemovingFromCart}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Đi đến giỏ hàng"
              >
                <Text style={themeStyles.cartModalBtnGoCartText}>Đi đến giỏ</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL CHỌN CÁCH ĐỌC THỬ (KHI ĐÃ TỪNG ĐỌC SÁCH NÀY) */}
      <Modal
        visible={showTrialChoiceModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTrialChoiceModal(false)}
      >
        <View style={themeStyles.cartModalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setShowTrialChoiceModal(false)}
          />
          <View style={themeStyles.cartModalCard}>
            {/* Nút X đóng popup ở góc trên bên phải */}
            <TouchableOpacity
              style={themeStyles.cartModalCloseBtn}
              onPress={() => setShowTrialChoiceModal(false)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Đóng popup đọc thử"
            >
              <Ionicons
                name="close"
                size={18}
                color={isDarkMode ? '#A39F99' : '#64748B'}
              />
            </TouchableOpacity>

            <View style={themeStyles.cartModalIconWrap}>
              <BookOpen
                size={24}
                color={isDarkMode ? '#D4AF37' : '#387367'}
              />
            </View>

            <Text style={themeStyles.cartModalTitle}>Đọc thử tác phẩm</Text>

            <Text style={themeStyles.cartModalMessage}>
              Bạn đã từng đọc tác phẩm <Text style={themeStyles.cartModalBookTitle}>"{book.title}"</Text>
              {savedChapter?.chapterNum ? ` (đang ở Chương ${savedChapter.chapterNum})` : ''}. Bạn muốn tiếp tục vị trí đã đọc hay đọc lại từ đầu?
            </Text>

            <View style={themeStyles.cartModalButtonRow}>
              <TouchableOpacity
                style={themeStyles.trialChoiceSecondaryBtn}
                onPress={handleTrialFromStart}
                activeOpacity={0.78}
                accessibilityRole="button"
                accessibilityLabel="Đọc từ đầu"
              >
                <Text style={themeStyles.trialChoiceSecondaryText}>Đọc từ đầu</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={themeStyles.cartModalBtnGoCart}
                onPress={handleTrialContinue}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Tiếp tục đọc"
              >
                <Text style={themeStyles.cartModalBtnGoCartText}>Tiếp tục đọc</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* POPUP THUÊ SÁCH (SÁCH HIỆN TẠI + SÁCH TRONG GIỎ + CHỌN THỜI HẠN + TỔNG KẾT CỐ ĐỊNH) */}
      <RentBookModal
        visible={showRentModal}
        isDarkMode={isDarkMode}
        currentBook={{
          bookId: realBookId || book.id,
          title: book.title,
          author: formatDisplayName(authorName),
          coverUrl: dbBookDetails?.img_url || book.img_url || book.coverImage || null,
          rentPrice:
            typeof dbBookDetails?.rent_price === 'number' && dbBookDetails.rent_price > 0
              ? dbBookDetails.rent_price
              : typeof book.rent_price === 'number' && book.rent_price > 0
              ? book.rent_price
              : typeof book.price === 'number' && book.price > 0
              ? book.price
              : null,
        }}
        onClose={() => setShowRentModal(false)}
        onRentSuccess={handleRentSuccess}
        onRequireLogin={(msg) => showLoginAlert(msg, () => setShowRentModal(true))}
        onTopUpKhoai={() => navigateTab('offers')}
      />

      {/* POPUP CHƯA ĐỦ 50% TIẾN ĐỘ ĐỌC KHI ĐÁNH GIÁ SÁCH */}
      <Modal
        visible={showInsufficientProgressModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowInsufficientProgressModal(false)}
      >
        <View style={themeStyles.cartModalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setShowInsufficientProgressModal(false)}
          />
          <View style={themeStyles.cartModalCard}>
            <View style={themeStyles.cartModalIconWrap}>
              <BookOpen
                size={24}
                color={isDarkMode ? '#D4AF37' : '#387367'}
              />
            </View>

            <Text style={[themeStyles.cartModalTitle, { fontSize: 15.5, lineHeight: 22 }]}>
              {`Quý khách chưa thể đánh giá sách "${book.title}" vào thời điểm hiện tại.`}
            </Text>

            <Text style={themeStyles.cartModalMessage}>
              Để đảm bảo chất lượng đánh giá khách quan, độc giả cần hoàn thành tối thiểu 50% tiến độ đọc của tác phẩm trước khi gửi cảm nhận.
            </Text>

            <View style={themeStyles.cartModalButtonRow}>
              <TouchableOpacity
                style={[themeStyles.trialChoiceSecondaryBtn, { paddingHorizontal: 6 }]}
                onPress={handleContinueReadingFromReviewModal}
                activeOpacity={0.78}
                accessibilityRole="button"
                accessibilityLabel="Tiếp tục trải nghiệm"
              >
                <Text
                  style={[themeStyles.trialChoiceSecondaryText, { fontSize: 12.5 }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.85}
                >
                  Tiếp tục trải nghiệm
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[themeStyles.cartModalBtnGoCart, { paddingHorizontal: 6 }]}
                onPress={() => void handleOpenAdminFeedbackChat()}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Gửi tin nhắn HALMBOOK"
              >
                <Text
                  style={[themeStyles.cartModalBtnGoCartText, { fontSize: 12.5 }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.85}
                >
                  Gửi tin nhắn HALMBOOK
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* POPUP THÔNG BÁO LỖI KẾT NỐI KHI KIỂM TRA TIẾN ĐỘ ĐÁNH GIÁ (PHÂN BIỆT VỚI CHƯA ĐỦ 50%) */}
      <Modal
        visible={Boolean(reviewSystemErrorModal)}
        transparent
        animationType="fade"
        onRequestClose={() => setReviewSystemErrorModal(null)}
      >
        <View style={themeStyles.cartModalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setReviewSystemErrorModal(null)}
          />
          <View style={themeStyles.cartModalCard}>
            <View style={themeStyles.cartModalIconWrap}>
              <Ionicons
                name="cloud-offline-outline"
                size={25}
                color={isDarkMode ? '#F87171' : '#DC2626'}
              />
            </View>

            <Text style={themeStyles.cartModalTitle}>Không thể xác minh tiến độ đọc</Text>

            <Text style={themeStyles.cartModalMessage}>{reviewSystemErrorModal}</Text>

            <View style={themeStyles.cartModalButtonRow}>
              <TouchableOpacity
                style={themeStyles.cartModalBtnGoCart}
                onPress={() => setReviewSystemErrorModal(null)}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Đóng thông báo lỗi"
              >
                <Text style={themeStyles.cartModalBtnGoCartText}>Đã hiểu</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL NHẮN TIN HỖ TRỢ & GÓP Ý 2 CHIỀU VỚI ADMIN (TÁI SỬ DỤNG LUỒNG HIỆN CÓ) */}
      <SupportTicketModal
        visible={showSupportChatModal}
        onClose={() => setShowSupportChatModal(false)}
        customerId={supportUserInfo.customerId}
        customerName={supportUserInfo.name}
        customerEmail={supportUserInfo.email}
        customerPhone={supportUserInfo.phone}
        customerAvatar={supportUserInfo.avatarUrl}
        lang={lang}
      />
    </SafeAreaView>
  );
}

// Hàm xây dựng Styles chuẩn xác cho cả Light Mode và Dark Mode (theo màu sắc web TrangChu)
function getThemedStyles(isDarkMode: boolean) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: isDarkMode ? '#111210' : '#f8fafc',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: isDarkMode ? 'rgba(22, 24, 27, 0.92)' : '#ffffff',
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#262A33' : '#f1f5f9',
    },
    headerTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: isDarkMode ? '#EDE9DF' : '#0f172a',
      flex: 1,
      textAlign: 'center',
      marginHorizontal: 12,
    },
    iconButton: {
      width: 38,
      height: 38,
      backgroundColor: isDarkMode ? '#20242D' : '#f8fafc',
      borderRadius: 19,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: isDarkMode ? '#333842' : '#e2e8f0',
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    giftIconButton: {
      width: 38,
      height: 38,
      borderRadius: 19,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: isDarkMode ? 'rgba(212, 175, 55, 0.14)' : '#FFFBEB',
      borderWidth: 1,
      borderColor: isDarkMode ? 'rgba(212, 175, 55, 0.36)' : '#FDE68A',
    },
    scrollView: {
      flex: 1,
      backgroundColor: isDarkMode ? 'transparent' : '#f8fafc',
    },

    // Hero Section
    heroSection: {
      flexDirection: 'row',
      padding: 16,
      backgroundColor: isDarkMode ? 'rgba(22, 24, 27, 0.92)' : '#ffffff',
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#262A33' : '#f1f5f9',
      alignItems: 'stretch',
    },
    bookCoverLarge: {
      width: '35%',
      aspectRatio: 124 / 182,
      alignSelf: 'flex-start',
      backgroundColor: '#3b7a6d',
      borderRadius: 14,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: isDarkMode ? 0.4 : 0.14,
      shadowRadius: 10,
      elevation: 6,
    },
    coverFallback: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#3b7a6d',
      padding: 10,
    },
    coverText: {
      color: '#ffffff',
      fontSize: 12,
      fontWeight: '900',
      textAlign: 'center',
      marginTop: 6,
      letterSpacing: 1,
    },
    heroInfo: {
      flex: 1,
      minWidth: 0,
      marginLeft: 14,
      justifyContent: 'space-between',
    },
    heroTopContent: {
      minWidth: 0,
    },
    bookTitleLarge: {
      fontSize: 19,
      fontWeight: '800',
      color: isDarkMode ? '#EDE9DF' : '#0f172a',
      lineHeight: 24,
    },
    metaGroup: {
      marginTop: 6,
      gap: 5,
      alignItems: 'flex-start',
    },
    authorValue: {
      fontSize: 14,
      lineHeight: 19,
      color: isDarkMode ? '#FAF7F0' : '#0f172a',
    },
    authorLabel: {
      fontSize: 13.5,
      fontWeight: '600',
      color: isDarkMode ? '#C8C3B8' : '#475569',
    },
    authorName: {
      fontSize: 14,
      fontWeight: '700',
      color: isDarkMode ? '#FAF7F0' : '#0f172a',
    },
    categoryBadge: {
      alignSelf: 'flex-start',
      maxWidth: '100%',
      paddingHorizontal: 9,
      paddingVertical: 3,
      borderRadius: 6,
      backgroundColor: isDarkMode ? 'rgba(212, 175, 55, 0.14)' : 'rgba(56, 115, 103, 0.12)',
      borderWidth: 1,
      borderColor: isDarkMode ? 'rgba(212, 175, 55, 0.34)' : 'rgba(56, 115, 103, 0.28)',
    },
    categoryText: {
      fontSize: 12.5,
      lineHeight: 17,
      color: isDarkMode ? '#F3DA7A' : '#255B50',
      fontWeight: '700',
    },

    statsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
      flexWrap: 'wrap',
      columnGap: 16,
      rowGap: 6,
      marginTop: 10,
    },
    statItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      minWidth: 0,
      maxWidth: '100%',
      flexShrink: 1,
    },
    statText: {
      flexShrink: 1,
      fontSize: 12.5,
      lineHeight: 16,
      fontWeight: '700',
      color: isDarkMode ? '#EDE9DF' : '#1e293b',
    },
    priceText: {
      fontSize: 21,
      lineHeight: 25,
      fontWeight: '900',
      color: isDarkMode ? '#F3DA7A' : '#9A5A16',
      marginTop: 10,
    },

    // Giới thiệu sách rút gọn
    shortIntroContainer: {
      marginTop: 2,
      paddingTop: 6,
      paddingHorizontal: 16,
      borderTopWidth: 1,
      borderTopColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : '#f1f5f9',
    },
    shortIntroText: {
      fontSize: 11,
      fontWeight: '500',
      color: isDarkMode ? '#C5C2BA' : '#475569',
      lineHeight: 16,
    },

    // Hàng Nút Hành Động (Đồng bộ với Trang Chủ Web)
    actionRow: {
      flexDirection: 'row',
      paddingHorizontal: 14,
      paddingVertical: 14,
      gap: 8,
      backgroundColor: isDarkMode ? 'rgba(19, 21, 24, 0.92)' : '#ffffff',
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#262A33' : '#f1f5f9',
      alignItems: 'center',
    },
    actionStatusRow: {
      flex: 1,
      minHeight: 44,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
    },
    actionStatusText: {
      fontSize: 13,
      fontWeight: '600',
      color: isDarkMode ? '#C8C3B8' : '#475569',
    },
    actionUnknownBox: {
      flex: 1,
      minHeight: 44,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
    },
    actionUnknownText: {
      flex: 1,
      fontSize: 12.5,
      lineHeight: 17,
      fontWeight: '600',
      color: isDarkMode ? '#FCA5A5' : '#B91C1C',
    },
    actionRetryBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      height: 38,
      borderRadius: 10,
      backgroundColor: isDarkMode ? '#D4AF37' : '#387367',
    },
    actionRetryBtnText: {
      fontSize: 12.5,
      fontWeight: '800',
      color: isDarkMode ? '#111210' : '#ffffff',
    },
    rentSuccessBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginHorizontal: 16,
      marginTop: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 10,
      backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.14)' : '#ECFDF5',
      borderWidth: 1,
      borderColor: isDarkMode ? 'rgba(52, 211, 153, 0.35)' : '#A7F3D0',
    },
    rentSuccessText: {
      flex: 1,
      fontSize: 12.5,
      lineHeight: 17,
      fontWeight: '700',
      color: isDarkMode ? '#A7F3D0' : '#065F46',
    },
    favoriteBanner: {
      position: 'absolute',
      top: 58,
      left: 16,
      right: 16,
      zIndex: 9999,
      elevation: 10,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 12,
      borderWidth: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDarkMode ? 0.45 : 0.15,
      shadowRadius: 8,
    },
    favoriteBannerText: {
      flex: 1,
      fontSize: 13,
      fontWeight: '600',
      lineHeight: 18,
    },
    // THÔNG BÁO GÓC TRÊN BÊN PHẢI (3s running timer bar & close button)
    topToastWrapper: {
      position: 'absolute',
      top: 56,
      right: 12,
      maxWidth: Math.min(340, width - 24),
      minWidth: 240,
      zIndex: 99999,
      elevation: 25,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: isDarkMode ? 0.5 : 0.18,
      shadowRadius: 10,
    },
    topToastCard: {
      borderRadius: 12,
      overflow: 'hidden',
      borderWidth: 1,
      backgroundColor: isDarkMode ? '#1B1F27' : '#FFFFFF',
    },
    topToastCardSuccess: {
      borderColor: isDarkMode ? 'rgba(52, 211, 153, 0.4)' : '#A7F3D0',
      backgroundColor: isDarkMode ? '#14201D' : '#F0FDF4',
    },
    topToastCardFavorite: {
      borderColor: isDarkMode ? 'rgba(248, 113, 113, 0.4)' : '#FECDD3',
      backgroundColor: isDarkMode ? '#221518' : '#FFF1F2',
    },
    topToastCardInfo: {
      borderColor: isDarkMode ? 'rgba(56, 189, 248, 0.4)' : '#BAE6FD',
      backgroundColor: isDarkMode ? '#111D27' : '#F0F9FF',
    },
    topToastCardError: {
      borderColor: isDarkMode ? 'rgba(248, 113, 113, 0.45)' : '#FECDD3',
      backgroundColor: isDarkMode ? '#231618' : '#FEF2F2',
    },
    topToastBody: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 10,
      gap: 10,
    },
    topToastIconWrap: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    topToastIconWrapSuccess: {
      backgroundColor: isDarkMode ? 'rgba(52, 211, 153, 0.18)' : 'rgba(5, 150, 105, 0.12)',
    },
    topToastIconWrapFavorite: {
      backgroundColor: isDarkMode ? 'rgba(248, 113, 113, 0.18)' : 'rgba(225, 29, 72, 0.12)',
    },
    topToastIconWrapInfo: {
      backgroundColor: isDarkMode ? 'rgba(56, 189, 248, 0.18)' : 'rgba(2, 132, 199, 0.12)',
    },
    topToastIconWrapError: {
      backgroundColor: isDarkMode ? 'rgba(248, 113, 113, 0.2)' : 'rgba(220, 38, 38, 0.12)',
    },
    topToastText: {
      flex: 1,
      fontSize: 12.5,
      fontWeight: '600',
      lineHeight: 18,
      color: isDarkMode ? '#EDE9DF' : '#1E293B',
    },
    topToastCloseBtn: {
      padding: 4,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
    },
    topToastProgressTrack: {
      height: 3,
      width: '100%',
      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
    },
    topToastProgressBar: {
      height: '100%',
    },
    // 1. Nút Thuê sách (Nổi bật nhất cho sách chưa thuê)
    btnRentPrimary: {
      flex: 1,
      height: 44,
      backgroundColor: isDarkMode ? '#D4AF37' : '#387367',
      borderRadius: 12,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 8,
      borderWidth: 1,
      borderColor: isDarkMode ? '#E5C65C' : '#2D5F55',
      shadowColor: isDarkMode ? '#D4AF37' : '#387367',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: isDarkMode ? 0.32 : 0.24,
      shadowRadius: 5,
      elevation: 3,
    },
    btnRentPrimaryText: {
      color: isDarkMode ? '#111210' : '#ffffff',
      fontSize: 12.5,
      fontWeight: '800',
    },
    // 2. Nút Đọc thử (Cân đối ở giữa)
    btnTrialRead: {
      flex: 1,
      height: 44,
      backgroundColor: isDarkMode ? '#242934' : '#EFF7F5',
      borderRadius: 12,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 8,
      borderWidth: 1,
      borderColor: isDarkMode ? '#3B4252' : '#B8D8D0',
    },
    btnTrialReadText: {
      color: isDarkMode ? '#EDE9DF' : '#255B50',
      fontSize: 12.5,
      fontWeight: '800',
    },
    trialChoiceSecondaryBtn: {
      flex: 1,
      height: 42,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDarkMode ? '#252A34' : '#F1F5F9',
      borderWidth: 1,
      borderColor: isDarkMode ? '#383F4E' : '#CBD5E1',
    },
    trialChoiceSecondaryText: {
      fontSize: 13.5,
      fontWeight: '700',
      color: isDarkMode ? '#EDE9DF' : '#334155',
    },
    // Nút Tiếp Tục Đọc (Vàng kim quý phái của web TrangChu)
    btnContinueReading: {
      flex: 1.3,
      height: 44,
      backgroundColor: isDarkMode ? '#D4AF37' : '#d97706',
      borderRadius: 12,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      shadowColor: isDarkMode ? '#D4AF37' : '#d97706',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: isDarkMode ? 0.35 : 0.28,
      shadowRadius: 5,
      elevation: 3,
    },
    btnContinueReadingText: {
      color: isDarkMode ? '#111210' : '#ffffff',
      fontSize: 13,
      fontWeight: '900',
    },
    // Nút Đọc Từ Đầu (Đỏ vang hoàng gia trên Dark Mode, xanh ngọc trên Light Mode)
    btnReadPrimary: {
      flex: 2,
      height: 44,
      backgroundColor: isDarkMode ? '#8E3038' : '#387367',
      borderRadius: 12,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: isDarkMode ? '#A83C46' : '#2d5f55',
      shadowColor: isDarkMode ? '#8E3038' : '#387367',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: isDarkMode ? 0.35 : 0.25,
      shadowRadius: 5,
      elevation: 3,
    },
    btnReadPrimaryCompact: {
      flex: 1.1,
      backgroundColor: isDarkMode ? '#9E3842' : '#478377',
    },
    btnReadPrimaryText: {
      color: '#ffffff',
      fontSize: 13.5,
      fontWeight: '800',
    },
    // Nút Thêm vào giỏ hàng (Bỏ hoàn toàn icon lưu)
    btnAddToCart: {
      flex: 1,
      height: 44,
      backgroundColor: isDarkMode ? '#20242D' : '#f1f5f9',
      borderRadius: 12,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      borderWidth: 1,
      borderColor: isDarkMode ? 'rgba(212, 175, 55, 0.3)' : '#e2e8f0',
    },
    btnAddToCartCompact: {
      flex: 0.9,
    },
    btnAddToCartActive: {
      backgroundColor: isDarkMode ? '#8E3038' : '#387367',
      borderColor: isDarkMode ? '#A83C46' : '#2d5f55',
    },
    btnAddToCartText: {
      color: isDarkMode ? '#EDE9DF' : '#334155',
      fontSize: 12.5,
      fontWeight: '800',
    },
    btnAddToCartActiveText: {
      color: '#ffffff',
    },

    // Giữ alias cho btnBookmark
    btnBookmark: {
      flex: 1,
      height: 44,
      backgroundColor: isDarkMode ? '#20242D' : '#f1f5f9',
      borderRadius: 12,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      borderWidth: 1,
      borderColor: isDarkMode ? 'rgba(212, 175, 55, 0.3)' : '#e2e8f0',
    },
    btnBookmarkCompact: {
      flex: 0.9,
    },
    btnBookmarkActive: {
      backgroundColor: isDarkMode ? '#8E3038' : '#387367',
      borderColor: isDarkMode ? '#A83C46' : '#2d5f55',
    },
    btnBookmarkText: {
      color: isDarkMode ? '#EDE9DF' : '#334155',
      fontSize: 12.5,
      fontWeight: '800',
    },
    btnBookmarkActiveText: {
      color: '#ffffff',
    },

    // Khối Giới Thiệu & Danh Sách Chương
    sectionContainer: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 4,
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: isDarkMode ? '#EDE9DF' : '#0f172a',
      marginBottom: 8,
    },

    // Khối Trích Dẫn Nổi Bật (Quote Callout)
    quoteBox: {
      backgroundColor: isDarkMode ? 'rgba(28, 25, 20, 0.92)' : '#fffbeb',
      borderRadius: 12,
      borderLeftWidth: 4,
      borderLeftColor: isDarkMode ? '#D4AF37' : '#d97706',
      borderWidth: isDarkMode ? 1 : 0,
      borderColor: isDarkMode ? 'rgba(212, 175, 55, 0.25)' : 'transparent',
      padding: 14,
      marginBottom: 8,
      shadowColor: isDarkMode ? '#D4AF37' : '#d97706',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDarkMode ? 0.15 : 0.08,
      shadowRadius: 4,
      elevation: 1,
    },
    quoteHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 6,
    },
    quoteHeaderTitle: {
      fontSize: 12,
      fontWeight: '800',
      color: isDarkMode ? '#F3DA7A' : '#b45309',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    quoteContentText: {
      fontSize: 13,
      fontStyle: 'italic',
      lineHeight: 20,
      color: isDarkMode ? '#F7F2E7' : '#78350f',
    },
    quoteSourceText: {
      fontSize: 11.5,
      fontWeight: '700',
      color: isDarkMode ? '#D4AF37' : '#92400e',
      textAlign: 'right',
      marginTop: 8,
    },

    // Danh Sách Chương
    chapterListViewport: {
      width: '100%',
    },
    chaptersCardBox: {
      backgroundColor: isDarkMode ? 'rgba(22, 24, 27, 0.92)' : '#ffffff',
      borderRadius: 14,
      borderWidth: 1,
      borderColor: isDarkMode ? '#262A33' : '#e2e8f0',
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDarkMode ? 0.2 : 0.04,
      shadowRadius: 6,
      elevation: 1,
    },
    chapterRowItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#22252C' : '#f1f5f9',
    },
    chapterRowActive: {
      backgroundColor: isDarkMode ? 'rgba(212, 175, 55, 0.08)' : '#fefce8',
    },
    chapterLeftCol: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      marginRight: 10,
    },
    chapterNumBadge: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: isDarkMode ? '#20242D' : '#f1f5f9',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    chapterNumBadgeActive: {
      backgroundColor: isDarkMode ? 'rgba(212, 175, 55, 0.25)' : '#fde68a',
    },
    chapterNumText: {
      fontSize: 12,
      fontWeight: '800',
      color: isDarkMode ? '#A6A29A' : '#475569',
    },
    chapterNumTextActive: {
      color: isDarkMode ? '#D4AF37' : '#92400e',
    },
    chapterInfoCol: {
      flex: 1,
    },
    chapterItemText: {
      fontSize: 13.5,
      fontWeight: '700',
      color: isDarkMode ? '#EDE9DF' : '#1e293b',
      marginBottom: 4,
    },
    chapterItemTextActive: {
      color: isDarkMode ? '#D4AF37' : '#b45309',
    },
    chapterMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    chapterReadTimeText: {
      fontSize: 11,
      color: isDarkMode ? '#8A8780' : '#94a3b8',
      fontWeight: '600',
    },
    currentReadingPill: {
      backgroundColor: isDarkMode ? 'rgba(212, 175, 55, 0.2)' : '#fef3c7',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
      marginLeft: 6,
    },
    currentReadingPillText: {
      fontSize: 10,
      fontWeight: '800',
      color: isDarkMode ? '#D4AF37' : '#b45309',
    },
    emptyBox: {
      backgroundColor: isDarkMode ? 'rgba(22, 24, 27, 0.92)' : '#ffffff',
      borderRadius: 14,
      borderWidth: 1,
      borderColor: isDarkMode ? '#262A33' : '#e2e8f0',
      padding: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    reviewHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    reviewCountBadge: {
      fontSize: 13.5,
      fontWeight: '500',
      color: isDarkMode ? '#A6A29A' : '#64748B',
    },
    reviewRatingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 2,
    },
    reviewSummaryScoreText: {
      fontSize: 13.5,
      fontWeight: '700',
      color: isDarkMode ? '#EDE9DF' : '#1E293B',
    },
    reviewHeaderActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    reviewSummaryText: {
      fontSize: 12,
      color: isDarkMode ? '#A6A29A' : '#77716A',
      marginTop: -4,
    },
    reviewAverage: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
    },
    fractionalStar: {
      width: 15,
      height: 15,
    },
    fractionalStarFill: {
      position: 'absolute',
      left: 0,
      top: 0,
      height: 15,
      overflow: 'hidden',
    },
    reviewComposer: {
      marginTop: 14,
      padding: 12,
      borderRadius: 12,
      backgroundColor: isDarkMode ? 'rgba(22, 24, 27, 0.92)' : '#ffffff',
      borderWidth: 1,
      borderColor: isDarkMode ? '#262A33' : '#e2e8f0',
    },
    reviewStarPicker: {
      flexDirection: 'row',
      gap: 8,
      justifyContent: 'center',
      alignSelf: 'center',
    },
    reviewInput: {
      minHeight: 76,
      maxHeight: 130,
      marginTop: 10,
      paddingHorizontal: 11,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: isDarkMode ? '#383633' : '#e2e8f0',
      borderRadius: 9,
      color: isDarkMode ? '#EDE9DF' : '#1e293b',
      textAlignVertical: 'top',
      fontSize: 13,
    },
    reviewSubmit: {
      alignSelf: 'flex-end',
      marginTop: 9,
      minWidth: 96,
      minHeight: 36,
      paddingHorizontal: 13,
      borderRadius: 9,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDarkMode ? '#D4AF37' : '#8B4A3C',
    },
    reviewSubmitDisabled: {
      opacity: 0.45,
    },
    reviewSubmitText: {
      color: isDarkMode ? '#111210' : '#FFFFFF',
      fontSize: 12,
      fontWeight: '800',
    },
    requestReviewButton: {
      alignSelf: 'center',
      marginTop: 12,
      minHeight: 34,
      paddingHorizontal: 16,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDarkMode ? '#D4AF37' : '#8B4A3C',
    },
    requestReviewText: {
      color: isDarkMode ? '#111210' : '#FFFFFF',
      fontSize: 12,
      fontWeight: '800',
    },
    reviewStatus: {
      alignItems: 'center',
      paddingVertical: 18,
      gap: 8,
    },
    reviewStatusText: {
      color: isDarkMode ? '#A6A29A' : '#77716A',
      fontSize: 12,
      textAlign: 'center',
      lineHeight: 18,
    },
    reviewErrorText: {
      color: isDarkMode ? '#F3A6A6' : '#B42318',
      fontSize: 12,
      textAlign: 'center',
    },
    reviewRetry: {
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderWidth: 1,
      borderRadius: 8,
      borderColor: isDarkMode ? '#62552D' : '#E8D8B4',
    },
    reviewRetryText: {
      color: isDarkMode ? '#F3DA7A' : '#8B4A3C',
      fontSize: 11,
      fontWeight: '800',
    },
    reviewEmpty: {
      paddingVertical: 24,
      alignItems: 'center',
    },
    reviewEmptyTitle: {
      color: isDarkMode ? '#EDE9DF' : '#1e293b',
      fontSize: 14,
      fontWeight: '800',
      marginBottom: 4,
    },
    reviewList: {
      gap: 10,
    },
    reviewItem: {
      padding: 12,
      borderRadius: 12,
      backgroundColor: isDarkMode ? 'rgba(22, 24, 27, 0.92)' : '#ffffff',
      borderWidth: 1,
      borderColor: isDarkMode ? '#262A33' : '#e2e8f0',
    },
    reviewItemHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 8,
    },
    reviewerIdentity: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      minWidth: 0,
      gap: 8,
    },
    reviewerAvatarFallback: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDarkMode ? '#62484B' : '#F1D9D4',
    },
    reviewerInitial: {
      color: isDarkMode ? '#F3D9D9' : '#8B4A3C',
      fontSize: 13,
      fontWeight: '900',
    },
    reviewerMeta: {
      flex: 1,
      minWidth: 0,
    },
    reviewerName: {
      color: isDarkMode ? '#EDE9DF' : '#1e293b',
      fontSize: 12,
      fontWeight: '800',
    },
    reviewDate: {
      color: isDarkMode ? '#8A8780' : '#94a3b8',
      fontSize: 10,
      marginTop: 2,
    },
    reviewStars: {
      flexDirection: 'row',
      gap: 1,
    },
    reviewContent: {
      color: isDarkMode ? '#C5C2BA' : '#475569',
      fontSize: 13,
      lineHeight: 19,
      marginTop: 9,
    },
    reviewLike: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: 4,
      marginTop: 9,
    },
    reviewLikeText: {
      color: isDarkMode ? '#D8B36A' : '#8B4A3C',
      fontSize: 11,
      fontWeight: '800',
    },
    reviewReply: {
      marginTop: 10,
      padding: 9,
      borderLeftWidth: 2,
      borderLeftColor: isDarkMode ? '#62552D' : '#E8D8B4',
      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : '#fafaf9',
    },
    // Modal Sách đã có trong giỏ hàng (Phong cách Web HALMBOOK)
    cartModalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 24,
    },
    cartModalCard: {
      width: '100%',
      maxWidth: 340,
      backgroundColor: isDarkMode ? '#1E222B' : '#ffffff',
      borderRadius: 20,
      paddingHorizontal: 22,
      paddingTop: 24,
      paddingBottom: 20,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: isDarkMode ? '#2D333F' : '#E8E4DC',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: isDarkMode ? 0.45 : 0.15,
      shadowRadius: 18,
      elevation: 10,
    },
    cartModalCloseBtn: {
      position: 'absolute',
      top: 14,
      right: 14,
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
      zIndex: 10,
    },
    cartModalIconWrap: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: isDarkMode ? 'rgba(212, 175, 55, 0.12)' : 'rgba(56, 115, 103, 0.1)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
      borderWidth: 1,
      borderColor: isDarkMode ? 'rgba(212, 175, 55, 0.25)' : 'rgba(56, 115, 103, 0.2)',
    },
    cartModalTitle: {
      fontSize: 17,
      fontWeight: '800',
      color: isDarkMode ? '#EDE9DF' : '#0F172A',
      textAlign: 'center',
      marginBottom: 8,
    },
    cartModalMessage: {
      fontSize: 13.5,
      lineHeight: 20,
      color: isDarkMode ? '#A39F99' : '#64748B',
      textAlign: 'center',
      marginBottom: 20,
      paddingHorizontal: 4,
    },
    cartModalBookTitle: {
      fontWeight: '700',
      color: isDarkMode ? '#F5F1E8' : '#1E293B',
    },
    cartModalError: {
      fontSize: 12.5,
      color: isDarkMode ? '#F87171' : '#E11D48',
      textAlign: 'center',
      marginBottom: 14,
    },
    cartModalButtonRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
      gap: 12,
    },
    cartModalBtnRemove: {
      flex: 1,
      height: 42,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDarkMode ? 'rgba(158, 56, 66, 0.18)' : '#FFF1F2',
      borderWidth: 1,
      borderColor: isDarkMode ? 'rgba(158, 56, 66, 0.35)' : '#FECDD3',
    },
    cartModalBtnRemoveText: {
      fontSize: 13.5,
      fontWeight: '700',
      color: isDarkMode ? '#F87171' : '#E11D48',
    },
    cartModalBtnGoCart: {
      flex: 1,
      height: 42,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDarkMode ? '#8E3038' : '#387367',
      borderWidth: 1,
      borderColor: isDarkMode ? '#A83C46' : '#2D5F55',
      shadowColor: isDarkMode ? '#8E3038' : '#387367',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 2,
    },
    cartModalBtnGoCartText: {
      fontSize: 13.5,
      fontWeight: '800',
      color: '#FFFFFF',
    },
    cartModalBtnDisabled: {
      opacity: 0.6,
    },
    emptyText: {
      fontSize: 13,
      color: isDarkMode ? '#A6A29A' : '#64748b',
      fontStyle: 'italic',
    },
  });
}
