import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { API_BASE_URL, CANDIDATE_API_URLS } from '../config/api';

import { ComponentRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Constants from 'expo-constants';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  Image,
  Modal,
  PanResponder,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  TouchableOpacity,
  UIManager,
  View
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { BookData, useAppNavigation } from './navigation';
import { fetchApiWithFallback } from './apiService';
import HomeCover from './home/HomeBookCover';
import ContinueReading from './home/ContinueReading';
import { formatHomeBookDate, getRankedHomeBooks, getRecentHomeBooks, HomeBookItem, readHomePage } from './home/homeData';
export type { HomeBookItem };
import { getBookCoverSource } from './bookCovers';
import { getBookChapterLabel } from './bookContentService';
import { useUnreadNotificationCount } from './useUnreadNotificationCount';
import { DARK_MODE_PRIMARY, DARK_MODE_SECONDARY } from './CosmicBackground';

const { width, height } = Dimensions.get('window');
const FLOATING_MENU_SIZE = 40;

// Kích hoạt LayoutAnimation cho Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Cấu hình kết nối Backend - Tái sử dụng cấu hình từ loginlogout.tsx và hỗ trợ fallback môi trường

// API_BASE_URL & CANDIDATE_API_URLS được import từ ../config/api (IMP-06)
// const debuggerHost = Constants.expoConfig?.hostUri;
// const localhost = debuggerHost ? debuggerHost.split(':')[0] : 'localhost';
// const API_BASE_URL = `http://${localhost}:8082`;

/*
const CANDIDATE_API_URLS_OLD = [
  API_BASE_URL,
  'http://172.26.41.174:8082',
  'http://192.168.1.7:8082',
  'http://192.168.1.165:8082',
  'http://localhost:8082',
  'http://127.0.0.1:8082',
  'http://10.0.2.2:8082',
];
*/

export interface HomeBookItem extends BookData {
  id: string;
  book_id?: string;
  bookName?: string;
  img_url?: string;
  description?: string;
  price?: number;
  category_id?: number;
  category_name?: string;
  updatedAt?: string;
  createdAt?: string;
}

const mapBookDtoToItem = (item: any, index: number): HomeBookItem => {
  const id = String(item.book_id || item.id || `book-${index}`);
  const title = String(item.bookName || item.title || 'Chưa có tiêu đề');
  const author = item.author || 'HALM BOOK';
  let img_url = item.img_url || item.img || undefined;
  if (img_url && typeof img_url === 'string' && img_url.startsWith('/')) {
    img_url = API_BASE_URL + img_url;
  }
  const tag = item.category_name || item.tag || 'Sách hay';
  const description = item.description || item.desc || '';
  const price = item.rent_price !== undefined ? item.rent_price : item.price;
  const rating = item.rating ? String(item.rating) : '5.0';
  const reads = item.read_count ? `${item.read_count}` : '1.2K';
  const chapter = getBookChapterLabel({ ...item, id, book_id: item.book_id || id, title, author });

  return {
    id,
    title,
    author,
    chapter,
    tag,
    rating,
    reads,
    img_url,
    description,
    price,
    category_id: item.category_id,
    category_name: item.category_name,
  };
};

// Fallback Banner khi chưa có dữ liệu từ backend
const CAROUSEL: any[] = [];

// --- COMPONENT HIỆU ỨNG SAO VÀ VŨ TRỤ (copy từ uudai.tsx, đổi prefix Offers → Home) ---
const DARK_MODE_PRIMARY = '#9A8BC2';
const DARK_MODE_SECONDARY = '#D8B36A';

function HomeNebula() {
  const animation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(animation, { toValue: 1, duration: 5000, useNativeDriver: true }),
        Animated.timing(animation, { toValue: 0, duration: 5000, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [animation]);

  return (
    <>
      <Animated.View
        style={{
          position: 'absolute',
          top: -100,
          left: -100,
          width: 350,
          height: 350,
          borderRadius: 175,
          backgroundColor: DARK_MODE_PRIMARY,
          opacity: animation.interpolate({ inputRange: [0, 1], outputRange: [0.03, 0.12] }),
          transform: [{ scale: animation.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.2] }) }],
        }}
      />
      <Animated.View
        style={{
          position: 'absolute',
          bottom: -100,
          right: -100,
          width: 400,
          height: 400,
          borderRadius: 200,
          backgroundColor: DARK_MODE_SECONDARY,
          opacity: animation.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.05] }),
          transform: [{ scale: animation.interpolate({ inputRange: [0, 1], outputRange: [1.2, 0.8] }) }],
        }}
      />
    </>
  );
}

function HomeStar({
  top,
  left,
  duration,
  size,
  color,
}: {
  top: string;
  left: string;
  duration: number;
  size: number;
  color: string;
}) {
  const animation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(animation, { toValue: 1, duration, useNativeDriver: true }),
        Animated.timing(animation, { toValue: 0.1, duration, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [animation, duration]);

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
        opacity: animation,
        shadowColor: color,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 6,
      }}
    />
  );
}

function HomeShootingStar({
  delay,
  top,
  left,
  screenWidth,
  screenHeight,
}: {
  delay: number;
  top: string;
  left: string;
  screenWidth: number;
  screenHeight: number;
}) {
  const animation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(animation, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(animation, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [animation, delay]);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top,
        left,
        width: 80,
        height: 2,
        backgroundColor: '#fff',
        transform: [
          { rotate: '45deg' },
          { translateX: animation.interpolate({ inputRange: [0, 1], outputRange: [0, screenWidth] }) },
          { translateY: animation.interpolate({ inputRange: [0, 1], outputRange: [0, screenHeight * 0.8] }) },
        ],
        opacity: animation.interpolate({ inputRange: [0, 0.1, 0.8, 1], outputRange: [0, 1, 1, 0] }),
        shadowColor: DARK_MODE_SECONDARY,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 10,
      }}
    />
  );
}

// Ánh trăng chuyển động
function HomeFloatingMoon() {
  const floatAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: 1, duration: 4000, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 4000, useNativeDriver: true }),
      ]),
    );
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 3000, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0, duration: 3000, useNativeDriver: true }),
      ]),
    );
    floatLoop.start();
    glowLoop.start();
    return () => { floatLoop.stop(); glowLoop.stop(); };
  }, [floatAnim, glowAnim]);

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: '8%',
        right: '10%',
        zIndex: -1,
        opacity: floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0.18, 0.35] }),
        transform: [{ translateY: floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -12] }) }],
      }}
    >
      <Animated.View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: DARK_MODE_SECONDARY,
          shadowColor: DARK_MODE_SECONDARY,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.8,
          shadowRadius: 14,
        }}
      />
    </Animated.View>
  );
}

// Quản lý tổng thể Background Dark Mode (copy từ uudai.tsx)
export function DarkModeBackgroundEffects({
  visible,
  screenWidth,
  screenHeight,
}: {
  visible: boolean;
  screenWidth: number;
  screenHeight: number;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const { stars, shootingStars } = useMemo(() => ({
    stars: Array.from({ length: 120 }, (_, id) => ({
      id,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      duration: Math.random() * 500 + 300,
      size: Math.random() * 3 + 1,
      color: Math.random() > 0.7
        ? DARK_MODE_SECONDARY
        : Math.random() > 0.5
          ? '#48dbfb'
          : DARK_MODE_PRIMARY,
    })),
    shootingStars: Array.from({ length: 3 }, (_, id) => ({
      id,
      top: `${Math.random() * -20}%`,
      left: `${Math.random() * 60}%`,
      delay: Math.random() * 8000 + 2000,
    })),
  }), []);

  useEffect(() => {
    const fade = Animated.timing(opacity, {
      toValue: visible ? 1 : 0,
      duration: 800,
      useNativeDriver: true,
    });
    fade.start();
    return () => fade.stop();
  }, [opacity, visible]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { opacity, zIndex: 0, overflow: 'hidden' }]}
    >
      <HomeNebula />
      {stars.map((star) => <HomeStar key={star.id} {...star} />)}
      {shootingStars.map((star) => (
        <HomeShootingStar key={star.id} {...star} screenWidth={screenWidth} screenHeight={screenHeight} />
      ))}
    </Animated.View>
  );
}
// --------------------------------

interface TrangChuProps {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onRefresh: () => void;
}

