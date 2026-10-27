import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppNavigation, useAppThemeStyles } from './navigation';

// Mock Data
const DANG_DOC = [
  { id: '1', title: 'Kiếm Đạo Độc Tôn', chapter: 'Chương 142/500', progress: 28 },
  { id: '2', title: 'Toàn Cầu Băng Phong: Ta Chế Tạo Phòng An Toàn', chapter: 'Chương 45/300', progress: 15 },
  { id: '3', title: 'Bỏ làm simp chúa, ta có trong tay...', chapter: 'Chương 330/335', progress: 98 },
];

const DA_DOC = [
  { id: '4', title: 'Đấu Phá Thương Khung', total: '1641 Chương' },
  { id: '5', title: 'Võ Luyện Đỉnh Phong', total: '3000 Chương' },
  { id: '6', title: 'Thiên Đạo Đồ Thư Quán', total: '1024 Chương' },
];

export default function TuSach() {
  const themeStyles = useAppThemeStyles(styles);
  const [activeTab, setActiveTab] = useState<'dangdoc' | 'dadoc'>('dangdoc');
  const { navigate, isDarkMode } = useAppNavigation();

  return (
    <View style={themeStyles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={themeStyles.header}>
        <Text style={themeStyles.headerTitle}>Tủ Sách Của Tôi</Text>
        <TouchableOpacity style={themeStyles.headerIcon} onPress={() => navigate('search')}>
          <Ionicons name="search" size={24} color="#1a1a1a" />
        </TouchableOpacity>
      </View>

      {/* Tabs Chuyển Đổi (Neo-brutalism style) */}
      <View style={themeStyles.tabContainer}>
        <TouchableOpacity 
          style={[themeStyles.tabBtn, activeTab === 'dangdoc' && themeStyles.tabBtnActive]} 
          onPress={() => setActiveTab('dangdoc')}
        >
          <Text style={[themeStyles.tabText, activeTab === 'dangdoc' && themeStyles.tabTextActive]}>Sách đang đọc</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[themeStyles.tabBtn, activeTab === 'dadoc' && themeStyles.tabBtnActive]} 
          onPress={() => setActiveTab('dadoc')}
        >
          <Text style={[themeStyles.tabText, activeTab === 'dadoc' && themeStyles.tabTextActive]}>Sách đã đọc</Text>
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
              <Text style={themeStyles.statValue}>{DANG_DOC.length}</Text>
              <Text style={themeStyles.statLabel}>Đang đọc</Text>
            </View>
            <View style={themeStyles.statDivider} />
            <View style={themeStyles.statItem}>
              <Text style={themeStyles.statValue}>{DA_DOC.length}</Text>
              <Text style={themeStyles.statLabel}>Đã hoàn thành</Text>
            </View>
          </View>
        </View>

        {/* ===================== BẢNG TRÁI: ĐANG ĐỌC ===================== */}
        {activeTab === 'dangdoc' && (
          <View style={themeStyles.listContainer}>
            {DANG_DOC.map((item) => (
              <TouchableOpacity key={item.id} style={themeStyles.bookCard} activeOpacity={0.8} onPress={() => navigate('bookDetail', { id: item.id, title: item.title, chapter: item.chapter })}>
                <View style={themeStyles.bookCover}>
                  <Text style={themeStyles.mockCoverText}>Ảnh</Text>
                </View>
                
                <View style={themeStyles.bookInfo}>
                  <Text style={themeStyles.bookTitle} numberOfLines={2}>{item.title}</Text>
                  <Text style={themeStyles.bookChapter}>Tiến độ: {item.chapter}</Text>
                  
                  {/* Thanh tiến độ */}
                  <View style={themeStyles.progressContainer}>
                    <View style={themeStyles.progressBarBg}>
                      <View style={[themeStyles.progressBarFill, { width: `${item.progress}%` }]} />
                    </View>
                    <Text style={themeStyles.progressText}>{item.progress}%</Text>
                  </View>
                  
                  {/* Buttons */}
                  <View style={themeStyles.actionRow}>
                    <TouchableOpacity style={themeStyles.returnBtn}>
                      <Ionicons name="return-down-back" size={14} color="#1a1a1a" style={{ marginRight: 4 }} />
                      <Text style={themeStyles.returnBtnText}>Trả sách</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={themeStyles.continueBtn} onPress={() => navigate('reader')}>
                      <Text style={themeStyles.continueBtnText}>Đọc tiếp</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ===================== BẢNG PHẢI: ĐÃ ĐỌC ===================== */}
        {activeTab === 'dadoc' && (
          <View style={themeStyles.listContainer}>
            {DA_DOC.map((item) => (
              <TouchableOpacity key={item.id} style={themeStyles.bookCard} activeOpacity={0.8} onPress={() => navigate('bookDetail', { id: item.id, title: item.title, chapter: item.total })}>
                <View style={themeStyles.bookCover}>
                  <Text style={themeStyles.mockCoverText}>Ảnh</Text>
                </View>
                <View style={themeStyles.bookInfo}>
                  <Text style={themeStyles.bookTitle} numberOfLines={2}>{item.title}</Text>
                  <Text style={themeStyles.bookChapter}>Đã đọc xong: {item.total}</Text>
                  
                  <View style={themeStyles.statusBox}>
                    <Ionicons name="checkmark-done-circle" size={16} color="#27ae60" />
                    <Text style={themeStyles.statusText}>Hoàn thành</Text>
                  </View>
                  
                  {/* Buttons */}
                  <View style={themeStyles.actionRow}>
                    <TouchableOpacity style={themeStyles.rateBtn}>
                      <Ionicons name="star" size={14} color="#1a1a1a" style={{ marginRight: 4 }} />
                      <Text style={themeStyles.rateBtnText}>Đánh giá</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={themeStyles.readAgainBtn} onPress={() => navigate('reader')}>
                      <Ionicons name="refresh" size={14} color="#2c3a7a" style={{ marginRight: 4 }} />
                      <Text style={themeStyles.readAgainBtnText}>Đọc lại</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fcf3e8' }, // Màu da nhẹ
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 15,
    paddingBottom: 15,
    backgroundColor: '#fcf3e8',
  },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#1a1a1a' },
  headerIcon: { position: 'absolute', right: 20, bottom: 15 },

  // Tabs
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fcf3e8',
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderWidth: 2, borderColor: '#1a1a1a',
    backgroundColor: '#fff',
    marginHorizontal: 5,
    borderRadius: 12,
    shadowColor: '#000', shadowOffset: { width: 2, height: 2 }, shadowOpacity: 1, shadowRadius: 0, elevation: 3,
  },
  tabBtnActive: { backgroundColor: '#ffde59', shadowOffset: { width: 4, height: 4 } }, // Tab đang chọn bật to hơn
  tabText: { fontSize: 14, fontWeight: '700', color: '#1a1a1a' },
  tabTextActive: { fontWeight: '900' },

  scrollContainer: { flex: 1 },
  listContainer: { paddingHorizontal: 15, paddingBottom: 20 },

  // Thống kê
  statsCard: {
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2, borderColor: '#1a1a1a',
    shadowColor: '#000', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 6,
    overflow: 'hidden',
  },
  statsHeader: { backgroundColor: '#3498db', paddingVertical: 10, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: '#1a1a1a' },
  statsHeaderText: { fontSize: 15, fontWeight: '900', color: '#fff' },
  statsBody: { flexDirection: 'row', padding: 15 },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '900', color: '#1a1a1a' },
  statLabel: { fontSize: 12, fontWeight: '700', color: '#636e72', marginTop: 4 },
  statDivider: { width: 2, backgroundColor: '#1a1a1a', marginHorizontal: 15 },

  // Book Card Layout (Neo-brutalism)
  bookCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 15,
    alignItems: 'center',
    borderWidth: 2, borderColor: '#1a1a1a',
    shadowColor: '#000', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 6,
  },
  bookCover: {
    width: 70, height: 100,
    backgroundColor: '#ddd',
    borderRadius: 8,
    borderWidth: 1.5, borderColor: '#1a1a1a',
    justifyContent: 'center', alignItems: 'center',
    marginRight: 15
  },
  mockCoverText: { fontSize: 13, color: '#1a1a1a', fontWeight: '900' },
  bookInfo: { flex: 1, justifyContent: 'center' },
  bookTitle: { fontSize: 16, fontWeight: '900', color: '#1a1a1a', marginBottom: 6 },
  bookChapter: { fontSize: 13, fontWeight: '600', color: '#636e72', marginBottom: 8 },

  // Progress
  progressContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  progressBarBg: { flex: 1, height: 8, backgroundColor: '#eee', borderRadius: 4, marginRight: 10, borderWidth: 1, borderColor: '#1a1a1a', overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#f39c12' },
  progressText: { fontSize: 12, fontWeight: '900', color: '#1a1a1a' },
  
  actionRow: { flexDirection: 'row', justifyContent: 'flex-start', marginTop: 5 },
  
  // Buttons
  continueBtn: {
    backgroundColor: '#f39c12',
    paddingVertical: 8, paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1.5, borderColor: '#1a1a1a',
    shadowColor: '#000', shadowOffset: { width: 2, height: 2 }, shadowOpacity: 1, shadowRadius: 0,
  },
  continueBtnText: { color: '#1a1a1a', fontSize: 13, fontWeight: '900' },
  
  returnBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#e1e8f0',
    paddingVertical: 8, paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1.5, borderColor: '#1a1a1a',
    marginRight: 10,
    shadowColor: '#000', shadowOffset: { width: 2, height: 2 }, shadowOpacity: 1, shadowRadius: 0,
  },
  returnBtnText: { color: '#1a1a1a', fontSize: 13, fontWeight: '800' },

  // Status (Đã đọc)
  statusBox: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  statusText: { fontSize: 13, fontWeight: '800', color: '#27ae60', marginLeft: 4 },
  
  rateBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#ffde59',
    paddingVertical: 8, paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1.5, borderColor: '#1a1a1a',
    marginRight: 10,
    shadowColor: '#000', shadowOffset: { width: 2, height: 2 }, shadowOpacity: 1, shadowRadius: 0,
  },
  rateBtnText: { color: '#1a1a1a', fontSize: 13, fontWeight: '800' },

  readAgainBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#e8f4fd',
    paddingVertical: 8, paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1.5, borderColor: '#1a1a1a',
    shadowColor: '#000', shadowOffset: { width: 2, height: 2 }, shadowOpacity: 1, shadowRadius: 0,
  },
  readAgainBtnText: { color: '#1a1a1a', fontSize: 13, fontWeight: '800' },

  // Bottom Navigation
  bottomNav: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    backgroundColor: '#fff', borderTopWidth: 2, borderTopColor: '#1a1a1a',
    paddingVertical: 10, paddingBottom: Platform.OS === 'ios' ? 25 : 10,
  },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', height: 48 },
  navText: { fontSize: 10, fontWeight: '800', color: '#8f9bb3', marginTop: 4 },
  navActiveText: { color: '#2c3a7a', fontWeight: '900' },
});
