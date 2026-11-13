import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, AppState, FlatList, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppNavigation } from './navigation';
import { AppNotification, clearAllNotifications, deleteNotification, getNotifications, markAllNotificationsAsRead, markNotificationAsRead, NotificationType, subscribeNotifications } from './notificationService';

const TYPES: Record<NotificationType, { icon: keyof typeof Ionicons.glyphMap; color: string; label: string; en: string }> = {
  gift_received: { icon: 'gift-outline', color: '#BE6684', label: 'Nhận sách', en: 'Gift received' },
  gift_sent: { icon: 'paper-plane-outline', color: '#8271B4', label: 'Tặng sách', en: 'Gift sent' },
  potato_reward: { icon: 'sparkles-outline', color: '#B48732', label: 'Thưởng Khoai', en: 'Khoai rewards' },
  potato_purchase: { icon: 'wallet-outline', color: '#B48732', label: 'Nạp Khoai', en: 'Khoai top-up' },
  tier_upgrade: { icon: 'ribbon-outline', color: '#B48732', label: 'Thăng hạng', en: 'Membership' },
  system: { icon: 'megaphone-outline', color: '#4D887A', label: 'Hệ thống', en: 'System' },
};
type Tab = 'all' | 'unread' | 'gift' | 'potato' | 'tier' | 'system';
type Confirmation = { id: string; title: string } | 'all' | null;

