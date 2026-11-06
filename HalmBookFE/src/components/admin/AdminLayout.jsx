import React from 'react';
import { useLegacyAdminPage } from './legacy-runtime';

const pageCode = "\n        document.addEventListener('DOMContentLoaded', function() {\n            renderDashboardStats();\n            initCharts();\n            renderRecentTransactions();\n            renderTopReaders();\n            renderLowestRatedBooks();\n\n            // Real-time auto sync\n            DB.onUpdate(function() {\n                renderDashboardStats();\n                renderRecentTransactions();\n                renderTopReaders();\n                renderLowestRatedBooks();\n            });\n        });\n\n        function renderDashboardStats() {\n            const stats = DB.getStats();\n            document.getElementById('statTotalRevenue').innerText = stats.totalRevenue.toLocaleString() + ' đ';\n            document.getElementById('statTotalReads').innerText = stats.totalReads.toLocaleString() + ' lượt';\n            document.getElementById('statTotalUsers').innerText = stats.totalUsers + ' người';\n            document.getElementById('statVipUsers').innerText = stats.vipUsers;\n            document.getElementById('statTotalBooks').innerText = stats.totalBooks + ' cuốn';\n            document.getElementById('statPublicBooks').innerText = stats.publicBooks;\n        }\n\n        \n        let activeCharts = [];\n        let currentPeriod = '1 Ngày';\n\n        const filterData = {\n            '1 Ngày': {\n                labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '23:59'],\n                revenue: [1.2, 0.6, 2.8, 5.4, 7.2, 9.8, 4.1],\n                cost: [0.5, 0.4, 1.1, 1.9, 2.5, 3.2, 1.4],\n                packageCounts: [45, 80, 140, 75, 25, 8],\n                catPercentages: [42, 33, 15, 10]\n            },\n            '7 Ngày': {\n                labels: ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'],\n                revenue: [14.5, 18.2, 22.0, 19.5, 31.0, 42.5, 38.0],\n                cost: [6.0, 7.5, 8.0, 7.0, 11.0, 14.5, 12.0],\n                packageCounts: [210, 380, 520, 290, 95, 20],\n                catPercentages: [45, 30, 15, 10]\n            },\n            '1 Tháng': {\n                labels: ['Tuần 1', 'Tuần 2', 'Tuần 3', 'Tuần 4'],\n                revenue: [62.0, 74.5, 81.0, 96.5],\n                cost: [25.0, 30.0, 34.0, 41.0],\n                packageCounts: [420, 850, 1200, 640, 210, 45],\n                catPercentages: [48, 28, 14, 10]\n            },\n            '1 Quý': {\n                labels: ['Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10 (Hiện tại)'],\n                revenue: [210, 190, 250, 284.5],\n                cost: [120, 110, 130, 140],\n                packageCounts: [1250, 2400, 3600, 1900, 650, 140],\n                catPercentages: [50, 25, 15, 10]\n            }\n        };\n\n        function initCharts(period = '1 Ngày') {\n            activeCharts.forEach(c => {\n                if (c && typeof c.destroy === 'function') c.destroy();\n            });\n            activeCharts = [];\n            Chart.defaults.font.family = \"'Inter', sans-serif\";\n            const data = filterData[period] || filterData['1 Ngày'];\n\n            // Update Subtitles\n            const subRev = document.getElementById('subRevenueChart');\n            if (subRev) subRev.innerText = `Đơn vị: Triệu VNĐ (${period})`;\n            const subCat = document.getElementById('subCategoryChart');\n            if (subCat) subCat.innerText = `Đơn vị: % (${period})`;\n            const subPkg = document.getElementById('subPackageChart');\n            if (subPkg) subPkg.innerText = `Đơn vị: Lượt nạp (${period})`;\n            \n            const revenueCtx = document.getElementById('revenueTrendChart');\n            if (revenueCtx) {\n                const c1 = new Chart(revenueCtx, {\n                    type: 'line',\n                    data: {\n                        labels: data.labels,\n                        datasets: [\n                            {\n                                label: 'Doanh thu (Triệu VNĐ)',\n                                data: data.revenue,\n                                borderColor: '#3b82f6',\n                                backgroundColor: 'rgba(59, 130, 246, 0.1)',\n                                borderWidth: 2.5,\n                                tension: 0.35,\n                                fill: true,\n                                pointBackgroundColor: '#ffffff',\n                                pointBorderColor: '#3b82f6',\n                                pointBorderWidth: 2,\n                                pointRadius: 4,\n                                pointHoverRadius: 6\n                            },\n                            {\n                                label: 'Chi phí bản quyền & server (Triệu VNĐ)',\n                                data: data.cost,\n                                borderColor: '#f43f5e',\n                                backgroundColor: 'transparent',\n                                borderWidth: 2,\n                                borderDash: [5, 5],\n                                tension: 0.35,\n                                fill: false,\n                                pointBackgroundColor: '#ffffff',\n                                pointBorderColor: '#f43f5e',\n                                pointBorderWidth: 2,\n                                pointRadius: 4,\n                                pointHoverRadius: 6\n                            }\n                        ]\n                    },\n                    options: {\n                        animation: { duration: 600, easing: 'easeOutQuart' },\n                        responsive: true,\n                        maintainAspectRatio: false,\n                        plugins: {\n                            legend: { \n                                position: 'top',\n                                labels: {\n                                    usePointStyle: true,\n                                    color: '#475569',\n                                    font: { size: 11, family: 'Inter', weight: 'bold' }\n                                }\n                            },\n                            tooltip: {\n                                backgroundColor: '#1e293b',\n                                titleColor: '#f1f5f9',\n                                bodyColor: '#cbd5e1',\n                                padding: 12,\n                                cornerRadius: 8,\n                                callbacks: {\n                                    label: function(ctx) {\n                                        const val = ctx.parsed.y;\n                                        const fullVnd = (val * 1000000).toLocaleString('vi-VN');\n                                        return ` ${ctx.dataset.label}: ${val} triệu VNĐ (${fullVnd} VNĐ)`;\n                                    }\n                                }\n                            }\n                        },\n                        scales: {\n                            y: {\n                                beginAtZero: true,\n                                grid: { color: '#e2e8f0', drawBorder: false },\n                                ticks: {\n                                    color: '#64748b',\n                                    callback: function(v) { return v; }\n                                }\n                            },\n                            x: {\n                                grid: { display: false },\n                                ticks: { color: '#64748b' }\n                            }\n                        }\n                    }\n                });\n                activeCharts.push(c1);\n            }\n\n            // Package Bar Chart\n            const packageCtx = document.getElementById('packageChart');\n            if (packageCtx) {\n                const c2 = new Chart(packageCtx, {\n                    type: 'bar',\n                    data: {\n                        labels: ['Gói 20k', 'Gói 50k', 'Gói 100k', 'Gói 200k', 'Gói 500k', 'Gói 1M'],\n                        datasets: [{\n                            label: 'Số lượng nạp',\n                            data: data.packageCounts,\n                            backgroundColor: '#10b981',\n                            borderRadius: 6,\n                            barPercentage: 0.55\n                        }]\n                    },\n                    options: {\n                        animation: { duration: 600, easing: 'easeOutQuart' },\n                        responsive: true,\n                        maintainAspectRatio: false,\n                        plugins: {\n                            legend: { display: false },\n                            tooltip: {\n                                backgroundColor: '#1e293b',\n                                titleColor: '#f1f5f9',\n                                bodyColor: '#cbd5e1',\n                                padding: 12,\n                                cornerRadius: 8,\n                                callbacks: {\n                                    label: ctx => ` ${ctx.parsed.y} lượt nạp`\n                                }\n                            }\n                        },\n                        scales: {\n                            y: {\n                                beginAtZero: true,\n                                grid: { color: '#e2e8f0', drawBorder: false },\n                                ticks: { color: '#64748b' }\n                            },\n                            x: {\n                                grid: { display: false },\n                                ticks: { color: '#64748b' }\n                            }\n                        }\n                    }\n                });\n                activeCharts.push(c2);\n            }\n\n            // Category Doughnut Chart (Percentage %)\n            const catCtx = document.getElementById('categoryDoughnutChart');\n            if (catCtx) {\n                const c3 = new Chart(catCtx, {\n                    type: 'doughnut',\n                    data: {\n                        labels: ['Kinh tế', 'CNTT', 'Văn học', 'Kỹ năng'],\n                        datasets: [{\n                            data: data.catPercentages,\n                            backgroundColor: [\n                                '#3b82f6',\n                                '#14b8a6',\n                                '#6366f1',\n                                '#94a3b8'\n                            ],\n                            borderWidth: 0,\n                            hoverOffset: 4\n                        }]\n                    },\n                    options: {\n                        animation: { duration: 600, easing: 'easeOutQuart' },\n                        responsive: true,\n                        maintainAspectRatio: false,\n                        cutout: '72%',\n                        plugins: {\n                            legend: {\n                                position: 'bottom',\n                                labels: {\n                                    usePointStyle: true,\n                                    padding: 16,\n                                    color: '#475569',\n                                    font: { size: 11, family: 'Inter', weight: 'bold' },\n                                    generateLabels: function(chart) {\n                                        const original = Chart.overrides.doughnut.plugins.legend.labels.generateLabels(chart);\n                                        return original.map((item, i) => {\n                                            item.text = `${chart.data.labels[i]} (${chart.data.datasets[0].data[i]}%)`;\n                                            return item;\n                                        });\n                                    }\n                                }\n                            },\n                            tooltip: {\n                                backgroundColor: '#1e293b',\n                                titleColor: '#f1f5f9',\n                                bodyColor: '#cbd5e1',\n                                padding: 10,\n                                cornerRadius: 8,\n                                callbacks: {\n                                    label: ctx => ` ${ctx.label}: ${ctx.parsed}% tổng lượt đọc`\n                                }\n                            }\n                        }\n                    }\n                });\n                activeCharts.push(c3);\n            }\n        }\n        \n        function renderRecentTransactions() {\n            const txs = DB.getTransactions().slice(0, 5);\n            const container = document.getElementById('recentTransactionsTable');\n            if (!container) return;\n\n            container.innerHTML = txs.map(tx => {\n                let badge = '<span class=\"bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full font-bold text-[10px]\">Chờ duyệt</span>';\n                if (tx.status === 'approved') {\n                    badge = '<span class=\"bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold text-[10px]\">Đã duyệt</span>';\n                } else if (tx.status === 'rejected') {\n                    badge = '<span class=\"bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 px-2 py-0.5 rounded-full font-bold text-[10px]\">Từ chối</span>';\n                }\n\n                return `\n                    <tr class=\"hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors\">\n                        <td class=\"py-2.5 px-2 font-semibold text-slate-800 dark:text-slate-200\">${tx.userName}</td>\n                        <td class=\"py-2.5 px-2 font-bold text-blue-600 dark:text-blue-400\">${tx.amount.toLocaleString()} đ</td>\n                        <td class=\"py-2.5 px-2 text-right\">${badge}</td>\n                    </tr>\n                `;\n            }).join('');\n        }\n\n        function renderTopReaders() {\n            const users = DB.getUsers().sort((a, b) => (b.booksReadCount || 0) - (a.booksReadCount || 0)).slice(0, 3);\n            const container = document.getElementById('topReadersContainer');\n            if (!container) return;\n\n            const rankColors = [\n                'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 border border-amber-300',\n                'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-300 border border-slate-300',\n                'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300 border border-orange-300'\n            ];\n\n            container.innerHTML = users.map((u, i) => `\n                <div class=\"flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/40 transition\">\n                    <div class=\"flex items-center space-x-3\">\n                        <div class=\"w-7 h-7 rounded-lg ${rankColors[i] || 'bg-slate-100'} flex items-center justify-center font-black text-xs shrink-0\">${i+1}</div>\n                        <div>\n                            <p class=\"text-xs font-bold text-slate-800 dark:text-slate-200\">${u.name}</p>\n                            <p class=\"text-[10px] text-slate-500\">${u.booksReadCount || 0} cuốn đã đọc</p>\n                        </div>\n                    </div>\n                    <span class=\"text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800\">${u.tier || 'Standard'}</span>\n                </div>\n            `).join('');\n        }\n\n        function renderLowestRatedBooks() {\n            const container = document.getElementById('lowestRatedBooksContainer');\n            if (!container) return;\n\n            const allBooks = DB.getBooks();\n            // Get books sorted by lowest rating\n            const lowestBooks = allBooks\n                .filter(b => b.rating !== undefined && b.rating !== null)\n                .sort((a, b) => parseFloat(a.rating) - parseFloat(b.rating))\n                .slice(0, 3);\n\n            if (!lowestBooks.length) {\n                container.innerHTML = '<p class=\"text-xs text-slate-400 italic\">Chưa có dữ liệu đánh giá cần lưu ý.</p>';\n                return;\n            }\n\n            container.innerHTML = lowestBooks.map(b => {\n                const score = parseFloat(b.rating || 3.0);\n                const scoreColor = score < 3.0 ? 'text-rose-500' : 'text-amber-500';\n                const badgeBg = score < 3.0 ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900' : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900';\n                const starIcon = score < 3.0 ? 'fa-solid fa-triangle-exclamation' : 'fa-solid fa-star-half-stroke';\n\n                return `\n                    <div class=\"flex items-start justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/40 transition\">\n                        <div class=\"flex items-start space-x-2.5 min-w-0\">\n                            <div class=\"w-7 h-7 rounded-lg ${badgeBg} flex items-center justify-center ${scoreColor} text-xs shrink-0 border mt-0.5\">\n                                <i class=\"${starIcon}\"></i>\n                            </div>\n                            <div class=\"min-w-0\">\n                                <p class=\"text-xs font-bold text-slate-800 dark:text-slate-200 truncate\" title=\"${b.title}\">${b.title}</p>\n                                <p class=\"text-[10px] text-slate-400 font-medium\">${b.author}</p>\n                            </div>\n                        </div>\n                        <div class=\"text-right shrink-0 ml-2\">\n                            <span class=\"text-xs font-black ${scoreColor}\">${score.toFixed(1)}/5.0</span>\n                            <div class=\"text-[9px] text-slate-400\">cần rà soát</div>\n                        </div>\n                    </div>\n                `;\n            }).join('');\n        }\n\n        function setActiveFilter(btn) {\n            const filters = document.querySelectorAll('.time-filter');\n            filters.forEach(f => {\n                f.className = 'time-filter px-4 py-1.5 text-xs font-bold rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-200 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-700 transition-colors border border-transparent';\n            });\n            btn.className = 'time-filter active-filter px-4 py-1.5 text-xs font-bold rounded-lg bg-blue-600 text-white shadow-sm transition-colors';\n            \n            currentPeriod = btn.innerText.trim();\n            initCharts(currentPeriod);\n            DB.notify(`Đã cập nhật số liệu biểu đồ theo: ${currentPeriod}`, 'info');\n        }\n\n        // Xuất báo cáo tổng quan hệ thống ra Excel/CSV theo chuẩn Modal cấu hình\n        function exportOverviewExcel() {\n            const columns = [\n                { key: 'period', label: 'Kỳ Báo Cáo', isPrimary: true },\n                { key: 'timePoint', label: 'Mốc Thời Gian', isPrimary: true },\n                { key: 'revenueMil', label: 'Doanh Thu (Triệu VNĐ)', isPrimary: true },\n                { key: 'revenueVnd', label: 'Doanh Thu Quy Đổi (VNĐ)', isPrimary: true },\n                { key: 'costMil', label: 'Chi Phí Vận Hành (Triệu VNĐ)', isPrimary: true },\n                { key: 'profitMil', label: 'Lợi Nhuận Gộp (Triệu VNĐ)', isPrimary: true },\n                { key: 'packageCount', label: 'Số Lượt Nạp Gói Khoai', isPrimary: false },\n                { key: 'catEconomy', label: 'Tỷ Lệ Đọc Kinh Tế (%)', isPrimary: false },\n                { key: 'catTech', label: 'Tỷ Lệ Đọc CNTT (%)', isPrimary: false },\n                { key: 'catLiterature', label: 'Tỷ Lệ Đọc Văn Học (%)', isPrimary: false },\n                { key: 'catSkills', label: 'Tỷ Lệ Đọc Kỹ Năng (%)', isPrimary: false }\n            ];\n\n            const formatters = {\n                period: r => `\"${r.period}\"`,\n                timePoint: r => `\"${r.timePoint}\"`,\n                revenueMil: r => r.revenueMil,\n                revenueVnd: r => `\"${r.revenueVnd}\"`,\n                costMil: r => r.costMil,\n                profitMil: r => r.profitMil,\n                packageCount: r => r.packageCount,\n                catEconomy: r => `\"${r.catEconomy}\"`,\n                catTech: r => `\"${r.catTech}\"`,\n                catLiterature: r => `\"${r.catLiterature}\"`,\n                catSkills: r => `\"${r.catSkills}\"`\n            };\n\n            // Tạo danh sách bản ghi thực tế từ dữ liệu bộ lọc\n            function buildRecords(periodName) {\n                const pData = filterData[periodName] || filterData['1 Ngày'];\n                return pData.labels.map((lbl, idx) => {\n                    const rev = pData.revenue[idx] || 0;\n                    const cst = pData.cost[idx] || 0;\n                    return {\n                        period: periodName,\n                        timePoint: lbl,\n                        revenueMil: rev,\n                        revenueVnd: (rev * 1000000).toLocaleString('vi-VN') + ' đ',\n                        costMil: cst,\n                        profitMil: Number((rev - cst).toFixed(2)),\n                        packageCount: (pData.packageCounts && pData.packageCounts[idx] !== undefined) ? pData.packageCounts[idx] : (pData.packageCounts ? pData.packageCounts[0] : 0),\n                        catEconomy: (pData.catPercentages && pData.catPercentages[0]) ? pData.catPercentages[0] + '%' : '40%',\n                        catTech: (pData.catPercentages && pData.catPercentages[1]) ? pData.catPercentages[1] + '%' : '30%',\n                        catLiterature: (pData.catPercentages && pData.catPercentages[2]) ? pData.catPercentages[2] + '%' : '15%',\n                        catSkills: (pData.catPercentages && pData.catPercentages[3]) ? pData.catPercentages[3] + '%' : '15%'\n                    };\n                });\n            }\n\n            const filteredRecords = buildRecords(currentPeriod);\n            let allRecords = [];\n            Object.keys(filterData).forEach(pName => {\n                allRecords = allRecords.concat(buildRecords(pName));\n            });\n\n            const filterDesc = `Kỳ hiển thị: ${currentPeriod} (${filteredRecords.length} mốc thời gian)`;\n\n            const executeExport = (scope, selectedColumnKeys = []) => {\n                const targetList = (scope === 'all') ? allRecords : filteredRecords;\n                if (!targetList || targetList.length === 0) {\n                    DB.notify('Không có số liệu tổng quan để xuất!', 'warning');\n                    return;\n                }\n\n                const activeKeys = (selectedColumnKeys && selectedColumnKeys.length > 0)\n                    ? selectedColumnKeys\n                    : columns.filter(c => c.isPrimary).map(c => c.key);\n\n                const chosenCols = columns.filter(c => activeKeys.includes(c.key));\n                if (chosenCols.length === 0) {\n                    DB.notify('Vui lòng chọn ít nhất 1 cột để xuất file!', 'warning');\n                    return;\n                }\n\n                const headers = chosenCols.map(c => `\"${c.label}\"`);\n                const rows = targetList.map(r => chosenCols.map(c => (formatters[c.key] ? formatters[c.key](r) : '\"\"')).join(','));\n\n                const csvContent = [headers.join(','), ...rows].join('\\r\\n');\n                const timestamp = new Date().toISOString().slice(0, 10);\n                const scopeLabel = scope === 'all' ? 'ToanBoKy' : currentPeriod.replace(/\\s+/g, '');\n                const filename = `HALMBOOK_TongQuan_${scopeLabel}_${timestamp}.csv`;\n\n                if (window.AdminUI && window.AdminUI.downloadCSV) {\n                    window.AdminUI.downloadCSV(filename, csvContent);\n                } else {\n                    const blob = new Blob(['\\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });\n                    const url = URL.createObjectURL(blob);\n                    const link = document.createElement('a');\n                    link.href = url;\n                    link.download = filename;\n                    document.body.appendChild(link);\n                    link.click();\n                    document.body.removeChild(link);\n                }\n\n                DB.notify(`Đã xuất thành công ${targetList.length} mốc chỉ số tổng quan với ${chosenCols.length} cột (${scope === 'all' ? 'toàn bộ các kỳ' : currentPeriod})!`, 'success');\n            };\n\n            if (window.AdminUI && window.AdminUI.showExportModal) {\n                window.AdminUI.showExportModal({\n                    title: 'Xác nhận xuất Báo Cáo Tổng Quan Hệ Thống',\n                    datasetName: 'Chỉ số Kinh Doanh & Hiệu Suất Hệ Thống',\n                    defaultFilename: `HALMBOOK_TongQuan_${currentPeriod.replace(/\\s+/g, '')}_${new Date().toISOString().slice(0, 10)}.csv`,\n                    currentFilterDesc: filterDesc,\n                    totalCount: allRecords.length,\n                    filteredCount: filteredRecords.length,\n                    columns: columns,\n                    onExport: executeExport\n                });\n            } else {\n                executeExport('filtered', columns.filter(c => c.isPrimary).map(c => c.key));\n            }\n        }\n    ";

