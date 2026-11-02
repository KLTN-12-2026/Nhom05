import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import Constants from 'expo-constants';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BookData, useAppNavigation } from './navigation';
import { getBookCoverSource } from './bookCovers';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';

const { width, height } = Dimensions.get('window');

// Kích hoạt LayoutAnimation cho Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Cấu hình kết nối Backend - Tái sử dụng cấu hình từ loginlogout.tsx và hỗ trợ fallback môi trường

const debuggerHost = Constants.expoConfig?.hostUri;
const localhost = debuggerHost ? debuggerHost.split(':')[0] : 'localhost';
const API_BASE_URL = `http://${localhost}:8082`;

const CANDIDATE_API_URLS = [
  API_BASE_URL,
  'http://localhost:8082',
  'http://127.0.0.1:8082',
  'http://192.168.1.165:8082',
  'http://10.0.2.2:8082',
];

export interface HomeBookItem extends BookData {
  id: string;
  book_id?: string;
  bookName?: string;
  img_url?: string;
  description?: string;
  price?: number;
  category_id?: number;
  category_name?: string;
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
  const chapter = item.total_pages ? `${item.total_pages} trang` : (item.chapter || `Tác giả: ${author}`);

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

// MÀU SẮC THƯƠNG HIỆU
const BRAND = {
  primary: '#9A8BC2',
  secondary: '#D8B36A',
  bg: '#F5F1E8',
  black: '#12151B',
};

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
const DarkModeBackgroundEffects = ({ visible }: { visible: boolean }) => {
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

export default function TrangChu({ isDarkMode, onToggleDarkMode, onRefresh }: TrangChuProps) {
  const { navigate, setFooterVisible } = useAppNavigation();
  const [selectedPreviewBook, setSelectedPreviewBook] = useState<HomeBookItem | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const scrollOffset = useRef(0);
  const pullStart = useRef<number | null>(null);
  const refreshStarted = useRef(false);

  // State quản lý danh sách sách từ API BE
  const [books, setBooks] = useState<HomeBookItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('Tất cả');

  const categoriesList = useMemo(() => [
    'Tất cả',
    'Văn Học Hiện Thực',
    'Phóng Sự & Xã Hội',
    'Tình Cảm & Tiểu Thuyết',
    'Hồi Ký & Lịch Sử',
    'Danh Tác Kinh Điển',
  ], []);

  const recommendedBooks = useMemo(() => {
    const list = books.filter(b => b.category_id === 1 || b.category_id === 4);
    return list.length > 0 ? list : books;
  }, [books]);

  // Chiều rộng chuẩn để hiển thị vừa khít 3 cuốn trên màn hình (trừ padding 15x2 và 2 khoảng cách 12x2)
  const CARD_3_WIDTH = Math.floor((width - 30 - 24) / 3);

  // Phân chia danh mục sách thành từng hàng lướt ngang riêng biệt có ô mở rộng giống Web
  const shelfCategories = useMemo(() => [
    {
      id: 'cat-van-hoc',
      name: 'Kho Văn Học & Tiểu Thuyết',
      icon: 'book-outline',
      books: books.filter(b => b.category_id === 1 || (b.category_name && b.category_name.toLowerCase().includes('tiểu thuyết'))),
    },
    {
      id: 'cat-hien-thuc',
      name: 'Văn Học Hiện Thực',
      icon: 'library-outline',
      books: books.filter(b => b.category_id === 5 || (b.category_name && b.category_name.toLowerCase().includes('hiện thực'))),
    },
    {
      id: 'cat-phong-su',
      name: 'Phóng Sự & Xã Hội',
      icon: 'newspaper-outline',
      books: books.filter(b => b.category_id === 3 || (b.category_name && b.category_name.toLowerCase().includes('phóng sự'))),
    },
    {
      id: 'cat-lich-su',
      name: 'Lịch Sử & Hồi Ký',
      icon: 'hourglass-outline',
      books: books.filter(b => b.category_id === 2 || (b.category_name && (b.category_name.toLowerCase().includes('lịch sử') || b.category_name.toLowerCase().includes('hồi ký')))),
    },
    {
      id: 'cat-kinh-dien',
      name: 'Danh Tác Kinh Điển',
      icon: 'ribbon-outline',
      books: books.filter(b => b.category_id === 4 || (b.category_name && b.category_name.toLowerCase().includes('kinh điển'))),
    },
  ], [books]);

  const recentBooks = useMemo(() => {
    const list = books.filter(b => b.category_id === 5 || b.category_id === 3);
    return list.length > 0 ? list : books.slice().reverse();
  }, [books]);

  const categorizedBooks = useMemo(() => {
    if (selectedCategory === 'Tất cả') return books;
    return books.filter(b => {
      const cat = b.category_name || '';
      if (selectedCategory === 'Văn Học Hiện Thực') return cat.includes('Hiện Thực') || b.category_id === 5;
      if (selectedCategory === 'Phóng Sự & Xã Hội') return cat.includes('Phóng Sự') || b.category_id === 3;
      if (selectedCategory === 'Tình Cảm & Tiểu Thuyết') return cat.includes('Tình Cảm') || b.category_id === 4;
      if (selectedCategory === 'Hồi Ký & Lịch Sử') return cat.includes('Hồi Ký') || cat.includes('Lịch Sử') || b.category_id === 2;
      if (selectedCategory === 'Danh Tác Kinh Điển') return cat.includes('Kinh Điển') || b.category_id === 1;
      return true;
    });
  }, [books, selectedCategory]);

  const fetchBooks = async (signal?: AbortSignal) => {
    setIsLoading(true);
    setErrorMessage(null);

    const urls = Array.from(new Set(CANDIDATE_API_URLS));
    let lastError: any = null;
    let fetchedData: any = null;

    for (const baseUrl of urls) {
      try {
        const response = await axios.get(`${baseUrl}/api/home/books`, {
          params: { page: 0, size: 50 },
          timeout:9000,
          signal,
        });
        fetchedData = response.data;
        if (fetchedData) break;
      } catch (err: any) {
        lastError = err;
        if (axios.isCancel(err) || (err && err.name === 'CanceledError')) {
          return;
        }
      }
    }

    if (fetchedData) {
      const rawList = Array.isArray(fetchedData)
        ? fetchedData
        : Array.isArray(fetchedData.content)
          ? fetchedData.content
          : Array.isArray(fetchedData.data)
            ? fetchedData.data
            : [];

      const mappedList = rawList.map(mapBookDtoToItem);
      setBooks(mappedList);
      setIsLoading(false);
    } else {
      setErrorMessage(
        lastError?.response?.data?.message ||
        lastError?.message ||
        'Không thể kết nối máy chủ để lấy dữ liệu sách.'
      );
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchBooks(controller.signal);
    return () => controller.abort();
  }, []);

  const getTouchPageY = (nativeEvent: {
    pageY?: number;
    touches?: ArrayLike<{ pageY: number }>;
    changedTouches?: ArrayLike<{ pageY: number }>;
  }) => nativeEvent.touches?.[0]?.pageY
    ?? nativeEvent.changedTouches?.[0]?.pageY
    ?? nativeEvent.pageY;
  
  const bgAnim = useRef(new Animated.Value(isDarkMode ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(bgAnim, {
      toValue: isDarkMode ? 1 : 0,
      duration: 600,
      useNativeDriver: false
    }).start();
  }, [bgAnim, isDarkMode]);

  const animatedBg = bgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#ffffff', BRAND.black] 
  });

