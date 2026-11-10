import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================================================
// [GIẢI THÍCH CODE]: ĐỊNH NGHĨA MODEL & DỊCH VỤ QUẢN LÝ THÔNG BÁO NỘI BỘ
// - Không cần thay đổi Backend (BE)
// - Dữ liệu được lưu trữ an toàn trong AsyncStorage theo từng tài khoản người dùng
// - Tự động đồng bộ với các sự kiện: Tặng sách, Nạp khoai, Thăng hạng, Điểm danh
// ============================================================================

export type NotificationType = 
  | 'gift_received'    // Nhận sách tặng từ bạn bè
  | 'gift_sent'        // Đã tặng sách cho bạn bè
  | 'potato_reward'    // Điểm danh, nhận thưởng khoai
  | 'potato_purchase'  // Nạp khoai thành công
  | 'tier_upgrade'     // Thăng hạng thành viên
  | 'system';          // Thông báo hệ thống / chào mừng

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

const STORAGE_KEY_PREFIX = 'user_notifications_v1_';

/**
 * Lấy username hiện tại đang đăng nhập
 */
const getCurrentUsername = async (): Promise<string> => {
  try {
    const saved = await AsyncStorage.getItem('currentUsername');
    if (saved && saved.trim().length > 0) return saved.trim();
  } catch {}
  return 'default_user';
};

/**
 * Tạo danh sách thông báo mẫu ban đầu cho người dùng mới
 */
const getDefaultInitialNotifications = (): AppNotification[] => {
  const now = Date.now();
  return [
    {
      id: `${now - 1000}-welcome`,
      type: 'system',
      title: 'Chào mừng bạn đến với HALM BOOK! 🎉',
      message: 'Khám phá hàng ngàn đầu sách hấp dẫn, thuê sách đọc ngay và tích lũy Khoai để nhận ưu đãi đặc quyền.',
      time: 'Hôm nay',
      timestamp: now - 1000,
      isRead: false,
    },
    {
      id: `${now - 2000}-tier`,
      type: 'tier_upgrade',
      title: 'Hệ thống Hạng thành viên HALM 👑',
      message: 'Điểm danh hằng ngày và đọc sách để nâng hạng từ Tân Binh lên Cao Thủ Cày, Lão Nông và Đại Điền Chủ!',
      time: 'Hôm qua',
      timestamp: now - 86400000,
      isRead: false,
    },
    {
      id: `${now - 3000}-gift`,
      type: 'gift_received',
      title: 'Bạn vừa nhận được một cuốn sách mới! 🎁',
      message: 'Bạn Hoàng vừa tặng sách Đắc Nhân Tâm cho bạn. Hãy vào tủ sách của bạn để thưởng thức ngay!',
      time: 'Hôm qua',
      timestamp: now - 86400000,
      isRead: false,
      data: {
        bookId: 'dac-nhan-tam',
        bookTitle: 'Đắc Nhân Tâm',
        senderName: 'Hoàng',
        giftMessage: 'Tặng cậu cuốn sách này, đọc vui vẻ và cùng nhau cố gắng nhé! 🌟',
      },
    },
  ];
};

/**
 * Lấy toàn bộ danh sách thông báo của tài khoản hiện tại
 */
export const getNotifications = async (targetUsername?: string): Promise<AppNotification[]> => {
  try {
    const username = targetUsername || (await getCurrentUsername());
    const storageKey = `${STORAGE_KEY_PREFIX}${username}`;
    const raw = await AsyncStorage.getItem(storageKey);

    if (!raw) {
      const initialList = getDefaultInitialNotifications();
      await AsyncStorage.setItem(storageKey, JSON.stringify(initialList));
      return initialList;
    }

    const parsed: AppNotification[] = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('Lỗi lấy thông báo:', err);
    return [];
  }
};

/**
 * Thêm một thông báo mới vào danh sách
 */
export const addNotification = async (
  item: Omit<AppNotification, 'id' | 'timestamp' | 'isRead' | 'time'> & { time?: string },
  targetUsername?: string
): Promise<AppNotification> => {
  try {
    const username = targetUsername || (await getCurrentUsername());
    const currentList = await getNotifications(username);

    const now = Date.now();
    const formattedTime =
      item.time ||
      new Date(now).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) +
        ', ' +
        new Date(now).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });

    const newNotification: AppNotification = {
      id: `${now}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: now,
      time: formattedTime,
      isRead: false,
      ...item,
    };

    const updatedList = [newNotification, ...currentList];
    const storageKey = `${STORAGE_KEY_PREFIX}${username}`;
    await AsyncStorage.setItem(storageKey, JSON.stringify(updatedList));

    return newNotification;
  } catch (err) {
    console.warn('Lỗi lưu thông báo mới:', err);
    throw err;
  }
};

/**
 * Đánh dấu một thông báo là đã đọc
 */
export const markNotificationAsRead = async (id: string, targetUsername?: string): Promise<void> => {
  try {
    const username = targetUsername || (await getCurrentUsername());
    const currentList = await getNotifications(username);
    const updatedList = currentList.map((item) =>
      item.id === id ? { ...item, isRead: true } : item
    );
    const storageKey = `${STORAGE_KEY_PREFIX}${username}`;
    await AsyncStorage.setItem(storageKey, JSON.stringify(updatedList));
  } catch (err) {
    console.warn('Lỗi cập nhật đã đọc:', err);
  }
};

/**
 * Đánh dấu toàn bộ thông báo là đã đọc
 */
export const markAllNotificationsAsRead = async (targetUsername?: string): Promise<void> => {
  try {
    const username = targetUsername || (await getCurrentUsername());
    const currentList = await getNotifications(username);
    const updatedList = currentList.map((item) => ({ ...item, isRead: true }));
    const storageKey = `${STORAGE_KEY_PREFIX}${username}`;
    await AsyncStorage.setItem(storageKey, JSON.stringify(updatedList));
  } catch (err) {
    console.warn('Lỗi đánh dấu đọc tất cả:', err);
  }
};

/**
 * Xóa một thông báo theo ID
 */
export const deleteNotification = async (id: string, targetUsername?: string): Promise<void> => {
  try {
    const username = targetUsername || (await getCurrentUsername());
    const currentList = await getNotifications(username);
    const updatedList = currentList.filter((item) => item.id !== id);
    const storageKey = `${STORAGE_KEY_PREFIX}${username}`;
    await AsyncStorage.setItem(storageKey, JSON.stringify(updatedList));
  } catch (err) {
    console.warn('Lỗi xóa thông báo:', err);
  }
};

/**
 * Xóa toàn bộ thông báo
 */
export const clearAllNotifications = async (targetUsername?: string): Promise<void> => {
  try {
    const username = targetUsername || (await getCurrentUsername());
    const storageKey = `${STORAGE_KEY_PREFIX}${username}`;
    await AsyncStorage.setItem(storageKey, JSON.stringify([]));
  } catch (err) {
    console.warn('Lỗi xóa tất cả thông báo:', err);
  }
};

/**
 * Đếm số lượng thông báo chưa đọc
 */
export const getUnreadNotificationCount = async (targetUsername?: string): Promise<number> => {
  try {
    const list = await getNotifications(targetUsername);
    return list.filter((item) => !item.isRead).length;
  } catch {
    return 0;
  }
};

