import { getUserItem, KEY_READING_BOOKS, setUserItem } from './userStorage';

// ============================================================================
// [GIẢI THÍCH CODE]: Khóa lưu trữ danh sách sách đang đọc thực tế của người dùng
// ============================================================================
export const READING_BOOKS_LIST_KEY = KEY_READING_BOOKS;

export interface ReadingBookRecord {
  id: string;
  title: string;
  author?: string;
  chapter?: string;
  img_url?: string;
  coverImage?: string | null;
  coverUri?: string | null;
  fileUri?: string;
  lastReadAt?: string;
}

/**
 * [GIẢI THÍCH CODE]: Tự động thêm cuốn sách vào danh sách "Sách đang đọc" theo tài khoản
 * Lưu đầy đủ ảnh bìa (img_url, coverImage hoặc coverUri của sách tải lên)
 * để hiển thị hoàn toàn đồng bộ trong Tủ sách.
 */
export const addToReadingList = async (book: Partial<ReadingBookRecord>): Promise<void> => {
  if (!book || !book.id || !book.title) return;
  try {
    const raw = await getUserItem(KEY_READING_BOOKS);
    let list: ReadingBookRecord[] = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(list)) list = [];

    // Tìm sách cũ đã có để bảo toàn ảnh bìa nếu sách mới truyền vào bị thiếu
    const existing = list.find(
      (b) => String(b.id) === String(book.id) || b.title === book.title
    );

    // Lọc bỏ sách cũ để đưa lên đầu danh sách
    list = list.filter(
      (b) => String(b.id) !== String(book.id) && b.title !== book.title
    );

    const resolvedImgUrl =
      book.img_url || (book as any).img || existing?.img_url || '';

    const resolvedCover =
      book.coverUri ||
      book.coverImage ||
      (book as any).cover ||
      existing?.coverUri ||
      existing?.coverImage ||
      null;

    // Chèn cuốn sách vừa nhấn đọc lên vị trí đầu tiên
    list.unshift({
      id: String(book.id),
      title: book.title,
      author: book.author || existing?.author || '',
      chapter: book.chapter || existing?.chapter || '',
      img_url: resolvedImgUrl,
      coverImage: resolvedCover,
      coverUri: resolvedCover,
      fileUri: book.fileUri || existing?.fileUri || '',
      lastReadAt: new Date().toISOString(),
    });

    await setUserItem(KEY_READING_BOOKS, JSON.stringify(list));
  } catch {
    // Không làm gián đoạn luồng đọc nếu lỗi lưu trữ
  }
};
