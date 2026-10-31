import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import axiosInstance from '@/services/axiosClient';

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
    html, body {
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

export default function DocSach() {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const bookId = id || searchParams.get('id');

    // 1. Book & PDF state
    const [book, setBook] = useState(() => {
        try {
            const raw = sessionStorage.getItem('halm-reader-book');
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    });
    const [pdfUrl, setPdfUrl] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");
    const [bookFormat, setBookFormat] = useState('PDF'); // 'PDF' | 'EPUB'

    // 2. Reading Engine State (Default to 'canvas' so the book ALWAYS opens immediately without blank screen)
    const [pdfDoc, setPdfDoc] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [numPages, setNumPages] = useState(0);
    const [zoomLevel, setZoomLevel] = useState(1.0);
    const [isRendering, setIsRendering] = useState(false);

    // Modes: 'canvas' (Trang in PDF gốc) | 'text' (Chế độ đọc chữ reflow) | 'epub' (Trình đọc sách số EPUB) | 'embed' (Iframe)
    const [readMode, setReadMode] = useState('canvas');
    const [paperTheme, setPaperTheme] = useState('default'); // 'default' | 'sepia' | 'starry'
    const [fontFamily, setFontFamily] = useState('garamond');
    const [fontSize, setFontSize] = useState(20);
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
    const [audioTab, setAudioTab] = useState('kho');
    const [toastMessage, setToastMessage] = useState("");

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
            } else if (theme === 'sepia') {
                bg = '#F4ECD8';
                fg = '#5B4636';
            }

            rendition.themes.override("color", fg, true);
            rendition.themes.override("background", bg, true);
            rendition.themes.override("font-family", selectedFont, true);
            rendition.themes.override("font-size", `${size}px`, true);
            rendition.themes.override("line-height", "1.8", true);

            rendition.themes.default({
                body: {
                    color: `${fg} !important`,
                    background: `${bg} !important`,
                    'font-family': `${selectedFont} !important`,
                    'font-size': `${size}px !important`,
                    'line-height': '1.8 !important',
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
    }, []);

    useEffect(() => {
        if (renditionRef.current) {
            applyEpubStyling(renditionRef.current, paperTheme, fontFamily, fontSize);
        }
    }, [paperTheme, fontFamily, fontSize, applyEpubStyling]);

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
            links.forEach((link) => link.remove());
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

    // 1. Unified Buffer-First Reader Engine (Hỗ trợ PDF & EPUB với phân tích Magic Bytes thực tế)
    useEffect(() => {
        let isCancelled = false;

        const loadAndRenderBook = async () => {
            setIsLoading(true);
            setErrorMessage("");

            let currentBook = book;
            const targetId = bookId || currentBook?.book_id || currentBook?.id;

            if (targetId && (!currentBook || currentBook.book_id !== targetId)) {
                try {
                    const res = await axiosInstance.get(`/api/home/books/${encodeURIComponent(targetId)}`);
                    if (res.data && !isCancelled) {
                        currentBook = res.data;
                        setBook(res.data);
                        sessionStorage.setItem('halm-reader-book', JSON.stringify(res.data));
                    }
                } catch (err) {
                    console.warn("Không thể tải chi tiết sách từ API:", err);
                }
            }

            // Lấy URL đọc sách từ backend
            let resolvedUrl = "";
            let metaFormat = (currentBook?.fileFormat || '').toUpperCase();
            if (targetId) {
                try {
                    const readUrlRes = await axiosInstance.get(`/api/home/books/${encodeURIComponent(targetId)}/read-url`);
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
            let arrayBuffer = null;
            if (targetId) {
                try {
                    const contentRes = await axiosInstance.get(`/api/home/books/${encodeURIComponent(targetId)}/content`, {
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
                    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js');
                }
                if (window.pdfjsLib && !window.pdfjsLib.GlobalWorkerOptions.workerSrc) {
                    window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
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
                setCurrentPage(1);
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
            const next = currentPage + delta;
            if (next >= 1 && next <= numPages) {
                setCurrentPage(next);
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

    const handleSaveNote = () => {
        if (!selectedQuoteText) return;
        const newNote = {
            id: `note_${Date.now()}`,
            bookId: bookId || 'default',
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
        showToast("Đã lưu trích dẫn vào sổ tay ghi chú!");
    };

    const handleDeleteNote = (noteId, e) => {
        e.stopPropagation();
        setNotes(prev => prev.filter(n => n.id !== noteId));
        showToast("Đã xóa ghi chú.");
    };

    const handleJumpToNote = (note) => {
        setCurrentPage(note.pageNumber);
        if (note.subPage) setTextSubPageIndex(note.subPage - 1);
        setIsTocOpen(false);
        showToast(`Đã lật đến Trang ${note.pageNumber}`);
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

    // Audio Player
    const toggleMusic = () => {
        if (!audioRef.current) return;
        if (isPlayingMusic) {
            audioRef.current.pause();
            setIsPlayingMusic(false);
            showToast("Đã tạm dừng âm thanh.");
        } else {
            audioRef.current.play().then(() => {
                setIsPlayingMusic(true);
                showToast("Đang phát nhạc nền thư giãn.");
            }).catch(() => {
                showToast("Trình duyệt chặn tự động phát âm thanh.");
            });
        }
    };

    const readerTitle = book?.bookName || book?.title || 'Không Gian Đọc Sách';

    return (
        <>
            <style>{pageStyles}</style>
            <div className="h-screen w-screen flex flex-col selection:bg-amber-200 overflow-hidden select-none">
                
                {/* Fullscreen hover zone */}
                <div id="headerHoverZone" className="fixed top-0 inset-x-0 h-16 hidden"></div>

                {/* HALM Signature Header matching TrangChu / ChiTietSach */}
                <header id="mainHeader" className="w-full halm-reader-header px-3 sm:px-6 py-2 sticky top-0 z-50 flex items-center justify-between transition-all duration-300 h-[56px] gap-2">
                    
                    {/* Left Controls: Back, TOC, Book Title */}
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <button 
                            type="button"
                            onClick={() => navigate(-1)} 
                            className="w-9 h-9 rounded-xl flex items-center justify-center halm-header-btn shrink-0 cursor-pointer" 
                            title="Quay lại chi tiết sách"
                        >
                            <i className="ph-bold ph-arrow-left text-base text-[#D4AF37]"></i>
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
                            <span>{numPages > 0 ? numPages : (book?.totalPages || 1)}</span>
                        </div>
                    </div>

                    {/* Right Tools: Mode Switch, Aa, Audio, Fullscreen */}
                    <div className="flex items-center justify-end gap-1.5 sm:gap-2.5 flex-1 relative shrink-0">
                        
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
                                    disabled={readMode === 'epub' ? false : (currentPage >= numPages && (readMode !== 'text' || textSubPageIndex >= totalSubPages - 1))}
                                    onClick={() => changePage(1)} 
                                    className="halm-nav-btn right" 
                                    title="Trang sau (Phím Mũi tên Phải)"
                                >
                                    <i className="ph-bold ph-caret-right text-xl"></i>
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
                                className="relative flex-grow w-full max-w-4xl mx-auto h-full px-8 sm:px-14 py-8 overflow-hidden select-text z-10"
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
                                            lineHeight: 1.85,
                                        }}
                                        className={`font-${fontFamily} text-justify space-y-4`}
                                    >
                                        {currentPageText.split('\n\n').map((para, pIdx) => (
                                            <p key={pIdx} className="mb-4 leading-relaxed indent-6">
                                                {para}
                                            </p>
                                        ))}
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

                    {/* Floating Note Save Button (Hiện khi bôi đen chữ) */}
                    {floatingBtnPos && (
                        <button
                            type="button"
                            style={{
                                position: 'fixed',
                                top: `${floatingBtnPos.top}px`,
                                left: `${floatingBtnPos.left}px`,
                                zIndex: 99999,
                            }}
                            onMouseDown={(e) => {
                                e.preventDefault();
                                setSelectedQuoteText(floatingBtnPos.selectedText);
                                setIsNoteModalOpen(true);
                                setFloatingBtnPos(null);
                            }}
                            className="bg-[#8E3038] hover:bg-[#6F252C] text-white border border-[#D4AF37]/50 px-4 py-2 rounded-full shadow-2xl text-xs font-outfit font-extrabold flex items-center gap-1.5 cursor-pointer transform hover:scale-105 transition-all shadow-[0_6px_20px_rgba(142,48,56,0.5)]"
                        >
                            <i className="ph-fill ph-bookmark-simple text-[#D4AF37]"></i>
                            <span>Lưu trích dẫn</span>
                        </button>
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
                                        max={numPages || 1} 
                                        value={currentPage} 
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value, 10);
                                            if (val >= 1 && val <= numPages) {
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
                                    <span className="text-xs text-[#9CA3AF]">/ {numPages || 1}</span>
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
                                        Array.from({ length: Math.min(numPages || 0, 100) }).map((_, i) => (
                                            <div 
                                                key={i + 1}
                                                onClick={() => { 
                                                    setCurrentPage(i + 1); 
                                                    setTextSubPageIndex(0);
                                                    setIsTocOpen(false); 
                                                }}
                                                className={`p-2.5 rounded-xl transition cursor-pointer text-xs flex justify-between items-center ${
                                                    currentPage === i + 1 
                                                        ? 'bg-[#8E3038]/25 text-[#D4AF37] font-bold border border-[#D4AF37]/40' 
                                                        : 'hover:bg-[#222420] text-[#EDE9DF]'
                                                }`}
                                            >
                                                <span className="font-outfit font-semibold">Trang {i + 1}</span>
                                                {currentPage === i + 1 && (
                                                    <span className="text-[10px] bg-[#8E3038] text-white px-2 py-0.5 rounded-full font-bold">
                                                        Đang đọc
                                                    </span>
                                                )}
                                            </div>
                                        ))
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
                                            <div className="text-[#EDE9DF] text-xs italic border-l-2 border-[#D4AF37] pl-2 line-clamp-3 leading-relaxed mb-1 font-serif">
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
                            <div className="grid grid-cols-3 gap-2.5">
                                <button 
                                    type="button"
                                    onClick={() => setPaperTheme('default')} 
                                    className={`h-12 rounded-xl bg-[#FAF7F2] text-[#1E1F1D] border-2 font-bold text-xs flex items-center justify-center cursor-pointer transition ${
                                        paperTheme === 'default' ? 'border-[#8E3038] ring-2 ring-[#8E3038]/30 shadow-md' : 'border-transparent'
                                    }`}
                                >
                                    Sáng
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => setPaperTheme('sepia')} 
                                    className={`h-12 rounded-xl bg-[#F4ECD8] text-[#3D2E1E] border-2 font-bold text-xs flex items-center justify-center cursor-pointer transition ${
                                        paperTheme === 'sepia' ? 'border-[#8E3038] ring-2 ring-[#8E3038]/30 shadow-md' : 'border-transparent'
                                    }`}
                                >
                                    Giấy Cổ
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => setPaperTheme('starry')} 
                                    className={`h-12 rounded-xl bg-[#111210] text-[#EDE9DF] border-2 font-bold text-xs flex items-center justify-center cursor-pointer transition ${
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
                            <p className="text-[11px] text-[#9CA3AF] mt-2 leading-relaxed italic">
                                Khi tăng cỡ chữ ở Chế độ Chữ, chữ sẽ tự động được đẩy tràn qua trang sau mà không cần cuộn màn hình.
                            </p>
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
                            <div className="text-[#9CA3AF]">Tác giả: <span className="text-[#EDE9DF] font-semibold">{book?.author || 'Toan Ánh'}</span></div>
                            <div className="text-[#9CA3AF]">Nhà XB: <span className="text-[#EDE9DF] font-semibold">{book?.publisher || 'HALM BOOK'}</span></div>
                            <div className="text-[#9CA3AF]">Định dạng: <span className="text-[#D4AF37] font-bold">Bản quyền số {bookFormat}</span></div>
                        </div>
                    </aside>

                    {/* Sidebar Audio Music Player */}
                    <aside className={`sidebar-overlay w-80 bg-[#171815] border-l border-[#2F322B] p-4 flex flex-col gap-4 shadow-2xl text-[#EDE9DF] ${isAudioOpen ? '' : 'sidebar-right-hidden'}`}>
                        <div className="flex justify-between items-center pb-3 border-b border-[#2F322B]">
                            <div className="flex gap-5 text-sm font-outfit font-semibold">
                                <button 
                                    type="button"
                                    onClick={() => setAudioTab('kho')} 
                                    className={`cursor-pointer transition ${audioTab === 'kho' ? 'text-[#D4AF37]' : 'text-[#9CA3AF]'}`}
                                >
                                    Kho nhạc
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => setAudioTab('tai')} 
                                    className={`cursor-pointer transition ${audioTab === 'tai' ? 'text-[#D4AF37]' : 'text-[#9CA3AF]'}`}
                                >
                                    Đã tải lên
                                </button>
                            </div>
                            <button type="button" onClick={() => setIsAudioOpen(false)} className="w-5 h-5 rounded-full bg-[#222420] text-white text-[10px] font-bold flex items-center justify-center hover:bg-[#2C2E29] cursor-pointer">✕</button>
                        </div>

                        {audioTab === 'kho' ? (
                            <div className="space-y-4 pt-2">
                                <div 
                                    onClick={toggleMusic} 
                                    className="flex items-center gap-3 p-3 rounded-xl bg-[#1A1B18] hover:bg-[#222420] transition cursor-pointer border border-[#2F322B]"
                                >
                                    <span className="w-6 text-center text-sm font-bold text-[#D4AF37]">1</span>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-[#EDE9DF] font-serif font-bold text-xs truncate">Tiếng mưa & Không gian đọc</h4>
                                        <p className="text-[#9CA3AF] text-[11px] mt-0.5">🌧 Google Ambience Loop</p>
                                    </div>
                                    <button type="button" className="w-8 h-8 rounded-full bg-[#8E3038] text-white flex items-center justify-center text-xs font-bold shadow hover:scale-105">
                                        {isPlayingMusic ? '⏸' : '▶'}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-[#2F322B] rounded-xl bg-[#1A1B18] text-center">
                                <i className="ph-bold ph-upload-simple text-3xl text-[#9CA3AF] mb-2"></i>
                                <span className="text-[#EDE9DF] text-xs font-bold mb-3 font-outfit">Tải nhạc (.mp3 / .ogg) cá nhân</span>
                                <label className="bg-[#8E3038] hover:bg-[#6F252C] text-white px-4 py-1.5 rounded-full font-bold text-xs hover:scale-105 cursor-pointer shadow-md">
                                    Chọn tệp
                                    <input 
                                        type="file" 
                                        accept="audio/*" 
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file && audioRef.current) {
                                                audioRef.current.src = URL.createObjectURL(file);
                                                audioRef.current.play().then(() => {
                                                    setIsPlayingMusic(true);
                                                    showToast(`Đang phát: ${file.name}`);
                                                });
                                            }
                                        }} 
                                        className="hidden" 
                                    />
                                </label>
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

                {/* Toast Notification */}
                <div className={`fixed bottom-6 right-6 bg-[#1A1B18]/95 text-[#EDE9DF] border border-[#D4AF37]/50 px-4 py-2.5 rounded-xl shadow-2xl transition-all duration-300 z-[10000] text-xs font-outfit font-bold flex items-center gap-2 ${
                    toastMessage ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'
                }`}>
                    <span className="w-2 h-2 rounded-full bg-[#D4AF37] shrink-0"></span>
                    <span>{toastMessage}</span>
                </div>

                {/* Audio element for relaxation sounds */}
                <audio ref={audioRef} loop src="https://actions.google.com/sounds/v1/ambiences/rain_heavy.ogg" />

            </div>
        </>
    );
}
