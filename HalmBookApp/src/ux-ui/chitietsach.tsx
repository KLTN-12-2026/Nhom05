import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ArrowLeft,
  Bookmark,
  BookOpen,
  ChevronRight,
  Clock,
  Eye,
  Heart,
  Play,
  Quote,
  Star as StarIcon,
} from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getBookChapterLabel, getBookRealChapters } from './bookContentService';
import { getBookCoverSource } from './bookCovers';
import CosmicBackground from './CosmicBackground';
import { checkBookIsFavorite, toggleFavoriteBook } from './favoriteService';
import { useAppNavigation } from './navigation';
import { addNotification } from './notificationService';
import {
  addToCartApi,
  BookAccessDetail,
  calculateDynamicKhoai,
  checkBookAccessDetailApi,
  checkoutBooksApi,
  fetchBookDetailFromApi,
  fetchWalletBalanceApi,
  isPersonalOrLocalBook,
  RENTAL_DURATION_OPTIONS,
  RentalDurationDays,
  resolveBaseKhoaiForBook,
} from './rentalService';
import {
  getCurrentUsername,
  getUserItem,
  KEY_GIFTED_BOOKS,
  KEY_POTATO_BALANCE,
  lookupUserInDirectory,
  setUserItem,
  UserDirectoryEntry
} from './userStorage';

const { width, height } = Dimensions.get('window');

// MÀU SẮC THƯƠNG HIỆU ĐỒNG BỘ TRANG CHỦ APP
const BRAND = {
  primary: '#9A8BC2',
  secondary: '#D8B36A',
};

// -------------------------------------------------------------

