/**
 * HALMBOOK Admin Navigation & Shared UI Components
 * Quản lý Sidebar, Header, Admin Profile Dropdown, Modals dùng chung
 */

document.addEventListener('DOMContentLoaded', function() {
    renderAdminLayout();
    initAdminModals();
});
window.renderAdminLayout = renderAdminLayout;
window.initAdminModals = initAdminModals;

function renderAdminLayout() {
    // Admin luôn dùng giao diện sáng và không dùng chung trạng thái dark mode của User.
    document.documentElement.classList.remove('dark');
    const sidebarContainer = document.getElementById('admin-sidebar-container');
    const headerContainer = document.getElementById('admin-header-container');

    const currentPath = window.__HALM_ADMIN_PAGE__ || window.location.pathname.split('/').pop() || 'TongQuan.html';
    const reactRoutes = {
        TongQuan: '/admin',
        'BaoCao&ThongKe': '/admin/thong-ke',
        QuanLySach: '/admin/quan-ly-sach',
        GiaoDichThueSach: '/admin/giao-dich-thue-sach',
        QuanLyTaiChinh: '/admin/quan-ly-tai-chinh',
        QuanLyKhachHang: '/admin/quan-ly-khach-hang',
        QuanLyUuDai: '/admin/quan-ly-uu-dai',
        ThongBaoHoTro: '/admin/thong-bao-ho-tro',
        QuanLyGiaoDien: '/admin/quan-ly-giao-dien'
    };
    document.documentElement.classList.toggle('admin-sidebar-collapsed', localStorage.getItem('halm_admin_sidebar_collapsed') === 'true');
    injectAdminSharedStyles();

    const menuItems = [
        { href: 'TongQuan', icon: 'fa-chart-pie', text: 'Tổng Quan Hệ Thống' },
        { href: 'BaoCao&ThongKe', icon: 'fa-chart-column', text: 'Báo Cáo & Thống Kê' },
        { href: 'QuanLySach', icon: 'fa-book-bookmark', text: 'Quản Lý Kho Sách' },
        { href: 'GiaoDichThueSach', icon: 'fa-book-open-reader', text: 'Giao Dịch Thuê Sách', badge: 'pendingRentals' },
        { href: 'QuanLyTaiChinh', icon: 'fa-sack-dollar', text: 'Quản Lý Tài Chính', badge: 'pendingTxs' },
        { href: 'QuanLyKhachHang', icon: 'fa-users-gear', text: 'Quản Lý Khách Hàng' },
        { href: 'QuanLyUuDai', icon: 'fa-tags', text: 'Ưu Đãi & Gói Khoai Tây' },
        { href: 'ThongBaoHoTro', icon: 'fa-headset', text: 'Hỗ Trợ & Khiếu Nại', badge: 'pendingTickets' },
        { href: 'QuanLyGiaoDien', icon: 'fa-paintbrush', text: 'Quản Lý Giao Diện' }
    ];

    const stats = window.DB ? window.DB.getStats() : { pendingTxs: 0, pendingRentals: 0, pendingTickets: 0 };

    if (sidebarContainer) {
        let menuHtml = menuItems.map(item => {
            const itemHref = window.__HALM_ADMIN_REACT__
                ? reactRoutes[item.href]
                : item.href + '.html';
            const isActive = window.__HALM_ADMIN_REACT__
                ? window.location.pathname.toLowerCase() === itemHref.toLowerCase()
                : currentPath.toLowerCase() === itemHref.toLowerCase();
            const activeClasses = isActive
                ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200 border border-slate-300 dark:border-slate-600 dark:border-blue-500/50 shadow-sm font-black'
                : 'text-slate-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-slate-700/80 font-bold border border-transparent hover:border-slate-300 dark:hover:border-gray-700';

            let badgeHtml = '';
            if (item.badge && stats[item.badge] > 0) {
                badgeHtml = `<span class="ml-auto bg-slate-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full border border-slate-300 dark:border-slate-600 animate-pulse">${stats[item.badge]}</span>`;
            }

            return `
                <a href="${itemHref}" data-admin-route="${window.__HALM_ADMIN_REACT__ ? 'true' : 'false'}" class="flex items-center space-x-3 px-3.5 py-2.5 rounded-xl transition-all duration-150 text-sm ${activeClasses}">
                    <div class="admin-nav-icon w-6 text-center text-base"><i class="fa-solid ${item.icon}"></i></div>
                    <span class="truncate">${item.text}</span>
                    ${badgeHtml}
                </a>
            `;
        }).join('');

        sidebarContainer.innerHTML = `
            <aside id="admin-sidebar" class="w-full md:w-64 lg:w-72 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col justify-between shrink-0 h-full z-20">
                <div>
                    <!-- Logo Header -->
                    <div class="h-16 px-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-white dark:bg-slate-800">
                        <a href="${window.__HALM_ADMIN_REACT__ ? reactRoutes.TongQuan : 'TongQuan.html'}" class="admin-brand flex items-center space-x-3 group">
                            <div class="w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center font-black text-xl border border-slate-300 dark:border-slate-600 dark:border-white shadow-[2px_2px_0px_#111827] group-hover:rotate-6 transition-transform">
                                🥔
                            </div>
                            <div>
                                <div class="flex items-center space-x-1.5">
                                    <span class="font-black text-base tracking-tight text-slate-800 dark:text-white">HALMBOOK</span>
                                    <span class="bg-blue-600 text-white text-[9px] font-extrabold px-1.5 py-0.2 rounded border border-slate-300 dark:border-slate-600">PRO</span>
                                </div>
                                <p class="text-[10px] tracking-wider text-blue-700 dark:text-blue-400 font-extrabold uppercase">HỆ THỐNG QUẢN TRỊ</p>
                            </div>
                        </a>
                    </div>

                    <!-- Navigation Links -->
                    <nav class="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-175px)]">
                        <div class="text-[11px] font-extrabold text-slate-400 uppercase px-3 py-1.5 tracking-wider">Danh mục quản lý</div>
                        ${menuHtml}
                    </nav>
                </div>

                <!-- Bottom system status -->
                <div class="p-3 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-950/40 space-y-2">
                    <div class="flex items-center justify-between px-2 py-1 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                        <div class="flex items-center space-x-1.5">
                            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse border border-slate-300 dark:border-slate-600"></span>
                            <span>Hệ thống online</span>
                        </div>
                        <span class="font-mono">v2.5.0</span>
                    </div>
                </div>
            </aside>
        `;
    }

    if (headerContainer) {
        const pageTitle = headerContainer.getAttribute('data-title') || 'Bảng Quản Trị Hệ Thống';
        const pageSubtitle = headerContainer.getAttribute('data-subtitle') || 'Quản lý toàn diện dữ liệu HALMBOOK';

        headerContainer.innerHTML = `
            <header class="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 md:px-6 flex items-center justify-between shrink-0 z-10 gap-3">
                <!-- Page Title -->
                <div class="flex items-center space-x-3 min-w-0">
                    <button class="hidden md:inline-flex p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none transition shadow-sm" onclick="toggleAdminSidebar()" aria-label="Ẩn hoặc hiện thanh điều hướng" title="Ẩn/hiện thanh điều hướng">
                        <i class="fa-solid fa-bars-staggered"></i>
                    </button>
                    <button class="md:hidden inline-flex p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none transition shadow-sm" onclick="toggleMobileSidebar()" aria-label="Menu" title="Menu">
                        <i class="fa-solid fa-bars"></i>
                    </button>
                    <div class="min-w-0">
                        <h2 class="font-black text-base md:text-lg text-slate-800 dark:text-white leading-tight flex items-center gap-2 truncate">
                            <span>${pageTitle}</span>
                        </h2>
                        <p class="text-[11px] text-slate-500 dark:text-slate-400 font-medium hidden sm:block truncate">${pageSubtitle}</p>
                    </div>
                </div>

                <!-- Right Action Bar -->
                <div class="flex items-center space-x-2.5">
                    <!-- Hotline Pill -->
                    <div class="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/60 text-xs font-extrabold text-slate-700 dark:text-gray-200">
                        <i class="fa-solid fa-phone text-blue-600"></i>
                        <span>0397409029</span>
                    </div>

                    <!-- Admin Profile Dropdown Container -->
                    <div class="relative">
                        <button onclick="toggleAdminDropdown()" id="adminDropdownBtn" class="flex items-center space-x-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-700 py-1.5 px-3 rounded-xl shadow-sm hover:bg-slate-50 dark:hover:bg-slate-600 transition cursor-pointer">
                            <span class="w-2.5 h-2.5 bg-emerald-500 rounded-full border border-white dark:border-slate-600"></span>
                            <div class="text-left hidden md:block">
                                <div class="text-xs font-black text-slate-800 dark:text-white leading-none">Admin Tổng</div>
                                <div class="text-[9px] text-blue-600 dark:text-blue-400 font-extrabold mt-0.5">SUPER ADMIN</div>
                            </div>
                            <i class="fa-solid fa-chevron-down text-[10px] text-slate-600 dark:text-gray-300"></i>
                        </button>

                        <!-- Dropdown Menu -->
                        <div id="adminDropdownMenu" class="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl py-2 hidden transition-all z-50">
                            <div class="px-4 py-2 border-b border-slate-200 dark:border-slate-700">
                                <p class="text-sm font-bold text-slate-800 dark:text-white">Admin</p>
                                <p class="text-[10px] font-bold text-slate-500 mt-0.5">Quản trị viên</p>
                            </div>
                            <div class="py-1">
                                <a href="#" onclick="openAdminModal('recoverPasswordModal')" class="flex items-center space-x-3 px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition">
                                    <i class="fa-solid fa-key w-4 text-center text-blue-600"></i>
                                    <span>Lấy lại mật khẩu</span>
                                </a>
                                <div class="border-t border-slate-200 dark:border-slate-700 my-1"></div>
                                <a href="#" onclick="openAdminModal('logoutModal')" class="flex items-center space-x-3 px-4 py-2 text-sm font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-700 transition">
                                    <i class="fa-solid fa-right-from-bracket w-4 text-center"></i>
                                    <span>Đăng xuất</span>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </header>
        `;
    }
}


