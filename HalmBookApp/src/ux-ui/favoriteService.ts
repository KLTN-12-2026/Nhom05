import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from './apiService';
import { getUserItem, setUserItem, KEY_FAVORITES_BOOKS } from './userStorage';

// ============================================================================
// [GIẢI THÍCH CODE]: DỊCH VỤ ĐỒNG BỘ SÁCH YÊU THÍCH VỚI BACKEND VÀ WEB (WISHLIST)
// - Gọi trực tiếp các API Backend Spring Boot có sẵn:
//   + GET    /api/home/favorites             : Lấy toàn bộ sách yêu thích từ bảng `favorite_book` trong database MySQL
//   + GET    /api/home/favorites/check/{id}  : Kiểm tra sách đã được yêu thích chưa
//   + POST   /api/home/favorites/{id}        : Thêm/Toggle sách yêu thích vào database MySQL
//   + DELETE /api/home/favorites/{id}        : Xóa sách yêu thích khỏi database MySQL
// - Khi người dùng bấm yêu thích trên App Mobile, dữ liệu lập tức được đẩy vào
//   database MySQL thông qua API. Khi người dùng đăng nhập trên Web (HalmBookFE),
//   Web gọi cùng API này sẽ thấy toàn bộ danh sách sách yêu thích đồng bộ 100%!
// ============================================================================

export interface FavoriteBookItem {
  id: string;
  bookId?: string;
  title: string;
  author?: string;
  chapter?: string;
  categoryName?: string;
  img_url?: string;
  coverImage?: string | null;
  price?: number;
  rating?: number;
  createdAt?: string;
}

/**
 * Lấy danh sách sách yêu thích từ Backend (đồng bộ cơ sở dữ liệu MySQL)
 */
export const fetchFavoriteBooksFromApi = async (): Promise<FavoriteBookItem[]> => {
  try {
    const token = await AsyncStorage.getItem('userToken');
    if (!token) {
      // Nếu chưa đăng nhập, lấy danh sách yêu thích lưu trong local storage
      const raw = await getUserItem(KEY_FAVORITES_BOOKS);
      return raw ? JSON.parse(raw) : [];
    }

    const res = await axios.get<any[]>(`${API_BASE_URL}/api/home/favorites`, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 4500,
    });

    if (Array.isArray(res.data)) {
      const mapped: FavoriteBookItem[] = res.data.map((item: any) => ({
        id: String(item.bookId || item.id),
        bookId: String(item.bookId || item.id),
        title: item.title || item.bookName || 'Sách yêu thích',
        author: item.author || 'Tác giả',
        chapter: item.categoryName || 'Yêu thích',
        categoryName: item.categoryName || 'Chung',
        img_url: item.imgUrl || item.img || '',
        coverImage: item.imgUrl || item.img || '',
        price: item.price,
        rating: item.rating,
        createdAt: item.createdAt,
      }));

      // Cập nhật lại bộ nhớ đệm nội bộ để người dùng xem offline mượt mà
      await setUserItem(KEY_FAVORITES_BOOKS, JSON.stringify(mapped));
      return mapped;
    }
  } catch (error) {
    // Nếu mất mạng hoặc lỗi máy chủ, dùng dữ liệu đã cache ở local
    try {
      const raw = await getUserItem(KEY_FAVORITES_BOOKS);
      if (raw) return JSON.parse(raw);
    } catch {}
  }
  return [];
};

/**
 * Kiểm tra xem cuốn sách đã được yêu thích chưa (kiểm tra cả BE và Local)
 */
