import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { ComponentRef, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetchApiWithFallback } from './apiService';
import { getBookCoverSource } from './bookCovers';
import { getBookChapterLabel } from './bookContentService';
import { BookData, GenreBooksParams, useAppNavigation, useAutoHideFooter } from './navigation';

interface GenreBookDto {
  book_id: string;
  bookName: string;
  author?: string;
  img_url?: string;
  category_name?: string;
  rent_price?: number;
  description?: string;
  totalPages?: number;
}

interface BookPage {
  content: GenreBookDto[];
  totalPages: number;
  totalElements: number;
}

const PAGE_SIZE = 12;

export default function GenreBooksScreen({ genre }: { genre?: GenreBooksParams }) {
  const { navigate, goBack, isDarkMode, lang } = useAppNavigation();
  const { onScroll, showFooter } = useAutoHideFooter();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const [page, setPage] = useState(0);
  const [retry, setRetry] = useState(0);
  const [books, setBooks] = useState<BookData[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const categoryId = genre?.categoryId;
  const validGenre = Number.isInteger(categoryId) && Number(categoryId) > 0;
  const textColor = isDarkMode ? '#F5F1E8' : '#242321';
  const mutedColor = isDarkMode ? '#B4B9C4' : '#77716A';
  const accent = isDarkMode ? '#D8B36A' : '#8B4A3C';

  useEffect(() => {
    if (!validGenre) return;
    const controller = new AbortController();
    const load = async () => {
      try {
        const { data, baseUrl } = await fetchApiWithFallback<BookPage>('/api/home/books', {
          params: { categoryId, page, size: PAGE_SIZE },
          timeout: 4000,
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        if (!Array.isArray(data.content) || !Number.isInteger(data.totalPages) || !Number.isInteger(data.totalElements)) {
          throw new Error('Invalid book page');
        }
        // The last page can disappear if books are removed between requests.
        if (data.totalPages > 0 && page >= data.totalPages) {
          setPage(data.totalPages - 1);
          return;
        }
        setBooks(data.content.map((item) => {
          const book: BookData = {
            id: String(item.book_id),
            title: item.bookName,
            author: item.author,
            img_url: item.img_url
              ? (/^(https?:|data:|file:)/.test(item.img_url) ? item.img_url : `${baseUrl}/${item.img_url.replace(/^\/+/, '')}`)
              : `${baseUrl}/api/home/covers/${encodeURIComponent(item.book_id)}.jpg`,
            category_name: item.category_name,
            price: item.rent_price,
            rent_price: item.rent_price,
            description: item.description,
            pages: item.totalPages,
          };
          return { ...book, chapter: getBookChapterLabel(book) };
        }));
        setTotalPages(data.totalPages);
        setTotalElements(data.totalElements);
      } catch {
        if (!controller.signal.aborted) setFailed(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    void load();
    return () => controller.abort();
  }, [categoryId, validGenre, page, retry]);

  const changePage = (next: number) => {
    if (loading || next < 0 || next >= totalPages || next === page) return;
    setLoading(true);
    setPage(next);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
    showFooter();
  };
  const firstPage = Math.max(0, Math.min(page - 1, totalPages - 3));
  const visiblePages = Array.from({ length: Math.min(3, totalPages) }, (_, index) => firstPage + index);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.container, { backgroundColor: isDarkMode ? '#101319' : '#FFFFFF' }]}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.back} accessibilityRole="button" accessibilityLabel={lang === 'en' ? 'Go back' : 'Quay lại'}>
          <Ionicons name="arrow-back" size={23} color={textColor} />
        </TouchableOpacity>
        <View style={styles.heading}>
          <Text style={[styles.eyebrow, { color: accent }]}>{lang === 'en' ? 'EXPLORE BOOKS' : 'KHÁM PHÁ SÁCH'}</Text>
          <Text style={[styles.title, { color: textColor }]}>{genre?.categoryName || (lang === 'en' ? 'Genre' : 'Thể loại')}</Text>
        </View>
      </View>
      <ScrollView ref={scrollRef} onScroll={onScroll} scrollEventThrottle={16} contentContainerStyle={[styles.content, { paddingBottom: 120 + insets.bottom }]}>
        {!validGenre ? (
          <Text style={[styles.message, { color: mutedColor }]}>{lang === 'en' ? 'Select a genre from the homepage.' : 'Vui lòng chọn thể loại từ trang chủ.'}</Text>
        ) : loading ? (
          <View style={styles.status} accessibilityLiveRegion="polite">
            <ActivityIndicator size="large" color={accent} />
            <Text style={[styles.message, { color: mutedColor }]}>{lang === 'en' ? 'Loading books...' : 'Đang tải sách...'}</Text>
          </View>
        ) : failed ? (
          <View style={styles.status}>
            <Text style={[styles.message, { color: mutedColor }]}>{lang === 'en' ? 'Unable to load books. Please try again.' : 'Không thể tải sách. Vui lòng thử lại.'}</Text>
            <TouchableOpacity onPress={() => { setLoading(true); setFailed(false); setRetry((value) => value + 1); }} style={[styles.retry, { borderColor: accent }]} accessibilityRole="button">
              <Text style={{ color: accent }}>{lang === 'en' ? 'Retry' : 'Thử lại'}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={[styles.count, { color: mutedColor }]} accessibilityLiveRegion="polite">
              {lang === 'en' ? `${totalElements} books` : `${totalElements} tác phẩm`}
              {totalPages > 0 ? ` · ${lang === 'en' ? 'Page' : 'Trang'} ${page + 1}/${totalPages}` : ''}
            </Text>
            {books.length === 0 ? (
              <Text style={[styles.message, { color: mutedColor }]}>{lang === 'en' ? 'No books in this genre yet.' : 'Thể loại này chưa có sách.'}</Text>
            ) : (
              <View style={styles.grid}>
                {books.map((book) => (
                  <TouchableOpacity key={book.id} style={styles.card} activeOpacity={0.88} onPress={() => navigate('bookDetail', book)} accessibilityRole="button" accessibilityLabel={book.title}>
                    <View style={[styles.cover, { backgroundColor: isDarkMode ? '#2B303B' : '#F2EFE9', borderColor: isDarkMode ? '#3D4452' : '#E8E4DC' }]}>
                      <Image source={getBookCoverSource(book.id, book.img_url)} style={StyleSheet.absoluteFill} resizeMode="cover" />
                    </View>
                    <Text style={[styles.bookTitle, { color: textColor }]} numberOfLines={2}>{book.title}</Text>
                    <Text style={[styles.author, { color: mutedColor }]} numberOfLines={1}>{book.author}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}
        {validGenre && totalPages > 0 && !failed && (
          <View>
          <View style={styles.pagination}>
            {[page - 1, ...visiblePages, page + 1].map((target, index) => {
              const previous = index === 0;
              const next = index === visiblePages.length + 1;
              const selected = !previous && !next && target === page;
              const disabled = loading || target < 0 || target >= totalPages;
              return (
                <TouchableOpacity key={`${index}-${target}`} onPress={() => changePage(target)} disabled={disabled} accessibilityRole="button"
                  accessibilityLabel={previous ? (lang === 'en' ? 'Previous page' : 'Trang trước') : next ? (lang === 'en' ? 'Next page' : 'Trang sau') : `${lang === 'en' ? 'Page' : 'Trang'} ${target + 1}`}
                  accessibilityState={{ disabled, selected }}
                  style={[styles.pageButton, { borderColor: accent, backgroundColor: selected ? accent : 'transparent', opacity: disabled ? 0.35 : 1 }]}>
                  {previous || next ? <Ionicons name={previous ? 'chevron-back' : 'chevron-forward'} size={18} color={accent} /> : <Text style={{ color: selected ? (isDarkMode ? '#101319' : '#FFFFFF') : accent }}>{target + 1}</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={[styles.message, { color: mutedColor }]}>{lang === 'en' ? 'Page' : 'Trang'} {page + 1} / {totalPages}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 14, gap: 8 },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  heading: { flex: 1 },
  eyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 4 },
  title: { fontSize: 21, fontWeight: '800' },
  content: { paddingHorizontal: 16, width: '100%', maxWidth: 1000, alignSelf: 'center' },
  count: { fontSize: 13, marginVertical: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 18 },
  card: { width: 115, marginBottom: 8 },
  cover: { width: 115, height: 155, borderWidth: 1, borderRadius: 10, overflow: 'hidden' },
  bookTitle: { fontSize: 13, lineHeight: 18, fontWeight: '700', marginTop: 8 },
  author: { fontSize: 11, marginTop: 4 },
  status: { paddingVertical: 45, alignItems: 'center' },
  message: { textAlign: 'center', marginVertical: 24, lineHeight: 22 },
  retry: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 22, paddingVertical: 12 },
  pagination: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 24 },
  pageButton: { width: 44, height: 44, borderWidth: 1, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
});
