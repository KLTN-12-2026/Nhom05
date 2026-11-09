/**
 * personalBookService.js
 * Quản lý lưu trữ & đọc file sách cá nhân (PDF, EPUB) bằng IndexedDB.
 * - IndexedDB cho phép lưu trữ file dung lượng lớn (hàng trăm MB) an toàn, nhanh chóng và không giới hạn 5MB như LocalStorage.
 * - Tự động đồng bộ chỉ mục metadata nhẹ sang localStorage để hỗ trợ render nhanh.
 */

const DB_NAME = 'HALM_PERSONAL_BOOKS_DB';
const DB_VERSION = 2; // Tăng version 2 để đảm bảo onupgradeneeded luôn khởi tạo object store chính xác
const STORE_NAME = 'personal_books';
const METADATA_STORAGE_KEY = 'halm_personal_books_metadata';

function openDB() {
    return new Promise((resolve, reject) => {
        if (typeof window === 'undefined' || !window.indexedDB) {
            reject(new Error('Trình duyệt không hỗ trợ IndexedDB'));
            return;
        }

        const request = window.indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                store.createIndex('createdAt', 'createdAt', { unique: false });
                store.createIndex('format', 'format', { unique: false });
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error || new Error('Không thể mở cơ sở dữ liệu IndexedDB'));
        request.onblocked = () => {
            console.warn('IndexedDB đang bị giữ bởi phiên bản trước.');
        };
    });
}

export function formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Tạo ảnh bìa phong cách HALM BOOK sang trọng (Canvas SVG data URL)
 */
export function generateCoverDataUrl(title, author, theme = 'gold') {
    const cleanTitle = (title || 'Sách Cá Nhân').trim();
    const cleanAuthor = (author || 'Độc Giả HALM').trim();

    const themes = {
        gold: { bg1: '#1F1B12', bg2: '#0D0E0C', accent: '#D4AF37', border: '#B8860B' },
        wine: { bg1: '#2A1014', bg2: '#120709', accent: '#E57373', border: '#8E3038' },
        emerald: { bg1: '#0E2419', bg2: '#06130C', accent: '#34D399', border: '#059669' },
        sapphire: { bg1: '#111D2E', bg2: '#080E18', accent: '#60A5FA', border: '#2563EB' }
    };
    const t = themes[theme] || themes.gold;

    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600" width="400" height="600">
        <defs>
            <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="${t.bg1}"/>
                <stop offset="100%" stop-color="${t.bg2}"/>
            </linearGradient>
            <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="${t.accent}"/>
                <stop offset="100%" stop-color="${t.border}"/>
            </linearGradient>
            <filter id="shadow">
                <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000" flood-opacity="0.5"/>
            </filter>
        </defs>
        <rect width="400" height="600" rx="8" fill="url(#bgGrad)"/>
        <!-- Luxury Frame Border -->
        <rect x="20" y="20" width="360" height="560" rx="6" fill="none" stroke="${t.border}" stroke-width="2" opacity="0.6"/>
        <rect x="28" y="28" width="344" height="544" rx="4" fill="none" stroke="${t.accent}" stroke-width="1" opacity="0.4" stroke-dasharray="6,4"/>
        
        <!-- Header Branding -->
        <text x="200" y="80" text-anchor="middle" font-family="'Nunito', sans-serif" font-weight="900" font-size="14" fill="${t.accent}" letter-spacing="4">HALM BOOK • BẢN CÁ NHÂN</text>
        <line x1="120" y1="95" x2="280" y2="95" stroke="${t.border}" stroke-width="1.5" opacity="0.7"/>

        <!-- Center Emblem -->
        <circle cx="200" cy="220" r="50" fill="none" stroke="${t.accent}" stroke-width="2" opacity="0.8"/>
        <circle cx="200" cy="220" r="42" fill="none" stroke="${t.border}" stroke-width="1" stroke-dasharray="4,4" opacity="0.5"/>
        <text x="200" y="235" text-anchor="middle" font-family="'Segoe UI Emoji', sans-serif" font-size="38">📖</text>

        <!-- Book Title -->
        <foreignObject x="45" y="300" width="310" height="150">
            <div xmlns="http://www.w3.org/1999/xhtml" style="display:flex; flex-direction:column; justify-content:center; align-items:center; height:100%; text-align:center; padding: 0 10px;">
                <h1 style="color:#EDE9DF; font-family:'Fredoka','Nunito',sans-serif; font-size:22px; font-weight:800; line-height:1.3; margin:0; text-transform:uppercase; letter-spacing:0.5px; text-shadow:0 2px 4px rgba(0,0,0,0.8); display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden;">
                    ${cleanTitle}
                </h1>
            </div>
        </foreignObject>

        <!-- Author / Metadata -->
        <line x1="150" y1="480" x2="250" y2="480" stroke="${t.accent}" stroke-width="1" opacity="0.6"/>
        <text x="200" y="515" text-anchor="middle" font-family="'Quicksand', sans-serif" font-weight="700" font-size="15" fill="#D1D5DB">${cleanAuthor}</text>
        <text x="200" y="540" text-anchor="middle" font-family="'Inter', sans-serif" font-size="11" fill="${t.accent}" opacity="0.8">ĐỘC QUYỀN ĐỘC GIẢ</text>
    </svg>
    `.trim();

    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/**
 * Lấy danh sách metadata nhẹ của tất cả sách cá nhân
 */
export function getPersonalBooksMetadata() {
    try {
        const raw = localStorage.getItem(METADATA_STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function savePersonalBooksMetadata(list) {
    try {
        localStorage.setItem(METADATA_STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
        console.warn('Không thể lưu metadata sách cá nhân vào localStorage:', e);
    }
}

/**
 * Lưu file sách mới vào IndexedDB
 */
export async function savePersonalBook({
    title,
    author,
    category = 'Tài liệu cá nhân',
    file,
    coverUrl = null,
    coverTheme = 'gold',
    description = ''
}) {
    if (!file) throw new Error('Vui lòng chọn tệp sách (PDF hoặc EPUB)');

    const fileName = file.name || 'document.pdf';
    const lowerName = fileName.toLowerCase();
    const isEpub = lowerName.endsWith('.epub') || (file.type && file.type.includes('epub'));
    const format = isEpub ? 'EPUB' : 'PDF';

    const cleanTitle = (title && title.trim()) ? title.trim() : fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    const cleanAuthor = (author && author.trim()) ? author.trim() : 'Cá nhân';
    const bookId = `personal_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const finalCover = coverUrl || generateCoverDataUrl(cleanTitle, cleanAuthor, coverTheme);

    // Đọc ArrayBuffer an toàn từ File
    let arrayBuffer = null;
    try {
        arrayBuffer = await file.arrayBuffer();
    } catch (readErr) {
        console.warn('file.arrayBuffer() thất bại, thử FileReader:', readErr);
        arrayBuffer = await new Promise((res, rej) => {
            const fr = new FileReader();
            fr.onload = () => res(fr.result);
            fr.onerror = () => rej(fr.error);
            fr.readAsArrayBuffer(file);
        });
    }

    const safeBlob = new Blob([arrayBuffer], { type: isEpub ? 'application/epub+zip' : 'application/pdf' });

    const record = {
        id: bookId,
        bookId: bookId,
        book_id: bookId,
        title: cleanTitle,
        bookTitle: cleanTitle,
        bookName: cleanTitle,
        author: cleanAuthor,
        authorName: cleanAuthor,
        category: category || 'Tài liệu cá nhân',
        format,
        fileFormat: format,
        fileName,
        fileSize: formatFileSize(file.size),
        fileBytes: file.size,
        fileBlob: safeBlob,
        fileArrayBuffer: arrayBuffer,
        coverUrl: finalCover,
        coverImage: finalCover,
        imgUrl: finalCover,
        description: description || '',
        createdAt: new Date().toISOString(),
        isPersonal: true,
        isForever: true,
        remainingDays: 999999,
        status: 'ACTIVE'
    };

    // 1. Ghi vào IndexedDB với đầy đủ bắt lỗi giao dịch
    const db = await openDB();
    await new Promise((resolve, reject) => {
        try {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const req = store.put(record);

            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error || new Error('Lỗi khi ghi vào object store'));
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error || new Error('Lỗi transaction IndexedDB'));
            tx.onabort = () => reject(tx.error || new Error('Transaction IndexedDB bị hủy'));
        } catch (txErr) {
            reject(txErr);
        }
    });

    // 2. Cập nhật cache metadata vào localStorage (bỏ trường dữ liệu nặng)
    const { fileBlob, fileArrayBuffer, ...lightMetadata } = record;
    const currentList = getPersonalBooksMetadata();
    const updatedList = [lightMetadata, ...currentList.filter(b => b.id !== bookId)];
    savePersonalBooksMetadata(updatedList);

    // 3. Bắn event thông báo cập nhật thời gian thực
    window.dispatchEvent(new CustomEvent('halm-personal-book-added', { detail: { book: lightMetadata } }));
    window.dispatchEvent(new CustomEvent('halm-bookshelf-updated', { detail: { book: lightMetadata } }));

    // Ghi nhận nhiệm vụ ngày
    const todayKey = new Date().toISOString().slice(0, 10);
    try {
        localStorage.setItem(`halm_daily_action_upload_${todayKey}`, 'true');
    } catch {}
    window.dispatchEvent(new CustomEvent('halm-daily-task-completed', { detail: { task: 'upload' } }));

    return record;
}