  const styles = getStyles(isDarkMode);

  const handleRefresh = async () => {
    if (refreshStarted.current) return;
    refreshStarted.current = true;
    if (Platform.OS === 'web') {
      await fetchBooks();
      refreshStarted.current = false;
      return;
    }
    setRefreshing(true);
    await fetchBooks();
    setRefreshing(false);
    onRefresh();
  };

  const renderNovelCard = (novel: any, cardWidth: number | string = 115, hasMarginRight: boolean = true) => {
    const coverSource = getBookCoverSource(novel.id, novel.img_url);
    const coverHeight = typeof cardWidth === 'number' ? Math.floor(cardWidth * 1.35) : 150;
    return (
      <TouchableOpacity
        key={novel.id}
        style={[
          styles.novelCard,
          { width: cardWidth as any },
          !hasMarginRight && { marginRight: 0 }
        ]}
        activeOpacity={0.88}
        onPress={() => setSelectedPreviewBook(novel)}
      >
        <View style={[styles.novelCover, { height: coverHeight }]}>
          {coverSource ? (
            <Image source={coverSource} style={StyleSheet.absoluteFill} resizeMode="cover" />
          ) : (
            <Text style={styles.novelCoverText}>Ảnh{'\n'}Truyện</Text>
          )}
        </View>
        <Text style={styles.novelTitle} numberOfLines={2}>{novel.title}</Text>
      </TouchableOpacity>
    );
  };

