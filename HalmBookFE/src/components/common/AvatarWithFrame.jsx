import React, { useMemo } from 'react';
import { getTierAvatarFrame, getTierLevel, getTierInfo } from '@/utils/tierUtils';

/**
 * AvatarWithFrame:
 * Hiển thị avatar tròn với vầng hào quang và đại pháp trận Tu Tiên (Monumental Cultivation Daoist Aura)
 * - Tọa độ đồng tâm tuyệt đối (Absolute Concentric Coordinate System):
 *   Gốc viewBox: [0 0 dim dim], tâm tuyệt đối tại (C, C) với C = dim / 2.
 *   Mọi phép xoay sử dụng SVG native <animateTransform type="rotate"> quanh tâm (C, C).
 *   Triệt tiêu 100% hiện tượng trôi lệch, vẹo tâm sang góc trên-trái trên mọi trình duyệt.
 *
 * CÁC ĐẶC TRƯNG TU TIÊN RIÊNG BIỆT CHO TỪNG CẤP BẬC:
 * - Cấp IV (Đại Điền Chủ • Tối Thượng): Cửu Thiên Tiên Miện 👑, ĐẠI TRẬN LÔI KIẾP (2 vòng tia sét zigzag bọc quanh viền chớp giật tử kim, 4 tụ điểm lôi hoa).
 * - Cấp III (Lão Nông • Tinh Hoa): Thái Cực Bát Quái Linh Trận ☰☱☲☳☴☵☶☷ hoàng kim xoay tròn, 3 Hạt Kim Đan hộ thể, Thái Cực Đạo Ấn ⚜️.
 * - Cấp II (Cao Thủ Cày • Tri Thức): Hàn Băng Lam Tinh Trận (Đa giác tinh thể tuyết 12 đỉnh), 2 Tinh thể Sapphire xoay quanh, Lam Tinh Linh Bảo 💠.
 * - Cấp I (Thợ Cày • Mầm Đọc): Thanh Mộc Bích Ngọc Trận, 1 Mầm Mộc Linh Châu thuần khiết, Mộc Linh Hộ Thể 🌱.
 */

// Hàm sinh tọa độ tia sét zigzag bao quanh đường tròn tâm (cx, cy) cho Cấp IV
function generateLightningRingPath(cx, cy, r, variance = 2.5, points = 24) {
    let d = '';
    for (let i = 0; i <= points; i++) {
        const angle = (i % points) * (2 * Math.PI / points);
        const jag = (i % 2 === 0 ? variance : -variance) * (1 + 0.3 * Math.sin(i * 3.5));
        const currentR = r + jag;
        const x = cx + currentR * Math.cos(angle);
        const y = cy + currentR * Math.sin(angle);
        if (i === 0) {
            d += `M ${x.toFixed(1)} ${y.toFixed(1)}`;
        } else {
            d += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
        }
    }
    return d + ' Z';
}

// Hàm sinh tọa độ đa giác tinh thể băng tuyết tâm (cx, cy) cho Cấp II
function generateFrostPoints(cx, cy, r, spike = 3) {
    const pts = [];
    for (let i = 0; i < 12; i++) {
        const angle = (i * 30 * Math.PI) / 180;
        const currentR = i % 2 === 0 ? r + spike : r - spike;
        const x = (cx + currentR * Math.cos(angle)).toFixed(1);
        const y = (cy + currentR * Math.sin(angle)).toFixed(1);
        pts.push(`${x},${y}`);
    }
    return pts.join(' ');
}

