import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Constants from 'expo-constants';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { useAppNavigation } from './navigation';
import { getBookCoverSource } from './bookCovers';
import { getBookChapterLabel } from './bookContentService';

const RECENT_SEARCHES_KEY = '@halmbook_recent_searches';
const MAX_RECENT_SEARCHES = 8;

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

type SearchBookItem = {
  id: string;
  book_id: string;
  title: string;
  author: string;
  category: string;
  rating: string;
  reviews: string;
  price: number;
  img_url?: string;
  description: string;
  chapter?: string;
};

const normalizeVietnamese = (str: string): string =>
  str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();

const mapApiBookToSearchItem = (item: any, index: number): SearchBookItem => {
  const id = String(item.book_id || item.id || `book-${index}`);
  const title = String(item.bookName || item.title || 'Chưa có tiêu đề');
  const author = String(item.author || 'HALM BOOK');
  const category = String(
    item.category_name || item.category || item.tag || 'Văn học'
  );
  const rawPrice =
    item.rent_price !== undefined && item.rent_price !== null
      ? Number(item.rent_price)
      : item.price !== undefined && item.price !== null
        ? Number(item.price)
        : 0;
  const price = Number.isFinite(rawPrice) ? Math.round(rawPrice) : 0;
  const rating = item.rating ? String(item.rating) : '5.0';
  const readCountNum = Number(item.readCount ?? item.read_count ?? 0);
  const reviews =
    readCountNum > 0
      ? `${readCountNum} lượt đọc`
      : item.reviews
        ? String(item.reviews)
        : 'Mới';
  const description = String(item.description || item.desc || '');
  const chapter = getBookChapterLabel({
    ...item,
    id,
    book_id: id,
    title,
    author,
  });

  return {
    id,
    book_id: id,
    title,
    author,
    category,
    rating,
    reviews,
    price,
    img_url: item.img_url || item.img || undefined,
    description,
    chapter,
  };
};

const filterBooksByKeyword = (
  books: SearchBookItem[],
  query: string
): SearchBookItem[] => {
  const trimmed = query.trim();
  if (!trimmed) return books;

  const qLower = trimmed.toLowerCase();
  const qNorm = normalizeVietnamese(trimmed);

  return books.filter((book) => {
    const titleLower = book.title.toLowerCase();
    const authorLower = book.author.toLowerCase();
    const catLower = book.category.toLowerCase();
    const descLower = book.description.toLowerCase();

    if (
      titleLower.includes(qLower) ||
      authorLower.includes(qLower) ||
      catLower.includes(qLower) ||
      descLower.includes(qLower)
    ) {
      return true;
    }

    const titleNorm = normalizeVietnamese(book.title);
    const authorNorm = normalizeVietnamese(book.author);
    const catNorm = normalizeVietnamese(book.category);

    return (
      titleNorm.includes(qNorm) ||
      authorNorm.includes(qNorm) ||
      catNorm.includes(qNorm)
    );
  });
};

