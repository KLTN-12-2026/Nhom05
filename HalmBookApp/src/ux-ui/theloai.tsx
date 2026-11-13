import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAppNavigation, useAppThemeStyles } from './navigation';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { getBookCoverSource } from './bookCovers';
import { getBookChapterLabel } from './bookContentService';
import { fetchApiWithFallback } from './apiService';

const ICONS = {
  'filter-outline': '☷',
  home: '⌂',
  grid: '▦',
  earth: '◎',
  library: '▤',
  person: '●',
} as const;

function Icon({ name, size, color }: { name: keyof typeof ICONS; size: number; color: string }) {
  return <Text style={{ fontSize: size, color, lineHeight: size }}>{ICONS[name]}</Text>;
}

const GENRES = [
  'Tất cả',
  'Danh Tác Kinh Điển',
  'Hồi Ký & Lịch Sử',
  'Phóng Sự & Xã Hội',
  'Tình Cảm & Tiểu Thuyết',
  'Văn Học Hiện Thực',
];

export default function TheLoai() {
  const themeStyles = useAppThemeStyles(styles);
  const [filterVisible, setFilterVisible] = useState(false);
  const { navigate, isDarkMode, lang } = useAppNavigation();
  
  const [books, setBooks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // States cho bộ lọc
  const [activeStatus, setActiveStatus] = useState('Tất cả');
  const [activeSort, setActiveSort] = useState('Ngày cập nhật');
  const [activeGenre, setActiveGenre] = useState('');

  useEffect(() => {
    let isMounted = true;
    const fetchBooks = async () => {
      setIsLoading(true);
      try {
        const res = await fetchApiWithFallback('/api/home/books', {
          params: { page: 0, size: 50 },
          timeout: 4000,
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
          }));
          setBooks(mapped);
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
    };
  }, []);

  const filteredBooks = useMemo(() => {
    let result = [...books];
    if (activeGenre && activeGenre !== 'Tất cả') {
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

    if (activeSort === 'Lượt xem') {
      result.sort((a, b) => (b.read_count || 0) - (a.read_count || 0));
    } else if (activeSort === 'Truyện mới') {
      result.reverse();
    }
    return result;
  }, [books, activeGenre, activeSort]);

  return (
    <View style={themeStyles.container}>
      <ExpoStatusBar style={isDarkMode ? 'light' : 'dark'} />
      
      {/* Header */}
      <View style={themeStyles.header}>
        <View style={{ width: 24 }} />
        <Text style={themeStyles.headerTitle}>{lang === 'en' ? 'Book List' : 'Kho Sách Thư Viện'}</Text>
        <TouchableOpacity onPress={() => setFilterVisible(true)}>
          <Icon name="filter-outline" size={24} color="#1a1a1a" />
        </TouchableOpacity>
      </View>

      {/* Lịch sử lọc hiện tại (Filter Tags) */}
      <View style={themeStyles.filterTagsContainer}>
        <View style={themeStyles.filterTag}>
          <Text style={themeStyles.filterTagText}>{lang === 'en' ? 'Status: ' : 'Trạng thái: '}{activeStatus}</Text>
        </View>
        <View style={themeStyles.filterTag}>
          <Text style={themeStyles.filterTagText}>{lang === 'en' ? 'Sort by: ' : 'Xếp theo: '}{activeSort}</Text>
        </View>
        {activeGenre ? (
          <View style={themeStyles.filterTag}>
            <Text style={themeStyles.filterTagText}>{lang === 'en' ? 'Genre: ' : 'Thể loại: '}{activeGenre}</Text>
          </View>
        ) : null}
      </View>

      <ScrollView style={themeStyles.scrollView} showsVerticalScrollIndicator={false}>

        {isLoading ? (
          <ActivityIndicator size="small" color="#5a8b82" style={{ marginTop: 40 }} />
        ) : filteredBooks.length === 0 ? (
          <Text style={{ textAlign: 'center', marginTop: 40, color: '#888' }}>
            Không tìm thấy tác phẩm phù hợp
          </Text>
        ) : (
          <>
            {/* Top sách đề cử hôm nay */}
            <View style={themeStyles.topHighlightSection}>
              <Text style={themeStyles.sectionTitle}>🔥 Đề Cử Hôm Nay</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 15 }}>
                {filteredBooks.slice(0, 6).map((n) => {
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
                          <Text style={themeStyles.mockText}>Bìa</Text>
                        )}
                      </View>
                      <Text style={themeStyles.highlightTitle} numberOfLines={2}>{n.title}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>


            {/* Danh Sách Tác Phẩm Dạng Lưới (Grid) */}
            <View style={themeStyles.gridContainer}>
              {filteredBooks.map((n) => {
                const cover = getBookCoverSource(n.id, n.img_url);
                return (
                  <TouchableOpacity
                    key={n.id}
                    style={themeStyles.gridItem}
                    onPress={() => navigate('bookDetail', n)}
                  >
                    <View style={themeStyles.gridCover}>
                      {cover ? (
                        <Image source={cover} style={StyleSheet.absoluteFill} resizeMode="cover" />
                      ) : (
                        <Text style={themeStyles.mockText}>Bìa</Text>
                      )}
                    </View>
                    <Text style={themeStyles.gridTitle} numberOfLines={2}>{n.title}</Text>
                    <Text style={themeStyles.gridChapter} numberOfLines={1}>{n.author || n.chapter}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>

      {/* Modal Popup Lọc Truyện */}
      <Modal visible={filterVisible} animationType="slide" transparent={true}>
        <View style={themeStyles.modalOverlay}>
          <View style={themeStyles.bottomSheet}>
            <View style={themeStyles.sheetHandleContainer}>
              <View style={themeStyles.sheetHandle} />
            </View>
            
            <Text style={themeStyles.sheetTitle}>{lang === 'en' ? 'Filter Books' : 'Lọc tác phẩm'}</Text>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              {/* Trạng thái */}
              <Text style={themeStyles.filterGroupTitle}>{lang === 'en' ? 'Status' : 'Trạng thái'}</Text>
              <View style={themeStyles.filterOptionsGroup}>
                {['Tất cả', 'Đã xuất bản', 'Tiêu biểu'].map(st => (
                  <TouchableOpacity 
                    key={st} 
                    style={[themeStyles.filterBtn, activeStatus === st && themeStyles.filterBtnActive]}
                    onPress={() => setActiveStatus(st)}
                  >
                    <Text style={[themeStyles.filterBtnText, activeStatus === st && themeStyles.filterBtnTextActive]}>
                      {activeStatus === st ? '✓ ' : ''}{st}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Xếp theo */}
              <Text style={themeStyles.filterGroupTitle}>{lang === 'en' ? 'Sort by' : 'Xếp theo'}</Text>
              <View style={themeStyles.filterOptionsGroup}>
                {['Ngày cập nhật', 'Lượt xem', 'Truyện mới'].map(sort => (
                  <TouchableOpacity 
                    key={sort} 
                    style={[themeStyles.filterBtn, activeSort === sort && themeStyles.filterBtnActive]}
                    onPress={() => setActiveSort(sort)}
                  >
                    <Text style={[themeStyles.filterBtnText, activeSort === sort && themeStyles.filterBtnTextActive]}>
                      {activeSort === sort ? '✓ ' : ''}{sort}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Thể loại */}
              <Text style={themeStyles.filterGroupTitle}>{lang === 'en' ? 'Categories' : 'Thể loại'}</Text>
              <View style={themeStyles.filterOptionsGroup}>
                {GENRES.map(genre => (
                  <TouchableOpacity 
                    key={genre} 
                    style={[themeStyles.filterBtn, activeGenre === genre && themeStyles.filterBtnActive]}
                    onPress={() => setActiveGenre(genre === activeGenre ? '' : genre)}
                  >
                    <Text style={[themeStyles.filterBtnText, activeGenre === genre && themeStyles.filterBtnTextActive]}>
                      {activeGenre === genre ? '✓ ' : ''}{genre}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={themeStyles.sheetActions}>
              <TouchableOpacity style={themeStyles.cancelBtn} onPress={() => setFilterVisible(false)}>
                <Text style={themeStyles.cancelBtnText}>{lang === 'en' ? 'Close' : 'Đóng'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={themeStyles.confirmBtn} onPress={() => setFilterVisible(false)}>
                <Text style={themeStyles.confirmBtnText}>{lang === 'en' ? 'Apply' : 'Áp dụng'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 15,
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1a1a1a' },
  filterTagsContainer: { flexDirection: 'row', padding: 15, flexWrap: 'wrap', gap: 10, backgroundColor: '#f8f9fa' },
  filterTag: {
    backgroundColor: '#d1d8e0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  filterTagText: { fontSize: 13, fontWeight: '700', color: '#1a1a1a' },
  scrollView: { flex: 1 },
  topHighlightSection: { paddingBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', paddingHorizontal: 15, marginBottom: 12, color: '#1a1a1a' },
  highlightCard: { width: 100, marginRight: 15 },
  highlightCover: {
    height: 130,
    backgroundColor: '#ddd',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  highlightTitle: { fontSize: 12, fontWeight: '700', marginTop: 5, color: '#1a1a1a' },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 15, justifyContent: 'space-between' },
  gridItem: { width: '31%', marginBottom: 20 },
  gridCover: {
    height: 150,
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
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  bottomSheet: {
    backgroundColor: '#fdfdfd',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    maxHeight: '85%',
  },
  sheetHandleContainer: { alignItems: 'center', paddingTop: 12, paddingBottom: 10 },
  sheetHandle: { width: 40, height: 4, backgroundColor: '#ccc', borderRadius: 2 },
  sheetTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 20, color: '#1a1a1a' },
  filterGroupTitle: { fontSize: 15, fontWeight: '700', color: '#1a1a1a', marginBottom: 12, textAlign: 'center' },
  filterOptionsGroup: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginBottom: 25 },
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
  sheetActions: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 15, borderTopWidth: 1, borderTopColor: '#eee' },
  cancelBtn: { flex: 1, backgroundColor: '#a4b0be', paddingVertical: 12, borderRadius: 10, marginRight: 10, alignItems: 'center' },
  cancelBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  confirmBtn: { flex: 1, backgroundColor: '#386f62', paddingVertical: 12, borderRadius: 10, marginLeft: 10, alignItems: 'center' },
  confirmBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
