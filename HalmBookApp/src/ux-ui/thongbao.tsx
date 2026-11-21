import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  FlatList,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppNavigation } from './navigation';
import { notificationDestination } from './notificationDestination';
import {
  AppNotification,
  clearAllNotifications,
  deleteNotification,
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  NotificationType,
  subscribeNotifications,
} from './notificationService';

interface TypeConfig {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  lightBg: string;
  darkBg: string;
  label: string;
  en: string;
}

const TYPE_CONFIGS: Record<NotificationType, TypeConfig> = {
  rent: {
    icon: 'book-outline',
    color: '#059669',
    lightBg: '#ECFDF5',
    darkBg: '#064E3B28',
    label: 'Thuê sách',
    en: 'Book Rental',
  },
  expiring: {
    icon: 'hourglass-outline',
    color: '#E11D48',
    lightBg: '#FFF1F2',
    darkBg: '#88133728',
    label: 'Sắp hết hạn',
    en: 'Expiring Soon',
  },
  potato_reward: {
    icon: 'sparkles-outline',
    color: '#D97706',
    lightBg: '#FFFBEB',
    darkBg: '#78350F28',
    label: 'Thưởng Khoai',
    en: 'Khoai Reward',
  },
  potato_purchase: {
    icon: 'wallet-outline',
    color: '#0284C7',
    lightBg: '#F0F9FF',
    darkBg: '#0C4A6E28',
    label: 'Nạp Khoai',
    en: 'Khoai Top-up',
  },
  gift_received: {
    icon: 'gift-outline',
    color: '#BE185D',
    lightBg: '#FDF2F8',
    darkBg: '#83184328',
    label: 'Nhận sách',
    en: 'Gift Received',
  },
  gift_sent: {
    icon: 'paper-plane-outline',
    color: '#7C3AED',
    lightBg: '#F5F3FF',
    darkBg: '#4C1D9528',
    label: 'Tặng sách',
    en: 'Gift Sent',
  },
  tier_upgrade: {
    icon: 'ribbon-outline',
    color: '#CA8A04',
    lightBg: '#FEFCE8',
    darkBg: '#713F1228',
    label: 'Thăng hạng',
    en: 'Membership',
  },
  system: {
    icon: 'notifications-outline',
    color: '#475569',
    lightBg: '#F8FAFC',
    darkBg: '#1E293B30',
    label: 'Hệ thống',
    en: 'System',
  },
};

type TabKey = 'all' | 'unread' | 'rent' | 'potato' | 'gift' | 'system';
type ConfirmTarget = { id: string; title: string } | 'all' | null;

