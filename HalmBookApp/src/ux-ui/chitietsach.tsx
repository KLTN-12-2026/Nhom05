import { ArrowLeft, Bookmark, BookOpen, Heart } from 'lucide-react-native';
import { useAppNavigation, useAppThemeStyles } from './navigation';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet, Text,
  TouchableOpacity,
  View
} from 'react-native';

interface BookDetailProps {
  book: {
    id: string;
    title: string;
    author?: string;
    chapter?: string;
    tag?: string;
    pages?: number;
    reads?: string;
    rating?: string;
  };
  onBack: () => void;
  onStartReading: () => void;
}

export default function BookDetailScreen({ book, onBack, onStartReading }: BookDetailProps) {
  const themeStyles = useAppThemeStyles(styles);
  const { isDarkMode } = useAppNavigation();
  const [isSaved, setIsSaved] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  return (
    <SafeAreaView style={themeStyles.safeArea}>
      <ExpoStatusBar style={isDarkMode ? 'light' : 'dark'} />

      {/* Header Điều Hướng */}
      <View style={themeStyles.header}>
        <TouchableOpacity style={themeStyles.iconButton} onPress={onBack} activeOpacity={0.8}>
          <ArrowLeft size={20} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={themeStyles.headerTitle} numberOfLines={1}>{book.title}</Text>
        <TouchableOpacity style={themeStyles.iconButton} onPress={() => setIsLiked(!isLiked)} activeOpacity={0.8}>
          <Heart size={20} color="#1a1a1a" fill={isLiked ? '#ff6b6b' : 'none'} />
        </TouchableOpacity>
      </View>

      <ScrollView style={themeStyles.scrollView} showsVerticalScrollIndicator={false}>
        
        {/* Phần Thông Tin Sách Chính (Hero Card) */}
        <View style={themeStyles.heroSection}>
          <View style={themeStyles.bookCoverLarge}>
            <Text style={themeStyles.coverText}>BÌA{'\n'}TRUYỆN</Text>
          </View>

          <View style={themeStyles.heroInfo}>
            <Text style={themeStyles.bookTitleLarge}>{book.title}</Text>
            <Text style={themeStyles.bookAuthorLarge}>Tác giả: <Text style={themeStyles.authorBold}>{book.author || 'Đang cập nhật'}</Text></Text>
            
            <View style={themeStyles.tagRow}>
              <View style={themeStyles.badge}>
                <Text style={themeStyles.badgeText}>{book.tag || 'Tiên Hiệp'}</Text>
              </View>
              <View style={[themeStyles.badge, { backgroundColor: '#ffde59' }]}>
                <Text style={themeStyles.badgeText}>⭐ {book.rating || '4.9'}</Text>
              </View>
            </View>

            <Text style={themeStyles.statsText}>📖 Lượt đọc: {book.reads || '15K'}   •   📝 {book.chapter || 'Full 500 Chương'}</Text>
          </View>
        </View>

        {/* Nút Hành Động (Đọc truyện & Lưu tủ sách) */}
        <View style={themeStyles.actionRow}>
          <TouchableOpacity 
            style={themeStyles.btnReadPrimary} 
            onPress={onStartReading}
            activeOpacity={0.9}
          >
            <BookOpen size={18} color="#fff" />
            <Text style={themeStyles.btnReadPrimaryText}>Đọc Từ Đầu</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[themeStyles.btnBookmark, isSaved && themeStyles.btnBookmarkActive]} 
            onPress={() => setIsSaved(!isSaved)}
            activeOpacity={0.9}
          >
            <Bookmark size={18} color="#1a1a1a" fill={isSaved ? '#1a1a1a' : 'none'} />
            <Text style={themeStyles.btnBookmarkText}>{isSaved ? 'Đã Lưu' : 'Thêm Tủ'}</Text>
          </TouchableOpacity>
        </View>

        {/* Giới thiệu / Tóm tắt nội dung */}
        <View style={themeStyles.sectionContainer}>
          <Text style={themeStyles.sectionTitle}>Giới Thiệu Nội Dung</Text>
          <View style={themeStyles.cardBox}>
            <Text style={themeStyles.descText}>
              Lưu viện Quan Trung, trong con hẻm nhỏ với những cửa hàng to nhỏ đủ cỡ nằm chen chúc, chất đầy các loại đồ cổ loang lổ vết gỉ sét... Một câu chuyện đầy lôi cuốn đưa người đọc bước vào hành trình khám phá những bí ẩn chưa từng có lời giải.
            </Text>
          </View>
        </View>

        {/* Danh sách chương mới nhất */}
        <View style={themeStyles.sectionContainer}>
          <View style={themeStyles.sectionHeaderRow}>
            <Text style={themeStyles.sectionTitle}>Danh Sách Chương</Text>
            <Text style={themeStyles.latestChapterText}>{book.chapter || 'Chapter 335'}</Text>
          </View>

          <View style={themeStyles.cardBox}>
            {['Chapter 335: Sự thật hé lộ', 'Chapter 334: Trận chiến bất ngờ', 'Chapter 333: Gặp gỡ cố nhân'].map((chap, idx) => (
              <TouchableOpacity key={idx} style={themeStyles.chapterRowItem} activeOpacity={0.7} onPress={onStartReading}>
                <Text style={themeStyles.chapterItemText}>{chap}</Text>
                <Text style={themeStyles.chapterTimeText}>Hôm qua</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fdfdfd' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 12,
    backgroundColor: '#fff', borderBottomWidth: 3, borderBottomColor: '#1a1a1a'
  },
  headerTitle: { fontSize: 16, fontWeight: '900', color: '#1a1a1a', flex: 1, textAlign: 'center', marginHorizontal: 10 },
  iconButton: {
    width: 40, height: 40, backgroundColor: '#fff',
    borderWidth: 2, borderColor: '#1a1a1a', borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#1a1a1a', shadowOffset: { width: 2, height: 2 }, shadowOpacity: 1, elevation: 2
  },
  scrollView: { flex: 1, backgroundColor: '#fdfdfd' },
  
  heroSection: {
    flexDirection: 'row', padding: 20, backgroundColor: '#fff',
    borderBottomWidth: 3, borderBottomColor: '#1a1a1a', alignItems: 'center'
  },
  bookCoverLarge: {
    width: 110, height: 160, backgroundColor: '#5a8b82',
    borderRadius: 12, borderWidth: 3, borderColor: '#1a1a1a',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#1a1a1a', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, elevation: 4
  },
  coverText: { color: '#fff', fontSize: 14, fontWeight: '900', textAlign: 'center' },
  heroInfo: { flex: 1, marginLeft: 20 },
  bookTitleLarge: { fontSize: 18, fontWeight: '900', color: '#1a1a1a', marginBottom: 6 },
  bookAuthorLarge: { fontSize: 13, color: '#555', marginBottom: 10 },
  authorBold: { fontWeight: '800', color: '#1a1a1a' },
  tagRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  badge: {
    paddingHorizontal: 10, paddingVertical: 4, backgroundColor: '#a29bfe',
    borderWidth: 2, borderColor: '#1a1a1a', borderRadius: 8
  },
  badgeText: { fontSize: 11, fontWeight: '800', color: '#1a1a1a' },
  statsText: { fontSize: 11, fontWeight: '700', color: '#666' },

  actionRow: {
    flexDirection: 'row', padding: 20, gap: 15, backgroundColor: '#f5f5f5',
    borderBottomWidth: 3, borderBottomColor: '#1a1a1a'
  },
  btnReadPrimary: {
    flex: 2, backgroundColor: '#1a1a1a', flexDirection: 'row',
    height: 50, borderRadius: 12, borderWidth: 3, borderColor: '#1a1a1a',
    justifyContent: 'center', alignItems: 'center', gap: 8,
    shadowColor: '#1a1a1a', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, elevation: 4
  },
  btnReadPrimaryText: { color: '#fff', fontSize: 15, fontWeight: '900' },
  btnBookmark: {
    flex: 1, backgroundColor: '#fff', flexDirection: 'row',
    height: 50, borderRadius: 12, borderWidth: 3, borderColor: '#1a1a1a',
    justifyContent: 'center', alignItems: 'center', gap: 6,
    shadowColor: '#1a1a1a', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, elevation: 4
  },
  btnBookmarkActive: { backgroundColor: '#ffde59' },
  btnBookmarkText: { color: '#1a1a1a', fontSize: 13, fontWeight: '900' },

  sectionContainer: { padding: 20, paddingBottom: 5 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '900', color: '#1a1a1a', marginBottom: 10 },
  latestChapterText: { fontSize: 12, fontWeight: '800', color: '#5a8b82' },
  cardBox: {
    backgroundColor: '#fff', borderWidth: 3, borderColor: '#1a1a1a',
    borderRadius: 15, padding: 15,
    shadowColor: '#1a1a1a', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, elevation: 4
  },
  descText: { fontSize: 13, fontWeight: '600', color: '#444', lineHeight: 20 },
  chapterRowItem: {
    flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#eee'
  },
  chapterItemText: { fontSize: 13, fontWeight: '700', color: '#1a1a1a' },
  chapterTimeText: { fontSize: 11, color: '#888', fontWeight: '600' }
});