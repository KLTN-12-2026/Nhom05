export const myBooksTailwindConfig = {
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
           TYPOGRAPHY & CSS VARIABLES (ĐỒNG BỘ TRANG CHỦ & HỘI VIÊN)
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

        .my-books-page {
            font-family: var(--font-ui);
            background-color: #F7F4EE;
            color: #1E1F1D;
            -webkit-font-smoothing: antialiased;
            transition: background-color 0.4s ease, color 0.4s ease;
        }

        .dark .my-books-page {
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
        .my-books-page #starry-background {
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
        .dark .my-books-page #starry-background {
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
        .my-books-page #navbar.scrolled {
            background: rgba(247, 244, 238, 0.92);
            backdrop-filter: blur(14px);
            -webkit-backdrop-filter: blur(14px);
            border-bottom: 1px solid rgba(227, 221, 208, 0.7);
            box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.05);
        }
        .dark .my-books-page #navbar.scrolled {
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
        .dark .my-books-page .potato-badge {
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
        .my-books-page #btnScrollToTop {
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
        .dark .my-books-page #btnScrollToTop {
            background: #20221E;
            color: #EDE9DF;
            border-color: #2C2E29;
            box-shadow: 0 4px 14px rgba(0,0,0,0.4);
        }
        .my-books-page #btnScrollToTop.show {
            opacity: 1;
            visibility: visible;
        }
        .my-books-page #btnScrollToTop:hover {
            transform: translateY(-3px);
            background: #8E3038;
            color: #fff;
            border-color: #8E3038;
        }
        .dark .my-books-page #btnScrollToTop:hover {
            background: #B8860B;
            color: #111210;
            border-color: #B8860B;
        }

        /* Toast Container */
        .my-books-page #toast-notification {
            position: fixed;
            top: 24px;
            right: 24px;
            z-index: 1000;
            transform: translateX(120%);
            transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .my-books-page #toast-notification.show {
            transform: translateX(0);
        }

        /* Book 3D Spine and Card Elevation */
        .book-cover-elevated {
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.25), 0 8px 10px -6px rgba(0, 0, 0, 0.2);
            transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease;
        }
        .book-cover-elevated:hover {
            transform: translateY(-4px) scale(1.02);
            box-shadow: 0 20px 30px -10px rgba(0, 0, 0, 0.35);
        }

        /* Tab Pill Active Styles */
        .my-books-page .library-tab.active {
            background-color: #8E3038;
            color: #ffffff;
            border-color: #8E3038;
        }
        html.dark .my-books-page .library-tab.active {
            background-color: #B8860B;
            color: #111210;
            border-color: #B8860B;
            font-weight: 800;
        }

        .my-books-page [class~="hover:text-gold"]:hover { color: #B8860B; }
        .my-books-page [class~="hover:border-wine"]:hover { border-color: #8E3038; }
        .my-books-page [class~="after:bg-wine"]::after { background-color: #8E3038; }
        .my-books-page [class~="focus:ring-wine"]:focus { --tw-ring-color: #8E3038; }
        html.dark .my-books-page [class~="dark:after:bg-gold"]::after { background-color: #B8860B; }
        html.dark .my-books-page [class~="dark:hover:bg-gold-light"]:hover { background-color: #D4AF37; }
        html.dark .my-books-page [class~="dark:hover:border-gold"]:hover { border-color: #B8860B; }
        html.dark .my-books-page [class~="dark:hover:text-night-text"]:hover { color: #EDE9DF; }
    
html:not(.dark) .my-books-page [class~="bg-paper"]{background:#F7F4EE}
html:not(.dark) .my-books-page [class~="bg-paper-surface"]{background:#FFFEFA}
html:not(.dark) .my-books-page [class~="bg-paper-200"]{background:#EAE5D9}
html:not(.dark) .my-books-page [class~="bg-paper-200/70"]{background:rgb(234 229 217/.7)}
html:not(.dark) .my-books-page [class~="bg-wine"]{background:#8E3038}
html:not(.dark) .my-books-page [class~="bg-gold"]{background:#B8860B}
html:not(.dark) .my-books-page [class~="text-ink"]{color:#1E1F1D}
html:not(.dark) .my-books-page [class~="text-ink/80"]{color:rgb(30 31 29/.8)}
html:not(.dark) .my-books-page [class~="text-ink-muted"]{color:#66645E}
html:not(.dark) .my-books-page [class~="border-paper-border"]{border-color:#E3DDD0}
.my-books-page [class~="hover:bg-paper-200"]:hover{background:#EAE5D9}.my-books-page [class~="hover:bg-paper-border"]:hover{background:#E3DDD0}.my-books-page [class~="hover:bg-wine"]:hover{background:#8E3038}.my-books-page [class~="hover:bg-wine-dark"]:hover{background:#6F252C}.my-books-page [class~="hover:text-ink"]:hover{color:#1E1F1D}.my-books-page [class~="hover:text-wine"]:hover{color:#8E3038}.my-books-page [class~="focus:border-wine"]:focus{border-color:#8E3038}.my-books-page [class~="placeholder-ink-muted/80"]::placeholder{color:rgb(102 100 94/.8)}.my-books-page [class~="placeholder-night-muted"]::placeholder{color:#96938B}.my-books-page [class~="ring-wine"]{--tw-ring-color:#8E3038}.my-books-page [class~="potato-badge"]{background:rgb(184 134 11/.12);color:#B8860B;border-color:rgb(184 134 11/.25)}.my-books-page .library-tab.active{background:#8E3038;color:#fff;border-color:#8E3038}
html.dark .my-books-page [class~="dark:bg-gold"]{background:#B8860B}html.dark .my-books-page [class~="dark:bg-gold/10"]{background:rgb(184 134 11/.1)}html.dark .my-books-page [class~="dark:bg-gold/15"]{background:rgb(184 134 11/.15)}html.dark .my-books-page [class~="dark:bg-gold/20"]{background:rgb(184 134 11/.2)}html.dark .my-books-page [class~="dark:bg-night-bg"]{background:#111210}html.dark .my-books-page [class~="dark:bg-night-card"]{background:#20221E}html.dark .my-books-page [class~="dark:bg-night-surface"]{background:#181916}html.dark .my-books-page [class~="dark:bg-night-border"]{background:#2C2E29}html.dark .my-books-page [class~="dark:text-gold"]{color:#B8860B}html.dark .my-books-page [class~="dark:text-night-bg"]{color:#111210}html.dark .my-books-page [class~="dark:text-night-muted"]{color:#96938B}html.dark .my-books-page [class~="dark:text-night-text"]{color:#EDE9DF}html.dark .my-books-page [class~="dark:border-gold"]{border-color:#B8860B}html.dark .my-books-page [class~="dark:border-gold/40"]{border-color:rgb(184 134 11/.4)}html.dark .my-books-page [class~="dark:border-night-border"]{border-color:#2C2E29}html.dark .my-books-page [class~="dark:border-night-card"]{border-color:#20221E}html.dark .my-books-page [class~="dark:from-gold"][class~="dark:to-gold-light"]{background-image:linear-gradient(to right,#B8860B,#D4AF37)}html.dark .my-books-page [class~="dark:hover:bg-gold"]:hover{background:#B8860B}html.dark .my-books-page [class~="dark:hover:bg-night-card"]:hover{background:#20221E}html.dark .my-books-page [class~="dark:hover:bg-night-surface"]:hover{background:#181916}html.dark .my-books-page [class~="dark:hover:bg-night-border"]:hover{background:#2C2E29}html.dark .my-books-page [class~="dark:hover:text-gold"]:hover{color:#B8860B}html.dark .my-books-page [class~="dark:hover:text-night-bg"]:hover{color:#111210}html.dark .my-books-page [class~="dark:focus:border-gold"]:focus{border-color:#D4AF37}html.dark .my-books-page [class~="potato-badge"]{background:rgb(212 175 55/.15);color:#D4AF37;border-color:rgb(212 175 55/.3)}html.dark .my-books-page .library-tab.active{background:#B8860B;color:#111210;border-color:#B8860B;font-weight:800}
html.dark .my-books-page [class*="user-sidebar-card"],html.dark .my-books-page [class*="dark:bg-night-surface"],html.dark .my-books-page [class*="dark:bg-[#181916]"]{background-color:#181916!important;border-color:#2C2E29!important}
html.dark .my-books-page [class*="user-sidebar-box"]{background-color:#181916!important;border-color:#2C2E29!important}
html.dark .my-books-page [class*="user-sidebar-card"] h2,html.dark .my-books-page [class*="user-sidebar-card"] [class*="font-display"],html.dark .my-books-page [class*="user-sidebar-box"] span.text-2xl,html.dark .my-books-page [class*="user-sidebar-box"] span:first-child{color:#EDE9DF!important}
html.dark .my-books-page [class*="user-sidebar-box"] span:last-child,html.dark .my-books-page [class*="user-sidebar-card"] p{color:#9CA3AF!important}
html.dark .my-books-page [class*="dark:border-night-border"],html.dark .my-books-page [class*="dark:border-[#2C2E29]"]{border-color:#2C2E29!important}
html.dark .my-books-page [class*="dark:bg-[#242116]"]{background-color:#242116!important}
html.dark .my-books-page [class*="dark:border-[#52441D]"]{border-color:#52441D!important}
html.dark .my-books-page [class~="bg-paper-surface"]{background-color:#181916!important}
html.dark .my-books-page [class~="bg-paper"]{background-color:#111210!important}
html.dark .my-books-page [class~="border-paper-border"]{border-color:#2C2E29!important}
html.dark .my-books-page [class~="text-ink"],html.dark .my-books-page .text-ink{color:#EDE9DF!important}
html.dark .my-books-page [class~="text-ink-muted"],html.dark .my-books-page .text-ink-muted{color:#9CA3AF!important}
`;
