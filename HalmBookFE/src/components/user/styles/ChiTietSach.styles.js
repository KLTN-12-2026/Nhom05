export const tailwindConfig = {
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                serif: ['Lora', 'Merriweather', 'Playfair Display', 'serif'],
                outfit: ['Outfit', 'sans-serif'],
                nunito: ['Nunito', 'sans-serif'],
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
            boxShadow: {
                'book-real': '0 20px 40px -15px rgba(0,0,0,0.25), 0 0 15px rgba(0,0,0,0.06)',
                'gold-glow': '0 0 25px rgba(212, 175, 55, 0.25)',
            },
        },
    },
};

export const externalStylesheets = [
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600;1,700&family=Merriweather:ital,wght@0,300;0,400;0,700;0,900;1,300;1,400;1,700&family=Nunito:wght@400;600;700;800;900&family=Outfit:wght@400;500;600;700;800;900&family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,500;1,600;1,700&display=swap',
    'https://unpkg.com/@phosphor-icons/web@2.1.1/src/bold/style.css',
    'https://unpkg.com/@phosphor-icons/web@2.1.1/src/regular/style.css',
    'https://unpkg.com/@phosphor-icons/web@2.1.1/src/fill/style.css',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
];

export const pageStyles = `
        :root {
            --bg-color: #FAF7F2;
            --text-color: #1E1F1D;
            --card-color: #FFFFFF;
            --border-color: #E8E2D5;
        }

        .dark {
            --bg-color: #111210;
            --text-color: #EDE9DF;
            --card-color: #1E201B;
            --border-color: #2F322B;
        }

        body {
            background-color: var(--bg-color);
            color: var(--text-color);
            font-family: 'Inter', sans-serif;
            transition: background-color 0.4s ease, color 0.4s ease;
            overflow-x: hidden;
        }


        /* Shared starry sky treatment used by the home page */
        #starry-background {
            position: fixed;
            top: 0; left: 0;
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
            background-color: #ffffff;
            border-radius: 50%;
            pointer-events: none;
            animation: starTwinkle 4s ease-in-out infinite;
        }
        @keyframes starTwinkle {
            0%, 100% { opacity: 0.2; transform: scale(0.8); }
            50% { opacity: 0.9; transform: scale(1.3); }
        }

        /* 3D Book perspective styles */
        .book-stage {
            perspective: 1200px;
        }

        .book-3d {
            position: relative;
            transform-style: preserve-3d;
            transition: transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.3s ease;
            will-change: transform;
        }

        /* Gáy sách và độ dày 3D */
        .book-3d::before {
            content: '';
            position: absolute;
            top: 1%;
            left: -16px;
            width: 16px;
            height: 98%;
            background: linear-gradient(to right, #6F252C, #8E3038);
            transform: rotateY(-90deg);
            transform-origin: right center;
            border-radius: 3px 0 0 3px;
            box-shadow: inset 0 0 5px rgba(0,0,0,0.4);
        }

        .book-3d::after {
            content: '';
            position: absolute;
            top: 1.5%;
            right: -12px;
            width: 12px;
            height: 97%;
            background: linear-gradient(to right, #ece7dd 0%, #fffdf9 40%, #e2dcd0 100%);
            transform: translateZ(-2px) rotateY(90deg);
            transform-origin: left center;
            border-radius: 0 3px 3px 0;
            box-shadow: 2px 0 5px rgba(0,0,0,0.15);
        }

        /* Glare light sheen over book */
        .book-glare {
            position: absolute;
            inset: 0;
            background: linear-gradient(125deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.05) 40%, transparent 60%);
            border-radius: inherit;
            pointer-events: none;
            mix-blend-mode: overlay;
            transition: opacity 0.3s ease;
        }

        /* Open book transition effects */
        .open-book-right-thickness {
            box-shadow: 
                inset 18px 0 30px rgba(0,0,0,0.08),
                1px 1px 0 #f7dce3,
                2px 2px 0 #f1cbd6,
                3px 3px 0 #f7dce3,
                4px 4px 0 #f1cbd6,
                5px 5px 0 #f7dce3,
                6px 6px 0 #f1cbd6,
                7px 7px 0 #f7dce3,
                8px 8px 0 #eebfcd,
                10px 10px 0 #e7b4c4,
                12px 12px 0 #79243f,
                28px 28px 50px rgba(0,0,0,0.28) !important;
        }

        .open-book-left-thickness {
            box-shadow: 
                inset -18px 0 30px rgba(0,0,0,0.08),
                -1px 1px 0 #f7dce3,
                -2px 2px 0 #f1cbd6,
                -3px 3px 0 #f7dce3,
                -4px 4px 0 #f1cbd6,
                -5px 5px 0 #f7dce3,
                -6px 6px 0 #f1cbd6,
                -7px 7px 0 #f7dce3,
                -8px 8px 0 #eebfcd,
                -10px 10px 0 #e7b4c4,
                -12px 12px 0 #79243f,
                -28px 28px 50px rgba(0,0,0,0.25) !important;
        }

        /* Custom scrollbars */
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #D5CFBF; border-radius: 9999px; }
        ::-webkit-scrollbar-thumb:hover { background: #8E3038; }
        .dark ::-webkit-scrollbar-thumb { background: #3E423A; }
        .dark ::-webkit-scrollbar-thumb:hover { background: #B8860B; }

        /* Audio Wave Visualizer animation */
        @keyframes soundWave {
            0%, 100% { height: 4px; }
            50% { height: 18px; }
        }
        .audio-bar {
            width: 3px;
            background: #8E3038;
            border-radius: 2px;
            display: inline-block;
            margin: 0 1.5px;
            height: 4px;
            transition: height 0.2s ease;
        }
        .dark .audio-bar { background: #D4AF37; }
        .audio-playing .audio-bar:nth-child(1) { animation: soundWave 0.8s infinite ease-in-out; }
        .audio-playing .audio-bar:nth-child(2) { animation: soundWave 1.1s infinite 0.2s ease-in-out; }
        .audio-playing .audio-bar:nth-child(3) { animation: soundWave 0.7s infinite 0.4s ease-in-out; }
        .audio-playing .audio-bar:nth-child(4) { animation: soundWave 1.3s infinite 0.1s ease-in-out; }
        .audio-playing .audio-bar:nth-child(5) { animation: soundWave 0.9s infinite 0.3s ease-in-out; }

        /* Reveal animations */
        .reveal-item {
            opacity: 0;
            transform: translateY(20px);
            transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .reveal-item.is-visible {
            opacity: 1;
            transform: translateY(0);
        }
    


                            @keyframes cinematicFade { 0% { opacity: 0; filter: blur(8px); transform: scale(0.95); } 100% { opacity: 1; filter: blur(0); transform: scale(1); } }
                            @keyframes floatText { 0% { opacity: 0; transform: translateY(15px); } 100% { opacity: 1; transform: translateY(0); } }
                            @keyframes drawLine { 0% { width: 0; opacity: 0; } 100% { width: 50px; opacity: 1; } }
                            .anim-title { animation: cinematicFade 1.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; opacity: 0; }
                            .anim-text { animation: floatText 1.2s ease-out forwards; opacity: 0; }
                            .anim-line { animation: drawLine 1s ease-out forwards; opacity: 0; width: 0; }
                        `;

