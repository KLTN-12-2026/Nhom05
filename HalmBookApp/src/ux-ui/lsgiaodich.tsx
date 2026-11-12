import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { fetchApiWithFallback } from './apiService';
import { useAppNavigation, useAutoHideFooter } from './navigation';
import { getCurrentUsername } from './userStorage';

export type TransactionCategoryFilter = 'all' | 'topup' | 'rent' | 'reward' | 'transfer';
export type TimeRangeFilter = 'all' | 'today' | '7d' | '30d';

export interface BackendPotatoTransaction {
  transId?: number;
  id?: number | string;
  amount?: number;
  balanceAfter?: number;
  type?: string;
  description?: string;
  createdAt?: string | number[];
}

export interface TransactionItem {
  id: string;
  code: string;
  rawType: string;
  category: Exclude<TransactionCategoryFilter, 'all'>;
  amount: number;
  balanceAfter: number | null;
  description: string;
  createdAtIso: string;
  timestampMs: number;
  formattedTime: string;
  shortTime: string;
  isLocalOnly: boolean;
}

interface WalletSummary {
  potatoBalance: number;
  totalPotatoEarned: number;
  equivalentVnd: number;
  tierName?: string;
}

interface TransactionMetaStyle {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  bg: string;
}

interface TransactionDateGroup {
  key: string;
  title: string;
  items: TransactionItem[];
}

const COPY = {
  vi: {
    screenTitle: 'Lịch sử giao dịch',
    walletBalanceLabel: 'Số dư Ví Khoai',
    topUpQuickBtn: 'Nạp khoai',
    summaryIn: 'Tổng nhận',
    summaryOut: 'Đã chi',
    countSuffix: 'giao dịch',
    searchPlaceholder: 'Tìm nội dung, mã GD, ngày (YYYY-MM-DD)...',
    loadingText: 'Đang tải lịch sử giao dịch...',
    loginTitle: 'Đăng nhập để xem lịch sử giao dịch',
    loginDesc: 'Toàn bộ biến động số dư Khoai, đơn thuê sách và quà tặng sẽ được đồng bộ từ tài khoản của bạn.',
    loginBtn: 'Đăng nhập ngay',
    errorTitle: 'Không thể tải lịch sử giao dịch',
    retryBtn: 'Thử lại',
    emptyTitle: 'Chưa có giao dịch nào',
    emptyDesc: 'Khi bạn nạp Khoai, điểm danh, nhận thưởng hoặc thuê sách, mọi biến động sẽ hiển thị tại đây.',
    emptyFilterTitle: 'Không tìm thấy giao dịch',
    emptyFilterDesc: 'Thử đổi từ khóa hoặc chọn lại bộ lọc.',
    clearFilterBtn: 'Xóa bộ lọc',
    todayLabel: 'Hôm nay',
    yesterdayLabel: 'Hôm qua',
    otherDateLabel: 'Khác',
    khoaiUnit: 'Khoai',
    statusCompleted: 'Thành công',
    localBadge: 'Thiết bị',
    detailTitle: 'Chi tiết giao dịch',
    detailCode: 'Mã giao dịch',
    detailType: 'Phân loại',
    detailVndApprox: 'Quy đổi tham khảo',
    detailBalanceAfter: 'Số dư sau giao dịch',
    detailTime: 'Thời gian',
    detailSource: 'Nguồn ghi nhận',
    detailDesc: 'Nội dung',
    sourceServer: 'Sổ cái Ví Khoai HALM BOOK',
    sourceLocal: 'Lịch sử tặng sách trên thiết bị',
    closeBtn: 'Đóng',
    filters: {
      all: 'Tất cả',
      topup: 'Nạp Khoai',
      rent: 'Thuê & Chi',
      reward: 'Thưởng & Hoàn',
      transfer: 'Tặng / Nhận',
    },
    ranges: {
      all: 'Mọi lúc',
      today: 'Hôm nay',
      '7d': '7 ngày',
      '30d': '30 ngày',
    },
    types: {
      topup: 'Nạp Khoai',
      rent: 'Thuê / Gia hạn sách',
      giftBook: 'Tặng sách',
      transferOut: 'Tặng Khoai đi',
      transferIn: 'Nhận Khoai tặng',
      checkin: 'Điểm danh hằng ngày',
      tierUp: 'Thưởng thăng hạng',
      refund: 'Hoàn Khoai',
      reward: 'Phần thưởng',
      adminReward: 'Hệ thống cộng Khoai',
      adminDeduct: 'Điều chỉnh giảm',
      other: 'Giao dịch Ví Khoai',
    },
  },
  en: {
    screenTitle: 'Transaction History',
    walletBalanceLabel: 'Khoai Wallet Balance',
    topUpQuickBtn: 'Top Up',
    summaryIn: 'Received',
    summaryOut: 'Spent',
    countSuffix: 'transactions',
    searchPlaceholder: 'Search description, ID, date (YYYY-MM-DD)...',
    loadingText: 'Loading transaction history...',
    loginTitle: 'Sign in to view transactions',
    loginDesc: 'Your Khoai balance history, book rentals, and rewards are synced with your HALM BOOK account.',
    loginBtn: 'Sign In Now',
    errorTitle: 'Unable to load transactions',
    retryBtn: 'Retry',
    emptyTitle: 'No transactions yet',
    emptyDesc: 'Top-ups, check-in rewards, and book rentals will appear here once recorded.',
    emptyFilterTitle: 'No matching transactions',
    emptyFilterDesc: 'Try adjusting your search keywords or filters.',
    clearFilterBtn: 'Clear Filters',
    todayLabel: 'Today',
    yesterdayLabel: 'Yesterday',
    otherDateLabel: 'Other',
    khoaiUnit: 'Khoai',
    statusCompleted: 'Completed',
    localBadge: 'Device',
    detailTitle: 'Transaction Details',
    detailCode: 'Transaction ID',
    detailType: 'Category',
    detailVndApprox: 'Estimated Value',
    detailBalanceAfter: 'Balance After',
    detailTime: 'Time',
    detailSource: 'Source',
    detailDesc: 'Description',
    sourceServer: 'HALM BOOK Wallet Ledger',
    sourceLocal: 'On-device book gift log',
    closeBtn: 'Close',
    filters: {
      all: 'All',
      topup: 'Top-up',
      rent: 'Rent & Spend',
      reward: 'Rewards',
      transfer: 'Transfers',
    },
    ranges: {
      all: 'All time',
      today: 'Today',
      '7d': '7 days',
      '30d': '30 days',
    },
    types: {
      topup: 'Khoai Top-up',
      rent: 'Book Rental',
      giftBook: 'Book Gift',
      transferOut: 'Sent Khoai',
      transferIn: 'Received Khoai',
      checkin: 'Daily Check-in',
      tierUp: 'Tier Upgrade Reward',
      refund: 'Khoai Refund',
      reward: 'Reward',
      adminReward: 'System Credit',
      adminDeduct: 'System Adjustment',
      other: 'Wallet Transaction',
    },
  },
};

