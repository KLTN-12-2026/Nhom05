/**
 * financePage.js
 * Quản trị Tài chính & Dòng tiền cho Admin Portal (HALM BOOK)
 * Tích hợp dữ liệu thời gian thực từ Backend Spring Boot API
 */

let allTxs = [];
let currentTimeFilter = '7d';
let finCharts = [];
let currentPeriodConfigs = null;

// Cấu hình dự phòng nếu mạng gián đoạn
const FINANCE_PERIOD_CONFIG_FALLBACK = {
    '1d': {
        sub1: 'Đơn vị: Triệu VNĐ (Hôm nay)',
        sub2: 'Đơn vị: Tỷ lệ phần trăm (%) - Hôm nay',
        sub3: 'Đơn vị: Lượt nạp (Hôm nay)',
        chart1: {
            labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '23:59'],
            data: [0, 0, 0, 0, 0, 0, 0]
        },
        chart2: {
            labels: ['Ví MoMo', 'Ví ZaloPay', 'Chuyển khoản Ngân hàng'],
            data: [0, 0, 0]
        },
        chart3: {
            labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '23:59'],
            data: [0, 0, 0, 0, 0, 0, 0]
        }
    },
    '7d': {
        sub1: 'Đơn vị: Triệu VNĐ (7 ngày gần nhất)',
        sub2: 'Đơn vị: Tỷ lệ phần trăm (%) - MoMo, ZaloPay, VietQR',
        sub3: 'Đơn vị: Lượt giao dịch (7 ngày gần nhất)',
        chart1: {
            labels: ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'],
            data: [0, 0, 0, 0, 0, 0, 0]
        },
        chart2: {
            labels: ['Ví MoMo', 'Ví ZaloPay', 'Chuyển khoản Ngân hàng'],
            data: [45, 30, 25]
        },
        chart3: {
            labels: ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'],
            data: [0, 0, 0, 0, 0, 0, 0]
        }
    },
    '30d': {
        sub1: 'Đơn vị: Triệu VNĐ (30 ngày gần nhất)',
        sub2: 'Đơn vị: Tỷ lệ phần trăm (%) - 30 ngày',
        sub3: 'Đơn vị: Lượt giao dịch (30 ngày gần nhất)',
        chart1: {
            labels: ['Tuần 1', 'Tuần 2', 'Tuần 3', 'Tuần 4'],
            data: [0, 0, 0, 0]
        },
        chart2: {
            labels: ['Ví MoMo', 'Ví ZaloPay', 'Chuyển khoản Ngân hàng'],
            data: [40, 35, 25]
        },
        chart3: {
            labels: ['Tuần 1', 'Tuần 2', 'Tuần 3', 'Tuần 4'],
            data: [0, 0, 0, 0]
        }
    },
    'all': {
        sub1: 'Đơn vị: Triệu VNĐ (Toàn bộ thời gian)',
        sub2: 'Đơn vị: Tỷ lệ phần trăm (%) - Toàn bộ',
        sub3: 'Đơn vị: Lượt giao dịch (Toàn bộ thời gian)',
        chart1: {
            labels: ['Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11'],
            data: [0, 0, 0, 0, 0, 0]
        },
        chart2: {
            labels: ['Ví MoMo', 'Ví ZaloPay', 'Chuyển khoản Ngân hàng'],
            data: [38, 32, 30]
        },
        chart3: {
            labels: ['Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11'],
            data: [0, 0, 0, 0, 0, 0]
        }
    }
};

function getPeriodDisplayText(period) {
    const today = new Date();
    const formatDate = (d) => {
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yyyy = d.getFullYear();
        return `${dd}/${mm}/${yyyy}`;
    };

    if (period === '1d') {
        return `Giai đoạn: Hôm nay (${formatDate(today)})`;
    } else if (period === '7d') {
        const start = new Date(today);
        start.setDate(today.getDate() - 6);
        return `Giai đoạn: 7 ngày gần nhất (${formatDate(start)} - ${formatDate(today)})`;
    } else if (period === '30d') {
        const start = new Date(today);
        start.setDate(today.getDate() - 29);
        return `Giai đoạn: 30 ngày gần nhất (${formatDate(start)} - ${formatDate(today)})`;
    } else {
        return 'Giai đoạn: Toàn bộ thời gian';
    }
}

