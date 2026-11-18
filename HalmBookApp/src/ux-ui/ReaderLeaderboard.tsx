import { Ionicons } from '@expo/vector-icons';
import { Crown } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, AppState, Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getLeaderboard, hasLeaderboardSource, LeaderboardData, RankedReader, rankingWindow, RankingPeriod, RANK_REWARDS, rewardForRank } from './leaderboardService';
import { useAppNavigation } from './navigation';

const medals = ['#D9A62E', '#9AA9BC', '#BF8055'];
function Avatar({ reader, large = false }: { reader: Pick<RankedReader, 'name' | 'avatarUrl'>; large?: boolean }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const size = large ? 64 : 42;
  return reader.avatarUrl && failedUrl !== reader.avatarUrl ? (
    <Image source={{ uri: reader.avatarUrl }} onError={() => setFailedUrl(reader.avatarUrl)} style={{ width: size, height: size, borderRadius: size / 2 }} />
  ) : <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}><Text style={styles.initial}>{reader.name.trim().slice(0, 1).toUpperCase() || '?'}</Text></View>;
}

export default function ReaderLeaderboard() {
  const { navigateTab, isDarkMode, isLoggedIn, userAvatarUrl, lang } = useAppNavigation();
  const { width } = useWindowDimensions();
  const [period, setPeriod] = useState<RankingPeriod>('week');
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [now, setNow] = useState(Date.now());
  const request = useRef<AbortController | null>(null);
  const fade = useRef(new Animated.Value(1)).current;
  const window = rankingWindow(period, now);
  const windowKey = window.startsAt;
  const text = isDarkMode ? '#F5EFE4' : '#302820';
  const muted = isDarkMode ? '#B5B2BC' : '#82796F';
  const card = isDarkMode ? '#22242C' : '#FFFFFF';

  const load = useCallback(async () => {
    request.current?.abort();
    if (!hasLeaderboardSource) return;
    const controller = new AbortController();
    request.current = controller;
    setLoading(true);
    setError('');
    try {
      const result = await getLeaderboard(period, controller.signal);
      if (!controller.signal.aborted) {
        if (Date.parse(result.startsAt) !== Date.parse(windowKey)) throw new Error('Kỳ xếp hạng trên máy chủ chưa được cập nhật.');
        setData(result);
      }
    } catch (err) {
      if (!controller.signal.aborted) setError(err instanceof Error ? err.message : 'Không thể tải bảng xếp hạng.');
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [period, windowKey]);

  useEffect(() => {
    const initialLoad = setTimeout(() => { void load(); }, 0);
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: 220, useNativeDriver: true }).start();
    const poll = setInterval(() => { if (AppState.currentState === 'active') void load(); }, 30000);
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') { setNow(Date.now()); void load(); }
      else request.current?.abort();
    });
    return () => { clearTimeout(initialLoad); clearInterval(poll); subscription.remove(); request.current?.abort(); };
  }, [load, fade, isLoggedIn]);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const validData = data?.period === period && Date.parse(data.startsAt) === Date.parse(windowKey) ? data : null;
  const remaining = Math.max(0, Math.floor((Date.parse(validData?.endsAt ?? window.endsAt) - now) / 1000));
  const countdown = `${Math.floor(remaining / 86400)} ngày ${String(Math.floor(remaining / 3600) % 24).padStart(2, '0')}:${String(Math.floor(remaining / 60) % 60).padStart(2, '0')}:${String(remaining % 60).padStart(2, '0')}`;
  const me = isLoggedIn ? validData?.me : null;
  const above = me ? validData?.above : null;
  const needed = me && above ? above.points - me.points + 1 : null;
  const progress = me?.rank === 1 ? 1 : me && above ? Math.min(1, me.points / (above.points + 1)) : 0;

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: isDarkMode ? '#17191F' : '#FAF7F1' }]} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigateTab('home')} accessibilityLabel={lang === 'en' ? 'Back to home' : 'Về trang chủ'} style={[styles.back, { backgroundColor: card }]}><Ionicons name="arrow-back" size={22} color={text} /></Pressable>
        <View><Text style={[styles.headerTitle, { color: text }]}>Xếp hạng độc giả</Text><Text style={{ color: muted, fontSize: 12 }}>Mỗi trang sách, một bước tiến</Text></View>
        <Ionicons name="trophy" size={25} color="#C5942E" />
      </View>
      <ScrollView contentContainerStyle={[styles.content, { paddingHorizontal: width < 380 ? 14 : 24 }]} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor="#A27530" />}>
        <View style={styles.hero}>
          <View style={styles.heroTop}><Text style={styles.eyebrow}>HALM BOOK • READING CLUB</Text><Ionicons name="sparkles" size={24} color="#E8C775" /></View>
          <Text style={styles.heroTitle}>Đọc say mê.{ '\n' }Chạm đỉnh vinh quang.</Text>
          <Text style={styles.heroCopy}>Tôn vinh những độc giả bền bỉ. Cùng đọc, cùng tiến bộ và chinh phục những mốc Khoai mới.</Text>
          <View style={styles.timer}><Ionicons name="time-outline" size={17} color="#E8C775" /><Text style={styles.timerText}>Kết thúc sau {countdown}</Text></View>
          <Text style={styles.timezone}>Lịch Việt Nam (UTC+7) · Tuần bắt đầu thứ Hai</Text>
        </View>

        <View style={[styles.tabs, { backgroundColor: card }]}>{(['week', 'month'] as const).map(value => <Pressable key={value} accessibilityRole="tab" accessibilityState={{ selected: period === value }} onPress={() => setPeriod(value)} style={[styles.tab, period === value && styles.activeTab]}><Ionicons name={value === 'week' ? 'flash' : 'calendar'} size={17} color={period === value ? '#FFF' : muted} /><Text style={{ fontWeight: '700', color: period === value ? '#FFF' : muted }}>{value === 'week' ? 'Top tuần' : 'Top tháng'}</Text></Pressable>)}</View>

        <Animated.View style={{ opacity: fade, gap: 22 }}>
          <View><Text style={[styles.sectionTitle, { color: text }]}>🏆 Bảng vàng độc giả</Text><Text style={[styles.caption, { color: muted }]}>Top 10 • Điểm đọc hợp lệ trong kỳ</Text></View>
          {loading && !validData && <ActivityIndicator color="#A27530" />}
          {!hasLeaderboardSource ? <View style={[styles.notice, { backgroundColor: card }]}><Ionicons name="cloud-offline-outline" size={36} color="#BD984C" /><Text style={[styles.noticeTitle, { color: text }]}>Bảng vàng đang chờ kết nối</Text><Text style={[styles.noticeCopy, { color: muted }]}>Hệ thống hiện chưa cung cấp dữ liệu xếp hạng theo tuần và tháng. Độc giả và điểm số sẽ xuất hiện khi có nguồn dữ liệu chính thức.</Text></View> : error ? <View style={[styles.notice, { backgroundColor: card }]}><Text style={[styles.noticeTitle, { color: text }]}>Chưa thể cập nhật xếp hạng</Text><Text style={[styles.noticeCopy, { color: muted }]}>{error}</Text><Pressable onPress={load} style={styles.retry}><Text style={styles.retryText}>Thử lại</Text></Pressable></View> : null}
          {validData && !error && <>
            {validData.top.length === 0 ? <View style={[styles.notice, { backgroundColor: card }]}><Ionicons name="book-outline" size={36} color="#BD984C" /><Text style={[styles.noticeTitle, { color: text }]}>Kỳ mới, hành trình mới</Text><Text style={[styles.noticeCopy, { color: muted }]}>Chưa có hoạt động đọc được ghi nhận trong kỳ này. Hãy trở thành người đầu tiên!</Text></View> : <>
              <View style={styles.podium}>{[2, 1, 3].map(rank => {
                const reader = validData.top.find(item => item.rank === rank);
                if (!reader) return <View key={rank} style={{ flex: 1 }} />;
                return <View key={rank} style={[styles.winner, { backgroundColor: card, borderColor: medals[rank - 1], marginTop: rank === 1 ? 0 : 24 }]}>{rank === 1 ? <Crown color={medals[0]} size={34} /> : <Ionicons name="medal" color={medals[rank - 1]} size={26} />}<Avatar reader={reader} large={width >= 380} /><Text numberOfLines={2} style={[styles.winnerName, { color: text }]}>{reader.name}</Text><Text style={{ color: medals[rank - 1], fontWeight: '800', fontSize: 18 }}>#{rank}</Text><Text style={{ color: muted, fontSize: 12 }}>{reader.points.toLocaleString()} điểm</Text><Text style={styles.reward}>🥔 {rewardForRank(rank)}</Text>{rank === 1 && <Text style={styles.champion}>QUÁN QUÂN</Text>}</View>;
              })}</View>
              <View style={[styles.list, { backgroundColor: card }]}>{validData.top.filter(reader => reader.rank > 3).map(reader => <View key={reader.customerId} style={styles.row}><Text style={[styles.rank, { color: muted }]}>#{reader.rank}</Text><Avatar reader={reader} /><View style={styles.readerText}><Text numberOfLines={1} style={[styles.readerName, { color: text }]}>{reader.name}</Text><Text style={{ color: muted, fontSize: 12 }}>{reader.points.toLocaleString()} điểm · Top {reader.rank}</Text></View><Text style={styles.reward}>🥔 {rewardForRank(reader.rank)}</Text></View>)}</View>
            </>}
          </>}

          <View style={[styles.journey, { backgroundColor: card }]}>
            <Text style={[styles.sectionTitle, { color: text }]}>Hành trình leo Top của bạn</Text>
            <View style={styles.journeyUser}><Avatar reader={me ?? { name: 'Bạn', avatarUrl: userAvatarUrl ?? null }} /><View style={styles.readerText}><Text style={[styles.readerName, { color: text }]}>{me?.name ?? (isLoggedIn ? 'Độc giả HALM BOOK' : 'Chào bạn đọc!')}</Text><Text style={{ color: muted }}>{me ? `Hạng #${me.rank} · ${me.points.toLocaleString()} điểm` : !isLoggedIn ? 'Đăng nhập để theo dõi thành tích' : !validData || error ? 'Chưa có dữ liệu thứ hạng cá nhân' : 'Chưa xếp hạng trong kỳ này'}</Text></View></View>
            <View style={styles.progress} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }}><View style={[styles.progressFill, { width: `${progress * 100}%` }]} /></View>
            <Text style={[styles.noticeCopy, { color: muted, textAlign: 'left' }]}>{me?.rank === 1 ? 'Bạn đang dẫn đầu! Tiếp tục giữ nhịp đọc để bảo vệ ngôi vị quán quân.' : needed !== null && above ? `Cần thêm ${needed.toLocaleString()} điểm để vượt hạng #${above.rank}.` : !isLoggedIn ? 'Đăng nhập và bắt đầu đọc để tham gia hành trình leo Top.' : validData && !me && !error ? 'Mở một cuốn sách và bắt đầu đọc để ghi dấu hành trình của bạn!' : 'Tiến độ sẽ được tính từ điểm đọc và thứ hạng thực tế khi nguồn dữ liệu sẵn sàng.'}</Text>
            {above && <Text style={styles.nextReward}>{rewardForRank(above.rank) ? `Mốc tiếp theo: 🥔 ${rewardForRank(above.rank)} Khoai ở hạng #${above.rank}` : `Tiến gần Top 10 hơn khi đạt hạng #${above.rank}`}</Text>}
            {!isLoggedIn && <Pressable style={styles.retry} onPress={() => navigateTab('auth')}><Text style={styles.retryText}>Đăng nhập</Text></Pressable>}
          </View>

          <View style={[styles.journey, { backgroundColor: card }]}><Text style={[styles.sectionTitle, { color: text }]}>🎁 Mốc thưởng Top 10</Text><Text style={[styles.caption, { color: muted }]}>Phần thưởng dự kiến theo thứ hạng khi chốt kỳ</Text><View style={styles.rewardGrid}>{RANK_REWARDS.map((reward, index) => <View key={reward} style={[styles.rewardChip, { backgroundColor: isDarkMode ? '#303039' : '#FAF5E9' }]}><Text style={{ color: index < 3 ? medals[index] : muted, fontWeight: '700' }}>#{index + 1}</Text><Text style={styles.reward}>🥔 {reward}</Text></View>)}</View><Text style={[styles.noticeCopy, { color: muted, textAlign: 'left' }]}>Khoai được hiển thị là mốc thưởng, không phải số dư đã nhận. Việc chốt kỳ, trao thưởng và lưu lịch sử chống trùng cần được hệ thống máy chủ hỗ trợ; hiện chưa khả dụng.</Text></View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 18, maxWidth: 960, alignSelf: 'center', width: '100%' },
  back: { padding: 11, borderRadius: 15 }, headerTitle: { fontSize: 20, fontWeight: '800' },
  content: { width: '100%', maxWidth: 960, alignSelf: 'center', paddingTop: 8, paddingBottom: 140, gap: 22 },
  hero: { backgroundColor: '#294B43', borderRadius: 26, padding: 24, gap: 14, overflow: 'hidden' }, heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eyebrow: { color: '#E8C775', letterSpacing: 1.7, fontSize: 10, fontWeight: '800', flexShrink: 1 }, heroTitle: { fontSize: 30, fontWeight: '800', color: '#FFFAEB', lineHeight: 38 },
  heroCopy: { color: '#D2E1D8', fontSize: 13, lineHeight: 21, maxWidth: 560 }, timer: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, padding: 12, backgroundColor: '#365A4F', borderRadius: 13, alignSelf: 'flex-start' },
  timerText: { color: '#FFF5D3', fontWeight: '700', fontVariant: ['tabular-nums'], fontSize: 12 }, timezone: { color: '#ACCDC0', fontSize: 10 },
  tabs: { flexDirection: 'row', padding: 5, borderRadius: 17, gap: 5 }, tab: { flex: 1, padding: 13, borderRadius: 13, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 }, activeTab: { backgroundColor: '#7B3037' },
  sectionTitle: { fontSize: 18, fontWeight: '800' }, caption: { fontSize: 12, marginTop: 6, lineHeight: 18 },
  notice: { borderRadius: 22, padding: 26, alignItems: 'center', gap: 12 }, noticeTitle: { fontSize: 17, fontWeight: '700', textAlign: 'center' }, noticeCopy: { fontSize: 13, lineHeight: 22, textAlign: 'center' },
  podium: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 }, winner: { flex: 1, paddingVertical: 16, paddingHorizontal: 6, alignItems: 'center', borderRadius: 20, borderWidth: 1.5, gap: 9 }, winnerName: { fontSize: 13, fontWeight: '700', textAlign: 'center', minHeight: 32 },
  champion: { fontSize: 8, fontWeight: '900', color: '#B88D2B', letterSpacing: 0.5 }, avatar: { backgroundColor: '#EBE1CE', alignItems: 'center', justifyContent: 'center' }, initial: { color: '#7B3037', fontSize: 22, fontWeight: '800' },
  list: { borderRadius: 22, paddingHorizontal: 14 }, row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 15, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#99999933' }, rank: { width: 28, fontSize: 14, fontWeight: '800' }, readerText: { flex: 1, gap: 5 }, readerName: { fontSize: 14, fontWeight: '700' }, reward: { color: '#B1842E', fontWeight: '800', fontSize: 13 },
  journey: { padding: 20, borderRadius: 22, gap: 16 }, journeyUser: { flexDirection: 'row', alignItems: 'center', gap: 12 }, progress: { height: 10, backgroundColor: '#A99B7B33', borderRadius: 8, overflow: 'hidden' }, progressFill: { height: '100%', borderRadius: 8, backgroundColor: '#C49A40' }, nextReward: { color: '#B1842E', fontSize: 13, fontWeight: '700' },
  rewardGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, rewardChip: { minWidth: 94, flexGrow: 1, padding: 12, borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between', gap: 12 }, retry: { backgroundColor: '#7B3037', paddingHorizontal: 22, paddingVertical: 12, borderRadius: 12, alignSelf: 'center' }, retryText: { color: '#FFF', fontWeight: '700' },
});