/**
 * Lấy chi tiết sách cá nhân bao gồm fileBlob và fileArrayBuffer từ IndexedDB
 */
export async function getPersonalBookById(id) {
    if (!id) return null;
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            try {
                const tx = db.transaction(STORE_NAME, 'readonly');
                const store = tx.objectStore(STORE_NAME);
                const req = store.get(id);
                req.onsuccess = () => resolve(req.result || null);
                req.onerror = () => reject(req.error);
                tx.onerror = () => reject(tx.error);
            } catch (err) {
                reject(err);
            }
        });
    } catch (e) {
        console.warn('Lỗi khi đọc sách cá nhân từ IndexedDB:', e);
        // Fallback metadata nếu không lấy được blob
        const list = getPersonalBooksMetadata();
        return list.find(b => b.id === id) || null;
    }
}

/**
 * Xóa sách cá nhân khỏi IndexedDB & localStorage
 */
export async function deletePersonalBook(id) {
    if (!id) return false;
    try {
        const db = await openDB();
        await new Promise((resolve, reject) => {
            try {
                const tx = db.transaction(STORE_NAME, 'readwrite');
                const store = tx.objectStore(STORE_NAME);
                const req = store.delete(id);
                req.onsuccess = () => resolve();
                req.onerror = () => reject(req.error);
                tx.oncomplete = () => resolve();
                tx.onerror = () => reject(tx.error);
            } catch (err) {
                reject(err);
            }
        });

        const list = getPersonalBooksMetadata();
        const updated = list.filter(b => b.id !== id);
        savePersonalBooksMetadata(updated);

        window.dispatchEvent(new CustomEvent('halm-bookshelf-updated'));
        return true;
    } catch (e) {
        console.error('Không thể xóa sách cá nhân:', e);
        return false;
    }
}
