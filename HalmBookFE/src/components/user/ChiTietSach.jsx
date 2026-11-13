import React, { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import axiosInstance from '@/services/axiosClient';
import { isTokenValid } from '@/services/authToken';
import { openAuthModal } from '@/components/common/AuthModal';
import UserLayout from './layout/UserLayout';
import { openBookReaderTransition } from './bookReaderTransition';
import { checkIsFavorite, toggleFavorite } from '@/services/userFeatureService';

const STAR_FEEDBACK_TEXTS = ["Rất tệ", "Tệ", "Bình thường", "Rất hay", "Tuyệt tác!"];

const tailwindConfig = {
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                serif: ['Playfair Display', 'serif'],
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

const externalStylesheets = [
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Nunito:wght@400;600;700;800;900&family=Outfit:wght@400;500;600;700;800;900&family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,500;1,600;1,700&display=swap',
    'https://unpkg.com/@phosphor-icons/web@2.1.1/src/bold/style.css',
    'https://unpkg.com/@phosphor-icons/web@2.1.1/src/regular/style.css',
    'https://unpkg.com/@phosphor-icons/web@2.1.1/src/fill/style.css',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
];

function useOriginalDesignAssets() {
    useEffect(() => {
        const addedLinks = externalStylesheets
            .filter((href) => !document.querySelector(`link[href="${href}"]`))
            .map((href) => {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = href;
                document.head.appendChild(link);
                return link;
            });

        if (!document.querySelector('script[data-halm-tailwind]')) {
            window.tailwind = window.tailwind || {};
            window.tailwind.config = tailwindConfig;

            const script = document.createElement('script');
            script.src = 'https://cdn.tailwindcss.com';
            script.dataset.halmTailwind = 'true';
            document.head.appendChild(script);
        }

        return () => {
            addedLinks.forEach((link) => link.remove());
        };
    }, []);
}

const pageStyles = `
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

// Legacy interactions retained as module-scoped functions so existing JSX handlers keep working.
// ----------------------------------------------------
            // 1. THEME TOGGLE & DARK MODE STARS
            // ----------------------------------------------------
            const themeToggleBtn = document.getElementById('themeToggleBtn');
            const themeIcon = document.getElementById('themeIcon');
            function createStars() {
                const starryBg = document.getElementById('starry-background');
                if (!starryBg) return;
                starryBg.innerHTML = '';
                const count = 80;
                for (let i = 0; i < count; i++) {
                    const star = document.createElement('div');
                    star.className = 'star';
                    const size = Math.random() * 2 + 1;
                    star.style.width = `${size}px`;
                    star.style.height = `${size}px`;
                    star.style.top = `${Math.random() * 100}vh`;
                    star.style.left = `${Math.random() * 100}vw`;
                    star.style.opacity = Math.random() * 0.7 + 0.2;
                    starryBg.appendChild(star);
                }
            }

            const savedTheme = localStorage.getItem('color-theme') || localStorage.getItem('halm-theme');
            if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                document.documentElement.classList.add('dark');
                if (themeIcon) {
                    themeIcon.classList.remove('ph-moon');
                    themeIcon.classList.add('ph-sun');
                }
                createStars();
            } else {
                document.documentElement.classList.remove('dark');
                if (themeIcon) {
                    themeIcon.classList.remove('ph-sun');
                    themeIcon.classList.add('ph-moon');
                }
            }

            if (themeToggleBtn) {
                themeToggleBtn.addEventListener('click', () => {
                    const isDark = document.documentElement.classList.toggle('dark');
                    localStorage.setItem('color-theme', isDark ? 'dark' : 'light');
                    localStorage.setItem('halm-theme', isDark ? 'dark' : 'light');
                    if (themeIcon) {
                        themeIcon.classList.toggle('ph-moon', !isDark);
                        themeIcon.classList.toggle('ph-sun', isDark);
                    }
                    if (isDark) createStars();
                });
            }

            // ----------------------------------------------------
            // 2. 3D INTERACTIVE BOOK TILT ON MOUSEMOVE
            // ----------------------------------------------------
            const bookCard = document.getElementById('book-card');
            const bookGlare = document.getElementById('bookGlare');

            if (bookCard) {
                bookCard.addEventListener('mousemove', (e) => {
                    const rect = bookCard.getBoundingClientRect();
                    const x = (e.clientX - rect.left) / rect.width;
                    const y = (e.clientY - rect.top) / rect.height;

                    const rotateY = (x - 0.5) * 24; 
                    const rotateX = -(y - 0.5) * 24;

                    bookCard.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.03, 1.03, 1.03)`;
                    
                    if (bookGlare) {
                        bookGlare.style.opacity = '1';
                        bookGlare.style.background = `radial-gradient(circle at ${x * 100}% ${y * 100}%, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.05) 50%, transparent 80%)`;
                    }
                });

                bookCard.addEventListener('mouseleave', () => {
                    bookCard.style.transform = 'rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
                    if (bookGlare) {
                        bookGlare.style.opacity = '0.3';
                        bookGlare.style.background = 'linear-gradient(125deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.05) 40%, transparent 60%)';
                    }
                });
            }

            // HIỆU ỨNG TỪ TRANG ĐỌC QUAY VỀ: Tận dụng màn chắn #pre-render-overlay đã che sẵn 100% từ lúc vừa vào body,
            // gập sách lại xong xuôi rồi mới làm mờ màn chắn để hiện ra trang Chi tiết sách (không bị nháy 2 lần).
            const existingPreOverlay = document.getElementById('pre-render-overlay');
            if (sessionStorage.getItem('returnTransition') === 'true' || existingPreOverlay) {
                sessionStorage.removeItem('returnTransition');
                
                // Khóa cuộn trang và lên top để không bị chớp giật UI
                document.body.style.overflow = 'hidden';
                window.scrollTo(0, 0);
                
                const isDarkTheme = document.documentElement.classList.contains('dark');
                const overlayBg = isDarkTheme ? '#111210' : '#FAF7F2';

                const rect = bookCard ? bookCard.getBoundingClientRect() : { top: 120, left: 120, width: 280, height: 420 };
                const aspectRatio = rect.width / rect.height;
                const targetH = window.innerHeight * FLY_HEIGHT_RATIO; 
                const targetW = targetH * aspectRatio;
                
                // Sử dụng lại luôn lớp màn chắn #pre-render-overlay để không gây chớp hình
                let overlay = existingPreOverlay;
                if (!overlay) {
                    overlay = document.createElement('div');
                    overlay.id = 'pre-render-overlay';
                    overlay.style.cssText = `
                        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; 
                        z-index: 9999999; pointer-events: none; background: ${overlayBg}; 
                        transition: background 0.8s ease;
                    `;
                    document.body.appendChild(overlay);
                }
                overlay.style.perspective = '2500px';
                
                // Sách hiển thị mở sẵn ở giữa màn hình
                const bookAnim = document.createElement('div');
                bookAnim.style.cssText = `
                    position: absolute; top: ${(window.innerHeight - targetH) / 2}px; left: ${window.innerWidth / 2}px; 
                    width: ${targetW}px; height: ${targetH}px; 
                    transition: all 0.8s cubic-bezier(0.64, 0, 0.35, 1); 
                    transform-style: preserve-3d;
                `;
                
                const pages = document.createElement('div');
                pages.className = 'open-book-right-thickness';
                pages.style.cssText = `
                    position: absolute; top: 0; left: 0; width: 100%; height: 100%; 
                    background: #FAF7F2; border-radius: 2px 14px 14px 2px; z-index: 1;
                    border-right: 1px solid #E8E2D5; border-top: 1px solid #FAF7F2; border-bottom: 1px solid #DFD7C7;
                    transition: box-shadow 0.8s ease;
                `;

                const activeBook = window.__CURRENT_BOOK__;
                const authorText = activeBook?.author ? `Một tác phẩm của ${activeBook.author}` : 'Ấn phẩm chọn lọc';
                const titleText = activeBook?.bookName || 'HALM BOOK';

                pages.innerHTML = `
                    <div style="position: absolute; left: 0; top: 0; bottom: 0; width: 28px; background: linear-gradient(to right, rgba(142,48,56,0.14) 0%, rgba(142,48,56,0.04) 55%, transparent 100%); pointer-events: none; border-radius: 2px 0 0 2px"></div>
                    <div id="page-content" style="height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 2.5rem; position: relative; z-index: 2">
                        <p style="font-family: 'Playfair Display', serif; font-style: italic; color: #8E3038; font-size: 1.15rem; margin-bottom: 12px">${authorText}</p>
                        <h2 style="font-family: 'Playfair Display', serif; font-weight: 900; color: #6F252C; font-size: 1.9rem; text-shadow: 1px 1px 0 rgba(255,255,255,0.8); margin-bottom: 20px; line-height: 1.3">${titleText}</h2>
                        <div style="height: 2px; width: 50px; background: #8E3038; margin: 0 auto 25px"></div>
                        <p style="font-family: 'Playfair Display', serif; font-size: 0.95rem; color: #6E6D7A; font-style: italic; max-width: 82%; line-height: 1.8">
                            "Không Gian Đọc Sách & Kết Nối Tri Thức"
                        </p>
                    </div>
                `;
                
                const coverWrapper = document.createElement('div');
                coverWrapper.style.cssText = `
                    position: absolute; top: 0; left: 0; width: 100%; height: 100%; 
                    transform-origin: left center; transform: rotateY(-180deg); /* MỞ SẴN */
                    transition: transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1); 
                    transform-style: preserve-3d; z-index: 2;
                `;
                
                const coverFront = document.createElement('div');
                coverFront.style.cssText = `
                    position: absolute; inset: 0; 
                    background-image: url('${coverUrl}'); background-size: 100% 100%; 
                    background-position: center; background-repeat: no-repeat;
                    backface-visibility: hidden; border-radius: 2px 14px 14px 2px;
                `;
                
                const coverBack = document.createElement('div');
                coverBack.className = 'open-book-left-thickness';
                coverBack.style.cssText = `
                    position: absolute; inset: 0; background: #FAF7F2; 
                    backface-visibility: hidden; transform: rotateY(180deg); 
                    border-radius: 14px 2px 2px 14px;
                    border-left: 1px solid #E8E2D5; border-top: 1px solid #FAF7F2; border-bottom: 1px solid #DFD7C7;
                    transition: box-shadow 0.8s ease;
                `;
                
                coverBack.innerHTML = `
                    <div style={{position: "absolute", right: "0", top: "0", bottom: "0", width: "28px", background: "linear-gradient(to left, rgba(142,48,56,0.14) 0%, rgba(142,48,56,0.04) 55%, transparent 100%)", pointerEvents: "none", borderRadius: "0 2px 2px 0"}}></div>
                    <div id="left-page-content" style={{height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "2rem", opacity: "1", transition: "opacity 0.4s ease", position: "relative", zIndex: "2"}}>
                        <img src="img/icon-removebg-preview.png" alt="HALM Logo" style={{width: "75px", height: "75px", objectFit: "contain", marginBottom: "16px", filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.08))"}} />
                        <h3 style={{fontFamily: "'Outfit', sans-serif", fontWeight: "900", color: "#8E3038", fontSize: "1.6rem", letterSpacing: "6px", marginBottom: "10px", textTransform: "uppercase"}}>HALM BOOK</h3>
                        <div style={{height: "2px", width: "40px", background: "#8E3038", margin: "0 auto 15px"}}></div>
                        <p style={{fontFamily: "'Inter', sans-serif", fontSize: "0.95rem", color: "#6E6D7A", fontStyle: "italic", maxWidth: "80%", lineHeight: "1.8"}}>
                            "Không Gian Đọc Sách & Tri Thức"
                        </p>
                    </div>
                `;
                
                coverWrapper.appendChild(coverFront);
                coverWrapper.appendChild(coverBack);
                bookAnim.appendChild(pages);
                bookAnim.appendChild(coverWrapper);
                
                overlay.appendChild(bookAnim);
                if (bookCard) bookCard.style.opacity = '0';

                // BƯỚC 1: Sách TỰ GẬP LẠI (Trong khi màn chắn #pre-render-overlay vẫn đang đục/đặc hoàn toàn)
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        coverWrapper.style.transform = 'rotateY(0deg)'; // Gập đóng
                        pages.classList.remove('open-book-right-thickness');
                        coverBack.classList.remove('open-book-left-thickness');
                        const leftContent = coverBack.querySelector('#left-page-content');
                        if (leftContent) leftContent.style.opacity = '0';
                    });
                });

                // BƯỚC 2: Khi gập xong (0.85s), thu nhỏ sách bay về vị trí bìa sách và NỀN MỜ DẦN lộ diện giao diện chi tiết sách
                setTimeout(() => {
                    if (bookCard) {
                        bookAnim.style.top = rect.top + 'px';
                        bookAnim.style.left = rect.left + 'px';
                        bookAnim.style.width = rect.width + 'px';
                        bookAnim.style.height = rect.height + 'px';
                        
                        // Làm trong suốt màn chắn để hiện trang Chi tiết sách
                        overlay.style.background = isDarkTheme ? 'rgba(17, 18, 16, 0)' : 'rgba(250, 247, 242, 0)';
                        
                        // BƯỚC 3: Dọn dẹp DOM và mở khóa cuộn trang
                        setTimeout(() => {
                            overlay.remove();
                            bookCard.style.opacity = '1';
                            document.body.style.overflow = '';
                        }, 800);
                    }
                }, 850);
            }

            // ----------------------------------------------------
            // 4. STAR RATING SYSTEM FOR REVIEWS
            // ----------------------------------------------------
            const ratingStars = document.getElementById('ratingStars');
            const ratingFeedback = document.getElementById('ratingFeedback');
            const feedbackTexts = ["Rất tệ", "Tệ", "Bình thường", "Rất hay", "Tuyệt tác!"];

            if (ratingStars) {
                const stars = ratingStars.querySelectorAll('i');
                stars.forEach((star, index) => {
                    star.addEventListener('mouseenter', () => {
                        stars.forEach((s, i) => {
                            if (i <= index) {
                                s.classList.remove('text-gray-300', 'dark:text-gray-600');
                                s.classList.add('text-amber-400');
                            } else {
                                s.classList.remove('text-amber-400');
                                s.classList.add('text-gray-300', 'dark:text-gray-600');
                            }
                        });
                        ratingFeedback.textContent = feedbackTexts[index];
                    });

                    star.addEventListener('click', () => {
                        ratingStars.setAttribute('data-rating', index + 1);
                        ratingFeedback.textContent = `${index + 1}/5 sao — ${feedbackTexts[index]}`;
                    });
                });

                ratingStars.addEventListener('mouseleave', () => {
                    const current = ratingStars.getAttribute('data-rating');
                    stars.forEach((s, i) => {
                        if (current && i < current) {
                            s.classList.remove('text-gray-300', 'dark:text-gray-600');
                            s.classList.add('text-amber-400');
                        } else {
                            s.classList.remove('text-amber-400');
                            s.classList.add('text-gray-300', 'dark:text-gray-600');
                        }
                    });
                    if (!current) ratingFeedback.textContent = "Chọn số sao";
                });
            }

            // Mobile menu toggle
            const mobileMenuBtn = document.getElementById('mobileMenuBtn');
            const mobileDrawer = document.getElementById('mobileDrawer');
            if (mobileMenuBtn && mobileDrawer) {
                mobileMenuBtn.addEventListener('click', () => {
                    mobileDrawer.classList.toggle('hidden');
                });
            }
        // ----------------------------------------------------
        // 5. RENTAL SELECTION MODAL & CART SYSTEM
        // ----------------------------------------------------
        const rentalPlans = {
            '1': { name: 'Thuê 1 Ngày (24h)', days: 1, price: 2, label: 'Thuê 1 Ngày - 2 Khoai', isBuy: false },
            '3': { name: 'Thuê 3 Ngày (Cuối tuần)', days: 3, price: 5, label: 'Thuê 3 Ngày - 5 Khoai', isBuy: false },
            '7': { name: 'Thuê 7 Ngày (1 Tuần)', days: 7, price: 9, label: 'Thuê 7 Ngày - 9 Khoai', isBuy: false },
            '15': { name: 'Thuê 15 Ngày', days: 15, price: 18, label: 'Thuê 15 Ngày - 18 Khoai', isBuy: false },
            '30': { name: 'Thuê 30 Ngày', days: 30, price: 30, label: 'Thuê 30 Ngày - 30 Khoai', isBuy: false },
            'forever': { name: 'Mua Đứt (Sở Hữu Trọn Đời)', days: 99999, price: 39, label: 'Mua Đứt - 39 Khoai', isBuy: true }
        };

        let currentRentalPlanKey = '7';
        let cartItems = [];

        function resolvePlanDisplay(planKey, rentalDays) {
            if (planKey === 'forever' || rentalDays >= 9999) {
                return { type: 'Mua Đứt', plan: 'Sở Hữu Trọn Đời', days: 99999, price: 39 };
            }
            if (String(planKey) === '1' || rentalDays === 1) {
                return { type: 'Thuê Đọc', plan: 'Thuê 1 Ngày (24h)', days: 1, price: 2 };
            }
            if (String(planKey) === '3' || rentalDays === 3) {
                return { type: 'Thuê Đọc', plan: 'Thuê 3 Ngày', days: 3, price: 5 };
            }
            if (String(planKey) === '15' || rentalDays === 15) {
                return { type: 'Thuê Đọc', plan: 'Thuê 15 Ngày', days: 15, price: 18 };
            }
            if (String(planKey) === '30' || rentalDays === 30) {
                return { type: 'Thuê Đọc', plan: 'Thuê 30 Ngày', days: 30, price: 30 };
            }
            return { type: 'Thuê Đọc', plan: 'Thuê 7 Ngày (1 Tuần)', days: 7, price: 9 };
        }

        async function fetchServerCart() {
            try {
                const res = await axiosInstance.get('/api/home/cart/items');
                if (Array.isArray(res.data)) {
                    cartItems = res.data.map(item => {
                        const resolved = resolvePlanDisplay(item.planKey, item.rentalDays);
                        return {
                            id: item.cartItemId,
                            bookId: item.bookId,
                            title: item.bookName,
                            author: item.author,
                            type: resolved.type,
                            plan: resolved.plan,
                            price: item.selectedPrice ?? resolved.price,
                            days: item.rentalDays ?? resolved.days,
                            planKey: item.planKey || '7',
                            cover: item.imgUrl || '/logo.png'
                        };
                    });
                    updateCartUI();
                }
            } catch (err) {
                console.warn('Chưa đăng nhập hoặc không thể lấy giỏ hàng:', err);
            }
        }

        // Tải giỏ hàng khi khởi tạo
        fetchServerCart();

        window.openRentalModal = openRentalModal;
        window.closeRentalModal = closeRentalModal;
        window.selectRentalModalPlan = selectRentalModalPlan;
        window.confirmRentalModalAddToCart = confirmRentalModalAddToCart;
        window.addBuyForeverToCart = addBuyForeverToCart;
        if (new URLSearchParams(window.location.search).get('openRental') === 'true') {
            setTimeout(() => {
                if (typeof openRentalModal === 'function') openRentalModal();
            }, 450);
        }

        function openRentalModal() {
            if (!isTokenValid()) {
                openAuthModal({ mode: 'login', message: 'Vui lòng đăng nhập để thuê hoặc mua ấn phẩm này!' });
                return;
            }

            const modal = document.getElementById('rentalModal');
            const backdrop = document.getElementById('rentalModalBackdrop');
            const userKhoaiEl = document.getElementById('rentalModalUserKhoai');
            const headerKhoaiEl = document.getElementById('user-khoai-val');

            const currentKhoai = headerKhoaiEl ? (parseInt(headerKhoaiEl.textContent.replace(/,/g, '')) || 0) : 0;
            if (userKhoaiEl) userKhoaiEl.textContent = currentKhoai.toLocaleString();

            selectRentalModalPlan(currentRentalPlanKey);

            if (modal && backdrop) {
                backdrop.classList.remove('opacity-0', 'pointer-events-none');
                backdrop.classList.add('opacity-100', 'pointer-events-auto');
                modal.classList.remove('opacity-0', 'pointer-events-none', 'scale-95');
                modal.classList.add('opacity-100', 'pointer-events-auto', 'scale-100');
                modal.classList.add('rental-modal-open');
                document.body.style.overflow = 'hidden';
            }
        }

        function closeRentalModal() {
            const modal = document.getElementById('rentalModal');
            const backdrop = document.getElementById('rentalModalBackdrop');
            if (modal && backdrop) {
                backdrop.classList.remove('opacity-100', 'pointer-events-auto');
                backdrop.classList.add('opacity-0', 'pointer-events-none');
                modal.classList.remove('opacity-100', 'pointer-events-auto', 'scale-100');
                modal.classList.add('opacity-0', 'pointer-events-none', 'scale-95');
                modal.classList.remove('rental-modal-open');
                
                const cartDrawer = document.getElementById('cartDrawer');
                if (!cartDrawer || cartDrawer.classList.contains('translate-x-full')) {
                    document.body.style.overflow = '';
                }
            }
        }

        function selectRentalModalPlan(planKey) {
            currentRentalPlanKey = planKey;
            const plan = rentalPlans[planKey];
            if (!plan) return;

            ['1', '3', '7', 'forever'].forEach(key => {
                const card = document.getElementById('planCard_' + key);
                const check = document.getElementById('checkIcon_' + key);
                if (card && check) {
                    if (key === planKey) {
                        if (key === 'forever') {
                            card.className = 'rental-modal-card p-3.5 rounded-2xl border-2 border-amber-500 dark:border-gold bg-amber-500/10 dark:bg-gold/15 flex items-center justify-between cursor-pointer transition-all group shadow-sm ring-1 ring-amber-500/30 dark:ring-gold/40';
                            check.className = 'w-5 h-5 rounded-full bg-amber-500 text-white dark:bg-gold dark:text-night flex items-center justify-center text-xs shadow-2xs';
                        } else {
                            card.className = 'rental-modal-card p-3.5 rounded-2xl border-2 border-wine dark:border-gold bg-wine/5 dark:bg-gold/10 flex items-center justify-between cursor-pointer transition-all group shadow-sm ring-1 ring-wine/20 dark:ring-gold/30';
                            check.className = 'w-5 h-5 rounded-full bg-wine text-white dark:bg-gold dark:text-night flex items-center justify-center text-xs shadow-2xs';
                        }
                    } else {
                        card.className = 'rental-modal-card p-3.5 rounded-2xl border-2 border-paper-border/80 dark:border-night-border/80 hover:border-wine/50 dark:hover:border-gold/50 bg-paper-50 dark:bg-night-surface flex items-center justify-between cursor-pointer transition-all group';
                        check.className = 'w-5 h-5 rounded-full border border-gray-300 dark:border-night-border flex items-center justify-center text-xs text-transparent transition-all';
                    }
                }
            });

            const btnText = document.getElementById('confirmAddToCartBtnText');
            if (btnText) {
                btnText.textContent = "Thêm Vào Giỏ Hàng (" + plan.label + ")";
            }
        }

        async function confirmRentalModalAddToCart() {
            if (!isTokenValid()) {
                openAuthModal({ mode: 'login', message: 'Vui lòng đăng nhập để thêm ấn phẩm vào giỏ hàng!' });
                return;
            }

            const plan = rentalPlans[currentRentalPlanKey];
            if (!plan) return;

            const activeBook = window.__CURRENT_BOOK__ || {};
            const targetBookId = activeBook.book_id || bookId || (book ? book.book_id : '');

            if (!targetBookId) {
                showToast('Không xác định được mã sách để thêm vào giỏ hàng!', 'error');
                return;
            }

            try {
                const response = await axiosInstance.post('/api/home/cart/add', {
                    bookId: targetBookId,
                    planKey: currentRentalPlanKey,
                    price: plan.price
                });

                closeRentalModal();
                showToast("🛒 " + (response.data?.message || 'Đã thêm sách vào giỏ hàng!'), 'success');
                await fetchServerCart();
                window.dispatchEvent(new Event('halm-cart-updated'));
            } catch (err) {
                console.error('Lỗi khi thêm sách vào giỏ:', err);
                const msg = err.response?.data?.message || 'Không thể thêm sách vào giỏ hàng. Vui lòng kiểm tra đăng nhập!';
                showToast(msg, 'error');
            }
        }

        // Thêm gói Mua Đứt vào Giỏ Hàng (alias)
        function addBuyForeverToCart() {
            selectRentalModalPlan('forever');
            confirmRentalModalAddToCart();
        }

        // Lướt sách cùng tác giả trái / phải
        function scrollAuthorBooks(direction) {
            const slider = document.getElementById('authorBooksSlider');
            if (slider) {
                slider.scrollBy({ left: direction * 280, behavior: 'smooth' });
            }
        }

        // Xóa ấn phẩm khỏi giỏ hàng
        async function removeFromCart(cartItemId) {
            try {
                await axiosInstance.delete('/api/home/cart/items/' + cartItemId);
                showToast('Đã xóa ấn phẩm khỏi giỏ hàng.', 'info');
                await fetchServerCart();
                window.dispatchEvent(new Event('halm-cart-updated'));
            } catch (err) {
                console.error('Lỗi khi xóa khỏi giỏ:', err);
                showToast('Không thể xóa sản phẩm khỏi giỏ hàng!', 'error');
            }
        }
        window.removeFromCart = removeFromCart;

        // Cập nhật giao diện Giỏ Hàng và Drawer
        function updateCartUI() {
            const badge = document.getElementById('cartCountBadge');
            const drawerCount = document.getElementById('cartDrawerItemCount');
            const drawerTotal = document.getElementById('cartDrawerTotal');
            const listEl = document.getElementById('cartItemsList');
            const checkoutBtn = document.getElementById('btnCheckoutCart');
            const userKhoaiEl = document.getElementById('cartDrawerUserKhoai');
            const headerKhoaiEl = document.getElementById('user-khoai-val');

            const currentKhoai = headerKhoaiEl ? (parseInt(headerKhoaiEl.textContent.replace(/,/g, '')) || 0) : 0;
            if (userKhoaiEl) userKhoaiEl.textContent = currentKhoai.toLocaleString();

            const totalCount = cartItems.length;
            if (badge) {
                badge.textContent = totalCount;
                badge.classList.add('scale-125');
                setTimeout(() => badge.classList.remove('scale-125'), 300);
            }
            if (drawerCount) drawerCount.textContent = totalCount;

            const totalPrice = cartItems.reduce((sum, item) => sum + (item.price || 0), 0);
            if (drawerTotal) drawerTotal.textContent = totalPrice;

            if (checkoutBtn) {
                checkoutBtn.disabled = totalCount === 0;
            }

            if (listEl) {
                if (totalCount === 0) {
                    listEl.innerHTML = '<div class="h-full flex flex-col items-center justify-center text-center py-12 text-ink-muted dark:text-night-muted">' +
                        '<div class="w-16 h-16 rounded-2xl bg-paper-100 dark:bg-night-surface flex items-center justify-center text-3xl mb-3">' +
                            '<i class="ph-bold ph-shopping-cart text-ink-muted/50 dark:text-night-muted/50"></i>' +
                        '</div>' +
                        '<h4 class="font-outfit font-bold text-sm text-ink dark:text-night-text mb-1">Giỏ Hàng Đang Trống</h4>' +
                        '<p class="text-xs max-w-xs">Hãy chọn thời hạn thuê hoặc mua đứt sách để thêm vào giỏ hàng nhé!</p>' +
                    '</div>';
                } else {
                    listEl.innerHTML = cartItems.map((item) => {
                        return '<div class="p-3 rounded-2xl bg-paper-50 dark:bg-night-surface border border-paper-border/80 dark:border-night-border/80 flex items-center gap-3 relative group">' +
                            '<img src="' + (item.cover || '/logo.png') + '" alt="' + item.title + '" class="w-12 h-16 object-cover rounded-lg shrink-0 shadow-xs" onerror="this.onerror=null;this.src=\'/logo.png\'" />' +
                            '<div class="flex-1 min-w-0">' +
                                '<h5 class="font-outfit font-bold text-xs text-ink dark:text-night-text truncate mb-0.5">' + item.title + '</h5>' +
                                '<div class="flex items-center gap-1.5 text-[11px] mb-1">' +
                                    '<span class="px-2 py-0.5 rounded-md ' + (item.type === 'Mua Đứt' ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 font-bold' : 'bg-wine/10 dark:bg-gold/15 text-wine dark:text-gold font-semibold') + '">' +
                                        item.type + ': ' + item.plan +
                                    '</span>' +
                                '</div>' +
                                '<div class="flex items-center gap-1 font-outfit font-black text-xs text-wine dark:text-gold">' +
                                    '<span>' + item.price + ' Khoai</span>' +
                                    '<i class="ph-fill ph-coins text-gold text-xs"></i>' +
                                '</div>' +
                            '</div>' +
                            '<button type="button" onclick="window.removeFromCart(' + item.id + ')" class="p-2 text-ink-muted hover:text-rose-500 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer" title="Xóa khỏi giỏ">' +
                                '<i class="ph-bold ph-trash text-base"></i>' +
                            '</button>' +
                        '</div>';
                    }).join('');
                }
            }
        }

        // Bật / tắt Drawer Giỏ Hàng
        function toggleCartDrawer(isOpen) {
            const drawer = document.getElementById('cartDrawer');
            const backdrop = document.getElementById('cartDrawerBackdrop');
            if (!drawer || !backdrop) return;

            if (isOpen) {
                fetchServerCart();
                backdrop.classList.remove('opacity-0', 'pointer-events-none');
                backdrop.classList.add('opacity-100', 'pointer-events-auto');
                drawer.classList.remove('translate-x-full');
                drawer.classList.add('translate-x-0');
                document.body.style.overflow = 'hidden';
            } else {
                backdrop.classList.remove('opacity-100', 'pointer-events-auto');
                backdrop.classList.add('opacity-0', 'pointer-events-none');
                drawer.classList.remove('translate-x-0');
                drawer.classList.add('translate-x-full');
                document.body.style.overflow = '';
            }
        }

        // Thanh toán toàn bộ Giỏ Hàng bằng Khoai Tây thực tế
        async function handleCheckoutCart() {
            if (!isTokenValid()) {
                openAuthModal({ mode: 'login', message: 'Vui lòng đăng nhập để thực hiện thanh toán giỏ hàng!' });
                return;
            }

            if (cartItems.length === 0) {
                showToast('Giỏ hàng đang trống!', 'error');
                return;
            }

            const totalPrice = cartItems.reduce((sum, item) => sum + item.price, 0);
            const khoaiEl = document.getElementById('user-khoai-val');
            let currentKhoai = khoaiEl ? (parseInt(khoaiEl.textContent.replace(/,/g, '')) || 0) : 0;

            if (currentKhoai < totalPrice) {
                showToast('Số dư Khoai không đủ (' + totalPrice + ' Khoai cần có, bạn đang có ' + currentKhoai + ' Khoai). Vui lòng nạp thêm Khoai!', 'error');
                return;
            }

            const checkoutBtn = document.getElementById('btnCheckoutCart');
            if (checkoutBtn) checkoutBtn.disabled = true;

            try {
                const checkoutItems = cartItems.map(item => ({
                    bookId: item.bookId || item.id,
                    cartItemId: item.cartItemId,
                    planKey: String(item.planKey || '7'),
                    durationDays: item.durationDays || 7,
                    price: item.price
                }));

                const res = await axiosInstance.post('/api/home/checkout', {
                    items: checkoutItems,
                    paymentMethod: 'POTATO_WALLET'
                });

                currentKhoai = res.data.remainingPotatoBalance;
                if (khoaiEl) khoaiEl.textContent = currentKhoai.toLocaleString();
                const rentalModalKhoai = document.getElementById('rentalModalUserKhoai');
                if (rentalModalKhoai) rentalModalKhoai.textContent = currentKhoai.toLocaleString();
                const cartDrawerKhoai = document.getElementById('cartDrawerUserKhoai');
                if (cartDrawerKhoai) cartDrawerKhoai.textContent = currentKhoai.toLocaleString();

                const boughtCount = cartItems.length;
                cartItems = [];
                updateCartUI();
                toggleCartDrawer(false);

                window.dispatchEvent(new CustomEvent('halm-cart-updated'));
                window.dispatchEvent(new CustomEvent('halm-potato-updated', {
                    detail: { potatoBalance: currentKhoai }
                }));
                window.dispatchEvent(new CustomEvent('halm-bookshelf-updated'));

                showToast('🎉 Thanh toán thành công ' + boughtCount + ' ấn phẩm (-' + totalPrice + ' Khoai)! Sách đã chuyển vào Tủ Sách Cá Nhân.', 'success');
            } catch (err) {
                const errMsg = err?.response?.data?.message || err.message || 'Lỗi khi thanh toán đơn thuê sách.';
                showToast(errMsg, 'error');
            } finally {
                if (checkoutBtn) checkoutBtn.disabled = false;
            }
        }

        // 7. WISHLIST & SHARE HELPERS
        // ----------------------------------------------------
        let isWishlisted = false;
        function toggleWishlist() {
            isWishlisted = !isWishlisted;
            const heart = document.getElementById('wishlistHeartIcon');
            const count = document.getElementById('wishlistCount');

            if (isWishlisted) {
                heart.className = 'ph-fill ph-heart text-base text-rose-500 scale-125 transition-transform';
                count.textContent = '(1,401)';
                showToast('Đã thêm vào Danh sách Yêu thích của bạn!', 'success');
            } else {
                heart.className = 'ph-bold ph-heart text-base text-rose-500 transition-transform';
                count.textContent = '(1.4k)';
                showToast('Đã bỏ yêu thích cuốn sách này.', 'info');
            }
            setTimeout(() => heart.classList.remove('scale-125'), 300);
        }

        function copyBookLink() {
            navigator.clipboard.writeText(window.location.href).then(() => {
                showToast('Đã sao chép liên kết sách vào bộ nhớ tạm!', 'success');
            }).catch(() => {
                showToast('Đã sao chép liên kết sách: ' + window.location.href, 'info');
            });
        }

        // ----------------------------------------------------
        // 8. AUDIO PREVIEW PLAYER WITH AMBIENT SYNTHESIS
        // ----------------------------------------------------
        let isAudioPlaying = false;
        let audioTimer = null;
        let audioSeconds = 0;
        let audioContext = null;
        let osc = null;

        function toggleAudioPreview() {
            isAudioPlaying = !isAudioPlaying;
            const icon = document.getElementById('audioPlayIcon');
            const wave = document.getElementById('audioWave');

            if (isAudioPlaying) {
                icon.className = 'ph-fill ph-pause text-xl';
                if (wave) wave.classList.add('audio-playing');
                startAudioTimer();
                playSoftAmbientTone();
                showToast('Đang phát bản nghe thử AI: Trúc Mai AI diễn đọc...', 'info');
            } else {
                icon.className = 'ph-fill ph-play text-xl ml-0.5';
                if (wave) wave.classList.remove('audio-playing');
                stopAudioTimer();
                stopSoftAmbientTone();
            }
        }

        function startAudioTimer() {
            if (audioTimer) clearInterval(audioTimer);
            audioTimer = setInterval(() => {
                audioSeconds++;
                if (audioSeconds >= 165) { // 2m 45s
                    audioSeconds = 0;
                    toggleAudioPreview();
                    return;
                }
                updateAudioDisplay();
            }, 1000);
        }

        function stopAudioTimer() {
            if (audioTimer) {
                clearInterval(audioTimer);
                audioTimer = null;
            }
        }

        function updateAudioDisplay() {
            const timeEl = document.getElementById('audioCurrentTime');
            const bar = document.getElementById('audioProgressBar');
            const mins = String(Math.floor(audioSeconds / 60)).padStart(2, '0');
            const secs = String(audioSeconds % 60).padStart(2, '0');
            if (timeEl) timeEl.textContent = `${mins}:${secs}`;
            if (bar) bar.style.width = `${(audioSeconds / 165) * 100}%`;
        }

        function seekAudio(e) {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickPos = (e.clientX - rect.left) / rect.width;
            audioSeconds = Math.floor(clickPos * 165);
            updateAudioDisplay();
            if (!isAudioPlaying) toggleAudioPreview();
        }

        function playSoftAmbientTone() {
            try {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                if (!AudioCtx) return;
                if (!audioContext) audioContext = new AudioCtx();
                if (audioContext.state === 'suspended') audioContext.resume();

                osc = audioContext.createOscillator();
                const gain = audioContext.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(320, audioContext.currentTime); // Soft melodic tone
                gain.gain.setValueAtTime(0.02, audioContext.currentTime);
                osc.connect(gain);
                gain.connect(audioContext.destination);
                osc.start();
            } catch (err) {
                // Ignore audio context constraints
            }
        }

        function stopSoftAmbientTone() {
            try {
                if (osc) {
                    osc.stop();
                    osc.disconnect();
                    osc = null;
                }
            } catch (e) {}
        }

        // ----------------------------------------------------
        // 9. TAB SWITCHING LOGIC
        // ----------------------------------------------------
        function switchTab(tabId) {
            const tabs = ['tab-summary', 'tab-excerpts', 'tab-author', 'tab-toc'];
            tabs.forEach(id => {
                const pane = document.getElementById(id);
                const btn = document.getElementById('btn-' + id);
                if (pane && btn) {
                    if (id === tabId) {
                        pane.classList.remove('hidden');
                        btn.className = 'tab-btn pb-3 px-1 text-wine dark:text-gold border-b-2 border-wine dark:border-gold whitespace-nowrap transition-colors font-bold';
                    } else {
                        pane.classList.add('hidden');
                        btn.className = 'tab-btn pb-3 px-1 text-ink-muted dark:text-night-muted hover:text-ink dark:hover:text-night-text border-b-2 border-transparent whitespace-nowrap transition-colors font-medium';
                    }
                }
            });
        }

        // ----------------------------------------------------
        // 10. COMMENT SUBMISSION & REPLIES
        // ----------------------------------------------------
        function postComment() {
            const textarea = document.getElementById('commentInput');
            const ratingContainer = document.getElementById('ratingStars');
            const text = textarea ? textarea.value.trim() : '';

            if (!text) {
                showToast('Vui lòng nhập nội dung cảm nhận của bạn!', 'error');
                return;
            }

            const rating = ratingContainer ? (ratingContainer.getAttribute('data-rating') || 5) : 5;
            let starsHtml = '';
            for (let i = 0; i < 5; i++) {
                starsHtml += i < rating ? '<i class="ph-fill ph-star"></i>' : '<i class="ph-bold ph-star text-gray-300"></i>';
            }

            const list = document.getElementById('reviewList');
            if (list) {
                const emptyNotice = document.getElementById('emptyReviewNotice');
                if (emptyNotice) {
                    emptyNotice.remove();
                }

                const item = document.createElement('div');
                item.className = 'review-item p-5 rounded-2xl bg-paper-50 dark:bg-night-surface border border-paper-border dark:border-night-border animate-fade-in';
                item.innerHTML = `
                    <div class="flex items-start justify-between mb-2">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-full bg-wine text-white font-bold font-serif flex items-center justify-center shrink-0">
                                B
                            </div>
                            <div>
                                <h4 class="font-bold text-sm text-ink dark:text-night-text flex items-center gap-1.5">
                                    Bạn (Độc giả HALM VIP)
                                    <span class="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full font-sans">Vừa xong</span>
                                </h4>
                                <span class="text-[11px] text-ink-muted dark:text-night-muted">Vừa đăng</span>
                            </div>
                        </div>
                        <div class="flex text-amber-400 text-xs">${starsHtml}</div>
                    </div>
                    <p class="text-sm text-ink/80 dark:text-night-muted leading-relaxed pl-13 mb-3">
                        "${text.replace(/</g, "&lt;").replace(/>/g, "&gt;")}"
                    </p>
                    <div class="flex items-center gap-4 text-xs text-ink-muted dark:text-night-muted pl-0 sm:pl-13">
                        <button onclick="likeComment(this)" class="flex items-center gap-1 hover:text-wine dark:hover:text-gold transition font-bold cursor-pointer">
                            <i class="ph-bold ph-thumbs-up"></i> <span>1</span>
                        </button>
                        <button onclick="toggleReplyBox(this)" class="flex items-center gap-1 hover:text-wine dark:hover:text-gold transition font-bold cursor-pointer">
                            <i class="ph-bold ph-chat-teardrop-dots"></i> Phản hồi
                        </button>
                    </div>

                    <!-- Reply Form Container -->
                    <div class="reply-box-container hidden mt-3 pl-0 sm:pl-13 pt-3 border-t border-paper-border/60 dark:border-night-border/60 animate-fade-in">
                        <div class="flex items-start gap-2.5 sm:gap-3 bg-paper-100/70 dark:bg-night-surface/90 p-3 sm:p-3.5 rounded-2xl border border-paper-border/70 dark:border-night-border/70">
                            <div class="w-8 h-8 rounded-full bg-wine text-white font-bold flex items-center justify-center shrink-0 text-xs shadow-2xs">
                                B
                            </div>
                            <div class="flex-1 min-w-0">
                                <textarea placeholder="Nhập câu trả lời của bạn..." rows="2" class="reply-input w-full bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border p-2.5 rounded-xl text-xs sm:text-sm text-ink dark:text-night-text placeholder-ink-muted focus:outline-none focus:border-wine dark:focus:border-gold transition resize-none"></textarea>
                                <div class="flex items-center justify-end gap-2 mt-2">
                                    <button type="button" onclick="cancelReply(this)" class="px-3 py-1.5 text-xs font-semibold text-ink-muted dark:text-night-muted hover:bg-paper-200 dark:hover:bg-night-card rounded-lg transition cursor-pointer">
                                        Hủy
                                    </button>
                                    <button type="button" onclick="submitReply(this)" class="bg-wine hover:bg-wine-dark text-white px-4 py-1.5 text-xs font-bold rounded-lg shadow-sm transition cursor-pointer flex items-center gap-1">
                                        <i class="ph-bold ph-paper-plane-tilt"></i> Gửi phản hồi
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Nested Replies List -->
                    <div class="replies-list-container space-y-2 mt-2.5 pl-0 sm:pl-13"></div>
                `;
                list.prepend(item);
                textarea.value = '';

                // Cập nhật số lượng đánh giá hiển thị
                const totalCount = list.querySelectorAll('.review-item').length;
                const totalEl = document.getElementById('totalReviewsCountText');
                const topEl = document.getElementById('topReviewCount');
                if (totalEl) totalEl.textContent = `${totalCount} đánh giá`;
                if (topEl) topEl.textContent = `${totalCount} đánh giá độc giả`;

                showToast('Đã đăng cảm nhận của bạn thành công! (+5 Khoai)', 'success');
            }
        }

        if (typeof window !== 'undefined') {
            window.postComment = postComment;
            window.likeComment = likeComment;
            window.toggleReplyBox = toggleReplyBox;
            window.cancelReply = cancelReply;
            window.submitReply = submitReply;
        }

        function likeComment(btn) {
            const span = btn.querySelector('span');
            const icon = btn.querySelector('i');
            if (span && icon) {
                let count = parseInt(span.textContent) || 0;
                if (!btn.classList.contains('liked')) {
                    btn.classList.add('liked', 'text-wine', 'dark:text-gold');
                    span.textContent = count + 1;
                    icon.className = 'ph-fill ph-thumbs-up';
                } else {
                    btn.classList.remove('liked', 'text-wine', 'dark:text-gold');
                    span.textContent = Math.max(0, count - 1);
                    icon.className = 'ph-bold ph-thumbs-up';
                }
            }
        }

        function toggleReplyBox(btn) {
            const reviewCard = btn.closest('.p-5');
            if (!reviewCard) return;

            let replyBox = reviewCard.querySelector('.reply-box-container');
            if (!replyBox) {
                replyBox = document.createElement('div');
                replyBox.className = 'reply-box-container mt-3 pl-0 sm:pl-13 pt-3 border-t border-paper-border/60 dark:border-night-border/60 animate-fade-in';
                replyBox.innerHTML = `
                    <div className="flex items-start gap-2.5 sm:gap-3 bg-paper-100/70 dark:bg-night-surface/90 p-3 sm:p-3.5 rounded-2xl border border-paper-border/70 dark:border-night-border/70">
                        <div className="w-8 h-8 rounded-full bg-wine text-white font-bold flex items-center justify-center shrink-0 text-xs shadow-2xs">
                            B
                        </div>
                        <div className="flex-1 min-w-0">
                            <textarea placeholder="Nhập câu trả lời của bạn..." rows="2" className="reply-input w-full bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border p-2.5 rounded-xl text-xs sm:text-sm text-ink dark:text-night-text placeholder-ink-muted focus:outline-none focus:border-wine dark:focus:border-gold transition resize-none"></textarea>
                            <div className="flex items-center justify-end gap-2 mt-2">
                                <button type="button" onclick="cancelReply(this)" className="px-3 py-1.5 text-xs font-semibold text-ink-muted dark:text-night-muted hover:bg-paper-200 dark:hover:bg-night-card rounded-lg transition cursor-pointer">
                                    Hủy
                                </button>
                                <button type="button" onclick="submitReply(this)" className="bg-wine hover:bg-wine-dark text-white px-4 py-1.5 text-xs font-bold rounded-lg shadow-sm transition cursor-pointer flex items-center gap-1">
                                    <i className="ph-bold ph-paper-plane-tilt"></i> Gửi phản hồi
                                </button>
                            </div>
                        </div>
                    </div>
                `;
                reviewCard.appendChild(replyBox);
            } else {
                replyBox.classList.toggle('hidden');
            }

            if (!replyBox.classList.contains('hidden')) {
                const input = replyBox.querySelector('.reply-input');
                if (input) {
                    input.focus();
                }
            }
        }

        function cancelReply(btn) {
            const replyBox = btn.closest('.reply-box-container');
            if (replyBox) {
                replyBox.classList.add('hidden');
                const input = replyBox.querySelector('.reply-input');
                if (input) input.value = '';
            }
        }

        function submitReply(btn) {
            const replyBox = btn.closest('.reply-box-container');
            if (!replyBox) return;
            const input = replyBox.querySelector('.reply-input');
            const text = input ? input.value.trim() : '';

            if (!text) {
                showToast('Vui lòng nhập nội dung phản hồi của bạn!', 'error');
                if (input) input.focus();
                return;
            }

            const reviewCard = btn.closest('.p-5');
            let repliesList = reviewCard ? reviewCard.querySelector('.replies-list-container') : null;
            if (!repliesList && reviewCard) {
                repliesList = document.createElement('div');
                repliesList.className = 'replies-list-container space-y-2 mt-2.5 pl-0 sm:pl-13';
                reviewCard.appendChild(repliesList);
            }

            if (repliesList) {
                const replyItem = document.createElement('div');
                replyItem.className = 'flex items-start gap-2.5 bg-paper-100/60 dark:bg-night-surface/60 p-3 rounded-xl border border-paper-border/50 dark:border-night-border/50 text-xs animate-fade-in';
                replyItem.innerHTML = `
                    <div className="w-7 h-7 rounded-full bg-wine text-white font-bold flex items-center justify-center shrink-0 text-[11px] shadow-2xs">
                        B
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                            <span className="font-bold text-ink dark:text-night-text">Bạn (Phản hồi)</span>
                            <span className="text-[10px] text-ink-muted dark:text-night-muted">Vừa xong</span>
                        </div>
                        <p className="text-ink/90 dark:text-night-muted leading-relaxed text-xs">
                            ${text.replace(/</g, "&lt;").replace(/>/g, "&gt;")}
                        </p>
                    </div>
                `;
                repliesList.appendChild(replyItem);
            }

            input.value = '';
            replyBox.classList.add('hidden');
            showToast('Đã gửi phản hồi thành công! (+2 Khoai)', 'success');
        }

        // ----------------------------------------------------
        // 11. AI CHATBOT INTERACTION
        // ----------------------------------------------------
        function toggleChatbot(forceState) {
            const popup = document.getElementById('chatbotPopup');
            if (!popup) return;
            if (typeof forceState === 'boolean') {
                popup.classList.toggle('hidden', !forceState);
            } else {
                popup.classList.toggle('hidden');
            }
            if (!popup.classList.contains('hidden')) {
                const input = document.getElementById('chatInput');
                if (input) input.focus();
            }
        }

        function sendQuickPrompt(prompt) {
            const input = document.getElementById('chatInput');
            if (input) {
                input.value = prompt;
                sendChatMessage();
            }
        }

        function sendChatMessage() {
            const input = document.getElementById('chatInput');
            const container = document.getElementById('chatMessages');
            if (!input || !container) return;
            const message = input.value.trim();
            if (!message) return;

            // User bubble
            const userMsg = document.createElement('div');
            userMsg.className = 'flex justify-end';
            userMsg.innerHTML = `
                <div className="p-3 rounded-2xl rounded-tr-sm bg-wine text-white max-w-[85%] leading-relaxed">
                    ${message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}
                </div>
            `;
            container.appendChild(userMsg);
            input.value = '';
            container.scrollTop = container.scrollHeight;

            // Bot answer simulation
            setTimeout(() => {
                let reply = "Đây là một trong những tác phẩm hay nhất của nhà văn Nguyễn Nhật Ánh về tuổi trưởng thành. Tác phẩm kể về mối tình sâu sắc nhưng trắc trở giữa Vinh, Miền và Phúc, mang đến nhiều thông điệp xúc động về sự bao dung.";
                if (message.toLowerCase().includes('mắt biếc')) {
                    reply = "So với 'Mắt Biếc' (nỗi đau âm thầm đơn phương), 'Ngày Xưa Có Một Chuyện Tình' đi sâu hơn vào ngã rẽ của tuổi trưởng thành và sự lựa chọn đầy đức hy sinh, mang kết thúc ấm áp hơn.";
                } else if (message.toLowerCase().includes('ý nghĩa')) {
                    reply = "Ý nghĩa cốt lõi của cuốn sách là: Tình yêu đích thực không phải là chiếm đoạt, mà là thấu hiểu, chở che và tha thứ cho nhau sau những phong ba cuộc đời.";
                }

                const botMsg = document.createElement('div');
                botMsg.className = 'flex gap-2 items-start';
                botMsg.innerHTML = `
                    <img src="img/icon-removebg-preview.png" className="w-6 h-6 object-contain shrink-0 mt-0.5" />
                    <div className="p-3 rounded-2xl rounded-tl-sm bg-paper-100 dark:bg-night-surface text-ink dark:text-night-text leading-relaxed">
                        ${reply}
                    </div>
                `;
                container.appendChild(botMsg);
                container.scrollTop = container.scrollHeight;
            }, 700);
        }

        // ----------------------------------------------------
        // 12. TOAST SYSTEM
        // ----------------------------------------------------
        function showToast(message, type = 'info') {
            const container = document.getElementById('toastContainer');
            if (!container) return;

            const toast = document.createElement('div');
            let icon = 'ph-info';
            let borderClass = 'border-wine dark:border-gold';
            let bgClass = 'bg-paper-surface dark:bg-night-card text-ink dark:text-night-text';

            if (type === 'success') {
                icon = 'ph-check-circle text-emerald-500';
            } else if (type === 'error') {
                icon = 'ph-warning-circle text-rose-500';
            } else {
                icon = 'ph-sparkle text-wine dark:text-gold';
            }

            toast.className = `flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl border ${borderClass} ${bgClass} text-xs font-semibold pointer-events-auto transform transition-all duration-300 translate-y-2 opacity-0`;
            toast.innerHTML = `
                <i className="ph-bold ${icon} text-base shrink-0"></i>
                <span>${message}</span>
            `;

            container.appendChild(toast);

            requestAnimationFrame(() => {
                toast.classList.remove('translate-y-2', 'opacity-0');
            });

            setTimeout(() => {
                toast.classList.add('opacity-0', 'translate-y-2');
                setTimeout(() => toast.remove(), 300);
            }, 3500);
        }
    

export default function ChiTietSach() {
    useOriginalDesignAssets();
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const bookId = id || searchParams.get('id');

    const [book, setBook] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [rentStatus, setRentStatus] = useState({
        hasAccess: false,
        remainingDays: 0,
        isForever: false,
        status: ''
    });

    // ==========================================
    // 1. STATE QUẢN LÝ ĐÁNH GIÁ & CẢM NHẬN ĐỘC GIẢ
    // ==========================================
    const [reviews, setReviews] = useState([]);
    const [isLoadingReviews, setIsLoadingReviews] = useState(false);
    const [selectedStar, setSelectedStar] = useState(5);
    const [hoverStar, setHoverStar] = useState(0);
    const [commentInput, setCommentInput] = useState("");
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);
    const [activeReplyId, setActiveReplyId] = useState(null);
    const [replyInputText, setReplyInputText] = useState("");
    const [isSubmittingReply, setIsSubmittingReply] = useState(false);

    // ==========================================
    // STATE QUẢN LÝ SÁCH YÊU THÍCH (WISHLIST)
    // ==========================================
    const [isFavorite, setIsFavorite] = useState(false);
    const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);

    useEffect(() => {
        if (!bookId || !isTokenValid()) return;
        checkIsFavorite(bookId).then(setIsFavorite).catch(() => {});
    }, [bookId]);

    const handleToggleFavorite = async () => {
        if (!isTokenValid()) {
            openAuthModal({ mode: 'login', message: 'Vui lòng đăng nhập để lưu tác phẩm vào danh sách Yêu Thích!' });
            return;
        }
        try {
            setIsFavoriteLoading(true);
            const res = await toggleFavorite(bookId);
            setIsFavorite(res.isFavorite);
            window.dispatchEvent(new CustomEvent('halm-favorites-updated', {
                detail: { bookId, isFavorite: res.isFavorite }
            }));
            const toastFn = window.showToast || alert;
            toastFn(res.message || (res.isFavorite ? 'Đã thêm tác phẩm vào danh sách Yêu Thích!' : 'Đã xóa khỏi danh sách Yêu Thích!'));
        } catch (err) {
            console.error('Lỗi khi thao tác yêu thích:', err);
        } finally {
            setIsFavoriteLoading(false);
        }
    };

    // ==========================================
    // 2. STATE QUẢN LÝ CHATBOT TRỢ LÝ AI
    // ==========================================
    const [isChatbotOpen, setIsChatbotOpen] = useState(false);
    const [chatMessages, setChatMessages] = useState([]);
    const [chatInputText, setChatInputText] = useState("");
    const [isChatbotLoading, setIsChatbotLoading] = useState(false);
    const chatBodyRef = useRef(null);

    // Tải danh sách đánh giá từ Backend
    const fetchEvaluates = async (targetBookId) => {
        if (!targetBookId) return;
        try {
            setIsLoadingReviews(true);
            const res = await axiosInstance.get(`/api/home/books/${encodeURIComponent(targetBookId)}/evaluates`);
            if (Array.isArray(res.data)) {
                setReviews(res.data);
            }
        } catch (err) {
            console.warn("Không thể tải danh sách đánh giá từ máy chủ:", err);
        } finally {
            setIsLoadingReviews(false);
        }
    };

    // Gửi đánh giá mới kèm số sao lên Backend
    const handlePostReview = async () => {
        // CHẶN KHÁCH VÃNG LAI: Yêu cầu đăng nhập trước khi đánh giá
        if (!isTokenValid()) {
            showToast('Vui lòng đăng nhập để gửi cảm nhận và đánh giá sách!', 'error');
            openAuthModal({ mode: 'login', message: 'Vui lòng đăng nhập để gửi đánh giá cho tác phẩm này!' });
            return;
        }

        const text = commentInput.trim();
        if (!text) {
            showToast('Vui lòng nhập nội dung cảm nhận của bạn!', 'error');
            return;
        }

        const targetBookId = book?.book_id || book?.id || bookId;
        if (!targetBookId) {
            showToast('Không xác định được mã sách!', 'error');
            return;
        }

        try {
            setIsSubmittingReview(true);
            const currentToken = sessionStorage.getItem("token") || localStorage.getItem("token");
            const config = currentToken ? { headers: { Authorization: `Bearer ${currentToken}` } } : {};

            const res = await axiosInstance.post(
                `/api/home/books/${encodeURIComponent(targetBookId)}/evaluates`,
                {
                    bookId: targetBookId,
                    star: selectedStar,
                    content: text
                },
                config
            );

            if (res.data) {
                setReviews(prev => [res.data, ...prev]);
                setCommentInput("");
                setSelectedStar(5);
                setHoverStar(0);
                showToast('🎉 Đã đăng cảm nhận thành công! (+5 Khoai)', 'success');
            }
        } catch (err) {
            console.error("Lỗi khi gửi đánh giá:", err);
            const msg = err.response?.data?.message || 'Không thể lưu đánh giá. Vui lòng thử lại sau!';
            showToast(msg, 'error');
        } finally {
            setIsSubmittingReview(false);
        }
    };

    // Tăng lượt thích cho 1 đánh giá
    const handleLikeReview = async (evaluateId) => {
        if (!isTokenValid()) {
            showToast('Vui lòng đăng nhập để tương tác thích đánh giá!', 'error');
            openAuthModal({ mode: 'login', message: 'Vui lòng đăng nhập để tương tác cùng bạn đọc!' });
            return;
        }
        try {
            const res = await axiosInstance.post(`/api/home/evaluates/${evaluateId}/like`);
            const newCount = res.data?.likesCount;
            setReviews(prev => prev.map(r => r.evaluateId === evaluateId ? { ...r, likesCount: newCount } : r));
        } catch (err) {
            console.warn("Lỗi khi thích đánh giá:", err);
        }
    };

    // Gửi phản hồi (reply) cho 1 đánh giá
    const handleSubmitReply = async (parentId) => {
        if (!isTokenValid()) {
            showToast('Vui lòng đăng nhập để gửi phản hồi đánh giá!', 'error');
            openAuthModal({ mode: 'login', message: 'Vui lòng đăng nhập để tham gia thảo luận!' });
            return;
        }
        const text = replyInputText.trim();
        if (!text) {
            showToast('Vui lòng nhập nội dung phản hồi!', 'error');
            return;
        }
        const targetBookId = book?.book_id || book?.id || bookId;
        try {
            setIsSubmittingReply(true);
            const currentToken = sessionStorage.getItem("token") || localStorage.getItem("token");
            const config = currentToken ? { headers: { Authorization: `Bearer ${currentToken}` } } : {};

            const res = await axiosInstance.post(
                `/api/home/books/${encodeURIComponent(targetBookId)}/evaluates`,
                {
                    bookId: targetBookId,
                    content: text,
                    parentId: parentId
                },
                config
            );

            if (res.data) {
                setReviews(prev => prev.map(r => {
                    if (r.evaluateId === parentId) {
                        return { ...r, replies: [...(r.replies || []), res.data] };
                    }
                    return r;
                }));
                setReplyInputText("");
                setActiveReplyId(null);
                showToast('Đã gửi phản hồi thành công! (+2 Khoai)', 'success');
            }
        } catch (err) {
            showToast('Không thể gửi phản hồi lúc này.', 'error');
        } finally {
            setIsSubmittingReply(false);
        }
    };

    // Gửi câu hỏi đến Trợ lý Sách AI
    const handleSendChatMessage = async (textToSend) => {
        const msg = (typeof textToSend === 'string' ? textToSend : chatInputText).trim();
        if (!msg || isChatbotLoading) return;

        setChatMessages(prev => [...prev, { sender: 'user', text: msg }]);
        setChatInputText("");
        setIsChatbotLoading(true);

        setTimeout(() => {
            if (chatBodyRef.current) {
                chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
            }
        }, 50);

        try {
            const currentToken = sessionStorage.getItem("token") || localStorage.getItem("token");
            const config = currentToken ? { headers: { Authorization: `Bearer ${currentToken}` } } : {};

            const res = await axiosInstance.post(
                "/api/chat",
                { message: msg },
                config
            );

            const reply = res.data?.reply;
            if (reply) {
                setChatMessages(prev => [...prev, { sender: 'bot', text: reply }]);
            } else {
                setChatMessages(prev => [...prev, { sender: 'bot', text: "Hiện tại trợ lý chưa nhận được thông tin phù hợp, bạn thử hỏi lại câu khác nhé." }]);
            }
        } catch (err) {
            console.error("Lỗi AI Chatbot:", err);
            const errMsg = err.response?.data?.reply || err.response?.data?.message || "Hệ thống AI đang quá tải hoặc bảo trì. Vui lòng thử lại sau giây lát.";
            setChatMessages(prev => [...prev, { sender: 'bot', text: errMsg }]);
        } finally {
            setIsChatbotLoading(false);
            setTimeout(() => {
                if (chatBodyRef.current) {
                    chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
                }
            }, 100);
        }
    };

    const handleReadBook = () => {
        if (!book) {
            showToast('Đang tải thông tin sách, vui lòng thử lại sau.', 'info');
            return;
        }

        // Mở chức năng đọc thử: Khách vãng lai và người chưa thuê đều được đọc thử miễn phí với mode=trial
        const hasFullAccess = isTokenValid() && rentStatus.hasAccess;
        const readModeParam = hasFullAccess ? 'full' : 'trial';

        const bookCard = document.getElementById('book-card');
        const coverUrl = book.img_url || book.img || '/logo.png';
        const targetBookId = book.book_id || book.id || bookId;

        // Lưu thông tin sách đầy đủ vào sessionStorage trước khi mở reader
        try {
            sessionStorage.setItem('halm-reader-book', JSON.stringify({
                ...book,
                book_id: targetBookId,
                id: targetBookId,
                title: book.bookName || book.title,
                bookName: book.bookName || book.title,
                author: book.author || book.authorName,
                authorName: book.author || book.authorName,
                img_url: coverUrl,
                coverImage: coverUrl
            }));
        } catch (_) {}

        openBookReaderTransition({
            bookCard,
            coverUrl,
            book,
            onComplete: () => {
                if (targetBookId) {
                    navigate('/docsach/' + encodeURIComponent(targetBookId) + `?mode=${readModeParam}`);
                } else {
                    navigate(`/docsach?mode=${readModeParam}`);
                }
            },
        });
    };

    useEffect(() => {
        const controller = new AbortController();

        const fetchBookDetail = async () => {
            try {
                setIsLoading(true);
                setError("");

                let targetId = bookId;

                // Nếu không có ID trên URL, tự động truy vấn lấy cuốn sách đầu tiên làm mặc định
                if (!targetId) {
                    const listRes = await axiosInstance.get('/api/home/books', {
                        params: { page: 0, size: 1 },
                        signal: controller.signal
                    });
                    const payload = listRes.data;
                    const items = Array.isArray(payload)
                        ? payload
                        : Array.isArray(payload?.content)
                            ? payload.content
                            : Array.isArray(payload?.data)
                                ? payload.data
                                : [];
                    if (items.length > 0) {
                        targetId = items[0].book_id || items[0].id;
                    }
                }

                if (!targetId) {
                    setError("Không tìm thấy mã sách hợp lệ.");
                    setIsLoading(false);
                    return;
                }

                const response = await axiosInstance.get(`/api/home/books/${encodeURIComponent(targetId)}`, {
                    signal: controller.signal
                });

                if (response.data) {
                    setBook(response.data);
                    window.__CURRENT_BOOK_PDF__ = response.data.pdf_url;
                    window.__CURRENT_BOOK__ = response.data;
                    fetchEvaluates(targetId);
                    setChatMessages([
                        {
                            sender: 'bot',
                            text: `Chào bạn! Mình là Trợ lý Sách HALM. Bạn muốn tìm hiểu thêm về cuốn sách "${response.data.bookName || 'này'}" của tác giả ${response.data.author || 'này'} hay nhận gợi ý tác phẩm tương tự?`
                        }
                    ]);

                    // Kiểm tra trạng thái đã sở hữu / thuê của người dùng
                    try {
                        const checkRes = await axiosInstance.get(`/api/home/bookshelf/check/${encodeURIComponent(targetId)}`, {
                            signal: controller.signal
                        });
                        if (checkRes.data?.hasAccess) {
                            let daysLeft = 0;
                            let isForeverOwned = false;
                            let statusText = 'ACTIVE';
                            try {
                                const shelfRes = await axiosInstance.get('/api/home/bookshelf', { signal: controller.signal });
                                if (Array.isArray(shelfRes.data)) {
                                    const match = shelfRes.data.find(b => String(b.bookId) === String(targetId) || String(b.id) === String(targetId));
                                    if (match) {
                                        daysLeft = match.remainingDays ?? 0;
                                        isForeverOwned = Boolean(match.isForever || match.remainingDays > 1000);
                                        statusText = match.status || 'ACTIVE';
                                    }
                                }
                            } catch (_) {}
                            setRentStatus({
                                hasAccess: true,
                                remainingDays: daysLeft,
                                isForever: isForeverOwned,
                                status: statusText
                            });
                        } else {
                            setRentStatus({ hasAccess: false, remainingDays: 0, isForever: false, status: '' });
                        }
                    } catch (_) {
                        setRentStatus({ hasAccess: false, remainingDays: 0, isForever: false, status: '' });
                    }
                } else {
                    setError("Không nhận được dữ liệu sách từ máy chủ.");
                }
            } catch (err) {
                if (controller.signal.aborted) return;
                console.error("Lỗi khi tải chi tiết sách:", err);
                setError(err.response?.data?.message || err.message || "Không thể tải thông tin sách.");
            } finally {
                if (!controller.signal.aborted) {
                    setIsLoading(false);
                }
            }
        };

        fetchBookDetail();

        return () => controller.abort();
    }, [bookId]);

    // Lắng nghe cập nhật Tủ Sách từ Giỏ Hàng hoặc Mua Sách
    useEffect(() => {
        const handleBookshelfUpdated = () => {
            const targetId = bookId || (book ? (book.book_id || book.id) : '');
            if (targetId) {
                axiosInstance.get(`/api/home/bookshelf/check/${encodeURIComponent(targetId)}`)
                    .then(res => {
                        if (res.data?.hasAccess) {
                            axiosInstance.get('/api/home/bookshelf').then(shelfRes => {
                                if (Array.isArray(shelfRes.data)) {
                                    const match = shelfRes.data.find(b => String(b.bookId) === String(targetId) || String(b.id) === String(targetId));
                                    if (match) {
                                        setRentStatus({
                                            hasAccess: true,
                                            remainingDays: match.remainingDays ?? 0,
                                            isForever: Boolean(match.isForever || match.remainingDays > 1000),
                                            status: match.status || 'ACTIVE'
                                        });
                                    }
                                }
                            }).catch(() => {});
                        } else {
                            setRentStatus({ hasAccess: false, remainingDays: 0, isForever: false, status: '' });
                        }
                    }).catch(() => {});
            }
        };
        window.addEventListener('halm-bookshelf-updated', handleBookshelfUpdated);
        return () => window.removeEventListener('halm-bookshelf-updated', handleBookshelfUpdated);
    }, [bookId, book]);

    // Quản lý số dư Khoai thực tế của người dùng
    const [userKhoai, setUserKhoai] = useState(0);

    useEffect(() => {
        let isMounted = true;
        const fetchUserKhoai = async () => {
            try {
                const res = await axiosInstance.get('/api/home/customer/info');
                if (isMounted && res.data && res.data.potatoBalance !== undefined) {
                    const balance = res.data.potatoBalance;
                    setUserKhoai(balance);
                    const el = document.getElementById('user-khoai-val');
                    if (el) el.textContent = balance.toLocaleString();
                    const modalEl = document.getElementById('rentalModalUserKhoai');
                    if (modalEl) modalEl.textContent = balance.toLocaleString();
                    const drawerEl = document.getElementById('cartDrawerUserKhoai');
                    if (drawerEl) drawerEl.textContent = balance.toLocaleString();
                }
            } catch (e) {
                // Khách vãng lai chưa đăng nhập
            }
        };
        fetchUserKhoai();

        const handlePotatoUpdated = (event) => {
            if (event?.detail) {
                const val = event.detail.potatoBalance ?? event.detail.balance ?? 0;
                setUserKhoai(val);
                const el = document.getElementById('user-khoai-val');
                if (el) el.textContent = val.toLocaleString();
                const modalEl = document.getElementById('rentalModalUserKhoai');
                if (modalEl) modalEl.textContent = val.toLocaleString();
                const drawerEl = document.getElementById('cartDrawerUserKhoai');
                if (drawerEl) drawerEl.textContent = val.toLocaleString();
            } else {
                fetchUserKhoai();
            }
        };
        window.addEventListener('halm-potato-updated', handlePotatoUpdated);
        return () => {
            isMounted = false;
            window.removeEventListener('halm-potato-updated', handlePotatoUpdated);
        };
    }, []);

    useEffect(() => {
        if (document.documentElement.classList.contains('dark')) {
            createStars();
        }
    }, []);

    // Tính toán số sao trung bình và số lượng đánh giá thực tế từ state reviews
    const calculatedAvgRating = reviews.length > 0
        ? (reviews.reduce((sum, r) => sum + (r.star || 5), 0) / reviews.length).toFixed(1)
        : (book?.rating ? Number(book.rating).toFixed(1) : '5.0');
    const totalReviewCount = reviews.length;
    const reviewStatusText = totalReviewCount === 0 ? "Chưa có đánh giá" : `${totalReviewCount} đánh giá độc giả`;

    return (
        <>
            <style>{pageStyles}</style>
            <style>{`
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
            `}</style>
            <UserLayout 
                className="selection:bg-wine-100 selection:text-wine dark:selection:bg-wine-dark dark:selection:text-gold-light"
                onOpenChatbot={(prompt) => {
                    setIsChatbotOpen(true);
                    if (prompt) handleSendChatMessage(prompt);
                }}
            >
            <div className="antialiased flex flex-col min-h-screen relative pt-24">
{/* Màn chắn chống nháy giao diện khi quay lại từ trang đọc */}
    

    {/* Starry background for Dark Mode */}
    <div id="starry-background"></div>

    {/* ========================================================
         HEADER / NAVBAR (MATCHING HALM BOOK DESIGN SYSTEM)
         ======================================================== */}
    {false && (<header className="sticky top-0 z-50 bg-[#FAF7F2]/90 dark:bg-[#111210]/90 backdrop-blur-md border-b border-paper-border dark:border-night-border transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
            
            {/* Brand Logo */}
            <div className="flex items-center gap-3 shrink-0">
                <a href="/" className="flex items-center gap-2.5 group">
                    <img src="/logo.png" alt="HALM BOOK Mascot" className="w-10 h-10 object-contain group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300" />
                    <div className="flex flex-col">
                        <span className="font-outfit font-black tracking-tight text-xl sm:text-2xl text-ink dark:text-night-text uppercase leading-none group-hover:text-wine dark:group-hover:text-gold transition-colors">
                            HALM BOOK
                        </span>
                        <span className="text-[9px] tracking-widest uppercase font-semibold text-ink-muted dark:text-night-muted">
                            Không gian đọc & Tri thức
                        </span>
                    </div>
                </a>
            </div>

            {/* Desktop Nav Links */}
            <nav className="hidden lg:flex items-center gap-6 xl:gap-8 text-xs font-bold tracking-wider uppercase" aria-label="Main Navigation">
                <a href="/" className="text-ink/75 dark:text-night-muted hover:text-wine dark:hover:text-gold transition-colors">Trang Chủ</a>
                <a href="offers_end.html" className="text-ink/75 dark:text-night-muted hover:text-wine dark:hover:text-gold transition-colors">Ưu Đãi</a>
                <a href="/chitietsach" className="text-wine dark:text-gold font-black transition-colors relative py-1 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2.5px] after:bg-wine dark:after:bg-gold after:rounded-full">
                    Chi Tiết Sách
                </a>
                <a href="#tuy-chon-thue" className="text-ink/75 dark:text-night-muted hover:text-wine dark:hover:text-gold transition-colors">Bảng Giá Thuê</a>
                <a href="#tu-sach" onClick={(event) => { showToast('Chức năng Tủ sách cá nhân đang mở!', 'info') }} className="text-ink/75 dark:text-night-muted hover:text-wine dark:hover:text-gold transition-colors">Tủ Sách</a>
                <button type="button" onClick={(event) => { toggleChatbot(true) }} className="text-wine dark:text-gold flex items-center gap-1.5 font-black hover:opacity-80 transition-opacity bg-wine/5 dark:bg-gold/10 px-3 py-1.5 rounded-full border border-wine/15 dark:border-gold/20">
                    <i className="ph-bold ph-sparkle text-sm animate-pulse"></i> Trợ Lý AI
                </button>
            </nav>

            {/* Search Bar */}
            <div className="hidden md:flex flex-1 max-w-xs relative">
                <div className="w-full relative flex items-center">
                    <i className="ph ph-magnifying-glass absolute left-3.5 text-ink-muted dark:text-night-muted text-sm"></i>
                    <input type="text" id="searchInput" placeholder="Tìm tên sách, tác giả..." 
                           className="w-full pl-9 pr-8 py-2 rounded-full text-xs font-medium bg-[#F0ECE3] dark:bg-night-card border border-paper-border dark:border-night-border focus:outline-none focus:border-wine dark:focus:border-gold text-ink dark:text-night-text placeholder-ink-muted transition-all shadow-inner" />
                </div>
            </div>

            {/* Utility Controls */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">

                {/* Giỏ Hàng Thuê / Mua Sách */}
                <button type="button" onClick={(event) => { toggleCartDrawer(true) }} className="p-2.5 rounded-full text-ink dark:text-night-text hover:bg-paper-200 dark:hover:bg-night-card transition-colors relative cursor-pointer group" title="Giỏ hàng thuê & mua sách">
                    <i className="ph-bold ph-shopping-cart text-xl group-hover:scale-110 transition-transform"></i>
                    <span id="cartCountBadge" className="absolute top-1 right-1 w-4 h-4 bg-amber-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center font-outfit shadow-sm">0</span>
                </button>

                {/* Tủ Sách Thuê Online */}
                <button type="button" onClick={(event) => { showToast('Tủ sách online: Bạn đang thuê 1 cuốn sách hoạt động', 'info') }} className="p-2.5 rounded-full text-ink dark:text-night-text hover:bg-paper-200 dark:hover:bg-night-card transition-colors relative cursor-pointer" title="Tủ sách thuê online">
                    <i className="ph-bold ph-books text-xl"></i>
                    <span id="rentedCountBadge" className="absolute top-1 right-1 w-4 h-4 bg-wine text-white text-[10px] font-bold rounded-full flex items-center justify-center font-outfit shadow-sm">1</span>
                </button>

                {/* User Account */}
                <button type="button" onClick={(event) => { showToast('Đã đăng nhập tài khoản: Độc Giả HALM BOOK', 'info') }} className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold text-ink dark:text-night-text hover:bg-paper-200 dark:hover:bg-night-card border border-paper-border dark:border-night-border transition-colors">
                    <i className="ph-bold ph-user text-xs"></i>
                    <span>Tài Khoản</span>
                </button>

                {/* Theme Toggle */}
                <button id="themeToggleBtn" className="p-2.5 rounded-full text-ink dark:text-night-text hover:bg-paper-200 dark:hover:bg-night-card transition-colors" title="Đổi chế độ Sáng / Tối" aria-label="Toggle Theme">
                    <i id="themeIcon" className="ph-bold ph-moon text-xl"></i>
                </button>

                {/* Mobile Menu Button */}
                <button id="mobileMenuBtn" className="lg:hidden p-2 rounded-full text-ink dark:text-night-text hover:bg-paper-200 dark:hover:bg-night-card">
                    <i className="ph-bold ph-list text-2xl"></i>
                </button>
            </div>
        </div>

        {/* Mobile Drawer */}
        <div id="mobileDrawer" className="hidden lg:hidden px-6 py-4 bg-paper-surface dark:bg-night-surface border-b border-paper-border dark:border-night-border space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-paper-border dark:border-night-border">
                <span className="text-xs text-ink-muted dark:text-night-muted">Số dư khoai:</span>
                <span className="text-xs font-bold text-gold flex items-center gap-1 cursor-pointer" onClick={() => navigate('/canhan?tab=wallet')}>{userKhoai.toLocaleString()} Khoai <i className="ph-fill ph-coins"></i></span>
            </div>
            <nav className="flex flex-col gap-2.5 text-xs font-bold uppercase tracking-wider">
                <a href="/" className="py-1 text-ink dark:text-night-text hover:text-wine">Trang Chủ</a>
                <a href="offers_end.html" className="py-1 text-ink dark:text-night-text hover:text-wine">Ưu Đãi Đặc Quyền</a>
                <a href="/chitietsach" className="py-1 text-wine dark:text-gold">Chi Tiết Sách</a>
                <a href="#tuy-chon-thue" className="py-1 text-ink dark:text-night-text hover:text-wine">Bảng Giá Thuê</a>
                <a href="#tu-sach" className="py-1 text-ink dark:text-night-text hover:text-wine">Tủ Sách</a>
            </nav>
        </div>
    </header>)}

    {/* ========================================================
         MAIN CONTENT: BOOK DETAILS HERO
         ======================================================== */}
    <main className="flex-grow py-8 md:py-12 relative z-10">
        {isLoading && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
                <div className="p-4 rounded-2xl bg-wine/5 dark:bg-gold/10 border border-wine/20 dark:border-gold/30 text-xs font-bold text-wine dark:text-gold flex items-center gap-2 animate-pulse">
                    <i className="ph-bold ph-spinner-gap animate-spin text-base"></i> Đang tải thông tin chi tiết sách từ máy chủ...
                </div>
            </div>
        )}
        {error && !book && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
                <div className="p-5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs font-bold text-rose-700 dark:text-rose-300 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <i className="ph-bold ph-warning-circle text-base"></i>
                        <span>{error}</span>
                    </div>
                    <button type="button" onClick={() => navigate('/')} className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs hover:bg-rose-700 transition">
                        Về Trang Chủ
                    </button>
                </div>
            </div>
        )}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            

            {/* Book Hero Grid (2 Columns: Showcase & Specifications) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
                
                {/* ================= LEFT COLUMN: BOOK 3D SHOWCASE ================= */}
                <div className="lg:col-span-5 flex flex-col items-center">
                    
                    <div className="sticky top-28 w-full max-w-sm flex flex-col items-center">
                        
                        {/* 3D Interactive Book Stage */}
                        <div className="book-stage w-full flex justify-center py-4">
                            <div id="book-card" onClick={handleReadBook} role="button" tabIndex={0} onKeyDown={(event) => {
                                if (event.key === 'Enter' || event.key === ' ') handleReadBook();
                            }} className="book-3d w-[270px] sm:w-[310px] aspect-[2/3] rounded-r-2xl rounded-l-sm relative cursor-pointer select-none shadow-book-real" aria-label="Mở sách để đọc">
                                
                                {/* Spine gradient & crease */}
                                <div className="absolute left-0 top-0 bottom-0 w-5 bg-gradient-to-r from-black/50 via-black/10 to-transparent z-20 rounded-l-sm pointer-events-none"></div>

                                {/* Book Cover Image */}
                                <img src={book?.img_url || book?.img || "/logo.png"} onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src='/logo.png'; }} alt={book?.bookName || book?.title || "Bìa sách"} className="w-full h-full object-cover rounded-r-2xl rounded-l-sm relative z-10" />

                                {/* Realistic dynamic light glare */}
                                <div id="bookGlare" className="book-glare z-20"></div>

                                {/* Top-Right Online Rental Badge */}
                                <div className="absolute top-4 right-4 z-30 flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#8E3038] text-white text-[11px] font-outfit font-black uppercase tracking-wider shadow-md">
                                    <i className="ph-fill ph-book-open-text text-amber-300"></i> Thuê Đọc Online
                                </div>

                                {/* Bottom Metadata Ribbon on Cover */}
                                <div className="absolute bottom-3 left-3 right-3 z-30 bg-black/60 backdrop-blur-md text-white/90 px-3.5 py-2 rounded-xl flex items-center justify-between text-xs font-semibold border border-white/10 shadow-lg">
                                    <span className="flex items-center gap-1.5 text-[11px]">
                                        <i className="ph-fill ph-shield-check text-emerald-400"></i> Bản Quyền Đọc Online
                                    </span>
                                    <span className="font-outfit font-bold text-[11px] text-amber-300">
                                        {book?.totalPages ? `${book.totalPages} Trang Ebook` : 'Bản Đọc Ebook'}
                                    </span>
                                </div>
                            </div>
                        </div>


                    </div>
                </div>

                {/* ================= RIGHT COLUMN: BOOK INFORMATION & ACTIONS ================= */}
                <div className="lg:col-span-7 flex flex-col">
                    
                    {/* Top Category & Reward Badges */}
                    <div className="flex flex-wrap items-center justify-between gap-2.5 mb-2.5">
                        <div className="flex items-center gap-2">
                            <span className="px-3 py-1 rounded-full bg-wine/10 dark:bg-gold/15 text-wine dark:text-gold text-[11px] font-bold font-outfit uppercase tracking-wider">
                                {book?.category_name || (book?.category_id === 1 ? 'Tiểu Thuyết Văn Học' : book?.category_id === 2 ? 'Sách Thiếu Nhi' : book?.category_id === 3 ? 'Kỹ Năng & Phát Triển' : 'Sách Tuyển Chọn')}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="px-3 py-1 rounded-full bg-[#FEF6DF] dark:bg-night-surface text-[#966E12] dark:text-gold text-xs font-bold border border-[#F5E2B0] dark:border-gold/30 flex items-center gap-1.5 shadow-2xs">
                                <i className="ph-fill ph-coins text-gold"></i> +10 Khoai khi đọc xong
                            </span>
                        </div>
                    </div>

                    {/* Book Title (Refined Literary Serif Typography) */}
                    <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-serif font-black text-ink dark:text-night-text tracking-tight leading-[1.2] mb-4">
                        {book?.bookName || (isLoading ? "Đang tải dữ liệu sách..." : "Chi tiết sách")}
                    </h1>

                    {/* Ratings & Stats Bar */}
                    <div className="flex flex-wrap items-center gap-2.5 sm:gap-4 pb-5 border-b border-paper-border dark:border-night-border mb-6">
                        <div className="flex items-center gap-1 text-amber-400 text-sm">
                            <i className="ph-fill ph-star"></i>
                            <i className="ph-fill ph-star"></i>
                            <i className="ph-fill ph-star"></i>
                            <i className="ph-fill ph-star"></i>
                            <i className="ph-fill ph-star"></i>
                        </div>
                        <span className="font-outfit font-black text-sm sm:text-base text-ink dark:text-night-text">{calculatedAvgRating}</span>
                        <span className="text-gray-300 dark:text-gray-600">•</span>
                        <a href="#danh-gia" id="topReviewCount" className="text-xs text-ink-muted dark:text-night-muted hover:text-wine dark:hover:text-gold underline underline-offset-4 font-medium">
                            {reviewStatusText}
                        </a>
                        <span className="text-gray-300 dark:text-gray-600">•</span>
                        <span className="text-xs text-ink-muted dark:text-night-muted font-medium flex items-center gap-1.5">
                            <i className="ph-bold ph-book-open text-wine dark:text-gold"></i> {book?.readCount ? `${book.readCount.toLocaleString()} lượt đọc` : '0 lượt đọc'}
                        </span>
                    </div>

                    {/* ================= BOOK ACTION SECTION ================= */}
                    <div id="tuy-chon-thue" className="bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border rounded-3xl p-6 mb-6 shadow-sm">
                        
                        {/* Status notification when book is owned/rented */}
                        {rentStatus.hasAccess && (
                            <div className="mb-5 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs font-outfit">
                                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold">
                                    <i className="ph-fill ph-check-circle text-lg"></i>
                                    <span>Tác phẩm đã mở khóa toàn bộ trong Tủ Sách Cá Nhân</span>
                                </div>
                                <span className="font-black px-3 py-1 rounded-full bg-emerald-600 text-white text-[11px] shadow-xs">
                                    {rentStatus.isForever ? 'Sở Hữu Trọn Đời' : `Còn lại ${rentStatus.remainingDays} ngày`}
                                </span>
                            </div>
                        )}

                        {/* Top Pricing & Ebook Badge */}
                        <div className="flex items-center justify-between flex-wrap gap-3 mb-5 pb-4 border-b border-paper-border/60 dark:border-night-border/60">
                            <div>
                                <span className="text-[11px] font-bold text-ink-muted dark:text-night-muted uppercase tracking-wider block mb-0.5">Quyền Đọc Ebook Bản Quyền</span>
                                <div className="flex items-center gap-2">
                                    <span className="font-outfit font-black text-2xl sm:text-3xl text-wine dark:text-gold flex items-center gap-1.5 leading-none">
                                        {book?.rent_price ? (Number(book.rent_price).toLocaleString('vi-VN') + ' đ') : '2'} {!book?.rent_price && <img src="img/icon-removebg-preview.png" alt="Khoai" className="w-7 h-7 sm:w-8 sm:h-8 object-contain inline-block -mt-1 hover:rotate-6 transition-transform" title="Khoai" />}
                                    </span>
                                    <span className="text-xs text-ink-muted dark:text-night-muted font-medium">/ ngày thuê</span>
                                </div>
                            </div>

                            <div className="text-right">
                                <span className="text-[11px] font-medium text-ink-muted dark:text-night-muted block mb-0.5">Sở hữu trọn đời:</span>
                                <span className="font-outfit font-black text-base text-amber-600 dark:text-gold flex items-center justify-end gap-1">
                                    <i className="ph-fill ph-seal-check text-xs"></i> 39 <img src="img/icon-removebg-preview.png" alt="Khoai" className="w-4 h-4 object-contain inline-block -mt-0.5" title="Khoai" />
                                </span>
                            </div>
                        </div>

                        {/* Primary Action Buttons: Đọc Sách / Đọc Thử & Thuê / Gia Hạn */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-4">
                            {rentStatus.hasAccess ? (
                                <>
                                    {/* Nút đọc toàn bộ sách đã mở khóa */}
                                    <button 
                                        id="btn-read-now" 
                                        type="button" 
                                        onClick={handleReadBook} 
                                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-outfit font-extrabold py-3.5 px-4 rounded-2xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-sm group cursor-pointer" 
                                        title="Đọc toàn bộ cuốn sách"
                                    >
                                        <i className="ph-bold ph-book-open text-base text-emerald-200 group-hover:scale-110 transition-transform"></i>
                                        <span>ĐỌC SÁCH NGAY (BẢN FULL)</span>
                                    </button>

                                    {/* Trạng thái sở hữu hoặc nút gia hạn */}
                                    {rentStatus.isForever ? (
                                        <div className="w-full bg-amber-500/10 dark:bg-gold/15 border-2 border-amber-500/40 dark:border-gold/40 text-amber-700 dark:text-gold font-outfit font-extrabold py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 text-sm">
                                            <i className="ph-fill ph-seal-check text-base"></i>
                                            <span>Đã Sở Hữu Trọn Đời</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2.5">
                                            <button 
                                                id="btn-rent-book" 
                                                type="button" 
                                                onClick={() => openRentalModal()} 
                                                className="flex-1 bg-wine hover:bg-wine-dark text-white font-outfit font-extrabold py-3.5 px-4 rounded-2xl transition-colors flex items-center justify-center gap-2 text-sm cursor-pointer group shadow-sm" 
                                                title="Gia hạn thời hạn thuê cuốn sách"
                                            >
                                                <i className="ph-bold ph-calendar-plus text-base text-amber-300 group-hover:scale-110 transition-transform"></i>
                                                <span>Gia Hạn Thuê Thêm</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleToggleFavorite}
                                                disabled={isFavoriteLoading}
                                                className={`h-[50px] w-[50px] rounded-2xl border flex items-center justify-center text-xl transition-all cursor-pointer shrink-0 shadow-xs ${
                                                    isFavorite
                                                        ? 'bg-rose-500/15 border-rose-500/40 text-rose-500 shadow-sm'
                                                        : 'bg-paper-surface hover:bg-paper-100 dark:bg-night-surface dark:hover:bg-night-card border-paper-border dark:border-night-border text-stone-400 hover:text-rose-500'
                                                }`}
                                                title={isFavorite ? "Bỏ khỏi danh sách Yêu Thích" : "Lưu vào danh sách Yêu Thích"}
                                                aria-label="Yêu thích tác phẩm"
                                            >
                                                <i className={`ph-fill ph-heart ${isFavorite ? 'text-rose-500 animate-pulse' : 'text-stone-400 group-hover:text-rose-500'}`}></i>
                                            </button>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <>
                                    {/* 1. Đọc Thử Miễn Phí (Nút phụ) */}
                                    <button id="btn-read-now" type="button" onClick={handleReadBook} className="w-full bg-paper-surface hover:bg-paper-100 dark:bg-night-surface dark:hover:bg-night-border text-ink dark:text-night-text border-2 border-paper-border dark:border-night-border hover:border-wine/70 dark:hover:border-gold/70 font-outfit font-extrabold py-3.5 px-4 rounded-2xl transition-all shadow-xs hover:shadow-md flex items-center justify-center gap-2 text-sm group cursor-pointer" title="Đọc thử cuốn sách">
                                        <i className="ph-bold ph-book-open text-base text-wine dark:text-gold group-hover:scale-110 transition-transform"></i>
                                        <span className="group-hover:text-wine dark:group-hover:text-gold transition-colors">Đọc Thử {book?.pdf_url ? '(PDF)' : ''}</span>
                                    </button>

                                    {/* 2. Thêm Vào Giỏ Hàng & Yêu Thích */}
                                    <div className="flex items-center gap-2.5">
                                        <button
                                            id="btn-rent-book"
                                            type="button"
                                            onClick={() => { openRentalModal() }}
                                            className="flex-1 bg-wine hover:bg-wine-dark text-white font-outfit font-extrabold py-3.5 px-4 rounded-2xl transition-colors flex items-center justify-center gap-2 text-sm cursor-pointer group shadow-sm"
                                            title="Chọn gói thuê hoặc mua sách"
                                        >
                                            <i className="ph-bold ph-shopping-cart-simple text-base text-amber-300 group-hover:scale-110 transition-transform"></i>
                                            <span>Thêm Vào Giỏ Hàng</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleToggleFavorite}
                                            disabled={isFavoriteLoading}
                                            className={`h-[50px] w-[50px] rounded-2xl border flex items-center justify-center text-xl transition-all cursor-pointer shrink-0 shadow-xs ${
                                                isFavorite
                                                    ? 'bg-rose-500/15 border-rose-500/40 text-rose-500 shadow-sm'
                                                    : 'bg-paper-surface hover:bg-paper-100 dark:bg-night-surface dark:hover:bg-night-card border-paper-border dark:border-night-border text-stone-400 hover:text-rose-500'
                                            }`}
                                            title={isFavorite ? "Bỏ khỏi danh sách Yêu Thích" : "Lưu vào danh sách Yêu Thích"}
                                            aria-label="Yêu thích tác phẩm"
                                        >
                                            <i className={`ph-fill ph-heart ${isFavorite ? 'text-rose-500 animate-pulse' : 'text-stone-400 group-hover:text-rose-500'}`}></i>
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Micro Feature Assurance List */}
                        <div className="pt-3.5 border-t border-paper-border/60 dark:border-night-border/60 flex flex-wrap items-center justify-between text-[11px] text-ink-muted dark:text-night-muted gap-2">
                            <span className="flex items-center gap-1.5">
                                <i className="ph-bold ph-lightning text-amber-500"></i> Mở khóa đọc tức thì
                            </span>
                            <span className="flex items-center gap-1.5">
                                <i className="ph-bold ph-devices text-wine dark:text-gold"></i> Đọc trên Điện thoại, Tablet, PC
                            </span>
                            <span className="flex items-center gap-1.5">
                                <i className="ph-bold ph-bookmark-simple text-emerald-500"></i> Tự động lưu trang đang đọc
                            </span>
                        </div>

                    </div>

                    {/* ================= THÔNG TIN TÁC PHẨM ================= */}
                    <div className="bg-gradient-to-br from-paper-surface to-paper-50/70 dark:from-night-card dark:to-night-surface/60 border border-paper-border dark:border-night-border rounded-3xl p-5 sm:p-6 shadow-sm">
                        
                        {/* Header with subtle badge */}
                        <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-paper-border/60 dark:border-night-border/60">
                            <h3 className="font-outfit font-black text-xs uppercase tracking-wider text-ink dark:text-night-text">
                                Thông Tin Tác Phẩm
                            </h3>
                            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                <i className="ph-fill ph-check-circle text-xs"></i> Ebook Bản Quyền
                            </span>
                        </div>

                        {/* 3 Streamlined Specs Columns: Tác Giả, Nhà Xuất Bản, Phát Hành (Có icon) */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            
                            {/* 1. Tác giả */}
                            <div className="p-3.5 rounded-2xl bg-paper-50 dark:bg-night-surface border border-paper-border/60 dark:border-night-border/60 flex items-center gap-3 group hover:border-wine/30 dark:hover:border-gold/30 transition-all">
                                <div className="w-9 h-9 rounded-xl bg-wine/10 dark:bg-gold/15 text-wine dark:text-gold flex items-center justify-center text-lg shrink-0 group-hover:scale-105 transition-transform">
                                    <i className="ph-bold ph-user-circle"></i>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted dark:text-night-muted block leading-none mb-1">Tác Giả</span>
                                    <span className="font-outfit font-black text-xs sm:text-sm text-wine dark:text-gold block leading-tight truncate" title={book?.author || "Tác giả"}>
                                        {book?.author || "Đang cập nhật"}
                                    </span>
                                </div>
                            </div>

                            {/* 2. Nhà xuất bản */}
                            <div className="p-3.5 rounded-2xl bg-paper-50 dark:bg-night-surface border border-paper-border/60 dark:border-night-border/60 flex items-center gap-3 group hover:border-wine/30 dark:hover:border-gold/30 transition-all">
                                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-lg shrink-0 group-hover:scale-105 transition-transform">
                                    <i className="ph-bold ph-buildings"></i>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted dark:text-night-muted block leading-none mb-1">Nhà Xuất Bản</span>
                                    <span className="font-outfit font-black text-xs sm:text-sm text-ink dark:text-night-text block leading-tight truncate">
                                        {book?.publisher || "Đang cập nhật"}
                                    </span>
                                </div>
                            </div>

                            {/* 3. Phát hành */}
                            <div className="p-3.5 rounded-2xl bg-paper-50 dark:bg-night-surface border border-paper-border/60 dark:border-night-border/60 flex items-center gap-3 group hover:border-amber-500/40 dark:hover:border-gold/40 transition-all">
                                <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center text-lg shrink-0 group-hover:scale-105 transition-transform">
                                    <i className="ph-bold ph-calendar-blank"></i>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted dark:text-night-muted block leading-none mb-1">Phát Hành</span>
                                    <span className="font-outfit font-black text-xs sm:text-sm text-ink dark:text-night-text block leading-tight truncate">
                                        {book?.yearOfPublished || "2024"}
                                    </span>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>


            {/* ========================================================
                 INTERACTIVE TABS: TÓM TẮT, TRÍCH ĐOẠN, TÁC GIẢ, MỤC LỤC
                 ======================================================== */}
            <section className="mb-16 mt-10 sm:mt-12 lg:mt-14">
                {/* Tab Headers */}
                <div className="flex items-center gap-2 sm:gap-6 border-b border-paper-border dark:border-night-border overflow-x-auto pb-px mb-8 font-outfit text-sm font-bold">
                    <button onClick={(event) => { switchTab('tab-summary') }} id="btn-tab-summary" className="tab-btn pb-3 px-1 text-wine dark:text-gold border-b-2 border-wine dark:border-gold whitespace-nowrap transition-colors">
                        Tóm Tắt Nội Dung
                    </button>
                    <button onClick={(event) => { switchTab('tab-excerpts') }} id="btn-tab-excerpts" className="tab-btn pb-3 px-1 text-ink-muted dark:text-night-muted hover:text-ink dark:hover:text-night-text border-b-2 border-transparent whitespace-nowrap transition-colors">
                        Trích Đoạn Cảm Xúc
                    </button>
                    <button onClick={(event) => { switchTab('tab-author') }} id="btn-tab-author" className="tab-btn pb-3 px-1 text-ink-muted dark:text-night-muted hover:text-ink dark:hover:text-night-text border-b-2 border-transparent whitespace-nowrap transition-colors">
                        Giới Thiệu Tác Giả
                    </button>
                    <button onClick={(event) => { switchTab('tab-toc') }} id="btn-tab-toc" className="tab-btn pb-3 px-1 text-ink-muted dark:text-night-muted hover:text-ink dark:hover:text-night-text border-b-2 border-transparent whitespace-nowrap transition-colors">
                        Mục Lục
                    </button>
                </div>

                {/* Tab 1: Summary */}
                <div id="tab-summary" className="tab-pane bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border rounded-3xl p-6 sm:p-8 shadow-sm">
                    <h3 className="text-xl font-serif font-bold text-ink dark:text-night-text mb-4">
                        Giới Thiệu Tác Phẩm
                    </h3>
                    <div className="text-sm sm:text-base leading-relaxed text-ink/80 dark:text-night-muted space-y-4 font-normal">
                        {book?.description ? (
                            <p className="whitespace-pre-line leading-relaxed">
                                {book.description}
                            </p>
                        ) : (
                            <p className="italic text-ink-muted">
                                Cuốn sách chưa có phần mô tả tóm tắt chi tiết từ nhà xuất bản.
                            </p>
                        )}
                    </div>
                </div>

                {/* Tab 2: Excerpts */}
                <div id="tab-excerpts" className="tab-pane hidden space-y-4">
                    <div className="bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border rounded-3xl p-6 sm:p-8 shadow-sm">
                        <span className="text-xs font-bold text-wine dark:text-gold uppercase tracking-wider mb-2 block">Lời tựa & Thông điệp</span>
                        <blockquote className="font-serif italic text-base sm:text-lg text-ink dark:text-night-text leading-relaxed">
                            {book?.description ? (
                                `"${book.description.length > 240 ? book.description.slice(0, 240) + '...' : book.description}"`
                            ) : (
                                `"Mỗi cuốn sách là một hải đăng tri thức, soi sáng tâm hồn và mở ra những chân trời mới cho độc giả."`
                            )}
                        </blockquote>
                    </div>
                </div>

                {/* Tab 3: Author */}
                <div id="tab-author" className="tab-pane hidden bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border rounded-3xl p-6 sm:p-8 shadow-sm">
                    <div className="flex flex-col md:flex-row gap-6 items-start">
                        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-br from-wine to-[#681921] text-gold dark:text-gold-light flex flex-col items-center justify-center shrink-0 border-2 border-wine/20 dark:border-gold/30 shadow-md">
                            <i className="ph-duotone ph-feather text-3xl sm:text-4xl mb-1"></i>
                            <span className="font-serif font-bold text-xs tracking-wider uppercase">
                                {book?.author ? book.author.split(' ').map(n => n[0]).join('').slice(0, 3) : 'HALM'}
                            </span>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-xl sm:text-2xl font-serif font-bold text-ink dark:text-night-text mb-2">
                                {book?.author || 'Tác giả đang cập nhật'}
                            </h3>
                            <p className="text-xs sm:text-sm text-wine dark:text-gold font-semibold uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                <i className="ph-bold ph-pen-nib"></i>
                                <span>{book?.category_name || (typeof book?.category === 'object' ? book.category?.category_name : book?.category) || 'Tác phẩm văn học & tri thức'}</span>
                            </p>
                            <p className="text-sm text-ink/80 dark:text-night-muted leading-relaxed mb-4">
                                {book?.author ? (
                                    <>
                                        <strong>{book.author}</strong> là tác giả của tác phẩm <em>"{book.bookName}"</em>. Hiện tại ban biên tập HALM BOOK đang cập nhật hồ sơ chi tiết, tiểu sử và toàn bộ danh mục trước tác của tác giả để bạn đọc tiện tra cứu và tìm hiểu thêm.
                                    </>
                                ) : (
                                    "Thông tin chi tiết về tác giả đang được ban biên tập hoàn thiện và đồng bộ."
                                )}
                            </p>
                            <div className="flex flex-wrap gap-2 text-xs font-semibold">
                                <span className="px-3 py-1.5 rounded-full bg-paper-50 dark:bg-night-surface border border-paper-border dark:border-night-border text-ink dark:text-night-text flex items-center gap-1.5">
                                    <i className="ph-bold ph-book-bookmark text-wine dark:text-gold"></i> Tác phẩm: {book?.bookName || 'Sách'}
                                </span>
                                <span className="px-3 py-1.5 rounded-full bg-paper-50 dark:bg-night-surface border border-paper-border dark:border-night-border text-ink dark:text-night-text flex items-center gap-1.5">
                                    <i className="ph-bold ph-shield-check text-emerald-600 dark:text-emerald-400"></i> Bản quyền phát hành HALM BOOK
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tab 4: Table of Contents */}
                <div id="tab-toc" className="tab-pane hidden bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border rounded-3xl p-6 sm:p-8 shadow-sm">
                    <h3 className="text-lg font-outfit font-black text-ink dark:text-night-text mb-4">Mục Lục Tác Phẩm</h3>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-paper-50 dark:bg-night-surface border border-paper-border dark:border-night-border">
                            <span className="text-sm font-semibold text-ink dark:text-night-text flex items-center gap-2">
                                <i className="ph-bold ph-book-open text-wine dark:text-gold"></i> Chương 1: Miền của tuổi thơ
                            </span>
                            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full">Đọc miễn phí</span>
                        </div>
                        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-paper-50 dark:bg-night-surface border border-paper-border dark:border-night-border">
                            <span className="text-sm font-semibold text-ink dark:text-night-text flex items-center gap-2">
                                <i className="ph-bold ph-book-open text-wine dark:text-gold"></i> Chương 2: Tiếng chim mùa hè
                            </span>
                            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full">Đọc miễn phí</span>
                        </div>
                        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-paper-50 dark:bg-night-surface border border-paper-border dark:border-night-border">
                            <span className="text-sm font-semibold text-ink dark:text-night-text flex items-center gap-2">
                                <i className="ph-bold ph-book-open text-wine dark:text-gold"></i> Chương 3: Những ngã rẽ cuộc đời
                            </span>
                            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full">Đọc miễn phí</span>
                        </div>
                        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-paper-50/50 dark:bg-night-surface/50 border border-dashed border-paper-border dark:border-night-border opacity-70">
                            <span className="text-sm font-medium text-ink-muted dark:text-night-muted flex items-center gap-2">
                                <i className="ph-bold ph-lock-key"></i> Chương 4 đến Kết thúc (28 Chương)
                            </span>
                            <span className="text-xs text-ink-muted dark:text-night-muted">Yêu cầu mở khóa</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* ========================================================
                 RELATED BOOKS: CÙNG TÁC GIẢ
                 ======================================================== */}
            <section className="mb-16">
                {/* Section Header with Left/Right Scroll Controls */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-serif font-bold text-ink dark:text-night-text">
                            Sách Cùng Tác Giả {book?.author ? `(${book.author})` : ''}
                        </h2>
                        <p className="text-xs text-ink-muted dark:text-night-muted mt-0.5">
                            Vuốt hoặc bấm nút mũi tên để xem thêm tác phẩm
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button type="button" onClick={(event) => { scrollAuthorBooks(-1) }} className="w-8 h-8 rounded-full border border-paper-border dark:border-night-border bg-paper-surface dark:bg-night-card hover:bg-wine hover:text-white dark:hover:bg-gold dark:hover:text-night text-ink dark:text-night-text flex items-center justify-center transition-colors cursor-pointer shadow-xs" title="Lướt sang trái">
                            <i className="ph-bold ph-caret-left"></i>
                        </button>
                        <button type="button" onClick={(event) => { scrollAuthorBooks(1) }} className="w-8 h-8 rounded-full border border-paper-border dark:border-night-border bg-paper-surface dark:bg-night-card hover:bg-wine hover:text-white dark:hover:bg-gold dark:hover:text-night text-ink dark:text-night-text flex items-center justify-center transition-colors cursor-pointer shadow-xs" title="Lướt sang phải">
                            <i className="ph-bold ph-caret-right"></i>
                        </button>
                        <a href="/" className="ml-2 text-xs font-bold text-wine dark:text-gold hover:underline hidden sm:inline-flex items-center gap-1">
                            Tất cả <i className="ph-bold ph-arrow-right text-[10px]"></i>
                        </a>
                    </div>
                </div>

                {/* Horizontal Scrollable Rail (Khung bo ngoài bỏ đi, icon sách nhỏ gọn) */}
                <div id="authorBooksSlider" className="flex min-h-24 items-center gap-4 sm:gap-5 overflow-x-auto scroll-smooth pb-3 snap-x snap-mandatory" style={{scrollbarWidth: "none", MsOverflowStyle: "none"}}>
                    <div className="w-full rounded-2xl border border-dashed border-paper-border dark:border-night-border px-5 py-7 text-center text-xs text-ink-muted dark:text-night-muted">
                        Dữ liệu sách cùng tác giả đang được cập nhật.
                    </div>
                    {false && (<>
                    
                    {/* Card 1: Mắt Biếc */}
                    <div className="w-[125px] sm:w-[145px] shrink-0 snap-start flex flex-col group cursor-pointer" onClick={(event) => { showToast('Mở thông tin: Mắt Biếc', 'info') }}>
                        <div className="aspect-[2/3] rounded-xl overflow-hidden mb-2 bg-paper-100 dark:bg-night-surface relative shadow-sm group-hover:shadow-lg group-hover:-translate-y-1 transition-all duration-300">
                            <img src="https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=350&q=80" alt="Mắt Biếc" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-wine/90 backdrop-blur-xs text-white text-[9px] font-bold">Top 1</span>
                        </div>
                        <h4 className="font-outfit font-bold text-xs sm:text-sm text-ink dark:text-night-text line-clamp-1 group-hover:text-wine dark:group-hover:text-gold transition-colors">
                            Mắt Biếc
                        </h4>
                        <div className="flex items-center gap-1 text-amber-400 text-[11px] my-0.5">
                            <i className="ph-fill ph-star"></i>
                            <span className="text-ink dark:text-night-text font-bold text-xs ml-0.5">4.9</span>
                            <span className="text-[10px] text-ink-muted dark:text-night-muted">(3.2k)</span>
                        </div>
                        <span className="font-outfit font-black text-xs text-amber-600 dark:text-gold flex items-center gap-0.5">
                            Thuê: 12 Khoai <i className="ph-fill ph-coins text-[10px]"></i>
                        </span>
                    </div>

                    {/* Card 2: Tôi Thấy Hoa Vàng Trên Cỏ Xanh */}
                    <div className="w-[125px] sm:w-[145px] shrink-0 snap-start flex flex-col group cursor-pointer" onClick={(event) => { showToast('Mở thông tin: Tôi Thấy Hoa Vàng Trên Cỏ Xanh', 'info') }}>
                        <div className="aspect-[2/3] rounded-xl overflow-hidden mb-2 bg-paper-100 dark:bg-night-surface relative shadow-sm group-hover:shadow-lg group-hover:-translate-y-1 transition-all duration-300">
                            <img src="https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=350&q=80" alt="Tôi Thấy Hoa Vàng Trên Cỏ Xanh" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        </div>
                        <h4 className="font-outfit font-bold text-xs sm:text-sm text-ink dark:text-night-text line-clamp-1 group-hover:text-wine dark:group-hover:text-gold transition-colors">
                            Tôi Thấy Hoa Vàng...
                        </h4>
                        <div className="flex items-center gap-1 text-amber-400 text-[11px] my-0.5">
                            <i className="ph-fill ph-star"></i>
                            <span className="text-ink dark:text-night-text font-bold text-xs ml-0.5">4.8</span>
                            <span className="text-[10px] text-ink-muted dark:text-night-muted">(2.8k)</span>
                        </div>
                        <span className="font-outfit font-black text-xs text-amber-600 dark:text-gold flex items-center gap-0.5">
                            Thuê: 15 Khoai <i className="ph-fill ph-coins text-[10px]"></i>
                        </span>
                    </div>

                    {/* Card 3: Cô Gái Đến Từ Hôm Qua */}
                    <div className="w-[125px] sm:w-[145px] shrink-0 snap-start flex flex-col group cursor-pointer" onClick={(event) => { showToast('Mở thông tin: Cô Gái Đến Từ Hôm Qua', 'info') }}>
                        <div className="aspect-[2/3] rounded-xl overflow-hidden mb-2 bg-paper-100 dark:bg-night-surface relative shadow-sm group-hover:shadow-lg group-hover:-translate-y-1 transition-all duration-300">
                            <img src="https://images.unsplash.com/photo-1495640388908-05fa85288e61?auto=format&fit=crop&w=350&q=80" alt="Cô Gái Đến Từ Hôm Qua" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        </div>
                        <h4 className="font-outfit font-bold text-xs sm:text-sm text-ink dark:text-night-text line-clamp-1 group-hover:text-wine dark:group-hover:text-gold transition-colors">
                            Cô Gái Đến Từ...
                        </h4>
                        <div className="flex items-center gap-1 text-amber-400 text-[11px] my-0.5">
                            <i className="ph-fill ph-star"></i>
                            <span className="text-ink dark:text-night-text font-bold text-xs ml-0.5">4.7</span>
                            <span className="text-[10px] text-ink-muted dark:text-night-muted">(1.9k)</span>
                        </div>
                        <span className="font-outfit font-black text-xs text-amber-600 dark:text-gold flex items-center gap-0.5">
                            Thuê: 10 Khoai <i className="ph-fill ph-coins text-[10px]"></i>
                        </span>
                    </div>

                    {/* Card 4: Cho Tôi Xin Một Vé Đi Tuổi Thơ */}
                    <div className="w-[125px] sm:w-[145px] shrink-0 snap-start flex flex-col group cursor-pointer" onClick={(event) => { showToast('Mở thông tin: Cho Tôi Xin Một Vé Đi Tuổi Thơ', 'info') }}>
                        <div className="aspect-[2/3] rounded-xl overflow-hidden mb-2 bg-paper-100 dark:bg-night-surface relative shadow-sm group-hover:shadow-lg group-hover:-translate-y-1 transition-all duration-300">
                            <img src="https://images.unsplash.com/photo-1532012164546-f432f2e3dd47?auto=format&fit=crop&w=350&q=80" alt="Cho Tôi Xin Một Vé Đi Tuổi Thơ" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        </div>
                        <h4 className="font-outfit font-bold text-xs sm:text-sm text-ink dark:text-night-text line-clamp-1 group-hover:text-wine dark:group-hover:text-gold transition-colors">
                            Cho Tôi Xin Một Vé...
                        </h4>
                        <div className="flex items-center gap-1 text-amber-400 text-[11px] my-0.5">
                            <i className="ph-fill ph-star"></i>
                            <span className="text-ink dark:text-night-text font-bold text-xs ml-0.5">4.9</span>
                            <span className="text-[10px] text-ink-muted dark:text-night-muted">(4.1k)</span>
                        </div>
                        <span className="font-outfit font-black text-xs text-amber-600 dark:text-gold flex items-center gap-0.5">
                            Thuê: 12 Khoai <i className="ph-fill ph-coins text-[10px]"></i>
                        </span>
                    </div>

                    {/* Card 5: Bồ Câu Không Đưa Thư */}
                    <div className="w-[125px] sm:w-[145px] shrink-0 snap-start flex flex-col group cursor-pointer" onClick={(event) => { showToast('Mở thông tin: Bồ Câu Không Đưa Thư', 'info') }}>
                        <div className="aspect-[2/3] rounded-xl overflow-hidden mb-2 bg-paper-100 dark:bg-night-surface relative shadow-sm group-hover:shadow-lg group-hover:-translate-y-1 transition-all duration-300">
                            <img src="https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=350&q=80" alt="Bồ Câu Không Đưa Thư" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        </div>
                        <h4 className="font-outfit font-bold text-xs sm:text-sm text-ink dark:text-night-text line-clamp-1 group-hover:text-wine dark:group-hover:text-gold transition-colors">
                            Bồ Câu Không Đưa Thư
                        </h4>
                        <div className="flex items-center gap-1 text-amber-400 text-[11px] my-0.5">
                            <i className="ph-fill ph-star"></i>
                            <span className="text-ink dark:text-night-text font-bold text-xs ml-0.5">4.6</span>
                            <span className="text-[10px] text-ink-muted dark:text-night-muted">(1.4k)</span>
                        </div>
                        <span className="font-outfit font-black text-xs text-amber-600 dark:text-gold flex items-center gap-0.5">
                            Thuê: 9 Khoai <i className="ph-fill ph-coins text-[10px]"></i>
                        </span>
                    </div>

                    {/* Card 6: Ngồi Khóc Trên Cây */}
                    <div className="w-[125px] sm:w-[145px] shrink-0 snap-start flex flex-col group cursor-pointer" onClick={(event) => { showToast('Mở thông tin: Ngồi Khóc Trên Cây', 'info') }}>
                        <div className="aspect-[2/3] rounded-xl overflow-hidden mb-2 bg-paper-100 dark:bg-night-surface relative shadow-sm group-hover:shadow-lg group-hover:-translate-y-1 transition-all duration-300">
                            <img src="https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=350&q=80" alt="Ngồi Khóc Trên Cây" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        </div>
                        <h4 className="font-outfit font-bold text-xs sm:text-sm text-ink dark:text-night-text line-clamp-1 group-hover:text-wine dark:group-hover:text-gold transition-colors">
                            Ngồi Khóc Trên Cây
                        </h4>
                        <div className="flex items-center gap-1 text-amber-400 text-[11px] my-0.5">
                            <i className="ph-fill ph-star"></i>
                            <span className="text-ink dark:text-night-text font-bold text-xs ml-0.5">4.8</span>
                            <span className="text-[10px] text-ink-muted dark:text-night-muted">(2.1k)</span>
                        </div>
                        <span className="font-outfit font-black text-xs text-amber-600 dark:text-gold flex items-center gap-0.5">
                            Thuê: 12 Khoai <i className="ph-fill ph-coins text-[10px]"></i>
                        </span>
                    </div>

                    {/* Card 7: Có Hai Con Mèo Ngồi Bên Cửa Sổ */}
                    <div className="w-[125px] sm:w-[145px] shrink-0 snap-start flex flex-col group cursor-pointer" onClick={(event) => { showToast('Mở thông tin: Có Hai Con Mèo Ngồi Bên Cửa Sổ', 'info') }}>
                        <div className="aspect-[2/3] rounded-xl overflow-hidden mb-2 bg-paper-100 dark:bg-night-surface relative shadow-sm group-hover:shadow-lg group-hover:-translate-y-1 transition-all duration-300">
                            <img src="https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=350&q=80" alt="Có Hai Con Mèo Ngồi Bên Cửa Sổ" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        </div>
                        <h4 className="font-outfit font-bold text-xs sm:text-sm text-ink dark:text-night-text line-clamp-1 group-hover:text-wine dark:group-hover:text-gold transition-colors">
                            Có Hai Con Mèo...
                        </h4>
                        <div className="flex items-center gap-1 text-amber-400 text-[11px] my-0.5">
                            <i className="ph-fill ph-star"></i>
                            <span className="text-ink dark:text-night-text font-bold text-xs ml-0.5">4.7</span>
                            <span className="text-[10px] text-ink-muted dark:text-night-muted">(1.7k)</span>
                        </div>
                        <span className="font-outfit font-black text-xs text-amber-600 dark:text-gold flex items-center gap-0.5">
                            Thuê: 10 Khoai <i className="ph-fill ph-coins text-[10px]"></i>
                        </span>
                    </div>

                    </>)}
                </div>
            </section>

            {/* ========================================================
                 REVIEWS & RATINGS SECTION (CẢM NHẬN BẠN ĐỌC)
                 ======================================================== */}
            <section id="danh-gia" className="bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border rounded-3xl p-6 sm:p-10 shadow-sm mb-16">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-ink dark:text-night-text">
                            Cảm Nhận Bạn Đọc
                        </h2>
                        <p className="text-xs sm:text-sm text-ink-muted dark:text-night-muted mt-1">
                            Chia sẻ suy nghĩ và đánh giá của bạn về cuốn sách này
                        </p>
                    </div>

                    {/* Rating Score Highlight */}
                    <div className="flex items-center gap-3 bg-paper-50 dark:bg-night-surface px-4 py-2.5 rounded-2xl border border-paper-border dark:border-night-border self-start sm:self-auto">
                        <span id="avgRatingScore" className="text-3xl font-outfit font-black text-wine dark:text-gold">{calculatedAvgRating}</span>
                        <div className="flex flex-col">
                            <div className="flex text-amber-400 text-xs">
                                {[1, 2, 3, 4, 5].map(s => (
                                    <i key={s} className={Math.round(Number(calculatedAvgRating)) >= s ? "ph-fill ph-star" : "ph-bold ph-star text-gray-300 dark:text-gray-600"}></i>
                                ))}
                            </div>
                            <span id="totalReviewsCountText" className="text-[11px] font-bold text-ink-muted dark:text-night-muted">
                                {totalReviewCount === 0 ? "Chưa có đánh giá" : `${totalReviewCount} đánh giá`}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Input Review Box */}
                <div className="bg-paper-50 dark:bg-night-surface p-5 sm:p-6 rounded-2xl border border-paper-border dark:border-night-border mb-8 shadow-inner">
                    <div className="flex gap-4 items-start">
                        <div className="w-11 h-11 rounded-full bg-wine text-white font-serif font-bold text-base flex items-center justify-center shrink-0 shadow-sm">
                            H
                        </div>
                        <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                                <span className="text-xs font-semibold text-ink-muted dark:text-night-muted uppercase tracking-wider">Đánh giá của bạn:</span>
                                <div id="ratingStars" className="flex text-amber-400 text-lg gap-1.5 cursor-pointer">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <i
                                            key={star}
                                            onMouseEnter={() => setHoverStar(star)}
                                            onMouseLeave={() => setHoverStar(0)}
                                            onClick={() => setSelectedStar(star)}
                                            className={`transition-colors cursor-pointer ${
                                                (hoverStar || selectedStar) >= star
                                                    ? "ph-fill ph-star text-amber-400"
                                                    : "ph-bold ph-star text-gray-300 dark:text-gray-600 hover:text-amber-400"
                                            }`}
                                            title={`${star} sao`}
                                        ></i>
                                    ))}
                                </div>
                                <span id="ratingFeedback" className="text-xs text-wine dark:text-gold font-bold ml-2">
                                    {hoverStar || selectedStar}/5 sao — {STAR_FEEDBACK_TEXTS[(hoverStar || selectedStar) - 1] || "Tuyệt tác!"}
                                </span>
                            </div>

                            <textarea
                                id="commentInput"
                                rows="3"
                                value={commentInput}
                                disabled={isSubmittingReview}
                                onChange={(e) => setCommentInput(e.target.value)}
                                placeholder="Bạn cảm nhận thế nào về câu chuyện này? Hãy chia sẻ nhé..."
                                className="w-full bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border p-3.5 rounded-xl text-sm text-ink dark:text-night-text placeholder-ink-muted focus:outline-none focus:border-wine dark:focus:border-gold transition resize-none disabled:opacity-60"
                            ></textarea>
                            
                            <div className="flex items-center justify-end gap-3 mt-3">
                                <button
                                    type="button"
                                    disabled={isSubmittingReview}
                                    onClick={() => { setCommentInput(''); setSelectedStar(5); setHoverStar(0); }}
                                    className="px-4 py-2 text-xs font-semibold text-ink-muted dark:text-night-muted hover:bg-paper-200 dark:hover:bg-night-card rounded-xl transition cursor-pointer disabled:opacity-50"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="button"
                                    id="btnPostComment"
                                    disabled={isSubmittingReview || !commentInput.trim()}
                                    onClick={handlePostReview}
                                    className="bg-wine hover:bg-wine-dark disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2"
                                >
                                    {isSubmittingReview ? (
                                        <>
                                            <i className="ph-bold ph-spinner animate-spin text-sm"></i>
                                            <span>Đang gửi cảm nhận...</span>
                                        </>
                                    ) : (
                                        <>
                                            <i className="ph-bold ph-paper-plane-tilt"></i>
                                            <span>Đăng Bình Luận</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Review Feed List */}
                <div id="reviewList" className="space-y-4">
                    {isLoadingReviews ? (
                        <div className="py-10 text-center text-ink-muted dark:text-night-muted">
                            <i className="ph-bold ph-spinner animate-spin text-2xl mb-2 text-wine dark:text-gold block mx-auto"></i>
                            <span className="text-xs font-semibold">Đang tải cảm nhận bạn đọc...</span>
                        </div>
                    ) : reviews.length === 0 ? (
                        <div id="emptyReviewNotice" className="text-center py-12 px-4 bg-paper-50/70 dark:bg-night-surface/60 rounded-2xl border border-dashed border-paper-border dark:border-night-border text-ink-muted dark:text-night-muted">
                            <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-paper-100 dark:bg-night-surface flex items-center justify-center text-wine dark:text-gold shadow-sm">
                                <i className="ph-duotone ph-chat-centered-text text-2xl"></i>
                            </div>
                            <h4 className="text-sm font-bold text-ink dark:text-night-text mb-1">Chưa có cảm nhận nào từ bạn đọc</h4>
                            <p className="text-xs text-ink-muted dark:text-night-muted max-w-sm mx-auto leading-relaxed">
                                Hãy là người đầu tiên chia sẻ suy nghĩ và cảm nhận của bạn về cuốn sách này!
                            </p>
                        </div>
                    ) : (
                        reviews.map((rev) => (
                            <div key={rev.evaluateId} className="review-item p-5 rounded-2xl bg-paper-50 dark:bg-night-surface border border-paper-border dark:border-night-border animate-fade-in">
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        {rev.avatarUrl ? (
                                            <img src={rev.avatarUrl} alt={rev.customerName} className="w-10 h-10 rounded-full object-cover shrink-0 border border-paper-border" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-wine/10 dark:bg-wine/30 text-wine dark:text-gold font-bold font-serif flex items-center justify-center shrink-0">
                                                {rev.customerName ? rev.customerName.charAt(0).toUpperCase() : 'Đ'}
                                            </div>
                                        )}
                                        <div>
                                            <h4 className="font-bold text-sm text-ink dark:text-night-text flex items-center gap-1.5">
                                                {rev.customerName || "Độc giả HALM"}
                                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full font-sans flex items-center gap-1">
                                                    <i className="ph-bold ph-book-open"></i> Độc giả HALM
                                                </span>
                                            </h4>
                                            <span className="text-[11px] text-ink-muted dark:text-night-muted">{rev.createdAt || "Vừa xong"}</span>
                                        </div>
                                    </div>
                                    <div className="flex text-amber-400 text-xs">
                                        {[1, 2, 3, 4, 5].map((s) => (
                                            <i key={s} className={rev.star >= s ? "ph-fill ph-star" : "ph-bold ph-star text-gray-300 dark:text-gray-600"}></i>
                                        ))}
                                    </div>
                                </div>
                                <p className="text-sm text-ink/80 dark:text-night-muted leading-relaxed pl-0 sm:pl-13 mb-3 whitespace-pre-wrap">
                                    "{rev.content}"
                                </p>
                                <div className="flex items-center gap-4 text-xs text-ink-muted dark:text-night-muted pl-0 sm:pl-13">
                                    <button
                                        type="button"
                                        onClick={() => handleLikeReview(rev.evaluateId)}
                                        className="flex items-center gap-1 hover:text-wine dark:hover:text-gold transition font-bold cursor-pointer"
                                    >
                                        <i className="ph-bold ph-thumbs-up"></i> <span>{rev.likesCount || 0}</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setActiveReplyId(activeReplyId === rev.evaluateId ? null : rev.evaluateId);
                                            setReplyInputText("");
                                        }}
                                        className="flex items-center gap-1 hover:text-wine dark:hover:text-gold transition font-bold cursor-pointer"
                                    >
                                        <i className="ph-bold ph-chat-teardrop-dots"></i> Phản hồi
                                    </button>
                                </div>

                                {/* Form phản hồi mở rộng */}
                                {activeReplyId === rev.evaluateId && (
                                    <div className="mt-3 pl-0 sm:pl-13 pt-3 border-t border-paper-border/60 dark:border-night-border/60 animate-fade-in">
                                        <div className="flex items-start gap-2.5 sm:gap-3 bg-paper-100/70 dark:bg-night-surface/90 p-3 sm:p-3.5 rounded-2xl border border-paper-border/70 dark:border-night-border/70">
                                            <div className="w-8 h-8 rounded-full bg-wine text-white font-bold flex items-center justify-center shrink-0 text-xs shadow-2xs">
                                                B
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <textarea
                                                    rows="2"
                                                    value={replyInputText}
                                                    disabled={isSubmittingReply}
                                                    onChange={(e) => setReplyInputText(e.target.value)}
                                                    placeholder={`Nhập phản hồi của bạn cho ${rev.customerName || "độc giả"}...`}
                                                    className="w-full bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border p-2.5 rounded-xl text-xs sm:text-sm text-ink dark:text-night-text placeholder-ink-muted focus:outline-none focus:border-wine dark:focus:border-gold transition resize-none disabled:opacity-60"
                                                ></textarea>
                                                <div className="flex items-center justify-end gap-2 mt-2">
                                                    <button
                                                        type="button"
                                                        disabled={isSubmittingReply}
                                                        onClick={() => { setActiveReplyId(null); setReplyInputText(""); }}
                                                        className="px-3 py-1.5 text-xs font-semibold text-ink-muted dark:text-night-muted hover:bg-paper-200 dark:hover:bg-night-card rounded-lg transition cursor-pointer"
                                                    >
                                                        Hủy
                                                    </button>
                                                    <button
                                                        type="button"
                                                        disabled={isSubmittingReply || !replyInputText.trim()}
                                                        onClick={() => handleSubmitReply(rev.evaluateId)}
                                                        className="bg-wine hover:bg-wine-dark disabled:opacity-50 text-white px-4 py-1.5 text-xs font-bold rounded-lg shadow-sm transition cursor-pointer flex items-center gap-1"
                                                    >
                                                        {isSubmittingReply ? (
                                                            <>
                                                                <i className="ph-bold ph-spinner animate-spin"></i>
                                                                <span>Đang gửi...</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <i className="ph-bold ph-paper-plane-tilt"></i>
                                                                <span>Gửi phản hồi</span>
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Danh sách phản hồi con (Replies) */}
                                {rev.replies && rev.replies.length > 0 && (
                                    <div className="space-y-2 mt-3 pl-0 sm:pl-13 border-t border-paper-border/40 dark:border-night-border/40 pt-2.5">
                                        {rev.replies.map((reply) => (
                                            <div key={reply.evaluateId} className="flex items-start gap-2.5 bg-paper-100/60 dark:bg-night-surface/60 p-3 rounded-xl border border-paper-border/50 dark:border-night-border/50 text-xs">
                                                <div className="w-7 h-7 rounded-full bg-wine text-white font-bold flex items-center justify-center shrink-0 text-[11px] shadow-2xs">
                                                    {reply.customerName ? reply.customerName.charAt(0).toUpperCase() : 'B'}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-0.5">
                                                        <span className="font-bold text-ink dark:text-night-text">{reply.customerName || "Độc giả"}</span>
                                                        <span className="text-[10px] text-ink-muted dark:text-night-muted">{reply.createdAt || "Vừa xong"}</span>
                                                    </div>
                                                    <p className="text-ink/90 dark:text-night-muted leading-relaxed text-xs">
                                                        {reply.content}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </section>

        </div>
    </main>

    {/* ========================================================
         FOOTER
         ======================================================== */}
    {false && (<footer className="bg-paper-surface dark:bg-night-surface border-t border-paper-border dark:border-night-border pt-12 pb-8 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
                
                {/* Col 1: Brand Info */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2.5">
                        <img src="img/icon-removebg-preview.png" alt="Mascot" className="w-8 h-8 object-contain" />
                        <span className="font-outfit font-black text-xl text-ink dark:text-night-text uppercase tracking-tight">HALM BOOK</span>
                    </div>
                    <p className="text-xs text-ink-muted dark:text-night-muted leading-relaxed">
                        Nền tảng đọc sách & kết nối tri thức hàng đầu. Nơi nuôi dưỡng tâm hồn qua từng trang viết bất hủ của nền văn học Việt Nam và thế giới.
                    </p>
                    <div className="flex items-center gap-3 text-ink-muted dark:text-night-muted text-base pt-2">
                        <a href="#" className="hover:text-wine dark:hover:text-gold transition"><i className="fa-brands fa-facebook"></i></a>
                        <a href="#" className="hover:text-wine dark:hover:text-gold transition"><i className="fa-brands fa-tiktok"></i></a>
                        <a href="#" className="hover:text-wine dark:hover:text-gold transition"><i className="fa-brands fa-youtube"></i></a>
                    </div>
                </div>

                {/* Col 2: Quick Links */}
                <div>
                    <h4 className="font-outfit font-bold text-xs uppercase tracking-wider text-ink dark:text-night-text mb-3">Khám Phá</h4>
                    <ul className="space-y-2 text-xs text-ink-muted dark:text-night-muted">
                        <li><a href="/" className="hover:text-wine dark:hover:text-gold transition">Trang Chủ</a></li>
                        <li><a href="offers_end.html" className="hover:text-wine dark:hover:text-gold transition">Ưu Đãi Đặc Quyền</a></li>
                        <li><a href="/chitietsach" className="hover:text-wine dark:hover:text-gold transition">Chi Tiết Sách</a></li>
                        <li><a href="#" className="hover:text-wine dark:hover:text-gold transition">Bestseller Tuần</a></li>
                    </ul>
                </div>

                {/* Col 3: Policy */}
                <div>
                    <h4 className="font-outfit font-bold text-xs uppercase tracking-wider text-ink dark:text-night-text mb-3">Chính Sách & Hỗ Trợ</h4>
                    <ul className="space-y-2 text-xs text-ink-muted dark:text-night-muted">
                        <li><a href="#" className="hover:text-wine dark:hover:text-gold transition">Chính sách hội viên VIP</a></li>
                        <li><a href="#" className="hover:text-wine dark:hover:text-gold transition">Quy định đổi Khoai thưởng</a></li>
                        <li><a href="#" className="hover:text-wine dark:hover:text-gold transition">Bảo mật thông tin</a></li>
                        <li><a href="#" className="hover:text-wine dark:hover:text-gold transition">Trung tâm trợ giúp 24/7</a></li>
                    </ul>
                </div>

                {/* Col 4: Newsletter */}
                <div>
                    <h4 className="font-outfit font-bold text-xs uppercase tracking-wider text-ink dark:text-night-text mb-3">Nhận Bản Tin Văn Học</h4>
                    <p className="text-xs text-ink-muted dark:text-night-muted mb-3">Đăng ký để nhận voucher 20% và thông báo sách mới sớm nhất.</p>
                    <div className="flex items-center gap-2">
                        <input type="email" placeholder="Email của bạn..." className="w-full px-3 py-2 rounded-xl text-xs bg-paper-50 dark:bg-night-card border border-paper-border dark:border-night-border focus:outline-none focus:border-wine dark:focus:border-gold" />
                        <button onClick={(event) => { showToast('Đăng ký bản tin thành công! Tặng bạn mã HALM20', 'success') }} className="px-3.5 py-2 rounded-xl bg-wine hover:bg-wine-dark text-white text-xs font-bold transition shrink-0">
                            Gửi
                        </button>
                    </div>
                </div>

            </div>

            <div className="border-t border-paper-border dark:border-night-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-ink-muted dark:text-night-muted">
                <span>© 2026 HALM BOOK. Bản quyền thuộc về Không Gian Đọc Sách & Tri Thức.</span>
                <div className="flex items-center gap-4">
                    <span>Hotline: 1900 6868</span>
                    <span>Email: support@halmbook.vn</span>
                </div>
            </div>
        </div>
    </footer>)}

    {/* ========================================================
         FLOATING AI CHATBOT MASCOT BUTTON (TÍCH HỢP TRỰC TIẾP API)
         ======================================================== */}
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end">
        
        {/* Chatbot Popup Window */}
        {isChatbotOpen && (
            <div id="chatbotPopup" className="w-80 sm:w-96 bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border rounded-3xl shadow-2xl overflow-hidden mb-3 transition-all duration-300 animate-fade-in flex flex-col">
                {/* Header */}
                <div className="bg-wine dark:bg-wine-dark p-4 text-white flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-2.5">
                        <img src="img/icon-removebg-preview.png" alt="HALM AI" className="w-8 h-8 object-contain" />
                        <div>
                            <h4 className="font-outfit font-black text-sm">Trợ Lý Sách HALM AI</h4>
                            <span className="text-[10px] text-emerald-300 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Sẵn sàng giải đáp
                            </span>
                        </div>
                    </div>
                    <button type="button" onClick={() => setIsChatbotOpen(false)} className="text-white/80 hover:text-white text-lg p-1 transition-colors cursor-pointer" title="Đóng chat">
                        <i className="ph-bold ph-x"></i>
                    </button>
                </div>

                {/* Chat messages body */}
                <div ref={chatBodyRef} id="chatMessages" className="p-4 h-64 overflow-y-auto space-y-3 text-xs bg-paper-50/50 dark:bg-night-surface/50">
                    {chatMessages.length === 0 ? (
                        <div className="text-center py-6 text-ink-muted dark:text-night-muted">
                            <i className="ph-bold ph-sparkle text-2xl text-wine dark:text-gold mb-1 block"></i>
                            <p>Xin chào! Mình có thể hỗ trợ gì về cuốn sách này?</p>
                        </div>
                    ) : (
                        chatMessages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start items-start gap-2'} animate-fade-in`}>
                                {msg.sender === 'bot' && (
                                    <img src="img/icon-removebg-preview.png" className="w-6 h-6 object-contain shrink-0 mt-0.5" alt="AI" />
                                )}
                                <div className={`p-3 rounded-2xl text-xs leading-relaxed max-w-[85%] whitespace-pre-wrap ${
                                    msg.sender === 'user'
                                        ? 'bg-wine text-white rounded-tr-xs shadow-xs'
                                        : 'bg-paper-100 dark:bg-night-surface text-ink dark:text-night-text rounded-tl-xs border border-paper-border/70 dark:border-night-border/70 shadow-xs'
                                }`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))
                    )}
                    {isChatbotLoading && (
                        <div className="flex items-center gap-2 text-ink-muted dark:text-night-muted text-xs animate-fade-in pl-8">
                            <span className="w-2 h-2 rounded-full bg-wine dark:text-gold animate-bounce"></span>
                            <span className="w-2 h-2 rounded-full bg-wine dark:text-gold animate-bounce [animation-delay:0.2s]"></span>
                            <span className="w-2 h-2 rounded-full bg-wine dark:text-gold animate-bounce [animation-delay:0.4s]"></span>
                            <span className="text-[11px] ml-1">HALM AI đang soạn phản hồi...</span>
                        </div>
                    )}
                </div>

                {/* Quick Suggestion Chips */}
                <div className="px-3 pb-2 pt-1 flex gap-1.5 overflow-x-auto text-[11px] font-bold bg-paper-surface dark:bg-night-card border-t border-paper-border/40 dark:border-night-border/40" style={{scrollbarWidth: 'none'}}>
                    <button
                        type="button"
                        onClick={() => handleSendChatMessage(`Tóm tắt ý nghĩa và bài học của cuốn sách ${book?.bookName || ''}`)}
                        className="px-2.5 py-1 rounded-full bg-paper-100 dark:bg-night-surface text-wine dark:text-gold shrink-0 border border-paper-border dark:border-night-border hover:bg-wine/10 dark:hover:bg-gold/15 transition-colors cursor-pointer"
                    >
                        💡 Ý nghĩa tác phẩm
                    </button>
                    <button
                        type="button"
                        onClick={() => handleSendChatMessage(`Giới thiệu về phong cách sáng tác của tác giả ${book?.author || ''}`)}
                        className="px-2.5 py-1 rounded-full bg-paper-100 dark:bg-night-surface text-wine dark:text-gold shrink-0 border border-paper-border dark:border-night-border hover:bg-wine/10 dark:hover:bg-gold/15 transition-colors cursor-pointer"
                    >
                        🌿 Về tác giả
                    </button>
                </div>

                {/* Input bar */}
                <div className="p-3 border-t border-paper-border dark:border-night-border flex items-center gap-2 bg-paper-surface dark:bg-night-card">
                    <input
                        type="text"
                        id="chatInput"
                        value={chatInputText}
                        disabled={isChatbotLoading}
                        onChange={(e) => setChatInputText(e.target.value)}
                        placeholder="Hỏi bất kỳ điều gì..."
                        className="flex-1 bg-paper-50 dark:bg-night-surface px-3 py-2 rounded-xl text-xs text-ink dark:text-night-text focus:outline-none focus:border-wine dark:focus:border-gold border border-paper-border dark:border-night-border disabled:opacity-60"
                        onKeyDown={(event) => { if (event.key === 'Enter') handleSendChatMessage(); }}
                    />
                    <button
                        type="button"
                        disabled={isChatbotLoading || !chatInputText.trim()}
                        onClick={() => handleSendChatMessage()}
                        className="p-2 rounded-xl bg-wine hover:bg-wine-dark disabled:opacity-50 text-white text-sm transition-colors cursor-pointer shadow-xs"
                    >
                        <i className="ph-bold ph-paper-plane-tilt"></i>
                    </button>
                </div>
            </div>
        )}

        {/* Floating Mascot Trigger Button */}
        <button
            id="chatbotTriggerBtn"
            type="button"
            onClick={() => setIsChatbotOpen(prev => !prev)}
            className="w-14 h-14 rounded-full bg-gradient-to-tr from-wine via-wine-light to-amber-600 text-white p-2 flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer group relative"
            title="Mở Trợ lý Sách HALM AI"
        >
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 border-2 border-white dark:border-night-card rounded-full"></span>
            <img src="img/icon-removebg-preview.png" alt="Chatbot" className="w-full h-full object-contain group-hover:rotate-12 transition-transform" />
        </button>
    </div>

    {/* ================= RENTAL SELECTION MODAL ================= */}
    <div id="rentalModalBackdrop" onClick={(event) => { closeRentalModal() }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] opacity-0 pointer-events-none transition-opacity duration-300"></div>
    <div id="rentalModal" className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[92%] sm:w-full max-w-lg bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border rounded-3xl z-[10000] opacity-0 pointer-events-none scale-95 transition-all duration-300 ease-out shadow-2xl p-6 sm:p-7 max-h-[90vh] overflow-y-auto">
        
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-paper-border dark:border-night-border mb-5">
            <div className="flex items-center gap-3">
                <img src={book?.img_url || book?.img || '/logo.png'} alt={book?.bookName || "Bìa sách"} className="w-12 h-16 object-cover rounded-xl shadow-md shrink-0 border border-paper-border/60 dark:border-night-border/60" />
                <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-wine dark:text-gold bg-wine/10 dark:bg-gold/15 px-2 py-0.5 rounded-md inline-block mb-1">Thuê Hoặc Mua Ebook</span>
                    <h3 className="font-outfit font-black text-base text-ink dark:text-night-text leading-tight">{book?.bookName || 'Chi tiết ấn phẩm'}</h3>
                    <p className="text-xs text-ink-muted dark:text-night-muted mt-0.5">{book?.author || 'Tác giả đang cập nhật'} • HALM BOOK</p>
                </div>
            </div>
            <button type="button" onClick={(event) => { closeRentalModal() }} className="w-8 h-8 rounded-full bg-paper-100 dark:bg-night-surface hover:bg-paper-200 dark:hover:bg-night-border text-ink-muted hover:text-ink dark:hover:text-night-text flex items-center justify-center transition-colors cursor-pointer shrink-0" title="Đóng">
                <i className="ph-bold ph-x text-base"></i>
            </button>
        </div>

        {/* Modal Body: Select Plan */}
        <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-bold uppercase tracking-wider text-ink-muted dark:text-night-muted font-outfit">
                    Chọn Gói Thuê Hoặc Mua Đứt:
                </label>
                <span className="text-[11px] text-wine dark:text-gold font-medium">1 chạm chọn gói</span>
            </div>

            <div className="space-y-3" id="rentalPlansContainer">
                
                {/* Plan 1: 1 Ngày */}
                <div onClick={(event) => { selectRentalModalPlan('1') }} id="planCard_1" className="rental-modal-card p-3.5 rounded-2xl border-2 border-paper-border/80 dark:border-night-border/80 hover:border-wine/50 dark:hover:border-gold/50 bg-paper-50 dark:bg-night-surface flex items-center justify-between cursor-pointer transition-all group">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center text-xl shrink-0 group-hover:scale-110 transition-transform">
                            <i className="ph-bold ph-lightning"></i>
                        </div>
                        <div>
                            <div className="font-outfit font-black text-sm text-ink dark:text-night-text flex items-center gap-1.5">
                                1 Ngày <span className="text-[11px] font-normal text-ink-muted dark:text-night-muted">(24 Giờ)</span>
                            </div>
                            <div className="text-[11px] text-ink-muted dark:text-night-muted">Phù hợp trải nghiệm đọc nhanh trong ngày</div>
                        </div>
                    </div>
                    <div className="text-right flex items-center gap-2.5">
                        <span className="font-outfit font-black text-base text-ink dark:text-night-text flex items-center gap-1">2 <img src="img/icon-removebg-preview.png" alt="Khoai" className="w-4 h-4 object-contain inline-block -mt-0.5" title="Khoai" /></span>
                        <div id="checkIcon_1" className="w-5 h-5 rounded-full border border-gray-300 dark:border-night-border flex items-center justify-center text-xs text-transparent transition-all">
                            <i className="ph-bold ph-check"></i>
                        </div>
                    </div>
                </div>

                {/* Plan 2: 3 Ngày */}
                <div onClick={(event) => { selectRentalModalPlan('3') }} id="planCard_3" className="rental-modal-card p-3.5 rounded-2xl border-2 border-paper-border/80 dark:border-night-border/80 hover:border-wine/50 dark:hover:border-gold/50 bg-paper-50 dark:bg-night-surface flex items-center justify-between cursor-pointer transition-all group">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center text-xl shrink-0 group-hover:scale-110 transition-transform">
                            <i className="ph-bold ph-calendar"></i>
                        </div>
                        <div>
                            <div className="font-outfit font-black text-sm text-ink dark:text-night-text flex items-center gap-1.5">
                                3 Ngày <span className="text-[11px] font-normal text-ink-muted dark:text-night-muted">(Cuối Tuần)</span>
                            </div>
                            <div className="text-[11px] text-ink-muted dark:text-night-muted">Thời gian thong thả thư giãn cuối tuần</div>
                        </div>
                    </div>
                    <div className="text-right flex items-center gap-2.5">
                        <span className="font-outfit font-black text-base text-ink dark:text-night-text flex items-center gap-1">5 <img src="img/icon-removebg-preview.png" alt="Khoai" className="w-4 h-4 object-contain inline-block -mt-0.5" title="Khoai" /></span>
                        <div id="checkIcon_3" className="w-5 h-5 rounded-full border border-gray-300 dark:border-night-border flex items-center justify-center text-xs text-transparent transition-all">
                            <i className="ph-bold ph-check"></i>
                        </div>
                    </div>
                </div>

                {/* Plan 3: 7 Ngày (Default Selected) */}
                <div onClick={(event) => { selectRentalModalPlan('7') }} id="planCard_7" className="rental-modal-card p-3.5 rounded-2xl border-2 border-wine dark:border-gold bg-wine/5 dark:bg-gold/10 flex items-center justify-between cursor-pointer transition-all group shadow-sm ring-1 ring-wine/20 dark:ring-gold/30">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-wine text-white dark:bg-gold dark:text-night flex items-center justify-center text-xl shrink-0 group-hover:scale-110 transition-transform shadow-xs">
                            <i className="ph-bold ph-star"></i>
                        </div>
                        <div>
                            <div className="font-outfit font-black text-sm text-wine dark:text-gold flex items-center gap-2">
                                7 Ngày (1 Tuần)
                                <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-wine text-white dark:bg-gold dark:text-night shadow-2xs">Khuyên Dùng</span>
                            </div>
                            <div className="text-[11px] text-ink-muted dark:text-night-muted">Đọc thoải mái, tiết kiệm nhất (~35%)</div>
                        </div>
                    </div>
                    <div className="text-right flex items-center gap-2.5">
                        <span className="font-outfit font-black text-base text-wine dark:text-gold flex items-center gap-1">9 <img src="img/icon-removebg-preview.png" alt="Khoai" className="w-4 h-4 object-contain inline-block -mt-0.5" title="Khoai" /></span>
                        <div id="checkIcon_7" className="w-5 h-5 rounded-full bg-wine text-white dark:bg-gold dark:text-night flex items-center justify-center text-xs shadow-2xs">
                            <i className="ph-bold ph-check"></i>
                        </div>
                    </div>
                </div>

                {/* Plan 4: Mua Đứt Vĩnh Viễn */}
                <div onClick={(event) => { selectRentalModalPlan('forever') }} id="planCard_forever" className="rental-modal-card p-3.5 rounded-2xl border-2 border-paper-border/80 dark:border-night-border/80 hover:border-amber-500/50 dark:hover:border-gold/50 bg-paper-50 dark:bg-night-surface flex items-center justify-between cursor-pointer transition-all group">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-gold flex items-center justify-center text-xl shrink-0 group-hover:scale-110 transition-transform shadow-xs">
                            <i className="ph-fill ph-seal-check"></i>
                        </div>
                        <div>
                            <div className="font-outfit font-black text-sm text-ink dark:text-night-text flex items-center gap-2">
                                Mua Đứt Vĩnh Viễn
                                <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-gold border border-amber-500/30">Sở Hữu Trọn Đời</span>
                            </div>
                            <div className="text-[11px] text-ink-muted dark:text-night-muted">Đọc không giới hạn thời gian, vĩnh viễn trong Tủ Sách</div>
                        </div>
                    </div>
                    <div className="text-right flex items-center gap-2.5">
                        <span className="font-outfit font-black text-base text-ink dark:text-night-text flex items-center gap-1">39 <img src="img/icon-removebg-preview.png" alt="Khoai" className="w-4 h-4 object-contain inline-block -mt-0.5" title="Khoai" /></span>
                        <div id="checkIcon_forever" className="w-5 h-5 rounded-full border border-gray-300 dark:border-night-border flex items-center justify-center text-xs text-transparent transition-all">
                            <i className="ph-bold ph-check"></i>
                        </div>
                    </div>
                </div>

            </div>
        </div>

        {/* Modal Footer: Potato balance & Add to cart button */}
        <div className="pt-4 border-t border-paper-border dark:border-night-border space-y-3.5">
            <div className="flex items-center justify-between text-xs">
                <span className="text-ink-muted dark:text-night-muted">Số dư Khoai của bạn:</span>
                <span className="font-outfit font-bold text-ink dark:text-night-text flex items-center gap-1">
                    <span id="rentalModalUserKhoai">{userKhoai.toLocaleString()}</span> <i className="ph-fill ph-coins text-gold"></i>
                </span>
            </div>

            <button type="button" id="btnConfirmAddToCart" onClick={(event) => { confirmRentalModalAddToCart() }} className="w-full bg-wine hover:bg-wine-dark text-white font-outfit font-black py-4 px-6 rounded-2xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2.5 text-sm cursor-pointer group">
                <i className="ph-bold ph-shopping-cart-simple text-lg group-hover:scale-110 transition-transform text-amber-300"></i>
                <span id="confirmAddToCartBtnText">Thêm Vào Giỏ Hàng (Thuê 7 Ngày - 9 Khoai)</span>
            </button>
        </div>

    </div>

    {/* ================= SLIDE-OVER CART DRAWER ================= */}
    <div id="cartDrawerBackdrop" onClick={(event) => { toggleCartDrawer(false) }} className="fixed inset-0 bg-black/50 backdrop-blur-xs z-[9999] opacity-0 pointer-events-none transition-opacity duration-300"></div>
    <div id="cartDrawer" className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-paper-surface dark:bg-night-card border-l border-paper-border dark:border-night-border z-[10000] translate-x-full transition-transform duration-300 ease-in-out flex flex-col shadow-2xl">
        {/* Drawer Header */}
        <div className="p-5 border-b border-paper-border dark:border-night-border flex items-center justify-between">
            <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-wine/10 dark:bg-gold/15 text-wine dark:text-gold flex items-center justify-center text-lg">
                    <i className="ph-bold ph-shopping-cart-simple"></i>
                </div>
                <div>
                    <h3 className="font-outfit font-black text-base text-ink dark:text-night-text">Giỏ Hàng Thuê & Mua Sách</h3>
                    <p className="text-xs text-ink-muted dark:text-night-muted"><span id="cartDrawerItemCount">0</span> ấn phẩm trong giỏ</p>
                </div>
            </div>
            <button type="button" onClick={(event) => { toggleCartDrawer(false) }} className="p-2 rounded-xl text-ink-muted hover:text-ink dark:hover:text-night-text hover:bg-paper-100 dark:hover:bg-night-surface transition-colors cursor-pointer" title="Đóng giỏ hàng">
                <i className="ph-bold ph-x text-lg"></i>
            </button>
        </div>

        {/* Cart Items List (Dynamic) */}
        <div id="cartItemsList" className="flex-1 overflow-y-auto p-5 space-y-3">
            {/* Items rendered via updateCartUI() */}
        </div>

        {/* Drawer Footer & Checkout */}
        <div className="p-5 border-t border-paper-border dark:border-night-border bg-paper-50/70 dark:bg-night-surface/70 space-y-3.5">
            <div className="flex items-center justify-between text-xs text-ink-muted dark:text-night-muted">
                <span>Số dư Khoai của bạn:</span>
                <span className="font-outfit font-bold text-ink dark:text-night-text flex items-center gap-1">
                    <span id="cartDrawerUserKhoai">{userKhoai.toLocaleString()}</span> <i className="ph-fill ph-coins text-gold"></i>
                </span>
            </div>
            <div className="flex items-center justify-between">
                <span className="font-outfit font-bold text-sm text-ink dark:text-night-text">Tổng thanh toán:</span>
                <div className="flex items-baseline gap-1 text-2xl font-outfit font-black text-wine dark:text-gold">
                    <span id="cartDrawerTotal">0</span>
                    <span className="text-xs font-bold text-gold">Khoai</span>
                    <i className="ph-fill ph-coins text-gold text-base"></i>
                </div>
            </div>
            <button id="btnCheckoutCart" onClick={(event) => { handleCheckoutCart() }} className="w-full bg-wine hover:bg-wine-dark text-white font-outfit font-extrabold py-3.5 px-4 rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer text-sm group disabled:opacity-50 disabled:cursor-not-allowed">
                <i className="ph-fill ph-check-circle text-lg text-amber-300 group-hover:scale-110 transition-transform"></i>
                <span>Xác Nhận Thuê & Mua Bằng Khoai</span>
            </button>
            <p className="text-[11px] text-center text-ink-muted dark:text-night-muted">
                Sau khi thanh toán, sách sẽ chuyển ngay vào <strong className="text-wine dark:text-gold">Tủ Sách</strong> để đọc online.
            </p>
        </div>
    </div>

    {/* Toast Notification Container */}
    <div id="toastContainer" className="fixed top-24 right-5 z-50 flex flex-col gap-2 pointer-events-none"></div>

    {/* ========================================================
         SCRIPTS: 3D BOOK TILT, SIGNATURE 3D BOOK FLY & OPEN TRANSITION,
         AUDIO PREVIEW, THEME TOGGLE, AND TOASTS
         ======================================================== */}
            </div>
            </UserLayout>
        </>
    );
}
