/**
 * categoryUtils.js
 * Quản lý danh mục chủ đề sách, từ điển mapping và hàm phân loại sách thông minh
 */

export const TOPICS = [
  {
    key: 'all',
    slug: 'tat-ca',
    title: 'Tất Cả Tác Phẩm',
    shortTitle: 'Tất Cả',
    subtitle: 'Khám phá toàn bộ kho tàng tri thức và ấn phẩm bản quyền chọn lọc tại HALM Book',
    icon: 'ph-books',
    badge: 'KHO SÁCH',
    color: 'from-amber-700 via-amber-800 to-amber-950',
    categoryId: null
  },
  {
    key: 'trending',
    slug: 'trending',
    title: 'Bảng Xếp Hạng Thịnh Hành',
    shortTitle: 'Thịnh Hành',
    subtitle: 'Top các ấn phẩm được độc giả đón đọc nhiều nhất và nhận đánh giá tích cực trong tuần',
    icon: 'ph-fire',
    badge: 'BẢNG VÀNG',
    color: 'from-rose-600 via-red-700 to-amber-900',
    categoryId: null
  },
  {
    key: 'van-hoc',
    slug: 'van-hoc',
    title: 'Văn Học & Tiểu Thuyết',
    shortTitle: 'Văn Học',
    subtitle: 'Chạm đến chiều sâu cảm xúc với những tuyệt phẩm văn chương kinh điển và hiện đại',
    icon: 'ph-feather',
    badge: 'VĂN HỌC',
    color: 'from-amber-800 via-rose-900 to-stone-900',
    categoryId: 1,
    matcher: (b) => b.category_id === 1 || /văn học|tiểu thuyết|truyện|nhật ánh|hoa nở|chuyện tình|thơ|hư cấu/i.test((b.title || b.bookName || '') + ' ' + (b.author || '') + ' ' + (b.desc || ''))
  },
  {
    key: 'thieu-nhi',
    slug: 'thieu-nhi',
    title: 'Thế Giới Tuổi Thơ & Thiếu Nhi',
    shortTitle: 'Thiếu Nhi',
    subtitle: 'Nuôi dưỡng trí tưởng tượng phong phú và nhân cách đẹp từ những trang sách tuổi thơ',
    icon: 'ph-balloon',
    badge: 'TUỔI THƠ',
    color: 'from-sky-700 via-blue-800 to-indigo-950',
    categoryId: 2,
    matcher: (b) => b.category_id === 2 || /thiếu nhi|tuổi thơ|dế mèn|hoàng tử|alice|cổ tích|tô hoài|đồng thoại/i.test((b.title || b.bookName || '') + ' ' + (b.author || '') + ' ' + (b.desc || ''))
  },
  {
    key: 'ky-nang',
    slug: 'ky-nang',
    aliases: ['phat-trien', 'selfgrowth'],
    title: 'Kỹ Năng & Phát Triển Bản Thân',
    shortTitle: 'Kỹ Năng',
    subtitle: 'Rèn giũa bản lĩnh, làm chủ thói quen tích cực và khai phóng tiềm năng tư duy vượt trội',
    icon: 'ph-brain',
    badge: 'KỸ NĂNG',
    color: 'from-emerald-700 via-teal-800 to-slate-900',
    categoryId: 3,
    matcher: (b) => b.category_id === 3 || /kỹ năng|phát triển|sống|thói quen|đắc nhân|carnegie|tư duy|lãnh đạo/i.test((b.title || b.bookName || '') + ' ' + (b.author || '') + ' ' + (b.desc || ''))
  },
  {
    key: 'khoa-hoc',
    slug: 'khoa-hoc',
    aliases: ['science'],
    title: 'Khoa Học & Vũ Trụ',
    shortTitle: 'Khoa Học',
    subtitle: 'Hành trình vén màn bí ẩn vũ trụ, công nghệ tương lai và những quy luật tự nhiên kỳ vĩ',
    icon: 'ph-planet',
    badge: 'KHOA HỌC',
    color: 'from-indigo-800 via-purple-900 to-slate-950',
    categoryId: 4,
    matcher: (b) => b.category_id === 4 || /khoa học|vũ trụ|thiên văn|vật lý|công nghệ|toán|sinh học|ai/i.test((b.title || b.bookName || '') + ' ' + (b.author || '') + ' ' + (b.desc || ''))
  },
  {
    key: 'kinh-doanh',
    slug: 'kinh-doanh',
    aliases: ['business'],
    title: 'Kinh Tế & Khởi Nghiệp',
    shortTitle: 'Kinh Doanh',
    subtitle: 'Tư duy tài chính sắc bén, nguyên lý đầu tư thực chiến và chiến lược bứt phá kinh doanh',
    icon: 'ph-briefcase',
    badge: 'KINH TẾ',
    color: 'from-amber-600 via-yellow-700 to-amber-950',
    categoryId: 5,
    matcher: (b) => b.category_id === 5 || /kinh tế|kinh doanh|khởi nghiệp|tài chính|đầu tư|graham|tiền|marketing|chứng khoán/i.test((b.title || b.bookName || '') + ' ' + (b.author || '') + ' ' + (b.desc || ''))
  },
  {
    key: 'lich-su',
    slug: 'lich-su',
    aliases: ['history'],
    title: 'Lịch Sử & Văn Hóa',
    shortTitle: 'Lịch Sử',
    subtitle: 'Ngược dòng thời gian chiêm ngưỡng di sản hào hùng, văn hóa ngàn năm và bài học thời đại',
    icon: 'ph-hourglass-high',
    badge: 'LỊCH SỬ',
    color: 'from-amber-800 via-yellow-900 to-stone-900',
    categoryId: 6,
    matcher: (b) => b.category_id === 6 || /lịch sử|văn hóa|sử việt|chiến tranh|thế giới|triều đại|di sản/i.test((b.title || b.bookName || '') + ' ' + (b.author || '') + ' ' + (b.desc || ''))
  },
  {
    key: 'triet-hoc',
    slug: 'triet-hoc',
    aliases: ['philosophy'],
    title: 'Tâm Lý & Triết Học',
    shortTitle: 'Triết Học',
    subtitle: 'Thấu hiểu nội tâm sâu kín, triết lý nhân sinh và nghệ thuật sống an nhiên giữa biến động',
    icon: 'ph-compass',
    badge: 'TRIẾT HỌC',
    color: 'from-stone-700 via-slate-800 to-stone-950',
    categoryId: 7,
    matcher: (b) => b.category_id === 7 || /triết học|tâm lý|nhận thức|ý thức|epictetus|thiền|tâm hồn|khắc kỷ/i.test((b.title || b.bookName || '') + ' ' + (b.author || '') + ' ' + (b.desc || ''))
  },
  {
    key: 'nghe-thuat',
    slug: 'nghe-thuat',
    aliases: ['artlifestyle'],
    title: 'Nghệ Thuật & Lối Sống',
    shortTitle: 'Nghệ Thuật',
    subtitle: 'Thưởng lãm vẻ đẹp hội họa, kiến trúc, nhiếp ảnh và định hình phong cách sống tinh hoa',
    icon: 'ph-palette',
    badge: 'NGHỆ THUẬT',
    color: 'from-rose-800 via-pink-900 to-stone-900',
    categoryId: 8,
    matcher: (b) => b.category_id === 8 || /nghệ thuật|lối sống|hội họa|âm nhạc|nhiếp ảnh|thẩm mỹ|thiết kế|ẩm thực/i.test((b.title || b.bookName || '') + ' ' + (b.author || '') + ' ' + (b.desc || ''))
  },
  {
    key: 'hoi-ky',
    slug: 'hoi-ky',
    aliases: ['biography'],
    title: 'Hồi Ký & Danh Nhân',
    shortTitle: 'Hồi Ký',
    subtitle: 'Học hỏi từ cuộc đời, bài học đắt giá và dấu ấn di sản của những vĩ nhân lỗi lạc thế giới',
    icon: 'ph-user-focus',
    badge: 'HỒI KÝ',
    color: 'from-slate-700 via-zinc-800 to-slate-950',
    categoryId: 9,
    matcher: (b) => b.category_id === 9 || /tiểu sử|hồi ký|danh nhân|tự truyện|cuộc đời|nhân vật/i.test((b.title || b.bookName || '') + ' ' + (b.author || '') + ' ' + (b.desc || ''))
  }
];

