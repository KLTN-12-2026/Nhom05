import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentUsername } from './userStorage';

export type NotificationType = 'gift_received' | 'gift_sent' | 'potato_reward' | 'potato_purchase' | 'tier_upgrade' | 'system';
export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  time: string;
  timestamp: number;
  isRead: boolean;
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
const PREFIX = 'user_notifications_v1_';
const listeners = new Set<() => void>();
const pending = new Map<string, Promise<unknown>>();
export function subscribeNotifications(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
async function storageKey(username?: string) {
  const current = username?.trim().toLowerCase() || await getCurrentUsername();
  return PREFIX + current;
}
async function read(key: string): Promise<AppNotification[]> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return [];
  const list: unknown = JSON.parse(raw);
  if (!Array.isArray(list)) throw new Error('Dữ liệu thông báo không hợp lệ.');
  return list.filter((item): item is AppNotification => Boolean(item && typeof item.id === 'string' && typeof item.title === 'string' && typeof item.message === 'string' && Number.isFinite(item.timestamp)))
    .sort((a, b) => b.timestamp - a.timestamp);
}
export async function getNotifications(username?: string): Promise<AppNotification[]> {
  const key = await storageKey(username);
  await pending.get(key)?.catch(() => {});
  return read(key);
}
// Serialize writes per account so simultaneous rewards/read/delete operations cannot lose events.
async function update(username: string | undefined, change: (list: AppNotification[]) => AppNotification[]) {
  const key = await storageKey(username);
  const previous = pending.get(key) ?? Promise.resolve();
  const operation = previous.catch(() => {}).then(async () => {
    await AsyncStorage.setItem(key, JSON.stringify(change(await read(key))));
  });
  pending.set(key, operation);
  try {
    await operation;
    for (const listener of listeners) listener();
  } finally {
    if (pending.get(key) === operation) pending.delete(key);
  }
}
export async function addNotification(
  item: Omit<AppNotification, 'id' | 'timestamp' | 'isRead' | 'time'> & { time?: string },
  username?: string,
): Promise<AppNotification> {
  const now = Date.now();
  const notification: AppNotification = {
    ...item,
    id: now + '-' + Math.random().toString(36).slice(2, 9),
    timestamp: now,
    isRead: false,
    time: item.time || new Date(now).toLocaleString('vi-VN'),
  };
  await update(username, list => [notification, ...list]);
  return notification;
}
export async function markNotificationAsRead(id: string, username?: string): Promise<void> {
  await update(username, list => list.map(item => item.id === id ? { ...item, isRead: true } : item));
}
export async function markAllNotificationsAsRead(username?: string): Promise<void> {
  await update(username, list => list.map(item => ({ ...item, isRead: true })));
}
export async function deleteNotification(id: string, username?: string): Promise<void> {
  await update(username, list => list.filter(item => item.id !== id));
}
export async function clearAllNotifications(username?: string): Promise<void> {
  await update(username, () => []);
}
export async function getUnreadNotificationCount(username?: string): Promise<number> {
  return (await getNotifications(username)).filter(item => !item.isRead).length;
}
