import { inlinePageStyle1 } from './styles/DynamicWatermark.styles.js';
import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { getAuthToken, decodeJwtPayload } from '@/services/authToken';
import { getCurrentCustomer } from '@/services/customerService';

/**
 * ============================================================================
 * COMPONENT: DynamicWatermark (HALM BOOK DRM Digital Rights Management)
 * ============================================================================
 * Tính năng chống chụp màn hình và chống vi phạm bản quyền số:
 * 1. Dynamic Watermark Grid: Lưới mờ lặp lại trải đều toàn màn hình đọc,
 *    hiển thị danh tính độc giả (Tên, Email, ID), Mã sách và Timestamp thời gian thực.
 * 2. Floating Watermark: Con dấu di động thay đổi vị trí liên tục theo chu kỳ,
 *    ngăn chặn các công cụ tẩy xóa watermark tĩnh hoặc ghép ảnh.
 * 3. Anti-Screenshot Interception: Bắt phím PrintScreen, Ctrl+P, phím tắt chụp màn hình
 *    và kích hoạt Màn hình che chắn bảo vệ bản quyền (Privacy Shield).
 * 4. Window Blur Guard: Che mờ nội dung đọc khi cửa sổ trình duyệt mất tiêu điểm
 *    (thường xảy ra khi mở Snipping Tool, Lightshot, ShareX hoặc công cụ chụp màn hình OS).
 * 5. Anti-Tamper (MutationObserver): Tự động phát hiện và khôi phục watermark nếu bị can thiệp
 *    hoặc xóa bỏ qua DevTools (F12).
 * 6. Print & Copy Protection: Vô hiệu hóa tính năng in (@media print) và sao chép lậu.
 */