function injectAdminSharedStyles() {
    let style = document.getElementById('admin-shared-styles');
    if (!style) {
        style = document.createElement('style');
        style.id = 'admin-shared-styles';
        document.head.appendChild(style);
    }
    style.textContent = `
        :root { 
            --admin-font: 'Roboto', Arial, sans-serif; 
            --admin-primary: #2563eb; 
            --admin-border: #e2e8f0; 
            --admin-border-dark: rgba(255, 255, 255, 0.08); 
        }
        body, button, input, select, textarea { font-family: var(--admin-font) !important; }
        
        .admin-page-root { 
            position: relative; 
            display: flex; 
            width: 100%; 
            height: 100vh; 
            min-height: 100vh; 
            overflow: hidden; 
            background: #f8fafc; 
            opacity: 0;
            transition: opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .admin-page-root.admin-ready {
            opacity: 1 !important;
        }
        .admin-page-root > main, .admin-page-root > #admin-sidebar-container { 
            position: relative; 
            z-index: 1; 
            min-width: 0; 
            min-height: 0; 
        }
        .admin-page-root main { background: #f8fafc !important; color: #0f172a; }
        .admin-book-content {
            scrollbar-width: none;
            -ms-overflow-style: none;
        }
        .admin-book-content::-webkit-scrollbar {
            display: none;
        }

        .admin-page-root select {
            appearance: none;
            -webkit-appearance: none;
            background-image: linear-gradient(45deg, transparent 50%, #64748b 50%), linear-gradient(135deg, #64748b 50%, transparent 50%);
            background-position: calc(100% - 15px) 50%, calc(100% - 10px) 50%;
            background-size: 5px 5px, 5px 5px;
            background-repeat: no-repeat;
            padding-right: 2.25rem !important;
            cursor: pointer;
        }
        .admin-page-root select:focus {
            outline: none;
            border-color: #2563eb;
            box-shadow: 0 0 0 3px rgba(37, 99, 235, .12);
        }
        #adminDropdownBtn {
            min-height: 2.5rem;
        }
        #adminDropdownMenu {
            transform-origin: top right;
            animation: adminDropdownIn .16s ease-out;
        }
        #adminDropdownMenu a {
            margin: 0 .35rem;
            border-radius: .65rem;
        }
        @keyframes adminDropdownIn {
            from { opacity: 0; transform: translateY(-4px) scale(.98); }
            to { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* Giữ cấu trúc trong suốt để lộ bầu trời sao */
        .dark .admin-page-root,
        .dark .admin-page-root > main,
        .dark .admin-page-root main,
        .dark #admin-sidebar-container { 
            background: transparent !important; 
        }

        /* Sidebar & Header Glassmorphism */
        .dark #admin-sidebar { 
            background: rgba(11, 15, 23, .84) !important; 
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border-right: 1px solid rgba(255, 255, 255, .08) !important;
        }
        .dark header,
        .dark #admin-header-container header {
            background: rgba(11, 15, 23, .82) !important;
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border-bottom: 1px solid rgba(255, 255, 255, .08) !important;
        }

        /* Glassmorphism Cards, Panels, Modals */
        .dark .admin-page-root .bg-white,
        .dark .admin-page-root .bg-white\\/95,
        .dark .admin-page-root .dark\\:bg-slate-800,
        .dark .admin-page-root .dark\\:bg-slate-700,
        .dark .admin-page-root .dark\\:bg-gray-900,
        .dark .admin-page-root .bg-slate-50,
        .dark .admin-page-root .bg-gray-50,
        .dark .admin-page-root .dark\\:bg-slate-800 { 
            background-color: rgba(15, 21, 32, .78) !important; 
            backdrop-filter: blur(14px);
            -webkit-backdrop-filter: blur(14px);
            border: 1px solid rgba(255, 255, 255, .08) !important;
            box-shadow: 0 6px 24px rgba(0, 0, 0, .28) !important;
        }

        /* Sub-containers & Pills */
        .dark .admin-page-root .bg-slate-100,
        .dark .admin-page-root .bg-gray-100,
        .dark .admin-page-root .dark\\:bg-slate-900,
        .dark .admin-page-root .dark\\:bg-slate-700\\/60,
        .dark .admin-page-root .dark\\:bg-slate-700\\/40 { 
            background-color: rgba(22, 30, 46, .65) !important; 
            border-color: rgba(255, 255, 255, .08) !important;
        }

        /* =========================================================================
           HỆ THỐNG TYPOGRAPHY CHỐNG HẮT SÁNG (ANTI-GLARE WCAG AAA)
           Thay thế màu #FFFFFF chói gắt bằng Off-white ấm áp (#EDE9DF),
           phân tầng màu sắc dịu mắt, dễ nhận diện khi làm việc ban đêm.
           ========================================================================= */
        /* 1. Tiêu đề chính, Headings, Text nổi bật */
        .dark .admin-page-root h1,
        .dark .admin-page-root h2,
        .dark .admin-page-root h3,
        .dark .admin-page-root h4,
        .dark .admin-page-root h5,
        .dark .admin-page-root h6,
        .dark .admin-page-root .text-slate-800,
        .dark .admin-page-root .text-slate-900,
        .dark .admin-page-root .dark\\:text-white,
        .dark .admin-page-root .dark\\:text-slate-100,
        .dark .admin-page-root .text-white:not(button):not(.bg-blue-600 *):not(.bg-emerald-600 *):not(.bg-rose-600 *):not(.active-filter) { 
            color: #EDE9DF !important; 
            letter-spacing: .01em;
        }

        /* 2. Nội dung chính, Dữ liệu bảng (Body Text) */
        .dark .admin-page-root td,
        .dark .admin-page-root .text-slate-700,
        .dark .admin-page-root .dark\\:text-slate-200,
        .dark .admin-page-root .dark\\:text-slate-300,
        .dark .admin-page-root .text-gray-700,
        .dark .admin-page-root .dark\\:text-gray-200,
        .dark .admin-page-root .dark\\:text-gray-300 { 
            color: #CBD5E1 !important; 
        }

        /* 3. Nhãn phụ, Chú thích, Ngày giờ (Secondary/Muted Text) - Nâng sáng dịu, rõ nét */
        .dark .admin-page-root .text-slate-500,
        .dark .admin-page-root .text-slate-400,
        .dark .admin-page-root .dark\\:text-slate-400,
        .dark .admin-page-root .dark\\:text-slate-500,
        .dark .admin-page-root .text-gray-500,
        .dark .admin-page-root .text-gray-400,
        .dark .admin-page-root .text-muted { 
            color: #94A3B8 !important; 
        }

        /* 4. Link và Accent: Màu Sky Blue 400 dịu mát (#60A5FA) */
        .dark .admin-page-root .text-blue-600,
        .dark .admin-page-root .dark\\:text-blue-400,
        .dark .admin-nav-icon { 
            color: #60A5FA !important; 
        }
        .dark #admin-sidebar a:hover .admin-nav-icon { 
            color: #93C5FD !important; 
        }
        .dark #admin-sidebar a.bg-blue-600 {
            background-color: #2563EB !important;
            color: #FFFFFF !important;
        }
        .dark #admin-sidebar a.bg-blue-600 .admin-nav-icon {
            color: #FFFFFF !important;
        }

        /* 5. Inputs, Selects, Textareas */
        .dark .admin-page-root input,
        .dark .admin-page-root select,
        .dark .admin-page-root textarea { 
            background-color: rgba(20, 26, 38, .85) !important; 
            color: #EDE9DF !important; 
            border: 1px solid rgba(255, 255, 255, .12) !important; 
        }
        .dark .admin-page-root input::placeholder,
        .dark .admin-page-root textarea::placeholder { 
            color: #64748B !important; 
        }
        .dark .admin-page-root input:focus,
        .dark .admin-page-root select:focus,
        .dark .admin-page-root textarea:focus { 
            border-color: #60A5FA !important; 
            box-shadow: 0 0 0 2px rgba(96, 165, 250, .25) !important; 
            outline: none !important; 
        }

        /* 6. Bảng dữ liệu (Tables) */
        .dark .admin-page-root th,
        .dark .admin-page-root thead { 
            background-color: rgba(20, 26, 40, .9) !important; 
            color: #EDE9DF !important; 
            border-color: rgba(255, 255, 255, .08) !important; 
        }
        .dark .admin-page-root tbody tr { 
            border-color: rgba(255, 255, 255, .06) !important; 
        }
        .dark .admin-page-root tbody tr:hover { 
            background-color: rgba(255, 255, 255, .04) !important; 
        }

        /* 7. Dropdown Menu & Modals */
        .dark #adminDropdownMenu,
        .dark #profileModal > div,
        .dark #recoverPasswordModal > div,
        .dark #logoutModal > div { 
            background: rgba(15, 21, 32, .95) !important; 
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, .1) !important; 
            box-shadow: 0 20px 40px rgba(0, 0, 0, .6) !important; 
        }
        .dark #adminDropdownMenu p,
        .dark #adminDropdownMenu span,
        .dark #adminDropdownMenu a { 
            color: #CBD5E1 !important; 
        }
        .dark #adminDropdownMenu a:hover { 
            background-color: rgba(255, 255, 255, .08) !important; 
            color: #EDE9DF !important; 
        }

        /* 8. Viền và dải phân cách */
        .dark .border-slate-200,
        .dark .border-slate-300,
        .dark .border-slate-600,
        .dark .border-slate-700,
        .dark .border-gray-200,
        .dark .border-gray-700,
        .dark table { 
            border-color: rgba(255, 255, 255, .08) !important; 
        }
        .dark .divide-slate-200 > *,
        .dark .divide-slate-700 > *,
        .dark .divide-gray-100 > *,
        .dark tbody.divide-y-2 > tr, 
        .dark tbody.divide-y > tr,
        .dark [class*="divide-y"] > * + * { 
            border-color: rgba(255, 255, 255, .08) !important; 
        }

        /* 9. Trạng thái Badges dịu mắt (Soft status indicators) */
        .dark .bg-emerald-50,
        .dark .bg-emerald-900\\/30,
        .dark .bg-emerald-950\\/40 { 
            background-color: rgba(16, 185, 129, .15) !important; 
            border-color: rgba(52, 211, 153, .3) !important; 
        }
        .dark .text-emerald-600,
        .dark .text-emerald-400 { 
            color: #34D399 !important; 
        }

        .dark .bg-amber-50,
        .dark .bg-amber-100,
        .dark .bg-amber-900\\/50,
        .dark .bg-amber-950\\/40 { 
            background-color: rgba(245, 158, 11, .15) !important; 
            border-color: rgba(251, 191, 36, .3) !important; 
        }
        .dark .text-amber-500,
        .dark .text-amber-600,
        .dark .text-amber-800,
        .dark .text-amber-300 { 
            color: #FBBF24 !important; 
        }

        .dark .bg-rose-50,
        .dark .bg-rose-900\\/30,
        .dark .bg-rose-950\\/40 { 
            background-color: rgba(244, 63, 94, .15) !important; 
            border-color: rgba(251, 113, 133, .3) !important; 
        }
        .dark .text-rose-500,
        .dark .text-rose-600,
        .dark .text-rose-400 { 
            color: #FB7185 !important; 
        }

        /* Focus Ring */
        button:focus-visible, a:focus-visible, input:focus-visible, select:focus-visible, textarea:focus-visible { 
            outline: 2px solid var(--admin-primary); 
            outline-offset: 2px; 
        }

        /* Sidebar Responsive & Collapsed States */
        #admin-sidebar-container {
            height: 100%;
            flex-shrink: 0;
            display: flex;
            width: 18rem;
            transition: width .28s cubic-bezier(.4, 0, .2, 1);
        }
        #admin-sidebar {
            width: 18rem;
            min-width: 18rem;
            overflow: hidden;
            transition: width .28s cubic-bezier(.4, 0, .2, 1), min-width .28s cubic-bezier(.4, 0, .2, 1), box-shadow .28s ease;
        }
        .admin-sidebar-collapsed #admin-sidebar-container { width: 4.75rem !important; }
        .admin-sidebar-collapsed #admin-sidebar {
            width: 4.75rem !important;
            min-width: 4.75rem !important;
            max-width: 4.75rem !important;
            flex: 0 0 4.75rem !important;
        }
        #admin-sidebar .admin-brand > div:last-child,
        #admin-sidebar nav > div,
        #admin-sidebar nav a span {
            opacity: 1;
            transform: translateX(0);
            transition: opacity .16s ease, transform .22s ease;
        }
        .admin-sidebar-collapsed #admin-sidebar .admin-brand > div:last-child, 
        .admin-sidebar-collapsed #admin-sidebar nav > div, 
        .admin-sidebar-collapsed #admin-sidebar nav a span {
            opacity: 0;
            transform: translateX(-8px);
            pointer-events: none;
        }
        .admin-sidebar-collapsed #admin-sidebar nav a { justify-content: center; padding-left: .75rem; padding-right: .75rem; }
        .admin-sidebar-collapsed #admin-sidebar .admin-nav-icon { width: 1.5rem; }
        .admin-sidebar-collapsed #admin-sidebar .ml-auto { display: none; }
        @media (max-width: 767px) { 
            #admin-sidebar { position: fixed; inset: 0 auto 0 0; width: min(18rem, 85vw) !important; transform: translateX(-100%); z-index: 50; } 
            #admin-sidebar.mobile-open { transform: translateX(0); } 
            .admin-sidebar-collapsed #admin-sidebar { transform: translateX(-100%); } 
        }
    `;
    if (!document.querySelector('link[data-admin-roboto]')) { 
        const font = document.createElement('link'); 
        font.rel = 'stylesheet'; 
        font.dataset.adminRoboto = 'true'; 
        font.href = 'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700;900&display=swap'; 
        document.head.appendChild(font); 
    }
}

