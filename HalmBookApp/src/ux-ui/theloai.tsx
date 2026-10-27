import { useState } from 'react';
import { Dimensions, Modal, Platform, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAppNavigation, useAppThemeStyles } from './navigation';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';

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


const { width } = Dimensions.get('window');

// Mock data
const NOVELS = [
  { id: '1', title: 'Trở Thành Rồng Nhỏ', chapter: 'Chapter 26' },
  { id: '2', title: 'Trụ Vương Trùng Sinh Không Làm...', chapter: 'Chapter 257' },
  { id: '3', title: 'Toàn Dân Là Người Chơi: Tôi Có Thể...', chapter: 'Chapter 21' },
  { id: '4', title: 'Tên Sát Thủ Này Lại Là Người Ở Rể', chapter: 'Chapter 27' },
  { id: '5', title: 'Tiến Hóa Vô Hạn Bắt Đầu Từ Con...', chapter: 'Chapter 125' },
  { id: '6', title: 'Tận Thế Cần Một Cao Thủ', chapter: 'Chapter 34' },
];

const GENRES = [
  'Cổ Đại', 'Hiện đại', 'Huyền Huyễn', 'Hài Hước', 
  'Hàn Quốc', 'Hậu Cung', 'Hệ Thống', 'Kinh Dị', 
  'Lịch Sử', 'Mạt Thế', 'Ngôn Tình', 'Thanh xuân - Vườn trường', 
  'Truyện AI', 'Truyện Sáng Tác', 'Trùng Sinh', 'Trọng sinh', 
  'Tu Tiên', 'Xuyên Không', 'Đô Thị'
];

