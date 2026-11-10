import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Modal,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  X,
  Menu,
  List,
  Search,
  Bookmark,
  Star,
  Share2,
  Settings,
  Sun,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  CloudDownload,
  Check,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  Highlighter,
  FileText,
  Languages,
  Trash2,
} from 'lucide-react-native';
import { getBookRealChapters, Chapter } from './bookContentService';
import { useAppNavigation } from './navigation';

const { width, height } = Dimensions.get('window');

export interface ReaderProps {
  onBack: () => void;
  book?: any;
}

export interface HighlightItem {
  id: string;
  chapterIndex: number;
  chapterTitle: string;
  paragraphIndex: number;
  startIndex?: number;
  endIndex?: number;
  selectedText: string;
  note?: string;
  color?: string; // Mặc định vàng #FFE600
  createdAt: number;
}

export interface BookmarkItem {
  id: string;
  chapterIndex: number;
  chapterTitle: string;
  page: number;
  totalPages: number;
  percent: number;
  scrollY: number;
  snippet: string;
  createdAt: number;
}

const DEFAULT_HIGHLIGHTS: HighlightItem[] = [];

const getTextEndCoordinates = (
  paragraph: string,
  targetIdx: number,
  containerWidth: number,
  fontSize: number,
  lineHeight: number
): { x: number; line: number; y: number } => {
  const getCharWidth = (ch: string): number => {
    if (ch === ' ' || ch === '\t') return fontSize * 0.35;
    if ('ijlfrtI1!.,:;`|/\\()[]{}'.includes(ch)) return fontSize * 0.32;
    if ('mwMWODGQ@#%'.includes(ch)) return fontSize * 0.78;
    return fontSize * 0.52;
  };

  const words = paragraph.split(/(\s+)/);
  let currentLine = 0;
  let currentLineWidth = 0;
  let charCount = 0;
  let endX = 0;
  let endLine = 0;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    let wordWidth = 0;
    for (let c = 0; c < word.length; c++) {
      wordWidth += getCharWidth(word[c]);
    }

    const wordStartIdx = charCount;
    const wordEndIdx = charCount + word.length;

    if (word.trim().length > 0 && currentLineWidth + wordWidth > containerWidth && currentLineWidth > 0) {
      currentLine++;
      currentLineWidth = 0;
    }

    if (targetIdx >= wordStartIdx && targetIdx <= wordEndIdx) {
      const charsInWord = targetIdx - wordStartIdx;
      let subWidth = 0;
      for (let c = 0; c < charsInWord; c++) {
        subWidth += getCharWidth(word[c]);
      }
      endX = currentLineWidth + subWidth;
      endLine = currentLine;
      break;
    }

    currentLineWidth += wordWidth;
    charCount += word.length;

    if (charCount >= targetIdx) {
      endX = currentLineWidth;
      endLine = currentLine;
      break;
    }
  }

  return {
    x: Math.max(0, Math.min(endX, containerWidth)),
    line: endLine,
    y: (endLine + 1) * lineHeight,
  };
};

const DEFAULT_BOOKMARKS: BookmarkItem[] = [
  {
    id: 'bm-demo-1',
    chapterIndex: 0,
    chapterTitle: 'Chương 1 - Khởi đầu của sự kết thúc',
    page: 27,
    totalPages: 1280,
    percent: 2,
    scrollY: 160,
    snippet: 'Lưu viện Quan Trung, trong con hẻm nhỏ với những cửa hàng to nhỏ đủ cỡ nằm chen chúc...',
    createdAt: Date.now() - 86400000,
  },
];

const translateSentence = (text: string): string => {
  const dictionary: Record<string, string> = {
    'Lưu viện Quan Trung, trong con hẻm nhỏ với những cửa hàng to nhỏ đủ cỡ nằm chen chúc, chất đầy các loại đồ cổ loang lổ vết gỉ sét, khó lòng phân biệt thật giả, chẳng hạn như tiền xu, con dấu, đồ dùng bằng xương hoặc sừng, thư pháp và bản dập...':
      'At Quan Trung Institute, in a narrow alley crowded with shops of all sizes filled with rusted antiques—hard to tell real from fake, such as coins, seals, bone or horn utensils, calligraphy and rubbings...',
    'Lúc này, vạn vật đều bị bao phủ bởi cơn mưa lớn bất tận.':
      'At this moment, all things were shrouded by an endless torrential rain.',
    'Bên trong tiệm thoang thoảng mùi giấy cũ và hương trầm lâu năm.':
      'Inside the antique shop, there was a faint aroma of aged paper and time-honored incense.',
    '“Cậu tìm món đồ nào đặc biệt sao?” – Một giọng nói khàn đợt vang lên từ phía góc tối của căn phòng, phá tan sự tĩnh mịch của màn đêm.':
      '"Are you looking for something special?" – A hoarse voice arose from the dark corner of the room, shattering the stillness of the night.',
    'Cánh cửa gỗ mục kẽo kẹt mở ra trong màn đêm tịch mịch.':
      'The decayed wooden door creaked open into the solitary night.',
    'Mùi hương trầm thoang thoảng trộn lẫn với mùi ẩm mốc của giấy cũ.':
      'A delicate scent of incense mingled with the damp smell of aged paper.',
    'Trên chiếc bàn gỗ mahogany đặt một cuốn sổ tay bám đầy bụi thời gian.':
      'On the mahogany table lay a notebook covered in the dust of time.',
    'Bên ngoài, tiếng sấm gầm rú xé toạc bầu trời, hắt ánh chớp xanh ngắt vào căn phòng nhỏ.':
      'Outside, thunder roared tearing the sky apart, casting blue flashes of lightning into the tiny room.',
    'Ánh trăng nhợt nhạt hắt qua khung cửa sổ vỡ vụn, chiếu rọi lên những vệt sơn đỏ thẫm trên bức tường bê tông.':
      'Pale moonlight filtered through the shattered window, illuminating deep red paint streaks on the concrete wall.',
    'Bốn phần ấy là: tâm lý học, luận lý học, siêu vật học, và luân lý học.':
      'Those four parts are: psychology, logic, metaphysics, and ethics.',
  };

  const trimmed = text.trim();
  if (dictionary[trimmed]) return dictionary[trimmed];

  return `English translation: "${trimmed}"`;
};

// Danh sách bài hát đọc sách phong cách Spotify (Minh họa UI tượng trưng)
interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  duration: string;
  category: 'saved' | 'explore';
}

const INITIAL_SPOTIFY_TRACKS: MusicTrack[] = [
  { id: '1', title: 'Dương Cầm Đêm Khuya Tĩnh Lặng', artist: 'Tác giả: Yiruma', duration: '3:45', category: 'saved' },
  { id: '2', title: 'Tiếng Mưa Rào Ban Trưa Dịu Mát', artist: 'Tác giả: Nature Soundscape', duration: '4:12', category: 'saved' },
  { id: '3', title: 'Suối Rừng & Tiếng Gió Ngàn Reo', artist: 'Tác giả: Dan Gibson', duration: '5:02', category: 'explore' },
  { id: '4', title: 'Quán Cà Phê Cổ Điển Mùa Đông', artist: 'Tác giả: Lofi Beats', duration: '3:20', category: 'explore' },
  { id: '5', title: 'Ánh Trăng Mùa Thu Dịu Dàng', artist: 'Tác giả: Claude Debussy', duration: '4:30', category: 'explore' },
  { id: '6', title: 'Khúc Tĩnh Tâm Thiền Định Bên Trà', artist: 'Tác giả: Kitaro', duration: '4:15', category: 'saved' },
  { id: '7', title: 'Mây Trắng Bay Về Chân Trời Xa', artist: 'Tác giả: Sungha Jung', duration: '3:50', category: 'explore' },
  { id: '8', title: 'Đêm Thao Thức Cùng Trang Sách Cũ', artist: 'Tác giả: Ludovico Einaudi', duration: '5:10', category: 'explore' },
];

// 6 Chủ đề chuẩn xác như hình ảnh (Ảnh 3)
export interface ReaderTheme {
  id: string;
  name: string;
  bg: string;
  cardBg: string;
  text: string;
  subText: string;
  border: string;
  primary: string;
  isDark: boolean;
  isBold?: boolean;
  hasStar?: boolean;
}

const THEME_OPTIONS: Record<string, ReaderTheme> = {
  original: {
    id: 'original',
    name: 'Nguyên bản',
    bg: '#FFFFFF',
    cardBg: '#F5F5F7',
    text: '#1C1C1E',
    subText: '#6C6C70',
    border: '#E5E5EA',
    primary: '#007AFF',
    isDark: false,
  },
  quiet: {
    id: 'quiet',
    name: 'Yên tĩnh',
    bg: '#34383D',
    cardBg: '#44484E',
    text: '#F2F2F7',
    subText: '#A0A4A8',
    border: '#52575F',
    primary: '#D1D5DB',
    isDark: true,
    hasStar: true,
  },
  paper: {
    id: 'paper',
    name: 'Giấy',
    bg: '#FBF7EE',
    cardBg: '#F1EBDC',
    text: '#2D261E',
    subText: '#7D7466',
    border: '#E8E1CE',
    primary: '#8C673B',
    isDark: false,
  },
  bold: {
    id: 'bold',
    name: 'Đậm',
    bg: '#FFFFFF',
    cardBg: '#F2F2F7',
    text: '#000000',
    subText: '#555558',
    border: '#D1D1D6',
    primary: '#111111',
    isDark: false,
    isBold: true,
  },
  sepia: {
    id: 'sepia',
    name: 'Êm dịu',
    bg: '#F5ECD7',
    cardBg: '#EBDCB9',
    text: '#3A2E1E',
    subText: '#85735B',
    border: '#DFCDA6',
    primary: '#8A5818',
    isDark: false,
  },
  focus: {
    id: 'focus',
    name: 'Tập trung',
    bg: '#000000',
    cardBg: '#1A1A1A',
    text: '#E5E5EA',
    subText: '#8E8E93',
    border: '#333333',
    primary: '#FFFFFF',
    isDark: true,
    hasStar: true,
  },
};

// 10 loại phông chữ chuẩn đọc sách chất lượng cao
export interface FontOption {
  id: string;
  name: string;
  desc: string;
  fontFamily: string;
}

const BOOK_FONTS: FontOption[] = [
  { id: 'system', name: 'Hệ thống (San Francisco)', desc: 'Mặc định sắc nét, rõ ràng trên mọi màn hình', fontFamily: 'System' },
  { id: 'georgia', name: 'Georgia', desc: 'Serif thanh lịch, tiêu chuẩn sách in cổ điển', fontFamily: 'Georgia' },
  { id: 'times', name: 'Times New Roman', desc: 'Cổ điển, trang trọng, quen thuộc với sách văn học', fontFamily: 'Times New Roman' },
  { id: 'palatino', name: 'Palatino Linotype', desc: 'Văn học cổ điển Ý, đường nét ấm áp', fontFamily: 'Palatino' },
  { id: 'baskerville', name: 'Baskerville', desc: 'Tiểu thuyết lãng mạn trang nhã thế kỷ 18', fontFamily: 'Baskerville' },
  { id: 'merriweather', name: 'Merriweather', desc: 'Độ tương phản cao, êm mắt khi đọc ban đêm', fontFamily: 'Georgia' },
  { id: 'lora', name: 'Lora', desc: 'Thư thái, mộc mạc phong cách văn thơ', fontFamily: 'Georgia' },
  { id: 'sans', name: 'Sans-Serif (Hiện đại)', desc: 'Hiện đại, không chân, mắt không mỏi', fontFamily: 'Helvetica' },
  { id: 'courier', name: 'Courier (Máy đánh chữ)', desc: 'Monospace hoài niệm, ngắt nhịp đều đặn', fontFamily: 'Courier' },
  { id: 'bookerly', name: 'Bookerly', desc: 'Thiết kế tối ưu công thái học riêng cho người đọc', fontFamily: 'Georgia' },
];

