import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { fetchApiWithFallback } from './apiService';
import { getBookCoverSource } from './bookCovers';
import { fetchFavoriteBooksFromApi, toggleFavoriteBook } from './favoriteService';
import { useAppNavigation, useAppThemeStyles } from './navigation';

type Book = {
  id: string;
  title: string;
  author: string;
  category: string;
  rating: number;
  reviews: string;
  price: number;
  description: string;
  img_url?: string;
  isCatalogBook?: boolean;
};

const FALLBACK_BOOKS: Book[] = [
  {
    id: 'VH008',
    title: 'Số Đỏ',
    author: 'Vũ Trọng Phụng',
    category: 'Văn học Việt Nam',
    rating: 4.9,
    reviews: '1.8k',
    price: 20,
    description: 'Tiểu thuyết trào phúng kinh điển khắc họa xã hội thượng lưu giả tạo qua nhân vật Xuân Tóc Đỏ.',
    isCatalogBook: false,
  },
  {
    id: 'KD001',
    title: 'AQ Chính Truyện',
    author: 'Lỗ Tấn',
    category: 'Kinh điển',
    rating: 4.8,
    reviews: '1.2k',
    price: 25,
    description: 'Kiệt tác châm biếm khắc họa phép thắng lợi tinh thần trong xã hội Trung Hoa giao thời.',
    isCatalogBook: false,
  },
  {
    id: 'LS001',
    title: 'Đạo Đức Và Luân Lý Đông Tây',
    author: 'Phan Châu Trinh',
    category: 'Lịch sử',
    rating: 4.8,
    reviews: '980',
    price: 22,
    description: 'Bài diễn thuyết tâm huyết so sánh nền tảng đạo đức và luân lý phương Đông với phương Tây.',
    isCatalogBook: false,
  },
];

const CATEGORIES = [
  { name: "Tiểu thuyết", icon: "📚" },
  { name: "Trinh thám", icon: "🔎" },
  { name: "Tình cảm", icon: "❤️" },
  { name: "Kỹ năng sống", icon: "🌱" },
  { name: "Kinh tế", icon: "📊" },
];

