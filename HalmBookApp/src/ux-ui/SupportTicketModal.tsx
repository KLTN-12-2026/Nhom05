import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { fetchApiWithFallback } from './apiService';
import { useAppNavigation, useAppThemeStyles } from './navigation';
import { getUserItem, setUserItem } from './userStorage';

export interface SupportChatEntry {
  sender: string;
  senderName?: string;
  content: string;
  avatar?: string;
  time?: string;
}

export interface SupportTicketItem {
  id: number;
  code: string;
  category: string;
  priority: string;
  subject: string;
  message: string;
  userAvatar?: string;
  status: string;
  adminReply?: string;
  chatHistory?: SupportChatEntry[];
  replyAt?: string;
  createdAt?: string;
  _optimistic?: boolean;
}

interface SupportTicketModalProps {
  visible: boolean;
  onClose: () => void;
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAvatar?: string;
  lang?: 'vi' | 'en';
}

const KEY_SUPPORT_CODES = '@halm_support_ticket_codes_v1';
const POLL_INTERVAL_MS = 3500;

const CATEGORIES = [
  { id: 'PAYMENT', icon: 'wallet-outline' as const, labelVi: 'Nạp Khoai / Thanh toán', labelEn: 'Payment & Khoai' },
  { id: 'READING', icon: 'book-outline' as const, labelVi: 'Lỗi đọc / Sách', labelEn: 'Reading & Books' },
  { id: 'ACCOUNT', icon: 'shield-checkmark-outline' as const, labelVi: 'Tài khoản', labelEn: 'Account' },
  { id: 'OTHER', icon: 'chatbox-ellipses-outline' as const, labelVi: 'Góp ý & Khác', labelEn: 'Feedback & Other' },
];

const PRIORITIES = [
  { id: 'NORMAL', labelVi: 'Bình thường', labelEn: 'Normal' },
  { id: 'HIGH', labelVi: 'Ưu tiên cao', labelEn: 'High' },
  { id: 'URGENT', labelVi: 'Khẩn cấp', labelEn: 'Urgent' },
];

const COPY = {
  vi: {
    modalTitle: 'Nhắn tin hỗ trợ',
    tabList: 'Hội thoại',
    tabCreate: 'Gửi yêu cầu mới',
    loadingText: 'Đang tải danh sách hội thoại...',
    emptyTitle: 'Chưa có cuộc trò chuyện nào',
    emptyDesc: 'Gửi yêu cầu khiếu nại hoặc nhắn tin trực tiếp với Quản trị viên để được hỗ trợ nhanh nhất.',
    emptyBtn: 'Tạo tin nhắn hỗ trợ mới',
    openThread: 'Mở trò chuyện trực tiếp',
    msgUnit: 'tin',
    justNow: 'Vừa xong',
    syncingQueue: 'Đang đồng bộ yêu cầu vào hệ thống, bạn chờ 1–2 giây nhé...',
    adminWaiting: 'Đang chờ Ban Quản Trị phản hồi...',
    adminReplyLabel: 'Ban Quản Trị:',
    contactHeading: 'Thông tin liên hệ',
    nameLabel: 'Họ tên',
    namePlaceholder: 'Nhập họ tên của bạn',
    emailLabel: 'Email',
    emailPlaceholder: 'email@example.com',
    phoneLabel: 'Số điện thoại',
    phonePlaceholder: '09xx xxx xxx',
    categoryLabel: 'Phân loại vấn đề *',
    priorityLabel: 'Mức độ ưu tiên',
    subjectLabel: 'Tiêu đề yêu cầu *',
    subjectPlaceholder: 'VD: Đã chuyển khoản nạp Khoai nhưng chưa nhận được...',
    messageLabel: 'Nội dung chi tiết *',
    messagePlaceholder: 'Mô tả rõ sự cố (mã giao dịch, tên sách, thời điểm bị lỗi...)',
    submitBtn: 'Gửi tin nhắn hỗ trợ',
    submittingBtn: 'Đang gửi yêu cầu...',
    errSubjectEmpty: 'Vui lòng nhập tiêu đề yêu cầu hỗ trợ.',
    errMessageEmpty: 'Vui lòng nhập nội dung chi tiết cần hỗ trợ.',
    errSubmitFailed: 'Không thể gửi yêu cầu lúc này. Vui lòng thử lại sau.',
    errSendReplyFailed: 'Không thể gửi tin nhắn phản hồi. Vui lòng thử lại.',
    msgSubmitSuccessTitle: 'Đã gửi yêu cầu',
    msgSubmitSuccessDefault: 'Yêu cầu của bạn đã được tiếp nhận. Ban Quản Trị sẽ phản hồi sớm nhất!',
    msgWaitSync: 'Yêu cầu vừa tạo đang được lưu từ hàng đợi (1–2 giây). Vui lòng thử gửi lại ngay sau đó.',
    composerPlaceholder: 'Nhập tin nhắn gửi Quản trị viên...',
    adminDisplayName: 'Ban Quản Trị HALMBOOK',
    readerDisplayName: 'Độc giả',
    statusPending: 'Chờ xử lý',
    statusInProgress: 'Đang xử lý',
    statusResolved: 'Đã giải quyết',
    statusClosed: 'Đã đóng',
    alertErrorTitle: 'Lỗi',
    alertNoticeTitle: 'Thông báo',
  },
  en: {
    modalTitle: 'Support Messages',
    tabList: 'Conversations',
    tabCreate: 'New Request',
    loadingText: 'Loading support conversations...',
    emptyTitle: 'No support conversations yet',
    emptyDesc: 'Send a report or message our support team directly to get help quickly.',
    emptyBtn: 'Start a New Support Message',
    openThread: 'Open 2-way chat',
    msgUnit: 'msgs',
    justNow: 'Just now',
    syncingQueue: 'Syncing new request with the server queue (1–2s)...',
    adminWaiting: 'Waiting for Admin reply...',
    adminReplyLabel: 'Admin reply:',
    contactHeading: 'Contact details',
    nameLabel: 'Full name',
    namePlaceholder: 'Your name',
    emailLabel: 'Email',
    emailPlaceholder: 'email@example.com',
    phoneLabel: 'Phone',
    phonePlaceholder: 'Phone number',
    categoryLabel: 'Category *',
    priorityLabel: 'Priority',
    subjectLabel: 'Subject *',
    subjectPlaceholder: 'e.g. Top-up completed but Khoai balance not updated...',
    messageLabel: 'Details *',
    messagePlaceholder: 'Describe your issue in detail (transaction code, book title, time...)',
    submitBtn: 'Send Support Message',
    submittingBtn: 'Sending request...',
    errSubjectEmpty: 'Please enter a subject for your request.',
    errMessageEmpty: 'Please enter detailed message content.',
    errSubmitFailed: 'Unable to submit support request right now. Please try again.',
    errSendReplyFailed: 'Unable to send reply message. Please try again.',
    msgSubmitSuccessTitle: 'Request Submitted',
    msgSubmitSuccessDefault: 'Your support request has been received. Admin will reply shortly!',
    msgWaitSync: 'Your new ticket is finishing queue sync (1–2s). Please send again in a moment.',
    composerPlaceholder: 'Write a message to Admin...',
    adminDisplayName: 'HALMBOOK Admin',
    readerDisplayName: 'Reader',
    statusPending: 'Pending',
    statusInProgress: 'In Progress',
    statusResolved: 'Resolved',
    statusClosed: 'Closed',
    alertErrorTitle: 'Error',
    alertNoticeTitle: 'Notice',
  },
};

