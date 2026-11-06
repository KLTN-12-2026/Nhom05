import React, { useEffect, useMemo, useState } from 'react';
import axiosInstance from '@/services/axiosClient';
import { useLegacyAdminPage } from './legacy-runtime';

const DEFAULT_CATEGORIES = [
  { category_id: 1, category_name: 'Phát triển bản thân' },
  { category_id: 2, category_name: 'Kinh tế & Kinh doanh' },
  { category_id: 3, category_name: 'Công nghệ & AI' },
  { category_id: 4, category_name: 'Tiểu thuyết kinh điển' },
  { category_id: 5, category_name: 'Văn học' },
  { category_id: 6, category_name: 'Tâm lý & Kỹ năng sống' },
  { category_id: 7, category_name: 'Thiếu nhi' },
  { category_id: 8, category_name: 'Lịch sử & Triết học' }
];

const EMPTY_FORM = {
  bookName: '',
  author: '',
  publisher: '',
  isbn: '',
  yearOfPublished: '',
  totalPages: '',
  rent_price: '',
  description: '',
  category_id: '',
  status: 'PUBLISHED',
  image: null,
  pdf: null,
  fileFormat: 'PDF',
  currentCoverUrl: '',
  currentPdfUrl: ''
};

function getApiMessage(error, fallback) {
  return error.response?.data?.message || error.response?.data?.error || fallback;
}

function formatBookDate(value) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString('vi-VN');
}

function normalizeBook(book) {
  const rawSize = book.fileSize ?? book.fileSizeMb ?? book.pdf_size ?? book.size ?? '';
  const rawReads = book.reads ?? book.viewCount ?? book.readCount ?? book.read_count ?? 0;
  const rawDate = book.uploadDate ?? book.createdAt ?? book.created_at ?? '';
  const displaySize = typeof rawSize === 'number'
    ? `${rawSize} MB`
    : (String(rawSize).endsWith('MB') || String(rawSize).endsWith('KB')
      ? String(rawSize)
      : (rawSize ? `${rawSize} MB` : ''));

  const rawFormat = (book.fileFormat || '').toUpperCase();
  const format = rawFormat
    ? rawFormat
    : (book.pdf_url
        ? (book.pdf_url.toLowerCase().includes('.epub') ? 'EPUB' : 'PDF')
        : 'Chưa có file');

  return {
    ...book,
    id: book.book_id || book.id,
    title: book.bookName || book.title || 'Chưa có tên sách',
    coverUrl: book.img_url || book.coverUrl || '/logo.png',
    category: book.category_name || book.category || 'Chưa phân loại',
    category_id: book.category_id || '',
    format,
    fileFormat: format,
    fileSize: displaySize || (book.pdf_url ? format : '—'),
    reads: Number(rawReads) || 0,
    status: book.status || (book.pdf_url ? 'PUBLISHED' : 'DRAFT'),
    uploadDate: rawDate,
    isbn: book.isbn || '',
    totalPages: book.totalPages || '',
    rent_price: book.rent_price || '',
    description: book.description || '',
    pdf_url: book.pdf_url || '',
    img_url: book.img_url || ''
  };
}

