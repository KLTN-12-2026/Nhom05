/**
 * dashboardPage.js
 * Quản trị Tổng Quan Điều Hành Hệ Thống (Dashboard) cho Admin Portal (HALM BOOK)
 * Kết nối dữ liệu thời gian thực từ Backend Spring Boot API
 * Tích hợp CustomExportModal cho xuất Excel và Báo cáo PDF
 */

let currentPeriod = '1 Ngày';
let dashboardData = null;
let activeCharts = [];

document.addEventListener('DOMContentLoaded', function () {
    loadDashboardData();
    if (window.DB && typeof window.DB.onUpdate === 'function') {
        window.DB.onUpdate(loadDashboardData);
    }
});

// Tự động re-render biểu đồ khi đổi Theme sáng/tối
if (typeof MutationObserver !== 'undefined') {
    const themeObserver = new MutationObserver(() => {
        if (dashboardData && dashboardData.charts) {
            renderCharts(dashboardData.charts, currentPeriod);
        }
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
}

async function loadDashboardData() {
    try {
        let pKey = '1d';
        if (currentPeriod.includes('7')) pKey = '7d';
        else if (currentPeriod.includes('Tháng')) pKey = 'month';
        else if (currentPeriod.includes('Quý')) pKey = 'quarter';

        if (window.AdminDashboardAPI && typeof window.AdminDashboardAPI.getOverview === 'function') {
            dashboardData = await window.AdminDashboardAPI.getOverview(pKey);
        }
    } catch (err) {
        console.warn('Lỗi kết nối API Dashboard:', err);
    }

    if (dashboardData) {
        renderDashboardStats(dashboardData.stats);
        renderCharts(dashboardData.charts, currentPeriod);
        renderRecentTransactions(dashboardData.recentTransactions);
        renderTopReaders(dashboardData.topReaders);
        renderTopBooksOverview(dashboardData.topBooks);
        renderLowestRatedBooks(dashboardData.lowestRatedBooks);
    }
}

// 1. RENDER 4 STAT CARDS
function renderDashboardStats(stats) {
    if (!stats) return;

    // Card 1: Doanh Thu
    const elRev = document.getElementById('statTotalRevenue');
    if (elRev) elRev.innerText = stats.totalRevenueFormatted || `${Number(stats.totalRevenue || 0).toLocaleString()} đ`;
    const elHovTotalRev = document.getElementById('statHoverTotalRev');
    if (elHovTotalRev) elHovTotalRev.innerText = stats.allTimeRevenueFormatted || '5.0 Tr đ';
    const elHovYearRev = document.getElementById('statHoverYearRev');
    if (elHovYearRev) elHovYearRev.innerText = stats.thisYearRevenueFormatted || '5.0 Tr đ';
    const elHovMonthRev = document.getElementById('statHoverMonthRev');
    if (elHovMonthRev) elHovMonthRev.innerText = stats.thisMonthRevenueFormatted || '4.0 Tr đ';

    // Card 2: Lượt Đọc
    const elReads = document.getElementById('statTotalReads');
    if (elReads) elReads.innerText = stats.totalReadsFormatted || `${Number(stats.totalReads || 0).toLocaleString()} lượt`;
    const elHovOnline = document.getElementById('statHoverOnlineReads');
    if (elHovOnline) elHovOnline.innerText = Number(stats.onlineReads || 0).toLocaleString();
    const elHovOffline = document.getElementById('statHoverOfflineReads');
    if (elHovOffline) elHovOffline.innerText = Number(stats.offlineDownloads || 0).toLocaleString();
    const elHovDaily = document.getElementById('statHoverDailyReads');
    if (elHovDaily) elHovDaily.innerText = Number(stats.dailyAvgReads || 0).toLocaleString();

    // Card 3: Độc Giả
    const elUsers = document.getElementById('statTotalUsers');
    if (elUsers) elUsers.innerText = stats.totalUsersFormatted || `${stats.totalUsers || 0} người`;
    const elVip = document.getElementById('statVipUsers');
    if (elVip) elVip.innerText = `${stats.vipUsers || 0} độc giả`;
    const elDailyLogins = document.getElementById('statDailyLogins');
    if (elDailyLogins) elDailyLogins.innerText = `${stats.dailyLogins || 0} hoạt động`;

    // Card 4: Kho Sách
    const elBooks = document.getElementById('statTotalBooks');
    if (elBooks) elBooks.innerText = stats.totalBooksFormatted || `${stats.totalBooks || 0} cuốn`;
    const elPublic = document.getElementById('statPublicBooks');
    if (elPublic) elPublic.innerText = `${stats.publicBooks || 0} xuất bản`;
}

// 2. RENDER 3 CHARTS
function renderCharts(charts, periodLabel) {
    if (!charts || typeof Chart === 'undefined') return;

    activeCharts.forEach((c) => {
        if (c && typeof c.destroy === 'function') c.destroy();
    });
    activeCharts = [];

    const isDark = document.documentElement.classList.contains('dark');
    const textColor = isDark ? '#94a3b8' : '#64748b';
    const gridColor = isDark ? 'rgba(51, 65, 85, 0.5)' : '#e2e8f0';
    const tooltipBg = isDark ? '#0f172a' : '#1e293b';

    Chart.defaults.font.family = "'Inter', sans-serif";
    Chart.defaults.color = textColor;

    // Subtitles
    const subRev = document.getElementById('subRevenueChart');
    if (subRev) subRev.innerText = `Đơn vị: Triệu VNĐ (${periodLabel})`;
    const subCat = document.getElementById('subCategoryChart');
    if (subCat) subCat.innerText = `Đơn vị: % (${periodLabel})`;
    const subPkg = document.getElementById('subPackageChart');
    if (subPkg) subPkg.innerText = `Đơn vị: Lượt nạp (${periodLabel})`;

    // 2.1 Revenue Trend Chart (Line)
    const revCtx = document.getElementById('revenueTrendChart');
    if (revCtx) {
        const revData = charts.revenueChart || {};
        const c1 = new Chart(revCtx, {
            type: 'line',
            data: {
                labels: revData.labels || ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '23:59'],
                datasets: [
                    {
                        label: 'Doanh thu thuần (Triệu VNĐ)',
                        data: revData.revenue || [0, 0, 0, 0, 0, 0, 0],
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        borderWidth: 2.5,
                        tension: 0.35,
                        fill: true,
                        pointBackgroundColor: '#ffffff',
                        pointBorderColor: '#3b82f6',
                        pointBorderWidth: 2,
                        pointRadius: 4,
                        pointHoverRadius: 6,
                    },
                    {
                        label: 'Chi phí bản quyền & server',
                        data: revData.cost || [0, 0, 0, 0, 0, 0, 0],
                        borderColor: '#f43f5e',
                        backgroundColor: 'transparent',
                        borderWidth: 2,
                        borderDash: [5, 5],
                        tension: 0.35,
                        fill: false,
                        pointBackgroundColor: '#ffffff',
                        pointBorderColor: '#f43f5e',
                        pointBorderWidth: 2,
                        pointRadius: 4,
                        pointHoverRadius: 6,
                    },
                ],
            },
            options: {
                animation: { duration: 500, easing: 'easeOutQuart' },
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            color: textColor,
                            font: { size: 11, family: 'Inter', weight: 'bold' },
                        },
                    },
                    tooltip: {
                        backgroundColor: tooltipBg,
                        padding: 12,
                        cornerRadius: 8,
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
                        grid: { color: gridColor },
                        ticks: { color: textColor, callback: (v) => v + ' Tr' },
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: textColor },
                    },
                },
            },
        });
        activeCharts.push(c1);
    }

    // 2.2 Category Doughnut Chart (%)
    const catCtx = document.getElementById('categoryDoughnutChart');
    if (catCtx) {
        const catData = charts.categoryChart || {};
        const c2 = new Chart(catCtx, {
            type: 'doughnut',
            data: {
                labels: catData.labels || ['Kinh tế', 'CNTT', 'Văn học', 'Kỹ năng'],
                datasets: [
                    {
                        data: catData.catPercentages || [35, 25, 20, 20],
                        backgroundColor: ['#3b82f6', '#14b8a6', '#6366f1', '#f59e0b', '#ec4899'],
                        borderWidth: 0,
                        hoverOffset: 6,
                    },
                ],
            },
            options: {
                animation: { duration: 500, easing: 'easeOutQuart' },
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            usePointStyle: true,
                            padding: 14,
                            color: textColor,
                            font: { size: 11, family: 'Inter', weight: 'bold' },
                            generateLabels: function (chart) {
                                const original = Chart.overrides.doughnut.plugins.legend.labels.generateLabels(chart);
                                return original.map((item, i) => {
                                    item.text = `${chart.data.labels[i]} (${chart.data.datasets[0].data[i]}%)`;
                                    return item;
                                });
                            },
                        },
                    },
                    tooltip: {
                        backgroundColor: tooltipBg,
                        padding: 10,
                        cornerRadius: 8,
                        callbacks: {
                            label: (ctx) => ` ${ctx.label}: ${ctx.parsed}% lượt đọc`,
                        },
                    },
                },
            },
        });
        activeCharts.push(c2);
    }

    // 2.3 Package Bar Chart
    const pkgCtx = document.getElementById('packageChart');
    if (pkgCtx) {
        const pkgData = charts.packageChart || {};
        const c3 = new Chart(pkgCtx, {
            type: 'bar',
            data: {
                labels: pkgData.labels || ['Gói 20k', 'Gói 50k', 'Gói 100k', 'Gói 200k', 'Gói 500k', 'Gói 1M'],
                datasets: [
                    {
                        label: 'Số lượng nạp',
                        data: pkgData.packageCounts || [4, 8, 6, 5, 2, 1],
                        backgroundColor: '#10b981',
                        borderRadius: 6,
                        barPercentage: 0.55,
                    },
                ],
            },
            options: {
                animation: { duration: 500, easing: 'easeOutQuart' },
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: tooltipBg,
                        padding: 10,
                        cornerRadius: 8,
                        callbacks: {
                            label: (ctx) => ` ${ctx.parsed.y} lượt nạp`,
                        },
                    },
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: gridColor },
                        ticks: { color: textColor, precision: 0, callback: (v) => v + ' lượt' },
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: textColor },
                    },
                },
            },
        });
        activeCharts.push(c3);
    }
}

