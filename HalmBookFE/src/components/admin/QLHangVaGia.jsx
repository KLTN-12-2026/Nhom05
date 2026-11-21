import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLegacyAdminPage } from './legacy-runtime';
import { getAdminCommercePolicy, saveCommercePolicy } from '@/services/commercePolicyService';
import { confirmDialog } from '@/components/common/CustomConfirmModal';

const PRESET_ICONS = [
  { icon: '🌱', label: 'Thợ Cày (Mầm Non)' },
  { icon: '🚜', label: 'Cao Thủ Cày (Nông Dân)' },
  { icon: '🌾', label: 'Lão Nông (Mùa Vàng)' },
  { icon: '👑', label: 'Đại Điền Chủ (Hoàng Gia)' },
  { icon: '🥉', label: 'Hạng Đồng' },
  { icon: '🥈', label: 'Hạng Bạc' },
  { icon: '🥇', label: 'Hạng Vàng' },
  { icon: '💎', label: 'Kim Cương' },
  { icon: '⭐', label: 'Tinh Anh' },
  { icon: '🏆', label: 'Quán Quân' },
  { icon: '📚', label: 'Học Giả' },
  { icon: '🚀', label: 'Tiên Phong' },
];

const SUGGESTED_BENEFITS = [
  'Giảm phí thuê toàn bộ kho sách',
  'Tặng huy hiệu vinh danh độc quyền',
  'Nhân đôi điểm kinh nghiệm (XP) cuối tuần',
  'Ưu tiên kết nối hỗ trợ kỹ thuật 24/7',
  'Đọc thử không giới hạn số chương',
  'Miễn phí tham gia sự kiện ra mắt sách mới',
  'Nhận quà tri ân đặc biệt vào ngày sinh nhật',
];

const EMPTY_TIER_FORM = {
  tierId: 0,
  rankOrder: 1,
  tierName: '',
  badgeIcon: '🌱',
  minBooksRequired: 0,
  minPotatoRequired: 0,
  discountPercent: 0,
  upgradeReward: 0,
  description: '',
  benefits: [],
};

/**
 * Hiển thị biểu tượng cấp bậc an toàn:
 * Hỗ trợ Emoji, Phosphor icon (ph-*), FontAwesome (fa-*), ngăn chặn hiển thị text class thô.
 */
function renderTierIcon(iconStr, className = '') {
  if (!iconStr) return <span className={className}>🌱</span>;
  const s = String(iconStr).trim();
  if (s.startsWith('ph-')) {
    return <i className={`ph-bold ${s} ${className}`} />;
  }
  if (s.startsWith('fa-')) {
    return <i className={`${s} ${className}`} />;
  }
  return <span className={className}>{s}</span>;
}

