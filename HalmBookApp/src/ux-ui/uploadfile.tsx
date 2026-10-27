import { Ionicons } from '@expo/vector-icons';
import { Platform, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAppNavigation, useAppThemeStyles } from './navigation';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';

// Mock data: Sách đã từng upload
const UPLOAD_HISTORY = [
  { id: '1', title: 'Kiếm Đạo Độc Tôn.epub', date: 'Hôm qua', size: '2.4 MB', status: 'Hoàn thành', progress: 45 },
  { id: '2', title: 'Tài_Liệu_Lịch_Sử.pdf', date: '15/09/2026', size: '1.1 MB', status: 'Hoàn thành', progress: 100 },
  { id: '3', title: 'Ban_Ngay_Ban_Dem.docx', date: '10/09/2026', size: '4.5 MB', status: 'Hoàn thành', progress: 12 },
];

export default function UploadFile() {
  const themeStyles = useAppThemeStyles(styles);
  const { navigate, isDarkMode } = useAppNavigation();

  return (
    <View style={themeStyles.container}>
      <ExpoStatusBar style={isDarkMode ? 'light' : 'dark'} />
      
      {/* Header đồng nhất với các màn hình khác */}
      <View style={themeStyles.header}>
        <Text style={themeStyles.headerTitle}>Upload File</Text>
        <TouchableOpacity style={themeStyles.headerIcon} onPress={() => navigate('search')}>
          <Ionicons name="search" size={24} color="#1a1a1a" />
        </TouchableOpacity>
      </View>

      <ScrollView style={themeStyles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* Phần Upload */}
        <View style={themeStyles.uploadSection}>
          {/* Icon Trồng Khoai (Lá cây + Khoai tây) thay thế đám mây */}
          <View style={themeStyles.potatoIconWrapper}>
            <Ionicons name="leaf-outline" size={40} color="#27ae60" style={{ position: 'absolute', top: -15, right: -10 }} />
            <Text style={{ fontSize: 70 }}>🥔</Text>
          </View>
          
          <Text style={themeStyles.title}>Tải Lên Tệp</Text>
          <Text style={themeStyles.subtitle}>Upload File của bạn và trải nghiệm hệ sinh thái tuyệt vời mà tôi mang lại</Text>
          
          {/* Nút Upload màu xanh giống nút Here We Go */}
          <TouchableOpacity style={themeStyles.uploadBtn}>
            <Ionicons name="document-attach-outline" size={28} color="#1e3c72" style={{ marginRight: 15 }} />
            <View>
              <Text style={themeStyles.uploadBtnText}>Upload File</Text>
              <View style={themeStyles.costRow}>
                <Text style={themeStyles.costStrikethrough}>50 🥔</Text>
                <Text style={themeStyles.costFree}>0 🥔</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <View style={themeStyles.divider} />

        {/* Lịch sử Upload */}
        <View style={themeStyles.historySection}>
          <View style={themeStyles.historyHeader}>
            <Text style={themeStyles.historyTitle}>Sách đã tải lên</Text>
            <TouchableOpacity>
              <Text style={themeStyles.historyMore}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>

          {UPLOAD_HISTORY.map((item) => (
            <View key={item.id} style={themeStyles.bookCard}>
              <View style={themeStyles.bookCover}>
                <Text style={themeStyles.mockCoverText}>Ảnh</Text>
              </View>
              
              <View style={themeStyles.bookInfo}>
                <Text style={themeStyles.bookTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={themeStyles.bookChapter}>Tiến độ: {item.progress}%</Text>
                
                {/* Thanh tiến độ (Giống bên Tủ sách) */}
                <View style={themeStyles.progressContainer}>
                  <View style={themeStyles.progressBarBg}>
                    <View style={[themeStyles.progressBarFill, { width: `${item.progress}%` }]} />
                  </View>
                </View>

                {/* Trạng thái */}
                <View style={themeStyles.fileStatusBox}>
                  <Ionicons name="checkmark-done-circle" size={16} color="#27ae60" />
                  <Text style={themeStyles.fileStatus}>{item.status}</Text>
                </View>
              </View>

              <TouchableOpacity style={themeStyles.continueBtn} onPress={() => navigate('reader')}>
                <Text style={themeStyles.continueBtnText}>Đọc tiếp</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f5f7' },
  
  // Header đồng nhất
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 15,
    paddingBottom: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#eee'
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#1a1a1a' },
  headerIcon: { position: 'absolute', right: 20, bottom: 15 },

  scrollContainer: { flex: 1 },
  
  // Phần Upload
  uploadSection: {
    alignItems: 'center',
    paddingTop: 30,
    paddingBottom: 30,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
  },
  potatoIconWrapper: {
    position: 'relative',
    marginBottom: 10,
    marginTop: 10
  },
  title: { fontSize: 22, fontWeight: '800', color: '#1a1a1a', marginTop: 15, marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#888', textAlign: 'center', marginBottom: 25, lineHeight: 22, paddingHorizontal: 10 },
  
  // Nút Upload màu Here We Go
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#64b5f6', // Màu giống web login
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 12,
    shadowColor: '#64b5f6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 5, elevation: 5,
  },
  uploadBtnText: { color: '#1e3c72', fontSize: 18, fontWeight: '800' },
  costRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  costStrikethrough: { color: '#1e3c72', textDecorationLine: 'line-through', opacity: 0.6, fontSize: 12 },
  costFree: { color: '#1e3c72', fontWeight: '800', fontSize: 13, marginLeft: 6 },

  divider: { height: 1, backgroundColor: '#eee' },

  // Lịch sử Upload
  historySection: { padding: 20 },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  historyTitle: { fontSize: 18, fontWeight: '800', color: '#1a1a1a' },
  historyMore: { fontSize: 13, fontWeight: '600', color: '#3498db' },
  
  // Book Card (Giống sách đang đọc)
  bookCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2,
    borderWidth: 1, borderColor: '#f1f2f6'
  },
  bookCover: {
    width: 65, height: 90,
    backgroundColor: '#ddd',
    borderRadius: 8,
    justifyContent: 'center', alignItems: 'center',
    marginRight: 15
  },
  mockCoverText: { fontSize: 12, color: '#888', fontWeight: '800' },
  bookInfo: { flex: 1, justifyContent: 'center' },
  bookTitle: { fontSize: 15, fontWeight: '800', color: '#1a1a1a', marginBottom: 6 },
  bookChapter: { fontSize: 13, color: '#666', marginBottom: 8 },

  // Thanh tiến độ
  progressContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  progressBarBg: { flex: 1, height: 6, backgroundColor: '#eee', borderRadius: 3, marginRight: 10, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#f39c12', borderRadius: 3 },
  
  fileStatusBox: { flexDirection: 'row', alignItems: 'center' },
  fileStatus: { fontSize: 12, fontWeight: '700', color: '#27ae60', marginLeft: 4 },

  continueBtn: {
    backgroundColor: '#fdf5e6',
    paddingVertical: 8, paddingHorizontal: 15,
    borderRadius: 20,
    marginLeft: 10,
    borderWidth: 1, borderColor: '#fad390'
  },
  continueBtnText: { color: '#e67e22', fontSize: 13, fontWeight: '700' },

  // Bottom Navigation
  bottomNav: {
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee',
    paddingVertical: 10, paddingBottom: Platform.OS === 'ios' ? 25 : 10,
  },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', height: 48 },
  navText: { fontSize: 10, fontWeight: '700', color: '#8f9bb3', marginTop: 4 },
  navActiveText: { color: '#2c3a7a', fontWeight: '900' },
});