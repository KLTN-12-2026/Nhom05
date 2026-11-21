/**
 * ============================================================================
 * Service: bannerService.js
 * Quản lý danh sách Banner động cho Trang Chủ (User) và Cổng Quản Trị (Admin)
 * Tích hợp trực tiếp với CSDL Backend Spring Boot (/api/home/banners, /api/admin/banners)
 * Kèm cơ chế LocalStorage Cache & Offline Fallback liền mạch
 * ============================================================================
 */

import axiosClient from './axiosClient';

const STORAGE_KEY_SETTINGS = 'halm_db_site_settings';

export const DEFAULT_BANNERS = [
  {
    id: 'banner-1',
    layoutType: 'showcase',
    eyebrow: 'TUYỂN CHỌN DÀNH CHO BẠN',
    title: 'Một cuốn sách, ngàn cảm hứng',
    titleHighlight: 'Cùng HALM BOOK',
    description: 'Từ văn học, thiếu nhi đến khoa học và phát triển bản thân — bắt đầu với chủ đề khiến bạn tò mò nhất.',
    actionText: 'Tìm Sách Yêu Thích',
    actionLink: '#trending-section',
    icon: 'ph-sparkle',
    gradient: 'linear-gradient(135deg, #1C1D1A 0%, #2B161B 100%)',
    isActive: true,
    order: 1,
    imageUrl: '',
    imageMode: 'overlay', // 'overlay' | 'pure'
    books: [
      { title: 'Tuổi thơ', subtitle: 'NUÔI DƯỠNG TRÍ TƯỞNG TƯỢNG', color: 'linear-gradient(145deg,#315b54,#7fac82)', tag: 'Nổi bật' },
      { title: 'Khám phá', subtitle: 'CHẠM ĐẾN CHÂN TRỜI MỚI', color: 'linear-gradient(145deg,#344b77,#8293c1)', tag: 'Mới nhất' },
      { title: 'Sáng tạo', subtitle: 'Ý TƯỞNG BẮT ĐẦU TỪ ĐÂY', color: 'linear-gradient(145deg,#783d67,#c17ca2)', tag: 'Top 1' }
    ]
  },
  {
    id: 'banner-2',
    layoutType: 'mascot_ai',
    eyebrow: 'TRỢ LÝ AI KHOAI NHỎ THÔNG MINH',
    title: 'Tìm đúng cuốn sách cho bạn',
    titleHighlight: 'Đồng Hành Cùng AI',
    description: 'Khoai Nhỏ HALM đồng hành cùng bạn 24/7: tóm tắt nhanh nội dung sách, giải thích thuật ngữ chuyên sâu và định hướng lộ trình đọc cá nhân hóa.',
    actionText: 'Trò Chuyện Cùng AI',
    actionLink: '#chat',
    icon: 'ph-chat-circle-dots',
    gradient: 'linear-gradient(135deg, #1A1813 0%, #332612 100%)',
    isActive: true,
    order: 2,
    imageUrl: '',
    mascotQuote: 'Chào bạn đọc! Mình là Khoai Nhỏ HALM 🥔. Hôm nay bạn muốn tìm sách hay giải đáp điều gì nào?',
    promptChips: [
      'Gợi ý sách kỹ năng sống hot nhất?',
      'Tóm tắt ý chính cuốn Nhà Giả Kim',
      'Các tác phẩm phí thuê dưới 30 Khoai?',
      'Bí quyết duy trì Streak đọc 7 ngày'
    ]
  },
  {
    id: 'banner-3',
    layoutType: 'vip_potato',
    eyebrow: 'HỘI VIÊN & ĐẶC QUYỀN HOÀNG GIA',
    title: 'Nâng tầm trải nghiệm đọc trọn đời',
    titleHighlight: 'Bảo Lưu Hạng Vĩnh Viễn',
    description: 'Càng đọc nhiều càng thăng hạng cao. Giảm từ 5% đến 20% phí thuê sách vĩnh viễn, nhận huy hiệu danh giá và khung viền Avatar Hoàng Gia độc quyền.',
    actionText: 'Khám Phá Cấp Bậc Hội Viên',
    actionLink: '/hang',
    icon: 'ph-crown',
    gradient: 'linear-gradient(135deg, #151614 0%, #231C0D 100%)',
    isActive: true,
    order: 3,
    imageUrl: '',
    tierHighlights: [
      { name: 'Thợ Cày', icon: '🌱', discount: '0%', badge: 'Hạng Khởi Đầu' },
      { name: 'Cao Thủ Cày', icon: '🚜', discount: '-5%', badge: 'Hạng Bạc' },
      { name: 'Lão Nông', icon: '🌾', discount: '-10%', badge: 'Hạng Vàng' },
      { name: 'Đại Điền Chủ', icon: '👑', discount: '-20%', badge: 'Hoàng Gia VIP' }
    ]
  },
  {
    id: 'banner-4',
    layoutType: 'hot_deal',
    eyebrow: 'ĐẠI TIỆC ƯU ĐÃI & VOUCHER KHỦNG',
    title: 'Thuê sách thả ga — Không lo về giá',
    titleHighlight: 'Săn Voucher Tiết Kiệm',
    description: 'Mở khóa gói VIP giảm 50%, miễn phí 3 lượt tải tài liệu cá nhân bằng AI, combo sách kinh điển giảm 45% cùng hàng trăm mã giảm giá hấp dẫn.',
    actionText: 'Săn Ưu Đãi Đặc Quyền',
    actionLink: '/uudai',
    icon: 'ph-ticket',
    gradient: 'linear-gradient(135deg, #220F12 0%, #170A0C 100%)',
    isActive: true,
    order: 4,
    imageUrl: '',
    dealBadge: 'HOT DEAL TUẦN NÀY 🔥',
    vouchers: [
      { code: 'HALM2026', label: '-50% VIP', desc: 'Giảm 50% Gói VIP 1 Năm' },
      { code: 'FREE3UPLOAD', label: 'FREE 3X', desc: '3 lần tải sách cá nhân AI' },
      { code: 'STREAK7D', label: '+10 KHOAI', desc: 'Thưởng chuỗi điểm danh 7 ngày' }
    ]
  },
  {
    id: 'banner-5',
    layoutType: 'reader_3d',
    eyebrow: 'TRẢI NGHIỆM ĐỌC ĐỈNH CAO',
    title: 'Trình đọc HALM Reader & Nhạc nền Focus',
    titleHighlight: 'Lật Trang 3D & Reflow Text',
    description: 'Hiệu ứng lật trang 3D sống động, tùy chỉnh font chữ không tràn màn hình kết hợp 4 giai điệu tập trung sâu: Tiếng mưa rơi, Lofi Chill, Sóng não Ambient & Thiên nhiên.',
    actionText: 'Vào Tủ Sách Của Tôi',
    actionLink: '/tusachcn',
    icon: 'ph-headphones',
    gradient: 'linear-gradient(135deg, #101E1A 0%, #0A1310 100%)',
    isActive: true,
    order: 5,
    imageUrl: '',
    readerFeatures: ['Lật trang 3D chân thực', 'Chữ động Reflow Text', 'Ghi chú & Bookmark'],
    ambientSounds: ['Tiếng mưa rơi êm dịu', 'Giai điệu Lofi Chill', 'Deep Focus Ambient']
  }
];

