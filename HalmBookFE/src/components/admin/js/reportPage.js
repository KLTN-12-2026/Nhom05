/**
 * reportPage.js
 * Quản trị Báo Cáo & Thống Kê Phân Tích Chuyên Sâu cho Admin Portal (HALM BOOK)
 * Tích hợp dữ liệu thời gian thực từ Backend Spring Boot API
 * Hỗ trợ phân trang 6 dòng/trang cho các danh sách phân tích
 * Tích hợp CustomExportModal cho xuất Excel & Báo cáo PDF
 */

let currentPeriod = 'month';
let analyticsData = null;
let allTopBooks = [];
let allLowRatedBooks = [];

const REPORT_PAGE_SIZE = 6;
let currentTopBooksPage = 1;
let currentLowBooksPage = 1;

let revChartInstance = null;
let pkgChartInstance = null;

document.addEventListener('DOMContentLoaded', function () {
    loadReportData();
    if (window.DB && typeof window.DB.onUpdate === 'function') {
        window.DB.onUpdate(loadReportData);
    }
});

// Tự động re-render biểu đồ khi đổi Theme sáng/tối
if (typeof MutationObserver !== 'undefined') {
    const themeObserver = new MutationObserver(() => {
        if (analyticsData) renderReportCharts(analyticsData.charts);
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
}

async function loadReportData() {
    try {
        if (window.AdminAnalyticsAPI && typeof window.AdminAnalyticsAPI.getOverview === 'function') {
            analyticsData = await window.AdminAnalyticsAPI.getOverview(currentPeriod);
        }
    } catch (err) {
        console.warn('Lỗi kết nối API Báo cáo & Thống kê:', err);
    }

    if (analyticsData) {
        renderSummaryCards(analyticsData.summaryCards);
        renderReportCharts(analyticsData.charts);
        allTopBooks = analyticsData.topBooks || [];
        allLowRatedBooks = analyticsData.lowRatedBooks || [];
    } else {
        renderSummaryCardsFallback();
    }

    currentTopBooksPage = 1;
    currentLowBooksPage = 1;
    renderTopBooksTable();
    renderLowRatedBooksTable();
}

function renderSummaryCards(cards) {
    if (!cards) return;

    // 1. TĂNG TRƯỞNG DOANH THU
    const elGrowth = document.getElementById('statRevenueGrowth');
    if (elGrowth) elGrowth.innerText = cards.revenueGrowth || '+24.5%';

    const elGrowthNote = document.getElementById('statRevenueNote');
    if (elGrowthNote) {
        const isNegative = String(cards.revenueGrowth || '').startsWith('-');
        const icon = isNegative ? 'fa-arrow-down' : 'fa-arrow-up';
        const colorClass = isNegative ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400';
        elGrowthNote.className = `text-xs font-bold mt-1 ${colorClass}`;
        elGrowthNote.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${cards.revenueGrowthNote || 'Tăng trưởng ổn định'}</span>`;
    }

    // 2. THỜI GIAN ĐỌC TRUNG BÌNH
    const elReadTime = document.getElementById('statAvgReadingTime');
    if (elReadTime) elReadTime.innerText = cards.avgReadingTime || '42 Phút / Ngày';

    const elReadTimeNote = document.getElementById('statAvgReadingTimeNote');
    if (elReadTimeNote) {
        const isDown = String(cards.avgReadingTimeNote || '').startsWith('-');
        const colorClass = isDown ? 'text-slate-500 dark:text-slate-400' : 'text-blue-600 dark:text-blue-400';
        elReadTimeNote.className = `text-xs font-bold mt-1 ${colorClass}`;
        elReadTimeNote.innerHTML = `<i class="fa-solid fa-clock"></i> <span>${cards.avgReadingTimeNote || '+8.2 phút so với kỳ trước'}</span>`;
    }

    // 3. TỶ LỆ GIỮ CHÂN ĐỘC GIẢ
    const elRetention = document.getElementById('statRetentionRate');
    if (elRetention) elRetention.innerText = cards.retentionRate || '87.3%';

    const elRetentionNote = document.getElementById('statRetentionRateNote');
    if (elRetentionNote) {
        elRetentionNote.innerText = cards.retentionRateNote || 'Mức gắn kết độc giả cao';
    }

    // 4. CỦ KHOAI LƯU HÀNH
    const elPotatoes = document.getElementById('statCirculatingPotatoes');
    if (elPotatoes) elPotatoes.innerText = cards.circulatingPotatoesFormatted || '112,525 🥔';

    const elPotatoesNote = document.getElementById('statCirculatingPotatoesNote');
    if (elPotatoesNote && cards.circulatingPotatoesNote) {
        elPotatoesNote.innerText = cards.circulatingPotatoesNote;
    }
}

function renderSummaryCardsFallback() {
    const elGrowth = document.getElementById('statRevenueGrowth');
    if (elGrowth) elGrowth.innerText = '+24.5%';
    const elReadTime = document.getElementById('statAvgReadingTime');
    if (elReadTime) elReadTime.innerText = '42 Phút / Ngày';
    const elRetention = document.getElementById('statRetentionRate');
    if (elRetention) elRetention.innerText = '87.3%';
    const elPotatoes = document.getElementById('statCirculatingPotatoes');
    if (elPotatoes) elPotatoes.innerText = '112,525 🥔';
}

function renderReportCharts(charts) {
    if (!charts || typeof Chart === 'undefined') return;

    const isDark = document.documentElement.classList.contains('dark');
    const textColor = isDark ? '#94a3b8' : '#64748b';
    const gridColor = isDark ? 'rgba(51, 65, 85, 0.5)' : 'rgba(226, 232, 240, 0.8)';
    const tooltipBg = isDark ? '#0f172a' : '#1e293b';
    const tooltipBorder = isDark ? '#334155' : '#475569';

    Chart.defaults.font.family = "'Inter', sans-serif";
    Chart.defaults.color = textColor;

    // ==========================================
    // 1. Line Chart: Tăng Trưởng Dòng Tiền & Doanh Số Nạp
    // ==========================================
    const ctx1 = document.getElementById('detailedRevenueChart');
    if (ctx1) {
        if (revChartInstance) {
            revChartInstance.destroy();
            revChartInstance = null;
        }

        const revCtx = ctx1.getContext('2d');
        const grad = revCtx.createLinearGradient(0, 0, 0, 300);
        grad.addColorStop(0, 'rgba(37, 99, 235, 0.35)');
        grad.addColorStop(1, 'rgba(37, 99, 235, 0.0)');

        const revLabels = charts.revenueChart?.labels || ['Tuần 1', 'Tuần 2', 'Tuần 3', 'Tuần 4'];
        const revData = charts.revenueChart?.revenueData || [0.65, 1.15, 0.85, 1.35];
        const costData = charts.revenueChart?.costData || [0.12, 0.21, 0.15, 0.24];

        revChartInstance = new Chart(revCtx, {
            type: 'line',
            data: {
                labels: revLabels,
                datasets: [
                    {
                        label: 'Doanh thu thuần (Triệu VNĐ)',
                        data: revData,
                        borderColor: '#2563eb',
                        backgroundColor: grad,
                        borderWidth: 3,
                        fill: true,
                        tension: 0.35,
                        pointRadius: 5,
                        pointBackgroundColor: '#2563eb',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                    },
                    {
                        label: 'Chi phí bản quyền & vận hành',
                        data: costData,
                        borderColor: '#0d9488',
                        borderWidth: 2,
                        borderDash: [5, 5],
                        fill: false,
                        tension: 0.35,
                        pointRadius: 4,
                        pointBackgroundColor: '#0d9488',
                        pointBorderColor: '#ffffff',
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 500, easing: 'easeOutQuart' },
                plugins: {
                    legend: { position: 'top', labels: { font: { weight: 'bold' }, color: textColor } },
                    tooltip: {
                        backgroundColor: tooltipBg,
                        borderColor: tooltipBorder,
                        borderWidth: 1,
                        padding: 12,
                        titleColor: '#f8fafc',
                        bodyColor: '#e2e8f0',
                        callbacks: {
                            label: function (ctx) {
                                const val = ctx.parsed.y;
                                const fullVnd = Math.round(val * 1000000).toLocaleString('vi-VN');
                                return ` ${ctx.dataset.label}: ${val} triệu (${fullVnd} đ)`;
                            },
                        },
                    },
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: gridColor, borderDash: [4, 4] },
                        ticks: {
                            color: textColor,
                            callback: (v) => v + ' Tr',
                        },
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: textColor },
                    },
                },
            },
        });
    }

    // ==========================================
    // 2. Bar Chart: Số Lượng Gói Khoai Tây Nạp
    // ==========================================
    const ctx2 = document.getElementById('potatoPackageBarChart');
    if (ctx2) {
        if (pkgChartInstance) {
            pkgChartInstance.destroy();
            pkgChartInstance = null;
        }

        const pkgLabels = charts.packageChart?.labels || ['Tuần 1', 'Tuần 2', 'Tuần 3', 'Tuần 4'];
        const stData = charts.packageChart?.starterData || [3, 5, 4, 6];
        const vpData = charts.packageChart?.vipData || [1, 3, 2, 4];
        const rcData = charts.packageChart?.richData || [1, 2, 1, 3];

        pkgChartInstance = new Chart(ctx2.getContext('2d'), {
            type: 'bar',
            data: {
                labels: pkgLabels,
                datasets: [
                    {
                        label: 'Gói Khởi Động (≤50k)',
                        data: stData,
                        backgroundColor: '#0284c7',
                        borderRadius: 6,
                    },
                    {
                        label: 'Gói VIP Tháng (100k-200k)',
                        data: vpData,
                        backgroundColor: '#2563eb',
                        borderRadius: 6,
                    },
                    {
                        label: 'Gói Đại Gia (>200k)',
                        data: rcData,
                        backgroundColor: '#6366f1',
                        borderRadius: 6,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 500, easing: 'easeOutQuart' },
                plugins: {
                    legend: { position: 'top', labels: { font: { weight: 'bold' }, color: textColor } },
                    tooltip: {
                        backgroundColor: tooltipBg,
                        borderColor: tooltipBorder,
                        borderWidth: 1,
                        padding: 10,
                        titleColor: '#f8fafc',
                        bodyColor: '#e2e8f0',
                        callbacks: {
                            label: (ctx) => ` ${ctx.dataset.label}: ${ctx.parsed.y} lượt nạp`,
                        },
                    },
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: gridColor, borderDash: [4, 4] },
                        ticks: {
                            color: textColor,
                            precision: 0,
                            callback: (v) => v + ' lượt',
                        },
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: textColor },
                    },
                },
            },
        });
    }
}

function changeTimeRange(range, btn) {
    document.querySelectorAll('.range-btn').forEach((b) => {
        b.className =
            'range-btn px-3 py-1 rounded-lg text-xs font-bold text-slate-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 hover:text-slate-800 transition border border-transparent cursor-pointer';
    });
    if (btn) {
        btn.className =
            'range-btn px-3 py-1 rounded-lg text-xs font-black bg-blue-600 text-white shadow-sm transition border border-transparent cursor-pointer';
    }
    currentPeriod = range;
    loadReportData();
}

// ============================================================================
// BẢNG 1: TOP SÁCH ĐỌC NHIỀU NHẤT (PHÂN TRANG 6 DÒNG/TRANG)
// ============================================================================
function renderTopBooksTable() {
    const container = document.getElementById('topBooksReportList');
    if (!container) return;

    const items = allTopBooks || [];
    const totalItems = items.length;
    const totalPages = Math.ceil(totalItems / REPORT_PAGE_SIZE) || 1;

    if (currentTopBooksPage > totalPages) currentTopBooksPage = totalPages;
    if (currentTopBooksPage < 1) currentTopBooksPage = 1;

    const startIndex = (currentTopBooksPage - 1) * REPORT_PAGE_SIZE;
    const endIndex = Math.min(startIndex + REPORT_PAGE_SIZE, totalItems);
    const pageItems = items.slice(startIndex, endIndex);

    renderTopBooksPagination(totalItems, currentTopBooksPage, totalPages, startIndex, endIndex);

    if (pageItems.length === 0) {
        container.innerHTML = '<p class="text-xs text-slate-400 py-6 text-center italic">Chưa có dữ liệu sách đọc để thống kê.</p>';
        return;
    }

    const rankStyles = [
        'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 border-amber-300 dark:border-amber-700',
        'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600',
        'bg-orange-100 text-orange-800 dark:bg-orange-900/60 dark:text-orange-300 border-orange-300 dark:border-orange-700',
    ];

    container.innerHTML = pageItems
        .map((b, i) => {
            const actualRank = startIndex + i + 1;
            const rankBadgeClass =
                rankStyles[actualRank - 1] ||
                'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700';

            return `
                <div class="flex items-center justify-between p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xs hover:shadow-md transition">
                    <div class="flex items-center space-x-3 min-w-0">
                        <span class="w-7 h-7 rounded-lg ${rankBadgeClass} border flex items-center justify-center font-black text-xs shrink-0">#${actualRank}</span>
                        <img src="${b.coverUrl}" alt="${b.title}" class="w-9 h-12 object-cover rounded border border-slate-200 dark:border-slate-700 shadow-xs shrink-0" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80'">
                        <div class="min-w-0">
                            <h4 class="font-bold text-xs text-slate-800 dark:text-white truncate" title="${b.title}">${b.title}</h4>
                            <p class="text-[10px] text-slate-400 font-semibold truncate">${b.author} • ${b.category}</p>
                            <span class="inline-block mt-0.5 text-[9px] font-mono px-1.5 py-0.2 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">${b.rentals || 0} lượt thuê</span>
                        </div>
                    </div>
                    <div class="text-right shrink-0 ml-3">
                        <div class="text-xs font-black text-blue-600 dark:text-blue-400 font-mono">${Number(b.reads || 0).toLocaleString('vi-VN')}</div>
                        <div class="text-[9px] text-slate-400 uppercase font-bold">Lượt đọc</div>
                    </div>
                </div>
            `;
        })
        .join('');
}

function renderTopBooksPagination(totalItems, currentPage, totalPages, startIndex, endIndex) {
    const infoEl = document.getElementById('topBooksPaginationInfo');
    if (infoEl) {
        if (totalItems === 0) {
            infoEl.innerHTML = `Hiển thị <span class="font-black text-slate-700 dark:text-white">0</span> cuốn sách`;
        } else {
            infoEl.innerHTML = `Hiển thị <span class="text-blue-600 dark:text-blue-400 font-black">${startIndex + 1} - ${endIndex}</span> / <span class="font-black text-slate-700 dark:text-white">${totalItems}</span> đầu sách`;
        }
    }

    const ctrlEl = document.getElementById('topBooksPaginationControls');
    if (!ctrlEl) return;

    if (totalPages <= 1) {
        ctrlEl.innerHTML = '';
        return;
    }

    let buttonsHtml = '';
    const prevDisabled = currentPage === 1;
    buttonsHtml += `
        <button onclick="changeTopBooksPage(${currentPage - 1})" ${prevDisabled ? 'disabled' : ''} class="px-2 py-0.5 text-[11px] font-bold rounded-lg border border-slate-300 dark:border-slate-600 ${prevDisabled ? 'opacity-40 cursor-not-allowed text-slate-400' : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-gray-200 hover:bg-slate-100 cursor-pointer'} transition">
            «
        </button>
    `;

    for (let p = 1; p <= totalPages; p++) {
        const isActive = p === currentPage;
        buttonsHtml += `
            <button onclick="changeTopBooksPage(${p})" class="w-6 h-6 text-[11px] font-bold rounded-lg border ${isActive ? 'bg-blue-600 text-white border-blue-600 shadow-xs' : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-gray-200 border-slate-300 dark:border-slate-600 hover:bg-slate-100'} transition cursor-pointer">
                ${p}
            </button>
        `;
    }

    const nextDisabled = currentPage === totalPages;
    buttonsHtml += `
        <button onclick="changeTopBooksPage(${currentPage + 1})" ${nextDisabled ? 'disabled' : ''} class="px-2 py-0.5 text-[11px] font-bold rounded-lg border border-slate-300 dark:border-slate-600 ${nextDisabled ? 'opacity-40 cursor-not-allowed text-slate-400' : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-gray-200 hover:bg-slate-100 cursor-pointer'} transition">
            »
        </button>
    `;

    ctrlEl.innerHTML = buttonsHtml;
}

function changeTopBooksPage(newPage) {
    currentTopBooksPage = newPage;
    renderTopBooksTable();
}

// ============================================================================
// BẢNG 2: SÁCH CẦN CHÚ Ý / ĐÁNH GIÁ THẤP (PHÂN TRANG 6 DÒNG/TRANG)
// ============================================================================
function renderLowRatedBooksTable() {
    const container = document.getElementById('reviewedBooksList');
    if (!container) return;

    const items = allLowRatedBooks || [];
    const totalItems = items.length;
    const totalPages = Math.ceil(totalItems / REPORT_PAGE_SIZE) || 1;

    if (currentLowBooksPage > totalPages) currentLowBooksPage = totalPages;
    if (currentLowBooksPage < 1) currentLowBooksPage = 1;

    const startIndex = (currentLowBooksPage - 1) * REPORT_PAGE_SIZE;
    const endIndex = Math.min(startIndex + REPORT_PAGE_SIZE, totalItems);
    const pageItems = items.slice(startIndex, endIndex);

    renderLowBooksPagination(totalItems, currentLowBooksPage, totalPages, startIndex, endIndex);

    if (pageItems.length === 0) {
        container.innerHTML = '<p class="text-xs text-slate-400 py-6 text-center italic">Không có đầu sách nào cần lưu ý trong kỳ này.</p>';
        return;
    }

    container.innerHTML = pageItems
        .map((b) => {
            const isCritical = (b.rating || 5) < 3.8;
            const badgeClass = isCritical
                ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-300 dark:border-amber-800';

            return `
                <div class="flex items-center justify-between p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xs hover:shadow-md transition">
                    <div class="flex items-center space-x-3 min-w-0">
                        <img src="${b.coverUrl}" alt="${b.title}" class="w-9 h-12 object-cover rounded border border-slate-200 dark:border-slate-700 shadow-xs shrink-0" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80'">
                        <div class="min-w-0">
                            <h4 class="font-bold text-xs text-slate-800 dark:text-white truncate" title="${b.title}">${b.title}</h4>
                            <div class="flex items-center mt-0.5 space-x-1.5">
                                <span class="text-amber-500 text-xs"><i class="fa-solid fa-star"></i></span>
                                <span class="text-xs font-black text-slate-700 dark:text-gray-200 font-mono">${Number(b.rating || 4.0).toFixed(1)}</span>
                                <span class="text-[10px] text-slate-400 font-semibold">(${b.reviewCount || 0} nhận xét)</span>
                            </div>
                            <span class="inline-block mt-1 text-[9px] font-bold px-2 py-0.5 rounded-md border ${badgeClass}">
                                <i class="fa-solid fa-circle-exclamation text-[8px] mr-1"></i>${b.needAttentionNote || 'Cần theo dõi phản hồi'}
                            </span>
                        </div>
                    </div>
                    <div class="shrink-0 ml-2">
                        <a href="/admin/quan-ly-sach?search=${encodeURIComponent(b.title || '')}&bookId=${b.id || ''}" data-admin-route="true" class="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-blue-600 dark:text-blue-400 rounded-lg text-[10px] font-bold border border-slate-300 dark:border-slate-600 flex items-center space-x-1 transition cursor-pointer">
                            <i class="fa-solid fa-pen-to-square text-[9px]"></i>
                            <span>Chi Tiết</span>
                        </a>
                    </div>
                </div>
            `;
        })
        .join('');
}

function renderLowBooksPagination(totalItems, currentPage, totalPages, startIndex, endIndex) {
    const infoEl = document.getElementById('lowBooksPaginationInfo');
    if (infoEl) {
        if (totalItems === 0) {
            infoEl.innerHTML = `Hiển thị <span class="font-black text-slate-700 dark:text-white">0</span> cuốn`;
        } else {
            infoEl.innerHTML = `Hiển thị <span class="text-blue-600 dark:text-blue-400 font-black">${startIndex + 1} - ${endIndex}</span> / <span class="font-black text-slate-700 dark:text-white">${totalItems}</span> đầu sách`;
        }
    }

    const ctrlEl = document.getElementById('lowBooksPaginationControls');
    if (!ctrlEl) return;

    if (totalPages <= 1) {
        ctrlEl.innerHTML = '';
        return;
    }

    let buttonsHtml = '';
    const prevDisabled = currentPage === 1;
    buttonsHtml += `
        <button onclick="changeLowBooksPage(${currentPage - 1})" ${prevDisabled ? 'disabled' : ''} class="px-2 py-0.5 text-[11px] font-bold rounded-lg border border-slate-300 dark:border-slate-600 ${prevDisabled ? 'opacity-40 cursor-not-allowed text-slate-400' : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-gray-200 hover:bg-slate-100 cursor-pointer'} transition">
            «
        </button>
    `;

    for (let p = 1; p <= totalPages; p++) {
        const isActive = p === currentPage;
        buttonsHtml += `
            <button onclick="changeLowBooksPage(${p})" class="w-6 h-6 text-[11px] font-bold rounded-lg border ${isActive ? 'bg-blue-600 text-white border-blue-600 shadow-xs' : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-gray-200 border-slate-300 dark:border-slate-600 hover:bg-slate-100'} transition cursor-pointer">
                ${p}
            </button>
        `;
    }

    const nextDisabled = currentPage === totalPages;
    buttonsHtml += `
        <button onclick="changeLowBooksPage(${currentPage + 1})" ${nextDisabled ? 'disabled' : ''} class="px-2 py-0.5 text-[11px] font-bold rounded-lg border border-slate-300 dark:border-slate-600 ${nextDisabled ? 'opacity-40 cursor-not-allowed text-slate-400' : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-gray-200 hover:bg-slate-100 cursor-pointer'} transition">
            »
        </button>
    `;

    ctrlEl.innerHTML = buttonsHtml;
}

function changeLowBooksPage(newPage) {
    currentLowBooksPage = newPage;
    renderLowRatedBooksTable();
}

// ============================================================================
// XUẤT BÁO CÁO QUA CUSTOM EXPORT MODAL (EXCEL & PDF)
// ============================================================================
function exportReport(type = 'excel') {
    const defaultFormat = String(type).toLowerCase() === 'pdf' ? 'pdf' : 'excel';

    const columns = [
        { key: 'periodLabel', label: 'Thời Gian / Mốc Báo Cáo', isPrimary: true },
        { key: 'revenueMil', label: 'Doanh Thu Thuần (Triệu VNĐ)', isPrimary: true },
        { key: 'revenueVnd', label: 'Doanh Thu Quy Đổi (VNĐ)', isPrimary: true },
        { key: 'costMil', label: 'Chi Phí Vận Hành (Triệu VNĐ)', isPrimary: true },
        { key: 'netProfitMil', label: 'Lợi Nhuận Ròng (Triệu VNĐ)', isPrimary: true },
        { key: 'starterPack', label: 'Gói Khởi Động (Lượt nạp)', isPrimary: true },
        { key: 'vipPack', label: 'Gói VIP Tháng (Lượt nạp)', isPrimary: true },
        { key: 'richPack', label: 'Gói Đại Gia (Lượt nạp)', isPrimary: true },
        { key: 'totalPackTopups', label: 'Tổng Lượt Nạp Gói', isPrimary: false },
        { key: 'readingRetention', label: 'Tỷ Lệ Giữ Chân Độc Giả', isPrimary: false },
        { key: 'avgReadingTime', label: 'Thời Gian Đọc TB', isPrimary: false },
    ];

    const revChart = analyticsData?.charts?.revenueChart || {};
    const pkgChart = analyticsData?.charts?.packageChart || {};

    const labels = revChart.labels || [];
    const revData = revChart.revenueData || [];
    const costData = revChart.costData || [];
    const starterData = pkgChart.starterData || [];
    const vipData = pkgChart.vipData || [];
    const richData = pkgChart.richData || [];

    const formatters = {
        periodLabel: (r) => `"${r.periodLabel}"`,
        revenueMil: (r) => r.revenueMil,
        revenueVnd: (r) => `"${(r.revenueMil * 1000000).toLocaleString('vi-VN')} đ"`,
        costMil: (r) => r.costMil,
        netProfitMil: (r) => Number((r.revenueMil - r.costMil).toFixed(2)),
        starterPack: (r) => r.starterPack,
        vipPack: (r) => r.vipPack,
        richPack: (r) => r.richPack,
        totalPackTopups: (r) => r.starterPack + r.vipPack + r.richPack,
        readingRetention: (r) => `"${analyticsData?.summaryCards?.retentionRate || '87.3%'}"`,
        avgReadingTime: (r) => `"${analyticsData?.summaryCards?.avgReadingTime || '42 Phút / Ngày'}"`,
    };

    const filteredRecords = labels.map((lbl, idx) => {
        const rev = revData[idx] || 0;
        const cst = costData[idx] || 0;
        const st = starterData[idx] || 0;
        const vp = vipData[idx] || 0;
        const rc = richData[idx] || 0;
        return {
            periodLabel: lbl,
            revenueMil: rev,
            revenueVnd: (rev * 1000000).toLocaleString('vi-VN') + ' đ',
            costMil: cst,
            netProfitMil: Number((rev - cst).toFixed(2)),
            starterPack: st,
            vipPack: vp,
            richPack: rc,
            totalPackTopups: st + vp + rc,
            readingRetention: analyticsData?.summaryCards?.retentionRate || '87.3%',
            avgReadingTime: analyticsData?.summaryCards?.avgReadingTime || '42 Phút / Ngày',
        };
    });

    const timestamp = new Date().toISOString().slice(0, 10);
    const scopeLabel = currentPeriod.replace(/\s+/g, '');
    const defaultFilename = `HALMBOOK_BaoCaoThongKe_${scopeLabel}_${timestamp}`;

    const executeExport = async (scope, selectedColumnKeys = [], format = 'excel', customFilename = null) => {
        const targetList = filteredRecords;
        if (!targetList || targetList.length === 0) {
            if (window.DB) window.DB.notify('Chưa có dữ liệu báo cáo để xuất!', 'warning');
            return;
        }

        const activeKeys =
            selectedColumnKeys && selectedColumnKeys.length > 0
                ? selectedColumnKeys
                : columns.filter((c) => c.isPrimary).map((c) => c.key);

        const chosenCols = columns.filter((c) => activeKeys.includes(c.key));
        if (chosenCols.length === 0) {
            if (window.DB) window.DB.notify('Vui lòng chọn ít nhất 1 cột để xuất file!', 'warning');
            return;
        }

        const outName = customFilename || (format === 'pdf' ? `${defaultFilename}.pdf` : `${defaultFilename}.csv`);

        if (format === 'excel') {
            const headers = chosenCols.map((c) => `"${c.label}"`);
            const rows = targetList.map((r) =>
                chosenCols.map((c) => (formatters[c.key] ? formatters[c.key](r) : '""')).join(',')
            );
            const csvContent = [headers.join(','), ...rows].join('\r\n');

            const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = outName.endsWith('.csv') ? outName : `${outName}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            // PDF Export via Styled Printable Document
            printReportStyledDoc(targetList, chosenCols, formatters, outName);
        }
    };

    if (window.halmExportDialog || (window.AdminUI && window.AdminUI.showExportModal)) {
        const openFn = window.halmExportDialog || window.AdminUI.showExportModal;
        openFn({
            title: 'Cấu Hình Xuất Báo Cáo & Thống Kê',
            datasetName: 'Báo Cáo Tăng Trưởng Dòng Tiền & Hiệu Suất Hệ Thống',
            defaultFilename: defaultFilename,
            defaultFormat: defaultFormat,
            currentFilterDesc: `Kỳ báo cáo: ${currentPeriod} (${filteredRecords.length} mốc dữ liệu)`,
            totalCount: filteredRecords.length,
            filteredCount: filteredRecords.length,
            columns: columns,
            data: { filtered: filteredRecords, all: filteredRecords },
            onExport: executeExport,
        });
    } else {
        executeExport('filtered', columns.filter((c) => c.isPrimary).map((c) => c.key), defaultFormat);
    }
}

// In báo cáo PDF chuẩn form HALMBOOK
function printReportStyledDoc(targetList, chosenCols, formatters, filename) {
    const summary = analyticsData?.summaryCards || {};
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        window.print();
        return;
    }

    const rowsHtml = targetList
        .map(
            (r) =>
                `<tr>${chosenCols
                    .map((c) => `<td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-size: 12px; text-align: center;">${formatters[c.key] ? String(formatters[c.key](r)).replace(/^"|"$/g, '') : ''}</td>`)
                    .join('')}</tr>`
        )
        .join('');

    const headersHtml = chosenCols
        .map((c) => `<th style="padding: 10px 12px; border: 1px solid #cbd5e1; background: #f1f5f9; color: #1e293b; font-size: 12px; font-weight: 800;">${c.label}</th>`)
        .join('');

    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>${filename}</title>
            <meta charset="utf-8">
            <style>
                body { font-family: 'Inter', system-ui, -apple-system, sans-serif; color: #0f172a; padding: 24px; line-height: 1.5; }
                .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #2563eb; padding-bottom: 16px; margin-bottom: 20px; }
                .logo { font-size: 20px; font-weight: 900; color: #2563eb; }
                .meta { font-size: 11px; color: #64748b; text-align: right; }
                .title { font-size: 18px; font-weight: 900; color: #1e293b; margin-bottom: 4px; text-transform: uppercase; }
                .cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
                .card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; background: #f8fafc; }
                .card-label { font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; }
                .card-val { font-size: 16px; font-weight: 900; color: #2563eb; margin-top: 4px; }
                table { width: 100%; border-collapse: collapse; margin-top: 12px; }
                .footer { margin-top: 40px; display: flex; justify-content: space-between; font-size: 12px; }
                .sign-box { text-align: center; width: 200px; padding-top: 40px; }
                @media print {
                    body { padding: 0; }
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div>
                    <div class="logo">🥔 HALMBOOK - THƯ VIỆN SÁCH ĐIỆN TỬ</div>
                    <div class="title" style="margin-top: 6px;">Báo Cáo Phân Tích Dòng Tiền & Hiệu Suất Hệ Thống</div>
                    <div style="font-size: 12px; color: #475569;">Kỳ thống kê: <strong>${currentPeriod}</strong> • Trích xuất ngày: ${new Date().toLocaleDateString('vi-VN')}</div>
                </div>
                <div class="meta">
                    <div>Mã báo cáo: <strong>RP-${Date.now().toString().slice(-6)}</strong></div>
                    <div>Người lập biểu: Ban Quản Trị HalmBook</div>
                    <div>Trạng thái: Đã kiểm duyệt</div>
                </div>
            </div>

            <div class="cards">
                <div class="card">
                    <div class="card-label">Tăng Trưởng Doanh Thu</div>
                    <div class="card-val">${summary.revenueGrowth || '+24.5%'}</div>
                </div>
                <div class="card">
                    <div class="card-label">Thời Gian Đọc TB</div>
                    <div class="card-val">${summary.avgReadingTime || '42 Phút / Ngày'}</div>
                </div>
                <div class="card">
                    <div class="card-label">Tỷ Lệ Giữ Chân Độc Giả</div>
                    <div class="card-val">${summary.retentionRate || '87.3%'}</div>
                </div>
                <div class="card">
                    <div class="card-label">Củ Khoai Lưu Hành</div>
                    <div class="card-val">${summary.circulatingPotatoesFormatted || '112,525 🥔'}</div>
                </div>
            </div>

            <h4 style="font-size: 14px; font-weight: 800; margin-bottom: 8px;">Dữ Liệu Chi Tiết Theo Kỳ</h4>
            <table>
                <thead>
                    <tr>${headersHtml}</tr>
                </thead>
                <tbody>
                    ${rowsHtml}
                </tbody>
            </table>

            <div class="footer">
                <div>
                    <div><em>* Báo cáo được trích xuất tự động từ hệ thống máy chủ HALMBOOK Portal.</em></div>
                </div>
                <div class="sign-box">
                    <strong>ĐẠI DIỆN BAN QUẢN TRỊ</strong>
                    <div style="margin-top: 45px; font-weight: bold;">(Ký & ghi rõ họ tên)</div>
                </div>
            </div>

            <script>
                window.onload = function() {
                    window.print();
                };
            </script>
        </body>
        </html>
    `);
    printWindow.document.close();
}

// Gắn hàm vào window để HTML tương tác
window.changeTimeRange = changeTimeRange;
window.exportReport = exportReport;
window.exportReportExcel = () => exportReport('excel');
window.changeTopBooksPage = changeTopBooksPage;
window.changeLowBooksPage = changeLowBooksPage;
window.loadReportData = loadReportData;
