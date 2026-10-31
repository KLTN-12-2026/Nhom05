import AsyncStorage from '@react-native-async-storage/async-storage';
=======
import { ArrowLeft, Bookmark, BookOpen, Heart } from 'lucide-react-native';
import { useAppNavigation, useAppThemeStyles } from './navigation';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { useState } from 'react';
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
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { getBookCoverSource } from './bookCovers';
import { useAppNavigation } from './navigation';

const { width, height } = Dimensions.get('window');

// MÀU SẮC THƯƠNG HIỆU ĐỒNG BỘ TRANG CHỦ APP
const BRAND = {
  primary: '#9A8BC2',
  secondary: '#D8B36A',
};

// --- COMPONENT HIỆU ỨNG SAO VÀ VŨ TRỤ (TỪ TRANG CHỦ APP) ---

// Hào quang tinh vân (Nebula) chớp nở chậm rãi
const Nebula = () => {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 5000, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 5000, useNativeDriver: true }),
      ])
    ).start();
  }, [anim]);

  return (
    <>
      {/* Góc trên trái (Ánh tím) */}
      <Animated.View
        style={{
          position: 'absolute',
          top: -100,
          left: -100,
          width: 350,
          height: 350,
          borderRadius: 175,
          backgroundColor: BRAND.primary,
          opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.03, 0.12] }),
          transform: [
            {
              scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.2] }),
            },
          ],
        }}
      />
      {/* Góc dưới phải (Ánh vàng) */}
      <Animated.View
        style={{
          position: 'absolute',
          bottom: -100,
          right: -100,
          width: 400,
          height: 400,
          borderRadius: 200,
          backgroundColor: BRAND.secondary,
          opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.05] }),
          transform: [
            {
              scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1.2, 0.8] }),
            },
          ],
        }}
      />
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
        Animated.timing(anim, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    ).start();
  }, [anim, delay]);

  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [0, width] });
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, height * 0.8] });
  const opacity = anim.interpolate({ inputRange: [0, 0.1, 0.8, 1], outputRange: [0, 1, 1, 0] });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top,
        left,
        width: 80,
        height: 2,
        backgroundColor: '#fff',
        transform: [{ rotate: '45deg' }, { translateX }, { translateY }],
        opacity,
        shadowColor: BRAND.secondary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 10,
      }}
    />
  );
};

// Ngôi sao lấp lánh (Tốc độ và độ trễ ngẫu nhiên)
const TwinkleStar = ({ duration, top, left, size, color }: any) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.1, duration, useNativeDriver: true }),
      ])
    ).start();
  }, [anim, duration]);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top,
        left,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        opacity: anim,
        shadowColor: color,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 6,
      }}
    />
  );
};

// Quản lý tổng thể Background Dark Mode Bầu Trời Sao của Trang Chủ App
const DarkModeBackgroundEffects = ({ visible }: { visible: boolean }) => {
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacityAnim, {
      toValue: visible ? 1 : 0,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [opacityAnim, visible]);

  const { stars, shootingStars } = useMemo(() => {
    const starsList = Array.from({ length: 110 }).map((_, i) => ({
      id: i,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      duration: Math.random() * 500 + 300,
      size: Math.random() * 3 + 1,
      color:
        Math.random() > 0.7
          ? BRAND.secondary
          : Math.random() > 0.5
          ? '#48dbfb'
          : BRAND.primary,
    }));

    const shootingList = Array.from({ length: 3 }).map((_, i) => ({
      id: `shoot_${i}`,
      top: `${Math.random() * -20}%`,
      left: `${Math.random() * 60}%`,
      delay: Math.random() * 8000 + 2000,
    }));

    return { stars: starsList, shootingStars: shootingList };
  }, []);

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        { opacity: opacityAnim, zIndex: 0, overflow: 'hidden' },
      ]}
      pointerEvents="none"
    >
      <Nebula />
      {stars.map((s) => (
        <TwinkleStar
          key={s.id}
          top={s.top}
          left={s.left}
          duration={s.duration}
          size={s.size}
          color={s.color}
        />
      ))}
      {shootingStars.map((s) => (
        <ShootingStar key={s.id} top={s.top} left={s.left} delay={s.delay} />
      ))}
    </Animated.View>
  );
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
  };
  onBack: () => void;
  onStartReading: () => void;
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
  if (book?.total_chapters && typeof book.total_chapters === 'number') {
    return `${book.total_chapters} chương`;
  }
  if (book?.chapter && typeof book.chapter === 'string') {
    const raw = book.chapter.trim();
    if (!raw.toLowerCase().includes('tác giả')) {
      return raw;
    }
  }
  if (book?.pages || book?.total_pages) {
    return `${book.pages || book.total_pages} trang`;
  }
  if (chaptersList.length > 0) {
    return `${chaptersList.length} chương`;
  }
  return 'Chưa cập nhật';
};

// Danh sách chương thật từ Database (nếu chưa có thì để rỗng)
const getBookChapters = (book: any): ChapterItem[] => {
  if (Array.isArray(book?.chapters) && book.chapters.length > 0) {
    return book.chapters.map((c: any, index: number) => ({
      id: c.id || index + 1,
      chapterNum: String(index + 1).padStart(2, '0'),
      title: c.title || `Chương ${index + 1}`,
      readTime: c.readTime || `${8 + (index % 5) * 2} phút`,
    }));
  }
  return [];
};