export default function QuanLySach() {
  useLegacyAdminPage('QuanLySach.html', '', false);

  const [books, setBooks] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [query, setQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [formatFilter, setFormatFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal State (Thêm & Chỉnh sửa sách)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [editingBookId, setEditingBookId] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const availableCategories = useMemo(() => {
    return categoriesList.length > 0 ? categoriesList : DEFAULT_CATEGORIES;
  }, [categoriesList]);

  const loadBooks = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await axiosInstance.get('/api/admin/books', {
        params: { pageNumber: 0, pageSize: 1000 }
      });
      const payload = response.data;
      const items = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.content)
          ? payload.content
          : [];
      setBooks(items.map(normalizeBook));
    } catch (requestError) {
      setError(getApiMessage(requestError, 'Không thể tải danh sách sách từ máy chủ.'));
    } finally {
      setIsLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const res = await axiosInstance.get('/api/admin/books/categories');
      if (Array.isArray(res.data) && res.data.length > 0) {
        setCategoriesList(res.data);
      }
    } catch (err) {
      console.warn('Không thể tải danh sách thể loại từ server:', err);
    }
  };

  useEffect(() => {
    loadBooks();
    loadCategories();
  }, []);

  const filteredBooks = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return books.filter((book) =>
      [book.id, book.title, book.author, book.category, book.isbn]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedQuery))
      && (!categoryFilter || book.category === categoryFilter)
      && (!formatFilter || book.format === formatFilter)
      && (timeFilter !== 'month' || (() => {
        const dateValue = book.uploadDate && book.uploadDate !== '—'
          ? new Date(book.uploadDate)
          : null;
        return dateValue && !Number.isNaN(dateValue.getTime())
          && Date.now() - dateValue.getTime() <= 30 * 24 * 60 * 60 * 1000;
      })())
    );
  }, [books, query, timeFilter, categoryFilter, formatFilter]);

  const pageSize = 8;
  const totalPages = Math.max(1, Math.ceil(filteredBooks.length / pageSize));
  const visibleBooks = filteredBooks.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [query, timeFilter, categoryFilter, formatFilter]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const categories = useMemo(
    () => [...new Set(books.map((book) => book.category).filter(Boolean))].sort(),
    [books]
  );

  const resetFilters = () => {
    setQuery('');
    setTimeFilter('all');
    setCategoryFilter('');
    setFormatFilter('');
  };

  const exportBooks = async () => {
    const columns = [
      { key: 'id', label: 'ID', isPrimary: true },
      { key: 'coverUrl', label: 'Bìa sách', isPrimary: false },
      { key: 'title', label: 'Tên đầu sách', isPrimary: true },
      { key: 'author', label: 'Tác giả', isPrimary: true },
      { key: 'isbn', label: 'Mã ISBN', isPrimary: false },
      { key: 'category', label: 'Thể loại', isPrimary: true },
      { key: 'format', label: 'Định dạng', isPrimary: true },
      { key: 'fileSize', label: 'Dung lượng', isPrimary: false },
      { key: 'reads', label: 'Lượt đọc', isPrimary: false },
      { key: 'status', label: 'Trạng thái', isPrimary: true },
      { key: 'uploadDate', label: 'Ngày thêm', isPrimary: false }
    ];
    const exportResult = await window.AdminUI?.showExportModal?.({
      title: 'Cài đặt xuất danh sách sách',
      datasetName: 'Kho sách',
      defaultFilename: 'HALMBOOK_Danh-sach-sach.csv',
      currentFilterDesc: `${filteredBooks.length} sách phù hợp với bộ lọc hiện tại`,
      totalCount: books.length,
      filteredCount: filteredBooks.length,
      columns,
      onExport: async (scope, selectedColumns) => {
        const source = scope === 'all' ? books : filteredBooks;
        const labels = Object.fromEntries(columns.map((column) => [column.key, column.label]));
        const header = selectedColumns.map((key) => labels[key]);
        const rows = source.map((book) => selectedColumns.map((key) => book[key] ?? ''));
        const csv = [header, ...rows]
          .map((row) => row.map((value) => `"${String(value ?? '').replaceAll('"', '""')}"`).join(','))
          .join('\n');
        const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'HALMBOOK_Danh-sach-sach.csv';
        link.click();
        URL.revokeObjectURL(url);
      }
    });
    if (!exportResult && !window.AdminUI?.showExportModal) return;
  };

  const openCreateModal = () => {
    setModalMode('create');
    setEditingBookId(null);
    setForm(EMPTY_FORM);
    setImagePreview(null);
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (book) => {
    setModalMode('edit');
    setEditingBookId(book.id);
    setImagePreview(null);
    setError('');

    let matchedCatId = book.category_id || '';
    if (!matchedCatId && book.category) {
      const found = availableCategories.find((c) => c.category_name === book.category);
      if (found) matchedCatId = found.category_id;
    }

    const currentFormat = book.format === 'EPUB' || (book.fileFormat && String(book.fileFormat).toUpperCase() === 'EPUB') ? 'EPUB' : 'PDF';

    setForm({
      bookName: book.title || book.bookName || '',
      author: book.author === 'Chưa cập nhật' ? '' : (book.author || ''),
      publisher: book.publisher || '',
      isbn: book.isbn || '',
      yearOfPublished: book.yearOfPublished || '',
      totalPages: book.totalPages || '',
      rent_price: book.rent_price || '',
      description: book.description || '',
      category_id: matchedCatId,
      status: book.status || 'PUBLISHED',
      image: null,
      pdf: null,
      fileFormat: currentFormat,
      currentCoverUrl: book.coverUrl || book.img_url || '',
      currentPdfUrl: book.pdf_url || ''
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSaving) return;
    setIsModalOpen(false);
    setForm(EMPTY_FORM);
    setImagePreview(null);
  };

  const updateForm = (event) => {
    const { name, value, files } = event.target;
    if (files && files[0]) {
      const file = files[0];
      if (name === 'image') {
        setForm((current) => ({ ...current, image: file }));
        setImagePreview(URL.createObjectURL(file));
      } else if (name === 'pdf') {
        const lowerName = file.name.toLowerCase();
        const detectedFormat = lowerName.endsWith('.epub') ? 'EPUB' : 'PDF';
        setForm((current) => ({
          ...current,
          pdf: file,
          fileFormat: detectedFormat
        }));
      }
    } else {
      setForm((current) => ({ ...current, [name]: value }));
    }
  };

  const saveBook = async (event) => {
    event.preventDefault();
    if (!form.bookName.trim()) {
      setError('Tên sách không được để trống.');
      return;
    }

    const data = new FormData();
    data.append('bookName', form.bookName.trim());
    data.append('author', form.author.trim());
    data.append('publisher', form.publisher.trim());
    data.append('isbn', form.isbn.trim());
    if (form.yearOfPublished) data.append('yearOfPublished', form.yearOfPublished);
    if (form.totalPages) data.append('totalPages', form.totalPages);
    if (form.rent_price) data.append('rent_price', form.rent_price);
    data.append('description', form.description.trim());
    if (form.category_id) data.append('category_id', form.category_id);
    data.append('status', form.status || 'PUBLISHED');
    if (form.fileFormat) data.append('fileFormat', form.fileFormat);

    if (form.image) data.append('image', form.image);
    if (form.pdf) data.append('pdf', form.pdf);

    setIsSaving(true);
    setError('');
    try {
      if (modalMode === 'create') {
        await axiosInstance.post('/api/admin/books', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        window.DB?.notify?.('Thêm sách mới lên kho thành công!', 'success');
      } else {
        await axiosInstance.put(`/api/admin/books/${encodeURIComponent(editingBookId)}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        window.DB?.notify?.('Cập nhật thông tin sách thành công!', 'success');
      }
      closeModal();
      await loadBooks();
    } catch (requestError) {
      setError(getApiMessage(requestError, modalMode === 'create' ? 'Không thể tạo sách mới.' : 'Không thể cập nhật thông tin sách.'));
    } finally {
      setIsSaving(false);
    }
  };

  const deleteBook = async (book) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xoá sách "${book.title}" khỏi hệ thống không? Toàn bộ file nội dung trên Cloudinary cũng sẽ được xoá.`)) return;
    setError('');
    try {
      await axiosInstance.delete(`/api/admin/books/${encodeURIComponent(book.id)}`);
      setBooks((current) => current.filter((item) => item.id !== book.id));
      window.DB?.notify?.(`Đã xoá sách "${book.title}" thành công!`, 'success');
    } catch (requestError) {
      setError(getApiMessage(requestError, 'Không thể xoá sách.'));
    }
  };

  return (
    <div className="admin-page-root">
      <div id="admin-sidebar-container" />
      <main className="flex-1 flex flex-col h-full min-w-0 bg-white dark:bg-gray-950 overflow-hidden">
        <div
          id="admin-header-container"
          data-title="Quản Lý Kho Sách Điện Tử"
          data-subtitle="Hệ thống lưu trữ sách số, phân loại thể loại và đồng bộ Cloudinary"
        />

        <div className="admin-book-content flex-1 overflow-y-auto px-4 pb-4 pt-2 md:px-6 md:pb-6 md:pt-5 space-y-5">
          {/* Bộ lọc tìm kiếm & thanh công cụ */}
          <div className="overflow-x-auto rounded-2xl bg-slate-100 p-2 border border-slate-200 dark:bg-slate-900 dark:border-slate-700">
            <div className="grid min-w-[1080px] w-full grid-cols-[minmax(280px,1.8fr)_170px_145px_135px_auto_auto_auto] items-center gap-2">
              <div className="relative min-w-0">
                <i className="fa-solid fa-magnifying-glass absolute left-3 top-3 text-xs text-slate-400" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Tìm theo mã ID, tên sách, tác giả, ISBN..."
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-700 placeholder:text-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <select
                value={timeFilter}
                onChange={(event) => setTimeFilter(event.target.value)}
                className="w-[170px] rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs font-bold text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              >
                <option value="all">Tất cả thời gian</option>
                <option value="month">Sách 1 tháng gần đây</option>
              </select>
              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                className="w-[145px] rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs font-bold text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              >
                <option value="">Tất cả thể loại</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <select
                value={formatFilter}
                onChange={(event) => setFormatFilter(event.target.value)}
                className="w-[135px] rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs font-bold text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              >
                <option value="">Tất cả định dạng</option>
                <option value="PDF">Có file PDF</option>
                <option value="EPUB">Có file EPUB</option>
                <option value="Chưa có file">Chưa có file</option>
              </select>
              <button
                type="button"
                onClick={resetFilters}
                className="px-3 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700 transition"
              >
                <i className="fa-solid fa-rotate-left mr-1.5" /> Đặt lại
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={loadBooks}
                  disabled={isLoading}
                  className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 text-xs font-bold text-slate-700 dark:text-slate-200 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                >
                  <i className={`fa-solid fa-rotate-right mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
                  Làm mới
                </button>
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition flex items-center"
                >
                  <i className="fa-solid fa-plus mr-1.5" /> Thêm sách
                </button>
              </div>
              <button
                type="button"
                onClick={exportBooks}
                className="px-3 py-2.5 rounded-xl bg-emerald-600 text-xs font-black text-white hover:bg-emerald-700 whitespace-nowrap shadow-sm transition"
              >
                <i className="fa-solid fa-file-excel mr-1.5" /> Xuất Excel
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-300">
              <i className="fa-solid fa-circle-exclamation mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Bảng danh sách sách */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/80 shadow-sm">
            <table className="w-full min-w-0 table-fixed border-collapse border border-slate-300 text-left text-[10px] sm:text-xs dark:border-slate-600">
              <colgroup>
                <col className="w-[5%]" />
                <col className="w-[7%]" />
                <col className="w-[18%]" />
                <col className="w-[12%]" />
                <col className="w-[11%]" />
                <col className="w-[8%]" />
                <col className="w-[8%]" />
                <col className="w-[8%]" />
                <col className="w-[9%]" />
                <col className="w-[7%]" />
                <col className="w-[7%]" />
              </colgroup>
              <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] uppercase text-slate-500 dark:text-slate-300">
                <tr>
                  <th className="border border-slate-300 p-3 dark:border-slate-600">ID</th>
                  <th className="border border-slate-300 p-3 text-center dark:border-slate-600">Bìa sách</th>
                  <th className="border border-slate-300 p-3 dark:border-slate-600">Tên đầu sách</th>
                  <th className="border border-slate-300 p-3 dark:border-slate-600">Tác giả</th>
                  <th className="border border-slate-300 p-3 dark:border-slate-600">Thể loại</th>
                  <th className="border border-slate-300 p-3 text-center dark:border-slate-600">Định dạng</th>
                  <th className="border border-slate-300 p-3 text-center dark:border-slate-600">Dung lượng</th>
                  <th className="border border-slate-300 p-3 text-center dark:border-slate-600">Lượt đọc</th>
                  <th className="border border-slate-300 p-3 text-center dark:border-slate-600">Trạng thái</th>
                  <th className="border border-slate-300 p-3 text-center dark:border-slate-600">Ngày thêm</th>
                  <th className="border border-slate-300 p-3 text-center dark:border-slate-600">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-xs">
                {isLoading ? (
                  <tr>
                    <td colSpan="11" className="p-12 text-center font-bold text-slate-400">
                      <i className="fa-solid fa-spinner animate-spin mr-2" /> Đang tải dữ liệu sách...
                    </td>
                  </tr>
                ) : filteredBooks.length === 0 ? (
                  <tr>
                    <td colSpan="11" className="p-12 text-center font-bold text-slate-400">
                      Không tìm thấy cuốn sách nào phù hợp với bộ lọc.
                    </td>
                  </tr>
                ) : visibleBooks.map((book) => {
                  const isPublished = book.status === 'PUBLISHED' || book.status === 'public';
                  return (
                    <tr key={book.id} className="hover:bg-blue-50/40 dark:hover:bg-slate-700/50 transition-colors">
                      <td className="border border-slate-200 p-3 font-mono font-bold text-slate-500 dark:border-slate-700">
                        {book.id}
                      </td>
                      <td className="border border-slate-200 p-2 dark:border-slate-700 text-center">
                        <img
                          src={book.coverUrl}
                          alt={book.title}
                          className="w-10 h-14 object-cover rounded-md border border-slate-200 dark:border-slate-600 mx-auto shadow-sm"
                          onError={(e) => { e.currentTarget.src = '/logo.png'; }}
                        />
                      </td>
                      <td className="min-w-0 border border-slate-200 p-3 dark:border-slate-700">
                        <div className="font-black text-slate-800 dark:text-slate-100 truncate" title={book.title}>
                          {book.title}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate flex items-center gap-1.5 mt-0.5">
                          {book.publisher && <span>{book.publisher}</span>}
                          {book.isbn && <span className="font-mono bg-slate-100 dark:bg-slate-700/60 px-1 rounded text-[9px]">{book.isbn}</span>}
                        </div>
                      </td>
                      <td className="border border-slate-200 p-3 font-bold text-slate-600 dark:border-slate-700 dark:text-slate-300">
                        {book.author || 'Chưa cập nhật'}
                      </td>
                      <td className="border border-slate-200 p-3 text-slate-600 dark:border-slate-700 dark:text-slate-300">
                        {book.category}
                      </td>
                      <td className="border border-slate-200 p-3 text-center font-bold dark:border-slate-700">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold ${
                          book.format === 'EPUB'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                            : book.format === 'PDF'
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                              : 'bg-slate-100 text-slate-500 dark:bg-slate-700/40'
                        }`}>
                          {book.format === 'EPUB' && <i className="fa-solid fa-book-open text-[9px]" />}
                          {book.format === 'PDF' && <i className="fa-solid fa-file-pdf text-[9px]" />}
                          {book.format}
                        </span>
                      </td>
                      <td className="border border-slate-200 p-3 text-center text-slate-600 dark:border-slate-700 dark:text-slate-300 font-mono">
                        {book.fileSize}
                      </td>
                      <td className="border border-slate-200 p-3 text-center font-bold text-slate-600 dark:border-slate-700 dark:text-slate-300">
                        {book.reads.toLocaleString('vi-VN')}
                      </td>
                      <td className="border border-slate-200 p-3 text-center dark:border-slate-700">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          isPublished
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-300/40'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-300/40'
                        }`}>
                          {isPublished ? 'Công khai' : 'Bản nháp'}
                        </span>
                      </td>
                      <td className="border border-slate-200 p-3 text-center text-slate-600 dark:border-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {formatBookDate(book.uploadDate)}
                      </td>
                      <td className="border border-slate-200 p-2 text-center dark:border-slate-700 whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* NÚT CHỈNH SỬA SÁCH (ĐÃ BẬT) */}
                          <button
                            type="button"
                            onClick={() => openEditModal(book)}
                            className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-100/60 dark:text-amber-400 dark:hover:bg-amber-950/50 transition-colors"
                            title="Chỉnh sửa thông tin sách"
                          >
                            <i className="fa-solid fa-pen-to-square text-sm" />
                          </button>
                          {/* NÚT XOÁ SÁCH */}
                          <button
                            type="button"
                            onClick={() => deleteBook(book)}
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-100/60 dark:text-rose-400 dark:hover:bg-rose-950/50 transition-colors"
                            title="Xoá sách khỏi kho"
                          >
                            <i className="fa-solid fa-trash-can text-sm" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Phân trang */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Hiển thị {filteredBooks.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}-
              {Math.min(currentPage * pageSize, filteredBooks.length)} / {filteredBooks.length} sách
            </p>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={currentPage === 1}
                className="w-9 h-9 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                aria-label="Trang trước"
              >
                <i className="fa-solid fa-chevron-left text-xs" />
              </button>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={`min-w-9 h-9 px-2 rounded-lg border text-xs font-black transition ${
                    page === currentPage
                      ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                      : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={currentPage === totalPages}
                className="w-9 h-9 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                aria-label="Trang sau"
              >
                <i className="fa-solid fa-chevron-right text-xs" />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* MODAL THÊM / CHỈNH SỬA SÁCH */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={saveBook}
            className="w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white dark:bg-slate-800 p-6 space-y-5 border border-slate-200 dark:border-slate-700 shadow-2xl"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white ${modalMode === 'create' ? 'bg-blue-600' : 'bg-amber-600'}`}>
                  <i className={`fa-solid ${modalMode === 'create' ? 'fa-cloud-arrow-up' : 'fa-pen-to-square'}`} />
                </div>
                <div>
                  <h2 className="font-black text-base md:text-lg text-slate-800 dark:text-white leading-tight">
                    {modalMode === 'create' ? 'Thêm Sách Mới Lên Kho Hệ Thống' : 'Chỉnh Sửa Thông Tin Sách'}
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {modalMode === 'create' ? 'Tự động đồng bộ ảnh bìa và file nội dung PDF lên Cloudinary' : `Mã sách: ${editingBookId}`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center transition"
                disabled={isSaving}
              >
                <i className="fa-solid fa-xmark text-lg" />
              </button>
            </div>

            {/* Thông tin cơ bản */}
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                1. Thông tin chung về đầu sách
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  Tên đầu sách <span className="text-rose-500">*</span>
                  <input
                    name="bookName"
                    value={form.bookName}
                    onChange={updateForm}
                    required
                    placeholder="Nhập tên sách..."
                    className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700/80 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </label>

                <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  Mã tiêu chuẩn ISBN
                  <input
                    name="isbn"
                    value={form.isbn}
                    onChange={updateForm}
                    placeholder="Ví dụ: ISBN-978-604-12-9842-1"
                    className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700/80 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </label>

                <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  Tác giả
                  <input
                    name="author"
                    value={form.author}
                    onChange={updateForm}
                    placeholder="Tên tác giả hoặc dịch giả..."
                    className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700/80 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </label>

                <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  Nhà xuất bản
                  <input
                    name="publisher"
                    value={form.publisher}
                    onChange={updateForm}
                    placeholder="Ví dụ: NXB Trẻ, NXB Kim Đồng..."
                    className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700/80 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </label>
              </div>
            </div>

            {/* Phân loại & Thông số kỹ thuật */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                2. Phân loại, chỉ số & trạng thái
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200 sm:col-span-2">
                  Thể loại sách
                  <select
                    name="category_id"
                    value={form.category_id}
                    onChange={updateForm}
                    className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700/80 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                  >
                    <option value="">-- Chọn thể loại sách --</option>
                    {availableCategories.map((cat) => (
                      <option key={cat.category_id} value={cat.category_id}>
                        {cat.category_name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-xs font-bold text-slate-700 dark:text-slate-200 sm:col-span-2">
                  Trạng thái phát hành
                  <select
                    name="status"
                    value={form.status}
                    onChange={updateForm}
                    className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700/80 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                  >
                    <option value="PUBLISHED">Công khai (PUBLISHED)</option>
                    <option value="DRAFT">Bản nháp (DRAFT)</option>
                    <option value="HIDDEN">Tạm ẩn (HIDDEN)</option>
                  </select>
                </label>

                <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  Năm xuất bản
                  <input
                    name="yearOfPublished"
                    type="number"
                    value={form.yearOfPublished}
                    onChange={updateForm}
                    placeholder="Ví dụ: 2024"
                    className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700/80 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </label>

                <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  Tổng số trang
                  <input
                    name="totalPages"
                    type="number"
                    value={form.totalPages}
                    onChange={updateForm}
                    placeholder="Số trang..."
                    className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700/80 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </label>

                <label className="text-xs font-bold text-slate-700 dark:text-slate-200 sm:col-span-2">
                  Giá thuê (VNĐ hoặc Khoai)
                  <input
                    name="rent_price"
                    type="number"
                    step="0.01"
                    value={form.rent_price}
                    onChange={updateForm}
                    placeholder="Ví dụ: 15000"
                    className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700/80 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </label>
              </div>
            </div>

            {/* Mô tả tóm tắt */}
            <div className="space-y-1.5 pt-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                Tóm tắt nội dung sách (Synopsis)
                <textarea
                  name="description"
                  value={form.description}
                  onChange={updateForm}
                  rows="3"
                  placeholder="Giới thiệu sơ lược về cốt truyện hoặc nội dung chính của cuốn sách..."
                  className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700/80 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </label>
            </div>

            {/* Upload File Cloudinary */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                3. Tài nguyên số hóa (Lưu trữ Cloudinary)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Upload Ảnh bìa */}
                <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-600 p-3 bg-slate-50/50 dark:bg-slate-700/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                      <i className="fa-solid fa-image text-blue-500" />
                      <span>Ảnh bìa sách (Cover)</span>
                    </span>
                    {form.currentCoverUrl && !imagePreview && (
                      <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
                        Đã có ảnh
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-16 rounded border border-slate-200 dark:border-slate-600 overflow-hidden bg-slate-200 dark:bg-slate-600 shrink-0">
                      <img
                        src={imagePreview || form.currentCoverUrl || '/logo.png'}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => { e.currentTarget.src = '/logo.png'; }}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <input
                        name="image"
                        type="file"
                        accept="image/*"
                        onChange={updateForm}
                        className="block w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-slate-700 dark:file:text-slate-200 cursor-pointer"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">
                        {modalMode === 'edit' ? 'Để trống nếu muốn giữ nguyên ảnh hiện tại' : 'Định dạng JPG, PNG, WEBP (tối đa 10MB)'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Upload File PDF & EPUB */}
                <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-600 p-3.5 bg-slate-50/50 dark:bg-slate-700/30 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                      <i className="fa-solid fa-file-invoice text-blue-500" />
                      <span>Nội dung sách điện tử</span>
                    </span>
                    <div className="flex items-center gap-2">
                      {form.currentPdfUrl && !form.pdf && (
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border ${
                          form.fileFormat === 'EPUB'
                            ? 'text-emerald-700 bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                            : 'text-rose-700 bg-rose-100 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                        }`}>
                          <i className={`fa-solid ${form.fileFormat === 'EPUB' ? 'fa-book-open' : 'fa-file-pdf'} text-[9px]`} />
                          Đã có {form.fileFormat}
                        </span>
                      )}
                      <div className="flex items-center rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 p-0.5 text-[10px] font-bold">
                        <button
                          type="button"
                          onClick={() => setForm((c) => ({ ...c, fileFormat: 'PDF' }))}
                          className={`px-2 py-0.5 rounded transition ${
                            form.fileFormat === 'PDF'
                              ? 'bg-rose-500 text-white shadow-xs'
                              : 'text-slate-600 dark:text-slate-300 hover:text-rose-600'
                          }`}
                        >
                          PDF
                        </button>
                        <button
                          type="button"
                          onClick={() => setForm((c) => ({ ...c, fileFormat: 'EPUB' }))}
                          className={`px-2 py-0.5 rounded transition ${
                            form.fileFormat === 'EPUB'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'text-slate-600 dark:text-slate-300 hover:text-emerald-600'
                          }`}
                        >
                          EPUB
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <input
                      name="pdf"
                      type="file"
                      accept=".pdf,.epub,application/pdf,application/epub+zip"
                      onChange={updateForm}
                      className="block w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-slate-200 file:text-slate-800 hover:file:bg-slate-300 dark:file:bg-slate-700 dark:file:text-slate-200 cursor-pointer"
                    />

                    <div className="text-[11px] text-slate-400">
                      {form.pdf ? (
                        <div className="flex items-center gap-1.5 mt-1 font-semibold">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black ${
                            form.fileFormat === 'EPUB'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                          }`}>
                            <i className={`fa-solid ${form.fileFormat === 'EPUB' ? 'fa-book-open' : 'fa-file-pdf'} text-[9px]`} />
                            {form.fileFormat}
                          </span>
                          <span className="text-slate-700 dark:text-slate-200 truncate">
                            {form.pdf.name} ({(form.pdf.size / (1024 * 1024)).toFixed(2)} MB)
                          </span>
                        </div>
                      ) : modalMode === 'edit' && form.currentPdfUrl ? (
                        <span>Tệp sách hiện có trên hệ thống ({form.fileFormat}). Chọn file PDF hoặc EPUB mới nếu muốn thay thế.</span>
                      ) : (
                        <span>Hỗ trợ tệp <strong>PDF (.pdf)</strong> và <strong>EPUB (.epub)</strong> dung lượng tối đa 100MB (Tự động đồng bộ Cloudinary & Server).</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-700 pt-4">
              <button
                type="button"
                onClick={closeModal}
                disabled={isSaving}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              >
                Huỷ bỏ
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition disabled:opacity-50 flex items-center gap-1.5"
              >
                {isSaving ? (
                  <>
                    <i className="fa-solid fa-spinner animate-spin text-xs" />
                    <span>Đang đồng bộ Cloudinary & lưu...</span>
                  </>
                ) : modalMode === 'create' ? (
                  <>
                    <i className="fa-solid fa-plus text-xs" />
                    <span>Thêm sách mới</span>
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-check text-xs" />
                    <span>Lưu cập nhật sách</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
