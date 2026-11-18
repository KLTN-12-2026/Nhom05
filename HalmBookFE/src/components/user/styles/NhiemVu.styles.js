export const halmTailwindConfig = {
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
                :root {
                    --font-display: "Inter", sans-serif;
                    --font-ui: "Inter", sans-serif;
                    --font-metadata: "Roboto", sans-serif;
                    --font-editorial: "Open Sans", sans-serif;
                }
                .nhiem-vu-page {
                    font-family: var(--font-ui);
                    background-color: #F7F4EE;
                    color: #1E1F1D;
                    -webkit-font-smoothing: antialiased;
                }
                .dark .nhiem-vu-page {
                    background-color: #111210;
                    color: #EDE9DF;
                }
                .nhiem-vu-page [class~="bg-paper"] { background: #F7F4EE; }
                .nhiem-vu-page [class~="bg-paper-surface"] { background: #FFFEFA; }
                .nhiem-vu-page [class~="bg-paper-50"] { background: #FAF8F5; }
                .nhiem-vu-page [class~="bg-paper-100"] { background: #F5F2EB; }
                .nhiem-vu-page [class~="bg-paper-200"] { background: #EAE5D9; }
                .nhiem-vu-page [class~="bg-wine"] { background: #8E3038; }
                .nhiem-vu-page [class~="bg-gold"] { background: #B8860B; }
                .nhiem-vu-page [class~="bg-night-card"] { background: #20221E; }
                .nhiem-vu-page [class~="bg-night-surface"] { background: #181916; }
                .nhiem-vu-page [class~="text-ink"] { color: #1E1F1D; }
                .nhiem-vu-page [class~="text-ink-muted"] { color: #66645E; }
                .nhiem-vu-page [class~="text-wine"] { color: #8E3038; }
                .nhiem-vu-page [class~="text-gold"] { color: #B8860B; }
                .nhiem-vu-page [class~="border-paper-border"] { border-color: #E3DDD0; }
                .nhiem-vu-page [class~="border-night-border"] { border-color: #2C2E29; }
                .nhiem-vu-page [class~="potato-badge"] { background: rgb(184 134 11/.12); color: #B8860B; border: 1px solid rgb(184 134 11/.25); }

                html.dark .nhiem-vu-page [class~="dark:bg-night-card"] { background: #20221E; }
                html.dark .nhiem-vu-page [class~="dark:bg-night-surface"] { background: #181916; }
                html.dark .nhiem-vu-page [class~="dark:bg-gold"] { background: #B8860B; }
                html.dark .nhiem-vu-page [class~="dark:text-gold"] { color: #B8860B; }
                html.dark .nhiem-vu-page [class~="dark:text-night-text"] { color: #EDE9DF; }
                html.dark .nhiem-vu-page [class~="dark:text-night-muted"] { color: #96938B; }
                html.dark .nhiem-vu-page [class~="potato-badge"] { background: rgb(212 175 55/.15); color: #D4AF37; border-color: rgb(212 175 55/.3); }

                html.dark .nhiem-vu-page [class*="user-sidebar-card"],
                html.dark .nhiem-vu-page [class*="dark:bg-night-surface"],
                html.dark .nhiem-vu-page [class*="dark:bg-[#181916]"] {
                    background-color: #181916 !important;
                    border-color: #2C2E29 !important;
                }
                html.dark .nhiem-vu-page [class*="user-sidebar-box"] {
                    background-color: #181916 !important;
                    border-color: #2C2E29 !important;
                }
                html.dark .nhiem-vu-page [class*="user-sidebar-card"] h2,
                html.dark .nhiem-vu-page [class*="user-sidebar-card"] [class*="font-display"],
                html.dark .nhiem-vu-page [class*="user-sidebar-box"] span.text-2xl,
                html.dark .nhiem-vu-page [class*="user-sidebar-box"] span:first-child {
                    color: #EDE9DF !important;
                }
                html.dark .nhiem-vu-page [class*="user-sidebar-box"] span:last-child,
                html.dark .nhiem-vu-page [class*="user-sidebar-card"] p {
                    color: #9CA3AF !important;
                }
                html.dark .nhiem-vu-page [class*="dark:border-night-border"],
                html.dark .nhiem-vu-page [class*="dark:border-[#2C2E29]"] {
                    border-color: #2C2E29 !important;
                }
                html.dark .nhiem-vu-page [class*="dark:bg-[#242116]"] {
                    background-color: #242116 !important;
                }
                html.dark .nhiem-vu-page [class*="dark:border-[#52441D]"] {
                    border-color: #52441D !important;
                }
                html.dark .nhiem-vu-page [class~="bg-paper-surface"] {
                    background-color: #181916 !important;
                }
                html.dark .nhiem-vu-page [class~="bg-paper"] {
                    background-color: #111210 !important;
                }
                html.dark .nhiem-vu-page [class~="border-paper-border"] {
                    border-color: #2C2E29 !important;
                }
                html.dark .nhiem-vu-page [class~="text-ink"],
                html.dark .nhiem-vu-page .text-ink {
                    color: #EDE9DF !important;
                }
                html.dark .nhiem-vu-page [class~="text-ink-muted"],
                html.dark .nhiem-vu-page .text-ink-muted {
                    color: #9CA3AF !important;
                }
            `;
