import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from './apiService';
import { Chapter } from './pdfExtractor';

// ============================================================================
// [GIẢI THÍCH CODE]: ĐỊNH NGHĨA DỮ LIỆU SÁCH TẢI LÊN & ĐỒNG BỘ HAI CHIỀU (WEB & APP)
// ============================================================================

export interface BookCategory {
  category_id: number;
  category_name: string;
}

export const DEFAULT_CATEGORIES: BookCategory[] = [
  { category_id: 1, category_name: 'Tài liệu cá nhân' },
  { category_id: 2, category_name: 'Phát triển bản thân' },
  { category_id: 3, category_name: 'Kinh tế & Kinh doanh' },
  { category_id: 4, category_name: 'Công nghệ & AI' },
  { category_id: 5, category_name: 'Tiểu thuyết kinh điển' },
  { category_id: 6, category_name: 'Văn học' },
  { category_id: 7, category_name: 'Tâm lý & Kỹ năng sống' },
  { category_id: 8, category_name: 'Thiếu nhi' },
  { category_id: 9, category_name: 'Lịch sử & Triết học' },
];

export interface UploadedBook {
  id: string;
  title: string;
  author: string;
  category?: string;
  categoryId?: number;
  description?: string;
  coverUri?: string;
  coverName?: string;
  coverImage?: string;
  img_url?: string;
  fileName: string;
  fileSize: string;
  fileUri?: string;
  pdf_url?: string;
  date: string;
  status: string;
  progress: number;
  chapters?: Chapter[];
  isSyncedWithBE?: boolean;
  beBookId?: string;
  isPersonal?: boolean;
}

export interface UploadBookPayload {
  title: string;
  author?: string;
  categoryId?: number;
  categoryName?: string;
  description?: string;
  fileUri: string;
  fileName: string;
  fileSize?: string;
  fileBytes?: number;
  mimeType?: string;
  coverUri?: string;
  coverName?: string;
}

export interface UploadResult {
  success: boolean;
  syncedWithBE: boolean;
  beBook?: any;
  message?: string;
  error?: string;
}

// ============================================================================
// [GIẢI THÍCH CODE]: 1. LẤY DANH MỤC THỂ LOẠI TỪ BACKEND (/api/admin/books/categories)
// ============================================================================
export const fetchBookCategories = async (): Promise<BookCategory[]> => {
  try {
    const res = await axios.get(`${API_BASE_URL}/api/admin/books/categories`, {
      timeout: 5000,
    });
    if (Array.isArray(res.data) && res.data.length > 0) {
      return res.data.map((c: any) => ({
        category_id: c.category_id || c.id,
        category_name: c.category_name || c.name || 'Chung',
      }));
    }
  } catch (err) {
    // Không kết nối được hoặc endpoint cần auth -> fallback danh mục mặc định
  }
  return DEFAULT_CATEGORIES;
};

