/**
 * ============================================================================
 * Service: bannerService.js
 * Quản lý danh sách Banner động cho Trang Chủ (User) và Cổng Quản Trị (Admin)
 * Hỗ trợ các kiểu bố cục:
 *  1. 'showcase'     - Bố cục 2 cột với 3 thẻ sách nổi bật đa sắc
 *  2. 'mascot_ai'    - Bố cục Linh vật Khoai Nhỏ AI với bong bóng chat & chip câu hỏi tương tác
 *  3. 'vip_potato'   - Bố cục Hoàng Gia hiển thị 4 cấp bậc hội viên & ví Khoai Tây
 *  4. 'hot_deal'     - Bố cục Voucher coupon & đợt giảm giá sâu
 *  5. 'reader_3d'    - Bố cục Trình đọc lật trang 3D & máy phát nhạc nền Focus
 *  6. 'custom_image' - Bố cục Banner hình ảnh tải lên tự do (Full Image / Overlay)
 * ============================================================================
 */

const STORAGE_KEY_BANNERS = 'halm_db_banners';
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

/**
 * Lấy danh sách toàn bộ banner (kèm fallback mặc định)
 */
export function getBanners() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BANNERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_BANNERS, JSON.stringify(DEFAULT_BANNERS));
      return DEFAULT_BANNERS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_BANNERS;
  } catch {
    return DEFAULT_BANNERS;
  }
}

/**
 * Lưu danh sách banner vào LocalStorage và bắn CustomEvent để User cập nhật tức thì
 */
export function saveBanners(banners) {
  try {
    const safeBanners = Array.isArray(banners) ? banners : DEFAULT_BANNERS;
    localStorage.setItem(STORAGE_KEY_BANNERS, JSON.stringify(safeBanners));
    window.dispatchEvent(new CustomEvent('halm-banners-updated', { detail: { banners: safeBanners } }));
    return safeBanners;
  } catch (error) {
    console.error('Lỗi lưu danh sách banner:', error);
    return false;
  }
}

/**
 * Thêm banner mới
 */
export function addBanner(bannerData) {
  const list = getBanners();
  const newBanner = {
    ...bannerData,
    id: `banner-${Date.now()}`,
    order: list.length + 1,
    isActive: bannerData.isActive !== false
  };
  const updated = [...list, newBanner];
  saveBanners(updated);
  return updated;
}

/**
 * Cập nhật banner hiện có
 */
export function updateBanner(id, patch) {
  const list = getBanners();
  const idx = list.findIndex(b => b.id === id);
  if (idx === -1) return list;
  list[idx] = { ...list[idx], ...patch };
  saveBanners(list);
  return list;
}

/**
 * Bật/tắt trạng thái hiển thị của banner
 */
export function toggleBannerStatus(id) {
  const list = getBanners();
  const idx = list.findIndex(b => b.id === id);
  if (idx === -1) return list;
  list[idx].isActive = !list[idx].isActive;
  saveBanners(list);
  return list;
}

/**
 * Xóa banner
 */
export function deleteBanner(id) {
  const list = getBanners();
  const filtered = list.filter(b => b.id !== id);
  saveBanners(filtered);
  return filtered;
}

/**
 * Khôi phục danh sách banner mặc định ban đầu
 */
export function resetDefaultBanners() {
  saveBanners(DEFAULT_BANNERS);
  return DEFAULT_BANNERS;
}

/**
 * Lấy cấu hình thông tin chân trang (Site Settings)
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
 * Lưu cấu hình thông tin chân trang và bắn CustomEvent
 */
export function saveSiteSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent('halm-site-settings-updated', { detail: { settings } }));
    return true;
  } catch (error) {
    console.error('Lỗi lưu cấu hình website:', error);
    return false;
  }
}
