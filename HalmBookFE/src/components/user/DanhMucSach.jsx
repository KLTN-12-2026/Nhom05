import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import UserLayout from '@/components/user/layout/UserLayout';
import axiosInstance from '@/services/axiosClient';
import { TOPICS, getTopicByKeyOrSlug, filterBooksByTopic } from '@/utils/categoryUtils';

export default function DanhMucSach() {
  const { topic: routeTopic } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Xác định chủ đề hiện tại từ params hoặc query string
  const currentTopicKey = routeTopic || searchParams.get('topic') || 'all';
  const currentTopic = useMemo(() => getTopicByKeyOrSlug(currentTopicKey), [currentTopicKey]);

  // State danh sách sách
  const [allBooks, setAllBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // State bộ lọc và tìm kiếm trong trang danh mục
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('popular'); // 'popular' | 'rating' | 'price-asc' | 'price-desc' | 'newest'
  const [priceFilter, setPriceFilter] = useState('all'); // 'all' | 'free' | 'under10' | '10plus'
  const [currentPage, setCurrentPage] = useState(1);
  const booksPerPage = 18;

  // Cuộn lên đầu trang tức thì mỗi khi đổi chủ đề (tránh trôi vị trí đè lấp navbar)
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    const timer = setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }, 40);
    setCurrentPage(1);
    setSearchQuery('');
    return () => clearTimeout(timer);
  }, [currentTopicKey]);

  // Tải danh sách sách từ backend API
  useEffect(() => {
    let isCancelled = false;
    const fetchBooks = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await axiosInstance.get('/api/home/books', {
          params: { pageNumber: 0, pageSize: 120 }
        });
        const payload = res.data;
        const rawBooks = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.content)
            ? payload.content
            : Array.isArray(payload?.data)
              ? payload.data
              : Array.isArray(payload?.books)
                ? payload.books
                : [];

        if (!isCancelled) {
          const normalized = rawBooks.map((item, idx) => ({
            ...item,
            id: item.book_id || item.id || `book-${idx}`,
            title: item.bookName || item.title || 'Tác phẩm',
            author: item.author || 'HALM BOOK',
            img: item.img_url || item.img || '/logo.png',
            price: item.price !== undefined ? item.price : (item.rent_price !== undefined ? item.rent_price : 10),
            rating: item.rating || (4.6 + (idx % 5) * 0.1).toFixed(1),
            desc: item.desc || item.description || '',
            weeklyReads: (1.9 - (idx % 8) * 0.18).toFixed(1)
          }));
          setAllBooks(normalized);
        }
      } catch (err) {
        if (!isCancelled) {
          console.warn('Lỗi tải danh mục sách:', err);
          setError('Không thể tải dữ liệu từ máy chủ. Vui lòng thử lại sau.');
        }
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };

    fetchBooks();
    return () => { isCancelled = true; };
  }, []);

  // Lọc sách theo chủ đề hiện tại
  const topicBooks = useMemo(() => {
    return filterBooksByTopic(allBooks, currentTopic.key);
  }, [allBooks, currentTopic]);

  // Lọc theo tìm kiếm, giá và sắp xếp
  const processedBooks = useMemo(() => {
    let list = [...topicBooks];

    // 1. Tìm kiếm theo từ khóa
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(b => 
        (b.title || '').toLowerCase().includes(q) || 
        (b.author || '').toLowerCase().includes(q) ||
        (b.desc || '').toLowerCase().includes(q)
      );
    }

    // 2. Lọc theo khoảng giá Khoai
    if (priceFilter === 'free') {
      list = list.filter(b => !b.price || Number(b.price) === 0);
    } else if (priceFilter === 'under10') {
      list = list.filter(b => Number(b.price) > 0 && Number(b.price) < 10);
    } else if (priceFilter === '10plus') {
      list = list.filter(b => Number(b.price) >= 10);
    }

    // 3. Sắp xếp
    if (sortBy === 'rating') {
      list.sort((a, b) => (Number(b.rating) || 5) - (Number(a.rating) || 5));
    } else if (sortBy === 'popular') {
      list.sort((a, b) => (Number(b.weeklyReads) || 1) - (Number(a.weeklyReads) || 1));
    } else if (sortBy === 'price-asc') {
      list.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    } else if (sortBy === 'price-desc') {
      list.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    } else if (sortBy === 'newest') {
      list.sort((a, b) => (b.id > a.id ? 1 : -1));
    }

    return list;
  }, [topicBooks, searchQuery, priceFilter, sortBy]);

  // Phân trang
  const totalPages = Math.ceil(processedBooks.length / booksPerPage) || 1;
  const paginatedBooks = useMemo(() => {
    const start = (currentPage - 1) * booksPerPage;
    return processedBooks.slice(start, start + booksPerPage);
  }, [processedBooks, currentPage, booksPerPage]);

  const handleSelectTopic = (key) => {
    navigate(`/danhmuc/${key}`);
  };

  return (
    <UserLayout>
      <div className="min-h-screen bg-[#FAF7F2] dark:bg-[#111210] text-[#1E1F1D] dark:text-[#EDE9DF] transition-colors pb-16">
        
        {/* ========================================================
           1. HERO BANNER CHỦ ĐỀ - Đảm bảo dãn cách đỉnh an toàn tuyệt đối với Navbar Fixed
           ======================================================== */}
        <section 
          className="relative overflow-hidden pb-12 sm:pb-16 bg-gradient-to-b from-[#8E3038]/10 via-transparent to-transparent dark:from-[#B8860B]/10 border-b border-[#E8E2D5] dark:border-[#2F322B]"
          style={{ paddingTop: 'calc(var(--navbar-height, 85px) + 38px)' }}
        >
          <div className="w-[94%] max-w-7xl mx-auto">
            
            {/* Breadcrumb Navigation - Dãn cách thông thoáng, độc lập, không bị Header Navbar che khuất */}
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-outfit font-semibold text-[#6E6D7A] dark:text-[#A8A6A1] mb-6 sm:mb-8 pt-1 sm:pt-2">
              <Link to="/" className="hover:text-[#8E3038] dark:hover:text-[#D4AF37] transition-colors flex items-center gap-1.5">
                <i className="ph-bold ph-house text-sm"></i> Trang Chủ
              </Link>
              <span className="text-stone-400 dark:text-stone-600">/</span>
              <Link to="/danhmuc/all" className="hover:text-[#8E3038] dark:hover:text-[#D4AF37] transition-colors">
                Danh Mục Sách
              </Link>
              <span className="text-stone-400 dark:text-stone-600">/</span>
              <span className="font-bold text-[#8E3038] dark:text-[#D4AF37]">{currentTopic.shortTitle}</span>
            </nav>

            {/* Topic Info Card */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2.5 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8E3038]/10 dark:bg-[#D4AF37]/15 border border-[#8E3038]/20 dark:border-[#D4AF37]/30 text-[#8E3038] dark:text-[#D4AF37] text-xs font-black tracking-widest uppercase">
                  <i className={`ph-bold ${currentTopic.icon} text-sm`}></i>
                  <span>{currentTopic.badge}</span>
                </div>
                <h1 className="font-outfit font-black text-2xl sm:text-3xl lg:text-4xl text-[#1E1F1D] dark:text-[#EDE9DF] leading-tight tracking-normal">
                  {currentTopic.title}
                </h1>
                <p className="text-xs sm:text-sm text-[#6E6D7A] dark:text-[#A8A6A1] leading-relaxed">
                  {currentTopic.subtitle}
                </p>
              </div>

              {/* Stats Box */}
              <div className="flex items-center gap-4 bg-white/70 dark:bg-[#1E201B]/80 backdrop-blur-md p-4 rounded-2xl border border-[#E8E2D5] dark:border-[#2F322B] shadow-sm shrink-0">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#8E3038] to-[#A83B46] dark:from-[#B8860B] dark:to-[#D4AF37] text-white dark:text-[#111210] flex items-center justify-center text-2xl shadow-md">
                  <i className={`ph-fill ${currentTopic.icon}`}></i>
                </div>
                <div>
                  <span className="text-[11px] uppercase font-bold text-[#6E6D7A] dark:text-[#A8A6A1] block">
                    Ấn Phẩm Hiện Có
                  </span>
                  <div className="text-xl sm:text-2xl font-black font-outfit text-[#1E1F1D] dark:text-[#EDE9DF]">
                    {loading ? '...' : processedBooks.length}{' '}
                    <span className="text-xs font-semibold text-[#8E3038] dark:text-[#D4AF37]">tác phẩm</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Category Quick Filter Pills Bar */}
            <div className="mt-8 pt-6 border-t border-[#E8E2D5]/70 dark:border-[#2F322B]/70">
              <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar" style={{ scrollbarWidth: 'none' }}>
                {TOPICS.map((topic) => {
                  const isActive = currentTopic.key === topic.key;
                  return (
                    <button
                      key={topic.key}
                      type="button"
                      onClick={() => handleSelectTopic(topic.key)}
                      className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-outfit font-bold flex items-center gap-2 transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#8E3038] text-white shadow-md shadow-[#8E3038]/25 dark:bg-[#B8860B] dark:text-[#111210]'
                          : 'bg-white/80 dark:bg-[#1E201B] text-[#6E6D7A] dark:text-[#A8A6A1] border border-[#E8E2D5] dark:border-[#2F322B] hover:border-[#8E3038]/40 dark:hover:border-[#D4AF37]/40 hover:text-[#1E1F1D] dark:hover:text-[#EDE9DF]'
                      }`}
                    >
                      <i className={`ph-bold ${topic.icon} text-sm ${isActive ? 'text-amber-200 dark:text-[#111210]' : ''}`}></i>
                      <span>{topic.shortTitle}</span>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        </section>

        {/* ========================================================
           2. TOOLBAR: TÌM KIẾM & BỘ LỌC
           ======================================================== */}
        <section className="py-6 sm:py-7 border-b border-[#E8E2D5]/60 dark:border-[#2F322B]/60">
          <div className="w-[94%] max-w-7xl mx-auto flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
            
            {/* Search Input In Category */}
            <div className="relative flex-1 max-w-md">
              <i className="ph-bold ph-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[#6E6D7A] dark:text-[#A8A6A1]"></i>
              <input
                type="text"
                placeholder={`Tìm kiếm trong ${currentTopic.title}...`}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-white dark:bg-[#1E201B] border border-[#E8E2D5] dark:border-[#2F322B] text-xs font-outfit text-[#1E1F1D] dark:text-[#EDE9DF] focus:outline-none focus:ring-2 focus:ring-[#8E3038]/30 dark:focus:ring-[#D4AF37]/30 transition shadow-sm"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6E6D7A] hover:text-[#1E1F1D] dark:hover:text-white text-xs"
                >
                  <i className="ph-bold ph-x-circle text-sm"></i>
                </button>
              )}
            </div>

            {/* Filters & Sorting */}
            <div className="flex flex-wrap items-center gap-3 text-xs font-outfit">
              {/* Lọc Giá Khoai */}
              <div className="flex items-center gap-1.5 bg-white dark:bg-[#1E201B] px-3 py-2 rounded-xl border border-[#E8E2D5] dark:border-[#2F322B]">
                <span className="text-[#6E6D7A] dark:text-[#A8A6A1] font-medium">Khoai:</span>
                <select
                  value={priceFilter}
                  onChange={(e) => {
                    setPriceFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-transparent font-bold text-[#1E1F1D] dark:text-[#EDE9DF] focus:outline-none cursor-pointer"
                >
                  <option value="all">Tất cả mức giá</option>
                  <option value="free">Miễn phí 0 Khoai</option>
                  <option value="under10">Dưới 10 Khoai</option>
                  <option value="10plus">Từ 10 Khoai trở lên</option>
                </select>
              </div>

              {/* Sắp xếp */}
              <div className="flex items-center gap-1.5 bg-white dark:bg-[#1E201B] px-3 py-2 rounded-xl border border-[#E8E2D5] dark:border-[#2F322B]">
                <span className="text-[#6E6D7A] dark:text-[#A8A6A1] font-medium">Sắp xếp:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-transparent font-bold text-[#1E1F1D] dark:text-[#EDE9DF] focus:outline-none cursor-pointer"
                >
                  <option value="popular">Lượt đọc nhiều nhất 🔥</option>
                  <option value="rating">Đánh giá cao nhất ⭐</option>
                  <option value="newest">Mới cập nhật 🆕</option>
                  <option value="price-asc">Giá Khoai tăng dần 🥔</option>
                  <option value="price-desc">Giá Khoai giảm dần 🥔</option>
                </select>
              </div>

              {/* Reset filter nếu có thay đổi */}
              {(searchQuery || priceFilter !== 'all' || sortBy !== 'popular') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setPriceFilter('all');
                    setSortBy('popular');
                  }}
                  className="px-3 py-2 rounded-xl text-rose-600 dark:text-rose-400 font-bold hover:bg-rose-50 dark:hover:bg-rose-950/30 transition flex items-center gap-1 cursor-pointer"
                >
                  <i className="ph-bold ph-arrow-counter-clockwise"></i>
                  <span>Đặt lại</span>
                </button>
              )}
            </div>

          </div>
        </section>

        {/* ========================================================
           3. LƯỚI SÁCH (GRID LAYOUT)
           ======================================================== */}
        <section className="pt-10 pb-16 sm:pt-12 sm:pb-20">
          <div className="w-[94%] max-w-7xl mx-auto">
            
            {loading ? (
              <div className="py-20 text-center space-y-3">
                <i className="ph-bold ph-spinner-gap text-3xl text-[#8E3038] dark:text-[#D4AF37] animate-spin inline-block"></i>
                <p className="text-xs font-outfit font-bold text-[#6E6D7A] dark:text-[#A8A6A1]">
                  Đang nạp toàn bộ tác phẩm trong chủ đề...
                </p>
              </div>
            ) : error ? (
              <div className="py-16 text-center space-y-3 p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 max-w-md mx-auto">
                <i className="ph-bold ph-warning-circle text-3xl text-rose-600"></i>
                <p className="text-xs font-outfit text-rose-600 dark:text-rose-400 font-bold">{error}</p>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-[#8E3038] text-white rounded-xl text-xs font-bold"
                >
                  Thử lại
                </button>
              </div>
            ) : paginatedBooks.length === 0 ? (
              /* Empty state */
              <div className="py-20 text-center space-y-3 p-8 rounded-3xl bg-white dark:bg-[#1E201B] border border-dashed border-[#E8E2D5] dark:border-[#2F322B] max-w-lg mx-auto">
                <div className="w-16 h-16 rounded-2xl bg-[#8E3038]/10 dark:bg-[#D4AF37]/15 text-[#8E3038] dark:text-[#D4AF37] flex items-center justify-center text-3xl mx-auto">
                  <i className="ph-bold ph-book-open"></i>
                </div>
                <h3 className="font-serif font-black text-base text-[#1E1F1D] dark:text-[#EDE9DF]">
                  Chưa tìm thấy tác phẩm phù hợp
                </h3>
                <p className="text-xs text-[#6E6D7A] dark:text-[#A8A6A1] max-w-sm mx-auto">
                  Không có cuốn sách nào khớp với bộ lọc hoặc từ khóa tìm kiếm của bạn trong chủ đề này.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setPriceFilter('all');
                    setSortBy('popular');
                  }}
                  className="px-4 py-2 bg-[#8E3038] dark:bg-[#B8860B] text-white dark:text-[#111210] rounded-xl text-xs font-outfit font-black tracking-wider uppercase transition shadow cursor-pointer"
                >
                  Xem Toàn Bộ Sách
                </button>
              </div>
            ) : (
              /* Lưới sách responsive */
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5 sm:gap-6 lg:gap-7">
                {paginatedBooks.map((book, idx) => {
                  const bookPrice = book.price !== undefined && book.price > 0 ? `${book.price} Khoai` : 'Miễn phí';
                  const isTopRank = currentTopic.key === 'trending' && (currentPage === 1 && idx < 3);

                  return (
                    <div
                      key={book.id || idx}
                      onClick={() => navigate(`/chitietsach/${book.id}`)}
                      className="group relative p-3 sm:p-4 rounded-2xl bg-white dark:bg-[#1E201B] border border-[#E8E2D5] dark:border-[#2F322B] hover:border-[#8E3038]/50 dark:hover:border-[#D4AF37]/50 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between cursor-pointer"
                    >
                      {/* Top Rank Badge cho trang Trending */}
                      {isTopRank && (
                        <div className={`absolute -top-2.5 -left-2 z-20 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-outfit font-black shadow-lg ${
                          idx === 0 
                            ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 border border-yellow-200' 
                            : idx === 1 
                              ? 'bg-gradient-to-r from-slate-200 to-slate-400 text-slate-900 border border-white' 
                              : 'bg-gradient-to-r from-amber-700 to-orange-700 text-white border border-amber-300'
                        }`}>
                          <span>{idx === 0 ? '👑 TOP 1' : idx === 1 ? '🥈 TOP 2' : '🥉 TOP 3'}</span>
                        </div>
                      )}

                      <div>
                        {/* Book Cover */}
                        <div 
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/chitietsach/${book.id}`);
                          }}
                          className="relative w-full aspect-[2/3] rounded-xl overflow-hidden bg-[#111210] shadow-md mb-3 sm:mb-3.5 cursor-pointer"
                        >
                          <img
                            src={book.img || '/logo.png'}
                            alt={book.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                            onError={(e) => { e.currentTarget.src = '/logo.png'; }}
                          />
                          {/* Rating badge */}
                          <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-full bg-black/70 backdrop-blur-sm text-[9px] text-amber-300 font-bold flex items-center gap-0.5 shadow">
                            <i className="ph-fill ph-star text-amber-400"></i> {book.rating || '5.0'}
                          </div>
                          {/* Weekly reads */}
                          <div className="absolute bottom-1.5 inset-x-1.5 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-sm text-[9px] text-emerald-300 font-medium flex items-center justify-between">
                            <span className="flex items-center gap-1">🔥 {book.weeklyReads}k đọc</span>
                            <span className="text-[8px] text-gray-300 uppercase">Tuần</span>
                          </div>
                        </div>

                        {/* Title & Author */}
                        <div className="space-y-0.5">
                          <h3
                            className="font-outfit font-bold text-xs sm:text-[13px] text-[#1E1F1D] dark:text-[#EDE9DF] line-clamp-1 group-hover:text-[#8E3038] dark:group-hover:text-[#D4AF37] transition-colors"
                            title={book.title}
                          >
                            <Link to={`/chitietsach/${book.id}`} onClick={(e) => e.stopPropagation()}>
                              {book.title}
                            </Link>
                          </h3>
                          <p className="font-outfit text-[11px] text-[#6E6D7A] dark:text-[#A8A6A1] line-clamp-1">
                            {book.author}
                          </p>
                        </div>
                      </div>

                      {/* Price & Action */}
                      <div className="pt-2 mt-2 border-t border-[#E8E2D5]/70 dark:border-[#2F322B]/70 flex items-center justify-between">
                        <div>
                          <span className="font-outfit font-black text-[11px] sm:text-xs text-[#8E3038] dark:text-[#D4AF37] flex items-center gap-0.5">
                            <span>🥔</span> {bookPrice}
                          </span>
                          <span className="text-[9px] text-[#6E6D7A] dark:text-[#A8A6A1] block leading-none">
                            {book.price > 0 ? '/ tuần' : 'Trọn đời'}
                          </span>
                        </div>
                        <span className="w-6 h-6 rounded-full bg-[#FAF7F2] dark:bg-[#2C2E29] group-hover:bg-[#8E3038] group-hover:text-white dark:group-hover:bg-[#D4AF37] dark:group-hover:text-[#111210] flex items-center justify-center text-[10px] text-[#1E1F1D] dark:text-[#EDE9DF] transition-colors">
                          <i className="ph-bold ph-caret-right"></i>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination Controls */}
            {!loading && totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className="px-3.5 py-2 rounded-xl text-xs font-outfit font-bold border border-[#E8E2D5] dark:border-[#2F322B] bg-white dark:bg-[#1E201B] hover:bg-[#FAF7F2] dark:hover:bg-[#2C2E29] disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <i className="ph-bold ph-caret-left mr-1"></i> Trang Trước
                </button>

                <div className="flex items-center gap-1 text-xs font-outfit font-bold">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                    if (
                      p === 1 || 
                      p === totalPages || 
                      (p >= currentPage - 1 && p <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setCurrentPage(p)}
                          className={`w-8 h-8 rounded-xl transition ${
                            currentPage === p
                              ? 'bg-[#8E3038] text-white dark:bg-[#B8860B] dark:text-[#111210]'
                              : 'bg-white dark:bg-[#1E201B] border border-[#E8E2D5] dark:border-[#2F322B] text-[#6E6D7A] dark:text-[#A8A6A1] hover:text-[#1E1F1D] dark:hover:text-white'
                          }`}
                        >
                          {p}
                        </button>
                      );
                    }
                    if (p === currentPage - 2 || p === currentPage + 2) {
                      return <span key={p} className="px-1 text-slate-400">...</span>;
                    }
                    return null;
                  })}
                </div>

                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  className="px-3.5 py-2 rounded-xl text-xs font-outfit font-bold border border-[#E8E2D5] dark:border-[#2F322B] bg-white dark:bg-[#1E201B] hover:bg-[#FAF7F2] dark:hover:bg-[#2C2E29] disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Trang Sau <i className="ph-bold ph-caret-right ml-1"></i>
                </button>
              </div>
            )}

          </div>
        </section>

      </div>
    </UserLayout>
  );
}