export default function SearchScreen() {
  const { navigate, goBack, isDarkMode, toggleDarkMode } = useAppNavigation();
  const [keyword, setKeyword] = useState('');
  const [recent, setRecent] = useState<string[]>([]);
  const [allBooks, setAllBooks] = useState<SearchBookItem[]>([]);
  const [results, setResults] = useState<SearchBookItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [failedCovers, setFailedCovers] = useState<Record<string, boolean>>({});

  // ==============================================================
  // ĐỒNG BỘ 100% MÀU SẮC & TỶ LỆ HEADER THEO TRANG CHỦ (HOMESCREEN)
  // ==============================================================
  const isDark = isDarkMode;
  const colors = {
    headerBg: isDark ? '#1F2228' : '#4A7C72',
    headerIcon: '#FFFFFF',
    headerActionBg: isDark ? '#272B33' : 'rgba(255,255,255,0.18)',
    headerThemeIcon: isDark ? '#FFD166' : '#FFF8E7',
    searchBoxBg: isDark ? '#272B33' : '#FFFFFF',
    searchBoxText: isDark ? '#F3F6FA' : '#1E2430',
    searchBoxPlaceholder: isDark ? '#9BA3B2' : '#7A8291',
    screenBg: isDark ? '#12151B' : '#F6F7FB',
    cardBg: isDark ? '#1B1F28' : '#FFFFFF',
    border: isDark ? '#2E3441' : '#E5E8EF',
    textPrimary: isDark ? '#F3F6FA' : '#1E2430',
    textSecondary: isDark ? '#A5B0C2' : '#667085',
    brandPrimary: isDark ? '#D8B36A' : '#4A7C72',
    brandButtonText: isDark ? '#12151B' : '#FFFFFF',
    priceColor: isDark ? '#E5A93C' : '#4A7C72',
    chipBg: isDark ? '#232834' : '#EEF1F6',
  };

  // 1. Đọc lịch sử tìm kiếm thật từ AsyncStorage khi mount
  useEffect(() => {
    let isMounted = true;
    const loadRecentSearches = async () => {
      try {
        const stored = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
        if (stored && isMounted) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            const validList = parsed
              .filter((item) => typeof item === 'string' && item.trim().length > 0)
              .slice(0, MAX_RECENT_SEARCHES);
            setRecent(validList);
          }
        }
      } catch (err) {
        console.warn('Không thể đọc lịch sử tìm kiếm từ AsyncStorage:', err);
      }
    };
    loadRecentSearches();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Hàm lưu từ khóa mới vào AsyncStorage (tối đa 8 từ khóa gần nhất, không trùng lặp)
  const saveKeywordToRecent = useCallback(async (rawQuery: string) => {
    const trimmed = rawQuery.trim();
    if (!trimmed) return;

    setRecent((prev) => {
      const updated = [
        trimmed,
        ...prev.filter(
          (item) => item.trim().toLowerCase() !== trimmed.toLowerCase()
        ),
      ].slice(0, MAX_RECENT_SEARCHES);

      AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated)).catch(
        (err) => console.warn('Không thể lưu lịch sử tìm kiếm:', err)
      );
      return updated;
    });
  }, []);

  // 3. Hàm xóa toàn bộ lịch sử tìm kiếm trong AsyncStorage & State
  const clearAllRecentSearches = useCallback(async () => {
    setRecent([]);
    try {
      await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch (err) {
      console.warn('Không thể xóa lịch sử tìm kiếm:', err);
    }
  }, []);

  // 4. Gọi API Backend Spring Boot để lấy danh sách sách thật từ MySQL
  const searchBooksFromApi = useCallback(
    async (query: string, signal?: AbortSignal) => {
      setIsLoading(true);
      setErrorMessage(null);

      const trimmedQuery = query.trim();
      let fetchedRawList: any[] | null = null;
      let lastError: any = null;

      for (const baseUrl of CANDIDATE_API_URLS) {
        // Thử gọi endpoint /api/books/search?keyword={query} trước nếu có từ khóa
        if (trimmedQuery) {
          try {
            const searchRes = await axios.get(`${baseUrl}/api/books/search`, {
              params: { keyword: trimmedQuery },
              timeout: 4500,
              signal,
            });
            const data = searchRes.data;
            const list = Array.isArray(data)
              ? data
              : Array.isArray(data?.content)
                ? data.content
                : Array.isArray(data?.data)
                  ? data.data
                  : null;
            if (list) {
              fetchedRawList = list;
              break;
            }
          } catch (err: any) {
            if (axios.isCancel(err) || err?.name === 'CanceledError') return;
          }
        }

        // Gọi endpoint sách thật từ Backend Spring Boot: GET /api/home/books
        try {
          const response = await axios.get(`${baseUrl}/api/home/books`, {
            params: {
              page: 0,
              size: 100,
              ...(trimmedQuery ? { keyword: trimmedQuery } : {}),
            },
            timeout: 7000,
            signal,
          });
          const data = response.data;
          const list = Array.isArray(data)
            ? data
            : Array.isArray(data?.content)
              ? data.content
              : Array.isArray(data?.data)
                ? data.data
                : null;
          if (list) {
            fetchedRawList = list;
            break;
          }
        } catch (err: any) {
          lastError = err;
          if (axios.isCancel(err) || err?.name === 'CanceledError') return;
        }
      }

      if (fetchedRawList) {
        const mappedBooks = fetchedRawList.map(mapApiBookToSearchItem);
        setAllBooks(mappedBooks);
        setResults(filterBooksByKeyword(mappedBooks, trimmedQuery));
        setIsLoading(false);
      } else {
        setErrorMessage(
          lastError?.response?.data?.message ||
            lastError?.message ||
            'Không thể kết nối máy chủ để tải dữ liệu sách từ MySQL.'
        );
        setIsLoading(false);
      }
    },
    []
  );

  // Tải danh sách sách thật từ MySQL ngay khi mở màn hình Tìm kiếm
  useEffect(() => {
    const controller = new AbortController();
    searchBooksFromApi('', controller.signal);
    return () => controller.abort();
  }, [searchBooksFromApi]);

  // Lọc kết quả tức thì trên dữ liệu thật từ MySQL khi người dùng nhập từ khóa
  useEffect(() => {
    setResults(filterBooksByKeyword(allBooks, keyword));
  }, [keyword, allBooks]);

  // Khi người dùng nhấn Submit (Enter / Search) trên bàn phím
  const handleSubmitSearch = useCallback(
    async (searchValue?: string) => {
      const targetKeyword =
        typeof searchValue === 'string' ? searchValue : keyword;
      const trimmed = targetKeyword.trim();
      if (trimmed) {
        await saveKeywordToRecent(trimmed);
      }
      await searchBooksFromApi(trimmed);
    },
    [keyword, saveKeywordToRecent, searchBooksFromApi]
  );

  // Khi người dùng bấm vào 1 chip từ khóa trong lịch sử tìm kiếm
  const chooseSearch = useCallback(
    async (value: string) => {
      setKeyword(value);
      await saveKeywordToRecent(value);
      await searchBooksFromApi(value);
    },
    [saveKeywordToRecent, searchBooksFromApi]
  );

  const renderBook = ({ item }: { item: SearchBookItem }) => {
    const coverSource = !failedCovers[item.id]
      ? getBookCoverSource(item.id, item.img_url)
      : null;

    return (
      <View
        style={[
          styles.bookCard,
          {
            backgroundColor: colors.cardBg,
            borderColor: colors.border,
          },
        ]}
      >
        {/* Bìa sách thật từ MySQL / Backend: Rộng 75px, Cao 100px, bo góc 6px */}
        <View
          style={[
            styles.cover,
            {
              backgroundColor: colors.chipBg,
              borderColor: colors.border,
            },
          ]}
        >
          {coverSource ? (
            <Image
              source={coverSource}
              style={styles.coverImage}
              resizeMode="cover"
              onError={() =>
                setFailedCovers((prev) => ({ ...prev, [item.id]: true }))
              }
            />
          ) : (
            <Ionicons
              name="book-outline"
              size={28}
              color={colors.textSecondary}
            />
          )}
        </View>

        {/* Cột thông tin sách thật */}
        <View style={styles.bookInfo}>
          <View>
            <Text
              style={[styles.bookTitle, { color: colors.textPrimary }]}
              numberOfLines={1}
            >
              {item.title}
            </Text>
            <Text
              style={[styles.author, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {item.author}
            </Text>

            {/* Đánh giá sao + Badge thể loại */}
            <View style={styles.metaRow}>
              <Text style={[styles.ratingText, { color: colors.textPrimary }]}>
                ⭐ {item.rating}{' '}
                <Text style={{ color: colors.textSecondary }}>
                  ({item.reviews})
                </Text>
              </Text>

              <View
                style={[
                  styles.categoryBadge,
                  { backgroundColor: colors.chipBg },
                ]}
              >
                <Text
                  style={[
                    styles.categoryBadgeText,
                    { color: colors.textSecondary },
                  ]}
                  numberOfLines={1}
                >
                  {item.category}
                </Text>
              </View>
            </View>
          </View>

          {/* Dưới cùng: Trái là Giá thuê bằng Khoai thật từ DB, Phải là Nút "Xem chi tiết" */}
          <View style={styles.bottomRow}>
            <Text style={[styles.priceKhoai, { color: colors.priceColor }]}>
              {item.price} Khoai 🥔
            </Text>

            <TouchableOpacity
              style={[
                styles.detailButton,
                { backgroundColor: colors.brandPrimary },
              ]}
              activeOpacity={0.85}
              onPress={() =>
                navigate('bookDetail', {
                  id: item.id,
                  title: item.title,
                  author: item.author,
                  chapter: item.chapter,
                  tag: item.category,
                  rating: item.rating,
                  reads: item.reviews,
                  img_url: item.img_url,
                  description: item.description,
                  price: item.price,
                })
              }
            >
              <Text
                style={[
                  styles.detailButtonText,
                  { color: colors.brandButtonText },
                ]}
              >
                Xem chi tiết
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.safe, { backgroundColor: colors.headerBg }]}
    >
      <ExpoStatusBar style="light" />

      {/* ============================================================== */}
      {/* A. HEADER ĐỒNG BỘ 100% TỌA ĐỘ & KÍCH THƯỚC VỚI TRANG CHỦ       */}
      {/* ============================================================== */}
      <View
        style={[
          styles.searchHeaderRow,
          { backgroundColor: colors.headerBg },
        ]}
      >
        {/* Nút Back [←] (width: 40, height: 40 - trùng tọa độ với nút 3 gạch Trang chủ) */}
        <TouchableOpacity
          style={styles.headerLeftBtn}
          onPress={goBack}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel="Quay lại"
        >
          <Ionicons name="arrow-back" size={24} color={colors.headerIcon} />
        </TouchableOpacity>

        {/* Ô TextInput Tìm kiếm (flex: 1, height: 40, borderRadius: 10, marginHorizontal: 8) */}
        <View
          style={[
            styles.searchInputContainer,
            { backgroundColor: colors.searchBoxBg },
          ]}
        >
          <Ionicons
            name="search-outline"
            size={18}
            color={colors.searchBoxPlaceholder}
            style={styles.searchIcon}
          />
          <TextInput
            style={[
              styles.input,
              { color: colors.searchBoxText },
              Platform.OS === 'web'
                ? ({
                    outlineStyle: 'none',
                    outlineWidth: 0,
                  } as any)
                : null,
            ]}
            value={keyword}
            onChangeText={setKeyword}
            onSubmitEditing={() => handleSubmitSearch(keyword)}
            placeholder="Tìm kiếm sách, tác giả..."
            placeholderTextColor={colors.searchBoxPlaceholder}
            underlineColorAndroid="transparent"
            autoFocus={true}
            returnKeyType="search"
          />
          {!!keyword && (
            <TouchableOpacity
              onPress={() => setKeyword('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Xóa từ khóa tìm kiếm"
            >
              <Ionicons
                name="close-circle"
                size={18}
                color={colors.searchBoxPlaceholder}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Góc phải: Nút Theme [☀️/🌙] + Nút Giỏ hàng [🛒] khớp 100% độ dài với Trang chủ */}
        <TouchableOpacity
          style={[
            styles.headerRightBtn,
            { backgroundColor: colors.headerActionBg },
          ]}
          onPress={() => toggleDarkMode?.()}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel={
            isDark ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'
          }
        >
          <Ionicons
            name={isDark ? 'sunny' : 'moon'}
            size={20}
            color={colors.headerThemeIcon}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.headerRightBtn,
            { backgroundColor: colors.headerActionBg, marginLeft: 4 },
          ]}
          onPress={() => navigate('cart')}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel="Giỏ hàng"
        >
          <Ionicons name="cart-outline" size={21} color={colors.headerIcon} />
        </TouchableOpacity>
      </View>

      {/* ============================================================== */}
      {/* B. KHU VỰC NỘI DUNG BÊN DƯỚI (LỊCH SỬ THẬT & SÁCH THẬT MYSQL)   */}
      {/* ============================================================== */}
      <View style={[styles.bodyContainer, { backgroundColor: colors.screenBg }]}>
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={renderBook}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.listContainer}
          ListHeaderComponent={
            <>
              {/* Cụm "TÌM KIẾM GẦN ĐÂY" lưu thật trong AsyncStorage */}
              {recent.length > 0 && (
                <View style={styles.recentSection}>
                  <View style={styles.sectionHeader}>
                    <View style={styles.sectionTitleLeft}>
                      <Ionicons
                        name="time-outline"
                        size={16}
                        color={colors.textPrimary}
                      />
                      <Text
                        style={[
                          styles.recentHeaderTitle,
                          { color: colors.textPrimary },
                        ]}
                      >
                        TÌM KIẾM GẦN ĐÂY
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={clearAllRecentSearches}
                      activeOpacity={0.75}
                    >
                      <Text
                        style={[
                          styles.clearText,
                          { color: colors.brandPrimary },
                        ]}
                      >
                        Xóa tất cả
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.recentWrap}>
                    {recent.map((item) => (
                      <TouchableOpacity
                        key={item}
                        style={[
                          styles.recentChip,
                          {
                            backgroundColor: colors.chipBg,
                            borderColor: colors.border,
                          },
                        ]}
                        activeOpacity={0.75}
                        onPress={() => chooseSearch(item)}
                      >
                        <Text
                          style={[
                            styles.recentChipText,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {item}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Tiêu đề "KẾT QUẢ TÌM KIẾM" + Số lượng sách thật */}
              <View style={styles.resultHeader}>
                <Text
                  style={[
                    styles.resultHeaderTitle,
                    { color: colors.textPrimary },
                  ]}
                >
                  KẾT QUẢ TÌM KIẾM
                </Text>
                <Text
                  style={[styles.resultCount, { color: colors.textSecondary }]}
                >
                  {isLoading ? 'Đang tải...' : `Có ${results.length} kết quả`}
                </Text>
              </View>
            </>
          }
          ListEmptyComponent={
            isLoading ? (
              <View style={styles.empty}>
                <ActivityIndicator size="large" color={colors.brandPrimary} />
                <Text
                  style={[styles.emptyText, { color: colors.textSecondary, marginTop: 12 }]}
                >
                  Đang tải dữ liệu sách từ hệ thống...
                </Text>
              </View>
            ) : errorMessage ? (
              <View style={styles.empty}>
                <Ionicons
                  name="cloud-offline-outline"
                  size={44}
                  color={colors.textSecondary}
                  style={{ opacity: 0.65 }}
                />
                <Text
                  style={[styles.emptyTitle, { color: colors.textPrimary }]}
                >
                  Không thể tải danh sách sách
                </Text>
                <Text
                  style={[styles.emptyText, { color: colors.textSecondary }]}
                >
                  {errorMessage}
                </Text>
                <TouchableOpacity
                  style={[
                    styles.retryBtn,
                    { backgroundColor: colors.brandPrimary },
                  ]}
                  onPress={() => searchBooksFromApi(keyword)}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[
                      styles.detailButtonText,
                      { color: colors.brandButtonText },
                    ]}
                  >
                    Thử lại
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.empty}>
                <Ionicons
                  name="search-outline"
                  size={44}
                  color={colors.textSecondary}
                  style={{ opacity: 0.55 }}
                />
                <Text
                  style={[styles.emptyTitle, { color: colors.textPrimary }]}
                >
                  Không tìm thấy sách
                </Text>
                <Text
                  style={[styles.emptyText, { color: colors.textSecondary }]}
                >
                  Thử tìm bằng tên sách hoặc tác giả khác.
                </Text>
              </View>
            )
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },

  // A. Header khóa thông số khớp 100% với HomeScreen (height: 52, paddingHorizontal: 12)
  searchHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    paddingHorizontal: 12,
  },
  headerLeftBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchInputContainer: {
    flex: 1,
    height: 40,
    marginHorizontal: 8,
    borderRadius: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  headerRightBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // B. Nội dung bên dưới
  bodyContainer: {
    flex: 1,
  },
  listContainer: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 110,
  },

  // Cụm Tìm kiếm gần đây
  recentSection: {
    marginBottom: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recentHeaderTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  clearText: {
    fontSize: 12,
    fontWeight: '600',
  },
  recentWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  recentChip: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  recentChipText: {
    fontSize: 12,
    fontWeight: '500',
  },

  // Cụm Kết quả tìm kiếm
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  resultHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  resultCount: {
    fontSize: 12,
  },

  // Thẻ sách (Book Item Card)
  bookCard: {
    flexDirection: 'row',
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
  },
  cover: {
    width: 75,
    height: 100,
    borderRadius: 6,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  bookInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  bookTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  author: {
    fontSize: 12,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
  },
  categoryBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  priceKhoai: {
    fontSize: 13,
    fontWeight: '700',
  },
  detailButton: {
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailButtonText: {
    fontSize: 12,
    fontWeight: '700',
  },
  retryBtn: {
    marginTop: 14,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },

  // Empty State
  empty: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 10,
  },
  emptyText: {
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
});
