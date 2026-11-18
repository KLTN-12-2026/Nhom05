export const profileTailwindConfig = {
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
           TYPOGRAPHY & CSS VARIABLES (ĐỒNG BỘ TRANG CHỦ)
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

        body {
            font-family: var(--font-ui);
            background-color: #F7F4EE;
            color: #1E1F1D;
            overflow-x: hidden;
            -webkit-font-smoothing: antialiased;
            transition: background-color 0.4s ease, color 0.4s ease;
        }

        .dark body {
            background-color: #111210;
            color: #EDE9DF;
        }

        .font-display-hero {
            font-family: var(--font-display);
            font-weight: 900;
            letter-spacing: -0.03em;
        }

        .font-editorial-body {
            font-family: var(--font-editorial);
            line-height: 1.65;
        }

        .font-metadata-spec {
            font-family: var(--font-metadata);
        }

        /* Paper grain texture */
        .paper-grain {
            background-image: radial-gradient(rgba(30, 31, 29, 0.04) 1px, transparent 1px);
            background-size: 28px 28px;
        }
        .dark .paper-grain {
            background-image: radial-gradient(rgba(237, 233, 223, 0.04) 1px, transparent 1px);
            background-size: 28px 28px;
        }

        .profile-page {
            background-color: #F7F4EE;
            color: #1E1F1D;
        }
        .dark .profile-page {
            background-color: #111210;
            color: #EDE9DF;
        }

        html:not(.dark) [class~="bg-paper"] { background-color: #F7F4EE; }
        html:not(.dark) [class~="bg-paper-surface"] { background-color: #FFFEFA; }
        html:not(.dark) [class~="bg-paper-200"] { background-color: #EAE5D9; }
        html:not(.dark) [class~="bg-paper-200/70"] { background-color: rgb(234 229 217 / 0.7); }
        html:not(.dark) [class~="bg-wine"] { background-color: #8E3038; }
        html:not(.dark) [class~="bg-wine/10"] { background-color: rgb(142 48 56 / 0.1); }
        html:not(.dark) [class~="bg-wine/20"] { background-color: rgb(142 48 56 / 0.2); }
        html:not(.dark) [class~="bg-gold"] { background-color: #B8860B; }
        html:not(.dark) [class~="bg-gold/15"] { background-color: rgb(184 134 11 / 0.15); }

        html:not(.dark) [class~="text-ink"] { color: #1E1F1D; }
        html:not(.dark) [class~="text-ink/80"] { color: rgb(30 31 29 / 0.8); }
        html:not(.dark) [class~="text-ink-muted"] { color: #66645E; }
        html:not(.dark) [class~="text-ink-muted/60"] { color: rgb(102 100 94 / 0.6); }
        html:not(.dark) [class~="border-paper-border"] { border-color: #E3DDD0; }
        [class~="text-wine"] { color: #8E3038; }
        [class~="text-gold"] { color: #B8860B; }
        [class~="text-night-text"] { color: #EDE9DF; }
        [class~="text-night-muted"] { color: #96938B; }

        [class~="border-paper-border"] { border-color: #E3DDD0; }
        [class~="border-night-border"] { border-color: #2C2E29; }
        [class~="border-wine/25"] { border-color: rgb(142 48 56 / 0.25); }
        [class~="border-wine/30"] { border-color: rgb(142 48 56 / 0.3); }
        [class~="border-wine/40"] { border-color: rgb(142 48 56 / 0.4); }

        [class~="from-wine"][class~="to-wine-light"] {
            background-image: linear-gradient(to top right, #8E3038, #A83B46);
        }

        [class~="hover:bg-paper-200"]:hover { background-color: #EAE5D9; }
        [class~="hover:bg-night-border"]:hover { background-color: #2C2E29; }
        [class~="hover:bg-wine-dark"]:hover { background-color: #6F252C; }
        [class~="hover:text-ink"]:hover { color: #1E1F1D; }
        [class~="hover:text-wine"]:hover { color: #8E3038; }
        [class~="hover:text-gold"]:hover { color: #B8860B; }
        [class~="group-hover:text-wine"]:hover,
        .group:hover [class~="group-hover:text-wine"] { color: #8E3038; }
        [class~="focus:border-wine"]:focus { border-color: #8E3038; }
        [class~="placeholder-ink-muted/80"]::placeholder { color: rgb(102 100 94 / 0.8); }
        [class~="placeholder-night-muted"]::placeholder { color: #96938B; }

        html.dark [class~="dark:bg-gold"] { background-color: #B8860B; }
        html.dark [class~="dark:bg-gold/10"] { background-color: rgb(184 134 11 / 0.1); }
        html.dark [class~="dark:bg-gold/15"] { background-color: rgb(184 134 11 / 0.15); }
        html.dark [class~="dark:bg-night-bg"] { background-color: #111210; }
        html.dark [class~="dark:bg-night-card"] { background-color: #20221E; }
        html.dark [class~="dark:bg-night-surface"] { background-color: #181916; }
        html.dark [class*="user-sidebar-card"],
        html.dark [class*="dark:bg-night-surface"],
        html.dark [class*="dark:bg-[#181916]"] {
            background-color: #181916 !important;
            border-color: #2C2E29 !important;
        }
        html.dark [class*="user-sidebar-box"] {
            background-color: #181916 !important;
            border-color: #2C2E29 !important;
        }
        html.dark [class*="user-sidebar-card"] h2,
        html.dark [class*="user-sidebar-card"] [class*="font-display"],
        html.dark [class*="user-sidebar-box"] span.text-2xl,
        html.dark [class*="user-sidebar-box"] span:first-child {
            color: #EDE9DF !important;
        }
        html.dark [class*="user-sidebar-box"] span:last-child,
        html.dark [class*="user-sidebar-card"] p {
            color: #9CA3AF !important;
        }
        html.dark [class*="dark:border-night-border"],
        html.dark [class*="dark:border-[#2C2E29]"] {
            border-color: #2C2E29 !important;
        }
        html.dark [class*="dark:bg-[#242116]"] {
            background-color: #242116 !important;
        }
        html.dark [class*="dark:border-[#52441D]"] {
            border-color: #52441D !important;
        }
        html.dark [class~="bg-paper-surface"] {
            background-color: #181916 !important;
        }
        html.dark [class~="bg-paper"] {
            background-color: #111210 !important;
        }
        html.dark [class~="border-paper-border"] {
            border-color: #2C2E29 !important;
        }
        html.dark [class~="text-ink"],
        html.dark .text-ink {
            color: #EDE9DF !important;
        }
        html.dark [class~="text-ink-muted"],
        html.dark .text-ink-muted {
            color: #9CA3AF !important;
        }
        html.dark [class~="dark:text-gold"] { color: #B8860B; }
        html.dark [class~="dark:text-night-bg"] { color: #111210; }
        html.dark [class~="dark:text-night-muted"] { color: #96938B; }
        html.dark [class~="dark:text-night-muted/60"] { color: rgb(150 147 139 / 0.6); }
        html.dark [class~="dark:text-night-text"] { color: #EDE9DF; }
        html.dark [class~="dark:border-night-border"] { border-color: #2C2E29; }
        html.dark [class~="dark:border-night-card"] { border-color: #20221E; }
        html.dark [class~="dark:border-gold/30"] { border-color: rgb(184 134 11 / 0.3); }
        html.dark [class~="dark:border-gold/40"] { border-color: rgb(184 134 11 / 0.4); }
        html.dark [class~="dark:from-gold"][class~="dark:to-gold-light"] {
            background-image: linear-gradient(to top right, #B8860B, #D4AF37);
        }

        html.dark [class~="dark:hover:bg-night-card"]:hover { background-color: #20221E; }
        html.dark [class~="dark:hover:bg-night-surface"]:hover { background-color: #181916; }
        html.dark [class~="dark:hover:text-gold"]:hover { color: #B8860B; }
        html.dark [class~="dark:hover:text-night-text"]:hover { color: #EDE9DF; }
        html.dark [class~="dark:focus:border-gold"]:focus { border-color: #D4AF37; }
        html.dark [class~="dark:group-hover:text-gold"]:hover,
        html.dark .group:hover [class~="dark:group-hover:text-gold"] { color: #D4AF37; }

        /* ========================================================
           DARK MODE FIX FOR FOOTER
           ======================================================== */
        html.dark footer {
            background-color: #111210 !important;
            color: #EDE9DF !important;
            border-color: #2C2E29 !important;
        }
        html.dark footer h2 {
            color: #D4AF37 !important;
            border-color: #2C2E29 !important;
        }
        html.dark footer a {
            color: rgba(237, 233, 223, 0.85);
        }
        html.dark footer a:hover {
            color: #D4AF37 !important;
        }
        html.dark footer button {
            color: rgba(237, 233, 223, 0.85);
        }
        html.dark footer button:hover {
            color: #D4AF37 !important;
        }
        html.dark footer .text-\[\#5A564F\],
        html.dark footer .text-\[\#85817A\] {
            color: #96938B !important;
        }
        html.dark footer .border-\[\#E6E1D8\] {
            border-color: #2C2E29 !important;
        }
        html.dark footer .bg-white {
            background-color: #181916 !important;
            border-color: rgba(229, 169, 60, 0.3) !important;
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
            background-color: #fff;
            border-radius: 50%;
            pointer-events: none;
        }

        @keyframes starTwinkle {
            0%, 100% { opacity: 0.2; transform: scale(0.8); }
            50% { opacity: 0.9; transform: scale(1.3); }
        }

        /* Scrolled Header */
        #navbar {
            transition: transform 0.38s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease, padding 0.3s ease;
            will-change: transform;
        }
        #navbar.scrolled {
            background-color: rgba(247, 244, 238, 0.94);
            backdrop-filter: blur(16px);
            border-color: rgba(227, 221, 208, 0.8);
            box-shadow: 0 4px 20px -4px rgba(0,0,0,0.06);
        }
        .dark #navbar.scrolled {
            background-color: rgba(17, 18, 16, 0.94);
            border-color: rgba(44, 46, 41, 0.8);
            box-shadow: 0 4px 25px -4px rgba(0,0,0,0.5);
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
    `;