// Component chạy chữ ngang đi đi lại lại nếu tên bài hát quá dài
function MarqueeText({ text, style }: { text: string; style: any }) {
  const animatedX = useRef(new Animated.Value(0)).current;
  const [containerWidth, setContainerWidth] = useState(0);
  const [textWidth, setTextWidth] = useState(0);

  useEffect(() => {
    animatedX.setValue(0);
    const overflow = textWidth - containerWidth;
    if (overflow > 4) {
      const duration = Math.max(2800, overflow * 45);
      const animation = Animated.loop(
        Animated.sequence([
          Animated.delay(1200), // Đợi 1.2s ở đầu
          Animated.timing(animatedX, {
            toValue: -overflow - 10,
            duration,
            useNativeDriver: true,
          }),
          Animated.delay(1200), // Đợi 1.2s ở cuối
          Animated.timing(animatedX, {
            toValue: 0,
            duration,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
      return () => animation.stop();
    }
  }, [text, textWidth, containerWidth]);

  return (
    <View
      style={styles.marqueeContainer}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      <Animated.Text
        onLayout={(e) => setTextWidth(e.nativeEvent.layout.width)}
        numberOfLines={1}
        style={[
          style,
          {
            transform: [{ translateX: animatedX }],
            textAlign: textWidth <= containerWidth ? 'center' : 'left',
          },
        ]}
      >
        {text}
      </Animated.Text>
    </View>
  );
}

export default function ManHinhDoc({ onBack, book }: ReaderProps) {
  const insets = useSafeAreaInsets();
  const { setFooterVisible } = useAppNavigation();

  // 1. Luôn ẩn Footer của toàn app khi đọc sách
  useEffect(() => {
    setFooterVisible?.(false);
    return () => {
      setFooterVisible?.(true);
    };
  }, [setFooterVisible]);

  // 2. Dữ liệu chương sách từ tác phẩm thực tế
  const chapters = useMemo(() => getBookRealChapters(book), [book]);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(
    typeof book?.initialChapterIndex === 'number' ? book.initialChapterIndex : 0
  );

  useEffect(() => {
    if (typeof book?.initialChapterIndex === 'number') {
      setCurrentChapterIndex(book.initialChapterIndex);
    }
  }, [book?.initialChapterIndex]);

  const activeChapter: Chapter = chapters[currentChapterIndex] || chapters[0] || {
    id: 1,
    title: 'Đang tải tác phẩm...',
    subtitle: '',
    content: ['Vui lòng đợi trong giây lát...'],
  };

  // 3. Cơ chế điều khiển:
  // - Khi đang đọc: Màn hình không có gì cả, cuộn lướt 100% mượt mà
  // - Bấm 1 lần vô màn hình: CHỈ hoạt động khi cần hiển thị (hiện nút X, tiến trình ở giữa dưới, nút 3 gạch)
  // - Khi ẩn đi: lướt xuống hoặc lướt lên là tự động ẩn ngay lập tức!
  const [showControls, setShowControls] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isTocOpen, setIsTocOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Cài đặt phông chữ & Tìm kiếm
  const [fontSize, setFontSize] = useState<number>(18);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  // Dấu trang & Vùng tô sáng
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>(DEFAULT_BOOKMARKS);
  const [highlights, setHighlights] = useState<HighlightItem[]>(DEFAULT_HIGHLIGHTS);
  const [isBookmarksModalOpen, setIsBookmarksModalOpen] = useState(false);
  const [bookmarksActiveTab, setBookmarksActiveTab] = useState<'bookmarks' | 'highlights'>('bookmarks');

  // Load và lưu bền vững Dấu trang vào AsyncStorage
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        const savedHl = await AsyncStorage.getItem(`@halm_reader_highlights_${book?.id || 'demo'}`);
        if (savedHl) {
          const parsed = JSON.parse(savedHl);
          if (Array.isArray(parsed)) {
            setHighlights(parsed.filter((h: any) => h.id !== 'hl-demo-1' && h.id !== 'hl-demo-2'));
          }
        }
        const savedBm = await AsyncStorage.getItem(`@halm_reader_bookmarks_${book?.id || 'demo'}`);
        if (savedBm) setBookmarks(JSON.parse(savedBm));
      } catch (e) {
        // ignore
      }
    };
    loadSavedData();
  }, [book?.id]);

  useEffect(() => {
    AsyncStorage.setItem(
      `@halm_reader_highlights_${book?.id || 'demo'}`,
      JSON.stringify(highlights)
    ).catch(() => {});
  }, [highlights, book?.id]);

  // =========================================================================
  // BÔI ĐEN VĂN BẢN VÀ THANH CÔNG CỤ HALMBOOK (3 CHỨC NĂNG)
  // CHẶN HOÀN TOÀN MENU COPY / SELECT ALL CỦA HỆ ĐIỀU HÀNH
  // =========================================================================
  interface SelectedTextRange {
    paragraphIndex: number;
    startIndex: number;
    endIndex: number;
    text: string;
    highlightId?: string;
  }

  const [selectedRange, setSelectedRange] = useState<SelectedTextRange | null>(null);
  const [isToolbarVisible, setIsToolbarVisible] = useState(false);
  const [toolbarCoords, setToolbarCoords] = useState<{ top: number; left: number } | null>(null);
  const [chapterHeaderHeight, setChapterHeaderHeight] = useState(120);
  const paragraphLayouts = useRef<Record<number, { x: number; y: number; width: number; height: number }>>({});
  const paragraphRefs = useRef<Record<number, any>>({});

  // Cập nhật vị trí thanh công cụ nổi bám sát cuối vùng bôi đen
  const updateToolbarPosition = useCallback(
    (pIdx: number, sIdx: number, eIdx: number) => {
      const paragraph = activeChapter.content[pIdx];
      if (!paragraph) return;

      const pLayout = paragraphLayouts.current[pIdx];
      const pWidth = pLayout?.width || width - 44;
      const pLineHeight = Math.round(fontSize * 1.7);

      const startCoords = getTextEndCoordinates(paragraph, sIdx, pWidth, fontSize, pLineHeight);
      const endCoords = getTextEndCoordinates(paragraph, eIdx, pWidth, fontSize, pLineHeight);

      const TOOLBAR_WIDTH = 285;
      const TOOLBAR_HEIGHT = 44;
      const SCREEN_PADDING = 14;
      const paddingTop = insets.top + (isSearchOpen ? 88 : 28);
      const maxAllowedBottom = height - insets.bottom - 16;

      // 1. Tính toán ước lượng ngay lập tức dựa trên Scroll & Layout cache (đồng bộ, 0 latency)
      const pScreenY = (pLayout ? pLayout.y : 0) - currentScrollYRef.current + paddingTop + chapterHeaderHeight;
      const pScreenX = 22 + 4; // paddingHorizontal 22 (scrollContent) + 4 (paragraphContainer)

      const absEndX = pScreenX + endCoords.x;
      const absEndY = pScreenY + endCoords.y;
      const absStartY = pScreenY + startCoords.line * pLineHeight;

      let top = absEndY + 8;
      if (top + TOOLBAR_HEIGHT > maxAllowedBottom) {
        // Nếu phía dưới không đủ không gian, hiển thị phía trên vùng chọn
        top = Math.max(insets.top + 10, absStartY - TOOLBAR_HEIGHT - 8);
      }
      let left = absEndX - TOOLBAR_WIDTH / 2;
      // Tự động dịch sang trái nếu gần mép phải màn hình, hoặc dịch sang phải nếu gần mép trái
      left = Math.max(SCREEN_PADDING, Math.min(width - TOOLBAR_WIDTH - SCREEN_PADDING, left));

      setToolbarCoords({ top, left });

      // 2. Tinh chỉnh chính xác tuyệt đối qua measureInWindow từ hardware display server
      const pRef = paragraphRefs.current[pIdx];
      if (pRef && pRef.measureInWindow) {
        pRef.measureInWindow((wx: number, wy: number) => {
          if (typeof wy === 'number' && !isNaN(wy)) {
            const winAbsEndX = wx + 4 + endCoords.x;
            const winAbsEndY = wy + 2 + endCoords.y;
            const winAbsStartY = wy + 2 + startCoords.line * pLineHeight;

            let winTop = winAbsEndY + 8;
            if (winTop + TOOLBAR_HEIGHT > maxAllowedBottom) {
              winTop = Math.max(insets.top + 10, winAbsStartY - TOOLBAR_HEIGHT - 8);
            }
            let winLeft = winAbsEndX - TOOLBAR_WIDTH / 2;
            winLeft = Math.max(SCREEN_PADDING, Math.min(width - TOOLBAR_WIDTH - SCREEN_PADDING, winLeft));

            setToolbarCoords({ top: winTop, left: winLeft });
          }
        });
      }
    },
    [activeChapter.content, fontSize, insets.bottom, insets.top, isSearchOpen, chapterHeaderHeight]
  );

  // Modal Ghi chú
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [noteInputText, setNoteInputText] = useState('');

  // Modal Dịch thuật
  const [isTranslationModalOpen, setIsTranslationModalOpen] = useState(false);
  const [isTranslationLoading, setIsTranslationLoading] = useState(false);
  const [currentTranslation, setCurrentTranslation] = useState<{
    original: string;
    translated: string;
  } | null>(null);

  // Tự động hủy vùng chọn khi chuyển chương
  useEffect(() => {
    setSelectedRange(null);
    setIsToolbarVisible(false);
    setToolbarCoords(null);
  }, [currentChapterIndex]);

  // Xử lý sự kiện thay đổi vùng chọn từ TextInput Layer 2
  const handleParagraphSelectionChange = (
    pIdx: number,
    paragraph: string,
    start: number,
    end: number
  ) => {
    if (start !== end) {
      // TRẠNG THÁI 1: Đang chọn văn bản (kéo handles hoặc bôi đen đoạn mới)
      const min = Math.min(start, end);
      const max = Math.max(start, end);
      const text = paragraph.substring(min, max);
      if (text.trim().length > 0) {
        // Tìm xem đoạn này có trùng khít với vùng đã tô sáng trước đó không
        const matchedHl = highlights.find((h) => {
          if (h.chapterIndex !== currentChapterIndex || h.paragraphIndex !== pIdx) return false;
          const s = h.startIndex !== undefined ? h.startIndex : paragraph.indexOf(h.selectedText);
          const e = h.endIndex !== undefined ? h.endIndex : s + h.selectedText.length;
          return s !== -1 && min === s && max === e;
        });

        setSelectedRange({
          paragraphIndex: pIdx,
          startIndex: min,
          endIndex: max,
          text: text.trim(),
          highlightId: matchedHl?.id,
        });
        setIsToolbarVisible(true);
        updateToolbarPosition(pIdx, min, max);
      }
    } else {
      // Khi nhấn vào 1 điểm (start === end)

      // 1. Kiểm tra xem có đang chạm vào chính vùng văn bản đang được chọn không
      if (
        selectedRange &&
        selectedRange.paragraphIndex === pIdx &&
        start >= selectedRange.startIndex &&
        start <= selectedRange.endIndex
      ) {
        // TRẠNG THÁI 3: Chạm vào chính vùng chọn đang có -> Hiện lại thanh công cụ!
        setIsToolbarVisible(true);
        updateToolbarPosition(pIdx, selectedRange.startIndex, selectedRange.endIndex);
        return;
      }

      // 2. Nếu đang có vùng chọn nhưng chạm RA NGOÀI vùng chọn
      if (selectedRange) {
        if (isToolbarVisible) {
          // TRẠNG THÁI 2: Chạm ngoài lần 1 -> Ẩn toolbar nhưng GIỮ NGUYÊN vùng chọn!
          setIsToolbarVisible(false);
          return;
        } else {
          // TRẠNG THÁI 4: Đã ẩn toolbar, chạm ngoài lần 2 -> XÓA HOÀN TOÀN vùng chọn!
          setSelectedRange(null);
          setIsToolbarVisible(false);
          setToolbarCoords(null);
          return;
        }
      }

      // 3. Nếu chưa có selection nào: kiểm tra xem có chạm vào Highlight đã lưu từ trước không
      const clickedHl = highlights.find((h) => {
        if (h.chapterIndex !== currentChapterIndex || h.paragraphIndex !== pIdx) return false;
        const s = h.startIndex !== undefined ? h.startIndex : paragraph.indexOf(h.selectedText);
        const e = h.endIndex !== undefined ? h.endIndex : s + h.selectedText.length;
        return s !== -1 && start >= s && start <= e;
      });

      if (clickedHl) {
        const s =
          clickedHl.startIndex !== undefined
            ? clickedHl.startIndex
            : paragraph.indexOf(clickedHl.selectedText);
        const e =
          clickedHl.endIndex !== undefined
            ? clickedHl.endIndex
            : s + clickedHl.selectedText.length;
        setSelectedRange({
          paragraphIndex: pIdx,
          startIndex: s,
          endIndex: e,
          text: clickedHl.selectedText,
          highlightId: clickedHl.id,
        });
        setIsToolbarVisible(true);
        updateToolbarPosition(pIdx, s, e);
      }
    }
  };

  // Hành động: Bấm nút Tô sáng (lưu màu vàng #FFE600 vào danh sách)
  const handleToggleHighlight = () => {
    if (!selectedRange) return;
    if (selectedRange.highlightId) {
      setHighlights((prev) => prev.filter((h) => h.id !== selectedRange.highlightId));
      setSelectedRange(null);
      setIsToolbarVisible(false);
      setToolbarCoords(null);
      showToast('Đã xóa vùng tô sáng');
    } else {
      const newHl: HighlightItem = {
        id: `hl-${Date.now()}`,
        chapterIndex: currentChapterIndex,
        chapterTitle: activeChapter.title,
        paragraphIndex: selectedRange.paragraphIndex,
        startIndex: selectedRange.startIndex,
        endIndex: selectedRange.endIndex,
        selectedText: selectedRange.text,
        color: '#FFE600',
        createdAt: Date.now(),
      };
      setHighlights((prev) => [newHl, ...prev]);
      setSelectedRange(null);
      setIsToolbarVisible(false);
      setToolbarCoords(null);
      showToast('Đã lưu vùng tô sáng');
    }
  };

  // Hành động: Mở Modal Ghi chú
  const handleOpenNoteModal = () => {
    if (!selectedRange) return;
    const existing = highlights.find(
      (h) =>
        h.id === selectedRange.highlightId ||
        (h.chapterIndex === currentChapterIndex &&
          h.paragraphIndex === selectedRange.paragraphIndex &&
          (h.selectedText === selectedRange.text || selectedRange.text.includes(h.selectedText)))
    );
    setNoteInputText(existing?.note || '');
    setIsNoteModalOpen(true);
  };

  // Hành động: Lưu Ghi chú
  const handleSaveNote = () => {
    if (!selectedRange) return;
    const trimmed = noteInputText.trim();
    setHighlights((prev) => {
      const idx = prev.findIndex(
        (h) =>
          h.id === selectedRange.highlightId ||
          (h.chapterIndex === currentChapterIndex &&
            h.paragraphIndex === selectedRange.paragraphIndex &&
            (h.selectedText === selectedRange.text || selectedRange.text.includes(h.selectedText)))
      );
      if (idx !== -1) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], note: trimmed || undefined };
        return copy;
      } else {
        const newHl: HighlightItem = {
          id: `hl-${Date.now()}`,
          chapterIndex: currentChapterIndex,
          chapterTitle: activeChapter.title,
          paragraphIndex: selectedRange.paragraphIndex,
          startIndex: selectedRange.startIndex,
          endIndex: selectedRange.endIndex,
          selectedText: selectedRange.text,
          note: trimmed || undefined,
          color: '#FFE600',
          createdAt: Date.now(),
        };
        return [newHl, ...prev];
      }
    });
    setIsNoteModalOpen(false);
    showToast('Đã lưu ghi chú thành công');
  };

  // Hành động: Mở Modal Dịch thuật
  const handleOpenTranslation = () => {
    if (!selectedRange) return;
    const q = selectedRange.text.trim();
    setIsTranslationLoading(true);
    setIsTranslationModalOpen(true);

    setTimeout(() => {
      const translated = translateSentence(q);
      setCurrentTranslation({ original: q, translated });
      setIsTranslationLoading(false);
    }, 250);
  };








  // Tìm kiếm trong tác phẩm (phong cách Ctrl+F)
  const searchMatches = useMemo(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) return [];
    const query = searchQuery.toLowerCase().trim();
    const results: { chapterIndex: number; paragraphIndex: number; startIndex: number; text: string }[] = [];
    chapters.forEach((ch, chIdx) => {
      ch.content.forEach((para, pIdx) => {
        const lowerPara = para.toLowerCase();
        let startPos = 0;
        while ((startPos = lowerPara.indexOf(query, startPos)) !== -1) {
          results.push({
            chapterIndex: chIdx,
            paragraphIndex: pIdx,
            startIndex: startPos,
            text: query,
          });
          startPos += query.length;
        }
      });
    });
    return results;
  }, [searchQuery, chapters]);

  const currentMatch = searchMatches[currentMatchIndex];

  const handleNextMatch = () => {
    if (searchMatches.length === 0) return;
    const nextIdx = (currentMatchIndex + 1) % searchMatches.length;
    setCurrentMatchIndex(nextIdx);
    const target = searchMatches[nextIdx];
    if (target && target.chapterIndex !== currentChapterIndex) {
      setCurrentChapterIndex(target.chapterIndex);
    }
  };

  const handlePrevMatch = () => {
    if (searchMatches.length === 0) return;
    const prevIdx = (currentMatchIndex - 1 + searchMatches.length) % searchMatches.length;
    setCurrentMatchIndex(prevIdx);
    const target = searchMatches[prevIdx];
    if (target && target.chapterIndex !== currentChapterIndex) {
      setCurrentChapterIndex(target.chapterIndex);
    }
  };

  const renderSnippetWithBold = (fullText: string, query: string) => {
    if (!fullText || !query) return <Text>{fullText}</Text>;
    const lower = fullText.toLowerCase();
    const idx = lower.indexOf(query.toLowerCase());
    if (idx === -1) return <Text>{fullText}</Text>;

    const start = Math.max(0, idx - 25);
    const end = Math.min(fullText.length, idx + query.length + 35);
    const prefix = start > 0 ? '...' : '';
    const suffix = end < fullText.length ? '...' : '';

    const before = fullText.substring(start, idx);
    const match = fullText.substring(idx, idx + query.length);
    const after = fullText.substring(idx + query.length, end);

    return (
      <Text>
        {prefix}
        {before}
        <Text style={{ fontWeight: '900', color: '#007AFF' }}>{match}</Text>
        {after}
        {suffix}
      </Text>
    );
  };

  const renderHighlightedParagraph = (paragraph: string, pIdx: number) => {
    if (!isSearchOpen || !searchQuery.trim() || searchQuery.trim().length < 2) {
      return paragraph;
    }
    const query = searchQuery.trim();
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    const parts = paragraph.split(regex);

    return parts.map((part, i) => {
      if (part.toLowerCase() === query.toLowerCase()) {
        const isCurrentMatch =
          currentMatch &&
          currentMatch.chapterIndex === currentChapterIndex &&
          currentMatch.paragraphIndex === pIdx;

        return (
          <Text
            key={i}
            style={{
              fontWeight: '900',
              backgroundColor: isCurrentMatch ? '#FF9500' : '#FFE600',
              color: '#000000',
              borderRadius: 3,
            }}
          >
            {part}
          </Text>
        );
      }
      return part;
    });
  };

  // Hiển thị đoạn văn: định dạng các vùng đã tô sáng (Highlight), ghi chú và kết quả tìm kiếm
  const renderFormattedParagraph = (paragraph: string, pIdx: number) => {
    if (isSearchOpen && searchQuery.trim().length >= 2) {
      return renderHighlightedParagraph(paragraph, pIdx);
    }

    const paraHighlights = highlights
      .filter((h) => h.chapterIndex === currentChapterIndex && paragraph.includes(h.selectedText))
      .map((h) => {
        const sIdx = h.startIndex !== undefined ? h.startIndex : paragraph.indexOf(h.selectedText);
        const eIdx = h.endIndex !== undefined ? h.endIndex : sIdx + h.selectedText.length;
        return { ...h, resolvedStart: sIdx, resolvedEnd: eIdx };
      })
      .filter((h) => h.resolvedStart !== -1 && h.resolvedEnd > h.resolvedStart)
      .sort((a, b) => a.resolvedStart - b.resolvedStart);

    if (paraHighlights.length === 0) {
      return paragraph;
    }

    const elements: React.ReactNode[] = [];
    let currentOffset = 0;

    paraHighlights.forEach((hl, i) => {
      if (hl.resolvedStart > currentOffset) {
        elements.push(
          <Text key={`txt-${pIdx}-${currentOffset}`}>
            {paragraph.substring(currentOffset, hl.resolvedStart)}
          </Text>
        );
      }

      const hlStart = Math.max(currentOffset, hl.resolvedStart);
      const hlEnd = Math.max(hlStart, hl.resolvedEnd);

      if (hlEnd > hlStart) {
        elements.push(
          <Text
            key={`hl-${hl.id || i}`}
            style={{
              backgroundColor: hl.color || '#FFE600',
              borderRadius: 2,
            }}
          >
            {paragraph.substring(hlStart, hlEnd)}
            {hl.note ? ' 📝' : ''}
          </Text>
        );
        currentOffset = hlEnd;
      }
    });

    if (currentOffset < paragraph.length) {
      elements.push(
        <Text key={`txt-${pIdx}-${currentOffset}`}>
          {paragraph.substring(currentOffset)}
        </Text>
      );
    }

    return elements;
  };

  // Toast thông báo
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<any>(null);

  const showToast = (msg: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 1800);
  };

  // Cài đặt hiển thị, Chủ đề & Phông chữ (10 loại)
  const [themeKey, setThemeKey] = useState<string>('paper');
  const [brightness, setBrightness] = useState<number>(0.85);
  const [fontFamilyId, setFontFamilyId] = useState<string>('georgia');
  const [fontSearchQuery, setFontSearchQuery] = useState<string>('');

  const currentTheme = THEME_OPTIONS[themeKey] || THEME_OPTIONS.paper;
  const currentFont = BOOK_FONTS.find((f) => f.id === fontFamilyId) || BOOK_FONTS[1];

  const filteredFonts = useMemo(() => {
    if (!fontSearchQuery.trim()) return BOOK_FONTS;
    const q = fontSearchQuery.toLowerCase().trim();
    return BOOK_FONTS.filter(
      (f) => f.name.toLowerCase().includes(q) || f.desc.toLowerCase().includes(q)
    );
  }, [fontSearchQuery]);

  // Tiến trình đọc
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const totalBookPages = Math.max(100, chapters.length * 35);
  const currentPage = Math.max(
    1,
    Math.round(
      ((currentChapterIndex + scrollProgress) / Math.max(1, chapters.length)) * totalBookPages
    )
  );
  const totalPercent = Math.min(
    100,
    Math.round(((currentChapterIndex + scrollProgress) / Math.max(1, chapters.length)) * 100)
  );

  const scrollViewRef = useRef<any>(null);
  const currentScrollYRef = useRef<number>(0);

  // Nhận diện dấu trang chuẩn xác theo Tiến độ & Trang hiện tại
  // Nếu đang ở 35% có dấu trang -> Sáng tích chọn
  // Khi cuộn sang 36% -> Tự động BỎ TÍCH ngay lập tức!
  // Nhấn lưu ở 36% -> Lưu dấu trang mới tại 36%!
  const currentMatchingBookmark = useMemo(() => {
    return bookmarks.find(
      (b) =>
        b.chapterIndex === currentChapterIndex &&
        (b.percent === totalPercent || Math.abs(b.percent - totalPercent) < 1)
    );
  }, [bookmarks, currentChapterIndex, totalPercent]);

  const isCurrentPositionBookmarked = !!currentMatchingBookmark;

  const toggleBookmarkCurrentPosition = () => {
    if (currentMatchingBookmark) {
      // Đang ở đúng vị trí dấu trang -> Gỡ dấu trang
      setBookmarks((prev) => prev.filter((b) => b.id !== currentMatchingBookmark.id));
      showToast(`Đã gỡ dấu trang (Trang ${currentMatchingBookmark.page} • ${currentMatchingBookmark.percent}%)`);
    } else {
      // Đang ở vị trí mới (ví dụ 36%) -> Tạo dấu trang mới tại vị trí này!
      const currentParagraphIndex = Math.min(
        activeChapter.content.length - 1,
        Math.floor(scrollProgress * activeChapter.content.length)
      );
      const snippet =
        activeChapter.content[currentParagraphIndex]?.substring(0, 110) || activeChapter.title;

      const newBm: BookmarkItem = {
        id: `bm-${Date.now()}`,
        chapterIndex: currentChapterIndex,
        chapterTitle: activeChapter.title,
        page: currentPage,
        totalPages: totalBookPages,
        percent: totalPercent,
        scrollY: currentScrollYRef.current || 0,
        snippet,
        createdAt: Date.now(),
      };
      setBookmarks((prev) => [newBm, ...prev]);
      showToast(`Đã kẹp dấu trang: Trang ${currentPage} (${totalPercent}%)`);
    }
  };

  const handleJumpToBookmark = (bm: BookmarkItem) => {
    setIsBookmarksModalOpen(false);
    setIsMenuOpen(false);
    if (bm.chapterIndex !== currentChapterIndex) {
      setCurrentChapterIndex(bm.chapterIndex);
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: bm.scrollY, animated: true });
      }, 250);
    } else {
      scrollViewRef.current?.scrollTo({ y: bm.scrollY, animated: true });
    }
    showToast(`Đã chuyển tới Trang ${bm.page} (${bm.percent}%)`);
  };

  const lastReportedPercentRef = useRef<number>(-1);

  const handleScroll = (event: any) => {
    const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent;
    currentScrollYRef.current = contentOffset.y;
    const maxScroll = contentSize.height - layoutMeasurement.height;
    if (maxScroll > 0) {
      const p = Math.max(0, Math.min(1, contentOffset.y / maxScroll));
      const intPercent = Math.round(p * 100);
      if (intPercent !== lastReportedPercentRef.current) {
        lastReportedPercentRef.current = intPercent;
        setScrollProgress(p);
      }
    }
    if (selectedRange) {
      updateToolbarPosition(
        selectedRange.paragraphIndex,
        selectedRange.startIndex,
        selectedRange.endIndex
      );
    }
  };

  const handleShareQuote = (quoteText: string) => {
    Share.share({ message: quoteText }).catch(() => {});
  };

  // Nhận diện cú chạm (Tap) để hiển thị điều khiển:
  // "bấm màn hình 1 lần chỉ hoạt động khi cần hiển thị"
  // "còn khi ẩn đi thì lướt xuống hoặc lướt lên là ẩn"
  const touchCoord = useRef({ x: 0, y: 0, time: 0 });

  const handleTouchStart = (e: any) => {
    touchCoord.current = {
      x: e.nativeEvent.pageX,
      y: e.nativeEvent.pageY,
      time: Date.now(),
    };
  };

  const handleTouchEnd = (e: any) => {
    const dx = Math.abs(e.nativeEvent.pageX - touchCoord.current.x);
    const dy = Math.abs(e.nativeEvent.pageY - touchCoord.current.y);
    const dt = Date.now() - touchCoord.current.time;
    // Cú chạm hợp lệ (không phải vuốt kéo)
    if (dx < 12 && dy < 12 && dt < 280) {
      if (selectedRange) {
        if (isToolbarVisible) {
          // Trạng thái 2: Chạm ngoài lần 1 -> Ẩn toolbar nhưng GIỮ NGUYÊN vùng chọn!
          setIsToolbarVisible(false);
          return;
        } else {
          // Trạng thái 4: Đã ẩn toolbar, chạm ngoài lần 2 -> XÓA HOÀN TOÀN vùng chọn!
          setSelectedRange(null);
          setIsToolbarVisible(false);
          setToolbarCoords(null);
          return;
        }
      }
      if (!showControls && !isMenuOpen) {
        setShowControls(true);
      }
    }
  };

  // Cuộn lên đầu CHỈ KHI ĐỔI CHƯƠNG (Khắc phục triệt để lỗi đang đọc bị nhảy thụt về đầu trang)
  useEffect(() => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    setScrollProgress(0);
  }, [currentChapterIndex]);

  // Lưu tiến độ đọc riêng biệt (Không can thiệp vào vị trí cuộn trang của người dùng)
  useEffect(() => {
    if (book?.id) {
      AsyncStorage.setItem(
        `@halm_reading_progress_${book.id}`,
        JSON.stringify({
          bookId: book.id,
          title: book.title || book.bookName,
          author: book.author,
          img_url: book.img_url,
          chapterNum: currentChapterIndex + 1,
          chapterTitle: activeChapter.title,
          progress: totalPercent,
        })
      ).catch(() => {});
    }
  }, [currentChapterIndex, book?.id, activeChapter.title, totalPercent]);

  // Trình phát nhạc phong cách Spotify (mặc định hiển thị tab Đã lưu)
  const [tracks, setTracks] = useState<MusicTrack[]>(INITIAL_SPOTIFY_TRACKS);
  const [musicFilter, setMusicFilter] = useState<'saved' | 'explore'>('saved');
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchMusicQuery, setSearchMusicQuery] = useState('');

  // Lọc bài hát theo tab hoặc từ khóa tìm kiếm
  const filteredTracks = useMemo(() => {
    if (isSearchExpanded && searchMusicQuery.trim()) {
      const q = searchMusicQuery.toLowerCase().trim();
      return tracks.filter(
        (t) => t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q)
      );
    }
    return tracks.filter((t) => t.category === musicFilter);
  }, [tracks, musicFilter, isSearchExpanded, searchMusicQuery]);

  const currentTrack = tracks[currentTrackIndex] || tracks[0];

  const handleTogglePlay = () => {
    setIsPlayingMusic((prev) => !prev);
  };

  const handlePrevTrack = () => {
    setCurrentTrackIndex((prev) => (prev > 0 ? prev - 1 : tracks.length - 1));
  };

  const handleNextTrack = () => {
    setCurrentTrackIndex((prev) => (prev < tracks.length - 1 ? prev + 1 : 0));
  };

  const handleSelectTrack = (actualIdx: number) => {
    setCurrentTrackIndex(actualIdx);
    setIsPlayingMusic(true);
  };

  // Tải bài hát từ Khám phá chuyển sang Đã lưu
  const handleDownloadTrack = (trackId: string) => {
    setTracks((prev) =>
      prev.map((t) => (t.id === trackId ? { ...t, category: 'saved' } : t))
    );
    showToast('Đã tải xuống phần Đã lưu');
  };

  const handleShare = async () => {
    try {
      await Share.share({
        title: book?.title || 'Sách hay trên HalmBook',
        message: `Đang đọc tác phẩm "${book?.title || 'Tác phẩm'}" - ${activeChapter.title} trên HalmBook!`,
      });
    } catch {}
  };

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.bg }]}>
      <ExpoStatusBar style={currentTheme.isDark ? 'light' : 'dark'} />

      {/* TOAST THÔNG BÁO NHẸ (VD: KHÓA XOAY MÀN HÌNH, TẢI NHẠC) */}
      {toastMessage && (
        <View style={[styles.toastContainer, { top: insets.top + 50 }]}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

      {/* =========================================================================
          VÙNG ĐỌC SÁCH - CUỘN LƯỚT 100% MƯỢT MÀ, KHÔNG CÓ BẤT CỨ NÚT NÀO ĐÈ LÊN
          ========================================================================= */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + (isSearchOpen ? 88 : 28),
            paddingBottom: insets.bottom + 80,
          },
        ]}
        onScroll={handleScroll}
        scrollEventThrottle={32}
        showsVerticalScrollIndicator={true}
        onScrollBeginDrag={() => {
          // LƯỚT XUỐNG HOẶC LƯỚT LÊN LÀ TỰ ĐỘNG ẨN NGAY ĐIỀU KHIỂN!
          if (showControls) setShowControls(false);
          if (isMenuOpen) setIsMenuOpen(false);
          if (selectedRange && isToolbarVisible) {
            // Trạng thái 2: Cuộn đọc sách tự động ẩn toolbar, GIỮ NGUYÊN vùng chọn!
            setIsToolbarVisible(false);
          }
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Tiêu đề chương (H1) */}
        <View
          style={styles.chapterHeaderBox}
          onLayout={(e) => setChapterHeaderHeight(e.nativeEvent.layout.height)}
        >
          <Text
            style={[
              styles.chapterH1,
              { color: currentTheme.text, fontFamily: currentFont.fontFamily },
            ]}
          >
            {activeChapter.title}
          </Text>
          {activeChapter.subtitle ? (
            <Text
              style={[
                styles.chapterSubtitle,
                { color: currentTheme.subText, fontFamily: currentFont.fontFamily },
              ]}
            >
              {activeChapter.subtitle}
            </Text>
          ) : null}
          <View style={[styles.chapterDivider, { backgroundColor: currentTheme.border }]} />
        </View>

        {/* Nội dung đoạn văn bản thật của sách */}
        {activeChapter.content.map((paragraph, idx) => {
          return (
            <View
              key={idx}
              ref={(el) => {
                paragraphRefs.current[idx] = el;
              }}
              onLayout={(e) => {
                paragraphLayouts.current[idx] = e.nativeEvent.layout;
              }}
              style={styles.paragraphContainer}
            >
              {/* Layer 1: Hiển thị văn bản đọc sách với định dạng font, màu, highlight */}
              <Text
                style={[
                  styles.paragraphText,
                  {
                    color: currentTheme.text,
                    fontSize: fontSize,
                    lineHeight: Math.round(fontSize * 1.7),
                    fontWeight: currentTheme.isBold ? '700' : '400',
                    fontFamily: currentFont.fontFamily,
                  },
                ]}
                pointerEvents="none"
              >
                {renderFormattedParagraph(paragraph, idx)}
              </Text>

              {/* Layer 2: TextInput trong suốt nằm đè lên, chặn hoàn toàn menu Copy hệ thống
                  nhưng kích hoạt tay nắm bôi đen (selection handles) tự nhiên */}
              <TextInput
                value={paragraph}
                multiline={true}
                scrollEnabled={false}
                readOnly={true}
                showSoftInputOnFocus={false}
                caretHidden={true}
                contextMenuHidden={true}
                selectTextOnFocus={false}
                selectionColor="rgba(0, 122, 255, 0.35)"
                selection={
                  selectedRange?.paragraphIndex === idx
                    ? { start: selectedRange.startIndex, end: selectedRange.endIndex }
                    : { start: 0, end: 0 }
                }
                style={[
                  StyleSheet.absoluteFill,
                  styles.paragraphSelectionInput,
                  {
                    fontSize: fontSize,
                    lineHeight: Math.round(fontSize * 1.7),
                    fontWeight: currentTheme.isBold ? '700' : '400',
                    fontFamily: currentFont.fontFamily,
                  },
                ]}
                onSelectionChange={(e) => {
                  const { start, end } = e.nativeEvent.selection;
                  handleParagraphSelectionChange(idx, paragraph, start, end);
                }}
              />
            </View>
          );
        })}

        {/* Nút chuyển chương ở cuối trang */}
        <View style={styles.chapterEndNavBox}>
          <TouchableOpacity
            disabled={currentChapterIndex <= 0}
            style={[
              styles.prevNextChapterBtn,
              { borderColor: currentTheme.border, backgroundColor: currentTheme.cardBg },
              currentChapterIndex <= 0 && { opacity: 0.3 },
            ]}
            onPress={() => setCurrentChapterIndex((prev: number) => Math.max(0, prev - 1))}
          >
            <Text style={[styles.prevNextChapterText, { color: currentTheme.text }]}>
              ‹ Chương trước
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            disabled={currentChapterIndex >= chapters.length - 1}
            style={[
              styles.prevNextChapterBtn,
              { borderColor: currentTheme.border, backgroundColor: currentTheme.cardBg },
              currentChapterIndex >= chapters.length - 1 && { opacity: 0.3 },
            ]}
            onPress={() =>
              setCurrentChapterIndex((prev: number) => Math.min(chapters.length - 1, prev + 1))
            }
          >
            <Text style={[styles.prevNextChapterText, { color: currentTheme.text }]}>
              Chương sau ›
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* =========================================================================
          KHI BẤM 1 LẦN VÔ MÀN HÌNH:
          - Nút (X) bên phải trên cùng
          - Tiến trình đọc ở giữa dưới cùng (10/100)
          - Dấu 3 gạch bên phải dưới cùng
          (CHỈ HIỆN 3 NÚT NÀY, KHÔNG HIỆN NHẠC VÀ CHI TIẾT)
          ========================================================================= */}
      {showControls && !isMenuOpen && (
        <View pointerEvents="box-none" style={styles.simpleControlsOverlay}>
          {/* Nút (X) bên phải trên cùng */}
          <TouchableOpacity
            style={[styles.topRightCloseBtn, { top: insets.top + 10 }]}
            onPress={onBack}
            activeOpacity={0.8}
            accessibilityLabel="Đóng và quay lại"
          >
            <X size={18} color="#2C2C2E" />
          </TouchableOpacity>

          {/* Dưới cùng: Tiến trình đọc ở giữa (10/100) & Dấu 3 gạch bên phải */}
          <View style={[styles.bottomBarRow, { bottom: insets.bottom + 16 }]}>
            {/* Tiến trình đọc ở giữa */}
            <View style={styles.progressPill}>
              <Text style={styles.progressPillText}>
                {currentPage} / {totalBookPages}
              </Text>
            </View>

            {/* Dấu 3 gạch bên phải dưới cùng */}
            <TouchableOpacity
              style={styles.bottomRightMenuBtn}
              onPress={() => setIsMenuOpen(true)}
              activeOpacity={0.8}
              accessibilityLabel="Mở tùy chọn"
            >
              <Menu size={20} color="#2C2C2E" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* =========================================================================
          KHI NHẤN NÚT 3 GẠCH MỚI HIỂN THỊ CHI TIẾT (Ảnh 2):
          1. Nút (X) ở góc phải trên
          2. Âm nhạc phong cách Spotify ở phía trên (gọn gàng, không thừa khoảng trống)
          3. Cụm 5 thanh ngang độc lập bằng nhau ở phía dưới bên trái
          4. Thanh tiến độ tua nhanh dạng volume slider ở mép phải (tua mượt mà, đúng chiều)
          ========================================================================= */}
      {isMenuOpen && (
        <View style={styles.detailMenuOverlay}>
          {/* Chạm ra ngoài để đóng menu */}
          <TouchableWithoutFeedback onPress={() => setIsMenuOpen(false)}>
            <View style={styles.detailMenuBackdrop} />
          </TouchableWithoutFeedback>

          {/* Nút (X) góc phải trên cùng */}
          <TouchableOpacity
            style={[styles.topRightCloseBtn, { top: insets.top + 10 }]}
            onPress={() => setIsMenuOpen(false)}
            activeOpacity={0.8}
          >
            <X size={18} color="#2C2C2E" />
          </TouchableOpacity>

          {/* 1. KHỐI ÂM NHẠC PHONG CÁCH SPOTIFY PHÍA TRÊN */}
          <TouchableWithoutFeedback
            onPress={() => {
              // Nhấn vào khoảng trống trong vùng âm nhạc thì thu nhỏ thanh tìm kiếm lại
              if (isSearchExpanded) {
                setIsSearchExpanded(false);
                setSearchMusicQuery('');
              }
            }}
          >
            <View style={[styles.spotifySectionBox, { top: insets.top + 56 }]}>
              {/* Hàng điều khiển phát nhạc: CĂN GIỮA TOÀN BỘ, TÊN DÀI MARQUEE, CỤM 3 NÚT PHÁT */}
              <View style={styles.spotifyPlayerRow}>
                {/* Tên bài hát hiển thị ĐẦY ĐỦ (chạy đi chạy lại nếu dài), Tác giả & 3 nút phát CĂN GIỮA, CỐ ĐỊNH */}
                <View style={styles.spotifyCenterInfo}>
                  <MarqueeText
                    text={currentTrack.title}
                    style={styles.spotifyTrackName}
                  />
                  <Text
                    style={styles.spotifyArtistName}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {currentTrack.artist}
                  </Text>

                  {/* Cụm 3 nút phát: <<  ||  >> căn giữa và cố định tuyệt đối */}
                  <View style={styles.spotifyThreeButtonsRow}>
                    <TouchableOpacity onPress={handlePrevTrack} style={styles.spotifySmallBtn}>
                      <SkipBack size={15} color="#1C1C1E" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={handleTogglePlay}
                      style={styles.spotifyMainPlayBtn}
                      activeOpacity={0.85}
                    >
                      {isPlayingMusic ? (
                        <Pause size={14} color="#FFFFFF" />
                      ) : (
                        <Play size={14} color="#FFFFFF" style={{ marginLeft: 2 }} />
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity onPress={handleNextTrack} style={styles.spotifySmallBtn}>
                      <SkipForward size={15} color="#1C1C1E" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* List nhạc riêng biệt nằm PHÍA DƯỚI 3 nút phát */}
              <View style={styles.spotifyPlaylistContainer}>
                {/* BỘ LỌC TRÊN CÙNG: Đã lưu, Khám phá (icon đám mây tải xuống), Tìm kiếm */}
                <View style={styles.musicFilterBar}>
                  {!isSearchExpanded ? (
                    <View style={styles.musicFilterLeftGroup}>
                      {/* Nút Đã lưu */}
                      <TouchableOpacity
                        style={[
                          styles.filterTabPill,
                          musicFilter === 'saved' && styles.filterTabPillActive,
                        ]}
                        onPress={() => setMusicFilter('saved')}
                      >
                        <Bookmark
                          size={13}
                          color={musicFilter === 'saved' ? '#007AFF' : '#666666'}
                          fill={musicFilter === 'saved' ? '#007AFF' : 'none'}
                        />
                        <Text
                          style={[
                            styles.filterTabText,
                            musicFilter === 'saved' && styles.filterTabTextActive,
                          ]}
                        >
                          Đã lưu
                        </Text>
                      </TouchableOpacity>

                      {/* Nút Khám phá (Icon hình đám mây tải xuống CloudDownload) */}
                      <TouchableOpacity
                        style={[
                          styles.filterTabPill,
                          musicFilter === 'explore' && styles.filterTabPillActive,
                        ]}
                        onPress={() => setMusicFilter('explore')}
                      >
                        <CloudDownload
                          size={14}
                          color={musicFilter === 'explore' ? '#007AFF' : '#666666'}
                        />
                        <Text
                          style={[
                            styles.filterTabText,
                            musicFilter === 'explore' && styles.filterTabTextActive,
                          ]}
                        >
                          Khám phá
                        </Text>
                      </TouchableOpacity>

                      {/* Nút Tìm kiếm NẰM NGAY BÊN CẠNH Khám phá */}
                      <TouchableOpacity
                        style={styles.musicSearchMiniBtn}
                        onPress={() => setIsSearchExpanded(true)}
                        accessibilityLabel="Tìm kiếm bài hát"
                      >
                        <Search size={14} color="#666666" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    /* KHI NHẤN TÌM KIẾM: HIỆU ỨNG ĐẨY THANH TÌM KIẾM CHÈN LÊN FULL SANG PHẢI */
                    <View style={styles.expandedSearchBarWrap}>
                      <Search size={14} color="#007AFF" style={{ marginRight: 6 }} />
                      <TextInput
                        style={styles.expandedSearchTextInput}
                        placeholder="Tìm bài hát, nghệ sĩ..."
                        placeholderTextColor="#8E8E93"
                        value={searchMusicQuery}
                        onChangeText={setSearchMusicQuery}
                        autoFocus
                      />
                      <TouchableOpacity
                        style={styles.searchClearBtn}
                        onPress={() => {
                          setIsSearchExpanded(false);
                          setSearchMusicQuery('');
                        }}
                      >
                        <X size={15} color="#666666" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                {/* Danh sách bài hát cuộn lướt mượt mà */}
                <ScrollView
                  style={styles.spotifyPlaylistScroll}
                  nestedScrollEnabled
                  showsVerticalScrollIndicator={false}
                >
                  {filteredTracks.map((t) => {
                    const actualIdx = tracks.findIndex((x) => x.id === t.id);
                    const isCur = actualIdx === currentTrackIndex;
                    return (
                      <TouchableOpacity
                        key={t.id}
                        style={[styles.spotifyTrackRow, isCur && styles.spotifyTrackRowSelected]}
                        onPress={() => handleSelectTrack(actualIdx)}
                        activeOpacity={0.7}
                      >
                        <View style={{ flex: 1, paddingRight: 6 }}>
                          <Text
                            style={[
                              styles.spotifyRowTitle,
                              isCur && { color: '#007AFF', fontWeight: '700' },
                            ]}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                          >
                            {t.title}
                          </Text>
                          <Text
                            style={styles.spotifyRowSubtitle}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                          >
                            {t.artist} • {t.duration}
                          </Text>
                        </View>

                        {/* Ở phần Khám phá: Nút tải xuống đám mây (bấm tải sẽ nhảy qua phần Đã lưu) */}
                        {t.category === 'explore' && (
                          <TouchableOpacity
                            style={styles.spotifyDownloadBtn}
                            onPress={() => handleDownloadTrack(t.id)}
                            accessibilityLabel="Tải vào danh sách Đã lưu"
                          >
                            <CloudDownload size={13} color="#007AFF" />
                          </TouchableOpacity>
                        )}

                        {/* Nút tam giác phát nghe thử ở cuối dòng */}
                        <TouchableOpacity
                          onPress={() => handleSelectTrack(actualIdx)}
                          style={[
                            styles.spotifyTrialTriangleBtn,
                            isCur && isPlayingMusic && { backgroundColor: '#007AFF' },
                          ]}
                        >
                          {isCur && isPlayingMusic ? (
                            <Pause size={11} color="#FFFFFF" />
                          ) : (
                            <Play
                              size={11}
                              color={isCur ? '#007AFF' : '#555555'}
                              style={{ marginLeft: 1 }}
                            />
                          )}
                        </TouchableOpacity>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </View>
          </TouchableWithoutFeedback>

          {/* 2. CỤM CÁC NÚT ĐỘC LẬP DẠNG THANH NGANG (Ảnh 2)
                 (5 thanh bằng nhau 100%, khoảng cách bên phải tối ưu gọn gàng) */}
          <View style={[styles.independentBarsColumn, { bottom: insets.bottom + 16 }]}>
            {/* Thanh 1: Nội dung • ...% */}
            <TouchableOpacity
              style={styles.independentPillBar}
              onPress={() => {
                setIsMenuOpen(false);
                setIsTocOpen(true);
              }}
              activeOpacity={0.75}
            >
              <Text style={styles.independentPillText}>Nội dung • {totalPercent}%</Text>
              <List size={20} color="#1C1C1E" />
            </TouchableOpacity>

            {/* Thanh 2: Dấu trang & Vùng tô sáng */}
            <TouchableOpacity
              style={styles.independentPillBar}
              onPress={() => {
                setIsMenuOpen(false);
                setIsBookmarksModalOpen(true);
              }}
              activeOpacity={0.75}
            >
              <Text style={styles.independentPillText}>Dấu trang & Vùng tô sáng</Text>
              <View style={styles.bookmarkNumberBadge}>
                <Text style={styles.bookmarkNumberText}>
                  {bookmarks.length + highlights.length}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Thanh 3: Tìm kiếm trong sách */}
            <TouchableOpacity
              style={styles.independentPillBar}
              onPress={() => {
                setIsMenuOpen(false);
                setIsSearchOpen(true);
              }}
              activeOpacity={0.75}
            >
              <Text style={styles.independentPillText}>Tìm kiếm trong sách</Text>
              <Search size={20} color="#1C1C1E" />
            </TouchableOpacity>

            {/* Thanh 4: Chủ đề & Cài đặt */}
            <TouchableOpacity
              style={styles.independentPillBar}
              onPress={() => {
                setIsMenuOpen(false);
                setIsSettingsOpen(true);
              }}
              activeOpacity={0.75}
            >
              <Text style={styles.independentPillText}>Chủ đề & Cài đặt</Text>
              <View style={styles.aaPillBadge}>
                <Text style={styles.aaPillBadgeText}>AA</Text>
              </View>
            </TouchableOpacity>

            {/* Thanh 5: Hàng icon độc lập (Share, Bookmark) */}
            <View style={styles.independentIconsRow}>
              {/* Nút 1: Chia sẻ */}
              <TouchableOpacity style={styles.singleIconBtn} onPress={handleShare}>
                <Share2 size={20} color="#1C1C1E" />
              </TouchableOpacity>

              {/* Nút 2: Đánh dấu trang (Sáng khi ở vị trí đã kẹp dấu trang, cuộn sang vị trí khác tự động bỏ tích) */}
              <TouchableOpacity
                style={styles.singleIconBtn}
                onPress={toggleBookmarkCurrentPosition}
              >
                <Star
                  size={20}
                  color={isCurrentPositionBookmarked ? '#FFB800' : '#1C1C1E'}
                  fill={isCurrentPositionBookmarked ? '#FFB800' : 'none'}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* =========================================================================
          POPUP CHỦ ĐỀ & CÀI ĐẶT (Ảnh 3)
          ========================================================================= */}
      <Modal
        visible={isSettingsOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsSettingsOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsSettingsOpen(false)}>
          <View style={styles.settingsModalBackdrop}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.settingsSheetCard}>
                {/* Header: Chủ đề & Cài đặt + Nút (X) */}
                <View style={styles.settingsSheetHeader}>
                  <Text style={styles.settingsSheetTitle}>Chủ đề & Cài đặt</Text>
                  <TouchableOpacity
                    style={styles.settingsSheetCloseBtn}
                    onPress={() => setIsSettingsOpen(false)}
                  >
                    <X size={18} color="#2C2C2E" />
                  </TouchableOpacity>
                </View>

                {/* Hàng 1: Nút A / A chỉnh cỡ chữ */}
                <View style={styles.fontSizeSegmentRow}>
                  <TouchableOpacity
                    style={styles.fontSizeBtn}
                    onPress={() => setFontSize((prev) => Math.max(14, prev - 1))}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.fontSizeBtnText, { fontSize: 14 }]}>A</Text>
                  </TouchableOpacity>

                  <View style={styles.fontSizeDivider} />

                  <TouchableOpacity
                    style={styles.fontSizeBtn}
                    onPress={() => setFontSize((prev) => Math.min(26, prev + 1))}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.fontSizeBtnText, { fontSize: 20 }]}>A</Text>
                  </TouchableOpacity>
                </View>

                {/* Hàng 2: Thanh trượt độ sáng (Min Sun ... Max Sun) */}
                <View style={styles.brightnessSliderRow}>
                  <Sun size={15} color="#8E8E93" />
                  <View style={styles.brightnessTrack}>
                    <View
                      style={[
                        styles.brightnessThumb,
                        { left: `${Math.round(((brightness - 0.2) / 0.8) * 88)}%` },
                      ]}
                    />
                  </View>
                  <Sun size={20} color="#1C1C1E" />
                </View>

                {/* Hàng 3: Lưới 6 Chủ đề chuẩn xác như Ảnh 3 */}
                <View style={styles.themeGrid}>
                  {Object.values(THEME_OPTIONS).map((t) => {
                    const isSelected = t.id === themeKey;
                    return (
                      <TouchableOpacity
                        key={t.id}
                        style={[
                          styles.themeCardItem,
                          { backgroundColor: t.bg, borderColor: isSelected ? '#007AFF' : t.border },
                          isSelected && styles.themeCardItemSelected,
                        ]}
                        onPress={() => setThemeKey(t.id)}
                        activeOpacity={0.85}
                      >
                        <View style={styles.themeCardAaBox}>
                          <Text
                            style={[
                              styles.themeCardAaText,
                              { color: t.text },
                              t.isBold && { fontWeight: '900' },
                            ]}
                          >
                            Aa
                          </Text>
                          {t.hasStar && <Text style={[styles.themeCardStar, { color: t.text }]}>*</Text>}
                        </View>
                        <Text style={[styles.themeCardLabel, { color: t.text }]}>{t.name}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Hàng 4: Bộ chọn Phông chữ (10 loại và thanh tìm kiếm phía trên) */}
                <View style={styles.fontSection}>
                  <View style={styles.fontSectionHeader}>
                    <Text style={styles.fontSectionTitle}>PHÔNG CHỮ ({filteredFonts.length} LOẠI)</Text>
                    <Text style={styles.fontCurrentBadge}>{currentFont.name}</Text>
                  </View>

                  {/* Thanh tìm kiếm phông chữ phía trên */}
                  <View style={styles.fontSearchBar}>
                    <Search size={14} color="#8E8E93" style={{ marginRight: 6 }} />
                    <TextInput
                      style={styles.fontSearchInput}
                      placeholder="Tìm kiếm phông chữ..."
                      placeholderTextColor="#8E8E93"
                      value={fontSearchQuery}
                      onChangeText={setFontSearchQuery}
                    />
                    {fontSearchQuery.length > 0 && (
                      <TouchableOpacity onPress={() => setFontSearchQuery('')}>
                        <X size={14} color="#8E8E93" />
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Danh sách 10 loại phông chữ có thể cuộn */}
                  <ScrollView
                    style={styles.fontListScroll}
                    nestedScrollEnabled
                    showsVerticalScrollIndicator={false}
                  >
                    {filteredFonts.map((f) => {
                      const isSelected = f.id === fontFamilyId;
                      return (
                        <TouchableOpacity
                          key={f.id}
                          style={[
                            styles.fontRowItem,
                            isSelected && styles.fontRowItemSelected,
                          ]}
                          onPress={() => setFontFamilyId(f.id)}
                          activeOpacity={0.7}
                        >
                          <View style={{ flex: 1, paddingRight: 6 }}>
                            <Text
                              style={[
                                styles.fontRowName,
                                { fontFamily: f.fontFamily },
                                isSelected && { color: '#007AFF', fontWeight: '700' },
                              ]}
                            >
                              {f.name}
                            </Text>
                            <Text style={styles.fontRowDesc}>{f.desc}</Text>
                          </View>
                          {isSelected && <Check size={18} color="#007AFF" />}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* Nút Tùy chỉnh dưới cùng */}
                <TouchableOpacity
                  style={styles.customSettingsBtn}
                  onPress={() => setIsSettingsOpen(false)}
                  activeOpacity={0.8}
                >
                  <Settings size={17} color="#1C1C1E" />
                  <Text style={styles.customSettingsBtnText}>Đóng & Áp dụng</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* =========================================================================
          MODAL MỤC LỤC CHƯƠNG (Nội dung)
          ========================================================================= */}
      <Modal
        visible={isTocOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsTocOpen(false)}
      >
        <View style={styles.tocBackdrop}>
          <View style={[styles.tocCard, { backgroundColor: currentTheme.cardBg }]}>
            <View style={[styles.tocHeader, { borderBottomColor: currentTheme.border }]}>
              <Text style={[styles.tocHeaderTitle, { color: currentTheme.text }]}>
                Mục Lục ({chapters.length} chương)
              </Text>
              <TouchableOpacity onPress={() => setIsTocOpen(false)} style={styles.tocCloseBtn}>
                <X size={20} color={currentTheme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.tocScrollView} showsVerticalScrollIndicator={false}>
              {chapters.map((ch, idx) => {
                const isSelected = idx === currentChapterIndex;
                return (
                  <TouchableOpacity
                    key={ch.id || idx}
                    style={[
                      styles.tocItemRow,
                      { borderBottomColor: currentTheme.border },
                      isSelected && { backgroundColor: currentTheme.bg },
                    ]}
                    onPress={() => {
                      setCurrentChapterIndex(idx);
                      setIsTocOpen(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.tocItemNumber,
                        { color: isSelected ? '#007AFF' : currentTheme.subText },
                      ]}
                    >
                      {String(idx + 1).padStart(2, '0')}
                    </Text>
                    <Text
                      style={[
                        styles.tocItemTitle,
                        { color: isSelected ? '#007AFF' : currentTheme.text },
                        isSelected && { fontWeight: '700' },
                      ]}
                      numberOfLines={1}
                    >
                      {ch.title}
                    </Text>
                    {isSelected && <Check size={18} color="#007AFF" />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* =========================================================================
          THANH TÌM KIẾM ĐẨY LÊN TRÊN CÙNG PHONG CÁCH CTRL+F (In đậm, Mũi tên lên xuống)
          ========================================================================= */}
      {isSearchOpen && (
        <View style={[styles.topCtrlFSearchBox, { top: insets.top + 8 }]}>
          {/* Hàng 1: Input + Số kết quả + Mũi tên lên xuống + Nút X */}
          <View style={styles.topCtrlFMainRow}>
            <Search size={16} color="#007AFF" style={{ marginRight: 6 }} />
            <TextInput
              style={styles.topCtrlFInput}
              placeholder="Tìm kiếm từ hoặc câu..."
              placeholderTextColor="#8E8E93"
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                setCurrentMatchIndex(0);
              }}
              autoFocus
            />

            {/* Số lượng kết quả: ví dụ 1/5 */}
            {searchQuery.trim().length >= 2 && (
              <View style={styles.ctrlFCountBadge}>
                <Text style={styles.ctrlFCountText}>
                  {searchMatches.length > 0
                    ? `${currentMatchIndex + 1}/${searchMatches.length}`
                    : '0/0'}
                </Text>
              </View>
            )}

            {/* Mũi tên lên / xuống để chuyển các kết quả (giống Ctrl+F) */}
            <View style={styles.ctrlFArrowsGroup}>
              <TouchableOpacity
                disabled={searchMatches.length === 0}
                onPress={handlePrevMatch}
                style={[
                  styles.ctrlFArrowBtn,
                  searchMatches.length === 0 && { opacity: 0.3 },
                ]}
                accessibilityLabel="Kết quả trước"
              >
                <ChevronUp size={18} color="#1C1C1E" />
              </TouchableOpacity>

              <TouchableOpacity
                disabled={searchMatches.length === 0}
                onPress={handleNextMatch}
                style={[
                  styles.ctrlFArrowBtn,
                  searchMatches.length === 0 && { opacity: 0.3 },
                ]}
                accessibilityLabel="Kết quả tiếp theo"
              >
                <ChevronDown size={18} color="#1C1C1E" />
              </TouchableOpacity>
            </View>

            {/* Nút X đóng thanh tìm kiếm */}
            <TouchableOpacity
              style={styles.ctrlFCloseBtn}
              onPress={() => {
                setIsSearchOpen(false);
                setSearchQuery('');
                setCurrentMatchIndex(0);
              }}
              accessibilityLabel="Đóng tìm kiếm"
            >
              <X size={16} color="#666666" />
            </TouchableOpacity>
          </View>

          {/* Hàng 2: Trích đoạn câu chứa từ tìm kiếm với từ trùng khớp in đậm */}
          {searchMatches.length > 0 && currentMatch && (
            <View style={styles.ctrlFSnippetRow}>
              <Text style={styles.ctrlFSnippetChapterTag}>
                {chapters[currentMatch.chapterIndex]?.title ||
                  `Chương ${currentMatch.chapterIndex + 1}`}
              </Text>
              <Text style={styles.ctrlFSnippetText} numberOfLines={1}>
                {renderSnippetWithBold(
                  chapters[currentMatch.chapterIndex]?.content[currentMatch.paragraphIndex] || '',
                  searchQuery.trim()
                )}
              </Text>
            </View>
          )}
        </View>
      )}


      {/* =========================================================================
          THANH CÔNG CỤ NỔI HALMBOOK KHI BÔI ĐEN VĂN BẢN
          CHÍNH XÁC 3 CHỨC NĂNG + 1 NÚT MỞ RỘNG: [Tô sáng] [Ghi chú] [Dịch thuật] [>]
          KHÔNG CÓ COPY, CUT, PASTE, SELECT ALL, CHIA SẺ
          ========================================================================= */}
      {selectedRange && isToolbarVisible && toolbarCoords && (
        <View
          style={[
            styles.floatingActionToolbar,
            {
              top: toolbarCoords.top,
              left: toolbarCoords.left,
            },
          ]}
        >
          <View style={styles.floatingBarInner}>
            {/* Nút 1: Tô sáng / Bỏ tô */}
            <TouchableOpacity
              style={styles.floatingBarBtn}
              onPress={handleToggleHighlight}
              activeOpacity={0.8}
            >
              {selectedRange.highlightId ? (
                <Trash2 size={16} color="#FFE600" />
              ) : (
                <Highlighter size={16} color="#FFFFFF" />
              )}
              <Text
                style={[
                  styles.floatingBarBtnText,
                  selectedRange.highlightId && { color: '#FFE600' },
                ]}
              >
                {selectedRange.highlightId ? 'Bỏ tô' : 'Tô sáng'}
              </Text>
            </TouchableOpacity>

            <View style={styles.floatingBarDivider} />

            {/* Nút 2: Ghi chú */}
            <TouchableOpacity
              style={styles.floatingBarBtn}
              onPress={handleOpenNoteModal}
              activeOpacity={0.8}
            >
              <FileText size={16} color="#FFFFFF" />
              <Text style={styles.floatingBarBtnText}>Ghi chú</Text>
            </TouchableOpacity>

            <View style={styles.floatingBarDivider} />

            {/* Nút 3: Dịch thuật */}
            <TouchableOpacity
              style={styles.floatingBarBtn}
              onPress={handleOpenTranslation}
              activeOpacity={0.8}
            >
              <Languages size={16} color="#FFFFFF" />
              <Text style={styles.floatingBarBtnText}>Dịch thuật</Text>
            </TouchableOpacity>

            <View style={styles.floatingBarDivider} />

            {/* Nút 4: Nút Mở rộng (ChevronRight) */}
            <TouchableOpacity
              style={styles.floatingBarCloseBtn}
              onPress={() => showToast('Tính năng mở rộng đang phát triển')}
              activeOpacity={0.7}
              accessibilityLabel="Mở rộng tính năng"
            >
              <ChevronRight size={17} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* =========================================================================
          MODAL DẤU TRANG & VÙNG TÔ SÁNG
          ========================================================================= */}
      <Modal
        visible={isBookmarksModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsBookmarksModalOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsBookmarksModalOpen(false)}>
          <View style={styles.modalBackdrop}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View
                style={[
                  styles.bookmarksSheetCard,
                  { paddingBottom: insets.bottom + 16, height: height * 0.75 },
                ]}
              >
                {/* Header */}
                <View style={styles.sheetHeaderRow}>
                  <Text style={styles.sheetHeaderTitle}>Dấu trang & Vùng tô sáng</Text>
                  <TouchableOpacity
                    style={styles.sheetCloseBtn}
                    onPress={() => setIsBookmarksModalOpen(false)}
                  >
                    <X size={20} color="#1C1C1E" />
                  </TouchableOpacity>
                </View>

                {/* 2 Tabs chuyển đổi */}
                <View style={styles.segmentedTabsContainer}>
                  <TouchableOpacity
                    style={[
                      styles.segmentedTabBtn,
                      bookmarksActiveTab === 'bookmarks' && styles.segmentedTabBtnActive,
                    ]}
                    onPress={() => setBookmarksActiveTab('bookmarks')}
                  >
                    <Star
                      size={15}
                      color={bookmarksActiveTab === 'bookmarks' ? '#FFB800' : '#8E8E93'}
                      fill={bookmarksActiveTab === 'bookmarks' ? '#FFB800' : 'none'}
                    />
                    <Text
                      style={[
                        styles.segmentedTabText,
                        bookmarksActiveTab === 'bookmarks' && styles.segmentedTabTextActive,
                      ]}
                    >
                      Dấu trang ({bookmarks.length})
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.segmentedTabBtn,
                      bookmarksActiveTab === 'highlights' && styles.segmentedTabBtnActive,
                    ]}
                    onPress={() => setBookmarksActiveTab('highlights')}
                  >
                    <Highlighter
                      size={15}
                      color={bookmarksActiveTab === 'highlights' ? '#FF9500' : '#8E8E93'}
                    />
                    <Text
                      style={[
                        styles.segmentedTabText,
                        bookmarksActiveTab === 'highlights' && styles.segmentedTabTextActive,
                      ]}
                    >
                      Vùng tô sáng ({highlights.length})
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Nội dung danh sách */}
                <ScrollView style={styles.bookmarksListScroll} showsVerticalScrollIndicator={false}>
                  {bookmarksActiveTab === 'bookmarks' ? (
                    bookmarks.length === 0 ? (
                      <View style={styles.emptyBookmarksBox}>
                        <Star size={36} color="#C7C7CC" />
                        <Text style={styles.emptyBookmarksTitle}>Chưa có dấu trang nào</Text>
                        <Text style={styles.emptyBookmarksDesc}>
                          Chạm vào biểu tượng dấu trang ở thanh công cụ để đánh dấu chương bạn đang đọc.
                        </Text>
                      </View>
                    ) : (
                      bookmarks.map((bm) => (
                        <TouchableOpacity
                          key={bm.id}
                          style={styles.bookmarkListItem}
                          onPress={() => handleJumpToBookmark(bm)}
                          activeOpacity={0.7}
                        >
                          <View style={styles.bookmarkItemIconBox}>
                            <Star size={18} color="#FFB800" fill="#FFB800" />
                          </View>
                          <View style={styles.bookmarkItemInfo}>
                            <View style={styles.bookmarkBadgeRow}>
                              <Text style={styles.bookmarkPageBadge}>
                                Trang {bm.page} / {bm.totalPages}
                              </Text>
                              <Text style={styles.bookmarkPercentBadge}>{bm.percent}%</Text>
                            </View>
                            <Text style={styles.bookmarkItemTitle} numberOfLines={1}>
                              {bm.chapterTitle}
                            </Text>
                            {bm.snippet ? (
                              <Text style={styles.bookmarkSnippetText} numberOfLines={2}>
                                {`"${bm.snippet}..."`}
                              </Text>
                            ) : null}
                            <Text style={styles.bookmarkItemDate}>
                              {new Date(bm.createdAt).toLocaleDateString('vi-VN')}
                            </Text>
                          </View>
                          <TouchableOpacity
                            style={styles.deleteBookmarkBtn}
                            onPress={() => {
                              setBookmarks((prev) => prev.filter((b) => b.id !== bm.id));
                              showToast(`Đã xóa dấu trang (Trang ${bm.page})`);
                            }}
                          >
                            <Trash2 size={16} color="#FF3B30" />
                          </TouchableOpacity>
                        </TouchableOpacity>
                      ))
                    )
                  ) : highlights.length === 0 ? (
                    <View style={styles.emptyBookmarksBox}>
                      <Highlighter size={36} color="#C7C7CC" />
                      <Text style={styles.emptyBookmarksTitle}>Chưa có vùng tô sáng nào</Text>
                      <Text style={styles.emptyBookmarksDesc}>
                        Nhấn giữ hoặc chạm vào bất kỳ câu văn nào trong sách để tô sáng hoặc ghi chú lại.
                      </Text>
                    </View>
                  ) : (
                    highlights.map((hl) => (
                      <TouchableOpacity
                        key={hl.id}
                        style={styles.highlightListItem}
                        onPress={() => {
                          setCurrentChapterIndex(hl.chapterIndex);
                          setIsBookmarksModalOpen(false);
                          showToast(`Đã nhảy tới ${hl.chapterTitle}`);
                        }}
                        activeOpacity={0.75}
                      >
                        <View style={styles.highlightQuoteBox}>
                          <Text style={styles.highlightQuoteText}>{`"${hl.selectedText}"`}</Text>
                        </View>
                        {hl.note ? (
                          <View style={styles.highlightNoteBox}>
                            <Text style={styles.highlightNoteLabel}>📝 Ghi chú:</Text>
                            <Text style={styles.highlightNoteText}>{hl.note}</Text>
                          </View>
                        ) : null}
                        <View style={styles.highlightMetaRow}>
                          <Text style={styles.highlightChapterText} numberOfLines={1}>
                            {hl.chapterTitle}
                          </Text>
                          <View style={styles.highlightActionButtons}>
                            <TouchableOpacity
                              style={styles.miniActionBtn}
                              onPress={() => handleShareQuote(hl.selectedText)}
                            >
                              <Share2 size={15} color="#007AFF" />
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.miniActionBtn}
                              onPress={() => {
                                setHighlights((prev) => prev.filter((h) => h.id !== hl.id));
                                showToast('Đã xóa vùng tô sáng');
                              }}
                            >
                              <Trash2 size={15} color="#FF3B30" />
                            </TouchableOpacity>
                          </View>
                        </View>
                      </TouchableOpacity>
                    ))
                  )}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* =========================================================================
          MODAL THÊM / SỬA GHI CHÚ
          ========================================================================= */}
      <Modal
        visible={isNoteModalOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setIsNoteModalOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsNoteModalOpen(false)}>
          <View style={styles.centerModalBackdrop}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.noteModalCard}>
                <View style={styles.noteModalHeader}>
                  <Text style={styles.noteModalTitle}>📝 Ghi chú cho câu trích</Text>
                  <TouchableOpacity onPress={() => setIsNoteModalOpen(false)}>
                    <X size={18} color="#8E8E93" />
                  </TouchableOpacity>
                </View>

                {selectedRange ? (
                  <View style={styles.noteSelectedQuoteBox}>
                    <Text style={styles.noteSelectedQuoteText} numberOfLines={3}>
                      {`"${selectedRange.text}"`}
                    </Text>
                  </View>
                ) : null}

                <TextInput
                  style={styles.noteTextInput}
                  placeholder="Viết cảm nhận, ý tưởng hoặc ghi chú của bạn..."
                  placeholderTextColor="#8E8E93"
                  multiline
                  numberOfLines={4}
                  value={noteInputText}
                  onChangeText={setNoteInputText}
                  autoFocus
                />

                <View style={styles.noteModalFooter}>
                  <TouchableOpacity
                    style={styles.noteCancelBtn}
                    onPress={() => setIsNoteModalOpen(false)}
                  >
                    <Text style={styles.noteCancelBtnText}>Hủy</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.noteSaveBtn} onPress={handleSaveNote}>
                    <Text style={styles.noteSaveBtnText}>Lưu ghi chú</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* =========================================================================
          MODAL DỊCH THUẬT CÂU TRÍCH
          ========================================================================= */}
      <Modal
        visible={isTranslationModalOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setIsTranslationModalOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsTranslationModalOpen(false)}>
          <View style={styles.centerModalBackdrop}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.translationModalCard}>
                <View style={styles.translationModalHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Languages size={18} color="#007AFF" />
                    <Text style={styles.translationModalTitle}>Dịch thuật câu trích</Text>
                  </View>
                  <TouchableOpacity onPress={() => setIsTranslationModalOpen(false)}>
                    <X size={18} color="#8E8E93" />
                  </TouchableOpacity>
                </View>

                {isTranslationLoading ? (
                  <View style={{ paddingVertical: 32, alignItems: 'center', justifyContent: 'center' }}>
                    <ActivityIndicator size="small" color="#007AFF" />
                    <Text style={{ marginTop: 10, fontSize: 13, color: '#8E8E93' }}>
                      Đang dịch thuật văn bản...
                    </Text>
                  </View>
                ) : (
                  <>
                    <View style={styles.translationBox}>
                      <Text style={styles.translationLangBadge}>Tiếng Việt (Gốc)</Text>
                      <Text style={styles.translationOriginalText}>
                        {currentTranslation?.original}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.translationBox,
                        { backgroundColor: '#F0F9FF', borderColor: '#BAE6FD' },
                      ]}
                    >
                      <Text style={[styles.translationLangBadge, { color: '#0284C7' }]}>
                        English (Bản dịch)
                      </Text>
                      <Text style={[styles.translationResultText, { color: '#0369A1' }]}>
                        {currentTranslation?.translated}
                      </Text>
                    </View>
                  </>
                )}

                <View style={styles.translationFooter}>
                  <TouchableOpacity
                    style={styles.translationCloseBtn}
                    onPress={() => setIsTranslationModalOpen(false)}
                  >
                    <Text style={styles.translationCloseBtnText}>Đóng</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 22,
    userSelect: 'none' as any,
  },

  // Toast
  toastContainer: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: 'rgba(25, 25, 28, 0.92)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    zIndex: 999,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  // Chapter Header & Nội dung sách
  chapterHeaderBox: {
    marginTop: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  chapterH1: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  chapterSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 10,
  },
  chapterDivider: {
    width: 60,
    height: 2,
    borderRadius: 1,
    marginTop: 8,
  },
  paragraphContainer: {
    marginBottom: 20,
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
    position: 'relative',
    userSelect: 'none' as any,
  },
  paragraphSelectedBox: {
    backgroundColor: 'rgba(255, 230, 0, 0.08)',
    borderLeftWidth: 3,
    borderLeftColor: '#FFE600',
  },
  paragraphText: {
    textAlign: 'left',
    userSelect: 'none' as any,
    includeFontPadding: false,
  },
  paragraphSelectionInput: {
    color: 'transparent',
    backgroundColor: 'transparent',
    padding: 0,
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: 0,
    paddingRight: 0,
    margin: 0,
    textAlign: 'left',
    textAlignVertical: 'top',
    includeFontPadding: false,
    userSelect: 'text' as any,
    top: 2,
    left: 4,
    right: 4,
    bottom: 2,
  },
  inlineNoteContainer: {
    backgroundColor: 'rgba(255, 230, 0, 0.22)',
    borderLeftWidth: 3,
    borderLeftColor: '#FFD600',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginTop: 6,
  },
  inlineNoteText: {
    fontSize: 12,
    color: '#664D03',
    fontWeight: '600',
  },

  chapterEndNavBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
    marginBottom: 40,
    gap: 12,
  },
  prevNextChapterBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  prevNextChapterText: {
    fontSize: 14,
    fontWeight: '700',
  },

  // ==========================================================
  // KHI BẤM 1 LẦN VÔ MÀN HÌNH: CHỈ HIỆN 3 NÚT NÀY
  // ==========================================================
  simpleControlsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  topRightCloseBtn: {
    position: 'absolute',
    right: 18,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(235, 235, 240, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    zIndex: 30,
  },
  bottomBarRow: {
    position: 'absolute',
    left: 18,
    right: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 25,
  },
  progressPill: {
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(230, 230, 235, 0.92)',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  progressPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3A3A3C',
  },
  bottomRightMenuBtn: {
    position: 'absolute',
    right: 0,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(235, 235, 240, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },

  // ==========================================================
  // KHI NHẤN NÚT 3 GẠCH MỚI HIỂN THỊ CHI TIẾT (Ảnh 2)
  // ==========================================================
  detailMenuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 40,
  },
  detailMenuBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },

  // 1. Âm nhạc phong cách Spotify phía trên (Thụt vào bên phải khoảng 1/4, gọn gàng, không thừa khoảng trống)
  spotifySectionBox: {
    position: 'absolute',
    left: '25%', // Thụt vào bên phải khoảng 1/4
    right: 18, // Cân đối lề phải khi đã bỏ thanh tua
    backgroundColor: 'rgba(255, 255, 255, 0.97)',
    borderRadius: 20,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    zIndex: 50,
  },
  spotifyPlayerRow: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingBottom: 6,
  },
  marqueeContainer: {
    overflow: 'hidden',
    width: '100%',
    height: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spotifyCenterInfo: {
    width: '100%',
    height: 66,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  spotifyTrackName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1C1C1E',
  },
  spotifyArtistName: {
    fontSize: 11,
    color: '#8E8E93',
    textAlign: 'center',
  },
  spotifyThreeButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    height: 28,
  },
  spotifySmallBtn: {
    padding: 3,
  },
  spotifyMainPlayBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1C1C1E',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // List nhạc riêng biệt phía dưới 3 nút
  spotifyPlaylistContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  // Bộ lọc trên cùng trong phần danh sách bài hát
  musicFilterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    height: 30,
  },
  musicFilterLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  filterTabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: '#F2F2F7',
  },
  filterTabPillActive: {
    backgroundColor: 'rgba(0, 122, 255, 0.12)',
  },
  filterTabText: {
    fontSize: 11,
    color: '#666666',
    fontWeight: '600',
  },
  filterTabTextActive: {
    color: '#007AFF',
    fontWeight: '700',
  },
  // Nút tìm kiếm nhỏ nằm ngay cạnh Khám phá
  musicSearchMiniBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Thanh tìm kiếm mở rộng đẩy chèn lên full sang phải
  expandedSearchBarWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingHorizontal: 8,
    height: 28,
  },
  expandedSearchTextInput: {
    flex: 1,
    fontSize: 12,
    color: '#1C1C1E',
    paddingVertical: 0,
  },
  searchClearBtn: {
    padding: 3,
  },
  spotifyPlaylistScroll: {
    maxHeight: 165,
  },
  spotifyTrackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 10,
    marginBottom: 3,
  },
  spotifyTrackRowSelected: {
    backgroundColor: 'rgba(0, 122, 255, 0.08)',
  },
  spotifyRowTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  spotifyRowSubtitle: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 1,
  },
  spotifyDownloadBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  spotifyTrialTriangleBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // 2. Cột 5 thanh ngang độc lập (Thụt vào bên phải khoảng 1/4, bằng nhau 100%, không bị khoảng trắng thừa)
  independentBarsColumn: {
    position: 'absolute',
    left: '25%', // Thụt vào bên phải khoảng 1/4
    right: 18, // Cân đối lề phải khi đã bỏ thanh tua
    gap: 8,
    zIndex: 45,
  },
  independentPillBar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  independentPillText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  bookmarkNumberBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#E5E5EA',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  bookmarkNumberText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3A3A3C',
  },
  aaPillBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: '#E5E5EA',
  },
  aaPillBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1C1C1E',
  },
  independentIconsRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderRadius: 14,
    paddingVertical: 11,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  singleIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnActive: {
    backgroundColor: 'rgba(0, 122, 255, 0.12)',
  },

  // Icon ghi chú inline trên văn bản
  inlineNoteBadge: {
    fontSize: 14,
  },
  selectionPin: {
    color: '#007AFF',
    fontWeight: '900',
    fontSize: 16,
  },

  // Modal Backdrop
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },

  // Sheet Dấu trang & Vùng tô sáng
  bookmarksSheetCard: {
    backgroundColor: '#F2F2F7',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 10,
  },
  sheetHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
  },
  sheetHeaderTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1C1C1E',
  },
  sheetCloseBtn: {
    padding: 6,
  },
  segmentedTabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#E5E5EA',
    borderRadius: 12,
    padding: 3,
    marginBottom: 12,
  },
  segmentedTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
  },
  segmentedTabBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  segmentedTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
  },
  segmentedTabTextActive: {
    fontWeight: '700',
    color: '#1C1C1E',
  },
  bookmarksListScroll: {
    flex: 1,
  },
  emptyBookmarksBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 45,
    paddingHorizontal: 24,
    gap: 10,
  },
  emptyBookmarksTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#8E8E93',
  },
  emptyBookmarksDesc: {
    fontSize: 13,
    color: '#AEAEB2',
    textAlign: 'center',
    lineHeight: 18,
  },
  bookmarkListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 14,
    marginBottom: 8,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  bookmarkItemIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookmarkItemInfo: {
    flex: 1,
  },
  bookmarkBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  bookmarkPageBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#007AFF',
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  bookmarkPercentBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#34C759',
  },
  bookmarkItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  bookmarkSnippetText: {
    fontSize: 11,
    color: '#636366',
    fontStyle: 'italic',
    marginTop: 2,
    marginBottom: 3,
    lineHeight: 15,
  },
  bookmarkItemDate: {
    fontSize: 10,
    color: '#8E8E93',
    marginTop: 1,
  },
  deleteBookmarkBtn: {
    padding: 8,
  },

  // Highlight list item
  highlightListItem: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  highlightQuoteBox: {
    backgroundColor: '#FFFBE6',
    borderLeftWidth: 4,
    borderLeftColor: '#FFD600',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginBottom: 8,
  },
  highlightQuoteText: {
    fontSize: 13,
    color: '#2C2C2E',
    fontStyle: 'italic',
    lineHeight: 19,
  },
  highlightNoteBox: {
    backgroundColor: '#F2F2F7',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  highlightNoteLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 2,
  },
  highlightNoteText: {
    fontSize: 12,
    color: '#3A3A3C',
    lineHeight: 17,
  },
  highlightMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  highlightChapterText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    color: '#8E8E93',
  },
  highlightActionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  miniActionBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
  },

  // ==========================================================
  // THANH CÔNG CỤ NỔI KHI BÔI ĐEN VĂN BẢN (FLOATING ACTION TOOLBAR)
  // ==========================================================
  floatingActionToolbar: {
    position: 'absolute',
    zIndex: 9999,
  },
  floatingBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(28, 28, 30, 0.96)',
    borderRadius: 24,
    paddingVertical: 6,
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    gap: 2,
  },
  floatingBarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 14,
    gap: 6,
  },
  floatingBarBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  floatingBarDivider: {
    width: 1,
    height: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 1,
  },
  floatingBarCloseBtn: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Modal Backdrop cho Modal Ghi chú & Dịch thuật
  centerModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },

  // Modal Ghi chú
  noteModalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  noteModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  noteModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1C1C1E',
  },
  noteSelectedQuoteBox: {
    backgroundColor: '#FFFBE6',
    borderLeftWidth: 3,
    borderLeftColor: '#FFD600',
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
  },
  noteSelectedQuoteText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#3A3A3C',
    lineHeight: 17,
  },
  noteTextInput: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#1C1C1E',
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  noteModalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  noteCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#E5E5EA',
  },
  noteCancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3A3A3C',
  },
  noteSaveBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#007AFF',
  },
  noteSaveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Modal Dịch thuật
  translationModalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  translationModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  translationModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1C1C1E',
  },
  translationBox: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    backgroundColor: '#F9F9FB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  translationLangBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: '#8E8E93',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  translationOriginalText: {
    fontSize: 14,
    color: '#1C1C1E',
    lineHeight: 20,
  },
  translationResultText: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  translationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  translationShareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  translationShareBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#007AFF',
  },
  translationCloseBtn: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: '#E5E5EA',
  },
  translationCloseBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3A3A3C',
  },

  // Modal Chủ đề & Cài đặt (Ảnh 3)
  settingsModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  settingsSheetCard: {
    backgroundColor: '#F2F2F7',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
    paddingBottom: 32,
    paddingHorizontal: 18,
    maxHeight: '92%',
  },
  settingsSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  settingsSheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1C1C1E',
  },
  settingsSheetCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E5EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fontSizeSegmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5E5EA',
    borderRadius: 16,
    padding: 3,
    marginBottom: 16,
  },
  fontSizeBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fontSizeBtnText: {
    color: '#1C1C1E',
    fontWeight: '700',
  },
  fontSizeDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#C7C7CC',
  },
  brightnessSliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  brightnessTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D1D1D6',
    position: 'relative',
    justifyContent: 'center',
  },
  brightnessThumb: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    position: 'absolute',
  },
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  themeCardItem: {
    width: (width - 36 - 20) / 3,
    height: 82,
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 10,
    justifyContent: 'space-between',
  },
  themeCardItemSelected: {
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  themeCardAaBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  themeCardAaText: {
    fontSize: 22,
    fontWeight: '700',
  },
  themeCardStar: {
    fontSize: 12,
    marginLeft: 2,
  },
  themeCardLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  fontSection: {
    marginTop: 14,
    marginBottom: 12,
  },
  fontSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  fontSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#8E8E93',
    letterSpacing: 0.8,
  },
  fontCurrentBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#007AFF',
  },
  fontSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5E5EA',
    borderRadius: 12,
    paddingHorizontal: 10,
    height: 34,
    marginBottom: 8,
  },
  fontSearchInput: {
    flex: 1,
    fontSize: 12,
    color: '#1C1C1E',
    paddingVertical: 0,
  },
  fontListScroll: {
    maxHeight: 160,
  },
  fontRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginBottom: 5,
  },
  fontRowItemSelected: {
    backgroundColor: 'rgba(0, 122, 255, 0.08)',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  fontRowName: {
    fontSize: 14,
    color: '#1C1C1E',
    fontWeight: '600',
  },
  fontRowDesc: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 1,
  },
  customSettingsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 13,
  },
  customSettingsBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C1C1E',
  },

  // Mục lục
  tocBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  tocCard: {
    height: '75%',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  tocHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    marginBottom: 10,
  },
  tocHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  tocCloseBtn: {
    padding: 6,
  },
  tocScrollView: {
    flex: 1,
  },
  tocItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    borderBottomWidth: 1,
    gap: 12,
  },
  tocItemNumber: {
    fontSize: 13,
    fontWeight: '700',
    width: 24,
  },
  tocItemTitle: {
    flex: 1,
    fontSize: 14,
  },

  // Thanh tìm kiếm đẩy lên trên cùng phong cách Ctrl+F
  topCtrlFSearchBox: {
    position: 'absolute',
    left: 14,
    right: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    zIndex: 100,
  },
  topCtrlFMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topCtrlFInput: {
    flex: 1,
    fontSize: 14,
    color: '#1C1C1E',
    paddingVertical: 4,
    paddingRight: 6,
  },
  ctrlFCountBadge: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    marginRight: 6,
  },
  ctrlFCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#3A3A3C',
  },
  ctrlFArrowsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginRight: 4,
  },
  ctrlFArrowBtn: {
    padding: 4,
  },
  ctrlFCloseBtn: {
    padding: 6,
    marginLeft: 2,
  },
  ctrlFSnippetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    gap: 6,
  },
  ctrlFSnippetChapterTag: {
    fontSize: 10,
    fontWeight: '800',
    color: '#007AFF',
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ctrlFSnippetText: {
    flex: 1,
    fontSize: 12,
    color: '#3A3A3C',
  },
});