function formatClockTime(timestamp: number): string {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

function getRelativeDateLabel(timestamp: number, isEn: boolean): string {
  const now = new Date();
  const date = new Date(timestamp);

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 86400000;
  const startOfWeek = startOfToday - 6 * 86400000;

  if (timestamp >= startOfToday) {
    return isEn ? 'Today' : 'Hôm nay';
  }
  if (timestamp >= startOfYesterday) {
    return isEn ? 'Yesterday' : 'Hôm qua';
  }
  if (timestamp >= startOfWeek) {
    return isEn ? 'This Week' : 'Tuần này';
  }
  return date.toLocaleDateString(isEn ? 'en-GB' : 'vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default function ThongBaoScreen({ onBack }: { onBack: () => void }) {
  const { navigate, isDarkMode, lang, isLoggedIn } = useAppNavigation();
  const en = lang === 'en';

  const [items, setItems] = useState<AppNotification[]>([]);
  const [tab, setTab] = useState<TabKey>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [detailItem, setDetailItem] = useState<AppNotification | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<ConfirmTarget>(null);

  const mounted = useRef(true);
  const loadVersion = useRef(0);

  // Palettes designed with reading app aesthetics
  const colors = useMemo(() => {
    if (isDarkMode) {
      return {
        bg: '#0F1216',
        card: '#181C23',
        cardBorder: '#262D38',
        cardHover: '#202530',
        text: '#F3EFEA',
        textMuted: '#9CA3AF',
        textDim: '#6B7280',
        brand: '#9E3240',
        brandLight: '#C04151',
        brandAccent: '#E0AA48',
        bannerBg: '#1A2320',
        bannerBorder: '#233830',
        bannerText: '#D1E7DD',
        badgeBg: '#222834',
        unreadDot: '#E0AA48',
        danger: '#EF4444',
      };
    }
    return {
      bg: '#F9F7F3', // Warm paper parchment
      card: '#FFFFFF',
      cardBorder: '#ECE5D9',
      cardHover: '#F7F4EE',
      text: '#221F1C', // Deep book ink
      textMuted: '#78716C', // Warm gray
      textDim: '#A8A29E',
      brand: '#822734', // Bookish burgundy
      brandLight: '#9B3342',
      brandAccent: '#B87B24',
      bannerBg: '#F3EDE2',
      bannerBorder: '#E5DAC8',
      bannerText: '#5A4E3E',
      badgeBg: '#F2ECE1',
      unreadDot: '#C28325',
      danger: '#DC2626',
    };
  }, [isDarkMode]);

  const loadData = useCallback(
    async (isManualRefresh = false) => {
      const currentTicket = ++loadVersion.current;
      if (isManualRefresh) {
        setRefreshing(true);
      }
      try {
        const result = await getNotifications();
        if (mounted.current && currentTicket === loadVersion.current) {
          setItems(result);
        }
      } catch {
        // Fallback gracefully
      } finally {
        if (mounted.current && currentTicket === loadVersion.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    mounted.current = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Subscribe to the persisted inbox and hydrate it once on mount.
    void loadData();

    const unsubscribe = subscribeNotifications(() => {
      void loadData();
    });

    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void loadData();
      }
    });
    const timer = setInterval(() => { if (AppState.currentState === 'active') void loadData(); }, 15000);

    return () => {
      mounted.current = false;
      unsubscribe();
      appStateSub.remove();
      clearInterval(timer);
    };
  }, [loadData]);

  // Read / Delete operations
  const handleOpenDetail = (item: AppNotification) => {
    setDetailItem(item);
    if (!item.isRead) {
      void markNotificationAsRead(item.id);
      setItems((prev) => prev.map((it) => (it.id === item.id ? { ...it, isRead: true } : it)));
    }
  };

  const handleMarkAllRead = async () => {
    if (busy) return;
    setBusy(true);
    try {
      setItems((prev) => prev.map((it) => ({ ...it, isRead: true })));
      await markAllNotificationsAsRead();
    } finally {
      setBusy(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!confirmTarget || busy) return;
    setBusy(true);
    const target = confirmTarget;
    setConfirmTarget(null);

    try {
      if (target === 'all') {
        setItems([]);
        await clearAllNotifications();
      } else {
        setItems((prev) => prev.filter((it) => it.id !== target.id));
        await deleteNotification(target.id);
      }
    } finally {
      setBusy(false);
    }
  };

  const handleNavigateRelated = () => {
    if (!detailItem) return;
    const { type, data, link } = detailItem;
    setDetailItem(null);

    const destination = notificationDestination(link);
    if (destination && destination !== 'genreBooks') {
      navigate(destination);
      return;
    }
    // If explicit backend link exists:
    if (link) {
      if (link.includes('wallet') || link.includes('potato')) {
        navigate('transactions');
        return;
      }
      if (link.includes('tusach') || link.includes('bookshelf')) {
        navigate('bookshelf');
        return;
      }
      if (link.includes('trangchu') || link.includes('home')) {
        navigate('home');
        return;
      }
    }

    // Type-based routing:
    if (type === 'expiring') {
      navigate('bookshelf', undefined, { initialBookshelfTab: 'dathue' });
    } else if (type === 'rent') {
      navigate('bookshelf', undefined, { initialBookshelfTab: 'dangthue' });
    } else if (type === 'gift_received' || type === 'gift_sent') {
      navigate('bookshelf', undefined, { initialBookshelfTab: 'duoctang' });
    } else if (type === 'potato_purchase' || type === 'potato_reward') {
      navigate('transactions');
    } else if (type === 'tier_upgrade') {
      navigate('profile');
    } else {
      if (data?.bookId) {
        navigate('bookshelf');
      } else {
        navigate('home');
      }
    }
  };

  // Filter & Counts
  const unreadCount = useMemo(() => items.filter((i) => !i.isRead).length, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (tab === 'unread') return !item.isRead;
      if (tab === 'rent') return item.type === 'rent' || item.type === 'expiring';
      if (tab === 'potato') return item.type === 'potato_reward' || item.type === 'potato_purchase' || item.type === 'tier_upgrade';
      if (tab === 'gift') return item.type === 'gift_received' || item.type === 'gift_sent';
      if (tab === 'system') return item.type === 'system';
      return true;
    });
  }, [items, tab]);

  // Tab definitions
  const tabs: Array<{ key: TabKey; label: string; icon: keyof typeof Ionicons.glyphMap; badge?: number }> = [
    { key: 'all', label: en ? 'All' : 'Tất cả', icon: 'layers-outline' },
    {
      key: 'unread',
      label: en ? 'Unread' : 'Chưa đọc',
      icon: 'sparkles-outline',
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    { key: 'rent', label: en ? 'Rentals' : 'Sách & Thuê', icon: 'book-outline' },
    { key: 'potato', label: en ? 'Khoai & Rewards' : 'Khoai & Thưởng', icon: 'wallet-outline' },
    { key: 'gift', label: en ? 'Gifts' : 'Quà tặng', icon: 'gift-outline' },
    { key: 'system', label: en ? 'System' : 'Hệ thống', icon: 'notifications-outline' },
  ];

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.container, { backgroundColor: colors.bg }]}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />

      {/* Top Header */}
      <View style={[styles.header, { borderBottomColor: colors.cardBorder }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={en ? 'Back' : 'Quay lại'}
          onPress={onBack}
          style={({ pressed }) => [
            styles.iconBtn,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
            pressed && { opacity: 0.7 },
          ]}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </Pressable>

        <View style={styles.headerTitleWrap}>
          <View style={styles.headerTitleRow}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>{en ? 'Notifications' : 'Hộp Thư Thông Báo'}</Text>
            {unreadCount > 0 && (
              <View style={[styles.headerBadge, { backgroundColor: colors.brandAccent }]}>
                <Text style={styles.headerBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>
          <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
            {en ? 'Reading milestones, book rentals & rewards' : 'Dấu ấn đọc sách, tủ sách thuê và ưu đãi'}
          </Text>
        </View>

        <View style={styles.headerActions}>
          <Pressable
            disabled={unreadCount === 0 || busy}
            accessibilityRole="button"
            accessibilityLabel={en ? 'Mark all as read' : 'Đánh dấu tất cả đã đọc'}
            onPress={handleMarkAllRead}
            style={({ pressed }) => [
              styles.iconBtn,
              {
                backgroundColor: colors.card,
                borderColor: colors.cardBorder,
                opacity: unreadCount > 0 ? (pressed ? 0.7 : 1) : 0.35,
              },
            ]}
          >
            <Ionicons name="checkmark-done-outline" size={19} color={colors.brandAccent} />
          </Pressable>

          <Pressable
            disabled={items.length === 0 || busy}
            accessibilityRole="button"
            accessibilityLabel={en ? 'Clear all notifications' : 'Xóa tất cả thông báo'}
            onPress={() => setConfirmTarget('all')}
            style={({ pressed }) => [
              styles.iconBtn,
              {
                backgroundColor: colors.card,
                borderColor: colors.cardBorder,
                opacity: items.length > 0 ? (pressed ? 0.7 : 1) : 0.35,
              },
            ]}
          >
            <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
          </Pressable>
        </View>
      </View>

      {/* Main Content Area */}
      <View style={styles.body}>
        {/* Literary Reading Banner */}
        <View style={[styles.readingBanner, { backgroundColor: colors.bannerBg, borderColor: colors.bannerBorder }]}>
          <View style={[styles.bannerIconWrap, { backgroundColor: colors.card }]}>
            <Ionicons name={unreadCount > 0 ? 'book' : 'bookmark'} size={24} color={colors.brandAccent} />
          </View>
          <View style={styles.bannerContent}>
            <Text style={[styles.bannerTitle, { color: colors.text }]}>
              {unreadCount > 0
                ? en
                  ? `You have ${unreadCount} new update${unreadCount > 1 ? 's' : ''}`
                  : `Bạn có ${unreadCount} thông báo mới đang chờ`
                : en
                  ? 'All caught up with your books!'
                  : 'Thư phòng đã được cập nhật đầy đủ'}
            </Text>
            <Text style={[styles.bannerSubtitle, { color: colors.bannerText }]}>
              {unreadCount > 0
                ? en
                  ? 'Check your book due dates, Khoai coins and special gifts.'
                  : 'Kiểm tra hạn đọc sách thuê, biến động Khoai và quà tặng từ bạn bè.'
                : en
                  ? 'Every page turned is a new journey. Enjoy your reading time.'
                  : 'Mỗi cuốn sách mở ra một chân trời mới. Chúc bạn có những phút giây đọc an yên.'}
            </Text>
          </View>
        </View>

        {/* Tab Filter Pills */}
        <View style={styles.tabsContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsScrollContent}
          >
            {tabs.map((t) => {
              const active = tab === t.key;
              return (
                <Pressable
                  key={t.key}
                  onPress={() => setTab(t.key)}
                  style={({ pressed }) => [
                    styles.tabPill,
                    {
                      backgroundColor: active ? colors.brand : colors.card,
                      borderColor: active ? colors.brand : colors.cardBorder,
                    },
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  <Ionicons
                    name={t.icon}
                    size={14}
                    color={active ? '#FFFFFF' : colors.textMuted}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.tabPillText,
                      { color: active ? '#FFFFFF' : colors.text, fontWeight: active ? '700' : '500' },
                    ]}
                  >
                    {t.label}
                  </Text>
                  {t.badge !== undefined && (
                    <View
                      style={[
                        styles.tabBadge,
                        { backgroundColor: active ? 'rgba(255,255,255,0.25)' : colors.brandAccent },
                      ]}
                    >
                      <Text style={[styles.tabBadgeText, { color: '#FFFFFF' }]}>{t.badge}</Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Notification List */}
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void loadData(true)}
              tintColor={colors.brandAccent}
              colors={[colors.brandAccent]}
            />
          }
          renderItem={({ item, index }) => {
            const cfg = TYPE_CONFIGS[item.type] || TYPE_CONFIGS.system;
            const dateLabel = getRelativeDateLabel(item.timestamp, en);
            const prevItem = filteredItems[index - 1];
            const isFirstOfGroup = !prevItem || getRelativeDateLabel(prevItem.timestamp, en) !== dateLabel;

            return (
              <View>
                {/* Date Group Header */}
                {isFirstOfGroup && (
                  <View style={styles.dateHeaderRow}>
                    <View style={[styles.dateHeaderLine, { backgroundColor: colors.cardBorder }]} />
                    <View style={[styles.dateHeaderPill, { backgroundColor: colors.badgeBg }]}>
                      <Ionicons name="calendar-outline" size={11} color={colors.textMuted} style={{ marginRight: 4 }} />
                      <Text style={[styles.dateHeaderText, { color: colors.textMuted }]}>{dateLabel}</Text>
                    </View>
                    <View style={[styles.dateHeaderLine, { backgroundColor: colors.cardBorder }]} />
                  </View>
                )}

                {/* Card Item */}
                <Pressable
                  onPress={() => handleOpenDetail(item)}
                  style={({ pressed }) => [
                    styles.notificationCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: !item.isRead ? colors.brandAccent + '70' : colors.cardBorder,
                      borderLeftColor: !item.isRead ? colors.brandAccent : colors.cardBorder,
                      borderLeftWidth: !item.isRead ? 4 : 1,
                    },
                    pressed && { backgroundColor: colors.cardHover },
                  ]}
                >
                  {/* Left Icon Pill */}
                  <View
                    style={[
                      styles.cardIconWrap,
                      { backgroundColor: isDarkMode ? cfg.darkBg : cfg.lightBg },
                    ]}
                  >
                    <Ionicons name={cfg.icon} size={22} color={cfg.color} />
                  </View>

                  {/* Middle Content */}
                  <View style={styles.cardContent}>
                    <View style={styles.cardHeaderRow}>
                      <View style={styles.cardTagRow}>
                        <Text style={[styles.cardTag, { color: cfg.color }]}>
                          {en ? cfg.en : cfg.label}
                        </Text>
                        <Text style={[styles.cardDotSeparator, { color: colors.textDim }]}>•</Text>
                        <Text style={[styles.cardTime, { color: colors.textDim }]}>
                          {formatClockTime(item.timestamp)}
                        </Text>
                      </View>

                      {!item.isRead && (
                        <View style={[styles.unreadDot, { backgroundColor: colors.unreadDot }]} />
                      )}
                    </View>

                    <Text
                      numberOfLines={1}
                      style={[
                        styles.cardTitle,
                        {
                          color: colors.text,
                          fontWeight: item.isRead ? '600' : '800',
                        },
                      ]}
                    >
                      {item.title}
                    </Text>

                    <Text
                      numberOfLines={2}
                      style={[styles.cardMessage, { color: colors.textMuted }]}
                    >
                      {item.message}
                    </Text>

                    {/* Book / Action indication */}
                    {(item.data?.bookTitle || item.link) && (
                      <View style={styles.cardActionHintRow}>
                        <Ionicons name="arrow-forward-circle-outline" size={13} color={colors.brandLight} />
                        <Text style={[styles.cardActionHintText, { color: colors.brandLight }]}>
                          {item.data?.bookTitle
                            ? `Sách: ${item.data.bookTitle}`
                            : en
                              ? 'Tap to view details'
                              : 'Nhấn để xem chi tiết'}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Right Delete Mini Button */}
                  <Pressable
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={en ? 'Delete' : 'Xóa'}
                    onPress={(e) => {
                      e.stopPropagation();
                      setConfirmTarget({ id: item.id, title: item.title });
                    }}
                    style={({ pressed }) => [styles.deleteMiniBtn, pressed && { opacity: 0.6 }]}
                  >
                    <Ionicons name="close" size={17} color={colors.textDim} />
                  </Pressable>
                </Pressable>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              {loading ? (
                <View style={styles.loadingWrap}>
                  <ActivityIndicator size="large" color={colors.brandAccent} />
                  <Text style={[styles.emptySubtitle, { color: colors.textMuted, marginTop: 12 }]}>
                    {en ? 'Loading notifications…' : 'Đang tải thông báo từ Thư phòng…'}
                  </Text>
                </View>
              ) : (
                <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                  <View style={[styles.emptyIconCircle, { backgroundColor: colors.badgeBg }]}>
                    <Ionicons
                      name={tab === 'unread' ? 'checkmark-circle-outline' : 'book-outline'}
                      size={44}
                      color={colors.brandAccent}
                    />
                  </View>
                  <Text style={[styles.emptyTitle, { color: colors.text }]}>
                    {!isLoggedIn
                      ? en
                        ? 'Sign in to see your updates'
                        : 'Đăng nhập để xem thông báo'
                      : tab === 'unread'
                        ? en
                          ? 'You are all caught up!'
                          : 'Bạn đã đọc hết mọi tin mới!'
                        : en
                          ? 'No notifications found'
                          : 'Hộp thư chưa có thông báo nào'}
                  </Text>
                  <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                    {!isLoggedIn
                      ? en
                        ? 'Connect your account to track reading rentals, Khoai rewards, and gifts.'
                        : 'Đăng nhập để theo dõi tủ sách thuê cá nhân, nhận Khoai thưởng và quà tặng từ bạn bè.'
                      : tab === 'unread'
                        ? en
                          ? 'Great job keeping up with your reading room.'
                          : 'Thư phòng của bạn đang rất ngăn nắp và cập nhật.'
                        : en
                          ? 'Upcoming rentals, book returns, and rewards will be shown here.'
                          : 'Khi có biến động về sách thuê, nạp Khoai hay nhiệm vụ mới, thông báo sẽ hiển thị ở đây.'}
                  </Text>

                  {!isLoggedIn && (
                    <Pressable
                      onPress={() => navigate('auth')}
                      style={[styles.primaryActionBtn, { backgroundColor: colors.brand }]}
                    >
                      <Ionicons name="log-in-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={styles.primaryActionBtnText}>{en ? 'Sign in now' : 'Đăng nhập ngay'}</Text>
                    </Pressable>
                  )}

                  {isLoggedIn && tab !== 'all' && (
                    <Pressable
                      onPress={() => setTab('all')}
                      style={[styles.secondaryActionBtn, { borderColor: colors.cardBorder }]}
                    >
                      <Text style={[styles.secondaryActionBtnText, { color: colors.text }]}>
                        {en ? 'View all notifications' : 'Xem tất cả thông báo'}
                      </Text>
                    </Pressable>
                  )}
                </View>
              )}
            </View>
          }
        />
      </View>

      {/* DETAIL MODAL (Reading App Sheet) */}
      <Modal
        visible={Boolean(detailItem)}
        transparent
        animationType="fade"
        onRequestClose={() => setDetailItem(null)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setDetailItem(null)} />
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            {detailItem && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
                {/* Modal Top Bar */}
                <View style={styles.modalHeaderRow}>
                  {(() => {
                    const cfg = TYPE_CONFIGS[detailItem.type] || TYPE_CONFIGS.system;
                    return (
                      <View style={[styles.modalBadge, { backgroundColor: isDarkMode ? cfg.darkBg : cfg.lightBg }]}>
                        <Ionicons name={cfg.icon} size={16} color={cfg.color} style={{ marginRight: 6 }} />
                        <Text style={[styles.modalBadgeText, { color: cfg.color }]}>
                          {en ? cfg.en : cfg.label}
                        </Text>
                      </View>
                    );
                  })()}

                  <Pressable
                    onPress={() => setDetailItem(null)}
                    hitSlop={10}
                    style={[styles.modalCloseBtn, { backgroundColor: colors.badgeBg }]}
                  >
                    <Ionicons name="close" size={18} color={colors.text} />
                  </Pressable>
                </View>

                {/* Title & Time */}
                <Text style={[styles.modalTitle, { color: colors.text }]}>{detailItem.title}</Text>
                <View style={styles.modalTimeRow}>
                  <Ionicons name="time-outline" size={13} color={colors.textDim} style={{ marginRight: 4 }} />
                  <Text style={[styles.modalTime, { color: colors.textDim }]}>
                    {detailItem.time || new Date(detailItem.timestamp).toLocaleString(en ? 'en-GB' : 'vi-VN')}
                  </Text>
                </View>

                <View style={[styles.modalDivider, { backgroundColor: colors.cardBorder }]} />

                {/* Message Body */}
                <Text selectable style={[styles.modalBodyText, { color: colors.text }]}>
                  {detailItem.message}
                </Text>

                {/* Gift Message Quote Box */}
                {detailItem.data?.giftMessage && (
                  <View style={[styles.giftQuoteBox, { backgroundColor: colors.bannerBg, borderColor: colors.bannerBorder }]}>
                    <View style={styles.giftQuoteHeader}>
                      <Ionicons name="heart" size={15} color="#BE185D" style={{ marginRight: 6 }} />
                      <Text style={[styles.giftQuoteTitle, { color: colors.text }]}>
                        {detailItem.data.senderName
                          ? `${detailItem.data.senderName} gửi tặng bạn:`
                          : en
                            ? 'Gift Note:'
                            : 'Lời nhắn tặng:'}
                      </Text>
                    </View>
                    <Text selectable style={[styles.giftQuoteText, { color: colors.bannerText }]}>
                      “{detailItem.data.giftMessage}”
                    </Text>
                  </View>
                )}

                {/* Action Buttons */}
                <View style={styles.modalActionsWrap}>
                  {(detailItem.link || detailItem.type !== 'system') && <Pressable
                    onPress={handleNavigateRelated}
                    style={[styles.primaryActionBtn, { backgroundColor: colors.brand, flex: 1 }]}
                  >
                    <Ionicons
                      name={
                        detailItem.type === 'rent' || detailItem.type === 'expiring'
                          ? 'book-outline'
                          : detailItem.type.startsWith('potato')
                            ? 'wallet-outline'
                            : detailItem.type.startsWith('gift')
                              ? 'gift-outline'
                              : 'arrow-forward-outline'
                      }
                      size={18}
                      color="#FFFFFF"
                      style={{ marginRight: 6 }}
                    />
                    <Text style={styles.primaryActionBtnText}>
                      {detailItem.type === 'rent' || detailItem.type === 'expiring'
                        ? en
                          ? 'Open Bookshelf'
                          : 'Vào Tủ sách đọc ngay'
                        : detailItem.type.startsWith('potato')
                          ? en
                            ? 'View Wallet History'
                            : 'Xem Ví & Giao dịch'
                          : detailItem.type.startsWith('gift')
                            ? en
                              ? 'Open Gifted Books'
                              : 'Xem sách được tặng'
                            : en
                              ? 'Open related content'
                              : 'Mở nội dung liên quan'}
                    </Text>
                  </Pressable>}

                  <Pressable
                    onPress={() => setDetailItem(null)}
                    style={[styles.secondaryActionBtn, { borderColor: colors.cardBorder }]}
                  >
                    <Text style={[styles.secondaryActionBtnText, { color: colors.textMuted }]}>
                      {en ? 'Close' : 'Đóng'}
                    </Text>
                  </Pressable>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* CONFIRMATION MODAL */}
      <Modal
        visible={Boolean(confirmTarget)}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmTarget(null)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setConfirmTarget(null)} />
          <View style={[styles.confirmCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={[styles.confirmIconWrap, { backgroundColor: colors.danger + '18' }]}>
              <Ionicons name="trash-outline" size={26} color={colors.danger} />
            </View>

            <Text style={[styles.confirmTitle, { color: colors.text }]}>
              {confirmTarget === 'all'
                ? en
                  ? 'Clear All Notifications?'
                  : 'Xóa toàn bộ thông báo?'
                : en
                  ? 'Delete Notification?'
                  : 'Xóa thông báo này?'}
            </Text>

            <Text style={[styles.confirmMessage, { color: colors.textMuted }]}>
              {confirmTarget === 'all'
                ? en
                  ? 'All notifications will be permanently removed from your device. This cannot be undone.'
                  : 'Tất cả thông báo trong hộp thư sẽ bị xóa. Bạn không thể hoàn tác thao tác này.'
                : confirmTarget && typeof confirmTarget === 'object'
                  ? `“${confirmTarget.title}”`
                  : ''}
            </Text>

            <View style={styles.confirmActionsRow}>
              <Pressable
                onPress={() => setConfirmTarget(null)}
                style={[styles.confirmCancelBtn, { borderColor: colors.cardBorder }]}
              >
                <Text style={[styles.confirmCancelText, { color: colors.text }]}>{en ? 'Cancel' : 'Hủy'}</Text>
              </Pressable>

              <Pressable
                onPress={handleConfirmDelete}
                style={[styles.confirmDeleteBtn, { backgroundColor: colors.danger }]}
              >
                <Text style={styles.confirmDeleteText}>{busy ? (en ? 'Deleting…' : 'Đang xóa…') : en ? 'Delete' : 'Xóa'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    maxWidth: 900,
    width: '100%',
    alignSelf: 'center',
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  headerTitleWrap: {
    flex: 1,
    marginHorizontal: 12,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  headerBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  body: {
    flex: 1,
    width: '100%',
    maxWidth: 900,
    alignSelf: 'center',
  },
  readingBanner: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 6,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    gap: 12,
  },
  bannerIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4 },
      android: { elevation: 2 },
    }),
  },
  bannerContent: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  bannerSubtitle: {
    fontSize: 11,
    lineHeight: 16,
  },
  tabsContainer: {
    paddingVertical: 10,
  },
  tabsScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  tabPillText: {
    fontSize: 12,
  },
  tabBadge: {
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  dateHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 10,
  },
  dateHeaderLine: {
    flex: 1,
    height: 1,
  },
  dateHeaderPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    marginHorizontal: 10,
  },
  dateHeaderText: {
    fontSize: 11,
    fontWeight: '600',
  },
  notificationCard: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    padding: 13,
    marginBottom: 10,
    alignItems: 'flex-start',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3 },
      android: { elevation: 1 },
    }),
  },
  cardIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
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
  cardTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTag: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  cardDotSeparator: {
    marginHorizontal: 6,
    fontSize: 10,
  },
  cardTime: {
    fontSize: 11,
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  cardTitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 3,
  },
  cardMessage: {
    fontSize: 12,
    lineHeight: 18,
  },
  cardActionHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  cardActionHintText: {
    fontSize: 11,
    fontWeight: '600',
  },
  deleteMiniBtn: {
    padding: 4,
    marginLeft: 6,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingWrap: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    textAlign: 'center',
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 12,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 20,
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  primaryActionBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  secondaryActionBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
  },
  secondaryActionBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '82%',
    borderRadius: 22,
    borderWidth: 1,
    padding: 20,
  },
  modalScroll: {
    gap: 12,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  modalBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 25,
    marginTop: 4,
  },
  modalTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTime: {
    fontSize: 11,
  },
  modalDivider: {
    height: 1,
    marginVertical: 4,
  },
  modalBodyText: {
    fontSize: 14,
    lineHeight: 22,
  },
  giftQuoteBox: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 4,
  },
  giftQuoteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  giftQuoteTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  giftQuoteText: {
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  modalActionsWrap: {
    marginTop: 14,
    gap: 8,
  },
  confirmCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 20,
    borderWidth: 1,
    padding: 22,
    alignItems: 'center',
  },
  confirmIconWrap: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  confirmTitle: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  confirmMessage: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  confirmActionsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  confirmCancelBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmCancelText: {
    fontSize: 13,
    fontWeight: '600',
  },
  confirmDeleteBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmDeleteText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