function parseDateMs(raw?: string | number[]): number {
  if (!raw) return 0;
  if (Array.isArray(raw)) {
    const [y, m = 1, d = 1, h = 0, min = 0, s = 0] = raw;
    if (!y) return 0;
    return new Date(y, m - 1, d, h, min, s).getTime();
  }
  const str = String(raw).trim();
  if (!str) return 0;
  // Normalize Java/Spring LocalDateTime fractional digits (>3) for Hermes Date.parse
  const trimmedFrac = str.replace(/(\.\d{3})\d+/, '$1');
  const parsed = Date.parse(trimmedFrac);
  if (!Number.isNaN(parsed)) return parsed;
  const match = trimmedFrac.match(/^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})(?::(\d{2}))?/);
  if (match) {
    return new Date(
      Number(match[1]),
      Number(match[2]) - 1,
      Number(match[3]),
      Number(match[4]),
      Number(match[5]),
      Number(match[6] || 0)
    ).getTime();
  }
  return 0;
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function formatDateTimeDisplay(raw?: string | number[]): string {
  const ms = parseDateMs(raw);
  if (!ms) return typeof raw === 'string' ? raw.slice(0, 16).replace('T', ' ') : '--';
  const d = new Date(ms);
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()} • ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function formatShortTime(raw?: string | number[]): string {
  const ms = parseDateMs(raw);
  if (!ms) return '--:--';
  const d = new Date(ms);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function formatDateKeyIso(raw?: string | number[]): string {
  const ms = parseDateMs(raw);
  if (!ms) return '';
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function getLocalDayKey(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function groupTransactionsByDate(items: TransactionItem[], t: typeof COPY.vi): TransactionDateGroup[] {
  const now = new Date();
  const todayKey = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
  const yesterdayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  const yesterdayKey = `${yesterdayDate.getFullYear()}-${pad2(yesterdayDate.getMonth() + 1)}-${pad2(yesterdayDate.getDate())}`;

  const groups: TransactionDateGroup[] = [];
  const indexByKey = new Map<string, number>();

  for (const tx of items) {
    let key = 'other';
    let title = t.otherDateLabel;
    if (tx.timestampMs > 0) {
      key = getLocalDayKey(tx.timestampMs);
      if (key === todayKey) {
        title = t.todayLabel;
      } else if (key === yesterdayKey) {
        title = t.yesterdayLabel;
      } else {
        const d = new Date(tx.timestampMs);
        title = `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
      }
    }

    const existingIdx = indexByKey.get(key);
    if (existingIdx !== undefined) {
      groups[existingIdx].items.push(tx);
    } else {
      indexByKey.set(key, groups.length);
      groups.push({ key, title, items: [tx] });
    }
  }

  return groups;
}

function extractTxCode(raw: BackendPotatoTransaction, fallbackIndex: number): string {
  const desc = raw.description || '';
  const embedded = desc.match(/HLM-\d+/i);
  if (embedded) return embedded[0].toUpperCase();
  if (typeof raw.transId === 'number' && raw.transId > 0) {
    return `TX-${String(raw.transId).padStart(5, '0')}`;
  }
  if (raw.id !== undefined && raw.id !== null) {
    const strId = String(raw.id);
    if (strId.startsWith('gift_tx_')) {
      return `GF-${strId.slice(-6)}`;
    }
    return `TX-${strId}`;
  }
  return `TX-${String(fallbackIndex + 1).padStart(5, '0')}`;
}

function resolveTransactionCategory(type: string, amount: number): Exclude<TransactionCategoryFilter, 'all'> {
  const upper = type.toUpperCase();
  if (upper.includes('TOPUP')) return 'topup';
  if (upper.includes('TRANSFER') || upper === 'GIFT_BOOK') return 'transfer';
  if (upper.includes('REWARD') || upper.includes('CHECKIN') || upper.includes('REFUND')) {
    return 'reward';
  }
  if (upper.includes('RENT') || upper.includes('RENEW') || upper.includes('DEDUCT')) {
    return 'rent';
  }
  return amount >= 0 ? 'reward' : 'rent';
}

function getTransactionMeta(
  rawType: string,
  description: string,
  amount: number,
  t: typeof COPY.vi,
  isDarkMode: boolean
): TransactionMetaStyle {
  const upper = rawType.toUpperCase();
  const descLower = description.toLowerCase();

  const positiveColors = {
    tint: isDarkMode ? '#34D399' : '#2F6B5F',
    bg: isDarkMode ? '#142E24' : '#EFF4F2',
  };
  const negativeColors = {
    tint: isDarkMode ? '#F87171' : '#DC2626',
    bg: isDarkMode ? '#331B1E' : '#FEF2F2',
  };
  const accentBlue = {
    tint: isDarkMode ? '#60A5FA' : '#1D4ED8',
    bg: isDarkMode ? '#17253D' : '#EFF6FF',
  };
  const accentAmber = {
    tint: isDarkMode ? '#FBBF24' : '#B45309',
    bg: isDarkMode ? '#2D2312' : '#FFFBEB',
  };

  if (upper.includes('TOPUP')) {
    return { label: t.types.topup, icon: 'wallet-outline', ...positiveColors };
  }
  if (upper === 'GIFT_BOOK') {
    return { label: t.types.giftBook, icon: 'gift-outline', ...negativeColors };
  }
  if (upper.includes('TRANSFER_OUT')) {
    return { label: t.types.transferOut, icon: 'paper-plane-outline', ...negativeColors };
  }
  if (upper.includes('TRANSFER_IN')) {
    return { label: t.types.transferIn, icon: 'gift-outline', ...positiveColors };
  }
  if (upper.includes('DAILY_CHECKIN')) {
    return { label: t.types.checkin, icon: 'calendar-outline', ...accentAmber };
  }
  if (upper.includes('TIER_UP')) {
    return { label: t.types.tierUp, icon: 'ribbon-outline', ...accentAmber };
  }
  if (upper.includes('ADMIN_REWARD')) {
    return { label: t.types.adminReward, icon: 'sparkles-outline', ...accentBlue };
  }
  if (upper.includes('ADMIN_DEDUCT')) {
    return { label: t.types.adminDeduct, icon: 'remove-circle-outline', ...negativeColors };
  }
  if (upper.includes('REWARD')) {
    if (descLower.includes('hoàn')) {
      return { label: t.types.refund, icon: 'refresh-circle-outline', ...accentBlue };
    }
    return { label: t.types.reward, icon: 'star-outline', ...accentAmber };
  }
  if (upper.includes('RENT') || upper.includes('RENEW')) {
    return { label: t.types.rent, icon: 'book-outline', ...negativeColors };
  }
  return {
    label: t.types.other,
    icon: amount >= 0 ? 'arrow-down-circle-outline' : 'arrow-up-circle-outline',
    ...(amount >= 0 ? positiveColors : negativeColors),
  };
}

function mapRawTransaction(
  raw: BackendPotatoTransaction,
  index: number,
  isLocalOnly: boolean
): TransactionItem {
  const rawType = (raw.type || 'OTHER').trim();
  const amount = typeof raw.amount === 'number' ? raw.amount : Number(raw.amount) || 0;
  const balanceAfter =
    typeof raw.balanceAfter === 'number' && !Number.isNaN(raw.balanceAfter)
      ? raw.balanceAfter
      : null;
  const ms = parseDateMs(raw.createdAt);
  const createdAtIso =
    typeof raw.createdAt === 'string'
      ? raw.createdAt
      : ms
        ? new Date(ms).toISOString()
        : '';
  const uniqueKey =
    raw.transId !== undefined
      ? `srv_${raw.transId}`
      : raw.id !== undefined
        ? `loc_${raw.id}`
        : `idx_${index}_${createdAtIso}`;

  return {
    id: uniqueKey,
    code: extractTxCode(raw, index),
    rawType,
    category: resolveTransactionCategory(rawType, amount),
    amount,
    balanceAfter,
    description: (raw.description || '').trim(),
    createdAtIso,
    timestampMs: ms,
    formattedTime: formatDateTimeDisplay(raw.createdAt),
    shortTime: formatShortTime(raw.createdAt),
    isLocalOnly,
  };
}

function isWithinTimeRange(timestampMs: number, range: TimeRangeFilter): boolean {
  if (range === 'all' || !timestampMs) return range === 'all';
  const now = new Date();
  if (range === 'today') {
    const d = new Date(timestampMs);
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  }
  const days = range === '7d' ? 7 : 30;
  return Date.now() - timestampMs <= days * 24 * 60 * 60 * 1000;
}

export default function HalmBookHistory() {
  const { navigate, goBack, isDarkMode, isLoggedIn, lang } = useAppNavigation();
  const { onScroll: handleFooterScroll } = useAutoHideFooter();
  const t = COPY[lang] || COPY.vi;

  const palette = useMemo(
    () => ({
      screenBg: isDarkMode ? '#101319' : '#F4F5F7',
      cardBg: isDarkMode ? '#1B1F28' : '#FFFFFF',
      subtleBg: isDarkMode ? '#232833' : '#F4F5F7',
      border: isDarkMode ? '#2E3440' : '#E5E7EB',
      divider: isDarkMode ? '#262C37' : '#F1F3F5',
      textPrimary: isDarkMode ? '#F5F1E8' : '#111827',
      textSecondary: isDarkMode ? '#A7ABB5' : '#6B7280',
      textMuted: isDarkMode ? '#7C8290' : '#9CA3AF',
      accent: isDarkMode ? '#34D399' : '#2F6B5F',
      accentSoftBg: isDarkMode ? '#1F2F2B' : '#EFF4F2',
      accentSoftBorder: isDarkMode ? '#2D4A43' : '#D1DFDA',
      positive: isDarkMode ? '#34D399' : '#2F6B5F',
      negative: isDarkMode ? '#F87171' : '#DC2626',
    }),
    [isDarkMode]
  );

  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [wallet, setWallet] = useState<WalletSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [loadError, setLoadError] = useState('');

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<TransactionCategoryFilter>('all');
  const [timeRange, setTimeRange] = useState<TimeRangeFilter>('all');
  const [rangePickerOpen, setRangePickerOpen] = useState(false);
  const [selectedDetailTx, setSelectedDetailTx] = useState<TransactionItem | null>(null);

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadTransactionData = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (mode === 'initial') setLoading(true);
    if (mode === 'refresh') setRefreshing(true);
    setLoadError('');

    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        if (!isMountedRef.current) return;
        setNeedsLogin(true);
        setTransactions([]);
        setWallet(null);
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };
      const currentUsername = await getCurrentUsername();

      const [txOutcome, walletOutcome, localRaw] = await Promise.all([
        fetchApiWithFallback<BackendPotatoTransaction[]>('/api/home/potato/transactions', {
          method: 'GET',
          headers,
          timeout: 8000,
        }).then(
          (res) => ({ ok: true as const, data: res.data }),
          (err) => ({ ok: false as const, err })
        ),
        fetchApiWithFallback<WalletSummary>('/api/home/potato/wallet', {
          method: 'GET',
          headers,
          timeout: 6000,
        })
          .then((res) => res.data)
          .catch(() => null),
        AsyncStorage.getItem(`@halm_potato_history_${currentUsername}`).catch(() => null),
      ]);

      if (!isMountedRef.current) return;

      if (!txOutcome.ok) {
        const status = txOutcome.err?.response?.status;
        if (status === 401 || status === 403) {
          setNeedsLogin(true);
          setTransactions([]);
          setWallet(null);
          return;
        }
        const respData = txOutcome.err?.response?.data;
        const serverMsg = respData?.message || respData?.error || txOutcome.err?.message || '';
        setLoadError(serverMsg || t.errorTitle);
        return;
      }

      setNeedsLogin(false);
      if (walletOutcome) {
        setWallet(walletOutcome);
      }

      const serverList = Array.isArray(txOutcome.data)
        ? txOutcome.data.map((item, idx) => mapRawTransaction(item, idx, false))
        : [];

      let localList: TransactionItem[] = [];
      if (localRaw) {
        try {
          const parsedLocal = JSON.parse(localRaw);
          if (Array.isArray(parsedLocal)) {
            localList = parsedLocal.map((item, idx) => mapRawTransaction(item, idx, true));
          }
        } catch {}
      }

      const merged = [...serverList];
      for (const localItem of localList) {
        const isDuplicate = serverList.some(
          (srv) =>
            srv.description === localItem.description &&
            srv.amount === localItem.amount &&
            Math.abs(srv.timestampMs - localItem.timestampMs) < 60000
        );
        if (!isDuplicate) {
          merged.push(localItem);
        }
      }

      merged.sort((a, b) => b.timestampMs - a.timestampMs);
      setTransactions(merged);
    } catch (err: any) {
      if (isMountedRef.current) {
        setLoadError(err?.message || t.errorTitle);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [t.errorTitle]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isMountedRef.current) {
        loadTransactionData('initial');
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [loadTransactionData, isLoggedIn]);

  const overviewStats = useMemo(() => {
    let totalIn = 0;
    let totalOut = 0;
    for (const tx of transactions) {
      if (tx.amount >= 0) totalIn += tx.amount;
      else totalOut += Math.abs(tx.amount);
    }
    const currentBalance =
      wallet && typeof wallet.potatoBalance === 'number'
        ? wallet.potatoBalance
        : transactions[0]?.balanceAfter ?? 0;

    return {
      totalIn,
      totalOut,
      currentBalance,
      equivalentVnd: wallet?.equivalentVnd ?? currentBalance * 1000,
    };
  }, [transactions, wallet]);

  const filteredTransactions = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return transactions.filter((tx) => {
      if (filterType !== 'all' && tx.category !== filterType) {
        return false;
      }
      if (!isWithinTimeRange(tx.timestampMs, timeRange)) {
        return false;
      }
      if (!query) return true;
      const meta = getTransactionMeta(tx.rawType, tx.description, tx.amount, t, isDarkMode);
      const isoDate = formatDateKeyIso(tx.createdAtIso);
      const searchable = [
        tx.code,
        tx.description,
        tx.rawType,
        meta.label,
        tx.formattedTime,
        isoDate,
        String(tx.amount),
      ]
        .join(' ')
        .toLowerCase();
      return searchable.includes(query);
    });
  }, [transactions, filterType, timeRange, searchTerm, t, isDarkMode]);

  const groupedSections = useMemo(
    () => groupTransactionsByDate(filteredTransactions, t),
    [filteredTransactions, t]
  );

  const hasActiveFilter = filterType !== 'all' || timeRange !== 'all' || searchTerm.trim().length > 0;

  const toggleSearch = () => {
    if (searchOpen) {
      setSearchTerm('');
      setSearchOpen(false);
    } else {
      setSearchOpen(true);
    }
  };

  const resetFilters = () => {
    setFilterType('all');
    setTimeRange('all');
    setSearchTerm('');
    setSearchOpen(false);
    setRangePickerOpen(false);
  };

  const selectedDetailMeta = selectedDetailTx
    ? getTransactionMeta(
        selectedDetailTx.rawType,
        selectedDetailTx.description,
        selectedDetailTx.amount,
        t,
        isDarkMode
      )
    : null;

  return (
    <View style={[styles.container, { backgroundColor: palette.screenBg }]}>
      <ExpoStatusBar style={isDarkMode ? 'light' : 'dark'} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={handleFooterScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadTransactionData('refresh')}
            colors={['#2F6B5F']}
            tintColor={palette.accent}
          />
        }
      >
        {/* Page Title Row (sits naturally beneath SharedHeader from App.tsx) */}
        <View style={styles.pageTitleBar}>
          <View style={styles.pageTitleLeft}>
            <TouchableOpacity
              onPress={goBack}
              style={[
                styles.circleIconBtn,
                { backgroundColor: palette.cardBg, borderColor: palette.border },
              ]}
              activeOpacity={0.75}
              accessibilityLabel={lang === 'en' ? 'Go back' : 'Quay lại'}
            >
              <Ionicons name="chevron-back" size={19} color={palette.textPrimary} />
            </TouchableOpacity>
            <Text style={[styles.pageTitleText, { color: palette.textPrimary }]} numberOfLines={1}>
              {t.screenTitle}
            </Text>
          </View>

          {!needsLogin ? (
            <View style={styles.pageTitleActions}>
              <TouchableOpacity
                onPress={toggleSearch}
                style={[
                  styles.circleIconBtn,
                  {
                    backgroundColor: searchOpen ? palette.accentSoftBg : palette.cardBg,
                    borderColor: searchOpen ? palette.accentSoftBorder : palette.border,
                  },
                ]}
                activeOpacity={0.75}
                accessibilityLabel={lang === 'en' ? 'Search' : 'Tìm kiếm'}
              >
                <Ionicons
                  name={searchOpen ? 'close-outline' : 'search-outline'}
                  size={18}
                  color={searchOpen ? palette.accent : palette.textPrimary}
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => loadTransactionData('refresh')}
                style={[
                  styles.circleIconBtn,
                  { backgroundColor: palette.cardBg, borderColor: palette.border },
                ]}
                activeOpacity={0.75}
                disabled={loading || refreshing}
                accessibilityLabel={lang === 'en' ? 'Refresh' : 'Làm mới'}
              >
                {refreshing ? (
                  <ActivityIndicator size="small" color={palette.accent} />
                ) : (
                  <Ionicons name="refresh-outline" size={18} color={palette.textPrimary} />
                )}
              </TouchableOpacity>
            </View>
          ) : null}
        </View>

        {/* Collapsible Search Input */}
        {!needsLogin && (searchOpen || searchTerm.length > 0) ? (
          <View
            style={[
              styles.searchBox,
              { backgroundColor: palette.cardBg, borderColor: palette.border },
            ]}
          >
            <Ionicons name="search-outline" size={16} color={palette.textMuted} />
            <TextInput
              autoFocus={searchOpen}
              style={[styles.searchInput, { color: palette.textPrimary }]}
              placeholder={t.searchPlaceholder}
              placeholderTextColor={palette.textMuted}
              value={searchTerm}
              onChangeText={setSearchTerm}
              autoCapitalize="none"
            />
            {searchTerm.length > 0 ? (
              <TouchableOpacity
                onPress={() => setSearchTerm('')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle" size={17} color={palette.textMuted} />
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}

        {needsLogin ? (
          <View
            style={[
              styles.stateCard,
              { backgroundColor: palette.cardBg, borderColor: palette.border },
            ]}
          >
            <View style={[styles.stateIconCircle, { backgroundColor: palette.accentSoftBg }]}>
              <Ionicons name="lock-closed-outline" size={26} color={palette.accent} />
            </View>
            <Text style={[styles.stateTitle, { color: palette.textPrimary }]}>{t.loginTitle}</Text>
            <Text style={[styles.stateDesc, { color: palette.textSecondary }]}>{t.loginDesc}</Text>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => navigate('auth')}
              activeOpacity={0.85}
            >
              <Ionicons name="log-in-outline" size={18} color="#FFFFFF" />
              <Text style={styles.primaryBtnText}>{t.loginBtn}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Wallet Card aligned with TrangCaNhan */}
            <View
              style={[
                styles.walletCard,
                { backgroundColor: palette.cardBg, borderColor: palette.border },
              ]}
            >
              <View style={styles.walletTopRow}>
                <View style={[styles.walletIconBox, { backgroundColor: palette.accentSoftBg }]}>
                  <Ionicons name="wallet-outline" size={21} color={palette.accent} />
                </View>

                <View style={styles.walletInfoCol}>
                  <Text style={[styles.walletLabel, { color: palette.textSecondary }]}>
                    {t.walletBalanceLabel}
                  </Text>
                  <View style={styles.walletBalanceRow}>
                    <Text style={[styles.walletBalanceNum, { color: palette.textPrimary }]}>
                      {overviewStats.currentBalance.toLocaleString('vi-VN')}
                    </Text>
                    <Text style={[styles.walletBalanceUnit, { color: palette.accent }]}>
                      {t.khoaiUnit}
                    </Text>
                  </View>
                  <Text style={[styles.walletSubText, { color: palette.textSecondary }]}>
                    ≈ {overviewStats.equivalentVnd.toLocaleString('vi-VN')} đ
                    {wallet?.tierName ? ` • ${wallet.tierName}` : ''}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.topUpBtn}
                  onPress={() => navigate('payment')}
                  activeOpacity={0.85}
                >
                  <Ionicons name="add" size={16} color="#FFFFFF" />
                  <Text style={styles.topUpBtnText}>{t.topUpQuickBtn}</Text>
                </TouchableOpacity>
              </View>

              <View style={[styles.walletFooterBar, { borderTopColor: palette.divider }]}>
                <View style={styles.walletFooterItem}>
                  <Text style={[styles.walletFooterLabel, { color: palette.textSecondary }]}>
                    {t.summaryIn}:
                  </Text>
                  <Text style={[styles.walletFooterValue, { color: palette.positive }]}>
                    +{overviewStats.totalIn.toLocaleString('vi-VN')} {t.khoaiUnit}
                  </Text>
                </View>

                <View style={styles.walletFooterItem}>
                  <Text style={[styles.walletFooterLabel, { color: palette.textSecondary }]}>
                    {t.summaryOut}:
                  </Text>
                  <Text style={[styles.walletFooterValue, { color: palette.negative }]}>
                    -{overviewStats.totalOut.toLocaleString('vi-VN')} {t.khoaiUnit}
                  </Text>
                </View>
              </View>
            </View>

            {/* Category Filter Chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.chipScroll}
              contentContainerStyle={styles.chipRowContent}
            >
              {(['all', 'topup', 'rent', 'reward', 'transfer'] as TransactionCategoryFilter[]).map(
                (key) => {
                  const active = filterType === key;
                  return (
                    <TouchableOpacity
                      key={key}
                      style={[
                        styles.filterChip,
                        {
                          backgroundColor: active ? palette.accentSoftBg : palette.cardBg,
                          borderColor: active ? palette.accentSoftBorder : palette.border,
                        },
                      ]}
                      onPress={() => setFilterType(key)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          { color: active ? palette.accent : palette.textSecondary },
                          active && styles.filterChipTextActive,
                        ]}
                      >
                        {t.filters[key]}
                      </Text>
                    </TouchableOpacity>
                  );
                }
              )}
            </ScrollView>

            {/* Count + Time Range Trigger */}
            <View style={styles.listMetaBar}>
              <Text style={[styles.listCountText, { color: palette.textSecondary }]}>
                {filteredTransactions.length} {t.countSuffix}
              </Text>

              <TouchableOpacity
                style={[
                  styles.rangeTriggerBtn,
                  {
                    backgroundColor: timeRange !== 'all' ? palette.accentSoftBg : palette.cardBg,
                    borderColor: timeRange !== 'all' ? palette.accentSoftBorder : palette.border,
                  },
                ]}
                onPress={() => setRangePickerOpen((prev) => !prev)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="calendar-outline"
                  size={13}
                  color={timeRange !== 'all' ? palette.accent : palette.textSecondary}
                />
                <Text
                  style={[
                    styles.rangeTriggerText,
                    { color: timeRange !== 'all' ? palette.accent : palette.textSecondary },
                    timeRange !== 'all' && styles.filterChipTextActive,
                  ]}
                >
                  {t.ranges[timeRange]}
                </Text>
                <Ionicons
                  name={rangePickerOpen ? 'chevron-up' : 'chevron-down'}
                  size={13}
                  color={timeRange !== 'all' ? palette.accent : palette.textSecondary}
                />
              </TouchableOpacity>
            </View>

            {rangePickerOpen ? (
              <View style={styles.rangeRow}>
                {(['all', 'today', '7d', '30d'] as TimeRangeFilter[]).map((rangeKey) => {
                  const active = timeRange === rangeKey;
                  return (
                    <TouchableOpacity
                      key={rangeKey}
                      style={[
                        styles.rangePill,
                        {
                          backgroundColor: active ? '#2F6B5F' : palette.cardBg,
                          borderColor: active ? '#2F6B5F' : palette.border,
                        },
                      ]}
                      onPress={() => {
                        setTimeRange(rangeKey);
                        setRangePickerOpen(false);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.rangePillText,
                          { color: active ? '#FFFFFF' : palette.textSecondary },
                          active && styles.filterChipTextActive,
                        ]}
                      >
                        {t.ranges[rangeKey]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : null}

            {/* States / Grouped History List */}
            {loading && transactions.length === 0 ? (
              <View style={styles.centerLoading}>
                <ActivityIndicator size="large" color={palette.accent} />
                <Text style={[styles.centerLoadingText, { color: palette.textSecondary }]}>
                  {t.loadingText}
                </Text>
              </View>
            ) : loadError ? (
              <View
                style={[
                  styles.stateCard,
                  { backgroundColor: palette.cardBg, borderColor: palette.border },
                ]}
              >
                <View
                  style={[
                    styles.stateIconCircle,
                    { backgroundColor: isDarkMode ? '#331B1E' : '#FEF2F2' },
                  ]}
                >
                  <Ionicons name="alert-circle-outline" size={26} color={palette.negative} />
                </View>
                <Text style={[styles.stateTitle, { color: palette.textPrimary }]}>
                  {t.errorTitle}
                </Text>
                <Text style={[styles.stateDesc, { color: palette.textSecondary }]}>{loadError}</Text>
                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={() => loadTransactionData('initial')}
                  activeOpacity={0.85}
                >
                  <Ionicons name="refresh-outline" size={17} color="#FFFFFF" />
                  <Text style={styles.primaryBtnText}>{t.retryBtn}</Text>
                </TouchableOpacity>
              </View>
            ) : groupedSections.length === 0 ? (
              <View
                style={[
                  styles.stateCard,
                  { backgroundColor: palette.cardBg, borderColor: palette.border },
                ]}
              >
                <View style={[styles.stateIconCircle, { backgroundColor: palette.subtleBg }]}>
                  <Ionicons name="receipt-outline" size={26} color={palette.accent} />
                </View>
                <Text style={[styles.stateTitle, { color: palette.textPrimary }]}>
                  {hasActiveFilter ? t.emptyFilterTitle : t.emptyTitle}
                </Text>
                <Text style={[styles.stateDesc, { color: palette.textSecondary }]}>
                  {hasActiveFilter ? t.emptyFilterDesc : t.emptyDesc}
                </Text>
                {hasActiveFilter ? (
                  <TouchableOpacity
                    style={[
                      styles.secondaryBtn,
                      { backgroundColor: palette.subtleBg, borderColor: palette.border },
                    ]}
                    onPress={resetFilters}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.secondaryBtnText, { color: palette.textPrimary }]}>
                      {t.clearFilterBtn}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.primaryBtn}
                    onPress={() => navigate('payment')}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="wallet-outline" size={17} color="#FFFFFF" />
                    <Text style={styles.primaryBtnText}>{t.topUpQuickBtn}</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View style={styles.sectionsWrap}>
                {groupedSections.map((section) => (
                  <View key={section.key}>
                    <Text style={[styles.dateGroupTitle, { color: palette.textSecondary }]}>
                      {section.title}
                    </Text>
                    <View
                      style={[
                        styles.groupCard,
                        { backgroundColor: palette.cardBg, borderColor: palette.border },
                      ]}
                    >
                      {section.items.map((tx, idx) => {
                        const meta = getTransactionMeta(
                          tx.rawType,
                          tx.description,
                          tx.amount,
                          t,
                          isDarkMode
                        );
                        const isPositive = tx.amount >= 0;
                        const amountStr = `${isPositive ? '+' : '-'}${Math.abs(tx.amount).toLocaleString('vi-VN')} ${t.khoaiUnit}`;

                        return (
                          <View key={tx.id}>
                            {idx > 0 ? (
                              <View
                                style={[styles.rowDivider, { backgroundColor: palette.divider }]}
                              />
                            ) : null}
                            <TouchableOpacity
                              style={styles.txRow}
                              onPress={() => setSelectedDetailTx(tx)}
                              activeOpacity={0.72}
                            >
                              <View style={[styles.txIconCircle, { backgroundColor: meta.bg }]}>
                                <Ionicons name={meta.icon} size={18} color={meta.tint} />
                              </View>

                              <View style={styles.txMiddleCol}>
                                <View style={styles.txTitleRow}>
                                  <Text
                                    style={[styles.txTypeLabel, { color: palette.textPrimary }]}
                                    numberOfLines={1}
                                  >
                                    {meta.label}
                                  </Text>
                                  {tx.isLocalOnly ? (
                                    <View
                                      style={[
                                        styles.localPill,
                                        { backgroundColor: palette.subtleBg },
                                      ]}
                                    >
                                      <Text
                                        style={[
                                          styles.localPillText,
                                          { color: palette.textSecondary },
                                        ]}
                                      >
                                        {t.localBadge}
                                      </Text>
                                    </View>
                                  ) : null}
                                </View>

                                {tx.description ? (
                                  <Text
                                    style={[styles.txDesc, { color: palette.textSecondary }]}
                                    numberOfLines={1}
                                  >
                                    {tx.description}
                                  </Text>
                                ) : null}
                              </View>

                              <View style={styles.txRightCol}>
                                <Text
                                  style={[
                                    styles.txAmount,
                                    { color: isPositive ? palette.positive : palette.negative },
                                  ]}
                                >
                                  {amountStr}
                                </Text>
                                <Text style={[styles.txTimeText, { color: palette.textMuted }]}>
                                  {tx.shortTime}
                                </Text>
                              </View>
                            </TouchableOpacity>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Transaction Detail Modal */}
      <Modal
        visible={Boolean(selectedDetailTx)}
        transparent
        statusBarTranslucent
        animationType="fade"
        onRequestClose={() => setSelectedDetailTx(null)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: palette.cardBg, borderColor: palette.border },
            ]}
          >
            <View style={[styles.modalHeader, { borderBottomColor: palette.divider }]}>
              <View style={styles.modalHeaderLeft}>
                {selectedDetailMeta ? (
                  <View
                    style={[
                      styles.txIconCircle,
                      { backgroundColor: selectedDetailMeta.bg, marginRight: 0 },
                    ]}
                  >
                    <Ionicons
                      name={selectedDetailMeta.icon}
                      size={18}
                      color={selectedDetailMeta.tint}
                    />
                  </View>
                ) : null}
                <View style={{ flex: 1 }}>
                  <Text style={[styles.modalTitle, { color: palette.textPrimary }]}>
                    {t.detailTitle}
                  </Text>
                  <Text style={[styles.modalSubtitle, { color: palette.textSecondary }]}>
                    #{selectedDetailTx?.code}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedDetailTx(null)}
                style={styles.modalCloseIconBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={20} color={palette.textSecondary} />
              </TouchableOpacity>
            </View>

            {selectedDetailTx && selectedDetailMeta ? (
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
                <View
                  style={[
                    styles.detailHeroBox,
                    { backgroundColor: palette.subtleBg, borderColor: palette.border },
                  ]}
                >
                  <Text
                    style={[
                      styles.detailHeroAmount,
                      {
                        color:
                          selectedDetailTx.amount >= 0 ? palette.positive : palette.negative,
                      },
                    ]}
                  >
                    {selectedDetailTx.amount >= 0 ? '+' : '-'}
                    {Math.abs(selectedDetailTx.amount).toLocaleString('vi-VN')} {t.khoaiUnit}
                  </Text>
                  <Text style={[styles.detailHeroSub, { color: palette.textSecondary }]}>
                    {t.detailVndApprox}:{' '}
                    {(Math.abs(selectedDetailTx.amount) * 1000).toLocaleString('vi-VN')} đ
                  </Text>
                  <View
                    style={[
                      styles.statusPill,
                      { backgroundColor: palette.accentSoftBg },
                    ]}
                  >
                    <Ionicons name="checkmark-circle" size={13} color={palette.positive} />
                    <Text style={[styles.statusPillText, { color: palette.positive }]}>
                      {t.statusCompleted}
                    </Text>
                  </View>
                </View>

                <View style={[styles.detailRow, { borderBottomColor: palette.divider }]}>
                  <Text style={[styles.detailLabel, { color: palette.textSecondary }]}>
                    {t.detailCode}
                  </Text>
                  <Text style={[styles.detailValue, { color: palette.textPrimary }]}>
                    #{selectedDetailTx.code}
                  </Text>
                </View>
                <View style={[styles.detailRow, { borderBottomColor: palette.divider }]}>
                  <Text style={[styles.detailLabel, { color: palette.textSecondary }]}>
                    {t.detailType}
                  </Text>
                  <Text style={[styles.detailValue, { color: palette.textPrimary }]}>
                    {selectedDetailMeta.label}
                  </Text>
                </View>
                <View style={[styles.detailRow, { borderBottomColor: palette.divider }]}>
                  <Text style={[styles.detailLabel, { color: palette.textSecondary }]}>
                    {t.detailTime}
                  </Text>
                  <Text style={[styles.detailValue, { color: palette.textPrimary }]}>
                    {selectedDetailTx.formattedTime}
                  </Text>
                </View>
                {selectedDetailTx.balanceAfter !== null ? (
                  <View style={[styles.detailRow, { borderBottomColor: palette.divider }]}>
                    <Text style={[styles.detailLabel, { color: palette.textSecondary }]}>
                      {t.detailBalanceAfter}
                    </Text>
                    <Text style={[styles.detailValue, { color: palette.textPrimary }]}>
                      {selectedDetailTx.balanceAfter.toLocaleString('vi-VN')} {t.khoaiUnit}
                    </Text>
                  </View>
                ) : null}
                <View style={[styles.detailRow, { borderBottomColor: palette.divider }]}>
                  <Text style={[styles.detailLabel, { color: palette.textSecondary }]}>
                    {t.detailSource}
                  </Text>
                  <Text style={[styles.detailValue, { color: palette.textPrimary }]}>
                    {selectedDetailTx.isLocalOnly ? t.sourceLocal : t.sourceServer}
                  </Text>
                </View>

                {selectedDetailTx.description ? (
                  <View
                    style={[
                      styles.detailDescBox,
                      { backgroundColor: palette.subtleBg, borderColor: palette.border },
                    ]}
                  >
                    <Text style={[styles.detailDescTitle, { color: palette.textSecondary }]}>
                      {t.detailDesc}
                    </Text>
                    <Text style={[styles.detailDescText, { color: palette.textPrimary }]}>
                      {selectedDetailTx.description}
                    </Text>
                  </View>
                ) : null}
              </ScrollView>
            ) : null}

            <TouchableOpacity
              style={[
                styles.modalCloseBtn,
                { backgroundColor: palette.subtleBg, borderColor: palette.border },
              ]}
              onPress={() => setSelectedDetailTx(null)}
              activeOpacity={0.85}
            >
              <Text style={[styles.secondaryBtnText, { color: palette.textPrimary }]}>
                {t.closeBtn}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 32 },

  pageTitleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  pageTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  pageTitleText: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
    flexShrink: 1,
  },
  pageTitleActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  circleIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
    marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 13.5, padding: 0 },

  walletCard: {
    borderRadius: 16,
    padding: 15,
    borderWidth: 1,
    marginBottom: 14,
  },
  walletTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  walletIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletInfoCol: { flex: 1 },
  walletLabel: { fontSize: 11.5, fontWeight: '600', marginBottom: 1 },
  walletBalanceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 5 },
  walletBalanceNum: { fontSize: 22, fontWeight: '800', letterSpacing: -0.4 },
  walletBalanceUnit: { fontSize: 13, fontWeight: '700' },
  walletSubText: { fontSize: 11.5, marginTop: 2, fontWeight: '500' },
  topUpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#2F6B5F',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
  },
  topUpBtnText: { color: '#FFFFFF', fontSize: 12.5, fontWeight: '600' },

  walletFooterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    gap: 12,
  },
  walletFooterItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  walletFooterLabel: { fontSize: 12, fontWeight: '500' },
  walletFooterValue: { fontSize: 12.5, fontWeight: '700' },

  chipScroll: { marginBottom: 12 },
  chipRowContent: { gap: 8, paddingRight: 8 },
  filterChip: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  filterChipText: { fontSize: 12.5, fontWeight: '600' },
  filterChipTextActive: { fontWeight: '700' },

  listMetaBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  listCountText: { fontSize: 12.5, fontWeight: '600' },
  rangeTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  rangeTriggerText: { fontSize: 12, fontWeight: '600' },

  rangeRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  rangePill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  rangePillText: { fontSize: 12, fontWeight: '600' },

  centerLoading: { paddingVertical: 52, alignItems: 'center', gap: 12 },
  centerLoadingText: { fontSize: 13.5 },

  stateCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    marginTop: 6,
  },
  stateIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  stateTitle: { fontSize: 16, fontWeight: '700', marginBottom: 6, textAlign: 'center' },
  stateDesc: { fontSize: 13.5, textAlign: 'center', lineHeight: 20, marginBottom: 18 },

  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: '#2F6B5F',
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 11,
  },
  primaryBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  secondaryBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 11,
  },
  secondaryBtnText: { fontSize: 13.5, fontWeight: '600' },

  sectionsWrap: { gap: 14 },
  dateGroupTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    marginBottom: 7,
    paddingHorizontal: 4,
  },
  groupCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  rowDivider: {
    height: 1,
    marginLeft: 62,
    marginRight: 14,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  txIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  txMiddleCol: { flex: 1, marginRight: 10 },
  txTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  txTypeLabel: { fontSize: 14.5, fontWeight: '600', flexShrink: 1 },
  localPill: { paddingHorizontal: 6, paddingVertical: 1.5, borderRadius: 5 },
  localPillText: { fontSize: 10, fontWeight: '600' },
  txDesc: { fontSize: 12, marginTop: 2 },
  txRightCol: { alignItems: 'flex-end' },
  txAmount: { fontSize: 14, fontWeight: '700' },
  txTimeText: { fontSize: 11, marginTop: 2, fontWeight: '500' },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.58)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },
  modalCard: {
    width: '100%',
    maxWidth: 410,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    marginBottom: 14,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  modalTitle: { fontSize: 16, fontWeight: '700' },
  modalSubtitle: { fontSize: 12, marginTop: 2, fontWeight: '600' },
  modalCloseIconBtn: { padding: 4 },

  detailHeroBox: {
    borderRadius: 13,
    padding: 14,
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1,
  },
  detailHeroAmount: { fontSize: 22, fontWeight: '800' },
  detailHeroSub: { fontSize: 12, marginTop: 4, fontWeight: '500' },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusPillText: { fontSize: 11.5, fontWeight: '700' },

  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 9,
    borderBottomWidth: 1,
    gap: 12,
  },
  detailLabel: { fontSize: 12.5, fontWeight: '500' },
  detailValue: { fontSize: 13, fontWeight: '600', textAlign: 'right', flex: 1 },

  detailDescBox: {
    borderRadius: 11,
    padding: 12,
    borderWidth: 1,
    marginTop: 12,
  },
  detailDescTitle: { fontSize: 12, fontWeight: '700', marginBottom: 4 },
  detailDescText: { fontSize: 13, lineHeight: 19 },

  modalCloseBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    paddingVertical: 12,
    borderRadius: 11,
    marginTop: 16,
  },
});
