import React, { useEffect } from 'react';

const tailwindConfig = 
        {
            theme: {
                extend: {
                    colors: {
                        neubruDark: '#1e1e1e', // Xám đen cho Header mới
                        pastelYellow: '#fef08a',
                        pastelPink: '#fbcfe8',
                        pastelBlue: '#bfdbfe',
                    },
                    fontFamily: {
                        quicksand: ['Quicksand', 'sans-serif'],
                        garamond: ['"Cormorant Garamond"', 'serif'],
                        inter: ['Inter', 'sans-serif']
                    }
                }
            }
        }
    ;
const pageStyles = `
        html, body {
            height: 100%;
            margin: 0;
            padding: 0;
            overflow: hidden; /* Cố định trang đọc, loại bỏ hoàn toàn hiện tượng cuộn lòi khoảng đen */
            background-color: #faf8f5; /* Đồng bộ nền với giấy sách, không bao giờ lộ nền đen */
        }

        body {
            font-family: 'Quicksand', sans-serif;
            color: #2b2d42;
            opacity: 0;
            transition: opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }

        body.page-loaded {
            opacity: 1;
        }

        /* ============================================================ */
        /* ============================================================ */
        /* THIẾT KẾ THANH HEADER: HỒNG NHẠT (PASTEL BLOSSOM PINK)      */
        /* ============================================================ */
        .header-theme-pink {
            background: linear-gradient(135deg, #fff0f5 0%, #fce7f3 50%, #fbcfe8 100%) !important;
            border-bottom: 1px solid rgba(244, 114, 182, 0.45) !important;
            color: #831843 !important;
            box-shadow: 0 2px 12px rgba(244, 114, 182, 0.15);
            backdrop-filter: blur(8px);
        }
        .header-theme-pink .icon-btn {
            color: #9d174d;
            background: rgba(255, 255, 255, 0.65);
            border: 1px solid rgba(244, 114, 182, 0.35);
            backdrop-filter: blur(4px);
            transition: all 0.2s ease;
        }
        .header-theme-pink .icon-btn:hover {
            color: #831843;
            background-color: #ffffff;
            border-color: #ec4899;
            box-shadow: 0 2px 8px rgba(236, 72, 153, 0.25);
            transform: translateY(-1px);
        }
        .header-theme-pink .header-book-title {
            color: #831843;
            font-weight: 800;
            letter-spacing: 0.04em;
            text-shadow: 0 1px 1px rgba(255, 255, 255, 0.8);
        }
        .header-theme-pink .header-chapter-title {
            color: #9d174d;
            background: rgba(255, 255, 255, 0.75);
            padding: 4px 14px;
            border-radius: 9999px;
            border: 1px solid rgba(244, 114, 182, 0.4);
            box-shadow: 0 1px 4px rgba(244, 114, 182, 0.15);
            backdrop-filter: blur(6px);
            font-weight: 700;
        }
        .header-theme-pink .header-divider {
            border-color: rgba(244, 114, 182, 0.4);
        }

        .neubru-box {
            border: 3px solid #1e1e1e;
            box-shadow: 4px 4px 0px #1e1e1e;
        }

        .neubru-btn {
            border: 2px solid #1e1e1e;
            box-shadow: 2px 2px 0px #1e1e1e;
            transition: all 0.2s ease;
        }

        .neubru-btn:hover {
            transform: translate(-1px, -1px);
            box-shadow: 3px 3px 0px #1e1e1e;
        }

        .sidebar-overlay {
            position: fixed;
            top: 56px; /* Bằng với chiều cao header mới py-2 */
            bottom: 0;
            right: 0;
            z-index: 1050; 
            transition: transform 0.4s cubic-bezier(0.25, 1, 0.5, 1);
            will-change: transform;
        }

        /* Sidebar ẩn bên phải */
        .sidebar-right-hidden {
            transform: translateX(110%);
        }

        /* Sidebar trượt từ bên trái cho Danh Mục */
        .sidebar-left {
            left: 0;
            right: auto;
        }
        
        .sidebar-left-hidden {
            transform: translateX(-110%);
        }

        /* Xử lý Fullscreen Header & Z-Index */
        :fullscreen #headerHoverZone,
        body.is-fullscreen #headerHoverZone {
            display: block !important;
            z-index: 9990; /* Đặt thấp hơn header để không chặn click */
        }
        :fullscreen #mainHeader,
        body.is-fullscreen #mainHeader {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            transform: translateY(-100%);
            z-index: 9995; /* Nâng cao hơn HoverZone để nhận thao tác click */
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
            z-index: 10000; /* Nâng Sidebar lên cao nhất để hiển thị rõ ràng trên mọi thứ */
        }

        .theme-paper-default { 
            background-color: #ffffff; 
            color: #2b2d42; 
        }
        
        .theme-paper-starry { 
            background-color: #0a0a0a; 
            background-image: 
                radial-gradient(rgba(255,255,255,0.8) 1px, transparent 1px),
                radial-gradient(rgba(255,255,255,0.4) 1px, transparent 1px),
                radial-gradient(rgba(255,255,255,0.6) 2px, transparent 2px);
            background-size: 50px 50px, 90px 90px, 130px 130px;
            background-position: 0 0, 40px 30px, 80px 100px;
            color: #e5e7eb; 
        }

        .book-pages-container {
            display: flex;
            transition: transform 0.4s cubic-bezier(0.25, 1, 0.5, 1);
            will-change: transform;
            width: 100%;
            height: 100%;
        }

        /* ============================================================ */
        /* CẤU HÌNH CỠ CHỮ & ĐỊNH DẠNG TRANG ĐỌC SÁCH                    */
        /* - font-size: 24px (chữ to rõ nét, tạo cảm giác thoải mái)    */
        /* - line-height: 1.9 (khoảng cách dòng sách thông thoáng)      */
        /* ============================================================ */
        .book-page-pane {
            min-width: 100%;
            height: 100%;
            box-sizing: border-box;
            padding: 2rem 2.5rem; 
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            font-size: 24px;
            line-height: 1.9;
            overflow-y: auto; /* Cho phép cuộn mượt mà nội dung bên trong trang sách nếu chữ nhiều */
        }

        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(43, 45, 66, 0.2); border-radius: 3px; }

        .font-arial { font-family: Arial, sans-serif; }
        .font-roboto { font-family: 'Roboto', sans-serif; }
        .font-lora { font-family: 'Lora', serif; }
        .font-times { font-family: 'Times New Roman', Times, serif; }
        .font-inter { font-family: 'Inter', sans-serif; }
        
        /* Hiệu ứng list chọn Font trong Menu Aa */
        .font-list-item {
            padding: 10px 12px;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 14px;
            font-weight: 600;
            color: #d1d5db;
        }
        .font-list-item:hover {
            background-color: #2a2a2b;
        }
        .font-list-item.active {
            background-color: #303033;
            color: #fff; 
        }
        .font-list-item .check-icon {
            display: none;
            color: #10b981; 
            font-weight: bold;
        }
        .font-list-item.active .check-icon {
            display: block;
        }

        /* Thiết kế Hover Icon trên Header */
        .svg-icon {
            width: 24px;
            height: 24px;
            fill: none;
            stroke: currentColor;
            stroke-width: 2;
            stroke-linecap: round;
            stroke-linejoin: round;
            transition: all 0.2s ease;
        }
        .icon-btn:hover .svg-icon {
            stroke: #10b981; 
        }

        .page-nav-btn {
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            width: 48px;
            height: 48px;
            background-color: rgba(0, 0, 0, 0.4);
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 40; /* Nằm dưới header nhưng trên sách */
            transition: all 0.3s ease;
            opacity: 0.6;
        }

        .page-nav-btn:hover {
            opacity: 1;
            background-color: rgba(0, 0, 0, 0.6);
            transform: translateY(-50%) scale(1.1);
        }

        .page-nav-btn.left {
            left: 20px;
        }

        .page-nav-btn.right {
            right: 20px;
        }

        @media (max-width: 640px) {
            .book-page-pane {
                padding: 1.25rem 1rem;
                font-size: 20px; /* Tối ưu cỡ chữ cho điện thoại */
                line-height: 1.8;
            }
            .page-nav-btn {
                width: 40px;
                height: 40px;
                opacity: 0.4;
            }
            .page-nav-btn.left { left: 10px; }
            .page-nav-btn.right { right: 10px; }
        }
    `;
