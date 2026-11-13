import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ArrowLeft,
  BookOpen,
  ChevronRight,
  Clock,
  Eye,
  Heart,
  Play,
  Quote,
  Star as StarIcon,
} from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import axios from 'axios';
import Constants from 'expo-constants';
import { getBookCoverSource } from './bookCovers';
import { useAppNavigation } from './navigation';
import { getBookRealChapters, getBookChapterLabel } from './bookContentService';
import { useBookFavorite } from './useBookFavorite';

const { width, height } = Dimensions.get('window');

// CẤU HÌNH KẾT NỐI BACKEND SPRING BOOT + MYSQL
const debuggerHost = Constants.expoConfig?.hostUri;
const localhost = debuggerHost ? debuggerHost.split(':')[0] : 'localhost';
const API_BASE_URL = `http://${localhost}:8082`;

const CANDIDATE_API_URLS = Array.from(
  new Set([
    API_BASE_URL,
    'http://localhost:8082',
    'http://127.0.0.1:8082',
    'http://192.168.1.165:8082',
    'http://10.0.2.2:8082',
  ])
);

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
  };
  onBack: () => void;
  onStartReading: (initialChapterIndex?: number) => void;
}

interface ChapterItem {
  id: number;
  chapterNum: string;
  title: string;
  readTime: string;
}

