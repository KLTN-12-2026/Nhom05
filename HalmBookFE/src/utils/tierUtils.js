/**
 * Utility: tierUtils.js
 * Chuẩn hóa tên hạng, icon Phosphor và nhãn huy hiệu thành viên độc giả HALM BOOK.
 */

export const getTierInfo = (tier) => {
    if (!tier) {
        return { name: 'Thợ Cày 🥉', icon: 'ph-shield', discount: 0 };
    }

    const rawName = typeof tier === 'string'
        ? tier
        : (tier.tierName || tier.name || tier.tier_name || 'Thợ Cày 🥉');

    let icon = typeof tier === 'object' && tier.badgeIcon ? tier.badgeIcon : '';
    const discount = typeof tier === 'object' && tier.discountPercent ? tier.discountPercent : 0;

    // Trích xuất icon nếu bị dính trong chuỗi text (ví dụ "ph-shield Thợ Cày")
    const matchIcon = rawName.match(/ph-[a-z0-9-]+/i);
    if (matchIcon && !icon) {
        icon = matchIcon[0];
    }

    // Loại bỏ chuỗi ph-... còn sót trong text
    let cleanName = rawName.replace(/ph-[a-z0-9-]+/gi, '').trim();

    // Map icon mặc định tương ứng với 4 cấp bậc
    if (!icon) {
        if (cleanName.includes('Cao Thủ')) icon = 'ph-medal';
        else if (cleanName.includes('Lão Nông')) icon = 'ph-crown';
        else if (cleanName.includes('Đại Điền')) icon = 'ph-sparkle';
        else icon = 'ph-shield';
    }

    // Bổ sung huy chương đặc trưng cho từng hạng nếu chưa có
    if (cleanName.includes('Thợ Cày') && !cleanName.includes('🥉') && !cleanName.includes('🌱')) {
        cleanName = `${cleanName} 🥉`;
    } else if (cleanName.includes('Cao Thủ') && !cleanName.includes('🥈') && !cleanName.includes('🚜')) {
        cleanName = `${cleanName} 🥈`;
    } else if (cleanName.includes('Lão Nông') && !cleanName.includes('🥇') && !cleanName.includes('🌾')) {
        cleanName = `${cleanName} 🥇`;
    } else if (cleanName.includes('Đại Điền') && !cleanName.includes('👑') && !cleanName.includes('🏰')) {
        cleanName = `${cleanName} 👑`;
    }

    if (!icon.startsWith('ph-')) {
        icon = `ph-${icon}`;
    }

    return { name: cleanName, icon, discount };
};
