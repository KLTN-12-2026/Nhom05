import React from 'react';
import { useLegacyAdminPage } from './legacy-runtime';

const pageCode = "\n        let vouchersData = [\n            { code: 'HALM2026', discount: 'Giảm 50% phí thuê sách', expiry: '31/12/2026', active: true },\n            { code: 'SINHNHATVIP', discount: 'Tặng 50 Củ Khoai Tây', expiry: 'Không thời hạn', active: true },\n            { code: 'NEWBIE10', discount: 'Thuê miễn phí 1 cuốn', expiry: '15/10/2026', active: true }\n        ];\n\n        document.addEventListener('DOMContentLoaded', function() {\n            renderPackages();\n            renderVouchers();\n            DB.onUpdate(renderPackages);\n        });\n\n        function scrollPackages(direction) {\n            const container = document.getElementById('adminPackagesContainer');\n            if (container) {\n                container.scrollBy({ left: direction * 320, behavior: 'smooth' });\n            }\n        }\n\n        function renderPackages() {\n            const container = document.getElementById('adminPackagesContainer');\n            const pkgs = DB.getPackages();\n\n            container.innerHTML = pkgs.map(p => `\n                <div class=\"min-w-[280px] sm:min-w-[320px] max-w-[340px] shrink-0 snap-start bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between space-y-4\">\n                    <div>\n                        <div class=\"flex justify-between items-start\">\n                            <span class=\"bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 font-black text-xs px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-800\">🥔 ${p.potatoes} Củ Khoai</span>\n                            <span class=\"text-[10px] font-black uppercase bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 px-2 py-0.5 rounded border border-amber-300 dark:border-amber-700\">${p.tag || 'Active'}</span>\n                        </div>\n                        <h4 class=\"font-black text-base text-slate-800 dark:text-white mt-2.5\">${p.name}</h4>\n                        <p class=\"text-xs text-slate-400 mt-1 min-h-[36px] line-clamp-2\">${p.desc}</p>\n                        <p class=\"text-xl font-black text-blue-600 dark:text-blue-400 mt-2\">${p.price.toLocaleString()} VNĐ</p>\n                    </div>\n                    <div class=\"flex space-x-2 pt-3 border-t border-slate-100 dark:border-slate-700\">\n                        <button onclick=\"editPackagePrompt('${p.id}')\" class=\"flex-1 py-1.5 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-600 transition\">Sửa giá</button>\n                        <button onclick=\"deletePackage('${p.id}', '${p.name}')\" class=\"px-3 py-1.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 dark:text-rose-400 rounded-lg text-xs font-bold border border-rose-200 dark:border-rose-800 transition\">Xóa</button>\n                    </div>\n                </div>\n            `).join('');\n        }\n\n        function renderVouchers() {\n            const container = document.getElementById('vouchersListContainer');\n            if (!container) return;\n\n            container.innerHTML = vouchersData.map(v => `\n                <div class=\"p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between hover:border-blue-300 transition\">\n                    <div>\n                        <span class=\"font-mono font-black text-blue-600 dark:text-blue-400 text-sm tracking-wider\">${v.code}</span>\n                        <p class=\"text-xs font-bold text-slate-700 dark:text-gray-200 mt-1\">${v.discount}</p>\n                        <span class=\"text-[10px] text-slate-400 font-mono\">HSD: ${v.expiry}</span>\n                    </div>\n                    <span class=\"bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] px-2 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800\">Đang bật</span>\n                </div>\n            `).join('');\n        }\n\n        function openAddPackageModal() {\n            document.getElementById('addPkgModal').classList.remove('hidden');\n        }\n\n        function openAddVoucherModal() {\n            document.getElementById('addVoucherModal').classList.remove('hidden');\n        }\n\n        function closeModal(id) {\n            document.getElementById(id).classList.add('hidden');\n        }\n\n        function handleSavePackage(e) {\n            e.preventDefault();\n            const pkg = {\n                name: document.getElementById('pkgName').value.trim(),\n                potatoes: Number(document.getElementById('pkgPotatoes').value),\n                price: Number(document.getElementById('pkgPrice').value),\n                tag: document.getElementById('pkgTag').value.trim(),\n                desc: document.getElementById('pkgDesc').value.trim()\n            };\n            DB.savePackage(pkg);\n            closeModal('addPkgModal');\n            DB.notify(`Đã thêm gói nạp \"${pkg.name}\" thành công!`, 'success');\n        }\n\n        function handleSaveVoucher(e) {\n            e.preventDefault();\n            const code = document.getElementById('voucherCode').value.trim().toUpperCase();\n            const discount = document.getElementById('voucherDiscount').value.trim();\n            const expiryRaw = document.getElementById('voucherExpiry').value;\n            const expiry = expiryRaw ? expiryRaw.split('-').reverse().join('/') : '31/12/2026';\n\n            if (!code) return;\n\n            vouchersData.unshift({\n                code: code,\n                discount: discount,\n                expiry: expiry,\n                active: true\n            });\n\n            renderVouchers();\n            closeModal('addVoucherModal');\n            DB.notify(`Đã tạo mã ưu đãi ${code} thành công!`, 'success');\n            document.getElementById('voucherCode').value = '';\n            document.getElementById('voucherDiscount').value = '';\n        }\n\n        async function editPackagePrompt(id) {\n            const pkgs = DB.getPackages();\n            const p = pkgs.find(x => x.id === id);\n            if (!p) return;\n\n            let newPriceVal = null;\n            if (window.AdminUI && window.AdminUI.prompt) {\n                newPriceVal = await window.AdminUI.prompt({\n                    title: `Cập nhật đơn giá ${p.name}`,\n                    message: `Thiết lập giá bán mới bằng VNĐ cho gói \"${p.name}\" (hiện tại: ${p.price.toLocaleString()} đ).`,\n                    label: 'Đơn giá mới (VNĐ):',\n                    placeholder: 'VD: 49000',\n                    defaultValue: String(p.price),\n                    requireInput: true,\n                    confirmText: 'Lưu thay đổi',\n                    cancelText: 'Hủy bỏ'\n                });\n            } else {\n                newPriceVal = prompt(`Cập nhật giá mới cho gói ${p.name} (hiện tại: ${p.price}):`, p.price);\n            }\n\n            if (newPriceVal !== null && newPriceVal.trim() !== '' && !isNaN(newPriceVal)) {\n                p.price = Number(newPriceVal);\n                DB.savePackage(p);\n                DB.notify(`Đã cập nhật giá mới cho gói ${p.name}: ${p.price.toLocaleString()} VNĐ`, 'success');\n            }\n        }\n\n        async function deletePackage(id, name) {\n            let confirmed = false;\n            if (window.AdminUI && window.AdminUI.confirm) {\n                confirmed = await window.AdminUI.confirm({\n                    title: 'Xác nhận xóa gói nạp',\n                    message: `Bạn có chắc chắn muốn xóa gói nạp \"${name}\" khỏi hệ thống? Độc giả sẽ không thể chọn gói này khi nạp khoai tây nữa.`,\n                    confirmText: 'Xác nhận xóa',\n                    cancelText: 'Giữ lại',\n                    confirmType: 'danger'\n                });\n            } else {\n                confirmed = confirm(`Bạn có chắc muốn xóa gói nạp \"${name}\"?`);\n            }\n\n            if (confirmed) {\n                DB.deletePackage(id);\n                DB.notify(`Đã xóa gói \"${name}\" thành công.`, 'info');\n            }\n        }\n    ";