// 3. RENDER RECENT TRANSACTIONS (5)
function renderRecentTransactions(transactions) {
    const container = document.getElementById('recentTransactionsTable');
    if (!container) return;

    const list = transactions || [];
    if (!list.length) {
        container.innerHTML =
            '<tr><td colspan="3" class="py-6 text-center text-slate-400 text-xs italic">Chưa có giao dịch gần đây</td></tr>';
        return;
    }

    container.innerHTML = list
        .map((tx) => {
            let badge =
                '<span class="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold text-[10px]">Đã duyệt</span>';
            if (tx.status === 'rejected') {
                badge =
                    '<span class="bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 px-2 py-0.5 rounded-full font-bold text-[10px]">Từ chối</span>';
            } else if (tx.status === 'pending') {
                badge =
                    '<span class="bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded-full font-bold text-[10px]">Chờ duyệt</span>';
            }

            return `
                <tr class="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td class="py-2.5 px-2 font-semibold text-slate-800 dark:text-slate-200">
                        <div class="truncate max-w-[140px]" title="${tx.userName}">${tx.userName}</div>
                        <div class="text-[9px] text-slate-400 font-mono">${tx.date || ''}</div>
                    </td>
                    <td class="py-2.5 px-2 font-bold text-blue-600 dark:text-blue-400 font-mono">
                        ${Number(tx.amount || 0).toLocaleString('vi-VN')} đ
                    </td>
                    <td class="py-2.5 px-2 text-right">${badge}</td>
                </tr>
            `;
        })
        .join('');
}

