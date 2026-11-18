import React, { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useAppNavigation, useAppThemeStyles } from './navigation';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { getBookCoverSource } from './bookCovers';
import { getBookChapterLabel } from './bookContentService';
import { fetchApiWithFallback } from './apiService';
import { DarkModeBackgroundEffects } from './trangchu';

const GENRES = [
  'Danh Tác Kinh Điển',
  'Hồi Ký & Lịch Sử',
  'Phóng Sự & Xã Hội',
  'Tình Cảm & Tiểu Thuyết',
  'Văn Học Hiện Thực',
];

export default function TheLoai() {
  const themeStyles = useAppThemeStyles(styles);
  const [filterVisible, setFilterVisible] = useState(false);
  const { navigate, goBack, isDarkMode, lang } = useAppNavigation();
  const insets = useSafeAreaInsets();
  const windowDims = useWindowDimensions();
  
  const [books, setBooks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // States cho bộ lọc
  const [activeGenre, setActiveGenre] = useState('');
  const [activeSort, setActiveSort] = useState<'views' | 'newest' | 'rating'>('views');

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    const fetchBooks = async () => {
      setIsLoading(true);
      try {
        const res = await fetchApiWithFallback('/api/home/books', {
          params: { page: 0, size: 50 },
          timeout: 4000,
          signal: controller.signal,
        });
        const raw = res.data;
        const list = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.content)
            ? raw.content
            : Array.isArray(raw?.data)
              ? raw.data
              : [];
        if (isMounted) {
          const mapped = list.map((item: any, idx: number) => ({
            id: String(item.book_id || item.id || `book-${idx}`),
            title: String(item.bookName || item.title || 'Chưa có tiêu đề'),
            author: item.author || 'HALM BOOK',
            chapter: getBookChapterLabel({ ...item, id: String(item.book_id || item.id || `book-${idx}`), title: String(item.bookName || item.title || '') }),
            img_url: item.img_url || item.img,
            category_name: item.category_name || item.tag || 'Sách hay',
            category_id: item.category_id,
            price: item.rent_price !== undefined ? item.rent_price : item.price,
            description: item.description || item.desc || '',
            read_count: Number(item.readCount ?? item.read_count ?? 0),
            rating: Number(item.rating ?? item.averageRating ?? item.average_rating ?? 0),
            updated_at: item.updatedAt || item.updated_at || item.createdAt || item.created_at || '',
          }));
          const booksWithRatings = await Promise.all(mapped.slice(0, 5).map(async (book: any) => {
            if (book.rating > 0) return book;
            try {
              const evaluationResponse = await fetchApiWithFallback<any[]>(`/api/home/books/${encodeURIComponent(book.id)}/evaluates`, { timeout: 4000, signal: controller.signal });
              const evaluations = Array.isArray(evaluationResponse.data) ? evaluationResponse.data : [];
              const stars = evaluations
                .filter((evaluation: any) => !evaluation.parentId && Number(evaluation.star) > 0)
                .map((evaluation: any) => Number(evaluation.star));
              return { ...book, rating: stars.length ? stars.reduce((sum: number, star: number) => sum + star, 0) / stars.length : 0 };
            } catch {
              return book;
            }
          }));
          if (!isMounted) return;
          setBooks([...booksWithRatings, ...mapped.slice(5)]);
          setIsLoading(false);
          return;
        }
      } catch {
        // Thử tiếp
      }
      if (isMounted) setIsLoading(false);
    };

    fetchBooks();
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  const sortBooks = (list: any[]) => {
    const result = [...list];
    if (activeSort === 'views') {
      result.sort((a, b) => b.read_count - a.read_count);
    } else if (activeSort === 'newest') {
      result.sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at)));
    } else {
      result.sort((a, b) => b.rating - a.rating);
    }
    return result;
  };

  const filterByGenre = (list: any[]) => {
    let result = [...list];
    if (activeGenre) {
      const gLower = activeGenre.toLowerCase();
      result = result.filter(b => {
        const cat = (b.category_name || '').toLowerCase();
        if (gLower.includes('kinh điển')) return cat.includes('kinh điển') || b.category_id === 1;
        if (gLower.includes('lịch sử') || gLower.includes('hồi ký')) return cat.includes('lịch sử') || cat.includes('hồi ký') || b.category_id === 2;
        if (gLower.includes('phóng sự')) return cat.includes('phóng sự') || b.category_id === 3;
        if (gLower.includes('tiểu thuyết') || gLower.includes('tình cảm')) return cat.includes('tiểu thuyết') || cat.includes('tình cảm') || b.category_id === 4;
        if (gLower.includes('hiện thực')) return cat.includes('hiện thực') || b.category_id === 5;
        return cat.includes(gLower);
      });
    }

    return result;
  };
  // Share the homepage Top Week source, then apply the selected genre and sort.
  const trendingBooks = sortBooks(filterByGenre(books.slice(0, 5)));
  const sortLabels = {
    views: lang === 'en' ? 'Most read' : 'Lượt đọc',
    newest: lang === 'en' ? 'New releases' : 'Mới ra mắt',
    rating: lang === 'en' ? 'Highest rated' : 'Đánh giá sao cao',
  };

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[themeStyles.container, { backgroundColor: isDarkMode ? '#101319' : '#FFFFFF' }]}
    >
      <ExpoStatusBar style={isDarkMode ? 'light' : 'dark'} />
      {/* HIỆU ỨNG VŨ TRỤ DARK MODE ĐỒNG BỘ TRANG CHỦ */}
      <DarkModeBackgroundEffects visible={isDarkMode} screenWidth={windowDims.width} screenHeight={windowDims.height} />
      <View style={[themeStyles.header, { backgroundColor: 'transparent' }]}>
        <TouchableOpacity
          style={themeStyles.headerBack}
          onPress={goBack}
          accessibilityRole="button"
          accessibilityLabel={lang === 'en' ? 'Go back' : 'Quay lại'}
        >
          <Ionicons name="arrow-back" size={23} color={isDarkMode ? '#F5F1E8' : '#242321'} />
        </TouchableOpacity>
        <Text style={[themeStyles.headerTitle, { color: isDarkMode ? '#F5F1E8' : '#242321' }]}>{lang === 'en' ? 'Book Filters' : 'Bộ lọc'}</Text>
        <View style={themeStyles.headerBack} />
      </View>

      {/* Lịch sử lọc hiện tại (Filter Tags) */}
      <View style={[themeStyles.filterTagsContainer, { backgroundColor: isDarkMode ? 'transparent' : '#FFFFFF' }]}>
        <View style={themeStyles.filterSummaryRow}>
          <TouchableOpacity
            style={[themeStyles.filterTag, themeStyles.summaryChip, { backgroundColor: isDarkMode ? '#232833' : '#F4F1EA', borderColor: isDarkMode ? '#343A45' : '#E6E1D8' }]}
            onPress={() => setFilterVisible(true)}
            accessibilityRole="button"
            accessibilityLabel={lang === 'en' ? 'Filter by genre' : 'Lọc theo thể loại'}
          >
            <Ionicons name="library-outline" size={15} color={isDarkMode ? '#D8B36A' : '#4A7C72'} />
            <Text style={[themeStyles.filterTagText, { color: isDarkMode ? '#F5F1E8' : '#4A463F' }]} numberOfLines={1}>
              {activeGenre || (lang === 'en' ? 'All genres' : 'Thể loại')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[themeStyles.filterTag, themeStyles.summaryChip, { backgroundColor: isDarkMode ? '#232833' : '#F4F1EA', borderColor: isDarkMode ? '#343A45' : '#E6E1D8' }]}
            onPress={() => setFilterVisible(true)}
            accessibilityRole="button"
            accessibilityLabel={lang === 'en' ? `Sort: ${sortLabels[activeSort]}` : `Xếp theo: ${sortLabels[activeSort]}`}
          >
            <Ionicons name="swap-vertical" size={15} color={isDarkMode ? '#D8B36A' : '#4A7C72'} />
            <Text style={[themeStyles.filterTagText, { color: isDarkMode ? '#F5F1E8' : '#4A463F' }]} numberOfLines={1}>
              {sortLabels[activeSort]}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={themeStyles.scrollView} contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>

        {isLoading ? (
          <ActivityIndicator size="small" color="#5a8b82" style={{ marginTop: 40 }} />
        ) : books.length === 0 ? (
          <Text style={[themeStyles.emptyTrending, { color: isDarkMode ? '#A7ABB5' : '#888' }]}>
            Không tìm thấy tác phẩm phù hợp
          </Text>
        ) : (
          <>
            {/* Top sách đề cử hôm nay */}
            <View style={themeStyles.topHighlightSection}>
              <Text style={[themeStyles.sectionTitle, { color: isDarkMode ? '#F5F1E8' : '#242321' }]}>{lang === 'en' ? '✨ Today’s Picks' : '✨ Đề Cử Hôm Nay'}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 15 }}>
                {books.slice(0, 6).map((n) => {
                  const cover = getBookCoverSource(n.id, n.img_url);
                  return (
                    <TouchableOpacity
                      key={n.id}
                      style={themeStyles.highlightCard}
                      onPress={() => navigate('bookDetail', n)}
                    >
                      <View style={themeStyles.highlightCover}>
                        {cover ? (
                          <Image source={cover} style={StyleSheet.absoluteFill} resizeMode="cover" />
                        ) : (
                          <Text style={[themeStyles.mockText, { color: isDarkMode ? '#A7ABB5' : '#666' }]}>Bìa</Text>
                        )}
                      </View>
                      <Text style={[themeStyles.highlightTitle, { color: isDarkMode ? '#F5F1E8' : '#242321' }]} numberOfLines={2}>{n.title}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>


            <View style={themeStyles.trendingHeading}>
              <View style={[themeStyles.trendingIcon, { backgroundColor: isDarkMode ? '#2C2216' : '#FEF3C7' }]}>
                <Ionicons name="flame" size={17} color={isDarkMode ? '#FBBF24' : '#D97706'} />
              </View>
              <Text style={[themeStyles.sectionTitle, { color: isDarkMode ? '#F5F1E8' : '#242321', paddingHorizontal: 0, marginBottom: 0 }]}>{lang === 'en' ? 'Trending Books' : 'Sách Thịnh Hành'}</Text>
            </View>
            {trendingBooks.length === 0 ? (
              <Text style={[themeStyles.emptyTrending, { color: isDarkMode ? '#A7ABB5' : '#888' }]}>{lang === 'en' ? 'No trending books in this genre.' : 'Chưa có sách thịnh hành thuộc thể loại này.'}</Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={themeStyles.trendingList}>
                {trendingBooks.map((n) => {
                  const cover = getBookCoverSource(n.id, n.img_url);
                  return (
                    <TouchableOpacity
                      key={n.id}
                      style={themeStyles.highlightCard}
                      onPress={() => navigate('bookDetail', n)}
                    >
                      <View style={themeStyles.highlightCover}>
                        {cover ? (
                          <Image source={cover} style={StyleSheet.absoluteFill} resizeMode="cover" />
                        ) : (
                          <Text style={[themeStyles.mockText, { color: isDarkMode ? '#A7ABB5' : '#666' }]}>Bìa</Text>
                        )}
                      </View>
                      <Text style={[themeStyles.highlightTitle, { color: isDarkMode ? '#F5F1E8' : '#242321' }]} numberOfLines={2}>{n.title}</Text>
                      <View style={themeStyles.trendingMeta}>
                        <Text style={[themeStyles.gridChapter, { color: isDarkMode ? '#A7ABB5' : '#85817A' }]} numberOfLines={1}>{n.author || n.chapter}</Text>
                        {n.rating > 0 && <Text style={[themeStyles.ratingText, { color: isDarkMode ? '#FBBF24' : '#9A6B12' }]}>★ {n.rating.toFixed(1)}</Text>}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </>
        )}
      </ScrollView>

      {/* Modal Popup Lọc Truyện */}
      <Modal visible={filterVisible} animationType="slide" transparent={true} onRequestClose={() => setFilterVisible(false)}>
        <View style={themeStyles.modalOverlay}>
          <View style={[themeStyles.bottomSheet, { paddingBottom: Math.max(insets.bottom, 8), backgroundColor: isDarkMode ? '#1B1F28' : '#FFFFFF' }]}>
            <View style={themeStyles.sheetHandleContainer}>
              <View style={[themeStyles.sheetHandle, { backgroundColor: isDarkMode ? '#596170' : '#CCC' }]} />
            </View>
            
            <Text style={[themeStyles.sheetTitle, { color: isDarkMode ? '#F5F1E8' : '#242321' }]}>{lang === 'en' ? 'Filter Books' : 'Lọc tác phẩm'}</Text>

            <ScrollView style={{ flexShrink: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              <Text style={[themeStyles.filterGroupTitle, { color: isDarkMode ? '#F5F1E8' : '#242321' }]}>{lang === 'en' ? 'Sort by' : 'Xếp theo'}</Text>
              <View style={themeStyles.filterOptionsColumn}>
                {(['views', 'newest', 'rating'] as const).map(sort => (
                  <TouchableOpacity
                    key={sort}
                    style={[
                      themeStyles.filterChoiceRow,
                      {
                        borderColor: activeSort === sort ? (isDarkMode ? '#D8B36A' : '#4A7C72') : (isDarkMode ? '#343A45' : '#E6E1D8'),
                        backgroundColor: activeSort === sort ? (isDarkMode ? '#2C2216' : '#E8F3EF') : (isDarkMode ? '#1B1F28' : '#FFFFFF'),
                      },
                    ]}
                    onPress={() => setActiveSort(sort)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: activeSort === sort }}
                  >
                    <View style={[themeStyles.radioOuter, { borderColor: activeSort === sort ? (isDarkMode ? '#D8B36A' : '#4A7C72') : (isDarkMode ? '#596170' : '#C7C2B9') }]}>
                      {activeSort === sort ? <View style={[themeStyles.radioInner, { backgroundColor: isDarkMode ? '#D8B36A' : '#4A7C72' }]} /> : null}
                    </View>
                    <Text style={[themeStyles.filterBtnText, { color: isDarkMode ? '#F5F1E8' : '#242321' }]}>{sortLabels[sort]}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Thể loại */}
              <Text style={[themeStyles.filterGroupTitle, { color: isDarkMode ? '#F5F1E8' : '#242321' }]}>{lang === 'en' ? 'Categories' : 'Thể loại'}</Text>
              <View style={themeStyles.filterOptionsGroup}>
                {GENRES.map(genre => (
                  <TouchableOpacity 
                    key={genre} 
                    style={[
                      themeStyles.filterBtn,
                      {
                        backgroundColor: activeGenre === genre
                          ? (isDarkMode ? '#2C3B35' : '#4A7C72')
                          : (isDarkMode ? '#1B1F28' : '#FFFFFF'),
                        borderColor: activeGenre === genre
                          ? (isDarkMode ? '#507363' : '#4A7C72')
                          : (isDarkMode ? '#343A45' : '#D8D2C8'),
                      },
                    ]}
                    onPress={() => setActiveGenre(genre === activeGenre ? '' : genre)}
                  >
                    <Text style={[themeStyles.filterBtnText, { color: activeGenre === genre ? (isDarkMode ? '#F5F1E8' : '#FFFFFF') : (isDarkMode ? '#F5F1E8' : '#4B5563'), fontWeight: activeGenre === genre ? '700' : '400' }]}>
                      {activeGenre === genre ? '✓ ' : ''}{genre}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={[themeStyles.sheetActions, { borderTopColor: isDarkMode ? '#343A45' : '#E6E1D8' }]}>
              <TouchableOpacity style={[themeStyles.confirmBtn, { backgroundColor: isDarkMode ? '#D8B36A' : '#4A7C72' }]} onPress={() => setFilterVisible(false)}>
                <Text style={[themeStyles.confirmBtnText, { color: isDarkMode ? '#181B22' : '#FFFFFF' }]}>{lang === 'en' ? 'Apply filters' : 'Áp dụng'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, height: 58 },
  headerBack: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 19, fontWeight: '700', color: '#242321' },
  filterTagsContainer: { paddingHorizontal: 15, paddingTop: 12, paddingBottom: 14, gap: 9 },
  filterOpenTag: { minHeight: 42, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1 },
  filterSummaryRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  summaryChip: { flex: 1, minWidth: 0, minHeight: 38, flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1 },
  emptyTrending: { paddingHorizontal: 15, paddingBottom: 20, color: '#888', fontSize: 13 },
  filterTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  filterTagText: { fontSize: 12, fontWeight: '700', color: '#1a1a1a', flexShrink: 1 },
  scrollView: { flex: 1 },
  topHighlightSection: { paddingBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', paddingHorizontal: 15, marginBottom: 12, color: '#1a1a1a' },
  highlightCard: { width: 100, marginRight: 15 },
  highlightCover: {
    width: '100%',
    aspectRatio: 100 / 130,
    backgroundColor: '#ddd',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  highlightTitle: { fontSize: 12, fontWeight: '700', marginTop: 5, color: '#1a1a1a' },
  trendingHeading: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, paddingHorizontal: 15 },
  trendingIcon: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  trendingList: { paddingHorizontal: 15, paddingBottom: 16 },
  trendingMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 4, marginTop: 3 },
  ratingText: { fontSize: 10, fontWeight: '800' },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 15, justifyContent: 'space-between' },
  gridItem: { width: '31%', marginBottom: 20 },
  gridCover: {
    width: '100%',
    aspectRatio: 0.72,
    backgroundColor: '#ddd',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    overflow: 'hidden',
  },
  mockText: { color: '#888', fontWeight: 'bold' },
  gridTitle: { fontSize: 13, fontWeight: '700', color: '#1a1a1a', marginBottom: 4, lineHeight: 18 },
  gridChapter: { fontSize: 11, color: '#888' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.52)', justifyContent: 'flex-end' },
  bottomSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    maxHeight: '85%',
  },
  sheetHandleContainer: { alignItems: 'center', paddingTop: 12, paddingBottom: 10 },
  sheetHandle: { width: 40, height: 4, backgroundColor: '#ccc', borderRadius: 2 },
  sheetTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 16, color: '#1a1a1a' },
  filterGroupTitle: { fontSize: 14, fontWeight: '800', color: '#1a1a1a', marginBottom: 10 },
  filterOptionsGroup: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginBottom: 25 },
  filterOptionsColumn: { gap: 8, marginBottom: 22 },
  filterChoiceRow: { minHeight: 46, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, gap: 10 },
  radioOuter: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  radioInner: { width: 9, height: 9, borderRadius: 5 },
  filterBtn: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  filterBtnActive: {
    backgroundColor: '#386f62',
    borderColor: '#386f62',
  },
  filterBtnText: { fontSize: 13, color: '#555' },
  filterBtnTextActive: { color: '#fff', fontWeight: '700' },
  sheetActions: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#eee' },
  confirmBtn: { flex: 1, backgroundColor: '#386f62', paddingVertical: 13, borderRadius: 12, alignItems: 'center' },
  confirmBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
