import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  StyleSheet,
  StatusBar,
} from "react-native";
import { useAppNavigation, useAppThemeStyles } from './navigation';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';

type Book = {
  id: number;
  title: string;
  author: string;
  category: string;
  rating: number;
  reviews: string;
  price: number;
  description: string;
};

const BOOKS: Book[] = [
  {
    id: 1,
    title: "Nhà giả kim",
    author: "Paulo Coelho",
    category: "Tiểu thuyết",
    rating: 4.8,
    reviews: "1.2k",
    price: 25000,
    description: "Hành trình khám phá ước mơ và ý nghĩa cuộc sống của Santiago.",
  },
  {
    id: 2,
    title: "Đắc nhân tâm",
    author: "Dale Carnegie",
    category: "Kỹ năng sống",
    rating: 4.7,
    reviews: "980",
    price: 30000,
    description: "Nghệ thuật đối nhân xử thế giúp bạn thành công trong cuộc sống.",
  },
  {
    id: 3,
    title: "Tuổi trẻ đáng giá bao nhiêu?",
    author: "Rosie Nguyễn",
    category: "Kỹ năng sống",
    rating: 4.6,
    reviews: "650",
    price: 28000,
    description: "Những chia sẻ dành cho người trẻ đang đi tìm chính mình.",
  },
  {
    id: 4,
    title: "Sherlock Holmes",
    author: "Arthur Conan Doyle",
    category: "Trinh thám",
    rating: 4.8,
    reviews: "1.1k",
    price: 25000,
    description: "Những vụ án ly kỳ và trí tuệ của vị thám tử huyền thoại.",
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
  const { navigate, goBack, isDarkMode } = useAppNavigation();
  const [keyword, setKeyword] = useState("");
  const [recent, setRecent] = useState([
    "Nhà giả kim",
    "Đắc nhân tâm",
    "Sherlock Holmes",
    "Tiểu thuyết",
  ]);

  const results = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    if (!q) return BOOKS;

    return BOOKS.filter(
      (book) =>
        book.title.toLowerCase().includes(q) ||
        book.author.toLowerCase().includes(q) ||
        book.category.toLowerCase().includes(q)
    );
  }, [keyword]);

  const chooseSearch = (value: string) => {
    setKeyword(value);
    setRecent((old) => [value, ...old.filter((x) => x !== value)].slice(0, 5));
  };

  const renderBook = ({ item }: { item: Book }) => (
    <View style={themeStyles.bookCard}>
      <View style={themeStyles.cover}>
        <Text style={themeStyles.coverIcon}>📖</Text>
      </View>

      <View style={themeStyles.bookInfo}>
        <Text style={themeStyles.bookTitle}>{item.title}</Text>
        <Text style={themeStyles.author}>{item.author}</Text>
        <Text style={themeStyles.rating}>
          ⭐ {item.rating} ({item.reviews} đánh giá)
        </Text>
        <Text style={themeStyles.description} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={themeStyles.rowBottom}>
          <Text style={themeStyles.categoryTag}>{item.category}</Text>
          <View style={themeStyles.priceBox}>
            <Text style={themeStyles.priceLabel}>Giá thuê</Text>
            <Text style={themeStyles.price}>
              {item.price.toLocaleString("vi-VN")}đ
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={themeStyles.detailButton}
          onPress={() => navigate('bookDetail', {
            id: String(item.id),
            title: item.title,
            author: item.author,
            tag: item.category,
            rating: String(item.rating),
            reads: item.reviews,
          })}
        >
          <Text style={themeStyles.detailText}>Xem chi tiết</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={themeStyles.heart}>
        <Text style={themeStyles.heartText}>♡</Text>
      </TouchableOpacity>
    </View>
  );

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
                <Text style={themeStyles.title}>Tìm kiếm</Text>
                <Text style={themeStyles.subtitle}>Khám phá những cuốn sách hay</Text>
              </View>
            </View>

            <View style={themeStyles.searchBox}>
              <Text style={themeStyles.searchIcon}>⌕</Text>
              <TextInput
                style={themeStyles.input}
                value={keyword}
                onChangeText={setKeyword}
                placeholder="Tìm kiếm sách, tác giả, thể loại..."
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
              <Text style={themeStyles.sectionTitle}>◷  Tìm kiếm gần đây</Text>
              <TouchableOpacity onPress={() => setRecent([])}>
                <Text style={themeStyles.clear}>Xóa tất cả</Text>
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
              <Text style={themeStyles.sectionTitle}>🔥  Thể loại phổ biến</Text>
              <TouchableOpacity onPress={() => navigate('categories')}>
                <Text style={themeStyles.more}>Xem tất cả →</Text>
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
              <Text style={themeStyles.resultCount}>Có {results.length} kết quả</Text>
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