function toggleAdminSidebar() {
    const collapsed = !document.documentElement.classList.contains('admin-sidebar-collapsed');
    document.documentElement.classList.toggle('admin-sidebar-collapsed', collapsed);
    localStorage.setItem('halm_admin_sidebar_collapsed', String(collapsed));
    const button = document.querySelector('[aria-label="Ẩn hoặc hiện thanh điều hướng"]');
    if (button) {
        button.setAttribute('aria-pressed', String(collapsed));
        button.title = collapsed ? 'Mở rộng thanh điều hướng' : 'Thu nhỏ thanh điều hướng';
    }
}

function toggleMobileSidebar() {
    const sidebar = document.getElementById('admin-sidebar');
    if (sidebar) sidebar.classList.toggle('mobile-open');
}

function toggleAdminDropdown() {
    const menu = document.getElementById('adminDropdownMenu');
    if (menu) {
        menu.classList.toggle('hidden');
    }
}

function closeAdminDropdown() {
    const menu = document.getElementById('adminDropdownMenu');
    if (menu) menu.classList.add('hidden');
}

// Click outside to close admin dropdown
document.addEventListener('click', function(e) {
    const btn = document.getElementById('adminDropdownBtn');
    const menu = document.getElementById('adminDropdownMenu');
    if (menu && btn && !btn.contains(e.target) && !menu.contains(e.target)) {
        menu.classList.add('hidden');
    }
});