/**
 * Tìm kiếm cấu hình Topic theo slug, key hoặc alias
 */
export const getTopicByKeyOrSlug = (identifier) => {
  if (!identifier || identifier === 'all' || identifier === 'tat-ca') {
    return TOPICS[0];
  }
  const normalized = String(identifier).trim().toLowerCase();
  const found = TOPICS.find(t => 
    t.key === normalized || 
    t.slug === normalized || 
    (t.aliases && t.aliases.includes(normalized))
  );
  return found || TOPICS[0];
};

/**
 * Lọc danh sách sách theo chủ đề tương ứng
 */
export const filterBooksByTopic = (books, topicKey) => {
  if (!Array.isArray(books) || books.length === 0) return [];
  if (!topicKey || topicKey === 'all' || topicKey === 'tat-ca') {
    return books;
  }
  if (topicKey === 'trending') {
    // Sắp xếp theo rating hoặc lượt đọc
    return [...books].sort((a, b) => (Number(b.rating) || 5) - (Number(a.rating) || 5));
  }

  const topic = getTopicByKeyOrSlug(topicKey);
  if (!topic || !topic.matcher) {
    return books;
  }

  const filtered = books.filter(b => topic.matcher(b));
  // Nếu bộ lọc từ khóa chưa có kết quả (kho sách mới), fallback lấy một phần sách
  if (filtered.length === 0) {
    const topicIndex = TOPICS.findIndex(t => t.key === topic.key);
    const step = Math.max(1, Math.floor(books.length / TOPICS.length));
    const start = Math.max(0, (topicIndex * step) % books.length);
    return books.slice(start, start + Math.min(books.length, 12));
  }
  return filtered;
};
