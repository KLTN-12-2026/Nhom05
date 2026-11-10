/**
 * Utility: tierUtils.js
 * Chuẩn hóa toàn diện logic cấp bậc thành viên, huy hiệu và khung viền Avatar độc giả HALM BOOK.
 * Đảm bảo:
 * 1. Khung Avatar uốn lượn ôm sát theo đường cong hình tròn ("bo theo avt") với hiệu ứng thị giác đẳng cấp.
 * 2. Đồng bộ tức thì thứ hạng khi số dư khoai hoặc số sách đạt mốc (VD: 20k khoai -> Đại Điền Chủ Tier 4).
 * 3. Ngăn chặn tuyệt đối việc chuỗi class icon hoặc tên bị lỗi text.
 */

export const formatCustomerId = (id) => {
    if (!id) return 'id#C00007';
    const str = String(id).trim();
    const numMatch = str.match(/\d+/);
    const num = numMatch ? numMatch[0] : '7';
    return `id#C${num.padStart(5, '0')}`;
};

/**
 * Xác định cấp bậc thành viên (1, 2, 3, 4) dựa trên thực tế:
 * - Cấp 4 (Đại Điền Chủ): >= 10.000 Khoai HOẶC >= 150 Sách
 * - Cấp 3 (Lão Nông):      >= 2.500 Khoai HOẶC >= 50 Sách
 * - Cấp 2 (Cao Thủ Cày):   >= 500 Khoai HOẶC >= 10 Sách
 * - Cấp 1 (Thợ Cày):       Mặc định khởi đầu
 */
export const getTierLevel = (tier, potatoBalance = 0, booksCount = 0) => {
    // 1. Kiểm tra ưu tiên theo số dư Khoai hoặc số sách đã cày thực tế
    const effectivePotato = Number(potatoBalance) || 0;
    const effectiveBooks = Number(booksCount) || 0;

    if (effectivePotato >= 10000 || effectiveBooks >= 150) return 4;
    if (effectivePotato >= 2500 || effectiveBooks >= 50) return 3;
    if (effectivePotato >= 500 || effectiveBooks >= 10) return 2;

    // 2. Kiểm tra theo đối tượng hoặc chuỗi tier từ backend
    if (!tier) return 1;
    if (typeof tier === 'number') return tier;

    if (typeof tier === 'object') {
        if (tier.minPotatoRequired >= 10000 || tier.minBooksRequired >= 150) return 4;
        if (tier.minPotatoRequired >= 2500 || tier.minBooksRequired >= 50) return 3;
        if (tier.minPotatoRequired >= 500 || tier.minBooksRequired >= 10) return 2;
        if (tier.discountPercent >= 20) return 4;
        if (tier.discountPercent >= 10) return 3;
        if (tier.discountPercent >= 5) return 2;
    }

    const raw = typeof tier === 'object' ? (tier.tierName || tier.name || '') : String(tier);
    const upper = String(raw).toUpperCase();
    if (upper.includes('ĐẠI ĐIỀN') || upper.includes('DAI DIEN') || upper.includes('DAI_DIEN') || upper.includes('TOI THUONG') || upper.includes('TỐI THƯỢNG') || upper.includes('TIER4') || upper.includes('TIER 4') || upper.includes('IV')) return 4;
    if (upper.includes('LÃO NÔNG') || upper.includes('LAO NONG') || upper.includes('LAO_NONG') || upper.includes('TINH HOA') || upper.includes('TIER3') || upper.includes('TIER 3') || upper.includes('III')) return 3;
    if (upper.includes('CAO THỦ') || upper.includes('CAO THU') || upper.includes('CAO_THU') || upper.includes('TRI THUC') || upper.includes('TRI THỨC') || upper.includes('TIER2') || upper.includes('TIER 2') || upper.includes('II')) return 2;

    return 1;
};

export const getTierInfo = (tier, potatoBalance = 0, booksCount = 0) => {
    const level = getTierLevel(tier, potatoBalance, booksCount);

    switch (level) {
        case 4:
            return {
                level: 4,
                name: 'Đại Điền Chủ 👑',
                cleanName: 'Đại Điền Chủ',
                medal: '👑',
                icon: 'ph-crown',
                discount: 20,
                colorText: 'text-amber-500 dark:text-amber-300',
                badgeText: 'Cấp IV • Tối Thượng'
            };
        case 3:
            return {
                level: 3,
                name: 'Lão Nông 🌾',
                cleanName: 'Lão Nông',
                medal: '🌾',
                icon: 'ph-seal-check',
                discount: 10,
                colorText: 'text-amber-600 dark:text-amber-400',
                badgeText: 'Cấp III • Tinh Hoa'
            };
        case 2:
            return {
                level: 2,
                name: 'Cao Thủ Cày 🥈',
                cleanName: 'Cao Thủ Cày',
                medal: '🥈',
                icon: 'ph-medal',
                discount: 5,
                colorText: 'text-blue-600 dark:text-blue-400',
                badgeText: 'Cấp II • Tri Thức'
            };
        case 1:
        default:
            return {
                level: 1,
                name: 'Thợ Cày 🌱',
                cleanName: 'Thợ Cày',
                medal: '🌱',
                icon: 'ph-shield-check',
                discount: 0,
                colorText: 'text-emerald-600 dark:text-emerald-400',
                badgeText: 'Cấp I • Mầm Đọc'
            };
    }
};

