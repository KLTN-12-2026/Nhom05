import { useReadingMission } from './useMissionTracking';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { CatalogContent, loadCatalogContent } from './catalogContentService';
import { PdfEmbedViewer } from './PdfEmbedViewer';
import { checkBookAccessDetailApi, syncReadingProgressApi } from './rentalService';

/** Mounted only after server entitlement is checked; each book has a separate lifetime. */
export default function CatalogReader({ bookId, title, author, initialPage = 1, preserveInitialProgress = false, onBack, onAccessDenied }: { bookId: string; title: string; author: string; initialPage?: number; preserveInitialProgress?: boolean; onBack: () => void; onAccessDenied: () => void }) {
  const [content, setContent] = useState<CatalogContent | null>(null);
  const [error, setError] = useState('');
  const [page, setPage] = useState(() => Math.max(0, initialPage - 1));
  const [attempt, setAttempt] = useState(0);
  const openRequest = useRef<AbortController | null>(null);
  const canSyncProgress = useRef(!preserveInitialProgress);
  useEffect(() => {
    const controller = new AbortController();
    let loaded: CatalogContent | undefined;
    loadCatalogContent(bookId, title, author, controller.signal).then(result => {
      loaded = result;
      if (controller.signal.aborted) { result.dispose(); return; }
      setPage(current => Math.min(current, Math.max(0, result.chapters.length - 1)));
      setError(''); setContent(result);
    }).catch(reason => {
      if (!controller.signal.aborted && [401, 403, 423].includes(reason?.response?.status ?? reason?.status)) onAccessDenied();
      if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'Không tải được sách.');
    });
    return () => { controller.abort(); openRequest.current?.abort(); loaded?.dispose(); };
  }, [bookId, title, author, attempt, onAccessDenied]);
  useEffect(() => {
    if (content && content.chapters.length && canSyncProgress.current) void syncReadingProgressApi(bookId, page + 1, content.chapters.length);
  }, [bookId, page, content]);
  useReadingMission(bookId, !!content && !error);
  const chapter = content?.chapters[page];
  const openOriginal = async () => {
    openRequest.current?.abort();
    const controller = new AbortController();
    openRequest.current = controller;
    const detail = await checkBookAccessDetailApi(bookId, controller.signal);
    if (controller.signal.aborted || openRequest.current !== controller) return;
    if (!detail.hasAccess || !detail.checkedFromServer) { onAccessDenied(); return; }
    await content?.open();
  };
  return <View style={{ flex: 1, backgroundColor: '#F7F3E8', paddingTop: 44 }}>
    <View style={{ flexDirection: 'row', gap: 16, padding: 16, alignItems: 'center' }}>
      <TouchableOpacity onPress={onBack}><Text>← Quay lại</Text></TouchableOpacity>
      <Text style={{ flex: 1, fontWeight: '700' }} numberOfLines={1}>{title}</Text>
      {content && <TouchableOpacity onPress={() => { void openOriginal().catch(reason => Alert.alert('Mở tài liệu', reason.message)); }}><Text>Mở tệp gốc</Text></TouchableOpacity>}
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
          <TouchableOpacity disabled={page <= 0} onPress={() => { canSyncProgress.current = true; setPage(value => value - 1); }}><Text>← Trang trước</Text></TouchableOpacity>
          <Text>{page + 1} / {content.chapters.length || 1}</Text>
          <TouchableOpacity disabled={page >= content.chapters.length - 1} onPress={() => { canSyncProgress.current = true; setPage(value => value + 1); }}><Text>Trang sau →</Text></TouchableOpacity>
        </View>
      </>}
  </View>;
}