const externalStylesheets = ['https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&family=Cormorant+Garamond:wght@400;600;700&family=Lora:ital,wght@0,400;0,700;1,400&family=Roboto:wght@400;500;700&family=Inter:wght@400;600&display=swap'];

let isPlaying = false;
let isAudioDrawerHidden = true;
let isTocSidebarHidden = true;
let isAaSidebarHidden = true;
let currentPageIndex = 0;
let totalPages = 0;

function toggleFullScreen() {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch((err) => {
                    showAlert(`Lỗi: ${err.message}`);
                });
            } else {
                document.exitFullscreen();
            }
        }

function changePage(direction) {
            currentPageIndex += direction;
            if (currentPageIndex < 0) currentPageIndex = 0;
            if (currentPageIndex >= totalPages) currentPageIndex = totalPages - 1;
            document.getElementById('bookPagesContainer').style.transform = `translateX(-${currentPageIndex * 100}%)`;
        }

function closeAllSidebars() {
            if(!isTocSidebarHidden) {
                document.getElementById('tocSidebar').classList.add('sidebar-left-hidden');
                isTocSidebarHidden = true;
            }
            if(!isAudioDrawerHidden) {
                document.getElementById('rightAudioSidebar').classList.add('sidebar-right-hidden');
                isAudioDrawerHidden = true;
            }
            if(!isAaSidebarHidden) {
                document.getElementById('aaSidebar').classList.add('sidebar-right-hidden');
                isAaSidebarHidden = true;
            }
        }

function toggleTocSidebar() {
            if(isTocSidebarHidden) closeAllSidebars();
            isTocSidebarHidden = !isTocSidebarHidden;
            document.getElementById('tocSidebar').classList.toggle('sidebar-left-hidden', isTocSidebarHidden);
        }

