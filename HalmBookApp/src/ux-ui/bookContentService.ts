export interface Chapter {
  id: number;
  title: string;
  subtitle: string;
  content: string[];
}

const BOOK_KEY_MAP: Record<string, string> = {
  // Danh Tác Kinh Điển
  'KD001': 'lo-tan-aq-chinh-truyen',

  // Hồi Ký & Lịch Sử
  'LS001': 'phan-chau-trinh-dao-duc-va-luan-ly-dong-tay',
  'LS002': 'nguyen-ai-quoc-duong-kach-menh',
  'LS003': 'phan-boi-chau-nguc-trung-thu-doi-cach-mang-phan-boi-chau',
  'LS004': 'phan-ke-binh-viet-nam-phong-tuc',

  // Phóng Sự & Xã Hội
  'PS001': 'vu-trong-phung-cam-bay-nguoi',
  'PS002': 'vu-trong-phung-com-thay-com-co',
  'PS003': 'thach-lam-ha-noi-bam-sau-pho-phuong',
  'PS004': 'vu-trong-phung-ky-nghe-lay-tay',
  'PS005': 'vu-trong-phung-luc-xi',
  'PS006': 'ngo-tat-to-tap-an-cai-dinh',
  'PS007': 'ngo-tat-to-viec-lang',

  // Tình Cảm & Tiểu Thuyết
  'TT001': 'ho-bieu-chanh-cha-con-nghia-nang',
  'TT002': 'ho-bieu-chanh-con-nha-ngheo',
  'TT003': 'vu-trong-phung-dut-tinh',
  'TT004': 'vu-trong-phung-lam-di',
  'TT005': 'vu-trong-phung-lay-nhau-vi-tinh',
  'TT006': 'khai-hung-nua-chung-xuan',
  'TT007': 'hoang-ngoc-phach-to-tam',

  // Văn Học Hiện Thực
  'VH001': 'nam-cao-chi-pheo',
  'VH002': 'vu-trong-phung-giong-to',
  'VH003': 'ngo-tat-to-leu-chong',
  'VH004': 'vu-trong-phung-so-do',
  'VH005': 'nam-cao-song-mon',
  'VH006': 'ngo-tat-to-tat-den',
  'VH007': 'vu-trong-phung-trung-so-doc-dac',
  'VH008': 'vu-trong-phung-vo-de',
};

const normalizeStr = (str: string) => {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
};

let cachedData: Record<string, any[]> | null = null;
const getRawBooksData = (): Record<string, any[]> => {
  if (!cachedData) {
    try {
      cachedData = require('../data/realBooksData.json');
    } catch {
      cachedData = {};
    }
  }
  return cachedData || {};
};

export const getBookRealChapters = (book: any): Chapter[] => {
  if (!book) {
    return [
      {
        id: 1,
        title: 'Giới thiệu tác phẩm',
        subtitle: 'HALM BOOK',
        content: ['Vui lòng chọn một cuốn sách từ thư viện để bắt đầu đọc.'],
      },
    ];
  }

  const rawData = getRawBooksData();
  const bookId = String(book.book_id || book.id || '').toUpperCase();

  // 1. Tìm theo ID trong BOOK_KEY_MAP
  if (bookId && BOOK_KEY_MAP[bookId] && rawData[BOOK_KEY_MAP[bookId]]) {
    const list = rawData[BOOK_KEY_MAP[bookId]];
    if (list && list.length > 0) return list;
  }

  // 2. Tìm theo tên file / slug khớp tiêu đề hoặc tác giả
  const bookTitleNorm = normalizeStr(book.title || book.bookName || '');
  if (bookTitleNorm) {
    for (const [key, chapters] of Object.entries(rawData)) {
      const keyNorm = normalizeStr(key);
      if (keyNorm.includes(bookTitleNorm) || bookTitleNorm.includes(keyNorm)) {
        if (chapters && chapters.length > 0) return chapters;
      }
    }
  }

  // 3. Nếu sách có mảng chapters sẵn
  if (Array.isArray(book.chapters) && book.chapters.length > 0) {
    return book.chapters.map((c: any, idx: number) => ({
      id: c.id || idx + 1,
      title: c.title || `Chương ${idx + 1}`,
      subtitle: c.subtitle || book.author || 'Tác phẩm văn học',
      content: Array.isArray(c.content) ? c.content : [String(c.content || '')],
    }));
  }

  // 4. Nếu sách thật từ database nhưng chưa được tách chương chi tiết
  const desc = book.description || book.desc || book.summary;
  const paragraphs = desc
    ? desc.split('\n').map((p: string) => p.trim()).filter((p: string) => p.length > 0)
    : [
        `Tác phẩm: ${book.title || book.bookName || 'Chưa có tiêu đề'}`,
        `Tác giả: ${book.author || 'HALM BOOK'}`,
        `Thể loại: ${book.category_name || book.tag || 'Sách văn học'}`,
        'Nội dung số hoá toàn văn của cuốn sách đang được hệ thống thư viện hoàn tất xử lý.',
      ];

  return [
    {
      id: 1,
      title: 'Chương 1 - Giới thiệu tác phẩm',
      subtitle: book.author ? `Tác giả: ${book.author}` : 'HALM BOOK',
      content: paragraphs,
    },
  ];
};

export const getBookChapterCount = (book: any): number => {
  const chapters = getBookRealChapters(book);
  return chapters && chapters.length > 0 ? chapters.length : 1;
};

export const getBookChapterLabel = (book: any): string => {
  if (!book) return 'Chưa cập nhật';
  const chapters = getBookRealChapters(book);
  const count = chapters?.length || 1;
  const bookId = String(book.book_id || book.id || '').toUpperCase();
  const title = String(book.title || book.bookName || '');

  if (bookId === 'VH001' || title.includes('Chí Phèo')) {
    return 'Truyện ngắn trọn bộ';
  }
  if (bookId === 'PS003' || title.includes('Hà Nội băm sáu')) {
    return `${count} bài tùy bút`;
  }
  if (bookId === 'LS001' || title.includes('Đạo đức và luân lý')) {
    return 'Diễn thuyết 2 phần';
  }
  if (bookId === 'LS002' || title.includes('Đường Kách Mệnh')) {
    return `${count} bài lý luận`;
  }
  if (bookId === 'PS006' || title.includes('Tập án cái đình')) {
    return `${count} vụ án`;
  }
  if (bookId === 'PS007' || title.includes('Việc làng')) {
    return `${count} thiên phóng sự`;
  }
  if (bookId === 'LS004' || title.includes('Việt Nam phong tục')) {
    return `${count} mục phong tục`;
  }
  return `${count} chương`;
};

