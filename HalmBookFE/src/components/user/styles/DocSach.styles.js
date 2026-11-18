export const tailwindConfig = {
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                serif: ['"Playfair Display"', 'serif'],
                outfit: ['Outfit', 'sans-serif'],
                nunito: ['Nunito', 'sans-serif'],
                garamond: ['"Cormorant Garamond"', 'serif'],
                lora: ['Lora', 'serif'],
                roboto: ['Roboto', 'sans-serif'],
            },
            colors: {
                paper: {
                    50: '#FAF8F5',
                    100: '#F5F2EB',
                    200: '#EAE5D9',
                    DEFAULT: '#FAF7F2',
                    surface: '#FFFFFF',
                    border: '#E8E2D5',
                },
                ink: {
                    50: '#F5F5F4',
                    300: '#A8A6A1',
                    muted: '#6E6D7A',
                    DEFAULT: '#1E1F1D',
                    pure: '#111210',
                },
                wine: {
                    50: '#FDF2F4',
                    100: '#FCE7EB',
                    DEFAULT: '#8E3038',
                    light: '#A83B46',
                    dark: '#6F252C',
                },
                gold: {
                    50: '#FEFDF8',
                    100: '#FEF9E7',
                    DEFAULT: '#B8860B',
                    light: '#D4AF37',
                    accent: '#F59E0B',
                },
                night: {
                    bg: '#111210',
                    surface: '#1A1B18',
                    card: '#222420',
                    border: '#2F322B',
                    text: '#EDE9DF',
                    muted: '#9CA3AF',
                },
            },
        }
    }
};

export const externalStylesheets = [
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Nunito:wght@400;600;700;800;900&family=Outfit:wght@400;500;600;700;800;900&family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,500;1,600;1,700&family=Cormorant+Garamond:wght@400;600;700&family=Lora:ital,wght@0,400;0,700;1,400&family=Roboto:wght@400;500;700&display=swap',
    'https://unpkg.com/@phosphor-icons/web@2.1.1/src/bold/style.css',
    'https://unpkg.com/@phosphor-icons/web@2.1.1/src/regular/style.css',
    'https://unpkg.com/@phosphor-icons/web@2.1.1/src/fill/style.css',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
];

export const pageStyles = `
    .halm-reader-root {
        height: 100%;
        margin: 0;
        padding: 0;
        overflow: hidden;
        background-color: #FAF7F2;
        font-family: 'Inter', sans-serif;
        color: #1E1F1D;
    }

    /* HALM Signature Header Matching TrangChu / ChiTietSach */
    .halm-reader-header {
        background: linear-gradient(105deg, #171815 0%, #191916 67%, #21190f 100%) !important;
        backdrop-filter: blur(16px);
        border-bottom: 1px solid rgba(212, 175, 55, 0.45) !important;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5) !important;
        color: #f5f2e8 !important;
    }

    .halm-header-btn {
        background-color: #222420;
        border: 1px solid #2F322B;
        color: #EDE9DF;
        transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .halm-header-btn:hover {
        background-color: #2C2E29;
        border-color: rgba(212, 175, 55, 0.6);
        color: #D4AF37;
        transform: translateY(-1px);
    }

    .sidebar-overlay {
        position: fixed;
        top: 56px;
        bottom: 0;
        right: 0;
        z-index: 1050; 
        transition: transform 0.38s cubic-bezier(0.16, 1, 0.3, 1);
        will-change: transform;
    }

    .sidebar-right-hidden { transform: translateX(110%); }
    .sidebar-left { left: 0; right: auto; }
    .sidebar-left-hidden { transform: translateX(-110%); }

    :fullscreen #headerHoverZone,
    body.is-fullscreen #headerHoverZone {
        display: block !important;
        z-index: 9990;
    }
    :fullscreen #mainHeader,
    body.is-fullscreen #mainHeader {
        position: fixed;
        top: 0; left: 0; width: 100%;
        transform: translateY(-100%);
        z-index: 9995;
    }
    :fullscreen #headerHoverZone:hover + #mainHeader,
    :fullscreen #mainHeader:hover,
    body.is-fullscreen #headerHoverZone:hover + #mainHeader,
    body.is-fullscreen #mainHeader:hover {
        transform: translateY(0);
    }
    :fullscreen .sidebar-overlay,
    body.is-fullscreen .sidebar-overlay {
        top: 0; 
        z-index: 10000;
    }

    /* Paper Themes */
    .theme-paper-default { 
        background-color: #FAF7F2; 
        color: #1E1F1D; 
    }
    
    .theme-paper-sepia {
        background-color: #F4ECD8;
        color: #3D2E1E;
    }

    .theme-paper-starry { 
        background-color: #111210; 
        color: #EDE9DF; 
    }

    /* Twinkling Star background matching TrangChu */
    .star {
        position: absolute;
        background-color: #ffffff;
        border-radius: 50%;
        pointer-events: none;
        animation: starTwinkle 4s ease-in-out infinite;
    }
    @keyframes starTwinkle {
        0%, 100% { opacity: 0.2; transform: scale(0.8); }
        50% { opacity: 0.9; transform: scale(1.3); }
    }

    /* Canvas Filters */
    .canvas-filter-starry {
        filter: invert(0.9) hue-rotate(180deg) brightness(0.95) contrast(0.92);
        border-radius: 4px;
        box-shadow: 0 12px 35px rgba(0,0,0,0.65);
    }

    .canvas-filter-sepia {
        filter: sepia(0.35) contrast(0.96) brightness(0.98);
        border-radius: 4px;
        box-shadow: 0 12px 30px rgba(61, 46, 30, 0.2);
    }

    .canvas-filter-default {
        filter: none;
        border-radius: 4px;
        box-shadow: 0 15px 35px rgba(0,0,0,0.12), 0 0 1px rgba(0,0,0,0.15);
    }

    /* HALM Signature Navigation Buttons (Glassmorphism + Gold/Wine) */
    .halm-nav-btn {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        width: 46px;
        height: 46px;
        background: rgba(26, 27, 24, 0.75);
        color: #D4AF37;
        border: 1px solid rgba(212, 175, 55, 0.35);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 40;
        transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        backdrop-filter: blur(8px);
        box-shadow: 0 8px 20px rgba(0,0,0,0.25);
    }

    .halm-nav-btn:hover:not(:disabled) {
        background-color: #8E3038;
        color: #FFFFFF;
        border-color: #A83B46;
        transform: translateY(-50%) scale(1.08);
        box-shadow: 0 10px 25px rgba(142, 48, 56, 0.4);
    }

    .halm-nav-btn:disabled {
        opacity: 0.18;
        cursor: not-allowed;
    }

    .halm-nav-btn.left { left: 20px; }
    .halm-nav-btn.right { right: 20px; }

    @media (max-width: 640px) {
        .halm-nav-btn { width: 38px; height: 38px; }
        .halm-nav-btn.left { left: 8px; }
        .halm-nav-btn.right { right: 8px; }
    }

    /* Font List in Aa Menu */
    .font-list-item {
        padding: 9px 12px;
        border-radius: 10px;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 13px;
        font-weight: 600;
        color: #9CA3AF;
        border: 1px solid transparent;
    }
    .font-list-item:hover {
        background-color: #222420;
        color: #EDE9DF;
    }
    .font-list-item.active {
        background-color: rgba(142, 48, 56, 0.2);
        border-color: rgba(212, 175, 55, 0.5);
        color: #D4AF37;
    }
`;