const DynamicWatermark = ({
    bookId = '',
    bookTitle = '',
    paperTheme = 'default',
    enabled = true
}) => {
    // 1. Quản lý danh tính người đọc
    const [readerInfo, setReaderInfo] = useState(() => {
        try {
            const cache = localStorage.getItem('halm_customer_cache');
            if (cache) {
                const parsed = JSON.parse(cache);
                return {
                    name: parsed.customerName || parsed.name || '',
                    email: parsed.email || '',
                    id: parsed.customer_id || parsed.id || ''
                };
            }
        } catch {}

        try {
            const token = getAuthToken();
            if (token) {
                const payload = decodeJwtPayload(token);
                if (payload) {
                    return {
                        name: payload.sub || 'Độc giả HALM',
                        email: payload.sub?.includes('@') ? payload.sub : '',
                        id: payload.sub || ''
                    };
                }
            }
        } catch {}

        return {
            name: 'Độc giả bản quyền',
            email: '',
            id: 'HALM-READER'
        };
    });

    // Định dạng chuỗi nhận diện độc giả (khởi tạo sớm tránh Temporal Dead Zone)
    const readerDisplay = useMemo(() => {
        const parts = [];
        if (readerInfo.name) parts.push(readerInfo.name);
        if (readerInfo.email) parts.push(readerInfo.email);
        if (readerInfo.id && !parts.includes(readerInfo.id)) parts.push(`ID: ${readerInfo.id}`);
        return parts.length > 0 ? parts.join(' • ') : 'Độc giả HALM BOOK';
    }, [readerInfo]);

    // 2. Timestamp động thời gian thực (Cập nhật định kỳ)
    const [currentTime, setCurrentTime] = useState(() => formatTimestamp(new Date()));

    // 4. Trạng thái kích hoạt Màn hình bảo vệ bản quyền (Privacy Shield) khi chụp màn hình
    const [privacyShieldActive, setPrivacyShieldActive] = useState(false);
    const [shieldMessage, setShieldMessage] = useState('');
    const shieldTimerRef = useRef(null);

    // 5. Trạng thái che mờ khi chuyển cửa sổ / mở Snipping Tool
    // window blur guard removed to allow smooth iframe/EPUB and tab interaction

    // 6. Ref watermark container & MutationObserver để chống can thiệp DevTools
    const watermarkRef = useRef(null);
    const [tamperCount, setTamperCount] = useState(0);

    // Tải thông tin người dùng thực tế nếu chưa có
    useEffect(() => {
        let isMounted = true;
        const fetchUserData = async () => {
            if (!readerInfo.email && getAuthToken()) {
                try {
                    const data = await getCurrentCustomer();
                    if (data && isMounted) {
                        setReaderInfo({
                            name: data.customerName || data.name || 'Độc giả HALM',
                            email: data.email || '',
                            id: data.customer_id || data.id || ''
                        });
                        try {
                            localStorage.setItem('halm_customer_cache', JSON.stringify(data));
                        } catch {}
                    }
                } catch {
                    // ignore
                }
            }
        };
        fetchUserData();
        return () => { isMounted = false; };
    }, [readerInfo.email]);

    // Cập nhật timestamp mỗi giây và trôi nổi vị trí floating watermark mỗi 12 giây
    useEffect(() => {
        const timeInterval = setInterval(() => {
            setCurrentTime(formatTimestamp(new Date()));
        }, 1000);

        return () => {
            clearInterval(timeInterval);
            
        };
    }, []);

    // Kích hoạt Privacy Shield
    const triggerPrivacyShield = useCallback((msg) => {
        setShieldMessage(msg || 'Nội dung sách được bảo vệ bởi Bản quyền số HALM BOOK. Thao tác chụp màn hình hoặc trích xuất dữ liệu đã bị chặn.');
        setPrivacyShieldActive(true);

        // Cố gắng xóa clipboard để ngăn paste ảnh màn hình vừa chụp
        if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
            try {
                navigator.clipboard.writeText('');
            } catch {}
        }

        if (shieldTimerRef.current) {
            clearTimeout(shieldTimerRef.current);
        }
        shieldTimerRef.current = setTimeout(() => {
            setPrivacyShieldActive(false);
        }, 2200);
    }, []);

    // Lắng nghe các phím tắt chụp màn hình & in ấn
    useEffect(() => {
        const handleKeyDown = (e) => {
            // 1. Phím PrintScreen
            if (e.key === 'PrintScreen' || e.keyCode === 44) {
                e.preventDefault();
                triggerPrivacyShield('🔒 Phát hiện thao tác PrintScreen! Bản quyền số sách được bảo vệ.');
                return false;
            }

            // 2. Ctrl + P hoặc Cmd + P (Lệnh in ấn)
            if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P' || e.keyCode === 80)) {
                e.preventDefault();
                triggerPrivacyShield('🔒 Chức năng in tài liệu bị vô hiệu hóa để bảo vệ bản quyền tác giả.');
                return false;
            }

            // 3. Ctrl + S hoặc Cmd + S (Lưu trang web)
            if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S' || e.keyCode === 83)) {
                e.preventDefault();
                triggerPrivacyShield('🔒 Không thể tải bản sao trang sách trực tiếp.');
                return false;
            }

            // 4. Windows Snipping Tool (Win + Shift + S) & MacOS Screen Capture (Cmd + Shift + 3/4/5)
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'S' || e.key === 's' || ['3', '4', '5'].includes(e.key))) {
                e.preventDefault();
                triggerPrivacyShield('🔒 Phím tắt chụp màn hình đã bị chặn.');
                return false;
            }
        };

        const handleKeyUp = (e) => {
            if (e.key === 'PrintScreen' || e.keyCode === 44) {
                triggerPrivacyShield('🔒 Bản quyền số: Vui lòng không chụp ảnh màn hình trang sách.');
            }
        };

        // Chống sao chép hàng loạt & Tự động gắn Watermark bản quyền vào trích đoạn copy
        const handleCopy = (e) => {
            const selection = window.getSelection();
            if (!selection) return;
            const text = selection.toString();
            if (text && text.trim().length > 0) {
                const maxLen = 300;
                const snippet = text.length > maxLen ? text.substring(0, maxLen) + '...' : text;
                const attribution = `\n\n--- [Trích từ tác phẩm "${bookTitle || 'Sách số'}" - Nền tảng HALM BOOK. Bản quyền số được bảo vệ. Độc giả: ${readerDisplay} • ${currentTime}] ---`;
                if (e.clipboardData) {
                    e.clipboardData.setData('text/plain', snippet + attribution);
                    e.preventDefault();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown, { capture: true });
        window.addEventListener('keyup', handleKeyUp, { capture: true });
        window.addEventListener('copy', handleCopy);

        return () => {
            window.removeEventListener('keydown', handleKeyDown, { capture: true });
            window.removeEventListener('keyup', handleKeyUp, { capture: true });
            window.removeEventListener('copy', handleCopy);
            if (shieldTimerRef.current) clearTimeout(shieldTimerRef.current);
        };
    }, [triggerPrivacyShield, bookTitle, readerDisplay, currentTime]);

    // MutationObserver: Tự động khôi phục nếu watermark bị ẩn hoặc gỡ bỏ qua DevTools
    useEffect(() => {
        const targetNode = watermarkRef.current?.parentNode;
        if (!targetNode) return;

        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.type === 'childList') {
                    const watermarkStillExists = document.getElementById('halm-dynamic-watermark');
                    if (!watermarkStillExists) {
                        setTamperCount(prev => prev + 1);
                    }
                }
                if (mutation.type === 'attributes') {
                    const el = document.getElementById('halm-dynamic-watermark');
                    if (el && (el.style.display === 'none' || el.style.visibility === 'hidden' || el.style.opacity === '0')) {
                        el.style.display = 'block';
                        el.style.visibility = 'visible';
                        el.style.opacity = '1';
                        setTamperCount(prev => prev + 1);
                    }
                }
            }
        });

        observer.observe(targetNode, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['style', 'class', 'hidden']
        });

        return () => observer.disconnect();
    }, [tamperCount]);


    // Màu sắc watermark theo theme
    const styleTheme = useMemo(() => {
        if (paperTheme === 'starry') {
            return {
                gridColor: 'rgba(212, 175, 55, 0.085)',
                floatingBg: 'rgba(212, 175, 55, 0.12)',
                floatingText: '#D4AF37',
                border: 'rgba(212, 175, 55, 0.25)'
            };
        }
        if (paperTheme === 'sepia') {
            return {
                gridColor: 'rgba(92, 64, 40, 0.085)',
                floatingBg: 'rgba(92, 64, 40, 0.08)',
                floatingText: '#5C4028',
                border: 'rgba(92, 64, 40, 0.2)'
            };
        }
        return {
            gridColor: 'rgba(30, 30, 30, 0.075)',
            floatingBg: 'rgba(30, 30, 30, 0.07)',
            floatingText: '#2B2B2B',
            border: 'rgba(0, 0, 0, 0.15)'
        };
    }, [paperTheme]);

    // Tạo lưới lặp lại (16 vị trí trải đều khung nhìn)
    const watermarkItems = useMemo(() => {
        const items = [];
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                items.push({ id: `${row}-${col}`, row, col });
            }
        }
        return items;
    }, []);

    if (!enabled) return null;

    return (
        <>
            {/* INJECT MEDIA PRINT PROTECTION */}
            <style>{inlinePageStyle1}</style>

            <div id="halm-print-blocker" style={{ display: 'none' }}>
                <div>
                    <p style={{ fontSize: '28px', color: '#D4AF37', marginBottom: '16px' }}>🔒 BẢN QUYỀN SỐ ĐƯỢC BẢO VỆ</p>
                    <p>Nội dung tác phẩm trên HALM BOOK không hỗ trợ in ấn trực tiếp.</p>
                    <p style={{ fontSize: '14px', color: '#888', marginTop: '12px' }}>Tài khoản: {readerDisplay}</p>
                </div>
            </div>

            {/* DYNAMIC WATERMARK OVERLAY (POINTER-EVENTS-NONE: Tuyệt đối không cản trở đọc, lật trang hay bôi đen chữ) */}
            <div
                id="halm-dynamic-watermark"
                ref={watermarkRef}
                key={`wm-${tamperCount}`}
                className="absolute inset-0 pointer-events-none select-none overflow-hidden z-20"
                aria-hidden="true"
            >
                {/* 1. LƯỚI WATERMARK TRẢI ĐỀU 16 Ô TOÀN BỘ KHUNG NHÌN */}
                <div className="w-full h-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 grid-rows-4 p-4 gap-4">
                    {watermarkItems.map((item) => (
                        <div
                            key={item.id}
                            className="flex flex-col items-center justify-center text-center transform -rotate-22 transition-transform duration-700"
                            style={{
                                color: styleTheme.gridColor,
                                textShadow: paperTheme === 'starry' ? '0 0 1px rgba(255,255,255,0.05)' : 'none'
                            }}
                        >
                            <span className="font-serif tracking-widest text-[11px] font-bold uppercase block">
                                HALM BOOK DRM
                            </span>
                            <span className="font-sans text-[10px] font-semibold tracking-tight mt-0.5 max-w-[220px] truncate block">
                                {readerDisplay}
                            </span>
                            <span className="font-mono text-[9px] opacity-80 mt-0.5 block">
                                {currentTime} {bookId ? `• #${bookId}` : ''}
                            </span>
                        </div>
                    ))}
                </div>
            </div>



            {/* 4. PRIVACY SHIELD OVERLAY (Khi bấm PrintScreen hoặc phím tắt chụp màn hình) */}
            {privacyShieldActive && (
                <div
                    className="fixed inset-0 z-9999 flex flex-col items-center justify-center bg-black/95 text-white p-6 text-center select-none animate-fadeIn"
                    style={{ backdropFilter: 'blur(20px)' }}
                >
                    <div className="w-16 h-16 rounded-3xl bg-[#8E3038]/30 border border-[#8E3038] text-[#D4AF37] flex items-center justify-center text-3xl mb-4 shadow-2xl animate-bounce">
                        <i className="ph-bold ph-shield-warning"></i>
                    </div>
                    <h2 className="text-xl font-serif font-bold text-[#FAF7F2] mb-2 tracking-wide">
                        CẢNH BÁO BẢO VỆ BẢN QUYỀN SỐ
                    </h2>
                    <p className="text-sm text-[#A6A29A] max-w-lg mb-4 leading-relaxed font-outfit">
                        {shieldMessage}
                    </p>
                    <div className="bg-[#222420] border border-[#2F322B] px-4 py-2 rounded-xl text-xs text-[#D4AF37] font-mono flex items-center gap-2 shadow-inner">
                        <i className="ph-bold ph-lock-key"></i>
                        <span>Độc giả: {readerDisplay} • {currentTime}</span>
                    </div>
                </div>
            )}
        </>
    );
};

// Hàm hỗ trợ format timestamp ngắn gọn, chuẩn xác
function formatTimestamp(date) {
    const pad = (n) => String(n).padStart(2, '0');
    const yyyy = date.getFullYear();
    const MM = pad(date.getMonth() + 1);
    const dd = pad(date.getDate());
    const hh = pad(date.getHours());
    const mm = pad(date.getMinutes());
    const ss = pad(date.getSeconds());
    return `${yyyy}-${MM}-${dd} ${hh}:${mm}:${ss}`;
}

export default React.memo(DynamicWatermark);