// Khởi chạy khi DOM sẵn sàng
document.addEventListener('DOMContentLoaded', function () {
    loadFinanceData();
    const displayEl = document.getElementById('periodDisplayText');
    if (displayEl) {
        displayEl.innerText = getPeriodDisplayText(currentTimeFilter);
    }
});

function setTimeFilter(period, btn) {
    currentTimeFilter = period;

    const buttons = document.querySelectorAll('.time-filter');
    buttons.forEach((b) => {
        b.className =
            'time-filter px-4 py-1.5 text-xs font-bold rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-200 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-700 transition-colors border border-transparent';
    });
    if (btn) {
        btn.className =
            'time-filter active-filter px-4 py-1.5 text-xs font-bold rounded-lg bg-blue-600 text-white shadow-sm transition-colors border border-transparent';
    }

    const displayEl = document.getElementById('periodDisplayText');
    if (displayEl) {
        displayEl.innerText = getPeriodDisplayText(period);
    }

    // Tải lại dữ liệu thật tương ứng với kỳ lọc mới
    loadFinanceData();

    const periodLabels = {
        '1d': 'Hôm nay (1 ngày)',
        '7d': '7 ngày gần nhất',
        '30d': '30 ngày gần nhất',
        all: 'Toàn bộ thời gian',
    };
    if (window.DB && typeof DB.notify === 'function') {
        DB.notify(`Đã cập nhật dữ liệu tài chính: ${periodLabels[period] || period}`, 'info');
    }
}

async function loadFinanceData() {
    try {
        if (window.AdminFinanceAPI) {
            // 1. Tải Summary & Chart configurations từ Backend API thật
            if (typeof window.AdminFinanceAPI.getSummary === 'function') {
                const sumRes = await window.AdminFinanceAPI.getSummary(currentTimeFilter);
                if (sumRes) {
                    currentPeriodConfigs = sumRes.periodConfigs || null;
                    renderFinanceSummaryCards(sumRes);
                }
            }

            // 2. Tải danh sách Giao dịch chi tiết từ Backend API thật
            if (typeof window.AdminFinanceAPI.getTransactions === 'function') {
                const txRes = await window.AdminFinanceAPI.getTransactions({ period: currentTimeFilter });
                allTxs = Array.isArray(txRes) ? txRes : (txRes.transactions || []);
            }
        } else if (window.DB) {
            allTxs = window.DB.getTransactions();
        }
    } catch (err) {
        console.warn('Lỗi kết nối API tài chính, dùng dữ liệu dự phòng:', err);
        if (window.DB) allTxs = window.DB.getTransactions();
    }

    initFinanceCharts(currentTimeFilter);
    filterTransactions();
}

function renderFinanceSummaryCards(sumRes) {
    if (!sumRes) return;

    const elApp = document.getElementById('statApprovedRevenue');
    if (elApp) elApp.innerText = Number(sumRes.approvedRevenue || 0).toLocaleString('vi-VN') + ' đ';

    const elAppCount = document.getElementById('statApprovedCount');
    if (elAppCount) elAppCount.innerText = `${sumRes.approvedCount || 0} giao dịch thành công`;

    const elPen = document.getElementById('statPendingRevenue');
    if (elPen) elPen.innerText = Number(sumRes.pendingRevenue || 0).toLocaleString('vi-VN') + ' đ';

    const elCount = document.getElementById('statPendingTxCount');
    if (elCount) elCount.innerText = `${sumRes.pendingCount || 0} giao dịch chờ kiểm tra`;

    const elPotatoes = document.getElementById('statTotalPotatoes');
    if (elPotatoes) elPotatoes.innerText = `${Number(sumRes.totalPotatoes || 0).toLocaleString('vi-VN')} 🥔`;

    const elTotalCount = document.getElementById('statTotalTxsCount');
    if (elTotalCount) elTotalCount.innerText = `${sumRes.totalTxsCount || allTxs.length} lượt giao dịch`;
}

