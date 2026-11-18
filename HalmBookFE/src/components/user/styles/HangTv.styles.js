export const tiersTailwindConfig = {
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                sans: ['var(--font-ui)', 'sans-serif'],
                display: ['var(--font-display)', 'sans-serif'],
                metadata: ['var(--font-metadata)', 'sans-serif'],
                editorial: ['var(--font-editorial)', 'sans-serif'],
            },
            colors: {
                paper: {
                    50: '#FAF8F5',
                    100: '#F5F2EB',
                    200: '#EAE5D9',
                    DEFAULT: '#F7F4EE',
                    surface: '#FFFEFA',
                    border: '#E3DDD0',
                },
                ink: {
                    50: '#F5F5F4',
                    300: '#A8A6A1',
                    muted: '#66645E',
                    DEFAULT: '#1E1F1D',
                    pure: '#111210',
                },
                wine: {
                    DEFAULT: '#8E3038',
                    light: '#A83B46',
                    dark: '#6F252C',
                },
                gold: {
                    DEFAULT: '#B8860B',
                    light: '#D4AF37',
                },
                night: {
                    bg: '#111210',
                    surface: '#181916',
                    card: '#20221E',
                    border: '#2C2E29',
                    text: '#EDE9DF',
                    muted: '#96938B',
                }
            }
        }
    }
};

