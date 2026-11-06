import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons'; 
import { useAppNavigation } from './navigation';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { getBookCoverSource } from './bookCovers';
import { getBookChapterLabel } from './bookContentService';
import axios from 'axios';
import Constants from 'expo-constants';

const debuggerHost = Constants.expoConfig?.hostUri;
const localhost = debuggerHost ? debuggerHost.split(':')[0] : 'localhost';
const API_BASE_URL = `http://${localhost}:8082`;

const CANDIDATE_API_URLS = [
  API_BASE_URL,
  'http://localhost:8082',
  'http://127.0.0.1:8082',
  'http://192.168.1.165:8082',
  'http://10.0.2.2:8082',
];

interface DmTrangChuProps {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export default function DmTrangChu({ isDarkMode, onToggleDarkMode }: DmTrangChuProps) {
  const { navigate } = useAppNavigation();
  const [books, setBooks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  const styles = getStyles(isDarkMode);

  useEffect(() => {
    let isMounted = true;
    const fetchBooks = async () => {
      setIsLoading(true);
      for (const baseUrl of CANDIDATE_API_URLS) {
        try {
          const res = await axios.get(`${baseUrl}/api/home/books`, {
            params: { page: 0, size: 50 },
            timeout: 6000,
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
              price: item.rent_price !== undefined ? item.rent_price : item.price,
              description: item.description || item.desc || '',
            }));
            setBooks(mapped);
            setIsLoading(false);
            return;
          }
        } catch {
          // thử URL tiếp theo
        }
      }
      if (isMounted) setIsLoading(false);
    };

    fetchBooks();
    return () => {
      isMounted = false;
    };
  }, []);

  const renderNovelCard = (novel: any, width: number | string = 110) => {
    const coverSource = getBookCoverSource(novel.id, novel.img_url);
    const cardWidth = typeof width === 'number' ? width : 110;
    return (
      <TouchableOpacity
        key={novel.id}
        style={[styles.novelCard, { width: cardWidth as any }]}
        activeOpacity={0.9}
        onPress={() => navigate('bookDetail', novel)}
      >
        <View style={[styles.novelCover, { height: cardWidth * 1.3 }]}>
          {coverSource ? (
            <Image source={coverSource} style={StyleSheet.absoluteFill} resizeMode="cover" />
          ) : (
            <Text style={styles.novelCoverText}>Ảnh{'\n'}Bìa</Text>
          )}
        </View>
        <Text style={styles.novelTitle} numberOfLines={2}>{novel.title}</Text>
        <Text style={styles.novelChapter} numberOfLines={1}>{novel.chapter || novel.author}</Text>
      </TouchableOpacity>
    );
  };

  const renderRankItem = (novel: any, index: number) => {
    const coverSource = getBookCoverSource(novel.id, novel.img_url);
    return (
      <TouchableOpacity
        key={novel.id}
        style={styles.rankItem}
        activeOpacity={0.8}
        onPress={() => navigate('bookDetail', novel)}
      >
        <Text style={[styles.rankNumber, index < 3 ? styles.rankNumberTop : null]}>{index + 1}</Text>
        <View style={styles.rankCover}>
          {coverSource ? (
            <Image source={coverSource} style={StyleSheet.absoluteFill} resizeMode="cover" />
          ) : (
            <Text style={styles.rankCoverText}>Ảnh</Text>
          )}
        </View>
        <View style={styles.rankInfo}>
          <Text style={styles.rankTitle} numberOfLines={1}>{novel.title}</Text>
          <Text style={styles.rankChapter} numberOfLines={1}>{novel.chapter || novel.author}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const banners = books.slice(0, 5);

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <ExpoStatusBar style={isDarkMode ? 'light' : 'dark'} />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} bounces={false}>
        <View style={styles.topBackground}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={18} color={isDarkMode ? '#ecf0f1' : '#fff'} style={{ marginRight: 8 }} />
              <TextInput 
                style={styles.searchInput} 
                placeholder="Tìm kiếm tác phẩm..." 
                placeholderTextColor={isDarkMode ? "#aaa" : "#ccc"}
                onFocus={() => navigate('search')}
              />
            </View>
            
            <TouchableOpacity 
              style={styles.darkModeToggle} 
              onPress={onToggleDarkMode}
            >
              <Ionicons name={isDarkMode ? "moon" : "sunny"} size={22} color={isDarkMode ? "#f1c40f" : "#1a1a1a"} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.avatarBtn} onPress={() => navigate('profile')}>
              <Text style={styles.avatarText}>A</Text>
            </TouchableOpacity>
          </View>