export default function QLHangVaGia() {
  useLegacyAdminPage('QuanLyHangVaGia.html', null, false);

  const [policy, setPolicy] = useState(null);
  const [originalPolicy, setOriginalPolicy] = useState(null);
  const [activeTab, setActiveTab] = useState('tiers'); // 'tiers' | 'rules'
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);

  // Modal State cho Thêm / Chỉnh Sửa Hạng Thành Viên
  const [isTierModalOpen, setIsTierModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [editingTierIndex, setEditingTierIndex] = useState(-1);
  const [tierForm, setTierForm] = useState(EMPTY_TIER_FORM);
  const [newBenefitInput, setNewBenefitInput] = useState('');

  // Toast notification state
  const [toast, setToast] = useState({ message: '', type: 'info' });
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: 'info' }), 4000);
  };

  // Nạp dữ liệu cấu hình từ Backend API
  const load = useCallback(async () => {
    try {
      const data = await getAdminCommercePolicy();
      if (data && Array.isArray(data.tiers)) {
        // Khử trùng lặp cấp bậc theo thứ hạng (rankOrder)
        const sorted = [...data.tiers].sort((a, b) => (a.rankOrder || 1) - (b.rankOrder || 1));
        const seenRanks = new Set();
        const uniqueTiers = [];

        for (const t of sorted) {
          const rank = t.rankOrder || 1;
          if (!seenRanks.has(rank)) {
            seenRanks.add(rank);
            uniqueTiers.push({
              ...t,
              badgeIcon: t.badgeIcon || '🌱',
              benefits: Array.isArray(t.benefits) ? t.benefits : [],
            });
          }
        }
        data.tiers = uniqueTiers;
      }

      setPolicy(data);
      setOriginalPolicy(JSON.parse(JSON.stringify(data)));
      setError('');
    } catch (e) {
      const msg = e?.response?.data?.message || 'Không thể tải danh sách hạng thành viên từ máy chủ.';
      setError(msg);
      showToast(msg, 'danger');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Kiểm tra xem có thay đổi chưa lưu hay không
  const isDirty = useMemo(() => {
    if (!policy || !originalPolicy) return false;
    return JSON.stringify(policy.tiers) !== JSON.stringify(originalPolicy.tiers);
  }, [policy, originalPolicy]);

  // Mở modal thêm hạng thành viên mới
  const openCreateTierModal = () => {
    const currentTiers = policy?.tiers || [];
    const lastTier = currentTiers[currentTiers.length - 1];
    const nextRank = currentTiers.length + 1;

    setModalMode('create');
    setEditingTierIndex(-1);
    setTierForm({
      tierId: 0,
      rankOrder: nextRank,
      tierName: '',
      badgeIcon: '⭐',
      minBooksRequired: (lastTier?.minBooksRequired ?? 0) + 20,
      minPotatoRequired: (lastTier?.minPotatoRequired ?? 0) + 2000,
      discountPercent: Math.min(100, (lastTier?.discountPercent ?? 0) + 5),
      upgradeReward: 50,
      description: `Đặc quyền dành riêng cho hội viên đạt Cấp ${nextRank}.`,
      benefits: ['Ưu đãi giảm phí thuê sách độc quyền', 'Huy hiệu vinh danh hồ sơ'],
    });
    setNewBenefitInput('');
    setIsTierModalOpen(true);
  };

  // Mở modal chỉnh sửa hạng thành viên
  const openEditTierModal = (index) => {
    if (!policy?.tiers?.[index]) return;
    const targetTier = policy.tiers[index];
    setModalMode('edit');
    setEditingTierIndex(index);
    setTierForm({
      tierId: targetTier.tierId || 0,
      rankOrder: targetTier.rankOrder || index + 1,
      tierName: targetTier.tierName || '',
      badgeIcon: targetTier.badgeIcon || '🌱',
      minBooksRequired: targetTier.minBooksRequired ?? 0,
      minPotatoRequired: targetTier.minPotatoRequired ?? 0,
      discountPercent: targetTier.discountPercent ?? 0,
      upgradeReward: targetTier.upgradeReward ?? 0,
      description: targetTier.description || '',
      benefits: Array.isArray(targetTier.benefits) ? [...targetTier.benefits] : [],
    });
    setNewBenefitInput('');
    setIsTierModalOpen(true);
  };

  // Đóng modal
  const closeTierModal = () => {
    setIsTierModalOpen(false);
    setTierForm(EMPTY_TIER_FORM);
    setEditingTierIndex(-1);
    setNewBenefitInput('');
  };

  // Thêm quyền lợi trong modal form
  const handleAddBenefitInModal = (text) => {
    const val = (text || newBenefitInput).trim();
    if (!val) return;
    if ((tierForm.benefits || []).length >= 20) {
      showToast('Tối đa 20 quyền lợi cho mỗi hạng.', 'warning');
      return;
    }
    setTierForm((prev) => ({
      ...prev,
      benefits: [...(prev.benefits || []), val],
    }));
    setNewBenefitInput('');
  };

  // Xóa quyền lợi trong modal form
  const handleRemoveBenefitInModal = (bIdx) => {
    setTierForm((prev) => ({
      ...prev,
      benefits: (prev.benefits || []).filter((_, idx) => idx !== bIdx),
    }));
  };

  // Lưu thông tin từ Modal vào danh sách Tiers trong State
  const handleSaveTierFromModal = (e) => {
    e.preventDefault();

    if (!tierForm.tierName.trim()) {
      showToast('Vui lòng nhập tên hạng thành viên.', 'warning');
      return;
    }

    setPolicy((prev) => {
      if (!prev) return prev;
      let nextTiers = [...prev.tiers];

      if (modalMode === 'create') {
        const newTier = {
          ...tierForm,
          tierName: tierForm.tierName.trim(),
          badgeIcon: tierForm.badgeIcon || '🌱',
          rankOrder: nextTiers.length + 1,
        };
        nextTiers.push(newTier);
      } else if (modalMode === 'edit' && editingTierIndex >= 0) {
        nextTiers[editingTierIndex] = {
          ...nextTiers[editingTierIndex],
          ...tierForm,
          tierName: tierForm.tierName.trim(),
          badgeIcon: tierForm.badgeIcon || '🌱',
        };
      }

      // Chuẩn hóa lại rankOrder 1..N
      nextTiers = nextTiers.map((t, idx) => ({ ...t, rankOrder: idx + 1 }));

      return { ...prev, tiers: nextTiers };
    });

    showToast(
      modalMode === 'create'
        ? `Đã thêm hạng "${tierForm.tierName}". Hãy nhấn 'Lưu thay đổi' để hoàn tất.`
        : `Đã cập nhật hạng "${tierForm.tierName}". Hãy nhấn 'Lưu thay đổi' để hoàn tất.`,
      'success'
    );
    closeTierModal();
  };

  // Xóa một hạng thành viên
  const handleDeleteTier = async (tierIndex) => {
    if (!policy?.tiers?.[tierIndex]) return;
    const tierToDelete = policy.tiers[tierIndex];

    if (tierIndex === 0) {
      showToast('Không thể xóa Cấp 1 vì đây là cấp bậc mặc định của mọi độc giả mới!', 'warning');
      return;
    }

    const confirmed = await confirmDialog({
      title: 'Xác Nhận Xóa Hạng Thành Viên',
      message: `Bạn có chắc chắn muốn xóa hạng "${tierToDelete.tierName}" (Cấp ${tierToDelete.rankOrder})? Khi bạn lưu thay đổi, tất cả độc giả đang ở hạng này sẽ được tự động điều chuyển về hạng khởi đầu để bảo toàn tài khoản.`,
      confirmText: 'Xóa hạng này',
      cancelText: 'Hủy bỏ',
      type: 'danger',
    });

    if (!confirmed) return;

    setPolicy((prev) => {
      if (!prev) return prev;
      const remainingTiers = prev.tiers
        .filter((_, idx) => idx !== tierIndex)
        .map((t, idx) => ({ ...t, rankOrder: idx + 1 }));
      return { ...prev, tiers: remainingTiers };
    });

    showToast(
      `Đã xóa hạng "${tierToDelete.tierName}". Hãy nhấn 'Lưu thay đổi' để lưu vào máy chủ.`,
      'info'
    );
  };

  // Kiểm tra tính hợp lệ dữ liệu hạng trước khi lưu (Client-side validation)
  const validationWarnings = useMemo(() => {
    if (!policy?.tiers) return [];
    const warnings = [];
    const sorted = [...policy.tiers].sort((a, b) => a.rankOrder - b.rankOrder);

    let prevBooks = -1;
    let prevXp = -1;

    sorted.forEach((tier, idx) => {
      if (idx === 0) {
        if (tier.minBooksRequired !== 0 || tier.minPotatoRequired !== 0) {
          warnings.push(`Cấp 1 (${tier.tierName}): Hạng khởi đầu bắt buộc ngưỡng sách = 0 và ngưỡng XP = 0.`);
        }
      } else {
        if (tier.minBooksRequired <= prevBooks) {
          warnings.push(`Cấp ${tier.rankOrder} (${tier.tierName}): Ngưỡng sách (${tier.minBooksRequired}) phải lớn hơn cấp trước (${prevBooks} sách).`);
        }
        if (tier.minPotatoRequired <= prevXp) {
          warnings.push(`Cấp ${tier.rankOrder} (${tier.tierName}): Ngưỡng XP (${tier.minPotatoRequired}) phải lớn hơn cấp trước (${prevXp} XP).`);
        }
      }
      prevBooks = tier.minBooksRequired;
      prevXp = tier.minPotatoRequired;

      if (tier.discountPercent < 0 || tier.discountPercent > 100) {
        warnings.push(`Cấp ${tier.rankOrder} (${tier.tierName}): Mức giảm phí thuê phải từ 0% đến 100%.`);
      }
      if (!tier.tierName || !tier.tierName.trim()) {
        warnings.push(`Cấp ${tier.rankOrder}: Tên hạng không được để trống.`);
      }
    });

    return warnings;
  }, [policy]);

  // Lưu hạng thành viên lên máy chủ
  const save = async (event) => {
    if (event) event.preventDefault();
    if (pending.current) return;

    if (validationWarnings.length > 0) {
      showToast('Vui lòng điều chỉnh các lỗi cấu hình trước khi lưu!', 'warning');
      return;
    }

    const confirmed = await confirmDialog({
      title: 'Lưu Cấu Hình Hạng Thành Viên',
      message: 'Bạn có chắc chắn muốn áp dụng bảng hạng thành viên mới này? Mọi độc giả và giao dịch trên App và Web sẽ được áp dụng cấu hình này ngay lập tức.',
      confirmText: 'Lưu thay đổi',
      cancelText: 'Xem lại',
      type: 'info',
    });

    if (!confirmed) return;

    pending.current = true;
    setBusy(true);
    setNotice('');
    setError('');

    try {
      const payload = {
        revision: policy.revision,
        plans: policy.plans || [],
        tiers: policy.tiers,
      };
      const savedPolicy = await saveCommercePolicy(payload);
      if (savedPolicy && Array.isArray(savedPolicy.tiers)) {
        const sorted = [...savedPolicy.tiers].sort((a, b) => (a.rankOrder || 1) - (b.rankOrder || 1));
        const seen = new Set();
        const clean = [];
        for (const t of sorted) {
          const rank = t.rankOrder || 1;
          if (!seen.has(rank)) {
            seen.add(rank);
            clean.push({
              ...t,
              badgeIcon: t.badgeIcon || '🌱',
              benefits: Array.isArray(t.benefits) ? t.benefits : [],
            });
          }
        }
        savedPolicy.tiers = clean;
      }
      setPolicy(savedPolicy);
      setOriginalPolicy(JSON.parse(JSON.stringify(savedPolicy)));
      const successMsg = `Đã lưu danh sách hạng thành viên thành công (Phiên bản ${savedPolicy.revision}).`;
      setNotice(successMsg);
      showToast(successMsg, 'success');
    } catch (e) {
      const errorMsg = e?.response?.data?.message || 'Không thể lưu cấu hình hạng thành viên. Vui lòng thử lại.';
      setError(errorMsg);
      showToast(errorMsg, 'danger');
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };

  // Hoàn tác các chỉnh sửa chưa lưu
  const handleRevert = async () => {
    if (!isDirty) return;
    const confirmed = await confirmDialog({
      title: 'Hủy Các Thay Đổi Chưa Lưu',
      message: 'Bạn có chắc chắn muốn hoàn tác tất cả các chỉnh sửa và khôi phục lại dữ liệu ban đầu từ máy chủ?',
      confirmText: 'Khôi phục',
      cancelText: 'Giữ lại chỉnh sửa',
      type: 'warning',
    });
    if (confirmed && originalPolicy) {
      setPolicy(JSON.parse(JSON.stringify(originalPolicy)));
      showToast('Đã khôi phục lại cấu hình ban đầu.', 'info');
    }
  };

  // Tải lại dữ liệu từ Server
  const handleReload = async () => {
    if (isDirty) {
      const confirmed = await confirmDialog({
        title: 'Tải Lại Dữ Liệu Từ Máy Chủ',
        message: 'Bạn có các thay đổi chưa lưu. Việc tải lại sẽ ghi đè các chỉnh sửa này bằng dữ liệu mới nhất trên máy chủ. Bạn có muốn tiếp tục?',
        confirmText: 'Tải lại',
        cancelText: 'Hủy',
        type: 'warning',
      });
      if (!confirmed) return;
    }
    await load();
    showToast('Đã làm mới dữ liệu hạng thành viên từ máy chủ.', 'info');
  };

  // Thống kê nhanh
  const maxDiscount = useMemo(() => {
    if (!policy?.tiers?.length) return 0;
    return Math.max(...policy.tiers.map((t) => Number(t.discountPercent) || 0));
  }, [policy]);

  const maxUpgradeReward = useMemo(() => {
    if (!policy?.tiers?.length) return 0;
    return Math.max(...policy.tiers.map((t) => Number(t.upgradeReward) || 0));
  }, [policy]);

  return (
    <div className="admin-page-root">
      {/* Shared Sidebar */}
      <div id="admin-sidebar-container"></div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-gray-950 overflow-hidden font-sans">
        {/* Shared Header */}
        <div
          id="admin-header-container"
          data-title="Quản Lý Hạng Thành Viên"
          data-subtitle="Hệ thống cấp bậc độc giả, điều kiện thăng hạng và chính sách chiết khấu ưu đãi trên toàn hệ thống"
        ></div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 space-y-6">
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
            {/* Card 1: Tổng Cấp Bậc */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                  Cấp Bậc Hội Viên
                </p>
                <h4 className="text-2xl font-black text-slate-800 dark:text-white mt-1">
                  {!policy ? '...' : `${policy.tiers?.length || 0} Cấp bậc`}
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Tiến trình thăng hạng liên tục</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xl border border-blue-200 dark:border-blue-800 shadow-inner">
                <i className="fa-solid fa-ranking-star"></i>
              </div>
            </div>

            {/* Card 2: Chiết Khấu Tối Đa */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider">
                  Ưu Đãi Thuê Tối Đa
                </p>
                <h4 className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
                  {!policy ? '...' : `Giảm ${maxDiscount}%`}
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Áp dụng cho hạng cao nhất</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xl border border-amber-200 dark:border-amber-800 shadow-inner">
                <i className="fa-solid fa-percent"></i>
              </div>
            </div>

            {/* Card 3: Thưởng Thăng Cấp Cao Nhất */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider">
                  Thưởng Thăng Cấp Lớn Nhất
                </p>
                <h4 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                  {!policy ? '...' : `+${maxUpgradeReward.toLocaleString('vi-VN')} 🥔`}
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Tặng ngay khi lên hạng mới</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl border border-emerald-200 dark:border-emerald-800 shadow-inner">
                <i className="fa-solid fa-gift"></i>
              </div>
            </div>

            {/* Card 4: Phiên Bản Chính Sách */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">
                  Phiên Bản Chính Sách
                </p>
                <h4 className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
                  {!policy ? '...' : `Rev #${policy.revision}`}
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[130px]" title={policy?.updatedAt ? new Date(policy.updatedAt).toLocaleString('vi-VN') : ''}>
                  {policy?.updatedAt ? new Date(policy.updatedAt).toLocaleDateString('vi-VN') : 'Mới cập nhật'}
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xl border border-indigo-200 dark:border-indigo-800 shadow-inner">
                <i className="fa-solid fa-shield-halved"></i>
              </div>
            </div>
          </div>

          {/* Action Bar & Control Buttons */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Tab Navigation Filter */}
            <div className="flex items-center gap-2 flex-wrap">
              {[
                {
                  key: 'tiers',
                  label: 'Danh Sách Hạng Thành Viên',
                  icon: 'fa-crown',
                  count: policy?.tiers?.length || 0,
                },
                {
                  key: 'rules',
                  label: 'Cơ Chế & Quy Tắc Vận Hành',
                  icon: 'fa-circle-info',
                  count: null,
                },
              ].map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setActiveTab(t.key)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
                    activeTab === t.key
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                      : 'bg-slate-50 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <i className={`fa-solid ${t.icon} text-xs`}></i>
                  <span>{t.label}</span>
                  {t.count !== null && (
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                        activeTab === t.key
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {t.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Right Buttons: Revert, Reload, Save */}
            <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
              {isDirty && (
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                  <span>Có thay đổi chưa lưu</span>
                </div>
              )}

              {isDirty && (
                <button
                  type="button"
                  onClick={handleRevert}
                  disabled={busy}
                  className="px-3.5 py-2 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-white font-bold rounded-xl text-xs border border-slate-200 dark:border-slate-600 shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                  title="Hủy bỏ các sửa đổi chưa lưu"
                >
                  <i className="fa-solid fa-rotate-left text-xs"></i>
                  <span>Hoàn tác</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleReload}
                disabled={busy}
                className="px-3.5 py-2 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-white font-bold rounded-xl text-xs border border-slate-200 dark:border-slate-600 shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <i className={`fa-solid fa-arrows-rotate text-xs ${busy ? 'animate-spin' : ''}`}></i>
                <span>Làm mới</span>
              </button>

              <button
                type="button"
                onClick={save}
                disabled={busy || !policy || !isDirty || validationWarnings.length > 0}
                className={`px-4 py-2 font-black rounded-xl text-xs shadow-sm flex items-center gap-2 transition cursor-pointer ${
                  !isDirty || validationWarnings.length > 0
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25'
                }`}
              >
                <i className={`fa-solid ${busy ? 'fa-spinner fa-spin' : 'fa-floppy-disk'} text-xs`}></i>
                <span>{busy ? 'Đang lưu…' : 'Lưu thay đổi'}</span>
              </button>
            </div>
          </div>

          {/* Validation Warnings Notice */}
          {validationWarnings.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs md:text-sm space-y-1.5">
              <div className="font-black flex items-center gap-2 text-amber-800">
                <i className="fa-solid fa-triangle-exclamation text-base"></i>
                <span>Cần điều chỉnh các tiêu chuẩn sau trước khi lưu:</span>
              </div>
              <ul className="list-disc list-inside space-y-1 pl-2 text-amber-800/90 font-medium">
                {validationWarnings.map((warn, i) => (
                  <li key={i}>{warn}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Loading Indicator */}
          {!policy && !error && (
            <div className="bg-white dark:bg-slate-800 p-12 rounded-2xl border border-slate-200 dark:border-slate-700 text-center space-y-3">
              <i className="fa-solid fa-circle-notch fa-spin text-3xl text-blue-600"></i>
              <p className="text-sm font-bold text-slate-600 dark:text-slate-300">Đang tải danh sách hạng thành viên...</p>
            </div>
          )}

          {/* ========================================================
             TAB 1: QUẢN LÝ HẠNG THÀNH VIÊN
             ======================================================== */}
          {policy && activeTab === 'tiers' && (
            <div className="space-y-6">
              {/* Top Banner & Add Button */}
              <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-black text-sm md:text-base text-slate-800 dark:text-white flex items-center gap-2">
                    <i className="fa-solid fa-crown text-amber-500"></i>
                    <span>Danh Sách Cấp Bậc Hội Viên ({policy.tiers.length} hạng)</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Hệ thống tự động xét duyệt và thăng hạng dựa trên Sách đã đọc hoặc Điểm cày XP
                  </p>
                </div>

                <button
                  type="button"
                  onClick={openCreateTierModal}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-xs shadow-sm shadow-blue-500/20 flex items-center justify-center gap-1.5 transition cursor-pointer shrink-0"
                >
                  <i className="fa-solid fa-plus text-xs"></i>
                  <span>Thêm Hạng Mới</span>
                </button>
              </div>

              {/* Visual Progression Stepper */}
              <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <i className="fa-solid fa-route text-blue-600"></i>
                    <span>Lộ Trình Thăng Cấp Thành Viên</span>
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    Bảo lưu hạng vĩnh viễn khi đạt ngưỡng
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                  {policy.tiers.map((tier) => (
                    <div
                      key={tier.tierId || tier.rankOrder}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/40 flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-xl text-amber-600 shrink-0">
                          {renderTierIcon(tier.badgeIcon, 'text-xl')}
                        </div>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-blue-100 text-blue-800 border border-blue-200">
                          Cấp {tier.rankOrder}
                        </span>
                      </div>
                      <div>
                        <h5 className="font-black text-sm text-slate-800 dark:text-white truncate">
                          {tier.tierName}
                        </h5>
                        <p className="text-xs text-amber-600 font-black mt-0.5">
                          Giảm {tier.discountPercent}% phí thuê
                        </p>
                      </div>
                      <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 space-y-0.5">
                        <div className="flex justify-between">
                          <span>Ngưỡng sách:</span>
                          <span className="font-bold text-slate-700 dark:text-slate-300">
                            {tier.minBooksRequired.toLocaleString('vi-VN')} cuốn
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Ngưỡng XP:</span>
                          <span className="font-bold text-slate-700 dark:text-slate-300">
                            {tier.minPotatoRequired.toLocaleString('vi-VN')} XP
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tiers Management Data Table */}
              <div className="w-full overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xs">
                <table className="w-full text-left text-xs md:text-sm table-fixed">
                  <colgroup>
                    <col className="w-[10%]" />
                    <col className="w-[28%]" />
                    <col className="w-[17%]" />
                    <col className="w-[11%]" />
                    <col className="w-[13%]" />
                    <col className="w-[13%]" />
                    <col className="w-[8%]" />
                  </colgroup>
                  <thead className="bg-slate-50 dark:bg-slate-700/60 uppercase text-[11px] font-black text-slate-500 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="p-3.5 text-center">Cấp Bậc</th>
                      <th className="p-3.5">Tên Hạng & Biểu Tượng</th>
                      <th className="p-3.5">Ngưỡng Thăng Hạng</th>
                      <th className="p-3.5 text-center">Chiết Khấu</th>
                      <th className="p-3.5 text-center">Thưởng Thăng Cấp</th>
                      <th className="p-3.5">Quyền Lợi Bổ Sung</th>
                      <th className="p-3.5 text-center">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-slate-800 dark:text-white">
                    {policy.tiers.map((tier, index) => {
                      const isBaseTier = index === 0;

                      return (
                        <tr
                          key={tier.tierId || tier.rankOrder}
                          className="hover:bg-blue-50/30 dark:hover:bg-slate-700/40 transition"
                        >
                          {/* Rank Order Badge */}
                          <td className="p-3.5 text-center">
                            <span className="inline-block px-2.5 py-1 rounded-xl text-xs font-black uppercase bg-blue-100 text-blue-800 border border-blue-200">
                              Cấp {tier.rankOrder}
                            </span>
                          </td>

                          {/* Tier Name & Badge Icon */}
                          <td className="p-3.5">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-xl text-amber-600 shadow-xs shrink-0">
                                {renderTierIcon(tier.badgeIcon, 'text-xl')}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="font-extrabold text-sm text-slate-800 dark:text-white truncate">
                                  {tier.tierName}
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2 leading-relaxed" title={tier.description}>
                                  {tier.description || 'Chưa có mô tả'}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Requirements */}
                          <td className="p-3.5">
                            {isBaseTier ? (
                              <span className="inline-block text-xs font-bold text-slate-600 bg-slate-100 dark:bg-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-600">
                                Khởi đầu (0 sách · 0 XP)
                              </span>
                            ) : (
                              <div className="space-y-0.5 text-xs">
                                <div>
                                  <span className="text-slate-400 font-medium">Sách:</span>{' '}
                                  <b className="text-slate-700 dark:text-slate-200">
                                    ≥ {tier.minBooksRequired.toLocaleString('vi-VN')} cuốn
                                  </b>
                                </div>
                                <div>
                                  <span className="text-slate-400 font-medium">Điểm:</span>{' '}
                                  <b className="text-slate-700 dark:text-slate-200">
                                    ≥ {tier.minPotatoRequired.toLocaleString('vi-VN')} XP
                                  </b>
                                </div>
                              </div>
                            )}
                          </td>

                          {/* Discount Percent */}
                          <td className="p-3.5 text-center">
                            <span className="inline-block px-3 py-1 rounded-xl text-xs font-black bg-amber-100 text-amber-900 border border-amber-200">
                              Giảm {tier.discountPercent}%
                            </span>
                          </td>

                          {/* Upgrade Reward */}
                          <td className="p-3.5 text-center">
                            {tier.upgradeReward > 0 ? (
                              <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                                <span>+{tier.upgradeReward.toLocaleString('vi-VN')}</span>
                                <span>🥔 Khoai</span>
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400 font-bold">—</span>
                            )}
                          </td>

                          {/* Benefits Summary */}
                          <td className="p-3.5">
                            <div className="space-y-1">
                              {(tier.benefits || []).slice(0, 2).map((b, bIdx) => (
                                <div
                                  key={bIdx}
                                  className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 truncate"
                                  title={b}
                                >
                                  ✓ {b}
                                </div>
                              ))}
                              {(tier.benefits || []).length > 2 && (
                                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-800 inline-block">
                                  +{tier.benefits.length - 2} đặc quyền
                                </span>
                              )}
                              {(!tier.benefits || tier.benefits.length === 0) && (
                                <span className="text-slate-400 text-xs italic">Chưa có đặc quyền</span>
                              )}
                            </div>
                          </td>

                          {/* Actions: Edit & Delete */}
                          <td className="p-3.5 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => openEditTierModal(index)}
                                className="px-2.5 py-1.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-bold rounded-xl text-xs border border-slate-200 transition flex items-center gap-1 cursor-pointer"
                                title="Chỉnh sửa thông tin hạng"
                              >
                                <i className="fa-solid fa-pen-to-square text-xs"></i>
                                <span>Sửa</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteTier(index)}
                                disabled={isBaseTier}
                                className={`px-2 py-1.5 font-bold rounded-xl text-xs border transition flex items-center gap-1 ${
                                  isBaseTier
                                    ? 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed'
                                    : 'bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border-slate-200 cursor-pointer'
                                }`}
                                title={isBaseTier ? 'Không thể xóa hạng khởi đầu Cấp 1' : 'Xóa hạng thành viên này'}
                              >
                                <i className="fa-solid fa-trash-can text-xs"></i>
                                <span>Xóa</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================
             TAB 2: CƠ CHẾ VẬN HÀNH & NGUYÊN TẮC QUẢN LÝ
             ======================================================== */}
          {activeTab === 'rules' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Card 1: Cơ chế thăng hạng & bảo lưu */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-lg border border-amber-200">
                    <i className="fa-solid fa-trophy"></i>
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-slate-800 dark:text-white">
                      Cơ Chế Bảo Lưu Hạng Vĩnh Viễn
                    </h4>
                    <p className="text-xs text-slate-400">Không bị tụt hạng khi tiêu dùng Khoai</p>
                  </div>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Cấp bậc hội viên của độc giả được tính dựa trên <b>Điểm tích lũy trọn đời (Lifetime XP)</b> hoặc <b>Số lượng sách đã đọc</b>. Khi độc giả chi tiêu Khoai Tây để thuê sách, hạng thành viên <b>hoàn toàn không bị trừ hay tụt hạng</b>, giúp độc giả yên tâm giao dịch và gắn bó lâu dài cùng nền tảng.
                </p>
              </div>

              {/* Card 2: Kiểm soát đồng bộ */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg border border-blue-200">
                    <i className="fa-solid fa-sync"></i>
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-slate-800 dark:text-white">
                      Đồng Bộ Tức Thì Toàn Hệ Thống
                    </h4>
                    <p className="text-xs text-slate-400">Áp dụng trực tiếp vào Web và Mobile App</p>
                  </div>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Mọi thay đổi về tên hạng, biểu tượng, tỷ lệ chiết khấu (%) và quà thưởng Khoai khi lên cấp sẽ được đồng bộ tức thì với các module giao dịch, giỏ hàng, bảng quyền lợi và trang cá nhân của độc giả.
                </p>
              </div>

              {/* Card 3: Thưởng nâng hạng */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg border border-emerald-200">
                    <i className="fa-solid fa-gift"></i>
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-slate-800 dark:text-white">
                      Tự Động Cộng Khoai Thưởng Thăng Hạng
                    </h4>
                    <p className="text-xs text-slate-400">Cộng trực tiếp vào ví độc giả</p>
                  </div>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Khi độc giả đạt đủ mốc số sách hoặc điểm XP yêu cầu, hệ thống tự động thăng cấp và gửi thông báo chúc mừng kèm số lượng Khoai thưởng tương ứng vào tài khoản của độc giả.
                </p>
              </div>

              {/* Card 4: Nguyên tắc cấu hình hợp lệ */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-lg border border-purple-200">
                    <i className="fa-solid fa-shield-halved"></i>
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-slate-800 dark:text-white">
                      Nguyên Tắc Cấu Hình Bắt Buộc
                    </h4>
                    <p className="text-xs text-slate-400">Quy tắc chuẩn để bảo vệ hệ thống</p>
                  </div>
                </div>
                <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 list-disc list-inside">
                  <li>Cấp 1 (Hạng khởi đầu): Bắt buộc ngưỡng sách = 0 và ngưỡng XP = 0.</li>
                  <li>Các cấp bậc tiếp theo: Ngưỡng sách và ngưỡng XP phải tăng dần nghiêm ngặt.</li>
                  <li>Tỷ lệ giảm phí thuê sách nằm trong khoảng từ 0% đến 100%.</li>
                  <li>Không được để trống tên hạng thành viên.</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ========================================================
         MODAL: THÊM / CHỈNH SỬA HẠNG THÀNH VIÊN
         ======================================================== */}
      {isTierModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl max-w-2xl w-full max-h-[88vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-3.5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xl border border-amber-200">
                  {renderTierIcon(tierForm.badgeIcon, 'text-xl')}
                </div>
                <div>
                  <h3 className="font-black text-base md:text-lg text-slate-800 dark:text-white">
                    {modalMode === 'create'
                      ? 'Thêm Hạng Thành Viên Mới'
                      : `Chỉnh Sửa Hạng: ${tierForm.tierName || `Cấp ${tierForm.rankOrder}`}`}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {modalMode === 'create'
                      ? `Cấp bậc mới sẽ được đặt ở Cấp ${tierForm.rankOrder}`
                      : `Cấp bậc ${tierForm.rankOrder} · ID #${tierForm.tierId || 'Mới'}`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeTierModal}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
              >
                <i className="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>

            {/* Modal Form Body */}
            <form
              onSubmit={handleSaveTierFromModal}
              className="flex-1 overflow-y-auto p-5 space-y-4 text-xs md:text-sm"
              style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 transparent' }}
            >
              {/* Nhóm 1: Nhận diện & Biểu tượng */}
              <div className="space-y-2.5">
                <h4 className="font-black text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <i className="fa-solid fa-id-card text-blue-600"></i>
                  <span>Nhận Diện Cấp Bậc</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="font-black text-slate-700 dark:text-slate-300">
                      Tên Hạng Thành Viên <span className="text-rose-500">*</span>
                    </label>
                    <input
                      required
                      maxLength={100}
                      value={tierForm.tierName}
                      onChange={(e) => setTierForm({ ...tierForm, tierName: e.target.value })}
                      placeholder="VD: Hội Viên Vàng, Đại Điền Chủ..."
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white font-bold outline-none focus:border-blue-500 transition"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-black text-slate-700 dark:text-slate-300">
                      Biểu Tượng (Badge)
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-xl text-amber-600 shrink-0">
                        {renderTierIcon(tierForm.badgeIcon, 'text-xl')}
                      </div>
                      <input
                        maxLength={100}
                        value={tierForm.badgeIcon || ''}
                        onChange={(e) => setTierForm({ ...tierForm, badgeIcon: e.target.value })}
                        placeholder="Emoji/Icon"
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-center text-sm font-bold outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Preset Icon Chips */}
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  <span className="text-[11px] text-slate-400 font-bold mr-1">Chọn nhanh:</span>
                  {PRESET_ICONS.map((p) => (
                    <button
                      key={p.icon}
                      type="button"
                      onClick={() => setTierForm({ ...tierForm, badgeIcon: p.icon })}
                      title={p.label}
                      className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center border transition cursor-pointer ${
                        tierForm.badgeIcon === p.icon
                          ? 'bg-blue-100 border-blue-400 scale-110 shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 border-slate-200'
                      }`}
                    >
                      {p.icon}
                    </button>
                  ))}
                </div>

                <div className="space-y-1 pt-0.5">
                  <label className="font-black text-slate-700 dark:text-slate-300">
                    Mô Tả Cấp Bậc (Hiển thị cho độc giả)
                  </label>
                  <textarea
                    maxLength={255}
                    rows={2}
                    value={tierForm.description || ''}
                    onChange={(e) => setTierForm({ ...tierForm, description: e.target.value })}
                    placeholder="Mô tả tiêu chuẩn và ý nghĩa của cấp bậc này..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white outline-none focus:border-blue-500 transition resize-none leading-relaxed"
                  />
                </div>
              </div>

              {/* Nhóm 2: Điều kiện thăng hạng */}
              <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-700">
                <h4 className="font-black text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <i className="fa-solid fa-sliders text-emerald-600"></i>
                  <span>Điều Kiện Thăng Hạng</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="font-black text-slate-700 dark:text-slate-300">
                        Ngưỡng Sách Đã Đọc <span className="text-rose-500">*</span>
                      </label>
                      {tierForm.rankOrder === 1 && (
                        <span className="text-[10px] text-slate-400 font-bold">(Cố định 0)</span>
                      )}
                    </div>
                    <input
                      required
                      type="number"
                      min="0"
                      max="1000000"
                      step="1"
                      disabled={tierForm.rankOrder === 1}
                      value={tierForm.minBooksRequired}
                      onChange={(e) =>
                        setTierForm({
                          ...tierForm,
                          minBooksRequired: Math.max(0, parseInt(e.target.value, 10) || 0),
                        })
                      }
                      className={`w-full px-3.5 py-2 rounded-xl border font-bold outline-none ${
                        tierForm.rankOrder === 1
                          ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                          : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white'
                      }`}
                    />
                    <p className="text-[11px] text-slate-400">
                      {tierForm.rankOrder === 1
                        ? 'Cấp bậc khởi đầu luôn bắt đầu từ 0 sách'
                        : 'Số sách thuê có quyền đọc cần đạt để lên hạng'}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="font-black text-slate-700 dark:text-slate-300">
                        Ngưỡng Điểm Tích Lũy (XP) <span className="text-rose-500">*</span>
                      </label>
                      {tierForm.rankOrder === 1 && (
                        <span className="text-[10px] text-slate-400 font-bold">(Cố định 0)</span>
                      )}
                    </div>
                    <input
                      required
                      type="number"
                      min="0"
                      max="100000000"
                      step="1"
                      disabled={tierForm.rankOrder === 1}
                      value={tierForm.minPotatoRequired}
                      onChange={(e) =>
                        setTierForm({
                          ...tierForm,
                          minPotatoRequired: Math.max(0, parseInt(e.target.value, 10) || 0),
                        })
                      }
                      className={`w-full px-3.5 py-2 rounded-xl border font-bold outline-none ${
                        tierForm.rankOrder === 1
                          ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                          : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white'
                      }`}
                    />
                    <p className="text-[11px] text-slate-400">
                      {tierForm.rankOrder === 1
                        ? 'Cấp bậc khởi đầu luôn bắt đầu từ 0 XP'
                        : 'Điểm cày XP trọn đời cần đạt để thăng hạng'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Nhóm 3: Ưu đãi & Quyền lợi */}
              <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-700">
                <h4 className="font-black text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <i className="fa-solid fa-gift text-amber-600"></i>
                  <span>Ưu Đãi & Đặc Quyền Hội Viên</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-black text-slate-700 dark:text-slate-300">
                      Giảm Phí Thuê Sách (%) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        required
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        value={tierForm.discountPercent}
                        onChange={(e) =>
                          setTierForm({
                            ...tierForm,
                            discountPercent: Math.min(100, Math.max(0, parseInt(e.target.value, 10) || 0)),
                          })
                        }
                        className="w-full pl-3.5 pr-8 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white font-bold outline-none focus:border-blue-500"
                      />
                      <span className="absolute right-3 top-2.5 font-black text-slate-400 text-xs">%</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-black text-slate-700 dark:text-slate-300">
                      Khoai Thưởng Thăng Cấp (🥔) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        required
                        type="number"
                        min="0"
                        max="100000"
                        step="1"
                        value={tierForm.upgradeReward}
                        onChange={(e) =>
                          setTierForm({
                            ...tierForm,
                            upgradeReward: Math.max(0, parseInt(e.target.value, 10) || 0),
                          })
                        }
                        className="w-full pl-3.5 pr-8 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white font-bold outline-none focus:border-blue-500"
                      />
                      <span className="absolute right-3 top-2.5 text-xs">🥔</span>
                    </div>
                  </div>
                </div>

                {/* Danh Sách Quyền Lợi Bổ Sung */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="font-black text-slate-700 dark:text-slate-300">
                      Danh Sách Đặc Quyền Bổ Sung ({(tierForm.benefits || []).length} đặc quyền)
                    </label>
                    <span className="text-[10px] text-slate-400">Tối đa 20 quyền lợi</span>
                  </div>

                  {/* List of current benefits */}
                  <div
                    className="space-y-1.5 max-h-32 overflow-y-auto pr-1"
                    style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 transparent' }}
                  >
                    {(tierForm.benefits || []).map((benefit, bIdx) => (
                      <div
                        key={bIdx}
                        className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600"
                      >
                        <i className="fa-solid fa-check text-emerald-600 text-xs shrink-0"></i>
                        <span className="flex-1 text-xs text-slate-800 dark:text-white font-medium">
                          {benefit}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveBenefitInModal(bIdx)}
                          className="text-slate-400 hover:text-rose-600 p-1 transition cursor-pointer"
                          title="Xóa đặc quyền này"
                        >
                          <i className="fa-solid fa-trash-can text-xs"></i>
                        </button>
                      </div>
                    ))}

                    {(!tierForm.benefits || tierForm.benefits.length === 0) && (
                      <p className="text-center py-2 text-xs text-slate-400 italic bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        Chưa có đặc quyền bổ sung nào.
                      </p>
                    )}
                  </div>

                  {/* Add Benefit Input */}
                  <div className="flex gap-2 pt-1">
                    <input
                      value={newBenefitInput}
                      onChange={(e) => setNewBenefitInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddBenefitInModal();
                        }
                      }}
                      placeholder="Nhập đặc quyền mới rồi bấm Thêm..."
                      maxLength={300}
                      className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-xs text-slate-800 dark:text-white outline-none focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddBenefitInModal()}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <i className="fa-solid fa-plus text-[10px]"></i>
                      <span>Thêm</span>
                    </button>
                  </div>

                  {/* Suggestion Chips */}
                  <div className="flex flex-wrap items-center gap-1 pt-1">
                    <span className="text-[10px] text-slate-400 font-bold">Gợi ý:</span>
                    {SUGGESTED_BENEFITS.slice(0, 4).map((sug, sIdx) => (
                      <button
                        key={sIdx}
                        type="button"
                        onClick={() => handleAddBenefitInModal(sug)}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 hover:bg-blue-50 text-slate-600 dark:text-slate-300 hover:text-blue-700 border border-slate-200 dark:border-slate-600 transition cursor-pointer"
                      >
                        + {sug}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Modal Footer Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeTierModal}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-white font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-sm shadow-blue-500/25 flex items-center gap-2 transition cursor-pointer"
                >
                  <i className="fa-solid fa-check text-xs"></i>
                  <span>{modalMode === 'create' ? 'Thêm Hạng Này' : 'Cập Nhật Hạng'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
