import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchApiWithFallback } from './apiService';
import { getCurrentUsername } from './userStorage';

export type NotificationType =
  | 'system'
  | 'rent'
  | 'expiring'
  | 'potato_reward'
  | 'potato_purchase'
  | 'gift_received'
  | 'gift_sent'
  | 'tier_upgrade';

export interface AppNotification {
  id: string;
  backendId?: number;
  type: NotificationType;
  title: string;
  message: string;
  time: string;
  timestamp: number;
  isRead: boolean;
  link?: string;
  data?: {
    bookId?: string;
    bookTitle?: string;
    senderName?: string;
    recipientName?: string;
    giftMessage?: string;
    potatoAmount?: number;
    tierName?: string;
  };
}

interface BackendNotificationItem {
  notificationId?: number;
  customerId?: string;
  title?: string;
  message?: string;
  type?: string;
  link?: string;
  isRead?: boolean;
  createdAt?: unknown;
}

interface BackendNotificationResponse {
  unreadCount?: number;
  notifications?: BackendNotificationItem[];
}

const PREFIX = 'user_notifications_v2_';
const DELETED_PREFIX = '@halm_deleted_notifications_';
const listeners = new Set<() => void>();
const pending = new Map<string, Promise<unknown>>();

export function subscribeNotifications(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notifyListeners() {
  for (const listener of listeners) {
    try {
      listener();
    } catch {
      // Ignore listener error
    }
  }
}

async function storageKey(username?: string) {
  const current = username?.trim().toLowerCase() || (await getCurrentUsername());
  return PREFIX + current;
}

async function deletedKey(username?: string) {
  const current = username?.trim().toLowerCase() || (await getCurrentUsername());
  return DELETED_PREFIX + current;
}

async function getDeletedIds(username?: string): Promise<Set<string>> {
  try {
    const key = await deletedKey(username);
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr.map(String) : []);
  } catch {
    return new Set();
  }
}

async function addDeletedId(id: string, username?: string) {
  try {
    const key = await deletedKey(username);
    const set = await getDeletedIds(username);
    set.add(String(id));
    await AsyncStorage.setItem(key, JSON.stringify(Array.from(set)));
  } catch {
    // Ignore storage error
  }
}

async function addDeletedIds(ids: string[], username?: string) {
  try {
    const key = await deletedKey(username);
    const set = await getDeletedIds(username);
    ids.forEach((id) => set.add(String(id)));
    await AsyncStorage.setItem(key, JSON.stringify(Array.from(set)));
  } catch {
    // Ignore storage error
  }
}

function parseTimestamp(rawDate: unknown): number {
  if (typeof rawDate === 'number' && Number.isFinite(rawDate)) {
    return rawDate > 1e11 ? rawDate : rawDate * 1000;
  }
  if (typeof rawDate === 'string') {
    const parsed = Date.parse(rawDate);
    if (!isNaN(parsed)) return parsed;
  }
  if (Array.isArray(rawDate) && rawDate.length >= 3) {
    const [year, month, day, hour = 0, minute = 0, second = 0] = rawDate;
    return new Date(year, month - 1, day, hour, minute, second).getTime();
  }
  return Date.now();
}

function normalizeType(rawType?: string): NotificationType {
  if (!rawType) return 'system';
  const upper = rawType.toUpperCase();
  if (upper === 'TOPUP') return 'potato_purchase';
  if (upper === 'RENT') return 'rent';
  if (upper === 'EXPIRING') return 'expiring';
  if (upper === 'REWARD') return 'potato_reward';
  if (upper === 'GIFT_RECEIVED') return 'gift_received';
  if (upper === 'GIFT_SENT') return 'gift_sent';
  if (upper === 'TIER_UPGRADE' || upper === 'TIER') return 'tier_upgrade';
  if (upper === 'SYSTEM') return 'system';

  const lower = rawType.toLowerCase() as NotificationType;
  const valid: NotificationType[] = [
    'system',
    'rent',
    'expiring',
    'potato_reward',
    'potato_purchase',
    'gift_received',
    'gift_sent',
    'tier_upgrade',
  ];
  return valid.includes(lower) ? lower : 'system';
}