export const DEFAULT_SITE_SETTINGS = {
  hotline: '0397409029',
  email: 'support@halmbook.vn',
  address: '03 Quang Trung, TP. Đà Nẵng',
  copyright: '© 2026 HALM BOOK. Tất cả bản quyền được bảo lưu.',
  slogan: 'Không gian Đọc Sách & Tri Thức Độc Bản'
};

// Cache is isolated by platform AND audience: admin drafts must never reach the public carousel.
const channel = platform => {
  const value = String(platform).toUpperCase();
  if (!['WEB', 'APP'].includes(value)) throw new Error('Kênh banner không hợp lệ.');
  return value;
};
const cacheKey = (platform, isAdmin) => 'halm_banners_v2_' + channel(platform) + (isAdmin ? '_admin' : '_public');
const resource = id => '/api/admin/banners/' + encodeURIComponent(id);
const memoryCache = new Map();

export function getBanners(platform = 'WEB', isAdmin = false) {
  const key = cacheKey(platform, isAdmin);
  if (memoryCache.has(key)) return memoryCache.get(key);
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(parsed) ? parsed.filter(b => (b.platform || 'WEB') === channel(platform) && (isAdmin || b.isActive === true)) : [];
  } catch { return []; }
}

function commitBanners(data, platform, isAdmin) {
  if (!Array.isArray(data) || data.some(b => !b || b.platform !== channel(platform))) {
    throw new Error('Dữ liệu banner trả về không đúng kênh.');
  }
  const banners = data.filter(b => isAdmin || b.isActive === true).sort((a, b) => (a.order || 0) - (b.order || 0));
  const key = cacheKey(platform, isAdmin);
  memoryCache.set(key, banners);
  // Large uploaded images can exceed the browser's storage quota; a confirmed save still succeeds.
  try { localStorage.setItem(key, JSON.stringify(banners)); } catch { /* Keep the in-memory result. */ }
  window.dispatchEvent(new CustomEvent('halm-banners-updated', { detail: { banners, platform: channel(platform), isAdmin } }));
  return banners;
}