export const inlinePageStyle1 = `
                /* ========================================================
                   TRIỆT TIÊU HIỆN TƯỢNG HẮT SÁNG KHI CHUYỂN DARK/LIGHT MODE
                   ======================================================== */
                button, [role="button"], .tab-btn {
                    -webkit-tap-highlight-color: transparent !important;
                    outline: none !important;
                }
                .dark button, .dark [role="button"] {
                    text-shadow: none !important;
                }
                #btn-read-now, #btn-rent-book, #btnConfirmAddToCart, #btnCheckoutCart, #btnPostComment, #chatbotTriggerBtn, .tab-btn {
                    filter: none !important;
                }
                .dark #btn-read-now,
                .dark #btn-rent-book,
                .dark #btnConfirmAddToCart,
                .dark #btnCheckoutCart,
                .dark #btnPostComment,
                .dark .tab-btn {
                    box-shadow: none !important;
                    filter: none !important;
                }
                .dark #btn-read-now:hover,
                .dark #btn-rent-book:hover,
                .dark #btnConfirmAddToCart:hover,
                .dark #btnCheckoutCart:hover,
                .dark #btnPostComment:hover {
                    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.6) !important;
                }

                #rentalModalBackdrop {
                    z-index: 9999 !important;
                    background: rgba(15, 16, 14, 0.82) !important;
                    backdrop-filter: blur(6px);
                }
                #rentalModal {
                    position: fixed !important;
                    top: 78vh !important;
                    left: 68vw !important;
                    right: auto !important;
                    bottom: auto !important;
                    margin: 0 !important;
                    z-index: 10000 !important;
                    width: min(92vw, 32rem) !important;
                    max-height: 90vh !important;
                    transform: translate(-50%, -50%) scale(0.95) !important;
                    background: #fffefa !important;
                    color: #1e1f1d !important;
                    overflow-y: auto;
                }
                .dark #rentalModal {
                    background: #222420 !important;
                    color: #ede9df !important;
                }
                #rentalModal.rental-modal-open {
                    opacity: 1 !important;
                    pointer-events: auto !important;
                    transform: translate(-50%, -50%) scale(1) !important;
                }
                #btnConfirmAddToCart {
                    background: #8e3038 !important;
                    color: #fff !important;
                    box-shadow: none !important;
                    filter: none !important;
                }
                #btnConfirmAddToCart:hover {
                    background: #6f252c !important;
                }
                #btnConfirmAddToCart i {
                    color: #fcd34d !important;
                }
                #btn-rent-book {
                    background: #8e3038 !important;
                    color: #fff !important;
                    box-shadow: none !important;
                    filter: none !important;
                }
                #btn-rent-book:hover {
                    background: #6f252c !important;
                }
                #btn-rent-book i {
                    color: #fcd34d !important;
                }
            `;
