import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import axiosInstance from '@/services/axiosClient';
import { getPersonalBookById } from '@/services/personalBookService';
import { getBookAccessDetail, updateReadingProgress } from '@/services/userFeatureService';
import AuthModal, { openAuthModal } from '@/components/common/AuthModal';
import { isTokenValid } from '@/services/authToken';

const tailwindConfig = {
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                serif: ['"Playfair Display"', 'serif'],
                outfit: ['Outfit', 'sans-serif'],
                nunito: ['Nunito', 'sans-serif'],
                garamond: ['"Cormorant Garamond"', 'serif'],
                lora: ['Lora', 'serif'],
                roboto: ['Roboto', 'sans-serif'],
            },
            colors: {
                paper: {
                    50: '#FAF8F5',
                    100: '#F5F2EB',
                    200: '#EAE5D9',
                    DEFAULT: '#FAF7F2',
                    surface: '#FFFFFF',
                    border: '#E8E2D5',
                },
                ink: {
                    50: '#F5F5F4',
                    300: '#A8A6A1',
                    muted: '#6E6D7A',
                    DEFAULT: '#1E1F1D',
                    pure: '#111210',
                },
                wine: {
                    50: '#FDF2F4',
                    100: '#FCE7EB',
                    DEFAULT: '#8E3038',
                    light: '#A83B46',
                    dark: '#6F252C',
                },
                gold: {
                    50: '#FEFDF8',
                    100: '#FEF9E7',
                    DEFAULT: '#B8860B',
                    light: '#D4AF37',
                    accent: '#F59E0B',
                },
                night: {
                    bg: '#111210',
                    surface: '#1A1B18',
                    card: '#222420',
                    border: '#2F322B',
                    text: '#EDE9DF',
                    muted: '#9CA3AF',
                },
            },
        }
    }
};

const externalStylesheets = [
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Nunito:wght@400;600;700;800;900&family=Outfit:wght@400;500;600;700;800;900&family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,500;1,600;1,700&family=Cormorant+Garamond:wght@400;600;700&family=Lora:ital,wght@0,400;0,700;1,400&family=Roboto:wght@400;500;700&display=swap',
    'https://unpkg.com/@phosphor-icons/web@2.1.1/src/bold/style.css',
    'https://unpkg.com/@phosphor-icons/web@2.1.1/src/regular/style.css',
    'https://unpkg.com/@phosphor-icons/web@2.1.1/src/fill/style.css',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
];

const pageStyles = `
    .halm-reader-root {
        height: 100%;
        margin: 0;
        padding: 0;
        overflow: hidden;
        background-color: #FAF7F2;
        font-family: 'Inter', sans-serif;
        color: #1E1F1D;
    }

    /* HALM Signature Header Matching TrangChu / ChiTietSach */
    .halm-reader-header {
        background: linear-gradient(105deg, #171815 0%, #191916 67%, #21190f 100%) !important;
        backdrop-filter: blur(16px);
        border-bottom: 1px solid rgba(212, 175, 55, 0.45) !important;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5) !important;
        color: #f5f2e8 !important;
    }

    .halm-header-btn {
        background-color: #222420;
        border: 1px solid #2F322B;
        color: #EDE9DF;
        transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .halm-header-btn:hover {
        background-color: #2C2E29;
        border-color: rgba(212, 175, 55, 0.6);
        color: #D4AF37;
        transform: translateY(-1px);
    }

    .sidebar-overlay {
        position: fixed;
        top: 56px;
        bottom: 0;
        right: 0;
        z-index: 1050; 
        transition: transform 0.38s cubic-bezier(0.16, 1, 0.3, 1);
        will-change: transform;
    }

    .sidebar-right-hidden { transform: translateX(110%); }
    .sidebar-left { left: 0; right: auto; }
    .sidebar-left-hidden { transform: translateX(-110%); }

    :fullscreen #headerHoverZone,
    body.is-fullscreen #headerHoverZone {
        display: block !important;
        z-index: 9990;
    }
    :fullscreen #mainHeader,
    body.is-fullscreen #mainHeader {
        position: fixed;
        top: 0; left: 0; width: 100%;
        transform: translateY(-100%);
        z-index: 9995;
    }
    :fullscreen #headerHoverZone:hover + #mainHeader,
    :fullscreen #mainHeader:hover,
    body.is-fullscreen #headerHoverZone:hover + #mainHeader,
    body.is-fullscreen #mainHeader:hover {
        transform: translateY(0);
    }
    :fullscreen .sidebar-overlay,
    body.is-fullscreen .sidebar-overlay {
        top: 0; 
        z-index: 10000;
    }

    /* Paper Themes */
    .theme-paper-default { 
        background-color: #FAF7F2; 
        color: #1E1F1D; 
    }
    
    .theme-paper-sepia {
        background-color: #F4ECD8;
        color: #3D2E1E;
    }

    .theme-paper-starry { 
        background-color: #111210; 
        color: #EDE9DF; 
    }

    /* Twinkling Star background matching TrangChu */
    .star {
        position: absolute;
        background-color: #ffffff;
        border-radius: 50%;
        pointer-events: none;
        animation: starTwinkle 4s ease-in-out infinite;
    }
    @keyframes starTwinkle {
        0%, 100% { opacity: 0.2; transform: scale(0.8); }
        50% { opacity: 0.9; transform: scale(1.3); }
    }

    /* Canvas Filters */
    .canvas-filter-starry {
        filter: invert(0.9) hue-rotate(180deg) brightness(0.95) contrast(0.92);
        border-radius: 4px;
        box-shadow: 0 12px 35px rgba(0,0,0,0.65);
    }

    .canvas-filter-sepia {
        filter: sepia(0.35) contrast(0.96) brightness(0.98);
        border-radius: 4px;
        box-shadow: 0 12px 30px rgba(61, 46, 30, 0.2);
    }

    .canvas-filter-default {
        filter: none;
        border-radius: 4px;
        box-shadow: 0 15px 35px rgba(0,0,0,0.12), 0 0 1px rgba(0,0,0,0.15);
    }

    /* HALM Signature Navigation Buttons (Glassmorphism + Gold/Wine) */
    .halm-nav-btn {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        width: 46px;
        height: 46px;
        background: rgba(26, 27, 24, 0.75);
        color: #D4AF37;
        border: 1px solid rgba(212, 175, 55, 0.35);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 40;
        transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        backdrop-filter: blur(8px);
        box-shadow: 0 8px 20px rgba(0,0,0,0.25);
    }

    .halm-nav-btn:hover:not(:disabled) {
        background-color: #8E3038;
        color: #FFFFFF;
        border-color: #A83B46;
        transform: translateY(-50%) scale(1.08);
        box-shadow: 0 10px 25px rgba(142, 48, 56, 0.4);
    }

    .halm-nav-btn:disabled {
        opacity: 0.18;
        cursor: not-allowed;
    }

    .halm-nav-btn.left { left: 20px; }
    .halm-nav-btn.right { right: 20px; }

    @media (max-width: 640px) {
        .halm-nav-btn { width: 38px; height: 38px; }
        .halm-nav-btn.left { left: 8px; }
        .halm-nav-btn.right { right: 8px; }
    }

    /* Font List in Aa Menu */
    .font-list-item {
        padding: 9px 12px;
        border-radius: 10px;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 13px;
        font-weight: 600;
        color: #9CA3AF;
        border: 1px solid transparent;
    }
    .font-list-item:hover {
        background-color: #222420;
        color: #EDE9DF;
    }
    .font-list-item.active {
        background-color: rgba(142, 48, 56, 0.2);
        border-color: rgba(212, 175, 55, 0.5);
        color: #D4AF37;
    }
`;

function loadScript(src) {
    return new Promise((resolve, reject) => {
        const existing = document.querySelector(`script[src="${src}"]`);
        if (existing) {
            resolve();
            return;
        }
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => resolve();
        script.onerror = (e) => reject(e);
        document.head.appendChild(script);
    });
}

const DEFAULT_PLAYLIST = [
    {
        id: 'rain',
        title: 'Tiếng mưa rơi êm dịu',
        subtitle: 'Mưa rào & tiếng tí tách thư thái',
        src: '/audio/rain.mp3',
        icon: 'ph-cloud-rain',
        color: 'text-sky-400'
    },
    {
        id: 'lofi',
        title: 'Giai điệu Lofi Chill đọc sách',
        subtitle: 'Lofi beats nhẹ nhàng, thư giãn',
        src: '/audio/lofi.mp3',
        icon: 'ph-headphones',
        color: 'text-amber-400'
    },
    {
        id: 'ambient',
        title: 'Không gian tập trung sâu',
        subtitle: 'Sóng âm kích thích tư duy Deep Focus',
        src: '/audio/ambient.mp3',
        icon: 'ph-brain',
        color: 'text-purple-400'
    },
    {
        id: 'nature',
        title: 'Thiên nhiên trong lành',
        subtitle: 'Gió nhẹ & tiếng chim rừng tự nhiên',
        src: '/audio/nature.mp3',
        icon: 'ph-tree',
        color: 'text-emerald-400'
    }
];