interface BookDetailProps {
  book: {
    id: string;
    title: string;
    img_url?: string;
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
    price?: number;
    rent_price?: number;
    description?: string;
    category_name?: string;
    isPersonal?: boolean;
    fileUri?: string;
    pdf_url?: string;
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

// Lấy thể loại thật của sách (không dùng dữ liệu ảo)
const getStandardCategory = (book: any): string => {
  return book?.category_name || book?.tag || 'Chưa phân loại';
};

// Lấy tác giả thật của sách (không dùng dữ liệu ảo)
const getBookAuthor = (book: any): string => {
  return book?.author || 'Chưa cập nhật';
};

// Giới thiệu sách thật từ Database (không dùng dữ liệu ảo)
const getBookShortIntro = (book: any): string => {
  return book?.summary || book?.desc || book?.description || '';
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
  const { isDarkMode, setFooterVisible, lang, isLoggedIn, showLoginAlert, navigate, navigateTab } = useAppNavigation();
  const themeStyles = useMemo(() => getThemedStyles(isDarkMode), [isDarkMode]);
  const [isLiked, setIsLiked] = useState(false);
  const [savedChapter, setSavedChapter] = useState<{ chapterNum: number; title: string } | null>(null);
  const [showAllChapters, setShowAllChapters] = useState(false);
  const scrollOffset = useRef(0);

  // Quản lý Thuê sách & Quyền đọc từ Backend
  const isPersonalBook = useMemo(() => isPersonalOrLocalBook(book), [book]);
  const [dbBookDetail, setDbBookDetail] = useState<any | null>(null);
  const [accessDetail, setAccessDetail] = useState<BookAccessDetail>({
    hasAccess: false,
    currentPage: 1,
    readingPercentage: 0,
    remainingDays: 0,
    isForever: false,
    status: 'NONE',
    checkedFromServer: false,
  });
  const [isLoadingAccess, setIsLoadingAccess] = useState(false);
  const [isRentModalVisible, setIsRentModalVisible] = useState(false);
  const [selectedRentalDays, setSelectedRentalDays] = useState<RentalDurationDays>(7);
  const [isProcessingRent, setIsProcessingRent] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  // Quản lý Modal 1 (Nhập ID người nhận) & Modal 2 (Màn tặng sách cho bạn bè)
  const [isIdPromptVisible, setIsIdPromptVisible] = useState(false);
  const [recipientInputId, setRecipientInputId] = useState('');
  const [idErrorMsg, setIdErrorMsg] = useState('');
  const [isCheckingId, setIsCheckingId] = useState(false);

  const [isGiftModalVisible, setIsGiftModalVisible] = useState(false);
  const [verifiedRecipient, setVerifiedRecipient] = useState<UserDirectoryEntry | null>(null);
  const [giftMessage, setGiftMessage] = useState('');
  const [isSendingGift, setIsSendingGift] = useState(false);
  const [potatoBalance, setPotatoBalance] = useState<number>(100);

  // Đọc số dư khoai lưu trữ & đồng bộ từ ví Backend
  const loadPotatoBalance = async () => {
    try {
      const liveBal = await fetchWalletBalanceApi();
      if (liveBal !== null) {
        setPotatoBalance(liveBal);
        return;
      }
      const raw = await getUserItem(KEY_POTATO_BALANCE);
      if (raw) {
        setPotatoBalance(Number(raw) || 0);
      } else {
        setPotatoBalance(100);
      }
    } catch { }
  };

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

  const categoryName = useMemo(() => getStandardCategory(book), [book]);
  const authorName = useMemo(() => getBookAuthor(book), [book]);
  const shortIntro = useMemo(() => getBookShortIntro(book), [book]);
  const featuredQuote = useMemo(() => getFeaturedQuote(book), [book]);
  const chapters = useMemo(() => getBookChapters(book), [book]);
  const chapterDisplay = useMemo(() => getBookChapterDisplay(book, chapters), [book, chapters]);

  const effectiveRawPrice = dbBookDetail?.rent_price ?? dbBookDetail?.price ?? (book as any).rent_price ?? (book as any).price;
  const baseKhoai = useMemo(
    () => resolveBaseKhoaiForBook(String(book.id), effectiveRawPrice),
    [book.id, effectiveRawPrice]
  );
  const dynamicRentalCost = useMemo(
    () => calculateDynamicKhoai(baseKhoai, selectedRentalDays),
    [baseKhoai, selectedRentalDays]
  );
  const isTrialRestricted =
    !isPersonalBook &&
    accessDetail.checkedFromServer &&
    !accessDetail.hasAccess &&
    chapters.length > 1;

  // Đồng bộ trạng thái yêu thích từ Backend MySQL & Cache Local
  useEffect(() => {
    let isMounted = true;
    checkBookIsFavorite(String(book.id)).then((fav) => {
      if (isMounted) {
        setIsLiked(fav);
      }
    }).catch(() => { });
    return () => {
      isMounted = false;
    };
  }, [book.id]);

  // Đồng bộ chi tiết sách từ DB & trạng thái Đang thuê
  useEffect(() => {
    let isMounted = true;
    const bookIdStr = String(book.id);
    if (isPersonalBook) {
      setDbBookDetail(null);
      setAccessDetail({
        hasAccess: true,
        currentPage: 1,
        readingPercentage: 0,
        remainingDays: 0,
        isForever: true,
        status: 'PERSONAL',
        checkedFromServer: false,
      });
      return;
    }

    setIsLoadingAccess(true);
    Promise.all([
      fetchBookDetailFromApi(bookIdStr),
      checkBookAccessDetailApi(bookIdStr),
      isLoggedIn ? fetchWalletBalanceApi() : Promise.resolve(null),
    ])
      .then(([detail, access, walletBal]) => {
        if (!isMounted) return;
        if (detail) setDbBookDetail(detail);
        setAccessDetail(access);
        if (typeof walletBal === 'number') setPotatoBalance(walletBal);
        if (access.hasAccess && access.currentPage > 1) {
          setSavedChapter((prev) =>
            prev ?? {
              chapterNum: access.currentPage,
              title: lang === 'en' ? `Continue Ch.${access.currentPage}` : `Đọc tiếp Chương ${access.currentPage}`,
            }
          );
        }
      })
      .catch(() => { })
      .finally(() => {
        if (isMounted) setIsLoadingAccess(false);
      });

    return () => {
      isMounted = false;
    };
  }, [book.id, isLoggedIn, isPersonalBook, lang]);

  const ensureVerifiedCatalogBook = async (): Promise<boolean> => {
    if (isPersonalBook) return false;
    if (dbBookDetail) return true;
    const detail = await fetchBookDetailFromApi(String(book.id));
    if (detail) {
      setDbBookDetail(detail);
      return true;
    }
    Alert.alert(
      lang === 'en' ? 'Book Not Available for Rent' : 'Chưa hỗ trợ thuê',
      lang === 'en'
        ? 'This title is an offline/suggested preview and is not registered in the online catalog yet.'
        : 'Cuốn sách này hiện là bản gợi ý/ngoại tuyến và chưa có trong danh mục cho thuê trên hệ thống.'
    );
    return false;
  };

  const openRentModal = async () => {
    if (!isLoggedIn) {
      showLoginAlert(
        lang === 'en'
          ? 'Please log in to rent and sync books to your Bookshelf!'
          : 'Bạn phải đăng nhập để thuê sách và đồng bộ vào Tủ sách!'
      );
      return;
    }
    const ok = await ensureVerifiedCatalogBook();
    if (!ok) return;
    const liveBal = await fetchWalletBalanceApi();
    if (liveBal !== null) setPotatoBalance(liveBal);
    setSelectedRentalDays(7);
    setIsRentModalVisible(true);
  };

  const handleQuickAddToCart = async () => {
    if (!isLoggedIn) {
      showLoginAlert(
        lang === 'en'
          ? 'Please log in to add books to your Cart!'
          : 'Bạn phải đăng nhập để thêm sách vào Giỏ hàng!'
      );
      return;
    }
    const ok = await ensureVerifiedCatalogBook();
    if (!ok) return;

    setIsAddingToCart(true);
    try {
      const res = await addToCartApi(String(book.id), selectedRentalDays, effectiveRawPrice);
      if (res.requireLogin) {
        showLoginAlert(res.message);
        return;
      }
      if (!res.success) {
        Alert.alert(lang === 'en' ? 'Notice' : 'Thông báo', res.message);
        return;
      }
      Alert.alert(
        lang === 'en' ? 'Added to Cart' : 'Đã thêm vào Giỏ hàng',
        lang === 'en'
          ? `"${book.title}" (${selectedRentalDays} days) has been added to your cart.`
          : `Đã thêm "${book.title}" (gói ${selectedRentalDays} ngày) vào Giỏ hàng của bạn.`,
        [
          { text: lang === 'en' ? 'Stay' : 'Ở lại', style: 'cancel' },
          { text: lang === 'en' ? 'View Cart' : 'Xem Giỏ hàng', onPress: () => navigate('cart') },
        ]
      );
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleConfirmRent = async () => {
    if (!isLoggedIn) {
      setIsRentModalVisible(false);
      showLoginAlert(
        lang === 'en' ? 'Please log in to rent books!' : 'Bạn phải đăng nhập để thuê sách!'
      );
      return;
    }
    if (isProcessingRent) return;

    if (potatoBalance < dynamicRentalCost) {
      Alert.alert(
        lang === 'en' ? 'Insufficient Balance' : 'Số dư Khoai không đủ',
        lang === 'en'
          ? `You need ${dynamicRentalCost} Khoai (current balance: ${potatoBalance} Khoai). Top up now?`
          : `Bạn cần ${dynamicRentalCost} Khoai để thuê gói ${selectedRentalDays} ngày (số dư hiện tại: ${potatoBalance} Khoai).`,
        [
          { text: lang === 'en' ? 'Close' : 'Đóng', style: 'cancel' },
          {
            text: lang === 'en' ? 'Top Up' : 'Nạp Khoai',
            onPress: () => {
              setIsRentModalVisible(false);
              navigateTab('offers');
            },
          },
        ]
      );
      return;
    }

    setIsProcessingRent(true);
    try {
      const res = await checkoutBooksApi([
        {
          bookId: String(book.id),
          durationDays: selectedRentalDays,
          price: dynamicRentalCost,
        },
      ]);
      if (res.requireLogin) {
        setIsRentModalVisible(false);
        showLoginAlert(res.message);
        return;
      }
      if (!res.success) {
        Alert.alert(lang === 'en' ? 'Rental Failed' : 'Không thể thuê sách', res.message);
        return;
      }

      if (typeof res.remainingPotatoBalance === 'number') {
        setPotatoBalance(res.remainingPotatoBalance);
      } else {
        const refreshedBal = await fetchWalletBalanceApi();
        if (refreshedBal !== null) setPotatoBalance(refreshedBal);
      }

      const freshAccess = await checkBookAccessDetailApi(String(book.id));
      setAccessDetail(freshAccess);
      setIsRentModalVisible(false);

      Alert.alert(
        lang === 'en' ? 'Rental Successful!' : 'Thuê sách thành công!',
        `${res.message}\n\n• ${lang === 'en' ? 'Plan' : 'Gói thuê'}: ${selectedRentalDays} ${lang === 'en' ? 'days' : 'ngày'}\n• ${lang === 'en' ? 'Paid' : 'Đã thanh toán'}: -${res.totalKhoaiPaid ?? dynamicRentalCost} 🥔`,
        [
          {
            text: lang === 'en' ? 'View Bookshelf' : 'Xem Tủ sách',
            onPress: () => navigateTab('bookshelf'),
          },
          {
            text: lang === 'en' ? 'Read Now' : 'Đọc Ngay',
            onPress: () => onStartReading(0),
          },
        ]
      );
    } finally {
      setIsProcessingRent(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!isLoggedIn) {
      showLoginAlert(
        lang === 'en'
          ? 'Please log in to add books to your Favorites and sync with Web!'
          : 'Bạn phải đăng nhập để lưu sách yêu thích và đồng bộ lên Web!'
      );
      return;
    }

    const prevLiked = isLiked;
    const nextLiked = !prevLiked;
    setIsLiked(nextLiked);

    const result = await toggleFavoriteBook({
      id: String(book.id),
      title: book.title,
      author: authorName,
      chapter: chapterDisplay,
      category_name: categoryName,
      img_url: (book as any).img_url || '',
      coverImage: (book as any).img_url || '',
    });

    if (result.success) {
      setIsLiked(result.isFavorite);
      Alert.alert(
        lang === 'en' ? 'Favorites' : 'Yêu Thích',
        result.message || (result.isFavorite
          ? (lang === 'en' ? 'Added to favorites! It will appear on Web as well.' : 'Đã thêm tác phẩm vào danh sách Yêu Thích! Bạn có thể xem trên cả Web.')
          : (lang === 'en' ? 'Removed from favorites!' : 'Đã xóa tác phẩm khỏi danh sách Yêu Thích!'))
      );
    } else if (result.requireLogin) {
      setIsLiked(prevLiked);
      showLoginAlert(
        lang === 'en'
          ? 'Please log in to add books to your Favorites and sync with Web!'
          : 'Bạn phải đăng nhập để lưu sách yêu thích và đồng bộ lên Web!'
      );
    } else {
      setIsLiked(prevLiked);
      Alert.alert(lang === 'en' ? 'Notice' : 'Thông báo', result.message);
    }
  };

  // Bật modal nhập ID người nhận
  const handleOpenIdPrompt = () => {
    setRecipientInputId('');
    setIdErrorMsg('');
    loadPotatoBalance();
    setIsIdPromptVisible(true);
  };

  // Xác nhận ID người nhận: kiểm tra tồn tại
  const handleConfirmRecipientId = async () => {
    const rawId = recipientInputId.trim();
    if (!rawId) {
      setIdErrorMsg(lang === 'en' ? 'Please enter the recipient ID' : 'Vui lòng nhập ID người nhận');
      return;
    }

    try {
      setIsCheckingId(true);
      setIdErrorMsg('');

      // Lấy username/id của người đang đăng nhập để tránh tự tặng chính mình
      const currentSender = await getCurrentUsername();
      const currentSenderId = await AsyncStorage.getItem('@halm_current_customer_id');

      const cleanInput = rawId.toLowerCase().replace(/^(id#|#|id)/i, '');
      if (
        (currentSender && currentSender.toLowerCase() === rawId.toLowerCase()) ||
        (currentSenderId && currentSenderId.toLowerCase().replace(/^(id#|#|id)/i, '') === cleanInput)
      ) {
        setIsCheckingId(false);
        setIdErrorMsg(lang === 'en' ? 'You cannot gift a book to yourself!' : 'Bạn không thể tự tặng sách cho chính mình!');
        return;
      }

      // Tra cứu người dùng theo ID trong hệ thống
      const foundUser = await lookupUserInDirectory(rawId);
      if (!foundUser) {
        setIsCheckingId(false);
        setIdErrorMsg(lang === 'en' ? 'User does not exist' : 'Người dùng không tồn tại');
        return;
      }

      setVerifiedRecipient(foundUser);
      setGiftMessage('');
      setIsCheckingId(false);
      setIsIdPromptVisible(false);

      // Mở màn tặng sách cho bạn bè
      setIsGiftModalVisible(true);
    } catch {
      setIsCheckingId(false);
      setIdErrorMsg(lang === 'en' ? 'User does not exist' : 'Người dùng không tồn tại');
    }
  };

  // ============================================================================
  // [GIẢI THÍCH CODE]: Xử lý xác nhận tặng sách cho bạn bè
  // Người gửi bị trừ 10 Khoai (phí dịch vụ). Bên người nhận CHỈ NHẬN SÁCH, KHÔNG NHẬN KHOAI.
  // Sách sẽ được chuyển vào mục "Sách được tặng" trong Tủ sách của người nhận.
  // ============================================================================
  const handleConfirmSendGift = async () => {
    if (!verifiedRecipient) return;

    try {
      setIsSendingGift(true);
      const currentSender = await getCurrentUsername();

      // 1. Kiểm tra số dư Khoai của người gửi (yêu cầu tối thiểu 10 Khoai)
      let currentBalance = potatoBalance;
      const storedBalance = await getUserItem(KEY_POTATO_BALANCE);
      if (storedBalance !== null) currentBalance = Number(storedBalance) || 0;

      if (currentBalance < 10) {
        setIsSendingGift(false);
        Alert.alert(
          lang === 'en' ? 'Insufficient Potatoes 🥔' : 'Không đủ Khoai 🥔',
          lang === 'en'
            ? 'Your balance is not enough to gift this book (requires 10 Potatoes). Please top up in your Profile!'
            : 'Số dư của bạn không đủ 10 Khoai để tặng sách. Vui lòng nạp thêm Khoai tại Trang cá nhân!'
        );
        return;
      }

      // 2. Trừ 10 Khoai của người gửi làm phí tặng sách
      const nextBalance = Math.max(0, currentBalance - 10);
      setPotatoBalance(nextBalance);
      await setUserItem(KEY_POTATO_BALANCE, String(nextBalance));
      await AsyncStorage.setItem('@halm_potato_balance', String(nextBalance));

      // 3. Ghi lại lịch sử giao dịch trừ khoai của người gửi
      try {
        const txKey = `@halm_potato_history_${currentSender}`;
        const existingTxRaw = await AsyncStorage.getItem(txKey);
        let txList: any[] = existingTxRaw ? JSON.parse(existingTxRaw) : [];
        if (!Array.isArray(txList)) txList = [];
        txList.unshift({
          id: `gift_tx_${Date.now()}`,
          amount: -10,
          description: `Phí tặng sách "${book.title}" cho độc giả ${verifiedRecipient.name} (${verifiedRecipient.id})`,
          balanceAfter: nextBalance,
          createdAt: new Date().toISOString(),
          type: 'GIFT_BOOK',
        });
        await AsyncStorage.setItem(txKey, JSON.stringify(txList));
      } catch { }

      // 4. Bên người nhận CHỈ NHẬN SÁCH, KHÔNG NHẬN KHOAI
      // Thêm cuốn sách vào mục "Sách được tặng" trong Tủ sách của người nhận
      const giftedItem = {
        id: String(book.id),
        title: book.title,
        author: authorName,
        chapter: `Tặng bởi ${currentSender === 'guest' ? 'bạn bè' : currentSender}`,
        coverImage: (book as any).img_url || '',
        img_url: (book as any).img_url || '',
        giftedBy: currentSender,
        giftedTo: verifiedRecipient.name,
        recipientId: verifiedRecipient.id,
        message: giftMessage.trim(),
        giftedAt: new Date().toISOString(),
      };

      // Lưu vào danh sách sách tặng của người nhận theo nhiều khóa để khi người nhận đăng nhập tài khoản nào cũng thấy
      const targetKeys: string[] = [
        verifiedRecipient.id,
        verifiedRecipient.customerId,
        verifiedRecipient.username,
        (verifiedRecipient.id || '').replace(/^(id#|#|id)/i, ''),
      ].filter((k): k is string => Boolean(k && k.trim()));

      for (const tKey of targetKeys) {
        const storageKey = `${KEY_GIFTED_BOOKS}_${tKey.toLowerCase()}`;
        const existingRaw = await AsyncStorage.getItem(storageKey);
        let list: any[] = [];
        if (existingRaw) {
          try {
            list = JSON.parse(existingRaw);
            if (!Array.isArray(list)) list = [];
          } catch { }
        }
        list = [giftedItem, ...list.filter((b) => String(b.id) !== String(book.id))];
        await AsyncStorage.setItem(storageKey, JSON.stringify(list));
      }

      // 5. Lưu vào lịch sử tặng sách của người gửi
      const senderKey = `@halm_sent_gifts_v1_${currentSender}`;
      const senderRaw = await AsyncStorage.getItem(senderKey);
      let senderList: any[] = [];
      if (senderRaw) {
        try {
          senderList = JSON.parse(senderRaw);
          if (!Array.isArray(senderList)) senderList = [];
        } catch { }
      }
      senderList = [giftedItem, ...senderList.filter((b) => String(b.id) !== String(book.id))];
      await AsyncStorage.setItem(senderKey, JSON.stringify(senderList));

      // 6. [GIẢI THÍCH CODE]: Tự động gửi thông báo cho cả Người gửi và Người nhận
      try {
        // Thông báo cho Người gửi
        await addNotification(
          {
            type: 'gift_sent',
            title: lang === 'en' ? 'Gift Sent Successfully! 🎁' : 'Tặng sách thành công! 🎁',
            message:
              lang === 'en'
                ? `You have gifted "${book.title}" to ${verifiedRecipient.name} (-10 Potatoes).`
                : `Bạn đã tặng cuốn sách "${book.title}" cho bạn bè (${verifiedRecipient.name}) kèm lời nhắn: "${giftMessage.trim() || 'Chúc bạn đọc sách vui vẻ!'}". (-10 🥔)`,
            data: {
              bookId: String(book.id),
              bookTitle: book.title,
              recipientName: verifiedRecipient.name,
              giftMessage: giftMessage.trim(),
              potatoAmount: 10,
            },
          },
          currentSender
        );

        // Thông báo cho Người nhận
        const recipientUser = verifiedRecipient.username || verifiedRecipient.id;
        if (recipientUser) {
          await addNotification(
            {
              type: 'gift_received',
              title: lang === 'en' ? 'You Received a Gift Book! 🎁' : 'Bạn vừa nhận được một cuốn sách mới! 🎁',
              message:
                lang === 'en'
                  ? `${currentSender} just gifted the book "${book.title}" to you. Go to your bookshelf to enjoy it now!`
                  : `Bạn ${currentSender} vừa tặng sách ${book.title} cho bạn. Hãy vào tủ sách của bạn để thưởng thức ngay!`,
              data: {
                bookId: String(book.id),
                bookTitle: book.title,
                senderName: currentSender,
                giftMessage: giftMessage.trim(),
              },
            },
            recipientUser
          );
        }
      } catch (errNotif) {
        console.warn('Lỗi ghi thông báo tặng sách:', errNotif);
      }

      setIsSendingGift(false);
      setIsGiftModalVisible(false);
      setVerifiedRecipient(null);
      setGiftMessage('');

      Alert.alert(
        lang === 'en' ? 'Gift Sent Successfully! 🎉' : 'Tặng sách thành công! 🎉',
        lang === 'en'
          ? `Book "${book.title}" has been gifted to ${verifiedRecipient.name} (-10 Potatoes). Remaining balance: ${nextBalance} 🥔.`
          : `Cuốn sách "${book.title}" đã được tặng cho ${verifiedRecipient.name} thành công (-10 Khoai). Sách đã được chuyển vào mục Sách được tặng trong Tủ sách của bạn bè!`
      );
    } catch {
      setIsSendingGift(false);
      Alert.alert(
        lang === 'en' ? 'Error' : 'Lỗi',
        lang === 'en' ? 'Could not complete book gifting.' : 'Không thể thực hiện tặng sách lúc này.'
      );
    }
  };

  const handleContinueReading = () => {
    onStartReading(savedChapter ? Math.max(0, savedChapter.chapterNum - 1) : 0);
  };

  return (
    <SafeAreaView style={themeStyles.safeArea}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        {...({ backgroundColor: isDarkMode ? '#111210' : '#ffffff' } as any)}
      />

      {/* HIỆU ỨNG BẦU TRỜI SAO VÀ SAO BĂNG ĐỒNG BỘ TRANG CHỦ APP */}
      <CosmicBackground visible={isDarkMode} />


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
          onPress={handleToggleFavorite}
          activeOpacity={0.8}
        >
          <Heart
            size={20}
            color={isDarkMode ? '#E8656F' : '#e11d48'}
            fill={isLiked ? (isDarkMode ? '#E8656F' : '#e11d48') : 'none'}
          />
        </TouchableOpacity>
      </View>

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
              const coverSource = getBookCoverSource(book.id, (book as any).img_url);
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
              <Text style={themeStyles.authorLabel}>{lang === 'en' ? 'Author:' : 'Tác giả:'}</Text>
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

            {/* Thống kê lượt đọc & số chương */}
            <View style={themeStyles.statsRow}>
              <View style={themeStyles.statBadgeReads}>
                <Eye size={13} color={isDarkMode ? '#38BDF8' : '#0284c7'} />
                <Text style={themeStyles.statBadgeReadsText}>{book.reads || '15.2K'} {lang === 'en' ? 'reads' : 'lượt đọc'}</Text>
              </View>
              <View style={themeStyles.statBadgeChapters}>
                <BookOpen size={13} color={isDarkMode ? '#34D399' : '#059669'} />
                <Text style={themeStyles.statBadgeChaptersText}>{chapterDisplay}</Text>
              </View>
            </View>

            {/* Nút / Icon Hộp Quà (CHỈ ICON, KHÔNG CHỮ) */}
            <TouchableOpacity
              style={themeStyles.giftIconOnlyBtn}
              onPress={handleOpenIdPrompt}
              activeOpacity={0.8}
            >
              <Ionicons name="gift" size={18} color="#ffffff" />
            </TouchableOpacity>

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

        {/* BANNER TRẠNG THÁI THUÊ SÁCH / BẢN ĐỌC THỬ */}
        {!isPersonalBook && (
          <View
            style={[
              themeStyles.rentalBanner,
              accessDetail.hasAccess
                ? themeStyles.rentalBannerActive
                : themeStyles.rentalBannerLocked,
            ]}
          >
            <View style={themeStyles.rentalBannerLeft}>
              <Ionicons
                name={accessDetail.hasAccess ? 'checkmark-circle' : 'time-outline'}
                size={18}
                color={
                  accessDetail.hasAccess
                    ? isDarkMode
                      ? '#34D399'
                      : '#059669'
                    : isDarkMode
                      ? '#FBBF24'
                      : '#b45309'
                }
              />
              <View style={{ flex: 1 }}>
                {isLoadingAccess ? (
                  <Text style={themeStyles.rentalBannerText}>
                    {lang === 'en' ? 'Checking rental status...' : 'Đang kiểm tra trạng thái thuê...'}
                  </Text>
                ) : accessDetail.hasAccess ? (
                  <Text style={themeStyles.rentalBannerText}>
                    {accessDetail.isForever
                      ? lang === 'en'
                        ? 'Owned forever • Full book unlocked'
                        : 'Sở hữu vĩnh viễn • Đọc trọn bộ'
                      : lang === 'en'
                        ? `Rented • ${accessDetail.remainingDays} days left`
                        : `Đang thuê • Còn ${accessDetail.remainingDays} ngày`}
                  </Text>
                ) : accessDetail.status === 'EXPIRED' ? (
                  <Text style={themeStyles.rentalBannerText}>
                    {lang === 'en'
                      ? `Rental expired • Renew from ${baseKhoai} 🥔 / 7 days`
                      : `Đã hết hạn thuê • Gia hạn từ ${baseKhoai} 🥔 / 7 ngày`}
                  </Text>
                ) : (
                  <Text style={themeStyles.rentalBannerText}>
                    {lang === 'en'
                      ? `Preview Ch.1 only • Full access from ${baseKhoai} 🥔 / 7 days`
                      : `Đọc thử Chương 1 • Thuê trọn bộ từ ${baseKhoai} 🥔 / 7 ngày`}
                  </Text>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Ô THỨ HAI: CÁC NÚT HÀNH ĐỘNG (THEO MÀU SẮC CHUẨN CỦA TRANG CHỦ WEB) */}
        <View style={themeStyles.actionRow}>
          {/* Nút Tiếp Tục Đọc (Vàng kim sang trọng) */}
          {savedChapter && (isPersonalBook || accessDetail.hasAccess) && (
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

          {/* Nút Đọc Từ Đầu / Đọc Thử */}
          <TouchableOpacity
            style={[
              themeStyles.btnReadPrimary,
              savedChapter && (isPersonalBook || accessDetail.hasAccess) ? themeStyles.btnReadPrimaryCompact : null,
            ]}
            onPress={() => onStartReading(0)}
            activeOpacity={0.88}
          >
            <BookOpen size={16} color="#ffffff" />
            <Text style={themeStyles.btnReadPrimaryText}>
              {isPersonalBook || accessDetail.hasAccess
                ? lang === 'en'
                  ? 'Read from Start'
                  : 'Đọc Từ Đầu'
                : lang === 'en'
                  ? 'Preview Ch.1'
                  : 'Đọc Thử C.1'}
            </Text>
          </TouchableOpacity>

          {/* Nút Thêm Tủ (đồng bộ Yêu thích thật lên DB) */}
          <TouchableOpacity
            style={[
              themeStyles.btnBookmark,
              isLiked && themeStyles.btnBookmarkActive,
              savedChapter && (isPersonalBook || accessDetail.hasAccess) ? themeStyles.btnBookmarkCompact : null,
            ]}
            onPress={handleToggleFavorite}
            activeOpacity={0.88}
          >
            <Bookmark
              size={16}
              color={isLiked ? '#ffffff' : (isDarkMode ? '#EDE9DF' : '#334155')}
              fill={isLiked ? '#ffffff' : 'none'}
            />
            <Text
              style={[
                themeStyles.btnBookmarkText,
                isLiked && themeStyles.btnBookmarkActiveText,
              ]}
            >
              {isLiked ? (lang === 'en' ? 'Saved' : 'Đã Lưu') : (lang === 'en' ? 'Save' : 'Thêm Tủ')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* HÀNG THUÊ SÁCH & THÊM VÀO GIỎ (CHO SÁCH CATALOG HỆ THỐNG) */}
        {!isPersonalBook && (
          <View style={themeStyles.rentalActionRow}>
            <TouchableOpacity
              style={themeStyles.btnAddToCart}
              onPress={handleQuickAddToCart}
              disabled={isAddingToCart}
              activeOpacity={0.85}
            >
              {isAddingToCart ? (
                <ActivityIndicator size="small" color={isDarkMode ? '#EDE9DF' : '#334155'} />
              ) : (
                <>
                  <Ionicons
                    name="cart-outline"
                    size={16}
                    color={isDarkMode ? '#EDE9DF' : '#334155'}
                  />
                  <Text style={themeStyles.btnAddToCartText} numberOfLines={1}>
                    {lang === 'en' ? 'Add Cart' : 'Thêm Giỏ'}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={themeStyles.btnRentNow}
              onPress={openRentModal}
              activeOpacity={0.88}
            >
              <Ionicons name="sparkles" size={15} color={isDarkMode ? '#111210' : '#ffffff'} />
              <Text style={themeStyles.btnRentNowText} numberOfLines={1}>
                {accessDetail.hasAccess
                  ? lang === 'en'
                    ? 'Extend Rental'
                    : 'Gia Hạn Thuê Sách'
                  : lang === 'en'
                    ? `Rent Book (${baseKhoai} 🥔)`
                    : `Thuê Trọn Bộ (${baseKhoai} 🥔)`}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Ô THỨ BA: TRÍCH ĐOẠN NỔI BẬT (CHỈ HIỂN THỊ KHI CÓ DỮ LIỆU TỪ DB) */}
        {featuredQuote && (
          <View style={themeStyles.sectionContainer}>
            <Text style={themeStyles.sectionTitle}>{lang === 'en' ? 'Featured Excerpt' : 'Trích Đoạn Tiêu Biểu'}</Text>
            <View style={themeStyles.quoteBox}>
              <View style={themeStyles.quoteHeaderRow}>
                <Quote size={18} color={isDarkMode ? '#D4AF37' : '#d97706'} />
                <Text style={themeStyles.quoteHeaderTitle}>{lang === 'en' ? 'Golden Words' : 'Lời vàng tác phẩm'}</Text>
              </View>
              <Text style={themeStyles.quoteContentText}>{featuredQuote.quote}</Text>
              <Text style={themeStyles.quoteSourceText}>{featuredQuote.source}</Text>
            </View>
          </View>
        )}

        {/* Ô THỨ TƯ: DANH SÁCH CHƯƠNG */}
        <View style={themeStyles.sectionContainer}>
          <View style={themeStyles.sectionHeaderRow}>
            <Text style={themeStyles.sectionTitle}>{lang === 'en' ? 'Chapter List' : 'Danh Sách Chương'}</Text>
          </View>

          {chapters.length > 0 ? (
            <View style={themeStyles.chaptersCardBox}>
              {(showAllChapters ? chapters : chapters.slice(0, 5)).map((chap) => {
                const isCurrentChapter = savedChapter?.chapterNum === chap.id;
                const isChapterLocked = isTrialRestricted && chap.id > 1;
                return (
                  <TouchableOpacity
                    key={chap.id}
                    style={[
                      themeStyles.chapterRowItem,
                      isCurrentChapter && themeStyles.chapterRowActive,
                      isChapterLocked && { opacity: 0.6 },
                    ]}
                    activeOpacity={0.7}
                    onPress={() => {
                      if (isChapterLocked) {
                        Alert.alert(
                          lang === 'en' ? 'Rental Required' : 'Cần thuê sách để đọc tiếp',
                          lang === 'en'
                            ? 'Only Chapter 1 is available for free preview. Rent the full book to unlock all chapters.'
                            : 'Bạn chỉ có thể đọc thử Chương 1. Hãy thuê trọn bộ sách để đọc tiếp chương này.',
                          [
                            { text: lang === 'en' ? 'Cancel' : 'Để sau', style: 'cancel' },
                            { text: lang === 'en' ? 'Rent Now' : 'Thuê Ngay', onPress: openRentModal },
                          ]
                        );
                        return;
                      }
                      onStartReading(chap.id - 1);
                    }}
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
                              <Text style={themeStyles.currentReadingPillText}>{lang === 'en' ? 'Reading' : 'Đang đọc'}</Text>
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
              <Text style={themeStyles.emptyText}>{lang === 'en' ? 'No chapter list available for this book.' : 'Chưa có danh sách chương cho cuốn sách này.'}</Text>
            </View>
          )}
        </View>

        {/* Khoảng cách đáy */}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ============================================================================
          [GIẢI THÍCH CODE]: Modal 1 - Nhập ID người nhận (xem tại Trang cá nhân)
          Nếu ID sai -> hiển thị thông báo "Người dùng không tồn tại"
          Nếu ID đúng -> chuyển sang Modal 2 tặng sách cho bạn bè
          ============================================================================ */}
      <Modal
        visible={isIdPromptVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsIdPromptVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={themeStyles.promptBackdrop}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setIsIdPromptVisible(false)}
          />
          <View style={themeStyles.promptCard}>
            <View style={themeStyles.promptHeaderRow}>
              <View style={themeStyles.promptIconBadge}>
                <Ionicons name="gift" size={18} color="#ffffff" />
              </View>
              <Text style={themeStyles.promptTitle}>
                {lang === 'en' ? 'Gift Book to Friends' : 'Tặng sách cho bạn bè'}
              </Text>
            </View>

            <Text style={themeStyles.promptSubtitle}>
              {lang === 'en'
                ? 'Enter recipient ID (found in their Profile screen):'
                : 'Vui lòng nhập ID người nhận (hiển thị trong Trang cá nhân):'}
            </Text>

            <View style={themeStyles.promptInputWrapper}>
              <Ionicons
                name="person-outline"
                size={18}
                color={isDarkMode ? '#8A8780' : '#94a3b8'}
                style={{ marginRight: 8 }}
              />
              <TextInput
                style={themeStyles.promptInput}
                placeholder={lang === 'en' ? 'e.g. id#C00001, C00007...' : 'Ví dụ: id#C00001, C00007...'}
                placeholderTextColor={isDarkMode ? '#6B7280' : '#94a3b8'}
                value={recipientInputId}
                onChangeText={(text) => {
                  setRecipientInputId(text);
                  if (idErrorMsg) setIdErrorMsg('');
                }}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {idErrorMsg ? (
              <View style={themeStyles.errorRow}>
                <Ionicons name="alert-circle" size={14} color="#ef4444" />
                <Text style={themeStyles.errorText}>{idErrorMsg}</Text>
              </View>
            ) : null}

            <View style={themeStyles.promptActionsRow}>
              <TouchableOpacity
                style={themeStyles.promptCancelBtn}
                onPress={() => setIsIdPromptVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={themeStyles.promptCancelBtnText}>
                  {lang === 'en' ? 'Cancel' : 'Hủy'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[themeStyles.promptConfirmBtn, isCheckingId && { opacity: 0.7 }]}
                onPress={handleConfirmRecipientId}
                disabled={isCheckingId}
                activeOpacity={0.8}
              >
                {isCheckingId ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={themeStyles.promptConfirmBtnText}>
                    {lang === 'en' ? 'Confirm' : 'Xác nhận'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ============================================================================
          [GIẢI THÍCH CODE]: Modal 2 - Màn Thông Tin Tặng Sách Cho Bạn Bè
          Hiển thị: Tên sách, Tác giả, Ảnh sách, Tên người nhận theo ID đã xác thực, Lời nhắn gửi tặng
          ============================================================================ */}
      <Modal
        visible={isGiftModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsGiftModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={themeStyles.modalBackdrop}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setIsGiftModalVisible(false)}
          />
          <View style={themeStyles.modalCard}>
            {/* Thanh kéo nhỏ phía trên cùng của modal sheet */}
            <View style={themeStyles.modalDragHandle} />

            {/* Phía trên: Tiêu đề Tặng sách cho bạn bè */}
            <View style={themeStyles.modalHeaderRow}>
              <View style={themeStyles.modalHeaderTitleGroup}>
                <View style={themeStyles.modalHeaderIconBadge}>
                  <Ionicons name="gift" size={17} color="#ffffff" />
                </View>
                <View>
                  <Text style={themeStyles.modalHeaderTitle}>
                    {lang === 'en' ? 'Gift Book to Friends' : 'Tặng sách cho bạn bè'}
                  </Text>
                  <Text style={themeStyles.modalHeaderSubtitle}>
                    {lang === 'en' ? 'Share knowledge & reading joy' : 'Gửi trọn tri thức và niềm vui đọc sách'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={themeStyles.modalCloseBtn}
                onPress={() => setIsGiftModalVisible(false)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={20} color={isDarkMode ? '#A6A29A' : '#64748b'} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={{ maxHeight: height * 0.68 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Phía dưới: Ảnh sách được tặng, Tên sách và Tác giả */}
              <View style={themeStyles.giftBookPreviewCard}>
                <View style={themeStyles.giftBookCoverThumb}>
                  {(() => {
                    const coverSource = getBookCoverSource(book.id, (book as any).img_url);
                    return coverSource ? (
                      <Image source={coverSource} style={StyleSheet.absoluteFill} resizeMode="cover" />
                    ) : (
                      <View style={themeStyles.giftBookCoverFallback}>
                        <BookOpen size={20} color="#ffffff" />
                      </View>
                    );
                  })()}
                </View>
                <View style={themeStyles.giftBookInfoCol}>
                  <Text style={themeStyles.giftBookLabel}>
                    {lang === 'en' ? 'GIFTED BOOK' : 'SÁCH ĐƯỢC TẶNG'}
                  </Text>
                  <Text style={themeStyles.giftBookTitle} numberOfLines={2}>
                    {book.title}
                  </Text>
                  <Text style={themeStyles.giftBookAuthor} numberOfLines={1}>
                    {lang === 'en' ? 'Author: ' : 'Tác giả: '}
                    <Text style={themeStyles.giftBookAuthorBold}>{authorName}</Text>
                  </Text>
                  <View style={themeStyles.giftBookTagPill}>
                    <Text style={themeStyles.giftBookTagText} numberOfLines={1}>
                      {categoryName}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Phía dưới nữa: Thông tin người nhận theo ID đã xác thực */}
              <View style={themeStyles.recipientSection}>
                <View style={themeStyles.recipientSectionHeader}>
                  <Ionicons
                    name="person-circle-outline"
                    size={19}
                    color={isDarkMode ? '#F3DA7A' : '#d97706'}
                  />
                  <Text style={themeStyles.recipientSectionTitle}>
                    {lang === 'en' ? 'Recipient Information' : 'Thông tin người nhận'}
                  </Text>
                </View>

                {/* Thẻ người nhận: hiển thị tên theo ID */}
                <View style={themeStyles.verifiedRecipientCard}>
                  <View style={themeStyles.verifiedRecipientIcon}>
                    <Ionicons name="person" size={18} color="#ffffff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={themeStyles.verifiedRecipientLabel}>
                      {lang === 'en' ? 'Recipient' : 'Người nhận'}
                    </Text>
                    <Text style={themeStyles.verifiedRecipientName}>
                      {verifiedRecipient?.name || 'Độc giả'}
                    </Text>
                    <Text style={themeStyles.verifiedRecipientId}>
                      ID: {verifiedRecipient?.id || verifiedRecipient?.customerId || recipientInputId}
                    </Text>
                  </View>
                </View>

                {/* Lời nhắn gửi tặng */}
                <View style={themeStyles.inputGroup}>
                  <Text style={themeStyles.inputLabel}>
                    {lang === 'en' ? 'Gift Message' : 'Lời nhắn gửi tặng'}
                  </Text>
                  <TextInput
                    style={[themeStyles.textInput, themeStyles.textArea]}
                    placeholder={
                      lang === 'en'
                        ? 'Write a warm message...'
                        : 'Chúc bạn đọc sách thật nhiều cảm hứng và niềm vui!...'
                    }
                    placeholderTextColor={isDarkMode ? '#6B7280' : '#94a3b8'}
                    value={giftMessage}
                    onChangeText={setGiftMessage}
                    multiline={true}
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                </View>

                {/* Bảng thông tin chi phí trừ 10 khoai */}
                <View style={themeStyles.costInfoRow}>
                  <View style={themeStyles.costLeft}>
                    <Text style={themeStyles.costLabel}>
                      {lang === 'en' ? 'Gifting fee:' : 'Phí tặng sách:'}
                    </Text>
                    <Text style={themeStyles.costValue}>10 Khoai 🥔</Text>
                  </View>
                  <Text style={themeStyles.balanceHint}>
                    {lang === 'en' ? `Balance: ${potatoBalance} 🥔` : `Số dư: ${potatoBalance} 🥔`}
                  </Text>
                </View>
              </View>

              {/* Nhóm nút hành động: Hủy & Xác nhận tặng sách */}
              <View style={themeStyles.modalActionRow}>
                <TouchableOpacity
                  style={themeStyles.modalCancelBtn}
                  onPress={() => setIsGiftModalVisible(false)}
                  activeOpacity={0.8}
                >
                  <Text style={themeStyles.modalCancelBtnText}>
                    {lang === 'en' ? 'Cancel' : 'Hủy'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[themeStyles.modalConfirmBtn, isSendingGift && { opacity: 0.7 }]}
                  onPress={handleConfirmSendGift}
                  disabled={isSendingGift}
                  activeOpacity={0.85}
                >
                  {isSendingGift ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <Ionicons name="gift" size={16} color="#ffffff" />
                      <Text style={themeStyles.modalConfirmBtnText}>
                        {lang === 'en' ? 'Gift (10 🥔)' : 'Tặng sách (10 Khoai 🥔)'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ===================================================================== */}
      {/* MODAL CHỌN GÓI THUÊ SÁCH & THANH TOÁN KHOAI                          */}
      {/* ===================================================================== */}
      <Modal
        visible={isRentModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => !isProcessingRent && setIsRentModalVisible(false)}
      >
        <View style={themeStyles.modalBackdrop}>
          <View style={themeStyles.rentModalCard}>
            <View style={themeStyles.modalHeaderRow}>
              <View style={themeStyles.modalHeaderTitleGroup}>
                <View style={[themeStyles.modalHeaderIconBadge, { backgroundColor: isDarkMode ? 'rgba(212, 175, 55, 0.16)' : '#fef3c7' }]}>
                  <Ionicons name="sparkles" size={18} color={isDarkMode ? '#D4AF37' : '#d97706'} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={themeStyles.modalHeaderTitle}>
                    {lang === 'en' ? 'Choose Rental Plan' : 'Chọn Gói Thuê Sách'}
                  </Text>
                  <Text style={themeStyles.modalHeaderSubtitle} numberOfLines={1}>
                    {book.title}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={themeStyles.modalCloseBtn}
                onPress={() => !isProcessingRent && setIsRentModalVisible(false)}
              >
                <Ionicons name="close" size={18} color={isDarkMode ? '#A6A29A' : '#64748b'} />
              </TouchableOpacity>
            </View>

            <View style={themeStyles.rentModalBody}>
              <Text style={themeStyles.rentSectionLabel}>
                {lang === 'en' ? 'Select rental duration:' : 'Thời hạn thuê đọc trọn bộ:'}
              </Text>
              <View style={themeStyles.rentPlanGrid}>
                {RENTAL_DURATION_OPTIONS.map((opt) => {
                  const isActive = selectedRentalDays === opt.days;
                  const optCost = calculateDynamicKhoai(baseKhoai, opt.days);
                  return (
                    <TouchableOpacity
                      key={opt.days}
                      style={[
                        themeStyles.rentPlanCard,
                        isActive && themeStyles.rentPlanCardActive,
                      ]}
                      onPress={() => setSelectedRentalDays(opt.days)}
                      activeOpacity={0.85}
                    >
                      <Text
                        style={[
                          themeStyles.rentPlanTitle,
                          isActive && themeStyles.rentPlanTitleActive,
                        ]}
                      >
                        {lang === 'en' ? opt.labelEn : opt.label}
                      </Text>
                      <Text
                        style={[
                          themeStyles.rentPlanPrice,
                          isActive && themeStyles.rentPlanPriceActive,
                        ]}
                      >
                        {optCost} 🥔
                      </Text>
                      <Text style={themeStyles.rentPlanSub} numberOfLines={1}>
                        {lang === 'en' ? opt.subtitleEn : opt.subtitle}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={themeStyles.costInfoRow}>
                <View style={themeStyles.costLeft}>
                  <Ionicons name="wallet-outline" size={16} color={isDarkMode ? '#F3DA7A' : '#d97706'} />
                  <Text style={themeStyles.costLabel}>
                    {lang === 'en' ? `Total (${selectedRentalDays}d):` : `Chi phí (${selectedRentalDays} ngày):`}
                  </Text>
                  <Text style={themeStyles.costValue}>{dynamicRentalCost} Khoai 🥔</Text>
                </View>
                <Text style={themeStyles.balanceHint}>
                  {lang === 'en' ? 'Bal:' : 'Ví:'} {potatoBalance} 🥔
                </Text>
              </View>

              {potatoBalance < dynamicRentalCost && (
                <Text style={themeStyles.rentInsufficientHint}>
                  {lang === 'en'
                    ? 'Insufficient balance. Tap Top Up Khoai below to continue.'
                    : 'Số dư Ví Khoai chưa đủ. Bạn có thể nạp thêm ở mục Ưu đãi.'}
                </Text>
              )}

              <View style={themeStyles.modalActionRow}>
                <TouchableOpacity
                  style={themeStyles.modalCancelBtn}
                  onPress={handleQuickAddToCart}
                  disabled={isProcessingRent || isAddingToCart}
                >
                  <Text style={themeStyles.modalCancelBtnText}>
                    {isAddingToCart
                      ? '...'
                      : lang === 'en'
                        ? 'Add Cart'
                        : 'Thêm Giỏ'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    themeStyles.modalConfirmBtn,
                    isProcessingRent && { opacity: 0.7 },
                  ]}
                  onPress={handleConfirmRent}
                  disabled={isProcessingRent}
                >
                  {isProcessingRent ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={16} color="#ffffff" />
                      <Text style={themeStyles.modalConfirmBtnText}>
                        {potatoBalance < dynamicRentalCost
                          ? lang === 'en'
                            ? 'Top Up Khoai'
                            : 'Nạp Khoai'
                          : lang === 'en'
                            ? `Rent (${dynamicRentalCost} 🥔)`
                            : `Thuê Ngay (${dynamicRentalCost} 🥔)`}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
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

    // Thống kê Lượt đọc & Số chương
    statsRow: {
      flexDirection: 'row',
      alignItems: 'center',
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
    // Nút Thêm Tủ
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
      backgroundColor: isDarkMode ? '#8E3038' : '#e11d48',
      borderColor: isDarkMode ? '#A83C46' : '#be123c',
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

    // Nút / Icon Hộp Quà (CHỈ ICON, KHÔNG CHỮ)
    giftIconOnlyBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: isDarkMode ? '#E8656F' : '#e11d48',
      justifyContent: 'center',
      alignItems: 'center',
      alignSelf: 'flex-start',
      marginBottom: 8,
      shadowColor: '#E8656F',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.35,
      shadowRadius: 4,
      elevation: 3,
    },

    // Modal 1: Nhập ID người nhận
    promptBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    promptCard: {
      width: '100%',
      maxWidth: 360,
      backgroundColor: isDarkMode ? '#1e222b' : '#ffffff',
      borderRadius: 20,
      padding: 20,
      borderWidth: 1,
      borderColor: isDarkMode ? '#2d3340' : '#e2e8f0',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 8,
    },
    promptHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 10,
    },
    promptIconBadge: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: isDarkMode ? '#E8656F' : '#e11d48',
      justifyContent: 'center',
      alignItems: 'center',
    },
    promptTitle: {
      fontSize: 16.5,
      fontWeight: '800',
      color: isDarkMode ? '#EDE9DF' : '#0f172a',
    },
    promptSubtitle: {
      fontSize: 12.5,
      color: isDarkMode ? '#A6A29A' : '#64748b',
      marginBottom: 14,
      lineHeight: 18,
    },
    promptInputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDarkMode ? '#14171d' : '#f8fafc',
      borderWidth: 1,
      borderColor: isDarkMode ? '#333a48' : '#cbd5e1',
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: Platform.OS === 'ios' ? 10 : 7,
    },
    promptInput: {
      flex: 1,
      fontSize: 13.5,
      color: isDarkMode ? '#EDE9DF' : '#0f172a',
    },
    errorRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      marginTop: 8,
    },
    errorText: {
      fontSize: 12,
      color: '#ef4444',
      fontWeight: '600',
    },
    promptActionsRow: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 18,
    },
    promptCancelBtn: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 10,
      backgroundColor: isDarkMode ? '#282d38' : '#f1f5f9',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: isDarkMode ? '#333842' : '#e2e8f0',
    },
    promptCancelBtnText: {
      fontSize: 13,
      fontWeight: '700',
      color: isDarkMode ? '#A6A29A' : '#64748b',
    },
    promptConfirmBtn: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 10,
      backgroundColor: isDarkMode ? '#E8656F' : '#e11d48',
      alignItems: 'center',
      justifyContent: 'center',
    },
    promptConfirmBtnText: {
      fontSize: 13,
      fontWeight: '800',
      color: '#ffffff',
    },

    // Modal 2: Tặng Sách Cho Bạn Bè
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      justifyContent: 'flex-end',
    },
    modalCard: {
      backgroundColor: isDarkMode ? '#1a1d24' : '#ffffff',
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: Platform.OS === 'ios' ? 36 : 24,
      borderWidth: 1,
      borderColor: isDarkMode ? '#2d323e' : '#e2e8f0',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 10,
    },
    modalDragHandle: {
      width: 38,
      height: 4,
      borderRadius: 2,
      backgroundColor: isDarkMode ? '#3f4452' : '#cbd5e1',
      alignSelf: 'center',
      marginBottom: 12,
    },
    modalHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 14,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#282c37' : '#f1f5f9',
    },
    modalHeaderTitleGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    modalHeaderIconBadge: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: isDarkMode ? '#E8656F' : '#e11d48',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalHeaderTitle: {
      fontSize: 16.5,
      fontWeight: '800',
      color: isDarkMode ? '#EDE9DF' : '#0f172a',
    },
    modalHeaderSubtitle: {
      fontSize: 11,
      color: isDarkMode ? '#8A8780' : '#64748b',
      marginTop: 1,
    },
    modalCloseBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: isDarkMode ? '#252933' : '#f1f5f9',
      justifyContent: 'center',
      alignItems: 'center',
    },

    // Thẻ Sách Được Tặng (Ảnh, Tên, Tác Giả)
    giftBookPreviewCard: {
      flexDirection: 'row',
      backgroundColor: isDarkMode ? '#20242D' : '#f8fafc',
      borderRadius: 14,
      padding: 12,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: isDarkMode ? '#2d323e' : '#e2e8f0',
      alignItems: 'center',
      gap: 12,
    },
    giftBookCoverThumb: {
      width: 62,
      height: 86,
      borderRadius: 8,
      overflow: 'hidden',
      backgroundColor: '#3b7a6d',
    },
    giftBookCoverFallback: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#3b7a6d',
    },
    giftBookInfoCol: {
      flex: 1,
    },
    giftBookLabel: {
      fontSize: 9.5,
      fontWeight: '800',
      color: isDarkMode ? '#F3DA7A' : '#b45309',
      letterSpacing: 0.8,
      marginBottom: 2,
    },
    giftBookTitle: {
      fontSize: 14.5,
      fontWeight: '800',
      color: isDarkMode ? '#EDE9DF' : '#0f172a',
      marginBottom: 3,
      lineHeight: 19,
    },
    giftBookAuthor: {
      fontSize: 12,
      color: isDarkMode ? '#A6A29A' : '#64748b',
      marginBottom: 6,
    },
    giftBookAuthorBold: {
      fontWeight: '700',
      color: isDarkMode ? '#EDE9DF' : '#1e293b',
    },
    giftBookTagPill: {
      alignSelf: 'flex-start',
      paddingHorizontal: 7,
      paddingVertical: 2.5,
      borderRadius: 6,
      backgroundColor: isDarkMode ? 'rgba(212, 175, 55, 0.15)' : '#e6f4f1',
    },
    giftBookTagText: {
      fontSize: 10,
      fontWeight: '700',
      color: isDarkMode ? '#F3DA7A' : '#2a6b5c',
    },

    // Phần Thông Tin Người Nhận
    recipientSection: {
      backgroundColor: isDarkMode ? '#20242D' : '#ffffff',
      borderRadius: 14,
      padding: 14,
      borderWidth: 1,
      borderColor: isDarkMode ? '#2d323e' : '#e2e8f0',
      marginBottom: 14,
    },
    recipientSectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 12,
    },
    recipientSectionTitle: {
      fontSize: 13.5,
      fontWeight: '800',
      color: isDarkMode ? '#EDE9DF' : '#0f172a',
    },

    // Thẻ Người Nhận Đã Xác Thực
    verifiedRecipientCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDarkMode ? '#14171d' : '#f1f5f9',
      borderRadius: 12,
      padding: 12,
      marginBottom: 14,
      gap: 10,
      borderWidth: 1,
      borderColor: isDarkMode ? '#2d3340' : '#e2e8f0',
    },
    verifiedRecipientIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: isDarkMode ? '#D4AF37' : '#d97706',
      justifyContent: 'center',
      alignItems: 'center',
    },
    verifiedRecipientLabel: {
      fontSize: 11,
      color: isDarkMode ? '#8A8780' : '#64748b',
      fontWeight: '600',
    },
    verifiedRecipientName: {
      fontSize: 14.5,
      fontWeight: '800',
      color: isDarkMode ? '#EDE9DF' : '#0f172a',
    },
    verifiedRecipientId: {
      fontSize: 11.5,
      color: isDarkMode ? '#F3DA7A' : '#b45309',
      fontWeight: '700',
      marginTop: 1,
    },

    // Chi Phí Tặng Sách & Số Dư
    costInfoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 12,
      backgroundColor: isDarkMode ? 'rgba(212, 175, 55, 0.12)' : '#fef3c7',
      borderRadius: 10,
      marginBottom: 6,
      borderWidth: 1,
      borderColor: isDarkMode ? 'rgba(212, 175, 55, 0.25)' : '#fde68a',
    },
    costLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    costLabel: {
      fontSize: 12.5,
      fontWeight: '700',
      color: isDarkMode ? '#F3DA7A' : '#92400e',
    },
    costValue: {
      fontSize: 13,
      fontWeight: '800',
      color: isDarkMode ? '#F3DA7A' : '#92400e',
    },
    balanceHint: {
      fontSize: 11.5,
      color: isDarkMode ? '#D1CEBF' : '#78350f',
      fontWeight: '600',
    },

    inputGroup: {
      marginBottom: 11,
    },
    inputLabel: {
      fontSize: 11.5,
      fontWeight: '700',
      color: isDarkMode ? '#D1CEBF' : '#475569',
      marginBottom: 5,
    },
    textInput: {
      backgroundColor: isDarkMode ? '#16181B' : '#f8fafc',
      borderWidth: 1,
      borderColor: isDarkMode ? '#333842' : '#cbd5e1',
      borderRadius: 9,
      paddingHorizontal: 12,
      paddingVertical: 8.5,
      fontSize: 13,
      color: isDarkMode ? '#EDE9DF' : '#0f172a',
    },
    textArea: {
      height: 68,
      paddingTop: 8,
    },

    // Nút Hành Động Modal
    modalActionRow: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 4,
      marginBottom: 6,
    },
    modalCancelBtn: {
      flex: 1,
      paddingVertical: 11,
      borderRadius: 11,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDarkMode ? '#252933' : '#f1f5f9',
      borderWidth: 1,
      borderColor: isDarkMode ? '#333842' : '#e2e8f0',
    },
    modalCancelBtnText: {
      fontSize: 13,
      fontWeight: '700',
      color: isDarkMode ? '#A6A29A' : '#64748b',
    },
    modalConfirmBtn: {
      flex: 2,
      flexDirection: 'row',
      paddingVertical: 11,
      borderRadius: 11,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDarkMode ? '#E8656F' : '#e11d48',
      gap: 6,
    },
    modalConfirmBtnText: {
      fontSize: 13.5,
      fontWeight: '800',
      color: '#ffffff',
    },

    // Banner Trạng Thái Thuê Sách / Bản Đọc Thử
    rentalBanner: {
      marginHorizontal: 16,
      marginTop: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 12,
      borderWidth: 1,
    },
    rentalBannerActive: {
      backgroundColor: isDarkMode ? 'rgba(52, 211, 153, 0.12)' : '#ecfdf5',
      borderColor: isDarkMode ? 'rgba(52, 211, 153, 0.3)' : '#a7f3d0',
    },
    rentalBannerLocked: {
      backgroundColor: isDarkMode ? 'rgba(217, 119, 6, 0.12)' : '#fffbeb',
      borderColor: isDarkMode ? 'rgba(251, 191, 36, 0.3)' : '#fde68a',
    },
    rentalBannerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    rentalBannerText: {
      fontSize: 12.5,
      fontWeight: '700',
      color: isDarkMode ? '#EDE9DF' : '#1e293b',
    },

    // Hàng Nút Thêm Giỏ & Thuê Sách Trọn Bộ
    rentalActionRow: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingBottom: 14,
      gap: 10,
      backgroundColor: isDarkMode ? 'rgba(22, 24, 27, 0.92)' : '#ffffff',
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#262A33' : '#f1f5f9',
    },
    btnAddToCart: {
      flex: 0.9,
      height: 44,
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: isDarkMode ? '#20242D' : '#f8fafc',
      borderWidth: 1,
      borderColor: isDarkMode ? '#333842' : '#cbd5e1',
      paddingHorizontal: 10,
    },
    btnAddToCartText: {
      fontSize: 13,
      fontWeight: '700',
      color: isDarkMode ? '#EDE9DF' : '#334155',
    },
    btnRentNow: {
      flex: 1.5,
      height: 44,
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingHorizontal: 12,
      backgroundColor: isDarkMode ? '#D4AF37' : '#d97706',
      shadowColor: isDarkMode ? '#D4AF37' : '#d97706',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: isDarkMode ? 0.35 : 0.25,
      shadowRadius: 5,
      elevation: 3,
    },
    btnRentNowText: {
      fontSize: 13.5,
      fontWeight: '900',
      color: isDarkMode ? '#111210' : '#ffffff',
    },

    // Modal Chọn Gói Thuê Sách
    rentModalCard: {
      width: '92%',
      maxWidth: 400,
      backgroundColor: isDarkMode ? '#1C1F26' : '#ffffff',
      borderRadius: 20,
      padding: 18,
      borderWidth: 1,
      borderColor: isDarkMode ? '#2D323E' : '#e2e8f0',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.28,
      shadowRadius: 16,
      elevation: 10,
    },
    rentModalBody: {
      marginTop: 6,
    },
    rentSectionLabel: {
      fontSize: 12.5,
      fontWeight: '700',
      color: isDarkMode ? '#D1CEBF' : '#475569',
      marginBottom: 8,
    },
    rentPlanGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 12,
    },
    rentPlanCard: {
      width: '48%',
      paddingVertical: 10,
      paddingHorizontal: 10,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: isDarkMode ? '#333842' : '#e2e8f0',
      backgroundColor: isDarkMode ? '#14161B' : '#f8fafc',
    },
    rentPlanCardActive: {
      borderColor: isDarkMode ? '#D4AF37' : '#d97706',
      backgroundColor: isDarkMode ? 'rgba(212, 175, 55, 0.14)' : '#fffbeb',
    },
    rentPlanTitle: {
      fontSize: 13.5,
      fontWeight: '800',
      color: isDarkMode ? '#EDE9DF' : '#0f172a',
    },
    rentPlanTitleActive: {
      color: isDarkMode ? '#F3DA7A' : '#b45309',
    },
    rentPlanPrice: {
      fontSize: 13,
      fontWeight: '800',
      color: isDarkMode ? '#34D399' : '#059669',
      marginTop: 2,
    },
    rentPlanPriceActive: {
      color: isDarkMode ? '#D4AF37' : '#d97706',
    },
    rentPlanSub: {
      fontSize: 10.5,
      color: isDarkMode ? '#8D8980' : '#64748b',
      marginTop: 3,
    },
    rentInsufficientHint: {
      fontSize: 11.5,
      fontWeight: '600',
      color: isDarkMode ? '#FCA5A5' : '#dc2626',
      marginBottom: 10,
    },
  });
}
