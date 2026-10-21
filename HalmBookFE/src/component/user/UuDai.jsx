import React, { useEffect } from 'react';

export default function OffersEndPage() {
    useEffect(() => {
        if (window.__offersEndPageInitialized) return;
        window.__offersEndPageInitialized = true;

        const scripts = [
            {
                "src": "https://cdn.tailwindcss.com"
            },
            {
                "src": "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"
            },
            {
                "code": "\n        tailwind.config = {\n            darkMode: 'class',\n            theme: {\n                extend: {\n                    fontFamily: {\n                        sans: ['var(--font-ui)', 'sans-serif'],\n                        display: ['var(--font-display)', 'sans-serif'],\n                        metadata: ['var(--font-metadata)', 'sans-serif'],\n                        editorial: ['var(--font-editorial)', 'sans-serif'],\n                    },\n                    colors: {\n                        paper: {\n                            50: '#FAF8F5',\n                            100: '#F5F2EB',\n                            200: '#EAE5D9',\n                            DEFAULT: '#F7F4EE',\n                            surface: '#FFFEFA',\n                            border: '#E3DDD0',\n                        },\n                        ink: {\n                            50: '#F5F5F4',\n                            300: '#A8A6A1',\n                            muted: '#66645E',\n                            DEFAULT: '#1E1F1D',\n                            pure: '#111210',\n                        },\n                        wine: {\n                            DEFAULT: '#8E3038',\n                            light: '#A83B46',\n                            dark: '#6F252C',\n                        },\n                        gold: {\n                            DEFAULT: '#B8860B',\n                            light: '#D4AF37',\n                        },\n                        night: {\n                            bg: '#111210',\n                            surface: '#181916',\n                            card: '#20221E',\n                            border: '#2C2E29',\n                            text: '#EDE9DF',\n                            muted: '#96938B',\n                        }\n                    }\n                }\n            }\n        };\n    "
            },
            {
                "code": "\n        // --- 1. USER MOCK BALANCE ---\n        let currentKhoaiBalance = 1250;\n        const khoaiDisplay = document.getElementById('user-khoai-display');\n        function updateKhoaiDisplay() {\n            if (khoaiDisplay) khoaiDisplay.textContent = currentKhoaiBalance.toLocaleString('vi-VN');\n        }\n\n        // --- 2. HORIZONTAL ROW SMOOTH SCROLL ---\n        function scrollRow(rowId, offset) {\n            const container = document.getElementById(rowId);\n            if (container) {\n                container.scrollBy({ left: offset, behavior: 'smooth' });\n            }\n        }\n\n        // --- 3. THEME TOGGLE (SYNCED WITH TRANG CHỦ) ---\n        function initStars() {\n            const starryBg = document.getElementById('starry-background');\n            if (!starryBg || starryBg.hasChildNodes()) return;\n            const starCount = 80;\n            for (let i = 0; i < starCount; i++) {\n                const star = document.createElement('div');\n                star.className = 'star';\n                const size = Math.random() * 2.5 + 0.5;\n                star.style.width = `${size}px`;\n                star.style.height = `${size}px`;\n                star.style.top = `${Math.random() * 100}%`;\n                star.style.left = `${Math.random() * 100}%`;\n                star.style.animation = `starTwinkle ${Math.random() * 3 + 2}s infinite ease-in-out ${Math.random() * 3}s`;\n                starryBg.appendChild(star);\n            }\n        }\n\n        const themeToggleBtn = document.getElementById('theme-toggle');\n        const themeIcon = document.getElementById('theme-icon');\n        const savedTheme = localStorage.getItem('color-theme') || 'light';\n\n        if (savedTheme === 'dark') {\n            document.documentElement.classList.add('dark');\n            if (themeIcon) themeIcon.classList.replace('ph-moon', 'ph-sun');\n            initStars();\n        } else {\n            document.documentElement.classList.remove('dark');\n            if (themeIcon) themeIcon.classList.replace('ph-sun', 'ph-moon');\n        }\n\n        if (themeToggleBtn) {\n            themeToggleBtn.addEventListener('click', () => {\n                document.documentElement.classList.toggle('dark');\n                const isDark = document.documentElement.classList.contains('dark');\n                localStorage.setItem('color-theme', isDark ? 'dark' : 'light');\n                if (isDark) {\n                    if (themeIcon) themeIcon.classList.replace('ph-moon', 'ph-sun');\n                    initStars();\n                } else {\n                    if (themeIcon) themeIcon.classList.replace('ph-sun', 'ph-moon');\n                }\n            });\n        }\n\n        // --- 4. SCROLLED NAVBAR & SCROLL TO TOP ---\n        const navbar = document.getElementById('navbar');\n        const btnScrollToTop = document.getElementById('btnScrollToTop');\n\n        window.addEventListener('scroll', () => {\n            const scrollY = window.pageYOffset || document.documentElement.scrollTop;\n            \n            // Header backdrop\n            if (scrollY > 30) {\n                navbar.classList.add('scrolled');\n            } else {\n                navbar.classList.remove('scrolled');\n            }\n\n            // Scroll to top button\n            if (scrollY > 320) {\n                btnScrollToTop.classList.add('show');\n            } else {\n                btnScrollToTop.classList.remove('show');\n            }\n        });\n\n        if (btnScrollToTop) {\n            btnScrollToTop.addEventListener('click', () => {\n                window.scrollTo({ top: 0, behavior: 'smooth' });\n            });\n        }\n\n        // Mobile drawer toggle\n        const mobileMenuBtn = document.getElementById('mobile-menu-btn');\n        const mobileDrawer = document.getElementById('mobile-drawer');\n        if (mobileMenuBtn && mobileDrawer) {\n            mobileMenuBtn.addEventListener('click', () => {\n                mobileDrawer.classList.toggle('hidden');\n            });\n        }\n\n        // --- 5. REDEEM CONFIRMATION MODAL & TOAST ---\n        const redeemModal = document.getElementById('redeem-modal');\n        const modalTitle = document.getElementById('modal-offer-title');\n        const modalCost = document.getElementById('modal-offer-cost');\n        const modalUserBalance = document.getElementById('modal-user-balance');\n        const modalConfirmBtn = document.getElementById('modal-confirm-btn');\n        const toast = document.getElementById('toast-notification');\n        const toastTitle = document.getElementById('toast-title');\n        const toastMsg = document.getElementById('toast-message');\n\n        let pendingRedeem = null;\n\n        function showToast(title, message) {\n            if (!toast) return;\n            toastTitle.textContent = title;\n            toastMsg.textContent = message;\n            toast.classList.add('show');\n            setTimeout(() => {\n                toast.classList.remove('show');\n            }, 3800);\n        }\n\n        function openRedeemModal(title, cost, successMsg) {\n            pendingRedeem = { title, cost, successMsg };\n            modalTitle.textContent = title;\n            modalCost.textContent = cost > 0 ? `${cost.toLocaleString('vi-VN')} Khoai` : '0 Khoai (Miễn Phí)';\n            modalUserBalance.textContent = `${currentKhoaiBalance.toLocaleString('vi-VN')} Khoai`;\n\n            if (currentKhoaiBalance < cost) {\n                modalConfirmBtn.disabled = true;\n                modalConfirmBtn.textContent = 'Số Dư Khoai Không Đủ';\n                modalConfirmBtn.className = 'flex-1 py-2.5 rounded-full bg-paper-border dark:bg-night-border text-ink-muted cursor-not-allowed font-metadata-spec text-xs font-bold';\n            } else {\n                modalConfirmBtn.disabled = false;\n                modalConfirmBtn.textContent = cost > 0 ? 'Xác Nhận Đổi Khoai' : 'Xác Nhận Ngay';\n                modalConfirmBtn.className = 'flex-1 py-2.5 rounded-full bg-wine hover:bg-wine-dark text-white font-metadata-spec text-xs font-bold transition-colors shadow-sm';\n            }\n\n            redeemModal.classList.remove('hidden');\n            redeemModal.classList.add('flex');\n        }\n\n        function closeRedeemModal() {\n            redeemModal.classList.add('hidden');\n            redeemModal.classList.remove('flex');\n            pendingRedeem = null;\n        }\n\n        modalConfirmBtn.addEventListener('click', () => {\n            if (!pendingRedeem) return;\n            if (currentKhoaiBalance >= pendingRedeem.cost) {\n                currentKhoaiBalance -= pendingRedeem.cost;\n                updateKhoaiDisplay();\n                const successMsg = pendingRedeem.successMsg;\n                closeRedeemModal();\n                showToast('Đổi Ưu Đãi Thành Công!', successMsg);\n            }\n        });\n\n        // Close modal on click backdrop\n        redeemModal.addEventListener('click', (e) => {\n            if (e.target === redeemModal) closeRedeemModal();\n        });\n\n        // --- 6. CHATBOT INTERACTIONS (ĐỒNG BỘ TRANG CHỦ) ---\n        const chatWindow = document.getElementById('chat-window');\n        const chatToggleBtn = document.getElementById('chat-toggle-btn');\n        const closeChatBtn = document.getElementById('close-chat');\n        const refreshChatBtn = document.getElementById('refresh-chat');\n        const chatInput = document.getElementById('chat-input');\n        const sendBtn = document.getElementById('send-btn');\n        const chatMessages = document.getElementById('chat-messages');\n        const chatWelcome = document.getElementById('chat-welcome');\n\n        function openChatbot(initialMsg) {\n            chatWindow.classList.add('show');\n            if (initialMsg) {\n                appendUserMessage(initialMsg);\n                setTimeout(() => {\n                    handleBotReply(initialMsg);\n                }, 600);\n            }\n        }\n\n        if (chatToggleBtn) {\n            chatToggleBtn.addEventListener('click', () => {\n                chatWindow.classList.toggle('show');\n            });\n        }\n        if (closeChatBtn) {\n            closeChatBtn.addEventListener('click', () => {\n                chatWindow.classList.remove('show');\n            });\n        }\n        if (refreshChatBtn) {\n            refreshChatBtn.addEventListener('click', () => {\n                chatMessages.innerHTML = '';\n                chatMessages.classList.add('hidden');\n                chatWelcome.classList.remove('hidden');\n            });\n        }\n\n        function appendUserMessage(text) {\n            chatWelcome.classList.add('hidden');\n            chatMessages.classList.remove('hidden');\n            const msg = document.createElement('div');\n            msg.className = 'self-end bg-wine text-white max-w-[80%] rounded-2xl rounded-tr-sm px-3.5 py-2 text-xs font-metadata-spec';\n            msg.textContent = text;\n            chatMessages.appendChild(msg);\n            chatMessages.scrollTop = chatMessages.scrollHeight;\n        }\n\n        function appendBotMessage(text) {\n            const msg = document.createElement('div');\n            msg.className = 'self-start bg-night-card border border-night-border text-night-text max-w-[85%] rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-xs font-editorial-body';\n            msg.innerHTML = text;\n            chatMessages.appendChild(msg);\n            chatMessages.scrollTop = chatMessages.scrollHeight;\n        }\n\n        function handleBotReply(userInput) {\n            const q = userInput.toLowerCase();\n            let reply = \"Cảm ơn bạn đã hỏi. HALM BOOK đang có các chương trình giảm 50% Gói VIP 1 Năm, 3 lần upload AI miễn phí và nhiều combo sách cực tiết kiệm. Bạn muốn tìm hiểu gói nào?\";\n            if (q.includes('sinh viên') || q.includes('hssv')) {\n                reply = \"Gói Sinh Viên hiện đang có giá chỉ <strong>50 Khoai / tháng</strong>! Bạn chỉ cần tải ảnh thẻ HSSV hợp lệ để kích hoạt ngay đặc quyền đọc toàn bộ kho sách.\";\n            } else if (q.includes('khoai') || q.includes('thưởng')) {\n                reply = \"Bạn có thể tích lũy Khoai bằng cách: Duy trì chuỗi đọc 7 ngày (+10 Khoai), hoàn thành thử thách đọc sách hoặc nạp điểm Khoai tại mục Tài Khoản.\";\n            } else if (q.includes('upload') || q.includes('tài liệu')) {\n                reply = \"Thành viên mới được <strong>Free 3 lượt upload đầu tiên</strong>! Sau đó bạn có thể chọn gói ngày 10 Khoai hoặc gói không giới hạn 30 Khoai/tháng.\";\n            } else if (q.includes('combo')) {\n                reply = \"Hiện có 3 combo hot: Combo Kỹ Năng Sống (120 Khoai), Combo Trinh Thám (200 Khoai) và Combo Ngôn Tình (247 Khoai, giảm 45%).\";\n            }\n            appendBotMessage(reply);\n        }\n\n        function sendMessage() {\n            const text = chatInput.value.trim();\n            if (!text) return;\n            appendUserMessage(text);\n            chatInput.value = '';\n            setTimeout(() => {\n                handleBotReply(text);\n            }, 600);\n        }\n\n        if (sendBtn) sendBtn.addEventListener('click', sendMessage);\n        if (chatInput) {\n            chatInput.addEventListener('keydown', (e) => {\n                if (e.key === 'Enter') sendMessage();\n            });\n        }\n\n        // Suggestions buttons click\n        document.querySelectorAll('.suggestion-btn').forEach(btn => {\n            btn.addEventListener('click', () => {\n                const text = btn.querySelector('span').textContent;\n                appendUserMessage(text);\n                setTimeout(() => {\n                    handleBotReply(text);\n                }, 600);\n            });\n        });\n\n        // Search in offers\n        function handleOfferSearch() {\n            const query = document.getElementById('header-search-input').value.toLowerCase().trim();\n            if (!query) return;\n            const allCards = document.querySelectorAll('.cards-scroll-container > div');\n            let matched = false;\n            allCards.forEach(card => {\n                const title = card.querySelector('h3')?.textContent.toLowerCase() || '';\n                const desc = card.querySelector('p')?.textContent.toLowerCase() || '';\n                if (title.includes(query) || desc.includes(query)) {\n                    card.scrollIntoView({ behavior: 'smooth', block: 'center' });\n                    card.classList.add('ring-2', 'ring-wine', 'dark:ring-gold');\n                    setTimeout(() => card.classList.remove('ring-2', 'ring-wine', 'dark:ring-gold'), 3000);\n                    matched = true;\n                }\n            });\n            if (!matched) {\n                showToast('Tìm Kiếm', `Không tìm thấy ưu đãi phù hợp với \"${query}\".`);\n            }\n        }\n\n        // --- 7. SMART COMBO BOOK POPUP CONTROLLER (MATCHES ADMIN 4 STATS CARDS) ---\n        const comboPopup = document.getElementById('combo-book-popup');\n        let currentActiveBook = null;\n        let popupHideTimeout = null;\n        let popupCloseTimeout = null;\n\n        function clearAllPopupTimers() {\n            if (popupHideTimeout) {\n                clearTimeout(popupHideTimeout);\n                popupHideTimeout = null;\n            }\n            if (popupCloseTimeout) {\n                clearTimeout(popupCloseTimeout);\n                popupCloseTimeout = null;\n            }\n        }\n\n        function showBookPopup(item) {\n            clearAllPopupTimers();\n            currentActiveBook = item;\n\n            // 1. Populate data from item\n            const title = item.dataset.title || '';\n            const author = item.dataset.author || '';\n            const category = item.dataset.category || '';\n            const rating = item.dataset.rating || '★ 4.9';\n            const pages = item.dataset.pages || '250 trang';\n            const price = item.dataset.price || '';\n            const summary = item.dataset.summary || '';\n            const cover = item.dataset.cover || '';\n\n            document.getElementById('popup-book-title').textContent = title;\n            document.getElementById('popup-book-author').textContent = author;\n            document.getElementById('popup-book-category').textContent = category;\n            document.getElementById('popup-book-rating').textContent = rating;\n            document.getElementById('popup-book-pages').textContent = pages;\n            document.getElementById('popup-book-price').textContent = price;\n            document.getElementById('popup-book-summary').textContent = summary;\n            \n            const coverImg = document.getElementById('popup-book-cover');\n            if (cover) {\n                coverImg.src = cover;\n                coverImg.style.display = 'block';\n            } else {\n                coverImg.style.display = 'none';\n            }\n\n            // 2. Display and measure\n            comboPopup.style.display = 'block';\n            comboPopup.style.visibility = 'hidden';\n            comboPopup.classList.remove('pos-top', 'pos-bottom');\n\n            const targetCover = item.querySelector('.book-cover-wrapper') || item;\n            const rect = item.getBoundingClientRect();\n            const coverRect = targetCover.getBoundingClientRect();\n            const popupRect = comboPopup.getBoundingClientRect();\n            const popupWidth = popupRect.width || 320;\n            const popupHeight = popupRect.height || 210;\n\n            // 3. Smart Vertical Flip:\n            // If book is near the bottom of viewport or space below is less than popupHeight, flip TOP\n            const spaceBelow = window.innerHeight - rect.bottom;\n            const isNearBottom = rect.bottom > (window.innerHeight * 0.55) || spaceBelow < (popupHeight + 20);\n\n            let topPos;\n            if (isNearBottom) {\n                topPos = coverRect.top - popupHeight - 14;\n                comboPopup.classList.add('pos-top');\n            } else {\n                topPos = rect.bottom + 14;\n                comboPopup.classList.add('pos-bottom');\n            }\n\n            // Clamping vertical position to keep popup fully within viewport\n            topPos = Math.max(14, Math.min(topPos, window.innerHeight - popupHeight - 14));\n\n            // 4. Horizontal alignment and clamping within screen edges\n            const bookCenterX = coverRect.left + (coverRect.width / 2);\n            const idealLeft = bookCenterX - (popupWidth / 2);\n            const minLeft = 14;\n            const maxLeft = window.innerWidth - popupWidth - 14;\n            const clampedLeft = Math.max(minLeft, Math.min(idealLeft, maxLeft));\n\n            // 5. Arrow alignment pointing to center of book cover\n            const arrowLeft = bookCenterX - clampedLeft;\n            const clampedArrowLeft = Math.max(20, Math.min(arrowLeft, popupWidth - 20));\n            comboPopup.style.setProperty('--arrow-left', `${clampedArrowLeft}px`);\n\n            comboPopup.style.top = `${topPos}px`;\n            comboPopup.style.left = `${clampedLeft}px`;\n            comboPopup.style.visibility = 'visible';\n            comboPopup.classList.add('active');\n        }\n\n        function scheduleHideBookPopup() {\n            clearAllPopupTimers();\n            popupHideTimeout = setTimeout(() => {\n                currentActiveBook = null;\n                comboPopup.classList.remove('active');\n                popupCloseTimeout = setTimeout(() => {\n                    if (!currentActiveBook && !comboPopup.classList.contains('active')) {\n                        comboPopup.style.display = 'none';\n                    }\n                }, 220);\n            }, 300);\n        }\n\n        function initComboBookPopups() {\n            if (window._comboPopupsInitialized) return;\n            const bookItems = document.querySelectorAll('.combo-book-item');\n            if (!bookItems.length || !comboPopup) return;\n            window._comboPopupsInitialized = true;\n\n            bookItems.forEach(item => {\n                item.addEventListener('mouseenter', () => {\n                    showBookPopup(item);\n                });\n\n                item.addEventListener('mousemove', () => {\n                    clearAllPopupTimers();\n                    if (currentActiveBook !== item) {\n                        showBookPopup(item);\n                    }\n                });\n\n                item.addEventListener('mouseleave', (e) => {\n                    const related = e.relatedTarget;\n                    if (related && (comboPopup.contains(related) || related === comboPopup)) {\n                        return;\n                    }\n                    scheduleHideBookPopup();\n                });\n            });\n\n            // Keep popup open if mouse moves directly into popup\n            comboPopup.addEventListener('mouseenter', () => {\n                clearAllPopupTimers();\n            });\n            comboPopup.addEventListener('mousemove', () => {\n                clearAllPopupTimers();\n            });\n            comboPopup.addEventListener('mouseleave', (e) => {\n                const related = e.relatedTarget;\n                if (related && related.closest && related.closest('.combo-book-item')) {\n                    return;\n                }\n                scheduleHideBookPopup();\n            });\n        }\n\n        // Initialize popups safely on load\n        if (document.readyState === 'loading') {\n            document.addEventListener('DOMContentLoaded', initComboBookPopups);\n        } else {\n            initComboBookPopups();\n        }\n    "
            },
            {
                "src": "header.js"
            },
            {
                "src": "chatbot.js"
            }
        ];
        const loadScripts = async () => {
            for (const definition of scripts) {
                const script = document.createElement('script');
                if (definition.src) {
                    script.src = definition.src;
                    script.async = false;
                    await new Promise((resolve, reject) => {
                        script.onload = resolve;
                        script.onerror = () => reject(new Error('Unable to load ' + script.src));
                        document.head.appendChild(script);
                    });
                } else {
                    script.textContent = definition.code;
                    document.body.appendChild(script);
                }
            }
        };

        loadScripts().catch((error) => {
            console.error('Failed to initialize the offers page.', error);
        });
    }, []);

    return (
        <>
            <meta charSet="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>HALM BOOK — Không Gian Đọc Sách & Đặc Quyền Ưu Đãi</title>
            <meta name="description" content="Chương trình ưu đãi đặc quyền độc giả HALM BOOK: Giảm giá gói cước hội viên, tiện ích upload tài liệu AI, combo siêu tiết kiệm và thử thách đọc sách thưởng Khoai." />

            {/* STRICT FONT SYSTEM: ONLY INTER, ROBOTO, OPEN SANS */}
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Open+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400;1,600&family=Roboto:wght@300;400;500;700;900&display=swap" rel="stylesheet" />

            {/* Tailwind CSS CDN */}


            {/* Icons: Phosphor Icons (Direct CDN to ensure instant loading without jsdelivr dependency) & Font Awesome */}
            <link rel="stylesheet" type="text/css" href="https://unpkg.com/@phosphor-icons/web@2.1.1/src/bold/style.css" />
            <link rel="stylesheet" type="text/css" href="https://unpkg.com/@phosphor-icons/web@2.1.1/src/regular/style.css" />
            <link rel="stylesheet" type="text/css" href="https://unpkg.com/@phosphor-icons/web@2.1.1/src/fill/style.css" />
            <link rel="stylesheet" type="text/css" href="https://unpkg.com/@phosphor-icons/web@2.1.1/src/duotone/style.css" />
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />

            {/* GSAP for Smooth Motion */}




            <style dangerouslySetInnerHTML={{ __html: "\n        /* ========================================================\n           TYPOGRAPHY & CSS VARIABLES (MATCHING TRANG CHỦ)\n           ======================================================== */\n        :root {\n            --font-display: \"Inter\", sans-serif;\n            --font-ui: \"Inter\", sans-serif;\n            --font-metadata: \"Roboto\", sans-serif;\n            --font-editorial: \"Open Sans\", sans-serif;\n        }\n\n        html {\n            scroll-behavior: smooth;\n        }\n\n        body {\n            font-family: var(--font-ui);\n            background-color: #F7F4EE;\n            color: #1E1F1D;\n            overflow-x: hidden;\n            -webkit-font-smoothing: antialiased;\n            transition: background-color 0.4s ease, color 0.4s ease;\n        }\n\n        .dark body {\n            background-color: #111210;\n            color: #EDE9DF;\n        }\n\n        .font-display-hero {\n            font-family: var(--font-display);\n            font-weight: 900;\n            letter-spacing: -0.03em;\n        }\n\n        .font-editorial-body {\n            font-family: var(--font-editorial);\n            line-height: 1.7;\n        }\n\n        .font-metadata-spec {\n            font-family: var(--font-metadata);\n        }\n\n        /* Paper grain texture */\n        .paper-grain {\n            background-image: radial-gradient(rgba(30, 31, 29, 0.04) 1px, transparent 1px);\n            background-size: 28px 28px;\n        }\n        .dark .paper-grain {\n            background-image: radial-gradient(rgba(237, 233, 223, 0.04) 1px, transparent 1px);\n            background-size: 28px 28px;\n        }\n\n        /* Starry sky overlay for dark mode */\n        #starry-background {\n            position: fixed;\n            top: 0;\n            left: 0;\n            width: 100%;\n            height: 100%;\n            pointer-events: none;\n            z-index: 1;\n            opacity: 0;\n            transition: opacity 0.6s ease;\n        }\n        .dark #starry-background {\n            opacity: 1;\n        }\n        .star {\n            position: absolute;\n            background-color: #fff;\n            border-radius: 50%;\n            pointer-events: none;\n        }\n        @keyframes starTwinkle {\n            0%, 100% { opacity: 0.2; transform: scale(0.8); }\n            50% { opacity: 0.9; transform: scale(1.3); }\n        }\n\n        /* Scrolled Header */\n        #navbar {\n            transition: transform 0.38s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease, padding 0.3s ease;\n            will-change: transform;\n        }\n        #navbar.scrolled {\n            background-color: rgba(247, 244, 238, 0.94);\n            backdrop-filter: blur(16px);\n            border-color: rgba(227, 221, 208, 0.8);\n            box-shadow: 0 4px 20px -4px rgba(0,0,0,0.06);\n        }\n        .dark #navbar.scrolled {\n            background-color: rgba(17, 18, 16, 0.94);\n            border-color: rgba(44, 46, 41, 0.8);\n            box-shadow: 0 4px 25px -4px rgba(0,0,0,0.5);\n        }\n\n        /* Horizontal Sliders & Card Sizing: Exactly 4 cards on desktop (>=1024px) */\n        .cards-scroll-container {\n            display: flex;\n            gap: 1.5rem;\n            overflow-x: auto;\n            scroll-behavior: smooth;\n            -ms-overflow-style: none;\n            scrollbar-width: none;\n            padding: 0.25rem 0.25rem 0.5rem 0.25rem;\n        }\n        .cards-scroll-container::-webkit-scrollbar {\n            display: none;\n        }\n\n        .offer-card {\n            flex: 0 0 280px;\n            min-width: 280px;\n            width: 280px;\n        }\n        @media (min-width: 640px) {\n            .offer-card {\n                flex: 0 0 300px;\n                min-width: 300px;\n                width: 300px;\n            }\n        }\n        @media (min-width: 1024px) {\n            .offer-card {\n                /* Exactly 4 cards visible across the full row: \n                   100% width minus 3 gaps (3 * 1.5rem = 4.5rem = 72px) divided by 4 */\n                flex: 0 0 calc((100% - 4.5rem) / 4);\n                min-width: calc((100% - 4.5rem) / 4);\n                max-width: calc((100% - 4.5rem) / 4);\n                width: calc((100% - 4.5rem) / 4);\n            }\n        }\n\n        /* Potato Badge */\n        .potato-badge {\n            display: inline-flex;\n            align-items: center;\n            gap: 0.35rem;\n            background: rgba(184, 134, 11, 0.12);\n            color: #B8860B;\n            border: 1px solid rgba(184, 134, 11, 0.25);\n            border-radius: 9999px;\n            padding: 0.25rem 0.65rem;\n            font-size: 0.8rem;\n            font-weight: 700;\n            font-family: var(--font-metadata);\n        }\n        .dark .potato-badge {\n            background: rgba(212, 175, 55, 0.15);\n            color: #D4AF37;\n            border-color: rgba(212, 175, 55, 0.3);\n        }\n\n        /* Chatbot Modal Styling */\n        #chatbot-container {\n            position: fixed;\n            bottom: 24px;\n            right: 24px;\n            z-index: 50;\n        }\n        #chat-window {\n            position: absolute;\n            bottom: 70px;\n            right: 0;\n            width: 360px;\n            height: 480px;\n            max-width: calc(100vw - 32px);\n            background: #181916;\n            border: 1px solid #2C2E29;\n            border-radius: 16px;\n            box-shadow: 0 20px 40px rgba(0,0,0,0.6);\n            display: flex;\n            flex-direction: column;\n            overflow: hidden;\n            transform: scale(0.9) translateY(20px);\n            opacity: 0;\n            pointer-events: none;\n            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);\n            transform-origin: bottom right;\n        }\n        #chat-window.show {\n            transform: scale(1) translateY(0);\n            opacity: 1;\n            pointer-events: auto;\n        }\n\n        /* Floating Scroll to Top */\n        #btnScrollToTop {\n            position: fixed;\n            bottom: 24px;\n            left: 24px;\n            z-index: 40;\n            width: 44px;\n            height: 44px;\n            border-radius: 50%;\n            background: #FFFEFA;\n            color: #1E1F1D;\n            border: 1px solid #E3DDD0;\n            display: flex;\n            align-items: center;\n            justify-content: center;\n            box-shadow: 0 4px 14px rgba(0,0,0,0.08);\n            cursor: pointer;\n            opacity: 0;\n            visibility: hidden;\n            transition: all 0.3s ease;\n        }\n        .dark #btnScrollToTop {\n            background: #20221E;\n            color: #EDE9DF;\n            border-color: #2C2E29;\n            box-shadow: 0 4px 14px rgba(0,0,0,0.4);\n        }\n        #btnScrollToTop.show {\n            opacity: 1;\n            visibility: visible;\n        }\n        #btnScrollToTop:hover {\n            transform: translateY(-3px);\n            background: #8E3038;\n            color: #fff;\n            border-color: #8E3038;\n        }\n        .dark #btnScrollToTop:hover {\n            background: #B8860B;\n            color: #111210;\n            border-color: #B8860B;\n        }\n\n        /* Toast Container */\n        #toast-notification {\n            position: fixed;\n            top: 24px;\n            right: 24px;\n            z-index: 1000;\n            transform: translateX(120%);\n            transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);\n        }\n        #toast-notification.show {\n            transform: translateX(0);\n        }\n\n        /* ========================================================\n           COMBO BOOKS SMART POPUP STYLES\n           ======================================================== */\n        .combo-book-item {\n            cursor: pointer;\n            position: relative;\n            z-index: 10;\n        }\n        .combo-book-item:hover {\n            z-index: 30;\n        }\n        .combo-book-item .book-cover-wrapper {\n            transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease;\n        }\n        .combo-book-item:hover .book-cover-wrapper {\n            transform: translateY(-4px) scale(1.05);\n        }\n\n        /* Smart Popup Tooltip for Combo Books */\n        .combo-book-popup {\n            position: fixed !important;\n            width: 320px;\n            max-width: calc(100vw - 32px);\n            background: rgba(15, 23, 42, 0.96) !important;\n            color: #fff !important;\n            border-radius: 16px;\n            padding: 16px;\n            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.12);\n            backdrop-filter: blur(16px);\n            -webkit-backdrop-filter: blur(16px);\n            opacity: 0;\n            visibility: hidden;\n            pointer-events: none;\n            transition: opacity 0.25s ease, transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), visibility 0.25s ease;\n            z-index: 99999 !important;\n        }\n        .dark .combo-book-popup {\n            background: rgba(24, 25, 22, 0.98) !important;\n            border-color: rgba(212, 175, 55, 0.3);\n            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(212, 175, 55, 0.2);\n        }\n\n        /* Active visible state */\n        .combo-book-popup.active {\n            opacity: 1;\n            visibility: visible;\n            pointer-events: auto;\n        }\n\n        /* Direction: TOP (when element is near bottom of viewport) */\n        .combo-book-popup.pos-top {\n            transform: translateY(6px);\n        }\n        .combo-book-popup.pos-top.active {\n            transform: translateY(0);\n        }\n        .combo-book-popup.pos-top::after {\n            content: '';\n            position: absolute;\n            top: 100%;\n            left: var(--arrow-left, 50%);\n            transform: translateX(-50%);\n            border-width: 7px;\n            border-style: solid;\n            border-color: rgba(15, 23, 42, 0.96) transparent transparent transparent;\n            pointer-events: none;\n        }\n        .dark .combo-book-popup.pos-top::after {\n            border-color: rgba(24, 25, 22, 0.98) transparent transparent transparent;\n        }\n\n        /* Direction: BOTTOM (when element is near top of viewport) */\n        .combo-book-popup.pos-bottom {\n            transform: translateY(-6px);\n        }\n        .combo-book-popup.pos-bottom.active {\n            transform: translateY(0);\n        }\n        .combo-book-popup.pos-bottom::after {\n            content: '';\n            position: absolute;\n            bottom: 100%;\n            left: var(--arrow-left, 50%);\n            transform: translateX(-50%);\n            border-width: 7px;\n            border-style: solid;\n            border-color: transparent transparent rgba(15, 23, 42, 0.96) transparent;\n            pointer-events: none;\n        }\n        .dark .combo-book-popup.pos-bottom::after {\n            border-color: transparent transparent rgba(24, 25, 22, 0.98) transparent;\n        }\n    " }} />
            <div className="paper-grain relative min-h-screen flex flex-col">
                {/* Starry background in Dark Mode */}
                <div id="starry-background"></div>

                {/* Toast Notification */}
                <div id="toast-notification" className="flex items-center gap-3 px-5 py-4 rounded-xl bg-paper-surface dark:bg-night-card border border-wine/30 dark:border-gold/40 shadow-2xl text-ink dark:text-night-text">
                    <div className="w-8 h-8 rounded-full bg-wine/10 dark:bg-gold/20 flex items-center justify-center text-wine dark:text-gold shrink-0">
                        <i className="ph-bold ph-check text-lg"></i>
                    </div>
                    <div>
                        <div className="font-display font-bold text-xs" id="toast-title">Thông Báo Ưu Đãi</div>
                        <div className="font-editorial-body text-xs text-ink-muted dark:text-night-muted" id="toast-message">Đã kích hoạt ưu đãi thành công.</div>
                    </div>
                </div>

                {/* ========================================================
                 NAVBAR: EDITORIAL NAVIGATION (ĐỒNG BỘ TRANG CHỦ)
                 ======================================================== */}
                <header id="navbar" className="fixed top-0 inset-x-0 z-40 transition-all duration-300 py-3.5 border-b bg-[#FAF8F5]/95 dark:bg-[#111210]/95 backdrop-blur-md border-[#E3DDD0] dark:border-[#2C2E29]">
                    <div className="w-full max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3 sm:gap-4 font-nunito">

                        {/* 1. Logo & Thương Hiệu */}
                        <div className="flex items-center shrink-0">
                            <a href="home_end.html" className="flex items-center gap-2.5 group" aria-label="HALM BOOK Trang Chủ">
                                <img src="img/icon-removebg-preview.png" alt="Halm Book Logo" className="w-10 h-10 sm:w-11 sm:h-11 object-contain group-hover:rotate-[-6deg] group-hover:scale-105 transition-transform duration-300 origin-bottom-left" onError={(event) => { event.currentTarget.src = './image/LOGO HALM BOOK/logo.png' }} />
                                <div className="flex flex-col">
                                    <span className="tracking-tight uppercase text-2xl sm:text-[26px] font-black text-[#8B4A3C] dark:text-[#EDE9DF] group-hover:text-[#6F252C] dark:group-hover:text-[#D4AF37] transition-all font-nunito leading-none">HALM BOOK</span>
                                    <span className="font-metadata-spec text-[8.5px] sm:text-[9.5px] uppercase tracking-[0.28em] text-[#85817A] dark:text-[#96938B] font-extrabold mt-1">Tuyển Tập Tri Thức</span>
                                </div>
                            </a>
                        </div>

                        {/* 2. Khu Vực Giữa: Danh Mục Dropdown + Ô Tìm Kiếm Nhanh */}
                        <div className="flex-1 flex items-center justify-center gap-2.5 sm:gap-3 px-4 sm:px-6 lg:px-8 min-w-0 hidden sm:flex">

                            {/* Nút Danh Mục Dropdown (Ổn định tuyệt đối, Không thanh cuộn, Bỏ Tất Cả) */}
                            <div className="relative shrink-0" id="category-nav-wrapper">
                                <button id="category-nav-btn" type="button" onClick={(event) => { window.toggleCategoryDropdown(event); }} className="flex items-center justify-center gap-1.5 text-[#8B4A3C] dark:text-[#E5A93C] transition-all px-3 sm:px-3.5 py-1.5 rounded-full border border-[#D4AF37] dark:border-[#E5A93C] bg-[#D4AF37]/15 dark:bg-[#E5A93C]/10 hover:bg-[#D4AF37]/25 dark:hover:bg-[#E5A93C]/20 shadow-sm cursor-pointer" aria-label="Danh mục sách" aria-expanded="false" title="Danh mục sách">
                                    <i className="ph-bold ph-squares-four text-lg transition-colors"></i>
                                    <span className="text-[13px] sm:text-[14px] font-bold hidden md:inline">Danh Mục</span>
                                    <i className="ph-bold ph-caret-down text-[10px] transition-transform duration-200" id="category-caret-icon"></i>
                                </button>
                                {/* Dropdown Menu với Padding-Top Bridge (Không bị gián đoạn hover, 2 cột gọn gàng, 0 scrollbar) */}
                                <div id="category-dropdown-wrapper" className="opacity-0 pointer-events-none translate-y-2 absolute left-0 top-full pt-2.5 z-50 transition-all duration-200">
                                    <div className="w-[460px] sm:w-[500px] bg-[#FFFEFA] dark:bg-[#181916] rounded-2xl shadow-2xl border border-[#E6E1D8] dark:border-[#2C2E29] p-3 font-nunito overflow-hidden">
                                        <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#85817A] dark:text-[#96938B] px-2.5 py-1.5 border-b border-[#E6E1D8]/60 dark:border-[#2C2E29] mb-2 flex items-center justify-between">
                                            <span className="flex items-center gap-1.5"><i className="ph-bold ph-books text-wine dark:text-gold"></i> Tuyển Tập Tri Thức</span>
                                            <span className="text-[9px] font-bold text-wine dark:text-gold">10 Chủ Đề</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-1.5">
                                            <a href="category_end.html?category=trending" onClick={(event) => { window.handleCategoryNav(event, 'trending') }} className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-[#242321] dark:text-[#EDE9DF] hover:bg-[#FAF8F5] dark:hover:bg-[#20221E] hover:text-[#8B4A3C] dark:hover:text-[#D4AF37] transition-colors group/item">
                                                <i className="ph-bold ph-trend-up text-[#85817A] group-hover/item:text-[#8B4A3C] dark:group-hover/item:text-[#D4AF37] transition-colors text-sm shrink-0"></i>
                                                <span className="truncate">Sách Thịnh Hành</span>
                                            </a>
                                            <a href="category_end.html?category=business" onClick={(event) => { window.handleCategoryNav(event, 'business') }} className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-[#242321] dark:text-[#EDE9DF] hover:bg-[#FAF8F5] dark:hover:bg-[#20221E] hover:text-[#8B4A3C] dark:hover:text-[#D4AF37] transition-colors group/item">
                                                <i className="ph-bold ph-chart-line text-[#85817A] group-hover/item:text-[#8B4A3C] dark:group-hover/item:text-[#D4AF37] transition-colors text-sm shrink-0"></i>
                                                <span className="truncate">Kinh Tế & Quản Trị</span>
                                            </a>
                                            <a href="category_end.html?category=children" onClick={(event) => { window.handleCategoryNav(event, 'children') }} className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-[#242321] dark:text-[#EDE9DF] hover:bg-[#FAF8F5] dark:hover:bg-[#20221E] hover:text-[#8B4A3C] dark:hover:text-[#D4AF37] transition-colors group/item">
                                                <i className="ph-bold ph-sparkle text-[#85817A] group-hover/item:text-[#8B4A3C] dark:group-hover/item:text-[#D4AF37] transition-colors text-sm shrink-0"></i>
                                                <span className="truncate">Thế Giới Tuổi Thơ</span>
                                            </a>
                                            <a href="category_end.html?category=history" onClick={(event) => { window.handleCategoryNav(event, 'history') }} className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-[#242321] dark:text-[#EDE9DF] hover:bg-[#FAF8F5] dark:hover:bg-[#20221E] hover:text-[#8B4A3C] dark:hover:text-[#D4AF37] transition-colors group/item">
                                                <i className="ph-bold ph-hourglass-high text-[#85817A] group-hover/item:text-[#8B4A3C] dark:group-hover/item:text-[#D4AF37] transition-colors text-sm shrink-0"></i>
                                                <span className="truncate">Lịch Sử & Xã Hội</span>
                                            </a>
                                            <a href="category_end.html?category=literature" onClick={(event) => { window.handleCategoryNav(event, 'literature') }} className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-[#242321] dark:text-[#EDE9DF] hover:bg-[#FAF8F5] dark:hover:bg-[#20221E] hover:text-[#8B4A3C] dark:hover:text-[#D4AF37] transition-colors group/item">
                                                <i className="ph-bold ph-book-open text-[#85817A] group-hover/item:text-[#8B4A3C] dark:group-hover/item:text-[#D4AF37] transition-colors text-sm shrink-0"></i>
                                                <span className="truncate">Văn Học & Nghệ Thuật</span>
                                            </a>
                                            <a href="category_end.html?category=philosophy" onClick={(event) => { window.handleCategoryNav(event, 'philosophy') }} className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-[#242321] dark:text-[#EDE9DF] hover:bg-[#FAF8F5] dark:hover:bg-[#20221E] hover:text-[#8B4A3C] dark:hover:text-[#D4AF37] transition-colors group/item">
                                                <i className="ph-bold ph-brain text-[#85817A] group-hover/item:text-[#8B4A3C] dark:group-hover/item:text-[#D4AF37] transition-colors text-sm shrink-0"></i>
                                                <span className="truncate">Triết Học & Tư Tưởng</span>
                                            </a>
                                            <a href="category_end.html?category=selfgrowth" onClick={(event) => { window.handleCategoryNav(event, 'selfgrowth') }} className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-[#242321] dark:text-[#EDE9DF] hover:bg-[#FAF8F5] dark:hover:bg-[#20221E] hover:text-[#8B4A3C] dark:hover:text-[#D4AF37] transition-colors group/item">
                                                <i className="ph-bold ph-compass text-[#85817A] group-hover/item:text-[#8B4A3C] dark:group-hover/item:text-[#D4AF37] transition-colors text-sm shrink-0"></i>
                                                <span className="truncate">Phát Triển Bản Thân</span>
                                            </a>
                                            <a href="category_end.html?category=artlifestyle" onClick={(event) => { window.handleCategoryNav(event, 'artlifestyle') }} className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-[#242321] dark:text-[#EDE9DF] hover:bg-[#FAF8F5] dark:hover:bg-[#20221E] hover:text-[#8B4A3C] dark:hover:text-[#D4AF37] transition-colors group/item">
                                                <i className="ph-bold ph-palette text-[#85817A] group-hover/item:text-[#8B4A3C] dark:group-hover/item:text-[#D4AF37] transition-colors text-sm shrink-0"></i>
                                                <span className="truncate">Nghệ Thuật & Phong Cách Sống</span>
                                            </a>
                                            <a href="category_end.html?category=science" onClick={(event) => { window.handleCategoryNav(event, 'science') }} className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-[#242321] dark:text-[#EDE9DF] hover:bg-[#FAF8F5] dark:hover:bg-[#20221E] hover:text-[#8B4A3C] dark:hover:text-[#D4AF37] transition-colors group/item">
                                                <i className="ph-bold ph-atom text-[#85817A] group-hover/item:text-[#8B4A3C] dark:group-hover/item:text-[#D4AF37] transition-colors text-sm shrink-0"></i>
                                                <span className="truncate">Khoa Học & Công Nghệ</span>
                                            </a>
                                            <a href="category_end.html?category=biography" onClick={(event) => { window.handleCategoryNav(event, 'biography') }} className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-[#242321] dark:text-[#EDE9DF] hover:bg-[#FAF8F5] dark:hover:bg-[#20221E] hover:text-[#8B4A3C] dark:hover:text-[#D4AF37] transition-colors group/item">
                                                <i className="ph-bold ph-user-focus text-[#85817A] group-hover/item:text-[#8B4A3C] dark:group-hover/item:text-[#D4AF37] transition-colors text-sm shrink-0"></i>
                                                <span className="truncate">Tiểu Sử & Hồi Ký</span>
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Ô Tìm Kiếm Sách */}
                            <div className="w-full max-w-md lg:max-w-lg xl:max-w-xl relative">
                                <div className="relative flex items-center w-full">
                                    <i className="ph-bold ph-magnifying-glass absolute left-3.5 text-[#8B4A3C] dark:text-[#E5A93C] text-sm pointer-events-none"></i>
                                    <input type="text" id="header-search-input" placeholder="Tìm tác phẩm, tác giả hoặc chủ đề..." onInput={(event) => { if (typeof handleSearch === 'function') { window.handleSearch(event.currentTarget.value); } else if (window.handleGlobalHeaderSearch) { window.handleGlobalHeaderSearch(event.currentTarget.value); } }} className="w-full pl-9 pr-10 py-1.5 sm:py-2 rounded-full border border-[#D4AF37] dark:border-[#E5A93C] bg-[#FAF8F5]/90 dark:bg-[#181916]/90 focus:outline-none focus:border-[#8B4A3C] dark:focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/50 text-[#242321] dark:text-[#EDE9DF] placeholder-[#85817A] transition-all font-medium text-xs shadow-sm" autoComplete="off" />
                                    <button type="button" id="clear-search-btn" className="hidden absolute right-3 text-[#85817A] hover:text-[#8B4A3C] dark:hover:text-[#E5A93C]" onClick={(event) => { if (typeof clearSearch === 'function') { window.clearSearch(); } else if (window.clearGlobalHeaderSearch) { window.clearGlobalHeaderSearch(); } }}>
                                        <i className="ph-bold ph-x text-xs"></i>
                                    </button>
                                </div>
                                {/* Live Search Popup */}
                                <div id="header-search-results" className="hidden absolute top-full mt-2 inset-x-0 bg-[#FFFEFA] dark:bg-[#181916] rounded-2xl shadow-2xl border border-[#E6E1D8] dark:border-[#2C2E29] p-2.5 z-50 max-h-80 overflow-y-auto font-nunito"></div>
                            </div>
                        </div>

                        {/* 3. Khu Vực Phải: Hành Động & Tài Khoản */}
                        <div className="flex items-center justify-end gap-2.5 sm:gap-3 lg:gap-3.5 shrink-0">

                            {/* Nút Ưu Đãi */}
                            <a href="offers_end.html" id="header-offers-btn" className="flex items-center gap-1.5 py-1.5 px-3 sm:px-3.5 rounded-full border border-[#D4AF37] dark:border-[#E5A93C] text-[#8B4A3C] dark:text-[#E5A93C] bg-[#D4AF37]/15 dark:bg-[#E5A93C]/10 hover:bg-[#D4AF37]/25 dark:hover:bg-[#E5A93C]/20 transition-all group shrink-0 shadow-sm" title="Ưu đãi độc quyền" aria-label="Ưu đãi">
                                <i className="ph-bold ph-crown text-[16px] text-[#8B4A3C] dark:text-[#E5A93C] group-hover:scale-110 transition-transform"></i>
                                <span className="text-[13px] sm:text-[14px] font-bold tracking-wide">Ưu Đãi</span>
                                <span className="text-[8px] font-extrabold bg-[#8B4A3C] text-white px-1.5 py-0.5 rounded-full tracking-wider leading-none shadow-sm ml-0.5">HOT</span>
                            </a>

                            {/* Nút Tải Lên / Upload File (CHỈ ICON, KHÔNG CHỮ TẢI LÊN) */}
                            <a href="upload_end.html" id="header-upload-btn" className="flex items-center justify-center w-9 h-9 rounded-full border border-[#D4AF37] dark:border-[#E5A93C] text-[#8B4A3C] dark:text-[#E5A93C] bg-[#D4AF37]/15 dark:bg-[#E5A93C]/10 hover:bg-[#D4AF37]/25 dark:hover:bg-[#E5A93C]/20 transition-all shrink-0 shadow-sm group cursor-pointer" title="Tải lên tài liệu & Không gian đọc cá nhân" aria-label="Tải lên tài liệu">
                                <i className="ph-bold ph-cloud-arrow-up text-[18px] text-[#8B4A3C] dark:text-[#E5A93C] group-hover:scale-110 transition-transform"></i>
                            </a>

                            {/* Giỏ Hàng */}
                            <a href="cart_end.html" className="flex items-center justify-center w-9 h-9 rounded-full border border-[#D4AF37] dark:border-[#E5A93C] text-[#8B4A3C] dark:text-[#E5A93C] bg-[#D4AF37]/15 dark:bg-[#E5A93C]/10 hover:bg-[#D4AF37]/25 dark:hover:bg-[#E5A93C]/20 transition-all shrink-0 shadow-sm group relative" title="Giỏ Hàng" aria-label="Giỏ Hàng">
                                <i className="ph-bold ph-shopping-cart text-[18px] text-[#8B4A3C] dark:text-[#E5A93C] group-hover:scale-110 transition-transform"></i>
                                <span id="cart-badge-count" className="absolute -top-1 -right-1 w-4 h-4 bg-[#8B4A3C] text-white font-bold text-[9px] rounded-full flex items-center justify-center leading-none shadow-sm">1</span>
                            </a>

                            {/* Đổi Giao Diện Sáng / Tối */}
                            <button id="theme-toggle" type="button" className="flex items-center justify-center w-9 h-9 rounded-full border border-[#D4AF37] dark:border-[#E5A93C] text-[#8B4A3C] dark:text-[#E5A93C] bg-[#D4AF37]/15 dark:bg-[#E5A93C]/10 hover:bg-[#D4AF37]/25 dark:hover:bg-[#E5A93C]/20 transition-all shrink-0 shadow-sm group cursor-pointer" title="Đổi giao diện Sáng / Tối" aria-label="Đổi giao diện Sáng / Tối">
                                <i id="theme-icon" className="ph-bold ph-moon text-[18px] text-[#8B4A3C] dark:text-[#E5A93C] group-hover:scale-110 transition-transform"></i>
                            </button>

                            {/* Avatar Menu Dropdown */}
                            <div className="relative shrink-0" id="avatar-menu-wrapper">
                                <button id="avatar-menu-btn" type="button" onClick={(event) => { window.toggleAvatarMenu(event); }} className="flex items-center gap-1.5 p-0.5 rounded-full hover:ring-2 hover:ring-[#D4AF37] dark:hover:ring-[#E5A93C] transition-all focus:outline-none cursor-pointer" aria-haspopup="true" aria-expanded="false" title="Tài khoản & Thiết lập">
                                    <div className="relative w-9 h-9 rounded-full overflow-hidden border border-[#D4AF37] dark:border-[#E5A93C] bg-[#EAE5D9]">
                                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=HalmReader" alt="Avatar" className="w-full h-full object-cover" />
                                        <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-[#8B4A3C] rounded-full border border-[#F7F5F0] dark:border-[#111210]"></span>
                                    </div>
                                    <i className="ph-bold ph-caret-down text-xs text-[#8B4A3C] dark:text-[#E5A93C] transition-transform duration-200" id="avatar-caret-icon"></i>
                                </button>

                                {/* Avatar Dropdown Menu */}
                                <div id="avatar-dropdown" className="hidden absolute right-0 top-full mt-2 w-64 bg-[#FFFEFA] dark:bg-[#181916] rounded-2xl shadow-2xl border border-[#E6E1D8] dark:border-[#2C2E29] p-2 z-50 transition-all font-nunito">
                                    <div className="p-3 border-b border-[#E6E1D8]/60 dark:border-[#2C2E29]">
                                        <p className="font-bold text-sm text-[#242321] dark:text-[#EDE9DF]">Độc Giả Tinh Hoa</p>
                                        <p className="text-xs text-[#85817A] dark:text-[#96938B]">docgia@halmbook.vn</p>
                                        <span className="inline-block mt-1.5 px-2 py-0.5 text-[10px] font-bold text-[#8B4A3C] dark:text-[#D4AF37] bg-[#8B4A3C]/10 dark:bg-[#D4AF37]/15 rounded-full">Hội viên Lão Nông</span>
                                    </div>
                                    <div className="py-1">
                                        <a href="profile_end.html" className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#242321] dark:text-[#EDE9DF] hover:bg-[#FAF8F5] dark:hover:bg-[#20221E] hover:text-[#8B4A3C] dark:hover:text-[#D4AF37] transition-colors">
                                            <i className="ph-bold ph-user text-base text-[#85817A]"></i>
                                            <span>Hồ sơ cá nhân</span>
                                        </a>
                                        <a href="my-books_end.html" className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#242321] dark:text-[#EDE9DF] hover:bg-[#FAF8F5] dark:hover:bg-[#20221E] hover:text-[#8B4A3C] dark:hover:text-[#D4AF37] transition-colors">
                                            <i className="ph-bold ph-books text-base text-[#85817A]"></i>
                                            <span>Tủ sách của tôi</span>
                                        </a>
                                        <a href="upload_end.html" className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#242321] dark:text-[#EDE9DF] hover:bg-[#FAF8F5] dark:hover:bg-[#20221E] hover:text-[#8B4A3C] dark:hover:text-[#D4AF37] transition-colors">
                                            <i className="ph-bold ph-file-text text-base text-[#85817A]"></i>
                                            <span>Tệp cá nhân tải lên</span>
                                        </a>
                                        <a href="javascript:void(0)" onClick={(event) => { if (window.openNotificationModal) window.window.openNotificationModal(); else if (window.toggleNotificationModal) window.window.toggleNotificationModal(); else window.location.href = 'notification.html'; }} className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-[#242321] dark:text-[#EDE9DF] hover:bg-[#FAF8F5] dark:hover:bg-[#20221E] hover:text-[#8B4A3C] dark:hover:text-[#D4AF37] transition-colors">
                                            <div className="flex items-center gap-2.5">
                                                <i className="ph-bold ph-bell text-base text-[#85817A]"></i>
                                                <span>Thông Báo</span>
                                            </div>
                                            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-[#8B4A3C] dark:bg-[#D4AF37] text-white dark:text-[#111210] rounded-full">2 mới</span>
                                        </a>
                                        <a href="change_profile_end.html" className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#242321] dark:text-[#EDE9DF] hover:bg-[#FAF8F5] dark:hover:bg-[#20221E] hover:text-[#8B4A3C] dark:hover:text-[#D4AF37] transition-colors">
                                            <i className="ph-bold ph-gear text-base text-[#85817A]"></i>
                                            <span>Cài đặt & Tùy chọn</span>
                                        </a>
                                    </div>
                                    <div className="pt-1 border-t border-[#E6E1D8]/60 dark:border-[#2C2E29]">
                                        <a href="login.html" className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
                                            <i className="ph-bold ph-sign-out text-base"></i>
                                            <span>Đăng xuất</span>
                                        </a>
                                    </div>
                                </div>
                            </div>

                            {/* Nút Mobile Menu */}
                            <button id="mobile-menu-btn" type="button" onClick={(event) => { window.toggleMobileMenu(); }} className="lg:hidden p-2 rounded-full border border-[#D4AF37] dark:border-[#E5A93C] text-[#8B4A3C] dark:text-[#E5A93C] bg-[#D4AF37]/15 dark:bg-[#E5A93C]/10 hover:bg-[#D4AF37]/25 dark:hover:bg-[#E5A93C]/20 transition-all shrink-0 cursor-pointer" aria-label="Mở Menu">
                                <i className="ph-bold ph-list text-xl"></i>
                            </button>
                        </div>
                    </div>

                    {/* Mobile Drawer Menu */}
                    <div id="mobile-drawer" className="hidden lg:hidden px-5 py-4 bg-[#FAF8F5] dark:bg-[#111210] border-b border-[#E3DDD0] dark:border-[#2C2E29] space-y-3 font-nunito">
                        <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#85817A] dark:text-[#96938B] px-1">Danh Mục Sách</div>
                        <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                            <a href="category_end.html?category=trending" onClick={(event) => { window.handleCategoryNav(event, 'trending') }} className="p-2 rounded-lg bg-[#FFFEFA] dark:bg-[#181916] border border-[#E6E1D8] dark:border-[#2C2E29] text-ink dark:text-night-text flex items-center gap-2">
                                <i className="ph-bold ph-trend-up text-wine dark:text-gold"></i> Thịnh Hành
                            </a>
                            <a href="category_end.html?category=business" onClick={(event) => { window.handleCategoryNav(event, 'business') }} className="p-2 rounded-lg bg-[#FFFEFA] dark:bg-[#181916] border border-[#E6E1D8] dark:border-[#2C2E29] text-ink dark:text-night-text flex items-center gap-2">
                                <i className="ph-bold ph-chart-line text-wine dark:text-gold"></i> Kinh Tế
                            </a>
                            <a href="category_end.html?category=children" onClick={(event) => { window.handleCategoryNav(event, 'children') }} className="p-2 rounded-lg bg-[#FFFEFA] dark:bg-[#181916] border border-[#E6E1D8] dark:border-[#2C2E29] text-ink dark:text-night-text flex items-center gap-2">
                                <i className="ph-bold ph-sparkle text-wine dark:text-gold"></i> Tuổi Thơ
                            </a>
                            <a href="category_end.html?category=history" onClick={(event) => { window.handleCategoryNav(event, 'history') }} className="p-2 rounded-lg bg-[#FFFEFA] dark:bg-[#181916] border border-[#E6E1D8] dark:border-[#2C2E29] text-ink dark:text-night-text flex items-center gap-2">
                                <i className="ph-bold ph-hourglass-high text-wine dark:text-gold"></i> Lịch Sử
                            </a>
                            <a href="category_end.html?category=literature" onClick={(event) => { window.handleCategoryNav(event, 'literature') }} className="p-2 rounded-lg bg-[#FFFEFA] dark:bg-[#181916] border border-[#E6E1D8] dark:border-[#2C2E29] text-ink dark:text-night-text flex items-center gap-2">
                                <i className="ph-bold ph-book-open text-wine dark:text-gold"></i> Văn Học
                            </a>
                            <a href="category_end.html?category=philosophy" onClick={(event) => { window.handleCategoryNav(event, 'philosophy') }} className="p-2 rounded-lg bg-[#FFFEFA] dark:bg-[#181916] border border-[#E6E1D8] dark:border-[#2C2E29] text-ink dark:text-night-text flex items-center gap-2">
                                <i className="ph-bold ph-brain text-wine dark:text-gold"></i> Triết Học
                            </a>
                            <a href="category_end.html?category=selfgrowth" onClick={(event) => { window.handleCategoryNav(event, 'selfgrowth') }} className="p-2 rounded-lg bg-[#FFFEFA] dark:bg-[#181916] border border-[#E6E1D8] dark:border-[#2C2E29] text-ink dark:text-night-text flex items-center gap-2">
                                <i className="ph-bold ph-compass text-wine dark:text-gold"></i> Phát Triển
                            </a>
                            <a href="category_end.html?category=artlifestyle" onClick={(event) => { window.handleCategoryNav(event, 'artlifestyle') }} className="p-2 rounded-lg bg-[#FFFEFA] dark:bg-[#181916] border border-[#E6E1D8] dark:border-[#2C2E29] text-ink dark:text-night-text flex items-center gap-2">
                                <i className="ph-bold ph-palette text-wine dark:text-gold"></i> Nghệ Thuật
                            </a>
                            <a href="category_end.html?category=science" onClick={(event) => { window.handleCategoryNav(event, 'science') }} className="p-2 rounded-lg bg-[#FFFEFA] dark:bg-[#181916] border border-[#E6E1D8] dark:border-[#2C2E29] text-ink dark:text-night-text flex items-center gap-2">
                                <i className="ph-bold ph-atom text-wine dark:text-gold"></i> Khoa Học
                            </a>
                            <a href="category_end.html?category=biography" onClick={(event) => { window.handleCategoryNav(event, 'biography') }} className="p-2 rounded-lg bg-[#FFFEFA] dark:bg-[#181916] border border-[#E6E1D8] dark:border-[#2C2E29] text-ink dark:text-night-text flex items-center gap-2">
                                <i className="ph-bold ph-user-focus text-wine dark:text-gold"></i> Tiểu Sử
                            </a>
                        </div>
                        <div className="pt-2 border-t border-[#E3DDD0] dark:border-[#2C2E29] flex flex-col gap-2 font-bold text-xs uppercase tracking-wider">
                            <a href="offers_end.html" className="py-2 text-ink dark:text-night-text hover:text-wine flex items-center gap-2"><i className="ph-bold ph-crown text-wine"></i> Ưu Đãi Độc Quyền</a>
                            <a href="upload_end.html" className="py-2 text-ink dark:text-night-text hover:text-wine flex items-center gap-2"><i className="ph-bold ph-cloud-arrow-up text-wine"></i> Tải Lên Tệp Riêng Tư</a>
                            <a href="cart_end.html" className="py-2 text-ink dark:text-night-text hover:text-wine flex items-center gap-2"><i className="ph-bold ph-shopping-cart text-wine"></i> Giỏ Hàng</a>
                            <a href="tiers_end.html" className="py-2 text-ink dark:text-night-text hover:text-wine flex items-center gap-2"><i className="ph-bold ph-medal text-wine"></i> Gói Hội Viên</a>
                            <button type="button" onClick={(event) => { if (window.openChatbot) window.window.openChatbot('Xin chào Trợ lý HALM BOOK!'); }} className="py-2 text-wine dark:text-gold flex items-center gap-2 text-left font-bold cursor-pointer"><i className="ph-bold ph-sparkle"></i> Trợ Lý Robot Khoai Tây AI</button>
                            <a href="profile_end.html" className="py-2 text-ink dark:text-night-text hover:text-wine flex items-center gap-2"><i className="ph-bold ph-user text-wine"></i> Tài Khoản Cá Nhân</a>
                        </div>
                    </div>
                </header>


                {/* ========================================================
                 HERO SECTION: ELEGANT EDITORIAL HEADER (THEME TRANG CHỦ)
                 ======================================================== */}
                <section className="pt-24 pb-8 sm:pt-28 sm:pb-10 relative overflow-hidden">
                    {/* Ambient Luminous Glow Background */}
                    <div className="absolute inset-0 pointer-events-none -z-10">
                        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-r from-wine/10 via-gold/10 to-wine/5 blur-3xl rounded-full"></div>
                    </div>

                    <div className="w-full max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">

                        {/* Category Badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-paper-surface dark:bg-night-card border border-wine/20 dark:border-gold/30 shadow-sm text-xs font-metadata-spec font-bold text-wine dark:text-gold uppercase tracking-widest mb-3">
                            <i className="ph-bold ph-sparkle text-gold"></i>
                            Đặc Quyền Độc Giả HALM BOOK
                            <i className="ph-bold ph-sparkle text-gold"></i>
                        </div>

                        {/* Grand Editorial Heading */}
                        <h1 className="font-display font-black text-3xl sm:text-5xl lg:text-6xl text-ink dark:text-night-text tracking-tight leading-[1.15] mb-3 max-w-4xl mx-auto">
                            Ngập Tràn Ưu Đãi — Tiêu <span className="text-wine dark:text-gold relative inline-block">Khoai Thả Ga</span>
                        </h1>

                        {/* Subtitle */}
                        <p className="font-editorial-body text-base sm:text-lg text-ink-muted dark:text-night-muted max-w-2xl mx-auto leading-relaxed mb-5">
                            Mở khóa vô vàn đặc quyền hấp dẫn chỉ dành riêng cho độc giả của HALM BOOK. Nâng cấp trải nghiệm đọc, tích lũy tri thức và tối ưu hóa chi phí cùng khoai thưởng.
                        </p>

                        {/* Quick Stats Highlight Bar */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-6">
                            <div className="py-2.5 px-3 rounded-xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border shadow-sm flex flex-col items-center text-center">
                                <span className="font-metadata-spec text-2xl font-black text-wine dark:text-gold mb-1">-50%</span>
                                <span className="font-metadata-spec text-xs font-semibold text-ink-muted dark:text-night-muted">Gói Cước VIP 1 Năm</span>
                            </div>
                            <div className="py-2.5 px-3 rounded-xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border shadow-sm flex flex-col items-center text-center">
                                <span className="font-metadata-spec text-2xl font-black text-wine dark:text-gold mb-1">FREE</span>
                                <span className="font-metadata-spec text-xs font-semibold text-ink-muted dark:text-night-muted">3 Lần Upload Đầu Tiên</span>
                            </div>
                            <div className="py-2.5 px-3 rounded-xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border shadow-sm flex flex-col items-center text-center">
                                <span className="font-metadata-spec text-2xl font-black text-wine dark:text-gold mb-1">-45%</span>
                                <span className="font-metadata-spec text-xs font-semibold text-ink-muted dark:text-night-muted">Combo Kinh Điển</span>
                            </div>
                            <div className="py-2.5 px-3 rounded-xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border shadow-sm flex flex-col items-center text-center">
                                <span className="font-metadata-spec text-2xl font-black text-wine dark:text-gold mb-1">+10 Khoai</span>
                                <span className="font-metadata-spec text-xs font-semibold text-ink-muted dark:text-night-muted">Thưởng Nóng Đọc Sách</span>
                            </div>
                        </div>

                        {/* Quick Navigation Anchor Tabs */}
                        <div className="flex items-center justify-center gap-2 flex-wrap">
                            <a href="#row-subscription" className="px-4 py-2 rounded-full text-xs font-metadata-spec font-bold bg-paper-surface dark:bg-night-card hover:bg-wine hover:text-white dark:hover:bg-gold dark:hover:text-night-bg border border-paper-border dark:border-night-border text-ink dark:text-night-text transition-colors shadow-sm">
                                <i className="ph-bold ph-crown mr-1"></i> Gói Cước
                            </a>
                            <a href="#row-combo" className="px-4 py-2 rounded-full text-xs font-metadata-spec font-bold bg-paper-surface dark:bg-night-card hover:bg-wine hover:text-white dark:hover:bg-gold dark:hover:text-night-bg border border-paper-border dark:border-night-border text-ink dark:text-night-text transition-colors shadow-sm">
                                <i className="ph-bold ph-stack mr-1"></i> Combo Sách Kinh Điển
                            </a>
                            <a href="#row-upload" className="px-4 py-2 rounded-full text-xs font-metadata-spec font-bold bg-paper-surface dark:bg-night-card hover:bg-wine hover:text-white dark:hover:bg-gold dark:hover:text-night-bg border border-paper-border dark:border-night-border text-ink dark:text-night-text transition-colors shadow-sm">
                                <i className="ph-bold ph-cloud-arrow-up mr-1"></i> Tiện Ích Upload
                            </a>
                            <a href="#row-single-books" className="px-4 py-2 rounded-full text-xs font-metadata-spec font-bold bg-paper-surface dark:bg-night-card hover:bg-wine hover:text-white dark:hover:bg-gold dark:hover:text-night-bg border border-paper-border dark:border-night-border text-ink dark:text-night-text transition-colors shadow-sm">
                                <i className="ph-bold ph-book-open mr-1"></i> Sách Lẻ Giảm Sâu
                            </a>
                            <a href="#row-reading-challenge" className="px-4 py-2 rounded-full text-xs font-metadata-spec font-bold bg-paper-surface dark:bg-night-card hover:bg-wine hover:text-white dark:hover:bg-gold dark:hover:text-night-bg border border-paper-border dark:border-night-border text-ink dark:text-night-text transition-colors shadow-sm">
                                <i className="ph-bold ph-medal mr-1"></i> Thử Thách Đọc
                            </a>
                        </div>

                    </div>
                </section>


                {/* ========================================================
                 MAIN CONTENT: 5 DANH MỤC ƯU ĐÃI (LOGIC GIỮ NGUYÊN 100%)
                 ======================================================== */}
                <main className="w-full max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8 space-y-10 sm:space-y-11 pb-12 sm:pb-14 flex-1">

                    {/* ========================================================
                     1. GIẢM GIÁ GÓI CƯỚC ĐẶC QUYỀN
                     ======================================================== */}
                    <section id="row-subscription" className="scroll-mt-28">
                        {/* Row Header */}
                        <div className="flex items-center justify-between pb-3 border-b border-paper-border dark:border-night-border mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-wine/10 dark:bg-gold/15 text-wine dark:text-gold flex items-center justify-center text-xl shrink-0">
                                    <i className="ph-bold ph-crown"></i>
                                </div>
                                <div>
                                    <h2 className="font-display font-black text-xl sm:text-2xl text-ink dark:text-night-text tracking-tight">
                                        Giảm Giá Gói Cước Đặc Quyền
                                    </h2>
                                    <p className="font-editorial-body text-xs sm:text-sm text-ink-muted dark:text-night-muted">
                                        Mở khóa thư viện sách không giới hạn, audiobook AI chất lượng cao và đặc quyền hội viên.
                                    </p>
                                </div>
                            </div>
                            {/* Navigation Buttons */}
                            <div className="flex items-center gap-2">
                                <button type="button" onClick={(event) => { window.scrollRow('cards-row-1', -340) }} className="w-9 h-9 rounded-full bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border text-ink dark:text-night-text hover:bg-wine hover:text-white dark:hover:bg-gold dark:hover:text-night-bg flex items-center justify-center transition-colors shadow-sm" aria-label="Cuộn sang trái">
                                    <i className="ph-bold ph-caret-left text-sm"></i>
                                </button>
                                <button type="button" onClick={(event) => { window.scrollRow('cards-row-1', 340) }} className="w-9 h-9 rounded-full bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border text-ink dark:text-night-text hover:bg-wine hover:text-white dark:hover:bg-gold dark:hover:text-night-bg flex items-center justify-center transition-colors shadow-sm" aria-label="Cuộn sang phải">
                                    <i className="ph-bold ph-caret-right text-sm"></i>
                                </button>
                            </div>
                        </div>

                        {/* Horizontal Cards Scroll Row */}
                        <div id="cards-row-1" className="cards-scroll-container">

                            {/* Card 1.1: Gói Sinh Viên */}
                            <div className="offer-card rounded-2xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between relative group">
                                <div className="space-y-3.5">
                                    {/* Visual Illustration Banner */}
                                    <div className="relative h-28 w-full rounded-xl overflow-hidden bg-paper-200 dark:bg-night-surface shadow-inner">
                                        <img src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=400&auto=format&fit=crop" alt="Gói Sinh Viên" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
                                        <span className="absolute top-2.5 right-2.5 font-metadata-spec text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white shadow-sm">CAMPUS PASS</span>
                                        <div className="absolute bottom-2.5 left-2.5 w-9 h-9 rounded-lg bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white text-xl shadow-md">
                                            <i className="ph-bold ph-graduation-cap"></i>
                                        </div>
                                    </div>

                                    <div>
                                        <span className="font-metadata-spec text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-paper-200 dark:bg-night-border text-ink-muted dark:text-night-muted">Học Đường</span>
                                        <h3 className="font-display font-black text-lg text-ink dark:text-night-text mt-1.5 leading-tight">Gói Sinh Viên</h3>
                                    </div>

                                    {/* Key Privileges Checklist */}
                                    <ul className="space-y-1.5 pt-2 text-xs font-metadata-spec text-ink-muted dark:text-night-muted border-t border-paper-border/60 dark:border-night-border/60">
                                        <li className="flex items-center gap-2">
                                            <i className="ph-bold ph-check-circle text-emerald-600 dark:text-emerald-400 text-sm shrink-0"></i>
                                            <span className="truncate">Mở toàn bộ giáo trình & tài liệu</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <i className="ph-bold ph-check-circle text-emerald-600 dark:text-emerald-400 text-sm shrink-0"></i>
                                            <span className="truncate">Tặng 5 lượt tóm tắt AI mỗi tháng</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <i className="ph-bold ph-check-circle text-emerald-600 dark:text-emerald-400 text-sm shrink-0"></i>
                                            <span className="truncate">Giảm 10% khi thuê sách giấy</span>
                                        </li>
                                    </ul>
                                </div>

                                <div className="pt-3.5 border-t border-paper-border dark:border-night-border mt-3.5">
                                    <div className="flex items-baseline justify-between mb-3.5">
                                        <div className="flex items-baseline gap-1.5">
                                            <span className="font-metadata-spec text-2xl font-black text-ink dark:text-night-text">50</span>
                                            <span className="potato-badge">Khoai <i className="ph-fill ph-coins text-[10px]"></i></span>
                                        </div>
                                        <span className="font-metadata-spec text-xs text-ink-muted dark:text-night-muted">/ tháng</span>
                                    </div>
                                    <button type="button" onClick={(event) => { window.openRedeemModal('Gói Sinh Viên', 50, 'Xác thực thẻ HSSV thành công. Gói sinh viên đã được kích hoạt cho tài khoản!') }} className="w-full py-2.5 rounded-full bg-paper-200 hover:bg-wine hover:text-white dark:bg-night-surface dark:hover:bg-gold dark:hover:text-night-bg font-metadata-spec text-xs font-bold text-ink dark:text-night-text text-center transition-colors shadow-sm">
                                        Xác Thực Ngay
                                    </button>
                                </div>
                            </div>

                            {/* Card 1.2: Gói Premium 1 Tháng */}
                            <div className="offer-card rounded-2xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between relative group">
                                <div className="space-y-3.5">
                                    {/* Visual Illustration Banner */}
                                    <div className="relative h-28 w-full rounded-xl overflow-hidden bg-paper-200 dark:bg-night-surface shadow-inner">
                                        <img src="https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=400&auto=format&fit=crop" alt="Gói Premium 1 Tháng" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
                                        <span className="absolute top-2.5 right-2.5 font-metadata-spec text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-wine text-white shadow-sm">-30%</span>
                                        <div className="absolute bottom-2.5 left-2.5 w-9 h-9 rounded-lg bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white text-xl shadow-md">
                                            <i className="ph-bold ph-sketch-logo"></i>
                                        </div>
                                    </div>

                                    <div>
                                        <span className="font-metadata-spec text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-paper-200 dark:bg-night-border text-wine dark:text-gold">Ưu Đãi Tháng</span>
                                        <h3 className="font-display font-black text-lg text-ink dark:text-night-text mt-1.5 leading-tight">Gói Premium 1 Tháng</h3>
                                    </div>

                                    {/* Key Privileges Checklist */}
                                    <ul className="space-y-1.5 pt-2 text-xs font-metadata-spec text-ink-muted dark:text-night-muted border-t border-paper-border/60 dark:border-night-border/60">
                                        <li className="flex items-center gap-2">
                                            <i className="ph-bold ph-check-circle text-emerald-600 dark:text-emerald-400 text-sm shrink-0"></i>
                                            <span className="truncate">Mở khóa 10.000+ tựa sách bản quyền</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <i className="ph-bold ph-check-circle text-emerald-600 dark:text-emerald-400 text-sm shrink-0"></i>
                                            <span className="truncate">Nghe Audiobook AI giọng đọc tự nhiên</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <i className="ph-bold ph-check-circle text-emerald-600 dark:text-emerald-400 text-sm shrink-0"></i>
                                            <span className="truncate">Tải sách đọc Offline trên mọi thiết bị</span>
                                        </li>
                                    </ul>
                                </div>

                                <div className="pt-3.5 border-t border-paper-border dark:border-night-border mt-3.5">
                                    <div className="flex items-baseline justify-between mb-3.5">
                                        <div className="flex items-baseline gap-2">
                                            <span className="font-metadata-spec text-xs line-through text-ink-muted dark:text-night-muted">150</span>
                                            <span className="font-metadata-spec text-2xl font-black text-wine dark:text-gold">105</span>
                                            <span className="potato-badge">Khoai <i className="ph-fill ph-coins text-[10px]"></i></span>
                                        </div>
                                        <span className="font-metadata-spec text-xs text-ink-muted dark:text-night-muted">/ tháng</span>
                                    </div>
                                    <button type="button" onClick={(event) => { window.openRedeemModal('Gói Premium 1 Tháng', 105, 'Kích hoạt Gói Premium 1 Tháng thành công!') }} className="w-full py-2.5 rounded-full bg-wine hover:bg-wine-dark text-white font-metadata-spec text-xs font-bold text-center transition-colors shadow-sm">
                                        Đổi Khoai Ngay
                                    </button>
                                </div>
                            </div>

                            {/* Card 1.3: Gói Premium 3 Tháng */}
                            <div className="offer-card rounded-2xl bg-paper-surface dark:bg-night-card border-2 border-gold/60 dark:border-gold/60 p-5 shadow-md hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between relative group">
                                <div className="space-y-3.5">
                                    {/* Visual Illustration Banner */}
                                    <div className="relative h-28 w-full rounded-xl overflow-hidden bg-paper-200 dark:bg-night-surface shadow-inner">
                                        <img src="https://images.unsplash.com/photo-1457369804613-52c61a468e7d?q=80&w=400&auto=format&fit=crop" alt="Gói Premium 3 Tháng" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
                                        <span className="absolute top-2.5 right-2.5 font-metadata-spec text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-gold text-night-bg shadow-sm">-40% POPULAR</span>
                                        <div className="absolute bottom-2.5 left-2.5 w-9 h-9 rounded-lg bg-gold/30 backdrop-blur-md border border-gold/50 flex items-center justify-center text-gold text-xl shadow-md">
                                            <i className="ph-bold ph-diamond"></i>
                                        </div>
                                    </div>

                                    <div>
                                        <span className="font-metadata-spec text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-gold/20 text-gold">Tiết Kiệm Nhất</span>
                                        <h3 className="font-display font-black text-lg text-ink dark:text-night-text mt-1.5 leading-tight">Gói Premium 3 Tháng</h3>
                                    </div>

                                    {/* Key Privileges Checklist */}
                                    <ul className="space-y-1.5 pt-2 text-xs font-metadata-spec text-ink-muted dark:text-night-muted border-t border-paper-border/60 dark:border-night-border/60">
                                        <li className="flex items-center gap-2">
                                            <i className="ph-bold ph-check-circle text-emerald-600 dark:text-emerald-400 text-sm shrink-0"></i>
                                            <span className="truncate">Bao gồm toàn bộ quyền lợi Premium</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <i className="ph-bold ph-check-circle text-emerald-600 dark:text-emerald-400 text-sm shrink-0"></i>
                                            <span className="truncate">Tặng 30 Khoai thưởng vào ví</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <i className="ph-bold ph-check-circle text-emerald-600 dark:text-emerald-400 text-sm shrink-0"></i>
                                            <span className="truncate">Tiết kiệm 40% so với gia hạn tháng</span>
                                        </li>
                                    </ul>
                                </div>

                                <div className="pt-3.5 border-t border-paper-border dark:border-night-border mt-3.5">
                                    <div className="flex items-baseline justify-between mb-3.5">
                                        <div className="flex items-baseline gap-2">
                                            <span className="font-metadata-spec text-xs line-through text-ink-muted dark:text-night-muted">400</span>
                                            <span className="font-metadata-spec text-2xl font-black text-wine dark:text-gold">240</span>
                                            <span className="potato-badge">Khoai <i className="ph-fill ph-coins text-[10px]"></i></span>
                                        </div>
                                        <span className="font-metadata-spec text-xs text-ink-muted dark:text-night-muted">/ 3 tháng</span>
                                    </div>
                                    <button type="button" onClick={(event) => { window.openRedeemModal('Gói Premium 3 Tháng', 240, 'Kích hoạt Gói Premium 3 Tháng thành công!') }} className="w-full py-2.5 rounded-full bg-wine hover:bg-wine-dark text-white font-metadata-spec text-xs font-bold text-center transition-colors shadow-sm">
                                        Đổi Khoai Ngay
                                    </button>
                                </div>
                            </div>

                            {/* Card 1.4: Gói VIP 1 Năm */}
                            <div className="offer-card rounded-2xl bg-paper-surface dark:bg-night-card border-2 border-wine/50 dark:border-gold/50 p-5 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between relative group">
                                <div className="space-y-3.5">
                                    {/* Visual Illustration Banner */}
                                    <div className="relative h-28 w-full rounded-xl overflow-hidden bg-paper-200 dark:bg-night-surface shadow-inner">
                                        <img src="https://images.unsplash.com/photo-1521587760476-6c12a4b040da?q=80&w=400&auto=format&fit=crop" alt="Gói VIP 1 Năm" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
                                        <span className="absolute top-2.5 right-2.5 font-metadata-spec text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-wine text-white shadow-sm">-50% VIP</span>
                                        <div className="absolute bottom-2.5 left-2.5 w-9 h-9 rounded-lg bg-wine/30 backdrop-blur-md border border-wine/50 flex items-center justify-center text-gold text-xl shadow-md">
                                            <i className="ph-bold ph-crown-simple"></i>
                                        </div>
                                    </div>

                                    <div>
                                        <span className="font-metadata-spec text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-paper-200 dark:bg-night-border text-wine dark:text-gold">Đặc Quyền Vàng</span>
                                        <h3 className="font-display font-black text-lg text-ink dark:text-night-text mt-1.5 leading-tight">Gói VIP 1 Năm</h3>
                                    </div>

                                    {/* Key Privileges Checklist */}
                                    <ul className="space-y-1.5 pt-2 text-xs font-metadata-spec text-ink-muted dark:text-night-muted border-t border-paper-border/60 dark:border-night-border/60">
                                        <li className="flex items-center gap-2">
                                            <i className="ph-bold ph-check-circle text-emerald-600 dark:text-emerald-400 text-sm shrink-0"></i>
                                            <span className="truncate">Đọc & nghe sách không giới hạn 365 ngày</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <i className="ph-bold ph-check-circle text-emerald-600 dark:text-emerald-400 text-sm shrink-0"></i>
                                            <span className="truncate">Huy hiệu VIP Hoàng Gia trên trang cá nhân</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <i className="ph-bold ph-check-circle text-emerald-600 dark:text-emerald-400 text-sm shrink-0"></i>
                                            <span className="truncate">Đọc trước tác phẩm mới trước 14 ngày</span>
                                        </li>
                                    </ul>
                                </div>

                                <div className="pt-3.5 border-t border-paper-border dark:border-night-border mt-3.5">
                                    <div className="flex items-baseline justify-between mb-3.5">
                                        <div className="flex items-baseline gap-2">
                                            <span className="font-metadata-spec text-xs line-through text-ink-muted dark:text-night-muted">1500</span>
                                            <span className="font-metadata-spec text-2xl font-black text-wine dark:text-gold">750</span>
                                            <span className="potato-badge">Khoai <i className="ph-fill ph-coins text-[10px]"></i></span>
                                        </div>
                                        <span className="font-metadata-spec text-xs text-ink-muted dark:text-night-muted">/ 12 tháng</span>
                                    </div>
                                    <button type="button" onClick={(event) => { window.openRedeemModal('Gói VIP 1 Năm', 750, 'Kích hoạt Gói VIP 1 Năm & Huy hiệu VIP Hoàng Gia thành công!') }} className="w-full py-2.5 rounded-full bg-wine hover:bg-wine-dark text-white font-metadata-spec text-xs font-bold text-center transition-colors shadow-sm">
                                        Đổi Khoai Ngay
                                    </button>
                                </div>
                            </div>

                        </div>
                    </section>


                    {/* ========================================================
                     2. TIỆN ÍCH UPLOAD DỮ LIỆU
                     ======================================================== */}
                    <section id="row-upload" className="scroll-mt-28">
                        {/* Row Header */}
                        <div className="flex items-center justify-between pb-3 border-b border-paper-border dark:border-night-border mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gold/15 text-gold flex items-center justify-center text-xl shrink-0">
                                    <i className="ph-bold ph-cloud-arrow-up"></i>
                                </div>
                                <div>
                                    <h2 className="font-display font-black text-xl sm:text-2xl text-ink dark:text-night-text tracking-tight">
                                        Tiện Ích Upload Dữ Liệu
                                    </h2>
                                    <p className="font-editorial-body text-xs sm:text-sm text-ink-muted dark:text-night-muted">
                                        Đưa tài liệu, PDF cá nhân lên không gian đọc số và ứng dụng tóm tắt AI chuyên sâu.
                                    </p>
                                </div>
                            </div>
                            {/* Navigation Buttons */}
                            <div className="flex items-center gap-2">
                                <button type="button" onClick={(event) => { window.scrollRow('cards-row-2', -340) }} className="w-9 h-9 rounded-full bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border text-ink dark:text-night-text hover:bg-wine hover:text-white dark:hover:bg-gold dark:hover:text-night-bg flex items-center justify-center transition-colors shadow-sm" aria-label="Cuộn sang trái">
                                    <i className="ph-bold ph-caret-left text-sm"></i>
                                </button>
                                <button type="button" onClick={(event) => { window.scrollRow('cards-row-2', 340) }} className="w-9 h-9 rounded-full bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border text-ink dark:text-night-text hover:bg-wine hover:text-white dark:hover:bg-gold dark:hover:text-night-bg flex items-center justify-center transition-colors shadow-sm" aria-label="Cuộn sang phải">
                                    <i className="ph-bold ph-caret-right text-sm"></i>
                                </button>
                            </div>
                        </div>

                        {/* Horizontal Cards Scroll Row */}
                        <div id="cards-row-2" className="cards-scroll-container">

                            {/* Card 2.1: Free 3 Lần Upload Đầu */}
                            <div className="offer-card rounded-2xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between relative group">
                                <div className="space-y-3.5">
                                    <div className="relative h-28 w-full rounded-xl overflow-hidden bg-paper-200 dark:bg-night-surface shadow-inner">
                                        <img src="https://images.unsplash.com/photo-1586281380349-632531db7ed4?q=80&w=400&auto=format&fit=crop" alt="Free 3 Lần Upload" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
                                        <span className="absolute top-2.5 right-2.5 font-metadata-spec text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white shadow-sm">NEW USER</span>
                                        <div className="absolute bottom-2.5 left-2.5 w-9 h-9 rounded-lg bg-emerald-600/30 backdrop-blur-md border border-emerald-400/50 flex items-center justify-center text-emerald-300 text-xl shadow-md">
                                            <i className="ph-bold ph-file-pdf"></i>
                                        </div>
                                    </div>
                                    <div>
                                        <span className="font-metadata-spec text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-paper-200 dark:bg-night-border text-ink-muted dark:text-night-muted">Người Mới</span>
                                        <h3 className="font-display font-black text-lg text-ink dark:text-night-text mt-1.5 leading-tight">Free 3 Lần Upload Đầu</h3>
                                    </div>
                                    <ul className="space-y-1.5 pt-2 text-xs font-metadata-spec text-ink-muted dark:text-night-muted border-t border-paper-border/60 dark:border-night-border/60">
                                        <li className="flex items-center gap-2">
                                            <i className="ph-bold ph-check-circle text-emerald-600 dark:text-emerald-400 text-sm shrink-0"></i>
                                            <span className="truncate">Tải lên 3 file PDF/EPUB tài liệu cá nhân</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <i className="ph-bold ph-check-circle text-emerald-600 dark:text-emerald-400 text-sm shrink-0"></i>
                                            <span className="truncate">Tóm tắt & trích xuất ý chính bằng AI</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <i className="ph-bold ph-check-circle text-emerald-600 dark:text-emerald-400 text-sm shrink-0"></i>
                                            <span className="truncate">Hỗ trợ dung lượng file tối đa 25MB</span>
                                        </li>
                                    </ul>
                                </div>
                                <div className="pt-3.5 border-t border-paper-border dark:border-night-border mt-3.5">
                                    <div className="flex items-baseline justify-between mb-3.5">
                                        <div className="flex items-baseline gap-2">
                                            <span className="font-metadata-spec text-xs line-through text-ink-muted dark:text-night-muted">15</span>
                                            <span className="font-metadata-spec text-2xl font-black text-emerald-600 dark:text-emerald-400">0</span>
                                            <span className="potato-badge">Khoai <i className="ph-fill ph-coins text-[10px]"></i></span>
                                        </div>
                                        <span className="font-metadata-spec text-xs font-bold text-emerald-600 dark:text-emerald-400">Miễn Phí</span>
                                    </div>
                                    <button type="button" onClick={(event) => { window.openRedeemModal('Free 3 Lần Upload Đầu', 0, 'Đã kích hoạt 3 lượt upload tài liệu miễn phí!') }} className="w-full py-2.5 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-metadata-spec text-xs font-bold text-center transition-colors shadow-sm">
                                        Sử Dụng Ngay
                                    </button>
                                </div>
                            </div>

                            {/* Card 2.2: Upload 2 lần/ngày */}
                            <div className="offer-card rounded-2xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between relative group">
                                <div className="space-y-3.5">
                                    <div className="relative h-28 w-full rounded-xl overflow-hidden bg-paper-200 dark:bg-night-surface shadow-inner">
                                        <img src="https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=400&auto=format&fit=crop" alt="Upload 2 lần/ngày" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
                                        <span className="absolute top-2.5 right-2.5 font-metadata-spec text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-wine text-white shadow-sm">HOT DEAL</span>
                                        <div className="absolute bottom-2.5 left-2.5 w-9 h-9 rounded-lg bg-wine/30 backdrop-blur-md border border-wine/50 flex items-center justify-center text-white text-xl shadow-md">
                                            <i className="ph-bold ph-lightning"></i>
                                        </div>
                                    </div>
                                    <div>
                                        <span className="font-metadata-spec text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-paper-200 dark:bg-night-border text-ink-muted dark:text-night-muted">Gói Ngày</span>
                                        <h3 className="font-display font-black text-lg text-ink dark:text-night-text mt-1.5 leading-tight">Upload 2 Lần / Ngày</h3>
                                    </div>
                                    <ul className="space-y-1.5 pt-2 text-xs font-metadata-spec text-ink-muted dark:text-night-muted border-t border-paper-border/60 dark:border-night-border/60">
                                        <li className="flex items-center gap-2">
                                            <i className="ph-bold ph-check-circle text-emerald-600 dark:text-emerald-400 text-sm shrink-0"></i>
                                            <span className="truncate">Linh hoạt theo nhu cầu tra cứu bài vở</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <i className="ph-bold ph-check-circle text-emerald-600 dark:text-emerald-400 text-sm shrink-0"></i>
                                            <span className="truncate">Trích xuất bảng biểu & đồ thị thông minh</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <i className="ph-bold ph-check-circle text-emerald-600 dark:text-emerald-400 text-sm shrink-0"></i>
                                            <span className="truncate">Lưu trữ tài liệu cá nhân trong 30 ngày</span>
                                        </li>
                                    </ul>
                                </div>
                                <div className="pt-3.5 border-t border-paper-border dark:border-night-border mt-3.5">
                                    <div className="flex items-baseline justify-between mb-3.5">
                                        <div className="flex items-baseline gap-1.5">
                                            <span className="font-metadata-spec text-2xl font-black text-ink dark:text-night-text">10</span>
                                            <span className="potato-badge">Khoai <i className="ph-fill ph-coins text-[10px]"></i></span>
                                        </div>
                                        <span className="font-metadata-spec text-xs text-ink-muted dark:text-night-muted">/ lần</span>
                                    </div>
                                    <button type="button" onClick={(event) => { window.openRedeemModal('Upload 2 lần/ngày', 10, 'Đã đăng ký quyền lợi upload ưu đãi theo ngày!') }} className="w-full py-2.5 rounded-full bg-paper-200 hover:bg-wine hover:text-white dark:bg-night-surface dark:hover:bg-gold dark:hover:text-night-bg font-metadata-spec text-xs font-bold text-ink dark:text-night-text text-center transition-colors shadow-sm">
                                        Đăng Ký Theo Ngày
                                    </button>
                                </div>
                            </div>

                            {/* Card 2.3: Gói Upload Không Giới Hạn */}
                            <div className="offer-card rounded-2xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between relative group">
                                <div className="space-y-3.5">
                                    <div className="relative h-28 w-full rounded-xl overflow-hidden bg-paper-200 dark:bg-night-surface shadow-inner">
                                        <img src="https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=400&auto=format&fit=crop" alt="Gói Upload Không Giới Hạn" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
                                        <span className="absolute top-2.5 right-2.5 font-metadata-spec text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-gold text-night-bg shadow-sm">UNLIMITED</span>
                                        <div className="absolute bottom-2.5 left-2.5 w-9 h-9 rounded-lg bg-gold/30 backdrop-blur-md border border-gold/50 flex items-center justify-center text-gold text-xl shadow-md">
                                            <i className="ph-bold ph-cloud-arrow-up"></i>
                                        </div>
                                    </div>
                                    <div>
                                        <span className="font-metadata-spec text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-gold/20 text-gold">Lưu Trữ Không Giới Hạn</span>
                                        <h3 className="font-display font-black text-lg text-ink dark:text-night-text mt-1.5 leading-tight">Gói Upload Không Giới Hạn</h3>
                                    </div>
                                    <ul className="space-y-1.5 pt-2 text-xs font-metadata-spec text-ink-muted dark:text-night-muted border-t border-paper-border/60 dark:border-night-border/60">
                                        <li className="flex items-center gap-2">
                                            <i className="ph-bold ph-check-circle text-emerald-600 dark:text-emerald-400 text-sm shrink-0"></i>
                                            <span className="truncate">Upload không giới hạn số lượng tài liệu</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <i className="ph-bold ph-check-circle text-emerald-600 dark:text-emerald-400 text-sm shrink-0"></i>
                                            <span className="truncate">Dung lượng tới 100MB cho mỗi file</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <i className="ph-bold ph-check-circle text-emerald-600 dark:text-emerald-400 text-sm shrink-0"></i>
                                            <span className="truncate">Hỏi đáp AI theo ngữ cảnh tài liệu</span>
                                        </li>
                                    </ul>
                                </div>
                                <div className="pt-3.5 border-t border-paper-border dark:border-night-border mt-3.5">
                                    <div className="flex items-baseline justify-between mb-3.5">
                                        <div className="flex items-baseline gap-1.5">
                                            <span className="font-metadata-spec text-2xl font-black text-wine dark:text-gold">30</span>
                                            <span className="potato-badge">Khoai <i className="ph-fill ph-coins text-[10px]"></i></span>
                                        </div>
                                        <span className="font-metadata-spec text-xs text-ink-muted dark:text-night-muted">/ tháng</span>
                                    </div>
                                    <button type="button" onClick={(event) => { window.openRedeemModal('Gói Upload Không Giới Hạn', 30, 'Kích hoạt Gói Upload Không Giới Hạn thành công!') }} className="w-full py-2.5 rounded-full bg-wine hover:bg-wine-dark text-white font-metadata-spec text-xs font-bold text-center transition-colors shadow-sm">
                                        Nâng Cấp Gói
                                    </button>
                                </div>
                            </div>

                            {/* Card 2.4: Gói AI Scholar Chuyên Sâu */}
                            <div className="offer-card rounded-2xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between relative group">
                                <div className="space-y-3.5">
                                    <div className="relative h-28 w-full rounded-xl overflow-hidden bg-paper-200 dark:bg-night-surface shadow-inner">
                                        <img src="https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=400&auto=format&fit=crop" alt="Gói AI Scholar Chuyên Sâu" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
                                        <span className="absolute top-2.5 right-2.5 font-metadata-spec text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-600 text-white shadow-sm">-35% PRO</span>
                                        <div className="absolute bottom-2.5 left-2.5 w-9 h-9 rounded-lg bg-purple-600/30 backdrop-blur-md border border-purple-400/50 flex items-center justify-center text-purple-300 text-xl shadow-md">
                                            <i className="ph-bold ph-brain"></i>
                                        </div>
                                    </div>
                                    <div>
                                        <span className="font-metadata-spec text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-paper-200 dark:bg-night-border text-wine dark:text-gold">Nghiên Cứu & Đồ Án</span>
                                        <h3 className="font-display font-black text-lg text-ink dark:text-night-text mt-1.5 leading-tight">Gói AI Scholar Chuyên Sâu</h3>
                                    </div>
                                    <ul className="space-y-1.5 pt-2 text-xs font-metadata-spec text-ink-muted dark:text-night-muted border-t border-paper-border/60 dark:border-night-border/60">
                                        <li className="flex items-center gap-2">
                                            <i className="ph-bold ph-check-circle text-emerald-600 dark:text-emerald-400 text-sm shrink-0"></i>
                                            <span className="truncate">Phân tích luận văn chuẩn học thuật APA</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <i className="ph-bold ph-check-circle text-emerald-600 dark:text-emerald-400 text-sm shrink-0"></i>
                                            <span className="truncate">Dịch thuật học thuật song ngữ Anh - Việt</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <i className="ph-bold ph-check-circle text-emerald-600 dark:text-emerald-400 text-sm shrink-0"></i>
                                            <span className="truncate">Xuất ghi chú & sơ đồ tư duy PDF</span>
                                        </li>
                                    </ul>
                                </div>
                                <div className="pt-3.5 border-t border-paper-border dark:border-night-border mt-3.5">
                                    <div className="flex items-baseline justify-between mb-3.5">
                                        <div className="flex items-baseline gap-2">
                                            <span className="font-metadata-spec text-xs line-through text-ink-muted dark:text-night-muted">85</span>
                                            <span className="font-metadata-spec text-2xl font-black text-wine dark:text-gold">55</span>
                                            <span className="potato-badge">Khoai <i className="ph-fill ph-coins text-[10px]"></i></span>
                                        </div>
                                        <span className="font-metadata-spec text-xs text-ink-muted dark:text-night-muted">/ gói</span>
                                    </div>
                                    <button type="button" onClick={(event) => { window.openRedeemModal('Gói AI Scholar Chuyên Sâu', 55, 'Kích hoạt Gói AI Scholar Chuyên Sâu thành công!') }} className="w-full py-2.5 rounded-full bg-wine hover:bg-wine-dark text-white font-metadata-spec text-xs font-bold text-center transition-colors shadow-sm">
                                        Đổi Gói Scholar
                                    </button>
                                </div>
                            </div>

                        </div>
                    </section>


                    {/* ========================================================
                     2. BỘ SƯU TẬP COMBO SÁCH KINH ĐIỂN
                     ======================================================== */}
                    <section id="row-combo" className="scroll-mt-28">
                        {/* Row Header */}
                        <div className="flex items-center justify-between pb-3 border-b border-paper-border dark:border-night-border mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-wine/10 dark:bg-gold/15 text-wine dark:text-gold flex items-center justify-center text-xl shrink-0">
                                    <i className="ph-bold ph-stack"></i>
                                </div>
                                <div>
                                    <h2 className="font-display font-black text-xl sm:text-2xl text-ink dark:text-night-text tracking-tight">
                                        Bộ Sưu Tập Combo Sách Kinh Điển
                                    </h2>
                                </div>
                            </div>
                            <div className="text-xs font-metadata-spec text-ink-muted dark:text-night-muted hidden sm:block">
                                Giá được thanh toán bằng Khoai trong ví của bạn.
                            </div>
                        </div>

                        {/* 4 Classic Combo Cards Grid (Harmonized 4-Column Layout Starting from Left) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

                            {/* Combo Card 1: Combo Ký Ức & Hào Khí Dân Tộc */}
                            <div className="rounded-2xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border p-4 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between relative group">
                                <span className="absolute top-3 left-3 z-20 font-metadata-spec text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-600 text-white shadow-sm">-40% GIẢM</span>

                                <div>
                                    {/* Books Visual Showcase Area */}
                                    <div className="w-full bg-[#fbf8f2] dark:bg-night-surface/70 rounded-xl p-3 pt-6 pb-2.5 mb-3 flex items-end justify-center gap-3 sm:gap-3.5 min-h-[145px] border border-paper-border/60 dark:border-night-border/60 relative">
                                        {/* Book 1.1: Điện Biên Phủ */}
                                        <div className="combo-book-item flex flex-col items-center group/book cursor-pointer"
                                            data-title="Điện Biên Phủ — Lịch Sử & Ký Ức"
                                            data-author="Đại tướng Võ Nguyên Giáp / NXB Quân Đội"
                                            data-category="Lịch Sử Quân Sự"
                                            data-rating="★ 5.0"
                                            data-pages="368 trang"
                                            data-price="130 Khoai"
                                            data-cover="testhome/img/dbp.jfif"
                                            data-summary="Tái hiện toàn cảnh chiến dịch Điện Biên Phủ lừng lẫy năm châu, chấn động địa cầu với tư liệu lịch sử vô giá và góc nhìn chiến lược của Đại tướng.">
                                            <div className="book-cover-wrapper w-16 sm:w-20 aspect-[2/3] rounded shadow-md overflow-hidden bg-paper-200 border border-black/10 group-hover/book:shadow-xl transition-shadow">
                                                <img src="testhome/img/dbp.jfif" alt="Điện Biên Phủ" className="w-full h-full object-cover" onError={(event) => { event.currentTarget.src = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=400&q=80' }} />
                                            </div>
                                            <span className="text-[10px] font-bold text-ink dark:text-night-text mt-1.5 truncate max-w-[70px] sm:max-w-[80px] text-center">Điện Biên Phủ</span>
                                        </div>

                                        {/* Book 1.2: Thành Cổ Quảng Trị */}
                                        <div className="combo-book-item flex flex-col items-center group/book -translate-y-1 cursor-pointer"
                                            data-title="Nhân Chứng Lịch Sử: Thành Cổ Quảng Trị"
                                            data-author="Nhiều Tác Giả / NXB Trẻ"
                                            data-category="Lịch Sử & Ký Ức"
                                            data-rating="★ 4.9"
                                            data-pages="280 trang"
                                            data-price="135 Khoai"
                                            data-cover="testhome/img/thanhco.jfif"
                                            data-summary="Khúc tráng ca bất tử về 81 ngày đêm máu lửa bảo vệ Thành Cổ Quảng Trị năm 1972, ghi dấu chủ nghĩa anh hùng cách mạng của tuổi trẻ Việt Nam.">
                                            <div className="book-cover-wrapper w-20 sm:w-24 aspect-[2/3] rounded shadow-lg overflow-hidden bg-paper-200 border border-black/10 group-hover/book:shadow-2xl transition-shadow">
                                                <img src="testhome/img/thanhco.jfif" alt="Thành Cổ Quảng Trị" className="w-full h-full object-cover" onError={(event) => { event.currentTarget.src = 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=400&q=80' }} />
                                            </div>
                                            <span className="text-[10px] font-bold text-ink dark:text-night-text mt-1.5 truncate max-w-[70px] sm:max-w-[85px] text-center">Thành Cổ</span>
                                        </div>

                                        {/* Book 1.3: Khúc Ca Tiến Công */}
                                        <div className="combo-book-item flex flex-col items-center group/book cursor-pointer"
                                            data-title="Khúc Ca Tiến Công"
                                            data-author="Nguyễn Đình Thi / NXB Văn Học"
                                            data-category="Văn Học Cách Mạng"
                                            data-rating="★ 4.8"
                                            data-pages="310 trang"
                                            data-price="120 Khoai"
                                            data-cover="testhome/img/tiencong.jfif"
                                            data-summary="Tuyển tập những bài thơ, trường ca và khúc tráng ca hào hùng rực lửa về bước chân hành quân của đoàn quân giải phóng.">
                                            <div className="book-cover-wrapper w-16 sm:w-20 aspect-[2/3] rounded shadow-md overflow-hidden bg-paper-200 border border-black/10 group-hover/book:shadow-xl transition-shadow">
                                                <img src="testhome/img/tiencong.jfif" alt="Khúc Ca Tiến Công" className="w-full h-full object-cover" onError={(event) => { event.currentTarget.src = 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=400&q=80' }} />
                                            </div>
                                            <span className="text-[10px] font-bold text-ink dark:text-night-text mt-1.5 truncate max-w-[70px] sm:max-w-[80px] text-center">Tiến Công</span>
                                        </div>
                                    </div>

                                    {/* Card Info */}
                                    <span className="font-metadata-spec text-[10px] font-bold uppercase tracking-wider text-wine dark:text-gold">Tuyển Tập Lịch Sử</span>
                                    <h3 className="font-display font-black text-base text-ink dark:text-night-text mt-1 leading-snug">
                                        Combo Ký Ức & Hào Khí Dân Tộc
                                    </h3>
                                    <p className="font-editorial-body text-xs text-ink-muted dark:text-night-muted mt-1 leading-snug line-clamp-2">
                                        Gồm: Điện Biên Phủ, Thành Cổ Quảng Trị và Khúc Ca Tiến Công.
                                    </p>
                                </div>

                                {/* Footer */}
                                <div className="pt-3 border-t border-paper-border dark:border-night-border mt-3 flex items-center justify-between gap-2">
                                    <div>
                                        <div className="font-metadata-spec text-[11px] line-through text-ink-muted dark:text-night-muted">385 Khoai (~385k)</div>
                                        <div className="flex items-baseline gap-1">
                                            <span className="font-metadata-spec text-xl font-black text-ink dark:text-night-text">229</span>
                                            <span className="potato-badge text-[10px] py-0.5 px-2">Khoai <i className="ph-fill ph-coins text-[9px]"></i></span>
                                        </div>
                                    </div>
                                    <button type="button" onClick={(event) => { window.openRedeemModal('Combo Ký Ức & Hào Khí Dân Tộc', 229, 'Đổi Combo Ký Ức & Hào Khí Dân Tộc thành công! Trọn bộ 3 sách đã được đưa vào Tủ Sách của bạn.') }} className="px-4 py-2 rounded-full bg-wine hover:bg-wine-dark text-white font-metadata-spec text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 shrink-0">
                                        <i className="ph-bold ph-book-bookmark"></i> Đổi Bằng Khoai
                                    </button>
                                </div>
                            </div>

                            {/* Combo Card 2: Combo Suối Nguồn Cảm Xúc */}
                            <div className="rounded-2xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border p-4 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between relative group">
                                <span className="absolute top-3 left-3 z-20 font-metadata-spec text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-600 text-white shadow-sm">-35% GIẢM</span>

                                <div>
                                    {/* Books Visual Showcase Area */}
                                    <div className="w-full bg-[#fbf8f2] dark:bg-night-surface/70 rounded-xl p-3 pt-6 pb-2.5 mb-3 flex items-end justify-center gap-3 sm:gap-3.5 min-h-[145px] border border-paper-border/60 dark:border-night-border/60 relative">
                                        {/* Book 2.1: Ngày Xưa Có Một Chuyện Tình */}
                                        <div className="combo-book-item flex flex-col items-center group/book cursor-pointer"
                                            data-title="Ngày Xưa Có Một Chuyện Tình"
                                            data-author="Nguyễn Nhật Ánh"
                                            data-category="Văn Học Tuổi Trẻ"
                                            data-rating="★ 4.9"
                                            data-pages="340 trang"
                                            data-price="105 Khoai"
                                            data-cover="https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80"
                                            data-summary="Bản tình ca thanh xuân day dứt về tình bạn, tình yêu và sự bao dung giữa ba người bạn Vinh, Miền và Phúc dưới bầu trời làng quê yêu dấu.">
                                            <div className="book-cover-wrapper w-16 sm:w-20 aspect-[2/3] rounded shadow-md overflow-hidden bg-paper-200 border border-black/10 group-hover/book:shadow-xl transition-shadow">
                                                <img src="https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80" alt="Ngày Xưa Có Một Chuyện Tình" className="w-full h-full object-cover" />
                                            </div>
                                            <span className="text-[10px] font-bold text-ink dark:text-night-text mt-1.5 truncate max-w-[70px] sm:max-w-[80px] text-center">Chuyện Tình</span>
                                        </div>

                                        {/* Book 2.2: Hoàng Tử Bé */}
                                        <div className="combo-book-item flex flex-col items-center group/book -translate-y-1 cursor-pointer"
                                            data-title="Hoàng Tử Bé (Le Petit Prince)"
                                            data-author="Antoine de Saint-Exupéry"
                                            data-category="Văn Học Kinh Điển"
                                            data-rating="★ 5.0"
                                            data-pages="120 trang"
                                            data-price="95 Khoai"
                                            data-cover="https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=400&q=80"
                                            data-summary="Kiệt tác văn chương của nhân loại về tình yêu, sự thuần khiết của tâm hồn trẻ thơ và lời nhắn nhủ chỉ nhìn rõ bằng trái tim.">
                                            <div className="book-cover-wrapper w-20 sm:w-24 aspect-[2/3] rounded shadow-lg overflow-hidden bg-paper-200 border border-black/10 group-hover/book:shadow-2xl transition-shadow">
                                                <img src="https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=400&q=80" alt="Hoàng Tử Bé" className="w-full h-full object-cover" />
                                            </div>
                                            <span className="text-[10px] font-bold text-ink dark:text-night-text mt-1.5 truncate max-w-[70px] sm:max-w-[85px] text-center">Hoàng Tử Bé</span>
                                        </div>

                                        {/* Book 2.3: Dế Mèn Phiêu Lưu Ký */}
                                        <div className="combo-book-item flex flex-col items-center group/book cursor-pointer"
                                            data-title="Dế Mèn Phiêu Lưu Ký"
                                            data-author="Tô Hoài"
                                            data-category="Văn Học Thiếu Nhi"
                                            data-rating="★ 4.9"
                                            data-pages="195 trang"
                                            data-price="110 Khoai"
                                            data-cover="https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=400&q=80"
                                            data-summary="Hành trình chu du thế giới muôn loài của chú Dế Mèn dũng cảm, học hỏi tinh thần trượng nghĩa và khát vọng hòa bình bốn bể.">
                                            <div className="book-cover-wrapper w-16 sm:w-20 aspect-[2/3] rounded shadow-md overflow-hidden bg-paper-200 border border-black/10 group-hover/book:shadow-xl transition-shadow">
                                                <img src="https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=400&q=80" alt="Dế Mèn Phiêu Lưu Ký" className="w-full h-full object-cover" />
                                            </div>
                                            <span className="text-[10px] font-bold text-ink dark:text-night-text mt-1.5 truncate max-w-[70px] sm:max-w-[80px] text-center">Dế Mèn</span>
                                        </div>
                                    </div>

                                    {/* Card Info */}
                                    <span className="font-metadata-spec text-[10px] font-bold uppercase tracking-wider text-wine dark:text-gold">Văn Học & Tuổi Thơ</span>
                                    <h3 className="font-display font-black text-base text-ink dark:text-night-text mt-1 leading-snug">
                                        Combo Suối Nguồn Cảm Xúc
                                    </h3>
                                    <p className="font-editorial-body text-xs text-ink-muted dark:text-night-muted mt-1 leading-snug line-clamp-2">
                                        Gồm: Ngày Xưa Có Một Chuyện Tình, Hoàng Tử Bé và Dế Mèn Phiêu Lưu Ký.
                                    </p>
                                </div>

                                {/* Footer */}
                                <div className="pt-3 border-t border-paper-border dark:border-night-border mt-3 flex items-center justify-between gap-2">
                                    <div>
                                        <div className="font-metadata-spec text-[11px] line-through text-ink-muted dark:text-night-muted">310 Khoai (~310k)</div>
                                        <div className="flex items-baseline gap-1">
                                            <span className="font-metadata-spec text-xl font-black text-ink dark:text-night-text">199</span>
                                            <span className="potato-badge text-[10px] py-0.5 px-2">Khoai <i className="ph-fill ph-coins text-[9px]"></i></span>
                                        </div>
                                    </div>
                                    <button type="button" onClick={(event) => { window.openRedeemModal('Combo Suối Nguồn Cảm Xúc', 199, 'Đổi Combo Suối Nguồn Cảm Xúc thành công! Trọn bộ 3 sách đã được đưa vào Tủ Sách của bạn.') }} className="px-4 py-2 rounded-full bg-wine hover:bg-wine-dark text-white font-metadata-spec text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 shrink-0">
                                        <i className="ph-bold ph-book-bookmark"></i> Đổi Bằng Khoai
                                    </button>
                                </div>
                            </div>

                            {/* Combo Card 3: Combo Khai Phá Tiềm Năng Bản Thân */}
                            <div className="rounded-2xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border p-4 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between relative group">
                                <span className="absolute top-3 left-3 z-20 font-metadata-spec text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-600 text-white shadow-sm">-45% GIẢM</span>

                                <div>
                                    {/* Books Visual Showcase Area */}
                                    <div className="w-full bg-[#fbf8f2] dark:bg-night-surface/70 rounded-xl p-3 pt-6 pb-2.5 mb-3 flex items-end justify-center gap-3 sm:gap-3.5 min-h-[145px] border border-paper-border/60 dark:border-night-border/60 relative">
                                        {/* Book 3.1: Sapiens */}
                                        <div className="combo-book-item flex flex-col items-center group/book cursor-pointer"
                                            data-title="Sapiens — Lược Sử Loài Người"
                                            data-author="Yuval Noah Harari"
                                            data-category="Lịch Sử & Tri Thức"
                                            data-rating="★ 5.0"
                                            data-pages="512 trang"
                                            data-price="160 Khoai"
                                            data-cover="https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&w=400&q=80"
                                            data-summary="Hành trình tiến hóa phi thường từ vượn cổ đến bá chủ thế giới, giải mã ba cuộc cách mạng định hình tương lai nhân loại.">
                                            <div className="book-cover-wrapper w-16 sm:w-20 aspect-[2/3] rounded shadow-md overflow-hidden bg-paper-200 border border-black/10 group-hover/book:shadow-xl transition-shadow">
                                                <img src="https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&w=400&q=80" alt="Sapiens" className="w-full h-full object-cover" />
                                            </div>
                                            <span className="text-[10px] font-bold text-ink dark:text-night-text mt-1.5 truncate max-w-[70px] sm:max-w-[80px] text-center">Sapiens</span>
                                        </div>

                                        {/* Book 3.2: Từ Tốt Đến Vĩ Đại */}
                                        <div className="combo-book-item flex flex-col items-center group/book -translate-y-1 cursor-pointer"
                                            data-title="Từ Tốt Đến Vĩ Đại (Good to Great)"
                                            data-author="Jim Collins"
                                            data-category="Kinh Doanh & Lãnh Đạo"
                                            data-rating="★ 4.9"
                                            data-pages="400 trang"
                                            data-price="150 Khoai"
                                            data-cover="https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=400&auto=format&fit=crop"
                                            data-summary="Công trình nghiên cứu mẫu mực về cách thức các công ty bình thường bứt phá và giữ vững vị thế trường tồn vĩ đại.">
                                            <div className="book-cover-wrapper w-20 sm:w-24 aspect-[2/3] rounded shadow-lg overflow-hidden bg-paper-200 border border-black/10 group-hover/book:shadow-2xl transition-shadow">
                                                <img src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=400&auto=format&fit=crop" alt="Từ Tốt Đến Vĩ Đại" className="w-full h-full object-cover" onError={(event) => { event.currentTarget.src = 'testhome/img/anh-mo-ta.jfif' }} />
                                            </div>
                                            <span className="text-[10px] font-bold text-ink dark:text-night-text mt-1.5 truncate max-w-[70px] sm:max-w-[85px] text-center">Tốt Đến Vĩ Đại</span>
                                        </div>

                                        {/* Book 3.3: Đắc Nhân Tâm */}
                                        <div className="combo-book-item flex flex-col items-center group/book cursor-pointer"
                                            data-title="Đắc Nhân Tâm (How to Win Friends)"
                                            data-author="Dale Carnegie"
                                            data-category="Kỹ Năng Sống"
                                            data-rating="★ 5.0"
                                            data-pages="320 trang"
                                            data-price="140 Khoai"
                                            data-cover="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=400&q=80"
                                            data-summary="Nghệ thuật giao tiếp, thấu cảm và thu phục lòng người bất biến qua mọi thời đại, chìa khóa thành công trong sự nghiệp và đời sống.">
                                            <div className="book-cover-wrapper w-16 sm:w-20 aspect-[2/3] rounded shadow-md overflow-hidden bg-paper-200 border border-black/10 group-hover/book:shadow-xl transition-shadow">
                                                <img src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=400&q=80" alt="Đắc Nhân Tâm" className="w-full h-full object-cover" />
                                            </div>
                                            <span className="text-[10px] font-bold text-ink dark:text-night-text mt-1.5 truncate max-w-[70px] sm:max-w-[80px] text-center">Đắc Nhân Tâm</span>
                                        </div>
                                    </div>

                                    {/* Card Info */}
                                    <span className="font-metadata-spec text-[10px] font-bold uppercase tracking-wider text-wine dark:text-gold">Kỹ Năng & Lãnh Đạo</span>
                                    <h3 className="font-display font-black text-base text-ink dark:text-night-text mt-1 leading-snug">
                                        Combo Khai Phá Tiềm Năng Bản Thân
                                    </h3>
                                    <p className="font-editorial-body text-xs text-ink-muted dark:text-night-muted mt-1 leading-snug line-clamp-2">
                                        Gồm: Sapiens Lược Sử Loài Người, Từ Tốt Đến Vĩ Đại và Đắc Nhân Tâm.
                                    </p>
                                </div>

                                {/* Footer */}
                                <div className="pt-3 border-t border-paper-border dark:border-night-border mt-3 flex items-center justify-between gap-2">
                                    <div>
                                        <div className="font-metadata-spec text-[11px] line-through text-ink-muted dark:text-night-muted">450 Khoai (~450k)</div>
                                        <div className="flex items-baseline gap-1">
                                            <span className="font-metadata-spec text-xl font-black text-ink dark:text-night-text">249</span>
                                            <span className="potato-badge text-[10px] py-0.5 px-2">Khoai <i className="ph-fill ph-coins text-[9px]"></i></span>
                                        </div>
                                    </div>
                                    <button type="button" onClick={(event) => { window.openRedeemModal('Combo Khai Phá Tiềm Năng Bản Thân', 249, 'Đổi Combo Khai Phá Tiềm Năng Bản Thân thành công! Trọn bộ 3 sách đã được đưa vào Tủ Sách của bạn.') }} className="px-4 py-2 rounded-full bg-wine hover:bg-wine-dark text-white font-metadata-spec text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 shrink-0">
                                        <i className="ph-bold ph-book-bookmark"></i> Đổi Bằng Khoai
                                    </button>
                                </div>
                            </div>

                            {/* Combo Card 4: Combo Bứt Phá & Tư Duy Tinh Gọn */}
                            <div className="rounded-2xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border p-4 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between relative group">
                                <span className="absolute top-3 left-3 z-20 font-metadata-spec text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-600 text-white shadow-sm">-40% GIẢM</span>

                                <div>
                                    {/* Books Visual Showcase Area */}
                                    <div className="w-full bg-[#fbf8f2] dark:bg-night-surface/70 rounded-xl p-3 pt-6 pb-2.5 mb-3 flex items-end justify-center gap-3 sm:gap-3.5 min-h-[145px] border border-paper-border/60 dark:border-night-border/60 relative">
                                        {/* Book 4.1: Atomic Habits */}
                                        <div className="combo-book-item flex flex-col items-center group/book cursor-pointer"
                                            data-title="Atomic Habits — Thói Quen Nguyên Tử"
                                            data-author="James Clear / NXB Thế Giới"
                                            data-category="Tâm Lý & Phát Triển"
                                            data-rating="★ 5.0"
                                            data-pages="384 trang"
                                            data-price="135 Khoai"
                                            data-cover="https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80"
                                            data-summary="Phương pháp xây dựng thói quen tốt và loại bỏ thói quen xấu với sức mạnh thay đổi 1% mỗi ngày, tạo nên bước ngoặt đột phá cho cuộc sống và sự nghiệp.">
                                            <div className="book-cover-wrapper w-16 sm:w-20 aspect-[2/3] rounded shadow-md overflow-hidden bg-paper-200 border border-black/10 group-hover/book:shadow-xl transition-shadow">
                                                <img src="https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80" alt="Atomic Habits" className="w-full h-full object-cover" />
                                            </div>
                                            <span className="text-[10px] font-bold text-ink dark:text-night-text mt-1.5 truncate max-w-[70px] sm:max-w-[80px] text-center">Atomic Habits</span>
                                        </div>

                                        {/* Book 4.2: Nhà Lãnh Đạo Không Chức Danh */}
                                        <div className="combo-book-item flex flex-col items-center group/book -translate-y-1 cursor-pointer"
                                            data-title="Nhà Lãnh Đạo Không Chức Danh"
                                            data-author="Robin Sharma / NXB Trẻ"
                                            data-category="Lãnh Đạo & Thành Công"
                                            data-rating="★ 4.9"
                                            data-pages="275 trang"
                                            data-price="125 Khoai"
                                            data-cover="https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=400&auto=format&fit=crop"
                                            data-summary="Đánh thức phẩm chất lãnh đạo tiềm ẩn trong mỗi con người, tạo ra sức ảnh hưởng và cống hiến vượt bậc bất kể bạn đang làm việc ở vị trí nào.">
                                            <div className="book-cover-wrapper w-20 sm:w-24 aspect-[2/3] rounded shadow-lg overflow-hidden bg-paper-200 border border-black/10 group-hover/book:shadow-2xl transition-shadow">
                                                <img src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=400&auto=format&fit=crop" alt="Nhà Lãnh Đạo Không Chức Danh" className="w-full h-full object-cover" onError={(event) => { event.currentTarget.src = 'testhome/img/anh-mo-ta.jfif' }} />
                                            </div>
                                            <span className="text-[10px] font-bold text-ink dark:text-night-text mt-1.5 truncate max-w-[70px] sm:max-w-[85px] text-center">Lãnh Đạo KCD</span>
                                        </div>

                                        {/* Book 4.3: Khởi Nghiệp Tinh Gọn */}
                                        <div className="combo-book-item flex flex-col items-center group/book cursor-pointer"
                                            data-title="Khởi Nghiệp Tinh Gọn (The Lean Startup)"
                                            data-author="Eric Ries / NXB Công Thương"
                                            data-category="Kinh Doanh & Đổi Mới"
                                            data-rating="★ 4.8"
                                            data-pages="350 trang"
                                            data-price="130 Khoai"
                                            data-cover="https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=400&q=80"
                                            data-summary="Mô hình phát triển sản phẩm và doanh nghiệp đột phá giúp kiểm chứng ý tưởng nhanh chóng, thích ứng linh hoạt và tối ưu nguồn lực bền vững.">
                                            <div className="book-cover-wrapper w-16 sm:w-20 aspect-[2/3] rounded shadow-md overflow-hidden bg-paper-200 border border-black/10 group-hover/book:shadow-xl transition-shadow">
                                                <img src="https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=400&q=80" alt="Khởi Nghiệp Tinh Gọn" className="w-full h-full object-cover" />
                                            </div>
                                            <span className="text-[10px] font-bold text-ink dark:text-night-text mt-1.5 truncate max-w-[70px] sm:max-w-[80px] text-center">Khởi Nghiệp</span>
                                        </div>
                                    </div>

                                    {/* Card Info */}
                                    <span className="font-metadata-spec text-[10px] font-bold uppercase tracking-wider text-wine dark:text-gold">Tư Duy & Khởi Nghiệp</span>
                                    <h3 className="font-display font-black text-base text-ink dark:text-night-text mt-1 leading-snug">
                                        Combo Bứt Phá & Tư Duy Tinh Gọn
                                    </h3>
                                    <p className="font-editorial-body text-xs text-ink-muted dark:text-night-muted mt-1 leading-snug line-clamp-2">
                                        Gồm: Atomic Habits, Lãnh Đạo Không Chức Danh và Khởi Nghiệp Tinh Gọn.
                                    </p>
                                </div>

                                {/* Footer */}
                                <div className="pt-3 border-t border-paper-border dark:border-night-border mt-3 flex items-center justify-between gap-2">
                                    <div>
                                        <div className="font-metadata-spec text-[11px] line-through text-ink-muted dark:text-night-muted">390 Khoai (~390k)</div>
                                        <div className="flex items-baseline gap-1">
                                            <span className="font-metadata-spec text-xl font-black text-ink dark:text-night-text">239</span>
                                            <span className="potato-badge text-[10px] py-0.5 px-2">Khoai <i className="ph-fill ph-coins text-[9px]"></i></span>
                                        </div>
                                    </div>
                                    <button type="button" onClick={(event) => { window.openRedeemModal('Combo Bứt Phá & Tư Duy Tinh Gọn', 239, 'Đổi Combo Bứt Phá & Tư Duy Tinh Gọn thành công! Trọn bộ 3 sách đã được đưa vào Tủ Sách của bạn.') }} className="px-4 py-2 rounded-full bg-wine hover:bg-wine-dark text-white font-metadata-spec text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 shrink-0">
                                        <i className="ph-bold ph-book-bookmark"></i> Đổi Bằng Khoai
                                    </button>
                                </div>
                            </div>

                        </div>
                    </section>


                    {/* ========================================================
                     4. SÁCH LẺ GIẢM SÂU (THIẾT KẾ CARD SÁCH ĐỒNG BỘ TRANG CHỦ)
                     ======================================================== */}
                    <section id="row-single-books" className="scroll-mt-28">
                        {/* Row Header */}
                        <div className="flex items-center justify-between pb-3 border-b border-paper-border dark:border-night-border mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-wine/10 dark:bg-gold/15 text-wine dark:text-gold flex items-center justify-center text-xl shrink-0">
                                    <i className="ph-bold ph-book-open"></i>
                                </div>
                                <div>
                                    <h2 className="font-display font-black text-xl sm:text-2xl text-ink dark:text-night-text tracking-tight">
                                        Sách Lẻ Giảm Sâu
                                    </h2>
                                    <p className="font-editorial-body text-xs sm:text-sm text-ink-muted dark:text-night-muted">
                                        Các kiệt tác văn học, tư duy và khoa học kinh điển với chi phí mở khóa cực thấp.
                                    </p>
                                </div>
                            </div>
                            {/* Navigation Buttons */}
                            <div className="flex items-center gap-2">
                                <button type="button" onClick={(event) => { window.scrollRow('cards-row-4', -340) }} className="w-9 h-9 rounded-full bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border text-ink dark:text-night-text hover:bg-wine hover:text-white dark:hover:bg-gold dark:hover:text-night-bg flex items-center justify-center transition-colors shadow-sm" aria-label="Cuộn sang trái">
                                    <i className="ph-bold ph-caret-left text-sm"></i>
                                </button>
                                <button type="button" onClick={(event) => { window.scrollRow('cards-row-4', 340) }} className="w-9 h-9 rounded-full bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border text-ink dark:text-night-text hover:bg-wine hover:text-white dark:hover:bg-gold dark:hover:text-night-bg flex items-center justify-center transition-colors shadow-sm" aria-label="Cuộn sang phải">
                                    <i className="ph-bold ph-caret-right text-sm"></i>
                                </button>
                            </div>
                        </div>

                        {/* Horizontal Cards Scroll Row */}
                        <div id="cards-row-4" className="cards-scroll-container">

                            {/* Card 4.1: Nhà Lãnh Đạo Không Chức Danh */}
                            <div className="offer-card rounded-2xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between relative group">
                                <span className="absolute top-4 right-4 font-metadata-spec text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-wine text-white shadow-sm z-10">-50%</span>
                                <div className="combo-book-item space-y-4 cursor-pointer"
                                    data-title="Nhà Lãnh Đạo Không Chức Danh"
                                    data-author="Robin Sharma"
                                    data-category="Lãnh Đạo & Phát Triển"
                                    data-rating="★ 4.9"
                                    data-pages="280 trang"
                                    data-price="25 Khoai (Gốc: 50 Khoai)"
                                    data-cover="https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=400&auto=format&fit=crop"
                                    data-summary="Bí quyết đánh thức tiềm năng lãnh đạo nội tại từ mọi vị trí. Bạn không cần phải có chức danh để tạo ra sự khác biệt phi thường trong tổ chức và cuộc sống.">
                                    <div className="book-cover-wrapper w-20 aspect-[2/3] rounded-lg overflow-hidden shadow-md bg-paper-200 dark:bg-night-surface shrink-0">
                                        <img src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=400&auto=format&fit=crop" alt="Nhà Lãnh Đạo Không Chức Danh" className="w-full h-full object-cover" />
                                    </div>
                                    <div>
                                        <span className="font-metadata-spec text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-wine/10 text-wine dark:bg-gold/15 dark:text-gold">Robin Sharma</span>
                                        <h3 className="font-display font-black text-lg text-ink dark:text-night-text mt-2 leading-tight">Nhà Lãnh Đạo Không Chức Danh</h3>
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-paper-border dark:border-night-border mt-4">
                                    <div className="flex items-baseline justify-between mb-4">
                                        <div className="flex items-baseline gap-2">
                                            <span className="font-metadata-spec text-xs line-through text-ink-muted dark:text-night-muted">50</span>
                                            <span className="font-metadata-spec text-2xl font-black text-wine dark:text-gold">25</span>
                                            <span className="potato-badge">Khoai <i className="ph-fill ph-coins text-[10px]"></i></span>
                                        </div>
                                    </div>
                                    <button type="button" onClick={(event) => { window.openRedeemModal('Nhà Lãnh Đạo Không Chức Danh', 25, 'Mua sách thành công! Đã thêm vào danh sách đọc cá nhân.') }} className="w-full py-2.5 rounded-full bg-wine hover:bg-wine-dark text-white font-metadata-spec text-xs font-bold text-center transition-colors shadow-sm">
                                        Mua Sách
                                    </button>
                                </div>
                            </div>

                            {/* Card 4.2: Dune - Xứ Cát */}
                            <div className="offer-card rounded-2xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between relative group">
                                <span className="absolute top-4 right-4 font-metadata-spec text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-wine text-white shadow-sm z-10">-20%</span>
                                <div className="combo-book-item space-y-4 cursor-pointer"
                                    data-title="Dune - Xứ Cát"
                                    data-author="Frank Herbert"
                                    data-category="Khoa Học Viễn Tưởng"
                                    data-rating="★ 5.0"
                                    data-pages="680 trang"
                                    data-price="48 Khoai (Gốc: 60 Khoai)"
                                    data-cover="https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=400&auto=format&fit=crop"
                                    data-summary="Kiệt tác khoa học viễn tưởng vĩ đại nhất mọi thời đại. Cuộc chiến vương quyền, tôn giáo và tài nguyên hương dược trên hành tinh sa mạc khắc nghiệt Arrakis.">
                                    <div className="book-cover-wrapper w-20 aspect-[2/3] rounded-lg overflow-hidden shadow-md bg-paper-200 dark:bg-night-surface shrink-0">
                                        <img src="https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=400&auto=format&fit=crop" alt="Dune - Xứ Cát" className="w-full h-full object-cover" />
                                    </div>
                                    <div>
                                        <span className="font-metadata-spec text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-wine/10 text-wine dark:bg-gold/15 dark:text-gold">Frank Herbert</span>
                                        <h3 className="font-display font-black text-lg text-ink dark:text-night-text mt-2 leading-tight">Dune - Xứ Cát</h3>
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-paper-border dark:border-night-border mt-4">
                                    <div className="flex items-baseline justify-between mb-4">
                                        <div className="flex items-baseline gap-2">
                                            <span className="font-metadata-spec text-xs line-through text-ink-muted dark:text-night-muted">60</span>
                                            <span className="font-metadata-spec text-2xl font-black text-wine dark:text-gold">48</span>
                                            <span className="potato-badge">Khoai <i className="ph-fill ph-coins text-[10px]"></i></span>
                                        </div>
                                    </div>
                                    <button type="button" onClick={(event) => { window.openRedeemModal('Dune - Xứ Cát', 48, 'Mua sách thành công! Đã thêm vào danh sách đọc cá nhân.') }} className="w-full py-2.5 rounded-full bg-wine hover:bg-wine-dark text-white font-metadata-spec text-xs font-bold text-center transition-colors shadow-sm">
                                        Mua Sách
                                    </button>
                                </div>
                            </div>

                            {/* Card 4.3: Atomic Habits */}
                            <div className="offer-card rounded-2xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between relative group">
                                <span className="absolute top-4 right-4 font-metadata-spec text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-wine text-white shadow-sm z-10">-30%</span>
                                <div className="combo-book-item space-y-4 cursor-pointer"
                                    data-title="Atomic Habits (Thay Đổi Tí Hon)"
                                    data-author="James Clear"
                                    data-category="Kỹ Năng & Thói Quen"
                                    data-rating="★ 5.0"
                                    data-pages="350 trang"
                                    data-price="52 Khoai (Gốc: 75 Khoai)"
                                    data-cover="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=400&auto=format&fit=crop"
                                    data-summary="Thay đổi tí hon, hiệu quả bất ngờ. Hướng dẫn thực hành từng bước để xây dựng hệ thống thói quen tích cực và loại bỏ thói quen trì trệ mỗi ngày.">
                                    <div className="book-cover-wrapper w-20 aspect-[2/3] rounded-lg overflow-hidden shadow-md bg-paper-200 dark:bg-night-surface shrink-0">
                                        <img src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=400&auto=format&fit=crop" alt="Atomic Habits" className="w-full h-full object-cover" />
                                    </div>
                                    <div>
                                        <span className="font-metadata-spec text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-wine/10 text-wine dark:bg-gold/15 dark:text-gold">James Clear</span>
                                        <h3 className="font-display font-black text-lg text-ink dark:text-night-text mt-2 leading-tight">Atomic Habits</h3>
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-paper-border dark:border-night-border mt-4">
                                    <div className="flex items-baseline justify-between mb-4">
                                        <div className="flex items-baseline gap-2">
                                            <span className="font-metadata-spec text-xs line-through text-ink-muted dark:text-night-muted">75</span>
                                            <span className="font-metadata-spec text-2xl font-black text-wine dark:text-gold">52</span>
                                            <span className="potato-badge">Khoai <i className="ph-fill ph-coins text-[10px]"></i></span>
                                        </div>
                                    </div>
                                    <button type="button" onClick={(event) => { window.openRedeemModal('Atomic Habits', 52, 'Mua sách thành công! Đã thêm vào danh sách đọc cá nhân.') }} className="w-full py-2.5 rounded-full bg-wine hover:bg-wine-dark text-white font-metadata-spec text-xs font-bold text-center transition-colors shadow-sm">
                                        Mua Sách
                                    </button>
                                </div>
                            </div>

                            {/* Card 4.4: Sapiens */}
                            <div className="offer-card rounded-2xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between relative group">
                                <span className="absolute top-4 right-4 font-metadata-spec text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-wine text-white shadow-sm z-10">-15%</span>
                                <div className="combo-book-item space-y-4 cursor-pointer"
                                    data-title="Sapiens — Lược Sử Loài Người"
                                    data-author="Yuval Noah Harari"
                                    data-category="Lịch Sử & Nhân Loại"
                                    data-rating="★ 5.0"
                                    data-pages="512 trang"
                                    data-price="68 Khoai (Gốc: 80 Khoai)"
                                    data-cover="https://images.unsplash.com/photo-1461360370896-922624d12aa1?q=80&w=400&auto=format&fit=crop"
                                    data-summary="Bức tranh toàn cảnh về hành trình tiến hóa và phát triển của loài người từ thuở hồng hoang tới kỷ nguyên số, giải mã những huyền thoại định hình văn minh.">
                                    <div className="book-cover-wrapper w-20 aspect-[2/3] rounded-lg overflow-hidden shadow-md bg-paper-200 dark:bg-night-surface shrink-0">
                                        <img src="https://images.unsplash.com/photo-1461360370896-922624d12aa1?q=80&w=400&auto=format&fit=crop" alt="Sapiens" className="w-full h-full object-cover" />
                                    </div>
                                    <div>
                                        <span className="font-metadata-spec text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-wine/10 text-wine dark:bg-gold/15 dark:text-gold">Yuval Noah Harari</span>
                                        <h3 className="font-display font-black text-lg text-ink dark:text-night-text mt-2 leading-tight">Sapiens — Lược Sử Loài Người</h3>
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-paper-border dark:border-night-border mt-4">
                                    <div className="flex items-baseline justify-between mb-4">
                                        <div className="flex items-baseline gap-2">
                                            <span className="font-metadata-spec text-xs line-through text-ink-muted dark:text-night-muted">80</span>
                                            <span className="font-metadata-spec text-2xl font-black text-wine dark:text-gold">68</span>
                                            <span className="potato-badge">Khoai <i className="ph-fill ph-coins text-[10px]"></i></span>
                                        </div>
                                    </div>
                                    <button type="button" onClick={(event) => { window.openRedeemModal('Sapiens', 68, 'Mua sách thành công! Đã thêm vào danh sách đọc cá nhân.') }} className="w-full py-2.5 rounded-full bg-wine hover:bg-wine-dark text-white font-metadata-spec text-xs font-bold text-center transition-colors shadow-sm">
                                        Mua Sách
                                    </button>
                                </div>
                            </div>

                        </div>
                    </section>


                    {/* ========================================================
                     5. ƯU ĐÃI THỬ THÁCH ĐỌC SÁCH
                     ======================================================== */}
                    <section id="row-reading-challenge" className="scroll-mt-28">
                        {/* Row Header */}
                        <div className="flex items-center justify-between pb-3 border-b border-paper-border dark:border-night-border mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gold/15 text-gold flex items-center justify-center text-xl shrink-0">
                                    <i className="ph-bold ph-medal"></i>
                                </div>
                                <div>
                                    <h2 className="font-display font-black text-xl sm:text-2xl text-ink dark:text-night-text tracking-tight">
                                        Ưu Đãi Thử Thách Đọc Sách
                                    </h2>
                                    <p className="font-editorial-body text-xs sm:text-sm text-ink-muted dark:text-night-muted">
                                        Chinh phục chuỗi ngày đọc sách liên tục để nhận voucher giảm giá và thưởng nóng Khoai.
                                    </p>
                                </div>
                            </div>
                            {/* Navigation Buttons */}
                            <div className="flex items-center gap-2">
                                <button type="button" onClick={(event) => { window.scrollRow('cards-row-5', -340) }} className="w-9 h-9 rounded-full bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border text-ink dark:text-night-text hover:bg-wine hover:text-white dark:hover:bg-gold dark:hover:text-night-bg flex items-center justify-center transition-colors shadow-sm" aria-label="Cuộn sang trái">
                                    <i className="ph-bold ph-caret-left text-sm"></i>
                                </button>
                                <button type="button" onClick={(event) => { window.scrollRow('cards-row-5', 340) }} className="w-9 h-9 rounded-full bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border text-ink dark:text-night-text hover:bg-wine hover:text-white dark:hover:bg-gold dark:hover:text-night-bg flex items-center justify-center transition-colors shadow-sm" aria-label="Cuộn sang phải">
                                    <i className="ph-bold ph-caret-right text-sm"></i>
                                </button>
                            </div>
                        </div>

                        {/* Horizontal Cards Scroll Row */}
                        <div id="cards-row-5" className="cards-scroll-container">

                            {/* Card 5.1: Chiến Thần Tốc Độ */}
                            <div className="offer-card rounded-2xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between relative group">
                                <div className="space-y-3.5">
                                    <div className="relative h-28 w-full rounded-xl overflow-hidden bg-paper-200 dark:bg-night-surface shadow-inner">
                                        <img src="https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=400&auto=format&fit=crop" alt="Chiến Thần Tốc Độ" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
                                        <span className="absolute top-2.5 right-2.5 font-metadata-spec text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-wine text-white shadow-sm">HOT CHALLENGE</span>
                                        <div className="absolute bottom-2.5 left-2.5 w-9 h-9 rounded-lg bg-wine/30 backdrop-blur-md border border-wine/50 flex items-center justify-center text-gold text-xl shadow-md">
                                            <i className="ph-bold ph-lightning"></i>
                                        </div>
                                    </div>
                                    <div>
                                        <span className="font-metadata-spec text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-paper-200 dark:bg-night-border text-wine dark:text-gold">3 Ngày 1 Sách</span>
                                        <h3 className="font-display font-black text-lg text-ink dark:text-night-text mt-1.5 leading-tight">Chiến Thần Tốc Độ</h3>
                                    </div>
                                    <ul className="space-y-1.5 pt-2 text-xs font-metadata-spec text-ink-muted dark:text-night-muted border-t border-paper-border/60 dark:border-night-border/60">
                                        <li className="flex items-center gap-2">
                                            <i className="ph-bold ph-target text-wine dark:text-gold text-sm shrink-0"></i>
                                            <span className="truncate">Mục tiêu: Đọc xong 1 cuốn trong 3 ngày</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <i className="ph-bold ph-gift text-gold text-sm shrink-0"></i>
                                            <span className="truncate">Thưởng: Voucher giảm 5% mua sách tiếp</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <i className="ph-bold ph-medal text-gold text-sm shrink-0"></i>
                                            <span className="truncate">Huy hiệu Tia Sớp Nhanh trên hồ sơ</span>
                                        </li>
                                    </ul>
                                </div>
                                <div className="pt-3.5 border-t border-paper-border dark:border-night-border mt-3.5">
                                    <div className="flex items-baseline justify-between mb-3.5">
                                        <span className="font-metadata-spec text-xs font-semibold text-ink-muted dark:text-night-muted">Phần thưởng:</span>
                                        <span className="font-metadata-spec text-2xl font-black text-wine dark:text-gold">-5% Voucher</span>
                                    </div>
                                    <button type="button" onClick={(event) => { window.openRedeemModal('Thử thách Chiến Thần Tốc Độ', 0, 'Đã ghi danh thử thách Chiến Thần Tốc Độ! Hãy hoàn thành cuốn sách đầu tiên trong 3 ngày.') }} className="w-full py-2.5 rounded-full bg-wine hover:bg-wine-dark text-white font-metadata-spec text-xs font-bold text-center transition-colors shadow-sm">
                                        Tham Gia Ngay
                                    </button>
                                </div>
                            </div>

                            {/* Card 5.2: Mọt Sách Chăm Chỉ */}
                            <div className="offer-card rounded-2xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between relative group">
                                <div className="space-y-3.5">
                                    <div className="relative h-28 w-full rounded-xl overflow-hidden bg-paper-200 dark:bg-night-surface shadow-inner">
                                        <img src="https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=400&auto=format&fit=crop" alt="Mọt Sách Chăm Chỉ" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
                                        <span className="absolute top-2.5 right-2.5 font-metadata-spec text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-gold text-night-bg shadow-sm">7-DAY STREAK</span>
                                        <div className="absolute bottom-2.5 left-2.5 w-9 h-9 rounded-lg bg-gold/30 backdrop-blur-md border border-gold/50 flex items-center justify-center text-gold text-xl shadow-md">
                                            <i className="ph-bold ph-fire"></i>
                                        </div>
                                    </div>
                                    <div>
                                        <span className="font-metadata-spec text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-gold/20 text-gold">Chuỗi Đọc 7 Ngày</span>
                                        <h3 className="font-display font-black text-lg text-ink dark:text-night-text mt-1.5 leading-tight">Mọt Sách Chăm Chỉ</h3>
                                    </div>
                                    <ul className="space-y-1.5 pt-2 text-xs font-metadata-spec text-ink-muted dark:text-night-muted border-t border-paper-border/60 dark:border-night-border/60">
                                        <li className="flex items-center gap-2">
                                            <i className="ph-bold ph-target text-wine dark:text-gold text-sm shrink-0"></i>
                                            <span className="truncate">Duy trì thói quen đọc 7 ngày liên tiếp</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <i className="ph-bold ph-gift text-gold text-sm shrink-0"></i>
                                            <span className="truncate">Thưởng nóng: +10 Khoai tươi vào ví</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <i className="ph-bold ph-medal text-gold text-sm shrink-0"></i>
                                            <span className="truncate">Mở khóa thành tựu Ngọn Lửa Bền Bỉ</span>
                                        </li>
                                    </ul>
                                </div>
                                <div className="pt-3.5 border-t border-paper-border dark:border-night-border mt-3.5">
                                    <div className="flex items-baseline justify-between mb-3.5">
                                        <span className="font-metadata-spec text-xs font-semibold text-ink-muted dark:text-night-muted">Phần thưởng:</span>
                                        <div className="flex items-baseline gap-1.5">
                                            <span className="font-metadata-spec text-2xl font-black text-emerald-600 dark:text-emerald-400">+10</span>
                                            <span className="potato-badge">Khoai <i className="ph-fill ph-coins text-[10px]"></i></span>
                                        </div>
                                    </div>
                                    <button type="button" onClick={(event) => { window.openRedeemModal('Thử thách Mọt Sách Chăm Chỉ', 0, 'Đã kích hoạt chuỗi đọc sách Mọt Sách Chăm Chỉ! Hãy duy trì 7 ngày để nhận thưởng 10 Khoai.') }} className="w-full py-2.5 rounded-full bg-wine hover:bg-wine-dark text-white font-metadata-spec text-xs font-bold text-center transition-colors shadow-sm">
                                        Tham Gia Ngay
                                    </button>
                                </div>
                            </div>

                            {/* Card 5.3: Thợ Săn Tri Thức */}
                            <div className="offer-card rounded-2xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between relative group">
                                <div className="space-y-3.5">
                                    <div className="relative h-28 w-full rounded-xl overflow-hidden bg-paper-200 dark:bg-night-surface shadow-inner">
                                        <img src="https://images.unsplash.com/photo-1481627834876-b7833e8f5570?q=80&w=400&auto=format&fit=crop" alt="Thợ Săn Tri Thức" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
                                        <span className="absolute top-2.5 right-2.5 font-metadata-spec text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-600 text-white shadow-sm">MONTHLY MASTER</span>
                                        <div className="absolute bottom-2.5 left-2.5 w-9 h-9 rounded-lg bg-blue-600/30 backdrop-blur-md border border-blue-400/50 flex items-center justify-center text-blue-300 text-xl shadow-md">
                                            <i className="ph-bold ph-compass"></i>
                                        </div>
                                    </div>
                                    <div>
                                        <span className="font-metadata-spec text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-paper-200 dark:bg-night-border text-wine dark:text-gold">Mục Tiêu Tháng</span>
                                        <h3 className="font-display font-black text-lg text-ink dark:text-night-text mt-1.5 leading-tight">Thợ Săn Tri Thức</h3>
                                    </div>
                                    <ul className="space-y-1.5 pt-2 text-xs font-metadata-spec text-ink-muted dark:text-night-muted border-t border-paper-border/60 dark:border-night-border/60">
                                        <li className="flex items-center gap-2">
                                            <i className="ph-bold ph-target text-wine dark:text-gold text-sm shrink-0"></i>
                                            <span className="truncate">Đọc hoàn thành 10 cuốn sách trong tháng</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <i className="ph-bold ph-gift text-gold text-sm shrink-0"></i>
                                            <span className="truncate">Thưởng lớn: +25 Khoai & Voucher -15%</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <i className="ph-bold ph-trophy text-gold text-sm shrink-0"></i>
                                            <span className="truncate">Vinh danh Top Độc Giả trên Bảng Vàng</span>
                                        </li>
                                    </ul>
                                </div>
                                <div className="pt-3.5 border-t border-paper-border dark:border-night-border mt-3.5">
                                    <div className="flex items-baseline justify-between mb-3.5">
                                        <span className="font-metadata-spec text-xs font-semibold text-ink-muted dark:text-night-muted">Phần thưởng:</span>
                                        <div className="flex items-baseline gap-1.5">
                                            <span className="font-metadata-spec text-2xl font-black text-emerald-600 dark:text-emerald-400">+25</span>
                                            <span className="potato-badge">Khoai <i className="ph-fill ph-coins text-[10px]"></i></span>
                                        </div>
                                    </div>
                                    <button type="button" onClick={(event) => { window.openRedeemModal('Thử thách Thợ Săn Tri Thức', 0, 'Đã ghi danh thử thách Thợ Săn Tri Thức! Chúc bạn chinh phục 10 cuốn sách trong tháng.') }} className="w-full py-2.5 rounded-full bg-wine hover:bg-wine-dark text-white font-metadata-spec text-xs font-bold text-center transition-colors shadow-sm">
                                        Tham Gia Ngay
                                    </button>
                                </div>
                            </div>

                            {/* Card 5.4: Reviewer Cừ Khôi */}
                            <div className="offer-card rounded-2xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between relative group">
                                <div className="space-y-3.5">
                                    <div className="relative h-28 w-full rounded-xl overflow-hidden bg-paper-200 dark:bg-night-surface shadow-inner">
                                        <img src="https://images.unsplash.com/photo-1471107340929-a87cd0f5b5f3?q=80&w=400&auto=format&fit=crop" alt="Reviewer Cừ Khôi" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
                                        <span className="absolute top-2.5 right-2.5 font-metadata-spec text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-600 text-white shadow-sm">COMMUNITY STAR</span>
                                        <div className="absolute bottom-2.5 left-2.5 w-9 h-9 rounded-lg bg-amber-600/30 backdrop-blur-md border border-amber-400/50 flex items-center justify-center text-amber-300 text-xl shadow-md">
                                            <i className="ph-bold ph-pen-nib"></i>
                                        </div>
                                    </div>
                                    <div>
                                        <span className="font-metadata-spec text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-paper-200 dark:bg-night-border text-wine dark:text-gold">Cộng Đồng Đọc</span>
                                        <h3 className="font-display font-black text-lg text-ink dark:text-night-text mt-1.5 leading-tight">Reviewer Cừ Khôi</h3>
                                    </div>
                                    <ul className="space-y-1.5 pt-2 text-xs font-metadata-spec text-ink-muted dark:text-night-muted border-t border-paper-border/60 dark:border-night-border/60">
                                        <li className="flex items-center gap-2">
                                            <i className="ph-bold ph-target text-wine dark:text-gold text-sm shrink-0"></i>
                                            <span className="truncate">Viết 5 bài review sách được phê duyệt</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <i className="ph-bold ph-gift text-gold text-sm shrink-0"></i>
                                            <span className="truncate">Thưởng nóng: +15 Khoai tươi vào ví</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <i className="ph-bold ph-star text-gold text-sm shrink-0"></i>
                                            <span className="truncate">Danh hiệu Bút Vàng Độc Giả xuất sắc</span>
                                        </li>
                                    </ul>
                                </div>
                                <div className="pt-3.5 border-t border-paper-border dark:border-night-border mt-3.5">
                                    <div className="flex items-baseline justify-between mb-3.5">
                                        <span className="font-metadata-spec text-xs font-semibold text-ink-muted dark:text-night-muted">Phần thưởng:</span>
                                        <div className="flex items-baseline gap-1.5">
                                            <span className="font-metadata-spec text-2xl font-black text-emerald-600 dark:text-emerald-400">+15</span>
                                            <span className="potato-badge">Khoai <i className="ph-fill ph-coins text-[10px]"></i></span>
                                        </div>
                                    </div>
                                    <button type="button" onClick={(event) => { window.openRedeemModal('Thử thách Reviewer Cừ Khôi', 0, 'Đã ghi danh thử thách Reviewer Cừ Khôi! Hãy chia sẻ cảm nhận về cuốn sách bạn tâm đắc nhất.') }} className="w-full py-2.5 rounded-full bg-wine hover:bg-wine-dark text-white font-metadata-spec text-xs font-bold text-center transition-colors shadow-sm">
                                        Tham Gia Ngay
                                    </button>
                                </div>
                            </div>

                        </div>
                    </section>

                </main>


                {/* ========================================================
                 REDEEM / PURCHASE CONFIRMATION MODAL
                 ======================================================== */}
                <div id="redeem-modal" className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm hidden items-center justify-center p-4">
                    <div className="bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between pb-3 border-b border-paper-border dark:border-night-border">
                            <div className="flex items-center gap-2 text-wine dark:text-gold font-display font-black text-base">
                                <i className="ph-bold ph-ticket text-xl"></i>
                                <span>Xác Nhận Đổi Ưu Đãi</span>
                            </div>
                            <button type="button" onClick={(event) => { window.closeRedeemModal() }} className="text-ink-muted hover:text-ink dark:hover:text-white transition-colors">
                                <i className="ph-bold ph-x text-lg"></i>
                            </button>
                        </div>

                        <div className="space-y-3">
                            <div className="p-4 rounded-xl bg-paper dark:bg-night-surface border border-paper-border dark:border-night-border">
                                <div className="text-xs font-metadata-spec text-ink-muted dark:text-night-muted">Mục ưu đãi:</div>
                                <div className="text-base font-display font-black text-ink dark:text-night-text mt-0.5" id="modal-offer-title">Tên ưu đãi</div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-xs font-metadata-spec">
                                <div className="p-3 rounded-xl bg-paper dark:bg-night-surface border border-paper-border dark:border-night-border">
                                    <span className="text-ink-muted dark:text-night-muted">Chi phí:</span>
                                    <div className="text-sm font-bold text-wine dark:text-gold mt-1" id="modal-offer-cost">0 Khoai</div>
                                </div>
                                <div className="p-3 rounded-xl bg-paper dark:bg-night-surface border border-paper-border dark:border-night-border">
                                    <span className="text-ink-muted dark:text-night-muted">Số dư hiện tại:</span>
                                    <div className="text-sm font-bold text-ink dark:text-night-text mt-1" id="modal-user-balance">1,250 Khoai</div>
                                </div>
                            </div>

                            <p className="font-editorial-body text-xs text-ink-muted dark:text-night-muted" id="modal-helper-text">
                                Sau khi xác nhận, ưu đãi sẽ được kích hoạt tức thì vào tài khoản của bạn.
                            </p>
                        </div>

                        <div className="flex items-center gap-3 pt-3">
                            <button type="button" onClick={(event) => { window.closeRedeemModal() }} className="flex-1 py-2.5 rounded-full border border-paper-border dark:border-night-border hover:bg-paper-200 dark:hover:bg-night-surface font-metadata-spec text-xs font-bold text-ink dark:text-night-text transition-colors">
                                Hủy Bỏ
                            </button>
                            <button type="button" id="modal-confirm-btn" className="flex-1 py-2.5 rounded-full bg-wine hover:bg-wine-dark text-white font-metadata-spec text-xs font-bold transition-colors shadow-sm">
                                Xác Nhận Ngay
                            </button>
                        </div>
                    </div>
                </div>





                {/* ========================================================
                 SMART COMBO BOOK DETAIL POPUP (FLIP TOP/BOTTOM LIKE ADMIN STATS)
                 ======================================================== */}
                <div id="combo-book-popup" className="combo-book-popup" style="position: fixed; display: none;">
                    <div className="flex items-start gap-3">
                        <img id="popup-book-cover" src="" alt="Cover" className="w-16 h-24 object-cover rounded-md shadow-md border border-white/20 shrink-0" />
                        <div className="flex-1 min-w-0 space-y-1">
                            <span id="popup-book-category" className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-gold/20 text-gold border border-gold/30">LỊCH SỬ</span>
                            <h4 id="popup-book-title" className="font-display font-black text-sm text-white leading-snug line-clamp-2">Điện Biên Phủ</h4>
                            <div className="text-[11px] text-slate-300 font-semibold truncate" id="popup-book-author">Võ Nguyên Giáp</div>
                            <div className="flex items-center gap-2 text-[11px] text-amber-400 font-semibold pt-0.5">
                                <span id="popup-book-rating">★ 5.0</span>
                                <span className="text-slate-500">•</span>
                                <span id="popup-book-pages" className="text-slate-300">368 trang</span>
                            </div>
                        </div>
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-white/10 text-xs text-slate-300 font-editorial-body line-clamp-3 leading-relaxed" id="popup-book-summary">
                        Tóm tắt tác phẩm...
                    </div>
                    <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-xs">
                        <span className="text-slate-400">Giá mua/thuê lẻ:</span>
                        <span className="font-bold text-gold" id="popup-book-price">120 Khoai</span>
                    </div>
                </div>


                {/* ========================================================
                 FOOTER: LUXURY 5-COLUMN EDITORIAL FOOTER (ĐỒNG BỘ TRANG CHỦ)
                 ======================================================== */}
                <footer className="border-t border-paper-border dark:border-night-border bg-paper dark:bg-night-bg text-ink dark:text-night-text py-10 sm:py-12 transition-colors">
                    <div className="w-full max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">

                            {/* Col 1 & 2: Brand Info */}
                            <div className="lg:col-span-2 space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-wine flex items-center justify-center text-white shadow-md">
                                        <img src="img/icon-removebg-preview.png" alt="Logo" className="w-7 h-7 object-contain" onError={(event) => { event.currentTarget.src = './image/LOGO HALM BOOK/logo.png' }} />
                                    </div>
                                    <span className="font-display font-black text-2xl tracking-tight text-ink dark:text-night-text">
                                        HALM BOOK
                                    </span>
                                </div>

                                <p className="font-editorial-body text-sm text-ink-muted dark:text-night-muted leading-relaxed max-w-sm">
                                    HALM BOOK - Không gian đọc sách trực tuyến dành cho những tâm trí ham khám phá. Nền tảng kết nối độc giả với tri thức và trợ lý AI thông minh.
                                </p>

                                <div className="space-y-2 text-xs font-metadata-spec text-ink dark:text-night-muted pt-2">
                                    <div className="flex items-center gap-2">
                                        <i className="ph-bold ph-phone text-wine dark:text-gold text-sm"></i>
                                        <span>Hotline: <strong className="text-ink dark:text-night-text">0793503369 / 0909.090.909</strong></span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <i className="ph-bold ph-envelope-simple text-wine dark:text-gold text-sm"></i>
                                        <a href="mailto:halm@book.vn" className="hover:underline">halm@book.vn</a>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <i className="ph-bold ph-map-pin text-wine dark:text-gold text-sm"></i>
                                        <span>03 Quang Trung, Quận Hải Châu, TP. Đà Nẵng</span>
                                    </div>
                                </div>
                            </div>

                            {/* Col 3: Khám Phá */}
                            <div className="space-y-3">
                                <h4 className="font-display font-black text-xs uppercase tracking-wider text-ink dark:text-night-text">
                                    Khám Phá
                                </h4>
                                <ul className="space-y-2 text-xs font-semibold text-ink-muted dark:text-night-muted font-metadata-spec">
                                    <li><a href="home_end.html#trending-section" className="hover:text-wine dark:hover:text-gold transition-colors">Sách Thịnh Hành</a></li>
                                    <li><a href="home_end.html#children-section" className="hover:text-wine dark:hover:text-gold transition-colors">Sách Thiếu Nhi</a></li>
                                    <li><a href="home_end.html#literature-section" className="hover:text-wine dark:hover:text-gold transition-colors">Văn Học & Truyện Dài</a></li>
                                    <li><a href="home_end.html#selfgrowth-section" className="hover:text-wine dark:hover:text-gold transition-colors">Phát Triển Bản Thân</a></li>
                                    <li><a href="home_end.html#topic-section" className="hover:text-wine dark:hover:text-gold transition-colors">Chủ Đề Cảm Hứng</a></li>
                                </ul>
                            </div>

                            {/* Col 4: Dịch Vụ & Hỗ Trợ */}
                            <div className="space-y-3">
                                <h4 className="font-display font-black text-xs uppercase tracking-wider text-ink dark:text-night-text">
                                    Dịch Vụ & Hỗ Trợ
                                </h4>
                                <ul className="space-y-2 text-xs font-semibold text-ink-muted dark:text-night-muted font-metadata-spec">
                                    <li><a href="tiers_end.html" className="hover:text-wine dark:hover:text-gold transition-colors">Gói Hội Viên Đọc Sách</a></li>
                                    <li><a href="book-detail.html" className="hover:text-wine dark:hover:text-gold transition-colors">Trải Nghiệm Đọc Thử</a></li>
                                    <li><a href="cart_end.html" className="hover:text-wine dark:hover:text-gold transition-colors">Giỏ Hàng & Thuê Sách</a></li>
                                    <li><a href="login.html" className="hover:text-wine dark:hover:text-gold transition-colors">Quản Lý Tài Khoản</a></li>
                                    <li><a href="javascript:void(0)" onClick={(event) => { window.openChatbot('Hỗ trợ ưu đãi'); }} className="hover:text-wine dark:hover:text-gold transition-colors">Trợ Giúp AI Trực Tuyến</a></li>
                                </ul>
                            </div>

                            {/* Col 5: Tải Ứng Dụng QR */}
                            <div className="space-y-3">
                                <h4 className="font-display font-black text-xs uppercase tracking-wider text-ink dark:text-night-text">
                                    Ứng Dụng Di Động
                                </h4>
                                <p className="font-editorial-body text-xs text-ink-muted dark:text-night-muted">Quét mã QR để tải ứng dụng HALM BOOK trên iOS và Android:</p>
                                <div className="p-2 rounded-xl bg-white border border-paper-border inline-block shadow-sm">
                                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=HALMBookApp" alt="QR Code" className="w-20 h-20 object-contain" />
                                </div>
                            </div>

                        </div>

                        {/* Bottom Copyright */}
                        <div className="border-t border-paper-border dark:border-night-border mt-8 pt-5 flex flex-col sm:flex-row justify-between items-center text-xs font-metadata-spec text-ink-muted dark:text-night-muted gap-4">
                            <p>© 2026 HALM BOOK. Tất cả bản quyền được bảo lưu.</p>
                            <div className="flex items-center gap-6">
                                <a href="javascript:void(0)" className="hover:underline">Điều khoản sử dụng</a>
                                <a href="javascript:void(0)" className="hover:underline">Chính sách bảo mật</a>
                                <a href="javascript:void(0)" className="hover:underline">Bản quyền tác phẩm</a>
                            </div>
                        </div>
                    </div>
                </footer>


                {/* ========================================================
                 FLOATING SCROLL TO TOP BUTTON
                 ======================================================== */}
                <button id="btnScrollToTop" title="Lên đầu trang" aria-label="Cuộn lên đầu trang">
                    <i className="ph-bold ph-arrow-up text-lg"></i>
                </button>


                {/* ========================================================
                 CHATBOT AI WIDGET (BẢO TOÀN TRỢ LÝ AI)
                 ======================================================== */}
                <div id="chatbot-container">
                    {/* Floating Chat Modal Window */}
                    <div id="chat-window">
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-wine to-wine-light text-white px-5 py-3.5 flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-white p-0.5 shrink-0">
                                    <img src="testhome/img/icon_chatbot.png" alt="Bot" className="w-full h-full rounded-full object-cover" />
                                </div>
                                <div>
                                    <div className="font-display font-bold text-sm tracking-wide leading-tight">Trợ lý ảo HALM BOOK</div>
                                    <div className="font-metadata-spec text-[10px] text-gold font-medium">Tư vấn ưu đãi & gói đọc</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2.5">
                                <button id="refresh-chat" className="hover:text-gold transition-colors" title="Làm mới hội thoại" aria-label="Làm mới hội thoại">
                                    <i className="ph-bold ph-arrows-clockwise text-lg"></i>
                                </button>
                                <button id="close-chat" className="hover:text-gold transition-colors" title="Thu nhỏ" aria-label="Thu nhỏ cửa sổ chat">
                                    <i className="ph-bold ph-x text-lg"></i>
                                </button>
                            </div>
                        </div>

                        {/* Body Message Thread */}
                        <div className="flex-grow overflow-y-auto p-4 flex flex-col relative text-night-text bg-[#181916] text-xs space-y-3" id="chat-body">

                            {/* Welcome View */}
                            <div id="chat-welcome" className="text-center py-6 space-y-3">
                                <div className="w-14 h-14 mx-auto rounded-full bg-wine/20 border border-wine/40 p-1 flex items-center justify-center">
                                    <img src="testhome/img/icon_chatbot.png" alt="Bot" className="w-full h-full rounded-full object-cover" />
                                </div>
                                <h4 className="font-display font-black text-base text-white">Xin chào độc giả!</h4>
                                <p className="font-editorial-body text-xs text-night-muted leading-relaxed">
                                    Tôi là trợ lý AI của HALM BOOK. Bạn muốn tư vấn gói đọc sách nào phù hợp nhất hôm nay?
                                </p>

                                {/* Suggestions buttons */}
                                <div className="space-y-2 pt-2 text-left font-metadata-spec">
                                    <button className="suggestion-btn w-full p-2.5 rounded-xl bg-night-card hover:bg-night-border border border-night-border text-xs text-white flex items-center justify-between transition-colors">
                                        <span>Gói cước nào tiết kiệm nhất cho sinh viên?</span>
                                        <i className="ph-bold ph-arrow-right text-gold"></i>
                                    </button>
                                    <button className="suggestion-btn w-full p-2.5 rounded-xl bg-night-card hover:bg-night-border border border-night-border text-xs text-white flex items-center justify-between transition-colors">
                                        <span>Cách tích lũy thêm Khoai thưởng đọc sách?</span>
                                        <i className="ph-bold ph-arrow-right text-gold"></i>
                                    </button>
                                    <button className="suggestion-btn w-full p-2.5 rounded-xl bg-night-card hover:bg-night-border border border-night-border text-xs text-white flex items-center justify-between transition-colors">
                                        <span>Tiện ích upload tài liệu AI hoạt động ra sao?</span>
                                        <i className="ph-bold ph-arrow-right text-gold"></i>
                                    </button>
                                </div>
                            </div>

                            {/* Message List (Appended dynamically) */}
                            <div id="chat-messages" className="hidden flex-col gap-3"></div>
                        </div>

                        {/* Input Box */}
                        <div className="p-3 bg-[#141512] border-t border-night-border shrink-0">
                            <div className="relative flex items-center">
                                <input type="text" id="chat-input" placeholder="Nhập câu hỏi của bạn..."
                                    className="w-full bg-night-card text-white placeholder-night-muted text-xs rounded-xl pl-3.5 pr-10 py-3 border border-night-border focus:outline-none focus:border-wine transition-colors font-metadata-spec" />
                                <button id="send-btn" className="absolute right-2 text-gold hover:text-white p-1.5 transition-colors" aria-label="Gửi tin">
                                    <i className="ph-bold ph-paper-plane-tilt text-lg"></i>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Floating Chat Launch Button */}
                    <button id="chat-toggle-btn" className="w-14 h-14 rounded-full bg-wine hover:bg-wine-dark text-white p-1 shadow-2xl flex items-center justify-center transition-transform hover:scale-105" aria-label="Mở trợ lý ảo AI">
                        <img src="testhome/img/icon_chatbot.png" alt="Chatbot" className="w-full h-full rounded-full object-cover" />
                    </button>
                </div>


                {/* ========================================================
                 SCRIPTS: THEME, SCROLL, REDEEM MODAL, CHATBOT
                 ======================================================== */}

                {/* Master Header Controller & PotatoBot AI */}
            </div>
        </>
    );
}