export default function SearchScreen() {
  const themeStyles = useAppThemeStyles(styles);
  const { navigate, goBack, isDarkMode, lang, isLoggedIn, showLoginAlert } = useAppNavigation();
  const [keyword, setKeyword] = useState("");
  const [catalogBooks, setCatalogBooks] = useState<Book[]>(FALLBACK_BOOKS);
  const [isLoadingBooks, setIsLoadingBooks] = useState(true);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [recent, setRecent] = useState([
    "Số Đỏ",
    "AQ Chính Truyện",
    "Văn học",
    "Lịch sử",
  ]);

  useEffect(() => {
    let isMounted = true;
    const loadBooks = async () => {
      try {
        const res = await fetchApiWithFallback('/api/home/books', {
          method: 'GET',
          timeout: 6000,
        });
        const rawList = Array.isArray(res.data) ? res.data : res.data?.books || [];
        if (isMounted && Array.isArray(rawList) && rawList.length > 0) {
          const mapped: Book[] = rawList
            .filter((b: any) => b && b.status !== 'DELETED')
            .map((b: any) => ({
              id: String(b.book_id || b.id || ''),
              title: b.bookName || b.title || 'Chưa rõ tên',
              author: b.author || 'Chưa rõ tác giả',
              category: b.category_name || b.categoryName || b.tag || 'Sách hay',
              rating: Number(b.rating || 4.8),
              reviews: String(b.views ? `${b.views}` : '1.2k'),
              price: Number(b.rent_price ?? b.price ?? 15),
              description: b.description || 'Khám phá nội dung đặc sắc trên HalmBook.',
              img_url: b.img_url || '',
              isCatalogBook: true,
            }));
          if (mapped.length > 0) {
            setCatalogBooks(mapped);
          }
        }
      } catch {
        // Giữ FALLBACK_BOOKS khi offline
      } finally {
        if (isMounted) setIsLoadingBooks(false);
      }
    };
    loadBooks();

    fetchFavoriteBooksFromApi()
      .then((favs) => {
        if (isMounted) {
          setFavoriteIds(favs.map((f) => String(f.id || f.bookId)));
        }
      })
      .catch(() => { });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleToggleHeart = async (item: Book) => {
    if (!isLoggedIn) {
      showLoginAlert(
        lang === 'en'
          ? 'Please log in to add books to your Favorites and sync with Web!'
          : 'Bạn phải đăng nhập để lưu sách yêu thích và đồng bộ lên Web!'
      );
      return;
    }
    const bookId = String(item.id);
    const isCurrentlyFav = favoriteIds.includes(bookId);
    setFavoriteIds((prev) =>
      isCurrentlyFav ? prev.filter((id) => id !== bookId) : [...prev, bookId]
    );

    const result = await toggleFavoriteBook({
      id: bookId,
      title: item.title,
      author: item.author,
      category_name: item.category,
      img_url: item.img_url || '',
    });

    if (result.success) {
      setFavoriteIds((prev) =>
        result.isFavorite
          ? [...prev.filter((id) => id !== bookId), bookId]
          : prev.filter((id) => id !== bookId)
      );
    }
  };

  const results = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    if (!q) return catalogBooks;

    return catalogBooks.filter(
      (book) =>
        book.title.toLowerCase().includes(q) ||
        book.author.toLowerCase().includes(q) ||
        book.category.toLowerCase().includes(q)
    );
  }, [keyword, catalogBooks]);

  const chooseSearch = (value: string) => {
    setKeyword(value);
    setRecent((old) => [value, ...old.filter((x) => x !== value)].slice(0, 5));
  };

  const renderBook = ({ item }: { item: Book }) => {
    const coverSource = getBookCoverSource(item.id, item.img_url);
    return (
      <View style={themeStyles.bookCard}>
        {coverSource ? (
          <Image source={coverSource} style={themeStyles.cover} resizeMode="cover" />
        ) : (
          <View style={themeStyles.cover}>
            <Text style={themeStyles.coverIcon}>📖</Text>
          </View>
        )}

        <View style={themeStyles.bookInfo}>
          <Text style={themeStyles.bookTitle}>{item.title}</Text>
          <Text style={themeStyles.author}>{item.author}</Text>
          <Text style={themeStyles.rating}>
            ⭐ {item.rating} ({item.reviews} {lang === 'en' ? 'views)' : 'lượt)'}
          </Text>
          <Text style={themeStyles.description} numberOfLines={2}>
            {item.description}
          </Text>

          <View style={themeStyles.rowBottom}>
            <Text style={themeStyles.categoryTag}>{item.category}</Text>
            <View style={themeStyles.priceBox}>
              <Text style={themeStyles.priceLabel}>{lang === 'en' ? 'Rental / 7d' : 'Thuê / 7 ngày'}</Text>
              <Text style={themeStyles.price}>
                {item.price} 🥔
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={themeStyles.detailButton}
            onPress={() => navigate('bookDetail', {
              id: String(item.id),
              title: item.title,
              author: item.author,
              img_url: item.img_url,
              coverImage: item.img_url,
              tag: item.category,
              category_name: item.category,
              description: item.description,
              desc: item.description,
              price: item.price,
              rent_price: item.price,
              rating: String(item.rating),
              reads: item.reviews,
            })}
          >
            <Text style={themeStyles.detailText}>{lang === 'en' ? 'View details' : 'Xem chi tiết'}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={themeStyles.heart}
          onPress={() => handleToggleHeart(item)}
          activeOpacity={0.7}
        >
          <Text style={[themeStyles.heartText, favoriteIds.includes(String(item.id)) && { color: '#ef4444' }]}>
            {favoriteIds.includes(String(item.id)) ? '❤️' : '♡'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={themeStyles.safe}>
      <ExpoStatusBar style={isDarkMode ? 'light' : 'dark'} />

      <FlatList
        data={results}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderBook}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={themeStyles.container}
        ListHeaderComponent={
          <>
            <View style={themeStyles.header}>
              <TouchableOpacity onPress={goBack}>
                <Text style={themeStyles.back}>←</Text>
              </TouchableOpacity>
              <View>
                <Text style={themeStyles.title}>{lang === 'en' ? 'Search' : 'Tìm kiếm'}</Text>
                <Text style={themeStyles.subtitle}>{lang === 'en' ? 'Discover great books' : 'Khám phá những cuốn sách hay'}</Text>
              </View>
            </View>

            <View style={themeStyles.searchBox}>
              <Text style={themeStyles.searchIcon}>⌕</Text>
              <TextInput
                style={themeStyles.input}
                value={keyword}
                onChangeText={setKeyword}
                placeholder={lang === 'en' ? 'Search books, authors, genres...' : 'Tìm kiếm sách, tác giả, thể loại...'}
                placeholderTextColor="#8A92A6"
                returnKeyType="search"
              />
              {!!keyword && (
                <TouchableOpacity onPress={() => setKeyword("")}>
                  <Text style={themeStyles.close}>×</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={themeStyles.sectionHeader}>
              <Text style={themeStyles.sectionTitle}>{lang === 'en' ? '◷  Recent Searches' : '◷  Tìm kiếm gần đây'}</Text>
              <TouchableOpacity onPress={() => setRecent([])}>
                <Text style={themeStyles.clear}>{lang === 'en' ? 'Clear all' : 'Xóa tất cả'}</Text>
              </TouchableOpacity>
            </View>

            <View style={themeStyles.recentWrap}>
              {recent.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={themeStyles.recentTag}
                  onPress={() => chooseSearch(item)}
                >
                  <Text style={themeStyles.recentText}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={themeStyles.sectionHeader}>
              <Text style={themeStyles.sectionTitle}>{lang === 'en' ? '🔥  Popular Genres' : '🔥  Thể loại phổ biến'}</Text>
              <TouchableOpacity onPress={() => navigate('categories')}>
                <Text style={themeStyles.more}>{lang === 'en' ? 'See all →' : 'Xem tất cả →'}</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={themeStyles.categories}
            >
              {CATEGORIES.map((item) => (
                <TouchableOpacity
                  key={item.name}
                  style={themeStyles.categoryCard}
                  onPress={() => chooseSearch(item.name)}
                >
                  <Text style={themeStyles.categoryIcon}>{item.icon}</Text>
                  <Text style={themeStyles.categoryName}>{item.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={themeStyles.resultHeader}>
              <Text style={themeStyles.sectionTitle}>☷  Kết quả tìm kiếm</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                {isLoadingBooks && <ActivityIndicator size="small" color="#F04D6A" />}
                <Text style={themeStyles.resultCount}>Có {results.length} kết quả</Text>
              </View>
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={themeStyles.empty}>
            <Text style={themeStyles.emptyIcon}>📚</Text>
            <Text style={themeStyles.emptyTitle}>Không tìm thấy sách</Text>
            <Text style={themeStyles.emptyText}>Thử tìm bằng tên sách hoặc tác giả khác.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFFFFF" },
  container: { padding: 18, paddingBottom: 40 },
  header: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 22 },
  back: { fontSize: 32, color: "#10182F" },
  title: { fontSize: 28, fontWeight: "800", color: "#10182F" },
  subtitle: { marginTop: 3, color: "#7A839A", fontSize: 14 },
  searchBox: {
    minHeight: 58, flexDirection: "row", alignItems: "center",
    borderWidth: 1.5, borderColor: "#FFD0D8", borderRadius: 18,
    paddingHorizontal: 15, backgroundColor: "#FFFDFE", marginBottom: 28,
  },
  searchIcon: { fontSize: 25, color: "#F04D6A", marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: "#10182F" },
  close: { fontSize: 25, color: "#8A92A6", paddingHorizontal: 5 },
  sectionHeader: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", marginBottom: 14,
  },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: "#10182F" },
  clear: { color: "#F04D6A", fontSize: 13 },
  more: { color: "#66718B", fontSize: 13 },
  recentWrap: { flexDirection: "row", flexWrap: "wrap", gap: 9, marginBottom: 28 },
  recentTag: { backgroundColor: "#F2F4F8", paddingVertical: 10, paddingHorizontal: 14, borderRadius: 22 },
  recentText: { color: "#17213A", fontSize: 13 },
  categories: { gap: 10, paddingBottom: 28 },
  categoryCard: {
    width: 100, height: 92, borderRadius: 16, backgroundColor: "#FFF0F3",
    alignItems: "center", justifyContent: "center", padding: 8,
  },
  categoryIcon: { fontSize: 27, marginBottom: 7 },
  categoryName: { fontSize: 12, fontWeight: "600", textAlign: "center", color: "#18213A" },
  resultHeader: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", marginBottom: 14,
  },
  resultCount: { color: "#7A839A", fontSize: 12 },
  bookCard: {
    flexDirection: "row", borderWidth: 1, borderColor: "#E8EAF0",
    borderRadius: 18, padding: 13, marginBottom: 13, backgroundColor: "#FFFFFF",
  },
  cover: {
    width: 92, height: 132, borderRadius: 11, backgroundColor: "#FFE2D5",
    alignItems: "center", justifyContent: "center", marginRight: 13,
    overflow: "hidden",
  },
  coverIcon: { fontSize: 38 },
  bookInfo: { flex: 1, paddingRight: 3 },
  bookTitle: { fontSize: 17, fontWeight: "800", color: "#10182F", paddingRight: 25 },
  author: { color: "#69738A", fontSize: 13, marginTop: 3 },
  rating: { color: "#29334B", fontSize: 12, marginTop: 6 },
  description: { color: "#69738A", fontSize: 12, lineHeight: 17, marginTop: 6 },
  rowBottom: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginTop: 8 },
  categoryTag: {
    color: "#D9415A", backgroundColor: "#FFE5E9",
    paddingHorizontal: 9, paddingVertical: 5, borderRadius: 15, fontSize: 10,
  },
  priceBox: { alignItems: "flex-end" },
  priceLabel: { color: "#7A839A", fontSize: 10 },
  price: { color: "#F04461", fontWeight: "800", fontSize: 16 },
  detailButton: {
    alignSelf: "flex-end", backgroundColor: "#F34F6D",
    borderRadius: 10, paddingVertical: 9, paddingHorizontal: 15, marginTop: 8,
  },
  detailText: { color: "#FFFFFF", fontWeight: "700", fontSize: 12 },
  heart: { position: "absolute", right: 13, top: 10 },
  heartText: { fontSize: 25, color: "#AAB2C4" },
  empty: { alignItems: "center", paddingVertical: 45 },
  emptyIcon: { fontSize: 45 },
  emptyTitle: { fontSize: 17, fontWeight: "700", marginTop: 10, color: "#10182F" },
  emptyText: { color: "#7A839A", fontSize: 13, marginTop: 5, textAlign: "center" },
});