function getStatusBadge(status: string, t: typeof COPY.vi, isDarkMode: boolean) {
  const norm = (status || 'pending').toLowerCase();
  if (norm === 'resolved') {
    return {
      label: t.statusResolved,
      bg: isDarkMode ? '#142E24' : '#ECFDF5',
      border: isDarkMode ? '#1F513D' : '#A7F3D0',
      text: isDarkMode ? '#34D399' : '#047857',
    };
  }
  if (norm === 'in_progress') {
    return {
      label: t.statusInProgress,
      bg: isDarkMode ? '#17253D' : '#EFF6FF',
      border: isDarkMode ? '#1E40AF' : '#BFDBFE',
      text: isDarkMode ? '#60A5FA' : '#1D4ED8',
    };
  }
  if (norm === 'closed') {
    return {
      label: t.statusClosed,
      bg: isDarkMode ? '#272B36' : '#F3F4F6',
      border: isDarkMode ? '#3B4150' : '#D1D5DB',
      text: isDarkMode ? '#9CA3AF' : '#4B5563',
    };
  }
  return {
    label: t.statusPending,
    bg: isDarkMode ? '#2D2312' : '#FFFBEB',
    border: isDarkMode ? '#6B4E16' : '#FDE68A',
    text: isDarkMode ? '#FBBF24' : '#B45309',
  };
}

function getCategoryLabel(categoryId: string, lang: 'vi' | 'en'): string {
  const found = CATEGORIES.find((c) => c.id === categoryId);
  if (found) return lang === 'en' ? found.labelEn : found.labelVi;
  return categoryId || 'OTHER';
}

function buildThreadMessages(
  ticket: SupportTicketItem,
  fallbackReaderName: string,
  t: typeof COPY.vi
): SupportChatEntry[] {
  if (Array.isArray(ticket.chatHistory) && ticket.chatHistory.length > 0) {
    return ticket.chatHistory;
  }
  const items: SupportChatEntry[] = [];
  if (ticket.message && ticket.message.trim()) {
    items.push({
      sender: 'USER',
      senderName: fallbackReaderName || t.readerDisplayName,
      content: ticket.message.trim(),
      time: ticket.createdAt || '',
    });
  }
  if (ticket.adminReply && ticket.adminReply.trim()) {
    items.push({
      sender: 'ADMIN',
      senderName: t.adminDisplayName,
      content: ticket.adminReply.trim(),
      time: ticket.replyAt || '',
    });
  }
  return items;
}