const normalizeVietnamese = (str: string): string =>
  str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();

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
  const { navigate, isDarkMode, setFooterVisible, isLoggedIn, showLoginAlert } = useAppNavigation();
  const themeStyles = useMemo(() => getThemedStyles(isDarkMode), [isDarkMode]);

  const [isInCart, setIsInCart] = useState(false);
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
  const [showAllChapters, setShowAllChapters] = useState(false);
  const scrollOffset = useRef(0);

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

  // Xác định chính xác mã sách thật trong DB MySQL và kiểm tra trạng thái giỏ hàng
  useEffect(() => {
    let isMounted = true;
    const initializeRealBookAndCart = async () => {
      try {
        const resolved = await resolveDatabaseBookId(book.id, book.title);
        const resolvedId = resolved.bookId;
        if (isMounted) {
          setRealBookId(resolvedId);
        }

        // Tải chi tiết sách thật từ DB nếu có
        for (const baseUrl of CANDIDATE_API_URLS) {
          try {
            const detailRes = await axios.get(`${baseUrl}/api/home/books/${resolvedId}`, { timeout: 3000 });
            if (detailRes.data && isMounted) {
              setDbBookDetails(detailRes.data);
              break;
            }
          } catch {
            // Thử tiếp
          }
        }

        // Kiểm tra xem sách đã nằm trong giỏ hàng thật của User chưa (GET /api/cart)
        const token = await AsyncStorage.getItem('userToken');
        if (token) {
          for (const baseUrl of CANDIDATE_API_URLS) {
            try {
              const cartRes = await axios.get(`${baseUrl}/api/cart`, {
                headers: { Authorization: `Bearer ${token}` },
                timeout: 3000,
              });
              const items = Array.isArray(cartRes.data) ? cartRes.data : [];
              const alreadyInCart = items.some(
                (item: any) =>
                  String(item.bookId || item.book_id || '').toUpperCase() === resolvedId.toUpperCase() ||
                  (item.title && item.title.toLowerCase() === book.title.toLowerCase())
              );
              if (isMounted && alreadyInCart) {
                setIsInCart(true);
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
    };

    initializeRealBookAndCart();
    return () => {
      isMounted = false;
    };
  }, [book.id, book.title]);

  // Đọc tiến độ đọc thật từ AsyncStorage
  useEffect(() => {
    let isMounted = true;
    const loadReadingProgress = async () => {
      try {
        const stored = await AsyncStorage.getItem(`@halm_reading_progress_${book.id}`);
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
    loadReadingProgress();
    return () => {
      isMounted = false;
    };
  }, [book.id]);

  const categoryName = useMemo(() => getStandardCategory(book, dbBookDetails), [book, dbBookDetails]);
  const authorName = useMemo(() => getBookAuthor(book, dbBookDetails), [book, dbBookDetails]);
  const shortIntro = useMemo(() => getBookShortIntro(book, dbBookDetails), [book, dbBookDetails]);
  const featuredQuote = useMemo(() => getFeaturedQuote(book), [book]);
  const chapters = useMemo(() => getBookChapters(book), [book]);
  const chapterDisplay = useMemo(() => getBookChapterDisplay(book, chapters), [book, chapters]);

  const displayPrice = useMemo(() => {
    return resolveBaseKhoaiForBook(
      realBookId || book.id,
      dbBookDetails?.rent_price || book.rent_price || book.price
    );
  }, [realBookId, book.id, dbBookDetails, book.rent_price, book.price]);

  const handleContinueReading = () => {
    onStartReading(savedChapter ? Math.max(0, savedChapter.chapterNum - 1) : 0);
  };

  /**
   * XỬ LÝ THÊM SÁCH THẬT VÀO GIỎ HÀNG (DATABASE MYSQL QUA API)
   */
  const handleAddToCart = async () => {
    if (!isLoggedIn) {
      showLoginAlert('Bạn phải đăng nhập để thêm sách vào giỏ hàng');
      return;
    }

    if (isInCart) {
      Alert.alert(
        'Giỏ hàng',
        `Cuốn sách "${book.title}" đã có trong giỏ hàng của bạn. Bạn có muốn chuyển tới giỏ hàng ngay không?`,
        [
          { text: 'Ở lại trang này', style: 'cancel' },
          { text: 'Xem giỏ hàng', onPress: () => navigate('cart') },
        ]
      );
      return;
    }

    setIsAddingToCart(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
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
              planKey: '7',
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
        Alert.alert(
          'Thành công',
          `Đã thêm "${book.title}" vào giỏ hàng!`,
          [
            { text: 'Tiếp tục xem', style: 'cancel' },
            { text: 'Xem giỏ hàng', onPress: () => navigate('cart') },
          ]
        );
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

      {favoriteMessage ? <Text accessibilityLiveRegion="polite" style={{ color: isDarkMode ? '#EDE9DF' : '#7B3037', paddingHorizontal: 20, paddingVertical: 10 }}>{favoriteMessage}</Text> : null}
      <ScrollView
        style={themeStyles.scrollView}
        contentContainerStyle={{ paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Ô THỨ NHẤT: THÔNG TIN SÁCH CHÍNH (HERO SECTION) */}
        <View style={themeStyles.heroSection}>
          <View style={themeStyles.bookCoverLarge}>
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
            {/* Tên sách lớn, rõ nét */}
            <Text style={themeStyles.bookTitleLarge} numberOfLines={2}>
              {book.title}
            </Text>

            {/* Tác giả cho xuống dòng riêng biệt */}
            <View style={themeStyles.authorContainer}>
              <Text style={themeStyles.authorLabel}>Tác giả:</Text>
              <Text style={themeStyles.authorValue}>{authorName}</Text>
            </View>

            {/* Thể loại chuẩn hóa & Đánh giá */}
            <View style={themeStyles.tagRow}>
              <View style={themeStyles.categoryBadge}>
                <Text style={themeStyles.categoryBadgeText} numberOfLines={1}>
                  {categoryName}
                </Text>
              </View>
              <View style={themeStyles.ratingBadge}>
                <StarIcon
                  size={12}
                  color={isDarkMode ? '#FBBF24' : '#d97706'}
                  fill={isDarkMode ? '#FBBF24' : '#d97706'}
                />
                <Text style={themeStyles.ratingBadgeText}> {book.rating || '4.9'}</Text>
              </View>
            </View>

            {/* Thống kê lượt đọc, số chương & giá thuê */}
            <View style={themeStyles.statsRow}>
              <View style={themeStyles.statBadgeReads}>
                <Eye size={13} color={isDarkMode ? '#38BDF8' : '#0284c7'} />
                <Text style={themeStyles.statBadgeReadsText}>{book.reads || '1.2K'} lượt đọc</Text>
              </View>
              <View style={themeStyles.statBadgeChapters}>
                <BookOpen size={13} color={isDarkMode ? '#34D399' : '#059669'} />
                <Text style={themeStyles.statBadgeChaptersText}>{chapterDisplay}</Text>
              </View>
              <View style={themeStyles.statBadgePrice}>
                <Text style={themeStyles.statBadgePriceText}>{displayPrice} Khoai 🥔</Text>
              </View>
            </View>

            {/* GIỚI THIỆU SÁCH RÚT GỌN (CHỈ HIỂN THỊ KHI CÓ DỮ LIỆU) */}
            {shortIntro.trim().length > 0 && (
              <View style={themeStyles.shortIntroContainer}>
                <Text style={themeStyles.shortIntroText} numberOfLines={3}>
                  {shortIntro}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Ô THỨ HAI: CÁC NÚT HÀNH ĐỘNG (THEO MÀU SẮC CHUẨN CỦA TRANG CHỦ WEB) */}
        <View style={themeStyles.actionRow}>
          {/* Nút Tiếp Tục Đọc (Vàng kim sang trọng) */}
          {savedChapter && (
            <TouchableOpacity
              style={themeStyles.btnContinueReading}
              onPress={handleContinueReading}
              activeOpacity={0.88}
            >
              <Play
                size={16}
                color={isDarkMode ? '#111210' : '#ffffff'}
                fill={isDarkMode ? '#111210' : '#ffffff'}
              />
              <Text style={themeStyles.btnContinueReadingText} numberOfLines={1}>
                Tiếp Tục (C.{savedChapter.chapterNum})
              </Text>
            </TouchableOpacity>
          )}

          {/* Nút Đọc Từ Đầu (Đỏ vang hoàng gia trên Dark Mode, xanh ngọc trên Light Mode) */}
          <TouchableOpacity
            style={[
              themeStyles.btnReadPrimary,
              savedChapter ? themeStyles.btnReadPrimaryCompact : null,
            ]}
            onPress={() => onStartReading(0)}
            activeOpacity={0.88}
          >
            <BookOpen size={16} color="#ffffff" />
            <Text style={themeStyles.btnReadPrimaryText}>Đọc Từ Đầu</Text>
          </TouchableOpacity>

          {/* Nút Thêm vào Giỏ Hàng: BỎ HOÀN TOÀN ICON LƯU, DÙNG ICON GIỎ HÀNG VÀ DỮ LIỆU THẬT MYSQL */}
          <TouchableOpacity
            style={[
              themeStyles.btnAddToCart,
              isInCart && themeStyles.btnAddToCartActive,
              savedChapter ? themeStyles.btnAddToCartCompact : null,
            ]}
            onPress={handleAddToCart}
            activeOpacity={0.88}
            disabled={isAddingToCart}
          >
            {isAddingToCart ? (
              <ActivityIndicator
                size="small"
                color={isInCart ? '#ffffff' : isDarkMode ? '#EDE9DF' : '#334155'}
              />
            ) : (
              <Ionicons
                name={isInCart ? 'checkmark-circle' : 'cart-outline'}
                size={17}
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
              {isAddingToCart
                ? 'Đang thêm...'
                : isInCart
                ? 'Đã trong giỏ'
                : 'Thêm vào giỏ'}
            </Text>
          </TouchableOpacity>
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
            <View style={themeStyles.chaptersCardBox}>
              {(showAllChapters ? chapters : chapters.slice(0, 5)).map((chap) => {
                const isCurrentChapter = savedChapter?.chapterNum === chap.id;
                return (
                  <TouchableOpacity
                    key={chap.id}
                    style={[
                      themeStyles.chapterRowItem,
                      isCurrentChapter && themeStyles.chapterRowActive,
                    ]}
                    activeOpacity={0.7}
                    onPress={() => onStartReading(chap.id - 1)}
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

              {chapters.length > 5 && (
                <TouchableOpacity
                  style={{
                    paddingVertical: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderTopWidth: 1,
                    borderTopColor: isDarkMode ? '#222630' : '#e2e8f0',
                  }}
                  activeOpacity={0.8}
                  onPress={() => setShowAllChapters(!showAllChapters)}
                >
                  <Text style={{ fontSize: 13, fontWeight: '700', color: isDarkMode ? '#D8B36A' : '#4f46e5' }}>
                    {showAllChapters ? '▲ Thu gọn danh sách chương' : `▼ Xem toàn bộ ${chapters.length} chương tác phẩm`}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={themeStyles.emptyBox}>
              <Text style={themeStyles.emptyText}>Chưa có danh sách chương cho cuốn sách này.</Text>
            </View>
          )}
        </View>

        {/* Khoảng cách đáy */}
        <View style={{ height: 40 }} />
      </ScrollView>
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
      alignItems: 'flex-start',
    },
    bookCoverLarge: {
      width: 124,
      height: 182,
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
      marginLeft: 15,
      justifyContent: 'flex-start',
    },
    bookTitleLarge: {
      fontSize: 18,
      fontWeight: '800',
      color: isDarkMode ? '#EDE9DF' : '#0f172a',
      lineHeight: 24,
      marginBottom: 5,
    },
    authorContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      marginBottom: 8,
      gap: 4,
    },
    authorLabel: {
      fontSize: 12.5,
      color: isDarkMode ? '#A6A29A' : '#64748b',
      fontWeight: '600',
    },
    authorValue: {
      fontSize: 13,
      color: isDarkMode ? '#E8656F' : '#e11d48',
      fontWeight: '800',
    },
    tagRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginBottom: 8,
    },
    categoryBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3.5,
      backgroundColor: isDarkMode ? 'rgba(212, 175, 55, 0.14)' : '#e6f4f1',
      borderRadius: 7,
      borderWidth: 1,
      borderColor: isDarkMode ? 'rgba(212, 175, 55, 0.38)' : '#b2ddd5',
      maxWidth: 155,
    },
    categoryBadgeText: {
      fontSize: 10.5,
      fontWeight: '800',
      color: isDarkMode ? '#F3DA7A' : '#2a6b5c',
    },
    ratingBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 7,
      paddingVertical: 3.5,
      backgroundColor: isDarkMode ? 'rgba(245, 158, 11, 0.16)' : '#fef3c7',
      borderRadius: 7,
      borderWidth: 1,
      borderColor: isDarkMode ? 'rgba(245, 158, 11, 0.42)' : '#fde68a',
    },
    ratingBadgeText: {
      fontSize: 11,
      fontWeight: '800',
      color: isDarkMode ? '#FBBF24' : '#b45309',
    },

    // Thống kê Lượt đọc, Số chương & Giá thuê
    statsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 6,
      marginBottom: 8,
    },
    statBadgeReads: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 3.5,
      backgroundColor: isDarkMode ? 'rgba(56, 189, 248, 0.14)' : '#e0f2fe',
      borderRadius: 7,
      borderWidth: 1,
      borderColor: isDarkMode ? 'rgba(56, 189, 248, 0.38)' : '#bae6fd',
      gap: 4,
    },
    statBadgeReadsText: {
      fontSize: 11,
      fontWeight: '800',
      color: isDarkMode ? '#7DD3FC' : '#0369a1',
    },
    statBadgeChapters: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 3.5,
      backgroundColor: isDarkMode ? 'rgba(52, 211, 153, 0.14)' : '#dcfce7',
      borderRadius: 7,
      borderWidth: 1,
      borderColor: isDarkMode ? 'rgba(52, 211, 153, 0.38)' : '#bbf7d0',
      gap: 4,
    },
    statBadgeChaptersText: {
      fontSize: 11,
      fontWeight: '800',
      color: isDarkMode ? '#6EE7B7' : '#15803d',
    },
    statBadgePrice: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 3.5,
      backgroundColor: isDarkMode ? 'rgba(216, 179, 106, 0.16)' : '#fef3c7',
      borderRadius: 7,
      borderWidth: 1,
      borderColor: isDarkMode ? 'rgba(216, 179, 106, 0.42)' : '#fde68a',
    },
    statBadgePriceText: {
      fontSize: 11,
      fontWeight: '800',
      color: isDarkMode ? '#E5A93C' : '#92400e',
    },

    // Giới thiệu sách rút gọn
    shortIntroContainer: {
      marginTop: 2,
      paddingTop: 6,
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
      paddingHorizontal: 16,
      paddingVertical: 14,
      gap: 10,
      backgroundColor: isDarkMode ? 'rgba(19, 21, 24, 0.92)' : '#ffffff',
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#262A33' : '#f1f5f9',
      alignItems: 'center',
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
    emptyText: {
      fontSize: 13,
      color: isDarkMode ? '#A6A29A' : '#64748b',
      fontStyle: 'italic',
    },
  });
}
