import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Constants from 'expo-constants';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, Image, Modal,
  ScrollView, StyleSheet, Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppNavigation, useAppThemeStyles, useAutoHideFooter } from './navigation';
import { Chapter, extractPdfChapters } from './pdfExtractor';
import { addToReadingList } from './readingHistory';
import {
  getUserItem,
  setUserItem,
  KEY_UPLOADED_BOOKS,
  KEY_FREE_UPLOADS,
  KEY_CURRENT_READING,
  KEY_USER_TIER,
  KEY_POTATO_BALANCE,
} from './userStorage';
import { addNotification } from './notificationService';
import { API_BASE_URL } from './apiService';
import {
  BookCategory,
  DEFAULT_CATEGORIES,
  fetchBookCategories,
  UploadedBook,
} from './uploadBookService';

// [GIẢI THÍCH CODE]: Cấu hình URL Backend để đồng bộ số dư khoai và hạng thành viên
// Sử dụng API_BASE_URL từ apiService tối ưu hóa kết nối đa nền tảng

// [GIẢI THÍCH CODE]: Giới hạn lượt tải miễn phí theo 4 hạng thành viên:
// - Thợ Cày: 3 lượt up free
// - Cao Thủ Cày: 10 lượt up free
// - Lão Nông: 15 lượt up free
// - Đại Điền Chủ: Vĩnh viễn (không giới hạn)
// Khi hết lượt free: Mỗi lần tải tốn 50 Khoai
export const TIER_UPLOAD_CONFIG: Record<
  string,
  { maxFree: number; badge: string; name: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  'Thợ Cày': { maxFree: 3, badge: '🌱', name: 'Thợ Cày', icon: 'leaf-outline' },
  'Cao Thủ Cày': { maxFree: 10, badge: '🚜', name: 'Cao Thủ Cày', icon: 'ribbon-outline' },
  'Lão Nông': { maxFree: 15, badge: '🌾', name: 'Lão Nông', icon: 'medal-outline' },
  'Đại Điền Chủ': { maxFree: Infinity, badge: '👑', name: 'Đại Điền Chủ', icon: 'shield-checkmark-outline' },
};

export const UPLOAD_COST_POTATO = 50;
const TIER_STORAGE_KEY = KEY_USER_TIER;
const POTATO_STORAGE_KEY = KEY_POTATO_BALANCE;
const FREE_UPLOADS_USED_KEY = KEY_FREE_UPLOADS;

const normalizeTierName = (name?: string): string => {
  if (!name) return 'Thợ Cày';
  const lower = name.toLowerCase().trim();
  if (lower.includes('đại điền chủ') || lower.includes('dien chu') || lower.includes('dai dien chu')) return 'Đại Điền Chủ';
  if (lower.includes('lão nông') || lower.includes('lao nong')) return 'Lão Nông';
  if (lower.includes('cao thủ') || lower.includes('cao thu')) return 'Cao Thủ Cày';
  return 'Thợ Cày';
};

// [GIẢI THÍCH CODE]: Tái xuất định dạng dữ liệu cho sách đã được upload
export type { UploadedBook };

const STORAGE_KEY = KEY_UPLOADED_BOOKS;

// [GIẢI THÍCH CODE]: Tính toán chỉ số HalmBook tiếp theo (HalmBook1, HalmBook2, HalmBook3...)
const getNextHalmNumber = (list: UploadedBook[]): number => {
  let highest = 0;
  for (const item of list) {
    const match = item.title.match(/^HalmBook(\d+)$/i);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > highest) {
        highest = num;
      }
    }
  }
  return highest + 1;
};