// 4. RENDER TOP READERS (3)
function renderTopReaders(readers) {
    const container = document.getElementById('topReadersContainer');
    if (!container) return;

    const list = readers || [];
    if (!list.length) {
        container.innerHTML = '<p class="text-xs text-slate-400 italic text-center py-4">Chưa có dữ liệu độc giả.</p>';
        return;
    }

    const rankColors = [
        'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 border border-amber-300',
        'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-300 border border-slate-300',
        'bg-orange-100 text-orange-800 dark:bg-orange-900/60 dark:text-orange-300 border border-orange-300',
    ];

    container.innerHTML = list
        .map(
            (u, i) => `
            <div class="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/40 transition">
                <div class="flex items-center space-x-3 min-w-0">
                    <div class="w-7 h-7 rounded-lg ${rankColors[i] || 'bg-slate-100'} flex items-center justify-center font-black text-xs shrink-0">#${i + 1}</div>
                    <div class="min-w-0">
                        <p class="text-xs font-bold text-slate-800 dark:text-slate-200 truncate" title="${u.name}">${u.name}</p>
                        <p class="text-[10px] text-slate-400 font-medium">${u.booksReadCount || 0} cuốn đã đọc</p>
                    </div>
                </div>
                <span class="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800 shrink-0 ml-2">
                    ${u.tier || 'Standard'}
                </span>
            </div>
        `
        )
        .join('');
}