function mapBackendItem(item: BackendNotificationItem): AppNotification {
  const backendId = item.notificationId ?? undefined;
  const id = backendId ? `be_${backendId}` : `be_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const timestamp = parseTimestamp(item.createdAt);
  const type = normalizeType(item.type);

  return {
    id,
    backendId,
    type,
    title: item.title?.trim() || 'Thông báo từ Thư phòng',
    message: item.message?.trim() || '',
    time: new Date(timestamp).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }),
    timestamp,
    isRead: Boolean(item.isRead),
    link: item.link || undefined,
  };
}

async function readLocal(key: string): Promise<AppNotification[]> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return [];
    const list: unknown = JSON.parse(raw);
    if (!Array.isArray(list)) return [];
    return list
      .filter(
        (item): item is AppNotification =>
          Boolean(item && typeof item.id === 'string' && typeof item.title === 'string' && Number.isFinite(item.timestamp))
      )
      .sort((a, b) => b.timestamp - a.timestamp);
  } catch {
    return [];
  }
}

async function writeLocal(key: string, list: AppNotification[]) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(list));
  } catch {
    // Ignore storage write error
  }
}

/**
 * Lấy danh sách thông báo:
 * 1. Đọc cache cục bộ để UI hiển thị ngay lập tức (Zero-latency).
 * 2. Nếu đã đăng nhập, gọi API backend GET /api/home/notifications để đồng bộ.
 * 3. Hợp nhất (merge) dữ liệu từ BE và các thông báo cục bộ (như sự kiện điểm danh, tải sách).
 * 4. Loại bỏ các thông báo người dùng đã bấm xóa.
 */
export async function getNotifications(username?: string): Promise<AppNotification[]> {
  const key = await storageKey(username);
  const localItems = await readLocal(key);
  const deletedSet = await getDeletedIds(username);

  let mergedItems = localItems.filter((item) => !deletedSet.has(item.id) && (!item.backendId || !deletedSet.has(`be_${item.backendId}`)));

  try {
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      const response = await fetchApiWithFallback<BackendNotificationResponse>('/api/home/notifications', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
        timeout: 5000,
      });

      if (response && response.data && Array.isArray(response.data.notifications)) {
        const beList = response.data.notifications;
        const beMapped = beList
          .map(mapBackendItem)
          .filter((item) => !deletedSet.has(item.id) && (!item.backendId || !deletedSet.has(`be_${item.backendId}`)));

        // Merge BE notifications with local-only notifications (e.g. ones without backendId)
        const beIdSet = new Set(beMapped.map((b) => b.id));
        const localOnly = mergedItems.filter((loc) => !loc.backendId && !beIdSet.has(loc.id));

        // Preserve local isRead state if local is already read
        const localReadMap = new Map<string, boolean>();
        mergedItems.forEach((m) => {
          if (m.isRead) localReadMap.set(m.id, true);
        });

        const updatedBeList = beMapped.map((item) => {
          if (localReadMap.has(item.id)) {
            return { ...item, isRead: true };
          }
          return item;
        });

        mergedItems = [...updatedBeList, ...localOnly].sort((a, b) => b.timestamp - a.timestamp);

        // Lưu vào cache cục bộ
        await writeLocal(key, mergedItems);
      }
    }
  } catch (error) {
    // Nếu mất mạng hoặc server tạm thời bận, tiếp tục dùng cached data
  }

  return mergedItems;
}

// Serialize writes per account
async function updateLocal(
  username: string | undefined,
  change: (list: AppNotification[]) => AppNotification[]
): Promise<AppNotification[]> {
  const key = await storageKey(username);
  const previous = pending.get(key) ?? Promise.resolve();
  let updatedList: AppNotification[] = [];

  const operation = previous.catch(() => {}).then(async () => {
    const current = await readLocal(key);
    updatedList = change(current);
    await writeLocal(key, updatedList);
  });

  pending.set(key, operation);
  try {
    await operation;
    notifyListeners();
  } finally {
    if (pending.get(key) === operation) pending.delete(key);
  }

  return updatedList;
}

export async function addNotification(
  item: Omit<AppNotification, 'id' | 'timestamp' | 'isRead' | 'time'> & { time?: string },
  username?: string
): Promise<AppNotification> {
  const now = Date.now();
  const notification: AppNotification = {
    ...item,
    id: `local_${now}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: now,
    isRead: false,
    time: item.time || new Date(now).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }),
  };

  await updateLocal(username, (list) => [notification, ...list]);
  return notification;
}

export async function markNotificationAsRead(id: string, username?: string): Promise<void> {
  let targetBackendId: number | undefined;

  await updateLocal(username, (list) =>
    list.map((item) => {
      if (item.id === id || (item.backendId && `be_${item.backendId}` === id)) {
        if (item.backendId) targetBackendId = item.backendId;
        return { ...item, isRead: true };
      }
      return item;
    })
  );

  // Nếu là thông báo từ backend, gọi API PUT /api/home/notifications/{id}/read
  if (targetBackendId || id.startsWith('be_')) {
    const beId = targetBackendId || Number(id.replace(/^be_/, ''));
    if (Number.isFinite(beId) && beId > 0) {
      void (async () => {
        try {
          const token = await AsyncStorage.getItem('userToken');
          if (token) {
            await fetchApiWithFallback(`/api/home/notifications/${beId}/read`, {
              method: 'PUT',
              headers: { Authorization: `Bearer ${token}` },
              timeout: 4000,
            });
          }
        } catch {
          // Bỏ qua lỗi mạng
        }
      })();
    }
  }
}

export async function markAllNotificationsAsRead(username?: string): Promise<void> {
  await updateLocal(username, (list) => list.map((item) => ({ ...item, isRead: true })));

  // Gọi API backend PUT /api/home/notifications/read-all
  void (async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        await fetchApiWithFallback('/api/home/notifications/read-all', {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` },
          timeout: 5000,
        });
      }
    } catch {
      // Bỏ qua lỗi mạng
    }
  })();
}

export async function deleteNotification(id: string, username?: string): Promise<void> {
  await addDeletedId(id, username);
  if (id.startsWith('be_')) {
    const num = id.replace(/^be_/, '');
    await addDeletedId(num, username);
  }
  await updateLocal(username, (list) => list.filter((item) => item.id !== id && `be_${item.backendId}` !== id));
}

export async function clearAllNotifications(username?: string): Promise<void> {
  const key = await storageKey(username);
  const current = await readLocal(key);
  const idsToDelete = current.flatMap((item) => [item.id, ...(item.backendId ? [`be_${item.backendId}`, String(item.backendId)] : [])]);
  await addDeletedIds(idsToDelete, username);
  await updateLocal(username, () => []);
}

export async function getUnreadNotificationCount(username?: string): Promise<number> {
  try {
    const list = await getNotifications(username);
    return list.filter((item) => !item.isRead).length;
  } catch {
    return 0;
  }
}