function initFinanceCharts(period = currentTimeFilter) {
    finCharts.forEach((c) => {
        if (c && typeof c.destroy === 'function') c.destroy();
    });
    finCharts = [];

    const isDark = document.documentElement.classList.contains('dark');
    const textColor = isDark ? '#94a3b8' : '#64748b';
    const gridColor = isDark ? 'rgba(51, 65, 85, 0.5)' : 'rgba(226, 232, 240, 0.8)';
    const tooltipBg = isDark ? '#0f172a' : '#1e293b';
    const tooltipBorder = isDark ? '#334155' : '#475569';

    if (typeof Chart === 'undefined') return;

    Chart.defaults.font.family = "'Inter', sans-serif";
    Chart.defaults.color = textColor;

    // Lấy config thật từ Backend hoặc Fallback
    const periodDataMap = currentPeriodConfigs || FINANCE_PERIOD_CONFIG_FALLBACK;
    const cfg = periodDataMap[period] || periodDataMap['7d'] || FINANCE_PERIOD_CONFIG_FALLBACK['7d'];

    // Cập nhật Subtitles
    const sub1 = document.getElementById('subFinChart1');
    if (sub1 && cfg.sub1) sub1.innerText = cfg.sub1;
    const sub2 = document.getElementById('subFinChart2');
    if (sub2 && cfg.sub2) sub2.innerText = cfg.sub2;
    const sub3 = document.getElementById('subFinChart3');
    if (sub3 && cfg.sub3) sub3.innerText = cfg.sub3;

    // ==========================================
    // Biểu đồ 1: Doanh Thu Nạp Tiền & Điểm Khoai (Line Chart)
    // ==========================================
    const ctx1 = document.getElementById('finChart1');
    if (ctx1) {
        const c1 = new Chart(ctx1.getContext('2d'), {
            type: 'line',
            data: {
                labels: cfg.chart1?.labels || [],
                datasets: [
                    {
                        label: 'Doanh thu nạp khoai',
                        data: cfg.chart1?.data || [],
                        borderColor: '#2563eb',
                        backgroundColor: 'rgba(37, 99, 235, 0.12)',
                        pointBackgroundColor: '#2563eb',
                        pointHoverRadius: 6,
                        borderWidth: 2.5,
                        fill: true,
                        tension: 0.35,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 500, easing: 'easeOutQuart' },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: tooltipBg,
                        borderColor: tooltipBorder,
                        borderWidth: 1,
                        titleColor: '#f8fafc',
                        bodyColor: '#e2e8f0',
                        padding: 10,
                        cornerRadius: 8,
                        callbacks: {
                            label: function (context) {
                                const val = context.parsed.y;
                                const fullVnd = Math.round(val * 1000000).toLocaleString('vi-VN');
                                return ` Doanh thu: ${val} triệu (${fullVnd} VNĐ)`;
                            },
                        },
                    },
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: gridColor, borderDash: [4, 4], drawBorder: false },
                        ticks: {
                            color: textColor,
                            callback: function (value) {
                                return value + ' Tr';
                            },
                        },
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: textColor },
                    },
                },
            },
        });
        finCharts.push(c1);
    }

    // ==========================================
    // Biểu đồ 2: Tỉ Lệ Phương Thức Thanh Toán (Doughnut Chart)
    // ==========================================
    const ctx2 = document.getElementById('finChart2');
    if (ctx2) {
        const methodLabels = cfg.chart2?.labels || ['Ví MoMo', 'Ví ZaloPay', 'Chuyển khoản Ngân hàng'];
        const methodData = cfg.chart2?.data || [0, 0, 0];
        const methodColors = ['#ec4899', '#0ea5e9', '#3b82f6']; // MoMo (hồng tím), ZaloPay (xanh da trời), VietQR/Bank (xanh dương)

        const c2 = new Chart(ctx2.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: methodLabels,
                datasets: [
                    {
                        data: methodData,
                        backgroundColor: methodColors,
                        borderColor: isDark ? '#1e293b' : '#ffffff',
                        borderWidth: 2,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 500, easing: 'easeOutQuart' },
                cutout: '66%',
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            color: textColor,
                            boxWidth: 12,
                            padding: 10,
                            font: { size: 11, weight: 'bold' },
                            generateLabels: function (chart) {
                                const data = chart.data;
                                if (data.labels.length && data.datasets.length) {
                                    return data.labels.map((label, i) => {
                                        const val = data.datasets[0].data[i] || 0;
                                        return {
                                            text: `${label}: ${val}%`,
                                            fillStyle: data.datasets[0].backgroundColor[i],
                                            strokeStyle: data.datasets[0].backgroundColor[i],
                                            lineWidth: 0,
                                            hidden: false,
                                            index: i,
                                        };
                                    });
                                }
                                return [];
                            },
                        },
                    },
                    tooltip: {
                        backgroundColor: tooltipBg,
                        borderColor: tooltipBorder,
                        borderWidth: 1,
                        titleColor: '#f8fafc',
                        bodyColor: '#e2e8f0',
                        padding: 10,
                        cornerRadius: 8,
                        callbacks: {
                            label: function (context) {
                                return ` ${context.label}: ${context.parsed}% tổng giao dịch`;
                            },
                        },
                    },
                },
            },
        });
        finCharts.push(c2);
    }

    // ==========================================
    // Biểu đồ 3: Số Lượt Giao Dịch Nạp Khoai (Bar Chart)
    // ==========================================
    const ctx3 = document.getElementById('finChart3');
    if (ctx3) {
        const c3 = new Chart(ctx3.getContext('2d'), {
            type: 'bar',
            data: {
                labels: cfg.chart3?.labels || [],
                datasets: [
                    {
                        label: 'Số lượt giao dịch',
                        data: cfg.chart3?.data || [],
                        backgroundColor: '#6366f1',
                        hoverBackgroundColor: '#4f46e5',
                        borderRadius: 6,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 500, easing: 'easeOutQuart' },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: tooltipBg,
                        borderColor: tooltipBorder,
                        borderWidth: 1,
                        titleColor: '#f8fafc',
                        bodyColor: '#e2e8f0',
                        padding: 10,
                        cornerRadius: 8,
                        callbacks: {
                            label: function (context) {
                                return ` Số lượng: ${context.parsed.y} lượt nạp`;
                            },
                        },
                    },
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: gridColor, borderDash: [4, 4], drawBorder: false },
                        ticks: {
                            color: textColor,
                            precision: 0,
                            callback: function (value) {
                                return value + ' lượt';
                            },
                        },
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: textColor },
                    },
                },
            },
        });
        finCharts.push(c3);
    }
}