// 5. RENDER TOP BOOKS OVERVIEW (3)
function renderTopBooksOverview(books) {
    const container = document.getElementById('topBooksOverviewContainer');
    if (!container) return;

    const list = books || [];
    if (!list.length) {
        container.innerHTML = '<p class="text-xs text-slate-400 italic text-center py-4">Chưa có dữ liệu sách nổi bật.</p>';
        return;
    }

    const rankBadges = [
        'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 border-amber-300',
        'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-300 border-slate-300',
        'bg-orange-100 text-orange-800 dark:bg-orange-900/60 dark:text-orange-300 border-orange-300',
    ];

    container.innerHTML = list
        .map(
            (b, i) => `
            <div class="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/40 transition">
                <div class="flex items-center space-x-3 min-w-0">
                    <span class="w-7 h-7 rounded-lg ${rankBadges[i] || 'bg-slate-100'} border flex items-center justify-center font-black text-xs shrink-0">#${i + 1}</span>
                    <img src="${b.coverUrl}" alt="${b.title}" class="w-8 h-11 object-cover rounded shadow-xs shrink-0 border border-slate-200 dark:border-slate-700" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80'">
                    <div class="min-w-0">
                        <p class="text-xs font-bold text-slate-800 dark:text-slate-200 truncate" title="${b.title}">${b.title}</p>
                        <p class="text-[10px] text-slate-400 font-semibold font-mono">${Number(b.reads || 0).toLocaleString()} lượt đọc</p>
                    </div>
                </div>
                <a href="/admin/quan-ly-sach?search=${encodeURIComponent(b.title || '')}&bookId=${b.id || ''}" data-admin-route="true" class="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline shrink-0 ml-2">Xem →</a>
            </div>
        `
        )
        .join('');
}

// 6. RENDER LOWEST RATED BOOKS (3)
function renderLowestRatedBooks(books) {
    const container = document.getElementById('lowestRatedBooksContainer');
    if (!container) return;

    const list = books || [];
    if (!list.length) {
        container.innerHTML = '<p class="text-xs text-slate-400 italic">Chưa có dữ liệu đánh giá cần lưu ý.</p>';
        return;
    }

    container.innerHTML = list
        .map((b) => {
            const score = parseFloat(b.rating || 3.0);
            const scoreColor = score < 3.5 ? 'text-rose-500' : 'text-amber-500';
            const badgeBg =
                score < 3.5
                    ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900'
                    : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900';
            const starIcon = score < 3.5 ? 'fa-solid fa-triangle-exclamation' : 'fa-solid fa-star-half-stroke';

            return `
                <div class="flex items-start justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/40 transition">
                    <div class="flex items-start space-x-2.5 min-w-0">
                        <div class="w-7 h-7 rounded-lg ${badgeBg} flex items-center justify-center ${scoreColor} text-xs shrink-0 border mt-0.5">
                            <i class="${starIcon}"></i>
                        </div>
                        <div class="min-w-0">
                            <p class="text-xs font-bold text-slate-800 dark:text-slate-200 truncate" title="${b.title}">${b.title}</p>
                            <p class="text-[10px] text-slate-400 font-medium">${b.author}</p>
                        </div>
                    </div>
                    <div class="text-right shrink-0 ml-2">
                        <span class="text-xs font-black ${scoreColor} font-mono">${score.toFixed(1)}/5.0</span>
                        <div class="text-[9px] text-slate-400">cần rà soát</div>
                    </div>
                </div>
            `;
        })
        .join('');
}

