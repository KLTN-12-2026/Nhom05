import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLegacyAdminPage } from './legacy-runtime';
import { getAdminMissions, saveAdminMission, getMissionClaims } from '@/services/missionService';
import { confirmDialog } from '@/components/common/CustomConfirmModal';

// Danh mục các điều kiện nhiệm vụ được hỗ trợ trong hệ thống
const CONDITIONS_MAP = {
  CHECKIN: {
    label: 'Điểm danh hằng ngày',
    period: 'DAILY',
    icon: 'fa-calendar-check',
    unit: 'lượt',
    isTriggerOnly: true, // Mục tiêu luôn cố định = 1
    desc: 'Điểm danh tại trang nhiệm vụ hoặc màn hình hội viên mỗi ngày.',
  },
  READING_SECONDS: {
    label: 'Thời gian đọc sách trong ngày (giây)',
    period: 'DAILY',
    icon: 'fa-book-open-reader',
    unit: 'giây',
    isTriggerOnly: false,
    desc: 'Tích lũy thời gian đọc sách thuê khi màn hình đọc sách đang mở.',
  },
  CHAT: {
    label: 'Hỏi đáp trợ lý AI Khoai Nhỏ',
    period: 'DAILY',
    icon: 'fa-robot',
    unit: 'câu hỏi',
    isTriggerOnly: false,
    desc: 'Gửi câu hỏi và nhận câu trả lời từ trợ lý AI Khoai Nhỏ trong ngày.',
  },
  SEARCH: {
    label: 'Tìm kiếm sách trong danh mục',
    period: 'DAILY',
    icon: 'fa-magnifying-glass',
    unit: 'lượt',
    isTriggerOnly: true, // Mục tiêu luôn cố định = 1
    desc: 'Tìm kiếm tác phẩm với từ khóa có độ dài từ 2 ký tự trở lên.',
  },
  OFFERS: {
    label: 'Khám phá trang Ưu Đãi',
    period: 'DAILY',
    icon: 'fa-tags',
    unit: 'lượt',
    isTriggerOnly: true, // Mục tiêu luôn cố định = 1
    desc: 'Mở trang Ưu đãi & Gói nạp Khoai Tây hôm nay.',
  },
  BOOKSHELF: {
    label: 'Ghé thăm Tủ Sách Cá Nhân',
    period: 'DAILY',
    icon: 'fa-book-bookmark',
    unit: 'lượt',
    isTriggerOnly: true, // Mục tiêu luôn cố định = 1
    desc: 'Mở tủ sách cá nhân của độc giả hôm nay.',
  },
  STREAK_DAYS: {
    label: 'Chuỗi điểm danh liên tục',
    period: 'MILESTONE',
    icon: 'fa-fire-flame-curved',
    unit: 'ngày liên tiếp',
    isTriggerOnly: false,
    desc: 'Duy trì chuỗi điểm danh hàng ngày liên tục không ngắt quãng.',
  },
  BOOKS_OWNED: {
    label: 'Số sách sở hữu quyền đọc còn hạn',
    period: 'MILESTONE',
    icon: 'fa-book',
    unit: 'cuốn sách',
    isTriggerOnly: false,
    desc: 'Tổng số sách khác nhau có quyền đọc còn hiệu lực trong tủ sách.',
  },
  TOTAL_XP: {
    label: 'Điểm kinh nghiệm tích lũy (XP)',
    period: 'MILESTONE',
    icon: 'fa-star',
    unit: 'XP',
    isTriggerOnly: false,
    desc: 'Đạt mốc điểm tích lũy thành viên trọn đời trên hệ thống.',
  },
};

const EMPTY_FORM = {
  title: '',
  description: '',
  condition: 'CHECKIN',
  period: 'DAILY',
  targetValue: 1,
  rewardPotato: 5,
  rewardXp: 20,
  active: true,
  orderIndex: 0,
};

const errorText = (error) =>
  error?.response?.data?.message || error.message || 'Không thể kết nối máy chủ.';

