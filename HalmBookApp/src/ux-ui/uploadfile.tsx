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
import { useAppNavigation, useAppThemeStyles } from './navigation';
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
export const TIER_UPLOAD_CONFIG: Record<string, { maxFree: number; badge: string; name: string }> = {
  'Thợ Cày': { maxFree: 3, badge: '🌱', name: 'Thợ Cày' },
  'Cao Thủ Cày': { maxFree: 10, badge: '🚜', name: 'Cao Thủ Cày' },
  'Lão Nông': { maxFree: 15, badge: '🌾', name: 'Lão Nông' },
  'Đại Điền Chủ': { maxFree: Infinity, badge: '👑', name: 'Đại Điền Chủ' },
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

      {/* Header tinh gọn: Không hiển thị HALM BOOK, chuông, giỏ hàng, avatar, kính lúp */}
      <View style={themeStyles.header}>
        <Text style={themeStyles.headerTitle}>
          {lang === 'en' ? 'Upload File' : 'Tải Lên Tệp'}
        </Text>
      </View>

      <ScrollView style={themeStyles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Phần Upload */}
        <View style={themeStyles.uploadSection}>
          {/* Icon Trồng Khoai (Lá cây + Khoai tây) */}
          <View style={themeStyles.potatoIconWrapper}>
            <Ionicons
              name="leaf-outline"
              size={40}
              color="#27ae60"
              style={{ position: 'absolute', top: -15, right: -10 }}
            />
            <Text style={{ fontSize: 70 }}>🥔</Text>
          </View>

          <Text style={themeStyles.title}>{lang === 'en' ? 'Upload PDF Files' : 'Tải Lên Tệp PDF'}</Text>
          <Text style={themeStyles.subtitle}>
            {lang === 'en'
              ? 'Only PDF format (.pdf) supported. Upload your file to enjoy our reading reader'
              : 'Chỉ chấp nhận tệp định dạng PDF (.pdf). Tải lên để trải nghiệm trình đọc sách HALM BOOK'}
          </Text>

          {/* [GIẢI THÍCH CODE]: Khung hiển thị Hạng thành viên, Lượt upload còn lại & Số dư Ví Khoai */}
          <View style={styles.quotaBox}>
            <View style={styles.quotaTopRow}>
              <View style={styles.tierPill}>
                <Text style={{ fontSize: 16 }}>{tierConfig.badge}</Text>
                <Text style={styles.tierPillText}>{currentTier}</Text>
              </View>

              <TouchableOpacity
                style={styles.walletPill}
                activeOpacity={0.8}
                onPress={() => navigate('payment')}
              >
                <Text style={{ fontSize: 14 }}>🥔</Text>
                <Text style={styles.walletPillText}>
                  {potatoBalance.toLocaleString('vi-VN')} Khoai
                </Text>
                <Ionicons name="add-circle" size={15} color="#b45309" />
              </TouchableOpacity>
            </View>

            <View style={styles.quotaBottomRow}>
              <Ionicons
                name={isFree ? "checkmark-circle" : "alert-circle"}
                size={16}
                color={isFree ? "#16a34a" : "#dc2626"}
              />
              <Text style={[styles.quotaStatusText, !isFree && { color: '#dc2626' }]}>
                {isUnlimited
                  ? (lang === 'en' ? 'Uploads: Unlimited (Forever) 👑' : 'Lượt tải: Không giới hạn (Vĩnh viễn) 👑')
                  : isFree
                    ? (lang === 'en'
                      ? `Free uploads: ${freeRemaining} / ${tierConfig.maxFree} remaining`
                      : `Lượt tải miễn phí: Còn ${freeRemaining} / ${tierConfig.maxFree} lượt`)
                    : (lang === 'en'
                      ? `0 free uploads left • 50 Potatoes / upload`
                      : `Hết lượt up free • Phí 50 Khoai / lượt tải`)}
              </Text>
            </View>
          </View>

          {/* Nút Upload: Nhấn vào để mở file PDF trên điện thoại */}
          <TouchableOpacity
            style={themeStyles.uploadBtn}
            activeOpacity={0.85}
            onPress={handlePickDocument}
            disabled={isPicking}
          >
            {isPicking ? (
              <ActivityIndicator color="#1e3c72" style={{ marginRight: 15 }} />
            ) : (
              <Ionicons
                name="document-attach-outline"
                size={28}
                color="#1e3c72"
                style={{ marginRight: 15 }}
              />
            )}
            <View>
              <Text style={themeStyles.uploadBtnText}>
                {isPicking
                  ? (lang === 'en' ? 'Opening PDF Files...' : 'Đang mở tệp PDF...')
                  : 'Upload File PDF'}
              </Text>
              <View style={themeStyles.costRow}>
                {isUnlimited ? (
                  <Text style={themeStyles.costFree}>Miễn phí vĩnh viễn 👑</Text>
                ) : isFree ? (
                  <>
                    <Text style={themeStyles.costStrikethrough}>50 🥔</Text>
                    <Text style={themeStyles.costFree}>
                      {lang === 'en' ? `0 🥔 (${freeRemaining} free left)` : `0 🥔 (Còn ${freeRemaining} lượt free)`}
                    </Text>
                  </>
                ) : (
                  <Text style={[themeStyles.costFree, { color: '#dc2626' }]}>
                    {lang === 'en' ? '50 🥔 / upload' : '50 🥔 / lượt'}
                  </Text>
                )}
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* [GIẢI THÍCH CODE]: Lối tắt truy cập Tủ sách cá nhân (mục Sách tải lên) */}
        <View style={{ paddingHorizontal: 20, marginTop: 18 }}>
          <TouchableOpacity
            style={themeStyles.bookshelfShortcut}
            activeOpacity={0.85}
            onPress={() => navigate('bookshelf')}
          >
            <View style={themeStyles.bookshelfShortcutIcon}>
              <Ionicons name="library" size={22} color={isDarkMode ? '#818cf8' : '#1e3c72'} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={themeStyles.bookshelfShortcutTitle}>
                {lang === 'en' ? 'Go to Bookshelf' : 'Đến Tủ Sách Của Bạn'}
              </Text>
              <Text style={themeStyles.bookshelfShortcutDesc}>
                {lang === 'en'
                  ? 'View and read your uploaded books in the Uploaded tab'
                  : 'Xem và đọc tất cả sách bạn đã tải lên trong mục "Tải lên"'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={isDarkMode ? '#94a3b8' : '#64748b'} />
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
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
          <View style={styles.modalCard}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="book" size={22} color="#1e3c72" />
                <Text style={styles.modalTitle}>
                  {lang === 'en' ? 'PDF Upload Details' : 'Thông Tin Sách Tải Lên'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsModalVisible(false)}
                disabled={isUploading}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={{ maxHeight: 480 }}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingVertical: 6 }}
            >
              {/* Thẻ hiển thị tệp đã chọn từ điện thoại */}
              {selectedFile && (
                <View style={styles.selectedFileBox}>
                  <View style={styles.selectedFileIconWrap}>
                    <Ionicons name="document-text" size={24} color="#dc2626" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.selectedFileName} numberOfLines={1}>
                      {selectedFile.name}
                    </Text>
                    <Text style={styles.selectedFileSize}>
                      {formatFileSize(selectedFile.size)} • {lang === 'en' ? 'PDF Ready to read' : 'Tệp PDF sẵn sàng đọc'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.reselectBtn}
                    onPress={handlePickDocument}
                    disabled={isUploading}
                  >
                    <Text style={styles.reselectBtnText}>
                      {lang === 'en' ? 'Change' : 'Đổi tệp'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* 1. Nhập Tên Sách */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  {lang === 'en' ? 'Book Title' : 'Tên sách'}
                </Text>
                <TextInput
                  style={styles.textInput}
                  value={bookTitle}
                  onChangeText={setBookTitle}
                  placeholder={
                    lang === 'en'
                      ? 'e.g. Clean Code, Atomic Habits (Optional)'
                      : 'Ví dụ: Đắc Nhân Tâm, Hạt Giống Tâm Hồn (Tùy chọn)'
                  }
                  placeholderTextColor="#94a3b8"
                  editable={!isUploading}
                />
              </View>

              {/* 2. Nhập Tên Tác Giả */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  {lang === 'en' ? 'Author Name' : 'Tên tác giả'}
                </Text>
                <TextInput
                  style={styles.textInput}
                  value={bookAuthor}
                  onChangeText={setBookAuthor}
                  placeholder={
                    lang === 'en'
                      ? 'e.g. Robert C. Martin, Dale Carnegie...'
                      : 'Ví dụ: Dale Carnegie, Nguyễn Nhật Ánh...'
                  }
                  placeholderTextColor="#94a3b8"
                  editable={!isUploading}
                />
              </View>

              {/* 3. Thể loại sách đồng bộ với Backend */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
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
                          styles.categoryPill,
                          isSelected && styles.categoryPillActive,
                        ]}
                        onPress={() => setSelectedCategoryId(cat.category_id)}
                        disabled={isUploading}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.categoryPillText,
                            isSelected && styles.categoryPillTextActive,
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
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  {lang === 'en' ? 'Description (Optional)' : 'Mô tả tác phẩm (Tùy chọn)'}
                </Text>
                <TextInput
                  style={[styles.textInput, { height: 60, textAlignVertical: 'top', paddingTop: 8 }]}
                  value={bookDescription}
                  onChangeText={setBookDescription}
                  placeholder={
                    lang === 'en'
                      ? 'Brief description or notes about the document...'
                      : 'Tóm tắt hoặc ghi chú về tài liệu cá nhân...'
                  }
                  placeholderTextColor="#94a3b8"
                  multiline
                  numberOfLines={2}
                  editable={!isUploading}
                />
              </View>

              {/* 5. Chọn Ảnh Bìa Sách */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  {lang === 'en' ? 'Book Cover Image' : 'Ảnh bìa sách'}
                </Text>

                <View style={styles.coverPickerRow}>
                  <TouchableOpacity
                    style={styles.pickImageBtn}
                    activeOpacity={0.8}
                    onPress={handlePickCoverImage}
                    disabled={isUploading}
                  >
                    <Ionicons name="images-outline" size={18} color="#1e3c72" />
                    <Text style={styles.pickImageBtnText}>
                      {lang === 'en' ? 'Select Photo' : 'Chọn ảnh từ máy'}
                    </Text>
                  </TouchableOpacity>

                  {coverImageUri ? (
                    <TouchableOpacity
                      style={styles.removeImageBtn}
                      activeOpacity={0.8}
                      onPress={() => {
                        setCoverImageUri('');
                        setCoverImageName('');
                      }}
                      disabled={isUploading}
                    >
                      <Ionicons name="close-circle" size={16} color="#ef4444" />
                      <Text style={styles.removeImageBtnText}>
                        {lang === 'en' ? 'Remove' : 'Bỏ ảnh'}
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>

                {/* Xem trước ảnh bìa đã chọn */}
                {coverImageUri ? (
                  <View style={styles.coverPreviewCard}>
                    <Image
                      source={{ uri: coverImageUri }}
                      style={styles.coverPreviewImg}
                      resizeMode="cover"
                    />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.coverPreviewTitle} numberOfLines={1}>
                        {coverImageName || (lang === 'en' ? 'Selected Cover' : 'Ảnh bìa đã chọn')}
                      </Text>
                      <Text style={styles.coverPreviewSub}>
                        {lang === 'en' ? 'Cover ready to apply' : 'Đã gắn ảnh bìa cho sách'}
                      </Text>
                    </View>
                  </View>
                ) : null}
              </View>

              {/* Thông báo kết nối đồng bộ Backend Cloudinary & Web */}
              <View style={styles.syncNoticeBox}>
                <Ionicons name="cloud-upload-outline" size={16} color="#0284c7" />
                <Text style={styles.syncNoticeText}>
                  {lang === 'en'
                    ? 'Automatic sync with Cloudinary & Web Bookshelf'
                    : 'Tự động đồng bộ lên máy chủ Cloudinary & Tủ sách Web'}
                </Text>
              </View>
            </ScrollView>

            {/* Thanh hiển thị chi phí tải lên */}
            <View style={styles.modalCostRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontSize: 16 }}>{isUnlimited ? '👑' : isFree ? '🎁' : '🥔'}</Text>
                <Text style={[styles.modalCostText, !isFree && { color: '#dc2626' }]}>
                  {isUnlimited
                    ? (lang === 'en' ? 'VIP Unlimited Upload (0 🥔)' : 'Đặc quyền Đại Điền Chủ: Miễn phí vĩnh viễn (0 🥔)')
                    : isFree
                      ? (lang === 'en'
                        ? `Free Upload (${freeRemaining} remaining)`
                        : `Lượt tải miễn phí (${freeRemaining} lượt còn lại)`)
                      : (lang === 'en'
                        ? `Cost: 50 Potatoes (Balance: ${potatoBalance} 🥔)`
                        : `Phí tải: 50 Khoai (Ví hiện có: ${potatoBalance} 🥔)`)}
                </Text>
              </View>
            </View>

            {/* Modal Buttons: Upload & Hủy */}
            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                activeOpacity={0.8}
                onPress={() => setIsModalVisible(false)}
                disabled={isUploading}
              >
                <Text style={styles.modalCancelBtnText}>
                  {lang === 'en' ? 'Cancel' : 'Hủy'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalSubmitBtn,
                  !isFree && { backgroundColor: '#ea580c' },
                ]}
                activeOpacity={0.85}
                onPress={handleConfirmUpload}
                disabled={isUploading}
              >
                {isUploading ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <>
                    <Ionicons name="cloud-upload" size={18} color="#ffffff" style={{ marginRight: 6 }} />
                    <Text style={styles.modalSubmitBtnText}>
                      {isFree
                        ? (lang === 'en' ? 'Upload (Free)' : 'Upload (Miễn phí)')
                        : (lang === 'en' ? 'Upload (-50 🥔)' : 'Upload (Trừ 50 🥔)')}
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
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, backgroundColor: '#f4f5f7' },

  // Header đồng nhất
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 15,
    paddingBottom: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#1a1a1a' },
  headerIcon: { position: 'absolute', right: 20, bottom: 15 },

  scrollContainer: { flex: 1 },

  // Phần Upload
  uploadSection: {
    alignItems: 'center',
    paddingTop: 30,
    paddingBottom: 30,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
  },
  potatoIconWrapper: {
    position: 'relative',
    marginBottom: 10,
    marginTop: 10,
  },
  title: { fontSize: 22, fontWeight: '800', color: '#1a1a1a', marginTop: 15, marginBottom: 8 },
  subtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
    paddingHorizontal: 10,
  },

  // Nút Upload màu Here We Go
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#64b5f6',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 12,
    shadowColor: '#64b5f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 5,
  },
  uploadBtnText: { color: '#1e3c72', fontSize: 18, fontWeight: '800' },
  costRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  costStrikethrough: {
    color: '#1e3c72',
    textDecorationLine: 'line-through',
    opacity: 0.6,
    fontSize: 12,
  },
  costFree: { color: '#1e3c72', fontWeight: '800', fontSize: 13, marginLeft: 6 },

  divider: { height: 1, backgroundColor: '#eee' },

  // Lối tắt Tủ Sách
  bookshelfShortcut: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  bookshelfShortcutIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#eef2ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  bookshelfShortcutTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  bookshelfShortcutDesc: {
    fontSize: 12.5,
    color: '#64748b',
    marginTop: 2,
  },

  // Lịch sử Upload
  historySection: { padding: 20 },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  historyTitle: { fontSize: 18, fontWeight: '800', color: '#1a1a1a' },
  historyMore: { fontSize: 13, fontWeight: '600', color: '#3498db' },

  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emptyText: {
    fontSize: 13.5,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 20,
  },

  // Book Card
  bookCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f2f6',
  },
  bookCover: {
    width: 65,
    height: 90,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 14,
  },
  bookCoverImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  bookCoverPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  mockCoverText: {
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 4,
  },
  bookInfo: { flex: 1, justifyContent: 'center' },
  bookTitle: { fontSize: 15, fontWeight: '800', color: '#1a1a1a', marginBottom: 3 },
  bookAuthorText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 4,
  },
  bookChapter: { fontSize: 12, color: '#888', marginBottom: 6 },

  // Thanh tiến độ
  progressContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  progressBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: '#eee',
    borderRadius: 3,
    marginRight: 8,
    overflow: 'hidden',
  },
  progressBarFill: { height: '100%', backgroundColor: '#f39c12', borderRadius: 3 },
  progressPercentText: { fontSize: 11, fontWeight: '700', color: '#888' },

  fileStatusBox: { flexDirection: 'row', alignItems: 'center' },
  fileStatus: { fontSize: 12, fontWeight: '700', color: '#27ae60', marginLeft: 4 },
  fileDateText: { fontSize: 11.5, color: '#94a3b8', marginLeft: 6 },

  cardActionCol: {
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 80,
    marginLeft: 6,
  },
  continueBtn: {
    backgroundColor: '#fdf5e6',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#fad390',
  },
  continueBtnText: { color: '#e67e22', fontSize: 12.5, fontWeight: '700' },
  deleteBtn: {
    padding: 6,
  },

  // MODAL STYLES
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#0f172a',
  },

  // Selected File Box
  selectedFileBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  selectedFileIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#fef2f2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  selectedFileName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1e293b',
  },
  selectedFileSize: {
    fontSize: 11.5,
    color: '#64748b',
    marginTop: 2,
  },
  reselectBtn: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  reselectBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#2563eb',
  },

  // Rule Notice Box
  ruleNoticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
  },
  ruleNoticeText: {
    flex: 1,
    fontSize: 12,
    color: '#0369a1',
    lineHeight: 17,
    fontWeight: '600',
  },

  // Form Inputs
  inputGroup: {
    marginTop: 12,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13.5,
    color: '#0f172a',
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
    backgroundColor: '#e0f2fe',
    borderWidth: 1,
    borderColor: '#bae6fd',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  pickImageBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0369a1',
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
    fontWeight: '700',
    color: '#ef4444',
  },

  coverPreviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
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
    fontWeight: '700',
    color: '#1e293b',
  },
  coverPreviewSub: {
    fontSize: 11,
    color: '#16a34a',
    marginTop: 2,
    fontWeight: '600',
  },
  coverEmptyNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    paddingHorizontal: 4,
  },
  coverEmptyNoticeText: {
    fontSize: 11.5,
    color: '#94a3b8',
    fontStyle: 'italic',
  },

  // Modal Actions
  modalActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
  },
  modalCancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748b',
  },
  modalSubmitBtn: {
    flex: 1.5,
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  modalSubmitBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },

  // Quota & Tier Card
  quotaBox: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    padding: 12,
    marginTop: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  quotaTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  tierPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fde68a',
    gap: 6,
  },
  tierPillText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#92400e',
  },
  walletPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fcd34d',
    gap: 4,
  },
  walletPillText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#b45309',
  },
  quotaBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  quotaStatusText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#16a34a',
    flex: 1,
  },
  modalCostRow: {
    backgroundColor: '#f8fafc',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 10,
    marginBottom: 4,
  },
  modalCostText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1e293b',
    flex: 1,
  },

  // Category Pills
  categoryPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  categoryPillActive: {
    backgroundColor: '#1e3c72',
    borderColor: '#1e3c72',
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  categoryPillTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },

  // Sync Notice Box
  syncNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f0f9ff',
    padding: 10,
    borderRadius: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  syncNoticeText: {
    fontSize: 11.5,
    color: '#0369a1',
    fontWeight: '600',
    flex: 1,
  },
});