// 7. TIME FILTER BUTTONS
function setActiveFilter(btn) {
    const filters = document.querySelectorAll('.time-filter');
    filters.forEach((f) => {
        f.className =
            'time-filter px-4 py-1.5 text-xs font-bold rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-200 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-700 transition-colors border border-transparent cursor-pointer';
    });
    if (btn) {
        btn.className =
            'time-filter active-filter px-4 py-1.5 text-xs font-bold rounded-lg bg-blue-600 text-white shadow-sm transition-colors cursor-pointer';
        currentPeriod = btn.innerText.trim();
    }
    loadDashboardData();
    if (window.DB) window.DB.notify(`Đã cập nhật số liệu biểu đồ theo: ${currentPeriod}`, 'info');
}

// 8. XUẤT BÁO CÁO TỔNG QUAN QUA CUSTOM EXPORT MODAL
function exportOverview(type = 'excel') {
    const defaultFormat = String(type).toLowerCase() === 'pdf' ? 'pdf' : 'excel';

    const columns = [
        { key: 'period', label: 'Kỳ Thống Kê', isPrimary: true },
        { key: 'timePoint', label: 'Mốc Thời Gian', isPrimary: true },
        { key: 'revenueMil', label: 'Doanh Thu (Triệu VNĐ)', isPrimary: true },
        { key: 'revenueVnd', label: 'Doanh Thu Quy Đổi (VNĐ)', isPrimary: true },
        { key: 'costMil', label: 'Chi Phí Vận Hành (Triệu VNĐ)', isPrimary: true },
        { key: 'profitMil', label: 'Lợi Nhuận Gộp (Triệu VNĐ)', isPrimary: true },
        { key: 'packageCount', label: 'Lượt Nạp Gói Khoai', isPrimary: false },
        { key: 'topCategory', label: 'Danh Mục Sách Hàng Đầu', isPrimary: false },
    ];

    const revChart = dashboardData?.charts?.revenueChart || {};
    const pkgChart = dashboardData?.charts?.packageChart || {};
    const catChart = dashboardData?.charts?.categoryChart || {};

    const labels = revChart.labels || ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '23:59'];
    const revenue = revChart.revenue || [0, 0, 0, 0, 0, 0, 0];
    const cost = revChart.cost || [0, 0, 0, 0, 0, 0, 0];
    const packageCounts = pkgChart.packageCounts || [4, 8, 6, 5, 2, 1];
    const catLabels = catChart.labels || ['Kinh tế', 'CNTT', 'Văn học'];

    const formatters = {
        period: (r) => `"${r.period}"`,
        timePoint: (r) => `"${r.timePoint}"`,
        revenueMil: (r) => r.revenueMil,
        revenueVnd: (r) => `"${r.revenueVnd}"`,
        costMil: (r) => r.costMil,
        profitMil: (r) => r.profitMil,
        packageCount: (r) => r.packageCount,
        topCategory: (r) => `"${r.topCategory}"`,
    };

    const records = labels.map((lbl, idx) => {
        const rev = revenue[idx] || 0;
        const cst = cost[idx] || 0;
        return {
            period: currentPeriod,
            timePoint: lbl,
            revenueMil: rev,
            revenueVnd: (rev * 1000000).toLocaleString('vi-VN') + ' đ',
            costMil: cst,
            profitMil: Number((rev - cst).toFixed(2)),
            packageCount: packageCounts[idx % packageCounts.length] || 0,
            topCategory: catLabels[0] || 'Văn học',
        };
    });

    const timestamp = new Date().toISOString().slice(0, 10);
    const scopeLabel = currentPeriod.replace(/\s+/g, '');
    const defaultFilename = `HALMBOOK_TongQuan_${scopeLabel}_${timestamp}`;

    const executeExport = async (scope, selectedColumnKeys = [], format = 'excel', customFilename = null) => {
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
            const rows = records.map((r) =>
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
            // PDF Export via Print Window
            printDashboardStyledDoc(records, chosenCols, formatters, outName);
        }
    };

    if (window.halmExportDialog || (window.AdminUI && window.AdminUI.showExportModal)) {
        const openFn = window.halmExportDialog || window.AdminUI.showExportModal;
        openFn({
            title: 'Cấu Hình Xuất Báo Cáo Tổng Quan Hệ Thống',
            datasetName: 'Chỉ số Kinh Doanh & Hiệu Suất Đọc Sách',
            defaultFilename: defaultFilename,
            defaultFormat: defaultFormat,
            currentFilterDesc: `Kỳ hiển thị: ${currentPeriod} (${records.length} mốc thời gian)`,
            totalCount: records.length,
            filteredCount: records.length,
            columns: columns,
            data: { filtered: records, all: records },
            onExport: executeExport,
        });
    } else {
        executeExport('filtered', columns.filter((c) => c.isPrimary).map((c) => c.key), defaultFormat);
    }
}