// Client-side SPA navigation interceptor for Admin pages
if (!window.__HALM_ADMIN_CLICK_INTERCEPTOR__) {
    window.__HALM_ADMIN_CLICK_INTERCEPTOR__ = true;
    document.addEventListener('click', function(e) {
        const link = e.target.closest('a[data-admin-route="true"], a.admin-brand, a[href^="/admin"]');
        if (link && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey && !link.target) {
            const href = link.getAttribute('href');
            if (href && (href.startsWith('/admin') || href === '/admin')) {
                e.preventDefault();
                if (href.toLowerCase() === window.location.pathname.toLowerCase()) {
                    return;
                }
                if (typeof window.__HALM_ADMIN_NAVIGATE__ === 'function') {
                    window.__HALM_ADMIN_NAVIGATE__(href);
                } else {
                    window.location.href = href;
                }
            }
        }
    });
}

function initAdminModals() {
    if (document.getElementById('shared-admin-modals')) return;

    const modalContainer = document.createElement('div');
    modalContainer.id = 'shared-admin-modals';
    modalContainer.innerHTML = `
        <!-- Profile Modal -->
        <div id="profileModal" class="fixed inset-0 bg-slate-800/60 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4">
            <div class="bg-white dark:bg-slate-700 rounded-2xl max-w-md w-full p-6 border border-slate-300 dark:border-slate-600 dark:border-slate-600 shadow-2xl space-y-4">
                <div class="flex justify-between items-center border-b-2 border-slate-300 dark:border-slate-600 dark:border-slate-600 pb-3">
                    <h3 class="font-black text-base text-slate-800 dark:text-white flex items-center space-x-2">
                        <i class="fa-solid fa-user-shield text-blue-600"></i>
                        <span>Hồ Sơ Quản Trị Viên</span>
                    </h3>
                    <button onclick="closeAdminModal('profileModal')" class="text-slate-400 hover:text-slate-800 dark:hover:text-white font-bold"><i class="fa-solid fa-xmark text-lg"></i></button>
                </div>
                <div class="space-y-3">
                    <div class="flex items-center space-x-4 p-3 bg-blue-50 dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-600 dark:border-slate-600">
                    <div class="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center text-lg border border-blue-700">
                        <i class="fa-solid fa-user-shield"></i>
                    </div>
                        <div>
                            <h4 class="font-black text-sm text-slate-800 dark:text-white">Admin Tổng Hệ Thống</h4>
                            <p class="text-xs text-blue-600 font-bold">SUPER ADMINISTRATOR</p>
                            <span class="inline-block mt-1 text-[10px] bg-slate-50 text-slate-700 font-extrabold px-2 py-0.5 rounded border border-slate-300 dark:border-slate-600">Đang hoạt động</span>
                        </div>
                    </div>
                    <div>
                        <label class="block text-xs font-extrabold text-slate-600 dark:text-gray-300 uppercase mb-1">Họ và tên</label>
                        <input type="text" id="adminNameInput" value="Admin Tổng Hệ Thống" class="w-full px-3.5 py-2 bg-white dark:bg-gray-700 border border-slate-300 dark:border-slate-600 dark:border-gray-600 rounded-xl text-xs font-bold dark:text-white">
                    </div>
                    <div>
                        <label class="block text-xs font-extrabold text-slate-600 dark:text-gray-300 uppercase mb-1">Email quản trị</label>
                        <input type="email" id="adminEmailInput" value="admin@halmbook.vn" class="w-full px-3.5 py-2 bg-white dark:bg-gray-700 border border-slate-300 dark:border-slate-600 dark:border-gray-600 rounded-xl text-xs font-bold dark:text-white">
                    </div>
                    <div>
                        <label class="block text-xs font-extrabold text-slate-600 dark:text-gray-300 uppercase mb-1">Hotline / Số điện thoại</label>
                        <input type="text" id="adminPhoneInput" value="0397409029" class="w-full px-3.5 py-2 bg-white dark:bg-gray-700 border border-slate-300 dark:border-slate-600 dark:border-gray-600 rounded-xl text-xs font-bold dark:text-white">
                    </div>
                </div>
                <div class="flex justify-end space-x-2 pt-3 border-t-2 border-slate-300 dark:border-slate-600 dark:border-slate-600">
                    <button onclick="closeAdminModal('profileModal')" class="px-4 py-2 bg-slate-50 dark:bg-gray-700 text-slate-700 dark:text-gray-200 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-600 dark:border-gray-600">Đóng</button>
                    <button onclick="saveAdminProfile()" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-600">Lưu Thông Tin</button>
                </div>
            </div>
        </div>

        <!-- Change Password Modal -->
        <div id="changePasswordModal" class="fixed inset-0 bg-slate-800/60 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4">
            <div class="bg-white dark:bg-slate-700 rounded-2xl max-w-md w-full p-6 border border-slate-300 dark:border-slate-600 dark:border-slate-600 shadow-2xl space-y-4">
                <div class="flex justify-between items-center border-b-2 border-slate-300 dark:border-slate-600 dark:border-slate-600 pb-3">
                    <h3 class="font-black text-base text-slate-800 dark:text-white flex items-center space-x-2">
                        <i class="fa-solid fa-key text-slate-500"></i>
                        <span>Đổi Mật Khẩu Admin</span>
                    </h3>
                    <button onclick="closeAdminModal('changePasswordModal')" class="text-slate-400 hover:text-slate-800 dark:hover:text-white font-bold"><i class="fa-solid fa-xmark text-lg"></i></button>
                </div>
                <div class="space-y-3">
                    <div>
                        <label class="block text-xs font-extrabold text-slate-600 dark:text-gray-300 uppercase mb-1">Mật khẩu hiện tại</label>
                        <input type="password" id="oldPasswordInput" placeholder="••••••••" class="w-full px-3.5 py-2 bg-white dark:bg-gray-700 border border-slate-300 dark:border-slate-600 dark:border-gray-600 rounded-xl text-xs font-bold dark:text-white">
                    </div>
                    <div>
                        <label class="block text-xs font-extrabold text-slate-600 dark:text-gray-300 uppercase mb-1">Mật khẩu mới</label>
                        <input type="password" id="newPasswordInput" placeholder="Tối thiểu 6 ký tự..." class="w-full px-3.5 py-2 bg-white dark:bg-gray-700 border border-slate-300 dark:border-slate-600 dark:border-gray-600 rounded-xl text-xs font-bold dark:text-white">
                    </div>
                    <div>
                        <label class="block text-xs font-extrabold text-slate-600 dark:text-gray-300 uppercase mb-1">Nhập lại mật khẩu mới</label>
                        <input type="password" id="confirmPasswordInput" placeholder="Xác nhận mật khẩu..." class="w-full px-3.5 py-2 bg-white dark:bg-gray-700 border border-slate-300 dark:border-slate-600 dark:border-gray-600 rounded-xl text-xs font-bold dark:text-white">
                    </div>
                </div>
                <div class="flex justify-end space-x-2 pt-3 border-t-2 border-slate-300 dark:border-slate-600 dark:border-slate-600">
                    <button onclick="closeAdminModal('changePasswordModal')" class="px-4 py-2 bg-slate-50 dark:bg-gray-700 text-slate-700 dark:text-gray-200 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-600 dark:border-gray-600">Hủy</button>
                    <button onclick="submitChangePassword()" class="px-4 py-2 bg-slate-500 hover:bg-gray-600 text-white rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-600">Cập Nhật Mật Khẩu</button>
                </div>
            </div>
        </div>

        <!-- Recover Password Modal -->
        <div id="recoverPasswordModal" class="fixed inset-0 bg-slate-800/60 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4">
            <div class="bg-white dark:bg-slate-700 rounded-2xl max-w-md w-full p-6 border border-slate-300 dark:border-slate-600 dark:border-slate-600 shadow-2xl space-y-4">
                <div class="flex justify-between items-center border-b-2 border-slate-300 dark:border-slate-600 dark:border-slate-600 pb-3">
                    <h3 class="font-black text-base text-slate-800 dark:text-white flex items-center space-x-2">
                        <i class="fa-solid fa-lock-open text-blue-600"></i>
                        <span>Khôi Phục Mật Khẩu Quản Trị</span>
                    </h3>
                    <button onclick="closeAdminModal('recoverPasswordModal')" class="text-slate-400 hover:text-slate-800 dark:hover:text-white font-bold"><i class="fa-solid fa-xmark text-lg"></i></button>
                </div>
                <div class="space-y-3">
                    <p class="text-xs text-slate-500 dark:text-slate-400">Nhập email đăng ký tài khoản Admin để nhận liên kết xác thực đặt lại mật khẩu hoặc mã OTP.</p>
                    <div>
                        <label class="block text-xs font-extrabold text-slate-600 dark:text-gray-300 uppercase mb-1">Email đăng ký</label>
                        <input type="email" id="recoverEmailInput" value="admin@halmbook.vn" class="w-full px-3.5 py-2 bg-white dark:bg-gray-700 border border-slate-300 dark:border-slate-600 dark:border-gray-600 rounded-xl text-xs font-bold dark:text-white">
                    </div>
                </div>
                <div class="flex justify-end space-x-2 pt-3 border-t-2 border-slate-300 dark:border-slate-600 dark:border-slate-600">
                    <button onclick="closeAdminModal('recoverPasswordModal')" class="px-4 py-2 bg-slate-50 dark:bg-gray-700 text-slate-700 dark:text-gray-200 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-600 dark:border-gray-600">Hủy</button>
                    <button onclick="submitRecoverPassword()" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-600">Gửi Mã Xác Nhận</button>
                </div>
            </div>
        </div>

        <!-- Logout Modal -->
        <div id="logoutModal" class="fixed inset-0 bg-slate-800/60 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4">
            <div class="bg-white dark:bg-slate-700 rounded-2xl max-w-sm w-full p-6 border border-slate-300 dark:border-slate-600 dark:border-slate-600 shadow-2xl space-y-4 text-center">
                <div class="w-14 h-14 bg-slate-50 text-slate-500 rounded-full border border-slate-300 dark:border-slate-600 flex items-center justify-center mx-auto text-2xl">
                    <i class="fa-solid fa-right-from-bracket"></i>
                </div>
                <div>
                    <h3 class="font-black text-base text-slate-800 dark:text-white">Xác Nhận Đăng Xuất?</h3>
                    <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Bạn sẽ cần đăng nhập lại để tiếp tục quản trị hệ thống HALMBOOK.</p>
                </div>
                <div class="flex justify-center space-x-2 pt-2">
                    <button onclick="closeAdminModal('logoutModal')" class="px-4 py-2 bg-slate-50 dark:bg-gray-700 text-slate-700 dark:text-gray-200 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-600 dark:border-gray-600">Hủy Bỏ</button>
                    <button onclick="executeLogout()" class="px-5 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-600">Đăng Xuất</button>
                </div>
            </div>
        </div>

        <!-- Shared AdminUI Confirm Modal -->
        <div id="adminConfirmModal" class="fixed inset-0 bg-slate-800/60 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4">
            <div class="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 border border-slate-300 dark:border-slate-700 shadow-2xl space-y-4">
                <div class="flex items-start space-x-3">
                    <div class="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center text-lg shrink-0 border border-amber-200 dark:border-amber-800">
                        <i class="fa-solid fa-triangle-exclamation"></i>
                    </div>
                    <div class="flex-1">
                        <h3 id="adminConfirmTitle" class="font-black text-base text-slate-800 dark:text-white">Xác Nhận Thao Tác</h3>
                        <p id="adminConfirmMessage" class="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">Nội dung xác nhận...</p>
                    </div>
                </div>
                <div class="flex justify-end space-x-2 pt-3 border-t border-slate-200 dark:border-slate-700">
                    <button id="adminCancelBtn" type="button" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-gray-200 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-600 transition">Hủy Bỏ</button>
                    <button id="adminConfirmBtn" type="button" class="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm transition">Xác Nhận</button>
                </div>
            </div>
        </div>

        <!-- Shared AdminUI Prompt / Reason Modal -->
        <div id="adminPromptModal" class="fixed inset-0 bg-slate-800/60 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4">
            <div class="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 border border-slate-300 dark:border-slate-700 shadow-2xl space-y-4">
                <div class="border-b border-slate-200 dark:border-slate-700 pb-3">
                    <h3 id="adminPromptTitle" class="font-black text-base text-slate-800 dark:text-white flex items-center space-x-2">
                        <i class="fa-solid fa-pen-to-square text-blue-600"></i>
                        <span>Nhập Thông Tin</span>
                    </h3>
                    <p id="adminPromptMessage" class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Vui lòng cung cấp lý do hoặc thông tin yêu cầu.</p>
                </div>
                <div class="space-y-2">
                    <label id="adminPromptLabel" class="block text-xs font-extrabold uppercase text-slate-600 dark:text-slate-300">Lý do</label>
                    <textarea id="adminPromptInput" rows="3" class="w-full px-3.5 py-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
                    <p id="adminPromptError" class="text-[11px] font-bold text-rose-500 hidden"></p>
                </div>
                <div class="flex justify-end space-x-2 pt-3 border-t border-slate-200 dark:border-slate-700">
                    <button id="adminPromptCancelBtn" type="button" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-gray-200 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-600 transition">Hủy Bỏ</button>
                    <button id="adminPromptConfirmBtn" type="button" class="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition">Xác Nhận</button>
                </div>
            </div>
        </div>

        <!-- Shared AdminUI Export Modal (Word Print Dialog Style) -->
        <div id="adminExportModal" class="fixed inset-0 bg-slate-800/60 backdrop-blur-sm z-50 hidden flex items-center justify-center p-3 md:p-6">
            <div class="bg-white dark:bg-slate-800 rounded-2xl max-w-4xl w-full border border-slate-300 dark:border-slate-700 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
                <!-- Modal Sticky Header -->
                <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/90 flex justify-between items-center">
                    <div class="flex items-center space-x-3">
                        <div class="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-300 dark:border-emerald-800 text-lg shadow-sm">
                            <i class="fa-solid fa-file-excel"></i>
                        </div>
                        <div>
                            <h3 id="adminExportTitle" class="font-black text-base text-slate-800 dark:text-white">Cấu Hình Xuất Dữ Liệu Excel / CSV</h3>
                            <p class="text-xs text-slate-500 dark:text-slate-400">Tùy chỉnh phạm vi, lựa chọn các cột dữ liệu cần xuất và định dạng trước khi tải về</p>
                        </div>
                    </div>
                    <button id="adminExportCloseBtn" type="button" class="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition">
                        <i class="fa-solid fa-xmark text-sm"></i>
                    </button>
                </div>

                <!-- Modal Body (Scrollable) -->
                <div class="flex-1 overflow-y-auto p-5 md:p-6 space-y-5 text-xs">
                    <!-- Top 2-Column Split: Scope & File Info (Left) vs Columns (Right) -->
                    <div class="grid grid-cols-1 md:grid-cols-12 gap-5">
                        <!-- Left: File info & Scope -->
                        <div class="md:col-span-5 space-y-4">
                            <!-- Card: File Specifications -->
                            <div class="p-3.5 bg-slate-50 dark:bg-slate-700/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                                <h4 class="font-extrabold uppercase text-[11px] text-slate-600 dark:text-slate-300 tracking-wide flex items-center gap-1.5">
                                    <i class="fa-solid fa-circle-info text-blue-500"></i>
                                    <span>Thông tin tệp xuất</span>
                                </h4>
                                <div class="space-y-1.5 pt-1">
                                    <div class="flex justify-between items-center">
                                        <span class="text-slate-500 dark:text-slate-400 font-bold">Danh mục:</span>
                                        <span id="adminExportDatasetName" class="font-black text-slate-800 dark:text-white truncate max-w-[160px]">Dữ liệu</span>
                                    </div>
                                    <div class="flex justify-between items-center">
                                        <span class="text-slate-500 dark:text-slate-400 font-bold">Định dạng:</span>
                                        <span class="font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 text-[11px]">Excel / CSV (UTF-8 BOM)</span>
                                    </div>
                                    <div class="flex justify-between items-start">
                                        <span class="text-slate-500 dark:text-slate-400 font-bold shrink-0">Tên file:</span>
                                        <span id="adminExportFilename" class="font-mono font-bold text-slate-700 dark:text-slate-300 text-right truncate max-w-[170px] text-[11px]">export.csv</span>
                                    </div>
                                </div>
                            </div>

                            <!-- Card: Scope Selection -->
                            <div class="space-y-2">
                                <label class="block text-[11px] font-extrabold uppercase text-slate-600 dark:text-slate-300 tracking-wide flex items-center gap-1.5">
                                    <i class="fa-solid fa-filter text-indigo-500"></i>
                                    <span>Phạm vi dữ liệu xuất</span>
                                </label>
                                <div class="space-y-2">
                                    <label class="flex items-start space-x-3 p-3 bg-white dark:bg-slate-700/60 border-2 border-slate-200 dark:border-slate-600 rounded-xl cursor-pointer hover:border-emerald-500 transition has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50/20 dark:has-[:checked]:bg-emerald-950/20">
                                        <input type="radio" name="adminExportScope" id="exportScopeFiltered" value="filtered" checked class="mt-0.5 text-emerald-600 focus:ring-emerald-500">
                                        <div class="flex-1">
                                            <div class="flex justify-between items-center">
                                                <span class="font-black text-slate-800 dark:text-white">Theo bộ lọc hiện tại</span>
                                                <span id="adminExportFilteredCount" class="font-mono font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded text-[11px]">0 bản ghi</span>
                                            </div>
                                            <p id="adminExportFilterDesc" class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">Chỉ xuất các bản ghi thỏa mãn điều kiện tìm kiếm và lọc đang chọn.</p>
                                        </div>
                                    </label>

                                    <label class="flex items-start space-x-3 p-3 bg-white dark:bg-slate-700/60 border-2 border-slate-200 dark:border-slate-600 rounded-xl cursor-pointer hover:border-emerald-500 transition has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50/20 dark:has-[:checked]:bg-emerald-950/20">
                                        <input type="radio" name="adminExportScope" id="exportScopeAll" value="all" class="mt-0.5 text-emerald-600 focus:ring-emerald-500">
                                        <div class="flex-1">
                                            <div class="flex justify-between items-center">
                                                <span class="font-black text-slate-800 dark:text-white">Toàn bộ dữ liệu hệ thống</span>
                                                <span id="adminExportTotalCount" class="font-mono font-black text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-600 px-2 py-0.5 rounded text-[11px]">0 bản ghi</span>
                                            </div>
                                            <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Xuất tất cả bản ghi có trong cơ sở dữ liệu hiện tại (bỏ qua mọi bộ lọc).</p>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <!-- Right: Column Picker with categories & controls -->
                        <div class="md:col-span-7 space-y-3.5 flex flex-col">
                            <div class="flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-slate-200 dark:border-slate-700">
                                <div>
                                    <h4 class="font-extrabold uppercase text-[11px] text-slate-700 dark:text-slate-200 tracking-wide flex items-center gap-1.5">
                                        <i class="fa-solid fa-table-columns text-emerald-600"></i>
                                        <span>Chọn cột dữ liệu xuất</span>
                                    </h4>
                                    <p class="text-[11px] text-slate-500 dark:text-slate-400">Tick chọn các cột bạn muốn xuất hiện trong file Excel</p>
                                </div>
                                <div class="flex items-center space-x-1.5">
                                    <button id="adminExportSelectAllBtn" type="button" class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-gray-200 rounded-lg text-[11px] font-bold transition flex items-center gap-1" title="Chọn toàn bộ các cột">
                                        <i class="fa-solid fa-check-double text-[10px]"></i>
                                        <span>Chọn tất cả</span>
                                    </button>
                                    <button id="adminExportDeselectAllBtn" type="button" class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-gray-200 rounded-lg text-[11px] font-bold transition flex items-center gap-1" title="Bỏ chọn toàn bộ cột">
                                        <i class="fa-regular fa-square text-[10px]"></i>
                                        <span>Bỏ chọn</span>
                                    </button>
                                    <button id="adminExportResetColumnsBtn" type="button" class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-gray-200 rounded-lg text-[11px] font-bold transition flex items-center gap-1" title="Khôi phục các trường chính mặc định">
                                        <i class="fa-solid fa-rotate-left text-[10px]"></i>
                                        <span>Mặc định</span>
                                    </button>
                                </div>
                            </div>

                            <!-- Column containers -->
                            <div class="space-y-3 flex-1 overflow-y-auto max-h-[320px] pr-1">
                                <!-- Primary Fields -->
                                <div class="space-y-1.5">
                                    <div class="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
                                        <span class="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                                            <i class="fa-solid fa-star text-[10px]"></i>
                                            <span>Trường thông tin chính (Mặc định chọn)</span>
                                        </span>
                                    </div>
                                    <div id="adminExportPrimaryColumnsContainer" class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        <!-- Rendered dynamically -->
                                    </div>
                                </div>

                                <!-- Secondary Fields -->
                                <div id="adminExportSecondaryWrapper" class="space-y-1.5 pt-2">
                                    <div class="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
                                        <span class="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                                            <i class="fa-solid fa-layer-group text-[10px]"></i>
                                            <span>Trường thông tin chi tiết / Bổ sung</span>
                                        </span>
                                    </div>
                                    <div id="adminExportSecondaryColumnsContainer" class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        <!-- Rendered dynamically -->
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Bottom Summary Panel (Word-Print confirmation strip) -->
                    <div class="p-3.5 bg-slate-50 dark:bg-slate-700/40 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div class="flex flex-wrap items-center gap-x-4 gap-y-1">
                            <div>
                                <span class="text-slate-500 dark:text-slate-400 font-bold">Tóm tắt cấu hình:</span>
                            </div>
                            <div class="flex items-center gap-1">
                                <span class="text-slate-500 dark:text-slate-400">Phạm vi:</span>
                                <span id="adminSummaryScope" class="font-extrabold text-slate-800 dark:text-white">Bộ lọc hiện tại</span>
                                <span class="text-slate-400">(<b id="adminSummaryRecords" class="text-emerald-600 dark:text-emerald-400">0</b> bản ghi)</span>
                            </div>
                            <div class="flex items-center gap-1">
                                <span class="text-slate-500 dark:text-slate-400">Số cột xuất:</span>
                                <span id="adminSummaryCols" class="font-extrabold text-slate-800 dark:text-white">0</span>
                                <span id="adminExportColumnSummaryBadge" class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300">Đã chọn: 0/0 cột</span>
                            </div>
                        </div>
                        <div id="adminExportColWarning" class="text-rose-500 font-black text-xs hidden flex items-center gap-1.5">
                            <i class="fa-solid fa-triangle-exclamation"></i>
                            <span>Vui lòng chọn ít nhất 1 cột để xuất file!</span>
                        </div>
                    </div>
                </div>

                <!-- Sticky Footer -->
                <div class="px-6 py-3.5 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/90 flex flex-wrap items-center justify-between gap-3">
                    <div class="flex items-center space-x-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                        <i class="fa-solid fa-shield-check text-emerald-500"></i>
                        <span>Chuẩn định dạng UTF-8 BOM, hiển thị tiếng Việt chính xác trên Microsoft Excel & Sheets</span>
                    </div>
                    <div class="flex items-center space-x-2">
                        <button id="adminExportCancelBtn" type="button" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-gray-200 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-600 transition">Hủy Bỏ</button>
                        <button id="adminExportConfirmBtn" type="button" class="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-sm transition flex items-center space-x-2">
                            <i class="fa-solid fa-file-excel"></i>
                            <span>Xác Nhận Xuất File Excel</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modalContainer);
}

function openAdminModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove('hidden');
}

function closeAdminModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.add('hidden');
}

function saveAdminProfile() {
    const name = document.getElementById('adminNameInput').value;
    window.DB.notify(`Đã lưu thông tin quản trị viên "${name}" thành công!`, 'success');
    closeAdminModal('profileModal');
}

function submitChangePassword() {
    const p1 = document.getElementById('newPasswordInput').value;
    const p2 = document.getElementById('confirmPasswordInput').value;
    if (!p1 || p1.length < 6) {
        window.DB.notify('Mật khẩu mới phải có ít nhất 6 ký tự!', 'warning');
        return;
    }
    if (p1 !== p2) {
        window.DB.notify('Mật khẩu xác nhận không trùng khớp!', 'error');
        return;
    }
    window.DB.notify('Đổi mật khẩu tài khoản Admin thành công!', 'success');
    closeAdminModal('changePasswordModal');
}

function submitRecoverPassword() {
    const email = document.getElementById('recoverEmailInput').value;
    window.DB.notify(`Đã gửi liên kết khôi phục mật khẩu tới email: ${email}`, 'success');
    closeAdminModal('recoverPasswordModal');
}

function executeLogout() {
    closeAdminModal('logoutModal');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('role');
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    window.DB.notify('Đã đăng xuất phiên làm việc của Quản trị viên.', 'info');
    setTimeout(() => {
        window.location.href = '/';
    }, 1000);
}

Object.assign(window, {
    toggleAdminSidebar,
    toggleMobileSidebar,
    toggleAdminDropdown,
    closeAdminDropdown,
    openAdminModal,
    closeAdminModal,
    saveAdminProfile,
    submitChangePassword,
    submitRecoverPassword,
    executeLogout
});

async function resetDefaultData() {
    if (window.AdminUI && typeof window.AdminUI.confirm === 'function') {
        const confirmed = await window.AdminUI.confirm({
            title: 'Khôi Phục Dữ Liệu Gốc?',
            message: 'Bạn có chắc chắn muốn đặt lại toàn bộ cơ sở dữ liệu về trạng thái mẫu ban đầu? Toàn bộ giao dịch và dữ liệu thử nghiệm hiện tại sẽ được tái lập.',
            confirmText: 'Khôi Phục Dữ Liệu',
            confirmType: 'warning'
        });
        if (confirmed) {
            window.DB.resetToDefault();
            setTimeout(() => {
                window.location.reload();
            }, 500);
        }
    } else if (confirm('Bạn có chắc muốn khôi phục toàn bộ dữ liệu mẫu ban đầu của Database?')) {
        window.DB.resetToDefault();
        setTimeout(() => {
            window.location.reload();
        }, 500);
    }
}

// Global AdminUI Utilities Module
window.AdminUI = {
    // Confirm Dialog
    confirm: function({ title = 'Xác Nhận Thao Tác', message = '', confirmText = 'Xác Nhận', cancelText = 'Hủy Bỏ', confirmType = 'danger' }) {
        return new Promise((resolve) => {
            const modal = document.getElementById('adminConfirmModal');
            if (!modal) {
                if (window.confirm(message || title)) return resolve(true);
                return resolve(false);
            }
            document.getElementById('adminConfirmTitle').innerText = title;
            document.getElementById('adminConfirmMessage').innerText = message;
            
            const btnConfirm = document.getElementById('adminConfirmBtn');
            const btnCancel = document.getElementById('adminCancelBtn');
            btnConfirm.innerText = confirmText;
            btnCancel.innerText = cancelText;

            btnConfirm.className = 'px-5 py-2 rounded-xl text-xs font-bold transition shadow-sm text-white ';
            if (confirmType === 'danger') {
                btnConfirm.className += 'bg-rose-600 hover:bg-rose-700';
            } else if (confirmType === 'warning') {
                btnConfirm.className += 'bg-amber-600 hover:bg-amber-700';
            } else {
                btnConfirm.className += 'bg-blue-600 hover:bg-blue-700';
            }

            modal.classList.remove('hidden');

            const handleConfirm = () => { cleanup(); resolve(true); };
            const handleCancel = () => { cleanup(); resolve(false); };
            const handleKey = (e) => { if (e.key === 'Escape') handleCancel(); };

            function cleanup() {
                modal.classList.add('hidden');
                btnConfirm.removeEventListener('click', handleConfirm);
                btnCancel.removeEventListener('click', handleCancel);
                document.removeEventListener('keydown', handleKey);
            }

            btnConfirm.addEventListener('click', handleConfirm);
            btnCancel.addEventListener('click', handleCancel);
            document.addEventListener('keydown', handleKey);
        });
    },

    // Prompt Dialog
    prompt: function({ title = 'Nhập Thông Tin', message = '', label = 'Lý do / Nội dung', placeholder = '', defaultValue = '', requireInput = true, confirmText = 'Xác Nhận', cancelText = 'Hủy' }) {
        return new Promise((resolve) => {
            const modal = document.getElementById('adminPromptModal');
            if (!modal) {
                const res = window.prompt(message || title, defaultValue);
                return resolve(res);
            }
            document.getElementById('adminPromptTitle').innerText = title;
            document.getElementById('adminPromptMessage').innerText = message;
            document.getElementById('adminPromptLabel').innerText = label;
            
            const input = document.getElementById('adminPromptInput');
            const error = document.getElementById('adminPromptError');
            input.value = defaultValue || '';
            input.placeholder = placeholder || '';
            error.classList.add('hidden');
            error.innerText = '';

            const btnConfirm = document.getElementById('adminPromptConfirmBtn');
            const btnCancel = document.getElementById('adminPromptCancelBtn');
            btnConfirm.innerText = confirmText;
            btnCancel.innerText = cancelText;

            modal.classList.remove('hidden');
            setTimeout(() => input.focus(), 50);

            const handleConfirm = () => {
                const val = input.value.trim();
                if (requireInput && !val) {
                    error.innerText = 'Vui lòng không để trống trường này!';
                    error.classList.remove('hidden');
                    input.focus();
                    return;
                }
                cleanup();
                resolve(val);
            };
            const handleCancel = () => { cleanup(); resolve(null); };
            const handleKey = (e) => {
                if (e.key === 'Escape') handleCancel();
            };

            function cleanup() {
                modal.classList.add('hidden');
                btnConfirm.removeEventListener('click', handleConfirm);
                btnCancel.removeEventListener('click', handleCancel);
                document.removeEventListener('keydown', handleKey);
            }

            btnConfirm.addEventListener('click', handleConfirm);
            btnCancel.addEventListener('click', handleCancel);
            document.addEventListener('keydown', handleKey);
        });
    },

    // Standard Export Modal (Word-Style Print Dialog Experience)
    showExportModal: function({
        title = 'Cấu Hình Xuất Dữ Liệu',
        datasetName = 'Bản ghi',
        defaultFilename = 'HALMBOOK_Export.csv',
        currentFilterDesc = 'Không có bộ lọc',
        totalCount = 0,
        filteredCount = 0,
        columns = [],
        onExport
    }) {
        return new Promise((resolve) => {
            const modal = document.getElementById('adminExportModal');
            if (!modal) {
                const defaultCols = columns.map(c => c.key);
                if (typeof onExport === 'function') onExport('filtered', defaultCols);
                return resolve({ scope: 'filtered', selectedColumns: defaultCols });
            }

            document.getElementById('adminExportTitle').innerText = title;
            document.getElementById('adminExportDatasetName').innerText = datasetName;
            document.getElementById('adminExportFilename').innerText = defaultFilename;
            document.getElementById('adminExportFilterDesc').innerText = currentFilterDesc || 'Đang áp dụng bộ lọc hiện tại';
            document.getElementById('adminExportFilteredCount').innerText = `${filteredCount} bản ghi`;
            document.getElementById('adminExportTotalCount').innerText = `${totalCount} bản ghi`;

            // Prepare columns schema
            const colList = (Array.isArray(columns) && columns.length > 0) ? columns : [
                { key: 'id', label: 'Mã bản ghi', isPrimary: true },
                { key: 'name', label: 'Tên / Tiêu đề', isPrimary: true },
                { key: 'status', label: 'Trạng thái', isPrimary: true }
            ];

            const selectedColumns = new Set();
            colList.forEach(c => {
                if (c.isPrimary !== false) {
                    selectedColumns.add(c.key);
                }
            });

            const primaryContainer = document.getElementById('adminExportPrimaryColumnsContainer');
            const secondaryContainer = document.getElementById('adminExportSecondaryColumnsContainer');
            const secondaryWrapper = document.getElementById('adminExportSecondaryWrapper');
            const colBadge = document.getElementById('adminExportColumnSummaryBadge');
            const summaryScope = document.getElementById('adminSummaryScope');
            const summaryRecords = document.getElementById('adminSummaryRecords');
            const summaryCols = document.getElementById('adminSummaryCols');
            const colWarning = document.getElementById('adminExportColWarning');

            const radioFiltered = document.getElementById('exportScopeFiltered');
            const radioAll = document.getElementById('exportScopeAll');
            if (radioFiltered) radioFiltered.checked = true;

            const primaryCols = colList.filter(c => c.isPrimary !== false);
            const secondaryCols = colList.filter(c => c.isPrimary === false);

            function renderColumnCheckboxes() {
                if (primaryContainer) {
                    primaryContainer.innerHTML = primaryCols.map(c => `
                        <label class="flex items-center space-x-2.5 p-2 rounded-lg border cursor-pointer select-none transition ${selectedColumns.has(c.key) ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 shadow-xs' : 'bg-white dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-slate-400'}">
                            <input type="checkbox" data-col="${c.key}" ${selectedColumns.has(c.key) ? 'checked' : ''} class="col-checkbox rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer">
                            <span class="font-bold text-xs flex-1 truncate">${c.label}</span>
                            <span class="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">Chính</span>
                        </label>
                    `).join('');
                }

                if (secondaryContainer) {
                    if (secondaryCols.length === 0) {
                        if (secondaryWrapper) secondaryWrapper.classList.add('hidden');
                    } else {
                        if (secondaryWrapper) secondaryWrapper.classList.remove('hidden');
                        secondaryContainer.innerHTML = secondaryCols.map(c => `
                            <label class="flex items-center space-x-2.5 p-2 rounded-lg border cursor-pointer select-none transition ${selectedColumns.has(c.key) ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 shadow-xs' : 'bg-white dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-slate-400'}">
                                <input type="checkbox" data-col="${c.key}" ${selectedColumns.has(c.key) ? 'checked' : ''} class="col-checkbox rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer">
                                <span class="font-bold text-xs flex-1 truncate">${c.label}</span>
                                <span class="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-300">Phụ</span>
                            </label>
                        `).join('');
                    }
                }

                // Attach checkbox listeners
                modal.querySelectorAll('.col-checkbox').forEach(cb => {
                    cb.addEventListener('change', (e) => {
                        const k = e.target.getAttribute('data-col');
                        if (e.target.checked) {
                            selectedColumns.add(k);
                        } else {
                            selectedColumns.delete(k);
                        }
                        updateUI();
                    });
                });
            }

            function updateUI() {
                const isAll = radioAll && radioAll.checked;
                const activeScopeText = isAll ? 'Toàn bộ hệ thống' : 'Bộ lọc hiện tại';
                const activeRecordCount = isAll ? totalCount : filteredCount;

                if (summaryScope) summaryScope.innerText = activeScopeText;
                if (summaryRecords) summaryRecords.innerText = activeRecordCount;
                if (summaryCols) summaryCols.innerText = selectedColumns.size;
                if (colBadge) colBadge.innerText = `Đã chọn: ${selectedColumns.size}/${colList.length} cột`;

                const btnConfirm = document.getElementById('adminExportConfirmBtn');
                if (selectedColumns.size === 0) {
                    if (colWarning) colWarning.classList.remove('hidden');
                    if (btnConfirm) {
                        btnConfirm.disabled = true;
                        btnConfirm.classList.add('opacity-50', 'cursor-not-allowed');
                    }
                } else {
                    if (colWarning) colWarning.classList.add('hidden');
                    if (btnConfirm) {
                        btnConfirm.disabled = false;
                        btnConfirm.classList.remove('opacity-50', 'cursor-not-allowed');
                    }
                }

                // Sync label visual styles
                modal.querySelectorAll('.col-checkbox').forEach(cb => {
                    const label = cb.closest('label');
                    if (label) {
                        if (cb.checked) {
                            label.className = 'flex items-center space-x-2.5 p-2 rounded-lg border cursor-pointer select-none transition bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 shadow-xs';
                        } else {
                            label.className = 'flex items-center space-x-2.5 p-2 rounded-lg border cursor-pointer select-none transition bg-white dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-slate-400';
                        }
                    }
                });
            }

            renderColumnCheckboxes();
            updateUI();

            // Quick Actions Handlers
            const btnSelectAll = document.getElementById('adminExportSelectAllBtn');
            const btnDeselectAll = document.getElementById('adminExportDeselectAllBtn');
            const btnResetDefault = document.getElementById('adminExportResetColumnsBtn');

            if (btnSelectAll) {
                btnSelectAll.onclick = () => {
                    colList.forEach(c => selectedColumns.add(c.key));
                    modal.querySelectorAll('.col-checkbox').forEach(cb => cb.checked = true);
                    updateUI();
                };
            }
            if (btnDeselectAll) {
                btnDeselectAll.onclick = () => {
                    selectedColumns.clear();
                    modal.querySelectorAll('.col-checkbox').forEach(cb => cb.checked = false);
                    updateUI();
                };
            }
            if (btnResetDefault) {
                btnResetDefault.onclick = () => {
                    selectedColumns.clear();
                    primaryCols.forEach(c => selectedColumns.add(c.key));
                    modal.querySelectorAll('.col-checkbox').forEach(cb => {
                        const k = cb.getAttribute('data-col');
                        cb.checked = selectedColumns.has(k);
                    });
                    updateUI();
                };
            }

            if (radioFiltered) radioFiltered.onchange = updateUI;
            if (radioAll) radioAll.onchange = updateUI;

            modal.classList.remove('hidden');

            const btnConfirm = document.getElementById('adminExportConfirmBtn');
            const btnCancel = document.getElementById('adminExportCancelBtn');
            const btnCloseX = document.getElementById('adminExportCloseBtn');

            let isExporting = false;

            const handleConfirm = async () => {
                if (isExporting || selectedColumns.size === 0) return;
                isExporting = true;

                const origConfirmHtml = btnConfirm.innerHTML;
                btnConfirm.disabled = true;
                btnConfirm.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i><span>Đang chuẩn bị file...</span>`;

                const scope = radioAll && radioAll.checked ? 'all' : 'filtered';
                const chosenKeys = colList.filter(c => selectedColumns.has(c.key)).map(c => c.key);

                try {
                    if (typeof onExport === 'function') {
                        await onExport(scope, chosenKeys);
                    }
                } catch (err) {
                    console.error('Export error:', err);
                } finally {
                    btnConfirm.innerHTML = origConfirmHtml;
                    btnConfirm.disabled = false;
                    isExporting = false;
                    cleanup();
                    resolve({ scope, selectedColumns: chosenKeys });
                }
            };

            const handleCancel = () => {
                cleanup();
                resolve(null);
            };

            const handleKey = (e) => {
                if (e.key === 'Escape') handleCancel();
            };

            function cleanup() {
                modal.classList.add('hidden');
                btnConfirm.removeEventListener('click', handleConfirm);
                btnCancel.removeEventListener('click', handleCancel);
                if (btnCloseX) btnCloseX.removeEventListener('click', handleCancel);
                document.removeEventListener('keydown', handleKey);
            }

            btnConfirm.addEventListener('click', handleConfirm);
            btnCancel.addEventListener('click', handleCancel);
            if (btnCloseX) btnCloseX.addEventListener('click', handleCancel);
            document.addEventListener('keydown', handleKey);
        });
    },

    // CSV Download Helper with UTF-8 BOM
    downloadCSV: function(filename, csvContent) {
        const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    },

    // Render Badge Helper
    renderBadge: function(status, textOverride = '') {
        const st = String(status || '').toLowerCase().trim();
        let bg = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-600';
        let icon = 'fa-circle-dot';
        let text = textOverride || status;

        if (st === 'active' || st === 'approved' || st === 'resolved' || st === 'public') {
            bg = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700';
            icon = 'fa-circle-check';
            if (!textOverride) {
                if (st === 'active') text = 'Đang hoạt động';
                else if (st === 'approved') text = 'Đã duyệt';
                else if (st === 'resolved') text = 'Đã giải quyết';
                else if (st === 'public') text = 'Công khai';
            }
        } else if (st === 'pending') {
            bg = 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-300 dark:border-amber-700';
            icon = 'fa-clock';
            if (!textOverride) text = 'Chờ xử lý';
        } else if (st === 'locked' || st === 'rejected') {
            bg = 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border-rose-300 dark:border-rose-700';
            icon = st === 'locked' ? 'fa-user-lock' : 'fa-circle-xmark';
            if (!textOverride) {
                if (st === 'locked') text = 'Đã khóa';
                else if (st === 'rejected') text = 'Đã từ chối';
            }
        } else if (st === 'revoked') {
            bg = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-600';
            icon = 'fa-ban';
            if (!textOverride) text = 'Đã thu hồi';
        } else if (st === 'draft') {
            bg = 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-300 dark:border-slate-600';
            icon = 'fa-file-lines';
            if (!textOverride) text = 'Bản nháp';
        }

        return `<span class="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-black border whitespace-nowrap shadow-xs ${bg}"><i class="fa-solid ${icon} mr-1 text-[9px]"></i>${text}</span>`;
    },

    // Render Avatar Helper
    renderAvatar: function({ name = 'U', avatar = '', avatarUrl = '', size = 'w-8 h-8', textSize = 'text-xs' }) {
        const fallbackLetters = avatar || (name ? name.split(' ').map(p => p[0]).slice(-2).join('').toUpperCase() : 'U');
        if (avatarUrl) {
            return `<img src="${avatarUrl}" alt="${name}" class="${size} rounded-full object-cover shrink-0 border border-slate-200 dark:border-slate-700 shadow-xs" onerror="this.onerror=null; this.outerHTML='<div class=\\'${size} rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 font-black border border-slate-200 dark:border-slate-700 flex items-center justify-center ${textSize} shrink-0\\'>${fallbackLetters}</div>'"/>`;
        }
        return `<div class="${size} rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 font-black border border-slate-200 dark:border-slate-700 flex items-center justify-center ${textSize} shrink-0">${fallbackLetters}</div>`;
    }
};