function timeLabel(timestamp: number, english: boolean) {
  return new Date(timestamp).toLocaleString(english ? 'en-GB' : 'vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}
function dayLabel(timestamp: number, english: boolean) {
  const today = new Date();
  const yesterday = new Date(); yesterday.setDate(today.getDate() - 1);
  const date = new Date(timestamp);
  if (date.toDateString() === today.toDateString()) return english ? 'Today' : 'Hôm nay';
  if (date.toDateString() === yesterday.toDateString()) return english ? 'Yesterday' : 'Hôm qua';
  return date.toLocaleDateString(english ? 'en-GB' : 'vi-VN', { day: '2-digit', month: 'long', year: 'numeric' });
}

export default function ThongBaoScreen({ onBack }: { onBack: () => void }) {
  const { navigate, isDarkMode, lang, isLoggedIn } = useAppNavigation();
  const en = lang === 'en';
  const [items, setItems] = useState<AppNotification[]>([]);
  const [tab, setTab] = useState<Tab>('all');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [detail, setDetail] = useState<AppNotification | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation>(null);
  const mounted = useRef(false);
  const version = useRef(0);
  const invalidateLoads = useCallback(() => { version.current++; }, []);
  const mutation = useRef(false);
  const text = isDarkMode ? '#F3EEE5' : '#342E29';
  const muted = isDarkMode ? '#B5B1BB' : '#857F76';
  const card = isDarkMode ? '#23262E' : '#FFFFFF';
  const background = isDarkMode ? '#17191F' : '#FAF7F1';
  const load = useCallback(async () => {
    const ticket = ++version.current;
    try {
      const result = isLoggedIn ? await getNotifications() : [];
      if (mounted.current && ticket === version.current) { setItems(result); setError(''); }
    } catch {
      if (mounted.current && ticket === version.current) setError(en ? 'Could not load notifications. Please try again.' : 'Không thể tải thông báo. Vui lòng thử lại.');
    } finally {
      if (mounted.current && ticket === version.current) setLoading(false);
    }
  }, [en, isLoggedIn]);
  useEffect(() => {
    mounted.current = true;
    const initialLoad = setTimeout(() => { void load(); }, 0);
    const unsubscribe = subscribeNotifications(() => { void load(); });
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') void load(); });
    return () => { mounted.current = false; clearTimeout(initialLoad); invalidateLoads(); unsubscribe(); subscription.remove(); };
  }, [load, invalidateLoads]);

  const perform = async (action: () => Promise<void>) => {
    if (mutation.current) return;
    mutation.current = true;
    setBusy(true);
    try { await action(); await load(); }
    catch { if (mounted.current) setError(en ? 'Changes could not be saved. Try again.' : 'Chưa lưu được thay đổi. Vui lòng thử lại.'); }
    finally { mutation.current = false; if (mounted.current) setBusy(false); }
  };
  const open = (item: AppNotification) => {
    setDetail(item);
    if (!item.isRead) void perform(() => markNotificationAsRead(item.id));
  };
  const unread = items.filter(item => !item.isRead).length;
  const filtered = useMemo(() => items.filter(item => {
    if (tab === 'unread') return !item.isRead;
    if (tab === 'gift') return item.type === 'gift_received' || item.type === 'gift_sent';
    if (tab === 'potato') return item.type === 'potato_reward' || item.type === 'potato_purchase';
    if (tab === 'tier') return item.type === 'tier_upgrade';
    if (tab === 'system') return item.type === 'system';
    return true;
  }), [items, tab]);
  const tabs: { key: Tab; label: string }[] = [
    { key: 'all', label: en ? 'All' : 'Tất cả' }, { key: 'unread', label: `${en ? 'Unread' : 'Chưa đọc'}${unread ? ` · ${unread}` : ''}` },
    { key: 'gift', label: en ? 'Gifts' : 'Quà tặng' }, { key: 'potato', label: '🥔 Khoai' },
    { key: 'tier', label: en ? 'Membership' : 'Thăng hạng' }, { key: 'system', label: en ? 'System' : 'Hệ thống' },
  ];
  const goToRelated = () => {
    if (!detail) return;
    const target = detail.type.startsWith('gift_') ? 'bookshelf' : detail.type.startsWith('potato_') ? 'transactions' : detail.type === 'tier_upgrade' ? 'profile' : null;
    setDetail(null);
    if (target) navigate(target);
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.screen, { backgroundColor: background }]}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      <View style={styles.header}>
        <Pressable accessibilityLabel={en ? 'Go back' : 'Quay lại'} onPress={onBack} style={[styles.iconButton, { backgroundColor: card }]}><Ionicons name="arrow-back" size={22} color={text} /></Pressable>
        <View style={{ flex: 1 }}><Text style={[styles.title, { color: text }]}>{en ? 'Notifications' : 'Thông báo'}</Text><Text style={{ color: muted, fontSize: 12 }}>{en ? 'Your reading updates' : 'Hộp thư dành riêng cho bạn'}</Text></View>
        <Pressable disabled={!items.length || busy} accessibilityLabel={en ? 'Delete all notifications' : 'Xóa tất cả thông báo'} onPress={() => setConfirmation('all')} style={[styles.iconButton, { backgroundColor: card, opacity: items.length ? 1 : 0.35 }]}><Ionicons name="trash-outline" size={20} color={muted} /></Pressable>
      </View>
      <View style={styles.body}>
        <View style={styles.summary}>
          <View style={styles.summaryIcon}><Ionicons name="notifications-outline" color="#E8CA80" size={30} /></View>
          <View style={{ flex: 1, gap: 5 }}><Text style={styles.summaryTitle}>{unread ? (en ? `${unread} unread updates` : `Bạn có ${unread} tin chưa đọc`) : (en ? 'All caught up!' : 'Không bỏ lỡ điều hay')}</Text><Text style={styles.summaryCopy}>{en ? 'Gifts, Khoai and little reading milestones.' : 'Quà tặng, Khoai và những dấu mốc trên hành trình đọc.'}</Text></View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={styles.tabs}>{tabs.map(value => <Pressable key={value.key} accessibilityRole="tab" accessibilityState={{ selected: tab === value.key }} onPress={() => setTab(value.key)} style={[styles.tab, { backgroundColor: tab === value.key ? '#7B3037' : card }]}><Text style={{ color: tab === value.key ? '#FFF' : muted, fontWeight: '700', fontSize: 12 }}>{value.label}</Text></Pressable>)}</ScrollView>
        <View style={styles.listToolbar}><Text style={[styles.listTitle, { color: text }]}>{en ? 'Your inbox' : 'Hộp thư của bạn'} <Text style={{ color: muted, fontWeight: '400' }}>({filtered.length})</Text></Text><Pressable disabled={!unread || busy} onPress={() => void perform(() => markAllNotificationsAsRead())} accessibilityLabel={en ? 'Mark all as read' : 'Đánh dấu tất cả đã đọc'} style={[styles.readAll, { opacity: unread ? 1 : 0.4 }]}><Ionicons name="checkmark-done-outline" size={17} color="#B18C40" /><Text style={styles.readAllText}>{en ? 'Read all' : 'Đọc tất cả'}</Text></Pressable></View>
        {error ? <View accessibilityRole="alert" style={styles.error}><Text style={{ color: '#B45158', flex: 1 }}>{error}</Text><Pressable onPress={() => void load()}><Text style={{ color: '#B45158', fontWeight: '800' }}>{en ? 'Retry' : 'Thử lại'}</Text></Pressable></View> : null}
        <FlatList
          data={filtered} keyExtractor={item => item.id} showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={() => { setLoading(true); void load(); }} tintColor="#B18C40" />}
          renderItem={({ item, index }) => {
            const badge = TYPES[item.type] ?? TYPES.system;
            const day = dayLabel(item.timestamp, en);
            const showDay = index === 0 || day !== dayLabel(filtered[index - 1].timestamp, en);
            return <View>
              {showDay && <Text style={[styles.day, { color: muted }]}>{day}</Text>}
              <View style={[styles.notification, { backgroundColor: card, borderColor: !item.isRead ? '#B9924A66' : '#99999920' }]}>
                <Pressable disabled={busy} onPress={() => open(item)} accessibilityRole="button" accessibilityLabel={`${item.isRead ? '' : (en ? 'Unread. ' : 'Chưa đọc. ')}${item.title}`} style={styles.notificationMain}>
                  <View style={[styles.typeIcon, { backgroundColor: `${badge.color}18` }]}><Ionicons name={badge.icon} size={23} color={badge.color} /></View>
                  <View style={styles.notificationText}>
                    <View style={styles.metadata}><Text style={[styles.badge, { color: badge.color }]}>{en ? badge.en : badge.label}</Text>{!item.isRead && <View style={styles.dot} />}</View>
                    <Text style={[styles.notificationTitle, { color: text, fontWeight: item.isRead ? '600' : '800' }]}>{item.title}</Text>
                    <Text numberOfLines={2} style={[styles.message, { color: muted }]}>{item.message}</Text>
                    <Text style={[styles.time, { color: muted }]}>{timeLabel(item.timestamp, en)}</Text>
                  </View>
                </Pressable>
                <Pressable disabled={busy} onPress={() => setConfirmation({ id: item.id, title: item.title })} style={styles.deleteButton} accessibilityLabel={en ? `Delete ${item.title}` : `Xóa ${item.title}`}><Ionicons name="close" size={18} color={muted} /></Pressable>
              </View>
            </View>;
          }}
          ListEmptyComponent={<View style={styles.empty}>{loading ? <ActivityIndicator color="#B18C40" /> : <><View style={[styles.emptyIcon, { backgroundColor: card }]}><Ionicons name={tab === 'unread' ? 'checkmark-done-outline' : 'mail-open-outline'} size={42} color="#B99A58" /></View><Text style={[styles.emptyTitle, { color: text }]}>{!isLoggedIn ? (en ? 'Your inbox awaits' : 'Hộp thư đang chờ bạn') : tab === 'unread' ? (en ? 'You are all caught up' : 'Bạn đã đọc hết rồi!') : (en ? 'No updates here yet' : 'Chưa có thông báo ở đây')}</Text><Text style={[styles.emptyCopy, { color: muted }]}>{!isLoggedIn ? (en ? 'Log in to see your personal updates.' : 'Đăng nhập để xem thông báo dành riêng cho tài khoản của bạn.') : (en ? 'New gifts, Khoai and membership updates will appear here.' : 'Khi có quà tặng, nạp Khoai hoặc cập nhật thành viên, bạn sẽ thấy thông báo tại đây.')}</Text>{!isLoggedIn && <Pressable style={styles.primary} onPress={() => navigate('auth')}><Text style={styles.primaryText}>{en ? 'Log in' : 'Đăng nhập'}</Text></Pressable>}</>}</View>}
        />
      </View>
      <Modal visible={Boolean(detail || confirmation)} transparent animationType="fade" onRequestClose={() => { if (!busy) { setDetail(null); setConfirmation(null); } }}>
        <View style={styles.backdrop}><Pressable style={StyleSheet.absoluteFill} disabled={busy} accessibilityLabel={en ? 'Close dialog' : 'Đóng hộp thoại'} onPress={() => { setDetail(null); setConfirmation(null); }} />
          <View accessibilityViewIsModal style={[styles.dialog, { backgroundColor: card }]}>
            <ScrollView contentContainerStyle={{ gap: 16 }}>
              {error && <Text accessibilityRole="alert" style={{ color: '#B45158' }}>{error}</Text>}
              <View style={styles.dialogHeader}><View style={[styles.typeIcon, { backgroundColor: '#B99A5818' }]}><Ionicons name={confirmation ? 'trash-outline' : (TYPES[detail?.type ?? 'system'] ?? TYPES.system).icon} size={26} color="#B18C40" /></View><Pressable disabled={busy} accessibilityLabel={en ? 'Close' : 'Đóng'} style={styles.iconButton} onPress={() => { setDetail(null); setConfirmation(null); }}><Ionicons name="close" size={22} color={muted} /></Pressable></View>
              <Text style={[styles.dialogTitle, { color: text }]}>{confirmation ? (en ? 'Delete notifications?' : 'Xóa thông báo?') : detail?.title}</Text>
              <Text style={[styles.dialogCopy, { color: muted }]}>{confirmation ? confirmation === 'all' ? (en ? 'All notifications will be deleted. This cannot be undone.' : 'Toàn bộ thông báo sẽ bị xóa. Thao tác này không thể hoàn tác.') : `${en ? 'Delete' : 'Xóa'} “${confirmation.title}”?` : detail?.message}</Text>
              {detail && !confirmation && <><Text style={[styles.time, { color: muted }]}>{timeLabel(detail.timestamp, en)}</Text>{detail.type.startsWith('gift_') && <View style={[styles.giftMessage, { backgroundColor: background }]}><Text style={{ color: text, fontWeight: '700' }}>{detail.data?.bookTitle ?? (en ? 'Gift message' : 'Lời nhắn tặng sách')}</Text><Text selectable style={[styles.dialogCopy, { color: muted, marginTop: 10 }]}>{detail.data?.giftMessage?.trim() || (en ? 'No message included.' : 'Không có lời nhắn kèm theo.')}</Text></View>}{detail.type !== 'system' && <Pressable onPress={goToRelated} style={styles.primary}><Text style={styles.primaryText}>{detail.type.startsWith('gift_') ? (en ? 'Open bookshelf' : 'Đến tủ sách') : detail.type.startsWith('potato_') ? (en ? 'View transactions' : 'Xem giao dịch') : (en ? 'View membership' : 'Xem hạng thành viên')}</Text></Pressable>}</>}
              {confirmation && <View style={styles.confirmActions}><Pressable disabled={busy} onPress={() => setConfirmation(null)} style={styles.cancel}><Text style={{ color: muted, fontWeight: '700' }}>{en ? 'Cancel' : 'Hủy'}</Text></Pressable><Pressable disabled={busy} style={[styles.primary, { backgroundColor: '#A13D49', flex: 1 }]} onPress={() => { const target = confirmation; void perform(async () => { if (target === 'all') await clearAllNotifications(); else await deleteNotification(target.id); if (mounted.current) setConfirmation(null); }); }}><Text style={styles.primaryText}>{busy ? (en ? 'Deleting…' : 'Đang xóa…') : (en ? 'Delete' : 'Xóa')}</Text></Pressable></View>}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1 }, header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 18, width: '100%', maxWidth: 900, alignSelf: 'center' }, title: { fontSize: 23, fontWeight: '800', marginBottom: 3 }, iconButton: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, width: '100%', maxWidth: 900, alignSelf: 'center', paddingHorizontal: 18 }, summary: { backgroundColor: '#294B43', borderRadius: 23, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 15 }, summaryIcon: { padding: 12, borderRadius: 20, backgroundColor: '#FFFFFF12' }, summaryTitle: { color: '#FFF7E5', fontWeight: '800', fontSize: 17 }, summaryCopy: { color: '#C6D8CD', fontSize: 12, lineHeight: 19 },
  tabScroll: { flexGrow: 0, marginTop: 18, marginBottom: 18 }, tabs: { gap: 8, paddingVertical: 3 }, tab: { paddingHorizontal: 16, paddingVertical: 11, borderRadius: 13 }, listToolbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, paddingBottom: 6 }, listTitle: { fontSize: 16, fontWeight: '800' }, readAll: { flexDirection: 'row', alignItems: 'center', gap: 5, minHeight: 40 }, readAllText: { color: '#B18C40', fontSize: 12, fontWeight: '700' }, list: { paddingBottom: 110, flexGrow: 1 }, day: { fontSize: 12, fontWeight: '700', marginTop: 18, marginBottom: 10 },
  notification: { flexDirection: 'row', borderRadius: 19, borderWidth: 1, marginBottom: 10, overflow: 'hidden' }, notificationMain: { flexDirection: 'row', gap: 12, flex: 1, padding: 16, paddingRight: 0 }, typeIcon: { width: 46, height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }, notificationText: { flex: 1, gap: 6, paddingBottom: 2 }, metadata: { flexDirection: 'row', alignItems: 'center', gap: 8 }, badge: { fontSize: 10, fontWeight: '800' }, dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#C29B46' }, notificationTitle: { fontSize: 14, lineHeight: 21 }, message: { fontSize: 12, lineHeight: 19 }, time: { fontSize: 10, marginTop: 2 }, deleteButton: { width: 42, minHeight: 44, alignItems: 'center', paddingTop: 14 },
  empty: { alignItems: 'center', justifyContent: 'center', gap: 16, paddingHorizontal: 24, paddingVertical: 55 }, emptyIcon: { padding: 24, borderRadius: 30 }, emptyTitle: { fontSize: 19, fontWeight: '800', textAlign: 'center' }, emptyCopy: { fontSize: 13, lineHeight: 22, textAlign: 'center', maxWidth: 380 }, error: { flexDirection: 'row', gap: 12, padding: 14, backgroundColor: '#B4515812', borderRadius: 12 },
  backdrop: { flex: 1, backgroundColor: '#00000088', justifyContent: 'center', alignItems: 'center', padding: 22 }, dialog: { width: '100%', maxWidth: 480, maxHeight: '85%', borderRadius: 25, padding: 24 }, dialogHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, dialogTitle: { fontSize: 21, fontWeight: '800', lineHeight: 29 }, dialogCopy: { fontSize: 14, lineHeight: 23 }, giftMessage: { padding: 18, borderRadius: 16 }, primary: { backgroundColor: '#7B3037', borderRadius: 13, paddingHorizontal: 22, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' }, primaryText: { color: '#FFF', fontWeight: '700', fontSize: 13 }, confirmActions: { flexDirection: 'row', gap: 12 }, cancel: { flex: 1, padding: 14, alignItems: 'center', justifyContent: 'center' },
});
