/**
 * rentalPage.js
 * Quản trị Giao Dịch Thuê Sách & Phân Quyền Đọc cho Admin Portal (HALM BOOK)
 * Tích hợp dữ liệu thời gian thực từ Backend Spring Boot API
 */

let allRentals = [];
let rentalChartInstance = null;
const RENTAL_PAGE_SIZE = 6;
let currentRentalPage = 1;
let lastFilteredRentals = [];

document.addEventListener('DOMContentLoaded', function () {
    loadRentals();
    if (window.DB && typeof window.DB.onUpdate === 'function') {
        window.DB.onUpdate(loadRentals);
    }
});

async function loadRentals() {
    try {
        if (window.AdminRentalAPI && typeof window.AdminRentalAPI.getList === 'function') {
            const res = await window.AdminRentalAPI.getList();
            allRentals = Array.isArray(res) ? res : [];
        } else if (window.DB) {
            allRentals = window.DB.getRentals();
        }
    } catch (err) {
        console.warn('Lỗi API thuê sách, dùng fallback DB:', err);
        if (window.DB) allRentals = window.DB.getRentals();
    }
    lastFilteredRentals = [...allRentals];
    currentRentalPage = 1;
    renderRentalsTable(lastFilteredRentals);
    await loadRentalSummaryAndChart();
}

async function loadRentalSummaryAndChart() {
    let summary = null;
    try {
        if (window.AdminRentalAPI && typeof window.AdminRentalAPI.getSummary === 'function') {
            summary = await window.AdminRentalAPI.getSummary();
        }
    } catch (e) {
        console.warn('Lỗi lấy dữ liệu summary thuê sách:', e);
    }

    const totalRentals = summary?.totalRentals ?? allRentals.length;
    const active = summary?.activeRentals ?? allRentals.filter((r) => r.status === 'active').length;
    const revoked =
        summary?.revokedRentals ?? allRentals.filter((r) => r.status === 'revoked' || r.status === 'rejected').length;
    const totalPotatoes =
        summary?.totalPotatoesSpent ?? allRentals.reduce((sum, r) => sum + (r.costPotatoes || 0), 0);

    const elTotRen = document.getElementById('statTotalRentals');
    if (elTotRen) elTotRen.innerText = totalRentals;
    const elAct = document.getElementById('statActiveRentals');
    if (elAct) elAct.innerText = active;
    const elRev = document.getElementById('statRevokedRentals');
    if (elRev) elRev.innerText = revoked;
    const elTot = document.getElementById('statTotalPotatoesSpent');
    if (elTot) elTot.innerText = `${totalPotatoes} 🥔`;

    renderRentalChart(summary?.chart);
}

