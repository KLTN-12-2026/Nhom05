import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { savePersonalBook, generateCoverDataUrl } from '@/services/personalBookService';

const CATEGORIES = [
    'Tài liệu cá nhân',
    'Học tập & Nghiên cứu',
    'Văn học & Tiểu thuyết',
    'Kỹ năng sống & Phát triển',
    'Kinh tế & Đầu tư',
    'Công nghệ & Lập trình',
    'Khác'
];

const COVER_THEMES = [
    { id: 'gold', name: 'Hoàng Kim', color: 'from-[#2A2312] to-[#12110D] border-amber-500 text-amber-300' },
    { id: 'wine', name: 'Rượu Vang', color: 'from-[#2B1015] to-[#140608] border-rose-500 text-rose-300' },
    { id: 'emerald', name: 'Ngọc Bích', color: 'from-[#0C2418] to-[#05120B] border-emerald-500 text-emerald-300' },
    { id: 'sapphire', name: 'Lam Tinh', color: 'from-[#101D30] to-[#070D17] border-blue-500 text-blue-300' }
];

export default function UploadBookModal({ isOpen, onClose }) {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const coverInputRef = useRef(null);

    const [file, setFile] = useState(null);
    const [title, setTitle] = useState('');
    const [author, setAuthor] = useState('');
    const [category, setCategory] = useState('Tài liệu cá nhân');
    const [description, setDescription] = useState('');
    const [coverTheme, setCoverTheme] = useState('gold');
    const [customCoverUrl, setCustomCoverUrl] = useState(null);

    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadedBook, setUploadedBook] = useState(null);
    const [errorMsg, setErrorMsg] = useState('');

    // Reset form when modal opens or closes
    useEffect(() => {
        if (!isOpen) {
            setFile(null);
            setTitle('');
            setAuthor('');
            setCategory('Tài liệu cá nhân');
            setDescription('');
            setCoverTheme('gold');
            setCustomCoverUrl(null);
            setIsUploading(false);
            setUploadProgress(0);
            setUploadedBook(null);
            setErrorMsg('');
        }
    }, [isOpen]);

    // Handle ESC key
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen && !isUploading) {
                onClose?.();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, isUploading, onClose]);

    if (!isOpen || typeof document === 'undefined') return null;

    const handleFileSelected = (selectedFile) => {
        if (!selectedFile) return;
        const name = selectedFile.name.toLowerCase();
        const isValid = name.endsWith('.pdf') || name.endsWith('.epub') || selectedFile.type.includes('pdf') || selectedFile.type.includes('epub');

        if (!isValid) {
            setErrorMsg('Định dạng tệp không hợp lệ! Vui lòng chọn file PDF (.pdf) hoặc EPUB (.epub).');
            return;
        }

        // Limit to 100MB
        if (selectedFile.size > 100 * 1024 * 1024) {
            setErrorMsg('Dung lượng tệp vượt quá 100MB. Vui lòng chọn tệp nhỏ hơn.');
            return;
        }

        setErrorMsg('');
        setFile(selectedFile);

        // Pre-fill Title from File Name
        const autoTitle = selectedFile.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        if (!title.trim()) {
            setTitle(autoTitle);
        }
        if (!author.trim()) {
            setAuthor('Cá nhân');
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileSelected(e.dataTransfer.files[0]);
        }
    };

    const handleCustomCoverChange = (e) => {
        const cFile = e.target.files?.[0];
        if (cFile && cFile.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = () => setCustomCoverUrl(reader.result);
            reader.readAsDataURL(cFile);
        }
    };

    const handleUploadSubmit = async (e) => {
        e.preventDefault();
        if (!file) {
            setErrorMsg('Vui lòng chọn tệp sách (PDF hoặc EPUB) để tải lên!');
            return;
        }

        try {
            setIsUploading(true);
            setErrorMsg('');
            setUploadProgress(20);

            const progressInterval = setInterval(() => {
                setUploadProgress(prev => {
                    if (prev >= 85) {
                        clearInterval(progressInterval);
                        return 85;
                    }
                    return prev + 15;
                });
            }, 60);

            const saved = await savePersonalBook({
                title: title.trim(),
                author: author.trim(),
                category,
                file,
                coverUrl: customCoverUrl,
                coverTheme,
                description: description.trim()
            });

            clearInterval(progressInterval);
            setUploadProgress(100);

            setTimeout(() => {
                setIsUploading(false);
                setUploadedBook(saved);
            }, 250);

        } catch (err) {
            console.error('Lỗi khi tải sách lên:', err);
            setIsUploading(false);
            setUploadProgress(0);
            setErrorMsg(err.message || 'Có lỗi xảy ra khi tải sách lên. Vui lòng thử lại!');
        }
    };

    const handleReadNow = () => {
        if (!uploadedBook) return;
        onClose?.();
        navigate(`/docsach/${encodeURIComponent(uploadedBook.id)}`);
    };

    const handleGoToBookshelf = () => {
        onClose?.();
        navigate('/tusachcn?tab=personal');
    };

    const previewCoverUrl = customCoverUrl || generateCoverDataUrl(title || 'Sách Mới Tải Lên', author || 'Cá nhân', coverTheme);

    const modalContent = (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            {/* Backdrop Blur */}
            <div
                className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity"
                onClick={() => !isUploading && onClose?.()}
                aria-hidden="true"
            />

            {/* Hidden File Inputs */}
            <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.epub,application/pdf,application/epub+zip"
                className="hidden"
                onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileSelected(f);
                    e.target.value = '';
                }}
            />
            <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleCustomCoverChange}
            />

            {/* Modal Dialog Card */}
            <div
                className="relative w-full max-w-2xl rounded-3xl bg-[#FFFEFA] dark:bg-[#181916] border border-[#E3DDD0] dark:border-[#2C2E29] shadow-2xl overflow-hidden z-10 transition-all my-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header Gradient Accent */}
                <div className="h-1.5 w-full bg-gradient-to-r from-[#8E3038] via-[#D4AF37] to-[#8E3038]" />

                {/* Modal Title Bar */}
                <div className="px-6 py-5 sm:px-8 border-b border-[#E3DDD0] dark:border-[#2C2E29] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-[#D4AF37]/15 dark:bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
                            <i className="ph-bold ph-cloud-arrow-up text-xl"></i>
                        </div>
                        <div>
                            <h3 className="font-display font-black text-xl text-[#1E1F1D] dark:text-[#EDE9DF] tracking-tight">
                                Tải Lên Sách Cá Nhân
                            </h3>
                            <p className="font-metadata text-xs text-[#66645E] dark:text-[#96938B]">
                                Hỗ trợ định dạng PDF (.pdf) & EPUB (.epub) • Lưu trữ an toàn trên thiết bị của bạn
                            </p>
                        </div>
                    </div>
                    {!isUploading && (
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-9 h-9 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                            aria-label="Đóng"
                        >
                            <i className="ph-bold ph-x text-lg"></i>
                        </button>
                    )}
                </div>

                {/* ========================================================
                    TRƯỜNG HỢP 1: TẢI LÊN THÀNH CÔNG (SUCCESS STATE)
                   ======================================================== */}
                {uploadedBook ? (
                    <div className="p-8 text-center space-y-6">
                        <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-500 border border-emerald-500/40 flex items-center justify-center mx-auto text-3xl shadow-lg">
                            <i className="ph-bold ph-check"></i>
                        </div>

                        <div>
                            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold font-metadata uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 mb-2">
                                Tải lên thành công!
                            </span>
                            <h4 className="font-display font-black text-2xl text-[#1E1F1D] dark:text-[#EDE9DF]">
                                {uploadedBook.title}
                            </h4>
                            <p className="font-metadata text-xs text-[#66645E] dark:text-[#96938B] mt-1">
                                Tác giả: <strong className="text-stone-800 dark:text-stone-200">{uploadedBook.author}</strong> • Định dạng: <span className="font-bold text-amber-500">{uploadedBook.format}</span> ({uploadedBook.fileSize})
                            </p>
                        </div>

                        {/* Preview Card */}
                        <div className="flex items-center justify-center py-2">
                            <img
                                src={uploadedBook.coverUrl}
                                alt="Cover preview"
                                className="w-28 h-40 object-cover rounded-xl shadow-xl border border-stone-300 dark:border-stone-700"
                            />
                        </div>

                        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center items-center">
                            <button
                                type="button"
                                onClick={handleReadNow}
                                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-600 via-[#C28807] to-amber-600 hover:brightness-110 text-[#111210] font-metadata font-black text-sm flex items-center justify-center gap-2 shadow-lg transition-transform hover:scale-105 cursor-pointer"
                            >
                                <i className="ph-bold ph-book-open text-lg"></i>
                                <span>Đọc Sách Ngay</span>
                            </button>
                            <button
                                type="button"
                                onClick={handleGoToBookshelf}
                                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-metadata font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
                            >
                                <i className="ph-bold ph-books text-lg"></i>
                                <span>Vào Tủ Sách Cá Nhân</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setUploadedBook(null);
                                    setFile(null);
                                    setTitle('');
                                    setAuthor('');
                                    setCustomCoverUrl(null);
                                }}
                                className="w-full sm:w-auto px-4 py-3 rounded-2xl text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 text-xs font-bold transition-colors cursor-pointer"
                            >
                                + Tải Thêm Sách Khác
                            </button>
                        </div>
                    </div>
                ) : (
                    /* ========================================================
                        TRƯỜNG HỢP 2: FORM TẢI LÊN FILE
                       ======================================================== */
                    <form onSubmit={handleUploadSubmit} className="p-6 sm:p-8 space-y-6">
                        {errorMsg && (
                            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-medium flex items-center gap-2.5">
                                <i className="ph-bold ph-warning-circle text-lg shrink-0"></i>
                                <span>{errorMsg}</span>
                            </div>
                        )}

                        {/* 1. Drag & Drop File Zone */}
                        <div
                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`cursor-pointer rounded-2xl p-6 text-center border-2 border-dashed transition-all relative overflow-hidden group ${
                                isDragging
                                    ? 'border-[#D4AF37] bg-[#D4AF37]/10 scale-[1.01]'
                                    : file
                                    ? 'border-emerald-500/60 bg-emerald-500/5'
                                    : 'border-stone-300 dark:border-stone-700 hover:border-[#D4AF37] bg-stone-50 dark:bg-[#111210]'
                            }`}
                        >
                            {file ? (
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
                                    <div className="flex items-center gap-3.5">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white text-lg shrink-0 shadow-md ${
                                            file.name.toLowerCase().endsWith('.epub') ? 'bg-purple-600' : 'bg-rose-600'
                                        }`}>
                                            {file.name.toLowerCase().endsWith('.epub') ? 'EPUB' : 'PDF'}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-display font-bold text-sm text-stone-900 dark:text-stone-100 truncate max-w-xs sm:max-w-md">
                                                {file.name}
                                            </p>
                                            <p className="font-metadata text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                                                {(file.size / (1024 * 1024)).toFixed(2)} MB • Sẵn sàng nạp vào hệ thống
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            fileInputRef.current?.click();
                                        }}
                                        className="shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 transition-colors cursor-pointer"
                                    >
                                        Đổi tệp khác
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-2.5">
                                    <div className="w-14 h-14 rounded-2xl bg-[#D4AF37]/15 dark:bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40 flex items-center justify-center mx-auto text-2xl group-hover:scale-110 transition-transform">
                                        <i className="ph-bold ph-file-arrow-up"></i>
                                    </div>
                                    <div>
                                        <p className="font-display font-bold text-sm text-stone-900 dark:text-stone-200">
                                            Kéo thả file sách vào đây hoặc <span className="text-[#C28807] dark:text-[#D4AF37] underline underline-offset-4">duyệt từ máy tính</span>
                                        </p>
                                        <p className="font-metadata text-xs text-stone-500 dark:text-stone-400 mt-1">
                                            Hỗ trợ định dạng <strong>.PDF</strong> và <strong>.EPUB</strong> (Tối đa 100MB)
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 2. Metadata Inputs */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="block font-metadata text-xs font-bold text-stone-700 dark:text-stone-300">
                                    Tên tác phẩm / Tiêu đề <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="VD: Hoàng Tử Bé, Lập trình React..."
                                    className="w-full px-4 py-2.5 rounded-xl text-xs font-medium bg-stone-50 dark:bg-[#111210] border border-stone-300 dark:border-stone-700 focus:border-[#D4AF37] focus:outline-none text-stone-900 dark:text-stone-100 transition-colors"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="block font-metadata text-xs font-bold text-stone-700 dark:text-stone-300">
                                    Tác giả
                                </label>
                                <input
                                    type="text"
                                    value={author}
                                    onChange={(e) => setAuthor(e.target.value)}
                                    placeholder="VD: Antoine de Saint-Exupéry hoặc Cá nhân"
                                    className="w-full px-4 py-2.5 rounded-xl text-xs font-medium bg-stone-50 dark:bg-[#111210] border border-stone-300 dark:border-stone-700 focus:border-[#D4AF37] focus:outline-none text-stone-900 dark:text-stone-100 transition-colors"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="block font-metadata text-xs font-bold text-stone-700 dark:text-stone-300">
                                    Thể loại / Chủ đề
                                </label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl text-xs font-medium bg-stone-50 dark:bg-[#111210] border border-stone-300 dark:border-stone-700 focus:border-[#D4AF37] focus:outline-none text-stone-900 dark:text-stone-100 transition-colors"
                                >
                                    {CATEGORIES.map((cat) => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="block font-metadata text-xs font-bold text-stone-700 dark:text-stone-300">
                                    Màu sắc bìa tự sinh (Theme)
                                </label>
                                <div className="grid grid-cols-4 gap-2 pt-0.5">
                                    {COVER_THEMES.map((th) => (
                                        <button
                                            key={th.id}
                                            type="button"
                                            onClick={() => {
                                                setCoverTheme(th.id);
                                                setCustomCoverUrl(null);
                                            }}
                                            className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all flex items-center justify-center gap-1 cursor-pointer ${
                                                coverTheme === th.id && !customCoverUrl
                                                    ? 'border-[#D4AF37] bg-[#D4AF37]/20 shadow-sm text-stone-900 dark:text-[#EDE9DF]'
                                                    : 'border-stone-200 dark:border-stone-800 text-stone-500 hover:border-stone-400'
                                            }`}
                                        >
                                            <span className={`w-2.5 h-2.5 rounded-full bg-gradient-to-tr ${th.color}`}></span>
                                            <span className="truncate">{th.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* 3. Cover Preview & Custom Image Button */}
                        <div className="rounded-2xl p-4 bg-stone-50 dark:bg-[#111210] border border-stone-200 dark:border-stone-800 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <img
                                    src={previewCoverUrl}
                                    alt="Preview"
                                    className="w-12 h-16 object-cover rounded-lg shadow-sm border border-stone-300 dark:border-stone-700"
                                />
                                <div>
                                    <p className="font-metadata text-xs font-bold text-stone-800 dark:text-stone-200">
                                        Ảnh bìa sách tự động
                                    </p>
                                    <p className="font-metadata text-[11px] text-stone-500 dark:text-stone-400">
                                        Tự sinh bìa sang trọng hoặc tải ảnh bìa riêng của bạn
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => coverInputRef.current?.click()}
                                className="px-3 py-1.5 rounded-xl text-xs font-bold border border-stone-300 dark:border-stone-700 hover:border-[#D4AF37] text-stone-700 dark:text-stone-300 transition-colors cursor-pointer"
                            >
                                {customCoverUrl ? 'Đổi ảnh bìa' : '+ Chọn ảnh riêng'}
                            </button>
                        </div>

                        {/* 4. Upload Progress Bar */}
                        {isUploading && (
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs font-bold text-[#D4AF37]">
                                    <span>Đang nạp file vào thư viện cá nhân...</span>
                                    <span>{uploadProgress}%</span>
                                </div>
                                <div className="h-2 w-full rounded-full bg-stone-200 dark:bg-stone-800 overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-amber-600 via-[#C28807] to-yellow-400 transition-all duration-200 rounded-full"
                                        style={{ width: `${uploadProgress}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* 5. Footer Buttons */}
                        <div className="pt-2 flex items-center justify-end gap-3 border-t border-stone-200 dark:border-stone-800">
                            <button
                                type="button"
                                disabled={isUploading}
                                onClick={onClose}
                                className="px-5 py-2.5 rounded-xl text-xs font-bold text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                type="submit"
                                disabled={!file || isUploading}
                                className={`px-6 py-2.5 rounded-xl font-metadata font-black text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer ${
                                    !file || isUploading
                                        ? 'bg-stone-300 dark:bg-stone-800 text-stone-500 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-amber-600 via-[#C28807] to-amber-600 hover:brightness-110 text-[#111210] hover:scale-105'
                                }`}
                            >
                                {isUploading ? (
                                    <>
                                        <div className="w-3.5 h-3.5 border-2 border-[#111210] border-t-transparent rounded-full animate-spin" />
                                        <span>Đang xử lý...</span>
                                    </>
                                ) : (
                                    <>
                                        <i className="ph-bold ph-check text-sm"></i>
                                        <span>Lưu & Tải Lên Tủ Sách</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