export const checkBookIsFavorite = async (bookId: string): Promise<boolean> => {
  if (!bookId) return false;
  try {
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      const res = await axios.get<{ isFavorite: boolean }>(
        `${API_BASE_URL}/api/home/favorites/check/${encodeURIComponent(bookId)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 3500,
        }
      );
      if (typeof res.data?.isFavorite === 'boolean') {
        return res.data.isFavorite;
      }
    }
  } catch {
    // Fallback sang local storage
  }

  try {
    const raw = await getUserItem(KEY_FAVORITES_BOOKS);
    if (raw) {
      const list = JSON.parse(raw);
      if (Array.isArray(list)) {
        return list.some((b: any) => String(b.id || b.bookId) === String(bookId));
      }
    }
  } catch {}

  return false;
};

/**
 * Thêm hoặc Hủy yêu thích cuốn sách (Toggle):
 * Đẩy trực tiếp vào Backend POST /api/home/favorites/{bookId} -> Lưu vào bảng `favorite_book` của MySQL
 */
export const toggleFavoriteBook = async (
  book: {
    id: string;
    title: string;
    author?: string;
    chapter?: string;
    category_name?: string;
    img_url?: string;
    coverImage?: string;
  }
): Promise<{ success: boolean; isFavorite: boolean; message: string; requireLogin?: boolean }> => {
  if (!book || !book.id) {
    return { success: false, isFavorite: false, message: 'Dữ liệu sách không hợp lệ.' };
  }

  const token = await AsyncStorage.getItem('userToken');
  const bookId = String(book.id);

  // 1. Trường hợp người dùng ĐÃ ĐĂNG NHẬP: Gửi lên Backend để lưu vào database MySQL
  if (token) {
    try {
      const res = await axios.post<{ isFavorite: boolean; message: string }>(
        `${API_BASE_URL}/api/home/favorites/${encodeURIComponent(bookId)}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 5000,
        }
      );

      if (typeof res.data?.isFavorite !== 'boolean') {
        return { success: false, isFavorite: false, message: 'Máy chủ chưa xác nhận trạng thái yêu thích. Vui lòng thử lại.' };
      }
      const isFav = res.data.isFavorite;
      const message = res.data?.message || (isFav ? 'Đã thêm vào danh sách yêu thích!' : 'Đã xóa khỏi danh sách yêu thích!');

      // Đồng bộ vào Local Storage để phản hồi giao diện tức thì
      try {
        const raw = await getUserItem(KEY_FAVORITES_BOOKS);
        let list: any[] = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(list)) list = [];

        if (isFav) {
          if (!list.some((b: any) => String(b.id || b.bookId) === bookId)) {
            list.unshift({
              id: bookId,
              bookId: bookId,
              title: book.title,
              author: book.author || 'HALM BOOK',
              chapter: book.chapter || book.category_name || 'Yêu thích',
              img_url: book.img_url || '',
              coverImage: book.coverImage || book.img_url || '',
            });
          }
        } else {
          list = list.filter((b: any) => String(b.id || b.bookId) !== bookId);
        }
        await setUserItem(KEY_FAVORITES_BOOKS, JSON.stringify(list));
      } catch {}

      return { success: true, isFavorite: isFav, message };
    } catch (err: any) {
      console.warn('Lỗi gọi API toggleFavorite:', err?.response?.data || err?.message);
      // Nếu lỗi 404 (sách tự upload/chưa có trong database BE), lưu tạm ở local
      if (err?.response?.status === 404) {
        return toggleLocalFavorite(book);
      }
      return {
        success: false,
        isFavorite: false,
        message: err?.response?.data?.message || 'Không thể đồng bộ sách yêu thích với máy chủ.',
      };
    }
  }

  // 2. Trường hợp KHÁCH VÃNG LAI: Thông báo cần đăng nhập để đồng bộ lên Web
  return {
    success: false,
    isFavorite: false,
    requireLogin: true,
    message: 'Bạn cần đăng nhập để đồng bộ sách yêu thích lên tài khoản và Web!',
  };
};

/**
 * Xóa sách khỏi danh sách yêu thích
 */
export const removeFavoriteBook = async (
  bookId: string
): Promise<{ success: boolean; isFavorite: boolean; message: string }> => {
  if (!bookId) return { success: false, isFavorite: false, message: 'ID sách không hợp lệ.' };

  const token = await AsyncStorage.getItem('userToken');

  if (token) {
    try {
      const res = await axios.delete<{ isFavorite: boolean; message: string }>(
        `${API_BASE_URL}/api/home/favorites/${encodeURIComponent(bookId)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 4500,
        }
      );

      // Cập nhật local storage
      try {
        const raw = await getUserItem(KEY_FAVORITES_BOOKS);
        if (raw) {
          let list = JSON.parse(raw);
          if (Array.isArray(list)) {
            list = list.filter((b: any) => String(b.id || b.bookId) !== String(bookId));
            await setUserItem(KEY_FAVORITES_BOOKS, JSON.stringify(list));
          }
        }
      } catch {}

      return {
        success: true,
        isFavorite: false,
        message: res.data?.message || 'Đã xóa tác phẩm khỏi danh sách yêu thích!',
      };
    } catch (err: any) {
      // Fallback local
    }
  }

  // Fallback local
  try {
    const raw = await getUserItem(KEY_FAVORITES_BOOKS);
    if (raw) {
      let list = JSON.parse(raw);
      if (Array.isArray(list)) {
        list = list.filter((b: any) => String(b.id || b.bookId) !== String(bookId));
        await setUserItem(KEY_FAVORITES_BOOKS, JSON.stringify(list));
      }
    }
  } catch {}

  return { success: true, isFavorite: false, message: 'Đã xóa khỏi danh sách yêu thích!' };
};

/**
 * Hàm phụ: Lưu yêu thích cục bộ khi ngoại tuyến
 */
const toggleLocalFavorite = async (
  book: {
    id: string;
    title: string;
    author?: string;
    chapter?: string;
    category_name?: string;
    img_url?: string;
    coverImage?: string;
  }
) => {
  try {
    const raw = await getUserItem(KEY_FAVORITES_BOOKS);
    let list: any[] = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(list)) list = [];

    const bookId = String(book.id);
    const exists = list.some((b: any) => String(b.id || b.bookId) === bookId);

    if (exists) {
      list = list.filter((b: any) => String(b.id || b.bookId) !== bookId);
      await setUserItem(KEY_FAVORITES_BOOKS, JSON.stringify(list));
      return { success: true, isFavorite: false, message: 'Đã xóa tác phẩm khỏi danh sách Yêu Thích!' };
    } else {
      list.unshift({
        id: bookId,
        bookId: bookId,
        title: book.title,
        author: book.author || 'HALM BOOK',
        chapter: book.chapter || book.category_name || 'Yêu thích',
        img_url: book.img_url || '',
        coverImage: book.coverImage || book.img_url || '',
      });
      await setUserItem(KEY_FAVORITES_BOOKS, JSON.stringify(list));
      return { success: true, isFavorite: true, message: 'Đã thêm tác phẩm vào danh sách Yêu Thích!' };
    }
  } catch {
    return { success: false, isFavorite: false, message: 'Không thể cập nhật danh sách yêu thích.' };
  }
};