function renderRentalChart(chartInfo) {
    const ctx = document.getElementById('rentalLineChart');
    if (!ctx || typeof Chart === 'undefined') return;

    if (rentalChartInstance) {
        rentalChartInstance.destroy();
        rentalChartInstance = null;
    }

    const isDark = document.documentElement.classList.contains('dark');
    const textColor = isDark ? '#94a3b8' : '#64748b';
    const gridColor = isDark ? 'rgba(51, 65, 85, 0.5)' : 'rgba(226, 232, 240, 0.8)';
    const tooltipBg = isDark ? '#0f172a' : '#1e293b';
    const tooltipBorder = isDark ? '#334155' : '#475569';

    Chart.defaults.font.family = "'Inter', sans-serif";
    Chart.defaults.color = textColor;

    const labels = chartInfo?.labels && chartInfo.labels.length > 0
        ? chartInfo.labels
        : ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];
    const data = chartInfo?.data && chartInfo.data.length > 0
        ? chartInfo.data
        : [0, 0, 0, 0, 0, 0, 0];

    rentalChartInstance = new Chart(ctx.getContext('2d'), {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Số Lượt Thuê Sách',
                    data: data,
                    borderColor: '#2563eb',
                    backgroundColor: 'rgba(37, 99, 235, 0.12)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.35,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    pointBackgroundColor: '#2563eb',
                    animation: { delay: (ctx) => ctx.dataIndex * 60 },
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 600,
                easing: 'easeOutQuart',
            },
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
                        label: (ctx) => ` Lượt thuê sách: ${ctx.parsed.y} lượt đọc`,
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
                        callback: (v) => `${v} lượt`,
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

// Auto update chart when dark mode toggles
if (typeof MutationObserver !== 'undefined') {
    const themeObserver = new MutationObserver(() => {
        loadRentalSummaryAndChart();
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
}

function renderRentalsTable(rentals) {
    const tbody = document.getElementById('rentalsTableBody');
    if (!tbody) return;

    const items = rentals || [];
    const totalItems = items.length;
    const totalPages = Math.ceil(totalItems / RENTAL_PAGE_SIZE) || 1;

    if (currentRentalPage > totalPages) currentRentalPage = totalPages;
    if (currentRentalPage < 1) currentRentalPage = 1;

    const startIndex = (currentRentalPage - 1) * RENTAL_PAGE_SIZE;
    const endIndex = Math.min(startIndex + RENTAL_PAGE_SIZE, totalItems);
    const pageItems = items.slice(startIndex, endIndex);

    renderRentalPagination(totalItems, currentRentalPage, totalPages, startIndex, endIndex);

    if (pageItems.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="py-12 text-center text-slate-400 font-bold">Không tìm thấy yêu cầu thuê sách nào phù hợp với bộ lọc.</td></tr>`;
        return;
    }

    tbody.innerHTML = pageItems
        .map((r) => {
            const badge = window.AdminUI
                ? window.AdminUI.renderBadge(r.status)
                : `<span class="px-2 py-0.5 rounded text-[10px] font-bold">${r.status}</span>`;
            const safeCover =
                r.bookCover ||
                'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80';
            const avatarHtml = window.AdminUI
                ? window.AdminUI.renderAvatar({ name: r.userName, size: 'w-7 h-7', textSize: 'text-[10px]' })
                : '';

            let actions = '';
            if (r.status === 'active') {
                actions = `
                    <div class="flex items-center justify-center">
                        <button onclick="revokeRental('${r.id}')" class="px-2.5 py-1 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 rounded-lg text-[10px] font-bold border border-rose-300 dark:border-rose-700 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition flex items-center space-x-1 cursor-pointer" title="Thu hồi quyền đọc sách">
                            <i class="fa-solid fa-ban"></i>
                            <span>Thu hồi quyền đọc</span>
                        </button>
                    </div>
                `;
            } else if (r.status === 'revoked') {
                actions = `<span class="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-bold text-[11px]"><i class="fa-solid fa-ban text-[10px]"></i>Đã thu hồi</span>`;
            } else {
                actions = `<span class="text-slate-400 text-[11px] italic">Đã hết hạn</span>`;
            }

            return `
                <tr class="hover:bg-blue-50/30 dark:hover:bg-slate-800/50 transition">
                    <td class="py-3 px-3 border-r border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-500 dark:text-slate-400 text-center w-px whitespace-nowrap">${r.code}</td>
                    <td class="py-3 px-4 border-r border-slate-200 dark:border-slate-700">
                        <div class="flex items-center space-x-3">
                            <img src="${safeCover}" alt="Cover" class="w-9 h-12 object-cover rounded border border-slate-300 dark:border-slate-600 shrink-0" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80'">
                            <div>
                                <div class="font-bold text-slate-800 dark:text-white break-words whitespace-normal" title="${r.bookTitle}">${r.bookTitle}</div>
                                <div class="text-[10px] text-slate-400 font-mono">Mã: ${r.bookId}</div>
                            </div>
                        </div>
                    </td>
                    <td class="py-3 px-4 border-r border-slate-200 dark:border-slate-700">
                        <div class="flex items-center space-x-2.5">
                            ${avatarHtml}
                            <div>
                                <div class="font-bold text-slate-800 dark:text-white break-words whitespace-normal" title="${r.userName}">${r.userName}</div>
                                <div class="text-[10px] text-slate-400 break-words whitespace-normal" title="${r.userEmail}">${r.userEmail}</div>
                            </div>
                        </div>
                    </td>
                    <td class="py-3 px-3 border-r border-slate-200 dark:border-slate-700 text-center w-px whitespace-nowrap">
                        <span class="bg-white dark:bg-gray-950 text-slate-700 dark:text-gray-300 font-bold px-2 py-0.5 rounded border border-indigo-900 text-[10px]">${r.duration}</span>
                    </td>
                    <td class="py-3 px-3 border-r border-slate-200 dark:border-slate-700 text-center font-black text-blue-600 font-mono w-px whitespace-nowrap">${r.costPotatoes} 🥔</td>
                    <td class="py-3 px-3 border-r border-slate-200 dark:border-slate-700 text-center text-[11px] text-slate-500 dark:text-slate-400 w-px whitespace-nowrap">
                        <div>${r.startDate}</div>
                        <div class="text-[10px] text-slate-400">đến ${r.endDate}</div>
                    </td>
                    <td class="py-3 px-3 border-r border-slate-200 dark:border-slate-700 text-center w-px whitespace-nowrap">${badge}</td>
                    <td class="py-3 px-4 text-center w-px whitespace-nowrap">${actions}</td>
                </tr>
            `;
        })
        .join('');
}

function renderRentalPagination(totalItems, currentPage, totalPages, startIndex, endIndex) {
    const infoEl = document.getElementById('rentalPaginationInfo');
    if (infoEl) {
        if (totalItems === 0) {
            infoEl.innerHTML = `Hiển thị <span class="font-black text-slate-700 dark:text-white">0</span> đơn thuê`;
        } else {
            infoEl.innerHTML = `Hiển thị <span class="text-blue-600 dark:text-blue-400 font-black">${startIndex + 1} - ${endIndex}</span> trên tổng số <span class="font-black text-slate-700 dark:text-white">${totalItems}</span> đơn thuê`;
        }
    }

    const ctrlEl = document.getElementById('rentalPaginationControls');
    if (!ctrlEl) return;

    if (totalPages <= 1) {
        ctrlEl.innerHTML = '';
        return;
    }

    let buttonsHtml = '';

    // Nút Trước
    const prevDisabled = currentPage === 1;
    buttonsHtml += `
        <button onclick="changeRentalPage(${currentPage - 1})" ${prevDisabled ? 'disabled' : ''} class="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-600 ${prevDisabled ? 'opacity-40 cursor-not-allowed text-slate-400' : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-gray-200 hover:bg-slate-100 dark:hover:bg-slate-600 cursor-pointer'} transition">
            <i class="fa-solid fa-chevron-left text-[10px] mr-1"></i>Trước
        </button>
    `;

    // Danh sách số trang
    for (let p = 1; p <= totalPages; p++) {
        const isActive = p === currentPage;
        buttonsHtml += `
            <button onclick="changeRentalPage(${p})" class="w-7 h-7 text-xs font-bold rounded-lg border ${isActive ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-gray-200 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600'} transition cursor-pointer">
                ${p}
            </button>
        `;
    }

    // Nút Sau
    const nextDisabled = currentPage === totalPages;
    buttonsHtml += `
        <button onclick="changeRentalPage(${currentPage + 1})" ${nextDisabled ? 'disabled' : ''} class="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-600 ${nextDisabled ? 'opacity-40 cursor-not-allowed text-slate-400' : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-gray-200 hover:bg-slate-100 dark:hover:bg-slate-600 cursor-pointer'} transition">
            Sau<i class="fa-solid fa-chevron-right text-[10px] ml-1"></i>
        </button>
    `;

    ctrlEl.innerHTML = buttonsHtml;
}

function changeRentalPage(newPage) {
    currentRentalPage = newPage;
    renderRentalsTable(lastFilteredRentals);
}

function filterRentalsTable() {
    const query = (document.getElementById('rentalSearchInput')?.value || '').toLowerCase().trim();
    const status = document.getElementById('rentalStatusFilter')?.value || '';

    lastFilteredRentals = allRentals.filter((r) => {
        const matchQ =
            !query ||
            (r.code && r.code.toLowerCase().includes(query)) ||
            (r.userName && r.userName.toLowerCase().includes(query)) ||
            (r.bookTitle && r.bookTitle.toLowerCase().includes(query)) ||
            (r.userEmail && r.userEmail.toLowerCase().includes(query)) ||
            (r.bookId && r.bookId.toLowerCase().includes(query));
        const matchStatus = !status || r.status === status;
        return matchQ && matchStatus;
    });

    const countEl = document.getElementById('rentalCountDisplay');
    if (countEl) {
        countEl.innerText = `Hiển thị ${lastFilteredRentals.length} / ${allRentals.length} đơn thuê`;
    }

    currentRentalPage = 1;
    renderRentalsTable(lastFilteredRentals);
}

function resetRentalFilters() {
    const searchInput = document.getElementById('rentalSearchInput');
    const statusFilter = document.getElementById('rentalStatusFilter');
    if (searchInput) searchInput.value = '';
    if (statusFilter) statusFilter.value = '';
    currentRentalPage = 1;
    filterRentalsTable();
}

async function revokeRental(id) {
    let confirmed = false;
    if (typeof window.halmConfirm === 'function') {
        confirmed = await window.halmConfirm({
            title: 'Thu Hồi Quyền Đọc Sách',
            message: 'Bạn có chắc chắn muốn thu hồi quyền đọc của độc giả đối với cuốn sách này? Độc giả sẽ không thể mở đọc tài liệu này nữa.',
            confirmText: 'Thu Hồi Quyền Đọc',
            type: 'danger',
        });
    } else if (window.AdminUI && typeof window.AdminUI.confirm === 'function') {
        confirmed = await window.AdminUI.confirm({
            title: 'Thu Hồi Quyền Đọc Sách?',
            message: 'Bạn có chắc chắn muốn thu hồi quyền đọc của độc giả đối với cuốn sách này?',
            confirmText: 'Thu Hồi Quyền Đọc',
            confirmType: 'danger',
        });
    } else {
        confirmed = true;
    }
    if (!confirmed) return;

    try {
        if (window.AdminRentalAPI && typeof window.AdminRentalAPI.revoke === 'function') {
            const res = await window.AdminRentalAPI.revoke(id);
            if (window.DB) window.DB.notify(res.message || 'Đã thu hồi quyền đọc sách!', 'warning');
        } else if (window.DB) {
            const rental = window.DB.revokeRental(id);
            if (rental && window.DB) window.DB.notify(`Đã thu hồi quyền đọc sách ${rental.code}.`, 'warning');
        }
        await loadRentals();
    } catch (err) {
        if (window.DB)
            window.DB.notify('Lỗi khi thu hồi quyền đọc: ' + (err.response?.data?.message || err.message), 'error');
    }
}

function exportRentalsExcel() {
    const query = (document.getElementById('rentalSearchInput')?.value || '').trim();
    const status = document.getElementById('rentalStatusFilter')?.value || '';

    let filterDesc = [];
    if (query) filterDesc.push(`Từ khóa: "${query}"`);
    if (status) filterDesc.push(`Trạng thái: ${status}`);
    const currentFilterDesc = filterDesc.length > 0 ? filterDesc.join(', ') : 'Tất cả trạng thái';

    const filteredData = lastFilteredRentals.length > 0 ? lastFilteredRentals : allRentals;

    const columns = [
        { key: 'code', label: 'Mã Thuê Sách', isPrimary: true },
        { key: 'userName', label: 'Tên Độc Giả', isPrimary: true },
        { key: 'bookTitle', label: 'Tên Đầu Sách', isPrimary: true },
        { key: 'duration', label: 'Thời Hạn Thuê', isPrimary: true },
        { key: 'costPotatoes', label: 'Chi Phí (Khoai 🥔)', isPrimary: true },
        { key: 'startDate', label: 'Ngày Bắt Đầu', isPrimary: true },
        { key: 'status', label: 'Trạng Thái', isPrimary: true },
        { key: 'userEmail', label: 'Email Độc Giả', isPrimary: false },
        { key: 'bookId', label: 'Mã Sách', isPrimary: false },
        { key: 'endDate', label: 'Ngày Hết Hạn', isPrimary: false },
    ];

    const formatters = {
        code: (r) => `"${r.code || ''}"`,
        userName: (r) => `"${(r.userName || '').replace(/"/g, '""')}"`,
        bookTitle: (r) => `"${(r.bookTitle || '').replace(/"/g, '""')}"`,
        duration: (r) => `"${(r.duration || '').replace(/"/g, '""')}"`,
        costPotatoes: (r) => r.costPotatoes || 0,
        startDate: (r) => `"${r.startDate || ''}"`,
        status: (r) => `"${(r.status || '').replace(/"/g, '""')}"`,
        userEmail: (r) => `"${(r.userEmail || '').replace(/"/g, '""')}"`,
        bookId: (r) => `"${r.bookId || ''}"`,
        endDate: (r) => `"${r.endDate || ''}"`,
    };

    const executeExport = (scope, selectedColumnKeys = []) => {
        const dataToExport = scope === 'all' ? allRentals : filteredData;
        if (!dataToExport || dataToExport.length === 0) {
            if (window.DB) window.DB.notify('Không có bản ghi nào để xuất!', 'warning');
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
        const rows = dataToExport.map((r) =>
            chosenCols.map((c) => (formatters[c.key] ? formatters[c.key](r) : '""')).join(',')
        );

        const csvContent = [headers.join(','), ...rows].join('\r\n');
        const timestamp = new Date().toISOString().slice(0, 10);
        const filename = `HALMBOOK_ThueSach_${scope}_${timestamp}.csv`;

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
                `Đã xuất thành công ${dataToExport.length} bản ghi giao dịch thuê sách với ${chosenCols.length} cột!`,
                'success'
            );
    };

    if (window.AdminUI && typeof window.AdminUI.showExportModal === 'function') {
        window.AdminUI.showExportModal({
            title: 'Xuất Báo Cáo Thuê Sách',
            datasetName: 'Giao Dịch Thuê Sách',
            defaultFilename: `HALMBOOK_ThueSach_${new Date().toISOString().slice(0, 10)}.csv`,
            currentFilterDesc: currentFilterDesc,
            totalCount: allRentals.length,
            filteredCount: filteredData.length,
            columns: columns,
            onExport: executeExport,
        });
    } else {
        executeExport('all');
    }
}

window.filterRentalsTable = filterRentalsTable;
window.resetRentalFilters = resetRentalFilters;
window.exportRentalsExcel = exportRentalsExcel;
window.changeRentalPage = changeRentalPage;
window.revokeRental = revokeRental;
window.loadRentals = loadRentals;
