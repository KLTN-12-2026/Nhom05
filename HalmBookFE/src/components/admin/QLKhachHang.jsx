import React from 'react';
import { useLegacyAdminPage } from './legacy-runtime';

const pageCode = "\n        let allUsers = [];\n        let birthdayFilterOnly = false;\n\n        document.addEventListener('DOMContentLoaded', function() {\n            loadUsers();\n            DB.onUpdate(loadUsers);\n        });\n\n        function loadUsers() {\n            allUsers = DB.getUsers();\n            renderUserStats();\n            filterUsersTable();\n        }\n\n        function isToday(dateStr) {\n            if (!dateStr) return false;\n            const today = new Date();\n            const b = new Date(dateStr);\n            return today.getDate() === b.getDate() && today.getMonth() === b.getMonth();\n        }\n\n        function renderUserStats() {\n            const vips = allUsers.filter(u => u.tier.includes('VIP')).length;\n            const locked = allUsers.filter(u => u.status === 'locked').length;\n            const bdays = allUsers.filter(u => isToday(u.birthday)).length;\n\n            document.getElementById('statTotalUsersCount').innerText = allUsers.length + ' người';\n            document.getElementById('statVipUsersCount').innerText = vips + ' hội viên';\n            document.getElementById('statLockedUsersCount').innerText = locked + ' tài khoản';\n            document.getElementById('statBirthdayTodayCount').innerText = bdays + ' người';\n        }\n\n        let currentFilteredUsers = [];\n\n        function renderUsersTable(users) {\n            currentFilteredUsers = users;\n            const tbody = document.getElementById('usersTableBody');\n            const countSummary = document.getElementById('userCountSummary');\n            if (countSummary) {\n                countSummary.innerText = `Hiển thị ${users.length} / ${allUsers.length} khách hàng`;\n            }\n            if (!tbody) return;\n\n            if (users.length === 0) {\n                tbody.innerHTML = `<tr><td colspan=\"10\" class=\"py-12 text-center text-slate-400 font-bold\">Không tìm thấy khách hàng nào phù hợp với bộ lọc.</td></tr>`;\n                return;\n            }\n\n            tbody.innerHTML = users.map(u => {\n                const isBday = isToday(u.birthday);\n                const bdayBadge = isBday ? `<span class=\"ml-1 text-amber-500 font-black animate-bounce inline-block\" title=\"Sinh nhật hôm nay!\">🎂</span>` : '';\n\n                const statusBadge = (window.AdminUI && window.AdminUI.renderBadge)\n                    ? window.AdminUI.renderBadge(u.status)\n                    : (u.status === 'active'\n                        ? '<span class=\"inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800\"><i class=\"fa-solid fa-circle-check text-[10px]\"></i>Hoạt động</span>'\n                        : '<span class=\"inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-300 dark:border-rose-800\"><i class=\"fa-solid fa-ban text-[10px]\"></i>Đã khóa</span>');\n\n                const tierBadge = u.tier.includes('VIP')\n                    ? '<span class=\"inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 dark:border-amber-700 shadow-xs\"><i class=\"fa-solid fa-crown text-[9px]\"></i>VIP Khoai Tây</span>'\n                    : '<span class=\"inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-600\">Standard</span>';\n\n                const lockBtnText = u.status === 'active' ? 'Khóa' : 'Mở khóa';\n                const lockBtnIcon = u.status === 'active' ? 'fa-user-lock' : 'fa-lock-open';\n                const lockBtnClass = u.status === 'active'\n                    ? 'bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800'\n                    : 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800';\n\n                const avatarHtml = (window.AdminUI && window.AdminUI.renderAvatar)\n                    ? window.AdminUI.renderAvatar({ name: u.name, avatar: u.avatar, size: 'w-8 h-8', textSize: 'text-xs' })\n                    : `<div class=\"w-8 h-8 mx-auto rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 font-black border border-slate-200 dark:border-slate-700 flex items-center justify-center text-xs shrink-0\">${u.avatar || 'U'}</div>`;\n\n                return `\n                    <tr class=\"hover:bg-blue-50/30 dark:hover:bg-slate-700/50 transition\">\n                        <td class=\"py-3 px-3 text-center border-r border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-400 w-px whitespace-nowrap\">${u.id}</td>\n                        <td class=\"py-3 px-3 text-center border-r border-slate-200 dark:border-slate-700 w-px whitespace-nowrap\">\n                            <div class=\"flex items-center justify-center\">\n                                ${avatarHtml}\n                            </div>\n                        </td>\n                        <td class=\"py-3 px-4 border-r border-slate-200 dark:border-slate-700 min-w-[180px]\">\n                            <div>\n                                <div class=\"font-black text-slate-800 dark:text-white flex items-center\">\n                                    <span class=\"break-words whitespace-normal block\" title=\"${u.name}\">${u.name}</span>\n                                    ${bdayBadge}\n                                </div>\n                                <div class=\"text-[10px] text-slate-400\">Sinh: ${u.birthday || 'N/A'}</div>\n                            </div>\n                        </td>\n                        <td class=\"py-3 px-4 border-r border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-medium\"><div class=\"break-words whitespace-normal\" title=\"${u.email}\">${u.email}</div></td>\n                        <td class=\"py-3 px-3 text-center border-r border-slate-200 dark:border-slate-700 font-mono text-slate-600 dark:text-gray-300 w-px whitespace-nowrap\">${u.phone}</td>\n                        <td class=\"py-3 px-3 text-center border-r border-slate-200 dark:border-slate-700 w-px whitespace-nowrap\">${tierBadge}</td>\n                        <td class=\"py-3 px-3 border-r border-slate-200 dark:border-slate-700 text-center font-black text-blue-600 font-mono w-px whitespace-nowrap\">${u.balance || 0} 🥔</td>\n                        <td class=\"py-3 px-3 border-r border-slate-200 dark:border-slate-700 text-center font-bold text-slate-600 dark:text-gray-300 w-px whitespace-nowrap\">${u.booksReadCount || 0} cuốn</td>\n                        <td class=\"py-3 px-3 text-center border-r border-slate-200 dark:border-slate-700 w-px whitespace-nowrap\">${statusBadge}</td>\n                        <td class=\"py-3 px-4 text-center w-px whitespace-nowrap\">\n                            <div class=\"flex items-center justify-center space-x-1.5\">\n                                <button onclick=\"openSupportMsgModal('${u.id}')\" class=\"p-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 rounded-lg border border-blue-200 dark:border-blue-800 transition shadow-sm\" title=\"Gửi tin nhắn hỗ trợ\"><i class=\"fa-solid fa-comment-dots text-blue-600 dark:text-blue-400\"></i></button>\n\n                                <button onclick=\"openBirthdayModal('${u.id}')\" class=\"px-2.5 py-1 bg-white hover:bg-slate-50 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold border border-slate-300 dark:border-slate-600 transition flex items-center space-x-1 shadow-sm ${isBday ? 'ring-2 ring-amber-500' : ''}\" title=\"Chúc mừng sinh nhật\">\n                                    <span>🎂</span>\n                                    <span>Chúc SN</span>\n                                </button>\n\n                                <button onclick=\"toggleLockUser('${u.id}', '${u.name}')\" class=\"px-2.5 py-1 rounded-lg text-xs font-bold border transition shadow-sm flex items-center space-x-1 ${lockBtnClass}\" title=\"Khóa/Mở khóa tài khoản\">\n                                    <i class=\"fa-solid ${lockBtnIcon} text-[10px]\"></i>\n                                    <span>${lockBtnText}</span>\n                                </button>\n                            </div>\n                        </td>\n                    </tr>\n                `;\n            }).join('');\n        }\n\n        function resetUserFilters() {\n            document.getElementById('userSearchInput').value = '';\n            document.getElementById('userTierFilter').value = '';\n            document.getElementById('userStatusFilter').value = '';\n            birthdayFilterOnly = false;\n            const btn = document.getElementById('btnBirthdayFilter');\n            if (btn) {\n                btn.classList.remove('bg-gray-400', 'text-gray-950');\n                btn.classList.add('bg-white', 'text-slate-700');\n            }\n            filterUsersTable();\n        }\n\n        function filterUsersTable() {\n            const query = document.getElementById('userSearchInput').value.toLowerCase().trim();\n            const tier = document.getElementById('userTierFilter').value;\n            const status = document.getElementById('userStatusFilter').value;\n\n            const filtered = allUsers.filter(u => {\n                const matchQ = !query || u.name.toLowerCase().includes(query) || u.email.toLowerCase().includes(query) || (u.phone && u.phone.includes(query)) || (u.id && u.id.toLowerCase().includes(query));\n                const matchTier = !tier || u.tier === tier;\n                const matchStatus = !status || u.status === status;\n                const matchBday = !birthdayFilterOnly || isToday(u.birthday);\n                return matchQ && matchTier && matchStatus && matchBday;\n            });\n\n            renderUsersTable(filtered);\n        }\n\n        function filterBirthdayTodayOnly() {\n            birthdayFilterOnly = !birthdayFilterOnly;\n            const btn = document.getElementById('btnBirthdayFilter');\n            if (birthdayFilterOnly) {\n                btn.classList.add('bg-gray-400', 'text-gray-950');\n                btn.classList.remove('bg-slate-50', 'text-slate-700');\n            } else {\n                btn.classList.remove('bg-gray-400', 'text-gray-950');\n                btn.classList.add('bg-slate-50', 'text-slate-700');\n            }\n            filterUsersTable();\n        }\n\n        // Action 1: Gửi tin nhắn hỗ trợ\n        function openSupportMsgModal(userId) {\n            const user = DB.getUser(userId);\n            if (!user) return;\n            document.getElementById('msgTargetUserId').value = user.id;\n            document.getElementById('msgTargetName').innerText = user.name;\n            document.getElementById('msgTargetEmail').innerText = user.email;\n            document.getElementById('msgTargetAvatar').innerText = user.avatar;\n            document.getElementById('msgContentInput').value = '';\n            document.getElementById('supportMsgModal').classList.remove('hidden');\n        }\n\n        function sendSupportMessageSubmit() {\n            const userId = document.getElementById('msgTargetUserId').value;\n            const title = document.getElementById('msgTitleInput').value.trim();\n            const content = document.getElementById('msgContentInput').value.trim();\n            if (!content) {\n                DB.notify('Vui lòng nhập nội dung tin nhắn hỗ trợ!', 'warning');\n                return;\n            }\n\n            const success = DB.sendSupportMessageToUser(userId, title, content);\n            if (success) {\n                closeModal('supportMsgModal');\n                DB.notify('Đã gửi tin nhắn hỗ trợ thành công đến khách hàng!', 'success');\n            }\n        }\n\n        // Action 2: Chúc mừng sinh nhật\n        function openBirthdayModal(userId) {\n            const user = DB.getUser(userId);\n            if (!user) return;\n            document.getElementById('bdayTargetUserId').value = user.id;\n            document.getElementById('bdayTargetName').innerText = user.name;\n            document.getElementById('bdayTargetDate').innerText = 'Ngày sinh: ' + (user.birthday || 'Chưa cập nhật');\n            document.getElementById('bdayTargetAvatar').innerText = user.avatar;\n            document.getElementById('bdayPotatoesInput').value = 50;\n            document.getElementById('birthdayModal').classList.remove('hidden');\n        }\n\n        function sendBirthdayGreetingSubmit() {\n            const userId = document.getElementById('bdayTargetUserId').value;\n            const gift = Number(document.getElementById('bdayPotatoesInput').value) || 50;\n            const msg = document.getElementById('bdayMessageInput').value.trim();\n\n            const res = DB.sendBirthdayGreeting(userId, gift, msg);\n            if (res) {\n                closeModal('birthdayModal');\n                DB.notify(`Đã gửi lời chúc mừng sinh nhật và tặng ${gift} củ khoai tây cho ${res.user.name}! 🎂`, 'success');\n            }\n        }\n\n        // Action 3: Khóa / Mở khóa với modal xác nhận hệ thống\n        async function toggleLockUser(userId, userName) {\n            const user = DB.getUser(userId);\n            const isCurrentlyActive = user ? user.status === 'active' : true;\n            const actionWord = isCurrentlyActive ? 'Khóa tài khoản' : 'Mở khóa tài khoản';\n            const actionType = isCurrentlyActive ? 'danger' : 'primary';\n            const message = isCurrentlyActive\n                ? `Bạn có chắc chắn muốn KHÓA tài khoản của khách hàng \"${userName}\" (Mã: ${userId})? Độc giả sẽ tạm thời không thể đăng nhập hoặc thuê sách.`\n                : `Bạn có muốn MỞ KHÓA tài khoản cho khách hàng \"${userName}\" (Mã: ${userId})? Độc giả sẽ tiếp tục sử dụng dịch vụ bình thường.`;\n\n            let confirmed = false;\n            if (window.AdminUI && window.AdminUI.confirm) {\n                confirmed = await window.AdminUI.confirm({\n                    title: `Xác nhận ${actionWord}`,\n                    message: message,\n                    confirmText: actionWord,\n                    cancelText: 'Hủy bỏ',\n                    confirmType: actionType\n                });\n            } else {\n                confirmed = confirm(message);\n            }\n\n            if (!confirmed) return;\n\n            const updated = DB.toggleLockUser(userId);\n            if (updated) {\n                const resultWord = updated.status === 'locked' ? 'Khóa' : 'Mở khóa';\n                DB.notify(`Đã ${resultWord} tài khoản của độc giả ${userName} thành công.`, updated.status === 'locked' ? 'warning' : 'success');\n            }\n        }\n\n        function openAddUserModal() {\n            document.getElementById('addUserModal').classList.remove('hidden');\n        }\n\n        function closeModal(id) {\n            document.getElementById(id).classList.add('hidden');\n        }\n\n        function handleCreateUser(e) {\n            e.preventDefault();\n            const name = document.getElementById('newUserName').value.trim();\n            const email = document.getElementById('newUserEmail').value.trim();\n            const phone = document.getElementById('newUserPhone').value.trim();\n            const birthday = document.getElementById('newUserBirthday').value;\n            const tier = document.getElementById('newUserTier').value;\n            const balance = Number(document.getElementById('newUserBalance').value) || 0;\n\n            const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(-2);\n\n            const newUser = {\n                id: 'U' + String(Math.floor(1000 + Math.random() * 9000)),\n                name: name,\n                email: email,\n                phone: phone,\n                avatar: initials || 'U',\n                tier: tier,\n                status: 'active',\n                balance: balance,\n                birthday: birthday,\n                joinedDate: new Date().toISOString().split('T')[0],\n                booksReadCount: 0,\n                notifications: []\n            };\n\n            DB.saveUser(newUser);\n            closeModal('addUserModal');\n            DB.notify(`Đã thêm khách hàng \"${name}\" thành công!`, 'success');\n        }\n    \n        function sendMessage(id) {\n            window.DB.notify('Đã mở hộp thoại tin nhắn cho khách hàng ' + id, 'info');\n        }\n        function sendBirthday(id) {\n            window.DB.notify('Đã gửi email chúc mừng sinh nhật cho khách hàng ' + id, 'success');\n        }\n        \n        // Xuất file dữ liệu Khách hàng theo chuẩn xác nhận trước khi tải\n        function exportKhachHangExcel() {\n            const query = (document.getElementById('userSearchInput')?.value || '').trim();\n            const tier = document.getElementById('userTierFilter')?.value || '';\n            const status = document.getElementById('userStatusFilter')?.value || '';\n            const filterParts = [];\n            if (query) filterParts.push(`Từ khóa \"${query}\"`);\n            if (tier) filterParts.push(`Hạng: ${tier}`);\n            if (status) filterParts.push(`Trạng thái: ${status}`);\n            if (birthdayFilterOnly) filterParts.push('Sinh nhật hôm nay');\n\n            const filterDesc = filterParts.length > 0 ? filterParts.join(' • ') : 'Tất cả dữ liệu (không lọc)';\n\n            const columns = [\n                { key: 'id', label: 'Mã Khách Hàng', isPrimary: true },\n                { key: 'name', label: 'Họ Và Tên', isPrimary: true },\n                { key: 'email', label: 'Email', isPrimary: true },\n                { key: 'phone', label: 'Số Điện Thoại', isPrimary: true },\n                { key: 'tier', label: 'Hạng Hội Viên', isPrimary: true },\n                { key: 'status', label: 'Trạng Thái', isPrimary: true },\n                { key: 'birthday', label: 'Ngày Sinh', isPrimary: false },\n                { key: 'balance', label: 'Số Dư Khoai (🥔)', isPrimary: false },\n                { key: 'booksReadCount', label: 'Số Sách Đã Đọc', isPrimary: false },\n                { key: 'joinedDate', label: 'Ngày Gia Nhập', isPrimary: false }\n            ];\n\n            const formatters = {\n                id: u => `\"${u.id || ''}\"`,\n                name: u => `\"${(u.name || '').replace(/\"/g, '\"\"')}\"`,\n                email: u => `\"${(u.email || '').replace(/\"/g, '\"\"')}\"`,\n                phone: u => `\"${(u.phone || '').replace(/\"/g, '\"\"')}\"`,\n                tier: u => `\"${(u.tier || '').replace(/\"/g, '\"\"')}\"`,\n                status: u => u.status === 'active' ? '\"Đang hoạt động\"' : '\"Đã khóa\"',\n                birthday: u => `\"${u.birthday || ''}\"`,\n                balance: u => u.balance || 0,\n                booksReadCount: u => u.booksReadCount || 0,\n                joinedDate: u => `\"${u.joinedDate || ''}\"`\n            };\n\n            const executeExport = (scope, selectedColumnKeys = []) => {\n                const targetList = (scope === 'filtered') ? currentFilteredUsers : allUsers;\n                if (!targetList || targetList.length === 0) {\n                    DB.notify('Không có dữ liệu khách hàng để xuất!', 'warning');\n                    return;\n                }\n\n                const activeKeys = (selectedColumnKeys && selectedColumnKeys.length > 0)\n                    ? selectedColumnKeys\n                    : columns.filter(c => c.isPrimary).map(c => c.key);\n\n                const chosenCols = columns.filter(c => activeKeys.includes(c.key));\n                if (chosenCols.length === 0) {\n                    DB.notify('Vui lòng chọn ít nhất 1 cột để xuất file!', 'warning');\n                    return;\n                }\n\n                const headers = chosenCols.map(c => `\"${c.label}\"`);\n                const rows = targetList.map(u => chosenCols.map(c => (formatters[c.key] ? formatters[c.key](u) : '\"\"')).join(','));\n\n                const csvContent = [headers.join(','), ...rows].join('\\r\\n');\n                const timestamp = new Date().toISOString().slice(0, 10);\n                const filename = `HALMBOOK_KhachHang_${scope}_${timestamp}.csv`;\n\n                if (window.AdminUI && window.AdminUI.downloadCSV) {\n                    window.AdminUI.downloadCSV(filename, csvContent);\n                } else {\n                    const blob = new Blob(['\\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });\n                    const url = URL.createObjectURL(blob);\n                    const link = document.createElement('a');\n                    link.href = url;\n                    link.download = filename;\n                    document.body.appendChild(link);\n                    link.click();\n                    document.body.removeChild(link);\n                }\n\n                DB.notify(`Đã xuất thành công ${targetList.length} hồ sơ khách hàng với ${chosenCols.length} cột (${scope === 'filtered' ? 'bộ lọc hiện tại' : 'toàn bộ'})!`, 'success');\n            };\n\n            if (window.AdminUI && window.AdminUI.showExportModal) {\n                window.AdminUI.showExportModal({\n                    title: 'Xác nhận xuất danh sách Khách hàng',\n                    datasetName: 'Hồ sơ Độc giả & Khách hàng',\n                    defaultFilename: `HALMBOOK_KhachHang_${new Date().toISOString().slice(0, 10)}.csv`,\n                    currentFilterDesc: filterDesc,\n                    totalCount: allUsers.length,\n                    filteredCount: currentFilteredUsers.length,\n                    columns: columns,\n                    onExport: executeExport\n                });\n            } else {\n                executeExport('all');\n            }\n        }\n    ";