// [GIẢI THÍCH CODE]: Format dung lượng tệp đọc được từ DocumentPicker
const formatFileSize = (bytes?: number): string => {
  if (!bytes || isNaN(bytes)) return '1.5 MB';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// [GIẢI THÍCH CODE]: Màu nền ngẫu nhiên trang nhã cho bìa sách mặc định khi không chọn ảnh
const getPlaceholderColors = (title: string) => {
  if (title.includes('HalmBook1')) return { bg: '#e0f2fe', text: '#0284c7', border: '#bae6fd' };
  if (title.includes('HalmBook2')) return { bg: '#fef3c7', text: '#d97706', border: '#fde68a' };
  if (title.includes('HalmBook3')) return { bg: '#fce7f3', text: '#db2777', border: '#fbcfe8' };
  if (title.includes('HalmBook4')) return { bg: '#dcfce7', text: '#15803d', border: '#bbf7d0' };
  return { bg: '#ede9fe', text: '#7c3aed', border: '#ddd6fe' };
};

export default function UploadFile() {
  const themeStyles = useAppThemeStyles(styles);
  const { navigate, isDarkMode, lang } = useAppNavigation();
  const { onScroll: handleFooterScroll } = useAutoHideFooter();

  // Danh sách sách đã tải lên (ban đầu rỗng vì người dùng chưa tải sách nào)
  const [uploadedBooks, setUploadedBooks] = useState<UploadedBook[]>([]);
  // Tệp người dùng vừa chọn từ điện thoại
  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  // Trạng thái hiển thị modal nhập thông tin sách
  const [isModalVisible, setIsModalVisible] = useState(false);
  // Trạng thái đang tải / xử lý
  const [isPicking, setIsPicking] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // [GIẢI THÍCH CODE]: Trạng thái Hạng thành viên, Số dư Ví Khoai và Lượt tải free đã dùng
  const [currentTier, setCurrentTier] = useState<string>('Thợ Cày');
  const [potatoBalance, setPotatoBalance] = useState<number>(0);
  const [usedFreeUploads, setUsedFreeUploads] = useState<number>(0);

  // Form fields
  const [bookTitle, setBookTitle] = useState('');
  const [bookAuthor, setBookAuthor] = useState('');
  const [coverImageUri, setCoverImageUri] = useState<string>('');
  const [coverImageName, setCoverImageName] = useState<string>('');
  const [categories, setCategories] = useState<BookCategory[]>(DEFAULT_CATEGORIES);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number>(1);
  const [bookDescription, setBookDescription] = useState<string>('');

  // Tính toán hạn mức tải sách
  const resolvedTier = normalizeTierName(currentTier);
  const tierConfig = TIER_UPLOAD_CONFIG[resolvedTier] || TIER_UPLOAD_CONFIG['Thợ Cày'];
  const isUnlimited = tierConfig.maxFree === Infinity;
  const freeRemaining = isUnlimited ? Infinity : Math.max(0, tierConfig.maxFree - usedFreeUploads);
  const isFree = isUnlimited || freeRemaining > 0;

  // [GIẢI THÍCH CODE]: Tải danh sách sách đã lưu & Đồng bộ Hạng thành viên, Ví Khoai, Lượt tải free & Thể loại sách
  useEffect(() => {
    // 1. Tải danh mục thể loại từ Backend
    fetchBookCategories().then((cats) => {
      if (cats && cats.length > 0) {
        setCategories(cats);
        setSelectedCategoryId(cats[0].category_id);
      }
    });

    const loadSavedBooksAndTier = async () => {
      try {
        const [savedBooks, savedTier, savedPotato, savedUsed] = await Promise.all([
          getUserItem(STORAGE_KEY),
          getUserItem(TIER_STORAGE_KEY),
          getUserItem(POTATO_STORAGE_KEY),
          getUserItem(FREE_UPLOADS_USED_KEY),
        ]);

        if (savedTier) setCurrentTier(savedTier);
        if (savedPotato) setPotatoBalance(Number(savedPotato) || 0);
        if (savedUsed) setUsedFreeUploads(Number(savedUsed) || 0);

        if (savedBooks) {
          const parsed = JSON.parse(savedBooks);
          if (Array.isArray(parsed)) {
            // Lọc bỏ các sách mẫu cũ (Kiếm Đạo Độc Tôn, Tài Liệu Lịch Sử, mock-1, mock-2)
            const cleanList = parsed.filter(
              (b: UploadedBook) =>
                b.id !== 'mock-1' &&
                b.id !== 'mock-2' &&
                !b.title.includes('Kiếm Đạo Độc Tôn') &&
                !b.title.includes('Tài Liệu Lịch Sử')
            );
            setUploadedBooks(cleanList);
            await setUserItem(STORAGE_KEY, JSON.stringify(cleanList));
          }
        } else {
          setUploadedBooks([]);
        }

        // Đồng bộ thông tin mới nhất từ Backend nếu đã đăng nhập
        const token = await AsyncStorage.getItem('userToken');
        if (token) {
          try {
            const res = await axios.get(`${API_BASE_URL}/api/home/membership/my-tier`, {
              headers: { Authorization: `Bearer ${token}` },
              timeout: 6000,
            });
            if (res.data) {
              const bTier = res.data.currentTier?.tierName;
              const bPotato = res.data.potatoBalance;
              if (bTier) {
                setCurrentTier(bTier);
                setUserItem(TIER_STORAGE_KEY, bTier).catch(() => { });
              }
              if (typeof bPotato === 'number') {
                setPotatoBalance(bPotato);
                setUserItem(POTATO_STORAGE_KEY, String(bPotato)).catch(() => { });
              }
            }
          } catch {
            // Không kết nối được Backend -> giữ nguyên dữ liệu lưu trữ ngoại tuyến
          }
        }
      } catch {
        setUploadedBooks([]);
      }
    };
    loadSavedBooksAndTier();
  }, []);

  // [GIẢI THÍCH CODE]: 1. Mở trình chọn tệp trên thiết bị - HỖ TRỢ CẢ PDF (.pdf) VÀ EPUB (.epub)
  const handlePickDocument = async () => {
    if (isPicking) return;

    // Kiểm tra nếu hết lượt free và không đủ 50 khoai
    if (!isUnlimited && freeRemaining === 0 && potatoBalance < UPLOAD_COST_POTATO) {
      Alert.alert(
        lang === 'en' ? 'Out of Free Uploads' : 'Hết Lượt Tải Miễn Phí',
        lang === 'en'
          ? `You have used all ${tierConfig.maxFree} free uploads for tier "${currentTier}".\n\nEach upload now costs 50 Potatoes (Current balance: ${potatoBalance} 🥔).\nPlease top up potatoes or upgrade your membership tier to continue uploading.`
          : `Bạn đã dùng hết ${tierConfig.maxFree} lượt tải sách miễn phí của hạng "${currentTier}".\n\nMỗi lượt tải sách tiếp theo cần 50 Khoai (Số dư hiện có: ${potatoBalance} 🥔).\nVui lòng nạp thêm Khoai hoặc nâng hạng thành viên để tiếp tục tải sách!`,
        [
          { text: lang === 'en' ? 'Later' : 'Để sau', style: 'cancel' },
          {
            text: lang === 'en' ? 'Top Up Potatoes 🥔' : 'Nạp Khoai Ngay 🥔',
            onPress: () => navigate('payment'),
          },
        ]
      );
      return;
    }

    try {
      setIsPicking(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/epub+zip', 'application/octet-stream', '*/*'],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const file = result.assets[0];

      // Kiểm tra định dạng có đúng là PDF hoặc EPUB không
      const fileNameLower = file.name.toLowerCase();
      const mimeLower = file.mimeType ? file.mimeType.toLowerCase() : '';
      const isPdf = fileNameLower.endsWith('.pdf') || mimeLower.includes('pdf');
      const isEpub = fileNameLower.endsWith('.epub') || mimeLower.includes('epub');

      if (!isPdf && !isEpub) {
        Alert.alert(
          lang === 'en' ? 'PDF / EPUB Only' : 'Chỉ Chấp Nhận PDF hoặc EPUB',
          lang === 'en'
            ? 'Only PDF (.pdf) and EPUB (.epub) files are supported. Please select a valid document file.'
            : 'Hệ thống chỉ chấp nhận tải lên tệp định dạng PDF (.pdf) hoặc EPUB (.epub). Vui lòng chọn tệp hợp lệ.'
        );
        return;
      }

      setSelectedFile(file);

      // Tự động điền tên sách từ tên tệp (chuẩn hóa giống bản Web)
      const autoTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setBookTitle(autoTitle);
      setBookAuthor('Tác giả tự do');
      setCoverImageUri('');
      setCoverImageName('');
      setBookDescription('');
      setIsModalVisible(true);
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert(
        lang === 'en' ? 'Error' : 'Lỗi',
        lang === 'en'
          ? 'Could not open file picker on this device.'
          : 'Không thể mở trình chọn tệp trên thiết bị của bạn.'
      );
    } finally {
      setIsPicking(false);
    }
  };

  // [GIẢI THÍCH CODE]: 2. Mở thư viện ảnh điện thoại để chọn ảnh bìa sách
  const handlePickCoverImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          lang === 'en' ? 'Permission Denied' : 'Quyền truy cập bị từ chối',
          lang === 'en'
            ? 'Please grant photo library permissions to select book cover.'
            : 'Vui lòng cấp quyền truy cập thư viện ảnh để chọn ảnh bìa sách.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setCoverImageUri(asset.uri);
        setCoverImageName(asset.fileName || 'bia_sach.jpg');
      }
    } catch (err) {
      Alert.alert(
        lang === 'en' ? 'Error' : 'Lỗi',
        lang === 'en' ? 'Cannot open photo library.' : 'Không thể mở thư viện ảnh.'
      );
    }
  };

  // [GIẢI THÍCH CODE]: 3. Kiểm tra hạn mức Upload & trừ Khoai nếu hết lượt free
  const handleConfirmUpload = async () => {
    if (!selectedFile) return;

    // Nếu hết lượt free -> Kiểm tra và hỏi xác nhận trừ 50 Khoai
    if (!isUnlimited && freeRemaining === 0) {
      if (potatoBalance < UPLOAD_COST_POTATO) {
        Alert.alert(
          lang === 'en' ? 'Insufficient Potatoes' : 'Không Đủ Khoai',
          lang === 'en'
            ? `Each upload costs 50 Potatoes. Your current balance is ${potatoBalance} 🥔.\nPlease top up to continue.`
            : `Mỗi lượt tải sách cần 50 Khoai. Số dư hiện tại của bạn là ${potatoBalance} 🥔.\nVui lòng nạp thêm Khoai để tiếp tục tải sách!`,
          [
            { text: lang === 'en' ? 'Later' : 'Để sau', style: 'cancel' },
            {
              text: lang === 'en' ? 'Top Up 🥔' : 'Nạp Khoai Ngay 🥔',
              onPress: () => {
                setIsModalVisible(false);
                navigate('payment');
              },
            },
          ]
        );
        return;
      }

      // Xác nhận trừ 50 Khoai
      Alert.alert(
        lang === 'en' ? 'Confirm Upload (50 🥔)' : 'Xác Nhận Tải Sách (50 Khoai)',
        lang === 'en'
          ? `You have used all ${tierConfig.maxFree} free uploads for tier "${currentTier}".\nThis upload will deduct 50 Potatoes from your wallet (Current balance: ${potatoBalance} 🥔).\n\nDo you want to proceed?`
          : `Bạn đã dùng hết ${tierConfig.maxFree} lượt tải sách miễn phí của hạng "${currentTier}".\nLượt tải này sẽ trừ 50 Khoai từ ví của bạn (Số dư hiện có: ${potatoBalance} 🥔).\n\nBạn có đồng ý tiếp tục tải lên không?`,
        [
          { text: lang === 'en' ? 'Cancel' : 'Hủy', style: 'cancel' },
          {
            text: lang === 'en' ? 'Confirm (-50 🥔)' : 'Đồng Ý (Trừ 50 🥔)',
            onPress: () => executeUploadProcess(true),
          },
        ]
      );
      return;
    }

    // Còn lượt miễn phí hoặc là Đại Điền Chủ
    await executeUploadProcess(false);
  };

  // [GIẢI THÍCH CODE]: Thực hiện bóc tách tài liệu, đồng bộ API Backend Cloudinary, lưu sách và cập nhật số dư Khoai
  const executeUploadProcess = async (isDeductPotato: boolean) => {
    if (!selectedFile) return;

    try {
      setIsUploading(true);

      const trimmedTitle = bookTitle.trim();
      const trimmedAuthor = bookAuthor.trim();
      const hasAuthor = !!trimmedAuthor;
      const hasImage = !!coverImageUri;

      let finalTitle = '';

      // Kiểm tra: nếu không nhập tên tác giả HOẶC không chọn ảnh sách (hoặc để trống tên sách)
      if (!hasAuthor || !hasImage || !trimmedTitle) {
        const nextHalmNum = getNextHalmNumber(uploadedBooks);
        finalTitle = `HalmBook${nextHalmNum}`;
      } else {
        finalTitle = trimmedTitle;
      }

      const finalAuthor = hasAuthor ? trimmedAuthor : (lang === 'en' ? 'Independent Author' : 'Tác giả tự do');
      const finalFileSize = formatFileSize(selectedFile.size);

      // [GIẢI THÍCH CODE]: 1. Đọc và trích xuất nội dung các trang từ tệp tài liệu để hỗ trợ đọc offline siêu mượt
      let extractedChapters: Chapter[] = [];
      try {
        const chapters = await extractPdfChapters(
          selectedFile.uri,
          selectedFile.name,
          finalTitle,
          finalAuthor,
          finalFileSize
        );
        if (Array.isArray(chapters) && chapters.length > 0) {
          extractedChapters = chapters;
        }
      } catch (extractErr) {
        console.warn('Trích xuất tài liệu ngoại tuyến:', extractErr);
      }

      if (extractedChapters.length === 0) {
        extractedChapters = [
          {
            id: 1,
            title: `Trang 1 - ${finalTitle}`,
            subtitle: `${finalAuthor} • ${selectedFile.name}`,
            content: [
              `Tài liệu: ${finalTitle}`,
              `Tác giả: ${finalAuthor}`,
              `Tệp gốc: ${selectedFile.name} (${finalFileSize})`,
              '──────────────────────────────',
              bookDescription.trim() || 'Nội dung tài liệu cá nhân sẵn sàng để thưởng thức trên HALM BOOK.',
            ],
          },
        ];
      }

      // [GIẢI THÍCH CODE]: 2. Lưu sách vào Tủ sách cá nhân (mục Sách tải lên), không đẩy lên kho cửa hàng Trang Chủ
      const selectedCategory = categories.find((c) => c.category_id === selectedCategoryId);
      const finalCoverUri = coverImageUri || undefined;

      const newBook: UploadedBook = {
        id: `uploaded_${Date.now()}`,
        title: finalTitle,
        author: finalAuthor,
        category: selectedCategory?.category_name || 'Tài liệu cá nhân',
        categoryId: selectedCategoryId,
        description: bookDescription.trim(),
        coverUri: finalCoverUri,
        coverImage: finalCoverUri,
        img_url: finalCoverUri,
        coverName: coverImageName.trim() || undefined,
        fileName: selectedFile.name,
        fileSize: finalFileSize,
        fileUri: selectedFile.uri,
        date: lang === 'en' ? 'Just now' : 'Vừa xong',
        status: lang === 'en' ? 'Completed' : 'Hoàn thành',
        progress: 0,
        chapters: extractedChapters,
        isPersonal: true,
      };

      const currentStored = await getUserItem(STORAGE_KEY);
      const currentList: UploadedBook[] = currentStored ? JSON.parse(currentStored) : [];
      const updatedList = [newBook, ...currentList.filter((b) => b.id !== newBook.id)];
      setUploadedBooks(updatedList);
      await setUserItem(STORAGE_KEY, JSON.stringify(updatedList));

      // [GIẢI THÍCH CODE]: Trừ Khoai hoặc tính lượt tải free đã dùng
      let successMsg = '';
      if (isDeductPotato) {
        const nextBalance = Math.max(0, potatoBalance - UPLOAD_COST_POTATO);
        setPotatoBalance(nextBalance);
        await setUserItem(POTATO_STORAGE_KEY, String(nextBalance));
        successMsg = lang === 'en'
          ? `Book "${finalTitle}" has been saved to your Bookshelf! 50 Potatoes deducted. Remaining: ${nextBalance} 🥔.`
          : `Sách "${finalTitle}" đã được lưu vào Tủ sách thành công! Đã trừ 50 Khoai. Số dư còn lại: ${nextBalance} 🥔.`;
      } else if (!isUnlimited) {
        const nextUsed = usedFreeUploads + 1;
        setUsedFreeUploads(nextUsed);
        await setUserItem(FREE_UPLOADS_USED_KEY, String(nextUsed));
        const remainingAfter = Math.max(0, tierConfig.maxFree - nextUsed);
        successMsg = lang === 'en'
          ? `Book "${finalTitle}" has been saved to your Bookshelf! You have ${remainingAfter} free uploads remaining.`
          : `Sách "${finalTitle}" đã được lưu vào Tủ sách thành công! Bạn còn ${remainingAfter} lượt tải miễn phí của hạng "${currentTier}".`;
      } else {
        successMsg = lang === 'en'
          ? `Book "${finalTitle}" has been saved to your Bookshelf with Unlimited VIP privileges 👑!`
          : `Sách "${finalTitle}" đã được lưu vào Tủ sách thành công với đặc quyền Đại Điền Chủ (Miễn phí vĩnh viễn) 👑!`;
      }

      setIsModalVisible(false);
      setSelectedFile(null);
      setBookTitle('');
      setBookAuthor('');
      setCoverImageUri('');
      setCoverImageName('');
      setBookDescription('');

      // [GIẢI THÍCH CODE]: Tự động gửi thông báo tải sách thành công vào Hộp thư
      addNotification({
        type: 'system',
        title: lang === 'en' ? 'Book Uploaded Successfully 📄' : 'Tải sách lên thành công 📄',
        message: successMsg,
        data: {
          bookId: newBook.id,
          bookTitle: finalTitle,
        },
      }).catch(() => {});

      Alert.alert(
        lang === 'en' ? 'Upload Successful' : 'Tải Lên Thành Công',
        `${successMsg}\n\n${lang === 'en' ? 'Your book is ready in Bookshelf > Uploaded tab.' : 'Sách đã có trong Tủ sách (mục "Sách tải lên") của bạn.'}`,
        [
          { text: lang === 'en' ? 'Stay here' : 'Ở lại trang', style: 'cancel' },
          {
            text: lang === 'en' ? 'Go to Bookshelf' : 'Vào Tủ sách ngay',
            onPress: () => navigate('bookshelf'),
          },
        ]
      );
    } catch (err) {
      console.error('Error confirming upload:', err);
      Alert.alert(
        lang === 'en' ? 'Upload Error' : 'Lỗi Tải Lên',
        lang === 'en' ? 'An error occurred while uploading file.' : 'Có lỗi xảy ra khi lưu tệp tải lên.'
      );
    } finally {
      setIsUploading(false);
    }
  };

  // [GIẢI THÍCH CODE]: 4. Chuyển sang màn hình đọc sách ngay lập tức với nội dung tệp PDF
  const handleReadBook = (book: UploadedBook) => {
    try {
      const chapters =
        book.chapters && book.chapters.length > 0
          ? book.chapters
          : [
            {
              id: 1,
              title: `Trang 1 - ${book.title}`,
              subtitle: `${book.author} • ${book.fileName}`,
              content: [
                `Tài liệu: ${book.title}`,
                `Tác giả: ${book.author}`,
                `Tệp gốc: ${book.fileName} (${book.fileSize})`,
                '──────────────────────────────',
                'Đang chuẩn bị nội dung tài liệu...',
              ],
            },
          ];

      const bookToRead = { ...book, chapters };
      setUserItem(KEY_CURRENT_READING, JSON.stringify(bookToRead)).catch(() => { });

      // [GIẢI THÍCH CODE]: Đưa sách tải lên vào "Sách đang đọc" với ảnh bìa đồng bộ
      addToReadingList({
        id: bookToRead.id,
        title: bookToRead.title,
        author: bookToRead.author,
        chapter: chapters[0].title,
        coverUri: bookToRead.coverUri,
        coverImage: bookToRead.coverUri,
        fileUri: bookToRead.fileUri,
      });

      // Chuyển màn hình NGAY LẬP TỨC
      navigate('reader', {
        id: bookToRead.id,
        title: bookToRead.title,
        author: bookToRead.author,
        chapter: chapters[0].title,
        pages: chapters.length,
        chapters,
        fileUri: bookToRead.fileUri,
        fileName: bookToRead.fileName,
        coverImage: bookToRead.coverUri,
        coverUri: bookToRead.coverUri,
      });

      // Nếu sách chưa có chapters chi tiết và có fileUri, trích xuất trong nền và cập nhật
      const isFallbackOnly =
        !book.chapters ||
        book.chapters.length === 0 ||
        (book.chapters.length === 1 &&
          book.chapters[0].content.some(
            (c) => c.includes('Đang chuẩn bị nội dung') || c.includes('Lưu ý:')
          ));

      if (isFallbackOnly && book.fileUri) {
        extractPdfChapters(
          book.fileUri,
          book.fileName,
          book.title,
          book.author,
          book.fileSize
        ).then(async (freshChapters) => {
          if (freshChapters && freshChapters.length > 0) {
            const updated = uploadedBooks.map((b) =>
              b.id === book.id ? { ...b, chapters: freshChapters } : b
            );
            setUploadedBooks(updated);
            await setUserItem(STORAGE_KEY, JSON.stringify(updated));
            await setUserItem(
              KEY_CURRENT_READING,
              JSON.stringify({ ...bookToRead, chapters: freshChapters })
            );
          }
        }).catch((err) => {
          console.warn('[PDF] Trích xuất nền không thành công:', err);
        });
      }
    } catch (err) {
      console.error('Lỗi mở sách:', err);
      navigate('reader', {
        id: book.id,
        title: book.title,
        author: book.author,
        pages: 1,
      });
    }
  };

  // [GIẢI THÍCH CODE]: Xóa một cuốn sách khỏi danh sách đã tải lên
  const handleDeleteBook = (id: string, title: string) => {
    Alert.alert(
      lang === 'en' ? 'Delete Book' : 'Xóa Sách',
      lang === 'en'
        ? `Are you sure you want to remove "${title}" from uploaded books?`
        : `Bạn có chắc muốn xóa cuốn sách "${title}" khỏi danh sách đã tải lên?`,
      [
        { text: lang === 'en' ? 'Cancel' : 'Hủy', style: 'cancel' },
        {
          text: lang === 'en' ? 'Delete' : 'Xóa',
          style: 'destructive',
          onPress: async () => {
            const filtered = uploadedBooks.filter((b) => b.id !== id);
            setUploadedBooks(filtered);
            await setUserItem(STORAGE_KEY, JSON.stringify(filtered));
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView edges={['top']} style={themeStyles.safeArea}>
      <ExpoStatusBar style={isDarkMode ? 'light' : 'dark'} />

      {/* Header tinh gọn chuẩn mobile app */}
      <View style={themeStyles.header}>
        <Text style={themeStyles.headerTitle}>
          {lang === 'en' ? 'Upload Book' : 'Tải lên tệp'}
        </Text>
      </View>

      <ScrollView
        style={themeStyles.scrollContainer}
        contentContainerStyle={themeStyles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={handleFooterScroll}
        scrollEventThrottle={16}
      >
        {/* Thẻ Hạng thành viên, Lượt miễn phí & Ví Khoai */}
        <View style={themeStyles.quotaBox}>
          <View style={themeStyles.quotaTopRow}>
            <View style={themeStyles.tierPill}>
              <Text style={{ fontSize: 15 }}>{tierConfig.badge}</Text>
              <Text style={themeStyles.tierPillText}>{currentTier}</Text>
            </View>

            <TouchableOpacity
              style={themeStyles.walletPill}
              activeOpacity={0.8}
              onPress={() => navigate('payment')}
            >
              <Ionicons
                name="wallet-outline"
                size={15}
                color={isDarkMode ? '#34D399' : '#2F6B5F'}
              />
              <Text style={themeStyles.walletPillText}>
                {potatoBalance.toLocaleString('vi-VN')} Khoai
              </Text>
              <Ionicons
                name="add-circle"
                size={16}
                color={isDarkMode ? '#34D399' : '#2F6B5F'}
              />
            </TouchableOpacity>
          </View>

          <View style={themeStyles.quotaBottomRow}>
            <Ionicons
              name={isFree ? 'checkmark-circle-outline' : 'information-circle-outline'}
              size={16}
              color={isFree ? (isDarkMode ? '#34D399' : '#2F6B5F') : '#DC2626'}
            />
            <Text style={[themeStyles.quotaStatusText, !isFree && { color: '#DC2626' }]}>
              {isUnlimited
                ? (lang === 'en' ? 'Unlimited free uploads 👑' : 'Đặc quyền không giới hạn lượt tải 👑')
                : isFree
                  ? (lang === 'en'
                    ? `${freeRemaining} / ${tierConfig.maxFree} free uploads remaining`
                    : `Còn ${freeRemaining} / ${tierConfig.maxFree} lượt tải miễn phí`)
                  : (lang === 'en'
                    ? `Used all ${tierConfig.maxFree} free uploads`
                    : `Đã dùng hết ${tierConfig.maxFree} lượt tải miễn phí`)}
            </Text>
          </View>
        </View>

        {/* Khu vực chọn tệp PDF / EPUB phong cách mobile app hiện đại */}
        <View style={themeStyles.uploadDropzone}>
          <View style={themeStyles.uploadHeroIconWrap}>
            <Ionicons
              name="cloud-upload-outline"
              size={30}
              color={isDarkMode ? '#34D399' : '#2F6B5F'}
            />
            <View style={themeStyles.uploadDocMiniBadge}>
              <Ionicons name="document-text-outline" size={13} color="#FFFFFF" />
            </View>
          </View>

          <Text style={themeStyles.title}>
            {lang === 'en' ? 'Upload PDF & EPUB' : 'Tải lên tài liệu đọc'}
          </Text>
          <Text style={themeStyles.subtitle}>
            {lang === 'en'
              ? 'Supports PDF (.pdf) and EPUB (.epub). Read smoothly right inside HALM BOOK.'
              : 'Hỗ trợ định dạng PDF (.pdf) và EPUB (.epub).\nĐọc mượt mà ngay trong ứng dụng HALM BOOK.'}
          </Text>

          {/* Hiển thị giá tải lên rõ ràng, dễ quan sát */}
          <View style={themeStyles.priceInfoRow}>
            <View style={themeStyles.priceLabelGroup}>
              <Ionicons
                name="pricetag-outline"
                size={15}
                color={isDarkMode ? '#9CA3AF' : '#6B7280'}
              />
              <Text style={themeStyles.priceLabelText}>
                {lang === 'en' ? 'Upload fee' : 'Phí mỗi lượt'}
              </Text>
            </View>

            <View style={themeStyles.priceValueGroup}>
              {isUnlimited ? (
                <>
                  <Text style={themeStyles.priceStrikethrough}>50 Khoai</Text>
                  <View
                    style={[
                      themeStyles.priceBadge,
                      {
                        backgroundColor: isDarkMode ? 'rgba(52, 211, 153, 0.16)' : '#E6F2EF',
                        borderColor: isDarkMode ? 'rgba(52, 211, 153, 0.35)' : '#B8DCD3',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        themeStyles.priceBadgeText,
                        { color: isDarkMode ? '#34D399' : '#1E5247' },
                      ]}
                    >
                      {lang === 'en' ? 'Free 👑' : 'Miễn phí 👑'}
                    </Text>
                  </View>
                </>
              ) : isFree ? (
                <>
                  <Text style={themeStyles.priceStrikethrough}>50 Khoai</Text>
                  <View
                    style={[
                      themeStyles.priceBadge,
                      {
                        backgroundColor: isDarkMode ? 'rgba(52, 211, 153, 0.16)' : '#E6F2EF',
                        borderColor: isDarkMode ? 'rgba(52, 211, 153, 0.35)' : '#B8DCD3',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        themeStyles.priceBadgeText,
                        { color: isDarkMode ? '#34D399' : '#1E5247' },
                      ]}
                    >
                      {lang === 'en' ? '0 Khoai • Free' : '0 Khoai • Miễn phí'}
                    </Text>
                  </View>
                </>
              ) : (
                <View
                  style={[
                    themeStyles.priceBadge,
                    {
                      backgroundColor: isDarkMode ? 'rgba(245, 158, 11, 0.18)' : '#FEF3C7',
                      borderColor: isDarkMode ? 'rgba(245, 158, 11, 0.38)' : '#FDE68A',
                    },
                  ]}
                >
                  <Text
                    style={[
                      themeStyles.priceBadgeText,
                      { color: isDarkMode ? '#FBBF24' : '#B45309' },
                    ]}
                  >
                    {lang === 'en' ? '50 Khoai / upload' : '50 Khoai / 1 lượt'}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <TouchableOpacity
            style={themeStyles.uploadBtn}
            activeOpacity={0.85}
            onPress={handlePickDocument}
            disabled={isPicking}
          >
            {isPicking ? (
              <ActivityIndicator color="#FFFFFF" style={{ marginRight: 10 }} />
            ) : (
              <Ionicons
                name="folder-open-outline"
                size={20}
                color="#FFFFFF"
                style={{ marginRight: 10 }}
              />
            )}
            <Text style={themeStyles.uploadBtnText}>
              {isPicking
                ? (lang === 'en' ? 'Opening device files...' : 'Đang mở trình chọn tệp...')
                : (lang === 'en' ? 'Choose File from Device' : 'Chọn tệp từ thiết bị')}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* ================================================================ */}
      {/* MODAL NHẬP THÔNG TIN SÁCH SAU KHI ĐÃ CHỌN TỆP TỪ ĐIỆN THOẠI */}
      {/* ================================================================ */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          if (!isUploading) setIsModalVisible(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={themeStyles.modalCard}>
            {/* Modal Header */}
            <View style={themeStyles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons
                  name="document-text-outline"
                  size={20}
                  color={isDarkMode ? '#34D399' : '#2F6B5F'}
                />
                <Text style={themeStyles.modalTitle}>
                  {lang === 'en' ? 'Book Upload Details' : 'Thông tin sách tải lên'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsModalVisible(false)}
                disabled={isUploading}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={22} color={isDarkMode ? '#9CA3AF' : '#6B7280'} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={{ maxHeight: 460 }}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingVertical: 6 }}
            >
              {/* Thẻ hiển thị tệp đã chọn từ điện thoại */}
              {selectedFile && (
                <View style={themeStyles.selectedFileBox}>
                  <View style={themeStyles.selectedFileIconWrap}>
                    <Ionicons
                      name="document-attach-outline"
                      size={20}
                      color={isDarkMode ? '#34D399' : '#2F6B5F'}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={themeStyles.selectedFileName} numberOfLines={1}>
                      {selectedFile.name}
                    </Text>
                    <Text style={themeStyles.selectedFileSize}>
                      {formatFileSize(selectedFile.size)} • {lang === 'en' ? 'Ready to read' : 'Tệp sẵn sàng đọc'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={themeStyles.reselectBtn}
                    onPress={handlePickDocument}
                    disabled={isUploading}
                  >
                    <Text style={themeStyles.reselectBtnText}>
                      {lang === 'en' ? 'Change' : 'Đổi tệp'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* 1. Nhập Tên Sách */}
              <View style={themeStyles.inputGroup}>
                <Text style={themeStyles.inputLabel}>
                  {lang === 'en' ? 'Book Title' : 'Tên sách'}
                </Text>
                <TextInput
                  style={themeStyles.textInput}
                  value={bookTitle}
                  onChangeText={setBookTitle}
                  placeholder={
                    lang === 'en'
                      ? 'e.g. Clean Code, Atomic Habits (Optional)'
                      : 'Ví dụ: Đắc Nhân Tâm, Hạt Giống Tâm Hồn (Tùy chọn)'
                  }
                  placeholderTextColor="#9CA3AF"
                  editable={!isUploading}
                />
              </View>

              {/* 2. Nhập Tên Tác Giả */}
              <View style={themeStyles.inputGroup}>
                <Text style={themeStyles.inputLabel}>
                  {lang === 'en' ? 'Author Name' : 'Tên tác giả'}
                </Text>
                <TextInput
                  style={themeStyles.textInput}
                  value={bookAuthor}
                  onChangeText={setBookAuthor}
                  placeholder={
                    lang === 'en'
                      ? 'e.g. Robert C. Martin, Dale Carnegie...'
                      : 'Ví dụ: Dale Carnegie, Nguyễn Nhật Ánh...'
                  }
                  placeholderTextColor="#9CA3AF"
                  editable={!isUploading}
                />
              </View>

              {/* 3. Thể loại sách đồng bộ với Backend */}
              <View style={themeStyles.inputGroup}>
                <Text style={themeStyles.inputLabel}>
                  {lang === 'en' ? 'Category' : 'Thể loại sách'}
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
                >
                  {categories.map((cat) => {
                    const isSelected = selectedCategoryId === cat.category_id;
                    return (
                      <TouchableOpacity
                        key={cat.category_id}
                        style={[
                          themeStyles.categoryPill,
                          isSelected && themeStyles.categoryPillActive,
                        ]}
                        onPress={() => setSelectedCategoryId(cat.category_id)}
                        disabled={isUploading}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            themeStyles.categoryPillText,
                            isSelected && themeStyles.categoryPillTextActive,
                          ]}
                        >
                          {cat.category_name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* 4. Mô tả tác phẩm (Tùy chọn) */}
              <View style={themeStyles.inputGroup}>
                <Text style={themeStyles.inputLabel}>
                  {lang === 'en' ? 'Description (Optional)' : 'Mô tả tác phẩm (Tùy chọn)'}
                </Text>
                <TextInput
                  style={[themeStyles.textInput, { height: 60, textAlignVertical: 'top', paddingTop: 8 }]}
                  value={bookDescription}
                  onChangeText={setBookDescription}
                  placeholder={
                    lang === 'en'
                      ? 'Brief description or notes about the document...'
                      : 'Tóm tắt hoặc ghi chú về tài liệu cá nhân...'
                  }
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={2}
                  editable={!isUploading}
                />
              </View>

              {/* 5. Chọn Ảnh Bìa Sách */}
              <View style={themeStyles.inputGroup}>
                <Text style={themeStyles.inputLabel}>
                  {lang === 'en' ? 'Book Cover Image' : 'Ảnh bìa sách'}
                </Text>

                <View style={themeStyles.coverPickerRow}>
                  <TouchableOpacity
                    style={themeStyles.pickImageBtn}
                    activeOpacity={0.8}
                    onPress={handlePickCoverImage}
                    disabled={isUploading}
                  >
                    <Ionicons
                      name="images-outline"
                      size={17}
                      color={isDarkMode ? '#34D399' : '#2F6B5F'}
                    />
                    <Text style={themeStyles.pickImageBtnText}>
                      {lang === 'en' ? 'Select Photo' : 'Chọn ảnh từ máy'}
                    </Text>
                  </TouchableOpacity>

                  {coverImageUri ? (
                    <TouchableOpacity
                      style={themeStyles.removeImageBtn}
                      activeOpacity={0.8}
                      onPress={() => {
                        setCoverImageUri('');
                        setCoverImageName('');
                      }}
                      disabled={isUploading}
                    >
                      <Ionicons name="close-circle-outline" size={16} color="#E11D48" />
                      <Text style={themeStyles.removeImageBtnText}>
                        {lang === 'en' ? 'Remove' : 'Bỏ ảnh'}
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>

                {/* Xem trước ảnh bìa đã chọn */}
                {coverImageUri ? (
                  <View style={themeStyles.coverPreviewCard}>
                    <Image
                      source={{ uri: coverImageUri }}
                      style={themeStyles.coverPreviewImg}
                      resizeMode="cover"
                    />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={themeStyles.coverPreviewTitle} numberOfLines={1}>
                        {coverImageName || (lang === 'en' ? 'Selected Cover' : 'Ảnh bìa đã chọn')}
                      </Text>
                      <Text style={themeStyles.coverPreviewSub}>
                        {lang === 'en' ? 'Cover ready to apply' : 'Đã gắn ảnh bìa cho sách'}
                      </Text>
                    </View>
                  </View>
                ) : null}
              </View>

              {/* Thông báo đồng bộ tài liệu */}
              <View style={themeStyles.syncNoticeBox}>
                <Ionicons
                  name="cloud-done-outline"
                  size={16}
                  color={isDarkMode ? '#34D399' : '#2F6B5F'}
                />
                <Text style={themeStyles.syncNoticeText}>
                  {lang === 'en'
                    ? 'Saved directly in your personal Bookshelf'
                    : 'Lưu trữ và mở đọc ngay trong Tủ sách cá nhân'}
                </Text>
              </View>
            </ScrollView>

            {/* Thanh hiển thị chi phí tải lên */}
            <View style={themeStyles.modalCostRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons
                  name={isUnlimited ? 'shield-checkmark-outline' : isFree ? 'pricetag-outline' : 'wallet-outline'}
                  size={16}
                  color={!isFree ? '#DC2626' : (isDarkMode ? '#34D399' : '#2F6B5F')}
                />
                <Text style={[themeStyles.modalCostText, !isFree && { color: '#DC2626' }]}>
                  {isUnlimited
                    ? (lang === 'en' ? 'VIP Unlimited Upload (Free)' : 'Đặc quyền Đại Điền Chủ: Miễn phí')
                    : isFree
                      ? (lang === 'en'
                        ? `Free Upload (${freeRemaining} remaining)`
                        : `Lượt tải miễn phí (Còn ${freeRemaining} lượt)`)
                      : (lang === 'en'
                        ? `Cost: 50 Khoai (Balance: ${potatoBalance} Khoai)`
                        : `Phí tải: 50 Khoai (Ví hiện có: ${potatoBalance} Khoai)`)}
                </Text>
              </View>
            </View>

            {/* Modal Buttons: Upload & Hủy */}
            <View style={themeStyles.modalActionRow}>
              <TouchableOpacity
                style={themeStyles.modalCancelBtn}
                activeOpacity={0.8}
                onPress={() => setIsModalVisible(false)}
                disabled={isUploading}
              >
                <Text style={themeStyles.modalCancelBtnText}>
                  {lang === 'en' ? 'Cancel' : 'Hủy'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  themeStyles.modalSubmitBtn,
                  !isFree && { backgroundColor: '#B45309' },
                ]}
                activeOpacity={0.85}
                onPress={handleConfirmUpload}
                disabled={isUploading}
              >
                {isUploading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Ionicons name="cloud-upload-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={themeStyles.modalSubmitBtnText}>
                      {isFree
                        ? (lang === 'en' ? 'Save & Read (Free)' : 'Tải lên (Miễn phí)')
                        : (lang === 'en' ? 'Upload (-50 Khoai)' : 'Tải lên (-50 Khoai)')}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },

  // Header tinh gọn chuẩn mobile app (đồng bộ với Tủ sách)
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.4,
    color: '#111827',
  },

  scrollContainer: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 6,
    paddingBottom: 24,
  },

  // Quota & Tier Card (Thanh lịch, chuẩn Dark/Light)
  quotaBox: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  quotaTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 8,
  },
  tierPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F5F7',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  tierPillText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#111827',
  },
  walletPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F5F7',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  walletPillText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#111827',
  },
  quotaBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 7,
  },
  quotaStatusText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
  },

  // Vùng chọn file phong cách mobile app đọc sách hiện đại
  uploadDropzone: {
    alignItems: 'center',
    backgroundColor: '#F4F5F7',
    borderRadius: 20,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#D1D5DB',
    paddingVertical: 30,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  uploadHeroIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  uploadDocMiniBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2F6B5F',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 19,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13.5,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 22,
    lineHeight: 20,
    paddingHorizontal: 6,
  },

  // Hàng hiển thị phí mỗi lượt rõ ràng, dễ quan sát
  priceInfoRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 14,
  },
  priceLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  priceLabelText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#6B7280',
  },
  priceValueGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priceStrikethrough: {
    fontSize: 12.5,
    fontWeight: '500',
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  priceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  priceBadgeText: {
    fontSize: 12.5,
    fontWeight: '700',
  },

  // Nút Upload chính chuẩn mobile app
  uploadBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2F6B5F',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  uploadBtnText: {
    color: '#FFFFFF',
    fontSize: 15.5,
    fontWeight: '700',
  },

  // MODAL STYLES
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.52)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 460,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 16.5,
    fontWeight: '700',
    color: '#111827',
  },

  // Selected File Box
  selectedFileBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F5F7',
    borderRadius: 12,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedFileIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  selectedFileName: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#111827',
  },
  selectedFileSize: {
    fontSize: 11.5,
    color: '#6B7280',
    marginTop: 2,
  },
  reselectBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  reselectBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2F6B5F',
  },

  // Form Inputs
  inputGroup: {
    marginTop: 12,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#F4F5F7',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13.5,
    color: '#111827',
  },

  // Cover Picker
  coverPickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pickImageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F4F5F7',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 14,
  },
  pickImageBtnText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#111827',
  },
  removeImageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  removeImageBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E11D48',
  },

  coverPreviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F5F7',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 8,
    marginTop: 8,
  },
  coverPreviewImg: {
    width: 44,
    height: 60,
    borderRadius: 6,
  },
  coverPreviewTitle: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#111827',
  },
  coverPreviewSub: {
    fontSize: 11.5,
    color: '#2F6B5F',
    marginTop: 2,
    fontWeight: '600',
  },

  // Category Pills
  categoryPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: '#F4F5F7',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryPillActive: {
    backgroundColor: '#2F6B5F',
    borderColor: '#2F6B5F',
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  categoryPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Sync Notice Box
  syncNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F4F5F7',
    padding: 10,
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  syncNoticeText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
    flex: 1,
  },

  modalCostRow: {
    backgroundColor: '#F4F5F7',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 10,
    marginBottom: 4,
  },
  modalCostText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },

  // Modal Actions
  modalActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4F5F7',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  modalCancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  modalSubmitBtn: {
    flex: 1.5,
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2F6B5F',
  },
  modalSubmitBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