export default function BookDetailScreen({ book, onBack, onStartReading }: BookDetailProps) {
  const { isDarkMode, setFooterVisible } = useAppNavigation();
  const themeStyles = useMemo(() => getThemedStyles(isDarkMode), [isDarkMode]);
  const [isSaved, setIsSaved] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [savedChapter, setSavedChapter] = useState<{ chapterNum: number; title: string } | null>(null);
  const scrollOffset = useRef(0);

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

  const handleContinueReading = () => {
    onStartReading();
  };

  return (
    <SafeAreaView style={themeStyles.safeArea}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        {...({ backgroundColor: isDarkMode ? '#111210' : '#ffffff' } as any)}
      />

      {/* HIỆU ỨNG BẦU TRỜI SAO VÀ SAO BĂNG ĐỒNG BỘ TRANG CHỦ APP */}
      <DarkModeBackgroundEffects visible={isDarkMode} />


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
          onPress={() => setIsLiked(!isLiked)}
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
              <Text style={themeStyles.authorLabel}>Tác giả:</Text>
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
                <Text style={themeStyles.statBadgeReadsText}>{book.reads || '15.2K'} lượt đọc</Text>
              </View>
              <View style={themeStyles.statBadgeChapters}>
                <BookOpen size={13} color={isDarkMode ? '#34D399' : '#059669'} />
                <Text style={themeStyles.statBadgeChaptersText}>{chapterDisplay}</Text>
              </View>
            </View>

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

        {/* Ô THỨ HAI: CÁC NÚT HÀNH ĐỘNG (THEO MÀU SẮC CHUẨN CỦA TRANG CHỦ WEB) */}
        <View style={themeStyles.actionRow}>
          {/* Nút Tiếp Tục Đọc (Vàng kim sang trọng) */}
          {savedChapter && (
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

          {/* Nút Đọc Từ Đầu (Đỏ vang hoàng gia trên Dark Mode, xanh ngọc trên Light Mode) */}
          <TouchableOpacity
            style={[
              themeStyles.btnReadPrimary,
              savedChapter ? themeStyles.btnReadPrimaryCompact : null,
            ]}
            onPress={onStartReading}
            activeOpacity={0.88}
          >
            <BookOpen size={16} color="#ffffff" />
            <Text style={themeStyles.btnReadPrimaryText}>Đọc Từ Đầu</Text>
          </TouchableOpacity>

          {/* Nút Thêm Tủ */}
          <TouchableOpacity
            style={[
              themeStyles.btnBookmark,
              isSaved && themeStyles.btnBookmarkActive,
              savedChapter ? themeStyles.btnBookmarkCompact : null,
            ]}
            onPress={() => setIsSaved(!isSaved)}
            activeOpacity={0.88}
          >
            <Bookmark
              size={16}
              color={isSaved ? '#ffffff' : (isDarkMode ? '#EDE9DF' : '#334155')}
              fill={isSaved ? '#ffffff' : 'none'}
            />
            <Text
              style={[
                themeStyles.btnBookmarkText,
                isSaved && themeStyles.btnBookmarkActiveText,
              ]}
            >
              {isSaved ? 'Đã Lưu' : 'Thêm Tủ'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Ô THỨ BA: TRÍCH ĐOẠN NỔI BẬT (CHỈ HIỂN THỊ KHI CÓ DỮ LIỆU TỪ DB) */}
        {featuredQuote && (
          <View style={themeStyles.sectionContainer}>
            <Text style={themeStyles.sectionTitle}>Trích Đoạn Tiêu Biểu</Text>
            <View style={themeStyles.quoteBox}>
              <View style={themeStyles.quoteHeaderRow}>
                <Quote size={18} color={isDarkMode ? '#D4AF37' : '#d97706'} />
                <Text style={themeStyles.quoteHeaderTitle}>Lời vàng tác phẩm</Text>
              </View>
              <Text style={themeStyles.quoteContentText}>{featuredQuote.quote}</Text>
              <Text style={themeStyles.quoteSourceText}>{featuredQuote.source}</Text>
            </View>
          </View>
        )}

        {/* Ô THỨ TƯ: DANH SÁCH CHƯƠNG */}
        <View style={themeStyles.sectionContainer}>
          <View style={themeStyles.sectionHeaderRow}>
            <Text style={themeStyles.sectionTitle}>Danh Sách Chương</Text>
          </View>

          {chapters.length > 0 ? (
            <View style={themeStyles.chaptersCardBox}>
              {chapters.slice(0, 3).map((chap) => {
                const isCurrentChapter = savedChapter?.chapterNum === chap.id;
                return (
                  <TouchableOpacity
                    key={chap.id}
                    style={[
                      themeStyles.chapterRowItem,
                      isCurrentChapter && themeStyles.chapterRowActive,
                    ]}
                    activeOpacity={0.7}
                    onPress={onStartReading}
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
                              <Text style={themeStyles.currentReadingPillText}>Đang đọc</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>

                    <ChevronRight size={16} color={isDarkMode ? '#8A8780' : '#94a3b8'} />
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={themeStyles.emptyBox}>
              <Text style={themeStyles.emptyText}>Chưa có danh sách chương cho cuốn sách này.</Text>
            </View>
          )}
        </View>

        {/* Khoảng cách đáy */}
        <View style={{ height: 40 }} />
      </ScrollView>
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
  });
}