          {/* Carousel Banners */}
          {banners.length > 0 && (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={styles.carouselContainer}
              snapToInterval={315} 
              decelerationRate="fast"
            >
              {banners.map((banner, index) => {
                const bSource = getBookCoverSource(banner.id, banner.img_url);
                return (
                  <TouchableOpacity
                    key={banner.id}
                    style={styles.bannerCard}
                    activeOpacity={0.9}
                    onPress={() => navigate('bookDetail', banner)}
                  >
                    <View style={styles.bannerImagePlaceholder}>
                      {bSource ? (
                        <Image source={bSource} style={StyleSheet.absoluteFill} resizeMode="cover" />
                      ) : (
                        <Text style={styles.bannerImageText}>Tác phẩm {index + 1}</Text>
                      )}
                    </View>
                    <View style={styles.bannerOverlay}>
                      <Text style={styles.bannerTitle} numberOfLines={1}>{banner.title}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* Khuyến Khích Đọc */}
        <View style={styles.section}>
          <View style={[styles.sectionTitleBox, { backgroundColor: isDarkMode ? '#30336b' : '#ff9ff3' }]}>
            <Ionicons name="sparkles" size={18} color={isDarkMode ? '#dff9fb' : '#1a1a1a'} style={{marginRight: 6}} />
            <Text style={[styles.sectionTitleText, { color: isDarkMode ? '#dff9fb' : '#1a1a1a' }]}>Khuyến Khích Đọc</Text>
          </View>
          {isLoading ? (
            <ActivityIndicator size="small" color="#5a8b82" style={{ padding: 20 }} />
          ) : books.length === 0 ? (
            <Text style={styles.emptyText}>Chưa có dữ liệu sách</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollList}>
              {books.slice(0, 7).map(n => renderNovelCard(n, 120))}
            </ScrollView>
          )}
        </View>

        {/* Mới Cập Nhật */}
        <View style={styles.section}>
          <View style={[styles.sectionTitleBox, { backgroundColor: isDarkMode ? '#130f40' : '#1dd1a1' }]}>
            <Ionicons name="flash" size={18} color={isDarkMode ? '#dff9fb' : '#1a1a1a'} style={{marginRight: 6}} />
            <Text style={[styles.sectionTitleText, { color: isDarkMode ? '#dff9fb' : '#1a1a1a' }]}>Mới Cập Nhật</Text>
          </View>
          {books.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollList}>
              {books.slice().reverse().slice(0, 7).map(n => renderNovelCard(n, 120))}
            </ScrollView>
          )}
        </View>

        {/* Bảng Xếp Hạng */}
        {books.length > 0 && (
          <View style={styles.section}>
            <View style={[styles.sectionTitleBox, { backgroundColor: isDarkMode ? '#535c68' : '#ffde59' }]}>
              <Ionicons name="podium" size={18} color={isDarkMode ? '#dff9fb' : '#1a1a1a'} style={{marginRight: 6}} />
              <Text style={[styles.sectionTitleText, { color: isDarkMode ? '#dff9fb' : '#1a1a1a' }]}>Bảng Xếp Hạng</Text>
            </View>
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={styles.scrollList}
              snapToInterval={315}
              decelerationRate="fast"
            >
              <View style={styles.rankPage}>
                <View style={styles.rankPageHeader}>
                  <Text style={styles.rankPageTitle}>🏆 Top Tuần</Text>
                  <Text style={styles.rankPageMore}>Xem thêm ›</Text>
                </View>
                {books.slice(0, 5).map((novel, index) => renderRankItem(novel, index))}
              </View>

              <View style={styles.rankPage}>
                <View style={styles.rankPageHeader}>
                  <Text style={styles.rankPageTitle}>🔥 Top Tháng</Text>
                  <Text style={styles.rankPageMore}>Xem thêm ›</Text>
                </View>
                {books.slice().reverse().slice(0, 5).map((novel, index) => renderRankItem(novel, index))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Footer Branding */}
        <View style={styles.footerBranding}>
          <Text style={styles.footerBrandTitle}>HALM <Text style={{ color: '#9b51e0' }}>Book</Text></Text>
          <Text style={styles.footerBrandSlogan}>Sách là ánh sáng!</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (isDark: boolean) => {
  const bgMain = isDark ? '#1e272e' : '#fff';
  const textMain = isDark ? '#ecf0f1' : '#1a1a1a';
  const textSub = isDark ? '#b2bec3' : '#666';
  const cardBg = isDark ? '#2d3436' : '#fff';

  return StyleSheet.create({
    container: { flex: 1, backgroundColor: bgMain },
    scrollView: { flex: 1, backgroundColor: bgMain },
    emptyText: { textAlign: 'center', padding: 20, color: textSub },
    
    topBackground: {
      backgroundColor: isDark ? '#2c3e50' : '#5a8b82',
      borderBottomLeftRadius: 30,
      borderBottomRightRadius: 30,
      paddingTop: 15,
      paddingBottom: 20,
      marginBottom: 10,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 15,
      marginBottom: 20,
    },
    searchContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#34495e' : 'rgba(255, 255, 255, 0.25)',
      borderRadius: 12,
      paddingHorizontal: 12,
      height: 42,
      marginRight: 10,
    },
    searchInput: { flex: 1, fontSize: 14, color: isDark ? '#ecf0f1' : '#fff' },
    darkModeToggle: {
      width: 42,
      height: 42,
      backgroundColor: isDark ? '#34495e' : '#fff',
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 10,
    },
    avatarBtn: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: '#f1c40f',
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarText: { fontSize: 18, fontWeight: '900', color: '#1a1a1a' },

    carouselContainer: { paddingLeft: 15, paddingRight: 5 },
    bannerCard: {
      width: 300,
      height: 150,
      backgroundColor: isDark ? '#2d3436' : '#ccc',
      borderRadius: 15,
      overflow: 'hidden',
      marginRight: 15,
    },
    bannerImagePlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    bannerImageText: { color: '#888', fontWeight: 'bold' },
    bannerOverlay: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'rgba(0,0,0,0.6)',
      padding: 10,
    },
    bannerTitle: { color: '#fff', fontWeight: 'bold', fontSize: 14 },

    section: { marginBottom: 25 },
    sectionTitleBox: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 10,
      marginLeft: 15,
      marginBottom: 15,
    },
    sectionTitleText: { fontSize: 16, fontWeight: '900' },
    scrollList: { paddingLeft: 15, paddingRight: 5 },

    novelCard: { marginRight: 15 },
    novelCover: {
      backgroundColor: isDark ? '#353b48' : '#eee',
      borderRadius: 10,
      marginBottom: 8,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
    },
    novelCoverText: { color: textSub, fontWeight: 'bold', textAlign: 'center' },
    novelTitle: { fontSize: 13, fontWeight: 'bold', color: textMain, marginBottom: 4 },
    novelChapter: { fontSize: 11, color: textSub },

    rankPage: {
      width: 300,
      marginRight: 15,
      backgroundColor: cardBg,
      borderRadius: 15,
      padding: 15,
      elevation: 2,
    },
    rankPageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    rankPageTitle: { fontSize: 16, fontWeight: 'bold', color: textMain },
    rankPageMore: { fontSize: 12, color: textSub },

    rankItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    rankNumber: { width: 25, fontSize: 16, fontWeight: 'bold', color: textSub },
    rankNumberTop: { color: '#ff6b6b' },
    rankCover: {
      width: 40,
      height: 50,
      backgroundColor: isDark ? '#353b48' : '#ddd',
      borderRadius: 6,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 10,
      overflow: 'hidden',
    },
    rankCoverText: { fontSize: 10, color: textSub },
    rankInfo: { flex: 1 },
    rankTitle: { fontSize: 13, fontWeight: 'bold', color: textMain, marginBottom: 2 },
    rankChapter: { fontSize: 11, color: textSub },

    footerBranding: {
      alignItems: 'center',
      paddingVertical: 20,
      borderTopWidth: 1,
      borderTopColor: isDark ? '#2d3436' : '#eee',
      marginTop: 10,
    },
    footerBrandTitle: { fontSize: 24, fontWeight: '900', color: isDark ? '#535c68' : '#ccc' },
    footerBrandSlogan: { fontSize: 12, color: isDark ? '#535c68' : '#ccc', marginTop: 4 },
  });
};
