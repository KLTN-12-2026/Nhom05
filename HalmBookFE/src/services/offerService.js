/**
 * offerService.js
 * Quản lý dữ liệu cho:
 * 1. Combo Sách Ưu Đãi (Combo Offers)
 * 2. Sách Lẻ Giảm Sâu (Single Book Deals)
 * Kết nối dữ liệu thực tế được quản trị viên cấu hình từ Database, loại bỏ hoàn toàn dữ liệu mẫu tĩnh.
 */

const STORAGE_KEYS = {
  COMBOS: 'halm_offer_combos_v1',
  SINGLE_DEALS: 'halm_offer_single_deals_v1'
};

const notifyOfferChange = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('halm-offers-updated'));
  }
};

// Dọn dẹp triệt để dữ liệu mẫu cũ nếu còn tồn lưu trong localStorage
const purgeLegacyMockData = () => {
  if (typeof window === 'undefined') return;
  try {
    const rawCombos = localStorage.getItem(STORAGE_KEYS.COMBOS);
    if (rawCombos) {
      const parsed = JSON.parse(rawCombos);
      if (Array.isArray(parsed)) {
        const cleaned = parsed.filter(c => !String(c.id).startsWith('combo-default-'));
        localStorage.setItem(STORAGE_KEYS.COMBOS, JSON.stringify(cleaned));
      }
    }
    const rawDeals = localStorage.getItem(STORAGE_KEYS.SINGLE_DEALS);
    if (rawDeals) {
      const parsed = JSON.parse(rawDeals);
      if (Array.isArray(parsed)) {
        const cleaned = parsed.filter(d => !String(d.id).startsWith('deal-default-'));
        localStorage.setItem(STORAGE_KEYS.SINGLE_DEALS, JSON.stringify(cleaned));
      }
    }
  } catch {}
};
purgeLegacyMockData();

// ==========================================
// 1. QUẢN LÝ COMBO SÁCH (COMBO OFFERS)
// ==========================================
export const getCombos = () => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.COMBOS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(c => c && !String(c.id).startsWith('combo-default-'));
  } catch {
    return [];
  }
};

export const saveCombos = (combos) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.COMBOS, JSON.stringify(combos));
  notifyOfferChange();
};

export const addCombo = (comboData) => {
  const current = getCombos();
  const newCombo = {
    id: 'combo-' + Date.now(),
    action: 'Mở Khóa Combo',
    ...comboData
  };
  const updated = [newCombo, ...current];
  saveCombos(updated);
  return newCombo;
};

export const updateCombo = (id, comboData) => {
  const current = getCombos();
  const updated = current.map(c => c.id === id ? { ...c, ...comboData } : c);
  saveCombos(updated);
  return updated.find(c => c.id === id);
};

export const deleteCombo = (id) => {
  const current = getCombos();
  const updated = current.filter(c => c.id !== id);
  saveCombos(updated);
  return true;
};

// ==========================================
// 2. QUẢN LÝ SÁCH LẺ GIẢM SÂU (SINGLE DEALS)
// ==========================================
export const getSingleDeals = () => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SINGLE_DEALS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(d => d && !String(d.id).startsWith('deal-default-'));
  } catch {
    return [];
  }
};

export const saveSingleDeals = (deals) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.SINGLE_DEALS, JSON.stringify(deals));
  notifyOfferChange();
};

export const addSingleDeal = (dealData) => {
  const current = getSingleDeals();
  const newDeal = {
    id: dealData.id || ('deal-' + Date.now()),
    action: 'Thuê Ngay',
    ...dealData
  };
  const updated = [newDeal, ...current];
  saveSingleDeals(updated);
  return newDeal;
};

export const updateSingleDeal = (id, dealData) => {
  const current = getSingleDeals();
  const updated = current.map(d => d.id === id ? { ...d, ...dealData } : d);
  saveSingleDeals(updated);
  return updated.find(d => d.id === id);
};

export const deleteSingleDeal = (id) => {
  const current = getSingleDeals();
  const updated = current.filter(d => d.id !== id);
  saveSingleDeals(updated);
  return true;
};