async function loadSavedCodes(): Promise<string[]> {
  try {
    const raw = await getUserItem(KEY_SUPPORT_CODES);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function persistTicketCode(code: string): Promise<void> {
  if (!code) return;
  try {
    const existing = await loadSavedCodes();
    const updated = [code, ...existing.filter((c) => c !== code)].slice(0, 50);
    await setUserItem(KEY_SUPPORT_CODES, JSON.stringify(updated));
  } catch {}
}

async function buildAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  try {
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  } catch {}
  return headers;
}

interface TicketCreatePayload {
  senderName: string;
  senderEmail: string;
  senderPhone: string;
  customerId?: string;
  category: string;
  priority: string;
  subject: string;
  message: string;
}

interface TicketCreateOutcome {
  ticketCode?: string;
  code?: string;
  ticketId?: number;
  message?: string;
  viaDirectFallback: boolean;
}

/**
 * Gửi yêu cầu hỗ trợ qua RabbitMQ (/api/user/support-tickets).
 * Nếu RabbitMQ Broker chưa chạy (500 / Connection refused), tự động fallback sang
 * endpoint công khai /api/admin/support-tickets/create lưu trực tiếp MySQL (không sửa BE).
 */
async function submitTicketWithFallback(
  payload: TicketCreatePayload,
  headers: Record<string, string>
): Promise<TicketCreateOutcome> {
  try {
    const res = await fetchApiWithFallback<{
      success?: boolean;
      message?: string;
      ticketCode?: string;
    }>('/api/user/support-tickets', {
      method: 'POST',
      headers,
      data: payload,
      timeout: 12000,
    });
    return { ...res.data, viaDirectFallback: false };
  } catch (primaryErr: any) {
    const status = primaryErr?.response?.status;
    const serverMsg = String(primaryErr?.response?.data?.message || '');
    const isQueueUnavailable =
      Boolean(primaryErr?.response) &&
      ((typeof status === 'number' && status >= 500) ||
        /rabbitmq|connection refused|amqp|connectexception/i.test(serverMsg));

    if (!isQueueUnavailable) {
      throw primaryErr;
    }

    const directPayload: Record<string, string> = {
      senderName: payload.senderName,
      senderEmail: payload.senderEmail,
      senderPhone: payload.senderPhone,
      category: payload.category,
      priority: payload.priority,
      subject: payload.subject,
      message: payload.message,
    };
    if (payload.customerId) {
      directPayload.customerId = payload.customerId;
    }

    const fallbackRes = await fetchApiWithFallback<{
      success?: boolean;
      message?: string;
      ticketId?: number;
      code?: string;
    }>('/api/admin/support-tickets/create', {
      method: 'POST',
      headers,
      data: directPayload,
      timeout: 12000,
    });
    return { ...fallbackRes.data, viaDirectFallback: true };
  }
}

/**
 * Modal Nhắn tin Hỗ trợ & Khiếu nại 2 chiều trực tiếp giữa Độc giả và Ban Quản Trị.
 * Kết nối với backend có sẵn tại /api/user/support-tickets (RabbitMQ + chatHistory).
 */
export default function SupportTicketModal({
  visible,
  onClose,
  customerId = '',
  customerName = '',
  customerEmail = '',
  customerPhone = '',
  customerAvatar = '',
  lang = 'vi',
}: SupportTicketModalProps) {
  const themeStyles = useAppThemeStyles(styles);
  const { isDarkMode } = useAppNavigation();
  const t = COPY[lang] || COPY.vi;

  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');
  const [tickets, setTickets] = useState<SupportTicketItem[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicketItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Form tạo yêu cầu mới
  const [senderName, setSenderName] = useState(customerName);
  const [senderEmail, setSenderEmail] = useState(customerEmail);
  const [senderPhone, setSenderPhone] = useState(customerPhone);
  const [category, setCategory] = useState('PAYMENT');
  const [priority, setPriority] = useState('NORMAL');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Khung chat 2 chiều
  const [replyInput, setReplyInput] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const threadListRef = useRef<FlatList<SupportChatEntry>>(null);
  const isMountedRef = useRef(true);
  const senderEmailRef = useRef(customerEmail);
  const syncedAccountKeyRef = useRef('');
  const queueReloadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (queueReloadTimerRef.current) {
        clearTimeout(queueReloadTimerRef.current);
      }
    };
  }, []);

  const syncContactWithProps = useCallback(() => {
    const accountKey = `${customerId}::${customerEmail}::${customerName}::${customerPhone}`;
    if (syncedAccountKeyRef.current && syncedAccountKeyRef.current !== accountKey) {
      const [prevId, prevEmail] = syncedAccountKeyRef.current.split('::');
      if (prevId !== customerId || prevEmail !== customerEmail) {
        setTickets([]);
        setSelectedTicket(null);
      }
    }
    if (syncedAccountKeyRef.current !== accountKey) {
      syncedAccountKeyRef.current = accountKey;
      setSenderName(customerName);
      setSenderEmail(customerEmail);
      senderEmailRef.current = customerEmail;
      setSenderPhone(customerPhone);
    }
  }, [customerId, customerName, customerEmail, customerPhone]);

  const fetchMyTickets = useCallback(
    async (mode: 'initial' | 'refresh' | 'silent' = 'silent'): Promise<SupportTicketItem[]> => {
      if (mode === 'initial') setLoading(true);
      if (mode === 'refresh') setRefreshing(true);

      try {
        const [savedCodes, headers] = await Promise.all([loadSavedCodes(), buildAuthHeaders()]);
        const emailVal = (senderEmailRef.current || customerEmail || '').trim();

        const queryParams: Record<string, string> = {};
        if (emailVal) queryParams.email = emailVal;
        if (savedCodes.length > 0) queryParams.codes = savedCodes.join(',');

        const res = await fetchApiWithFallback<SupportTicketItem[]>('/api/user/support-tickets/my-tickets', {
          method: 'GET',
          headers,
          params: queryParams,
          timeout: mode === 'silent' ? 5000 : 8000,
        });

        const serverList = Array.isArray(res.data) ? res.data : [];
        if (!isMountedRef.current) return serverList;

        const serverCodes = new Set(serverList.map((item) => item.code));
        setTickets((prev) => {
          const pendingOptimistic = prev.filter((item) => item._optimistic && !serverCodes.has(item.code));
          return [...pendingOptimistic, ...serverList];
        });

        setSelectedTicket((prevSelected) => {
          if (!prevSelected) return null;
          const fresh = serverList.find(
            (item) => String(item.id) === String(prevSelected.id) || (item.code && item.code === prevSelected.code)
          );
          return fresh || prevSelected;
        });

        return serverList;
      } catch (err: any) {
        if (mode !== 'silent') {
          console.warn('Lỗi tải danh sách tin nhắn hỗ trợ:', err?.message || err);
        }
        return [];
      } finally {
        if (isMountedRef.current) {
          if (mode === 'initial') setLoading(false);
          if (mode === 'refresh') setRefreshing(false);
        }
      }
    },
    [customerEmail]
  );

  // Tải danh sách & polling tự động chỉ khi Modal đang mở
  useEffect(() => {
    if (!visible) {
      return;
    }

    const kickoffTimer = setTimeout(() => {
      if (!isMountedRef.current) return;
      syncContactWithProps();
      fetchMyTickets('initial');
    }, 0);

    const intervalId = setInterval(() => {
      fetchMyTickets('silent');
    }, POLL_INTERVAL_MS);

    return () => {
      clearTimeout(kickoffTimer);
      clearInterval(intervalId);
    };
  }, [visible, fetchMyTickets, syncContactWithProps]);

  const threadMessages = useMemo(() => {
    if (!selectedTicket) return [];
    return buildThreadMessages(selectedTicket, senderName || customerName, t);
  }, [selectedTicket, senderName, customerName, t]);

  useEffect(() => {
    if (!selectedTicket || threadMessages.length === 0) return;
    const timer = setTimeout(() => {
      threadListRef.current?.scrollToEnd({ animated: true });
    }, 100);
    return () => clearTimeout(timer);
  }, [selectedTicket?.code, threadMessages.length]);

  const handleBackAction = () => {
    if (selectedTicket) {
      setSelectedTicket(null);
      return;
    }
    setFormError('');
    onClose();
  };

  const handleSubmitTicket = async () => {
    if (!subject.trim()) {
      setFormError(t.errSubjectEmpty);
      return;
    }
    if (!message.trim()) {
      setFormError(t.errMessageEmpty);
      return;
    }

    try {
      setSubmitting(true);
      setFormError('');
      const [headers, storedCustId] = await Promise.all([
        buildAuthHeaders(),
        AsyncStorage.getItem('@halm_current_customer_id').catch(() => null),
      ]);
      const rawCustomerId = (customerId || storedCustId || '').trim();
      const effectiveCustomerId =
        rawCustomerId && rawCustomerId !== 'Chưa cập nhật' ? rawCustomerId : '';

      const effectiveName = (senderName || customerName || t.readerDisplayName).trim();
      const payload: TicketCreatePayload = {
        senderName: effectiveName,
        senderEmail: (senderEmail || customerEmail || '').trim(),
        senderPhone: (senderPhone || customerPhone || '').trim(),
        ...(effectiveCustomerId ? { customerId: effectiveCustomerId } : {}),
        category,
        priority,
        subject: subject.trim(),
        message: message.trim(),
      };

      const result = await submitTicketWithFallback(payload, headers);
      const createdCode = result.ticketCode || result.code || `TK-${10000 + (Date.now() % 90000)}`;
      const createdId =
        typeof result.ticketId === 'number' && result.ticketId > 0 ? result.ticketId : -Date.now();
      const isOptimistic = !result.viaDirectFallback && createdId <= 0;

      await persistTicketCode(createdCode);

      const newTicketItem: SupportTicketItem = {
        id: createdId,
        code: createdCode,
        category: payload.category,
        priority: payload.priority,
        subject: payload.subject,
        message: payload.message,
        userAvatar: customerAvatar,
        status: 'pending',
        adminReply: '',
        chatHistory: [
          {
            sender: 'USER',
            senderName: effectiveName,
            content: payload.message,
            avatar: customerAvatar,
            time: t.justNow,
          },
        ],
        createdAt: t.justNow,
        _optimistic: isOptimistic,
      };

      setTickets((prev) => [newTicketItem, ...prev.filter((item) => item.code !== createdCode)]);
      setSubject('');
      setMessage('');
      setActiveTab('list');
      setSelectedTicket(newTicketItem);

      Alert.alert(t.msgSubmitSuccessTitle, result.message || t.msgSubmitSuccessDefault);

      if (queueReloadTimerRef.current) {
        clearTimeout(queueReloadTimerRef.current);
      }
      queueReloadTimerRef.current = setTimeout(() => {
        fetchMyTickets('silent');
      }, result.viaDirectFallback ? 300 : 1500);
    } catch (err: any) {
      const serverMsg = err?.response?.data?.message;
      setFormError(
        typeof serverMsg === 'string' && serverMsg.trim() ? serverMsg.trim() : t.errSubmitFailed
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendThreadReply = async () => {
    const content = replyInput.trim();
    if (!selectedTicket || !content || sendingReply) return;

    setSendingReply(true);
    try {
      let targetTicket = selectedTicket;
      // Nếu ticket vừa gửi qua RabbitMQ và còn ID tạm âm, nạp nhanh danh sách từ DB để lấy ticketId thật
      if (targetTicket._optimistic || targetTicket.id <= 0) {
        const freshList = await fetchMyTickets('silent');
        const matched = freshList.find((item) => item.code === targetTicket.code && item.id > 0);
        if (!matched) {
          Alert.alert(t.alertNoticeTitle, t.msgWaitSync);
          return;
        }
        targetTicket = matched;
      }

      const senderDisplay = (senderName || customerName || t.readerDisplayName).trim();
      const headers = await buildAuthHeaders();
      const res = await fetchApiWithFallback<{
        success?: boolean;
        chatHistory?: SupportChatEntry[];
      }>(`/api/user/support-tickets/${targetTicket.id}/message`, {
        method: 'POST',
        headers,
        data: { message: content, senderName: senderDisplay },
        timeout: 10000,
      });

      const updatedHistory: SupportChatEntry[] = Array.isArray(res.data?.chatHistory)
        ? res.data.chatHistory
        : [
            ...buildThreadMessages(targetTicket, senderDisplay, t),
            { sender: 'USER', senderName: senderDisplay, content, time: t.justNow },
          ];

      const updatedTicket: SupportTicketItem = {
        ...targetTicket,
        status: 'pending',
        chatHistory: updatedHistory,
        _optimistic: false,
      };

      setReplyInput('');
      setSelectedTicket(updatedTicket);
      setTickets((prev) =>
        prev.map((item) =>
          item.code === updatedTicket.code || item.id === updatedTicket.id ? updatedTicket : item
        )
      );
    } catch (err: any) {
      const serverMsg = err?.response?.data?.message;
      Alert.alert(
        t.alertErrorTitle,
        typeof serverMsg === 'string' && serverMsg.trim() ? serverMsg.trim() : t.errSendReplyFailed
      );
    } finally {
      setSendingReply(false);
    }
  };

  const renderMessageBubble = ({ item }: { item: SupportChatEntry }) => {
    const isAdmin = (item.sender || '').toUpperCase() === 'ADMIN';
    const displayName = item.senderName || (isAdmin ? t.adminDisplayName : senderName || customerName || t.readerDisplayName);
    const avatarUri = item.avatar || (!isAdmin ? customerAvatar : '');

    if (isAdmin) {
      return (
        <View style={[themeStyles.msgRow, themeStyles.msgRowLeft]}>
          <View style={themeStyles.adminAvatarCircle}>
            <Ionicons name="shield-checkmark" size={16} color="#FFFFFF" />
          </View>
          <View style={themeStyles.msgContentColLeft}>
            <View style={themeStyles.msgMetaRow}>
              <Text style={[themeStyles.adminMetaName, { color: isDarkMode ? '#60A5FA' : '#1D4ED8' }]}>
                {displayName}
              </Text>
              {item.time ? <Text style={themeStyles.msgTimeText}>{item.time}</Text> : null}
            </View>
            <View style={themeStyles.adminBubble}>
              <Text style={themeStyles.adminBubbleText}>{(item.content || '').trim()}</Text>
            </View>
          </View>
        </View>
      );
    }

    return (
      <View style={[themeStyles.msgRow, themeStyles.msgRowRight]}>
        <View style={themeStyles.msgContentColRight}>
          <View style={[themeStyles.msgMetaRow, { justifyContent: 'flex-end' }]}>
            {item.time ? <Text style={themeStyles.msgTimeText}>{item.time}</Text> : null}
            <Text style={themeStyles.userMetaName}>{displayName}</Text>
          </View>
          <View style={themeStyles.userBubble}>
            <Text style={[themeStyles.userBubbleText, { color: '#FFFFFF' }]}>
              {(item.content || '').trim()}
            </Text>
          </View>
        </View>
        {avatarUri ? (
          <Image source={{ uri: avatarUri }} style={themeStyles.userAvatarImg} />
        ) : (
          <View style={themeStyles.userAvatarCircle}>
            <Text style={[themeStyles.userAvatarLetter, { color: '#FFFFFF' }]}>
              {displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const accentColor = isDarkMode ? '#34D399' : '#2F6B5F';

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleBackAction}>
      <View style={themeStyles.container}>
        <ExpoStatusBar style={isDarkMode ? 'light' : 'dark'} />

        {/* Header */}
        <View style={themeStyles.header}>
          <TouchableOpacity onPress={handleBackAction} style={themeStyles.headerBtn} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={24} color={isDarkMode ? '#E4E6EB' : '#111827'} />
          </TouchableOpacity>
          <View style={themeStyles.headerTitleWrap}>
            <Text style={themeStyles.headerTitle} numberOfLines={1}>
              {selectedTicket ? `#${selectedTicket.code}` : t.modalTitle}
            </Text>
            {selectedTicket ? (
              <View style={themeStyles.syncBadgeInline}>
                <View style={themeStyles.syncDot} />
                <Text style={[themeStyles.syncBadgeText, { color: accentColor }]}>Auto-Sync</Text>
              </View>
            ) : null}
          </View>
          <TouchableOpacity
            onPress={() => fetchMyTickets('refresh')}
            style={themeStyles.headerBtn}
            activeOpacity={0.7}
            disabled={loading || refreshing}
          >
            {refreshing ? (
              <ActivityIndicator size="small" color={accentColor} />
            ) : (
              <Ionicons name="refresh-outline" size={21} color={isDarkMode ? '#E4E6EB' : '#111827'} />
            )}
          </TouchableOpacity>
        </View>

        {selectedTicket ? (
          /* ===================== CHI TIẾT HỘI THOẠI 2 CHIỀU ===================== */
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            {(() => {
              const badge = getStatusBadge(selectedTicket.status, t, isDarkMode);
              return (
                <View style={themeStyles.threadSubHeader}>
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={themeStyles.threadSubject} numberOfLines={1}>
                      {selectedTicket.subject}
                    </Text>
                    <Text style={themeStyles.threadCategory} numberOfLines={1}>
                      {getCategoryLabel(selectedTicket.category, lang)}
                    </Text>
                  </View>
                  <View
                    style={[
                      themeStyles.statusPill,
                      { backgroundColor: badge.bg, borderColor: badge.border },
                    ]}
                  >
                    <Text style={[themeStyles.statusPillText, { color: badge.text }]}>
                      {badge.label}
                    </Text>
                  </View>
                </View>
              );
            })()}

            {selectedTicket._optimistic ? (
              <View
                style={[
                  themeStyles.queueNoticeBar,
                  {
                    backgroundColor: isDarkMode ? '#2D2312' : '#FFFBEB',
                    borderColor: isDarkMode ? '#6B4E16' : '#FDE68A',
                  },
                ]}
              >
                <ActivityIndicator size="small" color={isDarkMode ? '#FBBF24' : '#B45309'} />
                <Text style={[themeStyles.queueNoticeText, { color: isDarkMode ? '#FBBF24' : '#B45309' }]}>
                  {t.syncingQueue}
                </Text>
              </View>
            ) : null}

            <FlatList
              ref={threadListRef}
              data={threadMessages}
              keyExtractor={(_, index) => `${selectedTicket.code}-${index}`}
              renderItem={renderMessageBubble}
              contentContainerStyle={themeStyles.threadListContent}
              onContentSizeChange={() => threadListRef.current?.scrollToEnd({ animated: true })}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            />

            <View style={themeStyles.composerBar}>
              <TextInput
                style={[
                  themeStyles.composerInput,
                  isDarkMode && { backgroundColor: '#232833', borderColor: '#343A45' },
                ]}
                placeholder={t.composerPlaceholder}
                placeholderTextColor="#9CA3AF"
                value={replyInput}
                onChangeText={setReplyInput}
                editable={!sendingReply}
                multiline
                maxLength={1000}
              />
              <TouchableOpacity
                style={[
                  themeStyles.sendBtn,
                  (!replyInput.trim() || sendingReply) && themeStyles.sendBtnDisabled,
                ]}
                onPress={handleSendThreadReply}
                disabled={!replyInput.trim() || sendingReply}
                activeOpacity={0.85}
              >
                {sendingReply ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="send" size={18} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        ) : (
          /* ===================== DANH SÁCH HỘI THOẠI / TẠO MỚI ===================== */
          <View style={{ flex: 1 }}>
            {/* Top Tabs */}
            <View style={themeStyles.tabRow}>
              <TouchableOpacity
                style={[
                  themeStyles.tabBtn,
                  activeTab === 'list' && {
                    backgroundColor: isDarkMode ? '#1F2F2B' : '#EFF4F2',
                    borderColor: accentColor,
                  },
                ]}
                onPress={() => setActiveTab('list')}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="chatbubbles-outline"
                  size={16}
                  color={activeTab === 'list' ? accentColor : '#6B7280'}
                />
                <Text
                  style={[
                    themeStyles.tabText,
                    activeTab === 'list' && { color: accentColor, fontWeight: '700' },
                  ]}
                >
                  {t.tabList} ({tickets.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  themeStyles.tabBtn,
                  activeTab === 'create' && {
                    backgroundColor: isDarkMode ? '#1F2F2B' : '#EFF4F2',
                    borderColor: accentColor,
                  },
                ]}
                onPress={() => setActiveTab('create')}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="create-outline"
                  size={16}
                  color={activeTab === 'create' ? accentColor : '#6B7280'}
                />
                <Text
                  style={[
                    themeStyles.tabText,
                    activeTab === 'create' && { color: accentColor, fontWeight: '700' },
                  ]}
                >
                  {t.tabCreate}
                </Text>
              </TouchableOpacity>
            </View>

            {activeTab === 'list' ? (
              <ScrollView
                style={themeStyles.bodyScroll}
                contentContainerStyle={{ paddingBottom: 32 }}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={() => {
                      fetchMyTickets('refresh');
                    }}
                    colors={['#2F6B5F']}
                    tintColor={accentColor}
                  />
                }
              >
                {loading && tickets.length === 0 ? (
                  <View style={themeStyles.centerStateBox}>
                    <ActivityIndicator size="large" color={accentColor} />
                    <Text style={themeStyles.centerStateDesc}>{t.loadingText}</Text>
                  </View>
                ) : tickets.length === 0 ? (
                  <View style={themeStyles.emptyCard}>
                    <View style={themeStyles.emptyIconCircle}>
                      <Ionicons name="chatbubble-ellipses-outline" size={30} color={accentColor} />
                    </View>
                    <Text style={themeStyles.emptyTitle}>{t.emptyTitle}</Text>
                    <Text style={themeStyles.emptyDesc}>{t.emptyDesc}</Text>
                    <TouchableOpacity
                      style={themeStyles.primaryBtn}
                      onPress={() => setActiveTab('create')}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="paper-plane-outline" size={17} color="#FFFFFF" />
                      <Text style={[themeStyles.primaryBtnText, { color: '#FFFFFF' }]}>{t.emptyBtn}</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  tickets.map((ticket) => {
                    const badge = getStatusBadge(ticket.status, t, isDarkMode);
                    const msgCount = buildThreadMessages(ticket, senderName || customerName, t).length;
                    return (
                      <TouchableOpacity
                        key={ticket.code || String(ticket.id)}
                        style={themeStyles.ticketCard}
                        onPress={() => setSelectedTicket(ticket)}
                        activeOpacity={0.82}
                      >
                        <View style={themeStyles.ticketCardTop}>
                          <Text style={[themeStyles.ticketCode, { color: isDarkMode ? '#60A5FA' : '#2563EB' }]}>
                            #{ticket.code}
                          </Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <View
                              style={[
                                themeStyles.statusPill,
                                { backgroundColor: badge.bg, borderColor: badge.border },
                              ]}
                            >
                              <Text style={[themeStyles.statusPillText, { color: badge.text }]}>
                                {badge.label}
                              </Text>
                            </View>
                          </View>
                        </View>

                        <Text style={themeStyles.ticketSubject} numberOfLines={2}>
                          {ticket.subject}
                        </Text>
                        <Text style={themeStyles.ticketPreview} numberOfLines={2}>
                          {ticket.message}
                        </Text>

                        {ticket.adminReply ? (
                          <View
                            style={[
                              themeStyles.adminReplyPreviewBox,
                              {
                                backgroundColor: isDarkMode ? '#1B2823' : '#F3FAF7',
                                borderColor: isDarkMode ? '#294B3E' : '#CDE7DC',
                              },
                            ]}
                          >
                            <Text style={[themeStyles.adminReplyPreviewLabel, { color: accentColor }]}>
                              {t.adminReplyLabel}
                            </Text>
                            <Text style={themeStyles.adminReplyPreviewText} numberOfLines={2}>
                              {ticket.adminReply}
                            </Text>
                          </View>
                        ) : (
                          <Text style={themeStyles.waitingText}>{t.adminWaiting}</Text>
                        )}

                        <View style={themeStyles.ticketCardFooter}>
                          <Text style={themeStyles.ticketTimeText}>
                            {ticket.createdAt || ''} • {getCategoryLabel(ticket.category, lang)}
                          </Text>
                          <View style={themeStyles.threadCountPill}>
                            <Ionicons name="chatbubble-outline" size={12} color={accentColor} />
                            <Text style={[themeStyles.threadCountText, { color: accentColor }]}>
                              {msgCount} {t.msgUnit}
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })
                )}
              </ScrollView>
            ) : (
              <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              >
                <ScrollView
                  style={themeStyles.bodyScroll}
                  contentContainerStyle={{ paddingBottom: 36 }}
                  keyboardShouldPersistTaps="handled"
                >
                  {/* Contact Info */}
                  <View style={themeStyles.formSectionCard}>
                    <Text style={themeStyles.formSectionTitle}>{t.contactHeading}</Text>
                    <View style={themeStyles.compactFieldRow}>
                      <Text style={themeStyles.compactFieldLabel}>{t.nameLabel}</Text>
                      <TextInput
                        style={themeStyles.compactFieldInput}
                        value={senderName}
                        onChangeText={setSenderName}
                        placeholder={t.namePlaceholder}
                        placeholderTextColor="#9CA3AF"
                      />
                    </View>
                    <View style={themeStyles.compactFieldRow}>
                      <Text style={themeStyles.compactFieldLabel}>{t.emailLabel}</Text>
                      <TextInput
                        style={themeStyles.compactFieldInput}
                        value={senderEmail}
                        onChangeText={(txt) => {
                          senderEmailRef.current = txt;
                          setSenderEmail(txt);
                        }}
                        placeholder={t.emailPlaceholder}
                        placeholderTextColor="#9CA3AF"
                        keyboardType="email-address"
                        autoCapitalize="none"
                      />
                    </View>
                    <View style={[themeStyles.compactFieldRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
                      <Text style={themeStyles.compactFieldLabel}>{t.phoneLabel}</Text>
                      <TextInput
                        style={themeStyles.compactFieldInput}
                        value={senderPhone}
                        onChangeText={setSenderPhone}
                        placeholder={t.phonePlaceholder}
                        placeholderTextColor="#9CA3AF"
                        keyboardType="phone-pad"
                      />
                    </View>
                  </View>

                  {/* Category */}
                  <Text style={themeStyles.inputGroupLabel}>{t.categoryLabel}</Text>
                  <View style={themeStyles.chipGrid}>
                    {CATEGORIES.map((cat) => {
                      const active = category === cat.id;
                      return (
                        <TouchableOpacity
                          key={cat.id}
                          style={[
                            themeStyles.categoryChip,
                            active && {
                              backgroundColor: isDarkMode ? '#1F2F2B' : '#EFF4F2',
                              borderColor: accentColor,
                            },
                          ]}
                          onPress={() => setCategory(cat.id)}
                          activeOpacity={0.8}
                        >
                          <Ionicons
                            name={cat.icon}
                            size={16}
                            color={active ? accentColor : '#6B7280'}
                          />
                          <Text
                            style={[
                              themeStyles.categoryChipText,
                              active && { color: accentColor, fontWeight: '700' },
                            ]}
                            numberOfLines={1}
                          >
                            {lang === 'en' ? cat.labelEn : cat.labelVi}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Priority */}
                  <Text style={themeStyles.inputGroupLabel}>{t.priorityLabel}</Text>
                  <View style={themeStyles.priorityRow}>
                    {PRIORITIES.map((p) => {
                      const active = priority === p.id;
                      return (
                        <TouchableOpacity
                          key={p.id}
                          style={[
                            themeStyles.priorityChip,
                            active && {
                              backgroundColor: '#2F6B5F',
                              borderColor: '#2F6B5F',
                            },
                          ]}
                          onPress={() => setPriority(p.id)}
                          activeOpacity={0.8}
                        >
                          <Text
                            style={[
                              themeStyles.priorityChipText,
                              active && { color: '#FFFFFF', fontWeight: '700' },
                            ]}
                          >
                            {lang === 'en' ? p.labelEn : p.labelVi}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Subject */}
                  <Text style={themeStyles.inputGroupLabel}>{t.subjectLabel}</Text>
                  <TextInput
                    style={[themeStyles.formInput, formError && !subject.trim() ? { borderColor: '#DC2626' } : {}]}
                    value={subject}
                    onChangeText={(txt) => {
                      setSubject(txt);
                      setFormError('');
                    }}
                    placeholder={t.subjectPlaceholder}
                    placeholderTextColor="#9CA3AF"
                    maxLength={200}
                  />

                  {/* Message */}
                  <Text style={themeStyles.inputGroupLabel}>{t.messageLabel}</Text>
                  <TextInput
                    style={[
                      themeStyles.formTextarea,
                      formError && !message.trim() ? { borderColor: '#DC2626' } : {},
                    ]}
                    value={message}
                    onChangeText={(txt) => {
                      setMessage(txt);
                      setFormError('');
                    }}
                    placeholder={t.messagePlaceholder}
                    placeholderTextColor="#9CA3AF"
                    multiline
                    textAlignVertical="top"
                    maxLength={2000}
                  />

                  {formError ? <Text style={themeStyles.errorText}>{formError}</Text> : null}

                  <TouchableOpacity
                    style={[themeStyles.primaryBtn, submitting && { opacity: 0.7 }]}
                    onPress={handleSubmitTicket}
                    disabled={submitting}
                    activeOpacity={0.85}
                  >
                    {submitting ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Ionicons name="paper-plane-outline" size={18} color="#FFFFFF" />
                    )}
                    <Text style={[themeStyles.primaryBtnText, { color: '#FFFFFF' }]}>
                      {submitting ? t.submittingBtn : t.submitBtn}
                    </Text>
                  </TouchableOpacity>
                </ScrollView>
              </KeyboardAvoidingView>
            )}
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F5F7' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 12 : 52,
    paddingBottom: 14,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerBtn: { padding: 6, minWidth: 34, alignItems: 'center' },
  headerTitleWrap: { flex: 1, alignItems: 'center', paddingHorizontal: 8 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
  syncBadgeInline: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  syncDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#10B981' },
  syncBadgeText: { fontSize: 11, fontWeight: '600' },

  tabRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F4F5F7',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tabText: { fontSize: 13.5, fontWeight: '600', color: '#4B5563' },

  bodyScroll: { flex: 1, paddingHorizontal: 16, paddingTop: 14 },

  centerStateBox: { paddingVertical: 54, alignItems: 'center', gap: 12 },
  centerStateDesc: { fontSize: 13.5, color: '#6B7280' },

  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 8,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F4F5F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 6, textAlign: 'center' },
  emptyDesc: { fontSize: 13.5, color: '#6B7280', textAlign: 'center', lineHeight: 20, marginBottom: 18 },

  ticketCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  ticketCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  ticketCode: { fontSize: 13, fontWeight: '700' },
  statusPill: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusPillText: { fontSize: 11, fontWeight: '700' },
  ticketSubject: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 4 },
  ticketPreview: { fontSize: 13, color: '#4B5563', lineHeight: 19, marginBottom: 10 },
  adminReplyPreviewBox: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
  },
  adminReplyPreviewLabel: { fontSize: 11.5, fontWeight: '700', marginBottom: 2 },
  adminReplyPreviewText: { fontSize: 12.5, color: '#374151', lineHeight: 18 },
  waitingText: { fontSize: 12, fontStyle: 'italic', color: '#6B7280', marginBottom: 10 },
  ticketCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F1F3F5',
    paddingTop: 9,
  },
  ticketTimeText: { fontSize: 11.5, color: '#6B7280', flex: 1, marginRight: 8 },
  threadCountPill: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  threadCountText: { fontSize: 12, fontWeight: '700' },

  // Form
  formSectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
  },
  formSectionTitle: { fontSize: 13.5, fontWeight: '700', color: '#111827', marginBottom: 8 },
  compactFieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
    paddingVertical: 9,
  },
  compactFieldLabel: { width: 102, fontSize: 12.5, fontWeight: '600', color: '#6B7280' },
  compactFieldInput: { flex: 1, fontSize: 13.5, fontWeight: '600', color: '#111827', padding: 0 },

  inputGroupLabel: { fontSize: 13.5, fontWeight: '700', color: '#111827', marginBottom: 8 },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  categoryChip: {
    width: '48.5%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 11,
    paddingHorizontal: 10,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryChipText: { fontSize: 12.5, fontWeight: '600', color: '#374151', flex: 1 },

  priorityRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  priorityChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  priorityChipText: { fontSize: 12.5, fontWeight: '600', color: '#4B5563' },

  formInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 14,
  },
  formTextarea: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 116,
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 14,
  },
  errorText: { color: '#DC2626', fontSize: 13, fontWeight: '500', marginBottom: 12 },

  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2F6B5F',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  primaryBtnText: { fontSize: 14.5, fontWeight: '600' },

  // Thread
  threadSubHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  threadSubject: { fontSize: 14, fontWeight: '700', color: '#111827' },
  threadCategory: { fontSize: 11.5, color: '#6B7280', marginTop: 2 },
  queueNoticeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  queueNoticeText: { fontSize: 12, fontWeight: '600', flex: 1 },

  threadListContent: { padding: 14, paddingBottom: 20 },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 14, gap: 8 },
  msgRowLeft: { justifyContent: 'flex-start' },
  msgRowRight: { justifyContent: 'flex-end' },
  adminAvatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2F6B5F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarImg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  userAvatarLetter: { fontSize: 13, fontWeight: '700' },
  msgContentColLeft: { maxWidth: '78%', alignItems: 'flex-start' },
  msgContentColRight: { maxWidth: '78%', alignItems: 'flex-end' },
  msgMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  adminMetaName: { fontSize: 11.5, fontWeight: '700' },
  userMetaName: { fontSize: 11.5, fontWeight: '600', color: '#4B5563' },
  msgTimeText: { fontSize: 10.5, color: '#6B7280' },
  adminBubble: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    borderTopLeftRadius: 4,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  adminBubbleText: { fontSize: 14, color: '#111827', lineHeight: 20 },
  userBubble: {
    backgroundColor: '#2F6B5F',
    borderRadius: 14,
    borderTopRightRadius: 4,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  userBubbleText: { fontSize: 14, lineHeight: 20 },

  composerBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  composerInput: {
    flex: 1,
    backgroundColor: '#F4F5F7',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 14,
    color: '#111827',
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#2F6B5F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.45 },
});