// ============================================================================
// [GIẢI THÍCH CODE]: 2. TẢI FILE SÁCH LÊN BACKEND & CLOUDINARY
// Sử dụng endpoint chuẩn Backend: POST /api/admin/books (Multipart Form-Data)
// Nếu tài khoản có quyền hoặc endpoint mở -> Tự động lưu trữ Cloudinary & Database
// Nếu không -> Fallback lưu trữ an toàn ngoại tuyến trên thiết bị
// ============================================================================
export const uploadBookToBackend = async (payload: UploadBookPayload): Promise<UploadResult> => {
  try {
    const token = await AsyncStorage.getItem('userToken');

    const isEpub =
      payload.fileName.toLowerCase().endsWith('.epub') ||
      (payload.mimeType && payload.mimeType.toLowerCase().includes('epub'));

    const formData = new FormData();
    formData.append('bookName', payload.title.trim());
    formData.append('author', (payload.author && payload.author.trim()) ? payload.author.trim() : 'Tác giả tự do');
    
    if (payload.categoryId) {
      formData.append('category_id', String(payload.categoryId));
    }
    if (payload.description) {
      formData.append('description', payload.description.trim());
    }
    formData.append('fileFormat', isEpub ? 'EPUB' : 'PDF');
    formData.append('status', 'PUBLISHED');

    // Tệp nội dung sách (PDF / EPUB)
    formData.append('pdf', {
      uri: payload.fileUri,
      name: payload.fileName,
      type: isEpub ? 'application/epub+zip' : 'application/pdf',
    } as any);

    // Tệp ảnh bìa (nếu người dùng chọn từ thiết bị)
    if (payload.coverUri) {
      const ext = payload.coverName?.split('.').pop()?.toLowerCase() || 'jpg';
      const imgMime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
      formData.append('image', {
        uri: payload.coverUri,
        name: payload.coverName || `cover_${Date.now()}.${ext}`,
        type: imgMime,
      } as any);
    }

    const headers: Record<string, string> = {
      'Content-Type': 'multipart/form-data',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await axios.post(`${API_BASE_URL}/api/admin/books`, formData, {
      headers,
      timeout: 35000, // Timeout dài hơn để hỗ trợ upload file tài liệu lớn
    });

    if (res.status === 200 || res.status === 201) {
      return {
        success: true,
        syncedWithBE: true,
        beBook: res.data?.book,
        message: res.data?.message || 'Đồng bộ Cloudinary & Máy chủ thành công!',
      };
    }

    return {
      success: false,
      syncedWithBE: false,
      message: 'Máy chủ phản hồi trạng thái: ' + res.status,
    };
  } catch (err: any) {
    const errorMsg =
      err?.response?.data?.message ||
      err?.message ||
      'Không thể kết nối máy chủ để upload';

    return {
      success: false,
      syncedWithBE: false,
      error: errorMsg,
    };
  }
};

// ============================================================================
// ============================================================================
// [GIẢI THÍCH CODE]: 3. SÁCH TẢI LÊN LÀ TÀI LIỆU CÁ NHÂN CỦA NGƯỜI DÙNG
// Tuyệt đối không kéo sách mẫu của cửa hàng (/api/home/books) vào mục Sách tải lên
// ============================================================================
export const fetchBackendUploadedBooks = async (): Promise<UploadedBook[]> => {
  return [];
};

// ============================================================================
// [GIẢI THÍCH CODE]: 4. TRỘN (MERGE) DANH SÁCH SÁCH TẢI LÊN CỤC BỘ & TỪ BACKEND
// - Ưu tiên sách cục bộ (đã có trích xuất chi tiết chapters để đọc mượt mà)
// - Bổ sung các sách từ Web/Backend chưa có trong máy
// ============================================================================
export const mergeUploadedBooks = (
  localBooks: UploadedBook[],
  backendBooks: UploadedBook[]
): UploadedBook[] => {
  const mergedMap = new Map<string, UploadedBook>();

  // 1. Nạp sách cục bộ trước
  for (const book of localBooks) {
    mergedMap.set(book.id, book);
    if (book.beBookId) {
      mergedMap.set(book.beBookId, book);
    }
  }

  // 2. Trộn sách từ Backend vào nếu chưa tồn tại
  for (const beBook of backendBooks) {
    if (!mergedMap.has(beBook.id) && !mergedMap.has(beBook.beBookId || '')) {
      // Tìm xem có sách cục bộ nào khớp tên sách và tác giả không
      const matched = localBooks.find(
        (lb) =>
          lb.title.trim().toLowerCase() === beBook.title.trim().toLowerCase() &&
          lb.author.trim().toLowerCase() === beBook.author.trim().toLowerCase()
      );
      if (matched) {
        // Cập nhật thông tin đồng bộ BE cho sách cục bộ
        matched.beBookId = beBook.id;
        matched.isSyncedWithBE = true;
        if (!matched.coverUri && beBook.coverUri) matched.coverUri = beBook.coverUri;
        if (!matched.pdf_url && beBook.pdf_url) matched.pdf_url = beBook.pdf_url;
      } else {
        mergedMap.set(beBook.id, beBook);
      }
    }
  }

  return Array.from(mergedMap.values());
};
