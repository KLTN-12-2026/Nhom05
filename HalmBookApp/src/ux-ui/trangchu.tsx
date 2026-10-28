import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
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

const { width, height } = Dimensions.get('window');

// Kích hoạt LayoutAnimation cho Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Cấu hình kết nối Backend - Tái sử dụng cấu hình từ loginlogout.tsx và hỗ trợ fallback môi trường
const API_BASE_URL = 'http://192.168.2.77:8082';
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
  const { navigate } = useAppNavigation();
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

  const renderNovelCard = (novel: any, cardWidth: number | string = 110) => {
    const coverSource = getBookCoverSource(novel.id, novel.img_url);
    return (
      <TouchableOpacity key={novel.id} style={[styles.novelCard, { width: cardWidth as any }]} activeOpacity={0.9} onPress={() => navigate('bookDetail', novel)}>
        <View style={[styles.novelCover, { height: typeof cardWidth === 'number' ? cardWidth * 1.3 : 150 }]}>
          {coverSource ? (
            <Image source={coverSource} style={StyleSheet.absoluteFill} resizeMode="cover" />
          ) : (
            <Text style={styles.novelCoverText}>Ảnh{'\n'}Truyện</Text>
          )}
        </View>
        <Text style={styles.novelTitle} numberOfLines={2}>{novel.title}</Text>
        <Text style={styles.novelChapter}>{novel.chapter || novel.author || 'Đang cập nhật'}</Text>
      </TouchableOpacity>
    );
  };

  const renderRankItem = (novel: any, index: number) => {
    const coverSource = getBookCoverSource(novel.id, novel.img_url);
    return (
      <TouchableOpacity key={novel.id} style={styles.rankItem} activeOpacity={0.8} onPress={() => navigate('bookDetail', novel)}>
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

  const toolbarData = isDarkMode 
    ? [
        { icon: 'star', label: 'Xếp hạng', color: '#D8B36A' },
        { icon: 'bookmark', label: 'Lưu trữ', color: '#9A8BC2' },
        { icon: 'newspaper', label: 'Bảng tin', color: '#71A9A1' },
        { icon: 'gift', label: 'Ưu đãi', color: '#B88980' },
      ]
    : [
        { icon: 'star', label: 'Xếp hạng\nđộc giả', color: '#ffde59' },
        { icon: 'bookmark', label: 'Sách đã\nlưu', color: '#a29bfe' },
        { icon: 'newspaper', label: 'Bảng\ntin', color: '#1dd1a1' },
        { icon: 'gift', label: 'Ưu\nđãi', color: '#ff6b6b' },
      ];

  const badgeColors = isDarkMode
    ? { 1: '#5A526F', 2: '#624F35', 3: '#35544F', 4: '#584341' }
    : { 1: '#ff9ff3', 2: '#1dd1a1', 3: '#ffde59', 4: '#48dbfb' };

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: isDarkMode ? BRAND.black : '#fff' }]}>
      <Animated.View style={[styles.container, { backgroundColor: animatedBg }]}>
      <StatusBar translucent={false} backgroundColor={isDarkMode ? '#1F2228' : '#5a8b82'} barStyle={isDarkMode ? "light-content" : "dark-content"} />
      
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
        onScroll={(event) => { scrollOffset.current = event.nativeEvent.contentOffset.y; }}
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
              <TouchableOpacity key={banner.id} style={styles.bannerCard} activeOpacity={0.9} onPress={() => navigate('bookDetail', banner)}>
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
              onPress={() => navigate((['transactions', 'bookshelf', 'dmHome', 'offers'] as const)[idx])}
            >
              <View style={[styles.toolbarIconBox, isDarkMode ? styles.toolbarIconBoxDark : { backgroundColor: item.color }]}>
                {isDarkMode ? (
                  <View style={[styles.toolbarIconCircle, { backgroundColor: item.color }]}>
                    <Ionicons name={item.icon as any} size={23} color="#161920" />
                  </View>
                ) : (
                  <Ionicons name={item.icon as any} size={24} color="#1a1a1a" />
                )}
              </View>
              <Text style={styles.toolbarLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <View style={[styles.sectionTitleBox, { backgroundColor: badgeColors[1] }]}>
            <Ionicons name="sparkles" size={18} color="#1a1a1a" style={{marginRight: 6}} />
            <Text style={[styles.sectionTitleText, { color: '#1a1a1a' }]}>Khuyến Khích Đọc</Text>
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
              {recommendedBooks.map(n => renderNovelCard(n, 120))}
            </ScrollView>
          )}
        </View>

        <View style={styles.section}>
          <View style={[styles.sectionTitleBox, { backgroundColor: badgeColors[2] }]}>
            <Ionicons name="flash" size={18} color="#1a1a1a" style={{marginRight: 6}} />
            <Text style={[styles.sectionTitleText, { color: '#1a1a1a' }]}>Mới Cập Nhật</Text>
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
              {recentBooks.map(n => renderNovelCard(n, 120))}
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

        <View style={[styles.section, { paddingHorizontal: 15 }]}>
          <View style={[styles.sectionTitleBox, { marginLeft: 0, backgroundColor: badgeColors[4] }]}>
            <Ionicons name="library" size={18} color="#1a1a1a" style={{marginRight: 6}} />
            <Text style={[styles.sectionTitleText, { color: '#1a1a1a' }]}>Danh Mục Sách</Text>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 8, gap: 8 }}>
            {categoriesList.map(tag => {
              const isActive = selectedCategory === tag;
              return (
                <TouchableOpacity
                  key={tag}
                  style={[
                    styles.categoryTag,
                    isActive && {
                      backgroundColor: isDarkMode ? '#D8B36A' : '#5a8b82',
                      borderColor: isDarkMode ? '#E5CA98' : '#1a1a1a',
                    }
                  ]}
                  onPress={() => setSelectedCategory(tag)}
                >
                  <Text style={[
                    styles.categoryTagText,
                    isActive && { color: isDarkMode ? '#12151B' : '#ffffff', fontWeight: '800' }
                  ]}>
                    {tag}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          
          {isLoading ? (
            <View style={styles.statusBox}>
              <ActivityIndicator size="small" color={isDarkMode ? '#D8B36A' : '#5a8b82'} />
              <Text style={styles.statusText}>Đang tải danh mục sách...</Text>
            </View>
          ) : errorMessage ? (
            <View style={styles.statusBox}>
              <Text style={styles.statusErrorText}>{errorMessage}</Text>
            </View>
          ) : books.length === 0 ? (
            <View style={styles.statusBox}>
              <Text style={styles.statusEmptyText}>Chưa có sách trong danh mục</Text>
            </View>
          ) : (
            <View style={styles.gridContainer}>
              {categorizedBooks.map((n, idx) => (
                <View key={n.id || idx} style={styles.gridItem}>
                  {renderNovelCard(n, '100%' as any)}
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.footerBranding}>
          <Text style={styles.footerBrandTitle}>HALM <Text style={{ color: isDarkMode ? '#A99BCB' : '#9b51e0' }}>Book</Text></Text>
          <Text style={styles.footerBrandSlogan}>Sách là ánh sáng!</Text>
        </View>

      </ScrollView>

      </Animated.View>
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
      paddingVertical: isDark ? 12 : 15,
      paddingHorizontal: 10,
      marginBottom: 10,
    },
    toolbarItem: { alignItems: 'center', flex: 1 },
    toolbarIconBox: {
      width: 52,
      height: 52,
      borderRadius: 18,
      borderWidth: isDark ? 1 : 2,
      borderColor: isDark ? '#454C5A' : '#1a1a1a',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
      shadowColor: isDark ? '#080A0F' : '#1a1a1a',
      shadowOffset: { width: 0, height: isDark ? 4 : 2 },
      shadowOpacity: isDark ? 0.55 : 1,
      shadowRadius: isDark ? 8 : 0,
      elevation: 3,
    },
    toolbarIconBoxDark: {
      backgroundColor: '#20242D',
    },
    toolbarIconCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
    },
    toolbarLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: textMain,
      textAlign: 'center',
      lineHeight: 16,
    },

    section: { marginBottom: 25 },
    sectionTitleBox: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 12,
      borderWidth: isDark ? 1 : 2,
      borderColor: isDark ? '#4B5260' : '#1a1a1a',
      marginLeft: 15,
      marginBottom: 15,
      shadowColor: isDark ? '#080A0F' : '#1a1a1a',
      shadowOffset: { width: 0, height: isDark ? 4 : 3 },
      shadowOpacity: isDark ? 0.45 : 1,
      shadowRadius: isDark ? 7 : 0,
      elevation: 3,
    },
    sectionTitleText: { fontSize: 16, fontWeight: '900' },
    scrollList: { paddingLeft: 15, paddingRight: 5 },

    novelCard: { marginRight: 15 },
    novelCover: {
      backgroundColor: isDark ? coverBg : '#ffffff',
      borderRadius: 11,
      borderWidth: isDark ? 1 : 2,
      borderColor: isDark ? '#444B58' : '#1a1a1a',
      marginBottom: 8,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
    },
    novelCoverText: { color: textSub, fontWeight: '800', textAlign: 'center' },
    novelTitle: { fontSize: 13, fontWeight: '800', color: textMain, marginBottom: 4, lineHeight: 18 },
    novelChapter: { fontSize: 11, fontWeight: '600', color: textSub },

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
