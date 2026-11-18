import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { CatalogContent, loadCatalogContent } from './catalogContentService';
import { PdfEmbedViewer } from './PdfEmbedViewer';
import { syncReadingProgressApi } from './rentalService';

/** Mounted only after server entitlement is checked; each book has a separate lifetime. */
export default function CatalogReader({ bookId, title, author, onBack }: { bookId: string; title: string; author: string; onBack: () => void }) {
  const [content, setContent] = useState<CatalogContent | null>(null);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let loaded: CatalogContent | undefined;
    loadCatalogContent(bookId, title, author, controller.signal).then(result => {
      loaded = result;
      if (controller.signal.aborted) { result.dispose(); return; }
      setError(''); setContent(result);
    }).catch(reason => {
      if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'Không tải được sách.');
    });
    return () => { controller.abort(); loaded?.dispose(); };
  }, [bookId, title, author, attempt]);
  useEffect(() => {
    if (content && content.chapters.length) void syncReadingProgressApi(bookId, page + 1, content.chapters.length);
  }, [bookId, page, content]);
  const chapter = content?.chapters[page];
  return <View style={{ flex: 1, backgroundColor: '#F7F3E8', paddingTop: 44 }}>
    <View style={{ flexDirection: 'row', gap: 16, padding: 16, alignItems: 'center' }}>
      <TouchableOpacity onPress={onBack}><Text>← Quay lại</Text></TouchableOpacity>
      <Text style={{ flex: 1, fontWeight: '700' }} numberOfLines={1}>{title}</Text>
      {content && <TouchableOpacity onPress={() => { void content.open().catch(reason => Alert.alert('Mở tài liệu', reason.message)); }}><Text>Mở tệp gốc</Text></TouchableOpacity>}
    </View>
    {error ? <View style={{ padding: 24 }}><Text>{error}</Text><TouchableOpacity onPress={() => { setError(''); setContent(null); setAttempt(value => value + 1); }}><Text>Thử lại</Text></TouchableOpacity></View>
      : !content ? <ActivityIndicator size="large" />
      : Platform.OS === 'web' && content.format === 'PDF' ? <PdfEmbedViewer uri={content.uri} title={title} />
      : <>
        <ScrollView key={page} contentContainerStyle={{ padding: 24 }}>
          <Text style={{ fontSize: 22, fontWeight: '700', marginBottom: 16 }}>{chapter?.title || title}</Text>
          {chapter?.content.map((paragraph, index) => <Text key={index} selectable style={{ fontSize: 19, lineHeight: 30, marginBottom: 16 }}>{paragraph}</Text>)}
          {!chapter && <Text>Chọn “Mở tệp gốc” để đọc tài liệu này.</Text>}
        </ScrollView>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 20, paddingBottom: 36 }}>
          <TouchableOpacity disabled={page <= 0} onPress={() => setPage(value => value - 1)}><Text>← Trang trước</Text></TouchableOpacity>
          <Text>{page + 1} / {content.chapters.length || 1}</Text>
          <TouchableOpacity disabled={page >= content.chapters.length - 1} onPress={() => setPage(value => value + 1)}><Text>Trang sau →</Text></TouchableOpacity>
        </View>
      </>}
  </View>;
}