export default function QuanLyKhachHang() {
  useLegacyAdminPage("QuanLyKhachHang.html", pageCode, false);

  return (
    <div className="admin-page-root">
{/* Shared Sidebar */}
    <div id="admin-sidebar-container"></div>

    {/* Main Content Area (No Footer) */}
    <main className="flex-1 flex flex-col h-full bg-white dark:bg-gray-950 overflow-hidden">
        {/* Shared Header */}
        <div id="admin-header-container" data-title="Quản Lý Độc Giả & Khách Hàng" data-subtitle="Danh sách độc giả, tìm kiếm trực tiếp trên màn hình, hỗ trợ chăm sóc và chúc mừng sinh nhật"></div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
            <div className="w-full space-y-4">

                {/* 4 Quick Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-extrabold uppercase text-slate-500 dark:text-slate-400">Tổng Độc Giả</p>
                            <h4 id="statTotalUsersCount" className="text-xl font-black text-slate-800 dark:text-white mt-1">5 người</h4>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200 dark:border-blue-800">
                            <i className="fa-solid fa-users"></i>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-extrabold uppercase text-amber-600 dark:text-amber-400">VIP Khoai Tây</p>
                            <h4 id="statVipUsersCount" className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1">3 hội viên</h4>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-800">
                            <i className="fa-solid fa-crown"></i>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-extrabold uppercase text-rose-500 dark:text-rose-400">Sinh Nhật Hôm Nay 🎂</p>
                            <h4 id="statBirthdayTodayCount" className="text-xl font-black text-rose-600 dark:text-rose-400 mt-1">0 người</h4>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-200 dark:border-rose-800">
                            <i className="fa-solid fa-cake-candles"></i>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-extrabold uppercase text-slate-500 dark:text-slate-400">Tài Khoản Đang Khóa</p>
                            <h4 id="statLockedUsersCount" className="text-xl font-black text-slate-700 dark:text-slate-300 mt-1">1 tài khoản</h4>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 flex items-center justify-center border border-slate-300 dark:border-slate-600">
                            <i className="fa-solid fa-user-lock"></i>
                        </div>
                    </div>
                </div>

                {/* Users List Table */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col">
                    {/* Integrated Search & Filter (TOP) */}
                    <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col xl:flex-row gap-3 items-stretch xl:items-center justify-between bg-slate-50 dark:bg-slate-800/50">
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="relative w-full sm:w-72">
                                <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-3 text-slate-400 text-xs"></i>
                                <input type="text" id="userSearchInput" onKeyUp={() => { window.filterUsersTable() }} placeholder="Tìm theo mã, tên, email, SĐT..." className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>

                            <select id="userTierFilter" onChange={() => { window.filterUsersTable() }} className="px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold dark:text-white">
                                <option value="">Tất cả hạng</option>
                                <option value="VIP Khoai Tây">VIP Khoai Tây</option>
                                <option value="Standard">Standard</option>
                            </select>

                            <select id="userStatusFilter" onChange={() => { window.filterUsersTable() }} className="px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold dark:text-white">
                                <option value="">Tất cả trạng thái</option>
                                <option value="active">Đang hoạt động</option>
                                <option value="locked">Đã bị khóa</option>
                            </select>

                            <button onClick={() => { window.resetUserFilters() }} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-gray-200 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-600 flex items-center space-x-1.5 transition" title="Đặt lại tất cả bộ lọc">
                                <i className="fa-solid fa-rotate-left"></i>
                                <span>Đặt lại</span>
                            </button>

                            <button onClick={() => { window.filterBirthdayTodayOnly() }} id="btnBirthdayFilter" className="px-3 py-2 bg-white dark:bg-gray-950/40 text-slate-700 dark:text-gray-300 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-600 flex items-center space-x-1.5 transition">
                                <i className="fa-solid fa-cake-candles text-slate-500"></i>
                                <span>Lọc sinh nhật</span>
                            </button>

                            <span id="userCountSummary" className="text-xs font-bold text-slate-500 dark:text-slate-400 px-2 py-1 bg-slate-100 dark:bg-slate-700/60 rounded-lg border border-slate-200 dark:border-slate-700">Hiển thị: 0</span>
                        </div>

                        <div className="flex items-center space-x-2">
                            <button onClick={() => { window.exportKhachHangExcel() }} className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center space-x-1.5 transition" title="Xuất danh sách khách hàng ra Excel/CSV">
                                <i className="fa-solid fa-file-excel"></i>
                                <span>Xuất Excel</span>
                            </button>
                            <button onClick={() => { window.openAddUserModal() }} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-blue-500/30 flex items-center space-x-2 transition">
                                <i className="fa-solid fa-user-plus"></i>
                                <span>Thêm Khách Hàng</span>
                            </button>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead className="bg-slate-50 dark:bg-slate-700 border-b-2 border-slate-300 dark:border-slate-600 uppercase font-black text-[11px] text-slate-700 dark:text-gray-200">
                                <tr>
                                    <th className="py-3 px-3 text-center border-r border-slate-200 dark:border-slate-700 w-px whitespace-nowrap">Mã KH</th>
                                    <th className="py-3 px-3 text-center border-r border-slate-200 dark:border-slate-700 w-px whitespace-nowrap">Ảnh Đại Diện</th>
                                    <th className="py-3 px-4 border-r border-slate-200 dark:border-slate-700 min-w-[180px]">Tên Độc Giả</th>
                                    <th className="py-3 px-4 border-r border-slate-200 dark:border-slate-700 min-w-[200px]">Email</th>
                                    <th className="py-3 px-3 text-center border-r border-slate-200 dark:border-slate-700 w-px whitespace-nowrap">Số Điện Thoại</th>
                                    <th className="py-3 px-3 text-center border-r border-slate-200 dark:border-slate-700 w-px whitespace-nowrap">Hạng Tài Khoản</th>
                                    <th className="py-3 px-3 text-center border-r border-slate-200 dark:border-slate-700 w-px whitespace-nowrap">Số Dư Khoai</th>
                                    <th className="py-3 px-3 text-center border-r border-slate-200 dark:border-slate-700 w-px whitespace-nowrap">Đã Đọc</th>
                                    <th className="py-3 px-3 text-center border-r border-slate-200 dark:border-slate-700 w-px whitespace-nowrap">Trạng Thái</th>
                                    <th className="py-3 px-4 text-center w-px whitespace-nowrap">Hành Động Chăm Sóc</th>
                                </tr>
                            </thead>
                            <tbody id="usersTableBody" className="divide-y-2 divide-gray-100 dark:divide-gray-800 font-semibold">
                                {/* Rendered dynamically */}
                            </tbody>
                        </table>
                    </div>
                    {/* Export Button (BOTTOM) */}
                    <div className="relative py-2 px-4 flex justify-end items-center gap-2 bg-slate-50/80 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-700/50">
                        <button onClick={() => { window.exportKhachHangExcel() }} className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm flex items-center space-x-1.5 transition">
                            <i className="fa-solid fa-file-excel text-xs"></i>
                            <span>Xuất Excel</span>
                        </button>
                    </div>
                </div>

            </div>
        </div>
    </main>

    {/* Modal 1: Gửi Tin Nhắn Hỗ Trợ */}
    <div id="supportMsgModal" className="fixed inset-0 bg-slate-800/60 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-700 rounded-2xl max-w-md w-full p-6 border border-slate-300 dark:border-slate-600 dark:border-slate-600 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b-2 border-slate-300 dark:border-slate-600 dark:border-slate-600 pb-3">
                <h3 className="font-black text-base text-slate-800 dark:text-white flex items-center space-x-2">
                    <i className="fa-solid fa-comments text-blue-600"></i>
                    <span>Gửi Tin Nhắn Hỗ Trợ Độc Giả</span>
                </h3>
                <button onClick={() => { window.closeModal('supportMsgModal') }} className="text-slate-400 hover:text-slate-800 dark:hover:text-white font-bold"><i className="fa-solid fa-xmark text-lg"></i></button>
            </div>
            <div className="space-y-3">
                <div className="p-3 bg-blue-50 dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-600 flex items-center space-x-3">
                    <div id="msgTargetAvatar" className="w-9 h-9 rounded-full bg-blue-200 text-blue-800 font-black border border-slate-200 dark:border-slate-700 flex items-center justify-center text-xs">...</div>
                    <div>
                        <div id="msgTargetName" className="font-black text-xs text-slate-800 dark:text-white">...</div>
                        <div id="msgTargetEmail" className="text-[10px] text-slate-400">...</div>
                    </div>
                </div>
                <input type="hidden" id="msgTargetUserId" />
                <div>
                    <label className="block text-xs font-extrabold text-slate-600 dark:text-gray-300 uppercase mb-1">Tiêu đề tin nhắn</label>
                    <input type="text" id="msgTitleInput" value="Hỗ trợ từ Ban Quản Trị HALMBOOK" className="w-full px-3.5 py-2 bg-white dark:bg-gray-700 border border-slate-300 dark:border-slate-600 dark:border-gray-600 rounded-xl text-xs font-bold dark:text-white" />
                </div>
                <div>
                    <label className="block text-xs font-extrabold text-slate-600 dark:text-gray-300 uppercase mb-1">Nội dung tin nhắn gửi đến độc giả</label>
                    <textarea id="msgContentInput" rows="4" placeholder="Nhập lời nhắn hỗ trợ, hướng dẫn giải quyết sự cố hoặc phản hồi..." className="w-full px-3.5 py-2 bg-white dark:bg-gray-700 border border-slate-300 dark:border-slate-600 dark:border-gray-600 rounded-xl text-xs font-bold dark:text-white"></textarea>
                </div>
            </div>
            <div className="flex justify-end space-x-2 pt-3 border-t-2 border-slate-300 dark:border-slate-600 dark:border-slate-600">
                <button onClick={() => { window.closeModal('supportMsgModal') }} className="px-4 py-2 bg-slate-50 dark:bg-gray-700 text-slate-700 dark:text-gray-200 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-600">Hủy</button>
                <button onClick={() => { window.sendSupportMessageSubmit() }} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-600">Gửi Tin Nhắn</button>
            </div>
        </div>
    </div>

    {/* Modal 2: Chúc Mừng Sinh Nhật & Tặng Quà Khoai Tây */}
    <div id="birthdayModal" className="fixed inset-0 bg-slate-800/60 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-700 rounded-2xl max-w-md w-full p-6 border border-slate-300 dark:border-slate-600 dark:border-slate-600 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b-2 border-slate-300 dark:border-slate-600 dark:border-slate-600 pb-3">
                <h3 className="font-black text-base text-slate-800 dark:text-white flex items-center space-x-2">
                    <span className="text-xl">🎂</span>
                    <span>Chúc Mừng Sinh Nhật & Tặng Quà</span>
                </h3>
                <button onClick={() => { window.closeModal('birthdayModal') }} className="text-slate-400 hover:text-slate-800 dark:hover:text-white font-bold"><i className="fa-solid fa-xmark text-lg"></i></button>
            </div>
            <div className="space-y-3">
                <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-600 flex items-center space-x-3">
                    <div id="bdayTargetAvatar" className="w-10 h-10 rounded-full bg-gray-200 text-slate-700 font-black border border-slate-200 dark:border-slate-700 flex items-center justify-center text-xs">...</div>
                    <div>
                        <div id="bdayTargetName" className="font-black text-xs text-slate-800 dark:text-white">...</div>
                        <div id="bdayTargetDate" className="text-[10px] text-slate-500 font-bold">Ngày sinh: ...</div>
                    </div>
                </div>
                <input type="hidden" id="bdayTargetUserId" />
                <div>
                    <label className="block text-xs font-extrabold text-slate-600 dark:text-gray-300 uppercase mb-1">Số Củ Khoai Tây Tặng Kèm 🥔</label>
                    <input type="number" id="bdayPotatoesInput" value="50" min="10" step="10" className="w-full px-3.5 py-2 bg-white dark:bg-gray-700 border border-slate-300 dark:border-slate-600 dark:border-gray-600 rounded-xl text-xs font-bold dark:text-white" />
                </div>
                <div>
                    <label className="block text-xs font-extrabold text-slate-600 dark:text-gray-300 uppercase mb-1">Lời chúc mừng</label>
                    <textarea id="bdayMessageInput" rows="3" className="w-full px-3.5 py-2 bg-white dark:bg-gray-700 border border-slate-300 dark:border-slate-600 dark:border-gray-600 rounded-xl text-xs font-bold dark:text-white">HALMBOOK chúc bạn một sinh nhật tràn ngập niềm vui, hạnh phúc và vạn sự như ý! Tặng bạn món quà đọc sách đầu năm mới!</textarea>
                </div>
            </div>
            <div className="flex justify-end space-x-2 pt-3 border-t-2 border-slate-300 dark:border-slate-600 dark:border-slate-600">
                <button onClick={() => { window.closeModal('birthdayModal') }} className="px-4 py-2 bg-slate-50 dark:bg-gray-700 text-slate-700 dark:text-gray-200 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-600">Hủy</button>
                <button onClick={() => { window.sendBirthdayGreetingSubmit() }} className="px-5 py-2 bg-slate-500 hover:bg-gray-600 text-gray-950 font-black rounded-xl text-xs border border-slate-300 dark:border-slate-600">Tặng Quà & Gửi Chúc Mừng 🎁</button>
            </div>
        </div>
    </div>

    {/* Modal 3: Thêm Khách Hàng Mới */}
    <div id="addUserModal" className="fixed inset-0 bg-slate-800/60 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-700 rounded-2xl max-w-md w-full p-6 border border-slate-300 dark:border-slate-600 dark:border-slate-600 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b-2 border-slate-300 dark:border-slate-600 dark:border-slate-600 pb-3">
                <h3 className="font-black text-base text-slate-800 dark:text-white flex items-center space-x-2">
                    <i className="fa-solid fa-user-plus text-blue-600"></i>
                    <span>Tạo Hồ Sơ Độc Giả Mới</span>
                </h3>
                <button onClick={() => { window.closeModal('addUserModal') }} className="text-slate-400 hover:text-slate-800 dark:hover:text-white font-bold"><i className="fa-solid fa-xmark text-lg"></i></button>
            </div>
            <form onSubmit={() => { window.handleCreateUser(event) }} className="space-y-3">
                <div>
                    <label className="block text-xs font-extrabold text-slate-600 dark:text-gray-300 uppercase mb-1">Họ và tên *</label>
                    <input type="text" id="newUserName" required placeholder="Nguyễn Văn A..." className="w-full px-3.5 py-2 bg-white dark:bg-gray-700 border border-slate-300 dark:border-slate-600 dark:border-gray-600 rounded-xl text-xs font-bold dark:text-white" />
                </div>
                <div>
                    <label className="block text-xs font-extrabold text-slate-600 dark:text-gray-300 uppercase mb-1">Email *</label>
                    <input type="email" id="newUserEmail" required placeholder="example@gmail.com..." className="w-full px-3.5 py-2 bg-white dark:bg-gray-700 border border-slate-300 dark:border-slate-600 dark:border-gray-600 rounded-xl text-xs font-bold dark:text-white" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-extrabold text-slate-600 dark:text-gray-300 uppercase mb-1">Số điện thoại</label>
                        <input type="text" id="newUserPhone" value="0397409029" className="w-full px-3.5 py-2 bg-white dark:bg-gray-700 border border-slate-300 dark:border-slate-600 dark:border-gray-600 rounded-xl text-xs font-bold dark:text-white" />
                    </div>
                    <div>
                        <label className="block text-xs font-extrabold text-slate-600 dark:text-gray-300 uppercase mb-1">Ngày sinh</label>
                        <input type="date" id="newUserBirthday" value="2000-10-06" className="w-full px-3.5 py-2 bg-white dark:bg-gray-700 border border-slate-300 dark:border-slate-600 dark:border-gray-600 rounded-xl text-xs font-bold dark:text-white" />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-extrabold text-slate-600 dark:text-gray-300 uppercase mb-1">Hạng thành viên</label>
                        <select id="newUserTier" className="w-full px-3.5 py-2 bg-white dark:bg-gray-700 border border-slate-300 dark:border-slate-600 dark:border-gray-600 rounded-xl text-xs font-bold dark:text-white">
                            <option value="Standard">Standard</option>
                            <option value="VIP Khoai Tây">VIP Khoai Tây</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-extrabold text-slate-600 dark:text-gray-300 uppercase mb-1">Khoai nạp ban đầu</label>
                        <input type="number" id="newUserBalance" value="100" className="w-full px-3.5 py-2 bg-white dark:bg-gray-700 border border-slate-300 dark:border-slate-600 dark:border-gray-600 rounded-xl text-xs font-bold dark:text-white" />
                    </div>
                </div>
                <div className="flex justify-end space-x-2 pt-3 border-t-2 border-slate-300 dark:border-slate-600 dark:border-slate-600">
                    <button type="button" onClick={() => { window.closeModal('addUserModal') }} className="px-4 py-2 bg-slate-50 dark:bg-gray-700 text-slate-700 dark:text-gray-200 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-600">Hủy</button>
                    <button type="submit" className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-600">Tạo Khách Hàng</button>
                </div>
            </form>
        </div>
    </div>

    {/* Core Scripts */}
    </div>
  );
}
