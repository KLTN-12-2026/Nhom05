import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { ComponentRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { BookData, useAppNavigation } from './navigation';
import { fetchApiWithFallback } from './apiService';
import HomeCover from './home/HomeBookCover';
import ContinueReading from './home/ContinueReading';
import { formatHomeBookDate, getRankedHomeBooks, getRecentHomeBooks, HomeBookItem, readHomePage } from './home/homeData';
export type { HomeBookItem } from './home/homeData';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';

const { width, height } = Dimensions.get('window');
const FLOATING_MENU_SIZE = 40;

// Kích hoạt LayoutAnimation cho Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// MÀU SẮC THƯƠNG HIỆU
const BRAND = { primary: '#4B8176', secondary: '#B87968', bg: '#FFFFFF', black: '#202321' };

// --- COMPONENT HIỆU ỨNG SAO VÀ VŨ TRỤ ---

// Hào quang tinh vân (Nebula) chớp nở chậm rãi
const Nebula = () => {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 5000, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 5000, useNativeDriver: true })
      ])
    ).start();
  }, []);

  return (
    <>
      {/* Góc trên trái (Ánh tím) */}
      <Animated.View style={{
        position: 'absolute', top: -100, left: -100, width: 350, height: 350, borderRadius: 175,
        backgroundColor: BRAND.primary,
        opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.03, 0.12] }),
        transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.2] }) }]
      }} />
      {/* Góc dưới phải (Ánh vàng) */}
      <Animated.View style={{
        position: 'absolute', bottom: -100, right: -100, width: 400, height: 400, borderRadius: 200,
        backgroundColor: BRAND.secondary,
        opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.05] }),
        transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1.2, 0.8] }) }]
      }} />
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
        Animated.timing(anim, { toValue: 1, duration: 1200, useNativeDriver: true }), // Bay qua
        Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }), // Reset ngay
      ])
    ).start();
  }, []);

  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [0, width] });
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, height * 0.8] });
  const opacity = anim.interpolate({ inputRange: [0, 0.1, 0.8, 1], outputRange: [0, 1, 1, 0] });

  return (
    <Animated.View style={{
      position: 'absolute', top, left,
      width: 80, height: 2,
      backgroundColor: '#fff',
      transform: [{ rotate: '45deg' }, { translateX }, { translateY }],
      opacity,
      shadowColor: BRAND.secondary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 10
    }} />
  );
};

// Ngôi sao lấp lánh (Tốc độ và độ trễ ngẫu nhiên)
const Star = ({ delay, duration, top, left, size, color }: any) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.1, duration, useNativeDriver: true })
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={{
      position: 'absolute', top, left,
      width: size, height: size,
      borderRadius: size / 2,
      backgroundColor: color,
      opacity: anim,
      shadowColor: color, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 6
    }} />
  );
};

// Quản lý tổng thể Background Dark Mode
export const DarkModeBackgroundEffects = ({ visible }: { visible: boolean }) => {
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacityAnim, {
      toValue: visible ? 1 : 0,
      duration: 800,
      useNativeDriver: true
    }).start();
  }, [visible]);

  const { stars, shootingStars } = useMemo(() => {
    const starsList = Array.from({ length: 120 }).map((_, i) => ({
      id: i,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      duration: Math.random() * 500 + 300, // Nhấp nháy loạn và nhanh hơn (300ms - 800ms)
      size: Math.random() * 3 + 1,
      color: Math.random() > 0.7 ? BRAND.secondary : (Math.random() > 0.5 ? '#48dbfb' : BRAND.primary),
    }));

    const shootingList = Array.from({ length: 3 }).map((_, i) => ({
      id: `shoot_${i}`,
      top: `${Math.random() * -20}%`, // Bắt đầu từ ngoài mép trên
      left: `${Math.random() * 60}%`, // Dọc nửa trên màn hình
      delay: Math.random() * 8000 + 2000, // Thi thoảng bay 1 cái
    }));

    return { stars: starsList, shootingStars: shootingList };
  }, []);

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { opacity: opacityAnim, zIndex: 0, overflow: 'hidden' }]} pointerEvents="none">
      <Nebula />
      {stars.map(s => (
        <Star key={s.id} top={s.top} left={s.left} duration={s.duration} size={s.size} color={s.color} />
      ))}
      {shootingStars.map(s => (
        <ShootingStar key={s.id} top={s.top} left={s.left} delay={s.delay} />
      ))}
    </Animated.View>
  );
};
// --------------------------------