  const renderDiscoveryCard = (categoryName: string, icon: string, targetCategory: string) => {
    return (
      <TouchableOpacity
        key={`discovery-${targetCategory}`}
        style={styles.discoveryCard}
        activeOpacity={0.85}
        onPress={() => navigate('categories')}
      >
        <View style={styles.discoveryIconWrapper}>
          <Ionicons name={icon as any} size={26} color={isDarkMode ? '#D8B36A' : '#8B4A3C'} />
        </View>
        <Text style={styles.discoveryTitle} numberOfLines={2}>{categoryName}</Text>
        <View style={styles.discoveryButton}>
          <Text style={styles.discoveryBtnText}>Khám phá</Text>
          <Ionicons name="arrow-forward" size={13} color={isDarkMode ? '#D8B36A' : '#8B4A3C'} />
        </View>
      </TouchableOpacity>
    );
  };

  const renderRankItem = (novel: any, index: number) => {
    const coverSource = getBookCoverSource(novel.id, novel.img_url);
    return (
      <TouchableOpacity key={novel.id} style={styles.rankItem} activeOpacity={0.8} onPress={() => setSelectedPreviewBook(novel)}>
        <Text style={[styles.rankNumber, index < 3 ? styles.rankNumberTop : null]}>{index + 1}</Text>
        <View style={styles.rankCover}>
          {coverSource ? (
            <Image source={coverSource} style={StyleSheet.absoluteFill} resizeMode="cover" />
          ) : (
            <Text style={styles.rankCoverText}>Ảnh</Text>
          )}
        </View>
        <View style={styles.rankInfo}>
          <Text style={styles.rankTitle} numberOfLines={1}>{novel.title}</Text>
          <Text style={styles.rankChapter}>{novel.chapter || novel.author || 'Đang cập nhật'}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const toolbarData = [
    {
      icon: 'trophy',
      label: 'Xếp Hạng',
      screen: 'transactions',
      bgLight: '#FEF3C7',
      iconLight: '#D97706',
      borderLight: '#FDE68A',
      bgDark: '#2C2216',
      iconDark: '#FBBF24',
      borderDark: '#45351E',
    },
    {
      icon: 'bookmarks',
      label: 'Đã Lưu',
      screen: 'bookshelf',
      bgLight: '#EEF2FF',
      iconLight: '#6366F1',
      borderLight: '#E0E7FF',
      bgDark: '#1C1F38',
      iconDark: '#A5B4FC',
      borderDark: '#31355E',
    },
    {
      icon: 'newspaper',
      label: 'Bảng Tin',
      screen: 'dmHome',
      bgLight: '#ECFDF5',
      iconLight: '#059669',
      borderLight: '#D1FAE5',
      bgDark: '#132822',
      iconDark: '#34D399',
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

  const badgeColors = isDarkMode
    ? { 1: '#5A526F', 2: '#624F35', 3: '#35544F', 4: '#584341' }
    : { 1: '#ff9ff3', 2: '#1dd1a1', 3: '#ffde59', 4: '#48dbfb' };

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: isDarkMode ? BRAND.black : '#fff' }]}>
      <Animated.View style={[styles.container, { backgroundColor: animatedBg }]}>
      <ExpoStatusBar style={isDarkMode ? 'light' : 'dark'} />
      
      {/* TRUNG TÂM HIỆU ỨNG DARK MODE */}
      <DarkModeBackgroundEffects visible={isDarkMode} />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces
        refreshControl={Platform.OS === 'web' ? undefined : (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={isDarkMode ? '#D8B36A' : '#5a8b82'}
            colors={['#5a8b82', '#9147DF']}
          />
        )}
        onScroll={(event) => {
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
        }}
        scrollEventThrottle={16}
        onTouchStart={(event) => {
          const pageY = getTouchPageY(event.nativeEvent);
          pullStart.current = scrollOffset.current <= 0 ? pageY ?? null : null;
          refreshStarted.current = false;
        }}
        onTouchMove={(event) => {
          if (Platform.OS !== 'web' || pullStart.current === null || scrollOffset.current > 0) return;
          const pageY = getTouchPageY(event.nativeEvent);
          if (pageY !== undefined && pageY - pullStart.current >= 90) handleRefresh();
        }}
        onTouchEnd={() => { pullStart.current = null; }}
        onTouchCancel={() => { pullStart.current = null; }}
      >
        
        <View style={styles.topBackground}>
          <View style={styles.header}>
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={18} color={isDarkMode ? BRAND.bg : '#fff'} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchInput}
                placeholder="Tìm kiếm truyện..."
                placeholderTextColor={isDarkMode ? '#a1a1aa' : '#ccc'}
                onFocus={() => navigate('search')}
              />
            </View>
            <TouchableOpacity
              style={styles.darkModeToggle}
              onPress={onToggleDarkMode}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={isDarkMode ? 'Bật chế độ sáng' : 'Bật chế độ tối'}
            >
              <Ionicons
                name={isDarkMode ? 'moon' : 'sunny'}
                size={22}
                color={isDarkMode ? '#161920' : '#1a1a1a'}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.darkModeToggle} onPress={() => navigate('cart')}>
              <Ionicons name="cart-outline" size={22} color={isDarkMode ? BRAND.bg : '#1a1a1a'} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.avatarBtn} onPress={() => navigate('profile')}>
              <Text style={styles.avatarText}>A</Text>
            </TouchableOpacity>
          </View>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.carouselContainer}
            snapToInterval={315} 
            decelerationRate="fast"
          >
            {(books.length > 0 ? books.slice(0, 5) : CAROUSEL).map((banner: any, index: number) => (
              <TouchableOpacity key={banner.id} style={styles.bannerCard} activeOpacity={0.9} onPress={() => setSelectedPreviewBook(banner)}>
                <View style={styles.bannerImagePlaceholder}>
                  {(() => {
                    const bSource = getBookCoverSource(banner.id, banner.img_url);
                    return bSource ? (
                      <Image source={bSource} style={StyleSheet.absoluteFill} resizeMode="cover" />
                    ) : (
                      <Text style={styles.bannerImageText}>Banner {index + 1}</Text>
                    );
                  })()}
                </View>
                <View style={styles.bannerOverlay}>
                  <Text style={styles.bannerTitle} numberOfLines={1}>{banner.title}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          <View style={styles.paginationDots}>
            <View style={[styles.dot, styles.dotActive]} />
            <View style={styles.dot} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>
        </View>

        <View style={styles.toolbar}>
          {toolbarData.map((item, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.toolbarItem}
              activeOpacity={0.8}
              onPress={() => navigate(item.screen as any)}
            >
              <View style={[
                styles.toolbarIconBox,
                {
                  backgroundColor: isDarkMode ? item.bgDark : item.bgLight,
                  borderColor: isDarkMode ? item.borderDark : item.borderLight,
                }
              ]}>
                <Ionicons
                  name={item.icon as any}
                  size={22}
                  color={isDarkMode ? item.iconDark : item.iconLight}
                />
              </View>
              <Text style={styles.toolbarLabel} numberOfLines={1}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <View style={[styles.sectionTitleBox, { backgroundColor: isDarkMode ? '#2C2216' : '#FEF3C7', borderColor: isDarkMode ? '#45351E' : '#FDE68A' }]}>
            <Ionicons name="sparkles" size={16} color={isDarkMode ? '#FBBF24' : '#D97706'} style={{marginRight: 6}} />
            <Text style={[styles.sectionTitleText, { color: isDarkMode ? '#FBBF24' : '#92400E' }]}>Khuyến Khích Đọc</Text>
          </View>
          {isLoading ? (
            <View style={styles.statusBox}>
              <ActivityIndicator size="small" color={isDarkMode ? '#D8B36A' : '#5a8b82'} />
              <Text style={styles.statusText}>Đang tải dữ liệu sách...</Text>
            </View>
          ) : errorMessage ? (
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
              {recommendedBooks.slice(0, 7).map(n => renderNovelCard(n, 115, true))}
            </ScrollView>
          )}
        </View>

        <View style={styles.section}>
          <View style={[styles.sectionTitleBox, { backgroundColor: isDarkMode ? '#132822' : '#ECFDF5', borderColor: isDarkMode ? '#1F473C' : '#D1FAE5' }]}>
            <Ionicons name="flash" size={16} color={isDarkMode ? '#34D399' : '#059669'} style={{marginRight: 6}} />
            <Text style={[styles.sectionTitleText, { color: isDarkMode ? '#34D399' : '#065F46' }]}>Mới Cập Nhật</Text>
          </View>
          {isLoading ? (
            <View style={styles.statusBox}>
              <ActivityIndicator size="small" color={isDarkMode ? '#D8B36A' : '#5a8b82'} />
              <Text style={styles.statusText}>Đang tải dữ liệu sách...</Text>
            </View>
          ) : errorMessage ? (
            <View style={styles.statusBox}>
              <Text style={styles.statusErrorText}>{errorMessage}</Text>
            </View>
          ) : books.length === 0 ? (
            <View style={styles.statusBox}>
              <Text style={styles.statusEmptyText}>Chưa có sách mới cập nhật</Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollList}>
              {recentBooks.slice(0, 7).map(n => renderNovelCard(n, 115, true))}
            </ScrollView>
          )}
        </View>

        <View style={styles.section}>
          <View style={[styles.sectionTitleBox, { backgroundColor: badgeColors[3] }]}>
            <Ionicons name="podium" size={18} color="#1a1a1a" style={{marginRight: 6}} />
            <Text style={[styles.sectionTitleText, { color: '#1a1a1a' }]}>Bảng Xếp Hạng</Text>
          </View>
          
          {isLoading ? (
            <View style={styles.statusBox}>
              <ActivityIndicator size="small" color={isDarkMode ? '#D8B36A' : '#5a8b82'} />
              <Text style={styles.statusText}>Đang tải bảng xếp hạng...</Text>
            </View>
          ) : errorMessage ? (
            <View style={styles.statusBox}>
              <Text style={styles.statusErrorText}>{errorMessage}</Text>
            </View>
          ) : books.length === 0 ? (
            <View style={styles.statusBox}>
              <Text style={styles.statusEmptyText}>Chưa có dữ liệu bảng xếp hạng</Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollList} snapToInterval={315} decelerationRate="fast">
              <View style={styles.rankPage}>
                <View style={styles.rankPageHeader}>
                  <Text style={styles.rankPageTitle}>🏆 Top Tuần</Text>
                  <Text style={styles.rankPageMore}>Xem thêm ›</Text>
                </View>
                {books.slice(0, 5).map((novel, index) => renderRankItem(novel, index))}
              </View>
              <View style={styles.rankPage}>
                <View style={styles.rankPageHeader}>
                  <Text style={styles.rankPageTitle}>🔥 Top Tháng</Text>
                  <Text style={styles.rankPageMore}>Xem thêm ›</Text>
                </View>
                {books.slice(0, 5).reverse().map((novel, index) => renderRankItem(novel, index))}
              </View>
            </ScrollView>
          )}
        </View>

        {/* DANH MỤC THỂ LOẠI: TÁCH RIÊNG TỪNG HÀNG SÁCH LƯỚT NGANG KÈM Ô MỞ RỘNG (GIỐNG WEB) */}
        <View style={styles.sectionHeaderContainer}>
          <View style={[styles.sectionTitleBox, { backgroundColor: isDarkMode ? '#1C1F38' : '#EEF2FF', borderColor: isDarkMode ? '#31355E' : '#E0E7FF' }]}>
            <Ionicons name="library" size={16} color={isDarkMode ? '#A5B4FC' : '#6366F1'} style={{marginRight: 6}} />
            <Text style={[styles.sectionTitleText, { color: isDarkMode ? '#A5B4FC' : '#4338CA' }]}>Danh Mục Thể Loại</Text>
          </View>
        </View>

        {shelfCategories.map((shelf) => {
          if (!shelf.books || shelf.books.length === 0) return null;
          return (
            <View key={shelf.id} style={styles.shelfSection}>
              <View style={styles.shelfHeader}>
                <View style={styles.shelfTitleWrapper}>
                  <View style={[styles.shelfIconBadge, { backgroundColor: isDarkMode ? '#222834' : '#F4F1EA' }]}>
                    <Ionicons name={shelf.icon as any} size={15} color={isDarkMode ? '#D8B36A' : '#8B4A3C'} />
                  </View>
                  <Text style={styles.shelfTitleText}>{shelf.name}</Text>
                </View>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollList}>
                {shelf.books.slice(0, 8).map(n => renderNovelCard(n, 115, true))}
                {renderDiscoveryCard(shelf.name, shelf.icon, shelf.id)}
              </ScrollView>
            </View>
          );
        })}

        <View style={styles.footerBranding}>
          <Text style={styles.footerBrandTitle}>HALM <Text style={{ color: isDarkMode ? '#A99BCB' : '#9b51e0' }}>Book</Text></Text>
          <Text style={styles.footerBrandSlogan}>Sách là ánh sáng!</Text>
        </View>

      </ScrollView>

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
            style={styles.previewPopupCard}
            activeOpacity={0.96}
            onPress={() => {
              if (selectedPreviewBook) {
                const bookToOpen = selectedPreviewBook;
                setSelectedPreviewBook(null);
                navigate('bookDetail', bookToOpen);
              }
            }}
          >
            {/* Header Popup */}
            <View style={styles.popupHeader}>
              <View style={styles.popupBadge}>
                <Ionicons name="information-circle" size={15} color={isDarkMode ? '#D8B36A' : '#8B4A3C'} />
                <Text style={styles.popupBadgeText}>Thông tin tác phẩm</Text>
              </View>
              <TouchableOpacity
                style={styles.popupCloseBtn}
                onPress={() => setSelectedPreviewBook(null)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons name="close" size={18} color={isDarkMode ? '#A7ABB5' : '#666'} />
              </TouchableOpacity>
            </View>

            {/* Thông tin chính: Bìa + Cột chi tiết */}
            <View style={styles.popupMainRow}>
              <View style={styles.popupCoverWrap}>
                {(() => {
                  const cover = selectedPreviewBook ? getBookCoverSource(selectedPreviewBook.id, selectedPreviewBook.img_url) : null;
                  return cover ? (
                    <Image source={cover} style={StyleSheet.absoluteFill} resizeMode="cover" />
                  ) : (
                    <Text style={styles.novelCoverText}>Ảnh{'\n'}Bìa</Text>
                  );
                })()}
              </View>

              <View style={styles.popupDetailCol}>
                <Text style={styles.popupBookTitle} numberOfLines={2}>
                  {selectedPreviewBook?.title}
                </Text>

                <View style={styles.popupInfoRow}>
                  <Ionicons name="person" size={13} color={isDarkMode ? '#D8B36A' : '#8B4A3C'} />
                  <Text style={styles.popupAuthorText} numberOfLines={1}>
                    {selectedPreviewBook?.author || 'HALM BOOK'}
                  </Text>
                </View>

                <View style={styles.popupInfoRow}>
                  <Ionicons name="bookmark" size={13} color={isDarkMode ? '#A5B4FC' : '#6366F1'} />
                  <Text style={styles.popupTagText} numberOfLines={1}>
                    {selectedPreviewBook?.tag || selectedPreviewBook?.category_name || 'Sách hay'}
                  </Text>
                </View>

                <View style={styles.popupInfoRow}>
                  <Ionicons name="document-text" size={13} color={isDarkMode ? '#34D399' : '#059669'} />
                  <Text style={styles.popupChapterText} numberOfLines={1}>
                    {selectedPreviewBook?.chapter || 'Trọn bộ đầy đủ'}
                  </Text>
                </View>

                <View style={styles.popupRatingRow}>
                  <Ionicons name="star" size={13} color="#FBBF24" />
                  <Text style={styles.popupRatingText}>{selectedPreviewBook?.rating || '5.0'}</Text>
                  <Text style={styles.popupReadsText}>• {selectedPreviewBook?.reads || '1.2K'} lượt đọc</Text>
                </View>
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
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const getStyles = (isDark: boolean) => {
  const textMain = isDark ? '#F5F1E8' : '#1a1a1a';
  const textSub = isDark ? '#A7ABB5' : '#666';
  const pageBg = isDark ? '#101319' : '#ffffff';
  
  const topBg = isDark ? '#1F2228' : '#5a8b82'; 
  
  const cardBg = isDark ? '#1B1F28' : '#ffffff';
  const cardRaised = isDark ? '#232833' : '#ffffff';
  const coverBg = isDark ? '#2B303B' : '#ccc';

  return StyleSheet.create({
    container: { flex: 1, backgroundColor: pageBg },
    scrollView: { flex: 1, backgroundColor: 'transparent' },
    scrollContent: { paddingBottom: 120 },

    topBackground: {
      backgroundColor: topBg,
      borderBottomLeftRadius: isDark ? 34 : 30,
      borderBottomRightRadius: isDark ? 34 : 30,
      paddingTop: 15,
      paddingBottom: 20,
      marginBottom: isDark ? 14 : 10,
      borderBottomWidth: isDark ? 1 : 3,
      borderBottomColor: isDark ? '#3A3F49' : '#1a1a1a', 
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 15,
      marginBottom: 20,
    },
    searchContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#272B33' : 'rgba(255,255,255,0.2)',
      borderRadius: 18,
      paddingHorizontal: 15,
      height: 45,
      borderWidth: isDark ? 1 : 2,
      borderColor: isDark ? '#4F5766' : '#1a1a1a',
    },
    searchInput: {
      flex: 1,
      color: isDark ? textMain : '#fff',
      fontWeight: '600',
      fontSize: 15,
    },
    darkModeToggle: {
      width: 42,
      height: 42,
      backgroundColor: isDark ? '#D8B36A' : '#fff',
      borderRadius: 21,
      borderWidth: isDark ? 1 : 2,
      borderColor: isDark ? '#E5CA98' : '#1a1a1a',
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 10,
    },
    avatarBtn: {
      width: 45,
      height: 45,
      backgroundColor: isDark ? '#8E80B6' : '#ffde59',
      borderRadius: 25,
      borderWidth: isDark ? 1 : 2,
      borderColor: isDark ? '#B7ADD1' : '#1a1a1a',
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 10,
    },
    avatarText: { fontSize: 20, fontWeight: '900', color: '#1a1a1a' },

    carouselContainer: { paddingLeft: 15, paddingRight: 5 },
    bannerCard: {
      width: 300,
      height: 170,
      backgroundColor: isDark ? cardRaised : '#ccc',
      borderRadius: isDark ? 17 : 15,
      borderWidth: isDark ? 1 : 3,
      borderColor: isDark ? '#4A5160' : '#1a1a1a',
      marginRight: 15,
      overflow: 'hidden',
    },
    bannerImagePlaceholder: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: isDark ? '#303641' : '#34495e',
    },
    bannerImageText: {
      color: isDark ? '#D0D3DA' : '#fff',
      fontSize: 24,
      fontWeight: '800',
      opacity: 0.5,
    },
    bannerOverlay: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'rgba(0,0,0,0.6)',
      padding: 10,
      paddingBottom: 12,
    },
    bannerTitle: { color: '#fff', fontWeight: '700', fontSize: 14 },

    paginationDots: { flexDirection: 'row', justifyContent: 'center', marginTop: 15 },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: isDark ? '#434A58' : 'rgba(255,255,255,0.4)',
      marginHorizontal: 4,
    },
    dotActive: { width: 24, backgroundColor: isDark ? '#D8B36A' : '#fff' },

    toolbar: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingVertical: 12,
      paddingHorizontal: 10,
      marginBottom: 12,
    },
    toolbarItem: { alignItems: 'center', flex: 1 },
    toolbarIconBox: {
      width: 50,
      height: 50,
      borderRadius: 16,
      borderWidth: 1.5,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 6,
      shadowColor: isDark ? '#000' : '#1a1a1a',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.35 : 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    toolbarLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: textMain,
      textAlign: 'center',
    },

    section: { marginBottom: 22 },
    sectionTitleBox: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 10,
      borderWidth: 1,
      marginLeft: 15,
      marginBottom: 14,
      shadowColor: isDark ? '#000' : '#1a1a1a',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.3 : 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
    sectionTitleText: { fontSize: 15, fontWeight: '800' },
    scrollList: { paddingLeft: 15, paddingRight: 5 },

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
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    shelfIconBadge: {
      width: 28,
      height: 28,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    shelfTitleText: {
      fontSize: 15,
      fontWeight: '800',
      color: textMain,
    },
    shelfMoreText: {
      fontSize: 12,
      fontWeight: '700',
      color: isDark ? '#D8B36A' : '#8B4A3C',
    },
    discoveryCard: {
      width: 120,
      height: 195,
      backgroundColor: isDark ? '#1C212B' : '#FBF9F5',
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
      color: isDark ? '#D8B36A' : '#8B4A3C',
    },

    novelCard: { marginRight: 14 },
    novelCover: {
      backgroundColor: isDark ? coverBg : '#F2EFE9',
      borderRadius: 10,
      borderWidth: 1,
      borderColor: isDark ? '#3D4452' : '#E8E4DC',
      marginBottom: 6,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
    },
    novelCoverText: { color: textSub, fontWeight: '700', textAlign: 'center', fontSize: 11 },
    novelTitle: {
      fontSize: 12,
      fontWeight: '700',
      color: textMain,
      lineHeight: 17,
      height: 35,
    },
    novelChapter: { fontSize: 11, fontWeight: '500', color: textSub },

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
      backgroundColor: isDark ? '#1C212B' : '#ffffff',
      borderRadius: 22,
      borderWidth: 1,
      borderColor: isDark ? '#3D4658' : '#E8E4DC',
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
      backgroundColor: isDark ? '#2C2518' : '#FEF3C7',
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: 10,
    },
    popupBadgeText: {
      fontSize: 11,
      fontWeight: '700',
      color: isDark ? '#D8B36A' : '#92400E',
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
      borderColor: isDark ? '#3D4658' : '#E5E7EB',
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
      color: isDark ? '#D8B36A' : '#8B4A3C',
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
      borderLeftColor: isDark ? '#D8B36A' : '#8B4A3C',
    },
    popupDescText: {
      fontSize: 12,
      color: textSub,
      lineHeight: 17,
    },
    popupActionBtn: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 6,
      backgroundColor: isDark ? '#D8B36A' : '#8B4A3C',
      paddingVertical: 12,
      borderRadius: 14,
      shadowColor: isDark ? '#D8B36A' : '#8B4A3C',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.3,
      shadowRadius: 5,
      elevation: 3,
    },
    popupActionBtnText: {
      fontSize: 14,
      fontWeight: '800',
      color: isDark ? '#12151B' : '#ffffff',
    },

    rankPage: {
      width: 300,
      marginRight: 15,
      backgroundColor: isDark ? cardBg : '#ffffff',
      borderRadius: 17,
      borderWidth: isDark ? 1 : 2,
      borderColor: isDark ? '#454C59' : '#1a1a1a',
      padding: 15,
      shadowColor: isDark ? '#080A0F' : '#1a1a1a',
      shadowOffset: { width: 0, height: isDark ? 5 : 3 },
      shadowOpacity: isDark ? 0.55 : 1,
      shadowRadius: isDark ? 10 : 0,
      elevation: 3,
    },
    rankPageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    rankPageTitle: { fontSize: 16, fontWeight: '900', color: textMain },
    rankPageMore: { fontSize: 12, fontWeight: '700', color: isDark ? '#D8B36A' : textSub },

    rankItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    rankNumber: { width: 25, fontSize: 18, fontWeight: '900', color: textSub },
    rankNumberTop: { color: isDark ? '#D8B36A' : '#ff6b6b' },
    rankCover: {
      width: 45,
      height: 60,
      backgroundColor: isDark ? '#303641' : '#ddd',
      borderRadius: 7,
      borderWidth: 1,
      borderColor: isDark ? '#4B5260' : '#1a1a1a',
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
      paddingHorizontal: 15,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: isDark ? 1 : 2,
      borderColor: isDark ? '#47505E' : '#1a1a1a',
      backgroundColor: isDark ? '#21252E' : '#ffde59',
      shadowColor: isDark ? '#080A0F' : '#1a1a1a',
      shadowOffset: { width: 0, height: isDark ? 3 : 2 },
      shadowOpacity: isDark ? 0.4 : 1,
      shadowRadius: isDark ? 6 : 0,
      elevation: 2,
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
    navActiveText: { color: isDark ? '#D8B36A' : '#2c3a7a', fontWeight: '900' },

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
      backgroundColor: isDark ? '#1B1F28' : '#fafafa',
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
      backgroundColor: isDark ? '#D8B36A' : '#1a1a1a',
      borderRadius: 8,
      marginTop: 4,
    },
    retryBtnText: {
      fontSize: 12,
      fontWeight: '800',
      color: isDark ? '#1a1a1a' : '#fff',
    },
  });
};