export default function TongQuan() {
  useLegacyAdminPage("TongQuan.html", pageCode, true);

  return (
    <div className="admin-page-root">
{/* Sidebar Container (Shared) */}
    <div id="admin-sidebar-container"></div>

    {/* Main Content Area */}
    <main className="flex-1 flex flex-col h-full bg-white dark:bg-gray-950 overflow-hidden">
        {/* Top Header (Shared) */}
        <div id="admin-header-container" data-title="Tổng Quan Điều Hành Hệ Thống" data-subtitle="Chỉ số kinh doanh, hiệu suất đọc sách và dòng tiền trực tiếp"></div>

        {/* Scrollable Dashboard Content (No Footer) */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
            <div className="w-full space-y-6">

                {/* 0. TIME FILTER ROW & EXPORT BUTTONS */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="inline-flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-300 dark:border-slate-600 shadow-sm">
                        <button onClick={() => { window.setActiveFilter(this) }} className="time-filter active-filter px-4 py-1.5 text-xs font-bold rounded-lg bg-blue-600 text-white shadow-sm transition-colors">1 Ngày</button>
                        <button onClick={() => { window.setActiveFilter(this) }} className="time-filter px-4 py-1.5 text-xs font-bold rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-200 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-700 transition-colors border border-transparent">7 Ngày</button>
                        <button onClick={() => { window.setActiveFilter(this) }} className="time-filter px-4 py-1.5 text-xs font-bold rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-200 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-700 transition-colors border border-transparent">1 Tháng</button>
                        <button onClick={() => { window.setActiveFilter(this) }} className="time-filter px-4 py-1.5 text-xs font-bold rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-200 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-700 transition-colors border border-transparent">1 Quý</button>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                        <button onClick={() => { window.DB.notify('Đang xuất báo cáo tổng quan định dạng PDF...', 'info') }} className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-sm flex items-center space-x-1.5 transition">
                            <i className="fa-solid fa-file-pdf text-xs"></i>
                            <span>Xuất PDF</span>
                        </button>
                        <button onClick={() => { window.exportOverviewExcel() }} className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm flex items-center space-x-1.5 transition">
                            <i className="fa-solid fa-file-excel text-xs"></i>
                            <span>Xuất Excel</span>
                        </button>
                    </div>
                </div>

                {/* 1. CHARTS ROW */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Revenue Chart (2/3) */}
                    <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-600 shadow-sm p-5">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">Biểu đồ tăng trưởng doanh thu</h3>
                                <p id="subRevenueChart" className="text-xs text-slate-400 mt-0.5">Đơn vị: Triệu VNĐ (1 Ngày)</p>
                            </div>
                        </div>
                        <div className="relative h-64 w-full">
                            <canvas id="revenueTrendChart"></canvas>
                        </div>
                    </div>

                    {/* Category Chart (1/3) */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-600 shadow-sm p-5">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">Tỷ lệ đọc theo danh mục</h3>
                                <p id="subCategoryChart" className="text-xs text-slate-400 mt-0.5">Đơn vị: % (1 Ngày)</p>
                            </div>
                        </div>
                        <div className="relative h-64 w-full flex justify-center items-center">
                            <canvas id="categoryDoughnutChart"></canvas>
                        </div>
                    </div>
                </div>

                
                {/* 1.5 CHARTS ROW 2: Package Deposits & Recent Transactions */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Package Chart (2/3) */}
                    <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-600 shadow-sm p-5">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">Số lượng nạp theo từng gói</h3>
                                <p id="subPackageChart" className="text-xs text-slate-400 mt-0.5">Đơn vị: Lượt nạp (1 Ngày)</p>
                            </div>
                        </div>
                        <div className="relative h-64 w-full">
                            <canvas id="packageChart"></canvas>
                        </div>
                    </div>

                    {/* Recent Transactions (1/3) */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-600 shadow-sm p-5 flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">Giao dịch gần đây</h3>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            <table className="w-full text-left text-xs">
                                <tbody id="recentTransactionsTable" className="divide-y divide-slate-200 dark:divide-slate-700">
                                    {/* db.js will inject here */}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* 2. STAT CARDS ROW (4 CARDS) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Card 1: Doanh Thu */}
                    <div className="group bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 relative cursor-default">
                        <div className="flex justify-between items-center text-blue-600 dark:text-blue-400 mb-3">
                            <span className="text-xs uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">Tổng doanh thu</span>
                            <i className="fa-solid fa-wallet text-lg bg-blue-50 dark:bg-blue-900/30 p-2 rounded-lg"></i>
                        </div>
                        <h4 id="statTotalRevenue" className="text-2xl font-bold text-slate-800 dark:text-white">...</h4>
                        
                        {/* Hover Details */}
                        <div className="absolute top-full left-0 w-full mt-3 bg-slate-900/90 dark:bg-slate-800/95 backdrop-blur-md text-white rounded-xl p-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible translate-y-2 group-hover:translate-y-0 transition-all duration-300 flex flex-col justify-center pointer-events-none z-50 shadow-2xl">
                            <ul className="space-y-2 text-sm">
                                <li className="flex justify-between"><span className="text-slate-300">Toàn thời gian:</span> <span className="font-semibold">1.2 Tỷ đ</span></li>
                                <li className="flex justify-between"><span className="text-slate-300">Năm nay:</span> <span className="font-semibold text-emerald-400">284.5 Tr đ</span></li>
                                <li className="flex justify-between"><span className="text-slate-300">Tháng này:</span> <span className="font-semibold text-blue-400">32.1 Tr đ</span></li>
                            </ul>
                        </div>
                    </div>

                    {/* Card 2: Lượt Đọc/Tải */}
                    <div className="group bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 relative cursor-default">
                        <div className="flex justify-between items-center text-teal-600 dark:text-teal-400 mb-3">
                            <span className="text-xs uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">Lượt đọc/tải sách</span>
                            <i className="fa-solid fa-book-open text-lg bg-teal-50 dark:bg-teal-900/30 p-2 rounded-lg"></i>
                        </div>
                        <h4 id="statTotalReads" className="text-2xl font-bold text-slate-800 dark:text-white">...</h4>
                        
                        {/* Hover Details */}
                        <div className="absolute top-full left-0 w-full mt-3 bg-slate-900/90 dark:bg-slate-800/95 backdrop-blur-md text-white rounded-xl p-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible translate-y-2 group-hover:translate-y-0 transition-all duration-300 flex flex-col justify-center pointer-events-none z-50 shadow-2xl">
                            <ul className="space-y-2 text-sm">
                                <li className="flex justify-between"><span className="text-slate-300">Đọc trực tuyến:</span> <span className="font-semibold">98,200</span></li>
                                <li className="flex justify-between"><span className="text-slate-300">Tải offline:</span> <span className="font-semibold">44,393</span></li>
                                <li className="flex justify-between"><span className="text-slate-300">Trung bình/ngày:</span> <span className="font-semibold text-teal-400">4,753</span></li>
                            </ul>
                        </div>
                    </div>

                    {/* Card 3: Độc Giả */}
                    <div className="group bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 relative cursor-default">
                        <div className="flex justify-between items-center text-indigo-600 dark:text-indigo-400 mb-3">
                            <span className="text-xs uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">Độc giả hoạt động</span>
                            <i className="fa-solid fa-users text-lg bg-indigo-50 dark:bg-indigo-900/30 p-2 rounded-lg"></i>
                        </div>
                        <h4 id="statTotalUsers" className="text-2xl font-bold text-slate-800 dark:text-white">...</h4>
                        
                        {/* Hover Details */}
                        <div className="absolute top-full left-0 w-full mt-3 bg-slate-900/90 dark:bg-slate-800/95 backdrop-blur-md text-white rounded-xl p-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible translate-y-2 group-hover:translate-y-0 transition-all duration-300 flex flex-col justify-center pointer-events-none z-50 shadow-2xl">
                            <ul className="space-y-2 text-sm">
                                <li className="flex justify-between"><span className="text-slate-300">VIP:</span> <span id="statVipUsers" className="font-semibold text-indigo-400">...</span></li>
                                <li className="flex justify-between"><span className="text-slate-300">Đăng nhập daily:</span> <span className="font-semibold text-indigo-400">~6,500</span></li>
                            </ul>
                        </div>
                    </div>

                    {/* Card 4: Tổng Kho Sách */}
                    <div className="group bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 relative cursor-default">
                        <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400 mb-3">
                            <span className="text-xs uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">Tổng Kho Sách</span>
                            <i className="fa-solid fa-book-bookmark text-lg bg-emerald-50 dark:bg-emerald-900/30 p-2 rounded-lg"></i>
                        </div>
                        <h4 id="statTotalBooks" className="text-2xl font-bold text-slate-800 dark:text-white">...</h4>
                        
                        {/* Hover Details */}
                        <div className="absolute top-full left-0 w-full mt-3 bg-slate-900/90 dark:bg-slate-800/95 backdrop-blur-md text-white rounded-xl p-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible translate-y-2 group-hover:translate-y-0 transition-all duration-300 flex flex-col justify-center pointer-events-none z-50 shadow-2xl">
                            <ul className="space-y-2 text-sm">
                                <li className="flex justify-between"><span className="text-slate-300">Công khai:</span> <span id="statPublicBooks" className="font-semibold text-emerald-400">...</span></li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* 3. RANKINGS & EXPORT BUTTON ROW */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-600 shadow-sm p-5">
                    {/* Header */}
                    <div className="text-center border-b border-slate-300 dark:border-slate-600 pb-4 mb-5">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wide">Bảng Xếp Hạng Hệ Thống</h3>
                    </div>

                    {/* 3 Columns for Rankings */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-700">
                        
                        {/* Column 1: Top Readers */}
                        <div className="pt-4 lg:pt-0 lg:pr-6">
                            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 flex items-center">
                                <i className="fa-solid fa-medal text-amber-500 mr-2"></i> Top Độc Giả
                            </h4>
                            <div id="topReadersContainer" className="space-y-4">
                                {/* Top readers will be injected here by db.js if it exists, otherwise static fallback */}
                            </div>
                        </div>

                        {/* Column 2: Most Read Books */}
                        <div className="pt-4 lg:pt-0 lg:px-6">
                            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 flex items-center">
                                <i className="fa-solid fa-fire text-rose-500 mr-2"></i> Sách Nổi Bật
                            </h4>
                            <div className="space-y-4">
                                <div className="flex items-start space-x-3">
                                    <div className="w-8 h-10 rounded bg-blue-100 flex-shrink-0 flex items-center justify-center text-blue-600 text-xs font-bold">#1</div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">Kinh tế học vĩ mô</p>
                                        <p className="text-[10px] text-slate-500">12,400 lượt đọc</p>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-3">
                                    <div className="w-8 h-10 rounded bg-slate-100 dark:bg-slate-700 flex-shrink-0 flex items-center justify-center text-slate-500 text-xs font-bold">#2</div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">Tâm lý học hành vi</p>
                                        <p className="text-[10px] text-slate-500">9,850 lượt đọc</p>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-3">
                                    <div className="w-8 h-10 rounded bg-slate-100 dark:bg-slate-700 flex-shrink-0 flex items-center justify-center text-slate-500 text-xs font-bold">#3</div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">Đắc nhân tâm</p>
                                        <p className="text-[10px] text-slate-500">8,200 lượt đọc</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Column 3: Lowest Rated */}
                        <div className="pt-4 lg:pt-0 lg:pl-6">
                            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 flex items-center">
                                <i className="fa-solid fa-arrow-trend-down text-rose-500 mr-2"></i> Đánh Giá Cần Cải Thiện
                            </h4>
                            <div id="lowestRatedBooksContainer" className="space-y-3">
                                {/* Dynamic */}
                            </div>
                        </div>
                    </div>
                    
                </div>

            </div>
        </div>
    </main>

    {/* Global Core Scripts */}

    {/* Dashboard Specific Script */}
    </div>
  );
}
