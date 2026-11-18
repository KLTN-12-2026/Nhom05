import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { API_BASE_URL } from '../apiService';
import { BookData, useAppNavigation } from '../navigation';
import { fetchBookDetailFromApi } from '../rentalService';
import { getCurrentUsername, getUserItem, KEY_READING_BOOKS, KEY_UPLOADED_BOOKS } from '../userStorage';
import HomeBookCover from './HomeBookCover';
import { HomeBookItem, mapHomeBook } from './homeData';

interface Props {
  books: HomeBookItem[];
  refreshKey: number;
}

// Read the existing account-scoped history. No synthetic progress and no storage migration.
export default function ContinueReading(props: Props) {
  const { isLoggedIn } = useAppNavigation();
  return <ReadingHistory key={String(isLoggedIn) + ':' + props.refreshKey} {...props} />;
}

function ReadingHistory({ books, refreshKey }: Props) {
  const { isLoggedIn, isDarkMode, navigate } = useAppNavigation();
  const [history, setHistory] = useState<BookData[]>([]);
  const [opening, setOpening] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const generation = useRef(0);
  const busy = useRef(false);

  useEffect(() => {
    let active = true;
    generation.current += 1;
    busy.current = false;
    if (isLoggedIn) {
      void (async () => {
        try {
          const username = await getCurrentUsername();
          if (username === 'guest') return;
          const raw = await getUserItem(KEY_READING_BOOKS);
          const parsed: unknown = raw ? JSON.parse(raw) : [];
          const seen = new Set<string>();
          const list = Array.isArray(parsed) ? parsed.flatMap((record: unknown): BookData[] => {
            if (!record || typeof record !== 'object') return [];
            const book = record as Record<string, unknown>;
            if (typeof book.id !== 'string' || !book.id.trim() || typeof book.title !== 'string' || !book.title.trim() || seen.has(book.id)) return [];
            seen.add(book.id);
            return [{
              id: book.id, title: book.title,
              author: typeof book.author === 'string' ? book.author : undefined,
              img_url: typeof book.img_url === 'string' ? book.img_url : undefined,
              coverUri: typeof book.coverUri === 'string' ? book.coverUri : undefined,
              coverImage: typeof book.coverImage === 'string' ? book.coverImage : undefined,
              isPersonal: book.isPersonal === true || /^(uploaded|upload|personal)[_-]/.test(book.id),
              fileUri: typeof book.fileUri === 'string' && /^(file:|content:)/.test(book.fileUri) ? book.fileUri : undefined,
            }];
          }) : [];
          // Do not display an earlier account's pending result after logout/account change.
          const currentUsername = await getCurrentUsername();
          if (active && username === currentUsername) setHistory(list);
        } catch {
          // An unavailable/invalid history must not break Home or create a fake module.
          if (active) setHistory([]);
        }
      })();
    }
    return () => { active = false; generation.current += 1; };
  }, [isLoggedIn, refreshKey]);

  const resume = async (record: BookData) => {
    if (busy.current || !isLoggedIn) return;
    busy.current = true;
    const requestGeneration = generation.current;
    setOpening(record.id);
    setMessage(null);
    try {
      const catalogBook = books.find(book => book.id === record.id);
      const uploaded = record.isPersonal ? JSON.parse(await getUserItem(KEY_UPLOADED_BOOKS) || '[]') as BookData[] : [];
      const book = record.isPersonal ? uploaded.find(item => item.id === record.id) || record
        : catalogBook || mapHomeBook(await fetchBookDetailFromApi(record.id), API_BASE_URL);
      if (requestGeneration !== generation.current) return;
      if (!book) {
        setMessage('Chưa thể mở tác phẩm này. Sách có thể đã thay đổi hoặc kết nối đang gián đoạn. Bạn có thể thử lại.');
        return;
      }
      // Intentionally omit initialChapterIndex: the unchanged reader restores saved progress
      // and checks access itself. No fabricated page, percentage or access permission.
      navigate('reader', book);
    } catch {
      if (requestGeneration === generation.current) setMessage('Không thể tiếp tục đọc lúc này. Vui lòng thử lại.');
    } finally {
      if (requestGeneration === generation.current) {
        busy.current = false;
        setOpening(null);
      }
    }
  };

  if (!isLoggedIn || history.length === 0) return null;
  const text = isDarkMode ? '#F7F5F0' : '#242321';
  const muted = isDarkMode ? '#A39F99' : '#77736C';
  const primary = isDarkMode ? '#E5A93C' : '#35695F';
  return (
    <View style={styles.section}>
      <View style={styles.heading}>
        <View style={[styles.accent, { backgroundColor: isDarkMode ? '#E5A93C' : '#8B4A3C' }]} />
        <Text style={[styles.title, { color: text }]}>Tiếp Tục Đọc</Text>
      </View>
      <Text style={[styles.subtitle, { color: muted }]}>Trở lại những tác phẩm bạn đã mở đọc.</Text>
      {message && <Text accessibilityLiveRegion="polite" style={[styles.message, { color: isDarkMode ? '#E0A493' : '#8B4A3C' }]}>{message}</Text>}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.list}>
        {history.slice(0, 2).map(record => (
          <TouchableOpacity key={record.id} accessibilityRole="button" accessibilityLabel={`Tiếp tục đọc ${record.title}`}
            accessibilityState={{ disabled: opening !== null, busy: opening === record.id }} disabled={opening !== null}
            activeOpacity={0.8} onPress={() => void resume(record)}
            style={[styles.card, { backgroundColor: isDarkMode ? '#242321' : '#FFFFFF', borderColor: isDarkMode ? '#383633' : '#E6E1D8' }]}>
            <View style={[styles.cover, { backgroundColor: isDarkMode ? '#2D2B28' : '#E6E1D8' }]}><HomeBookCover book={record} /></View>
            <View style={styles.copy}>
              <Text style={[styles.bookTitle, { color: text }]} numberOfLines={2}>{record.title}</Text>
              {!!record.author && <Text style={[styles.author, { color: muted }]} numberOfLines={1}>{record.author}</Text>}
              <View style={styles.action}>
                {opening === record.id ? <ActivityIndicator size="small" color={primary} /> : <Ionicons name="arrow-forward" size={15} color={primary} />}
                <Text style={[styles.actionText, { color: primary }]}>{opening === record.id ? 'Đang mở…' : 'Tiếp tục đọc'}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: 28 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 16 },
  accent: { width: 3, height: 22, borderRadius: 2 },
  title: { fontSize: 20, lineHeight: 27, fontWeight: '700', flex: 1 },
  subtitle: { fontSize: 13, lineHeight: 20, paddingHorizontal: 16, marginTop: 4, marginBottom: 12 },
  message: { fontSize: 13, lineHeight: 20, paddingHorizontal: 16, marginBottom: 12 },
  list: { paddingHorizontal: 16, gap: 12 },
  card: { width: 188, minHeight: 174, padding: 10, gap: 8, borderWidth: 1, borderRadius: 8 },
  cover: { width: 68, height: 100, borderRadius: 4, overflow: 'hidden' },
  copy: { flex: 1, minWidth: 0, justifyContent: 'center' },
  bookTitle: { fontSize: 15, lineHeight: 21, fontWeight: '600' },
  author: { fontSize: 12, lineHeight: 18, marginTop: 4 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  actionText: { fontSize: 13, fontWeight: '600' },
});
