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
// [GIẢI THÍCH CODE]: 1. LẤY DANH MỤC THỂ LOẠI TỪ BACKEND (/api/home/categories)
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

/** Personal documents stay in this device's private bookshelf. Catalog publishing is admin-only. */
export const uploadBookToBackend = async (_payload: UploadBookPayload): Promise<UploadResult> => ({
  success: false,
  syncedWithBE: false,
  message: 'Sách cá nhân được lưu trên thiết bị này; chưa hỗ trợ đồng bộ Web/App.',
});

/** There is no personal-document sync endpoint in the current backend. */
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