export default function DocSach() {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const bookId = id || searchParams.get('id');

    // 0. Trial Mode Detection & Limitations (Mặc định là bản đọc thử trừ khi được chỉ định mode=full từ Tủ Sách hoặc đã thuê)
    const modeParam = searchParams.get('mode');
    const isPersonalBookId = Boolean(bookId && String(bookId).startsWith('personal_'));
    const [isTrialMode, setIsTrialMode] = useState(
        modeParam === 'full' || isPersonalBookId ? false : true
    );
    const [isTrialModalOpen, setIsTrialModalOpen] = useState(false);

    // 1. Book & PDF state
    const [book, setBook] = useState(() => {
        try {
            const raw = sessionStorage.getItem('halm-reader-book');
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    });

    const targetId = bookId || book?.book_id || book?.id || '';
    const [pdfUrl, setPdfUrl] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");
    const [bookFormat, setBookFormat] = useState('PDF'); // 'PDF' | 'EPUB'

    // 2. Reading Engine State (Default to 'canvas' so the book ALWAYS opens immediately without blank screen)
    const [pdfDoc, setPdfDoc] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [numPages, setNumPages] = useState(0);
    // Tính số trang tối đa đọc thử: tối thiểu 3 trang, tối đa 10 trang hoặc 10% tổng số trang của cuốn sách
    const maxTrialPages = isTrialMode
        ? Math.min(10, Math.max(3, Math.ceil((numPages || 10) * 0.1)))
        : (numPages || 1);
    const [zoomLevel, setZoomLevel] = useState(1.0);
    const [isRendering, setIsRendering] = useState(false);

    // Modes: 'canvas' (Trang in PDF gốc) | 'text' (Chế độ đọc chữ reflow) | 'epub' (Trình đọc sách số EPUB) | 'embed' (Iframe)
    const [readMode, setReadMode] = useState('canvas');
    const [paperTheme, setPaperTheme] = useState('default'); // 'default' | 'sepia' | 'starry' | 'night'
    const [fontFamily, setFontFamily] = useState('garamond');
    const [fontSize, setFontSize] = useState(20);
    const [lineHeight, setLineHeight] = useState(1.85); // 1.5 | 1.85 | 2.2
    const [contentWidth, setContentWidth] = useState(860); // 680 | 860 | 1080
    const [textAlign, setTextAlign] = useState('justify'); // 'justify' | 'left'
    const [pageOutline, setPageOutline] = useState([]);

    // 3. Text Reflow Pagination state (Tự động tràn trang không cuộn)
    const [currentPageText, setCurrentPageText] = useState("");
    const [textSubPageIndex, setTextSubPageIndex] = useState(0);
    const [totalSubPages, setTotalSubPages] = useState(1);
    const [columnWidth, setColumnWidth] = useState(780);

    // 4. Notes & Bookmarks
    const [notes, setNotes] = useState(() => {
        try {
            const raw = localStorage.getItem(`halm-book-notes-${bookId || 'default'}`);
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    });
    const [activeTocTab, setActiveTocTab] = useState('toc'); // 'toc' | 'note'
    const [floatingBtnPos, setFloatingBtnPos] = useState(null);
    const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
    const [noteDraftText, setNoteDraftText] = useState("");
    const [selectedQuoteText, setSelectedQuoteText] = useState("");

    // 5. Drawers & Extras
    const [isTocOpen, setIsTocOpen] = useState(false);
    const [isAaOpen, setIsAaOpen] = useState(false);
    const [isAudioOpen, setIsAudioOpen] = useState(false);
    const [isPlayingMusic, setIsPlayingMusic] = useState(false);
    const [audioTab, setAudioTab] = useState('kho'); // 'kho' | 'tai'
    const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
    const [volume, setVolume] = useState(0.75);
    const [customTracks, setCustomTracks] = useState([]);
    const [toastMessage, setToastMessage] = useState("");

    const playlist = useMemo(() => [...DEFAULT_PLAYLIST, ...customTracks], [customTracks]);
    const currentTrack = playlist[currentTrackIndex] || playlist[0];

    const canvasRef = useRef(null);
    const renderTaskRef = useRef(null);
    const audioRef = useRef(null);
    const toastTimerRef = useRef(null);
    const textViewportRef = useRef(null);
    const textContainerRef = useRef(null);
    const starryBgRef = useRef(null);
    const epubViewerRef = useRef(null);
    const renditionRef = useRef(null);
    const epubBookRef = useRef(null);

    const applyEpubStyling = useCallback((rendition, theme, font, size) => {
        if (!rendition || !rendition.themes) return;
        try {
            rendition.themes.fontSize(`${size}px`);
            const fontMap = {
                garamond: '"Cormorant Garamond", serif',
                lora: 'Lora, serif',
                inter: 'Inter, sans-serif',
                roboto: 'Roboto, sans-serif',
                times: '"Times New Roman", serif',
            };
            const selectedFont = fontMap[font] || 'sans-serif';
            rendition.themes.font(selectedFont);

            let bg = '#FAF7F2';
            let fg = '#1E1F1D';
            if (theme === 'starry') {
                bg = '#111210';
                fg = '#EDE9DF';
            } else if (theme === 'night') {
                bg = '#181916';
                fg = '#EDE9DF';
            } else if (theme === 'sepia') {
                bg = '#F4ECD8';
                fg = '#5B4636';
            }

            rendition.themes.override("color", fg, true);
            rendition.themes.override("background", bg, true);
            rendition.themes.override("font-family", selectedFont, true);
            rendition.themes.override("font-size", `${size}px`, true);
            rendition.themes.override("line-height", String(lineHeight || 1.85), true);

            rendition.themes.default({
                body: {
                    color: `${fg} !important`,
                    background: `${bg} !important`,
                    'font-family': `${selectedFont} !important`,
                    'font-size': `${size}px !important`,
                    'line-height': `${lineHeight || 1.85} !important`,
                    padding: '20px 28px !important'
                },
                'p, span, div, h1, h2, h3, h4, h5, h6': {
                    color: `${fg} !important`,
                    'font-family': `${selectedFont} !important`
                }
            });
        } catch (err) {
            console.warn("Không thể cập nhật style cho EPUB:", err);
        }
    }, [lineHeight]);

    useEffect(() => {
        if (renditionRef.current) {
            applyEpubStyling(renditionRef.current, paperTheme, fontFamily, fontSize);
        }
    }, [paperTheme, fontFamily, fontSize, lineHeight, applyEpubStyling]);

    const showToast = useCallback((msg) => {
        setToastMessage(msg);
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        toastTimerRef.current = setTimeout(() => setToastMessage(""), 2800);
    }, []);

    // Load External Design Assets
    useEffect(() => {
        const links = externalStylesheets
            .filter((href) => !document.querySelector(`link[href="${href}"]`))
            .map((href) => {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = href;
                document.head.appendChild(link);
                return link;
            });

        window.tailwind = window.tailwind || {};
        window.tailwind.config = tailwindConfig;
        if (!document.querySelector('script[data-halm-tailwind]')) {
            const script = document.createElement('script');
            script.src = 'https://cdn.tailwindcss.com';
            script.dataset.halmTailwind = 'true';
            document.head.appendChild(script);
        }

        return () => {
            // Giữ lại font và phosphor icons cho các trang người dùng khác
            if (document.fullscreenElement) {
                try {
                    document.exitFullscreen();
                } catch (e) {}
            }
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.width = '';
            document.body.style.height = '';
            document.documentElement.style.overflow = '';
            document.documentElement.style.height = '';
            const preOverlays = document.querySelectorAll('#book-transition-pre-overlay, .epub-container, .epub-view');
            preOverlays.forEach(el => {
                if (el && el.parentNode && el.id === 'book-transition-pre-overlay') {
                    try { el.parentNode.removeChild(el); } catch (_) {}
                }
            });
            window.dispatchEvent(new Event('resize'));
        };
    }, []);

    // Tự động ẩn nút lưu trích dẫn khi đã hủy bôi đen văn bản
    useEffect(() => {
        const handleSelectionChange = () => {
            const sel = window.getSelection();
            const text = sel ? sel.toString().trim() : '';
            if (!text || text.length < 3) {
                setFloatingBtnPos(null);
            }
        };
        document.addEventListener('selectionchange', handleSelectionChange);
        return () => {
            document.removeEventListener('selectionchange', handleSelectionChange);
        };
    }, []);

    // Create Twinkling Stars in starry mode
    useEffect(() => {
        if (paperTheme === 'starry' && starryBgRef.current) {
            starryBgRef.current.innerHTML = '';
            const starCount = 45;
            for (let i = 0; i < starCount; i++) {
                const star = document.createElement('div');
                star.className = 'star';
                const size = Math.random() * 2 + 1;
                star.style.width = `${size}px`;
                star.style.height = `${size}px`;
                star.style.top = `${Math.random() * 100}%`;
                star.style.left = `${Math.random() * 100}%`;
                star.style.animationDelay = `${Math.random() * 4}s`;
                star.style.animationDuration = `${Math.random() * 3 + 2}s`;
                starryBgRef.current.appendChild(star);
            }
        }
    }, [paperTheme]);

    // Save notes to localStorage
    useEffect(() => {
        if (bookId) {
            localStorage.setItem(`halm-book-notes-${bookId}`, JSON.stringify(notes));
        }
    }, [notes, bookId]);

    // Đồng bộ âm lượng phát nhạc nền
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
        }
    }, [volume]);

    // 1. Unified Buffer-First Reader Engine (Hỗ trợ PDF & EPUB với phân tích Magic Bytes thực tế)
    useEffect(() => {
        let isCancelled = false;

        // Ghi nhận hoàn thành nhiệm vụ hằng ngày: Đọc sách hôm nay
        const todayKey = new Date().toISOString().slice(0, 10);
        try {
            localStorage.setItem(`halm_daily_action_read_${todayKey}`, 'true');
        } catch {}
        window.dispatchEvent(new CustomEvent('halm-daily-task-completed', { detail: { task: 'read' } }));

        const loadAndRenderBook = async () => {
            setIsLoading(true);
            setErrorMessage("");

            let currentBook = book;
            let effectiveId = bookId || currentBook?.book_id || currentBook?.id;

            // Nếu người dùng vào /docsach trực tiếp mà không có id và session, tự động lấy cuốn sách đầu tiên làm mặc định
            if (!effectiveId) {
                try {
                    const listRes = await axiosInstance.get('/api/home/books', { params: { size: 1 } });
                    const firstBook = listRes.data?.content?.[0];
                    if (firstBook) {
                        effectiveId = firstBook.book_id || firstBook.id;
                        currentBook = firstBook;
                        setBook(firstBook);
                    }
                } catch (e) {
                    console.warn("Không thể tải sách mặc định:", e);
                }
            }

            const isPersonalBook = effectiveId && String(effectiveId).startsWith('personal_');
            let arrayBuffer = null;

            if (isPersonalBook) {
                try {
                    const personalBook = await getPersonalBookById(effectiveId);
                    if (personalBook && !isCancelled) {
                        currentBook = {
                            book_id: personalBook.id,
                            id: personalBook.id,
                            bookTitle: personalBook.title,
                            title: personalBook.title,
                            authorName: personalBook.author,
                            author: personalBook.author,
                            cover_image: personalBook.coverUrl,
                            coverImage: personalBook.coverUrl,
                            imgUrl: personalBook.coverUrl,
                            fileFormat: personalBook.format,
                            isPersonal: true
                        };
                        setBook(currentBook);
                        sessionStorage.setItem('halm-reader-book', JSON.stringify(currentBook));
                        setIsTrialMode(false);

                        if (personalBook.fileArrayBuffer && personalBook.fileArrayBuffer.byteLength > 0) {
                            arrayBuffer = personalBook.fileArrayBuffer;
                        } else if (personalBook.fileBlob) {
                            if (personalBook.fileBlob instanceof ArrayBuffer) {
                                arrayBuffer = personalBook.fileBlob;
                            } else if (typeof personalBook.fileBlob.arrayBuffer === 'function') {
                                arrayBuffer = await personalBook.fileBlob.arrayBuffer();
                            }
                        }
                    }
                } catch (pErr) {
                    console.error("Không thể đọc sách cá nhân từ IndexedDB:", pErr);
                }
            } else if (effectiveId && (!currentBook || (currentBook.book_id !== effectiveId && currentBook.id !== effectiveId))) {
                try {
                    const res = await axiosInstance.get(`/api/home/books/${encodeURIComponent(effectiveId)}`);
                    if (res.data && !isCancelled) {
                        currentBook = res.data;
                        setBook(res.data);
                        sessionStorage.setItem('halm-reader-book', JSON.stringify(res.data));
                    }
                } catch (err) {
                    console.warn("Không thể tải chi tiết sách từ API:", err);
                }
            }

            let resumePageNumber = 1;
            if (effectiveId) {
                try {
                    const localProg = localStorage.getItem(`halm_reading_progress_${effectiveId}`);
                    if (localProg) {
                        const parsed = JSON.parse(localProg);
                        if (parsed.currentPage && Number(parsed.currentPage) > 1) {
                            resumePageNumber = Number(parsed.currentPage);
                        }
                    }
                } catch (_) {}
            }

            // Nạp danh sách ghi chú & bookmarks
            if (effectiveId) {
                if (isPersonalBook) {
                    try {
                        const localBm = localStorage.getItem(`halm-book-notes-${effectiveId}`);
                        if (localBm) setNotes(JSON.parse(localBm));
                    } catch (_) {}
                } else {
                    try {
                        const bmRes = await axiosInstance.get(`/api/home/books/${encodeURIComponent(effectiveId)}/bookmarks`);
                        if (Array.isArray(bmRes.data) && bmRes.data.length > 0) {
                            setNotes(bmRes.data);
                            localStorage.setItem(`halm-book-notes-${effectiveId}`, JSON.stringify(bmRes.data));
                        }
                    } catch (_) {}

                    // Tự động mở khóa bản đầy đủ nếu khách hàng đã thuê hoặc sở hữu sách, khôi phục trang đọc dở
                    try {
                        const accessDetail = await getBookAccessDetail(effectiveId);
                        if (accessDetail?.hasAccess && !isCancelled) {
                            setIsTrialMode(false);
                            if (accessDetail.currentPage && Number(accessDetail.currentPage) > 1) {
                                resumePageNumber = Number(accessDetail.currentPage);
                            }
                        }
                    } catch (_) {}
                }
            }

            // Lấy URL đọc sách từ backend (nếu không phải sách cá nhân)
            let resolvedUrl = "";
            let metaFormat = (currentBook?.fileFormat || '').toUpperCase();
            if (effectiveId && !isPersonalBook) {
                try {
                    const readUrlRes = await axiosInstance.get(`/api/home/books/${encodeURIComponent(effectiveId)}/read-url`);
                    if (readUrlRes.data?.readUrl) {
                        resolvedUrl = readUrlRes.data.readUrl;
                    }
                    if (readUrlRes.data?.fileFormat) {
                        metaFormat = readUrlRes.data.fileFormat.toUpperCase();
                    }
                } catch (err) {
                    console.warn("API read-url không phản hồi:", err);
                }
            }

            if (!resolvedUrl && currentBook?.pdf_url) {
                resolvedUrl = currentBook.pdf_url;
            }

            if (resolvedUrl) {
                setPdfUrl(resolvedUrl);
            }

            if (isCancelled) return;

            // 1. Tải nhị phân (ArrayBuffer) vào RAM: Không bao giờ dùng iframe để tránh trình duyệt tải file về máy
            if (!arrayBuffer && effectiveId && !isPersonalBook) {
                try {
                    const contentRes = await axiosInstance.get(`/api/home/books/${encodeURIComponent(effectiveId)}/content`, {
                        responseType: 'arraybuffer'
                    });
                    if (contentRes.data && contentRes.data.byteLength > 0) {
                        arrayBuffer = contentRes.data;
                    }
                } catch (cErr) {
                    console.warn("Không thể tải buffer từ /content, fallback sang URL:", cErr);
                }
            }

            if (!arrayBuffer && resolvedUrl) {
                try {
                    const directRes = await axiosInstance.get(resolvedUrl, { responseType: 'arraybuffer' });
                    if (directRes.data && directRes.data.byteLength > 0) {
                        arrayBuffer = directRes.data;
                    }
                } catch (dErr) {
                    console.warn("Không thể tải buffer từ URL:", dErr);
                }
            }

            // Fallback đọc thử mẫu: Nếu sách trên hệ thống chưa có file PDF / EPUB thực tế
            if (!arrayBuffer && !resolvedUrl) {
                try {
                    const sampleRes = await axiosInstance.get('/sample.pdf', { responseType: 'arraybuffer' });
                    if (sampleRes.data && sampleRes.data.byteLength > 0 && !isCancelled) {
                        arrayBuffer = sampleRes.data;
                        metaFormat = 'PDF';
                        showToast("Đang hiển thị bản đọc thử mô phỏng của cuốn sách.");
                    }
                } catch (sErr) {
                    console.warn("Không thể tải sample.pdf fallback:", sErr);
                }
            }

            if (isCancelled) return;

            // 2. Nhận diện định dạng thực tế qua Magic Bytes của tệp nhị phân
            let isPdf = false;
            let isEpub = false;

            if (arrayBuffer && arrayBuffer.byteLength >= 4) {
                const header = new Uint8Array(arrayBuffer.slice(0, 4));
                // %PDF (0x25, 0x50, 0x44, 0x46) -> Định dạng PDF
                if (header[0] === 0x25 && header[1] === 0x50 && header[2] === 0x44 && header[3] === 0x46) {
                    isPdf = true;
                }
                // PK.. (0x50, 0x4B) -> ZIP container của EPUB
                else if (header[0] === 0x50 && header[1] === 0x4B) {
                    isEpub = true;
                }
            }

            // Fallback nhận diện nếu chưa có magic bytes
            if (!isPdf && !isEpub) {
                if (metaFormat === 'EPUB' || (resolvedUrl && resolvedUrl.toLowerCase().includes('.epub'))) {
                    isEpub = true;
                } else {
                    isPdf = true;
                }
            }

            setBookFormat(isEpub ? 'EPUB' : 'PDF');

            // 3. Khởi tạo Engine đọc tương ứng
            if (isEpub) {
                setReadMode('epub');
                await renderEpubDoc(arrayBuffer || resolvedUrl);
            } else {
                setReadMode('canvas');
                await renderPdfDoc(arrayBuffer, resolvedUrl);
            }
        };

        const renderEpubDoc = async (source) => {
            try {
                if (!window.JSZip) {
                    try {
                        await loadScript('/libs/jszip.min.js');
                    } catch {
                        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');
                    }
                }
                if (!window.ePub) {
                    try {
                        await loadScript('/libs/epub.min.js');
                    } catch {
                        await loadScript('https://cdn.jsdelivr.net/npm/epubjs@0.3.93/dist/epub.min.js');
                    }
                }
                if (isCancelled) return;

                if (epubBookRef.current) {
                    try { epubBookRef.current.destroy(); } catch {}
                }

                // Không bao giờ chuyển đổi sang Blob URL vì epub.js sẽ hiểu nhầm blob: URL là một thư mục (directory) trên HTTP server
                // Khi truyền trực tiếp ArrayBuffer vào ePub(), epub.js tự nhận diện là "binary" và dùng JSZip giải nén 100% trong RAM
                let epubInput = source;
                if (source && source.buffer instanceof ArrayBuffer && !(source instanceof ArrayBuffer)) {
                    epubInput = source.buffer;
                }

                let epubBook;
                if (epubInput instanceof ArrayBuffer) {
                    epubBook = window.ePub(epubInput);
                } else {
                    epubBook = window.ePub(epubInput, { openAs: 'epub' });
                }
                epubBookRef.current = epubBook;

                let retries = 0;
                let viewerEl = epubViewerRef.current || document.getElementById('halm-epub-viewer');
                while (!viewerEl && retries < 50) {
                    await new Promise(r => setTimeout(r, 50));
                    viewerEl = epubViewerRef.current || document.getElementById('halm-epub-viewer');
                    retries++;
                    if (isCancelled) return;
                }

                if (!viewerEl) {
                    throw new Error("Không tìm thấy khung hiển thị EPUB.");
                }

                viewerEl.innerHTML = '';
                const rendition = epubBook.renderTo(viewerEl, {
                    width: '100%',
                    height: '100%',
                    flow: 'paginated',
                    spread: 'none',
                    allowScriptedContent: true
                });
                renditionRef.current = rendition;

                rendition.hooks.content.register(() => {
                    applyEpubStyling(rendition, paperTheme, fontFamily, fontSize);
                });

                applyEpubStyling(rendition, paperTheme, fontFamily, fontSize);

                await rendition.display();
                if (isCancelled) return;

                setCurrentPage(1);
                setIsLoading(false);

                // Mục lục sách EPUB
                epubBook.loaded.navigation.then((nav) => {
                    if (!isCancelled && nav?.toc && Array.isArray(nav.toc) && nav.toc.length > 0) {
                        setPageOutline(nav.toc.map((item) => ({
                            title: item.label ? item.label.trim() : 'Mục',
                            dest: item.href
                        })));
                    }
                }).catch(() => {});

                // Sinh locations để tính số trang
                epubBook.ready.then(() => {
                    return epubBook.locations.generate(1024);
                }).then(() => {
                    if (!isCancelled && epubBook.locations) {
                        const total = epubBook.locations.total || 1;
                        setNumPages(total);
                    }
                }).catch(() => {
                    if (!isCancelled) setNumPages(50);
                });

                rendition.on('relocated', (location) => {
                    if (!isCancelled && epubBook.locations && epubBook.locations.total) {
                        const percent = epubBook.locations.percentageFromCfi(location.start.cfi);
                        const page = Math.max(1, Math.floor(percent * epubBook.locations.total) + 1);
                        setCurrentPage(page);
                    }
                });

                rendition.on('selected', (cfiRange, contents) => {
                    try {
                        const selection = contents.window.getSelection();
                        const text = selection ? selection.toString().trim() : '';
                        if (text.length >= 3) {
                            setSelectedQuoteText(text);
                            setFloatingBtnPos({
                                top: Math.max(60, window.innerHeight / 2 - 40),
                                left: Math.max(20, window.innerWidth / 2 - 50),
                                selectedText: text
                            });
                        }
                    } catch {}
                });
            } catch (err) {
                if (isCancelled) return;
                console.error("Lỗi khởi tạo sách EPUB:", err);
                setIsLoading(false);
                setErrorMessage("Không thể hiển thị nội dung sách EPUB. Vui lòng kiểm tra lại tính hợp lệ của tệp.");
            }
        };

        const renderPdfDoc = async (arrayBuffer, url) => {
            try {
                if (!window.pdfjsLib) {
                    try {
                        await loadScript('/libs/pdf.min.js');
                    } catch {
                        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js');
                    }
                }
                if (window.pdfjsLib && !window.pdfjsLib.GlobalWorkerOptions.workerSrc) {
                    window.pdfjsLib.GlobalWorkerOptions.workerSrc = '/libs/pdf.worker.min.js';
                }
                if (isCancelled) return;

                let loadingTask = null;
                if (arrayBuffer) {
                    loadingTask = window.pdfjsLib.getDocument({
                        data: new Uint8Array(arrayBuffer)
                    });
                } else if (url) {
                    loadingTask = window.pdfjsLib.getDocument({
                        url: url,
                        withCredentials: false,
                    });
                }

                if (!loadingTask) {
                    throw new Error("Không có dữ liệu tệp PDF để hiển thị.");
                }

                const loadedPdf = await loadingTask.promise;
                if (isCancelled) return;

                setPdfDoc(loadedPdf);
                setNumPages(loadedPdf.numPages);
                const startPage = (resumePageNumber > 1 && resumePageNumber <= loadedPdf.numPages) ? resumePageNumber : 1;
                setCurrentPage(startPage);
                if (startPage > 1) {
                    showToast(`Chào mừng trở lại! Đang tiếp tục tại trang ${startPage}/${loadedPdf.numPages}`);
                }
                setIsLoading(false);

                try {
                    const outline = await loadedPdf.getOutline();
                    if (!isCancelled && Array.isArray(outline) && outline.length > 0) {
                        setPageOutline(outline);
                    }
                } catch {}
            } catch (err) {
                if (isCancelled) return;
                console.error("Lỗi khởi tạo PDF:", err);
                // Thử tải sample.pdf dự phòng nếu file tải về bị lỗi
                if (!arrayBuffer?.isSampleFallback) {
                    try {
                        const sampleRes = await axiosInstance.get('/sample.pdf', { responseType: 'arraybuffer' });
                        if (sampleRes.data && sampleRes.data.byteLength > 0 && !isCancelled) {
                            const fallbackBuf = sampleRes.data;
                            fallbackBuf.isSampleFallback = true;
                            showToast("Đang hiển thị bản đọc thử mô phỏng của cuốn sách.");
                            await renderPdfDoc(fallbackBuf, null);
                            return;
                        }
                    } catch (_) {}
                }
                setIsLoading(false);
                setErrorMessage("Không thể hiển thị tệp PDF. Tệp có thể đã bị hỏng hoặc chưa được tải lên đầy đủ.");
            }
        };

        loadAndRenderBook();

        return () => {
            isCancelled = true;
            if (epubBookRef.current) {
                try { epubBookRef.current.destroy(); } catch {}
            }
        };
    }, [bookId, applyEpubStyling]);

    // 3. Render Canvas (Trang in PDF gốc)
    const renderCanvasPage = useCallback(async (pageNum) => {
        if (!pdfDoc || !canvasRef.current) return;

        try {
            setIsRendering(true);
            if (renderTaskRef.current) {
                try {
                    renderTaskRef.current.cancel();
                } catch {}
            }

            const page = await pdfDoc.getPage(pageNum);
            const canvas = canvasRef.current;
            if (!canvas) return;

            const context = canvas.getContext('2d');
            const unscaledViewport = page.getViewport({ scale: 1.0 });

            const container = canvas.parentElement;
            const containerW = container && container.clientWidth > 0 ? container.clientWidth - 40 : window.innerWidth * 0.8;
            const containerH = container && container.clientHeight > 0 ? container.clientHeight - 40 : window.innerHeight * 0.82;

            const baseScale = Math.min(containerW / unscaledViewport.width, containerH / unscaledViewport.height);
            const finalScale = (baseScale > 0 ? baseScale : 1.0) * zoomLevel;

            const viewport = page.getViewport({ scale: finalScale });
            const outputScale = window.devicePixelRatio || 1;

            canvas.width = Math.floor(viewport.width * outputScale);
            canvas.height = Math.floor(viewport.height * outputScale);
            canvas.style.width = Math.floor(viewport.width) + 'px';
            canvas.style.height = Math.floor(viewport.height) + 'px';

            const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null;

            const renderContext = {
                canvasContext: context,
                transform,
                viewport,
            };

            const renderTask = page.render(renderContext);
            renderTaskRef.current = renderTask;
            await renderTask.promise;
            setIsRendering(false);
        } catch (err) {
            if (err?.name !== 'RenderingCancelledException') {
                console.error("Lỗi render canvas PDF:", err);
            }
            setIsRendering(false);
        }
    }, [pdfDoc, zoomLevel]);

    // Always render canvas when on canvas mode OR when text mode needs fallback
    useEffect(() => {
        if (pdfDoc && (readMode === 'canvas' || !currentPageText)) {
            renderCanvasPage(currentPage);
        }
    }, [currentPage, pdfDoc, zoomLevel, readMode, currentPageText, renderCanvasPage]);

    // Tự động lưu tiến độ đọc sách thời gian thực lên Server & LocalStorage
    useEffect(() => {
        if (!targetId || numPages <= 0 || currentPage < 1 || isTrialMode) return;
        const timer = setTimeout(() => {
            const percentage = Math.min(100, Math.round((currentPage / numPages) * 1000) / 10);
            updateReadingProgress(targetId, {
                currentPage,
                readingPercentage: percentage,
                totalPages: numPages
            });
            try {
                localStorage.setItem(`halm_reading_progress_${targetId}`, JSON.stringify({
                    currentPage,
                    readingPercentage: percentage,
                    updatedAt: new Date().toISOString()
                }));
            } catch (_) {}
        }, 1200);
        return () => clearTimeout(timer);
    }, [currentPage, numPages, targetId, isTrialMode]);

    // 4. Extract Text for Text Mode
    useEffect(() => {
        if (!pdfDoc) return;

        let isCancelled = false;

        const extractText = async () => {
            try {
                const page = await pdfDoc.getPage(currentPage);
                const textContent = await page.getTextContent();
                
                let lastY = null;
                let fullText = '';
                
                for (const item of textContent.items) {
                    if (!item.str) continue;
                    if (lastY !== null && Math.abs(item.transform[5] - lastY) > 8) {
                        fullText += '\n\n';
                    } else if (lastY !== null && !fullText.endsWith(' ') && !item.str.startsWith(' ')) {
                        fullText += ' ';
                    }
                    fullText += item.str;
                    lastY = item.transform[5];
                }

                if (!isCancelled) {
                    setCurrentPageText(fullText.trim());
                    setTextSubPageIndex(0);
                }
            } catch (err) {
                console.error("Lỗi bóc tách text:", err);
            }
        };

        extractText();

        return () => {
            isCancelled = true;
        };
    }, [pdfDoc, currentPage]);

    // 5. Reflow Column Calculation
    const recalculateReflowPages = useCallback(() => {
        if (readMode !== 'text' || !textContainerRef.current || !textViewportRef.current) return;

        const viewport = textViewportRef.current;
        const container = textContainerRef.current;

        const width = viewport.clientWidth;
        setColumnWidth(width);

        const scrollW = container.scrollWidth;
        const gap = 60;
        const total = Math.max(1, Math.ceil((scrollW + gap / 2) / (width + gap)));

        setTotalSubPages(total);
        if (textSubPageIndex >= total) {
            setTextSubPageIndex(Math.max(0, total - 1));
        }
    }, [readMode, textSubPageIndex]);

    useEffect(() => {
        const timer = setTimeout(recalculateReflowPages, 60);
        window.addEventListener('resize', recalculateReflowPages);
        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', recalculateReflowPages);
        };
    }, [currentPageText, fontSize, fontFamily, recalculateReflowPages]);

    // 6. Navigation Logic with Sub-page & EPUB Support
    const changePage = (delta) => {
        if (readMode === 'epub' && renditionRef.current) {
            if (delta > 0 && isTrialMode && currentPage >= maxTrialPages) {
                setIsTrialModalOpen(true);
                showToast("Bạn đã đọc đến trang cuối của bản đọc thử!");
                return;
            }
            if (delta > 0) {
                renditionRef.current.next();
            } else {
                renditionRef.current.prev();
            }
            return;
        }

        if (readMode === 'text' && currentPageText) {
            if (delta > 0) {
                if (textSubPageIndex < totalSubPages - 1) {
                    setTextSubPageIndex(prev => prev + 1);
                    return;
                }
                // Giới hạn trang ở chế độ đọc thử
                if (isTrialMode && currentPage >= maxTrialPages) {
                    setIsTrialModalOpen(true);
                    showToast("Bạn đã đọc đến trang cuối của bản đọc thử!");
                    return;
                }
                if (currentPage < numPages) {
                    setCurrentPage(p => p + 1);
                    setTextSubPageIndex(0);
                }
            } else {
                if (textSubPageIndex > 0) {
                    setTextSubPageIndex(prev => prev - 1);
                    return;
                }
                if (currentPage > 1) {
                    setCurrentPage(p => p - 1);
                    setTextSubPageIndex(0);
                }
            }
        } else {
            if (delta > 0) {
                // Giới hạn trang ở chế độ đọc thử
                if (isTrialMode && currentPage >= maxTrialPages) {
                    setIsTrialModalOpen(true);
                    showToast("Bạn đã đọc đến trang cuối của bản đọc thử!");
                    return;
                }
                const next = currentPage + delta;
                if (next >= 1 && next <= numPages) {
                    setCurrentPage(next);
                }
            } else {
                const next = currentPage + delta;
                if (next >= 1) {
                    setCurrentPage(next);
                }
            }
        }
    };

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
                e.preventDefault();
                changePage(1);
            }
            if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
                e.preventDefault();
                changePage(-1);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    });

    // Text selection & highlight
    const handleMouseUpText = () => {
        const selection = window.getSelection();
        const text = selection ? selection.toString().trim() : '';

        if (text.length >= 3 && textViewportRef.current) {
            try {
                const range = selection.getRangeAt(0);
                const rect = range.getBoundingClientRect();
                setFloatingBtnPos({
                    top: Math.max(65, rect.top - 45),
                    left: Math.max(20, rect.left + rect.width / 2 - 70),
                    selectedText: text,
                });
            } catch {
                setFloatingBtnPos(null);
            }
        } else {
            setFloatingBtnPos(null);
        }
    };

    // Đánh dấu & bôi đậm trực tiếp (1-click Instant Highlight & Bold)
    const handleQuickHighlight = async (textToHighlight) => {
        const text = (textToHighlight || floatingBtnPos?.selectedText || '').trim();
        if (!text) return;
        const targetId = bookId || (book ? (book.book_id || book.id) : '');
        const localId = `note_${Date.now()}`;
        const newNote = {
            id: localId,
            bookId: targetId || 'default',
            pageNumber: currentPage,
            subPage: textSubPageIndex + 1,
            selectedText: text,
            personalNote: 'Đoạn văn tâm đắc đã đánh dấu',
            isHighlight: true,
            createdAt: new Date().toLocaleDateString('vi-VN', {
                hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit'
            }),
        };

        setNotes(prev => [newNote, ...prev]);
        setFloatingBtnPos(null);
        if (window.getSelection) {
            window.getSelection().removeAllRanges();
        }
        showToast("Đã bôi đậm đoạn văn & lưu vào sổ tay!");

        if (targetId) {
            try {
                const res = await axiosInstance.post(`/api/home/books/${encodeURIComponent(targetId)}/bookmarks`, {
                    pageNumber: currentPage,
                    selectedText: newNote.selectedText,
                    personalNote: newNote.personalNote
                });
                if (res.data?.noteId) {
                    setNotes(prev => prev.map(n => n.id === localId ? { ...n, id: res.data.noteId, noteId: res.data.noteId } : n));
                }
            } catch (err) {
                console.warn('Lỗi khi lưu đánh dấu lên server:', err);
            }
        }
    };

    const handleSaveNote = async () => {
        if (!selectedQuoteText) return;
        const targetId = bookId || (book ? (book.book_id || book.id) : '');
        const localId = `note_${Date.now()}`;
        const newNote = {
            id: localId,
            bookId: targetId || 'default',
            pageNumber: currentPage,
            subPage: textSubPageIndex + 1,
            selectedText: selectedQuoteText,
            personalNote: noteDraftText.trim(),
            createdAt: new Date().toLocaleDateString('vi-VN', {
                hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit'
            }),
        };

        setNotes(prev => [newNote, ...prev]);
        setIsNoteModalOpen(false);
        setNoteDraftText("");
        setSelectedQuoteText("");
        setFloatingBtnPos(null);
        if (window.getSelection) {
            window.getSelection().removeAllRanges();
        }
        showToast("Đã bôi đậm trích dẫn & lưu ghi chú!");

        if (targetId) {
            try {
                const res = await axiosInstance.post(`/api/home/books/${encodeURIComponent(targetId)}/bookmarks`, {
                    pageNumber: currentPage,
                    selectedText: newNote.selectedText,
                    personalNote: newNote.personalNote
                });
                if (res.data?.noteId) {
                    setNotes(prev => prev.map(n => n.id === localId ? { ...n, id: res.data.noteId, noteId: res.data.noteId } : n));
                }
            } catch (err) {
                console.warn('Lỗi khi lưu ghi chú lên server:', err);
            }
        }
    };

    const handleDeleteNote = async (noteId, e) => {
        e.stopPropagation();
        setNotes(prev => prev.filter(n => n.id !== noteId && n.noteId !== noteId));
        showToast("Đã xóa ghi chú.");
        if (noteId && !String(noteId).startsWith('note_')) {
            try {
                await axiosInstance.delete(`/api/home/books/bookmarks/${noteId}`);
            } catch (_) {}
        }
    };

    const handleJumpToNote = (note) => {
        if (!note) return;
        const pageNum = parseInt(note.pageNumber, 10);
        if (!isNaN(pageNum) && pageNum > 0) {
            if (isTrialMode && pageNum > maxTrialPages) {
                setIsTrialModalOpen(true);
                return;
            }
            setCurrentPage(pageNum);
            if (note.subPage) {
                setTextSubPageIndex(Math.max(0, parseInt(note.subPage, 10) - 1));
            } else {
                setTextSubPageIndex(0);
            }
            if (readMode === 'epub' && renditionRef.current) {
                if (note.cfi) {
                    renditionRef.current.display(note.cfi);
                } else {
                    renditionRef.current.display(pageNum);
                }
            }
        }
        setIsTocOpen(false);
        showToast(`Đã lật đến Trang ${note.pageNumber}`);
    };

    // Render văn bản kèm bôi đậm (bold) & highlight cho các đoạn trích dẫn đã đánh dấu
    const renderParagraphWithHighlights = (para, pIdx) => {
        const pageNotes = notes.filter(n => Number(n.pageNumber) === Number(currentPage));
        if (!pageNotes || pageNotes.length === 0) {
            return <p key={pIdx} className="mb-4 leading-relaxed indent-6">{para}</p>;
        }

        const validQuotes = pageNotes
            .map(n => (n.selectedText || '').trim())
            .filter(t => t.length >= 2 && para.includes(t))
            .sort((a, b) => b.length - a.length);

        if (validQuotes.length === 0) {
            return <p key={pIdx} className="mb-4 leading-relaxed indent-6">{para}</p>;
        }

        const escaped = validQuotes.map(q => q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
        const regex = new RegExp(`(${escaped.join('|')})`, 'g');
        const parts = para.split(regex);

        return (
            <p key={pIdx} className="mb-4 leading-relaxed indent-6">
                {parts.map((part, idx) => {
                    const matchedNote = pageNotes.find(n => (n.selectedText || '').trim() === part);
                    if (matchedNote) {
                        return (
                            <mark
                                key={idx}
                                className="bg-amber-300/80 dark:bg-amber-400/35 text-amber-950 dark:text-[#EDE9DF] font-bold rounded px-1.5 py-0.5 border-b-2 border-amber-600 dark:border-amber-400 cursor-pointer hover:bg-amber-400 dark:hover:bg-amber-400/50 transition-colors shadow-2xs select-text"
                                title={`Đoạn trích đã bôi đậm (Trang ${currentPage})${matchedNote.personalNote ? `: "${matchedNote.personalNote}"` : ''} - Nhấp để xem sổ tay`}
                                onClick={() => {
                                    setActiveTocTab('note');
                                    setIsTocOpen(true);
                                }}
                            >
                                {part}
                            </mark>
                        );
                    }
                    return part;
                })}
            </p>
        );
    };

    // Font adjustment
    const adjustFontSize = (delta) => {
        setFontSize(prev => {
            const next = prev + delta;
            if (next >= 14 && next <= 40) {
                showToast(`Cỡ chữ: ${next}px (Chữ tự tràn sang trang sau)`);
                return next;
            }
            return prev;
        });
    };

    // Fullscreen toggle
    const toggleFullScreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch((err) => {
                showToast(`Không thể bật toàn màn hình: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    };

    // Audio Player phát nhạc nền đọc sách (Lofi, Mưa, Không gian đọc)
    const toggleMusic = (trackIdx = null) => {
        if (!audioRef.current) return;
        
        // Nhấp vào một track cụ thể từ danh sách
        if (trackIdx !== null && typeof trackIdx === 'number') {
            const target = playlist[trackIdx];
            if (target) {
                if (currentTrackIndex === trackIdx && isPlayingMusic) {
                    audioRef.current.pause();
                    setIsPlayingMusic(false);
                    showToast(`Đã tạm dừng: ${target.title}`);
                    return;
                }
                setCurrentTrackIndex(trackIdx);
                audioRef.current.src = target.src;
                audioRef.current.currentTime = 0;
                audioRef.current.play().then(() => {
                    setIsPlayingMusic(true);
                    showToast(`Đang phát: ${target.title}`);
                }).catch(() => {
                    showToast("Vui lòng nhấp vào trang trước để trình duyệt cho phép phát âm thanh.");
                });
                return;
            }
        }

        // Bật / Tắt bài hiện tại
        if (isPlayingMusic) {
            audioRef.current.pause();
            setIsPlayingMusic(false);
            showToast("Đã tạm dừng nhạc nền.");
        } else {
            const target = playlist[currentTrackIndex] || playlist[0];
            const currentSrc = audioRef.current.getAttribute('src');
            if (!currentSrc || currentSrc !== target.src) {
                audioRef.current.src = target.src;
            }
            audioRef.current.play().then(() => {
                setIsPlayingMusic(true);
                showToast(`Đang phát: ${target.title}`);
            }).catch(() => {
                showToast("Vui lòng nhấp vào trang trước để trình duyệt cho phép phát âm thanh.");
            });
        }
    };

    const handleNextTrack = () => {
        const nextIdx = (currentTrackIndex + 1) % playlist.length;
        toggleMusic(nextIdx);
    };

    const handlePrevTrack = () => {
        const prevIdx = (currentTrackIndex - 1 + playlist.length) % playlist.length;
        toggleMusic(prevIdx);
    };

    const handleVolumeChange = (newVol) => {
        const val = Math.max(0, Math.min(1, newVol));
        setVolume(val);
        if (audioRef.current) {
            audioRef.current.volume = val;
        }
    };

    const readerTitle = book?.bookName || book?.title || 'Không Gian Đọc Sách';

    return (
        <>
            <style>{pageStyles}</style>
            <div className="halm-reader-root fixed inset-0 z-50 flex flex-col selection:bg-amber-200 overflow-hidden select-none bg-[#FAF7F2] dark:bg-[#111210]">
                
                {/* Fullscreen hover zone */}
                <div id="headerHoverZone" className="fixed top-0 inset-x-0 h-16 hidden"></div>

                {/* HALM Signature Header matching TrangChu / ChiTietSach */}
                <header id="mainHeader" className="w-full halm-reader-header px-3 sm:px-6 py-2 sticky top-0 z-50 flex items-center justify-between transition-all duration-300 h-[56px] gap-2">
                    
                    {/* Left Controls: Back, TOC, Book Title */}
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <button 
                            type="button"
                            onClick={() => {
                                document.body.style.overflow = '';
                                document.body.style.position = '';
                                document.body.style.width = '';
                                document.body.style.height = '';
                                document.documentElement.style.overflow = '';
                                document.documentElement.style.height = '';
                                if (window.history.length > 1) {
                                    navigate(-1);
                                } else {
                                    navigate('/tusachcn');
                                }
                            }} 
                            className="w-9 h-9 rounded-xl flex items-center justify-center halm-header-btn shrink-0 cursor-pointer" 
                            title="Quay lại"
                        >
                            <i className="ph-bold ph-arrow-left text-base text-[#D4AF37]"></i>
                        </button>

                        <button 
                            type="button"
                            onClick={() => {
                                document.body.style.overflow = '';
                                document.body.style.position = '';
                                document.body.style.width = '';
                                document.body.style.height = '';
                                document.documentElement.style.overflow = '';
                                document.documentElement.style.height = '';
                                navigate('/');
                            }} 
                            className="w-9 h-9 rounded-xl flex items-center justify-center halm-header-btn shrink-0 cursor-pointer" 
                            title="Về Trang Chủ"
                        >
                            <i className="ph-bold ph-house text-base text-[#D4AF37]"></i>
                        </button>

                        <button 
                            type="button"
                            onClick={() => {
                                document.body.style.overflow = '';
                                document.body.style.position = '';
                                document.body.style.width = '';
                                document.body.style.height = '';
                                document.documentElement.style.overflow = '';
                                document.documentElement.style.height = '';
                                navigate('/tusachcn');
                            }} 
                            className="w-9 h-9 rounded-xl flex items-center justify-center halm-header-btn shrink-0 cursor-pointer" 
                            title="Về Tủ Sách Cá Nhân"
                        >
                            <i className="ph-bold ph-books text-base text-[#D4AF37]"></i>
                        </button>

                        <button 
                            type="button"
                            onClick={() => { setIsTocOpen(!isTocOpen); setIsAaOpen(false); setIsAudioOpen(false); }} 
                            className="w-9 h-9 rounded-xl flex items-center justify-center halm-header-btn shrink-0 cursor-pointer relative" 
                            title="Mục lục & Ghi chú"
                        >
                            <i className="ph-bold ph-list text-base text-[#D4AF37]"></i>
                            {notes.length > 0 && (
                                <span className="absolute -top-1 -right-1 bg-[#8E3038] border border-[#D4AF37] text-[#FEFDF8] text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                                    {notes.length}
                                </span>
                            )}
                        </button>

                        <div className="hidden sm:flex items-center pl-3 ml-1 border-l border-[#2F322B] min-w-0 overflow-hidden">
                            <span className="font-serif font-bold text-[13px] md:text-[14px] text-[#F5F2EB] uppercase tracking-wider whitespace-nowrap truncate block flex items-center gap-2" title={readerTitle}>
                                <i className="ph-fill ph-book-open-text text-[#D4AF37] text-base shrink-0"></i>
                                <span className="truncate">{readerTitle}</span>
                                {isTrialMode && (
                                    <span className="shrink-0 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#D4AF37]/20 to-[#8E3038]/30 border border-[#D4AF37]/60 text-[#D4AF37] text-[10px] font-outfit font-black tracking-wider uppercase shadow-xs">
                                        Bản Đọc Thử
                                    </span>
                                )}
                            </span>
                        </div>
                    </div>

                    {/* Center Page Indicator */}
                    <div className="flex items-center justify-center px-2 shrink-0">
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#222420] border border-[#D4AF37]/35 text-[#D4AF37] text-xs sm:text-sm font-outfit font-bold shadow-xs">
                            <span>Trang {currentPage}</span>
                            {readMode === 'text' && totalSubPages > 1 && currentPageText && (
                                <span className="text-[11px] text-[#A8A6A1]">
                                    ({textSubPageIndex + 1}/{totalSubPages})
                                </span>
                            )}
                            <span className="opacity-40">/</span>
                            <span>{isTrialMode ? maxTrialPages : (numPages > 0 ? numPages : (book?.totalPages || 1))}</span>
                            {isTrialMode && (
                                <span className="text-[10px] text-amber-300 font-extrabold uppercase ml-1 px-1.5 py-0.2 rounded bg-amber-500/20">
                                    Đọc thử
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Right Tools: Mode Switch, Aa, Audio, Fullscreen */}
                    <div className="flex items-center justify-end gap-1.5 sm:gap-2.5 flex-1 relative shrink-0">
                        
                        {isTrialMode && (
                            <button
                                type="button"
                                onClick={() => setIsTrialModalOpen(true)}
                                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#8E3038] to-[#A83B46] hover:brightness-110 text-white text-xs font-outfit font-black uppercase tracking-wider shadow-sm hover:scale-105 transition-all cursor-pointer border border-[#D4AF37]/40 shrink-0"
                                title="Thuê hoặc mua để mở khóa trọn vẹn ấn phẩm"
                            >
                                <i className="ph-fill ph-crown text-amber-300 text-sm"></i>
                                <span>Mở khóa sách</span>
                            </button>
                        )}
                        
                        {/* Switch Mode: Trang In vs Chữ (Text Mode) - Chỉ hiện khi là sách PDF */}
                        {bookFormat === 'EPUB' ? (
                            <div className="flex items-center bg-[#222420] rounded-xl px-3 py-1.5 border border-[#2F322B] text-xs font-outfit font-bold text-[#D4AF37] gap-1.5 shadow-xs">
                                <i className="ph-bold ph-book-open text-emerald-400"></i>
                                <span>Sách EPUB</span>
                            </div>
                        ) : (
                            <div className="flex items-center bg-[#222420] rounded-xl p-0.5 border border-[#2F322B]">
                                <button
                                    type="button"
                                    onClick={() => { setReadMode('canvas'); showToast("Đã bật Chế độ Trang in PDF gốc"); }}
                                    className={`px-2.5 py-1.5 rounded-lg text-xs font-outfit font-bold transition cursor-pointer flex items-center gap-1.5 ${
                                        readMode === 'canvas' ? 'bg-[#8E3038] text-white shadow-xs' : 'text-[#9CA3AF] hover:text-[#EDE9DF]'
                                    }`}
                                    title="Xem trang in PDF gốc chuẩn xác"
                                >
                                    <i className="ph-bold ph-book-open"></i>
                                    <span className="hidden md:inline">Trang In</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setReadMode('text'); showToast("Đã bật Chế độ Văn bản (Đổi font & cỡ chữ tự tràn trang)"); }}
                                    className={`px-2.5 py-1.5 rounded-lg text-xs font-outfit font-bold transition cursor-pointer flex items-center gap-1.5 ${
                                        readMode === 'text' ? 'bg-[#8E3038] text-white shadow-xs' : 'text-[#9CA3AF] hover:text-[#EDE9DF]'
                                    }`}
                                    title="Đọc văn bản (Đổi font chữ, chỉnh cỡ chữ tự tràn trang không bị cuộn)"
                                >
                                    <i className="ph-bold ph-text-aa"></i>
                                    <span className="hidden md:inline">Chữ (Text)</span>
                                </button>
                            </div>
                        )}

                        {/* Quick Font Size Controls (Trong chế độ Text hoặc EPUB) */}
                        {(readMode === 'text' || readMode === 'epub') && (
                            <div className="hidden sm:flex items-center bg-[#222420] rounded-xl p-0.5 border border-[#2F322B]">
                                <button 
                                    type="button"
                                    onClick={() => adjustFontSize(-2)}
                                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#2C2E29] text-xs font-bold text-[#D4AF37] cursor-pointer"
                                    title="Giảm cỡ chữ (A-)"
                                >
                                    A-
                                </button>
                                <span className="text-[11px] font-outfit font-bold px-1.5 text-[#EDE9DF]">{fontSize}px</span>
                                <button 
                                    type="button"
                                    onClick={() => adjustFontSize(2)}
                                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#2C2E29] text-xs font-bold text-[#D4AF37] cursor-pointer"
                                    title="Tăng cỡ chữ (A+)"
                                >
                                    A+
                                </button>
                            </div>
                        )}

                        {/* Quick Zoom Controls (Trong chế độ Canvas) */}
                        {readMode === 'canvas' && (
                            <div className="hidden sm:flex items-center bg-[#222420] rounded-xl p-0.5 border border-[#2F322B]">
                                <button 
                                    type="button"
                                    onClick={() => setZoomLevel(z => Math.max(0.7, z - 0.15))}
                                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#2C2E29] text-xs font-bold text-[#D4AF37] cursor-pointer"
                                    title="Thu nhỏ (-)"
                                >
                                    -
                                </button>
                                <span className="text-[11px] font-outfit font-bold px-1.5 text-[#EDE9DF]">{Math.round(zoomLevel * 100)}%</span>
                                <button 
                                    type="button"
                                    onClick={() => setZoomLevel(z => Math.min(2.0, z + 0.15))}
                                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#2C2E29] text-xs font-bold text-[#D4AF37] cursor-pointer"
                                    title="Phóng to (+)"
                                >
                                    +
                                </button>
                            </div>
                        )}

                        {/* Audio Drawer */}
                        <button 
                            type="button"
                            onClick={() => { setIsAudioOpen(!isAudioOpen); setIsAaOpen(false); setIsTocOpen(false); }} 
                            className={`w-9 h-9 rounded-xl flex items-center justify-center halm-header-btn cursor-pointer ${
                                isPlayingMusic ? 'border-[#D4AF37] text-[#D4AF37] bg-[#8E3038]/30' : ''
                            }`} 
                            title="Âm nhạc & Không gian đọc"
                        >
                            <i className={`ph-bold ${isPlayingMusic ? 'ph-waveform text-[#D4AF37] animate-pulse' : 'ph-headphones'} text-base`}></i>
                        </button>

                        {/* Appearance Settings (Aa) */}
                        <button 
                            type="button"
                            onClick={() => { setIsAaOpen(!isAaOpen); setIsTocOpen(false); setIsAudioOpen(false); }} 
                            className="w-9 h-9 rounded-xl flex items-center justify-center halm-header-btn cursor-pointer" 
                            title="Cài đặt giao diện đọc (Font, cỡ chữ, màu giấy)"
                        >
                            <i className="ph-bold ph-faders text-base text-[#D4AF37]"></i>
                        </button>

                        {/* Fullscreen */}
                        <button 
                            type="button"
                            onClick={toggleFullScreen} 
                            className="w-9 h-9 rounded-xl flex items-center justify-center halm-header-btn cursor-pointer" 
                            title="Toàn màn hình"
                        >
                            <i className="ph-bold ph-corners-out text-base text-[#D4AF37]"></i>
                        </button>
                    </div>
                </header>

                {/* Main Content Area */}
                <main className="flex-grow w-full flex flex-col relative h-[calc(100vh-56px)] overflow-hidden">
                    
                    <section 
                        className={`flex-grow w-full flex flex-col relative transition-colors duration-400 h-full overflow-hidden ${
                            paperTheme === 'starry' ? 'theme-paper-starry' : paperTheme === 'sepia' ? 'theme-paper-sepia' : 'theme-paper-default'
                        }`}
                    >
                        {/* Starry Night Sky Canvas */}
                        {paperTheme === 'starry' && (
                            <div ref={starryBgRef} className="absolute inset-0 pointer-events-none z-0"></div>
                        )}

                        {/* Loading State */}
                        {isLoading && (
                            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#FAF7F2]/80 dark:bg-[#111210]/80 backdrop-blur-xs">
                                <div className="w-12 h-12 border-4 border-[#8E3038]/20 border-t-[#8E3038] rounded-full animate-spin mb-3"></div>
                                <h3 className="font-serif font-bold text-[#8E3038] text-base tracking-wide">Đang mở không gian đọc sách...</h3>
                                <p className="text-xs text-ink-muted mt-1 font-outfit">Hệ thống đang chuẩn bị nội dung số từ cơ sở dữ liệu</p>
                            </div>
                        )}

                        {/* Error State */}
                        {!isLoading && errorMessage && (
                            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 text-center">
                                <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center text-3xl mb-4 shadow-sm border border-rose-200">
                                    <i className="ph-bold ph-book-open"></i>
                                </div>
                                <h2 className="text-xl font-serif font-bold text-ink mb-2">Chưa thể mở nội dung sách</h2>
                                <p className="text-sm text-ink-muted max-w-md mb-6 leading-relaxed">
                                    {errorMessage}
                                </p>
                                <div className="flex items-center gap-3">
                                    <button 
                                        type="button" 
                                        onClick={() => navigate(-1)} 
                                        className="px-5 py-2.5 rounded-xl bg-paper-200 hover:bg-paper-border text-ink text-xs font-bold transition cursor-pointer"
                                    >
                                        Quay lại trang chi tiết
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={() => window.location.reload()} 
                                        className="px-5 py-2.5 rounded-xl bg-[#8E3038] hover:bg-[#6F252C] text-white text-xs font-bold transition cursor-pointer shadow-md"
                                    >
                                        Tải lại trang
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* HALM Navigation Buttons */}
                        {!isLoading && !errorMessage && (
                            <>
                                <button 
                                    type="button"
                                    disabled={readMode === 'epub' ? false : (currentPage <= 1 && textSubPageIndex <= 0)}
                                    onClick={() => changePage(-1)} 
                                    className="halm-nav-btn left" 
                                    title="Trang trước (Phím Mũi tên Trái)"
                                >
                                    <i className="ph-bold ph-caret-left text-xl"></i>
                                </button>

                                <button 
                                    type="button"
                                    disabled={readMode === 'epub' ? false : (!isTrialMode && currentPage >= numPages && (readMode !== 'text' || textSubPageIndex >= totalSubPages - 1))}
                                    onClick={() => changePage(1)} 
                                    className={`halm-nav-btn right ${isTrialMode && currentPage >= maxTrialPages ? 'border-2 border-[#D4AF37] shadow-lg animate-pulse' : ''}`}
                                    title={isTrialMode && currentPage >= maxTrialPages ? "Đã đến trang cuối bản đọc thử. Bấm để mở khóa toàn bộ" : "Trang sau (Phím Mũi tên Phải)"}
                                >
                                    <i className={`ph-bold ${isTrialMode && currentPage >= maxTrialPages ? 'ph-lock-key text-[#D4AF37]' : 'ph-caret-right'} text-xl`}></i>
                                </button>
                            </>
                        )}

                        {/* MODE 1: CANVAS PDF MODE (Mặc định - Hiển thị 100% tất cả các trang chuẩn xuất bản) */}
                        {!isLoading && !errorMessage && readMode === 'canvas' && (
                            <div className="relative overflow-auto flex-grow flex items-center justify-center w-full h-full p-4 sm:p-6 z-10">
                                <canvas 
                                    ref={canvasRef} 
                                    className={`transition-all duration-200 ${
                                        paperTheme === 'starry' ? 'canvas-filter-starry' : paperTheme === 'sepia' ? 'canvas-filter-sepia' : 'canvas-filter-default'
                                    }`}
                                />
                                {isRendering && (
                                    <div className="absolute top-4 right-4 bg-black/60 text-white text-[11px] px-3 py-1 rounded-full backdrop-blur-md flex items-center gap-1.5 shadow-md">
                                        <i className="ph-bold ph-spinner animate-spin text-[#D4AF37]"></i>
                                        <span>Đang render trang in...</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* MODE 2: REFLOW TEXT MODE (Tự tràn trang, đổi font, không bị scroll) */}
                        {!isLoading && !errorMessage && readMode === 'text' && (
                            <div 
                                ref={textViewportRef}
                                onMouseUp={handleMouseUpText}
                                style={{ maxWidth: `${contentWidth}px` }}
                                className="relative flex-grow w-full mx-auto h-full px-6 sm:px-12 py-8 overflow-hidden select-text z-10 transition-all duration-300"
                            >
                                {currentPageText ? (
                                    <div 
                                        ref={textContainerRef}
                                        style={{
                                            columnWidth: `${columnWidth > 0 ? columnWidth : 760}px`,
                                            columnGap: '60px',
                                            columnFill: 'auto',
                                            height: '100%',
                                            transform: `translateX(-${textSubPageIndex * ((columnWidth > 0 ? columnWidth : 760) + 60)}px)`,
                                            transition: 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                                            fontSize: `${fontSize}px`,
                                            lineHeight: lineHeight,
                                            textAlign: textAlign,
                                            fontFamily: fontFamily === 'garamond' ? '"Cormorant Garamond", serif' : fontFamily === 'lora' ? 'Lora, serif' : fontFamily === 'roboto' ? 'Roboto, sans-serif' : fontFamily === 'times' ? '"Times New Roman", serif' : 'Inter, sans-serif',
                                        }}
                                        className="space-y-4"
                                    >
                                        {currentPageText.split('\n\n').map((para, pIdx) => renderParagraphWithHighlights(para, pIdx))}
                                    </div>
                                ) : (
                                    /* Nếu trang không có text (ảnh scan / bìa), tự động hiển thị Canvas kèm thông báo nhỏ */
                                    <div className="h-full flex flex-col items-center justify-center text-center p-4">
                                        <div className="bg-[#222420]/80 text-[#EDE9DF] border border-[#D4AF37]/40 px-4 py-2 rounded-xl text-xs mb-4 backdrop-blur-md flex items-center gap-2 shadow-lg">
                                            <i className="ph-bold ph-info text-[#D4AF37]"></i>
                                            <span>Trang này là ấn bản scan / hình ảnh minh họa — đang hiển thị trang in gốc:</span>
                                        </div>
                                        <div className="flex-grow flex items-center justify-center w-full">
                                            <canvas 
                                                ref={canvasRef} 
                                                className={`transition-all duration-200 ${
                                                    paperTheme === 'starry' ? 'canvas-filter-starry' : paperTheme === 'sepia' ? 'canvas-filter-sepia' : 'canvas-filter-default'
                                                }`}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* MODE 3: EPUB VIEWER MODE */}
                        {!errorMessage && readMode === 'epub' && (
                            <div className="relative flex-grow w-full h-full flex flex-col items-center justify-center overflow-hidden z-10 px-2 sm:px-8 py-3">
                                <div 
                                    ref={epubViewerRef}
                                    id="halm-epub-viewer"
                                    className="w-full max-w-4xl h-full shadow-2xl rounded-2xl overflow-hidden transition-all duration-300"
                                    style={{
                                        backgroundColor: paperTheme === 'starry' ? '#111210' : paperTheme === 'sepia' ? '#F4ECD8' : '#FAF7F2',
                                        minHeight: '480px',
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column'
                                    }}
                                />
                            </div>
                        )}

                    </section>

                    {/* Floating Selection Toolbar (Hiện khi bôi đen chữ trên trang) */}
                    {floatingBtnPos && (
                        <div
                            style={{
                                position: 'fixed',
                                top: `${floatingBtnPos.top}px`,
                                left: `${floatingBtnPos.left}px`,
                                zIndex: 99999,
                            }}
                            className="flex items-center gap-1.5 p-1 rounded-full bg-[#171815] border border-[#D4AF37]/70 shadow-[0_8px_24px_rgba(0,0,0,0.7)] backdrop-blur-md animate-in fade-in zoom-in-95 duration-150"
                        >
                            {/* Nút 1: Đánh dấu & Bôi đậm trực tiếp */}
                            <button
                                type="button"
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    handleQuickHighlight(floatingBtnPos.selectedText);
                                }}
                                className="bg-[#8E3038] hover:bg-[#A83B46] text-white px-3 py-1.5 rounded-full text-xs font-outfit font-bold flex items-center gap-1.5 cursor-pointer shadow-md hover:scale-105 active:scale-95 transition-all"
                                title="Đánh dấu và bôi đậm ngay đoạn văn này"
                            >
                                <i className="ph-fill ph-highlighter text-[#FFE279]"></i>
                                <span>Bôi đậm</span>
                            </button>

                            {/* Nút 2: Ghi chú chi tiết */}
                            <button
                                type="button"
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    setSelectedQuoteText(floatingBtnPos.selectedText);
                                    setIsNoteModalOpen(true);
                                    setFloatingBtnPos(null);
                                }}
                                className="bg-[#242621] hover:bg-[#2C2E28] text-[#EDE9DF] hover:text-[#D4AF37] px-3 py-1.5 rounded-full text-xs font-outfit font-bold flex items-center gap-1.5 cursor-pointer border border-[#2F322B] hover:border-[#D4AF37]/50 shadow-md hover:scale-105 active:scale-95 transition-all"
                                title="Thêm lời bình / cảm nhận vào sổ tay"
                            >
                                <i className="ph-fill ph-chat-circle-dots text-[#D4AF37]"></i>
                                <span>Ghi chú</span>
                            </button>
                        </div>
                    )}

                    {/* Sidebar TOC & Bookmarks (Khung đen sang trọng theo style HALM) */}
                    <aside className={`sidebar-overlay sidebar-left w-[340px] bg-[#171815] border-r border-[#2F322B] p-5 flex flex-col gap-4 text-[#EDE9DF] shadow-2xl ${isTocOpen ? '' : 'sidebar-left-hidden'}`}>
                        <div className="flex justify-between items-center pb-2 border-b border-[#2F322B]">
                            <div className="flex items-center gap-4">
                                <button 
                                    type="button" 
                                    onClick={() => setActiveTocTab('toc')} 
                                    className={`font-outfit font-bold text-xs uppercase cursor-pointer transition ${
                                        activeTocTab === 'toc' ? 'text-[#D4AF37] border-b-2 border-[#D4AF37] pb-1' : 'text-[#9CA3AF] hover:text-white'
                                    }`}
                                >
                                    Mục Lục & Trang
                                </button>
                                <button 
                                    type="button" 
                                    onClick={() => setActiveTocTab('note')} 
                                    className={`font-outfit font-bold text-xs uppercase cursor-pointer transition flex items-center gap-1.5 ${
                                        activeTocTab === 'note' ? 'text-[#D4AF37] border-b-2 border-[#D4AF37] pb-1' : 'text-[#9CA3AF] hover:text-white'
                                    }`}
                                >
                                    <span>Ghi Chú</span>
                                    {notes.length > 0 && (
                                        <span className="bg-[#8E3038] text-white border border-[#D4AF37] text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                                            {notes.length}
                                        </span>
                                    )}
                                </button>
                            </div>
                            <button type="button" onClick={() => setIsTocOpen(false)} className="w-6 h-6 rounded-lg bg-[#222420] text-xs font-bold text-[#EDE9DF] flex items-center justify-center hover:bg-[#2C2E29] cursor-pointer">✕</button>
                        </div>

                        {activeTocTab === 'toc' ? (
                            <>
                                {/* Quick Jump Page */}
                                <div className="flex items-center gap-2 bg-[#1A1B18] p-2.5 rounded-xl border border-[#2F322B]">
                                    <span className="text-xs text-[#9CA3AF]">Đến trang:</span>
                                    <input 
                                        type="number" 
                                        min={1} 
                                        max={isTrialMode ? maxTrialPages : (numPages || 1)} 
                                        value={currentPage} 
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value, 10);
                                            if (isNaN(val)) return;
                                            if (isTrialMode && val > maxTrialPages) {
                                                setIsTrialModalOpen(true);
                                                showToast(`Bản đọc thử chỉ hỗ trợ tối đa ${maxTrialPages} trang đầu!`);
                                                return;
                                            }
                                            if (val >= 1 && val <= (isTrialMode ? maxTrialPages : numPages)) {
                                                if (readMode === 'epub' && epubBookRef.current?.locations && epubBookRef.current.locations.total) {
                                                    const cfi = epubBookRef.current.locations.cfiFromPercentage((val - 1) / epubBookRef.current.locations.total);
                                                    if (cfi && renditionRef.current) {
                                                        renditionRef.current.display(cfi);
                                                    }
                                                }
                                                setCurrentPage(val);
                                                setTextSubPageIndex(0);
                                            }
                                        }}
                                        className="w-16 bg-[#222420] border border-[#2F322B] rounded-lg px-2 py-1 text-xs text-[#EDE9DF] text-center focus:border-[#D4AF37] outline-hidden font-outfit font-bold"
                                    />
                                    <span className="text-xs text-[#9CA3AF]">/ {isTrialMode ? maxTrialPages : (numPages || 1)}</span>
                                </div>

                                {/* Outline or Page list */}
                                <div className="space-y-1.5 overflow-y-auto max-h-[65vh] pr-1">
                                    {pageOutline.length > 0 ? (
                                        pageOutline.map((item, idx) => (
                                            <div 
                                                key={idx}
                                                onClick={() => {
                                                    if (readMode === 'epub' && renditionRef.current && item.dest) {
                                                        renditionRef.current.display(item.dest);
                                                    } else if (typeof item.dest === 'number') {
                                                        if (isTrialMode && item.dest > maxTrialPages) {
                                                            setIsTrialModalOpen(true);
                                                            showToast(`Chương này thuộc bản đầy đủ (Trang ${item.dest}). Hãy mở khóa sách để đọc!`);
                                                            return;
                                                        }
                                                        setCurrentPage(item.dest);
                                                        setTextSubPageIndex(0);
                                                    }
                                                    setIsTocOpen(false);
                                                }}
                                                className="p-2.5 rounded-xl hover:bg-[#222420] transition cursor-pointer text-xs border border-transparent hover:border-[#2F322B]"
                                            >
                                                <div className="font-serif font-bold text-[#EDE9DF]">{item.title}</div>
                                            </div>
                                        ))
                                    ) : (
                                        Array.from({ length: Math.min(numPages || 0, 100) }).map((_, i) => {
                                            const pageNum = i + 1;
                                            const isLocked = isTrialMode && pageNum > maxTrialPages;
                                            return (
                                                <div 
                                                    key={pageNum}
                                                    onClick={() => { 
                                                        if (isLocked) {
                                                            setIsTrialModalOpen(true);
                                                            showToast(`Trang ${pageNum} thuộc bản đầy đủ. Hãy mở khóa sách để đọc!`);
                                                            return;
                                                        }
                                                        setCurrentPage(pageNum); 
                                                        setTextSubPageIndex(0);
                                                        setIsTocOpen(false); 
                                                    }}
                                                    className={`p-2.5 rounded-xl transition cursor-pointer text-xs flex justify-between items-center ${
                                                        currentPage === pageNum 
                                                            ? 'bg-[#8E3038]/25 text-[#D4AF37] font-bold border border-[#D4AF37]/40' 
                                                            : isLocked
                                                                ? 'opacity-40 hover:opacity-75 hover:bg-[#222420] text-[#9CA3AF]'
                                                                : 'hover:bg-[#222420] text-[#EDE9DF]'
                                                    }`}
                                                >
                                                    <span className="font-outfit font-semibold flex items-center gap-1.5">
                                                        {isLocked && <i className="ph-bold ph-lock-key text-xs text-amber-400"></i>}
                                                        Trang {pageNum}
                                                    </span>
                                                    {currentPage === pageNum ? (
                                                        <span className="text-[10px] bg-[#8E3038] text-white px-2 py-0.5 rounded-full font-bold">
                                                            Đang đọc
                                                        </span>
                                                    ) : isLocked ? (
                                                        <span className="text-[9px] text-amber-400 font-bold uppercase tracking-wider">
                                                            Khóa
                                                        </span>
                                                    ) : null}
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </>
                        ) : (
                            /* Tab Ghi Chú & Highlights */
                            <div className="space-y-3 overflow-y-auto max-h-[70vh] pr-1">
                                {notes.length === 0 ? (
                                    <div className="text-center py-10 px-4 text-[#9CA3AF] text-xs leading-relaxed italic">
                                        <i className="ph-bold ph-pencil-simple-line text-2xl mb-2 block opacity-40"></i>
                                        Chưa có ghi chú nào.<br />Hãy bôi đen bất kỳ đoạn văn nào trên trang sách để đánh dấu và lưu trích dẫn.
                                    </div>
                                ) : (
                                    notes.map(note => (
                                        <div 
                                            key={note.id}
                                            onClick={() => handleJumpToNote(note)}
                                            className="p-3 rounded-xl bg-[#1A1B18] hover:bg-[#222420] border border-[#2F322B] hover:border-[#D4AF37] transition cursor-pointer group"
                                        >
                                            <div className="flex justify-between items-center mb-1.5">
                                                <span className="font-outfit font-bold text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-0.5 rounded text-[10px]">
                                                    Trang {note.pageNumber} {note.subPage ? `• Phần ${note.subPage}` : ''}
                                                </span>
                                                <button 
                                                    type="button"
                                                    onClick={(e) => handleDeleteNote(note.id, e)}
                                                    className="text-gray-500 hover:text-rose-400 text-xs px-1 opacity-0 group-hover:opacity-100 transition"
                                                    title="Xóa ghi chú này"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                            <div className="text-[#EDE9DF] text-xs font-bold border-l-3 border-[#D4AF37] pl-2.5 py-1 rounded-r-md bg-[#D4AF37]/5 line-clamp-3 leading-relaxed mb-1 font-serif">
                                                "{note.selectedText}"
                                            </div>
                                            {note.personalNote && (
                                                <div className="text-[11px] text-amber-200/90 pl-2 mt-1">
                                                    💬 {note.personalNote}
                                                </div>
                                            )}
                                            <div className="text-[9px] text-[#9CA3AF] text-right mt-1 font-outfit">
                                                {note.createdAt}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </aside>

                    {/* Sidebar Aa Settings (Font, Cỡ chữ, Nền đọc theo phong cách HALM) */}
                    <aside className={`sidebar-overlay w-[340px] bg-[#171815] border-l border-[#2F322B] p-5 flex flex-col gap-5 text-[#EDE9DF] shadow-2xl overflow-y-auto ${isAaOpen ? '' : 'sidebar-right-hidden'}`}>
                        <div className="flex justify-between items-center pb-2 border-b border-[#2F322B]">
                            <span className="font-outfit font-extrabold text-sm uppercase text-[#D4AF37]">Cài đặt giao diện đọc</span>
                            <button type="button" onClick={() => setIsAaOpen(false)} className="w-6 h-6 rounded-lg bg-[#222420] text-xs font-bold text-[#EDE9DF] flex items-center justify-center hover:bg-[#2C2E29] cursor-pointer">✕</button>
                        </div>

                        {/* Paper Themes */}
                        <div>
                            <h3 className="font-outfit font-bold text-xs uppercase tracking-wider text-[#9CA3AF] mb-3">Màu nền trang sách</h3>
                            <div className="grid grid-cols-4 gap-2">
                                <button 
                                    type="button"
                                    onClick={() => setPaperTheme('default')} 
                                    className={`h-11 rounded-xl bg-[#FAF7F2] text-[#1E1F1D] border-2 font-bold text-xs flex items-center justify-center cursor-pointer transition ${
                                        paperTheme === 'default' ? 'border-[#8E3038] ring-2 ring-[#8E3038]/30 shadow-md' : 'border-transparent'
                                    }`}
                                >
                                    Sáng
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => setPaperTheme('sepia')} 
                                    className={`h-11 rounded-xl bg-[#F4ECD8] text-[#3D2E1E] border-2 font-bold text-xs flex items-center justify-center cursor-pointer transition ${
                                        paperTheme === 'sepia' ? 'border-[#8E3038] ring-2 ring-[#8E3038]/30 shadow-md' : 'border-transparent'
                                    }`}
                                >
                                    Giấy Cổ
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => setPaperTheme('night')} 
                                    className={`h-11 rounded-xl bg-[#181916] text-[#EDE9DF] border-2 font-bold text-xs flex items-center justify-center cursor-pointer transition ${
                                        paperTheme === 'night' ? 'border-[#D4AF37] ring-2 ring-[#D4AF37]/30 shadow-md' : 'border-[#2F322B]'
                                    }`}
                                >
                                    Ban Đêm
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => setPaperTheme('starry')} 
                                    className={`h-11 rounded-xl bg-[#111210] text-[#EDE9DF] border-2 font-bold text-xs flex items-center justify-center cursor-pointer transition ${
                                        paperTheme === 'starry' ? 'border-[#D4AF37] ring-2 ring-[#D4AF37]/30 shadow-md' : 'border-[#2F322B]'
                                    }`}
                                >
                                    Đêm Sao
                                </button>
                            </div>
                        </div>

                        {/* Font Size Settings (Reflow text) */}
                        <div>
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="font-outfit font-bold text-xs uppercase tracking-wider text-[#9CA3AF]">Cỡ chữ (Tự tràn trang)</h3>
                                <span className="text-[10px] text-[#D4AF37] bg-[#D4AF37]/15 px-2 py-0.5 rounded font-outfit font-bold">Không bị cuộn</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <button 
                                    type="button"
                                    onClick={() => adjustFontSize(-2)} 
                                    className="flex-1 h-9 rounded-xl bg-[#222420] hover:bg-[#2C2E29] border border-[#2F322B] text-[#D4AF37] font-bold text-sm cursor-pointer active:scale-95 transition"
                                    title="Giảm cỡ chữ (A-)"
                                >
                                    A-
                                </button>
                                <span className="text-xs font-outfit font-bold text-[#D4AF37] min-w-[55px] text-center bg-[#1A1B18] py-1.5 px-2 rounded-xl border border-[#2F322B]">
                                    {fontSize}px
                                </span>
                                <button 
                                    type="button"
                                    onClick={() => adjustFontSize(2)} 
                                    className="flex-1 h-9 rounded-xl bg-[#222420] hover:bg-[#2C2E29] border border-[#2F322B] text-[#D4AF37] font-bold text-sm cursor-pointer active:scale-95 transition"
                                    title="Tăng cỡ chữ (A+)"
                                >
                                    A+
                                </button>
                            </div>
                        </div>

                        {/* Line Height Settings */}
                        <div>
                            <h3 className="font-outfit font-bold text-xs uppercase tracking-wider text-[#9CA3AF] mb-2">Khoảng cách dòng</h3>
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { val: 1.5, label: 'Gọn gàng (1.5x)' },
                                    { val: 1.85, label: 'Chuẩn (1.85x)' },
                                    { val: 2.2, label: 'Thoáng (2.2x)' },
                                ].map(item => (
                                    <button
                                        key={item.val}
                                        type="button"
                                        onClick={() => {
                                            setLineHeight(item.val);
                                            showToast(`Giãn dòng: ${item.val}x`);
                                        }}
                                        className={`py-2 px-1 rounded-xl text-xs font-bold transition border ${
                                            lineHeight === item.val
                                                ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-[#D4AF37]'
                                                : 'bg-[#222420] border-[#2F322B] text-[#EDE9DF] hover:bg-[#2C2E29]'
                                        }`}
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Page Width Settings */}
                        <div>
                            <h3 className="font-outfit font-bold text-xs uppercase tracking-wider text-[#9CA3AF] mb-2">Độ rộng trang đọc</h3>
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { val: 680, label: 'Hẹp (680px)' },
                                    { val: 860, label: 'Vừa (860px)' },
                                    { val: 1080, label: 'Rộng (1080px)' },
                                ].map(item => (
                                    <button
                                        key={item.val}
                                        type="button"
                                        onClick={() => {
                                            setContentWidth(item.val);
                                            showToast(`Độ rộng trang: ${item.label}`);
                                        }}
                                        className={`py-2 px-1 rounded-xl text-xs font-bold transition border ${
                                            contentWidth === item.val
                                                ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-[#D4AF37]'
                                                : 'bg-[#222420] border-[#2F322B] text-[#EDE9DF] hover:bg-[#2C2E29]'
                                        }`}
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Text Align Settings */}
                        <div>
                            <h3 className="font-outfit font-bold text-xs uppercase tracking-wider text-[#9CA3AF] mb-2">Căn lề văn bản</h3>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setTextAlign('justify');
                                        showToast('Căn lề: Căn đều 2 bên');
                                    }}
                                    className={`py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border ${
                                        textAlign === 'justify'
                                            ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-[#D4AF37]'
                                            : 'bg-[#222420] border-[#2F322B] text-[#EDE9DF] hover:bg-[#2C2E29]'
                                    }`}
                                >
                                    <i className="ph-bold ph-text-align-justify"></i> Căn đều hai bên
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setTextAlign('left');
                                        showToast('Căn lề: Canh trái');
                                    }}
                                    className={`py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border ${
                                        textAlign === 'left'
                                            ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-[#D4AF37]'
                                            : 'bg-[#222420] border-[#2F322B] text-[#EDE9DF] hover:bg-[#2C2E29]'
                                    }`}
                                >
                                    <i className="ph-bold ph-text-align-left"></i> Canh trái
                                </button>
                            </div>
                        </div>

                        {/* PDF Canvas Zoom Controls */}
                        <div>
                            <h3 className="font-outfit font-bold text-xs uppercase tracking-wider text-[#9CA3AF] mb-2">Thu phóng trang in (PDF)</h3>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setZoomLevel(prev => Math.max(0.6, Number((prev - 0.15).toFixed(2))))}
                                    className="flex-1 py-2 rounded-xl bg-[#222420] hover:bg-[#2C2E29] border border-[#2F322B] text-[#D4AF37] font-bold text-xs cursor-pointer"
                                    title="Thu nhỏ trang in"
                                >
                                    Thu nhỏ (-)
                                </button>
                                <span className="text-xs font-outfit font-bold text-[#D4AF37] px-3 py-2 rounded-xl bg-[#1A1B18] border border-[#2F322B] min-w-[65px] text-center">
                                    {Math.round(zoomLevel * 100)}%
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setZoomLevel(prev => Math.min(2.5, Number((prev + 0.15).toFixed(2))))}
                                    className="flex-1 py-2 rounded-xl bg-[#222420] hover:bg-[#2C2E29] border border-[#2F322B] text-[#D4AF37] font-bold text-xs cursor-pointer"
                                    title="Phóng to trang in"
                                >
                                    Phóng to (+)
                                </button>
                            </div>
                        </div>

                        {/* Font Family Selection */}
                        <div>
                            <h3 className="font-outfit font-bold text-xs uppercase tracking-wider text-[#9CA3AF] mb-2">Kiểu phông chữ</h3>
                            <div className="space-y-1">
                                {[
                                    { key: 'garamond', label: 'Cormorant Garamond (Văn học)', class: 'font-garamond' },
                                    { key: 'lora', label: 'Lora (Bookerly cổ điển)', class: 'font-lora' },
                                    { key: 'inter', label: 'Inter (Hiện đại)', class: 'font-sans' },
                                    { key: 'roboto', label: 'Roboto (Tiêu chuẩn)', class: 'font-roboto' },
                                    { key: 'times', label: 'Times New Roman', class: 'font-serif' },
                                ].map((item) => (
                                    <div
                                        key={item.key}
                                        onClick={() => {
                                            setFontFamily(item.key);
                                            showToast(`Đã đổi font: ${item.label}`);
                                        }}
                                        className={`font-list-item ${fontFamily === item.key ? 'active' : ''} ${item.class}`}
                                    >
                                        <span>{item.label}</span>
                                        {fontFamily === item.key && <span className="text-[#D4AF37] font-bold">✓</span>}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Book Metadata */}
                        <div className="mt-auto p-3.5 rounded-xl bg-[#1A1B18] border border-[#2F322B] text-xs space-y-1.5">
                            <div className="text-[#9CA3AF]">Tác giả: <span className="text-[#EDE9DF] font-semibold">{book?.author || book?.authorName || 'HALM BOOK'}</span></div>
                            <div className="text-[#9CA3AF]">Nhà XB: <span className="text-[#EDE9DF] font-semibold">{book?.publisher || 'HALM BOOK'}</span></div>
                            <div className="text-[#9CA3AF]">Định dạng: <span className="text-[#D4AF37] font-bold">Bản quyền số {bookFormat}</span></div>
                        </div>
                    </aside>

                    {/* Sidebar Audio Music Player */}
                    <aside className={`sidebar-overlay w-80 bg-[#171815] border-l border-[#2F322B] p-4 flex flex-col gap-4 shadow-2xl text-[#EDE9DF] ${isAudioOpen ? '' : 'sidebar-right-hidden'}`}>
                        <div className="flex justify-between items-center pb-3 border-b border-[#2F322B]">
                            <div className="flex gap-4 text-xs font-outfit font-bold uppercase tracking-wider">
                                <button 
                                    type="button"
                                    onClick={() => setAudioTab('kho')} 
                                    className={`cursor-pointer transition pb-1 border-b-2 ${audioTab === 'kho' ? 'text-[#D4AF37] border-[#D4AF37]' : 'text-[#9CA3AF] border-transparent hover:text-white'}`}
                                >
                                    Kho Nhạc Nền ({DEFAULT_PLAYLIST.length})
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => setAudioTab('tai')} 
                                    className={`cursor-pointer transition pb-1 border-b-2 ${audioTab === 'tai' ? 'text-[#D4AF37] border-[#D4AF37]' : 'text-[#9CA3AF] border-transparent hover:text-white'}`}
                                >
                                    Tải Lên {customTracks.length > 0 && `(${customTracks.length})`}
                                </button>
                            </div>
                            <button type="button" onClick={() => setIsAudioOpen(false)} className="w-6 h-6 rounded-lg bg-[#222420] text-white text-xs font-bold flex items-center justify-center hover:bg-[#2C2E29] cursor-pointer">✕</button>
                        </div>

                        {/* Now Playing Widget */}
                        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-[#242621] to-[#1A1B18] border border-[#383A32] shadow-lg">
                            <div className="flex items-center gap-3 mb-3">
                                <div className={`w-11 h-11 rounded-xl bg-[#8E3038]/30 border border-[#8E3038]/60 flex items-center justify-center text-xl shrink-0 ${isPlayingMusic ? 'text-[#FFE279] shadow-[0_0_15px_rgba(255,226,121,0.3)] animate-pulse' : 'text-[#9CA3AF]'}`}>
                                    <i className={`ph-bold ${isPlayingMusic ? 'ph-waveform' : (currentTrack?.icon || 'ph-headphones')}`}></i>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37] flex items-center gap-1">
                                        {isPlayingMusic ? <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span> : <span className="w-2 h-2 rounded-full bg-stone-500"></span>}
                                        {isPlayingMusic ? 'Đang phát' : 'Đang tạm dừng'}
                                    </span>
                                    <h4 className="text-xs font-bold text-[#EDE9DF] truncate font-outfit mt-0.5">{currentTrack?.title}</h4>
                                    <p className="text-[10px] text-[#9CA3AF] truncate">{currentTrack?.subtitle}</p>
                                </div>
                            </div>

                            {/* Player Controls */}
                            <div className="flex items-center justify-center gap-4 pt-1 border-t border-[#2F322B]">
                                <button
                                    type="button"
                                    onClick={handlePrevTrack}
                                    title="Bài trước"
                                    className="w-8 h-8 rounded-full bg-[#1A1B18] hover:bg-[#2C2E29] text-[#EDE9DF] flex items-center justify-center text-sm cursor-pointer transition hover:scale-105"
                                >
                                    <i className="ph-bold ph-skip-back"></i>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => toggleMusic()}
                                    title={isPlayingMusic ? "Tạm dừng" : "Phát nhạc"}
                                    className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#8E3038] to-[#A83B46] hover:from-[#A83B46] hover:to-[#8E3038] text-white flex items-center justify-center text-base font-bold shadow-lg cursor-pointer transition hover:scale-110 active:scale-95"
                                >
                                    <i className={`ph-bold ${isPlayingMusic ? 'ph-pause' : 'ph-play ml-0.5'}`}></i>
                                </button>
                                <button
                                    type="button"
                                    onClick={handleNextTrack}
                                    title="Bài kế tiếp"
                                    className="w-8 h-8 rounded-full bg-[#1A1B18] hover:bg-[#2C2E29] text-[#EDE9DF] flex items-center justify-center text-sm cursor-pointer transition hover:scale-105"
                                >
                                    <i className="ph-bold ph-skip-forward"></i>
                                </button>
                            </div>

                            {/* Volume Slider */}
                            <div className="mt-3 pt-2.5 border-t border-[#2F322B]/70 flex items-center gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => handleVolumeChange(volume > 0 ? 0 : 0.75)}
                                    className="text-stone-400 hover:text-[#D4AF37] transition text-sm cursor-pointer"
                                    title={volume === 0 ? "Bật âm" : "Tắt tiếng"}
                                >
                                    <i className={`ph-bold ${volume === 0 ? 'ph-speaker-simple-x text-rose-400' : volume < 0.5 ? 'ph-speaker-simple-low' : 'ph-speaker-simple-high'}`}></i>
                                </button>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.05"
                                    value={volume}
                                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                                    className="w-full h-1.5 bg-[#171815] rounded-lg appearance-none cursor-pointer accent-[#D4AF37]"
                                />
                                <span className="text-[10px] font-mono text-[#9CA3AF] w-7 text-right">{Math.round(volume * 100)}%</span>
                            </div>
                        </div>

                        {/* Tab Content */}
                        {audioTab === 'kho' ? (
                            <div className="space-y-2 pt-1 flex-1 overflow-y-auto">
                                <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider block mb-1">Danh sách giai điệu</span>
                                {DEFAULT_PLAYLIST.map((track, idx) => {
                                    const isCurrent = currentTrackIndex === idx;
                                    const isThisPlaying = isCurrent && isPlayingMusic;
                                    return (
                                        <div
                                            key={track.id}
                                            onClick={() => toggleMusic(idx)}
                                            className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                                                isCurrent
                                                    ? 'bg-[#222420] border-[#D4AF37] shadow-md'
                                                    : 'bg-[#1A1B18] border-[#2F322B] hover:bg-[#222420] hover:border-stone-600'
                                            }`}
                                        >
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                                                isThisPlaying
                                                    ? 'bg-[#D4AF37] text-[#111210] shadow animate-pulse'
                                                    : isCurrent
                                                    ? 'bg-[#D4AF37]/20 text-[#D4AF37]'
                                                    : 'bg-[#252722] text-[#9CA3AF]'
                                            }`}>
                                                {isThisPlaying ? (
                                                    <i className="ph-bold ph-waveform"></i>
                                                ) : (
                                                    <span>{idx + 1}</span>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className={`font-bold text-xs truncate ${isCurrent ? 'text-[#FFE279]' : 'text-[#EDE9DF]'}`}>
                                                    {track.title}
                                                </h4>
                                                <p className="text-[#9CA3AF] text-[10px] truncate mt-0.5">{track.subtitle}</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); toggleMusic(idx); }}
                                                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs transition ${
                                                    isThisPlaying
                                                        ? 'bg-[#8E3038] text-white shadow'
                                                        : 'bg-[#252722] hover:bg-[#8E3038] text-white'
                                                }`}
                                            >
                                                <i className={`ph-bold ${isThisPlaying ? 'ph-pause' : 'ph-play ml-0.5'}`}></i>
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="space-y-3 pt-1 flex-1 overflow-y-auto">
                                <div className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-[#2F322B] hover:border-[#D4AF37]/60 rounded-2xl bg-[#1A1B18] text-center transition">
                                    <i className="ph-bold ph-upload-simple text-3xl text-[#D4AF37] mb-2"></i>
                                    <span className="text-[#EDE9DF] text-xs font-bold mb-1 font-outfit">Tải nhạc cá nhân</span>
                                    <p className="text-[10px] text-[#9CA3AF] mb-3">Hỗ trợ các tệp .mp3, .ogg, .wav</p>
                                    <label className="bg-[#8E3038] hover:bg-[#6F252C] text-white px-4 py-1.5 rounded-full font-bold text-xs hover:scale-105 cursor-pointer shadow-md transition">
                                        Chọn tệp âm thanh
                                        <input 
                                            type="file" 
                                            accept="audio/*" 
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    const blobUrl = URL.createObjectURL(file);
                                                    const customTrack = {
                                                        id: `custom_${Date.now()}`,
                                                        title: file.name.replace(/\.[^/.]+$/, ""),
                                                        subtitle: 'Tệp cá nhân đã tải lên',
                                                        src: blobUrl,
                                                        icon: 'ph-music-note',
                                                        isCustom: true
                                                    };
                                                    setCustomTracks(prev => [customTrack, ...prev]);
                                                    const newIndex = DEFAULT_PLAYLIST.length;
                                                    setCurrentTrackIndex(newIndex);
                                                    if (audioRef.current) {
                                                        audioRef.current.src = blobUrl;
                                                        audioRef.current.play().then(() => {
                                                            setIsPlayingMusic(true);
                                                            showToast(`Đang phát: ${customTrack.title}`);
                                                        });
                                                    }
                                                }
                                            }} 
                                            className="hidden" 
                                        />
                                    </label>
                                </div>

                                {customTracks.length > 0 && (
                                    <div className="space-y-2">
                                        <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider block">Các bài đã tải lên</span>
                                        {customTracks.map((track, cIdx) => {
                                            const realIdx = DEFAULT_PLAYLIST.length + cIdx;
                                            const isCurrent = currentTrackIndex === realIdx;
                                            const isThisPlaying = isCurrent && isPlayingMusic;
                                            return (
                                                <div
                                                    key={track.id}
                                                    onClick={() => toggleMusic(realIdx)}
                                                    className={`flex items-center gap-3 p-2.5 rounded-xl border transition cursor-pointer ${
                                                        isCurrent ? 'bg-[#222420] border-[#D4AF37]' : 'bg-[#1A1B18] border-[#2F322B] hover:bg-[#222420]'
                                                    }`}
                                                >
                                                    <i className={`ph-bold ${isThisPlaying ? 'ph-waveform text-[#FFE279] animate-pulse' : 'ph-music-note text-[#D4AF37]'}`}></i>
                                                    <div className="flex-1 min-w-0">
                                                        <h5 className="text-xs font-bold text-[#EDE9DF] truncate">{track.title}</h5>
                                                        <span className="text-[9px] text-[#9CA3AF]">Nhạc cá nhân</span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setCustomTracks(prev => prev.filter(t => t.id !== track.id));
                                                            if (isCurrent && audioRef.current) {
                                                                audioRef.current.pause();
                                                                setIsPlayingMusic(false);
                                                            }
                                                        }}
                                                        className="text-stone-500 hover:text-rose-400 text-xs p-1"
                                                        title="Gỡ bài này"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </aside>

                </main>

                {/* Modal Thêm Ghi Chú Cá Nhân (Style HALM) */}
                {isNoteModalOpen && (
                    <div className="fixed inset-0 z-[999999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                        <div className="bg-[#171815] border border-[#2F322B] text-[#EDE9DF] w-full max-w-md rounded-2xl p-5 shadow-2xl">
                            <div className="flex justify-between items-center mb-3 pb-2 border-b border-[#2F322B]">
                                <span className="font-outfit font-extrabold text-sm text-[#D4AF37] flex items-center gap-1.5">
                                    <i className="ph-fill ph-bookmark-simple"></i> Lưu đoạn trích & Ghi chú
                                </span>
                                <button type="button" onClick={() => setIsNoteModalOpen(false)} className="text-[#9CA3AF] hover:text-white font-bold text-sm">✕</button>
                            </div>

                            <div className="mb-3">
                                <label className="text-[11px] uppercase font-outfit font-bold text-[#9CA3AF] block mb-1">Đoạn trích (Trang {currentPage})</label>
                                <div className="p-3 bg-[#1A1B18] border-l-3 border-[#D4AF37] rounded-r-xl text-xs italic text-[#EDE9DF] max-h-28 overflow-y-auto leading-relaxed font-serif">
                                    "{selectedQuoteText}"
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="text-[11px] uppercase font-outfit font-bold text-[#9CA3AF] block mb-1">Lời bình / Ghi chú của bạn (Tùy chọn)</label>
                                <textarea
                                    value={noteDraftText}
                                    onChange={(e) => setNoteDraftText(e.target.value)}
                                    placeholder="Viết suy nghĩ hoặc cảm nhận của bạn về đoạn văn này..."
                                    rows={3}
                                    className="w-full bg-[#1A1B18] border border-[#2F322B] rounded-xl p-3 text-xs text-[#EDE9DF] placeholder-[#6E6D7A] focus:border-[#D4AF37] outline-hidden resize-none font-sans"
                                />
                            </div>

                            <div className="flex justify-end gap-2.5">
                                <button 
                                    type="button" 
                                    onClick={() => setIsNoteModalOpen(false)} 
                                    className="px-4 py-2 rounded-xl bg-[#222420] hover:bg-[#2C2E29] text-xs font-bold cursor-pointer"
                                >
                                    Hủy
                                </button>
                                <button 
                                    type="button" 
                                    onClick={handleSaveNote} 
                                    className="px-5 py-2 rounded-xl bg-[#8E3038] hover:bg-[#6F252C] text-white text-xs font-bold cursor-pointer shadow-md"
                                >
                                    Lưu vào sổ tay
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Bottom Sticky Cue: Cảnh báo đang ở trang cuối phần đọc thử */}
                {isTrialMode && currentPage >= maxTrialPages && !isTrialModalOpen && (
                    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#171815]/95 border-2 border-[#D4AF37]/80 text-[#EDE9DF] px-4 sm:px-6 py-2.5 rounded-2xl shadow-2xl flex items-center gap-3.5 backdrop-blur-md">
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping"></span>
                            <span className="text-xs font-outfit font-bold text-[#F5F2EB]">
                                Trang cuối phần đọc thử ({maxTrialPages}/{maxTrialPages})
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsTrialModalOpen(true)}
                            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#8E3038] to-[#A83B46] hover:brightness-110 text-white text-xs font-outfit font-black tracking-wide uppercase transition cursor-pointer shadow-md flex items-center gap-1.5"
                        >
                            <i className="ph-fill ph-crown text-amber-300"></i>
                            <span>Mở khóa sách ➔</span>
                        </button>
                    </div>
                )}

                {/* Modal Hết Phần Đọc Thử (Trial Paywall Modal) */}
                {isTrialModalOpen && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999999] flex items-center justify-center p-4">
                        <div className="w-full max-w-md bg-gradient-to-b from-[#1C1D19] to-[#121310] border-2 border-[#D4AF37]/60 rounded-3xl p-6 sm:p-7 text-center relative shadow-2xl space-y-5">
                            
                            {/* Nút Đóng Modal */}
                            <button 
                                type="button" 
                                onClick={() => setIsTrialModalOpen(false)} 
                                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#242621] hover:bg-[#2F322B] text-[#9CA3AF] hover:text-white flex items-center justify-center text-xs font-bold transition cursor-pointer"
                                title="Đóng thông báo"
                            >
                                ✕
                            </button>

                            {/* Tiêu đề & Icon nhận diện */}
                            <div className="flex flex-col items-center">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#8E3038]/30 to-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center mb-3 shadow-inner">
                                    <i className="ph-fill ph-book-open-text text-3xl text-[#D4AF37]"></i>
                                </div>
                                <span className="px-3 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/35 text-[#D4AF37] text-[10px] font-outfit font-black uppercase tracking-widest mb-1.5">
                                    Hết Phần Đọc Thử Miễn Phí
                                </span>
                                <h3 className="font-serif font-black text-lg sm:text-xl text-[#F5F2EB] leading-snug">
                                    Bạn Đã Xem Hết {maxTrialPages} Trang Đọc Thử!
                                </h3>
                                <p className="text-xs text-[#9CA3AF] mt-1.5 line-clamp-2 px-2">
                                    Tác phẩm <span className="text-[#D4AF37] font-semibold">"{readerTitle}"</span> còn rất nhiều tri thức và chương sách hấp dẫn đang chờ bạn khám phá.
                                </p>
                            </div>

                            {/* Khung thông tin tóm tắt cuốn sách */}
                            <div className="p-3.5 rounded-2xl bg-[#171815] border border-[#2F322B] flex items-center gap-3.5 text-left">
                                <img 
                                    src={book?.img_url || book?.img || '/logo.png'} 
                                    alt={readerTitle} 
                                    className="w-12 h-16 object-cover rounded-lg shadow-md shrink-0 border border-white/10" 
                                    onError={(e) => { e.currentTarget.src = '/logo.png'; }}
                                />
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-serif font-bold text-xs text-[#EDE9DF] truncate">{readerTitle}</h4>
                                    <p className="text-[11px] text-[#9CA3AF] truncate mt-0.5">{book?.author || 'HALM BOOK'}</p>
                                    <div className="flex items-center gap-2 mt-1.5 text-[11px]">
                                        <span className="text-[#D4AF37] font-outfit font-extrabold flex items-center gap-0.5">
                                            <i className="ph-fill ph-crown text-xs"></i> {numPages > 0 ? numPages : (book?.totalPages || '300+')} trang full
                                        </span>
                                        <span className="text-emerald-400 font-semibold">• Đọc không giới hạn</span>
                                    </div>
                                </div>
                            </div>

                            {/* Danh sách đặc quyền khi thuê / mua sách */}
                            <div className="space-y-1.5 text-left px-2 text-[11px] text-[#A8A6A1]">
                                <div className="flex items-center gap-2">
                                    <i className="ph-bold ph-check-circle text-emerald-400 text-sm shrink-0"></i>
                                    <span>Mở khóa toàn bộ ấn phẩm bản quyền không giới hạn số trang.</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <i className="ph-bold ph-check-circle text-emerald-400 text-sm shrink-0"></i>
                                    <span>Tùy chỉnh cỡ chữ, font chữ, đổi nền giấy ngà/đêm dịu mắt.</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <i className="ph-bold ph-check-circle text-emerald-400 text-sm shrink-0"></i>
                                    <span>Đánh dấu trang, lưu trích dẫn và đồng bộ vào Tủ sách cá nhân.</span>
                                </div>
                            </div>

                            {/* Các nút hành động CTA */}
                            <div className="space-y-2 pt-1">
                                {!isTokenValid() ? (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                openAuthModal({ 
                                                    mode: 'login', 
                                                    message: 'Vui lòng đăng nhập tài khoản để thuê hoặc mở khóa trọn vẹn tác phẩm!' 
                                                });
                                            }}
                                            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:brightness-110 text-white font-outfit font-black text-xs uppercase tracking-wider shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer group"
                                        >
                                            <i className="ph-bold ph-sign-in text-base text-amber-100 group-hover:scale-110 transition-transform"></i>
                                            <span>Đăng Nhập Để Thuê & Đọc Tiếp</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                const targetId = bookId || book?.book_id || book?.id;
                                                if (targetId) {
                                                    navigate('/chitietsach/' + encodeURIComponent(targetId) + '?openRental=true');
                                                } else {
                                                    navigate('/chitietsach');
                                                }
                                            }}
                                            className="w-full py-2.5 px-4 rounded-xl bg-[#222420] hover:bg-[#2C2E29] text-[#EDE9DF] font-outfit font-bold text-xs border border-[#D4AF37]/40 hover:border-[#D4AF37] transition-all flex items-center justify-center gap-2 cursor-pointer"
                                        >
                                            <i className="ph-fill ph-shopping-bag-open text-sm text-[#D4AF37]"></i>
                                            <span>Xem Bảng Giá Gói Thuê (Chỉ từ 2 Khoai)</span>
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const targetId = bookId || book?.book_id || book?.id;
                                            if (targetId) {
                                                navigate('/chitietsach/' + encodeURIComponent(targetId) + '?openRental=true');
                                            } else {
                                                navigate('/chitietsach');
                                            }
                                        }}
                                        className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#8E3038] via-[#A83B46] to-[#8E3038] hover:brightness-110 text-white font-outfit font-black text-xs uppercase tracking-wider shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer group"
                                    >
                                        <i className="ph-fill ph-shopping-bag-open text-base text-amber-300 group-hover:scale-110 transition-transform"></i>
                                        <span>Thuê Hoặc Mua Sách Ngay (Chỉ từ 2 Khoai)</span>
                                    </button>
                                )}

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setCurrentPage(1);
                                            setTextSubPageIndex(0);
                                            setIsTrialModalOpen(false);
                                            showToast("Đã quay về Trang 1 của bản đọc thử.");
                                        }}
                                        className="flex-1 py-2.5 px-3 rounded-xl bg-[#222420] hover:bg-[#2C2E29] text-[#EDE9DF] text-xs font-outfit font-bold border border-[#2F322B] transition cursor-pointer"
                                    >
                                        <i className="ph-bold ph-arrow-counter-clockwise mr-1 text-[#D4AF37]"></i> Đọc lại từ đầu
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            const targetId = bookId || book?.book_id || book?.id;
                                            if (targetId) {
                                                navigate('/chitietsach/' + encodeURIComponent(targetId));
                                            } else {
                                                navigate('/chitietsach');
                                            }
                                        }}
                                        className="flex-1 py-2.5 px-3 rounded-xl bg-transparent hover:bg-white/5 text-[#9CA3AF] hover:text-[#EDE9DF] text-xs font-outfit font-bold border border-[#2F322B] transition cursor-pointer"
                                    >
                                        Về trang chi tiết
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Toast Notification */}
                <div className={`fixed bottom-6 right-6 bg-[#1A1B18]/95 text-[#EDE9DF] border border-[#D4AF37]/50 px-4 py-2.5 rounded-xl shadow-2xl transition-all duration-300 z-[10000] text-xs font-outfit font-bold flex items-center gap-2 ${
                    toastMessage ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'
                }`}>
                    <span className="w-2 h-2 rounded-full bg-[#D4AF37] shrink-0"></span>
                    <span>{toastMessage}</span>
                </div>

                {/* Audio element for relaxation sounds */}
                <audio ref={audioRef} loop src={currentTrack?.src || '/audio/rain.mp3'} />

                {/* Popup Auth Modal cho khách vãng lai khi cần đăng nhập ngay tại màn hình đọc sách */}
                <AuthModal 
                    onSuccess={async () => {
                        const targetId = bookId || book?.book_id || book?.id;
                        if (targetId) {
                            try {
                                const accessDetail = await getBookAccessDetail(targetId);
                                if (accessDetail?.hasAccess) {
                                    setIsTrialMode(false);
                                    setIsTrialModalOpen(false);
                                    showToast("Chúc mừng! Bạn đã sở hữu tác phẩm và được mở khóa toàn bộ trang.");
                                } else {
                                    showToast("Đăng nhập thành công! Hãy chọn gói thuê để tiếp tục.");
                                }
                            } catch (_) {
                                showToast("Đăng nhập thành công!");
                            }
                        }
                    }} 
                />

            </div>
        </>
    );
}
