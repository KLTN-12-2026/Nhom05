export const inlinePageStyle1 = `
                .streak-root {
                    background-color: #FFFEFA;
                    border: 1px solid #E3DDD0;
                }
                html.dark .streak-root, .dark .streak-root {
                    background-color: #1A1C18 !important;
                    border-color: #2C2E29 !important;
                }
                .streak-badge {
                    background-color: #F5F2EB;
                }
                html.dark .streak-badge, .dark .streak-badge {
                    background-color: #22241F !important;
                    border: 1px solid #2F322A;
                }
                .streak-fire-box {
                    background-color: rgba(245, 158, 11, 0.1);
                }
                html.dark .streak-fire-box, .dark .streak-fire-box {
                    background-color: rgba(212, 175, 55, 0.12) !important;
                }
                .streak-day-card {
                    transition: all 0.2s ease;
                }
                .streak-day-card.checked {
                    background-color: rgba(16, 185, 129, 0.08);
                    border: 1px solid rgba(16, 185, 129, 0.3);
                }
                html.dark .streak-day-card.checked, .dark .streak-day-card.checked {
                    background-color: rgba(16, 185, 129, 0.12) !important;
                    border-color: rgba(16, 185, 129, 0.35) !important;
                }
                .streak-day-card.today {
                    background-color: rgba(142, 48, 56, 0.08);
                    border: 2px solid #8E3038;
                }
                html.dark .streak-day-card.today, .dark .streak-day-card.today {
                    background-color: rgba(212, 175, 55, 0.12) !important;
                    border-color: #D4AF37 !important;
                    box-shadow: 0 0 10px rgba(212, 175, 55, 0.12) !important;
                }
                .streak-day-card.locked {
                    background-color: #FAF8F5;
                    border: 1px solid #EAE5D9;
                }
                html.dark .streak-day-card.locked, .dark .streak-day-card.locked {
                    background-color: #141512 !important;
                    border-color: #232520 !important;
                }
            `;
