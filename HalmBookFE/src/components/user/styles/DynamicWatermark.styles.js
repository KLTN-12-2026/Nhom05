export const inlinePageStyle1 = `
                @media print {
                    body * {
                        visibility: hidden !important;
                    }
                    #halm-print-blocker {
                        visibility: visible !important;
                        display: flex !important;
                        position: fixed !important;
                        inset: 0 !important;
                        background: #111210 !important;
                        color: #FAF7F2 !important;
                        font-family: sans-serif !important;
                        font-size: 22px !important;
                        font-weight: bold !important;
                        text-align: center !important;
                        align-items: center !important;
                        justify-content: center !important;
                        padding: 40px !important;
                        z-index: 9999999 !important;
                    }
                }
            `;
