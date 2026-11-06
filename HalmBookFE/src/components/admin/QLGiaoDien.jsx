import React from 'react';
import { useLegacyAdminPage } from './legacy-runtime';

const pageCode = "\n        async function uploadBannerPrompt() {\n            let title = '';\n            if (window.AdminUI && window.AdminUI.prompt) {\n                title = await window.AdminUI.prompt({\n                    title: 'Tải lên Banner Quảng Bá',\n                    message: 'Nhập tiêu đề hoặc thông điệp chính xuất hiện trên banner trang chủ:',\n                    label: 'Tiêu đề banner:',\n                    placeholder: 'VD: Khám phá tri thức cùng HALMBOOK',\n                    defaultValue: 'Khám phá tri thức cùng HALMBOOK',\n                    requireInput: true,\n                    confirmText: 'Lưu & Kích hoạt banner',\n                    cancelText: 'Hủy bỏ'\n                });\n            } else {\n                title = prompt('Nhập tiêu đề banner mới:', 'Khám phá tri thức cùng HALMBOOK');\n            }\n\n            if (title && title.trim()) {\n                DB.notify(`Đã tải lên và kích hoạt banner \"${title.trim()}\" thành công!`, 'success');\n            }\n        }\n\n        function saveSiteConfig() {\n            DB.notify('Đã lưu toàn bộ cấu hình giao diện & liên hệ thành công!', 'success');\n        }\n    ";

export default function QuanLyGiaoDien() {
  useLegacyAdminPage("QuanLyGiaoDien.html", pageCode, false);

  return (
    <div className="admin-page-root">
{/* Shared Sidebar */}
    <div id="admin-sidebar-container"></div>

    {/* Main Content Area (No Footer) */}
    <main className="flex-1 flex flex-col h-full bg-white dark:bg-gray-950 overflow-hidden">
        {/* Shared Header */}
        <div id="admin-header-container" data-title="Quản Lý Giao Diện Ứng Dụng" data-subtitle="Tùy biến banner quảng cáo, thông tin liên hệ và phong cách hiển thị người dùng"></div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
            <div className="w-full space-y-6">

                {/* Banner Section */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                    <div className="border-b-2 border-slate-300 dark:border-slate-600 dark:border-slate-600 pb-3 flex justify-between items-center">
                        <div>
                            <h3 className="font-black text-base text-slate-800 dark:text-white flex items-center gap-2">
                                <i className="fa-solid fa-images text-blue-600 dark:text-blue-400"></i>
                                <span>Quản Lý Banner Quảng Cáo & Sự Kiện</span>
                            </h3>
                            <p className="text-xs text-slate-400">Banner hiển thị nổi bật tại trang chủ của độc giả</p>
                        </div>
                        <button onClick={() => { window.uploadBannerPrompt() }} className="px-3.5 py-1.5 bg-gray-600 hover:bg-gray-700 text-white rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-600 shadow-sm transition">
                            + Tải Banner Mới
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-700 overflow-hidden shadow-sm flex flex-col">
                            <div className="h-36 bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center relative p-4 text-white">
                                <div className="text-center">
                                    <span className="text-[10px] font-black uppercase bg-black/40 px-2 py-0.5 rounded-full">Sự kiện độc quyền</span>
                                    <h4 className="font-black text-lg mt-1">Đại Tiệc Đọc Sách Mùa Thu 2026</h4>
                                    <p className="text-xs text-blue-100">Ưu đãi giảm 50% toàn bộ kho sách</p>
                                </div>
                                <span className="absolute top-2 left-2 bg-slate-50 text-slate-700 text-[9px] font-bold px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">Đang hiển thị</span>
                            </div>
                            <div className="p-3 bg-white dark:bg-slate-700 border-t-2 border-slate-300 dark:border-slate-600 dark:border-slate-600 flex justify-between items-center text-xs">
                                <div>
                                    <span className="font-bold">Banner_MuaThu_2026.jpg</span>
                                    <p className="text-[10px] text-slate-400">Kích thước: 1200x400px</p>
                                </div>
                                <button onClick={() => { window.DB.notify('Đã gỡ banner khỏi hiển thị trang chủ!', 'warning') }} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg border border-slate-300 dark:border-slate-600"><i className="fa-solid fa-trash"></i></button>
                            </div>
                        </div>

                        <div className="border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-700 overflow-hidden shadow-sm flex flex-col">
                            <div className="h-36 bg-gradient-to-r from-gray-500 to-emerald-600 flex items-center justify-center relative p-4 text-white">
                                <div className="text-center">
                                    <span className="text-[10px] font-black uppercase bg-black/40 px-2 py-0.5 rounded-full">Hội viên VIP</span>
                                    <h4 className="font-black text-lg mt-1">Nạp Khoai Tây - Nhận Ngay Quà Khủng</h4>
                                    <p className="text-xs text-gray-100">Tặng thêm 20% củ khoai cho lần nạp đầu</p>
                                </div>
                                <span className="absolute top-2 left-2 bg-slate-50 text-slate-700 text-[9px] font-bold px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">Đang hiển thị</span>
                            </div>
                            <div className="p-3 bg-white dark:bg-slate-700 border-t-2 border-slate-300 dark:border-slate-600 dark:border-slate-600 flex justify-between items-center text-xs">
                                <div>
                                    <span className="font-bold">Banner_NapKhoai_UuDai.jpg</span>
                                    <p className="text-[10px] text-slate-400">Kích thước: 1200x400px</p>
                                </div>
                                <button onClick={() => { window.DB.notify('Đã gỡ banner khỏi hiển thị trang chủ!', 'warning') }} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg border border-slate-300 dark:border-slate-600"><i className="fa-solid fa-trash"></i></button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer & Contact Customization Section */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                    <div className="border-b-2 border-slate-300 dark:border-slate-600 dark:border-slate-600 pb-3 flex justify-between items-center">
                        <div>
                            <h3 className="font-black text-base text-slate-800 dark:text-white flex items-center gap-2">
                                <i className="fa-solid fa-address-book text-blue-600 dark:text-blue-400"></i>
                                <span>Cấu Hình Thông Tin Chân Trang (Footer Người Dùng)</span>
                            </h3>
                            <p className="text-xs text-slate-400">Thông tin hỗ trợ xuất hiện ở giao diện của độc giả</p>
                        </div>
                        <button onClick={() => { window.saveSiteConfig() }} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-600 shadow-sm transition">
                            Lưu Cấu Hình
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-extrabold uppercase mb-1">Số điện thoại Hotline</label>
                            <input type="text" id="cfgPhone" value="0397409029" className="w-full px-3.5 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 dark:border-slate-600 rounded-xl text-xs font-bold dark:text-white" />
                        </div>
                        <div>
                            <label className="block text-xs font-extrabold uppercase mb-1">Email hỗ trợ khách hàng</label>
                            <input type="email" id="cfgEmail" value="support@halmbook.vn" className="w-full px-3.5 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 dark:border-slate-600 rounded-xl text-xs font-bold dark:text-white" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-extrabold uppercase mb-1">Thông điệp thương hiệu / Bản quyền</label>
                            <input type="text" id="cfgCopyright" value="© 2026 HALMBOOK - Nền tảng đọc sách điện tử bản quyền thế hệ mới." className="w-full px-3.5 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 dark:border-slate-600 rounded-xl text-xs font-bold dark:text-white" />
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </main>

    {/* Core Scripts */}
    </div>
  );
}
