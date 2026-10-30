import React, { useEffect } from 'react';

export default function HistoryEndPage() {
  useEffect(() => {
    if (window.__historyEndPageInitialized) return;
    window.__historyEndPageInitialized = true;

    const scripts =   [
    {
      "src": "https://cdn.tailwindcss.com"
    },
    {
      "src": "https://unpkg.com/@phosphor-icons/web"
    },
    {
      "src": "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"
    },
    {
      "code": "\n        // Khởi tạo theme tức thời tránh nhấp nháy sáng/tối\n        (function() {\n            const savedTheme = localStorage.getItem('theme') || localStorage.getItem('color-theme');\n            if (savedTheme === 'dark') {\n                document.documentElement.classList.add('dark');\n            } else if (savedTheme === 'light') {\n                document.documentElement.classList.remove('dark');\n            }\n        })();\n    "
    },
    {
      "code": "\n        tailwind.config = {\n            darkMode: 'class',\n            theme: {\n                extend: {\n                    fontFamily: {\n                        sans: ['var(--font-ui)', 'sans-serif'],\n                        display: ['var(--font-display)', 'sans-serif'],\n                        metadata: ['var(--font-metadata)', 'sans-serif'],\n                        editorial: ['var(--font-editorial)', 'sans-serif'],\n                    },\n                    colors: {\n                        paper: {\n                            50: '#FAF8F5',\n                            100: '#F5F2EB',\n                            200: '#EAE5D9',\n                            DEFAULT: '#F7F4EE',\n                            surface: '#FFFEFA',\n                            border: '#E3DDD0',\n                        },\n                        ink: {\n                            50: '#F5F5F4',\n                            300: '#A8A6A1',\n                            muted: '#66645E',\n                            DEFAULT: '#1E1F1D',\n                            pure: '#111210',\n                        },\n                        wine: {\n                            DEFAULT: '#8E3038',\n                            light: '#A83B46',\n                            dark: '#6F252C',\n                        },\n                        gold: {\n                            DEFAULT: '#B8860B',\n                            light: '#D4AF37',\n                        },\n                        night: {\n                            bg: '#111210',\n                            surface: '#181916',\n                            card: '#20221E',\n                            border: '#2C2E29',\n                            text: '#EDE9DF',\n                            muted: '#96938B',\n                        }\n                    }\n                }\n            }\n        };\n    "
    },
    {
      "code": "\n        // --- 1. THEME TOGGLE (SYNCED WITH TRANG CHỦ & OFFERS) ---\n        function initStars() {\n            const starryBg = document.getElementById('starry-background');\n            if (!starryBg || starryBg.hasChildNodes()) return;\n            const starCount = 80;\n            for (let i = 0; i < starCount; i++) {\n                const star = document.createElement('div');\n                star.className = 'star';\n                const size = Math.random() * 2.5 + 0.5;\n                star.style.width = `${size}px`;\n                star.style.height = `${size}px`;\n                star.style.top = `${Math.random() * 100}%`;\n                star.style.left = `${Math.random() * 100}%`;\n                star.style.animation = `starTwinkle ${Math.random() * 3 + 2}s infinite ease-in-out ${Math.random() * 3}s`;\n                starryBg.appendChild(star);\n            }\n        }\n\n        // Khởi tạo hiệu ứng bầu trời sao và đồng bộ cho Dark Mode\n        window.initStars = initStars;\n        const currentTheme = localStorage.getItem('theme') || localStorage.getItem('color-theme');\n        if (currentTheme === 'dark' || document.documentElement.classList.contains('dark')) {\n            initStars();\n        }\n\n        // --- 2. SCROLLED NAVBAR & SCROLL TO TOP ---\n        const navbar = document.getElementById('navbar');\n        const btnScrollToTop = document.getElementById('btnScrollToTop');\n\n        window.addEventListener('scroll', () => {\n            const scrollY = window.pageYOffset || document.documentElement.scrollTop;\n            if (scrollY > 30) {\n                navbar.classList.add('scrolled');\n            } else {\n                navbar.classList.remove('scrolled');\n            }\n\n            if (scrollY > 250) {\n                btnScrollToTop.classList.add('show');\n            } else {\n                btnScrollToTop.classList.remove('show');\n            }\n        });\n\n        if (btnScrollToTop) {\n            btnScrollToTop.addEventListener('click', () => {\n                window.scrollTo({ top: 0, behavior: 'smooth' });\n            });\n        }\n\n        // Mobile drawer toggle\n        const mobileMenuBtn = document.getElementById('mobile-menu-btn');\n        const mobileDrawer = document.getElementById('mobile-drawer');\n        if (mobileMenuBtn && mobileDrawer) {\n            mobileMenuBtn.addEventListener('click', () => {\n                mobileDrawer.classList.toggle('hidden');\n            });\n        }\n\n        // --- 3. CHATBOT INTERACTIONS ---\n        const chatWindow = document.getElementById('chat-window');\n        const chatToggleBtn = document.getElementById('chat-toggle-btn');\n        const closeChatBtn = document.getElementById('close-chat');\n        const refreshChatBtn = document.getElementById('refresh-chat');\n        const chatInput = document.getElementById('chat-input');\n        const sendBtn = document.getElementById('send-btn');\n        const chatMessages = document.getElementById('chat-messages');\n        const chatWelcome = document.getElementById('chat-welcome');\n\n        function openChatbot(initialMsg) {\n            chatWindow.classList.add('show');\n            if (initialMsg) {\n                appendUserMessage(initialMsg);\n                setTimeout(() => {\n                    handleBotReply(initialMsg);\n                }, 600);\n            }\n        }\n\n        if (chatToggleBtn) {\n            chatToggleBtn.addEventListener('click', () => {\n                chatWindow.classList.toggle('show');\n            });\n        }\n        if (closeChatBtn) {\n            closeChatBtn.addEventListener('click', () => {\n                chatWindow.classList.remove('show');\n            });\n        }\n        if (refreshChatBtn) {\n            refreshChatBtn.addEventListener('click', () => {\n                chatMessages.innerHTML = '';\n                chatMessages.classList.add('hidden');\n                chatWelcome.classList.remove('hidden');\n            });\n        }\n\n        function appendUserMessage(text) {\n            chatWelcome.classList.add('hidden');\n            chatMessages.classList.remove('hidden');\n            const msg = document.createElement('div');\n            msg.className = 'self-end bg-wine text-white max-w-[80%] rounded-2xl rounded-tr-sm px-3.5 py-2 text-xs font-metadata-spec';\n            msg.textContent = text;\n            chatMessages.appendChild(msg);\n            chatMessages.scrollTop = chatMessages.scrollHeight;\n        }\n\n        function appendBotMessage(text) {\n            const msg = document.createElement('div');\n            msg.className = 'self-start bg-night-card border border-night-border text-night-text max-w-[85%] rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-xs font-editorial-body';\n            msg.innerHTML = text;\n            chatMessages.appendChild(msg);\n            chatMessages.scrollTop = chatMessages.scrollHeight;\n        }\n\n        function handleBotReply(userInput) {\n            const q = userInput.toLowerCase();\n            let reply = \"Tôi có thể hỗ trợ bạn cập nhật thông tin cá nhân, kiểm tra số dư Khoai hoặc hướng dẫn nâng hạng hội viên!\";\n            if (q.includes('hạng') || q.includes('thợ cày')) {\n                reply = \"Hạng hiện tại của bạn là <strong>THỢ CÀY 🌱</strong>. Để nâng lên các hạng cao hơn như Học Giả hay Quý Tộc Sách, bạn có thể tham gia các gói hội viên tại <a href='tiers_end.html' class='text-gold underline'>Gói Hội Viên</a>.\";\n            } else if (q.includes('chỉnh sửa') || q.includes('thay đổi') || q.includes('số điện thoại')) {\n                reply = \"Bạn có thể chỉnh sửa số điện thoại, địa chỉ và thông tin tại trang <a href='change_profile_end.html' class='text-gold underline'>Chỉnh Sửa Thông Tin</a>.\";\n            } else if (q.includes('khoai')) {\n                reply = \"Số dư ví hiện tại của bạn là <strong>350 Khoai Tây</strong>. Bạn có thể dùng Khoai để đổi quà, thuê sách hoặc tham gia các gói cước tại mục <a href='offers_end.html' class='text-gold underline'>Ưu Đãi</a>.\";\n            }\n            appendBotMessage(reply);\n        }\n\n        function sendMessage() {\n            const text = chatInput.value.trim();\n            if (!text) return;\n            appendUserMessage(text);\n            chatInput.value = '';\n            setTimeout(() => {\n                handleBotReply(text);\n            }, 600);\n        }\n\n        if (sendBtn) sendBtn.addEventListener('click', sendMessage);\n        if (chatInput) {\n            chatInput.addEventListener('keydown', (e) => {\n                if (e.key === 'Enter') sendMessage();\n            });\n        }\n\n        document.querySelectorAll('.suggestion-btn').forEach(btn => {\n            btn.addEventListener('click', () => {\n                const text = btn.querySelector('span').textContent;\n                appendUserMessage(text);\n                setTimeout(() => {\n                    handleBotReply(text);\n                }, 600);\n            });\n        });\n    "
    },
    {
      "code": "\n        function switchProfileTab(tab) {\n            const tabInfo = document.getElementById('tab-content-info');\n            const tabHistory = document.getElementById('tab-content-history');\n            const btnInfo = document.getElementById('sidebar-tab-info');\n            const btnHistory = document.getElementById('sidebar-tab-history');\n\n            const activeClasses = ['bg-wine', 'text-white', 'dark:bg-gold', 'dark:text-night-bg', 'shadow-sm'];\n            const inactiveClasses = ['text-ink-muted', 'dark:text-night-muted', 'hover:bg-paper-200', 'dark:hover:bg-night-surface', 'hover:text-ink', 'dark:hover:text-night-text'];\n\n            if (tab === 'history') {\n                if (tabInfo) tabInfo.classList.add('hidden');\n                if (tabHistory) tabHistory.classList.remove('hidden');\n\n                if (btnInfo) {\n                    btnInfo.classList.remove(...activeClasses);\n                    btnInfo.classList.add(...inactiveClasses);\n                }\n                if (btnHistory) {\n                    btnHistory.classList.remove(...inactiveClasses);\n                    btnHistory.classList.add(...activeClasses);\n                }\n                if (history.pushState) {\n                    history.pushState(null, null, '#tab-history');\n                } else {\n                    location.hash = '#tab-history';\n                }\n                window.scrollTo({ top: 0, behavior: 'smooth' });\n            } else {\n                if (tabHistory) tabHistory.classList.add('hidden');\n                if (tabInfo) tabInfo.classList.remove('hidden');\n\n                if (btnHistory) {\n                    btnHistory.classList.remove(...activeClasses);\n                    btnHistory.classList.add(...inactiveClasses);\n                }\n                if (btnInfo) {\n                    btnInfo.classList.remove(...inactiveClasses);\n                    btnInfo.classList.add(...activeClasses);\n                }\n                if (history.pushState) {\n                    history.pushState(null, null, window.location.pathname);\n                } else {\n                    location.hash = '';\n                }\n                window.scrollTo({ top: 0, behavior: 'smooth' });\n            }\n        }\n\n        // Kiểm tra hash khi load trang hoặc hash thay đổi\n        window.addEventListener('DOMContentLoaded', () => {\n            if (window.location.hash === '#tab-history') {\n                switchProfileTab('history');\n            }\n        });\n        window.addEventListener('hashchange', () => {\n            if (window.location.hash === '#tab-history') {\n                switchProfileTab('history');\n            } else {\n                switchProfileTab('info');\n            }\n        });\n\n        // 2. Bộ Lọc Giao Dịch: Loại, Trạng Thái & Thời Gian (Dropdown Tinh Tế, Luxury Editorial)\n        let currentTxType = 'all';\n        let currentTxStatus = 'all';\n        let currentTxTime = '1month';\n        let currentTxSearch = '';\n\n        function toggleTxDropdown(type, event) {\n            if (event) event.stopPropagation();\n            const statusMenu = document.getElementById('tx-status-menu');\n            const timeMenu = document.getElementById('tx-time-menu');\n            const statusCaret = document.getElementById('tx-status-caret');\n            const timeCaret = document.getElementById('tx-time-caret');\n\n            if (type === 'status') {\n                const isOpen = !statusMenu?.classList.contains('hidden');\n                timeMenu?.classList.add('hidden');\n                timeCaret?.classList.remove('rotate-180');\n\n                if (isOpen) {\n                    statusMenu?.classList.add('hidden');\n                    statusCaret?.classList.remove('rotate-180');\n                } else {\n                    statusMenu?.classList.remove('hidden');\n                    statusCaret?.classList.add('rotate-180');\n                }\n            } else if (type === 'time') {\n                const isOpen = !timeMenu?.classList.contains('hidden');\n                statusMenu?.classList.add('hidden');\n                statusCaret?.classList.remove('rotate-180');\n\n                if (isOpen) {\n                    timeMenu?.classList.add('hidden');\n                    timeCaret?.classList.remove('rotate-180');\n                } else {\n                    timeMenu?.classList.remove('hidden');\n                    timeCaret?.classList.add('rotate-180');\n                }\n            }\n        }\n\n        function closeAllTxDropdowns() {\n            const statusMenu = document.getElementById('tx-status-menu');\n            const timeMenu = document.getElementById('tx-time-menu');\n            const statusCaret = document.getElementById('tx-status-caret');\n            const timeCaret = document.getElementById('tx-time-caret');\n\n            statusMenu?.classList.add('hidden');\n            timeMenu?.classList.add('hidden');\n            statusCaret?.classList.remove('rotate-180');\n            timeCaret?.classList.remove('rotate-180');\n        }\n\n        // Đóng dropdown khi click bên ngoài\n        document.addEventListener('click', (e) => {\n            const statusContainer = document.getElementById('tx-status-dropdown-container');\n            const timeContainer = document.getElementById('tx-time-dropdown-container');\n            if (statusContainer && !statusContainer.contains(e.target) && timeContainer && !timeContainer.contains(e.target)) {\n                closeAllTxDropdowns();\n            }\n        });\n\n        function selectTxStatus(statusVal, label) {\n            currentTxStatus = statusVal;\n            const labelEl = document.getElementById('tx-status-label');\n            if (labelEl) {\n                labelEl.textContent = statusVal === 'all' ? 'Tất cả trạng thái' : `Trạng thái: ${label}`;\n            }\n\n            document.querySelectorAll('.tx-status-opt').forEach(opt => {\n                const isSelected = opt.getAttribute('onclick')?.includes(`'${statusVal}'`);\n                const checkIcon = opt.querySelector('.ph-check');\n                if (isSelected) {\n                    opt.className = 'tx-status-opt w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-metadata-spec font-bold text-wine dark:text-gold bg-wine/10 dark:bg-gold/15 transition-colors text-left cursor-pointer';\n                    if (checkIcon) checkIcon.classList.remove('hidden');\n                } else {\n                    opt.className = 'tx-status-opt w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-metadata-spec font-medium text-ink dark:text-night-text hover:bg-paper-200 dark:hover:bg-night-card hover:text-wine dark:hover:text-gold transition-colors text-left cursor-pointer';\n                    if (checkIcon) checkIcon.classList.add('hidden');\n                }\n            });\n\n            closeAllTxDropdowns();\n            applyTxFilters();\n        }\n\n        function selectTxTime(timeVal, label) {\n            currentTxTime = timeVal;\n            const labelEl = document.getElementById('tx-time-label');\n            if (labelEl) {\n                labelEl.textContent = label;\n            }\n\n            document.querySelectorAll('.tx-time-opt').forEach(opt => {\n                const isSelected = opt.getAttribute('onclick')?.includes(`'${timeVal}'`);\n                const checkIcon = opt.querySelector('.ph-check');\n                if (isSelected) {\n                    opt.className = 'tx-time-opt w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-metadata-spec font-bold text-wine dark:text-gold bg-wine/10 dark:bg-gold/15 transition-colors text-left cursor-pointer';\n                    if (checkIcon) checkIcon.classList.remove('hidden');\n                } else {\n                    opt.className = 'tx-time-opt w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-metadata-spec font-medium text-ink dark:text-night-text hover:bg-paper-200 dark:hover:bg-night-card hover:text-wine dark:hover:text-gold transition-colors text-left cursor-pointer';\n                    if (checkIcon) checkIcon.classList.add('hidden');\n                }\n            });\n\n            closeAllTxDropdowns();\n            applyTxFilters();\n        }\n\n        function applyTxFilters() {\n            const rows = document.querySelectorAll('.tx-row');\n            let visibleCount = 0;\n\n            rows.forEach(row => {\n                const type = row.getAttribute('data-type');\n                const status = row.getAttribute('data-status') || '';\n                const time = row.getAttribute('data-time') || '';\n                const search = (row.getAttribute('data-search') || '').toLowerCase();\n\n                const matchType = (currentTxType === 'all' || type === currentTxType);\n                const matchStatus = (currentTxStatus === 'all' || status === currentTxStatus);\n                const matchTime = (currentTxTime === 'all' || time.includes(currentTxTime));\n                const matchSearch = (!currentTxSearch || search.includes(currentTxSearch));\n\n                if (matchType && matchStatus && matchTime && matchSearch) {\n                    row.classList.remove('hidden');\n                    visibleCount++;\n                } else {\n                    row.classList.add('hidden');\n                }\n            });\n\n            const emptyState = document.getElementById('tx-empty-state');\n            const table = document.getElementById('tx-table');\n            const pageInfo = document.getElementById('tx-pagination-info');\n\n            if (visibleCount === 0) {\n                if (emptyState) emptyState.classList.remove('hidden');\n                if (table) table.querySelector('tbody').classList.add('hidden');\n                if (pageInfo) pageInfo.textContent = 'Hiển thị 0 giao dịch';\n            } else {\n                if (emptyState) emptyState.classList.add('hidden');\n                if (table) table.querySelector('tbody').classList.remove('hidden');\n                if (pageInfo) pageInfo.textContent = `Hiển thị 1 - ${visibleCount} trong số ${visibleCount} giao dịch`;\n            }\n        }\n\n        function filterTransactions(type, btnEl) {\n            currentTxType = type;\n            document.querySelectorAll('.tx-filter-btn').forEach(btn => {\n                btn.className = 'tx-filter-btn px-3 py-1.5 rounded-full text-xs font-metadata-spec font-bold transition-all bg-paper dark:bg-night-surface text-ink-muted dark:text-night-muted hover:text-ink dark:hover:text-night-text border border-paper-border dark:border-night-border';\n            });\n            if (btnEl) {\n                btnEl.className = 'tx-filter-btn px-3 py-1.5 rounded-full text-xs font-metadata-spec font-bold transition-all bg-wine text-white dark:bg-gold dark:text-night-bg shadow-sm';\n            }\n            applyTxFilters();\n        }\n\n        function filterTransactionsByTime(timeVal) {\n            selectTxTime(timeVal, timeVal);\n        }\n\n        function searchTransactions(query) {\n            currentTxSearch = (query || '').trim().toLowerCase();\n            applyTxFilters();\n        }\n\n        function resetTxFilter() {\n            currentTxType = 'all';\n            currentTxStatus = 'all';\n            currentTxTime = 'all';\n            currentTxSearch = '';\n            const searchInput = document.getElementById('tx-search-input');\n            if (searchInput) searchInput.value = '';\n            selectTxStatus('all', 'Tất Cả');\n            selectTxTime('all', 'Tất cả thời gian');\n            const firstBtn = document.querySelector('.tx-filter-btn');\n            filterTransactions('all', firstBtn);\n        }\n\n        // 3. Modal Biên Lai Điện Tử\n        function openReceiptModal(code, title, desc, amount, method, time, status) {\n            const modal = document.getElementById('receipt-modal');\n            if (!modal) return;\n            document.getElementById('rc-code').textContent = '#' + code;\n            document.getElementById('rc-title').textContent = title;\n            document.getElementById('rc-desc').textContent = desc;\n            document.getElementById('rc-amount').textContent = amount;\n            document.getElementById('rc-method').textContent = method;\n            document.getElementById('rc-time').textContent = time;\n            document.getElementById('rc-status').textContent = status;\n            modal.classList.remove('hidden');\n        }\n\n        function closeReceiptModal() {\n            const modal = document.getElementById('receipt-modal');\n            if (modal) modal.classList.add('hidden');\n        }\n\n        document.getElementById('receipt-modal')?.addEventListener('click', function(e) {\n            if (e.target === this) closeReceiptModal();\n        });\n    "
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

      if (window.location.hash === '#tab-history' && typeof window.switchProfileTab === 'function') {
        window.switchProfileTab('history');
      }
    };

    loadScripts().catch((error) => {
      console.error('Failed to initialize the history page.', error);
    });
  }, []);

  return (
    <>
      <meta charSet="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>HALM BOOK — Lịch Sử Giao Dịch</title>
          <meta name="description" content="Quản lý lịch sử giao dịch thuê sách, nạp Khoai Tây và gói hội viên trên HALM BOOK." />
      
          {/* STRICT FONT SYSTEM: ONLY INTER, ROBOTO, OPEN SANS */}
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Open+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400;1,600&family=Roboto:wght@300;400;500;700;900&display=swap" rel="stylesheet" />
      
          {/* Tailwind CSS CDN */}
          
      
          {/* Icons: Phosphor Icons & Font Awesome */}
          
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
      
          {/* GSAP for Smooth Motion */}
          
      
          
      
          
      
          <style dangerouslySetInnerHTML={{ __html: "\n        /* ========================================================\n           TYPOGRAPHY & CSS VARIABLES (ĐỒNG BỘ TRANG CHỦ)\n           ======================================================== */\n        :root {\n            --font-display: \"Inter\", sans-serif;\n            --font-ui: \"Inter\", sans-serif;\n            --font-metadata: \"Roboto\", sans-serif;\n            --font-editorial: \"Open Sans\", sans-serif;\n        }\n\n        html {\n            scroll-behavior: smooth;\n        }\n\n        body {\n            font-family: var(--font-ui);\n            background-color: #F7F4EE;\n            color: #1E1F1D;\n            overflow-x: hidden;\n            -webkit-font-smoothing: antialiased;\n            transition: background-color 0.4s ease, color 0.4s ease;\n        }\n\n        .dark body {\n            background-color: #111210;\n            color: #EDE9DF;\n        }\n\n        .font-display-hero {\n            font-family: var(--font-display);\n            font-weight: 900;\n            letter-spacing: -0.03em;\n        }\n\n        .font-editorial-body {\n            font-family: var(--font-editorial);\n            line-height: 1.65;\n        }\n\n        .font-metadata-spec {\n            font-family: var(--font-metadata);\n        }\n\n        /* Paper grain texture */\n        .paper-grain {\n            background-image: radial-gradient(rgba(30, 31, 29, 0.04) 1px, transparent 1px);\n            background-size: 28px 28px;\n        }\n        .dark .paper-grain {\n            background-image: radial-gradient(rgba(237, 233, 223, 0.04) 1px, transparent 1px);\n            background-size: 28px 28px;\n        }\n\n        /* Starry sky overlay for dark mode */\n        #starry-background {\n            position: fixed;\n            top: 0;\n            left: 0;\n            width: 100%;\n            height: 100%;\n            pointer-events: none;\n            z-index: 1;\n            opacity: 0;\n            transition: opacity 0.6s ease;\n        }\n        .dark #starry-background {\n            opacity: 1;\n        }\n        .star {\n            position: absolute;\n            background-color: #fff;\n            border-radius: 50%;\n            pointer-events: none;\n        }\n        @keyframes starTwinkle {\n            0%, 100% { opacity: 0.2; transform: scale(0.8); }\n            50% { opacity: 0.9; transform: scale(1.3); }\n        }\n\n        /* Scrolled Header */\n        #navbar {\n            transition: transform 0.38s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease, padding 0.3s ease;\n            will-change: transform;\n        }\n        #navbar.scrolled {\n            background-color: rgba(247, 244, 238, 0.94);\n            backdrop-filter: blur(16px);\n            border-color: rgba(227, 221, 208, 0.8);\n            box-shadow: 0 4px 20px -4px rgba(0,0,0,0.06);\n        }\n        .dark #navbar.scrolled {\n            background-color: rgba(17, 18, 16, 0.94);\n            border-color: rgba(44, 46, 41, 0.8);\n            box-shadow: 0 4px 25px -4px rgba(0,0,0,0.5);\n        }\n\n        /* Potato Badge */\n        .potato-badge {\n            display: inline-flex;\n            align-items: center;\n            gap: 0.35rem;\n            background: rgba(184, 134, 11, 0.12);\n            color: #B8860B;\n            border: 1px solid rgba(184, 134, 11, 0.25);\n            border-radius: 9999px;\n            padding: 0.25rem 0.65rem;\n            font-size: 0.8rem;\n            font-weight: 700;\n            font-family: var(--font-metadata);\n        }\n        .dark .potato-badge {\n            background: rgba(212, 175, 55, 0.15);\n            color: #D4AF37;\n            border-color: rgba(212, 175, 55, 0.3);\n        }\n\n        /* Chatbot Modal Styling */\n        #chatbot-container {\n            position: fixed;\n            bottom: 24px;\n            right: 24px;\n            z-index: 50;\n        }\n        #chat-window {\n            position: absolute;\n            bottom: 70px;\n            right: 0;\n            width: 360px;\n            height: 480px;\n            max-width: calc(100vw - 32px);\n            background: #181916;\n            border: 1px solid #2C2E29;\n            border-radius: 16px;\n            box-shadow: 0 20px 40px rgba(0,0,0,0.6);\n            display: flex;\n            flex-direction: column;\n            overflow: hidden;\n            transform: scale(0.9) translateY(20px);\n            opacity: 0;\n            pointer-events: none;\n            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);\n            transform-origin: bottom right;\n        }\n        #chat-window.show {\n            transform: scale(1) translateY(0);\n            opacity: 1;\n            pointer-events: auto;\n        }\n\n        /* Floating Scroll to Top */\n        #btnScrollToTop {\n            position: fixed;\n            bottom: 24px;\n            left: 24px;\n            z-index: 40;\n            width: 44px;\n            height: 44px;\n            border-radius: 50%;\n            background: #FFFEFA;\n            color: #1E1F1D;\n            border: 1px solid #E3DDD0;\n            display: flex;\n            align-items: center;\n            justify-content: center;\n            box-shadow: 0 4px 14px rgba(0,0,0,0.08);\n            cursor: pointer;\n            opacity: 0;\n            visibility: hidden;\n            transition: all 0.3s ease;\n        }\n        .dark #btnScrollToTop {\n            background: #20221E;\n            color: #EDE9DF;\n            border-color: #2C2E29;\n            box-shadow: 0 4px 14px rgba(0,0,0,0.4);\n        }\n        #btnScrollToTop.show {\n            opacity: 1;\n            visibility: visible;\n        }\n        #btnScrollToTop:hover {\n            transform: translateY(-3px);\n            background: #8E3038;\n            color: #fff;\n            border-color: #8E3038;\n        }\n        .dark #btnScrollToTop:hover {\n            background: #B8860B;\n            color: #111210;\n            border-color: #B8860B;\n        }\n    " }} />
      <div className="paper-grain relative min-h-screen flex flex-col">
        {/* Starry background in Dark Mode */}
            <div id="starry-background"></div>
        
            {/* ========================================================
                 NAVBAR: EDITORIAL NAVIGATION (ĐỒNG BỘ TRANG CHỦ & ƯU ĐÃI)
                 ======================================================== */}
            <header id="navbar" className="fixed top-0 inset-x-0 z-40 transition-all duration-300 py-3.5 border-b bg-[#FAF8F5]/95 dark:bg-[#111210]/95 backdrop-blur-md border-[#E3DDD0] dark:border-[#2C2E29]">
                <div className="w-full max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3 sm:gap-4 font-nunito">
                    
                    {/* 1. Logo & Thương Hiệu */}
                    <div className="flex items-center shrink-0">
                        <a href="home_end.html" className="flex items-center gap-2.5 group" aria-label="HALM BOOK Trang Chủ">
                            <img src="img/icon-removebg-preview.png" alt="Halm Book Logo" className="w-10 h-10 sm:w-11 sm:h-11 object-contain group-hover:rotate-[-6deg] group-hover:scale-105 transition-transform duration-300 origin-bottom-left" onError={(event) => { event.currentTarget.src='./image/LOGO HALM BOOK/logo.png' }} />
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
                                <input type="text" id="header-search-input" placeholder="Tìm tác phẩm, tác giả hoặc chủ đề..." onInput={(event) => { if(typeof handleSearch === 'function'){ window.handleSearch(event.currentTarget.value); } else if(window.handleGlobalHeaderSearch){ window.handleGlobalHeaderSearch(event.currentTarget.value); } }} className="w-full pl-9 pr-10 py-1.5 sm:py-2 rounded-full border border-[#D4AF37] dark:border-[#E5A93C] bg-[#FAF8F5]/90 dark:bg-[#181916]/90 focus:outline-none focus:border-[#8B4A3C] dark:focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/50 text-[#242321] dark:text-[#EDE9DF] placeholder-[#85817A] transition-all font-medium text-xs shadow-sm" autoComplete="off" />
                                <button type="button" id="clear-search-btn" className="hidden absolute right-3 text-[#85817A] hover:text-[#8B4A3C] dark:hover:text-[#E5A93C]" onClick={(event) => { if(typeof clearSearch === 'function'){ window.clearSearch(); } else if(window.clearGlobalHeaderSearch){ window.clearGlobalHeaderSearch(); } }}>
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
                                    <a href="javascript:void(0)" onClick={(event) => { if(window.openNotificationModal) window.window.openNotificationModal(); else if(window.toggleNotificationModal) window.window.toggleNotificationModal(); else window.location.href='notification.html'; }} className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-[#242321] dark:text-[#EDE9DF] hover:bg-[#FAF8F5] dark:hover:bg-[#20221E] hover:text-[#8B4A3C] dark:hover:text-[#D4AF37] transition-colors">
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
                        <button type="button" onClick={(event) => { if(window.openChatbot) window.window.openChatbot('Xin chào Trợ lý HALM BOOK!'); }} className="py-2 text-wine dark:text-gold flex items-center gap-2 text-left font-bold cursor-pointer"><i className="ph-bold ph-sparkle"></i> Trợ Lý Robot Khoai Tây AI</button>
                        <a href="profile_end.html" className="py-2 text-ink dark:text-night-text hover:text-wine flex items-center gap-2"><i className="ph-bold ph-user text-wine"></i> Tài Khoản Cá Nhân</a>
                    </div>
                </div>
            </header>
        
        
            {/* ========================================================
                 MAIN DASHBOARD CONTAINER: GỌN GÀNG, KHÔNG KHOẢNG TRỐNG THỪA
                 ======================================================== */}
            <main className="w-full max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12 sm:pt-28 sm:pb-16 flex-1">
                <div className="flex flex-col lg:flex-row gap-6 items-start">
                    
                    {/* ====================================================
                         SIDEBAR TRÁI: HỒ SƠ & ĐIỀU HƯỚNG TÀI KHOẢN
                         ==================================================== */}
                    <aside className="w-full lg:w-80 shrink-0 space-y-5">
                        
                        {/* Profile Avatar Card */}
                        <div className="rounded-2xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border p-6 shadow-sm flex flex-col items-center text-center relative overflow-hidden group">
                            {/* Subtle ambient aura behind avatar */}
                            <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-36 h-36 bg-wine/10 dark:bg-gold/10 rounded-full blur-2xl pointer-events-none"></div>
        
                            {/* Avatar */}
                            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-wine to-wine-light dark:from-gold dark:to-gold-light p-1 shadow-md mb-3.5 relative">
                                <div className="w-full h-full rounded-full bg-paper-surface dark:bg-night-surface flex items-center justify-center font-display font-black text-2xl text-wine dark:text-gold">
                                    A
                                </div>
                                <span className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white dark:border-night-card flex items-center justify-center text-[10px] text-white" title="Trực tuyến">
                                    <i className="ph-bold ph-check text-[9px]"></i>
                                </span>
                            </div>
        
                            {/* Name & Handle */}
                            <h2 className="font-display font-black text-lg text-ink dark:text-night-text leading-tight">
                                Alex Nguyễn
                            </h2>
                            <p className="font-metadata-spec text-xs text-ink-muted dark:text-night-muted mt-0.5">
                                @alex.ng99
                            </p>
        
                            {/* Membership Badge */}
                            <a href="tiers_end.html" className="mt-3.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-wine/10 text-wine dark:bg-gold/15 dark:text-gold border border-wine/25 dark:border-gold/30 text-xs font-metadata-spec font-bold hover:scale-105 transition-transform" title="Xem quyền lợi hội viên">
                                <i className="ph-bold ph-plant text-emerald-600 dark:text-emerald-400"></i>
                                <span>THỢ CÀY 🌱</span>
                            </a>
        
                            {/* Quick Reader Stats */}
                            <div className="grid grid-cols-2 gap-2 w-full pt-4 mt-4 border-t border-paper-border dark:border-night-border text-center">
                                <div className="p-2 rounded-xl bg-paper dark:bg-night-surface border border-paper-border dark:border-night-border">
                                    <span className="block font-metadata-spec text-base font-black text-ink dark:text-night-text">350</span>
                                    <span className="font-metadata-spec text-[10px] text-ink-muted dark:text-night-muted">Khoai Tích Lũy</span>
                                </div>
                                <div className="p-2 rounded-xl bg-paper dark:bg-night-surface border border-paper-border dark:border-night-border">
                                    <span className="block font-metadata-spec text-base font-black text-ink dark:text-night-text">12</span>
                                    <span className="font-metadata-spec text-[10px] text-ink-muted dark:text-night-muted">Sách Trong Tủ</span>
                                </div>
                            </div>
                        </div>
        
                        {/* Navigation Links */}
                        <div className="rounded-2xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border p-3 shadow-sm space-y-1">
                            <a href="#" className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-metadata-spec font-bold text-ink-muted dark:text-night-muted hover:bg-paper-200 dark:hover:bg-night-surface hover:text-ink dark:hover:text-night-text transition-colors">
                                <i className="ph-bold ph-chart-line-up text-base text-ink-muted dark:text-night-muted"></i>
                                <span>Bảng Điều Khiển</span>
                            </a>
        
                            <a href="my-books_end.html" className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-metadata-spec font-bold text-ink-muted dark:text-night-muted hover:bg-paper-200 dark:hover:bg-night-surface hover:text-ink dark:hover:text-night-text transition-colors">
                                <i className="ph-bold ph-books text-base text-ink-muted dark:text-night-muted"></i>
                                <span>Tủ Sách Của Tôi</span>
                            </a>
        
                            <a href="offers_end.html" className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-metadata-spec font-bold text-ink-muted dark:text-night-muted hover:bg-paper-200 dark:hover:bg-night-surface hover:text-ink dark:hover:text-night-text transition-colors">
                                <div className="flex items-center gap-3">
                                    <i className="ph-bold ph-wallet text-base text-ink-muted dark:text-night-muted"></i>
                                    <span>Ví Khoai Tây</span>
                                </div>
                                <span className="potato-badge text-[11px] py-0 px-2">350 🥔</span>
                            </a>
        
                            {/* Active Item: Lịch Sử Giao Dịch */}
                            <a href="history_end.html" id="sidebar-tab-history" className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-metadata-spec font-bold bg-wine text-white dark:bg-gold dark:text-night-bg shadow-sm transition-colors cursor-pointer">
                                <i className="ph-bold ph-clock-counter-clockwise text-base"></i>
                                <span>Lịch Sử Giao Dịch</span>
                            </a>
        
                            <a href="profile_end.html" id="sidebar-tab-info" className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-metadata-spec font-bold text-ink-muted dark:text-night-muted hover:bg-paper-200 dark:hover:bg-night-surface hover:text-ink dark:hover:text-night-text transition-colors cursor-pointer">
                                <i className="ph-bold ph-user text-base"></i>
                                <span>Thông Tin Cá Nhân</span>
                            </a>
        
                            <div className="pt-2 border-t border-paper-border dark:border-night-border mt-2">
                                <a href="login.html" className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-metadata-spec font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors">
                                    <i className="ph-bold ph-sign-out text-base"></i>
                                    <span>Đăng Xuất</span>
                                </a>
                            </div>
                        </div>
        
                    </aside>
        
        
                    {/* ====================================================
                         NỘI DUNG CHÍNH: CHI TIẾT THÔNG TIN CÁ NHÂN
                         ==================================================== */}
                    <div className="flex-1 min-w-0 w-full space-y-5">
                        
                        {/* NỘI DUNG CHÍNH: LỊCH SỬ GIAO DỊCH */}
                        <div id="tab-content-history" className="space-y-5">
                            
                            {/* 1. Header Bar & Breadcrumb */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-paper-border dark:border-night-border">
                                <div>
                                    <div className="flex items-center gap-2 text-xs font-metadata-spec text-ink-muted dark:text-night-muted mb-1">
                                        <a href="home_end.html" className="hover:underline">Trang chủ</a>
                                        <i className="ph-bold ph-caret-right text-[10px]"></i>
                                        <a href="profile_end.html" className="hover:underline">Hồ sơ cá nhân</a>
                                        <i className="ph-bold ph-caret-right text-[10px]"></i>
                                        <span className="text-wine dark:text-gold font-bold">Lịch sử giao dịch</span>
                                    </div>
                                    <h1 className="font-display font-black text-2xl sm:text-3xl text-ink dark:text-night-text tracking-tight flex items-center gap-2.5">
                                        <span>Lịch Sử Giao Dịch</span>
                                        <span id="tx-badge-count" className="text-xs font-metadata-spec font-bold px-2.5 py-0.5 rounded-full bg-wine/10 text-wine dark:bg-gold/15 dark:text-gold border border-wine/20 dark:border-gold/30">5 giao dịch gần nhất</span>
                                    </h1>
                                </div>
        
                                {/* Action Button: Nạp Thêm Khoai */}
                                <div className="flex items-center gap-2.5">
                                    <a href="offers_end.html" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-wine hover:bg-wine-dark text-white font-metadata-spec text-xs font-bold transition-all shadow-sm">
                                        <i className="ph-bold ph-plus-circle text-sm"></i>
                                        <span>Nạp Thêm Khoai</span>
                                    </a>
                                </div>
                            </div>
        
                            {/* 2. Thống Kê Tổng Quan 4 Thẻ */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                                <div className="p-4 rounded-2xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border shadow-sm flex items-center gap-3">
                                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gold/15 text-gold flex items-center justify-center text-xl shrink-0">
                                        <i className="ph-bold ph-wallet"></i>
                                    </div>
                                    <div className="min-w-0">
                                        <span className="font-metadata-spec text-[10px] text-ink-muted dark:text-night-muted block uppercase tracking-wider font-extrabold">Số Dư Khả Dụng</span>
                                        <div className="font-display font-black text-lg sm:text-xl text-ink dark:text-night-text flex items-baseline gap-1">
                                            <span>350</span>
                                            <span className="text-xs font-bold text-wine dark:text-gold">🥔 Khoai</span>
                                        </div>
                                    </div>
                                </div>
        
                                <div className="p-4 rounded-2xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border shadow-sm flex items-center gap-3">
                                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-wine/10 dark:bg-rose-950/40 text-wine dark:text-rose-400 flex items-center justify-center text-xl shrink-0">
                                        <i className="ph-bold ph-receipt"></i>
                                    </div>
                                    <div className="min-w-0">
                                        <span className="font-metadata-spec text-[10px] text-ink-muted dark:text-night-muted block uppercase tracking-wider font-extrabold">Tổng Đã Tiêu</span>
                                        <div className="font-display font-black text-lg sm:text-xl text-ink dark:text-night-text flex items-baseline gap-1">
                                            <span>485</span>
                                            <span className="text-xs font-bold text-wine dark:text-gold">🥔 Khoai</span>
                                        </div>
                                    </div>
                                </div>
        
                                <div className="p-4 rounded-2xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border shadow-sm flex items-center gap-3">
                                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl shrink-0">
                                        <i className="ph-bold ph-check-circle"></i>
                                    </div>
                                    <div className="min-w-0">
                                        <span className="font-metadata-spec text-[10px] text-ink-muted dark:text-night-muted block uppercase tracking-wider font-extrabold">Đơn Hoàn Tất</span>
                                        <div className="font-display font-black text-lg sm:text-xl text-ink dark:text-night-text flex items-baseline gap-1">
                                            <span>18</span>
                                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Đơn</span>
                                        </div>
                                    </div>
                                </div>
        
                                <div className="p-4 rounded-2xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border shadow-sm flex items-center gap-3">
                                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xl shrink-0">
                                        <i className="ph-bold ph-piggy-bank"></i>
                                    </div>
                                    <div className="min-w-0">
                                        <span className="font-metadata-spec text-[10px] text-ink-muted dark:text-night-muted block uppercase tracking-wider font-extrabold">Đã Tiết Kiệm</span>
                                        <div className="font-display font-black text-lg sm:text-xl text-ink dark:text-night-text flex items-baseline gap-1">
                                            <span>145k</span>
                                            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">VNĐ</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
        
                            {/* 3. Thanh Bộ Lọc & Tìm Kiếm Giao Dịch */}
                            <div className="rounded-2xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border p-4 shadow-sm space-y-3.5">
                                <div className="flex items-center justify-between flex-wrap gap-2.5 pb-3 border-b border-paper-border/60 dark:border-night-border">
                                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                                        <button type="button" onClick={(event) => { window.filterTransactions('all', event.currentTarget) }} className="tx-filter-btn px-3 py-1.5 rounded-full text-xs font-metadata-spec font-bold transition-all bg-wine text-white dark:bg-gold dark:text-night-bg shadow-sm">
                                            Tất Cả (5)
                                        </button>
                                        <button type="button" onClick={(event) => { window.filterTransactions('rental', event.currentTarget) }} className="tx-filter-btn px-3 py-1.5 rounded-full text-xs font-metadata-spec font-bold transition-all bg-paper dark:bg-night-surface text-ink-muted dark:text-night-muted hover:text-ink dark:hover:text-night-text border border-paper-border dark:border-night-border">
                                            Thuê Sách (3)
                                        </button>
                                        <button type="button" onClick={(event) => { window.filterTransactions('deposit', event.currentTarget) }} className="tx-filter-btn px-3 py-1.5 rounded-full text-xs font-metadata-spec font-bold transition-all bg-paper dark:bg-night-surface text-ink-muted dark:text-night-muted hover:text-ink dark:hover:text-night-text border border-paper-border dark:border-night-border">
                                            Nạp Khoai (1)
                                        </button>
                                        <button type="button" onClick={(event) => { window.filterTransactions('membership', event.currentTarget) }} className="tx-filter-btn px-3 py-1.5 rounded-full text-xs font-metadata-spec font-bold transition-all bg-paper dark:bg-night-surface text-ink-muted dark:text-night-muted hover:text-ink dark:hover:text-night-text border border-paper-border dark:border-night-border">
                                            Hội Viên (1)
                                        </button>
                                    </div>
        
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {/* 1. Bộ lọc Trạng Thái (Custom Dropdown Tinh Tế) */}
                                        <div className="relative inline-block text-left" id="tx-status-dropdown-container">
                                            <button type="button" id="tx-status-trigger" onClick={(event) => { window.toggleTxDropdown('status', event) }} className="inline-flex items-center gap-2 text-xs font-metadata-spec font-bold px-3.5 py-1.5 rounded-full border border-paper-border dark:border-night-border bg-paper dark:bg-night-surface text-ink dark:text-night-text hover:border-wine dark:hover:border-gold focus:outline-none transition-all shadow-sm cursor-pointer group" aria-expanded="false" title="Lọc theo trạng thái">
                                                <i className="ph-bold ph-funnel text-ink-muted dark:text-night-muted group-hover:text-wine dark:group-hover:text-gold text-xs transition-colors"></i>
                                                <span id="tx-status-label">Tất cả trạng thái</span>
                                                <i className="ph-bold ph-caret-down text-[10px] text-ink-muted dark:text-night-muted transition-transform duration-200" id="tx-status-caret"></i>
                                            </button>
        
                                            {/* Menu Dropdown Trạng Thái Bo Tròn Tinh Tế */}
                                            <div id="tx-status-menu" className="hidden absolute right-0 mt-1.5 w-48 rounded-2xl bg-paper-surface dark:bg-night-surface border border-paper-border dark:border-night-border shadow-xl p-1.5 z-30 transition-all font-metadata-spec">
                                                <button type="button" onClick={(event) => { window.selectTxStatus('all', 'Tất Cả') }} className="tx-status-opt w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-metadata-spec font-bold text-wine dark:text-gold bg-wine/10 dark:bg-gold/15 transition-colors text-left cursor-pointer">
                                                    <span>Tất cả trạng thái</span>
                                                    <i className="ph-bold ph-check text-wine dark:text-gold text-xs"></i>
                                                </button>
                                                <button type="button" onClick={(event) => { window.selectTxStatus('renting', 'Đang Thuê') }} className="tx-status-opt w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-metadata-spec font-medium text-ink dark:text-night-text hover:bg-paper-200 dark:hover:bg-night-card hover:text-wine dark:hover:text-gold transition-colors text-left cursor-pointer">
                                                    <span className="flex items-center gap-2">
                                                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Đang Thuê
                                                    </span>
                                                    <i className="ph-bold ph-check text-wine dark:text-gold text-xs hidden"></i>
                                                </button>
                                                <button type="button" onClick={(event) => { window.selectTxStatus('success', 'Thành Công') }} className="tx-status-opt w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-metadata-spec font-medium text-ink dark:text-night-text hover:bg-paper-200 dark:hover:bg-night-card hover:text-wine dark:hover:text-gold transition-colors text-left cursor-pointer">
                                                    <span className="flex items-center gap-2">
                                                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Thành Công
                                                    </span>
                                                    <i className="ph-bold ph-check text-wine dark:text-gold text-xs hidden"></i>
                                                </button>
                                                <button type="button" onClick={(event) => { window.selectTxStatus('active', 'Đang Kích Hoạt') }} className="tx-status-opt w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-metadata-spec font-medium text-ink dark:text-night-text hover:bg-paper-200 dark:hover:bg-night-card hover:text-wine dark:hover:text-gold transition-colors text-left cursor-pointer">
                                                    <span className="flex items-center gap-2">
                                                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Đang Kích Hoạt
                                                    </span>
                                                    <i className="ph-bold ph-check text-wine dark:text-gold text-xs hidden"></i>
                                                </button>
                                                <button type="button" onClick={(event) => { window.selectTxStatus('returned', 'Đã Trả Sách') }} className="tx-status-opt w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-metadata-spec font-medium text-ink dark:text-night-text hover:bg-paper-200 dark:hover:bg-night-card hover:text-wine dark:hover:text-gold transition-colors text-left cursor-pointer">
                                                    <span className="flex items-center gap-2">
                                                        <span className="w-2 h-2 rounded-full bg-ink-muted dark:bg-night-muted"></span> Đã Trả Sách
                                                    </span>
                                                    <i className="ph-bold ph-check text-wine dark:text-gold text-xs hidden"></i>
                                                </button>
                                            </div>
                                        </div>
        
                                        {/* 2. Bộ lọc Thời Gian (Custom Dropdown Tinh Tế, Bo Tròn, Thay Thế Select Hệ Thống Thô Cứng) */}
                                        <div className="relative inline-block text-left" id="tx-time-dropdown-container">
                                            <button type="button" id="tx-time-trigger" onClick={(event) => { window.toggleTxDropdown('time', event) }} className="inline-flex items-center gap-2 text-xs font-metadata-spec font-bold px-3.5 py-1.5 rounded-full border border-paper-border dark:border-night-border bg-paper dark:bg-night-surface text-ink dark:text-night-text hover:border-wine dark:hover:border-gold focus:outline-none transition-all shadow-sm cursor-pointer group" aria-expanded="false" title="Lọc theo thời gian">
                                                <i className="ph-bold ph-calendar-blank text-ink-muted dark:text-night-muted group-hover:text-wine dark:group-hover:text-gold text-xs transition-colors"></i>
                                                <span id="tx-time-label">1 tháng gần đây</span>
                                                <i className="ph-bold ph-caret-down text-[10px] text-ink-muted dark:text-night-muted transition-transform duration-200" id="tx-time-caret"></i>
                                            </button>
        
                                            {/* Menu Dropdown Thời Gian Bo Tròn Tinh Tế */}
                                            <div id="tx-time-menu" className="hidden absolute right-0 mt-1.5 w-48 rounded-2xl bg-paper-surface dark:bg-night-surface border border-paper-border dark:border-night-border shadow-xl p-1.5 z-30 transition-all font-metadata-spec">
                                                <button type="button" onClick={(event) => { window.selectTxTime('1week', '1 tuần gần đây') }} className="tx-time-opt w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-metadata-spec font-medium text-ink dark:text-night-text hover:bg-paper-200 dark:hover:bg-night-card hover:text-wine dark:hover:text-gold transition-colors text-left cursor-pointer">
                                                    <span>1 tuần gần đây</span>
                                                    <i className="ph-bold ph-check text-wine dark:text-gold text-xs hidden"></i>
                                                </button>
                                                <button type="button" onClick={(event) => { window.selectTxTime('1month', '1 tháng gần đây') }} className="tx-time-opt w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-metadata-spec font-bold text-wine dark:text-gold bg-wine/10 dark:bg-gold/15 transition-colors text-left cursor-pointer">
                                                    <span>1 tháng gần đây</span>
                                                    <i className="ph-bold ph-check text-wine dark:text-gold text-xs"></i>
                                                </button>
                                                <button type="button" onClick={(event) => { window.selectTxTime('6months', '6 tháng gần đây') }} className="tx-time-opt w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-metadata-spec font-medium text-ink dark:text-night-text hover:bg-paper-200 dark:hover:bg-night-card hover:text-wine dark:hover:text-gold transition-colors text-left cursor-pointer">
                                                    <span>6 tháng gần đây</span>
                                                    <i className="ph-bold ph-check text-wine dark:text-gold text-xs hidden"></i>
                                                </button>
                                                <button type="button" onClick={(event) => { window.selectTxTime('1year', '1 năm gần đây') }} className="tx-time-opt w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-metadata-spec font-medium text-ink dark:text-night-text hover:bg-paper-200 dark:hover:bg-night-card hover:text-wine dark:hover:text-gold transition-colors text-left cursor-pointer">
                                                    <span>1 năm gần đây</span>
                                                    <i className="ph-bold ph-check text-wine dark:text-gold text-xs hidden"></i>
                                                </button>
                                                <div className="my-1 border-t border-paper-border/60 dark:border-night-border"></div>
                                                <button type="button" onClick={(event) => { window.selectTxTime('all', 'Tất cả thời gian') }} className="tx-time-opt w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-metadata-spec font-medium text-ink dark:text-night-text hover:bg-paper-200 dark:hover:bg-night-card hover:text-wine dark:hover:text-gold transition-colors text-left cursor-pointer">
                                                    <span>Tất cả thời gian</span>
                                                    <i className="ph-bold ph-check text-wine dark:text-gold text-xs hidden"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
        
                                {/* Ô tìm kiếm bo tròn tinh tế (rounded-full) thay vì ô vuông */}
                                <div className="relative w-full">
                                    <i className="ph-bold ph-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted dark:text-night-muted text-sm"></i>
                                    <input type="text" id="tx-search-input" onInput={(event) => { window.searchTransactions(event.currentTarget.value) }} placeholder="Tìm kiếm theo mã giao dịch (#TX-...), tên sách hoặc gói dịch vụ..." className="w-full pl-9 pr-4 py-2 rounded-full bg-paper dark:bg-night-surface border border-paper-border dark:border-night-border text-xs font-metadata-spec font-medium text-ink dark:text-night-text placeholder:text-ink-muted dark:placeholder:text-night-muted focus:outline-none focus:border-wine dark:focus:border-gold shadow-sm transition-all" />
                                </div>
                            </div>
        
                            {/* 4. Danh Sách Giao Dịch Chi Tiết */}
                            <div className="rounded-2xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border shadow-sm overflow-hidden">
                                
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse" id="tx-table">
                                        <thead>
                                            <tr className="border-b border-paper-border dark:border-night-border bg-paper/60 dark:bg-night-surface text-[11px] font-metadata-spec font-extrabold uppercase tracking-wider text-ink-muted dark:text-night-muted">
                                                <th className="py-3 px-4">Giao Dịch</th>
                                                <th className="py-3 px-4">Thời Gian</th>
                                                <th className="py-3 px-4">Phương Thức</th>
                                                <th className="py-3 px-4 text-right">Biến Động</th>
                                                <th className="py-3 px-4 text-center">Trạng Thái</th>
                                                <th className="py-3 px-4 text-center">Thao Tác</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-paper-border/60 dark:divide-night-border text-xs font-metadata-spec" id="tx-tbody">
                                            
                                            {/* Giao Dịch 1 */}
                                            <tr className="tx-row hover:bg-paper-100/50 dark:hover:bg-white/[0.02] transition-colors" data-type="rental" data-status="renting" data-time="1week 1month 6months 1year" data-search="TX-HLM89214 Ngày Xưa Có Một Chuyện Tình Nguyễn Nhật Ánh">
                                                <td className="py-3.5 px-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-14 rounded-lg bg-paper dark:bg-night-surface overflow-hidden border border-paper-border dark:border-night-border shrink-0 shadow-sm">
                                                            <img src="img/nxcmctbt_1.webp" alt="Ngày Xưa Có Một Chuyện Tình" className="w-full h-full object-cover" onError={(event) => { event.currentTarget.src='https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=200&auto=format&fit=crop' }} />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <h4 className="font-bold text-ink dark:text-night-text truncate hover:text-wine dark:hover:text-gold transition-colors">Ngày Xưa Có Một Chuyện Tình</h4>
                                                            <p className="text-[11px] text-ink-muted dark:text-night-muted mt-0.5 truncate">Thuê sách 14 ngày • Hạn trả 01/11/2026</p>
                                                            <span className="inline-flex items-center gap-1 text-[10px] text-wine dark:text-gold font-bold mt-1">
                                                                <i className="ph-bold ph-book-open"></i> Sách Văn Học
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3.5 px-4 whitespace-nowrap">
                                                    <div className="font-bold text-ink dark:text-night-text">18/10/2026</div>
                                                    <div className="text-[11px] text-ink-muted dark:text-night-muted mt-0.5">14:30</div>
                                                </td>
                                                <td className="py-3.5 px-4 whitespace-nowrap">
                                                    <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-paper dark:bg-night-surface border border-paper-border dark:border-night-border font-bold text-xs">
                                                        <i className="ph-bold ph-wallet text-gold"></i>
                                                        <span>Ví Khoai Tây</span>
                                                    </div>
                                                </td>
                                                <td className="py-3.5 px-4 whitespace-nowrap text-right">
                                                    <span className="font-black text-rose-600 dark:text-rose-400 text-sm">- 15 🥔</span>
                                                    <span className="block text-[10px] text-ink-muted dark:text-night-muted mt-0.5">~15.000đ</span>
                                                </td>
                                                <td className="py-3.5 px-4 whitespace-nowrap text-center">
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 font-bold text-[10px]">
                                                        <i className="ph-bold ph-clock"></i> Đang Thuê
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-4 whitespace-nowrap text-center">
                                                    <button type="button" onClick={(event) => { window.openReceiptModal('TX-HLM89214', 'Ngày Xưa Có Một Chuyện Tình', 'Thuê 14 ngày (Hạn trả: 01/11/2026)', '15 🥔 (~15.000đ)', 'Ví Khoai Tây', '18/10/2026 14:30', 'Đang Thuê') }} className="px-2.5 py-1 rounded-lg hover:bg-paper-200 dark:hover:bg-night-surface text-wine dark:text-gold font-bold hover:underline transition-colors cursor-pointer text-xs">
                                                        Xem Biên Lai
                                                    </button>
                                                </td>
                                            </tr>
        
                                            {/* Giao Dịch 2 */}
                                            <tr className="tx-row hover:bg-paper-100/50 dark:hover:bg-white/[0.02] transition-colors" data-type="rental" data-status="renting" data-time="1week 1month 6months 1year" data-search="TX-HLM84102 Cây Cam Ngọt Của Tôi José Mauro">
                                                <td className="py-3.5 px-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-14 rounded-lg bg-paper dark:bg-night-surface overflow-hidden border border-paper-border dark:border-night-border shrink-0 shadow-sm">
                                                            <img src="https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=200&auto=format&fit=crop" alt="Cây Cam Ngọt Của Tôi" className="w-full h-full object-cover" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <h4 className="font-bold text-ink dark:text-night-text truncate hover:text-wine dark:hover:text-gold transition-colors">Cây Cam Ngọt Của Tôi</h4>
                                                            <p className="text-[11px] text-ink-muted dark:text-night-muted mt-0.5 truncate">Thuê sách 30 ngày • Hạn trả 14/11/2026</p>
                                                            <span className="inline-flex items-center gap-1 text-[10px] text-wine dark:text-gold font-bold mt-1">
                                                                <i className="ph-bold ph-book-open"></i> Sách Thiếu Nhi & Cảm Xúc
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3.5 px-4 whitespace-nowrap">
                                                    <div className="font-bold text-ink dark:text-night-text">15/10/2026</div>
                                                    <div className="text-[11px] text-ink-muted dark:text-night-muted mt-0.5">09:15</div>
                                                </td>
                                                <td className="py-3.5 px-4 whitespace-nowrap">
                                                    <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-paper dark:bg-night-surface border border-paper-border dark:border-night-border font-bold text-xs">
                                                        <i className="ph-bold ph-wallet text-gold"></i>
                                                        <span>Ví Khoai Tây</span>
                                                    </div>
                                                </td>
                                                <td className="py-3.5 px-4 whitespace-nowrap text-right">
                                                    <span className="font-black text-rose-600 dark:text-rose-400 text-sm">- 25 🥔</span>
                                                    <span className="block text-[10px] text-ink-muted dark:text-night-muted mt-0.5">~25.000đ</span>
                                                </td>
                                                <td className="py-3.5 px-4 whitespace-nowrap text-center">
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 font-bold text-[10px]">
                                                         <i className="ph-bold ph-clock"></i> Đang Thuê
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-4 whitespace-nowrap text-center">
                                                    <button type="button" onClick={(event) => { window.openReceiptModal('TX-HLM84102', 'Cây Cam Ngọt Của Tôi', 'Thuê 30 ngày (Hạn trả: 14/11/2026)', '25 🥔 (~25.000đ)', 'Ví Khoai Tây', '15/10/2026 09:15', 'Đang Thuê') }} className="px-2.5 py-1 rounded-lg hover:bg-paper-200 dark:hover:bg-night-surface text-wine dark:text-gold font-bold hover:underline transition-colors cursor-pointer text-xs">
                                                        Xem Biên Lai
                                                    </button>
                                                </td>
                                            </tr>
        
                                            {/* Giao Dịch 3: Nạp Khoai */}
                                            <tr className="tx-row hover:bg-paper-100/50 dark:hover:bg-white/[0.02] transition-colors" data-type="deposit" data-status="success" data-time="1week 1month 6months 1year" data-search="TX-HLM78233 Nạp Khoai Tây Ưu Đãi VNPay QR">
                                                <td className="py-3.5 px-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-gold/15 text-gold flex items-center justify-center text-xl shrink-0 border border-gold/30">
                                                            <i className="ph-bold ph-lightning"></i>
                                                        </div>
                                                        <div className="min-w-0">
                                                            <h4 className="font-bold text-ink dark:text-night-text truncate hover:text-wine dark:hover:text-gold transition-colors">Nạp Khoai Tây Siêu Cấp</h4>
                                                            <p className="text-[11px] text-ink-muted dark:text-night-muted mt-0.5 truncate">Gói nạp 200.000đ • Thưởng +20 Khoai VIP</p>
                                                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1">
                                                                <i className="ph-bold ph-sparkle"></i> Ưu Đãi Độc Quyền
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3.5 px-4 whitespace-nowrap">
                                                    <div className="font-bold text-ink dark:text-night-text">12/10/2026</div>
                                                    <div className="text-[11px] text-ink-muted dark:text-night-muted mt-0.5">18:40</div>
                                                </td>
                                                <td className="py-3.5 px-4 whitespace-nowrap">
                                                    <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-paper dark:bg-night-surface border border-paper-border dark:border-night-border font-bold text-xs">
                                                        <i className="ph-bold ph-qr-code text-wine"></i>
                                                        <span>VNPay QR</span>
                                                    </div>
                                                </td>
                                                <td className="py-3.5 px-4 whitespace-nowrap text-right">
                                                    <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">+ 220 🥔</span>
                                                    <span className="block text-[10px] text-ink-muted dark:text-night-muted mt-0.5">+200.000đ</span>
                                                </td>
                                                <td className="py-3.5 px-4 whitespace-nowrap text-center">
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 font-bold text-[10px]">
                                                        <i className="ph-bold ph-check"></i> Thành Công
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-4 whitespace-nowrap text-center">
                                                    <button type="button" onClick={(event) => { window.openReceiptModal('TX-HLM78233', 'Gói Nạp 200 Khoai Tây (+20 Khoai Thưởng)', 'Nạp tiền vào Ví Khoai Tây', '+ 220 🥔 (200.000đ)', 'VNPay QR', '12/10/2026 18:40', 'Thành Công') }} className="px-2.5 py-1 rounded-lg hover:bg-paper-200 dark:hover:bg-night-surface text-wine dark:text-gold font-bold hover:underline transition-colors cursor-pointer text-xs">
                                                        Xem Biên Lai
                                                    </button>
                                                </td>
                                            </tr>
        
                                            {/* Giao Dịch 4: Gói Hội Viên */}
                                            <tr className="tx-row hover:bg-paper-100/50 dark:hover:bg-white/[0.02] transition-colors" data-type="membership" data-status="active" data-time="1month 6months 1year" data-search="TX-HLM69410 Gói Hội Viên Thợ Cày Đọc Sách Visa">
                                                <td className="py-3.5 px-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-wine/10 dark:bg-gold/15 text-wine dark:text-gold flex items-center justify-center text-xl shrink-0 border border-wine/25 dark:border-gold/30">
                                                            <i className="ph-bold ph-crown"></i>
                                                        </div>
                                                        <div className="min-w-0">
                                                            <h4 className="font-bold text-ink dark:text-night-text truncate hover:text-wine dark:hover:text-gold transition-colors">Gói Hội Viên: THỢ CÀY 🌱</h4>
                                                            <p className="text-[11px] text-ink-muted dark:text-night-muted mt-0.5 truncate">Gói 3 Tháng • Đọc không giới hạn & Giảm 10%</p>
                                                            <span className="inline-flex items-center gap-1 text-[10px] text-wine dark:text-gold font-bold mt-1">
                                                                <i className="ph-bold ph-medal"></i> Hạng Hội Viên HALM
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3.5 px-4 whitespace-nowrap">
                                                    <div className="font-bold text-ink dark:text-night-text">05/10/2026</div>
                                                    <div className="text-[11px] text-ink-muted dark:text-night-muted mt-0.5">10:20</div>
                                                </td>
                                                <td className="py-3.5 px-4 whitespace-nowrap">
                                                    <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-paper dark:bg-night-surface border border-paper-border dark:border-night-border font-bold text-xs">
                                                        <i className="ph-bold ph-credit-card text-wine"></i>
                                                        <span>Visa •••• 8824</span>
                                                    </div>
                                                </td>
                                                <td className="py-3.5 px-4 whitespace-nowrap text-right">
                                                    <span className="font-black text-rose-600 dark:text-rose-400 text-sm">- 189.000đ</span>
                                                    <span className="block text-[10px] text-ink-muted dark:text-night-muted mt-0.5">Thời hạn 90 ngày</span>
                                                </td>
                                                <td className="py-3.5 px-4 whitespace-nowrap text-center">
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 font-bold text-[10px]">
                                                        <i className="ph-bold ph-check"></i> Đang Kích Hoạt
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-4 whitespace-nowrap text-center">
                                                    <button type="button" onClick={(event) => { window.openReceiptModal('TX-HLM69410', 'Gói Hội Viên Thợ Cày 🌱 (3 Tháng)', 'Kích hoạt hạng thành viên', '189.000đ', 'Visa •••• 8824', '05/10/2026 10:20', 'Thành Công') }} className="px-2.5 py-1 rounded-lg hover:bg-paper-200 dark:hover:bg-night-surface text-wine dark:text-gold font-bold hover:underline transition-colors cursor-pointer text-xs">
                                                        Xem Biên Lai
                                                    </button>
                                                </td>
                                            </tr>
        
        
                                            {/* Giao Dịch 6: Thuê Sách Hoàn Tất */}
                                            <tr className="tx-row hover:bg-paper-100/50 dark:hover:bg-white/[0.02] transition-colors" data-type="rental" data-status="returned" data-time="6months 1year" data-search="TX-HLM49201 Muôn Kiếp Nhân Sinh Nguyên Phong">
                                                <td className="py-3.5 px-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-14 rounded-lg bg-paper dark:bg-night-surface overflow-hidden border border-paper-border dark:border-night-border shrink-0 shadow-sm">
                                                            <img src="https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=200&auto=format&fit=crop" alt="Muôn Kiếp Nhân Sinh" className="w-full h-full object-cover" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <h4 className="font-bold text-ink dark:text-night-text truncate hover:text-wine dark:hover:text-gold transition-colors">Muôn Kiếp Nhân Sinh - Tập 1</h4>
                                                            <p className="text-[11px] text-ink-muted dark:text-night-muted mt-0.5 truncate">Thuê 7 ngày • Đã trả sách đúng hẹn</p>
                                                            <span className="inline-flex items-center gap-1 text-[10px] text-wine dark:text-gold font-bold mt-1">
                                                                <i className="ph-bold ph-book-open"></i> Triết Lý Sống
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3.5 px-4 whitespace-nowrap">
                                                    <div className="font-bold text-ink dark:text-night-text">15/09/2026</div>
                                                    <div className="text-[11px] text-ink-muted dark:text-night-muted mt-0.5">11:10</div>
                                                </td>
                                                <td className="py-3.5 px-4 whitespace-nowrap">
                                                    <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-paper dark:bg-night-surface border border-paper-border dark:border-night-border font-bold text-xs">
                                                        <i className="ph-bold ph-wallet text-gold"></i>
                                                        <span>Ví Khoai Tây</span>
                                                    </div>
                                                </td>
                                                <td className="py-3.5 px-4 whitespace-nowrap text-right">
                                                    <span className="font-black text-rose-600 dark:text-rose-400 text-sm">- 12 🥔</span>
                                                    <span className="block text-[10px] text-ink-muted dark:text-night-muted mt-0.5">~12.000đ</span>
                                                </td>
                                                <td className="py-3.5 px-4 whitespace-nowrap text-center">
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-paper-200 text-ink dark:bg-night-surface dark:text-[#EDE9DF] font-bold text-[10px]">
                                                        <i className="ph-bold ph-check-circle"></i> Đã Trả Sách
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-4 whitespace-nowrap text-center">
                                                    <button type="button" onClick={(event) => { window.openReceiptModal('TX-HLM49201', 'Muôn Kiếp Nhân Sinh - Tập 1', 'Thuê 7 ngày (Đã hoàn tất)', '12 🥔 (~12.000đ)', 'Ví Khoai Tây', '15/09/2026 11:10', 'Đã Trả Sách') }} className="px-2.5 py-1 rounded-lg hover:bg-paper-200 dark:hover:bg-night-surface text-wine dark:text-gold font-bold hover:underline transition-colors cursor-pointer text-xs">
                                                        Xem Biên Lai
                                                    </button>
                                                </td>
                                            </tr>
        
                                        </tbody>
                                    </table>
                                </div>
        
                                {/* Trạng thái không tìm thấy kết quả */}
                                <div id="tx-empty-state" className="hidden p-8 text-center space-y-3 font-metadata-spec">
                                    <div className="w-12 h-12 rounded-full bg-paper-200 dark:bg-night-surface text-ink-muted dark:text-night-muted flex items-center justify-center mx-auto text-2xl">
                                        <i className="ph-bold ph-magnifying-glass"></i>
                                    </div>
                                    <h4 className="font-bold text-sm text-ink dark:text-night-text">Không tìm thấy giao dịch phù hợp</h4>
                                    <p className="text-xs text-ink-muted dark:text-night-muted max-w-sm mx-auto">Vui lòng thử lại với từ khóa khác hoặc xóa bộ lọc để hiển thị toàn bộ giao dịch.</p>
                                    <button type="button" onClick={(event) => { window.resetTxFilter() }} className="mt-2 px-4 py-1.5 rounded-full bg-wine dark:bg-gold text-white dark:text-night-bg font-bold text-xs hover:opacity-90 transition-opacity">
                                        Xóa Bộ Lọc
                                    </button>
                                </div>
        
                                {/* 5. Phân Trang (Pagination) */}
                                <div className="p-4 border-t border-paper-border/60 dark:border-night-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-metadata-spec">
                                    <span className="text-ink-muted dark:text-night-muted" id="tx-pagination-info">Hiển thị 1 - 5 trong số 5 giao dịch</span>
                                    <div className="flex items-center gap-1.5">
                                        <button type="button" className="w-8 h-8 rounded-lg border border-paper-border dark:border-night-border flex items-center justify-center text-ink-muted hover:bg-paper dark:hover:bg-night-surface transition-colors disabled:opacity-40" disabled>
                                            <i className="ph-bold ph-caret-left"></i>
                                        </button>
                                        <button type="button" className="w-8 h-8 rounded-lg bg-wine text-white dark:bg-gold dark:text-night-bg font-bold flex items-center justify-center shadow-sm">1</button>
                                        <button type="button" className="w-8 h-8 rounded-lg border border-paper-border dark:border-night-border flex items-center justify-center text-ink-muted hover:bg-paper dark:hover:bg-night-surface transition-colors disabled:opacity-40" disabled>
                                            <i className="ph-bold ph-caret-right"></i>
                                        </button>
                                    </div>
                                </div>
        
                            </div>
        
                        </div>{/* End #tab-content-history */}
        
                    </div>
        
                </div>
            </main>
        
            {/* ========================================================
                 MODAL BIÊN LAI ĐIỆN TỬ (E-RECEIPT MODAL)
                 ======================================================== */}
            <div id="receipt-modal" className="fixed inset-0 z-50 hidden bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-paper-surface dark:bg-night-card rounded-2xl shadow-2xl border border-paper-border dark:border-night-border p-6 font-metadata-spec relative animate-fade-in space-y-4">
                    
                    {/* Modal Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-paper-border dark:border-night-border">
                        <div className="flex items-center gap-2.5">
                            <img src="img/icon-removebg-preview.png" alt="Logo" className="w-7 h-7 object-contain" onError={(event) => { event.currentTarget.src='./image/LOGO HALM BOOK/logo.png' }} />
                            <div>
                                <h4 className="font-display font-black text-sm text-wine dark:text-gold uppercase tracking-wider">HALM BOOK</h4>
                                <p className="text-[10px] text-ink-muted dark:text-night-muted">Biên lai giao dịch điện tử</p>
                            </div>
                        </div>
                        <button type="button" onClick={(event) => { window.closeReceiptModal() }} className="w-8 h-8 rounded-full hover:bg-paper-200 dark:hover:bg-night-surface flex items-center justify-center text-ink-muted transition-colors cursor-pointer">
                            <i className="ph-bold ph-x text-sm"></i>
                        </button>
                    </div>
        
                    {/* Receipt Content */}
                    <div className="space-y-3 py-1 text-xs">
                        <div className="p-3 rounded-xl bg-paper dark:bg-night-surface border border-paper-border dark:border-night-border space-y-1.5">
                            <div className="flex justify-between items-center text-[11px]">
                                <span className="text-ink-muted dark:text-night-muted">Mã Giao Dịch:</span>
                                <span className="font-bold font-mono text-ink dark:text-night-text" id="rc-code">#TX-HLM89214</span>
                            </div>
                            <div className="flex justify-between items-center text-[11px]">
                                <span className="text-ink-muted dark:text-night-muted">Thời Gian:</span>
                                <span className="font-semibold text-ink dark:text-night-text" id="rc-time">18/10/2026 14:30</span>
                            </div>
                            <div className="flex justify-between items-center text-[11px]">
                                <span className="text-ink-muted dark:text-night-muted">Tài Khoản:</span>
                                <span className="font-semibold text-ink dark:text-night-text">Alex Nguyễn (alexnguyen@halmbook.vn)</span>
                            </div>
                        </div>
        
                        {/* Dịch vụ & Số tiền */}
                        <div className="space-y-2 pt-1">
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className="font-bold text-ink dark:text-night-text text-sm block" id="rc-title">Tên dịch vụ</span>
                                    <span className="text-[11px] text-ink-muted dark:text-night-muted" id="rc-desc">Mô tả</span>
                                </div>
                                <span className="font-black text-sm text-wine dark:text-gold shrink-0 ml-3" id="rc-amount">- 15 🥔</span>
                            </div>
        
                            <div className="border-t border-paper-border/60 dark:border-night-border pt-2 flex justify-between items-center">
                                <span className="text-ink-muted dark:text-night-muted">Phương Thức:</span>
                                <span className="font-bold text-ink dark:text-night-text" id="rc-method">Ví Khoai Tây</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-ink-muted dark:text-night-muted">Trạng Thái:</span>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 font-bold text-[10px]" id="rc-status">Thành Công</span>
                            </div>
                        </div>
        
                        {/* Dấu mộc xác thực điện tử */}
                        <div className="pt-3 border-t border-paper-border/60 dark:border-night-border text-center">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-wine/10 dark:bg-gold/10 text-wine dark:text-gold border border-wine/20 dark:border-gold/30 text-[10px] font-bold">
                                <i className="ph-bold ph-seal-check"></i> ĐÃ XÁC THỰC BỞI HỆ THỐNG HALM BOOK
                            </div>
                        </div>
                    </div>
        
                    {/* Modal Footer */}
                    <div className="pt-3 border-t border-paper-border dark:border-night-border flex items-center justify-end gap-2.5">
                        <button type="button" onClick={(event) => { window.print() }} className="px-3.5 py-1.5 rounded-xl border border-paper-border dark:border-night-border hover:bg-paper dark:hover:bg-night-surface font-bold text-xs text-ink dark:text-night-text transition-colors flex items-center gap-1.5">
                            <i className="ph-bold ph-printer"></i> In Biên Lai
                        </button>
                        <button type="button" onClick={(event) => { window.closeReceiptModal() }} className="px-4 py-1.5 rounded-xl bg-wine hover:bg-wine-dark text-white font-bold text-xs transition-colors">
                            Đóng
                        </button>
                    </div>
        
                </div>
            </div>
        
        
            {/* ========================================================
                 FOOTER: LUXURY 5-COLUMN EDITORIAL FOOTER (ĐỒNG BỘ TRANG CHỦ)
                 ======================================================== */}
            <footer className="border-t border-paper-border dark:border-night-border bg-paper dark:bg-night-bg text-ink dark:text-night-text py-10 sm:py-12 transition-colors">
                <div className="w-full max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
                        
                        {/* Col 1 & 2: Brand Info */}
                        <div className="lg:col-span-2 space-y-3.5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-wine flex items-center justify-center text-white shadow-md">
                                    <img src="img/icon-removebg-preview.png" alt="Logo" className="w-7 h-7 object-contain" onError={(event) => { event.currentTarget.src='./image/LOGO HALM BOOK/logo.png' }} />
                                </div>
                                <span className="font-display font-black text-2xl tracking-tight text-ink dark:text-night-text">
                                    HALM BOOK
                                </span>
                            </div>
        
                            <p className="font-editorial-body text-sm text-ink-muted dark:text-night-muted leading-relaxed max-w-sm">
                                HALM BOOK - Không gian đọc sách trực tuyến dành cho những tâm trí ham khám phá. Nền tảng kết nối độc giả với tri thức và trợ lý AI thông minh.
                            </p>
        
                            <div className="space-y-1.5 text-xs font-metadata-spec text-ink dark:text-night-muted pt-1">
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
                        <div className="space-y-2.5">
                            <h4 className="font-display font-black text-xs uppercase tracking-wider text-ink dark:text-night-text">
                                Khám Phá
                            </h4>
                            <ul className="space-y-1.5 text-xs font-semibold text-ink-muted dark:text-night-muted font-metadata-spec">
                                <li><a href="home_end.html#trending-section" className="hover:text-wine dark:hover:text-gold transition-colors">Sách Thịnh Hành</a></li>
                                <li><a href="home_end.html#children-section" className="hover:text-wine dark:hover:text-gold transition-colors">Sách Thiếu Nhi</a></li>
                                <li><a href="home_end.html#literature-section" className="hover:text-wine dark:hover:text-gold transition-colors">Văn Học & Truyện Dài</a></li>
                                <li><a href="home_end.html#selfgrowth-section" className="hover:text-wine dark:hover:text-gold transition-colors">Phát Triển Bản Thân</a></li>
                                <li><a href="home_end.html#topic-section" className="hover:text-wine dark:hover:text-gold transition-colors">Chủ Đề Cảm Hứng</a></li>
                            </ul>
                        </div>
        
                        {/* Col 4: Dịch Vụ & Hỗ Trợ */}
                        <div className="space-y-2.5">
                            <h4 className="font-display font-black text-xs uppercase tracking-wider text-ink dark:text-night-text">
                                Dịch Vụ & Hỗ Trợ
                            </h4>
                            <ul className="space-y-1.5 text-xs font-semibold text-ink-muted dark:text-night-muted font-metadata-spec">
                                <li><a href="tiers_end.html" className="hover:text-wine dark:hover:text-gold transition-colors">Gói Hội Viên Đọc Sách</a></li>
                                <li><a href="book-detail.html" className="hover:text-wine dark:hover:text-gold transition-colors">Trải Nghiệm Đọc Thử</a></li>
                                <li><a href="cart_end.html" className="hover:text-wine dark:hover:text-gold transition-colors">Giỏ Hàng & Thuê Sách</a></li>
                                <li><a href="login.html" className="hover:text-wine dark:hover:text-gold transition-colors">Quản Lý Tài Khoản</a></li>
                                <li><a href="javascript:void(0)" onClick={(event) => { window.openChatbot('Hỗ trợ tài khoản'); }} className="hover:text-wine dark:hover:text-gold transition-colors">Trợ Giúp AI Trực Tuyến</a></li>
                            </ul>
                        </div>
        
                        {/* Col 5: Tải Ứng Dụng QR */}
                        <div className="space-y-2.5">
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
                    <div className="border-t border-paper-border dark:border-night-border mt-8 pt-5 flex flex-col sm:flex-row justify-between items-center text-xs font-metadata-spec text-ink-muted dark:text-night-muted gap-3">
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
                                <div className="font-metadata-spec text-[10px] text-gold font-medium">Hỗ trợ hồ sơ & tài khoản</div>
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
                        <div id="chat-welcome" className="text-center py-5 space-y-3">
                            <div className="w-12 h-12 mx-auto rounded-full bg-wine/20 border border-wine/40 p-1 flex items-center justify-center">
                                <img src="testhome/img/icon_chatbot.png" alt="Bot" className="w-full h-full rounded-full object-cover" />
                            </div>
                            <h4 className="font-display font-black text-sm text-white">Xin chào Alex Nguyễn!</h4>
                            <p className="font-editorial-body text-xs text-night-muted leading-relaxed">
                                Tôi là trợ lý AI của HALM BOOK. Bạn có thắc mắc gì về hồ sơ hoặc điểm thưởng Khoai không?
                            </p>
        
                            {/* Suggestions buttons */}
                            <div className="space-y-2 pt-1 text-left font-metadata-spec">
                                <button className="suggestion-btn w-full p-2.5 rounded-xl bg-night-card hover:bg-night-border border border-night-border text-xs text-white flex items-center justify-between transition-colors">
                                    <span>Cách nâng hạng hội viên từ Thợ Cày 🌱?</span>
                                    <i className="ph-bold ph-arrow-right text-gold"></i>
                                </button>
                                <button className="suggestion-btn w-full p-2.5 rounded-xl bg-night-card hover:bg-night-border border border-night-border text-xs text-white flex items-center justify-between transition-colors">
                                    <span>Làm sao để đổi thông tin số điện thoại?</span>
                                    <i className="ph-bold ph-arrow-right text-gold"></i>
                                </button>
                                <button className="suggestion-btn w-full p-2.5 rounded-xl bg-night-card hover:bg-night-border border border-night-border text-xs text-white flex items-center justify-between transition-colors">
                                    <span>Kiểm tra lịch sử chi tiêu Khoai?</span>
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
                 SCRIPTS: THEME TOGGLE, SCROLL TO TOP, CHATBOT
                 ======================================================== */}
            
            
            {/* Quản lý Chuyển Tab Hồ Sơ & Lịch Sử Giao Dịch */}
            
        
            {/* Master Header Controller & PotatoBot AI */}
      </div>
    </>
  );
}
