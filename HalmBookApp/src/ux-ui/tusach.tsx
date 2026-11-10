import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { getBookCoverSource, API_BASE_URL } from './bookCovers';
import { BookData, useAppNavigation, useAppThemeStyles } from './navigation';
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
import {
  fetchBackendUploadedBooks,
  mergeUploadedBooks,
} from './uploadBookService';

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

export type BookshelfTab = 'dangdoc' | 'dangthue' | 'yeuthich' | 'tailen' | 'duoctang';

interface TabConfig {
  id: BookshelfTab;
  label: string;
  labelEn: string;
  icon: keyof typeof Ionicons.glyphMap;
}

// 5 Tab nằm ngang với các icon sắc nét, bắt mắt
const TABS: TabConfig[] = [
  { id: 'dangdoc', label: 'Sách đang đọc', labelEn: 'Reading', icon: 'book' },
  { id: 'dangthue', label: 'Đang thuê', labelEn: 'Renting', icon: 'time' },
  { id: 'yeuthich', label: 'Yêu thích', labelEn: 'Favorites', icon: 'heart' },
  { id: 'tailen', label: 'Tải lên', labelEn: 'Uploaded', icon: 'cloud-upload' },
  { id: 'duoctang', label: 'Được tặng', labelEn: 'Gifted', icon: 'gift' },
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
  fileUri?: string;
  pdf_url?: string;
  beBookId?: string;
  isSyncedWithBE?: boolean;
  chapters?: any[];
}

// Bảng màu nền bìa đồng bộ hoàn toàn với uploadfile.tsx cho các sách tải lên
const getPlaceholderColors = (title: string) => {
  if (title.includes('HalmBook1')) return { bg: '#e0f2fe', text: '#0284c7', border: '#bae6fd' };
  if (title.includes('HalmBook2')) return { bg: '#fef3c7', text: '#d97706', border: '#fde68a' };
  if (title.includes('HalmBook3')) return { bg: '#fce7f3', text: '#db2777', border: '#fbcfe8' };
  if (title.includes('HalmBook4')) return { bg: '#dcfce7', text: '#15803d', border: '#bbf7d0' };
  return { bg: '#ede9fe', text: '#7c3aed', border: '#ddd6fe' };
};