interface TrangChuProps {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onRefresh: () => void;
}

export default function TrangChu({ isDarkMode, onToggleDarkMode }: TrangChuProps) {
  const { navigate, setFooterVisible } = useAppNavigation();
  const insets = useSafeAreaInsets();
  const window = useWindowDimensions();
  const width = Math.min(1040, window.width - insets.left - insets.right);
  const featuredWidth = Math.max(200, width - 32);
  const featuredRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const [featuredIndex, setFeaturedIndex] = useState(0);
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
    return list.length > 0 ? list : books;
  }, [books]);

  // Phân chia danh mục sách thành từng hàng lướt ngang riêng biệt có ô mở rộng giống Web
  const shelfCategories = useMemo(() => [
    {
      id: 'cat-van-hoc',
      categoryId: 4,
      name: 'Kho Văn Học & Tiểu Thuyết',
      icon: 'book-outline',
      books: books.filter(b => b.category_id === 4 || (b.category_name && (b.category_name.toLowerCase().includes('tiểu thuyết') || b.category_name.toLowerCase().includes('tình cảm')))),
    },
    {
      id: 'cat-hien-thuc',
      categoryId: 5,
      name: 'Văn Học Hiện Thực',
      icon: 'library-outline',
      books: books.filter(b => b.category_id === 5 || (b.category_name && b.category_name.toLowerCase().includes('hiện thực'))),
    },
    {
      id: 'cat-phong-su',
      categoryId: 3,
      name: 'Phóng Sự & Xã Hội',
      icon: 'newspaper-outline',
      books: books.filter(b => b.category_id === 3 || (b.category_name && b.category_name.toLowerCase().includes('phóng sự'))),
    },
    {
      id: 'cat-lich-su',
      categoryId: 2,
      name: 'Lịch Sử & Hồi Ký',
      icon: 'hourglass-outline',
      books: books.filter(b => b.category_id === 2 || (b.category_name && (b.category_name.toLowerCase().includes('lịch sử') || b.category_name.toLowerCase().includes('hồi ký')))),
    },
    {
      id: 'cat-kinh-dien',
      categoryId: 1,
      name: 'Danh Tác Kinh Điển',
      icon: 'ribbon-outline',
      books: books.filter(b => b.category_id === 1 || (b.category_name && b.category_name.toLowerCase().includes('kinh điển'))),
    },
  ], [books]);

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

  const styles = useMemo(() => getStyles(isDarkMode, width), [isDarkMode, width]);
  const primary = isDarkMode ? '#8FC3B5' : '#4B8176';
  const textColor = isDarkMode ? '#F1F0EC' : '#242321';
  const featuredBooks = books.slice(0, 5);
  const activeFeatured = Math.min(featuredIndex, Math.max(0, featuredBooks.length - 1));
  const rankedBooks = useMemo(() => getRankedHomeBooks(books), [books]);
  useEffect(() => {
    featuredRef.current?.scrollTo({ x: 0, animated: false });
    setFeaturedIndex(0);
  }, [featuredWidth, books]);
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
    const coverHeight = Math.floor(cardWidth * 1.35);
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
        <Text style={styles.novelChapter} numberOfLines={1}>{subtitle || novel.chapter || novel.author}</Text>
      </TouchableOpacity>
    );
  };

  const renderDiscoveryCard = (categoryName: string, icon: string, categoryId: number) => {
    return (
      <TouchableOpacity
        key={`discovery-${categoryId}`}
        style={styles.discoveryCard}
        activeOpacity={0.85}
        onPress={() => navigate('genreBooks', { categoryId, categoryName })}
      >
        <View style={styles.discoveryIconWrapper}>
          <Ionicons name={icon as any} size={26} color={isDarkMode ? '#8FC3B5' : '#8B4A3C'} />
        </View>
        <Text style={styles.discoveryTitle} numberOfLines={2}>{categoryName}</Text>
        <View style={styles.discoveryButton}>
          <Text style={styles.discoveryBtnText}>Khám phá</Text>
          <Ionicons name="arrow-forward" size={13} color={isDarkMode ? '#8FC3B5' : '#8B4A3C'} />
        </View>
      </TouchableOpacity>
    );
  };

  const renderRankItem = (novel: any, index: number) => {
    return (
      <TouchableOpacity key={novel.id} style={styles.rankItem} activeOpacity={0.8} onPress={() => setSelectedPreviewBook(novel)}>
        <Text style={[styles.rankNumber, index < 3 ? styles.rankNumberTop : null]}>{index + 1}</Text>
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
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.container, { backgroundColor: isDarkMode ? '#202321' : '#F7F5F0' }]}>
      <Animated.View
        style={[styles.container, styles.homeFrame]}
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
                color={isDarkMode ? '#9BA3B2' : '#7A8291'}
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
          </View>
          <View style={styles.featuredHeading}>
            <Text style={styles.featuredEyebrow}>HALMBOOK / KHÔNG GIAN ĐỌC</Text>
            <Text style={styles.pageTitle}>Mở sách, mở góc nhìn.</Text>
          </View>
          {featuredBooks.length > 0 ? <>
            <ScrollView ref={featuredRef} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carouselContainer}
              snapToInterval={featuredWidth + 12} decelerationRate="fast" scrollEventThrottle={16}
              onScroll={event => setFeaturedIndex(Math.max(0, Math.min(featuredBooks.length - 1, Math.round(event.nativeEvent.contentOffset.x / (featuredWidth + 12)))))}>
              {featuredBooks.map(book => <View key={book.id} style={[styles.featuredPanel, { width: featuredWidth }]}>
                <View style={styles.featuredCopy}>
                  <Text style={styles.featuredEyebrow} numberOfLines={1}>{book.category_name || 'TRONG THƯ VIỆN'}</Text>
                  <Text style={styles.featuredTitle} numberOfLines={3}>{book.title}</Text>
                  <Text style={styles.featuredAuthor} numberOfLines={1}>{book.author}</Text>
                  {!!book.description && <Text style={styles.featuredDescription} numberOfLines={2}>{book.description.replace(/<[^>]*>/g, '')}</Text>}
                  <TouchableOpacity style={styles.featuredCta} onPress={() => setSelectedPreviewBook(book)} accessibilityRole="button" accessibilityLabel={'Xem tác phẩm ' + book.title}>
                    <Text style={styles.featuredCtaText}>Xem tác phẩm</Text><Ionicons name="arrow-forward" size={15} color={isDarkMode ? '#202321' : '#FFFFFF'} />
                  </TouchableOpacity>
                </View>
                <View style={styles.featuredCover}><HomeCover book={book} /></View>
              </View>)}
            </ScrollView>
            <View style={styles.paginationDots}>
              {featuredBooks.map((book, index) => <TouchableOpacity key={book.id} style={styles.dotTarget} accessibilityRole="button" accessibilityLabel={'Chuyển đến ' + book.title} accessibilityState={{ selected: index === activeFeatured }} onPress={() => featuredRef.current?.scrollTo({ x: index * (featuredWidth + 12), animated: true })}>
                <View style={[styles.dot, index === activeFeatured && styles.dotActive]} />
              </TouchableOpacity>)}
            </View>
          </> : <View style={styles.statusBox} accessibilityLiveRegion="polite">
            {isLoading ? <ActivityIndicator color={primary} /> : <Ionicons name="library-outline" size={28} color={primary} />}
            <Text style={styles.statusText}>{isLoading ? 'Đang chuẩn bị không gian đọc…' : errorMessage ? 'Chưa thể tải tác phẩm nổi bật. Hãy thử lại bên dưới.' : 'Những tác phẩm mới sẽ xuất hiện tại đây.'}</Text>
          </View>}
        </View>

        <View style={styles.toolbar}>
          {toolbarData.map((item, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.toolbarItem}
              activeOpacity={0.8}
              onPress={() => item.screen === 'transactions' ? handleJumpToSection('ranking') : navigate(item.screen as any)}
            >
              <View style={[
                styles.toolbarIconBox,
                {
                  backgroundColor: isDarkMode ? '#2A2E2B' : '#F7F5F0',
                  borderColor: isDarkMode ? '#414642' : '#E6E1D8',
                }
              ]}>
                <Ionicons
                  name={item.icon as any}
                  size={22}
                  color={primary}
                />
              </View>
              <Text style={styles.toolbarLabel} numberOfLines={1}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {errorMessage && books.length > 0 && <View style={styles.refreshNotice} accessibilityLiveRegion="polite">
          <Text style={styles.statusErrorText}>{errorMessage} Nội dung đã tải vẫn được giữ lại.</Text>
          <TouchableOpacity onPress={() => void handleRefresh()} disabled={isLoading} accessibilityRole="button" accessibilityLabel="Thử tải lại thư viện" style={styles.retryBtn}>
            <Text style={styles.retryBtnText}>{isLoading ? 'Đang tải…' : 'Thử lại'}</Text>
          </TouchableOpacity>
        </View>}
        {refreshing && <View style={styles.refreshStatus} accessibilityLiveRegion="polite"><ActivityIndicator size="small" color={primary} /><Text style={styles.statusText}>Đang làm mới thư viện…</Text></View>}

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
              {recommendedBooks.map(n => renderNovelCard(n, width < 380 ? 116 : 132, true))}
            </ScrollView>
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
              {recentBooks.map(n => renderNovelCard(n, width < 380 ? 116 : 132, true, formatHomeBookDate(n)))}
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

        {/* DANH MỤC THỂ LOẠI: TÁCH RIÊNG TỪNG HÀNG SÁCH LƯỚT NGANG KÈM Ô MỞ RỘNG (GIỐNG WEB) */}
        <View
          style={styles.sectionHeaderContainer}
          onLayout={(e) => {
            sectionPositions.current['categories'] = e.nativeEvent.layout.y;
          }}
        >
          <View style={styles.sectionTitleBox}>
            <View style={styles.sectionAccent} />
            <Text style={styles.sectionTitleText}>Danh Mục Thể Loại</Text>
          </View>
          <TouchableOpacity style={styles.allGenres} onPress={() => navigate('categories')} accessibilityRole="button"><Text style={styles.shelfMoreText}>Xem tất cả thể loại →</Text></TouchableOpacity>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollList}>
            {shelfCategories.map(shelf => <TouchableOpacity key={shelf.id} style={styles.genreCard} onPress={() => navigate('genreBooks', { categoryId: shelf.categoryId, categoryName: shelf.name })} accessibilityRole="button" accessibilityLabel={shelf.name}>
              <Ionicons name={shelf.icon as any} size={22} color={primary} />
              <Text style={styles.genreTitle}>{shelf.name}</Text>
              <Text style={styles.genreLink}>Khám phá →</Text>
            </TouchableOpacity>)}
          </ScrollView>
        </View>
        <ContinueReading books={books} refreshKey={historyRefreshKey} />
        <View style={styles.editorialPanel}>
          <Text style={styles.featuredEyebrow}>GÓC ĐỌC CHẬM</Text>
          <Text style={styles.editorialTitle}>Một khoảng lặng cho trang sách.</Text>
          <Text style={styles.editorialDescription}>Chọn một chủ đề bạn quan tâm, đọc theo nhịp riêng và khám phá những góc nhìn khác nhau trong từng tác phẩm.</Text>
          <TouchableOpacity onPress={() => navigate('categories')} accessibilityRole="button" style={styles.editorialAction}><Text style={styles.shelfMoreText}>Tìm chủ đề để bắt đầu →</Text></TouchableOpacity>
        </View>

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
                  <Text style={styles.shelfTitleText}>{shelf.name}</Text>
                </View>
                <TouchableOpacity onPress={() => navigate('genreBooks', { categoryId: shelf.categoryId, categoryName: shelf.name })} style={styles.moreAction} accessibilityRole="button" accessibilityLabel={'Xem thêm ' + shelf.name}><Text style={styles.shelfMoreText}>Xem thêm</Text></TouchableOpacity>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollList}>
                {shelf.books.map(n => renderNovelCard(n, width < 380 ? 116 : 132, true))}
                {renderDiscoveryCard(shelf.name, shelf.icon, shelf.categoryId)}
              </ScrollView>
            </View>
          );
        })}

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
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedPreviewBook(null)}
        >
          <TouchableOpacity
            style={[styles.previewPopupCard, { maxHeight: Math.max(160, window.height - insets.top - insets.bottom - 32) }]}
            activeOpacity={1}
            onPress={() => {
              if (selectedPreviewBook) {
                const bookToOpen = selectedPreviewBook;
                setSelectedPreviewBook(null);
                navigate('bookDetail', bookToOpen);
              }
            }}
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
          </TouchableOpacity>
        </TouchableOpacity>
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

            {/* Header Drawer */}
            <View style={[styles.drawerHeader, { paddingTop: insets.top + 12 }]}>
              <View style={styles.drawerHeaderInfo}>
                <View style={styles.drawerLogoBadge}>
                  <Ionicons name="book" size={18} color="#FFFFFF" />
                </View>
                <View>
                  <Text style={styles.drawerBrandText}>
                    HALM <Text style={{ color: isDarkMode ? '#8FC3B5' : '#E6E1D8' }}>Book</Text>
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
                <Ionicons name="close" size={20} color="#FFFFFF" />
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
                <View style={[styles.drawerItemIconBox, { backgroundColor: isDarkMode ? '#203831' : '#E8F3EF' }]}>
                  <Ionicons name="options-outline" size={18} color={isDarkMode ? '#87C9B5' : '#4A7C72'} />
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
                  <View style={[styles.drawerItemIconBox, { backgroundColor: isDarkMode ? '#292D2A' : '#F7F5F0' }]}>
                    <Ionicons name="flash" size={17} color={isDarkMode ? '#8FC3B5' : '#35695F'} />
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
                  onPress={() => handleJumpToSection('categories')}
                >
                  <Text style={styles.drawerGroupTitle}>DANH MỤC THỂ LOẠI</Text>
                  <Ionicons name="arrow-down-circle-outline" size={15} color={isDarkMode ? '#8FC3B5' : '#8B4A3C'} />
                </TouchableOpacity>

                {shelfCategories.map((shelf) => {
                  const bookCount = shelf.books?.length || 0;
                  return (
                    <TouchableOpacity
                      key={`drawer-shelf-${shelf.id}`}
                      style={styles.drawerItem}
                      activeOpacity={0.75}
                      onPress={() => {
                        if (shelf.books.length) handleJumpToSection(shelf.id);
                        else {
                          closeDrawer();
                          setTimeout(() => navigate('genreBooks', { categoryId: shelf.categoryId, categoryName: shelf.name }), 220);
                        }
                      }}
                    >
                      <View style={[styles.drawerItemIconBox, { backgroundColor: isDarkMode ? '#292D2A' : '#F7F5F0' }]}>
                        <Ionicons name={shelf.icon as any} size={17} color={isDarkMode ? '#8FC3B5' : '#8B4A3C'} />
                      </View>
                      <View style={styles.drawerItemTextBox}>
                        <Text style={styles.drawerItemTitle} numberOfLines={1}>{shelf.name}</Text>
                        <Text style={styles.drawerItemDesc}>{bookCount} cuốn sách</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={isDarkMode ? '#6E7687' : '#9E988E'} />
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
  const textMain = isDark ? '#F5F1E8' : '#242321';
  const textSub = isDark ? '#B9B7AF' : '#77736C';
  const pageBg = isDark ? '#202321' : '#F7F5F0';

  const topBg = isDark ? '#202321' : '#F7F5F0';

  const cardBg = isDark ? '#292D2A' : '#ffffff';
  const cardRaised = isDark ? '#303530' : '#ffffff';
  const coverBg = isDark ? '#343A35' : '#ccc';

  return StyleSheet.create({
    container: { flex: 1, backgroundColor: pageBg },
    homeFrame: { width: '100%', maxWidth: 1040, alignSelf: 'center' },
    featuredHeading: { paddingHorizontal: 16, marginBottom: 16 },
    pageTitle: { fontSize: 28, lineHeight: 36, fontWeight: '700', color: textMain, marginTop: 6 },
    featuredPanel: { flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? '#292D2A' : '#F7F5F0', padding: width < 360 ? 12 : 18, gap: 16, borderRadius: 8, marginRight: 12, borderWidth: 1, borderColor: isDark ? '#414642' : '#E6E1D8' },
    featuredCopy: { flex: 1, minWidth: 0, alignItems: 'flex-start' },
    featuredEyebrow: { fontSize: 12, lineHeight: 17, fontWeight: '600', letterSpacing: 0.7, color: isDark ? '#BC8B7B' : '#8B4A3C' },
    featuredTitle: { fontSize: width < 360 ? 21 : 26, lineHeight: width < 360 ? 28 : 34, fontWeight: '700', color: textMain, marginTop: 8 },
    featuredAuthor: { fontSize: 13, lineHeight: 19, color: textSub, marginTop: 6 },
    featuredDescription: { fontSize: 13, lineHeight: 20, color: textSub, marginTop: 8 },
    featuredCover: { width: width < 360 ? 80 : width < 600 ? 100 : 150, aspectRatio: 0.68, backgroundColor: isDark ? '#343A35' : '#E6E1D8', borderRadius: 4, overflow: 'hidden' },
    featuredCta: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, marginTop: 14, backgroundColor: isDark ? '#8FC3B5' : '#4B8176', borderRadius: 6 },
    featuredCtaText: { fontSize: 13, fontWeight: '600', color: isDark ? '#202321' : '#FFFFFF' },
    dotTarget: { minWidth: 32, minHeight: 32, alignItems: 'center', justifyContent: 'center' },
    allGenres: { alignSelf: 'flex-start', marginLeft: 16, paddingVertical: 10, marginTop: -8, marginBottom: 8 },
    genreCard: { width: 156, minHeight: 152, padding: 16, marginRight: 12, backgroundColor: isDark ? '#292D2A' : '#F7F5F0', borderWidth: 1, borderColor: isDark ? '#414642' : '#E6E1D8', borderRadius: 8 },
    genreTitle: { color: textMain, fontSize: 15, lineHeight: 22, fontWeight: '600', marginTop: 12 },
    genreLink: { color: isDark ? '#8FC3B5' : '#35695F', fontSize: 12, marginTop: 10 },
    editorialPanel: { margin: 16, marginBottom: 28, padding: 20, backgroundColor: isDark ? '#292D2A' : '#F7F5F0', borderLeftWidth: 3, borderLeftColor: isDark ? '#BC8B7B' : '#8B4A3C' },
    editorialTitle: { fontSize: 20, lineHeight: 28, color: textMain, fontWeight: '700', marginTop: 8 },
    editorialDescription: { fontSize: 14, lineHeight: 22, color: textSub, marginTop: 8 },
    editorialAction: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start', marginTop: 4 },
    moreAction: { minHeight: 44, justifyContent: 'center', paddingLeft: 12 },
    scrollView: { flex: 1, backgroundColor: 'transparent' },
    scrollContent: { paddingBottom: 120 },
    refreshNotice: { marginHorizontal: 16, padding: 16, alignItems: 'center', marginBottom: 20, backgroundColor: isDark ? '#303530' : '#FFFFFF', borderRadius: 8 },
    refreshStatus: { paddingHorizontal: 16, paddingBottom: 16, alignItems: 'center' },

    topBackground: {
      backgroundColor: topBg,
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
      paddingTop: 0,
      paddingBottom: 20,
      marginBottom: isDark ? 14 : 10,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#383C39' : '#E6E1D8',
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
      borderColor: isDark ? 'rgba(255,255,255,0.24)' : 'rgba(255,255,255,0.65)',
      backgroundColor: isDark ? '#303530' : '#F7F5F0',
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
      backgroundColor: isDark ? '#2A2E2B' : '#F7F5F0',
      borderRadius: 10,
      paddingHorizontal: 12,
      height: 40,
      marginHorizontal: 8,
    },
    searchInput: {
      flex: 1,
      color: isDark ? '#9BA3B2' : '#7A8291',
      fontWeight: '400',
      fontSize: 14,
    },
    darkModeToggle: {
      width: 40,
      height: 40,
      backgroundColor: isDark ? '#2A2E2B' : '#F7F5F0',
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },

    carouselContainer: { paddingLeft: 16, paddingRight: 4 },
    paginationDots: { flexDirection: 'row', justifyContent: 'center', marginTop: 15 },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: isDark ? '#59625A' : '#D6D0C6',
      marginHorizontal: 4,
    },
    dotActive: { width: 20, backgroundColor: isDark ? '#8FC3B5' : '#4B8176' },

    toolbar: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingVertical: 12,
      paddingHorizontal: 10,
      marginBottom: 12,
    },
    toolbarItem: { alignItems: 'center', flex: 1 },
    toolbarIconBox: {
      width: 44, height: 44, borderRadius: 8, borderWidth: 1, justifyContent: 'center', alignItems: 'center', marginBottom: 6,
    },
    toolbarLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: textMain,
      textAlign: 'center',
    },

    section: { marginBottom: 28 },
    sectionTitleBox: { flexDirection: 'row', alignItems: 'center', alignSelf: 'stretch', paddingHorizontal: 15, marginBottom: 14, gap: 9 },
    sectionAccent: { width: 3, height: 22, borderRadius: 2, backgroundColor: isDark ? '#B87968' : '#8B4A3C' },
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
    },
    shelfTitleText: {
      flex: 1, fontSize: 19, lineHeight: 25, fontWeight: '700', color: textMain,
    },
    shelfMoreText: {
      fontSize: 12,
      fontWeight: '700',
      color: isDark ? '#8FC3B5' : '#8B4A3C',
    },
    discoveryCard: {
      width: 120,
      height: 195,
      backgroundColor: isDark ? '#292D2A' : '#FBF9F5',
      borderRadius: 10,
      borderWidth: 1.5,
      borderStyle: 'dashed',
      borderColor: isDark ? '#3E4758' : '#D4C7B5',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 12,
      marginRight: 15,
    },
    discoveryIconWrapper: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: isDark ? '#282F3E' : '#EFE8DA',
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
      backgroundColor: isDark ? '#2C2619' : '#F5EBE1',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    discoveryBtnText: {
      fontSize: 11,
      fontWeight: '700',
      color: isDark ? '#8FC3B5' : '#8B4A3C',
    },

    novelCard: { marginRight: 14 },
    novelCover: {
      backgroundColor: isDark ? coverBg : '#F2EFE9',
      borderRadius: 10,
      borderWidth: 1,
      borderColor: isDark ? '#414642' : '#E8E4DC',
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
      backgroundColor: isDark ? '#292D2A' : '#ffffff',
      borderRadius: 22,
      borderWidth: 1,
      borderColor: isDark ? '#414642' : '#E8E4DC',
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
      backgroundColor: isDark ? '#303530' : '#F7F5F0',
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: 10,
    },
    popupBadgeText: {
      fontSize: 11,
      fontWeight: '700',
      color: isDark ? '#8FC3B5' : '#35695F',
    },
    popupCloseBtn: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: isDark ? '#2B3240' : '#F3F4F6',
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
      borderColor: isDark ? '#414642' : '#E5E7EB',
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
      color: isDark ? '#8FC3B5' : '#8B4A3C',
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
      backgroundColor: isDark ? '#232936' : '#F9F8F6',
      padding: 10,
      borderRadius: 10,
      marginBottom: 14,
      borderLeftWidth: 3,
      borderLeftColor: isDark ? '#8FC3B5' : '#8B4A3C',
    },
    popupDescText: {
      fontSize: 12,
      color: textSub,
      lineHeight: 17,
    },
    popupActionBtn: {
      flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, backgroundColor: isDark ? '#8FC3B5' : '#4B8176', paddingVertical: 12, borderRadius: 8,
    },
    popupActionBtnText: {
      fontSize: 14,
      fontWeight: '800',
      color: isDark ? '#12151B' : '#ffffff',
    },

    rankPage: {
      width: '100%', backgroundColor: cardBg, borderRadius: 8, borderWidth: 1, borderColor: isDark ? '#414642' : '#E6E1D8', padding: 16,
    },
    rankPageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    rankPageTitle: { fontSize: 16, fontWeight: '900', color: textMain },
    rankPageMore: { fontSize: 12, fontWeight: '700', color: isDark ? '#8FC3B5' : textSub },

    rankItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    rankNumber: { width: 25, fontSize: 18, fontWeight: '900', color: textSub },
    rankNumberTop: { color: isDark ? '#BC8B7B' : '#8B4A3C' },
    rankCover: {
      width: 45,
      height: 60,
      backgroundColor: isDark ? '#303641' : '#ddd',
      borderRadius: 7,
      borderWidth: 1,
      borderColor: isDark ? '#414642' : '#E6E1D8',
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
      paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: isDark ? '#414642' : '#E6E1D8', backgroundColor: isDark ? '#292D2A' : '#F7F5F0',
    },
    categoryTagText: { fontSize: 12, fontWeight: '800', color: textMain },

    gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    gridItem: { width: '30%', marginBottom: 20 },

    bottomNav: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      backgroundColor: isDark ? '#171A21' : '#fff',
      borderTopWidth: isDark ? 1 : 2,
      borderTopColor: isDark ? '#303640' : '#eee',
      paddingVertical: 10,
      paddingBottom: Platform.OS === 'ios' ? 25 : 10,
    },
    navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', height: 48 },
    navText: { fontSize: 10, fontWeight: '700', marginTop: 4, color: isDark ? '#737987' : '#8f9bb3' },
    navActiveText: { color: isDark ? '#8FC3B5' : '#2c3a7a', fontWeight: '900' },

    footerBranding: {
      alignItems: 'center',
      paddingVertical: 15,
      borderTopWidth: isDark ? 1 : 2,
      borderTopColor: isDark ? '#292E38' : '#f1f2f6',
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
      backgroundColor: isDark ? '#292D2A' : '#fafafa',
      borderRadius: 14,
      borderWidth: 1,
      borderColor: isDark ? '#363D4B' : '#e0e0e0',
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
      backgroundColor: isDark ? '#8FC3B5' : '#242321',
      borderRadius: 8,
      marginTop: 4,
    },
    retryBtnText: {
      fontSize: 12,
      fontWeight: '800',
      color: isDark ? '#242321' : '#fff',
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
      backgroundColor: isDark ? '#202321' : '#FFFFFF',
      borderRightWidth: 1,
      borderRightColor: isDark ? '#2A303D' : '#E6E1D8',
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
      backgroundColor: isDark ? '#292D2A' : '#4A7C72',
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#2E3545' : 'rgba(0,0,0,0.06)',
    },
    drawerHeaderInfo: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    drawerLogoBadge: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: isDark ? '#343A35' : 'rgba(255,255,255,0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 10,
    },
    drawerBrandText: {
      fontSize: 16,
      fontWeight: '800',
      color: '#FFFFFF',
      letterSpacing: 0.5,
    },
    drawerSubText: {
      fontSize: 11,
      color: isDark ? '#9DA7B8' : 'rgba(255,255,255,0.85)',
      marginTop: 2,
    },
    drawerCloseBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: isDark ? '#343A35' : 'rgba(255,255,255,0.2)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    drawerScroll: {
      flex: 1,
      backgroundColor: isDark ? 'transparent' : '#FAF8F5',
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
      color: isDark ? '#8FC3B5' : '#8B4A3C',
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
      backgroundColor: isDark ? '#292D2A' : '#FFFFFF',
      borderWidth: 1,
      borderColor: isDark ? '#2A303D' : '#EDE8DF',
      marginBottom: 6,
    },
    drawerItemIconBox: {
      width: 32,
      height: 32,
      borderRadius: 8,
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
      color: isDark ? '#EDEFF3' : '#242321',
    },
    drawerItemDesc: {
      fontSize: 11,
      color: isDark ? '#8A92A2' : '#85817A',
      marginTop: 1,
    },
    drawerBadge: {
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 10,
      backgroundColor: isDark ? '#2C3444' : '#EFECE6',
    },
    drawerBadgeText: {
      fontSize: 11,
      fontWeight: '700',
      color: isDark ? '#8FC3B5' : '#8B4A3C',
    },
  });
};
