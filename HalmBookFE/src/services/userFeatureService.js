import axiosInstance from './axiosClient';

/**
 * ============================================================================
 * SERVICE: userFeatureService
 * Mô tả: Quản lý các tính năng người dùng nâng cao:
 *   1. Khôi phục và đồng bộ tiến độ đọc sách (Auto-resume & Reading progress)
 *   2. Tải ảnh đại diện Avatar lên Cloudinary
 *   3. Nhận thưởng nhiệm vụ & thành tựu lưu vào Cơ sở dữ liệu thật
 *   4. Trung tâm chuông thông báo (Notification Center)
 *   5. Tủ sách yêu thích (Wishlist)
 * ============================================================================
 */

// 1. TIẾN ĐỘ ĐỌC SÁCH
export const getBookAccessDetail = async (bookId) => {
  try {
    const res = await axiosInstance.get(`/api/home/bookshelf/check-detail/${encodeURIComponent(bookId)}`);
    return res.data;
  } catch (error) {
    console.warn('Lỗi khi lấy chi tiết quyền đọc:', error);
    return { hasAccess: false, currentPage: 1, readingPercentage: 0 };
  }
};

export const updateReadingProgress = async (bookId, { currentPage, readingPercentage, totalPages }) => {
  try {
    const res = await axiosInstance.post(`/api/home/books/${encodeURIComponent(bookId)}/reading-progress`, {
      currentPage,
      readingPercentage,
      totalPages
    });
    return res.data;
  } catch (error) {
    // Lưu fallback vào LocalStorage nếu mạng yếu
    try {
      localStorage.setItem(`halm_reading_progress_${bookId}`, JSON.stringify({
        currentPage,
        readingPercentage,
        updatedAt: new Date().toISOString()
      }));
    } catch {}
    return null;
  }
};

// 2. UPLOAD AVATAR LÊN CLOUDINARY
export const uploadAvatar = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const res = await axiosInstance.post('/api/home/customer/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return res.data;
};

// 3. NHIỆM VỤ ĐỘC GIẢ
export const getClaimedMissions = async () => {
  try {
    const res = await axiosInstance.get('/api/home/missions/claimed');
    return res.data;
  } catch (error) {
    return { dailyClaimed: [], milestoneClaimed: [] };
  }
};

export const claimMissionReward = async ({ missionId, isMilestone, rewardPotato, rewardXp }) => {
  const res = await axiosInstance.post('/api/home/missions/claim', {
    missionId,
    isMilestone,
    rewardPotato,
    rewardXp
  });
  return res.data;
};

// 4. CHUÔNG THÔNG BÁO
export const getNotifications = async () => {
  try {
    const res = await axiosInstance.get('/api/home/notifications');
    return res.data;
  } catch (error) {
    return { unreadCount: 0, notifications: [] };
  }
};

export const markNotificationAsRead = async (id) => {
  try {
    const res = await axiosInstance.put(`/api/home/notifications/${id}/read`);
    return res.data;
  } catch (error) {
    return null;
  }
};

export const markAllNotificationsAsRead = async () => {
  try {
    const res = await axiosInstance.put('/api/home/notifications/read-all');
    return res.data;
  } catch (error) {
    return null;
  }
};

// 5. TỦ SÁCH YÊU THÍCH (WISHLIST)
export const getFavoriteBooks = async () => {
  try {
    const res = await axiosInstance.get('/api/home/favorites');
    return Array.isArray(res.data) ? res.data : [];
  } catch (error) {
    return [];
  }
};

export const checkIsFavorite = async (bookId) => {
  try {
    const res = await axiosInstance.get(`/api/home/favorites/check/${encodeURIComponent(bookId)}`);
    return Boolean(res.data?.isFavorite);
  } catch (error) {
    return false;
  }
};

export const toggleFavorite = async (bookId) => {
  const res = await axiosInstance.post(`/api/home/favorites/${encodeURIComponent(bookId)}`);
  return res.data;
};

export const removeFavorite = async (bookId) => {
  const res = await axiosInstance.delete(`/api/home/favorites/${encodeURIComponent(bookId)}`);
  return res.data;
};