function toggleAudioDrawer() {
            if(isAudioDrawerHidden) closeAllSidebars();
            isAudioDrawerHidden = !isAudioDrawerHidden;
            document.getElementById('rightAudioSidebar').classList.toggle('sidebar-right-hidden', isAudioDrawerHidden);
        }

function toggleAaSidebar() {
            if(isAaSidebarHidden) closeAllSidebars();
            isAaSidebarHidden = !isAaSidebarHidden;
            document.getElementById('aaSidebar').classList.toggle('sidebar-right-hidden', isAaSidebarHidden);
        }

function setPaperTheme(theme) {
            const paper = document.getElementById('readerPaper');
            paper.style.backgroundImage = 'none';
            paper.style.color = '';             
            paper.style.backgroundColor = '';   
            
            paper.className = "flex-grow w-full flex flex-col relative transition-colors duration-300 h-full overflow-hidden";
            if (theme === 'default') {
                paper.classList.add('theme-paper-default');
                document.body.style.backgroundColor = '#faf8f5';
            } else if (theme === 'starry') {
                paper.classList.add('theme-paper-starry');
                document.body.style.backgroundColor = '#0a0a0a';
            }
        }

function setPaperBackgroundImage(imgUrl) {
            const paper = document.getElementById('readerPaper');
            paper.className = "flex-grow w-full flex flex-col relative transition-colors duration-300 h-full overflow-hidden";
            paper.style.backgroundImage = `url('${imgUrl}')`;
            paper.style.backgroundSize = 'cover';
            paper.style.backgroundPosition = 'center';
            paper.style.backgroundAttachment = 'fixed';
            paper.style.color = '#2b2d42'; 
            paper.style.backgroundColor = '#121212';
            document.body.style.backgroundColor = '#121212';
        }

function setHeaderTheme(theme) {
            const header = document.getElementById('mainHeader');
            if (header) {
                header.className = header.className.replace(/\bheader-theme-\w+/g, '');
                header.classList.add('header-theme-pink');
            }
        }

function setPaperFont(fontClass, itemElement) {
            const panes = document.querySelectorAll('.book-page-pane');
            panes.forEach(pane => {
                pane.classList.remove('font-garamond', 'font-quicksand', 'font-roboto', 'font-lora', 'font-times', 'font-inter', 'font-arial');
                pane.classList.add(`font-${fontClass}`);
            });
            document.querySelectorAll('.font-list-item').forEach(item => item.classList.remove('active'));
            if(itemElement) itemElement.classList.add('active');
        }

function applyFontSize(size) {
            const panes = document.querySelectorAll('.book-page-pane');
            panes.forEach(pane => pane.style.fontSize = size + 'px');
            const display = document.getElementById('fontSizeDisplay');
            if (display) display.innerText = size + 'px';
            localStorage.setItem('halm-reader-font-size', size);
        }

function adjustFontSize(delta) {
            const panes = document.querySelectorAll('.book-page-pane');
            if (panes.length > 0) {
                let current = parseInt(window.getComputedStyle(panes[0]).fontSize) || 24;
                let next = current + delta;
                if (next >= 14 && next <= 48) {
                    applyFontSize(next);
                    showAlert(`Cỡ chữ: ${next}px`);
                }
            }
        }

function switchAudioTab(tab) {
            const tabKho = document.getElementById('tabKhoNhac');
            const tabTai = document.getElementById('tabTaiLen');
            const khoContent = document.getElementById('audioDrawerContent');
            const searchBar = document.getElementById('audioSearchBar');
            const uploadContent = document.getElementById('uploadMusicArea');

            if (tab === 'kho') {
                tabKho.className = "text-[#10b981] cursor-pointer transition";
                tabTai.className = "text-gray-400 hover:text-white transition cursor-pointer";
                khoContent.classList.remove('hidden'); searchBar.classList.remove('hidden');
                uploadContent.classList.add('hidden'); uploadContent.classList.remove('flex');
            } else {
                tabTai.className = "text-[#10b981] cursor-pointer transition";
                tabKho.className = "text-gray-400 hover:text-white transition cursor-pointer";
                khoContent.classList.add('hidden'); searchBar.classList.add('hidden');
                uploadContent.classList.remove('hidden'); uploadContent.classList.add('flex');
            }
        }

function playMockTrack(element, title, artist) {
            const allBtns = document.querySelectorAll('.play-icon-btn');
            const btn = element.querySelector('.play-icon-btn');
            
            if(isPlaying && btn.innerText === '⏸') {
                audio.pause();
                isPlaying = false;
                btn.innerText = '▶';
                showAlert(`Đã dừng: ${title}`);
            } else {
                allBtns.forEach(b => b.innerText = '▶');
                btn.innerText = '⏸';
                isPlaying = true;
                audio.play().catch(e => console.log('Autoplay prevented'));
                showAlert(`Phát: ${title}`);
            }
        }

function showAlert(msg) {
            const box = document.getElementById('messageBox');
            document.getElementById('messageText').innerText = msg;
            box.classList.remove('opacity-0', 'translate-y-3', 'pointer-events-none');
            box.classList.add('opacity-100', 'translate-y-0', 'pointer-events-auto');
            if (alertTimer) clearTimeout(alertTimer);
            alertTimer = setTimeout(() => {
                box.classList.remove('opacity-100', 'translate-y-0', 'pointer-events-auto');
                box.classList.add('opacity-0', 'translate-y-3', 'pointer-events-none');
            }, 2800);
        }

