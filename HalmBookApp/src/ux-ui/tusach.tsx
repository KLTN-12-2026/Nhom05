import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppNavigation, useAppThemeStyles } from './navigation';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getBookCoverSource } from './bookCovers';

interface ShelfBook {
  id: string;
  title: string;
  author?: string;
  chapter?: string;
  chapterNum?: number;
  progress?: number;
  img_url?: string;
}

export default function TuSach() {
  const themeStyles = useAppThemeStyles(styles);
  const [activeTab, setActiveTab] = useState<'dangdoc' | 'dadoc'>('dangdoc');
  const { navigate, isDarkMode } = useAppNavigation();

  const [readingList, setReadingList] = useState<ShelfBook[]>([]);
  const [completedList, setCompletedList] = useState<ShelfBook[]>([]);

  useEffect(() => {
    let isMounted = true;
    const loadShelf = async () => {
      try {
        const keys = await AsyncStorage.getAllKeys();
        const progressKeys = keys.filter(k => k.startsWith('@halm_reading_progress_'));
        
        if (progressKeys.length > 0) {
          const pairs = await AsyncStorage.multiGet(progressKeys);
          const reading: ShelfBook[] = [];
          const completed: ShelfBook[] = [];

          for (const [k, v] of pairs) {
            if (!v) continue;
            try {
              const bookId = k.replace('@halm_reading_progress_', '');
              const parsed = JSON.parse(v);
              const item: ShelfBook = {
                id: bookId,
                title: parsed.title || parsed.bookTitle || `Tác phẩm ${bookId}`,
                author: parsed.author || 'HALM BOOK',
                chapter: parsed.chapterTitle || (parsed.chapterNum ? `Chương ${parsed.chapterNum}` : 'Đang đọc'),
                progress: parsed.progress || Math.min(100, Math.max(10, (parsed.chapterNum || 1) * 15)),
                img_url: parsed.img_url,
              };
              if (item.progress && item.progress >= 100) {
                completed.push(item);
              } else {
                reading.push(item);
              }
            } catch {}
          }

          if (isMounted) {
            setReadingList(reading);
            setCompletedList(completed);
          }
        } else {
          if (isMounted) {
            setReadingList([]);
            setCompletedList([]);
          }
        }
      } catch {
        if (isMounted) {
          setReadingList([]);
          setCompletedList([]);
        }
      }
    };

    loadShelf();
    return () => {
      isMounted = false;
    };
  }, []);

  const currentList = activeTab === 'dangdoc' ? readingList : completedList;

  return (
    <View style={themeStyles.container}>
      <ExpoStatusBar style={isDarkMode ? 'light' : 'dark'} />
      
      {/* Header */}
      <View style={themeStyles.header}>
        <Text style={themeStyles.headerTitle}>Tủ Sách Của Tôi</Text>
        <TouchableOpacity style={themeStyles.headerIcon} onPress={() => navigate('search')}>
          <Ionicons name="search" size={24} color="#1a1a1a" />
        </TouchableOpacity>
      </View>

      {/* Tabs Chuyển Đổi */}
      <View style={themeStyles.tabContainer}>
        <TouchableOpacity 
          style={[themeStyles.tabBtn, activeTab === 'dangdoc' && themeStyles.tabBtnActive]} 
          onPress={() => setActiveTab('dangdoc')}
        >
          <Text style={[themeStyles.tabText, activeTab === 'dangdoc' && themeStyles.tabTextActive]}>
            Sách đang đọc ({readingList.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[themeStyles.tabBtn, activeTab === 'dadoc' && themeStyles.tabBtnActive]} 
          onPress={() => setActiveTab('dadoc')}
        >
          <Text style={[themeStyles.tabText, activeTab === 'dadoc' && themeStyles.tabTextActive]}>
            Sách đã đọc ({completedList.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={themeStyles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Box Thống kê */}
        <View style={themeStyles.statsCard}>
          <View style={themeStyles.statsHeader}>
            <Text style={themeStyles.statsHeaderText}>Thống kê Tủ sách</Text>
          </View>
          <View style={themeStyles.statsBody}>
            <View style={themeStyles.statItem}>
              <Text style={themeStyles.statValue}>{readingList.length}</Text>
              <Text style={themeStyles.statLabel}>Đang đọc</Text>
            </View>
            <View style={themeStyles.statDivider} />
            <View style={themeStyles.statItem}>
              <Text style={themeStyles.statValue}>{completedList.length}</Text>
              <Text style={themeStyles.statLabel}>Đã hoàn thành</Text>
            </View>
          </View>
        </View>

        {currentList.length === 0 ? (
          <View style={themeStyles.emptyContainer}>
            <Ionicons name="library-outline" size={54} color={isDarkMode ? '#555' : '#aaa'} />
            <Text style={themeStyles.emptyText}>
              {activeTab === 'dangdoc'
                ? 'Bạn chưa có cuốn sách nào đang đọc'
                : 'Bạn chưa hoàn thành cuốn sách nào'}
            </Text>
            <TouchableOpacity
              style={themeStyles.exploreBtn}
              onPress={() => navigate('home')}
            >
              <Text style={themeStyles.exploreBtnText}>Khám phá sách ngay</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={themeStyles.listContainer}>
            {currentList.map((item) => {
              const cover = getBookCoverSource(item.id, item.img_url);
              return (
                <TouchableOpacity
                  key={item.id}
                  style={themeStyles.bookCard}
                  activeOpacity={0.8}
                  onPress={() => navigate('bookDetail', item as any)}
                >
                  <View style={themeStyles.bookCover}>
                    {cover ? (
                      <Image source={cover} style={StyleSheet.absoluteFill} resizeMode="cover" />
                    ) : (
                      <Text style={themeStyles.mockCoverText}>Ảnh</Text>
                    )}
                  </View>
                  
                  <View style={themeStyles.bookInfo}>
                    <Text style={themeStyles.bookTitle} numberOfLines={2}>{item.title}</Text>
                    <Text style={themeStyles.bookChapter}>{item.chapter || item.author}</Text>
                    
                    {/* Thanh tiến độ */}
                    <View style={themeStyles.progressContainer}>
                      <View style={themeStyles.progressBarBg}>
                        <View style={[themeStyles.progressBarFill, { width: `${item.progress || 20}%` }]} />
                      </View>
                      <Text style={themeStyles.progressText}>{item.progress || 20}%</Text>
                    </View>
                    
                    {/* Buttons */}
                    <View style={themeStyles.actionRow}>
                      <TouchableOpacity
                        style={themeStyles.continueBtn}
                        onPress={() =>
                          navigate('reader', {
                            ...item,
                            initialChapterIndex:
                              typeof item.chapterNum === 'number'
                                ? Math.max(0, item.chapterNum - 1)
                                : 0,
                          } as any)
                        }
                      >
                        <Text style={themeStyles.continueBtnText}>Đọc tiếp</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fdfbf7' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 15,
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 2,
    borderBottomColor: '#1a1a1a',
  },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#1a1a1a' },
  headerIcon: { padding: 4 },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fdfbf7',
    gap: 12,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#1a1a1a',
    borderRadius: 12,
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: '#5a8b82',
    borderColor: '#1a1a1a',
  },
  tabText: { fontSize: 13, fontWeight: '800', color: '#1a1a1a' },
  tabTextActive: { color: '#fff' },
  scrollContainer: { flex: 1, paddingHorizontal: 20 },
  statsCard: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#1a1a1a',
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
  },
  statsHeader: {
    backgroundColor: '#5a8b82',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderBottomWidth: 2,
    borderBottomColor: '#1a1a1a',
  },
  statsHeaderText: { fontSize: 12, fontWeight: '900', color: '#fff', textTransform: 'uppercase' },
  statsBody: { flexDirection: 'row', paddingVertical: 15 },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '900', color: '#1a1a1a' },
  statLabel: { fontSize: 11, fontWeight: '700', color: '#666', marginTop: 2 },
  statDivider: { width: 2, backgroundColor: '#1a1a1a' },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#888',
    marginTop: 14,
    textAlign: 'center',
  },
  exploreBtn: {
    marginTop: 20,
    backgroundColor: '#5a8b82',
    borderWidth: 2,
    borderColor: '#1a1a1a',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  exploreBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  listContainer: { paddingBottom: 30 },
  bookCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#1a1a1a',
    borderRadius: 14,
    padding: 12,
    marginBottom: 15,
  },
  bookCover: {
    width: 75,
    height: 105,
    backgroundColor: '#e0dcd3',
    borderWidth: 1.5,
    borderColor: '#1a1a1a',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  mockCoverText: { fontSize: 12, color: '#888', fontWeight: 'bold' },
  bookInfo: { flex: 1, marginLeft: 12, justifyContent: 'space-between' },
  bookTitle: { fontSize: 14, fontWeight: '800', color: '#1a1a1a' },
  bookChapter: { fontSize: 12, fontWeight: '600', color: '#666', marginTop: 2 },
  progressContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 6, gap: 8 },
  progressBarBg: { flex: 1, height: 8, backgroundColor: '#eee', borderWidth: 1, borderColor: '#1a1a1a', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#5a8b82' },
  progressText: { fontSize: 11, fontWeight: '800', color: '#1a1a1a' },
  actionRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 4 },
  continueBtn: {
    backgroundColor: '#5a8b82',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#1a1a1a',
  },
  continueBtnText: { color: '#fff', fontSize: 12, fontWeight: '800' },
});