export default function AvatarWithFrame({
    avatarSrc,
    name = 'Độc giả',
    tier,
    potatoBalance = 0,
    booksCount = 0,
    size = 'lg', // 'xl' (112px), 'lg' (96px), 'md' (64px), 'sm' (28px)
    showTierBadge = true,
    showCrown,
    className = ''
}) {
    const level = getTierLevel(tier, potatoBalance, booksCount);
    const tierInfo = getTierInfo(tier, potatoBalance, booksCount);
    const frame = getTierAvatarFrame(level, potatoBalance, booksCount);

    // Mặc định ẩn vương miện trên header (size === 'sm') để thanh điều hướng gọn gàng, không bị tràn
    const shouldShowCrown = showCrown !== undefined ? showCrown : size !== 'sm';

    // Kích thước chuẩn chỉnh theo hệ tọa độ đồng tâm tuyệt đối (C, C)
    const sizeConfig = {
        xl: {
            containerClass: 'w-36 h-36 shrink-0', // 144px
            dim: 144,
            center: 72,
            avatarDim: 'w-28 h-28', // 112px, radius 56
            r1: 58, // Sát viền bezel ngoài avatar
            r2: 64, // Vòng hiệu ứng đặc trưng (tia sét / bát quái / tinh thể)
            r3: 70, // Vòng quỹ đạo ngoài cùng
            stroke1: 2.5,
            stroke2: 2.0,
            stroke3: 2.0,
            crownClass: 'text-3xl -top-4',
            badgeClass: 'w-8 h-8 text-sm bottom-1 right-1',
            textAvatar: 'text-3xl',
            haloBlur: 'blur-xl',
            haloOpacity: 'opacity-80'
        },
        lg: {
            containerClass: 'w-32 h-32 shrink-0', // 128px
            dim: 128,
            center: 64,
            avatarDim: 'w-24 h-24', // 96px, radius 48
            r1: 50, // Sát viền bezel ngoài avatar
            r2: 56, // Vòng hiệu ứng đặc trưng
            r3: 61, // Quỹ đạo ngoài
            stroke1: 2.2,
            stroke2: 1.8,
            stroke3: 1.8,
            crownClass: 'text-2xl -top-3.5',
            badgeClass: 'w-7 h-7 text-xs bottom-1 right-1',
            textAvatar: 'text-2xl',
            haloBlur: 'blur-lg',
            haloOpacity: 'opacity-75'
        },
        md: {
            containerClass: 'w-24 h-24 shrink-0', // 96px
            dim: 96,
            center: 48,
            avatarDim: 'w-16 h-16', // 64px, radius 32
            r1: 34,
            r2: 39,
            r3: 44,
            stroke1: 1.8,
            stroke2: 1.4,
            stroke3: 1.5,
            crownClass: 'text-lg -top-2.5',
            badgeClass: 'w-5 h-5 text-[10px] bottom-0.5 right-0.5',
            textAvatar: 'text-lg',
            haloBlur: 'blur-md',
            haloOpacity: 'opacity-65'
        },
        sm: {
            containerClass: 'w-9 h-9 shrink-0', // 36px, chuẩn chỉnh ôm khít nút navbar
            dim: 36,
            center: 18,
            avatarDim: 'w-7 h-7', // 28px, radius 14
            r1: 14.8, // Sát viền avatar 14px
            r2: 16.2,
            r3: 17.2,
            stroke1: 1.2,
            stroke2: 0.9,
            stroke3: 0.9,
            crownClass: 'text-[11px] -top-2',
            badgeClass: 'w-3.5 h-3.5 text-[8px] -bottom-0.5 -right-0.5',
            textAvatar: 'text-xs',
            haloBlur: 'blur-xs',
            haloOpacity: 'opacity-35'
        }
    }[size] || {
        containerClass: 'w-32 h-32 shrink-0',
        dim: 128,
        center: 64,
        avatarDim: 'w-24 h-24',
        r1: 50,
        r2: 56,
        r3: 61,
        stroke1: 2.2,
        stroke2: 1.8,
        stroke3: 1.8,
        crownClass: 'text-2xl -top-3.5',
        badgeClass: 'w-7 h-7 text-xs bottom-1 right-1',
        textAvatar: 'text-2xl',
        haloBlur: 'blur-lg',
        haloOpacity: 'opacity-75'
    };

    const C = sizeConfig.center;

    // Đường dẫn tia sét Lôi Kiếp cho Cấp IV (tâm C, C)
    const lightningInnerPath = useMemo(() => {
        if (level !== 4) return '';
        const v = size === 'sm' ? 0.7 : size === 'md' ? 1.5 : 2.2;
        return generateLightningRingPath(C, C, sizeConfig.r1, v, 24);
    }, [level, size, C, sizeConfig.r1]);

    const lightningOuterPath = useMemo(() => {
        if (level !== 4) return '';
        const v = size === 'sm' ? 0.9 : size === 'md' ? 1.8 : 2.8;
        return generateLightningRingPath(C, C, sizeConfig.r2, v, 32);
    }, [level, size, C, sizeConfig.r2]);

    // Đa giác tinh thể Hàn Băng cho Cấp II (tâm C, C)
    const frostPoints = useMemo(() => {
        if (level !== 2) return '';
        const spike = size === 'sm' ? 0.9 : size === 'md' ? 1.8 : 2.5;
        return generateFrostPoints(C, C, sizeConfig.r2, spike);
    }, [level, size, C, sizeConfig.r2]);

    // Ký tự Bát Quái cho Cấp III
    const baguaTrigrams = ['☰', '☱', '☲', '☳', '☴', '☵', '☶', '☷'];

    // Cấu hình linh quang Tu Tiên theo 4 đại cảnh giới
    const cultivationStyle = {
        4: {
            // Cửu Thiên Chí Tôn • Đại Điền Chủ (Lôi Kiếp Sét Đánh Hoàng Gia)
            auraHalo: 'bg-[radial-gradient(circle,rgba(251,191,36,0.5)_0%,rgba(168,85,247,0.4)_40%,rgba(234,179,8,0.18)_70%,transparent_100%)]',
            dropShadowSvg: 'filter drop-shadow-[0_0_8px_rgba(251,191,36,0.85)] drop-shadow-[0_0_16px_rgba(168,85,247,0.6)]',
            innerBezel: 'bg-gradient-to-tr from-amber-600 via-[#FFE279] to-purple-600 p-[3px] shadow-[0_0_18px_rgba(251,191,36,0.8),0_0_32px_rgba(168,85,247,0.45)]',
            strokeColor1: '#FFE279',
            strokeColor2: '#C084FC',
            strokeColor3: '#FBBF24',
            orbsCount: 4,
            orbColor: '#FDE047',
            orbGlow: 'drop-shadow(0 0 5px #FBBF24)',
            topIcon: '👑',
            topClass: 'filter drop-shadow-[0_0_10px_rgba(250,204,21,1)] drop-shadow-[0_0_20px_rgba(168,85,247,0.8)]',
            badgeBg: 'bg-gradient-to-tr from-amber-500 via-yellow-300 to-purple-600 text-stone-900 border-amber-300',
            realmTitle: 'Cửu Thiên Chí Tôn • Đại Điền Chủ'
        },
        3: {
            // Nguyên Anh Đạo Quân • Lão Nông (Thái Cực Bát Quái Hoàng Kim)
            auraHalo: 'bg-[radial-gradient(circle,rgba(245,158,11,0.45)_0%,rgba(217,119,6,0.3)_55%,rgba(251,191,36,0.15)_75%,transparent_100%)]',
            dropShadowSvg: 'filter drop-shadow-[0_0_8px_rgba(245,158,11,0.85)] drop-shadow-[0_0_16px_rgba(217,119,6,0.45)]',
            innerBezel: 'bg-gradient-to-tr from-amber-600 via-amber-300 to-yellow-500 p-[2.5px] shadow-[0_0_16px_rgba(245,158,11,0.7)]',
            strokeColor1: '#F59E0B',
            strokeColor2: '#FDE047',
            strokeColor3: '#D97706',
            orbsCount: 3,
            orbColor: '#FBBF24',
            orbGlow: 'drop-shadow(0 0 4px #F59E0B)',
            topIcon: '⚜️',
            topClass: 'filter drop-shadow-[0_0_8px_rgba(245,158,11,1)]',
            badgeBg: 'bg-gradient-to-tr from-amber-600 to-yellow-400 text-stone-900 border-amber-200',
            realmTitle: 'Nguyên Anh Đạo Quân • Lão Nông'
        },
        2: {
            // Kim Đan Chân Nhân • Cao Thủ Cày (Hàn Băng Lam Tinh Trận)
            auraHalo: 'bg-[radial-gradient(circle,rgba(56,189,248,0.45)_0%,rgba(99,102,241,0.28)_55%,transparent_100%)]',
            dropShadowSvg: 'filter drop-shadow-[0_0_8px_rgba(56,189,248,0.8)] drop-shadow-[0_0_15px_rgba(99,102,241,0.4)]',
            innerBezel: 'bg-gradient-to-tr from-sky-500 via-cyan-200 to-indigo-600 p-[2px] shadow-[0_0_14px_rgba(56,189,248,0.65)]',
            strokeColor1: '#38BDF8',
            strokeColor2: '#818CF8',
            strokeColor3: '#E0F2FE',
            orbsCount: 2,
            orbColor: '#38BDF8',
            orbGlow: 'drop-shadow(0 0 4px #38BDF8)',
            topIcon: '💠',
            topClass: 'filter drop-shadow-[0_0_7px_rgba(56,189,248,0.9)]',
            badgeBg: 'bg-gradient-to-tr from-blue-600 to-cyan-400 text-white border-sky-300',
            realmTitle: 'Kim Đan Chân Nhân • Cao Thủ Cày'
        },
        1: {
            // Luyện Khí Đạo Giả • Thợ Cày (Thanh Mộc Linh Quang)
            auraHalo: 'bg-[radial-gradient(circle,rgba(16,185,129,0.35)_0%,rgba(5,150,105,0.18)_55%,transparent_100%)]',
            dropShadowSvg: 'filter drop-shadow-[0_0_7px_rgba(16,185,129,0.7)]',
            innerBezel: 'bg-gradient-to-tr from-emerald-600 via-emerald-300 to-teal-500 p-[1.5px] shadow-[0_0_10px_rgba(16,185,129,0.55)]',
            strokeColor1: '#10B981',
            strokeColor2: '#6EE7B7',
            strokeColor3: '#A7F3D0',
            orbsCount: 1,
            orbColor: '#6EE7B7',
            orbGlow: 'drop-shadow(0 0 3px #10B981)',
            topIcon: '🌱',
            topClass: 'filter drop-shadow-[0_0_5px_rgba(16,185,129,0.8)]',
            badgeBg: 'bg-gradient-to-tr from-emerald-600 to-teal-400 text-white border-emerald-300',
            realmTitle: 'Luyện Khí Đạo Giả • Thợ Cày'
        }
    }[level];

    // Tạo tọa độ các Linh Châu trên quỹ đạo r3 (tâm C, C)
    const orbs = Array.from({ length: cultivationStyle.orbsCount }, (_, i) => {
        const angle = (i * 360) / cultivationStyle.orbsCount;
        const rad = (angle * Math.PI) / 180;
        return {
            cx: C + sizeConfig.r3 * Math.cos(rad),
            cy: C + sizeConfig.r3 * Math.sin(rad)
        };
    });

    return (
        <div
            className={`relative flex items-center justify-center select-none group/avatar ${sizeConfig.containerClass} ${className}`}
            title={cultivationStyle.realmTitle}
        >
            <style>{`
                @keyframes tuTienPulseAura {
                    0%, 100% { transform: scale(1); opacity: 0.75; }
                    50% { transform: scale(1.1); opacity: 0.95; }
                }
                @keyframes tuTienFloatCrown {
                    0%, 100% { transform: translateX(-50%) translateY(0) scale(1); }
                    50% { transform: translateX(-50%) translateY(-2px) scale(1.06); }
                }
                @keyframes tuTienLightningCrackle {
                    0%, 100% { opacity: 0.95; filter: drop-shadow(0 0 2px #FFE279) drop-shadow(0 0 6px #C084FC); }
                    30% { opacity: 0.7; filter: drop-shadow(0 0 1px #FFE279); }
                    50% { opacity: 1; filter: drop-shadow(0 0 5px #FFE279) drop-shadow(0 0 10px #E879F9); }
                    80% { opacity: 0.85; }
                }
            `}</style>

            {/* 1. VẦNG HÀO QUANG TOẢ RỘNG ĐỒ SỘ (Pulsating Centered Radial Halo) */}
            <div
                className={`absolute inset-0 rounded-full scale-105 pointer-events-none ${sizeConfig.haloBlur} ${sizeConfig.haloOpacity} ${cultivationStyle.auraHalo}`}
                style={{
                    animation: 'tuTienPulseAura 4s ease-in-out infinite'
                }}
            />

            {/* 2. ĐẠI PHÁP TRẬN TU TIÊN ĐA TẦNG SVG:
                   TÂM (C, C) NẰM CHÍNH GIỮA TUYỆT ĐỐI
                   viewBox = [0 0 dim dim]
                   Mọi phép quay sử dụng native <animateTransform> quanh tâm (C, C),
                   hoàn toàn miễn nhiễm với mọi lỗi lệch trục CSS trên mọi trình duyệt.
            */}
            <svg
                className={`absolute inset-0 w-full h-full pointer-events-none overflow-visible ${cultivationStyle.dropShadowSvg}`}
                viewBox={`0 0 ${sizeConfig.dim} ${sizeConfig.dim}`}
            >
                <defs>
                    <linearGradient id={`qi-grad-a-${level}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={cultivationStyle.strokeColor1} />
                        <stop offset="50%" stopColor={cultivationStyle.strokeColor3} />
                        <stop offset="100%" stopColor={cultivationStyle.strokeColor2} />
                    </linearGradient>
                    <linearGradient id={`qi-grad-b-${level}`} x1="100%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor={cultivationStyle.strokeColor2} />
                        <stop offset="50%" stopColor="#FFFFFF" />
                        <stop offset="100%" stopColor={cultivationStyle.strokeColor1} />
                    </linearGradient>
                    {/* Hiệu ứng phát quang tia sét Lôi Kiếp */}
                    <filter id="lightningGlow" x="-30%" y="-30%" width="160%" height="160%">
                        <feGaussianBlur stdDeviation="1.5" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* ========================================================
                    HẠNG IV: ĐẠI ĐIỀN CHỦ (VÒNG TIA SÉT LÔI KIẾP BAO QUANH)
                   ======================================================== */}
                {level === 4 && (
                    <>
                        {/* Vòng sét 1 (Sát viền Avatar): Tia sét lôi đình xoay ngược chiều quanh tâm (C, C) */}
                        <g>
                            <animateTransform
                                attributeName="transform"
                                type="rotate"
                                from={`360 ${C} ${C}`}
                                to={`0 ${C} ${C}`}
                                dur="8s"
                                repeatCount="indefinite"
                            />
                            <path
                                d={lightningInnerPath}
                                fill="none"
                                stroke="#FFE279"
                                strokeWidth={size === 'sm' ? 1.1 : 1.8}
                                strokeLinecap="round"
                                strokeLinejoin="miter"
                                filter="url(#lightningGlow)"
                                className="opacity-95"
                            />
                        </g>

                        {/* Vòng sét 2 (Vòng ngoài): Lôi kiếp bùng nổ xoay thuận chiều quanh tâm (C, C) */}
                        <g style={{ animation: 'tuTienLightningCrackle 0.5s ease-in-out infinite' }}>
                            <animateTransform
                                attributeName="transform"
                                type="rotate"
                                from={`0 ${C} ${C}`}
                                to={`360 ${C} ${C}`}
                                dur="6s"
                                repeatCount="indefinite"
                            />
                            <path
                                d={lightningOuterPath}
                                fill="none"
                                stroke="#C084FC"
                                strokeWidth={size === 'sm' ? 0.9 : 1.8}
                                strokeLinecap="round"
                                strokeLinejoin="miter"
                                filter="url(#lightningGlow)"
                            />

                            {/* 4 Tụ điểm Lôi Hoa / Tia Sét (Lightning Spark Nodes) */}
                            {orbs.map((orb, idx) => (
                                <g key={idx}>
                                    <circle
                                        cx={orb.cx}
                                        cy={orb.cy}
                                        r={size === 'sm' ? 1.3 : size === 'md' ? 2.4 : 3.0}
                                        fill="#FFE279"
                                        stroke="#FFFFFF"
                                        strokeWidth={1}
                                        style={{ filter: cultivationStyle.orbGlow }}
                                    />
                                    {size !== 'sm' && (
                                        <line
                                            x1={orb.cx - 3.5}
                                            y1={orb.cy}
                                            x2={orb.cx + 3.5}
                                            y2={orb.cy}
                                            stroke="#FFE279"
                                            strokeWidth={1.0}
                                        />
                                    )}
                                </g>
                            ))}
                        </g>

                        {/* Vòng Trận Pháp Cổ Phù Tử Kim bao bọc ngoài cùng quanh tâm (C, C) */}
                        <circle
                            cx={C}
                            cy={C}
                            r={sizeConfig.r3}
                            fill="none"
                            stroke="url(#qi-grad-a-4)"
                            strokeWidth={sizeConfig.stroke3}
                            strokeDasharray="14 7 3 7"
                            strokeLinecap="round"
                            className="opacity-80"
                        />
                    </>
                )}

                {/* ========================================================
                    HẠNG III: LÃO NÔNG (THÁI CỰC BÁT QUÁI LINH TRẬN HOÀNG KIM)
                   ======================================================== */}
                {level === 3 && (
                    <>
                        {/* Vòng 1: Linh quang ôm sát viền avatar */}
                        <circle
                            cx={C}
                            cy={C}
                            r={sizeConfig.r1}
                            fill="none"
                            stroke="url(#qi-grad-a-3)"
                            strokeWidth={sizeConfig.stroke1}
                            strokeLinecap="round"
                            className="opacity-95"
                        />

                        {/* Vòng 2: Trận Pháp Bát Quái Cổ Phù xoay ngược chiều quanh tâm (C, C) */}
                        <g>
                            <animateTransform
                                attributeName="transform"
                                type="rotate"
                                from={`360 ${C} ${C}`}
                                to={`0 ${C} ${C}`}
                                dur="16s"
                                repeatCount="indefinite"
                            />
                            <circle
                                cx={C}
                                cy={C}
                                r={sizeConfig.r2}
                                fill="none"
                                stroke="#FDE047"
                                strokeWidth={sizeConfig.stroke2}
                                strokeDasharray="8 6"
                                strokeLinecap="round"
                                className="opacity-90"
                            />

                            {/* 8 Quẻ Bát Quái Tu Tiên phân bố đều quanh viền */}
                            {size !== 'sm' && baguaTrigrams.map((trigram, idx) => {
                                const angle = (idx * 45 * Math.PI) / 180;
                                const x = C + sizeConfig.r2 * Math.cos(angle);
                                const y = C + sizeConfig.r2 * Math.sin(angle);
                                return (
                                    <text
                                        key={idx}
                                        x={x}
                                        y={y}
                                        textAnchor="middle"
                                        dominantBaseline="central"
                                        fill="#FDE047"
                                        fontSize={size === 'md' ? 7 : 9}
                                        fontWeight="bold"
                                        opacity="0.9"
                                    >
                                        {trigram}
                                    </text>
                                );
                            })}
                        </g>

                        {/* Vòng 3: Quỹ Đạo Kim Đan xoay thuận chiều quanh tâm (C, C) */}
                        <g>
                            <animateTransform
                                attributeName="transform"
                                type="rotate"
                                from={`0 ${C} ${C}`}
                                to={`360 ${C} ${C}`}
                                dur="14s"
                                repeatCount="indefinite"
                            />
                            <circle
                                cx={C}
                                cy={C}
                                r={sizeConfig.r3}
                                fill="none"
                                stroke="url(#qi-grad-a-3)"
                                strokeWidth={sizeConfig.stroke3}
                                strokeDasharray="12 6 3 6"
                                strokeLinecap="round"
                                className="opacity-90"
                            />

                            {/* 3 Hạt Kim Đan hộ thể */}
                            {orbs.map((orb, idx) => (
                                <circle
                                    key={idx}
                                    cx={orb.cx}
                                    cy={orb.cy}
                                    r={size === 'sm' ? 1.4 : size === 'md' ? 2.4 : 3.0}
                                    fill={cultivationStyle.orbColor}
                                    stroke="#FFFFFF"
                                    strokeWidth={1}
                                    style={{ filter: cultivationStyle.orbGlow }}
                                />
                            ))}
                        </g>
                    </>
                )}

                {/* ========================================================
                    HẠNG II: CAO THỦ CÀY (HÀN BĂNG LAM TINH TRẬN)
                   ======================================================== */}
                {level === 2 && (
                    <>
                        {/* Vòng 1: Viền băng lam ôm sát */}
                        <circle
                            cx={C}
                            cy={C}
                            r={sizeConfig.r1}
                            fill="none"
                            stroke="url(#qi-grad-a-2)"
                            strokeWidth={sizeConfig.stroke1}
                            strokeLinecap="round"
                            className="opacity-95"
                        />

                        {/* Vòng 2: Đa giác Tinh Thể Băng Tuyết xoay đảo chiều quanh tâm (C, C) */}
                        <g>
                            <animateTransform
                                attributeName="transform"
                                type="rotate"
                                from={`360 ${C} ${C}`}
                                to={`0 ${C} ${C}`}
                                dur="12s"
                                repeatCount="indefinite"
                            />
                            <polygon
                                points={frostPoints}
                                fill="none"
                                stroke="#38BDF8"
                                strokeWidth={size === 'sm' ? 0.9 : 1.6}
                                strokeLinejoin="round"
                                className="opacity-90"
                            />
                        </g>

                        {/* Vòng 3: Quỹ đạo Sapphire Lam Tinh xoay thuận chiều quanh tâm (C, C) */}
                        <g>
                            <animateTransform
                                attributeName="transform"
                                type="rotate"
                                from={`0 ${C} ${C}`}
                                to={`360 ${C} ${C}`}
                                dur="15s"
                                repeatCount="indefinite"
                            />
                            <circle
                                cx={C}
                                cy={C}
                                r={sizeConfig.r3}
                                fill="none"
                                stroke="url(#qi-grad-b-2)"
                                strokeWidth={sizeConfig.stroke3}
                                strokeDasharray="10 5"
                                strokeLinecap="round"
                                className="opacity-85"
                            />

                            {/* 2 Lam Tinh Bảo Thạch */}
                            {orbs.map((orb, idx) => (
                                <g key={idx}>
                                    <rect
                                        x={orb.cx - (size === 'sm' ? 1.2 : 2.5)}
                                        y={orb.cy - (size === 'sm' ? 1.2 : 2.5)}
                                        width={size === 'sm' ? 2.4 : 5}
                                        height={size === 'sm' ? 2.4 : 5}
                                        transform={`rotate(45 ${orb.cx} ${orb.cy})`}
                                        fill="#38BDF8"
                                        stroke="#FFFFFF"
                                        strokeWidth={1}
                                        style={{ filter: cultivationStyle.orbGlow }}
                                    />
                                </g>
                            ))}
                        </g>
                    </>
                )}

                {/* ========================================================
                    HẠNG I: THỢ CÀY (THANH MỘC LINH QUANG DỊU MÁT)
                   ======================================================== */}
                {level === 1 && (
                    <>
                        {/* Vòng 1: Viền mầm ngọc bích ôm sát avatar */}
                        <circle
                            cx={C}
                            cy={C}
                            r={sizeConfig.r1}
                            fill="none"
                            stroke="url(#qi-grad-a-1)"
                            strokeWidth={sizeConfig.stroke1}
                            strokeLinecap="round"
                            className="opacity-95"
                        />

                        {/* Vòng 2: Sinh mệnh linh khí êm dịu xoay thuận chiều quanh tâm (C, C) */}
                        <g>
                            <animateTransform
                                attributeName="transform"
                                type="rotate"
                                from={`0 ${C} ${C}`}
                                to={`360 ${C} ${C}`}
                                dur="18s"
                                repeatCount="indefinite"
                            />
                            <circle
                                cx={C}
                                cy={C}
                                r={sizeConfig.r2}
                                fill="none"
                                stroke="#6EE7B7"
                                strokeWidth={sizeConfig.stroke2}
                                strokeDasharray="6 6"
                                strokeLinecap="round"
                                className="opacity-85"
                            />

                            {/* 1 Mộc Linh Châu thuần khiết */}
                            {orbs.map((orb, idx) => (
                                <circle
                                    key={idx}
                                    cx={orb.cx}
                                    cy={orb.cy}
                                    r={size === 'sm' ? 1.3 : 2.4}
                                    fill="#6EE7B7"
                                    stroke="#FFFFFF"
                                    strokeWidth={1}
                                    style={{ filter: cultivationStyle.orbGlow }}
                                />
                            ))}
                        </g>
                    </>
                )}
            </svg>

            {/* 3. TÂM ĐIỂM AVATAR - Căn chính giữa khung hình học (Perfect Center) */}
            <div
                className={`relative rounded-full transition-all duration-300 flex items-center justify-center ${sizeConfig.avatarDim} ${cultivationStyle.innerBezel}`}
            >
                <div
                    className={`rounded-full overflow-hidden border-2 border-[#181916] flex items-center justify-center font-display font-black relative z-10 w-full h-full ${
                        level === 4
                            ? 'bg-gradient-to-tr from-[#241e12] to-[#121310] text-amber-300'
                            : level === 3
                            ? 'bg-gradient-to-tr from-[#241e15] to-[#161713] text-amber-400'
                            : level === 2
                            ? 'bg-gradient-to-tr from-[#141b24] to-[#101318] text-blue-400'
                            : 'bg-gradient-to-tr from-[#132219] to-[#0f1511] text-emerald-400'
                    }`}
                >
                    {avatarSrc ? (
                        <img
                            src={avatarSrc}
                            alt={name}
                            className="w-full h-full object-cover rounded-full"
                            onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = '/logo.png';
                            }}
                        />
                    ) : (
                        <span className={sizeConfig.textAvatar}>
                            {name ? name.trim().charAt(0).toUpperCase() : 'U'}
                        </span>
                    )}
                </div>

                {/* 4. PHÁP BẢO / THẦN MIỆN TU TIÊN LƠ LỬNG TRÊN ĐỈNH (Hovering Centered Crest) */}
                {shouldShowCrown && (
                    <span
                        className={`absolute z-30 select-none pointer-events-none transition-transform ${cultivationStyle.topClass} ${sizeConfig.crownClass}`}
                        style={{
                            left: '50%',
                            transform: 'translateX(-50%)',
                            animation: 'tuTienFloatCrown 3s ease-in-out infinite'
                        }}
                        title={cultivationStyle.realmTitle}
                    >
                        {cultivationStyle.topIcon}
                    </span>
                )}

                {/* 5. HUY HIỆU ĐẠO ẤN GÓC DƯỚI (Bottom-Right Realm Seal) */}
                {showTierBadge && (
                    <span
                        className={`absolute z-20 rounded-full border-2 flex items-center justify-center shadow-xl font-black select-none pointer-events-none transition-transform hover:scale-115 ${cultivationStyle.badgeBg} ${sizeConfig.badgeClass}`}
                        title={tierInfo.name}
                    >
                        {frame.cornerBadge}
                    </span>
                )}
            </div>
        </div>
    );
}
