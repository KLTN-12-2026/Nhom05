import React, { useState, useEffect, useRef } from 'react';
import { useLegacyAdminPage } from './legacy-runtime';
import axiosInstance from '@/services/axiosClient';
import { 
  getCombos, 
  addCombo, 
  updateCombo, 
  deleteCombo, 
  getSingleDeals, 
  addSingleDeal, 
  updateSingleDeal, 
  deleteSingleDeal 
} from '@/services/offerService';

export default function QuanLyUuDai() {
  useLegacyAdminPage("QuanLyUuDai.html", null, false);

  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'packages' | 'vouchers' | 'combos' | 'deals'
  const [packages, setPackages] = useState([]);
  const [vouchers, setVouchers] = useState([]);
  const [combos, setCombos] = useState([]);
  const [singleDeals, setSingleDeals] = useState([]);
  const [loadingPackages, setLoadingPackages] = useState(true);
  const [loadingVouchers, setLoadingVouchers] = useState(true);

  // Package Modal State
  const [isPkgModalOpen, setIsPkgModalOpen] = useState(false);
  const [editingPkg, setEditingPkg] = useState(null);
  const [pkgForm, setPkgForm] = useState({
    packageName: '',
    potatoAmount: '',
    bonusPotato: 0,
    priceVnd: '',
    badgeTag: '',
    description: '',
    isActive: true
  });

  // Voucher Modal State
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState(null);
  const [voucherForm, setVoucherForm] = useState({
    promotion_id: '',
    promotion_name: '',
    discount_percent: 20,
    discount_amount: 0,
    end_date: '',
    description: '',
    status: 'ACTIVE'
  });

  // Combo Modal State
  const [isComboModalOpen, setIsComboModalOpen] = useState(false);
  const [editingCombo, setEditingCombo] = useState(null);
  const [comboForm, setComboForm] = useState({
    name: '',
    desc: '',
    potato: 20,
    originalPotato: 40,
    discount: '-50%',
    booksText: '',
    img: ''
  });

  // Single Deal Modal State
  const [isDealModalOpen, setIsDealModalOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState(null);
  const [dealForm, setDealForm] = useState({
    name: '',
    author: '',
    potato: 8,
    originalPotato: 15,
    discount: '-47%',
    category: 'Sách Chọn Lọc',
    img: ''
  });

  // Confirm Delete Dialog
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    type: 'package', // 'package' | 'voucher' | 'combo' | 'deal'
    id: null,
    name: ''
  });

  // Toast Notification
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3500);
  };

  const carouselRef = useRef(null);
  const [realBooksList, setRealBooksList] = useState([]);

  // Tải danh sách sách thực tế từ MySQL để làm nguồn dữ liệu chọn sách trong Deal/Combo
  useEffect(() => {
    axiosInstance.get('/api/home/books', { params: { pageSize: 120 } })
      .then(res => {
        const payload = res.data;
        const list = Array.isArray(payload) ? payload : (payload?.content || payload?.data || []);
        setRealBooksList(list.map(b => ({
          id: b.book_id || b.id,
          title: b.bookName || b.title || 'Tác phẩm',
          author: b.author || 'HALM BOOK',
          price: b.price !== undefined ? b.price : (b.rent_price || 15),
          img: b.img_url || b.img || '/logo.png',
          category: b.category_name || 'Sách Chọn Lọc'
        })));
      })
      .catch(() => {});
  }, []);

  // Tải danh sách Gói Nạp từ MySQL (lấy toàn bộ các gói, bao gồm cả gói đang ẩn)
  const fetchPackages = async () => {
    setLoadingPackages(true);
    try {
      let res;
      try {
        res = await axiosInstance.get('/api/home/potato/packages/all');
      } catch (_) {
        res = await axiosInstance.get('/api/home/potato/packages');
      }
      const list = Array.isArray(res.data) ? res.data : [];
      setPackages(list.map(p => ({
        packageId: p.packageId || p.package_id || p.id,
        packageName: p.packageName || p.package_name || p.name || 'Gói Nạp',
        potatoAmount: p.potatoAmount !== undefined ? p.potatoAmount : (p.potato_amount || 0),
        bonusPotato: p.bonusPotato !== undefined ? p.bonusPotato : (p.bonus_potato || 0),
        priceVnd: p.priceVnd !== undefined ? p.priceVnd : (p.price_vnd || 0),
        badgeTag: p.badgeTag || p.badge_tag || p.tag || '',
        description: p.description || p.desc || '',
        isActive: p.isActive !== undefined ? p.isActive : (p.is_active !== false)
      })));
    } catch {
      setPackages([]);
    } finally {
      setLoadingPackages(false);
    }
  };

  // Tải danh sách Voucher từ MySQL
  const fetchVouchers = async () => {
    setLoadingVouchers(true);
    try {
      try {
        const res = await axiosInstance.get('/api/promotions');
        const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        setVouchers(list.map(v => ({
          promotion_id: v.promotion_id || v.promotionId || v.code || v.id,
          promotion_name: v.promotion_name || v.promotionName || v.name || '',
          discount_percent: v.discount_percent !== undefined ? v.discount_percent : (v.discountPercent || 0),
          discount_amount: v.discount_amount !== undefined ? v.discount_amount : (v.discountAmount || 0),
          end_date: v.end_date || v.endDate || '',
          description: v.description || v.desc || '',
          status: v.status || 'ACTIVE'
        })));
        return;
      } catch {}

      const resHome = await axiosInstance.get('/api/home/promotions');
      const list = Array.isArray(resHome.data) ? resHome.data : [];
      setVouchers(list.map(v => ({
        promotion_id: v.promotion_id || v.promotionId || v.code || v.id,
        promotion_name: v.promotion_name || v.promotionName || v.name || '',
        discount_percent: v.discount_percent !== undefined ? v.discount_percent : (v.discountPercent || 0),
        discount_amount: v.discount_amount !== undefined ? v.discount_amount : (v.discountAmount || 0),
        end_date: v.end_date || v.endDate || '',
        description: v.description || v.desc || '',
        status: v.status || 'ACTIVE'
      })));
    } catch {
      setVouchers([]);
    } finally {
      setLoadingVouchers(false);
    }
  };

  // Tải danh sách Combo & Sách Lẻ Giảm Sâu từ offerService
  const fetchOffers = () => {
    setCombos(getCombos());
    setSingleDeals(getSingleDeals());
  };

  useEffect(() => {
    fetchPackages();
    fetchVouchers();
    fetchOffers();

    const handleOffersUpdated = () => {
      fetchOffers();
    };
    window.addEventListener('halm-offers-updated', handleOffersUpdated);
    return () => {
      window.removeEventListener('halm-offers-updated', handleOffersUpdated);
    };
  }, []);

  // Scroll Packages Carousel
  const scrollPackages = (direction) => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: direction * 320, behavior: 'smooth' });
    }
  };

  // Open Package Modal
  const openPackageModal = (pkg = null) => {
    if (pkg) {
      setEditingPkg(pkg);
      setPkgForm({
        packageName: pkg.packageName,
        potatoAmount: pkg.potatoAmount,
        bonusPotato: pkg.bonusPotato || 0,
        priceVnd: pkg.priceVnd,
        badgeTag: pkg.badgeTag || '',
        description: pkg.description || '',
        isActive: pkg.isActive !== false
      });
    } else {
      setEditingPkg(null);
      setPkgForm({
        packageName: '',
        potatoAmount: '',
        bonusPotato: 0,
        priceVnd: '',
        badgeTag: '',
        description: '',
        isActive: true
      });
    }
    setIsPkgModalOpen(true);
  };

  const handleSavePackage = async (e) => {
    e.preventDefault();
    const payload = {
      packageName: pkgForm.packageName.trim(),
      potatoAmount: Number(pkgForm.potatoAmount),
      bonusPotato: Number(pkgForm.bonusPotato) || 0,
      priceVnd: Number(pkgForm.priceVnd),
      badgeTag: pkgForm.badgeTag.trim(),
      description: pkgForm.description.trim(),
      isActive: pkgForm.isActive
    };

    try {
      if (editingPkg) {
        await axiosInstance.put(`/api/home/potato/packages/${editingPkg.packageId}`, payload);
        showToast(`Cập nhật gói "${payload.packageName}" thành công!`, 'success');
      } else {
        await axiosInstance.post('/api/home/potato/packages', payload);
        showToast(`Thêm gói nạp "${payload.packageName}" thành công!`, 'success');
      }
      await fetchPackages();
    } catch (err) {
      showToast('Lỗi lưu gói nạp: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setIsPkgModalOpen(false);
    }
  };

  const handleTogglePackageStatus = async (pkg) => {
    const updatedStatus = !pkg.isActive;
    try {
      await axiosInstance.put(`/api/home/potato/packages/${pkg.packageId}`, {
        ...pkg,
        isActive: updatedStatus
      });
      showToast(`Đã ${updatedStatus ? 'bật' : 'tắt'} hiển thị gói "${pkg.packageName}"`, 'info');
      await fetchPackages();
    } catch (err) {
      showToast('Lỗi cập nhật trạng thái: ' + err.message, 'error');
    }
  };

  // Voucher Handlers
  const openVoucherModal = (voucher = null) => {
    if (voucher) {
      setEditingVoucher(voucher);
      setVoucherForm({
        promotion_id: voucher.promotion_id,
        promotion_name: voucher.promotion_name,
        discount_percent: voucher.discount_percent || 0,
        discount_amount: voucher.discount_amount || 0,
        end_date: voucher.end_date ? (voucher.end_date.includes('T') ? voucher.end_date.slice(0, 10) : voucher.end_date) : '',
        description: voucher.description || '',
        status: voucher.status || 'ACTIVE'
      });
    } else {
      setEditingVoucher(null);
      setVoucherForm({
        promotion_id: 'HALM' + Math.floor(1000 + Math.random() * 9000),
        promotion_name: '',
        discount_percent: 20,
        discount_amount: 0,
        end_date: '',
        description: '',
        status: 'ACTIVE'
      });
    }
    setIsVoucherModalOpen(true);
  };

  const handleSaveVoucher = async (e) => {
    e.preventDefault();
    const payload = {
      promotion_id: voucherForm.promotion_id.trim().toUpperCase(),
      promotion_name: voucherForm.promotion_name.trim(),
      discount_percent: Number(voucherForm.discount_percent) || 0,
      discount_amount: Number(voucherForm.discount_amount) || 0,
      end_date: voucherForm.end_date ? (voucherForm.end_date.includes('T') ? voucherForm.end_date : `${voucherForm.end_date}T23:59:59`) : null,
      description: voucherForm.description.trim(),
      status: voucherForm.status
    };

    try {
      if (editingVoucher) {
        await axiosInstance.put(`/api/promotions/${editingVoucher.promotion_id}`, payload);
        showToast(`Cập nhật voucher "${payload.promotion_id}" thành công!`, 'success');
      } else {
        await axiosInstance.post('/api/promotions', payload);
        showToast(`Tạo voucher "${payload.promotion_id}" thành công!`, 'success');
      }
      await fetchVouchers();
    } catch (err) {
      showToast('Lỗi lưu voucher: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setIsVoucherModalOpen(false);
    }
  };

  const handleToggleVoucherStatus = async (voucher) => {
    const nextStatus = voucher.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    try {
      await axiosInstance.put(`/api/promotions/${voucher.promotion_id}`, {
        ...voucher,
        status: nextStatus
      });
      showToast(`Đã ${nextStatus === 'ACTIVE' ? 'kích hoạt' : 'tạm dừng'} mã "${voucher.promotion_id}"`, 'info');
      await fetchVouchers();
    } catch (err) {
      showToast('Lỗi cập nhật trạng thái: ' + err.message, 'error');
    }
  };

  // Combo Handlers
  const openComboModal = (combo = null) => {
    if (combo) {
      setEditingCombo(combo);
      setComboForm({
        name: combo.name || '',
        desc: combo.desc || '',
        potato: combo.potato || 20,
        originalPotato: combo.originalPotato || 40,
        discount: combo.discount || '-50%',
        booksText: Array.isArray(combo.books) ? combo.books.join('\n') : '',
        img: combo.img || ''
      });
    } else {
      setEditingCombo(null);
      setComboForm({
        name: '',
        desc: '',
        potato: 20,
        originalPotato: 40,
        discount: '-50%',
        booksText: '',
        img: ''
      });
    }
    setIsComboModalOpen(true);
  };

  const handleSaveCombo = (e) => {
    e.preventDefault();
    const books = comboForm.booksText
      .split('\n')
      .map(b => b.trim())
      .filter(Boolean);

    const payload = {
      name: comboForm.name.trim(),
      desc: comboForm.desc.trim(),
      potato: Number(comboForm.potato) || 10,
      originalPotato: Number(comboForm.originalPotato) || 20,
      discount: comboForm.discount.trim() || '-50%',
      books: books.length > 0 ? books : ['Tác phẩm chọn lọc trong combo'],
      img: comboForm.img.trim() || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=60'
    };

    if (editingCombo) {
      updateCombo(editingCombo.id, payload);
      showToast(`Cập nhật Combo "${payload.name}" thành công!`, 'success');
    } else {
      addCombo(payload);
      showToast(`Tạo mới Combo "${payload.name}" thành công!`, 'success');
    }
    setIsComboModalOpen(false);
    fetchOffers();
  };

  // Single Deal Handlers
  const openDealModal = (deal = null) => {
    if (deal) {
      setEditingDeal(deal);
      setDealForm({
        name: deal.name || '',
        author: deal.author || '',
        potato: deal.potato || 8,
        originalPotato: deal.originalPotato || 16,
        discount: deal.discount || '-50%',
        category: deal.category || 'Sách Chọn Lọc',
        img: deal.img || ''
      });
    } else {
      setEditingDeal(null);
      setDealForm({
        name: '',
        author: '',
        potato: 8,
        originalPotato: 16,
        discount: '-50%',
        category: 'Sách Chọn Lọc',
        img: ''
      });
    }
    setIsDealModalOpen(true);
  };

  const handleSaveDeal = (e) => {
    e.preventDefault();
    const payload = {
      name: dealForm.name.trim(),
      author: dealForm.author.trim() || 'HALM BOOK',
      potato: Number(dealForm.potato) || 5,
      originalPotato: Number(dealForm.originalPotato) || 10,
      discount: dealForm.discount.trim() || '-50%',
      category: dealForm.category.trim() || 'Sách Chọn Lọc',
      img: dealForm.img.trim() || '/logo.png'
    };

    if (editingDeal) {
      updateSingleDeal(editingDeal.id, payload);
      showToast(`Cập nhật sách giảm giá "${payload.name}" thành công!`, 'success');
    } else {
      addSingleDeal(payload);
      showToast(`Thêm sách giảm sâu "${payload.name}" thành công!`, 'success');
    }
    setIsDealModalOpen(false);
    fetchOffers();
  };

  // Xóa mục
  const confirmDelete = async () => {
    const { type, id, name } = deleteConfirm;
    try {
      if (type === 'package') {
        await axiosInstance.delete(`/api/home/potato/packages/${id}`);
        showToast(`Đã xóa gói nạp "${name}" thành công!`, 'info');
        await fetchPackages();
      } else if (type === 'voucher') {
        await axiosInstance.delete(`/api/promotions/${id}`);
        showToast(`Đã xóa voucher "${name}" thành công!`, 'info');
        await fetchVouchers();
      } else if (type === 'combo') {
        deleteCombo(id);
        showToast(`Đã xóa Combo "${name}" thành công!`, 'info');
        fetchOffers();
      } else if (type === 'deal') {
        deleteSingleDeal(id);
        showToast(`Đã xóa sách giảm sâu "${name}" thành công!`, 'info');
        fetchOffers();
      }
    } catch (err) {
      showToast('Lỗi xóa mục: ' + err.message, 'error');
    } finally {
      setDeleteConfirm({ isOpen: false, type: 'package', id: null, name: '' });
    }
  };

  return (
    <div className="admin-page-root">
      {/* Shared Sidebar */}
      <div id="admin-sidebar-container"></div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-gray-950 overflow-hidden">
        {/* Shared Header */}
        <div
          id="admin-header-container"
          data-title="Quản Lý Toàn Diện Ưu Đãi & Gói Sách"
          data-subtitle="Cấu hình gói nạp khoai, voucher khuyến mãi, combo sách tiết kiệm và các đầu sách giảm giá sâu"
        ></div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          <div className="w-full space-y-6">

            {/* Navigation Tabs Filter */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {[
                { key: 'all', label: 'Tất Cả Danh Mục', icon: 'fa-layer-group', count: packages.length + vouchers.length + combos.length + singleDeals.length },
                { key: 'packages', label: 'Gói Nạp Khoai Tây', icon: 'fa-boxes-stacked', count: packages.length },
                { key: 'vouchers', label: 'Mã Voucher', icon: 'fa-tags', count: vouchers.length },
                { key: 'combos', label: 'Combo Sách Ưu Đãi', icon: 'fa-book-bookmark', count: combos.length },
                { key: 'deals', label: 'Sách Lẻ Giảm Sâu', icon: 'fa-fire-flame-curved', count: singleDeals.length }
              ].map(t => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setActiveTab(t.key)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
                    activeTab === t.key
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <i className={`fa-solid ${t.icon} text-xs`}></i>
                  <span>{t.label}</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                    activeTab === t.key ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}>
                    {t.count}
                  </span>
                </button>
              ))}
            </div>

            {/* ========================================================
               1. GÓI NẠP KHOAI TÂY
               ======================================================== */}
            {(activeTab === 'all' || activeTab === 'packages') && (
              <div className="space-y-4">
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                  <div>
                    <h3 className="font-black text-sm text-slate-800 dark:text-white flex items-center gap-2">
                      <span className="text-xl">🥔</span>
                      <span>Danh Mục Gói Nạp Khoai Tây ({packages.length} gói trong CSDL)</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Dữ liệu kết nối trực tiếp với bảng <code className="font-mono text-blue-600 dark:text-blue-400">potato_package</code> trong MySQL</p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => scrollPackages(-1)}
                      className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-white flex items-center justify-center border border-slate-200 dark:border-slate-600 transition shadow-sm cursor-pointer"
                      title="Cuộn sang trái"
                    >
                      <i className="fa-solid fa-chevron-left text-xs"></i>
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollPackages(1)}
                      className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-white flex items-center justify-center border border-slate-200 dark:border-slate-600 transition shadow-sm cursor-pointer"
                      title="Cuộn sang phải"
                    >
                      <i className="fa-solid fa-chevron-right text-xs"></i>
                    </button>
                    <button
                      type="button"
                      onClick={() => openPackageModal()}
                      className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-sm flex items-center space-x-1.5 transition cursor-pointer"
                    >
                      <i className="fa-solid fa-plus text-xs"></i>
                      <span>Thêm Gói Nạp</span>
                    </button>
                  </div>
                </div>

                <div className="relative">
                  {loadingPackages ? (
                    <div className="w-full py-12 flex items-center justify-center text-slate-400 gap-2">
                      <i className="fa-solid fa-spinner fa-spin text-xl"></i>
                      <span className="text-sm font-bold">Đang tải danh sách gói nạp từ Database...</span>
                    </div>
                  ) : packages.length === 0 ? (
                    <div className="w-full py-8 text-center text-slate-400 font-bold border border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-white/50 dark:bg-slate-800/50">
                      <span className="text-2xl mb-1 block">🥔</span>
                      Chưa có gói nạp Khoai Tây nào trong CSDL. Hãy nhấn "Thêm Gói Nạp" để tạo mới.
                    </div>
                  ) : (
                    <div
                      ref={carouselRef}
                      className="flex space-x-4 overflow-x-auto pb-4 pt-1 snap-x scroll-smooth no-scrollbar"
                      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                      {packages.map((pkg) => (
                        <div
                          key={pkg.packageId}
                          className={`min-w-[280px] max-w-[280px] p-5 rounded-2xl border transition duration-300 flex flex-col justify-between shrink-0 snap-start bg-white dark:bg-slate-800 shadow-sm hover:shadow-md ${
                            !pkg.isActive ? 'opacity-50 border-dashed border-slate-300 dark:border-slate-700' : 'border-slate-200 dark:border-slate-700 hover:border-blue-400'
                          }`}
                        >
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-2xl">🥔</span>
                              {pkg.badgeTag && (
                                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                                  {pkg.badgeTag}
                                </span>
                              )}
                            </div>
                            <div>
                              <h4 className="font-black text-sm text-slate-800 dark:text-white line-clamp-1">{pkg.packageName}</h4>
                              <p className="text-xs text-slate-400 line-clamp-2 mt-0.5">{pkg.description || 'Nạp Khoai Tây đọc sách không giới hạn.'}</p>
                            </div>
                            <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl space-y-1">
                              <div className="flex items-baseline justify-between">
                                <span className="text-xs text-slate-500 font-bold">Số Khoai:</span>
                                <span className="text-base font-black text-amber-600 dark:text-amber-400">{pkg.potatoAmount.toLocaleString()} 🥔</span>
                              </div>
                              {pkg.bonusPotato > 0 && (
                                <div className="flex items-center justify-between text-[11px] text-emerald-600 font-bold">
                                  <span>Tặng thêm:</span>
                                  <span>+{pkg.bonusPotato.toLocaleString()} 🥔</span>
                                </div>
                              )}
                              <div className="flex items-baseline justify-between pt-1 border-t border-slate-200/60 dark:border-slate-800">
                                <span className="text-xs text-slate-500 font-bold">Giá bán:</span>
                                <span className="text-sm font-black text-blue-600 dark:text-blue-400">{Number(pkg.priceVnd).toLocaleString('vi-VN')} đ</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700 mt-3 text-xs">
                            <button
                              type="button"
                              onClick={() => handleTogglePackageStatus(pkg)}
                              className="font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition cursor-pointer"
                            >
                              {pkg.isActive ? 'Ẩn gói' : 'Hiện gói'}
                            </button>
                            <div className="flex items-center space-x-1">
                              <button
                                type="button"
                                onClick={() => openPackageModal(pkg)}
                                className="px-2.5 py-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg font-bold transition cursor-pointer"
                              >
                                Sửa
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteConfirm({ isOpen: true, type: 'package', id: pkg.packageId, name: pkg.packageName })}
                                className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg font-bold transition cursor-pointer"
                              >
                                Xóa
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ========================================================
               2. MÃ VOUCHER & KHUYẾN MÃI
               ======================================================== */}
            {(activeTab === 'all' || activeTab === 'vouchers') && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                <div className="border-b border-slate-200 dark:border-slate-700 pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <h3 className="font-black text-base text-slate-800 dark:text-white flex items-center gap-2">
                      <i className="fa-solid fa-tags text-blue-600"></i>
                      <span>Mã Giảm Giá & Voucher Khuyến Mãi ({vouchers.length} mã trong CSDL)</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Dữ liệu liên kết trực tiếp với bảng <code className="font-mono text-blue-600 dark:text-blue-400">promotion</code> trong MySQL</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openVoucherModal()}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center space-x-1.5 self-end sm:self-auto cursor-pointer"
                  >
                    <i className="fa-solid fa-plus text-xs"></i>
                    <span>Thêm Mã Voucher</span>
                  </button>
                </div>

                {loadingVouchers ? (
                  <div className="w-full py-8 flex items-center justify-center text-slate-400 gap-2">
                    <i className="fa-solid fa-spinner fa-spin text-xl"></i>
                    <span className="text-sm font-bold">Đang tải danh sách voucher từ Database...</span>
                  </div>
                ) : vouchers.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 font-bold border border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-800/50">
                    <i className="fa-solid fa-tags text-2xl text-slate-300 dark:text-slate-600 mb-2 block"></i>
                    Chưa có mã voucher ưu đãi nào trong CSDL. Hãy nhấn "Thêm Mã Voucher" để tạo mới.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {vouchers.map((v) => (
                      <div
                        key={v.promotion_id}
                        className={`p-4 bg-white dark:bg-slate-800 rounded-xl border transition flex flex-col justify-between hover:border-blue-300 dark:hover:border-blue-600 shadow-sm ${
                          v.status !== 'ACTIVE' ? 'opacity-60 border-dashed border-slate-300 dark:border-slate-700' : 'border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-black text-blue-600 dark:text-blue-400 text-sm tracking-wider px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900">
                              {v.promotion_id}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${
                              v.status === 'ACTIVE'
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600'
                            }`}>
                              {v.status === 'ACTIVE' ? 'Đang bật' : 'Tạm dừng'}
                            </span>
                          </div>
                          <h4 className="font-bold text-sm text-slate-800 dark:text-white leading-snug line-clamp-1">{v.promotion_name}</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{v.description || 'Ưu đãi dành cho độc giả thuê sách tại thư viện số HALM.'}</p>
                          <div className="flex items-center justify-between text-xs pt-1">
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                              {v.discount_percent > 0 ? `Giảm ${v.discount_percent}%` : `Giảm ${(v.discount_amount || 0).toLocaleString()} đ`}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              HSD: {v.end_date ? (v.end_date.includes('T') ? v.end_date.slice(0, 10).split('-').reverse().join('/') : v.end_date) : 'Vô thời hạn'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-700 mt-3">
                          <button
                            type="button"
                            onClick={() => handleToggleVoucherStatus(v)}
                            className="px-2.5 py-1 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition cursor-pointer"
                          >
                            {v.status === 'ACTIVE' ? 'Tắt' : 'Bật'}
                          </button>
                          <button
                            type="button"
                            onClick={() => openVoucherModal(v)}
                            className="px-2.5 py-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded transition cursor-pointer"
                          >
                            Sửa
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirm({ isOpen: true, type: 'voucher', id: v.promotion_id, name: v.promotion_id })}
                            className="px-2.5 py-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition cursor-pointer"
                          >
                            Xóa
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ========================================================
               3. QUẢN LÝ COMBO SÁCH ƯU ĐÃI (MỚI)
               ======================================================== */}
            {(activeTab === 'all' || activeTab === 'combos') && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                <div className="border-b border-slate-200 dark:border-slate-700 pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <h3 className="font-black text-base text-slate-800 dark:text-white flex items-center gap-2">
                      <i className="fa-solid fa-book-bookmark text-amber-500"></i>
                      <span>Combo Sách Ưu Đãi Theo Chủ Đề ({combos.length} gói)</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Dữ liệu thực tế đồng bộ trực tiếp với màn hình Ưu Đãi người dùng</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openComboModal()}
                    className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center space-x-1.5 self-end sm:self-auto cursor-pointer"
                  >
                    <i className="fa-solid fa-plus text-xs"></i>
                    <span>Tạo Combo Mới</span>
                  </button>
                </div>

                {combos.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 font-bold border border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-800/50">
                    <i className="fa-solid fa-book-bookmark text-2xl text-slate-300 dark:text-slate-600 mb-2 block"></i>
                    Chưa có gói combo sách nào. Nhấn "Tạo Combo Mới" để thiết lập gói ưu đãi.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {combos.map((combo) => (
                      <div
                        key={combo.id}
                        className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 transition flex flex-col justify-between hover:border-amber-400 shadow-sm"
                      >
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <img
                              src={combo.img || '/logo.png'}
                              alt={combo.name}
                              className="w-16 h-20 object-cover rounded-lg border border-slate-200 dark:border-slate-700 shadow shrink-0"
                              onError={(e) => { e.currentTarget.src = '/logo.png'; }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-1">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                                  {combo.discount || '-30%'}
                                </span>
                              </div>
                              <h4 className="font-bold text-sm text-slate-800 dark:text-white line-clamp-2 leading-snug">{combo.name}</h4>
                              <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{combo.desc}</p>
                            </div>
                          </div>

                          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 space-y-1">
                            <span className="text-[11px] font-bold text-slate-500 block">Sách trong combo:</span>
                            <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-0.5 list-disc list-inside">
                              {(combo.books || []).map((b, i) => (
                                <li key={i} className="truncate">{b}</li>
                              ))}
                            </ul>
                          </div>

                          <div className="flex items-baseline justify-between pt-1 text-xs">
                            <div className="flex items-baseline gap-1.5">
                              <span className="font-black text-amber-600 dark:text-amber-400 text-base">{combo.potato} 🥔</span>
                              {combo.originalPotato > combo.potato && (
                                <span className="line-through text-slate-400 text-[11px]">{combo.originalPotato} 🥔</span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400">Tiết kiệm trọn gói</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-700 mt-3">
                          <button
                            type="button"
                            onClick={() => openComboModal(combo)}
                            className="px-2.5 py-1 text-[11px] font-bold text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded transition cursor-pointer"
                          >
                            Sửa
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirm({ isOpen: true, type: 'combo', id: combo.id, name: combo.name })}
                            className="px-2.5 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition cursor-pointer"
                          >
                            Xóa
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ========================================================
               4. QUẢN LÝ SÁCH LẺ GIẢM SÂU (MỚI)
               ======================================================== */}
            {(activeTab === 'all' || activeTab === 'deals') && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                <div className="border-b border-slate-200 dark:border-slate-700 pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <h3 className="font-black text-base text-slate-800 dark:text-white flex items-center gap-2">
                      <i className="fa-solid fa-fire-flame-curved text-rose-500"></i>
                      <span>Danh Mục Sách Lẻ Giảm Sâu ({singleDeals.length} ấn phẩm)</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Áp dụng giá thuê Khoai Tây cực sốc để kích thích bạn đọc đọc sách</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openDealModal()}
                    className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center space-x-1.5 self-end sm:self-auto cursor-pointer"
                  >
                    <i className="fa-solid fa-plus text-xs"></i>
                    <span>Thêm Sách Giảm Sâu</span>
                  </button>
                </div>

                {singleDeals.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 font-bold border border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-800/50">
                    <i className="fa-solid fa-fire text-2xl text-slate-300 dark:text-slate-600 mb-2 block"></i>
                    Chưa có sách nào trong danh mục giảm sâu. Hãy nhấn "Thêm Sách Giảm Sâu".
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {singleDeals.map((deal) => (
                      <div
                        key={deal.id}
                        className="p-3.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 transition flex flex-col justify-between hover:border-rose-400 shadow-sm"
                      >
                        <div>
                          <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-900 mb-2.5">
                            <img
                              src={deal.img || '/logo.png'}
                              alt={deal.name}
                              className="w-full h-full object-cover"
                              onError={(e) => { e.currentTarget.src = '/logo.png'; }}
                            />
                            <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-rose-600 text-white font-black text-[10px] shadow">
                              {deal.discount || '-50%'}
                            </div>
                            <div className="absolute bottom-1.5 inset-x-1.5 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-sm text-[10px] text-white truncate text-center">
                              {deal.category || 'Sách Chọn Lọc'}
                            </div>
                          </div>

                          <h4 className="font-bold text-xs text-slate-800 dark:text-white line-clamp-1" title={deal.name}>{deal.name}</h4>
                          <p className="text-[11px] text-slate-400 line-clamp-1">{deal.author || 'HALM BOOK'}</p>

                          <div className="flex items-baseline gap-1.5 pt-2">
                            <span className="font-black text-rose-600 dark:text-rose-400 text-sm">{deal.potato} 🥔</span>
                            {deal.originalPotato > deal.potato && (
                              <span className="line-through text-slate-400 text-[10px]">{deal.originalPotato} 🥔</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-end space-x-1 pt-2.5 border-t border-slate-100 dark:border-slate-700 mt-2.5">
                          <button
                            type="button"
                            onClick={() => openDealModal(deal)}
                            className="px-2 py-1 text-[11px] font-bold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded transition cursor-pointer"
                          >
                            Sửa
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirm({ isOpen: true, type: 'deal', id: deal.id, name: deal.name })}
                            className="px-2 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition cursor-pointer"
                          >
                            Xóa
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </main>

      {/* ========================================================
         MODAL 1: GÓI NẠP KHOAI TÂY
         ======================================================== */}
      {isPkgModalOpen && (
        <div className="fixed inset-0 bg-slate-800/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
              <h3 className="font-black text-base text-slate-800 dark:text-white flex items-center gap-2">
                <span>🥔</span>
                <span>{editingPkg ? 'Cập Nhật Gói Nạp Khoai Tây' : 'Tạo Gói Nạp Khoai Tây Mới'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsPkgModalOpen(false)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleSavePackage} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Tên Gói Nạp *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Gói Cơ Bản, Gói Mọt Sách..."
                  value={pkgForm.packageName}
                  onChange={(e) => setPkgForm({ ...pkgForm, packageName: e.target.value })}
                  className="w-full px-3.5 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Số Khoai Nhận *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="100"
                    value={pkgForm.potatoAmount}
                    onChange={(e) => setPkgForm({ ...pkgForm, potatoAmount: e.target.value })}
                    className="w-full px-3.5 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Khoai Thưởng Thêm</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={pkgForm.bonusPotato}
                    onChange={(e) => setPkgForm({ ...pkgForm, bonusPotato: e.target.value })}
                    className="w-full px-3.5 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Giá Bán (VNĐ) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="100000"
                    value={pkgForm.priceVnd}
                    onChange={(e) => setPkgForm({ ...pkgForm, priceVnd: e.target.value })}
                    className="w-full px-3.5 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Huy Hiệu Tag (Badge)</label>
                  <input
                    type="text"
                    placeholder="HOT, TIẾT KIỆM..."
                    value={pkgForm.badgeTag}
                    onChange={(e) => setPkgForm({ ...pkgForm, badgeTag: e.target.value })}
                    className="w-full px-3.5 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Mô Tả Gói</label>
                <textarea
                  rows="2"
                  placeholder="Mô tả quyền lợi hoặc ghi chú gói..."
                  value={pkgForm.description}
                  onChange={(e) => setPkgForm({ ...pkgForm, description: e.target.value })}
                  className="w-full px-3.5 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                ></textarea>
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="pkgActiveCheck"
                  checked={pkgForm.isActive}
                  onChange={(e) => setPkgForm({ ...pkgForm, isActive: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="pkgActiveCheck" className="text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer">
                  Kích hoạt và hiển thị gói nạp này ngay trên hệ thống
                </label>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsPkgModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-gray-200 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-600 hover:bg-slate-200 transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-sm transition cursor-pointer"
                >
                  {editingPkg ? 'Lưu Thay Đổi' : 'Tạo Gói Nạp'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
         MODAL 2: MÃ VOUCHER
         ======================================================== */}
      {isVoucherModalOpen && (
        <div className="fixed inset-0 bg-slate-800/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
              <h3 className="font-black text-base text-slate-800 dark:text-white flex items-center gap-2">
                <i className="fa-solid fa-tags text-blue-600"></i>
                <span>{editingVoucher ? 'Cập Nhật Mã Voucher' : 'Tạo Mã Voucher Mới'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsVoucherModalOpen(false)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleSaveVoucher} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Mã Voucher (Code) *</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingVoucher}
                    placeholder="HALM50, SUMMER..."
                    value={voucherForm.promotion_id}
                    onChange={(e) => setVoucherForm({ ...voucherForm, promotion_id: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Trạng Thái</label>
                  <select
                    value={voucherForm.status}
                    onChange={(e) => setVoucherForm({ ...voucherForm, status: e.target.value })}
                    className="w-full px-3.5 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ACTIVE">Kích hoạt (ACTIVE)</option>
                    <option value="PAUSED">Tạm dừng (PAUSED)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Tên Chiến Dịch / Khuyến Mãi *</label>
                <input
                  type="text"
                  required
                  placeholder="Khuyến mãi mùa hè, Giảm giá độc giả mới..."
                  value={voucherForm.promotion_name}
                  onChange={(e) => setVoucherForm({ ...voucherForm, promotion_name: e.target.value })}
                  className="w-full px-3.5 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Giảm Theo Phần Trăm (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="20"
                    value={voucherForm.discount_percent}
                    onChange={(e) => setVoucherForm({ ...voucherForm, discount_percent: e.target.value })}
                    className="w-full px-3.5 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Hoặc Giảm Tiền Trực Tiếp (VNĐ)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={voucherForm.discount_amount}
                    onChange={(e) => setVoucherForm({ ...voucherForm, discount_amount: e.target.value })}
                    className="w-full px-3.5 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Ngày Hết Hạn</label>
                <input
                  type="date"
                  value={voucherForm.end_date}
                  onChange={(e) => setVoucherForm({ ...voucherForm, end_date: e.target.value })}
                  className="w-full px-3.5 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Mô Tả Điều Kiện Áp Dụng</label>
                <textarea
                  rows="2"
                  placeholder="Áp dụng cho mọi độc giả khi thanh toán đơn hàng..."
                  value={voucherForm.description}
                  onChange={(e) => setVoucherForm({ ...voucherForm, description: e.target.value })}
                  className="w-full px-3.5 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                ></textarea>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsVoucherModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-gray-200 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-600 hover:bg-slate-200 transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-sm transition cursor-pointer"
                >
                  {editingVoucher ? 'Lưu Thay Đổi' : 'Tạo Voucher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
         MODAL 3: COMBO SÁCH ƯU ĐÃI (MỚI)
         ======================================================== */}
      {isComboModalOpen && (
        <div className="fixed inset-0 bg-slate-800/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
              <h3 className="font-black text-base text-slate-800 dark:text-white flex items-center gap-2">
                <i className="fa-solid fa-book-bookmark text-amber-500"></i>
                <span>{editingCombo ? 'Cập Nhật Combo Sách' : 'Tạo Combo Sách Mới'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsComboModalOpen(false)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleSaveCombo} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Tên Gói Combo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Combo 3 Cuốn Kỹ Năng & Tư Duy..."
                  value={comboForm.name}
                  onChange={(e) => setComboForm({ ...comboForm, name: e.target.value })}
                  className="w-full px-3.5 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Mô Tả Gói Combo</label>
                <input
                  type="text"
                  placeholder="Hành trình rèn luyện bản lĩnh và tư duy thành công..."
                  value={comboForm.desc}
                  onChange={(e) => setComboForm({ ...comboForm, desc: e.target.value })}
                  className="w-full px-3.5 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Giá Khoai Ưu Đãi *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="25"
                    value={comboForm.potato}
                    onChange={(e) => setComboForm({ ...comboForm, potato: e.target.value })}
                    className="w-full px-3.5 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Giá Khoai Gốc</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="45"
                    value={comboForm.originalPotato}
                    onChange={(e) => setComboForm({ ...comboForm, originalPotato: e.target.value })}
                    className="w-full px-3.5 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Tag Giảm Giá</label>
                  <input
                    type="text"
                    placeholder="-45%"
                    value={comboForm.discount}
                    onChange={(e) => setComboForm({ ...comboForm, discount: e.target.value })}
                    className="w-full px-3.5 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Chọn Nhanh Tác Phẩm Từ CSDL MySQL ({realBooksList.length} cuốn sẵn có)
                </label>
                <select
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    const b = realBooksList.find(x => x.id === selectedId);
                    if (b) {
                      const currentBooks = comboForm.booksText ? comboForm.booksText.split('\n').filter(Boolean) : [];
                      if (!currentBooks.includes(b.title)) {
                        const updatedBooks = [...currentBooks, b.title];
                        const newOriginal = (Number(comboForm.originalPotato) || 0) + (Number(b.price) || 15);
                        const newDiscounted = Math.max(1, Math.round(newOriginal * 0.5));
                        setComboForm({
                          ...comboForm,
                          name: comboForm.name || `Combo ${updatedBooks.length} Tác Phẩm Đặc Sắc`,
                          booksText: updatedBooks.join('\n'),
                          originalPotato: newOriginal,
                          potato: newDiscounted,
                          discount: '-50%',
                          img: comboForm.img || b.img
                        });
                      }
                    }
                    e.target.value = '';
                  }}
                  defaultValue=""
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-700/80 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold text-slate-800 dark:text-white mb-2"
                >
                  <option value="">+ Bấm để chọn thêm sách vào combo (tự động cộng giá gốc & tính giá ưu đãi)</option>
                  {realBooksList.map(b => (
                    <option key={b.id} value={b.id}>
                      [{b.id}] {b.title} - {b.author} ({b.price} Khoai)
                    </option>
                  ))}
                </select>

                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Danh Sách Tác Phẩm (Mỗi cuốn 1 dòng) *</label>
                <textarea
                  rows="3"
                  required
                  placeholder="Đắc Nhân Tâm&#10;Atomic Habits&#10;Tư Duy Nhanh Và Chậm"
                  value={comboForm.booksText}
                  onChange={(e) => setComboForm({ ...comboForm, booksText: e.target.value })}
                  className="w-full px-3.5 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">URL Ảnh Bìa Đại Diện</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={comboForm.img}
                  onChange={(e) => setComboForm({ ...comboForm, img: e.target.value })}
                  className="w-full px-3.5 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsComboModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-gray-200 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-600 hover:bg-slate-200 transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs shadow-sm transition cursor-pointer"
                >
                  {editingCombo ? 'Lưu Thay Đổi' : 'Tạo Combo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
         MODAL 4: SÁCH LẺ GIẢM SÂU (MỚI)
         ======================================================== */}
      {isDealModalOpen && (
        <div className="fixed inset-0 bg-slate-800/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
              <h3 className="font-black text-base text-slate-800 dark:text-white flex items-center gap-2">
                <i className="fa-solid fa-fire-flame-curved text-rose-500"></i>
                <span>{editingDeal ? 'Cập Nhật Sách Giảm Sâu' : 'Thêm Sách Giảm Sâu Mới'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsDealModalOpen(false)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleSaveDeal} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Chọn Nhanh Từ Kho Sách CSDL MySQL ({realBooksList.length} cuốn sẵn có)
                </label>
                <select
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    const b = realBooksList.find(x => x.id === selectedId);
                    if (b) {
                      setDealForm({
                        ...dealForm,
                        name: b.title,
                        author: b.author,
                        category: b.category,
                        originalPotato: b.price || 15,
                        potato: Math.max(1, Math.round((b.price || 15) * 0.5)),
                        discount: '-50%',
                        img: b.img
                      });
                    }
                  }}
                  defaultValue=""
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-700/80 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold text-slate-800 dark:text-white mb-2"
                >
                  <option value="">-- Chọn ấn phẩm từ CSDL để tự động điền thông tin --</option>
                  {realBooksList.map(b => (
                    <option key={b.id} value={b.id}>
                      [{b.id}] {b.title} - {b.author} ({b.price} Khoai)
                    </option>
                  ))}
                </select>

                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Tên Tác Phẩm *</label>
                <input
                  type="text"
                  required
                  placeholder="Tâm Lý Học Về Tiền, Muôn Kiếp Nhân Sinh..."
                  value={dealForm.name}
                  onChange={(e) => setDealForm({ ...dealForm, name: e.target.value })}
                  className="w-full px-3.5 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Tác Giả</label>
                  <input
                    type="text"
                    placeholder="Morgan Housel..."
                    value={dealForm.author}
                    onChange={(e) => setDealForm({ ...dealForm, author: e.target.value })}
                    className="w-full px-3.5 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Danh Mục / Chủ Đề</label>
                  <input
                    type="text"
                    placeholder="Tài Chính, Tâm Lý..."
                    value={dealForm.category}
                    onChange={(e) => setDealForm({ ...dealForm, category: e.target.value })}
                    className="w-full px-3.5 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Khoai Sau Giảm *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="8"
                    value={dealForm.potato}
                    onChange={(e) => setDealForm({ ...dealForm, potato: e.target.value })}
                    className="w-full px-3.5 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Khoai Gốc</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="16"
                    value={dealForm.originalPotato}
                    onChange={(e) => setDealForm({ ...dealForm, originalPotato: e.target.value })}
                    className="w-full px-3.5 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Tag Giảm</label>
                  <input
                    type="text"
                    placeholder="-50%"
                    value={dealForm.discount}
                    onChange={(e) => setDealForm({ ...dealForm, discount: e.target.value })}
                    className="w-full px-3.5 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">URL Ảnh Bìa Sách</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={dealForm.img}
                  onChange={(e) => setDealForm({ ...dealForm, img: e.target.value })}
                  className="w-full px-3.5 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsDealModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-gray-200 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-600 hover:bg-slate-200 transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-sm transition cursor-pointer"
                >
                  {editingDeal ? 'Lưu Thay Đổi' : 'Thêm Sách'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
         CONFIRMATION MODAL FOR DELETE
         ======================================================== */}
      {deleteConfirm.isOpen && (
        <div className="fixed inset-0 bg-slate-800/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto text-xl">
              <i className="fa-solid fa-triangle-exclamation"></i>
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-black text-base text-slate-800 dark:text-white">
                Xác nhận xóa {deleteConfirm.type === 'package' ? 'gói nạp' : deleteConfirm.type === 'voucher' ? 'voucher' : deleteConfirm.type === 'combo' ? 'combo sách' : 'sách giảm sâu'}?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Bạn có chắc chắn muốn xóa "<strong>{deleteConfirm.name}</strong>"? Thao tác này không thể hoàn tác.
              </p>
            </div>
            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirm({ isOpen: false, type: 'package', id: null, name: '' })}
                className="flex-1 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-gray-200 rounded-xl text-xs font-bold hover:bg-slate-200 transition cursor-pointer"
              >
                Giữ lại
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm transition cursor-pointer"
              >
                Xóa ngay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Alert */}
      {toast.show && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg border text-xs font-bold flex items-center gap-2 animate-in slide-in-from-bottom-5 duration-200 ${
          toast.type === 'error'
            ? 'bg-rose-600 text-white border-rose-700'
            : toast.type === 'info'
              ? 'bg-blue-600 text-white border-blue-700'
              : 'bg-emerald-600 text-white border-emerald-700'
        }`}>
          <i className={`fa-solid ${
            toast.type === 'error'
              ? 'fa-circle-xmark'
              : toast.type === 'info'
                ? 'fa-circle-info'
                : 'fa-circle-check'
          } text-sm`}></i>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