function printDashboardStyledDoc(records, chosenCols, formatters, filename) {
    const stats = dashboardData?.stats || {};
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        window.print();
        return;
    }

    const rowsHtml = records
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
                    <div class="logo">🥔 HALMBOOK - TỔNG QUAN ĐIỀU HÀNH</div>
                    <div class="title" style="margin-top: 6px;">Báo Cáo Tổng Quan Hệ Thống & Hiệu Suất</div>
                    <div style="font-size: 12px; color: #475569;">Kỳ hiển thị: <strong>${currentPeriod}</strong> • Trích xuất ngày: ${new Date().toLocaleDateString('vi-VN')}</div>
                </div>
                <div class="meta">
                    <div>Mã báo cáo: <strong>DASH-${Date.now().toString().slice(-6)}</strong></div>
                    <div>Người lập biểu: Ban Quản Trị HalmBook</div>
                    <div>Hệ thống: Live MySQL Server</div>
                </div>
            </div>

            <div class="cards">
                <div class="card">
                    <div class="card-label">Tổng Doanh Thu</div>
                    <div class="card-val">${stats.totalRevenueFormatted || '5,019,000 đ'}</div>
                </div>
                <div class="card">
                    <div class="card-label">Lượt Đọc/Tải</div>
                    <div class="card-val">${stats.totalReadsFormatted || '284 lượt'}</div>
                </div>
                <div class="card">
                    <div class="card-label">Độc Giả Hoạt Động</div>
                    <div class="card-val">${stats.totalUsersFormatted || '7 người'}</div>
                </div>
                <div class="card">
                    <div class="card-label">Tổng Kho Sách</div>
                    <div class="card-val">${stats.totalBooksFormatted || '14 cuốn'}</div>
                </div>
            </div>

            <h4 style="font-size: 14px; font-weight: 800; margin-bottom: 8px;">Chi Tiết Chỉ Số Theo Mốc</h4>
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
                    <div><em>* Dữ liệu điều hành được tổng hợp trực tiếp từ cơ sở dữ liệu HALMBOOK.</em></div>
                </div>
                <div class="sign-box">
                    <strong>GIÁM SÁT HỆ THỐNG</strong>
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
window.setActiveFilter = setActiveFilter;
window.exportOverview = exportOverview;
window.exportOverviewExcel = () => exportOverview('excel');
window.loadDashboardData = loadDashboardData;