export default function TuSach() {
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

  const foreground = isDarkMode ? '#F5F1E8' : '#11131A';

  const [activeTab, setActiveTab] = useState<BookshelfTab>('dangdoc');

  // Chế độ chỉnh sửa xoá sách đang đọc
  const [isEditing, setIsEditing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Mặc định là mảng rỗng, chỉ hiển thị sách thật của người dùng
  const [readingList, setReadingList] = useState<BookshelfItem[]>([]);
  const [rentedList, setRentedList] = useState<BookshelfItem[]>([]);
  const [favoritesList, setFavoritesList] = useState<BookshelfItem[]>([]);
  const [uploadedList, setUploadedList] = useState<BookshelfItem[]>([]);
  const [giftedList, setGiftedList] = useState<BookshelfItem[]>([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

  useEffect(() => {
    getUnreadNotificationCount().then(setUnreadNotifCount).catch(() => {});
  }, [activeTab]);

  // ============================================================================
  // [GIẢI THÍCH CODE]: Nạp dữ liệu sách thực tế từ AsyncStorage theo tài khoản
  // Tối ưu hóa: Chạy song song Promise.all để giảm thời gian chờ gấp 4 lần
  // ============================================================================
  const loadBookshelfData = useCallback(async () => {
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

      // 5. Đồng bộ từ Backend: GET /api/home/bookshelf (đang thuê) & GET /api/home/favorites (yêu thích)
      if (token) {
        try {
          const [bookshelfRes, favoritesRes] = await Promise.all([
            axios.get(`${API_BASE_URL}/api/home/bookshelf`, {
              headers: { Authorization: `Bearer ${token}` },
              timeout: 4000,
            }).catch(() => null),
            axios.get(`${API_BASE_URL}/api/home/favorites`, {
              headers: { Authorization: `Bearer ${token}` },
              timeout: 4000,
            }).catch(() => null),
          ]);

          if (bookshelfRes && Array.isArray(bookshelfRes.data)) {
            const mappedRented: BookshelfItem[] = bookshelfRes.data
              .filter((item: any) => item.status === 'ACTIVE' || item.isForever || (item.remainingDays && item.remainingDays > 0))
              .map((item: any) => ({
                id: String(item.bookId),
                title: item.bookName || item.title || 'Sách HALM BOOK',
                author: item.author || 'Tác giả',
                chapter: item.isForever || item.remainingDays > 1000 ? 'Sở hữu vĩnh viễn' : `Còn ${item.remainingDays} ngày`,
                img_url: item.imgUrl || '',
                coverImage: item.imgUrl || '',
              }));
            setRentedList(mappedRented);
          } else {
            setRentedList([]);
          }

          if (favoritesRes && Array.isArray(favoritesRes.data)) {
            const mappedFavs: BookshelfItem[] = favoritesRes.data.map((item: any) => ({
              id: String(item.bookId || item.id),
              title: item.title || item.bookName || 'Sách yêu thích',
              author: item.author || 'Tác giả',
              chapter: item.categoryName || 'Yêu thích',
              img_url: item.imgUrl || item.img || '',
              coverImage: item.imgUrl || item.img || '',
            }));
            currentFavs = mappedFavs;
            await setUserItem(KEY_FAVORITES_BOOKS, JSON.stringify(mappedFavs));
          }
        } catch {
          setRentedList([]);
        }
      } else {
        setRentedList([]);
      }

      setFavoritesList(currentFavs);
    } catch {
      // Giữ danh sách rỗng nếu có lỗi
      setReadingList([]);
      setUploadedList([]);
      setFavoritesList([]);
      setRentedList([]);
      setGiftedList([]);
    }
  }, []);

  useEffect(() => {
    loadBookshelfData();
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

    const effectiveFileUri = item.fileUri || item.pdf_url;
    if (effectiveFileUri) {
      const bookData: BookData = {
        id: item.id,
        title: item.title,
        author: item.author,
        fileUri: effectiveFileUri,
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
        chapter: item.chapter,
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
        return lang === 'en' ? 'You have no rented books.' : 'Bạn chưa thuê cuốn sách nào.';
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
      {/* HEADER TRÊN CÙNG: Giữ phong cách icon đẹp, thanh lịch gốc            */}
      {/* Bao gồm: Chuông thông báo, Cây bút (khi ở đang đọc), Tìm kiếm, Avatar */}
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
              {/* Icon thông báo kèm chấm đỏ (khôi phục đúng icon cũ chuẩn đẹp) */}
              <TouchableOpacity
                style={themeStyles.actionButton}
                onPress={() => navigate('notifications')}
                accessibilityRole="button"
                accessibilityLabel={lang === 'en' ? 'Notifications' : 'Thông báo'}
              >
                <MaterialCommunityIcons name="bell-outline" size={23} color={foreground} />
                {unreadNotifCount > 0 && <View style={themeStyles.notice} />}
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
                  <Ionicons name="create-outline" size={22} color={foreground} />
                </TouchableOpacity>
              )}

              {/* Icon tìm kiếm */}
              <TouchableOpacity
                style={themeStyles.actionButton}
                onPress={() => navigate('search')}
                accessibilityRole="button"
                accessibilityLabel={lang === 'en' ? 'Search' : 'Tìm kiếm'}
              >
                <Ionicons name="search-outline" size={23} color={foreground} />
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
                color={isAllSelected ? '#2c3a7a' : '#64748b'}
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
                  size={18}
                  color={selectedIds.length === 0 ? '#94a3b8' : '#e11d48'}
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
                <Ionicons name="close" size={24} color={foreground} />
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      {/* ==================================================================== */}
      {/* THANH TAB NẰM NGANG VÀ LƯỚT QUA (Horizontal ScrollView)              */}
      {/* Không hiển thị số, viền bo tròn đổ bóng đầy đủ không bị cắt mép      */}
      {/* ==================================================================== */}
      <View style={themeStyles.tabScrollWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={themeStyles.horizontalTabScroll}
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
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
                  name={tab.icon}
                  size={16}
                  color={isActive ? '#1a1a1a' : '#64748b'}
                  style={{ marginRight: 6 }}
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
      >
        {currentBooks.length === 0 ? (
          <View style={themeStyles.emptyContainer}>
            <View style={themeStyles.emptyIconCircle}>
              <Ionicons
                name={
                  activeTab === 'dangdoc'
                    ? 'book'
                    : activeTab === 'dangthue'
                      ? 'time'
                      : activeTab === 'yeuthich'
                        ? 'heart'
                        : activeTab === 'tailen'
                          ? 'cloud-upload'
                          : 'gift'
                }
                size={36}
                color="#1a1a1a"
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
                color="#1a1a1a"
                style={{ marginRight: 6 }}
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
            {currentBooks.map((item) => {
              const rawCover = item.coverUri || item.coverImage || item.img_url;
              const coverSource = rawCover
                ? { uri: rawCover }
                : getBookCoverSource(item.id, item.img_url);

              const placeholderStyle = getPlaceholderColors(item.title);
              const isSelected = selectedIds.includes(item.id);
              const isCloud = item.isSyncedWithBE || !!item.beBookId;

              return (
                <TouchableOpacity
                  key={item.id}
                  style={themeStyles.bookCard}
                  activeOpacity={0.85}
                  onPress={() => handleBookPress(item)}
                >
                  {/* Bìa sách */}
                  <View style={themeStyles.bookCover}>
                    {/* Bìa mặc định tao nhã đồng bộ hoàn toàn với uploadfile.tsx */}
                    <View
                      style={[
                        themeStyles.fallbackCover,
                        {
                          backgroundColor: placeholderStyle.bg,
                          borderColor: placeholderStyle.border,
                        },
                      ]}
                    >
                      <Text style={{ fontSize: 24 }}>📖</Text>
                      <Text
                        style={[themeStyles.fallbackCoverText, { color: placeholderStyle.text }]}
                        numberOfLines={2}
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

                    {/* Huy hiệu Đã đồng bộ Cloud khi ở tab Tải lên */}
                    {activeTab === 'tailen' && isCloud && (
                      <View style={themeStyles.cloudSyncBadge}>
                        <Ionicons name="cloud-done" size={10} color="#ffffff" />
                        <Text style={themeStyles.cloudSyncBadgeText}>Cloud</Text>
                      </View>
                    )}

                    {/* Dấu tích tròn khi ở chế độ chỉnh sửa (sách đang đọc hoặc sách tải lên) */}
                    {isEditing && (activeTab === 'dangdoc' || activeTab === 'tailen') && (
                      <View style={themeStyles.bookCheckBadge}>
                        <Ionicons
                          name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                          size={24}
                          color={isSelected ? '#27ae60' : '#ffffff'}
                          style={themeStyles.checkIconShadow}
                        />
                      </View>
                    )}
                  </View>

                  {/* Dưới là tên sách */}
                  <Text style={themeStyles.bookTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fcf3e8' },

  // ============================================================================
  // HEADER TRÊN CÙNG (Thanh lịch & tinh tế giống header gốc)
  // ============================================================================
  headerBar: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(120, 120, 130, 0.16)',
  },
  headerTitleBox: {
    flex: 1,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notice: {
    position: 'absolute',
    right: 5,
    top: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF4E55',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#9147DF',
    backgroundColor: '#F2E8FF',
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
    backgroundColor: '#2c3a7a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
  },

  // Header khi ở Chế độ Chỉnh sửa (Edit Mode)
  selectAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  selectAllText: {
    fontSize: 15,
    fontWeight: '900',
  },
  editActionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
    backgroundColor: 'rgba(37, 99, 235, 0.92)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 3,
  },
  cloudSyncBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },
  checkIconShadow: {
    textShadowColor: 'rgba(0, 0, 0, 0.65)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffe4e6',
    borderWidth: 1.5,
    borderColor: '#e11d48',
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginRight: 6,
  },
  deleteBtnDisabled: {
    backgroundColor: '#f1f5f9',
    borderColor: '#cbd5e1',
  },
  deleteBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#e11d48',
  },
  deleteBtnTextDisabled: {
    color: '#94a3b8',
  },

  // ============================================================================
  // THANH TAB CUỘN NGANG
  // ============================================================================
  tabScrollWrapper: {
    backgroundColor: 'transparent',
    paddingTop: 8,
    paddingBottom: 2,
  },
  horizontalTabScroll: {
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: 4,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#1a1a1a',
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 2.5, height: 2.5 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  tabPillActive: {
    backgroundColor: '#ffde59',
    borderColor: '#1a1a1a',
    shadowOffset: { width: 3, height: 3 },
  },
  tabPillText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#334155',
  },
  tabPillTextActive: {
    fontWeight: '900',
    color: '#1a1a1a',
  },

  // ============================================================================
  // LƯỚI 1 HÀNG GỒM 3 SÁCH
  // ============================================================================
  scrollContainer: { flex: 1 },
  scrollContent: {
    paddingTop: 6,
    paddingBottom: 20,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: HORIZONTAL_PADDING,
    gap: GAP,
  },
  bookCard: {
    width: ITEM_WIDTH,
    marginBottom: 16,
  },
  bookCover: {
    width: ITEM_WIDTH,
    height: COVER_HEIGHT,
    borderRadius: 8,
    backgroundColor: '#e2e8f0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 3,
  },
  fallbackCover: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  fallbackCoverText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1a1a1a',
    textAlign: 'center',
    marginTop: 4,
  },
  bookTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1a1a1a',
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 16,
  },

  // ============================================================================
  // TRẠNG THÁI TRỐNG (CHƯA CÓ SÁCH NÀO)
  // ============================================================================
  emptyContainer: {
    paddingVertical: 60,
    paddingHorizontal: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#ffde59',
    borderWidth: 2,
    borderColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  emptyBtn: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffde59',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#1a1a1a',
    shadowColor: '#000',
    shadowOffset: { width: 2.5, height: 2.5 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  emptyBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#1a1a1a',
  },
});