export default function TheLoai() {
  const themeStyles = useAppThemeStyles(styles);
  const [filterVisible, setFilterVisible] = useState(false);
  const { navigate, isDarkMode } = useAppNavigation();
  
  // States cho bộ lọc
  const [activeStatus, setActiveStatus] = useState('Tất cả');
  const [activeSort, setActiveSort] = useState('Ngày cập nhật');
  const [activeGenre, setActiveGenre] = useState('');

  return (
    <View style={themeStyles.container}>
      <ExpoStatusBar style={isDarkMode ? 'light' : 'dark'} />
      
      {/* Header */}
      <View style={themeStyles.header}>
        <View style={{ width: 24 }} /> {/* Spacer */}
        <Text style={themeStyles.headerTitle}>Danh Sách Truyện</Text>
        <TouchableOpacity onPress={() => setFilterVisible(true)}>
          <Icon name="filter-outline" size={24} color="#1a1a1a" />
        </TouchableOpacity>
      </View>

      {/* Lịch sử lọc hiện tại (Filter Tags) */}
      <View style={themeStyles.filterTagsContainer}>
        <View style={themeStyles.filterTag}>
          <Text style={themeStyles.filterTagText}>Trạng thái: {activeStatus}</Text>
        </View>
        <View style={themeStyles.filterTag}>
          <Text style={themeStyles.filterTagText}>Xếp theo: {activeSort}</Text>
        </View>
        {activeGenre ? (
          <View style={themeStyles.filterTag}>
            <Text style={themeStyles.filterTagText}>Thể loại: {activeGenre}</Text>
          </View>
        ) : null}
      </View>

      <ScrollView style={themeStyles.scrollView} showsVerticalScrollIndicator={false}>
        
        {/* Top truyện lướt ngang nổi bật của chuyên mục */}
        <View style={themeStyles.topHighlightSection}>
          <Text style={themeStyles.sectionTitle}>🔥 Đề Cử Hôm Nay</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 15 }}>
            {NOVELS.slice(0, 4).map((n, i) => (
              <TouchableOpacity key={i} style={themeStyles.highlightCard} onPress={() => navigate('bookDetail', { id: n.id, title: n.title, chapter: n.chapter })}>
                <View style={themeStyles.highlightCover}><Text style={themeStyles.mockText}>Ảnh</Text></View>
                <Text style={themeStyles.highlightTitle} numberOfLines={2}>{n.title}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Danh Sách Truyện Dạng Lưới (Grid) */}
        <View style={themeStyles.gridContainer}>
          {NOVELS.concat(NOVELS).map((n, i) => (
            <TouchableOpacity key={i} style={themeStyles.gridItem} onPress={() => navigate('bookDetail', { id: n.id, title: n.title, chapter: n.chapter })}>
              <View style={themeStyles.gridCover}><Text style={themeStyles.mockText}>Ảnh</Text></View>
              <Text style={themeStyles.gridTitle} numberOfLines={2}>{n.title}</Text>
              <Text style={themeStyles.gridChapter}>{n.chapter}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Modal Popup Lọc Truyện */}
      <Modal visible={filterVisible} animationType="slide" transparent={true}>
        <View style={themeStyles.modalOverlay}>
          <View style={themeStyles.bottomSheet}>
            {/* Thanh vuốt */}
            <View style={themeStyles.sheetHandleContainer}>
              <View style={themeStyles.sheetHandle} />
            </View>
            
            <Text style={themeStyles.sheetTitle}>Lọc truyện</Text>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              
              {/* Trạng thái */}
              <Text style={themeStyles.filterGroupTitle}>Trạng thái</Text>
              <View style={themeStyles.filterOptionsGroup}>
                {['Tất cả', 'Đang ra', 'Hoàn thành'].map(st => (
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
              <Text style={themeStyles.filterGroupTitle}>Xếp theo</Text>
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
              <Text style={themeStyles.filterGroupTitle}>Thể loại</Text>
              <View style={themeStyles.filterOptionsGroup}>
                {GENRES.map(genre => (
                  <TouchableOpacity 
                    key={genre} 
                    style={[themeStyles.filterBtn, activeGenre === genre && themeStyles.filterBtnActive]}
                    onPress={() => setActiveGenre(genre === activeGenre ? '' : genre)} // Click lần nữa để hủy chọn
                  >
                    <Text style={[themeStyles.filterBtnText, activeGenre === genre && themeStyles.filterBtnTextActive]}>
                      {activeGenre === genre ? '✓ ' : ''}{genre}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Hai nút hành động */}
            <View style={themeStyles.sheetActions}>
              <TouchableOpacity style={themeStyles.cancelBtn} onPress={() => setFilterVisible(false)}>
                <Text style={themeStyles.cancelBtnText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={themeStyles.confirmBtn} onPress={() => setFilterVisible(false)}>
                <Text style={themeStyles.confirmBtnText}>Xác nhận</Text>
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
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 15,
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#eee'
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1a1a1a' },

  // Filter Tags
  filterTagsContainer: { flexDirection: 'row', padding: 15, flexWrap: 'wrap', gap: 10, backgroundColor: '#f8f9fa' },
  filterTag: {
    backgroundColor: '#d1d8e0', // Màu xám xanh giống ảnh
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 6
  },
  filterTagText: { fontSize: 13, fontWeight: '700', color: '#1a1a1a' },

  scrollView: { flex: 1 },

  // Top Highlight (Lướt ngang cho thể loại nổi bật)
  topHighlightSection: { paddingBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', paddingHorizontal: 15, marginBottom: 12, color: '#1a1a1a' },
  highlightCard: { width: 100, marginRight: 15 },
  highlightCover: { height: 130, backgroundColor: '#ddd', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  highlightTitle: { fontSize: 12, fontWeight: '700', marginTop: 5, color: '#1a1a1a' },

  // Grid
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 15, justifyContent: 'space-between' },
  gridItem: { width: '31%', marginBottom: 20 },
  gridCover: { height: 150, backgroundColor: '#ddd', borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  mockText: { color: '#888', fontWeight: 'bold' },
  gridTitle: { fontSize: 13, fontWeight: '700', color: '#1a1a1a', marginBottom: 4, lineHeight: 18 },
  gridChapter: { fontSize: 11, color: '#888' },

  // Modal (Bottom Sheet)
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  bottomSheet: {
    backgroundColor: '#fdfdfd',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    maxHeight: '85%', // Không cho popup che full màn hình
  },
  sheetHandleContainer: { alignItems: 'center', paddingTop: 12, paddingBottom: 10 },
  sheetHandle: { width: 40, height: 4, backgroundColor: '#ccc', borderRadius: 2 },
  sheetTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 20, color: '#1a1a1a' },

  filterGroupTitle: { fontSize: 15, fontWeight: '700', color: '#1a1a1a', marginBottom: 12, textAlign: 'center' },
  filterOptionsGroup: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginBottom: 25 },
  
  filterBtn: {
    paddingHorizontal: 15, paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1, borderColor: '#ddd',
    backgroundColor: '#fff'
  },
  filterBtnActive: {
    backgroundColor: '#386f62', // Màu xanh lục tối giống ảnh (Xác nhận)
    borderColor: '#386f62'
  },
  filterBtnText: { fontSize: 13, color: '#555' },
  filterBtnTextActive: { color: '#fff', fontWeight: '700' },

  sheetActions: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 15, borderTopWidth: 1, borderTopColor: '#eee' },
  cancelBtn: { flex: 1, backgroundColor: '#a4b0be', paddingVertical: 12, borderRadius: 10, marginRight: 10, alignItems: 'center' },
  cancelBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  confirmBtn: { flex: 1, backgroundColor: '#386f62', paddingVertical: 12, borderRadius: 10, marginLeft: 10, alignItems: 'center' },
  confirmBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },

  // Footer (Giữ lại giao diện giống trang chính)
  bottomNav: {
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee',
    paddingVertical: 10, paddingBottom: Platform.OS === 'ios' ? 25 : 10,
  },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', height: 48 },
  navText: { fontSize: 10, fontWeight: '700', color: '#8f9bb3', marginTop: 4 },
  navActiveText: { color: '#2c3a7a', fontWeight: '900' },
});
