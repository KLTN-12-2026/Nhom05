import { 
  ArrowLeft, 
  Bell, 
  BookOpen, 
  CheckCheck, 
  Coins, 
  Crown, 
  Gift, 
  Mail, 
  Quote, 
  Sparkles, 
  Trash2, 
  X 
} from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { useAppNavigation, useAppThemeStyles } from './navigation';
import {
  AppNotification,
  clearAllNotifications,
  deleteNotification,
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  NotificationType
} from './notificationService';
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

interface ThongBaoScreenProps {
  onBack: () => void;
}

type FilterTab = 'all' | 'gift' | 'potato' | 'tier' | 'system';

interface GiftMessageModalData {
  senderName: string;
  bookTitle: string;
  message: string;
  hasMessage: boolean;
  isSent?: boolean;
}

export default function ThongBaoScreen({ onBack }: ThongBaoScreenProps) {
  const themeStyles = useAppThemeStyles(styles);
  const { navigate, isDarkMode, lang } = useAppNavigation();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // State mở popup xem lời nhắn tặng sách
  const [activeGiftModal, setActiveGiftModal] = useState<GiftMessageModalData | null>(null);

  // Tải danh sách thông báo
  const loadNotifications = useCallback(async () => {
    try {
      const data = await getNotifications();
      setNotifications(data);
    } catch (err) {
      console.warn('Lỗi tải thông báo:', err);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadNotifications();
    setIsRefreshing(false);
  };

  // Xem lời nhắn tặng sách
  const handleOpenGiftMessage = async (item: AppNotification) => {
    if (!item.isRead) {
      await markNotificationAsRead(item.id);
      setNotifications((current) =>
        current.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
      );
    }

    const isSent = item.type === 'gift_sent';
    const sender = isSent 
      ? (item.data?.recipientName || (lang === 'en' ? 'Friend' : 'Bạn bè')) 
      : (item.data?.senderName || (lang === 'en' ? 'A friend' : 'Bạn bè'));
    const bookTitle = item.data?.bookTitle || (lang === 'en' ? 'Gift book' : 'Sách tặng');
    const rawMessage = item.data?.giftMessage?.trim();
    const hasMessage = Boolean(rawMessage && rawMessage.length > 0);
    const message = hasMessage 
      ? rawMessage! 
      : (lang === 'en' ? 'No message' : 'Không có lời nhắn nào');

    setActiveGiftModal({
      senderName: sender,
      bookTitle,
      message,
      hasMessage,
      isSent,
    });
  };

  // Đánh dấu 1 thông báo đã đọc
  const handleItemPress = async (item: AppNotification) => {
    if (!item.isRead) {
      await markNotificationAsRead(item.id);
      setNotifications((current) =>
        current.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
      );
    }

    // Nếu là nhận sách hoặc tặng sách -> mở xem lời nhắn
    if (item.type === 'gift_received' || item.type === 'gift_sent') {
      handleOpenGiftMessage(item);
    } else if (item.type === 'tier_upgrade') {
      navigate('profile');
    }
  };

  // Đánh dấu tất cả là đã đọc
  const handleMarkAllRead = async () => {
    if (notifications.length === 0) return;
    await markAllNotificationsAsRead();
    setNotifications((current) => current.map((n) => ({ ...n, isRead: true })));
  };

  // Xóa 1 thông báo
  const handleDeleteItem = (item: AppNotification) => {
    Alert.alert(
      lang === 'en' ? 'Delete notification' : 'Xóa thông báo',
      lang === 'en' ? 'Are you sure you want to delete this notification?' : 'Bạn có chắc muốn xóa thông báo này?',
      [
        { text: lang === 'en' ? 'Cancel' : 'Hủy', style: 'cancel' },
        {
          text: lang === 'en' ? 'Delete' : 'Xóa',
          style: 'destructive',
          onPress: async () => {
            await deleteNotification(item.id);
            setNotifications((current) => current.filter((n) => n.id !== item.id));
          },
        },
      ]
    );
  };

  // Xóa toàn bộ thông báo
  const handleClearAll = () => {
    if (notifications.length === 0) return;
    Alert.alert(
      lang === 'en' ? 'Clear all' : 'Xóa tất cả thông báo',
      lang === 'en' ? 'Are you sure you want to clear all notifications?' : 'Bạn có chắc chắn muốn xóa toàn bộ thông báo?',
      [
        { text: lang === 'en' ? 'Cancel' : 'Hủy', style: 'cancel' },
        {
          text: lang === 'en' ? 'Clear All' : 'Xóa tất cả',
          style: 'destructive',
          onPress: async () => {
            await clearAllNotifications();
            setNotifications([]);
          },
        },
      ]
    );
  };

  // Lọc theo tab
  const filteredNotifications = notifications.filter((item) => {
    if (activeTab === 'gift') {
      return item.type === 'gift_received' || item.type === 'gift_sent';
    }
    if (activeTab === 'potato') {
      return item.type === 'potato_reward' || item.type === 'potato_purchase';
    }
    if (activeTab === 'tier') {
      return item.type === 'tier_upgrade';
    }
    if (activeTab === 'system') {
      return item.type === 'system';
    }
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Lấy icon và màu sắc cho từng loại thông báo
  const getTypeBadge = (type: NotificationType) => {
    switch (type) {
      case 'gift_received':
        return {
          icon: <Gift size={18} color="#ec4899" />,
          bg: '#fdf2f8',
          label: lang === 'en' ? 'Received Gift' : 'Nhận sách',
          color: '#ec4899',
        };
      case 'gift_sent':
        return {
          icon: <BookOpen size={18} color="#8b5cf6" />,
          bg: '#f5f3ff',
          label: lang === 'en' ? 'Sent Gift' : 'Tặng sách',
          color: '#8b5cf6',
        };
      case 'potato_reward':
      case 'potato_purchase':
        return {
          icon: <Coins size={18} color="#d97706" />,
          bg: '#fffbeb',
          label: lang === 'en' ? 'Potatoes' : 'Khoai Tây',
          color: '#d97706',
        };
      case 'tier_upgrade':
        return {
          icon: <Crown size={18} color="#eab308" />,
          bg: '#fefce8',
          label: lang === 'en' ? 'Tier VIP' : 'Thăng hạng',
          color: '#ca8a04',
        };
      case 'system':
      default:
        return {
          icon: <Sparkles size={18} color="#2c3a7a" />,
          bg: '#eef2ff',
          label: lang === 'en' ? 'System' : 'Hệ thống',
          color: '#2c3a7a',
        };
    }
  };

  const renderItem = ({ item }: { item: AppNotification }) => {
    const badge = getTypeBadge(item.type);
    const isGiftReceived = item.type === 'gift_received';
    const isGiftSent = item.type === 'gift_sent';

    return (
      <TouchableOpacity
        style={[
          themeStyles.notifCard,
          !item.isRead && themeStyles.notifCardUnread,
        ]}
        activeOpacity={0.88}
        onPress={() => handleItemPress(item)}
      >
        {/* Icon đại diện */}
        <View style={[themeStyles.iconBox, { backgroundColor: badge.bg }]}>
          {badge.icon}
        </View>

        {/* Nội dung thông báo */}
        <View style={themeStyles.cardContent}>
          <View style={themeStyles.cardHeaderRow}>
            <View style={themeStyles.badgeWrap}>
              <Text style={[themeStyles.badgeText, { color: badge.color }]}>{badge.label}</Text>
            </View>
            <Text style={themeStyles.timeText}>{item.time}</Text>
            {!item.isRead && <View style={themeStyles.unreadDot} />}
          </View>

          <Text style={[themeStyles.titleText, !item.isRead && themeStyles.titleTextBold]}>
            {item.title}
          </Text>

          <Text style={themeStyles.messageText}>
            {item.message}
          </Text>

          {/* ============================================================================
              [GIẢI THÍCH CODE]: Nút "Chạm để xem lời nhắn" cho thông báo tặng/nhận sách
              Khi nhấn vào sẽ mở Modal hiển thị trọn vẹn lời nhắn gửi gắm
              ============================================================================ */}
          {isGiftReceived && (
            <TouchableOpacity
              style={themeStyles.actionHintRow}
              activeOpacity={0.75}
              onPress={() => handleOpenGiftMessage(item)}
            >
              <Mail size={13} color="#ec4899" style={{ marginRight: 5 }} />
              <Text style={[themeStyles.actionHintText, { color: '#ec4899' }]}>
                {lang === 'en' ? 'Tap to view message ✉️' : 'Chạm để xem lời nhắn ✉️'}
              </Text>
            </TouchableOpacity>
          )}

          {isGiftSent && (
            <TouchableOpacity
              style={themeStyles.actionHintRow}
              activeOpacity={0.75}
              onPress={() => handleOpenGiftMessage(item)}
            >
              <Mail size={13} color="#8b5cf6" style={{ marginRight: 5 }} />
              <Text style={[themeStyles.actionHintText, { color: '#8b5cf6' }]}>
                {lang === 'en' ? 'Tap to view sent message ✉️' : 'Chạm để xem lời nhắn đã gửi ✉️'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Nút xóa item */}
        <TouchableOpacity
          style={themeStyles.deleteItemBtn}
          activeOpacity={0.6}
          onPress={() => handleDeleteItem(item)}
        >
          <Trash2 size={16} color="#94a3b8" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={themeStyles.safeArea}>
      <ExpoStatusBar style={isDarkMode ? 'light' : 'dark'} />

      {/* 1. Header màn hình */}
      <View style={themeStyles.header}>
        <TouchableOpacity style={themeStyles.headerBackBtn} onPress={onBack} activeOpacity={0.7}>
          <ArrowLeft size={22} color="#1e293b" />
        </TouchableOpacity>

        <View style={themeStyles.headerTitleWrap}>
          <Text style={themeStyles.headerTitle}>
            {lang === 'en' ? 'Notifications' : 'Thông báo'}
          </Text>
          {unreadCount > 0 && (
            <View style={themeStyles.headerCountBadge}>
              <Text style={themeStyles.headerCountText}>{unreadCount}</Text>
            </View>
          )}
        </View>

        <View style={themeStyles.headerActions}>
          {unreadCount > 0 && (
            <TouchableOpacity
              style={themeStyles.headerIconBtn}
              onPress={handleMarkAllRead}
              activeOpacity={0.7}
              accessibilityLabel="Đọc tất cả"
            >
              <CheckCheck size={20} color="#2c3a7a" />
            </TouchableOpacity>
          )}
          {notifications.length > 0 && (
            <TouchableOpacity
              style={themeStyles.headerIconBtn}
              onPress={handleClearAll}
              activeOpacity={0.7}
              accessibilityLabel="Xóa tất cả"
            >
              <Trash2 size={19} color="#64748b" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 2. Thanh lọc chủ đề (Tabs) - Cho phép lướt ngang mượt mà */}
      <View style={themeStyles.tabsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={themeStyles.tabsScrollContent}
        >
          <TouchableOpacity
            style={[themeStyles.tabPill, activeTab === 'all' && themeStyles.tabPillActive]}
            onPress={() => setActiveTab('all')}
            activeOpacity={0.8}
          >
            <Text style={[themeStyles.tabPillText, activeTab === 'all' && themeStyles.tabPillTextActive]}>
              {lang === 'en' ? 'All' : 'Tất cả'} ({notifications.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[themeStyles.tabPill, activeTab === 'gift' && themeStyles.tabPillActive]}
            onPress={() => setActiveTab('gift')}
            activeOpacity={0.8}
          >
            <Text style={[themeStyles.tabPillText, activeTab === 'gift' && themeStyles.tabPillTextActive]}>
              🎁 {lang === 'en' ? 'Gifts' : 'Quà tặng'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[themeStyles.tabPill, activeTab === 'potato' && themeStyles.tabPillActive]}
            onPress={() => setActiveTab('potato')}
            activeOpacity={0.8}
          >
            <Text style={[themeStyles.tabPillText, activeTab === 'potato' && themeStyles.tabPillTextActive]}>
              🥔 {lang === 'en' ? 'Potatoes' : 'Khoai Tây'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[themeStyles.tabPill, activeTab === 'tier' && themeStyles.tabPillActive]}
            onPress={() => setActiveTab('tier')}
            activeOpacity={0.8}
          >
            <Text style={[themeStyles.tabPillText, activeTab === 'tier' && themeStyles.tabPillTextActive]}>
              👑 {lang === 'en' ? 'VIP Tiers' : 'Hạng VIP'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[themeStyles.tabPill, activeTab === 'system' && themeStyles.tabPillActive]}
            onPress={() => setActiveTab('system')}
            activeOpacity={0.8}
          >
            <Text style={[themeStyles.tabPillText, activeTab === 'system' && themeStyles.tabPillTextActive]}>
              📢 {lang === 'en' ? 'System' : 'Hệ thống'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* 3. Danh sách thông báo */}
      <FlatList
        data={filteredNotifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={themeStyles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={['#2c3a7a']} />
        }
        ListEmptyComponent={
          <View style={themeStyles.emptyContainer}>
            <View style={themeStyles.emptyIconBox}>
              <Bell size={40} color="#94a3b8" />
            </View>
            <Text style={themeStyles.emptyTitle}>
              {lang === 'en' ? 'No notifications yet' : 'Hộp thư thông báo đang trống'}
            </Text>
            <Text style={themeStyles.emptySubtitle}>
              {lang === 'en'
                ? 'Gift books, daily check-ins, and membership updates will appear here.'
                : 'Các thông báo quà tặng, nạp khoai, điểm danh và thăng hạng thành viên sẽ xuất hiện tại đây.'}
            </Text>
          </View>
        }
      />

      {/* ============================================================================
          [GIẢI THÍCH CODE]: POPUP MODAL HIỂN THỊ LỜI NHẮN TẶNG SÁCH
          Khi người dùng nhấn vào "Chạm để xem lời nhắn", modal này sẽ mở lên
          ============================================================================ */}
      <Modal
        visible={Boolean(activeGiftModal)}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setActiveGiftModal(null)}
      >
        <View style={themeStyles.modalBackdrop}>
          {/* Nhấn ra bên ngoài để đóng modal */}
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setActiveGiftModal(null)}
          />

          <View style={themeStyles.modalCard}>
            {/* Nút đóng góc trên */}
            <TouchableOpacity
              style={themeStyles.modalCloseBtn}
              onPress={() => setActiveGiftModal(null)}
              activeOpacity={0.7}
            >
              <X size={20} color="#64748b" />
            </TouchableOpacity>

            {/* Icon hộp quà xinh xắn */}
            <View style={themeStyles.modalGiftIconBox}>
              <Gift size={32} color="#ec4899" />
            </View>

            {/* Tiêu đề Modal */}
            <Text style={themeStyles.modalHeaderTitle}>
              {activeGiftModal?.isSent 
                ? (lang === 'en' ? 'Sent Gift Message' : 'Lời nhắn bạn đã gửi')
                : (lang === 'en' ? 'Gift Message from Friend' : `Lời nhắn từ ${activeGiftModal?.senderName}`)}
            </Text>

            {/* Tên sách được tặng */}
            <View style={themeStyles.modalBookPill}>
              <BookOpen size={14} color="#2c3a7a" style={{ marginRight: 6 }} />
              <Text style={themeStyles.modalBookTitle} numberOfLines={1}>
                {activeGiftModal?.bookTitle}
              </Text>
            </View>

            {/* Khung nội dung lời nhắn nằm chính giữa */}
            <View style={themeStyles.messageContentBox}>
              {activeGiftModal?.hasMessage ? (
                <>
                  <Quote size={20} color="#f472b6" style={{ marginBottom: 8, opacity: 0.7 }} />
                  <Text style={themeStyles.modalMessageText}>
                    "{activeGiftModal?.message}"
                  </Text>
                </>
              ) : (
                <Text style={themeStyles.modalEmptyMessageText}>
                  {activeGiftModal?.message}
                </Text>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 3,
    zIndex: 10,
  },
  headerBackBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginLeft: 14,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  headerCountBadge: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  headerCountText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Tabs lọc lướt ngang mượt mà
  tabsContainer: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  tabsScrollContent: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 9,
    alignItems: 'center',
  },
  tabPill: {
    paddingHorizontal: 14,
    paddingVertical: 7.5,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tabPillActive: {
    backgroundColor: '#2c3a7a',
    borderColor: '#2c3a7a',
  },
  tabPillText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#64748b',
  },
  tabPillTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },

  // Danh sách
  listContent: {
    padding: 16,
    paddingBottom: 30,
  },
  notifCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  notifCardUnread: {
    borderColor: '#c7d2fe',
    backgroundColor: '#fbfcfe',
    borderLeftWidth: 4,
    borderLeftColor: '#2c3a7a',
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardContent: {
    flex: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  badgeWrap: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  timeText: {
    fontSize: 11,
    color: '#94a3b8',
    marginLeft: 'auto',
    marginRight: 6,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2c3a7a',
  },
  titleText: {
    fontSize: 14.5,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 4,
  },
  titleTextBold: {
    fontWeight: '800',
    color: '#0f172a',
  },
  messageText: {
    fontSize: 13,
    lineHeight: 19,
    color: '#64748b',
  },
  actionHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#fdf2f8',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  actionHintText: {
    fontSize: 12,
    fontWeight: '700',
  },
  deleteItemBtn: {
    padding: 6,
    marginLeft: 6,
    alignSelf: 'flex-start',
  },

  // Trống
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 30,
  },
  emptyIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    lineHeight: 20,
    color: '#94a3b8',
    textAlign: 'center',
  },

  // Modal Xem lời nhắn
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 22,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 10,
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  modalGiftIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fdf2f8',
    borderWidth: 1.5,
    borderColor: '#fbcfe8',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 12,
  },
  modalHeaderTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalBookPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eef2ff',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    marginBottom: 14,
    maxWidth: '90%',
  },
  modalBookTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#2c3a7a',
  },
  messageContentBox: {
    width: '100%',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  modalMessageText: {
    fontSize: 14.5,
    lineHeight: 22,
    color: '#334155',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  modalEmptyMessageText: {
    fontSize: 14,
    color: '#94a3b8',
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
