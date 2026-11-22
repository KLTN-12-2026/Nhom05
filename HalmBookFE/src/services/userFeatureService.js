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
    return { ...res.data, isError: false };
  } catch (error) {
    console.warn('Lỗi khi lấy chi tiết quyền đọc:', error);
    const isNetworkError = !error.response || error.code === 'ERR_NETWORK' || error.message?.includes('Network');
    return {
      hasAccess: false,
      currentPage: 1,
      readingPercentage: 0,
      isError: true,
      isNetworkError,
      errorMessage: error.response?.data?.message || error.message || 'Lỗi kết nối máy chủ'
    };
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
  } catch {
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
  } catch {
    return { dailyClaimed: [], milestoneClaimed: [] };
  }
};

export const claimMissionReward = async ({ missionId }) => {
  const res = await axiosInstance.post('/api/home/missions/claim', {
    missionId
  });
  return res.data;
};

// 4. CHUÔNG THÔNG BÁO
export const getNotifications = async () => {
  try {
    const res = await axiosInstance.get('/api/home/notifications');
    return res.data;
  } catch {
    return { unreadCount: 0, notifications: [] };
  }
};

export const markNotificationAsRead = async (id) => {
  try {
    const res = await axiosInstance.put(`/api/home/notifications/${id}/read`);
    return res.data;
  } catch {
    return null;
  }
};

export const markAllNotificationsAsRead = async () => {
  try {
    const res = await axiosInstance.put('/api/home/notifications/read-all');
    return res.data;
  } catch {
    return null;
  }
};

// 5. TỦ SÁCH YÊU THÍCH (WISHLIST)
export const getFavoriteBooks = async () => {
  try {
    const res = await axiosInstance.get('/api/home/favorites');
    return Array.isArray(res.data) ? res.data : [];
  } catch {
    return [];
  }
};

export const checkIsFavorite = async (bookId) => {
  try {
    const res = await axiosInstance.get(`/api/home/favorites/check/${encodeURIComponent(bookId)}`);
    return Boolean(res.data?.isFavorite);
  } catch {
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

// 6. NHẠC NỀN CÁ NHÂN CỦA ĐỘC GIẢ (CUSTOMER BACKGROUND MUSIC)
export const getCustomerMusic = async () => {
  try {
    const res = await axiosInstance.get('/api/home/customer/music');
    return Array.isArray(res.data) ? res.data : [];
  } catch (error) {
    console.warn('Lỗi khi tải danh sách nhạc cá nhân:', error);
    return [];
  }
};

export const uploadCustomerMusic = async (file, title) => {
  const formData = new FormData();
  formData.append('file', file);
  if (title) {
    formData.append('title', title);
  }

  const res = await axiosInstance.post('/api/home/customer/music', formData);
  return res.data;
};

export const deleteCustomerMusic = async (id) => {
  const res = await axiosInstance.delete(`/api/home/customer/music/${id}`);
  return res.data;
};

// 7. VOUCHER CỦA TÔI (MY VOUCHER WALLET)
export const getMyVouchers = async () => {
  try {
    const res = await axiosInstance.get('/api/home/customer/vouchers');
    return Array.isArray(res.data) ? res.data : [];
  } catch (error) {
    console.warn('Lỗi khi tải danh sách voucher của tôi:', error);
    return [];
  }
};

export const saveVoucherToWallet = async (code) => {
  const res = await axiosInstance.post('/api/home/customer/vouchers/save', { code });
  return res.data;
};

// 8. TẶNG SÁCH CHO BẠN BÈ / ĐỘC GIẢ KHÁC (BOOK GIFTING)
export const searchGiftRecipient = async (query) => {
  if (!query || query.trim().length < 2) return [];
  try {
    const res = await axiosInstance.get('/api/home/books/gift-recipient-search', {
      params: { query: query.trim() }
    });
    return Array.isArray(res.data) ? res.data : [];
  } catch (error) {
    console.warn('Lỗi tìm kiếm người nhận quà:', error);
    return [];
  }
};

export const giftBookToRecipient = async (bookId, { recipientIdentifier, planKey = '7', message = '' }) => {
  const res = await axiosInstance.post(`/api/home/books/${encodeURIComponent(bookId)}/gift`, {
    recipientIdentifier,
    planKey,
    message
  });
  return res.data;
};

export const getGiftsSent = async () => {
  try {
    const res = await axiosInstance.get('/api/home/customer/gifts-sent');
    return Array.isArray(res.data) ? res.data : [];
  } catch (error) {
    console.warn('Lỗi khi tải danh sách sách đã tặng:', error);
    return [];
  }
};

export const getGiftsReceived = async () => {
  try {
    const res = await axiosInstance.get('/api/home/customer/gifts-received');
    return Array.isArray(res.data) ? res.data : [];
  } catch (error) {
    console.warn('Lỗi khi tải danh sách sách được tặng:', error);
    return [];
  }
};

// 9. TRẢ SÁCH CÓ HẠN THUÊ TRONG TỦ SÁCH CÁ NHÂN
export const returnRentedBook = async (bookId) => {
  const res = await axiosInstance.post(`/api/home/bookshelf/${encodeURIComponent(bookId)}/return`);
  return res.data;
};