export async function fetchBanners(isAdmin = false, platform = 'WEB', options = {}) {
  try {
    const res = await axiosClient.get(isAdmin ? '/api/admin/banners' : '/api/home/banners', {
      ...options, params: { platform: channel(platform) },
    });
    return commitBanners(res.data, platform, isAdmin);
  } catch (error) {
    if (isAdmin || options.signal?.aborted) throw error;
    return getBanners(platform, false);
  }
}

export async function saveBanners(banners, platform = 'WEB') {
  const res = await axiosClient.put('/api/admin/banners/reorder', banners, { params: { platform: channel(platform) } });
  return commitBanners(res.data, platform, true);
}

export async function addBanner(bannerData, platform = 'WEB') {
  const list = getBanners(platform, true);
  const res = await axiosClient.post('/api/admin/banners', {
    ...bannerData, platform: channel(platform), order: undefined,
  });
  return commitBanners([...list, res.data], platform, true);
}

export async function updateBanner(id, patch, platform = 'WEB') {
  const list = getBanners(platform, true);
  const res = await axiosClient.put(resource(id), { ...patch, platform: channel(platform) }, { params: { platform: channel(platform) } });
  return commitBanners([...list.filter(b => b.id !== id), res.data], platform, true);
}

export async function toggleBannerStatus(id, platform = 'WEB') {
  await axiosClient.patch(resource(id) + '/toggle', null, { params: { platform: channel(platform) } });
  return fetchBanners(true, platform);
}

export async function deleteBanner(id, platform = 'WEB') {
  await axiosClient.delete(resource(id), { params: { platform: channel(platform) } });
  return commitBanners(getBanners(platform, true).filter(b => b.id !== id), platform, true);
}

export async function resetDefaultBanners(platform = 'WEB') {
  const res = await axiosClient.post('/api/admin/banners/reset', null, { params: { platform: channel(platform) } });
  return commitBanners(res.data, platform, true);
}

/**
 * Lấy cấu hình thông tin chân trang (Site Settings) tức thì từ cache
 */
export function getSiteSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(DEFAULT_SITE_SETTINGS));
      return DEFAULT_SITE_SETTINGS;
    }
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : DEFAULT_SITE_SETTINGS;
  } catch {
    return DEFAULT_SITE_SETTINGS;
  }
}

/**
 * Tải thiết lập website từ CSDL Backend
 */
export async function fetchSiteSettings() {
  try {
    const res = await axiosClient.get('/api/home/site-settings');
    const data = res.data;
    if (data && typeof data === 'object') {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(data));
      window.dispatchEvent(new CustomEvent('halm-site-settings-updated', { detail: { settings: data } }));
      return data;
    }
  } catch (err) {
    console.warn('Lỗi tải Site Settings từ Backend CSDL:', err);
  }
  return getSiteSettings();
}

/**
 * Lưu cấu hình thông tin chân trang lên CSDL Backend và đồng bộ Cache
 */
export async function saveSiteSettings(settings) {
  try {
    const res = await axiosClient.put('/api/admin/site-settings', settings);
    const data = res.data;
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent('halm-site-settings-updated', { detail: { settings: data } }));
    return data;
  } catch (err) {
    console.error('Lỗi lưu Site Settings lên Backend CSDL:', err);
    throw err;
  }
}