function goBack() {
            sessionStorage.setItem('returnTransition', 'true');
            document.body.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
            document.body.style.opacity = '0';
            document.body.style.transform = 'scale(0.98)';
            setTimeout(() => {
                window.location.href = 'ChiTietSach.html';
            }, 180);
        }

function switchTocTab(tab) {
            const tabToc = document.getElementById('tabToc');
            const tabNote = document.getElementById('tabNote');
            const tocContent = document.getElementById('tocContent');
            const noteContent = document.getElementById('noteContent');

            if (tab === 'toc') {
                tabToc.className = "text-[#10b981] font-extrabold text-sm uppercase transition cursor-pointer";
                tabNote.className = "text-gray-500 hover:text-gray-300 font-extrabold text-sm uppercase transition cursor-pointer relative";
                tocContent.classList.remove('hidden'); 
                noteContent.classList.add('hidden');
                noteContent.classList.remove('flex');
            } else {
                tabNote.className = "text-[#10b981] font-extrabold text-sm uppercase transition cursor-pointer relative";
                tabToc.className = "text-gray-500 hover:text-gray-300 font-extrabold text-sm uppercase transition cursor-pointer";
                tocContent.classList.add('hidden'); 
                noteContent.classList.remove('hidden');
                noteContent.classList.add('flex');
            }
        }

function renderNotes() {
            const container = document.getElementById('noteContent');
            const badge = document.getElementById('noteBadge');
            
            if (notes.length === 0) {
                container.innerHTML = '<p className"text-sm text-gray-500 italic text-center mt-4">Chưa có ghi chú nào.<br>Hãy bôi đen văn bản để đánh dấu.</p>';
                badge.classList.add('hidden');
                return;
            }
            
            badge.innerText = notes.length;
            badge.classList.remove('hidden');
            
            let html = '';
            notes.forEach(note => {
                let preview = note.text.length > 55 ? note.text.substring(0, 55) + '...' : note.text;
                html += `
                <div onClick"goToNote('${note.id}', ${note.pageIndex})" className"p-3 rounded-xl bg-[#2a2a2b] hover:bg-[#303033] transition cursor-pointer text-xs border border-gray-700 hover:border-[#10b981] mb-1 group">
                    <div className"flex justify-between items-center mb-1.5">
                        <span className"font-bold text-[#10b981] bg-[#10b981]/10 px-2 py-0.5 rounded text-[10px]">Trang ${note.pageIndex + 1}</span>
                        <button onClick"event.stopPropagation(); deleteNote('${note.id}')" className"text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition" title="Xóa">✕</button>
                    </div>
                    <div className"text-gray-300 italic border-l-2 border-[#10b981] pl-2 leading-relaxed">"${preview}"</div>
                </div>`;
            });
            container.innerHTML = html;
        }

function goToNote(id, targetPageIndex) {
            if (window.innerWidth < 768) toggleTocSidebar();
            currentPageIndex = targetPageIndex;
            document.getElementById('bookPagesContainer').style.transform = `translateX(-${currentPageIndex * 100}%)`;
            
            const el = document.getElementById(id);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                el.classList.replace('bg-yellow-300/40', 'bg-yellow-400');
                setTimeout(() => el.classList.replace('bg-yellow-400', 'bg-yellow-300/40'), 1500);
            }
        }

