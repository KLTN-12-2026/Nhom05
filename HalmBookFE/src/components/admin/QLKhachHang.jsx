import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLegacyAdminPage } from './legacy-runtime';
import axiosInstance from '@/services/axiosClient';
import { confirmDialog } from '@/components/common/CustomConfirmModal';

export default function QuanLyKhachHang() {
  // Đồng bộ sidebar & header của Admin Layout
  useLegacyAdminPage("QuanLyKhachHang.html", null, false);

  // 1. State danh sách & Thống kê từ Backend
  const [customers, setCustomers] = useState([]);
  const [stats, setStats] = useState({
    totalCustomers: 0,
    vipCustomers: 0,
    lockedCustomers: 0,
    birthdayTodayCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 2. State Bộ lọc & Tìm kiếm
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [birthdayOnly, setBirthdayOnly] = useState(false);

  // Debounce tìm kiếm 300ms để giảm tải gọi API liên tục
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // 3. State Modals & Chỉnh sửa
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [editForm, setEditForm] = useState({
    customerName: '',
    phoneNumber: '',
    address: '',
    gender: true,
    birthday: ''
  });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // 4. State Tặng / Trừ Khoai Tây
  const [adjustCustomer, setAdjustCustomer] = useState(null);
  const [adjustAmount, setAdjustAmount] = useState(50);
  const [adjustReason, setAdjustReason] = useState('Tặng quà tri ân / Chăm sóc độc giả HALM');
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [isSavingAdjust, setIsSavingAdjust] = useState(false);

  // 5. Toast notification
  const [toast, setToast] = useState({ message: '', type: 'info' });
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: 'info' }), 3500);
  };

  // 6. Nạp danh sách khách hàng từ Backend API thật
  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
      if (tierFilter !== 'ALL') params.tier = tierFilter;
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (birthdayOnly) params.birthdayOnly = true;

      const res = await axiosInstance.get('/api/admin/customers', { params });
      const data = res.data || {};
      const list = Array.isArray(data.content) ? data.content : [];
      setCustomers(list);

      if (data.stats) {
        setStats(data.stats);
      } else {
        // Fallback tự tính stats từ danh sách
        const total = list.length;
        const vips = list.filter(c => c.isVip || (c.tier && !c.tier.toLowerCase().includes('đồng'))).length;
        const locked = list.filter(c => c.status === 'LOCKED').length;
        const bdays = list.filter(c => c.isBirthdayToday).length;
        setStats({ totalCustomers: total, vipCustomers: vips, lockedCustomers: locked, birthdayTodayCount: bdays });
      }
    } catch (err) {
      console.error('Không thể tải danh sách khách hàng:', err);
      setError(err.response?.data?.message || 'Không thể kết nối máy chủ để tải dữ liệu khách hàng.');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, tierFilter, statusFilter, birthdayOnly]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // 7. Thao tác Khóa / Mở khóa tài khoản khách hàng (dùng Custom Confirm Modal)
  const handleToggleLock = async (cust) => {
    const isLocked = cust.status === 'LOCKED';
    const actionName = isLocked ? 'Mở khóa' : 'Khóa';
    
    const confirmed = await confirmDialog({
      title: isLocked ? 'Mở Khóa Tài Khoản' : 'Khóa Tài Khoản Độc Giả',
      message: `Bạn có chắc chắn muốn ${actionName.toLowerCase()} tài khoản của độc giả "${cust.name || cust.username}"? ${
        !isLocked
          ? 'Người dùng sẽ bị tạm dừng phiên làm việc và không thể đăng nhập.'
          : 'Độc giả sẽ có thể đăng nhập và sử dụng dịch vụ trở lại bình thường.'
      }`,
      confirmText: actionName,
      cancelText: 'Hủy bỏ',
      type: isLocked ? 'warning' : 'danger',
    });
    if (!confirmed) return;

    try {
      const res = await axiosInstance.put(`/api/admin/customers/${encodeURIComponent(cust.customerId)}/toggle-lock`);
      const newStatus = res.data?.newStatus || (isLocked ? 'ACTIVE' : 'LOCKED');
      
      // Cập nhật ngay trên giao diện
      setCustomers(prev => prev.map(c => c.customerId === cust.customerId ? { ...c, status: newStatus } : c));
      setStats(prev => ({
        ...prev,
        lockedCustomers: newStatus === 'LOCKED' ? prev.lockedCustomers + 1 : Math.max(0, prev.lockedCustomers - 1)
      }));

      showToast(res.data?.message || `Đã ${actionName.toLowerCase()} tài khoản thành công!`, 'success');
    } catch (err) {
      console.error('Lỗi khóa/mở khóa tài khoản:', err);
      showToast(err.response?.data?.message || 'Không thể thay đổi trạng thái tài khoản.', 'error');
    }
  };

  // 8. Mở modal chỉnh sửa hồ sơ
  const openEditModal = (cust) => {
    setEditingCustomer(cust);
    setEditForm({
      customerName: cust.name || cust.customerName || '',
      phoneNumber: cust.phone || cust.phoneNumber || '',
      address: cust.address || '',
      gender: Boolean(cust.gender),
      birthday: cust.birthday || ''
    });
    setIsEditModalOpen(true);
  };

  // Lưu chỉnh sửa hồ sơ
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingCustomer) return;

    setIsSavingEdit(true);
    try {
      await axiosInstance.put(`/api/admin/customers/${encodeURIComponent(editingCustomer.customerId)}`, editForm);
      
      setCustomers(prev => prev.map(c => {
        if (c.customerId === editingCustomer.customerId) {
          return {
            ...c,
            name: editForm.customerName,
            customerName: editForm.customerName,
            phone: editForm.phoneNumber,
            phoneNumber: editForm.phoneNumber,
            address: editForm.address,
            gender: editForm.gender,
            birthday: editForm.birthday
          };
        }
        return c;
      }));

      setIsEditModalOpen(false);
      showToast('Đã cập nhật hồ sơ khách hàng thành công!', 'success');
    } catch (err) {
      console.error('Lỗi cập nhật hồ sơ:', err);
      showToast(err.response?.data?.message || 'Lỗi cập nhật thông tin khách hàng.', 'error');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // 9. Mở modal Tặng / Trừ Khoai Tây
  const openAdjustModal = (cust, defaultAmount = 50, defaultReason = 'Thưởng sự kiện / Chăm sóc khách hàng') => {
    setAdjustCustomer(cust);
    setAdjustAmount(defaultAmount);
    setAdjustReason(cust.isBirthdayToday ? 'Chúc mừng sinh nhật độc giả! Tặng quà đọc sách 🎂' : defaultReason);
    setIsAdjustModalOpen(true);
  };

  // Lưu điều chỉnh Khoai Tây
  const handleSaveAdjust = async (e) => {
    e.preventDefault();
    if (!adjustCustomer) return;

    const parsedAmount = parseInt(adjustAmount, 10);
    if (isNaN(parsedAmount) || parsedAmount === 0) {
      showToast('Vui lòng nhập số lượng Khoai Tây khác 0!', 'warning');
      return;
    }

    setIsSavingAdjust(true);
    try {
      const res = await axiosInstance.post(`/api/admin/customers/${encodeURIComponent(adjustCustomer.customerId)}/adjust-potato`, {
        amount: parsedAmount,
        reason: adjustReason.trim()
      });

      const newBalance = res.data?.newBalance ?? (adjustCustomer.potatoBalance + parsedAmount);

      setCustomers(prev => prev.map(c => {
        if (c.customerId === adjustCustomer.customerId) {
          return { ...c, potatoBalance: newBalance };
        }
        return c;
      }));

      setIsAdjustModalOpen(false);
      showToast(res.data?.message || `Đã điều chỉnh ${parsedAmount > 0 ? '+' : ''}${parsedAmount} Khoai thành công!`, 'success');
    } catch (err) {
      console.error('Lỗi điều chỉnh Khoai:', err);
      showToast(err.response?.data?.message || 'Không thể điều chỉnh số dư Khoai Tây.', 'error');
    } finally {
      setIsSavingAdjust(false);
    }
  };

  // 10. Xuất dữ liệu ra file CSV / Excel
  const handleExportCSV = () => {
    if (customers.length === 0) {
      showToast('Không có dữ liệu khách hàng để xuất!', 'warning');
      return;
    }

    const headers = ['Mã KH', 'Họ Và Tên', 'Tên Đăng Nhập', 'Email', 'Số Điện Thoại', 'Giới Tính', 'Ngày Sinh', 'Cấp Bậc', 'Số Dư Khoai', 'Đã Đọc (Sách)', 'Trạng Thái', 'Địa Chỉ'];
    const rows = customers.map(c => [
      `"${c.customerId || ''}"`,
      `"${c.name || ''}"`,
      `"${c.username || ''}"`,
      `"${c.email || ''}"`,
      `"${c.phone || ''}"`,
      `"${c.gender ? 'Nam' : 'Nữ'}"`,
      `"${c.birthday || ''}"`,
      `"${c.tier || 'Đồng'}"`,
      c.potatoBalance || 0,
      c.rentedBooksCount || 0,
      `"${c.status === 'LOCKED' ? 'Đã khóa' : 'Hoạt động'}"`,
      `"${(c.address || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `HALMBOOK_KhachHang_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Đã xuất ${customers.length} hồ sơ khách hàng thành công!`, 'success');
  };

  return (
    <div className="admin-page-root">
      {/* Shared Sidebar */}
      <div id="admin-sidebar-container"></div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full bg-white dark:bg-gray-950 overflow-hidden font-nunito">
        {/* Shared Header */}
        <div 
          id="admin-header-container" 
          data-title="Quản Lý Độc Giả & Khách Hàng" 
          data-subtitle="Hồ sơ độc giả thực tế, quản lý số dư Khoai Tây, chúc mừng sinh nhật và kiểm soát tài khoản"
        ></div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">
          
          {/* 4 Quick Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Tổng Độc Giả */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">Tổng Độc Giả</p>
                <h4 className="text-2xl font-black text-slate-800 dark:text-white mt-1">
                  {loading ? '...' : `${stats.totalCustomers} người`}
                </h4>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xl border border-blue-200 dark:border-blue-800 shadow-inner">
                <i className="fa-solid fa-users"></i>
              </div>
            </div>

            {/* Card 2: VIP Khoai Tây */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider">Hội Viên Tích Lũy</p>
                <h4 className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
                  {loading ? '...' : `${stats.vipCustomers} hội viên`}
                </h4>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xl border border-amber-200 dark:border-amber-800 shadow-inner">
                <i className="fa-solid fa-crown"></i>
              </div>
            </div>

            {/* Card 3: Tài Khoản Bị Khóa */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-black uppercase text-rose-600 dark:text-rose-400 tracking-wider">Tài Khoản Đã Khóa</p>
                <h4 className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
                  {loading ? '...' : `${stats.lockedCustomers} tài khoản`}
                </h4>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center text-xl border border-rose-200 dark:border-rose-800 shadow-inner">
                <i className="fa-solid fa-user-slash"></i>
              </div>
            </div>

            {/* Card 4: Sinh Nhật Hôm Nay */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider">Sinh Nhật Hôm Nay</p>
                <h4 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                  {loading ? '...' : `${stats.birthdayTodayCount} người`}
                </h4>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-2xl border border-emerald-200 dark:border-emerald-800 shadow-inner">
                <span>🎂</span>
              </div>
            </div>
          </div>

          {/* Table Container Card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            
            {/* Toolbar: Tìm kiếm, lọc & Xuất Excel */}
            <div className="p-4 md:p-5 border-b border-slate-200 dark:border-slate-700 flex flex-col lg:flex-row gap-3.5 items-stretch lg:items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
              
              {/* Search Box */}
              <div className="relative flex-1 max-w-md">
                <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                <input
                  type="text"
                  placeholder="Tìm theo tên, email, SĐT, mã KH..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                {search && (
                  <button 
                    onClick={() => setSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Filters & Actions */}
              <div className="flex flex-wrap items-center gap-2.5">
                
                {/* Lọc Cấp Bậc */}
                <select
                  value={tierFilter}
                  onChange={(e) => setTierFilter(e.target.value)}
                  className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">Tất cả cấp bậc</option>
                  <option value="Đồng">Hạng Đồng</option>
                  <option value="Bạc">Hạng Bạc</option>
                  <option value="Vàng">Hạng Vàng</option>
                  <option value="Kim Cương">Hạng Kim Cương</option>
                </select>

                {/* Lọc Trạng Thái */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="ACTIVE">Hoạt động</option>
                  <option value="LOCKED">Đã khóa</option>
                </select>

                {/* Nút lọc sinh nhật */}
                <button
                  type="button"
                  onClick={() => setBirthdayOnly(!birthdayOnly)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer ${
                    birthdayOnly
                      ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:border-amber-500'
                  }`}
                  title="Chỉ hiển thị độc giả có sinh nhật hôm nay"
                >
                  <span>🎂</span>
                  <span>Sinh nhật hôm nay ({stats.birthdayTodayCount})</span>
                </button>

                {/* Nút Xuất Excel */}
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition cursor-pointer"
                  title="Xuất dữ liệu khách hàng ra file CSV"
                >
                  <i className="fa-solid fa-file-excel"></i>
                  <span>Xuất Excel</span>
                </button>

                {/* Nút Làm mới */}
                <button
                  type="button"
                  onClick={fetchCustomers}
                  className="p-2 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold transition cursor-pointer"
                  title="Tải lại danh sách"
                >
                  <i className={`fa-solid fa-rotate ${loading ? 'animate-spin' : ''}`}></i>
                </button>
              </div>
            </div>

            {/* Error Banner nếu có */}
            {error && (
              <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border-b border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <i className="fa-solid fa-circle-exclamation text-base"></i>
                  <span>{error}</span>
                </div>
                <button onClick={fetchCustomers} className="underline hover:no-underline">Thử lại</button>
              </div>
            )}

            {/* Table Area */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 uppercase font-black text-[11px] text-slate-600 dark:text-slate-300">
                  <tr>
                    <th className="py-3 px-3 text-center border-r border-slate-200 dark:border-slate-700 w-px whitespace-nowrap">Mã KH</th>
                    <th className="py-3 px-3 text-center border-r border-slate-200 dark:border-slate-700 w-px whitespace-nowrap">Ảnh</th>
                    <th className="py-3 px-4 border-r border-slate-200 dark:border-slate-700 min-w-[180px]">Độc Giả</th>
                    <th className="py-3 px-4 border-r border-slate-200 dark:border-slate-700 min-w-[200px]">Liên Hệ (Email / SĐT)</th>
                    <th className="py-3 px-3 text-center border-r border-slate-200 dark:border-slate-700 w-px whitespace-nowrap">Cấp Bậc</th>
                    <th className="py-3 px-3 text-center border-r border-slate-200 dark:border-slate-700 w-px whitespace-nowrap">Số Dư Khoai 🥔</th>
                    <th className="py-3 px-3 text-center border-r border-slate-200 dark:border-slate-700 w-px whitespace-nowrap">Sinh Nhật</th>
                    <th className="py-3 px-3 text-center border-r border-slate-200 dark:border-slate-700 w-px whitespace-nowrap">Trạng Thái</th>
                    <th className="py-3 px-4 text-center w-px whitespace-nowrap">Hành Động Chăm Sóc</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-semibold text-slate-700 dark:text-slate-200">
                  {loading ? (
                    <tr>
                      <td colSpan="9" className="py-16 text-center text-slate-400 font-bold">
                        <i className="fa-solid fa-spinner fa-spin text-2xl text-blue-600 mb-2 block"></i>
                        <span>Đang đồng bộ hồ sơ khách hàng thực tế từ cơ sở dữ liệu...</span>
                      </td>
                    </tr>
                  ) : customers.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="py-16 text-center text-slate-400 font-bold">
                        <i className="fa-solid fa-user-xmark text-3xl mb-2 text-slate-300 block"></i>
                        <span>Không tìm thấy khách hàng nào khớp với điều kiện lọc.</span>
                      </td>
                    </tr>
                  ) : (
                    customers.map((cust) => {
                      const isLocked = cust.status === 'LOCKED';
                      const initialLetter = (cust.name || cust.username || 'U').charAt(0).toUpperCase();

                      return (
                        <tr 
                          key={cust.customerId} 
                          className="hover:bg-blue-50/40 dark:hover:bg-slate-700/30 transition-colors"
                        >
                          {/* Mã KH */}
                          <td className="py-3 px-3 text-center border-r border-slate-200 dark:border-slate-700/70 font-mono text-[11px] font-bold text-slate-500 dark:text-slate-400">
                            {cust.customerId}
                          </td>

                          {/* Avatar */}
                          <td className="py-3 px-3 text-center border-r border-slate-200 dark:border-slate-700/70">
                            <div className="w-9 h-9 mx-auto rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 flex items-center justify-center font-black text-xs text-slate-700 dark:text-slate-200 shadow-xs">
                              {cust.avatar ? (
                                <img src={cust.avatar} alt={cust.name} className="w-full h-full object-cover" />
                              ) : (
                                <span>{initialLetter}</span>
                              )}
                            </div>
                          </td>

                          {/* Tên Độc Giả */}
                          <td className="py-3 px-4 border-r border-slate-200 dark:border-slate-700/70">
                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold text-slate-900 dark:text-white text-xs">
                                {cust.name}
                              </span>
                              {cust.isBirthdayToday && (
                                <span className="text-sm animate-bounce" title="Sinh nhật hôm nay!">🎂</span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 font-mono block">
                              @{cust.username || 'chưa_đặt_user'}
                            </span>
                          </td>

                          {/* Email & Phone */}
                          <td className="py-3 px-4 border-r border-slate-200 dark:border-slate-700/70">
                            <div className="text-xs text-slate-700 dark:text-slate-300">{cust.email || '—'}</div>
                            <div className="text-[11px] text-slate-400 font-mono">{cust.phone || '—'}</div>
                          </td>

                          {/* Cấp Bậc */}
                          <td className="py-3 px-3 text-center border-r border-slate-200 dark:border-slate-700/70 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                              cust.tier?.includes('Kim Cương')
                                ? 'bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-cyan-950/60 dark:text-cyan-300'
                                : cust.tier?.includes('Vàng')
                                  ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300'
                                  : cust.tier?.includes('Bạc')
                                    ? 'bg-slate-200 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200'
                                    : 'bg-amber-900/10 text-amber-900 border-amber-800/30 dark:bg-amber-900/30 dark:text-amber-300'
                            }`}>
                              <i className="fa-solid fa-crown text-[9px]"></i>
                              <span>{cust.tier || 'Đồng'}</span>
                            </span>
                          </td>

                          {/* Số Dư Khoai */}
                          <td className="py-3 px-3 text-center border-r border-slate-200 dark:border-slate-700/70 whitespace-nowrap">
                            <span className="font-black text-amber-600 dark:text-amber-400 text-xs">
                              🥔 {cust.potatoBalance ?? 0}
                            </span>
                          </td>

                          {/* Sinh Nhật */}
                          <td className="py-3 px-3 text-center border-r border-slate-200 dark:border-slate-700/70 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                            {cust.birthday || '—'}
                          </td>

                          {/* Trạng Thái */}
                          <td className="py-3 px-3 text-center border-r border-slate-200 dark:border-slate-700/70 whitespace-nowrap">
                            {isLocked ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                                <i className="fa-solid fa-ban text-[9px]"></i> Đã khóa
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                                <i className="fa-solid fa-circle-check text-[9px]"></i> Hoạt động
                              </span>
                            )}
                          </td>

                          {/* Hành Động */}
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Nút Tặng Khoai / Chúc mừng */}
                              <button
                                type="button"
                                onClick={() => openAdjustModal(cust, cust.isBirthdayToday ? 100 : 50)}
                                className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 transition cursor-pointer text-xs"
                                title="Thưởng / Tặng Khoai Tây 🥔"
                              >
                                <i className="fa-solid fa-gift"></i>
                              </button>

                              {/* Nút Chỉnh sửa */}
                              <button
                                type="button"
                                onClick={() => openEditModal(cust)}
                                className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 transition cursor-pointer text-xs"
                                title="Chỉnh sửa hồ sơ độc giả"
                              >
                                <i className="fa-solid fa-pen-to-square"></i>
                              </button>

                              {/* Nút Khóa / Mở Khóa */}
                              <button
                                type="button"
                                onClick={() => handleToggleLock(cust)}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer flex items-center gap-1 ${
                                  isLocked
                                    ? 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                                    : 'bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800'
                                }`}
                                title={isLocked ? "Bấm để mở khóa tài khoản" : "Bấm để khóa tài khoản"}
                              >
                                <i className={`fa-solid ${isLocked ? 'fa-lock-open' : 'fa-user-lock'}`}></i>
                                <span>{isLocked ? 'Mở khóa' : 'Khóa'}</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom Bar: Tổng số khách hàng */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs font-bold text-slate-500">
              <span>Hiển thị {customers.length} / {stats.totalCustomers} độc giả</span>
              <button onClick={handleExportCSV} className="text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer">
                <i className="fa-solid fa-download"></i> Tải báo cáo CSV
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* ==========================================================
          MODAL 1: CHỈNH SỬA HỒ SƠ KHÁCH HÀNG
          ========================================================== */}
      {isEditModalOpen && editingCustomer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-3">
              <h3 className="font-black text-base text-slate-800 dark:text-white flex items-center gap-2">
                <i className="fa-solid fa-user-pen text-blue-600"></i>
                <span>Chỉnh Sửa Hồ Sơ Độc Giả</span>
              </h3>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs font-bold">
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">Mã KH (Không đổi)</label>
                <input 
                  type="text" 
                  value={editingCustomer.customerId} 
                  disabled 
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-slate-400 cursor-not-allowed" 
                />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 dark:text-slate-300 mb-1">Họ và tên *</label>
                <input 
                  type="text" 
                  required
                  value={editForm.customerName}
                  onChange={(e) => setEditForm({ ...editForm, customerName: e.target.value })}
                  placeholder="Nhập họ và tên..."
                  className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20" 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 dark:text-slate-300 mb-1">Số điện thoại</label>
                  <input 
                    type="text"
                    value={editForm.phoneNumber}
                    onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                    placeholder="0987..."
                    className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-800 dark:text-white focus:outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 dark:text-slate-300 mb-1">Ngày sinh</label>
                  <input 
                    type="date"
                    value={editForm.birthday}
                    onChange={(e) => setEditForm({ ...editForm, birthday: e.target.value })}
                    className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-800 dark:text-white focus:outline-none" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 dark:text-slate-300 mb-1">Giới tính</label>
                  <select 
                    value={editForm.gender ? 'male' : 'female'}
                    onChange={(e) => setEditForm({ ...editForm, gender: e.target.value === 'male' })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-800 dark:text-white focus:outline-none"
                  >
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">Email (Định danh)</label>
                  <input 
                    type="text" 
                    value={editingCustomer.email || '—'} 
                    disabled 
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-400 cursor-not-allowed text-xs" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 dark:text-slate-300 mb-1">Địa chỉ</label>
                <input 
                  type="text"
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  placeholder="Địa chỉ liên hệ..."
                  className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-800 dark:text-white focus:outline-none" 
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-700">
                <button 
                  type="button" 
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold cursor-pointer"
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  disabled={isSavingEdit}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isSavingEdit ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================================
          MODAL 2: THƯỞNG / ĐIỀU CHỈNH KHOAI TÂY 🥔
          ========================================================== */}
      {isAdjustModalOpen && adjustCustomer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-3">
              <h3 className="font-black text-base text-slate-800 dark:text-white flex items-center gap-2">
                <span>🥔</span>
                <span>Thưởng / Điều Chỉnh Khoai Tây</span>
              </h3>
              <button 
                onClick={() => setIsAdjustModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900/50 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-black flex items-center justify-center text-sm">
                {(adjustCustomer.name || 'U').charAt(0)}
              </div>
              <div className="text-xs">
                <div className="font-black text-slate-800 dark:text-white">{adjustCustomer.name}</div>
                <div className="text-[11px] text-amber-700 dark:text-amber-300 font-bold mt-0.5">
                  Số dư hiện có: <strong className="text-amber-600 dark:text-amber-400">{adjustCustomer.potatoBalance ?? 0} Khoai</strong>
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveAdjust} className="space-y-3.5 text-xs font-bold">
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 dark:text-slate-300 mb-1">
                  Số lượng Khoai Tây điều chỉnh (Dương: cộng, Âm: trừ) *
                </label>
                <div className="relative">
                  <input 
                    type="number"
                    step="1"
                    required
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(e.target.value)}
                    placeholder="+50 hoặc -20"
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-800 dark:text-white font-black text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-base">🥔</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Dự kiến sau điều chỉnh: <strong className="text-slate-700 dark:text-slate-200">{Math.max(0, (adjustCustomer.potatoBalance || 0) + (parseInt(adjustAmount, 10) || 0))} Khoai</strong>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 dark:text-slate-300 mb-1">
                  Lý do điều chỉnh / Lời nhắn gửi độc giả *
                </label>
                <textarea 
                  rows="3"
                  required
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="Lý do tặng quà, hoàn tiền, sự kiện tri ân..."
                  className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-800 dark:text-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-700">
                <button 
                  type="button" 
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold cursor-pointer"
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  disabled={isSavingAdjust}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl transition shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isSavingAdjust ? 'Đang xử lý...' : 'Xác Nhận Tặng Khoai 🎁'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast.message && (
        <div className={`fixed bottom-6 right-6 px-4 py-3 rounded-xl shadow-2xl z-50 text-xs font-bold flex items-center gap-2 border transition-all animate-bounce ${
          toast.type === 'error'
            ? 'bg-rose-900 text-rose-100 border-rose-700'
            : toast.type === 'warning'
              ? 'bg-amber-900 text-amber-100 border-amber-700'
              : 'bg-slate-900 text-white border-slate-700'
        }`}>
          <span>{toast.type === 'error' ? '❌' : toast.type === 'warning' ? '⚠️' : '✅'}</span>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
