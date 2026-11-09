import React, { useState, useEffect, useRef } from 'react';
import { useLegacyAdminPage } from './legacy-runtime';
import {
  getBanners,
  addBanner,
  updateBanner,
  toggleBannerStatus,
  deleteBanner,
  resetDefaultBanners,
  getSiteSettings,
  saveSiteSettings
} from '@/services/bannerService';

const LAYOUT_TYPES = [
  {
    type: 'custom_image',
    name: 'Banner Hình Ảnh Tải Lên',
    icon: 'fa-image',
    color: 'from-blue-600 to-indigo-800',
    desc: 'Tải ảnh thiết kế đồ họa tự do từ máy tính hoặc dán URL (Chế độ ảnh toàn phần hoặc kèm chữ nổi)'
  },
  {
    type: 'showcase',
    name: 'Showcase 3 Sách Đa Sắc',
    icon: 'fa-sparkles',
    color: 'from-amber-600 to-rose-700',
    desc: 'Hiển thị 3 cuốn sách nổi bật với hiệu ứng 3D đổ bóng đa sắc'
  },
  {
    type: 'mascot_ai',
    name: 'Trợ Lý AI Khoai Nhỏ',
    icon: 'fa-robot',
    color: 'from-amber-500 to-amber-700',
    desc: 'Bong bóng chat Mascot Khoai Nhỏ kèm 4 chip câu hỏi tương tác mở Chatbot'
  },
  {
    type: 'vip_potato',
    name: 'Hội Viên & Ví Khoai Tây',
    icon: 'fa-crown',
    color: 'from-yellow-500 to-amber-600',
    desc: 'Ma trận 4 cấp bậc hội viên hoàng gia & thanh hiển thị Ví Khoai Tây'
  },
  {
    type: 'hot_deal',
    name: 'Hot Deal & Voucher Răng Cưa',
    icon: 'fa-fire',
    color: 'from-red-600 to-rose-800',
    desc: 'Ngăn thẻ Voucher coupon có rãnh xé răng cưa & nút sao chép mã tức thì'
  },
  {
    type: 'reader_3d',
    name: 'HALM Reader 3D & Focus Sound',
    icon: 'fa-headphones',
    color: 'from-teal-600 to-emerald-800',
    desc: 'Trình đọc 3D lật trang mô phỏng kết hợp máy phát sóng âm nhạc nền tập trung'
  }
];

const EMPTY_BANNER_FORM = {
  title: '',
  titleHighlight: '',
  eyebrow: '',
  layoutType: 'custom_image',
  description: '',
  actionText: 'Khám Phá Ngay',
  actionLink: '#trending-section',
  icon: 'ph-sparkle',
  gradient: 'linear-gradient(135deg, #1C1D1A 0%, #2B161B 100%)',
  isActive: true,
  imageUrl: '',
  imageMode: 'pure', // 'pure' (chỉ ảnh toàn màn) | 'overlay' (ảnh kèm chữ nổi)
  mascotQuote: 'Chào bạn đọc! Mình là Khoai Nhỏ HALM 🥔. Hôm nay bạn muốn tìm sách hay giải đáp điều gì nào?',
  dealBadge: 'HOT DEAL TUẦN NÀY 🔥'
};