export const getTierBadgeClass = (tier, potatoBalance = 0, booksCount = 0) => {
    const level = getTierLevel(tier, potatoBalance, booksCount);
    switch (level) {
        case 4:
            return 'bg-gradient-to-r from-amber-500/20 via-yellow-500/15 to-amber-600/20 text-amber-700 dark:text-amber-300 border border-amber-400/50 shadow-sm';
        case 3:
            return 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/35 shadow-xs';
        case 2:
            return 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/30';
        case 1:
        default:
            return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25';
    }
};

/**
 * Trả về cấu hình styling khung viền Avatar uốn cong mềm mại theo avatar hình tròn ("bo theo avt")
 */
export const getTierAvatarFrame = (tier, potatoBalance = 0, booksCount = 0) => {
    const level = getTierLevel(tier, potatoBalance, booksCount);

    switch (level) {
        case 4: // Đại Điền Chủ: Vương Miện Hoàng Gia + Vòng Kim Cương Vàng 24K đa tầng
            return {
                level: 4,
                containerClass: 'relative inline-flex items-center justify-center mb-4 group/avatar',
                // Khung viền ngoài bo cong ôm trọn avatar hình tròn
                outerBezelClass: 'relative p-[3.5px] rounded-full bg-gradient-to-tr from-amber-600 via-[#FFE279] to-amber-500 shadow-[0_0_24px_rgba(251,191,36,0.6),0_0_48px_rgba(245,158,11,0.25)] ring-2 ring-amber-400/50',
                ringClass: 'w-24 h-24 rounded-full overflow-hidden border-2 border-[#181916] bg-gradient-to-tr from-[#251f15] to-[#141412] flex items-center justify-center font-display font-black text-2xl text-amber-300 relative z-10',
                crownBadge: '👑',
                crownBadgeClass: 'absolute -top-4 left-1/2 -translate-x-1/2 z-30 text-2xl filter drop-shadow-[0_2px_8px_rgba(245,158,11,0.9)] select-none pointer-events-none animate-pulse',
                cornerBadge: '👑',
                cornerBadgeClass: 'absolute -bottom-1 -right-1 z-20 w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 border-2 border-white dark:border-[#181916] flex items-center justify-center text-xs shadow-md text-stone-900 font-black',
                tierLabel: 'Cấp IV • Đại Điền Chủ'
            };
        case 3: // Lão Nông: Hào Quang Vàng Kim Tinh Hoa đa tầng
            return {
                level: 3,
                containerClass: 'relative inline-flex items-center justify-center mb-4 group/avatar',
                outerBezelClass: 'relative p-[3px] rounded-full bg-gradient-to-tr from-amber-500 via-amber-300 to-yellow-500 shadow-[0_0_18px_rgba(212,175,55,0.45)] ring-2 ring-amber-400/35',
                ringClass: 'w-24 h-24 rounded-full overflow-hidden border-2 border-[#181916] bg-paper-200 dark:bg-night-card flex items-center justify-center font-display font-black text-2xl text-amber-500 dark:text-gold relative z-10',
                crownBadge: null,
                crownBadgeClass: '',
                cornerBadge: '🌾',
                cornerBadgeClass: 'absolute -bottom-1 -right-1 z-20 w-6 h-6 rounded-full bg-amber-500 border-2 border-white dark:border-[#181916] flex items-center justify-center text-xs shadow-sm text-white',
                tierLabel: 'Cấp III • Lão Nông'
            };
        case 2: // Cao Thủ Cày: Khung Bạc Lam Sapphire Tri Thức
            return {
                level: 2,
                containerClass: 'relative inline-flex items-center justify-center mb-4 group/avatar',
                outerBezelClass: 'relative p-[3px] rounded-full bg-gradient-to-tr from-blue-400 via-slate-200 to-indigo-500 shadow-[0_0_15px_rgba(96,165,250,0.35)] ring-2 ring-blue-400/25',
                ringClass: 'w-24 h-24 rounded-full overflow-hidden border-2 border-[#181916] bg-paper-200 dark:bg-night-card flex items-center justify-center font-display font-black text-2xl text-blue-600 dark:text-blue-400 relative z-10',
                crownBadge: null,
                crownBadgeClass: '',
                cornerBadge: '🥈',
                cornerBadgeClass: 'absolute -bottom-1 -right-1 z-20 w-6 h-6 rounded-full bg-blue-600 border-2 border-white dark:border-[#181916] flex items-center justify-center text-xs shadow-sm text-white',
                tierLabel: 'Cấp II • Cao Thủ Cày'
            };
        case 1: // Thợ Cày: Mầm Đọc Xanh Tươi
        default:
            return {
                level: 1,
                containerClass: 'relative inline-flex items-center justify-center mb-4 group/avatar',
                outerBezelClass: 'relative p-[2.5px] rounded-full bg-gradient-to-tr from-emerald-500 via-emerald-400 to-teal-400 shadow-[0_0_12px_rgba(16,185,129,0.3)] ring-1 ring-emerald-400/25',
                ringClass: 'w-24 h-24 rounded-full overflow-hidden border-2 border-[#181916] bg-paper-200 dark:bg-night-card flex items-center justify-center font-display font-black text-2xl text-emerald-600 dark:text-emerald-400 relative z-10',
                crownBadge: null,
                crownBadgeClass: '',
                cornerBadge: '🌱',
                cornerBadgeClass: 'absolute -bottom-1 -right-1 z-20 w-6 h-6 rounded-full bg-emerald-600 border-2 border-white dark:border-[#181916] flex items-center justify-center text-xs shadow-sm text-white',
                tierLabel: 'Cấp I • Thợ Cày'
            };
    }
};