export default function QuanLyUuDai() {
  useLegacyAdminPage("QuanLyUuDai.html", pageCode, false);

  return (
    <div className="admin-page-root">
{/* Shared Sidebar */}
    <div id="admin-sidebar-container"></div>

    {/* Main Content Area (No Footer) */}
    <main className="flex-1 flex flex-col h-full bg-white dark:bg-gray-950 overflow-hidden">
        {/* Shared Header */}
        <div id="admin-header-container" data-title="Quản Lý Ưu Đãi & Gói Nạp Khoai Tây" data-subtitle="Cấu hình các gói điểm đọc sách khoai tây, thiết lập voucher và chính sách khuyến mãi"></div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
            <div className="w-full space-y-6">

                {/* Header Actions */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                    <div>
                        <h3 className="font-black text-sm text-slate-800 dark:text-white flex items-center gap-2">
                            <span>🥔</span>
                            <span>Danh Mục Gói Nạp Khoai Tây Đang Hoạt Động</span>
                        </h3>
                        <p className="text-xs text-slate-400">Hiển thị theo thanh cuộn ngang/carousel tại trang nạp tiền của độc giả</p>
                    </div>

                    <div className="flex items-center space-x-2">
                        <button onClick={() => { window.scrollPackages(-1) }} className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-white flex items-center justify-center border border-slate-200 dark:border-slate-600 transition shadow-sm" title="Cuộn sang trái">
                            <i className="fa-solid fa-chevron-left text-xs"></i>
                        </button>
                        <button onClick={() => { window.scrollPackages(1) }} className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-white flex items-center justify-center border border-slate-200 dark:border-slate-600 transition shadow-sm" title="Cuộn sang phải">
                            <i className="fa-solid fa-chevron-right text-xs"></i>
                        </button>
                        <button onClick={() => { window.openAddPackageModal() }} className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-sm flex items-center space-x-1.5 transition">
                            <i className="fa-solid fa-plus text-xs"></i>
                            <span>Thêm Gói Nạp</span>
                        </button>
                    </div>
                </div>

                {/* Packages Carousel */}
                <div className="relative">
                    <div id="adminPackagesContainer" className="flex gap-4 overflow-x-auto pb-3 pt-1 snap-x scroll-smooth">
                        {/* Populated dynamically */}
                    </div>
                </div>

                {/* Voucher Codes Section */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                    <div className="border-b border-slate-200 dark:border-slate-700 pb-3 flex justify-between items-center">
                        <div>
                            <h3 className="font-black text-base text-slate-800 dark:text-white flex items-center gap-2">
                                <i className="fa-solid fa-tags text-blue-600"></i>
                                <span>Mã Giảm Giá & Voucher Thuê Sách</span>
                            </h3>
                            <p className="text-xs text-slate-400">Các mã ưu đãi áp dụng khi độc giả thuê sách</p>
                        </div>
                        <button onClick={() => { window.openAddVoucherModal() }} className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center space-x-1.5">
                            <i className="fa-solid fa-plus text-xs"></i>
                            <span> Thêm Mã Voucher</span>
                        </button>
                    </div>

                    <div id="vouchersListContainer" className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Populated dynamically */}
                    </div>
                </div>

            </div>
        </div>
    </main>

    {/* Modal Thêm Gói Khoai Tây */}
    <div id="addPkgModal" className="fixed inset-0 bg-slate-800/60 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-3">
                <h3 className="font-black text-base text-slate-800 dark:text-white flex items-center space-x-2">
                    <span>🥔</span>
                    <span>Thêm Gói Nạp Khoai Tây Mới</span>
                </h3>
                <button onClick={() => { window.closeModal('addPkgModal') }} className="text-slate-400 hover:text-slate-800 dark:hover:text-white font-bold"><i className="fa-solid fa-xmark text-lg"></i></button>
            </div>
            <form onSubmit={() => { window.handleSavePackage(event) }} className="space-y-3">
                <div>
                    <label className="block text-xs font-extrabold uppercase text-slate-600 dark:text-slate-300 mb-1">Tên gói nạp *</label>
                    <input type="text" id="pkgName" required placeholder="Gói Sinh Viên / Gói Siêu Cấp..." className="w-full px-3.5 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold dark:text-white" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-extrabold uppercase text-slate-600 dark:text-slate-300 mb-1">Số củ khoai *</label>
                        <input type="number" id="pkgPotatoes" required value="200" min="10" className="w-full px-3.5 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold dark:text-white" />
                    </div>
                    <div>
                        <label className="block text-xs font-extrabold uppercase text-slate-600 dark:text-slate-300 mb-1">Giá bán (VNĐ) *</label>
                        <input type="number" id="pkgPrice" required value="99000" step="1000" className="w-full px-3.5 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold dark:text-white" />
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-extrabold uppercase text-slate-600 dark:text-slate-300 mb-1">Nhãn nổi bật (Tag)</label>
                    <input type="text" id="pkgTag" value="Ưu đãi mới" className="w-full px-3.5 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold dark:text-white" />
                </div>
                <div>
                    <label className="block text-xs font-extrabold uppercase text-slate-600 dark:text-slate-300 mb-1">Mô tả gói</label>
                    <textarea id="pkgDesc" rows="2" className="w-full px-3.5 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold dark:text-white">Gói nạp tiết kiệm dành cho độc giả yêu sách.</textarea>
                </div>
                <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200 dark:border-slate-700">
                    <button type="button" onClick={() => { window.closeModal('addPkgModal') }} className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-gray-200 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-600">Hủy</button>
                    <button type="submit" className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-sm">Lưu Gói Nạp</button>
                </div>
            </form>
        </div>
    </div>

    {/* Modal Thêm Mã Voucher Mới */}
    <div id="addVoucherModal" className="fixed inset-0 bg-slate-800/60 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-3">
                <h3 className="font-black text-base text-slate-800 dark:text-white flex items-center space-x-2">
                    <i className="fa-solid fa-tags text-blue-600"></i>
                    <span>Tạo Mã Voucher Khuyến Mãi Mới</span>
                </h3>
                <button onClick={() => { window.closeModal('addVoucherModal') }} className="text-slate-400 hover:text-slate-800 dark:hover:text-white font-bold"><i className="fa-solid fa-xmark text-lg"></i></button>
            </div>
            <form onSubmit={() => { window.handleSaveVoucher(event) }} className="space-y-3">
                <div>
                    <label className="block text-xs font-extrabold uppercase text-slate-600 dark:text-slate-300 mb-1">Mã Voucher (Code) *</label>
                    <input type="text" id="voucherCode" required placeholder="VD: HALM50, SUMMER2026..." className="w-full px-3.5 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold uppercase dark:text-white" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-extrabold uppercase text-slate-600 dark:text-slate-300 mb-1">Mức Giảm *</label>
                        <input type="text" id="voucherDiscount" required placeholder="VD: Giảm 50%, Tặng 50 Khoai..." className="w-full px-3.5 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold dark:text-white" />
                    </div>
                    <div>
                        <label className="block text-xs font-extrabold uppercase text-slate-600 dark:text-slate-300 mb-1">Hạn Sử Dụng (HSD) *</label>
                        <input type="date" id="voucherExpiry" required value="2026-12-31" className="w-full px-3.5 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold dark:text-white" />
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-extrabold uppercase text-slate-600 dark:text-slate-300 mb-1">Mô tả ưu đãi</label>
                    <input type="text" id="voucherDesc" placeholder="VD: Áp dụng cho tất cả đơn thuê sách tháng này." className="w-full px-3.5 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold dark:text-white" />
                </div>
                <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200 dark:border-slate-700">
                    <button type="button" onClick={() => { window.closeModal('addVoucherModal') }} className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-gray-200 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-600">Hủy</button>
                    <button type="submit" className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-sm">Tạo Voucher</button>
                </div>
            </form>
        </div>
    </div>

    {/* Core Scripts */}
    </div>
  );
}
