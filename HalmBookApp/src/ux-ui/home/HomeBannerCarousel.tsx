import { Ionicons } from '@expo/vector-icons';
import { ComponentRef, useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, AppState, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppBanner, bannerDestination, fetchAppBanners } from '../bannerService';
import { fetchApiWithFallback } from '../apiService';
import { useAppNavigation } from '../navigation';
import { mapHomeBook } from './homeData';

export default function HomeBannerCarousel({ width, refreshKey }: { width: number; refreshKey: number }) {
  const { navigate, isDarkMode } = useAppNavigation();
  const [banners, setBanners] = useState<AppBanner[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [opening, setOpening] = useState(false);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const request = useRef<AbortController | null>(null);
  const actionRequest = useRef<AbortController | null>(null);
  const cardWidth = Math.max(200, width - 32);
  const step = cardWidth + 12;

  const load = useCallback(async () => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    try {
      const data = await fetchAppBanners(controller.signal);
      if (controller.signal.aborted) return;
      setBanners(data);
      setError('');
      setFailedImages(new Set());
    } catch {
      if (!controller.signal.aborted) setError('Chưa tải được banner.');
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Hydrate banners from the server on mount and explicit refresh.
    void load();
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') void load(); });
    const timer = setInterval(() => { if (AppState.currentState === 'active') void load(); }, 60000);
    return () => { clearInterval(timer); subscription.remove(); request.current?.abort(); };
  }, [load, refreshKey]);

  useEffect(() => () => actionRequest.current?.abort(), []);

  useEffect(() => {
    scroll.current?.scrollTo({ x: 0, animated: false });
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Reset the indicator when the server order or viewport changes.
    setIndex(0);
  }, [step, banners]);

  useEffect(() => {
    if (banners.length < 2) return;
    const timer = setInterval(() => {
      setIndex(current => (current + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length, step]);

  useEffect(() => { scroll.current?.scrollTo({ x: index * step, animated: true }); }, [index, step]);

  const open = async (banner: AppBanner) => {
    const destination = bannerDestination(banner.actionLink);
    if (!destination || opening) return;
    if ('screen' in destination) { navigate(destination.screen); return; }
    const controller = new AbortController();
    actionRequest.current = controller;
    setOpening(true);
    try {
      const result = await fetchApiWithFallback(`/api/home/books/${encodeURIComponent(destination.bookId)}`, { signal: controller.signal });
      const book = mapHomeBook(result.data, result.baseUrl);
      if (!book) throw new Error('Không tìm thấy sách.');
      if (!controller.signal.aborted) navigate('bookDetail', book);
    } catch {
      if (!controller.signal.aborted) Alert.alert('Không mở được sách', 'Sách hiện chưa khả dụng. Vui lòng thử lại sau.');
    } finally { if (!controller.signal.aborted) setOpening(false); }
  };

  if (loading) return <ActivityIndicator style={{ padding: 12 }} color={isDarkMode ? '#E5A93C' : '#4B8176'} />;
  if (!banners.length && !error) return null;
  return <View>
    {banners.length > 0 && <>
      <ScrollView ref={scroll} horizontal showsHorizontalScrollIndicator={false} snapToInterval={step}
        decelerationRate="fast" contentContainerStyle={{ paddingHorizontal: 16 }}
        onMomentumScrollEnd={event => setIndex(Math.max(0, Math.min(banners.length - 1, Math.round(event.nativeEvent.contentOffset.x / step))))}>
        {banners.map(banner => {
          const pure = banner.layoutType === 'custom_image' && banner.imageMode === 'pure';
          const image = banner.imageUrl && !failedImages.has(banner.id);
          const overlay = banner.layoutType === 'custom_image' && !!image;
          const enabled = !!bannerDestination(banner.actionLink);
          return <TouchableOpacity key={banner.id} activeOpacity={0.9} disabled={!enabled || opening}
            accessibilityRole={enabled ? 'button' : undefined} accessibilityLabel={banner.title || banner.actionText || 'Banner HALM BOOK'}
            onPress={() => void open(banner)} style={[styles.card, { width: cardWidth, minHeight: pure ? cardWidth / 2 : 180 }]}>
            {image && <Image source={{ uri: banner.imageUrl }} resizeMode="cover"
              onError={() => setFailedImages(previous => new Set([...previous, banner.id]))}
              style={pure || overlay ? StyleSheet.absoluteFill : styles.sideImage} />}
            {overlay && !pure && <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.6)' }]} />}
            {(!pure || !image) && <View style={[styles.copy, !overlay && image ? { paddingRight: 120 } : null]}>
              {!!banner.eyebrow && <Text style={styles.eyebrow} numberOfLines={1}>{banner.eyebrow}</Text>}
              <Text style={styles.title} numberOfLines={2}>{banner.title || 'HALM BOOK'}</Text>
              {!!banner.titleHighlight && <Text style={styles.highlight} numberOfLines={1}>{banner.titleHighlight}</Text>}
              {!!banner.description && <Text style={styles.description} numberOfLines={3}>{banner.description}</Text>}
              {enabled && <Text style={styles.action}>{banner.actionText || 'Khám phá ngay'} →</Text>}
              {pure && !image && <Ionicons name="image-outline" size={28} color="#D5AC56" />}
            </View>}
          </TouchableOpacity>;
        })}
      </ScrollView>
      {banners.length > 1 && <View style={styles.dots}>{banners.map((banner, i) =>
        <TouchableOpacity key={banner.id} accessibilityRole="button" accessibilityLabel={`Banner ${i + 1}`}
          accessibilityState={{ selected: i === index }} onPress={() => { setIndex(i); scroll.current?.scrollTo({ x: i * step, animated: true }); }} style={styles.dotTarget}>
          <View style={[styles.dot, i === index && styles.selectedDot]} />
        </TouchableOpacity>)}</View>}
    </>}
    {!!error && <TouchableOpacity onPress={() => void load()} accessibilityRole="button" style={{ padding: 12 }}>
      <Text style={{ textAlign: 'center', color: isDarkMode ? '#D5AC56' : '#8B4A3C', fontSize: 12 }}>{error} Chạm để thử lại.</Text>
    </TouchableOpacity>}
  </View>;
}

const styles = StyleSheet.create({
  card: { marginRight: 12, borderRadius: 16, overflow: 'hidden', backgroundColor: '#242321', justifyContent: 'center' },
  copy: { padding: 20 }, sideImage: { position: 'absolute', right: 16, width: 88, height: 124, borderRadius: 8 },
  eyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 1, color: '#D5AC56', marginBottom: 6 },
  title: { fontSize: 21, lineHeight: 27, fontWeight: '700', color: '#FFFFFF' },
  highlight: { color: '#E5A93C', fontSize: 14, fontWeight: '600', marginTop: 4 },
  description: { fontSize: 12, lineHeight: 18, color: '#DED9CF', marginTop: 8 },
  action: { color: '#E5A93C', fontWeight: '700', fontSize: 12, marginTop: 12 },
  dots: { flexDirection: 'row', justifyContent: 'center', paddingVertical: 4 }, dotTarget: { padding: 9 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#B9B1A4' }, selectedDot: { width: 20, backgroundColor: '#D5AC56' },
});
