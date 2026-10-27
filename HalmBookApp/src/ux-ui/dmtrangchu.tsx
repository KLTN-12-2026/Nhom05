import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Platform, StatusBar, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; 
import { useAppNavigation } from './navigation';
import { SafeAreaView } from 'react-native-safe-area-context';

// Mock Data
const CAROUSEL = [
  { id: '1', title: 'Cao Võ Tiến Hóa: Bắt Đầu Từ Việc Thức Tỉnh...' },
  { id: '2', title: 'Toàn Cầu Băng Phong: Ta Chế Tạo Phòng An Toàn' },
];

const NOVELS = [
  { id: '1', title: 'Bỏ làm simp chúa, ta có trong tay...', chapter: 'Chapter 335' },
  { id: '2', title: 'Đồ Đệ Của Ta Đều Là Trùm Phản Diện', chapter: 'Chapter 555' },
  { id: '3', title: 'Buôn Bán Thời Tận Thế: Ta Dùng...', chapter: 'Chapter 70' },
];

const BXH_NOVELS = [
  { id: '1', title: 'Thiên Đạo Đồ Thư Quán', chapter: 'Chapter 1024' },
  { id: '2', title: 'Võ Luyện Đỉnh Phong', chapter: 'Chapter 3000' },
  { id: '3', title: 'Toàn Chức Pháp Sư', chapter: 'Chapter 2500' },
  { id: '4', title: 'Đấu Phá Thương Khung', chapter: 'Chapter 1641' },
  { id: '5', title: 'Nguyên Tôn', chapter: 'Chapter 1200' },
];

interface DmTrangChuProps {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export default function DmTrangChu({ isDarkMode, onToggleDarkMode }: DmTrangChuProps) {
  const { navigate } = useAppNavigation();
  
  const styles = getStyles(isDarkMode);

  const renderNovelCard = (novel: any, width: number = 110) => (
    <TouchableOpacity key={novel.id} style={[styles.novelCard, { width }]} activeOpacity={0.9} onPress={() => navigate('bookDetail', novel)}>
      <View style={[styles.novelCover, { height: width * 1.3 }]}>
        <Text style={styles.novelCoverText}>Ảnh{'\n'}Truyện</Text>
      </View>
      <Text style={styles.novelTitle} numberOfLines={2}>{novel.title}</Text>
      <Text style={styles.novelChapter}>{novel.chapter}</Text>
    </TouchableOpacity>
  );

  const renderRankItem = (novel: any, index: number) => (
    <TouchableOpacity key={novel.id} style={styles.rankItem} activeOpacity={0.8} onPress={() => navigate('bookDetail', novel)}>
      <Text style={[styles.rankNumber, index < 3 ? styles.rankNumberTop : null]}>{index + 1}</Text>
      <View style={styles.rankCover}>
         <Text style={styles.rankCoverText}>Ảnh</Text>
      </View>
      <View style={styles.rankInfo}>
        <Text style={styles.rankTitle} numberOfLines={1}>{novel.title}</Text>
        <Text style={styles.rankChapter}>{novel.chapter}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <StatusBar translucent={false} backgroundColor={isDarkMode ? '#1F2228' : '#5a8b82'} barStyle={isDarkMode ? "light-content" : "dark-content"} />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} bounces={false}>
        
        <View style={styles.topBackground}>
          {/* Header: Thanh tìm kiếm + Dark Mode Toggle + Avatar */}
          <View style={styles.header}>
            <View style={styles.searchContainer}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput 
                style={styles.searchInput} 
                placeholder="Tìm kiếm truyện ..." 
                placeholderTextColor={isDarkMode ? "#aaa" : "#ccc"}
                onFocus={() => navigate('search')}
              />
            </View>
            