export default function TrangChu({ isDarkMode, onToggleDarkMode }: TrangChuProps) {
  const { navigate, setFooterVisible, isLoggedIn } = useAppNavigation();
  const unreadNotifications = useUnreadNotificationCount(isLoggedIn);
  const insets = useSafeAreaInsets();
  const window = useWindowDimensions();
  const width = Math.min(1040, window.width - insets.left - insets.right);
  const featuredWidth = Math.max(200, width - 32);
  const featuredRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const featuredAutoAdvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const featuredDragEndRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const featuredIndexRef = useRef(0);
  const featuredOffsetRef = useRef(0);
  const featuredAutoTargetRef = useRef<number | null>(null);
  const featuredDraggingRef = useRef(false);
  const featuredMomentumRef = useRef(false);

  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [showAllRecentBooks, setShowAllRecentBooks] = useState(false);
  const [selectedPreviewBook, setSelectedPreviewBook] = useState<HomeBookItem | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const scrollOffset = useRef(0);
  const pullStart = useRef<number | null>(null);
  const refreshStarted = useRef(false);
  const catalogRequest = useRef<AbortController | null>(null);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);

  // Kích thước Drawer Navbar (chiếm ~80% chiều rộng màn hình, tối đa 320px)
  const DRAWER_WIDTH = Math.min(width * 0.8, 320);

  // State & Ref quản lý Drawer Navbar điều hướng
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [isDrawerCategoriesExpanded, setIsDrawerCategoriesExpanded] = useState(true);
  const drawerAnim = useRef(new Animated.Value(0)).current;
  const mainScrollViewRef = useRef<any>(null);
  const sectionPositions = useRef<Record<string, number>>({});
  const [showFloatingMenu, setShowFloatingMenu] = useState(false);
  const floatingMenuPosition = useRef(new Animated.ValueXY({ x: 0, y: 6 })).current;
  const floatingMenuLocation = useRef({ x: 0, y: 6 });
  const floatingMenuDragStart = useRef({ x: 0, y: 6 });
  const floatingMenuDragged = useRef(false);
  const floatingMenuBounds = useRef({ maxX: width - FLOATING_MENU_SIZE, maxY: 0 });

  const openDrawer = () => {
    setIsDrawerVisible(true);
    Animated.timing(drawerAnim, {
      toValue: 1,
      duration: 250,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  const floatingMenuResponder = useMemo(() => {
    const dockToLeft = () => {
      const target = {
        x: 0,
        y: Math.max(6, Math.min(floatingMenuLocation.current.y, floatingMenuBounds.current.maxY)),
      };
      floatingMenuLocation.current = target;
      Animated.spring(floatingMenuPosition, {
        toValue: target,
        useNativeDriver: false,
        overshootClamping: true,
      }).start();
    };

    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        floatingMenuDragged.current = false;
        floatingMenuPosition.stopAnimation((position) => {
          floatingMenuLocation.current = position;
          floatingMenuDragStart.current = position;
        });
      },
      onPanResponderMove: (_, gesture) => {
        if (Math.hypot(gesture.dx, gesture.dy) <= 6) return;
        floatingMenuDragged.current = true;
        const position = {
          x: Math.max(0, Math.min(floatingMenuDragStart.current.x + gesture.dx, floatingMenuBounds.current.maxX)),
          y: Math.max(6, Math.min(floatingMenuDragStart.current.y + gesture.dy, floatingMenuBounds.current.maxY)),
        };
        floatingMenuLocation.current = position;
        floatingMenuPosition.setValue(position);
      },
      onPanResponderRelease: (_, gesture) => {
        if (!floatingMenuDragged.current && Math.hypot(gesture.dx, gesture.dy) <= 6) {
          openDrawer();
        }
        dockToLeft();
      },
      onPanResponderTerminate: dockToLeft,
      onPanResponderTerminationRequest: () => false,
    });
  }, [drawerAnim, floatingMenuPosition]);

  const closeDrawer = () => {
    Animated.timing(drawerAnim, {
      toValue: 0,
      duration: 200,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setIsDrawerVisible(false);
    });
  };

  const handleJumpToSection = (sectionKey: string) => {
    closeDrawer();
    setTimeout(() => {
      const targetY = sectionKey === 'top' ? 0 : sectionPositions.current[sectionKey];
      if (targetY !== undefined && mainScrollViewRef.current) {
        mainScrollViewRef.current.scrollTo({
          y: Math.max(0, targetY - 10),
          animated: true,
        });
      }
    }, 220);
  };

  // State quản lý danh sách sách từ API BE
  const [books, setBooks] = useState<HomeBookItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const recommendedBooks = useMemo(() => {
    const list = books.filter(b => b.category_id === 1 || b.category_id === 4);
    return (list.length > 0 ? list : books).slice(0, 5);
  }, [books]);

  // Build shelves only from category metadata returned by the backend.
  // A missing name or ID is excluded rather than being assigned guessed data.
  const shelfCategories = useMemo(() => {
    const categories = new Map<string, { categoryId: number; name: string; books: HomeBookItem[] }>();
    books.forEach((book) => {
      if (book.category_id === undefined || !book.category_name) return;
      const key = `${book.category_id}:${book.category_name}`;
      const category = categories.get(key);
      if (category) category.books.push(book);
      else categories.set(key, { categoryId: book.category_id, name: book.category_name, books: [book] });
    });
    const icons = ['book-outline', 'library-outline', 'newspaper-outline', 'hourglass-outline', 'ribbon-outline'];
    return Array.from(categories.values()).map((category, index) => ({
      ...category,
      id: `cat-${category.categoryId}-${index}`,
      icon: icons[index % icons.length],
    }));
  }, [books]);

  const recentBooks = useMemo(() => getRecentHomeBooks(books), [books]);

  const fetchBooks = useCallback(async () => {
    catalogRequest.current?.abort();
    const controller = new AbortController();
    catalogRequest.current = controller;
    setIsLoading(true);
    setErrorMessage(null);
    const loaded = new Map<string, HomeBookItem>();
    try {
      // Follow real pagination rather than silently limiting the catalogue to 50 books.
      let totalPages = 1;
      for (let page = 0; page < totalPages; page += 1) {
        const response = await fetchApiWithFallback('/api/home/books', {
          params: { page, size: 50 }, timeout: 4000, signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        const result = readHomePage(response.data, response.baseUrl);
        totalPages = result.totalPages;
        result.books.forEach(book => loaded.set(book.id, book));
      }
      setBooks([...loaded.values()]);
    } catch (error: unknown) {
      if (controller.signal.aborted || axios.isCancel(error)) return;
      // Keep existing/partially loaded content usable when one page or a refresh fails.
      if (loaded.size) setBooks([...loaded.values()]);
      const rateLimited = axios.isAxiosError(error) && error.response?.status === 429;
      setErrorMessage(rateLimited
        ? 'Máy chủ đang giới hạn yêu cầu. Vui lòng đợi một lát rồi thử lại.'
        : 'Chưa thể tải đầy đủ thư viện. Kiểm tra kết nối và thử lại.');
    } finally {
      if (!controller.signal.aborted) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Start cancellable HTTP catalogue hydration on mount.
    void fetchBooks();
    return () => catalogRequest.current?.abort();
  }, [fetchBooks]);

  const getTouchPageY = (nativeEvent: {
    pageY?: number;
    touches?: ArrayLike<{ pageY: number }>;
    changedTouches?: ArrayLike<{ pageY: number }>;
  }) => nativeEvent.touches?.[0]?.pageY
  ?? nativeEvent.changedTouches?.[0]?.pageY
    ?? nativeEvent.pageY;

  const drawerTranslateX = drawerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-DRAWER_WIDTH, 0],
  });

  const backdropOpacity = drawerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.55],
  });

  useEffect(() => {
    Animated.timing(bgAnim, {
      toValue: isDarkMode ? 1 : 0,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [bgAnim, isDarkMode]);

  const animatedBg = bgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#F7F5F0', '#181716'],
  });

  const styles = useMemo(() => getStyles(isDarkMode, width), [isDarkMode, width]);
  const primary = isDarkMode ? '#E5A93C' : '#4B8176';
  const textColor = isDarkMode ? '#F7F5F0' : '#242321';
  const homeCardWidth = width < 380 ? 116 : 132;
  // Use real catalog books; there is no Featured API or synthetic fallback content.
  const featuredItems = books.length > 0
    ? books.slice(0, 3).map((book) => ({
      id: `book-${book.id}`,
      eyebrow: 'GIỚI THIỆU SÁCH',
      title: book.title,
      description: book.description?.replace(/<[^>]*>/g, '').trim() || `Tác phẩm của ${book.author || 'tác giả HALMBOOK'}.`,
      book,
    }))
    : [];
  const featuredTrackItems = featuredItems.map(item => ({ item, isClone: false }));
  if (featuredItems.length > 1) {
    featuredTrackItems.push({ item: featuredItems[0], isClone: true });
  }
  const activeFeatured = Math.min(featuredIndex, Math.max(0, featuredItems.length - 1));
  const clearFeaturedAutoAdvance = useCallback(() => {
    if (featuredAutoAdvanceRef.current) clearTimeout(featuredAutoAdvanceRef.current);
    featuredAutoAdvanceRef.current = null;
  }, []);
  const scheduleFeaturedAutoAdvance = useCallback(() => {
    clearFeaturedAutoAdvance();
    if (
      featuredItems.length < 2
      || featuredDraggingRef.current
      || featuredMomentumRef.current
    ) return;

    featuredAutoAdvanceRef.current = setTimeout(() => {
      featuredAutoAdvanceRef.current = null;
      if (featuredDraggingRef.current || featuredMomentumRef.current) return;

      const step = featuredWidth + 12;
      const nextPosition = Math.min(
        featuredItems.length,
        Math.floor(featuredOffsetRef.current / step + 0.000001) + 1,
      );
      featuredAutoTargetRef.current = nextPosition;
      featuredRef.current?.scrollTo({ x: nextPosition * step, animated: true });
    }, 4000);
  }, [clearFeaturedAutoAdvance, featuredItems.length, featuredWidth]);
  const finishFeaturedScroll = useCallback((offset: number) => {
    const step = featuredWidth + 12;
    const clonePosition = featuredItems.length * step;
    const reachedEndClone = featuredItems.length > 1 && offset >= clonePosition - 1;
    const finalOffset = reachedEndClone ? 0 : offset;

    featuredAutoTargetRef.current = null;
    featuredOffsetRef.current = finalOffset;
    if (reachedEndClone) {
      // The clone matches panel 1, so this non-animated reset is visually seamless.
      featuredRef.current?.scrollTo({ x: 0, animated: false });
    }

    const nextIndex = featuredItems.length > 1
      ? Math.round(finalOffset / step) % featuredItems.length
      : 0;
    featuredIndexRef.current = nextIndex;
    setFeaturedIndex(nextIndex);
    scheduleFeaturedAutoAdvance();
  }, [featuredItems.length, featuredWidth, scheduleFeaturedAutoAdvance]);
  const scheduleFeaturedInteractionEnd = useCallback(() => {
    if (featuredDragEndRef.current) clearTimeout(featuredDragEndRef.current);
    featuredDragEndRef.current = setTimeout(() => {
      featuredDragEndRef.current = null;
      if (!featuredDraggingRef.current && !featuredMomentumRef.current) {
        finishFeaturedScroll(featuredOffsetRef.current);
      }
    }, 120);
  }, [finishFeaturedScroll]);
  useEffect(() => {
    scheduleFeaturedAutoAdvance();
    return () => {
      clearFeaturedAutoAdvance();
      if (featuredDragEndRef.current) clearTimeout(featuredDragEndRef.current);
    };
  }, [clearFeaturedAutoAdvance, scheduleFeaturedAutoAdvance]);
  const rankedBooks = useMemo(() => getRankedHomeBooks(books), [books]);
  useEffect(() => {
    featuredAutoTargetRef.current = null;
    featuredOffsetRef.current = 0;
    featuredIndexRef.current = 0;
    featuredRef.current?.scrollTo({ x: 0, animated: false });
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Synchronize the carousel indicator with its imperative scroll reset.
    setFeaturedIndex(0);
  }, [featuredWidth, featuredItems.length]);
  useEffect(() => {
    setFooterVisible?.(true);
    return () => setFooterVisible?.(true);
  }, [setFooterVisible]);

  const handleRefresh = async () => {
    if (refreshStarted.current) return;
    refreshStarted.current = true;
    setRefreshing(true);
    try {
      await fetchBooks();
      setHistoryRefreshKey(key => key + 1);
    } finally {
      refreshStarted.current = false;
      setRefreshing(false);
    }
  };

  const renderNovelCard = (novel: HomeBookItem, cardWidth: number = 115, hasMarginRight: boolean = true, subtitle?: string) => {
    const coverHeight = Math.floor(cardWidth * 1.55);
    return (
      <TouchableOpacity
        key={novel.id}
        style={[
          styles.novelCard,
          { width: cardWidth },
          !hasMarginRight && { marginRight: 0 }
        ]}
        activeOpacity={0.88}
        accessibilityRole="button"
        accessibilityLabel={"Xem trước " + novel.title}
        onPress={() => setSelectedPreviewBook(novel)}
      >
        <View style={[styles.novelCover, { height: coverHeight }]}>
          <HomeCover book={novel} />
        </View>
        <Text style={styles.novelTitle} numberOfLines={2}>{novel.title}</Text>
        {subtitle ? <Text style={styles.novelChapter} numberOfLines={1}>{subtitle}</Text> : null}
      </TouchableOpacity>
    );
  };

  const renderShelfMoreCard = (categoryName: string, categoryId: number, cardWidth: number = 115) => {
    const coverHeight = Math.floor(cardWidth * 1.55);
    const cardHeight = coverHeight + 6 + 42;
    return (
      <TouchableOpacity
        key={`more-${categoryId}`}
        style={[styles.novelCard, styles.moreAction, { width: cardWidth, height: cardHeight }]}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={`Xem thêm sách thuộc ${categoryName}`}
        onPress={() => navigate('genreBooks', { categoryId, categoryName })}
      >
        <Text style={styles.moreActionCategory} numberOfLines={2}>{categoryName}</Text>
        <Text style={styles.moreActionLabel}>Xem thêm</Text>
        <Ionicons name="arrow-forward" size={20} color={isDarkMode ? '#F0D4B5' : '#4A4640'} />
      </TouchableOpacity>
    );
  };

  const renderRankItem = (novel: HomeBookItem, index: number) => {
    return (
      <TouchableOpacity key={novel.id} style={styles.rankItem} activeOpacity={0.8} onPress={() => setSelectedPreviewBook(novel)}>
        <Text style={[styles.rankNumber, index === 0 ? styles.rankNumberFirst : index === 1 ? styles.rankNumberSecond : index === 2 ? styles.rankNumberThird : null]}>{index + 1}</Text>
        <View style={styles.rankCover}>
          <HomeCover book={novel} />
        </View>
        <View style={styles.rankInfo}>
          <Text style={styles.rankTitle} numberOfLines={1}>{novel.title}</Text>
          <Text style={styles.rankChapter} numberOfLines={1}>{novel.reads} lượt đọc · {novel.author}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const toolbarData = [
    {
      icon: 'trophy',
      label: 'Xếp Hạng',
      screen: 'transactions',
      bgLight: '#F7F5F0',
      iconLight: '#8B4A3C',
      borderLight: '#E6E1D8',
      bgDark: '#303530',
      iconDark: '#BC8B7B',
      borderDark: '#45351E',
    },
    {
      icon: 'bookmarks',
      label: 'Đã Lưu',
      screen: 'bookshelf',
      initialBookshelfTab: 'yeuthich' as const,
      bgLight: '#EEF2FF',
      iconLight: '#4B8176',
      borderLight: '#E0E7FF',
      bgDark: '#1C1F38',
      iconDark: '#8FC3B5',
      borderDark: '#31355E',
    },
    {
      icon: 'newspaper',
      label: 'Bảng Tin',
      screen: 'dmHome',
      bgLight: '#F7F5F0',
      iconLight: '#35695F',
      borderLight: '#D1FAE5',
      bgDark: '#292D2A',
      iconDark: '#8FC3B5',
      borderDark: '#1F473C',
    },
    {
      icon: 'gift',
      label: 'Ưu Đãi',
      screen: 'offers',
      bgLight: '#FFF1F2',
      iconLight: '#E11D48',
      borderLight: '#FFE4E6',
      bgDark: '#2E151B',
      iconDark: '#FB7185',
      borderDark: '#52232D',
    },
  ];

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.container, styles.safeAreaHeader, { backgroundColor: isDarkMode ? '#181716' : '#EAE6DF' }]}>
      <Animated.View
        style={[styles.container, styles.homeFrame, { backgroundColor: animatedBg }]}
        onLayout={({ nativeEvent: { layout } }) => {
          // Reserve space for the bottom navigation even while it is hidden.
          floatingMenuBounds.current = {
            maxX: Math.max(0, layout.width - FLOATING_MENU_SIZE),
            maxY: Math.max(6, layout.height - FLOATING_MENU_SIZE - 90 - insets.bottom),
          };
          const position = {
            x: Math.min(floatingMenuLocation.current.x, floatingMenuBounds.current.maxX),
            y: Math.min(floatingMenuLocation.current.y, floatingMenuBounds.current.maxY),
          };
          floatingMenuLocation.current = position;
          floatingMenuPosition.setValue(position);
        }}
      >
      <ExpoStatusBar style={isDarkMode ? 'light' : 'dark'} />

      {/* HIỆU ỨNG DARK MODE - COPY TỪ UUDAI */}
      <DarkModeBackgroundEffects visible={isDarkMode} screenWidth={window.width} screenHeight={window.height} />
      {isDarkMode && <HomeFloatingMoon />}



      <ScrollView
        ref={mainScrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 110 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
        bounces
        refreshControl={Platform.OS === 'web' ? undefined : (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={isDarkMode ? '#8FC3B5' : '#5a8b82'}
            colors={['#4B8176']}
          />
        )}
        onScroll={(event) => {
          const currentY = event.nativeEvent.contentOffset.y;
          setShowFloatingMenu(currentY >= 46);
          if (currentY <= 10) setFooterVisible?.(true);
          const diff = currentY - scrollOffset.current;
          if (Math.abs(diff) > 8) {
            if (diff > 0 && currentY > 60) {
              setFooterVisible?.(false);
            } else if (diff < 0) {
              setFooterVisible?.(true);
            }
          }
          scrollOffset.current = currentY;
        }}
        scrollEventThrottle={16}
        onTouchStart={(event) => {
          const pageY = getTouchPageY(event.nativeEvent);
          pullStart.current = scrollOffset.current <= 0 ? pageY ?? null : null;
        }}
        onTouchMove={(event) => {
          if (Platform.OS !== 'web' || pullStart.current === null || scrollOffset.current > 0) return;
          const pageY = getTouchPageY(event.nativeEvent);
          if (pageY !== undefined && pageY - pullStart.current >= 90) handleRefresh();
        }}
        onTouchEnd={() => { pullStart.current = null; }}
        onTouchCancel={() => { pullStart.current = null; }}
      >

        <View
          style={styles.topBackground}
          onLayout={(e) => {
            sectionPositions.current['top'] = e.nativeEvent.layout.y;
          }}
        >
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.menuBtn}
              onPress={openDrawer}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="Mở danh mục điều hướng"
            >
              <Ionicons name="menu" size={24} color={textColor} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.searchContainer}
              activeOpacity={0.9}
              onPress={() => navigate('search')}
              accessibilityRole="button"
              accessibilityLabel="Tìm kiếm sách, tác giả"
            >
              <Ionicons
                name="search-outline"
                size={18}
                color={isDarkMode ? '#D7FFF5' : '#625E57'}
                style={{ marginRight: 8 }}
              />
              <Text style={styles.searchInput} numberOfLines={1}>
                Tìm kiếm sách, tác giả...
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.darkModeToggle}
              onPress={onToggleDarkMode}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel={isDarkMode ? 'Bật chế độ sáng' : 'Bật chế độ tối'}
            >
              <Ionicons
                name={isDarkMode ? 'sunny' : 'moon'}
                size={20}
                color={primary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.darkModeToggle, { marginLeft: 4 }]}
              onPress={() => navigate('cart')}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="Giỏ hàng"
            >
              <Ionicons name="cart-outline" size={21} color={textColor} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.darkModeToggle, { marginLeft: 4 }]}
              onPress={() => navigate('notifications')}
              accessibilityRole="button"
              accessibilityLabel={`Thông báo${unreadNotifications ? `, ${unreadNotifications} chưa đọc` : ''}`}
            >
              <Ionicons name="notifications-outline" size={21} color={isDarkMode ? '#F7F5F0' : '#242321'} />
              {unreadNotifications > 0 && <View style={{ position: 'absolute', top: 3, right: 2, minWidth: 16, height: 16, borderRadius: 8, paddingHorizontal: 3, backgroundColor: '#D5AC56', alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 9, fontWeight: '800', color: '#382F23' }}>{unreadNotifications > 99 ? '99+' : unreadNotifications}</Text></View>}
            </TouchableOpacity>
          </View>
          {featuredItems.length > 0 ? <>
            <ScrollView ref={featuredRef} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carouselContainer}
              scrollEventThrottle={16}
              onTouchStart={() => {
                featuredDraggingRef.current = true;
                featuredMomentumRef.current = false;
                featuredAutoTargetRef.current = null;
                clearFeaturedAutoAdvance();
                if (featuredDragEndRef.current) clearTimeout(featuredDragEndRef.current);
              }}
              onTouchEnd={() => {
                featuredDraggingRef.current = false;
                scheduleFeaturedInteractionEnd();
              }}
              onTouchCancel={() => {
                featuredDraggingRef.current = false;
                scheduleFeaturedInteractionEnd();
              }}
              onScroll={event => {
                const offset = Math.max(0, event.nativeEvent.contentOffset.x);
                const step = featuredWidth + 12;
                featuredOffsetRef.current = offset;

                const visibleIndex = featuredItems.length > 1
                  ? Math.round(offset / step) % featuredItems.length
                  : 0;
                if (featuredIndexRef.current !== visibleIndex) {
                  featuredIndexRef.current = visibleIndex;
                  setFeaturedIndex(visibleIndex);
                }

                const target = featuredAutoTargetRef.current;
                if (target !== null && Math.abs(offset - target * step) <= 1) {
                  finishFeaturedScroll(target * step);
                }
              }}
              onScrollBeginDrag={() => {
                featuredDraggingRef.current = true;
                featuredMomentumRef.current = false;
                featuredAutoTargetRef.current = null;
                clearFeaturedAutoAdvance();
                if (featuredDragEndRef.current) clearTimeout(featuredDragEndRef.current);
              }}
              onScrollEndDrag={() => {
                featuredDraggingRef.current = false;
                scheduleFeaturedInteractionEnd();
              }}
              onMomentumScrollBegin={() => {
                featuredMomentumRef.current = true;
                clearFeaturedAutoAdvance();
                if (featuredDragEndRef.current) {
                  clearTimeout(featuredDragEndRef.current);
                  featuredDragEndRef.current = null;
                }
              }}
              onMomentumScrollEnd={event => {
                featuredMomentumRef.current = false;
                if (featuredDragEndRef.current) {
                  clearTimeout(featuredDragEndRef.current);
                  featuredDragEndRef.current = null;
                }
                finishFeaturedScroll(Math.max(0, event.nativeEvent.contentOffset.x));
              }}>
              {featuredTrackItems.map(({ item, isClone }) => (
                 <View
                   key={isClone ? item.id + '-loop-clone' : item.id}
                   style={[styles.featuredPanel, isDarkMode && styles.featuredPanelDark, { width: featuredWidth }]}
                 >
                  <View style={styles.featuredEditorialCopy}>
                    <Text style={[styles.featuredEyebrow, isDarkMode && styles.featuredEyebrowDark]}>{item.eyebrow}</Text>
                    <Text style={[styles.featuredTitle, isDarkMode && styles.featuredTitleDark]} numberOfLines={2}>{item.title}</Text>
                    <Text style={[styles.featuredDescription, isDarkMode && styles.featuredDescriptionDark]} numberOfLines={3}>{item.description}</Text>
                  </View>
                  <View style={[styles.featuredEditorialImage, isDarkMode && styles.featuredEditorialImageDark]}>
                    {item.book ? <HomeCover book={item.book} /> : <Ionicons name="book-outline" size={40} color={isDarkMode ? '#E5A93C' : '#8B4A3C'} />}
                  </View>
                </View>
              ))}
            </ScrollView>
            <View style={styles.paginationDots}>
              {featuredItems.map((item, index) => <TouchableOpacity key={item.id} style={styles.dotTarget} accessibilityRole="button" accessibilityLabel={`Chuyển đến nội dung ${index + 1}`} accessibilityState={{ selected: index === activeFeatured }} onPress={() => {
                clearFeaturedAutoAdvance();
                const target = index * (featuredWidth + 12);
                if (Math.abs(featuredOffsetRef.current - target) < 0.5) {
                  featuredIndexRef.current = index;
                  setFeaturedIndex(index);
                  scheduleFeaturedAutoAdvance();
                } else {
                  featuredAutoTargetRef.current = index;
                  featuredRef.current?.scrollTo({ x: target, animated: true });
                }
              }}>
                <View style={[styles.dot, index === activeFeatured && styles.dotActive]} />
              </TouchableOpacity>)}
            </View>
          </> : null}
        </View>

        {errorMessage && books.length > 0 && <View style={styles.refreshNotice} accessibilityLiveRegion="polite">
          <Text style={styles.statusErrorText}>{errorMessage} Nội dung đã tải vẫn được giữ lại.</Text>
          <TouchableOpacity onPress={() => void handleRefresh()} disabled={isLoading} accessibilityRole="button" accessibilityLabel="Thử tải lại thư viện" style={styles.retryBtn}>
            <Text style={styles.retryBtnText}>{isLoading ? 'Đang tải…' : 'Thử lại'}</Text>
          </TouchableOpacity>
        </View>}
        {refreshing && <View style={styles.refreshStatus} accessibilityLiveRegion="polite"><ActivityIndicator size="small" color={primary} /><Text style={styles.statusText}>Đang làm mới thư viện…</Text></View>}

        <ContinueReading books={books} refreshKey={historyRefreshKey} />

        <View
          style={styles.section}
          onLayout={(e) => {
            sectionPositions.current['recommend'] = e.nativeEvent.layout.y;
          }}
        >
          <View style={styles.sectionTitleBox}>
            <View style={styles.sectionAccent} />
            <Text style={styles.sectionTitleText}>Khuyến Khích Đọc</Text>
          </View>
          {isLoading && books.length === 0 ? (
            <View style={styles.statusBox}>
              <ActivityIndicator size="small" color={isDarkMode ? '#8FC3B5' : '#5a8b82'} />
              <Text style={styles.statusText}>Đang tải dữ liệu sách...</Text>
            </View>
          ) : errorMessage && books.length === 0 ? (
            <View style={styles.statusBox}>
              <Text style={styles.statusErrorText}>{errorMessage}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={() => fetchBooks()}>
                <Text style={styles.retryBtnText}>Thử lại</Text>
              </TouchableOpacity>
            </View>
          ) : books.length === 0 ? (
            <View style={styles.statusBox}>
              <Text style={styles.statusEmptyText}>Chưa có sách nào trong kho lưu trữ</Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollList}>
              {recommendedBooks.map(n => renderNovelCard(n, homeCardWidth, true))}
            </ScrollView>
          )}
        </View>

        <View
          style={styles.section}
          onLayout={(e) => {
            sectionPositions.current['ranking'] = e.nativeEvent.layout.y;
          }}
        >
          <View style={styles.sectionTitleBox}>
            <View style={styles.sectionAccent} />
            <Text style={styles.sectionTitleText}>Bảng Xếp Hạng</Text>
          </View>

          {isLoading && books.length === 0 ? (
            <View style={styles.statusBox}>
              <ActivityIndicator size="small" color={isDarkMode ? '#8FC3B5' : '#5a8b82'} />
              <Text style={styles.statusText}>Đang tải bảng xếp hạng...</Text>
            </View>
          ) : errorMessage && books.length === 0 ? (
            <View style={styles.statusBox}>
              <Text style={styles.statusErrorText}>{errorMessage}</Text>
            </View>
          ) : rankedBooks.length === 0 ? (
            <View style={styles.statusBox}>
              <Text style={styles.statusEmptyText}>Chưa có lượt đọc thực tế để xếp hạng.</Text>
            </View>
          ) : (
            <View style={{ paddingHorizontal: 16 }}>
              <View style={styles.rankPage}>
                <View style={styles.rankPageHeader}>
                  <Text style={styles.rankPageTitle}>Được đọc nhiều trong danh sách đang tải</Text>
                </View>
                {rankedBooks.map((novel, index) => renderRankItem(novel, index))}
              </View>
            </View>
          )}
        </View>

        <View
          style={styles.section}
          onLayout={(e) => {
            sectionPositions.current['recent'] = e.nativeEvent.layout.y;
          }}
        >
          <View style={styles.sectionTitleBox}>
            <View style={styles.sectionAccent} />
            <Text style={styles.sectionTitleText}>Mới Cập Nhật</Text>
            <TouchableOpacity onPress={() => setShowAllRecentBooks(value => !value)} style={styles.sectionMoreButton} accessibilityRole="button" accessibilityLabel={showAllRecentBooks ? 'Thu gọn sách mới cập nhật' : 'Xem danh sách sách mới cập nhật'}>
              <Text style={styles.shelfMoreText}>{showAllRecentBooks ? 'Thu gọn' : 'Xem thêm'}</Text>
              <Ionicons name={showAllRecentBooks ? 'arrow-up' : 'arrow-forward'} size={14} color={isDarkMode ? '#E5A93C' : '#4B8176'} />
            </TouchableOpacity>
          </View>
          {isLoading && books.length === 0 ? (
            <View style={styles.statusBox}>
              <ActivityIndicator size="small" color={isDarkMode ? '#8FC3B5' : '#5a8b82'} />
              <Text style={styles.statusText}>Đang tải dữ liệu sách...</Text>
            </View>
          ) : errorMessage && books.length === 0 ? (
            <View style={styles.statusBox}>
              <Text style={styles.statusErrorText}>{errorMessage}</Text>
            </View>
          ) : recentBooks.length === 0 ? (
            <View style={styles.statusBox}>
              <Text style={styles.statusEmptyText}>Chưa có ngày cập nhật hoặc ngày thêm sách hợp lệ để hiển thị.</Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollList}>
              {(showAllRecentBooks ? recentBooks : recentBooks.slice(0, 5)).map(n => renderNovelCard(n, homeCardWidth, true))}
            </ScrollView>
          )}
        </View>

        {/* DANH MỤC THỂ LOẠI: TÁCH RIÊNG TỪNG HÀNG SÁCH LƯỚT NGANG KÈM Ô MỞ RỘNG (GIỐNG WEB) */}
        {shelfCategories.map((shelf) => {
          if (!shelf.books || shelf.books.length === 0) return null;
          return (
            <View
              key={shelf.id}
              style={styles.shelfSection}
              onLayout={(e) => {
                sectionPositions.current[shelf.id] = e.nativeEvent.layout.y;
              }}
            >
              <View style={styles.shelfHeader}>
                <View style={styles.shelfTitleWrapper}>
                  <View style={[styles.shelfIconBadge, { backgroundColor: isDarkMode ? '#292D2A' : '#F7F5F0' }]}>
                    <Ionicons name={shelf.icon as any} size={15} color={isDarkMode ? '#8FC3B5' : '#8B4A3C'} />
                  </View>
                  <Text style={styles.shelfName} numberOfLines={2}>{shelf.name}</Text>
                </View>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollList}>
                {shelf.books.slice(0, 7).map(n => renderNovelCard(n, homeCardWidth, true))}
                {renderShelfMoreCard(shelf.name, shelf.categoryId, homeCardWidth)}
              </ScrollView>
            </View>
          );
        })}

        <View style={styles.editorialPanel}>
          <Text style={styles.featuredEyebrow}>GÓC ĐỌC CHẬM</Text>
          <Text style={styles.editorialTitle}>Một khoảng lặng cho trang sách.</Text>
          <Text style={styles.editorialDescription}>Chọn một chủ đề bạn quan tâm, đọc theo nhịp riêng và khám phá những góc nhìn khác nhau trong từng tác phẩm.</Text>
          <TouchableOpacity onPress={() => navigate('categories')} accessibilityRole="button" style={styles.editorialAction}>
            <Text style={styles.shelfMoreText}>Tìm chủ đề để bắt đầu</Text>
            <Ionicons name="arrow-forward" size={14} color={isDarkMode ? '#E5A93C' : '#4B8176'} />
          </TouchableOpacity>
        </View>
        <View style={styles.footerBranding}>
          <Text style={styles.footerBrandTitle}>HALM <Text style={{ color: isDarkMode ? '#8FC3B5' : '#4B8176' }}>Book</Text></Text>
          <Text style={styles.footerBrandSlogan}>Sách là ánh sáng!</Text>
        </View>

        </ScrollView>

      {showFloatingMenu && (
        <Animated.View
          {...floatingMenuResponder.panHandlers}
          style={[
            styles.floatingMenuBtn,
            {
              transform: floatingMenuPosition.getTranslateTransform(),
            },
          ]}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Mở danh mục điều hướng"
          accessibilityHint="Chạm để mở danh mục. Kéo để đổi vị trí nút."
          onAccessibilityTap={openDrawer}
          {...(Platform.OS === 'web' ? {
            tabIndex: 0,
            onKeyDown: (event) => {
              const key = (event.nativeEvent as { key?: string }).key;
              if (key === 'Enter' || key === ' ') {
                event.preventDefault();
                openDrawer();
              }
            },
          } : {})}
        >
          <Ionicons name="menu" size={24} color={textColor} />
        </Animated.View>
      )}

      </Animated.View>

      {/* POPUP XEM SƠ BỘ THÔNG TIN SÁCH (CHÈN BƯỚC Ở GIỮA TRƯỚC KHI VÀO CHI TIẾT) */}
      <Modal
        visible={!!selectedPreviewBook}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedPreviewBook(null)}
      >
        <View
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setSelectedPreviewBook(null)}
            accessibilityRole="button"
            accessibilityLabel="Đóng thông tin tác phẩm"
          />
          <View
            style={[styles.previewPopupCard, { maxHeight: Math.max(160, window.height - insets.top - insets.bottom - 32) }]}
          >
            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
            {/* Header Popup */}
            <View style={styles.popupHeader}>
              <View style={styles.popupBadge}>
                <Ionicons name="information-circle" size={15} color={isDarkMode ? '#8FC3B5' : '#8B4A3C'} />
                <Text style={styles.popupBadgeText}>Thông tin tác phẩm</Text>
              </View>
              <TouchableOpacity
                style={styles.popupCloseBtn}
                onPress={() => setSelectedPreviewBook(null)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons name="close" size={18} color={isDarkMode ? '#B9B7AF' : '#77736C'} />
              </TouchableOpacity>
            </View>

            {/* Thông tin chính: Bìa + Cột chi tiết */}
            <View style={styles.popupMainRow}>
              <View style={styles.popupCoverWrap}>
                {selectedPreviewBook && <HomeCover book={selectedPreviewBook} />}
              </View>

              <View style={styles.popupDetailCol}>
                <Text style={styles.popupBookTitle} numberOfLines={2}>
                  {selectedPreviewBook?.title}
                </Text>

                <View style={styles.popupInfoRow}>
                  <Ionicons name="person" size={13} color={isDarkMode ? '#8FC3B5' : '#8B4A3C'} />
                  <Text style={styles.popupAuthorText} numberOfLines={1}>
                    {selectedPreviewBook?.author || 'HALM BOOK'}
                  </Text>
                </View>

                <View style={styles.popupInfoRow}>
                  <Ionicons name="bookmark" size={13} color={isDarkMode ? '#8FC3B5' : '#4B8176'} />
                  <Text style={styles.popupTagText} numberOfLines={1}>
                    {selectedPreviewBook?.tag || selectedPreviewBook?.category_name || 'Sách hay'}
                  </Text>
                </View>

                <View style={styles.popupInfoRow}>
                  <Ionicons name="document-text" size={13} color={isDarkMode ? '#8FC3B5' : '#35695F'} />
                  <Text style={styles.popupChapterText} numberOfLines={1}>
                    {selectedPreviewBook?.chapter || 'Chưa có thông tin chương'}
                  </Text>
                </View>

                {(selectedPreviewBook?.updatedAt || selectedPreviewBook?.createdAt) ? (
                  <View style={styles.popupInfoRow}>
                    <Ionicons name="time-outline" size={13} color={isDarkMode ? '#A39F99' : '#85817A'} />
                    <Text style={styles.popupMetaText} numberOfLines={1}>
                      {formatHomeBookDate(selectedPreviewBook)}
                    </Text>
                  </View>
                ) : null}

                {(selectedPreviewBook?.rating || selectedPreviewBook?.reads) ? <View style={styles.popupRatingRow}>
                  {selectedPreviewBook.rating && <><Ionicons name="star" size={13} color="#B87968" /><Text style={styles.popupRatingText}>{selectedPreviewBook.rating}</Text></>}
                  {selectedPreviewBook.reads && <Text style={styles.popupReadsText}>{selectedPreviewBook.reads} lượt đọc</Text>}
                </View> : null}
              </View>
            </View>

            {/* Tóm tắt sơ bộ nếu có */}
            {selectedPreviewBook?.description ? (
              <View style={styles.popupDescBox}>
                <Text style={styles.popupDescText} numberOfLines={3}>
                  {selectedPreviewBook.description}
                </Text>
              </View>
            ) : null}

            {/* Nút hành động xem chi tiết */}
            <TouchableOpacity
              style={styles.popupActionBtn}
              activeOpacity={0.85}
              onPress={() => {
                if (selectedPreviewBook) {
                  const bookToOpen = selectedPreviewBook;
                  setSelectedPreviewBook(null);
                  navigate('bookDetail', bookToOpen);
                }
              }}
            >
              <Text style={styles.popupActionBtnText}>Xem chi tiết sách</Text>
              <Ionicons name="arrow-forward" size={16} color={isDarkMode ? '#12151B' : '#ffffff'} />
            </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* THANH ĐIỀU HƯỚNG DRAWER (NAVBAR DỌC TRƯỢT TỪ BÊN TRÁI) */}
      <Modal
        visible={isDrawerVisible}
        transparent
        animationType="none"
        onRequestClose={closeDrawer}
      >
        <View style={styles.drawerModalOverlay}>
          {/* Backdrop mờ nền khi mở menu */}
          <Animated.View
            style={[
              styles.drawerBackdrop,
              { opacity: backdropOpacity },
            ]}
          >
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              activeOpacity={1}
              onPress={closeDrawer}
            />
          </Animated.View>

          {/* Khung thanh Drawer trượt từ bên trái */}
          <Animated.View
            style={[
              styles.drawerContainer,
              {
                width: DRAWER_WIDTH,
                transform: [{ translateX: drawerTranslateX }],
              },
            ]}
          >
            {/* HIỆU ỨNG DARK MODE ĐỒNG BỘ TRANG CHỦ */}
            <DarkModeBackgroundEffects visible={isDarkMode} screenWidth={window.width} screenHeight={window.height} />

            {/* Header Drawer */}
            <View style={[styles.drawerHeader, { paddingTop: insets.top + 12 }]}>
              <View style={styles.drawerHeaderInfo}>
                <View style={styles.drawerLogoBadge}>
                  <Ionicons name="book" size={18} color={isDarkMode ? '#FFFFFF' : '#8B4A3C'} />
                </View>
                <View>
                  <Text style={styles.drawerBrandText}>
                    HALM <Text style={{ color: isDarkMode ? '#8FC3B5' : '#8B4A3C' }}>Book</Text>
                  </Text>
                  <Text style={styles.drawerSubText}>Điều hướng trang chủ</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.drawerCloseBtn}
                onPress={closeDrawer}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Đóng thanh điều hướng"
              >
                <Ionicons name="close" size={20} color={isDarkMode ? '#FFFFFF' : '#242321'} />
              </TouchableOpacity>
            </View>

            {/* Nội dung danh sách các mục */}
            <ScrollView
              style={styles.drawerScroll}
              contentContainerStyle={[styles.drawerScrollContent, { paddingBottom: Math.max(insets.bottom, 14) }]}
              showsVerticalScrollIndicator={false}
            >
              <TouchableOpacity
                style={styles.drawerItem}
                activeOpacity={0.75}
                onPress={() => {
                  closeDrawer();
                  setTimeout(() => navigate('categories'), 220);
                }}
                accessibilityRole="button"
                accessibilityLabel="Mở bộ lọc sách"
              >
                  <View style={[styles.drawerItemIconBox, { backgroundColor: isDarkMode ? '#203831' : '#EAE6DF' }]}>
                  <Ionicons name="options-outline" size={18} color={isDarkMode ? '#87C9B5' : '#8B4A3C'} />
                </View>
                <View style={styles.drawerItemTextBox}>
                  <Text style={styles.drawerItemTitle}>Bộ lọc</Text>
                  <Text style={styles.drawerItemDesc}>Tìm sách theo thể loại và sắp xếp</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={isDarkMode ? '#6E7687' : '#9E988E'} />
              </TouchableOpacity>
              {/* NHÓM 1: ĐIỀU HƯỚNG NHANH */}
              <View style={styles.drawerSectionGroup}>
                <Text style={styles.drawerGroupTitle}>MỤC NỔI BẬT</Text>

                <TouchableOpacity
                  style={styles.drawerItem}
                  activeOpacity={0.75}
                  onPress={() => handleJumpToSection('recommend')}
                >
                  <View style={[styles.drawerItemIconBox, { backgroundColor: isDarkMode ? '#303530' : '#F7F5F0' }]}>
                    <Ionicons name="sparkles" size={17} color={isDarkMode ? '#BC8B7B' : '#8B4A3C'} />
                  </View>
                  <View style={styles.drawerItemTextBox}>
                    <Text style={styles.drawerItemTitle}>Khuyến Khích Đọc</Text>
                    <Text style={styles.drawerItemDesc}>Khám phá tác phẩm trong thư viện</Text>
                  </View>
                  {recommendedBooks.length > 0 && (
                    <View style={styles.drawerBadge}>
                      <Text style={styles.drawerBadgeText}>{recommendedBooks.length}</Text>
                    </View>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.drawerItem}
                  activeOpacity={0.75}
                  onPress={() => handleJumpToSection('recent')}
                >
                  <View style={[styles.drawerItemIconBox, { backgroundColor: isDarkMode ? '#292D2A' : '#EAE6DF' }]}>
                  <Ionicons name="flash" size={17} color={isDarkMode ? '#8FC3B5' : '#8B4A3C'} />
                  </View>
                  <View style={styles.drawerItemTextBox}>
                    <Text style={styles.drawerItemTitle}>Mới Cập Nhật</Text>
                    <Text style={styles.drawerItemDesc}>Tác phẩm trong danh sách hiện có</Text>
                  </View>
                  {recentBooks.length > 0 && (
                    <View style={styles.drawerBadge}>
                      <Text style={styles.drawerBadgeText}>{recentBooks.length}</Text>
                    </View>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.drawerItem}
                  activeOpacity={0.75}
                  onPress={() => handleJumpToSection('ranking')}
                >
                  <View style={[styles.drawerItemIconBox, { backgroundColor: isDarkMode ? '#303530' : '#F7F5F0' }]}>
                    <Ionicons name="trophy" size={17} color={isDarkMode ? '#BC8B7B' : '#8B4A3C'} />
                  </View>
                  <View style={styles.drawerItemTextBox}>
                    <Text style={styles.drawerItemTitle}>Bảng Xếp Hạng</Text>
                    <Text style={styles.drawerItemDesc}>Lượt đọc thực tế trong danh sách</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={isDarkMode ? '#6E7687' : '#9E988E'} />
                </TouchableOpacity>
              </View>

              {/* NHÓM 2: DANH MỤC THỂ LOẠI */}
              <View style={styles.drawerSectionGroup}>
                <TouchableOpacity
                  style={styles.drawerGroupHeaderBtn}
                  activeOpacity={0.7}
                  onPress={() => setIsDrawerCategoriesExpanded((expanded) => !expanded)}
                >
                  <Text style={styles.drawerGroupTitle}>DANH MỤC THỂ LOẠI</Text>
                  <Ionicons name={isDrawerCategoriesExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={isDarkMode ? '#E5A93C' : '#8B4A3C'} />
                </TouchableOpacity>

                {isDrawerCategoriesExpanded && shelfCategories.map((shelf) => {
                  const bookCount = shelf.books?.length || 0;
                  return (
                    <TouchableOpacity
                      key={`drawer-shelf-${shelf.id}`}
                      style={styles.drawerCategoryRow}
                      activeOpacity={0.75}
                      onPress={() => {
                        if (shelf.books.length) handleJumpToSection(shelf.id);
                        else {
                          closeDrawer();
                          setTimeout(() => navigate('genreBooks', { categoryId: shelf.categoryId, categoryName: shelf.name }), 220);
                        }
                      }}
                    >
                      <View style={styles.drawerCategoryIcon}>
                        <Ionicons name={shelf.icon as any} size={18} color={isDarkMode ? '#E5A93C' : '#8B4A3C'} />
                      </View>
                      <View style={styles.drawerItemTextBox}>
                        <Text style={styles.drawerItemTitle} numberOfLines={1}>{shelf.name}</Text>
                        <Text style={styles.drawerItemDesc}>{bookCount} cuốn sách</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={isDarkMode ? '#A39F99' : '#9E988E'} />
                    </TouchableOpacity>
                  );
                })}
              </View>

            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const getStyles = (isDark: boolean, width: number) => {
  const textMain = isDark ? '#F7F5F0' : '#242321';
  const textSub = isDark ? '#A39F99' : '#85817A';
  const pageBg = isDark ? '#181716' : '#F7F5F0';

  const cardBg = isDark ? '#242321' : '#ffffff';
  const cardRaised = isDark ? '#242321' : '#ffffff';
  const coverBg = isDark ? '#2D2B28' : '#F2EFE9';
  const cardBorder = isDark ? '#383633' : '#E6E1D8';
  const accent = isDark ? '#E5A93C' : '#8B4A3C';
  const chipBg = isDark ? '#2D2B28' : '#EAE6DF';

  return StyleSheet.create({
    container: { flex: 1, backgroundColor: pageBg },
    homeFrame: { width: '100%', maxWidth: 1040, alignSelf: 'center' },
    featuredHeading: { paddingHorizontal: 16, marginBottom: 8 },
    pageTitle: { fontSize: 28, lineHeight: 36, fontWeight: '700', color: textMain, marginTop: 6 },
    featuredPanel: { minHeight: 156, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', padding: width < 360 ? 14 : 18, borderRadius: 16, marginRight: 12, borderWidth: 1, borderColor: '#E6E1D8', shadowColor: '#242321', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 },
    featuredPanelDark: { backgroundColor: '#242321', borderColor: '#383633', shadowColor: '#000000', shadowOpacity: 0.2 },
    featuredEditorialCopy: { flex: 1, minWidth: 0, paddingRight: 12 },
    featuredEditorialImage: { width: width < 360 ? 74 : 90, height: width < 360 ? 108 : 126, borderRadius: 10, backgroundColor: '#F3EEE7', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    featuredEditorialImageDark: { backgroundColor: '#2D2B28' },
    featuredCopy: { flex: 1, minWidth: 0, alignItems: 'flex-start' },
    featuredEyebrow: { fontSize: 11, lineHeight: 16, fontWeight: '700', letterSpacing: 0.6, color: '#8B4A3C' },
    featuredEyebrowDark: { color: '#E5A93C' },
    featuredTitle: { fontSize: width < 360 ? 19 : 22, lineHeight: width < 360 ? 25 : 29, fontWeight: '700', color: '#242321', marginTop: 7 },
    featuredTitleDark: { color: '#F7F5F0' },
    featuredAuthor: { fontSize: 13, lineHeight: 19, color: '#625E57', marginTop: 6 },
    featuredDescription: { fontSize: 12, lineHeight: 18, color: '#625E57', marginTop: 8 },
    featuredDescriptionDark: { color: '#A39F99' },
    featuredCover: { width: width < 360 ? 80 : width < 600 ? 100 : 150, aspectRatio: 0.68, backgroundColor: isDark ? '#2D2B28' : '#E6E1D8', borderRadius: 4, overflow: 'hidden' },
    featuredCta: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, marginTop: 14, backgroundColor: isDark ? '#E5A93C' : '#4B8176', borderRadius: 6 },
    featuredCtaText: { fontSize: 13, fontWeight: '600', color: isDark ? '#181716' : '#FFFFFF' },
    featuredEmpty: { minHeight: 112, borderRadius: 12, marginHorizontal: 16, paddingHorizontal: 18, paddingVertical: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: isDark ? '#242321' : '#B7E3D8', borderWidth: 1, borderColor: isDark ? '#383633' : '#7DBBAE' },
    featuredEmptyText: { marginTop: 7, fontSize: 13, lineHeight: 19, textAlign: 'center', color: isDark ? '#A39F99' : '#245C53' },
    dotTarget: { minWidth: 24, minHeight: 20, alignItems: 'center', justifyContent: 'center' },
    editorialPanel: { margin: 16, marginBottom: 28, padding: 20, backgroundColor: isDark ? '#242321' : '#F7F5F0', borderLeftWidth: 3, borderLeftColor: isDark ? '#E5A93C' : '#8B4A3C', borderWidth: isDark ? 1 : 0, borderColor: isDark ? '#383633' : 'transparent' },
    editorialTitle: { fontSize: 20, lineHeight: 28, color: textMain, fontWeight: '700', marginTop: 8 },
    editorialDescription: { fontSize: 14, lineHeight: 22, color: textSub, marginTop: 8 },
    editorialAction: { minHeight: 44, flexDirection: 'row', flexWrap: 'nowrap', alignItems: 'center', justifyContent: 'flex-start', alignSelf: 'flex-start', gap: 7, marginTop: 4, paddingRight: 8 },
    scrollView: { flex: 1, backgroundColor: 'transparent' },
    scrollContent: { paddingBottom: 120 },
    refreshNotice: { marginHorizontal: 16, padding: 16, alignItems: 'center', marginBottom: 20, backgroundColor: isDark ? '#242321' : '#FFFFFF', borderRadius: 8, borderWidth: 1, borderColor: cardBorder },
    refreshStatus: { paddingHorizontal: 16, paddingBottom: 16, alignItems: 'center' },

    safeAreaHeader: { backgroundColor: isDark ? '#1F2228' : '#EAE6DF' },
    topBackground: {
      backgroundColor: isDark ? '#1F2228' : '#EAE6DF',
      borderBottomLeftRadius: 20,
      borderBottomRightRadius: 20,
      paddingTop: 0,
      paddingBottom: 20,
      marginBottom: isDark ? 14 : 10,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#383633' : '#EAE6DF',
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 52,
      paddingHorizontal: 12,
      marginBottom: 14,
    },
    menuBtn: {
      width: 40,
      height: 40,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
    floatingMenuBtn: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: FLOATING_MENU_SIZE,
      height: FLOATING_MENU_SIZE,
      borderRadius: FLOATING_MENU_SIZE / 2,
      borderWidth: 1,
      borderColor: isDark ? '#383633' : 'rgba(255,255,255,0.65)',
      backgroundColor: isDark ? '#242321' : '#F7F5F0',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10,
      elevation: 6,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 7,
      ...(Platform.OS === 'web' ? { touchAction: 'none', cursor: 'pointer' } as const : {}),
    },
    searchContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#242321' : '#EAE6DF',
      borderWidth: 1,
      borderColor: isDark ? '#383633' : '#D2C8BA',
      borderRadius: 10,
      paddingHorizontal: 12,
      height: 40,
      marginHorizontal: 8,
    },
    searchInput: {
      flex: 1,
      color: isDark ? '#A39F99' : '#625E57',
      fontWeight: '400',
      fontSize: 14,
    },
    darkModeToggle: {
      width: 40,
      height: 40,
      backgroundColor: isDark ? '#242321' : '#EAE6DF',
      borderWidth: 1,
      borderColor: isDark ? '#383633' : '#D2C8BA',
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },

    carouselContainer: { paddingLeft: 16, paddingRight: 4 },
    paginationDots: { flexDirection: 'row', justifyContent: 'center', marginTop: -2, marginBottom: -2 },
    dot: {
      width: 5,
      height: 5,
      borderRadius: 3,
      backgroundColor: isDark ? '#383633' : '#D6D0C6',
      marginHorizontal: 3,
    },
    dotActive: { width: 12, backgroundColor: isDark ? '#E5A93C' : '#245C53' },

    section: { marginBottom: 28 },
    sectionTitleBox: { flexDirection: 'row', alignItems: 'center', alignSelf: 'stretch', paddingHorizontal: 15, marginBottom: 14, gap: 9 },
    sectionMoreButton: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 'auto', minHeight: 40, paddingLeft: 8 },
    sectionAccent: { width: 3, height: 22, borderRadius: 2, backgroundColor: isDark ? '#E5A93C' : '#8B4A3C' },
    sectionTitleText: { fontSize: 20, lineHeight: 27, fontWeight: '700', color: textMain, flexShrink: 1 },
    scrollList: { paddingLeft: 16, paddingRight: 16, paddingBottom: 4 },

    threeCardRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 15,
    },
    sectionHeaderContainer: {
      paddingHorizontal: 0,
      marginTop: 4,
    },
    shelfSection: {
      marginBottom: 24,
    },
    shelfHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 15,
      marginBottom: 12,
    },
    shelfTitleWrapper: {
      flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, minWidth: 0,
    },
    shelfIconBadge: {
      width: 28,
      height: 28,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: isDark ? '#2D2B28' : '#F7F5F0',
    },
    shelfName: { flex: 1, minWidth: 0, color: textMain, fontSize: 16, lineHeight: 21, fontWeight: '700' },
    shelfTitleText: {
      flex: 1, fontSize: 19, lineHeight: 25, fontWeight: '700', color: textMain,
    },
    shelfMoreText: {
      fontSize: 12,
      fontWeight: '700',
      color: isDark ? '#E5A93C' : '#8B4A3C',
    },
    discoveryCard: {
      width: 120,
      height: 195,
      backgroundColor: isDark ? '#242321' : '#FBF9F5',
      borderRadius: 10,
      borderWidth: 1.5,
      borderStyle: 'dashed',
      borderColor: isDark ? '#383633' : '#D4C7B5',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 12,
      marginRight: 15,
    },
    discoveryIconWrapper: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: isDark ? '#2D2B28' : '#EFE8DA',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 10,
    },
    discoveryTitle: {
      fontSize: 12,
      fontWeight: '800',
      color: textMain,
      textAlign: 'center',
      marginBottom: 10,
      lineHeight: 16,
    },
    discoveryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: isDark ? '#2D2B28' : '#F5EBE1',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    discoveryBtnText: {
      fontSize: 11,
      fontWeight: '700',
      color: isDark ? '#E5A93C' : '#8B4A3C',
    },

    novelCard: { marginRight: 14 },
    moreAction: { justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 7, paddingTop: 10, paddingBottom: 8, borderRadius: 10, borderWidth: 1, borderStyle: 'dashed', borderColor: isDark ? '#6F665A' : '#CFC8BD', backgroundColor: isDark ? '#292723' : '#EAE6DF' },
    moreActionCategory: { width: '100%', minHeight: 34, textAlign: 'center', fontSize: 12, lineHeight: 17, fontWeight: '700', color: isDark ? '#F0E8DC' : '#4A4640' },
    moreActionLabel: { textAlign: 'center', fontSize: 12, lineHeight: 17, fontWeight: '800', color: isDark ? '#F0E8DC' : '#4A4640' },
    popupMetaText: { flex: 1, fontSize: 11, fontWeight: '500', color: textSub },
    novelCover: {
      backgroundColor: isDark ? coverBg : '#F2EFE9',
      borderRadius: 10,
      borderWidth: 1,
      borderColor: isDark ? '#383633' : '#E8E4DC',
      marginBottom: 6,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
    },
    novelCoverText: { color: textSub, fontWeight: '700', textAlign: 'center', fontSize: 11 },
    novelTitle: {
      fontSize: 15, fontWeight: '600', color: textMain, lineHeight: 21, minHeight: 42,
    },
    novelChapter: { fontSize: 12, fontWeight: '400', color: textSub, marginTop: 4 },

    // Modal & Popup Preview Styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.68)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    previewPopupCard: {
      width: '100%',
      maxWidth: 340,
      backgroundColor: isDark ? '#242321' : '#ffffff',
      borderRadius: 22,
      borderWidth: 1,
      borderColor: isDark ? '#383633' : '#E8E4DC',
      padding: 18,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.35,
      shadowRadius: 20,
      elevation: 10,
    },
    popupHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 14,
    },
    popupBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: isDark ? '#2D2B28' : '#F7F5F0',
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: 10,
    },
    popupBadgeText: {
      fontSize: 11,
      fontWeight: '700',
      color: isDark ? '#E5A93C' : '#35695F',
    },
    popupCloseBtn: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: isDark ? '#2D2B28' : '#F3F4F6',
      justifyContent: 'center',
      alignItems: 'center',
    },
    popupMainRow: {
      flexDirection: 'row',
      marginBottom: 14,
    },
    popupCoverWrap: {
      width: 100,
      height: 142,
      borderRadius: 10,
      backgroundColor: isDark ? coverBg : '#F5F5F7',
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: isDark ? '#383633' : '#E5E7EB',
      marginRight: 14,
      justifyContent: 'center',
      alignItems: 'center',
    },
    popupDetailCol: {
      flex: 1,
      justifyContent: 'center',
    },
    popupBookTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: textMain,
      marginBottom: 8,
      lineHeight: 22,
    },
    popupInfoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 5,
    },
    popupAuthorText: {
      fontSize: 12,
      fontWeight: '700',
      color: isDark ? '#E5A93C' : '#8B4A3C',
      flex: 1,
    },
    popupTagText: {
      fontSize: 12,
      fontWeight: '600',
      color: textSub,
      flex: 1,
    },
    popupChapterText: {
      fontSize: 12,
      fontWeight: '600',
      color: textSub,
      flex: 1,
    },
    popupRatingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 2,
    },
    popupRatingText: {
      fontSize: 12,
      fontWeight: '800',
      color: textMain,
    },
    popupReadsText: {
      fontSize: 11,
      fontWeight: '600',
      color: textSub,
    },
    popupDescBox: {
      backgroundColor: isDark ? '#2D2B28' : '#F9F8F6',
      padding: 10,
      borderRadius: 10,
      marginBottom: 14,
      borderLeftWidth: 3,
      borderLeftColor: isDark ? '#E5A93C' : '#8B4A3C',
    },
    popupDescText: {
      fontSize: 12,
      color: textSub,
      lineHeight: 17,
    },
    popupActionBtn: {
      flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, backgroundColor: isDark ? '#E5A93C' : '#4B8176', paddingVertical: 12, borderRadius: 8,
    },
    popupActionBtnText: {
      fontSize: 14,
      fontWeight: '800',
      color: isDark ? '#181716' : '#ffffff',
    },

    rankPage: {
      width: '100%', backgroundColor: cardBg, borderRadius: 8, borderWidth: 1, borderColor: isDark ? '#383633' : '#E6E1D8', padding: 16,
    },
    rankPageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: isDark ? '#383633' : '#E6E1D8', paddingBottom: 10 },
    rankPageTitle: { fontSize: 16, fontWeight: '900', color: textMain },
    rankPageMore: { fontSize: 12, fontWeight: '700', color: isDark ? '#E5A93C' : textSub },

    rankItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    rankNumber: { width: 25, fontSize: 18, fontWeight: '900', color: textSub },
    rankNumberFirst: { color: isDark ? '#E5A93C' : '#8B4A3C' },
    rankNumberSecond: { color: isDark ? '#F5B041' : '#35695F' },
    rankNumberThird: { color: isDark ? '#D8B36A' : '#4B8176' },
    rankCover: {
      width: 45,
      height: 60,
      backgroundColor: isDark ? '#2D2B28' : '#ddd',
      borderRadius: 7,
      borderWidth: 1,
      borderColor: isDark ? '#383633' : '#E6E1D8',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
      overflow: 'hidden',
    },
    rankCoverText: { fontSize: 10, color: textSub, fontWeight: '800' },
    rankInfo: { flex: 1 },
    rankTitle: { fontSize: 14, fontWeight: '800', color: textMain, marginBottom: 4 },
    rankChapter: { fontSize: 12, fontWeight: '600', color: textSub },

    categoryTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
    categoryTag: {
      paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: isDark ? '#383633' : '#E6E1D8', backgroundColor: isDark ? '#242321' : '#F7F5F0',
    },
    categoryTagText: { fontSize: 12, fontWeight: '800', color: textMain },

    gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    gridItem: { width: '30%', marginBottom: 20 },

    bottomNav: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      backgroundColor: isDark ? '#242321' : '#fff',
      borderTopWidth: 1,
      borderTopColor: isDark ? '#383633' : '#eee',
      paddingVertical: 10,
      paddingBottom: Platform.OS === 'ios' ? 25 : 10,
    },
    navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', height: 48 },
    navText: { fontSize: 10, fontWeight: '700', marginTop: 4, color: isDark ? '#A39F99' : '#8f9bb3' },
    navActiveText: { color: isDark ? '#E5A93C' : '#2c3a7a', fontWeight: '900' },

    footerBranding: {
      alignItems: 'center',
      paddingVertical: 15,
      borderTopWidth: 1,
      borderTopColor: isDark ? '#383633' : '#f1f2f6',
      marginTop: 10,
    },
    footerBrandTitle: { fontSize: 28, fontWeight: '900', color: isDark ? '#535A68' : '#ccc', letterSpacing: 1 },
    footerBrandSlogan: { fontSize: 12, fontWeight: '700', color: isDark ? '#535A68' : '#ccc', marginTop: 5 },

    statusBox: {
      paddingVertical: 24,
      paddingHorizontal: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginHorizontal: 15,
      backgroundColor: isDark ? '#242321' : '#fafafa',
      borderRadius: 14,
      borderWidth: 1,
      borderColor: isDark ? '#383633' : '#e0e0e0',
      borderStyle: 'dashed',
    },
    statusText: {
      fontSize: 13,
      fontWeight: '600',
      color: textSub,
      marginTop: 8,
    },
    statusErrorText: {
      fontSize: 13,
      fontWeight: '600',
      color: '#ff6b6b',
      textAlign: 'center',
      marginBottom: 10,
    },
    statusEmptyText: {
      fontSize: 13,
      fontWeight: '600',
      color: textSub,
      textAlign: 'center',
    },
    retryBtn: {
      paddingHorizontal: 16,
      paddingVertical: 7,
      backgroundColor: isDark ? '#E5A93C' : '#242321',
      borderRadius: 8,
      marginTop: 4,
    },
    retryBtnText: {
      fontSize: 12,
      fontWeight: '800',
      color: isDark ? '#181716' : '#fff',
    },

    /* DRAWER NAVBAR STYLES */
    drawerModalOverlay: {
      flex: 1,
      flexDirection: 'row',
    },
    drawerBackdrop: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: '#000000',
    },
    drawerContainer: {
      height: '100%',
      backgroundColor: isDark ? '#1F2228' : '#FFFFFF',
      borderRightWidth: 1,
      borderRightColor: isDark ? '#383633' : '#E6E1D8',
      shadowColor: '#000',
      shadowOffset: { width: 4, height: 0 },
      shadowOpacity: 0.25,
      shadowRadius: 10,
      elevation: 16,
      overflow: 'hidden',
    },
    drawerHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingTop: Platform.OS === 'ios' ? 48 : 20,
      paddingBottom: 16,
       backgroundColor: isDark ? '#1F2228' : '#EAE6DF',
      borderBottomWidth: 1,
       borderBottomColor: isDark ? '#383633' : '#E6E1D8',
    },
    drawerHeaderInfo: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    drawerLogoBadge: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: isDark ? '#E5A93C' : 'rgba(255,255,255,0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 10,
    },
    drawerBrandText: {
      fontSize: 16,
      fontWeight: '800',
       color: isDark ? '#F7F5F0' : '#242321',
      letterSpacing: 0.5,
    },
    drawerSubText: {
      fontSize: 11,
       color: isDark ? '#A39F99' : '#85817A',
      marginTop: 2,
    },
    drawerCloseBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: isDark ? '#2D2B28' : 'rgba(255,255,255,0.2)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    drawerScroll: {
      flex: 1,
       backgroundColor: isDark ? '#181716' : '#F7F5F0',
    },
    drawerScrollContent: {
      paddingVertical: 14,
      paddingHorizontal: 12,
    },
    drawerSectionGroup: {
      marginBottom: 18,
    },
    drawerGroupHeaderBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
      paddingHorizontal: 4,
    },
    drawerGroupTitle: {
      fontSize: 11,
      fontWeight: '800',
      color: isDark ? '#E5A93C' : '#8B4A3C',
      letterSpacing: 0.8,
      marginBottom: 8,
      paddingHorizontal: 4,
    },
     drawerItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 10,
      borderRadius: 10,
      backgroundColor: isDark ? '#242321' : '#FFFFFF',
      borderWidth: 1,
      borderColor: isDark ? '#383633' : '#EDE8DF',
       marginBottom: 6,
     },
     drawerCategoryRow: {
       flexDirection: 'row',
       alignItems: 'center',
       minHeight: 48,
       paddingHorizontal: 6,
       borderBottomWidth: 1,
       borderBottomColor: isDark ? '#383633' : '#E6E1D8',
     },
     drawerCategoryIcon: {
       width: 30,
       alignItems: 'center',
       marginRight: 8,
     },
    drawerItemIconBox: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: isDark ? '#2D2B28' : '#E8F3EF',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 10,
    },
    drawerItemTextBox: {
      flex: 1,
    },
    drawerItemTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: textMain,
    },
    drawerItemDesc: {
      fontSize: 11,
      color: textSub,
      marginTop: 1,
    },
    drawerBadge: {
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 10,
      backgroundColor: isDark ? '#2D2B28' : '#EFECE6',
    },
    drawerBadgeText: {
      fontSize: 11,
      fontWeight: '700',
      color: isDark ? '#E5A93C' : '#8B4A3C',
    },
    drawerFooter: {
      flexDirection: 'row',
      paddingHorizontal: 12,
      paddingTop: 12,
      paddingBottom: Platform.OS === 'ios' ? 24 : 14,
      borderTopWidth: 1,
      borderTopColor: isDark ? '#383633' : '#EDE8DF',
      backgroundColor: isDark ? '#1F2228' : '#FFFFFF',
      gap: 10,
    },
    drawerFooterBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      height: 42,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: isDark ? '#383633' : '#E6E1D8',
      backgroundColor: isDark ? '#242321' : '#F7F5F0',
    },
    drawerFooterCartBtn: {
      backgroundColor: isDark ? '#2D2B28' : '#F7F5F0',
    },
    drawerFooterBtnText: {
      fontSize: 12,
      fontWeight: '700',
      color: isDark ? '#E5A93C' : '#8B4A3C',
    },
  });
};


