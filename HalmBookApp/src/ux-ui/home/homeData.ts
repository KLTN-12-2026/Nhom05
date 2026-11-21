import type { BookData } from '../navigation';
import { getBookChapterLabel } from '../bookContentService';

export interface HomeBookItem extends BookData {
  book_id?: string;
  bookName?: string;
  category_id?: number;
  updatedAt?: string;
  createdAt?: string;
}

const text = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim() ? value.trim() : undefined;

const realNumber = (value: unknown): number | undefined => {
  if (typeof value !== 'number' && typeof value !== 'string') return undefined;
  if (typeof value === 'string' && !value.trim()) return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
};

// Backend supplies ISO dates or yyyy-MM-dd HH:mm:ss. Reject invalid calendar dates.
export function homeDateTimestamp(value: unknown): number | undefined {
  const date = text(value);
  if (!date) return undefined;
  const match = date.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T].*)?$/);
  if (!match) return undefined;
  const [, year, month, day] = match.map(Number);
  const calendar = new Date(Date.UTC(year, month - 1, day));
  if (calendar.getUTCFullYear() !== year || calendar.getUTCMonth() !== month - 1 || calendar.getUTCDate() !== day) return undefined;
  const timestamp = Date.parse(date.replace(' ', 'T'));
  return Number.isFinite(timestamp) ? timestamp : undefined;
}

export function mapHomeBook(value: unknown, baseUrl: string): HomeBookItem | null {
  if (!value || typeof value !== 'object') return null;
  const item = value as Record<string, unknown>;
  const id = text(item.book_id) || text(item.id);
  const title = text(item.bookName) || text(item.title);
  // An invalid record is not a book with a made-up ID/title.
  if (!id || !title) return null;
  const rawImage = text(item.img_url) || text(item.img);
  const img_url = rawImage && !/^(https?:|data:|file:|content:)/i.test(rawImage)
    ? `${baseUrl.replace(/\/+$/, '')}/${rawImage.replace(/^\/+/, '')}` : rawImage;
  const rating = realNumber(item.rating);
  const reads = realNumber(item.read_count ?? item.readCount);
  const category = realNumber(item.category_id);
  const book: HomeBookItem = {
    id, book_id: id, title,
    author: text(item.author),
    img_url,
    description: text(item.description) || text(item.desc),
    category_id: category !== undefined && Number.isInteger(category) ? category : undefined,
    category_name: text(item.category_name),
    tag: text(item.category_name) || text(item.tag),
    price: realNumber(item.rent_price ?? item.price),
    rent_price: realNumber(item.rent_price),
    pages: realNumber(item.totalPages),
    rating: rating !== undefined && rating > 0 && rating <= 5 ? String(rating) : undefined,
    reads: reads !== undefined && Number.isInteger(reads) && reads >= 0 ? String(reads) : undefined,
    updatedAt: homeDateTimestamp(item.updatedAt ?? item.updated_at) !== undefined ? text(item.updatedAt ?? item.updated_at) : undefined,
    createdAt: homeDateTimestamp(item.createdAt ?? item.created_at) !== undefined ? text(item.createdAt ?? item.created_at) : undefined,
  };
  return { ...book, chapter: getBookChapterLabel(book) };
}

export function readHomePage(data: unknown, baseUrl: string): { books: HomeBookItem[]; totalPages: number } {
  const page = data && typeof data === 'object' ? data as Record<string, unknown> : null;
  const list = Array.isArray(data) ? data : Array.isArray(page?.content) ? page.content : Array.isArray(page?.data) ? page.data : null;
  if (!list) throw new Error('Dữ liệu sách trả về chưa đúng định dạng.');
  const total = realNumber(page?.totalPages);
  if (total !== undefined && (!Number.isInteger(total) || total < 0)) throw new Error('Thông tin phân trang chưa hợp lệ.');
  return {
    books: list.map(item => mapHomeBook(item, baseUrl)).filter((book): book is HomeBookItem => book !== null),
    totalPages: Math.max(1, total ?? 1),
  };
}

const updateTime = (book: HomeBookItem) => homeDateTimestamp(book.updatedAt) ?? homeDateTimestamp(book.createdAt);

export function getRecentHomeBooks(books: HomeBookItem[]): HomeBookItem[] {
  return books.filter(book => updateTime(book) !== undefined)
    .slice().sort((a, b) => updateTime(b)! - updateTime(a)!);
}

export function formatHomeBookDate(book: HomeBookItem): string | undefined {
  const timestamp = updateTime(book);
  if (timestamp === undefined) return undefined;
  const date = new Date(timestamp);
  return `${book.updatedAt ? 'Cập nhật' : 'Thêm ngày'} ${date.toLocaleDateString('vi-VN')}`;
}

export function getRankedHomeBooks(books: HomeBookItem[]): HomeBookItem[] {
  return books.filter(book => book.reads !== undefined && Number(book.reads) > 0)
    .slice().sort((a, b) => Number(b.reads) - Number(a.reads)).slice(0, 5);
}