            {/* Nút bật/tắt Dark Mode */}
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
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.carouselContainer}
            snapToInterval={315} 
            decelerationRate="fast"
          >
            {CAROUSEL.map((banner, index) => (
              <TouchableOpacity key={banner.id} style={styles.bannerCard} activeOpacity={0.9} onPress={() => navigate('bookDetail', { id: banner.id, title: banner.title })}>
                <View style={styles.bannerImagePlaceholder}>
                  <Text style={styles.bannerImageText}>Banner {index + 1}</Text>
                </View>
                <View style={styles.bannerOverlay}>
                  <Text style={styles.bannerTitle} numberOfLines={1}>{banner.title}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          <View style={styles.paginationDots}>
            <View style={[styles.dot, styles.dotActive]} />
            <View style={styles.dot} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>
        </View>

        {/* Thanh Công Cụ (Toolbar) */}
        <View style={styles.toolbar}>
          {[
            { icon: '⭐', label: 'Xếp hạng\nđộc giả', color: isDarkMode ? '#f39c12' : '#ffde59' },
            { icon: '🔖', label: 'Sách đã\nlưu', color: isDarkMode ? '#8e44ad' : '#a29bfe' },
            { icon: '📰', label: 'Bảng\ntin', color: isDarkMode ? '#16a085' : '#1dd1a1' },
            { icon: '🎁', label: 'Ưu\nđãi', color: isDarkMode ? '#e74c3c' : '#ff6b6b' },
          ].map((item, idx) => (
            <TouchableOpacity key={idx} style={styles.toolbarItem}>
              <View style={[styles.toolbarIconBox, { backgroundColor: item.color }]}>
                <Text style={styles.toolbarIcon}>{item.icon}</Text>
              </View>
              <Text style={styles.toolbarLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Khuyến Khích Đọc */}
        <View style={styles.section}>
          <View style={[styles.sectionTitleBox, { backgroundColor: isDarkMode ? '#30336b' : '#ff9ff3' }]}>
            <Ionicons name="sparkles" size={18} color={isDarkMode ? '#dff9fb' : '#1a1a1a'} style={{marginRight: 6}} />
            <Text style={[styles.sectionTitleText, { color: isDarkMode ? '#dff9fb' : '#1a1a1a' }]}>Khuyến Khích Đọc</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollList}>
            {NOVELS.map(n => renderNovelCard(n, 120))}
          </ScrollView>
        </View>

        {/* Mới Cập Nhật */}
        <View style={styles.section}>
          <View style={[styles.sectionTitleBox, { backgroundColor: isDarkMode ? '#130f40' : '#1dd1a1' }]}>
            <Ionicons name="flash" size={18} color={isDarkMode ? '#dff9fb' : '#1a1a1a'} style={{marginRight: 6}} />
            <Text style={[styles.sectionTitleText, { color: isDarkMode ? '#dff9fb' : '#1a1a1a' }]}>Mới Cập Nhật</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollList}>
            {NOVELS.slice().reverse().map(n => renderNovelCard(n, 120))}
          </ScrollView>
        </View>

        {/* Bảng Xếp Hạng */}
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
              {BXH_NOVELS.map((novel, index) => renderRankItem(novel, index))}
            </View>

            <View style={styles.rankPage}>
              <View style={styles.rankPageHeader}>
                <Text style={styles.rankPageTitle}>🔥 Top Tháng</Text>
                <Text style={styles.rankPageMore}>Xem thêm ›</Text>
              </View>
              {BXH_NOVELS.map((novel, index) => renderRankItem(novel, index))}
            </View>

            <View style={styles.rankPage}>
              <View style={styles.rankPageHeader}>
                <Text style={styles.rankPageTitle}>👑 Top All</Text>
                <Text style={styles.rankPageMore}>Xem thêm ›</Text>
              </View>
              {BXH_NOVELS.map((novel, index) => renderRankItem(novel, index))}
            </View>
          </ScrollView>
        </View>

        {/* Danh Mục Sách */}
        <View style={[styles.section, { paddingHorizontal: 15 }]}>
          <View style={[styles.sectionTitleBox, { marginLeft: 0, backgroundColor: isDarkMode ? '#222f3e' : '#48dbfb' }]}>
            <Ionicons name="library" size={18} color={isDarkMode ? '#dff9fb' : '#1a1a1a'} style={{marginRight: 6}} />
            <Text style={[styles.sectionTitleText, { color: isDarkMode ? '#dff9fb' : '#1a1a1a' }]}>Danh Mục Sách</Text>
          </View>
          
          <View style={styles.categoryTags}>
            {['Mới cập nhật', 'Top tuần', 'Top tháng', 'Mới ra mắt'].map(tag => (
              <TouchableOpacity key={tag} style={styles.categoryTag}>
                <Text style={styles.categoryTagText}>{tag}</Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <View style={styles.gridContainer}>
            {NOVELS.concat(NOVELS).map((n, idx) => (
              <View key={idx} style={styles.gridItem}>
                {renderNovelCard(n, '100%' as any)}
              </View>
            ))}
          </View>
        </View>

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
  const borderMain = isDark ? '#ecf0f1' : '#1a1a1a';
  const cardBg = isDark ? '#2d3436' : '#fff';

  return StyleSheet.create({
    container: { flex: 1, backgroundColor: bgMain },
    scrollView: { flex: 1, backgroundColor: bgMain },
    
    topBackground: {
      backgroundColor: isDark ? '#2c3e50' : '#5a8b82',
      borderBottomLeftRadius: 30,
      borderBottomRightRadius: 30,
      paddingTop: 15,
      paddingBottom: 20,
      marginBottom: 10,
      borderBottomWidth: 3,
      borderBottomColor: borderMain,
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
      backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.2)',
      borderRadius: 25,
      paddingHorizontal: 15,
      height: 45,
      borderWidth: 2,
      borderColor: isDark ? '#fff' : '#1a1a1a', 
    },
    searchIcon: { fontSize: 16, marginRight: 10, color: '#fff' },
    searchInput: { flex: 1, color: '#fff', fontWeight: '600', fontSize: 15 },
    
    darkModeToggle: {
      width: 40, height: 40,
      backgroundColor: isDark ? '#2f3640' : '#fff',
      borderRadius: 20,
      borderWidth: 2,
      borderColor: isDark ? '#fff' : '#1a1a1a',
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 10,
    },

    avatarBtn: {
      width: 45, height: 45,
      backgroundColor: '#ffde59',
      borderRadius: 25,
      borderWidth: 2,
      borderColor: '#1a1a1a',
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 10,
    },
    avatarText: { fontSize: 20, fontWeight: '900', color: '#1a1a1a' },

    // Carousel
    carouselContainer: { paddingLeft: 15, paddingRight: 5 },
    bannerCard: {
      width: 300, height: 170,
      backgroundColor: isDark ? '#576574' : '#ccc',
      borderRadius: 15,
      borderWidth: 3, borderColor: borderMain,
      marginRight: 15,
      overflow: 'hidden',
    },
    bannerImagePlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: isDark ? '#222f3e' : '#34495e' },
    bannerImageText: { color: '#fff', fontSize: 24, fontWeight: '800', opacity: 0.5 },
    bannerOverlay: {
      position: 'absolute', bottom: 0, left: 0, right: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      padding: 10, paddingBottom: 12,
    },
    bannerTitle: { color: '#fff', fontWeight: '700', fontSize: 14 },
    
    // Dots
    paginationDots: { flexDirection: 'row', justifyContent: 'center', marginTop: 15 },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.4)', marginHorizontal: 4 },
    dotActive: { width: 24, backgroundColor: '#fff' },

    // Toolbar
    toolbar: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingVertical: 15,
      paddingHorizontal: 10,
      marginBottom: 10,
    },
    toolbarItem: { alignItems: 'center', flex: 1 },
    toolbarIconBox: {
      width: 50, height: 50,
      borderRadius: 25,
      borderWidth: 2, borderColor: borderMain,
      justifyContent: 'center', alignItems: 'center',
      marginBottom: 8,
      shadowColor: borderMain, shadowOffset: { width: 2, height: 2 }, shadowOpacity: 1, shadowRadius: 0, elevation: 3
    },
    toolbarIcon: { fontSize: 24 },
    toolbarLabel: { fontSize: 12, fontWeight: '700', color: textMain, textAlign: 'center', lineHeight: 16 },

    // Sections (Khuyến khích, Mới cập nhật)
    section: { marginBottom: 25 },
    sectionTitleBox: {
      flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
      paddingHorizontal: 12, paddingVertical: 6,
      borderRadius: 10,
      borderWidth: 2, borderColor: '#1a1a1a',
      marginLeft: 15, marginBottom: 15,
      shadowColor: '#1a1a1a', shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 3
    },
    sectionTitleText: { fontSize: 16, fontWeight: '900' },
    scrollList: { paddingLeft: 15, paddingRight: 5 },
    
    novelCard: { marginRight: 15 },
    novelCover: {
      backgroundColor: isDark ? '#4b6584' : '#ddd',
      borderRadius: 10,
      borderWidth: 2, borderColor: borderMain,
      marginBottom: 8,
      justifyContent: 'center', alignItems: 'center',
      overflow: 'hidden'
    },
    novelCoverText: { color: isDark ? '#d1d8e0' : '#888', fontWeight: '800', textAlign: 'center' },
    novelTitle: { fontSize: 13, fontWeight: '800', color: textMain, marginBottom: 4, lineHeight: 18 },
    novelChapter: { fontSize: 11, fontWeight: '600', color: textSub },

    // Bảng xếp hạng (Hình dọc, lướt ngang)
    rankPage: {
      width: 300, 
      marginRight: 15,
      backgroundColor: cardBg,
      borderRadius: 15,
      borderWidth: 2, borderColor: borderMain,
      padding: 15,
      shadowColor: borderMain, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 3
    },
    rankPageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    rankPageTitle: { fontSize: 16, fontWeight: '900', color: textMain },
    rankPageMore: { fontSize: 12, fontWeight: '700', color: textSub },
    
    rankItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    rankNumber: { width: 25, fontSize: 18, fontWeight: '900', color: textSub },
    rankNumberTop: { color: isDark ? '#ff7979' : '#ff6b6b' },
    rankCover: { width: 45, height: 60, backgroundColor: isDark ? '#4b6584' : '#ddd', borderRadius: 6, borderWidth: 1, borderColor: borderMain, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    rankCoverText: { fontSize: 10, color: isDark ? '#d1d8e0' : '#888', fontWeight: '800' },
    rankInfo: { flex: 1 },
    rankTitle: { fontSize: 14, fontWeight: '800', color: textMain, marginBottom: 4 },
    rankChapter: { fontSize: 12, fontWeight: '600', color: textSub },

    // Category tags
    categoryTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
    categoryTag: { 
      paddingHorizontal: 15, paddingVertical: 8, 
      borderRadius: 20, borderWidth: 2, borderColor: borderMain, 
      backgroundColor: isDark ? '#2f3640' : '#ffde59',
      shadowColor: borderMain, shadowOffset: { width: 2, height: 2 }, shadowOpacity: 1, shadowRadius: 0, elevation: 2
    },
    categoryTagText: { fontSize: 12, fontWeight: '800', color: isDark ? '#7f8fa6' : '#1a1a1a' },
    
    gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    gridItem: { width: '30%', marginBottom: 20 },

    // Bottom Navigation
    bottomNav: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      backgroundColor: bgMain,
      borderTopWidth: 2, borderTopColor: isDark ? '#2d3436' : '#eee',
      paddingVertical: 10,
      paddingBottom: Platform.OS === 'ios' ? 25 : 10,
      zIndex: 1000,
    },
    navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', height: 48 },
    navText: { fontSize: 10, fontWeight: '700', color: isDark ? '#636e72' : '#8f9bb3', marginTop: 4 },
    navActiveText: { color: isDark ? '#ffde59' : '#2c3a7a', fontWeight: '900' },

    // Footer Branding 
    footerBranding: { alignItems: 'center', paddingVertical: 15, borderTopWidth: 2, borderTopColor: isDark ? '#2d3436' : '#f1f2f6', marginTop: 10 },
    footerBrandTitle: { fontSize: 28, fontWeight: '900', color: isDark ? '#4b6584' : '#ccc', letterSpacing: 1 },
    footerBrandSlogan: { fontSize: 12, fontWeight: '700', color: isDark ? '#4b6584' : '#ccc', marginTop: 5 }
  });
}