export default function QLNhiemVu() {
  useLegacyAdminPage('QuanLyNhiemVu.html', null, false);

  const [missions, setMissions] = useState([]);
  const [history, setHistory] = useState(null);
  const [historyPage, setHistoryPage] = useState(0);

  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'daily' | 'milestone' | 'history' | 'guide'
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'INACTIVE'

  // Modal State cho Thêm / Chỉnh sửa nhiệm vụ
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMission, setEditingMission] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [readingMinutes, setReadingMinutes] = useState(20);

  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const pending = useRef(false);

  // Toast Notification
  const [toast, setToast] = useState({ message: '', type: 'info' });
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: 'info' }), 4000);
  };

  // Tải danh sách nhiệm vụ và lịch sử nhận thưởng từ Backend
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [missionList, claimHistory] = await Promise.all([
        getAdminMissions(),
        getMissionClaims(historyPage),
      ]);
      setMissions(Array.isArray(missionList) ? missionList : []);
      setHistory(claimHistory);
      setError('');
    } catch (err) {
      const msg = errorText(err);
      setError(msg);
      showToast(msg, 'danger');
    } finally {
      setLoading(false);
    }
  }, [historyPage]);

  useEffect(() => {
    void load();
  }, [load]);

  // Bộ lọc danh sách nhiệm vụ
  const filteredMissions = useMemo(() => {
    return missions.filter((m) => {
      // Lọc theo Tab
      if (activeTab === 'daily' && m.period !== 'DAILY') return false;
      if (activeTab === 'milestone' && m.period !== 'MILESTONE') return false;

      // Lọc theo Trạng thái
      if (statusFilter === 'ACTIVE' && !m.active) return false;
      if (statusFilter === 'INACTIVE' && m.active) return false;

      // Tìm kiếm từ khóa
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const titleMatch = (m.title || '').toLowerCase().includes(query);
        const descMatch = (m.description || '').toLowerCase().includes(query);
        const idMatch = (m.id || '').toLowerCase().includes(query);
        const condMatch = (m.condition || '').toLowerCase().includes(query);
        if (!titleMatch && !descMatch && !idMatch && !condMatch) return false;
      }

      return true;
    });
  }, [missions, activeTab, statusFilter, searchQuery]);

  // Thống kê nhanh
  const stats = useMemo(() => {
    const total = missions.length;
    const dailyCount = missions.filter((m) => m.period === 'DAILY').length;
    const milestoneCount = missions.filter((m) => m.period === 'MILESTONE').length;
    const activeCount = missions.filter((m) => m.active).length;
    const totalClaimsCount = history?.totalElements || 0;
    return { total, dailyCount, milestoneCount, activeCount, totalClaimsCount };
  }, [missions, history]);

  // Mở modal tạo nhiệm vụ mới
  const openCreateModal = () => {
    setEditingMission(null);
    setForm({ ...EMPTY_FORM });
    setReadingMinutes(20);
    setIsModalOpen(true);
  };

  // Mở modal chỉnh sửa nhiệm vụ
  const openEditModal = (mission) => {
    setEditingMission(mission);
    setForm({ ...mission });
    if (mission.condition === 'READING_SECONDS') {
      setReadingMinutes(Math.round(mission.targetValue / 60));
    }
    setIsModalOpen(true);
  };

  // Đóng modal
  const closeModal = () => {
    if (saving) return;
    setIsModalOpen(false);
    setEditingMission(null);
    setForm(EMPTY_FORM);
  };

  // Thay đổi điều kiện trong form
  const handleConditionChange = (nextCondition) => {
    const meta = CONDITIONS_MAP[nextCondition];
    if (!meta) return;

    let nextTarget = form.targetValue;
    if (meta.isTriggerOnly) {
      nextTarget = 1;
    } else if (nextCondition === 'READING_SECONDS') {
      nextTarget = readingMinutes * 60;
    }

    setForm((prev) => ({
      ...prev,
      condition: nextCondition,
      period: meta.period,
      targetValue: nextTarget,
    }));
  };

  // Lưu nhiệm vụ (Thêm mới hoặc Cập nhật)
  const save = async (event) => {
    if (event) event.preventDefault();
    if (pending.current) return;

    // Validation cơ bản
    if (!form.title.trim()) {
      showToast('Vui lòng nhập tên nhiệm vụ.', 'warning');
      return;
    }
    if (!form.description.trim()) {
      showToast('Vui lòng nhập mô tả điều kiện nhiệm vụ.', 'warning');
      return;
    }

    const condMeta = CONDITIONS_MAP[form.condition];
    if (condMeta?.isTriggerOnly && form.targetValue !== 1) {
      showToast(`Nhiệm vụ dạng ${condMeta.label} có mục tiêu cố định là 1 lượt kích hoạt.`, 'warning');
      return;
    }

    pending.current = true;
    setSaving(true);
    setError('');
    setNotice('');

    try {
      const payload = {
        ...form,
        title: form.title.trim(),
        description: form.description.trim(),
        targetValue: Number(form.targetValue) || 1,
        rewardPotato: Number(form.rewardPotato) || 0,
        rewardXp: Number(form.rewardXp) || 0,
        orderIndex: Number(form.orderIndex) || 0,
      };

      await saveAdminMission(payload);
      const successMessage = editingMission
        ? `Đã cập nhật nhiệm vụ "${payload.title}" thành công!`
        : `Đã tạo nhiệm vụ mới "${payload.title}" thành công!`;

      setNotice(successMessage);
      showToast(successMessage, 'success');
      closeModal();
      await load();
    } catch (reason) {
      const err = errorText(reason);
      setError(err);
      showToast(err, 'danger');
    } finally {
      pending.current = false;
      setSaving(false);
    }
  };

  // Bật/tắt nhanh trạng thái nhiệm vụ trực tiếp từ bảng
  const toggleMissionActive = async (mission) => {
    if (saving) return;
    const nextActive = !mission.active;
    try {
      await saveAdminMission({ ...mission, active: nextActive });
      setMissions((prev) =>
        prev.map((m) => (m.id === mission.id ? { ...m, active: nextActive } : m))
      );
      showToast(
        `Đã ${nextActive ? 'mở' : 'tạm dừng'} nhiệm vụ "${mission.title}"`,
        nextActive ? 'success' : 'info'
      );
    } catch (err) {
      showToast('Lỗi cập nhật trạng thái: ' + errorText(err), 'danger');
    }
  };

  return (
    <div className="admin-page-root">
      {/* Shared Sidebar */}
      <div id="admin-sidebar-container"></div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-gray-950 overflow-hidden font-sans">
        {/* Shared Header */}
        <div
          id="admin-header-container"
          data-title="Quản Lý Nhiệm Vụ & Thành Tựu Độc Giả"
          data-subtitle="Hệ thống nhiệm vụ hằng ngày, thành tựu cột mốc, cấu hình thưởng Khoai/XP và theo dõi lịch sử nhận thưởng"
        ></div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {/* Toast Notification Container */}
          {toast.message && (
            <div
              className={`p-3.5 rounded-2xl border text-xs md:text-sm font-bold flex items-center justify-between shadow-xs transition-all ${
                toast.type === 'danger'
                  ? 'bg-rose-50 border-rose-200 text-rose-700'
                  : toast.type === 'warning'
                  ? 'bg-amber-50 border-amber-200 text-amber-800'
                  : toast.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-blue-50 border-blue-200 text-blue-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <i
                  className={`fa-solid ${
                    toast.type === 'danger'
                      ? 'fa-circle-xmark'
                      : toast.type === 'warning'
                      ? 'fa-triangle-exclamation'
                      : toast.type === 'success'
                      ? 'fa-circle-check'
                      : 'fa-circle-info'
                  }`}
                />
                <span>{toast.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setToast({ message: '', type: 'info' })}
                className="text-slate-400 hover:text-slate-700"
              >
                <i className="fa-solid fa-xmark text-sm" />
              </button>
            </div>
          )}

          {/* 4 KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Tổng Nhiệm Vụ */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                  Tổng Số Nhiệm Vụ
                </p>
                <h4 className="text-2xl font-black text-slate-800 dark:text-white mt-1">
                  {loading ? '...' : `${stats.total} nhiệm vụ`}
                </h4>
                <p className="text-[11px] text-emerald-600 font-bold mt-0.5">
                  {stats.activeCount} đang mở trên hệ thống
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xl border border-blue-200 dark:border-blue-800 shadow-inner">
                <i className="fa-solid fa-list-check"></i>
              </div>
            </div>

            {/* Card 2: Nhiệm Vụ Hằng Ngày */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider">
                  Nhiệm Vụ Hằng Ngày
                </p>
                <h4 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                  {loading ? '...' : `${stats.dailyCount} nhiệm vụ`}
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Làm mới 00:00 hằng ngày</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl border border-emerald-200 dark:border-emerald-800 shadow-inner">
                <i className="fa-solid fa-calendar-day"></i>
              </div>
            </div>

            {/* Card 3: Thành Tựu Cột Mốc */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider">
                  Thành Tựu Cột Mốc
                </p>
                <h4 className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
                  {loading ? '...' : `${stats.milestoneCount} cột mốc`}
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Nhận thưởng 1 lần trọn đời</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xl border border-amber-200 dark:border-amber-800 shadow-inner">
                <i className="fa-solid fa-trophy"></i>
              </div>
            </div>

            {/* Card 4: Tổng Lượt Nhận Thưởng */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-black uppercase text-purple-600 dark:text-purple-400 tracking-wider">
                  Lượt Nhận Thưởng
                </p>
                <h4 className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">
                  {loading ? '...' : `${stats.totalClaimsCount.toLocaleString('vi-VN')} lượt`}
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Ghi nhận trong sổ cái</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center text-xl border border-purple-200 dark:border-purple-800 shadow-inner">
                <i className="fa-solid fa-gift"></i>
              </div>
            </div>
          </div>

          {/* Navigation Tabs Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {[
              { key: 'all', label: 'Tất Cả Nhiệm Vụ', icon: 'fa-list-check', count: stats.total },
              { key: 'daily', label: 'Nhiệm Vụ Hằng Ngày', icon: 'fa-calendar-day', count: stats.dailyCount },
              { key: 'milestone', label: 'Thành Tựu Cột Mốc', icon: 'fa-trophy', count: stats.milestoneCount },
              { key: 'history', label: 'Lịch Sử Nhận Thưởng', icon: 'fa-receipt', count: stats.totalClaimsCount },
              { key: 'guide', label: 'Cơ Chế Theo Dõi & Hướng Dẫn', icon: 'fa-circle-question', count: null },
            ].map((t) => (
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
                {t.count !== null && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                      activeTab === t.key
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ========================================================
             TAB 1, 2, 3: BẢNG DANH SÁCH NHIỆM VỤ
             ======================================================== */}
          {activeTab !== 'history' && activeTab !== 'guide' && (
            <div className="space-y-4">
              {/* Filter & Action Bar */}
              <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                  {/* Search Input */}
                  <div className="relative flex-1 min-w-[200px]">
                    <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-3 text-xs text-slate-400"></i>
                    <input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Tìm theo tên nhiệm vụ, mô tả, mã ID..."
                      className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-xs outline-none focus:border-blue-500 transition"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
                      >
                        <i className="fa-solid fa-xmark"></i>
                      </button>
                    )}
                  </div>

                  {/* Status Filter Dropdown */}
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-xs font-bold outline-none cursor-pointer"
                  >
                    <option value="ALL">Tất cả trạng thái</option>
                    <option value="ACTIVE">Đang mở trên App & Web</option>
                    <option value="INACTIVE">Tạm dừng</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                  <button
                    type="button"
                    onClick={() => void load()}
                    disabled={loading}
                    className="px-3.5 py-2 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-white font-bold rounded-xl text-xs border border-slate-200 dark:border-slate-600 shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <i className={`fa-solid fa-arrows-rotate text-xs ${loading ? 'animate-spin' : ''}`}></i>
                    <span>Làm mới</span>
                  </button>

                  <button
                    type="button"
                    onClick={openCreateModal}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-xs shadow-sm shadow-blue-500/20 flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <i className="fa-solid fa-plus text-xs"></i>
                    <span>Tạo Nhiệm Vụ Mới</span>
                  </button>
                </div>
              </div>

              {/* Missions Data Table */}
              <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xs">
                <table className="w-full text-left text-xs md:text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-700/60 uppercase text-[11px] font-black text-slate-500 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="p-3.5 w-16 text-center">Mã ID</th>
                      <th className="p-3.5">Nhiệm Vụ & Nội Dung</th>
                      <th className="p-3.5 w-32 text-center">Phân Loại</th>
                      <th className="p-3.5">Điều Kiện & Mục Tiêu</th>
                      <th className="p-3.5 w-36">Phần Thưởng</th>
                      <th className="p-3.5 w-20 text-center">Thứ Tự</th>
                      <th className="p-3.5 w-28 text-center">Trạng Thái</th>
                      <th className="p-3.5 w-24 text-center">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-slate-800 dark:text-white">
                    {loading ? (
                      <tr>
                        <td colSpan="8" className="p-12 text-center text-slate-400 font-bold">
                          <i className="fa-solid fa-circle-notch fa-spin mr-2 text-blue-600"></i>
                          Đang nạp danh sách nhiệm vụ...
                        </td>
                      </tr>
                    ) : filteredMissions.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="p-12 text-center text-slate-400 font-bold">
                          Không tìm thấy nhiệm vụ nào phù hợp với bộ lọc hiện tại.
                        </td>
                      </tr>
                    ) : (
                      filteredMissions.map((m) => {
                        const condMeta = CONDITIONS_MAP[m.condition] || {
                          label: m.condition,
                          icon: 'fa-circle-check',
                          unit: '',
                          desc: '',
                        };
                        const isDaily = m.period === 'DAILY';

                        return (
                          <tr
                            key={m.id}
                            className={`hover:bg-blue-50/30 dark:hover:bg-slate-700/40 transition ${
                              !m.active ? 'opacity-60 bg-slate-50/50' : ''
                            }`}
                          >
                            {/* Mission ID */}
                            <td className="p-3.5 text-center font-mono text-[11px] text-slate-500">
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600">
                                {m.id}
                              </span>
                            </td>

                            {/* Mission Title & Description */}
                            <td className="p-3.5 max-w-sm">
                              <div className="font-black text-slate-800 dark:text-white text-sm">
                                {m.title}
                              </div>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                                {m.description}
                              </p>
                            </td>

                            {/* Period Badge */}
                            <td className="p-3.5 text-center whitespace-nowrap">
                              <span
                                className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase inline-flex items-center gap-1 border ${
                                  isDaily
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                                    : 'bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300'
                                }`}
                              >
                                <i className={`fa-solid ${isDaily ? 'fa-calendar-day' : 'fa-award'} text-[10px]`}></i>
                                <span>{isDaily ? 'Hằng Ngày' : 'Thành Tựu'}</span>
                              </span>
                            </td>

                            {/* Condition & Target */}
                            <td className="p-3.5">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 flex items-center justify-center text-xs shrink-0 border border-blue-200">
                                  <i className={`fa-solid ${condMeta.icon}`}></i>
                                </div>
                                <div>
                                  <div className="font-bold text-slate-800 dark:text-white text-xs">
                                    {condMeta.label}
                                  </div>
                                  <div className="text-[11px] text-slate-500 font-medium">
                                    Mục tiêu:{' '}
                                    <span className="font-bold text-blue-600 dark:text-blue-400">
                                      {m.condition === 'READING_SECONDS'
                                        ? `${m.targetValue.toLocaleString('vi-VN')} giây (≈ ${Math.round(m.targetValue / 60)} phút)`
                                        : `${m.targetValue.toLocaleString('vi-VN')} ${condMeta.unit}`}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Rewards */}
                            <td className="p-3.5 whitespace-nowrap">
                              <div className="space-y-0.5">
                                <div className="font-black text-amber-600 flex items-center gap-1">
                                  <span>+{m.rewardPotato}</span>
                                  <span>🥔 Khoai</span>
                                </div>
                                <div className="text-[11px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                                  <span>+{m.rewardXp}</span>
                                  <span>⭐ XP</span>
                                </div>
                              </div>
                            </td>

                            {/* Order Index */}
                            <td className="p-3.5 text-center font-bold text-slate-500">
                              {m.orderIndex}
                            </td>

                            {/* Active Switch Toggle */}
                            <td className="p-3.5 text-center">
                              <label className="relative inline-flex items-center cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={m.active}
                                  onChange={() => void toggleMissionActive(m)}
                                  className="sr-only peer"
                                />
                                <div className={`w-10 h-5 rounded-full transition-colors relative ${m.active ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
                                  <span
                                    className={`absolute top-0.5 left-0.5 bg-white border border-slate-300 rounded-full h-4 w-4 transition-transform duration-200 shadow-xs pointer-events-none ${
                                      m.active ? 'translate-x-5' : 'translate-x-0'
                                    }`}
                                  />
                                </div>
                              </label>
                            </td>

                            {/* Action Edit */}
                            <td className="p-3.5 text-center">
                              <button
                                type="button"
                                onClick={() => openEditModal(m)}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-bold rounded-xl text-xs border border-slate-200 transition flex items-center justify-center gap-1 mx-auto cursor-pointer"
                                title="Chỉnh sửa nhiệm vụ"
                              >
                                <i className="fa-solid fa-pen-to-square text-xs"></i>
                                <span>Sửa</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================
             TAB 4: LỊCH SỬ NHẬN THƯỞNG
             ======================================================== */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex items-center justify-between">
                <div>
                  <h3 className="font-black text-sm md:text-base text-slate-800 dark:text-white flex items-center gap-2">
                    <i className="fa-solid fa-receipt text-purple-600"></i>
                    <span>Nhật Ký Nhận Thưởng Nhiệm Vụ Toàn Hệ Thống</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Ghi nhận độc giả hoàn thành nhiệm vụ và nhận Khoai/XP theo thời gian thực
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => void load()}
                  disabled={loading}
                  className="px-3.5 py-2 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-white font-bold rounded-xl text-xs border border-slate-200 dark:border-slate-600 shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <i className={`fa-solid fa-arrows-rotate text-xs ${loading ? 'animate-spin' : ''}`}></i>
                  <span>Làm mới nhật ký</span>
                </button>
              </div>

              {/* Claims History Table */}
              <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xs">
                <table className="w-full text-left text-xs md:text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-700/60 uppercase text-[11px] font-black text-slate-500 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="p-3.5 w-16 text-center">Mã Đơn</th>
                      <th className="p-3.5">Mã Độc Giả</th>
                      <th className="p-3.5">Nhiệm Vụ Đã Nhận</th>
                      <th className="p-3.5 w-32 text-center">Chu Kỳ</th>
                      <th className="p-3.5 w-32 text-center">Ngày Nhận</th>
                      <th className="p-3.5 w-36">Thưởng Nhận</th>
                      <th className="p-3.5 w-32 text-right">Số Dư Sau Nhận</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-slate-800 dark:text-white">
                    {loading ? (
                      <tr>
                        <td colSpan="7" className="p-12 text-center text-slate-400 font-bold">
                          <i className="fa-solid fa-circle-notch fa-spin mr-2 text-purple-600"></i>
                          Đang tải dữ liệu nhận thưởng...
                        </td>
                      </tr>
                    ) : !history?.content || history.content.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="p-12 text-center text-slate-400 font-bold">
                          Chưa có lượt nhận thưởng nhiệm vụ nào được ghi nhận.
                        </td>
                      </tr>
                    ) : (
                      history.content.map((c) => (
                        <tr key={c.id} className="hover:bg-purple-50/20 dark:hover:bg-slate-700/40 transition">
                          <td className="p-3.5 text-center font-mono text-[11px] text-slate-400">
                            #{c.id}
                          </td>
                          <td className="p-3.5">
                            <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                              {c.customerId}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <div className="font-bold text-slate-800 dark:text-white">
                              {c.missionTitle || c.missionId}
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">ID: {c.missionId}</span>
                          </td>
                          <td className="p-3.5 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                                c.missionPeriod === 'DAILY'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-purple-100 text-purple-800'
                              }`}
                            >
                              {c.missionPeriod === 'DAILY' ? 'Hằng ngày' : 'Thành tựu'}
                            </span>
                          </td>
                          <td className="p-3.5 text-center font-bold text-slate-600 dark:text-slate-300">
                            {c.claimDate}
                          </td>
                          <td className="p-3.5">
                            <span className="font-black text-amber-600">+{c.rewardPotato} 🥔</span>
                            {c.rewardXp != null && (
                              <span className="ml-2 font-bold text-blue-600">+{c.rewardXp} ⭐</span>
                            )}
                          </td>
                          <td className="p-3.5 text-right font-black text-slate-700 dark:text-slate-300">
                            {c.balanceAfter != null ? `${c.balanceAfter.toLocaleString('vi-VN')} 🥔` : '—'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {history && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs text-xs">
                  <div className="text-slate-500 font-medium">
                    Hiển thị trang <b>{historyPage + 1}</b> / <b>{Math.max(1, history.totalPages || 1)}</b> (Tổng cộng <b>{history.totalElements || 0}</b> lượt nhận thưởng)
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={historyPage === 0 || loading}
                      onClick={() => setHistoryPage((p) => Math.max(0, p - 1))}
                      className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-white font-bold hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer"
                    >
                      <i className="fa-solid fa-chevron-left mr-1"></i> Trang trước
                    </button>

                    <button
                      type="button"
                      disabled={loading || !history || history.last}
                      onClick={() => setHistoryPage((p) => p + 1)}
                      className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-white font-bold hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer"
                    >
                      Trang sau <i className="fa-solid fa-chevron-right ml-1"></i>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================
             TAB 5: CƠ CHẾ TỰ ĐỘNG & HƯỚNG DẪN
             ======================================================== */}
          {activeTab === 'guide' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Card 1: Heartbeat đọc sách */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg border border-blue-200">
                    <i className="fa-solid fa-heart-pulse"></i>
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-slate-800 dark:text-white">
                      Cơ Chế Heartbeat Chống Gian Lận Đọc Sách
                    </h4>
                    <p className="text-xs text-slate-400">Tự động tạm dừng khi ẩn tab hoặc khóa máy</p>
                  </div>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Đối với nhiệm vụ <code className="font-mono text-blue-600">READING_SECONDS</code>, Web và App sẽ gửi tín hiệu heartbeat định kỳ mỗi 30 giây kèm mã phiên đọc (<code className="font-mono text-blue-600">sessionId</code>) và mã sách. Khi độc giả chuyển tab, thu nhỏ trình duyệt hoặc khóa máy, quá trình tích lũy thời gian sẽ tự động đóng băng ngay lập tức, ngăn ngừa gian lận cày giờ.
                </p>
              </div>

              {/* Card 2: Chu kỳ reset 00:00 */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg border border-emerald-200">
                    <i className="fa-solid fa-clock-rotate-left"></i>
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-slate-800 dark:text-white">
                      Chu Kỳ Reset 00:00 Giờ Việt Nam
                    </h4>
                    <p className="text-xs text-slate-400">Tự động đặt lại nhiệm vụ hằng ngày</p>
                  </div>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Tất cả các nhiệm vụ hằng ngày (<code className="font-mono text-emerald-600">DAILY</code>) được hệ thống máy chủ đồng bộ đặt lại tiến độ vào đúng <b>00:00:00 nửa đêm</b> theo múi giờ Việt Nam (<code className="font-mono text-emerald-600">Asia/Ho_Chi_Minh</code>). Độc giả có thể thực hiện và nhận thưởng lại mỗi ngày để duy trì thói quen đọc.
                </p>
              </div>

              {/* Card 3: Khóa điều kiện và chu kỳ */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-lg border border-amber-200">
                    <i className="fa-solid fa-lock"></i>
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-slate-800 dark:text-white">
                      Nguyên Tắc Bất Biến Sau Khi Tạo Nhiệm Vụ
                    </h4>
                    <p className="text-xs text-slate-400">Bảo toàn toàn vẹn lịch sử nhận thưởng</p>
                  </div>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Sau khi một nhiệm vụ đã được khởi tạo, <b>Điều kiện kích hoạt</b> và <b>Chu kỳ</b> của nhiệm vụ đó sẽ được khóa cố định. Bạn có thể điều chỉnh Tên, Mô tả, Mục tiêu, Phần thưởng Khoai/XP và Thứ tự hiển thị, hoặc tạm tắt nhiệm vụ khi không còn sử dụng.
                </p>
              </div>

              {/* Card 4: Cơ chế cộng thưởng tức thì */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-lg border border-purple-200">
                    <i className="fa-solid fa-coins"></i>
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-slate-800 dark:text-white">
                      Hạch Toán Khoai & Điểm Kinh Nghiệm (XP)
                    </h4>
                    <p className="text-xs text-slate-400">Cộng trực tiếp vào ví độc giả và cấp hội viên</p>
                  </div>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Khi độc giả nhấn nút "Nhận thưởng", hệ thống sẽ đồng thời: (1) Cộng Khoai vào ví và ghi một giao dịch <code className="font-mono text-purple-600">REWARD</code> trong sổ cái; (2) Cộng điểm XP để nâng cấp hạng thành viên; (3) Lưu biên lai nhận thưởng; và (4) Gửi thông báo trực tiếp đến hộp thư của độc giả.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ========================================================
         MODAL: TẠO MỚI / CHỈNH SỬA NHIỆM VỤ
         ======================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center text-lg border border-blue-200">
                  <i className={`fa-solid ${editingMission ? 'fa-pen-to-square' : 'fa-plus'}`}></i>
                </div>
                <div>
                  <h3 className="font-black text-base md:text-lg text-slate-800 dark:text-white">
                    {editingMission ? 'Chỉnh Sửa Nhiệm Vụ' : 'Tạo Nhiệm Vụ Mới'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {editingMission ? `Mã nhiệm vụ: #${editingMission.id}` : 'Thêm nhiệm vụ mới vào hệ thống độc giả'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
              >
                <i className="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={save} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs md:text-sm">
              {/* Section 1: Thông tin cơ bản */}
              <div className="space-y-3">
                <h4 className="font-black text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <i className="fa-solid fa-pen-nib text-blue-600"></i>
                  <span>Thông Tin Cơ Bản</span>
                </h4>

                <div className="space-y-1">
                  <label className="font-black text-slate-700 dark:text-slate-300">
                    Tên Nhiệm Vụ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    required
                    maxLength={150}
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="VD: Đọc sách 20 phút mỗi ngày..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white font-bold outline-none focus:border-blue-500 transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-black text-slate-700 dark:text-slate-300">
                    Mô Tả Điều Kiện (Hiển thị cho độc giả) <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    maxLength={500}
                    rows={2}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="VD: Đọc sách thuê trên HALMBOOK đủ 1.200 giây trong ngày..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white outline-none focus:border-blue-500 transition resize-none"
                  />
                </div>
              </div>

              {/* Section 2: Điều kiện & Mục tiêu */}
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-700">
                <h4 className="font-black text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <i className="fa-solid fa-gears text-emerald-600"></i>
                  <span>Điều Kiện & Mục Tiêu Kích Hoạt</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Condition Selector */}
                  <div className="space-y-1">
                    <label className="font-black text-slate-700 dark:text-slate-300">
                      Điều Kiện Kích Hoạt
                    </label>
                    <select
                      disabled={!!editingMission}
                      value={form.condition}
                      onChange={(e) => handleConditionChange(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl border font-bold text-xs outline-none ${
                        editingMission
                          ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed'
                          : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white'
                      }`}
                    >
                      <optgroup label="Nhiệm Vụ Hằng Ngày (DAILY)">
                        {Object.entries(CONDITIONS_MAP)
                          .filter(([_, meta]) => meta.period === 'DAILY')
                          .map(([key, meta]) => (
                            <option key={key} value={key}>
                              {meta.label}
                            </option>
                          ))}
                      </optgroup>
                      <optgroup label="Thành Tựu Cột Mốc (MILESTONE)">
                        {Object.entries(CONDITIONS_MAP)
                          .filter(([_, meta]) => meta.period === 'MILESTONE')
                          .map(([key, meta]) => (
                            <option key={key} value={key}>
                              {meta.label}
                            </option>
                          ))}
                      </optgroup>
                    </select>
                    {editingMission && (
                      <p className="text-[10px] text-slate-400">
                        Điều kiện đã tạo không thể thay đổi để bảo toàn dữ liệu nhận thưởng.
                      </p>
                    )}
                  </div>

                  {/* Period Read-only */}
                  <div className="space-y-1">
                    <label className="font-black text-slate-700 dark:text-slate-300">
                      Chu Kỳ Nhiệm Vụ
                    </label>
                    <div className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 font-bold text-slate-700 dark:text-slate-300 text-xs flex items-center justify-between">
                      <span>{form.period === 'DAILY' ? 'Hằng Ngày (Reset 00:00)' : 'Thành Tựu (Nhận 1 lần)'}</span>
                      <span className="text-[10px] font-mono uppercase bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-600">
                        {form.period}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Target Value Input with Contextual Guidance */}
                <div className="space-y-2">
                  <label className="font-black text-slate-700 dark:text-slate-300">
                    Mục Tiêu Hoàn Thành <span className="text-rose-500">*</span>
                  </label>

                  {/* Case 1: Trigger only conditions (Checkin, Search, Offers, Bookshelf) */}
                  {CONDITIONS_MAP[form.condition]?.isTriggerOnly ? (
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-600 flex items-center justify-between">
                      <span className="text-xs text-slate-600 dark:text-slate-300">
                        Nhiệm vụ dạng kích hoạt hành động 1 lần trong ngày.
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 font-black text-xs border border-blue-200">
                        Mục tiêu = 1 lượt
                      </span>
                    </div>
                  ) : form.condition === 'READING_SECONDS' ? (
                    /* Case 2: Reading seconds with minute presets */
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[11px] text-slate-500 font-bold">Số phút đọc:</label>
                          <input
                            type="number"
                            min="1"
                            max="1440"
                            value={readingMinutes}
                            onChange={(e) => {
                              const mins = Math.max(1, parseInt(e.target.value, 10) || 1);
                              setReadingMinutes(mins);
                              setForm({ ...form, targetValue: mins * 60 });
                            }}
                            className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 font-bold text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] text-slate-500 font-bold">Số giây lưu hệ thống:</label>
                          <input
                            type="number"
                            min="1"
                            max="86400"
                            value={form.targetValue}
                            onChange={(e) => {
                              const secs = Math.max(1, parseInt(e.target.value, 10) || 1);
                              setForm({ ...form, targetValue: secs });
                              setReadingMinutes(Math.round(secs / 60));
                            }}
                            className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 font-bold text-xs text-blue-600"
                          />
                        </div>
                      </div>

                      {/* Quick preset chips for reading */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] text-slate-400 font-bold">Mốc đọc nhanh:</span>
                        {[
                          { min: 5, sec: 300 },
                          { min: 10, sec: 600 },
                          { min: 20, sec: 1200 },
                          { min: 30, sec: 1800 },
                          { min: 45, sec: 2700 },
                          { min: 60, sec: 3600 },
                        ].map((p) => (
                          <button
                            key={p.sec}
                            type="button"
                            onClick={() => {
                              setReadingMinutes(p.min);
                              setForm({ ...form, targetValue: p.sec });
                            }}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition ${
                              form.targetValue === p.sec
                                ? 'bg-blue-100 text-blue-800 border-blue-300'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
                            }`}
                          >
                            {p.min} phút ({p.sec}s)
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    /* Case 3: Other conditions (Streak days, Books owned, Total XP, Chat) */
                    <div className="space-y-2">
                      <div className="relative">
                        <input
                          required
                          type="number"
                          min="1"
                          max="86400"
                          value={form.targetValue}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              targetValue: Math.max(1, parseInt(e.target.value, 10) || 1),
                            })
                          }
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 font-bold text-xs"
                        />
                        <span className="absolute right-3 top-2 text-xs text-slate-400 font-bold">
                          {CONDITIONS_MAP[form.condition]?.unit}
                        </span>
                      </div>

                      {/* Presets for Streak */}
                      {form.condition === 'STREAK_DAYS' && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-400 font-bold">Gợi ý chuỗi:</span>
                          {[3, 7, 14, 21, 30].map((d) => (
                            <button
                              key={d}
                              type="button"
                              onClick={() => setForm({ ...form, targetValue: d })}
                              className="px-2 py-0.5 rounded-md text-[10px] bg-slate-100 hover:bg-slate-200 border border-slate-200 font-bold"
                            >
                              {d} ngày
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Presets for Books Owned */}
                      {form.condition === 'BOOKS_OWNED' && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-400 font-bold">Gợi ý số sách:</span>
                          {[1, 3, 5, 10, 20].map((b) => (
                            <button
                              key={b}
                              type="button"
                              onClick={() => setForm({ ...form, targetValue: b })}
                              className="px-2 py-0.5 rounded-md text-[10px] bg-slate-100 hover:bg-slate-200 border border-slate-200 font-bold"
                            >
                              {b} cuốn
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Presets for Total XP */}
                      {form.condition === 'TOTAL_XP' && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-400 font-bold">Mốc XP:</span>
                          {[50, 100, 200, 500, 1000].map((x) => (
                            <button
                              key={x}
                              type="button"
                              onClick={() => setForm({ ...form, targetValue: x })}
                              className="px-2 py-0.5 rounded-md text-[10px] bg-slate-100 hover:bg-slate-200 border border-slate-200 font-bold"
                            >
                              {x} XP
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Section 3: Phần thưởng & Hiển thị */}
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-700">
                <h4 className="font-black text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <i className="fa-solid fa-gift text-amber-600"></i>
                  <span>Phần Thưởng & Hiển Thị</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="font-black text-slate-700 dark:text-slate-300">
                      Khoai Thưởng (🥔) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      required
                      type="number"
                      min="0"
                      max="10000"
                      value={form.rewardPotato}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          rewardPotato: Math.max(0, parseInt(e.target.value, 10) || 0),
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 font-black text-amber-600 text-xs outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-black text-slate-700 dark:text-slate-300">
                      XP Thưởng (⭐) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      required
                      type="number"
                      min="0"
                      max="10000"
                      value={form.rewardXp}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          rewardXp: Math.max(0, parseInt(e.target.value, 10) || 0),
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 font-black text-blue-600 text-xs outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-black text-slate-700 dark:text-slate-300">
                      Thứ Tự Ưu Tiên
                    </label>
                    <input
                      required
                      type="number"
                      min="0"
                      max="10000"
                      value={form.orderIndex}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          orderIndex: Math.max(0, parseInt(e.target.value, 10) || 0),
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 font-bold text-xs outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.active}
                      onChange={(e) => setForm({ ...form, active: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                    />
                    <span className="font-bold text-slate-800 dark:text-white text-xs">
                      Kích hoạt ngay trên App & Web (Cho phép độc giả bắt đầu thực hiện nhiệm vụ)
                    </span>
                  </label>
                </div>
              </div>

              {/* Section 4: Live Card Preview */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-700 space-y-2">
                <span className="text-[11px] font-black uppercase text-slate-400">
                  Xem trước thẻ nhiệm vụ độc giả:
                </span>
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h5 className="font-black text-sm text-slate-800 dark:text-white">
                        {form.title || 'Tên nhiệm vụ mẫu'}
                      </h5>
                      <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                        {form.description || 'Mô tả điều kiện nhiệm vụ...'}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-blue-100 text-blue-800 uppercase">
                      {form.period === 'DAILY' ? 'Hằng Ngày' : 'Thành Tựu'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200 dark:border-slate-700">
                    <div className="font-black text-amber-600">
                      +{form.rewardPotato} Khoai · +{form.rewardXp} XP
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Mục tiêu: {form.targetValue} {CONDITIONS_MAP[form.condition]?.unit}
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-white font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-sm shadow-blue-500/25 flex items-center gap-2 transition cursor-pointer"
                >
                  <i className={`fa-solid ${saving ? 'fa-spinner fa-spin' : 'fa-check'}`}></i>
                  <span>{saving ? 'Đang lưu…' : 'Lưu Nhiệm Vụ'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