// Tự động re-render biểu đồ khi bật/tắt Dark Mode
if (typeof MutationObserver !== 'undefined') {
    const themeObserver = new MutationObserver(() => {
        initFinanceCharts(currentTimeFilter);
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
}

const FINANCE_PAGE_SIZE = 6;
let currentFinancePage = 1;
let lastDisplayTxs = [];

function renderTransactionsTable(txs) {
    const tbody = document.getElementById('transactionsTableBody');
    if (!tbody) return;

    const items = txs || [];
    const totalItems = items.length;
    const totalPages = Math.ceil(totalItems / FINANCE_PAGE_SIZE) || 1;

    if (currentFinancePage > totalPages) currentFinancePage = totalPages;
    if (currentFinancePage < 1) currentFinancePage = 1;

    const startIndex = (currentFinancePage - 1) * FINANCE_PAGE_SIZE;
    const endIndex = Math.min(startIndex + FINANCE_PAGE_SIZE, totalItems);
    const pageItems = items.slice(startIndex, endIndex);

    renderFinancePagination(totalItems, currentFinancePage, totalPages, startIndex, endIndex);

    if (pageItems.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" class="py-12 text-center text-slate-400 font-bold"><div class="flex flex-col items-center justify-center gap-2"><i class="fa-solid fa-receipt text-3xl text-slate-300 dark:text-slate-600"></i><span>Không tìm thấy giao dịch nào phù hợp với bộ lọc.</span></div></td></tr>`;
        return;
    }

    tbody.innerHTML = pageItems
        .map((tx) => {
            const badge = window.AdminUI
                ? window.AdminUI.renderBadge(tx.status)
                : `<span class="px-2 py-0.5 rounded text-[10px] font-bold">${tx.status}</span>`;
            const avatarHtml = window.AdminUI
                ? window.AdminUI.renderAvatar({ name: tx.userName, size: 'w-7 h-7', textSize: 'text-[10px]' })
                : '';

            let actions = '';
            if (tx.status === 'pending') {
                actions = `
                    <div class="flex items-center justify-center space-x-1">
                        <button onclick="approveTx('${tx.id}')" class="p-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded border border-emerald-500 shadow-sm transition cursor-pointer" title="Duyệt giao dịch"><i class="fa-solid fa-check text-[11px]"></i></button>
                        <button onclick="rejectTx('${tx.id}')" class="p-1 bg-rose-600 hover:bg-rose-700 text-white rounded border border-rose-500 shadow-sm transition cursor-pointer" title="Từ chối"><i class="fa-solid fa-xmark text-[11px]"></i></button>
                    </div>
                `;
            } else {
                actions = `<span class="text-slate-400 text-[11px] font-mono italic">Đã xử lý</span>`;
            }

            return `
                <tr class="hover:bg-blue-50/30 dark:hover:bg-slate-800/50 transition">
                    <td class="py-3 px-3 text-center border-r border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-600 dark:text-gray-300 w-px whitespace-nowrap">${tx.code}</td>
                    <td class="py-3 px-4 border-r border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-white">
                        <div class="flex items-center space-x-2.5">
                            ${avatarHtml}
                            <div class="break-words whitespace-normal" title="${tx.userName}">${tx.userName}</div>
                        </div>
                    </td>
                    <td class="py-3 px-4 border-r border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-gray-200 w-px whitespace-nowrap"><div class="break-words whitespace-normal" title="${tx.type}">${tx.type}</div></td>
                    <td class="py-3 px-3 text-center border-r border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 dark:text-slate-400 w-px whitespace-nowrap">${tx.method || 'Chuyển khoản'}</td>
                    <td class="py-3 px-3 text-center border-r border-slate-200 dark:border-slate-700 font-black text-blue-600 font-mono w-px whitespace-nowrap">${Number(tx.amount || 0).toLocaleString('vi-VN')} đ</td>
                    <td class="py-3 px-3 text-center border-r border-slate-200 dark:border-slate-700 font-black text-slate-500 font-mono w-px whitespace-nowrap">+${tx.potatoes || 0} 🥔</td>
                    <td class="py-3 px-3 text-center border-r border-slate-200 dark:border-slate-700 text-[11px] font-mono text-slate-400 w-px whitespace-nowrap">${tx.createdAt}</td>
                    <td class="py-3 px-3 border-r border-slate-200 dark:border-slate-700 text-center w-px whitespace-nowrap text-center">${badge}</td>
                    <td class="py-3 px-2 border-r border-slate-200 dark:border-slate-700 text-center w-px whitespace-nowrap">${actions}</td>
                </tr>
            `;
        })
        .join('');
}

function renderFinancePagination(totalItems, currentPage, totalPages, startIndex, endIndex) {
    const infoEl = document.getElementById('txPaginationInfo');
    if (infoEl) {
        if (totalItems === 0) {
            infoEl.innerHTML = `Hiển thị <span class="font-black text-slate-700 dark:text-white">0</span> giao dịch`;
        } else {
            infoEl.innerHTML = `Hiển thị <span class="text-blue-600 dark:text-blue-400 font-black">${startIndex + 1} - ${endIndex}</span> trên tổng số <span class="font-black text-slate-700 dark:text-white">${totalItems}</span> giao dịch`;
        }
    }

    const ctrlEl = document.getElementById('txPaginationControls');
    if (!ctrlEl) return;

    if (totalPages <= 1) {
        ctrlEl.innerHTML = '';
        return;
    }

    let buttonsHtml = '';

    // Nút Trước
    const prevDisabled = currentPage === 1;
    buttonsHtml += `
        <button onclick="changeFinancePage(${currentPage - 1})" ${prevDisabled ? 'disabled' : ''} class="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-600 ${prevDisabled ? 'opacity-40 cursor-not-allowed text-slate-400' : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-gray-200 hover:bg-slate-100 dark:hover:bg-slate-600 cursor-pointer'} transition">
            <i class="fa-solid fa-chevron-left text-[10px] mr-1"></i>Trước
        </button>
    `;

    // Danh sách số trang
    for (let p = 1; p <= totalPages; p++) {
        const isActive = p === currentPage;
        buttonsHtml += `
            <button onclick="changeFinancePage(${p})" class="w-7 h-7 text-xs font-bold rounded-lg border ${isActive ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-gray-200 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600'} transition cursor-pointer">
                ${p}
            </button>
        `;
    }

    // Nút Sau
    const nextDisabled = currentPage === totalPages;
    buttonsHtml += `
        <button onclick="changeFinancePage(${currentPage + 1})" ${nextDisabled ? 'disabled' : ''} class="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-600 ${nextDisabled ? 'opacity-40 cursor-not-allowed text-slate-400' : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-gray-200 hover:bg-slate-100 dark:hover:bg-slate-600 cursor-pointer'} transition">
            Sau<i class="fa-solid fa-chevron-right text-[10px] ml-1"></i>
        </button>
    `;

    ctrlEl.innerHTML = buttonsHtml;
}

function changeFinancePage(newPage) {
    currentFinancePage = newPage;
    renderTransactionsTable(lastDisplayTxs);
}

function filterTransactions() {
    const query = (document.getElementById('txSearchInput')?.value || '').toLowerCase().trim();
    const status = document.getElementById('txStatusFilter')?.value || '';

    lastDisplayTxs = allTxs.filter((t) => {
        const matchQ =
            !query ||
            (t.code && t.code.toLowerCase().includes(query)) ||
            (t.userName && t.userName.toLowerCase().includes(query)) ||
            (t.type && t.type.toLowerCase().includes(query)) ||
            (t.method && t.method.toLowerCase().includes(query));
        const matchStatus = !status || t.status === status;
        return matchQ && matchStatus;
    });

    const countEl = document.getElementById('txCountDisplay');
    if (countEl) {
        countEl.innerText = `Hiển thị ${lastDisplayTxs.length} / ${allTxs.length} giao dịch`;
    }

    currentFinancePage = 1;
    renderTransactionsTable(lastDisplayTxs);
}

function resetTxFilters() {
    const searchInput = document.getElementById('txSearchInput');
    const statusFilter = document.getElementById('txStatusFilter');
    if (searchInput) searchInput.value = '';
    if (statusFilter) statusFilter.value = '';
    currentFinancePage = 1;
    filterTransactions();
}

async function approveTx(id) {
    let confirmed = false;
    if (typeof window.halmConfirm === 'function') {
        confirmed = await window.halmConfirm({
            title: 'Duyệt Giao Dịch Nạp Tiền',
            message: 'Bạn có chắc chắn muốn duyệt đơn nạp tiền này? Hệ thống sẽ tự động cộng điểm Củ Khoai Tây vào ví của độc giả.',
            confirmText: 'Duyệt đơn',
            type: 'warning',
        });
    } else {
        confirmed = true;
    }
    if (!confirmed) return;

    try {
        if (window.AdminFinanceAPI && typeof window.AdminFinanceAPI.approve === 'function') {
            const res = await window.AdminFinanceAPI.approve(id);
            if (window.DB) window.DB.notify(res.message || 'Đã duyệt giao dịch thành công!', 'success');
        } else if (window.DB) {
            const tx = window.DB.approveTransaction(id);
            if (tx) window.DB.notify(`Đã duyệt giao dịch ${tx.code}!`, 'success');
        }
        await loadFinanceData();
    } catch (err) {
        if (window.DB) window.DB.notify('Lỗi khi duyệt giao dịch: ' + (err.response?.data?.message || err.message), 'error');
    }
}

async function rejectTx(id) {
    let reason = 'Chưa nhận được giao dịch thanh toán ngân hàng hợp lệ';
    if (window.AdminUI && typeof window.AdminUI.prompt === 'function') {
        reason = await window.AdminUI.prompt({
            title: 'Từ Chối Giao Dịch Tài Chính',
            message: 'Vui lòng cung cấp lý do từ chối giao dịch để gửi thông báo cho khách hàng.',
            label: 'Lý do từ chối *',
            defaultValue: reason,
            placeholder: 'Nhập lý do chi tiết...',
            requireInput: true,
            confirmText: 'Từ Chối Giao Dịch',
        });
        if (!reason) return;
    }

    try {
        if (window.AdminFinanceAPI && typeof window.AdminFinanceAPI.reject === 'function') {
            const res = await window.AdminFinanceAPI.reject(id, reason);
            if (window.DB) window.DB.notify(res.message || 'Đã từ chối giao dịch!', 'info');
        } else if (window.DB) {
            const tx = window.DB.rejectTransaction(id, reason);
            if (tx) window.DB.notify(`Đã từ chối giao dịch ${tx.code}.`, 'info');
        }
        await loadFinanceData();
    } catch (err) {
        if (window.DB) window.DB.notify('Lỗi khi từ chối giao dịch: ' + (err.response?.data?.message || err.message), 'error');
    }
}

function exportFinanceExcel() {
    const query = (document.getElementById('txSearchInput')?.value || '').trim();
    const status = document.getElementById('txStatusFilter')?.value || '';

    let filterDesc = [`Khoảng thời gian: ${currentTimeFilter}`];
    if (query) filterDesc.push(`Từ khóa: "${query}"`);
    if (status) filterDesc.push(`Trạng thái: ${status}`);
    const currentFilterDesc = filterDesc.join(', ');

    const filteredData = lastDisplayTxs.length > 0 ? lastDisplayTxs : allTxs;

    const columns = [
        { key: 'code', label: 'Mã Giao Dịch', isPrimary: true },
        { key: 'userName', label: 'Tên Khách Hàng', isPrimary: true },
        { key: 'type', label: 'Loại Dịch Vụ / Gói', isPrimary: true },
        { key: 'amount', label: 'Số Tiền (VNĐ)', isPrimary: true },
        { key: 'method', label: 'Phương Thức', isPrimary: true },
        { key: 'status', label: 'Trạng Thái', isPrimary: true },
        { key: 'createdAt', label: 'Thời Gian Giao Dịch', isPrimary: true },
        { key: 'userId', label: 'Mã Khách Hàng', isPrimary: false },
        { key: 'potatoes', label: 'Số Khoai Nhận (🥔)', isPrimary: false },
    ];

    const formatters = {
        code: (t) => `"${t.code || ''}"`,
        userName: (t) => `"${(t.userName || '').replace(/"/g, '""')}"`,
        type: (t) => `"${(t.type || '').replace(/"/g, '""')}"`,
        amount: (t) => t.amount || 0,
        method: (t) => `"${t.method || ''}"`,
        status: (t) => (t.status === 'approved' ? '"Đã duyệt"' : t.status === 'pending' ? '"Chờ xử lý"' : '"Đã từ chối"'),
        createdAt: (t) => `"${t.createdAt || ''}"`,
        userId: (t) => `"${t.userId || ''}"`,
        potatoes: (t) => t.potatoes || 0,
    };

    const executeExport = (scope, selectedColumnKeys = []) => {
        const txsToExport = scope === 'all' ? allTxs : filteredData;
        if (!txsToExport || txsToExport.length === 0) {
            if (window.DB) window.DB.notify('Không có dữ liệu giao dịch để xuất!', 'warning');
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

        const headers = chosenCols.map((c) => `"${c.label}"`);
        const rows = txsToExport.map((t) =>
            chosenCols.map((c) => (formatters[c.key] ? formatters[c.key](t) : '""')).join(',')
        );

        const csvContent = [headers.join(','), ...rows].join('\r\n');
        const timestamp = new Date().toISOString().slice(0, 10);
        const filename = `HALMBOOK_TaiChinh_${scope}_${currentTimeFilter}_${timestamp}.csv`;

        if (window.AdminUI && window.AdminUI.downloadCSV) {
            window.AdminUI.downloadCSV(filename, csvContent);
        } else {
            const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }

        if (window.DB)
            window.DB.notify(
                `Đã xuất thành công ${txsToExport.length} bản ghi giao dịch tài chính với ${chosenCols.length} cột!`,
                'success'
            );
    };

    if (window.AdminUI && typeof window.AdminUI.showExportModal === 'function') {
        window.AdminUI.showExportModal({
            title: 'Xuất Báo Cáo Tài Chính',
            datasetName: 'Giao Dịch Nạp Tiền & Tài Chính',
            defaultFilename: `HALMBOOK_TaiChinh_${currentTimeFilter}_${new Date().toISOString().slice(0, 10)}.csv`,
            currentFilterDesc: currentFilterDesc,
            totalCount: allTxs.length,
            filteredCount: filteredData.length,
            columns: columns,
            onExport: executeExport,
        });
    } else {
        executeExport('all');
    }
}

// Export các hàm ra window để tương tác HTML
window.approveTx = approveTx;
window.rejectTx = rejectTx;
window.setTimeFilter = setTimeFilter;
window.filterTransactions = filterTransactions;
window.resetTxFilters = resetTxFilters;
window.changeFinancePage = changeFinancePage;
window.exportFinanceExcel = exportFinanceExcel;
window.loadFinanceData = loadFinanceData;