function useReadingPageAssets() {
    useEffect(() => {
        const links = externalStylesheets.map((href) => {
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
        document.body.classList.add('page-loaded');
        totalPages = document.querySelectorAll('.book-page-pane').length;
        const savedFontSize = localStorage.getItem('halm-reader-font-size');
        applyFontSize(!savedFontSize || parseInt(savedFontSize, 10) <= 20 ? 24 : parseInt(savedFontSize, 10));
        setHeaderTheme('pink');

        const handleKeyDown = (event) => {
            if (event.target.tagName.toLowerCase() === 'input') return;
            if (event.key === 'ArrowRight' || event.key === 'PageDown') changePage(1);
            if (event.key === 'ArrowLeft' || event.key === 'PageUp') changePage(-1);
        };
        document.addEventListener('keydown', handleKeyDown);

        const handleFullscreenChange = () => {
            const isFullscreen = Boolean(document.fullscreenElement);
            document.body.classList.toggle('is-fullscreen', isFullscreen);

            if (isFullscreen) {
                showAlert('Rê chuột sát viền trên để mở công cụ.');
            }
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        handleFullscreenChange();

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.body.classList.remove('is-fullscreen');
            links.forEach((link) => link.remove());
        };
    }, []);
}

export default function DocSach() {
    useReadingPageAssets();
    return (
        <>
            <style>{pageStyles}</style>
            <div className="h-screen w-screen flex flex-col selection:bg-yellow-200 overflow-hidden">
{/* Hover Zone dùng để kéo Header xuống khi Fullscreen */}
    <div id="headerHoverZone" className="fixed top-0 inset-x-0 h-16" style={{display: "none"}}></div>

    {/* Header với thanh công cụ cố định trên cùng (Mặc định theme Hồng cánh sen tươi tắn) */}
    <header id="mainHeader" className="w-full header-theme-pink px-3 sm:px-6 py-2 sticky top-0 z-50 flex items-center justify-between transition-all duration-300 h-[56px] gap-2">
        
        {/* Nhóm Công Cụ Bên Trái (Back, Mục Lục, Tên Truyện) */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
            {/* Nút Back */}
            <button onClick={(event) => { goBack() }} className="w-9 h-9 rounded-lg flex items-center justify-center transition cursor-pointer icon-btn shrink-0" title="Quay lại">
                <svg className="svg-icon" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            </button>

            {/* Danh mục / Mục Lục */}
            <button onClick={(event) => { toggleTocSidebar() }} className="w-9 h-9 rounded-lg flex items-center justify-center transition cursor-pointer icon-btn shrink-0" title="Danh mục">
                <svg className="svg-icon" viewBox="0 0 24 24">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="8" y1="9" x2="16" y2="9"></line>
                    <line x1="8" y1="13" x2="16" y2="13"></line>
                    <line x1="8" y1="17" x2="12" y2="17"></line>
                </svg>
            </button>

            {/* Tiêu đề truyện: Khóa trên 1 dòng duy nhất (whitespace-nowrap truncate), không bao giờ bị đẩy rớt chữ */}
            <div className="hidden sm:flex items-center pl-3 ml-1 border-l header-divider min-w-0 overflow-hidden transition-colors">
                <span className="font-extrabold text-[13px] md:text-[14px] header-book-title uppercase tracking-wider whitespace-nowrap truncate block transition-colors" title="NGÀY XƯA CÓ MỘT CHUYỆN TÌNH">🌸 NGÀY XƯA CÓ MỘT CHUYỆN TÌNH</span>
            </div>
        </div>

        {/* Nhóm điều hướng và tên Chương */}
        <div className="flex items-center justify-center px-2 shrink-0 max-w-[150px] sm:max-w-xs md:max-w-sm">
            <h1 className="font-semibold text-xs sm:text-sm header-chapter-title tracking-wide text-center truncate whitespace-nowrap transition-colors" title="Chương 3: Ranh Giới">Chương 3: Ranh Giới</h1>
        </div>

        {/* Nhóm Công Cụ Bên Phải */}
        <div className="flex items-center justify-end gap-1.5 sm:gap-4 flex-1 relative shrink-0">
            {/* Nhạc */}
            <button onClick={(event) => { toggleAudioDrawer() }} className="p-2 rounded-lg transition cursor-pointer icon-btn" title="Bảng nhạc">
                <svg className="svg-icon" viewBox="0 0 24 24">
                    <path d="M3 18v-6a9 9 0 0 1 18 0v6"></path>
                    <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path>
                </svg>
            </button>

            {/* Menu Cài đặt */}
            <button onClick={(event) => { toggleAaSidebar() }} className="p-2 rounded-lg transition cursor-pointer icon-btn" title="Cài đặt giao diện">
                <svg className="svg-icon" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l-.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
            </button>

            {/* Fullscreen */}
            <button onClick={(event) => { toggleFullScreen() }} className="p-2 rounded-lg transition cursor-pointer icon-btn" title="Toàn màn hình">
                <svg className="svg-icon" viewBox="0 0 24 24">
                    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
                </svg>
            </button>
        </div>
    </header>

    <main id="mainContainer" className="flex-grow w-full flex flex-col relative transition-all duration-300 h-[calc(100vh-56px)] overflow-hidden">

        {/* Lớp Theme Nền */}
        <section id="readerPaper" className="flex-grow w-full flex flex-col relative transition-colors duration-300 h-full overflow-hidden theme-paper-default">
            
            {/* Nút Lùi Trang */}
            <button onClick={(event) => { changePage(-1) }} className="page-nav-btn left shadow-lg" title="Trang trước">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
            </button>

            {/* Nút Tiến Trang */}
            <button onClick={(event) => { changePage(1) }} className="page-nav-btn right shadow-lg" title="Trang sau">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
            </button>

            <div className="relative overflow-hidden flex-grow flex items-start w-full h-full max-w-6xl mx-auto px-4 sm:px-8">
                <div id="bookPagesContainer" className="book-pages-container">
                    
                    {/* ============================================================ */}
                    {/* CÁC TRANG NỘI DUNG SÁCH (CỠ CHỮ TO RÕ NÉT: 24px)              */}
                    {/* ============================================================ */}
                    
                    {/* Trang 1 */}
                    <div className="book-page-pane font-garamond" style={{fontSize: "24px", lineHeight: "1.9"}}>
                        <div className="w-full space-y-6 pt-2">
                            <div className="text-center space-y-1.5 mb-8 shrink-0">
                                <h1 className="font-bold text-3xl md:text-4xl tracking-tight">Chương 3: Ranh Giới</h1>
                                <div className="w-16 h-1 bg-current opacity-30 mx-auto rounded-full mt-4"></div>
                            </div>
                            <p>Ánh trăng nhợt nhạt hắt qua khung cửa sổ vỡ vụn, chiếu rọi lên những vệt sơn đỏ thẫm trên bức tường bê tông. Denko ngồi bệt ở góc phòng, hơi thở gấp gáp tạo thành những màn khói mỏng trong không khí lạnh lẽo của đêm tháng Mười hai. Cậu liếc nhìn thanh gươm đang phát ra những tia lửa điện lép bép bên cạnh mình. Mọi thứ dường như vừa mới xảy ra chỉ vài giây trước.</p>
                            <p>"Cậu có chắc là chúng ta nên làm điều này không?" – Tiếng của Aki vang lên qua bộ đàm gắn ở cổ áo, đều đều và lạnh lùng như thường lệ.</p>
                        </div>
                    </div>

                    {/* Trang 2 */}
                    <div className="book-page-pane font-garamond" style={{fontSize: "24px", lineHeight: "1.9"}}>
                        <div className="w-full space-y-6 pt-2">
                            <p className="bg-amber-200/40 dark:bg-yellow-900/30 p-4 rounded border-l-4 border-amber-600">Denko bật cười một tiếng khô khốc. <b className="font-bold">"Lựa chọn? Từ khi nào những kẻ như chúng ta lại có đặc quyền được lựa chọn cơ chứ?"</b> Cậu vuốt ngược mái tóc bết bát mồ hôi ra sau gáy, đôi mắt ánh lên một sắc vàng kỳ lạ.</p>
                            <p>Bên ngoài, tiếng còi hụ rên rỉ bắt đầu xé toạc màn đêm. Chúng đang đến. Những con quái vật ẩn dưới lốt người bảo vệ trị an. Denko biết, ranh giới giữa việc làm một anh hùng và một con ác quỷ chưa bao giờ mong manh đến thế. Cậu nhặt thanh gươm lên.</p>
                        </div>
                    </div>

                    {/* Trang 3 */}
                    <div className="book-page-pane font-garamond" style={{fontSize: "24px", lineHeight: "1.9"}}>
                        <div className="w-full space-y-6 pt-2">
                            <p className="text-center my-6 opacity-60 font-bold tracking-widest text-2xl">* * *</p>
                            <p>Cảm giác kim loại lạnh lẽo áp vào lòng bàn tay dường như truyền cho cậu một luồng sức mạnh vô hình.</p>
                            <p>Ký ức ùa về như một cuốn phim tua chậm. Hình ảnh cô gái với mái tóc hồng rực rỡ mỉm cười dưới tán hoa anh đào năm ấy...</p>
                        </div>
                    </div>

                </div>
            </div>
            
        </section>

        <aside id="aaSidebar" className="sidebar-overlay w-[340px] bg-[#1a1a1b] border-l border-gray-700 p-6 flex flex-col gap-6 sidebar-right-hidden shadow-2xl text-white overflow-y-auto">
            
            <div className="flex justify-between items-center pb-2">
                <span className="font-extrabold text-sm uppercase text-gray-200">Cài đặt giao diện</span>
                <button onClick={(event) => { toggleAaSidebar() }} className="w-6 h-6 rounded-lg bg-gray-700 text-xs font-extrabold flex items-center justify-center hover:bg-gray-600 cursor-pointer shrink-0">✕</button>
            </div>

            <div>
                <h3 className="font-bold text-sm mb-3 text-gray-300">Nền</h3>
                <div className="flex gap-4">
                    <button onClick={(event) => { setPaperTheme('default') }} className="w-20 h-14 rounded-lg bg-white border-2 border-transparent hover:border-gray-400 transition cursor-pointer" title="Mặc định"></button>
                    <button onClick={(event) => { setPaperTheme('starry') }} className="w-20 h-14 rounded-lg bg-black border-2 border-gray-600 hover:border-gray-400 transition cursor-pointer relative overflow-hidden" title="Trời sao">
                        <div className="absolute inset-0 theme-paper-starry opacity-80 pointer-events-none"></div>
                    </button>
                </div>
            </div>

            <div>
                <h3 className="font-bold text-sm mb-3 text-gray-300">Ảnh nền</h3>
                <div className="grid grid-cols-4 gap-2">
                    <button onClick={(event) => { setPaperBackgroundImage('img/laban.jpg') }} style={{backgroundImage: "url('img/laban.jpg')", backgroundSize: "cover", backgroundPosition: "center"}} className="aspect-[4/3] rounded-lg border-2 border-transparent hover:border-gray-400 transition cursor-pointer" title="Sách & Ánh sáng"></button>
                    <button onClick={(event) => { setPaperBackgroundImage('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80') }} style={{backgroundImage: "url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80')", backgroundSize: "cover", backgroundPosition: "center"}} className="aspect-[4/3] rounded-lg border-2 border-transparent hover:border-gray-400 transition cursor-pointer" title="Lục sắc"></button>
                    <button onClick={(event) => { setPaperBackgroundImage('img/nen-lich-su.jpg') }} style={{backgroundImage: "url('img/nen-lich-su.jpg')", backgroundSize: "cover", backgroundPosition: "center"}} className="aspect-[4/3] rounded-lg border-2 border-transparent hover:border-gray-400 transition cursor-pointer opacity-80 hover:opacity-100" title="Đồi cát"></button>
                    <button onClick={(event) => { setPaperBackgroundImage('https://images.unsplash.com/photo-1473448912268-2022ce9509d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80') }} style={{backgroundImage: "url('https://images.unsplash.com/photo-1473448912268-2022ce9509d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80')", backgroundSize: "cover", backgroundPosition: "center"}} className="aspect-[4/3] rounded-lg border-2 border-transparent hover:border-gray-400 transition cursor-pointer opacity-80 hover:opacity-100" title="Biển"></button>
                </div>
            </div>



            {/* ============================================================ */}
            {/* KHU VỰC ĐIỀU CHỈNH CỠ CHỮ & KIỂU CHỮ (MENU CÀI ĐẶT Aa)       */}
            {/* - Nút A- : Giảm cỡ chữ 2px (tối thiểu 14px)                  */}
            {/* - Thẻ span : Hiển thị kích thước chữ hiện hành (id: fontSizeDisplay) */}
            {/* - Nút A+ : Tăng cỡ chữ 2px (tối đa 48px)                     */}
            {/* ============================================================ */}
            <div>
                <h3 className="font-bold text-sm mb-3 text-gray-300">Cỡ và kiểu chữ</h3>
                <div className="flex items-center gap-3 mb-4">
                    <button onClick={(event) => { adjustFontSize(-2) }} className="flex-1 h-10 rounded-full bg-[#303033] hover:bg-[#404043] transition cursor-pointer flex items-center justify-center font-bold text-lg text-gray-300 active:scale-95" title="Giảm cỡ chữ (A-)">A-</button>
                    {/* Hiển thị kích thước font hiện hành (Mặc định 24px) */}
                    <span id="fontSizeDisplay" className="text-sm font-bold text-[#10b981] min-w-[55px] text-center bg-[#2a2a2b] py-1.5 px-2 rounded-lg border border-gray-700 select-none">24px</span>
                    <button onClick={(event) => { adjustFontSize(2) }} className="flex-1 h-10 rounded-full bg-[#303033] hover:bg-[#404043] transition cursor-pointer flex items-center justify-center font-bold text-lg text-gray-300 active:scale-95" title="Tăng cỡ chữ (A+)">A+</button>
                </div>

                <div className="flex flex-col gap-1">
                    <div onClick={(event) => { setPaperFont('garamond', event.currentTarget) }} className="font-list-item active font-garamond">
                        <span>Mặc định</span>
                        <span className="check-icon">✓</span>
                    </div>
                    <div onClick={(event) => { setPaperFont('inter', event.currentTarget) }} className="font-list-item font-inter">
                        <span>Netflix Sans</span>
                        <span className="check-icon">✓</span>
                    </div>
                    <div onClick={(event) => { setPaperFont('arial', event.currentTarget) }} className="font-list-item font-arial">
                        <span>Arial</span>
                        <span className="check-icon">✓</span>
                    </div>
                    <div onClick={(event) => { setPaperFont('lora', event.currentTarget) }} className="font-list-item font-lora">
                        <span>Bookerly</span>
                        <span className="check-icon">✓</span>
                    </div>
                    <div onClick={(event) => { setPaperFont('times', event.currentTarget) }} className="font-list-item font-times">
                        <span>Times New Roman</span>
                        <span className="check-icon">✓</span>
                    </div>
                    <div onClick={(event) => { setPaperFont('roboto', event.currentTarget) }} className="font-list-item font-roboto">
                        <span>Roboto</span>
                        <span className="check-icon">✓</span>
                    </div>
                </div>
            </div>
        </aside>

        {/* Sidebar Danh Mục */}
        <aside id="tocSidebar" className="sidebar-overlay sidebar-left w-[340px] bg-[#1a1a1b] border-r border-gray-700 p-6 flex flex-col gap-6 sidebar-left-hidden shadow-2xl text-white">
            <div className="flex justify-between items-center pb-2 border-b border-gray-700">
                <div className="flex gap-4">
                    <button id="tabToc" onClick={(event) => { switchTocTab('toc') }} className="text-[#10b981] font-extrabold text-sm uppercase transition cursor-pointer">Mục Lục</button>
                    <button id="tabNote" onClick={(event) => { switchTocTab('note') }} className="text-gray-500 hover:text-gray-300 font-extrabold text-sm uppercase transition cursor-pointer relative">
                        Ghi Chú
                        <span id="noteBadge" className="hidden absolute -top-1 -right-3 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full shadow">0</span>
                    </button>
                </div>
                <button onClick={(event) => { toggleTocSidebar() }} className="w-6 h-6 rounded-lg bg-gray-700 text-xs font-extrabold flex items-center justify-center hover:bg-gray-600 cursor-pointer shrink-0">✕</button>
            </div>
            
            <div id="tocContent" className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
                <div className="p-3 rounded-xl hover:bg-[#2a2a2b] transition cursor-pointer text-xs border border-transparent hover:border-gray-500">
                    <div className="font-bold text-gray-400">Chương 1</div>
                    <div className="font-extrabold text-gray-200 mt-1 text-sm">Khởi đầu của sự kết thúc</div>
                </div>
                <div className="p-3 rounded-xl hover:bg-[#2a2a2b] transition cursor-pointer text-xs border border-transparent hover:border-gray-500">
                    <div className="font-bold text-gray-400">Chương 2</div>
                    <div className="font-extrabold text-gray-200 mt-1 text-sm">Lời hứa dưới cơn mưa</div>
                </div>
                <div className="p-3 rounded-xl bg-[#303033] border border-gray-600 text-xs font-bold shadow-lg">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-[#10b981]">Chương 3 (Đang đọc)</span>
                        <span className="text-[10px] bg-[#10b981]/20 text-[#10b981] px-2 py-0.5 rounded font-extrabold">Active</span>
                    </div>
                    <div className="font-extrabold text-white text-sm">Ranh Giới</div>
                </div>
            </div>

            <div id="noteContent" className="hidden flex-col gap-3 max-h-[70vh] overflow-y-auto pr-1 pb-10">
                <p className="text-sm text-gray-500 italic text-center mt-4">Chưa có ghi chú nào.<br />Hãy bôi đen văn bản để đánh dấu.</p>
            </div>
        </aside>

        <aside id="rightAudioSidebar" className="sidebar-overlay w-80 bg-[#1e1e1e] border-l border-gray-700 p-4 flex flex-col gap-4 sidebar-right-hidden shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-gray-700">
                <div className="flex gap-6 text-sm font-semibold">
                    <button id="tabKhoNhac" onClick={(event) => { switchAudioTab('kho') }} className="text-[#10b981] cursor-pointer transition">Kho nhạc</button>
                    <button id="tabTaiLen" onClick={(event) => { switchAudioTab('tai') }} className="text-gray-400 hover:text-white transition cursor-pointer">Đã tải lên</button>
                </div>
                <button onClick={(event) => { toggleAudioDrawer() }} className="w-5 h-5 rounded-full bg-gray-500 text-[#1e1e1e] text-[10px] font-bold flex items-center justify-center hover:bg-gray-400 cursor-pointer">✕</button>
            </div>
            
            <div id="audioSearchBar" className="relative mt-1 transition-all">
                <input type="text" placeholder="Nhập tên bài hát..." className="w-full p-2.5 pl-4 pr-10 text-sm border border-gray-600 rounded-full bg-transparent focus:outline-none focus:border-[#10b981] text-white transition placeholder-gray-400" />
                <span className="absolute right-3 top-2.5 text-gray-400 text-lg">🔍</span>
            </div>
            
            <div id="audioDrawerContent" className="space-y-5 pt-2 overflow-y-auto max-h-[60vh] pr-1 transition-all">
                <div className="flex items-center gap-3 group cursor-pointer" onClick={(event) => { playMockTrack(event.currentTarget, 'Weedend', 'JuliusH') }}>
                    <span className="w-6 text-center text-lg font-bold text-gray-400 group-hover:text-[#10b981] transition-colors">1</span>
                    <div className="flex-1">
                        <h4 className="text-white font-bold text-sm tracking-wide">Weedend</h4>
                        <p className="text-gray-400 text-[12px] mt-0.5 flex items-center gap-1">🎵 JuliusH</p>
                    </div>
                    <button className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-black text-[10px] play-icon-btn hover:scale-105">▶</button>
                </div>
            </div>
            
            <div id="uploadMusicArea" className="hidden flex-col items-center justify-center mt-4 p-8 border-2 border-dashed border-gray-600 rounded-xl bg-[#2a2a2a]">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" className="mb-3"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                <span className="text-gray-300 text-sm font-bold mb-4 text-center">Upload file nhạc (.mp3)</span>
                <input type="file" id="customAudioInput" accept="audio/*" className="hidden" />
                <button onClick={(event) => { document.getElementById('customAudioInput').click() }} className="bg-[#10b981] text-black px-5 py-2 rounded-full font-bold text-sm hover:scale-105 cursor-pointer">Chọn tệp</button>
                <div id="uploadedFileName" className="text-[#10b981] text-xs font-bold mt-5 hidden w-full text-center truncate"></div>
            </div>
        </aside>

    </main>

    <button id="floatingSaveBtn" className="fixed hidden bg-[#10b981] text-neubruDark px-3 py-1.5 rounded-lg shadow-lg text-xs font-extrabold z-[9999] hover:bg-[#0e9f6e] transition-all transform hover:scale-105 shadow-[0_0_15px_rgba(16,185,129,0.4)] flex items-center gap-1 cursor-pointer">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
        Lưu đoạn này
    </button>

    <div id="messageBox" className="fixed bottom-6 right-6 bg-white/95 text-[#1e1e1e] px-4 py-2.5 rounded-xl shadow-xl border border-gray-200/80 transition-all duration-300 z-[10000] text-xs font-bold opacity-0 translate-y-3 pointer-events-none flex items-center gap-2 shadow-[0_10px_25px_rgba(0,0,0,0.12)]">
        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
        <span id="messageText">Thông báo</span>
    </div>

    <audio id="bgAudio" loop><source src="https://actions.google.com/sounds/v1/ambiences/rain_heavy.ogg" type="audio/ogg" /></audio>


            </div>
        </>
    );
}
