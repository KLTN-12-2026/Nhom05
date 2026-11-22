import { useMissionVisit } from './useMissionTracking';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  Alert,
  Dimensions,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getBookCoverSource } from './bookCovers';
import { BookData, useAppNavigation, useAppThemeStyles, useAutoHideFooter } from './navigation';
import { READING_BOOKS_LIST_KEY, addToReadingList } from './readingHistory';
import {
  getUserItem,
  setUserItem,
  removeUserItem,
  KEY_READING_BOOKS,
  KEY_UPLOADED_BOOKS,
  KEY_FAVORITES_BOOKS,
  KEY_CURRENT_READING,
  KEY_GIFTED_BOOKS,
} from './userStorage';
import { getUnreadNotificationCount } from './notificationService';
import { fetchBookshelfFromApi, RentedBookItem } from './rentalService';
import { fetchFavoriteBooksFromApi } from './favoriteService';

// ============================================================================
// [GIẢI THÍCH CODE]: Các hằng số Storage Key
// ============================================================================
const UPLOADED_STORAGE_KEY = KEY_UPLOADED_BOOKS;
const FAVORITES_STORAGE_KEY = KEY_FAVORITES_BOOKS;
const CURRENT_READING_KEY = KEY_CURRENT_READING;

// Tính toán kích thước để hiển thị chính xác 1 hàng gồm 3 cuốn sách
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HORIZONTAL_PADDING = 16;
const GAP = 12;
const ITEM_WIDTH = Math.floor((SCREEN_WIDTH - (HORIZONTAL_PADDING * 2) - (GAP * 2)) / 3);
const COVER_HEIGHT = Math.floor(ITEM_WIDTH * 1.42);

export type BookshelfTab = 'dangdoc' | 'dangthue' | 'dathue' | 'yeuthich' | 'tailen' | 'duoctang';

interface TabConfig {
  id: BookshelfTab;
  label: string;
  labelEn: string;
  icon: keyof typeof Ionicons.glyphMap;
}

// 6 Tab nằm ngang với các icon sắc nét, bắt mắt
const TABS: TabConfig[] = [
  { id: 'dangdoc', label: 'Sách đang đọc', labelEn: 'Reading', icon: 'book' },
  { id: 'dangthue', label: 'Đang thuê', labelEn: 'Renting', icon: 'time' },
  { id: 'yeuthich', label: 'Yêu thích', labelEn: 'Favorites', icon: 'heart' },
  { id: 'tailen', label: 'Tải lên', labelEn: 'Uploaded', icon: 'cloud-upload' },
  { id: 'duoctang', label: 'Được tặng', labelEn: 'Gifted', icon: 'gift' },
  { id: 'dathue', label: 'Sách đã thuê', labelEn: 'Rented', icon: 'hourglass' },
];

export interface BookshelfItem {
  id: string;
  title: string;
  author?: string;
  chapter?: string;
  chapterNum?: number;
  progress?: number;
  img_url?: string;
  coverImage?: string | null;
  coverUri?: string | null;
  isPersonal?: boolean;
  fileUri?: string;
  pdf_url?: string;
  beBookId?: string;
  isSyncedWithBE?: boolean;
  chapters?: any[];
  remainingDays?: number;
  isForever?: boolean;
  expired?: boolean;
  categoryName?: string;
  accessRecordId?: number;
  status?: string;
  startDate?: unknown;
  endDate?: unknown;
}

function parseEndTimestamp(rawDate: unknown): number | null {
  if (!rawDate) return null;
  if (typeof rawDate === 'number' && Number.isFinite(rawDate)) {
    return rawDate > 1e11 ? rawDate : rawDate * 1000;
  }
  if (Array.isArray(rawDate) && rawDate.length >= 3) {
    const [year, month, day, hour = 0, minute = 0, second = 0] = rawDate;
    return new Date(year, month - 1, day, hour, minute, second).getTime();
  }
  if (typeof rawDate === 'string') {
    const match = rawDate.trim().match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d+))?)?)?/);
    if (match) {
      const [, y, m, d, h = '0', min = '0', s = '0'] = match;
      return new Date(Number(y), Number(m) - 1, Number(d), Number(h), Number(min), Number(s)).getTime();
    }
    const cleaned = rawDate.trim().replace(' ', 'T').replace(/(\.\d{3})\d+/, '$1');
    const parsed = Date.parse(cleaned);
    if (!isNaN(parsed)) return parsed;
    const d = new Date(cleaned);
    if (!isNaN(d.getTime())) return d.getTime();
  }
  return null;
}

function getItemRemainingMs(item: BookshelfItem, currentNow: number): number | null {
  if (item.isForever || item.expired) return null;
  const parsed = parseEndTimestamp(item.endDate);
  if (parsed && Number.isFinite(parsed)) {
    const diff = parsed - currentNow;
    return diff > 0 ? diff : 0;
  }
  if (item.remainingDays === 1) {
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    const diff = endOfDay.getTime() - currentNow;
    return diff > 0 ? diff : 0;
  }
  return null;
}