export default function QuanLyGiaoDien() {
  useLegacyAdminPage("QuanLyGiaoDien.html", null, false);

  const [activeTab, setActiveTab] = useState('banners'); // 'banners' | 'footer'
  const [banners, setBanners] = useState(() => getBanners());
  const [siteSettings, setSiteSettings] = useState(() => getSiteSettings());

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(EMPTY_BANNER_FORM);
  const fileInputRef = useRef(null);

  // Confirmation modals
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, banner: null });
  const [resetModalOpen, setResetModalOpen] = useState(false);

  // Footer form state
  const [footerForm, setFooterForm] = useState(() => getSiteSettings());

  // Toast
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 3200);
  };

  // Sync data on events
  useEffect(() => {
    const handleBannersUpdated = (e) => {
      if (Array.isArray(e.detail?.banners)) {
        setBanners([...e.detail.banners]);
      } else {
        setBanners(getBanners());
      }
    };
    const handleSettingsUpdated = (e) => {
      if (e.detail?.settings) {
        setSiteSettings(e.detail.settings);
        setFooterForm(e.detail.settings);
      }
    };

    window.addEventListener('halm-banners-updated', handleBannersUpdated);
    window.addEventListener('halm-site-settings-updated', handleSettingsUpdated);

    return () => {
      window.removeEventListener('halm-banners-updated', handleBannersUpdated);
      window.removeEventListener('halm-site-settings-updated', handleSettingsUpdated);
    };
  }, []);

  // Handlers for Banners
  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingId(null);
    setFormData(EMPTY_BANNER_FORM);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (banner) => {
    setModalMode('edit');
    setEditingId(banner.id);
    setFormData({
      title: banner.title || '',
      titleHighlight: banner.titleHighlight || '',
      eyebrow: banner.eyebrow || '',
      layoutType: banner.layoutType || (banner.imageUrl ? 'custom_image' : 'showcase'),
      description: banner.description || '',
      actionText: banner.actionText || 'Khám Phá Ngay',
      actionLink: banner.actionLink || '#trending-section',
      icon: banner.icon || 'ph-sparkle',
      gradient: banner.gradient || 'linear-gradient(135deg, #1C1D1A 0%, #2B161B 100%)',
      isActive: banner.isActive !== undefined ? banner.isActive : true,
      imageUrl: banner.imageUrl || '',
      imageMode: banner.imageMode || 'pure',
      mascotQuote: banner.mascotQuote || 'Chào bạn đọc! Mình là Khoai Nhỏ HALM 🥔. Hôm nay bạn muốn tìm sách hay giải đáp điều gì nào?',
      dealBadge: banner.dealBadge || 'HOT DEAL TUẦN NÀY 🔥'
    });
    setIsModalOpen(true);
  };

  const handleToggleActive = (id) => {
    const updated = toggleBannerStatus(id);
    if (Array.isArray(updated)) {
      setBanners([...updated]);
    } else {
      setBanners(getBanners());
    }
    showToast('Đã cập nhật trạng thái hiển thị banner trên trang chủ!');
  };

  const handleDeleteClick = (banner) => {
    setDeleteModal({ isOpen: true, banner });
  };

  const confirmDelete = () => {
    if (!deleteModal.banner) return;
    const updated = deleteBanner(deleteModal.banner.id);
    if (Array.isArray(updated)) {
      setBanners([...updated]);
    } else {
      setBanners(getBanners());
    }
    setDeleteModal({ isOpen: false, banner: null });
    showToast(`Đã xóa banner "${deleteModal.banner.title}" thành công!`, 'warning');
  };

  const confirmResetDefaults = () => {
    const reset = resetDefaultBanners();
    setBanners([...reset]);
    setResetModalOpen(false);
    showToast('Đã khôi phục 5 banner chuẩn của HALM BOOK thành công!');
  };

  // Image Upload handler (File -> Base64 Data URL)
  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Vui lòng chọn tệp hình ảnh hợp lệ (PNG, JPG, WebP, SVG)!', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Kích thước ảnh không nên vượt quá 5MB để đảm bảo tốc độ tải!', 'warning');
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFormData((prev) => ({
        ...prev,
        imageUrl: reader.result,
        layoutType: prev.layoutType === 'custom_image' ? 'custom_image' : prev.layoutType
      }));
      showToast('Đã tải ảnh lên thành công!');
    };
    reader.onerror = () => {
      showToast('Không thể đọc file ảnh. Vui lòng thử lại!', 'error');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setFormData((prev) => ({ ...prev, imageUrl: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
    showToast('Đã gỡ ảnh khỏi banner.', 'info');
  };

  const handleSaveBanner = (e) => {
    e.preventDefault();
    if (formData.layoutType !== 'custom_image' || formData.imageMode !== 'pure') {
      if (!formData.title.trim()) {
        showToast('Vui lòng nhập tiêu đề chính của banner!', 'error');
        return;
      }
    } else if (formData.layoutType === 'custom_image' && !formData.imageUrl) {
      showToast('Vui lòng chọn hoặc tải lên hình ảnh cho banner!', 'error');
      return;
    }

    let updatedList;
    if (modalMode === 'create') {
      updatedList = addBanner(formData);
      showToast('Đã thêm banner mới vào trang chủ thành công!');
    } else {
      updatedList = updateBanner(editingId, formData);
      showToast('Đã cập nhật banner thành công!');
    }

    setBanners(Array.isArray(updatedList) ? [...updatedList] : getBanners());
    setIsModalOpen(false);
  };

  // Handlers for Footer Settings
  const handleSaveFooter = (e) => {
    e.preventDefault();
    saveSiteSettings(footerForm);
    setSiteSettings(footerForm);
    showToast('Đã lưu và đồng bộ toàn bộ cấu hình Chân Trang (Footer) tới người dùng!');
  };

  const activeCount = banners.filter((b) => b.isActive).length;
  const inactiveCount = banners.length - activeCount;

  return (
    <div className="admin-page-root">
      {/* Shared Sidebar */}
      <div id="admin-sidebar-container"></div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-900 overflow-hidden">
        {/* Shared Header */}
        <div
          id="admin-header-container"
          data-title="Quản Lý Giao Diện & Banners"
          data-subtitle="Tùy biến toàn diện banners trang chủ đa bố cục, tải ảnh tự do và đồng bộ chân trang"
        ></div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {/* Toast Notification */}
          {toast.show && (
            <div className="fixed top-6 right-6 z-50 flex items-center gap-3 rounded-2xl bg-slate-900/95 dark:bg-slate-800/95 text-white px-5 py-3.5 shadow-2xl border border-slate-700 backdrop-blur-md animate-fade-in">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-xl text-sm ${
                  toast.type === 'error'
                    ? 'bg-rose-500 text-white'
                    : toast.type === 'warning'
                    ? 'bg-amber-500 text-white'
                    : 'bg-emerald-500 text-white'
                }`}
              >
                <i
                  className={`fa-solid ${
                    toast.type === 'error'
                      ? 'fa-triangle-exclamation'
                      : toast.type === 'warning'
                      ? 'fa-circle-exclamation'
                      : 'fa-check'
                  }`}
                ></i>
              </span>
              <span className="text-xs font-bold">{toast.message}</span>
            </div>
          )}

          {/* Navigation Tabs & Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('banners')}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
                  activeTab === 'banners'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <i className="fa-solid fa-images"></i>
                <span>Banners Trang Chủ</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    activeTab === 'banners'
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-200'
                  }`}
                >
                  {banners.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('footer')}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
                  activeTab === 'footer'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <i className="fa-solid fa-address-book"></i>
                <span>Cấu Hình Chân Trang & Hotline</span>
              </button>
            </div>

            {activeTab === 'banners' && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setResetModalOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-xl transition"
                  title="Khôi phục 5 banner chuẩn mặc định"
                >
                  <i className="fa-solid fa-rotate-left"></i>
                  <span>Khôi Phục Chuẩn</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenCreate}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/20 transition hover:-translate-y-0.5"
                >
                  <i className="fa-solid fa-cloud-arrow-up"></i>
                  <span>Tải Lên / Thêm Banner</span>
                </button>
              </div>
            )}
          </div>

          {/* TAB 1: QUẢN LÝ BANNERS TRANG CHỦ */}
          {activeTab === 'banners' && (
            <div className="space-y-6">
              {/* Stats Ribbon */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-lg">
                    <i className="fa-solid fa-rectangle-ad"></i>
                  </div>
                  <div>
                    <div className="text-xl font-black text-slate-800 dark:text-white">{banners.length}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Tổng Banners</div>
                  </div>
                </div>

                <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-lg">
                    <i className="fa-solid fa-circle-check"></i>
                  </div>
                  <div>
                    <div className="text-xl font-black text-slate-800 dark:text-white">{activeCount}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Đang Hiển Thị</div>
                  </div>
                </div>

                <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-lg">
                    <i className="fa-solid fa-eye-slash"></i>
                  </div>
                  <div>
                    <div className="text-xl font-black text-slate-800 dark:text-white">{inactiveCount}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Tạm Ẩn</div>
                  </div>
                </div>

                <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-lg">
                    <i className="fa-solid fa-images"></i>
                  </div>
                  <div>
                    <div className="text-xl font-black text-slate-800 dark:text-white">
                      {banners.filter((b) => b.imageUrl).length}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Ảnh Tải Lên</div>
                  </div>
                </div>
              </div>

              {/* Banners Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {banners.map((banner, index) => {
                  const layoutMeta =
                    LAYOUT_TYPES.find((l) => l.type === banner.layoutType) ||
                    (banner.imageUrl ? LAYOUT_TYPES[0] : LAYOUT_TYPES[1]);

                  return (
                    <div
                      key={banner.id || index}
                      className={`relative bg-white dark:bg-slate-800 rounded-2xl border transition-all overflow-hidden flex flex-col justify-between ${
                        banner.isActive
                          ? 'border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md'
                          : 'border-dashed border-slate-300 dark:border-slate-700 opacity-75'
                      }`}
                    >
                      {/* Top Visual Mockup Preview */}
                      <div
                        className="relative h-48 p-5 flex flex-col justify-between text-white overflow-hidden bg-cover bg-center"
                        style={{
                          backgroundImage: banner.imageUrl
                            ? `linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.65)), url(${banner.imageUrl})`
                            : banner.gradient || 'linear-gradient(135deg, #1C1D1A 0%, #2B161B 100%)'
                        }}
                      >
                        {/* Top Badges */}
                        <div className="relative z-10 flex items-center justify-between">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-black/40 backdrop-blur-md border border-white/20 text-white">
                            <i className={`fa-solid ${layoutMeta.icon || 'fa-image'}`}></i>
                            <span>{layoutMeta.name}</span>
                          </span>

                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                              banner.isActive
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                : 'bg-slate-500/30 text-slate-300 border-slate-400/30'
                            }`}
                          >
                            {banner.isActive ? '● Đang Hiển Thị' : '○ Tạm Ẩn'}
                          </span>
                        </div>

                        {/* Content Header Preview */}
                        <div className="relative z-10 space-y-1">
                          {banner.eyebrow && (
                            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-300">
                              {banner.eyebrow}
                            </span>
                          )}
                          <h4 className="text-base font-black leading-tight text-white line-clamp-1">
                            {banner.title || 'Banner Hình Ảnh Tự Thiết Kế'}
                          </h4>
                          {banner.titleHighlight && (
                            <span className="block text-xs font-bold text-amber-300/90">
                              {banner.titleHighlight}
                            </span>
                          )}
                        </div>

                        {/* Visual Specific layout tag pill */}
                        <div className="relative z-10 flex items-center justify-between text-[11px] text-white/80 border-t border-white/10 pt-2">
                          <span className="truncate max-w-[220px]">
                            <i className="fa-solid fa-arrow-up-right-from-square mr-1 text-[10px]"></i>
                            {banner.actionText || 'Xem Thêm'} → {banner.actionLink || '#'}
                          </span>
                          <span className="text-[10px] text-white/60 font-mono">
                            Thứ tự: #{index + 1}
                          </span>
                        </div>
                      </div>

                      {/* Bottom Info & Action Bar */}
                      <div className="p-4 space-y-3 bg-white dark:bg-slate-800">
                        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                          {banner.description || (banner.imageUrl ? 'Banner hình ảnh đồ họa tùy biến.' : 'Không có mô tả.')}
                        </p>

                        <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                          {/* Switch active toggle */}
                          <button
                            type="button"
                            onClick={() => handleToggleActive(banner.id)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                              banner.isActive
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-100'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 hover:bg-slate-200'
                            }`}
                          >
                            <i
                              className={`fa-solid ${
                                banner.isActive ? 'fa-toggle-on text-emerald-500' : 'fa-toggle-off text-slate-400'
                              } text-base`}
                            ></i>
                            <span>{banner.isActive ? 'Đang Bật' : 'Đã Tắt'}</span>
                          </button>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(banner)}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                            >
                              <i className="fa-solid fa-pen-to-square"></i>
                              <span>Sửa</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteClick(banner)}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                              title="Xóa banner"
                            >
                              <i className="fa-solid fa-trash"></i>
                              <span>Xóa</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: CẤU HÌNH FOOTER & THÔNG TIN LIÊN HỆ */}
          {activeTab === 'footer' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Form Config */}
              <div className="lg:col-span-7 bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-5">
                <div className="border-b border-slate-200 dark:border-slate-700 pb-4">
                  <h3 className="font-black text-base text-slate-800 dark:text-white flex items-center gap-2">
                    <i className="fa-solid fa-sliders text-blue-600 dark:text-blue-400"></i>
                    <span>Tùy Chỉnh Thông Tin Chân Trang (User Footer)</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Các thông tin này được hiển thị chân thực tại Footer của người dùng và cập nhật tức thì.
                  </p>
                </div>

                <form onSubmit={handleSaveFooter} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                        <i className="fa-solid fa-phone mr-1.5 text-blue-500"></i>Số điện thoại Hotline
                      </label>
                      <input
                        type="text"
                        value={footerForm.hotline || ''}
                        onChange={(e) => setFooterForm({ ...footerForm, hotline: e.target.value })}
                        placeholder="VD: 0397409029"
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                        <i className="fa-solid fa-envelope mr-1.5 text-blue-500"></i>Email hỗ trợ khách hàng
                      </label>
                      <input
                        type="email"
                        value={footerForm.email || ''}
                        onChange={(e) => setFooterForm({ ...footerForm, email: e.target.value })}
                        placeholder="VD: support@halmbook.vn"
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                      <i className="fa-solid fa-location-dot mr-1.5 text-blue-500"></i>Địa chỉ trụ sở / Chi nhánh
                    </label>
                    <input
                      type="text"
                      value={footerForm.address || ''}
                      onChange={(e) => setFooterForm({ ...footerForm, address: e.target.value })}
                      placeholder="VD: 03 Quang Trung, TP. Đà Nẵng"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                      <i className="fa-solid fa-quote-left mr-1.5 text-blue-500"></i>Slogan thương hiệu
                    </label>
                    <input
                      type="text"
                      value={footerForm.slogan || ''}
                      onChange={(e) => setFooterForm({ ...footerForm, slogan: e.target.value })}
                      placeholder="VD: Không gian Đọc Sách & Tri Thức Độc Bản"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                      <i className="fa-solid fa-copyright mr-1.5 text-blue-500"></i>Thông điệp bản quyền
                    </label>
                    <input
                      type="text"
                      value={footerForm.copyright || ''}
                      onChange={(e) => setFooterForm({ ...footerForm, copyright: e.target.value })}
                      placeholder="VD: © 2026 HALM BOOK. Tất cả bản quyền được bảo lưu."
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="pt-3 flex justify-end">
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-lg shadow-blue-500/20 transition hover:-translate-y-0.5"
                    >
                      <i className="fa-solid fa-floppy-disk mr-2"></i>Lưu Cấu Hình Footer
                    </button>
                  </div>
                </form>
              </div>

              {/* Live Preview Box */}
              <div className="lg:col-span-5 bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                <div className="border-b border-slate-200 dark:border-slate-700 pb-3 flex items-center justify-between">
                  <h4 className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2">
                    <i className="fa-solid fa-eye text-emerald-500"></i>
                    <span>Xem Trước Chân Trang (User Preview)</span>
                  </h4>
                  <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                    Live Sync
                  </span>
                </div>

                <div className="rounded-2xl border border-amber-200 dark:border-amber-900/40 bg-[#FAF8F5] dark:bg-[#111210] p-5 text-slate-800 dark:text-amber-100 space-y-4 font-sans">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-full bg-rose-900 text-amber-200 flex items-center justify-center font-black text-sm">
                      H
                    </div>
                    <span className="text-xl font-black tracking-tight text-rose-900 dark:text-amber-200">
                      HALM BOOK
                    </span>
                  </div>

                  <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-rose-900 dark:text-amber-300">
                    <i className="fa-solid fa-book-open"></i>
                    <span>{footerForm.slogan || 'Không gian Đọc Sách & Tri Thức Độc Bản'}</span>
                  </div>

                  <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300 pt-2">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/20 text-rose-900 dark:text-amber-300 text-[10px]">
                        <i className="fa-solid fa-phone"></i>
                      </span>
                      <span className="font-bold">{footerForm.hotline || '0397409029'}</span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/20 text-rose-900 dark:text-amber-300 text-[10px]">
                        <i className="fa-solid fa-envelope"></i>
                      </span>
                      <span>{footerForm.email || 'support@halmbook.vn'}</span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/20 text-rose-900 dark:text-amber-300 text-[10px]">
                        <i className="fa-solid fa-location-dot"></i>
                      </span>
                      <span>{footerForm.address || '03 Quang Trung, TP. Đà Nẵng'}</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200 dark:border-slate-800 text-[10px] text-slate-400 dark:text-slate-500">
                    {footerForm.copyright || '© 2026 HALM BOOK. Tất cả bản quyền được bảo lưu.'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* MODAL: THÊM / SỬA BANNER & UPLOAD ẢNH */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden my-8">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-800/80">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white text-sm">
                  <i className={`fa-solid ${modalMode === 'create' ? 'fa-plus' : 'fa-pen-to-square'}`}></i>
                </span>
                <div>
                  <h3 className="font-black text-sm text-slate-800 dark:text-white">
                    {modalMode === 'create' ? 'Tạo / Tải Lên Banner Trang Chủ' : 'Chỉnh Sửa Thông Tin Banner'}
                  </h3>
                  <p className="text-[11px] text-slate-400">Tùy biến bố cục hoặc tải ảnh banner tự thiết kế</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="h-8 w-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveBanner} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Chọn kiểu bố cục */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
                  <i className="fa-solid fa-layer-group mr-1.5 text-blue-500"></i>Hình Thức Hiển Thị (Layout Type)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {LAYOUT_TYPES.map((layout) => (
                    <button
                      key={layout.type}
                      type="button"
                      onClick={() => setFormData({ ...formData, layoutType: layout.type })}
                      className={`p-3 rounded-2xl border text-left transition flex items-start gap-3 ${
                        formData.layoutType === layout.type
                          ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 ring-2 ring-blue-500/20'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 hover:bg-slate-100'
                      }`}
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400">
                        <i className={`fa-solid ${layout.icon}`}></i>
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-800 dark:text-white truncate">{layout.name}</div>
                        <div className="text-[10px] text-slate-400 line-clamp-1">{layout.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* KHU VỰC TẢI LÊN ẢNH BANNER TỰ DO */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                    <i className="fa-solid fa-image text-blue-500"></i>
                    <span>Tải Ảnh Banner Từ Máy Tính / Dán Link</span>
                  </label>
                  {formData.imageUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="text-[11px] font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1"
                    >
                      <i className="fa-solid fa-trash-can"></i>Gỡ ảnh
                    </button>
                  )}
                </div>

                {/* Upload Preview or Dropzone */}
                {formData.imageUrl ? (
                  <div className="space-y-2">
                    <div className="relative rounded-2xl overflow-hidden border border-slate-300 dark:border-slate-700 max-h-48 bg-black/5">
                      <img
                        src={formData.imageUrl}
                        alt="Preview Banner"
                        className="w-full h-44 object-cover object-center"
                      />
                      <span className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-lg">
                        Đã tải ảnh
                      </span>
                    </div>

                    {/* Image Mode Switch */}
                    <div className="flex items-center gap-4 pt-1">
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Cách hiển thị:</span>
                      <label className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                        <input
                          type="radio"
                          name="imageMode"
                          value="pure"
                          checked={formData.imageMode === 'pure'}
                          onChange={() => setFormData({ ...formData, imageMode: 'pure' })}
                          className="text-blue-600"
                        />
                        <span>Chỉ ảnh toàn banner (Full Art)</span>
                      </label>
                      <label className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                        <input
                          type="radio"
                          name="imageMode"
                          value="overlay"
                          checked={formData.imageMode === 'overlay'}
                          onChange={() => setFormData({ ...formData, imageMode: 'overlay' })}
                          className="text-blue-600"
                        />
                        <span>Ảnh kèm chữ & nút bấm</span>
                      </label>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 rounded-2xl p-5 text-center cursor-pointer transition bg-white dark:bg-slate-800/60"
                  >
                    <i className="fa-solid fa-cloud-arrow-up text-3xl text-blue-500 mb-2 block"></i>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      Bấm để chọn ảnh từ máy tính (JPG, PNG, WebP)
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Khuyên dùng tỉ lệ 16:9 hoặc ảnh ngang (1200x500px, tối đa 5MB)</p>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="hidden"
                />

                {/* Hoặc nhập URL ảnh trực tiếp */}
                <div>
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="Hoặc dán link ảnh trực tiếp: https://example.com/banner.jpg"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Tiêu đề & Highlight (Chỉ bắt buộc nếu không phải ảnh pure) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    Tiêu đề chính {formData.imageMode === 'pure' && formData.imageUrl ? '(Tùy chọn)' : '(*)'}
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="VD: Một cuốn sách, ngàn cảm hứng"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    Dòng chữ nổi bật (Highlight)
                  </label>
                  <input
                    type="text"
                    value={formData.titleHighlight}
                    onChange={(e) => setFormData({ ...formData, titleHighlight: e.target.value })}
                    placeholder="VD: Cùng HALM BOOK"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Eyebrow & Icon */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    Dòng Eyebrow trên cùng
                  </label>
                  <input
                    type="text"
                    value={formData.eyebrow}
                    onChange={(e) => setFormData({ ...formData, eyebrow: e.target.value })}
                    placeholder="VD: TUYỂN CHỌN DÀNH CHO BẠN"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    Mã Phosphor Icon
                  </label>
                  <input
                    type="text"
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    placeholder="VD: ph-sparkle, ph-robot, ph-crown..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Mô tả chi tiết */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Đoạn mô tả chi tiết {formData.imageMode === 'pure' && formData.imageUrl ? '(Tùy chọn)' : '(*)'}
                </label>
                <textarea
                  rows="2"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Nhập nội dung truyền cảm hứng hoặc hướng dẫn..."
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                ></textarea>
              </div>

              {/* Nút hành động & Link */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    Tên nút bấm (Action Text)
                  </label>
                  <input
                    type="text"
                    value={formData.actionText}
                    onChange={(e) => setFormData({ ...formData, actionText: e.target.value })}
                    placeholder="VD: Khám phá thư viện"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    Đường dẫn chuyển trang (Action Link)
                  </label>
                  <input
                    type="text"
                    value={formData.actionLink}
                    onChange={(e) => setFormData({ ...formData, actionLink: e.target.value })}
                    placeholder="VD: #trending-section, /hang, /uudai..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Layout-specific fields */}
              {formData.layoutType === 'mascot_ai' && (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                    <i className="fa-solid fa-comment-dots mr-1.5"></i>Lời chào Mascot Khoai Nhỏ:
                  </label>
                  <input
                    type="text"
                    value={formData.mascotQuote}
                    onChange={(e) => setFormData({ ...formData, mascotQuote: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-amber-400/30 rounded-xl text-xs text-slate-800 dark:text-white"
                  />
                </div>
              )}

              {formData.layoutType === 'hot_deal' && (
                <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
                    <i className="fa-solid fa-fire mr-1.5"></i>Huy hiệu Deal Nổi Bật:
                  </label>
                  <input
                    type="text"
                    value={formData.dealBadge}
                    onChange={(e) => setFormData({ ...formData, dealBadge: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-red-400/30 rounded-xl text-xs text-slate-800 dark:text-white"
                  />
                </div>
              )}

              {/* Trạng thái hiển thị */}
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="isActiveCheck"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="isActiveCheck" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Kích hoạt hiển thị ngay trên Trang Chủ
                </label>
              </div>

              {/* Footer Buttons */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-lg shadow-blue-500/20 transition hover:-translate-y-0.5"
                >
                  {modalMode === 'create' ? 'Tạo Banner' : 'Lưu Thay Đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-xl">
                <i className="fa-solid fa-trash-can"></i>
              </span>
              <div>
                <h3 className="font-black text-sm text-slate-800 dark:text-white">Xác Nhận Xóa Banner</h3>
                <p className="text-[11px] text-slate-400">Hành động này sẽ gỡ banner khỏi Trang Chủ</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Bạn có chắc chắn muốn xóa banner{' '}
              <strong className="text-slate-900 dark:text-white">
                "{deleteModal.banner?.title || 'Banner tùy chỉnh'}"
              </strong>{' '}
              không? Dữ liệu sẽ được xóa khỏi danh sách trình chiếu.
            </p>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModal({ isOpen: false, banner: null })}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition"
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shadow-md shadow-rose-600/20 transition"
              >
                Xác Nhận Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM RESET DEFAULTS MODAL */}
      {resetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-xl">
                <i className="fa-solid fa-rotate-left"></i>
              </span>
              <div>
                <h3 className="font-black text-sm text-slate-800 dark:text-white">Khôi Phục Banner Mặc Định</h3>
                <p className="text-[11px] text-slate-400">Trở về 5 bố cục ban đầu của HALM BOOK</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Thao tác này sẽ thiết lập lại toàn bộ các banner chuẩn mặc định của HALM BOOK.
            </p>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setResetModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition"
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                onClick={confirmResetDefaults}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black shadow-md shadow-amber-600/20 transition"
              >
                Khôi Phục Ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