export const inlinePageStyle1 = String.raw`
        /* ========================================================
           TYPOGRAPHY & CSS VARIABLES (ĐỒNG BỘ TRANG CHỦ & ƯU ĐÃI)
           ======================================================== */
        :root {
            --font-display: "Inter", sans-serif;
            --font-ui: "Inter", sans-serif;
            --font-metadata: "Roboto", sans-serif;
            --font-editorial: "Open Sans", sans-serif;
        }

        html {
            scroll-behavior: smooth;
        }

        .tiers-page {
            font-family: var(--font-ui);
            background-color: #F7F4EE;
            color: #1E1F1D;
            -webkit-font-smoothing: antialiased;
        }

        html.dark .tiers-page {
            background-color: #111210 !important;
            color: #EDE9DF !important;
        }

        /* Light Mode Specific Overrides */
        html:not(.dark) .tiers-page [class~="bg-paper"] { background-color: #F7F4EE; }
        html:not(.dark) .tiers-page [class~="bg-paper-surface"] { background-color: #FFFEFA; }
        html:not(.dark) .tiers-page [class~="bg-paper-200"] { background-color: #EAE5D9; }
        html:not(.dark) .tiers-page [class~="bg-paper-200/70"] { background-color: rgb(234 229 217 / 0.7); }
        html:not(.dark) .tiers-page [class~="bg-wine"] { background-color: #8E3038; }
        html:not(.dark) .tiers-page [class~="bg-wine/10"] { background-color: rgb(142 48 56 / 0.1); }
        html:not(.dark) .tiers-page [class~="bg-wine/20"] { background-color: rgb(142 48 56 / 0.2); }
        html:not(.dark) .tiers-page [class~="bg-gold"] { background-color: #B8860B; }
        html:not(.dark) .tiers-page [class~="bg-gold/5"] { background-color: rgb(184 134 11 / 0.05); }
        html:not(.dark) .tiers-page [class~="bg-gold/10"] { background-color: rgb(184 134 11 / 0.1); }
        html:not(.dark) .tiers-page [class~="bg-gold/15"] { background-color: rgb(184 134 11 / 0.15); }

        html:not(.dark) .tiers-page [class~="text-ink"] { color: #1E1F1D; }
        html:not(.dark) .tiers-page [class~="text-ink/80"] { color: rgb(30 31 29 / 0.8); }
        html:not(.dark) .tiers-page [class~="text-ink-muted"] { color: #66645E; }
        html:not(.dark) .tiers-page [class~="border-paper-border"] { border-color: #E3DDD0; }

        /* Dark Mode Specific Overrides - Tuyệt đối không bị hắt sáng khi F5 */
        html.dark .tiers-page [class*="bg-paper-surface"],
        html.dark .tiers-page .user-sidebar-card,
        html.dark .tiers-page .user-sidebar-box {
            background-color: #181916 !important;
            border-color: #2C2E29 !important;
        }
        html.dark .tiers-page [class*="bg-paper"]:not([class*="bg-paper-200"]) {
            background-color: #111210 !important;
        }
        html.dark .tiers-page [class*="text-ink"]:not([class*="text-ink-muted"]) {
            color: #EDE9DF !important;
        }
        html.dark .tiers-page [class*="text-ink-muted"] {
            color: #96938B !important;
        }
        html.dark .tiers-page [class*="border-paper-border"] {
            border-color: #2C2E29 !important;
        }
        .tiers-page [class~="text-wine"] { color: #8E3038; }
        .tiers-page [class~="text-gold"] { color: #B8860B; }
        .tiers-page [class~="text-night-bg"] { color: #111210; }
        .tiers-page [class~="text-night-text"] { color: #EDE9DF; }
        .tiers-page [class~="text-night-muted"] { color: #96938B; }
        .tiers-page [class~="border-paper-border"] { border-color: #E3DDD0; }
        .tiers-page [class~="border-night-border"] { border-color: #2C2E29; }
        .tiers-page [class~="border-wine/30"] { border-color: rgb(142 48 56 / 0.3); }
        .tiers-page [class~="border-wine/40"] { border-color: rgb(142 48 56 / 0.4); }
        .tiers-page [class~="border-gold"] { border-color: #B8860B; }
        .tiers-page [class~="border-gold/30"] { border-color: rgb(184 134 11 / 0.3); }
        .tiers-page [class~="border-gold/40"] { border-color: rgb(184 134 11 / 0.4); }

        .tiers-page [class~="from-wine"][class~="to-wine-light"] {
            background-image: linear-gradient(to top right, #8E3038, #A83B46);
        }
        .tiers-page [class~="bg-gradient-to-br"][class~="from-wine/5"][class~="to-gold/5"] {
            background-image: linear-gradient(to bottom right, rgb(142 48 56 / 0.05), #FFFEFA, rgb(184 134 11 / 0.05));
        }
        .tiers-page [class~="bg-gradient-to-br"][class~="from-night-card"][class~="to-night-surface"] {
            background-image: linear-gradient(to bottom right, #20221E, #1c1813, #181916);
        }

        .tiers-page [class~="hover:bg-paper"]:hover { background-color: #F7F4EE; }
        .tiers-page [class~="hover:bg-paper-200"]:hover { background-color: #EAE5D9; }
        .tiers-page [class~="hover:bg-paper-border"]:hover { background-color: #E3DDD0; }
        .tiers-page [class~="hover:bg-wine"]:hover { background-color: #8E3038; }
        .tiers-page [class~="hover:bg-wine-dark"]:hover { background-color: #6F252C; }
        .tiers-page [class~="hover:bg-gold"]:hover { background-color: #B8860B; }
        .tiers-page [class~="hover:bg-night-border"]:hover { background-color: #2C2E29; }
        .tiers-page [class~="hover:text-ink"]:hover { color: #1E1F1D; }
        .tiers-page [class~="hover:text-wine"]:hover { color: #8E3038; }
        .tiers-page [class~="hover:text-gold"]:hover { color: #B8860B; }
        .tiers-page [class~="group-hover:text-wine"]:hover,
        .tiers-page .group:hover [class~="group-hover:text-wine"] { color: #8E3038; }
        .tiers-page [class~="focus:border-wine"]:focus { border-color: #8E3038; }
        .tiers-page [class~="placeholder-ink-muted/80"]::placeholder { color: rgb(102 100 94 / 0.8); }
        .tiers-page [class~="placeholder-night-muted"]::placeholder { color: #96938B; }
        .tiers-page [class~="after:bg-wine"]::after { background-color: #8E3038; }
        .tiers-page [class~="divide-paper-border"] > :not([hidden]) ~ :not([hidden]) { border-color: #E3DDD0; }

        html.dark .tiers-page [class~="dark:bg-gold"] { background-color: #B8860B; }
        html.dark .tiers-page [class~="dark:bg-gold/10"] { background-color: rgb(184 134 11 / 0.1); }
        html.dark .tiers-page [class~="dark:bg-gold/15"] { background-color: rgb(184 134 11 / 0.15); }
        html.dark .tiers-page [class~="dark:bg-gold/20"] { background-color: rgb(184 134 11 / 0.2); }
        html.dark .tiers-page [class~="dark:bg-night-bg"] { background-color: #111210; }
        html.dark .tiers-page [class~="dark:bg-night-card"] { background-color: #20221E; }
        html.dark .tiers-page [class~="dark:bg-night-surface"] { background-color: #181916; }
        html.dark .tiers-page [class~="dark:bg-night-border"] { background-color: #2C2E29; }
        html.dark .tiers-page [class*="user-sidebar-card"],
        html.dark .tiers-page [class*="dark:bg-night-surface"],
        html.dark .tiers-page [class*="dark:bg-[#181916]"] {
            background-color: #181916 !important;
            border-color: #2C2E29 !important;
        }
        html.dark .tiers-page [class*="user-sidebar-box"] {
            background-color: #181916 !important;
            border-color: #2C2E29 !important;
        }
        html.dark .tiers-page [class*="user-sidebar-card"] h2,
        html.dark .tiers-page [class*="user-sidebar-card"] [class*="font-display"],
        html.dark .tiers-page [class*="user-sidebar-box"] span.text-2xl,
        html.dark .tiers-page [class*="user-sidebar-box"] span:first-child {
            color: #EDE9DF !important;
        }
        html.dark .tiers-page [class*="user-sidebar-box"] span:last-child,
        html.dark .tiers-page [class*="user-sidebar-card"] p {
            color: #9CA3AF !important;
        }
        html.dark .tiers-page [class*="dark:border-night-border"],
        html.dark .tiers-page [class*="dark:border-[#2C2E29]"] {
            border-color: #2C2E29 !important;
        }
        html.dark .tiers-page [class*="dark:bg-[#242116]"] {
            background-color: #242116 !important;
        }
        html.dark .tiers-page [class*="dark:border-[#52441D]"] {
            border-color: #52441D !important;
        }
        html.dark .tiers-page [class~="bg-paper-surface"] {
            background-color: #181916 !important;
        }
        html.dark .tiers-page [class~="bg-paper"] {
            background-color: #181916 !important;
        }
        html.dark .tiers-page [class~="border-paper-border"] {
            border-color: #2C2E29 !important;
        }
        html.dark .tiers-page [class~="text-ink"],
        html.dark .tiers-page .text-ink {
            color: #EDE9DF !important;
        }
        html.dark .tiers-page [class~="text-ink-muted"],
        html.dark .tiers-page .text-ink-muted {
            color: #9CA3AF !important;
        }
        html.dark .tiers-page [class~="dark:text-gold"] { color: #B8860B; }
        html.dark .tiers-page [class~="dark:text-night-bg"] { color: #111210; }
        html.dark .tiers-page [class~="dark:text-night-muted"] { color: #96938B; }
        html.dark .tiers-page [class~="dark:text-night-text"] { color: #EDE9DF; }
        html.dark .tiers-page [class~="dark:border-night-border"] { border-color: #2C2E29; }
        html.dark .tiers-page [class~="dark:border-night-card"] { border-color: #20221E; }
        html.dark .tiers-page [class~="dark:border-gold/40"] { border-color: rgb(184 134 11 / 0.4); }
        html.dark .tiers-page [class~="dark:from-gold"][class~="dark:to-gold-light"] {
            background-image: linear-gradient(to top right, #B8860B, #D4AF37);
        }
        html.dark .tiers-page [class~="dark:from-night-card"][class~="dark:to-night-surface"] {
            background-image: linear-gradient(to bottom right, #20221E, #181916);
        }
        html.dark .tiers-page [class~="dark:after:bg-gold"]::after { background-color: #B8860B; }
        html.dark .tiers-page [class~="dark:divide-night-border"] > :not([hidden]) ~ :not([hidden]) { border-color: #2C2E29; }
        html.dark .tiers-page [class~="dark:hover:bg-gold"]:hover { background-color: #B8860B; }
        html.dark .tiers-page [class~="dark:hover:bg-night-border"]:hover { background-color: #2C2E29; }
        html.dark .tiers-page [class~="dark:hover:bg-night-card"]:hover { background-color: #20221E; }
        html.dark .tiers-page [class~="dark:hover:bg-night-surface"]:hover { background-color: #181916; }
        html.dark .tiers-page [class~="dark:hover:bg-night-surface/50"]:hover { background-color: rgb(24 25 22 / 0.5); }
        html.dark .tiers-page [class~="dark:hover:text-gold"]:hover { color: #B8860B; }
        html.dark .tiers-page [class~="dark:hover:text-night-bg"]:hover { color: #111210; }
        html.dark .tiers-page [class~="dark:hover:text-night-text"]:hover { color: #EDE9DF; }
        html.dark .tiers-page [class~="dark:hover:border-gold"]:hover { border-color: #B8860B; }
        html.dark .tiers-page [class~="dark:focus:border-gold"]:focus { border-color: #D4AF37; }
        html.dark .tiers-page [class~="dark:group-hover:text-gold"]:hover,
        html.dark .tiers-page .group:hover [class~="dark:group-hover:text-gold"] { color: #D4AF37; }

        .font-display-hero {
            font-family: var(--font-display);
            font-weight: 900;
            letter-spacing: -0.03em;
        }

        .font-editorial-body {
            font-family: var(--font-editorial);
            line-height: 1.7;
        }

        .font-metadata-spec {
            font-family: var(--font-metadata);
        }

        /* Subtle paper grain texture overlay */
        .paper-grain {
            background-image: radial-gradient(rgba(30, 31, 29, 0.04) 1px, transparent 1px);
            background-size: 28px 28px;
        }
        .dark .paper-grain {
            background-image: radial-gradient(rgba(237, 233, 223, 0.04) 1px, transparent 1px);
            background-size: 28px 28px;
        }

        /* Starry sky overlay for dark mode */
        #starry-background {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1;
            opacity: 0;
            transition: opacity 0.6s ease;
        }
        .dark #starry-background {
            opacity: 1;
        }
        .star {
            position: absolute;
            background-color: #EDE9DF;
            border-radius: 50%;
            pointer-events: none;
        }
        @keyframes starTwinkle {
            0%, 100% { opacity: 0.2; transform: scale(0.8); }
            50% { opacity: 0.9; transform: scale(1.2); }
        }

        /* Navbar Scrolled Glassmorphism */
        #navbar.scrolled {
            background: rgba(247, 244, 238, 0.92);
            backdrop-filter: blur(14px);
            -webkit-backdrop-filter: blur(14px);
            border-bottom: 1px solid rgba(227, 221, 208, 0.7);
            box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.05);
        }
        .dark #navbar.scrolled {
            background: rgba(17, 18, 16, 0.92);
            border-bottom: 1px solid rgba(44, 46, 41, 0.8);
            box-shadow: 0 4px 24px -2px rgba(0, 0, 0, 0.4);
        }

        /* Potato Badge */
        .potato-badge {
            display: inline-flex;
            align-items: center;
            gap: 0.35rem;
            background: rgba(184, 134, 11, 0.12);
            color: #B8860B;
            border: 1px solid rgba(184, 134, 11, 0.25);
            border-radius: 9999px;
            padding: 0.25rem 0.65rem;
            font-size: 0.8rem;
            font-weight: 700;
            font-family: var(--font-metadata);
        }
        .dark .potato-badge {
            background: rgba(212, 175, 55, 0.15);
            color: #D4AF37;
            border-color: rgba(212, 175, 55, 0.3);
        }

        /* Chatbot Modal Styling */
        #chatbot-container {
            position: fixed;
            bottom: 24px;
            right: 24px;
            z-index: 50;
        }
        #chat-window {
            position: absolute;
            bottom: 70px;
            right: 0;
            width: 360px;
            height: 480px;
            max-width: calc(100vw - 32px);
            background: #181916;
            border: 1px solid #2C2E29;
            border-radius: 16px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.6);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            transform: scale(0.9) translateY(20px);
            opacity: 0;
            pointer-events: none;
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            transform-origin: bottom right;
        }
        #chat-window.show {
            transform: scale(1) translateY(0);
            opacity: 1;
            pointer-events: auto;
        }

        /* Floating Scroll to Top */
        #btnScrollToTop {
            position: fixed;
            bottom: 24px;
            left: 24px;
            z-index: 40;
            width: 44px;
            height: 44px;
            border-radius: 50%;
            background: #FFFEFA;
            color: #1E1F1D;
            border: 1px solid #E3DDD0;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 14px rgba(0,0,0,0.08);
            cursor: pointer;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
        }
        .dark #btnScrollToTop {
            background: #20221E;
            color: #EDE9DF;
            border-color: #2C2E29;
            box-shadow: 0 4px 14px rgba(0,0,0,0.4);
        }
        #btnScrollToTop.show {
            opacity: 1;
            visibility: visible;
        }
        #btnScrollToTop:hover {
            transform: translateY(-3px);
            background: #8E3038;
            color: #fff;
            border-color: #8E3038;
        }
        .dark #btnScrollToTop:hover {
            background: #B8860B;
            color: #111210;
            border-color: #B8860B;
        }

        /* Toast Container */
        #toast-notification {
            position: fixed;
            top: 24px;
            right: 24px;
            z-index: 1000;
            transform: translateX(120%);
            transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }
        #toast-notification.show {
            transform: translateX(0);
        }

        /* Digital Membership Card Holographic Look */
        .member-card-3d {
            background: linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #1e1b4b 100%);
            position: relative;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 20px 35px -10px rgba(15, 23, 42, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.2);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .dark .member-card-3d {
            background: linear-gradient(135deg, #1c1917 0%, #0c0a09 60%, #292524 100%);
            box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.7), inset 0 1px 1px rgba(212, 175, 55, 0.25);
        }
        .member-card-3d:hover {
            transform: translateY(-4px);
            box-shadow: 0 25px 45px -10px rgba(0, 0, 0, 0.5);
        }
        .member-card-3d::after {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(125deg, transparent 30%, rgba(255, 255, 255, 0.08) 45%, rgba(255, 255, 255, 0.15) 50%, rgba(255, 255, 255, 0.08) 55%, transparent 70%);
            pointer-events: none;
        }

        /* Progress Bar Animation */
        @keyframes shineStripe {
            0% { background-position: 0 0; }
            100% { background-position: 40px 0; }
        }
        .progress-striped {
            background-size: 20px 20px;
            background-image: linear-gradient(45deg, rgba(255, 255, 255, 0.15) 25%, transparent 25%, transparent 50%, rgba(255, 255, 255, 0.15) 50%, rgba(255, 255, 255, 0.15) 75%, transparent 75%, transparent);
            animation: shineStripe 2s linear infinite;
        }

        /* Accordion Chevron Transition */
        .faq-item.active .faq-chevron {
            transform: rotate(180deg);
        }
        .faq-content {
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease;
            opacity: 0;
        }
        .faq-item.active .faq-content {
            max-height: 300px;
            opacity: 1;
        }
    `;