function formatCountdown(remainingMs: number): string {
  if (!Number.isFinite(remainingMs) || remainingMs <= 0) return '00:00:00';
  const totalSeconds = Math.floor(remainingMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

// Các màu bìa tối giản phong cách ấn phẩm xuất bản khi sách chưa có ảnh bìa
const getPlaceholderColors = (title: string) => {
  const hash = (title || '').split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const palettes = [
    { bg: '#F4F5F7', text: '#1F2937', border: '#E5E7EB', spine: '#CBD5E1' },
    { bg: '#EFF4F2', text: '#234E45', border: '#D5E3DF', spine: '#9AB8B1' },
    { bg: '#F2F4F8', text: '#243447', border: '#DCE2EC', spine: '#9AA8BF' },
    { bg: '#F6F4F0', text: '#3F3A32', border: '#E6E1D8', spine: '#C4BCB0' },
  ];
  return palettes[hash % palettes.length];
};

export default function TuSach({ initialTab = 'dangdoc' }: { initialTab?: BookshelfTab }) {
  const themeStyles = useAppThemeStyles(styles);
  const {
    navigate,
    navigateTab,
    isDarkMode,
    lang,
    userAvatarUrl,
    userInitial,
    isLoggedIn,
    showLoginAlert,
  } = useAppNavigation();
  const { onScroll: handleFooterScroll, showFooter } = useAutoHideFooter();

  const foreground = isDarkMode ? '#F5F1E8' : '#11131A';

  useMissionVisit('BOOKSHELF', isLoggedIn);
  const [activeTab, setActiveTab] = useState<BookshelfTab>(initialTab);

  // Chế độ chỉnh sửa xoá sách đang đọc
  const [isEditing, setIsEditing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Mặc định là mảng rỗng, chỉ hiển thị sách thật của người dùng
  const [readingList, setReadingList] = useState<BookshelfItem[]>([]);
  const [rentedList, setRentedList] = useState<BookshelfItem[]>([]);
  const [expiredRentedList, setExpiredRentedList] = useState<BookshelfItem[]>([]);
  const [favoritesList, setFavoritesList] = useState<BookshelfItem[]>([]);
  const [uploadedList, setUploadedList] = useState<BookshelfItem[]>([]);
  const [giftedList, setGiftedList] = useState<BookshelfItem[]>([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [isLoadingRented, setIsLoadingRented] = useState(false);
  const [rentedError, setRentedError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [now, setNow] = useState<number>(() => Date.now());

  // Tự động đếm ngược thời gian thực mỗi giây khi ở tab Đang thuê
  useEffect(() => {
    if (activeTab !== 'dangthue') return;
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, [activeTab]);

  useEffect(() => {
    getUnreadNotificationCount().then(setUnreadNotifCount).catch(() => {});
  }, [activeTab]);

  useEffect(() => {
    showFooter();
  }, [activeTab, showFooter]);

  // ============================================================================
  // [GIẢI THÍCH CODE]: Nạp dữ liệu sách thực tế từ AsyncStorage theo tài khoản
  // Tối ưu hóa: Chạy song song Promise.all để giảm thời gian chờ gấp 4 lần
  // ============================================================================
  const shelfRequest = useRef<Promise<void> | null>(null);
  const loadBookshelfData = useCallback(() => {
    if (shelfRequest.current) return shelfRequest.current;
    const operation = (async () => {
    try {
      const [rawReading, currentReading, storedUploaded, storedFav, storedGifted, token] = await Promise.all([
        getUserItem(KEY_READING_BOOKS),
        getUserItem(CURRENT_READING_KEY),
        getUserItem(KEY_UPLOADED_BOOKS),
        getUserItem(KEY_FAVORITES_BOOKS),
        getUserItem(KEY_GIFTED_BOOKS),
        AsyncStorage.getItem('userToken'),
      ]);

      // 1. Sách đang đọc
      if (rawReading) {
        try {
          const parsed = JSON.parse(rawReading);
          setReadingList(Array.isArray(parsed) ? parsed : []);
        } catch {
          setReadingList([]);
        }
      } else if (currentReading) {
        try {
          const parsedCurrent = JSON.parse(currentReading);
          setReadingList(parsedCurrent && parsedCurrent.title ? [parsedCurrent] : []);
        } catch {
          setReadingList([]);
        }
      } else {
        setReadingList([]);
      }

      // 2. Sách tải lên cá nhân (Tab 'tailen') - Chỉ hiển thị sách do người dùng tự tải từ thiết bị
      if (storedUploaded) {
        try {
          const parsed = JSON.parse(storedUploaded);
          const cleanUploaded = Array.isArray(parsed)
            ? parsed.filter((b: any) => {
                const id = String(b.id || b.book_id || '');
                const isSample = /^B0(0[1-9]|10)$/i.test(id);
                return !isSample && (b.fileUri || b.isPersonal || b.fileName);
              })
            : [];
          setUploadedList(cleanUploaded);
          if (Array.isArray(parsed) && cleanUploaded.length !== parsed.length) {
            setUserItem(KEY_UPLOADED_BOOKS, JSON.stringify(cleanUploaded)).catch(() => {});
          }
        } catch {
          setUploadedList([]);
        }
      } else {
        setUploadedList([]);
      }

      // 3. Sách yêu thích & Sách đang thuê (đồng bộ trực tiếp 2 chiều với Backend MySQL)
      let currentFavs: BookshelfItem[] = [];
      if (storedFav) {
        try {
          const parsedFav = JSON.parse(storedFav);
          if (Array.isArray(parsedFav)) currentFavs = parsedFav;
        } catch {}
      }

      // 4. Sách được tặng theo user
      if (storedGifted) {
        try {
          const parsedGifted = JSON.parse(storedGifted);
          setGiftedList(Array.isArray(parsedGifted) ? parsedGifted : []);
        } catch {
          setGiftedList([]);
        }
      } else {
        setGiftedList([]);
      }

      // 5. Đồng bộ từ Backend với fallback URL thông minh:
      //    GET /api/home/bookshelf (đang thuê) & GET /api/home/favorites (yêu thích)
      if (token) {
        setIsLoadingRented(true);
        setRentedError(null);
        try {
          const mapRentedDto = (item: RentedBookItem): BookshelfItem => ({
            id: item.bookId,
            accessRecordId: item.accessRecordId,
            status: item.status,
            title: item.title,
            author: item.author,
            chapter: item.status === 'REVOKED'
              ? (lang === 'en' ? 'Reading access revoked' : 'Đã thu hồi quyền đọc')
              : item.status === 'REJECTED'
              ? (lang === 'en' ? 'Rental rejected' : 'Đã từ chối thuê')
              : item.expired
              ? (lang === 'en' ? 'Expired' : 'Hết hạn thuê')
              : item.isForever
                ? (lang === 'en' ? 'Owned forever' : 'Sở hữu vĩnh viễn')
                : (lang === 'en' ? `${Math.max(1, item.remainingDays)}d left` : `Còn ${Math.max(1, item.remainingDays)} ngày`),
            img_url: item.img_url || '',
            coverImage: item.coverImage || item.img_url || '',
            remainingDays: item.remainingDays,
            isForever: item.isForever,
            expired: item.expired,
            categoryName: item.categoryName,
            startDate: item.startDate,
            endDate: item.endDate,
          });

          const [bookshelfRes, syncedFavs] = await Promise.all([
            fetchBookshelfFromApi(),
            fetchFavoriteBooksFromApi().catch(() => null),
          ]);

          // Tách bạch sách còn hạn vào "Đang thuê" và sách hết hạn vào "Sách đã thuê"
          const nowMs = Date.now();
          const mappedRented = bookshelfRes.books.map(mapRentedDto);
          const mappedExpired = bookshelfRes.expiredBooks.map(mapRentedDto);

          const activeCandidates: BookshelfItem[] = [];
          const expiredCandidates: BookshelfItem[] = [...mappedExpired];

          for (const b of mappedRented) {
            const parsedEnd = parseEndTimestamp(b.endDate);
            const isActuallyExpired = b.expired || (!b.isForever && parsedEnd !== null && parsedEnd <= nowMs);
            if (isActuallyExpired) {
              expiredCandidates.push({
                ...b,
                expired: true,
                chapter: lang === 'en' ? 'Expired' : 'Hết hạn thuê',
              });
            } else {
              activeCandidates.push(b);
            }
          }

          // Lọc trùng theo id sách trong mục Đang thuê (giữ bản ghi có thời hạn dài nhất)
          const seenRented = new Map<string, BookshelfItem>();
          for (const b of activeCandidates) {
            const existing = seenRented.get(b.id);
            if (!existing) {
              seenRented.set(b.id, b);
            } else {
              const bEnd = parseEndTimestamp(b.endDate) ?? 0;
              const exEnd = parseEndTimestamp(existing.endDate) ?? 0;
              if (b.isForever || bEnd > exEnd || ((b.remainingDays || 0) > (existing.remainingDays || 0))) {
                seenRented.set(b.id, b);
              }
            }
          }
          const deduplicatedRented = Array.from(seenRented.values());
          setRentedList(deduplicatedRented);

          // Lọc trùng trong mục Sách đã thuê (loại trừ các sách hiện đang còn hạn thuê)
          const deduplicatedExpired: BookshelfItem[] = [];
          const seenExpired = new Set<string>();
          for (const b of expiredCandidates) {
            if (!seenRented.has(b.id) && !seenExpired.has(b.id)) {
              seenExpired.add(b.id);
              deduplicatedExpired.push(b);
            }
          }
          setExpiredRentedList(deduplicatedExpired);

          if (bookshelfRes.networkError && bookshelfRes.errorMessage) {
            setRentedError(bookshelfRes.errorMessage);
          }

          if (Array.isArray(syncedFavs)) {
            currentFavs = syncedFavs.map((item) => ({
              id: String(item.bookId || item.id),
              title: item.title || 'Sách yêu thích',
              author: item.author || 'Tác giả',
              chapter: item.categoryName || 'Yêu thích',
              img_url: item.img_url || '',
              coverImage: item.coverImage || item.img_url || '',
            }));
          }
        } catch {
          setRentedList([]);
          setExpiredRentedList([]);
        } finally {
          setIsLoadingRented(false);
        }
      } else {
        setRentedList([]);
        setExpiredRentedList([]);
        setRentedError(null);
        setIsLoadingRented(false);
      }

      setFavoritesList(currentFavs);
    } catch {
      // Giữ danh sách rỗng nếu có lỗi
      setReadingList([]);
      setUploadedList([]);
      setFavoritesList([]);
      setRentedList([]);
      setExpiredRentedList([]);
      setGiftedList([]);
      setIsLoadingRented(false);
    }
    })();
    shelfRequest.current = operation;
    void operation.finally(() => { if (shelfRequest.current === operation) shelfRequest.current = null; });
    return operation;
  }, [lang]);

  const handleRefreshBookshelf = useCallback(async () => {
    setRefreshing(true);
    await loadBookshelfData();
    setRefreshing(false);
  }, [loadBookshelfData]);

  useEffect(() => {
    void loadBookshelfData();
    const timer = setInterval(() => { if (AppState.currentState === 'active') void loadBookshelfData(); }, 15000);
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') void loadBookshelfData(); });
    return () => { clearInterval(timer); subscription.remove(); };
  }, [loadBookshelfData]);

  // Đổi Tab: Hủy trạng thái chỉnh sửa nếu đang bật & nạp lại dữ liệu mới nhất
  const handleTabChange = (tabId: BookshelfTab) => {
    setIsEditing(false);
    setSelectedIds([]);
    setActiveTab(tabId);
    loadBookshelfData();
  };

  // Lấy danh sách sách theo tab đang chọn
  const getCurrentList = (): BookshelfItem[] => {
    switch (activeTab) {
      case 'dangdoc':
        return readingList;
      case 'dangthue':
        return rentedList;
      case 'dathue':
        return expiredRentedList;
      case 'yeuthich':
        return favoritesList;
      case 'tailen':
        return uploadedList;
      case 'duoctang':
        return giftedList;
      default:
        return [];
    }
  };

  const currentBooks = getCurrentList();

  // ============================================================================
  // [GIẢI THÍCH CODE]: Xử lý chọn sách trong chế độ chỉnh sửa (Sách đang đọc & Sách tải lên)
  // ============================================================================
  const currentTargetList = activeTab === 'tailen' ? uploadedList : readingList;
  const isAllSelected = currentTargetList.length > 0 && selectedIds.length === currentTargetList.length;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(currentTargetList.map((b) => b.id));
    }
  };

  const handleToggleSelectBook = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // ============================================================================
  // [GIẢI THÍCH CODE]: Xoá các cuốn sách đã chọn (khỏi Sách đang đọc hoặc Sách tải lên)
  // ============================================================================
  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;

    const isUploadedTab = activeTab === 'tailen';
    const alertTitle = isUploadedTab
      ? (lang === 'en' ? 'Delete Uploaded Books' : 'Xoá sách đã tải lên')
      : (lang === 'en' ? 'Remove Books' : 'Xoá khỏi sách đang đọc');
    const alertMsg = isUploadedTab
      ? (lang === 'en'
        ? `Are you sure you want to delete ${selectedIds.length} uploaded book(s)?`
        : `Bạn có chắc muốn xoá ${selectedIds.length} cuốn sách đã tải lên này không?`)
      : (lang === 'en'
        ? `Remove ${selectedIds.length} book(s) from your reading list?`
        : `Bạn có chắc muốn xoá ${selectedIds.length} cuốn sách này khỏi mục Sách đang đọc không?`);

    Alert.alert(
      alertTitle,
      alertMsg,
      [
        { text: lang === 'en' ? 'Cancel' : 'Hủy', style: 'cancel' },
        {
          text: lang === 'en' ? 'Delete' : 'Xoá',
          style: 'destructive',
          onPress: async () => {
            if (isUploadedTab) {
              const updated = uploadedList.filter((b) => !selectedIds.includes(b.id));
              setUploadedList(updated);
              setSelectedIds([]);
              setIsEditing(false);
              await setUserItem(KEY_UPLOADED_BOOKS, JSON.stringify(updated));
            } else {
              const updated = readingList.filter((b) => !selectedIds.includes(b.id));
              setReadingList(updated);
              setSelectedIds([]);
              setIsEditing(false);
              await setUserItem(KEY_READING_BOOKS, JSON.stringify(updated));

              try {
                const currentRaw = await getUserItem(CURRENT_READING_KEY);
                if (currentRaw) {
                  const parsed = JSON.parse(currentRaw);
                  if (selectedIds.includes(parsed.id)) {
                    await removeUserItem(CURRENT_READING_KEY);
                  }
                }
              } catch { }
            }
          },
        },
      ]
    );
  };

  // ============================================================================
  // [GIẢI THÍCH CODE]: Khi nhấn vào 1 cuốn sách bất kỳ:
  // Tự động đẩy cuốn sách vào "Sách đang đọc" và chuyển sang màn hình đọc
  // ============================================================================
  const handleBookPress = async (item: BookshelfItem) => {
    if (isEditing && (activeTab === 'dangdoc' || activeTab === 'tailen')) {
      handleToggleSelectBook(item.id);
      return;
    }

    // Tự động thêm vào Sách đang đọc kèm đầy đủ ảnh bìa (coverUri/coverImage)
    const rawCover = item.coverUri || item.coverImage || item.img_url;
    await addToReadingList({
      ...item,
      coverImage: rawCover,
      coverUri: rawCover,
    });
    loadBookshelfData();

    // Nếu sách đã hết hạn thuê, điều hướng tới chi tiết sách để gia hạn/thuê lại
    const isBookExpired =
      activeTab === 'dathue' ||
      item.expired ||
      (!item.isForever && parseEndTimestamp(item.endDate) !== null && (parseEndTimestamp(item.endDate) ?? 0) <= Date.now());
    if (isBookExpired) {
      navigate('bookDetail', {
        id: item.id,
        title: item.title,
        author: item.author,
        category_name: item.categoryName,
        img_url: item.img_url,
        coverImage: rawCover,
        coverUri: rawCover,
      });
      return;
    }

    const effectiveFileUri = item.fileUri || item.pdf_url;
    if (effectiveFileUri) {
      const bookData: BookData = {
        id: item.id,
        title: item.title,
        author: item.author,
        fileUri: effectiveFileUri,
        isPersonal: item.isPersonal === true || (/^(uploaded|upload|personal)[_-]/i.test(item.id) && /^(file:|content:|blob:|data:)/i.test(effectiveFileUri)),
        coverImage: rawCover,
        coverUri: rawCover,
        chapters: item.chapters,
      };
      await setUserItem(CURRENT_READING_KEY, JSON.stringify(bookData)).catch(() => { });
      navigate('reader', bookData);
    } else {
      navigate('bookDetail', {
        id: item.id,
        title: item.title,
        author: item.author,
        chapter: activeTab === 'dangthue' ? undefined : item.chapter,
        category_name: item.categoryName,
        img_url: item.img_url,
        coverImage: rawCover,
        coverUri: rawCover,
      });
    }
  };

  // Mô tả trạng thái trống theo từng tab
  const getEmptyDesc = () => {
    switch (activeTab) {
      case 'dangdoc':
        return lang === 'en' ? 'You have no books currently being read.' : 'Bạn chưa có cuốn sách nào đang đọc.';
      case 'dangthue':
        return lang === 'en' ? 'You have no active rented books.' : 'Bạn chưa có cuốn sách nào đang thuê.';
      case 'dathue':
        return lang === 'en' ? 'You have no expired rented books.' : 'Bạn chưa có cuốn sách thuê nào đã hết hạn.';
      case 'yeuthich':
        return lang === 'en' ? 'You have no favorite books.' : 'Bạn chưa có cuốn sách yêu thích nào.';
      case 'tailen':
        return lang === 'en' ? 'You have not uploaded any PDF books.' : 'Bạn chưa tải lên cuốn sách nào.';
      case 'duoctang':
        return lang === 'en' ? 'You have not received any gifted books.' : 'Bạn chưa có cuốn sách được tặng nào.';
      default:
        return lang === 'en' ? 'No books found in this section.' : 'Chưa có cuốn sách nào trong mục này.';
    }
  };

  return (
    <SafeAreaView edges={['top']} style={themeStyles.safeArea}>
      <ExpoStatusBar style={isDarkMode ? 'light' : 'dark'} />

      {/* ==================================================================== */}
      {/* HEADER TRÊN CÙNG: Tối giản, thanh lịch chuẩn app đọc sách            */}
      {/* ==================================================================== */}
      <View style={themeStyles.headerBar}>
        {!isEditing ? (
          <>
            <View style={themeStyles.headerTitleBox}>
              <Text style={[themeStyles.headerTitle, { color: foreground }]}>
                {lang === 'en' ? 'Your Bookshelf' : 'Tủ sách của bạn'}
              </Text>
            </View>

            <View style={themeStyles.headerActions}>
              {/* Icon thông báo kèm huy hiệu nổi bật */}
              <TouchableOpacity
                style={[
                  themeStyles.actionButton,
                  themeStyles.notifBellBtn,
                  unreadNotifCount > 0 && themeStyles.notifBellBtnActive,
                ]}
                onPress={() => navigate('notifications')}
                activeOpacity={0.78}
                accessibilityRole="button"
                accessibilityLabel={lang === 'en' ? 'Notifications' : 'Thông báo'}
              >
                <View
                  style={[
                    themeStyles.notifBellHalo,
                    unreadNotifCount > 0 && themeStyles.notifBellHaloActive,
                  ]}
                >
                  <Ionicons
                    name={unreadNotifCount > 0 ? 'notifications' : 'notifications-outline'}
                    size={18}
                    color={
                      unreadNotifCount > 0
                        ? isDarkMode
                          ? '#FBBF24'
                          : '#D97706'
                        : foreground
                    }
                  />
                </View>
                {unreadNotifCount > 0 ? (
                  <View style={themeStyles.noticeBadge}>
                    <Text style={themeStyles.noticeBadgeText}>
                      {unreadNotifCount > 99 ? '99+' : unreadNotifCount}
                    </Text>
                  </View>
                ) : (
                  <View style={themeStyles.noticeIdleDot} />
                )}
              </TouchableOpacity>

              {/* Icon cây bút (hiển thị khi ở tab 'dangdoc' hoặc 'tailen' và danh sách có sách) */}
              {((activeTab === 'dangdoc' && readingList.length > 0) ||
                (activeTab === 'tailen' && uploadedList.length > 0)) && (
                <TouchableOpacity
                  style={themeStyles.actionButton}
                  onPress={() => {
                    setIsEditing(true);
                    setSelectedIds([]);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Chỉnh sửa"
                >
                  <Ionicons name="create-outline" size={20} color={foreground} />
                </TouchableOpacity>
              )}

              {/* Icon tìm kiếm */}
              <TouchableOpacity
                style={themeStyles.actionButton}
                onPress={() => navigate('search')}
                accessibilityRole="button"
                accessibilityLabel={lang === 'en' ? 'Search' : 'Tìm kiếm'}
              >
                <Ionicons name="search-outline" size={20} color={foreground} />
              </TouchableOpacity>

              {/* Icon Avatar tài khoản */}
              <TouchableOpacity
                style={themeStyles.avatar}
                onPress={() => {
                  if (!isLoggedIn) {
                    showLoginAlert(
                      lang === 'en'
                        ? 'Please log in to use profile feature'
                        : 'Bạn phải đăng nhập để dùng chức năng trang cá nhân'
                    );
                    return;
                  }
                  navigateTab('profile');
                }}
                accessibilityRole="button"
                accessibilityLabel={lang === 'en' ? 'Profile' : 'Trang cá nhân'}
              >
                {userAvatarUrl ? (
                  <Image source={{ uri: userAvatarUrl }} style={themeStyles.avatarImage} />
                ) : (
                  <View style={themeStyles.avatarLetterCircle}>
                    <Text style={themeStyles.avatarText}>{userInitial || 'H'}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </>
        ) : (
          // Chế độ chỉnh sửa: "○ Chọn tất cả (X)" + Nút Xoá + Nút X
          <>
            <TouchableOpacity
              style={themeStyles.selectAllRow}
              onPress={handleToggleSelectAll}
              activeOpacity={0.75}
            >
              <Ionicons
                name={isAllSelected ? 'checkmark-circle' : 'ellipse-outline'}
                size={22}
                color={isAllSelected ? '#2F6B5F' : '#6B7280'}
                style={{ marginRight: 8 }}
              />
              <Text style={[themeStyles.selectAllText, { color: foreground }]}>
                {lang === 'en'
                  ? `Select all (${selectedIds.length})`
                  : `Chọn tất cả (${selectedIds.length})`}
              </Text>
            </TouchableOpacity>

            <View style={themeStyles.editActionsRight}>
              {/* Nút Xoá */}
              <TouchableOpacity
                style={[
                  themeStyles.deleteBtn,
                  selectedIds.length === 0 && themeStyles.deleteBtnDisabled,
                ]}
                onPress={handleDeleteSelected}
                disabled={selectedIds.length === 0}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons
                  name="trash-can-outline"
                  size={17}
                  color={selectedIds.length === 0 ? '#9CA3AF' : '#e11d48'}
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={[
                    themeStyles.deleteBtnText,
                    selectedIds.length === 0 && themeStyles.deleteBtnTextDisabled,
                  ]}
                >
                  {lang === 'en' ? 'Delete' : 'Xoá'}
                </Text>
              </TouchableOpacity>

              {/* Nút X (Huỷ về lại bình thường) */}
              <TouchableOpacity
                style={themeStyles.actionButton}
                onPress={() => {
                  setIsEditing(false);
                  setSelectedIds([]);
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="close" size={20} color={foreground} />
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      {/* ==================================================================== */}
      {/* THANH TAB NẰM NGANG (Horizontal ScrollView)                          */}
      {/* ==================================================================== */}
      <View style={themeStyles.tabScrollWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={themeStyles.horizontalTabScroll}
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const iconName = (isActive ? tab.icon : `${tab.icon}-outline`) as keyof typeof Ionicons.glyphMap;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[
                  themeStyles.tabPill,
                  isActive && themeStyles.tabPillActive,
                ]}
                onPress={() => handleTabChange(tab.id)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={iconName}
                  size={14}
                  color={isActive ? '#FFFFFF' : (isDarkMode ? '#9CA3AF' : '#6B7280')}
                  style={{ marginRight: 5 }}
                />
                <Text
                  style={[
                    themeStyles.tabPillText,
                    isActive && themeStyles.tabPillTextActive,
                  ]}
                >
                  {lang === 'en' ? tab.labelEn : tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ==================================================================== */}
      {/* NỘI DUNG CHÍNH: HIỂN THỊ MỘT HÀNG GỒM 3 SÁCH HOẶC TRẠNG THÁI TRỐNG   */}
      {/* ==================================================================== */}
      <ScrollView
        style={themeStyles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={themeStyles.scrollContent}
        onScroll={handleFooterScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefreshBookshelf}
            tintColor={isDarkMode ? '#34D399' : '#2F6B5F'}
          />
        }
      >
        {(activeTab === 'dangthue' || activeTab === 'dathue') && rentedError && currentBooks.length === 0 ? (
          <View style={themeStyles.rentedRetryBanner}>
            <Ionicons
              name="alert-circle-outline"
              size={18}
              color={isDarkMode ? '#FBBF24' : '#B45309'}
            />
            <Text style={themeStyles.rentedRetryText} numberOfLines={2}>
              {rentedError}
            </Text>
            <TouchableOpacity
              style={themeStyles.rentedRetryBtn}
              onPress={handleRefreshBookshelf}
              activeOpacity={0.8}
            >
              <Text style={themeStyles.rentedRetryBtnText}>
                {lang === 'en' ? 'Retry' : 'Thử lại'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {activeTab === 'dathue' && currentBooks.length > 0 && (
          <View style={themeStyles.dathueHeaderBanner}>
            <Ionicons name="information-circle-outline" size={16} color={isDarkMode ? '#9CA3AF' : '#6B7280'} />
            <Text style={themeStyles.dathueHeaderBannerText}>
              {lang === 'en'
                ? 'Books whose rental has ended. Tap any book to view and renew.'
                : 'Danh sách sách đã hết hạn thuê. Chạm vào sách để xem chi tiết và gia hạn thuê tiếp.'}
            </Text>
          </View>
        )}

        {(activeTab === 'dangthue' || activeTab === 'dathue') && isLoadingRented && currentBooks.length === 0 ? (
          <View style={themeStyles.emptyContainer}>
            <ActivityIndicator size="large" color={isDarkMode ? '#34D399' : '#2F6B5F'} />
            <Text style={[themeStyles.emptyDesc, { marginTop: 12 }]}>
              {lang === 'en'
                ? (activeTab === 'dathue' ? 'Loading expired rentals...' : 'Loading rented books...')
                : (activeTab === 'dathue' ? 'Đang tải danh sách sách đã thuê...' : 'Đang tải danh sách sách đang thuê...')}
            </Text>
          </View>
        ) : currentBooks.length === 0 ? (
          <View style={themeStyles.emptyContainer}>
            <View style={themeStyles.emptyIconCircle}>
              <Ionicons
                name={
                  activeTab === 'dangdoc'
                    ? 'book-outline'
                    : activeTab === 'dangthue'
                      ? 'time-outline'
                      : activeTab === 'dathue'
                        ? 'hourglass-outline'
                        : activeTab === 'yeuthich'
                          ? 'heart-outline'
                          : activeTab === 'tailen'
                            ? 'cloud-upload-outline'
                            : 'gift-outline'
                }
                size={32}
                color={isDarkMode ? '#34D399' : '#2F6B5F'}
              />
            </View>
            <Text style={themeStyles.emptyTitle}>
              {lang === 'en' ? 'No books yet' : 'Chưa có sách nào'}
            </Text>
            <Text style={themeStyles.emptyDesc}>{getEmptyDesc()}</Text>

            <TouchableOpacity
              style={themeStyles.emptyBtn}
              onPress={() => navigate(activeTab === 'tailen' ? 'upload' : 'home')}
              activeOpacity={0.85}
            >
              <Ionicons
                name={activeTab === 'tailen' ? 'cloud-upload-outline' : 'compass-outline'}
                size={16}
                color="#FFFFFF"
                style={{ marginRight: 7 }}
              />
              <Text style={themeStyles.emptyBtnText}>
                {activeTab === 'tailen'
                  ? (lang === 'en' ? 'Upload PDF Book' : 'Tải sách ngay')
                  : (lang === 'en' ? 'Explore Books' : 'Khám phá sách ngay')}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={themeStyles.gridContainer}>
            {currentBooks.map((item, index) => {
              const rawCover = item.coverUri || item.coverImage || item.img_url;
              const isDirectUri =
                typeof rawCover === 'string' &&
                /^(?:http:\/\/|https:\/\/|file:\/\/|data:)/i.test(rawCover);
              const coverSource = isDirectUri
                ? { uri: rawCover }
                : getBookCoverSource(item.id, rawCover || undefined);

              const placeholderStyle = getPlaceholderColors(item.title);
              const isSelected = selectedIds.includes(item.id);
              const isCloud = item.isSyncedWithBE || !!item.beBookId;

              // Tính toán thời gian đếm ngược chính xác khi hạn còn <= 1 ngày
              const remainingMs = activeTab === 'dangthue' ? getItemRemainingMs(item, now) : null;
              const isExpiredNow =
                activeTab === 'dangthue' &&
                !item.isForever &&
                (item.expired || (remainingMs !== null && remainingMs <= 0));
              const isUnderOneDay =
                activeTab === 'dangthue' &&
                !item.isForever &&
                !isExpiredNow &&
                remainingMs !== null &&
                remainingMs > 0 &&
                (item.remainingDays === 1 || remainingMs <= 25 * 3600 * 1000);
              const countdownText = isUnderOneDay && remainingMs !== null ? formatCountdown(remainingMs) : null;

              const isExpiringSoon =
                activeTab === 'dangthue' &&
                !item.isForever &&
                (isUnderOneDay || isExpiredNow || (typeof item.remainingDays === 'number' && item.remainingDays <= 2));

              return (
                <TouchableOpacity
                  key={`${item.id}_${item.accessRecordId ?? index}`}
                  style={[themeStyles.bookCard, activeTab === 'dathue' && { opacity: 0.88 }]}
                  activeOpacity={0.85}
                  onPress={() => handleBookPress(item)}
                >
                  {/* Bìa sách */}
                  <View style={themeStyles.bookCover}>
                    {/* Bìa tối giản tinh tế khi chưa có ảnh bìa */}
                    <View
                      style={[
                        themeStyles.fallbackCover,
                        {
                          backgroundColor: placeholderStyle.bg,
                          borderColor: placeholderStyle.border,
                        },
                      ]}
                    >
                      <View
                        style={[
                          themeStyles.fallbackSpine,
                          { backgroundColor: placeholderStyle.spine },
                        ]}
                      />
                      <Ionicons
                        name="book-outline"
                        size={20}
                        color={placeholderStyle.text}
                        style={{ opacity: 0.72 }}
                      />
                      <Text
                        style={[themeStyles.fallbackCoverText, { color: placeholderStyle.text }]}
                        numberOfLines={3}
                      >
                        {item.title}
                      </Text>
                    </View>

                    {/* Ảnh bìa thật nếu có sẽ phủ lên trên */}
                    {coverSource ? (
                      <Image
                        source={coverSource}
                        style={StyleSheet.absoluteFill}
                        resizeMode="cover"
                      />
                    ) : null}

                    {/* Huy hiệu thời hạn thuê trên tab Đang thuê */}
                    {activeTab === 'dangthue' && (
                      <View
                        style={[
                          themeStyles.rentalBadge,
                          item.isForever
                            ? themeStyles.rentalBadgeForever
                            : isExpiredNow
                              ? themeStyles.rentalBadgeExpired
                              : countdownText || isExpiringSoon
                                ? themeStyles.rentalBadgeWarning
                                : themeStyles.rentalBadgeActive,
                        ]}
                      >
                        <Ionicons
                          name={item.isForever ? 'infinite' : 'time-outline'}
                          size={10}
                          color="#ffffff"
                        />
                        <Text style={themeStyles.rentalBadgeText} numberOfLines={1}>
                          {item.isForever
                            ? (lang === 'en' ? 'Forever' : 'Vĩnh viễn')
                            : isExpiredNow
                              ? (lang === 'en' ? 'Expired' : 'Hết hạn')
                              : countdownText
                                ? countdownText
                                : (lang === 'en'
                                    ? `${Math.max(1, item.remainingDays || 1)}d`
                                    : `${Math.max(1, item.remainingDays || 1)} ngày`)}
                        </Text>
                      </View>
                    )}

                    {/* Huy hiệu Hết hạn trên tab Sách đã thuê */}
                    {activeTab === 'dathue' && (
                      <View style={[themeStyles.rentalBadge, themeStyles.rentalBadgeExpired]}>
                        <Ionicons name="time-outline" size={10} color="#ffffff" />
                        <Text style={themeStyles.rentalBadgeText} numberOfLines={1}>
                          {lang === 'en' ? 'Expired' : 'Hết hạn'}
                        </Text>
                      </View>
                    )}

                    {/* Huy hiệu Đã đồng bộ Cloud khi ở tab Tải lên */}
                    {activeTab === 'tailen' && isCloud && (
                      <View style={themeStyles.cloudSyncBadge}>
                        <Ionicons name="cloud-done-outline" size={10} color="#ffffff" />
                        <Text style={themeStyles.cloudSyncBadgeText}>Cloud</Text>
                      </View>
                    )}

                    {/* Dấu tích tròn khi ở chế độ chỉnh sửa (sách đang đọc hoặc sách tải lên) */}
                    {isEditing && (activeTab === 'dangdoc' || activeTab === 'tailen') && (
                      <View style={themeStyles.bookCheckBadge}>
                        <Ionicons
                          name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                          size={22}
                          color={isSelected ? '#2F6B5F' : '#ffffff'}
                          style={themeStyles.checkIconShadow}
                        />
                      </View>
                    )}
                  </View>

                  {/* Dưới là tên sách & thông tin phụ thanh lịch */}
                  <Text style={themeStyles.bookTitle} numberOfLines={2} ellipsizeMode="tail">
                    {item.title}
                  </Text>
                  {activeTab === 'dathue' ? (
                    <Text style={themeStyles.rentalDurationSubWarn} numberOfLines={1}>
                      {lang === 'en' ? 'Tap to renew' : 'Chạm để gia hạn'}
                    </Text>
                  ) : activeTab === 'dangthue' ? (
                    <Text
                      style={[
                        themeStyles.rentalDurationSub,
                        (countdownText || isExpiringSoon || isExpiredNow) && themeStyles.rentalDurationSubWarn,
                      ]}
                      numberOfLines={1}
                    >
                      {isExpiredNow
                        ? (lang === 'en' ? 'Expired rental' : 'Hết hạn thuê')
                        : countdownText
                          ? (lang === 'en' ? `${countdownText} left` : `Còn ${countdownText}`)
                          : item.chapter || (lang === 'en' ? `${Math.max(1, item.remainingDays || 1)}d left` : `Còn ${Math.max(1, item.remainingDays || 1)} ngày`)}
                    </Text>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },

  // ============================================================================
  // HEADER TRÊN CÙNG (Tối giản, thanh lịch chuẩn app đọc sách)
  // ============================================================================
  headerBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
  },
  headerTitleBox: {
    flex: 1,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F4F5F7',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notice: {
    position: 'absolute',
    right: 7,
    top: 7,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#E11D48',
  },
  notifBellBtn: {
    borderRadius: 12,
    position: 'relative',
  },
  notifBellBtnActive: {
    backgroundColor: '#FFF9EB',
    borderColor: '#F59E0B',
  },
  notifBellHalo: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(47, 107, 95, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBellHaloActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.16)',
  },
  noticeBadge: {
    position: 'absolute',
    right: -5,
    top: -5,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: '#EF4444',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noticeBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  noticeIdleDot: {
    position: 'absolute',
    top: 6,
    right: 7,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#2F6B5F',
    opacity: 0.7,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#F4F5F7',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarLetterCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2F6B5F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  // Header khi ở Chế độ Chỉnh sửa (Edit Mode)
  selectAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  selectAllText: {
    fontSize: 15,
    fontWeight: '700',
  },
  editActionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bookCheckBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    zIndex: 10,
  },
  cloudSyncBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    zIndex: 9,
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  cloudSyncBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '600',
  },
  rentalBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    zIndex: 9,
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  rentalBadgeActive: {
    backgroundColor: 'rgba(15, 118, 110, 0.88)',
  },
  rentalBadgeForever: {
    backgroundColor: 'rgba(30, 41, 59, 0.88)',
  },
  rentalBadgeWarning: {
    backgroundColor: 'rgba(190, 18, 60, 0.90)',
  },
  rentalBadgeExpired: {
    backgroundColor: 'rgba(71, 85, 105, 0.88)',
  },
  rentalBadgeText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '600',
  },
  rentalDurationSub: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0F766E',
    textAlign: 'left',
    marginTop: 2,
  },
  rentalDurationSubWarn: {
    fontSize: 11,
    fontWeight: '600',
    color: '#DC2626',
    textAlign: 'left',
    marginTop: 2,
  },
  rentedRetryBanner: {
    marginHorizontal: HORIZONTAL_PADDING,
    marginBottom: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  rentedRetryText: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '500',
    color: '#374151',
  },
  rentedRetryBtn: {
    backgroundColor: '#2F6B5F',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  rentedRetryBtnText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '600',
  },
  expiredNoticeBanner: {
    marginHorizontal: HORIZONTAL_PADDING,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  expiredNoticeIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  expiredNoticeText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#991B1B',
  },
  expiredNoticeLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  expiredNoticeLinkText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#2F6B5F',
  },
  dathueHeaderBanner: {
    marginHorizontal: HORIZONTAL_PADDING,
    marginBottom: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dathueHeaderBannerText: {
    flex: 1,
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 16,
  },
  expiredSection: {
    marginTop: 14,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  expiredSectionTitle: {
    paddingHorizontal: HORIZONTAL_PADDING,
    marginBottom: 12,
    fontSize: 13.5,
    fontWeight: '700',
    color: '#6B7280',
  },
  checkIconShadow: {
    textShadowColor: 'rgba(0, 0, 0, 0.55)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginRight: 4,
  },
  deleteBtnDisabled: {
    backgroundColor: '#F4F5F7',
    borderColor: '#E5E7EB',
  },
  deleteBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#E11D48',
  },
  deleteBtnTextDisabled: {
    color: '#9CA3AF',
  },

  // ============================================================================
  // THANH TAB CUỘN NGANG (Tinh gọn chuẩn app đọc sách)
  // ============================================================================
  tabScrollWrapper: {
    backgroundColor: '#FFFFFF',
    paddingTop: 6,
    paddingBottom: 8,
  },
  horizontalTabScroll: {
    paddingHorizontal: HORIZONTAL_PADDING,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 12,
    backgroundColor: '#F4F5F7',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 8,
  },
  tabPillActive: {
    backgroundColor: '#2F6B5F',
    borderColor: '#2F6B5F',
  },
  tabPillText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#374151',
  },
  tabPillTextActive: {
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // ============================================================================
  // LƯỚI 1 HÀNG GỒM 3 SÁCH
  // ============================================================================
  scrollContainer: { flex: 1 },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 24,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: HORIZONTAL_PADDING,
    columnGap: GAP,
    rowGap: 8,
  },
  bookCard: {
    width: ITEM_WIDTH,
    marginBottom: 4,
  },
  bookCover: {
    width: ITEM_WIDTH,
    height: COVER_HEIGHT,
    borderRadius: 8,
    backgroundColor: '#F4F5F7',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  fallbackCover: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  fallbackSpine: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    opacity: 0.85,
  },
  fallbackCoverText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 14,
  },
  bookTitle: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#111827',
    marginTop: 7,
    textAlign: 'left',
    lineHeight: 17,
    minHeight: 34,
  },
  bookAuthor: {
    fontSize: 11,
    fontWeight: '400',
    color: '#6B7280',
    marginTop: 2,
    textAlign: 'left',
  },

  // ============================================================================
  // TRẠNG THÁI TRỐNG (CHƯA CÓ SÁCH NÀO)
  // ============================================================================
  emptyContainer: {
    paddingVertical: 72,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F4F5F7',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: 13.5,
    fontWeight: '400',
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
  emptyBtn: {
    marginTop: 22,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2F6B5F',
    paddingVertical: 11,
    paddingHorizontal: 22,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  emptyBtnText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
