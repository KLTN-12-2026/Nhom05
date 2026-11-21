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
  const raw = await AsyncStorage.getItem(await deletedKey(username));
  if (!raw) return new Set();
  const values: unknown = JSON.parse(raw);
  if (!Array.isArray(values)) throw new Error('Dữ liệu thông báo đã xóa không hợp lệ.');
  return new Set(values.map(String));
}

async function addDeletedIds(ids: string[], username?: string) {
  const current = await getDeletedIds(username);
  ids.forEach(id => current.add(id));
  await AsyncStorage.setItem(await deletedKey(username), JSON.stringify([...current]));
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
  const raw = await AsyncStorage.getItem(key) ?? await AsyncStorage.getItem(key.replace(PREFIX, 'user_notifications_v1_'));
  if (!raw) return [];
  const list: unknown = JSON.parse(raw);
  if (!Array.isArray(list) || list.some(item => !item || typeof item.id !== 'string'
      || typeof item.title !== 'string' || !Number.isFinite(item.timestamp))) {
    throw new Error('Dữ liệu thông báo không hợp lệ; lịch sử được giữ nguyên.');
  }
  return list.sort((a, b) => b.timestamp - a.timestamp);
}

async function writeLocal(key: string, list: AppNotification[]) {
  await AsyncStorage.setItem(key, JSON.stringify(list));
}

// Every cache merge, read-state update and deletion shares the same per-account queue.
async function updateLocal(
  username: string | undefined,
  change: (list: AppNotification[], owner: string) => AppNotification[] | Promise<AppNotification[]>,
  notify = true
): Promise<AppNotification[]> {
  const owner = username?.trim().toLowerCase() || await getCurrentUsername();
  const key = await storageKey(owner);
  const previous = pending.get(key) ?? Promise.resolve();
  const operation = previous.catch(() => {}).then(async () => {
    const updated = await change(await readLocal(key), owner);
    await writeLocal(key, updated);
    if (notify) notifyListeners();
    return updated;
  });
  pending.set(key, operation);
  try { return await operation; }
  finally { if (pending.get(key) === operation) pending.delete(key); }
}

export async function getNotifications(username?: string): Promise<AppNotification[]> {
  const owner = username?.trim().toLowerCase() || await getCurrentUsername();
  // Validate local history before a network result can overwrite it.
  await readLocal(await storageKey(owner));
  let remote: AppNotification[] | undefined;
  const token = await AsyncStorage.getItem('userToken');
  if (token && owner === await getCurrentUsername()) {
    try {
      const response = await fetchApiWithFallback<BackendNotificationResponse>('/api/home/notifications', {
        method: 'GET', headers: { Authorization: 'Bearer ' + token }, timeout: 5000,
      });
      if (Array.isArray(response.data?.notifications)) remote = response.data.notifications.map(mapBackendItem);
    } catch { /* Network failure uses the last committed local inbox. */ }
  }
  return updateLocal(owner, async local => {
    const deleted = await getDeletedIds(owner);
    const localRead = new Set(local.filter(item => item.isRead).map(item => item.id));
    const remoteIds = new Set(remote?.map(item => item.id));
    const combined = remote ? [...remote.map(item => ({ ...item, isRead: item.isRead || localRead.has(item.id) })),
      ...local.filter(item => !item.backendId && !remoteIds.has(item.id))] : local;
    return combined.filter(item => !deleted.has(item.id) && (!item.backendId || !deleted.has(String(item.backendId))))
      .sort((a, b) => b.timestamp - a.timestamp);
  }, false);
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
  await updateLocal(username, async (list, owner) => {
    await addDeletedIds([id, ...(id.startsWith('be_') ? [id.slice(3)] : [])], owner);
    return list.filter(item => item.id !== id && 'be_' + item.backendId !== id);
  });
}

export async function clearAllNotifications(username?: string): Promise<void> {
  await updateLocal(username, async (list, owner) => {
    await addDeletedIds(list.flatMap(item => [item.id, ...(item.backendId ? [String(item.backendId)] : [])]), owner);
    return [];
  });
}

export async function getUnreadNotificationCount(username?: string): Promise<number> {
  try {
    const list = await getNotifications(username);
    return list.filter((item) => !item.isRead).length;
  } catch {
    return 0;
  }
}
